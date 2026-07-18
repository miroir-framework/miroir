# Testing Reference

This page is the authoritative reference for how tests are structured, run, and extended in the Miroir framework.

---

## Overview

Miroir has three test layers:

| Layer | Location | Launcher | Store / runtime |
|-------|----------|----------|-----------------|
| **Unit** | `miroir-core` | `testMiroir` / `testByFile` | In-memory, no persistence |
| **MiroirTest integration** | `miroir-standalone-app` | `testMiroir` (`MIROIR_TEST_*`) | `IntegrationTestSession` — direct PersistenceStoreController / domainController |
| **App-stack integration** | `miroir-standalone-app` | `testByFile` (`VITE_MIROIR_*`) | `setupMiroirTest` — emulated or real HTTPS server |

**MiroirTest** suites (transformer, function-call, query, runner) are defined as deployment JSON entities and share runners in `miroir-core`. **App-stack** tests are hand-written Vitest files that exercise `DomainController`, persistence stores, extractors, and React views against a full client/server stack configured via JSON files under `tests/miroirConfig.test-*.json`.

### Parameter surface (argv preferred)

**Trajectory:** CLI **arguments are the main way to pass parameters**. Environment variables remain supported for CI and legacy scripts, but new work should prefer argv (`--suites`, `--mode`, `--filter`, `--profile`, `--storage`). Where both are present, **argv wins** for suite selection, mode, filter, and storage. Explicit `VITE_MIROIR_*` / `MIROIR_TEST_*` values still override defaults supplied by `--profile`.

| Concern | Preferred argv | Env fallback (legacy / CI) |
|---------|----------------|----------------------------|
| Suites | `--suites` / `-s` | `MIROIR_TEST_SUITES` |
| Mode | `--mode` / `-m` | `MIROIR_TEST_MODE` |
| Filter | `--filter` / `-f` | `MIROIR_TEST_FILTER` |
| Config preset | `--profile` / `-p` | `VITE_MIROIR_TEST_CONFIG_FILENAME` + related |
| Real-server store backend | `--storage` / `-S` (`sql` \| `filesystem` \| `indexedDb` \| `mongodb`) | `MIROIR_TEST_STORAGE` (set by `testByFile` when `--storage` is used) |

### Repo-wide non-regression (`npm run nonreg`)

There is **no** single Vitest/`lerna run test` command that covers the whole matrix. Use:

```bash
npm run nonreg                         # --tier default --run-all
npm run nonreg:unit                    # tier unit only
npm run nonreg:fail-fast               # tier default, stop on first failure
npm run nonreg -- --tier full --run-all
```

| Tier | Contents |
|------|----------|
| `unit` | MiroirTest unit suites via `testMiroir -w miroir-core -- --mode unit` + `RunAllMiroirTestsButton`, `MiroirTestListDisplay`, `MiroirTestDisplay` |
| `default` | `unit` + MiroirTest integ (`miroirCoreTransformers`, `runner_library`, `domain_controller_data_crud`) + curated app-stack (`DomainController.integ`, PersistenceStoreController, extractors, UI launcher/list/display proofs, `JzodElementEditor`) |
| `full` | `default` + deployment `modelValidation` packages |

Modes: `--run-all` (continue after failures; default) or `--fail-fast`.

Each run writes a **timestamped snapshot** under `test-results/nonreg/<UTC-stamp>/`:

| File | Role |
|------|------|
| `summary.json` | Machine-readable step results (for `--compare` / `--compare-only`) |
| `summary.md` | Human table |
| `logs/<step-id>.log` | Full stdout+stderr per step |

```bash
# Run + diff vs previous snapshot (`latest` is resolved BEFORE this run rewrites it)
npm run nonreg -- --compare latest
npm run nonreg -- --compare test-results/nonreg/20260717T234407Z

# Diff two existing snapshots only (no re-run) — PATH = stamp dir or summary.json
npm run nonreg -- --compare \
  test-results/nonreg/20260718T010600Z \
  test-results/nonreg/20260717T234407Z
```

Step list: [`scripts/nonreg-manifest.json`](../../scripts/nonreg-manifest.json). Runner: [`scripts/run-nonreg.py`](../../scripts/run-nonreg.py). Default integ profile: `emulatedServer-sql` (override with `--profile`).

---

## Test format: MiroirTest

Tests are **deployment JSON entities**, not `.test.ts` files. Each file in

```
packages/miroir-test-app_deployment-miroir/assets/miroir_data/
  a311f363-e238-4203-bdfc-29e8c160c26b/   ← entityMiroirTest UUID
    <uuid>.json                            ← one MiroirTestDefinition per suite
```

is a `MiroirTestDefinition` whose `definition` field is a `MiroirTestSuite` tree. Leaf node types:

| `miroirTestType` | Purpose |
|-----------------|---------|
| `transformerTest` | Build/runtime transformer assertion |
| `functionCallTest` | Direct TypeScript function call with expected result |
| `queryTest` | Query/extractor runner with fixture |
| `runnerTest` | Composite action runner test |
| `miroirTestSuite` | Nested grouping (recurses) |

Field naming: `miroirTestType`, `miroirTestLabel`, `miroirTests`. Legacy `unitTest*` / `transformerTest*` fields are frozen.

---

## Suite registry

The registry maps short string keys → deployment exports:

```
packages/miroir-core/src/5_tests/miroirCoreTestSuiteRegistry.ts
```

Current registered suites (35 total, sorted):

```
adminTransformers, alterObject, ansiColumnsToJzodSchema, buildAnyKeyMap,
defaultValueForMLSchema, EntityPrimaryKey, getAttributeTypesFromJzodSchema,
jzodObjectFlatten, JzodSchemaReferencesList, JzodSchemaReferencesSet,
jzodToCopilotKitParameter, jzodToJsonSchema, jzodToJzod_Summary,
jzodTransitiveDependencySet, jzodTypeCheck, jzodUnion_RecursiveUnfold,
jzodUnionResolvedTypeForArray, jzodUnionResolvedTypeForObject,
localizeJzodSchemaReferenceContext, menu, mergePositionBased,
metaModelTransformers, miroirCoreTransformers, modelUpdates, mustache,
pilot_transformer_plus, queries_library, resolveConditionalSchema,
resolveQueryTemplates, resolveSchemaReferenceInContext,
selectUnionBranchFromDiscriminator, tools, unfoldSchemaOnce,
unionArrayChoices, unionObjectChoices
```

`miroirCoreTransformers` is a **mixed** suite: many leaves are unit-safe; leaves with `integrationTestExpectedValue` need an integ session (runtime SQL / store). All other registry suites are unit-safe unless they declare integ expectations.

---

## Running unit tests

Unit tests run entirely in-memory. No Postgres, no filesystem seeding.

### Via `testMiroir` (preferred)

```bash
# Preferred — argv
npm run testMiroir -w miroir-core -- --suites mustache --mode unit

# Filter to specific test labels (suite miroirTestLabel → leaf labels)
npm run testMiroir -w miroir-core -- --suites mustache --mode unit \
  --filter '{"mustache.extractDoubleBracePatterns":["should extract patterns with double braces"]}'

# Legacy — env vars (still supported; argv wins when both are set)
MIROIR_TEST_SUITES=mustache MIROIR_TEST_MODE=unit npm run testMiroir -w miroir-core
MIROIR_TEST_SUITES=alterObject,EntityPrimaryKey MIROIR_TEST_MODE=unit npm run testMiroir -w miroir-core
MIROIR_TEST_MODE=unit npm run testMiroir -w miroir-core
```

