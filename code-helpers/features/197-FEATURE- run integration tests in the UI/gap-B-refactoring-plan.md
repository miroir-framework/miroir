# Gap B — Refactoring plan: library playfield contract

**Parent:** [integ-test-setup-gaps.md](./integ-test-setup-gaps.md) — Gap B  
**Prerequisite:** [gap-E-refactoring-plan.md](./gap-E-refactoring-plan.md) (**must be complete first**)  
**Follow-up:** [gap-A-refactoring-plan.md](./gap-A-refactoring-plan.md) (platform skip / host injection — implement **after** Gap B)  
**Related:** Gap A (skip deployment when UI host is live) plugs into the same bootstrap phases  
**Scope:** Pure refactoring. Standardise **when** the library deployment is created, reset, and
seeded — **not** what tests assert. PSC-direct `4_storage` test bodies remain unchanged (Gap C).

**Status:** L0–L8 done. Next: Slice L9 (CLI/MCP optional).

---

## 1. Goal

Introduce a declarative **playfield** contract so every integration family states whether it needs:

- no application deployment (`none`),
- the synthetic `testApplication` playfield (`testApplication` — transformer integ only),
- or the real **library** deployment UUIDs (`libraryDeployment`).

Provide **idempotent** helpers in `miroir-core` so the same code path works from:

- fresh CLI Vitest (create + reset library),
- Gap A UI embedding later (skip create if host already deployed, still reset test data in isolation).

Gap B **does not** merge transformer `testApplication` schema with deployment `library` (optional
future work). It **does** eliminate duplicated `resetAndInitApplicationDeployment` /
`resetAndinitializeDeploymentCompositeAction` / `addEntitiesAndInstances` orchestration across
families that already share library UUIDs.

---

## 2. Impacted families

| Family | Library today | Gap B change |
|--------|---------------|--------------|
| **4_storage** | `AppStackIntegrationTestSession` creates library in `initSession`; per-file `beforeEach` resets + seeds | `beforeEach` → `resetLibraryPlayfield()` helper; `initSession` → `ensureLibraryPlayfield()` |
| **DomainController CRUD** | Library data created inside test composite actions; miroir reset in `beforeAll` | Declare `playfield: "libraryDeployment"`; optional `ensureLibraryPlayfield` in session if tests assume deployment exists |
| **undo-redo** | Library created in `beforeAll`; multi-deployment reset in `beforeEach` | `playfield: "libraryDeployment"`; `beforeEach` → shared helper |
| **RunnerTestSession / Runner_Miroir** | `beforeEachTest` resets miroir only; runner tests create test app per scenario | `playfield: "libraryDeployment"` for platform; test-app playfield documented separately |
| **Transformer integ** | `testApplication` synthetic UUIDs | `playfield: "testApplication"` — **no UUID convergence** |
| **CLI / MCP** | Inline `beforeEach` library reset | Optional slice — adopt helpers only if low conflict |

**Not in Gap B:** PSC→`domainController` assertion migration, env profile unification (Gap D),
UI subprocess launcher for `4_storage`.

---

## 3. Before / after architecture

### 3.1 Today (post Gap C + Gap E)

```
AppStackIntegrationTestSession.initSession()
  → always createDeploymentCompositeAction("library")

Per-file beforeEach (4_storage):
  resetAndInitApplicationDeployment(...)
  resetAndinitializeDeploymentCompositeAction(..., libraryEntitiesAndInstances)
  // or addEntitiesAndInstances for ExtractorTemplate

DomainController CRUD beforeAll:
  miroirPlatform only — library lifecycle inside test JSON

Runner beforeEachTest:
  resetAndInitApplicationDeployment([miroir]) only
```

No shared declaration of playfield requirements; UI cannot know whether to reuse host library.

### 3.2 Target (Gap B complete)

