# Testing Reference

This page is the authoritative reference for how tests are structured, run, and extended in the Miroir framework.

---

## Overview

Miroir tests live in two distinct layers:

| Layer | Location | Execution | Postgres |
|-------|----------|-----------|----------|
| **Unit** | `miroir-core` | In-process, in-memory | No |
| **Integration** | `miroir-standalone-app` | In-process, real store | Yes (or other backend) |

Both layers use the same test format (`MiroirTest` entity), the same runner (`runMiroirCoreTestsFromCLI`), and the same CLI (`testMiroir`). The difference is the vitest entry file and whether a `TestSessionForInteg` is wired.

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

Current registered suites (41 total, sorted):

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

`miroirCoreTransformers` is integration-only (runtime SQL queries). All others are unit-safe.

---

## Running unit tests

Unit tests run entirely in-memory. No Postgres, no filesystem seeding.

### Via `testMiroir` (preferred)

```bash
# Run one suite
MIROIR_TEST_SUITES=mustache MIROIR_TEST_MODE=unit npm run testMiroir -w miroir-core

# Run several suites
MIROIR_TEST_SUITES=alterObject,EntityPrimaryKey MIROIR_TEST_MODE=unit npm run testMiroir -w miroir-core

# Run all suites
MIROIR_TEST_MODE=unit npm run testMiroir -w miroir-core

# With argv flags (equivalent)
npm run testMiroir -w miroir-core -- --suites mustache --mode unit

# Filter to specific test labels
npm run testMiroir -w miroir-core -- --suites mustache --mode unit \
  --filter '{"mustache":["case 1"]}'
```

### Environment variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `MIROIR_TEST_SUITES` | Comma-separated suite keys, or `*` for all | `*` (all) |
| `MIROIR_TEST_MODE` | `unit` or `integration` (`integ` accepted) | `unit` |
| `MIROIR_TEST_FILTER` | JSON `{ "<suite>": ["<label>", …] }` | (none) |

### Via `testByFile`

```bash
npm run testByFile -w miroir-core -- miroir-core-tests.unit.test
```

This runs `tests/miroir-core-tests.unit.test.ts` directly with vitest, inheriting `MIROIR_TEST_SUITES` from the environment.

---

## Running integration tests

Integration tests run against a real persistence store. The test application schema and the admin deployment are configured **independently** via env vars.

### Vitest entry

`packages/miroir-standalone-app/tests/miroir-core-tests.integ.test.ts`

This file:
1. Parses env/argv (accepting `--mode integ` as alias for `integration`).
2. Calls `assertMiroirCoreIntegTestLaunchReady` — validates config and prints shell-style usage on any error.
3. Builds a `TestSessionForInteg` from env.
4. Calls `testSession.initSession()` to bootstrap the store.
5. Calls `runMiroirCoreTestsFromCLI` to run the requested suites.

### Via `testMiroir` (preferred)

```bash
# Default: sql test app + filesystem admin
MIROIR_TEST_SUITES=miroirCoreTransformers MIROIR_TEST_MODE=integ \
  MIROIR_TEST_POSTGRES_HOST=localhost \
  npm run testMiroir -w miroir-standalone-app

# Explicit argv form
npm run testMiroir -w miroir-standalone-app -- --suites miroirCoreTransformers --mode integ
```

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
The admin deployment data must be passed programmatically via `TestSessionForInteg.bundledDeploymentData` (not settable via env alone). The `miroir-sandbox` package demonstrates this pattern with `demoBundledData`.

### sql admin note

When the test application store is `sql`, the admin section of the test store uses the **same schema as the test application** (e.g. `testApplication`), not `miroirAdmin`. The real `miroirAdmin` schema stays on the filesystem-backed `deployment_Admin`. This keeps the Postgres test space isolated.

### Complete examples

```bash
# Default (sql test app, filesystem admin)
MIROIR_TEST_SUITES=miroirCoreTransformers MIROIR_TEST_MODE=integ \
  MIROIR_TEST_POSTGRES_HOST=localhost \
  npm run testMiroir -w miroir-standalone-app
****
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

# Alternate Postgres host + non-default admin assets
MIROIR_TEST_SUITES=miroirCoreTransformers MIROIR_TEST_MODE=integ \
  MIROIR_TEST_POSTGRES_HOST=10.0.0.5 \
  MIROIR_TEST_ADMIN_ASSETS_ROOT=/opt/miroir/admin-assets \
  npm run testMiroir -w miroir-standalone-app
```

---

## Key source files

### miroir-core

| File | Role |
|------|------|
| `src/5_tests/miroirCoreTestSuiteRegistry.ts` | Registry key → deployment export |
| `src/5_tests/parseMiroirTestCliConfig.ts` | CLI/env parsing (`MIROIR_TEST_*`) |
| `src/5_tests/runMiroirCoreTestsFromCLI.ts` | Main entry called by both vitest entries |
| `src/5_tests/MiroirTestTools.ts` | Unified runner dispatching by test type |
| `src/5_tests/MiroirTransformerTestTools.ts` | Transformer/function-call execution and SQL path |
| `tests/miroir-core-tests.unit.test.ts` | Vitest unit entry |
| `scripts/test-miroir-core.ts` | `testMiroir` launcher for unit tests |

