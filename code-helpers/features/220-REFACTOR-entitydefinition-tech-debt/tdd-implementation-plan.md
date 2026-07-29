# Issue #220 — TDD Implementation Plan

## Scope

Bring leftover `EntityDefinition` technical debt to a **reasonable** level so #216 freeze work can resume without mixing:

- live **Entity** present model;
- historical **EntityVersion** snapshots;
- deprecated `EntityDefinition` aliases / dual-write UUID-reuse helpers.

This plan turns [`./analysis.md`](./analysis.md) migration cases into vertical red→green slices. **Done means code + tests**, not docs alone.

Related:

- Issue: https://github.com/miroir-framework/miroir/issues/220
- Analysis: [`./analysis.md`](./analysis.md)
- Prerequisite #217: [`../217-/analysis.md`](../217-/analysis.md)
- Consumer #216: [`../216-FEATURE-application-versions-and-freeze/tdd-implementation-plan.md`](../216-FEATURE-application-versions-and-freeze/tdd-implementation-plan.md)

### In scope for “reasonable” (unblock #216)

Originally Phases **0–5** (analysis Cases 1–4, 5a, 7). **Phase 6** (Cases 5b/5c + store/localcache rename) was also completed afterward.

### Remaining deferred

| Analysis case | Deferred to |
|---|---|
| 8 — UI / report schema field `definition.entityDefinitions` / docs | #213 or Phase 7 |
| 9 — evolution-trace op string rename | leave frozen (WP1) |

---

## Progress summary

| Phase | Title | Analysis cases | Status | Tests |
|---|---|---|---|---|
| 0 | Characterization locks & dividing-line guards | — | ✅ DONE | `220-entityDefinition-tech-debt/220.phase0` |
| 1 | Freeze path vocabulary (`EntityVersion` return types) | Case 1 | ✅ DONE | 220.phase1 + freeze snapshot |
| 2 | Quarantine UUID-reuse / compat helpers from freeze | Case 2 | ✅ DONE (compat module later **deleted**) | 220.phase2 |
| 3 | Present-model Actions: Entity-only for complete Entities | Case 3 | ✅ DONE | 220.phase3 |
| 4 | Dual-write persistence shrink / quarantine | Case 4 | ✅ DONE (persist dual-write **removed**) | 220.phase4 |
| 5 | `entityVersions` preferred accessor + freeze-critical test vocabulary | Cases 5a, 7 | ✅ DONE | 220.phase5 + metaModelEntityVersions |
| 6 | MetaModel / store / localcache rename wave | Cases 5b/5c, 6 | ✅ DONE | 220.phase6 |
| 7 | Optional UI / docs | Case 8 | ⬜ DEFERRED → #213 | — |

**#220 exit:** Phases **0–6** ✅ DONE. Remaining: Phase 7 / #213 (report-diagram UI field + docs). Acceptance checklist in §Acceptance covers the original “reasonable” bar (0–5); Phase 6 exceeded it.

---

## Locked implementation defaults (analysis §7)

| Open item | Choice for this plan |
|---|---|
| Live redundant EntityVersion rows in assets | **Stop writing** on ordinary complete-Entity Actions (Phases 3–4). **Do not delete** persisted deployment rows in #220 unless a slice is trivially covered by existing nonreg. |
| Same MetaModel array for live-redundant vs historical | **Keep one collection** in #220. Do not invent a second array. Freeze creates historical rows + Cross; live interpretation ignores Cross (#216). |
| Rename `presentEntityAsRedundantEntityDefinition` | **Quarantine + deprecate first** (Phase 2). Rename only if greps remain confusing after Phase 4. |
| `MetaModel.entityDefinitions` → `entityVersions` | **Done in Phase 6** (schema + call sites). Phase 5a shipped accessors first. |
| Evolution-trace `createEntityDefinition` / `updateEntityDefinition` | **Leave frozen** — no Phase owns renaming them. |
| Deprecated TS alias `EntityDefinition = EntityVersion` | **Keep** as thin generated alias; call sites prefer `EntityVersion`. |

---

## Related plans

- [createEntity-remove-entityVersion-tdd-plan.md](./createEntity-remove-entityVersion-tdd-plan.md) — remove `entityVersion` from `createEntity` (store → Action → callers), Entity-only create.

## Target public interfaces

1. **Freeze (history)** — shipped under #216 Phase 0–1 + #220 Phase 1:
   - `snapshotEntitiesAsHistoricalEntityVersions(entities, options?): EntityVersion[]`
   - Must **not** import UUID-reuse compat helpers.
