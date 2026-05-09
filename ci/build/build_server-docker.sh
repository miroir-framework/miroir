#!/usr/bin/env bash
# =============================================================================
# build_server-docker.sh  –  Build the miroir-server Docker image.
#
# Usage:
#   ./build_server-docker.sh [OPTIONS] <builder-path>
#
# ARGUMENTS:
#   <builder-path>   Path to the pre-built workspace root on the host.
#                    Must contain the layout produced by build_server.sh,
#                    e.g.  /home/ci/miroir-build
#                    (the directory that holds  miroir/packages/miroir-server/…)
#
# OPTIONS:
#   -t, --tag TAG    Docker image tag  (default: miroir-framework/miroir:latest)
#   -f, --file FILE  Path to the Dockerfile
#                    (default: <repo-root>/docker/miroir-server/Dockerfile)
#   --no-cache       Pass --no-cache to docker build
#   -h, --help       Show this help message and exit
#
# Examples:
#   ./build_server-docker.sh /tmp/miroir-build
#   ./build_server-docker.sh --tag miroir-framework/miroir:1.2.3 /tmp/miroir-build
#   ./build_server-docker.sh --no-cache /tmp/miroir-build
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

usage() {
  sed -n '2,30p' "$0"
  exit 0
}

step() {
  echo ""
  echo "========================================================================"
  echo "  $*"
  echo "========================================================================"
}

die() {
  echo "ERROR: $*" >&2
  echo "Run '$0 --help' for usage." >&2
  exit 1
}

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------
TAG="miroir-framework/miroir:latest"
DOCKERFILE="${REPO_ROOT}/docker/miroir-server/Dockerfile"
NO_CACHE=""
BUILDER_PATH=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)    usage ;;
    -t|--tag)     [[ $# -ge 2 ]] || die "--tag requires an argument."
                  TAG="$2"; shift 2 ;;
    -f|--file)    [[ $# -ge 2 ]] || die "--file requires an argument."
                  DOCKERFILE="$2"; shift 2 ;;
    --no-cache)   NO_CACHE="--no-cache"; shift ;;
    -*)           die "Unknown option: '$1'" ;;
    *)            [[ -z "$BUILDER_PATH" ]] || die "Unexpected argument: '$1'"
                  BUILDER_PATH="$1"; shift ;;
  esac
done

[[ -n "$BUILDER_PATH" ]] || die "<builder-path> is required."
[[ -d "$BUILDER_PATH" ]] || die "builder-path does not exist or is not a directory: '$BUILDER_PATH'"
[[ -f "$DOCKERFILE"   ]] || die "Dockerfile not found: '$DOCKERFILE'"

BUILDER_PATH="$(cd "$BUILDER_PATH" && pwd)"   # normalize to absolute path

# ---------------------------------------------------------------------------
# Build
# ---------------------------------------------------------------------------
step "Building Docker image '${TAG}'"
echo "  Builder path : ${BUILDER_PATH}"
echo "  Dockerfile   : ${DOCKERFILE}"
echo "  Context dir  : ${REPO_ROOT}/docker/miroir-server/"
[[ -n "$NO_CACHE" ]] && echo "  --no-cache   : enabled"

docker build \
  --build-context "builder=${BUILDER_PATH}" \
  ${NO_CACHE} \
  -t "${TAG}" \
  -f "${DOCKERFILE}" \
  "${REPO_ROOT}/docker/miroir-server/"

echo ""
echo "========================================================================"
echo "  ALL DONE  →  image tagged as '${TAG}'"
echo "========================================================================"