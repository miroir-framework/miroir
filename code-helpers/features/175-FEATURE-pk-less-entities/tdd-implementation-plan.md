# Issue #175 — TDD Implementation Plan

> Vertical TDD slices (RED → GREEN each), integration-first per `docs/contributing/testing.md`.
> The tests exercise the real DomainController, both local caches (redux, zustand) and the real Postgres store on the `emulatedServer-sql` profile.
> They go through the applicative interface: Entity JSON (`primaryKey: "none"`), the refresh action, Queries and Reports.
> No mocks. The tracer bullet proves that a PK-less External table can be refreshed twice and the cache holds exactly the source's current rows, duplicates included.
>
> **Execution model:** human-in-the-loop. No slice contains a commit step: commits happen only when the user explicitly asks. Each slice ends with its Validation commands. On success, its Realization summary is appended and its Status flips to ✅ DONE.

Analysis: [`./analysis.md`](./analysis.md) · Issue: https://github.com/miroir-framework/miroir/issues/175
Prerequisites: #173 non-uuid PK ✅, #176 composite PK ✅
Working branch: `claude/project-thread-soh787` (from `_integration`)

**Resume note:** plan written against the analysis's **proposed** decisions; no slice started.

---

## Scope

- Entity (and EntityVersion) schema field `primaryKey: "none"`, exclusive with `idAttribute`, allowed on External SQL Entities only.
- Postgres store reads PK-less External tables (no phantom `id` column).
- Redux and zustand caches keep every row of a PK-less Entity (positional keys) and replace them wholesale on refresh.
- Query paths keep keyless rows (filters, ordering, virtual attributes), and reject key-based queries on PK-less Entities with an explicit error.
- DomainController rejects CUD on PK-less Entities; grids show stable rows, without edit, delete or details affordances.
- Example: PK-less `pg_stat_activity` Entity and list Report in the Postgres app.

This plan does **not** cover editing PK-less rows, PK-less Miroir-owned Entities (filesystem, IndexedDB, MongoDB, bundled), PK-less http Entities, or the existing one-row segment fill from report `extractorByPrimaryKey` targets (analysis §2).

---

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Characterize refresh replacement and current keyless collapse | ⬜ | `LocalCache.unit.test.ts` (redux), `LocalCache.segments.unit.test.ts` (zustand), `fn.entityPrimaryKey` |
| 1 | Tracer: refresh a PK-less External table twice (redux, sql) | ⬜ | `pkLessExternalEntity.175.phase1.integ.test.ts` |
| 2 | Model validation refuses invalid PK-less declarations | ⬜ | `fn.entityPrimaryKey` new cases + `miroir-example-postgres` modelValidation |
| 3 | Zustand cache parity | ⬜ | `LocalCache.segments.unit.test.ts` (zustand) + phase1 integ on zustand |
| 4 | Queries keep keyless rows and refuse key-based lookups | ⬜ | `DomainStateQuerySelectors.pkLess.unit.test.ts` + phase1 integ (`SqlDbQueryRunner`) |
| 5 | CUD on PK-less Entities is refused before touching the cache | ⬜ | phase1 integ, CUD cases |
| 6 | Grids: stable rows, no edit / delete / details affordances | ⬜ | `listDisplayByTransformer.unit.test.ts` + grid component test |
| 7 | Postgres app: `pg_stat_activity` Entity and Report | ⬜ | `miroir-example-postgres` modelValidation + phase1 integ reading it |
| 8 | Nonreg, docs, cleanup, AC | ⬜ | nonreg step + tracer narrative |

---

## Locked implementation defaults

From the analysis decision record, **pending A's confirmation**. Deviations go into the slice's Realization.

