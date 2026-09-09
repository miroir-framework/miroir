# Issue #265 — TDD Implementation Plan

> Vertical TDD slices (RED → GREEN each), integration-first per `docs/contributing/testing.md`:
> tests exercise the real transformer machinery (in-memory `transformer_extended_apply` and the
> Postgres SQL path via the `emulatedServer-sql` profile), through the applicative interface —
> MiroirTest `transformerTest` leaves in the `miroirCoreTransformers` suite. No mocks.
> The tracer bullet (Slice 1) proves an unknown `transformerType: "pivot"` becomes a working
> in-memory existence-matrix pivot, end to end through definition JSON → generated types → handler.
>
> **Execution model:** human-in-the-loop. No slice contains a commit step — commits happen
> only when the user explicitly asks. Each slice ends with its Validation commands; on
> success its Realization summary is appended and its Status flips to ✅ DONE.
>
> **Slice granularity note (review R4):** parameter-surface behaviors are grouped into thematic
> slices (cell values, columns, duplicate policy, …) rather than one slice per MiroirTest leaf.
> Each thematic slice still delivers one user-visible capability with its own RED → GREEN and
> Validation; the strictest one-leaf-per-slice reading is traded for plan legibility.
> **Confirmation note:** the user delegated slice-order/granularity confirmation to the
> adversarial-review loop (`review-analysis.md`, `review-plan.md`) instead of a manual gate.

## Related links

- Issue: https://github.com/miroir-framework/miroir/issues/265
- Analysis: [`./analysis.md`](./analysis.md) (v3 — post both adversarial reviews)
- Reviews: [`./review-analysis.md`](./review-analysis.md) (R1–R17 applied) · [`./review-plan.md`](./review-plan.md) (R1–R15 applied)
- Working branch: `cursor/265-pivot-unpivot-transformers`
- Suite file: [`33f60ac8-6511-43b1-b153-6b86e3177532.json`](../../../packages/miroir-test-app_deployment-miroir/assets/miroir_data/a311f363-e238-4203-bdfc-29e8c160c26b/33f60ac8-6511-43b1-b153-6b86e3177532.json) (`miroirCoreTransformers`)

**Resume note:** plan reviewed (Composer Fast) and fixed — no slices started.

---

## Scope

- New core transformers `pivot` and `unpivot`, `libraryImplementation` with hand-written in-memory **and** SQL handlers (analysis D7).
- MiroirTest coverage of the full parameter surface, incl. the rights-matrix acceptance scenario on generic fixtures (D10).
- Inventory-test (`CORE`/`HANDLED`) and `docs/reference/transformers.md` updates.

