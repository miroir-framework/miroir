#!/usr/bin/env python3
"""Exact-token renamer used by the #145 slices (not part of the product).

Replaces whole identifiers only: a token matches when it is not preceded or followed by [A-Za-z0-9_$].
Scans tracked files under the given path prefixes, skipping the excluded prefixes of the ML nomenclature guard,
and optionally `git mv`s files whose basename contains a renamed token.

Usage:
  python3 rename_tokens.py --map map.json [--paths packages/ docs/] [--skip file ...] [--dry-run]
  map.json: {"oldToken": "newToken", ...}
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
EXCLUDED_PREFIXES = ("package-lock.json", "code-helpers/", "docs-OLD/", "graphify-out/", "scripts/check_ml_nomenclature.py")
EXCLUDED_PARTS = ("node_modules", "dist")


def build_regex(mapping: dict[str, str]) -> re.Pattern[str]:
    alternatives = "|".join(re.escape(k) for k in sorted(mapping, key=len, reverse=True))
    return re.compile(rf"(?<![A-Za-z0-9_$])({alternatives})(?![A-Za-z0-9_$])")


def tracked(paths: list[str]) -> list[str]:
    out = subprocess.run(["git", "ls-files", *paths], cwd=ROOT, capture_output=True, text=True, check=True).stdout
    return [
        rel
        for rel in out.splitlines()
        if not rel.startswith(EXCLUDED_PREFIXES) and not any(p in EXCLUDED_PARTS for p in rel.split("/"))
    ]


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--map", required=True)
    p.add_argument("--paths", nargs="*", default=[])
    p.add_argument("--skip", nargs="*", default=[])
    p.add_argument("--dry-run", action="store_true")
    args = p.parse_args()
    mapping: dict[str, str] = json.loads(Path(args.map).read_text())
    rx = build_regex(mapping)
    counts: Counter[str] = Counter()
    changed = 0
    for rel in tracked(args.paths):
        if rel in args.skip:
            continue
        path = ROOT / rel
        try:
            text = path.read_text(encoding="utf-8")
        except (UnicodeDecodeError, FileNotFoundError, IsADirectoryError):
            continue

        def sub(m: re.Match[str]) -> str:
            counts[m.group(1)] += 1
            return mapping[m.group(1)]

        new = rx.sub(sub, text)
        if new != text:
            changed += 1
            if not args.dry_run:
                path.write_text(new, encoding="utf-8")
    print(f"{changed} file(s) changed, {sum(counts.values())} replacement(s)")
    for token, n in counts.most_common():
        print(f"  {n:6d}  {token} -> {mapping[token]}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
