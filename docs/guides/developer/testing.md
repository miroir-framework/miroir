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

| Mode | Vitest entry | Postgres | Typical suites |
|------|-------------|----------|----------------|
| **Unit** | `miroir-core/tests/miroir-core-tests.unit.test.ts` | No | All registered suites except `miroirCoreTransformers` |
| **Integration** | `miroir-standalone-app/tests/miroir-core-tests.integ.test.ts` | Yes (or other store backend) | `miroirCoreTransformers` and other suites against a live store |

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

```bash
# Single suite
MIROIR_TEST_SUITES=mustache MIROIR_TEST_MODE=unit npm run testMiroir -w miroir-core

# Multiple suites
MIROIR_TEST_SUITES=alterObject,EntityPrimaryKey MIROIR_TEST_MODE=unit npm run testMiroir -w miroir-core

# All suites
MIROIR_TEST_MODE=unit npm run testMiroir -w miroir-core

# Argv form
npm run testMiroir -w miroir-core -- --suites mustache --mode unit

# Label filter (JSON)
npm run testMiroir -w miroir-core -- --suites resolveConditionalSchema --mode unit \
  --filter '{"resolveConditionalSchema":["fails when wrong parentUuid is given"]}'
```

**Environment variables:**

| Variable | Purpose | Default |
|----------|---------|---------|
| `MIROIR_TEST_SUITES` | Comma-separated registry keys, or `*` for all | `*` |
| `MIROIR_TEST_MODE` | `unit` or `integration` (`integ` accepted) | `unit` |
| `MIROIR_TEST_FILTER` | JSON filter object | (none) |

---

## Running integration tests (CLI)

Integration tests run in `miroir-standalone-app`. The test application store and the admin store are configured **independently**:

```bash
# Default: sql test app + filesystem admin (most common setup)
MIROIR_TEST_SUITES=miroirCoreTransformers MIROIR_TEST_MODE=integ \
  MIROIR_TEST_POSTGRES_HOST=192.168.1.160 \
  npm run testMiroir -w miroir-standalone-app

# Filesystem app store (no Postgres needed)
MIROIR_TEST_SUITES=miroirCoreTransformers MIROIR_TEST_MODE=integ \
  MIROIR_TEST_APP_STORE_TYPE=filesystem \
  MIROIR_TEST_APP_FILESYSTEM_ROOT=/tmp/miroir-test \
  npm run testMiroir -w miroir-standalone-app
```

If the configuration is invalid, the entry prints a full usage message and exits cleanly before running any tests. See [reference/testing.md](../../reference/testing.md#launch-validation) for the full list of checks and all available env vars.

---

## Running tests in the UI

1. `npm run dev -w miroir-standalone-app`
2. Navigate to **Miroir Tests** in the menu.
3. Select a suite in the list report; open details to inspect cases.
4. Click **Run suite** — executes in unit mode via `MiroirTestTools`.

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

## Architecture (execution path)

```
Vitest entry (unit or integ)
  → runMiroirCoreTestsFromCLI(vitest, config, { executionEnvironment, testSession })
    → loadMiroirCoreTestSuite(suiteKey)   ← dynamic import from deployment JSON
    → runMiroirTests._runMiroirTestSuite(...)
      → per-leaf adapters
          transformerTest  → MiroirTransformerTestTools (in-memory or sql path)
          functionCallTest → direct function call
          queryTest        → QueryRunnerTestTools
          runnerTest       → RunnerTestTools
```

For integration, `TestSessionForInteg` bootstraps the store before `runMiroirCoreTestsFromCLI` is called:
- `initSession()` — creates schemas, opens PSC, seeds library entities (Author, Book, Publisher)
- `beforeEach()` — re-seeds (`resetModel → initModel → createEntity → createInstance`)
- `teardown()` — deletes test schemas and closes the store

---

## Further reading

- **[Testing Reference](../../reference/testing.md)** — full env vars, all store backends, programmatic API, key file index
- [Contributing: testing guidelines](../../contributing/testing.md) — contributor commands
- Feature #196 plan: `code-helpers/features/196-FEATURE-migrate-tests-to-MiroirTest/plan.md`
- Feature #197 plan: `code-helpers/features/197-FEATURE-run-integration-tests-in-the-UI/plan.md`
