# Integration test setup — gap analysis

**Context:** On the way to solving issue #197 (run integration tests in the UI), the different
ways integration tests start up and configure themselves must be unified. This document maps the
current state and names the gaps that need to be filled before UI execution becomes viable.

---

## 1. Catalogue of integration test families

| Family | Package | Entry point / runner | Primary API |
|--------|---------|----------------------|-------------|
| **Transformer integ** | `miroir-core` | `miroir-core-tests.integ.test.ts` → `initMiroirCoreTestIntegrationStore` | `PersistenceStoreController` (direct) |
| **Storage-layer integ** | `miroir-standalone-app` / `4_storage` | per-file Vitest (`testByFile`) | `PersistenceStoreController` (direct) + `domainController` for deployment create |
| **DomainController CRUD** | `miroir-standalone-app` / `3_controllers` | per-file Vitest | `domainController` exclusively |
| **Runner integ (legacy)** | `miroir-standalone-app` / `4_view` | per-file Vitest (`Runner_Miroir.integ`, …) | `domainController` |
| **Runner integ (MiroirTest / #197)** | `miroir-standalone-app` | `miroir-runner-tests.integ.test.ts` / `testMiroir` | `domainController` via `RunnerTestSession` |
| **CLI / MCP** | `miroir-cli`, `miroir-mcp` | per-file Vitest | `domainController` via `setupMiroirPlatform` |
| **Component integ** | `miroir-core`, `miroir-standalone-app` | per-file Vitest | no `domainController` / no stores |

---

## 2. Gap A — Miroir + Admin app initialization

### Current state

Every non-component integration test that lives in `miroir-standalone-app` (DomainController
CRUD, storage-layer, runner) runs the following full initialization in `beforeAll`:

```
miroirAppStartup()
miroirCoreStartup()
<store section startups>
loadTestConfigFiles(VITE_MIROIR_* env vars)
setupMiroirTest(miroirConfig)            ← creates DomainController, RestClientStub, etc.
createDeploymentCompositeAction("miroir") ← deploys Miroir meta-application
createDeploymentCompositeAction("admin")  ← deploys Admin application
```

The CLI / MCP tests do the same through `setupMiroirPlatform`.

### Problem

When the tests run **inside the Miroir UI** (Phase B of issue #197), both the Miroir
meta-application and the Admin application are already fully started by the host
`miroirAppStartup` flow. Re-running `createDeploymentCompositeAction("miroir")` and
`createDeploymentCompositeAction("admin")` from a test is at best redundant and at worst
destructive (drops and re-seeds the live meta-model stores that the running UI depends on).

### Gap

There is no mechanism to signal "miroir + admin are already set up — skip deployment creation".
The `RunnerTestSessionInterface` (`initSession`) does not yet expose a flag or configuration
knob for this. `setupMiroirTestAndDeployMiroirApp` and `setupMiroirTestAndCreateMiroirDeployment`
unconditionally create both deployments.

### What needs to be filled

- A **`skipMiroirAndAdminDeployment`** option (or equivalent `executionEnvironment` field) passed
  into `RunnerTestSessionInterface.initSession` and propagated to
  `setupMiroirTestAndDeployMiroirApp`.
- In UI mode, `initSession` must **receive** the host `domainController` already wired by
  `miroirAppStartup` instead of constructing a fresh one; it must **not** call
  `miroirAppStartup` again.
- The session contract (`RunnerTestSessionInterface`) needs a clear split between:
  - **Adapter setup** (store registration, config loading, `DomainController` wiring) — always
    needed in CLI, never needed when embedded in the live UI.
  - **Deployment bootstrap** (create miroir + admin deployments) — needed in CLI when running
    against a blank database, never needed in the live UI.

---

## 3. Gap B — Library app setup as playfield

### Current state

Integration tests split into two groups with respect to the library application:

**Tests that deploy the library app as a playfield:**

- All `DomainController.integ.*.CRUD` tests call `resetAndInitApplicationDeployment` for the
  library deployment in `beforeAll` / `beforeEach`.
- All active runner tests (`Runner_Miroir.integ`, `miroir-runner-tests`) set up the library
  deployment via `RunnerTestSession.initSession` / `setupMiroirTestAndDeployMiroirApp`.
- `cli.integ` and `mcpTools.integ` reset and re-init the library deployment in `beforeEach`.

**Tests that do NOT deploy the library app:**

- The `4_storage` tests (`PersistenceStoreController.integ`,
  `ExtractorPersistenceStoreRunner.integ`, `ExtractorTemplatePersistenceStoreRunner.integ`)
  create and destroy a library deployment for assertion purposes but do so **within individual
  test cases**, not as a shared `beforeAll` fixture.
- The `miroir-core` transformer integ tests seed library *data* (author, book, publisher
  entities and instances) into a **synthetic, ephemeral Postgres schema** (`testApplication`)
  created directly via `PersistenceStoreController`, bypassing the real library deployment
  altogether.
- Component integ tests have no store at all.

### Problem

There is no shared contract that declares "this test suite requires a library deployment to exist
before it runs" vs "this test suite manages its own playfield". As a result:

- Tests that need the library app contain the creation / reset logic inline in their `beforeAll`
  / `beforeEach` hooks, duplicated across files.
- Tests that rely on the synthetic miroir-core schema cannot share setup helpers with tests that
  use the real library deployment — they operate on different database artefacts with different
  UUIDs and lifecycle.
- When running in the UI, the library app may or may not already be deployed (depends on the
  user's working context). The test runner needs to know which mode applies.

### Gap

- No standard `requiresLibraryDeployment: boolean` declaration on a test suite or
  `RunnerTestSession` configuration.
- No shared helper that creates the library deployment if absent and skips creation if already
  present (idempotent playfield setup).
- The `miroir-core` transformer integ store (`initMiroirCoreTestIntegrationStore`) uses an
  entirely different schema (`testApplication`) with synthetic UUIDs, making it incompatible with
  the real library deployment UUIDs used by all `miroir-standalone-app` integ tests. There is no
  bridge between these two data environments.

### What needs to be filled

- A **`playfield`** concept in `RunnerTestSessionInterface`: either an enum
  (`"none" | "libraryDeployment" | "customDeployment"`) or a flag
  `requiresLibraryDeployment: boolean`.
- A reusable helper (likely in `miroir-core`) that, given a `domainController` and
  `applicationDeploymentMap`, ensures the library deployment exists and is initialised —
  idempotent so it is safe to call both from a fresh CLI session and from the UI where the
  library deployment may already be live.
- Alignment of the miroir-core transformer integ store with the real library deployment: the
  synthetic `testApplication` schema should either be replaced by a deployment named
  consistently with the rest of the suite, or the transformer tests should declare that they
  create their own isolated playfield so the gap is documented and intentional.

---

## 4. Gap C — PersistenceStoreController as main entry instead of domainController

### Current state

#### `miroir-core` transformer integ (`initMiroirCoreTestIntegrationStore`)

Setup is entirely done through direct `PersistenceStoreController` calls:

```typescript
const persistenceStoreController = new PersistenceStoreController(adminStore, modelStore, dataStore);
await persistenceStoreController.createStore(config.admin);
await persistenceStoreController.createStore(config.model);
await persistenceStoreController.createStore(config.data);
await persistenceStoreController.open();
await persistenceStoreController.initApplication(…);
await persistenceStoreController.handleAction({ actionType: "resetModel", … }, deploymentMap);
await persistenceStoreController.handleAction({ actionType: "initModel",   … }, deploymentMap);
await persistenceStoreController.handleAction({ actionType: "createEntity",… }, deploymentMap);
await persistenceStoreController.handleAction({ actionType: "createInstance",…}, deploymentMap);
```

The `domainController` is never instantiated in this setup path. The returned
`integrationDataStore` (a raw `PersistenceStoreDataSectionInterface`) is passed directly to
`runMiroirCoreTestsFromCLI`, which then calls `MiroirTestTools.runMiroirTests`.

#### `4_storage` tests

These tests also hold direct references to `localMiroirPersistenceStoreController` and
`localAppPersistenceStoreController` and call methods like `getInstances`, `createEntity`,
`upsertInstance`, `handleBoxedQueryAction`, and `handleQueryTemplateActionForServerONLY` on them
directly — bypassing the domain layer.

### Problem

- `PersistenceStoreController` is a **server-side infrastructure** component. In a live UI
  session there is no direct access to it: all interactions go through `DomainController` →
  REST/emulated REST → `PersistenceStore`. Bypassing this path makes transformer and storage
  tests fundamentally incompatible with UI execution.
- Changes to `DomainController` dispatch or middleware (e.g. activity tracking, access control,
  event hooks) are invisible to tests that call `PersistenceStoreController` directly, leaving a
  coverage gap.
- `initMiroirCoreTestIntegrationStore` calls `PersistenceStoreController.handleAction` with raw
  action objects that include hard-coded endpoint UUIDs. Any refactoring of the action routing
  layer that happens at the `DomainController` level will not be exercised by these tests.

### What needs to be filled

- **Transformer integ tests** should be migrated to instantiate a `domainController` (via
  `setupMiroirTest` or the future `MiroirTestIntegrationOrchestrator`) and call:
  - `domainController.handleCompositeAction` with a `createDeploymentCompositeAction(…)` for
    setup, and
  - `domainController.handleCompositeAction` / `handleQueryAction` for the assertion queries
    currently done via `integrationDataStore`.
  - This mirrors exactly what the `miroir-standalone-app` DomainController CRUD and runner tests
    already do.
- **`initMiroirCoreTestIntegrationStore`** should be replaced by a call to
  `setupMiroirTest` (or the common orchestrator's `TestSessionForPostgres`) that returns a
  `domainController` instead of a raw data store.
- **`4_storage` tests**: direct calls to `localMiroirPersistenceStoreController` / 
  `localAppPersistenceStoreController` should be replaced by equivalent
  `domainController.handleCompositeAction` or query actions. If the test intent is specifically
  to exercise the persistence layer below the domain controller, that intent should be
  **explicitly stated and scoped** (e.g. a dedicated `PersistenceStoreController` unit test),
  rather than being the default pattern for integration tests.
- The `MiroirTestExecutionEnvironment` type (already sketched in the plan) must expose
  `domainController` as its primary store-access surface, with no `persistenceStoreController`
  field at the public level.

---

## 5. Gap D — Environment configuration fragmentation

### Current state

| Family | Config mechanism | Env var names |
|--------|-----------------|---------------|
| `miroir-core` transformer integ | `parseMiroirTestCliConfig` + hardcoded host default | `MIROIR_TEST_SUITES`, `MIROIR_TEST_MODE`, `MIROIR_TEST_POSTGRES_HOST` |
| `miroir-standalone-app` per-file integ | `loadTestConfigFiles(process.env)` | `VITE_MIROIR_TEST_CONFIG_FILENAME`, `VITE_MIROIR_LOG_CONFIG_FILENAME` |
| `miroir-standalone-app` `testMiroir` CLI | same `loadTestConfigFiles` + `--profile` preset | same `VITE_MIROIR_*` |
| `miroir-cli` / `miroir-mcp` | `loadMiroirCliConfig` / `loadMiroirMcpConfig` | package-local config files |

### Gap

- `miroir-core` tests use a **flat Postgres connection string** assembled inside
  `initMiroirCoreTestIntegrationStore`, independent of the `miroirConfig.test-*.json` profiles
  that govern all `miroir-standalone-app` tests.
- There is no single profile system that covers both `miroir-core` transformer integ and
  `miroir-standalone-app` integ under one `--profile` flag.
- When transformer tests migrate to `domainController` (Gap C), they will need access to a
  `miroirConfig` JSON profile — this is the natural forcing function to align on `VITE_MIROIR_*`
  / `--profile` across packages.

### What needs to be filled

- After migrating transformer tests to use `domainController`, replace the hard-coded Postgres
  string in `initMiroirCoreTestIntegrationStore` with a `miroirConfig` profile loaded via
  `loadTestConfigFiles` or the `MiroirTestIntegrationOrchestrator`.
- Align `miroir-core` CLI env var names with `VITE_MIROIR_*` (or add a compatibility shim)
  so a single CI matrix entry covers both packages.

---

## 6. Gap E — Setup helper fragmentation

### Current state

Five different public setup entry points exist across the test infrastructure:

| Helper | Package | What it creates |
|--------|---------|----------------|
| `setupMiroirTest` | `miroir-standalone-app` | `DomainController`, REST client, store manager — no deployments |
| `setupMiroirTestAndCreateMiroirDeployment` | `miroir-standalone-app` | above + miroir deployment |
| `setupMiroirTestAndDeployMiroirApp` | `miroir-standalone-app` | above + miroir + admin + library deployments |
| `setupMiroirPlatform` | `miroir-cli` / `miroir-mcp` | own orchestration via `PersistenceStoreControllerManager` |
| `initMiroirCoreTestIntegrationStore` | `miroir-core` | raw `PersistenceStoreController` + synthetic schema |

### Gap

- The hexagonal split intended by #197 places orchestration in `miroir-core` and adapters in
  packages. But `setupMiroirTest*` helpers currently live in `miroir-standalone-app` and are
  not accessible to `miroir-core` tests.
- `setupMiroirPlatform` is a separate lineage used only by CLI / MCP tests; it cannot easily
  be adapted for UI embedding.
- The `RunnerTestSessionInterface` (already defined in `miroir-core`) is the right seam, but
  only `RunnerTestSession` (standalone-app) currently implements it. `TestSessionForPostgres`
  (core) is planned but not wired to a common `MiroirTestIntegrationOrchestrator`.

### What needs to be filled

- Implement `TestSessionForPostgres` in `miroir-core` as the adapter for transformer integ
  runs, replacing `initMiroirCoreTestIntegrationStore`. It should implement
  `RunnerTestSessionInterface` and return a `domainController` from `initSession`.
- Wire both adapters (`TestSessionForPostgres` for core, `RunnerTestSession` for standalone)
  through the `MiroirTestIntegrationOrchestrator` so both test families share one lifecycle
  contract.
- Deprecate / inline the `setupMiroirTest*` ladder into `RunnerTestSession.initSession` with
  options controlling which deployments to create (addressing Gap A and Gap B simultaneously).

---

## 7. Summary table

| Gap | What is missing | Affected test families | Blocking for UI execution? |
|-----|----------------|----------------------|---------------------------|
| **A** — Miroir + Admin init | Flag to skip deployment creation when host app is already running | All `miroir-standalone-app` integ, CLI/MCP | **Yes** |
| **B** — Library playfield contract | Declarative `requiresLibraryDeployment`, idempotent setup helper, alignment of synthetic schema with real deployment UUIDs | Runner, DomainController CRUD, transformer integ | **Yes** (for runner tests) |
| **C** — PersistenceStoreController as entry | Migrate to `domainController` in transformer integ and `4_storage` tests | `miroir-core` transformer integ, `4_storage` storage tests | **Yes** |
| **D** — Env config fragmentation | Unified profile system across `miroir-core` and `miroir-standalone-app` | Transformer integ, all CLI-driven tests | Yes (after Gap C) |
| **E** — Setup helper fragmentation | `TestSessionForPostgres`, wired `MiroirTestIntegrationOrchestrator`, deprecation of ad-hoc `setupMiroirTest*` ladder | All families | Yes (enables Phase B) |

Gaps A, B, and C are the most urgent: they are direct blockers for running any integration test
family inside the Miroir UI without disrupting the live session. Gap C is also a prerequisite for
Gap D because migrating transformer tests to `domainController` is what forces alignment with the
`miroirConfig` profile system. Gap E is the architectural consolidation that ties everything
together for Phase B.
