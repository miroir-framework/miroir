#!/usr/bin/env bash
# =============================================================================
# build_server-docker.sh  –  Build the miroir-server Docker image.
#
# Usage:
#   ./build_server-docker.sh [OPTIONS] <miroir-workspace-path>
#
# ARGUMENTS:
#   <miroir-workspace-path>   Path to the pre-built miroir workspace on the
#                             host (the directory that directly contains
#                             packages/miroir-server/).  Used as the Docker
#                             build context.
#                             e.g. /home/ci/miroir-build/miroir
#
# OPTIONS:
#   -t, --tag TAG           Docker image tag  (default: miroir-framework/miroir:latest)
#   -f, --file FILE         Path to the Dockerfile
#                           (default: <repo-root>/docker/miroir-server/Dockerfile)
#   --no-cache              Pass --no-cache to docker build
#   -h, --help              Show this help message and exit
#
# Examples:
#   ./build_server-docker.sh /mnt/c/miroir-build/miroir
#   ./build_server-docker.sh --tag miroir-framework/miroir:1.2.3 /mnt/c/miroir-build/miroir
#   ./build_server-docker.sh --build-dir subdir --no-cache /mnt/c/miroir-build
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
source "${SCRIPT_DIR}/../lib/common.sh"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

usage() {
  sed -n '2,28p' "$0"
  exit 0
}

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------
TAG="miroir-framework/miroir:latest"
DOCKERFILE="${REPO_ROOT}/docker/miroir-server/Dockerfile"
NO_CACHE=""
DOCKER_BUILD_CONTEXT_PATH=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)    usage ;;
    -t|--tag)     [[ $# -ge 2 ]] || die "--tag requires an argument."
                  TAG="$2"; shift 2 ;;
    -f|--file)    [[ $# -ge 2 ]] || die "--file requires an argument."
                  DOCKERFILE="$2"; shift 2 ;;
    --no-cache)   NO_CACHE="--no-cache"; shift ;;
    -*)           die "Unknown option: '$1'" ;;
    *)            [[ -z "$DOCKER_BUILD_CONTEXT_PATH" ]] || die "Unexpected argument: '$1'"
                  DOCKER_BUILD_CONTEXT_PATH="$1"; shift ;;
  esac
done

[[ -n "$DOCKER_BUILD_CONTEXT_PATH" ]]  || die "<builder-path> is required."
[[ -d "$DOCKER_BUILD_CONTEXT_PATH" ]]  || die "builder-path does not exist or is not a directory: '$DOCKER_BUILD_CONTEXT_PATH'"
[[ -f "$DOCKERFILE"   ]]  || die "Dockerfile not found: '$DOCKERFILE'"

DOCKER_BUILD_CONTEXT_PATH="$(cd "$DOCKER_BUILD_CONTEXT_PATH" && pwd)"   # normalize to absolute path

# ---------------------------------------------------------------------------
# Build
# ---------------------------------------------------------------------------
step "Building Docker image '${TAG}'"
echo "  path to Miroir build : ${DOCKER_BUILD_CONTEXT_PATH}"
echo "  Dockerfile    : ${DOCKERFILE}"
[[ -n "$NO_CACHE" ]] && echo "  --no-cache    : enabled"

docker build \
  ${NO_CACHE} \
  -t "${TAG}" \
  -f "${DOCKERFILE}" \
  "${DOCKER_BUILD_CONTEXT_PATH}"

echo ""
echo "========================================================================"
echo "  ALL DONE  →  image tagged as '${TAG}'"
echo "========================================================================"