#!/usr/bin/env python3
"""Fail if Jzod names remain where Miroir's meta-language must be named ML / MLS (#145).

Miroir's meta-language (ML) and its schemas (MLS) derive from the external Jzod project, but are Miroir's own.
Names that designate Miroir constructs use `Ml` / `MlSchema` / `Mls`; "Jzod" only names the external packages
`@miroir-framework/jzod` and `@miroir-framework/jzod-ts`, their exports, and the project in prose.

The scan covers tracked files (git ls-files) minus EXCLUDED_PREFIXES. A hit is reported only inside an enforced
rule of ENFORCED_RULES; without --strict the script also prints the inventory of all remaining hits.

Run: python scripts/check_ml_nomenclature.py [--inventory] [--self-test]
Plan: code-helpers/features/145-REFACTOR-ml-nomenclature/tdd-implementation-plan.md
"""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from collections import Counter
from dataclasses import dataclass, field
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

TOKEN_RE = re.compile(r"[A-Za-z0-9_$]*jzod[A-Za-z0-9_$]*", re.IGNORECASE)

# Never scanned: lockfile, history, generated output, this script.
EXCLUDED_PREFIXES = (
    "package-lock.json",
    "code-helpers/",
    "docs-OLD/",
    "graphify-out/",
    "scripts/check_ml_nomenclature.py",
)
EXCLUDED_PARTS = ("node_modules", "dist")

# Files that drive the jzod-ts API with its own types (code generation).
ALLOWLIST_FILES = {
    "packages/miroir-core/scripts/generate-ts-types.ts",
    "packages/miroir-store-postgres/scripts/postgres-generate-ts-types.ts",
}

# Names exported by the external packages and used by Miroir.
EXTERNAL_EXPORTS = {
    "jzodToZodTextAndZodSchema",
    "valueToJzod",
    "jzodToTsCode",
    "jzodToZodTextAndTsTypeAliases",
    "jzodToZodTextAndZodSchemaForTsGeneration",
}

# Prose and build-orchestration files, where the bare words "Jzod" / "jzod" (the project, the sibling repo) are
# legitimate. Build scripts also name their optional sibling-repo stages.
PROSE_SUFFIXES = (".md", ".html", ".sh", ".yml", ".yaml", "Dockerfile")
PROJECT_WORDS = {"Jzod", "jzod", "JZOD", "STAGE_OPTIONAL_JZOD", "STAGE_OPTIONAL_JZOD_TS"}

PACKAGE_PREFIX = "@miroir-framework/"


@dataclass(frozen=True)
class Rule:
    """Hits in `paths` (prefixes, "" = whole repo) minus `exclude` fail the check.

    `token_re` restricts the rule to matching tokens; `line_re` restricts it to matching lines.
    """

    name: str
    paths: tuple[str, ...]
    exclude: tuple[str, ...] = ()
    token_re: re.Pattern[str] | None = None
    line_re: re.Pattern[str] | None = None

    def applies(self, rel: str, line: str, token: str) -> bool:
        if not any(rel.startswith(p) for p in self.paths):
            return False
        if any(rel.startswith(p) for p in self.exclude):
            return False
        if self.token_re is not None and not self.token_re.fullmatch(token):
            return False
        if self.line_re is not None and not self.line_re.search(line):
            return False
        return True


# Rules are enabled slice by slice (see the TDD plan); the last slice leaves a single repo-wide rule.
ENFORCED_RULES: list[Rule] = []


@dataclass
class Hit:
    rel: str
    line_no: int
    token: str
    line: str = field(repr=False)


def is_allowed(rel: str, line: str, start: int, token: str) -> bool:
    if rel in ALLOWLIST_FILES:
        return True
    if token in EXTERNAL_EXPORTS:
        return True
    # `@miroir-framework/jzod` and `@miroir-framework/jzod-ts`, in imports, deps and paths.
    if line[max(0, start - len(PACKAGE_PREFIX)) : start] == PACKAGE_PREFIX and token.lower() == "jzod":
        return True
    if rel.endswith(PROSE_SUFFIXES) and token in PROJECT_WORDS:
        return True
    return False


def hits_in_text(rel: str, text: str) -> list[Hit]:
    hits: list[Hit] = []
    for line_no, line in enumerate(text.splitlines(), 1):
        for m in TOKEN_RE.finditer(line):
            if not is_allowed(rel, line, m.start(), m.group(0)):
                hits.append(Hit(rel, line_no, m.group(0), line))
    return hits