```
IntegrationTestPlayfield (miroir-core type)
        │
        ▼
RunnerTestSessionInterface.descriptor.playfield
        │
        ▼
ensureLibraryPlayfield({ mode: "createIfAbsent" | "requireExisting", ... })
  └─ idempotent createDeploymentCompositeAction("library") when absent
        │
        ▼
resetLibraryPlayfield({ seed: LibrarySeedProfile })
  └─ resetAndInitApplicationDeployment + resetAndinitializeDeploymentCompositeAction
     OR addEntitiesAndInstances (emulated-server path)
```

**Playfield enum:**

```typescript
export type IntegrationTestPlayfield =
  | "none"
  | "testApplication"      // IntegrationTestSession / transformer — synthetic UUIDs
  | "libraryDeployment";   // deployment_Library_DO_NO_USE — shared across app-stack tests
```

**Seed profiles** (standalone-app constants, invoked by core helper via callback or imported data):

| Profile | Used by |
|---------|---------|
| `LIBRARY_ENTITIES_STANDARD` | 4_storage, ExtractorTemplate |
| `LIBRARY_ENTITIES_WITHOUT_BOOK3` | DomainController.integ.Data.CRUD |
| `MIROIR_PLATFORM_ONLY` | Runner `beforeEachTest` (miroir reset, no library seed) |

---

## 4. Introduced contracts (miroir-core)

All additions are **additive**. Existing `RunnerTestSessionInterface` mocks gain optional fields only.

### 4.1 Extend `IntegrationTestSessionDescriptor` (from Gap E)

**Location:** `packages/miroir-core/src/5_tests/IntegrationTestBootstrap.ts`

```typescript
export type IntegrationTestPlayfield =
  | "none"
  | "testApplication"
  | "libraryDeployment";

export type IntegrationTestSessionDescriptor = {
  kind: IntegrationTestSessionKind;
  bootstrapPhases: readonly IntegrationTestBootstrapPhase[];
  playfield: IntegrationTestPlayfield;
};
```

### 4.2 `LibraryPlayfieldOptions` + helpers (new)

**Location:** `packages/miroir-core/src/5_tests/LibraryPlayfield.ts` (new)

```typescript
export type LibraryPlayfieldEnsureMode =
  | "createIfAbsent"   // CLI default
  | "requireExisting"  // Gap A UI: deployment must already exist
  | "skip";            // Gap A: host owns library entirely (test must not mutate — rare)

export type EnsureLibraryPlayfieldParams = {
  domainController: DomainControllerInterface;
  applicationDeploymentMap: ApplicationDeploymentMap;
  adminDeployment: Deployment;
  libraryDeploymentStorageConfiguration: StoreUnitConfiguration;
  libraryDeploymentUuid: Uuid;
  librarySelfApplicationUuid: Uuid;
  mode: LibraryPlayfieldEnsureMode;
};

export async function ensureLibraryPlayfield(
  params: EnsureLibraryPlayfieldParams,
): Promise<{ created: boolean }>;

export type ResetLibraryPlayfieldParams = {
  domainController: DomainControllerInterface;
  applicationDeploymentMap: ApplicationDeploymentMap;
  libraryDeploymentUuid: Uuid;
  librarySelfApplicationUuid: Uuid;
  /** When set, runs resetAndinitializeDeploymentCompositeAction with this seed data */
  libraryEntitiesAndInstances?: ApplicationEntitiesAndInstances;
  /** When true, also reset miroir meta-model (runner beforeEach behaviour) */
  resetMiroirPlatform?: boolean;
};

export async function resetLibraryPlayfield(
  params: ResetLibraryPlayfieldParams,
): Promise<void>;
```

**Design rules:**

- `ensureLibraryPlayfield` checks whether PSC / deployment already exists (via
  `domainController` or `persistenceStoreControllerManager` — use the same signal
  `createDeploymentCompositeAction` failure would today; prefer idempotent check if available).
- `resetLibraryPlayfield` **composes** existing `resetAndInitApplicationDeployment` and
  `resetAndinitializeDeploymentCompositeAction` — no new store semantics.
- Helpers accept **UUIDs as parameters** (not hard-coded constants) so `miroir-core` unit tests
  stay package-pure; standalone-app passes `deployment_Library_DO_NO_USE.uuid` etc.

