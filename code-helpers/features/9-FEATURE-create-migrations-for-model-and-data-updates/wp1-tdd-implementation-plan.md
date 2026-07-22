# Issue #9 — WP1 TDD Implementation Plan

## Scope

WP1 introduces durable runtime entities to trace model evolution and to display accrued history.

This plan applies your decisions and converts them into vertical red→green implementation slices.

Related:
- Issue #9: https://github.com/miroir-framework/miroir/issues/9
- WP1 analysis: `./wp1-analysis-model-evolution-trace.md`
- Issue #15 (definition-version anchoring): https://github.com/miroir-framework/miroir/issues/15

---

## Progress summary

| Phase | Title | Status | Tests |
|---|---|---|---|
| 0 | Lock contracts and fixtures | ✅ DONE | 6/6 |
| 1 | Introduce WP1 entities and generated types | ✅ DONE | 16/16 |
| 2 | Persist raw trace events from action flow | ✅ DONE | 14/14 |
| 3 | Enforce section/app tracking policy | 🔲 TODO | — |
| 4 | Hybrid compaction model (read-side cursor) | 🔲 TODO | — |
| 5 | Initial squashed baseline generation | 🔲 TODO | — |
| 6 | #15-compatible definition-version resolution | 🔲 TODO | — |
| 7 | Display surfaces (reports + menu wiring) | 🔲 TODO | — |
| 8 | End-to-end WP1 tracer bullet | 🔲 TODO | — |

---



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

## Phase 0 — Lock contracts and fixtures  ✅ DONE

### 0.1 RED
Add a focused failing test/spec file (core) asserting expected trace policy matrix:
- non-Miroir + model section -> trace
- non-Miroir + data section -> no trace
- Miroir + model section -> trace
- Miroir + data section -> trace

Test file: `packages/miroir-core/tests/2_domain/evolutionTracePolicy.unit.test.ts`

#### Validation (RED)
```
npm run testByFile -w miroir-core -- evolutionTracePolicy
```
Expected: `1 failed` (module not found — `src/2_domain/evolutionTracePolicy.ts` absent).

### 0.1 GREEN
Add pure helper (`shouldTraceEvolutionEvent(...)`) in `src/2_domain/evolutionTracePolicy.ts`.

#### Validation (GREEN)
```
npm run testByFile -w miroir-core -- evolutionTracePolicy
```
Expected: `1 passed` — **6/6 tests pass**.

Assertions covered:
| Input | Expected return |
|---|---|
| `(LIBRARY_UUID, "model")` | `true` |
| `(LIBRARY_UUID, "data")` | `false` |
| `(MIROIR_UUID, "model")` | `true` |
| `(MIROIR_UUID, "data")` | `true` |
| `(LIBRARY_UUID, "metaModel")` | `false` |
| `(MIROIR_UUID, "metaModel")` | `false` |

### NON-REGRESSION
```
npm run testByFile -w miroir-core
```
Expected: pre-existing pass/fail counts unchanged (`5 failed | 74 passed` baseline).

---

## Phase 1 — Introduce WP1 entities and generated types  ✅ DONE

### 1.1 RED
Add test file: `packages/miroir-core/tests/2_domain/evolutionTrace.schema.unit.test.ts`

Tests validate:
- Importing `ApplicationEvolutionTrace` and `ApplicationEvolutionTraceEvent` from the deployment package throws "not found" or the exports do not exist yet.
- Zod parse of a minimal valid `ApplicationEvolutionTrace` instance fails (schema absent).
- Zod parse of a minimal valid `ApplicationEvolutionTraceEvent` instance fails (schema absent).

#### Validation (RED)
```
npm run testByFile -w miroir-core -- evolutionTrace.schema
```
Expected: `1 failed` (module or symbol absent).

### 1.1 GREEN
- Add Entity JSON at `miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/<new-entity-uuid>.json` for both entities.
- Add EntityDefinition JSON at `miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/<new-entitydef-uuid>.json` for both.
- Export from `packages/miroir-test-app_deployment-miroir/index.ts`.
- Add to meta-model assembly in `packages/miroir-test-app_deployment-miroir/src/Model.ts`.
- Run `npm run devBuild -w miroir-core` to regenerate `miroirFundamentalType.ts`.

#### Validation (GREEN)
```bash
# 1. Build succeeds
npm run devBuild -w miroir-core

# 2. Type check clean
npx tsc --noEmit --skipLibCheck

# 3. New tests pass
npm run testByFile -w miroir-core -- evolutionTrace.schema
```

