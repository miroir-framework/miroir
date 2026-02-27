# HTTPS Setup — Developer Guide

Miroir's development servers (`miroir-standalone-app` on port 5173 and `miroir-server` on port 3080) run over **HTTPS** by default.  Both servers share a single pair of locally-trusted TLS certificates placed in `<repo-root>/certs/`, generated with [mkcert](https://github.com/FiloSottile/mkcert).

HTTPS is important for:
- Enabling browser [Secure Context](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts) APIs (Web Crypto, Service Workers, etc.)
- Consistent behaviour between development and production deployments.

Both servers **gracefully fall back to plain HTTP** if the certificate files are absent, so existing setups continue to work without the HTTPS setup step, with a console warning.

---

## Prerequisites

Install **mkcert** (a small tool that creates locally-trusted certificates):

| Platform | Command |
|---|---|
| macOS | `brew install mkcert` |
| Linux (Debian/Ubuntu) | `sudo apt install mkcert` &nbsp;or&nbsp; `brew install mkcert` |
| Windows (Chocolatey) | `choco install mkcert` |
| Windows (Scoop) | `scoop install mkcert` |
| Windows (winget) | `winget install mkcert` |
| Any | Download binary from [github.com/FiloSottile/mkcert/releases](https://github.com/FiloSottile/mkcert/releases) |

> **Note for Windows users**: run PowerShell **as Administrator** the first time so `mkcert -install` can write to the Windows certificate store.

---

## One-time setup

Run the setup script from the monorepo root **once** after cloning (or when you need to regenerate expiring certificates):

```bash
# bash / macOS / Linux / Git Bash (Windows)
bash scripts/setup-https.sh

# PowerShell (Windows)
.\scripts\setup-https.ps1
```

The script:
1. Runs `mkcert -install` — adds mkcert's root CA to your OS/browser trust store.
2. Generates `certs/localhost.pem` and `certs/localhost-key.pem` in the repo root.
3. Prints the `NODE_EXTRA_CA_CERTS` environment variable you must add to your shell profile.

### Add `NODE_EXTRA_CA_CERTS` to your shell profile

Node.js maintains its own CA bundle and does **not** read the OS trust store automatically.  Without this variable, Node.js will reject connections to `https://localhost:3080` (e.g., in integration tests or when the server makes internal calls).

The script prints the exact line for your system.  It will look like:

```bash
# ~/.bashrc or ~/.zshrc (macOS/Linux)
export NODE_EXTRA_CA_CERTS="/Users/you/Library/Application Support/mkcert/rootCA.pem"

# PowerShell profile ($PROFILE) — Windows
$env:NODE_EXTRA_CA_CERTS = "C:\Users\you\AppData\Local\mkcert\rootCA.pem"
# Or as persistent user environment variable via System Properties
```

Run `mkcert -CAROOT` at any time to find the exact directory.

---

## Starting the servers

No change to the start commands — the cert files are picked up automatically:

```bash
# Start the REST API server (https://localhost:3080)
npm run dev -w miroir-server

# Start the frontend dev server (https://localhost:5173)
npm run dev -w miroir-standalone-app
```

Open your browser at **https://localhost:5173**.  You should see a valid padlock in the address bar (no certificate warning).

### Electron (dev mode)

```bash
cd packages/miroir-standalone-app-electron
bash start-dev.sh       # bash/Git Bash
# or
start-dev.bat           # Windows cmd
```

Electron uses the OS trust store (same as Chrome), so the mkcert CA is trusted automatically after `mkcert -install`.

---

## Environment variables reference

| Variable | Default | Description |
|---|---|---|
| `MIROIR_TLS_CERT` | `<repo-root>/certs/localhost.pem` | Path to the TLS certificate file |
| `MIROIR_TLS_KEY` | `<repo-root>/certs/localhost-key.pem` | Path to the TLS private key file |
| `NODE_EXTRA_CA_CERTS` | _(not set)_ | Path to the mkcert root CA PEM, required for Node.js HTTPS clients |

---

## Running tests

### Emulated-server tests (MSW / no real TCP connection)

These tests mock HTTP at the `fetch()` level and do not open real TCP connections. They work without any additional setup after the URL change to `https://localhost:3080`.

```bash
VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-filesystem \
npm run testByFile -w miroir-standalone-app -- DomainController.integ
```

### Real-server integration tests

These tests open real HTTPS connections to `localhost:3080`.  Make sure `NODE_EXTRA_CA_CERTS` is set in your shell (see above) **or** export it inline:

```bash
NODE_EXTRA_CA_CERTS="$(mkcert -CAROOT)/rootCA.pem" \
VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-realServer-filesystem \
npm run testByFile -w miroir-standalone-app -- DomainController.integ
```

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Browser shows "Your connection is not private" | `mkcert -install` not run, or OS trust store not updated | Re-run `scripts/setup-https.sh` and restart browser |
| Electron shows blank page / net::ERR_CERT_AUTHORITY_INVALID | Same as above | Re-run setup script, ensure mkcert CA is in system store |
| `fetch failed` / `SELF_SIGNED_CERT_IN_CHAIN` in Node.js tests | `NODE_EXTRA_CA_CERTS` not set | Set `NODE_EXTRA_CA_CERTS` as described above |
| Vite proxy `ECONNREFUSED` or TLS error | Server not running, or server fell back to HTTP while proxy expects HTTPS | Start the server; check that cert files exist in `certs/` |
| Servers start on HTTP (console warning about missing certs) | Cert files not found | Run `scripts/setup-https.sh` |
| `mkcert: command not found` | mkcert not installed | Follow installation instructions above |
