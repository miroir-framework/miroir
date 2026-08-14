# Workflow: `runBoxedQueryAction` on an emulated server

This is the first document in a series of **action-workflow** notes. Each note traces one action through one runtime profile, with enough detail to read logs and enough structure to copy for the next action or profile.

**This note:** `runBoxedQueryAction` (the boxed “run a Query” action) on **emulated server + SQL**.

**Audience:** someone new to the framework who has a log dump and wants a consistent picture of who talks to whom.

**Grounding run:** MiroirTest leaf `Refresh all Instances` in suite `domainController.data.crud` (`domain_controller_data_crud`), profile `emulatedServer-sql`. Reproduce with:

```bash
npm run testMiroir -w miroir-standalone-app -- \
  --profile emulatedServer-sql \
  --suites domain_controller_data_crud \
  --mode integ \
  --filter '{"domainController.data.crud":["Refresh all Instances"]}'
```

---

## 1. What “emulated server” means

There is **no HTTP server process** and **no real network**. One Node process builds **two** `DomainController` instances and a stub that pretends to be REST:

| Role | Object | `persistenceStoreAccessMode` | Talks to |
|------|--------|------------------------------|----------|
| **Client** | `domainControllerForClient` | `"remote"` | Client `LocalCache` (Redux) **and** a REST facade |
| **Server** | `domainControllerForServer` | `"local"` | `PersistenceStoreController` → Postgres |
| **Network stand-in** | `RestClientStub` | — | In-process call to the same `restServerDefaultHandlers` a real `miroir-server` would use |

Wiring lives in `packages/miroir-standalone-app/src/miroir-fwk/4-tests/setupMiroirTest.ts`. Both controllers share one `MiroirContext` (same activity tracker / logger context). The stub is given the **server** controller and the **server** `PersistenceStoreControllerManager`.

```mermaid
flowchart LR
  subgraph clientProc["Same Node process"]
    subgraph client["Client side"]
      CDC["DomainController<br/>mode: remote"]
      LC["LocalCache<br/>Redux"]
      SagaC["PersistenceReduxSaga"]
      REST["RestPersistenceClientAndRestClient"]
      Stub["RestClientStub"]
      CDC --> LC
      CDC --> SagaC
      SagaC --> LC
      SagaC --> REST
      REST --> Stub
    end
    subgraph server["Server side (emulated)"]
      Handlers["RestServer handlers<br/>POST /query, /action, CRUD…"]
      SDC["DomainController<br/>mode: local"]
      SagaS["PersistenceReduxSaga"]
      PSC["PersistenceStoreController"]
      PG["Postgres<br/>miroir / Library schemas"]
      Stub --> Handlers
      Handlers --> SDC
      SDC --> SagaS
      SagaS --> PSC
      PSC --> PG
    end
  end
```

A **real server** profile (`realServer-sql`) keeps the same REST contract (`POST /query`, `POST /action/:actionType`, …) but replaces `RestClientStub` with `RestClient` + HTTP to `miroir-server`. That profile is out of scope here.

---

## 2. Name map (logs vs conversation)

People (and this series) say “PersistenceStoreRunner”. The code uses several classes. When you grep logs, match on the **logger name**, not the informal name.

