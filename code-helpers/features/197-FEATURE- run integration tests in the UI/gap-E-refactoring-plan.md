# Gap E — Refactoring plan: consolidate setup helpers into session adapters

**Parent:** [integ-test-setup-gaps.md](./integ-test-setup-gaps.md) — Gap E  
**Prerequisite:** [gap-C-refactoring-plan.md](./gap-C-refactoring-plan.md) (Slices T / E / ET / P / F — done)  
**Follow-up:** [gap-B-refactoring-plan.md](./gap-B-refactoring-plan.md) (library playfield contract — implement **after** this plan)  
**Scope:** Pure refactoring. **No test assertion changes.** Every migrated suite must pass with the same
`it()` bodies and the same env vars / profiles as before.

**Status:** Slices B0 / B1 / B2 / DC / R — done. Next: Slice O (`MiroirTestIntegrationOrchestrator`).

---

## 1. Goal

Replace ad-hoc `setupMiroirTest*` ladder calls scattered across `3_controllers`, legacy `4_view`
runner files, and duplicate bootstrap logic inside session classes with:

1. A **shared internal bootstrap** (infrastructure-as-code for integ tests).
2. **Named session adapters** implementing `RunnerTestSessionInterface` for every remaining family.
3. A thin **`MiroirTestIntegrationOrchestrator`** port in `miroir-core` so UI / CLI can select a
   session by profile without importing `miroir-standalone-app` helpers.

Gap E **does not** implement library playfield idempotency (Gap B) or UI skip-deployment flags
(Gap A). It **prepares** hooks those gaps plug into.

---

## 2. Impacted families