| Decision | Choice |
|---|---|
| D1. Declaring "no PK" | `primaryKey: "none"` (optional enum on Entity and EntityVersion), exclusive with `idAttribute` |
| D2. Who may be PK-less | External SQL Entities only (`isSqlExternalEntity`), checked at model validation |
| D3. Cache key for PK-less rows | Positional `#<n>` per load batch, computed by one batch helper `getInstanceCacheKeys`; never stored on the row |
| D4. Refresh | Existing `setAll` + `rollback` replacement; no new action |
| D5. Key-based operations | CUD, `extractorByPrimaryKey`, `combinerOneToOne` targeting a PK-less Entity → explicit error; UI hides edit, delete, details navigation |
| D6. Postgres read | `removeAttribute("id")` after `sequelize.define` for PK-less Entities |

---

## Allocated UUIDs / keys

| Artefact | Value |
|---|---|
| Entity `pg_stat_activity` (Postgres app, `conceptLevel: "External"`, `externalDataSource: {schema: "pg_catalog"}`, `primaryKey: "none"`) | `7214c5a3-e5f4-4420-835f-fc2f9dc6a1d2` |
| Report `ActivityList` (Postgres app) | `3fcaedd8-97eb-4e97-ba5f-133b9abf80de` |
| Test-only External Entity `pk_less_rows` (table created by the integ test in schema `test_175`) | `22275459-d657-48cc-b72e-834e2ba3947c` |
| MiroirTest suite (extended, no new uuid) | `fn.entityPrimaryKey` (`7c11632c-…`) |
| Nonreg step | `integ-175-pk-less-external` (`requires: postgres`, scopes `actions`, `localcache`) |

---

## Test execution conventions

| Purpose | Command |
|---|---|
| PK helper MiroirTest (unit) | `npm run testMiroir -w miroir-core -- --suites fn.entityPrimaryKey --mode unit` |
| Tracer integ (sql, needs PostgreSQL and `MIROIR_POSTGRES_PASSWORD`) | `MIROIR_ENV=test-sql RUN_TEST=pkLessExternalEntity.175.phase1 npm run testByFile -w miroir-standalone-app -- pkLessExternalEntity.175.phase1` |
| Redux cache vitest | `RUN_TEST=LocalCache.unit npm run testByFile -w miroir-localcache-redux -- LocalCache.unit` |
| Zustand cache vitest | `RUN_TEST=LocalCache.segments npm run testByFile -w miroir-localcache-zustand -- LocalCache.segments` |
| Query selectors vitest | `RUN_TEST=DomainStateQuerySelectors.pkLess npm run testByFile -w miroir-core -- DomainStateQuerySelectors.pkLess` |
| Postgres app validation | `npm run testByFile -w miroir-example-postgres -- tests/modelValidation.unit.test.ts` |
| Schema rebuild | `npm run build -w miroir-app-miroir && npm run devBuild -w miroir-core` |
| Type check | `npx tsc --noEmit --skipLibCheck -p packages/<pkg>/tsconfig.json` |
| Scoped nonreg (per slice) | `npm run nonreg:filesystem -- --runner shared --scope smoke,<scopes>` |
| Postgres steps | `npm run nonreg:default -- --runner shared --scope smoke,<scopes>` |
| Full nonreg (every 2 or 3 slices, final slice) | `npm run nonreg:filesystem -- --runner shared`, plus `npm run nonreg:default -- --runner shared` |

**Vitest justifications**
- Redux and zustand cache tests: the reducers' key handling is framework machinery not reachable through MiroirTest.
- Tracer integ: it must create and mutate a PK-less table with raw SQL between two refreshes, which no MiroirTest step can do.
- `DomainStateQuerySelectors.pkLess`: needs a PK-less Entity in domain state, and MiroirTest deployments run on profiles where External SQL Entities cannot exist (D2).
- Grid test: React component internals (`getRowId`, action buttons).

---

## Slice 0 — Characterize refresh replacement and current keyless collapse

**Status:** ⬜ pending

### Goal

Lock what must not change (refresh replaces, keyed rows are addressed by their PK) and record today's keyless collapse as the defect later slices fix.

### 0.1 RED → GREEN — characterization