Expected per check:
| Check | Expected |
|---|---|
| `devBuild` | exits 0, no errors |
| `tsc --noEmit` | 0 type errors |
| `evolutionTrace.schema` tests | `1 passed` — ≥ 4 tests pass |
| `ApplicationEvolutionTrace` exported from deployment package | importable in test |
| `ApplicationEvolutionTraceEvent` exported from deployment package | importable in test |
| Zod parse of minimal valid `ApplicationEvolutionTrace` | `success: true` |
| Zod parse of minimal valid `ApplicationEvolutionTraceEvent` | `success: true` |
| Zod parse of instance missing required field `uuid` | `success: false` |

### NON-REGRESSION
```
npm run testByFile -w miroir-core -- zodParseCheckMiroirTransformerDefinitions
npm run testByFile -w miroir-core -- schemaForDeployment
npm run testByFile -w miroir-core -- zodParseActions
```
Expected: all pass unchanged.

---

## Phase 2 — Persist raw trace events from action flow  ✅ DONE

### 2.1 RED
Add test file: `packages/miroir-core/tests/2_domain/evolutionTrace.persist.unit.test.ts`

Test: execute a representative model-evolution action (e.g. `createEntity`) in a unit-test DomainController harness; after the action, query `ApplicationEvolutionTraceEvent` instances — expect at least one event with:
- `operationType` matching the action type
- `targetEntityUuid` matching the acted-upon entity
- `sequenceNumber >= 1`
- `traceRootUuid` pointing to a valid `ApplicationEvolutionTrace`

#### Validation (RED)
```
npm run testByFile -w miroir-core -- evolutionTrace.persist
```
Expected: `1 failed` (no trace event written yet).

### 2.1 GREEN
Wire trace-event creation into commit/action handling path.

#### Validation (GREEN)
```bash
# Unit tests pass
npm run testByFile -w miroir-core -- evolutionTrace.persist

# Type-check clean
npx tsc --noEmit --skipLibCheck
```

Expected per check:
| Check | Expected |
|---|---|
| `evolutionTrace.persist` tests | `1 passed` — ≥ 3 tests pass |
| After `createEntity` action | exactly 1 `ApplicationEvolutionTraceEvent` in store |
| After `renameEntity` action | 1 new event with correct `operationType` |
| After `dropEntity` action | 1 new event with correct `operationType` |
| Sequence numbers | monotonically increasing within same trace root |
| `traceRootUuid` | non-null, points to existing `ApplicationEvolutionTrace` |
| `tsc --noEmit` | 0 type errors |

### NON-REGRESSION
```
npm run testByFile -w miroir-core -- modelUpdates
```
Expected: existing model-action tests unchanged.

---

## Phase 3 — Enforce section/app tracking policy

### 3.1 RED
Add test file: `packages/miroir-core/tests/2_domain/evolutionTrace.policy.unit.test.ts`

Three parameterised scenarios (each independently verifiable):
1. Non-Miroir app (Library), data-section update → **zero** `ApplicationEvolutionTraceEvent` written.
2. Non-Miroir app (Library), model-section update → **one** `ApplicationEvolutionTraceEvent` written.
3. Miroir app, data-section update → **one** `ApplicationEvolutionTraceEvent` written.

#### Validation (RED)
```
npm run testByFile -w miroir-core -- evolutionTrace.policy
```
Expected: `1 failed` (policy not yet applied in producer path).

### 3.1 GREEN
Apply `shouldTraceEvolutionEvent(...)` in the producer path; remove any unconditional writes.

#### Validation (GREEN)
```bash
npm run testByFile -w miroir-core -- evolutionTrace.policy
npm run testByFile -w miroir-core -- evolutionTrace.persist
npx tsc --noEmit --skipLibCheck
```

Expected per check:
| Check | Expected |
|---|---|
| `evolutionTrace.policy` tests | `1 passed` — 3/3 tests pass |
| Scenario 1: Library + data update | 0 events in store |
| Scenario 2: Library + model update | 1 event, `applicationSection = "model"` |
| Scenario 3: Miroir + data update | 1 event, `applicationSection = "data"` |
| `evolutionTrace.persist` tests | still pass (no regression from policy gate) |
| `tsc --noEmit` | 0 type errors |

