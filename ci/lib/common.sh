#!/usr/bin/env bash
# =============================================================================
# ci/lib/common.sh  —  Shared helper functions for Miroir CI scripts.
#
# Source this file near the top of each CI script:
#   source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../../ci/lib/common.sh"
#
# Provides:
#   step  MSG...               Print a prominent section banner.
#   die   MSG...               Print an error message and exit 1.
#   run_parallel_builds PKG…   Build several npm workspace packages in parallel.
#                              Must be called from the npm workspace root.
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

# Run several 'npm run build -w <pkg>' commands in parallel.
# Must be called from the npm workspace root directory.
# Exits with status 1 if any job fails.
run_parallel_builds() {
  local pids=()
  for pkg in "$@"; do
    npm run build -w "$pkg" &
    pids+=($!)
  done
  local failed=0
  for pid in "${pids[@]}"; do
    wait "$pid" || failed=$((failed + 1))
  done
  if [[ $failed -gt 0 ]]; then
    echo "ERROR: $failed parallel build job(s) failed." >&2
    exit 1
  fi
}
