#!/usr/bin/env python3
"""Layered Lerna release-tree producer for Miroir (#227).

Creates a reviewed release plan from Lerna change detection, versions the
selected runtime dependency closure (rewriting internal ``"*"`` ranges), builds
packages in P0…Pn order, packs tarballs, and validates each layer in a clean
consumer. Platform artefact assembly is #224 and consumes the handoff contract
emitted here.

Examples:
  python ci/release/release_version.py --bump patch --since 0.5.0-rc.1
  python ci/release/release_version.py --bump minor --since 0.5.0-rc.1 --apply --worktree
  python ci/release/release_version.py --bump patch --since 0.5.0-rc.1 --verify release-handoff.json
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

RELEASE_DIR = Path(__file__).resolve().parent
if str(RELEASE_DIR) not in sys.path:
    sys.path.insert(0, str(RELEASE_DIR))

from release_lib.common import ReleaseError
from release_lib.handoff import read_handoff, write_handoff_contract, write_release_plan
from release_lib.lerna_ops import apply_lerna_version, commit_tag_push
from release_lib.plan import build_plan
from release_lib.tarballs import build_pack_and_validate
from release_lib.worktree import (
    assert_clean,
    create_release_worktree,
    remove_release_worktree,
)

REPO_ROOT = RELEASE_DIR.parents[1]


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--bump", choices=("major", "minor", "patch"))
    parser.add_argument("--since")
    parser.add_argument("--force", action="append", default=[])
    parser.add_argument("--disable", action="append", default=[])
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Mutate a release worktree: version, build, pack, validate",
    )
    parser.add_argument(
        "--worktree",
        action="store_true",
        help="Create a disposable git worktree for --apply (recommended)",
    )
    parser.add_argument(
        "--keep-worktree",
        action="store_true",
        help="Do not delete the disposable worktree after a successful --apply",
    )
    parser.add_argument(
        "--skip-build",
        action="store_true",
        help="Skip layered build/pack/consumer validation (version + lockfile only)",
    )
    parser.add_argument("--commit", action="store_true")
    parser.add_argument("--tag", action="store_true")
    parser.add_argument("--push", action="store_true")
    parser.add_argument(
        "--allow-dirty",
        action="store_true",
        help="Allow applying in a dirty tree without creating a worktree",
    )
    parser.add_argument(
        "--verify",
        metavar="HANDOFF_JSON",
        help="Validate an existing #227→#224 handoff descriptor and exit",
    )
    return parser.parse_args(argv)


def verify_handoff(path: Path) -> None:
    data = read_handoff(path)
    required = (
        "productVersion",
        "releaseWorktree",
        "releasePlan",
        "tarballDir",
        "layers",
        "selected",
    )
    missing = [key for key in required if key not in data]
    if missing:
        raise ReleaseError("handoff missing keys: " + ", ".join(missing))
    worktree = Path(data["releaseWorktree"])
    if not worktree.is_dir():
        raise ReleaseError(f"handoff worktree missing: {worktree}")
    if not Path(data["releasePlan"]).is_file():
        raise ReleaseError(f"handoff release-plan missing: {data['releasePlan']}")
    tarball_dir = Path(data["tarballDir"])
    if not tarball_dir.is_dir():
        raise ReleaseError(f"handoff tarball dir missing: {tarball_dir}")
    print(json.dumps({"ok": True, "handoff": data}, indent=2))


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])
    try:
        if args.verify:
            verify_handoff(Path(args.verify))
            return 0
        if not args.bump:
            raise ReleaseError("--bump is required unless --verify is used")

        source_root = REPO_ROOT
        plan = build_plan(
            source_root,
            bump=args.bump,
            since=args.since,
            force=args.force,
            disable=args.disable,
        )
        print(json.dumps(plan.to_dict(), indent=2))
        if not args.apply:
            return 0

        worktree: Path | None = None
        apply_root = source_root
        try:
            if args.worktree:
                worktree = create_release_worktree(source_root)
                apply_root = worktree
                plan = build_plan(
                    apply_root,
                    bump=args.bump,
                    since=args.since,
                    force=args.force,
                    disable=args.disable,
                )
            else:
                assert_clean(source_root, allow_dirty=args.allow_dirty)

            apply_lerna_version(apply_root, plan)
            tarballs = []
            if not args.skip_build:
                tarballs = build_pack_and_validate(apply_root, plan)
            write_release_plan(
                apply_root,
                plan,
                tarballs=tarballs,
                worktree_path=apply_root,
            )
            handoff = write_handoff_contract(apply_root, plan, tarballs=tarballs)
            print(json.dumps({"handoff": str(handoff)}, indent=2))
            commit_tag_push(
                apply_root,
                plan,
                commit=args.commit,
                tag=args.tag,
                push=args.push,
            )
            if worktree and args.keep_worktree:
                print(json.dumps({"worktree": str(worktree)}, indent=2))
            return 0
        finally:
            if worktree is not None and not args.keep_worktree:
                remove_release_worktree(source_root, worktree)
    except (OSError, ReleaseError, ValueError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1
    except Exception as exc:  # noqa: BLE001 - surface subprocess failures cleanly
        import subprocess

        if isinstance(exc, subprocess.CalledProcessError):
            detail = exc.stderr or exc.stdout or str(exc)
            print(f"error: command failed: {detail}", file=sys.stderr)
            return 1
        raise


if __name__ == "__main__":
    raise SystemExit(main())
