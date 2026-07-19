# Feature 197 — Run integration tests in the UI

GitHub issue: TBD (`miroir-framework/miroir#197`)

**Status:** Phase A ✅ · Phase R (R0–R6) ✅ · Gaps A/B/C-setup/D/E ✅ · **Phase B ✅** (B0–B7 incl. C5 + transformer webApp manuals **2026-07-19**) · **Postponed:** B6-b3 Electron · B8 · B9 · Playwright (D10) — see [phase-b-ui-launcher-plan.md](./phase-b-ui-launcher-plan.md)

**Depends on:** [Feature 196 — MiroirTest](../196-FEATURE-migrate-tests-to-MiroirTest/plan.md) (complete)

## Overview

Runner integration tests live in `miroir-standalone-app` as imperative Vitest files (`Runner_Miroir.integ.test.tsx`, `Runner_Library.ts`, `RunnerIntegTestTools.tsx`) and as MiroirTest JSON suites (`miroirTest_runner_library`). Legacy files still use `RunnerTestParams` + `it.each`; the MiroirTest pilot uses `runnerTest` leaves via `testMiroir`. Both paths share `RunnerTestSession` bootstrap (Gap E).

**Near-term goal (Phase A):** Extend `MiroirTest` with a `runnerTest` leaf, encode a minimal `libraryLendBookRunnerTest`, and run it via:

```bash
VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-sql.json \
VITE_MIROIR_LOG_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/specificLoggersConfig_DomainController_debug.json \
npm run testMiroir -w miroir-standalone-app -- --suites runner_library --mode integ
```

**Refactor goal (Phase R, green):** Replace the Phase A **TypeScript fixture bridge** with **transformer-based indirection** (`getFromParameters`, `getFromContext`) and a **standard injected parameter bank** — same pattern as Reports / Transformers. No new failing tests; each slice keeps `runner_library` green.

**Later goal (Phase B — done):** Run the same suites from the Miroir UI inside a **data-isolated test run** (ephemeral application + temp stores, setup/teardown per run — not a separate OS process), with an exploratory troubleshooting view — without polluting the user's working UI session. Full plan: [phase-b-ui-launcher-plan.md](./phase-b-ui-launcher-plan.md). Optional leftovers (Electron, B8/B9, Playwright) remain **postponed** there.

Constraints:

- UUID v4 only for new deployment instances
- TDD throughout
- Keep execution logic **centralized in `miroir-core`**; `miroir-standalone-app` owns vitest entry, config files, and UI wiring
- Reuse existing primitives: `testBuildPlusRuntimeCompositeActionSuiteForRunner`, `CompositeRunTestAssertion`, session adapters (`RunnerTestSession`, …) built on `runAppStackIntegrationBootstrap`
- Do **not** delete legacy `Test` entity / `Runner_*.integ.test.tsx` files until cutover is proven

---

## Current state

Bootstrap/orchestrator state is documented in [integ-test-setup-gaps.md](./integ-test-setup-gaps.md). Summary below reflects post–Gap A/B/C-setup/E reality.

### Integration test infrastructure (shared)

All non-component integration tests in `miroir-standalone-app` converge on `RunnerTestSessionInterface` adapters created by `StandaloneAppIntegrationOrchestrator` (`MiroirTestIntegrationOrchestrator` port in `miroir-core`).

| Session class | Kind | Entry point | Config surface | Playfield |
|---------------|------|-------------|----------------|-----------|
| `IntegrationTestSession` | `transformer` | `miroir-core-tests.integ.test.ts` | `MIROIR_TEST_*` or `--profile` | `testApplication` (synthetic UUIDs) |
| `AppStackIntegrationTestSession` | `appStackPersistenceStoreController` | per-file `4_storage` integ | `VITE_MIROIR_*` or `--profile` | `libraryDeployment` |
| `DomainControllerIntegrationTestSession` | `domainController` | `3_controllers` CRUD, undo-redo | `VITE_MIROIR_*` or `--profile` | profile-dependent |
| `RunnerTestSession` | `runner` | `Runner_Miroir.integ`, `miroir-runner-tests.integ.test.ts` | `VITE_MIROIR_*` or `--profile` | `libraryDeployment` |

**Orchestrator context** (Gap A/B — ready for Phase B UI launcher):

- `hostMode`: `"isolated"` (fresh bootstrap stack — data isolation; CLI default) | `"embedded"` (inject live host env)
- `hostExecutionEnvironment`, `platformEnsureMode`, `playfieldMode`, `skipBootstrapPhases`
- Helpers: `ensureMiroirPlatform`, `ensureLibraryPlayfield`, `resetLibraryPlayfield`

**Execution flow (MiroirTest runner path):**

```mermaid
sequenceDiagram
  participant V as Vitest entry
  participant O as StandaloneAppIntegrationOrchestrator
  participant S as RunnerTestSession
  participant MT as MiroirTestTools
  participant RT as RunnerTestTools
  participant DC as DomainController

  V->>O: createSession("runner", context)
  O->>S: initSession → MiroirTestExecutionEnvironment
  S->>S: beforeEach → resetLibraryPlayfield
  V->>MT: runMiroirTestsFromCLI (runner_library)
  MT->>RT: build suite from leaf + runRunnerTestCompositeAction
  RT->>DC: testBuildPlusRuntimeCompositeActionSuite
```

**Bootstrap gaps:** A/B/C-setup/D/E complete ✅ ([integ-test-setup-gaps.md](./integ-test-setup-gaps.md)). Unified `--profile` across transformer, runner, and `testByFile` — [Gap D](./gap-D-refactoring-plan.md) ✅.

### MiroirTest runner track (Phase A — complete)

| Piece | Location | Role |
|-------|----------|------|
| Entity + `runnerTest` leaf | `entityMiroirTest` schema | Unified test concept with runner dispatch |
| Runner dispatch | `miroir-core/src/5_tests/RunnerTestTools.ts` | `runMiroirRunnerTest`, `runRunnerTestCompositeAction` (R5: drop `resolveRunnerTestLeaf` indirection) |
| Orchestrator | `miroir-core/src/5_tests/MiroirTestIntegrationOrchestrator.ts` | Port + `IntegrationTestOrchestratorContext` |
| Factory | `standalone-app/.../StandaloneAppIntegrationOrchestrator.ts` | Session kind → adapter |
| CLI | `standalone-app/scripts/test-miroir-runner.ts` | `--suites`, `--mode`, `--filter`, `--profile` |
| Transformer integ CLI | same script → `miroir-core-tests.integ.test.ts` | `MIROIR_TEST_*` or `--profile` |
| Runner integ CLI | same script → `miroir-runner-tests.integ.test.ts` | `VITE_MIROIR_*` or `--profile` |
| App-stack integ | `test-by-file.ts` | `VITE_MIROIR_*` or `--profile` |
| Pilot instance | `miroirTest_runner_library` in deployment-library | lend + return `runnerTest` leaves (**inline JSON**, no `fixtureRef`) |
| Ref registry (interim) | ~~`runnerTestFixtures.ts`~~ **deleted R6** → `runnerLibraryTestRegistry.ts` |

**Still open for #197:** Phase B **optional postponed** leftovers only (Electron emulated, B8/B9, Playwright) — [phase-b-ui-launcher-plan.md](./phase-b-ui-launcher-plan.md) §7. Phase R complete ✅ ([r6-suite-scoped-context-plan.md](./r6-suite-scoped-context-plan.md)). UI runs **domainController-based** MiroirTest integ (`runnerTest` + `transformerTest`); PersistenceStoreController-direct `4_storage` suites remain deferred (B9 postponed — see [Out of scope](#out-of-scope)).

