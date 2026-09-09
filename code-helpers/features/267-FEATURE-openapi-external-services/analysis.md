# 267 — OpenAPI external services + Spotify playlist example app

> Analysis: how to let Miroir applications consume external HTTP services described by an
> OpenAPI (YAML/JSON) document — demonstrated by a self-contained example app displaying a
> Spotify playlist from a user-supplied playlist ID, with the access token held server-side
> as a named launch-time secret.

Related issue: https://github.com/miroir-framework/miroir/issues/267
Key sources: [`packages/miroir-core/src/3_controllers/DomainController.ts`](../../../packages/miroir-core/src/3_controllers/DomainController.ts), [`packages/miroir-core/src/4_services/RestServer.ts`](../../../packages/miroir-core/src/4_services/RestServer.ts), [`packages/miroir-server/src/server.ts`](../../../packages/miroir-server/src/server.ts), [`packages/miroir-test-app_deployment-miroir/src/Model.ts`](../../../packages/miroir-test-app_deployment-miroir/src/Model.ts), [`packages/miroir-core/src/2_domain/TransformersForRuntime.ts`](../../../packages/miroir-core/src/2_domain/TransformersForRuntime.ts)
External references: [Spotify Web API OpenAPI schema](https://developer.spotify.com/reference/web-api/open-api-schema.yaml), [Spotify "Building with AI" guide](https://developer.spotify.com/documentation/web-api/tutorials/building-with-ai)

**Document role:** analysis **and** architectural decision record.
**Status:** decisions confirmed with user (design grilling, 2026-09-09) — implementation phasing deferred to `tdd-implementation-plan.md`.

---

## Decision record

| Decision | Choice |
|---|---|
| D1 — where external services live in the meta-model | **Extend `Endpoint`; `definition` becomes a discriminated union (`actions` XOR `externalService`)** — homogeneity with action execution (composition, monitoring) |
| D2 — OpenAPI lifecycle | **Design-time selective sync: pure Transformer → reviewable `compositeActionSequence`** — no OpenAPI parsing at runtime |
| D3 — display schema for service data | **One external Entity per operation response, nested components inlined** — report stack unchanged; duplication accepted for now |
| D4 — credential handling | **Named secrets: `--secret <name>=<value>` CLI + `MIROIR_SECRET_<NAME>` env fallback, memory-only, redacted** — model carries the name only |
| D5 — execution location | **`extractorFromAction` implies server execution; hard error client-side without server** — the constraint travels with the extractor, not with a strategy flag |
| D6 — extractor shape | **Generic `extractorFromAction` (runs any data-returning action)** — OpenAPI specifics stay in the endpoint's actions only |
| D7 — example app packaging | **New self-contained `miroir-test-app_deployment-spotify`** — applications must be self-contained |
| D8 — playlist ID input | **URL param `playlistId` → `pageParams` → `getFromParameters`** — zero new UI |
| D9 — testing | **Fake Spotify server + recorded fixtures, dummy secrets; opt-in live test behind env var** — no real token in repo/CI |
| D10 — pagination | **First page (≤100 tracks) + `tracks.total` displayed** — `next`-following deferred |
| D11 — response validation | **Lenient: strip unknown keys, error on known-field type mismatch, log drift** — strict-fail is brittle against API evolution |

**Rationale:** the dominant driver is *homogeneity with the existing action/query machinery* (D1, D5, D6): an external read is `getInstances`-like — it returns data rather than performing side effects — so it should ride the same dispatch, composition, and monitoring paths rather than grow a parallel one. Second driver: *self-containment* (D2, D4, D7): deployments carry everything they need; secrets are the only out-of-band input, and only by name.

### D1 — where external services live in the meta-model

**Status:** Accepted — extend `Endpoint` with a discriminated union.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| D1-a. New `ExternalService` entity | Separate meta-model entity, referenced by extractors | Clean conceptual separation | Splits the execution path; loses composition/monitoring homogeneity; a second "endpoint-like" concept to explain forever |
| D1-b. Optional sibling block on `definition` | `definition: { actions?, externalService? }` | Additive, no migration | Allows incoherent both-set state; no exhaustiveness checking |
| **D1-c. Discriminated union** ★ | `definition` = `actions` XOR `externalService` | Mutually exclusive by construction; endpoint stays "one named entry point" | Prerequisite refactor: migrate all existing Endpoint instances + readers |

**Decision:** D1-c. **Revisit trigger (recorded):** per-user tokens (each user brings their own Spotify token, OAuth PKCE in the UI). Endpoint instances replicate to every client's local cache as model data — fine while they carry only a secret *name*, wrong home for per-user credentials, which need a server-side per-session trust boundary. If per-user tokens enter scope, split `ExternalService` out (D1-a).

### D2 — OpenAPI lifecycle

**Status:** Accepted — design-time selective sync via pure Transformer.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| D2-a. Runtime interpretation | Store raw doc, parse + resolve `$ref` on each query | No import step | Ships YAML parser + `$ref` resolver to the runtime; non-deterministic; inherits every OpenAPI edge case forever; breaks offline |
| D2-b. Build-time script | Asset file + codegen script in the package | Deterministic | Outside Miroir: no monitoring, no UI/MCP trigger, not self-contained |
| D2-c. Direct-mutation server action | Library action parses doc and upserts model in one shot | Single step | Not reviewable; server-only; bespoke mutation path |
| **D2-d. Pure Transformer → composite action** ★ | `(openApiDocument, currentModel, scope) → compositeActionSequence` JSON; reviewed, then executed (or not) via existing machinery | Pure, testable, runs client- or server-side; review-before-apply; reuses standard model-mutation path | Two-step (generate, then execute) |

**Decision:** D2-d. Scope = explicit selection of operations (e.g. playlist-related only); only **GET** operations generate actions (read-only by construction, see D6). The raw OpenAPI doc is stored as a string attribute on the endpoint instance (self-contained deployment, D7). Re-running the transformer after a doc change = synchronization.

### D3 — display schema for service data

**Status:** Accepted — one external Entity per operation response, nested components inlined.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| D3-a. Schemaless report sections | New report machinery rendering untyped JSON | No duplication | Big detour; loses typed display sections, editors, validation |
| D3-b. Entity per OpenAPI component | `SpotifyPlaylist`, `SpotifyTrack`, `SpotifyArtist`… normalized | Cross-operation reuse; combiner joins | Multiplies entities; forces FK-style modeling of what is one JSON document |
| **D3-c. Single root entity, inlined nesting** ★ | `SpotifyPlaylist.mlSchema` converted from `PlaylistObject`, nested components inlined | Report/query/editor stack unchanged; matches "display one document" | Schema duplicated between entity and endpoint's OpenAPI doc |

**Decision:** D3-c. The duplication (entity `mlSchema` vs. operation response schema inside `openApiDocument`) is accepted for now and may be lifted later (non-goal). D3-b deferred.

### D4 — credential handling

**Status:** Accepted — named launch-time secrets.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| D4-a. Config JSON | Token in `miroirConfig.server.json` | Reuses existing config loading | Secrets on disk next to the repo; precedent (postgres passwords in config) is a bad one |
| **D4-b. `--secret` CLI + env fallback** ★ | Repeatable `--secret <name>=<value>`; `MIROIR_SECRET_<NAME>` env; server holds values in memory only | Matches "passed on the command line"; never serialized into model or REST responses | CLI args visible in process list (accepted for an example app) |

**Decision:** D4-b. Endpoint's `externalService.credentialKey` holds the *name* only. `redactCredentialSecretsFromValue` (already applied on REST responses, `RestServer.ts`) must learn the secret values. Token expiry/refresh out of scope (Spotify user tokens expire after 1h — restart with a fresh token).

### D5 — execution location

**Status:** Accepted — extractor implies server execution.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| D5-a. Reuse `queryExecutionStrategy: "storage"` | Caller forces server routing | No new mechanism | Caller must know the flag is mandatory; accidental client-side run fails confusingly |
| **D5-b. Constraint carried by the extractor** ★ | Query containing `extractorFromAction` auto-routes to server; hard error if no server | Cannot be misused; token physically cannot reach the client | Slightly more dispatch logic |

**Decision:** D5-b.

### D6 — extractor shape

**Status:** Accepted — generic `extractorFromAction`.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| D6-a. `externalServiceExtractor` | Extractor references endpoint + `operationId` + bindings | Less JSON per operation | OpenAPI knowledge in two places (extractor + endpoint); not reusable for non-OpenAPI actions |
| **D6-b. `extractorFromAction`** ★ | Extractor runs any data-returning action server-side, unwraps `ActionSuccess` payload | Single execution path for queries, composite actions, MCP tools (composition + monitoring); read-only by construction — only GET-backed actions exist to reference | One action definition per exposed operation |

**Decision:** D6-b.

### D7 — example app packaging

**Status:** Accepted — new `miroir-test-app_deployment-spotify` package, self-contained (endpoint + entity + query + report). Hosting the Spotify endpoint in the admin app was considered and rejected by the user: applications must be self-contained.

### D8 — playlist ID input

**Status:** Accepted — URL param `playlistId` via existing `pageParams` → `getFromParameters` template resolution. A dedicated input form page is deferred (later, unscheduled).

### D9 — testing

**Status:** Accepted — fake Spotify HTTP server serving recorded `get-playlist` fixtures; integration tests use dummy secrets; optional live test gated behind an env var with a real token. No real token in repo or CI. (Repo policy favors integration tests over mocks; faking the *service boundary* is the sanctioned exception.)

### D10 — pagination

**Status:** Accepted — `get-playlist` returns the first page of tracks inline (≤100 items, `tracks.total`, `tracks.next`); MVP displays the first page plus the total. Following `next` is deferred (later, unscheduled).

### D11 — response validation

**Status:** Accepted — lenient: server validates the HTTP response against the converted Jzod schema, strips unknown keys, errors on known-field type mismatch, logs drift. Strict-fail rejected: Spotify routinely adds fields; data is read-only and display projects known attributes anyway.

---

## 1. Goals

1. **Define an external service** — In order to integrate data from external HTTP services without writing TypeScript, as an *application designer*, I can define an external service endpoint from its OpenAPI document.
2. **Keep credentials out of the repo** — In order to call private APIs without leaking secrets, as an *application maintainer*, I can reference a server-held named token from the endpoint definition, passing the value only at server launch.
3. **Sync schema selectively** — In order to expose only the operations I need, as an *application designer*, I can synchronize the app model with a chosen subset of the OpenAPI operations, reviewing the generated changes before applying them.
4. **Display service data in reports** — In order to see external data with the standard UI, as a *report viewer*, I can view a Spotify playlist by giving its ID in the report URL.
5. **Compose service calls** — In order to reuse external calls in larger flows, as an *application designer*, I can invoke external-service actions anywhere actions are used (composite actions, MCP tools).

## 2. Non-goals

- Token expiry / refresh flow (later, unscheduled — Spotify user tokens expire after 1h; restart with a fresh token).
- Per-user tokens / OAuth Authorization-Code-PKCE in the UI (later, unscheduled — **triggers the D1 split revisit**).
- Pagination following (`next`); rate-limit (429 / `Retry-After`) backoff; non-GET operations (later, unscheduled).
- One entity per OpenAPI schema component — D3-b (later, unscheduled).
- Lifting the entity-schema / OpenAPI-doc duplication — D3-c note (later, unscheduled).
- Dedicated admin UI for external services — the generic `JzodElementEditor` suffices (later, unscheduled).
- Implementation slicing — owned by `tdd-implementation-plan.md` (per `miroir-analysis-to-tdd-plan`).

## 3. Current state

### 3.1 Endpoint entity and action dispatch (aligned for extension)

- Entity `Endpoint`, uuid `3d8da4d4-8f76-4bb4-9212-14869d81c00c`, `conceptLevel: "Model"`; EntityVersion `e3c1cc69-066d-4f52-beeb-b659dc7a88b9`.
- Instance shape (verified against the EntityVersion `mlSchema`): `name`, `version`, `application` (uuid), `description?`, `transactionalEndpoint?`, `definition: { actions: Action[] }`. Action = `actionParameters` (incl. `actionType` literal, `endpoint`) + `actionImplementation` (union `libraryImplementation` | `compositeActionTemplate`).
- Dispatch gap (the extension point): `DomainController.handleApplicationAction` rejects anything but `compositeActionTemplate` — `libraryImplementation` on endpoint actions is **not dispatched** today:

```3042:3055:packages/miroir-core/src/3_controllers/DomainController.ts
    if (
      currentActionDefinition.actionImplementation.actionImplementationType !=
      "compositeActionTemplate"
    ) {
      return Promise.resolve(
        new Action2Error(
          "InvalidAction",
          "DomainController handleApplicationAction actionImplementationType not supported yet: " +
            currentActionDefinition.actionImplementation.actionImplementationType,
```

### 3.2 Query execution and routing (aligned)

- `DomainController.handleBoxedExtractorOrQueryAction` (`DomainController.ts:805`): `queryExecutionStrategy ?? "localCacheOrFail"`; server side (`persistenceStoreAccessMode == "local"`) routes to the persistence store handler (`DomainController.ts:859-869`).
- REST surface (`RestServer.ts:627-658`): `POST /action/:actionType`, `POST /query`, `POST /queryTemplate`, CRUD under `/CRUD/:deploymentUuid/:section/entity…`.
- Extractor taxonomy (generated in `miroirFundamentalJzodSchema.ts`): `extractorByPrimaryKey`, `extractorInstancesByEntity`, combiners (`combinerOneToOne` / `OneToMany` / `ManyToMany` / `ByHeteronomousManyToMany`), wrappers, `extractorOrCombinerContextReference`, `literal` — all store-backed; none can leave the process.

### 3.3 Server startup and secrets (misaligned — no named secrets)

- Manual CLI loop, `server.ts:154-191`: `--config`, `--certsdir`, `--cert`, `--key`, `--disable-auth`/`--enable-auth`; **unknown options are rejected** (`server.ts:188-190`) — `--secret` must be added there.
- Env-var precedent for secrets: `MIROIR_AUTH_TOKEN_SECRET` (`AuthenticationPolicy.ts`).
- Redaction precedent: `redactCredentialSecretsFromValue` applied to REST responses (`RestServer.ts:55,425,442,510,575,618`).
- Bad precedent (not to follow): postgres passwords embedded in deployment config JSON.

### 3.4 External-data precedent (aligned conceptually, store-backed)

- `conceptLevel: "External"` entities exist, backed by external DB catalogs: `tables` `35961086-f932-477a-aa77-ac8360ffbf61`, `columns` `39e5c7a1-3f82-4bda-b8c4-2d576f9f10ae`, `schemata` `cbc94d62-d2e5-4bc2-8aef-45efcfbd0af6` (postgres test deployment, `externalDataSource: { schema: "information_schema" }`). This issue extends the notion from "external DB table" to "external HTTP service".
- `storageAccess: "none" | "localStorage" | "persistentStorage"` exists on entities for persistence routing.

### 3.5 Report parameter flow (aligned)

- URL params parsed by `PageDispatcher.tsx` (`?page=report&application=…&reportUuid=…&…`); `ReportHooks.ts` passes `pageParams` into query template resolution (`ReportHooks.ts:56-119`); templates consume them via `getFromParameters` (`handleTransformer_getFromParameters`, `TransformersForRuntime.ts:3331`). A custom key such as `playlistId` needs no new mechanism.

### 3.6 Transformer runtime (aligned)

- Library-implemented transformers register in `TransformersForRuntime.ts`: `defaultTransformers` (line 159), `applicationTransformerDefinitions` (line 781), handlers (`transformer_*` / `handle*`). The sync transformer (D2) follows this pattern.

### 3.7 Endpoint instance inventory (refactor blast radius for D1)

Enumerated programmatically (all JSON under any `3d8da4d4-…/` folder):

| Where | Count | Detail |
|---|---|---|
| `miroir-test-app_deployment-miroir/assets/miroir_data` | 11 | ApplicationEndpoint `ddd9c928`, DomainEndpoint `1e2ef8e6`, InstanceEndpoint `ed520de4`, LocalCacheEndpoint `9e404b3c`, MenuEndpoint `c6b849a3`, ModelEndpoint `7947ae40`, PersistenceEndpoint `a93598b3`, QueryEndpoint `0faae143`, StoreManagementEndpoint `bbd08cbb`, TestEndpoint `a9139e2d`, UndoRedoEndpoint `71c04f8e` |
| `miroir-test-app_deployment-library/assets/library_model` | 2 | Lending `212f2784-5b68-43b2-8ee0-89b1c6fdd0de`, Books `9884c1a4-5122-488a-85db-a99fbc02e678` |
| Test fixtures (`packages/*/tests/tmp/**`) | 19 | clones of the above (miroir-mcp, miroir-server, miroir-standalone-app) |

`defaultMiroirMetaModel.endpoints` (`Model.ts:285-298`) registers 12 entries over these assets (with aliasing: `deploymentEndpointV1` and `storeManagementEndpoint` both resolve to `bbd08cbb`; MenuEndpoint `c6b849a3` is exported but not in the list). The D1 union refactor must migrate: the 13 assets, the fixture clones, the `Endpoint` EntityVersion `mlSchema`, the generated types, and every `.definition.actions` reader (`DomainController`, `miroir-mcp` tool generation, admin reports/`EndpointActionCaller`).

## 4. Key reuse

| Piece | Location |
|-------|----------|
| Endpoint entity / EntityVersion | uuid `3d8da4d4-8f76-4bb4-9212-14869d81c00c` / `e3c1cc69-066d-4f52-beeb-b659dc7a88b9` |
| Query entity (instances = queries) | uuid `e4320b9e-ab45-4abe-85d8-359604b3c62f` |
| Report entity | uuid `3f2baa83-3ef7-45ce-82ea-6a43f7a8c916` |
| `conceptLevel: "External"` precedent | entities `35961086…`, `39e5c7a1…`, `cbc94d62…` (postgres deployment) |
| Action dispatch extension point | `DomainController.handleApplicationAction` (`DomainController.ts:2943`) |
| Server query route | `POST /query` (`RestServer.ts:658`) |
| Secret redaction | `redactCredentialSecretsFromValue` (`RestServer.ts`) |
| CLI parsing to extend | `server.ts:154-191` |
| Template parameter resolution | `handleTransformer_getFromParameters` (`TransformersForRuntime.ts:3331`) |
| Transformer registration | `defaultTransformers`, `applicationTransformerDefinitions` (`TransformersForRuntime.ts:159,781`) |
| Package template for the example app | `miroir-test-app_deployment-library` (`src/Library.ts` assembles entities/reports/endpoints from JSON assets) |
| Composite action machinery (sync output) | `compositeActionSequence` (`DomainController.handleCompositeAction`) |

## 5. Target design (summary)

**Sync flow (design time, D2/D3):** endpoint instance holds `externalService { openApiDocument, baseUrl, securityScheme, credentialKey, enabledOperations }` → sync transformer `(openApiDocument, currentModel, scope) → compositeActionSequence` (upsert endpoint actions with `externalServiceCall` implementations + upsert `SpotifyPlaylist` external entity) → review JSON → execute via existing composite action machinery → model updated.

**Runtime flow (D4/D5/D6):** report URL carries `playlistId` → query template resolves bindings via `getFromParameters` → `extractorFromAction { endpointUuid, actionType: "getPlaylist" }` forces server routing → server `DomainController` dispatches the action's `externalServiceCall` implementation (new dispatch branch in `handleApplicationAction`) → `ExternalServiceClient` (new, `miroir-core/src/4_services/`) builds the request from the stored OpenAPI operation (`GET /playlists/{playlist_id}`), injects `Authorization: Bearer <secret[credentialKey]>` → lenient validation (D11) → `ActionSuccess` payload unwrapped as extractor result → report renders first page + `tracks.total` (D10).

---

## Next step

Implementation slicing proceeds per [`./tdd-implementation-plan.md`](./tdd-implementation-plan.md) (to be written after this analysis is confirmed, following the `miroir-analysis-to-tdd-plan` skill). The provisional slices in issue #267 are a vague proposal only — not vertical — and are superseded by that plan.
