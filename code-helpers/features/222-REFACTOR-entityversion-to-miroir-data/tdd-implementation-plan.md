# Issue #222 — TDD Implementation Plan

## Scope

Move **`EntityVersion`** out of the Miroir bootstrapped **(meta-)model** into the Miroir **data** section as an ordinary framework **model concept** (same class as Menu, Report, Transformer, Query). Present-model authority stays on **`Entity`** (#217). Freeze (#216) is **not** implemented here.

This plan turns [`./analysis.md`](./analysis.md) problematics **P1–P16** / groups **G1–G5** into vertical red→green slices. **Done means code + tests + green full recompile + green full nonreg per slice**, not docs alone.

Related:

- Issue: https://github.com/miroir-framework/miroir/issues/222
- Analysis: [`./analysis.md`](./analysis.md)
- Parent #216: [`../216-FEATURE-application-versions-and-freeze/tdd-implementation-plan.md`](../216-FEATURE-application-versions-and-freeze/tdd-implementation-plan.md)
- Soft siblings: [#220](../220-REFACTOR-entitydefinition-tech-debt/tdd-implementation-plan.md), [#221](../221-REFACTOR-view-decouple-entityversion-present-model/tdd-implementation-plan.md)

### Slice ↔ analysis map

| Slice | Title | Problematics | Status |
|-------|-------|--------------|--------|
| 0 | Characterization locks (today’s matrix) | P3, P10, P12, P16 baseline | ⬜ TODO |
| 1 | Atomic Miroir relocate (section API + assets + exports + docs + minimal load/cache) | P1, P3, P4, P5, P12, P13 + minimal P2/P6 | ⬜ TODO |
| 2 | Load / LocalCache / selectors / extract (section-aware) | P2, P6, P9 | ⬜ TODO |
| 3 | Persist / backends / Actions / Cross | P7, P8, P11 | ⬜ TODO |
| 4 | Exit criteria & non-regression locks | P10, P14, P15, P16 | ⬜ TODO |

**Why Slice 1 is atomic:** changing `getApplicationSection` / `metaMetaModelEntities` / `conceptLevel` without moving Miroir EntityVersion assets (or the reverse) leaves load/persist inconsistent. One vertical slice must land classification + filesystem/bundled asset placement + package export paths + the **minimum** DomainController / LocalCache section fix so Miroir still loads. Slice 2 deepens any remaining hard-coded `"model"` lookups.

---

## Locked implementation defaults (analysis §4)

| Open item | Choice for this plan |
|-----------|----------------------|
| `metaMetaModelEntities` | **Entity-only** after Slice 1. Do **not** add Commit. |
| Commit (`conceptLevel: MetaModel`) | **Leave untouched** (P12). Do not demote/promote as part of #222. |
| Redundant live EntityVersion rows (~20 Miroir copies) | **Relocate only** — **do not purge** in #222 (P10). File a follow-up if purge is desired. |
| Library / Admin EntityVersion section | **Unchanged**: remain **model** with other framework model concepts (P3). Only Miroir instances move to **data**. |
| Admin bundled `ADMIN_MODEL_PARENT_UUIDS` | **Keep** EntityVersion parentUuid in Admin **model** set (Admin is not Miroir). |
| Miroir bundled `MIROIR_MODEL_PARENT_UUIDS` | **Remove** EntityVersion (`54b9c72f…`) in Slice 1 — model = Entity only. |
| `extractApplicationModel` | Use `getApplicationSection(applicationUuid, entityEntityDefinition.uuid)` (or equivalent) — not hard-coded `"model"` (Slice 2). |
| Live schema authority | **Entity only**. Do not reintroduce EntityVersion as present-model carrier (#220/#221 coordination). |
| Freeze / historical minting | Out of scope; Slice 4 locks that existing relocated UUIDs are **not** freeze-mint helpers. |
| Slice exit gate | **Full recompile + full nonreg** (mandatory — see below). |

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
5. **Load / cache**
   - After Miroir rollback, EntityVersion instances are present in LocalCache under the **data** section index; `MetaModel.entityVersions` non-empty when assembled
6. **Writes**
   - Any remaining Miroir EntityVersion upsert uses `applicationSection: "data"`; Library stays `"model"`

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

- [ ] Targeted `222.phase0` tests green
- [ ] **SLICE EXIT:** `./build-all.sh full` + `npm run nonreg`

### Realization (Slice 0)

- (fill when done)

---

## Slice 1 — Atomic Miroir relocate

### Goal

EntityVersion becomes a Miroir **data**-section concept: classification, assets, exports, docs, and **minimum** load/cache wiring so Miroir startup still populates EntityVersion instances.

Covers analysis G1+G2 (+ minimal G3). Does **not** purge redundant rows (P10).

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
- Self-EV `bdd7ad43-…` still loadable via export

**GREEN:**

- Move instance JSON files model → data (preserve UUIDs / contents)
- Update `packages/miroir-test-app_deployment-miroir/index.ts` (and any barrel) paths
- Update Miroir bundled classification: remove `54b9c72f…` from `MIROIR_MODEL_PARENT_UUIDS` (`miroir-sandbox` / any duplicate seed)
- **Do not** remove EntityVersion from `ADMIN_MODEL_PARENT_UUIDS*`

### 1.3 RED → GREEN — Minimal load / cache so Miroir still boots

**RED** (`222.phase1.miroir-load.unit.test.ts` and/or filesystem DomainController integ assert):

- After Miroir `rollback` / loadConfiguration path, EntityVersion instances are readable from section **`"data"`**
- Assembled MetaModel (or LocalCache index) exposes non-empty `entityVersions` with the Slice 0 UUID set
- Live Entity `mlSchema` still resolves without requiring EntityVersion for present-model

**GREEN (minimum):**

- DomainController: stop assuming EntityVersion collection comes from `modelInstances` / `modelEntitiesToFetch` for Miroir; read from data fetch (or section-aware index)
- LocalCache redux/zustand MetaModel assembly: index EntityVersion with **data** section for Miroir (use `getApplicationSection` — avoid hard-coding if practical)
- `./build-all.sh full devBuild` required in this slice (assets moved)

### 1.4 Docs (same slice)

- Update `docs/reference/data-architecture-deployments.md`: Miroir model = Entity only; EntityVersion instances in data
- Fix comments in `Model.ts` / `bundledData.ts` that still say model = Entity + EntityVersion

### Validation (Slice 1)

- [ ] `222.phase1` unit tests green
- [ ] Filesystem DomainController Miroir load smoke green (targeted)
- [ ] Grep: no `miroir_model/54b9c72f` imports for instances in deployment package
- [ ] **SLICE EXIT:** `./build-all.sh full devBuild` + `npm run nonreg`

### Realization (Slice 1)

- (fill when done)

---

## Slice 2 — Load / LocalCache / selectors / extract (section-aware)

### Goal

Eliminate remaining hard-coded `"model"` + EntityVersion assumptions in load, selectors, and extraction tooling. Deepen Slice 1’s minimal patches into a single section strategy.

### 2.1 RED → GREEN — Selectors & LocalCache

**RED** (`222.phase2.localcache-selectors.unit.test.ts`):

- For Miroir deployment uuid, EntityVersion state index uses **data** section
- For Library deployment uuid, EntityVersion state index uses **model** section
- `getReportsAndEntitiesForDeploymentUuid` / MetaModel assemblers still return `entityVersions` for Miroir after load

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

### 2.3 RED → GREEN — DomainController leftover map

**RED:** assert any `entityDefinitionsByEntityUuid` (or successor) built during Miroir load is populated from the **data** fetch results, not an empty model slot.

**GREEN:** finish DomainController cleanup left from Slice 1.

### Validation (Slice 2)

- [ ] `222.phase2` tests green
- [ ] Grep load/selector/extract paths: no unconditional `"model"` + `entityEntityDefinition` for Miroir
- [ ] **SLICE EXIT:** `./build-all.sh full` (use `devBuild` only if assets/schemas changed again) + `npm run nonreg`

### Realization (Slice 2)

- (fill when done)

---

## Slice 3 — Persist / backends / Actions / Cross

### Goal

Reads **and writes** of EntityVersion for Miroir use `"data"`; Library remains `"model"`. Bundled/filesystem/indexedDb/postgres paths used in CI stay consistent. Cross / SAV queries still work across sections (P11).

### 3.1 RED → GREEN — Section on write

**RED** (`222.phase3.persist-section.unit.test.ts`):

- Planning/helpers that upsert EntityVersion for Miroir application emit `applicationSection: "data"`
- Same helper for Library emits `"model"`
- Residual dual-write / compat paths (if still callable) respect the same rule — do not reintroduce present-model authority via EntityVersion

**GREEN:**

- Wire writes through `getApplicationSection`
- Fix freeze scaffolding (`applicationVersionFreeze.ts`) section constant if it hard-codes model for Miroir (still no full freeze feature)

### 3.2 RED → GREEN — Backend round-trip (filesystem first)

**RED** (filesystem DomainController integ or store-level test):

- Create or upsert a throwaway EntityVersion under Miroir → persists under **data** store unit → readable after reload from **data**
- Library EntityVersion round-trip still **model**

**GREEN:** filesystem path correct; extend to indexedDb / sql **if** those configs are in the nonreg manifest for this repo’s default `npm run nonreg` (do not skip backends that nonreg already runs).

### 3.3 RED → GREEN — Cross / SAV matrix lock

**RED** (`222.phase3.versioning-section-matrix.unit.test.ts`):

Document / assert Miroir section matrix:

| Concept | Miroir section |
|---------|----------------|
| Entity | model |
| EntityVersion | data |
| ApplicationVersionCrossEntityVersion | data |
| SelfApplicationVersion | data (existing) |

Library: EntityVersion remains model; Cross/SAV per existing Library layout.

**GREEN:** tests + any query join that broke when EV left model.

### Validation (Slice 3)

- [ ] `222.phase3` tests green
- [ ] Filesystem (and nonreg-covered backends) EntityVersion round-trip green
- [ ] **SLICE EXIT:** `./build-all.sh full` (+ `devBuild` if needed) + `npm run nonreg`

### Realization (Slice 3)

- (fill when done)

---

## Slice 4 — Exit criteria & non-regression locks

### Goal

Close #222 acceptance criteria with durable locks: UUID continuity, no live-schema regression, no purge of redundant rows unless explicitly scoped later, coordination with #220/#221.

### 4.1 RED → GREEN — Acceptance checklist as tests

**RED** (`222.phase4.acceptance.unit.test.ts` / integ):

- Miroir EntityVersion Entity `conceptLevel === "Model"`
- Miroir instances only under data assets
- Slice 0 UUID set ⊆ loaded Miroir EntityVersion UUIDs after rollback
- Sample Entity present-model (`mlSchema`) still on Entity
- `metaMetaModelEntities` Entity-only
- Grep-oriented lock: deployment instance imports not under `miroir_model/54b9c72f`

**GREEN:** fill any remaining gaps from Slices 1–3; no new product behavior.

### 4.2 RED → GREEN — Non-goals locked

**RED** (`222.phase4.nongoals.unit.test.ts`):

- Redundant live EntityVersion rows still present (count ≥ Slice 0 count) — documents “relocate ≠ purge”
- Commit still not forced into `metaMetaModelEntities`
- Comment/JSDoc near freeze helpers: historical mint must use **new** UUIDs (not reuse relocated live rows) — characterization of code comment or helper contract if already present

**GREEN:** documentation / comments / locks only.

### 4.3 Fixture & test debt sweep

- Update any remaining tests that hard-code `miroir_model/54b9c72f` or Miroir EntityVersion section `"model"`
- Do not weaken assertions; retarget section/path

### Validation (Slice 4) — issue exit

- [ ] Issue #222 acceptance criteria A–D satisfied
- [ ] Explicit non-criteria E still true (no freeze feature required)
- [ ] **SLICE EXIT:** `./build-all.sh full devBuild` + `npm run nonreg`
- [ ] PR lists exact build-all + nonreg stamps

### Realization (Slice 4)

- (fill when done)

---

## Out of scope (do not pull into slices)

- Freeze Action / Application Version planner (#216 proper)
- Purging redundant live EntityVersion rows
- Full `EntityDefinition` string purge (#220)
- View-tree present-model decoupling beyond breakage from section changes (#221)
- Demoting/promoting Commit MetaModel peer
- Moving Library/Admin EntityVersion instances to data
- Option B action-log versioning

---

## Progress checklist (roll-up)

| Slice | Targeted tests | Full recompile | Full nonreg | DONE |
|-------|----------------|----------------|-------------|------|
| 0 | ⬜ | ⬜ | ⬜ | ⬜ |
| 1 | ⬜ | ⬜ | ⬜ | ⬜ |
| 2 | ⬜ | ⬜ | ⬜ | ⬜ |
| 3 | ⬜ | ⬜ | ⬜ | ⬜ |
| 4 | ⬜ | ⬜ | ⬜ | ⬜ |

A slice may be marked DONE only when its row is all green.