**Action integ → MiroirTest:** Data CRUD pilot on `actionTest` (`domain_controller_data_crud` in **deployment-miroir**; Library is `runTarget` only). Imperative `DomainController.integ.Data.CRUD.test.tsx` is **deprecated** but kept green until full replacement. Plan: [action-integ-miroirtest-migration-plan.md](./action-integ-miroirtest-migration-plan.md).

### Legacy imperative runner files (not yet on MiroirTest JSON)

| Piece | Location | Role |
|-------|----------|------|
| Test definitions | `tests/4_view/Runner_Library.ts` | `RunnerTestParams` objects — parity reference for Phase R |
| Vitest harness | `tests/4_view/Runner_Miroir.integ.test.tsx` | `RunnerTestSession` + `it.each` over params (harness migrated, G8) |
| Setup helpers | `tests/4_view/RunnerIntegTestTools.tsx` | thin wrappers; `beforeEach` → `resetLibraryPlayfield` |
| Suite builder | `miroir-core/src/1_core/Runner.ts` | `testBuildPlusRuntimeCompositeActionSuiteForRunner` |

Per G8: deprecate per-file as MiroirTest equivalents land; delete harness only after **all** `Runner_*` integ files migrate.

### Legacy parallel: `Test` entity (Feature 195 note)

The `Test` entity (`d2842a84-…`) already models `testBuildPlusRuntimeCompositeActionSuite` integration tests. Runner tests **reuse the same runtime action types** but are **not** stored as `Test` instances. Feature 197 deliberately migrates runner coverage onto `MiroirTest` for a single CLI/UI surface — not onto legacy `Test`.

---

## Problem statement

1. **Representation:** Most `RunnerTestParams` coverage is still TypeScript-only; pilot `runner_library` is on MiroirTest JSON — remaining `Runner_*` files not yet migrated (G8).
2. **Duplication:** Startup/lifecycle duplication **reduced** (Gap E) via shared session adapters; legacy files still repeat vitest entry boilerplate until full MiroirTest cutover.
3. **Environment coupling:** Bootstrap is hexagonal and UI-ready (Gaps A/B/E); Phase B **core** wires the **UI launcher** to the orchestrator with session isolation (done — see [phase-b-ui-launcher-plan.md](./phase-b-ui-launcher-plan.md)).
4. **Mode split:** Feature 196 UI ran MiroirTest in `executionMode: "unit"` only. Runner/transformer integ now have a guarded UI path (Phase B B5–B7 + [ui-unit-vs-integ-run-context-plan.md](./ui-unit-vs-integ-run-context-plan.md)).

---

## Locked decisions (grill session)

| # | Decision | Locked |
|---|----------|--------|
| G1 | **Leaf type** | **A** — new `miroirTestType: "runnerTest"` on `MiroirTest` (not legacy `Test` entity) |
| G2 | **Instance home** | **A** — `miroir-test-app_deployment-library` (`model` section). `MiroirTest` is a Miroir meta-entity (`a311f363-…`); any application (library, admin, …) may host instances like Reports, Menus, Queries |
| G3 | **JSON vs fixtures (pilot)** | **A** — minimal refs in JSON; heavy payloads in fixture catalog **as interim bridge** |
| G3b | **Param/context resolution (direction)** | Prefer general-purpose `getFromParams` / `getFromContext` transformers over test-specific hard-coded values; tests/queries/runners share a **standard injected execution environment** they reference; intermediate values built during run via `getFromContext` (same as Transformers/Reports). Phase A: ground prep + pilot on fixture bridge; no big-bang unless one-step is simpler |
| G4 | **`testMiroir` script home** | **A** — `miroir-standalone-app` owns the vitest entry script and external layers; **orchestration + shared setup/teardown infrastructure in `miroir-core`** (hexagonal: core orchestrates, packages inject adapters) |
| G5 | **Environment profile selection** | **C** — env vars for CI/explicit override (`VITE_MIROIR_*`, `MIROIR_TEST_*`); `--profile` on `testMiroir` / `testByFile` sets both surfaces from one catalog ([Gap D](./gap-D-refactoring-plan.md) ✅) |
| G6 | **Phase B UI placement** | **A** — extend existing Miroir Tests menu/reports; mode badge (`unit` / `integ`); integ run behind session guard on `RunMiroirTestSuiteButton` |
| G7 | **Headless runner execution** | **A** — extract `runRunnerTestCompositeAction` to `miroir-core`; `RunnerTestTools` + orchestrator call it; `tests-utils` thin re-export for legacy |
| G8 | **Legacy `Runner_*` deprecation** | **B** — deprecate per-file as suites migrate; delete harness only after **all** `Runner_*` integ files have `MiroirTest` equivalents |

## Additional locked decisions (implicit from grill)

| # | Decision |
|---|----------|
| 2 | `runnerTest` leaves run **only** in `executionMode: "integration"`; unit mode throws or skips |
| 3 | `runnerTest` delegates to `testBuildPlusRuntimeCompositeActionSuiteForRunner` |
| 5 | JSON uses `runnerRef`, `fixtureRef`, `environmentRef` resolved at runtime |
| 10 | Phase A pilot: `libraryLendBookRunnerTest` + `libraryReturnBookRunnerTest` in `runner_library` ✅ |
| R0 | **Refactor first slice:** `initialModel` in fixtures → `getFromParameters` transformer; value from injected param bank |
| R-end | **Refactor end state:** no hard-coded fixture payloads; declarative runner tests + environment param injection only |

---

## Target schema

### Standard execution environment (target direction)

Tests, queries, and runners should share one **injected execution environment** per run — analogous to `functionCallTest.environmentRef` and `queryTest.fixtureRef` today, but extended for full-stack integration.

**Implemented today** (`MiroirTestExecutionEnvironment` in `MiroirTestTools.ts`):

```typescript
{
  domainController: DomainControllerInterface,
  applicationDeploymentMap: ApplicationDeploymentMap,
  testApplicationUuid: string,
  persistenceStoreControllerManager: PersistenceStoreControllerManagerInterface,
  runnerTestContext?: RunnerTestContext,  // testParams + runtimeContext for runner leaves
}
```

**Target direction** (Phase R — extend runner context / orchestrator injection):

```typescript
// Target: fuller injected environment per vitest session / UI session
{
  miroirConfig: MiroirConfigClient,
  domainController: DomainControllerInterface,
  applicationDeploymentMap: ApplicationDeploymentMap,
  modelEnvironment: MiroirModelEnvironment,
  testParams: Record<string, unknown>,   // e.g. user1, book1, deployment uuids
  runtimeContext: Record<string, unknown>,
}
```

**Resolution pattern (align with Transformers/Reports):**

| Mechanism | Use |
|-----------|-----|
| `getFromParams` + `referencePath` | Runner payloads, query inputs — pull from injected `testParams` |
| `getFromContext` + `referencePath` | Assertions on named preTest results (`LendingHistoryList`, …) |
| `environmentRef` on leaf | Select which standard environment profile seeds `testParams` |

