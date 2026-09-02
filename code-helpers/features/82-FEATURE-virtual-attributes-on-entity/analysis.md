# 82 — Virtual attributes: transformers attached to Entity attributes

> Attach a transformer to an Entity attribute so the value is computed from **that instance’s
> stored fields**, not stored. The same definition is available wherever an attribute name is
> used — list columns, details reports, Queries, Actions, and other transformers — **only when
> the query (or display derived from it) actually requires the name**. SQL evaluation, when the
> transformer compiles, is an expression over the entity’s own row: **no extra FROM / JOIN**.

Related issue: https://github.com/miroir-framework/miroir/issues/82
Related: [#217](https://github.com/miroir-framework/miroir/issues/217) (Entity is present-model authority ✅) ·
[#80](https://github.com/miroir-framework/miroir/issues/80) (OCL-like validation transformers on Entity — sibling, not this) ·
[#88](https://github.com/miroir-framework/miroir/issues/88) (typed transformers) ·
[#191](https://github.com/miroir-framework/miroir/issues/191) (attribute-update impacts) ·
[#214](https://github.com/miroir-framework/miroir/issues/214) (partial fetch `extractor.attributes`) ·
[#246](https://github.com/miroir-framework/miroir/issues/246) (ad-hoc list transformer panel — complementary) ·
[#249](https://github.com/miroir-framework/miroir/issues/249) (`inputOutput` contracts)

Related analyses:
[`../217-FEATURE- Make Entity the authoritative present-model definition/analysis.md`](../217-FEATURE-%20Make%20Entity%20the%20authoritative%20present-model%20definition/analysis.md) ·
[`../246-FEATURE-list-display-by-transformer/analysis.md`](../246-FEATURE-list-display-by-transformer/analysis.md)

Key sources:
- Entity present model [`16dbfe28-…/16dbfe28-….json`](../../../packages/miroir-test-app_deployment-miroir/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad.json)
- Jzod attribute tags [`1e8dab4b-….json`](../../../packages/miroir-test-app_deployment-miroir/assets/miroir_data/5e81e1b9-38be-487c-b3e5-53796c57fccf/1e8dab4b-65a3-4686-922e-ce89a2d62aa9.json) (`jzodBaseObject.tag.value`)
- Runtime: [`TransformersForRuntime.ts`](../../../packages/miroir-core/src/2_domain/TransformersForRuntime.ts), [`QuerySelectors.ts`](../../../packages/miroir-core/src/2_domain/QuerySelectors.ts), [`ExtractorByEntityReturningObjectListTools.ts`](../../../packages/miroir-core/src/2_domain/ExtractorByEntityReturningObjectListTools.ts)
- SQL: [`SqlGenerator.ts`](../../../packages/miroir-store-postgres/src/1_core/SqlGenerator.ts), [`utils.ts`](../../../packages/miroir-store-postgres/src/utils.ts) (`fromMiroirPresentModelToSequelizeEntityDefinition`)
- UI: [`getColumnDefinitionsFromEntityAttributes.ts`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/getColumnDefinitionsFromEntityAttributes.ts), [`ReportSectionListDisplay.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportSectionListDisplay.tsx), [`ReportSectionEntityInstance.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportSectionEntityInstance.tsx)
- Motivating workaround (current-state only): Designer UserStory [`59debf06-….json`](../../../packages/miroir-test-app_deployment-designer/assets/designer_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/59debf06-405d-4def-a7eb-3db45360310d.json) + `UserStoryList` [`7f037bbb-….json`](../../../packages/miroir-test-app_deployment-designer/assets/designer_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/7f037bbb-3a5a-4111-b8ec-85ef756c9ff2.json)

**Document role:** analysis and architectural decision record.
**Status:** implemented (2026-08-31). TDD plan: [`./tdd-implementation-plan.md`](./tdd-implementation-plan.md).

Issue wording uses “Entity Definitions”. Present-model authority is **Entity** (#217). Virtual attributes attach to **Entity.mlSchema**. EntityVersion snapshots them on freeze.

**Document history:** first draft proposed auto-resolving FK target *instances* (Role rows) into the evaluation context so a formatted User Story sentence could include the Role name. **Rejected (user, 2026-08-31):** that is other value objects in the cluster; it would force a JOIN and change the query plan. A query on Entity A must select only A’s rows and compute virtual attributes from A’s stored fields alone. The FK uuid stored on A is part of the instance; the related Role *row* is not.

---

## Decision record

| Decision | Choice |
|---|---|
| D1 — Where the attribute is declared | **Accepted: D1-a** — `mlSchema` attribute + virtual tag |
| D2 — How the transformer is stored | **Accepted: D2-a** — inline transformer on the tag; may call a named `transformerType` |
| D3 — Evaluation context | **Accepted: D3-a** — **the instance only** (stored fields, including FK uuids as scalars). No other value objects, no JOIN |
| D4 — Persistence | **Accepted: D4-a** — never stored, never a SQL column, stripped on write |
| D5 — When the value is computed | **Accepted: D5-a′** — **lazy**: evaluate a virtual attribute only when the query (or the report display that drives it) **requires that name** |
| D6 — SQL | **Accepted: D6′** — same lazy rule; if `runAsSql`, compile the transformer to an expression **over A’s row only**. No extra tables. Non-compilable + `runAsSql` → `QueryNotExecutable`; in-memory still evaluates when required |
| D7 — Scope of the principle | **Accepted: D7′** — **any Entity**, any instance-local derived attribute. Report-local `runtimeTransformers` that fetch other entities remain the tool for cluster/JOIN display |

**Rationale:** a virtual attribute is an attribute of the Entity, so it must be computable from a row of that Entity. That is what makes it usable in Queries “like any other attribute” without changing which table is scanned. Laziness keeps unused derived values off the hot path and keeps existing full-instance query assertions stable.

### D1 — Declaration locus

**Status:** Accepted — D1-a (user, 2026-08-31).

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D1-a. Attribute in `mlSchema.definition` with a virtual tag** ★ | Named attribute; `tag.value.virtualAttribute` holds the transformer; `type` is the result mlSchema | `viewAttributes`, details TVOE, extractor `filter` / `orderBy` / `attributes`, and transformer path access already use attribute names | Sequelize / `alterEntityAttribute` currently treat every `mlSchema` key as a stored column — skip virtual ones (D4) |
| D1-b. Parallel `Entity.virtualAttributes` map | New Entity field next to `mlSchema` | Persistence unaware of computed fields | Second “attribute” concept |
| D1-c. Separate VirtualAttribute entity | First-class instances | Queryable catalogue | Does not match “attribute of this Entity” |

**Decision:** D1-a.

The tag is **not** `initializeTo` (create-time default, persisted) and **not** `display.editable: false` alone (`uuid` is non-editable and stored). Virtual is a distinct marker.

Illustrative shape (any Entity; names are examples):

```json
"citation": {
  "type": "string",
  "optional": true,
  "tag": {
    "value": {
      "defaultLabel": "Citation",
      "display": { "editable": false, "modifiable": false },
      "virtualAttribute": {
        "transformerType": "mustacheStringTemplate",
        "interpolation": "runtime",
        "definition": "{{name}} ({{year}})"
      }
    }
  }
}
```

Context for that transformer is the instance’s stored fields (D3). `mustacheStringTemplate` reads `contextResults` today (`transformer_mustacheStringTemplate_apply`); evaluation binds the instance into context (merge stored fields / bind under the Entity name) **without** loading other entities.

### D2 — Transformer representation

**Status:** Accepted — D2-a (user, 2026-08-31).

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D2-a. Inline transformer on the tag** ★ | Same as `tag.value.initializeTo.transformer`: `coreTransformerForBuildPlusRuntime` | Zero new reference machinery; a named `transformerType` remains available | Large JSON if not extracted |
| D2-b. Uuid reference only | Tag holds `transformerDefinitionUuid` | Smaller Entity JSON | Extra instance to maintain |
| D2-c. Always a new TransformerDefinition | Forced extraction | Reuse across entities | Boilerplate for one-off templates |

**Decision:** D2-a.

### D3 — Evaluation context

**Status:** Accepted — D3-a (user, 2026-08-31). Originally proposed D3-b (auto FK target *instances*) — **rejected**.

A foreign-key **uuid** is a stored field of the instance. The **target row** is another value object. Using it would require a JOIN (SQL) or an extra extractor (in-memory) and would change the query plan: a query on Entity A would no longer be “only rows of A”.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D3-a. Instance fields only** ★ | Piped input = the instance. Context = that instance’s stored attributes (FK uuids as scalars). SQL expression uses only columns of A | Query on A stays `FROM A`. Virtual attrs are usable like columns | Cannot format “as a {{role.name}}” without storing the name on A or keeping a report-level RT |
| D3-b. Auto-resolve FK target rows | JOIN / cache lookup of Role, Author, … | Would replace some report RTs | **Rejected:** extra tables, cluster fetch, changes execution plan |
| D3-c. Explicit `dependsOn` extractors | Mini-query on the tag | Can fetch non-FK data | Reinvents Report extractors |
| D3-d. Caller must populate context | Surrounding query supplies extras | No engine change | Details / other Queries still blind |

**Decision:** D3-a. Display that needs other entities (Role name, Author name as a *computed string on UserStory/Book*) stays **Report `runtimeTransformers` / combiners** — the existing tool for clusters. Virtual attributes do not replace that.

### D4 — Persistence

**Status:** Accepted — D4-a (user, 2026-08-31).

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D4-a. Never persist** ★ | Exclude virtual keys from Sequelize column mapping, `applyMlSchemaColumnChanges` add-column, filesystem/IndexedDB write payloads, and Formik submit | Matches “virtual” | Every write path must strip |
| D4-b. Optional materialize | Store last computed value | Fast lists | Two sources of truth |

**Decision:** D4-a. `display.editable` / `modifiable` false so the details editor does not invite edits; stripping still required if a required virtual value was overlaid onto the Formik instance.

### D5 — Evaluation timing (lazy)

**Status:** Accepted — D5-a′ (user, 2026-08-31): as lazy as possible; evaluate only when required.

A virtual attribute is **required** when any of:

1. Extractor `filter.attributeName` or `orderBy.attributeName` is that name.
2. Extractor `attributes` (partial fetch, #214) lists that name.
3. A later transformer in the **same query** reads that path (static name collection).
4. Report display: list `viewAttributes` or details mlSchema fields that will be shown — the report engine adds those names to the extractor’s required set (the report *is* declaring what the query needs).

Not required: a full-instance extractor with no `attributes` list and no filter/orderBy on the virtual name. Result rows stay **raw stored fields**. Existing query tests that compare whole Book objects remain valid.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D5-a′. Lazy overlay when required** ★ | Cache stays raw. Overlay copies only requested virtual names onto **query results**. SQL `SELECT` / `WHERE` / `ORDER BY` emit expressions only for required names | Cheap default; no JOIN; backward compatible | Callers that forget to project the name see `undefined` |
| D5-a (eager on every read) | Overlay all virtual attrs on every extractor | Always present | Wasted work; breaks exact-object query assertions |
| D5-b. Hydrate into Redux cache | Cache holds computed fields | One place | Stale; writes must strip |
| D5-c. UI-only | List/details compute locally | Smallest domain change | Queries / Actions / transformers stay blind |

**Decision:** D5-a′. Filter/sort in-memory evaluate the attribute for the comparison without necessarily attaching it to the returned object unless it is also projected.

### D6 — SQL

**Status:** Accepted — D6′ (user, 2026-08-31). The earlier “`runnableAsSql` boolean vs `sqlImplementationFunctionName`” fork is **not a product decision**: it was an inventory footnote. Operational meaning of “runnable as SQL” = `sqlStringForRuntimeTransformer` can compile the tree to an expression over **this row’s columns**.

| Situation | Behavior |
|---|---|
| Query does not require the virtual name | No evaluation; SQL unchanged (`SELECT` of stored columns / `SELECT *` as today) |
| In-memory query requires the name | Evaluate the transformer on the instance (D3-a, D5-a′) |
| `runAsSql` query requires the name and the tree compiles | Expression in `SELECT` / `WHERE` / `ORDER BY`; **FROM remains A only** |
| `runAsSql` query requires the name and the tree does not compile | `QueryNotExecutable` (existing failure type) |

Stock TransformerDefinitions today: `runnableAsSql: true` = 0 of 45; 33 have a real SQL handler. The boolean is unused; D6 does not depend on back-filling it (#80).

### D7 — Generalized principle (not a single Entity)

**Status:** Accepted — D7′ (user, 2026-08-31).

The feature is: **any Entity may declare instance-local virtual attributes**. Implementation and tests use whatever Entity is convenient (Library Book is a valid instance-local example: `citation` from `name` + `year`). Designer `UserStoryList` remains in §3 as documentation of the **report-level JOIN workaround** — that pattern is **out of scope** for virtual attributes under D3-a (it needs Role rows).

| Option | Mechanism | Verdict |
|---|---|---|
| **D7′. General Entity attribute** ★ | Principle and tests are entity-agnostic | **Accepted** |
| D7-a. Designer UserStory.userStory as *the* tracer, including Role name | Move the JOIN mustache onto the Entity | **Rejected** with D3-b |
| D7-b. Invent an isolated dummy Entity | Extra meta-model surface | Unnecessary if an existing Entity has stored fields to combine |

---

## 1. Goals

1. **Entity-level computed attribute** — In order to define a derived value once with the Model, as a report designer, I can attach a transformer to an Entity attribute and list it in `viewAttributes` without copying a `runtimeTransformers` block into every Report.
2. **Details as well as lists** — In order to see the same derived value when opening an instance, as a report viewer, I can read the virtual attribute on `objectInstanceReportSection` (details) as a read-only field.
3. **Queries** — In order to filter, sort, and project derived values, as a query author, I can use the virtual attribute name in extractor `filter` / `orderBy` / `attributes` like a stored attribute. When the query runs as SQL and the transformer compiles, the store evaluates an expression on that entity’s row only.
4. **Actions and transformers** — In order to compose behaviour on derived values, as an action or transformer author, I can read a virtual attribute on instances returned by a Query that required that name.

## 2. Non-goals

- OCL-like **validation** transformers on Entity (#80).
- Ad-hoc per-section transformer panel (#246 / #249 / #251).
- Materialized / cached stored copies (rejected D4-b).
- Virtual attributes that need **other entities’ rows** (rejected D3-b/c). Cluster display stays Report extractors / combiners / `runtimeTransformers`.
- Recursively evaluating virtual attributes of FK targets.
- Tightening the unused `runnableAsSql` boolean on stock TransformerDefinitions (later; #80).
- Changing `viewAttributes` mechanics beyond listing a virtual name.
- Generating TypeScript types for application-entity virtual fields (instances remain JSON).
- Rewriting Designer UserStory reports to drop their Role fetch (they still need Role **rows** for the formatted sentence).

---

## 3. Current state

### 3.1 No virtual-attribute concept (**misaligned with the issue**)

Entity present-model keys (`16dbfe28-…` `mlSchema.definition`): `storageAccess`, `selfApplication`, `name`, `author`, `description`, `defaultInstanceDetailsReportUuid`, `viewAttributes`, `icon`, `display`, `cache`, `idAttribute`, `externalDataSource`, `scope`, `logicalDataModel`, `mlSchema`. **No virtual-attribute field.**

`jzodBaseObject.tag.value` keys: `id`, `defaultLabel`, `description`, `editorButton`, `initializeTo`, `isBlob`, `foreignKeyParams`, `canBeTemplate`, `isTemplate`, `display`, `formValidation`, `ifThenElseMMLS`. **No `virtual` / `compute` key.**

Closest existing “transformer on an attribute”:

| Tag | When it runs | Persisted? |
|---|---|---|
| `initializeTo.transformer` | Default value at **create** (`getDefaultValueForJzodSchemaWithResolution`, `TransformersForRuntime.ts`) | Yes, once written |
| `editorButton.transformer` | UI button on the editor | N/A |
| `display.hidden` as transformer | Whether the field is hidden | N/A |
| Report `runtimeTransformers` | After extractors/combiners in `runQuery` | Overlay on a **query context entry**, not an Entity attribute |

`initializeTo` is **not** a virtual attribute: it seeds stored data.

### 3.2 Report-level derived columns (**workaround, not the feature**)

Some reports compute extra fields by fetching **other** entities, then `mapList` + `mergeIntoObject` into each row, then pointing `fetchedDataReference` at the transformer output. Designer `UserStoryList` (`7f037bbb-…`) is one copy: extractors `userStories` + `roles`; RT `rolesIndex` + `userStoriesWithUserStory`; list binds the RT. The same formatting block is duplicated on ActivityDetails (`27204998-…`) and DesignerApplicationDetails (`f730ecf1-…`). UserStoryDetails (`ee31f325-…`) does **not** run it.

That workaround needs Role **rows**. Under D3-a it is **not** a virtual-attribute candidate. It stays a Report query. Virtual attributes cover the other class of extra columns: values computable from **one row** (e.g. concatenate stored strings/numbers on Book).

UserStory Entity (`59debf06-…`) still has a dummy optional `userStory` string in `mlSchema` + `viewAttributes`, `display.editable: false`, **no transformer**. Five stored instances **omit** `userStory`. Postgres would still create a nullable column from `mlSchema` (D4 gap).

### 3.3 Lists vs details for dummy schema fields (**partially aligned**)

List columns (`getMDataGridColumnDefinitionsFromEntity`): `viewAttributes` if set, else all `mlSchema.definition` keys. Schema = `entityMLSchema(entity)` (`ReportSectionListDisplay.tsx`). A dummy optional field appears as a column; the cell is empty unless a report RT filled the key.

Details (`ReportSectionEntityInstance.tsx`): TVOE schema = `entityWithResolvedMLSchema(entity).mlSchema`; value = raw fetched instance. `display.editable === false` → read-only (`JzodElementEditor.tsx`). Empty if never computed.

### 3.4 Queries treat attribute names as stored columns (**misaligned for virtual**)

`ExtractorInstancesByEntity.filter` / `orderBy` take `attributeName: string`.

In-memory (`instanceMatchesFilter`): `(instance as any)[filter.attributeName]` — works for a virtual name **only after lazy overlay when the filter requires it**.

SQL (`SqlGenerator.ts` `extractorInstancesByEntity`): `WHERE "${attributeName}" ILIKE …` — **column** access. Postgres tables are built from **every** `mlSchema.definition` key (`fromMiroirPresentModelToSequelizeEntityDefinition`). A dummy schema field becomes an empty stored column.

`runQuery` applies `runtimeTransformers` **after** extractors (`QuerySelectors.ts`) as named context entries, not as Entity attributes.

### 3.5 SQL transformer compilation already exists (**aligned, unused by Entity attributes**)

`sqlStringForRuntimeTransformer` dispatches on `sqlImplementationFunctionName`. Report RTs can run as SQL. Nothing compiles an **Entity virtual attribute** into a SELECT/WHERE **without adding tables**.

### 3.6 FK fetch for UI (**not used for virtual attributes**)

`analyzeForeignKeyAttributes` + list extractors load FK targets for `EntityInstanceCellRenderer`. That is **display of the FK column** (uuid → label), not a virtual attribute. D3-a does not reuse it for computation.

---

## 4. Key reuse

| Piece | Location |
|-------|----------|
| Attribute tags holding transformers | `jzodBaseObject.tag.value.initializeTo` / `editorButton.transformer` — uuid `1e8dab4b-65a3-4686-922e-ce89a2d62aa9` |
| Present-model Entity | uuid `16dbfe28-e1d7-4f20-9ba4-c1a9873202ad` |
| Transformer apply | `transformer_extended_apply` / `transformer_extended_apply_wrapper` |
| In-memory filter/sort | `ExtractorByEntityReturningObjectListTools.ts` |
| SQL transformer compiler | `SqlGenerator.ts` `sqlStringForRuntimeTransformer` |
| Sequelize column mapping (must skip virtual) | `fromMiroirPresentModelToSequelizeEntityDefinition` |
| mlSchema add/remove columns (must skip virtual) | `applyMlSchemaColumnChanges` |
| List columns from `viewAttributes` | `getMDataGridColumnDefinitionsFromEntity` |
| Details schema | `entityWithResolvedMLSchema` in `ReportSectionEntityInstance.tsx` |
| Partial fetch projection | `extractor.attributes` (#214) |
| Instance-local example Entity | Library Book `e8ba151b-d68e-4cc3-9a83-3459d309ccf5` (`name`, `year`, …) |
| BookList / BookDetails | `74b010b6-…` / `c3503412-…` |

---

## 5. Target design

| Required effect | Produced by |
|---|---|
| Extra list column without per-report RT | D1-a + `viewAttributes` + report engine requiring those names (D5-a′) + overlay |
| Details shows the value | Same required-set for `extractorByPrimaryKey` + read-only tag |
| Query filter/sort/project | D5-a′ overlay / D6′ SQL expression on **A only** |
| Actions / other transformers | D5-a′: they see the name if the Query required it |
| Not stored | D4-a strip + skip Sequelize / `alterEntityAttribute` |
| Query on A does not JOIN | D3-a + D6′ |
| Unused virtual attrs not computed | D5-a′: full extractors stay raw |

Identity fields from `entityDefinitionRoot` (`uuid`, `parentUuid`, …) are never virtual.

---

## Next step

Implementation proceeds per [`./tdd-implementation-plan.md`](./tdd-implementation-plan.md).
