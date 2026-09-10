# Issue #270 — TDD Implementation Plan

> Vertical TDD slices (RED → GREEN each), integration-first per `docs/contributing/testing.md`:
> tests exercise the real DomainController / local cache / emulated server (`RestClientStub`,
> `persistenceStoreAccessMode === "local"`) and the existing fake Spotify HTTP server.
> No mocks. Crypto, CLI parse, HTTP route policy, and startup orchestration are vitest in
> `miroir-core` because `miroir-server` has no test suite (same exception as #267
> `parseServerArgs` / `SecretStore`).
> Tracer (Slice 1): a process-scoped secret stored as ciphertext on Admin `MiroirSecret` is
> decrypted with the wrapping key and used by `extractorFromAction` against the fake Spotify
> server — **without** `registerSecrets` in the test body.
>
> **Execution model (this conversation):** implement immediately after this reviewed plan;
> commit after each slice once Validation is green and Realization is appended. Stop only on
> unforeseen gaps that need external input. Not finished until compilation and `npm run nonreg`
> pass. Slices themselves contain no commit checklist lines.

Analysis: [`./analysis.md`](./analysis.md) · Analysis review: [`./adversarial-review.md`](./adversarial-review.md) · Plan review: [`./plan-adversarial-review.md`](./plan-adversarial-review.md) · Issue: https://github.com/miroir-framework/miroir/issues/270
Prerequisite: [#267](https://github.com/miroir-framework/miroir/issues/267) ✅ · [#71](https://github.com/miroir-framework/miroir/issues/71) ✅
Working branch: `270-FEATURE-persistent-named-secrets`

**Resume note:** Plan revised after adversarial review (P1–P18 applied). Slices pending.

---

## Plan-review repairs (binding)

From [`./plan-adversarial-review.md`](./plan-adversarial-review.md). Product decisions D1–D9 are unchanged.

| ID | Repair |
|---|---|
| P1 | Slice 0 assertions that later slices flip are **consumed in place** (updated in `secrets.270.phase0.unit.test.ts` by the flipping slice). Later Validation may re-run phase0 only after that update. Surviving contracts stay: 8-item Admin menu; `parsed.secrets` still `{ a: "b" }`; `/queryTemplate` stays principal-less. |
| P2 | Emulated-filesystem Admin store reads `packages/miroir-standalone-app/tests/assets/admin_model` (5 of 9 entities today). Slice 1 GREEN copies `MiroirSecret` into that folder. Write = server DC `createInstance` on Admin. Read = server-DC boxed query, `queryExecutionStrategy: "storage"`. Session opens Admin on the server DC. |
| P3 | `ParsedServerArgs.secrets` stays the import set. Slice 1 adds only `secretsMasterKey?: string`. No “separate field” rename. |
| P4 | Authenticated-request fixture contract in Slice 2 (reused by 4 and 7): test-local `RestClientStub` wired to the session’s `domainControllerForServer` + `persistenceStoreControllerManager` + identity directory from real deployment-admin assets; tokens minted like `access.262.phase3`. Hatch stays off (`MIROIR_AUTH_ENABLED=0`); stub still binds Bearer → `authPrincipal`. |
| P5 | Slice 4 names the full composite hop list, including `handleActionInternal`. |
| P6 | `persistRotatedSecret` is optional, wired only at server/test startup. Persist fires only for **row-backed** secrets (`source: "row"`). Callback is a wiring-level closure over `serverDomainController`. Fail-closed = callback wired + row-backed + no held key. Existing hatch rotation tests never register the callback. |
| P7 | Slice 2 migrates Slice 1 writes to `actionLabel: "secrets.set"` and re-runs `secretsHydrate.270`. Import upsert (Slice 6) carries the same label. |
| P8 | MCP response redaction is its own slice (Slice 3), immediately after `/secrets` + the Slice 1 redactor extension. UI is Slice 7. |
| P9 | MCP redaction test lives in `miroir-mcp`, driving `handleMcpAction`. |
| P10 | `handleSecretsHttpRoute` lives in `packages/miroir-core/src/4_services/SecretsHttp.ts`. Stub wiring: after gate + manager checks, before `restServerDefaultHandlers.find`. |
| P11 | Slice 1 `server.ts` is parse + usage + **hydrate-only**. All import wiring is Slice 6. |
| P12 | Two nonreg steps: `unit-270-persistent-secrets` (tier unit) and `appstack-270-persistent-secrets` (tier default, `{profile}`). |
| P13 | Slice 1 exports admin `index.ts` + `index.d.ts` and new miroir-core `index.ts` symbols. |
| P14 | Tests delete created Admin secret rows in `afterEach`/`afterAll`. Slice 8 cleanup checks `admin_data/a96856df-…`. |
| P15 | Slice 2 RED rejects `deleteInstance` / `deleteInstanceWithCascade` as well as create/update. |
| P16 | UI test is `secretsPage.270.phase7.integ.test.tsx` (emulated stack; query-param mode only). |
| P17 | Slice 5 asserts process-row rotation and Alice-row rotation separately. |
| P18 | Slice 6 integ: orchestrator import against emulated Admin store via `domainControllerForServer` + `secrets.set`, then `clearSecrets` + hydrate-from-store. |

---

## Scope

- Admin Entity `MiroirSecret` (`a96856df-…`): process-scoped and per-user encrypted rows. Present-model only (no EntityVersion file — same as `MiroirUserCredential`).
- `SecretsService` in `miroir-core` 4_services: wrapping key, encrypt/decrypt, import, hydrate, persist rotation.
- `SecretStore` dual map + `resolveSecret(name, principal?)` → `{ value, scope, miroirUserUuid?, source }`.
- `--secrets-master-key` / `MIROIR_SECRETS_MASTER_KEY`; `--secret` / `MIROIR_SECRET_*` / `AI_*` **key** env = bootstrap import only (Slice 6).
- Dedicated `/secrets` via `handleSecretsHttpRoute` in `4_services/SecretsHttp.ts` (Express **and** `RestClientStub`, persist through `serverDomainController`).
- Principal threaded through action + query + composite paths; OAuth caches principal-scoped.
- MCP tool **response** redaction (Slice 3); generic CRUD rejected; `?page=secrets` form (Slice 7).
- AI `getApiKey` → `resolveSecret`.

This plan does **not** cover: OAuth PKCE in the UI; `MiroirRight.capability` as writer gate (#219 C2); MCP wrapping-key hydrate / identity (#263); Deployment store passwords; OS keychain / wrapping-key rotation; splitting `ExternalService` out of `Endpoint`; a platform `server-only` entity flag.

---

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Characterize SecretStore / CLI / principal-drop / caches / Admin inventory | ✅ DONE | `secrets.270.phase0.unit.test.ts` |
| 1 | **Tracer:** process-scoped persist + hydrate + fake Spotify query | ✅ DONE | `secretsHydrate.270.phase1.integ.test.ts` + `secretsService.270.phase1.unit.test.ts` |
| 2 | Dedicated `/secrets` HTTP + CRUD guard (in-process persist) | ⬜ | `secretsHttp.270.phase2.integ.test.ts` |
| 3 | MCP tool **response** redaction (`passwordHash` + `ciphertext`) | ⬜ | `secretsRedact.270.phase3.unit.test.ts` (miroir-mcp) |
| 4 | Per-user secrets + principal thread + principal-scoped OAuth cache | ⬜ | `secretsPrincipal.270.phase4.integ.test.ts` |
| 5 | Persist rotated refresh token (D7) | ⬜ | `secretsRotation.270.phase5.integ.test.ts` |
| 6 | Import-then-discard + AI `getApiKey` via `resolveSecret` | ⬜ | `secretsImport.270.phase6.unit.test.ts` + `secretsImport.270.phase6.integ.test.ts` + `copilotRuntimeFactory` |
| 7 | `?page=secrets` UI | ⬜ | `secretsPage.270.phase7.integ.test.tsx` |
| 8 | Nonreg, docs, cleanup, AC | ⬜ | `unit-270-persistent-secrets` + `appstack-270-persistent-secrets` + docs |

---

## Locked implementation defaults

From the analysis decision record (binding; deviations go into the slice's Realization):

| Decision | Choice |
|---|---|
| D1 | New Admin entity `MiroirSecret` `a96856df-2b38-494a-8027-82617e2d64ad`; not `MiroirUserCredential`; no reports; no menu item |
| D2 | Process + per-user (`miroirUser` optional). `resolveSecret(name, principal?)` → `{ value, scope, miroirUserUuid?, source }`. User-scoped wins when principal present; else process. Hatch off → process only |
| D3 | AES-256-GCM; format `aes-256-gcm$<iv>$<ciphertext>$<tag>` (base64url); key = SHA-256(UTF-8 wrapping key). CLI `--secrets-master-key` > env `MIROIR_SECRETS_MASTER_KEY`. No ephemeral wrapping key. Not `MIROIR_AUTH_TOKEN_SECRET` |
| D4 | `--secret` / `MIROIR_SECRET_*` / `AI_*` key env = import set (process-scoped upsert, then discard). Steady-state launch = wrapping key only. `registerSecrets` remains an in-process **test** hatch |
| D5 | `handleSecretsHttpRoute`: GET/POST/DELETE `/secrets`. Process write = any authenticated user; user write = self only. Persist through `serverDomainController` + `actionLabel` `secrets.set` / `secrets.delete`. Generic CRUD rejected |
| D6 | `AI_OPENAI_KEY`→`aiOpenaiKey`, `AI_ANTHROPIC_KEY`→`aiAnthropicKey`, `AI_GOOGLE_KEY`→`aiGoogleKey`, `AI_GITHUB_TOKEN`→`aiGithubToken`. `getApiKey` → `resolveSecret`. Provider/model stay env |
| D7 | Inject `persistRotatedSecret` into `ExternalServiceClient` at startup; `SecretsService` holds wrapping key (module-level, like `processTokenSecret`) |
| D8 | Strip `ciphertext` on REST + MCP **responses**; no server-only entity flag |
| D9 | Do not split ExternalService |
| R1 | OAuth cache keys include `principal?.miroirUserUuid ?? "process"` |
| R5 | Principal threaded through composite boxed-query path (full hop list in Slice 4) |
| R6 | Orchestration lives in `miroir-core` `SecretsService`; `server.ts` is wiring |
| R9 | Only `POST /query` needs principal on the REST query path; `/queryTemplate` fails closed for `extractorFromAction` |

`source` on the resolve result: `"row"` (hydrated / imported ciphertext) or `"hatch"` (`registerSecrets`). Required by P6 so rotation persist does not fire for hatch-only secrets.

---

## Allocated UUIDs / keys

| Artefact | Value |
|---|---|
| `MiroirSecret` Entity | `a96856df-2b38-494a-8027-82617e2d64ad` |
| `ENTITY_MIROIR_SECRET_UUID` | same (constant next to `ENTITY_MIROIR_USER_CREDENTIAL_UUID`) |
| Test wrapping key | `test-secrets-master` (documented, like `alice-dev`) |
| `actionLabel` set | `secrets.set` |
| `actionLabel` delete | `secrets.delete` |
| Page | `?page=secrets` (query-param mode only; no path-segment route constant) |
| Admin application | `55af124e-8c05-4bae-a3ef-0933d41daa92` |
| Admin deployment | `18db21bf-f8d3-4f6a-8296-84b69f6dc48b` |
| Vitest prefix | `secrets.270` / `secretsHydrate.270` / `secretsHttp.270` / `secretsRedact.270` / `secretsPrincipal.270` / `secretsRotation.270` / `secretsImport.270` / `secretsPage.270` |
| Nonreg steps | `unit-270-persistent-secrets` (tier unit) · `appstack-270-persistent-secrets` (tier default) |

No production `MiroirSecret` seed rows in git. Test-written rows are torn down (P14).

---

## Test execution conventions

| Purpose | Command |
|---|---|
| Slice 0 unit (core) | `RUN_TEST=secrets.270.phase0 npm run testByFile -w miroir-core -- secrets.270.phase0` |
| Slice 1 unit | `RUN_TEST=secretsService.270.phase1 npm run testByFile -w miroir-core -- secretsService.270.phase1` |
| Slice 1 integ | `RUN_TEST=secretsHydrate.270 npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem secretsHydrate.270` |
| Admin modelValidation | `npm run testByFile -w miroir-test-app_deployment-admin -- tests/modelValidation.unit.test.ts` |
| Existing Spotify nonreg bundle | `npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem externalServiceQuery` |
| Type check | `npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json` (repeat for server, standalone-app, miroir-ai, miroir-mcp as touched) |
| Full safety net | `npm run nonreg` |

**Vitest justification (all issue files):** crypto, CLI, HTTP route policy, DomainController principal plumbing, MCP formatter, and UI dispatcher are not expressible as declarative MiroirTest JSON. Existing #267 Spotify integ is already vitest for the same reason (fake HTTP server).

**Hatch posture:** `testByFileLauncher.ts` forces `MIROIR_AUTH_ENABLED=0`. Keep that. `RestClientStub` still extracts a Bearer principal and puts it on `params.authPrincipal` regardless of the hatch (`RestClientStub.ts:93-101`, `:192`). Handler-level principal tests run hatch-off.

---

## Shared fixtures (named here, implemented when first needed)

### Emulated Admin persist (Slice 1+)

The emulated-filesystem profile’s Admin store reads `packages/miroir-standalone-app/tests/assets/admin_model` + `admin_data` (`miroirConfig.test-emulatedServer-filesystem.json`, deployment `18db21bf-…`). That model copy holds **5 of 9** entities today (Application, Deployment, StoreBasedConfiguration, ViewParams, Import — no User / Credential / Right / AiConfiguration / Secret).

`AppStackIntegrationTestSession` hardcodes `openAdminAndMiroirStoresOnServer: false` (`IntegrationTestSession.ts:190-193`). Slice 1 Test B must open Admin on the **server** DC:

- Either pass `openAdminAndMiroirStoresOnServer: true` through an option on `AppStackIntegrationTestSession` (preferred; keeps the #267 Library playfield + fake server),
- or call `runAppStackIntegrationBootstrap` directly with that flag + `miroirDeploymentStorageConfiguration`.

`domainControllerForServer` and `persistenceStoreControllerManager` are already on `MiroirTestExecutionEnvironment` (`appStackIntegrationBootstrap.ts:319-326`).

### Authenticated HTTP (Slice 2+, P4)

Do **not** rely on `setupMiroirTest` returning the in-stack stub (it does not today). Construct a **test-local** `RestClientStub`:

1. `new RestClientStub(rootApiUrl)`
2. `setServerDomainController(executionEnvironment.domainControllerForServer)`
3. `setPersistenceStoreControllerManager(executionEnvironment.persistenceStoreControllerManager)`
4. Load users + credentials from real `packages/miroir-test-app_deployment-admin/assets/admin_data` (same dirs as `access.262.phase3.unit.test.ts:28-54`); `setIdentityDirectory(identityDirectoryFromInstances(...))`
5. Mint tokens with `setProcessTokenSecret(TEST_SECRET)` + `loginWithPassword` (alice-dev / carol’s seeded password)
6. Call `stub.call("/secrets", "post", "/secrets", { body, headers: { Authorization: `Bearer ${token}` } })`

Pure principal-thread assertions (no HTTP) may call `queryActionHandler` / `serverDomainController.handleBoxedExtractorOrQueryAction` / `handleAction` directly with `params.authPrincipal` / the `principal` argument — real handler, real DC, no mock.

### Teardown (P14)

Every integ that writes `MiroirSecret` rows deletes them in `afterEach`/`afterAll` via the same write path the slice uses (unguarded `deleteInstance` in Slice 1; `actionLabel: "secrets.delete"` or `DELETE /secrets` from Slice 2 on). Do not leave `tests/assets/admin_data/a96856df-…/*.json` in the working tree.

---

## Slice 0 — Characterize current contracts

**Status:** ✅ DONE

### Goal

Lock today's SecretStore / CLI / principal-drop / OAuth cache keys / Admin inventory / MCP response non-redaction so later slices have a safety net. Assertions that later slices flip are tagged **consumed-by**; surviving assertions are tagged **survives**.

### 0.1 RED → GREEN — characterization

**Test:** `packages/miroir-core/tests/4_services/issues/270-persistent-named-secrets/secrets.270.phase0.unit.test.ts`

Not reachable as MiroirTest: no secrets ML concept yet (same as #71 phase0).

**Consumed-by Slice 1**
- Real Admin Entity folder (`packages/miroir-test-app_deployment-admin/assets/admin_model/16dbfe28-…/`) has **exactly 9** entities; no file named `MiroirSecret`; uuid `a96856df-…` is unused.
- Emulated test-asset copy (`packages/miroir-standalone-app/tests/assets/admin_model/16dbfe28-…/`) has **exactly 5** entities; no `MiroirSecret`.
- `parseServerArgs(["--secrets-master-key", "W"])` **throws** today (`parseServerArgs.ts:110-112`).
- `resolveSecret` is `(name: string) => string` (no principal, no scope object).
- `ParsedServerArgs` has no `secretsMasterKey` field.

**Consumed-by Slice 2**
- `restServerDefaultHandlers` has no `/secrets` url (`RestServer.ts:621-660`).

**Consumed-by Slice 3**
- `mcpHandlersForEndpoint` success branch `JSON.stringify(subObject)` is **not** wrapped in `redactCredentialSecretsFromValue` (`mcpHandlersForEndpoint.ts:286-295`). Same for the error `context` branch (`:299-317`).

**Consumed-by Slice 4**
- `oauth2AuthorizationCodeCacheKey` source contains only `tokenUrl`, `clientIdKey`, `refreshTokenKey` (no `miroirUser`) (`ExternalServiceClient.ts:386-389`).
- `queryActionHandler` source does not pass `authPrincipal` into `handleBoxedExtractorOrQueryAction` (`RestServer.ts:503-507`).
- `handleApplicationAction` signature has no `principal` parameter (`DomainController.ts:2989`).
- `handleAction` logs `principal` but does not forward it to `handleApplicationAction` or `handleActionInternal` (`:2918-2976`).

**Survives (do not flip)**
- Admin menu has **8** items; no Credentials; no Secrets.
- `parseServerArgs(["--secret", "a=b"])` returns `{ secrets: { a: "b" } }` (`ParsedServerArgs.secrets` remains the import set — P3).
- `/queryTemplate` store runners hard-error on `extractorFromAction`; that path stays principal-less (R9).

### Validation

```bash
RUN_TEST=secrets.270.phase0 npm run testByFile -w miroir-core -- secrets.270.phase0
```

### Realization

- **File:** `packages/miroir-core/tests/4_services/issues/270-persistent-named-secrets/secrets.270.phase0.unit.test.ts` (15 tests).
- **Locked (consumed-by):** Admin inventory (9 real / 5 emulated entities, no `MiroirSecret`, uuid `a96856df-…` unused); `parseServerArgs` rejects `--secrets-master-key`; `resolveSecret(name) → string`; no `secretsMasterKey` on `ParsedServerArgs`; no `/secrets` REST route; MCP success/error `JSON.stringify(subObject)` not redacted; OAuth cache key without `miroirUser`; `queryActionHandler` principal-less; `handleApplicationAction` / `handleAction` do not thread principal downstream.
- **Locked (survives):** Admin menu 8 items (no Credentials/Secrets labels); `parseServerArgs(["--secret","a=b"]).secrets === { a: "b" }`; `/queryTemplate` in default handlers.
- **Validation:** `RUN_TEST=secrets.270.phase0 npm run testByFile -w miroir-core -- secrets.270.phase0` — 15/15 passed.

---

## Slice 1 — Tracer: process-scoped persist + hydrate + fake Spotify query

**Status:** ✅ DONE

### Goal

As a test operator / application maintainer, I can store a process-scoped named secret as ciphertext on Admin `MiroirSecret`, decrypt it with wrapping key `test-secrets-master`, and have `extractorFromAction` succeed against the fake Spotify server **without** calling `registerSecrets` in the test body.

**Layers cut:** Admin Entity JSON (real package **and** emulated test-asset copy) → `SecretsService` (encrypt/decrypt/hydrate) → `SecretStore` process map → `parseServerArgs --secrets-master-key` → `ExternalServiceClient` reads `.value` → redaction of `ciphertext` → existing fake-Spotify query path.

### 1.1 RED

**Test A (unit, not MiroirTest — crypto/startup):** `packages/miroir-core/tests/4_services/issues/270-persistent-named-secrets/secretsService.270.phase1.unit.test.ts`

Behavior asserted:
- `encryptSecret("aes-256-gcm", wrappingKey, "plain")` returns `aes-256-gcm$…$…$…`; decrypt round-trips; wrong wrapping key fails closed (no plaintext leak in the error).
- `hydrateSecrets({ wrappingKey, rows })` registers process-scoped names with `source: "row"`; `resolveSecret("spotifyClientId")` returns `{ value, scope: "process", source: "row" }`.
- `registerSecrets({ n: "v" })` then `resolveSecret("n")` returns `{ value: "v", scope: "process", source: "hatch" }`.
- `parseServerArgs(["--secrets-master-key", "W"])` exposes `secretsMasterKey: "W"`; `parsed.secrets` is **unchanged** (still the `--secret` / `MIROIR_SECRET_*` map — P3). Env `MIROIR_SECRETS_MASTER_KEY` is the fallback; CLI wins.
- `redactCredentialSecretsFromValue` on a `MiroirSecret` instance **omits** `ciphertext`.
- Missing wrapping key + non-empty rows → hydrate throws without listing values.

**Test B (integ):** `packages/miroir-standalone-app/tests/3_controllers/issues/270-persistent-named-secrets/secretsHydrate.270.phase1.integ.test.ts`

Reuse the #267 fake server + filesystem emulated profile. **Persist/hydrate wiring (P2):**

1. Copy / add `MiroirSecret` entity JSON under `packages/miroir-standalone-app/tests/assets/admin_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/a96856df-2b38-494a-8027-82617e2d64ad.json` (same file as the real Admin package). miroir-core / miroir-mcp test-asset copies are **not** required for this slice (they do not resolve the entity).
2. Session: `AppStackIntegrationTestSession` with `openAdminAndMiroirStoresOnServer: true` (add the option; default stays `false` so #267 tests are untouched) and `miroirDeploymentStorageConfiguration` as the existing Spotify tests already pass via `adminDeployment`.
3. **Write:** `executionEnvironment.domainControllerForServer.handleAction({ actionType: "createInstance", payload: { application: 55af124e-…, applicationSection: "data", objects: [row] } })`. Ciphertext produced in the test with `encryptSecret(..., "test-secrets-master", ...)`. No `registerSecrets`. Unguarded `createInstance` is allowed **until Slice 2** (P7).
4. **Read:** server-DC boxed query `extractorInstancesByEntity` / equivalent, `queryExecutionStrategy: "storage"`, `parentUuid: a96856df-…`, Admin deployment.
5. **Hydrate:** `setSecretsMasterKey("test-secrets-master")` + `hydrateSecrets({ wrappingKey, rows })` from that read. Do not call `registerSecrets`.
6. **Teardown (P14):** `deleteInstance` the created row(s) in `afterEach`/`afterAll`.

Behavior asserted:
- Boxed `extractorFromAction` get-playlist against the fake server succeeds; `Authorization: Bearer <hydrated value>`.
- A control without hydrate / without wrapping key fails closed (`Unknown or empty secret`).

### 1.2 GREEN

- Add Admin Entity `MiroirSecret` (`a96856df-…`) under **real** `packages/miroir-test-app_deployment-admin/assets/admin_model/16dbfe28-…/` **and** the standalone-app emulated copy (P2). No EntityVersion file. No reports. No menu item.
- Export `entityMiroirSecret` from admin `index.ts` **and** `index.d.ts` (P13). Constant `ENTITY_MIROIR_SECRET_UUID` next to `ENTITY_MIROIR_USER_CREDENTIAL_UUID`.
- `SecretsService` in `packages/miroir-core/src/4_services/SecretsService.ts`: wrapping-key hold (`setSecretsMasterKey` / `getSecretsMasterKey` — no ephemeral default), `encryptSecret` / `decryptSecret`, `hydrateSecrets`. **Do not** wire `importProcessSecrets` into `server.ts` in this slice (P11). The function may exist as a unit-tested helper if Test A needs it; production import is Slice 6.
- Extend `SecretStore`: process map; `resolveSecret` return type `{ value, scope, miroirUserUuid?, source }` (user map empty until Slice 4). Keep `registerSecrets` as test hatch (`source: "hatch"`, process scope).
- Update `ExternalServiceClient` call sites to use `resolveSecret(...).value` so existing Spotify tests and Test B stay green after the return-type change. Do **not** thread `principal` yet (Slice 4).
- `parseServerArgs`: add `--secrets-master-key` / env `MIROIR_SECRETS_MASTER_KEY` → `secretsMasterKey?: string`. **Do not** rename or split `parsed.secrets` (P3).
- `server.ts` (P11 only): usage text mentions the wrapping-key flag; **hydrate-only** startup — if Admin secret rows exist and a wrapping key is set, hydrate; if rows exist and no key, fail closed (testable via the orchestrator unit test, not via a miroir-server suite). **Leave** `registerSecrets(parsed.secrets)` standing. **No** import upsert.
- Redaction: strip `ciphertext` when `parentUuid === ENTITY_MIROIR_SECRET_UUID` in `redactCredentialSecretsFromValue` (the live helper in `4_services/redactCredentialSecrets.ts` — do **not** extend the `AuthenticationPolicy.ts:445-463` copy).
- Export new symbols from miroir-core `index.ts`: `SecretsService` functions, `ENTITY_MIROIR_SECRET_UUID`, `ResolveSecretResult` (P13).
- Consume Slice 0 assertions listed under **Consumed-by Slice 1** (9→10 real entities; test-asset 5→6 including `a96856df-…`; `--secrets-master-key` parses; `resolveSecret` return shape).
- Admin `modelValidation` must pass (filesystem auto-includes the new entity).

### 1.3 Refactor checkpoint

- One `SecretsService` — `server.ts` stays wiring.
- Do not put encrypt/decrypt in `AuthenticationPolicy` (hash vs encrypt stay separate modules).
- Existing `serverSecrets.unit.test.ts` must still pass (additive parse: `parsed.secrets` unchanged; `--secrets-master-key` is now a known option).
- Do not add `MiroirSecret` to the miroir-core / miroir-mcp 5-entity copies unless a later slice’s suite actually resolves the entity against them (P9: MCP redaction does not).

### Validation

```bash
RUN_TEST=secrets.270.phase0 npm run testByFile -w miroir-core -- secrets.270.phase0
RUN_TEST=secretsService.270.phase1 npm run testByFile -w miroir-core -- secretsService.270.phase1
RUN_TEST=serverSecrets npm run testByFile -w miroir-core -- serverSecrets
npm run testByFile -w miroir-test-app_deployment-admin -- tests/modelValidation.unit.test.ts
RUN_TEST=secretsHydrate.270.phase1 npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem secretsHydrate.270.phase1
RUN_TEST=externalServiceQuery npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem externalServiceQuery
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-server/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-test-app_deployment-admin/tsconfig.json
```

Phase0 is re-run **after** its Consumed-by-Slice-1 assertions have been updated (P1).

### Realization

- **Tests:** `packages/miroir-core/tests/4_services/issues/270-persistent-named-secrets/secretsService.270.phase1.unit.test.ts` (7 tests); `packages/miroir-standalone-app/tests/3_controllers/issues/270-persistent-named-secrets/secretsHydrate.270.phase1.integ.test.ts` (2 tests). Phase0 Consumed-by Slice 1 assertions updated in place (P1): 10 real / 6 emulated entities including `a96856df-…` named MiroirSecret; `--secrets-master-key` parses; `resolveSecret` returns `{ value, scope, source }`; `secretsMasterKey` is present when flag/env is set.
- **Entity:** present-model only `MiroirSecret` at real Admin `admin_model/16dbfe28-…/a96856df-….json` and the standalone-app emulated copy. Exported as `entityMiroirSecret` from admin `index.ts` + `index.d.ts`. No EntityVersion, no reports, no menu item. `ENTITY_MIROIR_SECRET_UUID` lives next to `ENTITY_MIROIR_USER_CREDENTIAL_UUID` in `AuthenticationPolicy.ts`.
- **Persist/hydrate wiring that worked:** `AppStackIntegrationTestSession` with `openAdminAndMiroirStoresOnServer: true` and `miroirDeploymentStorageConfiguration` from `miroirConfig` (same pattern as Admin). Write = server-DC `createInstance` on Admin application `55af124e-…`, section `data`, INSTANCE_ENDPOINT. Read = server-DC boxed `extractorInstancesByEntity` / `queryExecutionStrategy: "storage"` / `parentUuid` MiroirSecret. Then `setSecretsMasterKey("test-secrets-master")` + `hydrateSecrets({ wrappingKey, rows })`. Playlist query uses client DC `extractorFromAction`; `Authorization: Bearer hydrated-from-row`. Teardown = server-DC `deleteInstance` in `afterEach`/`afterAll` (no leftover `*.json`).
- **Filesystem data-section inventory:** copying the entity into `admin_model` is not enough for `upsertInstance` on `data`. Filesystem `getEntityUuids()` is `readdir` of `admin_data`. Empty collection dirs with `.gitkeep` (no instance rows) were added under real and emulated `admin_data/a96856df-…/`.
- **Core:** `SecretsService` (`set`/`get`/`clearSecretsMasterKey`, `encryptSecret`/`decryptSecret`, `hydrateSecrets`); `SecretStore` `resolveSecret` → `{ value, scope, source }` (`registerSecrets` stays hatch); `parseServerArgs.secrets` unchanged (P3) + `secretsMasterKey?: string`; live redactor strips `ciphertext` when `parentUuid === ENTITY_MIROIR_SECRET_UUID`; `ExternalServiceClient` uses `.value` (no principal yet). `server.ts`: usage + wrapping-key presence log + hydrate-only after first open-store loop; `registerSecrets(parsed.secrets)` left standing; no import upsert (P11). Rows + no key → throw; no rows + no key → continue.
- **Validation:**
  - `RUN_TEST=secrets.270.phase0 … secrets.270.phase0` — 15/15 passed
  - `RUN_TEST=secretsService.270.phase1 … secretsService.270.phase1` — 7/7 passed
  - `RUN_TEST=serverSecrets … serverSecrets` — 8/8 passed
  - `npm run testByFile -w miroir-test-app_deployment-admin -- modelValidation.unit.test.ts` — 48/48 passed (vitest root is `tests/`, so the `tests/` prefix filter finds no files)
  - `RUN_TEST=secretsHydrate.270.phase1 … --profile emulatedServer-filesystem secretsHydrate.270.phase1` — 2/2 passed
  - `RUN_TEST=externalServiceQuery … --profile emulatedServer-filesystem externalServiceQuery` — 13/13 passed
  - `tsc --noEmit --skipLibCheck` for miroir-core, miroir-server, miroir-test-app_deployment-admin — passed
- **Deviations:** empty `.gitkeep` collection dirs (not instance fixtures); `node:crypto` added to miroir-core `tsup` externals so AES-256-GCM stays on Node crypto.

---

## Slice 2 — Dedicated `/secrets` HTTP + CRUD guard

**Status:** ⬜ pending

### Goal

As a signed-in platform user, I can set a process-scoped secret via `POST /secrets` and list **names only** via `GET /secrets`. Generic instance CRUD on `MiroirSecret` is rejected. The emulated server persists through `serverDomainController`.

**Layers cut:** `handleSecretsHttpRoute` (`4_services/SecretsHttp.ts`) → mutation guard → `SecretsService` encrypt + `createInstance`/`updateInstance`/`deleteInstance` with `actionLabel` → `RestClientStub` + Express wiring → redacted GET.

### Test fixture contract (P4; reused by Slices 4 and 7)

See **Authenticated HTTP** above. Hatch off. Tokens minted per `access.262.phase3`. Test-local stub, not an extension of `setupMiroirTest` unless a later Realization records that as a deepening.

### 2.1 RED

**Test (route policy, unit):** `packages/miroir-core/tests/4_services/issues/270-persistent-named-secrets/secretsHttp.270.phase2.unit.test.ts`

Drive `handleSecretsHttpRoute` with a real `serverDomainController` from a tiny in-process setup **or** assert the policy function in isolation only where it does not need a store (unauthenticated / self-only rejections). Prefer the integ file below for persist proofs.

**Test (integ):** `packages/miroir-standalone-app/tests/3_controllers/issues/270-persistent-named-secrets/secretsHttp.270.phase2.integ.test.ts`

Reuse Slice 1’s Admin-open session + wrapping key. Authenticate as Alice via the fixture contract.

Behavior asserted:
- `POST /secrets` `{ name, value, scope: "process" }` with Alice's Bearer → `{ set: true }`; a subsequent storage-strategy read + hydrate / `resolveSecret("name")` returns the value (`source: "row"`).
- `GET /secrets` returns `{ secrets: [{ name, scope: "process" }] }` and **no** `value` / `ciphertext`.
- Generic `createInstance` / `updateInstance` / `deleteInstance` / `deleteInstanceWithCascade` on `parentUuid === ENTITY_MIROIR_SECRET_UUID` without `actionLabel` `secrets.set` / `secrets.delete` is rejected (P15).
- `DELETE /secrets` `{ name, scope: "process" }` removes the row; resolve fails closed.
- Hatch off: process-scope POST still works in-process (Bearer still binds principal). User-scope POST without a matching principal is rejected (Slice 4 owns user-scope success).

### 2.2 GREEN

- `handleSecretsHttpRoute` in `packages/miroir-core/src/4_services/SecretsHttp.ts` (P10 — 4_services, not 1_core; takes `serverDomainController` as `DomainControllerInterface`). Wire into `server.ts` **and** `RestClientStub.call` **after** the auth gate + manager-undefined checks (`RestClientStub.ts:137-143`) and **before** `restServerDefaultHandlers.find` (`:165-170`), so `principal` and `this.serverDomainController` are in scope.
- Persist via `serverDomainController.handleAction(createInstance|updateInstance|deleteInstance)` with `actionLabel` `secrets.set` / `secrets.delete`. Do **not** copy change-password’s in-memory-only stub persist.
- `assertSecretInstanceMutationAllowed` (sibling of credential guard) in `handleInstanceAction` (`DomainController.ts:1065`) + CRUD REST handler (`RestServer.ts:276-287`). Record transactional/commit-replay bypass as a one-line comment (analysis R11).
- **Migrate Slice 1 Test B** setup/teardown from unguarded `createInstance`/`deleteInstance` to `actionLabel: "secrets.set"` / `"secrets.delete"` (or `POST`/`DELETE /secrets`) so the tracer stays green (P7). Startup hydrate-only path does not write; when Slice 6 adds import upsert it **must** carry `secrets.set`.
- Consume Slice 0 **Consumed-by Slice 2** (`/secrets` route now exists).

### 2.3 Refactor checkpoint

- Do **not** copy change-password's in-memory-only stub persist.
- One guard function shared by REST CRUD and `handleAction`.
- 1_core still does not import `SecretsService`.

### Validation

```bash
RUN_TEST=secretsHttp.270 npm run testByFile -w miroir-core -- secretsHttp.270
RUN_TEST=secretsHttp.270 npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem secretsHttp.270
RUN_TEST=secretsHydrate.270 npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem secretsHydrate.270
RUN_TEST=authentication.71 npm run testByFile -w miroir-core -- authentication.71
RUN_TEST=secrets.270.phase0 npm run testByFile -w miroir-core -- secrets.270.phase0
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
```

`secretsHydrate.270` is mandatory here (P7): the guard must not silently break the tracer.

### Realization

<Appended on completion.>

---

## Slice 3 — MCP tool response redaction

**Status:** ⬜ pending

### Goal

As a platform user (or MCP client), I never see `passwordHash` or `ciphertext` in an MCP tool **response** — the leak that exists today for `passwordHash` (Admin is always-allow) and the leak Slice 1 would otherwise open for `ciphertext`.

This is a pre-existing credential leak; it does not wait for the UI slice (P8). It needs no new entity beyond Slice 1’s redactor extension.

**Layers cut:** `mcpHandlersForEndpoint.ts` success + error branches → existing `redactCredentialSecretsFromValue`.

### 3.1 RED

**Test:** `packages/miroir-mcp/tests/unit/issues/270-persistent-named-secrets/secretsRedact.270.phase3.unit.test.ts` (P9)

Drive `handleMcpAction` with a fake payload — **no store**, so miroir-mcp’s 5-entity admin copy does not block it.

Behavior asserted:
- A fake MCP success payload containing a credential `passwordHash` and a `MiroirSecret` `ciphertext` is redacted in **both** `text` and `parsed` of the tool response (not only logs).
- Error `context` is redacted too.

A redactor-only unit assertion for `ciphertext` already belongs in Slice 1’s `secretsService.270.phase1.unit.test.ts`, not here.

### 3.2 GREEN

- Wrap MCP success/error `subObject` with `redactCredentialSecretsFromValue` before `JSON.stringify` (`mcpHandlersForEndpoint.ts:286-317`).
- Consume Slice 0 **Consumed-by Slice 3**.

### 3.3 Refactor checkpoint

- One call site wrap; do not fork a second redactor.
- Analysis R4 closed for MCP **responses**.

### Validation

```bash
RUN_TEST=secretsRedact.270 npm run testByFile -w miroir-mcp -- secretsRedact.270
RUN_TEST=secrets.270.phase0 npm run testByFile -w miroir-core -- secrets.270.phase0
npx tsc --noEmit --skipLibCheck -p packages/miroir-mcp/tsconfig.json
```

### Realization

<Appended on completion.>

---

## Slice 4 — Per-user secrets + principal thread + principal-scoped OAuth cache

**Status:** ⬜ pending

### Goal

As Alice, I can store my own `spotifyRefreshToken`; Carol does not receive Alice's access token from a warm OAuth cache. Composite boxed queries and `POST /query` both see the principal.

**Layers cut:** `SecretStore` user map → full principal hop list below → `executeExternalServiceOperation` → principal-scoped `oauth2TokenCache` / `rotatedRefreshTokens`.

### 4.1 RED

**Test:** `packages/miroir-standalone-app/tests/3_controllers/issues/270-persistent-named-secrets/secretsPrincipal.270.phase4.integ.test.ts`

Auth: Slice 2 fixture contract (Alice **and** Carol tokens). Hatch off.

Behavior asserted:
- Alice `POST /secrets` `{ name: "fakeRefresh", value: "alice-rt", scope: "user" }` stores `miroirUser = Alice`. Carol cannot GET that name in her list (only process + own user rows). Carol cannot POST overwrite Alice's user row.
- Two principals, same endpoint names, distinct refresh tokens: after Alice's call warms the cache, Carol's call hits the fake token URL with **Carol's** refresh token (or her cached access token), never Alice's. Access-token cache keys differ by `miroirUserUuid`.
- `POST /query` with Alice's Bearer: `resolveSecret("fakeRefresh", alice)` returns `{ scope: "user", miroirUserUuid: alice, source: "row" }`.
- Hatch off / no principal: only process-scoped rows resolve (existing `externalServiceQuery` still green via `registerSecrets` hatch **or** process hydrate).
- A composite boxed query that includes `extractorFromAction` receives the same principal as the outer `handleAction` (no silent process fallback when a user row exists). This is the catch for a missed `handleActionInternal` hop (P5).

### 4.2 GREEN

Thread `principal?: AuthPrincipal` through the **full** hop list (P5):

`handleAction`
→ (`handleApplicationAction` **and** `handleActionInternal`)
→ `handleCompositeAction` / `handleCompositeActionTemplate` / `handleCompositeRunBoxedQueryAction` / `handleCompositeRunBoxedQueryTemplateAction`
→ `executeCompositeRunBoxedQueryAction`
→ `handleBoxedExtractorOrQueryAction` (`DomainController.ts:823`) / `executeBoxedExtractorOrQueryAction` (`:846`) / `resolveExtractorFromActionInBoxedQuery` (`:3221`)
→ `executeExternalServiceOperation` (`:3037`, `:3260`)

Also: `queryActionHandler` passes `params.authPrincipal`. `/queryTemplate` unchanged (fails closed for external extractors — R9). Do **not** thread principal into `/queryTemplate`.

- `SecretStore` user map keyed `userUuid:name`. `resolveSecret` implements D2 order. `redactRegisteredSecretValuesInString` walks both maps.
- `oauth2AuthorizationCodeCacheKey` / client-credentials cache key append `principal?.miroirUserUuid ?? "process"`. 401 retry uses the same principal.
- Consume Slice 0 **Consumed-by Slice 4**.

### 4.3 Refactor checkpoint

- One cache-key helper; no duplicated Alice/Carol branching in fetch.
- Analysis §3.5 / R1 / R5 closed.

### Validation

```bash
RUN_TEST=secretsPrincipal.270 npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem secretsPrincipal.270
RUN_TEST=externalServiceQuery npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem externalServiceQuery
RUN_TEST=externalServiceDispatch npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem externalServiceDispatch
RUN_TEST=secrets.270.phase0 npm run testByFile -w miroir-core -- secrets.270.phase0
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
```

### Realization

<Appended on completion.>

---

## Slice 5 — Persist rotated refresh token

**Status:** ⬜ pending

### Goal

When the fake token endpoint returns a new `refresh_token`, the matching **row-backed** `MiroirSecret` is re-encrypted and a subsequent hydrate (or process restart simulation: `clearSecrets` + hydrate) still resolves the **new** value. Hatch-only rotation stays RAM-only.

**Layers cut:** optional `persistRotatedSecret` callback on `ExternalServiceClient` (wired at startup / in these tests) → `SecretsService` (held wrapping key) → Admin instance update with `secrets.set`.

### 5.1 RED

**Test:** `packages/miroir-standalone-app/tests/3_controllers/issues/270-persistent-named-secrets/secretsRotation.270.phase5.integ.test.ts`

Behavior asserted (P17 — two scopes, not a hedge):
- Fake token URL returns `{ access_token, refresh_token: "rotated-rt", expires_in }`.
- Rotation of a **process-backed** token re-encrypts the **process** row (not a user row); `clearSecrets` + hydrate → `resolveSecret` returns `rotated-rt` with `scope: "process"`.
- Rotation of **Alice’s user-backed** token re-encrypts **Alice’s** row and does **not** change the process row; hydrate as Alice returns `rotated-rt`.
- Fail-closed is reachable **synthetically**: callback wired + row-backed secret + wrapping key cleared mid-run → persist throws / fails closed; RAM is not treated as durable (P6). This is not the no-key-at-startup case (already D3 / Slice 1).
- Never log the new refresh token (assert log spies / redaction on any dumped result).

Existing `externalServiceQuery` hatch rotation test (`:785-824`) stays green because those tests **never register** the persist callback (P6).

### 5.2 GREEN

- `setPersistRotatedSecret(callback)` — optional, wiring-level. Called from `server.ts` startup and from this slice’s tests. **Not** a constructor-style register on `SecretsService` (P6 — drop that hedge).
- Persist fires only when `resolveSecret` returns `source: "row"`. Hatch-registered secrets update RAM + `rotatedRefreshTokens` only.
- The callback is a closure over `serverDomainController` (actionLabel `secrets.set`). `SecretsService` and `ExternalServiceClient` stay free of `3_controllers` imports (R2).
- On rotation, callback uses the winning scope from `resolveSecret` (process vs Alice).
- Update in-memory maps + principal-scoped `rotatedRefreshTokens`.
- Fail-closed = callback wired + row-backed + `getSecretsMasterKey()` unset.

### 5.3 Refactor checkpoint

- No `DomainController` import from `ExternalServiceClient`.
- Analysis D7 / R2 closed.
- `externalServiceQuery` hatch rotation still passes.

### Validation

```bash
RUN_TEST=secretsRotation.270 npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem secretsRotation.270
RUN_TEST=externalServiceQuery npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem externalServiceQuery
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
```

### Realization

<Appended on completion.>

---

## Slice 6 — Import-then-discard + AI keys via `resolveSecret`

**Status:** ⬜ pending

### Goal

As an operator, I can pass `--secret` / `AI_GITHUB_TOKEN` **once** with the wrapping key and have them persisted; later resolve does not depend on those env vars. A launch with an import set and **no** wrapping key fails. `getApiKey` reads the named secret.

**This is the breaking change** (R7). Slice 1 deliberately left `registerSecrets(parsed.secrets)` standing.

**Layers cut:** `parseServerArgs` import-set assembly (D6 aliases) → `SecretsService.importProcessSecrets` → `server.ts` wiring (stop `registerSecrets(parsed.secrets)` as standing source of truth) → emulated Admin upsert with `secrets.set` → `copilotRuntimeFactory.getApiKey`.

### 6.1 RED

**Test (unit):** `packages/miroir-core/tests/4_services/issues/270-persistent-named-secrets/secretsImport.270.phase6.unit.test.ts`

Behavior asserted:
- Import set assembled from `--secret`, `MIROIR_SECRET_*`, and the four `AI_*` key env vars (mapped names). `AI_PROVIDER_TYPE` / `AI_MODEL` are **not** in the import set.
- Import + wrapping key → process-scoped instances (ciphertext); subsequent in-memory hydrate + `resolveSecret("aiGithubToken")` works after env is cleared.
- Import set non-empty + no wrapping key → throw (usage mentions wrapping key).
- Rows exist + no wrapping key → hydrate throw.
- No rows + no wrapping key + empty import set → empty store (resolve fails closed); server can still start.
- `getApiKey("github")` uses `resolveSecret("aiGithubToken")`; error text is “missing secret `aiGithubToken`”, not “Missing environment variable AI_GITHUB_TOKEN”.
- Existing `copilotRuntimeFactory.unit.test.ts` updated to register the named secret (or import) instead of only `vi.stubEnv("AI_OPENAI_KEY")` for the adapter-construction cases.

**Test (integ, P18):** `packages/miroir-standalone-app/tests/3_controllers/issues/270-persistent-named-secrets/secretsImport.270.phase6.integ.test.ts`

Run the orchestrator’s import against the emulated Admin store via `domainControllerForServer` with `actionLabel: "secrets.set"`, then `clearSecrets` + hydrate-from-store and `resolveSecret`. This is the persist leg `server.ts` itself cannot host (no miroir-server suite).

### 6.2 GREEN

- Flip production wiring: `registerSecrets(parsed.secrets)` is **not** the runtime source; import then hydrate. Import upsert carries `actionLabel: "secrets.set"` (P7).
- Keep `registerSecrets` exported for tests (`LIVE_SPOTIFY_*` stays a hatch — not a D6 alias).
- Update `server.ts` help text.
- Migrate `serverSecrets.unit.test.ts` expectations that implied CLI → standing `registerSecrets` to import-set shape + (where they tested runtime resolve) import+hydrate.

### 6.3 Refactor checkpoint

- One import-set assembler (D6 aliases in one table).
- Analysis R7 breaking change lands here.

### Validation

```bash
RUN_TEST=secretsImport.270 npm run testByFile -w miroir-core -- secretsImport.270
RUN_TEST=secretsImport.270 npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem secretsImport.270
RUN_TEST=serverSecrets npm run testByFile -w miroir-core -- serverSecrets
npm run testByFile -w miroir-ai -- copilotRuntimeFactory
RUN_TEST=externalServiceQuery npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem externalServiceQuery
RUN_TEST=secretsHydrate.270 npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem secretsHydrate.270
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-ai/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-server/tsconfig.json
```

### Realization

<Appended on completion.>

---

## Slice 7 — `?page=secrets` UI

**Status:** ⬜ pending

### Goal

As a signed-in platform user, I can set a process secret from `?page=secrets` the way I change a password from `?page=login`.

**Layers cut:** `PageDispatcher` query-param switch → secrets form → `POST /secrets` (Slice 2 transport).

Auth gate comes **free**: `PageDispatcher` routes every `page !== "login"` through `nextPageWhenAuthGate` (`PageDispatcher.tsx:145-153`). Only the query-param switch (`:168-204`) needs a `case "secrets"`. Legacy path-segment mode (`:212+`) stays closed (same posture as #267 P17).

### 7.1 RED

**Test:** `packages/miroir-standalone-app/tests/4_views/issues/270-persistent-named-secrets/secretsPage.270.phase7.integ.test.tsx` (P16)

Vehicle = emulated-stack integ (precedent: `externalServiceReport.integ.test.tsx`). Not a happy-dom component test with a stubbed fetch (that would be a mock).

Auth: Slice 2 fixture contract (token in the same way the login page leaves one).

Behavior asserted:
- When a token exists, `?page=secrets` renders name + value + scope controls; submit calls `POST /secrets`; success does not display the value.
- Generic Admin entity list does not gain a Secrets menu item (Slice 0 surviving inventory still 8 items, plus no new Secrets label).

### 7.2 GREEN

- Secrets page + `PageDispatcher` `case "secrets"` (query-param mode only).
- `AiConfiguration` description sentence updated if the entity file is already being touched; otherwise docs-only in Slice 8.

### 7.3 Refactor checkpoint

- No new Admin menu item.
- No path-segment route constant.

### Validation

```bash
RUN_TEST=secretsPage.270 npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem secretsPage.270
RUN_TEST=authentication.71 npm run testByFile -w miroir-core -- authentication.71
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
```

### Realization

<Appended on completion.>

---

## Slice 8 — Nonreg, docs, cleanup, AC

**Status:** ⬜ pending

### 8.1 Nonreg (P12)

Two steps in `scripts/nonreg-manifest.json`:

- `unit-270-persistent-secrets` — tier `unit` — `testByFile -w miroir-core -- secrets.270` (phase0 + core unit files) and `testByFile -w miroir-mcp -- secretsRedact.270`.
- `appstack-270-persistent-secrets` — tier `default` — `testByFile -w miroir-standalone-app -- --profile {profile}` for `secretsHydrate.270`, `secretsHttp.270`, `secretsPrincipal.270`, `secretsRotation.270`, `secretsImport.270`, `secretsPage.270`.

Existing `externalServices-spotify` step must stay green (hatch `registerSecrets` and/or process hydrate).

### 8.2 Docs

- `analysis.md` status → implemented (after this slice).
- `docs/reference/data-architecture-deployments.md` (~215): wrapping key + import-once; names only on endpoints.
- `docs/reference/authentication.md`: second standing secret (`MIROIR_SECRETS_MASTER_KEY`); `/secrets` routes.
- `docs/guides/build-it-yourself.md` + Docker compose/Dockerfile: document `MIROIR_SECRETS_MASTER_KEY` (R7).
- `docs/reference/testing.md`: issue-suite keys; `LIVE_SPOTIFY_*` remains a test hatch.

### 8.3 Issue-directory cleanup

- After the feature is green, migrate still-valuable assertions from `tests/**/issues/270-persistent-named-secrets/` into feature-named suites (`secretsService`, `secretsHttp`, …) and delete the issue directory per `docs/contributing/testing.md` (#238). If cleanup is deferred to immediately after nonreg in this same slice, do it here; otherwise record the leftover path in Realization.
- Confirm no leftover `packages/miroir-standalone-app/tests/assets/admin_data/a96856df-…/` ciphertext rows in git (P14).

### 8.4 Tracer bullet (narrative)

1. Launch: `MIROIR_SECRETS_MASTER_KEY=<W> node packages/miroir-server/release/index.js --secret spotifyClientId=<id> --secret spotifyClientSecret=<s> --secret spotifyRefreshToken=<r>` (first time only).
2. Later launches: wrapping key only.
3. Open `?page=secrets`, set a user-scoped refresh token while logged in as Alice.
4. Open the Spotify playlist report; Alice's token is used; Carol does not see Alice's cached access token.

Automated equivalent: Slice 1 hydrate integ + Slice 4 principal integ + Slice 6 import unit/integ.

### AC checklist (#270)

| Criterion | Proven by | Status |
|---|---|---|
| Persist process-scoped secret; later launch needs only wrapping key | Slice 1 + Slice 6 | ⬜ |
| Persist user-scoped secret; extractor/OAuth uses that principal | Slice 4 | ⬜ |
| Values never in REST/MCP/generic editor; generic CRUD rejected | Slice 2 + Slice 3 | ⬜ |
| `--secret` / `MIROIR_SECRET_*` bootstrap only | Slice 6 | ⬜ |
| Rotated refresh token persisted | Slice 5 | ⬜ |
| AI keys from named-secret store | Slice 6 | ⬜ |
| Login passwords unchanged | `authentication.71` in Slice 2 validation | ⬜ |
| Existing Spotify tests keep working | `externalServiceQuery` in Slices 1, 4, 5, 6 | ⬜ |
| Secrets form at `?page=secrets` | Slice 7 | ⬜ |

### Validation

```bash
npm run nonreg
```

Plus per-package `tsc --noEmit --skipLibCheck` for every package this branch touched.

### Realization

<Appended on completion.>
