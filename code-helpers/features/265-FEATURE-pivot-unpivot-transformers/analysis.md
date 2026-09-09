# 265 — Pivot and unpivot transformers (in-memory + SQL)

> Add `pivot` and `unpivot` as core Miroir transformers with dual implementations (in-memory handler + Postgres SQL generation). Validation use case: the `MiroirRight` matrix — one row per user, one column per deployment, boolean existence cells.

Related issue: https://github.com/miroir-framework/miroir/issues/265
Related issues: [#71](https://github.com/miroir-framework/miroir/issues/71) (capability taxonomy) · [#219](https://github.com/miroir-framework/miroir/issues/219) (rights model in Admin app) · [#262](https://github.com/miroir-framework/miroir/issues/262) (application access rights) · [#264](https://github.com/miroir-framework/miroir/issues/264) (deployment-level access rights)
Related analyses: [`../219-FEATURE-preliminary User and Rights model in Admin app (prep for #71)/analysis.md`](<../219-FEATURE-preliminary User and Rights model in Admin app (prep for #71)/analysis.md>) (#262/#264 have no local feature folder yet; their issue bodies reference planned paths)
Key sources: [`TransformersForRuntime.ts`](../../../packages/miroir-core/src/2_domain/TransformersForRuntime.ts) · [`SqlGenerator.ts`](../../../packages/miroir-store-postgres/src/1_core/SqlGenerator.ts) · [`SqlQueryBuilder.ts`](../../../packages/miroir-store-postgres/src/1_core/SqlQueryBuilder.ts) · [`SqlDbQueryRunner.ts`](../../../packages/miroir-store-postgres/src/4_services/SqlDbQueryRunner.ts)

**Document role:** analysis **and** decision record.
**Status:** decisions confirmed (grilling session with user, 2026-09-09); revised after adversarial review — implementation not started.
**Document history:** v1 confirmed with user (grilling, 2026-09-09). v2 (2026-09-09): revised applying [`./review-analysis.md`](./review-analysis.md) (adversarial review, Grok High Fast) — R1–R16 applied, R17 acknowledged. v3 (2026-09-09): plan adversarial review ([`./review-plan.md`](./review-plan.md), Composer Fast) — its R1 applied here (deterministic SQL row order via `ORDER BY min(ord)` in D4 steps 5/7); all other plan-review items affect the plan only.

---

## Decision record

| Decision | Choice |
|---|---|
| D1 Output shape | **Relational both ways** — `pivot`: one object per row key, one attribute per column value; `unpivot`: `{...idColumns, [nameInto], [valueInto]}` rows |
| D2 Cell semantics | **Existence boolean when `valueAttribute` absent** ("at least one row"); missing pairs get `fillValue` (default `false` / `null`) |
| D3 Column set | **Dynamic, resolves to `string[]`** — literal list or transformer resolving to a JSON array of scalars; omitted ⇒ data-derived from the pivot input |
| D4 Postgres strategy | **Two-level conditional aggregation** (`WITH ORDINALITY` → per-cell reduction → `jsonb_object_agg`), `extraWith` CTEs; no `tablefunc` |
| D5 Duplicate (row, col) collisions | **`onDuplicates` enum**, default `"first"`; aggregates forbidden in existence mode |
| D6 `unpivot` semantics | **Absent keys skipped, explicit `null`s kept**; per-row key melt; `nameInto`/`valueInto` ∈ `idColumns` ⇒ error |
| D7 Implementation structure | **`libraryImplementation`** with hand-written handlers both sides |
| D8 Result schema | **Static `array` of `record`** on the definition JSON; inventory test CORE+HANDLED extended |
| D9 Scope | **One issue, both transformers**; rendering/write-back excluded |
| D10 Test fixtures | **Generic rights-shaped fixtures**; SQL proof requires `--profile emulatedServer-sql` |

**Rationale:** the driving use case (rights matrix) requires dynamic columns and existence-boolean cells; the SQL generator machinery is JSON-centric, which makes conditional aggregation strictly simpler than real `PIVOT`/`crosstab` while supporting dynamic columns for free.

### D1 — Output shape

**Status:** Accepted — relational both ways.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D1-a. Relational** ★ | `pivot` emits `{user: "alice", "dep-uuid-1": true, ...}`; `unpivot` emits `{...idColumns, [nameInto]: column, [valueInto]: value}` rows (defaults `"column"` / `"value"`, per issue #265 Interface table) | Direct grid consumption; honest counterpart of SQL `PIVOT`/`UNPIVOT`; composes with `sortList`/`filterList` downstream | Output attributes are dynamic (weakens static typing — see D8) |
| D1-b. Nested maps | `indexListBy`-style `{alice: {"dep-uuid-1": true}}` | Matches existing object-spread transformers | Not the relational dual of `unpivot`; awkward round-trip; grid reports consume row lists, not maps |

**Decision:** D1-a. Nested-map reshaping remains available via `indexListBy` / `listReducerToSpreadObject`.

### D2 — Cell semantics

**Status:** Accepted — existence boolean when `valueAttribute` is absent.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D2-a. Generalized value, existence default** ★ | Cell = plucked `valueAttribute` (aggregated on duplicates per D5); absent `valueAttribute` ⇒ `true` iff at least one (row, col) input row exists; missing pairs ⇒ `fillValue` (default `false` in existence mode, else `null`) | Rights matrix needs zero extra config; general case stays expressible | Two modes to document |
| D2-b. One matrix per capability value | Pivot on `(user, deployment, capability)` | Matches a future capability taxonomy | `capability` is a free string until #71; multiplies matrices; not what a checkbox grid needs |
| D2-c. Capability string as cell | Cell = the `capability` value | More informative | Not a checkbox; still free-string-typed until #71 |

**Decision:** D2-a. Existence mode means "**at least one** right row for (user, target)" — several `MiroirRight` rows with different `capability` strings on the same pair collapse to one `true` cell (accepted until #71; D2-b remains the future per-capability route). Consequently D5's aggregate options (`count`/`sum`/`min`/`max`) are **forbidden in existence mode** — they would emit numbers, not booleans; both handlers must error on that combination.

### D3 — Column set resolution

**Status:** Accepted — dynamic; `columns` always resolves to a **JSON array of scalar strings**.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D3-a. Context reference, data-derived fallback** ★ | `columns?: string[] \| transformer → string[]`; omitted ⇒ distinct `columnKeyAttribute` values of the **pivot input**, computed inside the handler | Rights grid shows all deployments incl. right-less ones; stays correct as deployments change | Column list resolved at runtime ⇒ no static output typing (D8) |
| D3-b. Static list only | Columns spelled out in the query | Required by real `PIVOT`/`crosstab` | Unusable for the rights case: deployments change over time |
| D3-c. Data-derived only | Distinct column keys from input rows | Simplest | Right-less deployments never appear as columns |

**Decision:** D3-a, with two binding constraints surfaced by adversarial review:

1. **The contract is `string[]`, nothing else.** A Deployment extractor returns *rows* (objects with `uuid`, `name`, …), and `getUniqueValues` also returns objects (`[...values].map(e => ({[attribute]: e}))`, [`TransformersForRuntime.ts:2560-2566`](../../../packages/miroir-core/src/2_domain/TransformersForRuntime.ts)) — feeding either directly would stringify objects into `"[object Object]"` column keys. Queries must **pluck first** (`mapList` + `accessDynamicPath` on `"uuid"`). `getUniqueValues` is therefore **not** the `columns` mechanism.
2. **SQL-mode `columns`** is resolved with `sqlStringForRuntimeTransformer` (which dispatches nested registered handlers, unlike `sqlStringForApplyTo`) and must compile to a JSON array of scalars: omitted (data-derived), literal `string[]` (e.g. wrapped in `returnValue`), or `getFromContext` / another SQL-registered transformer. `usedContextEntries` must be forwarded so the WITH-clause assembler keeps the referenced CTE; `useAccessPathForContextReference` passes through unchanged.

### D4 — Postgres strategy

**Status:** Accepted — two-level conditional aggregation over the existing jsonb CTE machinery; no `tablefunc` dependency.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D4-a. Conditional aggregation** ★ | See the two-level plan below | No extension dependency; dynamic columns free; consistent with the `SqlStringForTransformerElementValue` jsonb flow | Not syntactically a "PIVOT" — semantics only |
| D4-b. `crosstab` (tablefunc) | `CREATE EXTENSION tablefunc`; two-arg `crosstab` | Concise SQL | New operational prerequisite on every Postgres deployment; statically enumerated output columns (breaks D3); dynamically-typed columns clash with the jsonb machinery; known footguns (category sort order) |
| D4-c. Native `PIVOT` | — | — | Does not exist in PostgreSQL (as of 2026-09): a [patch proposed Nov 2025](https://www.postgresql.org/message-id/5D71B366-0C2D-4BD9-B197-93851A86B1C1%40sbcglobal.net) is uncommitted, and itself desugars to `FILTER` aggregates at parse time |

**Decision:** D4-a. If Miroir ever gains a store on a dialect with native `PIVOT` (DuckDB, SQL Server), that dialect's generator can map the same `transformerType` to it — the `TransformerDefinition` stays dialect-neutral.

**D4-a two-level plan (pivot).** A single `jsonb_object_agg(col, value)` cannot implement D5 (per-cell aggregates need a prior `GROUP BY`; `first`/`last` need input order — Postgres documents aggregate input order as unspecified unless controlled). The SQL handler therefore returns `type: "json_array"` (same shape as `sqlStringForSortListTransformer`, [`SqlGenerator.ts:3872-3873`](../../../packages/miroir-store-postgres/src/1_core/SqlGenerator.ts)) with `extraWith` CTEs ([`SqlGenerator.ts:247-258`](../../../packages/miroir-store-postgres/src/1_core/SqlGenerator.ts), flattened into the query `WITH` at `:5812-5817`; `sortList` already appends an unnest CTE at `:3867-3876`):

1. **applyTo** — subject to the SQL-mode constraint below.
2. **unnest `WITH ORDINALITY`** — `(row_key, col_key, raw_value, ord)`; the repo has no ordinality precedent, this is the first.
3. **cell reduction** — `DISTINCT ON (row_key, col_key) ... ORDER BY row_key, col_key, ord ASC|DESC` for `first`/`last`; `GROUP BY row_key, col_key` + `COUNT`/`SUM`/`MIN`/`MAX` for aggregate `onDuplicates`.
4. **distinct cols** — from the `columns` CTE when provided (resolved via `sqlStringForRuntimeTransformer`, must be a JSON array of scalars), else `SELECT DISTINCT col_key` from the cells CTE.
5. **distinct rows** — `SELECT row_key, MIN(ord) AS min_ord … GROUP BY row_key` from the cells CTE (first-appearance order).
6. **filled grid** — rows `CROSS JOIN` cols `LEFT JOIN` cells, `COALESCE(value, $N::jsonb)` with `fillValue` as a prepared-statement parameter.
7. **final** — `GROUP BY row_key`, `jsonb_object_agg(col_key, filled_value)`, merged as `jsonb_build_object(rowKeyAttribute, row_key) || pivoted_object`, then `jsonb_agg(pivot_row ORDER BY min_ord ASC)` → `json_array`. The `ORDER BY` is **mandatory**: MiroirTest comparison is array-order-sensitive and a bare `jsonb_agg` over `GROUP BY` has unspecified row order (ordering precedent: `sqlStringForSortListTransformer`, [`SqlGenerator.ts:3861`](../../../packages/miroir-store-postgres/src/1_core/SqlGenerator.ts)).

**D4-a unpivot.** `jsonb_array_elements` + `LATERAL jsonb_each` (real precedent: `fct: "jsonb_each"` in `sqlStringForObjectEntriesTransformer`, [`SqlGenerator.ts:3668-3676`](../../../packages/miroir-store-postgres/src/1_core/SqlGenerator.ts)), filter keys per `idColumns`/`columns`, `jsonb_build_object(...idColumns, nameInto, key, valueInto, value)`, `jsonb_agg` → `json_array`.

**SQL-mode `applyTo` constraint (binding).** `sqlStringForApplyTo` recurses into `applyTo` only for `constantAsExtractor` | `returnValue` | `getFromContext` | `getFromParameters`; anything else (`filterList`, …) returns `QueryNotExecutable` ([`SqlGenerator.ts:856-879`](../../../packages/miroir-store-postgres/src/1_core/SqlGenerator.ts)). So in SQL mode the rights Query must be shaped as named extractor/combiner entries (`filteredRights`, `deploymentUuids`) with `pivot.applyTo = { transformerType: "getFromContext", referenceName: "filteredRights" }` — the established test pattern ([suite leaf `33f60ac8-…json:8066-8106`](../../../packages/miroir-test-app_deployment-miroir/assets/miroir_data/a311f363-e238-4203-bdfc-29e8c160c26b/33f60ac8-6511-43b1-b153-6b86e3177532.json)). The issue AC's "`sqlStringForApplyTo` extended" adds `pivot`/`unpivot` to its **outer** parameter union ([`SqlGenerator.ts:772-788`](../../../packages/miroir-store-postgres/src/1_core/SqlGenerator.ts)); it does not relax the 4-type allowlist.

### D5 — Duplicate (row, column) collisions

**Status:** Accepted — `onDuplicates?: "first" | "last" | "count" | "sum" | "min" | "max"`, default `"first"`.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D5-a. Aggregation param with `first` default** ★ | Applied when several input rows share (rowKey, columnKey); SQL: per D4-a step 3 (`WITH ORDINALITY` + `DISTINCT ON` for first/last, `GROUP BY` + aggregate for the rest) | Mirrors SQL `PIVOT` without forcing verbosity; deterministic `last` via ordinality | Enum must be implemented in both handlers |
| D5-b. Error on duplicates | pandas `pivot` behavior | Loud | Hostile for exploratory queries |
| D5-c. Silent first-wins | No param | Zero config | Hidden data loss |

**Binding restriction (D2):** when `valueAttribute` is absent (existence mode), only `first`/`last` are legal; `count`/`sum`/`min`/`max` must error in both handlers (they would emit numbers into a boolean grid).

### D6 — `unpivot` semantics

**Status:** Accepted — four binding rules.

1. **Nulls:** absent keys are skipped; explicit `null` values produce rows.
2. **Collisions:** `nameInto`/`valueInto` ∈ `idColumns` ⇒ error in both handlers (object-spread last-wins would silently clobber the id).
3. **Key melt:** with `columns` omitted, melt each row's **own** keys minus `idColumns` (per-row, not a global union) — heterogeneous row shapes melt per-row; SQL `jsonb_each` behaves the same way naturally.
4. **SQL parity:** cell values must be JSON values — the SQL path is JSON-centric, so `Date`/`undefined` cells diverge (documented, not handled).

**Duality caveat:** fill-dense pivot ∘ unpivot is **not** a round-trip — after a filled pivot every column key is present (`false` is not absent), so unpivot emits rows for synthetic `fillValue` cells that were never input rows. The sparse dual is pivot with `columns` omitted and `fillValue` unset (missing keys stay missing). Rights write-back must therefore filter `value === true` after unpivot — that flow belongs to the rights-UI follow-up, not this issue. Both modes get tests.

### D7 — Implementation structure

**Status:** Accepted — `transformerImplementationType: "libraryImplementation"` with hand-written handlers.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D7-a. Library implementation** ★ | `handleTransformer_pivot` / `handleTransformer_unpivot` in `TransformersForRuntime.ts`; `sqlStringForPivotTransformer` / `sqlStringForUnpivotTransformer` in `SqlGenerator.ts` | Explicit, efficient SQL; matches the other 33 dual-implementation core transformers; dynamic columns controllable | Two handlers to write and keep in parity |
| D7-b. Composite transformer | `transformerImplementationType: "transformer"` composing `aggregate` + `object_fromEntries` etc.; SQL "for free" via the composite recursion in `sqlStringForRuntimeTransformer` | No new TypeScript | Convoluted unnest/re-agg SQL; inherits composition limits (dynamic columns especially); only 2 of 45 existing definitions use this route, both for schema utilities |

**Decision:** D7-a. D7-b remains possible later as a comparative prototype, not as the shipped definition.

### D8 — Result-schema typing

**Status:** Accepted — static `transformerResultSchema` on the definition JSONs: `{ type: "array", definition: { type: "record", definition: { type: "any" } } }` (existence mode documented as boolean-valued records).

Mechanics (verified): the `Transformer_ResultSchema.ts` switch ([`:834`](../../../packages/miroir-core/src/2_domain/Transformer_ResultSchema.ts)) is not exhaustive, and its `aggregate` case (`:1332-1364`) only validates `applyTo` then **breaks to the static JSON definition** — it does not invent schemas. The return-record precedent is `indexListBy` / `object_fromEntries` (`:1227-1254`). A `case "pivot"` / `case "unpivot"` is therefore **optional** (add only if `applyTo` array validation is wanted). The inventory test ([`transformerResultSchema.inventory.unit.test.ts`](../../../packages/miroir-core/tests/2_domain/transformerResultSchema.inventory.unit.test.ts)) snapshots `mlSchemaAnyNames` (`:84-97`) and asserts `CORE.filter(k => !HANDLED.has(k))` is `[]` against **hardcoded** `CORE`/`HANDLED` sets (`:105-177`): `pivot`/`unpivot` must be added to **both** sets, otherwise the issue AC's "inventory test updated" is a no-op. Static column-aware inference stays deferred (with D3-a the column set is usually dynamic anyway).

### D9 — Scope

**Status:** Accepted — one issue covering both transformers; the checkbox-grid Report section and cell-toggle write-back are excluded.

Rationale: `pivot`/`unpivot` share column-resolution machinery and are duals validated by the same scenario. Rendering belongs to the rights-UI follow-up (after #262/#264; #264 already lists "Custom rights-management UI" out of scope).

### D10 — Test fixtures and SQL proof

**Status:** Accepted — generic rights-shaped fixtures (`user` / `target` / `capability` rows) inline in the `miroirCoreTransformers` MiroirTest suite; SQL parity proven with the Postgres profile.

Rationale: the suite lives in `miroir-test-app_deployment-miroir` while `MiroirRight` lives in `miroir-test-app_deployment-admin`; importing admin assets would couple the packages in the wrong direction. The real `MiroirRight`-backed Query lands with the rights-UI follow-up.

**Binding:** "both `runAsSql` modes" means (1) unit mode in `miroir-core` and (2) integration in `miroir-standalone-app` **with `--profile emulatedServer-sql`** (per [`docs/contributing/testing.md:118`](../../../docs/contributing/testing.md)). Without a SQL profile, `prepareTestMiroirLaunch` sets nothing and `resolveTransformerIntegrationRunAsSql` is true only for store names matching `/^postgres(?:ql)?:\/\//` ([`MiroirTransformerTestTools.ts:61-74, 313`](../../../packages/miroir-core/src/5_tests/MiroirTransformerTestTools.ts)) — i.e. a profile-less integration run is in-memory and does **not** test Goal 3.

---

## Interface contracts (Jzod)

Draft `transformerParameterSchema` for both definitions (exact union mechanics validated when the JSON is written; patterns verified against `createObjectFromPairs` — [`16d866c4-…json`](../../../packages/miroir-test-app_deployment-miroir/assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/16d866c4-bc81-4773-89a4-a47ac7f6549d.json), `attributeKey` union with `discriminator: "transformerType"` — and the `optInDiscriminator: true` fundamental union at [`getMiroirFundamentalJzodSchema.ts:899-931`](../../../packages/miroir-core/src/0_interfaces/1_core/bootstrapJzodSchemas/getMiroirFundamentalJzodSchema.ts), required because a literal array branch is itself a JSON object):

`pivot`:

```json
{
  "transformerType": { "type": "literal", "definition": "pivot" },
  "transformerDefinition": {
    "type": "object",
    "definition": {
      "applyTo": { "type": "any", "optional": true },
      "rowKeyAttribute": { "type": "string" },
      "columnKeyAttribute": { "type": "string" },
      "valueAttribute": { "type": "string", "optional": true },
      "onDuplicates": { "type": "enum", "optional": true,
        "definition": ["first", "last", "count", "sum", "min", "max"] },
      "columns": { "type": "union", "optional": true,
        "optInDiscriminator": true, "discriminator": "transformerType",
        "definition": [
          { "type": "array", "definition": { "type": "string" } },
          { "type": "schemaReference", "definition": {
            "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            "relativePath": "transformer" } }
        ] },
      "fillValue": { "type": "any", "optional": true }
    }
  }
}
```

`unpivot`:

```json
{
  "transformerType": { "type": "literal", "definition": "unpivot" },
  "transformerDefinition": {
    "type": "object",
    "definition": {
      "applyTo": { "type": "any", "optional": true },
      "idColumns": { "type": "array", "definition": { "type": "string" } },
      "columns": { "type": "array", "optional": true,
        "definition": { "type": "string" } },
      "nameInto": { "type": "string", "optional": true },
      "valueInto": { "type": "string", "optional": true }
    }
  }
}
```

Both carry the static result schema of D8: `{ "returns": "mlSchema", "definition": { "type": "array", "definition": { "type": "record", "definition": { "type": "any" } } } }`.

## 1. Goals

1. **Pivot in queries** — In order to obtain matrix-shaped data (e.g. users × deployments rights) directly from a Query without UI-side post-processing, as a report designer, I can reshape a list of row objects into one object per row key with one attribute per column value.
2. **Unpivot in queries** — In order to normalize matrix-shaped data back into rows (e.g. edited matrix cells becoming right instances), as a report designer, I can melt selected attributes of row objects into `{...idColumns, [nameInto], [valueInto]}` rows.
3. **SQL parity** — In order to pivot/unpivot large datasets without loading them into memory, as an application maintainer, I can run the same Query with `runAsSql: true` and have Postgres execute the operation.
4. **Dynamic columns** — In order to keep matrix reports correct as column values (deployments) are added or removed, as a report designer, I can supply the column set from a context reference instead of hard-coding it.

(Goals confirmed with the user in the same grilling pass as the decision record, 2026-09-09.)

## 2. Non-goals

- Checkbox-grid Report section type, rights-matrix UI, cell-toggle write-back actions (incl. the `value === true` unpivot filter of D6) — owned by the future rights-UI issue, to be created after [#262](https://github.com/miroir-framework/miroir/issues/262)/[#264](https://github.com/miroir-framework/miroir/issues/264) land.
- Per-capability matrices (D2-b) — after [#71](https://github.com/miroir-framework/miroir/issues/71).
- Composite (multi-attribute) row keys — later, unscheduled.
- Arbitrary per-group nested transformers as cell values (v1: attribute pluck or existence) — later, unscheduled.
- `tablefunc` / `crosstab` / native `PIVOT` — rejected (D4).
- Static column-aware result-schema inference — deferred (D8).
- Validation against real `MiroirRight` assets in `miroir-test-app_deployment-admin` — lands with the rights-UI follow-up (D10).

## 3. Current state

### 3.1 Dual-implementation transformer machinery (aligned)

Transformers are declared as instances of the `TransformerDefinition` entity (uuid `a557419d-a288-4fb8-8a1e-971c86c113b8`), one JSON per transformer under `packages/miroir-test-app_deployment-miroir/assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/`. Programmatic enumeration of that folder (2026-09-09): **45 instances** —

| Implementation | Count | Examples |
|---|---|---|
| `libraryImplementation` with a real SQL handler name | 33 | `aggregate`, `filterList`, `sortList`, `mapList`, `indexListBy`, `getUniqueValues` |
| `libraryImplementation`, SQL = `"N/A"` | 6 | `jzodTypeCheck`, `resolveConditionalSchema`, `resolveTransformerResultSchema` |
| `libraryImplementation`, SQL = `"TODO"` | 2 | `getActiveDeployment`, `duplicateApplicationModel` |
| `libraryImplementation`, no SQL field | 2 | `ansiColumnsToJzodSchema`, `transformer_menu_addItem` |
| `transformerImplementationType: "transformer"` (composite) | 2 | `entityDefinition_extractAttributes`, `spreadSheetToJzodSchema` |

Wiring of an existing dual-implementation transformer (`aggregate`, definition uuid `4ee5c863-5ade-4706-92bd-1fc2d89c3766`):

```json
"transformerImplementation": {
  "transformerImplementationType": "libraryImplementation",
  "inMemoryImplementationFunctionName": "handleCountTransformer",
  "sqlImplementationFunctionName": "sqlStringForCountTransformer"
}
```

**Complete wiring list for a new core transformer** (verified against live code 2026-09-09; supersedes `.agents/skills/miroir-edit-transformers/SKILL.md` where noted stale):

1. New `TransformerDefinition` JSON in the folder above + export from `packages/miroir-test-app_deployment-miroir/index.ts` (pattern: `transformer_aggregate_json`, `:340`) with matching `index.d.ts` declaration; rebuild the deployment package.
2. `Transformers.ts`: import the JSON, export the constant, add to `miroirCoreTransformers` — a **Record** ([`:139-192`](../../../packages/miroir-core/src/2_domain/Transformers.ts)) auto-feeding `coreTransformerForBuildPlusRuntimeNames` and the Jzod schema via `transformerInterfaceFromDefinition` (`:203-212`).
3. `TransformersForRuntime.ts`: handler + registration in **both** `inMemoryTransformerImplementations` (`:722-776`) and `applicationTransformerDefinitions` (`:781`; lookup at `:3620-3621`).
4. `SqlGenerator.ts`: SQL handler + registration in `sqlTransformerImplementations` (`:191-226`); add the new types to the `sqlStringForApplyTo` parameter union (`:772-788`).
5. `generate-ts-types.ts`: add the new members to the **hardcoded** `CoreTransformerForBuildPlusRuntime` union (`headerForZodImports` `:188-235`, `z.union` `:259-295`) — omitting this means generated types/zod never include the new transformers even if JSON + `miroirCoreTransformers` are updated. Then `npm run devBuild -w miroir-core`.
6. Test leaves in `33f60ac8-…json` under `runtimeTransformerTests` use **`miroirTestType: "transformerTest"`** (not the skill's `transformerTestType`).
7. Inventory test: extend both `CORE` and `HANDLED` sets (D8).
8. Docs: `docs/reference/transformers.md` (skill Step 9's `docs-OLD/transformers` is stale).

Do **not** hand-edit `domainActionDependencySet` (skill Step 7A is stale): it is computed by `jzodTransitiveDependencySet` ([`getMiroirFundamentalJzodSchema.ts:3435-3441`](../../../packages/miroir-core/src/0_interfaces/1_core/bootstrapJzodSchemas/getMiroirFundamentalJzodSchema.ts)).

- In-memory handlers: `ITransformerHandler` signature ([`Transformer.ts:22-38`](../../../packages/miroir-core/src/0_interfaces/1_core/Transformer.ts)); dispatch in `transformer_extended_apply` (`TransformersForRuntime.ts:3547`, library resolution at `:3677-3728`).
- SQL dispatch: `sqlStringForRuntimeTransformer` (`SqlGenerator.ts:5500-5607`), including a recursion case for composite transformers.

### 3.2 SQL execution path (aligned)

- In-memory vs SQL is an explicit **`runAsSql?: boolean` flag on the query**; the branch is `handleBoxedQueryAction` at [`SqlDbQueryRunner.ts:481-499`](../../../packages/miroir-store-postgres/src/4_services/SqlDbQueryRunner.ts). Non-SQL stores only ever run the in-memory path.
- A transformer without a SQL implementation fails in `sqlStringForRuntimeTransformer` with `Domain2ElementFailed("QueryNotExecutable")` ([`SqlGenerator.ts:5551-5563`](../../../packages/miroir-store-postgres/src/1_core/SqlGenerator.ts)) — **no automatic fallback to memory**. Memory-only transformers declare `integrationTestExpectedValue: { queryFailure: "QueryNotExecutable" }` in their test leaves (the special-case at `MiroirTransformerTestTools.ts:311-319` is for `ansiColumnsToJzodSchema`). Pivot/unpivot must **not** use that path — Goal 3 requires real SQL.
- `FILTER`-clause precedent: `json_agg_strict` in `sqlStringForCountTransformer` ([`SqlGenerator.ts:962-965`](../../../packages/miroir-store-postgres/src/1_core/SqlGenerator.ts)) — the only `FILTER` aggregate there; per-column `FILTER` pivoting would require static columns and is **not** the D4-a mechanism.
- jsonb helpers: `sql_jsonb_object_agg` / `sql_jsonb_each` are defined at [`SqlQueryBuilder.ts:41,43`](../../../packages/miroir-store-postgres/src/1_core/SqlQueryBuilder.ts) and imported (`SqlGenerator.ts:64-66`), but only `sql_jsonb_object_agg` is actually called (once, `:4355`); `sql_jsonb_each` is currently unused. The working precedents are the query-builder `fct: "jsonb_each"` (`:3668`, `:4112`, `:4389`) and `fct: "jsonb_object_agg"` (`:4183`) usages.

### 3.3 Pivot / unpivot functionality (absent — the gap)

Repo-wide case-insensitive search for `pivot`, `unpivot`, `crosstab` (2026-09-09): no occurrences outside false positives (`pivotal`, an unrelated local named `crossTable`). Closest existing pieces: `aggregate` with `groupBy` + `json_agg`, and the object-spread reducers `indexListBy` / `listReducerToSpreadObject` — none produce a relational pivot.

### 3.4 Validation target: `MiroirRight` (aligned)

Entity `MiroirRight` (uuid `a6136fc7-949b-4d64-9f13-dd3afce1ab3c`, in `miroir-test-app_deployment-admin` assets — **not** deployment-miroir, hence D10):

| Attribute | Type | Notes |
|---|---|---|
| `miroirUser` | `uuid` | FK to `MiroirUser` (`d20d09e5-0685-4fc7-b9bd-fcfa3845127a`) |
| `targetType` | enum `["application", "deployment"]` | discriminator |
| `targetUuid` | `uuid` | polymorphic (no `foreignKeyParams`) |
| `capability` | `string` | free text until #71; ignored by #262/#264 enforcement |
| `description` | `string?` | |

Existing reports: `MiroirRightList` (`42994013-4494-4510-8531-7c811a9aa0d0`, `objectListReportSection`), `MiroirRightDetails` (`fbe615b3-b670-40d1-ac0d-de6e0c7c847e`). **No rights-matrix / checkbox-grid Report section exists** (the ag-grid `headerCheckboxSelection` in `TestResultsGrid.tsx:203` is test-results tooling, not a rights UI). Sample instances: `48b2048f-507f-40ee-a890-b6eca83596f5` (application/admin), `587f92f8-7140-434b-b9ff-f7f5d2e461b2` (deployment/read) — unique per (user, target), so they do not exercise D5.

## 4. Key reuse

| Piece | Location |
|-------|----------|
| `TransformerDefinition` entity | uuid `a557419d-a288-4fb8-8a1e-971c86c113b8` |
| `aggregate` definition (template for dual wiring) | uuid `4ee5c863-5ade-4706-92bd-1fc2d89c3766` |
| Deployment-package export pattern | `miroir-test-app_deployment-miroir/index.ts:340` (`transformer_aggregate_json`) |
| Literal-or-transformer Jzod union pattern | `createObjectFromPairs` `attributeKey`, `16d866c4-bc81-4773-89a4-a47ac7f6549d.json`; `optInDiscriminator` at `getMiroirFundamentalJzodSchema.ts:899-931` |
| unnest/re-agg CTE pattern (list transformers) | `SqlGenerator.ts:3793-3881` (`sortList`) |
| `jsonb_each` precedent (unpivot) | `SqlGenerator.ts:3668-3676` (`sqlStringForObjectEntriesTransformer`) |
| `jsonb_object_agg` precedents (pivot) | `SqlGenerator.ts:4183` (`fct`), `:4355` (helper call) |
| Pluck pattern for `columns` (D3) | `mapList` + `accessDynamicPath` (`"uuid"`) |
| Object-spread semantics precedent | `indexListBy` / `listReducerToSpreadObject` SQL at `SqlGenerator.ts:4136, 4307` |
| MiroirTest suite `miroirCoreTransformers` | `33f60ac8-6511-43b1-b153-6b86e3177532.json` (suite entity `a311f363-e238-4203-bdfc-29e8c160c26b`); registry key at `miroirCoreTestSuiteRegistry.ts:28` |
| Result-schema switch / return-record precedent | `Transformer_ResultSchema.ts:834` / `:1227-1254` |
| Wiring checklist (TDD) | `.agents/skills/miroir-edit-transformers/SKILL.md` (partly stale — see §3.1) |

## 5. Proposals / options

| # | Proposal | Impact | Effort | Verdict |
|---|---|---|---|---|
| 1 | D7-a library implementation, D4-a two-level conditional aggregation | high — enables the rights matrix and general pivoting, in memory and in SQL | med — 2 TransformerDefinition JSONs, 2 in-memory handlers, 2 SQL handlers, schema registration, tests | **adopt** |
| 2 | D7-b composite of existing transformers | med | low | reject — convoluted SQL, dynamic-column limits (D7) |
| 3 | D4-b `crosstab` / `tablefunc` | med | low | reject — extension dependency, static columns (D4) |

---

## Next step

Implementation proceeds per [`./tdd-implementation-plan.md`](./tdd-implementation-plan.md) (to be written after this analysis is confirmed, following the `miroir-analysis-to-tdd-plan` skill).
