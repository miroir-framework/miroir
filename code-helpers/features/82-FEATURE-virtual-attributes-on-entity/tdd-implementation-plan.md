# Issue #82 — TDD Implementation Plan

> Vertical TDD slices (RED → GREEN each), integration-first per `docs/contributing/testing.md`:
> tests exercise the real transformer runtime, in-memory query runners (`runQueryFromDomainState` /
> boxed extractors), and (SQL slice) the real `sqlStringForExtractor` compiler.
> Applicative contracts: Jzod `tag.value.virtualAttribute` + Entity `mlSchema` attributes.
> No mocks. Tracer: a Library **Book** instance-local `citation` derived from stored `name` + `year`,
> evaluated **only when the query requires that name**, never via JOIN.
>
> **Execution model:** human-in-the-loop. No slice contains a commit step — commits happen
> only when the user explicitly asks. Each slice ends with its Validation commands; on
> success its Realization summary is appended and its Status flips to ✅ DONE.

Analysis: [`./analysis.md`](./analysis.md) · Issue: https://github.com/miroir-framework/miroir/issues/82
Working branch: `master`

**Resume note:** plan written 2026-08-31 — no slices started.

---

## Scope

In scope:

- Jzod tag `virtualAttribute` (inline `coreTransformerForBuildPlusRuntime`) on Entity `mlSchema` attributes.
- Domain overlay: evaluate a virtual attribute from **the instance’s stored fields only**, **only when required**.
- In-memory Queries: `filter` / `orderBy` / `attributes` treat the name like a stored attribute.
- SQL Queries (`runAsSql`): expression over **that entity’s table only** (no extra FROM/JOIN); skip Sequelize columns; strip on write.
- Report list `viewAttributes` and details TVOE: report engine requires displayed virtual names so cells/fields fill without a per-report `runtimeTransformers` block.
- Downstream transformers in the same boxed query that read a required virtual name.

This plan does **not** resolve FK *target rows* into the transformer context (analysis D3-a). It does **not** migrate Designer UserStory Role-join formatting (non-goal). It does **not** implement #80 validation transformers, #246 panel, or materialization (D4-b).

---

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Characterize: no virtual tag; full extractors are raw; SQL is column names | ⬜ | phase0 vitest + existing `queries_library` |
| 1 | Schema: `tag.value.virtualAttribute` validates | ⬜ | generated types + modelValidation |
| 2 | Tracer: lazy instance-only evaluation helper | ⬜ | MiroirTest `virtualAttributes` / `evaluate` |
| 3 | In-memory Query: project / filter / orderBy / lazy default | ⬜ | MiroirTest `virtualAttributes` / `query` |
| 4 | Never persist: skip SQL columns + strip on write | ⬜ | functionCallTest + postgres mapping vitest |
| 5 | SQL Query: expression on A only when required | ⬜ | SqlGenerator vitest + `runAsSql` integ |
| 6 | List + details display without report RT | ⬜ | Library BookList / BookDetails integ |
| 7 | Other transformers read a required virtual name | ⬜ | queryTest with RT `accessDynamicPath` |
| 8 | Nonreg, docs, cleanup, AC | ⬜ | nonreg + tracer narrative |

---

## Locked implementation defaults

Carried from the analysis decision record (confirmed 2026-08-31). Deviations go into the slice’s Realization.

| Decision | Choice |
|---|---|
| D1 | Attribute lives in `mlSchema.definition`; marker is `tag.value.virtualAttribute` |
| D2 | Inline transformer (`coreTransformerForBuildPlusRuntime`); named `transformerType` allowed |
| D3 | Context = the instance’s **stored** fields (FK uuids as scalars). No other entities. No JOIN |
| D4 | Never a DB/filesystem column; strip virtual keys on create/update |
| D5 | Evaluate only when required (filter / orderBy / `attributes` / same-query path / report display fields) |
| D6 | `runAsSql`: compile to an expression over A’s columns; else in-memory when required; compile failure → `QueryNotExecutable` |
| D7 | Principle is entity-agnostic. Library Book `citation` is the applicative example, not Designer UserStory |
| Mustache bind | Evaluation merges stored instance fields into `contextResults` so `{{name}}` works (still D3: no extra objects) |
| Module | `packages/miroir-core/src/2_domain/VirtualAttributes.ts` — small public API, deep implementation |
| UUID policy | RFC 4122 **v4 only** for new model elements |

