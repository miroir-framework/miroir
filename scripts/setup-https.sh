#!/usr/bin/env bash
# setup-https.sh — Generate locally-trusted TLS certificates for Miroir development
# Uses mkcert (https://github.com/FiloSottile/mkcert) which installs its own CA into the
# OS/browser trust store. Certificates are placed in <repo-root>/certs/ and are gitignored.
# Run this script once after cloning (or whenever you regenerate certs).

set -e

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CERTS_DIR="$REPO_ROOT/certs"

# ── 1. Check mkcert is installed ──────────────────────────────────────────────
if ! command -v mkcert &> /dev/null; then
  echo ""
  echo "ERROR: mkcert is not installed."
  echo ""
  echo "Install it with one of:"
  echo "  macOS:    brew install mkcert"
  echo "  Linux:    sudo apt install mkcert   OR   brew install mkcert"
  echo "  Windows:  choco install mkcert       OR   https://github.com/FiloSottile/mkcert/releases"
  echo ""
  exit 1
fi

# ── 2. Install mkcert root CA into the OS trust store ─────────────────────────
echo "Installing mkcert local CA into OS/browser trust store..."
mkcert -install

# ── 3. Create certs directory ─────────────────────────────────────────────────
mkdir -p "$CERTS_DIR"

# ── 4. Generate certificates ──────────────────────────────────────────────────
echo "Generating certificates in $CERTS_DIR ..."
mkcert \
  -cert-file "$CERTS_DIR/localhost.pem" \
  -key-file  "$CERTS_DIR/localhost-key.pem" \
  localhost 127.0.0.1 ::1

echo ""
echo "✓ Certificates generated:"
echo "    cert: $CERTS_DIR/localhost.pem"
echo "    key:  $CERTS_DIR/localhost-key.pem"
echo ""

# ── 5. NODE_EXTRA_CA_CERTS reminder ───────────────────────────────────────────
CAROOT="$(mkcert -CAROOT)"
echo "─────────────────────────────────────────────────────────"
echo "IMPORTANT — add this to your shell profile (~/.bashrc / ~/.zshrc):"
echo ""
echo "  export NODE_EXTRA_CA_CERTS=\"$CAROOT/rootCA.pem\""
echo ""
echo "This is required so Node.js (e.g. test runner) trusts the local CA"
echo "when making real HTTPS requests to https://localhost:3080."
echo "─────────────────────────────────────────────────────────"
