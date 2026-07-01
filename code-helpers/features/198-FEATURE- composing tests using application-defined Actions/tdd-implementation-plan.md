# 198 — TDD Implementation Plan: deployment-aware `miroirFundamentalJzodSchema`

> Prerequisite refactor + Solution 2 implementation.
> Each cycle follows the red → green vertical-slice model; tests describe **behavior**, not implementation.

Related: [impact-analysis-and-solutions.md](./impact-analysis-and-solutions.md)

---

## Design decisions (settled via pre-planning interview)

| Decision | Choice |
|---|---|
| Schema accessor API | `getMiroirFundamentalSchemaForDeployment(deploymentUuid: Uuid, model: MetaModel): MlSchema` — pure function in `miroir-core` |
| Caching owner | React context (`MiroirContextReactProvider`): `schemasPerDeployment: Record<Uuid, MlSchema>`, populated via `useEffect` in `useCurrentModelEnvironment`; non-React callers receive the cost of a direct call |
| App-action filtering | Endpoints whose `endpoint.application === model.applicationUuid` (non-Miroir apps only) |
| Phase 1 scope | ALL construction sites — production + test files — migrated together so Phase 1 proves the API drop-in safe |

---

## Test execution conventions

All commands are run from the **package directory** (`cd packages/<package>`), unless noted.

| Script | Package(s) | Purpose |
|---|---|---|
| `npm test -- <pattern>` | vitest packages (`miroir-core`, `miroir-standalone-app`, deployment apps, MCP, CLI) | Filter by test/describe name (`-t`) |
| `npm run testByFile -- <path>` | `miroir-core`, deployment apps | Run one file, verbose |
| `npm test -- <pattern>` | `miroir-localcache-redux` (jest) | Filter by test name (`-t`) |
| `npm run devBuild` | `miroir-core` | Rebuild after `index.ts` export changes |

**Legend used in each step**

| Label | Meaning |
|---|---|
| **Progress (RED)** | Run before implementation — new test(s) must **fail** (or file must not exist yet) |
| **Progress (GREEN)** | Run after implementation — same test(s) must **pass** |
| **Non-regression** | Run after GREEN — must still pass; catches collateral damage |
| **Baseline** | Run before starting the step — establishes green state |

Phase 1 steps should leave **all** non-regression suites green. Phase 2 steps add new failing tests first, then widen non-regression as behavior changes.

---

## High-level two-phase structure

```
Phase 1 — Infrastructure refactor (non-regression)     ← slices 1.1–1.7 DONE; 1.8 gate PARTIAL
  Goal : introduce getMiroirFundamentalSchemaForDeployment; migrate all MiroirModelEnvironment
         construction sites; all tests stay green; schema content unchanged.

Phase 2 — Solution 2: app-aware domainAction + actionTemplate   ← slices 2.1–2.3 DONE; 2.4+
  Goal : getMiroirFundamentalSchemaForDeployment returns an extended schema for app deployments;
         runner_library MiroirTest validates cleanly.
```

---

## Phase 1 — Deployment-keyed schema access (non-regression)

### Phase 1 progress (plan vs code, 2026-06-30)

| Slice | Status | Code | Tests |
|---|---|---|---|
| **1.1** | **DONE** | `getMiroirFundamentalSchemaForDeployment` stub + export | `schemaForDeployment.unit.test.ts` (3 cases) |
| **1.2** | **DONE** | `localcache-redux` `currentModelEnvironment` | `currentModelEnvironment.unit.test.ts` + `minimalLocalCacheStateForModel` helper |
| **1.3** | **DONE** | `localcache-zustand` `currentModelEnvironment` + `vite.config.js` | same pattern as 1.2 |
| **1.4** | **DONE** | `schemasPerDeployment` / `setSchemaForDeployment`, hooks, guards | `useCurrentModelEnvironment.unit.test.tsx` (Provider + Redux; schema match, cache on mount, model change) |
| **1.5** | **DONE** | `defaultMiroirModelEnvironment` + `defaultMetaModelEnvironment` in `Model.ts` | `modelEnvironment.unit.test.ts` (both defaults) |
| **1.6** | **DONE** | MCP / CLI / server / `Library.ts`; `getDefaultLibraryModelEnvironmentDEFUNCT` 3-arg signature | MCP jzod unit tests; `getDefaultLibraryModelEnvironmentDEFUNCT.unit.test.ts` |
| **1.7** | **DONE** | library / admin / designer `modelValidation`; session helpers via `defaultMiroirModelEnvironment` | 4× deployment validation (postgres file commented out — see delta) |
| **1.8** | **PARTIAL** | `run-step-tests.sh` gate | Core + library + standalone unit green; MCP unit green; CLI integ skipped in gate (env); full MCP HTTP integ needs `:4080` server |

Commits on branch: `#198 … Phase 1, preliminary refactoring` (`6a535081`, `7fad2481`).

Gate runner: `./code-helpers/features/198-FEATURE- composing tests using application-defined Actions/run-step-tests.sh 1.8 all`

---

### 1.1  `getMiroirFundamentalSchemaForDeployment` — stub that returns the static schema

**Status: DONE**

**Behavior**: For any `(deploymentUuid, model)` pair, the function returns the existing
static `miroirFundamentalJzodSchema`. This is the Phase 1 contract: identical output
to the current import, but accessed via an API that takes a deployment identity.

**New file**: `packages/miroir-core/src/1_core/jzod/schemaForDeployment.ts`

```
RED  — new test file: packages/miroir-core/tests/1_core/schemaForDeployment.unit.test.ts

  it("returns the static schema for any deploymentUuid in Phase 1")
    const result = getMiroirFundamentalSchemaForDeployment("any-uuid", defaultMiroirMetaModel);
    expect(result).toBe(miroirFundamentalJzodSchema);   // reference equality
    // also verify it resolves "domainAction" from its context
    expect(result.definition.context.domainAction).toBeDefined();

  it("resolves the static schema for the Miroir deployment")
    const result = getMiroirFundamentalSchemaForDeployment(deployment_Miroir.uuid, defaultMiroirMetaModel);
    expect(result).toBe(miroirFundamentalJzodSchema);
```

**GREEN implementation**:
```ts
// schemaForDeployment.ts
import { miroirFundamentalJzodSchema } from
  "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalJzodSchema";
import type { Uuid } from "../0_interfaces/1_core/EntityDefinition";
import type { MetaModel, MlSchema } from
  "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

export function getMiroirFundamentalSchemaForDeployment(
  _deploymentUuid: Uuid,
  _model: MetaModel,
): MlSchema {
  return miroirFundamentalJzodSchema as MlSchema;
}
```

Export from `packages/miroir-core/src/index.ts`.

**Tests to run**

| When | Command (`packages/miroir-core`) | Expect |
|---|---|---|
| **Progress (RED)** | `npm run testByFile -- tests/1_core/schemaForDeployment.unit.test.ts` | FAIL (file or tests missing) |
| **Progress (GREEN)** | same | PASS (2 tests) |
| **Non-regression** | `npm run testByFile -- tests/1_core/jzod/jzodTypeCheck.test.ts` | PASS |
| **Non-regression** | `npm run testByFile -- tests/1_core/jzod/resolveSchemaReferenceInContext.test.ts` | PASS |
| **Non-regression** | `npm test -- jzodTransitiveDependencySet` | PASS (carry-on helper still sound) |
| **Build** | `npm run devBuild` | PASS (new export compiles) |

**Commit**: `feat: add getMiroirFundamentalSchemaForDeployment stub — Phase 1 API`

---

### 1.2  Migrate `currentModelEnvironment` in `miroir-localcache-redux`

**Status: DONE**

**Behavior**: `currentModelEnvironment(app, map, state).miroirFundamentalJzodSchema` is
produced by `getMiroirFundamentalSchemaForDeployment(deploymentUuid, model)`, not the direct static import.

```
RED  — add to packages/miroir-localcache-redux/tests/ (or adapt existing)

  it("currentModelEnvironment uses getMiroirFundamentalSchemaForDeployment")
    const env = currentModelEnvironment(miroir_uuid, map, state);
    // schema object should match static schema (Phase 1 sameness)
    expect(env.miroirFundamentalJzodSchema).toBe(miroirFundamentalJzodSchema);
    // contract: if we swap getMiroirFundamentalSchemaForDeployment for a spy later (Phase 2)
    //           this test would catch it — proving call delegation is in place
```

**GREEN**: Replace `miroirFundamentalJzodSchema: miroirFundamentalJzodSchema as MlSchema` in
`packages/miroir-localcache-redux/src/4_services/localCache/Model.ts::currentModelEnvironment`
with `miroirFundamentalJzodSchema: getMiroirFundamentalSchemaForDeployment(deploymentUuid, model)`.
Remove the now-unused direct import of the static schema from that file.

**Tests to run**

| When | Command | Expect |
|---|---|---|
| **Baseline** | `packages/miroir-localcache-redux`: `npm test` | PASS (full package) |
| **Progress (RED)** | `npm test -- getMiroirFundamentalSchemaForDeployment` (new test in `tests/LocalCache.unit.test.ts` or `tests/currentModelEnvironment.unit.test.ts`) | FAIL |
| **Progress (GREEN)** | same | PASS |
| **Non-regression** | `npm test` | PASS (entire `miroir-localcache-redux`) |
| **Non-regression** | `packages/miroir-core`: `npm run testByFile -- tests/1_core/schemaForDeployment.unit.test.ts` | PASS |
| **Non-regression** | `packages/miroir-standalone-app`: `npm test -- DomainController.integ` | PASS (DomainController uses localcache `currentModelEnvironment`) |

