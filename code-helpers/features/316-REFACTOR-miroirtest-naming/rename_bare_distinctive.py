"""#316 one-off, second pass: bare occurrences of distinctive old names (no identifier collision).

Run after rename_miroir_tests.py for the same kinds. Rewrites, in the text files it covers:
- old nonreg step ids → new ids (from the manifest at HEAD vs the working tree);
- in .ts/.tsx: `old:` object keys → `"new":`, `.old` property access → `["new"]`;
- every other bare occurrence → new name.
Usage: python rename_bare_distinctive.py --kinds action,runner [--names a,b] [--dry-run]
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys

from rename_miroir_tests import HERE, REPO, text_files


def step_id_map() -> dict[str, str]:
    head = json.loads(subprocess.run(["git", "show", "HEAD:scripts/nonreg-manifest.json"], cwd=REPO, capture_output=True, text=True, check=True).stdout)
    work = json.loads((REPO / "scripts/nonreg-manifest.json").read_text(encoding="utf-8"))
    return {a["id"]: b["id"] for a, b in zip(head["steps"], work["steps"]) if a["id"] != b["id"]}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--kinds", required=True)
    parser.add_argument("--names", help="restrict to these old names")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    kinds = set(args.kinds.split(","))
    entries = [e for e in json.loads((HERE / "rename-map.json").read_text()) if e["kind"] in kinds]
    if args.names:
        entries = [e for e in entries if e["oldName"] in args.names.split(",")]
    ids = step_id_map()
    total = 0
    for path in text_files():
        text = path.read_text(encoding="utf-8")
        original = text
        for old_id, new_id in ids.items():
            text = re.sub(rf"(?<![A-Za-z0-9_.-]){re.escape(old_id)}(?![A-Za-z0-9_.-])", new_id, text)
        for entry in sorted(entries, key=lambda e: -len(e["oldName"])):
            old, new = re.escape(entry["oldName"]), entry["newName"]
            bounded = rf"(?<![A-Za-z0-9_]){old}(?![A-Za-z0-9_])"
            if path.suffix in (".ts", ".tsx"):
                text = re.sub(rf"(^|[\s{{,])({old}):", lambda m: f'{m.group(1)}"{new}":', text, flags=re.M)
                text = re.sub(rf"\.{old}(?![A-Za-z0-9_])", f'["{new}"]', text)
            text = re.sub(bounded, new, text)
        if text != original:
            total += 1
            print(path.relative_to(REPO))
            if not args.dry_run:
                path.write_text(text, encoding="utf-8")
    print(f"{total} files")
    return 0


if __name__ == "__main__":
    sys.exit(main())