---

## Allocated UUIDs / keys

| Artefact | Value |
|---|---|
| MiroirTest suite (new) | uuid `c4dffd69-2594-482c-b680-295c30eafe30` · `name`: `virtualAttributes` · parentUuid `a311f363-e238-4203-bdfc-29e8c160c26b` |
| Suite key (registry + `index.ts` export `miroirTest_virtualAttributes`) | `virtualAttributes` |
| Library Book (existing, extended) | Entity `e8ba151b-d68e-4cc3-9a83-3459d309ccf5` |
| Example virtual attribute name | `citation` — mustache `{{name}} ({{year}})` |
| Example instance (expected citation) | Rear Window `c97be567-bd70-449f-843e-cd1d64ac1ddd` → `"Rear Window (1942)"` |
| BookList / BookDetails (existing) | `74b010b6-afee-44e7-8590-5f0849e4a5c9` / `c3503412-3d8a-43ef-a168-aa36e975e606` |
| Slice 0 transitional vitest | `packages/miroir-core/tests/2_domain/issues/82-virtual-attributes/virtualAttributes.82.phase0.unit.test.ts` |
| Slice 4/5 postgres vitest | `packages/miroir-store-postgres/test/issues/82-virtual-attributes/` |
| Slice 6 view integ | `packages/miroir-standalone-app/tests/4_view/issues/82-virtual-attributes/` |
| Nonreg step | None new — suite enrolled via the `unit-miroir-core` registry sweep (Slice 8.1); SQL/view coverage via slice-local commands until Slice 8 |

No new Entity uuid. Jzod bootstrap schema `1e8dab4b-65a3-4686-922e-ce89a2d62aa9` is edited in place (Slice 1).

---

## Public interface under test (new)

```typescript
// packages/miroir-core/src/2_domain/VirtualAttributes.ts

/** True when the attribute schema is marked virtual (tag.value.virtualAttribute present). */
export function isVirtualAttribute(schema: JzodElement): boolean;

/** Virtual attribute names on the Entity present-model mlSchema (not entityDefinitionRoot identity fields). */
export function listVirtualAttributeNames(entity: Entity): string[];

export type VirtualAttributeNeed = {
  filterAttributeName?: string;
  orderByAttributeName?: string;
  projectedAttributes?: string[]; // extractor.attributes; undefined = "all stored, no virtual"
  referencedAttributeNames?: string[]; // names collected from the rest of the query / report display
};

/** Subset of virtual names that this need requires. */
export function requiredVirtualAttributeNames(
  entity: Entity,
  need: VirtualAttributeNeed,
): string[];

/**
 * Return a shallow copy of `instance` with required virtual names overlaid.
 * Unrequested virtual names are absent. Does not mutate `instance`.
 * Transformer context = stored fields of `instance` only.
 */
export function evaluateVirtualAttributesOnInstance(
  entity: Entity,
  instance: EntityInstance,
  neededNames: string[],
  modelEnvironment: MiroirModelEnvironment,
  transformerParams?: Record<string, any>,
): EntityInstance;

/** Drop virtual keys before persist (idempotent). */
export function stripVirtualAttributesFromInstance(
  entity: Entity,
  instance: EntityInstance,
): EntityInstance;
```

Query/SQL/report layers call this API; they are not a second implementation of evaluation.

---

## Test execution conventions

| Purpose | Command |
|---|---|
| Slice 0 phase0 | `RUN_TEST=virtualAttributes.82.phase0 npm run testByFile -w miroir-core -- virtualAttributes.82.phase0` |
| MiroirTest `virtualAttributes` (unit) | `npm run testMiroir -w miroir-core -- --suites virtualAttributes --mode unit` |
| Existing library queries (lazy non-regression) | `npm run testMiroir -w miroir-core -- --suites queries_library --mode unit` |
| Postgres SqlGenerator / mapping (package vitest; `miroir-store-postgres` has **no `testByFile` script**) | `npm run vitest -w miroir-store-postgres -- 82-virtual-attributes` |
| View integ | `npm run testByFile -w miroir-standalone-app -- 82-virtual-attributes` |
| Schema rebuild (Slices 1–2) | `npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core` |
| Library modelValidation (Slice 2 Book asset) | `npm run testByFile -w miroir-test-app_deployment-library -- tests/modelValidation.unit.test.ts` |
| Type check | `npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json` |
| Full safety net (Slice 8) | `npm run nonreg` |

