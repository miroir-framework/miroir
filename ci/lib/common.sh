#!/usr/bin/env bash
# =============================================================================
# ci/lib/common.sh  —  Shared helper functions for Miroir CI scripts.
#
# Source this file near the top of each CI script:
#   source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../../ci/lib/common.sh"
#
# Provides:
#   step  MSG...   Print a prominent section banner.
#   die   MSG...   Print an error message and exit 1.
# =============================================================================

# Print a prominent step / section banner.
step() {
  echo ""
  echo "========================================================================"
  echo "  $*"
  echo "========================================================================"
}

# Print an error message and exit.
# $0 resolves to the calling script's path (not this file).
die() {
  echo "ERROR: $*" >&2
  echo "Run '$0 --help' for usage." >&2
  exit 1
}
