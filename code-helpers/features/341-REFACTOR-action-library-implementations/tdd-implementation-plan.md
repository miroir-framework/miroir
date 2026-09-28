# Issue #341 — TDD Implementation Plan

> Vertical TDD slices (RED → GREEN each), integration-first per `docs/contributing/testing.md`:
> tests exercise the real `DomainController` through its public entry point `handleAction`, and the
> Miroir Endpoint action definitions (JSON) as the applicative interface. The existing
> `action.domainController.*` MiroirTest suites are the behavioural safety net for every migrated
> Endpoint. No mocks; the only boundary fake is the outbound fetch already injectable with
> `setOutboundFetch`. The tracer bullet proves one Miroir action running from its
> `libraryImplementation` reference, end to end, without a `case` in `DomainController`.
>
> **Execution model:** human-in-the-loop. No slice contains a commit step — commits happen
> only when the user explicitly asks. Each slice ends with its Validation commands; on
> success its Realization summary is appended and its Status flips to ✅ DONE.

Analysis: [`./analysis.md`](./analysis.md) · Issue: https://github.com/miroir-framework/miroir/issues/341
Working branch: `claude/action-library-implementations-1jkrjp` (from `_integration` 9ae1aa9)

**Resume note:** Slices 0-1 DONE; next is Slice 2 (DomainEndpoint).

---

## Scope

- A map of library action implementations (`handleAction_<actionType>` → handler) in `packages/miroir-core/src/3_controllers/`.
- `handleApplicationAction` runs `libraryImplementation` actions and becomes the single entry for Miroir actions too.
- The 33 in-scope Miroir Endpoint actions (analysis §3.1) declare `actionImplementation: libraryImplementation`; `entity_DuplicateAttribute` keeps its composite template.
- `handleActionInternal`'s switch, `handleModelAction`'s dispatch switch and the redundant lists in the composite interpreters are removed.
- Guard test on Endpoint action implementations (D5, scoped).
- Autocommit and log phase become action-definition attributes (D4).