---

## Slice 0 — Characterize current contracts

**Status:** ⬜ pending

### Goal

Lock behaviour later slices must not break: Jzod tags have no `virtualAttribute`; a full Book extractor returns **stored** fields only; SQL extractors interpolate `filter.attributeName` as a **column**; Sequelize maps every `mlSchema` key.

**Layers cut:** tests only (characterization).

### 0.1 RED → GREEN — characterization (passes on arrival)

**Test:** `packages/miroir-core/tests/2_domain/issues/82-virtual-attributes/virtualAttributes.82.phase0.unit.test.ts`

Justified vitest: locks **current** generated Jzod tag keys and Sequelize mapping before the schema exists; not yet an ML-reachable suite.

Behavior asserted (independent literals / real assets):

- `jzodBaseObject.tag.value` keys (from generated or bootstrap JSON) do **not** include `virtualAttribute`.
- `listVirtualAttributeNames` is **not** imported yet — instead assert Library Book `mlSchema.definition` keys are exactly `name`, `year`, `author`, `publisher` (no `citation`).
- Import `fromMiroirPresentModelToSequelizeEntityDefinition` from `miroir-store-postgres` **or** duplicate the “every definition key becomes a column” fact by asserting `Object.keys(entity.mlSchema.definition)` would be the column set (if the postgres helper cannot be imported from miroir-core, put the Sequelize assertion in the postgres issue-directory file created empty in this slice as `it.todo` **or** a passing lock next to existing `utils` tests — prefer a small postgres file `virtualAttributes.82.phase0.unit.test.ts` that calls `fromMiroirPresentModelToSequelizeEntityDefinition` on Book and expects the resolved column set: `uuid`, `parentName`, `parentUuid`, `parentDefinitionVersionUuid`, `conceptLevel` (the `entityDefinitionRoot` extend, flattened via `entityMLSchema` inside `resolveMlSchemaForSequelize`) plus `name`, `year`, `author`, `publisher`).

**Also run** `queries_library` unit: a PK Book fetch equals the stored JSON (no extra keys). That file is the lazy non-regression baseline.

### Validation

```bash
RUN_TEST=virtualAttributes.82.phase0 npm run testByFile -w miroir-core -- virtualAttributes.82.phase0
npm run testMiroir -w miroir-core -- --suites queries_library --mode unit
```

### Realization

<Appended on completion.>

---

## Slice 1 — Schema: `virtualAttribute` on the Jzod tag

**Status:** ⬜ pending

### Goal

A designer can put `tag.value.virtualAttribute` on an Entity attribute and the meta-schema accepts it (generated TS/Zod include the field).

**Layers cut:** Jzod bootstrap JSON → `devBuild` generated types.

### 1.1 RED

**Test:** extend phase0 (or a Slice 1 `functionCallTest` once the suite exists) to expect `virtualAttribute` among tag.value keys **after** GREEN. Until then: a vitest in the issue directory that parses `1e8dab4b-….json` and asserts `tag.value.definition` has `virtualAttribute` — this fails on arrival.

Shape to lock (must match `initializeTo.transformer` editor pattern):

- `virtualAttribute` optional.
- Typed as transformer: `any` + `ifThenElseMMLS.mmlsReference` → `fe9b7d99-…` / `coreTransformerForBuildPlusRuntime` (same as `initializeTo.transformer`).

### 1.2 GREEN

- Edit [`1e8dab4b-65a3-4686-922e-ce89a2d62aa9.json`](../../../packages/miroir-test-app_deployment-miroir/assets/miroir_data/5e81e1b9-38be-487c-b3e5-53796c57fccf/1e8dab4b-65a3-4686-922e-ce89a2d62aa9.json) `jzodBaseObject.tag.value`.
- `npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core`.
- Flip the Slice 1 assertion to GREEN.

### 1.3 Refactor checkpoint

- Keep the tag next to `initializeTo`; do not invent a second transformer encoding.
- No evaluator yet.

### Validation

```bash
npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
RUN_TEST=virtualAttributes.82.phase0 npm run testByFile -w miroir-core -- virtualAttributes.82.phase0
```

(Replace phase0 “absent key” with “present key” in the same file or a successor assertion in Realization.)

### Realization

<Appended on completion.>

---