| Informal name | Actual type | Logger name | Layer |
|---------------|-------------|-------------|-------|
| Client DomainController | `DomainController` | `3_miroir-core_DomainController` | 3 |
| Client localCache | `LocalCache` + `LocalCacheSlice` | `4_miroir-localcache-redux_LocalCache`, `…_LocalCacheSlice` | 4 |
| Client PersistenceStoreRunner / saga | `PersistenceReduxSaga` | `4_miroir-localcache-redux_PersistenceReduxSaga` | 4 |
| REST facade | `RestPersistenceClientAndRestClient` | `4_miroir-localcache-redux_RestPersistenceClientAndRestClient` | 4 |
| Network / stub | `RestClientStub` | `4_miroir-core_RestClientStub` | 4 |
| REST dispatch | `queryActionHandler` / `restActionHandler` | `4_miroir-core_RestServer` | 4 |
| Server DomainController | same class, other instance | `3_miroir-core_DomainController` | 3 |
| Server PersistenceStoreRunner | `PersistenceStoreController` | `4_miroir-core_PersistenceStoreController` | 4 |
| Storage query runner | `SqlDbQueryRunner` / `ExtractorRunnerInMemory` | `4_miroir-store-postgres_…`, `2_miroir-core_ExtractorRunnerInMemory` | 4 / 2 |
| In-cache query selectors | `QuerySelectors`, `DomainStateQuerySelector` | `2_miroir-core_QuerySelectors`, `2_miroir-core_DomainStateQuerySelector` | 2 |

Logger names are `{cleanLevel}_{package}_{Class}` (see `MiroirLoggerFactory.getLoggerName`). Clean levels follow the folder: `2_domain`, `3_controllers`, `4_services`.

---

## 3. The action that is actually being run

`Refresh all Instances` is a **composite** test, not a lone query. Sequence from the MiroirTest JSON:

1. `rollback` on Miroir (`360fcf1f-…`) — “refresh” client cache from storage.
2. `rollback` on Library (`5af03c98-…`) — same for the Library deployment.
3. `compositeRunBoxedQueryAction` named `calculateNewEntityDefinionAndReports`, result bound as `entityBookList`.
4. Assertions (`checkNumberOfBooks` expects 5, then the book list).

The inner query is:

```json
{
  "actionType": "runBoxedQueryAction",
  "endpoint": "9e404b3c-368c-40cb-be8b-e3c28550c25e",
  "payload": {
    "application": "5af03c98-fe5e-490b-b08f-e1230971c57f",
    "applicationSection": "data",
    "query": {
      "queryType": "boxedQueryWithExtractorCombinerTransformer",
      "extractors": {
        "books": {
          "extractorOrCombinerType": "extractorInstancesByEntity",
          "parentUuid": "e8ba151b-d68e-4cc3-9a83-3459d309ccf5"
        }
      }
    }
  }
}
```

There is **no** `queryExecutionStrategy` on this leaf. The client default is **`localCacheOrFail`**. So the query itself never goes to Postgres. The thousands of SQL lines in the log are **session bootstrap + rollback**, not the query.

That default is intentional: transactional / model scripts mutate the client cache until `commit`. Querying storage would hide uncommitted work.

---

## 4. Bird’s-eye: two ways a query can run

`DomainController.handleBoxedExtractorOrQueryAction` is the fork. Client vs server is `this.persistenceStoreAccessMode`. Strategy is `payload.queryExecutionStrategy`.

```mermaid
flowchart TD
  A["compositeRunBoxedQueryAction<br/>or direct runBoxedQueryAction"] --> B["DomainController.handleBoxedExtractorOrQueryAction"]
  B --> C{persistenceStoreAccessMode}
  C -->|local = server DC| D["Always PersistenceStoreController<br/>handleBoxedQueryAction"]
  C -->|remote = client DC| E{queryExecutionStrategy}
  E -->|"localCacheOrFail (default)"| F["PersistenceReduxSaga.handlePersistenceActionForLocalCache<br/>→ LocalCache.runBoxedExtractorOrQueryAction"]
  E -->|storage| G["PersistenceReduxSaga.handlePersistenceActionForRemoteStore<br/>→ POST /query"]
  E -->|ServerCache / localCacheOrFetch| H["Not implemented — throws"]
  G --> I["RestClientStub → RestServer.queryActionHandler"]
  I --> J["Server DomainController<br/>mode local"]
  J --> D
  D --> K["Section store + SqlDbQueryRunner / ExtractorRunnerInMemory"]
  K --> L["Postgres"]
  F --> M["Redux DomainState selectors"]
```

`ServerCache` and `localCacheOrFetch` currently throw. Only `localCacheOrFail` and `storage` are live.

