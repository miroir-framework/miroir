#!/usr/bin/env python3
"""Report application asset files that a run changed (#321).

Asset folders hold application source (models, seed data, test fixtures). A run of the
platform or of the tests must not write into them: running state belongs in the environment
state directory. This guard lists what changed in those folders, according to git.

  check                       changes since HEAD (exit 1 when any)
  snapshot --output F         record the current changes (a developer's own edits) in F
  check --since F             only changes made after the snapshot F (since HEAD when F is absent)

Scope: packages/*/assets/**, packages/*/tests/assets/**, packages/*/tests/test_assets/**.
Files ignored by git are out of scope.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
import sys
from pathlib import Path

ASSET_PATHSPECS = [
    ":(glob)packages/*/assets/**",
    ":(glob)packages/*/tests/assets/**",
    ":(glob)packages/*/tests/test_assets/**",
]

DELETED = "<deleted>"


def _git(repo: Path, *args: str) -> str:
    return subprocess.run(
        ["git", *args], cwd=repo, check=True, capture_output=True, text=True
    ).stdout


def changed_asset_files(repo: Path) -> dict[str, str]:
    """Map each asset file that differs from HEAD (or is untracked) to a hash of its content."""
    output = _git(repo, "status", "--porcelain=v1", "-z", "--untracked-files=all", "--", *ASSET_PATHSPECS)
    entries = output.split("\0")
    paths: list[str] = []
    index = 0
    while index < len(entries):
        entry = entries[index]
        index += 1
        if not entry:
            continue
        status, path = entry[:2], entry[3:]
        if "R" in status or "C" in status:
            paths.append(entries[index])  # original path of a rename / copy
            index += 1
        paths.append(path)
    return {path: _content_hash(repo / path) for path in sorted(set(paths))}


def _content_hash(path: Path) -> str:
    if not path.is_file():
        return DELETED
    return hashlib.sha256(path.read_bytes()).hexdigest()


def changes_since(current: dict[str, str], snapshot: dict[str, str]) -> list[str]:
    return sorted(path for path in set(current) | set(snapshot) if current.get(path) != snapshot.get(path))


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--repo", type=Path, default=Path(__file__).resolve().parents[1])
    commands = parser.add_subparsers(dest="command", required=True)
    snapshot_parser = commands.add_parser("snapshot", help="record the current asset changes")
    snapshot_parser.add_argument("--output", type=Path, required=True)
    check_parser = commands.add_parser("check", help="fail when asset files changed")
    check_parser.add_argument("--since", type=Path, help="snapshot written before the run")
    check_parser.add_argument("--json", action="store_true", help="print the result as JSON")
    args = parser.parse_args(argv)

    current = changed_asset_files(args.repo)

    if args.command == "snapshot":
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(current, indent=2) + "\n", encoding="utf-8")
        print(f"tracked-assets snapshot: {len(current)} pre-existing change(s) recorded in {args.output}")
        return 0

    snapshot: dict[str, str] = {}
    if args.since and args.since.is_file():
        snapshot = json.loads(args.since.read_text(encoding="utf-8"))
    elif args.since:
        print(f"tracked-assets guard: no snapshot at {args.since}, checking changes since HEAD")
    changed = changes_since(current, snapshot)
    if args.json:
        print(json.dumps({"changed": changed}, indent=2))
    elif changed:
        print(f"tracked-assets guard: {len(changed)} asset file(s) changed by this run:")
        for path in changed:
            print(f"  {path}")
        print("Running state belongs in the environment state directory, not in packages/*/assets (#321).")
    else:
        print("tracked-assets guard: clean")
    return 1 if changed else 0


if __name__ == "__main__":
    sys.exit(main())