### 4.3 Session `beforeEach` ownership (policy)

| Session | `initSession` playfield | `beforeEach` in Gap B |
|---------|-------------------------|------------------------|
| `IntegrationTestSession` | `testApplication` | existing re-seed (unchanged) |
| `AppStackIntegrationTestSession` | `libraryDeployment` | optional: delegate to `resetLibraryPlayfield` when `sessionManagesPlayfield: true` |
| `DomainControllerIntegrationTestSession` | `none` or `libraryDeployment` per profile | `miroirPlatform`: no-op; `miroirAndLibrary`: `resetLibraryPlayfield` if tests move hook into session |
| `RunnerTestSession` | `libraryDeployment` (platform) | `resetLibraryPlayfield({ resetMiroirPlatform: true })` replaces `beforeEachTest` |

**Migration strategy:** Prefer moving **identical** `beforeEach` blocks into session `beforeEach`
only when test files currently duplicate the same 3–5 lines. Otherwise keep hooks in test files but
call `resetLibraryPlayfield` (one-liner replacement — still no `it()` changes).

### 4.4 Gap A extension point (document only — not implemented in Gap B)

```typescript
export type IntegrationTestOrchestratorContext = {
  // ... Gap E fields
  playfieldMode?: LibraryPlayfieldEnsureMode;
  hostApplicationDeploymentMap?: ApplicationDeploymentMap;
};
```

---

## 5. Consistency with Gap E

Gap E delivers `runAppStackIntegrationBootstrap(phases)`. Gap B **replaces** unconditional
`deployLibrary` phase with:

```typescript
if (phases.includes("deployLibrary")) {
  await ensureLibraryPlayfield({ mode: context.playfieldMode ?? "createIfAbsent", ... });
}
```

Gap E session classes gain `readonly descriptor` with `playfield` filled from
`getSessionDescriptor(kind, profile)`.

**Order of implementation:** Never start Gap B until Gap E Slice B1 (shared bootstrap) is merged.
Otherwise library idempotency would be duplicated into obsolete helpers.

---

## 6. TDD steps

**Baseline:** Record test counts from Gap E verification matrix before first Gap B slice.

**miroir-core unit tests** (no standalone-app deps):

```bash
npm run testByFile -w miroir-core -- LibraryPlayfield.unit
npm run testByFile -w miroir-core -- IntegrationTestBootstrap.unit
```

---

### Slice L0 — Playfield types + descriptors — ✅ **DONE**

**L0-Red:** Extend `IntegrationTestBootstrap.unit.test.ts`

- Every `IntegrationTestSessionKind` maps to exactly one `playfield` value.
- `appStackPsc` → `libraryDeployment`; `transformer` → `testApplication`; etc.

**L0-Green:** Update `getBootstrapPhasesForSessionKind` / descriptor builders.

**Verify:** miroir-core unit only.

---

### Slice L1 — `ensureLibraryPlayfield` (unit + implementation) — ✅ **DONE**

**L1-Red:** `packages/miroir-core/tests/5-tests/LibraryPlayfield.unit.test.ts`

| Case | Expectation |
|------|-------------|
| `createIfAbsent`, no existing deployment | `handleCompositeAction(createDeployment…)` called once; returns `{ created: true }` |
| `createIfAbsent`, deployment already exists | no composite action; returns `{ created: false }` |
| `requireExisting`, absent | throws descriptive error |
| `skip` | no-op |

Mock `DomainControllerInterface.handleCompositeAction` only — no real stores.

**L1-Green:** Implement `LibraryPlayfield.ts`. Export from `miroir-core/src/index.ts`.

**Verify:** `LibraryPlayfield.unit` green.

---

### Slice L2 — `resetLibraryPlayfield` (unit + implementation) — ✅ **DONE**

**L2-Red:** Same unit file — `resetLibraryPlayfield`

| Case | Expectation |
|------|-------------|
| With `libraryEntitiesAndInstances` | calls `resetAndInitApplicationDeployment` then `resetAndinitializeDeploymentCompositeAction` with seed |
| With `resetMiroirPlatform: true` | includes miroir deployment in reset list (matches `beforeEachTest`) |
| Without seed | only `resetAndInitApplicationDeployment` for library deployment |

