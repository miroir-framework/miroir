#!/usr/bin/env bash
# =============================================================================
# start-docker.sh  —  Start the miroir-server Docker container.
#
# Handles TLS certificate setup (either pre-existing or mkcert-generated),
# then runs the container with the certs and data volume mounted.
#
# Usage:
#   ./scripts/start-docker.sh [OPTIONS] [-- DOCKER_ARGS...]
#
# OPTIONS:
#   -c, --certs DIR    Directory containing TLS certs: localhost.pem,
#                      localhost-key.pem, and (recommended) rootCA.pem.
#                      If omitted, certificates are generated with mkcert
#                      in <repo-root>/certs/  (mkcert must be on PATH).
#                      Env var fallback: MIROIR_CERTS_DIR
#   -d, --data PATH    Host path or named volume mounted at /data inside the
#                      container.  (default: miroir-data)
#                      Env var fallback: MIROIR_DATA_VOLUME
#   -i, --image IMAGE  Docker image to run.
#                      (default: miroir-framework/miroir:latest)
#                      Env var fallback: MIROIR_IMAGE
#   -p, --port PORT    Host port forwarded to container port.
#                      (default: 3080)
#                      Env var fallback: MIROIR_PORT
#   --detach           Run the container in detached (background) mode.
#   -h, --help         Show this help message and exit.
#
# Any arguments after -- are passed verbatim to docker run.
#
# Examples:
#   # Provide pre-generated certs (typical WSL / CI workflow):
#   ./scripts/start-docker.sh --certs /mnt/c/certs --data /mnt/c/miroir-data
#
#   # Same via environment variables:
#   MIROIR_CERTS_DIR=/mnt/c/certs MIROIR_DATA_VOLUME=/mnt/c/miroir-data \
#     ./scripts/start-docker.sh
#
#   # Auto-generate certs with mkcert, run detached:
#   ./scripts/start-docker.sh --data /mnt/c/miroir-data --detach
#
#   # Pass extra docker run flags after --:
#   ./scripts/start-docker.sh -c /mnt/c/certs -- --name miroir --restart unless-stopped
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
source "${SCRIPT_DIR}/../ci/lib/common.sh"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

usage() {
  sed -n '2,48p' "$0"
  exit 0
}

