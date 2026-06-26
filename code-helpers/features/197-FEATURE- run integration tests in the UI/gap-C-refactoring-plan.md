# Gap C — Refactoring plan: unify `4_storage` integ setup via `AppStackIntegrationTestSession`

**Parent:** [integ-test-setup-gaps.md](./integ-test-setup-gaps.md) — Gap C  
**Scope:** Three integration test families in `miroir-standalone-app/tests/4_storage` plus the
`miroir-core` transformer integ entry. Slices **E / ET / P** refactor **`beforeAll` setup** only;
test bodies keep using `localAppPersistenceStoreController` / `localMiroirPersistenceStoreController`
(unchanged). Optional PSC→`domainController` migration in tests is
[deferred](#appendix-a--deferred-psc-assertion-migration). Runner tests (`3_controllers`, `4_view`)
and CLI/MCP tests are already on `domainController` and are **not touched** here.

**Status:** **Slice T — done.** **Slice E — done.** **Slice ET — done.** **Slice P — done** (`AppStackIntegrationTestSession`, PSC CRUD setup). Slice F — pending.

---

## 1. Impacted families

| Family | Files | Current bottom-layer API |
|--------|-------|--------------------------|
| **Transformer** | `miroir-standalone-app/tests/miroir-core-tests.integ.test.ts` + `MiroirTransformerTestTools.ts` | ~~`PersistenceStoreDataSectionInterface.handleBoxedQueryAction`~~ → `domainController.handleBoxedExtractorOrQueryAction` ✅ |
| **Extractor** | `4_storage/ExtractorPersistenceStoreRunner.integ.test.tsx` | Setup → `AppStackIntegrationTestSession` (Slice E ✅). Assertions: `PersistenceStoreControllerInterface.handleBoxedQueryAction` (unchanged) |
| **ExtractorTemplate** | `4_storage/ExtractorTemplatePersistenceStoreRunner.integ.test.tsx` | Setup → `AppStackIntegrationTestSession` (Slice ET ✅). Assertions: `handleQueryTemplateActionForServerONLY` on PSC (unchanged) |
| **PSC CRUD** | `4_storage/PersistenceStoreController.integ.test.tsx` | Setup → `AppStackIntegrationTestSession` (Slice P ✅). Assertions: `localAppPersistenceStoreController` / `localMiroirPersistenceStoreController` (unchanged) |

---

## 2. Before / after architectural configurations

### 2.1 Transformer integ (miroir-core)

**Before**

```
miroir-core-tests.integ.test.ts
  parseMiroirTestCliConfig (MIROIR_TEST_*)
  initMiroirCoreTestIntegrationStore(postgresHostName)
    ├─ new SqlDbAdminStore(connectionString, schema)        ← direct Postgres
    ├─ new SqlDbDataStoreSection(connectionString, schema)
    ├─ new SqlDbModelStoreSection(connectionString, schema)
    ├─ new PersistenceStoreController(admin, model, data)
    ├─ persistenceStoreController.createStore(admin/model/data)
    ├─ persistenceStoreController.open()
    ├─ persistenceStoreController.initApplication(...)
    ├─ persistenceStoreController.handleAction("resetModel")
    ├─ persistenceStoreController.handleAction("initModel")
    ├─ persistenceStoreController.handleAction("createEntity") ← library entities
    └─ persistenceStoreController.handleAction("createInstance") ← library instances
  returns { sqlDbDataStore: PersistenceStoreDataSectionInterface, ... }
  runMiroirCoreTestsFromCLI({ integrationDataStore: sqlDbDataStore })
    runMiroirTests._runMiroirTestSuite(executionOptions: { integrationStore: sqlDbDataStore })
      runMiroirTest("transformerTest", integration)
        runMiroirTransformerIntegrationTest(sqlDbDataStore)
          sqlDbDataStore.handleBoxedQueryAction(runBoxedQueryAction)   ← PSC direct
```

**After**

```
miroir-core-tests.integ.test.ts
  parseMiroirTestCliConfig (MIROIR_TEST_*)
  new IntegrationTestSessionForPostgres(postgresHostName)           ← new connector
  adapter.initSession()
    buildMiroirConfigForPostgres(postgresHostName)           ← new helper
    setupMiroirTest(miroirConfig)                            ← existing, now used in core tests
      PersistenceStoreControllerManager (server side)
      setupMiroirDomainController(miroirContext, localParams)
        PersistenceReduxSaga + LocalCache + DomainController
    domainController.handleCompositeAction(
      createDeploymentCompositeAction("testApplication", ...))
    domainController.handleCompositeAction(
      resetAndinitializeDeploymentCompositeAction(..., libraryEntitiesAndInstances))
  returns MiroirTestExecutionEnvironment { domainController }
  runMiroirCoreTestsFromCLI({ executionEnvironment: { domainController } })
    runMiroirTests._runMiroirTestSuite(executionOptions: { executionEnvironment })
      runMiroirTest("transformerTest", integration)
        runMiroirTransformerIntegrationTest(domainController)  ← signature change
          domainController.handleBoxedExtractorOrQueryAction(
            runBoxedQueryAction, applicationDeploymentMap, modelEnv)
```

---

### 2.2 Extractor tests — Slice E (`ExtractorPersistenceStoreRunner.integ.test.tsx`) — ✅ done

**Goal (revised):** unify **setup** through `AppStackIntegrationTestSession`; **test bodies stay on PSC**
(`handleBoxedQueryAction`). No migration of assertion calls to `domainController` in this slice.

**Before (setup — beforeAll)**

```
loadTestConfigFiles(VITE_MIROIR_*)
setupMiroirTest(miroirConfig)
  → { domainControllerForClient, persistenceStoreControllerManagerForServer }
createMiroirDeploymentGetPersistenceStoreController(...)
  → localMiroirPersistenceStoreController = manager.getPersistenceStoreController(deployment_Miroir.uuid)
domainController.handleCompositeAction(createDeploymentCompositeAction("library"))
localAppPersistenceStoreController =
  manager.getPersistenceStoreController(deployment_Library_DO_NO_USE.uuid)
```

**Before (setup — beforeEach)** — unchanged in Slice E

```
resetAndInitApplicationDeployment(...)
domainController.handleCompositeAction(resetAndinitializeDeploymentCompositeAction(..., libraryEntitiesAndInstances))
```

**Before (test bodies)** — unchanged in Slice E

```
localMiroirPersistenceStoreController.handleBoxedQueryAction(q)
localAppPersistenceStoreController.handleBoxedQueryAction(q)
```

**After (setup — beforeAll)** — as implemented

```
loadTestConfigFiles(VITE_MIROIR_*)   // still required for emulated-server store layout + module constants
new AppStackIntegrationTestSession(miroirConfig, {
  applicationDeploymentMap,
  adminDeployment,
  libraryDeploymentStorageConfiguration,
}).initSession()
  → {
      domainController,                        // client domainController (remote PSC mode)
      applicationDeploymentMap,
      testApplicationUuid,                   // selfApplicationLibrary.uuid
      persistenceStoreControllerManager,       // server-side manager (NEW on MiroirTestExecutionEnvironment)
    }
  // inside initSession: setupMiroirTest → createMiroirDeploymentGetPersistenceStoreController
  //   → createDeploymentCompositeAction("library")
localMiroirPersistenceStoreController =
  persistenceStoreControllerManager.getPersistenceStoreController(deployment_Miroir.uuid)
localAppPersistenceStoreController =
  persistenceStoreControllerManager.getPersistenceStoreController(deployment_Library_DO_NO_USE.uuid)
```

**After (setup — beforeEach)** — unchanged

**After (test bodies)** — unchanged (still PSC direct calls)

`setupMiroirTest`, `createMiroirDeploymentGetPersistenceStoreController`, and library
`createDeploymentCompositeAction` are removed from the test file `beforeAll` (folded into
`AppStackIntegrationTestSession.initSession`). Module-level store startups (`miroirAppStartup`,
`miroirCoreStartup`, store section startups) remain in the test file (E4 optional cleanup).

---

### 2.3 ExtractorTemplate tests — Slice ET (`ExtractorTemplatePersistenceStoreRunner.integ.test.tsx`) — ✅ done

**Goal (revised, mirrors Slice E):** unify **`beforeAll` setup** through `AppStackIntegrationTestSession`;
**test bodies stay on PSC** (`handleQueryTemplateActionForServerONLY`). No migration of assertion
calls to `domainController` in this slice.

**Before (setup — beforeAll)**

```
loadTestConfigFiles(VITE_MIROIR_*)
setupMiroirTest(miroirConfig)
  → { domainControllerForClient, persistenceStoreControllerManagerForServer, localCache }
createMiroirDeploymentGetPersistenceStoreController(...)
  → localMiroirPersistenceStoreController
domainController.handleCompositeAction(createDeploymentCompositeAction("library"))
localAppPersistenceStoreController =
  manager.getPersistenceStoreController(deployment_Library_DO_NO_USE.uuid)
```

**Before (setup — beforeEach)** — unchanged in Slice ET

```
resetAndInitApplicationDeployment(...)
addEntitiesAndInstances(localAppPersistenceStoreController, domainController, localCache, ...)
```

**Before (test bodies)** — unchanged in Slice ET

```
localAppPersistenceStoreController.handleQueryTemplateActionForServerONLY(q)
localMiroirPersistenceStoreController.handleQueryTemplateActionForServerONLY(q)
```

**After (setup — beforeAll)** — as implemented (same as Slice E)

```
loadTestConfigFiles(VITE_MIROIR_*)
new AppStackIntegrationTestSession(miroirConfig, {
  applicationDeploymentMap,
  adminDeployment,
  libraryDeploymentStorageConfiguration,
}).initSession()
  → { domainController, persistenceStoreControllerManager, ... }
localCache = domainController.getLocalCache()
localMiroirPersistenceStoreController =
  persistenceStoreControllerManager.getPersistenceStoreController(deployment_Miroir.uuid)
localAppPersistenceStoreController =
  persistenceStoreControllerManager.getPersistenceStoreController(deployment_Library_DO_NO_USE.uuid)
```

**After (setup — beforeEach)** — unchanged (`addEntitiesAndInstances` stays)

**After (test bodies)** — unchanged (still PSC direct calls)

`setupMiroirTest`, `createMiroirDeploymentGetPersistenceStoreController`, and library
`createDeploymentCompositeAction` removed from `beforeAll`. Dead duplicate constants removed
(`typedAdminConfigurationDeploymentLibrary`, shadow `ApplicationDeploymentMap`). Module-level store
startups remain (ET3 optional cleanup).

**Non-goal (deferred):** migrating `handleQueryTemplateActionForServerONLY` to
`domainController.handleQueryTemplateActionForServerONLY` — same deferral pattern as Slice E for
`handleBoxedQueryAction`.

---

### 2.4 PSC CRUD tests — Slice P (`PersistenceStoreController.integ.test.tsx`) — ✅ done

**Goal (same contract as Slices E / ET):** only **`beforeAll` setup** moves to
`AppStackIntegrationTestSession`. **`it()` blocks are not edited** — they keep calling
`localAppPersistenceStoreController` and `localMiroirPersistenceStoreController` directly
(`getInstances`, `createEntity`, `renameEntityClean`, `dropEntity`, `upsertInstance`, …).

**Before (setup — beforeAll)**

```
loadTestConfigFiles(VITE_MIROIR_*)
setupMiroirTest(miroirConfig)
  → { domainControllerForClient, persistenceStoreControllerManagerForServer, localCache }
createMiroirDeploymentGetPersistenceStoreController(...)
  → localMiroirPersistenceStoreController
domainController.handleCompositeAction(createDeploymentCompositeAction("library"))
localAppPersistenceStoreController =
  manager.getPersistenceStoreController(deployment_Library_DO_NO_USE.uuid)
```

**Before (setup — beforeEach)** — unchanged in Slice P

```
resetAndInitApplicationDeployment(domainController, applicationDeploymentMap, ...)
```

**Before (setup — afterAll)** — unchanged in Slice P

```
deleteAndCloseApplicationDeployments(miroirConfig, domainController, applicationDeploymentMap, ...)
```

**Before (test bodies)** — unchanged in Slice P

```typescript
localMiroirPersistenceStoreController.getInstances("model", entityEntity.uuid)
localAppPersistenceStoreController.getInstances("model", entityEntity.uuid)
localAppPersistenceStoreController.getInstances("data", entityAuthor.uuid)
localAppPersistenceStoreController.createEntity(entity, entityDefinition)
localAppPersistenceStoreController.renameEntityClean(modelActionRenameEntity)
localAppPersistenceStoreController.dropEntity(entityUuid, entityDefinitionUuid)
// upsertInstance via chainVitestSteps where used
```

**After (setup — beforeAll)** — as implemented (same as Slices E / ET)

```
loadTestConfigFiles(VITE_MIROIR_*)
new AppStackIntegrationTestSession(miroirConfig, {
  applicationDeploymentMap,
  adminDeployment,
  libraryDeploymentStorageConfiguration,
}).initSession()
  → { domainController, persistenceStoreControllerManager, ... }
localMiroirPersistenceStoreController =
  persistenceStoreControllerManager.getPersistenceStoreController(deployment_Miroir.uuid)
localAppPersistenceStoreController =
  persistenceStoreControllerManager.getPersistenceStoreController(deployment_Library_DO_NO_USE.uuid)
// localCache = domainController.getLocalCache() if still referenced (currently unused in this file)
```

**After (setup — beforeEach / afterAll)** — unchanged

**After (test bodies)** — unchanged (still `localAppPersistenceStoreController` / `localMiroirPersistenceStoreController`)

No new session code required — reuse `AppStackIntegrationTestSession` from Slice E.

**Non-goal (out of scope for Slice P):** replacing PSC calls in tests with `domainController` — see
[Appendix A](#appendix-a--deferred-psc-assertion-migration) for optional future work only.

---

## 3. Introduced connectors — feature and role descriptions

### 3.1 `IntegrationTestSession` (was: `IntegrationTestSessionForPostgres`)

**Location:** `packages/miroir-standalone-app/tests/helpers/IntegrationTestSession.ts`  
**Deprecated alias:** `IntegrationTestSessionForPostgres` (thin sql+filesystem wrapper)

**Implements:** `RunnerTestSessionInterface` (`initSession / beforeEach / teardown`)

**Feature:** Provides a `domainController`-bearing `MiroirTestExecutionEnvironment` for
miroir-core MiroirTest integration runs against configurable store backends (sql, filesystem,
indexedDb, mongodb for the test app; plus bundled admin). Replaces the deleted
`initMiroirCoreTestIntegrationStore` direct-PSC assembly.

**Role (hexagonal):** Adapter on the `RunnerTestSessionInterface` port. Complements
`RunnerTestSession` (standalone-app full-stack emulated-server environment for runner tests).
Both adapters are interchangeable from `runMiroirCoreTestsFromCLI`'s perspective.

**Why in standalone-app, not miroir-core:** Uses `setupMiroirDomainController` from
`miroir-localcache-redux` (legitimate dev-dep) and store section startups from store packages;
keeps `miroir-core` unit-only while hosting the integ vitest entry next to other standalone integ tests.

**Internal structure (as implemented):**

```typescript
export class IntegrationTestSession implements RunnerTestSessionInterface {
  constructor(private readonly options: TestSessionForIntegOptions) {}

  async initSession(): Promise<MiroirTestExecutionEnvironment> {
    // register store startups, buildMiroirConfigForInteg(...)
    const domainController = await setupMiroirDomainController(miroirContext, { local PSC });
    // PSC createStore / open / initApplication for admin + test deployments
    await initTestApplicationData(domainController, applicationDeploymentMap);
    // resetModel → initModel → createEntity (transactional: false) → createInstance
    return {
      domainController,
      applicationDeploymentMap,
      testApplicationUuid,
      persistenceStoreControllerManager,
    };
  }

  async beforeEach(): Promise<void> {
    await initTestApplicationData(...);  // same seed sequence
  }

  async teardown(): Promise<void> {
    await domainController.handleCompositeAction(deleteDeploymentCompositeAction(...));
  }
}
```

**`AppStackIntegrationTestSession`** (Slices E ✅ / ET ✅ / P ✅ — app-stack / `VITE_MIROIR_*` integ tests):

**Location:** same file — `packages/miroir-standalone-app/tests/helpers/IntegrationTestSession.ts`

**Implements:** `RunnerTestSessionInterface` (`initSession / beforeEach` no-op / `teardown`)

**Feature:** Bootstraps the emulated-server stack used by `4_storage` integ tests: `setupMiroirTest`
(client remote + server local via `RestClientStub`), Miroir deployment
(`createMiroirDeploymentGetPersistenceStoreController`), and Library deployment
(`createDeploymentCompositeAction`). Returns `persistenceStoreControllerManager` (server side) so
tests can keep PSC-direct assertions.

**Options:** `AppStackSessionOptions` — `applicationDeploymentMap`, `adminDeployment`,
`libraryDeploymentStorageConfiguration` (derived from `loadTestConfigFiles` in the test file).

**Role:** Complements `IntegrationTestSession` (MIROIR_TEST_* / single `testApplication` path for
transformer integ). Option **(B)** from the Slice E design: separate class, not an extension of
`TestSessionForIntegOptions`.

```typescript
export class AppStackIntegrationTestSession implements RunnerTestSessionInterface {
  constructor(miroirConfig: MiroirConfigClient, appStackOptions: AppStackSessionOptions) {}

  async initSession(): Promise<MiroirTestExecutionEnvironment> {
    const { domainControllerForClient, persistenceStoreControllerManagerForServer } =
      await setupMiroirTest(miroirConfig);
    await createMiroirDeploymentGetPersistenceStoreController(...);
    await domainController.handleCompositeAction(createDeploymentCompositeAction("library", ...));
    return {
      domainController: domainControllerForClient,
      applicationDeploymentMap,
      testApplicationUuid: selfApplicationLibrary.uuid,
      persistenceStoreControllerManager: persistenceStoreControllerManagerForServer,
    };
  }
}
```

---

### 3.2 Config builders (was: `buildMiroirConfigForPostgres` only)

**Location:** `packages/miroir-standalone-app/tests/helpers/IntegrationTestSession.ts`

**As implemented:**

- `buildTestApplicationStoreUnitConfiguration(applicationName, options)` — sql / filesystem / indexedDb / mongodb
- `buildAdminStoreUnitConfiguration(options)` — filesystem / sql / indexedDb / mongodb / bundled
- `buildMiroirConfigForInteg(testStoreConfig, adminStoreConfig, filesystemRoot)` — assembles `MiroirConfigClient` for `setupMiroirDomainController`
- `buildMiroirConfigForPostgres(host)` — retained for deprecated `IntegrationTestSessionForPostgres`
- `resolveTestSessionForIntegOptionsFromEnv(env)` — maps `MIROIR_TEST_*` vars to options

**Role:** Typed builders keep store configuration compile-checked and centralised; env-based
parameterisation allows admin and test-app backends to be chosen independently (fixes the original
`42P06` / `miroirAdmin` schema collision when both were on Postgres by default).

---

### 3.3 Signature change: `runMiroirTransformerIntegrationTest`

**Location:** `packages/miroir-core/src/5_tests/MiroirTransformerTestTools.ts`

**Before:** `function runMiroirTransformerIntegrationTest(sqlDbDataStore: PersistenceStoreDataSectionInterface)`  
**After:** `function runMiroirTransformerIntegrationTest(domainController: DomainControllerInterface)`

**Feature change (single line in test body):**

```typescript
// before
queryResult = await sqlDbDataStore.handleBoxedQueryAction(action, applicationDeploymentMap);

// after
queryResult = await domainController.handleBoxedExtractorOrQueryAction(
  action, applicationDeploymentMap, defaultMetaModelEnvironment
);
```

**Role:** Closes the last direct PSC call inside `miroir-core/src`. After this change,
`PersistenceStoreDataSectionInterface` is no longer imported for test purposes anywhere in
`miroir-core/src`; the TODO comment (`// TODO: BAD! stores should only be accessed through the
domainController`) becomes resolved. The function continues to serve exactly its current role
(execute one transformer test leaf in integration mode against a real store) — only the
transport to the store changes.

**Why not a new function:** Introducing a second function alongside the old one would leave both
code paths alive, making it unclear which to use and creating a maintenance fork. The callers
(one: `runMiroirTest` in `MiroirTestTools.ts`) update their argument in the same commit.

---

### 3.4 `MiroirTestExecutionOptions` — drop `integrationStore`, use `executionEnvironment`

**Location:** `packages/miroir-core/src/5_tests/MiroirTestTools.ts`

**Before:**

```typescript
type MiroirTestExecutionOptions =
  | { executionMode: "unit" }
  | {
      executionMode: "integration";
      integrationStore?: PersistenceStoreDataSectionInterface; // TODO: remove
      executionEnvironment?: MiroirTestExecutionEnvironment;
    };
```

**After:**

```typescript
type MiroirTestExecutionOptions =
  | { executionMode: "unit" }
  | {
      executionMode: "integration";
      executionEnvironment: MiroirTestExecutionEnvironment;   // required, not optional
    };
```

**And in `MiroirTestExecutionEnvironment`:**

```typescript
// before
type MiroirTestExecutionEnvironment = {
  integrationStore?: unknown; // TODO: BAD!
  runnerTestContext?: RunnerTestContext;
};

// after (Slice T + E — done)
type MiroirTestExecutionEnvironment = {
  domainController: DomainControllerInterface;
  applicationDeploymentMap: ApplicationDeploymentMap;
  testApplicationUuid: string;
  persistenceStoreControllerManager: PersistenceStoreControllerManagerInterface;
  runnerTestContext?: RunnerTestContext;
};
```

**Role:** Makes the type system enforce that all integration execution paths carry a
`domainController`. The `integrationStore` field is deleted; both transformer and runner
integration leaves reach the store through the same surface. No new abstraction is introduced —
this is a type cleanup that removes an existing escape hatch flagged with a TODO.

---

### What is intentionally NOT introduced

| Rejected element | Reason |
|-----------------|--------|
| A new `addEntitiesAndInstancesViaDomainController` helper | `resetAndinitializeDeploymentCompositeAction` already does this; adding a wrapper would duplicate its semantics under a different name |
| A new `getInstancesViaDomainController` helper | `domainController.handleBoxedExtractorOrQueryAction` is the direct replacement; a wrapper would add a layer with no additional behaviour |
| A new `PersistenceStoreController` unit test file | The CRUD behaviour is already covered by `DomainController.integ.Data.CRUD.test.tsx`; a separate unit test for PSC is a separate future concern, not part of this migration |
| A `setupMiroirTest` port/copy in `miroir-core` | `setupMiroirDomainController` (from `miroir-localcache-redux`) is the lower-level primitive that `IntegrationTestSessionForPostgres` can use directly without pulling in `miroir-react` |

---

## 4. TDD steps

Each slice keeps all currently-passing tests green. Steps within a slice run in order; each
step's "Red → Green" cycle is one commit.

---

### Slice T — Transformer integ (miroir-core) — **DONE** (2026-06)

Verified green:

```bash
MIROIR_TEST_SUITES=miroirCoreTransformers MIROIR_TEST_MODE=integ \
  MIROIR_TEST_POSTGRES_HOST=localhost \
  npm run testMiroir -w miroir-standalone-app
```

**Implementation notes (deviations from this plan's original naming):**

| Planned | As implemented |
|---------|----------------|
| `IntegrationTestSessionForPostgres` in `miroir-core/tests/helpers/` | `IntegrationTestSession` in `miroir-standalone-app/tests/helpers/IntegrationTestSession.ts` (`IntegrationTestSessionForPostgres` kept as `@deprecated` thin subclass) |
| `buildMiroirConfigForPostgres` only | `buildMiroirConfigForInteg` + store builders (`buildTestApplicationStoreUnitConfiguration`, `buildAdminStoreUnitConfiguration`); `buildMiroirConfigForPostgres` still exists for the deprecated subclass |
| `setupMiroirTest` (miroir-react) | `setupMiroirDomainController` (miroir-localcache-redux) — direct PSC + domainController, no emulated HTTP |
| Seed via `handleCompositeAction(createDeployment…)` + `resetAndinitializeDeploymentCompositeAction` | Seed via `handleAction` (`resetModel` → `initModel` → `createEntity` with `transactional: false` → `createInstance`) in `initTestApplicationData` |
| `miroir-core-tests.integ.test.ts` in miroir-core | Moved to `miroir-standalone-app/tests/miroir-core-tests.integ.test.ts` |
| `runMiroirCoreTestsFromCLI(config, { executionEnvironment })` | `runMiroirCoreTestsFromCLI(runMiroirTests, vitest, config, miroirActivityTracker, testSession)` — session `initSession()` called inside CLI |

---

**T0 — Unit test for session contract (Red)** — ✅ **PASS**

- File: `miroir-standalone-app/tests/helpers/IntegrationTestSession.unit.test.ts` (not `miroir-core/tests/helpers/IntegrationTestSessionForPostgres.unit.test.ts`)
- `describe("IntegrationTestSession session lifecycle")` asserts `initSession` wires `setupMiroirDomainController`, seeds via `handleAction`, returns `{ domainController, applicationDeploymentMap, testApplicationUuid, persistenceStoreControllerManager }`; `beforeEach` re-seeds; `teardown` calls `handleCompositeAction` once.

**T1 — Green: implement session + config builders** — ✅ **PASS**

- `IntegrationTestSession` implements `RunnerTestSessionInterface`.
- Configurable backends via `TestSessionForIntegOptions` / `MIROIR_TEST_*` env (sql, filesystem, indexedDb, mongodb app store; filesystem/sql/indexedDb/mongodb/bundled admin).
- T0 + extended config-builder tests pass.

**T2 — Unit test: `runMiroirTransformerIntegrationTest` accepts `DomainControllerInterface` (Red)** — ✅ **PASS**

- File: `miroir-core/tests/4_services/MiroirTransformerTestTools.unit.test.ts`
- Asserts `handleBoxedExtractorOrQueryAction` is called; no `sqlDbDataStore` reference.

**T3 — Green: update `runMiroirTransformerIntegrationTest` signature** — ✅ **PASS**

- Parameter is `domainController: DomainControllerInterface` (+ `applicationDeploymentMap`, `testApplicationUuid`).
- `MiroirTestExecutionEnvironment`: `domainController`, `applicationDeploymentMap`, `testApplicationUuid` required; `integrationStore` removed.
- `MiroirTestExecutionOptions`: `executionEnvironment` required when `executionMode === "integration"`.
- `runMiroirTest` in `MiroirTestTools.ts` passes `executionEnvironment.domainController` to `runMiroirTransformerIntegrationTest`.
- `runMiroirCoreTestsFromCLI` takes `testSession?: RunnerTestSessionInterface`, calls `testSession.initSession()` for `executionEnvironment`.
- Gap-C TODO comments on `integrationStore` resolved in `MiroirTestTools.ts` / `MiroirTransformerTestTools.ts`.

**T4 — Green: wire session into integ entry** — ✅ **PASS**

- `miroir-standalone-app/tests/miroir-core-tests.integ.test.ts` constructs `IntegrationTestSession` from `resolveTestSessionForIntegOptionsFromEnv`, passes to `runMiroirCoreTestsFromCLI`.
- `initMiroirCoreTestIntegrationStore` no longer called (file deleted).

**T5 — Integration verification** — ✅ **PASS** (primary path); ⚠️ **shim broken**

Primary path (verified):

```bash
MIROIR_TEST_SUITES=miroirCoreTransformers MIROIR_TEST_MODE=integ \
  MIROIR_TEST_POSTGRES_HOST=localhost \
  npm run testMiroir -w miroir-standalone-app
```

**T5-follow-up — Remove legacy `transformers.integ.test` shim** — ✅ **PASS**


**T6 — Delete `initMiroirCoreTestIntegrationStore`** — ✅ **PASS**

- No `initMiroirCoreTestIntegrationStore` / `miroirTestIntegrationStore` sources remain in the repo.

---

### Slice E — Extractor tests (`ExtractorPersistenceStoreRunner.integ.test.tsx`) — ✅ done

**Goal:** Replace ad-hoc `setupMiroirTest` / `createMiroirDeploymentGetPersistenceStoreController` /
library `createDeploymentCompositeAction` bootstrap in `beforeAll` with
`AppStackIntegrationTestSession`, while keeping every `it()` block unchanged (still
`localMiroirPersistenceStoreController.handleBoxedQueryAction` /
`localAppPersistenceStoreController.handleBoxedQueryAction`).

**Non-goals for Slice E:** migrating assertion calls to `domainController` (deferred indefinitely).

**Implementation notes (deviations from this plan's original wording):**

| Planned | As implemented |
|---------|----------------|
| `IntegrationTestSession.forAppStackConfig(miroirConfig)` factory | `AppStackIntegrationTestSession` class constructed directly in the test file |
| `IntegrationTestSession.initSession()` for Extractor | `AppStackIntegrationTestSession.initSession()` — uses `setupMiroirTest` (emulated HTTP), not `setupMiroirDomainController` (local-only transformer path) |
| `persistenceStoreControllerManager` only on transformer session | Also returned from `IntegrationTestSession.initSession()` and `RunnerTestSession.initSession()` (required field on `MiroirTestExecutionEnvironment`) |

**Prerequisite — extend `MiroirTestExecutionEnvironment`** — ✅ **PASS**

`packages/miroir-core/src/5_tests/MiroirTestTools.ts`:

```typescript
export type MiroirTestExecutionEnvironment = {
  domainController: DomainControllerInterface;
  applicationDeploymentMap: ApplicationDeploymentMap;
  testApplicationUuid: string;
  persistenceStoreControllerManager: PersistenceStoreControllerManagerInterface; // NEW
  runnerTestContext?: RunnerTestContext;
};
```

`IntegrationTestSession.initSession()` constructs a `PersistenceStoreControllerManager` on the
transformer path; `AppStackIntegrationTestSession` reuses the server manager from `setupMiroirTest`.
Both expose the instance on the return value (private field kept for `teardown` on transformer path).

**Config note:** Extractor tests use `VITE_MIROIR_TEST_CONFIG_FILENAME` (emulated server, Miroir +
Library deployments). `IntegrationTestSession` uses `MIROIR_TEST_*` (single `testApplication`
deployment). Implemented as **`AppStackIntegrationTestSession`** (option **B** — separate class).

---

**E0 — Unit test: `initSession` exposes `persistenceStoreControllerManager` (Red)** — ✅ **PASS**

File: `miroir-standalone-app/tests/helpers/IntegrationTestSession.unit.test.ts`

- After `IntegrationTestSession.initSession()`, assert `env.persistenceStoreControllerManager` is defined.
- Assert `env.persistenceStoreControllerManager.getPersistenceStoreController(INTEG_TEST_DEPLOYMENT_UUID)` returns the opened PSC used for seeding.

**E1 — Green: extend types + session return values** — ✅ **PASS**

- `persistenceStoreControllerManager` on `MiroirTestExecutionEnvironment` in `miroir-core`.
- Returned from `IntegrationTestSession.initSession()`; private field for `teardown`.
- `AppStackIntegrationTestSession` added for Miroir + Library deployments via `setupMiroirTest`.
- E0 passes; Slice T (`miroirCoreTransformers`) still green (243/243).

**E2 — Refactor `ExtractorPersistenceStoreRunner.integ.test.tsx` `beforeAll` only** — ✅ **PASS**

Replaced ad-hoc bootstrap with:

```typescript
const session = new AppStackIntegrationTestSession(miroirConfig, {
  applicationDeploymentMap,
  adminDeployment,
  libraryDeploymentStorageConfiguration,
});
const executionEnvironment = await session.initSession();
domainController = executionEnvironment.domainController;
persistenceStoreControllerManager = executionEnvironment.persistenceStoreControllerManager;
localMiroirPersistenceStoreController =
  persistenceStoreControllerManager.getPersistenceStoreController(deployment_Miroir.uuid)!;
localAppPersistenceStoreController =
  persistenceStoreControllerManager.getPersistenceStoreController(deployment_Library_DO_NO_USE.uuid)!;
```

- `beforeEach` hooks: **unchanged**
- All `it()` blocks: **unchanged**
- Removed imports: `setupMiroirTest`, `createMiroirDeploymentGetPersistenceStoreController`

**E3 — Integration verification (no regressions)** — ✅ **PASS**

```bash
VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-sql.json \
VITE_MIROIR_LOG_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/specificLoggersConfig_warn.json \
npm run testByFile -w miroir-standalone-app -- ExtractorPersistenceStoreRunner.integ
```

11/11 passed (sql config). IndexedDb config not re-run in this slice.

**E4 — Cleanup (optional, not done)**

- Delete duplicate module-level `miroirAppStartup` / store section startups from the Extractor test
  file if a future session helper subsumes them (not required for Slice E).
- Document Extractor launch in `docs/reference/testing.md` (`AppStackIntegrationTestSession` vs
  `testMiroir` integ).

---

### Slice ET — ExtractorTemplate tests (`ExtractorTemplatePersistenceStoreRunner.integ.test.tsx`) — ✅ done

**Goal:** Replace ad-hoc `setupMiroirTest` / `createMiroirDeploymentGetPersistenceStoreController` /
library `createDeploymentCompositeAction` bootstrap in `beforeAll` with
`AppStackIntegrationTestSession` — **same connector and pattern as Slice E** — while keeping every
`it()` block unchanged (still
`localAppPersistenceStoreController.handleQueryTemplateActionForServerONLY` /
`localMiroirPersistenceStoreController.handleQueryTemplateActionForServerONLY`).

**Non-goals for Slice ET:**

- Migrating assertion calls to `domainController` (deferred indefinitely, as for Slice E).
- Changing `beforeEach` (`addEntitiesAndInstances` stays).
- New session / env types (reuse `AppStackIntegrationTestSession` from Slice E).

**Prerequisite:** Slice E ✅ — `AppStackIntegrationTestSession` already bootstraps Miroir + Library
deployments and returns `persistenceStoreControllerManager`.

**Implementation notes:**

| Area | As implemented |
|------|----------------|
| Session | `new AppStackIntegrationTestSession(...)` — direct construction (same as Slice E) |
| `localCache` | `domainController.getLocalCache()` after `initSession()` (for unchanged `beforeEach`) |
| Dead code | Removed unused `typedAdminConfigurationDeploymentLibrary`, shadow `ApplicationDeploymentMap` const |
| Imports removed | `setupMiroirTest`, `createMiroirDeploymentGetPersistenceStoreController`, `createDeploymentCompositeAction` |

---

**ET1 — Refactor `ExtractorTemplatePersistenceStoreRunner.integ.test.tsx` `beforeAll` only** — ✅ **PASS**

Replace:

```typescript
const {
  persistenceStoreControllerManagerForServer,
  domainControllerForClient,
  localCache: locallocalCache,
} = await setupMiroirTest(miroirConfig);
// createMiroirDeploymentGetPersistenceStoreController(...)
// createLibraryDeploymentCompositeAction(...)
```

With (mirror `ExtractorPersistenceStoreRunner.integ.test.tsx` Slice E):

```typescript
const session = new AppStackIntegrationTestSession(miroirConfig, {
  applicationDeploymentMap,
  adminDeployment,
  libraryDeploymentStorageConfiguration,
});
const executionEnvironment = await session.initSession();
domainController = executionEnvironment.domainController;
persistenceStoreControllerManager = executionEnvironment.persistenceStoreControllerManager;
localCache = domainController.getLocalCache();
localMiroirPersistenceStoreController =
  persistenceStoreControllerManager.getPersistenceStoreController(deployment_Miroir.uuid)!;
localAppPersistenceStoreController =
  persistenceStoreControllerManager.getPersistenceStoreController(deployment_Library_DO_NO_USE.uuid)!;
```

- `beforeEach` hooks: **unchanged** (`resetAndInitApplicationDeployment` + `addEntitiesAndInstances`)
- All `it()` blocks: **unchanged**
- Remove unused imports: `setupMiroirTest`, `createMiroirDeploymentGetPersistenceStoreController`,
  `createDeploymentCompositeAction` (from `beforeAll` only)

**ET2 — Integration verification (no regressions)** — ✅ **PASS**

```bash
VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-sql.json \
VITE_MIROIR_LOG_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/specificLoggersConfig_warn.json \
npm run testByFile -w miroir-standalone-app -- ExtractorTemplatePersistenceStoreRunner.integ
```

7/7 passed (sql config). IndexedDb config not re-run in this slice.

**ET3 — Cleanup (optional, not done)**

- Remove duplicate `beforeAll` boilerplate comments / dead imports.
- Align module-level startup with Extractor test file if desired (E4-style; not blocking).

---

### Slice P — PSC CRUD tests (`PersistenceStoreController.integ.test.tsx`) — ✅ done

**Goal:** Replace ad-hoc `beforeAll` bootstrap with `AppStackIntegrationTestSession` — **same
connector and pattern as Slices E / ET** — while keeping every `it()` block unchanged. Tests
continue to call:

- `localAppPersistenceStoreController.getInstances` / `.createEntity` / `.renameEntityClean` /
  `.dropEntity` / …
- `localMiroirPersistenceStoreController.getInstances` / … where used today

**Only `beforeAll` is modified.** No changes inside `describe` / `it()` / `chainVitestSteps` callbacks.

**Non-goals for Slice P (same as E / ET):**

- Migrating test calls from `localAppPersistenceStoreController` / `localMiroirPersistenceStoreController` to `domainController` (deferred indefinitely — [Appendix A](#appendix-a--deferred-psc-assertion-migration)).
- Changing `beforeEach` (`resetAndInitApplicationDeployment` stays).
- Changing `afterAll` (`deleteAndCloseApplicationDeployments` stays).
- New session / env types (reuse `AppStackIntegrationTestSession` from Slice E).

**Prerequisite:** Slices E ✅ / ET ✅ — `AppStackIntegrationTestSession` proven on both sibling test files.

---

**P1 — Refactor `PersistenceStoreController.integ.test.tsx` `beforeAll` only** — ✅ **PASS**

Replace:

```typescript
const {
  persistenceStoreControllerManagerForServer,
  domainControllerForClient,
  localCache: locallocalCache,
} = await setupMiroirTest(miroirConfig);
// createMiroirDeploymentGetPersistenceStoreController(...)
// createLibraryDeploymentCompositeAction(...)
```

With (mirror Slices E / ET):

```typescript
const session = new AppStackIntegrationTestSession(miroirConfig, {
  applicationDeploymentMap,
  adminDeployment,
  libraryDeploymentStorageConfiguration,
});
const executionEnvironment = await session.initSession();
domainController = executionEnvironment.domainController;
persistenceStoreControllerManager = executionEnvironment.persistenceStoreControllerManager;
localMiroirPersistenceStoreController =
  persistenceStoreControllerManager.getPersistenceStoreController(deployment_Miroir.uuid)!;
localAppPersistenceStoreController =
  persistenceStoreControllerManager.getPersistenceStoreController(deployment_Library_DO_NO_USE.uuid)!;
```

- `beforeEach` hooks: **unchanged**
- `afterAll` hooks: **unchanged**
- All `it()` blocks: **unchanged** — still `localAppPersistenceStoreController` / `localMiroirPersistenceStoreController`
- Remove unused imports: `setupMiroirTest`, `createMiroirDeploymentGetPersistenceStoreController`,
  `createDeploymentCompositeAction` (from `beforeAll` only)

**P2 — Integration verification (no regressions)** — ✅ **PASS**

```bash
VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-sql.json \
VITE_MIROIR_LOG_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/specificLoggersConfig_warn.json \
npm run testByFile -w miroir-standalone-app -- PersistenceStoreController.integ
```

10/10 passed (sql config). IndexedDb config not re-run in this slice.

**P3 — Cleanup (optional, partial)**

- Removed unused `localCache`, `miroirContext`, `miroirtDeploymentStorageConfiguration`, `typedAdminConfigurationDeploymentLibrary`, commented duplicate config blocks.
- Module-level startup alignment with sibling tests still optional.

---

## Appendix A — deferred PSC assertion migration

*Not part of Slices E / ET / P. Optional future work if Gap C assertion migration is pursued.*

Migrate `PersistenceStoreController.integ.test.tsx` (and eventually all `4_storage` families)
from direct PSC calls to `domainController`:

| PSC call | `domainController` equivalent |
|----------|-------------------------------|
| `getInstances(section, entityUuid)` | `handleBoxedExtractorOrQueryAction(buildGetInstancesQuery(...), ...)` |
| `createEntity(entity, entityDefinition)` | `handleCompositeAction` with `modelAction` / `"createEntity"` |
| `renameEntityClean(...)` | `handleCompositeAction` with `"renameEntity"` |
| `dropEntity(...)` | `handleCompositeAction` with `"dropEntity"` |
| `upsertInstance(...)` | `handleCompositeAction` with instance / `"updateEntity"` action |

Introduce `buildGetInstancesQuery` as a **private** test-file helper only. Remove PSC variables
from test files only after all assertion calls are migrated.

---

### Slice F — Final cleanup

**F1 — Remove `addEntitiesAndInstancesForEmulatedServer` from `tests-utils.tsx`**

After ExtractorTemplate `beforeEach` no longer calls `addEntitiesAndInstances` (future slice, not
ET), the emulated-server branch may be dead. Remove `addEntitiesAndInstancesForEmulatedServer` if
unused. The real-server branch (`addEntitiesAndInstancesForRealServer`) may still be used
elsewhere; check before removing.

**F2 — Remove or narrow `addEntitiesAndInstances`**

If both branches are gone, delete the function. If only the real-server branch remains, rename
to clarify: `addEntitiesAndInstancesForRealServer` becomes the canonical form.

**F3 — Resolve TODO comments**

- `MiroirTransformerTestTools.ts` line "TODO: BAD! stores should only be accessed through the
  domainController" — delete (resolved).
- `MiroirTestTools.ts` line "TODO: remove, use the domainController from the executionEnvironment
  instead" — delete (resolved).

---

## 5. Success criteria

### Slice T (transformer integ) — done

- [x] `miroir-standalone-app/tests/miroir-core-tests.integ.test.ts` no longer uses `initMiroirCoreTestIntegrationStore` (file deleted)
- [x] `MiroirTransformerTestTools.ts` no longer uses `PersistenceStoreDataSectionInterface` for integration tests
- [x] `MiroirTestExecutionOptions` contains no `integrationStore` field
- [x] `MIROIR_TEST_SUITES=miroirCoreTransformers MIROIR_TEST_MODE=integ` passes via `testMiroir -w miroir-standalone-app`
- [x] Legacy `miroir-core/tests/4_services/transformers.integ.test.ts` shim removed; use `testMiroir -w miroir-standalone-app`

### Slice E (Extractor setup via `AppStackIntegrationTestSession`) — done

- [x] `MiroirTestExecutionEnvironment` includes `persistenceStoreControllerManager`
- [x] `IntegrationTestSession.initSession()` returns `persistenceStoreControllerManager` (transformer path)
- [x] `AppStackIntegrationTestSession` bootstraps Miroir + Library deployments for `VITE_MIROIR_*` integ tests
- [x] `ExtractorPersistenceStoreRunner.integ.test.tsx` uses `AppStackIntegrationTestSession` in `beforeAll`; PSC variables wired from manager
- [x] Extractor `it()` bodies still call `handleBoxedQueryAction` on PSC (unchanged)
- [x] `npm run testByFile -w miroir-standalone-app -- ExtractorPersistenceStoreRunner.integ` — 11/11, no regressions
- [x] Slice T regression: `MIROIR_TEST_SUITES=miroirCoreTransformers MIROIR_TEST_MODE=integ` — 243/243

### Slice ET (ExtractorTemplate setup via `AppStackIntegrationTestSession`) — done

- [x] `ExtractorTemplatePersistenceStoreRunner.integ.test.tsx` uses `AppStackIntegrationTestSession` in `beforeAll`; PSC variables wired from manager
- [x] `localCache` obtained from `domainController.getLocalCache()` after session init (for unchanged `beforeEach`)
- [x] ExtractorTemplate `it()` bodies still call `handleQueryTemplateActionForServerONLY` on PSC (unchanged)
- [x] `beforeEach` unchanged (`addEntitiesAndInstances` retained)
- [x] `npm run testByFile -w miroir-standalone-app -- ExtractorTemplatePersistenceStoreRunner.integ` — 7/7, no regressions

### Slice P (PSC CRUD setup via `AppStackIntegrationTestSession`) — done

- [x] `PersistenceStoreController.integ.test.tsx` uses `AppStackIntegrationTestSession` in `beforeAll`; `localAppPersistenceStoreController` / `localMiroirPersistenceStoreController` wired from manager
- [x] All `it()` blocks still call `localAppPersistenceStoreController` / `localMiroirPersistenceStoreController` (unchanged — no `domainController` in test bodies)
- [x] `beforeEach` unchanged (`resetAndInitApplicationDeployment`)
- [x] `afterAll` unchanged (`deleteAndCloseApplicationDeployments`)
- [x] `npm run testByFile -w miroir-standalone-app -- PersistenceStoreController.integ` — 10/10, no regressions

### Slice F (final cleanup) — not started

See [§4 Slice F](#slice-f--final-cleanup) for steps. Checklist:

- [ ] `addEntitiesAndInstancesForEmulatedServer` removed from `tests-utils.tsx` when unused
- [ ] Gap-C TODO comments resolved in `MiroirTestTools.ts` / `MiroirTransformerTestTools.ts`

**General (all remaining slices):**

- [ ] All tests that passed before pass after each slice
- [ ] `npm run testMiroir -w miroir-standalone-app -- --suites runner_library --mode integ` stays green throughout (runner tests untouched)