See [Filtering MiroirTest cases](#filtering-miroirtest-cases) for the full model and runner examples.

### Environment variables (legacy / CI fallback)

| Variable | Purpose | Default |
|----------|---------|---------|
| `MIROIR_TEST_SUITES` | Comma-separated suite keys, or `*` for all | `*` (all) |
| `MIROIR_TEST_MODE` | `unit` or `integration` (`integ` accepted) | `unit` |
| `MIROIR_TEST_FILTER` | JSON filter — see [Filtering MiroirTest cases](#filtering-miroirtest-cases) | (none) |
| `MIROIR_SCHEMA_MODE` | `frozen` (implicit `'auto'` → static schema) or `runtime` (198 carry-on) | `runtime` (unset); `testMiroir` defaults to `frozen` |

### Schema resolution mode (`MIROIR_SCHEMA_MODE`)

Meta-model unit tests should not pay carry-on cost on every fixture load. Set **`MIROIR_SCHEMA_MODE=frozen`** so `getMiroirFundamentalSchemaForDeployment` and implicit `'auto'` resolution return the static build artifact only.

| Value | Effect |
|-------|--------|
| `frozen` | `'auto'` → static; explicit `resolveFundamentalSchemaForDeployment(..., 'extended')` still works |
| `runtime` | Legacy 198 behaviour (Library app endpoints trigger carry-on under `'auto'`) |

**Defaults:** unset env → `runtime`. `npm run testMiroir -w miroir-core` sets `frozen` unless you override.

**Opt-in extended tests** (Library `lendDocument`, app-action validation) must either:

- set `MIROIR_SCHEMA_MODE=runtime` in the describe `beforeAll`, or
- call `resolveFundamentalSchemaForDeployment(..., 'extended')` explicitly (preferred in deployment test files).

```bash
# Frozen gate (meta-model tests)
MIROIR_SCHEMA_MODE=frozen npm run testByFile -w miroir-core -- tests/1_core/modelEnvironment.unit.test.ts

# Extended app-action suite (library deployment)
npm test -w miroir-test-app_deployment-library -- "App-action validation"
```

### Via `testByFile`

```bash
npm run testByFile -w miroir-core -- miroir-core-tests.unit.test
```

This runs `tests/miroir-core-tests.unit.test.ts` directly with vitest, inheriting `MIROIR_TEST_SUITES` from the environment.

---

## Running MiroirTest integration tests (`testMiroir`)

MiroirTest integration runs against a real persistence store. Use a profile and CLI arguments for normal runs; the test application schema and admin deployment can also be configured independently through `MIROIR_TEST_*` environment variables when needed.

### Vitest entry

`packages/miroir-standalone-app/tests/miroir-core-tests.integ.test.ts`

This file:
1. Parses env/argv (accepting `--mode integ` as alias for `integration`).
2. Calls `assertMiroirCoreIntegTestLaunchReady` — validates config and prints shell-style usage on any error.
3. Builds a session via `MiroirTestIntegrationOrchestrator` (`createStandaloneAppIntegrationOrchestrator` → kind `"transformer"` → `IntegrationTestSession`).
4. Calls `testSession.initSession()` to bootstrap the store.
5. Calls `runMiroirCoreTestsFromCLI` to run the requested suites.

`scripts/test-miroir-runner.ts` routes to this entry when all requested suite keys are in the miroir-core registry (e.g. `miroirCoreTransformers`).

### Via `testMiroir` (preferred)

Use **`--profile`** so one preset sets both `VITE_MIROIR_*` (app-stack / runner) and `MIROIR_TEST_*` (transformer integ). Explicit env vars still override profile defaults.

| Kind | Suite key (`--suites`) | Session | Typical profile |
|------|------------------------|---------|-----------------|
| **Transformer** | `miroirCoreTransformers` | `IntegrationTestSession` (synthetic `testApplication`) | `emulatedServer-sql` |
| **Runner** | `runner_library` | `RunnerTestSession` (library playfield + runners) | `emulatedServer-sql` |
| **Action** | `domain_controller_data_crud`, `domain_controller_model_crud`, `domain_controller_composite_pk_crud` (all Miroir `miroir_data`) | `RunnerTestSession` + `libraryPlayfieldSeed` (`actionTest` leaves); Library is `runTarget`/testbed | `emulatedServer-sql` |

```bash
# Transformer integ
npm run testMiroir -w miroir-standalone-app -- \
  --profile emulatedServer-sql --suites miroirCoreTransformers --mode integ

# Runner integ
npm run testMiroir -w miroir-standalone-app -- \
  --profile emulatedServer-sql --suites runner_library --mode integ

# Action Data CRUD integ — Miroir-owned suite; Library is runTarget only
# (preferred over DomainController.integ.Data.CRUD.test.tsx)
npm run testMiroir -w miroir-standalone-app -- \
  --profile emulatedServer-sql --suites domain_controller_data_crud --mode integ

# Action Model CRUD integ — Miroir-owned suite; Library is runTarget only
# (preferred over DomainController.integ.Model.CRUD.test.tsx)
npm run testMiroir -w miroir-standalone-app -- \
  --profile emulatedServer-sql --suites domain_controller_model_crud --mode integ

# Action composite-PK Data CRUD integ — Miroir-owned; Library is runTarget only
# (preferred over DomainController.integ.compositePK.CRUD.test.tsx)
npm run testMiroir -w miroir-standalone-app -- \
  --profile emulatedServer-sql --suites domain_controller_composite_pk_crud --mode integ
```

Filter keys use the suite **`miroirTestLabel`**, not the registry key (see [Filtering](#filtering-miroirtest-cases)):

```bash
# One runner leaf — key is runner.library
npm run testMiroir -w miroir-standalone-app -- \
  --profile emulatedServer-sql --suites runner_library --mode integ \
  --filter '{"runner.library":["Return Book Test Composite Action"]}'

# One transformer leaf — nested labels under miroirCoreTransformers
npm run testMiroir -w miroir-standalone-app -- \
  --profile emulatedServer-sql --suites miroirCoreTransformers --mode integ \
  --filter '{"miroirCoreTransformers":{"runtimeTransformerTests":{"plus":["plus with empty args fails"]}}}'
```

Legacy explicit-env form (still supported):

```bash
MIROIR_TEST_SUITES=miroirCoreTransformers MIROIR_TEST_MODE=integration \
  MIROIR_TEST_POSTGRES_HOST=localhost \
  npm run testMiroir -w miroir-standalone-app

npm run testMiroir -w miroir-standalone-app -- --suites miroirCoreTransformers --mode integration
```

See [Integration test profiles](#integration-test-profiles) for the full catalog and CI matrix.

### Integration test profiles

Registry: `packages/miroir-standalone-app/tests/helpers/integrationTestProfiles.ts`  
Applied by `scripts/test-miroir-runner.ts` and `scripts/test-by-file.ts` via `applyIntegrationTestProfile` **before** Vitest spawn.

**Resolution order** (highest wins):

1. **CLI argv** — `--suites` / `--mode` / `--filter` / `--storage` (and `--profile` for presets)
2. Explicit `VITE_MIROIR_*` / `MIROIR_TEST_*` in the environment (legacy / CI; still overrides profile-derived defaults)
3. `--profile` / `-p` applied defaults (when env unset)
4. Built-in defaults inside `IntegrationTestSession` (local dev only; CI should use argv or a profile)

| Profile key | Config JSON | Typical use |
|-------------|-------------|-------------|
| `emulatedServer-sql` | `miroirConfig.test-emulatedServer-sql.json` | Local default — admin filesystem, miroir + library Postgres |
| `emulatedServer-filesystem` | `miroirConfig.test-emulatedServer-filesystem.json` | All store sections on filesystem (no Postgres) |
| `emulatedServer-indexedDb` | `miroirConfig.test-emulatedServer-indexedDb.json` | Miroir + library IndexedDB |
| `emulatedServer-mongodb` | `miroirConfig.test-emulatedServer-mongodb.json` | Miroir + library MongoDB |
| `ci-emulatedServer-host-sql` | `miroirConfig.test-ci-emulatedServer-host-sql.json` | CI — Postgres on host (`host.docker.internal`) |
| `ci-emulatedServer-dockerized-sql` | `miroirConfig.test-ci-emulatedServer-dockerized-sql.json` | CI — Postgres in Docker network |
| `realServer-sql` | `miroirConfig.test-realServer-sql.json` | Client REST → live `miroir-server` (Postgres on server) |
| `realServer-filesystem` | `miroirConfig.test-realServer-filesystem.json` | Client REST → live server (filesystem on server) |
| `realServer-indexedDb` | `miroirConfig.test-realServer-indexedDb.json` | Client REST → live server (IndexedDB on server) |
| `realServer-mongodb` | `miroirConfig.test-realServer-mongodb.json` | Client REST → live server (MongoDB on server) |

Transformer session defaults (`MIROIR_TEST_APP_STORE_TYPE`, `MIROIR_TEST_POSTGRES_HOST`, …) are **derived from the profile JSON** (`deriveTestSessionDefaultsFromMiroirConfig`).

#### CI matrix example

One matrix column can drive both transformer and runner integ with the same profile — no duplicate `MIROIR_TEST_POSTGRES_HOST` beside connection strings in JSON:

```yaml
# .github/workflows/integration-tests.yml (illustrative)
jobs:
  integration:
    strategy:
      matrix:
        profile:
          - emulatedServer-sql              # local-style smoke on CI runner with host Postgres
          - ci-emulatedServer-host-sql      # connection strings → host.docker.internal
          - ci-emulatedServer-dockerized-sql # connection strings → docker network IP
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - run: npm ci
      - run: npm run devBuild -w miroir-core
      - name: Transformer MiroirTest integ
        run: |
          npm run testMiroir -w miroir-standalone-app -- \
            --profile ${{ matrix.profile }} \
            --suites miroirCoreTransformers --mode integ
      - name: Runner MiroirTest integ
        run: |
          npm run testMiroir -w miroir-standalone-app -- \
            --profile ${{ matrix.profile }} \
            --suites runner_library --mode integ
```

Pick the profile that matches how Postgres is reachable in that job (host vs Docker). Paths inside JSON are repo-root relative (`PWD` at monorepo root when `npm run testMiroir` runs from the workspace).

### Store backend env vars

All vars have defaults; only set what differs from the defaults.

#### Test application store

| Variable | Values | Default |
|----------|--------|---------|
| `MIROIR_TEST_APP_STORE_TYPE` | `sql` \| `filesystem` \| `indexedDb` \| `mongodb` | `sql` |

**When `sql`:**

| Variable | Purpose | Default |
|----------|---------|---------|
| `MIROIR_TEST_POSTGRES_HOST` | Postgres host | `localhost` |

**When `filesystem`:**

| Variable | Purpose | Default |
|----------|---------|---------|
| `MIROIR_TEST_APP_FILESYSTEM_ROOT` | Writable directory for the test application | `tests/tmp/testApplication` |

**When `indexedDb`:**

| Variable | Purpose | Default |
|----------|---------|---------|
| `MIROIR_TEST_APP_INDEXEDDB_NAME` | IndexedDB name prefix | `testApplication` |

**When `mongodb`:**

| Variable | Purpose | Default |
|----------|---------|---------|
| `MIROIR_TEST_MONGODB_CONNECTION_STRING` | Connection string (**required**) | — |
| `MIROIR_TEST_APP_MONGODB_DATABASE` | Database name | `testApplication` |

#### Admin store

The admin store hosts `miroirAdmin` deployment metadata (entities, reports, menus). It is fully independent of the test application store.

| Variable | Values | Default |
|----------|--------|---------|
| `MIROIR_TEST_ADMIN_STORE_TYPE` | `filesystem` \| `sql` \| `indexedDb` \| `mongodb` \| `bundled` | `filesystem` |

**When `filesystem` (default):**

| Variable | Purpose | Default |
|----------|---------|---------|
| `MIROIR_TEST_FILESYSTEM_ROOT` | Package root for relative paths | standalone-app root |
| `MIROIR_TEST_ADMIN_ASSETS_ROOT` | Base directory with `admin/`, `admin_model/`, `admin_data/` | `tests/assets` |

**When `sql`:**

| Variable | Purpose | Default |
|----------|---------|---------|
| `MIROIR_TEST_POSTGRES_HOST` | Postgres host | `localhost` |
| `MIROIR_TEST_ADMIN_SQL_SCHEMA` | Schema name | `miroirAdmin` |

**When `indexedDb`:**

| Variable | Purpose | Default |
|----------|---------|---------|
| `MIROIR_TEST_ADMIN_INDEXEDDB_NAME` | IndexedDB name prefix | `miroirAdmin` |

**When `mongodb`:**

| Variable | Purpose | Default |
|----------|---------|---------|
| `MIROIR_TEST_MONGODB_CONNECTION_STRING` | Connection string (**required**) | — |
| `MIROIR_TEST_ADMIN_MONGODB_DATABASE` | Database name | `miroirAdmin` |

**When `bundled`:**  
The admin deployment data must be passed programmatically via `IntegrationTestSession.bundledDeploymentData` (not settable via env alone). The `miroir-sandbox` package demonstrates this pattern with `demoBundledData`.

### sql admin note

When the test application store is `sql`, the admin section of the test store uses the **same schema as the test application** (e.g. `testApplication`), not `miroirAdmin`. The real `miroirAdmin` schema stays on the filesystem-backed `deployment_Admin`. This keeps the Postgres test space isolated.

### Complete examples

```bash
# Default (sql test app, filesystem admin)
MIROIR_TEST_SUITES=miroirCoreTransformers MIROIR_TEST_MODE=integ \
  MIROIR_TEST_POSTGRES_HOST=localhost \
  npm run testMiroir -w miroir-standalone-app

# Filesystem app + filesystem admin (no Postgres)
MIROIR_TEST_SUITES=miroirCoreTransformers MIROIR_TEST_MODE=integ \
  MIROIR_TEST_APP_STORE_TYPE=filesystem \
  MIROIR_TEST_APP_FILESYSTEM_ROOT=/tmp/miroir-test \
  npm run testMiroir -w miroir-standalone-app

# MongoDB app + filesystem admin
MIROIR_TEST_SUITES=miroirCoreTransformers MIROIR_TEST_MODE=integ \
  MIROIR_TEST_APP_STORE_TYPE=mongodb \
  MIROIR_TEST_MONGODB_CONNECTION_STRING=mongodb://localhost:27017 \
  npm run testMiroir -w miroir-standalone-app
```

### Runner MiroirTest integration (`miroir-runner-tests.integ.test.ts`)

Runner-type `MiroirTest` leaves (`runnerTest`) exercise composite actions end-to-end. The Vitest entry uses `MiroirTestIntegrationOrchestrator` with kind `"runner"` → `RunnerTestSession` → `runAppStackIntegrationBootstrap`. The same `VITE_MIROIR_*` config files as app-stack tests are required.

```bash
VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-sql.json \
VITE_MIROIR_LOG_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/specificLoggersConfig_warn.json \
MIROIR_TEST_MODE=integ \
npm run testByFile -w miroir-standalone-app -- miroir-runner-tests.integ.test
```

Alternatively, `testMiroir` routes to this entry when the requested suite keys are **not** all in the miroir-core registry. With `--profile`, manual `VITE_MIROIR_*` is not required.

```bash
# All runner_library leaves — profile sets VITE_MIROIR_* + MIROIR_TEST_*
npm run testMiroir -w miroir-standalone-app -- \
  --suites runner_library --mode integ --profile emulatedServer-sql

# Return leaf only — preferred form (suite miroirTestLabel → leaf miroirTestLabel)
npm run testMiroir -w miroir-standalone-app -- \
  --suites runner_library --mode integ --profile emulatedServer-sql \
  --filter '{"runner.library":["Return Book Test Composite Action"]}'

# Same run — shorthand when the suite has a single level of leaves (leaf key only; value ignored)
npm run testMiroir -w miroir-standalone-app -- \
  --suites runner_library --mode integ --profile emulatedServer-sql \
  --filter '{"Return Book Test Composite Action":["*"]}'
```

Legacy form (manual `VITE_MIROIR_*` without `--profile`):

```bash
VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-sql.json \
VITE_MIROIR_LOG_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/specificLoggersConfig_DomainController_debug.json \
npm run testMiroir -w miroir-standalone-app -- --suites runner_library --mode integ
```

Filter rules and common mistakes: [Filtering MiroirTest cases](#filtering-miroirtest-cases).

---

## Running app-stack integration tests (`testByFile`)

These are the original standalone-app integration tests: one Vitest file per concern, with test cases defined inline in TypeScript (composite-action trees or direct `it()` blocks). They configure the full Miroir client/server stack via JSON files and are launched with `npm run testByFile`.

### Configuration

Both variables are **mandatory** — `loadTestConfigFiles` throws if either is missing — unless you pass **`--profile`** or **`--storage`** on `testByFile` (same catalog as `testMiroir`):

```bash
# Preferred — argv profile
npm run testByFile -w miroir-standalone-app -- \
  --profile emulatedServer-sql PersistenceStoreController.integ

# Real-server UI launcher — argv storage (→ realServer-<storage>)
npm run testByFile -w miroir-standalone-app -- \
  --storage sql uiIntegrationTestLauncher.realServer.integ
```

| Variable | Purpose |
|----------|---------|
| `VITE_MIROIR_TEST_CONFIG_FILENAME` | Path to a `miroirConfig.test-*.json` file (must have `.json` extension) |
| `VITE_MIROIR_LOG_CONFIG_FILENAME` | Path to a `specificLoggersConfig_*.json` file |
| `MIROIR_TEST_STORAGE` | Set by `testByFile` when `--storage` / `--profile realServer-*` is used (Vitest child reads this after flags are stripped) |

`npm run testByFile` sets `VITE_TEST_MODE=true` automatically. Explicit `VITE_MIROIR_*` still override `--profile` defaults (legacy); prefer argv going forward.

For **real-server** configs (`miroirConfig.test-realServer-*.json`), the dev server must be running at `https://localhost:3080` and Node must trust the mkcert CA:

```bash
export NODE_EXTRA_CA_CERTS="$(mkcert -CAROOT)/rootCA.pem"
```

See [HTTPS setup for developers](../guides/https-setup-developer.md).

### Config file catalogue

All configs live in `packages/miroir-standalone-app/tests/`.

| Config file | Mode | Backends exercised |
|-------------|------|-------------------|
| `miroirConfig.test-emulatedServer-sql.json` | Emulated server (`RestClientStub`) | Admin: filesystem · Miroir + Library: Postgres |
| `miroirConfig.test-emulatedServer-filesystem.json` | Emulated server | All sections: filesystem (writable under `tests/tmp/`) |
| `miroirConfig.test-emulatedServer-indexedDb.json` | Emulated server | Miroir + Library: IndexedDB |
| `miroirConfig.test-emulatedServer-mongodb.json` | Emulated server | Miroir + Library: MongoDB |
| `miroirConfig.test-emulatedServer-mixed_*.json` | Emulated server | Mixed backends per deployment |
| `miroirConfig.test-realServer-sql.json` | Real HTTPS server | Postgres via running `miroir-server` |
| `miroirConfig.test-realServer-filesystem.json` | Real HTTPS server | Filesystem via running server |
| `miroirConfig.test-realServer-indexedDb.json` | Real HTTPS server | IndexedDB via running server |
| `miroirConfig.test-realServer-mongodb.json` | Real HTTPS server | MongoDB via running server |
| `miroirConfig.test-ci-emulatedServer-*.json` | CI presets | Host-specific connection strings |

Before first run, check `filesystemDeploymentRootDirectory` inside the chosen config — it must point at your local `packages/` directory (paths in the checked-in files are developer-specific).

### Logger config options

| File | Use when |
|------|----------|
| `specificLoggersConfig_warn.json` | Default; minimal noise |
| `specificLoggersConfig_DomainController_debug.json` | Debugging DomainController flows |
| `specificLoggersConfig_info.json` | Broader INFO-level output |
| `specificLoggersConfig_trace_filesystem.json` | Filesystem store tracing |

### Launch pattern

Vitest matches files by substring. Run from the **repository root** so relative config paths resolve correctly:

```bash
VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-sql.json \
VITE_MIROIR_LOG_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/specificLoggersConfig_DomainController_debug.json \
npm run testByFile -w miroir-standalone-app -- DomainController.integ.Data
```

The final argument is a Vitest file-name filter (not a suite key). Examples:

| Filter | Matches |
|--------|---------|
| `DomainController.integ` | All DomainController integration files |
| `DomainController.integ.Data` | Deprecated imperative Data CRUD — prefer `testMiroir --suites domain_controller_data_crud` |
| `DomainController.integ.Model` | Model CRUD suite |
| `PersistenceStoreController.integ` | PersistenceStoreController low-level store tests |
| `ExtractorPersistenceStoreRunner.integ` | Extractor runner against live store |
| `ExtractorTemplatePersistenceStoreRunner.integ` | Extractor template runner |
| `uiIntegrationTestLauncher.integ` | Node proof of the UI launcher (runner + transformer leaves, emulated SQL) |
| `uiIntegrationTestLauncher.realServer.integ` | Node proof of the UI launcher against live `miroir-server` (`--storage` / `--profile realServer-*`) |
| `Runner_Miroir.integ` | Legacy runner integration (prefer `testMiroir` runner entry) |
| `Runner_Library.integ` | Legacy runner integration (prefer the `testMiroir` runner entry) |
| `ReportPage.integ` | Report view React smoke tests |
| `BlobEditorField.integ` | Blob editor component tests (no store required) |

### Test catalogue

#### UI launcher Node proofs (`tests/helpers/`)

These exercise the same in-process launcher used by the browser UI (`runUiIntegrationTestSuite`).

| File | What it proves | Launch |
|------|----------------|--------|
| [`uiIntegrationTestLauncher.integ.test.ts`](../../../packages/miroir-standalone-app/tests/helpers/uiIntegrationTestLauncher.integ.test.ts) | **Runner** leaf (Return Book) + **transformer** leaf (`plus with empty args fails`) on emulated SQL | `npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-sql uiIntegrationTestLauncher.integ` |
| [`uiIntegrationTestLauncher.realServer.integ.test.ts`](../../../packages/miroir-standalone-app/tests/helpers/uiIntegrationTestLauncher.realServer.integ.test.ts) | **Runner** leaf against live `miroir-server` (`--storage` / `--profile realServer-*`), ephemeral runTarget | see below |

For the real-server runner proof, `--storage` selects `realServer-<storage>`:

```bash
# sql | filesystem | indexedDb | mongodb
npm run testByFile -w miroir-standalone-app -- \
  --storage sql uiIntegrationTestLauncher.realServer.integ

npm run testByFile -w miroir-standalone-app -- \
  --storage filesystem uiIntegrationTestLauncher.realServer.integ

# Equivalent profile form
npm run testByFile -w miroir-standalone-app -- \
  --profile realServer-indexedDb uiIntegrationTestLauncher.realServer.integ
```

**Prerequisites (real-server):** `miroir-server` at `https://localhost:3080` with the matching store backend reachable; `NODE_EXTRA_CA_CERTS` for mkcert (see [HTTPS setup](../guides/https-setup-developer.md)). Skips when the server is unreachable.

#### DomainController (`tests/3_controllers/`)

Full-stack CRUD coverage for model and data actions.

| File | Focus |
|------|-------|
| `DomainController.integ.Data.CRUD.test.tsx` | **Deprecated** Data-section CRUD — keep green; prefer `testMiroir --suites domain_controller_data_crud` (`actionTest`) |
| `DomainController.integ.Model.CRUD.test.tsx` | **Deprecated** Model-section CRUD — keep green; prefer `testMiroir --suites domain_controller_model_crud` (`actionTest`) |
| `DomainController.integ.compositePK.CRUD.test.tsx` | **Deprecated** Composite-PK Data CRUD — keep green; prefer `testMiroir --suites domain_controller_composite_pk_crud` (`actionTest`) |
| `DomainController.integ.nonUuidPK.CRUD.test.tsx` | Non-UUID primary keys |
| `DomainController.integ.noParentUuid.CRUD.test.tsx` | Entities without `parentUuid` |

```bash
# Preferred Data CRUD — MiroirTest action suite
npm run testMiroir -w miroir-standalone-app -- \
  --profile emulatedServer-sql --suites domain_controller_data_crud --mode integ

# Deprecated imperative Data CRUD (parity harness — do not delete until cutover)
npm run testByFile -w miroir-standalone-app -- \
  --profile emulatedServer-sql DomainController.integ.Data

# Postgres — all DomainController app-stack files
npm run testByFile -w miroir-standalone-app -- \
  --profile emulatedServer-sql DomainController.integ

# Filesystem
npm run testByFile -w miroir-standalone-app -- \
  --profile emulatedServer-filesystem DomainController.integ

# IndexedDB
npm run testByFile -w miroir-standalone-app -- \
  --profile emulatedServer-indexedDb DomainController.integ.Data
```

#### Storage layer (`tests/4_storage/`)

Tests persistence below the domain layer, including the persistence controller and extractor runners.

| File | Setup | Focus |
|------|-------|-------|
| `PersistenceStoreController.integ.test.tsx` | `AppStackIntegrationTestSession` | PersistenceStoreController open/create/read/write, model actions |
| `ExtractorPersistenceStoreRunner.integ.test.tsx` | `AppStackIntegrationTestSession` | `ExtractorPersistenceStoreRunner` end-to-end |
| `ExtractorTemplatePersistenceStoreRunner.integ.test.tsx` | `AppStackIntegrationTestSession` | Extractor templates against live store |

```bash
npm run testByFile -w miroir-standalone-app -- \
  --profile emulatedServer-sql PersistenceStoreController.integ

npm run testByFile -w miroir-standalone-app -- \
  --profile emulatedServer-indexedDb ExtractorPersistenceStoreRunner.integ
```

#### View / React (`tests/4_view/`)

| File | Store / config | Focus |
|------|----------------|-------|
| `JzodElementEditor.test.tsx` | In-memory `LocalCache`; `--profile` optional | Jzod editor components |
| `MiroirTestDisplayIntegrationLaunch.integ.test.tsx` | Node emulated SQL via mocked launcher environment | `MiroirTestDisplay` launches integration and shows the result inspector |
| `MiroirTestListIntegrationLaunch.integ.test.tsx` | Node emulated SQL via mocked launcher environment | List **Run All Integration Tests** batch for `miroirCoreTransformers` (filtered leaf) |
| `JzodElementEditorReactCodeMirror.test.tsx` | — | CodeMirror sub-editor (currently commented out) |
| `ReportPage.integ.test.tsx` | Uses shared React test tools | Report rendering smoke tests |
| `BlobEditorField.integ.test.tsx` | No | Blob field editor component |
| `JzodObjectEditor.BlobIntegration.integ.test.tsx` | No | JzodObjectEditor blob integration |
| `Runner_*.integ.test.tsx` | Yes (`VITE_MIROIR_*`) | Legacy runner tests — migrating to `miroir-runner-tests.integ.test.ts` |

##### `JzodElementEditor.test.tsx` — component integration suite

This React test harness seeds an in-memory `LocalCache` and exercises the editor through React Testing Library. It does not require an external store.

**Run the full suite**

```bash
# This test needs no external store or profile.
npm run testByFile -w miroir-standalone-app -- JzodElementEditor.test
```

```bash
# One editor sub-suite
npm run testByFile -w miroir-standalone-app -- \
  4_view/JzodElementEditor.test.tsx -t "JzodObjectEditor"
```


##### `MiroirTestDisplayIntegrationLaunch.integ.test.tsx` — UI integration launch

RTL coverage for the **Run Integration Tests** button and its success inspector. It runs the `Return Book Test Composite Action` leaf in `runner.library`.

```bash
npm run testByFile -w miroir-standalone-app -- \
  --profile emulatedServer-sql MiroirTestDisplayIntegrationLaunch.integ
```

The browser profile remains **`emulatedServer-indexedDb`**; this Vitest test uses a mocked Node SQL launcher environment.

##### `MiroirTestListIntegrationLaunch.integ.test.tsx` — list integ batch

RTL coverage for list **Run All Integration Tests**. It runs one filtered `miroirCoreTransformers` leaf (`plus with empty args fails`) and asserts transformer `sessionKind` + inspector success.

```bash
npm run testByFile -w miroir-standalone-app -- \
  --profile emulatedServer-sql MiroirTestListIntegrationLaunch
```

Same pattern as the details proof: UI prefs stay on IndexedDB; the Node env mock loads SQL.

---

## Advanced implementation notes

This section is for people extending test infrastructure. It is not required to run the test suites above.

### Integration test sessions and bootstrap

App-stack integration paths use **`runAppStackIntegrationBootstrap`** (`tests/helpers/appStackIntegrationBootstrap.ts`) with an explicit phase list. Phase names are defined in `miroir-core` (`IntegrationTestBootstrap.ts`).

| Phase | Effect |
|-------|--------|
| `wireEmulatedStack` | `setupMiroirTest` — client `domainController`, optional emulated server |
| `deployMiroir` | Create Miroir meta-application deployment (`ensureMiroirPlatform`) |
| `deployLibrary` | Create library application deployment (`ensureLibraryPlayfield`) |
| `resetMiroirModel` | `resetAndInitApplicationDeployment` for Miroir only |

### Session matrix

| Session class | Kind | Playfield | Typical bootstrap phases | Entry points |
|---------------|------|-----------|--------------------------|--------------|
| `IntegrationTestSession` | `transformer` | `testApplication` | (local PersistenceStoreController — no HTTP phases) | `miroir-core-tests.integ.test.ts` |
| `AppStackIntegrationTestSession` | `appStackPersistenceStoreController` | `libraryDeployment` | wire + deployMiroir + deployLibrary | `4_storage/*.integ.test.tsx` |
| `DomainControllerIntegrationTestSession` | `domainController` | profile-dependent (see below) | profile-dependent | `3_controllers/DomainController.integ.*` |
| `RunnerTestSession` | `runner` | `libraryDeployment` | wire + deployMiroir | `miroir-runner-tests.integ`, `Runner_Miroir.integ` |

`describeSession(kind)` (or `describeIntegrationTestSession(kind, profile)` for
`domainController`) returns `{ kind, bootstrapPhases, playfield, defaultHostMode, embeddedCapable }`.
The UI test launcher uses this metadata for the integration-test inspector (bootstrap
phases, playfield, `embeddedCapable`) and to decide whether embedded host attachment is offered.
Default UI integ runs use `hostMode: "isolated"` (data-isolated in-process bootstrap).

**DomainController profiles** (`getBootstrapPhasesForDomainControllerProfile` / `getPlayfieldForDomainControllerProfile`):

| Profile | Phases | Playfield | Used by |
|---------|--------|-----------|---------|
| `miroirPlatform` | wire + deployMiroir + resetMiroirModel | `none` | CRUD suites (`beforeEach` resets miroir model; library lifecycle in test JSON) |
| `miroirAndLibrary` | wire + deployMiroir + deployLibrary | `libraryDeployment` | `DomainController.React.Model.undo-redo` |

Model.CRUD may pass `skipResetMiroirModelInInit: true` so reset runs only in `beforeEach`.

### Host modes

| `IntegrationTestHostMode` | When | Bootstrap behaviour |
|---------------------------|------|---------------------|
| **`isolated`** | CLI / Vitest (default) | Full `wireEmulatedStack` + phased deploy via `ensureMiroirPlatform` / `ensureLibraryPlayfield` |
| **`embedded`** | Live UI host (advanced) | Inject `hostExecutionEnvironment`; skip `setupMiroirTest` and destructive deploy when `requireExisting` |

The Miroir Tests report runs data-isolated integration sessions with `hostMode: "isolated"`, an ephemeral run target, and a dedicated activity tracker.

#### UI integration — store backends

| Transport | Profile example | Where it runs | Notes |
|-----------|-----------------|---------------|-------|
| **Browser emulated IndexedDB** | `emulatedServer-indexedDb` | In-browser launcher (default) | Only emulated backend with native PersistenceStoreController in the browser. Bundled config is **`miroirConfig.browser-emulatedServer-indexedDb.json`** (all sections IndexedDB + placeholder `filesystemDeploymentRootDirectory` for `setupMiroirTest`). The Vitest file `miroirConfig.test-emulatedServer-indexedDb.json` still uses filesystem admin and is **CLI-only**. **No HTTPS to `miroir-server`** for this profile — network noise may be Vite loading modules. |
| **CLI emulated** | `emulatedServer-sql`, `-filesystem`, `-mongodb` | `testMiroir` / `testByFile` (Node) | Postgres/filesystem/Mongo drivers register in Vitest `beforeAll` |
| **Real server** | `realServer-sql`, `-indexedDb`, `-filesystem`, `-mongodb` | Browser client → `https://localhost:3080` (also Node proof via `uiIntegrationTestLauncher.realServer.integ`) | Requires running `miroir-server`. Select backend with `--storage` or `--profile realServer-*`. |

Bundling `emulatedServer-sql` JSON into the UI does **not** enable SQL integration in the browser. In webApp, **transformer** integ uses IndexedDB + bundled admin, or **`realServer-sql`** (REST to `miroir-server`); **runner** integ uses IndexedDB emulated or any `realServer-*` profile. `MiroirTestDisplayIntegrationLaunch.integ.test.tsx` verifies the details **Run Integration Tests** button (runner Return Book); `MiroirTestListIntegrationLaunch.integ.test.tsx` verifies list **Run All Integration Tests** (transformer leaf). The companion launcher test [`uiIntegrationTestLauncher.integ.test.ts`](../../packages/miroir-standalone-app/tests/helpers/uiIntegrationTestLauncher.integ.test.ts) covers both runner and transformer leaves in Node without RTL; [`uiIntegrationTestLauncher.realServer.transformer.integ.test.ts`](../../packages/miroir-standalone-app/tests/helpers/uiIntegrationTestLauncher.realServer.transformer.integ.test.ts) proves transformer against live `miroir-server` (skips if down).

Embedded mode attaches to a running host without re-deploying meta-model stores.

| Session kind | `embeddedCapable` | Notes |
|--------------|-------------------|-------|
| `transformer` | `false` | Local PersistenceStoreController / synthetic `testApplication` — always isolated |
| `appStackPersistenceStoreController`, `domainController`, `runner` | `true` | App-stack sessions accept embedded host injection |

### Platform playfield helpers

`miroir-core` (`MiroirPlatformPlayfield.ts`) exports idempotent helpers for the **Miroir**
meta-application deployment:

| Helper | Role |
|--------|------|
| `ensureMiroirPlatform` | Called from `deployMiroir` bootstrap phase — create miroir deployment if absent or assert it exists |

`MiroirPlatformEnsureMode`: `"createIfAbsent"` (CLI default) | `"requireExisting"` | `"skip"`.

Orchestrator context (`IntegrationTestOrchestratorContext.platformEnsureMode`) forwards to session
bootstrap. Use `requireExisting` with `hostMode: "embedded"` when the UI host already deployed Miroir.

### Library playfield helpers

`miroir-core` exports idempotent helpers for the real **library** deployment UUIDs
(`deployment_Library_DO_NO_USE` / `selfApplicationLibrary`):

| Helper | Role |
|--------|------|
| `ensureLibraryPlayfield` | Called from `deployLibrary` bootstrap phase — create library deployment if absent (`createIfAbsent`) or assert it exists (`requireExisting`) |
| `resetLibraryPlayfield` | Per-test reset + optional seed — used in `4_storage` `beforeEach`, runner `beforeEachTest`, undo-redo |

`LibraryPlayfieldEnsureMode`: `"createIfAbsent"` (CLI default) | `"requireExisting"` | `"skip"`.

Orchestrator context (`IntegrationTestOrchestratorContext.playfieldMode`) forwards to session
bootstrap as `libraryPlayfieldEnsureMode`. Use `requireExisting` with embedded host mode when the
host already deployed the library.

Shared seed constants for standalone-app tests:
`packages/miroir-standalone-app/tests/helpers/libraryPlayfieldSeeds.ts`
(`libraryPlayfieldSeedInitParams`, `libraryEntitiesAndInstances`, `libraryEntitiesAndInstancesWithoutBook3`).

Transformer integ intentionally keeps the synthetic `testApplication` playfield — it does **not**
share library deployment UUIDs with app-stack tests.

### `MiroirTestIntegrationOrchestrator`

Port in `miroir-core` (`MiroirTestIntegrationOrchestrator.ts`). Standalone-app registers concrete
session classes via `createStandaloneAppIntegrationOrchestrator()`:

```typescript
import { createStandaloneAppIntegrationOrchestrator } from "./helpers/StandaloneAppIntegrationOrchestrator.js";

const orchestrator = createStandaloneAppIntegrationOrchestrator();

// CLI / isolated (default)
const session = orchestrator.createSession("runner", {
  miroirConfig,
  miroirActivityTracker,
  miroirEventService,
  hostMode: "isolated",
  platformEnsureMode: "createIfAbsent",
  playfieldMode: "createIfAbsent",
});

// Embedded live UI host
const embeddedSession = orchestrator.createSession("appStackPersistenceStoreController", {
  miroirConfig,
  hostMode: "embedded",
  platformEnsureMode: "requireExisting",
  playfieldMode: "requireExisting",
  hostExecutionEnvironment: hostEnv, // domainController + PersistenceStoreController manager from live app
  skipBootstrapPhases: ["wireEmulatedStack", "deployMiroir"], // optional explicit filter
  hostApplicationDeploymentMap: hostEnv.applicationDeploymentMap,
}, appStackSessionOptions);

await session.initSession();
```

`describeSession(kind)` returns `{ kind, bootstrapPhases, playfield, defaultHostMode, embeddedCapable }` from
`describeIntegrationTestSession`. For `domainController`, pass the profile to
`describeIntegrationTestSession(kind, profile)` directly.

**Orchestrator context fields:**

| Field | Purpose |
|-------|---------|
| `hostMode` | `"isolated"` (default) or `"embedded"` |
| `hostExecutionEnvironment` | Injected `domainController` + `persistenceStoreControllerManager` for embedded runs |
| `platformEnsureMode` | `ensureMiroirPlatform` mode for `deployMiroir` phase |
| `playfieldMode` | `ensureLibraryPlayfield` mode for `deployLibrary` phase |
| `skipBootstrapPhases` | Explicit phase filter (e.g. skip `deployMiroir` when host is live) |
| `hostApplicationDeploymentMap` | Override session deployment map from live UI |

### Deprecated setup helpers

`setupMiroirTestAndCreateMiroirDeployment` and `setupMiroirTestAndDeployMiroirApp` remain as thin
wrappers (used by characterization unit tests) but are **deprecated** — prefer session classes above.
`setupMiroirTest` is still the public primitive for wiring client/server stack inside the bootstrap.

---

### Architecture: comparing integration paths

#### MiroirTest path (`testMiroir` → `miroir-core-tests.integ.test.ts`)

```
npm run testMiroir -w miroir-standalone-app
  scripts/test-miroir-runner.ts  [routes when suite keys ⊆ miroir-core registry]
    vitest → miroir-core-tests.integ.test.ts
      assertMiroirCoreIntegTestLaunchReady(MIROIR_TEST_*)
      createStandaloneAppIntegrationOrchestrator().createSession("transformer", …)
        IntegrationTestSession.initSession()
        register store startups from MIROIR_TEST_APP/ADMIN_STORE_TYPE
        setupMiroirDomainController (local PersistenceStoreController, no HTTP)
        seed library entities via domainController actions
      runMiroirCoreTestsFromCLI
        loadMiroirCoreTestSuite(key)  ← deployment JSON
        runMiroirTests._runMiroirTestSuite
          transformerTest / functionCallTest / queryTest leaves
```

**Characteristics:** env-var configuration; no emulated HTTP server; tests defined as `MiroirTest` JSON entities; `IntegrationTestSession` owns store lifecycle; pre-flight validation with usage output.

#### App-stack path (`testByFile` → `DomainController.integ.*.test.tsx`)

```
npm run testByFile -w miroir-standalone-app -- DomainController.integ.Data
  vitest → DomainController.integ.Data.CRUD.test.tsx  [top-level module setup]
    loadTestConfigFiles(VITE_MIROIR_TEST_CONFIG_FILENAME, VITE_MIROIR_LOG_CONFIG_FILENAME)
    miroirAppStartup + store section startups
    beforeAll:
      DomainControllerIntegrationTestSession.initSession()
        runAppStackIntegrationBootstrap(phases from miroirPlatform profile)
        setupMiroirTest → client domainController + RestClientStub (wire phase)
        deployMiroir + resetMiroirModel phases
    beforeEach:
      resetAndInitApplicationDeployment (library deployment) — unchanged per suite
    describe/it:
      runTestOrTestSuite(testActions, domainController, …)
        composite-action tree executed step-by-step via domainController
```

**Characteristics:** JSON config files (`miroirConfig.test-*.json`); full client/server stack with optional `RestClientStub` emulated HTTPS; tests defined inline as `TestCompositeActionParams` records; per-file `beforeAll`/`afterAll`; no `MIROIR_TEST_*` validation layer.

#### Side-by-side comparison

| | MiroirTest (`testMiroir`) | App-stack (`testByFile`) |
|--|--------------------------|--------------------------|
| **Vitest entry** | Single file per family (`miroir-core-tests.integ.test.ts`) | One file per test suite |
| **Configuration** | `MIROIR_TEST_*` env vars | `VITE_MIROIR_TEST_CONFIG_FILENAME` + `VITE_MIROIR_LOG_CONFIG_FILENAME` |
| **Test definition** | `MiroirTest` deployment JSON | Inline TypeScript (`testActions`, `it()`) |
| **Bootstrap** | `IntegrationTestSession` via orchestrator | `DomainControllerIntegrationTestSession` / `AppStackIntegrationTestSession` / `RunnerTestSession` |
| **HTTP layer** | None (direct PersistenceStoreController) | `RestClientStub` when `emulateServer: true` |
| **Store layout** | Independent app + admin backends via env | Per-deployment `deploymentStorageConfig` in JSON |
| **Reset between cases** | `testSession.beforeEach()` | Per-file `beforeEach` or composite-action `beforeEach` |
| **Pre-flight checks** | `assertMiroirCoreIntegTestLaunchReady` | `loadTestConfigFiles` throws on missing env |
| **Typical use** | Transformer/query regression at scale | DomainController, PersistenceStoreController, extractor, view integration |

Both paths ultimately drive actions through `domainController`, but the MiroirTest path bypasses the HTTP/RestClient layer and reads test cases from deployment assets, while the app-stack path exercises the same code paths the standalone UI uses (including emulated server routing).

#### Unit tests (miroir-core)

```
npm run testMiroir -w miroir-core
  scripts/test-miroir-core.ts
    vitest → miroir-core-tests.unit.test.ts
      runMiroirCoreTestsFromCLI (no testSession)
        loadMiroirCoreTestSuite → runMiroirTests (in-memory)
```

---

### Key source files

#### miroir-core

| File | Role |
|------|------|
| `src/5_tests/miroirCoreTestSuiteRegistry.ts` | Registry key → deployment export |
| `src/5_tests/parseMiroirTestCliConfig.ts` | CLI/env parsing (`MIROIR_TEST_*`) |
| `src/5_tests/runMiroirCoreTestsFromCLI.ts` | Main entry called by both vitest entries |
| `src/5_tests/MiroirTestTools.ts` | Unified runner dispatching by test type |
| `src/5_tests/MiroirTransformerTestTools.ts` | Transformer/function-call execution and SQL path |
| `src/5_tests/IntegrationTestBootstrap.ts` | Bootstrap phase descriptors + `IntegrationTestPlayfield` + host mode metadata |
| `src/5_tests/LibraryPlayfield.ts` | `ensureLibraryPlayfield`, `resetLibraryPlayfield`, `LibraryPlayfieldEnsureMode` |
| `src/5_tests/MiroirPlatformPlayfield.ts` | `ensureMiroirPlatform`, `MiroirPlatformEnsureMode` |
| `src/5_tests/MiroirTestIntegrationOrchestrator.ts` | Orchestrator port + host/playfield context |
| `tests/miroir-core-tests.unit.test.ts` | Vitest unit entry |
| `scripts/test-miroir-core.ts` | `testMiroir` launcher for unit tests |

#### miroir-standalone-app

| File | Role |
|------|------|
| `tests/miroir-core-tests.integ.test.ts` | MiroirTest integration entry (`testMiroir`) |
| `tests/miroir-runner-tests.integ.test.ts` | Runner / Action MiroirTest integration entry (`runner_library` from library; `domain_controller_*_crud` from Miroir `miroir_data`) |
| `tests/helpers/IntegrationTestSession.ts` | Transformer + app-stack PersistenceStoreController sessions |
| `tests/helpers/DomainControllerIntegrationTestSession.ts` | DomainController CRUD / undo-redo bootstrap |
| `tests/helpers/appStackIntegrationBootstrap.ts` | Shared `runAppStackIntegrationBootstrap` |
| `tests/helpers/StandaloneAppIntegrationOrchestrator.ts` | Orchestrator implementation (all session kinds) |
| `tests/helpers/libraryPlayfieldSeeds.ts` | Shared library seed data for playfield resets |
| `tests/helpers/RunnerTestSession.ts` | Runner MiroirTest + legacy runner integ bootstrap |
| `tests/helpers/miroirCoreIntegTestLaunch.ts` | Pre-flight validation + usage output |
| `tests/helpers/runMiroirRunnerTestsFromCLI.ts` | Runner test CLI orchestration |
| `tests/utils/fileTools.ts` | `loadTestConfigFiles` for app-stack tests |
| `src/miroir-fwk/4-tests/setupMiroirTest.ts` | `setupMiroirTest` (public); deprecated `setupMiroirTestAnd*` wrappers |
| `src/miroir-fwk/4-tests/runTestOrTestSuite.ts` | Composite-action test tree runner |
| `tests/miroirConfig.test-*.json` | App-stack store/backend presets |
| `scripts/test-miroir-runner.ts` | `testMiroir` launcher — routes core vs runner integ |

#### App-stack integration test files

| Path | Role |
|------|------|
| `tests/3_controllers/DomainController.integ.*.test.tsx` | DomainController CRUD suites |
| `tests/4_storage/PersistenceStoreController.integ.test.tsx` | PersistenceStoreController integration |
| `tests/4_storage/ExtractorPersistenceStoreRunner.integ.test.tsx` | Extractor runner |
| `tests/4_storage/ExtractorTemplatePersistenceStoreRunner.integ.test.tsx` | Extractor template runner |
| `tests/4_view/ReportPage.integ.test.tsx` | Report view React tests |
| `tests/4_view/BlobEditorField.integ.test.tsx` | Blob editor component tests |

#### miroir-test-app_deployment-miroir

| Path | Role |
|------|------|
| `assets/miroir_data/a311f363-…/<uuid>.json` | MiroirTest suite instances |
| `index.ts` | Named exports (`miroirTest_<key>`) |

---

### `IntegrationTestSession`: programmatic API

```typescript
import {
  IntegrationTestSession,
  buildTestApplicationStoreUnitConfiguration,
  buildAdminStoreUnitConfiguration,
  resolveTestSessionForIntegOptionsFromEnv,
} from "tests/helpers/IntegrationTestSession.js";

// From env (standard usage)
const session = new IntegrationTestSession(resolveTestSessionForIntegOptionsFromEnv(process.env));

// Explicit sql app + filesystem admin
const session = new IntegrationTestSession({
  testApplicationStore: {
    emulatedServerType: "sql",
    postgresHostName: "localhost",
  },
  adminStore: {
    emulatedServerType: "filesystem",
    adminAssetsRootDirectory: resolveDefaultAdminAssetsRoot(),
    filesystemDeploymentRootDirectory: resolveDefaultFilesystemDeploymentRoot(),
  },
});

const executionEnvironment = await session.initSession();
// ...
await session.teardown();
```

#### `IntegrationTestSession` lifecycle

| Method | Called by | Effect |
|--------|-----------|--------|
| `initSession()` | vitest entry, once per file | Create store schemas, open PersistenceStoreController, seed library |
| `beforeEach()` | vitest `beforeEach` hook | Re-run `resetModel → initModel → createEntity → createInstance` |
| `teardown()` | vitest `afterAll` hook | Delete test schemas, close store |

#### Deprecated aliases

`IntegrationTestSessionForPostgres` is kept as thin wrappers over `IntegrationTestSession` for backward compatibility and will be removed in a future release.

---

### Adding a new suite

1. Create a `MiroirTestDefinition` JSON in `assets/miroir_data/a311f363-…/<uuid>.json`.
2. Export it from `packages/miroir-test-app_deployment-miroir/index.ts`:
   ```typescript
   export { default as miroirTest_myNewSuite } from "./assets/miroir_data/.../uuid.json" assert { type: "json" };
   ```
3. Add the key to `MIROIR_TEST_SUITE_REGISTRY_NAMES` in `miroirCoreTestSuiteRegistry.ts`.
4. Rebuild: `npm run build -w miroir-test-app_deployment-miroir`.
5. Validate schema: `VITE_TEST_MODE=true npx vitest run tests/4_services/miroirTest.schema.unit.test.ts -w miroir-core`.
6. Run: `MIROIR_TEST_SUITES=myNewSuite MIROIR_TEST_MODE=unit npm run testMiroir -w miroir-core`.

---

## Filtering MiroirTest cases

`--filter` / `MIROIR_TEST_FILTER` selects **which leaves run** inside the suite(s) already chosen by `--suites`. Non-selected leaves are registered in Vitest as **skipped**.

### Three names (easy to confuse)

| Name | Example | Used in |
|------|---------|---------|
| **Registry key** | `runner_library`, `domain_controller_data_crud`, `miroirCoreTransformers` | `--suites`, `MIROIR_TEST_SUITES`, UI suite key |
| **Suite `miroirTestLabel`** | `runner.library`, `miroirCoreTransformers`, nested `plus` | Filter object **keys** (when nested) |
| **Leaf `miroirTestLabel`** | `Return Book Test Composite Action`, `plus with empty args fails` | Filter object **values** (string array) |

For **runner** suites the registry key and suite label often differ: `--suites runner_library` but filter key `runner.library`. For **transformer** suites such as `miroirCoreTransformers` they usually match; nest intermediate suite labels in the filter JSON.

Find labels in the MiroirTest JSON under `definition.miroirTestLabel` (suite) and each leaf’s `miroirTestLabel`.

### JSON shapes (equivalent after normalization)

**Recommended — shorthand** (suite label → leaf labels):

```json
{ "runner.library": ["Return Book Test Composite Action"] }
```

**Canonical** (explicit `testList`):

```json
{ "testList": { "runner.library": ["Return Book Test Composite Action"] } }
```

**Single flat suite — leaf key only** (when every filter key matches a leaf label in that suite; array values are ignored):

```json
{ "Return Book Test Composite Action": ["*"] }
```

**Run all leaves in the selected suite(s)** — omit `--filter` entirely.

**Run only listed leaves across a flat suite** (no nested suite key):

```json
{ "testList": ["Return Book Test Composite Action", "Lend Book Test Composite Action"] }
```

### Use cases

#### 1. One runner integ leaf (library return)

```bash
npm run testMiroir -w miroir-standalone-app -- \
  --suites runner_library --mode integ --profile emulatedServer-sql \
  --filter '{"runner.library":["Return Book Test Composite Action"]}'
```

#### 2. Two leaves in the same suite

```bash
--filter '{"runner.library":["Lend Book Test Composite Action","Return Book Test Composite Action"]}'
```

#### 3. One transformer integ leaf inside a large suite

```bash
npm run testMiroir -w miroir-standalone-app -- \
  --profile emulatedServer-sql --suites miroirCoreTransformers --mode integ \
  --filter '{"miroirCoreTransformers":{"runtimeTransformerTests":{"plus":["plus with empty args fails"]}}}'
```

Nest objects for intermediate suite labels; use a string array for the leaf list at the innermost level. Labels come from that suite’s JSON (`miroirTestLabel`).

#### 4. One unit-test leaf (functionCallTest)

```bash
npm run testMiroir -w miroir-core -- --suites mustache --mode unit \
  --filter '{"mustache.extractDoubleBracePatterns":["should extract patterns with double braces"]}'
```

#### 5. Legacy environment-variable form

```bash
MIROIR_TEST_FILTER='{"runner.library":["Return Book Test Composite Action"]}' \
  npm run testMiroir -w miroir-standalone-app -- \
  --profile emulatedServer-sql --suites runner_library --mode integ
```

### Common mistakes

| What you typed | What happens |
|----------------|--------------|
| `'{"Return Book Test Composite Action": "*"}'` (no `testList`, leaf as top-level key) | **Works** after fix — treated as leaf-key shorthand when the label exists in the suite |
| `'{"runner_library":["Return Book Test Composite Action"]}'` | **No match** — key must be `runner.library` (suite label), not registry key |
| `'{"testList":{"Return Book Test Composite Action":["*"]}}'` with wrong nesting | **No match** + console warning — use `runner.library` as the key unless using leaf-key shorthand |
| Wildcard `"*"` as a leaf name | **Not supported** — list explicit leaf labels or omit `--filter` |

When the filter matches nothing, Vitest still runs the file but all cases are **skipped**; the runner logs a warning listing available leaf labels.

After changing filter logic in `miroir-core`, rebuild before running standalone-app tests:

```bash
npm run devBuild -w miroir-core
```

---

## Launch validation

When the integration entry is invoked with inconsistent or missing configuration, `assertMiroirCoreIntegTestLaunchReady` prints a full shell-style usage message (including `--profile emulatedServer-sql`) and a profile tip before failing:

```
Usage: MIROIR_TEST_SUITES=<suite>[,<suite>...] MIROIR_TEST_MODE=integ npm run testMiroir -w miroir-standalone-app
   or: npm run testMiroir -w miroir-standalone-app -- --suites <suite> --mode integ
   or: npm run testMiroir -w miroir-standalone-app -- --profile <profile> --suites <suite> --mode integ
...
Configuration error(s):
  - MIROIR_TEST_MODE must be integ or integration for miroir-core-tests.integ.test (got "unit")

Tip: run via testMiroir with --profile emulatedServer-sql to set VITE_MIROIR_* and MIROIR_TEST_* from one preset ...
```

Checks performed:

- `MIROIR_TEST_MODE` is `integ` or `integration`
- All suite keys exist in the registry
- `--mode unit` on argv is inconsistent with the integration entry
- Store type env vars are valid values
- **CI:** when sql store backends are used, `MIROIR_TEST_POSTGRES_HOST` or profile config (`VITE_MIROIR_TEST_CONFIG_FILENAME`) must be set
- MongoDB connection string present when any store uses mongodb
- `bundledDeploymentData` supplied when admin store is `bundled`
- Admin asset subdirectories (`admin/`, `admin_model/`, `admin_data/`) exist on disk when admin is filesystem
- Parent of app filesystem root exists when app store is filesystem
- Filter shape is validated at runtime when suites execute (see [Filtering MiroirTest cases](#filtering-miroirtest-cases))

---

## Running tests in the UI

1. Start the app: `npm run dev -w miroir-standalone-app`.
2. Navigate to **Miroir Tests** in the menu.
3. Use the **list** report for batch runs, or open a suite’s **details** for a single-suite cockpit. The badge on details shows `unit` / `integration` / `mixed`.

### List vs details × unit vs integration

| Surface | Unit | Integration |
|---------|------|-------------|
| **List** (`MiroirTestListDisplay`) | **Run All Unit Tests** — in-memory unit leaves for every suite in the list | **Run All Integration Tests** — shown only when ≥1 UI-launchable integ suite is in the list; runs launchable suites **sequentially** under one mutex. Shares profile / run-target prefs with details. |
| **Details** (`MiroirTestDisplay`) | **Run unit tests** when the suite has unit-capable leaves | **Run Integration Tests** when the suite has integ-capable leaves (runner = integ-only; mixed transformer = both buttons) |

List **Run All Unit Tests** never launches integration sessions. List/details integ need a **browser-launchable** profile — in webApp that is **`emulatedServer-indexedDb`** (default) or a **`realServer-*`** profile with `miroir-server` up. Emulated SQL/filesystem/Mongo profiles stay Electron/CLI-only.

### Manual checklist (webApp)

1. Miroir deployment → Miroir Tests **list** → **Run All Unit Tests** completes; label is unambiguous (not “Run All Miroir Tests”).
2. Same list → profile `emulatedServer-indexedDb` → **Run All Integration Tests** runs launchable suites only (expect `miroirCoreTransformers` and/or `runner_library` when present in the fetched list).
3. Details `miroirCoreTransformers` → both unit and integ buttons; run unit then integ.
4. Details `runner_library` → integ only (no unit button).
5. Details unit-only suite (e.g. `EntityPrimaryKey`) → unit only.

### Runner vs transformer from the UI

Both use the same **Run Integration Tests** affordance (details button, or list **Run All Integration Tests** batch). The launcher picks the session kind from the suite’s leaves:

| Suite (instance name) | Session | What to select | Browser profile |
|-----------------------|---------|----------------|-----------------|
| `runner_library` (label `runner.library`) | `RunnerTestSession` | Ephemeral or pinned run target | `emulatedServer-indexedDb` (default) or `realServer-*` |
| `miroirCoreTransformers` | `IntegrationTestSession` / `RealServerTransformerTestSession` | Ephemeral or pinned `testApplication` identity | `emulatedServer-indexedDb` or `realServer-sql` (server up) |

**Runner**

1. Open **runner_library** / `runner.library` (or use list **Run All Integration Tests** when the suite is in the list).
2. Choose profile (`emulatedServer-indexedDb` or a `realServer-*` profile with `miroir-server` up).
3. Choose **Ephemeral run** (fresh UUIDs) or **Pinned suite targets**.
4. Click **Run Integration Tests** — inspector should show `sessionKind: runner`.

**Transformer**

1. Open **miroirCoreTransformers** (or use the list batch).
2. Choose profile **`emulatedServer-indexedDb`** or **`realServer-sql`** (requires `miroir-server` at `https://localhost:3080`).
3. Choose ephemeral or pinned identity.
4. Click **Run Integration Tests** — inspector should show `sessionKind: transformer`.

Mixed suites (e.g. `miroirCoreTransformers`) show separate unit and integration actions when both leaf kinds are present.

Browser-supported profiles:

| Profile | Store location | Runner | Transformer |
|---------|----------------|--------|-------------|
| `emulatedServer-indexedDb` | Browser IndexedDB | ✅ | ✅ |
| `realServer-sql` | Postgres behind `miroir-server` | ✅ | ✅ (REST; server must be up) |
| `realServer-filesystem` | Filesystem behind `miroir-server` | ✅ | — |
| `realServer-indexedDb` | IndexedDB behind `miroir-server` | ✅ | — |
| `realServer-mongodb` | MongoDB behind `miroir-server` | ✅ | — |

Real-server profiles require a reachable `miroir-server` and the selected backend on that server. The browser is REST-only for these profiles.

---

## Rebuilding after schema or deployment changes

```bash
# After changing MiroirTest JSON assets
npm run build -w miroir-test-app_deployment-miroir

# After changing miroir-core entity definitions or generated types
npm run devBuild -w miroir-core

# After changing miroir-react source
npm run build -w miroir-react
```

---

## See also

- [Contributing: testing guidelines](../contributing/testing.md) — commands for contributors
- [Developer guide: testing](../guides/developer/testing.md) — context and concepts