| Family | Files today | Current bootstrap | Target session (Gap E) |
|--------|-------------|-------------------|------------------------|
| **DomainController CRUD** | `3_controllers/DomainController.integ.*.CRUD.test.tsx` (5 files) | `setupMiroirTestAndCreateMiroirDeployment` + `resetAndInitApplicationDeployment(miroir)` | `DomainControllerIntegrationTestSession` (`bootstrap: "miroirPlatform"`) |
| **DomainController React** | `3_controllers/DomainController.React.Model.undo-redo.test.tsx` | `setupMiroirTest` + manual miroir + library `createDeploymentCompositeAction` | `DomainControllerIntegrationTestSession` (`bootstrap: "miroirAndLibrary"`) |
| **Legacy runner integ** | `4_view/Runner_Miroir.integ.test.tsx` | `setupMiroirTestAndDeployMiroirApp` + `beforeEachTest` | `RunnerTestSession` (refactored internals only) |
| **MiroirTest runner (#197)** | `miroir-runner-tests.integ.test.ts` | `RunnerTestSession` | unchanged call site; shared bootstrap inside session |
| **4_storage PSC** | `4_storage/*.integ.test.tsx` | `AppStackIntegrationTestSession` | refactor to shared bootstrap (no test file edits) |
| **Transformer integ** | `miroir-core-tests.integ.test.ts` | `IntegrationTestSession` | optional orchestrator wiring only |
| **Applicative library (dormant)** | `applicative.Library.*.integ.test.tsx` (commented out) | — | **Out of scope** until files are re-enabled |

**Not touched in Gap E:** `miroir-cli` / `miroir-mcp` (`setupMiroirPlatform`), component integ,
Gap A UI embedding, Gap D profile unification.

---

## 3. Before / after architecture

### 3.1 Today (fragmented)

```
Per-file beforeAll
  ├─ miroirAppStartup + store section startups (duplicated in every file)
  ├─ loadTestConfigFiles(VITE_MIROIR_*)
  └─ one of:
        setupMiroirTest
        setupMiroirTestAndCreateMiroirDeployment
        setupMiroirTestAndDeployMiroirApp
        AppStackIntegrationTestSession.initSession()   ← already extracted (Gap C)
        IntegrationTestSession.initSession()             ← already extracted (Gap C)
```

### 3.2 Target (Gap E complete)

```
loadTestConfigFiles / MIROIR_TEST_*  (unchanged at entry)
        │
        ▼
MiroirTestIntegrationOrchestrator.createSession(kind, options)   ← miroir-core port
        │
        ▼
RunnerTestSessionInterface implementation (miroir-standalone-app)
        │
        ▼
appStackIntegrationBootstrap(phases)   ← shared internal module
  phase: registerStoreSections (optional — see Slice S)
  phase: wireEmulatedStack        → setupMiroirTest
  phase: deployMiroir             → createMiroirDeploymentGetPersistenceStoreController
  phase: deployLibrary            → createDeploymentCompositeAction("library")  [optional]
  phase: resetMiroirModel         → resetAndInitApplicationDeployment([miroir])  [optional]
        │
        ▼
MiroirTestExecutionEnvironment { domainController, applicationDeploymentMap,
  testApplicationUuid, persistenceStoreControllerManager, runnerTestContext? }
```

**Session matrix after Gap E:**

| Session class | `bootstrap` phases | `testApplicationUuid` |
|---------------|-------------------|------------------------|
| `IntegrationTestSession` | local PSC path (unchanged) | `testApplication` synthetic UUID |
| `AppStackIntegrationTestSession` | wire + deployMiroir + deployLibrary | `selfApplicationLibrary` |
| `DomainControllerIntegrationTestSession` | wire + deployMiroir [+ deployLibrary] [+ resetMiroir] | `selfApplicationLibrary` when library deployed, else miroir self-app |
| `RunnerTestSession` | wire + deployMiroir (via shared bootstrap) | runner test app UUID |

---

## 4. Introduced / altered contracts (miroir-core)

All changes are **additive** until the final cleanup slice. Existing `miroir-core` unit tests that
import `RunnerTestSessionInterface` or `MiroirTestExecutionEnvironment` keep compiling.

### 4.1 `IntegrationTestBootstrapPhase` (new type — Gap E)

**Location:** `packages/miroir-core/src/5_tests/IntegrationTestBootstrap.ts` (new)

```typescript
export type IntegrationTestBootstrapPhase =
  | "registerStoreSections"   // miroirAppStartup + store packages — CLI only for now
  | "wireEmulatedStack"       // setupMiroirTest equivalent
  | "deployMiroir"            // Miroir meta-application deployment
  | "deployLibrary"           // Library application deployment composite
  | "resetMiroirModel";       // resetAndInitApplicationDeployment([miroir])

export type IntegrationTestSessionKind =
  | "transformer"
  | "appStackPsc"
  | "domainController"
  | "runner";

/** Metadata only in Gap E; Gap B adds playfield semantics here. */
export type IntegrationTestSessionDescriptor = {
  kind: IntegrationTestSessionKind;
  bootstrapPhases: readonly IntegrationTestBootstrapPhase[];
};
```

**Role:** Declarative IaC profile per session kind. Unit-tested in `miroir-core` without pulling
`miroir-standalone-app`.

### 4.2 `MiroirTestIntegrationOrchestrator` (new port — Gap E)

**Location:** `packages/miroir-core/src/5_tests/MiroirTestIntegrationOrchestrator.ts` (new)

```typescript
export type IntegrationTestOrchestratorContext = {
  miroirConfig: MiroirConfigClient;
  miroirActivityTracker?: MiroirActivityTracker;
  miroirEventService?: MiroirEventService;
  /** Gap A will add: hostDomainController?, skipPhases?: ... */
};

export interface MiroirTestIntegrationOrchestrator {
  createSession(
    kind: IntegrationTestSessionKind,
    context: IntegrationTestOrchestratorContext,
    sessionSpecificOptions?: unknown,
  ): RunnerTestSessionInterface;

  describeSession(kind: IntegrationTestSessionKind): IntegrationTestSessionDescriptor;
}
```

**Implementation:** `packages/miroir-standalone-app/tests/helpers/StandaloneAppIntegrationOrchestrator.ts`
registers the four session constructors. **Not** in `miroir-core` (avoids react / store deps).

**Role:** Single factory for #197 Phase B and for consolidating `testMiroir` / `testByFile` entry
points later. Gap E only wires transformer + runner entries; per-file Vitest files keep constructing
sessions directly until Slice DC.

### 4.3 `RunnerTestSessionInterface` — unchanged method signatures

```typescript
export interface RunnerTestSessionInterface {
  initSession(): Promise<MiroirTestExecutionEnvironment>;
  beforeEach(): Promise<void>;
  teardown(): Promise<void>;
}
```

Optional **readonly** metadata (additive, non-breaking for mocks):

```typescript
export interface RunnerTestSessionInterface {
  readonly descriptor?: IntegrationTestSessionDescriptor;
  // methods unchanged
}
```

`miroir-core` unit tests (`MiroirTransformerTestTools.unit.test.ts`, future orchestrator tests)
continue to use plain object mocks; `descriptor` is optional.

### 4.4 `MiroirTestExecutionEnvironment` — unchanged

No new required fields in Gap E. Gap B may add optional `playfieldState` later.

### 4.5 Shared bootstrap module (standalone-app, private)

**Location:** `packages/miroir-standalone-app/tests/helpers/appStackIntegrationBootstrap.ts` (new)

```typescript
export type AppStackBootstrapOptions = {
  miroirConfig: MiroirConfigClient;
  applicationDeploymentMap: ApplicationDeploymentMap;
  adminDeployment: Deployment;
  miroirDeploymentStorageConfiguration: StoreUnitConfiguration;
  libraryDeploymentStorageConfiguration?: StoreUnitConfiguration;
  phases: readonly IntegrationTestBootstrapPhase[];
  miroirActivityTracker?: MiroirActivityTracker;
  miroirEventService?: MiroirEventService;
};

export async function runAppStackIntegrationBootstrap(
  options: AppStackBootstrapOptions,
): Promise<MiroirTestExecutionEnvironment> { /* ... */ }
```

**Role:** Single implementation of `setupMiroirTest` + deployment composites. Replaces duplicated
logic in `AppStackIntegrationTestSession`, `setupMiroirTestAndCreateMiroirDeployment`,
`setupMiroirTestAndDeployMiroirApp`, and the new `DomainControllerIntegrationTestSession`.

### 4.6 `DomainControllerIntegrationTestSession` (new)

**Location:** `packages/miroir-standalone-app/tests/helpers/DomainControllerIntegrationTestSession.ts`

```typescript
export type DomainControllerSessionProfile =
  | "miroirPlatform"      // CRUD tests: miroir deployment + reset miroir model
  | "miroirAndLibrary";   // undo-redo: miroir + library deployments

export class DomainControllerIntegrationTestSession implements RunnerTestSessionInterface {
  constructor(
    miroirConfig: MiroirConfigClient,
    appStackOptions: AppStackSessionOptions,  // reuse from IntegrationTestSession.ts
    profile: DomainControllerSessionProfile,
  ) {}
}
```

**`initSession` behaviour (must match pre-refactor exactly):**

| Profile | Phases | Post-init side effects |
|---------|--------|------------------------|
| `miroirPlatform` | wire + deployMiroir + resetMiroirModel | Same as CRUD `beforeAll` today |
| `miroirAndLibrary` | wire + deployMiroir + deployLibrary | Same as undo-redo `beforeAll` today (no reset in beforeAll) |

**`beforeEach`:** no-op in Gap E (tests keep their own `beforeEach` hooks unchanged).

---

## 5. What is intentionally NOT introduced in Gap E

| Rejected / deferred | Reason |
|---------------------|--------|
| `ensureLibraryPlayfield` idempotent helper | Gap B |
| `skipMiroirAndAdminDeployment` / host `domainController` injection | Gap A |
| Migrating PSC assertions to `domainController` | Gap C-assertions (deferred) |
| Moving `setupMiroirTest` into `miroir-core` | Keeps `miroir-core` free of react / emulated-server deps |
| Re-enabling commented `applicative.Library.*` tests | Dormant files; separate ticket |
| Unifying `MIROIR_TEST_*` and `VITE_MIROIR_*` | Gap D |

---

## 6. TDD steps

Each slice: **Red → Green → verify regression → one commit**. Run the listed verification commands
after every slice.

**Global regression anchors** (run after slices that touch shared code):

```bash
# Transformer integ
MIROIR_TEST_SUITES=miroirCoreTransformers MIROIR_TEST_MODE=integ MIROIR_TEST_POSTGRES_HOST=localhost \
  npm run testMiroir -w miroir-standalone-app

# 4_storage (sql profile)
VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-sql.json \
VITE_MIROIR_LOG_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/specificLoggersConfig_warn.json \
npm run testByFile -w miroir-standalone-app -- PersistenceStoreController.integ

# miroir-core unit (interface stability)
npm run testByFile -w miroir-core -- MiroirTransformerTestTools.unit
npm run testByFile -w miroir-core -- MiroirTestTools
```

---

### Slice B0 — Bootstrap phase descriptors (miroir-core, unit only) — ✅ done

**B0-Red:** `packages/miroir-core/tests/5-tests/IntegrationTestBootstrap.unit.test.ts` — ✅ **PASS**

**B0-Green:** `packages/miroir-core/src/5_tests/IntegrationTestBootstrap.ts` + exports from `index.ts` — ✅ **PASS**

---

### Slice B1 — Shared `runAppStackIntegrationBootstrap` (standalone-app, unit) — ✅ done

**B1-Red/Green:** `appStackIntegrationBootstrap.ts` + `appStackIntegrationBootstrap.unit.test.ts` — ✅ **PASS**

**B1-Refactor:** `AppStackIntegrationTestSession.initSession()` delegates to bootstrap with
`getBootstrapPhasesForSessionKind("appStackPsc")` — ✅ **PASS**

**Verify:** IntegrationTestSession.unit 12/12; ExtractorPersistenceStoreRunner.integ 11/11; transformer 243/243.

---

### Slice B2 — Thin `setupMiroirTest*` wrappers (no test file changes) — ✅ done

**B2-Green:** `setupMiroirTestAndCreateMiroirDeployment` / `setupMiroirTestAndDeployMiroirApp` are thin
wrappers around `runAppStackIntegrationBootstrap` (`compositeAction` + optional `openAdminAndMiroirStoresOnServer`).

**B2-Red:** `setupMiroirTestWrappers.unit.test.ts` — ✅ **PASS** (2/2)

**Note:** Rebuild `miroir-core` (`npm run build -w miroir-core`) after adding bootstrap exports so
`getBootstrapPhasesForSessionKind` resolves from `dist/`.

---

### Slice DC — `DomainControllerIntegrationTestSession` — ✅ **DONE**

**DC0-Red:** `DomainControllerIntegrationTestSession.unit.test.ts` — ✅ **PASS** (3/3)

- Profile `miroirPlatform`: bootstrap phases + `resetAndInitApplicationDeployment` called once in
  `initSession`.
- Profile `miroirAndLibrary`: `deployLibrary` phase invoked; no reset in `initSession`.
- Profile `miroirPlatform` + `skipResetMiroirModelInInit: true` omits `resetMiroirModel` (Model.CRUD).

**DC1-Green:** Implement session class — ✅

`DomainControllerIntegrationTestSession.ts` delegates to `runAppStackIntegrationBootstrap` with
`deployMiroirStrategy: "compositeAction"`, canonical Miroir UUIDs from `miroir-test-app_deployment-miroir`,
and `openAdminAndMiroirStoresOnServer: true`.

**DC2 — Migrate `DomainController.integ.Data.CRUD.test.tsx` (`beforeAll` only)** — ✅

Replace:

```typescript
const { domainController: localdomainController } = await setupMiroirTestAndCreateMiroirDeployment(...);
domainController = localdomainController;
await resetAndInitApplicationDeployment(domainController, applicationDeploymentMap, [selfApplicationDeploymentMiroir]);
```

With:

```typescript
const session = new DomainControllerIntegrationTestSession(miroirConfig, {
  applicationDeploymentMap,
  adminDeployment,
  miroirDeploymentStorageConfiguration,
  libraryDeploymentStorageConfiguration: testDeploymentStorageConfiguration,
  miroirActivityTracker,
  miroirEventService,
}, "miroirPlatform");
const env = await session.initSession();
domainController = env.domainController;
```

- `beforeEach` / `it()` / `afterAll`: **unchanged**.

**DC3 — Migrate remaining CRUD files** (same pattern) — ✅

- `DomainController.integ.Model.CRUD.test.tsx` (`skipResetMiroirModelInInit: true`, `customFetch: crossFetch`)
- `DomainController.integ.compositePK.CRUD.test.tsx`
- `DomainController.integ.nonUuidPK.CRUD.test.tsx`
- `DomainController.integ.noParentUuid.CRUD.test.tsx`

**DC4 — Migrate `DomainController.React.Model.undo-redo.test.tsx`** — ✅

Profile `"miroirAndLibrary"`. Remove manual `createDeploymentCompositeAction` blocks from
`beforeAll`. Keep `beforeEach` (`resetAndInitApplicationDeployment` with
`selfApplicationDeploymentConfigurations`) **unchanged**.

**DC implementation notes (discovered during slice):**

- **Bootstrap fix:** `openAdminAndMiroirStores` must use `adminDeployment` +
  `miroirDeploymentStorageConfiguration` from test config — canonical `selfApplicationDeploymentMiroir`
  JSON has no `configuration` field.
- **Postgres / #172:** `SqlDbInstanceStoreSectionMixin.upsertInstance` now uses
  `instance.parentUuid ?? parentUuid` (aligned with IndexedDb/MongoDb); required for
  `noParentUuid.Data.CRUD` on SQL configs.

**Verify per file:**

```bash
VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-sql.json \
VITE_MIROIR_LOG_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/specificLoggersConfig_warn.json \
npm run testByFile -w miroir-standalone-app -- DomainController.integ.Data.CRUD
# repeat for each migrated file
```

---

### Slice R — `RunnerTestSession` internal consolidation — ✅ **DONE**

**R1-Green:** Refactor `RunnerTestSession.initSession()` to call `runAppStackIntegrationBootstrap`
with phases `[wireEmulatedStack, deployMiroir]` (library creation remains in `beforeEachTest` /
Gap B). **No change** to public return value or `runnerTestContext` shape. — ✅

`RunnerTestSession.ts` now calls `runAppStackIntegrationBootstrap` directly with
`getBootstrapPhasesForSessionKind("runner")`, `deployMiroirStrategy: "compositeAction"`,
`openAdminAndMiroirStoresOnServer: false`, and canonical Miroir UUIDs from
`miroir-test-app_deployment-miroir`. `RunnerTestSession.unit.test.ts` — ✅ **PASS** (2/2).

**R2 — Migrate `Runner_Miroir.integ.test.tsx`** — ✅

Replace `setupMiroirTestAndDeployMiroirApp` in `beforeAll` with `RunnerTestSession` (mirror
`miroir-runner-tests.integ.test.ts` pattern). `beforeEach` delegates to `session.beforeEach()`
(which still calls `beforeEachTest` internally). `it()` bodies **unchanged**.

**R implementation notes:**

- Removed duplicate `getTestConfig` / `internalMiroirConfig` setup from `Runner_Miroir.integ.test.tsx`;
  session `getTestSessionConfig()` is the single source for bootstrap config.
- `afterAll` calls `runnerTestSession.teardown()` before `afterAllTests`.

**Verify:**

```bash
npm run testByFile -w miroir-standalone-app -- Runner_Miroir.integ
MIROIR_TEST_SUITES=runner_library MIROIR_TEST_MODE=integ \
  npm run testMiroir -w miroir-standalone-app
```

---

### Slice O — `MiroirTestIntegrationOrchestrator`

**O0-Red:** `packages/miroir-core/tests/5_tests/MiroirTestIntegrationOrchestrator.unit.test.ts`

- Mock `IntegrationTestSessionFactory` injected into orchestrator.
- `createSession("transformer", ctx)` delegates to factory with correct kind.
- `describeSession("appStackPsc")` returns descriptor from `getBootstrapPhasesForSessionKind`.

**O1-Green:**

- `MiroirTestIntegrationOrchestrator.ts` in miroir-core (default impl throws unless factory registered).
- `createDefaultMiroirTestIntegrationOrchestrator(factory)` helper.
- `StandaloneAppIntegrationOrchestrator.ts` in standalone-app.

**O2 — Wire entries (optional call-site cleanup)**

- `miroir-core-tests.integ.test.ts`: may use orchestrator → `IntegrationTestSession` (behaviour
  unchanged).
- `miroir-runner-tests.integ.test.ts`: orchestrator → `RunnerTestSession`.

Per-file Vitest (`testByFile`) **may** keep direct session construction until Gap B; orchestrator
is not mandatory for DC migrations.

**Verify:** Global regression anchors.

---

### Slice S — Store section startup helper (optional, low risk)

**Problem:** Every integ file repeats:

```typescript
miroirAppStartup();
miroirCoreStartup();
miroirFileSystemStoreSectionStartup(...);
// ...
```

**S1-Green:** `registerIntegrationTestStoreSections(configurationService, miroirConfig)` in
`appStackIntegrationBootstrap.ts` (phase `registerStoreSections`).

**S2:** Migrate **one** file (`DomainController.integ.Data.CRUD`) top-level startups to
`session.initSession()` precondition or a shared `prepareIntegrationTestModule(miroirConfig)` called
once at module load. Only proceed if zero behaviour change.

**Defer full migration** if any store registration order sensitivity appears.

---

### Slice F — Deprecation + docs (Gap E final)

**F1:** Mark `@deprecated` on `setupMiroirTestAndCreateMiroirDeployment` and
`setupMiroirTestAndDeployMiroirApp` with pointer to session classes. Keep `setupMiroirTest` public
(internal bootstrap still uses it).

**F2:** Update `docs/reference/testing.md` — session matrix, orchestrator, bootstrap phases.

**F3:** Update `integ-test-setup-gaps.md` Gap E section → partial / done.

**F4:** Remove unused imports of deprecated helpers from migrated files (already done per slice).

**Verify:** Full regression matrix:

| Suite | Command |
|-------|---------|
| Transformer | `MIROIR_TEST_SUITES=miroirCoreTransformers MIROIR_TEST_MODE=integ MIROIR_TEST_POSTGRES_HOST=localhost npm run testMiroir -w miroir-standalone-app` |
| 4_storage ×3 | `testByFile` with sql config |
| DomainController CRUD ×5 | `testByFile` per file |
| undo-redo | `testByFile -- DomainController.React.Model.undo-redo` |
| Runner legacy | `testByFile -- Runner_Miroir.integ` |
| Runner MiroirTest | `MIROIR_TEST_SUITES=runner_library MIROIR_TEST_MODE=integ npm run testMiroir -w miroir-standalone-app` |
| miroir-core units | `MiroirTransformerTestTools.unit`, `IntegrationTestBootstrap.unit`, orchestrator unit |

---

## 7. Handoff to Gap B

When Gap E is complete, the following are **stable extension points** for
[gap-B-refactoring-plan.md](./gap-B-refactoring-plan.md):

| Extension point | Gap B usage |
|-----------------|-------------|
| `IntegrationTestSessionDescriptor` | Add `playfield: IntegrationTestPlayfield` |
| `runAppStackIntegrationBootstrap` | Call `ensureLibraryPlayfield` instead of unconditional `deployLibrary` |
| `DomainControllerIntegrationTestSession.beforeEach` | Delegate to shared library reset helper |
| `RunnerTestSession.beforeEach` | Replace ad-hoc `beforeEachTest` with playfield-aware helper |
| `MiroirTestIntegrationOrchestrator` | Accept `playfield` / `reuseExistingLibrary` in context (Gap A/B) |

Gap E **must not** implement idempotent library logic — only leave a single bootstrap path Gap B
can instrument.

---

## 8. Success criteria

- [ ] `getBootstrapPhasesForSessionKind` unit-tested in `miroir-core`
- [ ] `runAppStackIntegrationBootstrap` unit-tested; `AppStackIntegrationTestSession` delegates to it
- [ ] `setupMiroirTestAndCreateMiroirDeployment` / `setupMiroirTestAndDeployMiroirApp` are thin wrappers (deprecated)
- [ ] `DomainControllerIntegrationTestSession` covers both CRUD and undo-redo profiles
- [ ] All 5 `DomainController.integ.*.CRUD` files use session in `beforeAll` only
- [ ] `DomainController.React.Model.undo-redo` uses session in `beforeAll` only
- [ ] `RunnerTestSession` uses shared bootstrap; `Runner_Miroir.integ` uses `RunnerTestSession`
- [ ] `MiroirTestIntegrationOrchestrator` port exists in `miroir-core` with unit tests
- [ ] `RunnerTestSessionInterface` method signatures unchanged; existing miroir-core unit mocks still valid
- [ ] No `it()` body edits across migrated suites
- [ ] All verification commands in §6 pass with same counts as pre-Gap-E baseline

---

## 9. Risk register

| Risk | Mitigation |
|------|------------|
| `setupMiroirTestAndDeployMiroirApp` returns server vs client `domainController` subtly | Characterization tests in B2; compare activity tracker traces on Runner_Miroir before/after |
| CRUD tests rely on `resetAndInitApplicationDeployment` only for miroir, not library | Do not add `deployLibrary` to `miroirPlatform` profile; Gap B owns library contract |
| Duplicate store registration if Slice S partial | Keep module-level startups in unmigrated files; migrate atomically per file |
| Orchestrator pulls react into miroir-core | Factory interface in core; implementation only in standalone-app |