### NON-REGRESSION
```
npm run testByFile -w miroir-core -- cacheRefreshPolicy
npm run testByFile -w miroir-core -- modelUpdates
```
Expected: all pass unchanged.

---

## Phase 4 — Add hybrid compaction model (read-side cursor)

### 4.1 RED
Add test file: `packages/miroir-core/tests/2_domain/evolutionTrace.compaction.unit.test.ts`

Setup: create 3+ raw events on the same trace root across 2 commits.

Three assertions:
1. `fetchEvolutionHistory({ compactionLevel: "raw" })` returns the individual events in order.
2. `fetchEvolutionHistory({ compactionLevel: "commit" })` returns one block per commit (3 events → 2 blocks).
3. `fetchEvolutionHistory({ compactionLevel: "version", fromVersion: "A", toVersion: "B" })` returns one summary block spanning the version range.

#### Validation (RED)
```
npm run testByFile -w miroir-core -- evolutionTrace.compaction
```
Expected: `1 failed` (query/compaction API not yet implemented).

### 4.1 GREEN
Implement read-model compaction in query/transformer layer; raw storage unchanged.

#### Validation (GREEN)
```bash
npm run testByFile -w miroir-core -- evolutionTrace.compaction
npm run testByFile -w miroir-core -- evolutionTrace.persist
npx tsc --noEmit --skipLibCheck
```

Expected per check:
| Check | Expected |
|---|---|
| `evolutionTrace.compaction` tests | `1 passed` — 3/3 tests pass |
| `raw` cursor: 3 events in store | returns 3 items, each with `sequenceNumber`, `timestamp`, `operationType` |
| `commit` cursor: events across 2 commits | returns 2 blocks, each with `commitId`, `eventCount` |
| `version` cursor A→B | returns 1 summary block with `fromVersion`, `toVersion`, `totalEvents` |
| Result ordering (all levels) | ascending by `sequenceNumber` / `timestamp` |
| `evolutionTrace.persist` tests | still pass |
| `tsc --noEmit` | 0 type errors |

### NON-REGRESSION
```
npm run testByFile -w miroir-core -- queries
npm run testByFile -w miroir-core -- resolveQueryTemplates
```
Expected: all pass unchanged.

---

## Phase 5 — Initial squashed baseline generation

### 5.1 RED
Add test file: `packages/miroir-core/tests/2_domain/evolutionTrace.baseline.unit.test.ts`

Test A — empty history:
- call `generateEvolutionBaseline(deployment)` when no trace history exists
- expect exactly 1 `ApplicationEvolutionTrace` root
- expect exactly 1 `ApplicationEvolutionTraceEvent` with `operationType = "squashedBaseline"` and `compactionLevel = "version"`

Test B — idempotence:
- call `generateEvolutionBaseline(deployment)` twice
- expect still exactly 1 baseline event (no duplicates)

#### Validation (RED)
```
npm run testByFile -w miroir-core -- evolutionTrace.baseline
```
Expected: `1 failed` (generator not yet implemented).

### 5.1 GREEN
Implement `generateEvolutionBaseline(...)` and call it during deployment initialisation for all four known deployments (miroir, library, admin, postgres).

#### Validation (GREEN)
```bash
# Unit tests
npm run testByFile -w miroir-core -- evolutionTrace.baseline

# Type check
npx tsc --noEmit --skipLibCheck

# Integration: baseline present after deployment initialisation
npm run testMiroir -w miroir-standalone-app -- --suites evolutionTraceWP1 --mode integration
```

Expected per check:
| Check | Expected |
|---|---|
| `evolutionTrace.baseline` tests | `1 passed` — 2/2 tests pass |
| Test A: baseline event count | exactly 1 event, `operationType = "squashedBaseline"` |
| Test B: idempotence | calling twice → still 1 event |
| Baseline `compactionLevel` | `"version"` |
| Baseline `branchName` | `"master"` |
| Integration: miroir deployment | 1 baseline `ApplicationEvolutionTrace` root in store |
| Integration: library deployment | 1 baseline root in store |
| `tsc --noEmit` | 0 type errors |

### NON-REGRESSION
```
npm run testByFile -w miroir-core -- createDeploymentCompositeAction
npm run testByFile -w miroir-core -- modelEnvironment
```
Expected: all pass unchanged.

---

## Phase 6 — #15-compatible definition-version resolution

### 6.1 RED
Add test file: `packages/miroir-core/tests/2_domain/evolutionTrace.defversion.unit.test.ts`