**Tests:**
- `miroir-localcache-redux/tests/LocalCache.unit.test.ts`, new `describe("refresh replacement (#175 characterization)")`.
- `miroir-localcache-zustand/tests/LocalCache.segments.unit.test.ts`, the same cases.

Behavior asserted, for each cache:
- Loading `[A, B]` then `[C]` for a keyed Entity (uuid, single non-uuid, composite) leaves exactly `[C]` (D4 holds today).
- A full refresh (`loadNewInstancesInLocalCache` + `rollback`) leaves only the second batch.
- Known defect, asserted as current behaviour and marked `// #175: flips in slice 1/3`: three keyless rows collapse to one (redux keeps the first, zustand keeps the last with three `ids`), per analysis §3.2.

`fn.entityPrimaryKey`: add a case locking `getEntityPrimaryKeyAttribute({}) === "uuid"` if absent.

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

---

## Slice 1 — Tracer: refresh a PK-less External table twice (redux, sql)

**Status:** ⬜ pending

### Goal

An application designer can declare `primaryKey: "none"` on an External SQL Entity. After each refresh, the redux cache holds exactly the table's current rows, duplicates included.

**Layers cut:** Entity JSON schema → generated type → `EntityPrimaryKey.ts` → Postgres store (Sequelize model) → DomainController refresh → redux cache.

### 1.1 RED

**Test:** `packages/miroir-standalone-app/tests/4_storage/issues/175-pk-less-entities/pkLessExternalEntity.175.phase1.integ.test.ts`, `MIROIR_ENV=test-sql`, redux cache.

Setup:
- Raw SQL: `CREATE SCHEMA test_175; CREATE TABLE test_175.pk_less_rows (label text, n int)`.
- Insert `('a',1),('a',1),('b',2)`.
- Deploy a test application whose model holds Entity `pk_less_rows` `22275459-…` with `conceptLevel: "External"`, `externalDataSource: {schema: "test_175"}`, `primaryKey: "none"`.

Behavior asserted:
- After refresh, `extractorInstancesByEntity` on `pk_less_rows` returns 3 rows, two of them `('a',1)`.
- After `DELETE … WHERE label='b'; INSERT ('c',3)` and a second refresh, it returns exactly `('a',1),('a',1),('c',3)`: no leftover `('b',2)`.

### 1.2 GREEN

- Entity `16dbfe28-…` and EntityVersion `54b9c72f-…`: add optional `primaryKey: {type: "enum", definition: ["none"]}` (tag: defaultLabel "Primary Key", description "'none' declares instances without primary key (External SQL entities only, read-only)"). Then the schema rebuild.
- `EntityPrimaryKey.ts`:
  - add `entityHasNoPrimaryKey(source)`;
  - add `getInstanceCacheKeys(source, instances): string[]` (`#0…#n-1` when PK-less, else `serializeCompositeKeyValue` per row);
  - make `getEntityPrimaryKeyAttribute` / `getInstancePrimaryKeyValue` throw `Action2Error` for PK-less sources.
- `miroir-store-postgres` `SqlDbStoreSection.getAccessToDataSectionEntity`: call `model.removeAttribute("id")` when `entityHasNoPrimaryKey`. In `utils.fromMiroirPresentModelToSequelizeEntityDefinition`, mark no attribute as `primaryKey` for PK-less Entities instead of defaulting to `uuid`. Also guard `SqlDbStoreSection.getEntityIdAttribute`.
- Redux `LocalCacheSlice.ts`:
  - register PK-less Entities in `getOrCreateEntityAdapter`;
  - in `applyEntityInstancesToZone`, build `{ids, entities}` from `getInstanceCacheKeys` for PK-less Entities instead of `adapter.setAll`, keeping the `segment` header.

### 1.3 Refactor checkpoint

- `applyEntityInstancesToZone` could use `getInstanceCacheKeys` for every Entity (no `selectId` path on load); keep it only if the redux tests stay green and the diff stays small.
- List the remaining `?? "uuid"` defaults (analysis §3.1). Each one is either reached by a PK-less Entity (→ fix in its slice) or not (→ note why).

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

