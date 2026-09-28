# 341 — Miroir actions reference library implementations

> Miroir's own actions (model, instance, domain, store management, undo/redo, query) are dispatched by hard-coded `switch (actionType)` blocks in `DomainController`, written before actions were Entities. This analysis maps that dispatch and records the decisions for moving it to `actionImplementation: libraryImplementation` references resolved through a map of implementation functions, as basic transformers already do.

Related issue: https://github.com/miroir-framework/miroir/issues/341
Related analyses: [`../311-REFACTOR-architecture-review/analysis.md`](../311-REFACTOR-architecture-review/analysis.md) (candidates C1-C3 on `DomainController`)
Key sources: [`DomainController.ts`](../../../packages/miroir-core/src/3_controllers/DomainController.ts), [`TransformersForRuntime.ts`](../../../packages/miroir-core/src/2_domain/TransformersForRuntime.ts) (`inMemoryTransformerImplementations`), Miroir Endpoints in [`miroir_data/3d8da4d4-…/`](../../../packages/miroir-test-app_deployment-miroir/assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/)

**Status:** decisions confirmed with A (2026-09-28); implementation per `tdd-implementation-plan.md`.

---

## Decision record

| Decision | Choice |
|---|---|
| D1 Scope | **Actions dispatched by `DomainController`**: Model, Instance, Domain, StoreManagement, UndoRedo, Query Endpoints. Persistence, LocalCache, Test, Menu and Application Endpoints later. |
| D2 Entry point | **One path for every application**: endpoint → action definition → implementation, through `handleApplicationAction`. |
| D3 Map granularity | **One identifier per action**, even when several identifiers wrap the same existing method. |
| D4 Cross-cutting rules | **Action-definition attributes, in a later slice** (autocommit, log phase), after dispatch works. |
| D5 Guard | **Yes, scoped**: a declared identifier must resolve (all Endpoints); every action of an in-scope Endpoint must declare an implementation. The in-scope list grows until it covers all Endpoints. |
| D6 Map location | **New file in `3_controllers/`**, handlers receive the controller as a parameter. |

**Rationale:** decouple `DomainController` from the set of actions existing today, so adding an action means adding an Endpoint action definition and, when needed, one map entry; reuse the transformer mechanism instead of inventing a new one.

### D1 — Scope

**Status:** Accepted — DomainController-dispatched Endpoints.

| Option | Pros | Cons |
|---|---|---|
| **D1-a. Endpoints dispatched by `DomainController`** ★ | One file changes behaviour; nonreg covers it | Two dispatch styles coexist for a while |
| D1-b. All 11 Miroir Endpoints | Complete | Persistence / LocalCache actions are dispatched by stores and sagas in 3 packages, not by `DomainController`; Test, Menu, Application actions have no implementation at all (§3.4) |

**Decision:** D1-a. The out-of-scope Endpoints are follow-ups, unscheduled.

### D2 — Entry point

**Status:** Accepted — single path through `handleApplicationAction`.

| Option | Pros | Cons |
|---|---|---|
| **D2-a. `handleApplicationAction` for every application** ★ | Miroir actions follow the same rules as application actions; removes the `selfApplicationMiroir` fork and the `entity_DuplicateAttribute` special case in `handleAction` | `handleApplicationAction` must resolve Miroir Endpoints without a store (§3.2 constraint) |
| D2-b. Keep `handleActionInternal`, look up the map inside it | Smaller change | Two entry points remain; Miroir actions still bypass their definitions |

**Decision:** D2-a.

### D3 — Map granularity

**Status:** Accepted — one identifier per action.

| Option | Pros | Cons |
|---|---|---|
| **D3-a. One identifier per action** (`handleAction_createEntity`, `handleAction_commit`, …) ★ | Definitions don't encode today's grouping; an action can later get its own implementation without touching the model | ~33 entries, several one-line wrappers |
| D3-b. One identifier per existing method (`handleModelAction`, `handleInstanceAction`) | ~12 entries | Freezes today's grouping in the model; the switch inside `handleModelAction` stays |

**Decision:** D3-a. Naming follows the transformer convention (`handleTransformer_<name>` → `handleAction_<actionType>`).

### D4 — Cross-cutting rules

**Status:** Accepted — later slice. Until then the hard-coded lists of §3.3 stay as they are.

### D5 — Guard

