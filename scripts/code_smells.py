#!/usr/bin/env python3
"""Report code smells on what a branch adds, or on paths (#340).

The smell lens (eslint-rules/smell-lens.config.mjs) finds the syntax smells. This script adds four text
checks (commented-out code, a logger named after another file, a near-identical twin file, a prop passed on
through many files). With --diff it keeps the findings on code the branch changes: a finding spans the construct
it reports (a parameter list, a hook call, a catch block), so a line added or cut inside it counts, unless the
base version of the file already had it. Findings on lines moved from elsewhere, and findings the branch only
edits around, are counted apart. It prints the findings grouped by smell id, in the impact order of the
miroir-code-quality skill (.agents/skills/miroir-code-quality/), which holds the remedies.
It exits 0 whatever it finds: the findings are review prompts, not a gate. A path outside the
repository, or one that does not exist, is a usage error (exit 2).

Examples:
  python scripts/code_smells.py --diff                       # this branch and working tree vs origin/_integration
  python scripts/code_smells.py --diff origin/master
  python scripts/code_smells.py packages/miroir-core/src/3_controllers
  npm run smells -- --diff
"""

from __future__ import annotations

import argparse
import difflib
import json
import re
import subprocess
import sys
import tempfile
from collections import Counter, defaultdict
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LENS = "eslint-rules/smell-lens.config.mjs"
DEFAULT_BASE = "origin/_integration"
SOURCE_SUFFIXES = (".ts", ".tsx")
SKIPPED_DIRS = {"node_modules", "dist", "release", "tmp", "preprocessor-generated"}

# Checklist order of the skill: silent wrong behaviour first, then the cost of change, then readability.
SMELL_ORDER = [
    "swallowed-error",
    "action-result",
    "precedence-trap",
    "positional-mixup",
    "module-state",
    "hooks-order",
    "effect-derived-state",
    "state-from-props",
    "timing",
    "theme-bypass",
    "upward-import",
    "global-environment",
    "wiring",
    "component-io",
    "pub-sub",
    "service-read-in-render",
    "unstable-deps",
    "prop-drilling",
    "mocked-own-module",
    "duplicated-logic",
    "logger",
    "type-escape",
    "magic-value",
    "long-parameter-list",
    "boolean-flag",
    "deep-nesting",
    "dead-code",
]

# Rules whose message cannot carry a smell id. Custom messages (no-restricted-*) start with "[smell-id]".
RULE_SMELLS = {
    "no-mixed-operators": "precedence-trap",
    "react-hooks/rules-of-hooks": "hooks-order",
    "react-hooks/set-state-in-effect": "effect-derived-state",
    "react-hooks/exhaustive-deps": "unstable-deps",
    "miroir/layers": "upward-import",
    "@typescript-eslint/no-explicit-any": "type-escape",
    "lens/max-params": "long-parameter-list",
    "max-depth": "deep-nesting",
    "@typescript-eslint/no-unused-vars": "dead-code",
}

SMELL_ID = re.compile(r"\[([a-z][a-z-]+)\]")
HUNK = re.compile(r"^@@ -\d+(?:,(\d+))? \+(\d+)(?:,(\d+))? @@")
ANSI = re.compile(r"\x1b\[[0-9;]*m")
# diff_scope has git paint the lines that a diff moves (removed in one place, added in another) in blue.
MOVED_COLORS = ["-c", "color.diff.new=green", "-c", "color.diff.newMoved=blue"]
MOVED = "\x1b[34m"
LOGGER_NAME = re.compile(r"getLoggerName\(\s*[^,()]+,\s*[^,()]+,\s*\"([^\"]+)\"")
# A comment line that reads as code: it ends with code punctuation, holds an arrow, starts with a keyword, or is JSX.
CODE_COMMENT = re.compile(
    r"^(?:.*[;{}()\[\],]\s*|.*=>.*|(?:const|let|var|return|if|else|for|while|await|import|export|async|function|throw|try|catch|case|switch|break|log\.|console\.|this\.)\b.*|</?[A-Za-z][\w.]*.*)$"
)
PROSE_COMMENT = re.compile(r"^(?:TODO|FIXME|NOTE|HACK|XXX|eslint|@ts-|#)", re.IGNORECASE)
MIN_COMMENTED_RUN = 3
# A prop handed on as is: `name={name}` or `name={props.name}`.
FORWARDED_PROP = re.compile(r"\b([a-z]\w*)=\{(?:props\.)?\1\}")
# Props that a component hands to the element it wraps: not drilling.
WRAPPER_PROPS = {
    "checked", "children", "className", "color", "disabled", "error", "height", "id", "key", "label", "name",
    "onBlur", "onChange", "onClick", "onClose", "onFocus", "open", "placeholder", "readOnly", "ref", "size",
    "style", "sx", "theme", "title", "type", "value", "variant", "width",
}
MIN_DRILLED_FILES = 5
TWIN_RATIO = 0.9
MIN_TWIN_LINES = 20  # one-line constants files are alike by design


