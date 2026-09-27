# 321 — Per-developer and per-test environment configuration

> Separates application source, environment definition and environment state, so that each developer and each test environment has an explicit, versioned configuration of installed applications and stores, and running state never writes into tracked files. Built on [current-state-inventory.md](current-state-inventory.md); decisions were settled with A in [direction-and-questions.md](direction-and-questions.md) (two rounds, 2026-09-27).

Related issue: https://github.com/miroir-framework/miroir/issues/321
Related: #323 (server bundle ignores `--config`), [#157 PLAN](<../157-FEATURE- harden startup sequence & enable admin deployment choice on client - server/PLAN.md>) (configurable filesystem root), [#234 deployment inventory](../234-FEATURE-versioning-modes-and-asset-migration/deployment-inventory.md), [#301](../301-BUILD-agent-session-setup/analysis.md) (agent session setup)
Key sources: [`server.ts`](../../../packages/miroir-server/src/server.ts), [`Deployment.ts`](../../../packages/miroir-core/src/1_core/Deployment.ts), [`getMiroirFundamentalMlSchema.ts`](../../../packages/miroir-core/src/0_interfaces/1_core/bootstrapMlSchemas/getMiroirFundamentalMlSchema.ts), [`integrationTestProfiles.ts`](../../../packages/miroir-standalone-app/tests/helpers/integrationTestProfiles.ts), [`fileTools.ts`](../../../packages/miroir-standalone-app/tests/utils/fileTools.ts), [`index.tsx`](../../../packages/miroir-standalone-app/src/index.tsx)

**Document role:** analysis and architectural decision record.
**Status:** decisions confirmed (rounds 1 and 2); D13–D16 are defaults picked while writing this analysis, to be confirmed with the plan.

---

## Decision record

| # | Decision | Choice |
|---|---|---|
| D1 | Where the live Admin registry lives | **Gitignored per-environment state directory**; tracked `admin_data` is only a seed |
| D2 | Form of an environment definition | **JSON file per environment, validated by an ML schema**; Admin rows are derived from it |
| D3 | Live editing of application source | **Per-section mode `live` / `copy`**; `live` in `dev`, `copy` everywhere in tests |
| D4 | Developer's own environment | **Gitignored `environments/local.json` that `extends` a tracked one**, selected by `MIROIR_ENV`, default `local` if present else `dev`; a UI install is recorded in it |
| D5 | Test environments | **One tracked environment per test profile**; each run reseeds from the one canonical Admin package; the drifted Admin copies are retired |
| D6 | Deviations | **Warn locally; fail in CI and nonreg**; nonreg records the resolved environment |
| D7 | Dead / Jenkins-era configuration | **Deleted** (Jenkinsfile, `ci/build/*.sh`, `ci/tests/config/`, `docker/ci/`, `docker/ci-builder-electronDEFUNCT/`, root `Dockerfile` / `docker-compose.yml`, unreferenced configs); the release path (`ci/release/`, `ci/docker/`, `ci/lib/`, `docker/miroir-server/`, workflows) is kept working unchanged |
| D8 | Runtimes covered | **Server, web client, test launchers, nonreg, cloud-session setup**; Docker, Electron, miroir-cli, standalone miroir-mcp adopt later |
| D9 | Package renames (framework / examples / fixtures) | **Later issue** |
| D10 | File locations | **`environments/*.json`** tracked (`dev`, `test-filesystem`, `test-sql`, `test-indexedDb`, `test-mongodb`, `cloud-agent`), `environments/local.json` gitignored, state in gitignored **`.miroir/<environment>/`** |
| D11 | Content of a definition | installed applications (package, SelfApplication, Deployment uuid, per-section mode and store), server and client settings, log preset, database hosts with passwords only as env-var references, expected secret names, `extends` |
| D12 | Transition | resolver builds `MiroirConfigServer` / `MiroirConfigClient` / test profile values in memory; `--config`, `VITE_MIROIR_TEST_CONFIG_FILENAME`, `--profile`, `webMiroirConfigName` keep working with a deprecation warning, then are removed; `--profile x` ≡ `MIROIR_ENV=test-x` |
| D13 | Admin in `dev` | **Admin model `live`, Admin data `copy`**: users, credentials, rights, Bundle, ApplicationVersion, default ViewParams are tracked seed; Deployment and AdminApplication rows are generated; secrets and ViewParams changes stay in state |
| D14 | First run of an existing checkout | **`miroir-env import`** (manual) writes the current Admin Deployment rows that differ from the definition into `local.json` |
| D15 | Reconciliation at startup | definition → state: create missing, regenerate derived rows, **warn and keep** extras; only `miroir-env prune` deletes |
| D16 | CI | `pr-checks.yml` runs **`miroir-env check`**: validates every tracked environment and fails if tracked assets changed during the job; nonreg in CI stays out of scope |
| D17 | Command naming | **`miroir-env <show│check│import│prune>`** (A: prefix commands with `miroir-`) |
| D18 | Where the code lives *(default, to confirm)* | ML schema `miroirEnvironment` in the fundamental schema (next to `miroirConfigServer`); pure resolution in miroir-core; filesystem, seeding and the `miroir-env` bin in a new node-only package **`miroir-env`** |
| D19 | Filesystem root *(default, to confirm)* | `filesystemDeploymentRootDirectory` = **repository root**, computed by the resolver; every generated path is repo-relative (`packages/…/assets/…` for `live`, `.miroir/<env>/…` for `copy`) |
| D20 | Cloud sessions *(default, to confirm)* | `scripts/agent_session_setup.py` writes `environments/local.json` = `{ "extends": "cloud-agent" }` when absent; no environment variable needs to survive the hook |