This plan does **not** build the checkbox-grid UI or write-back (rights-UI follow-up after #262/#264), per-capability matrices (after #71), composite row keys, per-group nested-transformer cell values, `tablefunc`/`crosstab`, static column-aware result-schema inference, or validation on real `MiroirRight` assets (analysis Non-goals).

---

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Characterize baseline (suites green, census, Postgres reachable) | ⬜ | pre-flight command log |
| 1 | Tracer: in-memory `pivot`, existence mode, data-derived columns | ⬜ | pivot existence leaf green (unit) |
| 2 | `pivot` cell values + fill (`valueAttribute`, `fillValue`) | ⬜ | value/fill leaves green (unit) |
| 3 | `pivot` explicit columns (literal + context reference) | ⬜ | columns leaves green (unit) |
| 4 | `pivot` duplicate policy (`onDuplicates`, existence-mode ban) | ⬜ | duplicates leaves green (unit) |
| 5 | `unpivot` basic melt (idColumns, whitelist, rename) | ⬜ | melt leaves green (unit) |
| 6 | `unpivot` edge semantics (nulls, collision, per-row melt) | ⬜ | edge leaves green (unit) |
| 7 | `pivot` SQL handler | ⬜ | pivot leaves green (`emulatedServer-sql`) |
| 8 | `unpivot` SQL handler | ⬜ | unpivot leaves green (`emulatedServer-sql`) |
| 9 | Nonreg, docs, tracer narrative, AC | ⬜ | `npm run nonreg` green |

---

## Locked implementation defaults

Copied from the analysis decision record; binding. Deviations go into the slice's Realization.

| Decision | Choice |
|---|---|
| D1 Output shape | Relational both ways; unpivot emits `{...idColumns, [nameInto], [valueInto]}` (defaults `"column"`/`"value"`) |
| D2 Cells | `valueAttribute` absent ⇒ existence boolean ("at least one row"); missing pairs ⇒ `fillValue` (default `false` existence / `null`) |
| D3 Columns | Resolve to `string[]` (scalar JSON array); literal or transformer (SQL mode: `returnValue`/`getFromContext`/SQL-registered, scalar array); omitted ⇒ data-derived from pivot input; pluck object lists first (`mapList`+`accessDynamicPath`) |
| D4 Postgres | Two-level plan: unnest `WITH ORDINALITY` → cell reduction (`DISTINCT ON` first/last, `GROUP BY`+agg otherwise) → distinct cols/rows (rows carry `MIN(ord) AS min_ord`) → `CROSS JOIN`+`LEFT JOIN`+`COALESCE($N::jsonb)` fill → `jsonb_object_agg` → `jsonb_agg(pivot_row ORDER BY min_ord ASC)` (deterministic first-appearance row order, matching in-memory); returned as `type: "json_array"` with `extraWith` CTEs; unpivot via `jsonb_array_elements` + `LATERAL jsonb_each`; no `tablefunc` |
| D5 Duplicates | `onDuplicates` default `"first"`; `last` deterministic via ordinality; existence mode allows only `first`/`last` (aggregates ⇒ handler error, both sides) |
| D6 Unpivot rules | Absent keys skipped, explicit `null`s kept; `nameInto`/`valueInto` ∈ `idColumns` ⇒ error; `columns` omitted ⇒ per-row melt of own keys minus `idColumns`; JSON-value cells only for SQL parity; dense pivot ∘ unpivot is not a round-trip |
| D7 Structure | `libraryImplementation`; `handleTransformer_pivot`/`_unpivot`; `sqlStringForPivotTransformer`/`sqlStringForUnpivotTransformer` |
| D8 Result schema | Static `array` of `record<any>` on the definition JSONs; no new `case` in `Transformer_ResultSchema.ts`; inventory `CORE`+`HANDLED` extended |
| D9 Scope | One issue, both transformers; no UI |
| D10 Fixtures | Generic rights-shaped fixtures in `miroirCoreTransformers`; SQL proof requires `--profile emulatedServer-sql` |

---

## Allocated UUIDs / keys

| Artefact | Value |
|---|---|
| `TransformerDefinition` `pivot` | uuid `aa9897e5-747e-49df-9048-02bc94285b77` — file `packages/miroir-test-app_deployment-miroir/assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/aa9897e5-747e-49df-9048-02bc94285b77.json` |
| `TransformerDefinition` `unpivot` | uuid `e096343e-5287-4863-99b5-bd19357b647f` — same folder |
| MiroirTest suite | existing `miroirCoreTransformers` — new sub-suites `pivot` / `unpivot` under `runtimeTransformerTests` in `33f60ac8-…json` |
| Handler names | `handleTransformer_pivot`, `handleTransformer_unpivot`, `sqlStringForPivotTransformer`, `sqlStringForUnpivotTransformer` |
| Generated type exports | `CoreTransformerForBuildPlusRuntime_pivot` / `_unpivot` (`generate-ts-types.ts` union + `miroir-core/src/index.ts` re-export beside `CoreTransformerForBuildPlusRuntime_sortList`, `index.ts:111`) |
| Nonreg | covered by existing `unit-miroir-core` (`scripts/nonreg-manifest.json:23-36`) + `integ-transformer-miroirCoreTransformers` (`:354-371`, profile defaults to `emulatedServer-sql`) — **no manifest edit** |

---

## Test execution conventions

| Purpose | Command |
|---|---|
| `miroirCoreTransformers` (MiroirTest unit) | `npm run testMiroir -w miroir-core -- --suites miroirCoreTransformers --mode unit` |
| Same, vitest gate | `RUN_TEST=transformers.unit.test npm run testByFile -w miroir-core -- 'transformers.unit'` |
| `miroirCoreTransformers` (MiroirTest SQL integration) | `npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-sql --suites miroirCoreTransformers --mode integration` |
| Inventory test | `RUN_TEST=transformerResultSchema.inventory npm run testByFile -w miroir-core -- 'transformerResultSchema.inventory'` |
| Deployment model validation (after any asset JSON change) | `npm run testByFile -w miroir-test-app_deployment-miroir -- tests/modelValidation.unit.test.ts` |
| Deployment assets rebuild (after any asset JSON change) | `npm run build -w miroir-test-app_deployment-miroir` |
| Schema/type regen (after definition/registration change) | `npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core` |
| Postgres store rebuild (after `SqlGenerator.ts` change) | `npm run build -w miroir-store-postgres` |
| Type check | `npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json` (and `-p packages/miroir-store-postgres/tsconfig.json` from Slice 7) |
| Full safety net | `npm run nonreg` |

Selective runs during development use `MIROIR_TEST_FILTER` (parsed by `parseMiroirTestCliConfig`, walked by `miroirTestSuiteWalk.ts:91-108`), e.g.:

```bash
MIROIR_TEST_FILTER='{"testList":{"miroirCoreTransformers":{"runtimeTransformerTests":{"pivot":["pivot existence booleans with data-derived columns"]}}}}' npm run testMiroir -w miroir-core -- --suites miroirCoreTransformers --mode unit
```

**Dual-mode expectation rules (verified against `MiroirTransformerTestTools.ts`):**

- Numeric/boolean `expectedValue` literals match SQL JSON results as-is (aggregate precedent, `33f60ac8-…json:4753-4756`) — single `expectedValue` suffices.
- **Nulls:** unit mode normalizes expected values with `unNullify` + `removeUndefinedProperties` (`MiroirTransformerTestTools.ts:222-223, 251-252`) while actual results keep JSON `null`; SQL integration skips that normalization (`:474-477`). Any leaf asserting explicit `null` therefore splits expectations: `unitTestExpectedValue` (null keys omitted) + `integrationTestExpectedValue` (JSON `null` present).
- **Failures:** error leaves use `retainAttributes: ["queryFailure"]` + `unitTestExpectedValue: { queryFailure: "FailedTransformer" }` (precedent `33f60ac8-…json:3789-3798`); `integrationTestExpectedValue` for SQL mode is set during Slice 7/8 once the SQL failure shape is observed (compile-time `QueryNotExecutable` vs runtime `FailedTransformer`).

Postgres availability for the SQL profile is pre-verified: `localhost:5432` reachable (2026-09-09), profile `emulatedServer-sql` → `postgres://postgres:postgres@localhost:5432/postgres`.

---

## Slice 0 — Characterize baseline

**Status:** ⬜ pending

### Goal

Lock the current contracts so registry edits in later slices have a safety net: unit suite green, inventory test green, SQL-profile integration green, 45-definition census recorded.

### 0.1 RED → GREEN — baseline lock

**Test:** no new test — characterization only (pure-addition feature; existing suites are the contract).

Behavior asserted:
- `transformers.unit` suite passes as-is (baseline run 2026-09-09: **243 passed, 1 skipped**).
- `transformerResultSchema.inventory.unit.test.ts` passes unmodified.
- `miroirCoreTransformers` SQL integration passes with `--profile emulatedServer-sql` before any change.
- Census: 45 `TransformerDefinition` instances (33 real SQL / 6 `N/A` / 2 `TODO` / 2 missing / 2 composite).

### Validation

```bash
RUN_TEST=transformers.unit.test npm run testByFile -w miroir-core -- 'transformers.unit'
RUN_TEST=transformerResultSchema.inventory npm run testByFile -w miroir-core -- 'transformerResultSchema.inventory'
npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-sql --suites miroirCoreTransformers --mode integration
```

### Realization

<Appended on completion.>

---

## Slice 1 — Tracer bullet: in-memory `pivot`, existence mode, data-derived columns

**Status:** ⬜ pending

### Goal

A query author can write `transformerType: "pivot"` and get an existence-boolean matrix from a list of rows, in memory. The full wiring chain (definition JSON → deployment export → `miroirCoreTransformers` → generated types → in-memory handler → inventory sets) is proven once; later slices only deepen.

**Layers cut:** JSON asset → deployment package export → Jzod/generated types (`generate-ts-types.ts` union + `devBuild`) → domain handler + registries → inventory test.

### 1.1 RED

**Test:** MiroirTest `transformerTest` leaves, new sub-suite `pivot` under `runtimeTransformerTests` in `33f60ac8-…json` (leaf shape per existing entries; fixtures via `transformerRuntimeContext`, input via `applyTo: { transformerType: "getFromContext", interpolation: "runtime", referenceName: "rights" }`).

Leaf "pivot existence booleans with data-derived columns":
- Fixture `rights: [{user:"alice",dep:"dep1"},{user:"alice",dep:"dep2"},{user:"bob",dep:"dep1"}]`; `rowKeyAttribute: "user"`, `columnKeyAttribute: "dep"`.
- Expected: `[{user:"alice",dep1:true,dep2:true},{user:"bob",dep1:true,dep2:false}]` — data-derived columns; absent pair `bob`×`dep2` ⇒ default `fillValue` `false`; row order = first-appearance of row keys (Slice 7 guarantees the same order in SQL via `ORDER BY min(ord)`; comparison is array-order-sensitive).

RED state: fails with unknown `transformerType` / missing definition.

### 1.2 GREEN

1. `aa9897e5-….json` TransformerDefinition (`pivot`), Jzod parameter schema per analysis "Interface contracts" (full parameter surface declared; only existence + data-derived columns + default fill implemented this slice), static result schema `array` of `record<any>`, `inMemoryImplementationFunctionName: "handleTransformer_pivot"`, `sqlImplementationFunctionName: "sqlStringForPivotTransformer"`.
2. Export from `miroir-test-app_deployment-miroir/index.ts` (+ `index.d.ts`); `npm run build -w miroir-test-app_deployment-miroir`.
3. `Transformers.ts`: import, `export const transformer_pivot`, add to `miroirCoreTransformers`.
4. `generate-ts-types.ts`: add `transformerForBuildPlusRuntime_pivot` to `headerForZodImports` (`:188-235`) and the `z.union` (`:259-295`); `npm run devBuild -w miroir-core`; re-export `CoreTransformerForBuildPlusRuntime_pivot` from `miroir-core/src/index.ts` (pattern at `index.ts:111`).
5. `TransformersForRuntime.ts`: `handleTransformer_pivot` (existence mode + data-derived columns + default fill; row order = first-appearance); register in `inMemoryTransformerImplementations` and `applicationTransformerDefinitions`.
6. Inventory test: add `"pivot"` to `CORE` and `HANDLED`.

### 1.3 Refactor checkpoint

- Keep the handler's column-resolution and cell-reduction as local functions shaped like the SQL CTE stages (D4), so Slices 2–4 and 7 extend rather than rewrite.

### Validation

```bash
npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core
npm run testByFile -w miroir-test-app_deployment-miroir -- tests/modelValidation.unit.test.ts
RUN_TEST=transformers.unit.test npm run testByFile -w miroir-core -- 'transformers.unit'
RUN_TEST=transformerResultSchema.inventory npm run testByFile -w miroir-core -- 'transformerResultSchema.inventory'
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
```

### Realization

<Appended on completion.>

---

## Slice 2 — `pivot` cell values + fill

**Status:** ⬜ pending

### Goal

A query author can pivot plucked attribute values (not just existence) and control the fill for missing pairs.

**Layers cut:** domain handler + MiroirTest leaves (parameters already declared in Slice 1).

### 2.1 RED → GREEN cycles

**Test:** same `pivot` sub-suite; one leaf per behavior:

1. **valueAttribute pluck** — fixture rows with a `capability` attribute; `valueAttribute: "capability"` ⇒ cells hold the capability string; missing pairs ⇒ `fillValue` default `null` (dual-mode null rule: `unitTestExpectedValue` omits the null-valued keys, `integrationTestExpectedValue` keeps JSON `null` — see conventions).
2. **fillValue override** — existence mode with `fillValue: null` ⇒ missing pairs `null`, present pairs `true` (same split-expectation rule).

### 2.2 Refactor checkpoint

- Existence mode delegates to the same reduction path as `valueAttribute` mode (existence ≡ constant-`true` value), not a parallel code path.

### Validation

```bash
npm run build -w miroir-test-app_deployment-miroir
npm run testByFile -w miroir-test-app_deployment-miroir -- tests/modelValidation.unit.test.ts
RUN_TEST=transformers.unit.test npm run testByFile -w miroir-core -- 'transformers.unit'
```

### Realization

<Appended on completion.>

---

## Slice 3 — `pivot` explicit columns

**Status:** ⬜ pending

### Goal

A query author can pin the column set explicitly — as a literal list or a context reference — including columns absent from the data (the rights-grid "all deployments" requirement, Goal 4).

### 3.1 RED → GREEN cycles

**Test:** same `pivot` sub-suite:

1. **columns literal** — `columns: ["dep1","dep2","dep3"]` ⇒ every row carries exactly those three columns with correct values (fill for missing), incl. `dep3` absent from data. (Presence + values asserted; object key order is not significant to the comparison.)
2. **columns from context** — `columns: { transformerType: "getFromContext", interpolation: "runtime", referenceName: "depList" }` with `transformerRuntimeContext.depList: ["dep2","dep1"]` ⇒ exactly those two columns with correct values.

### 3.2 Refactor checkpoint

- Column resolution (literal | context | data-derived) is one function shared by both fill and reduction paths.

### Validation

```bash
npm run build -w miroir-test-app_deployment-miroir
npm run testByFile -w miroir-test-app_deployment-miroir -- tests/modelValidation.unit.test.ts
RUN_TEST=transformers.unit.test npm run testByFile -w miroir-core -- 'transformers.unit'
```

### Realization

<Appended on completion.>

---

## Slice 4 — `pivot` duplicate policy

**Status:** ⬜ pending

### Goal

A query author gets deterministic duplicate handling: `first`/`last` by input order, numeric aggregates, and a loud error when aggregates are requested in existence mode (D5).

### 4.1 RED → GREEN cycles

**Test:** same `pivot` sub-suite:

1. **onDuplicates first/last** — duplicate `(user,dep)` rows with different `capability` values; `first` keeps the first, `last` the last (input order).
2. **onDuplicates count/sum/min/max** — numeric `valueAttribute`; aggregated cell values (single `expectedValue`; numeric literals match SQL JSON per conventions).
3. **existence-mode aggregate ban** — no `valueAttribute` + `onDuplicates: "count"` ⇒ failure leaf per the conventions template: `retainAttributes: ["queryFailure"]`, `unitTestExpectedValue: { queryFailure: "FailedTransformer" }`; `integrationTestExpectedValue` deferred to Slice 7 (SQL failure shape observed there).

### 4.2 Refactor checkpoint

- The reduction map (`onDuplicates` → reducer) is a single table reused by the SQL handler's stage-3 switch.

### Validation

```bash
npm run build -w miroir-test-app_deployment-miroir
npm run testByFile -w miroir-test-app_deployment-miroir -- tests/modelValidation.unit.test.ts
RUN_TEST=transformers.unit.test npm run testByFile -w miroir-core -- 'transformers.unit'
```

### Realization

<Appended on completion.>

---

## Slice 5 — `unpivot` basic melt

**Status:** ⬜ pending

### Goal

A query author can melt row objects into `{...idColumns, [nameInto], [valueInto]}` rows, in memory. Full wiring chain for `unpivot` (definition → export → types → handler → inventory) lands here, mirroring Slice 1.

**Layers cut:** JSON asset → deployment export → generated types → domain handler + registries → inventory test.

### 5.1 RED

**Test:** new sub-suite `unpivot` under `runtimeTransformerTests`; leaves:

1. **basic melt** — `[{user:"alice",dep1:true,dep2:false}]` with `idColumns: ["user"]` ⇒ `[{user:"alice",column:"dep1",value:true},{user:"alice",column:"dep2",value:false}]`.
2. **columns whitelist** — `columns: ["dep1"]` melts only `dep1`.
3. **nameInto/valueInto rename** — `nameInto: "deployment", valueInto: "granted"` ⇒ `{user:"alice",deployment:"dep1",granted:true}, …`.

RED state: unknown `transformerType`.

### 5.2 GREEN

1. `e096343e-….json` TransformerDefinition (`unpivot`) per analysis interface contracts; static result schema; both handler names.
2. Deployment export + rebuild; `Transformers.ts` registration; `generate-ts-types.ts` union; `devBuild`; `index.ts` re-export of `CoreTransformerForBuildPlusRuntime_unpivot`.
3. `handleTransformer_unpivot` (idColumns carry, whitelist, rename) + both registries.
4. Inventory test: add `"unpivot"` to `CORE` and `HANDLED`.

### 5.3 Refactor checkpoint

- `idColumns`/collision validation shaped as a helper mirrored by the SQL handler's key filter in Slice 8.

### Validation

```bash
npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core
npm run testByFile -w miroir-test-app_deployment-miroir -- tests/modelValidation.unit.test.ts
RUN_TEST=transformers.unit.test npm run testByFile -w miroir-core -- 'transformers.unit'
RUN_TEST=transformerResultSchema.inventory npm run testByFile -w miroir-core -- 'transformerResultSchema.inventory'
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
```

### Realization

<Appended on completion.>

---

## Slice 6 — `unpivot` edge semantics

**Status:** ⬜ pending

### Goal

The D6 edge rules hold in memory: explicit `null` cells survive, absent keys stay absent, collisions error loudly, heterogeneous rows melt per-row.

### 6.1 RED → GREEN cycles

**Test:** same `unpivot` sub-suite:

1. **null rules** — a row `{user:"bob",dep1:null}` (explicit `null`) emits `{user:"bob",column:"dep1",value:null}`; a missing key emits no row. Split expectations per the null rule (`unitTestExpectedValue` without the null entry / `integrationTestExpectedValue` with it — if the unit-mode normalization makes the kept-`null` row unassertable, the leaf documents SQL-only assertion in Realization).
2. **collision error** — `valueInto: "user"` ∈ `idColumns` ⇒ failure leaf (`retainAttributes: ["queryFailure"]`, `unitTestExpectedValue: { queryFailure: "FailedTransformer" }`; integration expectation deferred to Slice 8).
3. **per-row melt** — heterogeneous rows `[{user:"alice",dep1:true},{user:"bob",dep2:true}]` melt their own keys ⇒ 3 rows total, no `dep1` row for `bob`.

### 6.2 Refactor checkpoint

- Key-melt logic (own keys minus `idColumns`, whitelist when given) factored once, reused by Slice 8's SQL key filter.

### Validation

```bash
npm run build -w miroir-test-app_deployment-miroir
npm run testByFile -w miroir-test-app_deployment-miroir -- tests/modelValidation.unit.test.ts
RUN_TEST=transformers.unit.test npm run testByFile -w miroir-core -- 'transformers.unit'
```

### Realization

<Appended on completion.>

---

## Slice 7 — `pivot` SQL handler

**Status:** ⬜ pending

### Goal

The same `pivot` leaves pass with `runAsSql: true` — Postgres executes the pivot (Goal 3 for pivot).

**Layers cut:** `SqlGenerator.ts` handler + registries → SQL integration run.

### 7.1 RED

Run the `pivot` sub-suite via the SQL profile: leaves fail with `QueryNotExecutable` (no SQL handler registered yet).

### 7.2 GREEN

1. `sqlStringForPivotTransformer` in `SqlGenerator.ts`, implementing the D4 two-level plan **including deterministic row order**: `extraWith` CTEs (applyTo → unnest `WITH ORDINALITY` → cell reduction → distinct cols → distinct rows with `MIN(ord) AS min_ord` → filled grid) → `jsonb_object_agg` → `jsonb_build_object(rowKeyAttribute, row_key) || …` → `jsonb_agg(pivot_row ORDER BY min_ord ASC)`; returns `type: "json_array"`; `fillValue` as prepared-statement parameter `$N::jsonb`; `columns` resolved via `sqlStringForRuntimeTransformer` with `usedContextEntries` forwarded; `applyTo` per the 4-type allowlist. (Row-order precedent: `sqlStringForSortListTransformer` orders its `jsonb_agg`, `SqlGenerator.ts:3861`.)
2. Register in `sqlTransformerImplementations`; add `CoreTransformerForBuildPlusRuntime_pivot` to the `sqlStringForApplyTo` union (`SqlGenerator.ts:772-788`).
3. `npm run build -w miroir-store-postgres`.
4. **After the first green SQL run:** set `integrationTestExpectedValue` on the Slice 4 error leaf (existence-mode aggregate ban) to the observed SQL failure shape; rebuild the deployment package.

### 7.3 Refactor checkpoint

- Extract CTE-stage builders only if Slice 8 reuses them; otherwise keep local — no speculative shared helpers.

### Validation

```bash
npm run build -w miroir-store-postgres
npm run build -w miroir-test-app_deployment-miroir && npm run testByFile -w miroir-test-app_deployment-miroir -- tests/modelValidation.unit.test.ts
npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-sql --suites miroirCoreTransformers --mode integration
npx tsc --noEmit --skipLibCheck -p packages/miroir-store-postgres/tsconfig.json
```

### Realization

<Appended on completion.>

---

## Slice 8 — `unpivot` SQL handler

**Status:** ⬜ pending

### Goal

The same `unpivot` leaves pass with `runAsSql: true` (Goal 3 for unpivot).

### 8.1 RED

SQL-profile run: `unpivot` leaves fail with `QueryNotExecutable`.

### 8.2 GREEN

1. `sqlStringForUnpivotTransformer`: `jsonb_array_elements` + `LATERAL jsonb_each` (precedent `SqlGenerator.ts:3668-3676`), key filter per `idColumns`/`columns`, `jsonb_build_object(...idColumns, nameInto, key, valueInto, value)`, `jsonb_agg` (order: input ordinality then key, mirroring in-memory melt order) → `type: "json_array"`; explicit-`null` cells kept (`jsonb_each` emits them; `sqlIsNull` helpers distinguish JSON null from SQL NULL where needed).
2. Register; extend the `sqlStringForApplyTo` union; rebuild `miroir-store-postgres`.
3. **After the first green SQL run:** set `integrationTestExpectedValue` on the Slice 6 collision-error leaf; rebuild the deployment package.

### 8.3 Refactor checkpoint

- D6 validation rules mirrored in both handlers without duplication drift; note any divergence in Realization.

### Validation

```bash
npm run build -w miroir-store-postgres
npm run build -w miroir-test-app_deployment-miroir && npm run testByFile -w miroir-test-app_deployment-miroir -- tests/modelValidation.unit.test.ts
npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-sql --suites miroirCoreTransformers --mode integration
npx tsc --noEmit --skipLibCheck -p packages/miroir-store-postgres/tsconfig.json
```

### Realization

<Appended on completion.>

---

## Slice 9 — Nonreg, docs, cleanup, AC

**Status:** ⬜ pending

### 9.1 Nonreg

- Verified at plan time: `scripts/nonreg-manifest.json` already covers this work — `unit-miroir-core` (`:23-36`, all miroir-core unit suites) and `integ-transformer-miroirCoreTransformers` (`:354-371`, profile defaults to `emulatedServer-sql`). No manifest edit.
- `npm run nonreg` green.
- `graphify update .` (repo rule after code changes).

### 9.2 Docs

- `docs/reference/transformers.md`: `pivot` / `unpivot` entries (parameter tables, existence mode, D5/D6 rules, SQL-parity note, rights-matrix example query shape).
- `analysis.md` status → implemented; this plan's progress table all ✅.

### 9.3 Issue-directory cleanup

- No `tests/**/issues/265-*` vitest files were created (all coverage is MiroirTest) — confirm and state it.

### 9.4 Tracer bullet (narrative)

1. Add a `transformerTest` leaf: pivot `rights` fixture (alice/bob × dep1/dep2) ⇒ existence matrix.
2. Unit mode: in-memory handler produces the matrix.
3. SQL integration mode (`emulatedServer-sql`): Postgres produces the identical matrix through the CTE pipeline, same row order.

Automated equivalent: `miroirCoreTransformers` suite, `pivot` sub-suite, in both modes.

### AC checklist (#265)

| Criterion | Proven by | Status |
|---|---|---|
| TDD per skill (baseline, tests first) | Slice 0 baseline log; RED state recorded per slice | ⬜ |
| `TransformerDefinition` instances + `index.ts` exports + deployment rebuild | Slices 1.2, 5.2 | ⬜ |
| Schema registration + `devBuild` + `index.ts` type exports | Slices 1.2, 5.2 | ⬜ |
| In-memory + SQL handler registration; `sqlStringForApplyTo` union | Slices 1.2, 5.2, 7.2, 8.2 | ⬜ |
| Inventory `CORE`/`HANDLED` extended | Slices 1.2, 5.2 + inventory test green | ⬜ |
| Suite leaves incl. rights-matrix scenario; unit + SQL integration green | Slices 1–8; commands in Test execution conventions | ⬜ |
| `docs/reference/transformers.md` | Slice 9.2 | ⬜ |
| `npm run nonreg` green | Slice 9.1 | ⬜ |
