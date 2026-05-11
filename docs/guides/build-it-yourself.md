# Build Miroir from Scratch

This guide walks you through cloning the monorepo and building the **Miroir server** (and optionally the Electron desktop app) from source. It covers Linux (AMD64), Windows (AMD64), and macOS (Apple Silicon / ARM64).

---

## Overview

The Miroir monorepo provide shell scripts that scaffold build operations, but require a shell (`bash`) interpreter. You may bypass these and call `npm` commands directly, if that suits you better.

*disclaimer: [No step-by-step validation has been performed on this guide](https://github.com/miroir-framework/miroir/issues/190), some inaccuracies may remain*

## Platform notes and known friction points

Read the relevant section for your OS **before** running any commands.

### Linux (AMD64)

- All build scripts (`build-all.sh`, `scripts/setup-https.sh`) run natively in bash.
- `npm install` may fail for packages that require native add-ons (`node-gyp`). Install the build toolchain first:
  ```sh
  sudo apt install -y python3 make g++   # Debian / Ubuntu
  ```
- The Vite and `@vercel/ncc` bundling steps are memory-intensive. If you have less than 8 GB of RAM available to the Node process you may hit V8 heap exhaustion. The scripts already pass `NODE_OPTIONS=--max-old-space-size=4096`; increase to `6144` if builds still OOM.

### Windows (AMD64)

- **Shell**: `build-all.sh` requires a POSIX shell. Use **Git Bash**, **WSL 2**, or **Cygwin**. Do _not_ run it from `cmd.exe` or plain PowerShell.
- **Line endings**: Git's default `core.autocrlf=true` will inject CRLF into shell scripts and break them. Either clone with `git clone --config core.autocrlf=false` or ensure the repo's `.gitattributes` forces `text eol=lf` for `*.sh` files (it does).
- **Native add-ons**: Install the [C++ Build Tools for Visual Studio](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022) and Python 3. The easiest path is:
  ```powershell
  winget install Microsoft.VisualStudio.2022.BuildTools
  winget install Python.Python.3
  ```
- **`cross-env`** is already declared in each package's `package.json` scripts so `NODE_ENV=production` works on all shells; no manual workaround needed.
- **PowerShell execution policy**: running `scripts\setup-https.ps1` requires that scripts be allowed:
  ```powershell
  Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
  ```
- **`mkcert -install`** on Windows opens a UAC prompt to install the root CA into the Windows certificate store. The command must run in an elevated prompt _or_ the UAC dialog must be accepted.

### macOS (Apple Silicon / ARM64)

- All bash scripts run natively; no compatibility layer needed.
- Install Xcode command-line tools for `node-gyp`:
  ```sh
  xcode-select --install
  ```
- `npm install` on an ARM64 machine will fetch `darwin-arm64` optional natives. If your `package-lock.json` was last committed from an AMD64 machine it may be missing the arm64 entries. Delete and regenerate it:
  ```sh
  rm package-lock.json && npm install
  ```
  (This is also what the Docker `builder` stage does for the same reason.)
- **`mkcert -install`** requires Homebrew (`brew install mkcert`) and will add the root CA to the macOS Keychain automatically — no sudo needed, but a password prompt appears.
- When building the **Electron** artefact for macOS the app is _not_ code-signed by default. Gatekeeper will block opening it. Either sign with your Apple Developer certificate or allow unsigned apps system-wide:
  ```sh
  xattr -cr /Applications/Miroir\ Standalone\ App.app
  ```

---

## Prerequisites

| Tool | Minimum version | Notes |
|---|---|---|
| Node.js | 20 LTS | 22 LTS recommended (matches Docker builder stage) |
| npm | 10 | Bundled with Node ≥ 20 |
| git | any recent | |
| mkcert | latest | Only needed for HTTPS; optional for a plain-HTTP local build |

---

## 1. Clone the repository

```sh
git clone https://github.com/miroir-framework/miroir.git
cd miroir
```

On Windows with Git Bash, add the line-ending guard:

```sh
git clone --config core.autocrlf=false https://github.com/miroir-framework/miroir.git
cd miroir
```

---

## 2. Install dependencies

```sh
npm install
```

> **Note (Windows / macOS ARM64)**: if the install fails due to platform-specific optional binary conflicts, delete the lockfile and retry:
> ```sh
> rm package-lock.json && npm install
> ```

---

## 3. Build all packages

The monorepo must be built in strict dependency order. The provided script handles this:

```sh
./build-all.sh
```

On Windows, run this inside **Git Bash** or **WSL 2**, not from `cmd.exe`.

The script performs six ordered steps:

| Step | Packages |
|---|---|
| 1 | `miroir-test-app_deployment-miroir`, `miroir-test-app_deployment-admin` |
| 2 | `miroir-core` (plain build, or `devbuild` to regenerate TS types from Jzod schemas) |
| 3 | All local-cache and store packages (built in parallel) |
| 4 | `miroir-react`, `miroir-mcp`, `miroir-diagram-class` |
| 5 | `miroir-server`, `miroir-standalone-app`, `miroir-cli` |
| 6 | Remaining deployment packages |

If you modified schema definitions under `packages/miroir-test-app_deployment-miroir/assets`, use `devbuild` to regenerate TypeScript types before building `miroir-core`:

```sh
./build-all.sh devbuild
```

> **Memory**: the Vite build for `miroir-standalone-app` is memory-intensive. If the step fails with a JavaScript heap out of memory error, set the env var before running the script:
> ```sh
> NODE_OPTIONS=--max-old-space-size=6144 ./build-all.sh
> ```

---

## 4. Generate TLS certificates (optional but recommended)

The server supports HTTPS via locally-trusted certificates created with [mkcert](https://github.com/FiloSottile/mkcert).

**Linux / macOS (bash):**

```sh
bash scripts/setup-https.sh
```

**Windows (PowerShell — run as Administrator, or accept the UAC prompt):**

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\scripts\setup-https.ps1
```

Both scripts place the certificates in `certs/` and print the `NODE_EXTRA_CA_CERTS` line to add to your shell profile.

> If you skip this step the server falls back to plain HTTP on port 3080.

---

## 5. Configure the server

Edit `packages/miroir-server/config/miroirConfig.server.json`:

```json
{
  "server": {
    "rootApiUrl": "https://localhost:3080",
    "filesystemDeploymentRootDirectory": "<path-to-your-deployments-directory>",
    "corsAllowedOrigins": ["https://localhost:3080"]
  }
}
```

`filesystemDeploymentRootDirectory` must point to a directory that contains both the `admin` and `miroir` application deployments (subdirectories of JSON files). The default value `".."` resolves to the monorepo root and works out of the box when running directly from the repo.

---

## 6. Start the server

```sh
# Linux / macOS
NODE_ENV=production \
NODE_EXTRA_CA_CERTS="$(mkcert -CAROOT)/rootCA.pem" \
node packages/miroir-server/release/index.js
```

```powershell
# Windows (PowerShell)
$env:NODE_ENV = "production"
$env:NODE_EXTRA_CA_CERTS = "$(mkcert -CAROOT)\rootCA.pem"
node packages\miroir-server\release\index.js
```

```dos
REM Windows (cmd.exe)
set NODE_ENV=production
set NODE_EXTRA_CA_CERTS=<path-from-mkcert-CAROOT>\rootCA.pem
node packages\miroir-server\release\index.js
```

The server is accessible at **https://localhost:3080** (or http://localhost:3080 if you skipped certificate generation).

---

## 7. (Optional) Build the Electron desktop application

After step 3 has completed successfully:

```sh
npm run dist -w miroir-standalone-app-electron
```

Distributables are written to `packages/miroir-standalone-app-electron/release/`.

Platform-specific targets:

```sh
npm run dist-linux -w miroir-standalone-app-electron   # .AppImage / .deb
npm run dist-win   -w miroir-standalone-app-electron   # .exe installer (NSIS)
npm run dist-mac   -w miroir-standalone-app-electron   # .dmg
```

> **macOS Gatekeeper**: the resulting `.app` is unsigned. To open it without disabling Gatekeeper globally, clear the quarantine attribute after copying to `/Applications`:
> ```sh
> xattr -cr "/Applications/Miroir Standalone App.app"
> ```

---

## 8. (Optional) Docker build

If you prefer a container, the repo ships a multi-stage `Dockerfile` and a `docker-compose.yml`:

```sh
# Generate certs first (optional; server falls back to HTTP without them)
bash scripts/setup-https.sh
cp "$(mkcert -CAROOT)/rootCA.pem" certs/

# Build and start
docker compose up
```

Access the app at **http://localhost:3080** (or https if certs are present).

> **First run**: on an empty `/data` volume the container automatically seeds it with the Miroir framework model, the admin application, and the library demo application.

> **ARM64 (Apple Silicon)**: Docker Desktop handles cross-architecture emulation transparently. Native ARM64 builds also work because the `node:22-alpine` image is a multi-arch manifest.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `heap out of memory` during build | Node V8 heap too small | `export NODE_OPTIONS=--max-old-space-size=6144` |
| `EADDRINUSE :3080` | Another process on port 3080 | `lsof -ti:3080 \| xargs kill -9` (Linux/macOS) or `netstat -ano \| findstr :3080` + `taskkill /PID <PID> /F` (Windows) |
| `set -euo pipefail: not found` | Running `build-all.sh` in `cmd.exe` / PS | Use Git Bash or WSL 2 |
| Certificates not trusted by browser | `mkcert -install` not run, or run without admin rights | Re-run `setup-https.sh` (or `.ps1`) with appropriate privileges |
| `node-gyp` errors during `npm install` | Missing build toolchain | Install `python3 make g++` (Linux), Visual Studio Build Tools (Windows), or Xcode CLI tools (macOS) |
| macOS app blocked by Gatekeeper | App is unsigned | `xattr -cr "/Applications/Miroir Standalone App.app"` |
| Blank page / 404 after server starts | `filesystemDeploymentRootDirectory` misconfigured | Check that the path contains `admin/` and `miroir/` subdirectories with JSON files |
