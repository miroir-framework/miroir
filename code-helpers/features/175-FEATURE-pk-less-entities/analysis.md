# 175 — Entities and tables without a primary key

> Lets an External Entity (SQL table or view, or HTTP API operation) declare `idAttribute: false`, for sources whose rows can genuinely repeat.
> Rows of such an Entity are displayed read-only, duplicates included, and a refresh replaces all of them with the incoming rows.
> This analysis maps where Miroir assumes a key today and records the decisions agreed with A.

Related issue: https://github.com/miroir-framework/miroir/issues/175
Prerequisites: #173 non-uuid PK ✅, #176 composite PK ✅ (`idAttribute: string | string[]`, helpers in `EntityPrimaryKey.ts`)
Related plans: [`../173-FEATURE- enable non-uuid primary keys for Entities/plan.md`](../173-FEATURE-%20enable%20non-uuid%20primary%20keys%20for%20Entities/plan.md), [`../176-FEATURE- support tables & entities with composite PK/plan.md`](../176-FEATURE-%20support%20tables%20%26%20entities%20with%20composite%20PK/plan.md)
Key sources: [`EntityPrimaryKey.ts`](../../../packages/miroir-core/src/1_core/Entity/EntityPrimaryKey.ts), [`entityExternalDataSource.ts`](../../../packages/miroir-core/src/1_core/Entity/entityExternalDataSource.ts), [`LocalCacheSlice.ts` (redux)](../../../packages/miroir-localcache-redux/src/4_services/localCache/LocalCacheSlice.ts), [`LocalCacheSlice.ts` (zustand)](../../../packages/miroir-localcache-zustand/src/4_services/localCache/LocalCacheSlice.ts), [`utils.ts` (postgres)](../../../packages/miroir-store-postgres/src/utils.ts), [`syncExternalServiceSchema.ts`](../../../packages/miroir-core/src/2_domain/syncExternalServiceSchema.ts), [`EntityInstanceGrid.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Grids/EntityInstanceGrid.tsx)
User guide: [`docs/guides/developer/defining-entities.md`](../../../docs/guides/developer/defining-entities.md) (use case 6)

**Document role:** analysis and decision record.
**Status:** decisions **confirmed with A** (grilling, 2026-10-02). Implementation per [`tdd-implementation-plan.md`](./tdd-implementation-plan.md).

**Document history:** a first draft (commit 85aa9ee5) proposed a separate `primaryKey: "none"` field, External SQL only, and targeted sources unique on some columns. The grilling replaced all three; the rejected frames are kept below.

---

## Decision record

| Decision | Choice |
|---|---|
| D0. Which sources the feature is for | **D0-b. Sources whose rows can genuinely repeat** (logs, activity views, denormalized exports). Sources unique on some undeclared columns keep a composite `idAttribute` (#176) |
| D1. How an Entity declares "no PK" | **D1-e. `idAttribute: false`** (ML: `boolean` union member, `true` rejected at validation) |
| D2. Which Entities may be PK-less | **D2-b. External SQL and HTTP Entities**; rejected elsewhere at model validation |
| D3. Key used for PK-less rows in memory | **D3-a. Positional key `#<n>`** per load batch, from one batch helper; never stored on the row |
| D4. Refresh semantics | **D4-a. Existing wholesale replacement** (`setAll` + `rollback`) |
| D5. Key-based operations on PK-less Entities | **D5-a. Explicit error**; UI hides edit, delete and details navigation |
| D6. Postgres reading of a PK-less table | **D6-a. `model.removeAttribute("id")`** after `sequelize.define` |
| D7. What the external-service sync writes | **D7-a. `"id"` when the response schema has an `id` property, otherwise `false`** |
| D8. Demo | **D8-a. PK-less `pg_stat_activity` Entity, "Activity" Report and menu item in the Postgres app** |
| D9. Test vehicle | **D9-a. sql-profile integration tests as the primary proof** (nonreg step `requires: postgres`), plus cache, query and grid unit tests on every profile |

**Rationale:** the issue asks for display and refresh, not edition. Everything that identifies one row (CUD, details report, lookups by key) has no meaning without a key, so it fails explicitly rather than being emulated. The local cache and the selectors keep their `Record<key, instance>` shape; only key generation changes. Declaring the absence in `idAttribute` itself makes contradictory declarations impossible and lets the compiler find every site that assumes a key.

### D0 — Which sources the feature is for

**Status:** Accepted — D0-b.

| Option | Pros | Cons |
|---|---|---|
| D0-a. No declared PK, but rows unique on some columns | — | Already works with a composite `idAttribute` (Postgres app `tables`, `columns`, `schemata`); no new machinery needed |
| **D0-b. Rows can genuinely repeat** ★ | The case no current mechanism covers | Identical rows must all survive (drives D3) |

**Decision:** D0-b. A first answered a), then reverted to b). The user guide states that a) stays on composite `idAttribute`.

