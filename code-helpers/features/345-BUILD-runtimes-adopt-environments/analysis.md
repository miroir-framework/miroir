# 345 — miroir-mcp, miroir-cli, Electron and Docker adopt environments

> Follow-up to #321 (decision D8): the four runtimes that still carry their own configuration take it from an environment (`environments/*.json`, state in `.miroir/<env>/`), like the server, the web client and the tests already do. This document records the current state of each runtime, the decisions (grilling round 1, 2026-09-30) and the reusable pieces.

- Issue: https://github.com/miroir-framework/miroir/issues/345
- Parent: #321, [analysis](../321-BUILD-environment-configuration/analysis.md) (D8, D10–D14, D18–D20), [current-state inventory](../321-BUILD-environment-configuration/current-state-inventory.md) §4
- Related: #344 (package split, role prefixes `miroir-app-` / `miroir-example-` / `miroir-fixture-`), #323 (the ncc server bundle ignores `--config`)
- Reference: [`docs/reference/environments.md`](../../../docs/reference/environments.md)
- Key sources: [`miroir-env/src/`](../../../packages/miroir-env/src/), [`miroir-core/src/1_core/environment/Environment.ts`](../../../packages/miroir-core/src/1_core/environment/Environment.ts), [`miroir-server/src/server.ts`](../../../packages/miroir-server/src/server.ts)

## Status / sequencing

| Step | State |
|---|---|
| #321 server, web client, tests, nonreg, cloud sessions on environments | ✅ merged (PR #327) |
| #344 package split | ✅ merged (PR #346, Docker fix #349) |
| **#345 mcp, cli, Electron, Docker** | **this issue** |
| #323 bundle ignores `--config` | later, separate (D13) |

## 1. Decision record

Grilling round 1 posted 2026-09-30 (questions in the project file `issue-345/grilling-round-1.md`). Work proceeds on the recommended answers until A answers; a changed answer is recorded here as a revision.

| # | Decision | Options | Chosen |
|---|---|---|---|
| D1 | Standalone miroir-mcp binary | (a) remove `bin`, `main()`, `configLoader.ts`, `configSchema.ts`, `defaultConfig.json`; MCP is served by miroir-server and Electron from their environment · (b) revive it on the selected environment, stores in process · (c) revive it as a client of a running server | **(a)**. It cannot start today (`main()` commented out); (b) opens the same `.miroir/dev` stores as a running server from a second process; (c) duplicates what the server already serves at `mcpUrl`. (b)/(c) **Rejected** for now. |
| D2 | miroir-mcp test environment | (a) `MIROIR_ENV` when it names a `test-*` environment, else `test-filesystem`; filesystem copies reseeded per test file · (b) always `test-filesystem` | **(a)**, the standalone-app rule |
| D3 | Shared helpers | (a) miroir-env gains a vitest-free `openTestEnvironment` (resolve, reseed, client config) and `bootEnvironment` (boot deployments + reconcile); server, cli, Electron and mcp tests use them · (b) copy the lines per package | **(a)** |
| D4 | Stores created at runtime by tests | (a) under `.miroir/<test env>/apps/` (`environmentAppsDirectory`), no manual Admin cleanup · (b) keep `miroir-mcp/tests/tmp` + cleanup | **(a)** |
| D5 | The 2 pre-existing miroir-mcp failures | (a) fix here when caused by stale test data or config · (b) separate issue | **(a)**. Both are stale test data (§3.1): fixed here. |
| D6 | How miroir-cli runs | (a) in-process emulated server on the selected environment (`MIROIR_ENV` / `local.json` / `dev`, `--env <name>`), booting every declared deployment; `defaultConfig.json`, `MIROIR_CLI_CONFIG_PATH`, `--config` removed · (b) client of a running server · (c) both | **(a)**; (b) **Deferred** |
| D7 | Runtimes outside a checkout | (a) `MIROIR_ROOT` (a directory holding `environments/` and the package assets) + an environment-level `packagesDirectory` (default `packages`) · (b) re-layout `/data` and Electron resources as `packages/<pkg>/assets`, migrating existing volumes | **(a)**: `/data` keeps its layout, existing volumes and UI-installed Deployment rows need no migration |
| D8 | Docker environment | tracked `environments/docker.json` (miroir, admin, library; `live` sections in `/data`, `packagesDirectory: "."`), shipped in `/seed/environments/`, copied by the unchanged seed-then-copy; `MIROIR_ROOT=/data MIROIR_ENV=docker`; `miroirConfig.server.docker.json` and the `docker/seed` Deployment overlay removed; both Dockerfiles; compose files lose the config-mount advice | **Accepted**. Spotify leaves the image (only its Deployment row was ever shipped, never its assets). |
| D9 | Electron in development | (a) main process selects the environment like the server, seeds, boots and reconciles; the renderer gets its client configuration over IPC · (b) renderer keeps opening stores from a configuration it receives | **(a)** |
| D10 | Packaged Electron | (a) bundle `environments/desktop.json` + package assets; first run copies them to `userData/miroir` (seed-then-copy) and runs with `MIROIR_ROOT` there · (b) keep writing into the resources copy | **(a)**: resources may be read-only (macOS) and are replaced on update |
| D11 | Tracked-assets guard | (a) mcp and cli integration tests join the nonreg filesystem tier between the `before` / `tracked-assets` steps; a pytest case per former write path; drop the `miroir-mcp/tmp*`, `miroir-cli/tests/tmp*` ignores once nothing writes there · (b) only extend the pathspecs | **(a)** |
| D12 | Verifying Electron and Docker | (a) headless tests of the Electron main-process boot and of the entrypoint (vitest / pytest); A runs `docker compose up` and one packaged build before merge · (b) xvfb and a Docker daemon in the cloud session | **(a)**, (b) opportunistically |
| D13 | #323 | (a) separate · (b) here | **(a)**: with environments Docker no longer relies on the bundle reading `release/miroirConfig.server.json` |

