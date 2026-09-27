"""#316 one-off: rename MiroirTest instances per rename-map.json.

For the selected kinds it rewrites, for each instance:
- the asset's `name`, root `definition.miroirTestLabel` (D11) and, when given, `description`;
- `miroirTest_<old>` identifiers → `miroirTest_<new, dots as underscores>` (D12);
- quoted occurrences of the old name ("old", 'old', `old`) and `--suites` tokens;
- nonreg manifest step ids and titles (D10).

Bare identifiers are never touched: several names are also TypeScript identifiers.
`--dry-run` lists the files and counts; `--report-bare` lists unquoted leftovers to review.

Usage (from the repo root):
  python code-helpers/features/316-REFACTOR-miroirtest-naming/rename_miroir_tests.py --kinds ui \
      [--descriptions descriptions.json] [--dry-run] [--report-bare]
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]
MIROIR_TEST_ENTITY_UUID = "a311f363-e238-4203-bdfc-29e8c160c26b"

# Files never rewritten by the text pass.
EXCLUDED_PARTS = ("node_modules", "/dist/", "preprocessor-generated", "code-helpers/", "docs-OLD/")
TEXT_SUFFIXES = (".ts", ".tsx", ".mts", ".js", ".json", ".md", ".py", ".sh", ".html")
TEXT_ROOTS = ("packages/", "scripts/", "docs/", ".agents/", ".github/", "AGENTS.md")


def export_identifier(name: str) -> str:
    return "miroirTest_" + name.replace(".", "_")


def instance_files() -> dict[str, Path]:
    by_uuid: dict[str, Path] = {}
    for path in REPO.glob(f"packages/*/assets/*/{MIROIR_TEST_ENTITY_UUID}/*.json"):
        by_uuid[json.loads(path.read_text(encoding="utf-8"))["uuid"]] = path
    return by_uuid


def text_files() -> list[Path]:
    listed = subprocess.run(
        ["git", "ls-files"], cwd=REPO, capture_output=True, text=True, check=True
    ).stdout.split("\n")
    files = []
    for rel in listed:
        if not rel or not rel.startswith(TEXT_ROOTS) or not rel.endswith(TEXT_SUFFIXES):
            continue
        if any(part in rel for part in EXCLUDED_PARTS):
            continue
        if f"/{MIROIR_TEST_ENTITY_UUID}/" in rel or rel.endswith("package-lock.json"):
            continue
        files.append(REPO / rel)
    return files


def json_string(value: str) -> str:
    return json.dumps(value, ensure_ascii=False)


def rewrite_instance(path: Path, entry: dict, description: str | None) -> None:
    text = path.read_text(encoding="utf-8")
    data = json.loads(text)
    old_label = data["definition"].get("miroirTestLabel")
    text = text.replace(f'"name": {json_string(entry["oldName"])}', f'"name": {json_string(entry["newName"])}', 1)
    if old_label is not None and old_label != entry["newName"]:
        # The root label is the first `miroirTestLabel` holding that value in the file.
        text = text.replace(
            f'"miroirTestLabel": {json_string(old_label)}',
            f'"miroirTestLabel": {json_string(entry["newName"])}',
            1,
        )
    if description is not None:
        text = text.replace(
            f'"description": {json_string(data["description"])}',
            f'"description": {json_string(description)}',
            1,
        )
    check = json.loads(text)
    assert check["name"] == entry["newName"], path
    assert check["definition"]["miroirTestLabel"] == entry["newName"], path
    if description is not None:
        assert check["description"] == description, path
    path.write_text(text, encoding="utf-8")


def rename_in_text(text: str, entries: list[dict], identifiers_only: set[str] = frozenset()) -> tuple[str, int]:
    count = 0
    by_old = {entry["oldName"]: entry["newName"] for entry in entries}
    alternation = "|".join(re.escape(old) for old in sorted(by_old, key=len, reverse=True))
    quotable = [old for old in by_old if old not in identifiers_only]
    quoted_alternation = "|".join(re.escape(old) for old in sorted(quotable, key=len, reverse=True)) or "(?!)"

    def identifier(match: re.Match) -> str:
        nonlocal count
        count += 1
        return export_identifier(by_old[match.group(1)])

    text = re.sub(rf"\bmiroirTest_({alternation})(?![A-Za-z0-9_])", identifier, text)

    def quoted(match: re.Match) -> str:
        nonlocal count
        count += 1
        return f"{match.group(1)}{by_old[match.group(2)]}{match.group(1)}"

    text = re.sub(rf"([\"'`])({quoted_alternation})\1", quoted, text)

    def suites(match: re.Match) -> str:
        tokens = match.group(2).split(",")
        renamed = [by_old.get(token, token) for token in tokens]
        nonlocal count
        count += sum(1 for a, b in zip(tokens, renamed) if a != b)
        return match.group(1) + ",".join(renamed)

    text = re.sub(r"(--suites[ =])([A-Za-z0-9_.,-]+)", suites, text)
    return text, count


def rename_nonreg_manifest(entries: list[dict]) -> int:
    """Text-level edit (the manifest's formatting is not json.dumps's)."""
    path = REPO / "scripts/nonreg-manifest.json"
    text = path.read_text(encoding="utf-8")
    manifest = json.loads(text)
    new_to_old = {entry["newName"]: entry["oldName"] for entry in entries}
    changed = 0
    for step in manifest["steps"]:
        argv = step.get("argv") or []
        if "--suites" not in argv:
            continue
        suites = argv[argv.index("--suites") + 1].split(",")
        if len(suites) != 1 or suites[0] not in new_to_old:
            continue  # bundles keep their id
        new = suites[0]
        new_id = f"integ-{new}"
        if step["id"] != new_id:
            text = text.replace(f'"id": {json.dumps(step["id"])}', f'"id": {json.dumps(new_id)}', 1)
            changed += 1
        new_title = step["title"].replace(new_to_old[new], new)
        if new_title != step["title"]:
            text = text.replace(f'"title": {json.dumps(step["title"])}', f'"title": {json.dumps(new_title)}', 1)
    json.loads(text)
    path.write_text(text, encoding="utf-8")
    return changed


def report_bare(entries: list[dict], files: list[Path]) -> None:
    for entry in entries:
        pattern = re.compile(rf"(?<![A-Za-z0-9_]){re.escape(entry['oldName'])}(?![A-Za-z0-9_])")
        for path in files:
            for number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
                if pattern.search(line):
                    print(f"{path.relative_to(REPO)}:{number}: {entry['oldName']}: {line.strip()[:140]}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--kinds", required=True, help="comma-separated kinds: fn,query,tr,action,runner,ui")
    parser.add_argument("--descriptions", help="JSON file: uuid -> new description")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--report-bare", action="store_true")
    parser.add_argument(
        "--quoted-in",
        default="",
        help="comma-separated repo-relative files where --identifiers-only names are still replaced when quoted",
    )
    parser.add_argument(
        "--identifiers-only",
        default="",
        help="comma-separated old names that collide with code names: only miroirTest_ identifiers are renamed",
    )
    args = parser.parse_args()

    kinds = set(args.kinds.split(","))
    entries = [e for e in json.loads((HERE / "rename-map.json").read_text()) if e["kind"] in kinds]
    descriptions = json.loads(Path(args.descriptions).read_text()) if args.descriptions else {}
    files = text_files()

    if args.report_bare:
        report_bare(entries, files)
        return 0

    touched = {}
    for path in files:
        original = path.read_text(encoding="utf-8")
        rel = str(path.relative_to(REPO))
        identifiers_only = set(filter(None, args.identifiers_only.split(",")))
        if rel in set(filter(None, args.quoted_in.split(","))):
            identifiers_only = set()
        renamed, count = rename_in_text(original, entries, identifiers_only)
        if count:
            touched[str(path.relative_to(REPO))] = count
            if not args.dry_run:
                path.write_text(renamed, encoding="utf-8")
    for rel, count in sorted(touched.items()):
        print(f"{count:4d} {rel}")
    print(f"{len(touched)} files, {sum(touched.values())} replacements")

    if args.dry_run:
        return 0
    by_uuid = instance_files()
    for entry in entries:
        rewrite_instance(by_uuid[entry["uuid"]], entry, descriptions.get(entry["uuid"]))
    print(f"{len(entries)} instances renamed, {rename_nonreg_manifest(entries)} nonreg step ids changed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
