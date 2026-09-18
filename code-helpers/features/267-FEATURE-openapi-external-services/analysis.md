# 267 — OpenAPI external services + Spotify playlist example app

> Analysis: how to let Miroir applications consume external HTTP services described by an
> OpenAPI (YAML/JSON) document — demonstrated by a self-contained example app displaying a
> Spotify playlist from a user-supplied playlist ID, with the access token held server-side
> as a named launch-time secret.

Related issue: https://github.com/miroir-framework/miroir/issues/267
Key sources: [`packages/miroir-core/src/3_controllers/DomainController.ts`](../../../packages/miroir-core/src/3_controllers/DomainController.ts), [`packages/miroir-core/src/4_services/RestServer.ts`](../../../packages/miroir-core/src/4_services/RestServer.ts), [`packages/miroir-server/src/server.ts`](../../../packages/miroir-server/src/server.ts), [`packages/miroir-test-app_deployment-miroir/src/Model.ts`](../../../packages/miroir-test-app_deployment-miroir/src/Model.ts), [`packages/miroir-core/src/2_domain/TransformersForRuntime.ts`](../../../packages/miroir-core/src/2_domain/TransformersForRuntime.ts)
External references: [Spotify Web API OpenAPI schema](https://developer.spotify.com/reference/web-api/open-api-schema.yaml), [Spotify "Building with AI" guide](https://developer.spotify.com/documentation/web-api/tutorials/building-with-ai)

**Document role:** analysis **and** architectural decision record.
**Status:** implemented (2026-09-09). Decisions confirmed with user (design grilling); revised after adversarial review — see [`./adversarial-review.md`](./adversarial-review.md), R1–R20 all dispositioned and applied. Vertical TDD slices completed per [`./tdd-implementation-plan.md`](./tdd-implementation-plan.md).

---

## Decision record

| Decision | Choice |
|---|---|
| D1 — where external services live in the meta-model | **Extend `Endpoint`; `definition` becomes an untagged key-union (`actions`-object XOR `externalService`-object); operations live inside the `externalService` branch** — homogeneity with action dispatch, no instance migration |
| D2 — OpenAPI lifecycle | **Design-time selective sync: pure Transformer → reviewable `compositeActionSequence`; method/path/params materialized into each operation at sync time** — no OpenAPI parsing at runtime |
| D3 — display schema for service data | **One external Entity per operation response, bounded inlined schema, `idAttribute: "id"`** — report stack reused; duplication accepted for now |
| D4 — credential handling | **Named secrets: `--secret <name>=<value>` CLI + `MIROIR_SECRET_<NAME>` env fallback, memory-only, key+value redaction, logging hygiene** — model carries the name only |
| D5 — execution location | **Server-process-only execution; report call sites detect `extractorForExternalService` and route via `POST /query`; sync Redux path hard-errors** — the constraint is implemented at call sites + server intercept, not wished into the type |
| D6 — extractor shape | **`extractorForExternalService { endpointUuid, actionType, parameterBindings }` restricted to external-service GET operations** — composition/monitoring homogeneity without a mutation side-channel |
| D7 — example app packaging | **New self-contained `miroir-test-app_deployment-spotify`** — applications must be self-contained |
| D8 — playlist ID input | **URL param `playlistId` → `pageParams` → `getFromParameters`; `PageDispatcher` must forward custom search params** — not free: the param keys are a closed union today |
| D9 — testing | **Plain fake Spotify HTTP server + recorded fixtures, dummy secrets; opt-in live test behind env var** — no real token in repo/CI; MSW not applicable |
| D10 — pagination | **First page (≤100 tracks) + `tracks.total` displayed** — `next`-following deferred |
| D11 — response validation | **Lenient: strip unknown keys, error on known-field type mismatch, log drift** — strict-fail is brittle against API evolution |
| D12 — HTTP error semantics | **Map status → `Action2Error` with stable `errorType` before any schema validation; never validate an error body** — a 401 must not surface as a Jzod failure |
| D13 — SSRF / credential-exfiltration guards | **HTTPS-only allowlist, no client-supplied URLs, `operationId ∈ enabledOperations`, fail closed on unknown `credentialKey`** — model write on an external-service endpoint is a privileged operation |

**Rationale:** the dominant driver is *homogeneity with the existing action/query machinery* (D1, D5, D6): an external read is `getInstances`-like — it returns data rather than performing side effects — so it rides the same dispatch, composition, and monitoring paths rather than growing a parallel one. Second driver: *self-containment* (D2, D4, D7): deployments carry everything they need; secrets are the only out-of-band input, and only by name.

### D1 — where external services live in the meta-model

**Status:** Accepted — extend `Endpoint`; untagged key-union; operations inside the `externalService` branch.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| D1-a. New `ExternalService` entity | Separate meta-model entity, referenced by extractors | Clean conceptual separation | Splits the execution path; loses composition/monitoring homogeneity; a second "endpoint-like" concept to explain forever |
| D1-b. Optional sibling block on `definition` | `definition: { actions?, externalService? }` | Additive | Allows incoherent both-set state; no exhaustiveness — rejected by user, who wants strict separation |
| **D1-c. Key-union, operations in the service branch** ★ | `definition` = `{ actions, actionDefinition?, actionTransformer?, actionMigrations? }` XOR `{ externalService: { …, operations[] } }` | Mutually exclusive; existing instance JSON valid unchanged (presence-of-key discriminates); dispatch addresses operations by `actionType == operationId` | Every `.definition.actions` reader needs a narrowing guard; XOR invariant depends on strict object semantics in both branches |

**Decision:** D1-c. The union is **untagged**: existing instances (`{ definition: { actions: […] } }`, no discriminator field) validate against the actions branch as-is — **no data migration** of the 13 endpoint assets. Both-keys objects must fail both branches: Jzod unions map to `z.union` (Jzod does not emit `z.discriminatedUnion`; jzod 0.8.2: "Zod schema generation for discriminated unions not yet implemented"), and Zod objects strip unknown keys by default — so branch strictness (strict objects or an explicit refinement) is required and must be verified at implementation time. The generated operations of an external service live in `externalService.operations[]` — **not** in `definition.actions`, which the XOR forbids on such endpoints (this repair resolves the contradiction found in review: sync cannot upsert actions onto an `externalService` endpoint). `handleApplicationAction` branches on the union: actions branch → `compositeActionTemplate` (today); externalService branch → look up `operations[]` by `actionType == operationId` → execute (D4/D13 guards).

**Revisit trigger (recorded):** per-user tokens (each user brings their own Spotify token, OAuth PKCE in the UI). Endpoint instances replicate to every client's local cache as model data — fine while they carry only a secret *name*, wrong home for per-user credentials, which need a server-side per-session trust boundary. If per-user tokens enter scope, split `ExternalService` out (D1-a).

### D2 — OpenAPI lifecycle

**Status:** Accepted — design-time selective sync via pure Transformer; request shape materialized at sync time.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| D2-a. Runtime interpretation | Store raw doc, parse + resolve `$ref` on each query | No import step | Ships YAML parser + `$ref` resolver to the runtime; non-deterministic; breaks offline. **Also the naive version of `externalServiceCall { operationId }` collapses into this** — resolving `operationId` → method/path at fetch time *is* runtime parsing |
| D2-b. Build-time script | Asset file + codegen script | Deterministic | Outside Miroir: no monitoring, no UI/MCP trigger, not self-contained |
| D2-c. Direct-mutation server action | Library action parses doc and upserts model in one shot | Single step | Not reviewable; server-only; bespoke mutation path |
| **D2-d. Pure Transformer → composite action, materialized operations** ★ | `(openApiDocument, currentModel, scope) → compositeActionSequence`; each enabled GET operation becomes `{ operationId, method, path, parameterMappings, responseSchema, security }` inside `externalService.operations[]` | Pure, testable, runs client- or server-side; review-before-apply; runtime never parses OpenAPI (the doc is inert provenance) | Two-step (generate, then execute); converted output can be large (bounded per D3) |

**Decision:** D2-d. Scope = explicit selection of operations (e.g. playlist-related only); only **GET** operations produce operations (read-only by construction, D6). The raw doc stays on the endpoint instance as a string attribute (self-containment, D7) but is **provenance only** — `ExternalServiceClient` reads only the materialized `operations[]` fields, never the doc. The transformer must be invoked with the **application's own model environment** (`localCache.currentModelEnvironment(spotifyApplication, map)`): the REST query/action path currently passes `defaultMiroirModelEnvironment` (`RestServer.ts:508`, with standing `TODO: get the right model for the app / deployment` at `RestServer.ts:424,569`), which would diff/upsert against the wrong model. Output = `compositeActionSequence` (upsert endpoint, upsert external entities) — `compositeActionSequence` can carry `createEntity` / `updateInstance` (`DomainController.handleCompositeAction`). Conversion rules for the MVP subset: OAS 3.0 `nullable: true` → Jzod `nullable`; `allOf` → flatten/intersection; `oneOf`/`anyOf` → rejected for MVP; `$ref` cycles bounded by the D3 subset. There is no existing OpenAPI converter in the repo — this is new code, and its output for the real Spotify doc must be prototyped during implementation to sanity-check size.

### D3 — display schema for service data

**Status:** Accepted — one external Entity per operation response, bounded inlined schema, non-UUID primary key.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| D3-a. Schemaless report sections | New report machinery rendering untyped JSON | No duplication | Big detour; loses typed display sections, editors, validation |
| D3-b. Entity per OpenAPI component | `SpotifyPlaylist`, `SpotifyTrack`, `SpotifyArtist`… normalized | Cross-operation reuse; combiner joins | Multiplies entities; forces FK-style modeling of what is one JSON document |
| **D3-c. Single root entity, bounded inline** ★ | `SpotifyPlaylist.mlSchema` converted from a **bounded subset** of `PlaylistObject` (e.g. `name`, `owner`, `images`, `tracks.total`, `tracks.items[].track.{id,name,artists,duration_ms}`), nested components inlined | Report/query/editor stack reused; conversion output stays reviewable | Schema duplicated between entity and endpoint doc; subset must be explicit |

**Decision:** D3-c, with three refinements from review:

1. **Identity:** Spotify `id` is base-62, not a UUID. The entity uses the existing non-UUID PK support: `idAttribute: "id"` (`EntityPrimaryKey.ts`). Extractor payloads are wrapped/projected accordingly.
2. **Entity classification:** today's `conceptLevel: "External"` means "external **SQL** schema" — postgres builds a Sequelize model and skips `CREATE TABLE` for it (`SqlDbStoreSection.ts`); `storageAccess` is never read by runtime code. Neither flag means "HTTP, not persisted". The entity therefore carries `externalDataSource: { kind: "http", endpoint: <endpointUuid> }` (extending the existing `externalDataSource`, default/legacy `kind: "sql"`), and every store's storage bootstrap skips `kind: "http"` entities. Without this, putting the entity in a postgres deployment fails at boot or first read.
3. **Report binding:** the report is an `objectInstance` section on the root playlist object, plus a list section fed by a `runtimeTransformer` projecting `tracks.items` — nested arrays are not instance collections and combiners will not see them otherwise.

The duplication (entity `mlSchema` vs. operation `responseSchema` inside the endpoint) is accepted for now and may be lifted later (non-goal). D3-b deferred.

### D4 — credential handling

**Status:** Accepted — named launch-time secrets, with logging/redaction hygiene.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| D4-a. Config JSON | Token in `miroirConfig.server.json` | Reuses existing config loading | Secrets on disk next to the repo; precedent (postgres passwords in config) is a bad one |
| **D4-b. `--secret` CLI + env fallback** ★ | Repeatable `--secret <name>=<value>`; `MIROIR_SECRET_<NAME>` env; server holds values in a module-level map | Matches "passed on the command line"; never serialized into model or REST responses | CLI args visible in process list (accepted for an example app) |

**Decision:** D4-b, with hygiene requirements found in review:

- `--secret` must be added to the manual CLI loop (`server.ts:154-191`), which rejects unknown options.
- `server.ts:206` currently logs `JSON.stringify(process.env)` at startup — this would dump every `MIROIR_SECRET_*`; it must be removed/guarded **as part of this issue**.
- The existing `redactCredentialSecretsFromValue` (`RestServer.ts:55,425,442,510,575,618`) only deletes `passwordHash` on user-credential instances — it is **not** value-based and would not hide a token. Redaction must become key-based (`authorization`, `token`, `credential`, `secret`) **and** value-based (the named-secret values), applied also to MCP handlers (`mcpHandlersForEndpoint.ts` logs params and results with no redaction today) and to server logs — not only to REST responses.
- Fail closed: unknown or empty `credentialKey` → `Action2Error` before any `fetch`.
- Token expiry/refresh out of scope (Spotify user tokens expire after 1h — restart with a fresh token).

### D5 — execution location

**Status:** Accepted — server-process-only, implemented at call sites + server intercept.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| D5-a. Reuse `queryExecutionStrategy: "storage"` | Caller forces server routing | No new mechanism | Caller must know the flag is mandatory; accidental client-side run fails confusingly |
| **D5-b. Constraint enforced at call sites + server intercept** ★ | Report query path detects `extractorForExternalService` and routes via `POST /query`; server `DomainController` intercepts before the persistence-store handoff; sync Redux path hard-errors | Cannot be misused; token physically cannot reach the client | Requires touching the report query path and every extractor switch (inventory below) |

**Decision:** D5-b, corrected by review — "extractor implies server" is **not** a property of the type alone:

- Reports run queries **synchronously on Redux** (`useQueryTemplateResults`, `ReportHooks.ts:123-195` → `QuerySelectors.runQuery`); they never enter `DomainController`, and the report cache-fill derives load targets only from store-backed extractor types. The report query path (`ReportViewWithEditor` / `useQueryTemplateResults`) must detect `extractorTemplateForExternalService` and issue a server-routed boxed query (`POST /query`) instead of the sync selector, rendering from the returned context.
- On the server, boxed queries go to `handlePersistenceActionForLocalPersistenceStore` (`DomainController.ts:857-865`) → persistence-store extractor runners, whose switches do not know the new extractor. The intercept must happen in `DomainController` **before** that handoff (the store cannot inject `MIROIR_SECRET_*`).
- The sync `QuerySelectors.runQuery` default branch must return a clear hard error for `extractorForExternalService` (client-side without server), as must `runAsSql` (SQL generation for it is unsupported).
- `handleApplicationAction` is typed `Promise<Action2VoidReturnType>` and its REST transport does not route application actions (`restActionHandler`'s switch throws on unknown action types; `currentModelEnvironment` is `undefined` for non-model actions). The external-service branch therefore: executes only in the server process (`persistenceStoreAccessMode === "local"`), reached in-process from the query intercept or from server-side composite actions; the return type generalizes to `Action2ReturnType` so the extractor has a payload to unwrap. A generic remote transport for application actions over `POST /action` is **out of scope**.

### D6 — extractor shape

**Status:** Accepted — `extractorForExternalService`, restricted to external-service GET operations.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| D6-a. `externalServiceExtractor` | Extractor references endpoint + `operationId` + bindings | Less JSON per operation | OpenAPI knowledge in two places; not reusable |
| D6-b. Generic `extractorForExternalService`, any action | Runs any data-returning action server-side | Maximally general | **Mutation side-channel**: a query that can run `lendDocument` is a GET that mutates; "only GET-backed actions exist" is sync policy, not an extractor invariant |
| **D6-c. Restricted `extractorForExternalService`** ★ | Runs the action only if the target endpoint is an `externalService` endpoint and `actionType` names an enabled GET operation | Composition/monitoring homogeneity (same dispatch path as composite actions); read-only enforced at the extractor, not by convention | Slightly less general than D6-b |

**Decision:** D6-c. Both forms are required: `extractorTemplateForExternalService` (bindings as templates, resolved by `Templates.ts` so `getFromParameters` works) and the resolved `extractorForExternalService`. Every closed extractor switch must learn the new type: `QuerySelectors.ts`, `AsyncQuerySelectors.ts`, `ExtractorRunnerInMemory.ts`, `FileSystemExtractorRunner.ts`, `SqlGenerator.ts` (hard error), `Templates.ts`, plus the bootstrap unions in `getMiroirFundamentalJzodSchema.ts`.

### D7 — example app packaging

**Status:** Accepted — new `miroir-test-app_deployment-spotify` package, self-contained (endpoint + entity + query + report). Hosting the Spotify endpoint in the admin app was considered and rejected by the user: applications must be self-contained. Registration inventory (beyond copying the Library package layout): npm workspace, `build-all.sh`, admin `Deployment` instance, `defaultSelfApplicationDeploymentMap` / config JSON, menu, standalone-app imports — missing any of these and the app does not boot.

### D8 — playlist ID input

**Status:** Accepted — URL param `playlistId`, **with a mechanism change**: `PageDispatcher` builds `reportPageParams` from a closed union (`application`, `deploymentUuid`, `applicationSection`, `reportUuid`, `instanceUuid` — `PageDispatcher.tsx:99-109`, `ReportUrlParamKeys` in `packages/miroir-standalone-app/src/constants.ts:7-13`); custom keys are stripped today. `PageDispatcher` must forward unknown search params into `pageParams` (or the key union must be extended) before `getFromParameters` can see `playlistId`. A dedicated input form page is deferred (later, unscheduled).

### D9 — testing

**Status:** Accepted — plain local HTTP server serving recorded `get-playlist` fixtures; integration tests drive the **server-side** `DomainController` against it with dummy secrets. MSW is not applicable (it emulates Miroir's own REST, not outbound `fetch`; active tests do not use MSW). Optional live test gated behind an env var with a real token (and must not log env, per D4). No real token in repo or CI. Tests must cover the D12 error paths (401, missing secret), not only 200 fixtures. Dummy secrets still appear in `ps` via `--secret` (accepted, D4).

### D10 — pagination

**Status:** Accepted — `get-playlist` returns the first page of tracks inline (≤100 items, `tracks.total`, `tracks.next`); MVP displays the first page plus the total. Following `next` is deferred (later, unscheduled).

### D11 — response validation

**Status:** Accepted — lenient: server validates the HTTP response against the converted Jzod schema, strips unknown keys, errors on known-field type mismatch, logs drift. Strict-fail rejected: Spotify routinely adds fields; data is read-only and display projects known attributes anyway. Validation only ever runs on success bodies (see D12).

### D12 — HTTP error semantics

**Status:** Accepted (added in revision). `fetch` does not throw on 4xx/5xx. Before any D11 validation: map HTTP status to `Action2Error` with stable `errorType` (`ExternalServiceUnauthorized` / `ExternalServiceNotFound` / `ExternalServiceRateLimited` / `ExternalServiceUpstreamFailure`), carrying the upstream error message. An error body (`{ error: { status, message } }`) is never validated against `PlaylistObject` — otherwise a 401 (token expired after 1h) surfaces as a confusing Jzod mismatch instead of "restart with a fresh token". Network/TLS failure, empty body, and JSON parse error map to the same family.

### D13 — SSRF / credential-exfiltration guards

**Status:** Accepted (added in revision). `baseUrl`, `credentialKey`, and `enabledOperations` are ordinary endpoint instance fields that replicate to every client cache; any principal who can `updateInstance` the endpoint could otherwise point `baseUrl` at `http://169.254.169.254/` or an attacker listener and have the server attach the named secret (confused deputy). Guards, all server-side, all failing closed:

- HTTPS only; private / link-local / loopback hosts denied unless an explicit server flag opts in (needed for the D9 fake server).
- Requests are built only from the materialized `operations[]` fields (D2) — never from client-supplied URLs or raw doc content; `operationId` must be in `enabledOperations`.
- `credentialKey` must resolve to a non-empty secret before `fetch` (D4).
- Model writes on external-service endpoints are documented as privileged operations.

---

## 1. Goals

1. **Define an external service** — In order to integrate data from external HTTP services without writing TypeScript, as an *application designer*, I can define an external service endpoint from its OpenAPI document.
2. **Keep credentials out of the repo** — In order to call private APIs without leaking secrets, as an *application maintainer*, I can reference a server-held named token from the endpoint definition, passing the value only at server launch.
3. **Sync schema selectively** — In order to expose only the operations I need, as an *application designer*, I can synchronize the app model with a chosen subset of the OpenAPI operations, reviewing the generated changes before applying them.
4. **Display service data in reports** — In order to see external data with the standard UI, as a *report viewer*, I can view a Spotify playlist by giving its ID in the report URL.
5. **Compose service calls** — In order to reuse external calls in larger flows, as an *application designer*, I can invoke external-service operations from composite action sequences like any other action. (MCP tool exposure of external operations is a follow-up — see Non-goals.)

## 2. Non-goals

- Token expiry / refresh flow (later, unscheduled — Spotify user tokens expire after 1h; restart with a fresh token).
- Per-user tokens / OAuth Authorization-Code-PKCE in the UI (later, unscheduled — **triggers the D1 split revisit**).
- MCP tool exposure of external-service operations — needs `listTools` to read the `externalService` branch and secret plumbing in the `miroir-mcp` process (later, unscheduled).
- Generic remote transport for application actions over `POST /action` (later, unscheduled — external calls execute in the server process only).
- Pagination following (`next`); rate-limit (429 / `Retry-After`) backoff beyond D12 error surfacing; non-GET operations (later, unscheduled).
- One entity per OpenAPI schema component — D3-b (later, unscheduled).
- Lifting the entity-schema / OpenAPI-doc duplication — D3 note (later, unscheduled).
- Dedicated admin UI for external services — the generic `JzodElementEditor` suffices (later, unscheduled).
- Implementation slicing — owned by `tdd-implementation-plan.md` (per `miroir-analysis-to-tdd-plan`).

## 3. Current state

### 3.1 Endpoint entity and action dispatch (aligned for extension)

- Entity `Endpoint`, uuid `3d8da4d4-8f76-4bb4-9212-14869d81c00c`, `conceptLevel: "Model"`; EntityVersion `e3c1cc69-066d-4f52-beeb-b659dc7a88b9`. After #217 the **Entity** present-model `mlSchema` is authoritative — both it and the EntityVersion must change.
- Instance shape (verified against both schemas): `name`, `version`, `application` (uuid), `description?`, `transactionalEndpoint?`, `definition: { actions: Action[], actionDefinition?, actionTransformer?, actionMigrations? }`. Action = `actionParameters` + `actionImplementation`; the implementation union already uses `"discriminator": "actionImplementationType"` with branches `libraryImplementation` | `compositeActionTemplate`.
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

- `handleApplicationAction` is typed `Promise<Action2VoidReturnType>` (`DomainController.ts:2948`) and runs in-process; its REST transport does not route application actions (`restActionHandler` switch throws on unknown action types, and passes `currentModelEnvironment = undefined` for non-model actions). See D5 for the consequences.

### 3.2 Query execution and routing (misaligned — reports never leave Redux)

- `DomainController.handleBoxedExtractorOrQueryAction` (`DomainController.ts:805`): `queryExecutionStrategy ?? "localCacheOrFail"`; server side (`persistenceStoreAccessMode == "local"`) routes to the persistence store handler (`DomainController.ts:857-865`).
- REST surface (`RestServer.ts:623-660`): `POST /action/:actionType` (`:645-649`), `POST /query` (`:656-660`), `POST /queryTemplate`, CRUD under `/CRUD/:deploymentUuid/:section/entity…`.
- **Reports do not use any of this**: `useQueryTemplateResults` (`ReportHooks.ts:123-195`) runs the synchronous Redux selector `runQuery` (`QuerySelectors.ts:1078`); the report cache-fill (`createReportQueryLoadExecutor.ts`, `reportQueryLoadSegment.ts`) derives load targets only from store-backed extractor types. A new extractor type is invisible to both — hence D5's call-site work.
- Extractor taxonomy (generated in `miroirFundamentalJzodSchema.ts`): `extractorByPrimaryKey`, `extractorInstancesByEntity`, combiners (`combinerOneToOne` / `OneToMany` / `ManyToMany` / `ByHeteronomousManyToMany`), wrappers, `extractorOrCombinerContextReference`, `literal` — all store-backed; none can leave the process. Closed switches on the extractor type exist in `QuerySelectors.ts`, `AsyncQuerySelectors.ts`, `ExtractorRunnerInMemory.ts`, `FileSystemExtractorRunner.ts`, `SqlGenerator.ts`, and `Templates.ts` (template form).

### 3.3 Server startup and secrets (misaligned — no named secrets; env is logged)

- Manual CLI loop, `server.ts:154-191`: `--config`, `--certsdir`, `--cert`, `--key`, `--disable-auth`/`--enable-auth`; **unknown options are rejected** (`server.ts:188-190`) — `--secret` must be added there.
- `server.ts:206` logs `JSON.stringify(process.env)` at startup — must be removed/guarded before any `MIROIR_SECRET_*` fallback is safe (D4).
- Env-var precedent for secrets: `MIROIR_AUTH_TOKEN_SECRET` (`AuthenticationPolicy.ts`).
- Redaction precedent: `redactCredentialSecretsFromValue` applied to REST responses (`RestServer.ts:55,425,442,510,575,618`) — but it only deletes `passwordHash` on user-credential instances; it is not value-based and does not cover MCP or logs (D4).
- Bad precedent (not to follow): postgres passwords embedded in deployment config JSON.

### 3.4 External-data precedent (misaligned — "External" means external SQL, not HTTP)

- `conceptLevel: "External"` entities exist, backed by external DB catalogs: `tables` `35961086-f932-477a-aa77-ac8360ffbf61`, `columns` `39e5c7a1-3f82-4bda-b8c4-2d576f9f10ae`, `schemata` `cbc94d62-d2e5-4bc2-8aef-45efcfbd0af6` (postgres test deployment, `externalDataSource: { schema: "information_schema" }`). Postgres treats `conceptLevel === "External" || externalDataSource` as a Sequelize model on an external schema and skips `CREATE TABLE` (`SqlDbStoreSection.ts`) — reads are still SELECTs against existing tables.
- `storageAccess` is copied into generated schemas but **never read by runtime code**.
- Consequence: neither flag models "HTTP, not persisted". D3 introduces `externalDataSource.kind: "http"` and store-bootstrap skips for it.

### 3.5 Report parameter flow (misaligned — closed param union)

- URL params parsed by `PageDispatcher.tsx` into `reportPageParams` from a **closed key union** (`application`, `deploymentUuid`, `applicationSection`, `reportUuid`, `instanceUuid` — `PageDispatcher.tsx:99-109`; `ReportUrlParamKeys`, `packages/miroir-standalone-app/src/constants.ts:7-13`). A custom key such as `playlistId` is stripped before templates run — D8 requires forwarding unknown search params.
- Downstream machinery is aligned: `ReportHooks.ts` passes `pageParams` into query template resolution; `handleTransformer_getFromParameters` (`TransformersForRuntime.ts:3331`) reads them at resolve time.

### 3.6 Transformer runtime (aligned)

- Library-implemented transformers register in `TransformersForRuntime.ts`: `defaultTransformers` (line 159), `applicationTransformerDefinitions` (line 781), handlers (`transformer_*` / `handle*`). Handlers receive a `modelEnvironment` — adequate for the sync transformer **provided the caller passes the application's own model environment** (the REST query path currently passes `defaultMiroirModelEnvironment`, `RestServer.ts:508`; see D2).

### 3.7 Endpoint instance inventory (D1 blast radius)

Enumerated programmatically (all JSON under any `3d8da4d4-…/` folder):

| Where | Count | Detail |
|---|---|---|
| `miroir-test-app_deployment-miroir/assets/miroir_data` | 11 | ApplicationEndpoint `ddd9c928`, DomainEndpoint `1e2ef8e6`, InstanceEndpoint `ed520de4`, LocalCacheEndpoint `9e404b3c`, MenuEndpoint `c6b849a3`, ModelEndpoint `7947ae40`, PersistenceEndpoint `a93598b3`, QueryEndpoint `0faae143`, StoreManagementEndpoint `bbd08cbb`, TestEndpoint `a9139e2d`, UndoRedoEndpoint `71c04f8e` |
| `miroir-test-app_deployment-library/assets/library_model` | 2 | Lending `212f2784-5b68-43b2-8ee0-89b1c6fdd0de`, Books `9884c1a4-5122-488a-85db-a99fbc02e678` |
| `packages/*/tests/tmp/**` clones | not versioned | gitignored, regenerated by test runs — no migration; tests asserting exact endpoint JSON shape may fail after D1 and must be named by the plan |

`defaultMiroirMetaModel.endpoints` (`Model.ts:285-298`) registers **12 entries over 10 unique uuids**: `deploymentEndpointV1` and `storeManagementEndpoint` both import `bbd08cbb-….json`; `instanceEndpointV1` and `instanceEndpointVersionV1` both import `ed520de4-….json`; MenuEndpoint `c6b849a3` is exported but not registered. With the D1 untagged union, the 13 source assets validate unchanged (actions branch) — the refactor touches: the `Endpoint` Entity `mlSchema` + EntityVersion, generated types, and every `.definition.actions` reader, which must narrow on the union: `DomainController`, `miroir-mcp` `EndpointToolRegistry` (its well-formedness test is `endpoint?.definition?.actions`), CLI `commandsFromEndpoint.ts`, `EndpointActionCaller`, `RunnerView` / `resolveMcpToolAction`, and the bootstrap schema accessors in `getMiroirFundamentalJzodSchema.ts` that read `.definition.actions` off hardcoded endpoint JSON to generate `DomainAction` types.

## 4. Key reuse

| Piece | Location |
|-------|----------|
| Endpoint entity / EntityVersion | uuid `3d8da4d4-8f76-4bb4-9212-14869d81c00c` / `e3c1cc69-066d-4f52-beeb-b659dc7a88b9` |
| Query entity (instances = queries) | uuid `e4320b9e-ab45-4abe-85d8-359604b3c62f` |
| Report entity | uuid `3f2baa83-3ef7-45ce-82ea-6a43f7a8c916` |
| `conceptLevel: "External"` / `externalDataSource` precedent | entities `35961086…`, `39e5c7a1…`, `cbc94d62…` (postgres deployment); `SqlDbStoreSection.ts` |
| Non-UUID primary keys | `idAttribute`, `EntityPrimaryKey.ts` |
| Action dispatch extension point | `DomainController.handleApplicationAction` (`DomainController.ts:2943`) |
| Server query route | `POST /query` (`RestServer.ts:656-660`) |
| Secret redaction (to be generalized) | `redactCredentialSecretsFromValue` (`RestServer.ts`) |
| CLI parsing to extend | `server.ts:154-191` |
| Template parameter resolution | `handleTransformer_getFromParameters` (`TransformersForRuntime.ts:3331`) |
| Transformer registration | `defaultTransformers`, `applicationTransformerDefinitions` (`TransformersForRuntime.ts:159,781`) |
| Package template for the example app | `miroir-test-app_deployment-library` (`src/Library.ts` assembles entities/reports/endpoints from JSON assets) |
| Composite action machinery (sync output) | `compositeActionSequence` (`DomainController.handleCompositeAction`) |

## 5. Target design (summary)

**Sync flow (design time, D2/D3):** endpoint instance holds `externalService { openApiDocument (provenance), baseUrl, securityScheme, credentialKey, enabledOperations, operations[] }` → sync transformer `(openApiDocument, appModelEnvironment, scope) → compositeActionSequence` (upsert endpoint with materialized `operations[]` — method/path/params/responseSchema baked; upsert `SpotifyPlaylist` external entity, bounded subset, `idAttribute: "id"`, `externalDataSource.kind: "http"`) → review JSON → execute via existing composite action machinery → model updated. Runtime never parses OpenAPI.

**Runtime flow (D4/D5/D6/D12/D13):** report URL carries `playlistId` (D8 forwarding) → query template resolves bindings via `getFromParameters` → report query path detects `extractorTemplateForExternalService` and issues a server-routed boxed query (`POST /query`) → server `DomainController` intercepts before the persistence-store handoff → external-service branch of `handleApplicationAction` (server process only) looks up `operations[actionType]` → D13 guards (HTTPS allowlist, enabled operation, credential resolves) → `ExternalServiceClient` (new, `miroir-core/src/4_services/`) builds the request from the materialized operation (`GET /playlists/{playlist_id}`), injects `Authorization: Bearer <secret[credentialKey]>` → D12 status mapping → D11 lenient validation → `ActionSuccess` payload unwrapped as extractor result → report renders the playlist object section + a tracks list section (projected by a runtime transformer), first page + `tracks.total` (D10).

---

## Next step

Implementation slicing proceeds per [`./tdd-implementation-plan.md`](./tdd-implementation-plan.md) (to be written after this analysis is confirmed, following the `miroir-analysis-to-tdd-plan` skill). The provisional slices in issue #267 are a vague proposal only — not vertical — and are superseded by that plan.
