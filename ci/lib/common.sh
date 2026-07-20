# Timing infrastructure for build scripts
STEP_LABELS=()
STEP_SECS=()

# Return current time in seconds since epoch
now_secs() {
  date +%s
}

# Record a timing entry
record_time() {
  local label="$1"
  local t0="$2"
  # Check t0 is a non-empty integer
  if ! [[ "$t0" =~ ^[0-9]+$ ]]; then
    echo "ERROR: record_time: t0 argument ('$t0') is not a valid integer timestamp" >&2
    exit 1
  fi
  local t1
  t1=$(now_secs)
  local secs=$((t1 - t0))
  STEP_LABELS+=("$label")
  STEP_SECS+=("$secs")
  printf "  [TIMING] %-54s %3dm %02ds\n" "$label" $((secs / 60)) $((secs % 60))
}

# Print timing summary
print_timing_summary() {
  local total=0
  echo ""
  echo "========================================================================"
  echo "  Build timing summary"
  echo "========================================================================"
  for i in "${!STEP_LABELS[@]}"; do
    local t="${STEP_SECS[$i]}"
    total=$((total + t))
    printf "  %-54s %3dm %02ds\n" "${STEP_LABELS[$i]}" $((t / 60)) $((t % 60))
  done
  echo "------------------------------------------------------------------------"
  printf "  %-54s %3dm %02ds\n" "TOTAL" $((total / 60)) $((total % 60))
  echo "========================================================================"
}
#!/usr/bin/env bash
# =============================================================================
# ci/lib/common.sh  —  Shared helper functions for Miroir CI scripts.
#
# Source this file near the top of each CI script:
#   source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../../ci/lib/common.sh"
#
# Provides:
#   step  MSG...                 Print a prominent section banner.
#   die   MSG...                 Print an error message and exit 1.
#   typecheck_package PKG        Run tsc --noEmit for one workspace package.
#   run_parallel_builds PKG…     Build several npm workspace packages in parallel.
#   run_parallel_typechecks PKG… Type-check several workspace packages in parallel.
#                                Must be called from the npm workspace root.
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

# Type-check one workspace package with tsc --noEmit.
# Must be called from the npm workspace root directory.
typecheck_package() {
  local pkg="$1"
  echo "  typecheck $pkg"
  npx tsc --noEmit -p "packages/$pkg"
}

# Wait for background jobs; exit 1 if any failed.
_wait_parallel_jobs() {
  local label="$1"
  shift
  local failed=0
  local pid
  for pid in "$@"; do
    wait "$pid" || failed=$((failed + 1))
  done
  if [[ $failed -gt 0 ]]; then
    echo "ERROR: $failed parallel ${label} job(s) failed." >&2
    exit 1
  fi
}

# Run several 'npm run build -w <pkg>' commands in parallel.
# Must be called from the npm workspace root directory.
# Exits with status 1 if any job fails.
run_parallel_builds() {
  local pids=()
  local pkg
  for pkg in "$@"; do
    npm run build -w "$pkg" &
    pids+=($!)
  done
  _wait_parallel_jobs "build" "${pids[@]}"
}

# Run several 'tsc --noEmit' type-checks in parallel.
# Must be called from the npm workspace root directory.
# Exits with status 1 if any job fails.
run_parallel_typechecks() {
  local pids=()
  local pkg
  for pkg in "$@"; do
    typecheck_package "$pkg" &
    pids+=($!)
  done
  _wait_parallel_jobs "typecheck" "${pids[@]}"
}