Four focused unit tests for `resolveDefinitionVersionForTraceEvent(...)`:

1. Instance carries `parentDefinitionVersionUuid` → returns `{ definitionVersionUuid: <that value>, resolution: "instanceParentDefinitionVersion" }`.
2. Instance lacks it; action payload has `entityDefinitionUuid` → returns `{ definitionVersionUuid: <payload value>, resolution: "actionPayload" }`.
3. Both absent; `ApplicationVersionCrossEntityDefinition` lookup returns a match → returns `{ definitionVersionUuid: <lookup value>, resolution: "applicationVersionCrossEntityDefinition" }`.
4. All absent/lookup returns nothing → returns `{ definitionVersionUuid: undefined, resolution: "unresolved" }` and emits a warning (captured in test).

#### Validation (RED)
```
npm run testByFile -w miroir-core -- evolutionTrace.defversion
```
Expected: `1 failed` (resolver not yet implemented).

### 6.1 GREEN
Implement `resolveDefinitionVersionForTraceEvent(...)` and use it in the trace-event writer.

#### Validation (GREEN)
```bash
npm run testByFile -w miroir-core -- evolutionTrace.defversion
npm run testByFile -w miroir-core -- evolutionTrace.persist
npx tsc --noEmit --skipLibCheck
```

Expected per check:
| Check | Expected |
|---|---|
| `evolutionTrace.defversion` tests | `1 passed` — 4/4 tests pass |
| Path 1 (instanceParent) | `resolution = "instanceParentDefinitionVersion"` |
| Path 2 (actionPayload) | `resolution = "actionPayload"` |
| Path 3 (crossEntity lookup) | `resolution = "applicationVersionCrossEntityDefinition"` |
| Path 4 (unresolved) | `resolution = "unresolved"`, `definitionVersionUuid = undefined` |
| Path 4 warning | at least one `log.warn` / error entry captured, no silent drop |
| Existing flows without `parentDefinitionVersionUuid` | resolve to path 2 or 3 (never crash) |
| `evolutionTrace.persist` tests | still pass |
| `tsc --noEmit` | 0 type errors |

### NON-REGRESSION
```
npm run testByFile -w miroir-core -- modelUpdates
npm run testByFile -w miroir-core -- schemaChangeKind
```
Expected: all pass unchanged.

---

## Phase 7 — Display surfaces (reports + menu wiring)

### 7.1 RED
Add test file: `packages/miroir-core/tests/2_domain/evolutionTrace.reports.unit.test.ts`

Tests:
1. Report asset `ApplicationEvolutionTraceList` is importable from deployment package.
2. Report asset `ApplicationEvolutionTraceHistory` is importable from deployment package.
3. Menu JSON at `dde4c883.../eaac459c....json` contains entries that reference both report UUIDs.

#### Validation (RED)
```
npm run testByFile -w miroir-core -- evolutionTrace.reports
```
Expected: `1 failed` (assets absent).

### 7.1 GREEN
- Add report JSON assets in `miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/`.
- Update menu JSON to add entries referencing both reports.
- Export from `packages/miroir-test-app_deployment-miroir/index.ts`.

#### Validation (GREEN)
```bash
# Unit tests
npm run testByFile -w miroir-core -- evolutionTrace.reports

# Type check
npx tsc --noEmit --skipLibCheck

# Integration: reports appear in loaded Miroir runtime menu
npm run testMiroir -w miroir-standalone-app -- --suites evolutionTraceWP1 --mode integration
```

Expected per check:
| Check | Expected |
|---|---|
| `evolutionTrace.reports` tests | `1 passed` — 3/3 tests pass |
| `ApplicationEvolutionTraceList` report UUID | importable, non-null `uuid` field |
| `ApplicationEvolutionTraceHistory` report UUID | importable, non-null `uuid` field |
| Menu JSON | contains 2 new entries, each with valid `reportUuid` |
| Integration: menu rendered | both menu items visible in loaded app |
| `ApplicationEvolutionTraceList` report executed | returns ≥ 1 trace root (baseline) |
| `ApplicationEvolutionTraceHistory` report executed | returns ordered events for that root |
| `tsc --noEmit` | 0 type errors |

### NON-REGRESSION
```
npm run testByFile -w miroir-core -- menu
npm run testByFile -w miroir-standalone-app -- menu
```
Expected: all pre-existing menu tests pass unchanged.