Existing `libraryLendBookRunnerTest` already uses `getFromContext` in assertions (`referencePath: ["LendingHistoryList", "items"]`). Phase A should **preserve** that; Phase A+ should migrate **payload UUIDs** (`user1.uuid`, `book1.uuid`) from fixture literals toward `getFromParams` references into the injected environment.

### `MiroirTestForRunner` leaf (new)

```typescript
{
  miroirTestType: "runnerTest",
  miroirTestLabel: string,
  skip?: boolean,
  testTag?: string | string[],

  // Standard environment (pilot: fixtureRef seeds testParams; target: environmentRef)
  environmentRef?: string,              // e.g. "libraryRunnerTestEnvironment"
  runnerRef: string,                    // e.g. "lendDocument"
  fixtureRef?: string,                  // interim: "libraryLendBookDefaults" (Phase A bridge)
  deploymentRef?: string,               // e.g. "libraryTestIdentifiers"

  testCompositeActionLabel?: string,
  // Target: testParams use getFromParams transformers; pilot may defer to fixtureRef
  testParams?: Record<string, unknown>,
  preTestCompositeActions?: CompositeAction[],
  preRunnerCompositeActions?: CompositeAction[],
  testCompositeActionAssertions?: CompositeRunTestAssertion[],

  skipCreateDeployment?: boolean,
  skipDropDeployment?: boolean,
}
```

### Fixture catalog — interim bridge (Phase A)

New `miroir-test-app_deployment-library/src/runnerTestFixtures.ts`:

```typescript
export const runnerTestFixtureCatalog = {
  libraryTestIdentifiers: { testApplicationUuid, testApplicationDeploymentUuid, ... },
  libraryRunnerTestEnvironment: () => ({
    testParams: { user1: user1.uuid, book1: book1.uuid, ... },
    initialModel: defaultLibraryAppModel,
    deploymentRef: "libraryTestIdentifiers",
  }),
  libraryLendBookDefaults: {
    runner: lendDocument,
    // interim: literal testParams; migrate to getFromParams referencing environment.testParams
    preTestCompositeActions: [ /* fetchLendingHistory → nameGivenToResult: LendingHistoryList */ ],
    testCompositeActionAssertions: [ /* getFromContext on LendingHistoryList */ ],
  },
};
```

**Minimal encoding (G3):** JSON leaf holds `runnerRef` + `fixtureRef` (+ optional `environmentRef`); catalog resolves to `TestCompositeActionParams` via injected environment.

**Ground prep (no big-bang):** Phase A defines `RunnerTestExecutionEnvironment` type, wires `environmentRef` resolution stub (can alias `fixtureRef` initially), documents `getFromParams` migration path for `testParams`. Full param indirection is a follow-up slice inside Phase A or early Phase B.

### MiroirTest instances across applications

`MiroirTest` is defined in the Miroir meta-application (`entityMiroirTest`, `a311f363-e238-4203-bdfc-29e8c160c26b`). Instances are **not** confined to `deployment-miroir`: any application may store them in its `model` section, same pattern as Reports, Menus, Queries. Core transformer/query pilots live under `deployment-miroir`; runner pilots live under `deployment-library` because they exercise library runners and fixtures.

### Pilot instance sketch

```json
{
  "uuid": "<v4>",
  "parentUuid": "a311f363-e238-4203-bdfc-29e8c160c26b",
  "name": "runner_library",
  "selfApplication": "<library-application-uuid>",
  "definition": {
    "miroirTestType": "miroirTestSuite",
    "miroirTestLabel": "runner.library",
    "miroirTests": [
      {
        "miroirTestType": "runnerTest",
        "miroirTestLabel": "Lend Book Test Composite Action",
        "environmentRef": "libraryRunnerTestEnvironment",
        "runnerRef": "lendDocument",
        "fixtureRef": "libraryLendBookDefaults"
      }
    ]
  }
}
```

---

## Architecture (current + Phase B target)

### Hexagonal split: orchestration in core, adapters in packages

```mermaid
flowchart TB
  subgraph standalone [miroir-standalone-app — external layers]
    SCRIPT[scripts/test-miroir.ts]
    ENTRY_X[miroir-core-tests.integ.test.ts]
    ENTRY_R[miroir-runner-tests.integ.test.ts]
    ORCH_SA[StandaloneAppIntegrationOrchestrator]
    ADAPT_XFORM[IntegrationTestSession]
    ADAPT_PSC[AppStackIntegrationTestSession]
    ADAPT_DC[DomainControllerIntegrationTestSession]
    ADAPT_RUN[RunnerTestSession]
    STARTUP[miroirAppStartup + store sections + configs]
  end

  subgraph core [miroir-core — orchestration]
    ORCH[MiroirTestIntegrationOrchestrator port]
    BOOT[IntegrationTestBootstrap + runAppStackIntegrationBootstrap]
    PLAT[MiroirPlatformPlayfield / LibraryPlayfield]
    MT[MiroirTestTools.ts]
    RT[RunnerTestTools.ts]
    PORT[RunnerTestSessionInterface]
  end

  subgraph deploy [deployment-library]
    INST[miroirTest_runner_library]
    FIX[runnerTestFixtures.ts]
  end

  SCRIPT --> ENTRY_X
  SCRIPT --> ENTRY_R
  ENTRY_X --> ORCH_SA
  ENTRY_R --> ORCH_SA
  ORCH_SA --> ORCH
  ORCH --> PORT
  ADAPT_XFORM --> PORT
  ADAPT_PSC --> PORT
  ADAPT_DC --> PORT
  ADAPT_RUN --> PORT
  BOOT --> ADAPT_PSC
  BOOT --> ADAPT_RUN
  PLAT --> BOOT
  STARTUP --> ADAPT_RUN
  ENTRY_R --> MT
  MT --> RT
  RT --> FIX
```

| Layer | Package | Responsibility |
|-------|---------|----------------|
| **Port** | `miroir-core` | `RunnerTestSessionInterface`: `initSession`, `beforeEach`, `teardown` → `MiroirTestExecutionEnvironment` |
| **Orchestrator** | `miroir-core` | `MiroirTestIntegrationOrchestrator` + `IntegrationTestOrchestratorContext` (`hostMode`, `playfieldMode`, …) |
| **Factory** | `miroir-standalone-app` | `StandaloneAppIntegrationOrchestrator` — maps session kind → adapter |
| **Session adapters** | `miroir-standalone-app` | `IntegrationTestSession`, `AppStackIntegrationTestSession`, `DomainControllerIntegrationTestSession`, `RunnerTestSession` |
| **Bootstrap** | `miroir-core` | `runAppStackIntegrationBootstrap`, `ensureMiroirPlatform`, `ensureLibraryPlayfield`, `resetLibraryPlayfield` |
| **Vitest script** | `miroir-standalone-app` | `test-miroir.ts` + entry files; passes orchestrator context into session adapters |

