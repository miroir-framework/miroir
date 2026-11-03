#!/usr/bin/env python3
"""Publish a validated release to npm, layer by layer (#664).

Reads the release-handoff.json written by `release_version.py --apply`. Without --yes every `npm publish` runs
with --dry-run, so nothing is published. The publish-npm workflow runs it with --yes --provenance; a maintainer
without CI runs it (or the release worktree's publish-commands.sh) after `npm login`.

  python ci/release/publish.py --handoff <worktree>/release-handoff.json            # dry run
  python ci/release/publish.py --handoff <worktree>/release-handoff.json --yes      # publishes
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
from release_lib.handoff import read_handoff
from release_lib.publish import publish_handoff


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--handoff", required=True, help="release-handoff.json of a validated release worktree")
    parser.add_argument("--yes", action="store_true", help="really publish (default: every publish is a dry run)")
    parser.add_argument("--provenance", action="store_true", help="sign provenance (CI with an OIDC token only)")
    parser.add_argument("--registry", help="registry URL (default: npm's configuration, npmjs.org)")
    args = parser.parse_args(argv)
    try:
        outcomes = publish_handoff(
            read_handoff(Path(args.handoff)), execute=args.yes, provenance=args.provenance, registry=args.registry
        )
    except (OSError, ReleaseError, ValueError) as error:
        print(f"error: {error}", file=sys.stderr)
        return 1
    print(json.dumps([{"package": o.package, "state": o.state} for o in outcomes], indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