2. **Compat quarantine module**:
   - `packages/miroir-core/src/1_core/entityDefinitionCompatibility.ts`
   - Holds: `presentEntityAsRedundantEntityDefinition`, dual-write re-exports, EOL comment.
   - `@deprecated` on each export; JSDoc: “not for freeze / historical minting”.
3. **Present-model Actions**:
   - `planCreateEntityMutation` / `planRenameEntityMutation` / `planAlterEntityAttributeMutation` remain; for complete Entity → `{ mode: "entityOnly" }` without requiring live ED.
4. **MetaModel EntityVersion collection (Phase 5a + 6)**:
   - `MetaModel.entityVersions: EntityVersion[]` (canonical after Phase 6).
   - `getMetaModelEntityVersions(model)` / `withMetaModelEntityVersions(model, versions)` — read/write `entityVersions` only.
5. **Dual-write persistence**:
   - `persistEntityThenEntityDefinition` stays callable from bootstrap/legacy / store ED payloads only; not from complete-Entity Action happy path.

---

## Test execution conventions

| Purpose | Command |
|---|---|
| Core targeted | `npm run testByFile -w miroir-core -- <pattern>` |
| Core MiroirTest unit | `npm run testMiroir -w miroir-core -- --suites <suite> --mode unit` |
| Filesystem DomainController integ | `VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-filesystem.json npm run testByFile -w miroir-standalone-app -- DomainController.integ` |
| Type-check | `npx tsc --noEmit --skipLibCheck` |

Legend:

- **RED**: new behavior / characterization test fails first (or fails under stricter assert)
- **GREEN**: minimal code to pass
- **NON-REGRESSION**: related existing suites stay green

Prefer pure domain tests in `miroir-core`. Avoid mocks of LocalCache / stores when an integ path exists. Prefer extending existing `#217` / `#216` suites over inventing parallel harnesses.

---

## Phase 0 — Characterization locks & dividing-line guards  ✅ DONE

### Goal

Encode the dividing line as failing/strict tests before refactors, so later phases cannot reintroduce UUID-reuse into freeze or present-model-through-ED authority.

### 0.1 RED → GREEN — Freeze must not import compat UUID-reuse

Test file (new or extend): `packages/miroir-core/tests/1_core/220-entityDefinition-tech-debt/220.phase0.unit.test.ts`

Behaviors:

- Read `applicationVersionFreeze.ts` source (or use a small exported `FREEZE_MODULE_FORBIDDEN_IMPORTS` list maintained next to freeze) and assert it does **not** reference:
  - `presentEntityAsRedundantEntityDefinition`
  - `resolveOrSynthesizeEntityDefinitionForCreate`
  - `persistEntityThenEntityDefinition`
- Existing `applicationVersionFreeze.216.phase0` UUID-reuse characterization remains green (documents the anti-pattern).

#### Validation
```
npm run testByFile -w miroir-core -- 220.phase0
npm run testByFile -w miroir-core -- applicationVersionFreeze.216.phase0
```

### 0.2 RED → GREEN — Snapshot return type contract (characterization)

Extend `applicationVersionFreeze.216.snapshot.unit.test.ts`:

- Assign result to a variable typed as `EntityVersion` (not `EntityDefinition`) in the test — documents Case 1 target.
- Keep asserts: new uuid ≠ entity.uuid; `entityUuid === entity.uuid`.

If production still returns/exports under the alias only, this may already compile (alias); Phase 1 makes the **implementation signature** say `EntityVersion[]` and removes `EntityDefinition` identifiers from the freeze module body.

### NON-REGRESSION
```
npm run testByFile -w miroir-core -- applicationVersionFreeze
npm run testByFile -w miroir-core -- entityPresentModel.217.phase12
```

---

## Phase 1 — Freeze path vocabulary (`EntityVersion`)  ✅ DONE  · Case 1

### Goal

Freeze-adjacent APIs and the freeze module speak `EntityVersion` only.

### 1.1 RED → GREEN — Signature & module vocabulary

Impl file: `packages/miroir-core/src/1_core/applicationVersionFreeze.ts`

- Change `snapshotEntitiesAsHistoricalEntityVersions` return type to `EntityVersion[]`.
- Local snapshot variable typed `EntityVersion`.
- Imports use `EntityVersion` from generated types; do not import `EntityDefinition` in this file.
- Update `index.ts` export types/docs if they mention EntityDefinition for this symbol.

