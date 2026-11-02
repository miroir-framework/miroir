#!/usr/bin/env python3
"""The out-of-workspace consumer test (#658), on its own.

Generates a project with @miroir-framework/create-app in a temporary folder outside the repository, installs it from
tarballs only, type-checks and builds it, starts its server on the filesystem store and checks that it serves its
client and Miroir's Entity list. `release_version.py --apply` runs the same test on its tarballs.

Examples:
  python ci/release/consumer_project.py --pack                       # packs the built workspace packages it needs
  python ci/release/consumer_project.py --tarballs release-tarballs  # the tarballs of a release_version.py --apply run
"""

from __future__ import annotations

import argparse
import sys
import tempfile
from pathlib import Path

RELEASE_DIR = Path(__file__).resolve().parent
if str(RELEASE_DIR) not in sys.path:
    sys.path.insert(0, str(RELEASE_DIR))

from release_lib.common import ReleaseError, log_step
from release_lib.consumer_project import missing_tarballs, pack_workspace, run_consumer_project, tarballs_from_manifest

REPO_ROOT = RELEASE_DIR.parents[1]


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    source = parser.add_mutually_exclusive_group(required=True)
    source.add_argument("--pack", action="store_true", help="npm pack the built workspace packages the project needs")
    source.add_argument("--tarballs", type=Path, help="a release-tarballs/ folder (with its manifest.json)")
    parser.add_argument("--keep", action="store_true", help="keep the generated project and print its folder")
    args = parser.parse_args(argv)
    try:
        if args.pack:
            tarballs = pack_workspace(REPO_ROOT, Path(tempfile.mkdtemp(prefix="miroir-consumer-tarballs-")))
        else:
            tarballs = tarballs_from_manifest(REPO_ROOT, args.tarballs.resolve())
            missing = missing_tarballs(REPO_ROOT, tarballs)
            if missing:
                raise ReleaseError(f"{args.tarballs} holds no tarball for: {', '.join(missing)}")
        run_consumer_project(tarballs, keep=args.keep)
    except ReleaseError as error:
        log_step(f"consumer test FAILED: {error}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
