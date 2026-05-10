#!/usr/bin/env bash
# =============================================================================
# install_server.sh  –  Install all Miroir package dependencies and set up
#                       npm links before building the server release bundle.
#
# Usage:
#   ./install_server.sh [OPTIONS]
#
# OPTIONS:
#   --build-dir DIR   Root directory that contains  jzod/, jzod-ts/, miroir/
#                     (default: current working directory)
#   -h, --help        Show this help message and exit
#
# Run this script once per environment setup, before build_server.sh.
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../lib/common.sh"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

usage() {
  sed -n '2,16p' "$0"
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
echo "  Miroir server — install dependencies"
echo "  BUILD_DIR : ${BUILD_DIR}"
echo "========================================================================"

# ---------------------------------------------------------------------------
# Step 1 – jzod
# ---------------------------------------------------------------------------
step "1/3 · jzod — npm install + link"
cd "${BUILD_DIR}/jzod"
rm -f package-lock.json
npm install
npm link

# ---------------------------------------------------------------------------
# Step 2 – jzod-ts (depends on jzod)
# ---------------------------------------------------------------------------
step "2/3 · jzod-ts — npm install + link"
cd "${BUILD_DIR}/jzod-ts"
npm link @miroir-framework/jzod
rm -f package-lock.json
npm install
npm link

# ---------------------------------------------------------------------------
# Step 3 – miroir workspace: link local jzod / jzod-ts
# ---------------------------------------------------------------------------
step "3/3 · miroir workspace — link local packages"
cd "${BUILD_DIR}/miroir"
npm link @miroir-framework/jzod
npm link @miroir-framework/jzod-ts

echo ""
echo "========================================================================"
echo "  ALL DONE  →  dependencies installed, local packages linked."
echo "========================================================================"
