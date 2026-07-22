# Issue #9 — WP1 TDD Implementation Plan

## Scope

WP1 introduces durable runtime entities to trace model evolution and to display accrued history.

This plan applies your decisions and converts them into vertical red→green implementation slices.

Related:
- Issue #9: https://github.com/miroir-framework/miroir/issues/9
- WP1 analysis: `./wp1-analysis-model-evolution-trace.md`
- Issue #15 (definition-version anchoring): https://github.com/miroir-framework/miroir/issues/15

---

## Settled decisions (from your inputs)

| Decision | Choice |
|---|---|
| Tracking scope | For non-Miroir apps: track **model section** updates only. For Miroir app: track both **model** (meta-model) and **data** (model) updates. |
| History payload policy | **Hybrid**: write low-level trace first, then support compaction levels for bird’s-eye views. |
| Branch policy | Mirror git semantics; default branch for #9 is `master`. |
| Initial history bootstrap | Create an initial **squashed baseline** event/block (no historical replay available). |
| Relation to #15 | Trace model is definition-version aware now, with compatibility fallback; formal migration to strict `parentDefinitionVersionUuid` later. |

---

## Target public interfaces (WP1)

1. New trace entities (Miroir model/data assets + generated TS types):
   - `ApplicationEvolutionTrace`
   - `ApplicationEvolutionTraceEvent`
2. Trace read/query contract supports compaction cursor:
   - `compactionLevel: "raw" | "commit" | "version"`
3. Trace write policy contract (pure function):
   - decides whether an action is traceable based on `{selfApplication, applicationSection, actionType}`.
4. Display surfaces:
   - `ApplicationEvolutionTraceList`
   - `ApplicationEvolutionTraceHistory`

---

## #15 relation and reasonable WP1 solution

WP1 will store both target identity and definition-version identity, with explicit resolution method:

- `targetEntityUuid` (always)
- `targetDefinitionVersionUuid` (best effort, required when resolvable)
- `definitionVersionResolution`: `"instanceParentDefinitionVersion" | "actionPayload" | "applicationVersionCrossEntityDefinition" | "unresolved"`

Resolution order in WP1:
1. Use `instance.parentDefinitionVersionUuid` when present.
2. Else use explicit definition UUID/version carried by action payload (`entityDefinitionUuid` etc.).
3. Else resolve through `ApplicationVersionCrossEntityDefinition` from current app version context.
4. If unresolved, write trace event with `definitionVersionResolution = "unresolved"` and raise explicit warning/error per existing error-handling conventions (no silent drop).

This keeps WP1 compatible with current state and prepares strict behavior for #15.

---

## Test execution conventions

Use existing repo commands only.

| Purpose | Command |
|---|---|
| Core targeted tests | `npm run testByFile -w miroir-core -- <pattern>` |
| Core suite selection | `npm run testMiroir -w miroir-core -- --suites <suite> --mode unit` |
| Standalone integration | `npm run testMiroir -w miroir-standalone-app -- --suites <suite> --mode integration` |
| Type-check baseline | `npx tsc --noEmit --skipLibCheck` |

Legend:
- **RED**: new behavior test fails first
- **GREEN**: minimal implementation makes it pass
- **NON-REGRESSION**: related existing suites stay green

---

## Phase 0 — Lock contracts and fixtures

### 0.1 RED
Add a focused failing test/spec file (core) asserting expected trace policy matrix:
- non-Miroir + model section -> trace
- non-Miroir + data section -> no trace
- Miroir + model section -> trace
- Miroir + data section -> trace

### 0.1 GREEN
Add pure helper (e.g. `shouldTraceEvolutionEvent(...)`) and unit tests.

### NON-REGRESSION
- Existing model/data CRUD suites still pass.

---

## Phase 1 — Introduce WP1 entities and generated types

### 1.1 RED
Failing tests validate schema presence and runtime validation for:
- `ApplicationEvolutionTrace`
- `ApplicationEvolutionTraceEvent`

### 1.1 GREEN
Add entity + entityDefinition assets in `miroir-test-app_deployment-miroir`, regenerate core types (`devBuild` path as needed), export through model/bootstrap surfaces.

### NON-REGRESSION
- `npm run devBuild -w miroir-core`
- Existing schema/type tests remain green.

---

## Phase 2 — Persist raw trace events from action flow

### 2.1 RED
Integration test (DomainController flow):
- model action commit creates at least one `ApplicationEvolutionTraceEvent` for target entity/instance.

### 2.1 GREEN
Wire trace-event creation into commit/action handling path with append-only semantics and monotonic sequence per trace root.

