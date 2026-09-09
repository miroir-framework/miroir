# Issue #267 — TDD Implementation Plan

> Vertical TDD slices (RED → GREEN each), integration-first per `docs/contributing/testing.md`:
> tests exercise the real DomainController / local cache / emulated server (in-process server path,
> `persistenceStoreAccessMode === "local"`) against a **real local HTTP server** faking Spotify —
> no mocks (the fake server is the sanctioned service-boundary fake, per analysis D9).
> Applicative interfaces under test: the `Endpoint` union schema, the `extractorFromAction` /
> `extractorTemplateFromAction` query schema, the sync TransformerDefinition, and the Spotify
> deployment assets. Tracer bullet (Slice 3): a boxed query containing `extractorFromAction`,
> executed on the server path, returns playlist data from the fake Spotify server with the
> named secret injected as `Authorization: Bearer`.
>
> **Execution model:** human-in-the-loop. No slice contains a commit step — commits happen
> only when the user explicitly asks. Each slice ends with its Validation commands; on
> success its Realization summary is appended and its Status flips to ✅ DONE.

Analysis: [`./analysis.md`](./analysis.md) · Adversarial review: [`./adversarial-review.md`](./adversarial-review.md) · Issue: https://github.com/miroir-framework/miroir/issues/267
Working branch: `267-FEATURE-openapi-external-services`

**Resume note:** plan written, **pending user confirmation of slice order & granularity** (per skill workflow) — no slice started.

---

## Scope

- Endpoint `definition` key-union refactor (D1) and all `.definition.actions` readers.
- Named server secrets (D4) + redaction/logging hygiene (incl. `server.ts` `process.env` dump).
- `extractorFromAction` / `extractorTemplateFromAction`, server-only execution, report-path routing (D5, D6, D8).
- `ExternalServiceClient` with error semantics (D12) and SSRF/credential guards (D13); lenient validation (D11).
- Sync transformer + bounded OpenAPI→Jzod converter (D2, D3).
- New `miroir-test-app_deployment-spotify` example package (D7), first-page display (D10).

This plan does **not** cover: token refresh; per-user tokens; MCP tool exposure of external operations; generic `POST /action` transport for application actions; pagination following; non-GET operations; rate-limit backoff; entity-per-component normalization; dedicated admin UI (analysis Non-goals — later, unscheduled).

---

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Characterize endpoint/dispatch/report contracts | ⬜ | `externalService.267.phase0.unit.test.ts` + modelValidation |
| 1 | Endpoint `definition` key-union refactor (D1) | ⬜ | schema validation test + nonreg safety net |
| 2 | Named secrets + redaction/logging hygiene (D4) | ⬜ | `serverSecrets.267.phase2.unit.test.ts` |
| 3 | **Tracer**: `extractorFromAction` end-to-end vs fake Spotify (D5 server, D6, D11) | ⬜ | `externalServiceQuery.267.phase3.integ.test.ts` |
| 4 | Error semantics + SSRF/guard rails (D12, D13, restrictions) | ⬜ | `externalServiceGuards.267.phase4.integ.test.ts` |
| 5 | Report path: template extractor + param forwarding + client routing (D5 client, D8) | ⬜ | `externalServiceReport.267.phase5.integ.test.ts` |
| 6 | Sync transformer + bounded OpenAPI→Jzod converter (D2, D3) | ⬜ | MiroirTest suites `externalServiceSync` (unit) + `externalServiceSyncExecute` (integ) |
| 7 | Spotify example app package (D7, D3, D10) | ⬜ | modelValidation + `spotifyApp.267.phase7.integ.test.ts` |
| 8 | Nonreg, docs, cleanup, AC | ⬜ | nonreg step + tracer narrative |

---

## Locked implementation defaults