### D1 — How an Entity declares "no PK"

**Status:** Accepted — D1-e.

Absent `idAttribute` already means `uuid` (`getEntityPrimaryKeyAttribute`: `return source.idAttribute ?? "uuid";`), so absence cannot be reused.

| Option | Mechanism | Verdict |
|---|---|---|
| D1-a. Separate field `primaryKey: "none"` | Exclusive with `idAttribute` | **Rejected** (A): a `primaryKey: "none"` next to an `idAttribute` has no meaning; two fields make a contradictory state possible |
| D1-b. `idAttribute: []` | Empty composite key | **Rejected**: a key over zero columns means "every row has the same key"; `serializeCompositeKeyValue([], row)` would give `""` for every row; the type stays `string[]`, so the compiler finds no site |
| D1-c. `idAttribute: null` | Add `null` to the union | **Rejected**: every `idAttribute ?? "uuid"` silently turns `null` into `uuid`, with no compiler error |
| D1-d. `idAttribute: "none"` | Reserved string | **Rejected**: collides with a real column called `none`; invisible to the compiler |
| **D1-e. `idAttribute: false`** ★ | Union gains a `boolean` member (see below) | **Accepted**: one field, no contradiction possible; `false ?? "uuid"` stays `false`; every consumer typed `string \| string[]` fails to compile, which lists the sites to handle |

**ML encoding of `false`.** ML `literal` only admits strings (`MlLiteral.definition: string` in `miroirFundamentalType.ts`, `mlLiteral` in meta-schema `1e8dab4b-…`), so a `false` literal cannot be expressed as-is. Chosen: add `{ "type": "boolean" }` to the `idAttribute` union (generated type `string \| string[] \| boolean`) and reject `idAttribute: true` at model validation. Rejected: extending `MlLiteral` to booleans, a meta-model change whose blast radius (jzod adapter, type generation, editors) is out of proportion with this issue.

### D2 — Which Entities may be PK-less

**Status:** Accepted — D2-b.

"HTTP Entity": an Entity with `externalDataSource: { kind: "http", endpoint: <Endpoint uuid> }`, created by `syncExternalServiceSchema.ts` (one per GET operation). No store keeps its rows (`isHttpExternalEntity` checks in every store section). A query reads it through `extractorForExternalService`, whose raw API response is seeded into `contextResults` (`DomainController.resolveExtractorForExternalServiceInBoxedQuery`, around L3594) without keying.

| Option | Pros | Cons |
|---|---|---|
| D2-a. External SQL only | Smallest change | HTTP Entities keep the spurious `"id"` the sync hard-codes |
| **D2-b. External SQL and HTTP** ★ | Fixes the spurious key on both kinds of external source; HTTP side is display only (no cache, no store) | Display paths for HTTP rows must handle keyless rows too |
| D2-c. Any Entity | General | Filesystem, IndexedDB, MongoDB and bundled stores would need a keyless storage scheme for rows nobody can create through Miroir |

**Decision:** D2-b. Model validation rejects `idAttribute: false` unless `isSqlExternalEntity(entity) || isHttpExternalEntity(entity)`.

### D3 — Key used for PK-less rows in memory

**Status:** Accepted — D3-a.

| Option | Mechanism | Verdict |
|---|---|---|
| **D3-a. Positional `#<n>`** ★ | Row *n* of a load batch gets key `#n` (prefix keeps JS object key order equal to insertion order, unlike integer-like keys) | **Accepted**: simplest; keeps duplicates. Keys change when earlier rows change, so a grid may redraw rows after a refresh |
| D3-b. Content hash + occurrence `#k` | Hash of the row's values, plus the copy number among identical rows | **Deferred**: stable across refreshes for unchanged rows, at the cost of a hash per row per load. Can replace D3-a later behind the same helper |
| D3-c. Plain arrays for PK-less Entities | Segment holds `EntityInstance[]` | **Rejected**: every selector and grid expecting `{key → row}` would need a second code path |
| D3-d. Hidden `__rowKey` attribute on the row | — | **Rejected**: pollutes rows shown in grids, forms and exports |
| D3-e. Content hash only | — | **Rejected** with D0-b: identical rows collapse |

