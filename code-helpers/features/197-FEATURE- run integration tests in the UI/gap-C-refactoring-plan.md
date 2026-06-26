# Gap C — Refactoring plan: replace PersistenceStoreController as test entry with domainController

**Parent:** [integ-test-setup-gaps.md](./integ-test-setup-gaps.md) — Gap C  
**Scope:** Three integration test families in `miroir-standalone-app/tests/4_storage` plus the
`miroir-core` transformer integ entry. The runner tests (`3_controllers`, `4_view`) and CLI/MCP
tests are already on `domainController` and are **not touched** here.

**Status:** **Slice T (transformer integ) — done.** Slices E, ET, P, F (`4_storage` PSC direct calls) — pending.

---

## 1. Impacted families

| Family | Files | Current bottom-layer API |
|--------|-------|--------------------------|
| **Transformer** | `miroir-standalone-app/tests/miroir-core-tests.integ.test.ts` + `MiroirTransformerTestTools.ts` | ~~`PersistenceStoreDataSectionInterface.handleBoxedQueryAction`~~ → `domainController.handleBoxedExtractorOrQueryAction` ✅ |
| **Extractor** | `4_storage/ExtractorPersistenceStoreRunner.integ.test.tsx` | `PersistenceStoreControllerInterface.handleBoxedQueryAction` |
| **ExtractorTemplate** | `4_storage/ExtractorTemplatePersistenceStoreRunner.integ.test.tsx` | `PersistenceStoreControllerInterface.handleQueryTemplateActionForServerONLY` |
| **PSC CRUD** | `4_storage/PersistenceStoreController.integ.test.tsx` | `PersistenceStoreControllerInterface.{createEntity, getInstances, renameEntityClean, dropEntity, upsertInstance}` |

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

### 2.2 Extractor and ExtractorTemplate tests (4_storage)

Both files share the same setup pattern; only the assertion call differs.

**Before (setup — beforeAll)**

```
setupMiroirTest(miroirConfig)
  → { domainControllerForClient, persistenceStoreControllerManagerForClient }
createMiroirDeploymentGetPersistenceStoreController(
  miroirConfig, persistenceStoreControllerManagerForClient, domainController, ...)
  → domainController.handleCompositeAction(createDeploymentCompositeAction("miroir"))
  → localMiroirPersistenceStoreController =
      persistenceStoreControllerManagerForClient.getPersistenceStoreController(deployment_Miroir.uuid)
domainController.handleCompositeAction(createDeploymentCompositeAction("library"))
localAppPersistenceStoreController =
  persistenceStoreControllerManagerForClient.getPersistenceStoreController(deployment_Library_DO_NO_USE.uuid)
```

**Before (setup — beforeEach, ExtractorTemplate only)**

```
resetAndInitApplicationDeployment(domainController, applicationDeploymentMap, ...)
addEntitiesAndInstances(
  localAppPersistenceStoreController,  ← PSC direct (emulated-server branch)
  domainController, localCache, miroirConfig, ...)
  → addEntitiesAndInstancesForEmulatedServer(localAppPersistenceStoreController, ...)
      localAppPersistenceStoreController.createEntity(entity, entityDefinition)
      localAppPersistenceStoreController.upsertInstance('model', reportBookList)
      localAppPersistenceStoreController.upsertInstance('data', instance)
```

**Before (test bodies)**

```
localMiroirPersistenceStoreController.handleBoxedQueryAction(q)          // Extractor
localAppPersistenceStoreController.handleBoxedQueryAction(q)             // Extractor
localAppPersistenceStoreController.handleQueryTemplateActionForServerONLY(q)  // ExtractorTemplate
localMiroirPersistenceStoreController.handleQueryTemplateActionForServerONLY(q) // ExtractorTemplate
```

**After (setup — beforeAll)**

```
setupMiroirTest(miroirConfig)
  → { domainControllerForClient, persistenceStoreControllerManagerForServer }
createMiroirDeploymentGetPersistenceStoreController(
  miroirConfig, persistenceStoreControllerManagerForServer, domainController, ...)
  → domainController.handleCompositeAction(createDeploymentCompositeAction("miroir"))
  (no extraction of localMiroirPersistenceStoreController)
domainController.handleCompositeAction(createDeploymentCompositeAction("library"))
  (no extraction of localAppPersistenceStoreController)
```

**After (setup — beforeEach, ExtractorTemplate)**

```
domainController.handleCompositeAction(
  resetAndinitializeDeploymentCompositeAction(
    selfApplicationLibrary.uuid,
    deployment_Library_DO_NO_USE.uuid,
    { metaModel, selfApplication, applicationModelBranch, applicationVersion },
    libraryEntitiesAndInstances,
    defaultLibraryModelEnvironment.currentModel,
  ),
  applicationDeploymentMap,
  defaultMiroirModelEnvironment,
  {},
)
// addEntitiesAndInstances removed; resetAndinitializeDeploymentCompositeAction covers it
```

**After (test bodies)**

```
domainController.handleBoxedExtractorOrQueryAction(q, applicationDeploymentMap, modelEnv)
domainController.handleQueryTemplateActionForServerONLY(q, applicationDeploymentMap, modelEnv)
```