**Rationale.** The platform already has the right primitives (Deployment rows, store sections, `filesystemDeploymentRootDirectory`, the Docker seed-then-copy pattern, isolated test stores). What is missing is one place that says which deployments exist and where each section lives, and a hard line between what git versions (source, definitions, seeds) and what a run writes (state).

### D2 — Form of an environment definition

**Status:** Accepted — D2-a.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D2-a. JSON file + ML schema** ★ | `environments/<name>.json`, validated against `miroirEnvironment` in the fundamental ML schema | readable before any store opens; diffable; per-developer file is just a gitignored file; schema gives types and Zod validators through the existing generator | a second place that describes deployments (mitigated: Admin rows are derived, never edited by hand) |
| D2-b. Entity in Admin | new `Environment` Entity, rows in Admin data | editable in the UI with existing Reports | chicken-and-egg: Admin must be opened to learn where Admin lives; per-developer rows would be in the store we are removing from git |

**Decision:** D2-a. A Report over the definition files can come later (non-goal).

### D3 — Live editing

**Status:** Accepted — per-section mode.

| Mode | Meaning | Where writes land | Allowed stores |
|---|---|---|---|
| `live` | section points at the application package's `assets/{prefix}_{section}` | tracked files (intended: UI edits become git diffs) | filesystem only |
| `copy` | section is seeded from the package assets into the environment state on first use (tests: at every session start) | `.miroir/<env>/…` or a database schema named after the environment | any |

A `live` section is refused by the resolver in any environment whose name starts with `test-` (enforces D3 for tests).

### D15 — Reconciliation

| Situation found at startup | Action | Level |
|---|---|---|
| Deployment in definition, absent from state | seed `copy` sections, create Deployment + AdminApplication rows | info |
| Derived row differs from the definition | rewrite the row from the definition | info |
| Deployment in state, absent from definition (e.g. UI install not yet recorded) | keep it, open it | **warning** (error under `--strict`) |
| Environment variable already set and different from the selected test environment's value (today silent, inventory §5.1) | keep today's precedence | **warning** (error under `CI` / nonreg) |
| Tracked file under `packages/*/assets` or `packages/*/tests/assets` changed by a test run | — | nonreg / CI failure (`miroir-env check --tracked-clean`) |

---

## 1. Goals