**Status:** Accepted — scoped, per A: a guard requiring an implementation on every action cannot pass while D1 leaves Endpoints out. Two checks: (a) every `libraryImplementation` identifier declared in any Endpoint resolves in the map; (b) every action of an Endpoint in the in-scope list declares `actionImplementation`. The list grows with each follow-up and the check becomes global once it covers all Endpoints.

### D6 — Map location

**Status:** Accepted — `packages/miroir-core/src/3_controllers/` new file (e.g. `ActionImplementations.ts`), a `Record<string, ActionImplementationHandler>` whose handlers receive the controller. Methods they call that are `private` today (§4) become reachable through a narrow interface implemented by `DomainController`, rather than made public wholesale.

---

## 1. Goals

1. **Declare how an action runs** — In order to see and change what an action does from the model, as an application designer, I can read in each Miroir action definition which implementation runs it (library function or composite template).
2. **Add an action without editing DomainController dispatch** — In order to extend Miroir with new actions, as a Miroir developer, I can add an Endpoint action definition referencing a library function (or a composite template) without adding a `case` to `DomainController`.
3. **Catch broken references early** — In order not to ship an action that cannot run, as a Miroir developer, I get a failing test when an Endpoint action names an implementation that does not exist, or when an in-scope action declares none.

## 2. Non-goals

- Persistence and LocalCache actions (dispatched in `PersistenceStoreController.ts`, `RestServer.ts`, `miroir-localcache-redux`, `miroir-localcache-zustand`): later, unscheduled.
- The 5 declared-but-unimplemented actions (§3.4): all unused, their removal is #342.
- Removing `ActionRunner.ts`'s own store-management switch (server-side store administration): later.
- SQL implementations of actions (`sqlImplementationFunctionName`): the attribute exists in the schema but has no use for actions.

## 3. Current state

### 3.1 Miroir Endpoints and their action implementations (misaligned)

Enumerated from `miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/*.json` (application `360fcf1f-…`, Miroir): 11 Endpoints, 47 actions, 1 with `actionImplementation`.

| Endpoint | uuid | Actions | Implemented today by | D1 |
|---|---|---|---|---|
| ModelEndpoint | `7947ae40-eb34-4149-887b-15a9021e714e` | 12: `initModel`, `commit`, `rollback`, `remoteLocalCacheRollback`, `resetModel`, `resetData`, `alterEntityAttribute`, `entity_DuplicateAttribute`, `renameEntity`, `createEntity`, `dropEntity`, `freezeApplicationVersion` | `handleModelAction` switch; `entity_DuplicateAttribute` is the only one with `actionImplementation` (`compositeActionTemplate`) | in |
| InstanceEndpoint | `ed520de4-55a9-4550-ac50-b1b713b72a89` | 7: `createInstance`, `deleteInstance`, `deleteInstanceWithCascade`, `updateInstance`, `loadNewInstancesInLocalCache`, `getInstance`, `getInstances` | `handleInstanceAction` | in |
| DomainEndpoint | `1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5` | 6: `transactionalInstanceAction`, `compositeActionSequence`, `compositeRunBoxedQueryAction`, `compositeRunBoxedQueryTemplateAction`, `connectExternalService`, `prepareOpenApiDocument` | inline cases / private methods of `handleActionInternal` | in |
| StoreManagementEndpoint | `bbd08cbb-79ff-4539-b91f-7a14f15ac55f` | 5: `storeManagementAction_{createStore,deleteStore,resetAndInitApplicationDeployment,openStore,closeStore}` | inline case in `handleActionInternal` (local / remote branches) | in |
| UndoRedoEndpoint | `71c04f8e-c687-4ea7-9a19-bc98d796c389` | 2: `undo`, `redo` | `handleDomainUndoRedoAction` | in |
| QueryEndpoint | `0faae143-0d7b-4a8a-a950-4fc3df943bde` | 2: `runBoxedQueryAction`, `runBoxedQueryTemplateAction` | public methods `handleBoxedExtractorOrQueryAction`, `handleQueryTemplateActionForServerONLY`, called directly; **not** in `handleActionInternal` (§3.2) | in |
| PersistenceEndpoint | `a93598b3-19b6-42e8-828c-f02042d212d4` | 8: `LocalPersistenceAction_*`, `RestPersistenceAction_*` | stores / sagas | out |
| TestEndpoint | `a9139e2d-a714-4c9c-bdee-c104488e2eaa` | 2: `runTestCompositeAction`, `runTestCase` | none (§3.4) | out |
| MenuEndpoint | `c6b849a3-d91f-4281-8c3a-595c17771b6e` | 1: `menuAddItem` | none | out |
| ApplicationEndpoint | `ddd9c928-2ceb-4f67-971b-5898090412d6` | 2: `createApplication`, `dropApplication` | none | out |
| LocalCacheEndpoint | `9e404b3c-368c-40cb-be8b-e3c28550c25e` | 0 | — | out |