**Goal (met for CLI):** transformer, storage, domain-controller, and runner integ share the same orchestrator port and teardown contract. **Phase B** adds an **in-browser async UI launcher** that reuses this stack with **data-isolated** runs (`hostMode: "isolated"`), optional `embedded` for advanced host attachment — see [phase-b-ui-launcher-plan.md](./phase-b-ui-launcher-plan.md) ([Gap A](./integ-test-setup-gaps.md#2-gap-a--miroir--admin-app-initialization--done)).

---

## Developer quick reference

| Area | Path |
|------|------|
| Schema evolution | `entityDefinitionMiroirTest` + `getMiroirFundamentalJzodSchema` |
| Runner leaf dispatch | `packages/miroir-core/src/5_tests/RunnerTestTools.ts` |
| Integration port + orchestrator | `packages/miroir-core/src/5_tests/MiroirTestIntegrationOrchestrator.ts` |
| Bootstrap phases + session descriptors | `packages/miroir-core/src/5_tests/IntegrationTestBootstrap.ts` |
| Platform / library playfield | `MiroirPlatformPlayfield.ts`, `LibraryPlayfield.ts` |
| Standalone factory | `packages/miroir-standalone-app/tests/helpers/StandaloneAppIntegrationOrchestrator.ts` |
| Session adapters | `packages/miroir-standalone-app/tests/helpers/IntegrationTestSession.ts` |
| Runner adapter | `packages/miroir-standalone-app/tests/helpers/RunnerTestSession.ts` |
| Fixture catalog (Phase A bridge) | `packages/miroir-test-app_deployment-library/src/runnerTestFixtures.ts` |
| Param bank / environment seeds | `RUNNER_TEST_ENVIRONMENT_REFS` in fixture catalog → `RunnerTestContext.testParams` |
| Pilot instance | `miroir-test-app_deployment-library/assets/.../miroirTest_runner_library.json` |
| Standalone registry | `packages/miroir-standalone-app/tests/helpers/miroirRunnerTestSuiteRegistry.ts` |
| Vitest entries | `miroir-core-tests.integ.test.ts` (transformer), `miroir-runner-tests.integ.test.ts` (runner) |
| Gap analysis (bootstrap state) | [integ-test-setup-gaps.md](./integ-test-setup-gaps.md) |
| Config files | `tests/miroirConfig.test-emulatedServer-sql.json`, `tests/specificLoggersConfig_*.json` |

### Commands

```bash
# Unified profile — transformer + runner (recommended)
npm run testMiroir -w miroir-standalone-app -- \
  --profile emulatedServer-sql --suites miroirCoreTransformers --mode integ

npm run testMiroir -w miroir-standalone-app -- \
  --profile emulatedServer-sql --suites runner_library --mode integ

# App-stack integ with same profile
npm run testByFile -w miroir-standalone-app -- \
  --profile emulatedServer-sql PersistenceStoreController.integ

# Explicit env (CI / debugging — overrides profile when set)
VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-sql.json \
VITE_MIROIR_LOG_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/specificLoggersConfig_DomainController_debug.json \
npm run testMiroir -w miroir-standalone-app -- --suites runner_library --mode integ

MIROIR_TEST_SUITES=miroirCoreTransformers MIROIR_TEST_MODE=integ \
  MIROIR_TEST_POSTGRES_HOST=localhost \
  npm run testMiroir -w miroir-standalone-app

# Filter single leaf (suite label runner.library — not registry key runner_library)
npm run testMiroir -w miroir-standalone-app -- --suites runner_library --mode integ --profile emulatedServer-sql \
  --filter '{"runner.library":["Return Book Test Composite Action"]}'

# Shorthand: leaf label as sole key (values ignored) when suite has flat leaves
npm run testMiroir -w miroir-standalone-app -- --suites runner_library --mode integ --profile emulatedServer-sql \
  --filter '{"Return Book Test Composite Action":["*"]}'

# Legacy imperative path (harness on RunnerTestSession; not MiroirTest JSON — G8)
npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-sql Runner_Miroir.integ
```

**Profile resolution order:** explicit `VITE_MIROIR_*` / `MIROIR_TEST_*` env vars win → else `--profile` (catalog in `integrationTestProfiles.ts`) → else built-in defaults (local only; CI fail-fast — see launch validation). Full reference: [docs/reference/testing.md](../../../docs/reference/testing.md#integration-test-profiles).

---

## Phases

### Phase A — `runnerTest` leaf + CLI pilot (near-term)

#### A0 — Schema & types (TDD)

**Red:**

- `miroirTest.schema.unit.test.ts`: `miroirTestForRunner` parses minimal leaf
- `MiroirTestTools`: unknown leaf still exhausts; add failing case for `runnerTest` dispatch

**Green:**

- Extend `entityDefinitionMiroirTest` with `miroirTestForRunner` context key (distinct from legacy `Test`)
- Regenerate `miroirFundamentalType.ts` / jzod schema
- Export types from `miroir-core`

#### A1 — `RunnerTestTools` (TDD)

**Red:**

- `runnerTest.tools.unit.test.ts`: resolve `fixtureRef` + `runnerRef` → `TestCompositeActionParams`
- `miroirTestTools.unit.test.ts`: `runnerTest` in unit mode throws clear error

**Green:**

- `RunnerTestTools.ts`:
  - `resolveRunnerTestLeaf(leaf, fixtureCatalog, environment) → TestCompositeActionParams`
  - `runRunnerTestCompositeAction(domainController, params, applicationDeploymentMap, activityTracker, …)` — **headless**, extracted from `tests-utils.runTestOrTestSuite` (G7)
  - `runMiroirRunnerTestInMemory(vitest, leaf, executionEnvironment, …)` → resolve leaf + call `runRunnerTestCompositeAction`
- Wire `case "runnerTest"` in `MiroirTestTools.runMiroirTestInMemory` (integration only)
- Export `runRunnerTestCompositeAction` from `miroir-core`; `tests-utils.tsx` re-exports for legacy integ files

#### A2 — Shared integration orchestrator (TDD) ✅

**Red:**

- `miroirTestIntegrationOrchestrator.unit.test.ts`: mock port → `initSession` / `beforeEach` / `teardown` called in order
- `runnerIntegAdapter.unit.test.ts` (standalone-app): adapter implements port contract

**Green (miroir-core):** ✅

- `RunnerTestSessionInterface` — `initSession` → `MiroirTestExecutionEnvironment`; `beforeEach`; `teardown`
- `MiroirTestExecutionEnvironment` — shared shape for transformer + runner (`domainController`, `applicationDeploymentMap`, `testApplicationUuid`, `persistenceStoreControllerManager`, optional `runnerTestContext`)
- `MiroirTestIntegrationOrchestrator` port + `IntegrationTestOrchestratorContext` (`hostMode`, `playfieldMode`, `platformEnsureMode`, …)
- `IntegrationTestBootstrap.ts` — session kinds, phase descriptors, `describeIntegrationTestSession`

**Green (standalone-app):** ✅

- `StandaloneAppIntegrationOrchestrator` — factory for all session kinds
- `IntegrationTestSession` (transformer), `AppStackIntegrationTestSession`, `DomainControllerIntegrationTestSession`, `RunnerTestSession`
- `RunnerTestSession`: shared bootstrap via `runAppStackIntegrationBootstrap`; per-test `resetLibraryPlayfield` (Gap B)
- `RunnerIntegTestTools.tsx` — thin wrapper; legacy `Runner_Miroir.integ` uses `RunnerTestSession` directly
- Transformer integ entry: `miroir-core-tests.integ.test.ts` (moved from miroir-core; `initMiroirCoreTestIntegrationStore` removed — Gap C)

**Also completed (Gap A/B/E — see [integ-test-setup-gaps.md](./integ-test-setup-gaps.md)):**

- `ensureMiroirPlatform`, `ensureLibraryPlayfield`, `resetLibraryPlayfield`
- Legacy `Runner_Miroir.integ`, `3_controllers` CRUD, `4_storage` migrated to session adapters

**Ground prep (optional stretch):**

- One pilot `testParams` field via `getFromParams`; `resolveRunnerTestEnvironment(environmentRef)` seeds `testParams` namespace → deferred to Phase R

#### A3 — Pilot instance + fixture catalog

**Green:**

- `runnerTestFixtures.ts` with `libraryTestIdentifiers`, `libraryLendBookDefaults`
- `miroirTest_runner_library` JSON instance (UUID v4)
- Export from `miroir-test-app_deployment-library/index.ts`
- `miroirRunnerTestSuiteRegistry.ts` with key `runner_library`

#### A4 — Standalone vitest entry + `testMiroir` script

**Green:**

- Add `"testMiroir": "tsx ./scripts/test-miroir.ts"` to `miroir-standalone-app/package.json`
- `scripts/test-miroir-runner.ts` — routes core vs runner integ; applies `--profile` before Vitest spawn
- Profile catalog: `tests/helpers/integrationTestProfiles.ts`
- `miroir-runner-tests.integ.test.ts`:
  - `miroirAppStartup()` + store section startups (same as `Runner_Miroir.integ`)
  - `initMiroirRunnerTestEnvironment()`
  - `runMiroirTestsFromCLI(config, { runnerTestEnvironment })`
- Vitest entry constructs `RunnerTestSession` and passes to `MiroirTestIntegrationOrchestrator` / `runMiroirTestsFromCLI`
- Extend `MiroirTestExecutionOptions` with `executionEnvironment` from orchestrator

**Verify:**

```bash
# Must pass with same assertions as legacy libraryLendBookRunnerTest
npm run testMiroir -w miroir-standalone-app -- --suites runner_library --mode integ
```

#### A5 — Parity check + docs

- Side-by-side run: legacy `Runner_Miroir.integ` vs new `testMiroir` — same pass/fail
- Update `docs/guides/developer/testing.md` with runner integ section
- Legacy `Runner_Miroir.integ`: harness on `RunnerTestSession` (Gap E); **still imperative** — not migrated to MiroirTest JSON (G8)
- Add parity comment in `Runner_Library.ts` pointing to `miroirTest_runner_library` (no `@deprecated` until cutover batch)

#### Phase A — completion notes

- `runnerTest` schema + `RunnerTestTools` + orchestrator + `testMiroir` in standalone-app ✅
- `miroirTest_runner_library` with lend + return leaves ✅
- Shared bootstrap: Gaps A/B/C-setup/E — four session kinds, orchestrator port, playfield helpers ✅
- Return fixture adds `preRunnerCompositeActions: [lendBookPreRunner]` (fix missing in legacy `Runner_Library.ts`)
- Fixture catalog path: `miroir-test-app_deployment-library/src/runnerTestFixtures.ts`

---

### Phase R — Transformer-based refactor (green, before Phase B)

**Principle:** Every value that today is **copied literally** into `runnerTestFixtures.ts` becomes either:

1. A **`getFromParameters`** reference (`referenceName` → key in the injected param bank), or  
2. A **`getFromContext`** reference (`referencePath` → value produced by an earlier step in the composite sequence)

The **param bank** is the standard execution environment (`RunnerTestContext.testParams`), seeded by `environmentRef` (e.g. `libraryRunnerTestEnvironment`) and merged into suite `testParams` at run time — same slot `handleTestCompositeActionSuite` already receives.

**Not in scope for R:** Changing pass/fail behaviour; deleting legacy `Runner_*` files (G8).

```mermaid
flowchart LR
  subgraph env [Suite param bank — R6 target on miroirTestSuite]
    P[testParams.defaultLibraryAppModel]
    P2[testParams.user1Uuid]
    P3[testParams.book1Uuid]
  end

  subgraph fixture [Declarative fixture / JSON]
    T1["initialModel: getFromParameters"]
    T2["payload.user: getFromParameters"]
    C1["assertion: getFromContext"]
  end

  subgraph run [Runtime]
    ORCH[RunnerTestSession.initSession]
    RESOLVE[leaf + suite testParams → testBuildPlusRuntimeCompositeActionSuiteForRunner]
    SUITE[handleTestCompositeActionSuite]
  end

  ORCH --> env
  env --> RESOLVE
  fixture --> RESOLVE
  RESOLVE --> SUITE
```

#### R0 — `initialModel` as `getFromParameters` (first task) ✅ **Done**

**Current (Phase A bridge):**

```typescript
// runnerTestFixtures.ts
initialModel: defaultLibraryAppModel,  // literal MetaModel import
```

**Target:**

```typescript
// RunnerTestFixtureDefaults
initialModel: {
  transformerType: "getFromParameters",
  interpolation: "build",
  referenceName: "defaultLibraryAppModel",
} satisfies CoreTransformerForBuildPlusRuntime;

// libraryRunnerTestEnvironment seeds param bank (RunnerTestSession / environmentRef)
testParams: {
  defaultLibraryAppModel  // from Library.ts — injected, not embedded in fixture body
}
```

**Type change:**

```typescript
export type RunnerTestFixtureDefaults = {
  // ...
  initialModel: CoreTransformerForBuildPlusRuntime;  // was MetaModel
};
```

**Red (TDD):**

- `runnerTest.tools.unit.test.ts`: fixture `libraryLendBookDefaults` has transformer `initialModel`, not literal model
- `runnerTest.tools.unit.test.ts`: `resolveRunnerTestLeaf` with param bank containing `defaultLibraryAppModel` produces same `beforeEach` / init model as Phase A
- `miroir-runner-tests.integ`: lend + return still pass

**Green (minimal path — recommended for R0):**

1. Change fixture `initialModel` to `getFromParameters` transformer (both lend + return fixtures).
2. Move `defaultLibraryAppModel` from fixture body into `libraryRunnerTestEnvironment` `testParams`.
3. In `resolveRunnerTestLeaf` (or thin helper `resolveRunnerTestInitialModel`):
   - Merge `environmentSeed.testParams` + leaf overrides into param bank
   - Run transformer at **`interpolation: "build"`** with that bank → concrete `MetaModel`
   - Pass resolved model to `testBuildPlusRuntimeCompositeActionSuiteForRunner` (signature unchanged)
4. Remove `defaultLibraryAppModel` import from fixture entries (keep only in environment provider).

**Files touched:** `runnerTestFixtures.ts`, `RunnerTestTools.ts`, possibly `RunnerTestSession.ts` (ensure merged params reach resolution).

**Open decision R0-a (resolution site):** See [Refactor open decisions](#refactor-open-decisions). Implemented as **R0-a = C**: deferred resolution via `_resolvableAppMetaModel` in `resetAndinitializeDeploymentCompositeAction`, expanded at runtime in `DomainController.handleTestCompositeActionSuite` through `expandResolvableResetAndinitializeDeploymentCompositeAction` with merged param bank from `runRunnerTestCompositeAction`.

**Verify:** ✅

- `runnerTest.tools.unit.test.ts`: 6 tests pass (fixture transformer shape, param bank seed, `resolveRunnerTestLeaf` + `expandResolvableResetAndinitializeDeploymentCompositeAction`)
- `npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-sql --suites runner_library --mode integ` — 2 passed (lend + return)

#### R1 — Runner `testParams` payloads via `getFromParameters` ✅ **Done**

Replace literal UUIDs / dates in lend/return payloads:

```typescript
payload: {
  user: { transformerType: "getFromParameters", interpolation: "build", referenceName: "user1Uuid" },
  book: { transformerType: "getFromParameters", interpolation: "build", referenceName: "book1Uuid" },
  startDate: { transformerType: "getFromParameters", interpolation: "build", referenceName: "lendStartDate" },
}
```

Environment injects `lendStartDate` / `lendEndDate` (ISO string) alongside entity UUIDs. Reuse existing transformer test utilities where possible.

**Red (TDD):**

- `runnerTest.tools.unit.test.ts`: lend fixture payload fields are `getFromParameters` transformers, not literal UUIDs/dates
- `miroir-runner-tests.integ`: lend + return still pass with nested payload transformers resolved at runtime

**Green:**

- `RUNNER_TEST_PAYLOAD_*_FROM_PARAMETERS` constants in `runnerTestFixtures.ts`
- `RUNNER_TEST_ENVIRONMENT_REFS.testParams` seeds `user1Uuid`, `book1Uuid`, `lendStartDate`, `lendEndDate`
- Lend + return fixture `testParams` payloads use transformers for `user`, `book`, `startDate`, `endDate`

**Verify:** ✅

- `runnerTest.tools.unit.test.ts`: payload transformer test passes
- `npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-sql --suites runner_library --mode integ` — 2 passed

**Still literal (deferred R2):** ~~`lendBookPreRunner` preRunner payload; `fetchLendingHistoryPreTest` application/deployment UUIDs~~ → migrated in R2

#### R2 — `preTestCompositeActions` / assertions ✅ **Done**

- `fetchLendingHistoryPreTest`: application UUID, deployment UUID, entity parent UUID → `getFromParameters` (keys from `deploymentRef` / environment)
- Assertions already use `getFromContext` for `LendingHistoryList` — keep; ensure context is populated by preTest steps (unchanged behaviour)

**Red (TDD):**

- `runnerTest.tools.unit.test.ts`: preTest query uses `getFromParameters` for application, deployment, entity parent name/uuid
- `runnerTest.tools.unit.test.ts`: return fixture `preRunnerCompositeActions` payload uses shared payload transformers
- `miroir-runner-tests.integ`: lend + return still pass (assertions on `LendingHistoryList` unchanged)

**Green:**

- `RUNNER_TEST_APPLICATION_UUID_FROM_PARAMETERS`, `RUNNER_TEST_DEPLOYMENT_UUID_FROM_PARAMETERS`, `RUNNER_TEST_LENDING_HISTORY_ENTITY_*_FROM_PARAMETERS` constants
- Param bank seeds `testApplicationUuid`, `testApplicationDeploymentUuid`, `lendingHistoryItemEntityUuid`, `lendingHistoryItemEntityName`
- `fetchLendingHistoryPreTest` + `lendBookPreRunner` use transformers; no literal UUIDs in fixture action bodies

**Verify:** ✅

- `runnerTest.tools.unit.test.ts`: 8 tests pass
- `npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-sql --suites runner_library --mode integ` — 2 passed

#### R3 — Inline fixture catalog into `MiroirTest` JSON ✅ **Done**

Move declarative transformer trees from `RUNNER_TEST_FIXTURE_REFS` into `miroirTest_runner_library` leaf fields (or new `runnerTestDefinition` sub-document on leaf). `fixtureRef` becomes optional; environment + JSON hold the full definition.

`runnerRef` / `deploymentRef` may remain string refs (resolve to runner entity + identifier map) — not transformer material.

**Implemented:**

- Extended `miroirTestForRunner` schema with optional `initialModel`, `preTestCompositeActions`, `preRunnerCompositeActions`, `testCompositeActionAssertions`
- `resolveRunnerTestDefinition(leaf)` — `fixtureRef` returns catalog object by reference; inline leaves build from JSON fields
- `export-runner-library-inline-json.ts` serializes catalog into `b7e4a901-…json` (no `fixtureRef` on leaves)
- **Fix (R1 regression):** `DomainController.handleAction` accepts optional `actionParamValues` and passes them through `handleApplicationAction` → `handleCompositeActionTemplate`, so nested `getFromParameters` in runner payloads resolve against the merged test param bank during composite test execution

**Red (TDD):**

- `runnerTest.tools.unit.test.ts`: inline leaf tests, catalog identity test, inline JSON resolution tests (11 passed)

**Green:**

- `npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-sql --suites runner_library --mode integ` — 2 passed (lend + return) with inline JSON

**Verify:** ✅ (re-checked 2026-06-27)

- `runnerTest.tools.unit.test.ts`: **11 passed** (inline leaves without `fixtureRef`, catalog identity, `resolveRunnerTestLeaf` from JSON)
- `npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-sql --suites runner_library --mode integ` — **2 passed** (lend + return, inline JSON)
- Operational: fresh postgres schemas if integ fails with `SelfApplication` NULL or stale `ReferenceNotFound` after partial runs; rebuild `devBuild -w miroir-test-app_deployment-library` then `devBuild -w miroir-core` before integ

**Files touched (R3):**

| Area | Path |
|------|------|
| Schema | `deployment-miroir/…/51c647fe-…json` → generated `miroirFundamentalType.ts` / `miroirFundamentalJzodSchema.ts` |
| Inline JSON | `deployment-library/…/b7e4a901-…json` |
| Export script | `deployment-library/scripts/export-runner-library-inline-json.ts` |
| Resolver | `miroir-core/src/5_tests/RunnerTestTools.ts` (`resolveRunnerTestDefinition`) |
| Param pass-through | `miroir-core/src/3_controllers/DomainController.ts`, `DomainControllerInterface.ts` |
| Unit tests | `miroir-core/tests/4_services/runnerTest.tools.unit.test.ts` |
| Export | `miroir-core/src/index.ts` |

**Note (R3-a):** Pilot uses **full inline trees** (option A) generated from catalog via export script; `fixtureRef` remains supported for transitional leaves.

#### R4 — Retire TypeScript fixture catalog ✅ **Done**

- `runnerTestFixtures.ts` reduced to **environment param providers** (`RUNNER_TEST_ENVIRONMENT_REFS`, `RUNNER_TEST_DEPLOYMENT_REFS`, `RUNNER_REF_MAP`, transformer constant snippets for tests)
- `resolveRunnerTestFixture(fixtureRef)` loads from `miroirTest_runner_library` JSON via `RUNNER_LIBRARY_FIXTURE_REF_ALIASES` → `runnerTestLeafToFixtureDefaults`
- Removed `RUNNER_TEST_FIXTURE_REFS` and all composite-action / assertion literals from TS
- Deleted `export-runner-library-inline-json.ts` (JSON is source of truth)
- `Runner_Library.ts` marked `@deprecated` — parity reference only

**Verify:** ✅ (2026-06-27)

- `runnerTest.tools.unit.test.ts`: **11 passed** (fixtureRef resolves same as inline JSON leaf)
- `runner_library` integ: **2 passed**

#### R5 — Collapse resolver indirection (keep `runnerTestFixtures.ts`) ✅ **Done**

**Scope:** Remove disposable fixture/resolver layers only. **`runnerTestFixtures.ts` stays** until R6 relocates suite-scoped context.

**Removed:** `resolveRunnerTestDefinition`, `resolveRunnerTestFixture`, `runnerTestLeafToFixtureDefaults`, `findRunnerLibraryLeafByMiroirTestLabel`, `RUNNER_LIBRARY_FIXTURE_REF_ALIASES`, `listRunnerTestFixtureRefs`, `RunnerTestFixtureDefaults`, `ResolvedRunnerTestBuildContext`, all `RUNNER_TEST_*_FROM_PARAMETERS` constants.

**Retained in `runnerTestFixtures.ts`:** `RUNNER_TEST_ENVIRONMENT_REFS`, `libraryTestIdentifiers`, `RUNNER_TEST_DEPLOYMENT_REFS`, `resolveRunnerRef`, `resolveRunnerTestDeploymentRef`.

**`resolveRunnerTestLeaf`:** reads leaf fields directly → merges param bank → `testBuildPlusRuntimeCompositeActionSuiteForRunner`.

**Verify:** ✅ (2026-06-27)

- `runnerTest.tools.unit.test.ts`: **6 passed** (slimmed; no `libraryLendBookDefaults` / fixtureRef)
- `miroirTestTools.unit.test.ts`: uses `miroirTest_runner_library` leaf for mode guard
- `runner_library` integ: **2 passed**

#### R6 — Suite-scoped context; delete `runnerTestFixtures.ts` ✅ **Done**

**Moved to dedicated plan:** [r6-suite-scoped-context-plan.md](./r6-suite-scoped-context-plan.md)

R6 is split into five TDD slices (R6-A … R6-E): suite `testParams`, `RunnerTestRunTarget` as test-run input (UUID v4 if unpinned), session wiring, context-only `RunnerTestTools`, then delete `runnerTestFixtures.ts`. Each issue in that doc has present-state diagrams, target architecture, and Red/Green/Verify steps.

**Progress:** R6 complete ✅ — [r6-suite-scoped-context-plan.md](./r6-suite-scoped-context-plan.md)

**Locked principle:** One `{ applicationUuid, applicationName, deploymentUuid }` per test run, passed into the session — not a global `libraryTestIdentifiers` module export.

#### Phase R — success criteria

- [x] R0: `initialModel` is a `getFromParameters` transformer; `defaultLibraryAppModel` only in environment param bank
- [x] R1: runner `testParams` payload fields (`user`, `book`, `startDate`, `endDate`) via `getFromParameters`
- [x] R2: preTest/preRunner composite actions use `getFromParameters`; assertions unchanged (`getFromContext`)
- [x] R3: runner_test definitions inlined in `miroirTest_runner_library` JSON; `resolveRunnerTestDefinition` + param bank pass-through in `handleAction`
- [x] `npm run testMiroir -w miroir-standalone-app -- --suites runner_library --mode integ` stays green after each R slice
- [x] No new literals in fixture bodies for fields migrated in R0–R2
- [x] (R4) `runnerTestFixtures.ts` contains no composite-action / assertion literals
- [x] (R5) Resolver indirection removed; legacy fixture aliases + test constants gone; **`runnerTestFixtures.ts` retained** (trimmed)
- [x] (R6) Suite-scoped run context; **`runnerTestFixtures.ts` deleted** — [r6-suite-scoped-context-plan.md](./r6-suite-scoped-context-plan.md) ✅

#### Suggested commits (Phase R)

1. `refactor(runner-test): R0 initialModel via getFromParameters + param bank`
2. `refactor(runner-test): R1 runner payloads via getFromParameters`
3. `refactor(runner-test): R2 preTest actions via getFromParameters`
4. `refactor(runner-test): R3 move runner_test definitions to MiroirTest JSON`
5. `refactor(runner-test): R4 shrink fixture catalog to environment providers only`
6. `refactor(runner-test): R5 collapse resolveRunnerTestLeaf; remove fixtureRef layer`
7. `refactor(runner-test): R6 suite-scoped context` (sub-commits R6-A … R6-E in [r6-suite-scoped-context-plan.md](./r6-suite-scoped-context-plan.md))

---

### Refactor open decisions

| # | Question | Options | Decision |
|---|----------|---------|----------------|
| R0-a | **Where is `initialModel` transformer resolved?** | A) Eager in `resolveRunnerTestLeaf` using merged param bank B) Lazy in `beforeEach` inside composite runtime (extend `resetAndinitializeDeploymentCompositeAction` to accept transformer) C) let the `runTestOrTestSuite` pass a value to the domainController as params | **C** let the "normal" resolution flow proceed |
| R0-b | **Param key naming** | A) `defaultLibraryAppModel` matches `Library.ts` export name B) prefixed keys e.g. `library.defaultLibraryAppModel` | **A** — direct `referenceName` ↔ param key |
| R1-a | **Date params** | A) inject ISO strings in environment B) `returnValue` transformer in fixture | **A** for consistency with param bank |
| R3-a | **JSON size** | A) full composite trees in leaf JSON B) shared sub-fixtures referenced by `fixtureRef` | **A** for pilot (export script from catalog); **B** still supported via optional `fixtureRef` |
| R4-a | **Catalog fate** | A) delete `runnerTestFixtures.ts` B) keep as environment/runner ref registry only | **B** for R4 → **R6 completes A** |
| R5-a | **`resolveRunnerTestLeaf` name** | A) inline into `runMiroirRunnerTest` B) keep as thin alias one release | TBD |
| R5-b | **`fixtureRef` on runnerTest** | A) leave optional in schema (unused) B) remove from `miroirTestForRunner` | **A** for R5 |
| R6 | **Suite-scoped context** | Full plan | [r6-suite-scoped-context-plan.md](./r6-suite-scoped-context-plan.md) |

