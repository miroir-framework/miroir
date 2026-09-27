# Issue #321 — TDD Implementation Plan

> Vertical TDD slices (RED → GREEN each), integration-first per `docs/contributing/testing.md`.
> Pure resolution (definition → deployments, configs) is exercised through MiroirTest `functionCallTest`;
> the `miroir-env` package (files, seeding, CLI) and the server / test-session boot are exercised through
> vitest against real filesystem stores in temporary directories and the real `emulatedServer-*` machinery.
> No mocks. The tracer bullet proves that `miroir-env show` resolves today's `dev` setup from one file.
>
> **Execution model:** human-in-the-loop. No slice contains a commit step — commits happen
> only when the user explicitly asks. Each slice ends with its Validation commands; on
> success its Realization summary is appended and its Status flips to ✅ DONE.

Analysis: [`./analysis.md`](./analysis.md) · Inventory: [`./current-state-inventory.md`](./current-state-inventory.md) · Issue: https://github.com/miroir-framework/miroir/issues/321
Related: #323 (server bundle ignores `--config`; Slice 3 must not rely on `--config`)
Working branch: `claude/environment-configuration-7z5rjb` (from `_integration`)

**Resume note:** approved by A 2026-09-27. Slices 0–8 DONE (5 in two commits: 5a environments for every profile, 5b test Admin copy and emulated profile files removed; 8 in 8a web client, 8b realServer profiles, plus a harness fix; 9 cloud sessions and PR checks; 10 in 10a in-app realServer profiles, 10b CI and configuration files, 10c Admin copies; 11 in 11.1 nonreg, 11.2 docs, 11.3 test names, 11.4 acceptance). Slices 0–11 DONE: the plan is complete.

---

## Scope

- ML schema `miroirEnvironment` and the pure resolver in miroir-core; node-only package `miroir-env` with the `miroir-env` command.
- Tracked environments `dev`, `test-filesystem`, `test-sql`, `test-indexedDb`, `test-mongodb`, `cloud-agent`; gitignored `environments/local.json` and `.miroir/`.
- miroir-server, the Vite client, the test launchers, nonreg and the cloud-session setup read the selected environment.
- Admin data leaves git (seed only); tests stop writing into tracked files; deviation warnings and CI check.
- Removal of dead / Jenkins-era configuration and of the drifted Admin copies.

This plan does **not** touch the release path, Docker, Electron, miroir-cli or standalone miroir-mcp runtime (D8, follow-ups), rename packages (D9, follow-up), or fix #323.

---

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Characterize tracked writes and today's deployment map | ✅ | `scripts/tests/test_tracked_assets_guard.py`, `unit-321-tracked-assets` baseline |
| 1 | Tracer: `miroir-env show` resolves `dev` | ✅ | MiroirTest `fn.environment.deriveDeployments` + `miroirEnvShow.unit.test.ts` |
| 2 | Personal environment: `local.json`, `MIROIR_ENV`, `extends` | ✅ | `fn.environment.resolveEnvironment` (merge leaves) + CLI test |
| 3 | Server boots from the environment, Admin data in state | ✅ | `miroir-env/tests/serverBootFromEnvironment.integ.test.ts` |
| 4 | Tests run on `test-filesystem` without tracked writes | ✅ | `nonreg:filesystem` + tracked-assets guard clean; `testEnvironmentConfig.unit.test.ts` |
| 5 | `test-sql`, `test-indexedDb`, `test-mongodb`; profile JSONs and test Admin copy retired | ✅ | `nonreg:default` (Postgres) + guard |
| 6 | Reconciliation, deviation warnings, `check` / `import` / `prune` | ✅ | `miroirEnvReconcile.integ.test.ts` |
| 7 | UI installs land in state and are recorded in `local.json` | ✅ | MiroirTest `runner.deployApplication` + `recordInstalls.integ.test.ts` |
| 8 | Web client config from the environment | ✅ | `viteEnvironmentConfig.unit` + `realServerTestEnvironment.unit` + manual run |
| 9 | Cloud sessions and CI | ✅ | pytest for `agent_session_setup.py`, `pr-checks.yml` run |
| 10 | Remove dead configuration and drifted Admin copies | ✅ | modelValidation + `nonreg:unit` + guard |
| 11 | Nonreg, docs, cleanup, AC | ✅ | `nonreg:filesystem` 78/78 (shared runner) + `unit-321-tracked-assets` + `docs/reference/environments.md` |

---

## Locked implementation defaults

Binding copy of the analysis decision record (D1–D20). D18–D20 were defaults picked in the analysis and are confirmed with this plan.