## 2. Goals / Non-goals

### Goals

1. **One way to configure every runtime.** In order to know which stores a run touches, as a framework developer, I can run the server, the CLI, Electron, the MCP tests and the Docker image and see each select its environment by `MIROIR_ENV` / `environments/local.json` / `dev` (or `MIROIR_ROOT` outside a checkout), with state in `.miroir/<env>/`.
2. **No tracked file written by a run.** In order to keep my working tree clean, as a framework developer, I can run the miroir-mcp and miroir-cli tests and Electron in development without any file under `packages/*/assets` or `packages/*/tests/assets` changing, and nonreg proves it.
3. **CLI on the applications I installed.** In order to script the applications of my environment, as an application developer, I can run `miroir-cli --env <name> <command>` on every deployment the environment declares (e.g. `lendDocument` on Library).
4. **Docker data survives upgrades.** In order to upgrade the image without losing data, as a Docker user, I can start a new image on an existing `/data` volume and keep my data; a new volume is seeded as today.
5. **Desktop data outside the app bundle.** In order to keep my data across Electron updates, as a desktop user, I can find my stores in the user-data folder, seeded on first start.

### Non-goals

- The ncc bundle ignoring `--config`: #323.
- Removing the server's legacy config-file path (`--config`, no `environments/` found): kept for #323 and ad-hoc runs.
- A CLI mode calling a running server (D6 (b)); a standalone MCP process (D1 (b)/(c)).
- Release artefact publishing (#224), consolidating the two Dockerfiles.

## 3. Current state

### 3.1 miroir-mcp

- [`src/index.ts:117-118`](../../../packages/miroir-mcp/src/index.ts): `console.warn("… library mode, not starting server automatically…"); // main();`. The `bin` entry `miroir-mcp` starts nothing.
- [`src/config/configLoader.ts`](../../../packages/miroir-mcp/src/config/configLoader.ts): `MIROIR_MCP_CONFIG_PATH`, else the embedded `defaultConfig.json`, validated by the zod `MiroirMcpConfigSchema` (`configSchema.ts`, `.strict()`, "TODO: should be identical to MiroirConfigClient").
- `defaultConfig.json` and `tests/config.mcp-emulatedServer.json` are identical: root `".."` (= `packages/` from the package directory), four deployments; **Admin `18db21bf`** model/data in the tracked `miroir-mcp/tests/assets/admin_{model,data}` (28 files), admin section `miroir-mcp/tests/assets/miroir_admin`; Miroir, Library, Spotify in `miroir-mcp/tests/tmp/…` (gitignored).
- `vitest.config.ts` sets `MIROIR_MCP_CONFIG_PATH` to the test config. Both integ tests (`mcpTools.integ`, `endpointToolRegistry.integ`) open every `deploymentStorageConfig` entry themselves, then `resetAndInitApplicationDeployment` Miroir and Library.
- Consumers of the package: `miroir-server` and `miroir-standalone-app-electron` import `EndpointToolRegistry`, `setupMcpServer`; the standalone app imports `miroir-mcp/client`. Nothing imports `loadMiroirMcpConfig` outside the package tests.
- Baseline on `_integration` 1b87835 (fresh `./build-all.sh`), `npm run testByFile -w miroir-mcp`: 90 passed, **2 failed**:
  - `mlElementToTS.unit` "should resolve schemaReference for applicationSection": expects `"model" | "data"`, the schema now has `"model" | "data" | "modelVersion"`.
  - `endpointToolRegistry.integ` "discovers a deployment added at runtime": `resetAndinitializeDeploymentCompositeAction` writes `modelVersion` instances and the PingApp store configuration has no `modelVersion` section (`FailedToOpenStore: modelVersion section is not configured for this deployment`).
  - No tracked file changed after the run (the Admin writes were reverted by the tests' own resets).

### 3.2 miroir-cli

- [`src/config/configLoader.ts`](../../../packages/miroir-cli/src/config/configLoader.ts): `MIROIR_CLI_CONFIG_PATH`, else `defaultConfig.json`; `-c/--config` sets the variable (`src/index.ts`).
- `defaultConfig.json`: Miroir in `./tests/tmp/miroir_*`, Admin in `./tests/assets/{miroir_admin,admin_model,admin_data}`, which do not exist (not tracked). Only Miroir and Admin are opened, so the generated `lendDocument` command has no Library store.
- The zod schema has no `filesystemDeploymentRootDirectory`, yet `src/startup/setup.ts:86` passes `miroirConfig.client.filesystemDeploymentRootDirectory` (always `undefined`: paths resolve from the working directory); `setup.ts:55` reads `client.serverConfig.rootApiUrl`, absent from the schema.
- `tests/cli.integ.test.ts` uses `tests/config.cli-emulatedServer.json` (same as default without `mcpUrl`). The CLI is not in `scripts/nonreg-manifest.json`.
- Baseline on 1b87835: `npm run testByFile -w miroir-cli` fails in `beforeAll`, 7 tests skipped (`addPersistenceStoreController no filesystemDeploymentRootDirectory provided`, the stripped field). The CLI cannot start either.

### 3.3 Electron (`miroir-standalone-app-electron`)

- Main process [`src/ipcServerSetup.ts`](../../../packages/miroir-standalone-app-electron/src/ipcServerSetup.ts) `setupIpcServer`: root from `app.config.json` (`development`: `".."`, `production`: `"./resources/miroir-assets"`, fallback `os.homedir()`), an inline `MiroirConfigServer`, no environment. It opens no store itself.
- Renderer [`miroir-standalone-app/src/index.tsx:406-560`](../../../packages/miroir-standalone-app/src/index.tsx): an inline `electronMiroirConfig` (Admin at `miroir-app-admin/assets/admin_*`), opens the tracked `deployment_Admin` and `deployment_Miroir` rows over IPC, queries Admin Deployment rows and opens the others.
- **Development writes Admin data into the tracked `packages/miroir-app-admin/assets/admin_data`** (root `packages/`), covered by the guard pathspecs but never exercised by nonreg.
- Packaged: `build.extraResources` copies `miroir-app-admin/assets/{admin_data,admin_model}`, `miroir-app-miroir/assets` and the Library bundles under `resources/miroir-assets`; the app writes there.

### 3.4 Docker

- Release image [`docker/miroir-server/Dockerfile`](../../../docker/miroir-server/Dockerfile) (CI `build-linux-runnables.yml` docker job): `release/` bundle, `miroirConfig.server.docker.json` copied to `release/miroirConfig.server.json` (works only because of #323), `/seed` = `packages/miroir-server/docker/seed` alone (two Deployment rows: Library `f714bb2f`, Spotify `fd47d115`), although the header says it seeds Miroir, Admin and Library.
- Root [`Dockerfile`](../../../Dockerfile) (compose): full build, same config copy, `/seed` = `miroir-app-miroir/{assets,src}`, `miroir-app-admin/assets`, `miroir-example-library/assets/library_{model,data}`, then the `docker/seed` overlay.
- [`packages/miroir-server/docker-entrypoint.sh`](../../../packages/miroir-server/docker-entrypoint.sh): empty `/data` → `cp -r /seed/. /data/`; otherwise the #344 rename migration; TLS; `exec "$@"`.
- Neither image has `environments/`: `server.ts:232-245` `loadEnvironment()` returns `undefined`, the server takes the config-file path and opens `deployment_Admin` / `deployment_Miroir` from the Admin package.
- Compose files advise mounting a config at `/miroir/packages/miroir-server/config/miroirConfig.server.json`, which the bundle never reads (#323).

### 3.5 Guard

- [`scripts/tracked_assets_guard.py`](../../../scripts/tracked_assets_guard.py) and `miroir-env/src/trackedAssets.ts`: pathspecs `packages/*/assets/**`, `packages/*/tests/assets/**`, `packages/*/tests/test_assets/**` (gitignored files out of scope). Nonreg: first step `unit-321-environment-before` snapshots, last step `unit-321-tracked-assets` checks. The pathspecs already cover every path these runtimes wrote; what is missing is a nonreg run of the mcp and cli tests between the two steps.

### 3.6 Aligned vs misaligned

| Piece | State |
|---|---|
| `resolveEnvironmentFromFiles` | aligned; finds the root by walking up to a `package.json` with `workspaces`: **misaligned** for Docker and packaged Electron (D7) |
| `applicationAssetsDirectory` | hardcodes `packages/${package}/assets`: **misaligned** for `/data` (D7) |
| `openEnvironmentBootDeployments` + `reconcileEnvironmentDeployments` | aligned; the server calls them with a secrets step in between; the other runtimes need both in one call (D3) |
| `openTestEnvironment` | aligned, but in `miroir-standalone-app/tests/helpers`, tied to vitest `expect` (D3) |
| mcp/cli own zod config schemas | **misaligned**: duplicate `MiroirConfigClient` (D1, D6) |

## 4. Key reuse

| Piece | Location |
|---|---|
| `resolveEnvironmentFromFiles`, `selectEnvironment`, `findRepositoryRoot` | `packages/miroir-env/src/environmentFiles.ts` |
| `seedEnvironmentState`, `environmentClientConfig`, `environmentServerConfig`, `environmentRealServerClientConfig` | `packages/miroir-env/src/environmentState.ts` |
| `openEnvironmentBootDeployments`, `reconcileEnvironmentDeployments` | `packages/miroir-env/src/openEnvironment.ts` |
| `recordInstallsOf` | `packages/miroir-env/src/recordInstalls.ts` |
| `openTestEnvironment`, `selectedTestEnvironment` | `packages/miroir-standalone-app/tests/helpers/testEnvironment.ts` |
| `deriveEnvironmentDeployments`, `applicationAssetsDirectory`, `environmentAppsDirectory`, `isTestEnvironment` | `packages/miroir-core/src/1_core/environment/Environment.ts` |
| `miroirEnvironment` ML schema | `packages/miroir-core/src/0_interfaces/1_core/bootstrapMlSchemas/getMiroirFundamentalMlSchema.ts` (`miroirEnvironment`, `miroirEnvironmentApplication`) |
| Server boot tests to mirror | `packages/miroir-env/tests/serverBootFromEnvironment.integ.test.ts`, `bootTestSupport.ts` |
| Guard | `scripts/tracked_assets_guard.py`, `scripts/tests/` |
| Deployments | Miroir `360fcf1f…` / `10ff36f2…`, Admin `55af124e…` / `18db21bf…`, Library `5af03c98…` / `f714bb2f…`, Spotify `00514586…` / `fd47d115…` |

## 5. Target design

- **miroir-env** gains `MIROIR_ROOT` (root given, no search), `openTestEnvironment` (from the standalone app, `reseed` decided by the caller) and `bootEnvironment(domainController, resolved)` (boot + reconcile, returns the reconciliation). **miroir-core** gains `packagesDirectory` on `miroirEnvironment`, read by `applicationAssetsDirectory`.
- **miroir-mcp**: library only. Tests open `openTestEnvironment(selected ?? "test-filesystem")`, `setupMiroirPlatform(miroirConfig)`, `bootEnvironment`; PingApp stores in `environmentAppsDirectory`. `storeStartup` derives store types from a `MiroirConfigClient`.
- **miroir-cli**: resolves the selected environment (`--env` = `MIROIR_ENV`), seeds, `environmentClientConfig`, `bootEnvironment`; only `logConfig` survives, from the environment's log preset or defaults.
- **Electron**: main process resolves (`MIROIR_ROOT` = `userData/miroir` when packaged, after a first-run copy of `resources/miroir-assets`), seeds, boots and reconciles; IPC `get-client-config`; the renderer drops its inline config and store opening.
- **Docker**: `environments/docker.json`, `/seed/environments/`, `MIROIR_ROOT=/data`, `MIROIR_ENV=docker` in both images; the entrypoint also copies `environments/` into an existing volume that lacks it (volumes seeded before #345).
- **Nonreg**: `unit-345-mcp` and `unit-345-cli` steps on the filesystem tier; docs `environments.md` lists every runtime.

Implementation order and tests: [`tdd-implementation-plan.md`](tdd-implementation-plan.md).
