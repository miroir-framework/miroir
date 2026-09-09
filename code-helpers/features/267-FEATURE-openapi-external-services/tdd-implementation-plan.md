# Issue #267 — TDD Implementation Plan

> Vertical TDD slices (RED → GREEN each), integration-first per `docs/contributing/testing.md`:
> tests exercise the real DomainController / local cache / emulated server (in-process server path,
> `persistenceStoreAccessMode === "local"`) against a **real local HTTP server** faking Spotify —
> no mocks (the fake server is the sanctioned service-boundary fake, per analysis D9).
> Applicative interfaces under test: the `Endpoint` union schema, the `extractorFromAction` /
> `extractorTemplateFromAction` query schema, the sync TransformerDefinition, and the Spotify
> deployment assets. Tracer bullet (Slice 2): a boxed query containing `extractorFromAction`,
> executed on the server path, returns playlist data from the fake Spotify server with the
> named secret injected as `Authorization: Bearer`.
>
> **Execution model:** human-in-the-loop. No slice contains a commit step — commits happen
> only when the user explicitly asks. Each slice ends with its Validation commands; on
> success its Realization summary is appended and its Status flips to ✅ DONE.

Analysis: [`./analysis.md`](./analysis.md) · Analysis review: [`./adversarial-review.md`](./adversarial-review.md) · Plan review: [`./plan-adversarial-review.md`](./plan-adversarial-review.md) · Issue: https://github.com/miroir-framework/miroir/issues/267
Working branch: `267-FEATURE-openapi-external-services`

**Resume note:** slice order & granularity **confirmed by the user** (2026-09-09) — implementation in progress, slices executed sequentially by subagents. Revised after plan adversarial review (P1–P24 all dispositioned and applied): secrets folded into the tracer slice (tracer-first), hardening vs dispatch-guard slices split, Entity `externalDataSource.kind` schema change moved into the sync slice. **Slice 0 DONE. Slice 1 DONE. Slice 2 DONE. Slice 3 DONE. Slice 4 DONE. Slice 5 DONE.**

---

## Scope

- Endpoint `definition` key-union refactor (D1) and **all** `.definition.actions` readers.
- Named server secrets (D4) + redaction/logging hygiene (incl. `server.ts` `process.env` dump) — folded into the tracer slice.
- `extractorFromAction` / `extractorTemplateFromAction`, server-only execution, report-path routing (D5, D6, D8).
- `ExternalServiceClient` with error semantics (D12) and SSRF/credential guards (D13); lenient validation (D11).
- Sync transformer + bounded OpenAPI→Jzod converter (D2, D3) + Entity `externalDataSource.kind: "http"` schema change and store-bootstrap skip.
- New `miroir-test-app_deployment-spotify` example package (D7), first-page display (D10).

This plan does **not** cover: token refresh; per-user tokens; MCP tool exposure of external operations; generic `POST /action` transport for application actions; pagination following; non-GET operations; rate-limit backoff; entity-per-component normalization; dedicated admin UI; legacy path-segment URL mode changes (analysis Non-goals — later, unscheduled).

---

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Characterize endpoint/dispatch/report contracts | ✅ | `externalService.267.phase0.unit.test.ts` + modelValidation |
| 1 | Endpoint `definition` key-union refactor (D1) | ✅ | `externalServiceSchema.267.phase1.unit.test.ts` + nonreg |
| 2 | **Tracer**: `extractorFromAction` end-to-end vs fake Spotify, incl. named secrets (D4, D5 server, D6, D11) | ✅ | `externalServiceQuery.267.phase2.integ.test.ts` |
| 3 | Hardening: HTTP error semantics + SSRF/credential guards (D12, D13) | ✅ | `externalServiceGuards.267.phase3.integ.test.ts` |
| 4 | Dispatch seam: extractor restriction, closed switches, composite invocation, client hard errors (D5, D6, Goal 5) | ✅ | `externalServiceDispatch.267.phase4.integ.test.ts` |
| 5 | Report path: template extractor + param forwarding + async report-load routing (D5 client, D8) | ✅ | `externalServiceReport.267.phase5.integ.test.tsx` |
| 6 | Sync transformer + bounded converter + Entity `kind: "http"` schema (D2, D3) | ⬜ | MiroirTest `externalServiceSync` (unit) + `externalServiceSyncExecute` (integ) |
| 7 | Spotify example app package (D7, D3, D10) | ⬜ | modelValidation + `spotifyApp.267.phase7.integ.test.ts` |
| 8 | Nonreg, docs, cleanup, AC, opt-in live test | ⬜ | nonreg step + tracer narrative |

---

## Locked implementation defaults

