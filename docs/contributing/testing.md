# Testing Guidelines for Contributors

> Full reference (discovery / selection / execution, env vars, store backends, programmatic API): [docs/reference/testing.md](../reference/testing.md#discovery-selection-and-execution)

---

## Prerequisites

```bash
npm run build -w miroir-app-miroir
npm run devBuild -w miroir-core   # includes generated types
```

Integration tests need a reachable store when using SQL/ MongoDB configs:

- **MiroirTest integ** (`testMiroir`): configure via `MIROIR_TEST_*` (default Postgres host `localhost`).
- **App-stack integ** (`testByFile`): pick the store with `--profile` (`emulatedServer-filesystem`, `emulatedServer-sql`, …), which selects a test environment (`environments/test-*.json`, see [Environments](../reference/environments.md)). Its stores are copies in `.miroir/<environment>/`, so no test writes tracked files. For sql, set `MIROIR_POSTGRES_PASSWORD`.

---

## Test file layout

Tests live under each package's `tests/<layer>/` directory, named after the capability they guard (feature-based non-regression tests).

Tests produced while working on a specific issue (typically agent-TDD phase checkpoints, often carrying the issue number in their name, e.g. `entityPresentModel.217.phase1.unit.test.ts`) must be isolated in an **issue directory**:

```
tests/<layer>/issues/<issue>-<slug>/    # e.g. tests/1_core/issues/217-entity-present-model/
```

Rules:

- No test file with an issue number in its name lives outside an `issues/` directory.
- An issue touching several layers gets one `issues/<issue>-<slug>/` directory per layer.
- Issue-scoped helpers/fixtures live inside the issue directory alongside the tests.
- When the issue closes, migrate still-valuable assertions into feature-named suites in the canonical layer directory and delete the issue directory (see [#238](https://github.com/miroir-framework/miroir/issues/238)).

---

## Running tests

**Prefer argv** (`--suites`, `--tags`, `--mode`, `--filter`, `--profile`, `--storage`). Env vars remain for CI / legacy; see [Parameter surface](../reference/testing.md#parameter-surface-argv-preferred) in the reference. Select MiroirTest suites by instance `name`, or by [tag](../reference/testing.md#tags) with `--tags`:

| Name | Example | Used in |
|------|---------|---------|
| **Suite key** (`name`) | `runner.returnDocument` | `--suites`, `MIROIR_TEST_SUITES`, UI |
| **Suite `miroirTestLabel`** | `runner.returnDocument` | display; **nested** `--filter` keys only |
| **Leaf `miroirTestLabel`** | `Return Book Test Composite Action` | `--filter` **values**, UI leaf checkboxes |

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

Default `npm run nonreg` includes deployment `modelValidation` for **miroir**, **admin**, and **library** (early steps, right after miroir-core unit). `--tier full` also runs **postgres** `modelValidation` (see [Deployment modelValidation](../reference/testing.md#deployment-modelvalidation)).

### Unit (no database)

```bash
# Preferred — argv
npm run testMiroir -w miroir-core -- --suites fn.mustache.extractDoubleBracePatterns --mode unit

# Legacy — env (still supported)
MIROIR_TEST_SUITES=fn.mustache.extractDoubleBracePatterns MIROIR_TEST_MODE=unit npm run testMiroir -w miroir-core

# Multiple suites
npm run testMiroir -w miroir-core -- --suites fn.tools.alterObjectAtPath,fn.entityPrimaryKey --mode unit

# Every unit suite carrying a tag
npm run testMiroir -w miroir-core -- --tags ml-union --mode unit

# All catalog suites
npm run testMiroir -w miroir-core -- --mode unit

# LocalCache memory measure — also in nonreg:unit
npm run testByFile -w miroir-core -- tests/2_domain/localCacheMemoryMeasure.unit.test.ts
npm run testByFile -w miroir-core -- tests/2_domain/localCacheMemoryAttributed.unit.test.ts
npm run testByFile -w miroir-standalone-app -- tests/4_view/localCacheMonitorGate.unit.test.ts
npm run testByFile -w miroir-standalone-app -- tests/4_view/LocalCacheMonitorSummary.unit.test.tsx
npm run testByFile -w miroir-standalone-app -- tests/4_view/localCacheMonitorIndicators.unit.test.ts
npm run testByFile -w miroir-standalone-app -- tests/4_view/localCacheMonitorSession.unit.test.ts
npm run testByFile -w miroir-standalone-app -- tests/4_view/localCacheMonitorFootprint.acceptance.unit.test.tsx
npm run testByFile -w miroir-standalone-app -- tests/4_view/gridPagination.unit.test.tsx
npm run testByFile -w miroir-standalone-app -- tests/4_view/gridPagination.integ.test.tsx
npm run vitest -w miroir-localcache-redux -- tests/LocalCache.memoryMeasure.static.unit.test.ts
npm run vitest -w miroir-localcache-zustand -- tests/LocalCache.memoryMeasure.static.unit.test.ts

# Attribute projection — unit (no store)
npm run testByFile -w miroir-core -- tests/1_core/instanceProjection.unit.test.ts
npm run testByFile -w miroir-core -- tests/1_core/instanceProjectionSchema.unit.test.ts
npm run testByFile -w miroir-core -- tests/4_services/PersistenceStoreController.projection.unit.test.ts
```

After changing Query / Endpoint ML schemas for `attributes` (or any fundamental schema), rebuild before these tests:

```bash
npm run build -w miroir-app-miroir
npm run devBuild -w miroir-core
```

### MiroirTest integration (`testMiroir`)

Runs in `miroir-standalone-app`, not `miroir-core`. Prefer **`--profile`** / **`--suites`** / **`--mode`**:

| Kind | Command |
|------|---------|
| **Transformer** | `npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-sql --suites tr.core --mode integ` |
| **Runner** | `npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-sql --suites runner.returnDocument --mode integ` |
| **Freeze runner** | `npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-filesystem --suites runner.freezeApplicationVersion --mode integ` |
| **Report** | `npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-filesystem --suites report.bookDetails --mode integ` |
| **By tag** | `npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-filesystem --tags domain-controller --mode integ` |

Legacy env form:

```bash
MIROIR_TEST_SUITES=tr.core MIROIR_TEST_MODE=integ \
  MIROIR_TEST_POSTGRES_HOST=localhost \
  npm run testMiroir -w miroir-standalone-app
```

A Report test mounts a whole Report at its route, drives it through its UI and checks what its actions stored: [reference — Report tests](../reference/testing.md#report-tests).

**UI:** same suites under **Miroir Tests** → **Run Integration Tests** (webApp: `emulatedServer-indexedDb`; runner also supports `realServer-*`). See [reference — Running tests in the UI](../reference/testing.md#running-tests-in-the-ui).

Full options: [reference/testing.md](../reference/testing.md#running-miroirtest-integration-tests-testmiroir).

### App-stack integration (`testByFile`)

DomainController, persistence-store, and extractor tests use JSON config files:

```bash
# DomainController data CRUD — preferred MiroirTest action suite
npm run testMiroir -w miroir-standalone-app -- \
  --profile emulatedServer-sql --suites action.domainController.dataCrud --mode integ

# Deprecated imperative Data CRUD (parity harness — keep green; do not delete yet)
MIROIR_ENV=test-sql \
VITE_MIROIR_LOG_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/specificLoggersConfig_DomainController_debug.json \
npm run testByFile -w miroir-standalone-app -- DomainController.integ.Data

# All DomainController suites
MIROIR_ENV=test-sql \
VITE_MIROIR_LOG_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/specificLoggersConfig_warn.json \
npm run testByFile -w miroir-standalone-app -- DomainController.integ

# Persistence store controller
MIROIR_ENV=test-sql \
VITE_MIROIR_LOG_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/specificLoggersConfig_warn.json \
npm run testByFile -w miroir-standalone-app -- PersistenceStoreController.integ

# Same suite — filesystem profile (includes attribute-projection assertion)
npm run testByFile -w miroir-standalone-app -- \
  --profile emulatedServer-filesystem PersistenceStoreController.integ

# Extractor runner (IndexedDB example)
MIROIR_ENV=test-indexedDb \
VITE_MIROIR_LOG_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/specificLoggersConfig_warn.json \
npm run testByFile -w miroir-standalone-app -- ExtractorPersistenceStoreRunner.integ
```

Full catalogue: [reference/testing.md](../reference/testing.md#running-app-stack-integration-tests-testbyfile).

### MlElementEditor component tests

The ML schema editor cases are MiroirTests (#286) written as declarative JSON (#292). There is one instance per editor (`ui.mlElementEditor.enum`, `ui.mlElementEditor.array`, `ui.mlElementEditor.literal`, `ui.mlElementEditor.object`, `ui.mlElementEditor.simpleType`, `ui.mlElementEditor.union`, `ui.mlElementEditor.any`; 68 cases in all), plus the test pattern `ui.mlElementEditor.allTypesPattern` (one object with every editor type, 4 cases) and the render-performance suite `ui.mlElementEditor.renderPerformance` (15 cases with a `measureRendering` step, `runOnDemand`) (#303). `ui.transformerEditor` (4 cases, #406) renders the TransformerEditor the same way. Each instance has one `reactComponentTestSuite` node, which names the rendered component and its default props, and one `reactComponentTest` leaf per case, with its own props and a list of steps (`click`, `change`, `selectOption`, `expectRenderedValues`, `expectElement`, …). The vitest entry `tests/4_view/miroir-component-tests.unit.test.tsx` runs them:

```bash
# The 76 default cases (72 editor cases, 4 TransformerEditor cases), plus 2 entry checks; the 15 on-demand cases are skipped.
# No --profile and no Postgres (in-memory LocalCache).
npm run testByFile -w miroir-standalone-app -- miroir-component-tests

# One editor, or the test pattern (-t is a regex; spaces are fine)
npm run testByFile -w miroir-standalone-app -- miroir-component-tests -t "MlObjectEditor"
npm run testByFile -w miroir-standalone-app -- miroir-component-tests -t "MlTestPattern"

# Render-performance suite (on demand), measurement tables in the log
MIROIR_COMPONENT_PERF=1 VITE_MIROIR_LOG_CONFIG_FILENAME=catch-all-detailed \
  npm run testByFile -w miroir-standalone-app -- miroir-component-tests -t "MlEditorRenderPerformance"

# The TransformerEditor cases (#406), by suite name
npm run testMiroir -w miroir-standalone-app -- --suites ui.transformerEditor

# After a change to an instance JSON in miroir-app-miroir/assets/miroir_data/a311f363-…/
npm run build -w miroir-app-miroir
npm run testByFile -w miroir-app-miroir -- modelValidation.unit.test.ts
npm run testByFile -w miroir-standalone-app -- componentMiroirTests.consistency
```

To add a case, add a leaf to the editor's instance JSON, labelled `<editor>: <case>`, and add its line to `tests/4_view/issues/292-declarative-react-component-tests/baseline-component-cases.txt` (and the new count, `EXPECTED_LEAF_COUNT`, to the vitest entry). A failing step reports `step <n> (<kind> "<label>"): <message>`. `testByFile` passes `--bail=1` by default: after a failing case the later ones are reported as not run; add `--no-bail` to see every failure.

Render measurements are not a pass / fail: the `measureRendering` step fails only if rendering fails or no measurement is collected, and happy-dom timings are not browser timings. `expectRenderedValues.ignorePaths`, the measurement fields and the app's iterations field are described in [reference/testing.md § Test pattern](../reference/testing.md#test-pattern) and [§ Render measurements](../reference/testing.md#render-measurements-measurerendering).

The same cases run in the app: open one of the instances in the Miroir Tests report and click the unit Run button. Each case renders in a sandbox panel with its own `LocalCache`. The instance format, the step vocabulary, the targets, and the waiting rule are in [reference/testing.md § MlElementEditor component tests](../reference/testing.md#mlelementeditor-component-tests).

### MiroirTestDisplay UI integration launch (B6-d1)

RTL proof for **Run Integration Tests** from the Miroir Tests report (`MiroirTestDisplay` → inspector). Single leaf: Return Book on `runner.returnDocument`.

```bash
MIROIR_ENV=test-sql \
VITE_MIROIR_LOG_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/specificLoggersConfig_DomainController_debug.json \
npm run testByFile -w miroir-standalone-app -- MiroirTestDisplayIntegrationLaunch.integ
```

Requires Postgres (Node emulated SQL via test mocks). Full detail: [reference/testing.md § MiroirTestDisplayIntegrationLaunch](../reference/testing.md#miroirtestdisplayintegrationlaunchintegtesttsx--ui-integration-launch-b6-d1).

### Catalog vitest host (`testMiroir` already uses these)

```bash
# Unit catalog host (prefer `testMiroir --mode unit`)
npm run testByFile -w miroir-core -- miroir-core-tests.unit.test

# Integration entry directly
MIROIR_TEST_SUITES=tr.core MIROIR_TEST_MODE=integ \
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

# Catalog characterization
VITE_TEST_MODE=true npx vitest run tests/5-tests/loadApplicationMiroirTestsFromFolders.unit.test.ts \
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
| `src/5_tests/loadApplicationMiroirTestsFromFolders.ts` | Folder catalog used by `testMiroir` (suite key = instance `name`) |
| `src/5_tests/miroirCoreTestSuiteRegistry.ts` | Deprecated name-list snapshot |
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

1. Create or edit a `MiroirTest` JSON instance in the application's MiroirTest folder. Name it `<kind>.<subject>[.<variant>]` (`fn`, `query`, `tr`, `action`, `runner`, `ui`, `report`), set the root `miroirTestLabel` to the same value, write a one-sentence `description`, and put its mode tag (`unit`, `integ` or `ui`) first in `tags`. Rules: [Names and descriptions](../reference/testing.md#names-and-descriptions).
2. Optional: export `miroirTest_<name with . replaced by _>` from the deployment package `index.ts` if other TypeScript wants a named import.
3. Rebuild the deployment package if you added a named export.
4. Run `tests/4_services/miroirTest.schema.unit.test.ts` to validate JSON shape.
5. Run the new suite with `testMiroir` (`--suites <name>`). TypeScript files that have no MiroirTest entity are PLATFORM — launch those with `testByFile`.

For migrations from legacy `UnitTest` / `TransformerTest`, see `code-helpers/features/196-FEATURE-migrate-tests-to-MiroirTest/plan.md`.

Do **not** modify `UnitTestTools.ts` or `TestTools.ts` for new features — extend `MiroirTestTools.ts` only.

---

## Debugging

```bash
# MiroirTest unit — verbose
npm run testByFile -w miroir-core -- miroir-core-tests.unit.test

# DomainController integ — with debug logging
MIROIR_ENV=test-sql \
VITE_MIROIR_LOG_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/specificLoggersConfig_DomainController_debug.json \
npm run testByFile -w miroir-standalone-app -- DomainController.integ.Data
```

Activity tracking results are printed via `displayMiroirTestResults` after each suite.

---

## PLATFORM tests (no MiroirTest equivalent)

TypeScript under `tests/` with no entity instance. Launch with `testByFile` (optional `RUN_TEST`):

- Apparatus / helper units (`parseMiroirTestCliConfig`, `IntegrationTestSession.unit`, `miroirTest.schema`)
- LocalCache memory measure
- App-stack integ (`PersistenceStoreController.integ`, extractors, view RTL)
- Frozen legacy `UnitTest` / `TransformerTest` JSON and `miroirTest.tools.unit.test.ts` (helpers for those)

---

## See also

- **[Testing Reference](../reference/testing.md)** — full env vars, all backends, programmatic API
- [Developer testing guide](../guides/developer/testing.md) — concepts and architecture
- MiroirTest migration plan: `code-helpers/features/196-FEATURE-migrate-tests-to-MiroirTest/plan.md`
- UI integration launch plan: `code-helpers/features/197-FEATURE-run-integration-tests-in-the-UI/plan.md`