---

## Slice 2 — Model validation refuses invalid PK-less declarations

**Status:** ⬜ pending

### Goal

An application designer who writes `primaryKey: "none"` together with `idAttribute`, or on a non-External or http Entity, gets a model-validation error that names the Entity.

**Layers cut:** Entity JSON → model validation (`miroir-core` `model-validation-fs` / Entity checks) → deployment `modelValidation` tests.

### 2.1 RED

**Tests:**
- `fn.entityPrimaryKey`: new `functionCallTest` cases on a validation function exported from `EntityPrimaryKey.ts` (e.g. `checkEntityPrimaryKeyDeclaration`). Cases: valid PK-less External SQL; `primaryKey` + `idAttribute`; PK-less non-External; PK-less http.
- Every deployment's `modelValidation` stays green (no existing Entity declares `primaryKey`).

### 2.2 GREEN

- Implement the check and call it from the Entity checks in `buildModelValidationGroupsFromFilesystem`; whitelist it in `FunctionCallTestRegistry.ts`.

### 2.3 Refactor checkpoint

- The check and `entityHasNoPrimaryKey` live together; no other module re-derives "is PK-less".

### Validation

**Nonreg scopes:** `smoke,core`.

```bash
npm run build -w miroir-app-miroir && npm run build -w miroir-core
npm run testMiroir -w miroir-core -- --suites fn.entityPrimaryKey --mode unit
npm run testByFile -w miroir-example-postgres -- tests/modelValidation.unit.test.ts
npm run nonreg:filesystem -- --runner shared --scope smoke,core
```

### Realization

---

## Slice 3 — Zustand cache parity

**Status:** ⬜ pending

### Goal

The same refresh behaviour holds when the application runs on the zustand cache.

**Layers cut:** zustand `LocalCacheSlice.ts` (`registerPresentModelSourceInLocalCache`, `setAllInEntityState`, `addManyToEntityState`).

### 3.1 RED

- Flip the slice 0 zustand defect assertion: three keyless rows → three `ids`, three `entities`; a reload replaces them.
- Run the phase1 integ with the zustand cache, parameterized over both caches if the harness allows it; otherwise use a second `describe` block.

### 3.2 GREEN

- `setAllInEntityState` takes the registered source and uses `getInstanceCacheKeys`.
- `addManyToEntityState` is not reached for PK-less Entities (CUD refused in slice 5); add a guard throwing for PK-less sources.

### 3.3 Refactor checkpoint

- Analysis §3.2: both caches now derive keys from `getInstanceCacheKeys`. Remove duplicated per-row key code in the zustand slice if it became dead.

### Validation

**Nonreg scopes:** `smoke,localcache`.

```bash
npm run build -w miroir-localcache-zustand
RUN_TEST=LocalCache.segments npm run testByFile -w miroir-localcache-zustand -- LocalCache.segments
MIROIR_ENV=test-sql RUN_TEST=pkLessExternalEntity.175.phase1 npm run testByFile -w miroir-standalone-app -- pkLessExternalEntity.175.phase1
npx tsc --noEmit --skipLibCheck -p packages/miroir-localcache-zustand/tsconfig.json
npm run nonreg:filesystem -- --runner shared --scope smoke,localcache
```

**Full nonreg checkpoint:** run `npm run nonreg:filesystem -- --runner shared` after this slice.

### Realization

---

## Slice 4 — Queries keep keyless rows and refuse key-based lookups

**Status:** ⬜ pending

### Goal

A report designer can filter, order and add virtual attributes to a PK-less Entity's rows without losing any. An `extractorByPrimaryKey` or `combinerOneToOne` on such an Entity returns an explicit query error.

**Layers cut:** `2_domain` selectors and extractor runners (`ExtractorVirtualAttributes`, `ExtractorRunnerInMemory`, `ReduxDeploymentsStateQuerySelectors`, `DomainStateQuerySelectors`) → Postgres `SqlDbQueryRunner` → query result seen by the Report.

### 4.1 RED