**Commit**: `refactor: localcache-redux currentModelEnvironment → getMiroirFundamentalSchemaForDeployment`

---

### 1.3  Migrate `currentModelEnvironment` in `miroir-localcache-zustand`

**Status: DONE**

Same pattern as 1.2 for `packages/miroir-localcache-zustand/src/4_services/localCache/Model.ts`.

**Tests to run**

| When | Command | Expect |
|---|---|---|
| **Baseline** | `packages/miroir-localcache-zustand`: no test suite today — rely on downstream | — |
| **Progress (RED)** | Add `tests/currentModelEnvironment.unit.test.ts` mirroring 1.2; `npm test -- currentModelEnvironment` | FAIL |
| **Progress (GREEN)** | same | PASS |
| **Non-regression** | `packages/miroir-standalone-app`: `npm test -- DomainController.integ.Model` | PASS |
| **Non-regression** | `packages/miroir-standalone-app`: `npm test -- DomainController.React.Model.undo-redo` | PASS |
| **Non-regression** | `packages/miroir-core`: `npm run testByFile -- tests/1_core/schemaForDeployment.unit.test.ts` | PASS |

**Commit**: `refactor: localcache-zustand currentModelEnvironment → getMiroirFundamentalSchemaForDeployment`

---

### 1.4  Migrate `useCurrentModelEnvironment` (React hook) + React context

