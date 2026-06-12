# Testing Guidelines for Contributors
> ⚠️⚠️⚠️ This document is a placeholder and needs to be completed.
## Overview

`miroir-core` uses **Vitest** with tests backed by **`MiroirTest`** deployment entities. This document covers how to run, add, and debug tests when contributing to the framework.

---

## Prerequisites

```bash
npm run build -w miroir-test-app_deployment-miroir
npm run devBuild -w miroir-core   # includes generate-ts-types
```

Integration tests need a reachable Postgres instance (default host `192.168.1.160` in `miroirTestIntegrationStore.ts`).

---

## Running tests

### MiroirTest CLI (preferred)

```bash
# Unit — single suite
npm run testMiroir -w miroir-core -- --suites mustache --mode unit

# Unit — multiple suites
npm run testMiroir -w miroir-core -- --suites alterObject,EntityPrimaryKey --mode unit

# Integration
npm run testMiroir -w miroir-core -- --suites miroirCoreTransformers --mode integration

# Migration / schema smoke
npm run testByFile -w miroir-core -- miroirTest.migration
npm run testByFile -w miroir-core -- miroirTest.schema
```

### Per-file vitest with `RUN_TEST`

Many loader files register only when `RUN_TEST` matches (or when unset):

```bash
RUN_TEST=transformers.unit.test npm run testByFile -w miroir-core -- transformers.unit.test
RUN_TEST=adminTransformers.unit.test npm run testByFile -w miroir-core -- adminTransformers.unit.test
```

File-pattern loaders (`jzodTypeCheck`, `resolveConditionalSchema`, etc.) use `honorRunTest: false` and skip based on the vitest file pattern instead.

### Manual regression script

`packages/miroir-core/tests/manual_tests.sh` — spot-check list used during Feature 196 migration.

### All tests (heavy)

```bash
npm run test -w miroir-core -- ''
```

---

## Key files

| File | Role |
|------|------|
| `src/4_services/MiroirTestTools.ts` | Unified runner |
| `tests/helpers/miroirTestSuiteRegistry.ts` | Registry key → deployment export |
| `tests/helpers/runMiroirCoreTestSuite.ts` | Per-file vitest entry |
| `tests/miroir-tests.unit.test.ts` | Dynamic-import unit entry |
| `tests/miroir-tests.integ.test.ts` | Dynamic-import integration entry |
| `scripts/miroir-test-migration-map.json` | Legacy → MiroirTest manifest |
| `scripts/generate-miroir-test-instances.ts` | Bulk migration generator |

---

## Adding or migrating tests

1. **Hand-edit** a new JSON under `a311f363-…/` (UUID v4) or **generate** from legacy:
   ```bash
   npm run generate-miroir-tests -w miroir-core
   ```
2. Rebuild deployment package.
3. Wire vitest loader (pattern in `tests/1_core/alterObject.unit.test.ts`).
4. Add registry key if missing (generator rewrites registry).
5. Run targeted vitest + `miroirTest.schema` if schema changed.

Do **not** modify `UnitTestTools.ts` or `TestTools.ts` for new features — extend `MiroirTestTools.ts` only.

---

## Debugging

```bash
# Verbose single file
npm run testByFile -w miroir-core -- alterObject.unit.test

# With domain logging (when tests touch DomainController)
VITE_MIROIR_LOG_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/specificLoggersConfig_DomainController_debug \
  npm run testByFile -w miroir-core -- transformers.unit.test
```

Activity tracking results are printed via `displayMiroirTestResults` after each suite.

---

## What is intentionally not migrated

- Legacy `UnitTest` / `TransformerTest` deployment JSON (frozen)
- `unitTest.tools.unit.test.ts` (tests legacy `UnitTestTools` helpers)
- Class E/F vitest-only tests without entity instances
- Known failing cases (e.g. some `ansiColumnsToJzodSchema` integration nested tests)

Cleanup of legacy entities/UI is tracked separately from Feature 196.

---

## See also

- [Developer testing guide](../guides/developer/testing.md)
- [Feature 196 plan](../../code-helpers/features/196-FEATURE-migrate-tests-to-MiroirTest/plan.md)
