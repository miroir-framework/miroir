# Testing Guidelines for Contributors

> Full reference (all env vars, store backends, programmatic API): [docs/reference/testing.md](../reference/testing.md)

---

## Prerequisites

```bash
npm run build -w miroir-test-app_deployment-miroir
npm run devBuild -w miroir-core   # includes generated types
```

Integration tests need a reachable store when using SQL/ MongoDB configs:

- **MiroirTest integ** (`testMiroir`): configure via `MIROIR_TEST_*` (default Postgres host `localhost`).
- **App-stack integ** (`testByFile`): configure via `miroirConfig.test-*.json` files and `VITE_MIROIR_TEST_CONFIG_FILENAME`. Check `filesystemDeploymentRootDirectory` in the chosen config matches your machine.

---

## Running tests

### Unit (no database)

```bash
# Single suite by key
MIROIR_TEST_SUITES=mustache MIROIR_TEST_MODE=unit npm run testMiroir -w miroir-core

# Multiple suites
MIROIR_TEST_SUITES=alterObject,EntityPrimaryKey MIROIR_TEST_MODE=unit npm run testMiroir -w miroir-core

# Argv form — same as above
npm run testMiroir -w miroir-core -- --suites mustache --mode unit

# All registered suites
MIROIR_TEST_MODE=unit npm run testMiroir -w miroir-core
```

### MiroirTest integration (`testMiroir`)

Runs in `miroir-standalone-app`, not `miroir-core`:

```bash
# Default: sql test application + filesystem admin
MIROIR_TEST_SUITES=miroirCoreTransformers MIROIR_TEST_MODE=integ \
  MIROIR_TEST_POSTGRES_HOST=localhost \
  npm run testMiroir -w miroir-standalone-app

# Filesystem test application (no Postgres)
MIROIR_TEST_SUITES=miroirCoreTransformers MIROIR_TEST_MODE=integ \
  MIROIR_TEST_APP_STORE_TYPE=filesystem \
  MIROIR_TEST_APP_FILESYSTEM_ROOT=/tmp/miroir-test \
  npm run testMiroir -w miroir-standalone-app
```