| Decision | Choice |
|---|---|
| D1 Admin registry | gitignored `.miroir/<env>/`; tracked `admin_data` = seed |
| D2 Definition form | `environments/<name>.json` validated by ML schema `miroirEnvironment` |
| D3 Modes | per-section `live` (filesystem only, package assets) / `copy` (state); `live` refused in `test-*` |
| D4 Personal env | gitignored `environments/local.json` with `extends`; selection `MIROIR_ENV` → `local.json` → `dev`; UI installs recorded in `local.json` |
| D5 Tests | one environment per profile; reseed per session; drifted Admin copies retired |
| D6 Deviations | warning locally; error under `CI=true`, nonreg, `--strict` |
| D7 Dead config | deleted in Slice 10; release path untouched |
| D8 Runtimes | server, web client, test launchers, nonreg, cloud setup |
| D9 Renames | later issue |
| D10 Locations | `environments/` (tracked + `local.json` ignored), `.miroir/` ignored |
| D11 Content | applications (package, SelfApplication, Deployment uuid, store, mode, section overrides), server, client, features, logPreset, connections (`passwordEnv`), secrets names, `extends` |
| D12 Transition | old inputs keep working with a deprecation warning until the slice that retires them; `--profile x` ≡ `MIROIR_ENV=test-x` |
| D13 Admin in dev | model `live`, data `copy`; Deployment and AdminApplication rows generated |
| D14 First run | `miroir-env import` (manual) |
| D15 Reconciliation | create missing, regenerate derived rows, warn and keep extras; delete only via `prune` |
| D16 CI | `miroir-env check` in `pr-checks.yml`; no nonreg in CI |
| D17 Command | `miroir-env <show│check│import│prune>`, also `npm run miroir-env -- <cmd>` at the root |
| D18 Code location | schema in `getMiroirFundamentalMlSchema.ts`; pure resolver in `miroir-core/src/1_core/environment/`; IO + bin in new package `packages/miroir-env` (build step after miroir-core in `build-all.sh`) |
| D19 Root | `filesystemDeploymentRootDirectory` = repository root, located by walking up to the root `package.json` from `process.cwd()` (never from `import.meta.url`, see #323) |
| D20 Cloud | `agent_session_setup.py` writes `environments/local.json` = `{ "extends": "cloud-agent" }` when absent |

---

## Allocated UUIDs / keys

| Artefact | Value |
|---|---|
| ML schema key | `miroirEnvironment` (fundamental schema, next to `miroirConfigServer`) |
| MiroirTest suite `fn.environment.resolveEnvironment` | `456671bd-cf4c-427d-9542-2eb5d7537e9b` |
| MiroirTest suite `fn.environment.deriveDeployments` | `7f14228c-68b1-42a0-952c-83c73b41fa68` |
| MiroirTest suite `runner.deployApplication` | `0eff6006-95c9-4657-8fa5-cc7076ea11fa` |
| Deployment uuids (existing, reused) | Miroir `10ff36f2-50a3-48d8-b80f-e48e5d13af8e`, Admin `18db21bf-f8d3-4f6a-8296-84b69f6dc48b`, Library `f714bb2f-a12d-4e71-a03b-74dcedea6eb4`, Designer `f0359240-e849-4546-8158-75f4a8ae5831`, Spotify `fd47d115-67e2-4870-8339-1c26665d1d15`, Postgres `537fafe0-bb56-4e8b-883b-e65c0a05de17`, appForTest `eef01001-0002-4000-8000-000000000002` |
| Nonreg steps | `unit-321-tracked-assets` (guard), `unit-321-miroir-env` (package tests), `integ-321-server-boot` |
| npm scripts | root `miroir-env`; `packages/miroir-env` bin `miroir-env` |

---

## Test execution conventions

| Purpose | Command |
|---|---|
| Resolver (MiroirTest unit) | `npm run testMiroir -w miroir-core -- --suites fn.environment.resolveEnvironment,fn.environment.deriveDeployments --mode unit` |
| `miroir-env` package (vitest) | `npm run test -w miroir-env` |
| Server / session boot (vitest integ) | `RUN_TEST=serverBootFromEnvironment npm run testByFile -w miroir-standalone-app -- serverBootFromEnvironment` |
| Tracked-assets guard | `python -m pytest scripts/tests/test_tracked_assets_guard.py -q` and `npm run miroir-env -- check --tracked-clean` (from Slice 6) |
| Deployment validation | `npm run testByFile -w miroir-test-app_deployment-admin -- tests/modelValidation.unit.test.ts` (same for miroir) |
| Schema rebuild | `npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core` |
| Type check | `npx tsc --noEmit --skipLibCheck -p packages/<pkg>/tsconfig.json` (miroir-core, miroir-env, miroir-server, miroir-standalone-app as touched) |
| Safety net | `npm run nonreg:unit`, `npm run nonreg:filesystem`; `npm run nonreg:default` with Postgres started |

Vitest exceptions (not reachable through MiroirTest): file-system seeding, CLI argument handling and process environment selection (`miroir-env`), server and test-session boot wiring (`server.ts`, `IntegrationTestSession`), Vite config injection.

---

## Slice 0 — Characterize tracked writes and today's deployment map

**Status:** ✅ DONE

### Goal

Give later slices a safety net: a guard that tells whether a run changed tracked asset files, and a locked record of today's deployment map so Slice 1 can prove it reproduces it.

### 0.1 RED → GREEN — tracked-assets guard

**Test:** `scripts/tests/test_tracked_assets_guard.py` (pytest, repo scripts are Python per AGENTS.md) over `scripts/tracked_assets_guard.py`.

Behavior asserted:
- The guard lists tracked files changed or added under `packages/*/assets/**` and `packages/*/tests/assets/**` since a recorded baseline (`git status --porcelain`), and exits non-zero when the list is not empty.
- Known current writers are reproduced in a temporary git repository fixture: a file added under `tests/assets/admin_data/7959d814…/` is reported.

### 0.2 Characterization — today's `dev` map

**Test:** `packages/miroir-env/tests/fixtures/dev-deployments.today.json`, generated once by a Python script from `miroir-test-app_deployment-admin/assets/admin_data/7959d814…/*.json` (4 rows: Admin, Miroir, Library, Designer, with their section directories rebased from `packages/` to the repository root). Used as the expected value in Slice 1.

### Validation

```bash
python -m pytest scripts/tests/test_tracked_assets_guard.py -q
python scripts/tracked_assets_guard.py check   # clean on a fresh checkout
```

### Realization

- `scripts/tracked_assets_guard.py` with two subcommands instead of `--baseline <ref>`: `check` (changes since HEAD) and `snapshot --output F` + `check --since F` (only changes made during a run, so a developer's own uncommitted asset edits do not fail nonreg). Scope: `packages/*/assets/**`, `packages/*/tests/assets/**`, `packages/*/tests/test_assets/**`; gitignored files are out of scope. Content hashes detect a pre-existing edit that a run changes again.
- `scripts/tests/test_tracked_assets_guard.py`: 7 tests on a throwaway git repository (clean, modified, added, deleted, out of scope, snapshot, re-edited).
- `packages/miroir-env/tests/fixtures/dev-deployments.today.json`: the 4 Deployment rows of `admin/assets/admin_data/7959d814…/` with directories rebased from `packages/` to the repository root (generated once with an inline Python snippet). Noted for Slice 1: the filesystem `admin` section only creates its directory on open (`FileSystemStore.open`, `FileSystemAdminStore.createStore` is a no-op), which is why Miroir's `admin` directory `…-miroir/src/assets` appears at runtime; Slice 1 derives the `admin` section by rule (`packages/<package>/assets` for `live`), so only `model`, `data` and `modelVersion` are compared with this fixture.

---

## Slice 1 — Tracer: `miroir-env show` resolves `dev`

**Status:** ✅ DONE

### Goal

A developer runs `npm run miroir-env -- show` and sees, from `environments/dev.json`, the applications and store sections the dev server uses today.

**Layers cut:** ML schema (fundamental schema → generated type and Zod) → pure resolver (miroir-core `1_core/environment/`) → `miroir-env` package (file loading, repo-root discovery, CLI) → root npm script.

### 1.1 RED

- MiroirTest `fn.environment.deriveDeployments` (`functionCallTest`, in `miroir-test-app_deployment-miroir/assets/miroir_data/a311f363…/`): given the `dev` definition and a repository root, returns Deployment rows whose `configuration` equals `dev-deployments.today.json` for the 4 applications (`live` sections → `packages/<package>/assets/<prefix>_<section>`).
- `packages/miroir-env/tests/miroirEnvCli.321.phase1.unit.test.ts`: `miroir-env show --json` in a temporary copy of `environments/` prints `{ name: "dev", source: "default", applications: …, deployments: … }`; an invalid definition exits 2 with the schema error path.

### 1.2 GREEN

- Add `miroirEnvironment` to `getMiroirFundamentalMlSchema.ts`; rebuild deployment-miroir and `devBuild` miroir-core.
- `deriveDeployments(environment, repositoryRoot)` in miroir-core; export from `index.ts`.
- New package `packages/miroir-env` (ESM, tsup, bin `miroir-env`), `loadEnvironment`, `findRepositoryRoot`; root script `"miroir-env": "node packages/miroir-env/dist/cli.js"`; add to `build-all.sh` after miroir-core.
- `environments/dev.json` per analysis §4.2 (Admin data still `live` in this slice: behaviour unchanged).

### 1.3 Refactor checkpoint

- Section → directory naming is today duplicated in the Runner templates and in `Deployment.ts`; note both call sites for Slice 7, do not change them yet.

### Validation

```bash
npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core
npm run testMiroir -w miroir-core -- --suites fn.environment.deriveDeployments --mode unit
npm run build -w miroir-env && npm run test -w miroir-env
npm run miroir-env -- show
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-env/tsconfig.json
npm run test -w miroir-core -- ''
```

### Realization

- ML schema: `miroirEnvironmentStoreType`, `miroirEnvironmentSectionMode`, `miroirEnvironmentSectionOverride`, `miroirEnvironmentApplication`, `miroirEnvironment` in `getMiroirFundamentalMlSchema.ts`, placed after the `miroirConfig` union, not between `miroirConfigServer` and `miroirConfig`: `cursorSdk.275.phase0` slices the source text between those two keys. Types and Zod validators exported from `miroir-core`.
- `deriveEnvironmentDeployments(environment, environmentName)` in `miroir-core/src/1_core/environment/Environment.ts` returns `{ status: "ok", deployments } | { status: "error", errors }`. The `admin` section is derived by rule (`packages/<package>/assets` for `live`, `.miroir/<env>/<app>` for `copy`); non-filesystem stores return an error until Slice 5.
- MiroirTest `fn.environment.deriveDeployments` (7 `functionCallTest` leaves, tags `unit`, `tools`: no new tag, to keep the MiroirTest Entity and its EntityVersion untouched). Registered in `FunctionCallTestRegistry.ts`, exported from the deployment's `index.ts`, the hand-maintained `index.d.ts` stub and `src/Model.ts`. Descriptions cannot contain `#321` (naming guard).
- Package `packages/miroir-env` (tsup, ESM, bin `miroir-env`; `moduleResolution: bundler` like miroir-store-filesystem, because NodeNext cannot follow miroir-core's extensionless d.ts re-exports). `findRepositoryRoot` walks up to the first `package.json` with `workspaces`. `miroir-env show [--json] [--name]`; schema errors exit 2 with `file: path: message`.
- `environments/dev.json` with miroir, admin, library, designer, all `live` (Admin data still live: behaviour unchanged until Slice 3). Root script `npm run miroir-env`; `build-all.sh` builds `miroir-env` in the stores stage.
- `npm install` rewrote `package-lock.json` (dropped `libc` fields) and removed the Linux rollup binary: restored the lock by hand (only the two `miroir-env` entries added), reran `npm ci` and the rollup install from `agent_session_setup.py`.

---

## Slice 2 — Personal environment: `local.json`, `MIROIR_ENV`, `extends`

**Status:** ✅ DONE

### Goal

A developer creates `environments/local.json` with `{ "extends": "dev", … }`, adds or removes an application, and `miroir-env show` reports the merged result and why this environment was selected; the file is ignored by git.

**Layers cut:** resolver (merge) → `miroir-env` (selection) → `.gitignore`.

### 2.1 RED

- `fn.environment.resolveEnvironment` leaves: `extends` chain merge; `null` removes an inherited application; a cycle is an error; a definition without `miroir` or `admin` is an error; `live` in an environment named `test-*` is an error.
- CLI test: selection order `MIROIR_ENV` → `local.json` → `dev`, reported as `source`; unknown `MIROIR_ENV` exits 2 listing the available environments.

### 2.2 GREEN

- `resolveEnvironment(definitions, selection)` in miroir-core; selection in `miroir-env`.
- `.gitignore`: `environments/local.json`, `.miroir/`.

### 2.3 Refactor checkpoint

- `respectExistingEnv` in `integrationTestProfiles.ts` is the same precedence problem; keep for Slice 5.

### Validation

```bash
npm run testMiroir -w miroir-core -- --suites fn.environment.resolveEnvironment --mode unit
npm run test -w miroir-env
git check-ignore environments/local.json .miroir/x
```

### Realization

- `resolveEnvironment(definitions, name)` in `Environment.ts` returns `{ status: "ok", chain, environment } | { status: "error", errors }`, `chain` child first. Merge: objects key by key, arrays and scalars replaced, `null` removes the key; `extends` dropped and `name` set. Unknown names, unknown parents and cycles are reported before anything else; the merged result is then validated with the `miroirEnvironment` Zod schema (files are partial overrides, so a single file is not validated alone), then the rules: `REQUIRED_ENVIRONMENT_APPLICATIONS` (`miroir`, `admin`) and no `live` section (the `admin` section included) in a `test-*` environment. Input type `EnvironmentDefinition` (`{ extends?: string } & Record<string, unknown>`).
- MiroirTest `fn.environment.resolveEnvironment`: 9 leaves.
- `miroir-env`: `readEnvironmentDefinitions` reads every `environments/*.json` (invalid JSON or a non-object is an error naming the file); `selectEnvironment` picks `--name`, `MIROIR_ENV`, `environments/local.json`, `dev`, in that order, and reports it as `source`. `show` prints `environment <name>, selected by <source>, defined by <file> <- <parent file>`. The Slice 1 tests on the tracked repository now pass `--name dev`, so a developer's `local.json` does not change them; shared helpers in `tests/cliTestSupport.ts`. CLI test `miroirEnvCli.321.phase2.unit.test.ts` (8 tests).
- `.gitignore`: `environments/local.json`, `.miroir/`.

---

## Slice 3 — Server boots from the environment, Admin data in state

**Status:** ✅ DONE

### Goal

`NODE_ENV=development node packages/miroir-server/release/index.js` opens the deployments of the selected environment; deploying, dropping or editing rights, secrets and ViewParams leaves `git status` clean. Admin's model stays `live`.

**Layers cut:** admin package assets (seed split) → resolver (`copy` sections, generated rows) → `miroir-env` (seeding into `.miroir/<env>/`) → server boot.

### 3.1 RED

**Test:** `packages/miroir-standalone-app/tests/4_storage/serverBootFromEnvironment.321.phase3.integ.test.ts` (vitest: boot wiring is not reachable through MiroirTest). With a real DomainController and filesystem stores, in a temporary repository root containing a copy of the needed packages' assets:
- `openEnvironmentDeployments(domainController, resolved)` seeds `.miroir/dev/admin/data` from the Admin seed, writes the generated Deployment and AdminApplication rows there, and opens Miroir, Admin, Library and Designer.
- Creating a MiroirRight and a ViewParams update changes files only under `.miroir/dev/`.
- A second boot does not reseed (state kept).

### 3.2 GREEN

- `git mv` the 4 Deployment rows and matching AdminApplication rows out of `admin/assets/admin_data/` into `admin/assets/bootstrap/` (still exported as `deployment_Admin` / `deployment_Miroir` / `deployment_Library` for their uuids and SelfApplications; their `configuration` is no longer used at boot).
- `openEnvironmentDeployments` in `miroir-env`; `server.ts` replaces the hardcoded `configurations` and the bundled `filesystemDeploymentRootDirectory` with the resolved environment (server URLs, CORS and features too); `config/miroirConfig.server.json` read only as a deprecated fallback when no `environments/` folder is found.
- `environments/dev.json`: Admin `sections.data.mode = "copy"`.

### 3.3 Refactor checkpoint

- `defaultDeployments` / `defaultSelfApplicationDeploymentMap` (`Deployment.ts:58,79-82`) keep only uuids; remove `miroir-core/src/ApplicationDeploymentAdmin.ts` (marked TODO REMOVE) if unreferenced.

### Validation

```bash
npm run build -w miroir-test-app_deployment-admin && npm run build -w miroir-core && npm run build -w miroir-env
RUN_TEST=serverBootFromEnvironment npm run testByFile -w miroir-standalone-app -- serverBootFromEnvironment
npm run testByFile -w miroir-test-app_deployment-admin -- tests/modelValidation.unit.test.ts
npm run build:server -w miroir-server   # then start it with NODE_ENV=development, deploy Library from the UI, check git status
npx tsc --noEmit --skipLibCheck -p packages/miroir-server/tsconfig.json
npm run nonreg:unit
```

### Realization

- `environments/dev.json`: Admin `sections.data.mode = "copy"`, so Admin data lives in `.miroir/dev/admin/data`; Admin's model and every other application stay `live`.
- miroir-core `Environment.ts` exports `environmentSections`, `environmentSectionMode` and `applicationAssetsDirectory` (the package location a `live` section opens and a `copy` section is seeded from).
- miroir-env `seedEnvironmentState(resolved, { reseed? })` copies every missing `copy` filesystem section from the package assets. For Admin data it keeps the Deployment and AdminApplication entity directories but not their rows (`GENERATED_ADMIN_ENTITIES`): a filesystem data section knows its entities by their directories.
- miroir-env `environmentAdminRows` generates one Deployment row (configuration from the definition) and one AdminApplication row (name and labels from the application's SelfApplication row in its package) per installed application. `openEnvironmentBootDeployments` opens Admin and Miroir, and refuses other uuids than `defaultSelfApplicationDeploymentMap`'s. `reconcileEnvironmentDeployments` creates missing rows, rewrites differing ones (D15, reported as `changes`), opens the other deployments, and opens Deployment rows absent from the definition with a warning. Rows go through `createInstance` / `updateInstance`, not file writes, so the same code serves other stores later.
- miroir-env `environmentServerConfig` builds the `MiroirConfigServer` (URLs, CORS, features; filesystem root = repository root).
- `server.ts`: without `--config` and with an `environments/` folder above the working directory, the server seeds the state, takes its settings from the environment, opens the boot deployments, imports secrets, then reconciles and opens the rest, printing changes and warnings. Otherwise (release binary, Docker, explicit `--config`) the previous path is unchanged. `miroir-env` is bundled into the release by ncc (not an `-e` external), so the Docker image needs nothing new.
- Deviation from 3.2: the Deployment and AdminApplication rows stay in `admin/assets/admin_data/` instead of a `git mv` to `bootstrap/`. The release path (Docker seed, Electron copy, `deployment_Admin` / `deployment_Miroir` for the fallback boot) and about fifteen unit tests (`access.262`, `access.264`, `authentication.71`, `versioningModes.reportRouting`, …) read them there; excluding them from the seed gives the same result. Slice 10 revisits them with the other drifted Admin copies.
- Deviation from 3.1: the boot test lives in `miroir-env` (devDependencies `miroir-localcache-redux`, `miroir-store-filesystem`), next to the code it covers, not in `miroir-standalone-app`. It boots a real DomainController on filesystem stores in a temporary checkout, and checks the seed, the generated rows, the opened deployments, that a MiroirRight creation and a ViewParams update change nothing under `packages/`, that a second boot keeps the state, and the warning for a Deployment the definition no longer installs.
- 3.3: `miroir-core/src/ApplicationDeploymentAdmin.ts` (unreferenced) removed. `defaultDeployments` unchanged: it still backs the fallback boot.
- Known gap until Slice 7: in development, applications installed from the UI get the path prefix `miroir-server/tests/tmp`, now resolved against the repository root (`<repo>/miroir-server/tests/tmp/`, ignored by the existing `tmp*/` rule); their Deployment rows land in `.miroir/dev/admin/data` and are opened with a warning at the next boot. Closed by Slice 7.
- The Slice 1 characterization test now expects Admin data in `.miroir/dev/admin/data`.
- Checked by hand: `NODE_ENV=development node packages/miroir-server/release/index.js` from the repository root seeds `admin/data`, creates the 4 AdminApplication and 4 Deployment rows, serves `/capabilities`, and leaves `git status` clean. A UI deploy was not exercised (no browser in the cloud session).

---

## Slice 4 — Tests run on `test-filesystem` without tracked writes

**Status:** ✅ DONE

### Goal

A test author runs any `emulatedServer-filesystem` test (`--profile emulatedServer-filesystem` or `MIROIR_ENV=test-filesystem`); Admin is seeded fresh from the canonical Admin package into `.miroir/test-filesystem/`, every store lives there, and the tracked-assets guard stays clean after `nonreg:filesystem`.

**Layers cut:** `environments/test-filesystem.json` → resolver → `applyIntegrationTestProfile` / `loadTestConfigFiles` → `IntegrationTestSession` / `RunnerTestSession` → `ensureMiroirPlatform`, `ensureLibraryPlayfield`.

### 4.1 RED

- Existing `PersistenceStoreController.integ` and `DomainController.integ` on `test-filesystem`, plus a new assertion in `testByFileLaunch.integ.test.ts`: after the run, `tracked_assets_guard.py` reports nothing.
- `integrationTestProfiles` unit test: `--profile emulatedServer-filesystem` sets `MIROIR_ENV=test-filesystem` and the same `MIROIR_TEST_*` values as today.

### 4.2 GREEN

- `environments/test-filesystem.json` (all `copy`).
- `loadTestConfigFiles` builds `MiroirConfigClient` from the resolver when `MIROIR_ENV` or a mapped profile is set; the profile JSON path is kept as deprecated fallback.
- Session start wipes and reseeds `.miroir/test-filesystem/`.
- Remove the snapshot/restore workaround in `PersistenceStoreController.integ.test.tsx:202-205,268-271`.

### 4.3 Refactor checkpoint

- `applyPortableFilesystemDeploymentRoot` (`fileTools.ts:26-48`) no longer needed for environments; keep for deprecated JSONs until Slice 5.

### Validation

```bash
npm run nonreg:filesystem
python scripts/tracked_assets_guard.py --baseline HEAD
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
```

### Realization

- `environments/test-filesystem.json`: Miroir, Admin, Library, appForTest and Spotify (the deployments of the `emulatedServer-filesystem` profile JSON), all `store: filesystem`, `mode: copy`, with `modelVersion` for the four applications that had one. Every section lives in `.miroir/test-filesystem/<application>/<section>`.
- miroir-env `environmentClientConfig(resolved)` builds the emulated-server `MiroirConfigClient` (one `deploymentStorageConfig` entry per installed application; filesystem root = repository root). miroir-core exports `isTestEnvironment(name)`.
- `applyIntegrationTestProfile`: a profile may name an `environment`; `emulatedServer-filesystem` names `test-filesystem` and sets `MIROIR_ENV`. An existing `MIROIR_ENV` is kept only when it names another `test-*` environment, so a developer's `dev` or `local` never reaches a test run; with `respectExistingEnv: false` (the UI launcher loading several profiles in one process), a profile without environment drops the previous one. The `VITE_MIROIR_TEST_CONFIG_FILENAME` and `MIROIR_TEST_*` values are set as before.
- `loadTestConfigFiles`: when `MIROIR_ENV` names a test environment, the configuration comes from the resolver, and the environment state is wiped and seeded from the package assets once per test file (vitest isolates modules per file). A `MIROIR_ENV` that is not `test-*` is ignored with a warning; the profile JSON stays the fallback for the other profiles (Slice 5).
- `testApplicationStorageConfiguration` (ephemeral test applications): when the template store is in `.miroir/<environment>/`, the test application goes to `.miroir/<environment>/<storeName>/{model,data,modelVersion}`.
- Tests that read or asserted fixed paths now take them from the configuration: `secretsImport.270.phase6` (MiroirSecret rows of the configured Admin data, not `tests/assets/admin_data`), `spotifyApp` (Spotify Deployment row in the configured Admin data), `versioningModes.filesystem-seed` and `processCapabilitiesStore.273.phase3` (no forced `<repo>/packages` root; `seedMiroirModelVersionFromPackageAssets`, renamed with `git mv`, seeds the configured modelVersion directory). The "package assets untouched" checks of `spotifyApp` and `apiCallReport.281.phase1/phase4` resolved the package path against the filesystem root and passed vacuously once the root became the repository root; they now use `resolveRepoRoot()`.
- Deviation from 4.2: the snapshot/restore of the Miroir Deployment and AdminApplication rows in `PersistenceStoreController.integ.test.tsx` stays until Slice 5. On `test-filesystem` it restores files the test no longer writes; the `emulatedServer-sql` profile still writes them in `tests/assets/admin_data`.
- Not changed: transformer sessions (`tr.*`, `IntegrationTestSession`) still open the test Admin copy `tests/assets/admin*` read-only and create their application in `tests/tmp/` (gitignored); they move with the Admin copy in Slice 5. Seeding writes no Deployment or AdminApplication rows: tests register the deployments they use, as before.
- Tests: `testEnvironmentConfig.321.phase4.unit.test.ts` (standalone app: configuration from `MIROIR_ENV`, seeded Admin, fallback and error), `testEnvironment.321.phase4.unit.test.ts` (miroir-env: client configuration of the tracked `test-filesystem`, reseed), `integrationTestProfiles.unit.test.ts` (+4: profile → `MIROIR_ENV`, precedence), `RunnerIntegTestTools.unit.test.ts` (+1: environment layout). The launcher unit tests save and clear `MIROIR_ENV` with the other profile variables.
- Pre-existing, not in nonreg: `applicationVersionFreeze.integ` fails 17 of 21 cases ("Application does not have versioning enabled") on `test-filesystem` and on the old profile JSON alike.
- Validation: `npm run nonreg:filesystem` 74 passed, 0 failed (snapshot `20260927T143801Z`), tracked-assets guard clean afterwards; miroir-env 21 tests; standalone-app typecheck clean.

---

## Slice 5 — `test-sql`, `test-indexedDb`, `test-mongodb`; profile JSONs and the test Admin copy retired

**Status:** ✅ DONE

### Goal

Every registered test profile is a named environment, a shell variable that contradicts the selected environment produces a warning (an error under `CI` / nonreg), and `miroir-standalone-app/tests/assets/admin*` and the emulated `miroirConfig.test-*.json` files are gone.

### 5.1 RED

- `integrationTestProfiles` unit tests: each profile maps to its environment; a conflicting `MIROIR_TEST_APP_STORE_TYPE` warns, and throws when `CI=true`.
- Default no-profile session uses `test-sql` with host `localhost` (not `192.168.1.160`).

### 5.2 GREEN

- `environments/test-{sql,indexedDb,mongodb}.json` (sql schemas `<env>_<app>`); `ci-*` profiles become environments only if still used, otherwise removed with the JSONs.
- `respectExistingEnv` keeps precedence but reports conflicts.
- `git rm` `packages/miroir-standalone-app/tests/assets/admin*` and the emulated/realServer `miroirConfig.test-*.json`; realServer profiles select the server's environment instead.
- Remove the `deployment_Admin.configuration` fallback in `runnerIntegTestSupport.ts:260-264`.

### 5.3 Refactor checkpoint

- `deriveTestSessionDefaultsFromMiroirConfig.ts` reads the resolved environment directly.

### Validation

```bash
npm run nonreg:unit
npm run nonreg:filesystem
sudo service postgresql start && npm run nonreg:default   # cloud: Postgres is installed, not running
python scripts/tracked_assets_guard.py --baseline HEAD
```

### Realization

Delivered in two commits: 5a (every profile store is an environment) and 5b (the test Admin copy and the profile files retired).

**5a**

- miroir-core `deriveEnvironmentDeployments` derives every store. The database stores are copies named after the environment and the application: SQL schema and MongoDB database `<environment>_<application>` (`test-sql`, `miroir` → `test_sql_miroir`), IndexedDB `.miroir/<environment>/<application>/indexedDb`; the modelVersion and admin sections add `_modelVersion` and `_admin`. A separate admin name matters: the IndexedDB admin store opens `<name>-model` (the model section's Level database when names are equal), and the MongoDB admin store drops its own database on deletion. SQL connections come from `connections.postgres` (`postgres://<user>@<host>:<port>/<database>`, no password), MongoDB from `connections.mongodb.url`; a database store without its connection is an error. MiroirTest `fn.environment.deriveDeployments` +4 leaves.
- `environments/test-sql.json`, `test-indexedDb.json`, `test-mongodb.json` extend `test-filesystem` and change only the store of Miroir, Library, appForTest and Spotify (Admin stays a filesystem copy, as in the profile files) and the connection.
- miroir-env `environmentClientConfig(resolved, env)` adds the Postgres password from the variable `connections.postgres.passwordEnv` names (`MIROIR_POSTGRES_PASSWORD`); `missingConnectionPasswords` warns when it is unset. `miroir-env show` never prints a password. Seeding still copies filesystem sections only: database stores are created and reset by the test sessions, as before.
- Profiles `emulatedServer-sql`, `-indexedDb`, `-mongodb` select `test-sql`, `test-indexedDb`, `test-mongodb`; their `MIROIR_TEST_*` defaults are derived from the environment's client configuration (5.3 done here). A shell value of a store-selecting variable (`MIROIR_ENV`, `VITE_MIROIR_TEST_CONFIG_FILENAME`, `MIROIR_TEST_APP_STORE_TYPE`, `MIROIR_TEST_ADMIN_STORE_TYPE`, `MIROIR_TEST_POSTGRES_HOST`, `MIROIR_TEST_ADMIN_SQL_SCHEMA`) that differs from the profile's is kept with a warning, and is an error when `CI` is set. Nonreg does not set `CI`; recording the environment in nonreg is Slice 11.
- Ephemeral test applications: IndexedDB ones go next to their template in `.miroir/<environment>/`; SQL and MongoDB ones use the template's connection instead of the hardcoded `postgres:postgres@localhost` and `localhost:27017`.
- Without a profile, transformer sessions use Postgres on `localhost` (was `192.168.1.160`).
- `PersistenceStoreController.integ`: the missing-entity message names the configured schema instead of `library`.
- Validation (5a): pre-push gate green (typechecks, `scripts/tests`, 2097 miroir-core tests); `npm run nonreg` default tier on `emulatedServer-sql` against a local Postgres (`MIROIR_POSTGRES_PASSWORD` set) 74/74 (snapshot 20260927T151442Z); the 36 default-tier steps on `emulatedServer-filesystem` 36/36 (snapshot 20260927T154031Z); tracked-assets guard clean. `test-mongodb` is covered by the derivation leaves only (no MongoDB in the cloud container).

**5b**

- Transformer sessions (`tr.*`, `testMiroir` in integration mode) run on a test environment like the other tests: the one `MIROIR_ENV` names (set by `--profile`), `test-sql` otherwise; a `MIROIR_ENV` that is not `test-*` is ignored with a warning. `resolveTestSessionForIntegOptionsFromEnv` takes the Admin store from the environment's Admin copy (`.miroir/<environment>/admin`), puts a filesystem or IndexedDB test application in `.miroir/<environment>/testApplication`, and gives an SQL or MongoDB one the environment's connection (`MIROIR_TEST_POSTGRES_HOST` replaces its host). `MIROIR_TEST_*` variables still choose the store types and override the locations.
- `tests/helpers/testEnvironment.ts` (`selectedTestEnvironment`, `openTestEnvironment`) resolves a test environment and seeds it once per test file, for `loadTestConfigFiles` and the transformer sessions alike.
- miroir-core `AdminStoreOptions`: the filesystem variant takes the section `directories` instead of an `admin/`, `admin_model/`, `admin_data/` root. `MIROIR_TEST_ADMIN_ASSETS_ROOT`, `resolveDefaultAdminAssetsRoot` and the unused deprecated `IntegrationTestSessionForPostgres`, `buildMiroirConfigForPostgres`, `buildAdminFilesystemStoreConfig` are gone. The launcher checks that the three Admin directories exist, and accepts a MongoDB connection from the environment.
- Profiles: the four emulated profiles name only their environment and no longer set `VITE_MIROIR_TEST_CONFIG_FILENAME`; a value set in the shell is dropped with a warning (an error under `CI`). The `ci-emulatedServer-host-sql` and `ci-emulatedServer-dockerized-sql` profiles are removed (Jenkins-era; their JSON had no Admin section). The realServer profiles keep their JSON files.
- `git rm` `miroir-standalone-app/tests/assets/admin`, `admin_model`, `admin_data` and 13 `tests/miroirConfig.test-*.json`: the 4 emulated ones, `ci-emulatedServer-*` (4), `docker-emulatedServer-sql`, the 3 `mixed_*` and the unreferenced `miroirConfig.test.json`. Readers fixed: `secrets.270.phase0` and `mcpToolRunner.253.phase0` (no longer list the copy), the library `extractMetaModelConfig.json` and `ci/tests/config/*.json` (read the Admin package assets; `ci/build/test_core.sh` keeps working), unit tests that imported the JSON files (they resolve `test-sql` / `test-indexedDb` instead), `resolveRepoRoot` (its fallback marker was a deleted JSON).
- `getTestConfig` no longer falls back on `deployment_Admin.configuration` (the tracked Admin assets) when a configuration has no Admin; `PersistenceStoreController.integ` no longer snapshots and restores Admin fixture rows.
- `AGENTS.md` and `docs/` select test environments (`MIROIR_ENV=test-<store>`) instead of the deleted files; the complete docs pass stays in Slice 11.
- Deviation from 5.2: realServer profiles still use their `miroirConfig.test-realServer-*.json` (the client side of a live server); selecting the server's environment for them moves to Slice 8 with the web client configuration. The Jenkinsfile still names deleted `ci-*` files; it goes in Slice 10.
- Validation (5b): typechecks (miroir-core, miroir-env, standalone app), `scripts/tests`, 2097 miroir-core tests; `npm run nonreg:filesystem` 74/74 (snapshot 20260927T160324Z); the 36 default-tier steps on `emulatedServer-sql` against a local Postgres 36/36 (snapshot 20260927T162701Z); tracked-assets guard clean after the run.

---

## Slice 6 — Reconciliation, deviation warnings, `check` / `import` / `prune`

**Status:** ✅ DONE

### Goal

At server start and with `miroir-env check`, a developer sees which deployments differ from the definition; `miroir-env import` records the extras into `local.json`, `miroir-env prune` removes them; `--strict` and `--tracked-clean` make the same checks fail CI and nonreg.

### 6.1 RED

**Test:** `packages/miroir-env/tests/miroirEnvReconcile.321.phase6.integ.test.ts` (real filesystem Admin store in a temporary root): the four cases of analysis D15, each asserting the reported level and the resulting state; `import` writes the minimal `local.json` diff; `prune` deletes the extra Deployment and AdminApplication rows and their `copy` stores.

### 6.2 GREEN

- `reconcileEnvironment(state, resolved)` returning findings; the server logs them after Admin opens; `check`, `import`, `prune` subcommands.
- `.miroir/<env>/env.lock.json` records the resolved view and definition hash; `show` reports a changed definition since the last run.

### 6.3 Refactor checkpoint

- Share the Deployment/AdminApplication row builder with `createDeploymentCompositeAction` (`Deployment.ts:157-203`) instead of a second copy.

### Validation

```bash
npm run test -w miroir-env
npm run miroir-env -- check --strict --tracked-clean
```

### Realization

- Schema: an environment application may give its `configuration` (a `storeUnitConfiguration`, repository-relative, used as given) instead of `package`, `store` and `mode`, which become optional. The resolver requires them when no configuration is given (`applications.<key>.<field>: required unless the application gives its configuration`) and refuses a given configuration in `test-*` environments. This is how `import` records a deployment that does not follow a package layout, and how Slice 7 will record UI installs. MiroirTest: +3 leaves in `fn.environment.resolveEnvironment`, +3 in `fn.environment.deriveDeployments`.
- `miroir-env/src/adminRows.ts`: the rows a definition implies (`environmentAdminRows`) and `compareAdminRows` (rows to create, rows to rewrite, deployments the definition does not install), shared by the server reconciliation (`openEnvironment.ts`) and `check`. An application without a package takes its labels from its AdminApplication row already in Admin data. Row shapes come from the new miroir-core `adminApplicationRow` / `deploymentRow`, which `createDeploymentCompositeAction` now uses too (6.3).
- `check [--strict] [--tracked-clean]`: validates every definition of `environments/`, prints where the state stands (`env.lock.json`), then reads the filesystem Admin data of the selected environment: rows the next start creates or rewrites (info), deployments it does not install (warning), and deployments written into the package Admin data before #321, no longer opened (warning, D14). `--strict` or `CI` turns warnings into errors (exit 1); `--tracked-clean` fails on changed asset files (same scope as `scripts/tracked_assets_guard.py`). With Admin data on another store, the comparison is left to the server (info).
- `import [--dry-run]` records those deployments in `environments/local.json`: the short form (`package`, `store: filesystem`, `mode: live`) when the stores are a package's live layout (checked by deriving it back), the given configuration otherwise. When it creates `local.json` (extending the selected environment), it copies `.miroir/<selected>` to `.miroir/local` and moves the recorded paths along, since the state directory follows the environment name. Refused for `test-*` environments, and when `local.json` exists but another environment is selected.
- `prune [--dry-run]` deletes those deployments: Deployment rows, AdminApplication rows no other deployment uses, and their stores inside `.miroir/<env>/`; stores elsewhere (package assets, databases, a store a defined application uses) are left in place and listed. Legacy rows in the package Admin data are never deleted.
- `seedEnvironmentState` writes `.miroir/<env>/env.lock.json` (definition hash, files, deployments); `show` and the server start report a definition changed since the last start and which applications differ.
- nonreg: unit steps `unit-321-miroir-env` (miroir-env vitest) and `unit-321-miroir-env-check` (`check --strict`, D6).
- Deviations: `import` records only deployments the definition does not install; a row that differs from the definition is rewritten at the next start (D15), so importing it would record a transient state. D15 row 4 (a shell variable that differs from the selected test environment) was realized with the profiles in Slice 5a; row 5 is `--tracked-clean`.

---

## Slice 7 — UI installs land in state and are recorded in `local.json`

**Status:** ✅ DONE

### Goal

Installing or creating an application from the UI puts its stores under `.miroir/<env>/apps/` and adds it to `environments/local.json`; dropping it removes it; no tracked file changes.

### 7.1 RED

**Test:** new MiroirTest `runnerTest` suite `runner.deployApplication` on `test-filesystem` (no runner suite covers `deployApplication` today; existing ones are `runner.createEntity`, `runner.dropEntity`, `runner.freezeApplicationVersion`, `runner.mcp.getInstances`): the resulting Deployment row points under `.miroir/test-filesystem/apps/<name>-{model,data}`; the environment's recorder receives the installed application. Recording into `local.json` is exercised in `miroir-env` against a temporary `local.json` (tests never write the real one).

### 7.2 GREEN

- New `templateEvaluationParams` entry `environmentAppsDirectory`; Runners `deployApplication` (`4f3cd0b1…`), `createApplication` (`bcc872dc…`) and `Runner_CreateApplication.tsx:657-660` use it instead of the `NODE_ENV` / `devRelativePathPrefix` switch.
- Server-side recorder: after an Admin Deployment create / delete succeeds, update `local.json` when the selected environment is `local` (or create it extending the selected tracked environment); never for `test-*`.

### 7.3 Refactor checkpoint

- Remove `devRelativePathPrefix` / `prodRelativePathPrefix` (`tools.ts:28-29`) and their uses in `DomainController.ts` and `FileSelector.tsx` if nothing else reads them.

### Validation

```bash
npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core
npm run testMiroir -w miroir-standalone-app -- --suites runner.deployApplication --mode integration
npm run test -w miroir-env
npm run nonreg:filesystem
```

### Realization

- Configuration: new `miroirConfigEnvironment` (`name`, `appsDirectory`) and an optional `environment` in `miroirConfigClient` and `miroirConfigServer`, placed before `features` (`cursorSdk.275.phase0` reads the keys after `features`). `environmentServerConfig` and `environmentClientConfig` set it; `environmentAppsDirectory(name)` (Environment.ts) gives `.miroir/<name>/apps`.
- `templateEvaluationParams.environmentAppsDirectory`: a DomainController whose configuration names an environment passes that environment's apps directory to every template it evaluates. Configurations naming none (release, `ci/`) keep the `NODE_ENV` default (`miroir-server/tests/tmp` in dev, `.` otherwise). The Runners `deployApplication` and `createApplication` read `prefix` from it; the layout under the prefix is unchanged (`admin`, `<name>-model`, `<name>-data`). `Runner_CreateApplication.tsx` (not reachable from the UI) reads the same parameter.
- 7.3 deviation: `devRelativePathPrefix` / `prodRelativePathPrefix` are no longer template parameters, but the constants stay in `tools.ts` as that default.
- Left for Slice 8: in the web client against a real server, the browser DomainController evaluates the Runner templates with the client configuration, which names no environment yet (it is one of `src/assets/miroirConfig*.json`). Until Slice 8 gives the client its environment, a UI install there keeps the `NODE_ENV` default path. The server records the installed application in `local.json` whatever its path. Tests and server-side Runners (MCP) already use the environment.
- Recording: `DomainControllerInterface.addInstanceActionListener`, called after an instance action changed a store (a failing listener is logged, the action still succeeds). miroir-server registers miroir-env's `recordInstallsOf` once the start has reconciled Admin data, since rows missing before that are not drops. On a change to Deployment rows of Admin data, `recordInstalledApplications` aligns `environments/local.json` with the Admin data of the state: it records the deployments the definition does not install (same entries as `import`), removes the applications whose Deployment row is gone, and writes `null` for one the extended environment installs.
- Deviation: with a tracked environment selected, the server never creates `local.json`. Creating it would select `local` at the next start, whose state would have to be copied from `.miroir/<env>` while the server still writes there. The server logs a hint to run `miroir-env import` instead; `test-*` environments record nothing.
- Test harness fix: runner MiroirTest leaves ignored failed assertions. A composite action records a failed assertion in the activity tracker and still returns ok, and only the MCP branch of `runMiroirRunnerTest` read the tracker. Both branches now fail the leaf, looking assertions up by their `testLabel`. On the filesystem profile, `runner.lendDocument`, `returnDocument`, `mcp.getInstances`, `dropEntity` and `freezeApplicationVersion` still pass. `runner.createEntity` "with reports" fails with `EntityNotFound` on the EntityVersion extractor before and after this slice; it is not in nonreg.
- Tests: MiroirTest `runner.deployApplication` (RED first: the stores landed at the repository root, `./Library-model`). Its expected directories use `{{{environmentAppsDirectory}}}`, because `{{ }}` HTML-escapes `/`. `recordInstalls.321.phase7.integ.test.ts` covers the configurations, the listener filter, recording under `local`, the hint under `dev`, and `test-*`. nonreg step `integ-runner.deployApplication` joins the shared runner group.

---

## Slice 8 — Web client config from the environment

**Status:** ✅ DONE

### Goal

`npm run dev -w miroir-standalone-app` connects to the server of the selected environment without editing `index.tsx`.

### 8.1 RED

**Test:** `packages/miroir-standalone-app/tests/helpers/viteEnvironmentConfig.321.phase8.unit.test.ts`: the Vite config function called with `MIROIR_ENV=dev` defines `__MIROIR_CLIENT_CONFIG__` with `rootApiUrl` from `dev.json` and sets the proxy target from it.

### 8.2 GREEN

- `vite.config.js` resolves the environment and injects the client config, `environment` included (Slice 7: UI installs then go to its apps directory); `index.tsx` reads it; `webMiroirConfigName` and the six statically imported `src/assets/miroirConfig*.json` go away (the in-browser emulated modes become a `client.mode: "emulatedServer"` environment only if A still uses them; decided at this slice).

### Validation

```bash
RUN_TEST=viteEnvironmentConfig npm run testByFile -w miroir-standalone-app -- viteEnvironmentConfig
npm run build -w miroir-standalone-app
# manual: server + npm run dev -w miroir-standalone-app, open http://localhost:5173
```

### Realization

- 8a, web client: `vite/environmentConfig.js` resolves the selected environment (`MIROIR_ENV`, then `environments/local.json`, then `dev`) and gives miroir-env's `environmentRealServerClientConfig`: the server URL, the stores of every installed application (ConfigurationService requires Admin), the `environment` (Slice 7: UI installs go to its apps directory), no `features` (the server owns the process capabilities, #273). `vite.config.js` became a function of `command` and `mode`: it injects the configuration as `__MIROIR_CLIENT_CONFIG__` and points the API proxy at the same server; vitest runs (mode `test`) inject nothing. Served without certificates, the client calls the server over HTTP, as the server then listens; a build keeps the environment's URL. Database passwords never reach the browser. An environment whose client emulates the server (`test-*`) gives a warning: the web client still calls its server.
- `index.tsx` reads `__MIROIR_CLIENT_CONFIG__` and fails with a message when served without Vite; `webMiroirConfigName` and the six `src/assets/miroirConfig*.json` are gone. Decision (asked on a card, default applied): the in-browser emulated IndexedDB mode is dropped; it can come back as an environment with `client.mode: "emulatedServer"` and IndexedDB stores.
- Manual run: server and `npm run dev` with `MIROIR_ENV=dev`, headless Chromium on http://localhost:5173/search: the client calls `http://localhost:3080` (no certificates in the session) and shows Library instances; no tracked file changed.
- 8b, realServer test profiles: `realServer-<storage>` select `test-<storage>` and `MIROIR_TEST_CLIENT=realServer` (a deviation in the shell warns like `MIROIR_ENV`); `openTestEnvironment` then gives the real-server configuration of the environment, database password included (Node only). The four `tests/miroirConfig.test-realServer-*.json` (Admin on the tracked assets) are removed; `resolveRealServerUiIntegrationProfile` no longer reads `VITE_MIROIR_TEST_CONFIG_FILENAME`. `loadTestConfigFiles` still accepts that variable for a hand-written configuration.
- Harness fix found by the live run (`uiIntegrationTestLauncher.realServer.integ`, profile `realServer-filesystem`, against a `dev` server): `RunnerTestSession` passed `resetMiroirPlatform: undefined` for a real server, which `beforeEachTest` read as "reset the default Miroir deployment", so every leaf wiped and rewrote the server's Miroir deployment, in `dev` the package assets. It now passes `false`. Before the fix the run deleted about 260 tracked Miroir files (restored from git) and left untracked EntityVersion and ApplicationVersion rows in `miroir_data` (`ModelInitializer` writes them to `data`, not `modelVersion`). After it, the same run changes nothing tracked.
- Also fixed: `RunnerTestSession.unit` had failed since 5b (its configurations had no Admin store); it is not in nonreg.
- Left for Slice 10: the browser in-app realServer profiles (`src/miroir-fwk/4-tests/miroirConfig.browser-realServer-*.json`) still point Admin at `miroir-test-app_deployment-admin/assets`, which an environment-started server resolves from the repository root. Deriving them from the injected configuration needs a way to give the server the database password, which the browser must not carry.

---

## Slice 9 — Cloud sessions and CI

**Status:** ✅ DONE

### Goal

A Claude cloud session gets the `cloud-agent` environment without any manual step, and every PR is checked for valid environments and untouched tracked assets.

### 9.1 RED

- `scripts/tests/test_agent_session_setup.py`: when `environments/local.json` is absent, setup writes `{ "extends": "cloud-agent" }`; when present, leaves it; `--dry-run` reports it.
- `pr-checks.yml` gains `npm run miroir-env -- check --strict --tracked-clean` (validated by the workflow run on the PR).

### 9.2 GREEN

- `environments/cloud-agent.json` (extends `dev`: filesystem only, `features.ai` off, no Postgres).
- `agent_session_setup.py` builds `miroir-env` and writes `local.json`; state summary prints the selected environment.

### Validation

```bash
python -m pytest scripts/tests -q
python scripts/agent_session_setup.py --dry-run
python scripts/sync_agent_skills.py --check
```

### Realization

- `environments/cloud-agent.json` extends `dev` with `features.ai` off; `dev` already runs on filesystem stores, so the environment needs no Postgres.
- `scripts/agent_session_setup.py --cloud-agent` writes `environments/local.json` = `{ "extends": "cloud-agent" }` when it is absent and never touches an existing one. The Claude Code SessionStart hook (`.claude/settings.json`) passes `--cloud-agent`. **Deviation from 9.2:** without the flag the script writes nothing, so a developer who runs it on their own machine keeps `dev` (or their own `local.json`); the plan wrote the file unconditionally.
- The third build group gains `miroir-env` (same list as `pr-checks.yml`); the session status prints the selected environment and its source (`MIROIR_ENV`, `local.json`, default).
- `pr-checks.yml` builds `miroir-env` and runs `npm run miroir-env -- check --strict --tracked-clean` after the unit tests; AGENTS.md's pre-push gate lists the same command.
- Proof: 6 new tests in `scripts/tests/test_agent_session_setup.py` (write when absent, keep an existing file, only with `--cloud-agent`, dry run writes nothing, the hook passes the flag, `pr-checks.yml` builds `miroir-env` and runs the check); `pytest scripts/tests` 58 passed, 2 skipped; the check passes in a clean worktree of the branch and, in a working tree with untracked files under a package's `assets/`, reports them. The PR check job ran green on 6b11093 with the new step.

---

## Slice 10 — Remove dead configuration and drifted Admin copies

**Status:** ✅ DONE

### Goal

The repository holds one Admin application and only configuration that something reads.

### 10.1 Removal list (each checked unreferenced with `git grep` at the slice)

- `Jenkinsfile`, `ci/build/*.sh`, `ci/tests/config/*.json`, `docker/ci/`, `docker/ci-builder-electronDEFUNCT/`, root `Dockerfile`, `docker-compose.yml` (release path kept: `ci/release/`, `ci/docker/`, `ci/lib/`, `docker/miroir-server/`, workflows).
- Unreferenced `miroirConfig.test-{docker-*,emulatedServer-mixed_*}.json`, `src/assets/miroirConfig-plain-no-dataflow-config.json`, Electron `assets/{10ff36f2,18db21bf}….json`.
- `miroir-core/tests/test_assets/` (no reference); stale `admin_data/` in library, postgres, spotify packages.
- `miroir-mcp/tests/assets/admin*`: its test config seeds from the canonical Admin package through `miroir-env` (runtime adoption of MCP stays a follow-up).
- Browser in-app realServer profiles `src/miroir-fwk/4-tests/miroirConfig.browser-realServer-*.json` (Slice 8 gap): derive them from the environment or remove them.

### Validation

```bash
npm run testByFile -w miroir-test-app_deployment-admin -- tests/modelValidation.unit.test.ts
npm run test -w miroir-mcp
python -m pytest ci/release/tests -q
npm run nonreg:unit
python scripts/tracked_assets_guard.py --baseline HEAD
```

### Realization

- **10a, in-app realServer profiles.** The four `miroirConfig.browser-realServer-*.json` pointed the server at the tracked Admin data and carried a database password. `vite.config.js` injects `__MIROIR_TEST_CLIENT_CONFIGS__` (`vite/environmentConfig.js` `webTestClientConfigs`): each `realServer-<storage>` profile gets the client configuration of `test-<storage>`, without passwords, in every Vite run (vitest runs too, with the environments' URLs); a served client seeds the copies missing from `.miroir/test-*/` and calls the server over HTTP without certificates. `integrationTestProfileAssets.ts` reads the global; a bundle built without it lists no realServer profile. For `realServer-sql` the server needs `PGPASSWORD` (or `~/.pgpass`), since the browser sends no password (`docs/reference/testing.md`). Proof: `viteEnvironmentConfig.321.phase8` (7 tests) and `integrationTestProfileAssets.unit` (Admin under `.miroir/test-<storage>/`, no password); the Electron runtime configuration in `index.tsx` is untouched (release scope).
- **10b, CI and configuration files.** Removed, each checked unreferenced with `git grep`: `Jenkinsfile` (it builds `miroir-server-msw-stub` and runs test files that no longer exist), `docker/ci-builder-electronDEFUNCT/`, `ci/tests/config/`, `tests/miroirConfig.test-docker-realServer-sql.json`, `src/assets/miroirConfig-plain-no-dataflow-config.json`, the Deployment copies in `miroir-standalone-app-electron/assets/`. `ci/build/test_core.sh` now passes `--profile emulatedServer-<storage>`. **Deviation:** kept `ci/build/*.sh` and `docker/ci/` (A: keep the `ci` scripts compatible, a release is coming) and the root `Dockerfile` / `docker-compose.yml` (the container path of `docs/guides/build-it-yourself.md`); the release keeps `miroirConfig.server*.json`. Proof: `pytest ci/release/tests` 15/15, `pytest scripts/tests` 58 passed.
- **10c, Admin copies.** Removed: `miroir-core/tests/test_assets/` (Admin copy with dead paths, two unread images) and `admin_data/` of library, postgres (a MongoDB-era Library Deployment row) and spotify (duplicates of `assets/deployment`). **Deviation:** `miroir-mcp/tests/assets/admin_*` stays: the miroir-mcp tests and the binary's embedded `defaultConfig.json` open it as their Admin store, so it moves with the runtime adoption of environments by miroir-mcp (follow-up). Its tests write no tracked file (checked: `git status` clean after a full run). Proof: miroir-env 35/35, Admin `modelValidation` 51/51, miroir-mcp 90/92 (the two failures, `mlElementToTS` applicationSection and `endpointToolRegistry` hot-reload on a store without `modelVersion`, are in code this branch does not touch), miroir-core 2101/2104 locally: the two failures are the layout guards reporting the stray untracked `miroir_data/54b9c72f…` folder, left in the working tree by the Slice 8 incident and awaiting A.
- Left for Slice 11: `VITE_MIROIR_TEST_CONFIG_FILENAME` in docs (`docs/contributing/testing.md`, `docs/reference/testing.md`), `test-miroir-runner.ts` and `miroirCoreIntegTestLaunch.ts`.

---

## Slice 11 — Nonreg, docs, cleanup, AC

**Status:** ✅ DONE

### 11.1 Nonreg

- Add `unit-321-tracked-assets`, `unit-321-miroir-env` and `integ-321-server-boot` to `scripts/nonreg-manifest.json`; every tier ends with `miroir-env check --tracked-clean`; the nonreg snapshot records `miroir-env show --json`.

### 11.2 Docs

- New `docs/reference/environments.md` (selection, file format, modes, commands, deviation levels).
- Update `docs/reference/data-architecture-deployments.md`, `docs/reference/testing.md` (profiles → environments), `docs/guides/build-it-yourself.md` (dev start), `AGENTS.md` (one line, within its size budget).
- `analysis.md` status → implemented; progress table DONE.

### 11.3 Issue-directory cleanup

- Move lasting assertions from `*.321.phase*.test.ts` into feature-named files (`environments.integ.test.ts`, `miroirEnvCli.unit.test.ts`); delete the issue-scoped names.

### 11.4 Tracer bullet (narrative)

1. Fresh checkout, `./build-all.sh`, `npm run miroir-env -- show` → `dev`, source `default`.
2. Create `environments/local.json` `{ "extends": "dev" }`, start the server and the client.
3. Install Spotify from the UI → it works; `git status` is clean; `local.json` lists Spotify.
4. Edit a Library Report in the UI → the change appears under `packages/miroir-test-app_deployment-library/assets/`.
5. `npm run nonreg:filesystem` → green; `miroir-env check --tracked-clean` → clean.

Automated equivalent: `serverBootFromEnvironment` + `miroirEnvReconcile` + the Slice 7 runner test + nonreg guard.

### AC checklist (#321)

| Criterion | Proven by | Status |
|---|---|---|
| Each developer sets their own environment (installed apps, stores) without affecting others | Slices 2, 3, 7 | ✅ `environmentSelection.unit` (`local.json`, `MIROIR_ENV`, `extends`), `recordInstalls.integ` (an install lands in `.miroir/<env>/apps/` and `local.json`) |
| Local deploys and Admin edits cause no tracked changes | Slice 3 test, guard | ✅ `serverBootFromEnvironment.integ` (Admin data in `.miroir/<env>/admin/`), `unit-321-tracked-assets` green at the end of `nonreg:filesystem` |
| Live model editing kept | Slice 3 (`live` model sections), tracer step 4 | ✅ `serverBootFromEnvironment.integ` (Admin's model stays `live` in its package folder); `dev` keeps every application model `live` |
| One consistent view of the configuration | `miroir-env show` (Slice 1) | ✅ `miroirEnvShow.unit`; the server log, the web client and the nonreg snapshot (`environment.json`) use the same resolution |
| Explicit, reproducible test environments locally and in cloud sessions | Slices 4, 5, 9 | ✅ `testEnvironments.unit`, `testEnvironmentConfig.unit` (a test without a test environment fails), `test_agent_session_setup.py` (`cloud-agent`) |
| Deviations warn the user; CI fails on them | Slices 5, 6, 9 | ✅ `miroirEnvReconcile.integ` (warning, error under `--strict` / `CI`); `pr-checks.yml` and nonreg run `check --strict` |

### Realization

- **11.1, nonreg.** Every tier starts with `unit-321-environment-before`: it records the asset files already changed (a developer's own edits, `tracked-assets-before.json`) and `miroir-env show --json` (`environment.json`) in the snapshot directory; step arguments take a `{snapshot_dir}` placeholder (`run-nonreg.py` `expand_argv`). Every tier ends with `unit-321-tracked-assets`: `tracked_assets_guard.py check --since` the recorded list, then `miroir-env check --strict`. **Deviations:** no separate `integ-321-server-boot` step, because `unit-321-miroir-env` (Slice 6) runs every miroir-env test, `serverBootFromEnvironment.integ` included; the last step compares with the start of the run instead of `--tracked-clean`, so a developer's uncommitted asset edits do not fail nonreg (`pr-checks.yml` keeps `--tracked-clean`). Tiers: unit 41 steps, default 37, full 1. Proof: 3 new tests in `scripts/tests` (placeholder, first and last steps of every tier, missing snapshot).
- **11.2, docs.** New `docs/reference/environments.md` (environments of the repository, selection, file format, state directory, commands, deviations, web client, first run). `testing.md` replaces its configuration-file catalogue with test environments; `build-it-yourself.md` gains "Choose your environment"; `data-architecture-deployments.md` says where deployments come from; `docs/index.md` and `AGENTS.md` link the page. `analysis.md` status: implemented.
- **11.3, test names.** `git mv` of the issue-scoped tests: `miroirEnvShow.unit` (phase1), `environmentSelection.unit` (phase2), `serverBootFromEnvironment.integ` (phase3), `testEnvironments.unit` (phase4), `miroirEnvReconcile.integ` (phase6), `recordInstalls.integ` (phase7) in miroir-env; `testEnvironmentConfig.unit`, `realServerTestEnvironment.unit`, `viteEnvironmentConfig.unit` in `miroir-standalone-app/tests/helpers`. `VITE_MIROIR_TEST_CONFIG_FILENAME` is gone: `loadTestConfigFiles` accepts only a test environment and otherwise fails with the command to run; `miroirCoreIntegTestLaunch.ts` and `test-miroir-runner.ts` read `MIROIR_ENV`.
- **Fix found by the tracer:** `npm run miroir-env` printed nothing when the command was started through a link (`node_modules/.bin`, `npx`): the entry-point test compared the module URL with the link path. `isEntryPoint` also compares with the resolved path (test "miroir-env started through a link").
- **11.4, acceptance.** The tracer narrative runs through its automated equivalents: `miroirEnvShow.unit` (step 1), `environmentSelection.unit` and `serverBootFromEnvironment.integ` (step 2), `recordInstalls.integ` and the Slice 7 runner test (step 3), the `live` sections of `dev` (step 4), `nonreg:filesystem` with the guard (step 5). The client of step 2 was checked by hand in headless Chromium at Slice 8 (a `dev` server, Library instances shown, no tracked change); the UI install of step 3 was not run by hand. `nonreg:filesystem` with the shared runner, in a clean worktree of f7915fb: 78/78 passed (1154 s), `unit-321-tracked-assets` green, snapshot `environment.json` = `local` from `environments/local.json`. `miroir-env check --strict --tracked-clean` is ok on the working tree once the two stray `miroir_data/` folders of the Slice 8 incident were deleted (A's OK), after which miroir-core `miroirModelVersionLayout` and `versioningModes.assetsLayout` pass (15/15). PR checks green on 62a6321.
- Follow-ups, outside this plan: miroir-mcp (its tests and the binary's `defaultConfig.json`) opens `miroir-mcp/tests/assets/admin_*` instead of an environment; two miroir-mcp tests fail before and after this branch (`mlElementToTS` applicationSection, `endpointToolRegistry` hot-reload); #323 (the server bundle ignores `--config`).