@dataclass(frozen=True)
class Finding:
    smell: str
    path: str  # repository-relative, with forward slashes
    line: int
    message: str
    lines: int = 1  # lines covered from `line`; 0 for a finding about the whole file


def smell_of(rule_id: str | None, message: str) -> str:
    """Smell id of an ESLint message: the bracketed id of a custom message, else the rule's smell."""
    if rule_id and rule_id.startswith("no-restricted-"):
        match = SMELL_ID.search(message)
        if match:
            return match.group(1)
    return RULE_SMELLS.get(rule_id or "", rule_id or "parse-error")


def parse_added_lines(diff_text: str) -> tuple[dict[str, set[int]], dict[str, set[int]], dict[str, set[int]]]:
    """Added lines per file, from `git diff -U0` output: (new lines, moved lines, cuts).

    A moved line is painted in the MOVED color (see diff_scope): the same diff removes it elsewhere.
    A cut n means lines were removed, and none added, between new lines n and n + 1.
    """
    new: dict[str, set[int]] = defaultdict(set)
    moved: dict[str, set[int]] = defaultdict(set)
    cuts: dict[str, set[int]] = defaultdict(set)
    current: str | None = None
    number = old_left = new_left = 0
    for raw in diff_text.splitlines():
        line = ANSI.sub("", raw)
        if old_left or new_left:  # inside a hunk: a line can start with "+++" or "---"
            if line.startswith("+"):
                if current:
                    (moved if raw.startswith(MOVED) else new)[current].add(number)
                number, new_left = number + 1, new_left - 1
                continue
            if line.startswith("-"):
                old_left -= 1
                continue
            if line.startswith("\\"):  # "\ No newline at end of file"
                continue
            old_left = new_left = 0
        if line.startswith("+++ "):
            target = line[4:].strip()
            current = target[2:] if target.startswith("b/") else None
            continue
        match = HUNK.match(line)
        if match:
            old_left, number, new_left = int(match.group(1) or "1"), int(match.group(2)), int(match.group(3) or "1")
            if new_left == 0 and current:
                cuts[current].add(number)
    return (
        {path: lines for path, lines in new.items() if lines},
        {path: lines for path, lines in moved.items() if lines},
        dict(cuts),
    )


def commented_out_code(text: str) -> list[tuple[int, int]]:
    """(first line, line count) of each block of at least MIN_COMMENTED_RUN line comments that read as code.

    Empty comment lines inside a block belong to it.
    """
    runs: list[tuple[int, int]] = []
    start = end = code_lines = 0
    for number, raw in enumerate(text.splitlines() + [""], start=1):
        stripped = raw.strip()
        body = stripped.lstrip("/").strip() if stripped.startswith("//") else None
        if body and not PROSE_COMMENT.match(body) and CODE_COMMENT.match(body):
            if code_lines == 0:
                start = number
            end, code_lines = number, code_lines + 1
            continue
        if body == "" and code_lines:
            continue
        if code_lines >= MIN_COMMENTED_RUN:
            runs.append((start, end - start + 1))
        code_lines = 0
    return runs


def logger_name_mismatches(path: str, text: str) -> list[tuple[int, str]]:
    """(line, name) of each logger whose name is not the file name.

    Log presets select loggers by exact name, so a copied name makes a preset entry match the wrong file, or none.
    """
    allowed = {Path(path).stem, Path(path).name}
    return [
        (text.count("\n", 0, match.start()) + 1, match.group(1))
        for match in LOGGER_NAME.finditer(text)
        if match.group(1) not in allowed
    ]