### NON-REGRESSION
- existing model-action integration tests (`createEntity`, `renameEntity`, `alterEntityAttribute`, `dropEntity`) remain green.

---

## Phase 3 — Enforce section/app tracking policy

### 3.1 RED
Integration tests:
1. Non-Miroir app, data-section instance update -> **no** trace event.
2. Non-Miroir app, model-section update -> trace event created.
3. Miroir app, data-section update -> trace event created.

### 3.1 GREEN
Apply policy helper in producer path; ensure no silent behavior drift.

### NON-REGRESSION
- Data CRUD tests for Library/Admin still pass.

---

## Phase 4 — Add hybrid compaction model (read-side cursor)

### 4.1 RED
Tests for history retrieval API/query:
- `compactionLevel="raw"` returns low-level events
- `compactionLevel="commit"` returns squashed commit blocks
- `compactionLevel="version"` returns bird’s-eye blocks from version A to B

### 4.1 GREEN
Implement read-model compaction transformer/query layer; keep raw storage unchanged.

### NON-REGRESSION
- raw-history tests still pass unchanged.

---

## Phase 5 — Initial squashed baseline generation

### 5.1 RED
Bootstrap test for an app with no prior trace history:
- exactly one baseline squashed block is created
- block is marked as initial baseline and linked to current version/head.

### 5.1 GREEN
Implement one-time baseline initializer for Miroir, Library, Admin, Postgres deployments.

### NON-REGRESSION
- repeated initialization is idempotent (no duplicate baseline block).

---

## Phase 6 — #15-compatible definition-version resolution

### 6.1 RED
Tests for resolution precedence:
1. event carries `parentDefinitionVersionUuid` -> used
2. missing on instance but present in action payload -> used
3. missing both -> fallback via `ApplicationVersionCrossEntityDefinition`
4. unresolved fallback path -> explicit unresolved marker + surfaced warning/error

### 6.1 GREEN
Implement resolver module and use in trace-event writer.

### NON-REGRESSION
- Existing flows without `parentDefinitionVersionUuid` do not crash and remain explicit.

---

## Phase 7 — Display surfaces (reports + menu wiring)

### 7.1 RED
UI/integration tests verify:
- `ApplicationEvolutionTraceList` report returns trace roots
- `ApplicationEvolutionTraceHistory` report returns ordered events
- menu links expose both reports

### 7.1 GREEN
Add report assets and menu items in Miroir deployment.

### NON-REGRESSION
- Existing reports/menu entries still resolve.

---

## Phase 8 — End-to-end WP1 tracer bullet

### 8.1 RED
Single vertical scenario:
1. start from app baseline
2. execute representative model evolution actions
3. commit
4. fetch history with `raw`, `commit`, and `version` cursors
5. verify ordering, compaction, and definition-version metadata.

### 8.1 GREEN
Fix remaining integration gaps only.

### NON-REGRESSION
- `npm run testMiroir -w miroir-core -- --suites <new-wp1-suite> --mode unit`
- `npm run testMiroir -w miroir-standalone-app -- --suites <new-wp1-suite> --mode integration`

---

## Implementation checklist (phase-by-phase work items)

### Phase 0 — Contracts & fixtures
- Add `shouldTraceEvolutionEvent(...)` policy helper tests (**RED** first).
- Implement the helper (**GREEN**) with the settled matrix:
  - non-Miroir + model => trace
  - non-Miroir + data => no trace
  - Miroir + model => trace
  - Miroir + data => trace
- Add reusable fixtures for traceable and non-traceable actions.

Target files:
- `packages/miroir-core/src/2_domain/evolutionTracePolicy.ts` (new)
- `packages/miroir-core/tests/` (new unit test file)

### Phase 1 — Add WP1 entities (model + types)
- Create Entity JSON assets for `ApplicationEvolutionTrace` and `ApplicationEvolutionTraceEvent`.
- Create matching EntityDefinition JSON assets.
- Export new assets from the deployment package index.
- Add both entities to the default Miroir meta-model assembly.
- Regenerate core types via `devBuild` and verify new types exist.
- Add schema validation tests for both entities.

Target files:
- `packages/miroir-test-app_deployment-miroir/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/*.json`
- `packages/miroir-test-app_deployment-miroir/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/*.json`
- `packages/miroir-test-app_deployment-miroir/index.ts`
- `packages/miroir-test-app_deployment-miroir/src/Model.ts`
- `packages/miroir-core/src/0_interfaces/1_core/preprocessor-generated/*` (generated)

### Phase 2 — Persist raw trace events in runtime flow
- Add a failing integration test for a model-evolution commit creating trace event(s).
- Add trace root creation/lookup logic.
- Add append-only trace event writes with monotonic sequence numbers.
- Store operation metadata (`operationType`, timestamp, actor/author if available).

