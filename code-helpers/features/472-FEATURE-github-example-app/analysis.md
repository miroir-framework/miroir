# 472 — GitHub example application

> A new example package, `miroir-example-github`, reads the GitHub REST API through an
> external-service Endpoint built from GitHub's OpenAPI description. Its home page is a
> multistep Report where a user enters their own token; one Report lists that user's repositories.

Related issue: https://github.com/miroir-framework/miroir/issues/472
Prerequisites: [#267 OpenAPI external services + Spotify](https://github.com/miroir-framework/miroir/issues/267) ✅ · [#270 persistent named secrets](https://github.com/miroir-framework/miroir/issues/270) ✅ · [#274 multistep Reports](https://github.com/miroir-framework/miroir/issues/274) ✅ · [#281 API-call report section](https://github.com/miroir-framework/miroir/issues/281) ✅ · [#284 connection wizard](https://github.com/miroir-framework/miroir/issues/284) ✅
Related analyses: [`../284-FEATURE-openapi-connection-wizard/analysis.md`](../284-FEATURE-openapi-connection-wizard/analysis.md) · [`../274-FEATURE-multistep-reports/analysis.md`](../274-FEATURE-multistep-reports/analysis.md)
Key sources: [`miroir-example-spotify`](../../../packages/miroir-example-spotify/) · [`ExternalServiceClient.ts`](../../../packages/miroir-core/src/4_services/ExternalServiceClient.ts) · [`SecretStore.ts`](../../../packages/miroir-core/src/4_services/SecretStore.ts) · [`SecretsService.ts`](../../../packages/miroir-core/src/4_services/SecretsService.ts) · [`DomainController.ts`](../../../packages/miroir-core/src/3_controllers/DomainController.ts) · [`RestServer.ts`](../../../packages/miroir-core/src/4_services/RestServer.ts) · [`MultistepReportHost.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/MultistepReportHost.tsx) · [`syncExternalServiceSchema.ts`](../../../packages/miroir-core/src/2_domain/syncExternalServiceSchema.ts)

**Document role:** analysis and decision record.
**Status:** decisions Q1–Q10 confirmed with A on 2026-10-04 (grilling round 1, recorded in the thread; Q7 changed: no excerpt rebuild script). D11–D15 below are mechanism choices made while mapping the code; they follow from Q1–Q10 and are flagged for A in the delivery reply.

---

## 1. Goals

- **G1 — Connect with my own token.** In order to see my GitHub data in Miroir as a GitHub app user, I can enter my personal access token on the app's home page, see whom it identifies, and save it.
- **G2 — My repositories.** In order to browse what I own or work on as a GitHub app user, I can open a Report listing the repositories of the account I connected.
- **G3 — A second OpenAPI example.** In order to learn how to plug a bearer-token service into Miroir as an application maintainer, I can read a small example package built from the service's published OpenAPI description, next to Spotify (OAuth refresh token).
- **G4 — Reusable credential step.** In order to give any bearer-token external service a "connect" step as a report designer, I can call one framework action from a multistep Report that checks a token against the service and saves it.

## 2. Non-goals

- OAuth apps, the device flow, GitHub App installation tokens (later, unscheduled).
- GitHub Enterprise base URLs (the base URL is fixed to `https://api.github.com`).
- Other GitHub Reports (issues, pull requests, organizations), write operations, and pagination inputs on the repositories Report (later, unscheduled).
- A table display for array responses in `apiCallReportSection` (later, unscheduled; see D14).
- A script that rebuilds the OpenAPI excerpt from GitHub (dropped by A, Q7).
- Deleting a saved token from the UI (later; `secrets.delete` exists).

## 3. Decision record

| ID | Question | Choice | Serves |
|---|---|---|---|
| D1 (Q1) | Credential | **Personal access token** (classic or fine-grained) as `Authorization: Bearer`, scheme `{type:"http", scheme:"bearer"}` + `credentialKey` | G1, G3 |
| D2 (Q2) | Whose token | **Per user** (`MiroirSecret.miroirUser` = principal) when a principal exists; **process** row when authentication is off | G1 |
| D3 (Q3) | Storage | **Encrypted `MiroirSecret` row** only. No wrapping key: Finish fails with "wrapping key required" | G1 |
| D4 (Q4) | Home walk | Step 1 token (masked) → Next calls `GET /user` → step 2 "Connected as" → Finish saves, then opens the repositories Report. Base URL fixed | G1, G2 |
| D5 (Q5) | Action | **Generic miroir-core action** `setExternalServiceCredential` | G4 |
| D6 (Q6) | Repositories call | One call, `per_page=100`, `sort=updated`; fields full name, private, language, stars, updated at, URL | G2 |
| D7 (Q7) | OpenAPI text | **Hand-cut excerpt** of `api.github.com.json`, source commit recorded in `info.description`; no rebuild script | G3 |
| D8 (Q8) | Headers | `User-Agent: miroir-example-github`, `Accept: application/vnd.github+json`, `X-GitHub-Api-Version: 2022-11-28` as `extraHeaders` | G1, G2 |
| D9 (Q9) | Tests | Model validation, integ tests with a fake server, a report MiroirTest of the home walk, opt-in live test `LIVE_GITHUB_TOKEN` | all |
| D10 (Q10) | Registration | Package `miroir-example-github`, application `GitHub`, registered wherever Spotify is | G3 |
| D11 | Where the action runs | **Server**, routed like `probeExternalService` | G1, G4 |
| D12 | Probing a candidate token | **In-memory endpoint copy with a one-shot credential name** | G1, G4 |
| D13 | `GET /user` is a `oneOf` | **Excerpt keeps `public-user` only** (documented deviation) | G1, G3 |
| D14 | Repositories display | **Existing `apiCallReportSection`** (read-only array of records) | G2 |
| D15 | Opening a Report after Finish | **New optional `finishOpenReport` on multistep Reports** | G1, G2 |

### D5 — the action

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D5-a. Generic `setExternalServiceCredential`** ★ | Payload `{application, endpointUuid, credential, probeOperationId, probeParameters?, probeOnly?}`. Reads the endpoint's `credentialKey`, probes, then upserts the `MiroirSecret` row. Returns the probe response | Any `http` bearer endpoint can reuse it (Discogs token) | One more Miroir action: Endpoint asset entry + type regeneration |
| D5-b. Reuse `connectExternalService` | It already probes and persists secrets | No new action | It also creates/updates an Endpoint, a Report and a menu item, and persists process rows only (DomainController `handleConnectExternalService`, persist block with `persistImportedProcessSecrets`) |
| D5-c. GitHub-only action in the example package | Library implementation shipped by the example | Local | Example packages hold JSON assets only today; not reusable |

`probeOnly: true` is the onNext variant (no write); Finish calls it without `probeOnly`. Finish probes again so a token cannot be saved without a successful call in the same action.

### D11 — where the action runs

Report actions run in the browser's DomainController: `MultistepReportHost` calls `domainController.handleAction` / `handleCompositeActionTemplate` on the client, and there is no list of server-only Miroir actions (comment in `DomainController.handleMiroirAction`). Only `probeExternalService` hops to the server, special-cased by action type in four places:

- `RestPersistenceClientAndRestClient.ts` L285 (localcache-redux and localcache-zustand, identical): POST `/action/probeExternalService`.
- `PersistenceReduxSaga.ts` L792 and `PersistenceAsyncStore.ts` L458: pass the server's `returnedDomainElement` through.
- `RestServer.ts` L373: runs it with `urlParams.authPrincipal`.

The wrapping key is only set server-side (`setSecretsMasterKey` in `miroir-server/src/server.ts`), and the principal only exists there. So:

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D11-a. Same special case as `probeExternalService`** ★ | Add `setExternalServiceCredential` next to it in the four places; the client DomainController forwards it when its access mode is not `local` (as `runExternalServiceProbe` does) | Proven route; principal and wrapping key available | A second hard-coded action type in each place |
| D11-b. Generic "server-only" flag on Miroir actions | Endpoint action definitions declare `runsOn: "server"`; routing reads it | Removes the special cases | Schema change on Endpoint actions, touches every route; larger than this issue |

D11-b is a fair follow-up once a third server-only action appears.

### D12 — probing a candidate token

`resolveSecret(name, principal)` returns the user entry before the process entry (`SecretStore.ts` L51–69). Registering the candidate under the endpoint's `credentialKey` as a process secret (what `connectExternalService` and `handleProbeExternalService` do) would probe the **old** user token when one is stored.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D12-a. One-shot name** ★ | Copy the endpoint in memory with `credentialKey: "__probe_<uuid>"`, `registerHydratedProcessSecret` that name, call `externalServiceClient.executeOperation(copy, …, principal)`, `unregisterProcessSecret` in `finally` | No shadowing, no restore logic, no change to `ExternalServiceClient` | The candidate sits in the process map for the duration of one call (redaction covers registered values) |
| D12-b. `credentialOverride` argument on `executeOperation` | New optional parameter through `fetchExternalServiceOperation` / `resolveAuthorizationHeader` | Value never registered | Changes the `ExternalServiceClientInterface` used by every caller and fake |

### D13 — `GET /user` response

`users/get-authenticated` answers `oneOf [private-user, public-user]` with a `user_view_type` discriminator. `convertSchema` (`syncExternalServiceSchema.ts` L264–281) accepts a `oneOf` only when exactly one variant has all bound fields; `login`, `name`, `avatar_url`, `html_url` exist in both, so the sync throws. Binding a private-only field (`two_factor_authentication`) would select `private-user`, whose `required` list then fails `lenientValidateMl` on the public view GitHub returns to tokens without the `user` scope (fine-grained tokens without profile permission).

| Option | Pros | Cons |
|---|---|---|
| **D13-a. Excerpt keeps `public-user` only** ★ | `private-user` adds three fields to `public-user` (`business_plus`, `ldap_dn`, `two_factor_authentication`); `public-user` is the subset both views satisfy | The excerpt is not byte-faithful at that point; recorded in `info.description`, as the Spotify excerpt records its `items`/`item` drift |
| D13-b. Teach the sync to pick the first matching variant | Faithful excerpt | Changes a shared conversion rule (#284 D7) for one example |

### D14 — repositories display

`apiCallReportSection` renders the operation's `responseSchema` with `TypedValueObjectEditor` (read-only); an array root goes through `MlArrayEditor`, one record per repository. No section renders an arbitrary array as a table (`objectListReportSection` needs an Entity).

| Option | Pros | Cons |
|---|---|---|
| **D14-a. `apiCallReportSection` as is** ★ | No UI work; same path as Spotify | 100 stacked records, not a table |
| D14-b. Table mode for array responses | Readable list | New view work outside "one report for now" |
| D14-c. An HTTP-backed Entity + `objectListReportSection` | Grid | #281 removed exactly this pattern from Spotify |

### D15 — opening the repositories Report after Finish

`MultistepReportHost.handleFinish` discards the Finish result and calls `leaveProcess` (L911–918): `onDismissed()` when opened as a modal, else `navigate(-1)`. On a home page `navigate(-1)` leaves the app.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D15-a. `definition.finishOpenReport`** ★ | Optional `{reportUuid, application?, applicationSection?}` on Report definitions, used by the host after a successful Finish via `openReportHref` (`OpenReportLaunch.tsx`) | Declarative, reusable | Report schema change (Report entity `3f2baa83-…` + its EntityVersion, type regeneration) |
| D15-b. Step 2 holds an `openReportSection` "My repositories" and Finish only saves | No schema change | Saving then clicking a second button; Finish still leaves the app |

---

## 4. Current state

### 4.1 Spotify example package (the model to copy)

`packages/miroir-example-spotify/` holds, under `assets/spotify_model/` (enumerated):

| Entity folder | uuid | name |
|---|---|---|
| Endpoint `3d8da4d4-…` | `0e5cb172-12ea-4467-8598-5889338ae454` | `SpotifyService` (`oauth2AuthorizationCode`, `enabledOperations: ["get-playlist"]`) |
| Menu `dde4c883-…` | `1b4b181d-4616-4391-a41f-33bbee4fd356` | `SpotifyMenu` |
| ApplicationModelBranch `cdb0aec6-…` | `cddedb5a-2789-45b2-be93-d6f52ae3f6eb` | `master` |
| SelfApplication `a659d350-…` | `00514586-bf72-4de3-beea-0a627c821404` | `Spotify` (`homePageUrl` → report `10ce3252-…`, section `data`) |
| Report `3f2baa83-…` | `10ce3252-7840-4041-a769-9a0e2d5ee10b` | `SpotifyPlaylistReport` (inputReportSection + apiCallReportSection) |
| Query `e4320b9e-…` | `371aed0c-05bb-4b77-8cf1-2c82407555c1` | `spotifyGetPlaylist` |

Plus `assets/deployment/` (AdminApplication `00514586-…`, filesystem Deployment `fd47d115-…`), `assets/test-resources/spotifyOpenApiExcerpt.get-playlist.json`, `scripts/dogfood-sync-spotify-schema.ts` (runs `syncExternalServiceSchema` on the excerpt and writes `operations[]` onto the Endpoint), `src/Spotify.ts` (exports, `defaultSpotifyAppModel`, `getDefaultSpotifyModelEnvironment`), `tests/modelValidation.unit.test.ts`.

Registration outside the package (all found by search for the package name and the four uuids):

| Place | What |
|---|---|
| `environments/test-filesystem.json` L39–46 | `spotify` application entry (`mode: copy`, `sections.modelVersion`) |
| `environments/test-{indexedDb,mongodb,sql}.json` | one-line store override |
| `packages/miroir-standalone-app/src/miroir-fwk/4-tests/miroirConfig.browser-emulatedServer-indexedDb.json` L76–93 | `deploymentStorageConfig` block |
| `packages/miroir-standalone-app/tests/helpers/testEnvironmentConfig.unit.test.ts` L25–31 | expected deployment keys |
| `build-all.sh` L83, L105, L107, L667 | build lists |
| `Dockerfile` L74–76, `.github/workflows/pr-checks.yml` L105 | builds |
| `packages/miroir-standalone-app/package.json` L57 | dependency |
| `scripts/nonreg-manifest.json` L1813 | `externalServices-spotify` |
| `packages/miroir-standalone-app/tests/4_view/issues/274-multistep-reports/multistep.274.phase0.unit.test.ts` L55–61 | `ASSET_TREES` |
| `packages/miroir-core/tests/1_core/zodParseResults.unit.test.ts` L110 | Query inventory |
| `docs/reference/data-architecture-deployments.md` L31, `versioning.md` L32, `testing.md` | docs |

Not registered for Spotify: `dev.json`, `docker.json`, `local.json`, `desktop.json`, miroir-server, miroir-mcp, Electron. MiroirTest discovery needs no change (`DEPLOYMENT_PACKAGE_PREFIXES` includes `miroir-example-`).

### 4.2 Bearer tokens (aligned)

`EndpointSecurityScheme` `http` arm (`endpointDefinition.ts`) and `ExternalServiceClient.ts` L605–623 build `Bearer ${resolveSecret(credentialKey, principal).value}`. Responses pass `lenientValidateMl(operation.responseSchema, body)` (L815) which strips unknown fields and fails on wrong types. Nothing to change for GitHub.

### 4.3 Secrets (partly aligned)

- `hydrateSecrets` registers rows with `miroirUser` as user secrets at startup.
- `persistImportedProcessSecrets` (SecretsService L378) upserts process rows; `persistRotatedSecretRow` (L315) updates an existing row of either scope but throws when absent. **No helper creates a user-scoped row** (misaligned with D2).
- `assertSecretInstanceMutationAllowed` (AuthenticationPolicy L531–572) only checks the `secrets.set` label. It does not check that `miroirUser` equals the principal; the new action sets `miroirUser` from the principal itself, never from the payload.

### 4.4 Multistep host (partly aligned)

- Step envelope `{stepId, section, onNext?, branch?, inputSchemaFromBag?}` (Report entity L185–254). onNext's `returnedDomainElement` is stored at `bag[stepId]` (MultistepReportHost L829–836), so a step whose `stepId` equals an `inputPrefix` loses its form values. An Action2Error stays on the step and shows in `multistep-finish-error`.
- A later step can show the onNext result through `runtimeTransformers` + `jsonReportSection` (Library `MultistepCountryCreate` `d2b2fbbd-…` pattern).
- Finish: `runMultistepFinish` (L137) runs `definition.compositeActionSequence`; success leaves via `navigate(-1)` (misaligned with D4, see D15).

### 4.5 GitHub OpenAPI description

`github/rest-api-description` main at `836ce198db13a6fb194547e53eea99c6ddae495b`, `descriptions/api.github.com/api.github.com.json` (OpenAPI 3.0.3, 13 MB, no `securitySchemes`, server `https://api.github.com`).

| Path | operationId | 200 response |
|---|---|---|
| `GET /user` | `users/get-authenticated` | `oneOf [private-user, public-user]` |
| `GET /user/repos` | `repos/list-for-authenticated-user` | `array<repository>`; query params `visibility, affiliation, type, sort, direction, per_page, page, since, before` |

`repository` requires 79 fields; the six bound for D6 (`full_name`, `private`, `language`, `stargazers_count`, `updated_at`, `html_url`) plus `id` and `name` are all required, `language` and `updated_at` nullable. The excerpt keeps only bound properties of each schema with their `required` entries.

## 5. Key reuse

| Piece | Location |
|---|---|
| Package layout, exports, model validation test | `packages/miroir-example-spotify/` |
| Sync excerpt → `operations[]` | `scripts/dogfood-sync-spotify-schema.ts` pattern, transformer `syncExternalServiceSchema` |
| Fake HTTP server + `overrideEndpointBaseUrl` | `packages/miroir-standalone-app/tests/utils/fakeExternalServiceServer.ts`, `tests/4_view/spotifyApp.integ.test.tsx` |
| Report MiroirTest with `fakeHttpResponses` | `packages/miroir-app-miroir/assets/miroir_data/a311f363-…/6446d8b1-8268-4e29-b234-37a267cb7c6b.json` (`report.connectExternalServiceWizard`) |
| Server routing of a Miroir action | `probeExternalService` in the four places of D11 |
| Action declaration | Miroir Endpoint `1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5` (`probeExternalService` entry), `ActionImplementations.ts`, `DomainControllerActionHost.ts` |
| Secret row building | `miroirSecretInstanceUuid(name, scope, user)`, `encryptSecret`, `withSecretRowWriteLock` (SecretsService) |
| Persist tests with a wrapping key | `connectExternalService.284.phase4.integ.test.ts`, `secretsHydrate.270.phase1.integ.test.ts` |
| Opening a report by href | `openReportHref` in `OpenReportLaunch.tsx` |

New identifiers for the package:

| Element | uuid |
|---|---|
| SelfApplication `GitHub` | `6c4edcb2-e165-407a-b728-fbf8a18b6bf7` |
| Filesystem Deployment | `752c2412-a2cc-4632-94f3-937168969998` |
| ApplicationModelBranch `master` | `1625a4bc-bf32-40b3-b3ef-243a6a0dd637` |
| Init ApplicationVersion | `038d25c5-e43e-4d1b-8df2-41a809de7fe1` |
| Endpoint `GitHubService` (`credentialKey: githubToken`) | `0c642e2a-3922-4ce7-99a6-88f91f6a103f` |
| Menu `GitHubMenu` | `065c33ce-5590-41f6-af63-f0d57d2e49ae` |
| Report `GitHubRepositoriesReport` | `9bd8a57a-19e4-4911-b4ae-d1bbebbde338` |
| Query `githubListMyRepositories` | `ae2b3612-b960-43f1-9e7a-17ef61ef725b` |
| Report `GitHubConnect` (multistep, home) | `295d0905-3480-49cd-9b92-6318a96dce01` |
| MiroirTest `report.githubConnect` | `2b1cb9f1-f230-48f0-bae0-7aee8f9dddee` |

## 6. Risks

- Report MiroirTests may run without a wrapping key; Finish then fails by design (D3). The test setup must set a test key, or the MiroirTest stops at "Connected as" and the save is covered by the vitest integ test.
- `parameterBindings` with constant values (`per_page`, `sort`) must survive `bindingStrings`; Spotify only binds page parameters.

Implementation plan: [`tdd-implementation-plan.md`](./tdd-implementation-plan.md).