---

## 5. Path A — what `Refresh all Instances` actually does

This is the path you will see in a log of this leaf.

### 5.1 Before the query: `rollback` fills the client cache

`rollback` is **not** a query, but it is why the query can stay on the client. Client `DomainController.handleModelAction` → `loadConfigurationFromPersistenceStore`:

1. Client mode is `"remote"`, so each entity collection is read with `RestPersistenceAction_read`.
2. That goes through **client saga → REST facade → `RestClientStub` → server handlers → server DomainController / PersistenceStoreController → Postgres `SELECT`**.
3. Returned instances are written into the **client** Redux cache (`loadNewInstancesInLocalCache` / `LocalCacheSlice`).
4. A second `rollback` on the client cache (`LocalCache.handleLocalCacheAction`) resets undo/redo to the freshly loaded snapshot.

Log signatures for this phase:

| You see | Meaning |
|---------|---------|
| `3_miroir-core_DomainController### DomainController handleAction START actionType= rollback` | Client (or server) DC entered `handleAction` |
| `4_miroir-core_RestClientStub### RestClientStub call … method= post` then `found methodToCall` | In-process “HTTP” hop |
| `4_miroir-core_PersistenceStoreController### … getInstances section data entity` | Server store listing instances |
| `Executing (default): SELECT …` | Sequelize talking to Postgres |
| `4_miroir-localcache-redux_LocalCache### LocalCache handleAction` with `loadNewInstancesInLocalCache` | Client cache ingest |
| `DomainController loadConfigurationFromPersistenceStore completed successfully` | That application’s rollback finished |

This phase is **verbose**. One rollback walks every model/data/modelVersion entity. Do not look for `runBoxedQueryAction` until you see `handleCompositeAction compositeActionSequence handling sub action` with `compositeRunBoxedQueryAction`.

### 5.2 The query: client cache only

After both rollbacks:

1. `handleCompositeAction` unwraps `compositeRunBoxedQueryAction` and calls `handleCompositeRunBoxedQueryAction`.
2. That calls `handleBoxedExtractorOrQueryAction` with the inner `runBoxedQueryAction`.
3. Client DC is `"remote"` and strategy defaults to `localCacheOrFail`.
4. `PersistenceReduxSaga.handlePersistenceActionForLocalCache` → `LocalCache.runBoxedExtractorOrQueryAction`.
5. `getDomainStateExtractorRunnerMap()` + `runQuery` walk extractors **synchronously** on Redux `DomainState`.
6. `extractorInstancesByEntity` for Book becomes `selectEntityInstanceUuidIndexFromDomainState` / list extract on deployment `f714bb2f-…`, section `data`, entity `e8ba151b-…`.
7. Result `{ books: [ five Book instances ] }` is stored in the composite context as `entityBookList`.

Log signatures (from the grounding run, timestamp `22:41:27`):

```
3_miroir-core_DomainController### &&&&&& handleCompositeAction compositeActionSequence handling sub action
  actionType: 'compositeRunBoxedQueryAction'
  nameGivenToResult: 'entityBookList'

#*-*-*-runBoxedQueryAction# … 4_miroir-localcache-redux_LocalCache### LocalCache action= { "actionType": "runBoxedQueryAction", … }

#*-*-*-runBoxedQueryAction# … 2_miroir-core_QuerySelectors### innerSelectDomainElementFromExtractorOrCombiner
  … extractorOrCombinerType: 'extractorInstancesByEntity' … parentUuid: 'e8ba151b-…'

#*-*-*-runBoxedQueryAction# … 2_miroir-core_DomainStateQuerySelector### selectEntityInstanceUuidIndexFromDomainState

3_miroir-core_DomainController### handleCompositeRunBoxedQueryAction adding result to context as entityBookList
  returnedDomainElement: { books: [ [Object] × 5 ] }
```

