#!/usr/bin/env bash
# start-docker.sh — Start the miroir-server Docker container with locally-trusted HTTPS
#
# This script:
#   1. Ensures mkcert is installed on the host.
#   2. Installs the mkcert root CA into the OS/browser trust store (idempotent).
#   3. Generates TLS certificates in <repo-root>/certs/ (skipped if they already exist).
#   4. Copies the mkcert root CA into certs/rootCA.pem so Node.js inside the
#      container can trust it for internal HTTPS calls.
#   5. Runs the Docker container with the certs directory mounted read-only.
#
# Usage:
#   bash scripts/start-docker.sh [docker-run extra args]
#
# Examples:
#   bash scripts/start-docker.sh                    # foreground, interactive
#   bash scripts/start-docker.sh -d                 # detached (background)
#   bash scripts/start-docker.sh --name miroir -d  # named container, detached
#
# Environment overrides:
#   MIROIR_IMAGE        Docker image to run  (default: miroir-framework/miroir:latest)
#   MIROIR_DATA_VOLUME  Named volume for /data (default: miroir-data)
#   MIROIR_PORT         Host port to expose   (default: 3080)
# =============================================================================

set -e

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CERTS_DIR="$REPO_ROOT/certs"

IMAGE="${MIROIR_IMAGE:-miroir-framework/miroir:latest}"
DATA_VOLUME="${MIROIR_DATA_VOLUME:-miroir-data}"
PORT="${MIROIR_PORT:-3080}"

# ── 1. Check mkcert is installed ──────────────────────────────────────────────
if ! command -v mkcert &>/dev/null; then
  echo ""
  echo "ERROR: mkcert is not installed."
  echo ""
  echo "Install it with one of:"
  echo "  macOS:    brew install mkcert"
  echo "  Linux:    sudo apt install mkcert   OR   brew install mkcert"
  echo "  Windows:  choco install mkcert       OR   winget install mkcert"
  echo "  Any:      https://github.com/FiloSottile/mkcert/releases"
  echo ""
  echo "Then re-run this script."
  exit 1
fi

# ── 2. Install mkcert root CA into OS/browser trust store (idempotent) ────────
echo "[start-docker] Installing mkcert local CA into OS/browser trust store..."
mkcert -install

# ── 3. Generate certificates if they don't exist ──────────────────────────────
mkdir -p "$CERTS_DIR"

if [ ! -f "$CERTS_DIR/localhost.pem" ] || [ ! -f "$CERTS_DIR/localhost-key.pem" ]; then
  echo "[start-docker] Generating TLS certificates in $CERTS_DIR ..."
  mkcert \
    -cert-file "$CERTS_DIR/localhost.pem" \
    -key-file  "$CERTS_DIR/localhost-key.pem" \
    localhost 127.0.0.1 ::1
  echo "[start-docker] Certificates generated."
else
  echo "[start-docker] TLS certificates already present in $CERTS_DIR — skipping generation."
fi

# ── 4. Copy mkcert root CA into certs/ for Node.js inside the container ───────
CAROOT="$(mkcert -CAROOT)"
if [ -f "$CAROOT/rootCA.pem" ]; then
  cp "$CAROOT/rootCA.pem" "$CERTS_DIR/rootCA.pem"
  echo "[start-docker] Copied $CAROOT/rootCA.pem → $CERTS_DIR/rootCA.pem"
fi

# ── 5. Run the container ──────────────────────────────────────────────────────
echo ""
echo "[start-docker] Starting $IMAGE on https://localhost:${PORT} ..."
echo ""

docker run \
  --rm \
  -p "${PORT}:${PORT}" \
  -v "${DATA_VOLUME}:/data" \
  -v "${CERTS_DIR}:/certs:ro" \
  -e MIROIR_TLS_CERT=/certs/localhost.pem \
  -e MIROIR_TLS_KEY=/certs/localhost-key.pem \
  "$@" \
  "$IMAGE"