This plan does **not** migrate Persistence / LocalCache actions, touch the 5 declared-but-unimplemented actions (Test, Menu, Application Endpoints; removal is #342), touch `ActionRunner.ts`, or the commit-replay switch (analysis §2, §3.3).

---

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Characterize dispatch and Endpoint inventory | ✅ | `actionImplementations.341.phase0.unit.test.ts` + baseline `action.domainController.*` |
| 1 | Tracer: `prepareOpenApiDocument` runs from its library reference | ✅ | `actionImplementations.341.phase1.unit.test.ts` |
| 2 | DomainEndpoint actions | ⬜ | `action.scenario.*`, `integ-action-284-*`, phase1 test extended |
| 3 | InstanceEndpoint actions | ⬜ | `action.domainController.dataCrud*` |
| 4 | ModelEndpoint actions | ⬜ | `action.domainController.modelCrud*`, `freezeApplicationVersion` |
| 5 | StoreManagement and UndoRedo actions | ⬜ | every integ session (open/close store), `modelUndoRedo` |
| 6 | QueryEndpoint actions reachable through `handleAction` | ⬜ | `actionImplementations.341.phase6.integ.test.ts` |
| 7 | One dispatch path: remove the switches, scoped guard on | ⬜ | phase0 guard (b) + nonreg:filesystem |
| 8 | Autocommit and log phase from action definitions | ⬜ | phase8 unit test vs Slice 0 lock |
| 9 | Nonreg, docs, cleanup, AC | ⬜ | nonreg:filesystem (shared runner) + tracer narrative |

---

## Locked implementation defaults

Confirmed with A on 2026-09-28 (analysis decision record).

| Decision | Choice |
|---|---|
| D1 Scope | Model, Instance, Domain, StoreManagement, UndoRedo, Query Endpoints; others later |
| D2 Entry point | `handleApplicationAction` for every application; Miroir Endpoints resolve from bundled `defaultEndpointsByUuid`, no store lookup |
| D3 Granularity | One identifier per action, `handleAction_<actionType>` |
| D4 Cross-cutting | Action-definition attributes, Slice 8 |
| D5 Guard | (a) declared identifiers resolve, all Endpoints, from Slice 1; (b) every action of an in-scope Endpoint declares an implementation, from Slice 7 |
| D6 Map location | New file `3_controllers/ActionImplementations.ts`; handlers get the controller through a narrow interface |

**Open point flagged to A** (default accepted 2026-09-28): `bundleAction` and `probeExternalService` have no `endpoint` attribute in their schema (`BundleAction` in `miroirFundamentalType.ts`; `probeExternalService` is not in the `DomainAction` union at all, cast `as any`), so they cannot be routed by Endpoint. Default: add them to StoreManagementEndpoint (`bundleAction`) and DomainEndpoint (`probeExternalService`) with an `endpoint` literal, in Slice 7. Alternative: keep a two-case fallback for actions without `endpoint`.

---

## Allocated UUIDs / keys

| Artefact | Value |
|---|---|
| Implementation map | `packages/miroir-core/src/3_controllers/ActionImplementations.ts`, export `miroirActionImplementations` |
| Handler interface | `ActionImplementationHandler` (same file) |
| Controller seam | `DomainControllerActionHost` (interface, `0_interfaces/3_controllers/`) |
| Identifiers | `handleAction_<actionType>` for the 33 actions of analysis §3.1, plus `handleAction_bundleAction`, `handleAction_probeExternalService` |
| Issue test dir | `packages/miroir-core/tests/3_controllers/issues/341-action-library-implementations/` |
| Issue integ test | `packages/miroir-standalone-app/tests/3_controllers/issues/341-action-library-implementations/actionImplementations.341.phase6.integ.test.ts` |
| MiroirTest suites | none new: the existing `action.domainController.*` and `action.scenario.*` suites are the proof |
| Nonreg step | none new (Slice 9 moves the guard into a feature-named unit file already run by `unit-miroir-core`) |

---

## Test execution conventions

| Purpose | Command |
|---|---|
| Issue vitest (miroir-core) | `RUN_TEST=actionImplementations.341 npm run testByFile -w miroir-core -- actionImplementations.341` |
| Issue integ vitest | `VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-filesystem.json npm run testByFile -w miroir-standalone-app -- actionImplementations.341.phase6` |
| Action MiroirTests | `npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-filesystem --suites action.domainController.dataCrud --mode integ` (one per suite key) |
| Miroir deployment validation | `npm run testByFile -w miroir-test-app_deployment-miroir -- tests/modelValidation.unit.test.ts` |
| Endpoint JSON rebuild | `npm run build -w miroir-test-app_deployment-miroir && npm run build -w miroir-core` |
| Schema rebuild (Slice 8 only) | `npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core` |
| Type check | `npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json` |
| Nonreg | `npm run nonreg:unit -- --runner shared`, `npm run nonreg:filesystem -- --runner shared` |

Vitest rather than MiroirTest for Slices 0, 1, 6, 8: they assert on `DomainController` dispatch results and on Endpoint assets as a whole; an `actionTest` cannot expect an Action failure (docs/reference/testing.md) nor inspect a returned query result from `handleAction`.

---

## Slice 0 — Characterize dispatch and Endpoint inventory

**Status:** ✅ DONE (2026-09-28)

### Goal

Lock the facts later slices change, so each change shows up as a deliberate test edit.

### 0.1 RED → GREEN — inventory and cross-cutting lists

**Test:** `packages/miroir-core/tests/3_controllers/issues/341-action-library-implementations/actionImplementations.341.phase0.unit.test.ts`

Behavior asserted (read from the bundled `defaultMiroirMetaModel.endpoints`, not from copies):
- the 11 Miroir Endpoints and their 47 action types, per Endpoint (analysis §3.1);
- exactly one action (`entity_DuplicateAttribute`) has `actionImplementation`, of type `compositeActionTemplate`;
- `logPhaseForActionType` table for every in-scope action type (current values, incl. `undefined`);
- the autocommit set of `handleActionFromUI` (6 types, analysis §3.3), exposed by extracting the list into a named constant (the only production edit of this slice).

### 0.2 Baseline runs

Run and record the pass/fail list of `nonreg:unit` and `nonreg:filesystem` (shared runner) on the untouched branch, so later slices compare against it rather than against memory of known failures.

### Validation

```bash
RUN_TEST=actionImplementations.341.phase0 npm run testByFile -w miroir-core -- actionImplementations.341.phase0
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npm run nonreg:unit -- --runner shared
npm run nonreg:filesystem -- --runner shared
```

### Realization

- `actionImplementations.341.phase0.unit.test.ts`: 5 tests. The test imports `miroir-core` (aliased to `src/index.ts`) before any `src/` module, otherwise module initialisation order breaks.
- Deviation: the bundled `defaultMiroirMetaModel.endpoints` holds 12 entries for 10 Endpoints: InstanceEndpoint and StoreManagementEndpoint are listed twice, and MenuEndpoint is not bundled. The first test now locks the 10 bundled Endpoints, and a second test locks the duplicates. All in-scope Endpoints are bundled, so D2's fallback still holds (analysis §3.1).
- Production change: `autocommitActionTypesFromUI` (exported constant in `DomainController.ts`) replaces the inline condition of `handleActionFromUI`.
- Baseline `nonreg:filesystem --runner shared`: 78/78 steps pass (snapshot `test-results/nonreg/20260928T063956Z`). `unit-localCacheMonitorSummary` fails under the shared runner only and passes on the legacy re-run, so it is not a regression signal for later slices.
- Environment: the session's `dist/` builds and `node_modules` predated `_integration`; fixed with `./build-all.sh`, `npm ci`, and the missing native `@rollup/rollup-linux-x64-gnu` installed with `--no-save`. The nonreg run rewrites 6 `miroir-standalone-app/tests/assets/admin_data` files; they are restored before committing.
- Gate: lint, `sync_agent_skills --check`, pytest (45 passed), tsc miroir-core, `npm run test -w miroir-core -- ''` (2092 passed).

---

## Slice 1 — Tracer: `prepareOpenApiDocument` runs from its library reference

**Status:** ✅ DONE (2026-09-28)

### Goal

A Miroir developer can make a Miroir action run by referencing a library function in its Endpoint definition, with no `case` for it in `DomainController`.

**Layers cut:** DomainEndpoint JSON → bundled meta-model → `handleAction` routing → `handleApplicationAction` → implementation map → existing `handlePrepareOpenApiDocument`.

### 1.1 RED

**Test:** `actionImplementations.341.phase1.unit.test.ts` (same issue dir), real `DomainController` built as in `DomainControllerOutboundFetch.unit.test.ts`, outbound fetch faked with `setOutboundFetch`.

Behavior asserted:
- `handleAction({ actionType: "prepareOpenApiDocument", endpoint: DomainEndpoint uuid, payload: { url } }, …)` returns the prepared document, with the `prepareOpenApiDocument` case removed from `handleActionInternal`;
- a Miroir Endpoint action whose `inMemoryImplementationFunctionName` is not in the map returns `Action2Error("InvalidAction")` naming the identifier (Endpoint environment built from the bundled one with one action edited in memory);
- guard (a): every `libraryImplementation` identifier in the bundled Endpoints resolves in `miroirActionImplementations`.

### 1.2 GREEN

- `ActionImplementations.ts`: `ActionImplementationHandler = (host, action, applicationDeploymentMap, modelEnvironment, actionParamValues, principal) => Promise<Action2ReturnType>`; map with `handleAction_prepareOpenApiDocument`.
- `DomainControllerActionHost`: the controller methods the handlers need, starting with `handlePrepareOpenApiDocument` (made non-private through the interface).
- `handleApplicationAction`: accept `libraryImplementation`, look it up, error on a missing name (same shape as `TransformersForRuntime.ts` ~l.4012); for Miroir Endpoints skip the store lookup and resolve the Endpoint from `defaultEndpointsByUuid` when the environment lacks it.
- `handleAction`: a Miroir action whose definition declares `actionImplementation` goes to `handleApplicationAction`; the rest still goes to `handleActionInternal` (transitional; replaces the `entity_DuplicateAttribute` special case).
- DomainEndpoint `1e2ef8e6-…`: `prepareOpenApiDocument` gets `actionImplementation`. Rebuild deployment + core.

### 1.3 Refactor checkpoint

- The `entity_DuplicateAttribute` condition in `handleAction` (~l.3128) disappears into the generic "declares an implementation" rule.

### Validation

```bash
npm run build -w miroir-test-app_deployment-miroir && npm run build -w miroir-core
RUN_TEST=actionImplementations.341 npm run testByFile -w miroir-core -- actionImplementations.341
npm run testByFile -w miroir-test-app_deployment-miroir -- tests/modelValidation.unit.test.ts
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npm run test -w miroir-core -- ''
```

### Realization

- New: `0_interfaces/3_controllers/DomainControllerActionHost.ts` (`DomainControllerActionHost`, `ActionImplementationContext`, `ActionImplementationHandler`) and `3_controllers/ActionImplementations.ts` (`miroirActionImplementations`, one entry `handleAction_prepareOpenApiDocument`).
- `handleAction`: a Miroir action goes to `handleApplicationAction` when its bundled definition declares an `actionImplementation` (helper `findBundledMiroirActionDefinition`). This rule replaces the `entity_DuplicateAttribute` special case.
- `handleApplicationAction`: for Miroir actions it skips the store lookup for external services and does not require `currentModelEnvironment`; the Endpoint falls back to `defaultMiroirModelEnvironment.endpointsByUuid`. `libraryImplementation` runs through `runLibraryActionImplementation`, and an unknown name returns `InvalidAction`. The composite branch still requires `currentModelEnvironment`.
- New `runInActionContext`: logging context, log phase and error handling for library implementations. Unlike `handleActionInternal`, it awaits the run, so the phase spans the asynchronous work.
- The `prepareOpenApiDocument` case is removed from `handleActionInternal`. DomainEndpoint declares `handleAction_prepareOpenApiDocument`.
- Deviation: `handlePrepareOpenApiDocument` became public. TypeScript cannot satisfy an interface with a private method. The host interface limits what handlers use, but the class surface grows by one method per migrated private method.
- Deviation: `connectExternalService.284.phase0` locked the old "libraryImplementation not supported yet" rejection. The test now expects `InvalidAction` "unknown library implementation" (deliberate edit).
- Phase 0 test updated: `prepareOpenApiDocument` is now in the list of implemented actions.
- Follow-up fix (second commit of the slice): `handleActionFromUI` called `handleActionInternal` directly, so a migrated action sent from the UI fell to its `default` branch. A new `handleMiroirAction` holds the rule (declared implementation → `handleApplicationAction`, otherwise `handleActionInternal`), used by `handleAction` and `handleActionFromUI`, including the autocommit `commit`. A phase1 test covers `handleActionFromUI`. Side effect: `entity_DuplicateAttribute` sent from the UI now runs its composite template; before, it fell to `default`.
- Validation: modelValidation (162 passed), lint, tsc miroir-core and miroir-standalone-app, `npm run test -w miroir-core -- ''` (2095 passed), `nonreg:filesystem --runner shared` 77/78: the one failure was the #284 phase0 test above, now green.

---

## Slice 2 — DomainEndpoint actions

**Status:** ⬜ pending

### Goal

All 6 DomainEndpoint actions run from their library references.

**Layers cut:** DomainEndpoint JSON → map → existing handlers (`callLocalCacheAction`, `handleCompositeAction`, `handleCompositeRunBoxedQuery*Action`, `handleConnectExternalService`).

### 2.1 RED

- Phase1 test: `transactionalInstanceAction`, `compositeActionSequence`, `compositeRunBoxedQueryAction`, `compositeRunBoxedQueryTemplateAction`, `connectExternalService` have no `case` left in `handleActionInternal` (asserted by declaring their implementation in the Endpoint; guard (a) fails until the map has them).
- Behaviour proof: `action.scenario.evolutionTrace`, `action.scenario.multistepReportTemplate`, `integ-action-284-openapi-connection-wizard*`, `externalServices-spotify` nonreg steps.

### 2.2 GREEN

Five map entries wrapping the existing code; move the inline `transactionalInstanceAction` body into its handler. Host interface grows by the private methods used.

### 2.3 Refactor checkpoint

- Methods reached through `DomainControllerActionHost` must be public (TypeScript cannot satisfy an interface with private members, see Slice 1 Realization); add them to the interface one by one, never the whole class.

### Validation

```bash
npm run build -w miroir-test-app_deployment-miroir && npm run build -w miroir-core
RUN_TEST=actionImplementations.341 npm run testByFile -w miroir-core -- actionImplementations.341
npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-filesystem --suites action.scenario.evolutionTrace --mode integ
npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-filesystem --suites action.scenario.multistepReportTemplate --mode integ
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
```

### Realization

---

## Slice 3 — InstanceEndpoint actions

**Status:** ⬜ pending

### Goal

The 7 instance actions run from their library references.

### 3.1 RED

Declare the 7 implementations in InstanceEndpoint `ed520de4-…`; guard (a) fails until the map has them.

### 3.2 GREEN

7 entries, each calling `handleInstanceAction`. Remove the instance `case`s of `handleActionInternal`.

### 3.3 Refactor checkpoint

- `handleInstanceAction`'s own `actionType` checks (`createInstance`/`updateInstance` ~l.1242, `getInstance`/`getInstances` ~l.1262) stay: they are behaviour, not dispatch. Note them for a later per-action split.

### Validation

```bash
npm run build -w miroir-test-app_deployment-miroir && npm run build -w miroir-core
RUN_TEST=actionImplementations.341 npm run testByFile -w miroir-core -- actionImplementations.341
for s in action.domainController.dataCrud action.domainController.dataCrud.compositePk action.domainController.dataCrud.nonUuidPk action.domainController.dataCrud.noParentUuid; do
  npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-filesystem --suites $s --mode integ; done
```

### Realization

---

## Slice 4 — ModelEndpoint actions

**Status:** ⬜ pending

### Goal

The 11 library-implementable model actions run from their references; `handleModelAction`'s top-level switch no longer dispatches.

### 4.1 RED

Declare the 11 implementations in ModelEndpoint `7947ae40-…` (`entity_DuplicateAttribute` unchanged); guard (a) fails until the map has them.

### 4.2 GREEN

One handler per action (D3): the 4 entity actions share one body, `initModel`, `commit`, `rollback`, `remoteLocalCacheRollback`, `resetModel`, `resetData`, `freezeApplicationVersion` each take their `case` body from `handleModelAction`. The "needs a currentModel" check moves into these handlers.

### 4.3 Refactor checkpoint

- `handleModelAction` shrinks to shared helpers or disappears; the commit-replay switch (~l.2210) stays (analysis §3.3).

### Validation

```bash
npm run build -w miroir-test-app_deployment-miroir && npm run build -w miroir-core
RUN_TEST=actionImplementations.341 npm run testByFile -w miroir-core -- actionImplementations.341
for s in action.domainController.modelCrud action.domainController.modelCrud.nonUuidPk action.domainController.freezeApplicationVersion; do
  npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-filesystem --suites $s --mode integ; done
npm run test -w miroir-core -- ''
```

### Realization

---

## Slice 5 — StoreManagement and UndoRedo actions

**Status:** ⬜ pending

### Goal

Store management (5) and undo/redo (2) run from their references, including before the Miroir store is open.

### 5.1 RED

Declare the implementations in StoreManagementEndpoint `bbd08cbb-…` and UndoRedoEndpoint `71c04f8e-…`. Any integ session fails if `storeManagementAction_openStore` needs a store to resolve its Endpoint (D2 constraint), so every integ run is the proof.

### 5.2 GREEN

5 + 2 handlers from the inline store-management `case` (local / remote branches, process capabilities) and `handleDomainUndoRedoAction`.

### 5.3 Refactor checkpoint

- `isStoreAdministrationAction` list inside the store-management case becomes per-handler knowledge.

### Validation

```bash
npm run build -w miroir-test-app_deployment-miroir && npm run build -w miroir-core
npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-filesystem --suites action.domainController.modelUndoRedo --mode integ
npm run nonreg:filesystem -- --runner shared
```

### Realization

---

## Slice 6 — QueryEndpoint actions reachable through `handleAction`

**Status:** ⬜ pending

### Goal

A caller can run `runBoxedQueryAction` / `runBoxedQueryTemplateAction` through `handleAction` and gets the query result, instead of a silent `ACTION_OK` (analysis §3.2, §5).

### 6.1 RED

**Test:** `actionImplementations.341.phase6.integ.test.ts` (standalone-app, filesystem profile, Library testbed): `handleAction(runBoxedQueryAction over Library books)` returns the books; today it returns `ACTION_OK` with no domain element. Vitest: the result of `handleAction` is not observable from an `actionTest`.

### 6.2 GREEN

Two handlers calling `handleBoxedExtractorOrQueryAction` and `handleQueryTemplateActionForServerONLY`; declare them in QueryEndpoint `0faae143-…`.

### 6.3 Refactor checkpoint

- Callers of `handleBoxedExtractorOrQueryAction` stay as they are; converging them on `handleAction` is out of scope.

### Validation

```bash
npm run build -w miroir-test-app_deployment-miroir && npm run build -w miroir-core
VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-filesystem.json npm run testByFile -w miroir-standalone-app -- actionImplementations.341.phase6
```

### Realization

---

## Slice 7 — One dispatch path: remove the switches, scoped guard on

**Status:** ⬜ pending

### Goal

`DomainController` no longer names Miroir action types for dispatch: every action goes endpoint → definition → implementation, and an unknown action is an error.

### 7.1 RED

- Phase0 test gains guard (b): every action of the 6 in-scope Endpoints declares `actionImplementation`.
- Phase1 test: an unknown Miroir `actionType` returns `InvalidAction` (today: logged, `ACTION_OK`).
- `bundleAction` / `probeExternalService` routed by Endpoint (open point default: add `endpoint` to their schemas, declare them in StoreManagementEndpoint / DomainEndpoint; schema rebuild with `devBuild`).

### 7.2 GREEN

- Delete `handleActionInternal`'s switch (keep its logging / activity tracking / phase wrapper around the map call) and the `selfApplicationMiroir` fork in `handleAction`.
- Composite interpreters (~l.4649, ~l.4853, ~l.5782): drop the explicit domain action lists that fall into `default` anyway.
- Delete the unused `ActionHandler` type and the commented `actionHandler` field (analysis §3.6).

### 7.3 Refactor checkpoint

- Review `handleAction` / `handleApplicationAction` for leftovers of the two paths; the store lookup for external services stays for non-Miroir applications only.

### Validation

```bash
npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core
RUN_TEST=actionImplementations.341 npm run testByFile -w miroir-core -- actionImplementations.341
npm run test -w miroir-core -- ''
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npm run nonreg:filesystem -- --runner shared
```

### Realization

---

## Slice 8 — Autocommit and log phase from action definitions

**Status:** ⬜ pending

### Goal

An application designer sets whether an action autocommits from the UI and which log phase it belongs to on its definition, instead of in `DomainController` / `rollbackLog.ts` lists.

**Layers cut:** Action ML schema (Endpoint Entity `3d8da4d4-…` `mlSchema` and its EntityVersion) → generated types → Endpoint JSON → `handleActionFromUI`, `logPhaseForActionType`.

### 8.1 RED

**Test:** `actionImplementations.341.phase8.unit.test.ts`: the values derived from the bundled definitions equal the Slice 0 locks (autocommit set of 6, log phase table). Fails until the attributes exist.

### 8.2 GREEN

Add optional attributes to the action definition schema (names settled at this slice with A, e.g. `autocommitFromUI: boolean`, `logPhase: "rollback" | "bootstrap" | "query"`), fill them in the Endpoints, read them in `handleActionFromUI` and in the phase lookup. `devBuild` regenerates types.

### 8.3 Refactor checkpoint

- `logPhaseForActionType` keeps its signature but reads definitions; callers unchanged.

### Validation

```bash
npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core
RUN_TEST=actionImplementations.341 npm run testByFile -w miroir-core -- actionImplementations.341
npm run testByFile -w miroir-test-app_deployment-miroir -- tests/modelValidation.unit.test.ts
npm run nonreg:unit -- --runner shared
```

### Realization

---

## Slice 9 — Nonreg, docs, cleanup, AC

**Status:** ⬜ pending

### 9.1 Nonreg

- `npm run nonreg:filesystem -- --runner shared` green against the Slice 0 baseline. No new step: the guard moves into a feature-named unit file run by `unit-miroir-core`; the phase6 integ assertion moves into an existing app-stack integ file already in nonreg.

### 9.2 Docs

- `docs/guides/developer/`: how to add an action (Endpoint definition + `libraryImplementation` or composite template, map entry).
- `analysis.md` status → implemented; this plan's progress table DONE.

### 9.3 Issue-directory cleanup

- Move the guard and dispatch assertions to `packages/miroir-core/tests/3_controllers/ActionImplementations.unit.test.ts`; delete `tests/3_controllers/issues/341-action-library-implementations/` and the standalone-app issue dir (#238 rule).

### 9.4 Tracer bullet (narrative)

1. Add an action to a Miroir Endpoint JSON with `actionImplementation: { actionImplementationType: "libraryImplementation", inMemoryImplementationFunctionName: "handleAction_x" }`.
2. Add `handleAction_x` to `miroirActionImplementations`.
3. Rebuild; send the action through `handleAction`: it runs, and `DomainController` was not edited.

Automated equivalent: `ActionImplementations.unit.test.ts` (tracer case from Slice 1) and the guard.

### AC checklist (#341)

| Criterion | Proven by | Status |
|---|---|---|
| Miroir actions reference their implementation through `libraryImplementation` | guard (b), Slice 7 | ⬜ |
| `DomainController` holds a map from function identifier to implementation | guard (a) + tracer, Slice 1 | ⬜ |
| `DomainController` decoupled from the set of existing actions | Slice 7 (no dispatch switch), tracer narrative | ⬜ |
| Behaviour preserved | `action.domainController.*` suites, nonreg:filesystem | ⬜ |
