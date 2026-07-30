#!/usr/bin/env python3
"""Product (pre-)release tagging CLI for Miroir (#223).

Examples:
  python scripts/release_tag.py --version 0.5.0-rc.2 --dry-run
  python scripts/release_tag.py --version 0.5.0-rc.2
  python scripts/release_tag.py --version 0.5.0-rc.2 --commit --tag
  python scripts/release_tag.py --version 0.5.0-rc.2 --commit --tag --push
"""

from __future__ import annotations

import argparse
import sys
from collections.abc import Callable, Sequence
from pathlib import Path
from typing import Any

# Allow `python scripts/release_tag.py` without PYTHONPATH
_SCRIPTS_DIR = Path(__file__).resolve().parent
if str(_SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(_SCRIPTS_DIR))

from release_tag_lib.git_ops import GitError, GitRepo
from release_tag_lib.plan import ReleasePlanError, apply_release_plan, build_release_plan

REPO_ROOT = _SCRIPTS_DIR.parent


def _parse_args(argv: Sequence[str] | None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Bump root + B+ package versions and optionally git-tag a product release.",
    )
    parser.add_argument(
        "--version",
        required=True,
        help="Product SemVer (no v prefix), e.g. 0.5.0 or 0.5.0-rc.2",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print the plan and exit without writing files or git operations",
    )
    parser.add_argument(
        "--commit",
        action="store_true",
        help="Create git commit 'chore: release <version>' for allow-listed package.json files",
    )
    parser.add_argument(
        "--tag",
        action="store_true",
        help="Create annotated git tag named exactly <version> (no v prefix)",
    )
    parser.add_argument(
        "--push",
        action="store_true",
        help="Push commit and tags (off by default; requires --commit and --tag)",
    )
    parser.add_argument(
        "--allow-dirty",
        action="store_true",
        help="Allow unrelated dirty files when committing/tagging",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Force-replace an existing local tag (dangerous; does not imply push)",
    )
    return parser.parse_args(argv)


def _print_plan(plan: Any, *, dry_run: bool) -> None:
    print(f"version: {plan.version}")
    print(f"prerelease: {'yes' if plan.is_prerelease else 'no'}")
    print(f"dry-run: {'yes' if dry_run else 'no'}")
    print("files:")
    for path in plan.files_to_bump:
        print(f"  - {path}")


def main(
    argv: Sequence[str] | None = None,
    *,
    repo_root: Path | None = None,
    git_runner: Callable[..., Any] | None = None,
) -> int:
    args = _parse_args(argv)
    root = (repo_root or REPO_ROOT).resolve()

    if args.push and not (args.commit and args.tag):
        print("error: --push requires --commit and --tag", file=sys.stderr)
        return 2

    try:
        plan = build_release_plan(root, args.version)
    except (ReleasePlanError, FileNotFoundError, ValueError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1

    _print_plan(plan, dry_run=args.dry_run)

    if args.dry_run:
        return 0

    apply_release_plan(plan)

    if args.commit or args.tag or args.push:
        git = GitRepo(root, runner=git_runner) if git_runner else GitRepo(root)
        try:
            if args.commit:
                git.commit_release(
                    plan.version,
                    plan.files_to_bump,
                    allow_dirty=args.allow_dirty,
                )
                print(f"committed: chore: release {plan.version}")
            if args.tag:
                # After commit, tree should be clean for tagged files; allow_dirty still honored
                git.create_annotated_tag(
                    plan.version,
                    force=args.force,
                    allow_dirty=args.allow_dirty,
                )
                print(f"tagged: {plan.version}")
            if args.push:
                git.push_commit_and_tags()
                print("pushed: commit + tags")
        except GitError as exc:
            print(f"error: {exc}", file=sys.stderr)
            return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