## Slice 2 — Tracer: lazy instance-only evaluation

**Status:** ⬜ pending

### Goal

Given an Entity attribute marked virtual and an instance that has **only stored fields**, `evaluateVirtualAttributesOnInstance` returns the computed value **iff** that name is in `neededNames`. Unrequested names are not present on the result. No other entity is read.

**Layers cut:** Book `mlSchema` asset → `VirtualAttributes.ts` → MiroirTest `functionCallTest` + registry whitelist.

### 2.1 RED

**Test:** MiroirTest suite `virtualAttributes` (new JSON `c4dffd69-…`), nested suite `evaluate`, `functionCallTest`s with `functionRef: { module: "miroir-core/2_domain/VirtualAttributes", export: "evaluateVirtualAttributesOnInstance" }`, `environmentRef: "defaultMiroirModelEnvironment"` and `environmentArgumentIndex: 3`.

**Argument mechanics:** `functionCallTest` arguments are JSON literals only — `fixtureRef` only injects a single fixture value (`resolveFixtureProperty` looks up one top-level key) and cannot drill into the library domain state for one Entity/instance. Pass the Book Entity row and the Rear Window instance **inline, copied verbatim** from `packages/miroir-test-app_deployment-library/assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/e8ba151b-d68e-4cc3-9a83-3459d309ccf5.json` and `assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/c97be567-bd70-449f-843e-cd1d64ac1ddd.json`. Arg order maps `(entity, instance, neededNames)`; `prepareFunctionCallArguments` splices the environment at `environmentArgumentIndex` (3 → `modelEnvironment`). Prefer `assertions` with `resultAccessPath` over whole-object equality where identity fields would make the expected value brittle:

1. `citation requested` — arguments: Book Entity inline, Rear Window instance inline, `["citation"]`. Assertions: `citation` = `"Rear Window (1942)"` (a literal, not recomputed), `name` still = `"Rear Window"`, `year` still = `1942`.
2. `citation not requested` — `neededNames: []`. Expected: whole result equals the imported instance JSON — **no** `citation` key, stored fields unchanged.
3. `unknown needed name ignored` — `neededNames: ["notAField"]` does not throw; no extra keys (same whole-object equality).

RED: suite JSON + `FunctionCallTestRegistry` whitelist entry added; `evaluateVirtualAttributesOnInstance` missing / failing.

**Applicative:** add `citation` to Book `mlSchema` + `viewAttributes` (after `year`) with the mustache above, `display.editable/modifiable: false`, `optional: true`. Instances on disk **must not** gain `citation` (D4 / D5).

### 2.2 GREEN

- Implement `VirtualAttributes.ts` (API above). Evaluation: `transformer_extended_apply_wrapper` at `"runtime"` with `contextResults` = stored fields of the instance (copy without existing virtual keys). `applyTo` = instance.
- Whitelist the module in `packages/miroir-core/src/5_tests/FunctionCallTestRegistry.ts` under `"miroir-core/2_domain/VirtualAttributes"`.
- Export the suite from `packages/miroir-test-app_deployment-miroir/index.ts`: `export { default as miroirTest_virtualAttributes } from "./assets/miroir_data/a311f363-e238-4203-bdfc-29e8c160c26b/c4dffd69-2594-482c-b680-295c30eafe30.json" with { type: "json" };`.
- Add `"virtualAttributes"` to `MIROIR_TEST_SUITE_REGISTRY_NAMES` in `packages/miroir-core/src/5_tests/miroirCoreTestSuiteRegistry.ts` (this also enrolls the suite in the nonreg `unit-miroir-core` sweep — see Slice 8.1).
- Schema rebuild after Book JSON change; `modelValidation` on library.

### 2.3 Refactor checkpoint

- One module; no query-layer copy of mustache.
- Identity fields (`uuid`, `parentUuid`, …) never treated as virtual even if someone tags them (guard + test if cheap).

### Validation

```bash
npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core
npm run testByFile -w miroir-test-app_deployment-library -- tests/modelValidation.unit.test.ts
npm run testMiroir -w miroir-core -- --suites virtualAttributes --mode unit
npm run testMiroir -w miroir-core -- --suites queries_library --mode unit
```

### Realization

<Appended on completion.>

---

## Slice 3 — In-memory Query requires the name

**Status:** ⬜ pending

### Goal