1. **Own environment** — In order to work on the platform without disturbing anyone, as a developer, I can choose which applications are installed in my local environment and on which stores, in a file that only I have.
2. **Clean merges** — In order to merge cloud-session and local work without conflicts, as a developer, I can deploy, install or drop applications, change rights, secrets and view settings locally without any tracked file changing.
3. **Live model editing kept** — In order to version application models with git, as an application maintainer, I can still edit an application's model in the UI and see the JSON change in the package.
4. **One view** — In order to understand what a run will do, as a developer or an agent, I can print the resolved environment (applications, stores, paths, settings, and where each value came from) with `miroir-env show`.
5. **Reproducible tests** — In order to trust test results locally and in cloud sessions, as a test author, I can name the environment a test run uses, and every run starts from the same seeded state without writing into tracked files.
6. **Deviation warnings** — In order to notice drift, as a developer, I am warned at startup when the running state differs from the environment definition, and CI fails on it.
7. **Managed changes** — In order to change a shared environment (for example add an application to `dev` or to a test environment), as a maintainer, I edit one tracked file and review it in a PR.

## 2. Non-goals

- Releasing, and any change to the release path (`ci/release/`, `ci/docker/`, `docker/miroir-server/`, the build workflows) beyond keeping it working (A, 2026-09-27).
- The `--config` flag ignored by the ncc bundle: #323.
- Adopting environments in Docker, Electron, miroir-cli and standalone miroir-mcp (D8): follow-up issues. Their tracked test fixtures are only touched where D5 retires a drifted Admin copy.
- Renaming or restructuring `miroir-test-app_deployment-*` (D9): follow-up issue.
- Running nonreg or integration tests in GitHub Actions (D16).
- A Report / UI editor for environment definitions.
- Password hashes and test ciphertexts already tracked (`admin_data/6c3ab489…`, `admin/tests/secrets/`): they stay as seed and fixtures.

## 3. Current state

Full inventory: [current-state-inventory.md](current-state-inventory.md). The points the design must change:

### 3.1 Boot deployments are hardcoded (misaligned)

```typescript
// packages/miroir-server/src/server.ts:376-379
const configurations: Record<string, Deployment> = {
  [deployment_Admin.uuid]: deployment_Admin as Deployment,
  [deployment_Miroir.uuid]: deployment_Miroir as Deployment,
};
```

`deployment_Admin` / `deployment_Miroir` are imported from `miroir-test-app_deployment-admin`, whose `index.ts` imports the JSON rows in `assets/admin_data/7959d814…/`. Their store paths are relative to `filesystemDeploymentRootDirectory: ".."` (`config/miroirConfig.server.json`), i.e. `packages/`. The same objects are `defaultDeployments` and back `defaultSelfApplicationDeploymentMap` in [`Deployment.ts:58,79-82`](../../../packages/miroir-core/src/1_core/Deployment.ts), and the test fallback in `runnerIntegTestSupport.ts:260-264`.

### 3.2 Admin data is the registry and is tracked (misaligned)

After opening the two boot deployments, the server reads every Deployment row (`7959d814`) from Admin data and opens it (`server.ts:450-515`). Writers into Admin data: Runners `deployApplication` / `createApplication` / `dropApplication`, `createDeploymentCompositeAction`, ViewParams, `SecretsService`, credential change (inventory §3). In dev they all write tracked files.

### 3.3 Paths generated for UI installs

The `deployApplication` Runner (`miroir_data/e54d7dc1…/4f3cd0b1….json`) computes `prefix` from `NODE_ENV == "development" ? devRelativePathPrefix : prodRelativePathPrefix`, with `devRelativePathPrefix = "miroir-server/tests/tmp"` ([tools.ts:28](../../../packages/miroir-core/src/tools.ts)), and builds `${prefix}/admin`, `${prefix}/${applicationName}-model`, `${prefix}/${applicationName}-data`. In dev, store content lands in gitignored `packages/miroir-server/tests/tmp*/`, but the Deployment and AdminApplication rows land in tracked Admin data.

### 3.4 Configuration types exist as ML schemas (aligned)