**What you will not see on this leaf:** `RestClientStub` for `/query`, `PersistenceStoreController.handleBoxedQueryAction`, or a `SELECT` on `"Library"."Book"` caused by the query itself.

### 5.3 After the query: assertions

`compositeRunTestAssertion` reads `entityBookList.books` from the composite context. Logger context switches to `checkNumberOfBooks`. That is test machinery, not the query pipeline.

---

## 6. Path B — `queryExecutionStrategy: "storage"` (full stack)

This is the path a newcomer usually *imagines* when they say “run a query on the emulated server”. Other leaves in the same suite (and model CRUD) set `"storage"` explicitly. Walk it once so storage logs make sense.

```mermaid
sequenceDiagram
  autonumber
  participant Test as MiroirTest / composite
  participant CDC as Client DomainController
  participant SagaC as Client PersistenceReduxSaga
  participant REST as RestPersistenceClientAndRestClient
  participant Stub as RestClientStub
  participant RS as RestServer queryActionHandler
  participant SDC as Server DomainController
  participant SagaS as Server PersistenceReduxSaga
  participant PSC as PersistenceStoreController
  participant QR as SqlDbQueryRunner
  participant PG as Postgres

  Test->>CDC: compositeRunBoxedQueryAction.payload = runBoxedQueryAction
  CDC->>CDC: handleBoxedExtractorOrQueryAction<br/>mode remote, strategy storage
  CDC->>SagaC: handlePersistenceActionForRemoteStore
  SagaC->>REST: handleNetworkPersistenceAction
  REST->>Stub: POST /query  body { action, applicationDeploymentMap }
  Stub->>RS: restServerDefaultHandlers match url /query
  RS->>SDC: handleBoxedExtractorOrQueryAction
  SDC->>SDC: mode local → skip strategy, always local persistence
  SDC->>SagaS: handlePersistenceActionForLocalPersistenceStore
  SagaS->>PSC: handleBoxedQueryAction
  PSC->>PSC: section = payload.applicationSection (data)
  PSC->>QR: section store.handleBoxedQueryAction
  alt query.runAsSql
    QR->>PG: SQL extractor map
  else default (in-memory over store reads)
    QR->>PG: getInstances / findAll then in-memory extractors
  end
  PG-->>QR: rows
  QR-->>CDC: Action2ReturnType { status: ok, returnedDomainElement }
  CDC->>Test: bind nameGivenToResult
```

Layer by layer:

1. **Client DomainController** — `handleBoxedExtractorOrQueryAction`, `case "storage"`: `handlePersistenceActionForRemoteStore`.
2. **Client saga** — Redux-saga generator `handlePersistenceActionForRemoteStore`. Access mode `"local"` is forbidden here (that is the server). It calls `innerHandlePersistenceActionForRemoteStore`.
3. **REST facade** — `runBoxedQueryAction` maps to `POST /query` with `{ action, applicationDeploymentMap }`.
4. **Stub / “network”** — `RestClientStub.call` logs `method= post`, finds `{ method: "post", url: "/query", handler: queryActionHandler }`, invokes the handler with `useDomainControllerToHandleModelAndInstanceActions: true` and the **server** DC. The return is wrapped as `{ status: 200, data: result }` to look like `fetch`.
5. **RestServer** — `queryActionHandler` unwraps `body.action` and calls **server** `domainController.handleBoxedExtractorOrQueryAction`.
6. **Server DomainController** — `persistenceStoreAccessMode == "local"`: **ignores** client strategy and always uses `handlePersistenceActionForLocalPersistenceStore`.
7. **Server saga** — `runBoxedQueryAction` → `localPersistenceStoreController.handleBoxedQueryAction`.
8. **PersistenceStoreController** — picks model vs data vs modelVersion section from `payload.applicationSection`, delegates to that section store.
9. **Storage runner** — Postgres: `SqlDbInstanceStoreSectionMixin` → `SqlDbQueryRunner.handleBoxedQueryAction`. If `query.runAsSql` is set, extractors compile toward SQL; otherwise `ExtractorRunnerInMemory` issues store reads (`getInstances` / `findAll`) and runs extractors/combiners/transformers in memory.