---

### Phase B — UI integration test execution

**Full plan:** [phase-b-ui-launcher-plan.md](./phase-b-ui-launcher-plan.md) (TDD slices B0–B9, architectural impact, locked decisions).

**Prerequisite:** Gaps A/B/C-setup/D/E ✅ · Phase R ✅ — Phase B wires an **in-browser async launcher** to existing orchestrator infrastructure.

**In scope (done):** domainController-based MiroirTest integ — `runner_library` + transformer integ (`runnerTest`, `transformerTest` leaves).

**Deferred / postponed:** PersistenceStoreController-direct `4_storage` Vitest suites from UI (B9); Electron emulated (B6-b3); B8 embedded; Playwright (D10) — see phase-b §7 Postponed.

**Isolation model (corrected):** **Data / dataflow isolation** — ephemeral `runTarget`, temp stores, dedicated integ activity tracker, session `teardown()`; **not** Vitest subprocess spawn in the browser. `hostMode: "isolated"` = fresh bootstrap stack in-process.

| Slice | Summary | Status |
|-------|---------|--------|
| B0–B2 | Types, mutex, Vitest-free in-process suite runner | ✅ |
| B3–B4 | `UiIntegrationTestLauncher` + real `RunnerTestSession.teardown` | ✅ |
| B5–B6 | UI button, badges, profile picker (B6-a/b), real-server path (B6-c C1–C5), **e2e proof** (B6-d) | ✅ · B6-b3 postponed |
| B7 | Transformer integ in same launcher (+ list dual-mode UX + webApp manual) | ✅ |
| B8–B9 | Optional embedded troubleshooting; optional PersistenceStoreController subprocess catalog | ⏸️ Postponed |

