# Issue #175 — TDD Implementation Plan

> Vertical TDD slices (RED → GREEN each), integration-first per `docs/contributing/testing.md`.
> The tests exercise the real DomainController, both local caches (redux, zustand), the real Postgres store on the `emulatedServer-sql` profile, and the emulated external-service scenarios.
> They go through the applicative interface: Entity JSON (`idAttribute: false`), the refresh action, Queries, Reports and the external-service sync.
> No mocks. The tracer bullet proves that a keyless External table can be refreshed twice and the cache then holds exactly the source's current rows, duplicates included.
>
> **Execution model:** human-in-the-loop. No slice contains a commit step: commits happen only when the user explicitly asks. Each slice ends with its Validation commands. On success, its Realization summary is appended and its Status flips to ✅ DONE.

Analysis: [`./analysis.md`](./analysis.md) · Issue: https://github.com/miroir-framework/miroir/issues/175
Prerequisites: #173 non-uuid PK ✅, #176 composite PK ✅
Working branch: `claude/project-thread-lq8utx` (from `_integration`)

**Resume note:** decisions confirmed with A (grilling, 2026-10-02). Implementation started 2026-10-02 on branch `claude/project-thread-lq8utx` (from `_integration`, with the analysis commits cherry-picked); one commit per slice.

---

## Scope

- Entity (and EntityVersion) `idAttribute: false`, allowed on External SQL and HTTP Entities only.
- Postgres store reads keyless External tables (no phantom `id` column).
- Redux and zustand caches keep every row of a keyless Entity (positional keys) and replace them wholesale on refresh.
- Query paths keep keyless rows (filters, ordering, virtual attributes) and reject key-based queries with an explicit error.
- DomainController rejects CUD on keyless Entities; grids show stable rows without edit, delete or details affordances.
- External-service sync writes `idAttribute: false` when the response has no `id`; keyless HTTP rows display read-only.
- Demo: keyless `pg_stat_activity` Entity, "Activity" Report and menu item in the Postgres app.