`miroirConfigClient`, `miroirConfigServer`, `storeUnitConfiguration` are defined in [`getMiroirFundamentalMlSchema.ts:1858-1953`](../../../packages/miroir-core/src/0_interfaces/1_core/bootstrapMlSchemas/getMiroirFundamentalMlSchema.ts) and generated into `miroirFundamentalType.ts:3727-3740`. The environment schema joins them.

### 3.5 Test profile selection (partially aligned)

`INTEGRATION_TEST_PROFILES` maps a profile name to a JSON file ([integrationTestProfiles.ts:47-108](../../../packages/miroir-standalone-app/tests/helpers/integrationTestProfiles.ts)); `applyIntegrationTestProfile` sets env vars, and pre-set variables win silently. Test app stores are already isolated in `tests/tmp`; the Admin section is the tracked `miroir-standalone-app/tests/assets/admin*` copy, into which `ensureMiroirPlatform` / `ensureLibraryPlayfield` upsert Deployment rows.

### 3.6 Four Admin copies (misaligned)

| Copy | Used by |
|---|---|
| `miroir-test-app_deployment-admin/assets` (canonical, 28 model files) | server, Electron, realServer test profiles |
| `miroir-standalone-app/tests/assets` (21) | every emulated test profile |
| `miroir-mcp/tests/assets` (18) | `miroir-mcp` default and test configs |
| `miroir-core/tests/test_assets` (18) | nothing (no reference outside the folder) |

### 3.7 Web client (misaligned)

`webMiroirConfigName = "miroirConfigRealServerFilesystemGit"` ([index.tsx:141](../../../packages/miroir-standalone-app/src/index.tsx)) picks one of six statically imported configs; in real-server mode only `rootApiUrl` is used.

## 4. Target design

### 4.1 Layers

```
packages/*/assets/            application source (tracked)          ← live sections point here
environments/*.json           environment definitions (tracked)     ← dev, test-*, cloud-agent
environments/local.json       personal definition (gitignored)      ← { "extends": "dev", … }
.miroir/<env>/                environment state (gitignored)        ← Admin data, copy sections, env.lock.json
```

### 4.2 Environment definition (shape, to be fixed by the ML schema in the plan's Slice 1)

```jsonc
// environments/dev.json
{
  "name": "dev",
  "description": "Default local development environment",
  "server": { "rootApiUrl": "https://localhost:3080", "mcpUrl": "https://localhost:4080",
              "corsAllowedOrigins": ["http://localhost:5173", "https://localhost:5173"] },
  "client": { "mode": "realServer" },
  "features": { "ai": true, "mcp": true },
  "logPreset": "catch-all",
  "connections": { "postgres": { "host": "localhost", "port": 5432, "user": "postgres", "passwordEnv": "MIROIR_POSTGRES_PASSWORD" } },
  "secrets": ["spotifyClientSecret"],
  "applications": {
    "miroir":   { "package": "miroir-test-app_deployment-miroir",   "deployment": "10ff36f2-50a3-48d8-b80f-e48e5d13af8e", "store": "filesystem", "mode": "live" },
    "admin":    { "package": "miroir-test-app_deployment-admin",    "deployment": "18db21bf-f8d3-4f6a-8296-84b69f6dc48b", "store": "filesystem", "mode": "live",
                  "sections": { "data": { "mode": "copy" } } },
    "library":  { "package": "miroir-test-app_deployment-library",  "deployment": "f714bb2f-a12d-4e71-a03b-74dcedea6eb4", "store": "filesystem", "mode": "live" },
    "designer": { "package": "miroir-test-app_deployment-designer", "deployment": "f0359240-e849-4546-8158-75f4a8ae5831", "store": "filesystem", "mode": "live" }
  }
}
// environments/local.json (gitignored)
{ "extends": "dev", "applications": { "spotify": { "package": "miroir-test-app_deployment-spotify", "deployment": "fd47d115-67e2-4870-8339-1c26665d1d15", "store": "filesystem", "mode": "live" } } }
```

`miroir` and `admin` are required in every environment (the resolver refuses a definition without them). `extends` merges objects key by key; `null` removes an inherited application.

