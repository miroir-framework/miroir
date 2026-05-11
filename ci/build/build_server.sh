#!/usr/bin/env bash
# =============================================================================
# build_server.sh  –  Build all Miroir packages and produce the miroir-server
#                     release bundle.
#
# Usage:
#   ./build_server.sh [OPTIONS]
#
# OPTIONS:
#   --build-dir DIR   Root directory that contains  jzod/, jzod-ts/, miroir/
#                     (default: current working directory)
#   -h, --help        Show this help message and exit
#
# Prerequisites:
#   Run install_server.sh first to set up npm dependencies and local links.
#
# The script builds packages in strict dependency order:
#   1. jzod  →  jzod-ts  (peer libraries, linked locally)
#   2. miroir-test-app_deployment-*  (schema definitions)          [parallel]
#   3. miroir-core  (with devBuild — regenerates TS types from Jzod schemas)
#   4. localcache + store packages                                  [parallel]
#   5. model-bundle extraction
#   6. UI / MCP / diagram packages                                  [parallel]
#   7. miroir-server  (release bundle)
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../lib/common.sh"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

usage() {
  sed -n '2,26p' "$0"
  exit 0
}



# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------
BUILD_DIR="$(pwd)"

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)    usage ;;
    --build-dir)  [[ $# -ge 2 ]] || die "--build-dir requires an argument."
                  BUILD_DIR="$2"; shift 2 ;;
    *)            die "Unknown argument: '$1'" ;;
  esac
done

[[ -d "${BUILD_DIR}/jzod"    ]] || die "Directory not found: ${BUILD_DIR}/jzod"
[[ -d "${BUILD_DIR}/jzod-ts" ]] || die "Directory not found: ${BUILD_DIR}/jzod-ts"
[[ -d "${BUILD_DIR}/miroir"  ]] || die "Directory not found: ${BUILD_DIR}/miroir"

echo ""
echo "========================================================================"
echo "  Miroir server build"
echo "  BUILD_DIR : ${BUILD_DIR}"
echo "========================================================================"

# ---------------------------------------------------------------------------
# Step 1 – jzod (peer library)
# ---------------------------------------------------------------------------
step "1/7 · jzod"
t0=$(now_secs)
cd "${BUILD_DIR}/jzod"
npm run build
record_time "1/7  jzod" "$t0"

# ---------------------------------------------------------------------------
# Step 2 – jzod-ts (depends on jzod)
# ---------------------------------------------------------------------------
step "2/7 · jzod-ts"
t0=$(now_secs)
cd "${BUILD_DIR}/jzod-ts"
npm run build
record_time "2/7  jzod-ts" "$t0"

cd "${BUILD_DIR}/miroir"

# ---------------------------------------------------------------------------
# Step 3 – Deployment packages
# ---------------------------------------------------------------------------
step "3/7 · deployment metadata packages"
t0=$(now_secs)
# These define core types as Jzod schemas; no miroir-core dependency.
run_parallel_builds \
  miroir-test-app_deployment-miroir \
  miroir-test-app_deployment-admin \
  miroir-test-app_deployment-library \
  miroir-test-app_deployment-postgres \
  miroir-test-app_deployment-designer
record_time "3/7  deployment packages" "$t0"

# ---------------------------------------------------------------------------
# Step 4 – miroir-core (devBuild regenerates TS types from Jzod schemas)
# ---------------------------------------------------------------------------
step "4/7 · miroir-core devBuild"
t0=$(now_secs)
npm run devBuild -w miroir-core
record_time "4/7  miroir-core devBuild" "$t0"


# ---------------------------------------------------------------------------
# Step 5 – Local-cache and store backends (all depend only on miroir-core)
# ---------------------------------------------------------------------------
step "5/7 · localcache + store packages"
t0=$(now_secs)
run_parallel_builds \
  miroir-localcache-redux \
  miroir-store-filesystem \
  miroir-store-indexedDb \
  miroir-store-mongodb \
  miroir-store-postgres
record_time "5/7  localcache + store packages" "$t0"

# Extract model bundles from example applications.
step "5b/7 model bundle extraction"
t0=$(now_secs)
npm run extract-library-model -w miroir-test-app_deployment-library
record_time "5b/7 model bundle extraction" "$t0"

# ---------------------------------------------------------------------------
# Step 6 – UI / MCP / diagram packages
# ---------------------------------------------------------------------------
step "6/7 · miroir-react, miroir-mcp, miroir-diagram-class"
t0=$(now_secs)
run_parallel_builds \
  miroir-react \
  miroir-mcp \
  miroir-diagram-class
record_time "6/7  miroir-react, miroir-mcp, miroir-diagram-class" "$t0"

# ---------------------------------------------------------------------------
# Step 7 – miroir-server release bundle
# ---------------------------------------------------------------------------
step "7/7 · miroir-server (release bundle)"
t0=$(now_secs)
NODE_OPTIONS=--max-old-space-size=4096 npm run build:release -w miroir-server
record_time "7/7  miroir-server release bundle" "$t0"

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
print_timing_summary

echo ""
echo "========================================================================"
echo "  ALL DONE  →  release bundle: packages/miroir-server/release/"
echo "========================================================================"