This plan does **not** cover: editing keyless rows; keyless Miroir-owned Entities (filesystem, IndexedDB, MongoDB, bundled); keys stable across refreshes (D3-b, deferred); the existing one-row segment fill from report `extractorByPrimaryKey` targets (#381).

---

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Characterize refresh replacement, keyless collapse, HTTP display keying | ✅ | cache vitests (redux, zustand), `fn.entityPrimaryKey`, HTTP display characterization |
| 1 | Tracer: refresh a keyless External SQL table twice (redux) | ✅ | `PkLessExternalEntity.integ.test.ts` |
| 2 | Model validation of `idAttribute: false` | ✅ | `fn.entityPrimaryKey` cases + deployments' modelValidation |
| 3 | Zustand cache parity | ⬜ | zustand vitest + phase1 integ on zustand |
| 4 | Queries keep keyless rows and refuse key-based lookups | ⬜ | `DomainStateQuerySelectors.pkLess.unit.test.ts` + phase1 integ |
| 5 | CUD on keyless Entities refused before touching the cache | ⬜ | phase1 integ, CUD cases |
| 6 | Grids: all rows, stable ids, no edit / delete / details | ⬜ | `listDisplayByTransformer.unit.test.ts` + grid component test |
| 7 | HTTP: sync writes `false` without `id`; keyless HTTP rows display | ⬜ | `tr.syncExternalServiceSchema` case + external-service scenario |
| 8 | Postgres app: `pg_stat_activity` demo | ⬜ | `miroir-example-postgres` modelValidation + phase1 integ |
| 9 | Nonreg, docs, cleanup, AC | ⬜ | nonreg step + tracer narrative |

---

## Locked implementation defaults

From the analysis decision record (confirmed). Deviations go into the slice's Realization.

| Decision | Choice |
|---|---|
| D0. Target sources | Rows can genuinely repeat. Sources unique on some columns keep a composite `idAttribute` |
| D1. Declaring "no PK" | `idAttribute: false`. ML: `{ "type": "boolean" }` added to the union; `true` rejected at validation |
| D2. Who may be keyless | `isSqlExternalEntity(entity) \|\| isHttpExternalEntity(entity)`, checked at model validation |
| D3. In-memory key | Positional `#<n>` per load batch, from one batch helper `getInstanceCacheKeys`; never stored on the row |
| D4. Refresh | Existing `setAll` + `rollback` replacement; no new action |
| D5. Key-based operations | CUD, `extractorByPrimaryKey`, `combinerOneToOne` targeting a keyless Entity → explicit error; UI hides edit, delete, details navigation |
| D6. Postgres read | `removeAttribute("id")` after `sequelize.define` for keyless Entities |
| D7. External-service sync | `"id"` when `responseSchema` is an object whose `definition` has `id`; otherwise `false` |
| D8. Demo | `pg_stat_activity` Entity + `ActivityList` Report + menu item |
| D9. Tests | sql-profile integ as primary proof (`requires: postgres`); unit tests on every profile; HTTP via emulated scenarios |

---

## Allocated UUIDs / keys

| Artefact | Value |
|---|---|
| Entity `pg_stat_activity` (Postgres app; `conceptLevel: "External"`, `externalDataSource: {schema: "pg_catalog"}`, `idAttribute: false`) | `7214c5a3-e5f4-4420-835f-fc2f9dc6a1d2` |
| Report `ActivityList` (Postgres app) | `3fcaedd8-97eb-4e97-ba5f-133b9abf80de` |
| Test-only External Entity `pk_less_rows` (table created by the integ test in schema `test_175`) | `22275459-d657-48cc-b72e-834e2ba3947c` |
| MiroirTest suites (extended, no new uuid) | `fn.entityPrimaryKey` (`7c11632c-…`), `tr.syncExternalServiceSchema` (`f4e5dde0-…`), `action.scenario.externalServiceSync` (`394242e7-…`) |
| Nonreg step | `integ-175-pk-less-external` (`requires: postgres`, scopes `actions`, `localcache`) |

---

## Test execution conventions

| Purpose | Command |
|---|---|
| PK helper MiroirTest (unit) | `npm run testMiroir -w miroir-core -- --suites fn.entityPrimaryKey --mode unit` |
| Sync transformer MiroirTest | `npm run testMiroir -w miroir-core -- --suites tr.syncExternalServiceSchema --mode unit` |
| External-service scenario | `npm run testMiroir -w miroir-standalone-app -- --suites action.scenario.externalServiceSync --mode integration` |
| Tracer integ (sql, needs PostgreSQL and `MIROIR_POSTGRES_PASSWORD`) | `MIROIR_ENV=test-sql RUN_TEST=pkLessExternalEntity.175.phase1 npm run testByFile -w miroir-standalone-app -- pkLessExternalEntity.175.phase1` |
| Redux cache vitest | `RUN_TEST=LocalCache.unit npm run testByFile -w miroir-localcache-redux -- LocalCache.unit` |
| Zustand cache vitest | `RUN_TEST=LocalCache.segments npm run testByFile -w miroir-localcache-zustand -- LocalCache.segments` |
| Query selectors vitest | `RUN_TEST=DomainStateQuerySelectors.pkLess npm run testByFile -w miroir-core -- DomainStateQuerySelectors.pkLess` |
| Postgres app validation | `npm run testByFile -w miroir-example-postgres -- tests/modelValidation.unit.test.ts` |
| Schema rebuild | `npm run build -w miroir-app-miroir && npm run devBuild -w miroir-core` |
| Type check | `npx tsc --noEmit --skipLibCheck -p packages/<pkg>/tsconfig.json` |
| Scoped nonreg (per slice) | `npm run nonreg:filesystem -- --runner shared --scope smoke,<scopes>` |
| Postgres steps | `npm run nonreg:default -- --runner shared --scope smoke,<scopes>` |
| Full nonreg (every 2 or 3 slices, final slice) | `npm run nonreg:filesystem -- --runner shared`, then `npm run nonreg:default -- --runner shared` |

**Vitest justifications**
- Cache tests (redux, zustand): reducer key handling is framework machinery, not reachable through MiroirTest.
- Tracer integ: it must create and mutate a keyless table with raw SQL between two refreshes; no MiroirTest step can.
- `DomainStateQuerySelectors.pkLess`: needs a keyless Entity in domain state, and MiroirTest deployments run on profiles where External SQL Entities cannot exist.
- Grid test: React component internals (`getRowId`, action buttons).

---

## Slice 0 — Characterize refresh replacement, keyless collapse, HTTP display keying

**Status:** ✅ DONE (committed with slice 1)

### Goal

Lock what must not change (refresh replaces; keyed rows are addressed by PK), record today's keyless collapse as the defect later slices fix, and pin where HTTP rows get keyed for display (analysis §3.6).

### 0.1 RED → GREEN — characterization

**Tests:**
- `miroir-localcache-redux/tests/LocalCache.unit.test.ts`, new `describe("refresh replacement (#175 characterization)")`.
- `miroir-localcache-zustand/tests/LocalCache.segments.unit.test.ts`, the same cases.

Behavior asserted, for each cache:
- Loading `[A, B]` then `[C]` for a keyed Entity (uuid, single non-uuid, composite) leaves exactly `[C]`.
- A full refresh (`loadNewInstancesInLocalCache` + `rollback`) leaves only the second batch.
- Known defect, asserted as current behaviour and marked `// #175: flips in slice 1/3`: three keyless rows collapse to one (redux keeps the first, zustand keeps the last with three `ids`), per analysis §3.2.

`fn.entityPrimaryKey`: lock `getEntityPrimaryKeyAttribute({}) === "uuid"` if not already covered.

### 0.2 HTTP display keying (investigation, recorded in Realization)

Trace how `action.scenario.externalServiceSync` rows go from `contextResults` to a list / API-call report section (`resolveApiCallReportSectionSchema.ts`, `listDisplayByTransformer.ts`, `EntityInstanceGrid.tsx`). Note every place that derives a key from the HTTP Entity, and add an assertion to the scenario if one locks the current keying cheaply. Slice 7 uses this list.

### Validation

**Nonreg scopes:** `smoke,localcache,core`, because only cache tests and a core MiroirTest asset change.

```bash
RUN_TEST=LocalCache.unit npm run testByFile -w miroir-localcache-redux -- LocalCache.unit
RUN_TEST=LocalCache.segments npm run testByFile -w miroir-localcache-zustand -- LocalCache.segments
npm run build -w miroir-app-miroir
npm run testMiroir -w miroir-core -- --suites fn.entityPrimaryKey --mode unit
npm run nonreg:filesystem -- --runner shared --scope smoke,localcache,core
```

### Realization

- Redux: `describe("LocalCache.unit.test - refresh replacement (#175)")` loads `[A, B]` then `[C]` for uuid, single non-uuid and composite PKs and asserts exactly `[C]` remains (green before any change).
- The keyless case was written directly as the target behaviour (three rows under `#0…#2`, replaced on reload) rather than as an assertion of today's collapse: it was red until slice 1, which is the same proof with less churn.
- Zustand characterization moved to slice 3, where its keyless case flips.
- `getEntityPrimaryKeyAttribute({}) === "uuid"` was already covered in `fn.entityPrimaryKey`.
- 0.2 (HTTP display keying) is done at the start of slice 7, where it is used.

---

## Slice 1 — Tracer: refresh a keyless External SQL table twice (redux)

**Status:** ✅ DONE

### Goal

An application designer declares `idAttribute: false` on an External SQL Entity. After each refresh, the redux cache holds exactly the table's current rows, duplicates included.

**Layers cut:** Entity JSON schema → generated type → `EntityPrimaryKey.ts` → Postgres store (Sequelize model) → DomainController refresh → redux cache.

### 1.1 RED

**Test:** `packages/miroir-standalone-app/tests/4_storage/issues/175-pk-less-entities/pkLessExternalEntity.175.phase1.integ.test.ts`, `MIROIR_ENV=test-sql`, redux cache.

Setup:
- Raw SQL: `CREATE SCHEMA test_175; CREATE TABLE test_175.pk_less_rows (label text, n int)`.
- Insert `('a',1),('a',1),('b',2)`.
- Deploy a test application whose model holds Entity `pk_less_rows` `22275459-…` with `conceptLevel: "External"`, `externalDataSource: {schema: "test_175"}`, `idAttribute: false`.

Behavior asserted:
- After refresh, `extractorInstancesByEntity` on `pk_less_rows` returns 3 rows, two of them `('a',1)`.
- After `DELETE … WHERE label='b'; INSERT ('c',3)` and a second refresh, it returns exactly `('a',1),('a',1),('c',3)`: no leftover `('b',2)`.

### 1.2 GREEN

- Entity `16dbfe28-…` and EntityVersion `54b9c72f-…` (and the `miroir_modelVersion` copies): add `{ "type": "boolean" }` to the `idAttribute` union; update its description ("`false`: instances have no primary key; External entities only, read-only"). Schema rebuild.
- `EntityPrimaryKey.ts`:
  - `EntityPrimaryKeySource.idAttribute` admits `boolean`;
  - add `entityHasNoPrimaryKey(source)` (`idAttribute === false`);
  - add `getInstanceCacheKeys(source, instances): string[]` (`#0…#n-1` when keyless, else `serializeCompositeKeyValue` per row);
  - `getEntityPrimaryKeyAttribute(s)` / `getInstancePrimaryKeyValue` throw `Action2Error` for keyless sources.
- Fix the compile errors this surfaces in the packages the tracer builds (`miroir-core`, `miroir-store-postgres`, `miroir-localcache-redux`), each by calling `entityHasNoPrimaryKey` or the batch helper. Record the full list in Realization.
- `miroir-store-postgres`:
  - `utils.fromMiroirPresentModelToSequelizeEntityDefinition`: no attribute is `primaryKey` for keyless Entities;
  - `SqlDbStoreSection.getAccessToDataSectionEntity`: `model.removeAttribute("id")` for keyless Entities.
- Redux `LocalCacheSlice.ts`: register keyless Entities in `getOrCreateEntityAdapter`; in `applyEntityInstancesToZone`, build `{ids, entities}` from `getInstanceCacheKeys` for keyless Entities instead of `adapter.setAll`, keeping the `segment` header.

### 1.3 Refactor checkpoint

- `applyEntityInstancesToZone` may use `getInstanceCacheKeys` for every Entity (no `selectId` path on load); keep that only if the redux tests stay green and the diff stays small.
- Analysis §3.1 `?? "uuid"` sites: each is fixed here (compiler) or noted as unreachable for keyless Entities.

### Validation

**Nonreg scopes:** `smoke,core,actions,localcache`, because the schema, the Postgres store and the redux cache change.

```bash
npm run build -w miroir-app-miroir && npm run devBuild -w miroir-core
npm run build -w miroir-localcache-redux -w miroir-store-postgres
MIROIR_ENV=test-sql RUN_TEST=pkLessExternalEntity.175.phase1 npm run testByFile -w miroir-standalone-app -- pkLessExternalEntity.175.phase1
RUN_TEST=LocalCache.unit npm run testByFile -w miroir-localcache-redux -- LocalCache.unit
npm run testMiroir -w miroir-core -- --suites fn.entityPrimaryKey --mode unit
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-localcache-redux/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-store-postgres/tsconfig.json
npm run nonreg:filesystem -- --runner shared --scope smoke,core,actions,localcache
npm run nonreg:default -- --runner shared --scope smoke,actions
```

### Realization

- Test written at its final place, `miroir-standalone-app/tests/4_storage/PkLessExternalEntity.integ.test.ts` (no issue directory to move in 9.3). It runs only when the Library deployment is on a sql store (`describe.skip` otherwise), uses plain `describe` (`describe.sequential` is broken by vitest 5, #379), creates `test_175.pk_less_rows` through `sequelize` (already a devDependency), and deploys the Entity with `resetAndinitializeDeploymentCompositeAction` filtered to it.
- Red before the fix: with the Sequelize model unchanged, the refresh fails with `column "id" does not exist` (checked by disabling `removeAttribute("id")`).
- Schema: `{ "type": "boolean" }` added to `idAttribute` in Entity, EntityVersion and both `miroir_modelVersion` copies; generated type is `string | string[] | boolean`.
- `EntityPrimaryKey.ts`: `entityHasNoPrimaryKey`, `POSITIONAL_KEY_PREFIX`, `getInstanceCacheKeys`, `indexInstancesByCacheKey`, `keylessEntityInstanceActionError`, `keylessEntityQueryFailure`. `getEntityPrimaryKeyAttribute(s)` and `getInstancePrimaryKeyValue` throw a plain `Error` for a boolean `idAttribute` (`Action2Error` is not an `Error` subclass, so throwing it gives no stack); `entityHasUuidPrimaryKey` returns false for keyless sources.
- `PersistenceStoreInstanceSectionAbstractInterface.getEntityIdAttribute` returns `string | string[] | false`.
- Sites fixed (compiler or `?? "uuid"` review):
  - `instanceProjection.resolveProjectionIdentityFields`: no PK identity field for keyless sources;
  - `ExtractorRunnerInMemory`, `SqlDbQueryRunner` (2 sites), `FileSystemExtractorRunner`: `indexInstancesByCacheKey` (the slice 4 change, needed here to compile);
  - `SqlGenerator.getIdAttributeForEntity` returns `false` for keyless entities; `extractorByPrimaryKey` returns `keylessEntityQueryFailure`, `combinerOneToOne` / `combinerOneToMany` throw it (slice 4 adds the tests);
  - `sqlDbInstanceStoreSectionMixin.deleteInstance` refuses keyless entities (External entities are already refused before);
  - `utils.fromMiroirPresentModelToSequelizeEntityDefinition`: no `primaryKey` attribute; `SqlDbStoreSection.getAccessToDataSectionEntity`: `removeAttribute("id")`;
  - filesystem, IndexedDB and bundled store sections ignore a boolean `idAttribute` (keyless entities are never stored there).
- Redux `LocalCacheSlice.ts`: keyless entities get a registered adapter whose `selectId` throws, `entityIdAttributeByIndex` holds `false`, `applyEntityInstancesToZone` builds `{ids, entities}` from `getInstanceCacheKeys`. Create, update and delete on a keyless entity return `keylessEntityInstanceActionError` before touching state (cache side of slice 5).
- Pre-existing failures, unchanged: the 6 "custom idAttribute" cases of `LocalCache.unit.test.ts` (memory note, `_integration`).

---

## Slice 2 — Model validation of `idAttribute: false`

**Status:** ✅ DONE (committed with slices 0 and 1)

### Goal

An application designer who writes `idAttribute: true`, or `idAttribute: false` on an Entity that is neither External SQL nor HTTP, gets a model-validation error naming the Entity.

**Layers cut:** Entity JSON → model validation (`miroir-core` `model-validation-fs` Entity checks) → deployments' `modelValidation` tests.

### 2.1 RED

- `fn.entityPrimaryKey`: `functionCallTest` cases on a check exported from `EntityPrimaryKey.ts` (e.g. `checkEntityPrimaryKeyDeclaration`): `false` on External SQL ✓; `false` on HTTP ✓; `false` on a Model Entity ✗; `true` anywhere ✗.
- Every deployment's `modelValidation` stays green (no existing Entity uses a boolean `idAttribute`).

### 2.2 GREEN

Implement the check, call it from the Entity checks in `buildModelValidationGroupsFromFilesystem`, whitelist it in `FunctionCallTestRegistry.ts`.

### 2.3 Refactor checkpoint

The check and `entityHasNoPrimaryKey` live together; no other module re-derives "is keyless".

### Validation

**Nonreg scopes:** `smoke,core`.

```bash
npm run build -w miroir-app-miroir && npm run build -w miroir-core
npm run testMiroir -w miroir-core -- --suites fn.entityPrimaryKey --mode unit
npm run testByFile -w miroir-example-postgres -- tests/modelValidation.unit.test.ts
npm run nonreg:filesystem -- --runner shared --scope smoke,core
```

### Realization

- `checkEntityPrimaryKeyDeclaration(entity): string[]` in `EntityPrimaryKey.ts` (empty when valid), whitelisted for `fn.entityPrimaryKey` (4 cases).
- `buildModelValidationGroupsFromFilesystem` has no per-entity hook, so the check runs in `checkModelValidationInstance` for every row whose `parentUuid` is the Entity meta-entity: all deployments' `modelValidation` steps and the in-memory `modelValidationSuite` get it.
- `miroir-core/tests/5-tests/modelValidation.entityPrimaryKey.unit.test.ts`: `false` accepted on External SQL and HTTP, rejected on a Model entity, `true` rejected, composite unchanged.
- Scoped nonreg (`smoke,core,actions,localcache`, filesystem, shared runner) after slice 1: 36 passed; the 3 `appstack-*Store*.integ` steps fail on `describe.sequential is not a function` (#379, same on `_integration`), and `unit-321-tracked-assets` failed only because the asset changes were not committed yet.

---

## Slice 3 — Zustand cache parity

**Status:** ⬜ pending

### Goal

The same refresh behaviour holds when the application runs on the zustand cache.

**Layers cut:** zustand `LocalCacheSlice.ts` (`registerPresentModelSourceInLocalCache`, `setAllInEntityState`, `addManyToEntityState`).

### 3.1 RED

- Flip the slice 0 zustand defect assertion: three keyless rows → three `ids`, three `entities`; a reload replaces them.
- Run the phase1 integ with the zustand cache (parameterized over both caches if the harness allows, else a second `describe`).

### 3.2 GREEN

- `setAllInEntityState` takes the registered source and uses `getInstanceCacheKeys`.
- `addManyToEntityState` is not reached for keyless Entities (CUD refused in slice 5); guard it with an error for keyless sources.

### 3.3 Refactor checkpoint

Analysis §3.2: both caches derive keys from `getInstanceCacheKeys`. Remove per-row key code in the zustand slice if it became dead.

### Validation

**Nonreg scopes:** `smoke,localcache`.

```bash
npm run build -w miroir-localcache-zustand
RUN_TEST=LocalCache.segments npm run testByFile -w miroir-localcache-zustand -- LocalCache.segments
MIROIR_ENV=test-sql RUN_TEST=pkLessExternalEntity.175.phase1 npm run testByFile -w miroir-standalone-app -- pkLessExternalEntity.175.phase1
npx tsc --noEmit --skipLibCheck -p packages/miroir-localcache-zustand/tsconfig.json
npm run nonreg:filesystem -- --runner shared --scope smoke,localcache
```

**Full nonreg checkpoint** after this slice: `npm run nonreg:filesystem -- --runner shared` and `npm run nonreg:default -- --runner shared`.

### Realization

---

## Slice 4 — Queries keep keyless rows and refuse key-based lookups

**Status:** ⬜ pending

### Goal

A report designer can filter, order and add virtual attributes to a keyless Entity's rows without losing any. An `extractorByPrimaryKey` or `combinerOneToOne` on such an Entity returns an explicit query error.

**Layers cut:** `2_domain` selectors and extractor runners (`ExtractorVirtualAttributes`, `ExtractorRunnerInMemory`, `ReduxDeploymentsStateQuerySelectors`, `DomainStateQuerySelectors`) → Postgres `SqlDbQueryRunner` → query result seen by the Report.

### 4.1 RED

- `miroir-core/tests/2_domain/DomainStateQuerySelectors.pkLess.unit.test.ts`, modelled on `DomainStateQuerySelectors.compositePk.unit.test.ts`:
  - 3 keyless rows (2 identical) with `orderBy` and with a filter → 3 rows;
  - with a virtual attribute → 3 rows;
  - `extractorByPrimaryKey` → `QueryFailed` naming the Entity.
- phase1 integ: the same query through the server-side `SqlDbQueryRunner` (sql profile) returns 3 rows.

### 4.2 GREEN

- `indexInstancesByPrimaryKey`: positional fallback when the Entity is keyless.
- `ExtractorRunnerInMemory.extractEntityInstanceUuidIndex` and `SqlDbQueryRunner` (L557-559, L628-630): use `getInstanceCacheKeys`.
- `extractorByPrimaryKey` / `combinerOneToOne` branches in the selectors and the SQL generator: query error for keyless targets.

### 4.3 Refactor checkpoint

Analysis §3.4 re-keying sites all use the batch helper. `FileSystemExtractorRunner` stays as-is (not reachable under D2) with a one-line comment.

### Validation

**Nonreg scopes:** `smoke,core,actions`.

```bash
npm run build -w miroir-core -w miroir-store-postgres
RUN_TEST=DomainStateQuerySelectors.pkLess npm run testByFile -w miroir-core -- DomainStateQuerySelectors.pkLess
MIROIR_ENV=test-sql RUN_TEST=pkLessExternalEntity.175.phase1 npm run testByFile -w miroir-standalone-app -- pkLessExternalEntity.175.phase1
npm run test -w miroir-core -- ''
npm run nonreg:filesystem -- --runner shared --scope smoke,core,actions
```

### Realization

---

## Slice 5 — CUD on keyless Entities refused before touching the cache

**Status:** ⬜ pending

### Goal

An MCP client or UI action that tries to create, update or delete a keyless instance gets an explicit error, and the cache is unchanged.

**Layers cut:** DomainController instance actions → local cache (untouched) → Postgres store (already refuses External CUD).

### 5.1 RED

phase1 integ: `createInstance`, `updateInstance` and `deleteInstance` on `pk_less_rows` each return `ActionError` with a keyless-specific message; the cache still holds the same 3 rows.

### 5.2 GREEN

DomainController instance-action entry: check `entityHasNoPrimaryKey` on the target Entity and return the error before any local-cache or store call.

### 5.3 Refactor checkpoint

If the Postgres store's External CUD refusal and this check overlap in wording, share the message constant.

### Validation

**Nonreg scopes:** `smoke,actions`.

```bash
npm run build -w miroir-core
MIROIR_ENV=test-sql RUN_TEST=pkLessExternalEntity.175.phase1 npm run testByFile -w miroir-standalone-app -- pkLessExternalEntity.175.phase1
npm run nonreg:filesystem -- --runner shared --scope smoke,actions
```

### Realization

---

## Slice 6 — Grids: all rows, stable ids, no edit / delete / details

**Status:** ⬜ pending

### Goal

A report viewer sees every keyless row on every page, with rows that stay stable across re-renders, and no edit, delete or details navigation.

**Layers cut:** `listDisplayByTransformer.ts` → `EntityInstanceGrid.tsx` (Glide and AG Grid) → `ReportSectionListDisplay.tsx`.

### 6.1 RED

- `miroir-standalone-app/tests/4_view/listDisplayByTransformer.unit.test.ts`: `sliceInstancesToPage` over 5 keyless rows (two identical), page size 2, returns 2, 2, 1 rows.
- Grid component test, following the existing `EntityInstanceGrid` tests, or the #286 React component MiroirTest pattern if it covers grids:
  - a keyless Entity renders without edit or delete buttons and without clickable PK columns;
  - `getRowId` returns the cache key, not `Math.random()`.

### 6.2 GREEN

- `sliceInstancesToPage` and `notifyDisplayedPageRowsChange` keep the incoming keys (`Object.entries`) instead of recomputing the PK.
- `getRowId` uses the key the row was indexed under in `instancesToDisplay`.
- `ReportSectionListDisplay` does not wire `onRowEdit` / `onRowDelete` for keyless Entities.
- `EntityInstanceGrid` has no clickable PK columns and no `handleRowOpenReport` for keyless Entities.

### 6.3 Refactor checkpoint

Analysis §3.7: `TableActionButtonComponents.tsx:31` (`instanceUuid ?? rawValue.uuid`) is no longer reached for keyless rows. Leave a note if it is still uuid-specific for keyed non-uuid Entities (pre-existing, out of scope).

### Validation

**Nonreg scopes:** `smoke,ui`.

```bash
RUN_TEST=listDisplayByTransformer npm run testByFile -w miroir-standalone-app -- listDisplayByTransformer
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
npm run nonreg:filesystem -- --runner shared --scope smoke,ui
```

**Full nonreg checkpoint** after this slice.

### Realization

---

## Slice 7 — HTTP: sync writes `false` without `id`; keyless HTTP rows display

**Status:** ⬜ pending

### Goal

An application designer connecting an API whose response has no `id` gets an HTTP Entity declared `idAttribute: false`, and its rows display read-only, duplicates included.

**Layers cut:** `syncExternalServiceSchema.ts` → HTTP Entity JSON → `contextResults` display path pinned in slice 0.2 → grid.

### 7.1 RED

- `tr.syncExternalServiceSchema`: new case with a response schema lacking `id` → the created Entity has `idAttribute: false`; the existing Spotify case keeps `"id"`.
- `action.scenario.externalServiceSync` (or a sibling scenario on the same emulated service): an operation returning rows without `id`, two of them identical, displays all rows through the report section.

### 7.2 GREEN

- `syncExternalServiceSchema.ts` L827: `idAttribute: responseSchemaHasId(responseSchema) ? "id" : false`.
- Keyed display sites found in slice 0.2: use `getInstanceCacheKeys` (or the slice 6 changes, if they already cover the path).

### 7.3 Refactor checkpoint

If slice 6 already covered the HTTP display path, record that and drop the duplicate change.

### Validation

**Nonreg scopes:** `smoke,external,ui`.

```bash
npm run build -w miroir-app-miroir && npm run build -w miroir-core
npm run testMiroir -w miroir-core -- --suites tr.syncExternalServiceSchema --mode unit
npm run testMiroir -w miroir-standalone-app -- --suites action.scenario.externalServiceSync --mode integration
npm run nonreg:filesystem -- --runner shared --scope smoke,external,ui
```

### Realization

---

## Slice 8 — Postgres app: `pg_stat_activity` demo

**Status:** ⬜ pending

### Goal

A Postgres app user opens "Activity" from the menu and sees the server's current sessions; refreshing shows the new set.

**Layers cut:** `miroir-example-postgres` assets (Entity, Report, Menu item).

### 8.1 RED

- phase1 integ: deploy the Postgres app on `test-sql`, refresh, and assert that `pg_stat_activity` returns at least one row (the test's own connection).
- `miroir-example-postgres` modelValidation (pure-data proof).

### 8.2 GREEN

- Entity `7214c5a3-…` `pg_stat_activity`:
  - `conceptLevel: "External"`, `externalDataSource: {schema: "pg_catalog"}`, `idAttribute: false`;
  - `mlSchema` columns `datname`, `usename`, `application_name`, `state`, `query`, all non-editable and optional (the view returns nulls).
- Report `3fcaedd8-…` `ActivityList` (`extractorInstancesByEntity`).
- Menu item in Menu `dd168e5a-…`.

### 8.3 Refactor checkpoint

None expected; record any Sequelize type-mapping surprise (e.g. `oid` or `inet` columns left out).

### Validation

**Nonreg scopes:** `smoke,core,ui`.

```bash
npm run build -w miroir-example-postgres
npm run testByFile -w miroir-example-postgres -- tests/modelValidation.unit.test.ts
MIROIR_ENV=test-sql RUN_TEST=pkLessExternalEntity.175.phase1 npm run testByFile -w miroir-standalone-app -- pkLessExternalEntity.175.phase1
npm run nonreg:filesystem -- --runner shared --scope smoke,core,ui
```

### Realization

---

## Slice 9 — Nonreg, docs, cleanup, AC

**Status:** ⬜ pending

### 9.1 Nonreg

- Add step `integ-175-pk-less-external` (`requires: postgres`, scopes `["actions","localcache"]`) to `scripts/nonreg-manifest.json`, running the moved integ file.
- Run `npm run nonreg:filesystem -- --runner shared` and `npm run nonreg:default -- --runner shared`.

### 9.2 Docs

- `docs/guides/developer/defining-entities.md`:
  - use case 6 becomes the how-to: `idAttribute: false`, External SQL / HTTP only, read-only, refresh semantics, the `pg_stat_activity` example;
  - the "Good to know" bullet and the use-case map;
  - note that sources unique on some columns use a composite `idAttribute` instead.
- `docs/reference/api/entity.md`: `idAttribute: false`.
- `analysis.md`: Status → implemented. Progress table all ✅.

### 9.3 Issue-directory cleanup

- Move `tests/4_storage/issues/175-pk-less-entities/pkLessExternalEntity.175.phase1.integ.test.ts` to `tests/4_storage/PkLessExternalEntity.integ.test.ts`, delete the issue directory (#238 rule), and drop "#175" from MiroirTest descriptions.
- Remove the slice 0 "known defect" comments (assertions already flipped).

### 9.4 Tracer bullet (narrative)

1. Start the server on an environment with the Postgres app deployed on a sql store, and open the client.
2. Postgres app → Activity: the current sessions are listed; none is editable or clickable.
3. Open a `psql` session and refresh: one more row appears. Close it and refresh: it disappears.

Automated equivalent: `PkLessExternalEntity.integ.test.ts` (two refreshes over `test_175.pk_less_rows`, plus the `pg_stat_activity` read).

### AC checklist (#175)

| Criterion | Proven by | Status |
|---|---|---|
| An Entity without PK can be represented, distinct from absent `idAttribute` | Slice 1 integ (`idAttribute: false` deployed and read) + slice 2 validation cases + slice 7 (HTTP) | ⬜ |
| On refresh, in-memory contents of a PK-less Entity are flushed, leaving only incoming rows | Slice 1 integ (second refresh, redux) + slice 3 (zustand) | ⬜ |
| Editing PK-less instances not required | Slice 5 (CUD refused) + slice 6 (no affordances) | ⬜ |
