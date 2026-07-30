# Issue #9 — WP2 Analysis: Application Version Migrations

## Topic

Make application model evolution **replayable**: persist enough information on `ApplicationEvolutionTraceEvent` (and related versioning entities) so that a deployment at application version *Vn* can be advanced to *Vn+1* (or any later version) by replaying the ordered sequence of model Actions that produced that progression.

Related:
- Issue #9: https://github.com/miroir-framework/miroir/issues/9
- WP1 analysis: `./wp1-analysis-model-evolution-trace.md`
- WP1 TDD plan: `./wp1-tdd-implementation-plan.md` (all phases ✅ DONE)
- **First prerequisite:** Entity becomes the authoritative present model and
  version history becomes optional — https://github.com/miroir-framework/miroir/issues/217 —
  analysis [`../217-/analysis.md`](../217-/analysis.md)
- **Second prerequisite:** Application Versions from frozen model state (and
  optional inter-version history) — https://github.com/miroir-framework/miroir/issues/216 —
  analysis [`../216-FEATURE-application-versions-and-freeze/analysis.md`](../216-FEATURE-application-versions-and-freeze/analysis.md)
  (supersedes the old always-`current` tip design in
  `./wp-intermediate-analysis-current-version-and-freeze.md`)
- Principles diagram: `./issue 9 WP2 principles.jpg`
- Follow-up (out of WP2): paired **data migrations** for model Actions — https://github.com/miroir-framework/miroir/issues/215

---

## 1. WP1 baseline (what already exists)

WP1 delivered durable evolution tracing and display:

| Artefact | Role after WP1 |
|---|---|
| `ApplicationEvolutionTrace` | Trace root per application + branch |
| `ApplicationEvolutionTraceEvent` | Append-only timeline entries (`operationType`, targets, version/commit stamps, definition-version resolution) |
| `evolutionTraceWriter` / policy / compaction / baseline | Produce raw events from Actions; squashed baseline at init; read-side compaction cursor |
| Reports + menu | Trace list and history display |

**Critical WP1 gap for migrations:** trace events record *what kind of operation* happened and *which targets* were affected, but they do **not** store the **resolved Action** (parameters already bound) required to replay the change. Without that payload, events are observational history, not a migration tape.

Current `ApplicationEvolutionTraceEvent` shape (generated type excerpt):

- Identity / ordering: `traceRootUuid`, `sequenceNumber`, `timestamp`
- Classification: `operationType`, `applicationSection`, `compactionLevel`
- Targets: `targetEntityUuid`, `targetInstanceUuid`, `targetDefinitionVersionUuid`, `definitionVersionResolution`
- Version linkage: `commitUuid`, `fromVersionUuid`, `toVersionUuid`
- **Missing for WP2:** replayable Action payload (resolved `ModelActionReplayableAction` / equivalent)

---

## 2. Architectural intent (from principles diagram)

### 2.1 Left — current structural model (still valid, incomplete for migrations)

Current modeling possibilities already express:

```
Application
  └── Application Version (Av1, Av2, … Av_current)
        └── mapping → Entity Definitions (X1…Xn, Y1…Yk)
              └── Entity (X, Y)
```

In the metamodel this is approximated by:

- `SelfApplication` / `SelfApplicationVersion` (`previousVersion`, placeholder `modelStructureMigration` / `modelCUDMigration` arrays)
- `ApplicationVersionCrossEntityDefinition` (version ↔ entity[/definition] mapping)
- `Entity` + multiple `EntityDefinition` instances (definition versions of the same entity)

**Constraints called out in the diagram:**

- **Application Model Branch is ignored for now** (WP2 assumes a single linear history; default branch semantics from WP1 remain, but branch fork/merge is out of scope).

This left-hand model answers: *“What is the squashed model at version V?”*  
It does **not** answer: *“Which Actions take a deployment from V to V+1?”*

### 2.2 Right — target: Application Version Migrations

```
AV1  ──TE1──► TE2 ──► TE3 ──► AV2  ──TE4──► AV3  ──…──► AVn
 │                              │
 │ complete “squashed” model    │ reached by replaying TE1..TE3 on AV1
 │ (deployable)                 │
```

Semantics:

1. **Each Application Version** is associated with:
   - a **squashed model state** (the set of Entity Definitions — and related model instances — that constitute that version), and
   - the **trace events** that lead into / out of that version.
2. **Trace Events between versions** contain the **Actions that were executed**, with **all parameters already resolved**.
3. Replaying that ordered Action sequence on a deployment whose model is at **AV1** yields a deployment whose model is at **AV2** (and likewise AV2→AV3, etc.).
4. The full history enables reconstruction of any intermediate version — a **version-control system for the application model**, with perfect replay of model migrations across the application lifecycle.

### 2.3 Conceptual shift

