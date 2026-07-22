# Issue #9 — WP1 Analysis

## Topic

Introduce runtime entities to trace model evolution of an application (for any Entity in Miroir model/data sections), and enable display of accrued trace history.

Related issue: https://github.com/miroir-framework/miroir/issues/9

---

## 1. Baseline findings (current state)

### 1.1 Existing version/evolution-related entities

- `ApplicationModelBranch` (`headVersion`):  
  `packages/miroir-test-app_deployment-miroir/assets/miroir_model/.../69bf7c03-a1df-4d1c-88c1-44363feeea87.json`
- `SelfApplicationVersion` (`previousVersion`, `modelStructureMigration`, `modelCUDMigration`):  
  `packages/miroir-test-app_deployment-miroir/assets/miroir_model/.../27046fce-742f-4cc4-bb95-76b271f490a5.json`
- `ApplicationVersionCrossEntityDefinition` (version-to-entityDefinition mapping):  
  `.../assets/miroir_model/.../c0b71083-8cc8-43db-bf52-572f1f03bbb5.json`

### 1.2 Existing commit concept is incomplete in runtime behavior

- `Commit` entity and `CommitList` report exist in deployment assets.
- `Commit` TypeScript type includes `actions[]` and `patches[]`:  
  `packages/miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.ts` (around `Commit` and `zod commit` definitions).
- But `DomainController` `commit` flow currently:
  - builds a new `ApplicationVersion` with placeholders (TODO values),
  - comments out persistence of the new version,
  - replays queued actions immediately to persistence,
  - does not persist a proper commit/migration trace artifact.
  (`packages/miroir-core/src/3_controllers/DomainController.ts`, commit block around ~1411+)

### 1.3 Existing UI exposure is insufficient

- Reports exist for branches/versions/commits, but default menu does not expose branch/version/commit history navigation:
  `.../assets/miroir_data/dde4c883-ae6d-47c3-b6df-26bc6e3c1842/eaac459c-6c2b-475c-8ae4-c6c3032dae00.json`
- No timeline-like report for per-entity accrued evolution.

### 1.4 Runtime activity tracking is ephemeral, not durable domain history

- `MiroirActivityTracker` and `MiroirEventService` capture runtime events in memory, with cleanup/TTL.
- They are useful for diagnostics, but not for persistent model-evolution trace.

---

## 2. Problem specific to WP1

Issue #9 needs migration artifacts and deferred apply. WP1 must first introduce durable trace entities that:

1. represent evolution events for **any** target entity/instance in model or data sections,
2. are queryable and displayable as accrued history,
3. are ordered and linked to version/commit progression,
4. are reusable by later work packages (migration planning/execution).

Current entities are either:
- too coarse (`SelfApplicationVersion` only stores two untyped migration arrays), or
- too narrow (`ApplicationVersionCrossEntityDefinition` only maps version ↔ entityDefinition), or
- not wired in runtime (`Commit` not properly persisted).

---

## 3. WP1 functional requirements

### 3.1 Trace coverage

Must trace evolution events for:
- model section changes (`createEntity`, `renameEntity`, `alterEntityAttribute`, `dropEntity`, etc.),
- data section changes (`createInstance`, `updateInstance`, `deleteInstance`, cascades),
- scoped to a target application.

### 3.2 Identity resolution

