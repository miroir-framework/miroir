# 175 — Entities and tables without a primary key

> Lets an Entity declare that its instances have **no primary key**, typically an External SQL table or view with no natural key.
> Rows of such an Entity are displayed read-only, and a refresh replaces all of them with the incoming rows.
> This analysis maps where Miroir assumes a key today and records the decisions needed to relax that.

Related issue: https://github.com/miroir-framework/miroir/issues/175
Prerequisites: #173 non-uuid PK ✅, #176 composite PK ✅ (`idAttribute: string | string[]`, helpers in `EntityPrimaryKey.ts`)
Related plans: [`../173-FEATURE- enable non-uuid primary keys for Entities/plan.md`](../173-FEATURE-%20enable%20non-uuid%20primary%20keys%20for%20Entities/plan.md), [`../176-FEATURE- support tables & entities with composite PK/plan.md`](../176-FEATURE-%20support%20tables%20%26%20entities%20with%20composite%20PK/plan.md)
Key sources: [`EntityPrimaryKey.ts`](../../../packages/miroir-core/src/1_core/Entity/EntityPrimaryKey.ts), [`LocalCacheSlice.ts` (redux)](../../../packages/miroir-localcache-redux/src/4_services/localCache/LocalCacheSlice.ts), [`LocalCacheSlice.ts` (zustand)](../../../packages/miroir-localcache-zustand/src/4_services/localCache/LocalCacheSlice.ts), [`utils.ts` (postgres)](../../../packages/miroir-store-postgres/src/utils.ts), [`EntityInstanceGrid.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Grids/EntityInstanceGrid.tsx)
User guide: [`docs/guides/developer/defining-entities.md`](../../../docs/guides/developer/defining-entities.md) (use case 6)

**Document role:** analysis and decision record.
**Status:** decisions **proposed**, awaiting confirmation by A. [`tdd-implementation-plan.md`](./tdd-implementation-plan.md) is written against the proposed choices.

---

## Decision record

| Decision | Proposed choice |
|---|---|
| D1. How an Entity declares "no PK" | **D1-a. New optional field `primaryKey: "none"` on Entity**, exclusive with `idAttribute` |
| D2. Which Entities may be PK-less | **D2-a. External SQL Entities only** (`isSqlExternalEntity`); rejected elsewhere at model validation |
| D3. Key used for PK-less rows inside the local cache | **D3-a. Positional synthetic key `#<n>`**, assigned per load batch, never stored on the row |
| D4. Refresh semantics | **D4-a. Wholesale replacement per segment**, reusing the existing `setAll` + `rollback` path |
| D5. Key-based operations on PK-less Entities | **D5-a. Rejected with an explicit error** (CUD, `extractorByPrimaryKey`, `combinerOneToOne` target); UI hides edit, delete and details navigation |
| D6. Postgres reading of a PK-less table | **D6-a. `model.removeAttribute("id")`** after `sequelize.define` |

**Rationale:** the issue asks for display and refresh, not edition. Everything that identifies one row (CUD, details report, lookups by key) has no meaning without a key, so it is rejected rather than emulated. The local cache and the selectors keep their `Record<key, instance>` shape; only the key generation changes, which keeps the change local to `EntityPrimaryKey.ts` and the two cache slices.

### D1 — How an Entity declares "no PK"

**Status:** Proposed — D1-a.

Absent `idAttribute` already means `uuid` (`getEntityPrimaryKeyAttribute`: `return source.idAttribute ?? "uuid";`), so absence cannot be reused.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D1-a. `primaryKey: "none"`** ★ | New optional enum field on Entity (and EntityVersion), single value `"none"`; model validation rejects it together with `idAttribute` | Explicit, readable in JSON; leaves room for future values; no change to `idAttribute`'s type, so the ~15 `?? "uuid"` sites keep compiling | Two fields describe identity; needs a mutual-exclusion check |
| D1-b. `idAttribute: []` | Empty composite key | No schema change | Wrong semantics: a key over zero attributes means "at most one row"; easy to write by mistake |
| D1-c. `idAttribute: null` | Add `null` to the union | One field | Every `idAttribute ?? "uuid"` silently turns `null` into `uuid`: the most dangerous failure mode |
| D1-d. `idAttribute: "none"` sentinel | Reserved string | No schema change | Collides with a real column called `none`; invisible in the type |

**Decision:** D1-a. The field name is open to A's preference (`primaryKey`, `identity`, `keyless: true`).

### D2 — Which Entities may be PK-less

**Status:** Proposed — D2-a.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D2-a. External SQL only** ★ | Validation: `primaryKey: "none"` requires `isSqlExternalEntity(entity)` and not http | Matches the issue's motivating case; Miroir never writes these rows, so filesystem, IndexedDB, MongoDB and bundled stores need no key-less write path | A Miroir-owned PK-less Entity stays impossible |
| D2-b. Any Entity, read-only | All stores must store and read keyless rows | General | Filesystem writes one file per key value, IndexedDB keys by value, MongoDB maps `uuid` to `_id`: all need a new storage scheme for rows nobody can create through Miroir |
| D2-c. External SQL + http | Also allow http External Entities | Covers APIs without ids | http Entities never reach the local cache (`isHttpExternalEntity` skips storage in every store; data flows through `extractorForExternalService` query context), so the cache part of this issue does not apply to them |

**Decision:** D2-a. D2-c is deferred: http Entities generated by `syncExternalServiceSchema.ts` keep `idAttribute: "id"` until a real API without ids shows up.

### D3 — Key used for PK-less rows inside the local cache

**Status:** Proposed — D3-a.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D3-a. Positional key `#<n>`** ★ | When a batch is loaded, row *n* gets key `#n` (prefix keeps JS object key order = insertion order, unlike integer-like keys) | Duplicate rows survive (a PK-less table may legally hold identical rows); deterministic for a given batch; no field added to the row | Key is not stable across refreshes; only meaningful inside one segment snapshot |
| D3-b. Content hash | Key = hash of the row | Stable across refreshes | Identical rows collapse into one: wrong for PK-less tables |
| D3-c. Store arrays instead of `EntityState` | Segment holds `EntityInstance[]` | No fake key | Breaks the `{ids, entities}` contract every selector and the UI rely on; large blast radius |
| D3-d. Inject a hidden `__rowKey` attribute | Row carries its key | Survives re-keying | Pollutes instances shown in grids, forms and exports; must be stripped everywhere |

**Decision:** D3-a. Instability across refreshes is acceptable because nothing may address a PK-less row by key (D5).

### D4 — Refresh semantics

**Status:** Proposed — D4-a. Replacement is already what both caches do for every Entity; this issue only has to keep keyless rows from collapsing (§3.2), so no new refresh mechanism is introduced.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D4-a. Reuse `setAll` + `rollback`** ★ | Full refresh: `loadNewInstancesInLocalCache` then `rollback`; report-triggered fill: `setAll` per segment | Already replace-not-merge (§3.3) | — |
| D4-b. Explicit "flush" action for PK-less Entities | New local-cache action | Visible intent | Duplicates behaviour that already exists |

### D5 — Key-based operations on PK-less Entities

**Status:** Proposed — D5-a.

| Operation | Today with a missing key | Proposed |
|---|---|---|
| create / update / delete instance | Postgres store already rejects CUD on External Entities (`upsertInstance`, `deleteInstance` in `sqlDbInstanceStoreSectionMixin.ts`); local cache would act on key `"undefined"` | Unchanged at the store (already rejected); DomainController rejects earlier with a PK-less-specific error so the local cache is never touched |
| `extractorByPrimaryKey` on a PK-less Entity | Looks up `entities["<value>"]`: silent miss | Explicit query error |
| `combinerOneToOne` targeting a PK-less Entity | FK value looked up as a key: silent miss | Explicit query error. `combinerOneToMany` keeps working: it filters a list by `instanceMatchesForeignKey` and never uses the target's key |
| Grid row click to details report | Navigates with `String(undefined)` | No clickable PK columns; no details navigation |
| Grid edit / delete buttons | Present | Hidden |

### D6 — Postgres reading of a PK-less table

**Status:** Proposed — D6-a.

`fromMiroirPresentModelToSequelizeEntityDefinition` marks `primaryKey: pkAttributes.includes(a[0])`. With no PK attribute, Sequelize 6 `Model._addDefaultAttributes` (`node_modules/sequelize/lib/model.js:188-199`) injects `id INTEGER PRIMARY KEY`, so `findAll()` selects a column the view does not have; if the view has an `id` column, `define` throws `"A column called 'id' was added ... but not marked with 'primaryKey: true'"`.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D6-a. `removeAttribute("id")`** ★ | Called right after `sequelize.define` for PK-less Entities in `SqlDbStoreSection.getAccessToDataSectionEntity`; Sequelize's documented way to model tables without a PK | Keeps `findAll`, filters and ordering in `sqlDbInstanceStoreSectionMixin.ts` | `findByPk` unusable (not needed per D5) |
| D6-b. Raw `SELECT *` for PK-less Entities | Bypass Sequelize | No Sequelize quirk | Second read path to maintain; filters and ordering must be re-implemented |

---

## 1. Goals

1. **Browse a keyless table** — In order to inspect data that has no reliable identity (logs, activity views, denormalized exports), as an application designer, I can declare an External Entity with no primary key and list its rows in a Report.
2. **Trust what a refresh shows** — In order to see the table as it is now, as a report viewer, I get exactly the rows the source currently holds after a refresh, with no rows left over from the previous load and no duplicate rows merged away.
3. **Clear refusal of keyed operations** — In order to understand why an action is unavailable, as a report viewer or MCP client, I get no edit, delete or details affordance on keyless rows, and an explicit error if I call a key-based action or query on them.

## 2. Non-goals

- Editing, creating or deleting PK-less instances (issue: "doesn't need to be possible for the moment").
- PK-less Miroir-owned Entities stored in filesystem, IndexedDB, MongoDB or bundled stores (D2; later, unscheduled).
- PK-less http External Entities (D2-c; deferred).
- Fixing the existing report-triggered `extractorByPrimaryKey` fill, which replaces a whole segment with one row (§3.3, item 3); it affects keyed Entities and is out of this issue's scope.
- MongoDB custom PK support (`MongoDbStoreSection.ts:63`: `return "uuid"; // MongoDB store does not yet support custom PKs`).

## 3. Current state

### 3.1 Schema: no way to say "no key" (misaligned)

- Entity `16dbfe28-e1d7-4f20-9ba4-c1a9873202ad` (`miroir-app-miroir/assets/miroir_model/16dbfe28-…/16dbfe28-….json:194-215`) and EntityVersion `54b9c72f-d4f3-4db9-9e0e-0dc840b530bd` (`…/54b9c72f-….json:174-194`) declare `idAttribute` as an optional union `string | string[]`, described as "Defaults to 'uuid' when absent".
- Generated type: `idAttribute?: (string | string[]) | undefined;` on `Entity` and `EntityVersion` in `miroirFundamentalType.ts`.
- `EntityPrimaryKey.ts`:

```typescript
// packages/miroir-core/src/1_core/Entity/EntityPrimaryKey.ts, getEntityPrimaryKeyAttribute
export function getEntityPrimaryKeyAttribute(source: EntityPrimaryKeySource): string | string[] {
  return source.idAttribute ?? "uuid";
}
```

- Other `?? "uuid"` defaults: `SqlDbStoreSection.getEntityIdAttribute`, `SqlGenerator.getIdAttributeForEntity`, `utils.fromMiroirPresentModelToSequelizeEntityDefinition`, `instanceProjection.resolveProjectionIdentityFields` (defaults to `["uuid"]`).
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

- `serializeCompositeKeyValue` returns `String(instance[attr])`, i.e. `"undefined"` for a missing attribute (`"undefined|undefined"` for composite keys).
- `applyEntityInstancesToZone` (L371-399) calls `adapter.setAll`. RTK's `setAll` clears the state then `addMany`, which skips keys already present: **the first row of each key wins**.

Zustand (`miroir-localcache-zustand/.../LocalCacheSlice.ts`, `setAllInEntityState`, L192-198):

```typescript
return {
  ids: instances.map(i => serializeCompositeKeyValue(pkAttrs, i)),
  entities: Object.fromEntries(instances.map(i => [serializeCompositeKeyValue(pkAttrs, i), i]))
};
```

- **The last row of each key wins, and `ids` keeps duplicates**, so `ids` and `entities` disagree.

Truth table, today, for a batch of 3 keyless rows A, B, C loaded into an Entity with no `uuid` attribute:

| Cache | `ids` | `entities` |
|---|---|---|
| redux | `["undefined"]` | `{undefined: A}` |
| zustand | `["undefined","undefined","undefined"]` | `{undefined: C}` |

### 3.3 Refresh already replaces (aligned)

1. Full refresh, `DomainController.loadConfigurationFromPersistenceStore` (L603): per Entity, `fetchEntityInstances` (L740), then one `loadNewInstancesInLocalCache` (L925-939), then `rollback` (L941-952). `rollback` (redux `handleModelAction`, L849-866) drops the deployment's `current` keys and sets `current = {...rest, ...loading}`: full replacement.
2. Report-triggered fill, `createReportQueryLoadExecutor.ts` (L332-352): `loadNewInstancesInLocalCache` → `setAll` per segment on both zones, no merge.
3. Side effect (keyed Entities too): an `extractorByPrimaryKey` target pushes `instances: [instance]` (L283-289), and its `setAll` reduces the segment to that one row. Out of scope (§2).

So the issue's "rows get duplicated, incoming rows do not override previous ones" symptom no longer reproduces for keyed Entities. For keyless rows, the remaining defect is §3.2: they collapse instead of duplicating.

### 3.4 Re-keying sites that collapse keyless rows (misaligned)

| Site | Code |
|---|---|
| `ExtractorVirtualAttributes.indexInstancesByPrimaryKey` (L103-118) | `keyByInstance.get(instance) ?? (entity ? getInstancePrimaryKeyValue(entity, instance) : instance.uuid!)`. Rows copied by filters / virtual attributes fall back to the PK value |
| `ExtractorRunnerInMemory.extractEntityInstanceUuidIndex` (L420-440) | `Object.fromEntries(result.map(i => [serializeCompositeKeyValue(pkAttrs, i), i]))` |
| `SqlDbQueryRunner.ts` (L557-559, L628-630) | same `Object.fromEntries` re-keying |
| `FileSystemExtractorRunner.ts` (L314-316) | same (not reached under D2-a) |
| `listDisplayByTransformer.sliceInstancesToPage` (L46-65) | `Object.fromEntries(pageRows.map(i => [getInstancePrimaryKeyValue(src, i), i]))`: one row per page survives |
| `EntityInstanceGrid.notifyDisplayedPageRowsChange` (L890-905) | `Object.fromEntries` keyed by PK |

`extractEntityInstanceList` paths (`ReduxDeploymentsStateQuerySelectors.selectEntityInstanceListFromReduxDeploymentsState`, `ExtractorRunnerInMemory.extractEntityInstanceList`) return `Object.values(...)` or the store's array and do not collapse by themselves; they only see what the cache kept.

### 3.5 Postgres store: no PK means a phantom `id` (misaligned)

- `utils.ts` L80-116: `const idAttribute = entity.idAttribute ?? "uuid"; … primaryKey: pkAttributes.includes(a[0])`.
- `SqlDbStoreSection.getAccessToDataSectionEntity` (L127-150): `sequelize.define(effectiveTableName, …, { freezeTableName: true, schema: effectiveSchema })`; nothing calls `removeAttribute("id")`.
- Sequelize behaviour: see D6.
- External reads: `getInstances` → `scopedModel.findAll()` (`sqlDbInstanceStoreSectionMixin.ts` L474-500). CUD on External Entities is already rejected (`upsertInstance` L569-575, `deleteInstance` L658).

### 3.6 UI (misaligned)

| Site | Behaviour with keyless rows |
|---|---|
| `EntityInstanceGrid.tsx` AG Grid `getRowId` (L1113-1117) | `rawValue.uuid ?? rawValue.id ?? Math.random()`: unstable ids, rows re-created on each render |
| `EntityInstanceGrid.tsx` clickable columns (Glide L704-726, AG L808-830) | `["name", ...pkAttributes]` → navigates to `defaultInstanceDetailsReportUuid` with `String(primaryKeyValue)` |
| `EntityInstanceGrid.handleRowOpenReport` (L523) | `getInstancePrimaryKeyValue(...)` → `"undefined"` |
| `ReportSectionListDisplay.tsx` `onRowEdit` / `onRowDelete` (L965-966) | Edit / delete always wired |
| `TableActionButtonComponents.tsx:31` | `instanceUuid ?? row.rawValue.uuid` |

### 3.7 Existing External SQL Entities (aligned, keyed)

Enumerated from `miroir-example-postgres/assets/postgres_model/16dbfe28-…/`: all three are `conceptLevel: "External"`, `externalDataSource: {schema: "information_schema"}`, `cache.cacheAllInstancesOnRefresh: true`.

| Entity | uuid | `idAttribute` |
|---|---|---|
| `tables` | `35961086-f932-477a-aa77-ac8360ffbf61` | `["table_catalog","table_schema","table_name"]` |
| `columns` | `39e5c7a1-3f82-4bda-b8c4-2d576f9f10ae` | `["table_catalog","table_schema","table_name","column_name"]` |
| `schemata` | `cbc94d62-d2e5-4bc2-8aef-45efcfbd0af6` | `["catalog_name","schema_name"]` |

Reports in `3f2baa83-…`: `TableList` `d60cb239-a0ef-44f7-b5e9-d9160b210a71`, `ColumnList` `5f8c2d19-7b3e-4a61-9d05-6e4b83f1c7a2`, `SchemaList` `d74c20b6-6e84-4b56-ae01-34f6a472af3d`, `TableDetails` `7c80d9ec-35b2-4cb8-8164-c5fe4e20687f`, `SchemaDetails` `a72bb361-3126-4aa1-85cc-0be4d6838c84`. None of these Entities is PK-less: the underlying views have no declared PK, but a natural composite key exists, which is the #176 workaround.

## 4. Key reuse

| Piece | Location |
|---|---|
| PK helpers (`getEntityPrimaryKeyAttribute(s)`, `serializeCompositeKeyValue`, `getInstancePrimaryKeyValue`) | `packages/miroir-core/src/1_core/Entity/EntityPrimaryKey.ts` |
| PK helper MiroirTest suite | `fn.entityPrimaryKey` (`miroir-app-miroir/assets/miroir_data/a311f363-…/7c11632c-….json`) |
| External SQL predicate | `isSqlExternalEntity`, `packages/miroir-core/src/1_core/Entity/entityExternalDataSource.ts:26` |
| Cache adapter registration per Entity | `getOrCreateEntityAdapter`, `registerEntityAdapterFromPresentModelSource` (redux); `registerPresentModelSourceInLocalCache`, `setAllInEntityState` (zustand) |
| Custom / composite PK cache tests | `miroir-localcache-redux/tests/LocalCache.unit.test.ts` ("custom idAttribute", L347+) |
| Composite PK CRUD MiroirTest | `action.domainController.dataCrud.compositePk` (`e2f4a306-….json`) |
| External Entity integration test | `miroir-standalone-app/tests/4_view/Runner_ExternalEntity.integ.test.tsx` |
| Model validation per deployment | `packages/miroir-example-postgres/tests/modelValidation.unit.test.ts` |
| Example External Entities and Reports | §3.7 |

## 5. Proposals

A single route follows from the decisions: introduce one helper, `getInstanceCacheKeys(source, instances): string[]` in `EntityPrimaryKey.ts` (serialized PK per row for keyed Entities, `#0…#n-1` for PK-less ones), and make every site in §3.2 and §3.4 that builds a key from a batch call it instead of `serializeCompositeKeyValue` per row. Per-row helpers (`getInstancePrimaryKeyValue`) stay for keyed Entities and throw for PK-less ones, which turns any missed site into a visible error instead of a silent collapse.

| # | Proposal | Impact | Effort | Verdict |
|---|---|---|---|---|
| 1 | Batch key helper + use in both caches and §3.4 re-keying sites | high | medium | adopt |
| 2 | `removeAttribute("id")` for PK-less Sequelize models | high (Postgres reads fail without it) | low | adopt |
| 3 | DomainController and query runners reject key-based operations on PK-less Entities | medium | low | adopt |
| 4 | Grid: stable row id from the cache key, hide PK-dependent affordances | medium | medium | adopt |
| 5 | Example PK-less Entity in the Postgres app (`pg_stat_activity`, whose rows change between refreshes) | low (demo) | low | adopt, as the tracer's manual check |

---

## Next step

Implementation proceeds per [`./tdd-implementation-plan.md`](./tdd-implementation-plan.md), written against the proposed decisions; the plan's locked defaults change if A amends a decision.
