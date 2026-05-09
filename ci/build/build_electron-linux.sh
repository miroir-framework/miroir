#!/usr/bin/env bash
# =============================================================================
# build_electron-linux.sh  –  Build the Miroir Electron application for Linux.
#
# Usage:
#   ./build_electron-linux.sh [OPTIONS]
#
# OPTIONS:
#   --build-dir DIR   Root directory that contains the miroir workspace
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

[[ -d "${BUILD_DIR}" ]] || die "Directory not found: ${BUILD_DIR}"

echo ""
echo "========================================================================"
echo "  Miroir Electron Linux build"
echo "  BUILD_DIR : ${BUILD_DIR}"
echo "========================================================================"

cd "${BUILD_DIR}"

echo "[build_electron-linux.sh] Copying build artifacts to /tmp/miroir-build..."
rm -rf /tmp/miroir-build
mkdir -p /tmp/miroir-build
cp -r * /tmp/miroir-build/

cd /tmp/miroir-build

# ---------------------------------------------------------------------------
# Build
# ---------------------------------------------------------------------------
step "1/1 · miroir-standalone-app-electron (Linux dist)"
NODE_OPTIONS=--max-old-space-size=4096 npm run dist-linux -w miroir-standalone-app-electron

echo ""
echo "========================================================================"
echo "  ALL DONE"
echo "========================================================================"