See [reference/testing.md](../reference/testing.md#running-miroirtest-integration-tests-testmiroir) for all `MIROIR_TEST_*` options.

### App-stack integration (`testByFile`)

DomainController, persistence-store, and extractor tests use JSON config files:

```bash
# DomainController data CRUD (emulated server + Postgres)
VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-sql.json \
VITE_MIROIR_LOG_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/specificLoggersConfig_DomainController_debug.json \
npm run testByFile -w miroir-standalone-app -- DomainController.integ.Data

# All DomainController suites
VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-sql.json \
VITE_MIROIR_LOG_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/specificLoggersConfig_warn.json \
npm run testByFile -w miroir-standalone-app -- DomainController.integ

# Persistence store controller
VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-sql.json \
VITE_MIROIR_LOG_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/specificLoggersConfig_warn.json \
npm run testByFile -w miroir-standalone-app -- PersistenceStoreController.integ

# Extractor runner (IndexedDB example)
VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-indexedDb.json \
VITE_MIROIR_LOG_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/specificLoggersConfig_warn.json \
npm run testByFile -w miroir-standalone-app -- ExtractorPersistenceStoreRunner.integ
```

Full catalogue: [reference/testing.md](../reference/testing.md#running-app-stack-integration-tests-testbyfile).

### Per-file vitest

```bash
# Unit entry directly
npm run testByFile -w miroir-core -- miroir-core-tests.unit.test

# Integration entry directly
MIROIR_TEST_SUITES=miroirCoreTransformers MIROIR_TEST_MODE=integ \
  npm run testByFile -w miroir-standalone-app -- miroir-core-tests.integ.test
```

### Apparatus / helper unit tests

These tests cover the test infrastructure itself and do not need a store:

```bash
# IntegrationTestSession config builders
VITE_TEST_MODE=true npx vitest run tests/helpers/IntegrationTestSession.unit.test.ts \
  -w miroir-standalone-app

# miroirCoreIntegTestLaunch validation logic
VITE_TEST_MODE=true npx vitest run tests/helpers/miroirCoreIntegTestLaunch.unit.test.ts \
  -w miroir-standalone-app

# CLI config parsing
VITE_TEST_MODE=true npx vitest run tests/5-tests/parseMiroirTestCliConfig.unit.test.ts \
  -w miroir-core

# Suite registry loader
VITE_TEST_MODE=true npx vitest run tests/5-tests/miroirTestSuiteRegistry.unit.test.ts \
  -w miroir-core
```

### Schema validation

Run after any change to MiroirTest JSON assets:

```bash
VITE_TEST_MODE=true npx vitest run tests/4_services/miroirTest.schema.unit.test.ts \
  -w miroir-core
```

---

## Key source files

### miroir-core

| File | Role |
|------|------|
| `src/5_tests/miroirCoreTestSuiteRegistry.ts` | Registry key → deployment export (35 suites) |
| `src/5_tests/parseMiroirTestCliConfig.ts` | CLI/env parsing for `MIROIR_TEST_*` vars |
| `src/5_tests/runMiroirCoreTestsFromCLI.ts` | Main entry for both vitest files |
| `src/5_tests/MiroirTestTools.ts` | Unified runner dispatching by test type |
| `tests/miroir-core-tests.unit.test.ts` | Vitest unit entry |
| `scripts/test-miroir-core.ts` | `testMiroir` launcher (unit) |

### miroir-standalone-app

| File | Role |
|------|------|
| `tests/miroir-core-tests.integ.test.ts` | Vitest integration entry |
| `tests/helpers/IntegrationTestSession.ts` | Store bootstrap (all backends) |
| `tests/helpers/miroirCoreIntegTestLaunch.ts` | Pre-flight validation + usage output |
| `scripts/test-miroir-runner.ts` | `testMiroir` launcher — routes unit/integ |

---

## Adding or migrating tests

1. Create or edit a `MiroirTest` JSON instance under the entity data directory.
2. Export from `packages/miroir-test-app_deployment-miroir/index.ts`.
3. Add the key to `MIROIR_TEST_SUITE_REGISTRY_NAMES` in `miroirCoreTestSuiteRegistry.ts`.
4. Rebuild the deployment package.
5. Run `tests/4_services/miroirTest.schema.unit.test.ts` to validate JSON shape.
6. Run the new suite with `testMiroir`.

For migrations from legacy `UnitTest` / `TransformerTest`, see the Feature 196 plan.

Do **not** modify `UnitTestTools.ts` or `TestTools.ts` for new features — extend `MiroirTestTools.ts` only.

---

## Debugging

```bash
# MiroirTest unit — verbose
npm run testByFile -w miroir-core -- miroir-core-tests.unit.test

# DomainController integ — with debug logging
VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-sql.json \
VITE_MIROIR_LOG_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/specificLoggersConfig_DomainController_debug.json \
npm run testByFile -w miroir-standalone-app -- DomainController.integ.Data
```

Activity tracking results are printed via `displayMiroirTestResults` after each suite.

---

## What is intentionally not migrated

- Legacy `UnitTest` / `TransformerTest` deployment JSON (frozen)
- `miroirTest.tools.unit.test.ts` (tests legacy `UnitTestTools` helpers)
- Class E/F vitest-only tests without entity instances
- Known failing edge cases (e.g. some `ansiColumnsToJzodSchema` integration nested tests)

---

## See also

- **[Testing Reference](../reference/testing.md)** — full env vars, all backends, programmatic API
- [Developer testing guide](../guides/developer/testing.md) — concepts and architecture
- Feature #196 plan: `code-helpers/features/196-FEATURE-migrate-tests-to-MiroirTest/plan.md`
- Feature #197 plan: `code-helpers/features/197-FEATURE-run-integration-tests-in-the-UI/plan.md`