In scope: 6 Endpoints, 34 actions, of which 33 get a `libraryImplementation` and `entity_DuplicateAttribute` keeps its composite template. Out of scope: 5 Endpoints, 13 actions.

The schema already allows the target (generated `action` in `miroirFundamentalType.ts`):

```typescript
actionImplementation?: { actionImplementationType: "libraryImplementation"; inMemoryImplementationFunctionName: string; sqlImplementationFunctionName?: string }
                     | { actionImplementationType: "compositeActionTemplate"; definition: any };
```

### 3.2 Dispatch path (misaligned)

`handleAction` (`DomainController.ts` ~l.3071) resolves the application from the endpoint through `defaultEndpointApplicationMap` (`1_core/Deployment.ts`, all Miroir Endpoints → `selfApplicationMiroir`), then forks (~l.3128):

```typescript
if (applicationUuid !== undefined && (
  applicationUuid !== selfApplicationMiroir.uuid ||
  (domainAction as any).actionType == "entity_DuplicateAttribute"
)) {
  return this.handleApplicationAction(/* … */);
} else {
  return this.handleActionInternal(/* … */);
}
```

- **Non-Miroir application or `entity_DuplicateAttribute`** → `handleApplicationAction` (~l.3153): in `local` mode it first loads the Endpoint instance from the application's store (`loadEndpointInstanceFromLocalPersistenceStore`) to detect external services; then looks the Endpoint up in `currentModelEnvironment.endpointsByUuid` (fallback `miroirMetaModel.endpoints`), finds the action definition by `actionType`, and returns `InvalidAction` unless `actionImplementationType == "compositeActionTemplate"` (~l.3273): **`libraryImplementation` is refused**.
- **Miroir application** → `handleActionInternal` (~l.4258): `switch (domainAction.actionType)` from ~l.4292 over model (→ `handleModelAction`, which requires `currentModel`), instance (→ `handleInstanceAction`), store management (inline), `bundleAction`, `undo`/`redo`, `transactionalInstanceAction`, `compositeRunBoxedQueryTemplateAction`, `compositeRunBoxedQueryAction`, `compositeActionSequence`, `connectExternalService`, `probeExternalService` (cast `as any`), `prepareOpenApiDocument`. The `default` branch logs an error and **returns `ACTION_OK`**: a `runBoxedQueryAction` sent through `handleAction` does nothing and reports success.

**Constraint for D2:** Miroir actions cannot resolve their Endpoint from a store: `storeManagementAction_openStore` / `initModel` run before the Miroir store is open, and `currentModelEnvironment` is optional in `handleAction` (only the model and undo/redo cases of `handleActionInternal` require it). The Miroir Endpoints must resolve from the bundled `defaultEndpointsByUuid` (`1_core/Model.ts` l.116, built from `defaultMiroirMetaModel.endpoints`), and the store lookup for external services must be skipped for them.

### 3.3 Other hard-coded action-type lists in `DomainController` (misaligned)

| Place | Lines (approx.) | What the list decides | Handled by |
|---|---|---|---|
| `handleModelAction` switch | ~1756 | second-level dispatch of the 11 model actions | the map (D3) |
| commit replay switch | ~2210 | replays `transactionalInstanceAction` and the 4 replayable model actions from the undo log | stays: replay of logged actions, not dispatch of incoming ones |
| `handleActionFromUI` | ~2997 | which actions trigger an autocommit | D4, later slice |
| `handleCompositeActionInternal` | ~4649 | `compositeActionSequence`, `compositeRunBoxedQueryAction`, `compositeRunTestAssertion` handled inline; a list of domain action types plus `default` → `handleAction` | the explicit list is redundant with `default`; can be removed |
| `handleRuntimeCompositeActionDO_NOT_USE` | ~4853 | same shape | idem |
| `handleCompositeActionTemplate` | ~5782 | same shape, after template resolution | idem |
| `logPhaseForActionType` (`4_services/rollbackLog.ts` l.50) | — | log phase per action type | D4, later slice |