Log signatures to look for on this path:

| Order | Logger | Message fragment |
|-------|--------|------------------|
| 1 | `3_miroir-core_DomainController` | `handleBoxedExtractorOrQueryAction` / composite sub-action with `runBoxedQueryAction` |
| 2 | `4_miroir-core_RestClientStub` | `call with params` … `endpoint` involving `/query` |
| 3 | `4_miroir-core_RestServer` | `queryActionHandler` |
| 4 | `3_miroir-core_DomainController` | same class, now on the **server** instance (mode local) |
| 5 | `4_miroir-core_PersistenceStoreController` | `handleBoxedQueryAction called with RunBoxedQueryAction` |
| 6 | `4_miroir-store-postgres_SqlDbInstanceStoreSectionMixin` | `handleBoxedQueryAction called for query` |
| 7 | Sequelize stdout | `SELECT … FROM "Library"."Book"` (or the relevant table) |
| 8 | `3_miroir-core_DomainController` | `handleCompositeRunBoxedQueryAction adding result to context as …` |

Client and server DomainControllers share one logger name. Distinguish them by **neighbors**: stub/RestServer lines sit **between** the two DC bursts; `PersistenceStoreController` / Sequelize sit on the server side only.

---

## 7. How to read a log line

Typical line:

```
#*NoTestSuite*-*NoTest*-*-*-runBoxedQueryAction# [22:41:27] info 4_miroir-localcache-redux_LocalCache### LocalCache action= {
```

| Piece | Meaning |
|-------|---------|
| `#…#` | Logger context template: `testSuite-test-testAssertion-compositeAction-action` |
| `*NoTestSuite*` / `*NoTest*` | Context slot not set (common in CLI integ; Vitest still prints the test title on `stdout \| …`) |
| trailing `runBoxedQueryAction` | `LoggerGlobalContext.setAction(actionType)` — you are **inside** that action |
| trailing `*` | No current action on the context (bootstrap, or action finished) |
| `[22:41:27]` | Local time |
| `info` | Level |
| `4_miroir-localcache-redux_LocalCache` | `{layer}_{package}_{logger}` |
| `###` | Separator before the message |

Vitest prefixes blocks with:

```
stdout | miroir-runner-tests.integ.test.ts > Refresh all Instances
```

That title is the **leaf**, not the logger context. Use it to skip bootstrap from other tests in a concatenated dump.

**Noise you can skip when hunting a query:**

- `Executing (default): INSERT/CREATE TABLE/DROP TABLE` during `initModel` / playfield seed.
- Redux “non-serializable value” warnings (`Date` on `timestamp`).
- Repeated `getOrCreateEntityAdapter` while rollback hydrates the cache.
- `upsertInstance` of Entity / EntityVersion during bootstrap.

**Anchor lines for this leaf:** first `handleCompositeAction … compositeRunBoxedQueryAction` after `loadConfigurationFromPersistenceStore completed successfully for application 5af03c98-…`. Everything above that is bootstrap + refresh.

---

## 8. Component cheat sheet

### Client `DomainController`

Entry: `handleAction` → `handleActionInternal` → for a sequence, `handleCompositeAction`. Queries are not `handleAction` of `runBoxedQueryAction` at the top level; they are **sub-actions** of `compositeActionSequence`.

Important methods:

- `handleBoxedExtractorOrQueryAction` — strategy fork (client) or always-storage (server).
- `handleCompositeRunBoxedQueryAction` — runs the inner query, stores `returnedDomainElement` under `nameGivenToResult`.
- `loadConfigurationFromPersistenceStore` — implementation of `rollback` / cache refresh.

### Client `PersistenceReduxSaga`

Three doors, easy to confuse:

