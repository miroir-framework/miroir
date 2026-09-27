#!/usr/bin/env python3
"""Add the integrity hash that package-lock.json lacks for some registry packages (#326).

`npm ci` checks each tarball against the lockfile's `integrity`; without it, `npm ci` installs whatever the registry
serves. npm never adds a missing hash back, even on `npm install`, so this script asks the registry (`npm view`, with
the user's npm configuration) for the `resolved` tarball URL and `integrity` of each such entry and writes them where
npm puts them, right after `version`. Versions are not changed. The `lockfile` rule of check_dependency_policy.py
reports the entries this script fills.

Run: python scripts/fill_lockfile_integrity.py [--dry-run]

Plan: code-helpers/features/326-BUILD-build-hardening/tdd-implementation-plan.md
"""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Callable

from check_dependency_policy import ROOT, needs_integrity

# (tarball URL, integrity) of a package spec such as "zod@3.25.76".
Lookup = Callable[[str], tuple[str, str]]


def package_spec(key: str, entry: dict) -> str:
    """The registry spec of a lockfile entry: its `name` for an alias, else the last path segment of its key."""
    name = entry.get("name") or key.rpartition("node_modules/")[2]
    return f"{name}@{entry['version']}"


def npm_view(spec: str) -> tuple[str, str]:
    npm = shutil.which("npm") or "npm"
    result = subprocess.run(
        [npm, "view", spec, "dist.tarball", "dist.integrity", "--json"], capture_output=True, text=True, check=True
    )
    dist = json.loads(result.stdout)
    return dist["dist.tarball"], dist["dist.integrity"]


def _with_dist(entry: dict, resolved: str, integrity: str) -> dict:
    filled: dict = {}
    for field, value in entry.items():
        filled[field] = value
        if field == "version":
            filled["resolved"] = resolved
            filled["integrity"] = integrity
    return filled


def fill(lock: dict, lookup: Lookup, workers: int = 16) -> tuple[int, list[str]]:
    """Fill `lock` in place; returns how many entries were filled and the specs the registry could not answer."""
    packages = lock["packages"]
    keys = [key for key, entry in packages.items() if needs_integrity(key, entry)]
    specs = [package_spec(key, packages[key]) for key in keys]

    def ask(spec: str) -> tuple[str, str] | None:
        try:
            return lookup(spec)
        except (subprocess.CalledProcessError, KeyError, ValueError):
            return None

    with ThreadPoolExecutor(max_workers=workers) as pool:
        answers = list(pool.map(ask, specs))
    failed = [spec for spec, answer in zip(specs, answers) if answer is None]
    if failed:
        return 0, failed
    for key, (resolved, integrity) in zip(keys, answers):
        packages[key] = _with_dist(packages[key], resolved, integrity)
    return len(keys), []


def main(argv: list[str] | None = None, root: Path = ROOT, lookup: Lookup = npm_view) -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--dry-run", action="store_true", help="report what would be filled, write nothing")
    args = parser.parse_args(argv)

    path = root / "package-lock.json"
    lock = json.loads(path.read_text(encoding="utf-8"))
    filled, failed = fill(lock, lookup)
    if failed:
        print(f"The registry did not answer for {len(failed)} package(s), nothing written: {', '.join(failed[:10])}")
        return 1
    if not args.dry_run and filled:
        path.write_text(json.dumps(lock, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"{'Would fill' if args.dry_run else 'Filled'} the integrity of {filled} package(s) in {path.name}.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