- `miroir-core/tests/2_domain/DomainStateQuerySelectors.pkLess.unit.test.ts`, modelled on `DomainStateQuerySelectors.compositePk.unit.test.ts`:
  - 3 keyless rows with `orderBy` and with a filter → 3 rows;
  - with a virtual attribute → 3 rows;
  - `extractorByPrimaryKey` → `QueryFailed` naming the Entity.
- phase1 integ: the same query through the server-side `SqlDbQueryRunner` (sql profile) returns 3 rows.

### 4.2 GREEN

- `indexInstancesByPrimaryKey`: fall back to the positional key when the Entity is PK-less.
- `ExtractorRunnerInMemory.extractEntityInstanceUuidIndex` and `SqlDbQueryRunner` (L557-559, L628-630): use `getInstanceCacheKeys`.
- `extractorByPrimaryKey` / `combinerOneToOne` branches in the selectors and SQL generator: return a query error for PK-less targets.

### 4.3 Refactor checkpoint

- Analysis §3.4 re-keying sites: all use the batch helper. `FileSystemExtractorRunner` is left as-is (not reachable under D2) with a one-line comment.

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

## Slice 5 — CUD on PK-less Entities is refused before touching the cache

**Status:** ⬜ pending

### Goal

An MCP client or UI action trying to create, update or delete a PK-less instance gets an explicit error. The cache is unchanged.

**Layers cut:** DomainController instance actions → local cache (untouched) → Postgres store (already refuses External CUD).

### 5.1 RED

phase1 integ: `createInstance`, `updateInstance` and `deleteInstance` on `pk_less_rows` each return `ActionError` with a PK-less-specific message, and the cache still holds the same 3 rows.

### 5.2 GREEN

DomainController instance-action entry: check `entityHasNoPrimaryKey` on the target Entity and return the error before any local-cache or store call.

### 5.3 Refactor checkpoint

If the External-entity CUD refusal in the Postgres store and this check overlap in wording, share the message constant.

### Validation

**Nonreg scopes:** `smoke,actions`.

```bash
npm run build -w miroir-core
MIROIR_ENV=test-sql RUN_TEST=pkLessExternalEntity.175.phase1 npm run testByFile -w miroir-standalone-app -- pkLessExternalEntity.175.phase1
npm run nonreg:filesystem -- --runner shared --scope smoke,actions
```

### Realization

---

## Slice 6 — Grids: stable rows, no edit / delete / details affordances

**Status:** ⬜ pending

### Goal

A report viewer sees every keyless row on every page, with stable rows across re-renders. Rows have no edit, delete or details navigation.

**Layers cut:** `listDisplayByTransformer.ts` → `EntityInstanceGrid.tsx` (Glide and AG Grid) → `ReportSectionListDisplay.tsx`.

### 6.1 RED

- `miroir-standalone-app/tests/4_view/listDisplayByTransformer.unit.test.ts`: `sliceInstancesToPage` over 5 keyless rows (two identical), page size 2, returns 2, 2, 1 rows.
- Grid component test, following the existing `EntityInstanceGrid` tests or the #286 React component MiroirTest pattern if it covers grids:
  - rendering a PK-less Entity shows no edit or delete buttons and no clickable PK columns;
  - `getRowId` returns the cache key, not `Math.random()`.

### 6.2 GREEN

- `sliceInstancesToPage` and `notifyDisplayedPageRowsChange`: keep the incoming keys (`Object.entries`) instead of recomputing the PK.
- `getRowId`: use the row's cache key (the key it was indexed under in `instancesToDisplay`).
- `ReportSectionListDisplay`: do not wire `onRowEdit` / `onRowDelete` for PK-less Entities.
- `EntityInstanceGrid`: no clickable PK columns and no `handleRowOpenReport` for PK-less Entities.

### 6.3 Refactor checkpoint

- Analysis §3.6: `TableActionButtonComponents.tsx:31` (`instanceUuid ?? rawValue.uuid`) no longer reached for PK-less rows; leave a note if still uuid-specific for keyed non-uuid Entities (pre-existing, out of scope).

