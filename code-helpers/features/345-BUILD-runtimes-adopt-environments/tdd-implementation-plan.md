# Issue #345 — TDD Implementation Plan

> Integration-first, no mocks: every runtime is proven by booting it on a real environment (real DomainController, filesystem stores seeded in `.miroir/<env>/`, the `RestClientStub` emulated server) and checking which deployments it opened and that no tracked file changed. All behaviours here are runtime wiring (process start, store opening, packaging), not reachable through MiroirTest: the vehicle is vitest (`testByFile`) for TypeScript and pytest for the Python guard and the Docker entrypoint.

**Resume note:** Slices land in order on branch `claude/issue-345-environments-cybafu`; the progress table is the source of truth. Defaults are the grilling round 1 recommendations until A answers.

## Scope

In: miroir-mcp (tests on environments, standalone config removed), miroir-cli (environment selection), Electron (dev and packaged), Docker (both Dockerfiles, entrypoint, compose), `MIROIR_ROOT` + `packagesDirectory`, guard coverage in nonreg, docs.

Out: #323 (bundle ignores `--config`); the server's legacy config-file path; CLI as a client of a running server; a standalone MCP process; release publishing (#224).

## Related links

- Issue: https://github.com/miroir-framework/miroir/issues/345
- [analysis.md](analysis.md)
- Parent plan: [#321 tdd-implementation-plan](../321-BUILD-environment-configuration/tdd-implementation-plan.md)
- Branch: `claude/issue-345-environments-cybafu`, PR base `_integration`

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Characterize: mcp baseline, guard on former write paths | ✅ DONE | `scripts/tests/test_tracked_assets_guard.py` cases; mcp baseline recorded |
| 1 | miroir-mcp tests run on a test environment (tracer) | ✅ DONE | `mcpTools.integ`, `endpointToolRegistry.integ` green on `test-filesystem`, `tests/assets/admin_*` removed |
| 2 | miroir-mcp standalone configuration removed | ✅ DONE | package builds, server and Electron typecheck, mcp tests green |
| 3 | miroir-cli runs on the selected environment | ✅ DONE | `cli.integ` on `test-filesystem`: `lendDocument` on Library |
| 4 | An environment runs outside a checkout (`MIROIR_ROOT`, `packagesDirectory`) | ✅ DONE | `miroir-env` test booting the server config from a `/data`-like temp root |
| 5 | Docker images start from the `docker` environment | ⬜ pending | pytest on `docker-entrypoint.sh`; `miroir-env` test on `environments/docker.json` over a seed layout |
| 6 | Electron dev boots its environment in the main process | ⬜ pending | vitest on the main-process boot (no Electron window) |
| 7 | Packaged Electron seeds user data and runs from it | ⬜ pending | vitest on the first-run copy + boot of `desktop` |
| 8 | Nonreg, docs, AC checklist | ⬜ pending | `npm run nonreg:filesystem -- --runner shared` |

## Locked implementation defaults

Decisions D1–D13 of [analysis.md §1](analysis.md#1-decision-record), unchanged:

- D1 remove the standalone mcp binary and config; D2 mcp tests on `MIROIR_ENV` (`test-*`) else `test-filesystem`; D3 `openTestEnvironment` + `bootEnvironment` in miroir-env; D4 runtime-created test stores in `.miroir/<env>/apps/`; D5 fix the 2 mcp failures; D6 CLI in process on the selected environment, `--env`; D7 `MIROIR_ROOT` + `packagesDirectory`; D8 `environments/docker.json`; D9 Electron main process owns the boot; D10 packaged Electron seeds `userData/miroir`; D11 mcp/cli tests in nonreg; D12 headless proofs, A checks Docker and a packaged build; D13 #323 separate.

## Allocated keys

| Key | Kind |
|---|---|
| `environments/docker.json` | tracked environment definition |
| `environments/desktop.json` | tracked environment definition |
| `MIROIR_ROOT` | environment variable (miroir-env) |
| `packagesDirectory` | `miroirEnvironment` field |
| `unit-345-mcp`, `unit-345-cli` | nonreg manifest steps (filesystem tier) |
| `get-client-config` | Electron IPC request kind on `miroir-ipc` |

No new model uuid. The `miroir-env` tests reuse `packages/miroir-env/tests/bootTestSupport.ts`.

## Test execution conventions

| What | Command |
|---|---|
| miroir-env tests | `npm run test -w miroir-env` (after `npm run build -w miroir-env`) |
| mcp tests | `npm run testByFile -w miroir-mcp` |
| cli tests | `npm run testByFile -w miroir-cli` |
| Electron main tests | `npm run testByFile -w miroir-standalone-app-electron -- <name>` |
| Guard / entrypoint | `python -m pytest scripts/tests -q` |
| Schema regeneration | `npm run devBuild -w miroir-core` |
| Typecheck | `npx tsc --noEmit --skipLibCheck -p packages/<pkg>/tsconfig.json` |
| Pre-push gate | `AGENTS.md` "Pre-push gate" |
| Nonreg | `npm run nonreg:filesystem -- --runner shared` (every 2 or 3 slices) |

---

## Slice 0 — Characterize

**Status:** ✅ DONE

**Goal:** lock what the guard already detects and the mcp baseline, so later slices can remove files safely.

**RED/characterization:**
- `scripts/tests/test_tracked_assets_guard.py`: in a temp git repo, a change under each former write path (`packages/miroir-mcp/tests/assets/admin_data/x.json`, `packages/miroir-cli/tests/assets/admin_data/x.json` untracked, `packages/miroir-app-admin/assets/admin_data/x.json`) makes `check --since` fail. Expected green at once (characterization).
- Baseline recorded in the analysis §3.1 (90 passed, 2 failed, causes).

**Refactor checkpoint:** none.

**Validation:** `python -m pytest scripts/tests -q`.

### Realization

`test_former_runtime_write_paths_are_reported` (4 cases: mcp `tests/assets/admin_data`, mcp `tests/assets/miroir_admin`, cli `tests/assets/admin_data`, Admin package `admin_data`) green at once: the pathspecs already cover every path, as the analysis §3.5 says. mcp baseline on 1b87835: 90 passed, 2 failed (analysis §3.1).

---

## Slice 1 — miroir-mcp tests on a test environment (tracer)

**Status:** ✅ DONE

**Goal:** the mcp integration tests open the stores of `test-filesystem` (or the `test-*` `MIROIR_ENV`), boot like the server, and no longer use `tests/assets/admin_*`.

**RED:** `endpointToolRegistry.integ.test.ts` and `mcpTools.integ.test.ts` `beforeAll` switch to `openTestEnvironment` + `bootEnvironment` from miroir-env (not exported yet: RED on import). A new assertion: after the run, the boot opened the Admin deployment `18db21bf` from `.miroir/test-filesystem/admin`.

**GREEN:**
- miroir-env: `openTestEnvironment(name, { env, reseed })` (vitest-free version of the standalone-app helper), `selectedTestEnvironment(env, warn)`, `bootEnvironment(domainController, resolved)` = `openEnvironmentBootDeployments` + `reconcileEnvironmentDeployments`.
- standalone-app `tests/helpers/testEnvironment.ts` delegates to them (keeps its per-test-file seeding record).
- mcp tests: config from `openTestEnvironment`, `setupMiroirPlatform(miroirConfig)`, `bootEnvironment`; PingApp stores under `environmentAppsDirectory(env)` with a `modelVersion` section; manual Admin cleanup removed (D4, D5).
- `mlElementToTS.unit`: expectation `"model" | "data" | "modelVersion"` (D5).
- `git rm -r packages/miroir-mcp/tests/assets tests/config.mcp-emulatedServer.json`; `vitest.config.ts` drops `MIROIR_MCP_CONFIG_PATH`; miroir-env becomes a devDependency of miroir-mcp.

**Refactor checkpoint:** the two mcp integ files share their `beforeAll`: extract `tests/integration/mcpTestPlatform.ts`.

**Validation:** `npm run build -w miroir-env && npm run test -w miroir-env`; `npm run testByFile -w miroir-mcp` (all green); standalone-app `testEnvironment` unit tests; `git status --short packages` clean after the run; typecheck miroir-mcp, miroir-env, miroir-standalone-app.

### Realization

- miroir-env: `src/testEnvironment.ts` (`openTestEnvironment`, `selectedTestEnvironment`, vitest-free; `reseed` also wipes `.miroir/<env>/apps/`, so a test file does not find the stores an earlier one installed) and `bootEnvironment` in `openEnvironment.ts`; `tests/bootTestSupport.ts` boots through it; 3 new cases in `testEnvironments.unit.test.ts`.
- standalone-app `tests/helpers/testEnvironment.ts` delegates, keeping its per-test-file seeding record and logger.
- miroir-mcp: `tests/integration/mcpTestPlatform.ts` (`startMcpTestPlatform`) replaces the two copied `beforeAll`s; the `applicationDeploymentMap` comes from the reconciliation; `tests/assets/` (28 files) and `tests/config.mcp-emulatedServer.json` removed; `MIROIR_MCP_CONFIG_PATH` gone from `vitest.config.ts`; miroir-env added as a devDependency (lockfile edited by hand: a local `npm install` rewrote unrelated `peer` flags).
- D5: PingApp stores in `environmentAppsDirectory(env)` with a `modelVersion` section, manual Admin cleanup removed; `mlElementToTS` expectation includes `modelVersion`. The dead close-store loop of `mcpTools.integ` removed.
- Result: miroir-mcp 92/92 (was 90/92), twice in a row for `endpointToolRegistry`; no tracked file changed; miroir-env 40/40.

---

## Slice 2 — Standalone mcp configuration removed

**Status:** ✅ DONE

**Goal:** miroir-mcp is a library: no `bin`, no `main()`, no private config schema; store start-up follows a `MiroirConfigClient`.

**RED:** `tests/unit/mcpPackageSurface.unit.test.ts`: the package exports no `loadMiroirMcpConfig`, and `initializeStoreStartup(environmentClientConfig(...))` registers the filesystem store for `test-filesystem`.

**GREEN:** delete `src/config/*`, the `main()` / signal handlers of `src/index.ts`, the `bin` entry and `copy-files`; `storeStartup.ts` and `setupLogging` take `MiroirConfigClient` (`client.deploymentStorageConfig`); README updated.

**Refactor checkpoint:** `openStores` in `mcpServer.ts` has no caller left: delete it.

**Validation:** `npm run build -w miroir-mcp`; `npm run testByFile -w miroir-mcp`; typecheck miroir-mcp, miroir-server, miroir-standalone-app-electron.

### Realization

- `src/config/` (loader, zod schema, `defaultConfig.json`) removed; `src/index.ts` is exports only (no `main()`, no signal handlers); `bin`, `copy-files`, `dev` scripts and the `copyfiles` devDependency removed (lockfile edited to match, `npm ci --dry-run` clean).
- `storeStartup.ts`: `requiredStoreTypes(MiroirConfigClient)` (emulated `deploymentStorageConfig` or real-server `storeSectionConfiguration`, every section including `modelVersion`) and `initializeStoreStartup(MiroirConfigClient)`.
- `mcpServer.ts`: `setupLogging` and `openStores` removed (no caller left).
- `tests/unit/mcpPackageSurface.unit.test.ts` (2 tests). README rewritten around "Where MCP runs".
- Result: miroir-mcp 94/94; miroir-mcp, miroir-server, Electron typecheck clean.

---

## Slice 3 — miroir-cli on the selected environment

**Status:** ✅ DONE

**Goal:** `miroir-cli [--env <name>] <command>` opens every deployment of the selected environment; Library commands work.

**RED:** `tests/cli.integ.test.ts` starts the platform through the CLI's exported `initializePlatform({ env: { MIROIR_ENV: "test-filesystem" } })` and runs `lendDocument` on Library, then `getInstances` on Library books.

**GREEN:** `src/config/*` removed; `initializePlatform` resolves the environment (`--env` sets `MIROIR_ENV`), `seedEnvironmentState`, `environmentClientConfig`, `setupMiroirPlatform`, `bootEnvironment`; `setup.ts` reads `client.filesystemDeploymentRootDirectory` from the environment config (fixes the stripped field). The CLI refuses nothing but logs the environment and its source like the server.

**Refactor checkpoint:** `miroir-cli/src/startup/*` and `miroir-mcp/src/startup/*` are the same code: keep the mcp one as the source only if the CLI can depend on miroir-mcp without a cycle; otherwise note duplication.

**Validation:** `npm run build -w miroir-cli && npm run testByFile -w miroir-cli`; typecheck miroir-cli; `git status --short packages` clean.

### Realization

- Baseline: the CLI tests could not start (0/7, all skipped) and neither could the CLI: its zod schema stripped `filesystemDeploymentRootDirectory` (analysis §3.2).
- `src/platform.ts` `initializePlatform({ cwd, env, name })`: resolve (`--env` = `name`), `seedEnvironmentState`, `environmentClientConfig`, store start-up, `setupMiroirPlatform`, `bootEnvironment`; logs the environment and its source like the server. `index.ts` imports it (the entry runs `main()` on import, so the test cannot import from it); `-e, --env <name>` replaces `-c, --config`; the CLI exits explicitly after the command (open stores keep the event loop alive).
- `src/config/`, `tests/config.cli-emulatedServer.json`, `MIROIR_CLI_CONFIG_PATH`, `copy-files` and `copyfiles` removed; miroir-env added as a dependency. `storeStartup.ts` is the miroir-mcp one (duplicated: `setup.ts` and `storeStartup.ts` stay copies, the CLI does not depend on miroir-mcp).
- The test's `deleteInstance` payload used the pre-`objects: EntityInstance[]` shape; aligned with the mcp test case.
- Result: miroir-cli 7/7 on `test-filesystem`; `node dist/index.js --env test-filesystem getInstances -p …` returns the Library books and exits 0.

---

## Slice 4 — An environment runs outside a checkout

**Status:** ✅ DONE

**Goal:** with `MIROIR_ROOT=<dir>`, `resolveEnvironmentFromFiles` reads `<dir>/environments/` and runs with `<dir>` as filesystem root; `packagesDirectory: "."` places package assets at `<dir>/<package>/assets`.

**RED:** `packages/miroir-env/tests/environmentRoot.integ.test.ts`: a temp root with `environments/x.json` (`packagesDirectory: "."`) and `miroir-app-admin/assets`, `miroir-app-miroir/assets` copies; resolve with `MIROIR_ROOT`, boot the server config (`bootTestSupport`), Admin opens from `<root>/miroir-app-admin/assets/admin_model`.

**GREEN:** miroir-core schema `miroirEnvironment.packagesDirectory` (string, optional) in `getMiroirFundamentalMlSchema.ts` → `npm run devBuild -w miroir-core`; `applicationAssetsDirectory` takes it; `seedEnvironmentState` and `stateCommands` pass it; miroir-env `ROOT_VARIABLE = "MIROIR_ROOT"`, `hasEnvironmentDefinitions` / `resolveEnvironmentFromFiles` honour it; server `loadEnvironment` unchanged (it uses them).

**Refactor checkpoint:** `applicationAssetsDirectory` callers pass the whole environment rather than a field.

**Validation:** `npm run devBuild -w miroir-core`; miroir-env tests; `npm run test -w miroir-core -- ''`; typecheck miroir-core, miroir-env, miroir-server; `npm run miroir-env -- check --strict`.

### Realization

- miroir-core: `miroirEnvironment.packagesDirectory` (optional string) in `getMiroirFundamentalMlSchema.ts`, types regenerated (`devBuild`); `applicationAssetsDirectory(…, packagesDirectory = DEFAULT_PACKAGES_DIRECTORY)`, `.` gives `<package>/assets`; `sectionDirectory` passes the environment's.
- miroir-env: `ROOT_VARIABLE = "MIROIR_ROOT"`, `environmentRoot(cwd, env)` (MIROIR_ROOT resolved from `cwd`, else the repository root search); `resolveEnvironmentFromFiles`, `hasEnvironmentDefinitions(cwd, env)` and `miroir-env check` use it; `seedEnvironmentState`, Admin row labels and the legacy Admin data lookup pass `packagesDirectory`. The legacy lookup already skips a live Admin data section (`legacy !== adminData`).
- miroir-server: `hasEnvironmentDefinitions(process.cwd(), process.env)`, so `MIROIR_ROOT` selects the environment path.
- Refactor checkpoint: callers pass `packagesDirectory` as a 4th argument rather than the whole environment; kept, the other fields of the environment are not needed there.
- `tests/environmentRoot.integ.test.ts` (3 tests, RED on "no repository root"). miroir-env 43/43, miroir-core 2133/2134 (1 skipped), `miroir-env check --strict` ok.

---

## Slice 5 — Docker starts from the `docker` environment

**Status:** ⬜ pending

**Goal:** both images ship `environments/docker.json` in `/seed`, run with `MIROIR_ROOT=/data MIROIR_ENV=docker`, keep seed-then-copy, and no longer need `miroirConfig.server.docker.json`.

**RED:**
- `scripts/tests/test_docker_entrypoint.py`: runs the entrypoint with `SEED_DIR` / `DATA_DIR` overrides and `true` as command: an empty data dir receives the seed including `environments/docker.json`; a non-empty one lacking `environments/` receives it; an existing `environments/` is left as is.
- `packages/miroir-env/tests/dockerEnvironment.integ.test.ts`: a temp `/data` laid out like `/seed` (copies of the three packages' assets + `environments/docker.json`), boot + reconcile: Admin, Miroir and Library open; the Deployment rows in Admin data point inside the root.

**GREEN:** `environments/docker.json` (miroir, admin, library, `live`, `packagesDirectory: "."`, server `rootApiUrl` / `mcpUrl` / cors from `miroirConfig.server.docker.json`, features ai + mcp); `SEED_DIR`/`DATA_DIR` overridable in the entrypoint, plus the `environments/` top-up; root `Dockerfile` and `docker/miroir-server/Dockerfile`: copy package assets and `environments/docker.json` into `/seed`, `ENV MIROIR_ROOT=/data MIROIR_ENV=docker`, drop the config copy and `docker/seed`; compose files and `scripts/start-docker.sh` comments; delete `packages/miroir-server/config/miroirConfig.server.docker.json` and `packages/miroir-server/docker/seed/`. `miroir-env check` ignores `docker` / `desktop` for `--tracked-clean` layouts (they only resolve under their own root).

**Refactor checkpoint:** the docker environment definition validates in `miroir-env check` from the repository (it is resolvable: `packagesDirectory` only changes paths).

**Validation:** `python -m pytest scripts/tests -q`; miroir-env tests; `npm run miroir-env -- check --strict`; `docker build .` if a daemon is available, else A before merge (D12).

### Realization

---

## Slice 6 — Electron dev boots its environment

**Status:** ⬜ pending

**Goal:** in development the Electron main process selects the environment like the server, seeds, boots, reconciles and serves the client configuration; the renderer opens nothing and writes no tracked file.

**RED:** `packages/miroir-standalone-app-electron/tests/mainProcessBoot.integ.test.ts`: `bootElectronServer({ env: { MIROIR_ENV: "test-filesystem" } })` (the non-Electron half of `setupIpcServer`) returns a domain controller with Admin, Miroir and Library open, and `clientConfig()` gives `emulateServer: true` with the environment's deployment storage.

**GREEN:** `src/environmentBoot.ts` (resolve, seed, `environmentServerConfig`, domain controller, `bootEnvironment`, `recordInstallsOf` for `local.json`); `setupIpcServer` uses it; IPC `get-client-config`; renderer `index.tsx` Electron branch replaced by the configuration from IPC; `app.config.json` loses `filesystemDeploymentRootDirectory`; `get-default-filesystem-folder` returns the environment root.

**Refactor checkpoint:** the server and Electron boot sequences share `bootEnvironment`; the renderer's Admin query code is gone.

**Validation:** Electron test; `npm run build-electron -w miroir-standalone-app-electron` (tsc + esbuild); typecheck miroir-standalone-app; bundle policy check.

### Realization

---

## Slice 7 — Packaged Electron runs from user data

**Status:** ⬜ pending

**Goal:** a packaged app copies `resources/miroir-assets` to `userData/miroir` on first start and runs `desktop` with `MIROIR_ROOT` there.

**RED:** same test file: `prepareDesktopRoot({ resources, userData })` on temp dirs copies once (second call keeps user changes), then `bootElectronServer({ root })` opens Admin, Miroir and Library.

**GREEN:** `environments/desktop.json` (like `docker`, `packagesDirectory: "."`, loopback server settings); `extraResources` adds `environments/desktop.json` and the Library assets under `miroir-assets`; `main.ts` sets `MIROIR_ROOT` / `MIROIR_ENV=desktop` when `app.isPackaged`.

**Refactor checkpoint:** the first-run copy is the same rule as the Docker entrypoint (copy when empty, top up `environments/`); keep both behaviours identical and documented together.

**Validation:** Electron tests; `npm run build-electron -w miroir-standalone-app-electron`; A runs one packaged build before merge (D12).

### Realization

---

## Slice 8 — Nonreg, docs, AC checklist

**Status:** ⬜ pending

**Goal:** the guard watches the mcp and cli tests in nonreg, docs list every runtime.

**GREEN:** `scripts/nonreg-manifest.json` steps `unit-345-mcp` (`npm run testByFile -w miroir-mcp`) and `unit-345-cli` in the filesystem tier, before `unit-321-tracked-assets`; `.gitignore` drops `packages/miroir-mcp/tmp*` and `packages/miroir-cli/tests/tmp*` if nothing writes there; `docs/reference/environments.md` gets a "Runtimes" table (server, web client, tests, cloud sessions, miroir-cli, miroir-mcp, Electron dev/packaged, Docker) and the `MIROIR_ROOT` / `packagesDirectory` fields; `docs/reference/testing.md` mentions the mcp/cli environments; miroir-cli and miroir-mcp READMEs.

**Tracer narrative:** `MIROIR_ENV=test-filesystem npm run testByFile -w miroir-mcp` → `.miroir/test-filesystem/` seeded, stores opened by `bootEnvironment`, tracked files untouched; `docker compose up` on an old volume → `environments/` topped up, server logs `environment: docker, selected by MIROIR_ENV`.

**Validation:** pre-push gate; `npm run nonreg:filesystem -- --runner shared`.

### AC checklist

| AC | Proof |
|---|---|
| mcp resolves its stores from an environment, `tests/assets/admin_*` removed, tests on `test-<storage>` | Slice 1, 2 |
| cli resolves its stores from an environment, `defaultConfig.json` removed | Slice 3 |
| Electron starts from an environment, writes run state outside tracked files | Slice 6, 7 |
| Docker builds its configuration from an environment definition, seed-then-copy kept, release image works | Slice 5 (+ A's image check) |
| Guard covers the files these runtimes used to write | Slice 0, 8 |
| `environments.md` lists every runtime | Slice 8 |
| Pre-push gate and `nonreg:filesystem -- --runner shared` pass | Slice 8 |

### Realization
