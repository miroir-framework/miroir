# Integration test setup — gap analysis

**Context:** On the way to solving issue #197 (run integration tests in the UI), the different
ways integration tests start up and configure themselves must be unified. This document maps the
current state and names the gaps that still need to be filled before UI execution becomes viable.

**Last updated:** Gap A complete (platform host modes — see [gap-A-refactoring-plan.md](./gap-A-refactoring-plan.md)).

---

## 1. Catalogue of integration test families

| Family | Package | Entry point / runner | Setup (bootstrap) | Assertion / execution API |
|--------|---------|----------------------|-------------------|---------------------------|
| **Transformer integ** | `miroir-standalone-app` | `miroir-core-tests.integ.test.ts` → `testMiroir` | `IntegrationTestSession` (`MIROIR_TEST_*`) | `domainController.handleBoxedExtractorOrQueryAction` ✅ |
| **Storage-layer integ** | `miroir-standalone-app` / `4_storage` | per-file Vitest (`testByFile`) | `AppStackIntegrationTestSession` (`VITE_MIROIR_*`) ✅ | **`PersistenceStoreController` direct** (intentional) |
| **DomainController CRUD** | `miroir-standalone-app` / `3_controllers` | per-file Vitest | `setupMiroirTestAndCreateMiroirDeployment` | `domainController` exclusively |
| **Runner integ (legacy)** | `miroir-standalone-app` / `4_view` | per-file Vitest | `setupMiroirTest` ladder | `domainController` |
| **Runner integ (MiroirTest / #197)** | `miroir-standalone-app` | `miroir-runner-tests.integ.test.ts` / `testMiroir` | `RunnerTestSession` | `domainController` via `RunnerTestSession` |
| **CLI / MCP** | `miroir-cli`, `miroir-mcp` | per-file Vitest | `setupMiroirPlatform` | `domainController` |
| **Component integ** | `miroir-core`, `miroir-standalone-app` | per-file Vitest | none | no `domainController` / no stores |

**Takeaway:** Setup is converging on two adapters implementing `RunnerTestSessionInterface`:
`IntegrationTestSession` (transformer / `MIROIR_TEST_*`) and `AppStackIntegrationTestSession`
(`4_storage` / `VITE_MIROIR_*`). Assertion style still splits: most families use
`domainController`; `4_storage` deliberately keeps PSC-direct calls.

---

## 2. Gap A — Miroir + Admin app initialization — ✅ **Done**

**Status:** Complete — A0–A5, A8 ([gap-A-refactoring-plan.md](./gap-A-refactoring-plan.md)). A6/A7 skipped; A9 deferred to #197 Phase B.

### Outcome

Integration tests declare **host mode** and can skip destructive platform bootstrap when the live UI
already provisioned Miroir + admin:

| Mode | Use case | Bootstrap |
|------|----------|-----------|
| **`isolated`** | CLI / Vitest (default) | Full `wireEmulatedStack` + `deployMiroir` via `ensureMiroirPlatform` |
| **`embedded`** | Live UI host (advanced) | Inject `hostExecutionEnvironment`; skip `setupMiroirTest` |

**Helpers in `miroir-core` (`MiroirPlatformPlayfield.ts`):**

- `ensureMiroirPlatform` — idempotent `deployMiroir` (`createIfAbsent` | `requireExisting` | `skip`).

**Orchestrator context** (`IntegrationTestOrchestratorContext`):

- `hostMode`, `hostExecutionEnvironment`, `platformEnsureMode`, `skipBootstrapPhases`,
  `hostApplicationDeploymentMap` — forwarded by `StandaloneAppIntegrationOrchestrator` to session
  bootstrap.
- Works with Gap B `playfieldMode` / `ensureLibraryPlayfield` for library deployment.

**Session descriptors** include `defaultHostMode: "isolated"` and `embeddedCapable` (false for
`transformer`; true for app-stack kinds) for #197 UI catalog.

**#197 Phase B:** [plan.md](./plan.md) B0 still recommends **isolated Vitest subprocess** first
(fresh schema, never touch live `MiroirContext`). Embedded mode is the advanced path for attaching
to a running host without re-deploying meta-model stores.

### What was filled

- [x] `IntegrationTestHostMode` + `MiroirPlatformEnsureMode` on descriptors and orchestrator context.
- [x] `ensureMiroirPlatform` + bootstrap `deployMiroir` delegation.
- [x] Embedded host injection in `runAppStackIntegrationBootstrap`.
- [x] Orchestrator + session adapter forwarding (A3–A4).
- [ ] CLI/MCP `setupMiroirPlatform` alignment (A7 skipped).
- [ ] Module-level `miroirAppStartup` dedup (A6 skipped).

<details>
<summary>Historical context (pre–Gap A, collapsed)</summary>

### Current state (before Gap A)

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

### Problem (before Gap A)

When the tests run **inside the Miroir UI** (Phase B of issue #197), both the Miroir
meta-application and the Admin application are already fully started by the host
`miroirAppStartup` flow. Re-running `createDeploymentCompositeAction("miroir")` and
`createDeploymentCompositeAction("admin")` from a test is at best redundant and at worst
destructive (drops and re-seeds the live meta-model stores that the running UI depends on).

### Gap (before Gap A)

There is no mechanism to signal "miroir + admin are already set up — skip deployment creation".
The `RunnerTestSessionInterface` (`initSession`) does not yet expose a flag or configuration
knob for this. `setupMiroirTestAndDeployMiroirApp` and `setupMiroirTestAndCreateMiroirDeployment`
unconditionally create both deployments.

### What needed to be filled (original)

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

</details>

---

## 3. Gap B — Library app setup as playfield — ✅ **Done**

**Status:** Complete — L0–L8 ([gap-B-refactoring-plan.md](./gap-B-refactoring-plan.md)).

### Outcome

Every integration session declares its **playfield** via `IntegrationTestSessionDescriptor.playfield`
(`IntegrationTestPlayfield`: `"none"` | `"testApplication"` | `"libraryDeployment"`).

| Kind / profile | Playfield |
|----------------|-----------|
| `transformer` | `testApplication` (synthetic UUIDs — unchanged) |
| `appStackPsc`, `runner` | `libraryDeployment` |
| `domainController` + `miroirPlatform` | `none` (library lifecycle in test JSON) |
| `domainController` + `miroirAndLibrary` | `libraryDeployment` |

**Helpers in `miroir-core` (`LibraryPlayfield.ts`):**

- `ensureLibraryPlayfield` — idempotent create; wired into `runAppStackIntegrationBootstrap`
  `deployLibrary` phase.
- `resetLibraryPlayfield` — per-test reset + optional seed; adopted in `4_storage` `beforeEach`,
  runner `beforeEachTest`, undo-redo.

**Orchestrator:** `describeSession(kind)` surfaces playfield for UI catalog (#197).
`IntegrationTestOrchestratorContext.playfieldMode` (`LibraryPlayfieldEnsureMode`) forwards to
bootstrap as `libraryPlayfieldEnsureMode`. Embedded UI runs use `requireExisting` for both
`platformEnsureMode` and `playfieldMode` when the host already deployed platform + library.

**Seed constants:** `packages/miroir-standalone-app/tests/helpers/libraryPlayfieldSeeds.ts`.

### What was filled

- [x] `IntegrationTestPlayfield` on session descriptors (`describeIntegrationTestSession`).
- [x] `ensureLibraryPlayfield` + `resetLibraryPlayfield` in `miroir-core` (unit-tested).
- [x] `runAppStackIntegrationBootstrap` uses `ensureLibraryPlayfield` for `deployLibrary`.
- [x] `4_storage` / runner / undo-redo `beforeEach` hooks use `resetLibraryPlayfield`.
- [x] Orchestrator `describeSession` + `playfieldMode` for future UI launcher.
- [ ] CLI/MCP inline library reset → shared helpers (optional [L9](./gap-B-refactoring-plan.md)).

Transformer `testApplication` playfield remains separate from deployment `library` UUIDs
(documented in `docs/reference/testing.md`).

<details>
<summary>Historical context (pre–Gap B, collapsed)</summary>

Integration tests split into two groups with respect to the library application:

**Tests that deploy the library app as a playfield:**

- All `DomainController.integ.*.CRUD` tests call `resetAndInitApplicationDeployment` for the
  library deployment in `beforeAll` / `beforeEach`.
- All active runner tests (`Runner_Miroir.integ`, `miroir-runner-tests`) set up the library
  deployment via `RunnerTestSession.initSession` / `setupMiroirTestAndDeployMiroirApp`.
- `cli.integ` and `mcpTools.integ` reset and re-init the library deployment in `beforeEach`.

**Tests that use library deployment via shared session (updated after Gap C-setup):**

- All `4_storage` tests now create Miroir + **Library** deployments in `AppStackIntegrationTestSession.initSession()` (`beforeAll`), then reset library data in `beforeEach` — same deployment UUIDs as other app-stack tests.
- Transformer integ seeds library-like data into **`testApplication`** via `IntegrationTestSession` (synthetic UUIDs) — still a separate playfield from deployment `library`.

**Tests that do NOT use the real library deployment UUIDs:**

- Transformer integ (`MIROIR_TEST_*` / `testApplication` schema) — intentional isolated playfield for MiroirTest scale runs.
- Component integ tests have no store at all.

### Gap (before Gap B)

- No standard `requiresLibraryDeployment` declaration on a test suite or
  `RunnerTestSession` configuration.
- No shared helper that creates the library deployment if absent and skips creation if already
  present (idempotent playfield setup).
- The transformer integ playfield (`IntegrationTestSession` / `testApplication`) still uses
  synthetic UUIDs, separate from the real library deployment used by `VITE_MIROIR_*` tests.
  Documented and intentional unless we later align schemas.

### What needed to be filled (original)

- A **`playfield`** concept in `RunnerTestSessionInterface`: either an enum
  (`"none" | "libraryDeployment" | "customDeployment"`) or a flag
  `requiresLibraryDeployment: boolean`.
- A reusable helper (likely in `miroir-core`) that, given a `domainController` and
  `applicationDeploymentMap`, ensures the library deployment exists and is initialised —
  idempotent so it is safe to call both from a fresh CLI session and from the UI where the
  library deployment may already be live.
- Alignment of the miroir-core transformer integ store with the real library deployment: the
  synthetic `testApplication` schema remains the transformer playfield unless we explicitly
  converge profiles (optional; not required after Gap C-setup).

</details>

---

## 4. Gap C — Setup unification vs persistence-layer assertion style

Gap C was originally framed as “replace `PersistenceStoreController` as the main test entry with
`domainController` everywhere.” That conflated two separate concerns:

| Sub-gap | Topic | Status |
|---------|--------|--------|
| **C-setup** | One common **bootstrap** for integ tests (stores, deployments, session lifecycle) | **Largely solved** ✅ |
| **C-assertions** | Whether **test bodies** must call `domainController` instead of PSC | **Intentionally split** — see below |

Refactoring plan and slices: [gap-C-refactoring-plan.md](./gap-C-refactoring-plan.md).

### 4.1 C-setup — accomplished (Slices T, E, ET, P, F)

**Problem (before):** Each `4_storage` file and transformer integ duplicated
`setupMiroirTest` → `createMiroirDeploymentGetPersistenceStoreController` → library deployment
composite action. Transformer integ used a separate `initMiroirCoreTestIntegrationStore` path with
direct PSC assembly and a synthetic `testApplication` schema. Different setups made the overall
testing operation hard to control (profiles, store backends, deployment UUIDs, teardown).

**Solution (now):**

```
VITE_MIROIR_* (4_storage)                    MIROIR_TEST_* (transformer integ)
        │                                              │
        ▼                                              ▼
AppStackIntegrationTestSession              IntegrationTestSession
  setupMiroirTest (emulated HTTP)               setupMiroirDomainController (local PSC)
  Miroir + Library deployments                  testApplication + admin deployments
  returns persistenceStoreControllerManager     returns persistenceStoreControllerManager
        │                                              │
        └──────────────────┬───────────────────────────┘
                           ▼
              RunnerTestSessionInterface.initSession()
              → MiroirTestExecutionEnvironment {
                  domainController,
                  applicationDeploymentMap,
                  testApplicationUuid,
                  persistenceStoreControllerManager,
                }
```

**Files migrated to `AppStackIntegrationTestSession` in `beforeAll` only:**

- `ExtractorPersistenceStoreRunner.integ.test.tsx`
- `ExtractorTemplatePersistenceStoreRunner.integ.test.tsx`
- `PersistenceStoreController.integ.test.tsx`

**Transformer integ:** `initMiroirCoreTestIntegrationStore` removed; entry is
`miroir-standalone-app/tests/miroir-core-tests.integ.test.ts` with `IntegrationTestSession`.
Assertions use `domainController.handleBoxedExtractorOrQueryAction`.

**Helpers location:** `packages/miroir-standalone-app/tests/helpers/IntegrationTestSession.ts`
(`AppStackIntegrationTestSession` + `IntegrationTestSession`).

**Remaining setup fragmentation (not Gap C):** `3_controllers` and legacy `4_view` runner files
still use the `setupMiroirTest*` ladder directly — candidates for a future adapter or
`RunnerTestSession`-style consolidation (overlaps Gap E).

### 4.2 C-assertions — persistence tests keep PSC (by design)

**Decision:** `4_storage` integration tests **continue to call**
`localAppPersistenceStoreController` / `localMiroirPersistenceStoreController` in `it()` blocks
(`getInstances`, `createEntity`, `handleBoxedQueryAction`, `handleQueryTemplateActionForServerONLY`,
etc.). Only **`beforeAll`** was unified.

**Rationale:**

- These suites **are** persistence-layer integration tests: they validate store behaviour below
  the domain dispatch path (routing, composite actions, activity tracking are out of scope).
- Migrating them to `domainController` would change what is under test (see deferred
  [Appendix A in gap-C-refactoring-plan.md](./gap-C-refactoring-plan.md)), not just setup.
- Transformer integ already exercises the domain path at scale (243 tests via `domainController`).

**Contrast with “general” integ tests:**

| Style | Families | Test body calls |
|-------|----------|-----------------|
| **Domain-layer integ** | DomainController CRUD, runner, CLI/MCP, transformer integ | `domainController.handleCompositeAction` / `handleBoxedExtractorOrQueryAction` |
| **Persistence-layer integ** | `4_storage` | PSC methods on handles obtained from `persistenceStoreControllerManager` after common setup |

Both styles now share **the same deployment bootstrap** (`AppStackIntegrationTestSession`); they
differ only in the **assertion surface**.

### 4.3 UI execution of PSC-direct tests — open question (#197 scope?)

**Problem:** In a live UI session, application code has no direct handle to
`PersistenceStoreController`. The emulated-server Vitest path works today because `beforeAll` grabs
the **server-side** `PersistenceStoreControllerManager` while the client uses remote
`domainController` through `RestClientStub`. That only works when tests run in a **Node/Vitest
process** with the emulated stack wired up — not when test code is naïvely “embedded” in the
browser UI thread.

**How UI-triggered PSC tests *could* work (infra not built yet):**

| Approach | Idea | Fits #197 Phase B? |
|----------|------|-------------------|
| **A — Isolated Vitest subprocess (recommended near-term)** | UI spawns the same `testByFile` / `testMiroir` command in an isolated environment (separate schema / indexedDb, mutex). No change to PSC test bodies; same as CLI. | **Yes** — aligns with Phase B “never reuse live `MiroirContext`”; UI is a launcher + reporter |
| **B — Server-hosted test runner** | UI calls a backend endpoint that runs a test suite with access to the server `PersistenceStoreControllerManager` (emulated or real server). Tests still Node-side; UI shows progress via activity tracker / SSE. | **Possible** — needs runner API + session isolation (Feature 157 overlap) |
| **C — New MiroirTest execution variant** | e.g. `executionSurface: "persistenceStore"` on a suite leaf, with orchestrator wiring PSC from `executionEnvironment.persistenceStoreControllerManager`. | **Later** — schema + orchestrator work; still runs outside live UI stores if isolated |
| **D — Migrate PSC tests to domainController** | Makes UI path uniform but **changes test meaning** (C-assertions). | **Deferred** — not required for setup unification |

**Recommendation for feature #197:**

- **In scope for Phase B:** domainController-based MiroirTest integ (`runnerTest`, transformer
  integ via `testMiroir`) using approach **A** or **B** with session isolation.
- **Defer to a follow-up issue (or #197 Phase B+):** “Run `4_storage` PSC suites from UI” — document
  as launcher-only (A) first; only invest in **B/C** if product requires in-process server
  execution without a Vitest child process.

No `Test` entity variant exists today for PSC-direct suites; they are not `MiroirTest` JSON leaves
—they are Vitest files. UI surfacing would likely be a **test catalog entry** pointing at
`testByFile` filters, not a new `miroirTestType`, unless we later promote storage suites into
MiroirTest with a dedicated runner adapter.

### 4.4 Gap C — revised “what still needs to be filled”

| Item | Status |
|------|--------|
| Common setup adapter for `4_storage` (`AppStackIntegrationTestSession`) | ✅ Done |
| Common setup adapter for transformer integ (`IntegrationTestSession`) | ✅ Done |
| `MiroirTestExecutionEnvironment.persistenceStoreControllerManager` | ✅ Done |
| Migrate `4_storage` **assertions** to `domainController` | ❌ Out of scope / deferred (Appendix A) |
| UI launcher for PSC-direct Vitest suites | ❌ Not started — defer from core #197 Phase B unless explicitly scoped |
| Align `3_controllers` bootstrap with `AppStackIntegrationTestSession` | Optional follow-up (setup only) |

---

## 4 (legacy note). Original Gap C wording (superseded)

The text below described the **pre-refactor** state and an all-in `domainController` migration.
**C-setup** is done; **C-assertions** for `4_storage` was rejected in favour of PSC-direct test
bodies. Kept for historical context only.

<details>
<summary>Original Gap C problem statement (collapsed)</summary>

#### `miroir-core` transformer integ (`initMiroirCoreTestIntegrationStore`) — removed

Was entirely PSC-direct; replaced by `IntegrationTestSession` + `domainController` assertions.

#### `4_storage` tests — setup migrated; assertions unchanged

Previously duplicated `setupMiroirTest` in every file; now `AppStackIntegrationTestSession`.
Direct PSC calls in tests remain intentional (persistence-layer coverage).

</details>

---

## 5. Gap D — Environment configuration fragmentation

### Current state

| Family | Config mechanism | Env var names |
|--------|-----------------|---------------|
| `miroir-core` transformer integ | `parseMiroirTestCliConfig` + `resolveTestSessionForIntegOptionsFromEnv` | `MIROIR_TEST_SUITES`, `MIROIR_TEST_MODE`, `MIROIR_TEST_POSTGRES_HOST`, … |
| `miroir-standalone-app` per-file integ | `loadTestConfigFiles(process.env)` | `VITE_MIROIR_TEST_CONFIG_FILENAME`, `VITE_MIROIR_LOG_CONFIG_FILENAME` |
| `miroir-standalone-app` `testMiroir` CLI | same `loadTestConfigFiles` + `--profile` preset | same `VITE_MIROIR_*` |
| `miroir-cli` / `miroir-mcp` | `loadMiroirCliConfig` / `loadMiroirMcpConfig` | package-local config files |

### Gap

- Transformer integ and `4_storage` integ still use **two config surfaces**:
  `MIROIR_TEST_*` (CLI / `parseMiroirTestCliConfig`) vs `VITE_MIROIR_*` + `miroirConfig.test-*.json`
  (`loadTestConfigFiles`). Both implement `RunnerTestSessionInterface`, but profiles are not
  interchangeable without mapping.
- There is no single `--profile` flag that drives transformer integ and per-file app-stack integ
  from one CI matrix entry.
- Transformer integ still builds its Postgres playfield from `MIROIR_TEST_POSTGRES_*` env vars
  rather than reusing the same JSON profile files as emulated-server tests (optional convergence).

### What needs to be filled

- Optional: load transformer integ store config from the same `miroirConfig.test-*.json` profiles
  as `4_storage` (today `MIROIR_TEST_*` vs `VITE_MIROIR_*` remain separate but both use
  `RunnerTestSessionInterface`).
- Align env var / `--profile` UX so one CI matrix entry can drive both transformer and app-stack
  integ without duplicate host defaults.

---

## 6. Gap E — Setup helper fragmentation — ✅ **Done**

**TDD plan:** [gap-E-refactoring-plan.md](./gap-E-refactoring-plan.md) (complete).  
Gap B builds on the shared bootstrap from Gap E: [gap-B-refactoring-plan.md](./gap-B-refactoring-plan.md).

### Outcome

Integration test bootstrap is consolidated behind `RunnerTestSessionInterface` adapters and a shared
`runAppStackIntegrationBootstrap` module. A `MiroirTestIntegrationOrchestrator` port in `miroir-core`
delegates session construction to `StandaloneAppIntegrationOrchestrator` in standalone-app.

| Session class | `IntegrationTestSessionKind` | Bootstrap phases (summary) |
|---------------|------------------------------|----------------------------|
| `IntegrationTestSession` | `transformer` | Local PSC path (no emulated HTTP) |
| `AppStackIntegrationTestSession` | `appStackPsc` | wire + deployMiroir + deployLibrary |
| `DomainControllerIntegrationTestSession` | `domainController` | profile `miroirPlatform` or `miroirAndLibrary` |
| `RunnerTestSession` | `runner` | wire + deployMiroir |

Phase descriptors live in `miroir-core` (`IntegrationTestBootstrap.ts`):
`getBootstrapPhasesForSessionKind`, `getBootstrapPhasesForDomainControllerProfile`,
`describeIntegrationTestSession`.

### Migrated call sites

| Family | Session |
|--------|---------|
| `3_controllers/DomainController.integ.*.CRUD` (5 files) | `DomainControllerIntegrationTestSession` (`miroirPlatform`) |
| `DomainController.React.Model.undo-redo` | `DomainControllerIntegrationTestSession` (`miroirAndLibrary`) |
| `4_view/Runner_Miroir.integ.test.tsx` | `RunnerTestSession` |
| `miroir-core-tests.integ.test.ts` | orchestrator → `transformer` |
| `miroir-runner-tests.integ.test.ts` | orchestrator → `runner` |
| `4_storage/*.integ` | `AppStackIntegrationTestSession` (Gap C; delegates to shared bootstrap) |

### Deprecated helpers (thin wrappers retained for B2 characterization tests)

| Helper | Replacement |
|--------|-------------|
| `setupMiroirTestAndCreateMiroirDeployment` | `DomainControllerIntegrationTestSession` |
| `setupMiroirTestAndDeployMiroirApp` | `RunnerTestSession` |
| `setupMiroirTest` | **Still public** — used inside `runAppStackIntegrationBootstrap` |

### Deferred

- **Slice S** (module-level store startup deduplication) — skipped in Gap E.
- **`setupMiroirPlatform`** (CLI / MCP) — out of Gap E scope.

### Historical context (pre–Gap E)

Five different public setup entry points existed across the test infrastructure:

| Helper | Package | What it creates |
|--------|---------|----------------|
| `setupMiroirTest` | `miroir-standalone-app` | `DomainController`, REST client, store manager — no deployments |
| `setupMiroirTestAndCreateMiroirDeployment` | `miroir-standalone-app` | above + miroir deployment (**deprecated**) |
| `setupMiroirTestAndDeployMiroirApp` | `miroir-standalone-app` | above + miroir deployment for runner (**deprecated**) |
| `setupMiroirPlatform` | `miroir-cli` / `miroir-mcp` | own orchestration via `PersistenceStoreControllerManager` |
| `initMiroirCoreTestIntegrationStore` | ~~`miroir-core`~~ | **Removed** — use `IntegrationTestSession` |

---

## 7. Summary table

| Gap | What is missing | Affected test families | Blocking for UI execution? |
|-----|----------------|----------------------|---------------------------|
| **A** — Miroir + Admin init | ~~`hostMode`, `ensureMiroirPlatform`, host injection~~ | All `miroir-standalone-app` integ | **Done** ✅ — #197 Phase B launcher next |
| **B** — Library playfield contract | ~~`ensureLibraryPlayfield` / `resetLibraryPlayfield`~~ | Runner, DomainController, 4_storage | **Done** ✅ — enables Gap A `playfieldMode` |
| **C-setup** — Common integ bootstrap | ~~Unified session adapters~~ | Transformer + `4_storage` | **Done** ✅ — reduces setup chaos; UI still needs isolation (A/B) |
| **C-assertions** — PSC vs domainController in test bodies | `4_storage` keeps PSC (intentional); UI launcher for PSC Vitest suites not built | `4_storage` only | **Partial** — blocks *in-browser* PSC access; **not** a blocker if UI spawns isolated Vitest (defer to follow-up) |
| **D** — Env config fragmentation | Unified profile system (`MIROIR_TEST_*` vs `VITE_MIROIR_*`) | Transformer integ, all CLI-driven tests | Medium — no longer blocked on C-assertions |
| **E** — Setup helper fragmentation | ~~Consolidate `setupMiroirTest*`; orchestrator for UI~~ | DomainController CRUD, legacy runners | **Done** ✅ — enables Gap B / UI Phase B |

Gaps **A** and **B** (bootstrap + playfield contracts) are done. The remaining work for running
integration tests from the UI is **#197 Phase B** (launcher, session isolation, UI wiring) — see
[plan.md](./plan.md) B0–B3. Prefer **isolated Vitest subprocess** first; use **embedded** host mode
only when deliberately attaching to a live session.
**Gap C-setup** is largely solved: one common bootstrap
pattern (`RunnerTestSessionInterface` + `AppStackIntegrationTestSession` / `IntegrationTestSession`)
is available across transformer and storage families, which makes CLI testing much easier to
control even though assertion style still differs.

**Gap C-assertions** (PSC-direct `4_storage` tests) is a **product/architecture choice**, not a
setup bug. For feature **#197 Phase B**, prefer launching **domainController-based** MiroirTest
suites first; surfacing `4_storage` PSC suites from the UI can be a **follow-up** (Vitest
subprocess launcher) unless explicitly added to #197 scope.