---

## Phase 8 — End-to-end WP1 tracer bullet

### 8.1 RED
Add integration test suite `evolutionTraceWP1` in `packages/miroir-standalone-app/tests/`.

Single vertical scenario covering the full WP1 observable behaviour:

1. Start from a deployment with no prior trace (or wiped state).
2. Verify baseline exists (1 squashed block, `branchName = "master"`).
3. Execute `createEntity` model action (Library app).
4. Verify 1 raw `ApplicationEvolutionTraceEvent` exists with correct `operationType`, `targetEntityUuid`, `applicationSection = "model"`.
5. Execute `renameEntity` model action.
6. Commit.
7. Verify `compactionLevel = "commit"` returns 1 block for that commit containing both events.
8. Verify `compactionLevel = "version"` returns a bird's-eye block spanning baseline → current.
9. Execute a data-section update on Library app.
10. Verify **no** new trace event (policy gate).
11. Execute a data-section update on Miroir app.
12. Verify 1 new trace event with `applicationSection = "data"`.
13. Verify `definitionVersionResolution` field is present and non-`"unresolved"` on all events created in steps 4 and 5.

#### Validation (RED)
```
npm run testMiroir -w miroir-standalone-app -- --suites evolutionTraceWP1 --mode integration
```
Expected: suite fails (integration gaps still open at start of phase).

### 8.1 GREEN
Fix only the integration gaps identified by failing scenario steps. No new logic beyond what Phases 0–7 already introduced.

#### Validation (GREEN)
```bash
# Full WP1 integration scenario
npm run testMiroir -w miroir-standalone-app -- --suites evolutionTraceWP1 --mode integration

# All miroir-core unit tests
npm run testByFile -w miroir-core

# Final type check
npx tsc --noEmit --skipLibCheck
```

Expected per check:
| Check | Expected |
|---|---|
| WP1 integration suite | all 13 scenario steps pass |
| Step 2: baseline | 1 trace root, 1 baseline event, `branchName = "master"` |
| Step 4: raw event | 1 event, `operationType = "createEntity"`, `applicationSection = "model"` |
| Step 7: commit compaction | 1 block, `eventCount = 2` |
| Step 8: version compaction | 1 summary block, `fromVersion`, `toVersion` present |
| Step 10: Library data update | `ApplicationEvolutionTraceEvent` count unchanged |
| Step 12: Miroir data update | 1 new event, `applicationSection = "data"` |
| Step 13: resolution field | `definitionVersionResolution ≠ "unresolved"` on all model events |
| `testByFile -w miroir-core` | `5 failed \| 79+ passed` (pre-existing failures unchanged, new tests added) |
| `tsc --noEmit` | 0 type errors |

### NON-REGRESSION
```bash
npm run testByFile -w miroir-core
npm run testMiroir -w miroir-core -- --suites miroirCoreTransformers --mode unit
```
Expected: all pre-existing pass/fail counts unchanged.

---

## Implementation checklist (phase-by-phase work items)

### Phase 0 — Contracts & fixtures ✅ DONE
- [x] Add `shouldTraceEvolutionEvent(...)` policy helper tests (**RED** first).
- [x] Implement the helper (**GREEN**).
- [x] Verify: `npm run testByFile -w miroir-core -- evolutionTracePolicy` → **6/6 pass**.
- [x] Verify: `npm run testByFile -w miroir-core` → same pass/fail counts as baseline.

Target files (done):
- `packages/miroir-core/src/2_domain/evolutionTracePolicy.ts`
- `packages/miroir-core/tests/2_domain/evolutionTracePolicy.unit.test.ts`

### Phase 1 — Add WP1 entities (model + types) ✅ DONE
- [x] Create Entity JSON assets for `ApplicationEvolutionTrace` and `ApplicationEvolutionTraceEvent`.
- [x] Create matching EntityDefinition JSON assets.
- [x] Export new assets from the deployment package index.
- [x] Add both entities to the default Miroir meta-model assembly.
- [x] Update `getMiroirFundamentalJzodSchema.ts` — add 2 new parameters and context entries.
- [x] Update `generate-ts-types.ts` — import and pass new entityDefs to schema generator.
- [x] Write schema validation test file (RED).
- [x] Run `npm run devBuild -w miroir-core` (regenerate types) (GREEN).
- [x] Verify: `npm run testByFile -w miroir-core -- evolutionTrace.schema` → **16/16 pass** (incl. TS type assignability tests).
- [x] Verify NON-REGRESSION: `zodParseCheckMiroirTransformerDefinitions` → **32/32 pass**.

