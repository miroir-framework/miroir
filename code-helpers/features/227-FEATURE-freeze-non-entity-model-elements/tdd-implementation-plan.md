# Issue #227 — TDD Implementation Plan (QueryVersion tracer)

Follow-up to #225 / #216 D4 deferral.

GitHub issue: https://github.com/miroir-framework/miroir/issues/230
Analysis: [`analysis.md`](./analysis.md)

## Scope of this plan

**Detailed TDD** for the first slice: **QueryVersion** freeze.

Other element types (Report, Menu, Endpoint, …) follow the same phases with type-specific snapshot fields; only phase numbers and fixture paths change. See [Future slices](#future-slices--per-type-tdd-template).

**Status:** QueryVersion tracer **implemented** (unit-level, all tests green). Integ test, UI listing, and Jzod type regeneration deferred — see [Realization](#realization--queryversion-tracer-what-was-built).

---

## Progress summary

| Phase | Title | Status | Tests |
|---|---|---|---|
| 0 | Contracts | ✅ DONE | 3/3 |
| 1 | Snapshot | ✅ DONE | 7/7 |
| 2 | Plan assembly | ✅ DONE | 2/2 (+ regression plan suite 5/5) |
| 3 | Persist (DomainController) | ✅ DONE | integ 2/2 (#227 describe) |
| 4 | Deployment assets | ✅ DONE | deployment build green |
| 5 | Docs + issue + UI | ✅ DONE | ApplicationVersionDetails Query Versions section |

---

## Realization — QueryVersion tracer (what was built)

### Code changes

| File | Change | Status |
|---|---|---|
| `packages/miroir-core/src/1_core/versioning/applicationVersionFreeze.ts` | Constants `QUERY_VERSION_ENTITY_UUID` = `7f3a8b2c-4d1e-4f9a-b6c3-8e5d2a1f0b9c`, `APPLICATION_VERSION_CROSS_QUERY_VERSION_UUID` = `9e4c6d8a-2b5f-4a1c-9d7e-3f6b8a2c4e1d`. Types `StoredQueryForFreeze`, `QueryVersionSnapshot`, `ApplicationVersionCrossQueryVersionRow`. Functions `snapshotQueriesAsHistoricalQueryVersions()`, `resolveFreezeQueryVersionApplicationSection()`. Extended `FreezeApplicationVersionPlan` (`queryVersions`, `crossQueryVersions`, `queryVersionApplicationSection`), `BuildFreezeApplicationVersionPlanInput` (`storedQueries?`), `FreezeMetaModelSlice` (`storedQueries?`), `buildFreezeApplicationVersionPlan` (snapshot + cross rows), `planFreezeApplicationVersionFromMetaModel` (passes `metaModel.storedQueries`) | ✅ |
| `packages/miroir-core/src/1_core/Model.ts` | `getQueryVersionWriteSection()` — Miroir → `"data"`, Library / other apps → `"model"` (mirrors `getEntityVersionWriteSection`, #222) | ✅ |
| `packages/miroir-core/src/3_controllers/DomainController.ts` | `persistFreezeApplicationVersionPlan`: new `freezeQueryVersions` batch → `entityHistoricalQueryVersion.uuid` in `plan.queryVersionApplicationSection`, and `freezeCrossQueryVersions` batch → `entityApplicationVersionCrossQueryVersion.uuid` in the versioning-history section (SAV co-located). `freezeApplicationVersion` handler: ensures historical QueryVersion Entity and Cross Query Entity exist via `createEntity` (`transactional: false`), mirroring the Cross Entity ensure; both uuids added to the meta-bootstrap exclusion set so they are never snapshotted as application Entities | ✅ |
| `packages/miroir-localcache-redux/src/4_services/localCache/Model.ts` | Loads `applicationVersionCrossQueryVersion` + `queryVersions` from local cache (co-locate Cross with SAV, #222 section helpers) | ✅ |
| `packages/miroir-test-app_deployment-miroir/assets/miroir_data/3f2baa83-…/17e78252-….json` | ApplicationVersionDetails report: combiners `02_crossQueryVersions` / `03_queryVersions`, **Query Versions** list section | ✅ |
| `packages/miroir-standalone-app/tests/3_controllers/applicationVersionFreeze.integ.test.ts` | Describe `227 — QueryVersion freeze persistence` (persist + post-freeze isolation) | ✅ |

### Deployment assets (`packages/miroir-test-app_deployment-miroir/`)

| Asset | Path | Export name | Status |
|---|---|---|---|
| Historical QueryVersion Entity | `assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/7f3a8b2c-4d1e-4f9a-b6c3-8e5d2a1f0b9c.json` | `entityHistoricalQueryVersion` | ✅ |
| Cross Query Entity | `assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/9e4c6d8a-2b5f-4a1c-9d7e-3f6b8a2c4e1d.json` | `entityApplicationVersionCrossQueryVersion` | ✅ |
| EV bootstrap row (QueryVersion) | `assets/miroir_data/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e.json` | `entityVersionHistoricalQueryVersion` | ✅ |
| EV bootstrap row (Cross Query) | `assets/miroir_data/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/c2d3e4f5-a6b7-4c8d-9e0f-1a2b3c4d5e6f.json` | `entityVersionApplicationVersionCrossQueryVersion` | ✅ |
| Package exports | `index.ts` (4 new exports) | — | ✅ |
| MetaModel registration | `src/Model.ts` — both Entities + both EVs registered; cross collection key `ApplicationVersionCrossQueryVersion: "applicationVersionCrossQueryVersion"` | — | ✅ |

### Test results (all passing)

| Suite | File | Tests |
|---|---|---|
| Phase 0 — contracts | `packages/miroir-core/tests/1_core/applicationVersionFreeze.227.queryVersion.phase0.unit.test.ts` | **3/3** |
| Phase 1 — snapshot | `packages/miroir-core/tests/1_core/applicationVersionFreeze.227.queryVersion.snapshot.unit.test.ts` | **7/7** |
| Phase 2 — plan | `packages/miroir-core/tests/1_core/applicationVersionFreeze.227.queryVersion.plan.unit.test.ts` | **2/2** |
| Regression — Entity plan | `packages/miroir-core/tests/1_core/applicationVersionFreeze.plan.unit.test.ts` | **5/5** (updated: asserts empty `queryVersions` / `crossQueryVersions` when no queries given) |
| Integ — QueryVersion persist | `packages/miroir-standalone-app/tests/3_controllers/applicationVersionFreeze.integ.test.ts` | **2/2** (`227 — QueryVersion freeze persistence`) |
| UI — ApplicationVersionDetails | `packages/miroir-core/tests/1_core/versioningUi.225.phase0.unit.test.ts` | Query Versions section locked |

### Deferred (NOT in this slice)

- ❌ MetaModel Jzod regeneration (`queryVersions`, `applicationVersionCrossQueryVersion` optional collections in `miroirFundamentalType.ts` zod schema; TS types + localcache loading added)
- ❌ Other 8 element types (Report, Menu, Endpoint, Runner, Theme, MlSchema, MiroirTest, Transformer) — see [Future slices](#future-slices--per-type-tdd-template)

---

## Phase 0 — Contracts (red) ✅ DONE

**File:** `packages/miroir-core/tests/1_core/applicationVersionFreeze.227.queryVersion.phase0.unit.test.ts`

| Test | Assert |
|---|---|
| Constants exported | `QUERY_VERSION_ENTITY_UUID`, `APPLICATION_VERSION_CROSS_QUERY_VERSION_UUID` |
| `snapshotQueriesAsHistoricalQueryVersions` exists | function export |
| Plan type fields | `FreezeApplicationVersionPlan` includes `queryVersions`, `crossQueryVersions`, `queryVersionApplicationSection` |

#### Validation

**Gate criteria (pass/fail):**

- [x] `QUERY_VERSION_ENTITY_UUID === "7f3a8b2c-4d1e-4f9a-b6c3-8e5d2a1f0b9c"` and `APPLICATION_VERSION_CROSS_QUERY_VERSION_UUID === "9e4c6d8a-2b5f-4a1c-9d7e-3f6b8a2c4e1d"` exported from `applicationVersionFreeze.ts` (and re-exported from `miroir-core` `index.ts`)
- [x] `snapshotQueriesAsHistoricalQueryVersions` is an exported function
- [x] `FreezeApplicationVersionPlan` carries the three QueryVersion fields (compile-time check in test)

**Command:**

```bash
RUN_TEST=applicationVersionFreeze.227 npm run testByFile -w miroir-core -- applicationVersionFreeze.227
```

**Expected:** phase0 suite **3/3 passing** (`exports stable entity UUID constants`, `exports snapshotQueriesAsHistoricalQueryVersions`, `FreezeApplicationVersionPlan includes QueryVersion fields`).

---

## Phase 1 — Snapshot (red → green) ✅ DONE

**File:** `packages/miroir-core/tests/1_core/applicationVersionFreeze.227.queryVersion.snapshot.unit.test.ts`

Mirror `applicationVersionFreeze.216.snapshot.unit.test.ts`:

| Test | Assert |
|---|---|
| New uuid ≠ live query uuid | minted |
| `queryUuid` = live query uuid | FK |
| `parentUuid` / `parentName` | historical QueryVersion entity |
| Copies `name`, `definition` | from source |
| Deep isolation | mutate source `definition` after snapshot → snapshot unchanged |
| Empty list | `[]` |
| Throws without `definition` | error mentions definition |

**Implementation:** `snapshotQueriesAsHistoricalQueryVersions` in `applicationVersionFreeze.ts` (deep copy via `structuredClone`; new uuids via injectable `newUuid`, default `uuidv4`).

**Type:** `StoredQueryForFreeze` (uuid, name, definition, optional description/defaultLabel) → `QueryVersionSnapshot` (adds new `uuid`, `parentUuid`, `parentName: "QueryVersion"`, `queryUuid`).

#### Validation

**Gate criteria (pass/fail):**

- [x] All 7 snapshot behaviors green (table above)
- [x] Deep isolation holds for the whole `definition` payload (`structuredClone`)
- [x] Missing `definition` throws an error naming the query uuid + `definition`

**Command:**

```bash
RUN_TEST=applicationVersionFreeze.227 npm run testByFile -w miroir-core -- applicationVersionFreeze.227
```

**Expected:** snapshot suite **7/7 passing** (cumulative 227 total: 10/10 with phase0).

---

## Phase 2 — Plan assembly (red → green) ✅ DONE

**File:** `packages/miroir-core/tests/1_core/applicationVersionFreeze.227.queryVersion.plan.unit.test.ts`

Extend existing plan tests pattern:

| Test | Assert |
|---|---|
| First freeze with queries | plan has N queryVersions + N crossQueryVersions |
| Cross links SAV → each QueryVersion uuid | same pattern as Entity Cross |
| Empty `storedQueries` | empty queryVersions / crossQueryVersions |
| Entity freeze unchanged | existing Entity tests still pass |

**Implementation (delivered):**

- `BuildFreezeApplicationVersionPlanInput.storedQueries?: StoredQueryForFreeze[]`
- `buildFreezeApplicationVersionPlan` snapshots queries and builds `crossQueryVersions` rows (`applicationVersion` = new SAV uuid, `queryVersion` = snapshot uuid, `parentUuid` = Cross Query entity)
- `FreezeMetaModelSlice.storedQueries?` + `planFreezeApplicationVersionFromMetaModel` forwards `metaModel.storedQueries`
- `queryVersionApplicationSection` resolved via `resolveFreezeQueryVersionApplicationSection`

#### Validation

**Gate criteria (pass/fail):**

- [x] First freeze with N queries → exactly N `queryVersions` and N `crossQueryVersions`; every cross row references the new SAV uuid and a snapshot uuid (never a live query uuid)
- [x] `storedQueries` omitted / empty → both collections `[]`, Entity side of plan unchanged
- [x] Regression: `applicationVersionFreeze.plan.unit.test.ts` updated for the new (empty) fields, still green

**Commands:**

```bash
RUN_TEST=applicationVersionFreeze.227 npm run testByFile -w miroir-core -- applicationVersionFreeze.227
RUN_TEST=applicationVersionFreeze.plan npm run testByFile -w miroir-core -- applicationVersionFreeze.plan
```

**Expected:** 227 plan suite **2/2 passing** (cumulative 227 total: 12/12); Entity plan regression suite **5/5 passing**.

---

## Phase 3 — Persist (red → green) ✅ DONE

**File:** `packages/miroir-standalone-app/tests/3_controllers/applicationVersionFreeze.integ.test.ts` — describe `227 — QueryVersion freeze persistence` (2 tests).

| Test | Assert |
|---|---|
| After freeze on Library with queries | store contains new QueryVersion rows + Cross |

**Implementation (delivered):** `DomainController.persistFreezeApplicationVersionPlan` + `freezeApplicationVersion` handler:

- Batch `freezeQueryVersions` → `entityHistoricalQueryVersion.uuid` (`QUERY_VERSION_ENTITY_UUID`), section from `plan.queryVersionApplicationSection`
- Batch `freezeCrossQueryVersions` → `entityApplicationVersionCrossQueryVersion.uuid` (`APPLICATION_VERSION_CROSS_QUERY_VERSION_UUID`), versioning-history section (SAV co-located, same as Cross Entity rows)
- `freezeApplicationVersion` ensures historical QueryVersion Entity + Cross Query Entity exist (`createEntity`, `transactional: false`), mirroring the Cross Entity ensure
- Both uuids added to the meta-bootstrap exclusion set (never snapshotted as application Entities)

#### Validation

**Gate criteria (pass/fail):**

- [x] `persistFreezeApplicationVersionPlan` issues both batches in order (EntityVersions → QueryVersions → Cross Entity → Cross Query), each short-circuiting on `Action2Error`
- [x] Both ensure-entity calls present in the `freezeApplicationVersion` handler
- [x] TypeScript compiles (`miroir-core` build green)
- [x] Integ: filesystem freeze persists QueryVersion + Cross rows (`227 — QueryVersion freeze persistence` 2/2)

**Commands:**

```bash
VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-filesystem.json \
VITE_MIROIR_LOG_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/specificLoggersConfig_DomainController_debug.json \
RUN_TEST=applicationVersionFreeze npm run testByFile -w miroir-standalone-app -- applicationVersionFreeze
```

**Expected:** describe `227 — QueryVersion freeze persistence` **2/2**; full file may include pre-existing failures in unrelated cases (e.g. branch omission when Library already has a branch).

---

## Phase 4 — Deployment assets ✅ DONE

| Asset | Path |
|---|---|
| Historical QueryVersion Entity | `miroir_model/16dbfe28-…/7f3a8b2c-….json` |
| Cross Query Entity | `miroir_model/16dbfe28-…/9e4c6d8a-….json` |
| EV bootstrap rows | `miroir_data/54b9c72f-…/b1c2d3e4-….json`, `…/c2d3e4f5-….json` |
| Exports | `miroir-test-app_deployment-miroir/index.ts` |
| MetaModel registration | `miroir-test-app_deployment-miroir/src/Model.ts` |

#### Validation

**Gate criteria (pass/fail):**

- [x] Both Entity JSONs + both EV bootstrap rows exist at the paths above
- [x] `index.ts` exports all four assets
- [x] `src/Model.ts` registers both Entities and both EVs in the metaModel lists, plus the `applicationVersionCrossQueryVersion` collection key
- [x] Deployment package builds; `miroir-core` builds against the new exports

**Commands:**

```bash
npm run build -w miroir-test-app_deployment-miroir
npm run build -w miroir-core
```

**Expected:** both builds green, no type errors on the new imports.

---

## Phase 5 — Docs + issue + UI ✅ DONE

- [x] GitHub issue [#230](https://github.com/miroir-framework/miroir/issues/230) linking #225, #216
- [x] Tick tracer AC in [`analysis.md`](./analysis.md)
- [x] This plan: Realization + per-phase Validation + future-slice template
- [x] **ApplicationVersionDetails** report: combiners `02_crossQueryVersions` / `03_queryVersions` + **Query Versions** list section (`17e78252-….json`); locked in `versioningUi.225.phase0.unit.test.ts`

#### Validation

**Gate criteria:** docs render; analysis.md status line and success criteria match the realized state above.

---

## Commands (canonical)

```bash
# Phase 0–2 unit — all three 227 suites (3 + 7 + 2 = 12 tests)
RUN_TEST=applicationVersionFreeze.227 npm run testByFile -w miroir-core -- applicationVersionFreeze.227

# Regression — Entity freeze plan (5 tests)
RUN_TEST=applicationVersionFreeze.plan npm run testByFile -w miroir-core -- applicationVersionFreeze.plan

# Full freeze regression — all #216 + #227 unit suites
RUN_TEST=applicationVersionFreeze npm run testByFile -w miroir-core -- applicationVersionFreeze

# Deployment assets
npm run build -w miroir-test-app_deployment-miroir

# Full core unit (if time)
npm run test -w miroir-core -- ''
```

---

## Regression gates (run before merging any slice)

| Gate | Command | Expected |
|---|---|---|
| Tracer / slice suites | `RUN_TEST=applicationVersionFreeze.227 npm run testByFile -w miroir-core -- applicationVersionFreeze.227` | **12/12** today; grows by 12 per added slice (3 phase0 + 7 snapshot + 2 plan) |
| Entity plan regression | `RUN_TEST=applicationVersionFreeze.plan npm run testByFile -w miroir-core -- applicationVersionFreeze.plan` | **5/5** |
| All freeze unit suites | `RUN_TEST=applicationVersionFreeze npm run testByFile -w miroir-core -- applicationVersionFreeze` | all green (#216 + #227) |
| Deployment build | `npm run build -w miroir-test-app_deployment-miroir` | green |
| Core build / type-check | `npm run build -w miroir-core` | green |

---

## Future slices — per-type TDD template

Each remaining element type follows the QueryVersion tracer exactly. Copy the template below; replace `<X>` with the element name (`Report`, `Menu`, …) and `<x>` with its camelCase (`report`, `menu`, …). **Mint two fresh UUIDs per slice** (historical `<X>Version` Entity + `ApplicationVersionCross<X>Version` Entity) — never reuse tracer UUIDs.

### Slice template

#### Phase 0 — Contracts (red)

New file `packages/miroir-core/tests/1_core/applicationVersionFreeze.227.<x>Version.phase0.unit.test.ts`:

- `<X>_VERSION_ENTITY_UUID`, `APPLICATION_VERSION_CROSS_<X>_VERSION_UUID` exported
- `snapshot<X>sAsHistorical<X>Versions` exported
- `FreezeApplicationVersionPlan` includes `<x>Versions`, `cross<X>Versions`, `<x>VersionApplicationSection`

**Validation:** `RUN_TEST=applicationVersionFreeze.227 npm run testByFile -w miroir-core -- applicationVersionFreeze.227` → new phase0 suite **3/3** (227 total grows by 3).

#### Phase 1 — Snapshot (red → green)

New file `applicationVersionFreeze.227.<x>Version.snapshot.unit.test.ts` — mirror the 7 Query snapshot tests:

- new `uuid` ≠ live instance uuid
- `<x>Uuid` FK = live instance uuid
- `parentUuid` / `parentName` → historical `<X>Version` Entity
- copies `name` + payload fields (see slice matrix)
- deep isolation: mutate source payload after snapshot → snapshot unchanged (`structuredClone`)
- empty list → `[]`
- throws on missing required payload field (error names instance uuid + field)

**Impl:** `Stored<X>ForFreeze`, `<X>VersionSnapshot` types + `snapshot<X>sAsHistorical<X>Versions` in `applicationVersionFreeze.ts`.

**Validation:** same command → new snapshot suite **7/7**.

#### Phase 2 — Plan assembly (red → green)

New file `applicationVersionFreeze.227.<x>Version.plan.unit.test.ts`:

- first freeze with N `<x>` instances → N `<x>Versions` + N `cross<X>Versions`; cross rows link new SAV uuid → each snapshot uuid
- empty / omitted present collection → empty plan collections; other element collections unchanged

**Impl:** extend `BuildFreezeApplicationVersionPlanInput` + `FreezeMetaModelSlice` with the present collection; `ApplicationVersionCross<X>VersionRow` type; cross-row assembly in `buildFreezeApplicationVersionPlan`; forward the collection in `planFreezeApplicationVersionFromMetaModel`.

**Validation:**

```bash
RUN_TEST=applicationVersionFreeze.227 npm run testByFile -w miroir-core -- applicationVersionFreeze.227   # new plan suite 2/2
RUN_TEST=applicationVersionFreeze.plan npm run testByFile -w miroir-core -- applicationVersionFreeze.plan # 5/5 (extend if assertions are exhaustive)
```

#### Phase 3 — Persist (red → green)

**Impl in `DomainController`:**

- `persistFreezeApplicationVersionPlan`: batches `freeze<X>Versions` → `<X>_VERSION_ENTITY_UUID` (section from `get<X>VersionWriteSection`) and `freezeCross<X>Versions` → Cross uuid (versioning-history section, SAV co-located)
- `freezeApplicationVersion`: ensure historical `<X>Version` Entity + Cross `<X>` Entity exist (`createEntity`, `transactional: false`); add both uuids to the meta-bootstrap exclusion set
- `Model.ts`: `get<X>VersionWriteSection()`

**Validation:** `npm run build -w miroir-core` green. Optional integ (recommended once per slice family): extend `applicationVersionFreeze.integ.test.ts` — after freeze, store contains `<X>Version` + Cross rows with correct parents/sections.

#### Phase 4 — Deployment assets

- Entity JSON `miroir_model/16dbfe28-…/<new historical <X>Version uuid>.json`
- Cross Entity JSON `miroir_model/16dbfe28-…/<new cross uuid>.json`
- EV bootstrap rows under `miroir_data/54b9c72f-…/` (one per new Entity)
- `index.ts` exports (4 per slice); `src/Model.ts` registration (entities, entityVersions, cross collection key)

**Validation:** `npm run build -w miroir-test-app_deployment-miroir` green, then `npm run build -w miroir-core` green; all [Regression gates](#regression-gates-run-before-merging-any-slice) green.

#### Phase 5 — Docs

- Tick the slice row in `analysis.md` goal table; update the slice matrix below; extend ApplicationVersionDetails UI only when requested.

### Slice matrix

| # | Slice | Present collection (`MetaModel`) | Live Entity (export) | FK field | Payload fields to snapshot (beyond `name`) | Status |
|---|---|---|---|---|---|---|
| 1 | QueryVersion | `storedQueries` | `entityQueryVersion` (`e4320b9e-…`) | `queryUuid` | `definition`, `description?`, `defaultLabel?` | ✅ DONE |
| 2 | ReportVersion | `reports` | `entityReport` (`3f2baa83-…`) | `reportUuid` | `definition` (report sections) | ❌ |
| 3 | MenuVersion | `menus` | `entityMenu` (`dde4c883-…`) | `menuUuid` | `definition` (menu tree), `defaultLabel?` | ❌ |
| 4 | EndpointVersion | `endpoints` | `entityEndpointVersion` (`3d8da4d4-…`) | `endpointUuid` | `definition` (action definitions) | ❌ |
| 5 | RunnerVersion | `runners` | `entityRunner` (`e54d7dc1-…`) | `runnerUuid` | `definition` | ❌ |
| 6 | ThemeVersion | `themes` | `entityTheme` (`bdcf956a-…`) | `themeUuid` | `definition` (theme content) | ❌ |
| 7 | MlSchemaVersion | `jzodSchemas` | `entityJzodSchema` (`5e81e1b9-…`) | `mlSchemaUuid` | `definition` (Jzod schema) | ❌ |
| 8 | MiroirTestVersion | `tests` | `entityMiroirTest` (`a311f363-…`) | `miroirTestUuid` | `definition` (test suites), `defaultLabel?` | ❌ |
| 9 | TransformerDefinitionVersion | TBD (not in generated `MetaModel` yet) | `entityTransformerDefinition` (`a557419d-…`) | `transformerUuid` | `definition` (library impl ref / composite body) | ❌ |

### Slice notes

- **Snapshot field lists** are starting points — confirm against the live instance shape when starting the slice (e.g. Menu `defaultLabel`, Endpoint action payloads). Use `type: "any"` for heavy `definition` fields in the historical Entity `mlSchema` (analysis §Risks).
- **TransformerDefinitionVersion** needs the present collection decided first (transformers are embedded in Query / Action definitions today; `entityTransformerDefinition` exists but has no generated `MetaModel` collection).
- **Bootstrap exclusion:** historical rows of metamodel-level concepts (e.g. Miroir's own queries) must not be frozen into application versions — mirror the meta-bootstrap exclusion set pattern from Phase 3.
- **Diff (Option A)** stays Entity-only until WP2 consumers need per-element diffs (analysis §Accepted pattern, item 5).

---

## Out of scope (do not implement in this plan)

- Option B accrued Action log / WP1 replayable payloads
- Per-element Option A diff into `modelCUDMigration` (Entity diff stays as-is)
- ApplicationVersionDetails UI sections (incremental, only when requested)
- MetaModel Jzod type regeneration for historical collections (batch later; local TS types until then)
- Data migrations (#215)