Variables `localMiroirPersistenceStoreController` and `localAppPersistenceStoreController` are
removed from all three files. `addEntitiesAndInstances` / `addEntitiesAndInstancesForEmulatedServer`
is no longer called from these tests.

---

### 2.3 PSC CRUD tests (PersistenceStoreController.integ.test.tsx)

**Before (test bodies)**

```typescript
// query
localMiroirPersistenceStoreController.getInstances("model", entityEntity.uuid)
localAppPersistenceStoreController.getInstances("model", entityEntity.uuid)
localAppPersistenceStoreController.getInstances("data", entityAuthor.uuid)

// model DDL
localAppPersistenceStoreController.createEntity(entity, entityDefinition)
localAppPersistenceStoreController.renameEntityClean(modelActionRenameEntity)
localAppPersistenceStoreController.dropEntity(entityUuid, entityDefinitionUuid)
```

**After (test bodies)**

```typescript
// query — boxed extractor action
domainController.handleBoxedExtractorOrQueryAction(
  {
    actionType: "runBoxedQueryAction",
    endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
    payload: {
      application: selfApplicationLibrary.uuid,  // or selfApplicationMiroir.uuid
      applicationSection: "model",               // or "data"
      query: { queryType: "getEntityInstances", parentUuid: entityEntity.uuid, ... },
    },
  },
  applicationDeploymentMap,
  defaultMiroirModelEnvironment,
)

// model DDL — wrapped in handleCompositeAction
domainController.handleCompositeAction(
  {
    actionType: "compositeAction",
    actions: [
      { actionType: "modelAction", actionName: "createEntity",
        payload: { entities: [{ entity, entityDefinition }] } },
    ],
  },
  applicationDeploymentMap,
  defaultMiroirModelEnvironment,
  {},
)
```