**L2-Green:** Implement using existing exports from `DomainController.ts` / composite action
builders. **Do not** fork reset logic.

**Verify:** `LibraryPlayfield.unit` green; run one 4_storage integ unchanged (pre-integration).

---

### Slice L3 — Wire bootstrap `deployLibrary` phase — ✅ **DONE**

**L3-Green:** In `runAppStackIntegrationBootstrap`, replace raw
`createDeploymentCompositeAction("library")` with `ensureLibraryPlayfield`.

**L3-Red:** Update `appStackIntegrationBootstrap.unit.test.ts` — assert `ensureLibraryPlayfield`
called instead of direct composite action.

**Verify:**

```bash
npm run testByFile -w miroir-standalone-app -- appStackIntegrationBootstrap.unit
# 4_storage full
VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-sql.json \
VITE_MIROIR_LOG_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/specificLoggersConfig_warn.json \
npm run testByFile -w miroir-standalone-app -- ExtractorPersistenceStoreRunner.integ
npm run testByFile -w miroir-standalone-app -- ExtractorTemplatePersistenceStoreRunner.integ
npm run testByFile -w miroir-standalone-app -- PersistenceStoreController.integ
```

---

### Slice L4 — `4_storage` `beforeEach` consolidation — ✅ **DONE**

**L4 — Refactor `beforeEach` only** in each file to call `resetLibraryPlayfield` with the same
seed data as today:

| File | Seed |
|------|------|
| `ExtractorPersistenceStoreRunner.integ.test.tsx` | current `resetAndinitializeDeploymentCompositeAction` payload |
| `ExtractorTemplatePersistenceStoreRunner.integ.test.tsx` | keep `addEntitiesAndInstances` **or** fold into `resetLibraryPlayfield` if equivalent — must preserve emulate-server localCache behaviour |
| `PersistenceStoreController.integ.test.tsx` | current `resetAndInitApplicationDeployment` only |

**Constraint:** ExtractorTemplate uses `addEntitiesAndInstances(localAppPSC, domainController, localCache, …)`.
If not equivalent to `resetAndinitializeDeploymentCompositeAction`, add optional
`postResetHook` to `ResetLibraryPlayfieldParams` rather than changing behaviour.

**Verify:** 10 + 11 + 7 tests pass (same as Gap C baseline).

---

### Slice L5 — `RunnerTestSession` / `RunnerIntegTestTools` — ✅ **DONE**

**L5-Green:** Replace `beforeEachTest` body with:

```typescript
await resetLibraryPlayfield({
  domainController,
  applicationDeploymentMap,
  libraryDeploymentUuid: deployment_Library_DO_NO_USE.uuid,
  librarySelfApplicationUuid: selfApplicationLibrary.uuid,
  resetMiroirPlatform: true,
});
```

**L5 — Migrate call sites:** `Runner_Miroir.integ.test.tsx`, `miroir-runner-tests` path — if
`beforeEach` still calls `beforeEachTest`, behaviour unchanged.

**Verify:**

```bash
npm run testByFile -w miroir-standalone-app -- Runner_Miroir.integ
MIROIR_TEST_SUITES=runner_library MIROIR_TEST_MODE=integ \
  npm run testMiroir -w miroir-standalone-app
```

---

### Slice L6 — `DomainControllerIntegrationTestSession` playfield metadata — ✅ **DONE**

**L6-Green:**

- Profile `miroirPlatform`: `playfield: "none"` (library lifecycle stays in test JSON).
- Profile `miroirAndLibrary`: `playfield: "libraryDeployment"`; `initSession` uses
  `ensureLibraryPlayfield` instead of raw `deployLibrary` phase.

**L6 — Optional `beforeEach`:** undo-redo file may replace manual
`resetAndInitApplicationDeployment(selfApplicationDeploymentConfigurations)` with
`resetLibraryPlayfield({ resetMiroirPlatform: true, … })` **only if** characterization proves
equivalent deployment list.