From the analysis decision record (binding; deviations go into the slice's Realization):

| Decision | Choice |
|---|---|
| D1 | `Endpoint.definition` = untagged key-union: `{ actions, actionDefinition?, actionTransformer?, actionMigrations? }` XOR `{ externalService }`; operations live in `externalService.operations[]`, addressed by `actionType == operationId`; no instance migration; strict branches so both-keys fails |
| D2 | Sync = pure transformer `(openApiDocument, appModelEnvironment, scope) → compositeActionSequence`; method/path/params/responseSchema materialized into `operations[]` at sync time; `openApiDocument` is inert provenance at runtime; only GET operations produce operations |
| D3 | One external entity per operation response, bounded inlined subset; `idAttribute: "id"`; `externalDataSource: { kind: "http", endpoint }`; stores skip bootstrap for `kind: "http"` |
| D4 | `--secret <name>=<value>` repeatable + `MIROIR_SECRET_<NAME>` fallback; module-level secret map, never serialized; key+value redaction incl. MCP + logs; remove `server.ts` `process.env` log; fail closed on unknown/empty `credentialKey` |
| D5 | Server-process-only execution; report call sites detect the extractor and route via `POST /query`; server `DomainController` intercepts before the persistence-store handoff; sync Redux path and `runAsSql` hard-error |
| D6 | `extractorFromAction { endpointUuid, actionType, parameterBindings }` restricted to external-service GET operations; template + resolved forms; all closed extractor switches updated |
| D7 | New self-contained `miroir-test-app_deployment-spotify`; registration inventory: workspace, `build-all.sh`, admin `Deployment` instance, deployment map/config, menu, standalone-app imports |
| D8 | `PageDispatcher` forwards unknown search params into `pageParams`; `playlistId` consumed via `getFromParameters` |
| D9 | Plain local fake HTTP server + recorded fixtures; dummy secrets; opt-in live test behind env var; MSW not used |
| D10 | First page (≤100 tracks) + `tracks.total` displayed; no `next` following |
| D11 | Lenient validation: strip unknown keys, error on known-field type mismatch, log drift; success bodies only |
| D12 | HTTP status → `Action2Error` `errorType` family (`ExternalServiceUnauthorized` / `NotFound` / `RateLimited` / `UpstreamFailure`) before validation; error bodies never validated |
| D13 | HTTPS-only; deny private/link-local/loopback unless explicit server opt-in (fake server needs it); requests built only from materialized `operations[]`; `operationId ∈ enabledOperations` |

---

## Allocated UUIDs / keys

| Artefact | Value |
|---|---|
| Spotify `Deployment` instance | `fd47d115-67e2-4870-8339-1c26665d1d15` |
| Spotify `SelfApplication` | `00514586-bf72-4de3-beea-0a627c821404` |
| Spotify `ApplicationModelBranch` | `cddedb5a-2789-45b2-be93-d6f52ae3f6eb` |
| `SpotifyPlaylist` Entity | `56166585-b6fd-42c6-95d3-32a80c3304f7` |
| `SpotifyPlaylist` EntityVersion | `1a34fdf2-67c8-411d-9be4-a9265089ac51` |
| `SpotifyService` Endpoint (externalService branch) | `0e5cb172-12ea-4467-8598-5889338ae454` |
| `spotifyGetPlaylist` Query | `371aed0c-05bb-4b77-8cf1-2c82407555c1` |
| `SpotifyPlaylistReport` Report | `10ce3252-7840-4041-a769-9a0e2d5ee10b` |
| Spotify `Menu` | `1b4b181d-4616-4391-a41f-33bbee4fd356` |
| `syncExternalServiceSchema` TransformerDefinition | `c615ff0e-140a-4d16-b3d4-d7e04081d65b` |
| MiroirTest suite `externalServiceSync` (unit) | uuid `f4e5dde0-3dba-493b-a208-04494dbbb2f5` |
| MiroirTest suite `externalServiceQuery` (integ, slice 8 migration target) | uuid `008325cb-2d7e-4dea-97cd-0daa36c143bb` |
| Issue-scoped vitest dir | `tests/**/issues/267-openapi-external-services/` |
| Nonreg step | `externalServices-spotify` |

---

## Test execution conventions

| Purpose | Command |
|---|---|
| MiroirTest `externalServiceSync` (unit) | `npm run testMiroir -w miroir-core -- --suites externalServiceSync --mode unit` |
| MiroirTest (integ) | `npm run testMiroir -w miroir-standalone-app -- --suites externalServiceSyncExecute --mode integration` |
| Issue vitest files | `RUN_TEST=<name> npm run testByFile -w <pkg> -- <name>` |
| Deployment validation | `npm run testByFile -w miroir-test-app_deployment-<app> -- tests/modelValidation.unit.test.ts` |
| Schema rebuild (core schemas touched) | `npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core` |
| Type check (per touched package) | `npx tsc --noEmit --skipLibCheck -p packages/<pkg>/tsconfig.json` |
| Safety net | `npm run nonreg` |

---

## Slice 0 — Characterize endpoint schema, dispatch, and report query path

**Status:** ⬜ pending

### Goal

Lock current contracts so the D1 refactor and the D5 call-site changes have a safety net: the 13 endpoint assets validate against the current schema; `handleApplicationAction` rejects non-`compositeActionTemplate` implementations with its current error; reports run queries through the sync Redux path; `PageDispatcher` strips unknown search params (current, misaligned behavior — locked, then changed in Slice 5).

### 0.1 RED → GREEN — contract characterization

**Test:** `packages/miroir-standalone-app/tests/issues/267-openapi-external-services/externalService.267.phase0.unit.test.ts` (vitest — framework-internal machinery: Jzod validation and dispatch errors are not reachable through MiroirTest).

Behavior asserted:
- All 13 endpoint source assets (11 `miroir_data` + 2 `library_model`, enumerated in analysis §3.7) validate against the current `Endpoint` Jzod schema.
- `handleApplicationAction` on an action with `actionImplementationType: "libraryImplementation"` returns `Action2Error` "not supported yet" (`DomainController.ts:3042-3055`).
- `PageDispatcher`-parsed params for `?page=report&…&playlistId=xyz` do **not** contain `playlistId` (locks the misalignment; flipped by Slice 5's test).
- Inventory file: programmatic list of the 13 endpoint assets + the 12 `defaultMiroirMetaModel.endpoints` registrations over 10 unique uuids (both alias pairs recorded).

### Validation

```bash
RUN_TEST=externalService.267.phase0 npm run testByFile -w miroir-standalone-app -- externalService.267.phase0
npm run testByFile -w miroir-test-app_deployment-miroir -- tests/modelValidation.unit.test.ts
npm run testByFile -w miroir-test-app_deployment-library -- tests/modelValidation.unit.test.ts
```

### Realization

<Appended on completion, together with Status ✅ DONE: what was actually done, deviations, problems met & solved.>

---

## Slice 1 — Endpoint `definition` key-union refactor (D1)

**Status:** ⬜ pending

### Goal

An application designer can store an Endpoint instance whose `definition` is an `externalService` object (schema accepts it, both-keys rejected); every existing endpoint and reader behaves exactly as before.

**Layers cut:** JSON asset (Endpoint entity `mlSchema` + EntityVersion) → generated types (`devBuild`) → readers (narrowing guards) → MCP/CLI/admin UI compile.

### 1.1 RED

**Test:** extend `externalService.267.phase0.unit.test.ts` → `…phase1.unit.test.ts` (vitest — same justification: Jzod schema validation is framework-internal).

Behavior asserted:
- An endpoint instance with `definition: { externalService: { openApiDocument, baseUrl, securityScheme, credentialKey, enabledOperations, operations: [] } }` **validates** against the new schema.
- An instance with both `actions` and `externalService` keys is **rejected** (XOR invariant — requires strict branches; if Jzod objects strip unknown keys, add the explicit refinement and assert it).
- The 13 existing assets still validate (untagged union → no migration).
- `EndpointToolRegistry.listTools` skips an externalService endpoint without throwing (well-formedness guard narrowed); `commandsFromEndpoint`, `EndpointActionCaller`, `resolveMcpToolAction` compile and behave unchanged for actions endpoints.

### 1.2 GREEN

- Edit Endpoint entity `mlSchema` (uuid `3d8da4d4-…`, authoritative) + EntityVersion `e3c1cc69-…`: `definition` becomes the untagged union; `externalService` branch: `openApiDocument: string`, `baseUrl: string`, `securityScheme` (bearer object), `credentialKey?: string`, `enabledOperations: string[]`, `operations[]` = `{ operationId, method, path, parameterMappings, requestSchema?, responseSchema, security? }`.
- Rebuild chain: `npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core`.
- Narrow every `.definition.actions` reader (analysis §3.7): `DomainController`, `miroir-mcp` `EndpointToolRegistry` + `Tools.ts`, CLI `commandsFromEndpoint.ts`, `EndpointActionCaller`, `RunnerView` / `resolveMcpToolAction`, bootstrap accessors in `getMiroirFundamentalJzodSchema.ts`.

### 1.3 Refactor checkpoint

- Extract the union-narrowing guard once (`getEndpointActions(endpoint)` / `getExternalService(endpoint)` in `miroir-core`), use it at every reader — no per-reader ad-hoc casts.
- Analysis misalignment mapped: §3.1 (dispatch gap is Slice 3's extension point; this slice only refactors the shape).

### Validation

```bash
RUN_TEST=externalService.267.phase1 npm run testByFile -w miroir-standalone-app -- externalService.267.phase1
npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core
npm run testByFile -w miroir-test-app_deployment-miroir -- tests/modelValidation.unit.test.ts
npm run testByFile -w miroir-test-app_deployment-library -- tests/modelValidation.unit.test.ts
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-mcp/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-cli/tsconfig.json
npm run nonreg
```

### Realization

<Appended on completion, together with Status ✅ DONE.>

---

## Slice 2 — Named secrets + redaction/logging hygiene (D4)

**Status:** ⬜ pending

### Goal

An application maintainer can launch `miroir-server` with `--secret spotifyUser=<token>` (or `MIROIR_SECRET_SPOTIFYUSER`), have the value held in a module-level server secret store, never logged, never serialized into REST/MCP responses — and `process.env` is no longer dumped at startup.

**Layers cut:** service (`miroir-core/src/4_services/SecretStore.ts`, new) → server startup (`server.ts` CLI loop + env fallback + log removal) → redaction (`RestServer.ts`, MCP handlers).

### 2.1 RED

**Test:** `packages/miroir-server/tests/issues/267-openapi-external-services/serverSecrets.267.phase2.unit.test.ts` (vitest — server startup/config internals are not reachable through MiroirTest).

Behavior asserted:
- `parseServerArgs(["--secret", "spotifyUser=abc"])` yields secret map `{ spotifyUser: "abc" }`; repeatable; malformed entries rejected with usage error; unknown options still rejected.
- `MIROIR_SECRET_SPOTIFYUSER` env fallback works; CLI wins over env.
- `resolveSecret("spotifyUser")` returns the value; `resolveSecret("nope")` / empty value → fail-closed error (no leak of the map contents in the message).
- Redaction: a REST-response-shaped object containing a registered secret value (or keys named `authorization`/`token`/`credential`/`secret`) is redacted by the extended `redactCredentialSecretsFromValue`.
- Startup logging never includes `process.env` (assert the `server.ts:206` dump is gone/guarded).

### 2.2 GREEN

- New `SecretStore` in `miroir-core/src/4_services/` (module-level map; `registerSecrets`, `resolveSecret` fail-closed; no serialization API — deliberately not iterable/JSON-able).
- `server.ts`: extract pure `parseServerArgs` (testable), add `--secret`, env fallback, remove/guard the `process.env` log line.
- Extend `redactCredentialSecretsFromValue`: key-based (`authorization`/`token`/`credential`/`secret`, case-insensitive) + value-based (registered secrets); apply to MCP handlers' logging/result paths (`mcpHandlersForEndpoint.ts`).

### 2.3 Refactor checkpoint

- `parseServerArgs` extraction deepens `server.ts` (startup script shrinks to wiring).
- Analysis misalignment mapped: §3.3 (env dump, key-only redaction) resolved here.

### Validation

```bash
RUN_TEST=serverSecrets.267.phase2 npm run testByFile -w miroir-server -- serverSecrets.267.phase2
npx tsc --noEmit --skipLibCheck -p packages/miroir-server/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
```

### Realization

<Appended on completion, together with Status ✅ DONE.>

---

## Slice 3 — Tracer bullet: `extractorFromAction` end-to-end against fake Spotify (D5 server, D6 resolved form, D11)

**Status:** ⬜ pending

### Goal

A boxed query containing `extractorFromAction { endpointUuid, actionType: "get-playlist", parameterBindings }`, executed through the server path (emulated server = in-process `persistenceStoreAccessMode: "local"`), returns playlist data fetched live from a local fake Spotify server, with `Authorization: Bearer <secret>` injected from the named secret — something no query could do before.

**Layers cut:** bootstrap Jzod schema (new extractor type) → generated types → `DomainController` (intercept + external-service dispatch branch) → `ExternalServiceClient` (new) → test infra (fake HTTP server fixture).

### 3.1 RED

**Test:** `packages/miroir-standalone-app/tests/issues/267-openapi-external-services/externalServiceQuery.267.phase3.integ.test.ts` (vitest integ — requires a live fake HTTP server lifecycle and secret registration, not expressible as declarative MiroirTest JSON).

Fixture: fake HTTP server on `127.0.0.1:<ephemeral>` serving a recorded `get-playlist` response (fixture JSON in the test dir); test external-service endpoint instance (hand-written `operations[]` entry: `operationId: "get-playlist"`, `method: "GET"`, `path: "/playlists/{playlist_id}"`, bounded `responseSchema`) added to the test deployment's model; server opt-in flag allowing the loopback base URL (D13); `registerSecrets({ fakeSpotify: "test-token" })`.

Behavior asserted:
- Query result context contains the playlist object from the fake server (name matches the fixture — independent source of truth).
- The fake server received `Authorization: Bearer test-token` and path `/playlists/<id>` with the bound parameter.
- Unknown fields injected by the fake server are stripped (D11); a wrong-typed known field fails with a validation error (not a crash).

### 3.2 GREEN

- Bootstrap schema: add `extractorFromAction` to the extractor unions in `getMiroirFundamentalJzodSchema.ts` (+ regen via `devBuild -w miroir-core`); resolved form only (template form is Slice 5).
- `DomainController`: when a boxed query contains `extractorFromAction`, intercept **before** `handlePersistenceActionForLocalPersistenceStore`; resolve endpoint → externalService branch → `operations[actionType]`; execute via the same helper the new `handleApplicationAction` external-service branch uses; unwrap `ActionSuccess` payload into the extractor context result.
- `handleApplicationAction`: add the external-service branch (guarded to `persistenceStoreAccessMode === "local"`); generalize the return type to `Action2ReturnType` so a payload exists to unwrap.
- `ExternalServiceClient` (new, `miroir-core/src/4_services/`): build request from the materialized operation only (path templating from `parameterBindings`), inject secret, `fetch`, D11 lenient validation. Happy path + validation only — error mapping is Slice 4.

### 3.3 Refactor checkpoint

- Single `executeExternalServiceOperation` helper shared by the query intercept and `handleApplicationAction` (no duplicated dispatch).
- Analysis misalignment mapped: §3.1 dispatch gap (extension point) implemented here; §3.2 server intercept.

### Validation

```bash
RUN_TEST=externalServiceQuery.267.phase3 npm run testByFile -w miroir-standalone-app -- externalServiceQuery.267.phase3
npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
```

### Realization

<Appended on completion, together with Status ✅ DONE.>

---

## Slice 4 — Error semantics + SSRF/guard rails (D12, D13, D6 restriction, D5 hard errors)

**Status:** ⬜ pending

### Goal

Every failure mode of an external call surfaces as a clear, stable `Action2Error` (never a Jzod mismatch, never a crash), and the mutation/SSRF side-channels are closed — one hardening slice, several RED → GREEN cycles against the same seam (`ExternalServiceClient` + dispatch guards).

**Layers cut:** controller + service only (no schema change).

### 4.1–4.6 RED → GREEN cycles

**Test:** `packages/miroir-standalone-app/tests/issues/267-openapi-external-services/externalServiceGuards.267.phase4.integ.test.ts` (same vehicle justification as Slice 3), extending the Slice 3 fixture.

1. **HTTP error mapping (D12):** fake server 401 → `ExternalServiceUnauthorized` ("restart with a fresh token"-style message); 404 → `ExternalServiceNotFound`; 429 → `ExternalServiceRateLimited`; 500 / network failure / invalid JSON → `ExternalServiceUpstreamFailure`. The error body is never validated against `responseSchema`.
2. **Credential failures (D4/D13):** unknown `credentialKey` and empty secret → fail-closed `Action2Error` **before** any `fetch` (fake server asserts zero requests received).
3. **SSRF guard (D13):** `baseUrl` with `http://`, loopback, link-local, or private host → rejected unless the explicit server opt-in flag is set (Slice 3's fixture uses the opt-in; this cycle proves the default denies).
4. **Operation allowlist (D13):** `actionType` naming an `operationId` outside `enabledOperations` → error.
5. **Mutation side-channel (D6):** `extractorFromAction` targeting a non-external-service action (e.g. Library `lendDocument`) or a non-GET operation → hard error.
6. **Client-side hard errors (D5):** sync `QuerySelectors.runQuery` on a query containing `extractorFromAction` → clear `QueryNotExecutable`-style error naming the extractor; `runAsSql: true` on such a query → hard error (SQL generation unsupported).

### 4.7 Refactor checkpoint

- Error-construction helpers shared across cycles (one `externalServiceError(errorType, message, context)`); no per-cycle ad-hoc error shapes.
- Analysis misalignment mapped: remainder of §3.2 (closed switches' default branches now name the new extractor explicitly).

### Validation

```bash
RUN_TEST=externalServiceGuards.267.phase4 npm run testByFile -w miroir-standalone-app -- externalServiceGuards.267.phase4
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
```

### Realization

<Appended on completion, together with Status ✅ DONE.>

---

## Slice 5 — Report path: `extractorTemplateFromAction` + param forwarding + client routing (D5 client, D8)

**Status:** ⬜ pending

### Goal

A report viewer can open `?page=report&…&reportUuid=…&playlistId=<id>` and see playlist data fetched server-side — the report query path detects the external extractor and routes it to the server instead of the sync Redux selector.

**Layers cut:** bootstrap schema (template form) → `Templates.ts` resolution → `PageDispatcher` (param forwarding) → `ReportHooks`/`ReportViewWithEditor` (detection + remote routing) → view (report renders returned context).

### 5.1 RED

**Test:** `packages/miroir-standalone-app/tests/issues/267-openapi-external-services/externalServiceReport.267.phase5.integ.test.ts` (vitest integ — React report rendering + URL dispatch are not reachable through MiroirTest).

Behavior asserted:
- `?page=report&…&playlistId=abc` → `pageParams.playlistId === "abc"` (flips the Slice 0 characterization).
- A report whose query template uses `extractorTemplateFromAction` with a `getFromParameters`-bound `playlist_id` renders the fake-server playlist (name + first track), fetched via the server route (assert: fake server received exactly one request; Redux sync path not taken).
- A report mixing store-backed extractors and one external extractor in the same query renders both data sources (context merge).

### 5.2 GREEN

- Bootstrap schema: `extractorTemplateFromAction` (bindings as transformer templates) + regen; `Templates.ts` resolves it into `extractorFromAction`.
- `PageDispatcher`: forward unknown search params into `pageParams` (generic forwarding, not a hardcoded `playlistId` key).
- Report query path (`useQueryTemplateResults` / `ReportViewWithEditor`): detect external extractors in the resolved query → issue a server-routed boxed query (`POST /query` via the existing remote persistence client) → feed the returned context into rendering. Store-backed extractors in the same query keep their current path.

### 5.3 Refactor checkpoint

- Detection logic in one domain-level predicate (`queryContainsExternalExtractor`), not inline in the view.
- Analysis misalignment mapped: §3.5 (closed param union) resolved here; §3.2 client-side routing completed.

### Validation

```bash
RUN_TEST=externalServiceReport.267.phase5 npm run testByFile -w miroir-standalone-app -- externalServiceReport.267.phase5
npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
```

### Realization

<Appended on completion, together with Status ✅ DONE.>

---

## Slice 6 — Sync transformer + bounded OpenAPI→Jzod converter (D2, D3 schema generation)

**Status:** ⬜ pending

### Goal

An application designer can run the `syncExternalServiceSchema` transformer on the endpoint's stored Spotify OpenAPI doc with scope `["get-playlist"]`, review the produced `compositeActionSequence` (materialized `operations[]` + `SpotifyPlaylist` entity upsert), execute it through the standard composite-action machinery, and immediately query the synced model — the review-then-execute loop, with no hand-written assets.

**Layers cut:** TransformerDefinition asset + runtime handler (`TransformersForRuntime.ts` pattern) → converter (new, bounded) → composite action execution → model (endpoint + entity upserts).

### 6.1 RED

**Test:** MiroirTest `transformerTest` suite `externalServiceSync` (unit, `miroir-core`) — the transformer is a pure function, the ideal MiroirTest vehicle. Input assets: the **real** Spotify OpenAPI excerpt stored as a test asset (imported, not inlined) + a test app model environment containing the Slice 1-shaped Spotify endpoint (doc only, no operations yet).

Behavior asserted:
- Output is a `compositeActionSequence` containing: an endpoint `updateInstance` whose `operations["get-playlist"]` carries materialized `method: "GET"`, `path: "/playlists/{playlist_id}"`, parameter mappings, and a bounded Jzod `responseSchema`; and a `createEntity` for `SpotifyPlaylist` with `idAttribute: "id"`, `externalDataSource: { kind: "http", endpoint: "0e5cb172-…" }`, and the bounded `mlSchema` (name, owner, images, `tracks.total`, `tracks.items[].track.{id,name,artists,duration_ms}`).
- Conversion rules: OAS `nullable: true` → Jzod `nullable`; `allOf` flattened; `oneOf`/`anyOf` outside the bounded subset rejected with a clear transformer error; non-GET operations in scope are skipped (read-only by construction).
- The transformer runs against the **app's own** model environment (not `defaultMiroirModelEnvironment`).

**Then (integration):** MiroirTest `actionTest` suite `externalServiceSyncExecute` (integration, `miroir-standalone-app`): execute the generated `compositeActionSequence` on a test deployment, then run the Slice 3 query against the **synced** model (fake server up) — the loop closes with no hand-written operation/entity.

### 6.2 GREEN

- TransformerDefinition asset (uuid `c615ff0e-…`) + handler registered per the `TransformersForRuntime.ts` pattern (`applicationTransformerDefinitions`); add the `yaml` dependency to `miroir-core` (sync-time parsing only; runtime never parses — D2).
- Bounded converter (new module used by the handler): `$ref` resolution bounded to the subset; mapping rules per the assertions above.

### 6.3 Refactor checkpoint

- Converter is a deep module behind the transformer handler (small interface: doc + scope + model → composite action); no converter internals exported.
- Generated JSON size sanity-checked against the real Spotify doc (record the size in the Realization — reviewability is a D2 requirement).

### Validation

```bash
npm run testMiroir -w miroir-core -- --suites externalServiceSync --mode unit
npm run testMiroir -w miroir-standalone-app -- --suites externalServiceSyncExecute --mode integration
npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
```

### Realization

<Appended on completion, together with Status ✅ DONE.>

---

## Slice 7 — Spotify example app package (D7, D3 assets, D10 display)

**Status:** ⬜ pending

### Goal

A report viewer can start the standalone app with the Spotify deployment, open the playlist report, paste a playlist ID in the URL, and see the playlist (name, owner, first ≤100 tracks, total) — a self-contained example app, its endpoint/entity assets **generated by dogfooding the Slice 6 sync** on the real Spotify doc (reviewed, then committed).

**Layers cut:** new package (assets + `index.ts`/`Spotify.ts` assembly, mirroring `Library.ts`) → registration inventory → store bootstrap skip for `externalDataSource.kind: "http"` → report assets.

### 7.1 RED

**Test:** `packages/miroir-standalone-app/tests/issues/267-openapi-external-services/spotifyApp.267.phase7.integ.test.ts` (vitest integ — full deployment boot + report rendering; not MiroirTest-reachable) + the new package's `modelValidation`.

Behavior asserted:
- The Spotify deployment boots (filesystem profile) with the `SpotifyPlaylist` entity present in the model and **no storage space created** for it (all store backends skip `kind: "http"`).
- The playlist report renders the fake-server playlist via `playlistId` URL param: name, owner, first page of tracks, and `tracks.total` ("first 100 of N" — D10).
- `modelValidation` passes for `miroir-test-app_deployment-spotify`.

### 7.2 GREEN

- New package `miroir-test-app_deployment-spotify` (layout mirrors `miroir-test-app_deployment-library`): SelfApplication `00514586-…`, branch `cddedb5a-…`, Deployment `fd47d115-…`, Menu `1b4b181d-…`, Endpoint `0e5cb172-…`, Entity `56166585-…` + EntityVersion `1a34fdf2-…`, Query `371aed0c-…` (`extractorTemplateFromAction`, `playlistId` via `getFromParameters`), Report `10ce3252-…` (objectInstance section + tracks list section fed by a runtime transformer projecting `tracks.items`).
- Endpoint `operations[]` + entity `mlSchema` produced by running the Slice 6 sync on the real doc; reviewed; committed (the raw doc embedded as `openApiDocument` provenance).
- Registration inventory (analysis D7): `build-all.sh`, admin `Deployment` instance, deployment map / config JSON, menu wiring, standalone-app imports.
- Store bootstrap skip for `externalDataSource.kind: "http"` (filesystem, indexedDb, postgres, mongodb).

### 7.3 Refactor checkpoint

- Pure-data slice rule: proof = `modelValidation` + rebuild + Slice 0 inventory lock (diff reviewable); the boot/report test is the behavioral proof.
- Analysis misalignment mapped: §3.4 (`kind: "http"` skip) resolved here.

### Validation

```bash
npm run testByFile -w miroir-test-app_deployment-spotify -- tests/modelValidation.unit.test.ts
RUN_TEST=spotifyApp.267.phase7 npm run testByFile -w miroir-standalone-app -- spotifyApp.267.phase7
./build-all.sh   # or the ordered subset incl. the new package
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
```

### Realization

<Appended on completion, together with Status ✅ DONE.>

---

## Slice 8 — Nonreg, docs, cleanup, AC

**Status:** ⬜ pending

### 8.1 Nonreg

- Add `externalServices-spotify` step to `scripts/nonreg-manifest.json` (phase 3/4/5/7 integ tests + `externalServiceSync` suites).

### 8.2 Docs

- `analysis.md` status → implemented; progress table DONE; `docs/reference/testing.md` notes the new suite keys; `docs/reference/data-architecture-deployments.md` gains the external-service endpoint paragraph.

### 8.3 Issue-directory cleanup

- Migrate still-valuable assertions from `tests/**/issues/267-openapi-external-services/` into feature-named suites (candidate: the end-to-end query path → MiroirTest suite `externalServiceQuery`, uuid `008325cb-…`, if the harness gains a fake-server fixture; otherwise keep as a feature-named vitest file); delete the issue directory (per `docs/contributing/testing.md`, #238 rule).

### 8.4 Tracer bullet (narrative)

1. Launch server: `node packages/miroir-server/release/index.js --secret spotifyUser=<token>`.
2. Open the standalone app → Spotify deployment → playlist report URL with `&playlistId=<id>`.
3. Report shows playlist name, owner, first ≤100 tracks, total — fetched server-side from Spotify (fake server in tests).

Automated equivalent: `spotifyApp.267.phase7.integ.test.ts` + `externalServiceQuery.267.phase3.integ.test.ts`.

### AC checklist (#267)

| Criterion | Proven by | Status |
|---|---|---|
| External service definable as Endpoint instance (raw doc + `credentialKey`), editable via generic editor | Slice 1 schema test + Slice 7 assets (`modelValidation`) | ⬜ |
| `--secret spotifyUser=<token>`; token never in repo/model/REST responses | Slice 2 tests; Slice 3 header assertion | ⬜ |
| Sync transformer produces reviewable `compositeActionSequence`; executing it upserts operations + entity | `externalServiceSync` + `externalServiceSyncExecute` suites | ⬜ |
| Report at `?…&playlistId=<id>` displays playlist (name, owner, ≤100 tracks, total), server-fetched | Slice 5 + Slice 7 integ tests | ⬜ |
| External data read-only; non-GET not exposed | Slice 4 cycle 5; Slice 6 non-GET-skip assertion | ⬜ |
| Client-side without server → clear error | Slice 4 cycle 6 | ⬜ |
| Integration tests vs fake server, dummy secrets, no real token | Slices 3–7 test fixtures | ⬜ |

### Validation

```bash
npm run nonreg
```

### Realization

<Appended on completion, together with Status ✅ DONE.>