Test: strengthen `applicationVersionFreeze.216.snapshot.unit.test.ts` imports to `EntityVersion`.

#### Validation
```
npm run testByFile -w miroir-core -- applicationVersionFreeze.216.snapshot
npm run testByFile -w miroir-core -- applicationVersionFreeze.216.gate
```

### 1.2 RED → GREEN — Freeze module greppable clean

Extend phase0 debt test (or add `220.phase1.unit.test.ts`):

- `applicationVersionFreeze.ts` text matches **zero** `\bEntityDefinition\b` (allow a single comment line pointing at the deprecated helper as anti-pattern, if needed — prefer zero).

### NON-REGRESSION
```
npm run testByFile -w miroir-core -- applicationVersionFreeze
```

---

## Phase 2 — Quarantine UUID-reuse / compat helpers  ✅ DONE  · Case 2

### Goal

Move “redundant live definition” projection and synthesize-for-create behind an explicit compatibility boundary so #216 cannot accidentally call them from freeze code.

### 2.1 RED → GREEN — Compat module exists; freeze still forbidden

Test file: `packages/miroir-core/tests/1_core/220-entityDefinition-tech-debt/220.phase2.unit.test.ts`

Behaviors:

- Importing from `entityDefinitionCompatibility` (or chosen path) yields `presentEntityAsRedundantEntityDefinition`.
- Calling it still reuses `entity.uuid` (behavior preserved for legacy).
- `applicationVersionFreeze` module still has no import of that symbol (Phase 0 guard).

Impl:

- Create `packages/miroir-core/src/1_core/entityDefinitionCompatibility.ts`.
- Move or re-export UUID-reuse + `resolveOrSynthesizeEntityDefinitionForCreate` here with `@deprecated` + EOL note (“remove when no incomplete-Entity / legacy create payloads remain”).
- `entityPresentModel.ts` may keep a thin deprecated re-export **or** delete and update callers to the compat module.
- Update `modelEntityActionLiveResolve.ts` and `index.ts` accordingly.
- Update `entityPresentModel.217.phase9.unit.test.ts` imports.

### 2.2 RED → GREEN — Public index documents quarantine

- `index.ts`: group compat exports under a comment block `#220 compat — do not use for freeze`.
- Optional: stop exporting `resolveOrSynthesizeEntityDefinitionForCreate` from the top-level barrel if unused outside core (grep first; only remove if safe).

#### Validation
```
npm run testByFile -w miroir-core -- 220.phase2
npm run testByFile -w miroir-core -- entityPresentModel.217.phase9
npm run testByFile -w miroir-core -- applicationVersionFreeze.216.phase0
```

### NON-REGRESSION
```
npm run testByFile -w miroir-core -- modelEntityDualWrite
npm run testByFile -w miroir-core -- ModelEntityActionTransformer.217.phase11
```

---

## Phase 3 — Present-model Actions: Entity-only for complete Entities  ✅ DONE  · Case 3

### Goal

Ordinary post-#217 apps mutate present model without requiring a live EntityDefinition / EntityVersion row.

### 3.1 RED → GREEN — Planner characterization (extend phase11)

Test file: extend `packages/miroir-core/tests/1_core/entityPresentModel.217.phase11.unit.test.ts` and/or `ModelEntityActionTransformer.217.phase11.unit.test.ts`

Behaviors (assert if not already):

| Scenario | Expected plan |
|---|---|
| Create complete Entity, no ED in payload | `entityOnly` |
| Rename complete Entity | `entityOnly` |
| Alter attribute on complete Entity | `entityOnly` |
| Create with explicit ED supplied | `dualWrite` (legacy) |
| Incomplete Entity + live ED available | `dualWrite` enrichment |

### 3.2 RED → GREEN — Transformer does not fetch ED for entityOnly

- When plan is `entityOnly`, `ModelEntityActionTransformer` must not call `resolveLiveEntityDefinitionForAction` as a hard requirement (no throw if `entityDefinitions` array empty/missing for that entity).
- Add unit test with MetaModel containing Entity (complete) and **empty** `entityDefinitions` → rename/alter still produces Action success / expected next Entity.

### 3.3 RED → GREEN — Bootstrap exception documented

- ModelInitializer / bootstrap dual-write path: either still dual-writes with a code comment referencing #220 EOL, or Entity-only if already safe.
- Characterization test: document which path bootstrap uses (do not silently change metamodel seed without nonreg).