| Dimension | Current (left / WP1) | Target (right / WP2) |
|---|---|---|
| Version meaning | Pointer / mapping to Entity Definitions | Squashed model snapshot **plus** migration edge from previous version |
| Trace events | Observational (operation type + targets) | **Executable migration steps** (resolved Actions) |
| Moving V→V+1 | Not defined as first-class replay | Deterministic Action replay |
| Compatibility with existing mapping | Keep `ApplicationVersionCrossEntityDefinition` as squashed-state index | Enrich / ensure mapping reflects post-replay squashed definitions |

---

## 3. Problem specific to WP2

**Blocked by #216 (resolved for Option A):** WP2 assumed each application has
reliable frozen Application Version **nodes** (squashed Entity snapshots via Cross)
and some form of **edge** between consecutive versions. [#216](https://github.com/miroir-framework/miroir/issues/216)
now delivers those nodes via user-triggered `freezeApplicationVersion`, plus
**derived** edges in `SelfApplicationVersion.modelCUDMigration` (Option A Entity-set
diff — not a faithful Action tape). See **§5.5 #216 handoff**.

Issue #9 still requires deferred, ordered application of migrations. WP2 must turn
the WP1 timeline (and/or #216 derived edges) into a **replayable migration chain**:

1. Persist on each relevant `ApplicationEvolutionTraceEvent` (or a closely linked artefact) the **resolved Action** that produced the event — *or* consume/refine `modelCUDMigration` candidates from freeze until Option B lands.
2. Define how **Application Versions** bound **segments** of that Action tape (fromVersion → toVersion).
3. Provide an **apply / replay** path: given a deployment at version *Vs* and a target *Vt*, resolve the ordered events between them and execute their Actions against the deployment’s model store.
4. Keep the **squashed model** at each version consistent with what replay would produce (deployable baseline + incremental edges).
5. Remain compatible with WP1 display/compaction and with #15 definition-version anchoring.


Out of WP2 (separate issue): associating a **data migration** with a given model Action (e.g. non-null attribute requires a defaulting script). See §8.

---

## 4. WP2 functional requirements

### 4.1 Replayable Action storage

For every model-affecting trace event that participates in migration (excluding pure observational aggregates if any):

- Store a **resolved Action** payload sufficient for re-execution without re-binding templates or UI context.
- Prefer reusing the existing `ModelActionReplayableAction` union (`createEntity`, `renameEntity`, `alterEntityAttribute`, `dropEntity`) as the canonical serializable form.
- Ensure parameters that were dynamic at authoring time are **already resolved** in the stored payload (UUIDs, attribute names, entity definition bodies, etc.).

Open design choice (see §9): embed Action on the event vs. reference a separate `MigrationStep` / reuse `Commit.actions[]`.

### 4.2 Version-bounded migration segments

- Events (or compaction at `compactionLevel: "version"`) must delimit the Action sequence from `fromVersionUuid` to `toVersionUuid`.
- `SelfApplicationVersion.previousVersion` remains the structural predecessor link.
- Listing “pending migrations from current head to target” must be computable as the ordered concatenation of segments along `previousVersion` (linear history only in WP2).

### 4.3 Squashed model availability

- At least the **initial / baseline** version exposes a complete deployable squashed model (WP1 already creates a `squashedBaseline` event at init).
- Each subsequent Application Version must either:
  - materialize an updated squashed mapping (`ApplicationVersionCrossEntityDefinition` + entity definitions as needed), or
  - be reconstructible solely by replaying Actions from a known squashed ancestor (replay-only intermediate versions).
- WP2 should specify which versions are **materialized** vs **virtual** (replay-derived). Recommended default for WP2: **materialize squashed mapping at every committed Application Version** so deployments can start from any version without replaying from genesis.

### 4.4 Replay / apply API

- Action/API to apply migrations from current deployment model version up to a target Application Version.
- Deterministic order: `sequenceNumber` within trace (and version segment order).
- Failure must be explicit; no silent skip of steps.
- After successful apply: update deployment / branch head version marker (`ApplicationModelBranch.headVersion` or equivalent).

### 4.5 Deferred commit mode (Issue #9 core)

- Commit path must be able to **persist** migration artefacts (version + events with Actions) **without** immediately applying them to a given datastore (deferred apply).
- Immediate-apply mode may remain for local interactive development; both modes share the same artefact format.

### 4.6 Query / report surfaces

- List migration chain / pending steps between two versions.
- Inspect resolved Action for a given trace event (debug / audit).
- Minimal UI beyond WP1 history is enough for WP2; full migration UX can come later.

### 4.7 Explicit non-goals for WP2

- Application Model **Branch** fork/merge semantics (diagram: ignored for now).
- Paired **data migrations** for model Actions (§8 / separate issue).
- Redesigning all version UX.
- Replacing WP1 raw/commit/version compaction model (extend it; do not rip it out).

---

## 5. Recommended design direction

### 5.1 Extend `ApplicationEvolutionTraceEvent` with a resolved Action field

Add something equivalent to:

- `replayableAction` (optional object) — Zod/Jzod-typed as `ModelActionReplayableAction` (and, for Miroir data-section traces that remain in scope, possibly `InstanceCUDAction` where those events are migration-relevant).

Rationale:

- Keeps the WP1 timeline as the single ordered source of truth.
- Avoids inventing a parallel `Migration` entity before Action replay is proven.
- Compaction levels can still summarize; raw events remain the executable tape.

Alternative (if payload size / schema strictness becomes painful):

- Introduce `ApplicationMigrationStep` instances referenced by `migrationStepUuid` on the event, holding the Action body.
- Or revive / properly wire `Commit.actions[]` and treat commits as migration envelopes between versions.

**Recommendation for WP2 analysis target:** start with **inline `replayableAction` on raw events**, keep `commitUuid` / version stamps as envelope metadata, and only extract a separate entity if size or query ergonomics demand it during implementation.

### 5.2 Treat Application Version as a migration node

Each `SelfApplicationVersion` should mean:

1. **Squashed model index** — via `ApplicationVersionCrossEntityDefinition` (and possibly stronger FK to EntityDefinition UUID; today’s field naming/`entity` target should be audited in implementation — see §9).
2. **Incoming migration edge** — the ordered events with `toVersionUuid = this version` (or equivalently `fromVersion = previousVersion`).
3. Optional legacy fields `modelStructureMigration` / `modelCUDMigration` — after #216, **`modelCUDMigration` holds Option A derived freeze-diff candidates** (primary edge artefact for the Option A path). Faithful Action-tape edges (Option B / §5.1) remain the upgrade target; until then treat `modelCUDMigration` as the starting edge, not as guaranteed-faithful replay.

### 5.3 Replay executor

A pure-ish planner + DomainController apply path:

1. Resolve current deployment model version.
2. Walk `previousVersion` chain (or event `fromVersion`/`toVersion`) to collect ordered events with `replayableAction`.
3. For each event, dispatch the Action through the same model-action handlers used for live commits (ideally sharing code with commit replay).
4. Update head version; emit apply status / errors.

Invariant: **replay(AV1, TE1..TEk) ≡ squashed(AV2)** for the model section under test.

### 5.5 #216 handoff (freeze artefacts available now)

[#216](https://github.com/miroir-framework/miroir/issues/216) / TDD plan
[`../216-FEATURE-application-versions-and-freeze/tdd-implementation-plan.md`](../216-FEATURE-application-versions-and-freeze/tdd-implementation-plan.md)
ships the first concrete migration graph under **Option A**:

| Role | Artefact after #216 |
|---|---|
| **Migration node** | Frozen `SelfApplicationVersion` with complete `ApplicationVersionCrossEntityVersion` → historical `EntityVersion` snapshots (new UUIDs; Entities only) |
| **Migration edge (derived)** | `SelfApplicationVersion.modelCUDMigration` — candidate list from Entity-set diff vs previous freeze (`createEntity` / `dropEntity` / `renameEntity` / `alterEntityAttribute`) |
| **Not shipped** | Faithful Action tape / WP1 `replayableAction`; full-model snapshots; auto-freeze on commit |

WP2 should:

1. Treat frozen SAVs as the authoritative **version nodes** for apply/target selection.
2. Treat `modelCUDMigration` as a **starting edge** for human review or planner input — **not** as guaranteed-faithful replay until Option B (or equivalent Action payloads) lands.
3. Keep §5.1–5.3 as the upgrade path when exact Action replay becomes mandatory.

Placeholder fixture SAVs (`"Initial"`, commit `"TODO:…"` labels) are **ignored** for freeze tip resolution; first real freeze is *V1* with empty migration.

### 5.4 Relationship to WP1 compaction

| Level | WP1 meaning | WP2 meaning |
|---|---|---|
| `raw` | One event per Action | Executable step (must carry Action) |
| `commit` | Grouped bird’s-eye | Envelope of raw steps; optional |
| `version` | Version boundary summary | Migration segment AVᵢ → AVᵢ₊₁ |

Compaction remains read-side; **write path always persists raw + Action**.

---

## 6. Integration anchors in current runtime

| Area | Current state | WP2 expectation |
|---|---|---|
| `DomainController` commit | Still oriented toward immediate replay; WP1 writes observational events | Persist version progression + events **with** resolved Actions; support deferred apply |
| `evolutionTraceWriter` | Maps Action → event **without** storing Action | Persist resolved Action on the produced event |
| `SelfApplicationVersion` | `previousVersion` + untyped migration arrays | Version nodes on the migration chain; arrays secondary/compat |
| `ApplicationVersionCrossEntityDefinition` | Squashed mapping (audit schema completeness) | Update mapping when a version is materialized |
| `ApplicationModelBranch.headVersion` | Version pointer | Advanced by apply path |
| Issue #15 | Definition-version resolution on traces | Replay must preserve / set `parentDefinitionVersionUuid` consistently |

---

## 7. Constraints and invariants

1. **Deterministic replay**: same ordered Actions on same starting squashed model → same resulting model.
2. **Resolved params only**: no free variables / template placeholders in stored Actions.
3. **Append-only raw tape**: do not mutate historical events; corrections are new events/versions.
4. **Linear history in WP2**: ignore branch merge; one predecessor per version.
5. **Explicit failure**: apply stops on first error with actionable report; no partial silent success.
6. **Squashed ↔ replay consistency**: materialized version mappings must match replay results (tested).
7. **WP1 non-regression**: existing trace list/history reports keep working; new Action field is additive.

---

## 8. Out of scope — paired data migrations (separate issue)

**Not represented in the Miroir metamodel yet:** associating a **data migration** with a **model Action**, applied in the same evolutionary step.

Example: adding a **non-null** attribute to an Entity is only valid if the user simultaneously provides a data migration that sets a default (or computes a value) for all existing instances of that Entity.

WP2 deliberately treats **model Action replay only**. Data↔model pairing is a follow-up issue so that:

- WP2 can ship a coherent model VCS / replay mechanism,
- schema constraints that require data rewrites can later attach scripts/transformers to the same trace step / Action,
- Issue #9’s “both structure and data migration” acceptance can be completed without blocking model replay design.

See [#215 — Associate data migrations with model Actions (Entity evolution)](https://github.com/miroir-framework/miroir/issues/215).

---

## 9. Open decisions to settle before / during WP2 implementation

1. **Action storage shape**: inline `replayableAction` on `ApplicationEvolutionTraceEvent` vs separate step entity vs `Commit.actions[]` as source of truth.
2. **Which Action types are migration-replayable in WP2?** Strictly `ModelActionReplayableAction`, or also Miroir data-section instance Actions that alter the Miroir “model-as-data”?
3. **Materialization policy**: squash mapping at every Application Version vs only at baselines + replay for intermediates.
4. **`ApplicationVersionCrossEntityDefinition` schema**: confirm whether the mapping stores Entity UUID, EntityDefinition UUID, or both; align schema with the left-hand diagram (version → Entity Definition).
5. **Deferred vs immediate commit**: flag/API shape; default for interactive UI vs server/deploy pipelines.
6. **Idempotency**: re-applying an already-applied segment — reject, no-op, or detect via head version only?
7. **Size / retention**: full EntityDefinition bodies inside `createEntity` Actions can be large; any compression or external blob strategy?
8. **Relation to placeholder `modelStructureMigration` / `modelCUDMigration`**: **#216 populates `modelCUDMigration`** with Option A freeze-diff candidates (`modelStructureMigration` left empty in v1). WP2 may refine, replace with Action-tape edges, or keep both as derived views — do not delete until a cleanup issue decides.


---

## 10. Suggested WP2 work breakdown (high-level)

1. **Contract**: extend EntityDefinition for `ApplicationEvolutionTraceEvent` with resolved Action field; regenerate types.
2. **Writer**: persist Action in `evolutionTraceWriter` / commit producer path.
3. **Version segmenting**: ensure commit creates/links `SelfApplicationVersion` and stamps `fromVersionUuid` / `toVersionUuid` on events.
4. **Squash materialization**: update `ApplicationVersionCrossEntityDefinition` (and definitions) at version boundaries.
5. **Planner**: compute ordered Action list from version A to version B.
6. **Executor**: apply planner output to a deployment; advance head version.
7. **Deferred mode**: commit artefacts without applying to target store.
8. **Tests**: unit (writer/planner) + integration (AV1 + Actions → AV2 model equivalence).
9. **Docs**: replace placeholder `docs/guides/developer/migrations.md` with the real model-replay workflow (data pairing noted as future).

---

## 11. WP2 completion criteria (analysis target)

WP2 analysis is complete when implementation can proceed with:

- [x] Clear contrast between current structural versioning (left) and migration/replay target (right)
- [x] Explicit statement that WP1 events lack replayable Actions and WP2 must add them
- [x] Functional requirements for storage, version segments, squashed model, apply API, deferred commit
- [x] Recommended design direction (inline resolved Action + version nodes + shared executor)
- [x] Explicit out-of-scope for branch merges and paired data migrations
- [x] Open decisions list and high-level work breakdown
- [x] Separate issue created for model-Action–linked data migrations (#215)

This document provides that baseline for a subsequent WP2 TDD implementation plan.