A query author can project, filter, and sort on `citation` like a stored attribute. A Book list extractor **without** those needs still returns raw instances (no `citation` key) — laziness.

**Layers cut:** extractor/query runners → `requiredVirtualAttributeNames` + overlay.

### 3.1 RED

**Test:** same MiroirTest suite, nested `query`, `queryTest` + `fixtureRef: "libraryDomainState"` + `runner: "runQueryFromDomainState"` (copy pattern from `queries_library`):

1. **Project** — `extractorInstancesByEntity` Book with `attributes` including `citation` (and whatever stored fields the assertion needs). Rear Window’s object has `citation: "Rear Window (1942)"`.
2. **Lazy default** — same extractor **without** `attributes` / filter / orderBy on `citation`. Rear Window object has **no** `citation` (literal key absence).
3. **Filter** — `filter: { attributeName: "citation", value: "Rear Window (1942)" }` (or a substring the existing matcher accepts — `instanceMatchesFilter` uses case-insensitive regex on strings). Result set includes Rear Window; a book whose citation would not match is absent. Overlay on returned rows: only if also projected — prefer asserting membership by `uuid` so lazy filter-without-project stays valid.
4. **orderBy** — `orderBy: { attributeName: "citation" }` orders by the computed string.

### 3.2 GREEN

- When running `extractorInstancesByEntity` / `extractorByPrimaryKey`, compute `requiredVirtualAttributeNames` from that extractor (and later from the boxed query). Overlay on **returned** instances only for projected/required names.
- Filter/orderBy: evaluate the virtual value for comparison even if not projected (still no extra entities).
- Wire both DomainState and ReduxDeploymentsState query paths that share `ExtractorByEntityReturningObjectListTools` / PK fetch — follow the existing extractor implementation, do not fork.

### 3.3 Refactor checkpoint

- Analysis §3.4: `instanceMatchesFilter` stays a pure stored-field matcher **or** receives already-evaluated instances — pick one and do not evaluate inside the matcher and again on overlay.
- `queries_library` must stay green (lazy default).

### Validation

```bash
npm run testMiroir -w miroir-core -- --suites virtualAttributes --mode unit
npm run testMiroir -w miroir-core -- --suites queries_library --mode unit
```

### Realization

<Appended on completion.>

---

## Slice 4 — Never persist

**Status:** ⬜ pending

### Goal

Virtual attributes are not SQL columns and never written. A create/update payload that still contains `citation` is stored without it.

**Layers cut:** postgres mapping + instance write path + `stripVirtualAttributesFromInstance`.

### 4.1 RED

**Tests:**

1. `functionCallTest` `strip drops citation` — Book entity + `{ ...rearWindow, citation: "should not persist" }` → result has no `citation`; stored fields match the imported instance.
2. Vitest (justified: Sequelize mapping is store-package internals, not ML): `fromMiroirPresentModelToSequelizeEntityDefinition(bookEntity)` keys **exclude** `citation`.
3. If an existing DomainController createInstance MiroirTest/integ is easy to extend: create Book with extra `citation` and fetch raw — field absent. Otherwise `functionCallTest` + mapping test are the slice proof; note the write-path call site in GREEN.

### 4.2 GREEN

- Skip `isVirtualAttribute` keys in `fromMiroirPresentModelToSequelizeEntityDefinition`.
- Skip them in `applyMlSchemaColumnChanges` **addColumns** (do not add a physical column for a virtual attribute).
- Call `stripVirtualAttributesFromInstance` **once**, on the `DomainController` instance-action write path (`createInstance` / `updateInstance` via `handleAction`). That is the single choke point used by every store (filesystem, IndexedDB, postgres, mongodb, bundled) **and** by the details-editor / Formik submit flow (analysis D4), so one call covers all write paths — do not duplicate per store.

### 4.3 Refactor checkpoint

- Dummy optional fields that are **not** tagged virtual (Designer `userStory`) still become columns — out of scope (non-goal: migrating that workaround).

### Validation

```bash
npm run testMiroir -w miroir-core -- --suites virtualAttributes --mode unit
npm run vitest -w miroir-store-postgres -- 82-virtual-attributes
npx tsc --noEmit --skipLibCheck -p packages/miroir-store-postgres/tsconfig.json
```

### Realization

<Appended on completion.>

---

## Slice 5 — SQL: expression on A only when required

**Status:** ⬜ pending

### Goal

