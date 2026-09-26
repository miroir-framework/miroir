#!/usr/bin/env python3
"""Copy the repo's tracked agent skills from .agents/skills/ to .claude/skills/ (#301).

.agents/skills/ is canonical (read by Codex, Cursor, Copilot). Claude Code reads
.claude/skills/, so it gets byte-identical copies, tracked in git (no symlinks,
which break on Windows checkouts).

Tracked skills are the `miroir-*` directories plus the keys of skills-lock.json.
A .claude/skills copy that is committed (or `miroir-*`) but no longer tracked is
stale and removed. Other directories are personal installs and are left alone.

Examples:
  python scripts/sync_agent_skills.py           # write the copies
  python scripts/sync_agent_skills.py --check   # exit 1 if a copy is missing or differs
"""

from __future__ import annotations

import argparse
import filecmp
import json
import os
import shutil
import stat
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MIROIR_PREFIX = "miroir-"


def _source_dir(root: Path) -> Path:
    return root / ".agents" / "skills"


def _target_dir(root: Path) -> Path:
    return root / ".claude" / "skills"


def tracked_skill_names(root: Path) -> list[str]:
    lock_path = root / "skills-lock.json"
    locked = set(json.loads(lock_path.read_text(encoding="utf-8"))["skills"]) if lock_path.exists() else set()
    return sorted(
        p.name
        for p in _source_dir(root).iterdir()
        if p.is_dir() and (p.name.startswith(MIROIR_PREFIX) or p.name in locked)
    )


def _committed_copies(root: Path) -> set[str]:
    """Skill folders under .claude/skills/ known to git (empty outside a git repository)."""
    result = subprocess.run(
        ["git", "ls-files", "--", ".claude/skills"], cwd=root, capture_output=True, text=True
    )
    if result.returncode != 0:
        return set()
    return {Path(p).parts[2] for p in result.stdout.split() if len(Path(p).parts) > 3}


def _stale_copies(root: Path, tracked: list[str]) -> list[str]:
    target = _target_dir(root)
    if not target.is_dir():
        return []
    committed = _committed_copies(root)
    return sorted(
        p.name
        for p in target.iterdir()
        if p.is_dir()
        and p.name not in tracked
        and (p.name.startswith(MIROIR_PREFIX) or p.name in committed)
    )


def _trees_equal(a: Path, b: Path) -> bool:
    if not b.is_dir():
        return False
    cmp = filecmp.dircmp(a, b)
    if cmp.left_only or cmp.right_only or cmp.funny_files:
        return False
    _, mismatch, errors = filecmp.cmpfiles(a, b, cmp.common_files, shallow=False)
    if mismatch or errors:
        return False
    return all(_trees_equal(a / d, b / d) for d in cmp.common_dirs)


def check(root: Path) -> list[str]:
    """Names of tracked skills whose .claude copy is missing or differs, plus stale copies."""
    tracked = tracked_skill_names(root)
    drift = [n for n in tracked if not _trees_equal(_source_dir(root) / n, _target_dir(root) / n)]
    return sorted(drift + _stale_copies(root, tracked))


def _is_link(path: Path) -> bool:
    """Symlink, or Windows junction (a reparse point that is_symlink() does not report)."""
    if path.is_symlink():
        return True
    try:
        return bool(os.lstat(path).st_file_attributes & stat.FILE_ATTRIBUTE_REPARSE_POINT)
    except (AttributeError, OSError):
        return False


def _remove(path: Path) -> None:
    """Delete a copy; a link is removed itself, never the directory it points to."""
    if not _is_link(path):
        shutil.rmtree(path)
        return
    try:
        os.unlink(path)
    except OSError:
        os.rmdir(path)  # Windows directory symlink or junction: removes the link only


def sync(root: Path) -> None:
    tracked = tracked_skill_names(root)
    target = _target_dir(root)
    target.mkdir(parents=True, exist_ok=True)
    for name in _stale_copies(root, tracked):
        _remove(target / name)
    for name in tracked:
        dest = target / name
        if dest.exists() or _is_link(dest):
            _remove(dest)
        shutil.copytree(_source_dir(root) / name, dest)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--check", action="store_true", help="report drift instead of writing")
    parser.add_argument("--root", type=Path, default=ROOT, help=argparse.SUPPRESS)
    args = parser.parse_args(argv)

    if not args.check:
        sync(args.root)
        print(f"Synced {len(tracked_skill_names(args.root))} skills to .claude/skills/")
        return 0

    drift = check(args.root)
    if not drift:
        return 0
    print("Skill copies in .claude/skills/ are out of date: " + ", ".join(drift))
    print("Run: python scripts/sync_agent_skills.py")
    return 1


if __name__ == "__main__":
    sys.exit(main())