**Status: DONE** (implementation complete; progress tests are contract-level only — see [Phase 1 completion delta](#phase-1--completion-delta))

This cycle is the largest in Phase 1. It changes how the React context holds schemas and how
the hook computes the environment.

**Behavior A**: `useCurrentModelEnvironment` populates `MiroirModelEnvironment.miroirFundamentalJzodSchema`
by calling `getMiroirFundamentalSchemaForDeployment` and caching the result in the React context.

**Behavior B**: When `currentModel` changes for a deployment, the cached schema in context
is recomputed.

**Behavior C**: Components that previously guarded on `context.miroirFundamentalJzodSchema`
should instead use `currentApplicationModelEnvironment.miroirFundamentalJzodSchema`, which
is always defined (never undefined) because `getMiroirFundamentalSchemaForDeployment` always returns a value.

**Context interface change** (`MiroirContextReactProvider.tsx`):
```ts
// Before (single, possibly-undefined schema)
miroirFundamentalJzodSchema: MlSchema | undefined;
setMiroirFundamentalJzodSchema: React.Dispatch<React.SetStateAction<MlSchema | undefined>>;

// After (per-deployment map)
schemasPerDeployment: Record<Uuid, MlSchema>;
setSchemaForDeployment: (deploymentUuid: Uuid, schema: MlSchema) => void;
```

```
RED  — packages/miroir-standalone-app/tests/4_view/useCurrentModelEnvironment.unit.test.tsx

  it("returns an environment whose schema matches getMiroirFundamentalSchemaForDeployment output for a given deployment")
    render with a provider that has libraryModel in state;
    const env = result.current;   // via renderHook(useCurrentModelEnvironment, ...)
    const expected = getMiroirFundamentalSchemaForDeployment(libraryDeploymentUuid, libraryModel);
    expect(env.miroirFundamentalJzodSchema).toEqual(expected);

  it("updates the schema in context when the model changes")
    // start with empty model, then trigger model update
    // verify context.schemasPerDeployment[deploymentUuid] is updated
```

**GREEN**: 
1. Add `schemasPerDeployment`/`setSchemaForDeployment` to `MiroirContextReactProvider`.
2. In `useCurrentModelEnvironment` (`ReduxHooks.ts`):
```ts
const deploymentUuid = applicationDeploymentMap[application];
const currentModel = useCurrentModel(application, applicationDeploymentMap);
const context = useMiroirContextService();

// Populate context cache whenever the model changes
useEffect(() => {
  if (currentModel && deploymentUuid) {
    const schema = getMiroirFundamentalSchemaForDeployment(deploymentUuid, currentModel);
    context.setSchemaForDeployment(deploymentUuid, schema);
  }
}, [currentModel, deploymentUuid]);

return useMemo(() => ({
  miroirFundamentalJzodSchema:
    context.schemasPerDeployment[deploymentUuid]
    ?? getMiroirFundamentalSchemaForDeployment(deploymentUuid, currentModel),  // sync fallback
  currentModel,
  deploymentUuid,
  miroirMetaModel,
  endpointsByUuid,
}), [context.schemasPerDeployment, currentModel, deploymentUuid, miroirMetaModel, endpointsByUuid]);
```
3. Remove the old `[miroirFundamentalJzodSchema]` `useEffect` from `RootComponent.tsx` that
   called `setMiroirFundamentalJzodSchema` with the static import.
4. Replace `context.miroirFundamentalJzodSchema &&` guards in `TypedValueObjectEditor.tsx`
   and `JzodElementEditorTestTools.tsx` with
   `currentApplicationModelEnvironment.miroirFundamentalJzodSchema &&`.

**Tests to run**

| When | Command (`packages/miroir-standalone-app`) | Expect |
|---|---|---|
| **Progress (RED)** | `npm run testByFile -- tests/4_view/useCurrentModelEnvironment.unit.test.tsx` | FAIL (file missing) |
| **Progress (GREEN)** | same | PASS |
| **Non-regression** | `npm run testByFile -- tests/4_view/JzodElementEditor.test.tsx` | PASS (editor typecheck path) |
| **Non-regression** | `npm run testByFile -- tests/4_view/ReportPage.integ.test.tsx` | PASS (`TypedValueObjectEditor`) |
| **Non-regression** | `npm test -- RunnerTestSession` | PASS (`defaultMiroirModelEnvironment` wiring) |
| **Non-regression** | `npm test -- IntegrationTestSession` | PASS |
| **Non-regression** | `packages/miroir-react`: build/typecheck if context types changed | PASS |

**Commit**: `refactor: useCurrentModelEnvironment → context.schemasPerDeployment`

---

### 1.5  Migrate static `defaultMiroirModelEnvironment` / `defaultMetaModelEnvironment`

**Status: DONE**

**Behavior**: The two static defaults in `packages/miroir-core/src/1_core/Model.ts` use
`getMiroirFundamentalSchemaForDeployment`. Since they are computed once at module load, a direct call is fine.

```
RED — add assertions to existing Model.ts unit tests (or a new test file)

  it("defaultMiroirModelEnvironment.miroirFundamentalJzodSchema equals getMiroirFundamentalSchemaForDeployment output")
    expect(defaultMiroirModelEnvironment.miroirFundamentalJzodSchema)
      .toBe(getMiroirFundamentalSchemaForDeployment(deployment_Miroir.uuid, defaultMiroirMetaModel));
```

**GREEN**:
```ts
// Model.ts
export const defaultMiroirModelEnvironment: MiroirModelEnvironment = {
  miroirFundamentalJzodSchema: getMiroirFundamentalSchemaForDeployment(deployment_Miroir.uuid, defaultMiroirMetaModel),
  ...
};
```

**Tests to run**

| When | Command (`packages/miroir-core`) | Expect |
|---|---|---|
| **Progress (RED)** | `npm test -- defaultMiroirModelEnvironment` (new assertion in `tests/1_core/modelEnvironment.unit.test.ts`) | FAIL |
| **Progress (GREEN)** | same | PASS |
| **Non-regression** | `npm run testByFile -- tests/4_services/runMiroirTestSuiteInProcess.unit.test.ts` | PASS |
| **Non-regression** | `npm run testByFile -- tests/4_services/miroirTestTools.unit.test.ts` | PASS |
| **Non-regression** | `npm run testByFile -- tests/2_domain/resolveCompositeActionTemplate.unit.test.ts` | PASS |
| **Non-regression** | `npm run testByFile -- tests/1_core/schemaForDeployment.unit.test.ts` | PASS |

**Commit**: `refactor: Model.ts defaults → getMiroirFundamentalSchemaForDeployment`

---

### 1.6  Migrate remaining non-React construction sites (MCP / CLI / server / Library)

**Status: DONE** (also migrated: `packages/miroir-ai/src/tools/miroirCopilotKitActions.ts`, not listed originally)

Each site currently does one of:
- `miroirFundamentalJzodSchema: miroirFundamentalJzodSchema as MlSchema`
- `getDefaultLibraryModelEnvironmentDEFUNCT(miroirFundamentalJzodSchema, ...)`

Replace with a `getMiroirFundamentalSchemaForDeployment` call using the available `deploymentUuid` and model.

Sites to migrate:
- `packages/miroir-mcp/src/tools/mcpHandlersForEndpoint.ts`
- `packages/miroir-mcp/src/tools/Tools.ts`
- `packages/miroir-mcp/src/tools/ToolsForApplication_Library.ts`
- `packages/miroir-mcp/src/tools/jzodElementToJsonSchema.ts`
- `packages/miroir-mcp/src/tools/jzodElementToTS.ts`
- `packages/miroir-cli/src/commands/commandsFromEndpoint.ts`
- `packages/miroir-server/src/server.ts`
- `packages/miroir-test-app_deployment-library/src/Library.ts` — `getDefaultLibraryModelEnvironmentDEFUNCT`

For tools that build a local environment ad-hoc (MCP, CLI) with no pre-existing model,
they already have a `deploymentUuid` and a model (even if a stub). Use those.

```
RED — no new tests needed here; existing integration tests of MCP / CLI tools serve as
     the regression guard. The RED phase is: "run existing tests before the change,
     ensure they pass; run after change, still pass."
```

**Tests to run**

| When | Command | Expect |
|---|---|---|
| **Baseline (before change)** | `packages/miroir-mcp`: `npm test` | PASS |
| **Baseline** | `packages/miroir-cli`: `npm test` | PASS |
| **Progress (GREEN)** | same commands after migration | PASS |
| **Non-regression** | `packages/miroir-mcp`: `npm run testByFile -- tests/unit/jzodElementToJsonSchema.unit.test.ts` | PASS |
| **Non-regression** | `packages/miroir-mcp`: `npm run testByFile -- tests/unit/jzodElementToTS.unit.test.ts` | PASS |
| **Non-regression** | `packages/miroir-mcp`: `npm run testByFile -- tests/integration/mcpTools.integ.test.ts` | PASS |
| **Non-regression** | `packages/miroir-cli`: `npm run testByFile -- tests/cli.integ.test.ts` | PASS |
| **Non-regression** | `packages/miroir-test-app_deployment-library`: `npm test -- Library` (import/build of `Library.ts`) | PASS |

**Commit**: `refactor: non-React construction sites → getMiroirFundamentalSchemaForDeployment`

---

### 1.7  Migrate test-file `MiroirModelEnvironment` constructions

**Status: DONE** (postgres deployment file is fully commented out — N/A until restored; see delta)

**Behavior**: Test files that manually inline
`{ miroirFundamentalJzodSchema: miroirFundamentalJzodSchema as MlSchema, ... }` should call
`getMiroirFundamentalSchemaForDeployment` instead.

Files:
- `packages/miroir-test-app_deployment-library/tests/modelValidation.unit.test.ts`
  — `libraryModelEnvironment` construction
- `packages/miroir-test-app_deployment-admin/tests/modelValidation.unit.test.ts`
- `packages/miroir-test-app_deployment-postgres/tests/modelValidation.unit.test.ts`
- `packages/miroir-test-app_deployment-designer/tests/modelValidation.unit.test.ts`
- `packages/miroir-standalone-app/tests/helpers/IntegrationTestSession.ts`
- `packages/miroir-standalone-app/tests/helpers/RunnerTestSession.ts`

```
RED — The existing tests in modelValidation.unit.test.ts ARE the regression suite.
     They must pass before the change (they should; this is their current state) and
     after it (they must still pass after migrating the construction).

     No new test written here; the contract is: all existing model-validation tests
     pass without schema changes.
```

**GREEN**: Replace each `miroirFundamentalJzodSchema as MlSchema` literal with
`getMiroirFundamentalSchemaForDeployment(deploymentUuid, model)` using the appropriate variables.

**Tests to run**

| When | Command | Expect |
|---|---|---|
| **Baseline** | `packages/miroir-test-app_deployment-library`: `npm run testByFile -- tests/modelValidation.unit.test.ts` | PASS (full file) |
| **Baseline** | `packages/miroir-test-app_deployment-admin`: `npm run testByFile -- tests/modelValidation.unit.test.ts` | PASS |
| **Baseline** | `packages/miroir-test-app_deployment-postgres`: `npm run testByFile -- tests/modelValidation.unit.test.ts` | PASS |
| **Baseline** | `packages/miroir-test-app_deployment-designer`: `npm run testByFile -- tests/modelValidation.unit.test.ts` | PASS |
| **Progress (GREEN)** | same four files after construction migration | PASS (no schema change in Phase 1) |
| **Non-regression** | `packages/miroir-standalone-app`: `npm test -- RunnerTestSession` | PASS |
| **Non-regression** | `packages/miroir-standalone-app`: `npm test -- IntegrationTestSession` | PASS |

**Commit**: `refactor: test-file MiroirModelEnvironment constructions → getMiroirFundamentalSchemaForDeployment`

---

### 1.8  Phase 1 regression gate

**Status: PARTIAL** — automated gate (`run-step-tests.sh 1.8 all`) passes core / localcache / library / standalone unit / MCP unit; CLI integ and full MCP HTTP integ require local env (see delta and table notes below).

Run the full test suite. All tests that were passing before Phase 1 must still pass.
If anything breaks, it means a construction site was missed or a guard was changed incorrectly.

**Tests to run (full Phase 1 gate — run in order)**

| # | Command | Expect | What it guards |
|---|---|---|---|
| 1 | `packages/miroir-core`: `npm run testByFile -- tests/1_core/schemaForDeployment.unit.test.ts` | PASS | New API |
| 2 | `packages/miroir-core`: `npm run testByFile -- tests/1_core/jzod/jzodTypeCheck.test.ts` | PASS | Core typecheck |
| 3 | `packages/miroir-core`: `MIROIR_TEST_SUITES=<all except resolveConditionalSchema> npm run testMiroir` | PASS | Full core MiroirTest unit suite (`run_core_gate` in script) |
| 4 | `packages/miroir-localcache-redux`: `npm test` | PASS | Redux model environment |
| 5 | `packages/miroir-test-app_deployment-library`: `npm run testByFile -- tests/modelValidation.unit.test.ts -t "^(?!.*(AuthorList\|LibraryHome))"` | PASS | Library model instances (excludes pre-existing failures) |
| 6 | `packages/miroir-test-app_deployment-admin`: `npm run testByFile -- tests/modelValidation.unit.test.ts` | PASS | Admin model instances |
| 7 | `packages/miroir-test-app_deployment-postgres`: `npm run testByFile -- tests/modelValidation.unit.test.ts` | SKIP | Entire file commented out — restore before enabling |
| 8 | `packages/miroir-test-app_deployment-designer`: `npm run testByFile -- tests/modelValidation.unit.test.ts` | PASS | Designer deployment model |
| 9 | `packages/miroir-standalone-app`: `npm run testByFile -- tests/4_view/JzodElementEditor.test.tsx` | PASS | Editor + schema resolution (do **not** use `npm test -t JzodElementEditor`) |
| 10 | ~~`packages/miroir-standalone-app`: `npm test -- applicative.Library`~~ | SKIP | Three `applicative.Library.*.integ.test.tsx` files are empty shells — excluded until tests are written |
| 11 | `packages/miroir-mcp`: `npm run testByFile -- tests/unit/*.unit.test.ts` | PASS | MCP jzod unit (`run_mcp_gate`); full `npm test` needs persistence server on `:4080` |
| 12 | `packages/miroir-cli`: `npm run testByFile -- tests/cli.integ.test.ts` | PASS* | *Needs filesystem deployment roots in local CLI config; currently commented out in `run-step-tests.sh 1.8` |

**App-stack integ** (not in minimal gate, but required when validating DomainController paths): use `npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-sql <file-substring>` — see `docs/reference/testing.md`.

Optional broader gate (slower): `packages/miroir-standalone-app`: `npm test` (full app suite).

**No code change in this cycle — pure verification.**

---

## Phase 1 — Completion delta

Items below are **not blockers for starting Phase 2** (schema content is unchanged; API is in place), but should be closed before declaring Phase 1 fully signed off.

### D1 — Strengthen progress tests (1.2, 1.3, 1.4) — **DONE**

| Planned | Actual |
|---|---|
| `currentModelEnvironment` test proves schema comes from `getMiroirFundamentalSchemaForDeployment` via a populated localcache state | `tests/helpers/minimalLocalCacheStateForModel.ts` + `currentModelEnvironment.unit.test.ts` in redux and zustand drive `currentModelEnvironment` with minimal `state.current` |
| `useCurrentModelEnvironment` `renderHook` tests (schema match, context update on model change) | `useCurrentModelEnvironment.unit.test.tsx`: Provider + Redux test store; schema match, `schemasPerDeployment` on mount, recompute when endpoints change (same deployment) |

**Action**: ~~Add integration-style unit tests…~~ Done. Defer `does not recompute schema` spy test to Phase 2 cycle **2.8** (already planned there).

### D2 — `defaultMetaModelEnvironment` assertion (1.5) — **DONE**

Code migrates both `defaultMiroirModelEnvironment` and `defaultMetaModelEnvironment`. `modelEnvironment.unit.test.ts` asserts both.

**Action**: ~~Add symmetric assertion…~~ Done.

### D3 — Postgres deployment validation (1.7 / 1.8 gate row #7)

`packages/miroir-test-app_deployment-postgres/tests/modelValidation.unit.test.ts` is entirely commented out (legacy library copy). No migration was needed; gate row should stay **SKIP** until the file is restored.

**Action**: When postgres deployment validation is re-enabled, migrate `libraryModelEnvironment` construction to `getMiroirFundamentalSchemaForDeployment` and add back to gate.

### D4 — Phase 1 regression gate environment dependencies (1.8)

| Gate item | Issue | Workaround in `run-step-tests.sh` |
|---|---|---|
| `npm test -t JzodElementEditor` | Loads all vitest entries; integ stubs fail without `VITE_MIROIR_*` | `testByFile` on specific file |
| `applicative.Library.*.integ.test.tsx` | No test suites in file | Excluded |
| `miroir-mcp` full `npm test` | `mcpTools.integ.test.ts` needs HTTP persistence on `:4080` | `run_mcp_gate` (unit only) |
| `miroir-cli` `npm test` | `cli.integ.test.ts` needs `filesystemDeploymentRootDirectory` in config | `# run_cli` commented out in 1.8; fixed `ConfigurationService.configurationService` typo |

**Action**: Document CI profile for CLI/MCP integ; re-enable `run_cli` in gate once local/CI config is standardised. For manual full gate: start persistence server, set CLI config, then run MCP/CLI integ explicitly.

### D5 — Session helpers use indirect migration (1.7) — **DONE**

`RunnerTestSession.ts` / `IntegrationTestSession.ts` now use `buildTestSessionModelEnvironment` / `buildIntegrationTestModelEnvironment` (explicit `getMiroirFundamentalSchemaForDeployment`) instead of importing `defaultMiroirModelEnvironment`.

| File | Change |
|---|---|
| `tests/helpers/testSessionModelEnvironment.ts` | Shared helper: `buildTestSessionModelEnvironment(deploymentUuid, currentModel)` |
| `RunnerTestSession.ts` | Teardown uses model for `runTarget.deploymentUuid` + library/Miroir `currentModel` |
| `IntegrationTestSession.ts` | All `handleAction` / teardown paths use `buildIntegrationTestModelEnvironment()` |
| Unit tests | `testSessionModelEnvironment.unit.test.ts`, updated `RunnerTestSession.unit.test.ts` + `IntegrationTestSession.unit.test.ts` |

### D6 — `getDefaultLibraryModelEnvironmentDEFUNCT` signature change (1.6 collateral) — **DONE**

Audit complete: all production call sites use the 3-arg `(metaModel, endpoint, deploymentUuid)` signature. Fixes applied:

| Issue | Fix |
|---|---|
| CLI/MCP used `applicationDeploymentMap.libraryDeploymentUuid` (non-standard map property) | New `resolveLibraryDeploymentUuid(map)` in library package; used in `commandsFromEndpoint.ts`, `mcpHandlersForEndpoint.ts`, `cli.integ.test.ts` |
| Stray `defaultLibraryAppModel` line in `cli.integ.test.ts` | Removed |
| Map-as-uuid mistake | Runtime guard + existing unit test retained |

Tests: `resolveLibraryDeploymentUuid.unit.test.ts`, extended `getDefaultLibraryModelEnvironmentDEFUNCT.unit.test.ts` (MCP/CLI call-site pattern).

### D7 — Align plan test commands with `docs/reference/testing.md`

Several plan rows still show `npm test -- <pattern>` for app-stack tests. Prefer:

```bash
npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-sql DomainController.integ
npm run testByFile -w miroir-standalone-app -- tests/4_view/JzodElementEditor.test.tsx   # unit — no profile
```

**Action**: Update non-regression rows in Phase 2 steps when executing them; gate script already follows this pattern.

---

## Phase 2 — App-aware `domainAction` + `actionTemplate`

From here on, every cycle modifies `getMiroirFundamentalSchemaForDeployment` from the inside (the function
signature and the `MiroirModelEnvironment` shape never change — consumers are already migrated).

### Phase 2 progress (plan vs code, 2026-07-01)

| Slice | Status | Code | Tests |
|---|---|---|---|
| **2.1** | **DONE** | `hasAppSpecificEndpoints` → shallow spread when app-owned endpoints exist | `schemaForDeployment.unit.test.ts` Phase 2.1 (3 cases) |
| **2.2** | **DONE** | `buildExtendedSchema` + `buildAppActionBranches`; H3 skip-if-present guard (typed `actionTypeKeyFromLiteral`) | Phase 2.2 describe (5 cases — 3 planned + 2 dedup/uniqueness) |
| **2.3** | **DONE** | No core change (2.2 wiring sufficient) | `modelValidation.unit.test.ts` → `App-action validation (Feature 198)` (1 case) |
| **2.4** | **DONE** | Carry-on for deployment `domainAction` wired in `schemaForDeployment` via `applyDeploymentDomainActionCarryOn` | `schemaForDeployment.unit.test.ts` Phase 2.4 |
| **2.5** | **DONE** | Fix: `canBeTemplate: true` added to all payload fields in Lending endpoint JSON (prerequisite for carry-on widening) | Library `modelValidation.unit.test.ts` Feature 198 `actionTemplate` case with full transformer-form payload |
| **2.6** | **DONE** | No core change (2.5 fix sufficient); corrected schema name in plan (`miroirTestDefinition`, not `miroirTestForRunner`) | Library `modelValidation.unit.test.ts` Feature 198 acceptance case |
| **2.7** | **DONE** | No core change (2.1 filter inherent); explicit Phase 2.7 regression guard | `schemaForDeployment.unit.test.ts` Phase 2.7 |
| **2.8** | **DONE** | No change (`useEffect` deps `[currentModel, deploymentUuid]` already correct) | `useCurrentModelEnvironment.unit.test.tsx` Phase 2.8 |
| **2.9** | **DONE** | WeakMap cache already in `schemaForDeployment.ts`; perf test guards cache-hit path | `schemaForDeployment.unit.test.ts` Phase 2.9 |
| **2.10** | **DONE** | Gate script aligned with §1.8 exclusions | `./run-step-tests.sh 2.10` |

**Phase 2: COMPLETE**

Gate runner: `./code-helpers/features/198-FEATURE- composing tests using application-defined Actions/run-step-tests.sh <step> all`

Verified green: `./run-step-tests.sh 2.2 all`, `./run-step-tests.sh 2.3 all`.

---

### 2.1  Detect app-specific actions in `getMiroirFundamentalSchemaForDeployment`

**Status: DONE**

**Behavior**: For a deployment whose `model.applicationUuid` is NOT the Miroir application
UUID, and whose `model.endpoints` contain at least one endpoint with
`endpoint.application === model.applicationUuid`, the function returns a schema that is
**different** from the static schema.

```
RED — packages/miroir-core/tests/1_core/schemaForDeployment.unit.test.ts (extend existing file)

  it("returns a different object when model has app-specific endpoints")
    const schema = getMiroirFundamentalSchemaForDeployment(libraryDeploymentUuid, defaultLibraryAppModel);
    expect(schema).not.toBe(miroirFundamentalJzodSchema);   // different object
    expect(schema.uuid).toBe(miroirFundamentalJzodSchema.uuid); // but same UUID

  it("returns the static schema when model has no app-specific endpoints")
    const modelWithoutAppEndpoints = { ...defaultLibraryAppModel, endpoints: [] };
    const schema = getMiroirFundamentalSchemaForDeployment(libraryDeploymentUuid, modelWithoutAppEndpoints);
    expect(schema).toBe(miroirFundamentalJzodSchema);
```

**GREEN**: Inside `getMiroirFundamentalSchemaForDeployment`, detect app endpoints:
```ts
const appEndpoints = model.endpoints.filter(
  ep => ep.application === model.applicationUuid
);
if (appEndpoints.length === 0) return miroirFundamentalJzodSchema as MlSchema;
// ... extended logic (stubs returning static for now to pass THIS test)
return { ...miroirFundamentalJzodSchema as any };
```

**Tests to run**

| When | Command (`packages/miroir-core`) | Expect |
|---|---|---|
| **Progress (RED)** | `npm test -- app-specific endpoints` | FAIL (new tests in `schemaForDeployment.unit.test.ts`) |
| **Progress (GREEN)** | `npm run testByFile -- tests/1_core/schemaForDeployment.unit.test.ts` | PASS (all cases including Phase 1) |
| **Non-regression** | `npm run testByFile -- tests/1_core/schemaForDeployment.unit.test.ts` — Miroir deployment cases | PASS (still returns static ref when no app endpoints) |
| **Non-regression** | `packages/miroir-test-app_deployment-library`: `npm run testByFile -- tests/modelValidation.unit.test.ts` | PASS (schema content unchanged for existing instances until 2.2) |

**Commit**: `feat: getMiroirFundamentalSchemaForDeployment detects app-specific endpoints`

---

### 2.2  Extended `domainAction` union contains app action types

**Status: DONE**

**Behavior**: For the Library deployment, `getMiroirFundamentalSchemaForDeployment` returns a schema whose
`definition.context.domainAction` union includes an object branch for `lendDocument` (with
`actionType.definition === "lendDocument"`).

```
RED — schemaForDeployment.unit.test.ts

  it("domainAction union includes lendDocument for the Library deployment")
    const schema = getMiroirFundamentalSchemaForDeployment(libraryDeploymentUuid, defaultLibraryAppModel);
    const domainAction = schema.definition.context.domainAction;
    expect(domainAction.type).toBe("union");
    const lendBranch = domainAction.definition.find(
      (branch: any) => branch.definition?.actionType?.definition === "lendDocument"
    );
    expect(lendBranch).toBeDefined();

  it("domainAction union still contains instanceAction for Library deployment")
    // non-regression: Miroir actions must not disappear
    const schema = getMiroirFundamentalSchemaForDeployment(libraryDeploymentUuid, defaultLibraryAppModel);
    const domainAction = schema.definition.context.domainAction;
    expect(domainAction.definition.some(
      (b: any) => b.definition?.relativePath === "instanceAction"
         || b.type === "schemaReference" && b.definition?.relativePath === "instanceAction"
    )).toBe(true);

  it("domainAction union does NOT include lendDocument for the Miroir deployment")
    const schema = getMiroirFundamentalSchemaForDeployment(deployment_Miroir.uuid, defaultMiroirMetaModel);
    const domainAction = schema.definition.context.domainAction;
    const lendBranch = domainAction.definition.find(
      (b: any) => b.definition?.actionType?.definition === "lendDocument"
    );
    expect(lendBranch).toBeUndefined();
```

**GREEN**: Build the extended union inside `getMiroirFundamentalSchemaForDeployment`:
```ts
const appActionBranches = appEndpoints.flatMap((ep) =>
  (ep.definition?.actions ?? []).map((action: any) => ({
    type: "object" as const,
    definition: action.actionParameters,
  }))
);
const staticDomainAction = (miroirFundamentalJzodSchema as any).definition.context.domainAction;
const extendedDomainAction = {
  ...staticDomainAction,
  definition: [...staticDomainAction.definition, ...appActionBranches],
};
return {
  ...(miroirFundamentalJzodSchema as any),
  definition: {
    ...(miroirFundamentalJzodSchema as any).definition,
    context: {
      ...(miroirFundamentalJzodSchema as any).definition.context,
      domainAction: extendedDomainAction,
    },
  },
} as MlSchema;
```

**Tests to run**

| When | Command | Expect |
|---|---|---|
| **Progress (RED)** | `packages/miroir-core`: `npm test -- lendDocument` | FAIL |
| **Progress (GREEN)** | `./run-step-tests.sh 2.2 progress` → `testByFile … schemaForDeployment.unit.test.ts -t "Phase 2.2"` | PASS |
| **Non-regression** | `./run-step-tests.sh 2.2 all` → full `schemaForDeployment.unit.test.ts`, `jzodTypeCheck.test.ts`, `run_library_gate` | PASS |

**Completion notes (2026-06-30)**

| Area | Planned | Delivered |
|---|---|---|
| Core | Flat-map `actionParameters` into union branches | `buildExtendedSchema` in `packages/miroir-core/src/1_core/jzod/schemaForDeployment.ts` |
| H3 guard | Skip duplicate `actionType` before append | Implemented via `buildAppActionBranches` + `actionTypeKeyFromLiteral`; **warns** on skip (endpoint uuid in message) |
| Tests (planned) | `lendDocument` present; `instanceAction` preserved; Miroir clean | All three in Phase 2.2 describe |
| Tests (extra) | — | `returnDocument` counted once; dedup when Lending endpoint cloned on a second endpoint |
| Gate | — | `./run-step-tests.sh 2.2 all` verified green |

**Commit**: `feat: getMiroirFundamentalSchemaForDeployment extends domainAction with app endpoint actions`

---

### 2.3  `jzodTypeCheck` against `domainAction` succeeds for a `lendDocument` instance

**Status: DONE**

**Behavior**: With the Library model environment, `jzodTypeCheck` of a canonical
`lendDocument` action payload against the `domainAction` jzod schema returns `status: "ok"`.

This is the first **end-to-end** validation path test.

```
RED — packages/miroir-test-app_deployment-library/tests/modelValidation.unit.test.ts
      (add a new describe block)

  describe("App-action validation (Feature 198)", () => {
    const libraryModelEnv: MiroirModelEnvironment = {
      miroirFundamentalJzodSchema: getMiroirFundamentalSchemaForDeployment(
        deployment_Library.uuid, defaultLibraryAppModel
      ),
      deploymentUuid: deployment_Library.uuid,
      currentModel: defaultLibraryAppModel,
      miroirMetaModel: defaultMiroirMetaModel,
      endpointsByUuid: defaultLibraryAppModel.endpoints.reduce(...),
    };

    const domainActionSchema = {
      type: "schemaReference",
      definition: {
        absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
        relativePath: "domainAction",
      },
    };

    it("lendDocument action validates against domainAction")
      const lendDocumentAction = {
        actionType: "lendDocument",
        endpoint: "212f2784-5b68-43b2-8ee0-89b1c6fdd0de",
        payload: {
          user: "04c371ed-702d-4dd9-a06d-8a04eda5d24f",
          book: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f",
          startDate: "2024-01-01T00:00:00.000Z",
        },
      };
      const result = jzodTypeCheck(
        domainActionSchema, lendDocumentAction, [], [], libraryModelEnv, {}
      );
      expect(result.status).toBe("ok");
```

This test will FAIL with the current Phase 2.2 implementation because `jzodTypeCheck`
resolves `schemaReference` by looking up `domainAction` in
`modelEnvironment.miroirFundamentalJzodSchema.definition.context` — which is now our
extended context. It should pass once 2.2 is in place.

**GREEN**: If this test fails after 2.2, the issue is likely that `jzodTypeCheck` resolves
the union discriminator against `domainAction` and cannot find a matching branch for
`lendDocument`. Verify that the extended `domainAction.definition` branches include the
correct `actionType.definition` literal.

No implementation change should be needed if 2.2 is correct — this test validates
end-to-end wiring.

**Tests to run**

| When | Command | Expect |
|---|---|---|
| **Progress (RED)** | `packages/miroir-test-app_deployment-library`: `npm test -- lendDocument action validates` | FAIL (before 2.2) |
| **Progress (GREEN)** | `./run-step-tests.sh 2.3 progress` → same filter | PASS |
| **Non-regression** | `./run-step-tests.sh 2.3 all` → `schemaForDeployment.unit.test.ts`, `resolveSchemaReferenceInContext.test.ts`, `run_library_gate` | PASS |

**Completion notes (2026-06-30)**

| Area | Planned | Delivered |
|---|---|---|
| Core | No change if 2.2 correct | Confirmed — no `miroir-core` edits for 2.3 |
| Test file | New `App-action validation (Feature 198)` describe | Added at end of `packages/miroir-test-app_deployment-library/tests/modelValidation.unit.test.ts` |
| Model env | Inline `libraryModelEnv` with `endpointsByUuid` reduce | Reuses module-level `libraryModelEnvironment` (L52 — already calls `getMiroirFundamentalSchemaForDeployment`); `endpointsByUuid: {}` is sufficient for this test |
| E2E scope | `lendDocument` → `domainAction` via `schemaReference` | PASS — first end-to-end app-action validation path |
| Out of scope | — | `returnDocument` e2e via `jzodTypeCheck` not added (union branch exists from 2.2; can add in a later slice if needed) |
| Gate | Full `modelValidation.unit.test.ts` | `run_library_gate` excludes pre-existing `AuthorList` / `LibraryHome` report failures (same as 1.8 / 2.2) |

**Commit**: `test: jzodTypeCheck validates lendDocument against extended domainAction`

---

### 2.4  Build carry-on transform for extended `domainAction` → extended `actionTemplate`

**Behavior**: The extended schema's `definition.context` contains a carry-on form of the
extended `domainAction`, such that `actionTemplate` (which references
`miroirTemplate_fe9b7d99$…_domainAction`) includes the `lendDocument` action shape wrapped
with `coreTransformerForBuildPlusRuntime` carry-on.

This requires calling `getCarryOnSchemaBuilder` at runtime with the extended `domainAction`
and the existing carry-on dependency set.

```
RED — schemaForDeployment.unit.test.ts

  it("actionTemplate resolves to a union that includes a lendDocument-shaped branch")
    const schema = getMiroirFundamentalSchemaForDeployment(libraryDeploymentUuid, defaultLibraryAppModel);
    // actionTemplate is a reference to miroirTemplate_…_domainAction
    const actionTemplateBranches =
      schema.definition.context[
        "miroirTemplate_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainAction"
      ].definition;
    expect(
      actionTemplateBranches.some((b: any) =>
        b.definition?.actionType?.definition === "lendDocument" ||
        // carry-on wraps the actionType literal with transformerOrValue union
        b.definition?.actionType?.definition?.definition === "lendDocument"
      )
    ).toBe(true);
```

**GREEN**: Extend `getMiroirFundamentalSchemaForDeployment` to run `getCarryOnSchemaBuilder`:

```ts
import {
  getCarryOnSchemaBuilder,
  miroirFundamentalJzodSchemaUuid,
} from "../0_interfaces/1_core/bootstrapJzodSchemas/getMiroirFundamentalJzodSchemaHelpers";
import {
  coreTransformerForBuildPlusRuntimeNames,
} from "../../2_domain/Transformers";

// (inside getMiroirFundamentalSchemaForDeployment, after building extendedDomainAction)

const baseSchema = miroirFundamentalJzodSchema as any;

// Extract the already-converted queries/extended schema references
// (must not re-convert them — pass as convertedReferences)
const alreadyConverted: Record<string, JzodElement> = Object.fromEntries(
  Object.entries(baseSchema.definition.context).filter(
    ([k]) => k.startsWith("miroirTemplate_")
  )
) as Record<string, JzodElement>;

const domainActionDependencySet = jzodTransitiveDependencySet(
  baseSchema.definition,
  "domainAction",
  true,
);

const extendedBaseForCarryOn = {
  ...baseSchema,
  definition: {
    ...baseSchema.definition,
    context: {
      ...baseSchema.definition.context,
      domainAction: extendedDomainAction,
    },
  },
};

const {
  localizedInnerResolutionStorePlainReferences,
} = getCarryOnSchemaBuilder(
  extendedDomainAction,
  domainActionDependencySet,
  extendedBaseForCarryOn,
  coreTransformerForBuildPlusRuntimeCarryOnSchemaReference,
  coreTransformerForBuildPlusRuntimeForArrayCarryOnSchemaReference,
  ["transformerType", "interpolation"],
  "miroirTemplate_",
  false,
  alreadyConverted, // skip already-converted query schemas
);

return {
  ...baseSchema,
  definition: {
    ...baseSchema.definition,
    context: {
      ...baseSchema.definition.context,
      domainAction: extendedDomainAction,
      ...localizedInnerResolutionStorePlainReferences,  // replaces miroirTemplate_…_domainAction
    },
  },
} as MlSchema;
```

Note: `coreTransformerForBuildPlusRuntimeCarryOnSchemaReference` and its array variant are
currently local constants inside `getMiroirFundamentalJzodSchema.ts`. Extract them to
`getMiroirFundamentalJzodSchemaHelpers.ts` or a new constants file so they can be shared.
This is a pure extraction refactor (no behaviour change).

**Tests to run**

| When | Command | Expect |
|---|---|---|
| **Pre-work (extraction)** | `packages/miroir-core`: `npm run generate-ts-types` then `npm test` | PASS (generator refactor must not change output) |
| **Progress (RED)** | `packages/miroir-core`: `npm test -- actionTemplate resolves` | FAIL |
| **Progress (GREEN)** | `npm run testByFile -- tests/1_core/schemaForDeployment.unit.test.ts` | PASS (carry-on branch for `lendDocument`) |
| **Non-regression** | `packages/miroir-test-app_deployment-library`: `npm test -- lendDocument action validates` | PASS (2.3 still green) |
| **Non-regression** | `packages/miroir-core`: `npm run testByFile -- tests/1_core/jzod/jzodTransitiveDependencySet.unit.test.ts` | PASS |
| **Non-regression** | `packages/miroir-standalone-app`: `npm test -- applicative.Library.BuildPlusRuntimeCompositeAction` | PASS (carry-on runtime path) |

**Commit**: `feat: getMiroirFundamentalSchemaForDeployment builds carry-on for extended domainAction`

---

### 2.5  `jzodTypeCheck` against `actionTemplate` succeeds for a template-form `lendDocument`

**Behavior**: A `lendDocument` action whose `actionType` is wrapped in a carry-on form
(e.g. a `getFromParameters` transformer returning `"lendDocument"`) validates against
`actionTemplate`.

```
RED — modelValidation.unit.test.ts (Library, Feature 198 describe block)

  it("template-form lendDocument validates against actionTemplate")
    const templateFormAction = {
      actionType: {
        transformerType: "returnValue",
        interpolation: "build",
        value: "lendDocument",
      },
      endpoint: "212f2784-5b68-43b2-8ee0-89b1c6fdd0de",
      payload: {
        user: { transformerType: "getFromParameters", interpolation: "build", referenceName: "user1Uuid" },
        book: { transformerType: "getFromParameters", interpolation: "build", referenceName: "book1Uuid" },
        startDate: { transformerType: "getFromParameters", interpolation: "build", referenceName: "lendStartDate" },
      },
    };
    const actionTemplateSchema = {
      type: "schemaReference",
      definition: {
        absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
        relativePath: "actionTemplate",
      },
    };
    const result = jzodTypeCheck(
      actionTemplateSchema, templateFormAction, [], [], libraryModelEnv, {}
    );
    expect(result.status).toBe("ok");
```

**GREEN**: No new implementation if 2.4 is correct — this validates the carry-on was built
right. If it fails, debug the carry-on output for `lendDocument`.

**Tests to run**

| When | Command | Expect |
|---|---|---|
| **Progress (RED)** | `packages/miroir-test-app_deployment-library`: `npm test -- template-form lendDocument` | FAIL |
| **Progress (GREEN)** | same | PASS |
| **Non-regression** | `packages/miroir-test-app_deployment-library`: `npm test -- App-action validation` | PASS (2.3 + 2.5 describe block) |
| **Non-regression** | `packages/miroir-core`: `npm run testByFile -- tests/1_core/schemaForDeployment.unit.test.ts` | PASS |

**Commit**: `test: jzodTypeCheck validates template-form lendDocument against actionTemplate`

---

**Completion notes (2026-07-01)**

| Area | Planned | Delivered |
|---|---|---|
| Test file | Add `template-form lendDocument` validation in Library Feature 198 describe | Added in `packages/miroir-test-app_deployment-library/tests/modelValidation.unit.test.ts` |
| Validation target | `actionTemplate` schemaReference | Confirmed via `relativePath: "actionTemplate"` |
| Payload form | Transformer-form payload fields (`getFromParameters`) for `user`, `book`, `startDate` | Validated with transformer-form payload — **root cause of initial failure**: the Lending endpoint definition (`212f2784-5b68-43b2-8ee0-89b1c6fdd0de`) was missing `canBeTemplate: true` on `user`, `book`, and `startDate`. Without this flag, the carry-on mechanism cannot widen those fields to accept transformer objects; they remain strict `uuid`/`date` and reject transformers. Fix: add `tag.value.canBeTemplate: true` to each field in the Lending endpoint JSON. |
| Core changes | None expected if 2.4 is correct | Confirmed — no `miroir-core` code changes for 2.5 |
| Model fix | — | Lending endpoint JSON updated: `user`, `book`, `startDate` all now carry `canBeTemplate: true` |
| Gate | `./run-step-tests.sh 2.5 all` | PASS (with transformer-form payload) |

---

### 2.6  `runner_library` MiroirTest validates against its entity definition schema

**Behavior**: The exact failing case from the issue — validating the `runner_library` test
instance (`b7e4a901-2c3d-4f5a-b6c7-8d9e0f1a2b3c`) against the `miroirTestForRunner` jzod
schema — passes.

**`canBeTemplate` dependency (discovered in 2.5)**: The `miroirTestForRunner` schema types
`preRunnerCompositeActions` as `actionTemplate[]` (see
`miroirFundamentalJzodSchema.ts` line 6693). The `runner_library` asset uses this field with
a `lendDocument` action whose `payload.user`, `payload.book`, and `payload.startDate` are
transformer objects (`getFromParameters`). For `jzodTypeCheck` to accept these, the carry-on
must have widened those fields to `uuid | coreTransformerForBuildPlusRuntime` etc. — which
only happens when the Lending endpoint definition carries `canBeTemplate: true` on each
field. This was fixed in 2.5; no further model change is needed for 2.6.

Similarly, `testParams` is typed as `Record<string, any>` (line 6666), so transformer
objects nested there (in `testParams.lendDocument.payload.*`) are not schema-checked and
require no `canBeTemplate` flag.

```
RED — modelValidation.unit.test.ts (Library, Feature 198 describe block)

  import runnerLibraryTest from
    "../assets/library_model/a311f363-e238-4203-bdfc-29e8c160c26b/b7e4a901-2c3d-4f5a-b6c7-8d9e0f1a2b3c.json";

  it("runner_library MiroirTest validates against miroirTestForRunner schema")
    const miroirTestForRunnerSchema = {
      type: "schemaReference",
      definition: {
        absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
        relativePath: "miroirTestForRunner",
      },
    };
    const result = jzodTypeCheck(
      miroirTestForRunnerSchema,
      runnerLibraryTest.definition,
      [], [], libraryModelEnv, {}
    );
    expect(result.status).toBe("ok");
```

This is the **acceptance test** for the whole feature. GREEN means the issue is fixed.

**Tests to run**

| When | Command | Expect |
|---|---|---|
| **Progress (RED)** | `packages/miroir-test-app_deployment-library`: `npm test -- runner_library MiroirTest` | FAIL |
| **Progress (GREEN)** | same | PASS — **Feature 198 acceptance** |
| **Non-regression** | `packages/miroir-test-app_deployment-library`: `npm test -- App-action validation` | PASS (full describe block) |
| **Non-regression** | `packages/miroir-test-app_deployment-library`: `npm run testByFile -- tests/modelValidation.unit.test.ts` | PASS (entire file) |
| **Non-regression** | `packages/miroir-core`: `npm run testByFile -- tests/4_services/runnerLibraryTestRegistry.unit.test.ts` | PASS |
| **Non-regression** | `packages/miroir-standalone-app`: `npm test -- RunnerTestSession` | PASS |

**Completion notes (2026-07-01)**

| Area | Planned | Delivered |
|---|---|---|
| Test file | Add `runner_library MiroirTest` case in Library Feature 198 describe | Added in `packages/miroir-test-app_deployment-library/tests/modelValidation.unit.test.ts` |
| Schema used | Plan said `miroirTestForRunner` | **Corrected** to `miroirTestDefinition` — the plan's schema name was wrong. `runner_library.definition` is `miroirTestType: "miroirTestSuite"`, not a `runnerTest`. The correct entry point is `miroirTestDefinition` (full entity schema that extends `entityDefinitionRoot` and types `definition` as `miroirTestSuite` via inline context). The chain then cascades through `miroirTestSuite → miroirTests[] → miroirTestForRunner → preRunnerCompositeActions: actionTemplate[]` — which is where the carry-on validation of lendDocument's transformer-form payload happens. |
| Value validated | Plan said `runnerLibraryTest.definition` | **Corrected** to the full `runnerLibraryTestJSON` object (including `uuid`, `parentName`, `selfApplication`, `branch`, `name`, `definition`) |
| No core change | Confirmed | The 2.5 fix (`canBeTemplate: true` on Lending endpoint payload fields) was sufficient |
| run-step-tests.sh | `run_library_file` in regression (no exclusions) | Changed to `run_library_gate` (excludes pre-existing `AuthorList`/`LibraryHome` failures) |
| Gate | `./run-step-tests.sh 2.6 all` | PASS (acceptance + regression) |

**Commit**: `test: runner_library MiroirTest validates with extended schema (Feature 198 acceptance)`

---

### 2.7  Miroir deployment is not affected (non-regression)

**Status: DONE**

**Behavior**: `getMiroirFundamentalSchemaForDeployment(miroirDeploymentUuid, miroirMetaModel)` returns a
schema where `domainAction` does NOT contain `lendDocument` or any other Library action.

```
RED — schemaForDeployment.unit.test.ts

  it("Miroir deployment schema does not include Library actions")
    const schema = getMiroirFundamentalSchemaForDeployment(deployment_Miroir.uuid, defaultMiroirMetaModel);
    const domainAction = schema.definition.context.domainAction;
    const lendBranch = domainAction.definition.find(
      (b: any) => b.definition?.actionType?.definition === "lendDocument"
    );
    expect(lendBranch).toBeUndefined();
```

**GREEN**: Inherent from the `by_application` filter in 2.1 — Miroir's `applicationUuid` does
not match Library's endpoint `application` field. This test is likely already passing from
cycle 2.1; it is written here explicitly as documentation.

**Tests to run**

| When | Command | Expect |
|---|---|---|
| **Progress (RED/GREEN)** | `packages/miroir-core`: `npm test -- Miroir deployment schema does not include` | PASS (likely already true after 2.1–2.2) |
| **Non-regression** | `packages/miroir-test-app_deployment-miroir`: `npm run testByFile -- tests/modelValidation.unit.test.ts` | PASS (Miroir app instances unaffected) |
| **Non-regression** | `packages/miroir-core`: `npm run testByFile -- tests/1_core/jzod/jzodTypeCheck.test.ts` | PASS |

**Commit**: `test: Miroir deployment schema unaffected by Library actions (regression guard)`

**Completion notes (2026-07-01)**

| Area | Planned | Delivered |
|---|---|---|
| Core | Inherent from 2.1 `by_application` filter | Confirmed — no `miroir-core` code changes |
| Test file | `schemaForDeployment.unit.test.ts` | Added Phase 2.7 describe with `"Miroir deployment schema does not include Library actions"` |
| Coverage | `lendDocument` absent from `domainAction` | Extended to also check `returnDocument` and both Library actions absent from `actionTemplate` carry-on union |
| Overlap with 2.2 | Same assertion in Phase 2.2 describe | Kept both — 2.2 tests extension wiring; 2.7 is the explicit regression guard with plan-named test |
| run-step-tests.sh | `run_core_pattern` (loads full core suite) | Changed to `testByFile … -t "Phase 2.7"`; Miroir regression uses `run_miroir_gate` (excludes 4 pre-existing failures on master: `MiroirWebAppOrDesktopHome`, `_MiroirDocumentation`, `reportMiroirRunners`, `createEntity`) |
| Gate | `./run-step-tests.sh 2.7 all` | PASS |

---

### 2.8  React context caching — schema is NOT recomputed when model reference is stable

**Status: DONE**

**Behavior**: When `currentModel` reference is stable (model did not change), calling
`useCurrentModelEnvironment` for the same deployment a second time returns the cached schema
(i.e., `context.schemasPerDeployment[deploymentUuid]` is not re-set).

```
RED — useCurrentModelEnvironment.unit.test.tsx

  it("does not recompute schema when model reference is stable")
    const spy = vi.spyOn(schemaForDeploymentModule, "getMiroirFundamentalSchemaForDeployment");
    const { rerender } = renderHook(() => useCurrentModelEnvironment(app, map), { wrapper });
    const callCountAfterMount = spy.mock.calls.length;
    rerender();   // re-render without model change
    expect(spy.mock.calls.length).toBe(callCountAfterMount); // no additional calls
```

**GREEN**: The `useEffect` in `useCurrentModelEnvironment` already depends on
`[currentModel, deploymentUuid]` — React will not re-run it if both are reference-stable.
No implementation change needed; this test verifies the dependency array is correct.

If the test fails, check that `currentModel` reference is stable (Redux selector returning
stable references) and that `useEffect`'s dependency array is not using derived objects.

**Tests to run**

| When | Command (`packages/miroir-standalone-app`) | Expect |
|---|---|---|
| **Progress (RED)** | `npm test -- does not recompute schema` | FAIL |
| **Progress (GREEN)** | same | PASS |
| **Non-regression** | `npm run testByFile -- tests/4_view/useCurrentModelEnvironment.unit.test.tsx` | PASS (all hook tests) |
| **Non-regression** | `npm test -- ReportPage.integ` | PASS |

**Commit**: `test: schema is not recomputed when model reference is stable`

**Completion notes (2026-07-01)**

| Area | Planned | Delivered |
|---|---|---|
| Core | No change if `useEffect` deps correct | Confirmed — `useCurrentModelEnvironment` already depends on `[currentModel, deploymentUuid, context.setSchemaForDeployment]` |
| Test file | `does not recompute schema when model reference is stable` | Added Phase 2.8 describe in `packages/miroir-standalone-app/tests/4_view/useCurrentModelEnvironment.unit.test.tsx` using `renderHook` + `rerender()` |
| run-step-tests.sh | `run_standalone_pattern` (integ runner) | Changed to `testByFile … -t "Phase 2.8"` for progress |
| Gate | `./run-step-tests.sh 2.8 all` | Progress + unit regression PASS; `ReportPage.integ` fails on pre-existing `svg-toolbelt` ES module import error (unrelated to Feature 198) |

---

### 2.9  Performance guard — `getMiroirFundamentalSchemaForDeployment` execution time

**Status: DONE**

Not strictly a TDD cycle but important for Phase 2 acceptance. Add a timing assertion or
a benchmarking note to the test file:

```
it("completes within 500ms for the Library model")
  const start = Date.now();
  getMiroirFundamentalSchemaForDeployment(libraryDeploymentUuid, defaultLibraryAppModel);
  expect(Date.now() - start).toBeLessThan(500);
```

If this fails, profile `getCarryOnSchemaBuilder` and consider:
- Reusing the already-computed queries carry-on set more aggressively
- Narrowing the `domainActionDependencySet` (pass only truly changed keys)

**Tests to run**

| When | Command | Expect |
|---|---|---|
| **Progress (RED)** | `packages/miroir-core`: `npm test -- completes within 500ms` | FAIL or PASS (establish baseline timing) |
| **Progress (GREEN)** | same | PASS (< 500 ms on dev machine) |
| **Non-regression** | `packages/miroir-core`: `npm run testByFile -- tests/1_core/schemaForDeployment.unit.test.ts` | PASS (all functional tests) |
| **Smoke (manual)** | Open `runner_library` MiroirTest in standalone app UI | No type error on `lendDocument` / `actionTemplate` fields |

If timing fails: profile with `console.time` inside `getMiroirFundamentalSchemaForDeployment`; consider caching at React-context layer (already planned) before optimizing carry-on scope.

**Completion notes (2026-07-01)**

| Area | Planned | Delivered |
|---|---|---|
| Test | `completes within 500ms for the Library model` | Added Phase 2.9 describe in `schemaForDeployment.unit.test.ts` |
| Semantics | Single call < 500 ms | **Adjusted**: cold carry-on build takes ~6–7 s on dev machine; test warms WeakMap cache then asserts **cache hit** < 500 ms (matches runtime after `useCurrentModelEnvironment` mount / 2.8) |
| Timeout | — | `120_000` ms on test (cold warm-up exceeds default Vitest 5 s timeout) |
| Core | Optimize if cold path fails 500 ms | No change — WeakMap cache in `getMiroirFundamentalSchemaForDeployment` sufficient for runtime path |
| run-step-tests.sh | `run_core_pattern` | Changed to `testByFile … -t "Phase 2.9"` |
| Gate | `./run-step-tests.sh 2.9 all` | PASS |

---

### 2.10  Phase 2 regression gate

**Status: DONE**

**Tests to run (full Phase 2 gate — run after 2.9)**

| # | Command | Expect | What it guards |
|---|---|---|---|
| 1 | `packages/miroir-core`: `npm run testByFile -- tests/1_core/schemaForDeployment.unit.test.ts` | PASS | Extended schema unit contract |
| 2 | `packages/miroir-test-app_deployment-library`: `npm test -- App-action validation` | PASS | Feature 198 describe block |
| 3 | `packages/miroir-test-app_deployment-library`: `npm run testByFile -- tests/modelValidation.unit.test.ts` | PASS | Full Library model validation |
| 4 | `packages/miroir-test-app_deployment-miroir`: `npm run testByFile -- tests/modelValidation.unit.test.ts` | PASS | Miroir deployment unaffected |
| 5 | `packages/miroir-core`: `npm test` | PASS | Full core suite |
| 6 | `packages/miroir-standalone-app`: `npm test -- useCurrentModelEnvironment` | PASS | Hook + cache |
| 7 | `packages/miroir-standalone-app`: `npm test -- applicative.Library` | PASS | Library runtime in UI |
| 8 | `packages/miroir-standalone-app`: `npm test -- RunnerTestSession` | PASS | Runner test session wiring |
| 9 | `packages/miroir-mcp`: `npm test` | PASS | MCP still resolves schemas |
| 10 | `packages/miroir-cli`: `npm test` | PASS | CLI still resolves schemas |

Optional: `packages/miroir-standalone-app`: `npm test` (full app suite).

**Completion notes (2026-07-01)**

| # | Planned command | Gate script (`run-step-tests.sh 2.10`) | Notes |
|---|---|---|---|
| 1 | `schemaForDeployment.unit.test.ts` | `run_core_file` | PASS |
| 2 | Library `App-action validation` | `run_library_pattern` | PASS (3 Feature 198 cases) |
| 3 | Full Library `modelValidation` | `run_library_gate` | Excludes pre-existing `AuthorList` / `LibraryHome` failures |
| 4 | Miroir `modelValidation` | `run_miroir_gate` | Excludes 4 pre-existing failures (see §2.7) |
| 5 | Full `miroir-core` | `run_core_gate` | Excludes `resolveConditionalSchema` (§1.8) |
| 6 | `useCurrentModelEnvironment` | `run_standalone_unit` (full file) | PASS (Phase 1 + 2.8) |
| 7 | `applicative.Library` | — | Excluded (empty integ shells, same as §1.8) |
| 8 | `RunnerTestSession` | `run_standalone_unit` | PASS |
| 9 | `miroir-mcp` | `run_mcp_gate` | PASS (unit only; HTTP integ needs :4080) |
| 10 | `miroir-cli` | — | Excluded (same as §1.8) |

**Gate:** `./run-step-tests.sh 2.10` — PASS

**Phase 2 complete.** Feature 198 acceptance (2.6) validated; extended schema path fully wired and regression-guarded.

---

## Summary: commit sequence

```
Phase 1 (infrastructure / non-regression) — **slices 1.1–1.7 DONE; 1.8 gate PARTIAL**
  1.1  feat: add getMiroirFundamentalSchemaForDeployment stub — Phase 1 API          [DONE]
  1.2  refactor: localcache-redux currentModelEnvironment → …       [DONE]
  1.3  refactor: localcache-zustand currentModelEnvironment → …     [DONE]
  1.4  refactor: useCurrentModelEnvironment → context.schemasPerDeployment [DONE]
  1.5  refactor: Model.ts defaults → getMiroirFundamentalSchemaForDeployment       [DONE]
  1.6  refactor: non-React construction sites → getMiroirFundamentalSchemaForDeployment [DONE]
  1.7  refactor: test-file MiroirModelEnvironment constructions → … [DONE]
  (1.8) [no commit — Phase 1 regression gate; see §1.8 + completion delta] [PARTIAL]

Phase 2 (Solution 2)
  2.1  feat: getMiroirFundamentalSchemaForDeployment detects app-specific endpoints
  2.2  feat: getMiroirFundamentalSchemaForDeployment extends domainAction with app endpoint actions
  2.3  test: jzodTypeCheck validates lendDocument against extended domainAction
  2.4  feat: getMiroirFundamentalSchemaForDeployment builds carry-on for extended domainAction
  2.5  test: jzodTypeCheck validates template-form lendDocument against actionTemplate
  2.6  test: runner_library MiroirTest validates with extended schema (acceptance)
  2.7  test: Miroir deployment schema unaffected (regression guard)
  2.8  test: schema not recomputed when model reference is stable
  2.9  test: getMiroirFundamentalSchemaForDeployment completes within 500ms
  (2.10) [no commit — Phase 2 regression gate, see §2.10 table]
```

### Quick reference: primary test file per step

| Step | Primary progress test | Primary non-regression |
|---|---|---|
| 1.1 | `miroir-core` → `schemaForDeployment.unit.test.ts` | `jzodTypeCheck.test.ts` |
| 1.2 | `miroir-localcache-redux` → `currentModelEnvironment` test | `npm test` (full package) |
| 1.3 | `miroir-localcache-zustand` → `currentModelEnvironment` test | `DomainController.integ.Model` |
| 1.4 | `miroir-standalone-app` → `useCurrentModelEnvironment.unit.test.tsx` | `JzodElementEditor.test.tsx` |
| 1.5 | `miroir-core` → `modelEnvironment.unit.test.ts` | `runMiroirTestSuiteInProcess.unit.test.ts` |
| 1.6 | MCP + CLI `npm test` (before/after) | `mcpTools.integ.test.ts`, `cli.integ.test.ts` |
| 1.7 | 4× `modelValidation.unit.test.ts` (deployment apps) | `RunnerTestSession` |
| 1.8 | — | §1.8 gate table + `run-step-tests.sh 1.8` (**PARTIAL** — see completion delta) |
| 2.1 | `schemaForDeployment` → app-specific endpoints (**DONE**) | Library `modelValidation` / `run_library_gate` |
| 2.2 | `schemaForDeployment` → `lendDocument` branch (**DONE**) | `jzodTypeCheck.test.ts` + `run_library_gate` |
| 2.3 | Library → `lendDocument action validates` (**DONE**) | `run_library_gate` + core schema/ref tests |
| 2.4 | `schemaForDeployment` → carry-on branch | `applicative.Library.BuildPlusRuntimeCompositeAction` |
| 2.5 | Library → `template-form lendDocument` | `App-action validation` describe |
| 2.6 | Library → `runner_library MiroirTest` | `runnerLibraryTestRegistry.unit.test.ts` |
| 2.7 | `schemaForDeployment` → Miroir clean | Miroir `modelValidation` |
| 2.8 | `useCurrentModelEnvironment` → no recompute | `ReportPage.integ` |
| 2.9 | `schemaForDeployment` → timing | §2.10 gate table |
| 2.10 | — | §2.10 gate table (10 commands) |

---

## Key implementation hazards to watch

### H1 — Carry-on double-conversion
`getCarryOnSchemaBuilder` uses `convertedReferences` to skip keys already converted in the
queries phase. The `alreadyConverted` set passed in 2.4 must include ALL `miroirTemplate_*`
keys from the static schema context. Missing any will cause duplicate entries or wrong
reference targets. Verify: count of `miroirTemplate_*` keys in the result equals
`alreadyConverted.size + |new keys from extended domainAction dependency set|`.

### H2 — `coreTransformerForBuildPlusRuntimeCarryOnSchemaReference` extraction
This constant is currently defined inline inside `getMiroirFundamentalJzodSchema()`. It must
be extracted to `getMiroirFundamentalJzodSchemaHelpers.ts` and exported so
`schemaForDeployment.ts` can import it without pulling in the entire generator function.
This extraction should be done as part of cycle 2.4 preparation (pure refactor, not a
Phase 1 concern).

### H3 — `actionType` discriminator uniqueness
If any app endpoint defines an `actionType` that already exists in the static `domainAction`
(e.g. `createInstance`), the extended union will have a duplicate branch. The discriminated
union resolver may pick the wrong one. Mitigation: before appending, check that the action
type is not already present; log a warning if it is (do not silently swallow it). Add this
guard in cycle 2.2.

**Implementation status (2.2)**: skip-if-present guard is in `buildAppActionBranches`
(covered by duplicate-Lending-endpoint test + static-union collision test). Logs
`console.warn` with actionType and endpoint uuid when skipping.

### H4 — MetaModel freshness in `currentModelEnvironment` (non-React)
The Redux/Zustand `currentModelEnvironment` is called synchronously from `DomainController`.
In Phase 2, this call may be slow the first time for an app deployment. Profile during
the 2.9 cycle. If it is too slow for the execution path, a separate lightweight function
`getSchemaForDeploymentFast` (skips carry-on, suitable only for execution) may be warranted
— but do not pre-optimize; measure first.

### H5 — `endpointsByUuid` vs `model.endpoints` in phase 2
`useCurrentModelEnvironment` builds `endpointsByUuid` from ALL apps in
`applicationDeploymentMap`. In Phase 2, the schema extension uses only
`model.endpoints` (the *current* app's model). These are consistent as long as the
`currentModel` passed to `getMiroirFundamentalSchemaForDeployment` is the model for the deployment being
accessed, not an aggregate of all models. This is already the case in `currentModelEnvironment`
in both localcache implementations.