**Verify:**

```bash
npm run testByFile -w miroir-standalone-app -- DomainController.React.Model.undo-redo
# all CRUD files — no regression
```

---

### Slice L7 — Orchestrator + descriptor surfacing — ✅ **DONE**

**L7-Green:** `MiroirTestIntegrationOrchestrator.describeSession(kind)` returns `playfield`.
`StandaloneAppIntegrationOrchestrator` passes `playfieldMode` through to bootstrap (default
`createIfAbsent`).

**L7-Red:** orchestrator unit test asserts playfield metadata for UI catalog (#197).

**Verify:** miroir-core orchestrator + bootstrap units.

---

### Slice L8 — Docs + gap analysis update — ✅ **DONE**

**L8:** Update `docs/reference/testing.md` with playfield table. Update
`integ-test-setup-gaps.md` Gap B → done. Cross-link Gap A flags to `LibraryPlayfieldEnsureMode`.

**L8 — Seed constants:** Move duplicated `libraryEntitiesAndInstances*` exports to
`packages/miroir-standalone-app/tests/helpers/libraryPlayfieldSeeds.ts` (re-export for tests that
need custom seeds). **No** change to instance data.

---

### Slice L9 — CLI / MCP (optional)

Only if `setupMiroirPlatform` duplicates library reset inline:

- Replace with `ensureLibraryPlayfield` + `resetLibraryPlayfield` in `beforeEach`.
- Skip slice if high conflict / low value.

---

## 7. What is intentionally NOT done in Gap B

| Item | Reason |
|------|--------|
| Align transformer `testApplication` with `library` UUIDs | Different scale / schema; document only |
| Gap A `skipMiroirAndAdminDeployment` | Separate plan |
| Move `4_storage` assertions to `domainController` | Gap C-assertions deferred |
| New MiroirTest `executionSurface: "persistenceStore"` | #197 Phase B+ / UI launcher |
| Delete `resetAndInitApplicationDeployment` from public API | Still used inside helpers |

---

## 8. Regression matrix (final)

| Suite | Expected |
|-------|----------|
| Transformer integ | 243/243 |
| 4_storage ×3 | 10 + 11 + 7 |
| DomainController CRUD ×5 | same pass count as pre-Gap-B |
| undo-redo | same |
| Runner_Miroir + runner_library MiroirTest | same |
| miroir-core `LibraryPlayfield.unit` | all cases |
| miroir-core existing units | no mock breakage |

---

## 9. Success criteria

- [x] `IntegrationTestPlayfield` type exported from `miroir-core`
- [x] `ensureLibraryPlayfield` + `resetLibraryPlayfield` unit-tested without standalone-app imports
- [x] `runAppStackIntegrationBootstrap` uses `ensureLibraryPlayfield` for library phase
- [x] All `4_storage` `beforeEach` hooks use shared playfield helpers (behaviour-preserving)
- [x] `RunnerTestSession` / `beforeEachTest` uses `resetLibraryPlayfield`
- [x] Session descriptors expose `playfield` for orchestrator / future UI
- [x] `RunnerTestSessionInterface` method signatures unchanged
- [x] No `it()` body edits
- [x] Transformer integ still uses `testApplication` playfield — documented, not merged with library
- [ ] Full regression matrix §8 green

---

## 10. Seamless path to #197 UI execution

After Gap E + Gap B:

```
UI Test Launcher (#197 Phase B)
  │
  ├─ describeSession("runner") → playfield: libraryDeployment
  ├─ describeSession("transformer") → playfield: testApplication
  └─ describeSession("appStackPsc") → playfield: libraryDeployment + PSC assertions (subprocess launcher)

Orchestrator context (Gap A later):
  playfieldMode: "requireExisting" | "createIfAbsent"
  hostDomainController: injected
  skipBootstrapPhases: ["deployMiroir", "deployLibrary"]
```

Gap B makes the **playfield declaration** machine-readable. Gap A adds **when to skip** phases
without forking per-family setup code again.
