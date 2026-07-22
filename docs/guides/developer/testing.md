# Testing Guide

> Full reference including all env vars, store backends, and programmatic API: [docs/reference/testing.md](../../reference/testing.md)

---

## Overview

Miroir-core tests are stored as **deployment JSON entities** (`MiroirTest` format, Feature #196) and executed through a unified runner. The same instances run from:

- **Vitest** (CLI / CI) — both unit and integration modes
- **Miroir standalone UI** (menu **Miroir Tests** — unit mode only, no side effects)

Legacy `UnitTest` and `TransformerTest` entities remain in the deployment for backward compatibility; new work uses `MiroirTest` only.

---

## Test types

| Mode | Launcher | Vitest entry | Typical suites |
|------|----------|-------------|----------------|
| **Unit** | `testMiroir` | `miroir-core-tests.unit.test.ts` | All miroir-core registry suites except `miroirCoreTransformers` |
| **MiroirTest integ** | `testMiroir` | `miroir-core-tests.integ.test.ts` | `miroirCoreTransformers`, etc. via `MIROIR_TEST_*` |
| **App-stack integ** | `testByFile` | Per-file (`DomainController.integ.*`, storage, view) | DomainController CRUD (Data.CRUD deprecated), PersistenceStoreController (incl. #214 attribute projection), extractors |
| **Runner / Action integ** | `testMiroir` + `VITE_MIROIR_*` | `miroir-runner-tests.integ.test.ts` | `runner_library`, `domain_controller_data_crud` |

The UI always runs **unit** mode.

---

## MiroirTest structure

Instances live under:

```
packages/miroir-test-app_deployment-miroir/assets/miroir_data/a311f363-e238-4203-bdfc-29e8c160c26b/
```

Each file is a `MiroirTestDefinition` with a nested `miroirTestSuite` tree. Leaf kinds:

- `transformerTest` — transformer build/runtime assertions
- `functionCallTest` — direct function invocation (e.g. `mergePositionBased`, `mustache` helpers)
- `queryTest` — query/extractor runner with fixture
- `runnerTest` — composite action runner test
- `miroirTestSuite` — nested grouping (e.g. `adminTransformers`, `miroirCoreTransformers`)

Field naming uses `miroirTestType`, `miroirTestLabel`, `miroirTests`.

---

## Running unit tests (CLI)

**Prefer argv** over env vars (see [Parameter surface](../../reference/testing.md#parameter-surface-argv-preferred)):

```bash
# Preferred — argv
npm run testMiroir -w miroir-core -- --suites mustache --mode unit

# Filter to specific test labels
npm run testMiroir -w miroir-core -- --suites mustache --mode unit \
  --filter '{"mustache.extractDoubleBracePatterns":["should extract patterns with double braces"]}'

# Legacy — env (still supported; argv wins when both are set)
MIROIR_TEST_SUITES=mustache MIROIR_TEST_MODE=unit npm run testMiroir -w miroir-core
MIROIR_TEST_SUITES=alterObject,EntityPrimaryKey MIROIR_TEST_MODE=unit npm run testMiroir -w miroir-core
MIROIR_TEST_MODE=unit npm run testMiroir -w miroir-core
```

See [Filtering MiroirTest cases](../../reference/testing.md#filtering-miroirtest-cases) for the full filter model (registry key vs `miroirTestLabel`, runner examples).

**Environment variables:**

| Variable | Purpose | Default |
|----------|---------|---------|
| `MIROIR_TEST_SUITES` | Comma-separated registry keys, or `*` for all | `*` |
| `MIROIR_TEST_MODE` | `unit` or `integration` (`integ` accepted) | `unit` |
| `MIROIR_TEST_FILTER` | JSON filter object — see [Filtering MiroirTest cases](../../reference/testing.md#filtering-miroirtest-cases) | (none) |

---

## Running MiroirTest integration tests (CLI)

MiroirTest integration runs in `miroir-standalone-app` via `testMiroir`. Prefer **`--profile`** (and other argv flags); `MIROIR_TEST_*` env remains a legacy / CI fallback.

| Kind | `--suites` | Session | Example |
|------|------------|---------|---------|
| **Transformer** | `miroirCoreTransformers` | `IntegrationTestSession` | see below |
| **Runner** | `runner_library` | `RunnerTestSession` | see below |

```bash
# Transformer integ
npm run testMiroir -w miroir-standalone-app -- \
  --profile emulatedServer-sql --suites miroirCoreTransformers --mode integ

# Runner integ
npm run testMiroir -w miroir-standalone-app -- \
  --profile emulatedServer-sql --suites runner_library --mode integ

# Legacy — explicit env (transformer)
MIROIR_TEST_SUITES=miroirCoreTransformers MIROIR_TEST_MODE=integ \
  MIROIR_TEST_POSTGRES_HOST=localhost \
  npm run testMiroir -w miroir-standalone-app
```

Invalid configuration prints a full usage message before any test runs. See [reference/testing.md](../../reference/testing.md#running-miroirtest-integration-tests-testmiroir).

### Filtering one leaf

Filter by suite **`miroirTestLabel`**, not the registry key:

```bash
# Runner — key is runner.library
npm run testMiroir -w miroir-standalone-app -- \
  --suites runner_library --mode integ --profile emulatedServer-sql \
  --filter '{"runner.library":["Return Book Test Composite Action"]}'

# Transformer — nested suite labels
npm run testMiroir -w miroir-standalone-app -- \
  --profile emulatedServer-sql --suites miroirCoreTransformers --mode integ \
  --filter '{"miroirCoreTransformers":{"runtimeTransformerTests":{"plus":["plus with empty args fails"]}}}'
```

Details: [Filtering MiroirTest cases](../../reference/testing.md#filtering-miroirtest-cases).

---

## Running app-stack integration tests (CLI)

DomainController, persistence-store, extractor, and UI-launcher Node proofs are **per-file Vitest suites** launched with `testByFile`. Prefer **`--profile`** / **`--storage`**; `VITE_MIROIR_*` env remains a legacy fallback:

```bash
# Preferred Data CRUD — MiroirTest action suite
npm run testMiroir -w miroir-standalone-app -- \
  --profile emulatedServer-sql --suites domain_controller_data_crud --mode integ

# Deprecated imperative Data CRUD (parity harness — keep green)
npm run testByFile -w miroir-standalone-app -- \
  --profile emulatedServer-sql DomainController.integ.Data

# UI launcher against live miroir-server (B6-c C4) — storage via --storage
npm run testByFile -w miroir-standalone-app -- \
  --storage sql uiIntegrationTestLauncher.realServer.integ

# Legacy — explicit env for imperative Data CRUD
VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-sql.json \
VITE_MIROIR_LOG_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/specificLoggersConfig_DomainController_debug.json \
npm run testByFile -w miroir-standalone-app -- DomainController.integ.Data
```

Swap the profile / config file to exercise filesystem, IndexedDB, or MongoDB backends. The final argument is a Vitest filename filter. Full catalogue: [reference/testing.md](../../reference/testing.md#running-app-stack-integration-tests-testbyfile).

Common filters: `DomainController.integ`, `PersistenceStoreController.integ`, `ExtractorPersistenceStoreRunner.integ`, `ReportPage.integ`, `BlobEditorField.integ`, `JzodElementEditor.test`, `MiroirTestDisplayIntegrationLaunch.integ`.

**JzodElementEditor component tests** — large RTL suite for the schema editor (`tests/4_view/JzodElementEditor.test.tsx`). Uses in-memory `LocalCache`; optional profile env for logging parity:

```bash
VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-sql.json \
VITE_MIROIR_LOG_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/specificLoggersConfig_DomainController_debug.json \
npm run testByFile -w miroir-standalone-app -- JzodElementEditor.test
```

Filter one editor: `npm run testByFile -w miroir-standalone-app -- 4_view/JzodElementEditor.test.tsx -t "JzodObjectEditor"`. Full detail: [reference/testing.md](../../reference/testing.md#jzodelementeditortesttsx--component-integration-suite).

**MiroirTestDisplay integration launch (B6-d1)** — RTL proof for Feature #197 **Run Integration Tests** button (`tests/4_view/MiroirTestDisplayIntegrationLaunch.integ.test.tsx`). Return Book leaf on `runner.library`; Postgres required (Node SQL mock env):

```bash
VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-sql.json \
VITE_MIROIR_LOG_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/specificLoggersConfig_DomainController_debug.json \
npm run testByFile -w miroir-standalone-app -- MiroirTestDisplayIntegrationLaunch.integ
```

Detail: [reference/testing.md § MiroirTestDisplayIntegrationLaunch](../../reference/testing.md#miroirtestdisplayintegrationlaunchintegtesttsx--ui-integration-launch-b6-d1).

Full catalogue, config matrix, and architecture comparison with `testMiroir`: [reference/testing.md](../../reference/testing.md#running-app-stack-integration-tests-testbyfile).

---

## Running tests in the UI

1. `npm run dev -w miroir-standalone-app`
2. Navigate to **Miroir Tests** in the menu.
3. Open a suite; badge shows `unit` / `integration` / `mixed`.
4. **Run unit tests** — in-memory (live context).
5. **Run Integration Tests** — data-isolated launcher (same as Node UI proofs).

| Suite | How to launch integ in the UI |
|-------|-------------------------------|
| **`runner_library`** | Open suite → profile `emulatedServer-indexedDb` or `realServer-*` → ephemeral/pinned → **Run Integration Tests** |
| **`miroirCoreTransformers`** | Open suite → profile **`emulatedServer-indexedDb`** → ephemeral/pinned → **Run Integration Tests** |

CLI equivalents and Node proofs: [reference/testing.md — Running tests in the UI](../../reference/testing.md#running-tests-in-the-ui) and [UI launcher Node proofs](../../reference/testing.md#ui-launcher-node-proofs-testshelpers).

Legacy **Unit Test** / **Transformer Test** reports still exist; prefer **Miroir Tests** for new work.

---

## Writing new tests

1. Add a `MiroirTest` JSON instance under the entity data directory (RFC 4122 v4 UUID as filename).
2. Export from `packages/miroir-test-app_deployment-miroir/index.ts`.
3. Add the key to `MIROIR_TEST_SUITE_REGISTRY_NAMES` in `miroirCoreTestSuiteRegistry.ts`.
4. Rebuild: `npm run build -w miroir-test-app_deployment-miroir`.
5. Validate schema: run `tests/4_services/miroirTest.schema.unit.test.ts`.
6. Run: `MIROIR_TEST_SUITES=myNewSuite MIROIR_TEST_MODE=unit npm run testMiroir -w miroir-core`.

For migrations from legacy `UnitTest` / `TransformerTest`, use `migrateLegacyTestInstance` in `scripts/miroirTestMigrateDefinition.ts` and the manifest `miroir-test-migration-map.json`.

---

## Architecture

Two integration paths coexist in `miroir-standalone-app`:

**MiroirTest path** (`testMiroir`): deployment JSON test cases → `IntegrationTestSession` → direct `domainController` (no HTTP). Suited to large transformer/query regression suites.

**App-stack path** (`testByFile`): inline TypeScript test trees → session adapters (`DomainControllerIntegrationTestSession`, etc.) → `runAppStackIntegrationBootstrap` → client + emulated server via `RestClientStub`. Suited to DomainController, PersistenceStoreController, and view integration.

```
MiroirTest:  testMiroir → orchestrator → IntegrationTestSession → runMiroirCoreTestsFromCLI → deployment JSON leaves
App-stack:   testByFile → loadTestConfigFiles → *IntegrationTestSession → runTestOrTestSuite / it()
```

Side-by-side comparison: [reference/testing.md — Architecture](../../reference/testing.md#architecture-comparing-integration-paths).

For MiroirTest integration lifecycle (`initSession` / `beforeEach` / `teardown`), see `IntegrationTestSession` in the reference doc.

---

## Further reading

- **[Testing Reference](../../reference/testing.md)** — full env vars, all store backends, programmatic API, key file index
- [Contributing: testing guidelines](../../contributing/testing.md) — contributor commands
- Feature #196 plan: `code-helpers/features/196-FEATURE-migrate-tests-to-MiroirTest/plan.md`
- Feature #197 plan: `code-helpers/features/197-FEATURE-run-integration-tests-in-the-UI/plan.md`