---

## Mapping: `libraryLendBookRunnerTest` → `runnerTest`

| `RunnerTestParams` field | Encoding |
|--------------------------|----------|
| `pageLabel` | Vitest entry / suite key label (not in leaf) |
| `runner` | Leaf `runnerRef` → runner entity (**R6:** suite-local map, not global `resolveRunnerRef`) |
| `testApplicationUuid/Name/DeploymentUuid` | **R6:** suite-level deployment block; today `deploymentRef` → global `libraryTestIdentifiers` |
| `testParams` (shared bank) | **R6:** suite `testParams` merged with leaf `testParams`; today `RUNNER_TEST_ENVIRONMENT_REFS` |
| `preTestCompositeActions` | **R3:** inline on leaf JSON (was fixture catalog) |
| `testCompositeActionAssertions` | **R3:** inline on leaf JSON (was fixture catalog) |
| `preRunnerCompositeActions` | **R3:** inline on leaf JSON (return leaf only) |
| `internalMiroirConfig` | derived at runtime from env config + `getTestConfig` |
| `adminDeployment` | derived from env config |
| `testDeploymentStorageConfiguration` | derived from env profile + app name |
| `initialModel` | Phase A: fixture literal → **Phase R0:** `getFromParameters` + `testParams.defaultLibraryAppModel` |
| `testCompositeActionLabel` | leaf field or fixture default |