From the analysis decision record (binding; deviations go into the slice's Realization):

| Decision | Choice |
|---|---|
| D1 | `Endpoint.definition` = untagged key-union: `{ actions, actionDefinition?, actionTransformer?, actionMigrations? }` XOR `{ externalService }`; operations live in `externalService.operations[]` (**array**, looked up by `op.operationId === actionType`); no instance migration; strict branches so both-keys fails |
| D2 | Sync = pure transformer `(openApiDocument, appModel, scope) → compositeActionSequence`-shaped JSON; method/path/params/responseSchema materialized into `operations[]` at sync time; `openApiDocument` is inert provenance at runtime; only GET operations produce operations |
| D3 | One external entity per operation response, bounded inlined subset; `idAttribute: "id"`; `externalDataSource: { kind: "http", endpoint }` (absent `kind` = `"sql"`); stores skip bootstrap for `kind: "http"` |
| D4 | `--secret <name>=<value>` repeatable + `MIROIR_SECRET_<NAME>` fallback; module-level secret map, never serialized, never logged (incl. no `process.env` dump, no request logging); key+value redaction on REST **and** MCP **and** controller/query-runner object-dump logs; fail closed on unknown/empty `credentialKey` |
| D5 | Server-process-only execution; the whole boxed query containing an external extractor routes server-side (`POST /query`); server `DomainController` intercepts in the `persistenceStoreAccessMode == "local"` branch before the persistence-store handoff; sync Redux path and `runAsSql` hard-error |
| D6 | `extractorFromAction { endpointUuid, actionType, parameterBindings }` restricted to external-service GET operations; template + resolved forms; **all** closed extractor switches name the new type |
| D7 | New self-contained `miroir-test-app_deployment-spotify`; registration inventory: workspace, `build-all.sh`, admin `Deployment` instance, `defaultSelfApplicationDeploymentMap`/config, menu, standalone-app imports |
| D8 | `PageDispatcher` forwards unknown search params into `pageParams` (via a pure, tested `reportPageParamsFromSearchParams`); `playlistId` consumed via `getFromParameters`; legacy path-segment mode unchanged |
| D9 | Plain local fake HTTP server + recorded fixtures; dummy secrets; opt-in live test behind env var (Slice 8); MSW not used |
| D10 | First page (≤100 tracks) + `tracks.total` displayed; no `next` following |
| D11 | Lenient validation: strip unknown keys, error on known-field type mismatch, log drift; success bodies only |
| D12 | HTTP status → `Action2Error` `errorType` family (`ExternalServiceUnauthorized` / `ExternalServiceNotFound` / `ExternalServiceRateLimited` / `ExternalServiceUpstreamFailure`, added to the `ActionErrorType` union) before validation; error bodies never validated |
| D13 | HTTPS-only; deny private/link-local/loopback unless explicit named server opt-in (the test fixture uses it); requests built only from materialized `operations[]`; `operationId ∈ enabledOperations` |

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
| MiroirTest suite `externalServiceSync` (unit) | uuid `f4e5dde0-3dba-493b-a208-04494dbbb2f5` — register in the folder catalog (`loadApplicationMiroirTestsFromFolders` / `listCliUnitSuiteKeysFromFolders`) |
| MiroirTest suite `externalServiceSyncExecute` (integ) | uuid `394242e7-6443-41b8-b061-9bf2bcf06f17` — same catalog registration |
| MiroirTest suite `externalServiceQuery` (integ, Slice 8 migration target) | uuid `008325cb-2d7e-4dea-97cd-0daa36c143bb` |
| Issue-scoped vitest dir | `tests/**/issues/267-openapi-external-services/` |
| Nonreg step | `externalServices-spotify` |

---

## Test execution conventions

| Purpose | Command |
|---|---|
| MiroirTest `externalServiceSync` (unit) | `npm run testMiroir -w miroir-core -- --suites externalServiceSync --mode unit` |
| MiroirTest `externalServiceSyncExecute` (integ) | `npm run testMiroir -w miroir-standalone-app -- --suites externalServiceSyncExecute --mode integration` |
| Issue vitest files | `RUN_TEST=<name> npm run testByFile -w <pkg> -- <name>` (packages with `testByFile`: miroir-core, miroir-standalone-app — **not** miroir-server, which has no vitest setup) |
| Deployment validation | `npm run testByFile -w miroir-test-app_deployment-<app> -- tests/modelValidation.unit.test.ts` |
| Schema rebuild (core schemas touched) | `npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core` — **always before** the slice's test run |
| Type check (per touched package) | `npx tsc --noEmit --skipLibCheck -p packages/<pkg>/tsconfig.json` |
| Safety net | `npm run nonreg` |

---

## Slice 0 — Characterize endpoint schema, dispatch, and report param contracts

**Status:** ✅ DONE

### Goal

Lock current contracts so later refactors have a safety net. Characterization tests **pass on day one** (that is their purpose — they are not RED→GREEN cycles).

### 0.1 Characterization (passing) tests

**Test:** `packages/miroir-standalone-app/tests/issues/267-openapi-external-services/externalService.267.phase0.unit.test.ts` (vitest — `PageDispatcher` param parsing and endpoint-asset inventory are not MiroirTest-reachable; the dispatch-error part uses the real DomainController).

Behavior locked:
- All 13 endpoint source assets (11 `miroir_data` + 2 `library_model`, analysis §3.7) validate against the current `Endpoint` Jzod schema.
- `handleApplicationAction` on an action with `actionImplementationType: "libraryImplementation"` returns `Action2Error` "not supported yet" (`DomainController.ts:3042-3055`).
- `reportPageParamsFromSearchParams` (extracted pure function, see below) currently drops `playlistId` — locks the misalignment Slice 5 flips. (Assert the function, not a rendered route.)
- Inventory: programmatic list of the 13 endpoint assets; the 12 `defaultMiroirMetaModel.endpoints` registrations over 10 unique uuids (both alias pairs: `bbd08cbb`, `ed520de4`); **grep inventory of test files asserting `definition.actions` / endpoint JSON equality** — named here so Slice 1's first signal is fast, with nonreg as backstop.

### Validation

```bash
RUN_TEST=externalService.267.phase0 npm run testByFile -w miroir-standalone-app -- externalService.267.phase0
npm run testByFile -w miroir-test-app_deployment-miroir -- tests/modelValidation.unit.test.ts
npm run testByFile -w miroir-test-app_deployment-library -- tests/modelValidation.unit.test.ts
```

### Realization

**Done (2026-09-09):**

- Added `packages/miroir-standalone-app/tests/issues/267-openapi-external-services/externalService.267.phase0.unit.test.ts` — 5 passing characterization tests (inventory, Jzod validation of all 13 endpoint assets via `checkModelValidationInstance` + `entityDefinitionEndpoint.mlSchema`, `defaultMiroirMetaModel.endpoints` counts/alias pairs, `handleApplicationAction` → `Action2Error` "not supported yet" for `libraryImplementation`, `reportPageParamsFromSearchParams` drops `playlistId`).
- Extracted `reportPageParamsFromSearchParams(searchParams)` into `PageDispatcher.tsx` (exported); `PageContent` useMemo now delegates to it — behavior unchanged.
- **Deviations:** none — counts match analysis §3.7 (13 assets, 12 registrations, 10 unique uuids, alias pairs `bbd08cbb`/`ed520de4`). No endpoint asset uses `libraryImplementation`; dispatch test uses a minimal synthetic endpoint in `endpointsByUuid` and calls private `handleApplicationAction` on a bare `DomainController` (empty constructor deps).
- **Validation:** all three commands passed without a pre-build (`phase0` 5/5; miroir `modelValidation` 152/152; library `modelValidation` 181/181).
- **Grep inventory** (test files touching `definition.actions` or endpoint JSON shape — re-run before Slice 1):

  | File | Why |
  |---|---|
  | `packages/miroir-core/tests/1_core/modelEndpointActions.unit.test.ts` | reads `endpoint?.definition?.actions` from ModelEndpoint JSON |
  | `packages/miroir-core/tests/1_core/__snapshots__/listSelfApplicationUuidPaths.unit.test.ts.snap` | snapshot path includes `endpoints.*.definition.actions.*` |
  | `packages/miroir-core/tests/1_core/applicationVersionFreeze.actionSchema.unit.test.ts` | references endpoint entity uuid / action schemas |
  | `packages/miroir-core/tests/2_domain/ModelEntityActionTransformer.unit.test.ts` | endpoint uuid in model fixtures |
  | `packages/miroir-core/tests/2_domain/evolutionTrace.persist.unit.test.ts` | endpoint uuid in trace fixtures |
  | `packages/miroir-core/tests/2_domain/evolutionTrace.policy.unit.test.ts` | endpoint uuid in trace fixtures |
  | `packages/miroir-mcp/tests/integration/endpointToolRegistry.integ.test.ts` | inline endpoint JSON + hardcoded endpoint uuids |
  | `packages/miroir-standalone-app/tests/3_controllers/applicationVersionFreeze.integ.test.ts` | endpoint uuid in freeze integ |
  | `packages/miroir-standalone-app/tests/issues/267-openapi-external-services/externalService.267.phase0.unit.test.ts` | this slice |

- **Note for later slices:** MenuEndpoint (`c6b849a3`) exists as a source asset but is **not** registered in `defaultMiroirMetaModel.endpoints` (12 registered, 11 miroir_data uuids minus the duplicate aliases).

---

## Slice 1 — Endpoint `definition` key-union refactor (D1)

**Status:** ✅ DONE

### Goal

Enabling refactor (justified: the untagged union is the minimum schema change without which Slice 2 cannot store its endpoint fixture; the `.definition.actions` reader blast radius is why it stands alone). After it: an Endpoint instance with an `externalService` branch validates; both-keys is rejected; every existing endpoint and reader behaves exactly as before.

**Layers cut:** JSON asset (Endpoint entity `mlSchema` + EntityVersion) → generated types (`devBuild`) → readers (narrowing guards) → MCP/CLI/AI/admin UI compile.

### 1.1 RED

**Test:** `packages/miroir-standalone-app/tests/issues/267-openapi-external-services/externalServiceSchema.267.phase1.unit.test.ts` (vitest — Jzod schema validation is framework-internal machinery).

Behavior asserted:
- An endpoint instance with `definition: { externalService: { openApiDocument, baseUrl, securityScheme, credentialKey, enabledOperations, operations: [] } }` **validates** against the new schema.
- An instance with both `actions` and `externalService` keys is **rejected** (XOR invariant — requires strict branches; if Jzod objects strip unknown keys, add the explicit refinement and assert it).
- The 13 existing assets still validate (untagged union → no migration).
- `EndpointToolRegistry.listTools` skips an externalService endpoint without throwing; all narrowed readers behave unchanged for actions endpoints.

### 1.2 GREEN

- Edit Endpoint entity `mlSchema` (uuid `3d8da4d4-…`, authoritative post-#217) + EntityVersion `e3c1cc69-…`: `definition` becomes the untagged union; `externalService` branch: `openApiDocument: string`, `baseUrl: string`, `securityScheme` (bearer object), `credentialKey?: string`, `enabledOperations: string[]`, `operations: Array<{ operationId, method, path, parameterMappings, requestSchema?, responseSchema, security? }>`.
- Rebuild chain **before testing**: `npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core`.
- Single narrowing guard pair in `miroir-core` (`getEndpointActions(endpoint)` / `getExternalService(endpoint)`), applied at **every** `.definition.actions` reader: `DomainController`, `miroir-mcp` `EndpointToolRegistry.ts` (well-formedness test), `mcpHandlersForEndpoint.ts`, `mcpToolDescriptionFromActionDefinition.ts`, `miroir-core/src/1_core/Instance.ts`, CLI `commandsFromEndpoint.ts`, `miroir-ai` `miroirCopilotKitActions.ts`, `EndpointActionCaller.tsx`, `RunnerView` / `resolveMcpToolAction`, and the bootstrap accessors in `getMiroirFundamentalJzodSchema.ts` that read `.definition.actions` off hardcoded endpoint JSON.

### 1.3 Refactor checkpoint

- The guard pair is the only narrowing idiom — no per-reader ad-hoc casts.
- Slice 0's grep inventory of endpoint-JSON-sensitive tests is re-run; named files updated if the union changes their expectations.

### Validation

```bash
npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core
RUN_TEST=externalServiceSchema.267.phase1 npm run testByFile -w miroir-standalone-app -- externalServiceSchema.267.phase1
npm run testByFile -w miroir-test-app_deployment-miroir -- tests/modelValidation.unit.test.ts
npm run testByFile -w miroir-test-app_deployment-library -- tests/modelValidation.unit.test.ts
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-mcp/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-cli/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-ai/tsconfig.json
npm run nonreg
```

### Realization

**Done (2026-09-09):**

- RED: `packages/miroir-standalone-app/tests/issues/267-openapi-external-services/externalServiceSchema.267.phase1.unit.test.ts` — 4/4: externalService branch validates; both-keys rejected; 13 existing endpoint assets still validate; guards narrow XOR (including fail-closed on both-keys).
- GREEN schema: Endpoint Entity `mlSchema` (`3d8da4d4-…`) and EntityVersion (`e3c1cc69-…`) — `definition` is an untagged `type: "union"` of two objects (actions shape XOR `{ externalService }`). `requestSchema` / `responseSchema` are `schemaReference` → `jzodElement` (`fe9b7d99-…`). Regenerated types via `npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core` (do not hand-edit `miroirFundamentalType.ts`).
- Guard pair: `getEndpointActions` / `getExternalService` in `packages/miroir-core/src/0_interfaces/1_core/endpointDefinition.ts`, exported from `miroir-core`. Both-keys → both return `undefined` (fail-closed).
- **XOR strictness (no extra schema refinement):**
  1. Jzod objects compile to `z.object(...).strict()` unless `nonStrict` (`jzod` `JzodToZod.ts`). Zod `z.union` of two strict objects rejects a both-keys instance.
  2. Runtime `jzodTypeCheck` (`checkModelValidationInstance` / modelValidation) did **not** accept untagged object unions: missing `discriminator` used to skip key-inclusion. `selectUnionBranchFromDiscriminator` now treats a missing/empty discriminator as key-inclusion (every value key must exist on the branch). Both-keys therefore matches **neither** branch (`externalService` is not on the actions object; `actions` is not on the externalService object). The schema itself has **no** `discriminator` field (no instance migration).
- **13 production reader modules** narrowed with the guard pair (only idiom; no per-reader casts of `.definition.actions`):
  1. `DomainController.ts` (`handleApplicationAction` — unknown actionType if no actions branch; no external-service dispatch)
  2. `Instance.ts`
  3. `schemaChangeKind.ts` *(extra vs P9; found via tsc)*
  4. `schemaForDeployment.ts` *(extra vs P9; found via tsc)*
  5. `getMiroirFundamentalJzodSchema.ts` (hardcoded endpoint JSON via `getEndpointActions(...) ?? []`; Entity mlSchema context via local `endpointEntityActionsSchemaContext()` that walks the **schema** union, not an instance)
  6. `EndpointToolRegistry.ts` (well-formedness = `uuid && name && getEndpointActions` → skips externalService)
  7. `mcpHandlersForEndpoint.ts`
  8. `mcpToolDescriptionFromActionDefinition.ts`
  9. `commandsFromEndpoint.ts`
  10. `miroirCopilotKitActions.ts`
  11. `RunnerView.tsx`
  12. `resolveMcpToolAction.ts`
  13. `EndpointActionCaller.tsx` (replaced transformer `referencePath: ["currentEndpoint","definition","actions"]` with `getEndpointActions`)
- Slice 0 grep inventory re-run: remaining `.definition.actions` are comments (`RestServer.ts`, leftover CopilotKit comments), the bootstrap **schema**-walker, the guard module itself, and `listSelfApplicationUuidPaths.unit.test.ts.snap` (`endpoints.*.definition.actions.*` — still correct for actions-branch endpoints). Named tests updated: `modelEndpointActions.unit.test.ts`, `schemaChangeKind.unit.test.ts`, `schemaForDeployment.unit.test.ts`.
- **Validation:** rebuild OK; phase1 4/4; miroir `modelValidation` 152/152; library `modelValidation` 181/181; `tsc --noEmit --skipLibCheck` green for miroir-core, miroir-mcp, miroir-cli, miroir-standalone-app, miroir-ai; `npm run nonreg` **53 passed / 0 failed / 0 skipped** (tier=default, profile=emulatedServer-sql, 1707s, snapshot `test-results/nonreg/20260909T172008Z`).

**Deviations:**
- `EndpointToolRegistry.listTools` is not constructed in the unit test (needs DomainController + local cache). The test asserts the guard pair that `listTools` now uses (`getEndpointActions` undefined → skip, no throw).
- Guards live in layer `0_interfaces/1_core/` (not `1_core/Endpoint.ts`) so bootstrap assembly can import them without an upward layer-1 dependency. Types are structural (`EndpointDefinitionLike`) so `devBuild` can run before new generated types exist.
- Unblocked Slice 1 `tsc` on pre-existing implicit-`any` map callbacks in `jzodElementToJsonSchema.ts` / `jzodElementToTS.ts`, and two unrelated standalone-app assertion/`Entity[]` mismatches in `ReportSectionListDisplay.tsx` / `ReportTools.ts`.
- `jzodTypeCheck` key-inclusion for missing discriminator is a small runtime change required for D1 XOR under `checkModelValidationInstance`; existing MiroirTest `selectUnionBranchFromDiscriminator` always passes an explicit discriminator string.

**For Slice 2:** `getEndpointActions` / `getExternalService` from `miroir-core`. `externalService.operations` is an **array** (lookup later: `operations.find(op => op.operationId === actionType)`). `parameterMappings`: `Array<{ name, in, required? }>`. `securityScheme`: `{ type, scheme, bearerFormat? }`. Untagged union — no `kind` field. `handleApplicationAction` does **not** execute the externalService branch yet (`getEndpointActions` undefined → existing “unknown actionType”). `listTools` skips externalService endpoints (MCP exposure remains a non-goal). Rebuild order before tests that import `entityDefinitionEndpoint`: `npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core`. Export note: `entityDefinitionEndpoint` is the EntityVersion JSON (`e3c1cc69`); `entityEndpointVersion` is the Entity JSON (`3d8da4d4`); both mlSchemas were updated.

---

## Slice 2 — Tracer bullet: `extractorFromAction` end-to-end against fake Spotify, incl. named secrets (D4, D5 server, D6 resolved form, D11)

**Status:** ✅ DONE

### Goal

A boxed query containing `extractorFromAction { endpointUuid, actionType: "get-playlist", parameterBindings }`, executed through the server path (emulated server = in-process `persistenceStoreAccessMode: "local"`), returns playlist data fetched live from a local fake Spotify server, with `Authorization: Bearer <secret>` injected from a named launch-time secret — the first observable behavior, proving the thinnest end-to-end path (schema → intercept → dispatch → HTTP → validation → context result).

**Layers cut:** bootstrap Jzod schema (new extractor type) → generated types → `DomainController` (intercept + external-service execution) → `SecretStore` + `ExternalServiceClient` (new services) → server startup (`--secret`, env fallback, `process.env` log removal) → redaction → test infra (fake HTTP server fixture).

### Test fixture contract (binding for Slices 2–5, 7)

- **Fake server**: `packages/miroir-standalone-app/tests/utils/fakeExternalServiceServer.ts` — `http.createServer` on an ephemeral port (`app.listen(0)` pattern, as in `miroir-mcp` integ tests); started in `beforeAll`, stopped in `afterAll`; serves recorded fixture JSON from the issue test dir; records received requests for assertions.
- **Secrets**: `registerSecrets({ fakeSpotify: "test-token" })` in `beforeAll`; `clearSecrets()` in `afterAll` (module-level map would leak across vitest files). Emulated-server tests never run the `server.ts` CLI loop — in-process registration is the test path; CLI parsing is tested separately (below).
- **Loopback opt-in (D13)**: named, explicit — `ExternalServiceClient` config flag `allowedInsecureBaseUrls` (server option / `SecretStore`-adjacent test API `allowInsecureBaseUrlsForTests([baseUrl])`); the fixture uses it; default denies (proven in Slice 3).
- **Endpoint instance**: the test external-service endpoint (hand-written `operations[]` entry: `operationId: "get-playlist"`, `method: "GET"`, `path: "/playlists/{playlist_id}"`, bounded `responseSchema`) is **committed to the server persistence store** (model section of the test deployment) during setup — the intercept reads it from the store, never from `currentModelEnvironment` (which is `defaultMiroirModelEnvironment` on the REST path, `RestServer.ts:505-509`).

### 2.1 RED

**Test:** `packages/miroir-standalone-app/tests/issues/267-openapi-external-services/externalServiceQuery.267.phase2.integ.test.ts` (vitest integ — a live fake HTTP server lifecycle + in-process secret registration are not expressible as declarative MiroirTest JSON: MiroirTest `beforeAll` is a composite action and `queryTest` cannot run in integration mode).

Behavior asserted:
- Query result context contains the playlist object from the fake server (name equals the fixture literal — independent source of truth).
- The fake server received exactly one request: path `/playlists/<id>` (bound parameter), header `Authorization: Bearer test-token`.
- The query still works when the caller's `currentModel` is `defaultMiroirModelEnvironment` (the production REST case — the endpoint is loaded from the server store).
- Unknown fields injected by the fake server are stripped (D11); a wrong-typed known field fails with a validation error (not a crash).
- Secrets unit cycles (in `miroir-core`, vitest — startup/config internals are not MiroirTest-reachable; `miroir-server` has no vitest setup, so `SecretStore` + `parseServerArgs` live in `miroir-core`): `parseServerArgs(["--secret", "a=b"])` → map; repeatable; malformed rejected; `MIROIR_SECRET_<NAME>` fallback, CLI wins; `resolveSecret` unknown/empty → fail-closed error without leaking map contents; extended `redactCredentialSecretsFromValue` redacts registered secret **values** and `authorization`/`token`/`credential`/`secret` **keys**; startup logging contains no `process.env` dump.

### 2.2 GREEN

- **Secrets (D4):** new `SecretStore` (`miroir-core/src/4_services/SecretStore.ts`): module-level map, `registerSecrets` / `resolveSecret` (fail-closed) / `clearSecrets`; deliberately no serialization/iteration API. Pure `parseServerArgs` extracted to `miroir-core` (testable); `server.ts` shrinks to wiring: `--secret` in the CLI loop (`server.ts:154-191`), env fallback, and **removal/guarding of the `process.env` log (`server.ts:206`)**. Redaction: extend `redactCredentialSecretsFromValue` (key- and value-based); apply to REST responses (existing call sites), MCP handlers (`mcpHandlersForEndpoint.ts` logs params/results unredacted today), and controller/query-runner object-dump logs (`DomainController.ts:2949-2953`, `PersistenceStoreController.ts:193-198`). The token lives only in `SecretStore` and the `Authorization` header; the outgoing request is never logged.
- **Schema (D6 resolved form):** add `extractorFromAction` to the bootstrap unions in `getMiroirFundamentalJzodSchema.ts` — at minimum `extractorReturningObject` and `extractorOrCombiner` (resolved forms only; template twins are Slice 5) — then regen (`devBuild -w miroir-core`). Slice 2 tests use the **resolved** query form only.
- **Intercept (D5 server):** in `executeBoxedExtractorOrQueryAction`'s `persistenceStoreAccessMode == "local"` branch (`DomainController.ts:857-865`), before `handlePersistenceActionForLocalPersistenceStore`: if the query contains `extractorFromAction` → load the endpoint instance from the **local persistence store** (model section, `deploymentUuid` from the boxed query) → `executeExternalServiceOperation(endpointInstance, actionType, bindings)` → unwrap `ActionSuccess` payload into `contextResults`. Store-backed extractors in the same query still delegate to the persistence path; combiners run over the merged context.
- **Dispatch:** `handleApplicationAction` gains the external-service branch (guarded to `persistenceStoreAccessMode === "local"`), taking the endpoint **instance** (not depending on `endpointsByUuid`); its return type generalizes to `Action2ReturnType` so a payload exists to unwrap. `executeExternalServiceOperation` is the single helper shared by the intercept and the branch.
- **HTTP (D11):** `ExternalServiceClient` (new, `miroir-core/src/4_services/`): build the request from the materialized operation only (path templating from `parameterBindings`), inject the secret, `fetch`, lenient validation (strip unknown keys, error on known-field mismatch). Happy path + validation only — status/error mapping is Slice 3.

### 2.3 Refactor checkpoint

- One `executeExternalServiceOperation` helper — no duplicated dispatch between intercept and `handleApplicationAction`.
- `parseServerArgs` extraction deepens `server.ts` (startup shrinks to wiring).
- Analysis misalignments mapped: §3.1 (dispatch extension point), §3.2 (server intercept), §3.3 (env dump, key-only redaction) all resolved here.

### Validation

```bash
npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core
RUN_TEST=externalServiceQuery.267.phase2 npm run testByFile -w miroir-standalone-app -- externalServiceQuery.267.phase2
RUN_TEST=serverSecrets.267.phase2 npm run testByFile -w miroir-core -- serverSecrets.267.phase2
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-server/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
```

### Realization

**Intercept.** `DomainController.executeBoxedExtractorOrQueryAction`, `persistenceStoreAccessMode == "local"` branch, **before** `handlePersistenceActionForLocalPersistenceStore`. Helper `resolveExtractorFromActionInBoxedQuery` finds `extractors[*].extractorOrCombinerType === "extractorFromAction"`, then `loadEndpointInstanceFromLocalPersistenceStore(application, applicationDeploymentMap, endpointUuid)` which calls `persistenceStoreLocalOrRemote.readLocalPersistenceSectionInstances(application, map, "model", entityEndpointVersion.uuid)` (`3d8da4d4-…`) and `find(i => i.uuid === endpointUuid)`. **Never** `currentModelEnvironment.endpointsByUuid` (P1). Each hit runs shared `executeExternalServiceOperation(endpointInstance, actionType, parameterBindings)`. `ActionSuccess.returnedDomainElement` is written to `contextResults[extractorName]`. Remaining store extractors stay on the query and go through persistence so combiners/transformers see the merged context. If the query is only external extractors (this slice’s tracer), the intercept returns `{ status: "ok", returnedDomainElement: contextResults }` without a persistence handoff.

**Dispatch.** `handleApplicationAction` (return type `Action2ReturnType`) tries the same store load + `getExternalService` + `executeExternalServiceOperation` when `persistenceStoreAccessMode === "local"`. `handleAction` stays `Action2VoidReturnType`: `Action2Error` is returned, success is mapped to `ACTION_OK`. Missing `readLocalPersistenceSectionInstances` (Slice 0 stub DC) falls through to the existing `endpointsByUuid` composite path.

**Schema.** Resolved `extractorFromAction { endpointUuid, actionType, parameterBindings: record of string|any }` added on Query Entity + Query EntityVersion and ensured in `getMiroirFundamentalJzodSchema` on **`extractorReturningObject` and `extractorOrCombiner`** (direct union member). **Not** added to `extractorOrCombinerReturningObject` — that union is assumed to have `parentUuid`/`applicationSection` by store selectors; putting the new type there broke `devBuild`. Template form is Slice 5. Closed-switch naming is Slice 4; only compile fix: `AsyncQuerySelectors` default `query` is `JSON.stringify(...)`.

**Secrets / CLI / redaction.** `SecretStore` (`registerSecrets` / `resolveSecret` / `clearSecrets`; no iteration API). `parseServerArgs` extracted to `miroir-core`; `server.ts` wires `--secret`, `MIROIR_SECRET_*`, `registerSecrets`, and the live `process.env` dump is gone. Extended `redactCredentialSecretsFromValue` lives in `4_services/redactCredentialSecrets.ts` (layer-1 `AuthenticationPolicy` cannot import SecretStore). Applied to REST, MCP handler logs, `handleApplicationAction` domainAction dump, PSC query-result dump. Fetch request is never logged.

**HTTP.** `ExternalServiceClient.executeExternalServiceOperation`: path `{param}` from `parameterMappings` + bindings; `Authorization: Bearer <resolveSecret(credentialKey)>`; D11 lenient validate; non-2xx is generic `FailedToGetInstances` (Slice 3 maps `errorType`). Loopback opt-in: module set + `allowInsecureBaseUrlsForTests([baseUrl])`. Fake server: `tests/utils/fakeExternalServiceServer.ts` (`listen(0)` on `127.0.0.1`); CORS OPTIONS answered but **not** recorded (happy-dom preflight).

**Validation.** Rebuild first, then:
- `externalServiceQuery.267.phase2` — 4 passed (needs `--profile emulatedServer-filesystem`; plan command omitted it)
- `serverSecrets.267.phase2` — 8 passed
- tsc core / server / standalone-app — clean
- Slice 0 (5) + Slice 1 (4) — passed

**Deviations.** (1) `extractorFromAction` is a sibling on `extractorOrCombiner`, not a member of `extractorOrCombinerReturningObject`. (2) Integ `testByFile` requires `--profile emulatedServer-filesystem`. (3) Fake-server CORS for happy-dom. (4) Redaction module is `4_services/redactCredentialSecrets.ts`, not `RestServer.ts`. (5) `handleAction` not widened.

---

## Slice 3 — Hardening: HTTP error semantics + SSRF/credential guards (D12, D13)

**Status:** ✅ DONE

### Goal

Every failure mode of an external call surfaces as a clear, stable `Action2Error` (never a Jzod mismatch, never a crash), and the SSRF/credential side-channels are closed — one hardening slice, several RED → GREEN cycles against the same seam (`ExternalServiceClient` + dispatch guards), reusing the Slice 2 fixture.

**Layers cut:** controller + service + `ActionErrorType` union (no Jzod schema change).

### 3.1–3.4 RED → GREEN cycles

**Test:** `packages/miroir-standalone-app/tests/issues/267-openapi-external-services/externalServiceGuards.267.phase3.integ.test.ts` (same vehicle justification as Slice 2).

1. **HTTP error mapping (D12):** fake server 401 → `ExternalServiceUnauthorized` (message points at token expiry/restart); 404 → `ExternalServiceNotFound`; 429 → `ExternalServiceRateLimited`; 500 / network failure / invalid JSON → `ExternalServiceUpstreamFailure`. The error body is never validated against `responseSchema`. GREEN extends the hand-written `ActionErrorType` union (`DomainElement.ts:172-201`) with the four literals.
2. **Credential failures (D4/D13):** unknown `credentialKey` and empty secret → fail-closed `Action2Error` **before** any `fetch` (fake server asserts zero requests received).
3. **SSRF guard (D13):** `baseUrl` with `http://`, loopback, link-local, or private host → rejected unless the named opt-in (`allowedInsecureBaseUrls`) is set — the Slice 2 fixture uses the opt-in; this cycle proves the default denies.
4. **Operation allowlist (D13):** `actionType` naming an `operationId` outside `enabledOperations` → error.

### 3.5 Refactor checkpoint

- One `externalServiceError(errorType, message, context)` constructor — no per-cycle ad-hoc error shapes.

### Validation

```bash
RUN_TEST=externalServiceGuards.267.phase3 npm run testByFile -w miroir-standalone-app -- externalServiceGuards.267.phase3
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
```

### Realization

**Done (2026-09-09):**

- RED: `packages/miroir-standalone-app/tests/issues/267-openapi-external-services/externalServiceGuards.267.phase3.integ.test.ts` — 17 tests. First RED signal: HTTP 401 still mapped to `FailedToGetInstances` (`--bail=1` stopped after cycle 1). Cycles 2–4 were already implemented in Slice 2 (`resolveSecret` fail-closed before `fetch`, `assertBaseUrlAllowed` default-deny, `enabledOperations` / unknown `operationId`); they went green once cycle 1 mapping landed (verified in the same file).
- GREEN D12: hand-written `ActionErrorType` (`packages/miroir-core/src/0_interfaces/2_domain/DomainElement.ts` — not `1_core/`) gained `ExternalServiceUnauthorized` | `ExternalServiceNotFound` | `ExternalServiceRateLimited` | `ExternalServiceUpstreamFailure`. `fetchExternalServiceOperation` maps **before** D11 validation: 401/403 → Unauthorized (message names token expiry / restart); 404 → NotFound; 429 → RateLimited; other non-2xx / network (`ECONNREFUSED` after closing a second fake server) / invalid JSON → UpstreamFailure. A 404 body that would fail `responseSchema` (`name: 123`) still yields `ExternalServiceNotFound`.
- GREEN D13 gaps: none to fill. Tests prove default-deny without opt-in (fixture `http://127.0.0.1:…`, `169.254.x.x`, `10.x` / `192.168.x.x`, `http://example.com`) and fail-closed credentials (unknown key / empty secret → zero `receivedRequests`). Allowlist: `operationId` in `operations[]` but not `enabledOperations`; `operationId` absent from `operations[]`.
- Refactor: one `externalServiceError(errorType, message, context)` constructor used by every client failure path (HTTP, network, JSON, credentials, SSRF, allowlist, missing path param, non-externalService instance). D11 success-body type mismatch stays `FailedToGetInstances`.
- Fake server: `rawBody` / optional `body` so 200-invalid-JSON can be served without `JSON.stringify`.
- **Generated `actionError` schema:** it *does* enumerate `errorType`, but that union is assembled from Endpoint `actionErrors` literals on store/instance actions plus `FailedToResolveTemplate` (`getMiroirFundamentalJzodSchema.ts`). It is **not** the `Action2Error` catalog (already missing `InvalidAction` and the rest of the hand-written union). Adding the four ExternalService* literals there would be a Jzod schema change this slice forbids and would still not make `ActionError` ≡ `ActionErrorType`. **No schema asset edit, no `devBuild`.** Authority for D12 is the hand-written union + `Action2Error`.
- **Validation** (rebuild `miroir-core` after the mapping change; `--profile emulatedServer-filesystem` required, same as Slice 2):
  - `externalServiceGuards.267.phase3` — 17 passed
  - `externalServiceQuery.267.phase2` — 4 passed
  - `tsc --noEmit --skipLibCheck` miroir-core + miroir-standalone-app — clean

**Deviations:**
- HTTP status cases run through the committed Slice 2 endpoint + boxed `extractorFromAction` (proves the intercept preserves `errorType`). Credential / SSRF / allowlist / closed-server network cases call `executeExternalServiceOperation` directly (same helper the intercept uses) so the store is not mutated per case.
- Setup commits the test endpoint once in `beforeAll` (no per-test `resetIntegTestbed`); HTTP fixtures are swapped via `setFixture`.
- 403 is mapped like 401 (`ExternalServiceUnauthorized`) per the task text; the slice bullet only named 401.
- `ActionErrorType` lives in `0_interfaces/2_domain/DomainElement.ts` (user prompt said `1_core`).

**For Slice 4:** D12/D13 guards are on `executeExternalServiceOperation` / `fetchExternalServiceOperation`. Intercept already returns the `Action2Error` unchanged. Slice 4 must **not** re-wrap these into `FailedToGetInstances` / generic `InvalidAction` in closed extractor switches. Extractor restriction (non-external / non-GET), closed-switch naming, composite `get-playlist`, and client-side hard errors are still Slice 4. Loopback still needs `allowInsecureBaseUrlsForTests`. `testByFile` needs `--profile emulatedServer-filesystem`.

---

## Slice 4 — Dispatch seam: extractor restriction, closed switches, composite invocation, client hard errors (D5, D6, Goal 5)

**Status:** ✅ DONE

### Goal

The dispatch seam is correct everywhere: the extractor refuses anything but external-service GET operations (mutation side-channel closed), every closed extractor switch names the new type, a composite action sequence can invoke `get-playlist` like any other action (Goal 5), and client-side execution paths fail with a clear error.

**Layers cut:** controller + domain selectors/runners (no schema change).

### 4.1–4.4 RED → GREEN cycles

**Test:** `packages/miroir-standalone-app/tests/issues/267-openapi-external-services/externalServiceDispatch.267.phase4.integ.test.ts` (cycles 1–3 need the fake server; cycle 4 does not).

1. **Extractor restriction (D6):** `extractorFromAction` targeting a non-external-service action (e.g. Library `lendDocument`) or a non-GET operation → hard error.
2. **Closed switches name the type:** `QuerySelectors.ts`, `AsyncQuerySelectors.ts`, `ExtractorRunnerInMemory.ts`, `FileSystemExtractorRunner.ts`, `SqlGenerator.ts` (`runAsSql` → hard error), `sqlDbInstanceStoreSectionMixin.ts`, `Templates.ts` — each default branch names `extractorFromAction` explicitly (defense in depth if the intercept is skipped).
3. **Composite invocation (Goal 5):** a `compositeActionSequence` step `{ actionType: "get-playlist", endpoint: <spotify endpoint uuid> }` executes server-side and returns the playlist. GREEN requires fixing endpoint→application resolution: `handleAction` enters `handleApplicationAction` only via the static `EndpointApplicationMap` (`Deployment.ts:92-105`), which cannot list new endpoints — resolve the endpoint's application **dynamically from the endpoint instance's `application` field** instead of only the static map.
4. **Client-side hard errors (D5):** sync `QuerySelectors.runQuery` on a query containing `extractorFromAction` → clear error naming the extractor; `runAsSql: true` on such a query → hard error.

### 4.5 Refactor checkpoint

- Dynamic endpoint→application resolution replaces (not duplicates) the static-map lookup; the static map remains as the Miroir-core fast path.

### Validation

```bash
RUN_TEST=externalServiceDispatch.267.phase4 npm run testByFile -w miroir-standalone-app -- externalServiceDispatch.267.phase4
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
```

### Realization

**Done (2026-09-09):**

- RED/GREEN: `packages/miroir-standalone-app/tests/issues/267-openapi-external-services/externalServiceDispatch.267.phase4.integ.test.ts` — 13 tests (cycles 1–4). Fixture adds POST `create-playlist` on the Slice 2/3 test endpoint (`c8f2a1b4-…`).
- **Cycle 1 (D6).** `executeExternalServiceOperation` hard-errors before `fetch` when the target is not an `externalService` endpoint (`extractorFromAction is restricted to external-service GET operations (target is not an externalService endpoint)`) or when `operation.method !== "GET"` (`…restricted to GET operations; ${actionType} has method ${method}`). Library `lendDocument` and POST `create-playlist` both return `Action2Error` with zero fake-server requests. Errors are **not** re-wrapped.
- **Cycle 2 (closed switches).** Default / explicit branches name `extractorFromAction` (defense in depth). Inventory verified and updated: `QuerySelectors.ts`, `AsyncQuerySelectors.ts`, `ExtractorRunnerInMemory.ts`, `FileSystemExtractorRunner.ts`, `SqlGenerator.ts`, `sqlDbInstanceStoreSectionMixin.ts`, `Templates.ts`. Extra found: `ReduxDeploymentsStateQuerySelectors.ts`. Do **not** write `case "extractorFromAction"` on `ExtractorOrCombinerReturningObject` (TS2367 — the type is not in that union); use `String((select as {extractorOrCombinerType?: string}).extractorOrCombinerType)` in `default`. Store-package tests import filesystem/postgres **source** (FileSystemExtractorRunner is not on the filesystem package index).
- **Cycle 3 (Goal 5 / P8).** `handleAction` keeps the static `defaultEndpointApplicationMap` as the **Miroir-core fast path**. For any other endpoint, when `persistenceStoreAccessMode === "local"`, `findEndpointInstanceAcrossLocalStores` scans each application in `applicationDeploymentMap` via `readLocalPersistenceSectionInstances(…, "model", entityEndpointVersion.uuid)` and uses the instance’s `application` field; static non-Miroir (Library lending) is fallback only if the scan misses. `handleApplicationAction` takes that resolved uuid and still executes external ops only in `local` mode (D5). `handleAction` / `handleCompositeAction` now return `Action2ReturnType` (success payload is no longer collapsed to `ACTION_OK`). Composite steps stash `actionLabel → localContext[returnedDomainElement]`; `executeCompositeRunBoxedQueryAction` merges `localContext` into `query.contextResults`. Cycle 3 tests call **`domainControllerForServer`** (emulated-server DC, `local` mode) — the session’s client DC is `remote` and would run `compositeActionSequence` in-process without a generic `POST /action` transport (analysis non-goal). Bootstrap now exposes `domainControllerForServer` on `MiroirTestExecutionEnvironment`.
- **Cycle 4 (D5).** Sync `runQuery` names `extractorFromAction` (`cannot be executed on the sync QuerySelectors path`); the `runQuery` wrapper now **propagates** the inner `failureMessage` (it previously dropped it, leaving `ReferenceNotFound` with an empty message). `runAsSql: true` is rejected in `resolveExtractorFromActionInBoxedQuery` (`extractorFromAction cannot be executed with runAsSql (SQL generation is unsupported)`) with zero fake-server requests.

**Validation** (`--profile emulatedServer-filesystem` required; rebuild `miroir-core` after controller/selector changes):
- `externalServiceDispatch.267.phase4` — 13 passed
- `externalServiceGuards.267.phase3` — 17 passed
- `externalServiceQuery.267.phase2` — 4 passed
- `tsc --noEmit --skipLibCheck` miroir-core, miroir-standalone-app, miroir-store-filesystem, miroir-store-postgres — clean

**Deviations:**
- Cycle 3 is proven on the **server** DomainController, not the client session DC. D5 forbids running `executeExternalServiceOperation` on `remote`; there is no generic remote application-action bus.
- Library lending stays on the static map as a miss-fallback and as the remote-client path for that known endpoint. Dynamic resolution **replaces** the static lookup for unknown / new endpoints on the local/server path.
- Extra closed switch: `ReduxDeploymentsStateQuerySelectors.ts`.
- `handleAction` return type widened (Slice 2 left it as `Action2VoidReturnType`) so composite steps can pass payloads.

**For Slice 5:** Mixed store+external boxed queries: intercept runs `extractorFromAction` first, writes `contextResults`, strips those extractors, remaining store extractors go through persistence; combiners/transformers see the merged context. All-external queries return `{ status: "ok", returnedDomainElement: contextResults }` with no persistence handoff. Report load must use the **async server** boxed-query route (`POST /query`), never sync Redux `runQuery` / `runAsSql`. Do not add `extractorFromAction` to `extractorOrCombinerReturningObject`. Template form (`extractorTemplateFromAction`) and `PageDispatcher` are still Slice 5. Composite `get-playlist` works server-side; a browser/client composite will not fetch (D5, no `POST /action`). Loopback still needs `allowInsecureBaseUrlsForTests`. `testByFile` needs `--profile emulatedServer-filesystem`.

---

## Slice 5 — Report path: `extractorTemplateFromAction` + param forwarding + async report-load routing (D5 client, D8)

**Status:** ✅ DONE

### Goal

A report viewer can open `?page=report&…&reportUuid=…&playlistId=<id>` and see playlist data fetched server-side — the report's **async load path** detects the external extractor and routes the whole boxed query to the server; the view renders the returned context.

**Layers cut:** bootstrap schema (template form) → `Templates.ts` resolution → `PageDispatcher` (pure param builder + forwarding) → report load service (`createReportQueryLoadExecutor` / `useEnsureReportQueryLoaded`) → view (loading/error states, returned context).

### 5.1 RED

**Test:** `packages/miroir-standalone-app/tests/issues/267-openapi-external-services/externalServiceReport.267.phase5.integ.test.tsx` (vitest integ, `.tsx` + `MemoryRouter` — React report rendering and URL dispatch are not MiroirTest-reachable; follows the `ReportPage.integ.test.tsx` pattern).

Behavior asserted:
- Pure `reportPageParamsFromSearchParams("?page=report&…&playlistId=abc")` includes `playlistId: "abc"` (flips the Slice 0 lock); `ReportUrlParamKeys`/params typing widened so this is not a type lie; legacy path-segment mode unchanged (non-goal).
- A report whose query template uses `extractorTemplateFromAction` with a `getFromParameters`-bound `playlist_id` renders the fake-server playlist (name + first track from the fixture — behavior, not "Redux was not called").
- Loading → loaded (and error) states render from the async path.
- A query mixing store-backed extractors and one external extractor executes **wholly server-side** (store extractors via the persistence path, external via the intercept, combiners over the merged context) and renders both data sources.

### 5.2 GREEN

- Bootstrap schema: `extractorTemplateFromAction` (bindings as transformer templates) added to the `extractorTemplate*` unions + regen; `Templates.ts` resolves it into `extractorFromAction` (same pattern as `extractorByPrimaryKey`).
- `PageDispatcher`: extract pure `reportPageParamsFromSearchParams(searchParams)` with generic unknown-key forwarding; widen the param types.
- Report load path: extend the **async** seam (`useEnsureReportQueryLoaded` / `createReportQueryLoadExecutor` — already async, unlike the sync `useQueryTemplateResults` hook): when `queryContainsExternalExtractor`, route the whole boxed query via `POST /query` (remote persistence client), stash the returned context, and let the view render it with loading/error states. The sync Redux path is never expected to execute an external extractor (Slice 4 cycle 4 is the guard).

### 5.3 Refactor checkpoint

- `queryContainsExternalExtractor` is one domain-level predicate, not inline view logic.
- Analysis misalignment mapped: §3.5 (closed param union) and §3.2 (client routing) resolved here.

### Validation

```bash
npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core
RUN_TEST=externalServiceReport.267.phase5 npm run testByFile -w miroir-standalone-app -- externalServiceReport.267.phase5
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
```

### Realization

**Done (2026-09-09):**

- RED/GREEN: `packages/miroir-standalone-app/tests/issues/267-openapi-external-services/externalServiceReport.267.phase5.integ.test.tsx` — 5 tests (`.tsx` + MemoryRouter + AppStack session + fake server). Reports are passed as `reportDefinition` props (not committed). Endpoint `c8f2a1b4-…` is committed to the **server** store each `beforeEach` (same Slice 2 fixture, richer `responseSchema`: id, name, `tracks.total`, `tracks.items[].track.{id,name}`).
- **D8 / params.** `reportPageParamsFromSearchParams` forwards unknown search keys generically (`playlistId: "abc"`). Skips `page` and the known keys. Legacy path-segment `ReportWrapper` params **untouched**. `ReportUrlParamKeys = ReportUrlKnownParamKeys | (string & {})` in `constants.ts`. Builder uses a mutable `Record<string, string | undefined>` then casts to `Params<ReportUrlParamKeys>` (RR `Params<>` is readonly / index-signature once the union is widened — TS2542). Phase 0 lock flipped to expect forwarding.
- **Schema.** `extractorTemplateFromAction { endpointUuid, actionType, parameterBindings: record of coreTransformerForBuildPlusRuntime }` on Query Entity + Query EntityVersion and in `getMiroirFundamentalJzodSchema`: named context key + member of `extractorOrCombinerTemplate` (union with the generated `miroirTemplate_…_extractorOrCombiner`) and `extractorTemplateReturningObject`. **Not** added to `extractorOrCombinerReturningObject` (Slice 2/4 constraint). Regen: `build -w miroir-test-app_deployment-miroir && devBuild -w miroir-core`.
- **Templates.ts.** `resolveExtractorTemplate` default branch: if type is `extractorTemplateFromAction` **or** `extractorFromAction`, resolve each binding via `transformer_extended_apply` when it has `transformerType`, else pass through. Returns `{ extractorOrCombinerType: "extractorFromAction", endpointUuid, actionType, parameterBindings }`. Cases stay in `default` (not switch labels) so it compiled before regen.
- **Async report load (P6).** Domain predicate `queryContainsExternalExtractor` (`packages/miroir-core/src/1_core/queryContainsExternalExtractor.ts`) — true if any extractor/extractorTemplate type is `extractorFromAction` or `extractorTemplateFromAction`. `isReportQueryLoadSegmentSufficient` returns **false** when the predicate is true (empty load-targets used to be vacuously sufficient). `createReportQueryLoadExecutor`: if external, POST the **whole** boxed query via `domainController.handleBoxedExtractorOrQueryAction` with `queryExecutionStrategy: "storage"` (endpoint `9e404b3c-…`); throw on `Action2Error`; return `returnedDomainElement`. Store-only path unchanged. `ReportQueryLoadService` stashes that result (`getResult(key)`); invalidate/error clears it.
- **View.** `useQueryTemplateResults`: still resolves templates client-side, but skips sync Redux `runQuery` and returns `reportData: {}` when the predicate is true. `ReportViewWithEditor` renders `service.getResult(fingerprint)` for external queries; loading/error keep existing strings `"Loading report data…"` / `"Report async load failed (showing cached data if available)."`. Stable `EMPTY_EXTERNAL_REPORT_DATA` avoids Formik `enableReinitialize` loops. No new `useEffect` — existing `useEnsureReportQueryLoaded` / `useReportQueryLoadService` seam.
- **Mixed query.** Store `extractorByPrimaryKey` Country France (`d3139a6d-…` / `b62fc20b-…`) + external playlist template + `combinerOneToOne` `franceAgain`. Testbed seed extended with `Country3` — `libraryEntitiesAndInstances` is authors/books/publishers only; without France the server filesystem extract fails (`InstanceNotFound`). Asserts `"Rock Classics"`, `"Born to Run"`, `"France"`.

**Validation** (`--profile emulatedServer-filesystem` required for integ; rebuild first):
- `externalServiceReport.267.phase5` — 5 passed
- `externalService.267.phase0` — 5 passed
- `externalServiceQuery.267.phase2` — 4 passed
- `externalServiceGuards.267.phase3` — 17 passed
- `externalServiceDispatch.267.phase4` — 13 passed
- `tsc --noEmit --skipLibCheck` miroir-standalone-app + miroir-core — clean

**Deviations:**
- Harness mocks: `useParams` (established ReportPage convention), `JsonDisplayHelper`, and `ModelDiagramReportSectionView` (vitest/happy-dom cannot load `miroir-diagram-class` → `svg-toolbelt` CJS `exports`). Fake server is the only HTTP fake. Optional `delayMs` on fixtures so the loading-state test can observe `"Loading report data…"`.
- Reports are **not** committed to the store; only the test endpoint is.
- Mixed store extractor is written as resolved `extractorByPrimaryKey` inside `extractorTemplates` (Templates already accepts that form). External side uses `extractorTemplateFromAction`.
- `testByFile` already adds `--bail=1`; do not pass `--bail` again.

**For Slice 6/7:** Hand-write Spotify query/report assets with this template shape:

```json
{
  "extractorOrCombinerType": "extractorTemplateFromAction",
  "endpointUuid": "<spotify endpoint uuid>",
  "actionType": "get-playlist",
  "parameterBindings": {
    "playlist_id": { "transformerType": "getFromParameters", "referenceName": "playlistId" }
  }
}
```

Report sections in the Slice 5 tests are `jsonReportSection` with `fetchedDataReference` pointing at the extractor/combiner key (raw object, no Entity). URL: `?page=report&application=…&deploymentUuid=…&applicationSection=data&reportUuid=…&playlistId=<id>` — `playlistId` is forwarded into `pageParams` and then into the query template context, so `getFromParameters` / `referenceName: "playlistId"` works. The report async path POSTs the **whole** boxed query (`queryExecutionStrategy: "storage"`) when `queryContainsExternalExtractor` is true; do not use sync `useQueryTemplateResults` / Redux `runQuery` for external extractors. Loopback still needs `allowInsecureBaseUrlsForTests`. `testByFile` needs `--profile emulatedServer-filesystem`. Do not add `extractorFromAction` to `extractorOrCombinerReturningObject`. Slice 6 still owns the sync transformer, `kind: "http"`, and the Spotify package is Slice 7.

---

## Slice 6 — Sync transformer + bounded OpenAPI→Jzod converter + Entity `kind: "http"` schema (D2, D3)

**Status:** ⬜ pending

### Goal

An application designer can run the `syncExternalServiceSchema` transformer on the endpoint's stored Spotify OpenAPI doc with scope `["get-playlist"]`, review the produced `compositeActionSequence`-shaped JSON (materialized `operations[]` + `SpotifyPlaylist` entity upsert), execute it through the standard composite-action machinery, and see the synced model elements land — the review-then-execute loop, with no hand-written assets.

**Layers cut:** Entity meta-model schema (`externalDataSource.kind`) → generated types → store bootstrap skip → TransformerDefinition asset + runtime handler → converter → composite action execution.

### 6.1 RED

**Test A (unit):** MiroirTest `transformerTest` suite `externalServiceSync` (`miroir-core`, unit) — the transformer is a pure function, the ideal MiroirTest vehicle. Inputs are **transformer parameters** (`(openApiDocument, appModel, scope)` — unit runners always pass `defaultMetaModelEnvironment` as context, so the app model must be a parameter); the Spotify OpenAPI excerpt and the test endpoint are imported as **real assets**, not inline copies.

Behavior asserted:
- Output conforms to the `compositeActionSequence` shape and contains: an endpoint `updateInstance` whose `operations[]` gains an entry with `operationId: "get-playlist"`, `method: "GET"`, `path: "/playlists/{playlist_id}"`, parameter mappings, and a bounded Jzod `responseSchema`; and a `createEntity` for `SpotifyPlaylist` with `idAttribute: "id"`, `externalDataSource: { kind: "http", endpoint: "0e5cb172-…" }`, and the bounded `mlSchema` (name, owner, images, `tracks.total`, `tracks.items[].track.{id,name,artists,duration_ms}`).
- Conversion rules: OAS `nullable: true` → Jzod `nullable`; `allOf` flattened; `oneOf`/`anyOf` outside the bounded subset rejected with a clear transformer error; non-GET operations in scope are skipped (read-only by construction).

**Test B (integration):** MiroirTest `actionTest` suite `externalServiceSyncExecute` (`miroir-standalone-app`, integration) — proves only that the generated `compositeActionSequence` lands: after execution, the test deployment's model contains the upserted endpoint `operations[]` and the `SpotifyPlaylist` entity. **No HTTP** (MiroirTest cannot start a fake server — the "query the synced model against the fake server" loop-closure lives in the Slice 2 vitest fixture, extended here to run against the synced model instead of the hand-written one).

### 6.2 GREEN

- **Entity meta-model first** (prerequisite for any `kind: "http"` instance): `externalDataSource` gains `kind?: "sql" | "http"` (absent = `"sql"`) and `endpoint?: uuid` on the Entity `mlSchema` (authoritative) + EntityVersion-of-EntityVersion; the generated Zod is `.strict()` today (`schema?`, `tableName?` only) — regen via the build chain. Store bootstrap: Postgres `isExternal` predicate (`SqlDbStoreSection.ts`) excludes `kind === "http"` (no Sequelize model, no SELECT); filesystem `createStorageSpaceForInstancesOfEntity` skips `kind: "http"`; indexedDb/mongodb equivalents.
- **Transformer:** TransformerDefinition asset (uuid `c615ff0e-…`) + handler registered per the `TransformersForRuntime.ts` pattern (`applicationTransformerDefinitions`); output declared with `transformerResultSchema` = compositeActionSequence shape (a transformer returns JSON; callers execute it via `handleCompositeAction`). Production entry point: invoked with the app's own model environment via `localCache.currentModelEnvironment(spotifyApplication, map)` (Transformer Builder / runner — **not** `POST /query`, which passes `defaultMiroirModelEnvironment`).
- **Converter** (new module behind the handler — deep module, no internals exported): `$ref` resolution bounded to the subset; mapping rules per the assertions. Add the `yaml` dependency to `miroir-core` (sync-time parsing only; note: this pulls the parser into the standalone-app bundle — accepted per D2's client-or-server sync; the runtime fetch path must not import it).

### 6.3 Refactor checkpoint

- Converter output size sanity-checked against the real Spotify doc (record the size in the Realization — reviewability is a D2 requirement).
- Analysis misalignment mapped: §3.4 (`kind: "http"` schema + store skip) resolved here; Slice 7 only consumes it.

### Validation

```bash
npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core
npm run testMiroir -w miroir-core -- --suites externalServiceSync --mode unit
npm run testMiroir -w miroir-standalone-app -- --suites externalServiceSyncExecute --mode integration
RUN_TEST=externalServiceQuery.267.phase2 npm run testByFile -w miroir-standalone-app -- externalServiceQuery.267.phase2
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
```

### Realization

<Appended on completion, together with Status ✅ DONE.>

---

## Slice 7 — Spotify example app package (D7, D3 assets, D10 display)

**Status:** ⬜ pending

### Goal

A report viewer can start the standalone app with the Spotify deployment, open the playlist report, paste a playlist ID in the URL, and see the playlist (name, owner, first ≤100 tracks, total) — a self-contained example app whose endpoint/entity assets are **generated by dogfooding the Slice 6 sync** on the real Spotify doc (reviewed, then committed).

**Layers cut:** new package (assets + assembly, mirroring `Library.ts`) → registration inventory → report assets.

### 7.1 RED

**Test:** `packages/miroir-standalone-app/tests/issues/267-openapi-external-services/spotifyApp.267.phase7.integ.test.ts` (vitest integ — full deployment boot + report rendering; not MiroirTest-reachable) + the new package's `modelValidation`.

Behavior asserted:
- The Spotify deployment boots (filesystem profile) with the `SpotifyPlaylist` entity present in the model and **no storage space created** for it (consumes Slice 6's skip).
- `defaultSelfApplicationDeploymentMap` / the admin `Deployment` instance contain `fd47d115-…` (registration is behaviorally proven, not checklisted).
- The playlist report renders the fake-server playlist via `playlistId` URL param: name, owner, first page of tracks, and `tracks.total` ("first 100 of N" — D10).
- `modelValidation` passes for `miroir-test-app_deployment-spotify`.

### 7.2 GREEN

- New package `miroir-test-app_deployment-spotify` (layout mirrors `miroir-test-app_deployment-library`): SelfApplication `00514586-…`, branch `cddedb5a-…`, Deployment `fd47d115-…`, Menu `1b4b181d-…`, Endpoint `0e5cb172-…`, Entity `56166585-…` + EntityVersion `1a34fdf2-…`, Query `371aed0c-…` (`extractorTemplateFromAction`, `playlistId` via `getFromParameters`), Report `10ce3252-…` (objectInstance section + tracks list section fed by a runtime transformer projecting `tracks.items`).
- Endpoint `operations[]` + entity `mlSchema` produced by running the Slice 6 sync on the real doc; reviewed; committed (raw doc embedded as `openApiDocument` provenance).
- Registration inventory (analysis D7): `build-all.sh`, admin `Deployment` instance, `defaultSelfApplicationDeploymentMap` / config JSON, menu wiring, standalone-app imports.

### 7.3 Refactor checkpoint

- Pure-data slice rule: proof = `modelValidation` + rebuild + Slice 0 inventory lock (diff reviewable); the boot/report test is the behavioral proof.

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

## Slice 8 — Nonreg, docs, cleanup, AC, opt-in live test

**Status:** ⬜ pending

### 8.1 Nonreg

- Add `externalServices-spotify` step to `scripts/nonreg-manifest.json` (phase 2/3/4/5/7 tests + `externalServiceSync` / `externalServiceSyncExecute` suites).

### 8.2 Opt-in live test (D9)

- `spotifyLive.267.phase8.integ.test.ts`: skipped unless `LIVE_SPOTIFY_TOKEN` (env) is set; runs the Slice 2 query against real Spotify; never logs env/headers (D4); not part of nonreg.

### 8.3 Docs

- `analysis.md` status → implemented; progress table DONE; `docs/reference/testing.md` notes the new suite keys; `docs/reference/data-architecture-deployments.md` gains the external-service endpoint paragraph; **issue #267 AC text updated** ("upserts the endpoint actions" → operations + entity, matching the D1 repair).

### 8.4 Issue-directory cleanup

- Migrate still-valuable assertions from `tests/**/issues/267-openapi-external-services/` into feature-named suites (candidate: the end-to-end query path → MiroirTest suite `externalServiceQuery`, uuid `008325cb-…`, if the harness gains a fake-server fixture; otherwise keep as a feature-named vitest file); delete the issue directory (per `docs/contributing/testing.md`, #238 rule).

### 8.5 Tracer bullet (narrative)

1. Launch server: `node packages/miroir-server/release/index.js --secret spotifyUser=<token>`.
2. Open the standalone app → Spotify deployment → playlist report URL with `&playlistId=<id>`.
3. Report shows playlist name, owner, first ≤100 tracks, total — fetched server-side from Spotify (fake server in tests).

Automated equivalent: `spotifyApp.267.phase7.integ.test.ts` + `externalServiceQuery.267.phase2.integ.test.ts`.

### AC checklist (#267)

| Criterion | Proven by | Status |
|---|---|---|
| External service definable as Endpoint instance (raw doc + `credentialKey`), editable via generic editor | Slice 1 schema test + Slice 7 assets (`modelValidation`) | ⬜ |
| `--secret spotifyUser=<token>`; token never in repo/model/REST responses | Slice 2 secrets cycles + redaction tests; Slice 2 header assertion | ⬜ |
| Sync transformer produces reviewable `compositeActionSequence`; executing it upserts operations + entity | `externalServiceSync` + `externalServiceSyncExecute` suites | ⬜ |
| Report at `?…&playlistId=<id>` displays playlist (name, owner, ≤100 tracks, total), server-fetched | Slice 5 + Slice 7 integ tests | ⬜ |
| External data read-only; non-GET not exposed | Slice 4 cycle 1; Slice 6 non-GET-skip assertion | ⬜ |
| Client-side without server → clear error | Slice 4 cycle 4 | ⬜ |
| Integration tests vs fake server, dummy secrets, no real token | Slices 2–7 fixtures; Slice 8 opt-in live test separate | ⬜ |

### Validation

```bash
npm run nonreg
```

### Realization

<Appended on completion, together with Status ✅ DONE.>
