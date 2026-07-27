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

Phases **0–5** below (analysis Cases 1–4, 5a, 7).

### Explicitly deferred (post-reasonable / follow-up)

| Analysis case | Deferred to |
|---|---|
| 5b / 5c — full `MetaModel.entityDefinitions` rename wave | Phase 6 (optional after #216 resume) |
| 6 — store / localcache parameter renames | Phase 6 |
| 8 — UI / report schema / docs | #213 or Phase 7 |
| 9 — evolution-trace op string rename | leave frozen (WP1) |

---

## Progress summary

| Phase | Title | Analysis cases | Status | Tests |
|---|---|---|---|---|
| 0 | Characterization locks & dividing-line guards | — | ⬜ TODO | — |
| 1 | Freeze path vocabulary (`EntityVersion` return types) | Case 1 | ⬜ TODO | — |
| 2 | Quarantine UUID-reuse / compat helpers from freeze | Case 2 | ⬜ TODO | — |
| 3 | Present-model Actions: Entity-only for complete Entities | Case 3 | ⬜ TODO | — |
| 4 | Dual-write persistence shrink / quarantine | Case 4 | ⬜ TODO | — |
| 5 | `entityVersions` preferred accessor + freeze-critical test vocabulary | Cases 5a, 7 | ⬜ TODO | — |
| 6 | Optional rename wave (MetaModel field / stores) | Cases 5b/5c, 6 | ⬜ DEFERRED | — |
| 7 | Optional UI / docs | Case 8 | ⬜ DEFERRED → #213 | — |

**#220 “reasonable” exit:** Phases 0–5 green + acceptance checklist in §Acceptance.

---

## Locked implementation defaults (analysis §7)

| Open item | Choice for this plan |
|---|---|
| Live redundant EntityVersion rows in assets | **Stop writing** on ordinary complete-Entity Actions (Phases 3–4). **Do not delete** persisted deployment rows in #220 unless a slice is trivially covered by existing nonreg. |
| Same MetaModel array for live-redundant vs historical | **Keep one collection** in #220. Do not invent a second array. Freeze creates historical rows + Cross; live interpretation ignores Cross (#216). |
| Rename `presentEntityAsRedundantEntityDefinition` | **Quarantine + deprecate first** (Phase 2). Rename only if greps remain confusing after Phase 4. |
| `MetaModel.entityDefinitions` → `entityVersions` | **Phase 5a:** preferred helper / dual field for builders & freeze-adjacent code. Full property rename = Phase 6 (deferred). |
| Evolution-trace `createEntityDefinition` / `updateEntityDefinition` | **Leave frozen** — no Phase owns renaming them. |
| Deprecated TS alias `EntityDefinition = EntityVersion` | **Keep** until Phase 6 call-site wave; thin re-export OK. |

---

## Target public interfaces

1. **Freeze (history)** — already partially shipped under #216 Phase 0–1:
   - `snapshotEntitiesAsHistoricalEntityVersions(entities, options?): **EntityVersion[]**`  
     (today incorrectly annotated as `EntityDefinition[]`)
   - Must **not** import UUID-reuse compat helpers.
2. **Compat quarantine module** (new or relocated):
   - e.g. `packages/miroir-core/src/1_core/entityDefinitionCompatibility.ts`
   - Holds: `presentEntityAsRedundantEntityDefinition`, dual-write pair helpers re-exports if needed, EOL comment.
   - `@deprecated` on each export; JSDoc: “not for freeze / historical minting”.
3. **Present-model Actions**:
   - `planCreateEntityMutation` / `planRenameEntityMutation` / `planAlterEntityAttributeMutation` remain; for complete Entity → `{ mode: "entityOnly" }` without requiring live ED.
4. **Preferred MetaModel access (Phase 5a)**:
   - `getMetaModelEntityVersions(model: MetaModel): EntityVersion[]`  
     reads `model.entityVersions ?? model.entityDefinitions` (or equivalent dual-read).
   - `withMetaModelEntityVersions(model, versions): MetaModel` writer used by freeze-adjacent builders.
5. **Dual-write persistence**:
   - `persistEntityThenEntityDefinition` stays callable from bootstrap/legacy only; not from complete-Entity Action happy path.

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

## Phase 0 — Characterization locks & dividing-line guards  ⬜ TODO

### Goal

Encode the dividing line as failing/strict tests before refactors, so later phases cannot reintroduce UUID-reuse into freeze or present-model-through-ED authority.

### 0.1 RED → GREEN — Freeze must not import compat UUID-reuse

Test file (new or extend): `packages/miroir-core/tests/1_core/entityDefinitionDebt.phase0.unit.test.ts`

Behaviors:

- Read `applicationVersionFreeze.ts` source (or use a small exported `FREEZE_MODULE_FORBIDDEN_IMPORTS` list maintained next to freeze) and assert it does **not** reference:
  - `presentEntityAsRedundantEntityDefinition`
  - `resolveOrSynthesizeEntityDefinitionForCreate`
  - `persistEntityThenEntityDefinition`
- Existing `applicationVersionFreeze.phase0` UUID-reuse characterization remains green (documents the anti-pattern).

#### Validation
```
npm run testByFile -w miroir-core -- entityDefinitionDebt.phase0
npm run testByFile -w miroir-core -- applicationVersionFreeze.phase0
```

### 0.2 RED → GREEN — Snapshot return type contract (characterization)

Extend `applicationVersionFreeze.snapshot.unit.test.ts`:

- Assign result to a variable typed as `EntityVersion` (not `EntityDefinition`) in the test — documents Case 1 target.
- Keep asserts: new uuid ≠ entity.uuid; `entityUuid === entity.uuid`.

If production still returns/exports under the alias only, this may already compile (alias); Phase 1 makes the **implementation signature** say `EntityVersion[]` and removes `EntityDefinition` identifiers from the freeze module body.

### NON-REGRESSION
```
npm run testByFile -w miroir-core -- applicationVersionFreeze
npm run testByFile -w miroir-core -- entityPresentModel.phase12
```

---

## Phase 1 — Freeze path vocabulary (`EntityVersion`)  ⬜ TODO  · Case 1

### Goal

Freeze-adjacent APIs and the freeze module speak `EntityVersion` only.

### 1.1 RED → GREEN — Signature & module vocabulary

Impl file: `packages/miroir-core/src/1_core/applicationVersionFreeze.ts`

- Change `snapshotEntitiesAsHistoricalEntityVersions` return type to `EntityVersion[]`.
- Local snapshot variable typed `EntityVersion`.
- Imports use `EntityVersion` from generated types; do not import `EntityDefinition` in this file.
- Update `index.ts` export types/docs if they mention EntityDefinition for this symbol.

Test: strengthen `applicationVersionFreeze.snapshot.unit.test.ts` imports to `EntityVersion`.

#### Validation
```
npm run testByFile -w miroir-core -- applicationVersionFreeze.snapshot
npm run testByFile -w miroir-core -- applicationVersionFreeze.gate
```

### 1.2 RED → GREEN — Freeze module greppable clean

Extend phase0 debt test (or add `entityDefinitionDebt.phase1.unit.test.ts`):

- `applicationVersionFreeze.ts` text matches **zero** `\bEntityDefinition\b` (allow a single comment line pointing at the deprecated helper as anti-pattern, if needed — prefer zero).

### NON-REGRESSION
```
npm run testByFile -w miroir-core -- applicationVersionFreeze
```

---

## Phase 2 — Quarantine UUID-reuse / compat helpers  ⬜ TODO  · Case 2

### Goal

Move “redundant live definition” projection and synthesize-for-create behind an explicit compatibility boundary so #216 cannot accidentally call them from freeze code.

### 2.1 RED → GREEN — Compat module exists; freeze still forbidden

Test file: `packages/miroir-core/tests/1_core/entityDefinitionDebt.phase2.unit.test.ts`

Behaviors:

- Importing from `entityDefinitionCompatibility` (or chosen path) yields `presentEntityAsRedundantEntityDefinition`.
- Calling it still reuses `entity.uuid` (behavior preserved for legacy).
- `applicationVersionFreeze` module still has no import of that symbol (Phase 0 guard).

Impl:

- Create `packages/miroir-core/src/1_core/entityDefinitionCompatibility.ts`.
- Move or re-export UUID-reuse + `resolveOrSynthesizeEntityDefinitionForCreate` here with `@deprecated` + EOL note (“remove when no incomplete-Entity / legacy create payloads remain”).
- `entityPresentModel.ts` may keep a thin deprecated re-export **or** delete and update callers to the compat module.
- Update `modelEntityActionLiveResolve.ts` and `index.ts` accordingly.
- Update `entityPresentModel.phase9.unit.test.ts` imports.

### 2.2 RED → GREEN — Public index documents quarantine

- `index.ts`: group compat exports under a comment block `#220 compat — do not use for freeze`.
- Optional: stop exporting `resolveOrSynthesizeEntityDefinitionForCreate` from the top-level barrel if unused outside core (grep first; only remove if safe).

#### Validation
```
npm run testByFile -w miroir-core -- entityDefinitionDebt.phase2
npm run testByFile -w miroir-core -- entityPresentModel.phase9
npm run testByFile -w miroir-core -- applicationVersionFreeze.phase0
```

### NON-REGRESSION
```
npm run testByFile -w miroir-core -- modelEntityDualWrite
npm run testByFile -w miroir-core -- ModelEntityActionTransformer.phase11
```

---

## Phase 3 — Present-model Actions: Entity-only for complete Entities  ⬜ TODO  · Case 3

### Goal

Ordinary post-#217 apps mutate present model without requiring a live EntityDefinition / EntityVersion row.

### 3.1 RED → GREEN — Planner characterization (extend phase11)

Test file: extend `packages/miroir-core/tests/1_core/entityPresentModel.phase11.unit.test.ts` and/or `ModelEntityActionTransformer.phase11.unit.test.ts`

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
npm run testByFile -w miroir-core -- entityPresentModel.phase11
npm run testByFile -w miroir-core -- ModelEntityActionTransformer.phase11
```

### NON-REGRESSION
```
npm run testByFile -w miroir-core -- modelEntityDualWrite
npm run testByFile -w miroir-core -- entityPresentModel.phase1
```

Optional integ (if unit coverage gaps):
```
VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-filesystem.json npm run testByFile -w miroir-standalone-app -- DomainController.integ
```

---

## Phase 4 — Dual-write persistence shrink / quarantine  ⬜ TODO  · Case 4

### Goal

`persistEntityThenEntityDefinition` is not on the complete-Entity happy path; remaining callers are bootstrap/legacy only and live under the compat boundary.

### 4.1 RED → GREEN — Call-site inventory test

Test file: `packages/miroir-core/tests/1_core/entityDefinitionDebt.phase4.unit.test.ts`

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
npm run testByFile -w miroir-core -- entityDefinitionDebt.phase4
npm run testByFile -w miroir-core -- modelEntityDualWritePersistence
npm run testByFile -w miroir-core -- ModelEntityActionTransformer.phase11
```

---

## Phase 5 — Preferred `entityVersions` access + freeze-critical test vocabulary  ⬜ TODO  · Cases 5a, 7

### Goal

Freeze-adjacent and new code prefer `entityVersions` naming; critical tests stop teaching EntityDefinition-as-live-model. Full MetaModel property rename remains deferred (Phase 6).

### 5.1 RED → GREEN — Accessor helpers

Test file: `packages/miroir-core/tests/1_core/entityDefinitionDebt.phase5.unit.test.ts`

Behaviors:

- `getMetaModelEntityVersions({ entityDefinitions: [...] })` returns that array.
- If both `entityVersions` and `entityDefinitions` exist, prefer `entityVersions` (document conflict policy: prefer new field).
- `withMetaModelEntityVersions` writes the preferred field used by freeze builders (implement as writing `entityDefinitions` **and** optional `entityVersions` mirror if dual-field; or only document alias until schema change — **locked default:** helper reads/writes via `entityDefinitions` today but is **named** `…EntityVersions` so call sites stop saying Definition).

> Avoid generated MetaModel schema change in Phase 5 unless cheap. Prefer named helpers over Jzod field rename here.

Impl: e.g. `packages/miroir-core/src/1_core/metaModelEntityVersions.ts` (or add to `Deployment.ts` / `Model.ts`).

### 5.2 RED → GREEN — Freeze / debt tests use Entity + EntityVersion vocabulary

- Update `applicationVersionFreeze.*` tests: types and comments say EntityVersion.
- Update phase0 debt tests’ prose.
- Split or comment dual-write tests as **compat** (`modelEntityDualWrite*.unit.test.ts` headers: “#220 compat suite”).
- Present-model assertions in touched tests read `Entity.mlSchema` / present-model helpers, not “definition is source of truth”.

### 5.3 RED → GREEN — #216 handoff smoke

- One test (can live in `entityDefinitionDebt.phase5`) that: snapshot Entities → historical EntityVersions with new UUIDs; assert `getMetaModelEntityVersions`-style naming in the arrange/assert comments; assert UUID-reuse helper was not used.

#### Validation
```
npm run testByFile -w miroir-core -- entityDefinitionDebt.phase5
npm run testByFile -w miroir-core -- applicationVersionFreeze
npm run testByFile -w miroir-core -- entityPresentModel.phase9
npm run testByFile -w miroir-core -- entityPresentModel.phase11
```

### NON-REGRESSION
```
npm run testByFile -w miroir-core -- entityPresentModel
npm run testByFile -w miroir-core -- modelEntityDualWrite
```

---

## Phase 6 — Optional rename wave (DEFERRED)  · Cases 5b/5c, 6

### Goal (after #216 can resume)

Rename `MetaModel.entityDefinitions` → `entityVersions` through generated schema, stores, localcache, deployment builders. Update `bootFromPersistedState` parameter names.

**Do not start until Phases 0–5 are accepted as “reasonable” and #216 is unblocked**, unless a freeze persist blocker forces 5b early (HITL).

Suggested sub-slices when opened:

1. Schema + `devBuild` types.
2. `miroir-core` MetaModel constructors / empty model.
3. Store mixins + PersistenceStoreController.
4. localcache-redux / zustand selectors.
5. Deployment package Model exports + asset loaders.
6. Remove deprecated alias field.

Validation: `tsc`, store unit tests, LocalCache unit, one DomainController integ filesystem.

---

## Phase 7 — Optional UI / docs (DEFERRED → #213)  · Case 8

Rename report diagram `entityDefinitions` field / standalone UI props only when cheap or when #213 is worked. Not required for #220 exit.

---

## Acceptance checklist (#220 reasonable)

Mirror of issue acceptance criteria — check off when Phases 0–5 done:

- [ ] Present-model resolution for ordinary complete Entities does not prefer/require a live EntityDefinition instance (Phase 3).
- [ ] Freeze-adjacent APIs/types in `miroir-core` use `EntityVersion` where they mean snapshots (Phase 1).
- [ ] Dual-write / UUID-reuse is quarantined; freeze must not call it for snapshot minting (Phases 2, 4).
- [ ] UUID-reuse helpers clearly separated from historical minting; freeze tests guard the boundary (Phases 0, 2).
- [ ] Critical tests assert Entity present-model + EntityVersion history concepts (Phase 5).
- [ ] Targeted `testByFile` suites above green; no new present-model coupling to ApplicationVersion Cross mappings.
- [ ] Remaining intentional `EntityDefinition` aliases/shims are greppable under compat / generated deprecated alias only.
- [ ] #216 TDD plan can continue at Phase 2 (freeze plan builder) without another vocabulary cleanup pass.

---

## Suggested commit / PR slicing

| PR | Phases | Notes |
|---|---|---|
| PR1 | 0–1 | Types + characterization; tiny |
| PR2 | 2 | Compat module move |
| PR3 | 3–4 | Entity-only path + dual-write shrink |
| PR4 | 5 | Accessors + test vocabulary; declare #220 reasonable |

Avoid one mega-rename PR (Phase 6).

---

## Out of scope (never in this plan)

- Implementing #216 freeze Action / plan builder / diff / persist (owned by #216 plan Phases 2+).
- Perfect repo-wide purge of the string `EntityDefinition`.
- Rewriting closed GitHub issues or release bundle artifacts.
- Renaming WP1 evolution-trace operationType enums.