Target files:
- `packages/miroir-core/src/3_controllers/DomainController.ts`
- `packages/miroir-core/src/2_domain/` (new writer helpers)
- `packages/miroir-core/tests/` (DomainController integration tests)

### Phase 3 — Enforce application/section policy
- Add failing integration tests for the section policy (Miroir vs non-Miroir).
- Apply the policy helper in the producer path.
- Ensure excluded cases do not silently write history.

Target files:
- `packages/miroir-core/src/3_controllers/DomainController.ts`
- `packages/miroir-core/src/2_domain/evolutionTracePolicy.ts`
- `packages/miroir-core/tests/`

### Phase 4 — Read-side compaction cursor
- Add failing tests for `compactionLevel="raw" | "commit" | "version"`.
- Implement raw event retrieval.
- Implement commit-level squashing.
- Implement version A→B bird’s-eye view.
- Add the compaction cursor to the read/query path.

Target files:
- `packages/miroir-core/src/2_domain/QuerySelectors.ts` or equivalent query helper layer
- `packages/miroir-core/src/2_domain/TransformersForRuntime.ts` (if used)
- `packages/miroir-core/tests/`

### Phase 5 — Initial squashed baseline
- Add a failing bootstrap test for one initial baseline block when no history exists.
- Implement the baseline generator for Miroir, Library, Admin, and Postgres deployments.
- Ensure idempotence (running twice does not duplicate the baseline).

Target files:
- `packages/miroir-core/src/1_core/Deployment.ts` and/or initializer flows
- `packages/miroir-core/src/3_controllers/` (initializer/controller wiring)
- `packages/miroir-core/tests/` and `packages/miroir-standalone-app/tests/`

### Phase 6 — #15-compatible definition-version resolution
- Add failing tests for resolution precedence:
  1. instance `parentDefinitionVersionUuid`
  2. action payload definition UUID
  3. `ApplicationVersionCrossEntityDefinition` fallback
  4. unresolved marker path
- Implement `resolveDefinitionVersionForTraceEvent(...)`.
- Persist the `definitionVersionResolution` discriminator.

Target files:
- `packages/miroir-core/src/2_domain/` (new resolver module)
- `packages/miroir-core/src/3_controllers/DomainController.ts`
- `packages/miroir-core/tests/`

### Phase 7 — Reports + menu wiring
- Add a report asset for `ApplicationEvolutionTraceList`.
- Add a report asset for `ApplicationEvolutionTraceHistory`.
- Add menu entries to expose both reports in the Miroir menu.
- Add report/UI tests and make them green.

Target files:
- `packages/miroir-test-app_deployment-miroir/assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/*.json` (report assets)
- `packages/miroir-test-app_deployment-miroir/assets/miroir_data/dde4c883-ae6d-47c3-b6df-26bc6e3c1842/eaac459c-6c2b-475c-8ae4-c6c3032dae00.json` (menu)
- `packages/miroir-test-app_deployment-miroir/index.ts`
- `packages/miroir-standalone-app/tests/`

### Phase 8 — End-to-end tracer bullet
- Add one vertical scenario test covering baseline, model evolution, commit, and history retrieval with `raw`, `commit`, and `version` views.
- Fix only the gaps required by the scenario.
- Lock the regression suite.

Target files:
- `packages/miroir-core/tests/`
- `packages/miroir-standalone-app/tests/`

### Command checklist (per milestone)
- `npx tsc --noEmit --skipLibCheck`
- `npm run testByFile -w miroir-core -- <pattern>`
- `npm run testMiroir -w miroir-core -- --suites <suite> --mode unit`
- `npm run testMiroir -w miroir-standalone-app -- --suites <suite> --mode integration`
- `npm run devBuild -w miroir-core`

---

## Suggested commit slices

1. `feat(trace-wp1): add trace policy helper + tests`
2. `feat(trace-wp1): add evolution trace entities and generated types`
3. `feat(trace-wp1): persist raw trace events on model evolution commit`
4. `feat(trace-wp1): enforce app/section tracking scope policy`
5. `feat(trace-wp1): add compaction cursor (raw/commit/version)`
6. `feat(trace-wp1): add initial squashed baseline generator`
7. `feat(trace-wp1): add #15-compatible definition-version resolver`
8. `feat(trace-wp1): add trace reports and menu wiring`
9. `test(trace-wp1): add end-to-end scenario suite`

---

## Out of scope for WP1

- Full branch-management semantics beyond assumed `master` default.
- Migration execution/apply engine details (WP2+).
- Aggressive storage optimization of historical payloads beyond defined compaction views.