#### Validation
```
npm run testByFile -w miroir-core -- entityPresentModel.217.phase11
npm run testByFile -w miroir-core -- ModelEntityActionTransformer.217.phase11
```

### NON-REGRESSION
```
npm run testByFile -w miroir-core -- modelEntityDualWrite
npm run testByFile -w miroir-core -- entityPresentModel.217.phase1
```

Optional integ (if unit coverage gaps):
```
VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-filesystem.json npm run testByFile -w miroir-standalone-app -- DomainController.integ
```

---

## Phase 4 — Dual-write persistence shrink / quarantine  ✅ DONE  · Case 4

### Goal

`persistEntityThenEntityDefinition` is not on the complete-Entity happy path; remaining callers are bootstrap/legacy only and live under the compat boundary.

### 4.1 RED → GREEN — Call-site inventory test

Test file: `packages/miroir-core/tests/1_core/220-entityDefinition-tech-debt/220.phase4.unit.test.ts`

Approach (pick one and stick to it):

- **Preferred:** maintain an allowlist array in the test of relative source paths allowed to reference `persistEntityThenEntityDefinition`; fail if new files appear.
- Or: export a single `persistEntityThenEntityDefinitionForLegacy` from compat module; production Action path imports must not reference the old name.

### 4.2 RED → GREEN — Complete-Entity Action path does not dual-persist

- Unit or thin integration: after `entityOnly` create/alter, assert persistence ops invoked for **Entity only** (mock ops object on `PersistEntityThenEntityDefinitionOps` pattern, or spy at transformer boundary already used in phase11 tests).
- Dual-write unit tests remain green for explicit dual-write pairs.

### 4.3 GREEN — EOL comment on dual-write modules

- File headers on `modelEntityDualWrite*.ts` and compat module state: remove when deployments no longer ship incomplete Entities / legacy ED payloads; gated by #220 follow-up / #215.

#### Validation
```
npm run testByFile -w miroir-core -- 220.phase4
npm run testByFile -w miroir-core -- modelEntityDualWritePersistence
npm run testByFile -w miroir-core -- ModelEntityActionTransformer.217.phase11
```

---

## Phase 5 — Preferred `entityVersions` access + freeze-critical test vocabulary  ✅ DONE  · Cases 5a, 7

### Goal

Freeze-adjacent and new code prefer `entityVersions` naming; critical tests stop teaching EntityDefinition-as-live-model. (Full MetaModel property rename followed in Phase 6.)

### 5.1 RED → GREEN — Accessor helpers

Test file: `packages/miroir-core/tests/1_core/220-entityDefinition-tech-debt/220.phase5.unit.test.ts`

**As shipped in Phase 5** (before Phase 6 schema rename): helpers were named `…EntityVersions` while MetaModel still used `entityDefinitions`. **After Phase 6:** helpers read/write `MetaModel.entityVersions` only.

Impl: `packages/miroir-core/src/1_core/metaModelEntityVersions.ts`.

### 5.2 RED → GREEN — Freeze / debt tests use Entity + EntityVersion vocabulary