A column projection (a "partial" segment, `CacheSegmentKind = "full" \| "partial"` in `localCacheSegment.ts`) can make rows identical; positional keys keep them all, as SQL without `DISTINCT` would.

### D4 — Refresh semantics

**Status:** Accepted — D4-a. Both caches already replace, never merge (§3.3). The issue's "rows get duplicated, incoming rows don't override" symptom no longer reproduces for keyed Entities; for keyless rows the remaining defect is the collapse in §3.2.

| Option | Verdict |
|---|---|
| **D4-a. Reuse `setAll` + `rollback`** ★ | Accepted |
| D4-b. Explicit "flush" action for PK-less Entities | Rejected: duplicates existing behaviour |

### D5 — Key-based operations on PK-less Entities

**Status:** Accepted — D5-a.

| Operation | Today with a missing key | Agreed |
|---|---|---|
| create / update / delete instance | Postgres store already rejects CUD on External Entities (`upsertInstance` L569-575, `deleteInstance` L658 in `sqlDbInstanceStoreSectionMixin.ts`); the local cache would act on key `"undefined"` | DomainController rejects first, with a PK-less-specific error, so neither cache nor store is touched |
| `extractorByPrimaryKey` on a PK-less Entity | Silent miss (`entities["<value>"]`) | Explicit query error |
| `combinerOneToOne` targeting a PK-less Entity | Silent miss | Explicit query error. `combinerOneToMany` keeps working: it filters a list with `instanceMatchesForeignKey` and never uses the target's key |
| Grid row click to details report | Navigates with `String(undefined)` | No clickable PK columns, no details navigation |
| Grid edit / delete buttons | Present | Hidden |

### D6 — Postgres reading of a PK-less table

**Status:** Accepted — D6-a.

`fromMiroirPresentModelToSequelizeEntityDefinition` sets `primaryKey: pkAttributes.includes(a[0])`. With no PK attribute, Sequelize 6 `Model._addDefaultAttributes` (`node_modules/sequelize/lib/model.js:188-199`) injects `id INTEGER PRIMARY KEY`, so `findAll()` selects a column the view does not have; if the view has an `id` column, `define` throws `"A column called 'id' was added ... but not marked with 'primaryKey: true'"`.

| Option | Verdict |
|---|---|
| **D6-a. `removeAttribute("id")` after `define`** ★ | Accepted: Sequelize's documented way to model a table without PK; keeps `findAll`, filters and ordering in `sqlDbInstanceStoreSectionMixin.ts`. `findByPk` becomes unusable, which D5 does not need |
| D6-b. Raw `SELECT *` for PK-less Entities | Rejected: a second read path where filters and ordering must be re-implemented |

### D7 — What the external-service sync writes

**Status:** Accepted — D7-a.

