# Plan: Composite PK Support for Miroir Entities (Issue #176)

## TL;DR

Extend the existing single-attribute `idAttribute` (delivered in Feature #173) to support composite primary keys by changing `idAttribute` from `string | undefined` to `string | string[] | undefined`. This impacts **every layer**: schema/types, core helpers, all 3 store backends, both local caches (Redux & Zustand), query/extractor/combiner layer, SQL generation, transformers, action types, REST API, and React UI. The critical design decision is the **composite key serialization strategy** — all layers that index by PK string must consistently serialize composite keys to a single canonical string.

---

## Context & Prerequisites

Feature #173 (non-UUID single-attribute PKs) is already partially implemented:
- `EntityPrimaryKey.ts` helpers exist (`getEntityPrimaryKeyAttribute`, `getInstancePrimaryKeyValue`, `entityHasUuidPrimaryKey`)
- All stores track `idAttribute` per entity (defaults to `"uuid"`)
- Redux/Zustand local caches create per-entity adapters with custom `selectId`
- Existing non-UUID entities: `columns` (column_name), `tables` (table_name), `schemata` (schema_name), `pg_namespace` (oid), `TestEntityCodeNumber` (code) — all single-attribute

The `columns` entity is a motivating example: it currently uses only `column_name` as PK, but columns are only unique within `(table_schema, table_name, column_name)`.

---

## Phase 1: Schema & Type Foundation

### 1.1 EntityDefinition Jzod Schema — change `idAttribute` type
- **File**: `packages/miroir-test-app_deployment-miroir/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/bdd7ad43-f0fc-4716-90c1-87454c40dd95.json` (EntityDefinition schema)
- **Change**: `idAttribute` from `{ "type": "string", "optional": true }` to a union: `{ "type": "union", "definition": [{ "type": "string" }, { "type": "array", "definition": { "type": "string" } }], "optional": true }`
- This makes `idAttribute` accept `string | string[]`

### 1.2 Regenerate TypeScript types
- Run `npm run build -w miroir-test-app_deployment-miroir`
- Run `npm run devBuild -w miroir-core`
- Produces updated `EntityDefinition` type with `idAttribute?: string | string[] | undefined`

### 1.3 Define composite key serialization strategy
- use `|` as separator with escaping: `key1|key2|key3`.
- Add to `packages/miroir-core/src/1_core/EntityPrimaryKey.ts`:
  - `getEntityPrimaryKeyAttributes(entityDefinition): string[]` — always returns array (wraps single string in array)
  - `getCompositeKeyValue(entityDefinition, instance): string` — returns serialized composite key
  - `parseCompositeKeyValue(entityDefinition, serializedKey): Record<string, string>` — reverse operation
  - Update `getInstancePrimaryKeyValue` to use composite serialization when `idAttribute` is an array
  - Update `getEntityPrimaryKeyAttribute` return type to `string | string[]` or deprecate in favor of `getEntityPrimaryKeyAttributes`

### 1.4 Update `EntityInstancesUuidIndex` naming (optional, cosmetic)
- The type `EntityInstancesUuidIndex` is `Record<string, EntityInstance>` — structurally already supports composite keys (the key is a serialized string). **No structural type change needed.**
- Consider renaming to `EntityInstancesIndex` across codebase (large but mechanical refactor, can be deferred).

**Verification**: `npm run devBuild -w miroir-core` succeeds; new helper functions have unit tests covering serialization round-trips.

---

## Phase 2: Store Backends

### 2.1 PostgreSQL Store

#### 2.1.1 Sequelize model creation — composite PRIMARY KEY
- **File**: `packages/miroir-store-postgres/src/utils.ts` — function `fromMiroirEntityDefinitionToSequelizeEntityDefinition()`
- **Current** (line 108): `primaryKey: a[0] == idAttribute` (single string comparison)
- **Change**: When `idAttribute` is `string[]`, set `primaryKey: true` for each attribute in the array: `primaryKey: Array.isArray(idAttribute) ? idAttribute.includes(a[0]) : a[0] == idAttribute`
- - Sequelize natively supports composite PKs when multiple columns have `primaryKey: true`

#### 2.1.2 `getInstance` — composite PK lookup
- **File**: `packages/miroir-store-postgres/src/4_services/sqlDbInstanceStoreSectionMixin.ts` (line 258)
- **Current**: `scopedModel.findByPk(instancePrimaryKey)` — Sequelize `findByPk` does NOT support composite keys
- **Change**: When entity has composite PK, use `findOne({ where: { col1: val1, col2: val2, ... } })` instead
- Deserialize the composite key string back to individual values using `parseCompositeKeyValue()`

#### 2.1.3 `deleteInstance` — composite WHERE clause
- **File**: `packages/miroir-store-postgres/src/4_services/sqlDbInstanceStoreSectionMixin.ts` (line 264)
- **Current**: `Model.destroy({ where: { [idAttribute]: value } })`
- **Change**: Build WHERE with all PK columns: `{ col1: val1, col2: val2, ... }`

#### 2.1.4 SQL Generator — WHERE/JOIN clauses
- **File**: `packages/miroir-store-postgres/src/1_core/SqlGenerator.ts`
- **`getIdAttributeForEntity()`** (line 75): Return type changes to `string | string[]`
- **`extractorForObjectByDirectReference`** (line 407): Currently generates `WHERE "${pkColumn}" = '${value}'` — must generate `WHERE "col1" = 'v1' AND "col2" = 'v2' AND ...` using `parseCompositeKeyValue()` to split the serialized `instanceUuid` value
- **`combinerForObjectByRelation`** (line 486): JOIN clause `WHERE "${parentName}"."${parentPkColumn}" = "${objectReference}"."${fkAttr}"` — needs multi-column JOIN: `WHERE p.col1 = r.fk_col1 AND p.col2 = r.fk_col2`
- **`combinerByRelationReturningObjectList`** (line 499): Same multi-column JOIN pattern
- **This is the most complex change** in this phase

#### 2.1.5 PK tracking map
- **File**: `packages/miroir-store-postgres/src/4_services/SqlDbStoreSection.ts` (line 94)
- `sqlSchemaTableAccess[entityUuid].idAttribute`: store `string | string[]` instead of `string`

### 2.2 Filesystem Store

- **File**: `packages/miroir-store-filesystem/src/4_services/FileSystemInstanceStoreSectionMixin.ts`
- **Current** (line 72, 134, 166): File path is `directory/entityUuid/{pkValue}.json` where `pkValue = String(instance[idAttribute])`
- **Change**: For composite PK, filename = serialized composite key
- **Warning**: Separator choice matters — filesystem-safe characters only. May need URL-encoding/base64-encoding of individual components.
- **File**: `packages/miroir-store-filesystem/src/4_services/FileSystemStoreSection.ts` — `entityIdAttributes` map stores `string | string[]`

### 2.3 IndexedDB Store

- **File**: `packages/miroir-store-indexedDb/src/4_services/IndexedDb.ts` (lines 207, 225, 240)
- **Current**: `store.put(pkValue, instance)` / `store.get(pkValue)` / `store.del(pkValue)`
- **Change**: Use serialized composite key string as the LevelDB key (via `getCompositeKeyValue()`)
- **File**: `packages/miroir-store-indexedDb/src/4_services/IndexedDbInstanceStoreSectionMixin.ts` (lines 116, 154) — update PK extraction to use composite serialization
- **File**: `packages/miroir-store-indexedDb/src/4_services/IndexedDbStoreSection.ts` — `entityIdAttributes` map type change

**Verification**: Integration tests (`DomainController.integ.nonUuidPK.CRUD.test.tsx` pattern) for each store with a composite-PK entity definition performing full CRUD cycle.

---

## Phase 3: Local Cache (Redux & Zustand)

### 3.1 Redux LocalCacheSlice

- **File**: `packages/miroir-localcache-redux/src/4_services/localCache/LocalCacheSlice.ts`

#### 3.1.1 EntityAdapter `selectId` for composite keys
- **Current** (line 211): `selectId: (entity) => String((entity as any)[idAttribute])`
- **Change**: When `idAttribute` is `string[]`, create `selectId` that serializes all PK attributes: `selectId: (entity) => idAttribute.map(attr => String((entity as any)[attr])).join(SEPARATOR)`
- Redux Toolkit's `EntityAdapter<EntityInstance, string>` uses string IDs — composite serialization to string works natively with no adapter API changes.

#### 3.1.2 `entityIdAttributeByIndex` map type
- **Current** (line 192): `Record<string, string>` (maps location index → single idAttribute name)
- **Change**: `Record<string, string | string[]>`

#### 3.1.3 CRUD operations
- **Delete** (line 545): `String((instance as any)[deleteIdAttribute])` → use `getCompositeKeyValue(entityDef, instance)` or inline composite serialization
- **Update** (line 593): Same pattern — use composite key for `id` in `updateOne()`
- **Create/Load**: `addOne`/`setAll` handled by adapter's `selectId` — no explicit change needed beyond adapter configuration

#### 3.1.4 `getEntityIdAttribute()` return type
- Changes from `() => string` to `() => string | string[]`

### 3.2 Zustand LocalCacheSlice

- **File**: `packages/miroir-localcache-zustand/src/4_services/localCache/LocalCacheSlice.ts`
- Same pattern as Redux: `addManyToEntityState()` (line ~174) uses `String((i as any)[idAttribute])` — change to composite serialization
- `idAttributeByIndex` map (line 104) and `getIdAttributeForIndex()` return type change

**Verification**: Unit tests in `packages/miroir-localcache-redux/tests/LocalCache.unit.test.ts` — add composite PK tests mirroring the existing "custom idAttribute" test suite (lines 296-560): bootstrap with composite-PK EntityDefinition, verify instances keyed by serialized composite keys, CRUD cycle.

---

## Phase 4: Query / Extractor / Combiner / Transformer Layer

### 4.1 Extractors

#### 4.1.1 `extractorForObjectByDirectReference` schema
- **Current**: `instanceUuid: string` (single PK value)
- **change**: keep `instanceUuid` as the serialized composite key string. Minimal schema change — callers serialize before passing.

#### 4.1.2 In-memory extractor execution
- **File**: `packages/miroir-core/src/2_domain/ExtractorRunnerInMemory.ts` (line ~240)
- `extractEntityInstanceByDirectReference()` calls `getInstance(entityUuid, instanceUuid)` — `instanceUuid` is already treated as opaque string PK. **No change needed** if composite keys are pre-serialized.

#### 4.1.3 SQL extractor execution
- **File**: `packages/miroir-store-postgres/src/1_core/SqlGenerator.ts` (line 407)
- **Change**: The SQL WHERE clause generation must detect composite PK and deserialize `instanceUuid` to generate multi-column WHERE. Handled in Phase 2.1.4 changes.

### 4.2 Combiners

#### 4.2.1 `combinerForObjectByRelation` — FK→PK join
- **Current**: Single FK attribute matches single PK column: `WHERE parent.pkCol = ref.fkAttr`
- **Change for composite PK targets**: Need multi-attribute FK → multi-column PK join
- **Schema change**: `AttributeOfObjectToCompareToReferenceUuid` type changes from `string` to `string | string[]` for composite FK→PK joins. Each string in the array maps positionally to the corresponding PK attribute.

#### 4.2.2 `combinerByRelationReturningObjectList`
- Same pattern — FK→PK join on potentially multiple columns

#### 4.2.3 In-memory combiner execution
- **File**: `packages/miroir-core/src/2_domain/QuerySelectors.ts`
- `applyExtractorForSingleObjectListToSelectedInstancesListInMemory()`: Currently filters by `(i as any)[localIndex] === otherIndex` — for composite PK, needs multi-attribute comparison: // All PK attributes must match
pkAttributes.every((attr, idx) => (i as any)[fkAttributes[idx]] === referenceObject[attr])

### 4.3 Instance Index Building

#### 4.3.1 `extractEntityInstanceUuidIndex` functions (~8 call sites)
- Files: `FileSystemExtractorRunner.ts`, `FileSystemExtractorTemplateRunner.ts`, `DomainStateMemoizedSelectors.ts` (Redux & Zustand), `SqlDbQueryTemplateRunner.ts`, `ReduxDeploymentsStateQuerySelectors.ts`, `ReduxDeploymentsStateQueryTemplateSelectors.ts`
- These functions build `Record<string, EntityInstance>` — keys are PK values
- **Change**: When building index, use composite serialization for keys (via `getCompositeKeyValue`)
- **Note**: The **hardcoded** `Object.fromEntries(result.map((i: any) => [i.uuid, i]))` pattern (if present) must use dynamic PK attribute extraction instead

#### 4.3.2 `EntityInstancesUuidIndex` type
- `Record<string, EntityInstance>` — string key works for serialized composite keys. **No structural type change.**

### 4.4 Transformers

#### 4.4.1 FK resolution in TransformersForRuntime.ts
- **File**: `packages/miroir-core/src/2_domain/TransformersForRuntime.ts` (line ~432)
- **Bug**: `Object.values(foreignKeyObjects)[0]?.uuid` — hardcodes `.uuid` for default FK value
- **Fix**: Use `getInstancePrimaryKeyValue(entityDef, instance)` instead of `.uuid`

#### 4.4.2 Other transformer handlers
- Most transformer handlers work on **values within instances** rather than instance keys — low impact
- Any handler doing `instance.uuid` access for PK purposes needs conversion

**Verification**: 
- Unit test: extractor with composite-PK `instanceUuid` (serialized) → correct instance returned
- Unit test: combiner JOIN on composite FK → composite PK
- Integration test: SQL generation for composite WHERE/JOIN produces valid SQL

---

## Phase 5: Action Types & Controllers

### 5.1 `getInstance` action payload
- **Current**: `{ uuid: string }` in the `getInstance` InstanceAction payload
- **Change**: Either rename to `{ primaryKeyValue: string }` (breaking) or keep `uuid` name accepting serialized composite key (non-breaking).
- **File**: Jzod schema for InstanceAction in `packages/miroir-core/src/assets/` (needs identification of exact file)

### 5.2 PersistenceStoreController interface
- **File**: `packages/miroir-core/src/0_interfaces/4-services/PersistenceStoreControllerInterface.ts`
- `getInstance(parentUuid: string, instancePrimaryKey: string)` — already uses opaque `instancePrimaryKey: string`. **No signature change needed.**

### 5.3 DomainController
- **File**: `packages/miroir-core/src/3_controllers/DomainController.ts`
- Delegates to PersistenceStoreController — no PK-aware logic. **Minimal change.**

### 5.4 REST API
- **File**: `packages/miroir-core/src/4_services/RestServer.ts`
- CRUD operations pass full instance objects in request body — PKs are inside the objects. **No URL structure change needed for create/update/delete.**
- `getInstance` GET requests: serialized composite key may need URL encoding if key contains special chars.

**Verification**: Action dispatch tests with composite PK entities (create, read, update, delete cycle).

---

## Phase 6: React UI Layer

### 6.1 Route parameters
- **File**: `packages/miroir-standalone-app/src/index.tsx` (line 169)
- Route: `report/:application/:deploymentUuid/:applicationSection/:reportUuid/:instanceUuid`
- Composite key in URL: needs URL encoding of the serialized key (e.g., `public%7Cusers%7Cid` for `public|users|id`)

### 6.2 React keys in lists
- **Files**: Components in `packages/miroir-react/src/` (EntityInstanceGrid, ReportSectionListDisplay, etc.)
- **Current**: `key={instance.uuid}` in list renders
- **Change**: Use `getInstancePrimaryKeyValue(entityDef, instance)` for React keys

### 6.3 Instance lookup from UuidIndex
- **File**: `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/EntityInstanceLink.tsx`
- **Current**: `instancesToDisplayUuidIndex[props.instanceUuid]`
- **Change**: Use serialized composite key for lookup — already works if index is built with composite keys in Phase 4.3

### 6.4 Foreign key display in grids
- FK columns show resolved entity names — FK resolution must handle composite FK values (multiple attributes → composite lookup)

**Verification**: Manual testing with composite-PK entity in the UI (list view, detail view, navigation).

---

## Impact Summary Matrix

| Layer | Files Impacted | Complexity | Blocking? |
|-------|---------------|-----------|-----------|
| **Jzod Schema + Types** | ~3 schema files + devBuild | Low | Yes (Phase 1) |
| **EntityPrimaryKey.ts helpers** | 1 file | Low | Yes (Phase 1) |
| **PostgreSQL store** | SqlGenerator.ts, sqlDbInstanceStoreSectionMixin.ts, utils.ts, SqlDbStoreSection.ts | **High** | Yes (Phase 2) |
| **FileSystem store** | FileSystemInstanceStoreSectionMixin.ts, FileSystemStoreSection.ts | Medium | *parallel with 2.1* |
| **IndexedDB store** | IndexedDb.ts, IndexedDbInstanceStoreSectionMixin.ts, IndexedDbStoreSection.ts | Medium | *parallel with 2.1* |
| **Redux LocalCache** | LocalCacheSlice.ts, DomainStateMemoizedSelectors.ts | Medium | Depends on Phase 1 |
| **Zustand LocalCache** | LocalCacheSlice.ts | Medium | *parallel with 3.1* |
| **Extractors (in-memory)** | ExtractorRunnerInMemory.ts, QuerySelectors.ts | Low-Medium | Depends on Phase 1 |
| **Extractors (SQL)** | SqlGenerator.ts (same file as 2.1.4) | **High** | Same as 2.1 |
| **Combiners** | QuerySelectors.ts, SqlGenerator.ts | **High** | Depends on FK schema decision |
| **Transformers** | TransformersForRuntime.ts | Low-Medium | Depends on Phase 1 |
| **Action Types** | Jzod schema + devBuild | Low | Depends on Phase 1 |
| **Controllers** | DomainController.ts, PersistenceStoreController | Low | Depends on Phase 5 |
| **REST API** | RestServer.ts | Low | Depends on Phase 5 |
| **React UI** | ~5-10 component files | Medium | Depends on all above |

---

## Key Files to Modify (Complete List)

### Core (miroir-core)
- `packages/miroir-test-app_deployment-miroir/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/bdd7ad43-f0fc-4716-90c1-87454c40dd95.json` — EntityDefinition Jzod schema (`idAttribute` type change)
- `packages/miroir-core/src/1_core/EntityPrimaryKey.ts` — composite key helpers (serialize/parse)
- `packages/miroir-core/src/0_interfaces/1_core/bootstrapJzodSchemas/getMiroirFundamentalJzodSchema.ts` — combiner schema if `AttributeOfObjectToCompareToReferenceUuid` changes
- `packages/miroir-core/src/2_domain/QuerySelectors.ts` — combiner execution, instance index building
- `packages/miroir-core/src/2_domain/ExtractorRunnerInMemory.ts` — in-memory extraction (minimal)
- `packages/miroir-core/src/2_domain/Templates.ts` — template resolution for composite `instanceUuid`
- `packages/miroir-core/src/2_domain/TransformersForRuntime.ts` — FK resolution fix (`.uuid` hardcoding)
- `packages/miroir-core/src/2_domain/ReduxDeploymentsStateQuerySelectors.ts` — selector wrappers

### PostgreSQL Store
- `packages/miroir-store-postgres/src/utils.ts` — Sequelize model creation (composite PRIMARY KEY)
- `packages/miroir-store-postgres/src/1_core/SqlGenerator.ts` — SQL WHERE/JOIN generation
- `packages/miroir-store-postgres/src/4_services/sqlDbInstanceStoreSectionMixin.ts` — CRUD operations
- `packages/miroir-store-postgres/src/4_services/SqlDbStoreSection.ts` — PK tracking map

### FileSystem Store
- `packages/miroir-store-filesystem/src/4_services/FileSystemInstanceStoreSectionMixin.ts` — file path from PK
- `packages/miroir-store-filesystem/src/4_services/FileSystemStoreSection.ts` — PK tracking map

### IndexedDB Store
- `packages/miroir-store-indexedDb/src/4_services/IndexedDb.ts` — key/value operations
- `packages/miroir-store-indexedDb/src/4_services/IndexedDbInstanceStoreSectionMixin.ts` — CRUD
- `packages/miroir-store-indexedDb/src/4_services/IndexedDbStoreSection.ts` — PK tracking map

### Local Cache
- `packages/miroir-localcache-redux/src/4_services/localCache/LocalCacheSlice.ts` — adapter creation, CRUD
- `packages/miroir-localcache-zustand/src/4_services/localCache/LocalCacheSlice.ts` — entity state management

### UI
- `packages/miroir-standalone-app/src/index.tsx` — route params
- `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/EntityInstanceLink.tsx` — navigation
- `packages/miroir-react/src/` — component key generation, FK display (multiple files)

### Tests (new)
- `packages/miroir-core/tests/` — unit tests for composite key serialization/parsing
- `packages/miroir-localcache-redux/tests/LocalCache.unit.test.ts` — composite PK CRUD tests
- `packages/miroir-standalone-app/tests/3_controllers/` — integration tests with composite-PK entities

---

## Decisions

1. **Composite key serialization**: Use `|` separator with individual value escaping (pipes in values escaped as `\|`).
2. **`idAttribute` type**: `string | string[] | undefined` (backward compatible — single string = single PK, array = composite, undefined = defaults to `"uuid"`)
3. **FK→composite PK joins**: `AttributeOfObjectToCompareToReferenceUuid` becomes `string | string[]` to map source FK attributes to target PK attributes positionally.
4. **Scope includes**: All layers from schema to UI.
5. **Scope excludes**: Renaming `EntityInstancesUuidIndex` → `EntityInstancesIndex` everywhere (cosmetic, large mechanical refactor, can be done separately).
6. **Meta-model entities** (Entity, EntityDefinition, Query, Report, etc.) remain UUID-only — composite PKs apply to application-level and external entities only.

---

## Further Considerations

1. **Separator choice for composite keys**: `|` is human-readable and compact. JSON serialization (`["v1","v2"]`) is unambiguous but adds parsing overhead. Null-byte (`\x00`) is cleanest but may cause issues in URLs and filesystem paths. SHA-256 hash gives fixed-length keys but loses reversibility (bad for debugging).

2. **Filesystem path safety**: Composite key values may contain characters invalid for filenames (`/`, `\`, `:`, etc.). Need URL-encoding or base64-encoding of individual components when used as filesystem paths. This adds complexity to `FileSystemInstanceStoreSectionMixin`.

3. **Foreign key representation for composite PKs**: For combiner JOINs, composite FKs should be stored as **separate attributes** on the source entity (e.g., `fk_schema`, `fk_table`, `fk_column`) with positional mapping to target PK attributes `["table_schema", "table_name", "column_name"]` via the `string[]` version of `AttributeOfObjectToCompareToReferenceUuid`.