- Update `applicationVersionFreeze.*` tests: types and comments say EntityVersion.
- Update phase0 debt tests’ prose.
- Split or comment dual-write tests as **compat** (`modelEntityDualWrite*.unit.test.ts` headers: “#220 compat suite”).
- Present-model assertions in touched tests read `Entity.mlSchema` / present-model helpers, not “definition is source of truth”.

### 5.3 RED → GREEN — #216 handoff smoke

- One test (can live in `220.phase5`) that: snapshot Entities → historical EntityVersions with new UUIDs; assert `getMetaModelEntityVersions`-style naming in the arrange/assert comments; assert UUID-reuse helper was not used.

#### Validation
```
npm run testByFile -w miroir-core -- 220.phase5
npm run testByFile -w miroir-core -- applicationVersionFreeze
npm run testByFile -w miroir-core -- entityPresentModel.217.phase9
npm run testByFile -w miroir-core -- entityPresentModel.217.phase11
```

### NON-REGRESSION
```
npm run testByFile -w miroir-core -- entityPresentModel
npm run testByFile -w miroir-core -- modelEntityDualWrite
```

---

## Phase 6 — MetaModel / store / localcache rename wave  ✅ DONE  · Cases 5b/5c, 6

### Goal

Rename `MetaModel.entityDefinitions` → `entityVersions` through generated schema, stores, localcache, deployment builders. Update `bootFromPersistedState` parameter names.

**Realization (2026-07-27):**

1. Bootstrap schema key renamed in `getMiroirFundamentalJzodSchema.ts`; `generate-ts-types` regenerated MetaModel.
2. Core constructors (`emptyMetaModel`, `emptyApplicationModel`, Deployment filters, DomainController, PersistenceStoreController).
3. Store `bootFromPersistedState(..., entityVersions)` across filesystem / indexedDb / postgres / mongodb / bundled + Error stores.
4. localcache-redux / zustand MetaModel assemblers.
5. Deployment `defaultMiroirMetaModel` / `defaultLibraryAppModel` + package rebuilds.
6. Accessors simplified to read/write `entityVersions` only; legacy key stripped on write.

Report-diagram schema field `definition.entityDefinitions` intentionally left for Phase 7 / #213.

Test file: `packages/miroir-core/tests/1_core/220-entityDefinition-tech-debt/220.phase6.unit.test.ts`

#### Validation
```
npm run testByFile -w miroir-core -- 220.phase
```

---

## Phase 7 — Optional UI / docs (DEFERRED → #213)  · Case 8

Rename report diagram `entityDefinitions` field / standalone UI props only when cheap or when #213 is worked. Not required for #220 exit.

---

## Acceptance checklist (#220)

Authoritative AC = [issue #220](https://github.com/miroir-framework/miroir/issues/220) body (8 bullets). Plan phases map onto them; Phase 6 + Entity-only Action slices are **over-delivery**, not substitute ACs.

- [x] Present-model resolution used by model Actions / selectors / local cache no longer prefers or requires a live EntityDefinition instance for ordinary (post-#217) apps. *(Phases 3 + Entity-only Action slices; LocalCache PK/adapters Entity-first)*
- [x] Freeze-adjacent and history-oriented APIs/types/helpers in `miroir-core` (and directly coupled localcache/store surfaces) use `EntityVersion` vocabulary where they mean snapshots. *(Phases 1, 5a; Phase 6 MetaModel/store `entityVersions`)*
- [x] Dual-write / dual-read compatibility is either removed where unused, or quarantined behind an explicit compatibility boundary that #216 must not call for snapshot minting. *(Phases 2, 4 — completed by **removal**: compat + dual-write persist modules deleted)*
- [x] Helpers that project Entity → redundant live definition (UUID-reuse) are clearly separated from historical EntityVersion minting; call sites that matter for #216 are updated or guarded. *(Phases 0, 2 — helper removed; freeze gates forbid the symbols)*
- [x] Critical tests updated so they assert Entity present-model + EntityVersion history concepts rather than teaching EntityDefinition-as-live-model. *(`220.*` characterization suite; Phase 5)*
- [x] Relevant package unit suites for touched areas pass; no new present-model coupling to ApplicationVersion Cross mappings. *(`npm run testByFile -w miroir-core -- '220.'` 12/12 files, 53/53; Entity-only plans’ curated integ noted in slice docs. Issue wording also names `testMiroir` — run as needed for freeze handoff.)*
- [x] Remaining intentional `EntityDefinition` aliases/shims are greppable and justified (thin deprecated exports / temporary compat only). *(generated `EntityDefinition = EntityVersion`; evolution-trace op strings frozen; no live compat module)*
- [x] #216 can resume without first inventing another vocabulary cleanup pass for the freeze path. *(handoff smoke Phase 5; freeze module EntityVersion-only)*

**Over-delivery (not required by issue AC):** Phase 6 `MetaModel.entityVersions`; Entity-only `bootFromPersistedState`; Entity-only create/rename/alter/drop/DuplicateAttribute Action/store paths.

**Deferred (not blocking):** Case 8 / Phase 7 report-diagram `definition.entityDefinitions` + docs → #213; evolution-trace op rename left frozen.

---

## Suggested commit / PR slicing

| PR | Phases | Notes |
|---|---|---|
| PR1 | 0–1 | Types + characterization; tiny |
| PR2 | 2 | Compat module move |
| PR3 | 3–4 | Entity-only path + dual-write shrink |
| PR4 | 5 | Accessors + test vocabulary; original “reasonable” bar |
| PR5 | 6 | MetaModel / store / localcache `entityVersions` rename |

Phase 7 / #213 remains separate (report-diagram UI field + docs).

---

## Out of scope (never in this plan)

- Implementing #216 freeze Action / plan builder / diff / persist (owned by #216 plan Phases 2+).
- Perfect repo-wide purge of the string `EntityDefinition`.
- Rewriting closed GitHub issues or release bundle artifacts.
- Renaming WP1 evolution-trace operationType enums.