`syncExternalServiceSchema.ts` (L815-833) creates each HTTP Entity with `idAttribute: "id"` and `mlSchema: responseSchema` (the converted schema of the operation's response).

| Option | Verdict |
|---|---|
| **D7-a. `"id"` when `responseSchema` is an object whose `definition` has `id`; otherwise `false`** ★ | Accepted: automatic and right in both cases; the designer can still edit the Entity |
| D7-b. Always `false` | Rejected: loses a real key when the API has one |
| D7-c. Ask in the connection wizard | Rejected: extra UI for a choice the schema already answers |

### D8 — Demo

**Status:** Accepted — D8-a. `pg_stat_activity` (`pg_catalog`) rows change between refreshes, so the replace-on-refresh behaviour is visible live.

### D9 — Test vehicle

**Status:** Accepted — D9-a. External SQL Entities only exist on the sql profile, so their end-to-end proof needs PostgreSQL: it runs under `nonreg:default`, not `nonreg:filesystem`. Cache, query and grid behaviour is also proven by unit tests on every profile; the HTTP side reuses the emulated external-service scenarios (no PostgreSQL).

---

## 1. Goals

1. **Browse a table whose rows can repeat** — In order to inspect data that has no identity (logs, activity views, denormalized exports), as an application designer, I can declare an External SQL Entity with `idAttribute: false` and list all its rows, duplicates included, in a Report.
2. **Trust what a refresh shows** — In order to see the source as it is now, as a report viewer, I get exactly the rows the source currently holds after a refresh: nothing left over from the previous load, no identical rows merged.
3. **Use APIs that return rows without ids** — In order to display an external API's results without inventing a key, as an application designer connecting an external service, I get HTTP Entities declared without key when the API's response has no `id`.
4. **Clear refusal of keyed operations** — In order to understand why an action is unavailable, as a report viewer or MCP client, I get no edit, delete or details affordance on keyless rows, and an explicit error if I call a key-based action or query on them.

## 2. Non-goals

- Editing, creating or deleting PK-less instances (issue: "doesn't need to be possible for the moment").
- PK-less Miroir-owned Entities in filesystem, IndexedDB, MongoDB or bundled stores (D2-c; later, unscheduled).
- Keys stable across refreshes (D3-b; deferred).
- Fixing the report-triggered `extractorByPrimaryKey` fill that replaces a whole segment with one row (§3.3, item 3): it affects keyed Entities and is owned by [#381](https://github.com/miroir-framework/miroir/issues/381).
- MongoDB custom PK support (`MongoDbStoreSection.ts:63`: `return "uuid"; // MongoDB store does not yet support custom PKs`).

## 3. Current state

### 3.1 Schema: no way to say "no key" (misaligned)

- Entity `16dbfe28-e1d7-4f20-9ba4-c1a9873202ad` (`miroir-app-miroir/assets/miroir_model/16dbfe28-…/16dbfe28-….json:194-215`) and EntityVersion `54b9c72f-d4f3-4db9-9e0e-0dc840b530bd` (`…/54b9c72f-….json:174-194`) declare `idAttribute` as an optional union `string | string[]`, described as "Defaults to 'uuid' when absent". The history copies in `miroir_modelVersion/54b9c72f-…/` carry the same definition.
- Generated type: `idAttribute?: (string | string[]) | undefined;` on `Entity` and `EntityVersion` in `miroirFundamentalType.ts`.

```typescript
// packages/miroir-core/src/1_core/Entity/EntityPrimaryKey.ts, getEntityPrimaryKeyAttribute
export function getEntityPrimaryKeyAttribute(source: EntityPrimaryKeySource): string | string[] {
  return source.idAttribute ?? "uuid";
}
```

- Other `?? "uuid"` defaults outside `miroir-core`: `SqlDbStoreSection.getEntityIdAttribute`, `SqlGenerator.getIdAttributeForEntity`, `utils.fromMiroirPresentModelToSequelizeEntityDefinition`. In `miroir-core`, `instanceProjection.resolveProjectionIdentityFields` defaults to `["uuid"]`. With D1-e the compiler lists them all once `EntityPrimaryKeySource.idAttribute` admits `false`.
- `docs/guides/developer/defining-entities.md` use case 6 states the feature is not implemented.

### 3.2 Local cache: keyless rows collapse (misaligned)

Redux (`miroir-localcache-redux/.../LocalCacheSlice.ts`):

```typescript
// L198, default adapter
const entityAdapter = createEntityAdapter<EntityInstance, string>({
  selectId: (entity) => entity.uuid!,
});
// getOrCreateEntityAdapter (L209-247), only when idAttribute && idAttribute !== "uuid":
//   selectId: (entity) => serializeCompositeKeyValue(pkAttrs, entity)
```

- `serializeCompositeKeyValue` returns `String(instance[attr])` for a single attribute, i.e. `"undefined"` when it is missing (`"undefined|undefined"` for composite keys).
- `applyEntityInstancesToZone` (L371-399) calls `adapter.setAll`. RTK's `setAll` clears the state, then `addMany`, which skips keys already present: **the first row of each key wins**.

Zustand (`miroir-localcache-zustand/.../LocalCacheSlice.ts`, `setAllInEntityState`, L192-198):

```typescript
return {
  ids: instances.map(i => serializeCompositeKeyValue(pkAttrs, i)),
  entities: Object.fromEntries(instances.map(i => [serializeCompositeKeyValue(pkAttrs, i), i]))
};
```

- **The last row of each key wins, and `ids` keeps the duplicates**, so `ids` and `entities` disagree.

Today, for a batch of 3 keyless rows A, B, C loaded into an Entity whose rows have no `uuid`:

| Cache | `ids` | `entities` |
|---|---|---|
| redux | `["undefined"]` | `{undefined: A}` |
| zustand | `["undefined","undefined","undefined"]` | `{undefined: C}` |

### 3.3 Refresh already replaces (aligned)

1. Full refresh, `DomainController.loadConfigurationFromPersistenceStore` (L603): per Entity, `fetchEntityInstances` (L740), then one `loadNewInstancesInLocalCache` (L925-939), then `rollback` (L941-952). `rollback` (redux `handleModelAction`, L849-866) drops the deployment's `current` keys and sets `current = {...rest, ...loading}`: full replacement.
2. Report-triggered fill, `createReportQueryLoadExecutor.ts` (L332-352): `loadNewInstancesInLocalCache` → `setAll` per segment on both zones, no merge.
3. Side effect (keyed Entities too): an `extractorByPrimaryKey` target pushes `instances: [instance]` (L283-289), and its `setAll` reduces the segment to that one row. Owned by #381 (§2).

### 3.4 Re-keying sites that collapse keyless rows (misaligned)

| Site | Code |
|---|---|
| `ExtractorVirtualAttributes.indexInstancesByPrimaryKey` (L103-118) | `keyByInstance.get(instance) ?? (entity ? getInstancePrimaryKeyValue(entity, instance) : instance.uuid!)`: rows copied by filters or virtual attributes fall back to the PK value |
| `ExtractorRunnerInMemory.extractEntityInstanceUuidIndex` (L420-440) | `Object.fromEntries(result.map(i => [serializeCompositeKeyValue(pkAttrs, i), i]))` |
| `SqlDbQueryRunner.ts` (L557-559, L628-630) | the same `Object.fromEntries` re-keying |
| `FileSystemExtractorRunner.ts` (L314-316) | the same; not reached under D2-b |
| `listDisplayByTransformer.sliceInstancesToPage` (L46-65) | `Object.fromEntries(pageRows.map(i => [getInstancePrimaryKeyValue(src, i), i]))`: one row per page survives |
| `EntityInstanceGrid.notifyDisplayedPageRowsChange` (L890-905) | `Object.fromEntries` keyed by PK |

The list paths (`ReduxDeploymentsStateQuerySelectors.selectEntityInstanceListFromReduxDeploymentsState`, `ExtractorRunnerInMemory.extractEntityInstanceList`) return `Object.values(...)` or the store's array and do not collapse by themselves; they only see what the cache kept.

### 3.5 Postgres store: no PK means a phantom `id` (misaligned)

- `utils.ts` L80-116: `const idAttribute = entity.idAttribute ?? "uuid"; … primaryKey: pkAttributes.includes(a[0])`.
- `SqlDbStoreSection.getAccessToDataSectionEntity` (L127-150): `sequelize.define(effectiveTableName, …, { freezeTableName: true, schema: effectiveSchema })`; nothing calls `removeAttribute("id")`.
- External reads: `getInstances` → `scopedModel.findAll()` (`sqlDbInstanceStoreSectionMixin.ts` L474-500).

### 3.6 HTTP Entities: hard-coded key (misaligned)

- `syncExternalServiceSchema.ts` L815-833 writes `idAttribute: "id"` whatever the response schema.
- HTTP rows reach the UI through query `contextResults` and the list / API-call report sections (`resolveApiCallReportSectionSchema.ts`, `listDisplayByTransformer.ts`). Where these display paths derive a key from the Entity is pinned by the plan's Slice 0 characterization.

### 3.7 UI (misaligned)

| Site | Behaviour with keyless rows |
|---|---|
| `EntityInstanceGrid.tsx` AG Grid `getRowId` (L1113-1117) | `rawValue.uuid ?? rawValue.id ?? Math.random()`: unstable ids, rows re-created on each render |
| `EntityInstanceGrid.tsx` clickable columns (Glide L704-726, AG Grid L808-830) | `["name", ...pkAttributes]` → navigates to `defaultInstanceDetailsReportUuid` with `String(primaryKeyValue)` |
| `EntityInstanceGrid.handleRowOpenReport` (L523) | `getInstancePrimaryKeyValue(...)` → `"undefined"` |
| `ReportSectionListDisplay.tsx` `onRowEdit` / `onRowDelete` (L965-966) | Edit and delete always wired |
| `TableActionButtonComponents.tsx:31` | `instanceUuid ?? row.rawValue.uuid` |

### 3.8 Existing External SQL Entities (aligned, keyed)

Enumerated from `miroir-example-postgres/assets/postgres_model/16dbfe28-…/`: all three are `conceptLevel: "External"`, `externalDataSource: {schema: "information_schema"}`, `cache.cacheAllInstancesOnRefresh: true`.

| Entity | uuid | `idAttribute` |
|---|---|---|
| `tables` | `35961086-f932-477a-aa77-ac8360ffbf61` | `["table_catalog","table_schema","table_name"]` |
| `columns` | `39e5c7a1-3f82-4bda-b8c4-2d576f9f10ae` | `["table_catalog","table_schema","table_name","column_name"]` |
| `schemata` | `cbc94d62-d2e5-4bc2-8aef-45efcfbd0af6` | `["catalog_name","schema_name"]` |

Reports in `3f2baa83-…`: `TableList` `d60cb239-a0ef-44f7-b5e9-d9160b210a71`, `ColumnList` `5f8c2d19-7b3e-4a61-9d05-6e4b83f1c7a2`, `SchemaList` `d74c20b6-6e84-4b56-ae01-34f6a472af3d`, `TableDetails` `7c80d9ec-35b2-4cb8-8164-c5fe4e20687f`, `SchemaDetails` `a72bb361-3126-4aa1-85cc-0be4d6838c84`. Menu `dd168e5a-2a21-4d2d-a443-032c6d15eb22`. These stay keyed (D0).

## 4. Key reuse

| Piece | Location |
|---|---|
| PK helpers (`getEntityPrimaryKeyAttribute(s)`, `serializeCompositeKeyValue`, `getInstancePrimaryKeyValue`) | `packages/miroir-core/src/1_core/Entity/EntityPrimaryKey.ts` |
| PK helper MiroirTest suite | `fn.entityPrimaryKey` (`miroir-app-miroir/assets/miroir_data/a311f363-…/7c11632c-….json`) |
| External predicates | `isSqlExternalEntity`, `isHttpExternalEntity` in `packages/miroir-core/src/1_core/Entity/entityExternalDataSource.ts` |
| Cache adapter registration per Entity | `getOrCreateEntityAdapter`, `registerEntityAdapterFromPresentModelSource` (redux); `registerPresentModelSourceInLocalCache`, `setAllInEntityState` (zustand) |
| Custom / composite PK cache tests | `miroir-localcache-redux/tests/LocalCache.unit.test.ts` ("custom idAttribute", L347+); `miroir-localcache-zustand/tests/LocalCache.segments.unit.test.ts` |
| Composite PK query test | `miroir-core/tests/2_domain/DomainStateQuerySelectors.compositePk.unit.test.ts` |
| External-service scenario and sync tests | `action.scenario.externalServiceSync` (`394242e7-….json`), `tr.syncExternalServiceSchema` (`f4e5dde0-….json`) |
| External Entity integration test | `miroir-standalone-app/tests/4_view/Runner_ExternalEntity.integ.test.tsx` |
| Model validation per deployment | `packages/miroir-example-postgres/tests/modelValidation.unit.test.ts` |

## 5. Implementation route

One batch helper, `getInstanceCacheKeys(source, instances): string[]` in `EntityPrimaryKey.ts`, returns the serialized PK per row for keyed Entities and `#0…#n-1` for `idAttribute: false`. Every site in §3.2 and §3.4 that keys a batch calls it instead of `serializeCompositeKeyValue` per row. Per-row helpers (`getInstancePrimaryKeyValue`) stay for keyed Entities and throw for PK-less ones, so a missed site fails visibly instead of collapsing rows silently.

| # | Piece | Impact | Effort |
|---|---|---|---|
| 1 | `idAttribute: false` in schema + validation (D1, D2) | high | low |
| 2 | Batch key helper used by both caches and the §3.4 sites (D3) | high | medium |
| 3 | `removeAttribute("id")` for PK-less Sequelize models (D6) | high: Postgres reads fail without it | low |
| 4 | DomainController and query paths reject key-based operations (D5) | medium | low |
| 5 | Grids: stable row ids, no PK-dependent affordances (D5) | medium | medium |
| 6 | Sync writes `false` when the response has no `id` (D7) | medium | low |
| 7 | `pg_stat_activity` demo (D8) | low | low |

---

## Next step

Implementation proceeds per [`./tdd-implementation-plan.md`](./tdd-implementation-plan.md).
