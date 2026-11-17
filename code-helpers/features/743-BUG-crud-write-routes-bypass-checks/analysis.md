# 743 — Remove the plain CRUD write routes that bypass the DomainController checks

> Feasibility study of option 1 of #743: delete the server routes `PUT|POST|DELETE /CRUD/:deploymentUuid/:section/entity`, which write through `PersistenceStoreController` and skip every check `DomainController.handleInstanceAction` makes. Conclusion: no code path builds a request for these routes; they can be removed, with the client code that would call them.

Related issue: https://github.com/miroir-framework/miroir/issues/743
Found by: the Greptile review of #742 · Checks it bypasses: #214 (partial mutation), keyless Entities, #9 (following deployments, Deployment `role`)
Key sources:
[`RestServer.ts`](../../../packages/miroir-core/src/4_services/RestServer.ts) ·
[`RestClientStub.ts`](../../../packages/miroir-core/src/4_services/RestClientStub.ts) ·
[`createMiroirServerApp.ts`](../../../packages/miroir-server-library/src/createMiroirServerApp.ts) ·
redux / zustand [`RestPersistenceClientAndRestClient.ts`](../../../packages/miroir-localcache-redux/src/4_services/persistence/RestPersistenceClientAndRestClient.ts) ·
[`DomainController.ts`](../../../packages/miroir-core/src/3_controllers/DomainController.ts)

**Status:** analysis, decisions proposed, awaiting the user's confirmation.

---

## 1. Goals

- **G1 — One gate for instance writes.** In order to trust that a following deployment's model and a Deployment's `role` cannot change by accident, as an application maintainer, I can rely on every instance write that reaches the server going through `DomainController.handleInstanceAction`.
- **G2 — Less dead surface.** In order to read and secure the server without guessing, as a Miroir developer, I see only the REST routes that some client uses.

## 2. Non-goals

- Store-management actions on `POST /action/:actionType` (`storeManagementAction_createStore/deleteStore/openStore/closeStore`) and server-routed Git actions (`gitAction_checkout`, …), which also run without the #9 instance checks (§4.4). They act on whole stores or on files, not on instances. Follow-up issue, see D4.
- The `GET /CRUD/.../all` read route: it stays (§4.2).
- `LocalPersistenceAction_*` (local mode, no REST route).
- The off-by-one in `localPersistenceAction`'s schema (`slice(0, 3)` drops `LocalPersistenceAction_delete`, §4.5): separate bug, noted here only.

## 3. Decision record

| Decision | Proposed choice | Serves |
|---|---|---|
| D1. Can the three write routes be deleted without breaking a client? | **Yes, delete them and `restMethodsPostPutDeleteHandler`**: no code builds a write request for them (§4.3). | G1, G2 |
| D2. What becomes of the client actions `RestPersistenceAction_create/update/delete`, which would call the deleted routes? | **Keep the action types in the PersistenceEndpoint; the REST clients answer them with an `Action2Error`** instead of an HTTP call. Removing them from the schema is a follow-up. | G2 |
| D3. Does the never-taken "client" branch of `restActionHandler` go too? | **Yes**: both callers pass `useDomainControllerToHandleModelAndInstanceActions = true`, and the branch writes to the store without the checks. | G1, G2 |
| D4. Is the acceptance "whichever route" met while store-management and Git actions still skip the #9 instance checks? | **Yes for instance writes; open a follow-up for store and Git actions** (they do not write instances). | G1 |

### D1. Can the three write routes be deleted without breaking a client?