Generated types in `miroirFundamentalType.ts`:
- `ApplicationEvolutionTrace`: `{ uuid, parentUuid, applicationUuid, branchName, createdAt, ... }`
- `ApplicationEvolutionTraceEvent`: `{ uuid, parentUuid, traceRootUuid, sequenceNumber, operationType, applicationSection, compactionLevel, timestamp, definitionVersionResolution, targetEntityUuid, ... }`
- Matching Zod validators `applicationEvolutionTrace` and `applicationEvolutionTraceEvent` (used in parse tests).

Target files (done):
- `packages/miroir-test-app_deployment-miroir/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/de089f57-....json` (Entity: ApplicationEvolutionTrace)
- `packages/miroir-test-app_deployment-miroir/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/f4c2b3a1-....json` (Entity: ApplicationEvolutionTraceEvent)
- `packages/miroir-test-app_deployment-miroir/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/a8b9c0d1-....json` (EntityDefinition: ApplicationEvolutionTrace)
- `packages/miroir-test-app_deployment-miroir/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/b1c2d3e4-....json` (EntityDefinition: ApplicationEvolutionTraceEvent — 12 domain fields)
- `packages/miroir-test-app_deployment-miroir/index.ts` (4 new exports)
- `packages/miroir-test-app_deployment-miroir/index.d.ts` (4 new declare stubs)
- `packages/miroir-test-app_deployment-miroir/src/Model.ts` (entities[] + entityDefinitions[])
- `packages/miroir-core/src/0_interfaces/1_core/bootstrapJzodSchemas/getMiroirFundamentalJzodSchema.ts` (2 params + 2 context entries)
- `packages/miroir-core/scripts/generate-ts-types.ts` (2 imports + 2 args)
- `packages/miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.ts` (generated — contains new types)
- `packages/miroir-core/src/index.ts` (exports for both types + Zod validators)
- `packages/miroir-core/tests/2_domain/evolutionTrace.schema.unit.test.ts` (new — 10 tests)

### Phase 2 — Persist raw trace events in runtime flow
- [ ] Write test for trace-event creation (RED).
- [ ] Add trace root creation/lookup logic (GREEN).
- [ ] Add append-only trace event writes with monotonic sequence numbers.
- [ ] Store `operationType`, `timestamp`, `traceRootUuid`.
- [ ] Verify: `npm run testByFile -w miroir-core -- evolutionTrace.persist` → **≥ 3/3 pass**.
- [ ] Verify: `npx tsc --noEmit --skipLibCheck` → **0 errors**.
- [ ] Verify NON-REGRESSION: `modelUpdates` passes.

Target files:
- `packages/miroir-core/src/3_controllers/DomainController.ts`
- `packages/miroir-core/src/2_domain/` (new writer helpers)
- `packages/miroir-core/tests/2_domain/evolutionTrace.persist.unit.test.ts` (new)

### Phase 3 — Enforce application/section policy
- [ ] Write the three policy scenario tests (RED).
- [ ] Apply `shouldTraceEvolutionEvent(...)` in producer path (GREEN).
- [ ] Verify: `npm run testByFile -w miroir-core -- evolutionTrace.policy` → **3/3 pass**.
- [ ] Verify: `evolutionTrace.persist` tests still pass.
- [ ] Verify NON-REGRESSION: `cacheRefreshPolicy`, `modelUpdates` pass.

Target files:
- `packages/miroir-core/src/3_controllers/DomainController.ts`
- `packages/miroir-core/src/2_domain/evolutionTracePolicy.ts`
- `packages/miroir-core/tests/2_domain/evolutionTrace.policy.unit.test.ts` (new)

### Phase 4 — Read-side compaction cursor
- [ ] Write three compaction tests with setup of 3+ raw events across 2 commits (RED).
- [ ] Implement `fetchEvolutionHistory({ compactionLevel })` in query layer (GREEN).
- [ ] Verify: `npm run testByFile -w miroir-core -- evolutionTrace.compaction` → **3/3 pass**.
- [ ] Verify: raw ordering is ascending by `sequenceNumber`.
- [ ] Verify: `npx tsc --noEmit --skipLibCheck` → **0 errors**.
- [ ] Verify NON-REGRESSION: `queries`, `resolveQueryTemplates` pass.