`compositeRunTestAssertion` is a composite step, not an Endpoint action; it stays in the composite interpreters.

### 3.4 Declared vs implemented (mismatches)

| Kind | Actions |
|---|---|
| Declared in an Endpoint, handled nowhere | `runTestCompositeAction`, `runTestCase`, `menuAddItem`, `createApplication`, `dropApplication` (no `case` or string match in `packages/*/src`, generated types excepted) |
| Handled in `handleActionInternal`, declared in no Miroir Endpoint | `bundleAction` (`actionName` `createBundle` / `deleteBundle`), `probeExternalService` |
| Handled, declared, but unreachable through `handleAction` | `runBoxedQueryAction`, `runBoxedQueryTemplateAction` (fall to `default`, §3.2) |

`bundleAction` and `probeExternalService` need an Endpoint action definition (most likely DomainEndpoint and StoreManagementEndpoint) before they can go through D2; this is part of the in-scope work, since otherwise the single path would reject them.

### 3.5 Transformer precedent (aligned, to reuse)

`TransformersForRuntime.ts` l.1050: `const inMemoryTransformerImplementations: Record<string, ITransformerHandler<any>> = { handleTransformer_menu_AddItem, handleCountTransformer, … }`. At ~l.4012 the interpreter switches on `transformerImplementationType`; for `libraryImplementation` it looks up `inMemoryImplementationFunctionName` in the map and returns an error when it is missing. The TransformerDefinition JSON files carry `"inMemoryImplementationFunctionName": "handleTransformer_listLength"` etc.

### 3.6 Leftover

`DomainController.ts` ends with an unused `ActionHandler` type ("actionType → actionName → handler … in the end, shall be …") and a commented `private actionHandler: ActionHandler` (~l.407): an earlier attempt at the same idea, to delete when the map lands.

## 4. Key reuse

| Piece | Location |
|---|---|
| Map pattern and error on missing name | `inMemoryTransformerImplementations`, `TransformersForRuntime.ts` l.1050, ~l.4012 |
| Action definition lookup | `getEndpointActions` (`0_interfaces/1_core/endpointDefinition.ts`), used in `handleApplicationAction` |
| Bundled Miroir Endpoints | `defaultEndpointsByUuid` / `defaultMiroirModelEnvironment.endpointsByUuid`, `1_core/Model.ts` |
| Endpoint → application | `defaultEndpointApplicationMap`, `1_core/Deployment.ts` l.93 |
| Existing implementations (public) | `handleModelAction`, `handleInstanceAction`, `handleDomainUndoRedoAction`, `handleBoxedExtractorOrQueryAction`, `handleQueryTemplateActionForServerONLY`, `handleCompositeAction` |
| Existing implementations (private today) | `handleConnectExternalService`, `handleProbeExternalService`, `handlePrepareOpenApiDocument`, `handleCompositeRunBoxedQueryAction`, `handleCompositeRunBoxedQueryTemplateAction`, `resolveProcessCapabilities`, `callUtil` (store management, bundle, transactional cases) |
| Unit test style without a store | `tests/3_controllers/DomainControllerOutboundFetch.unit.test.ts` (`new DomainController("local", {} as any, …)`) |
| Composite-template precedent | `entity_DuplicateAttribute` in ModelEndpoint |

## 5. Behaviour changes to expect

| Change | Why |
|---|---|
| `runBoxedQueryAction` / `runBoxedQueryTemplateAction` through `handleAction` return the query result instead of a silent `ACTION_OK` | they now resolve to an implementation |
| An unknown Miroir `actionType` returns `InvalidAction` instead of logging and returning `ACTION_OK` | `handleApplicationAction` already does this for applications |
| The "needs a currentModel" errors move into the model and undo/redo handlers; the Endpoint lookup itself falls back to the bundled Miroir Endpoints | D2 constraint (§3.2) |

Callers relying on the silent `ACTION_OK` would surface in nonreg (`nonreg:filesystem`, since the change touches DomainController and actions).

---

## Next step

Implementation proceeds per [`./tdd-implementation-plan.md`](./tdd-implementation-plan.md).