A `runAsSql` query that **requires** `citation` compiles an expression over **Book’s table only** (no JOIN / extra FROM). A SQL query that does not require it does not mention `citation`. A required non-compilable transformer fails `QueryNotExecutable`.

**Layers cut:** `SqlGenerator.ts` extractor SELECT/WHERE/ORDER BY.

### 5.1 RED

**Test:** vitest in `packages/miroir-store-postgres/test/issues/82-virtual-attributes/` (justified: asserts **SQL text**, which MiroirTest `queryTest` does not capture in unit mode).

Behavior asserted (string literals):

1. `extractorInstancesByEntity` Book **without** citation need: generated SQL has no `citation` identifier in SELECT/WHERE (same shape as today’s Book extractor, allowing schema/table quoting).
2. With `attributes` including `citation` **or** `filter.attributeName: "citation"`: SQL `FROM` has a **single** table (Book / entity table name); **no** second entity table / JOIN. `citation` appears as an expression (mustache compilation / column refs to `"name"` and `"year"`), not as a stored column.
3. Filter on citation uses that expression in `WHERE`, not `WHERE "citation" ILIKE`.

Optional GREEN follow-up in the same slice: one standalone-app / postgres integ `queryTest` or DomainController query with `runAsSql: true` projecting citation for Rear Window — skip if the unit SQL strings are the agreed seam; document in Realization.

### 5.2 GREEN

- When the extractor’s required set includes a virtual name, compile `virtualAttribute` via `sqlStringForRuntimeTransformer` with row context = that table’s columns.
- Never add FK target tables to the FROM for virtual attributes (D3 / D6).

### 5.3 Refactor checkpoint

- Share “required names” with Slice 3 (do not reimplement need collection in SQL).
- Analysis §3.4 column interpolation is the misalignment this slice removes **for virtual names only**.

### Validation

```bash
npm run vitest -w miroir-store-postgres -- 82-virtual-attributes
npm run testMiroir -w miroir-core -- --suites virtualAttributes --mode unit
```

### Realization

<Appended on completion.>

---

## Slice 6 — List and details display

**Status:** ⬜ pending

### Goal

A report viewer sees `citation` on Book **list** and **details** without any Report `runtimeTransformers`. The report engine requires `citation` because it is in `viewAttributes` (list) / shown on the details schema (details).

**Layers cut:** report query construction → overlay (already Slice 3) → `ReportSectionListDisplay` / `ReportSectionEntityInstance`.

### 6.1 RED

**Test:** `packages/miroir-standalone-app/tests/4_view/issues/82-virtual-attributes/virtualAttributes.82.phase6.integ.test.tsx`

Justified vitest+RTL: report **rendering** is not a MiroirTest type. Use the existing Library report integ rig pattern (`getWrapperLoadingLocalCache` / TransformerEditor-style preload).

Behavior asserted:

1. BookList grid shows a Citation column; Rear Window’s cell text includes `Rear Window (1942)`.
2. BookDetails (instance Rear Window) shows a read-only Citation field with the same literal.
3. BookList report JSON still has **no** `runtimeTransformers` (asset assertion) — proof the value is not a report-local RT.

### 6.2 GREEN

- When building/running the report query, add virtual names that appear in the section’s `viewAttributes` (list) or in the details entity mlSchema (instance section) to `referencedAttributeNames` / extractor projection.
- Do not add unused virtual names from the Entity that are absent from `viewAttributes` / hidden details fields.

### 6.3 Refactor checkpoint

- Reuse Slice 3 overlay; UI must not call `transformer_extended_apply` itself.
- `display.editable === false` already makes details read-only.

### Validation

```bash
npm run testByFile -w miroir-standalone-app -- 82-virtual-attributes
npm run testMiroir -w miroir-core -- --suites virtualAttributes --mode unit
```

### Realization

<Appended on completion.>

---

## Slice 7 — Other transformers in the same query

**Status:** ⬜ pending

### Goal

A transformer author can `accessDynamicPath` (or equivalent) a virtual attribute on instances produced by an extractor that **required** that name.

**Layers cut:** boxed query `runtimeTransformers` after extractors.

### 7.1 RED

**Test:** `queryTest` in suite `virtualAttributes` / `query`:

- Extractor Book with `attributes` including `citation` (or filter that requires it).
- `runtimeTransformers.citations` = `mapList` / pick `citation` from each row (keep it small).
- Assertion: context entry `citations` contains the literal `"Rear Window (1942)"`.