**What is at stake.** Today a client can `PUT /CRUD/<following deployment>/model/entity` with a changed Entity in `crudInstances`, and the server upserts it into the following deployment's model, which #9 forbids. The same with a Deployment row in Admin's `data` section whose `role` is changed. Only the credential and secret guards (#71, #270) run on that route.

The route also gets around the deployment-access gate (#263, #264). `mountRestHandlers` authorizes the deployments `deploymentUuidsFromHttpRequest` finds: the URL's `:deploymentUuid`, `body.deploymentUuid`, and the fields of `body.payload` / `body.action.payload`. The handler ignores the URL parameter and writes to `body.deploymentUuid ?? body.applicationDeploymentMap[body.application]` (`RestServer.ts` l. ~339). A body with a top-level `application` and its own map, and no `deploymentUuid`, writes to a deployment the gate never checked.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D1-a. Delete the routes** ★ | Remove the 3 entries from `restServerDefaultHandlers` and `restMethodsPostPutDeleteHandler`. Express answers 404; `RestClientStub` throws `No handler found`. | No second write path left to keep in step with the DomainController. Removes code marked "still used?". | An external REST client of a released server that used these routes breaks (none known; §4.3). |
| D1-b. Route the writes through `handleInstanceAction` (option 2 of the issue) | The handler builds `createInstance`/`updateInstance`/`deleteInstance` and calls the DomainController. | Keeps the URL contract. | Two URLs for the same action, for no known client; the action has to rebuild `application` from a deployment uuid; the access-gate bypass above has to be fixed as well. |
| D1-c. Apply the checks in the stores | Move #9 / #214 / keyless checks down to `PersistenceStoreController`. | Covers every route at once. | The checks need the model environment and the Admin store, which the DomainController has and the store controller does not; it reverses the layering. |

**Proposed:** D1-a. D1-b stays the fallback if the user knows of an outside client.

### D2. What becomes of the client actions `RestPersistenceAction_create/update/delete`?

**What is at stake.** The redux and zustand `RestPersistenceClientAndRestClient.handleNetworkPersistenceAction` turn these actions into `PUT`/`DELETE /CRUD/...`. Once the routes are gone, a caller would get an HTTP 404 with no hint of what to use.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D2-a. Keep the types, answer with an `Action2Error`** ★ | The two clients return `Action2Error("FailedToHandlePersistenceAction", "… removed (#743): send createInstance/updateInstance/deleteInstance")` for these three types; the `GET` branch stays. | No schema change, no type regeneration. | Three action types in the schema that always fail. |
| D2-b. Remove them from the PersistenceEndpoint | Delete the 3 actions from `a93598b3-…json`, regenerate types, remove the switch cases in the sagas / async store. | Nothing dead left. | `getMiroirFundamentalMlSchema` builds `localPersistenceAction` and `restPersistenceAction` by array index (`slice(0, 3)`, `slice(4)`), so the change touches the bootstrap schema and `ActionImplementations.unit.test.ts`; a `devBuild` and a wider review for a bug fix. |

**Proposed:** D2-a now; D2-b goes in the follow-up issue together with the `slice(0, 3)` bug (§4.5).

### D3. Does the never-taken "client" branch of `restActionHandler` go too?

**What is at stake.** `restActionHandler` (instance and model actions) has an `else` branch for `useDomainControllerToHandleModelAndInstanceActions === false` that calls `localPersistenceStoreController.handleAction(action)` directly, skipping the same checks. Its comment describes a `RestMswServerStub` that no longer exists.

| Option | Pros | Cons |
|---|---|---|
| **D3-a. Remove the branch** ★ (keep the parameter, always `true`) | No route left that writes instances without the DomainController. | Touches a second handler. |
| D3-b. Leave it | Smaller diff. | A latent bypass stays behind a flag nobody sets to `false`. |

Callers checked: `createMiroirServerApp.mountRestHandlers` passes `true`; `RestClientStub.call` passes `true` (used by the emulated server and by `miroir-standalone-app-electron/src/ipcServerSetup.ts`). No other caller of `restServerDefaultHandlers[].handler`.

**Proposed:** D3-a. Removing the parameter from the `RestServiceHandler` signature is not needed for the bug.

### D4. Is "whichever route" met while store-management and Git actions skip the #9 instance checks?

**What is at stake.** `POST /action/storeManagementAction_deleteStore` (or `createStore`) naming a following deployment goes to `storeActionOrBundleActionStoreRunner` without a #9 check, and a server-routed `gitAction_checkout` can change a following deployment's model files on a filesystem store. None of them writes an instance; whether #9 must refuse them is a #9 design question, not a CRUD-route one. (`storeManagementAction_resetAndInitApplicationDeployment` and `bundleAction` fall to the `default:` of `storeActionOrBundleActionStoreRunner`, `ActionRunner.ts` l. ~296, which only logs a warning: they do nothing on that path.)

**Proposed:** this issue covers instance writes (the issue's examples: a `model`-section write and a `role` change). A follow-up issue asks whether store and Git actions on a following deployment must be refused, and where.

---

## 4. Current state

### 4.1 The routes (`RestServer.ts`, `restServerDefaultHandlers`)

| Method | URL | Handler | Checks run |
|---|---|---|---|
| get | `/CRUD/:deploymentUuid/:section/entity/:parentUuid/all` | `restMethodGetHandler` | read only |
| put | `/CRUD/:deploymentUuid/:section/entity` | `restMethodsPostPutDeleteHandler` | `assertCredentialInstanceMutationAllowed`, `assertSecretInstanceMutationAllowed` only |
| post | same | same | same |
| delete | same | same | same |
| post | `/action/:actionType` | `restActionHandler` | instance/model actions: `domainController.handleAction` (all checks); store/bundle actions: none (§4.4) |
| post | `/queryTemplate` | `queryTemplateActionHandler` | read |
| post | `/query` | `queryActionHandler` | read |

`restMethodsPostPutDeleteHandler` resolves the deployment from `body.deploymentUuid ?? body.applicationDeploymentMap[body.application]`, then calls `upsertInstance` (put, post) or `deleteInstance` (delete) on the store controller for each `body.crudInstances`, and forgets the cached model environment when `section === "model"`.

The routes are mounted by `createMiroirServerApp.mountRestHandlers` (real server, behind the authentication gate) and looked up by `RestClientStub.call` (emulated server, electron IPC server).

### 4.2 The read route stays

`GET /CRUD/.../all` is used by:

- `RestPersistenceAction_read`, built by `DomainController.executeLoadConfigurationFromPersistenceStore` (l. ~710, ~825) and `createReportQueryLoadExecutor` (l. ~300) in remote mode;
- `ci/release/release_lib/consumer_project.py`, `scripts/tests/test_server_release_smoke.py`, `packages/miroir-server-library/tests/createMiroirServerApp.integ.test.ts`;
- the access tests `access.262.phase3`, `access.264.phase3`.

### 4.3 Who builds a write request for the CRUD routes: nobody

Searched with `git grep` over `packages/*/src`, `packages/*/tests`, `packages/*/assets`, `scripts/`, `ci/`:

| Path to the write routes | Found |
|---|---|
| An action `RestPersistenceAction_create/update/delete` built in source or tests | none. Only `switch` cases (sagas, async store, REST clients, redux `UndoRedoReducer.ts` l. ~506), the endpoint definition `a93598b3-19b6-42e8-828c-f02042d212d4.json`, and the list in `ActionImplementations.unit.test.ts`. |
| Such an action in a MiroirTest, Runner or other JSON asset | none; the endpoint uuid appears in no asset but its own definition. |
| Through `domainController.handleAction` (MCP, runners) | not reachable: the PersistenceEndpoint declares no `actionImplementation` for any of its 8 actions (enumerated with Python). |
| Commit replay (`DomainController`, l. ~2560) | builds `createInstance`/`updateInstance`/`deleteInstance` (the suffix after the last `_` of the traced action), sent to `/action`, not to `/CRUD`. |
| A direct HTTP `PUT`/`POST`/`DELETE` to `/CRUD` (Python scripts, CLI, MCP, docs) | none; every `/CRUD/` URL found is a `GET .../all`. |
| A test of `restMethodsPostPutDeleteHandler` or `crudInstances` | none. |

Even the dead client code never reaches `POST`: both REST clients map `RestPersistenceAction_create` and `_update` to `put`.

Two tests pin the route list and will change: `authentication.71.phase0.unit.test.ts` ("the seven CRUD/action/query routes") and `secrets.270.phase0.unit.test.ts` ("still has the 7 CRUD urls"). They assert the shape of `restServerDefaultHandlers`, not a use of the write routes.

### 4.4 Other server paths that write without the DomainController

| Path | Writes | In scope |
|---|---|---|
| `restActionHandler`, branch `useDomainControllerToHandleModelAndInstanceActions === false` | any instance/model action, straight to `PersistenceStoreController.handleAction` | yes, D3 |
| `restActionHandler`, `storeManagementAction_*` → `storeActionOrBundleActionStoreRunner` | whole stores (create, delete, open, close) | no, D4 follow-up |
| server-routed Git actions (`SERVER_ROUTED_MIROIR_ACTION_TYPES`, `GitAction.ts`) | deployment files on filesystem stores | no, D4 follow-up |
| commit replay, `POST /action/commit` → `DomainController` (l. ~2535–2580) → `callPersistenceAction` | the instances of a transaction | covered for #9 (`transactionRoleRefusal`, test A2 "role changed in a transaction"); #214 and keyless checks do not run there. Not a CRUD route; noted only |
| `ModelInitializer` (`upsertInstances`) | the initial model of a new deployment | no: server-side setup, not a route |

### 4.5 Side finding

`getMiroirFundamentalMlSchema.ts` (l. ~3304) builds `localPersistenceAction` with `getEndpointActions(persistenceEndpointVersionV1).slice(0, 3)`, i.e. `LocalPersistenceAction_create/read/update`, without `_delete` (index 3). `restPersistenceAction` uses `slice(4)` (all four Rest actions). Unrelated to the routes; for the D2-b follow-up.

### 4.6 Where the checks live

`DomainController.handleInstanceAction` (l. ~1373): #214 partial-mutation rejection, keyless-Entity rejection (`keylessEntityInstanceActionError`), and #9 (`FOLLOWING_DEPLOYMENT_REFUSED_SECTIONS = ["model", "modelVersion"]`, the immutable Deployment `role`). Existing tests of the refusals, in `miroir-standalone-app/tests/3_controllers/versioning/followingDeployment.integ.test.ts`: A2 ("the role of a deployment cannot change") goes through the client DomainController, and reaches `/action` only under an emulated-server profile; A3.1 ("the server refuses a model write a remote client sends") calls `serverDomainController.handleAction` directly (l. ~486), so `restActionHandler` never runs. Neither proves the refusal on the HTTP route itself.

## 5. Acceptance mapping

Issue acceptance: *a write to the `model` section of a following deployment, and a change to a Deployment's `role`, are refused whichever route they come from, and a test shows it.*

| Route | How the refusal is shown |
|---|---|
| `POST /action/{createInstance,updateInstance,deleteInstance}` | new test: the model write to the following deployment and the Deployment `role` change, sent through `RestClientStub` to `/action/:actionType` (so `restActionHandler` runs), are refused and the stores are unchanged. A2 and A3.1 test the DomainController, not the route |
| `PUT/POST/DELETE /CRUD/.../entity` | new test: `restServerDefaultHandlers` has no `put`/`post`/`delete` route; a `PUT /CRUD/<following>/model/entity` with a changed Entity, and a `PUT /CRUD/<Admin>/data/entity` with a changed Deployment `role`, through `RestClientStub`, are refused (`No handler found`) and the stores are unchanged; the same against a real server answers 404 (`createMiroirServerApp.integ.test.ts`) |
| `/action` "client" branch | removed (D3); a test that `restActionHandler` with the flag `false` still goes through the DomainController, or the flag removed from the branch |
| store / bundle actions | follow-up (D4) |

## 6. Impact

| Area | Change |
|---|---|
| `miroir-core` `RestServer.ts` | delete 3 routes, `restMethodsPostPutDeleteHandler`, the `else` branch of `restActionHandler` |
| redux / zustand `RestPersistenceClientAndRestClient.ts` | `RestPersistenceAction_create/update/delete` return an `Action2Error`; their `getRestCallParams` cases go |
| `PersistenceInterface.ts` | `crudInstances` in `HttpRequestBodyFormat`: remove if unused after the change |
| tests | 71 phase0 and 270 phase0 route lists (7 → 4); new acceptance tests (§5) |
| docs | `docs/reference/authentication.md` ("CRUD / action / query" row), `docs/reference/https-architecture.md` (l. ~88), `miroir-server-library/README.md` (`/CRUD/...`): say read-only |
| Vite proxy | the `/CRUD` key in `miroir-standalone-app/vite.config.js` stays (the GET route needs it) |
| released server | breaking for an outside client that used the write routes (none known); say so in the PR |

Effort: small. One package for the server change, two client files, tests. No schema change, no type regeneration (with D2-a).

## 7. Review

An adversarial review (cold read with the issue and the code) confirmed §4.3: no code builds a write request for the CRUD routes. Its findings, all taken in this version: A2 and A3.1 do not exercise the HTTP route (§4.6, §5); the CRUD write route also gets around the deployment-access gate (D1); `resetAndInitApplicationDeployment` and `bundleAction` are no-ops on the store runner, while Git and create/delete-store actions belong in the D4 follow-up; commit replay listed in §4.4; the `role` case added to the CRUD test; `UndoRedoReducer`, the Vite proxy and `https-architecture.md` added.

Next: `tdd-implementation-plan.md`, once the decisions are confirmed.