Setup becomes identical to the Extractor family: no PSC variables extracted, only `domainController`
used. `createMiroirDeploymentGetPersistenceStoreController` is still called for the Miroir
deployment; no changes to setup helpers are needed in this migration.

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
    return { domainController, applicationDeploymentMap, testApplicationUuid };
  }

  async beforeEach(): Promise<void> {
    await initTestApplicationData(...);  // same seed sequence
  }

  async teardown(): Promise<void> {
    await domainController.handleCompositeAction(deleteDeploymentCompositeAction(...));
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

// after
type MiroirTestExecutionEnvironment = {
  domainController: DomainControllerInterface;     // required for integration
  applicationDeploymentMap: ApplicationDeploymentMap;
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
- `describe("IntegrationTestSession session lifecycle")` asserts `initSession` wires `setupMiroirDomainController`, seeds via `handleAction`, returns `{ domainController, applicationDeploymentMap, testApplicationUuid }`; `beforeEach` re-seeds; `teardown` calls `handleCompositeAction` once.

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

### Slice E — Extractor tests (ExtractorPersistenceStoreRunner.integ.test.tsx)

**E0 — Red: duplicate one `it` block to call `domainController` instead of PSC**

Pick the simplest query test (e.g. "get Miroir Entities via Extractor"). Add a parallel `it`
that calls:
```typescript
domainController.handleBoxedExtractorOrQueryAction(existingQuery, applicationDeploymentMap, defaultMiroirModelEnvironment)
```
and asserts the same expected value.

Fails only if the `domainController` path returns a different shape — highlights any routing
difference early.

**E1 — Green: verify parity, then migrate all `handleBoxedQueryAction` calls**

For each call site:
```typescript
// remove
const result = await localMiroirPersistenceStoreController.handleBoxedQueryAction(q);
// replace
const result = await domainController.handleBoxedExtractorOrQueryAction(q, applicationDeploymentMap, defaultMiroirModelEnvironment);
```
Apply the same substitution for `localAppPersistenceStoreController.handleBoxedQueryAction`.

**E2 — Clean up setup**

- In `beforeAll`: remove extraction of `localMiroirPersistenceStoreController` and
  `localAppPersistenceStoreController`.
- Remove module-level `let localMiroirPersistenceStoreController` / `let localAppPersistenceStoreController`.
- Remove `PersistenceStoreControllerInterface` from imports.
- Verify all tests still pass.

---

### Slice ET — ExtractorTemplate tests (ExtractorTemplatePersistenceStoreRunner.integ.test.tsx)

**ET0 — Red: parity test for one `handleQueryTemplateActionForServerONLY` call**

```typescript
domainController.handleQueryTemplateActionForServerONLY(q, applicationDeploymentMap, defaultMiroirModelEnvironment)
```
vs existing `localAppPersistenceStoreController.handleQueryTemplateActionForServerONLY(q)`.

**ET1 — Green: migrate all `handleQueryTemplateActionForServerONLY` calls**

Same substitution pattern as E1.

**ET2 — Migrate `beforeEach`: replace `addEntitiesAndInstances` with `resetAndinitializeDeploymentCompositeAction`**

Current:
```typescript
await addEntitiesAndInstances(
  localAppPersistenceStoreController, domainController, localCache, miroirConfig,
  deployment_Library_DO_NO_USE, applicationDeploymentMap,
  libraryEntitiesAndInstances, reportBookList,
)
```

Replacement (already used by `ExtractorPersistenceStoreRunner.integ.test.tsx`):
```typescript
await domainController.handleCompositeAction(
  resetAndinitializeDeploymentCompositeAction(
    selfApplicationLibrary.uuid,
    deployment_Library_DO_NO_USE.uuid,
    {
      dataStoreType: "app",
      metaModel: defaultMiroirMetaModel,
      selfApplication: selfApplicationLibrary,
      applicationModelBranch: selfApplicationModelBranchLibraryMasterBranch,
      applicationVersion: selfApplicationVersionLibraryInitialVersion,
    },
    libraryEntitiesAndInstances,
    defaultLibraryModelEnvironment.currentModel,
  ),
  applicationDeploymentMap,
  defaultMiroirModelEnvironment,
  {},
)
```

Verify: all `ExtractorTemplatePersistenceStoreRunner` tests pass with the new `beforeEach`.

**ET3 — Clean up**

Remove `localAppPersistenceStoreController`, `localMiroirPersistenceStoreController`,
`localCache` (if only used by `addEntitiesAndInstances`), `addEntitiesAndInstances` import.

---

### Slice P — PSC CRUD tests (PersistenceStoreController.integ.test.tsx)

This slice is the most invasive. The test body calls are more varied (DDL + queries).

**P0 — Red: parity test for `getInstances` via `domainController`**

Add a parallel `it` asserting that:
```typescript
domainController.handleBoxedExtractorOrQueryAction(
  buildGetInstancesQuery("model", entityEntity.uuid, selfApplicationMiroir.uuid),
  applicationDeploymentMap,
  defaultMiroirModelEnvironment,
)
```
returns the same instances as:
```typescript
localMiroirPersistenceStoreController.getInstances("model", entityEntity.uuid)
```

Introduce `buildGetInstancesQuery` as a local test helper (3-line function returning the
correct `RunBoxedQueryAction` payload). **Do not introduce a public helper** — inline the call or
keep the builder private to the test file.

**P1 — Green: migrate all `getInstances` calls**

Replace every `localXxxPersistenceStoreController.getInstances(section, entityUuid)` with
`domainController.handleBoxedExtractorOrQueryAction(buildGetInstancesQuery(section, entityUuid, applicationUuid), ...)`.

**P2 — Red: parity test for `createEntity` via composite action**

Add a parallel `it` that creates an entity via:
```typescript
domainController.handleCompositeAction(
  {
    actionType: "compositeAction",
    actions: [
      {
        actionType: "modelAction",
        actionName: "createEntity",
        deploymentUuid: deployment_Library_DO_NO_USE.uuid,
        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        payload: {
          entities: [{ entity, entityDefinition }],
        },
      },
    ],
  },
  applicationDeploymentMap,
  defaultMiroirModelEnvironment,
  {},
)
```
and then reads it back via the migrated `getInstances` call to assert it exists.

**P3 — Green: migrate all `createEntity` / `upsertInstance` / `renameEntityClean` / `dropEntity` calls**

Each PSC DDL call maps to a `modelAction` wrapped in `handleCompositeAction`:

| PSC call | Composite action name |
|----------|-----------------------|
| `createEntity(entity, entityDefinition)` | `"createEntity"` |
| `renameEntityClean(modelActionRenameEntity)` | `"renameEntity"` |
| `dropEntity(entityUuid, entityDefinitionUuid)` | `"dropEntity"` |
| `upsertInstance("model", instance)` | `"updateEntity"` or instance action |

**P4 — Clean up**

Remove `localMiroirPersistenceStoreController`, `localAppPersistenceStoreController`,
`persistenceStoreControllerManager` (if only used to obtain PSC references after this migration).
Remove `PersistenceStoreControllerInterface`, `PersistenceStoreControllerManagerInterface`
from imports. Remove `createMiroirDeploymentGetPersistenceStoreController` import if the PSC
extraction it provides is no longer needed (the Miroir deployment creation composite action is
enough).

---

### Slice F — Final cleanup

**F1 — Remove `addEntitiesAndInstancesForEmulatedServer` from `tests-utils.tsx`**

After Slices ET and P no longer call it, the emulated-server branch of `addEntitiesAndInstances`
is dead. Remove `addEntitiesAndInstancesForEmulatedServer`. The real-server branch
(`addEntitiesAndInstancesForRealServer`) may still be used elsewhere; check before removing.

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

### Slices E / ET / P / F — not started

- [ ] `4_storage/*.integ.test.tsx` contain no `localMiroirPersistenceStoreController` or `localAppPersistenceStoreController` variables
- [ ] `4_storage/*.integ.test.tsx` do not import `PersistenceStoreControllerInterface`
- [ ] All tests that passed before pass after each remaining slice
- [ ] `npm run testMiroir -w miroir-standalone-app -- --suites runner_library --mode integ` stays green throughout (runner tests untouched)