### miroir-standalone-app

| File | Role |
|------|------|
| `tests/miroir-core-tests.integ.test.ts` | Vitest integration entry |
| `tests/helpers/TestSessionForInteg.ts` | Store bootstrap for all backends |
| `tests/helpers/miroirCoreIntegTestLaunch.ts` | Pre-flight validation + usage output |
| `scripts/test-miroir-runner.ts` | `testMiroir` launcher — routes to unit or integ entry |

### miroir-test-app_deployment-miroir

| Path | Role |
|------|------|
| `assets/miroir_data/a311f363-…/<uuid>.json` | MiroirTest suite instances |
| `index.ts` | Named exports (`miroirTest_<key>`) |

---

## Architecture: execution path

```
npm run testMiroir -w miroir-core          npm run testMiroir -w miroir-standalone-app
        │                                              │
scripts/test-miroir-core.ts          scripts/test-miroir-runner.ts
        │                                              │
        └──── vitest run tests/                        └──── vitest run tests/
              miroir-core-tests.unit.test.ts                  miroir-core-tests.integ.test.ts
                        │                                              │
                        │                                    TestSessionForInteg
                        │                                      initSession()
                        │                                    (create schema, open store,
                        │                                     seed library entities)
                        │                                              │
                        └─────────────┬────────────────────────────────┘
                                      │
                             runMiroirCoreTestsFromCLI(vitest, config, options)
                                      │
                              loadMiroirCoreTestSuite(suiteKey)
                              [from deployment JSON via dynamic import]
                                      │
                         runMiroirTests._runMiroirTestSuite(...)
                                      │
                       ┌──────────────┴───────────────┐
                 transformerTest          functionCallTest / queryTest / runnerTest
                       │                              │
              in-memory resolve       sql path (integration) or in-memory (unit)
```

---

## `TestSessionForInteg`: programmatic API

```typescript
import {
  TestSessionForInteg,
  buildTestApplicationStoreUnitConfiguration,
  buildAdminStoreUnitConfiguration,
  resolveTestSessionForIntegOptionsFromEnv,
} from "tests/helpers/TestSessionForInteg.js";

// From env (standard usage)
const session = new TestSessionForInteg(resolveTestSessionForIntegOptionsFromEnv(process.env));

// Explicit sql app + filesystem admin
const session = new TestSessionForInteg({
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

### `TestSessionForInteg` lifecycle

| Method | Called by | Effect |
|--------|-----------|--------|
| `initSession()` | vitest entry, once per file | Create store schemas, open PSC, seed library |
| `beforeEach()` | vitest `beforeEach` hook | Re-run `resetModel → initModel → createEntity → createInstance` |
| `teardown()` | vitest `afterAll` hook | Delete test schemas, close store |

### Deprecated aliases

`TestSessionForPostgres` and `PostgresIntegrationAdapter` are kept as thin wrappers over `TestSessionForInteg` for backward compatibility and will be removed in a future release.

---

## Adding a new suite

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

## Launch validation

When the integration entry is invoked with inconsistent or missing configuration, `assertMiroirCoreIntegTestLaunchReady` prints a full shell-style usage message before failing:

```
Usage: MIROIR_TEST_SUITES=<suite>[,<suite>...] MIROIR_TEST_MODE=integ npm run testMiroir -w miroir-standalone-app
   or: npm run testMiroir -w miroir-standalone-app -- --suites <suite> --mode integ
...
Configuration error(s):
  - MIROIR_TEST_MODE must be integ or integration for miroir-core-tests.integ.test (got "unit")
```

Checks performed:

- `MIROIR_TEST_MODE` is `integ` or `integration`
- All suite keys exist in the registry
- `--mode unit` on argv is inconsistent with the integration entry
- Store type env vars are valid values
- MongoDB connection string present when any store uses mongodb
- `bundledDeploymentData` supplied when admin store is `bundled`
- Admin asset subdirectories (`admin/`, `admin_model/`, `admin_data/`) exist on disk when admin is filesystem
- Parent of app filesystem root exists when app store is filesystem
- `MIROIR_TEST_FILTER` keys match the selected suites

---

## Running tests in the UI

1. Start the app: `npm run dev -w miroir-standalone-app`.
2. Navigate to **Miroir Tests** in the menu.
3. The list report shows all registered suites; click to open details.
4. **Run suite** executes in unit mode via `MiroirTestTools` — no Postgres required.

Integration mode is not available in the UI (it requires an active store session and is run CLI-only).

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
- Feature plans: `code-helpers/features/196-FEATURE-migrate-tests-to-MiroirTest/plan.md`, `code-helpers/features/197-FEATURE-run-integration-tests-in-the-UI/plan.md`
