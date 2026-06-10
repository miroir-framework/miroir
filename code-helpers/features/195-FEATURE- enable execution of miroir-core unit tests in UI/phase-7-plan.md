# Feature 195 — Phase 7: MiroirTest Catalog, discovery & execution profiles

GitHub issue: [miroir-framework/miroir#195](https://github.com/miroir-framework/miroir/issues/195)

**Parent plan:** [`plan.md`](./plan.md) (Phases 0–6d complete)

**Status:** planning — no implementation started

---

## 1. Why Phase 7 exists

Phases 1–6d established **executable test JSON** and **shared run UI** for two parallel store trees:

| Store entity | Entity UUID | Instance folder | ~Count | Vitest kinds inside |
|--------------|-------------|-----------------|--------|---------------------|
| **UnitTest** | `a1bc5288-c982-4ff3-8316-4a2400fe9323` | `miroir_data/a1bc5288-…/` | 28 | `functionCallTest`, `queryRunnerTest`, `unitTestAsTransformerTest` |
| **TransformerTest** | `681be9ca-c593-45f5-b45a-5f1d4969e91e` | `miroir_data/681be9ca-…/` | 8 | `transformerTest` / `transformerTestSuite` (legacy shape) |

Both trees share the **same execution engine surface** (`MiroirActivityTracker`, `TestSuiteResult`, `TestAssertionResult`) and, since Phase 6c, the **same results grid** (`TestExecutionPanel`, `TestResultsGrid`). But **discovery, CLI selection, and integration vs unit** are still fragmented:

- Two list reports (`reportUnitTestList`, `reportTransformerTestList`) and two detail reports.
- Two vitest loader patterns (`runDeployedUnitTestSuite` vs `runUnitTransformerTests` + `RUN_TEST`).
- `integrationTestExpectedValue` exists on `TransformerTest` and `runTransformerIntegrationTest` exists in `TestTools.ts`, but the UI has **no execution-profile toggle**.
- `testTag` and `functionRef.module` are in the schema but **not indexed** for browse/filter.
- Phase 0 [`catalog.json`](./catalog.json) scans **vitest files**, not **store instances** — it is stale relative to deployment JSON.

Phase 7 introduces one cross-cutting concept — the **MiroirTest Catalog** — and builds discovery, CLI ergonomics, integration profiles, and editor links on top of it **without** forcing an immediate merge of the two entity types.

---

## 2. Cross-cutting review (codebase & docs)

### 2.1 What is already unified

| Layer | Unified? | Location |
|-------|----------|----------|
| Leaf execution dispatch | Yes | `UnitTestTools.runUnitTests` → `runFunctionCallTestInMemory` / `runQueryRunnerTestInMemory` / transformer bridge |
| Transformer-only legacy path | Parallel | `TestTools.runUnitTransformerTests` (still used by Class A vitest loaders) |
| Activity / results model | Yes | `MiroirActivityTracker`, `TestSuiteResult` |
| Run + results UI (detail report) | Yes (Phase 6c) | `TestExecutionPanel`, `TestResultsGrid`, `testSelectionUtils` |
| Kind badge in editor | Partial | `unitTestKindUi.tsx` — UnitTest entity only |
| Expected-value normalization | Mostly | `jsonify`, `removeUndefinedProperties`, `unNullify`, `ignoreAttributes` — shared patterns in `TestTools` / `UnitTestTools` |

### 2.2 What remains split

| Concern | UnitTest path | TransformerTest path |
|---------|---------------|----------------------|
| Entity & JSON shape | `UnitTestDefinition.definition: UnitTestSuite` | `TransformerTestDefinition.definition: TransformerTestSuite` |
| Deployment exports | `unitTest_suite_*` in `miroir-test-app_deployment-miroir/index.ts` | `transformerTest_*` / `transformerTestSuite_*` |
| UI list report | `reportUnitTestList` (`cf1e1e7c-…`) | `reportTransformerTestList` (`963f9cfb-…`) |
| UI detail + run section | `unitTestReportSection` → `UnitTestDisplay` | `transformerTestReportSection` → `TransformerTestDisplay` |
| Vitest thin wrapper | `runDeployedUnitTestSuite(export, suiteLabel)` | Manual `RUN_TEST` gate + `runUnitTransformerTests` |
| Integration execution | Not wired in UI | `runTransformerIntegrationTest` + `integrationTestExpectedValue` (CLI only, `transformers.integ.test.ts`) |
| Catalog source | `generate-unit-test-catalog.mjs` → vitest files | Not indexed |

### 2.3 Schema facts relevant to catalog

From `miroirFundamentalType.ts`:

- **Shared leaf metadata:** `testTag?: string | string[]`, `skip`, label fields (`unitTestLabel` / `transformerTestLabel`).
- **Transformer-only:** `transformerName`, `expectedValue`, `integrationTestExpectedValue`, `unitTestExpectedValue`, `subExpectedValue`.
- **Function-call-only:** `functionRef: { module, export }`, `environmentRef`, `fixtureRef`, `assertions[]`.
- **Query-runner-only:** `fixtureRef`, `runner`, `queryTemplate` / `query`.
- **Bridge:** `unitTestAsTransformerTest.payload` is byte-for-byte `TransformerTest`.

`UnitTestDefinition` and `TransformerTestDefinition` instance envelopes are **structurally identical** (uuid, parentUuid, name, description, definition). Only the `definition` union root discriminator differs (`unitTestSuite` vs `transformerTestSuite`).

### 2.4 Vitest CLI today

| Mechanism | Used by | Behavior |
|-----------|---------|----------|
| `RUN_TEST=<suiteLabel>` | Most deployment loaders | If set and ≠ loader’s `testSuiteName`, entire file is `test.skip` |
| `vitest run -t <pattern>` | `npm test` script | Vitest name filter (underused for entity suites) |
| `filter.testList` | `runUnitTestSuite`, `runTransformerTestSuite` | Nested label allow-list — **not exposed via env** |
| `VITEST_FILTER` | `resolveConditionalSchema.test.ts` only | Ad hoc regex on suite name — **not standardized** |
| `EXPORT_FUNCTION_CALL_SUITES=1` | export script | Generation gate, not runtime selection |

**Pain points:** `RUN_TEST` selects **files**, not **leaves**; no cross-file filter by `testTag` or `functionRef.module`; transformer and unit loaders use different boilerplate; integration tests require a separate vitest file.

### 2.5 Documentation drift

| Artifact | Drift |
|----------|-------|
| [`CATALOG.md`](./CATALOG.md) / [`catalog.json`](./catalog.json) | Pre–Phase 6d; counts vitest files, not deployment instances |
| [`plan.md`](./plan.md) Phase 7 | Bullet list only; no gathering algorithm |
| Appendix file → class table | Many rows still say “Phase 6d pending” though 6d is done |

Phase 7 regenerates catalog from **store instances first**, vitest files second.

---

## 3. The MiroirTest Catalog (new concept)

### 3.1 Definition

The **MiroirTest Catalog** is a **derived, read-only index** of every executable test definition in the deployment package, regardless of whether the backing entity is `UnitTest` or `TransformerTest`.

It does **not** replace those entities in Phase 7. It **normalizes** them into one queryable model for UI, CLI, CI, and editor cross-links.

```
miroir-test-app_deployment-miroir
├── assets/miroir_data/a1bc5288-…/*.json   ──┐
├── assets/miroir_data/681be9ca-…/*.json   ──┼──► buildMiroirTestCatalog()
├── index.ts (named exports)               ──┘           │
└── packages/miroir-core/tests/**/*.test.ts ──► vitestLoaderMap            ▼
                                                    miroir-test-catalog.json
                                                    MiroirTestCatalogEntry[]
```

### 3.2 Catalog entry shape (proposed)

```typescript
/** Stable ID: `${storageEntity}:${instanceUuid}` */
type MiroirTestCatalogId = string;

type MiroirTestStorageEntity = "unitTest" | "transformerTest";

type MiroirTestLeafKind =
  | "transformerTest"
  | "functionCallTest"
  | "queryRunnerTest";

type MiroirTestExecutionProfile = "unit" | "integration";

/** One deployment instance (= one suite root) */
type MiroirTestCatalogSuite = {
  catalogId: MiroirTestCatalogId;
  storageEntity: MiroirTestStorageEntity;
  parentEntityUuid: string; // a1bc5288-… or 681be9ca-…
  instanceUuid: string;
  name?: string;
  description?: string;
  suiteLabel: string; // root unitTestLabel | transformerTestLabel
  deploymentExport?: string; // e.g. unitTest_suite_tools
  vitestLoader?: {
    file: string; // repo-relative path under packages/miroir-core/tests
    runTestKey: string; // value for RUN_TEST / MIROIR_TEST_SUITE
  };
  detailReportUuid?: string; // bb9e8b62-… or 1c06268b-…
  leafCount: number;
  leaves: MiroirTestCatalogLeaf[];
};

type MiroirTestCatalogLeaf = {
  path: string[]; // nested suite labels + leaf label
  label: string;
  kind: MiroirTestLeafKind;
  testTags: string[];
  module?: string; // functionRef.module OR transformerName OR query runner id
  export?: string; // functionRef.export when kind=functionCallTest
  skip?: boolean;
  supportsIntegration: boolean; // true when integrationTestExpectedValue present
  supportsUnit: boolean;
};
```

### 3.3 Normalization rules

| Source node | Catalog `kind` | `module` field |
|-------------|----------------|----------------|
| `TransformerTest` | `transformerTest` | `transformerName` |
| `unitTestAsTransformerTest` | `transformerTest` | `payload.transformerName` |
| `functionCallTest` | `functionCallTest` | `functionRef.module` (+ `export`) |
| `queryRunnerTest` | `queryRunnerTest` | `runner` or `"queryRunner"` |
| Vitest-only file (Class E/F) | `vitestProxy` | derived from file path |

Nested suites: recurse `unitTests` / `transformerTests`; each leaf gets a `path` from root to leaf labels.

### 3.4 Execution profile (unit vs integration)

**Scope:** applies to **`transformerTest`** leaves (including `unitTestAsTransformerTest` and legacy `TransformerTest`).

| Profile | Runner | Expected value field |
|---------|--------|----------------------|
| `unit` (default) | `runTransformerTestInMemory` / `runFunctionCallTestInMemory` / etc. | `unitTestExpectedValue ?? expectedValue` |
| `integration` | `runTransformerIntegrationTest` (Postgres) | `integrationTestExpectedValue ?? expectedValue` |

`functionCallTest` and `queryRunnerTest` are **unit-only** in Phase 7 (integration variant would be a separate Class G suite if ever needed).

**UI:** add `executionProfile` state to `TestExecutionPanel` / run buttons; pass through to `RunUnitTestSuiteButton` and transformer run path. Gate integration behind admin flag + DB availability (same constraints as `transformers.integ.test.ts`).

**Catalog:** `supportsIntegration: true` when leaf has `integrationTestExpectedValue` defined.

---

## 4. Gathering the catalog — step-by-step

### Step 0 — Prerequisites

```bash
cd packages/miroir-test-app_deployment-miroir && npm run build
cd packages/miroir-core && npm run devBuild
```

### Step 1 — Enumerate store instances by parent entity

| Parent entity UUID | Entity name | Glob |
|--------------------|-------------|------|
| `a1bc5288-c982-4ff3-8316-4a2400fe9323` | UnitTest | `assets/miroir_data/a1bc5288-c982-4ff3-8316-4a2400fe9323/*.json` |
| `681be9ca-c593-45f5-b45a-5f1d4969e91e` | TransformerTest | `assets/miroir_data/681be9ca-c593-45f5-b45a-5f1d4969e91e/*.json` |

Validate each file: `parentUuid` matches parent entity; `definition` parses against `unitTestDefinition` or `transformerTestDefinition` Zod schema.

### Step 2 — Map deployment exports

Parse `packages/miroir-test-app_deployment-miroir/index.ts`:

- `export { default as unitTest_suite_* }` → `storageEntity: "unitTest"`, record `deploymentExport` name and JSON path.
- `export { default as transformerTest_* }` / `transformerTestSuite_*` → `storageEntity: "transformerTest"`.

Build `Map<instanceUuid, deploymentExport>`.

### Step 3 — Walk suite trees and emit leaves

For each instance JSON:

1. Read root `definition.unitTestLabel` or `definition.transformerTestLabel` → `suiteLabel`.
2. Depth-first traverse children.
3. For each leaf, apply normalization rules (§3.3).
4. Collect `testTag` (flatten `string | string[]` to `string[]`).
5. Set `supportsIntegration` from `integrationTestExpectedValue != null`.

**Output:** one `MiroirTestCatalogSuite` per instance.

### Step 4 — Link vitest loaders

Extend [`generate-unit-test-catalog.mjs`](./generate-unit-test-catalog.mjs) (or new `generate-miroir-test-catalog.mjs`):

1. Scan `packages/miroir-core/tests/**/*.test.ts` for:
   - `runDeployedUnitTestSuite(` → import name → `deploymentExport` → instance UUID.
   - `from "miroir-test-app_deployment-miroir"` imports for transformer suites.
   - Second argument / `testSuiteName` string literal → `runTestKey`.
2. Merge into catalog suite `vitestLoader: { file, runTestKey }`.
3. Flag **orphans:** store instance without vitest loader; loader without store instance.

### Step 5 — Attach UI report routes

| storageEntity | List report | Detail report |
|---------------|-------------|---------------|
| `unitTest` | `reportUnitTestList` (`cf1e1e7c-73eb-491d-a28d-e01e88c05c1d`) | `reportUnitTestDetails` (`bb9e8b62-eca5-4275-9dfa-42ac47123c11`) |
| `transformerTest` | `reportTransformerTestList` (`963f9cfb-1f26-4e9a-8031-7627151630ae`) | `reportTransformerTestDetails` (`1c06268b-2ddb-433c-ae4f-46546908125d`) |

Store `detailReportUuid` on each catalog suite for deep links.

### Step 6 — Merge vitest-only entries (optional)

From existing `catalog.json` Class E/F rows with `vitestOnly: true`, append synthetic suites:

```json
{
  "catalogId": "vitestProxy:1_core/blobUtils.unit.test.ts",
  "storageEntity": "vitestProxy",
  "kind": "vitestProxy",
  "vitestLoader": { "file": "1_core/blobUtils.unit.test.ts", "runTestKey": "blobUtils.unit.test" }
}
```

### Step 7 — Publish artifacts

| Artifact | Consumer |
|----------|----------|
| `miroir-test-catalog.json` | CI, CLI wrapper, UI browse report |
| `MIROIR_TEST_CATALOG.md` | Human browse (grouped by kind, tag, module) |
| npm export `miroirTestCatalog` from deployment package (optional) | Runtime import in UI |

### Step 8 — Validation gates

- [ ] `leafCount` sum matches manual count for pilot suites (`jzodTypeCheck`, `tools`, `queries_library`).
- [ ] Every `deploymentExport` in `index.ts` has a catalog row.
- [ ] Every `runDeployedUnitTestSuite` loader resolves to a catalog row.
- [ ] No duplicate `catalogId`.

---

## 5. Consistent execution model

### 5.1 Single dispatch API (target)

```typescript
runCatalogSuite({
  catalogId: "unitTest:a1bc5288-…:c6d3a001-…",
  executionProfile: "unit", // | "integration"
  filter?: MiroirTestFilter,
  modelEnvironment?: MiroirModelEnvironment,
  integrationContext?: { sqlDbDataStore }, // required for integration
});
```

Internally:

- Resolve instance JSON + `storageEntity`.
- If `storageEntity === "transformerTest"`, convert root to `UnitTestSuite` via existing bridge **or** call `runUnitTransformerTests` until data migration.
- Delegate to `runUnitTests._runUnitTestSuite` with `filter` and profile-aware transformer runner.

### 5.2 Bridge transformer entity → unit runner (incremental)

**Short term (Phase 7a):** catalog + CLI browse; keep dual runners.

**Medium term (Phase 7b):** `transformerTestDefinitionToUnitTestSuite()` adapter at run boundary so `TestExecutionPanel` uses one code path.

**Long term (optional):** migrate `681be9ca-…` instances to `UnitTest` entity (`unitTestAsTransformerTest` leaves); deprecate `TransformerTest` entity — **not required for catalog**.

---

## 6. CLI selection — improved conventions

Replace ad hoc env vars with a layered model. **Keep backward compatibility** for `RUN_TEST`.

### 6.1 Environment variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `RUN_TEST` / `MIROIR_TEST_SUITE` | Select vitest loader file (alias) | `tools.test` |
| `MIROIR_TEST_CATALOG_ID` | Run exactly one catalog suite | `unitTest:c6d3a001-…` |
| `MIROIR_TEST_KIND` | Filter leaves by kind | `functionCallTest` |
| `MIROIR_TEST_TAG` | Filter leaves where tag ∈ `testTags` | `jzod` |
| `MIROIR_TEST_MODULE` | Filter leaves by module prefix | `miroir-core/1_core/jzod` |
| `MIROIR_TEST_CASE` | Comma-separated leaf labels (within loaded suite) | `safeResolvePathOnObject: resolves a valid path` |
| `MIROIR_TEST_EXECUTION` | `unit` (default) \| `integration` | `integration` |

Precedence: `MIROIR_TEST_CATALOG_ID` → load that suite only; else `RUN_TEST` file gate; then leaf filters applied via `filter.testList` / new `filter.matchCatalog`.

### 6.2 Unified vitest entrypoint (target)

```
packages/miroir-core/tests/miroirTestCatalog.runner.test.ts
```

- Imports `miroirTestCatalog` from deployment package.
- When `MIROIR_TEST_CATALOG_ID` set: run single suite.
- When `MIROIR_TEST_TAG` / `MIROIR_TEST_MODULE` / `MIROIR_TEST_KIND`: run all matching suites (parallel CI shards).

### 6.3 Example commands

```bash
# --- Current (preserved) ---
RUN_TEST=tools.test npx vitest run packages/miroir-core/tests/tools.test.ts

# --- Catalog suite by ID ---
MIROIR_TEST_CATALOG_ID=unitTest:c6d3a001-0001-4000-8000-000000000001 \
  npx vitest run packages/miroir-core/tests/miroirTestCatalog.runner.test.ts

# --- All functionCall tests touching jzod module ---
MIROIR_TEST_KIND=functionCallTest \
MIROIR_TEST_MODULE=miroir-core/1_core/jzod \
  npx vitest run packages/miroir-core/tests/miroirTestCatalog.runner.test.ts

# --- Integration profile for transformer suites ---
MIROIR_TEST_EXECUTION=integration \
RUN_TEST=transformers.integ.test \
  npx vitest run packages/miroir-core/tests/4_services/transformers.integ.test.ts

# --- Single leaf inside a loaded suite ---
RUN_TEST=EntityPrimaryKey.unit.test \
MIROIR_TEST_CASE="getEntityPrimaryKeyAttribute returns uuid for Book" \
  npx vitest run packages/miroir-core/tests/1_core/EntityPrimaryKey.unit.test.ts

# --- Vitest native name filter (still supported) ---
npm test -- alterObject
```

### 6.4 CI shard strategy

| Job | Filter | Rationale |
|-----|--------|-----------|
| `test-transformer` | `MIROIR_TEST_KIND=transformerTest` | Class A |
| `test-function-call` | `MIROIR_TEST_KIND=functionCallTest` | Class B |
| `test-query-runner` | `MIROIR_TEST_KIND=queryRunnerTest` | Class C |
| `test-integration` | `MIROIR_TEST_EXECUTION=integration` | Class G, Postgres |
| `test-vitest-only` | `kind=vitestProxy` | Class E/F |

---

## 7. UI workstreams

### 7.1 Browse report — `reportMiroirTestCatalog` (new)

Single report replacing dual mental model:

- **Filters:** kind, tag, module (from catalog).
- **Columns:** suite label, storage entity, leaf count, vitest loader, last run status (future).
- **Row action:** open detail report (`reportUnitTestDetails` or `reportTransformerTestDetails` based on `storageEntity`).

Can be implemented as a **stored report** over generated `miroir-test-catalog.json` without metamodel changes.

### 7.2 Execution profile toggle

- Component: `TestExecutionProfileToggle` in `TestExecutionPanel`.
- Visible when suite has any leaf with `supportsIntegration`.
- Pass `executionProfile` to run handlers.
- `RunUnitTestSuiteButton` / transformer equivalent: switch expected field per §3.4.

### 7.3 Editor → test suite links

Use catalog inverted index:

| Editor context | Catalog query | Link target |
|----------------|---------------|-------------|
| Function export whitelist entry | `module` + `export` match | `functionCallTest` suites containing leaves |
| Transformer builder (`transformerName`) | `module === transformerName` | `transformerTest` suites |
| Query template editor | `queryRunner` + fixture name | `queryRunnerTest` suites |

UI pattern: **“N tests cover this”** panel with links to `reportMiroirTestCatalog?module=…` or direct detail report `instanceUuid`.

Implementation hooks:

- `FunctionCallTestRegistry.listWhitelistedFunctionRefs()` → link key.
- Transformer registry / entity instance name.
- `ReportPageContext` (Phase 6c) extended with `openCatalogFiltered({ module, export })`.

### 7.4 Kind-specific assertion diff (remaining Phase 6 gap)

- `functionCallTest`: show `functionRef`, serialized args, expected vs actual (partially done).
- `queryRunnerTest`: fixture + query template diff.
- `transformerTest`: transformer params / runtime context diff.
- Integration profile: second column for `integrationTestExpectedValue` diff.

---

## 8. Phase 7 implementation batches

### Phase 7a — Catalog builder & docs *(foundation)*

- [x] **MiroirTest entity** (`cb127a42-646d-46ea-9664-2430c19419cb`) + `MiroirTestDefinition` schema (`miroirTestCatalogSuite` / `miroirTestCatalogLeaf`; leaf kinds: `transformerTest`, `functionCallTest`, `queryRunnerTest` only)
- [x] Pilot instance `miroirTest_pilot_tools` indexing `unitTest_suite_tools`
- [ ] Implement `generate-miroir-test-catalog.mjs` (Steps 1–7).
- [ ] Emit `miroir-test-catalog.json` + `MIROIR_TEST_CATALOG.md`.
- [ ] Regenerate legacy `catalog.json` from catalog (vitest file view = projection).
- [ ] Add catalog validation test (`miroir-test-catalog.unit.test.ts`).

### Phase 7b — CLI ergonomics

- [ ] `miroirTestCatalog.runner.test.ts` unified entrypoint.
- [ ] Env vars: `MIROIR_TEST_*` with `RUN_TEST` alias.
- [ ] Wire `filter.testList` / tag / module / kind from env in `runDeployedUnitTestSuite`.
- [ ] Document commands in `packages/miroir-core/tests/README.md`.

### Phase 7c — UI discovery & integration toggle

- [ ] `reportMiroirTestCatalog` stored report.
- [ ] `TestExecutionProfileToggle` + integration run path in UI.
- [ ] Unify `TransformerTestDisplay` / `UnitTestDisplay` run props behind `executionProfile`.

### Phase 7d — Editor cross-links

- [ ] Inverted index API: `findCatalogSuitesByModuleExport(module, export)`.
- [ ] Links from transformer builder, function registry views, query editor.
- [ ] Optional: menu item “Miroir Tests” → catalog report.

### Phase 7e — Deferred migrations

- [ ] Evaluate: `domainStateToDeploymentEntityState`, `resolveCompositeActionTemplate`, `jzodToJzod.unit.test.ts`.
- [ ] Optional: migrate `681be9ca-…` transformer instances → `UnitTest` entity (data move, not blocking).

**Out of scope:** Class E/F vitest-only files remain on Vitest CLI — not indexed as `MiroirTest` leaves.

---

## 9. Items carried from original Phase 7

| Original item | Phase 7 placement |
|---------------|-------------------|
| Browse by kind, tag, module | §3 MiroirTest Catalog + §7.1 browse report |
| UI toggle unit vs integration | §3.4 execution profile + §7.2 |
| `RUN_TEST` / vitest conventions | §6 CLI selection |
| Link from editors to suites | §7.3 |
| `vitestProxy` for Class E | §4 Step 6 + §7e |
| Kind-specific input viewers / diff | §7.4 |
| Regenerate function-call export script | Keep; catalog validates exports |
| Large fixture vitest-only tests | §7e — remain `vitestProxy` until fixtureRef strategy |

---

## 10. Out of scope (unchanged)

| Item | Reason |
|------|--------|
| `Test` entity (`d2842a84-…`) composite-action integration tests | Different execution model (`runTestCompositeAction`); standalone-app scope |
| Merging `Test` into MiroirTest Catalog | Optional future; document as separate `compositeActionTest` family |
| Inline editing of vitest-only tests in UI | `vitestProxy` is run + view only |

---

## 11. Success criteria

- [ ] `miroir-test-catalog.json` lists **all** instances under `a1bc5288-…` and `681be9ca-…` with correct leaf counts.
- [ ] Filter `MIROIR_TEST_MODULE=miroir-core/1_core/jzod` runs only matching leaves/suites from CLI.
- [ ] Browse report filters by kind, tag, module without caring which storage entity holds the JSON.
- [ ] Integration toggle runs `transformers.integ` equivalent paths from UI for suites with `integrationTestExpectedValue`.
- [ ] At least one editor (function whitelist or transformer builder) shows linked catalog suites.
- [ ] `RUN_TEST` continues to work for all existing thin wrappers (non-regression).

---

## 12. References

| Resource | Path |
|----------|------|
| Parent plan | [`plan.md`](./plan.md) |
| Vitest file catalog (Phase 0) | [`catalog.json`](./catalog.json), [`generate-unit-test-catalog.mjs`](./generate-unit-test-catalog.mjs) |
| Unit test runner | `packages/miroir-core/tests/helpers/runDeployedUnitTestSuite.ts` |
| Dispatch | `packages/miroir-core/src/4_services/UnitTestTools.ts` |
| Transformer + integration | `packages/miroir-core/src/4_services/TestTools.ts` |
| Deployment exports | `packages/miroir-test-app_deployment-miroir/index.ts` |
| Shared run UI | `packages/miroir-standalone-app/.../Reports/TestExecutionPanel.tsx` |
| Entity definitions | `packages/miroir-test-app_deployment-miroir/assets/miroir_model/.../a1bc5288-….json`, `681be9ca-….json` |