| Method | Used for |
|--------|----------|
| `handlePersistenceActionForLocalCache` | Boxed query on Redux state (`localCacheOrFail`) |
| `handlePersistenceActionForRemoteStore` | Anything that must look like HTTP (`storage` queries, `RestPersistenceAction_read`, model actions sent to the server) |
| `handlePersistenceActionForLocalPersistenceStore` | **Server** DC talking to `PersistenceStoreController` |

Queries on the client cache **do not** `dispatch` a saga for the extract itself: `handlePersistenceActionForLocalCache` calls `this.localCache.runBoxedExtractorOrQueryAction` directly.

### Client `LocalCache`

Redux store of instances, keyed by `deploymentUuid_section_entityUuid`. `runBoxedExtractorOrQueryAction` takes a snapshot (`getDomainState()`) and runs the **sync** extractor map. No I/O.

`handleAction` / `handleLocalCacheAction` is the **write** path (ingest after rollback, undo/redo). Mixing the two in your head is a common log-reading mistake: `LocalCache action=` with `runBoxedQueryAction` is a **read**; `LocalCache handleAction` with `loadNewInstancesInLocalCache` is a **write**.

### Saga / “network”

`RestPersistenceClientAndRestClient.handleNetworkPersistenceAction` chooses URL by `actionType`:

- `runBoxedQueryAction` → `POST /query`
- `runBoxedQueryTemplateAction` → `POST /queryTemplate`
- most model/instance/store actions → `POST /action/:actionType`
- CRUD REST → `/CRUD/:deploymentUuid/:section/…`

`RestClientStub` does **not** serialize to the wire. It looks up `restServerDefaultHandlers` by `(method, rawUrl)` and calls the handler. Same handler table as `miroir-server`.

### Server `DomainController`

Same class. `persistenceStoreAccessMode: "local"` means “I own a PersistenceStoreControllerManager; I do not call REST.” Incoming `/query` always hits storage, even if the client payload still says `localCacheOrFail` (the client would not have sent it in that case).

### Server `PersistenceStoreController` / storage runner

One controller per **deployment** (Miroir vs Library vs Admin), with **sections** (model, data, modelVersion). `handleBoxedQueryAction` refuses to run if `applicationSection` is missing, then delegates to that section’s instance store.

Postgres section mixin forwards to `SqlDbQueryRunner`. Filesystem / IndexedDB / Mongo each have their own `ExtractorOrQueryPersistenceStoreRunner`. The interface is `handleBoxedQueryAction(query, applicationDeploymentMap, modelEnvironment)`.

---

## 9. Why this leaf is a good first log, and where it misleads

**Good:** you see rollback (full client↔stub↔server↔Postgres) and then a clean in-cache query, in one file. You can tell the two phases apart.

**Misleading if you only skim SQL:** most SQL is bootstrap and `getInstances` during rollback. The query that the test asserts on did **not** produce those `SELECT`s.

**To force Path B in a later note:** add `"queryExecutionStrategy": "storage"` on the `runBoxedQueryAction` payload (as other leaves in this suite already do) and look for `RestClientStub` + `handleBoxedQueryAction` + `SELECT` **after** the composite query sub-action, not only during rollback.

---

## 10. Series slots (not written yet)

Copy this file’s section shape (topology → name map → sequence → log signatures → cheat sheet) for:

| Slot | What changes |
|------|----------------|
| `runQuery` + `emulatedServer-filesystem` / `-mongodb` / `-indexedDb` | Storage runner class and SQL vs files vs IndexedDB log texture; stub wiring stays |
| `runQuery` + `realServer-sql` | `RestClient` + HTTP; two processes; server logs live in the server process |
| `rollback` / `commit` / `createInstance` | Different REST URL (`/action/:actionType`); cache writes; transactions |
| `runBoxedQueryTemplateAction` | `/queryTemplate`; extra template-resolution step |
| `runAsSql: true` | `SqlDbQueryRunner` SQL extractor map instead of in-memory-over-reads |

Parent index: [Architecture Overview](../architecture.md).