@lru_cache(maxsize=None)
def _sources_by_name(root: Path) -> dict[str, tuple[str, ...]]:
    """Source files under packages/*/src, by file name."""
    index: dict[str, list[str]] = defaultdict(list)
    for candidate in (root / "packages").glob("*/src/**/*"):
        relative = candidate.relative_to(root)
        if _is_source(relative) and candidate.is_file():
            index[candidate.name].append(relative.as_posix())
    return {name: tuple(sorted(paths)) for name, paths in index.items()}


def twins(path: str, root: Path) -> list[tuple[str, float]]:
    """Files of other packages with the same name and nearly the same lines."""
    package = Path(path).parts[:2]
    mine = (root / path).read_text(encoding="utf-8", errors="replace").splitlines()
    if sum(1 for line in mine if line.strip()) < MIN_TWIN_LINES:
        return []
    found = []
    for other in _sources_by_name(root).get(Path(path).name, ()):
        if Path(other).parts[:2] == package:
            continue
        theirs = (root / other).read_text(encoding="utf-8", errors="replace").splitlines()
        matcher = difflib.SequenceMatcher(None, mine, theirs, autojunk=False)
        if matcher.real_quick_ratio() >= TWIN_RATIO and matcher.quick_ratio() >= TWIN_RATIO and matcher.ratio() >= TWIN_RATIO:
            found.append((other, matcher.ratio()))
    return found


@lru_cache(maxsize=None)
def _forwarding_files(root: Path) -> dict[str, frozenset[str]]:
    """Files of packages/*/src that pass each prop on as is, by prop name."""
    index: dict[str, set[str]] = defaultdict(set)
    for candidate in (root / "packages").glob("*/src/**/*.tsx"):
        relative = candidate.relative_to(root)
        if _is_source(relative) and ".test." not in candidate.name:
            for match in FORWARDED_PROP.finditer(candidate.read_text(encoding="utf-8", errors="replace")):
                index[match.group(1)].add(relative.as_posix())
    return {prop: frozenset(paths) for prop, paths in index.items()}


def drilled_props(path: str, text: str, root: Path) -> list[tuple[int, str, int]]:
    """(line, prop, files) of each prop passed on as is that MIN_DRILLED_FILES or more files pass on."""
    found = []
    for match in FORWARDED_PROP.finditer(text):
        prop = match.group(1)
        files = len(_forwarding_files(root).get(prop, frozenset()) | {path})
        if prop not in WRAPPER_PROPS and files >= MIN_DRILLED_FILES:
            found.append((text.count("\n", 0, match.start()) + 1, prop, files))
    return found


def text_findings(path: str, root: Path) -> list[Finding]:
    text = (root / path).read_text(encoding="utf-8", errors="replace")
    findings = [
        Finding("dead-code", path, line, f"{length} lines of commented-out code: delete them, git keeps the history.", length)
        for line, length in commented_out_code(text)
    ]
    findings += [
        Finding("logger", path, line, f'Logger named "{name}" in {Path(path).name}: name it after the file.')
        for line, name in logger_name_mismatches(path, text)
    ]
    if path.endswith(".tsx") and "/src/" in path and ".test." not in path:
        findings += [
            Finding("prop-drilling", path, line, f"`{prop}` is passed on as is in {files} files: provide it once in a context, read it with a hook.")
            for line, prop, files in drilled_props(path, text, root)
        ]
    found = twins(path, root)
    if found:
        listed = ", ".join(f"{other} ({ratio:.0%})" for other, ratio in found)
        findings.append(
            Finding("duplicated-logic", path, 1, f"Near-identical twin in another package: {listed}. Port this change to it, or share one module.", 0)
        )
    return findings


def eslint_findings(paths: list[str], root: Path) -> list[Finding]:
    """Lens findings in `paths`, relative to `root`. ESLint and the lens come from this script's repository."""
    eslint = ROOT / "node_modules" / "eslint" / "bin" / "eslint.js"
    if not eslint.is_file():
        sys.exit("ESLint is not installed: run `npm ci` first.")
    findings: list[Finding] = []
    for start in range(0, len(paths), 200):  # stays under the Windows command-line limit
        chunk = paths[start : start + 200]
        result = subprocess.run(
            ["node", str(eslint), "-c", str(ROOT / LENS), "--format", "json", "--no-warn-ignored", *chunk],
            cwd=root,
            capture_output=True,
            text=True,
            encoding="utf-8",
        )
        try:
            report = json.loads(result.stdout)
        except json.JSONDecodeError:
            sys.exit(f"ESLint failed (exit {result.returncode}):\n{result.stderr or result.stdout}")
        for file in report:
            relative = Path(file["filePath"]).resolve().relative_to(root.resolve()).as_posix()
            findings += [eslint_finding(relative, message) for message in file["messages"]]
    return findings


