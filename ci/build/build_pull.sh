#!/usr/bin/env bash
# =============================================================================
# build_pull.sh  –  Pull the latest changes for all Miroir source repositories.
#
# Usage:
#   ./build_pull.sh [OPTIONS]
#
# OPTIONS:
#   --build-dir DIR   Root directory that contains  jzod/, jzod-ts/, miroir/
#                     (default: current working directory)
#   -h, --help        Show this help message and exit
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../lib/common.sh"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

usage() {
  sed -n '2,14p' "$0"
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
echo "  Miroir — git pull all repositories"
echo "  BUILD_DIR : ${BUILD_DIR}"
echo "========================================================================"

# ---------------------------------------------------------------------------
# Step 1 – jzod
# ---------------------------------------------------------------------------
step "1/3 · jzod"
cd "${BUILD_DIR}/jzod"
git pull

# ---------------------------------------------------------------------------
# Step 2 – jzod-ts
# ---------------------------------------------------------------------------
step "2/3 · jzod-ts"
cd "${BUILD_DIR}/jzod-ts"
git pull

# ---------------------------------------------------------------------------
# Step 3 – miroir
# ---------------------------------------------------------------------------
step "3/3 · miroir"
cd "${BUILD_DIR}/miroir"
git pull

echo ""
echo "========================================================================"
echo "  ALL DONE  →  all repositories up to date."
echo "========================================================================"