### 4.3 Resolution

1. **Select**: `MIROIR_ENV`, else `environments/local.json` if present, else `dev`. The source of the choice is reported.
2. **Load and merge** the `extends` chain; **validate** against `miroirEnvironment`.
3. **Derive**: root = repository root (D19); for each application and section, a `storeUnitConfiguration` (`live` → `packages/<package>/assets/<prefix>_<section>`, `copy` → `.miroir/<env>/<app>/<section>` or a schema `<env>_<app>` for sql); the Deployment and AdminApplication rows; `MiroirConfigServer`, `MiroirConfigClient` and the test session values (`MIROIR_TEST_*`).
4. **Seed** missing `copy` sections from the package assets (tests: wipe and reseed at session start); write `.miroir/<env>/env.lock.json` with the resolved view and a hash of the definition.
5. **Reconcile** (D15) after Admin is opened.

`miroir-env show [--json]` prints steps 1–3; `miroir-env check [--strict] [--tracked-clean]` runs 1–3 plus reconciliation against the state without starting the server; `import` and `prune` act on `local.json` and the state.

### 4.4 Integration points

| Runtime | Today | Target |
|---|---|---|
| miroir-server | hardcoded boot deployments, `filesystemDeploymentRootDirectory` from the bundled config | boot deployments and server config from the resolver; reconciliation after Admin opens; Deployment create/delete on Admin recorded into `local.json` when the selected environment is `local` |
| Web client | `webMiroirConfigName` constant | `vite.config.js` resolves the environment and injects the client config through `define` |
| Test launchers (`testMiroir`, `testByFile`, nonreg) | `--profile` → JSON file → env vars | `--profile x` → `MIROIR_ENV=test-x` → resolver; same env vars derived; state reseeded per session |
| `ensureMiroirPlatform`, `ensureLibraryPlayfield`, `runnerIntegTestSupport` fallbacks | write into tracked test Admin copy / fall back to repo Admin | write into `.miroir/test-*/admin`; fallback removed |
| Runner `deployApplication` / `createApplication` | `prefix` from `NODE_ENV` + `devRelativePathPrefix` | `prefix` = `.miroir/<env>/apps` from the resolved environment (a `templateEvaluationParams` entry) |
| Cloud sessions | nothing | `agent_session_setup.py` writes `local.json` → `cloud-agent` (D20) |
| CI | nothing | `miroir-env check` in `pr-checks.yml` |

## 5. Key reuse

| Piece | Location |
|---|---|
| Config ML schemas (`miroirConfigClient`, `miroirConfigServer`, `storeUnitConfiguration`) | `getMiroirFundamentalMlSchema.ts:1795-1953` |
| Deployment Entity | Admin `7959d814-400c-4e80-988f-a00fe582ab98` |
| AdminApplication Entity | Admin `25d935e7-9e93-42c2-aade-0472b883492b` |
| Boot deployments | Admin `18db21bf-f8d3-4f6a-8296-84b69f6dc48b`, Miroir `10ff36f2-50a3-48d8-b80f-e48e5d13af8e` |
| Row builders for Deployment / AdminApplication | `createDeploymentCompositeAction`, [Deployment.ts:132-257](../../../packages/miroir-core/src/1_core/Deployment.ts) |
| Portable root rewrite (to be replaced) | `applyPortableFilesystemDeploymentRoot`, `fileTools.ts:26-48` |
| Profile → env vars | `applyIntegrationTestProfile`, `deriveTestSessionDefaultsFromMiroirConfig.ts:76-110` |
| Seed-then-copy precedent | `packages/miroir-server/docker-entrypoint.sh`, `docker/seed/`; `seedMiroirModelVersionTmpFromPackageAssets.ts` |
| Nonreg manifest and runner | `scripts/nonreg-manifest.json`, `scripts/run-nonreg.py` |
| Session setup hook | `.claude/settings.json`, `scripts/agent_session_setup.py` |

---

## Next step

Implementation follows [tdd-implementation-plan.md](tdd-implementation-plan.md), once A approves it.