def eslint_finding(path: str, message: dict) -> Finding:
    """A finding over the lines of the reported node: a whole parameter list or hook call for the lens rules."""
    line = message.get("line", 1)
    return Finding(
        smell_of(message.get("ruleId"), message["message"]),
        path,
        line,
        message["message"].split("\n")[0],
        max(1, message.get("endLine", line) - line + 1),
    )


def keep_added(
    findings: list[Finding], added: dict[str, set[int]], cuts: dict[str, set[int]] | None = None
) -> list[Finding]:
    """Findings whose lines hold an added line, or a cut between two of them.

    A finding spans the construct it judges (a parameter list, a hook call, a catch block), so a change
    anywhere inside it counts. A whole-file finding stays when its file has added lines.
    """
    kept = []
    for finding in findings:
        lines = added.get(finding.path, set())
        if finding.lines == 0:
            if lines:
                kept.append(finding)
            continue
        last = finding.line + finding.lines - 1
        inside_cut = any(finding.line <= cut < last for cut in (cuts or {}).get(finding.path, set()))
        if inside_cut or lines & set(range(finding.line, last + 1)):
            kept.append(finding)
    return kept


def base_counts(base: str, paths: list[str], root: Path) -> Counter[tuple[str, str, str]]:
    """Lens findings per (path, smell, message) in the `base` version of `paths`; a new file has none."""
    with tempfile.TemporaryDirectory() as mirror:
        present = []
        for path in paths:
            shown = subprocess.run(["git", "show", f"{base}:{path}"], cwd=root, capture_output=True)
            if shown.returncode == 0:
                (Path(mirror) / path).parent.mkdir(parents=True, exist_ok=True)
                (Path(mirror) / path).write_bytes(shown.stdout)
                present.append(path)
        findings = eslint_findings(present, Path(mirror)) if present else []
    return Counter((f.path, f.smell, f.message) for f in findings)


def already_there(
    candidates: list[Finding], findings: list[Finding], base: Counter[tuple[str, str, str]]
) -> list[Finding]:
    """The candidates whose file had as many findings with their smell and message before the change."""
    head = Counter((f.path, f.smell, f.message) for f in findings)
    return [f for f in candidates if head[(f.path, f.smell, f.message)] <= base[(f.path, f.smell, f.message)]]


def order_key(finding: Finding) -> tuple[int, str, int]:
    rank = SMELL_ORDER.index(finding.smell) if finding.smell in SMELL_ORDER else len(SMELL_ORDER)
    return (rank, finding.path, finding.line)


def render(findings: list[Finding], scope: str, limit: int, moved: int = 0, edited: int = 0) -> str:
    """Markdown report: a count per smell, then each smell's findings grouped by message."""
    moved_note = f"{moved} more on lines the change moves from elsewhere, not listed: that code is not new.\n" if moved else ""
    if edited:
        moved_note += f"{edited} more in code that had them before the change, not listed.\n"
    if not findings:
        return f"No smell found ({scope}).\n" + moved_note
    by_smell: dict[str, dict[str, list[Finding]]] = defaultdict(lambda: defaultdict(list))
    for finding in sorted(set(findings), key=order_key):
        # The id can sit mid-message (`Unexpected use of 'fetch'. [component-io] …`): one space stays.
        by_smell[finding.smell][" ".join(SMELL_ID.sub("", finding.message, count=1).split())].append(finding)
    counts = {smell: sum(len(items) for items in groups.values()) for smell, groups in by_smell.items()}
    files = {f.path for f in findings}
    out = [f"## Smells: {sum(counts.values())} findings in {len(files)} files ({scope})", ""]
    out += [moved_note] if moved_note else []
    out += ["| Smell | Findings |", "|---|---:|"] + [f"| {smell} | {count} |" for smell, count in counts.items()]
    for smell, groups in by_smell.items():
        out += ["", f"### {smell}"]
        shown = 0
        for message, items in groups.items():
            if shown == limit:
                break
            out += ["", message] + [f"- `{f.path}:{f.line}`" for f in items[: limit - shown]]
            shown += min(len(items), limit - shown)
        if counts[smell] > shown:
            out += ["", f"… {counts[smell] - shown} more (raise --limit)"]
    return "\n".join(out) + "\n"


