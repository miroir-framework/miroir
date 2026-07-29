# Issue #216 — TDD Implementation Plan

## Scope

User-triggered **freeze** of a versioned application’s present **Entity** model into an immutable `SelfApplicationVersion`, with:

- new historical `EntityVersion` copies + `ApplicationVersionCrossEntityVersion` rows;
- **linear** `previousVersion` chain;
- **Option A** rough migration evaluation by **diffing** consecutive Entity snapshots.

This plan converts ADR-accepted choices (analysis §ADR D1–D6) into vertical red→green slices. Alternatives (Option B, full-model snapshot, branching, auto-freeze) stay documented in the analysis and are out of scope here.

Related:

- Issue: https://github.com/miroir-framework/miroir/issues/216
- Analysis / ADR: `./analysis.md`
- Prerequisites (realized): [#217](../217-FEATURE-%20Make%20Entity%20the%20authoritative%20present-model%20definition/analysis.md), [#220](../220-REFACTOR-entitydefinition-tech-debt/), [#221](../221-REFACTOR-view-decouple-entityversion-present-model/), [#222](../222-REFACTOR-entityversion-to-miroir-data/)
- WP2 consumer: [`../9-FEATURE-create-migrations-for-model-and-data-updates/wp2-analysis-application-version-migrations.md`](../9-FEATURE-create-migrations-for-model-and-data-updates/wp2-analysis-application-version-migrations.md)

**Resume note (2026-07-30):** Phases 0–2 DONE. **Phase 3 DONE** — `resolvePreviousApplicationVersion` + auto `previousVersion` on second freeze. Continue at **Phase 4** (Entity-set diff → `modelCUDMigration`).

---

## Progress summary

| Phase | Title | Status | Tests |
|---|---|---|---|
| 0 | Lock freeze contracts & fixtures | ✅ DONE | 5/5 (retargeted post-#220/#222) |
| 1 | Versioning gate + Entity snapshot planner | ✅ DONE | 11/11 (retargeted) |
| 2 | Freeze plan builder (SAV + Cross + isolation) | ✅ DONE | 5/5 |
| 3 | Linear tip resolution (`previousVersion`) | ✅ DONE | 8/8 |
| 4 | Entity-set diff → rough migration evaluation | ⬜ TODO | — |
| 5 | Wire `freezeApplicationVersion` Action | ⬜ TODO | — |
| 6 | Persist freeze (filesystem integ) | ⬜ TODO | — |
| 7 | Commit / `"Initial"` hygiene | ⬜ TODO | — |
| 8 | End-to-end tracer bullet + WP2 handoff note | ⬜ TODO | — |

---

## Locked implementation defaults (analysis §9)

| Open item | Choice for this plan |
|---|---|
| Version label | Free string; unique among SAVs for the same `selfApplication` (+ default branch) |
| Diff artefact persistence | Write candidate list into `SelfApplicationVersion.modelCUDMigration` (entity create/drop/rename/alter candidates). Leave `modelStructureMigration` empty in v1 (reserved for later non-Entity / coarse structure). Document shape in Phase 4. |
| `"Initial"` / placeholder SAV | **Ignore for tip resolution** — tip = latest freeze-produced SAV (or none). First freeze has no `previousVersion`. Do not treat fixture `"Initial"` as *V0* unless a later migration marks it. |
| Action surface | New `actionType: "freezeApplicationVersion"` on the shared Model Endpoint (`7947ae40-…`) |
| Branch when linking | Use the application’s default / configured model branch UUID already used by WP1 / existing SAV rows; single linear chain per app+branch |
| Rename vs drop+create | Same live `entityUuid` with different `name` → `renameEntity` candidate; Entity only in one snapshot → create/drop. No fuzzy content-based rename in v1. |

ADR revisit: if WP2 needs Action-tape fidelity, reopen **D2** (Option B) — do not expand Phase 4 into log accrual.

---

## Target public interfaces

1. **Policy**
   - `assertApplicationVersioningEnabled(selfApplication): void` — throws when `versioningEnabled !== true`
2. **Snapshot (Entities only)**
   - `snapshotEntitiesAsHistoricalEntityVersions(entities, { newUuid }): EntityVersion[]` — new UUIDs, deep-copied definition-bearing + identity fields; `entityUuid` → live Entity uuid
   - Field list: `ENTITY_PRESENT_MODEL_DEFINITION_FIELDS` in `versioning/applicationVersioning.ts`
3. **Section (persist)**
   - `resolveFreezeEntityVersionApplicationSection(applicationUuid)` → Miroir `"data"`, Library `"model"` (#222)
   - Prefer this / `getEntityVersionWriteSection` over hard-coded `"model"`
4. **Freeze plan (pure)** — Phase 2+
   - `buildFreezeApplicationVersionPlan(input): FreezeApplicationVersionPlan`
   - Plan contains: new `SelfApplicationVersion`, `EntityVersion[]`, `ApplicationVersionCrossEntityVersion[]`, optional `modelCUDMigration` candidates, `previousVersion` link
5. **Tip resolution** — Phase 3
   - `resolvePreviousApplicationVersion(versions, { selfApplication, branch }): ApplicationVersion | undefined`
6. **Diff (Option A)** — Phase 4
   - `diffEntityVersionSnapshots(previous, next): ModelCudMigrationCandidate[]`
7. **Action** — Phase 5
   - `freezeApplicationVersion` ModelAction payload: `{ application, versionName, description?, branch? }`
8. **Handler** — Phases 5–6
   - DomainController (or dedicated runner) materializes plan and persists instances **with section-aware EV writes**; rejects unversioned / duplicate label

Impl home: `packages/miroir-core/src/1_core/versioning/applicationVersionFreeze.ts` (+ `applicationVersioning.ts` for fixtures / immutability).

---

## Test execution conventions

| Purpose | Command |
|---|---|
| Core targeted tests | `npm run testByFile -w miroir-core -- <pattern>` |
| Core MiroirTest unit | `npm run testMiroir -w miroir-core -- --suites <suite> --mode unit` |
| Standalone integration | `npm run testMiroir -w miroir-standalone-app -- --suites <suite> --mode integration` |
| Filesystem DomainController integ (existing pattern) | `VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-filesystem.json npm run testByFile -w miroir-standalone-app -- <pattern>` |
| Type-check | `npx tsc --noEmit --skipLibCheck` |

Legend:

- **RED**: new behavior test fails first
- **GREEN**: minimal implementation makes it pass
- **NON-REGRESSION**: related existing suites stay green

Prefer pure domain tests in `miroir-core` for Phases 0–4; add persistence / Action integ in Phases 5–8. Avoid mocks of LocalCache / stores when an integ path exists.

---

## Phase 0 — Lock freeze contracts & fixtures  ✅ DONE

### Goal

Characterize current gaps so freeze work does not regress #217 invariants, and lock naming / payload shape for the Action.

**Realization:** `FREEZE_APPLICATION_VERSION_ACTION_TYPE` + section helper in `versioning/applicationVersionFreeze.ts`; suite `applicationVersionFreeze.216.phase0.unit.test.ts` (5/5 after #220/#222 retarget). Non-reg: `220.phase0` / `222.phase4` as needed.

### 0.1 RED → GREEN — Gate contract characterization

Test file: `packages/miroir-core/tests/1_core/applicationVersionFreeze.216.phase0.unit.test.ts`

Behaviors:

- `VERSIONED_APPLICATION_FIXTURE.versioningEnabled === true`
- `UNVERSIONED_APPLICATION_FIXTURE.versioningEnabled === false`
- Document expected Action type string `"freezeApplicationVersion"` (constant export or test expectation)
- `ApplicationVersionCrossEntityVersionSchema` still requires `applicationVersion` + `entityVersion`

#### Validation
```
npm run testByFile -w miroir-core -- applicationVersionFreeze.216.phase0
```

### 0.2 RED → GREEN — UUID-reuse anti-pattern (post-#220)

Assert that `entityDefinitionCompatibility.ts` / `presentEntityAsRedundantEntityDefinition` are **absent** (do not reintroduce). Freeze must mint new UUIDs via `snapshotEntitiesAsHistoricalEntityVersions` only.

### 0.3 RED → GREEN — #222 section matrix for freeze writes

- `resolveFreezeEntityVersionApplicationSection(Miroir) === "data"`
- `resolveFreezeEntityVersionApplicationSection(Library) === "model"`

### NON-REGRESSION
```
npm run testByFile -w miroir-core -- applicationVersionFreeze.216
npm run testByFile -w miroir-core -- 220.phase0
```

---

## Phase 1 — Versioning gate + Entity snapshot planner  ✅ DONE

### Goal

Pure helpers: reject unversioned apps; copy Entities into historical EntityVersions with **new** UUIDs and §11.3 field equality.

### 1.1 RED → GREEN — `assertApplicationVersioningEnabled`

Test file: `packages/miroir-core/tests/1_core/applicationVersionFreeze.216.gate.unit.test.ts`

| Input | Expected |
|---|---|
| `{ versioningEnabled: true }` | no throw |
| `{ versioningEnabled: false }` | throw |
| `{ }` / `undefined` flag | throw (treat as not enabled) |

Impl: `packages/miroir-core/src/1_core/versioning/applicationVersionFreeze.ts`.

### 1.2 RED → GREEN — `snapshotEntitiesAsHistoricalEntityVersions`

Test file: `packages/miroir-core/tests/1_core/applicationVersionFreeze.216.snapshot.unit.test.ts`

Behaviors:

- For each input Entity with complete present model, output EntityVersion has:
  - **new** `uuid` ≠ Entity.uuid
  - `entityUuid === Entity.uuid`
  - `parentUuid` / `parentName` = EntityVersion entity
  - `projectEntityPresentModelDefinition(ev) == projectEntityPresentModelDefinition(entity)` (§11.3)
  - `name` (and other identity fields carried on Entity) copied
- Deep isolation: mutate source Entity.`mlSchema` after snapshot → historical copy unchanged
- Empty entity list → empty result
- Incomplete Entity (no `mlSchema`) → explicit error (no silent skip)

#### Validation
```
npm run testByFile -w miroir-core -- applicationVersionFreeze.216.gate
npm run testByFile -w miroir-core -- applicationVersionFreeze.216.snapshot
```

### NON-REGRESSION
```
npm run testByFile -w miroir-core -- entityPresentModel
```

---

## Phase 2 — Freeze plan builder (SAV + Cross + isolation)  ✅ DONE

### Goal

Pure `buildFreezeApplicationVersionPlan` assembles first-freeze plan without persistence.

**Realization:** `buildFreezeApplicationVersionPlan` + `planFreezeApplicationVersion` in `versioning/applicationVersionFreeze.ts`; suite `applicationVersionFreeze.plan.unit.test.ts` (5/5). Throws on duplicate label (same app+branch); Action entry calls versioning gate. Plan includes `entityVersionApplicationSection` via #222 helper.

### 2.1 RED → GREEN — First freeze plan

Test file: `packages/miroir-core/tests/1_core/applicationVersionFreeze.plan.unit.test.ts`

Input (minimal): versioned SelfApplication, branch uuid, versionName, live Entities[].

Assert plan:

- One new `SelfApplicationVersion` with `name === versionName`, `selfApplication`, `branch`, **no** `previousVersion` (or undefined)
- `modelCUDMigration` empty / bootstrap for first freeze
- N EntityVersions (N = entities.length) with new UUIDs
- N Cross rows: each `applicationVersion === sav.uuid`, `entityVersion` ∈ snapshot uuids; every live `entityUuid` covered exactly once
- Cross does not reference live Entity uuids as `entityVersion`

### 2.2 RED → GREEN — Duplicate label detection (pure)

Given existing SAV names for app+branch, building a plan with the same `versionName` throws / returns ActionError-shaped result (choose one style and stick to DomainController conventions in Phase 5).

### 2.3 RED → GREEN — Unversioned rejection inside plan entry

Calling plan builder without passing gate first is OK if gate is separate; plan entrypoint used by Action must call gate — test the composed `planFreezeApplicationVersion` wrapper.

#### Validation
```
npm run testByFile -w miroir-core -- applicationVersionFreeze.plan
```

---

## Phase 3 — Linear tip resolution (`previousVersion`)  ✅ DONE

### Goal

Resolve previous freeze tip; second freeze links `previousVersion`.

### Delivered

- `resolvePreviousApplicationVersion` — chain head for app+branch; `freezeProducedVersionUuids` excludes placeholders (`"Initial"`); throws on multiple heads.
- `buildFreezeApplicationVersionPlan` auto-fills `previousVersion` from tip when `previousVersionUuid` omitted; explicit uuid wins.
- Tests: `applicationVersionFreeze.tip.unit.test.ts` (8/8). Fixture `"Initial"` policy deferred to Phase 7.

#### Validation
```
npm run testByFile -w miroir-core -- applicationVersionFreeze.tip
```

---

## Phase 4 — Entity-set diff → rough migration evaluation  ⬜ TODO

### Goal

Option A: diff previous vs next EntityVersion sets → `modelCUDMigration` candidates.

### 4.1 RED → GREEN — Diff delta classes

Test file: `packages/miroir-core/tests/1_core/applicationVersionFreeze.diff.unit.test.ts`

| Case | Expected candidates (rough) |
|---|---|
| Identical projections | `[]` |
| New Entity in next only | `createEntity` (or equivalent tag) |
| Entity only in previous | `dropEntity` |
| Same `entityUuid`, name changed | `renameEntity` |
| Same `entityUuid`, mlSchema / definition field changed | `alterEntityAttribute` (or `schemaUpdate`) with enough detail to see changed fields |

Candidate shape (v1, stored as plain records in `modelCUDMigration`):

```ts
{
  kind: "createEntity" | "dropEntity" | "renameEntity" | "alterEntityAttribute",
  entityUuid: string,
  // kind-specific: name, targetName, differingFields?, ...
}
```

### 4.2 RED → GREEN — Plan attaches diff on second freeze

`buildFreezeApplicationVersionPlan` with `previousSnapshot` fills `sav.modelCUDMigration` from diff; first freeze leaves `[]`.

#### Validation
```
npm run testByFile -w miroir-core -- applicationVersionFreeze.diff
```

### NON-REGRESSION
Do **not** change `schemaChangeKind` behavior; freeze diff is a separate module.

---

## Phase 5 — Wire `freezeApplicationVersion` Action  ⬜ TODO

### Goal

Schema + DomainController dispatch: Action accepted for versioned apps, rejected for unversioned; returns plan result without requiring full multi-store integ yet (handler may call pure planner and a persistence port stubbed only if unavoidable — prefer real LocalCache path in Phase 6).

### 5.1 RED → GREEN — Model Endpoint Action schema

- Add `freezeApplicationVersion` to Model Endpoint Action union (asset under `7947ae40-…` / related Action type definitions).
- Regenerate types: `npm run devBuild -w miroir-core` (after deployment package build if needed).
- Unit test: Zod parse of valid / invalid payloads.

Test file: `packages/miroir-core/tests/1_core/applicationVersionFreeze.actionSchema.unit.test.ts`

### 5.2 RED → GREEN — Handler gate

Test (core or standalone unit with DomainController test harness used elsewhere):

- Unversioned SelfApplication → ActionError
- Versioned + valid name → success path invokes planner (assert via persisted instances in Phase 6 if handler is persistence-coupled)

#### Validation
```
npm run testByFile -w miroir-core -- applicationVersionFreeze.actionSchema
# plus handler test pattern chosen in GREEN
```

---

## Phase 6 — Persist freeze (filesystem integ)  ⬜ TODO

### Goal

End-to-end on filesystem emulated server: freeze persists SAV + EntityVersions + Cross; live Entity edit afterward leaves snapshot intact; second freeze diffs and links.

### 6.1 RED → GREEN — First freeze persistence

Test file (standalone): e.g. `packages/miroir-standalone-app/tests/.../applicationVersionFreeze.integ.test.ts`  
Config: filesystem emulated server (same pattern as DomainController.integ).

Behaviors:

- After freeze: reload → SAV present; Cross count = Entity count; each EntityVersion §11.3-equal to Entity at freeze
- **Section matrix:** Miroir historical EV instances under **data**; Library under **model** (`resolveFreezeEntityVersionApplicationSection`)
- Live `alterEntityAttribute` / Entity field update after freeze → historical EntityVersion unchanged
- Unversioned deployment (fixture or toggled only if test can create unversioned app) rejects freeze
- Pre-existing Miroir documentation-class EV rows (if present) are not mutated / not reused as freeze snapshot UUIDs

### 6.2 RED → GREEN — Second freeze

- `previousVersion` set
- `modelCUDMigration` non-empty when Entities changed between freezes; empty when unchanged

#### Validation
```
VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-filesystem.json \
  npm run testByFile -w miroir-standalone-app -- applicationVersionFreeze
```

### NON-REGRESSION
```
# existing DomainController / model CRUD integ subset as used after #217
npm run testByFile -w miroir-standalone-app -- DomainController.integ
```
(Run selectively if full file is heavy; document chosen subset.)

---

## Phase 7 — Commit / `"Initial"` hygiene  ⬜ TODO

### Goal

Commit must not compete with freeze as the version publisher (ADR D6).

### 7.1 RED → GREEN — Commit does not create authoritative freeze snapshots

Characterization → behavior change:

- Either stop creating placeholder SAV on commit, **or** create it only as non-tip internal marker clearly excluded from `resolvePreviousApplicationVersion`
- Test: after model Action + commit without freeze, tip resolution for freeze still `undefined` / unchanged; no new complete Cross Entity snapshot set

Test file: extend freeze tip/integ tests + focused DomainController unit if commit path is isolatable.

### 7.2 Document fixture policy

Short note in `./analysis.md` §9 item 3 → resolved: ignore `"Initial"` for tip; optional follow-up migration issue (do not block #216).

#### Validation
```
npm run testByFile -w miroir-core -- applicationVersionFreeze.tip
# + integ assertion from 7.1
```

---

## Phase 8 — End-to-end tracer bullet + WP2 handoff  ⬜ TODO

### Goal

One narrative test locks the accepted product path; WP2 analysis points at freeze artefacts.

### 8.1 RED → GREEN — Tracer bullet

Single integ (or MiroirTest) scenario:

1. Versioned app, baseline (no freeze tip)
2. Freeze `V1` → snapshot Entities, empty migration
3. Mutate one Entity (add attribute)
4. Freeze `V2` → `previousVersion = V1`, diff contains alter (and not unrelated noise)
5. Assert live model still Entity-authoritative (no read through Cross)

### 8.2 Docs

- Update WP2 analysis: migration **nodes** = frozen SAVs; **edges** = `modelCUDMigration` from Option A diff (derived, not Action tape).
- Link this plan from analysis §8.

### 8.3 Progress

Mark phases in this file’s progress table as DONE with test counts.

#### Validation
```
npm run testByFile -w miroir-core -- applicationVersionFreeze
# + integ tracer from 8.1
npx tsc --noEmit --skipLibCheck
```

---

## Out of scope (do not implement in this plan)

- Option B action-log accrual / WP1 replayable payloads
- Snapshotting Reports, Queries, Menus, Endpoints, Transformers
- Branch fork/merge
- Automatic freeze on commit/deploy
- Full WP2 apply/replay planner (#9 WP2)
- Paired data migrations (#215)
- Release channels / rollback UI

---

## Suggested file layout (GREEN invents minimally)

| Concern | Suggested path |
|---|---|
| Gate + snapshot + plan + tip + diff + section helper | `packages/miroir-core/src/1_core/versioning/applicationVersionFreeze.ts` (split if file grows) |
| Fixtures / immutability | `packages/miroir-core/src/1_core/versioning/applicationVersioning.ts` |
| Unit tests | `packages/miroir-core/tests/1_core/applicationVersionFreeze.*.unit.test.ts` |
| Action schema | Model Endpoint assets + regenerated `miroirFundamentalType.ts` |
| Handler | `DomainController` model Action switch (or extracted runner called from it) |
| Integ | `packages/miroir-standalone-app/tests/.../applicationVersionFreeze.integ.test.ts` |

Export new pure helpers from `miroir-core` `index.ts` only if other packages need them in the same PR slice.