Trace entries must identify the target robustly:
- application UUID,
- application section (`model` | `data`),
- target entity UUID,
- target instance primary key (serialized string; compatible with composite PK support),
- target entity definition version UUID (when available; aligns with #15 direction).

### 3.3 Ordering and lineage

Trace entries must be totally ordered within a branch/app context and linked to:
- source/target application version (or equivalent),
- commit/migration envelope identifier,
- predecessor trace event (optional but recommended for fast chronological traversal).

### 3.4 Display support

Trace must be directly consumable by report/query surfaces:
- list of traces,
- timeline/history for one traced target,
- filtering by app, section, entity, operation type, version range.

---

## 4. Recommended entity model for WP1

## 4.1 `ApplicationEvolutionTrace`

Purpose: stable trace root for one tracked subject.

Suggested attributes:
- `uuid`
- `selfApplication` (FK → `SelfApplication`)
- `branch` (FK → `ApplicationModelBranch`, optional for data-only traces if needed)
- `applicationSection` (`model` | `data`)
- `targetEntityUuid` (FK → `Entity`)
- `targetInstancePrimaryKey` (string, optional for entity-level events)
- `targetDefinitionVersionUuid` (optional FK → `EntityDefinition`)
- `traceKey` (derived unique key, e.g. `app|section|entity|pk`)
- `status` (`active` | `archived`, optional)
- `description` (optional)

Rationale:
- keeps history grouping deterministic,
- avoids scanning full event table for every history display.

## 4.2 `ApplicationEvolutionTraceEvent`

Purpose: append-only timeline entries attached to a trace.

Suggested attributes:
- `uuid`
- `traceUuid` (FK → `ApplicationEvolutionTrace`)
- `selfApplication`
- `branch` (optional but recommended)
- `sequenceNumber` (monotonic within `traceUuid`)
- `timestamp`
- `operationType`  
  (`createEntity`, `renameEntity`, `alterEntityAttribute`, `dropEntity`, `createInstance`, `updateInstance`, `deleteInstance`, ...)
- `sourceVersionUuid` (optional FK → `SelfApplicationVersion`)
- `targetVersionUuid` (optional FK → `SelfApplicationVersion`)
- `commitUuid` (optional FK → `Commit`)
- `migrationUuid` (optional FK for WP2 migration entity)
- `payloadBefore` (optional object, bounded)
- `payloadAfter` (optional object, bounded)
- `payloadPatch` (optional patch object/list)
- `actor` / `author` (optional)
- `comment` (optional)

Rationale:
- event-sourcing style timeline,
- directly usable for UI history rendering,
- links naturally to future migration lifecycle.

## 4.3 Keep existing entities; do not overload them

- Keep `SelfApplicationVersion.modelStructureMigration/modelCUDMigration` for compatibility, but do not use them as the only trace store.
- Keep `ApplicationVersionCrossEntityDefinition` for version-to-definition mapping; use it as enrichment metadata in history views, not as history itself.

---

## 5. Why two entities (trace root + events) is preferred

Compared to a single event table:
- better query ergonomics for UI,
- easier incremental materialization (one root, many events),
- cleaner lifecycle management (archive/delete by trace root),
- better future fit for migration batching and replay windows.

---

## 6. Display model (WP1 scope)

Minimum display surfaces to satisfy “accrued history display”:

1. **Trace list report** (`ApplicationEvolutionTraceList`)
   - grouped/filterable by app/section/entity.
2. **Trace history report** (`ApplicationEvolutionTraceHistory`)
   - for one trace UUID, list `ApplicationEvolutionTraceEvent` sorted by `sequenceNumber` (or timestamp fallback).
3. **Menu entries** under Miroir menu for these reports.

Display expectations:
- clear ordering,
- operation badges,
- version/commit links where available,
- expandable payload diff/patch section.

---

## 7. Integration points with current runtime

Primary producers (later WP implementation):
- `DomainController.handleModelAction` commit flow,
- instance/model action handling before/at commit envelope creation,
- migration apply pipeline (future WP).

Current blockers discovered:
- commit currently replays directly to persistence and does not persist trace/commit/version artifacts consistently,
- placeholder UUIDs/TODOs in `newModelVersion` assembly.

WP1 should define entities first; producer wiring is subsequent implementation work.

---

## 8. Constraints and invariants for implementation planning

1. **Append-only events**: no in-place mutation of historical events.
2. **Deterministic ordering**: unique monotonic `sequenceNumber` per trace.
3. **Identity-safe targeting**: use serialized PK + section + entity UUID.
4. **No silent drops**: failed trace writes must surface explicit errors.
5. **Schema-version aware**: include `targetDefinitionVersionUuid` when available.

---

## 9. Open decisions to settle before coding WP1

1. Should model-level changes trace at entity-level only, or also synthesize per-instance impacts?
2. Payload retention policy: full snapshots vs patches vs hybrid (size/perf tradeoff).
3. Whether `branch` is mandatory for all events or optional in data-only contexts.
4. How to backfill existing `Commit`/`SelfApplicationVersion` data (if at all) for initial history display.
5. Exact relation to #15 for resolving definition version on existing instances with missing `parentDefinitionVersionUuid`.

---

## 10. WP1 completion criteria (analysis target)

WP1 analysis is considered complete when implementation can proceed with:
- explicit entity contracts for durable evolution trace,
- explicit UI/report surfaces for accrued history,
- explicit integration anchors in current commit/action runtime,
- explicit unresolved decisions list.

This document provides that baseline.

