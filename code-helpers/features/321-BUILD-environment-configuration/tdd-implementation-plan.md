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

**Resume note:** plan written 2026-09-27, awaiting A's approval; no slice started.

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
| 0 | Characterize tracked writes and today's deployment map | ⬜ | `scripts/tests/test_tracked_assets_guard.py`, `unit-321-tracked-assets` baseline |
| 1 | Tracer: `miroir-env show` resolves `dev` | ⬜ | MiroirTest `fn.environment.resolveEnvironment` + `miroirEnvCli.321.phase1.unit.test.ts` |
| 2 | Personal environment: `local.json`, `MIROIR_ENV`, `extends` | ⬜ | `fn.environment.resolveEnvironment` (merge leaves) + CLI test |
| 3 | Server boots from the environment, Admin data in state | ⬜ | `serverBootFromEnvironment.321.phase3.integ.test.ts` |
| 4 | Tests run on `test-filesystem` without tracked writes | ⬜ | `nonreg:filesystem` + tracked-assets guard clean |
| 5 | `test-sql`, `test-indexedDb`, `test-mongodb`; profile JSONs and test Admin copy retired | ⬜ | `nonreg:default` (Postgres) + guard |
| 6 | Reconciliation, deviation warnings, `check` / `import` / `prune` | ⬜ | `miroirEnvReconcile.321.phase6.integ.test.ts` |
| 7 | UI installs land in state and are recorded in `local.json` | ⬜ | Runner `deployApplication` integ test on `test-filesystem` |
| 8 | Web client config from the environment | ⬜ | `vite.config` environment test + manual run |
| 9 | Cloud sessions and CI | ⬜ | pytest for `agent_session_setup.py`, `pr-checks.yml` run |
| 10 | Remove dead configuration and drifted Admin copies | ⬜ | modelValidation + `nonreg:unit` + guard |
| 11 | Nonreg, docs, cleanup, AC | ⬜ | nonreg tiers + tracer narrative |

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

**Status:** ⬜ pending

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
python scripts/tracked_assets_guard.py --baseline HEAD   # clean on a fresh checkout
```

### Realization

---

## Slice 1 — Tracer: `miroir-env show` resolves `dev`

**Status:** ⬜ pending

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

---

## Slice 2 — Personal environment: `local.json`, `MIROIR_ENV`, `extends`

**Status:** ⬜ pending

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

---

## Slice 3 — Server boots from the environment, Admin data in state

**Status:** ⬜ pending

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

---

## Slice 4 — Tests run on `test-filesystem` without tracked writes

**Status:** ⬜ pending

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

---

## Slice 5 — `test-sql`, `test-indexedDb`, `test-mongodb`; profile JSONs and the test Admin copy retired

**Status:** ⬜ pending

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

---

## Slice 6 — Reconciliation, deviation warnings, `check` / `import` / `prune`

**Status:** ⬜ pending

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

---

## Slice 7 — UI installs land in state and are recorded in `local.json`

**Status:** ⬜ pending

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

---

## Slice 8 — Web client config from the environment

**Status:** ⬜ pending

### Goal

`npm run dev -w miroir-standalone-app` connects to the server of the selected environment without editing `index.tsx`.

### 8.1 RED

**Test:** `packages/miroir-standalone-app/tests/helpers/viteEnvironmentConfig.321.phase8.unit.test.ts`: the Vite config function called with `MIROIR_ENV=dev` defines `__MIROIR_CLIENT_CONFIG__` with `rootApiUrl` from `dev.json` and sets the proxy target from it.

### 8.2 GREEN

- `vite.config.js` resolves the environment and injects the client config; `index.tsx` reads it; `webMiroirConfigName` and the six statically imported `src/assets/miroirConfig*.json` go away (the in-browser emulated modes become a `client.mode: "emulatedServer"` environment only if A still uses them; decided at this slice).

### Validation

```bash
RUN_TEST=viteEnvironmentConfig npm run testByFile -w miroir-standalone-app -- viteEnvironmentConfig
npm run build -w miroir-standalone-app
# manual: server + npm run dev -w miroir-standalone-app, open http://localhost:5173
```

### Realization

---

## Slice 9 — Cloud sessions and CI

**Status:** ⬜ pending

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

---

## Slice 10 — Remove dead configuration and drifted Admin copies

**Status:** ⬜ pending

### Goal

The repository holds one Admin application and only configuration that something reads.

### 10.1 Removal list (each checked unreferenced with `git grep` at the slice)

- `Jenkinsfile`, `ci/build/*.sh`, `ci/tests/config/*.json`, `docker/ci/`, `docker/ci-builder-electronDEFUNCT/`, root `Dockerfile`, `docker-compose.yml` (release path kept: `ci/release/`, `ci/docker/`, `ci/lib/`, `docker/miroir-server/`, workflows).
- Unreferenced `miroirConfig.test-{docker-*,emulatedServer-mixed_*}.json`, `src/assets/miroirConfig-plain-no-dataflow-config.json`, Electron `assets/{10ff36f2,18db21bf}….json`.
- `miroir-core/tests/test_assets/` (no reference); stale `admin_data/` in library, postgres, spotify packages.
- `miroir-mcp/tests/assets/admin*`: its test config seeds from the canonical Admin package through `miroir-env` (runtime adoption of MCP stays a follow-up).

### Validation

```bash
npm run testByFile -w miroir-test-app_deployment-admin -- tests/modelValidation.unit.test.ts
npm run test -w miroir-mcp
python -m pytest ci/release/tests -q
npm run nonreg:unit
python scripts/tracked_assets_guard.py --baseline HEAD
```

### Realization

---

## Slice 11 — Nonreg, docs, cleanup, AC

**Status:** ⬜ pending

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
| Each developer sets their own environment (installed apps, stores) without affecting others | Slices 2, 3, 7 | ⬜ |
| Local deploys and Admin edits cause no tracked changes | Slice 3 test, guard | ⬜ |
| Live model editing kept | Slice 3 (`live` model sections), tracer step 4 | ⬜ |
| One consistent view of the configuration | `miroir-env show` (Slice 1) | ⬜ |
| Explicit, reproducible test environments locally and in cloud sessions | Slices 4, 5, 9 | ⬜ |
| Deviations warn the user; CI fails on them | Slices 5, 6, 9 | ⬜ |
