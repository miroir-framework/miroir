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

**Prefer argv** (`--suites`, `--mode`, `--filter`, `--profile`, `--storage`). Env vars remain for CI / legacy; see [Parameter surface](../reference/testing.md#parameter-surface-argv-preferred) in the reference.

### Repo-wide non-regression (`npm run nonreg`)

There is **no** `lerna run test` aggregator for Miroir. Use the Python runner:

```bash
# Default = unit (A) + MiroirTest integ (B) + curated app-stack (C); continue after failures
npm run nonreg
# same as:
npm run nonreg -- --tier default --run-all

# Unit only (no Postgres)
npm run nonreg:unit

# Stop at first failure
npm run nonreg:fail-fast

# Run + compare against previous (`latest` resolved before this run updates it)
npm run nonreg -- --compare latest

# Compare two existing snapshots only (no re-run)
npm run nonreg -- --compare test-results/nonreg/<newer> test-results/nonreg/<older>
```

Snapshots land in `test-results/nonreg/<UTC-stamp>/` (`summary.json`, `summary.md`, per-step `logs/`). End-of-run prints passed / failed / skipped / not_run. Edit the step list in [`scripts/nonreg-manifest.json`](../../scripts/nonreg-manifest.json). Full detail: [reference/testing.md § Repo-wide non-regression](../reference/testing.md#repo-wide-non-regression-npm-run-nonreg).

### Unit (no database)

```bash
# Preferred — argv
npm run testMiroir -w miroir-core -- --suites mustache --mode unit

# Legacy — env (still supported)
MIROIR_TEST_SUITES=mustache MIROIR_TEST_MODE=unit npm run testMiroir -w miroir-core

# Multiple suites
npm run testMiroir -w miroir-core -- --suites alterObject,EntityPrimaryKey --mode unit

# All registered suites
npm run testMiroir -w miroir-core -- --mode unit

# LocalCache memory measure (#211) — also in nonreg:unit
npm run testByFile -w miroir-core -- tests/2_domain/localCacheMemoryMeasure.unit.test.ts
npm run testByFile -w miroir-core -- tests/2_domain/localCacheMemoryAttributed.unit.test.ts
npm run vitest -w miroir-localcache-redux -- tests/LocalCache.memoryMeasure.static.unit.test.ts
npm run vitest -w miroir-localcache-zustand -- tests/LocalCache.memoryMeasure.static.unit.test.ts
```

### MiroirTest integration (`testMiroir`)

Runs in `miroir-standalone-app`, not `miroir-core`. Prefer **`--profile`** / **`--suites`** / **`--mode`**:

| Kind | Command |
|------|---------|
| **Transformer** | `npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-sql --suites miroirCoreTransformers --mode integ` |
| **Runner** | `npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-sql --suites runner_library --mode integ` |

Legacy env form:

```bash
MIROIR_TEST_SUITES=miroirCoreTransformers MIROIR_TEST_MODE=integ \
  MIROIR_TEST_POSTGRES_HOST=localhost \
  npm run testMiroir -w miroir-standalone-app
```

**UI:** same suites under **Miroir Tests** → **Run Integration Tests** (webApp: `emulatedServer-indexedDb`; runner also supports `realServer-*`). See [reference — Running tests in the UI](../reference/testing.md#running-tests-in-the-ui).

Full options: [reference/testing.md](../reference/testing.md#running-miroirtest-integration-tests-testmiroir).

### App-stack integration (`testByFile`)

DomainController, persistence-store, and extractor tests use JSON config files:

```bash
# DomainController data CRUD — preferred MiroirTest action suite
npm run testMiroir -w miroir-standalone-app -- \
  --profile emulatedServer-sql --suites domain_controller_data_crud --mode integ

# Deprecated imperative Data CRUD (parity harness — keep green; do not delete yet)
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

### JzodElementEditor component tests

React Testing Library suite for the Jzod schema editor — prerequisite baseline before Feature #197 Phase B transformer UI work:

```bash
VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-sql.json \
VITE_MIROIR_LOG_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/specificLoggersConfig_DomainController_debug.json \
npm run testByFile -w miroir-standalone-app -- JzodElementEditor.test

# Profile shorthand
npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-sql JzodElementEditor.test

# One editor sub-suite (67 tests total)
npm run testByFile -w miroir-standalone-app -- 4_view/JzodElementEditor.test.tsx -t "JzodObjectEditor"
```

No Postgres required (in-memory `LocalCache`). See [reference/testing.md § JzodElementEditor](../reference/testing.md#jzodelementeditortesttsx--component-integration-suite).

### MiroirTestDisplay UI integration launch (B6-d1)

RTL proof for Feature #197 — **Run Integration Tests** from the Miroir Tests report (`MiroirTestDisplay` → inspector). Single leaf: Return Book on `runner.library`.

```bash
VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-sql.json \
VITE_MIROIR_LOG_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/specificLoggersConfig_DomainController_debug.json \
npm run testByFile -w miroir-standalone-app -- MiroirTestDisplayIntegrationLaunch.integ
```

Requires Postgres (Node emulated SQL via test mocks). Full detail: [reference/testing.md § MiroirTestDisplayIntegrationLaunch](../reference/testing.md#miroirtestdisplayintegrationlaunchintegtesttsx--ui-integration-launch-b6-d1).

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
