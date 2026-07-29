# Issue #222 — Analysis: Move EntityVersion from Miroir bootstrapped meta-model to Miroir data

GitHub issue: https://github.com/miroir-framework/miroir/issues/222  
Parent: [#216](https://github.com/miroir-framework/miroir/issues/216) (freeze / Application Versions)

**Document role:** inventory of **problematics** linked to relocating `EntityVersion` out of the Miroir bootstrapped (meta-)model into the Miroir **data** section as an ordinary framework **model concept** (same class as Menu, Report, Transformer, Query).

TDD implementation plan (slices + mandatory full recompile / full nonreg per slice): [`./tdd-implementation-plan.md`](./tdd-implementation-plan.md).

**Objective of the refactor:** non-regression. Present-model authority stays on `Entity` (#217). Freeze (#216) is out of scope except as the consumer this move unblocks.

---

## Status and sequencing

| Step | Issue | Role |
|------|-------|------|
| ✅ | #217 | Entity = authoritative present model; snapshot concept → `EntityVersion` |
| → | #220 / #221 | Vocabulary / view decoupling (parallel; soft coordination) |
| → | **#222 (this)** | EntityVersion leaves MetaModel bootstrap; Miroir instances live in **data** |
| blocked for clean freeze | #216 | Freeze mints historical EntityVersions as ordinary versioning data |

In-code foreshadowing:

```66:70:packages/miroir-core/src/1_core/Model.ts
// TODO: move entityEntityDefinition fo data section of miroir application
export const metaMetaModelEntities: Entity[] = [
  entityEntity as Entity,
  entityEntityDefinition as Entity,
];
```

`getApplicationSection` for Miroir already keys off `metaMetaModelEntityUuids` — today that set is `{Entity, EntityVersion}` ⇒ both resolve to `"model"`.

---

## 1. Current vs target shape

### Today (Miroir)

| Piece | Location / rule |
|-------|-----------------|
| Entity Entity (`16dbfe28…`) | `conceptLevel: MetaModel`; instances in **model** |
| EntityVersion Entity (`54b9c72f…`) | `conceptLevel: MetaModel`; instances in **model** (`miroir_model/54b9c72f…`, ~20 rows) |
| Menu / Report / Query / Transformer / … instances | **data** (`miroir_data/…`) |
| `miroirModelEntities` | `conceptLevel == "MetaModel"` filter → Entity + EntityVersion (+ Commit if present) |
| Non-Miroir apps (Library) | EntityVersion instances still under **model** with other framework model concepts |

### Target (Miroir)

| Piece | Location / rule |
|-------|-----------------|
| Entity Entity | Remains MetaModel bootstrap; instances in **model** |
| EntityVersion Entity | `conceptLevel: Model` (ordinary framework concept) |
| EntityVersion instances (Miroir) | **data** section (`miroir_data/54b9c72f…`) — same placement class as Menu / Report / Query / Transformer **instances** |
| `metaMetaModelEntities` / Miroir model fetch | Entity only (plus any MetaModel peer still justified, e.g. Commit — separate decision) |
| Other applications | EntityVersion usable as a normal **model concept** without MetaModel bootstrap coupling |

Chicken-and-egg that #217 already broke for **live** schema: Entity now carries `mlSchema` / present-model fields. EntityVersion rows are compatibility / history carriers, not required to interpret live Entities — which is why demoting EntityVersion from MetaModel bootstrap is coherent.

---

## 2. Problematics (workstreams for a later TDD plan)

Each problematic is a distinct failure mode or decision surface. A TDD plan should turn these into ordered vertical slices with red tests first.

### P1 — Section classification source of truth

**Problem:** Several independent mechanisms decide whether EntityVersion lives in `"model"` or `"data"` for Miroir. They can disagree after a partial change.

Known mechanisms:

| Mechanism | Today |
|-----------|--------|
| Asset layout | `miroir_model/54b9c72f…` vs `miroir_data/…` |
| `conceptLevel` on EntityVersion Entity | `MetaModel` → included in `miroirModelEntities` |
| `metaMetaModelEntities` hard list | Entity + EntityVersion |
| `getApplicationSection(miroir, entityUuid)` | `metaMetaModelEntityUuids.includes` → `"model"` |
| DomainController load | Miroir uses `miroirModelEntities` for model fetch; everything else as data |
| Bundled parentUuid sets | Docs: Miroir model = Entity + EntityVersion only |
| LocalCache MetaModel assembly | EntityVersion read via `metaModelSection` index |

**Risk:** Move files but leave `getApplicationSection` / fetch lists → empty reads or writes to the wrong store section.  
**Validation hook:** single matrix test — for Miroir, EntityVersion parentUuid resolves `"data"` everywhere; Entity still `"model"`.

### P2 — Bootstrap / startup ordering

**Problem:** `loadConfigurationFromPersistenceStore` loads **model** first (so Entity (+ legacy EntityVersion) policies exist), then **data**. EntityVersion moving to data changes when those instances appear in LocalCache.

Call sites that currently assume EntityVersion instances are available immediately after the model fetch phase (e.g. building `entityDefinitionsByEntityUuid` from `modelInstances` in DomainController) will see an empty collection unless updated to read the data-section fetch (or a dedicated fetch).

**Risk:** Silent empty EntityVersion map → dual-write / report / diagram / freeze scaffolding fails oddly.  
**Validation hook:** after Miroir rollback, LocalCache contains the same EntityVersion UUIDs as before, keyed under the **data** section index.

### P3 — Asymmetry Miroir vs other applications

**Problem:** Miroir is special-cased (`deployment_Miroir` → `miroirModelEntities`; `getApplicationSection` uses `metaMetaModelEntityUuids`). Library / Admin keep EntityVersion in **model** with Report/Menu/etc.

Target wording (“model concept for all other applications, like Menu…”) does **not** mean “EntityVersion instances move to data in Library”. It means EntityVersion is no longer MetaModel-bootstrap-only; for non-Miroir apps it stays with other framework model concepts in **model**.

**Risk:** Over-generalizing the Miroir data move to Library/Admin breaks their model extraction and reports.  
**Decision needed in TDD plan:** keep deployment-specific section rules; only change Miroir’s MetaModel set + Miroir asset section. Document the asymmetry explicitly (already partly in `docs/reference/data-architecture-deployments.md`).

### P4 — Deployment package exports & static imports

**Problem:** `miroir-test-app_deployment-miroir/index.ts` statically imports every EntityVersion JSON from `assets/miroir_model/54b9c72f…` (both `entityVersion*` and deprecated `entityDefinition*` aliases). Moving files requires path updates across:

- deployment package exports
- `defaultMiroirMetaModel` assembly
- any codegen / fundamental-schema inputs that read those paths
- leftover `miroir-core` admin fixture paths under `src/assets/miroirAdmin/model/54b9c72f…` (legacy; may be out of scope but can confuse greps)

**Risk:** Build breaks or stale duplicate copies in model + data.  
**Validation hook:** package build; no remaining imports pointing at `miroir_model/54b9c72f`; single canonical path under `miroir_data/54b9c72f`.

### P5 — Self-describing EntityVersion-of-EntityVersion

**Problem:** Among Miroir EntityVersion instances is the self schema (`bdd7ad43…`, name EntityVersion). After the move it lives in **data**, while the Entity named EntityVersion still lives as an Entity row in **model**.

That is the same pattern as Report: Entity “Report” in model Entities folder; Report instances in data; (today) EntityVersion-of-Report still in model — after this issue, EntityVersion-of-Report also in Miroir data.

**Risk:** Codegen / Jzod bootstrap / “fundamental schema” paths that assume self-EV is a model-section bootstrap artefact.  
**Validation hook:** `devBuild` / type generation still succeeds; runtime still validates EntityVersion instances against the intended schema source (Entity present model for EntityVersion Entity, not a circular dependency on the moved row for live interpretation).

### P6 — LocalCache / selector indexing by section

**Problem:** Redux / Zustand model assemblers hard-code EntityVersion under `metaModelSection`:

```86:88:packages/miroir-localcache-redux/src/4_services/localCache/Model.ts
    const entityDefinitions =
      state.current[
        getReduxDeploymentsStateIndex(deploymentUuid, metaModelSection, entityEntityDefinition.uuid)
      ];
```

Selectors (`DomainStateQuerySelectors`, `ReduxDeploymentsStateQuerySelectors`) similarly pin `entityEntityDefinition.uuid` to a section assumption.

**Risk:** UI / queries look in `"model"` forever → empty EntityVersion collections while data section is populated.  
**Validation hook:** MetaModel assembled from LocalCache includes `entityVersions` after Miroir load; selectors used by reports resolve non-empty where fixtures expect them.

### P7 — Persistence backends & store section maps

**Problem:** Filesystem directories, IndexedDB object stores, Postgres schemas/tables, and bundled static splits all encode model vs data by parentUuid and/or config.

Touched surfaces (non-exhaustive):

- filesystem asset roots (`miroir_model` vs `miroir_data`)
- bundled `MIROIR_MODEL_PARENT_UUIDS` (sandbox / standalone seed)
- `PersistenceStoreController` create/upsert/delete routing by `applicationSection`
- any SQL migration / admin schema assumptions that EntityVersion tables live in the model store unit

**Risk:** Write goes to data, read still from model (or opposite) depending on backend.  
**Validation hook:** same CRUD round-trip on EntityVersion for Miroir on each backend used in CI smoke; section in action payload must be `"data"`.

### P8 — Actions that create / update / delete EntityVersion instances

**Problem:** Model Actions (createEntity dual-write leftovers, alter paths, freeze scaffolding in `applicationVersionFreeze.ts`) may still upsert EntityVersion with `applicationSection: "model"` for Miroir.

Even after #220 progresses toward entity-only live paths, **historical** EntityVersion writes for #216 must target the correct section.

**Risk:** Freeze or residual dual-write writes snapshots into the wrong section; later loads miss them.  
**Validation hook:** any remaining EntityVersion upsert for Miroir asserts section `"data"`; Library still `"model"`.

### P9 — `extractApplicationModel` and MetaModel shape

**Problem:** `extractApplicationModel` always reads EntityVersion from section `"model"`. That remains correct for Library-like apps, **wrong** for Miroir after the move (or needs a deployment-aware section).

MetaModel TypeScript shape still has `entityVersions: EntityVersion[]` — fine — but producers/consumers must not assume section.

**Risk:** Tooling / tests that extract Miroir meta-model omit EntityVersions.  
**Validation hook:** extraction helper takes section from `getApplicationSection` (or equivalent); Miroir and Library extractions models both include EntityVersions.

### P10 — Redundant live EntityVersion rows vs historical-only policy

**Problem:** Miroir still ships ~20 EntityVersion rows that mirror framework Entities (Report, Menu, Query, Entity, EntityVersion, …). Post-#217 these are largely **redundant live copies** for compatibility, not Application Version freeze snapshots.

Moving them to data does not by itself delete redundancy. #216 wants freeze to mint **new** UUIDs for historical snapshots. #220 wants to stop dual-write / UUID-reuse helpers.

**Risk:** Conflating “move section” with “delete redundant live EntityVersions” in one PR → large behavior change beyond non-regression.  
**Decision for TDD plan:** #222 = **relocate + reclassify** only; do not purge redundant rows unless a separate acceptance criterion is added. Document that freeze must not reuse these UUIDs.

### P11 — `ApplicationVersionCrossEntityVersion` and related versioning entities

**Problem:** Cross rows already live in Miroir **data** (`8bec933d…`). SelfApplicationVersion is a Model concept with instances in data for Miroir. EntityVersion joining them must remain queryable across sections.

**Risk:** Queries / joins that assumed EntityVersion + Cross + SAV all in one section.  
**Validation hook:** any existing Cross / SAV tests still pass; document section matrix for the three concepts on Miroir vs Library.

### P12 — Commit and other MetaModel peers

**Problem:** `Commit` is also `conceptLevel: MetaModel` today. Narrowing `metaMetaModelEntities` to Entity-only is the stated direction for EntityVersion, but Commit’s fate is unspecified.

**Risk:** Accidental demotion/promotion of Commit while editing filters.  
**Decision:** leave Commit untouched in #222 unless it blocks EntityVersion relocation; call out in plan as non-goal.

### P13 — Documentation & mental model drift

**Problem:** `docs/reference/data-architecture-deployments.md`, AGENTS.md, feature analyses (#216/#217/#220/#221) still say Miroir model = Entity + EntityVersion.

**Risk:** Future agents reintroduce EntityVersion into model bootstrap “because the docs say so”.  
**Validation hook:** update the deployment reference (and issue #222 / #216 cross-links) in the same change set as the code move.

### P14 — Test & fixture surface area

**Problem:** Large test surface hard-codes:

- path `miroir_model/54b9c72f…`
- section `"model"` + `entityEntityDefinition.uuid`
- `metaMetaModelEntities` length / membership
- expectations that Miroir model fetch returns EntityVersion collections

**Risk:** Green unit tests with red integ (or the reverse) if only one layer is updated.  
**Validation hook:** issue acceptance criteria §D — typecheck + targeted DomainController / testMiroir smoke + at least one assertion that Miroir EntityVersion is read from **data**.

### P15 — Interaction with #220 / #221 (soft dependencies)

**Problem:** Parallel refactors touch the same symbols (`entityEntityDefinition`, `entityVersions`, prop names). #222 changes **where** instances live; #220/#221 change **whether** live paths should touch them at all.

**Risk:** Merge conflicts; temporary dual-read that looks up the wrong section.  
**Coordination rule:** #222 must not reintroduce EntityVersion as present-model authority. Prefer finishing or isolating live Entity-only slices (#220/#221) so section bugs are not masked by dual-read fallbacks.

### P16 — Non-regression definition (product)

**Problem:** “Non-regression” must be falsifiable. Candidate invariants:

1. Same Entity UUIDs and present-model fields after load.
2. Same EntityVersion instance UUIDs and payloads after load (new section only).
3. Miroir / Library / Admin startup + rollback succeed.
4. Existing Report / Menu / Query / Transformer / Endpoint smoke paths still work.
5. createEntity / rename / alter / drop paths used in CI still work without Miroir model-section EntityVersion.
6. No new dependency of live schema resolution on EntityVersion.

**Risk:** Passing a narrow unit test while breaking sandbox bundled seed.  
**Validation hook:** checklist in issue #222 acceptance criteria A–D; PR must name the exact command set run.

---

## 3. Suggested grouping for a future TDD plan (not ordered commits yet)

These groups are **problematics clusters**, not an approved slice list:

| Group | Problematics | Likely first red test |
|-------|--------------|------------------------|
| G1 Classification & section API | P1, P3, P12 | `getApplicationSection(miroir, entityVersionUuid) === "data"`; Entity still `"model"`; Library EntityVersion still `"model"` |
| G2 Assets & package exports | P4, P5, P13 | Files exist under `miroir_data/54b9c72f`; imports resolve; docs sentence updated |
| G3 Load / LocalCache / selectors | P2, P6, P9 | After Miroir rollback, EntityVersion instances present under data index; MetaModel.entityVersions non-empty |
| G4 Persist / backends / Actions | P7, P8, P11 | Upsert EntityVersion on Miroir uses section data; round-trip on filesystem (± other backends in CI) |
| G5 Non-regression suite | P10, P14, P15, P16 | Existing smoke / DomainController / testMiroir subset green; no live schema via EntityVersion |

---

## 4. Open questions — locked in TDD plan

See [`./tdd-implementation-plan.md`](./tdd-implementation-plan.md) §Locked implementation defaults:

1. `metaMetaModelEntities` → **Entity-only**; Commit untouched.
2. Redundant live EntityVersion rows → **relocate only** (no purge in #222).
3. Admin bundled EntityVersion stays in Admin **model** parent set; only Miroir `MIROIR_MODEL_PARENT_UUIDS` drops EntityVersion.
4. `extractApplicationModel` uses `getApplicationSection` (Slice 2).
5. Every slice ends with **full recompile** (`./build-all.sh full` / `full devBuild`) **and** **full nonreg** (`npm run nonreg`).

---

## 5. References

- Issue: https://github.com/miroir-framework/miroir/issues/222
- Parent #216: `code-helpers/features/216-FEATURE-application-versions-and-freeze/analysis.md`
- #217 analysis: `code-helpers/features/217-/analysis.md`
- #220 analysis: `code-helpers/features/220-REFACTOR-entitydefinition-tech-debt/analysis.md`
- #221 analysis: `code-helpers/features/221-REFACTOR-view-decouple-entityversion-present-model/analysis.md`
- Deployment rules: `docs/reference/data-architecture-deployments.md`
- Section helpers: `packages/miroir-core/src/1_core/Model.ts` (`metaMetaModelEntities`, `getApplicationSection`, `miroirModelEntities`)
- Load path: `packages/miroir-core/src/3_controllers/DomainController.ts` (`loadConfigurationFromPersistenceStore`)
