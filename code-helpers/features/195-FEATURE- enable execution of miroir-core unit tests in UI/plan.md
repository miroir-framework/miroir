# Feature 195 — Enable execution of miroir-core unit tests in UI

GitHub issue: [miroir-framework/miroir#195](https://github.com/miroir-framework/miroir/issues/195)

> **Superseded by [Feature 196 — MiroirTest](../196-FEATURE-migrate-tests-to-MiroirTest/plan.md)** (implementation complete). The `UnitTest` entity path described here was exploratory; production UI and vitest loaders now use **`MiroirTest`**. Legacy `UnitTest` / `TransformerTest` JSON and reports remain until a cleanup issue.

## Overview

Today only **transformer tests** can be executed through the Miroir UI, via the `TransformerTest` entity and the **Transformer Test Details** report (`reportUuid=1c06268b-2ddb-433c-ae4f-46546908125d`). Vitest covers a much wider surface in `packages/miroir-core/tests/` (52 files, ~400+ individual cases when table-driven suites are expanded).

**Goal:** introduce a common **`UnitTest`** abstraction that generalizes `TransformerTest`, represents all miroir-core unit tests as store JSON entities, and supports selection / execution / investigation from both the UI and the Vitest CLI (non-regression).

---

## Current state

### What works in the UI today

| Piece | Location |
|-------|----------|
| Entity | `TransformerTest` (`405bb1fc-a20f-4def-9d3a-206f72350633`) |
| Data instances | `miroir-test-app_deployment-miroir/assets/miroir_data/681be9ca-…/` |
| Execution engine | `packages/miroir-core/src/4_services/TestTools.ts` — `runUnitTransformerTests`, `runTransformerTestInMemory` |
| Activity tracking | `MiroirActivityTracker` → `TestSuiteResult` / `TestAssertionResult` |
| UI report | `TransformerTestResultExecutionSummary`, `TransformerTestDisplay`, `TransformerBuilderPage` |

### Parallel infrastructure — integration tests (out of scope for `UnitTest`)

| Piece | Purpose |
|-------|---------|
| `Test` entity (`d2842a84-…`) | **Integration** composite-action tests (`TestCompositeAction*`, templates, suites) — instances live in **standalone-app**, not miroir-core unit-test migration |
| `TestAssertion` | Assert on action results via `resultAccessPath`, optional `resultTransformer`, `expectedValue` |
| `CompositeRunTestAssertion` | Assertion step inside a composite action sequence |
| `runTestCompositeAction` action | Execute a resolved composite-action test end-to-end |

**Important distinction:** `resolveCompositeActionTemplate.unit.test.ts` is **not** a `TestCompositeAction` / `TestCompositeActionTemplate` instance test. It is a **Class B** unit test that calls `resolveTestCompositeActionTemplate` / `resolveTestCompositeActionTemplateSuite` with fixture payloads and compares resolved output. No `UnitTest.kind = "compositeAction"` — integration tests stay on the `Test` entity path.

### Vitest inventory (`packages/miroir-core/tests/`)

```
tests/
├── 1_core/          # pure utilities, jzod, zod parsing, EntityPrimaryKey, blob utils
├── 2_domain/        # transformers, queries, templates, menu, domain state
├── 3_controllers/   # activity / event / action trackers
├── 4_services/      # transformer integration (Postgres)
├── 4_views/         # ViewParams
├── experiments/     # exploratory (not production)
└── tools.test.ts
```

**Execution patterns found:**

| Pattern | Files | Count |
|---------|-------|-------|
| `runUnitTransformerTests` + store JSON (`TransformerTestDefinition`) | 9 | transformers, adminTransformers, jzodTypeCheck, resolveConditionalSchema, unfoldSchemaOnce, defaultValueForJzodSchema, resolveSchemaReferenceInContext, menu (inline), transformers.integ |
| Standard Vitest `describe` / `it` / `expect` | ~40 | see classification below |
| Custom table-driven runner (`it.each` + shared helper) | 4 | queries, jzod.typeCheckToPass, jzod.typeCheckToFail, alterObject |
| TypeScript compile-time / schema smoke tests | 2 | zodParseActions, zodParseCheckMiroirTransformerDefinitions |

---

## Test classification

Tests are grouped by **how they can share a JSON representation and a single execution runner**. The proposed `UnitTest` union discriminator is shown for each class.

### Class A — `transformerTest` *(already implemented)*

**Shape:** call a transformer (build and/or runtime) with params + context → compare result to `expectedValue` (with optional `subExpectedValue`, `ignoreAttributes`, `retainAttributes`, separate unit/integration expected values).

**Representative files:**

| Vitest file | Store entity | Notes |
|-------------|--------------|-------|
| `2_domain/transformers.unit.test.ts` | `transformerTest_miroirCoreTransformers` | Main core transformer suite; `RUN_TEST=transformers.unit.test` |
| `2_domain/adminTransformers.unit.test.ts` | `transformerTest_adminTransformers` | Meta-model admin transformers |
| `1_core/jzod/jzodTypeCheck.test.ts` | `transformerTestSuite_jzodTypeCheck` (deployment) | 42 cases (18 pass + 24 fail); uses `jzodTypeCheck` transformer |
| `1_core/jzod/resolveConditionalSchema.test.ts` | `transformerTest_resolveConditionalSchema` | Also has dedicated UI report wiring |
| `1_core/jzod/unfoldSchemaOnce.test.ts` | deployment JSON | |
| `1_core/defaultValueForJzodSchema.unit.test.ts` | deployment JSON | |
| `1_core/jzod/resolveSchemaReferenceInContext.test.ts` | deployment JSON | |
| `2_domain/menu.unit.test.ts` | **inline only** — not yet a store instance | Migration candidate |
| `4_services/transformers.integ.test.ts` | same suites as unit | Uses `runTransformerIntegrationTest` + Postgres |

**Migration status:** ~95% of transformer coverage is already entity-backed. `menu.unit.test.ts` is the main gap.

**Proposed mapping:** `UnitTest.kind = "transformer"` — structurally identical to today's `TransformerTest`; keep backward compatibility via alias or schema extension.

---

### Class B — `functionCallTest`

**Shape:** invoke a **named pure function** with positional or named arguments → deep-equal compare to `expectedValue`. Optional: `expectedError` (throws), `assertionMode` (`equal` | `match` | `instanceOf` | `throws`).

**Common sub-patterns within Vitest (all mappable to the same JSON):**

| Sub-pattern | Example files | `# cases (approx.)` |
|-------------|---------------|---------------------|
| One `it` per case | `mustache.unit.test.ts`, `jzodToJsonSchema.unit.test.ts`, `EntityPrimaryKey.unit.test.ts`, `blobUtils.unit.test.ts`, `tools.test.ts` | ~150 |
| Table in one `it`, loop + helper | `alterObject.unit.test.ts` | 3 grouped → ~10 cases |
| Table + `it.each` | `jzod.typeCheckToPass.unit.test.ts`, `jzod.typeCheckToFail.unit.test.ts` | ~25 + ~15 |
| Template resolution (single function, big I/O) | `resolveQueryTemplates.unit.test.ts`, `resolveCompositeActionTemplate.unit.test.ts` | 1 + 2 |
| Domain mapping | `domainStateToDeploymentEntityState.unit.test.ts`, `modelUpdates.unit.test.ts` | 2 + 1 |
| Transformer tooling helpers | `transformer_tools.*.unit.test.ts` | 5 |
| Jzod graph / reference utilities | `jzodReferencesGraph*`, `jzodTransitiveDependencySet`, `mergePositionBased`, `jzodObjectFlatten`, `union*`, `JzodSchemaReferences*`, `jzod.buildAnyKeyMap`, `jzod.selectUnionBranch*`, `jzodToJzod*`, `jzodToCopilotKitParameter`, `ansiColumnsToJzodSchema`, `getAttributeTypesFromJzodSchema`, `defaultValueForJzodSchema` (if not migrated to transformer) | ~120 |

**Proposed JSON sketch:**

```json
{
  "unitTestType": "functionCallTest",
  "unitTestLabel": "converts string type",
  "functionRef": {
    "module": "miroir-core/1_core/jzod/JzodToJsonSchema",
    "export": "jzodToJsonSchema"
  },
  "arguments": [{ "type": "jzodElement", "value": { "type": "string" } }],
  "expectedValue": { "type": "string" },
  "environmentRef": "defaultMiroirModelEnvironment"
}
```

**Runner:** new `runFunctionCallTest` in `TestTools.ts` (or `UnitTestTools.ts`) — resolves export, calls with deserialized args, uses same `jsonify` / `removeUndefinedProperties` / `ignoreAttributes` normalization as transformer tests.

**UI value:** High — these are the bulk of uncovered tests; inputs/outputs are JSON-friendly and easy to edit in JzodObjectEditor.

---

### Class C — `queryRunnerTest`

**Shape:** given a **fixture domain state** (or reference to a deployment snapshot) + a **query or query template** + runner selector → run synchronously in memory → assert on result paths.

**Representative file:** `2_domain/queries.unit.test.ts` — 26 named scenarios, each with:

- `queryTemplate` and/or `query`
- choice of runner (`runQueryFromDomainState`, `runQueryFromReduxDeploymentsState`, template variants)
- `testAssertions: { name → { resultAccessPath?, expectedResult } }`

This is **almost identical** to `TestAssertion` + composite-action tests, but uses direct function calls instead of `CompositeActionSequence`.

**Proposed JSON sketch:**

```json
{
  "unitTestType": "queryRunnerTest",
  "unitTestLabel": "error on non-existing Entity: EntityNotFound",
  "fixtureRef": "libraryDomainState",
  "runner": "runQueryTemplateFromDomainState",
  "queryTemplate": { "...": "..." },
  "assertions": [
    { "label": "test1", "resultAccessPath": [], "expectedValue": { "queryFailure": "ReferenceNotFound" } }
  ]
}
```

**Runner:** extract the loop body from `queries.unit.test.ts` into `runQueryRunnerTest`; reuse `getValueByDottedPath` from `TestTools.ts`.

**UI value:** High for query authors; depends on shipping or referencing domain-state fixtures (`domainState.json`, library deployment).

**Relationship to existing `Test` entity:** query-runner assertions may align with `TestAssertion.definition` shape; integration `Test` entity execution remains a separate track (not `UnitTest`).

---

### Class E — `statefulBehaviorTest`

**Shape:** requires **mutable instance state**, `beforeEach` setup, Vitest mocks, or async side effects. Not a simple input→output JSON blob.

**Representative files:**

| File | Why stateful |
|------|--------------|
| `3_controllers/TestTracker.unit.test.ts` | Tracker context lifecycle |
| `3_controllers/MiroirEventTracker.unit.test.ts` | Event subscription / emission |
| `3_controllers/RunActionTracker.unit.test.ts` | Action tracking under nested calls |
| `4_views/ViewParams.integ.test.ts` | Class getter/setter behavior |
| `1_core/blobUtils.unit.test.ts` | `FileReader` mock in `beforeAll`, async blob I/O |

**Recommendation:** **Do not migrate to store entities in Phase 1–2.** Keep as Vitest-only; optionally register in a **test catalog** (metadata entity listing file path + describe block names) for discoverability without JSON execution.

If later support is needed, introduce `unitTestType: "vitestProxy"` with `{ file, suite, testName }` — UI triggers CLI, displays results (no inline editing of test body).

---

### Class F — `schemaValidationTest`

**Shape:** verify that **parsing / type-checking** succeeds or fails; often multiple `.parse()` calls in one `it`, or TypeScript compile-time checks.

**Representative files:**

| File | Pattern |
|------|---------|
| `1_core/zodParseError.test.ts` | Zod parse round-trips on error fixtures |
| `1_core/zodParseCheckMiroirTransformerDefinitions.test.ts` | Validates real deployment transformer JSON against Zod |
| `1_core/zodParseActions.test.ts` | TS type assignment checks (`TestCompositeActionParams` unions) |

**Recommendation:** **Vitest-only outliers.** Some could become Class B (`functionCallTest` with `expectedError`) for the runtime-parse cases; TS compile-time tests cannot run in UI.

---

### Class G — `integrationTest` *(Postgres / external IO)*

**Representative files:**

| File | Dependency |
|------|------------|
| `4_services/transformers.integ.test.ts` | Postgres via `SqlDbDataStore`, seeded library data |
| `4_views/ViewParams.integ.test.ts` | Misnamed — actually pure unit tests (Class E) |

**Recommendation:** Same JSON as Class A (`transformerTest`) with `executionMode: "integration" | "unit"`. UI runs unit mode by default; integration mode gated behind admin setting + live DB (already partially implemented via `runTransformerIntegrationTest` and `integrationTestExpectedValue`).

---

## Outliers — handle separately

| Item | Issue | Recommendation |
|------|-------|----------------|
| `experiments/discriminatedOpt-inUnions.test.ts` | Exploratory, 53 cases | Exclude from UnitTest catalog |
| `1_core/jzod/jzod.resolveReferenceInContext.OLD.unit.test.ts` | Superseded | Delete or archive; do not migrate |
| `1_core/jzod/jzod.typeCheckToPass.unit.test.ts` | 12k lines, 25 cases — **migrated** to `transformerTestSuite_jzodTypeCheck` | Deprecated wrapper → `jzodTypeCheck.test.ts` |
| `1_core/jzod/jzod.typeCheckToFail.unit.test.ts` | 24 fail cases — **migrated** to `transformerTestSuite_jzodTypeCheck` | Deprecated wrapper → `jzodTypeCheck.test.ts` |
| `2_domain/menu.unit.test.ts` | Inline `TransformerTestSuite`, not in store | **done** — `unitTest_suite_menu` (Phase 5a) |
| `1_core/zodParseActions.test.ts` | Compile-time only | Vitest-only catalog entry |
| `1_core/blobUtils.unit.test.ts` | Node `FileReader` mock | Class E unless mock is embedded in runner |
| `2_domain/queries.unit.test.ts` | 1.8k lines, 26 scenarios, embedded `domainState.json` | **done** — `unitTest_suite_queries_library` (Phase 4) |
| Dual entities `TransformerTest` vs `Test` | Naming confusion | `UnitTest` unifies vitest-migratable **unit** tests; `Test` entity stays for **integration** composite-action tests (standalone-app) |
| `resolveCompositeActionTemplate.unit.test.ts` | Large fixture payloads | **deferred** — vitest-only; `fixtureRef` migration not planned for now |
| `domainStateToDeploymentEntityState.unit.test.ts` | Large domain-state fixture | **deferred** — vitest-only; `fixtureRef` migration not planned for now |

---

## Proposed `UnitTest` metamodel

Generalize `TransformerTestSuite` / `TransformerTest` into a discriminated union:

```
UnitTestDefinition (entity instance, like TransformerTestDefinition today)
└── definition: UnitTestSuite

UnitTestSuite
  unitTestType: "unitTestSuite"
  unitTestLabel: string
  skip?: boolean
  unitTests: UnitTest[]          // nested suites OR leaf tests

UnitTest (discriminated union on unitTestType)
  ├── transformerTest          // = current TransformerTest fields (alias)
  ├── functionCallTest         // Class B (includes resolveTestCompositeActionTemplate*)
  └── queryRunnerTest          // Class C
```

**Shared cross-cutting fields** (all kinds):

- `unitTestLabel`, `description`, `skip`, `testTag[]`
- `ignoreAttributes`, `retainAttributes`
- `unitTestExpectedValue` / `integrationTestExpectedValue` (where applicable)

**Shared assertion result types:** keep `TestAssertionResult`, `TestSuiteResult`, `MiroirActivityTracker` — already kind-agnostic.

**Entity strategy:**

1. Add `UnitTest` **Entity** + **EntityDefinition** (alongside unchanged `TransformerTest` definition).
2. Migrate existing `TransformerTest` instances → `unitTestType: "transformerTest"` (no semantic change).
3. Leave `Test` entity integration tests out of `UnitTest` catalog (standalone-app; separate UI/report path when needed).

---

## Architecture (target)

```
Store JSON (UnitTestDefinition instances)
        │
        ▼
UnitTestTools.ts  ──►  MiroirActivityTracker  ──►  TestSuiteResult
        │                        │
        │                        └──► UI: UnitTestExecutionSummary (generalized report)
        │
        ├── runTransformerTest        (existing)
        ├── runFunctionCallTest       (Class B)
        └── runQueryRunnerTest        (Class C)

Vitest CLI bridge:
  packages/miroir-core/tests/unitTestRunner.test.ts
    └── loads UnitTestDefinition from deployment package OR env SELECTED_SUITE
    └── dispatches to UnitTestTools by unitTestType
    └── RUN_TEST=<suiteLabel> pattern preserved for CI filtering
```

---

## Implementation phases

### Phase 0 — Inventory & catalog (no schema change)

- [x] Generate machine-readable catalog from Vitest files: `{ file, suite, label, class, caseCount }`.
- [x] Mark outliers (Class E, F, experiments) as `vitestOnly: true`.
- [x] Document mapping from each vitest file → target `UnitTest` kind.

**Deliverables:** [`catalog.json`](./catalog.json), [`CATALOG.md`](./CATALOG.md), [`generate-unit-test-catalog.mjs`](./generate-unit-test-catalog.mjs)

### Phase 1 — Metamodel & backward-compatible alias

- [x] Add `UnitTest` / `UnitTestSuite` types to metamodel preprocessor source (alongside `TransformerTest`).
- [x] `TransformerTest` ≡ `UnitTest` where `unitTestType = "transformerTest"` (subtype alias, no data migration required).
- [x] Add `UnitTestDefinition` entity OR extend `TransformerTest` EntityDefinition schema to union.
- [x] Generalize `TestTools.ts` exports: `runUnitTests` dispatches on `unitTestType`.

**Deliverables:** `UnitTest` entity + `UnitTestDefinition` EntityDefinition (deployment assets), `UnitTestTools.ts` with `runUnitTests` / legacy bridge, pilot instance `pilot_transformer_plus`, validation tests in `unitTest.tools.unit.test.ts` + `unitTest.pilot.unit.test.ts`. `TransformerTest` EntityDefinition (`405bb1fc-…`) unchanged.

**Validation:** 7/7 unit tests in `unitTest.tools.unit.test.ts`; pilot E2E via `RUN_TEST=unitTest.pilot.unit.test`; 243/243 transformer non-regression in `transformers.unit.test.ts`; 3/3 `UnitTest` model validation cases.

### Phase 2 — Function-call runner (Class B) — highest ROI

- [x] Implement `runFunctionCallTest` + `functionCallTestJzodSchema`.
- [x] Build `functionRef` registry mapping `(module, export)` → callable (whitelist for security in UI execution).
- [x] Migrate **pilot suite**: `mustache.unit.test.ts` + `jzodToJsonSchema.unit.test.ts` (~25 cases) to store JSON.
- [x] Vitest file becomes thin wrapper: load entity, call `runUnitTests`.
- [x] Generalize UI report section from `TransformerTestResultExecutionSummary` → `UnitTestExecutionSummary`.

**Deliverables:** `FunctionCallTestRegistry.ts`, `runFunctionCallTestInMemory` in `UnitTestTools.ts`, deployment suites `mustache_extractDoubleBracePatterns` + `jzodToJsonSchema`, `unitTestsDisplayResults`, `UnitTestExecutionSummary.tsx`.

**Validation:** `unitTest.tools.unit.test.ts` Phase 2 cases; `RUN_TEST=mustache.unit.test` (6/6); `RUN_TEST=jzodToJsonSchema.unit.test` (18/18); transformer non-regression unchanged.

### Phase 3 — Minimal UI / UX (small-step validation)

- [x] **Unit Test list report** (`reportUnitTestList`, uuid `cf1e1e7c-…`) — lists all `UnitTest` instances.
- [x] **Unit Test details report** (`reportUnitTestDetails`, uuid `bb9e8b62-…`) — instance editor + run button.
- [x] **Menu entry** “Miroir Unit Tests” in default Miroir menu → list report.
- [x] **`UnitTestDisplay`** + **`RunUnitTestSuiteButton`** in `ReportSectionEntityInstance` (`isUnitTest`, parallel to `isTransformerTest`).
- [x] **`UnitTestExecutionSummary`** + minimal **`UnitTestResults`** table.
- [x] Manual UI smoke-test: open list → open suite (e.g. `jzodToJsonSchema`) → Run → verify pass/fail summary.

**Deliverables:** deployment reports + menu link; `UnitTestDisplay.tsx`, `RunUnitTestSuiteButton.tsx`, `UnitTestResults.tsx`; `entityDefinitionUnitTest.defaultInstanceDetailsReportUuid` → unit test details report.

**Note:** Transformer and Unit test run mechanisms remain separate for now; `unitTestReportSection` refactor (Phase 6a) decouples run UI from `ReportSectionEntityInstance`.

### Phase 4 — Query-runner tests (Class C)

- [x] Extract runner from `queries.unit.test.ts` → `runQueryRunnerTest`.
- [x] Externalize `domainState.json` as fixture ref `libraryDomainState` (synced `src/domainState.json`).
- [x] Migrate query scenarios to `UnitTestDefinition` suite `queries_library` (17 leaves, `testQueries` mode).
- [x] Align assertion shape with `TestAssertion` (`assertions[].label/resultAccessPath/expectedValue`).

**Deliverables:** `QueryRunnerTestTools.ts`, `queries.unit.test.data.ts`, `unitTest_suite_queries_library`, thin wrapper `queries.unit.test.ts`, export via `EXPORT_QUERY_RUNNER_SUITE=1 npx vitest run tests/2_domain/export-query-runner-suite.unit.test.ts`.

**Validation:** `RUN_TEST=queries.unit.test` (17/17); `unitTest.tools.unit.test.ts` Phase 4 cases; `jzodTypeCheck` on `queries_library` instance.

### Phase 5 — Complete remaining migrations

Phase 5 is split by migration pattern. **5a** is done; **5b–5e** track the rest.

#### Phase 5a — Menu + first Class B batch *(done)*

- [x] `menu.unit.test.ts` → `unitTest_suite_menu` (`transformerTest` in UnitTest entity).
- [x] Class B batch: `alterObject` (3), `jzodToCopilotKitParameter` (17), `mergePositionBased` (18).
- [x] `functionCallTestSuites/*` data modules + `EXPORT_FUNCTION_CALL_SUITES=1` export script.
- [x] `runDeployedUnitTestSuite` thin-wrapper helper.
- [x] Runner: `expectUndefinedResult` + `__miroirJsonUndefined` JSON sentinel for `undefined` args/results.
- [x] Deprecate `jzod.typeCheckToPass.unit.test.ts` → forwards to `jzodTypeCheck.test.ts` entity loader.

**Export:** `EXPORT_FUNCTION_CALL_SUITES=1 npx vitest run tests/export-function-call-suites.unit.test.ts`

**Validation:** `RUN_TEST=alterObject.unit.test` (3/3); `jzodToCopilotKitParameter.unit.test` (17/17); `mergePositionBased.unit.test` (18/18); `menu.unit.test` (1/1).

#### Phase 5b — Bulk Class B (`functionCallTest`) *(done — batch 1)*

- [x] `JzodSchemaReferencesList` (9), `JzodSchemaReferencesSet` (9), `jzodTransitiveDependencySet` (6), `jzodToJzod_Summary` (25 + 1 vitest-only comparative).
- [x] Runner fix: `Set` return values normalized before `ignorePostgresExtraAttributes`.
- [x] `functionCallTestSuites/*` data modules + `export-function-call-suites.unit.test.ts`.
- [ ] Remaining ready batch: `jzodTransitiveDependencySet` duplicate Set smoke tests removed from vitest file.

**Validation:** `RUN_TEST=JzodSchemaReferencesList.unit.test` (9/9); `JzodSchemaReferencesSet.unit.test` (9/9); `jzodTransitiveDependencySet.unit.test` (6/6); `jzodToJzod_Summary.unit.test` (26/26).

#### Phase 5c — Class B extensions (minor runner/schema) *(done)*

Runner/schema extensions implemented:

- [x] `expectedAction2ErrorType` — functions returning `Action2Error` (not throws).
- [x] `assertions[]` with `resultAccessPath` — partial / multi-assert (e.g. `buildAnyKeyMap`).
- [x] `fixtureRef` / `__fixtureRef` argument sentinel — reuses query-runner fixtures (`libraryDomainState`).
- [x] `environmentRef` + `environmentArgumentIndex` — inject `defaultMiroirModelEnvironment`.
- [x] `FunctionCallTestFixtures.ts` + registry whitelist extensions.

Migration batch:

- [x] `EntityPrimaryKey.unit.test.ts` → `unitTest_suite_EntityPrimaryKey` (36 cases; `expectedAction2ErrorType`).
- [x] `jzodObjectFlatten.test.ts` → `unitTest_suite_jzodObjectFlatten` (8 cases; `environmentRef` + `expectedError`).
- [x] `modelUpdates.unit.test.ts` → `unitTest_suite_modelUpdates` (6 cases; `expectedValue: null` + `expectedError`).
- [x] `getAttributeTypesFromJzodSchema.unit.test.ts` → `unitTest_suite_getAttributeTypesFromJzodSchema` (4 cases; external package whitelist).
- [x] `ansiColumnsToJzodSchema.unit.test.ts` → `unitTest_suite_ansiColumnsToJzodSchema` (10 cases; inline args + `assertions[]`; Author CSV no longer uses `fixtureRef`).
- [x] `jzod.buildAnyKeyMap.unit.test.ts` → `unitTest_suite_buildAnyKeyMap` (11 cases; `assertions[]` + `resultAccessPath`).

**Deferred (vitest-only, not migrating now):** `domainStateToDeploymentEntityState.unit.test.ts`, `resolveCompositeActionTemplate.unit.test.ts` — large fixtures; `fixtureRef` infrastructure remains available but these suites stay out of scope.

**Validation:** `RUN_TEST=EntityPrimaryKey.unit.test` (36/36); `jzodObjectFlatten.test` (8/8); `modelUpdates.unit.test` (6/6); `getAttributeTypesFromJzodSchema.unit.test` (4/4); `ansiColumnsToJzodSchema.unit.test` (10/10); `jzod.buildAnyKeyMap.unit.test` (11/11).

#### Phase 5d — jzodTypeCheck consolidation *(done)*

- [x] Merge `jzod.typeCheckToFail` cases (24) into `transformerTestSuite_jzodTypeCheck` entity (42 total: 18 pass + 24 fail).
- [x] Add `any`-type pass cases (`test180_any_null`, `test181_any_boolean`, `test182_any_empty_object`).
- [x] Fix `jzodTypeCheck.ts` so `type: "any"` accepts `null` (union fallback + record field schema).
- [x] Remove 12k-line `jzod.typeCheckToPass` inline suite (deprecated wrapper → entity loader).
- [x] Deprecate `jzod.typeCheckToFail.unit.test.ts` → forwards to `jzodTypeCheck.test.ts` (same pattern as pass wrapper).
- [x] Regenerator: `tests/scripts/merge-jzodTypeCheck-fail-cases.mjs` (source: `jzodTypeCheck-fail-cases.source.ts`).

**Validation:** `RUN_TEST=jzodTypeCheck npx vitest run tests/1_core/jzod/jzodTypeCheck.test.ts` (42/42).

### Phase 6 — UI integration (TDD refactor → feature wiring)

Follow established report-section patterns (`markdownReportSection`, `objectInstanceReportSection`).

#### Phase 6a — `unitTestReportSection` *(done)*

- [x] Add `unitTestReportSection` to Report `EntityDefinition` + `reportSection` union.
- [x] `getMiroirFundamentalJzodSchema.ts` filter + `npm run devBuild -w miroir-core`.
- [x] `ReportSectionUnitTest.tsx` — renders `UnitTestDisplay` from `fetchedDataReference`.
- [x] Wire in `ReportSectionViewWithEditor`; remove hard-coded `UnitTestDisplay` from `ReportSectionEntityInstance`.
- [x] Unit Test details report (`bb9e8b62-…`) — `unitTestReportSection` before instance editor.

#### Phase 6b — `transformerTestReportSection` *(done)*

- [x] Add `transformerTestReportSection` to Report `EntityDefinition` + `reportSection` union.
- [x] `getMiroirFundamentalJzodSchema.ts` filter + `npm run devBuild -w miroir-core` (after deployment rebuild).
- [x] `ReportSectionTransformerTest.tsx` — renders `TransformerTestDisplay` from `fetchedDataReference`.
- [x] Wire in `ReportSectionViewWithEditor`; remove hard-coded `TransformerTestDisplay` from `ReportSectionEntityInstance`.
- [x] Transformer Test details report (`1c06268b-…`) — `transformerTestReportSection` before instance editor.

#### Phase 6c — Kind-specific editors & unified run UX *(done)*

- [x] `UnitTestKindBadge` in `JzodObjectEditor` per `unitTestType` (`functionCallTest`, `queryRunnerTest`, `transformerTest`, `unitTestSuite`); union discriminator already drives branch-specific fields.
- [x] Shared `TestExecutionPanel` + `TestResultsGrid` + `testSelectionUtils` — used by `UnitTestDisplay` and `TransformerTestDisplay` (summary, grid, selection, assertion diff via `TestCellWithDetails`).
- [x] `ReportPageContext.navigateToUnitTestInEditor` + anchor IDs on editor rows; failed-result **Edit** button scrolls/highlights matching `unitTestLabel`.

#### Phase 6d — Remaining Class B jzod utility migrations *(done)*

Migrate vitest-only `functionCallTest` suites to `UnitTestDefinition` deployment JSON, following Phase 5a–5c patterns (`runDeployedUnitTestSuite` thin wrapper, `FunctionCallTestRegistry` whitelist, generator script).

**Prerequisites (shared across batches):**

- [x] Register exports in `FunctionCallTestRegistry.ts` (union helpers, reference graph, path/tool helpers).
- [x] Reuse `environmentRef` + `environmentArgumentIndex` where tests pass `defaultMetaModelEnvironment` / `defaultMiroirModelEnvironment`.
- [x] Use `expectedError` / `assertions[]` + `resultAccessPath` for functions returning `{ status: "error", … }` rather than throwing (notably `selectUnionBranchFromDiscriminator`).
- [x] Generator script `packages/miroir-core/tests/scripts/generate-phase-6d-suites.ts` → 9 deployment JSON assets under parent UUID `a1bc5288-c982-4ff3-8316-4a2400fe9323`.

##### Batch 6d-1 — Union resolution subgraph (36 cases deployed)

Core union-matching utilities; complements the `jzodTypeCheck` transformer suite (Phase 5d).

| Vitest file | Export | Cases | Notes |
|-------------|--------|-------|-------|
| `jzod.selectUnionBranchFromDiscriminator.unit.test.ts` | `selectUnionBranchFromDiscriminator` | **14** | 15th vitest `it` was vacuous/skipped in original |
| `jzodUnion_RecursiveUnfold.test.ts` | `jzodUnion_recursivelyUnfold` | 12 | circular-ref cases use `captureFromRun` full-result snapshot |
| `jzod.unionObjectChoices.test.ts` | `unionObjectChoices` | 4 | |
| `jzod.unionResolvedTypeForObject.unit.test.ts` | `jzodUnionResolvedTypeForObject` | 2 | |
| `jzod.unionResolvedTypeForArray.unit.test.ts` | `jzodUnionResolvedTypeForArray` | 2 | |
| `unionArrayChoices.test.ts` | `unionArrayChoices` | 2 | |

- [x] `unitTest_suite_selectUnionBranchFromDiscriminator` (`c6d1a001-…`)
- [x] `unitTest_suite_jzodUnion_RecursiveUnfold` (`c6d1a002-…`)
- [x] `unitTest_suite_unionObjectChoices` (`c6d1a003-…`)
- [x] `unitTest_suite_jzodUnionResolvedTypeForObject` (`c6d1a004-…`)
- [x] `unitTest_suite_jzodUnionResolvedTypeForArray` (`c6d1a005-…`)
- [x] `unitTest_suite_unionArrayChoices` (`c6d1a006-…`)
- [x] Vitest wrappers → `runDeployedUnitTestSuite` loaders.

**Validation:** all 6d-1 suites green (36/36 assertions).

##### Batch 6d-2 — Reference graph & context (8 cases deployed)

| Vitest file | Export | Cases | Notes |
|-------------|--------|-------|-------|
| `jzodReferencesGraphConnectedComponents.unit.test.ts` | `jzodReferencesGraphConnectedComponents` | 5 | |
| `jzod.localizeReferenceContext.unit.test.ts` | `localizeJzodSchemaReferenceContext` | 3 | 1 vitest `it` with 3 sub-cases; `miroirFundamentalJzodSchema` bare fixture |

- [x] `unitTest_suite_jzodReferencesGraphConnectedComponents` (`c6d2a001-…`)
- [x] `unitTest_suite_localizeJzodSchemaReferenceContext` (`c6d2a002-…`)
- [x] Registry whitelist + thin vitest wrappers.

**Validation:** 8/8 assertions green.

##### Batch 6d-3 — Non-jzod Class B stragglers (36 cases deployed)

| Vitest file | Export | Cases | Notes |
|-------------|--------|-------|-------|
| `tools.test.ts` | various path/array helpers | **35** | single `unitTest_suite_tools` (`c6d3a001-…`) |
| `2_domain/resolveQueryTemplates.unit.test.ts` | `resolveQueryTemplateWithExtractorCombinerTransformer` | 1 | `unitTest_suite_resolveQueryTemplates` (`c6d3a002-…`); sync `functionCallTest` |

- [x] `unitTest_suite_tools`
- [x] `unitTest_suite_resolveQueryTemplates`
- [x] Registry whitelist for tool helpers (`pushIfUniqueReturning`, etc.)

**Validation:** `tools.test` 35/35; `resolveQueryTemplates.unit.test` 1/1 green.

**Runner fixes landed with 6d:**

- `normalizeFunctionCallResult`: apply `unNullify` so JSON `null` expected values match runtime `null` fields (jzodElement unfold case).
- `resolveFixtureProperty`: bare fixtures (e.g. `miroirFundamentalJzodSchema`) inject the fixture object when `domainState` is absent.

**Regenerate deployment JSON after case edits:**

```bash
cd packages/miroir-core && npx tsx tests/scripts/generate-phase-6d-suites.ts
cd packages/miroir-test-app_deployment-miroir && npm run build
```

##### Explicitly out of Phase 6d scope

| Item | Reason |
|------|--------|
| `jzodToJzod.unit.test.ts` | Callback/comparative harness — defer (Phase 7 or `transformerTest`) |
| `jzod.resolveReferenceInContext.OLD.unit.test.ts` | Superseded — delete |
| `domainStateToDeploymentEntityState`, `resolveCompositeActionTemplate` | Large fixtures — remain vitest-only (Phase 7) |
| Class A transformer suites already entity-backed | `resolveConditionalSchema`, `unfoldSchemaOnce`, `resolveSchemaReferenceInContext`, `defaultValueForJzodSchema` — no `functionCallTest` migration |

**Export command (unchanged pattern):**

```bash
EXPORT_FUNCTION_CALL_SUITES=1 npx vitest run tests/export-function-call-suites.unit.test.ts
```
---

## Vitest CLI non-regression strategy

| Concern | Approach |
|---------|----------|
| Single source of truth | Test definitions live in store JSON; vitest files are thin loaders |
| Selective runs | Keep `RUN_TEST=<suiteLabel>` env var; add `--unitTestKind=transformer` filter |
| Parallel CI jobs | Split by kind: `transformer`, `functionCall`, `queryRunner`, `vitestOnly` |
| Assertion parity | Same `runUnitTests` code path in UI and CLI (UI uses simulated vitest expect, already supported) |
| Large suites | `jzodTypeCheck` — keep nested suite structure; support `filter.testList` (already in TestTools) |

---

## UI changes (summary)

| Area | Status | Change |
|------|--------|--------|
| Entity list | **Done (Phase 3)** | `reportUnitTestList` + menu “Miroir Unit Tests” |
| Detail report | **Phase 6a** | `reportUnitTestDetails`; run via `unitTestReportSection` (was hard-coded in `ReportSectionEntityInstance`) |
| Execution | **Phase 6a/6b** | Run UI via `unitTestReportSection` / `transformerTestReportSection` (decoupled from `ReportSectionEntityInstance`) |
| Results | **Done (Phase 3)** | `UnitTestExecutionSummary` + `UnitTestResults` table |
| Editing | Phase 7 | See [`phase-7-plan.md`](./phase-7-plan.md) — kind-specific diff; editor catalog links |
| Discovery | Phase 7 | MiroirTest Catalog — browse by kind/tag/module; unified list report |

---

## Risk & open questions

1. **`functionRef` security:** UI execution must whitelist callable exports; arbitrary module paths are unsafe.
2. **Fixture size:** `domainState.json` and jzod schemas make large entity instances — consider blob storage or `$ref` to deployment snapshots.
3. **Entity proliferation:** `TransformerTest` + `Test` + `UnitTest` — **Recommendation:** `UnitTest` for miroir-core unit-test migration only; `Test` entity remains integration (composite-action) in standalone-app; no `compositeActionTest` `unitTestType`.
4. **Class E coverage:** Accept that ~10% of tests remain Vitest-only; document in catalog.
5. **jzod.typeCheckToPass / jzod.typeCheckToFail:** **Done** — 39 cases in `transformerTestSuite_jzodTypeCheck`; vitest wrappers deprecated.

---

## Success criteria

- [x] All Class A transformer suites selectable and runnable from UI (including `menu` — Phase 5a).
- [x] Class B pilot suites runnable from UI and Vitest with identical results (Phase 3 UI wiring; manual smoke-test OK).
- [x] Class C query suite represented as store entities and runnable in memory (CLI; UI via existing `UnitTestDisplay`).
- [x] `jzodTypeCheck` pass + fail cases consolidated in `transformerTestSuite_jzodTypeCheck` (42 cases).
- [ ] `domainStateToDeploymentEntityState` / `resolveCompositeActionTemplate` — **deferred** (vitest-only).
- [ ] `npm test` / `RUN_TEST` in CI covers all entity-backed suites (non-regression).
- [ ] Outliers documented; no false expectation of UI execution for Class E/F.

---

## Appendix — File → class mapping

| File | Class | Priority |
|------|-------|----------|
| `2_domain/transformers.unit.test.ts` | A | done |
| `2_domain/adminTransformers.unit.test.ts` | A | done |
| `1_core/jzod/jzodTypeCheck.test.ts` | A | done |
| `1_core/jzod/resolveConditionalSchema.test.ts` | A | done |
| `1_core/jzod/unfoldSchemaOnce.test.ts` | A | done |
| `1_core/defaultValueForJzodSchema.unit.test.ts` | A | done |
| `1_core/jzod/resolveSchemaReferenceInContext.test.ts` | A | done |
| `2_domain/menu.unit.test.ts` | A | done (Phase 5a UnitTest) |
| `4_services/transformers.integ.test.ts` | A+G | done (integration) |
| `1_core/mustache.unit.test.ts` | B | pilot |
| `1_core/jzod/jzodToJsonSchema.unit.test.ts` | B | pilot |
| `1_core/EntityPrimaryKey.unit.test.ts` | B | done (Phase 5c) |
| `1_core/alterObject.unit.test.ts` | B | done (Phase 5a) |
| `1_core/jzod/jzodToCopilotKitParameter.unit.test.ts` | B | done (Phase 5a) |
| `1_core/jzod/mergePositionBased.unit.test.ts` | B | done (Phase 5a) |
| `1_core/jzod/jzod.typeCheckToFail.unit.test.ts` | A | done — deprecated wrapper; cases in entity |
| `1_core/jzod/jzod.typeCheckToPass.unit.test.ts` | A | done — deprecated wrapper; cases in entity |
| `1_core/jzod/jzod.buildAnyKeyMap.unit.test.ts` | B | done (Phase 5c) |
| `1_core/ansiColumnsToJzodSchema.unit.test.ts` | B | done (Phase 5c) |
| `1_core/jzod/jzodObjectFlatten.test.ts` | B | done (Phase 5c) |
| `2_domain/modelUpdates.unit.test.ts` | B | done (Phase 5c) |
| `1_core/jzod/jzod.selectUnionBranchFromDiscriminator.unit.test.ts` | B | **Phase 6d-1** (15 cases) |
| `1_core/jzod/jzodUnion_RecursiveUnfold.test.ts` | B | Phase 6d-1 |
| `1_core/jzod/jzod.unionObjectChoices.test.ts` | B | Phase 6d-1 |
| `1_core/jzod/jzod.unionResolvedTypeForObject.unit.test.ts` | B | Phase 6d-1 |
| `1_core/jzod/jzod.unionResolvedTypeForArray.unit.test.ts` | B | Phase 6d-1 |
| `1_core/jzod/unionArrayChoices.test.ts` | B | Phase 6d-1 |
| `1_core/jzod/jzodReferencesGraphConnectedComponents.unit.test.ts` | B | Phase 6d-2 |
| `1_core/jzod/jzod.localizeReferenceContext.unit.test.ts` | B | Phase 6d-2 |
| `tools.test.ts` | B | Phase 6d-3 (~35 cases) |
| `1_core/blobUtils.unit.test.ts` | E | vitest-only |
| `2_domain/queries.unit.test.ts` | C | done (Phase 4) |
| `2_domain/resolveQueryTemplates.unit.test.ts` | B | Phase 6d-3 |
| `1_core/jzod/jzodToJzod.unit.test.ts` | B | defer (callback harness) |
| `2_domain/domainStateToDeploymentEntityState.unit.test.ts` | B | **deferred** (vitest-only) |
| `2_domain/modelUpdates.unit.test.ts` | B | done (Phase 5c) |
| `2_domain/resolveCompositeActionTemplate.unit.test.ts` | B | **deferred** (vitest-only) |
| `2_domain/transformer_tools.*.unit.test.ts` | B | low |
| `3_controllers/*.unit.test.ts` | E | vitest-only |
| `4_views/ViewParams.integ.test.ts` | E | vitest-only |
| `1_core/zodParseError.test.ts` | F | vitest-only |
| `1_core/zodParseCheckMiroirTransformerDefinitions.test.ts` | F | vitest-only |
| `1_core/zodParseActions.test.ts` | F | vitest-only |
| `experiments/*` | — | exclude |
| `1_core/jzod/jzod.resolveReferenceInContext.OLD.unit.test.ts` | — | delete |