def tracked_files() -> list[str]:
    out = subprocess.run(["git", "ls-files"], cwd=ROOT, capture_output=True, text=True, check=True).stdout
    files = []
    for rel in out.splitlines():
        if rel.startswith(EXCLUDED_PREFIXES):
            continue
        if any(part in EXCLUDED_PARTS for part in rel.split("/")):
            continue
        files.append(rel)
    return files


def scan() -> list[Hit]:
    hits: list[Hit] = []
    for rel in tracked_files():
        path = ROOT / rel
        try:
            text = path.read_text(encoding="utf-8")
        except (UnicodeDecodeError, FileNotFoundError, IsADirectoryError):
            continue
        hits.extend(hits_in_text(rel, text))
        # the file path itself (renames are part of the nomenclature)
        for m in TOKEN_RE.finditer(rel):
            if not is_allowed(rel, rel, m.start(), m.group(0)):
                hits.append(Hit(rel, 0, m.group(0), rel))
    return hits


def violations(hits: list[Hit], rules: list[Rule]) -> list[tuple[Rule, Hit]]:
    result = []
    for hit in hits:
        for rule in rules:
            if rule.applies(hit.rel, hit.line, hit.token):
                result.append((rule, hit))
                break
    return result


def print_inventory(hits: list[Hit]) -> None:
    by_area = Counter("/".join(h.rel.split("/")[:2]) if h.rel.startswith("packages/") else h.rel.split("/")[0] for h in hits)
    print(f"inventory: {len(hits)} remaining Jzod name(s) in {len({h.rel for h in hits})} file(s)")
    for area, count in by_area.most_common():
        print(f"  {count:6d}  {area}")


def self_test() -> int:
    samples = [
        ("packages/a/src/x.ts", 'import { valueToJzod } from "@miroir-framework/jzod";', []),
        ("packages/a/src/x.ts", 'import { a } from "@miroir-framework/jzod-ts";', []),
        ("packages/a/package.json", '"@miroir-framework/jzod": "0.8.5",', []),
        ("docs/x.md", "The ML derives from Jzod (see the jzod repo).", []),
        ("docs/x.md", "Use `JzodElement` here.", ["JzodElement"]),
        ("packages/a/src/x.ts", "const t: JzodElement = jzodTypeCheck(x);", ["JzodElement", "jzodTypeCheck"]),
        ("packages/a/src/x.ts", '// label "Jzod Schema"', ["Jzod"]),
        ("packages/miroir-core/scripts/generate-ts-types.ts", "JzodElement", []),
        ("build-all.sh", '(cd "$SCRIPT_DIR/../../jzod-ts" && npm run build)', []),
    ]
    failures = 0
    for rel, line, expected in samples:
        got = [h.token for h in hits_in_text(rel, line)]
        if got != expected:
            failures += 1
            print(f"self-test FAIL {rel}: {line!r} -> {got}, expected {expected}")
    rule = Rule("t", paths=("packages/a/",), exclude=("packages/a/ui/",), token_re=re.compile(r"jzodElement"))
    rule_cases = [
        (("packages/a/src/x.ts", "", "jzodElement"), True),
        (("packages/a/src/x.ts", "", "jzodObject"), False),
        (("packages/a/ui/x.ts", "", "jzodElement"), False),
        (("packages/b/src/x.ts", "", "jzodElement"), False),
    ]
    for args, expected in rule_cases:
        if rule.applies(*args) != expected:
            failures += 1
            print(f"self-test FAIL rule.applies{args} != {expected}")
    print("check_ml_nomenclature self-test:", "OK" if failures == 0 else f"{failures} failure(s)")
    return 0 if failures == 0 else 1


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--self-test", action="store_true", help="check the matcher on inline samples")
    p.add_argument("--inventory", action="store_true", help="also print remaining hits per area")
    args = p.parse_args(argv)
    if args.self_test:
        return self_test()

    hits = scan()
    found = violations(hits, ENFORCED_RULES)
    if args.inventory:
        print_inventory(hits)
    if not found:
        print(f"check_ml_nomenclature: OK ({len(ENFORCED_RULES)} enforced rule(s), {len(hits)} name(s) outside them)")
        return 0
    print(f"check_ml_nomenclature: {len(found)} Jzod name(s) where ML / MLS is required:\n")
    for rule, hit in found[:200]:
        where = f"{hit.rel}:{hit.line_no}" if hit.line_no else f"{hit.rel} (path)"
        print(f"  [{rule.name}] {where}: {hit.token}")
    if len(found) > 200:
        print(f"  … and {len(found) - 200} more")
    print("\nRename per code-helpers/features/145-REFACTOR-ml-nomenclature/analysis.md § Naming rule.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
