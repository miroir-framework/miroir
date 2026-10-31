# 519 — The server runs actions and queries with the application's model environment

> The server and the Postgres store still run every query with Miroir's stock transformers, so a
> composite TransformerDefinition saved by an application (#502) fails as soon as the server or the
> SQL translation evaluates it. This analysis maps where the application's model is lost on the
> server path and settles how the server gets one per deployment.

Related issue: https://github.com/miroir-framework/miroir/issues/519
Parent issue: #502 (split out at A's request, "Separate issue", 2026-10-07) · Prerequisite: #502 ✅
Related analyses: [`../497-FEATURE-visual-block-editor/analysis.md`](../497-FEATURE-visual-block-editor/analysis.md) (D9), [`tdd-implementation-plan-502.md`](../497-FEATURE-visual-block-editor/tdd-implementation-plan-502.md) (slice 4, "Server" default)
Key sources: [`RestServer.ts`](../../../packages/miroir-core/src/4_services/RestServer.ts), [`DomainController.ts`](../../../packages/miroir-core/src/3_controllers/DomainController.ts), [`PersistenceReduxSaga.ts`](../../../packages/miroir-localcache-redux/src/4_services/persistence/PersistenceReduxSaga.ts), [`SqlGenerator.ts`](../../../packages/miroir-store-postgres/src/1_core/SqlGenerator.ts), [`TransformerDefinitionRegistry.ts`](../../../packages/miroir-core/src/2_domain/TransformerDefinitionRegistry.ts)

**Status:** decisions taken from the issue's proposal (D1, D3) and by the implementer (D2, D4); open to review on the PR — see [`tdd-implementation-plan.md`](./tdd-implementation-plan.md).

---

## 1. Goals

- **G1 — Server-side queries use my transformers.** In order to keep one definition of a computation as an application designer, I can use a composite TransformerDefinition of my application in a query that the server runs (`queryExecutionStrategy: "storage"`, Reports loaded from the store, MCP and CLI clients), and get its result.
- **G2 — Postgres translates my transformers.** In order to keep SQL execution for my queries as an application designer, I can use a composite TransformerDefinition in a `runAsSql` query on a Postgres deployment, and the query is translated rather than refused.
- **G3 — Saving a transformer is enough.** In order to use a transformer right after saving it as an application designer, I can save a composite TransformerDefinition and have the server's next query see it, without restarting the server.

## 2. Non-goals

- SQL translation of composite *parameters* read with `getFromContext`: the SQL translator binds a composite's parameters into `queryParams`, which `getFromContext` does not read (`sqlStringForContextReferenceTransformer` reads `definedContextEntries` only). This holds for stock composites too (`entityDefinition_extractAttributes`); a composite whose body reads the query's context, or reads its parameters with `getFromParameters`, translates. Later, unscheduled.
- Model environment for domain calls that do not go through the REST handlers (miroir-mcp tools, CopilotKit routes, the server's own boot queries): they keep the environment their caller passes.
- Sharing the MetaModel builder with the local caches (`currentModel` in `miroir-localcache-redux` and `-zustand` `Model.ts`): a refactor once the server builder is proven; later, unscheduled.

## 3. Decision record

| Decision | Choice | Serves |
|---|---|---|
| D1 Where the SQL translator reads definitions | **Optional trailing argument** of `sqlStringForRuntimeTransformer` and of every SQL transformer handler, default the stock map; `sqlStringForQuery` / `sqlStringForCombiner` pass `transformerDefinitionRegistry(modelEnvironment)` | G2 |
| D2 How the server gets an application's model | **Read the model section from the store**, per deployment, cached; not the server's local cache | G1, G3 |
| D3 How the environment reaches the store | **Forward it on every hop**: DomainController → saga → PersistenceStoreController → store section → extractor runner | G1, G2 |
| D4 When the cached environment is refreshed | **Dropped on writes through the REST handlers** that can change the model; rebuilt on the next request | G3 |

### D1 — Where the SQL translator reads definitions

**Status:** Accepted — D1-a. **Serves:** G2.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D1-a. Trailing argument** ★ | every handler takes `transformerDefinitions` last and passes it to its recursive calls | explicit, pure, as the issue proposes; nested composites see it | 36 handler signatures and ~40 recursive calls change |
| D1-b. Module-level "current registry" set by `sqlStringForQuery` | dynamic scope around a synchronous call | 2 lines | hidden global state; wrong as soon as translation becomes async or reentrant |
| D1-c. Expand composites before translation | rewrite the tree with the bodies | no signature change | not equivalent: a composite binds its parameters into `queryParams`, a rewrite has to rename references |

### D2 — How the server gets an application's model

**Status:** Accepted — D2-a. **Serves:** G1, G3.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D2-a. Model section read from the store** ★ | `getInstances(section, entity)` on the deployment's PersistenceStoreController for the model Entities, assembled into a `MetaModel`, then a `MiroirModelEnvironment` (deployment schema with the composite branches, endpoints); cached per deployment | reads only the model; works whether the server's local cache was loaded or not | a builder next to the two local-cache ones (non-goal above) |
| D2-b. The server's local cache (`domainController.currentModelEnvironment`) after `loadConfigurationFromPersistenceStore` | the `rollback` path | reuses existing code | the server's local cache is never loaded today (no server-side `rollback`, `remoteLocalCacheRollback` is never sent); a rollback loads the data section of every Entity into server memory |
| D2-c. The client sends its environment | in the request | no server state | large payloads; trusts the client's model |

### D3 — How the environment reaches the store

**Status:** Accepted — forward on every hop (the issue's proposal). The saga, the PersistenceStoreController and the Postgres section already take an optional `currentModel`; the DomainController drops it (`executeBoxedExtractorOrQueryAction`, `handleQueryTemplateActionForServerONLY`), and the filesystem, IndexedDB, MongoDB and bundled sections drop it and run with `defaultMiroirModelEnvironment`.

### D4 — When the cached environment is refreshed

**Status:** Accepted — D4-a. **Serves:** G3.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D4-a. Drop on model writes in the REST handlers** ★ | `restActionHandler`: model actions, store / bundle actions, instance writes on a `model` section; `restMethodsPostPutDeleteHandler` on a `model` section | one place, covers the client's commit replay (instance writes on the model section) | a write made by a server-side caller outside the REST handlers (MCP) is seen after the next REST model write |
| D4-b. Rebuild on every request | no cache | always fresh | one store read per model Entity per query |
| D4-c. Fingerprint the model section | compare a revision per request | exact | needs a cheap revision from every store backend, which does not exist |

---

## 4. Current state

### 4.1 REST handlers (misaligned)

`RestServer.ts` passes `defaultMiroirModelEnvironment` (Miroir's meta-model) where the issue says, with a "TODO: get the right model for the app / deployment":

| Handler | Call | Environment today |
|---|---|---|
| `restActionHandler`, model actions | `domainController.handleAction(…, MODEL_ENDPOINT)` | `defaultMiroirModelEnvironment` |
| `restActionHandler`, instance actions | `domainController.handleAction(…, INSTANCE_ENDPOINT)` | `undefined` (instance actions ignore it: `ActionImplementations.ts` `handleInstanceAction`) |
| `queryActionHandler` | `domainController.handleBoxedExtractorOrQueryAction` | `defaultMiroirModelEnvironment` |
| `queryTemplateActionHandler`, server | `domainController.handleQueryTemplateActionForServerONLY` | `defaultMiroirModelEnvironment`, passed as a third argument the method does not declare |
| `queryTemplateActionHandler`, client | `runQueryTemplateWithExtractorCombinerTransformer` | `defaultMiroirModelEnvironment` |

The same handlers serve the real server (`miroir-server/src/server.ts`), the emulated server of the tests (`RestClientStub.ts`) and Electron (`ipcServerSetup.ts`), each with its own `PersistenceStoreControllerManager`.

### 4.2 The environment is dropped before the store (misaligned)

| Hop | Takes an environment | Forwards it |
|---|---|---|
| `DomainController.executeBoxedExtractorOrQueryAction` (local mode) | `currentModel?` | no: `handlePersistenceActionForLocalPersistenceStore(action, map)` |
| `PersistenceReduxSaga.handlePersistenceActionForLocalPersistenceStore` → `innerHandle…` | `currentModel?` | yes, to `PersistenceStoreController.handleBoxedQueryAction` |
| `PersistenceStoreController.handleBoxedQueryAction` | `currentModel?` | yes, to the section store |
| Postgres `sqlDbInstanceStoreSectionMixin.handleBoxedQueryAction` → `SqlDbQueryRunner` | yes | yes, down to `sqlStringForQuery(…, modelEnvironment)`; `defaultMetaModelEnvironment` when absent |
| Filesystem, IndexedDB, MongoDB mixins, bundled sections | no | `ExtractorRunnerInMemory.handleBoxedQueryAction` runs with `defaultMiroirModelEnvironment` |

### 4.3 SQL translation (misaligned)

`sqlStringForRuntimeTransformer` (`SqlGenerator.ts`) looks the type up in the static `applicationTransformerDefinitions`. A stock composite (`case "transformer"`) is translated by recursion on its body with `{ ...queryParams, ...castTransformer }`; an application composite is refused with `QueryNotExecutable` ("transformerType not found in applicationTransformerDefinitions"). `sqlStringForQuery` has `modelEnvironment` in scope and calls `sqlStringForRuntimeTransformer` for query parameters and runtime transformers; `sqlStringForCombiner` calls it for `applyTransformer`. The 36 handlers of `sqlTransformerImplementations` share the `ITransformerHandler` signature (9 positional parameters).

### 4.4 Server model (missing)

The server opens its deployments (`openRegisteredDeployments`) but never loads their model: its DomainController's local cache stays empty, so `domainController.currentModelEnvironment(app, map)` would give empty collections. `getMiroirFundamentalSchemaForDeployment(deploymentUuid, model)` (`2_domain/schemaForDeployment.ts`) builds the deployment schema with the composite branches (#502 slice 2) from any `MetaModel`, and `transformerDefinitionRegistry(modelEnvironment)` (#502 slice 0) gives the registry of any environment.

## 5. Key reuse

| Piece | Location |
|---|---|
| Registry of an environment | `transformerDefinitionRegistry` — `miroir-core/src/2_domain/TransformerDefinitionRegistry.ts` |
| Deployment schema with composite branches | `getMiroirFundamentalSchemaForDeployment` — `miroir-core/src/2_domain/schemaForDeployment.ts` |
| Section of a model Entity for an application | `getApplicationSection` — `miroir-core` |
| MetaModel assembly from collections (to mirror) | `currentModel` — `miroir-localcache-redux/src/4_services/localCache/Model.ts` |
| Model Entities | `entityEntity` (`16dbfe28-…`), `entityEntityVersion`, `entityEndpointVersion`, `entityMlSchema`, `entityMenu`, `entityReport`, `entityQueryVersion`, `entityRunner`, `entityMiroirTest`, `entityDefinitionTheme`, `entityTransformerDefinition` (`a557419d-a288-4fb8-8a1e-971c86c113b8`), `entitySelfApplication`, `entitySelfApplicationVersion` — `miroir-app-miroir` |
| Server-path integration harness | `AppStackIntegrationTestSession`, `resetIntegTestbed` — `miroir-standalone-app/tests/helpers/` |