Negative (same slice or a second `it`): extractor **without** requiring `citation`; RT that reads `citation` sees `undefined` / failure — documents laziness rather than auto-hydrating for transformers.

### 7.2 GREEN

- Collect virtual names referenced by `runtimeTransformers` of the boxed query into the extractor required set **before** extractors run (static walk of `accessDynamicPath` / object keys as needed — start with explicit `attributes` on the extractor in the RED test so the walk can be a thin follow-up if timeboxed).
- Prefer: RED test sets `attributes: ["citation", …]` so GREEN is “RT sees overlay” without a full AST walk; add a second test that **omits** `attributes` but the RT path is `…citation` and the collector adds it — that is the Actions/transformers goal.

### 7.3 Refactor checkpoint

- Actions that consume this query’s result need no extra code if they use boxed queries (Goal 4). Do not add a separate Action runner unless a failing actionTest appears.

### Validation

```bash
npm run testMiroir -w miroir-core -- --suites virtualAttributes --mode unit
```

### Realization

<Appended on completion.>

---

## Slice 8 — Nonreg, docs, cleanup, AC

**Status:** ⬜ pending

### 8.1 Nonreg

- **No new manifest step.** The `unit-miroir-core` step runs `testMiroir -w miroir-core -- --mode unit` with no `--suites`, and `parseMiroirTestCliConfig` selects **all** registered suites when none is specified (“When no suites are specified … all registered suites are selected”). Adding `virtualAttributes` to `MIROIR_TEST_SUITE_REGISTRY_NAMES` in Slice 2 therefore enrolls it automatically; a dedicated `--suites virtualAttributes` step would duplicate coverage. (Note: `unit-transformerResultSchema` is a `testByFile` step, not a `testMiroir` step — it was not the right pattern to copy.)
- Confirm `queries_library` remains in `MIROIR_TEST_SUITE_REGISTRY_NAMES` (core sweep).

### 8.2 Docs

- `analysis.md` status → implemented when all prior slices ✅.
- Short note on Entity / transformers reference: virtual attributes are instance-local, lazy, never JOIN.
- `docs/contributing/testing.md`: suite key `virtualAttributes` if the suite list is documented there.

### 8.3 Issue-directory cleanup

- Move still-valuable phase0/phase6 assertions into feature-named files (`virtualAttributes.unit.test.ts` / `virtualAttributes.integ.test.tsx`) **or** keep only MiroirTest + SqlGenerator feature tests; delete `tests/**/issues/82-virtual-attributes/` per #238.

### 8.4 Tracer bullet (narrative)

1. Open Library BookList — Citation column shows `Rear Window (1942)` (and peers) with no report transformer.
2. Open Rear Window details — same read-only field.
3. Run a boxed query with `filter.attributeName: "citation"` — in-memory and `runAsSql` (if available) return that book without joining Author/Publisher.
4. Persist a Book — stored JSON/SQL row has no `citation` column/key.

Automated equivalent: `virtualAttributes` MiroirTest + Slice 5 SQL vitest + Slice 6 integ.

### AC checklist (#82)

| Criterion | Proven by | Status |
|---|---|---|
| Attach a transformer as a virtual attribute on an Entity | Slice 1 schema + Slice 2 Book `citation` | ⬜ |
| Use it like any other attribute in Queries (in-memory) | Slice 3 queryTests | ⬜ |
| If runnable as SQL, Queries use it without extra tables | Slice 5 | ⬜ |
| List extra column without per-report RT | Slice 6 BookList | ⬜ |
| Details report shows it | Slice 6 BookDetails | ⬜ |
| Actions / other transformers | Slice 7 (query RT); Actions consume that result | ⬜ |
| Not stored | Slice 4 | ⬜ |
| Lazy: not computed unless required | Slice 2 `not requested` + Slice 3 lazy default + `queries_library` | ⬜ |

### Validation

```bash
npm run testMiroir -w miroir-core -- --suites virtualAttributes --mode unit
npm run testMiroir -w miroir-core -- --suites queries_library --mode unit
npm run vitest -w miroir-store-postgres -- 82-virtual-attributes
npm run testByFile -w miroir-standalone-app -- 82-virtual-attributes
npm run nonreg
```

### Realization

<Appended on completion.>
