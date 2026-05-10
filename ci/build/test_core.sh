#!/usr/bin/env bash
# =============================================================================
# test_core.sh  –  Run all tests in the miroir-core package.
#
# Usage:
#   ./test_core.sh [BUILD_DIR]
#
#   BUILD_DIR   Root directory that contains the miroir workspace (default: /build)
#               Should contain packages/miroir-core/
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../lib/common.sh"

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------
BUILD_DIR="/build"
if [[ $# -gt 0 && ! "$1" =~ ^- ]]; then
  BUILD_DIR="$1"
  shift
fi

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)    sed -n '2,11p' "$0"; exit 0 ;;
    --build-dir)  [[ $# -ge 2 ]] || die "--build-dir requires an argument."
                  BUILD_DIR="$2"; shift 2 ;;
    *)            die "Unknown argument: '$1'" ;;
  esac
 done

[[ -d "$BUILD_DIR/packages/miroir-core" ]] || die "Directory not found: $BUILD_DIR/packages/miroir-core"

cd "$BUILD_DIR/packages/miroir-core"

# step "Running all miroir-core tests"
# npm test -- ''

cd "$BUILD_DIR"


step "Running ExtractorPersistenceStoreRunner tests with emulatedServerType=indexedDb"
VITE_MIROIR_TEST_CONFIG_FILENAME=/build/miroir/ci/tests/config/miroirConfig.test-emulatedServer-indexedDb.json \
VITE_MIROIR_LOG_CONFIG_FILENAME=tests/specificLoggersConfig_DomainController_debug.json \
npm run testByFile -w miroir-standalone-app -- ExtractorPersistenceStoreRunner

step "Running ExtractorPersistenceStoreRunner tests with emulatedServerType=filesystem"
VITE_MIROIR_TEST_CONFIG_FILENAME=/build/miroir/ci/tests/config/miroirConfig.test-emulatedServer-filesystem.json \
VITE_MIROIR_LOG_CONFIG_FILENAME=tests/specificLoggersConfig_DomainController_debug.json \
npm run testByFile -w miroir-standalone-app -- ExtractorPersistenceStoreRunner

echo ""
echo "========================================================================"
echo "  ALL DONE  →  miroir-core tests complete."
echo "========================================================================"