### Validation

**Nonreg scopes:** `smoke,ui`.

```bash
RUN_TEST=listDisplayByTransformer npm run testByFile -w miroir-standalone-app -- listDisplayByTransformer
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
npm run nonreg:filesystem -- --runner shared --scope smoke,ui
```

**Full nonreg checkpoint:** run `npm run nonreg:filesystem -- --runner shared` after this slice.

### Realization

---

## Slice 7 — Postgres app: `pg_stat_activity` Entity and Report

**Status:** ⬜ pending

### Goal

A Postgres app user opens "Activity" from the menu and sees the server's current sessions. Refreshing shows the new set.

**Layers cut:** `miroir-example-postgres` assets (Entity, Report, Menu item).

### 7.1 RED

- phase1 integ: deploy the Postgres app on `test-sql`, refresh, and assert that `pg_stat_activity` returns at least one row (the test's own connection).
- `miroir-example-postgres` modelValidation (pure-data proof).

### 7.2 GREEN

- Entity `7214c5a3-…` `pg_stat_activity`:
  - `conceptLevel: "External"`, `externalDataSource: {schema: "pg_catalog"}`, `primaryKey: "none"`;
  - `mlSchema` columns `datname`, `usename`, `application_name`, `state`, `query`, all non-editable and optional, since the view returns nulls.
- Report `3fcaedd8-…` `ActivityList` (`extractorInstancesByEntity`).
- Add the menu item to Menu `dd168e5a-…`.

### 7.3 Refactor checkpoint

None expected; record any Sequelize type mapping surprise (e.g. `oid`, `inet` columns left out).

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

## Slice 8 — Nonreg, docs, cleanup, AC

**Status:** ⬜ pending

### 8.1 Nonreg

- Add step `integ-175-pk-less-external` (`requires: postgres`, scopes `["actions","localcache"]`) to `scripts/nonreg-manifest.json`, running the moved integ file.
- Run `npm run nonreg:filesystem -- --runner shared` and `npm run nonreg:default -- --runner shared`.

### 8.2 Docs

- `docs/guides/developer/defining-entities.md`:
  - use case 6 becomes the real how-to (field, External-only rule, read-only behaviour, refresh semantics, `pg_stat_activity` example);
  - update the "Good to know" bullet and the use-case map.
- `docs/reference/api/entity.md`: the `primaryKey` field.
- `analysis.md`: Status → implemented. Progress table all ✅.

### 8.3 Issue-directory cleanup

- Move `tests/4_storage/issues/175-pk-less-entities/pkLessExternalEntity.175.phase1.integ.test.ts` to `tests/4_storage/PkLessExternalEntity.integ.test.ts`, then delete the issue directory (#238 rule). Drop "#175" from MiroirTest descriptions.
- Remove the slice 0 "known defect" comments (assertions already flipped).

### 8.4 Tracer bullet (narrative)

1. Start the server on an environment with the Postgres app deployed on a sql store, and open the client.
2. Postgres app → Activity: the current sessions are listed, none of them editable or clickable.
3. Open a `psql` session, then refresh: one more row appears. Close it and refresh: it disappears.

Automated equivalent: `PkLessExternalEntity.integ.test.ts` (two refreshes over `test_175.pk_less_rows`, plus the `pg_stat_activity` read).

### AC checklist (#175)

| Criterion | Proven by | Status |
|---|---|---|
| An Entity without PK can be represented, distinct from absent `idAttribute` | Slice 1 integ (Entity with `primaryKey: "none"` deployed and read) + slice 2 `fn.entityPrimaryKey` validation cases | ⬜ |
| On refresh, in-memory contents of a PK-less Entity are flushed, leaving only incoming rows | Slice 1 integ (second refresh, redux) + slice 3 (zustand) | ⬜ |
| Editing PK-less instances not required | Slice 5 (CUD refused) + slice 6 (no affordances) | ⬜ |
