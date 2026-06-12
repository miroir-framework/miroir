# Testing Guide
> ⚠️⚠️⚠️ This document is a placeholder and needs to be completed.
## Overview

Miroir-core tests are stored as **deployment JSON entities** and executed through a unified **`MiroirTest`** model (Feature [#196](https://github.com/miroir-framework/miroir/issues/196)). The same instances run from:

- **Vitest** (CLI / CI)
- **Miroir standalone UI** (menu **Miroir Tests** — unit mode only, no side effects)

Legacy `UnitTest` and `TransformerTest` entities remain in the deployment for backward compatibility; new work uses `MiroirTest` only.

---

## Test types

| Mode | Where | Postgres | Typical suites |
|------|--------|----------|----------------|
| **Unit** | In-memory | No | Transformers (build), function calls, query runners |
| **Integration** | Runtime + SQL store | Yes (`192.168.1.160` default in helpers) | `miroirCoreTransformers` and nested transformer runtime cases |

The UI always runs **unit** mode.

---

## MiroirTest structure

Instances live under:

`packages/miroir-test-app_deployment-miroir/assets/miroir_data/a311f363-e238-4203-bdfc-29e8c160c26b/`

Each file is a `MiroirTestDefinition` with a nested `miroirTestSuite` tree. Leaf kinds:

- `transformerTest` — transformer build/runtime assertions
- `functionCallTest` — direct function invocation (e.g. mustache helpers)
- `queryTest` — SQL/query template fixtures
- `miroirTestSuite` — nested grouping (e.g. `adminTransformers`, `miroirCoreTransformers`)

Field naming uses `miroirTestType`, `miroirTestLabel`, `miroirTests` (not legacy `unitTest*` / `transformerTest*`).

---

## Running tests (CLI)

### Preferred: `testMiroir` (dynamic import by registry key)

```bash
# One or more suites (comma-separated registry keys)
npm run testMiroir -w miroir-core -- --suites mustache,alterObject --mode unit

# Integration (requires Postgres per miroirTestIntegrationStore)
npm run testMiroir -w miroir-core -- --suites miroirCoreTransformers --mode integration

# Subset of cases (JSON filter)
npm run testMiroir -w miroir-core -- --suites resolveConditionalSchema --mode unit --filter '{"testList":{"resolveConditionalSchema":["fails when wrong parentUuid is given"]}}'
```

**Environment variables** (CI):

| Variable | Purpose |
|----------|---------|
| `MIROIR_TEST_SUITES` | Comma-separated registry keys |
| `MIROIR_TEST_MODE` | `unit` or `integration` |
| `MIROIR_TEST_FILTER` | JSON filter object |

List available keys: see `packages/miroir-core/tests/helpers/miroirTestSuiteRegistry.ts` (37 suites).

### Per-file vitest (`testByFile`)

Legacy selective runs still work via `RUN_TEST`:

```bash
RUN_TEST=transformers.unit.test npm run testByFile -w miroir-core -- transformers.unit.test
RUN_TEST=jzodTypeCheck.test npm run testByFile -w miroir-core -- jzodTypeCheck.test
```

Integration shim (delegates to `testMiroir`):

```bash
RUN_TEST=transformers.integ.test npm run testByFile -w miroir-core -- transformers.integ
# equivalent:
npm run testMiroir -w miroir-core -- --suites miroirCoreTransformers --mode integration
```

### After changing deployment JSON

```bash
npm run build -w miroir-test-app_deployment-miroir
npm run devBuild -w miroir-core   # if entity/schema definitions changed
```

---

## Running tests (UI)

1. Open the standalone app (`npm run dev -w miroir-standalone-app`).
2. Navigate to **Miroir Tests** in the menu.
3. Select a suite in the list report; open details to inspect cases.
4. Use **Run suite** — executes in unit mode via `MiroirTestTools`.

Legacy **Unit Test** / **Transformer Test** reports still exist; prefer **Miroir Tests** for new work.

---

## Writing new tests

1. Add or edit a `MiroirTest` JSON instance under the entity data directory (UUID v4 filename = inner `uuid`).
2. Export from `packages/miroir-test-app_deployment-miroir/index.ts`.
3. Add a registry entry (or run `npm run generate-miroir-tests -w miroir-core` when migrating from legacy).
4. Add a vitest loader file that calls `runMiroirCoreTestSuite(miroirTest_*, "mySuite.unit.test")`.
5. Validate schema: `npm run testByFile -w miroir-core -- miroirTest.schema`.

For migrations from legacy `UnitTest` / `TransformerTest`, use `migrateLegacyTestInstance` in `scripts/miroirTestMigrateDefinition.ts` and the manifest `miroir-test-migration-map.json`.

**UUID rule:** all instance UUIDs must be RFC 4122 v4. The generator uses `deterministicMiroirTestUuidV4(sourceUuid)`; run `npm run renormalize-miroir-test-uuids -w miroir-core` if needed.

---

## Architecture (execution path)

```
Vitest loader / UI button
  → runMiroirCoreTestSuite | runDeployedMiroirTestSuite
    → MiroirTestTools.runMiroirTests (executionMode: unit | integration)
      → leaf adapters → TestTools / UnitTestTools / QueryRunnerTestTools (frozen, not modified)
```

---

## Further reading

- Implementation plan: `code-helpers/features/196-FEATURE-migrate-tests-to-MiroirTest/plan.md`
- Contributor commands: [Testing guidelines](../../contributing/testing.md)