def _git(root: Path, *args: str) -> str:
    return subprocess.run(["git", *args], cwd=root, capture_output=True, text=True, check=True).stdout


def merge_base(base: str, root: Path) -> str:
    return _git(root, "merge-base", base, "HEAD").strip()


def diff_scope(base: str, root: Path) -> tuple[dict[str, set[int]], dict[str, set[int]], dict[str, set[int]]]:
    """Lines added since the merge base with `base`: commits, working tree and untracked files.

    Returns (new lines, moved lines, cuts) as parse_added_lines; git finds the moved blocks, re-indented ones included.
    """
    diff = _git(
        root, *MOVED_COLORS, "diff", "-U0", "--color=always", "--color-moved=blocks",
        "--color-moved-ws=allow-indentation-change", "--no-ext-diff", merge_base(base, root), "--", "packages",
    )
    added, moved, cuts = parse_added_lines(diff)
    for path in _git(root, "ls-files", "--others", "--exclude-standard", "--", "packages").splitlines():
        if not _is_source(Path(path)):
            continue
        lines = (root / path).read_text(encoding="utf-8", errors="replace").count("\n") + 1
        added[path] = set(range(1, lines + 1))
    def sources(by_path: dict[str, set[int]]) -> dict[str, set[int]]:
        return {p: lines for p, lines in by_path.items() if _is_source(Path(p))}

    return sources(added), sources(moved), sources(cuts)


def _is_source(path: Path) -> bool:
    return path.suffix in SOURCE_SUFFIXES and not (SKIPPED_DIRS & set(path.parts)) and not path.name.endswith(".d.ts")


def expand(paths: list[str], root: Path) -> list[str]:
    files: set[str] = set()
    for given in paths:
        full = (root / given).resolve()
        candidates = [full] if full.is_file() else full.rglob("*")
        for candidate in candidates:
            relative = candidate.relative_to(root)
            if candidate.is_file() and _is_source(relative):
                files.add(relative.as_posix())
    return sorted(files)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("paths", nargs="*", help="files or folders to scan in full")
    parser.add_argument("--diff", nargs="?", const=DEFAULT_BASE, metavar="BASE", help=f"only lines added since BASE (default {DEFAULT_BASE})")
    parser.add_argument("--limit", type=int, default=25, help="findings listed per smell (default 25)")
    parser.add_argument("--root", type=Path, default=ROOT, help=argparse.SUPPRESS)
    args = parser.parse_args(argv)
    root = args.root.resolve()
    if bool(args.paths) == bool(args.diff):
        parser.error("give either --diff [BASE] or paths")

    moved: dict[str, set[int]] = {}
    if args.diff:
        added, moved, cuts = diff_scope(args.diff, root)
        files = sorted(set(added) | set(moved) | set(cuts))
        scope = f"code changed since {args.diff}"
    else:
        # A path that matches nothing would print "No smell found", which reads as a clean result.
        outside = [p for p in args.paths if not (root / p).resolve().is_relative_to(root)]
        if outside:
            parser.error(f"outside the repository: {', '.join(outside)}")
        missing = [p for p in args.paths if not (root / p).exists()]
        if missing:
            parser.error(f"no such file or folder: {', '.join(missing)}")
        files = expand(args.paths, root)
        scope = ", ".join(args.paths)
    lens = eslint_findings(files, root) if files else []
    findings = lens + [f for p in files for f in text_findings(p, root)]
    on_moved: set[Finding] = set()
    edited: list[Finding] = []
    if args.diff:
        kept = keep_added(findings, added, cuts)
        on_moved = set(keep_added(findings, moved)) - set(kept)
        # A construct the change edits inside, without adding its first line, may have had the smell already.
        inside = [f for f in set(kept) & set(lens) if f.line not in added.get(f.path, set())]
        if inside:
            base = base_counts(merge_base(args.diff, root), sorted({f.path for f in inside}), root)
            edited = already_there(inside, lens, base)
        findings = [f for f in kept if f not in edited]
    sys.stdout.write(render(findings, scope, args.limit, moved=len(on_moved), edited=len(edited)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
