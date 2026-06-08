# Feature 195 — Enable execution of miroir-core unit tests in UI

GitHub issue: [miroir-framework/miroir#195](https://github.com/miroir-framework/miroir/issues/195)

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

### Parallel infrastructure already in the metamodel (not wired to UI the same way)

| Piece | Purpose |
|-------|---------|
| `Test` entity (`d2842a84-…`) | Composite-action integration tests (`TestCompositeAction*`, templates, suites) |
| `TestAssertion` | Assert on action results via `resultAccessPath`, optional `resultTransformer`, `expectedValue` |
| `CompositeRunTestAssertion` | Assertion step inside a composite action sequence |
| `runTestCompositeAction` action | Execute a resolved composite-action test |

These overlap conceptually with query-runner tests in `queries.unit.test.ts` but are separate from `TransformerTest`.

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
| `1_core/jzod/jzodTypeCheck.test.ts` | `transformerTestSuite_jzodTypeCheck` (deployment) | Large suite; uses `jzodTypeCheck` transformer |
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
| Template resolution (single function, big I/O) | `resolveQueryTemplates.unit.test.ts` | 1 |
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

**Relationship to existing `Test` entity:** consider aligning `TestAssertion.definition` with query-runner assertions so Class C and composite-action tests share assertion shape.

---

### Class D — `compositeActionTest` *(metamodel exists, UI execution incomplete)*

**Shape:** resolve template → run `TestCompositeAction` / suite via `handleTestCompositeAction` → assert with `CompositeRunTestAssertion`.

**Representative files:**

| File | Role |
|------|------|
| `2_domain/resolveCompositeActionTemplate.unit.test.ts` | Template → resolved action (2 cases) |
| `Test` entity + `runTestCompositeAction` | Intended end-to-end runner |
| `miroir-standalone-app/tests/3_controllers/applicative.*.integ.test.tsx` | Application-level composite-action tests |

**Proposed mapping:** `UnitTest.kind = "compositeAction"` — wrap existing `TestCompositeAction*` types; `UnitTestSuite` nests like `TransformerTestSuite`.

**UI value:** Medium-high — infrastructure exists; needs report + runner wiring similar to transformer tests.

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
| `1_core/jzod/jzod.typeCheckToPass.unit.test.ts` | 12k lines, 25 cases, **migration in progress** to transformer suite (`jzodTypeCheck.test.ts` + deployment entity) | Finish migration; deprecate TS file |
| `2_domain/menu.unit.test.ts` | Inline `TransformerTestSuite`, not in store | Move to `TransformerTestDefinition` instance |
| `1_core/zodParseActions.test.ts` | Compile-time only | Vitest-only catalog entry |
| `1_core/blobUtils.unit.test.ts` | Node `FileReader` mock | Class E unless mock is embedded in runner |
| `2_domain/queries.unit.test.ts` | 1.8k lines, 26 scenarios, embedded `domainState.json` | Class C; split into entity suite + fixture reference |
| Dual entities `TransformerTest` vs `Test` | Naming confusion | Unified under `UnitTest` with kind discriminator; deprecate gradually |

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
  ├── functionCallTest         // Class B
  ├── queryRunnerTest          // Class C
  ├── compositeActionTest      // Class D (= TestCompositeAction)
  └── compositeActionTemplateTest  // template resolution only (optional)
```

**Shared cross-cutting fields** (all kinds):

- `unitTestLabel`, `description`, `skip`, `testTag[]`
- `ignoreAttributes`, `retainAttributes`
- `unitTestExpectedValue` / `integrationTestExpectedValue` (where applicable)

**Shared assertion result types:** keep `TestAssertionResult`, `TestSuiteResult`, `MiroirActivityTracker` — already kind-agnostic.

**Entity strategy:**

1. Add `UnitTest` **Entity** + **EntityDefinition** (or evolve `TransformerTest` definition to accept the union — less disruptive for existing data).
2. Migrate existing `TransformerTest` instances → `unitTestType: "transformerTest"` (no semantic change).
3. Link `Test` entity instances into the same catalog (composite-action kind) or merge entities long-term.

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
        ├── runFunctionCallTest       (new)
        ├── runQueryRunnerTest        (new)
        └── runCompositeActionTest    (wire existing handleTestCompositeAction)

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

- [ ] Implement `runFunctionCallTest` + `functionCallTestJzodSchema`.
- [ ] Build `functionRef` registry mapping `(module, export)` → callable (whitelist for security in UI execution).
- [ ] Migrate **pilot suite**: `mustache.unit.test.ts` + `jzodToJsonSchema.unit.test.ts` (~25 cases) to store JSON.
- [ ] Vitest file becomes thin wrapper: load entity, call `runUnitTests`.
- [ ] Generalize UI report section from `TransformerTestResultExecutionSummary` → `UnitTestExecutionSummary`.

### Phase 3 — Query-runner tests (Class C)

- [ ] Extract runner from `queries.unit.test.ts` → `runQueryRunnerTest`.
- [ ] Externalize `domainState.json` as fixture entity or deployment snapshot ref.
- [ ] Migrate 26 scenarios to `UnitTestDefinition` suite(s).
- [ ] Align assertion shape with `TestAssertion`.

### Phase 4 — Composite-action tests (Class D)

- [ ] Wire `runTestCompositeAction` into `UnitTestTools` with activity tracking.
- [ ] UI: run / investigate from `Test` entity report (extend or share with UnitTest report).
- [ ] Migrate `resolveCompositeActionTemplate.unit.test.ts` cases.

### Phase 5 — Complete transformer migration & integration modes

- [ ] Move `menu.unit.test.ts` inline suite to store.
- [ ] Finish `jzod.typeCheckToPass` → transformer entity migration; remove 12k-line file.
- [ ] UI toggle: unit vs integration for transformer tests (reuse `integrationTestExpectedValue`).
- [ ] Document `RUN_TEST` / vitest filter conventions for CI.

### Phase 6 — Discovery UX

- [ ] Runner or report to browse all `UnitTestDefinition` instances by kind, tag, module.
- [ ] Link from function/transformer/query editor to relevant test suites.
- [ ] Optional: `vitestProxy` catalog entries for Class E tests (run via CLI only).

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

| Area | Change |
|------|--------|
| Entity list | Show `UnitTest` / `UnitTestDefinition` alongside or replacing `TransformerTest` |
| Detail report | Generalize Transformer Test Details → **Unit Test Details** with kind-specific input viewers |
| Execution | Action `runUnitTestSuite` (generalize existing transformer run action) |
| Results | Reuse `MiroirActivityTracker` pipeline; kind-specific diff display for function-call vs transformer |
| Editing | JzodObjectEditor for each `unitTestType` branch |

---

## Risk & open questions

1. **`functionRef` security:** UI execution must whitelist callable exports; arbitrary module paths are unsafe.
2. **Fixture size:** `domainState.json` and jzod schemas make large entity instances — consider blob storage or `$ref` to deployment snapshots.
3. **Entity proliferation:** `TransformerTest` + `Test` + new `UnitTest` — merge vs extend? **Recommendation:** extend `TransformerTest` EntityDefinition to hold the union initially; rename UI labels to "Unit Test".
4. **Class E coverage:** Accept that ~10% of tests remain Vitest-only; document in catalog.
5. **jzod.typeCheckToPass:** Prioritize completing transformer migration before attempting function-call representation.

---

## Success criteria

- [ ] All Class A transformer suites selectable and runnable from UI (including `menu`).
- [ ] Class B pilot suites runnable from UI and Vitest with identical results.
- [ ] Class C query suite represented as store entities and runnable in memory from UI.
- [ ] Class D composite-action tests executable with assertion investigation in UI.
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
| `2_domain/menu.unit.test.ts` | A | migrate to store |
| `4_services/transformers.integ.test.ts` | A+G | done (integration) |
| `1_core/mustache.unit.test.ts` | B | pilot |
| `1_core/jzod/jzodToJsonSchema.unit.test.ts` | B | pilot |
| `1_core/EntityPrimaryKey.unit.test.ts` | B | high |
| `1_core/alterObject.unit.test.ts` | B | high |
| `1_core/jzod/jzod.typeCheckToFail.unit.test.ts` | B | medium (→ A migration possible via jzodTypeCheck transformer) |
| `1_core/jzod/jzod.typeCheckToPass.unit.test.ts` | A (target) | deprecate file |
| `1_core/jzod/*` (remaining 15 files) | B | medium |
| `tools.test.ts` | B | medium |
| `1_core/blobUtils.unit.test.ts` | E | vitest-only |
| `2_domain/queries.unit.test.ts` | C | high |
| `2_domain/resolveQueryTemplates.unit.test.ts` | B | medium |
| `2_domain/domainStateToDeploymentEntityState.unit.test.ts` | B | medium |
| `2_domain/modelUpdates.unit.test.ts` | B | low |
| `2_domain/resolveCompositeActionTemplate.unit.test.ts` | D | medium |
| `2_domain/transformer_tools.*.unit.test.ts` | B | low |
| `3_controllers/*.unit.test.ts` | E | vitest-only |
| `4_views/ViewParams.integ.test.ts` | E | vitest-only |
| `1_core/zodParseError.test.ts` | F | vitest-only |
| `1_core/zodParseCheckMiroirTransformerDefinitions.test.ts` | F | vitest-only |
| `1_core/zodParseActions.test.ts` | F | vitest-only |
| `experiments/*` | — | exclude |
| `1_core/jzod/jzod.resolveReferenceInContext.OLD.unit.test.ts` | — | delete |
