#!/usr/bin/env bash
# =============================================================================
# build-all.sh  –  Build all Miroir packages and produce one or more artefacts.
#
# Usage:
#   ./build-all.sh [CORE_BUILD_MODE] [ARTEFACT...]
#
# CORE_BUILD_MODE:
#   build      Standard build (default)
#   devbuild   Full devBuild – regenerates TypeScript types from Jzod schemas
#              before building miroir-core. Required when schemas in
#              packages/miroir-test-app_deployment-miroir/assets are modified.
#
# ARTEFACT (one or more; default: electron):
#   electron        Electron desktop application  (dist via electron-builder)
#   server-binary   Self-contained server binary  (not yet implemented)
#   docker          Docker container image         (not yet implemented)
#   vm              Virtual machine image          (not yet implemented)
#
# Examples:
#   ./build-all.sh                         # build → electron app
#   ./build-all.sh devbuild                # devBuild core → electron app
#   ./build-all.sh build electron          # explicit flags, same as default
#   ./build-all.sh devbuild electron       # devBuild core → electron app
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------
CORE_BUILD_MODE="build"
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
      sed -n '2,24p' "$0"   # print the header comment block
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
  ARTEFACTS=("electron")
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
# Step 1 – Deployment packages (schema definitions; no miroir-core dependency)
# ---------------------------------------------------------------------------
step "1/6 · miroir-test-app_deployment-miroir & miroir-test-app_deployment-admin"
run_parallel_builds \
  miroir-test-app_deployment-miroir \
  miroir-test-app_deployment-admin

# ---------------------------------------------------------------------------
# Step 2 – miroir-core (optionally with type generation)
# ---------------------------------------------------------------------------
step "2/6 · miroir-core ($CORE_BUILD_MODE)"
if [[ "$CORE_BUILD_MODE" == "devbuild" ]]; then
  npm run devBuild -w miroir-core
else
  npm run build -w miroir-core
fi

# ---------------------------------------------------------------------------
# Step 3 – Local caches & store backends (all depend only on miroir-core)
# ---------------------------------------------------------------------------
step "3/6 · localcaches & stores"
run_parallel_builds \
  miroir-localcache \
  miroir-localcache-redux \
  miroir-localcache-zustand \
  miroir-store-filesystem \
  miroir-store-indexedDb \
  miroir-store-postgres \
  miroir-store-mongodb

# ---------------------------------------------------------------------------
# Step 4 – UI library and service packages
# ---------------------------------------------------------------------------
step "4/6 · miroir-react, miroir-mcp, miroir-diagram-class"
run_parallel_builds \
  miroir-react \
  miroir-mcp \
  miroir-diagram-class

# ---------------------------------------------------------------------------
# Step 5 – Application-level packages
# ---------------------------------------------------------------------------
step "5/6 · miroir-server, miroir-standalone-app, miroir-cli"
run_parallel_builds \
  miroir-server \
  miroir-standalone-app \
  miroir-cli

# ---------------------------------------------------------------------------
# Step 6 – Test/example deployment packages
# ---------------------------------------------------------------------------
step "6/6 · miroir-test-app_deployment-library & miroir-test-app_deployment-postgres"
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
      # TODO: produce a self-contained server binary.
      # Candidates: pkg, nexe, esbuild single-file bundle, or Deno compile.
      # Build target: packages/miroir-server  (already built in step 5)
      step "ARTEFACT · server binary (not yet implemented)"
      echo "ERROR: 'server-binary' artefact is not yet implemented." >&2
      exit 1
      ;;

    docker)
      # TODO: build a Docker image.
      # Example command (add a Dockerfile to the repo root first):
      #   docker build -t miroir-server:latest -f Dockerfile .
      step "ARTEFACT · Docker container image (not yet implemented)"
      echo "ERROR: 'docker' artefact is not yet implemented." >&2
      exit 1
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
