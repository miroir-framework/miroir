#!/usr/bin/env bash
# =============================================================================
# build_server.sh  –  Build all Miroir packages inside a CI/Docker build
#                     environment and produce the miroir-server release bundle.
#
# Usage:
#   ./build_server.sh [OPTIONS]
#
# OPTIONS:
#   --build-dir DIR   Root directory that contains  jzod/, jzod-ts/, miroir/
#                     (default: /build)
#   -h, --help        Show this help message and exit
#
# The script builds packages in strict dependency order:
#   1. jzod  →  jzod-ts  (peer libraries, linked locally)
#   2. miroir-test-app_deployment-*  (schema definitions)
#   3. miroir-core  (with devBuild — regenerates TS types from Jzod schemas)
#   4. localcache + store packages  (parallel)
#   5. model-bundle extraction
#   6. UI / MCP / diagram packages  (parallel)
#   7. miroir-server  (release bundle)
# =============================================================================
set -euo pipefail

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

usage() {
  sed -n '2,24p' "$0"
  exit 0
}

step() {
  echo ""
  echo "========================================================================"
  echo "  STEP: $*"
  echo "========================================================================"
}

die() {
  echo "ERROR: $*" >&2
  echo "Run '$0 --help' for usage." >&2
  exit 1
}

# Run several 'npm run build -w <pkg>' commands in parallel; fail if any fail.
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

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------
BUILD_DIR="/build"

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)         usage ;;
    --build-dir)       [[ $# -ge 2 ]] || die "--build-dir requires an argument."
                       BUILD_DIR="$2"; shift 2 ;;
    *)                 die "Unknown argument: '$1'" ;;
  esac
done

[[ -d "${BUILD_DIR}/jzod"     ]] || die "Directory not found: ${BUILD_DIR}/jzod"
[[ -d "${BUILD_DIR}/jzod-ts"  ]] || die "Directory not found: ${BUILD_DIR}/jzod-ts"
[[ -d "${BUILD_DIR}/miroir"   ]] || die "Directory not found: ${BUILD_DIR}/miroir"

echo ""
echo "========================================================================"
echo "  Miroir server build"
echo "  BUILD_DIR : ${BUILD_DIR}"
echo "========================================================================"

# ---------------------------------------------------------------------------
# Step 1 – jzod (peer library)
# ---------------------------------------------------------------------------
step "1/7 · jzod"
cd "${BUILD_DIR}/jzod"
rm -f package-lock.json
npm install
npm link
npm run build

# ---------------------------------------------------------------------------
# Step 2 – jzod-ts (depends on jzod)
# ---------------------------------------------------------------------------
step "2/7 · jzod-ts"
cd "${BUILD_DIR}/jzod-ts"
npm link @miroir-framework/jzod
rm -f package-lock.json
npm install
npm link
npm run build

# ---------------------------------------------------------------------------
# Step 3 – miroir workspace setup: link local jzod / jzod-ts
# ---------------------------------------------------------------------------
step "3/7 · miroir workspace — link local packages"
cd "${BUILD_DIR}/miroir"
npm link @miroir-framework/jzod
npm link @miroir-framework/jzod-ts

# ---------------------------------------------------------------------------
# Step 4 – Deployment packages + miroir-core
# ---------------------------------------------------------------------------
step "4/7 · deployment metadata packages"
# These define core types as Jzod schemas; no miroir-core dependency.
run_parallel_builds \
  miroir-test-app_deployment-miroir \
  miroir-test-app_deployment-admin \
  miroir-test-app_deployment-library \
  miroir-test-app_deployment-postgres \
  miroir-test-app_deployment-designer

step "4b/7 · miroir-core (devBuild — regenerates TS types from Jzod schemas)"
npm run devBuild -w miroir-core

# ---------------------------------------------------------------------------
# Step 5 – Local-cache and store backends (all depend only on miroir-core)
# ---------------------------------------------------------------------------
step "5/7 · localcache + store packages"
run_parallel_builds \
  miroir-localcache-redux \
  miroir-store-filesystem \
  miroir-store-indexedDb \
  miroir-store-mongodb \
  miroir-store-postgres

# Extract model bundles from example applications.
npm run extract-library-model -w miroir-test-app_deployment-library
# npm run extract-postgresManager-model -w miroir-test-app_deployment-postgres

# ---------------------------------------------------------------------------
# Step 6 – UI / MCP / diagram packages
# ---------------------------------------------------------------------------
step "6/7 · miroir-react, miroir-mcp, miroir-diagram-class"
run_parallel_builds \
  miroir-react \
  miroir-mcp \
  miroir-diagram-class

# ---------------------------------------------------------------------------
# Step 7 – miroir-server release bundle
# ---------------------------------------------------------------------------
step "7/7 · miroir-server (release bundle)"
NODE_OPTIONS=--max-old-space-size=4096 npm run build:release -w miroir-server

echo ""
echo "========================================================================"
echo "  ALL DONE  →  release bundle: packages/miroir-server/release/"
echo "========================================================================"