Target files:
- `packages/miroir-core/src/2_domain/QuerySelectors.ts` (or new query helper)
- `packages/miroir-core/src/2_domain/TransformersForRuntime.ts` (if used)
- `packages/miroir-core/tests/2_domain/evolutionTrace.compaction.unit.test.ts` (new)

### Phase 5 — Initial squashed baseline
- [ ] Write baseline creation and idempotence tests (RED).
- [ ] Implement `generateEvolutionBaseline(...)` (GREEN).
- [ ] Wire into deployment initialisation for Miroir, Library, Admin, Postgres.
- [ ] Verify: `npm run testByFile -w miroir-core -- evolutionTrace.baseline` → **2/2 pass**.
- [ ] Verify: integration test shows 1 baseline root per deployment.
- [ ] Verify: calling twice → no duplicate baseline events.
- [ ] Verify NON-REGRESSION: `createDeploymentCompositeAction`, `modelEnvironment` pass.

Target files:
- `packages/miroir-core/src/1_core/Deployment.ts` (or initializer flows)
- `packages/miroir-core/src/3_controllers/` (initializer wiring)
- `packages/miroir-core/tests/2_domain/evolutionTrace.baseline.unit.test.ts` (new)

### Phase 6 — #15-compatible definition-version resolution
- [ ] Write 4 resolver unit tests covering all precedence paths (RED).
- [ ] Implement `resolveDefinitionVersionForTraceEvent(...)` (GREEN).
- [ ] Persist `definitionVersionResolution` field on every trace event.
- [ ] Verify: `npm run testByFile -w miroir-core -- evolutionTrace.defversion` → **4/4 pass**.
- [ ] Verify: unresolved path emits `log.warn` (captured in test, no silent drop).
- [ ] Verify NON-REGRESSION: `modelUpdates`, `schemaChangeKind` pass.

Target files:
- `packages/miroir-core/src/2_domain/evolutionTraceDefVersion.ts` (new resolver module)
- `packages/miroir-core/src/3_controllers/DomainController.ts`
- `packages/miroir-core/tests/2_domain/evolutionTrace.defversion.unit.test.ts` (new)

### Phase 7 — Reports + menu wiring
- [ ] Write 3 report/menu presence tests (RED).
- [ ] Add report JSON assets for `ApplicationEvolutionTraceList` and `ApplicationEvolutionTraceHistory` (GREEN).
- [ ] Update menu JSON to include 2 new entries.
- [ ] Export from deployment package index.
- [ ] Verify: `npm run testByFile -w miroir-core -- evolutionTrace.reports` → **3/3 pass**.
- [ ] Verify: integration → both reports execute without errors and return data.
- [ ] Verify NON-REGRESSION: `menu` tests pass.

Target files:
- `packages/miroir-test-app_deployment-miroir/assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/*.json` (report assets)
- `packages/miroir-test-app_deployment-miroir/assets/miroir_data/dde4c883-ae6d-47c3-b6df-26bc6e3c1842/eaac459c-6c2b-475c-8ae4-c6c3032dae00.json` (menu)
- `packages/miroir-test-app_deployment-miroir/index.ts`
- `packages/miroir-core/tests/2_domain/evolutionTrace.reports.unit.test.ts` (new)

### Phase 8 — End-to-end tracer bullet
- [ ] Write 13-step vertical integration scenario (RED).
- [ ] Fix integration gaps only — no new logic (GREEN).
- [ ] Verify: `npm run testMiroir -w miroir-standalone-app -- --suites evolutionTraceWP1 --mode integration` → **all 13 steps pass**.
- [ ] Verify: `npm run testByFile -w miroir-core` → pre-existing failures unchanged, new tests added to passed count.
- [ ] Verify: `npx tsc --noEmit --skipLibCheck` → **0 errors**.

Target files:
- `packages/miroir-core/tests/` (any final unit-level gaps)
- `packages/miroir-standalone-app/tests/evolutionTraceWP1.integ.test.ts` (new)

### Command checklist (per milestone)
```bash
npx tsc --noEmit --skipLibCheck
npm run testByFile -w miroir-core -- <pattern>
npm run testMiroir -w miroir-core -- --suites <suite> --mode unit
npm run testMiroir -w miroir-standalone-app -- --suites evolutionTraceWP1 --mode integration
npm run devBuild -w miroir-core       # only after entity/type asset changes
```

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