---

## Success criteria

### Phase A ✅

- [x] `miroirTestType: "runnerTest"` in schema; generated types compile
- [x] `RunnerTestTools` resolves pilot leaves via fixture catalog
- [x] `npm run testMiroir -w miroir-standalone-app -- --suites runner_library --mode integ` passes (lend + return)
- [x] `runnerTest` rejected in `executionMode: "unit"` with clear error
- [x] Orchestrator + four session adapters (Gaps A/B/C-setup/E); legacy `Runner_Miroir.integ` harness on `RunnerTestSession` (still imperative — G8)
- [x] No secrets committed; config files use localhost defaults

### Phase R (R0–R6 ✅)

- [x] R0: `initialModel` → `getFromParameters` + injected `defaultLibraryAppModel`
- [x] R1: runner payload fields → `getFromParameters` + param bank dates/UUIDs
- [x] R2: preTest/preRunner → `getFromParameters` + deployment/entity param bank keys
- [x] R3: fixture definitions inlined in `miroirTest_runner_library` JSON; `handleAction` param-bank pass-through
- [x] R4: composite literals removed from TS catalog; JSON source of truth
- [x] R5: collapse resolver indirection; remove fixtureRef layer
- [x] R6: suite-scoped run context; delete `runnerTestFixtures.ts` — [r6-suite-scoped-context-plan.md](./r6-suite-scoped-context-plan.md)