# ---------------------------------------------------------------------------
# Argument parsing  (CLI takes precedence; env vars are fallbacks)
# ---------------------------------------------------------------------------
IMAGE="${MIROIR_IMAGE:-miroir-framework/miroir:latest}"
DATA_VOLUME="${MIROIR_DATA_VOLUME:-miroir-data}"
PORT="${MIROIR_PORT:-3080}"
CERTS_DIR="${MIROIR_CERTS_DIR:-}"
DETACH=""
EXTRA_DOCKER_ARGS=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)   usage ;;
    -c|--certs)  [[ $# -ge 2 ]] || die "--certs requires an argument."
                 CERTS_DIR="$2"; shift 2 ;;
    -d|--data)   [[ $# -ge 2 ]] || die "--data requires an argument."
                 DATA_VOLUME="$2"; shift 2 ;;
    -i|--image)  [[ $# -ge 2 ]] || die "--image requires an argument."
                 IMAGE="$2"; shift 2 ;;
    -p|--port)   [[ $# -ge 2 ]] || die "--port requires an argument."
                 PORT="$2"; shift 2 ;;
    --detach)    DETACH="-d"; shift ;;
    --)          shift; EXTRA_DOCKER_ARGS=("$@"); break ;;
    -*)          die "Unknown option: '$1'" ;;
    *)           die "Unexpected argument: '$1'  (use -- to pass extra docker run flags)" ;;
  esac
done

# ---------------------------------------------------------------------------
# Step 1 — TLS certificates
# ---------------------------------------------------------------------------
if [[ -n "$CERTS_DIR" ]]; then
  # ── Use the provided directory ─────────────────────────────────────────────
  step "1/2 · Validating TLS certificates"
  echo "  Directory : ${CERTS_DIR}"

  [[ -d "$CERTS_DIR" ]] || die "Certs directory does not exist: '${CERTS_DIR}'"
  [[ -f "${CERTS_DIR}/localhost.pem"     ]] || \
    die "Missing certificate: ${CERTS_DIR}/localhost.pem"
  [[ -f "${CERTS_DIR}/localhost-key.pem" ]] || \
    die "Missing private key: ${CERTS_DIR}/localhost-key.pem"

  if [[ ! -f "${CERTS_DIR}/rootCA.pem" ]]; then
    echo ""
    echo "  WARNING: rootCA.pem not found — Node.js inside the container may"
    echo "           not trust the certificate for internal HTTPS calls."
    echo "  Fix:  cp \"\$(mkcert -CAROOT)/rootCA.pem\" ${CERTS_DIR}/rootCA.pem"
    echo ""
  else
    echo "  All required certificate files present."
  fi

  CERTS_DIR="$(cd "${CERTS_DIR}" && pwd)"   # normalize to absolute path

else
  # ── Auto-generate with mkcert ──────────────────────────────────────────────
  CERTS_DIR="${REPO_ROOT}/certs"
  step "1/2 · Generating TLS certificates with mkcert"
  echo "  Target directory : ${CERTS_DIR}"

  if ! command -v mkcert &>/dev/null; then
    echo ""
    echo "  mkcert is not installed.  Install it with one of:"
    echo "    macOS / Linux (brew) : brew install mkcert"
    echo "    Debian / Ubuntu      : sudo apt install mkcert"
    echo "    Windows (choco)      : choco install mkcert"
    echo "    Windows (winget)     : winget install mkcert"
    echo "    Releases page        : https://github.com/FiloSottile/mkcert/releases"
    echo ""
    echo "  Alternatively, supply pre-generated certs with --certs <dir>."
    echo ""
    exit 1
  fi

  # Install root CA into OS / browser trust store (idempotent).
  echo "  Installing mkcert root CA into system trust store (idempotent)..."
  mkcert -install

  mkdir -p "${CERTS_DIR}"

  if [[ -f "${CERTS_DIR}/localhost.pem" && -f "${CERTS_DIR}/localhost-key.pem" ]]; then
    echo "  Certificate files already present — skipping generation."
  else
    echo "  Generating certificates for localhost / 127.0.0.1 / ::1 ..."
    mkcert \
      -cert-file "${CERTS_DIR}/localhost.pem" \
      -key-file  "${CERTS_DIR}/localhost-key.pem" \
      localhost 127.0.0.1 ::1
    echo "  Certificates generated."
  fi

  # Copy root CA so Node.js inside the container can trust it.
  CAROOT="$(mkcert -CAROOT)"
  if [[ -f "${CAROOT}/rootCA.pem" ]]; then
    cp "${CAROOT}/rootCA.pem" "${CERTS_DIR}/rootCA.pem"
    echo "  Copied ${CAROOT}/rootCA.pem  →  ${CERTS_DIR}/rootCA.pem"
  fi
fi

# ---------------------------------------------------------------------------
# Step 2 — Run the container
# ---------------------------------------------------------------------------
step "2/2 · Starting container"
echo "  Image       : ${IMAGE}"
echo "  Port        : https://localhost:${PORT}"
echo "  Data volume : ${DATA_VOLUME}  →  /data"
echo "  Certs dir   : ${CERTS_DIR}  →  /certs (read-only)"
[[ -n "$DETACH"                    ]] && echo "  Mode        : detached"
[[ ${#EXTRA_DOCKER_ARGS[@]} -gt 0  ]] && echo "  Extra args  : ${EXTRA_DOCKER_ARGS[*]}"
echo ""

docker run \
  --rm \
  -p "${PORT}:3080" \
  -v "${DATA_VOLUME}:/data" \
  -v "${CERTS_DIR}:/certs:ro" \
  -e MIROIR_TLS_CERT=/certs/localhost.pem \
  -e MIROIR_TLS_KEY=/certs/localhost-key.pem \
  ${DETACH} \
  "${EXTRA_DOCKER_ARGS[@]+"${EXTRA_DOCKER_ARGS[@]}"}" \
  "${IMAGE}"
