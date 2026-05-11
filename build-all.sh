#!/usr/bin/env bash
# =============================================================================
# build-all.sh  –  Build all Miroir packages and produce one or more artefacts.
#
# Usage:
#   ./build-all.sh [CORE_BUILD_MODE] [ARTEFACT...]
#
# CORE_BUILD_MODE:
#   build      Standard build - faster, but does not regenerate TypeScript types from Jzod schemas.
#   devbuild   Full devBuild (default) – regenerates TypeScript types from Jzod schemas
#              before building miroir-core. Required when schemas in
#              packages/miroir-test-app_deployment-miroir/assets are modified.
#
# ARTEFACT (one or more; default: server-binary):
#   server-binary   Self-contained server binary  (npm run build:release)
#   electron        Electron desktop application  (dist via electron-builder)
#   docker          Docker container image         (calls build_miroir.sh; optional tag argument)
#   vm              Virtual machine image          (not yet implemented)
#
# Examples:
#   ./build-all.sh                         # build → server binary
#   ./build-all.sh devbuild                # devBuild core → server binary
#   ./build-all.sh build electron          # explicit flags, build electron app
#   ./build-all.sh devbuild electron       # devBuild core → electron app
#   ./build-all.sh docker                  # build Docker image with default tag
#   ./build-all.sh docker mycustomtag      # build Docker image with custom tag
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------
CORE_BUILD_MODE="devBuild"
ARTEFACTS=()

for arg in "$@"; do
  case "$arg" in
    build|devbuild)
      CORE_BUILD_MODE="$arg"
      ;;
    electron|server-binary|docker|vm)
      ARTEFACTS+=("$arg")
      ;;
    -h|--help)
      sed -n '2,27p' "$0"   # print the header comment block
      exit 0
      ;;
    *)
      echo "ERROR: Unknown argument: '$arg'" >&2
      echo "Run '$0 --help' for usage." >&2
      exit 1
      ;;
  esac
done

# Default artefact
if [[ ${#ARTEFACTS[@]} -eq 0 ]]; then
  ARTEFACTS=("server-binary")
fi

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

step() {
  echo ""
  echo "========================================================================"
  echo "  STEP: $*"
  echo "========================================================================"
}

# Run several npm build commands in parallel; fail if any one fails.
# Usage: run_parallel "pkg1" "pkg2" ...
# Each argument is a workspace package name; 'npm run build -w <pkg>' is used.
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
# Optional: Build jzod and jzod-ts if present
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# Step 1 – Optional: Build jzod and jzod-ts if present
# ---------------------------------------------------------------------------
if [ -d "$SCRIPT_DIR/../../jzod" ]; then
  step "1/7 · jzod (optional)"
  (cd "$SCRIPT_DIR/../../jzod" && npm run build)
else
  echo "[SKIP] jzod directory not found, skipping jzod build."
fi

if [ -d "$SCRIPT_DIR/../../jzod-ts" ]; then
  step "2/7 · jzod-ts (optional)"
  (cd "$SCRIPT_DIR/../../jzod-ts" && npm run build)
else
  echo "[SKIP] jzod-ts directory not found, skipping jzod-ts build."
fi

# ---------------------------------------------------------------------------
# Step 3 – Deployment packages (schema definitions; no miroir-core dependency)
# ---------------------------------------------------------------------------
step "3/7 · miroir-test-app_deployment-miroir & miroir-test-app_deployment-admin"
run_parallel_builds \
  miroir-test-app_deployment-miroir \
  miroir-test-app_deployment-admin

# ---------------------------------------------------------------------------
# Step 4 – miroir-core (optionally with type generation)
# ---------------------------------------------------------------------------
step "4/7 · miroir-core ($CORE_BUILD_MODE)"
if [[ "$CORE_BUILD_MODE" == "devbuild" ]]; then
  npm run devBuild -w miroir-core
else
  npm run build -w miroir-core
fi

# ---------------------------------------------------------------------------
# Step 5 – Local caches & store backends (all depend only on miroir-core)
# ---------------------------------------------------------------------------
step "5/7 · localcaches & stores"
run_parallel_builds \
  miroir-localcache \
  miroir-localcache-redux \
  miroir-localcache-zustand \
  miroir-store-filesystem \
  miroir-store-indexedDb \
  miroir-store-postgres \
  miroir-store-mongodb

# ---------------------------------------------------------------------------
# Step 6 – UI library and service packages
# ---------------------------------------------------------------------------
step "6/7 · miroir-react, miroir-mcp, miroir-diagram-class"
run_parallel_builds \
  miroir-react \
  miroir-mcp \
  miroir-diagram-class

# ---------------------------------------------------------------------------
# Step 7 – Application-level packages
# ---------------------------------------------------------------------------
step "7/7 · miroir-server, miroir-standalone-app, miroir-cli"
run_parallel_builds \
  miroir-server \
  miroir-standalone-app \
  miroir-cli

# ---------------------------------------------------------------------------
# Step 8 – Test/example deployment packages
# ---------------------------------------------------------------------------
step "8/7 · miroir-test-app_deployment-library & miroir-test-app_deployment-postgres"
run_parallel_builds \
  miroir-test-app_deployment-library \
  miroir-test-app_deployment-postgres

# ---------------------------------------------------------------------------
# Artefact-specific builds
# ---------------------------------------------------------------------------

for artefact in "${ARTEFACTS[@]}"; do
  case "$artefact" in

    electron)
      step "ARTEFACT · electron desktop application"
      npm run dist -w miroir-standalone-app-electron
      echo ""
      echo "Electron distributable → packages/miroir-standalone-app-electron/release/"
      ;;

    server-binary)
      step "ARTEFACT · server binary (npm run build:release)"
      npm run build:release -w miroir-server
      echo ""
      echo "Server binary built → packages/miroir-server/release/"
      ;;

    docker)
      step "ARTEFACT · Docker container image (build_miroir.sh)"
      # Check for optional tag argument after 'docker' in ARTEFACTS
      DOCKER_TAG_ARG=""
      NEXT_ARG=false
      for arg in "$@"; do
        if $NEXT_ARG; then
          DOCKER_TAG_ARG="$arg"
          break
        fi
        if [[ "$arg" == "docker" ]]; then
          NEXT_ARG=true
        fi
      done
      if [[ -n "$DOCKER_TAG_ARG" && "$DOCKER_TAG_ARG" != "docker" && "$DOCKER_TAG_ARG" != "server-binary" && "$DOCKER_TAG_ARG" != "electron" && "$DOCKER_TAG_ARG" != "vm" ]]; then
        "$SCRIPT_DIR/ci/docker/build_miroir.sh" --tag "$DOCKER_TAG_ARG" "$SCRIPT_DIR/.."
      else
        "$SCRIPT_DIR/ci/docker/build_miroir.sh" "$SCRIPT_DIR/.."
      fi
      ;;

    vm)
      # TODO: build a virtual machine image.
      # Example tooling: HashiCorp Packer  →  packer build vm.pkr.hcl
      step "ARTEFACT · virtual machine image (not yet implemented)"
      echo "ERROR: 'vm' artefact is not yet implemented." >&2
      exit 1
      ;;

  esac
done

echo ""
echo "========================================================================"
echo "  ALL DONE  (core: $CORE_BUILD_MODE | artefacts: ${ARTEFACTS[*]})"
echo "========================================================================"
