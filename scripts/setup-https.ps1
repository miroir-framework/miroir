# setup-https.ps1 — Generate locally-trusted TLS certificates for Miroir development (Windows)
# Uses mkcert (https://github.com/FiloSottile/mkcert) which installs its own CA into the
# OS/browser trust store. Certificates are placed in <repo-root>\certs\ and are gitignored.
# Run this script once after cloning (or whenever you regenerate certs).
# Run from PowerShell (not cmd): .\scripts\setup-https.ps1

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$certsDir = Join-Path $repoRoot "certs"

# ── 1. Check mkcert is installed ──────────────────────────────────────────────
if (-not (Get-Command mkcert -ErrorAction SilentlyContinue)) {
  Write-Host ""
  Write-Host "ERROR: mkcert is not installed." -ForegroundColor Red
  Write-Host ""
  Write-Host "Install it with one of:"
  Write-Host "  choco install mkcert"
  Write-Host "  scoop install mkcert"
  Write-Host "  winget install mkcert"
  Write-Host "  OR download from: https://github.com/FiloSottile/mkcert/releases"
  Write-Host ""
  exit 1
}

# ── 2. Install mkcert root CA into the OS trust store ─────────────────────────
Write-Host "Installing mkcert local CA into OS/browser trust store..."
mkcert -install

# ── 3. Create certs directory ─────────────────────────────────────────────────
if (-not (Test-Path $certsDir)) {
  New-Item -ItemType Directory -Path $certsDir | Out-Null
}

# ── 4. Generate certificates ──────────────────────────────────────────────────
Write-Host "Generating certificates in $certsDir ..."
mkcert `
  -cert-file "$certsDir\localhost.pem" `
  -key-file  "$certsDir\localhost-key.pem" `
  localhost 127.0.0.1 ::1

Write-Host ""
Write-Host "✓ Certificates generated:" -ForegroundColor Green
Write-Host "    cert: $certsDir\localhost.pem"
Write-Host "    key:  $certsDir\localhost-key.pem"
Write-Host ""

# ── 5. NODE_EXTRA_CA_CERTS reminder ───────────────────────────────────────────
$caRoot = & mkcert -CAROOT
Write-Host "---------------------------------------------------------"
Write-Host "IMPORTANT — add this to your user environment variables:"
Write-Host ""
Write-Host "  NODE_EXTRA_CA_CERTS=$caRoot\rootCA.pem"
Write-Host ""
Write-Host "This is required so Node.js (e.g. test runner) trusts the local CA"
Write-Host "when making real HTTPS requests to https://localhost:3080."
Write-Host "---------------------------------------------------------"
Write-Host ""
Write-Host "To set it in the current PowerShell session:"
Write-Host "  `$env:NODE_EXTRA_CA_CERTS = '$caRoot\rootCA.pem'"
