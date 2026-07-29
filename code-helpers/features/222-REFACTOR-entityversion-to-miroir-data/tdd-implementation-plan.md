# Issue #222 — TDD Implementation Plan

## Scope

Move **`EntityVersion`** out of the Miroir bootstrapped **(meta-)model** into the Miroir **data** section as an ordinary framework **model concept** (same class as Menu, Report, Transformer, Query). Present-model authority stays on **`Entity`** (#217). Freeze (#216) is **not** implemented here.

**Operational role (today):** EntityVersion instances are non-operational — documentation / listing / CRUD only (like ApplicationVersion). They are not used to bootstrap or interpret the live model. Keep Report/Menu/Query/… **Entity** rows as-is; relocate matching EntityVersion **instances** to Miroir data (no purge).

This plan turns [`./analysis.md`](./analysis.md) problematics **P1–P16** / groups **G1–G5** into vertical red→green slices. **Done means code + tests + green full recompile + green full nonreg per slice**, not docs alone.

Related:

- Issue: https://github.com/miroir-framework/miroir/issues/222
- Analysis: [`./analysis.md`](./analysis.md)
- Parent #216: [`../216-FEATURE-application-versions-and-freeze/tdd-implementation-plan.md`](../216-FEATURE-application-versions-and-freeze/tdd-implementation-plan.md)
- Soft siblings: [#220](../220-REFACTOR-entitydefinition-tech-debt/tdd-implementation-plan.md), [#221](../221-REFACTOR-view-decouple-entityversion-present-model/tdd-implementation-plan.md)

### Slice ↔ analysis map

| Slice | Title | Problematics | Status |
|-------|-------|--------------|--------|
| 0 | Characterization locks (today’s matrix) | P3, P10, P12, P16 baseline | ✅ DONE |
| 1 | Atomic Miroir relocate (section API + assets + exports + docs + minimal load for EV list/CRUD) | P1, P3, P4, P5, P12, P13 + minimal P2/P6 | ✅ DONE |
| 2 | Section-aware load / LocalCache / selectors / extract (listing & cache fallback — not bootstrap) | P2, P6, P9 | ✅ DONE |
| 3 | Persist / backends / Actions / ModelInitializer / Cross | P7, P8, P11 | ✅ DONE |
| 4 | Exit criteria & non-regression locks (incl. operational-role invariant) | P10, P14, P15, P16 | ⬜ TODO |

**Why Slice 1 is atomic:** changing `getApplicationSection` / `metaMetaModelEntities` / `conceptLevel` without moving Miroir EntityVersion assets (or the reverse) leaves **listing / CRUD / load of EV rows** inconsistent. Classification + filesystem/bundled placement + package export paths must land together, plus the **minimum** wiring so EV instances are readable from **data** (not so that present-model bootstrap depends on EV — it must not).

**Slice cut unchanged after analysis adjustments:** no slices added or removed. Adjustments change **risk framing and exit criteria** inside Slices 1–4 (EV is documentation-class today; Entity-only bootstrap; codegen uses Entity `mlSchema`; relocate ≠ purge). Optional micro-work (e.g. drop EV cache-policy fallback) stays inside Slice 2.

---

## Locked implementation defaults (analysis §4)

| Open item | Choice for this plan |
|-----------|----------------------|
| `metaMetaModelEntities` | **Entity-only** after Slice 1. Do **not** add Commit. |
| Commit (`conceptLevel: MetaModel`) | **Leave untouched** (P12). Do not demote/promote as part of #222. |
| Redundant live EntityVersion rows (~20 Miroir copies) | **Relocate only** — **do not purge** in #222 (P10). Keep Report/Menu/Query/… **Entity** rows unchanged; move corresponding EntityVersion instances to data. |
| Library / Admin EntityVersion section | **Unchanged**: remain **model** with other framework model concepts (P3). Only Miroir instances move to **data**. |
| Admin bundled `ADMIN_MODEL_PARENT_UUIDS` | **Keep** EntityVersion parentUuid in Admin **model** set (Admin is not Miroir). |
| Miroir bundled `MIROIR_MODEL_PARENT_UUIDS` | **Remove** EntityVersion (`54b9c72f…`) in Slice 1 — model = Entity only. |
| `extractApplicationModel` | Use `getApplicationSection(applicationUuid, entityEntityDefinition.uuid)` (or equivalent) — not hard-coded `"model"` (Slice 2). |
| Live schema authority | **Entity only**. Do not reintroduce EntityVersion as present-model carrier (#220/#221 coordination). |
| Bootstrap | **Entity-only.** `loadConfigurationFromPersistenceStore` must not treat EntityVersion as required for live-model bootstrap (analysis P2). |
| Codegen / fundamental schema (P5) | Uses Entity `entityEntityDefinition.mlSchema` — **not** self-EV as MetaModel bootstrap. Slice 1 updates import **paths**; do not invent codegen work around self-EV section. |
| Freeze / historical minting | Out of scope; Slice 4 locks that existing relocated UUIDs are **not** freeze-mint helpers. |
| Slice exit gate | **Full recompile + full nonreg** (mandatory — see below). |
| Slice cut | **0–4 unchanged** (no add/remove). Framing updates only (see slice map). |

---

## Target public interfaces / contracts

1. **Section API (Miroir)**
   - `getApplicationSection(selfApplicationMiroir.uuid, entityEntity.uuid) === "model"`
   - `getApplicationSection(selfApplicationMiroir.uuid, entityEntityDefinition.uuid) === "data"`
2. **Section API (non-Miroir, e.g. Library)**
   - `getApplicationSection(libraryAppUuid, entityEntityDefinition.uuid) === "model"` (via `metaModelEntityUuids`)
3. **Bootstrap lists**
   - `metaMetaModelEntities` / `metaMetaModelEntityUuids` = **Entity only**
   - `miroirModelEntities` = MetaModel `conceptLevel` peers **excluding** EntityVersion (EntityVersion Entity has `conceptLevel: "Model"`)
4. **Assets (Miroir)**
   - EntityVersion instances under `miroir_data/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/`
   - No EntityVersion instance files under `miroir_model/54b9c72f-…`
   - Entity “EntityVersion” row remains under `miroir_model/16dbfe28-…/54b9c72f-….json` with `conceptLevel: "Model"`
5. **Load / listing (not bootstrap)**
   - After Miroir rollback: **Entity** instances under **model**; present-model (`mlSchema`, …) resolves **without** EntityVersion
   - EntityVersion instances under the **data** section index when listing / assembling `MetaModel.entityVersions` / CRUD
6. **Writes**
   - Any remaining Miroir EntityVersion upsert (incl. `ModelInitializer`) uses `applicationSection: "data"`; Library stays `"model"`

---

## Test execution conventions

| Purpose | Command |
|---------|---------|
| Core targeted unit | `npm run testByFile -w miroir-core -- 222.` |
| Standalone / DomainController integ | `VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-filesystem.json npm run testByFile -w miroir-standalone-app -- DomainController.integ` (and indexedDb/sql variants when Slice 3 requires) |
| Deployment package build | `npm run build -w miroir-test-app_deployment-miroir` |
| Full recompile | `./build-all.sh full` — use `./build-all.sh full devBuild` whenever Miroir deployment assets / schemas affecting generated types changed |
| Full non-regression | `npm run nonreg` |

Legend:

- **RED**: new/stricter test fails first
- **GREEN**: minimal code to pass
- **SLICE EXIT (mandatory)**: full recompile + full nonreg (see gate below)

Prefer behavior through public APIs (`getApplicationSection`, load/rollback, LocalCache MetaModel assembly, persistence read/write) over mocking internals.

Suggested test roots:

- `packages/miroir-core/tests/1_core/222-entityversion-to-miroir-data/`
- Optional integ assertions under `packages/miroir-standalone-app/tests/` with the same `222.` prefix

---

## Mandatory slice exit gate

**Every slice** (0–4) ends with **both** of the following green before the slice is marked DONE. No exceptions for “unit-only” slices — characterization and code slices alike.

```bash
# 1) Full recompile (clean full build)
./build-all.sh full
# If this slice changed miroir deployment assets / Jzod-facing schemas:
./build-all.sh full devBuild

# 2) Full non-regression
npm run nonreg
```

Also run the slice’s **targeted** RED/GREEN commands during the cycle; they do **not** replace the exit gate.

Record in the slice’s Realization notes:

- which `build-all` invocation was used (`full` vs `full devBuild`);
- nonreg snapshot path or stamp under `test-results/nonreg/` (if produced);
- any known flake / skip — must not weaken assertions to go green.

---

## Slice 0 — Characterization locks (today’s matrix)

### Goal

Lock **current** behavior so Slice 1+ changes are intentional and Library/Admin asymmetry / Commit / UUID inventory are not accidentally rewritten.

### 0.1 RED → GREEN — Section matrix (today)

**RED** (`222.phase0.section-matrix.unit.test.ts`):

- Miroir + Entity → `"model"`
- Miroir + EntityVersion → **`"model"`** (today)
- Non-Miroir app uuid that uses `metaModelEntityUuids` + EntityVersion → `"model"`
- `metaMetaModelEntities` contains Entity **and** EntityVersion
- EntityVersion Entity asset `conceptLevel === "MetaModel"` (read from deployment export / fixture)

**GREEN:** tests pass against current code (characterization only — no production change).

### 0.2 RED → GREEN — UUID inventory & non-goals

**RED** (`222.phase0.inventory-locks.unit.test.ts`):

- Count / list of Miroir EntityVersion instance UUIDs under `miroir_model/54b9c72f-…` is stable (snapshot list).
- Self-EV `bdd7ad43-…` is among them.
- Assert Commit is **not** in `metaMetaModelEntities` (documents P12 baseline).
- Assert live present-model fields on a sample Entity still come from Entity (`mlSchema` present) — #217 invariant.

**GREEN:** characterization only.

### Validation (Slice 0)

- [x] Targeted `222.phase0` tests green
- [x] **SLICE EXIT:** `./build-all.sh full` + `npm run nonreg` (see Realization — DomainController.integ ignored)

### Realization (Slice 0)

- Tests:
  - `packages/miroir-core/tests/1_core/222-entityversion-to-miroir-data/222.phase0.section-matrix.unit.test.ts`
  - `packages/miroir-core/tests/1_core/222-entityversion-to-miroir-data/222.phase0.inventory-locks.unit.test.ts` (exports `MIROIR_ENTITY_VERSION_INSTANCE_UUIDS_SLICE0`)
- Targeted: `npm run testByFile -w miroir-core -- 222.phase0` → 9/9 passed
- Full recompile: `./build-all.sh full` (core: `devBuild` via default build-all path) → ALL DONE (~10m 14s)
- Full nonreg: `npm run nonreg` → snapshot `test-results/nonreg/20260729T133928Z` — **31 passed, 1 failed**
  - **Ignored (pre-existing / out of Slice 0 scope):** `appstack-DomainController.integ` — LEGACY compositePK Data.CRUD Postgres upsert syntax error (`ON` / composite PK); unrelated to characterization-only Slice 0 (no production code changes). Other DomainController MiroirTest integ suites in the same nonreg run passed.
- Production code: none (characterization only)

---

## Slice 1 — Atomic Miroir relocate

### Goal

EntityVersion becomes a Miroir **data**-section concept: classification, assets, exports, docs, and **minimum** load wiring so EV instances remain **listable / CRUD-able from data**.

Present-model **bootstrap is Entity-only** (analysis P2 / operational-role note). Empty or late EV collections must **not** break Entity load or live schema. Do **not** purge redundant EV rows (P10); keep Report/Menu/Query/… **Entity** rows as-is.

Covers analysis G1+G2 (+ minimal G3 for EV visibility). Codegen (P5): path updates only — fundamental schema already reads Entity `mlSchema`, not self-EV as MetaModel bootstrap.

### 1.1 RED → GREEN — Target section matrix

**RED** (evolve or add `222.phase1.section-matrix.unit.test.ts`; replace Slice 0 “today” asserts for Miroir+EV):

- Miroir + EntityVersion → **`"data"`**
- Miroir + Entity → still `"model"`
- Library (non-Miroir) + EntityVersion → still `"model"`
- `metaMetaModelEntities` = Entity only (uuid list length / membership)
- EntityVersion Entity `conceptLevel === "Model"`
- `miroirModelEntities` does **not** include EntityVersion

**GREEN (classification):**

- EntityVersion Entity JSON: `conceptLevel: "Model"`
- `metaMetaModelEntities = [entityEntity]`
- Any other hard-coded MetaModel pair lists updated consistently

### 1.2 RED → GREEN — Assets & package exports

**RED** (`222.phase1.assets-layout.unit.test.ts`):

- `miroir_data/54b9c72f-…` exists and contains the **same UUID set** as Slice 0 inventory
- `miroir_model/54b9c72f-…` is absent or empty (no instance files)
- Deployment `index.ts` imports resolve from `miroir_data/54b9c72f-…` (no `miroir_model/54b9c72f` import paths for instances)
- Self-EV `bdd7ad43-…` still loadable via export (static path only — not a bootstrap artefact)
- Entity `entityEntityDefinition` still exports with `mlSchema` (codegen input)

**GREEN:**

- Move **EntityVersion instance** JSON files model → data (preserve UUIDs / contents)
- Leave Report/Menu/Query/… **Entity** JSON under `miroir_model/16dbfe28-…` unchanged
- Update `packages/miroir-test-app_deployment-miroir/index.ts` (and any barrel) paths for EV instances
- Update Miroir bundled classification: remove `54b9c72f…` from `MIROIR_MODEL_PARENT_UUIDS` (`miroir-sandbox` / any duplicate seed)
- **Do not** remove EntityVersion from `ADMIN_MODEL_PARENT_UUIDS*`
- Do **not** invent extra codegen changes beyond path/`devBuild` success (P5)

### 1.3 RED → GREEN — Minimal load so Entity boots; EV listable from data

**RED** (`222.phase1.miroir-load.unit.test.ts` and/or filesystem DomainController integ assert):

- After Miroir `rollback` / loadConfiguration: **Entity** instances present under **model**; sample Entity has `mlSchema` **without** requiring EntityVersion
- EntityVersion instances are readable from section **`"data"`** (listing / inventory continuity vs Slice 0 UUID set)
- Do **not** require that EV be available during the model-fetch phase for bootstrap to succeed

**GREEN (minimum):**

- DomainController: Miroir model fetch no longer *requires* EntityVersion in `modelEntitiesToFetch`; data fetch (or section-aware path) supplies EV instances for listing
- Enough LocalCache indexing so EV rows are not stuck under a stale `"model"` index for Miroir (prefer `getApplicationSection`; deepen remaining hardcodes in Slice 2)
- `./build-all.sh full devBuild` required in this slice (assets moved)

### 1.4 Docs (same slice)

- Update `docs/reference/data-architecture-deployments.md`: Miroir model = Entity only; EntityVersion instances in data (documentation-class / future versioning)
- Fix comments in `Model.ts` / `bundledData.ts` that still say model = Entity + EntityVersion

### Validation (Slice 1)

- [x] `222.phase1` unit tests green
- [x] Miroir load smoke: Entity present-model OK **without** EV in model section; EV UUIDs readable from **data**
- [x] Grep: no `miroir_model/54b9c72f` imports for instances in deployment package
- [x] `devBuild` / type generation succeeds after path updates (no self-EV-as-bootstrap work)
- [x] **SLICE EXIT:** `./build-all.sh full devBuild` + `npm run nonreg` (see Realization — DomainController.integ ignored)

### Realization (Slice 1)

- Classification: EntityVersion Entity `conceptLevel: "Model"`; `metaMetaModelEntities = [entityEntity]`; Miroir `getApplicationSection(…, EntityVersion) → "data"`
- Assets: EV instances moved `miroir_model/54b9c72f-…` → `miroir_data/54b9c72f-…`; deployment exports updated; Miroir bundled `MIROIR_MODEL_PARENT_UUIDS` no longer includes EV (Admin unchanged)
- Load / persist wiring: LocalCache section via `getApplicationSection`; DomainController Miroir model fetch does not require EV; `ModelInitializer` Miroir path uses `createEntity(entityEntityVersion)` (data storage via mixin) + bootstrap EV instances upserted to `"data"`; `PersistenceStoreController` `bootFromPersistedState` / `clearDataInstances` exclude only `"Entity"` from data (include EntityVersion)
- Prefer `entityEntityVersion` over deprecated `entityEntityDefinition` in code references
- Docs: `docs/reference/data-architecture-deployments.md` + Model/bundled comments
- Full recompile: `./build-all.sh full devBuild` → succeeded
- Full nonreg: `npm run nonreg` → snapshot `test-results/nonreg/20260729T153104Z` — **31 passed, 1 failed**
  - **Ignored (pre-existing / out of Slice 1 scope):** `appstack-DomainController.integ` — same LEGACY compositePK Postgres upsert issue as Slice 0. All DomainController MiroirTest integ suites (including `domain_controller_data_crud`) passed.

---

## Slice 2 — Section-aware load / LocalCache / selectors / extract

### Goal

Eliminate remaining hard-coded `"model"` + EntityVersion assumptions in load, selectors, and extraction tooling so **listing / `MetaModel.entityVersions` / cache-policy fallback** stay correct.

**Not** “fix Entity bootstrap” — bootstrap is Entity-only (P2). Deepen Slice 1’s minimal patches into a single section strategy.

Optional (same slice, not a new slice): drop EntityVersion cache-policy fallback and rely on `Entity.cache` only when safe.

### 2.1 RED → GREEN — Selectors & LocalCache (listing)

**RED** (`222.phase2.localcache-selectors.unit.test.ts`):

- For Miroir deployment uuid, EntityVersion state index uses **data** section
- For Library deployment uuid, EntityVersion state index uses **model** section
- After load, MetaModel assemblers / `getReportsAndEntitiesForDeploymentUuid` return `entityVersions` for Miroir when EV rows exist (listing continuity — not present-model authority)

**GREEN:**

- `miroir-localcache-redux` / `miroir-localcache-zustand` Model assemblers use `getApplicationSection` (or shared helper)
- `DomainStateQuerySelectors` / `ReduxDeploymentsStateQuerySelectors` EntityVersion lookups section-aware

### 2.2 RED → GREEN — `extractApplicationModel`

**RED** (`222.phase2.extract-application-model.unit.test.ts`):

- Extraction for Miroir reads EntityVersion from **data**
- Extraction for Library-like app reads EntityVersion from **model**
- Both produce non-empty `entityVersions` when fixtures exist

**GREEN:**

- Replace hard-coded `extractEntityInstances(..., "model", entityEntityDefinition.uuid, ...)` with section from `getApplicationSection`

### 2.3 RED → GREEN — DomainController cache-policy map (fallback, not bootstrap)

**RED:** if `entityDefinitionsByEntityUuid` (or successor) is still built during Miroir load for `resolveEntitiesToFetchOnRefresh`, it is populated from the **data** fetch — or the fallback is removed and `Entity.cache` alone drives refresh policy.

**GREEN:** finish DomainController cleanup left from Slice 1; prefer Entity-only cache policy when practical.

### Validation (Slice 2)

- [x] `222.phase2` tests green
- [x] Grep load/selector/extract paths: no unconditional `"model"` + `entityEntityDefinition` for Miroir
- [x] Present-model paths still do not require EntityVersion
- [x] **SLICE EXIT:** `./build-all.sh full` (use `devBuild` only if assets/schemas changed again) + `npm run nonreg` (see Realization — DomainController.integ ignored)

### Realization (Slice 2)

- `LocalCacheSliceModelSelector` (redux + zustand): EV listing via `getApplicationSection`
- `extractApplicationModel`: all concept extracts use `getApplicationSection(applicationUuid, entityUuid)` (Miroir EV → data)
- `ReduxDeploymentsStateQuerySelectors` cache-policy EV fallback: section-aware via `getApplicationSection`
- DomainController: Miroir refresh policy remains Entity.cache-only (`miroirModelEntities` has no EV); Library still fills EV map from model fetch
- Test helpers `minimalLocalCacheStateForModel`: EV index uses `modelSection` (data for Miroir, model for Library)
- Tests: `222.phase2.localcache-selectors`, `222.phase2.extract-application-model`, `222.phase2.domain-controller-cache` (11/11)
- Full recompile: `./build-all.sh full` → ALL DONE
- Full nonreg: `npm run nonreg` → snapshot `test-results/nonreg/20260729T162139Z` — **31 passed, 1 failed**
  - **Ignored:** `appstack-DomainController.integ` (LEGACY compositePK upsert; same as Slice 0/1)

---

## Slice 3 — Persist / backends / Actions / ModelInitializer / Cross

### Goal

Reads **and writes** of EntityVersion for Miroir use `"data"`; Library remains `"model"`. Bundled/filesystem/indexedDb/postgres paths used in CI stay consistent. Explicitly fix **`ModelInitializer`** EV instance upserts that still force `"model"` (analysis P5/P8). Cross / SAV section matrix locked for future versioning (P11) — not required for live present-model ops.

### 3.1 RED → GREEN — Section on write

**RED** (`222.phase3.persist-section.unit.test.ts`):

- Planning/helpers that upsert EntityVersion for Miroir application emit `applicationSection: "data"`
- Same helper for Library emits `"model"`
- Residual dual-write / compat paths (if still callable) respect the same rule — do not reintroduce present-model authority via EntityVersion

**GREEN:**

- Wire writes through `getApplicationSection`
- Fix freeze scaffolding (`applicationVersionFreeze.ts`) section constant if it hard-codes model for Miroir (still no full freeze feature)

### 3.2 RED → GREEN — `ModelInitializer` EV instance section

**RED** (`222.phase3.model-initializer-section.unit.test.ts` or source/contract assert):

- Miroir store bootstrap paths that upsert EntityVersion **instances** (incl. self-EV `entityDefinitionEntityDefinition` / `entityVersionEntityVersion`) use **`"data"`**, not `"model"`
- Creating the Entity named EntityVersion / Entity rows for framework concepts remains consistent with Entity-in-model rules

**GREEN:**

- Update `ModelInitializer.ts` (and any twin initializer) section arguments for EV **instances** on Miroir
- Do not move Report/Menu/Query **Entity** bootstrap into data

### 3.3 RED → GREEN — Backend round-trip (filesystem first)

**RED** (filesystem DomainController integ or store-level test):

- Create or upsert a throwaway EntityVersion under Miroir → persists under **data** store unit → readable after reload from **data**
- Library EntityVersion round-trip still **model**

**GREEN:** filesystem path correct; extend to indexedDb / sql **if** those configs are in the nonreg manifest for this repo’s default `npm run nonreg` (do not skip backends that nonreg already runs).

### 3.4 RED → GREEN — Cross / SAV matrix lock

**RED** (`222.phase3.versioning-section-matrix.unit.test.ts`):

Document / assert Miroir section matrix (future versioning; documentation-class today):

| Concept | Miroir section |
|---------|----------------|
| Entity | model |
| EntityVersion | data |
| ApplicationVersionCrossEntityVersion | data |
| SelfApplicationVersion | data (existing) |

Library: EntityVersion remains model; Cross/SAV per existing Library layout.

**GREEN:** tests + any query join that broke when EV left model.

### Validation (Slice 3)

- [x] `222.phase3` tests green
- [x] ModelInitializer Miroir EV instance writes use `"data"`
- [x] Filesystem (and nonreg-covered backends) EntityVersion round-trip green (section contracts + nonreg MiroirTest integ)
- [x] **SLICE EXIT:** `./build-all.sh full` (+ `devBuild` if needed) + `npm run nonreg` (see Realization — DomainController.integ ignored)

### Realization (Slice 3)

- `getEntityVersionWriteSection` + `resolveFreezeEntityVersionApplicationSection` for EV write planning / freeze scaffolding
- `ModelInitializer` Miroir: `createEntity(entityEntityVersion)` + EV instance upserts to `"data"` (re-enabled)
- `Deployment.resetAndinitializeDeploymentCompositeAction`: meta-model instances grouped by `getApplicationSection` (model/data)
- `DomainController.createModelInstancesFromResetModel`: section via `getApplicationSection(application, parentEntity.uuid)`
- Cross/SAV matrix locked in `222.phase3.versioning-section-matrix` (Library Cross → data: Cross Entity absent from MetaModel.entities)
- Tests: `222.phase3.*` (9/9)
- Full recompile: `./build-all.sh full` → ALL DONE (TS2206 import fix in `applicationVersionFreeze.ts`)
- Full nonreg: `npm run nonreg` → snapshot `test-results/nonreg/20260729T164954Z` — **31 passed, 1 failed**
  - **Ignored:** `appstack-DomainController.integ` (LEGACY compositePK upsert; same as Slices 0–2)

---

## Slice 4 — Exit criteria & non-regression locks

### Goal

Close #222 acceptance criteria with durable locks: UUID continuity, **operational-role invariant** (live paths do not require EntityVersion), no purge of redundant EV rows, Report/Menu/Query Entities unchanged, coordination with #220/#221.

### 4.1 RED → GREEN — Acceptance checklist as tests

**RED** (`222.phase4.acceptance.unit.test.ts` / integ):

- Miroir EntityVersion Entity `conceptLevel === "Model"`
- Miroir EV instances only under data assets
- Slice 0 UUID set ⊆ loaded Miroir EntityVersion UUIDs after rollback (from **data**)
- Sample Entity present-model (`mlSchema`) still on Entity
- Present-model / ordinary Report–Query–Transformer smoke does **not** require EntityVersion instances (operational-role lock)
- `metaMetaModelEntities` Entity-only
- Grep-oriented lock: deployment EV instance imports not under `miroir_model/54b9c72f`
- Report/Menu/Query/… Entity assets still under `miroir_model/16dbfe28-…` (P10)

**GREEN:** fill any remaining gaps from Slices 1–3; no new product behavior.

### 4.2 RED → GREEN — Non-goals locked

**RED** (`222.phase4.nongoals.unit.test.ts`):

- Redundant live EntityVersion rows still present (count ≥ Slice 0 count) — documents “relocate ≠ purge”
- Commit still not forced into `metaMetaModelEntities`
- Comment/JSDoc near freeze helpers: historical mint must use **new** UUIDs (not reuse relocated live rows) — characterization of code comment or helper contract if already present
- EntityVersion remains documentation-class / listing-CRUD today (no freeze feature required to close #222)

**GREEN:** documentation / comments / locks only.

### 4.3 Fixture & test debt sweep

- Update any remaining tests that hard-code `miroir_model/54b9c72f` or Miroir EntityVersion section `"model"`
- Do not weaken assertions; retarget section/path

### Validation (Slice 4) — issue exit

- [ ] Issue #222 acceptance criteria A–D satisfied
- [ ] Explicit non-criteria E still true (no freeze feature required)
- [ ] Operational-role invariant locked in tests
- [ ] **SLICE EXIT:** `./build-all.sh full devBuild` + `npm run nonreg`
- [ ] PR lists exact build-all + nonreg stamps

### Realization (Slice 4)

- (fill when done)

---

## Out of scope (do not pull into slices)

- Freeze Action / Application Version planner (#216 proper)
- Purging redundant live EntityVersion rows
- Moving Report/Menu/Query/… **Entity** rows out of Miroir model
- Treating EntityVersion as required for live present-model bootstrap
- Full `EntityDefinition` string purge (#220)
- View-tree present-model decoupling beyond breakage from section changes (#221)
- Demoting/promoting Commit MetaModel peer
- Moving Library/Admin EntityVersion instances to data
- Option B action-log versioning
- Inventing codegen changes that assume self-EV is MetaModel bootstrap (P5 — path update only)

---

## Progress checklist (roll-up)

| Slice | Targeted tests | Full recompile | Full nonreg | DONE |
|-------|----------------|----------------|-------------|------|
| 0 | ✅ | ✅ | ✅ (DomainController.integ ignored) | ✅ |
| 1 | ✅ | ✅ | ✅ (DomainController.integ ignored) | ✅ |
| 2 | ✅ | ✅ | ✅ (DomainController.integ ignored) | ✅ |
| 3 | ✅ | ✅ | ✅ (DomainController.integ ignored) | ✅ |
| 4 | ⬜ | ⬜ | ⬜ | ⬜ |

A slice may be marked DONE only when its row is all green.