### Phase B

See [phase-b-ui-launcher-plan.md](./phase-b-ui-launcher-plan.md) §7 for granular checkboxes (source of truth).

**Core (done):**

- [x] In-browser data-isolated integ launcher (`hostMode: "isolated"`, dedicated tracker, mutex) — B1–B5
- [x] Run `runner_library` + transformer integ from UI without affecting working session stores — runner B3–B6 (incl. C5); transformer B7 (incl. webApp manual **2026-07-19**)
- [x] Ephemeral vs pinned run-target toggle; profile picker with transport labels — B6-a/b
- [x] Environment inspector shows config + last run context **with proven end-to-end launch** — B6-d1/d2 (indexedDb) + C5 (real-server)
- [x] Teardown leaves no test schemas / indexedDb databases behind — B4
- [x] List dual unit/integ batch bar — [ui-unit-vs-integ-run-context-plan.md](./ui-unit-vs-integ-run-context-plan.md)

**Postponed:**

- [ ] B6-b3 Electron emulated profiles; D10 Playwright T3 automation
- [ ] (Optional) embedded host path documented and gated — B8
- [ ] (Optional) PersistenceStoreController subprocess catalog — B9

### Gap D — unified integration test profiles — ✅ **Done**

Plan: [gap-D-refactoring-plan.md](./gap-D-refactoring-plan.md)

- [x] Unified `--profile` for transformer + runner `testMiroir` integ
- [x] Profile catalog in standalone-app; removed path table from miroir-core
- [x] CI matrix doc with one profile driving multiple suite kinds
- [x] `testByFile --profile` convenience

---

## Grill session summary (complete)

| # | Question | Locked |
|---|----------|--------|
| G1 | Leaf type vs legacy `Test` entity? | **A** — `runnerTest` on MiroirTest |
| G2 | Instance home? | **A** — library app `model` section |
| G3 | JSON vs fixtures? | **A** — minimal refs + `getFromParams`/`getFromContext` direction |
| G4 | Script vs orchestration? | **A** — script in standalone-app, orchestrator in miroir-core |
| G5 | Profile selection? | **C** — env vars + `--profile` |
| G6 | Phase B UI? | **A** — extend Miroir Tests menu |
| G7 | Headless execution? | **A** — `miroir-core` |
| G8 | Legacy deprecation? | **B** — after all `Runner_*` migrated |

---

## Out of scope

- Migrating all `Runner_*.integ.test.tsx` files to MiroirTest JSON (pilot only in Phase A; G8 governs cutover)
- Deleting legacy `Test` entity
- Fixing pre-existing type `as any` in lendDocument payload
- CI matrix for every storage backend (pilot: emulatedServer-sql only)
- Running transformer + runner suites in a single `testMiroir` invocation across packages (future)
- **UI launcher for PersistenceStoreController-direct `4_storage` suites** — persistence-layer tests keep PersistenceStoreController assertions by design ([Gap C-assertions](./integ-test-setup-gaps.md#42-c-assertions--persistence-tests-keep-psc-by-design)); defer to follow-up issue or Phase B+ (Vitest subprocess catalog entry only)
- **Migrating `4_storage` assertions to `domainController`** — changes test meaning; not required for setup unification

---

## Suggested commits (Phase A)

1. `feat(miroir-test): add miroirTestForRunner to MiroirTest entity schema`
2. `feat(miroir-core): add RunnerTestTools with fixture resolution`
3. `feat(miroir-core): add miroirRunnerTestEnvironment bootstrap helper`
4. `feat(miroir-library): add runner_test fixture catalog and pilot instance`
5. `feat(standalone-app): add testMiroir script and runner integ vitest entry`
6. `test(standalone-app): parity libraryLendBookRunnerTest via testMiroir`
7. `docs: runner integration tests via MiroirTest`

---

## Related

- [Integration test setup — gap analysis](./integ-test-setup-gaps.md) (bootstrap gaps A–E)
- [Gap D — unified integration test profiles](./gap-D-refactoring-plan.md)
- [Phase B — UI launcher](./phase-b-ui-launcher-plan.md) (B0–B7 done; optional postponed in §7)
- [UI unit vs integ run context](./ui-unit-vs-integ-run-context-plan.md) (list/details dual-mode — done)
- [Action integ → MiroirTest migration](./action-integ-miroirtest-migration-plan.md) (DomainController CRUD → `actionTest` leaf)
- [Feature 196 — MiroirTest](../196-FEATURE-migrate-tests-to-MiroirTest/plan.md)
- [Feature 195 — Unit tests in UI](../195-FEATURE-%20enable%20execution%20of%20miroir-core%20unit%20tests%20in%20UI/plan.md) (superseded for unit tests; still relevant for `Test` entity distinction)
- [Feature 157 — Startup sequence](../157-FEATURE-%20harden%20startup%20sequence%20%26%20enable%20admin%20deployment%20choice%20on%20client%20-%20server/PLAN.md) (shared setup/teardown alignment)
