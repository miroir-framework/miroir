# Build Miroir from Scratch

This guide walks you through cloning the monorepo and building the **Miroir server** (and optionally the Electron desktop app) from source. It covers Linux (AMD64), Windows (AMD64), and macOS (Apple Silicon / ARM64).

---

## Overview

The Miroir monorepo provide shell scripts that scaffold build operations, but require a shell (`bash`) interpreter. You may bypass these and call `npm` commands directly, if that suits you better.

*Disclaimer: no step-by-step validation has been performed on this guide; some inaccuracies may remain.*

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

### Incremental builds

Progress is recorded in `tmp/build-all-state` (successful packages and last error, each with a timestamp).

| Invocation | Behaviour |
|---|---|
| `./build-all.sh` | If the state file has a last error, resume from that package (skip already-successful packages). Otherwise full build. |
| `./build-all.sh full` | Full build (ignore previous state). |
| `./build-all.sh reset` | Delete the state file, then full build. |
| `./build-all.sh incremental <package>` | Build from `<package>` upwards (skip earlier packages). |

The script performs ordered steps:

| Step | Packages |
|---|---|
| 1 | `miroir-app-miroir`, `miroir-app-admin` |
| 2 | `@miroir-framework/core` (plain build, or `devbuild` to regenerate TS types from ML schemas) |
| 3 | All local-cache and store packages (built in parallel) |
| 4 | `@miroir-framework/react`, `@miroir-framework/mcp`, `miroir-diagram-class` |
| 5 | `@miroir-framework/server` (Miroir's HTTP surface, after `@miroir-framework/mcp`), `miroir-server`, `miroir-standalone-app`, `@miroir-framework/cli` |
| 6 | Remaining deployment packages |

If you modified schema definitions under `packages/miroir-app-miroir/assets`, use `devbuild` to regenerate TypeScript types before building `@miroir-framework/core`:

```sh
./build-all.sh devbuild
```

> **Memory**: the Vite build for `miroir-standalone-app` is memory-intensive. If the step fails with a JavaScript heap out of memory error, set the env var before running the script:
> ```sh
> NODE_OPTIONS=--max-old-space-size=6144 ./build-all.sh
> ```

---


## 4. Server Parameters

The server needs 3 things to start, all with working defaults:

- the running mode, from `NODE_ENV`: `development` is development mode, any other value (or none) is production mode ([Development or production](#development-or-production));
- a folder with TLS certificates, needed for HTTPS (strongly recommended): `certs/` by default, see step 5;
- the **bootstrap** filesystem deployments of the `admin` and `miroir` applications: taken from the selected environment (step 6), or from a configuration file outside the repository.

The command-line flags that override these defaults are listed in step 7.

## 5. Generate TLS certificates (optional but recommended)

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

## 6. Choose your environment (optional)

Run from the repository, the server and the web client take their configuration from an **environment** in `environments/` ([Environments](../reference/environments.md)). Without anything set, they use `dev`:

- application models are edited live in their package assets (`packages/{miroir-app,miroir-example,miroir-fixture}-*/assets/`);
- Admin data (installed applications, users, rights, secrets, view settings) lives in the gitignored `.miroir/dev/`, so installing an application or changing a right changes no tracked file.

```sh
npm run build -w @miroir-framework/env
npm run miroir-env -- show      # the selected environment, where its state stands, each deployment and its stores
```

To install applications of your own or use other stores, create the gitignored `environments/local.json`, which is selected automatically:

```json
{ "extends": "dev" }
```

Applications you install from the UI while it is selected are recorded in it. `MIROIR_ENV=<name>` selects another environment for one run.

**Release binary:** outside the repository (no `environments/` folder above the working directory, and no `MIROIR_ROOT`), or with `--config <path>`, the server reads a configuration file instead: the `--config` path, relative to the working directory, or by default `packages/miroir-server/config/miroirConfig.server.json` (for a `release/` folder copied elsewhere, its `config/miroirConfig.server.json`). Its `filesystemDeploymentRootDirectory` must point to a directory that contains both the `admin` and `miroir` application deployments:

```json
{
  "server": {
    "rootApiUrl": "https://localhost:3080",
    "filesystemDeploymentRootDirectory": "<path-to-your-deployments-directory>",
    "corsAllowedOrigins": ["https://localhost:3080"]
  }
}
```

`MIROIR_ROOT=<folder>` runs an environment outside a checkout instead: the folder holds `environments/` and the application assets. The Docker image works this way ([docker.md](../reference/docker.md)).


---


## 7. Start the server

The server now accepts parameters via explicit CLI flags:

- `--config <path>`: Path to a server configuration file, relative to the working directory or absolute, used instead of the selected environment (outside the repository the default is `../config/miroirConfig.server.json`, relative to the server bundle)
- `--certsdir <dir>`: Path to the directory containing TLS certificates (default: `<repo-root>/certs/`)
- `--cert <file>`: Path to the TLS certificate file (default: `<certsdir>/localhost.pem`)
- `--key <file>`: Path to the TLS key file (default: `<certsdir>/localhost-key.pem`)
- `--disable-auth` / `--enable-auth`: Startup hatch for user authentication (default **on**; last flag wins). See [Authentication](../reference/authentication.md).
- `--secrets-master-key <key>`: Wrapping key for Admin `MiroirSecret` rows (env `MIROIR_SECRETS_MASTER_KEY`). This is the **only standing launch secret** after named secrets have been imported. There is no ephemeral fallback. Generate it once: [Generate the wrapping key](../reference/authentication.md#generate-the-wrapping-key).
- `--secret <name>=<value>`: Repeatable **bootstrap import** of a process-scoped named secret (env `MIROIR_SECRET_<NAME>`). Also accepts AI key env aliases (`AI_OPENAI_KEY` → `aiOpenaiKey`, Anthropic / Google / GitHub equivalents, and `CURSOR_API_KEY` → `aiCursorKey`). A non-empty import without a wrapping key **fails startup**. Later launches drop these flags and keep only the wrapping key. See [Authentication — named secrets](../reference/authentication.md#named-secrets-270) and [Using AI in Miroir](using-ai.md).
- `-h`, `--help`: Show usage information

All parameters are optional; defaults are chosen to work out of the box for local development. You can override any of them as needed.

```sh
# Linux / macOS
NODE_ENV=production \
NODE_EXTRA_CA_CERTS="$(mkcert -CAROOT)/rootCA.pem" \
node packages/miroir-server/release/index.js [--config <config>] [--certsdir <dir>] [--cert <file>] [--key <file>]
```

```powershell
# Windows (PowerShell)
$env:NODE_ENV = "production"
$env:NODE_EXTRA_CA_CERTS = "$(mkcert -CAROOT)\rootCA.pem"
node packages\miroir-server\release\index.js [--config <config>] [--certsdir <dir>] [--cert <file>] [--key <file>]
```

```dos
REM Windows (cmd.exe)
set NODE_ENV=production
set NODE_EXTRA_CA_CERTS=<path-from-mkcert-CAROOT>\rootCA.pem
node packages\miroir-server\release\index.js [--config <config>] [--certsdir <dir>] [--cert <file>] [--key <file>]
```

The server is accessible at **https://localhost:3080** (or http://localhost:3080 if you skipped certificate generation). In production mode it also serves the web client there: open that URL in a browser.

### Development or production

The server reads its mode from `NODE_ENV`: `development` is development mode, any other value, or no value, is production mode.

| What | Production | Development |
|---|---|---|
| Start the server | `NODE_ENV=production node packages/miroir-server/release/index.js` | `NODE_ENV=development node packages/miroir-server/release/index.js` |
| Web client | served by the server, from `packages/miroir-server/release/client/` | Vite dev server: `npm run dev -w miroir-standalone-app` |
| Open | <https://localhost:3080> | <http://localhost:5173> |
| After changing client code | rebuild (below), then restart the server | reloaded by Vite |

Vite reloads the app's own sources. Components, hooks and themes that live in `@miroir-framework/react` reach the app through `packages/miroir-react/dist/`: run `npm run dev -w @miroir-framework/react` next to the Vite dev server, so it rebuilds them on save.

In production mode the server stops at startup if `release/client/index.html` is missing. `./build-all.sh` builds the client before the server binary, so it is in place after step 3. After changing client code, rebuild in this order:

```sh
npm run build -w miroir-standalone-app    # production build -> packages/miroir-standalone-app/dist/
npm run build:release -w miroir-server    # server binary, then copies dist/ to release/client/
```

`build:release` copies the client only if `miroir-standalone-app/dist/` exists. If it doesn't, the script prints a warning and the release has no web client. To refresh only the client in an existing release, run `npm run copy:client -w miroir-server` instead of `build:release`.

To persist named API secrets (Spotify, AI keys, per-user OAuth refresh tokens), [generate a wrapping key](../reference/authentication.md#generate-the-wrapping-key) and import once:

```sh
MIROIR_SECRETS_MASTER_KEY=<wrapping-key> \
node packages/miroir-server/release/index.js \
  --secret spotifyClientId=<id> \
  --secret spotifyClientSecret=<secret> \
  --secret spotifyRefreshToken=<refresh>
```

Later launches need only `MIROIR_SECRETS_MASTER_KEY` (or `--secrets-master-key`).

The GitHub example app needs no `--secret`: create a personal access token on GitHub (Settings, Developer settings, Personal access tokens; a fine-grained token with read access to your repositories is enough), then paste it on the app's home page. The server checks it with GitHub and saves it encrypted under the wrapping key.

---

## 8. (Optional) Build the Electron desktop application

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

## 9. (Optional) Docker build

If you prefer a container, the repo ships a multi-stage `Dockerfile` and a `docker-compose.yml`:

```sh
# Generate certs first (optional; server falls back to HTTP without them)
bash scripts/setup-https.sh
cp "$(mkcert -CAROOT)/rootCA.pem" certs/

# Build and start
docker compose up
```

Access the app at **http://localhost:3080** (or https if certs are present).

To decrypt persisted named secrets inside the container, pass `MIROIR_SECRETS_MASTER_KEY` (see `docker-compose.yml`). Generate that value with [Generate the wrapping key](../reference/authentication.md#generate-the-wrapping-key). Do not put named `--secret` values in the Compose file for steady-state runs.

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
