# Issue #270 — TDD Implementation Plan

> Vertical TDD slices (RED → GREEN each), integration-first per `docs/contributing/testing.md`:
> tests exercise the real DomainController / local cache / emulated server (`RestClientStub`,
> `persistenceStoreAccessMode === "local"`) and the existing fake Spotify HTTP server.
> No mocks. Crypto, CLI parse, and startup orchestration are vitest in `miroir-core` because
> `miroir-server` has no test suite (same exception as #267 `parseServerArgs` / `SecretStore`).
> Tracer (Slice 1): a process-scoped secret stored as ciphertext on Admin `MiroirSecret` is
> decrypted with the wrapping key and used by `extractorFromAction` against the fake Spotify
> server — **without** `registerSecrets` in the test body.
>
> **Execution model:** human-in-the-loop. No slice contains a commit step — commits happen
> only when the user explicitly asks. Each slice ends with its Validation commands; on
> success its Realization summary is appended and its Status flips to ✅ DONE.

Analysis: [`./analysis.md`](./analysis.md) · Analysis review: [`./adversarial-review.md`](./adversarial-review.md) · Issue: https://github.com/miroir-framework/miroir/issues/270
Prerequisite: [#267](https://github.com/miroir-framework/miroir/issues/267) ✅ · [#71](https://github.com/miroir-framework/miroir/issues/71) ✅
Working branch: `270-FEATURE-persistent-named-secrets`

**Resume note:** Plan written after analysis adversarial review (R1–R11 applied). Slices pending.

---

## Scope

- Admin Entity `MiroirSecret` (`a96856df-…`): process-scoped and per-user encrypted rows.
- `SecretsService` in `miroir-core` 4_services: wrapping key, encrypt/decrypt, import, hydrate, persist rotation.
- `SecretStore` dual map + `resolveSecret(name, principal?)` → `{ value, scope, miroirUserUuid? }`.
- `--secrets-master-key` / `MIROIR_SECRETS_MASTER_KEY`; `--secret` / `MIROIR_SECRET_*` / `AI_*` **key** env = bootstrap import only.
- Dedicated `/secrets` via `handleSecretsHttpRoute` (Express **and** `RestClientStub`, persist through `serverDomainController`).
- Principal threaded through action + query + composite paths; OAuth caches principal-scoped.
- MCP tool **response** redaction; generic CRUD rejected; `?page=secrets` form.
- AI `getApiKey` → `resolveSecret`.

This plan does **not** cover: OAuth PKCE in the UI; `MiroirRight.capability` as writer gate (#219 C2); MCP wrapping-key hydrate / identity (#263); Deployment store passwords; OS keychain / wrapping-key rotation; splitting `ExternalService` out of `Endpoint`; a platform `server-only` entity flag.

---

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Characterize SecretStore / CLI / principal-drop / caches / Admin inventory | ⬜ | `secrets.270.phase0.unit.test.ts` |
| 1 | **Tracer:** process-scoped persist + hydrate + fake Spotify query | ⬜ | `secretsHydrate.270.phase1.integ.test.ts` + `secretsService.270.phase1.unit.test.ts` |
| 2 | Dedicated `/secrets` HTTP + CRUD guard (in-process persist) | ⬜ | `secretsHttp.270.phase2.integ.test.ts` |
| 3 | Per-user secrets + principal thread + principal-scoped OAuth cache | ⬜ | `secretsPrincipal.270.phase3.integ.test.ts` |
| 4 | Persist rotated refresh token (D7) | ⬜ | `secretsRotation.270.phase4.integ.test.ts` |
| 5 | Import-then-discard + AI `getApiKey` via `resolveSecret` | ⬜ | `secretsImport.270.phase5.unit.test.ts` + `copilotRuntimeFactory` unit |
| 6 | MCP response redaction + `?page=secrets` UI | ⬜ | `secretsRedact.270.phase6.unit.test.ts` + secrets page integ |
| 7 | Nonreg, docs, cleanup, AC | ⬜ | nonreg step `unit-270-persistent-secrets` + docs |

---

## Locked implementation defaults

From the analysis decision record (binding; deviations go into the slice's Realization):

| Decision | Choice |
|---|---|
| D1 | New Admin entity `MiroirSecret` `a96856df-2b38-494a-8027-82617e2d64ad`; not `MiroirUserCredential`; no reports; no menu item |
| D2 | Process + per-user (`miroirUser` optional). `resolveSecret(name, principal?)` → `{ value, scope, miroirUserUuid? }`. User-scoped wins when principal present; else process. Hatch off → process only |
| D3 | AES-256-GCM; format `aes-256-gcm$<iv>$<ciphertext>$<tag>` (base64url); key = SHA-256(UTF-8 wrapping key). CLI `--secrets-master-key` > env `MIROIR_SECRETS_MASTER_KEY`. No ephemeral wrapping key. Not `MIROIR_AUTH_TOKEN_SECRET` |
| D4 | `--secret` / `MIROIR_SECRET_*` / `AI_*` key env = import set (process-scoped upsert, then discard). Steady-state launch = wrapping key only. `registerSecrets` remains an in-process **test** hatch |
| D5 | `handleSecretsHttpRoute`: GET/POST/DELETE `/secrets`. Process write = any authenticated user; user write = self only. Persist through `serverDomainController` + `actionLabel` `secrets.set` / `secrets.delete`. Generic CRUD rejected |
| D6 | `AI_OPENAI_KEY`→`aiOpenaiKey`, `AI_ANTHROPIC_KEY`→`aiAnthropicKey`, `AI_GOOGLE_KEY`→`aiGoogleKey`, `AI_GITHUB_TOKEN`→`aiGithubToken`. `getApiKey` → `resolveSecret`. Provider/model stay env |
| D7 | Inject `persistRotatedSecret` into `ExternalServiceClient` at startup; `SecretsService` holds wrapping key (module-level, like `processTokenSecret`) |
| D8 | Strip `ciphertext` on REST + MCP **responses**; no server-only entity flag |
| D9 | Do not split ExternalService |
| R1 | OAuth cache keys include `principal?.miroirUserUuid ?? "process"` |
| R5 | Principal threaded through composite boxed-query path |
| R6 | Orchestration lives in `miroir-core` `SecretsService`; `server.ts` is wiring |
| R9 | Only `POST /query` needs principal on the REST query path; `/queryTemplate` fails closed for `extractorFromAction` |

---

## Allocated UUIDs / keys

| Artefact | Value |
|---|---|
| `MiroirSecret` Entity | `a96856df-2b38-494a-8027-82617e2d64ad` |
| `ENTITY_MIROIR_SECRET_UUID` | same (constant next to `ENTITY_MIROIR_USER_CREDENTIAL_UUID`) |
| Test wrapping key | `test-secrets-master` (documented, like `alice-dev`) |
| `actionLabel` set | `secrets.set` |
| `actionLabel` delete | `secrets.delete` |
| Page | `?page=secrets` |
| Vitest prefix | `secrets.270` / `secretsHydrate.270` / `secretsHttp.270` / `secretsPrincipal.270` / `secretsRotation.270` / `secretsImport.270` / `secretsRedact.270` |
| Nonreg step | `unit-270-persistent-secrets` |

No production `MiroirSecret` seed rows in git.

---

## Test execution conventions

| Purpose | Command |
|---|---|
| Slice 0–1 unit (core) | `RUN_TEST=secrets.270 npm run testByFile -w miroir-core -- secrets.270` |
| Slice 1 integ | `RUN_TEST=secretsHydrate.270 npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem secretsHydrate.270` |
| Admin modelValidation | `npm run testByFile -w miroir-test-app_deployment-admin -- tests/modelValidation.unit.test.ts` |
| Existing Spotify nonreg bundle | `npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem externalServiceQuery` |
| Type check | `npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json` (repeat for server, standalone-app, miroir-ai, miroir-mcp as touched) |
| Full safety net | `npm run nonreg` |

**Vitest justification (all issue files):** crypto, CLI, HTTP route policy, and DomainController principal plumbing are not expressible as declarative MiroirTest JSON. Existing #267 Spotify integ is already vitest for the same reason (fake HTTP server).

---

## Slice 0 — Characterize current contracts

**Status:** ⬜ pending

### Goal

Lock today's SecretStore / CLI / principal-drop / OAuth cache keys / Admin inventory / MCP response non-redaction so later slices have a safety net.

### 0.1 RED → GREEN — characterization

**Test:** `packages/miroir-core/tests/4_services/issues/270-persistent-named-secrets/secrets.270.phase0.unit.test.ts`

Not reachable as MiroirTest: no secrets ML concept yet (same as #71 phase0).

Behavior asserted (current, not target):
- Admin Entity folder has **exactly 9** entities; no file named `MiroirSecret`; uuid `a96856df-…` is unused.
- Admin menu has **8** items; no Credentials; no Secrets.
- `parseServerArgs(["--secret", "a=b"])` returns `{ a: "b" }`; unknown `--secrets-master-key` **throws** today.
- `resolveSecret` is `(name: string) => string` (no principal, no scope object).
- `oauth2AuthorizationCodeCacheKey` source contains only `tokenUrl`, `clientIdKey`, `refreshTokenKey` (no `miroirUser`).
- `queryActionHandler` source does not pass `authPrincipal` into `handleBoxedExtractorOrQueryAction`.
- `handleApplicationAction` signature has no `principal` parameter.
- `mcpHandlersForEndpoint` success branch `JSON.stringify(subObject)` is **not** wrapped in `redactCredentialSecretsFromValue`.
- `restServerDefaultHandlers` has no `/secrets` url.

### Validation

```bash
RUN_TEST=secrets.270.phase0 npm run testByFile -w miroir-core -- secrets.270.phase0
```

### Realization

<Appended on completion.>

---

## Slice 1 — Tracer: process-scoped persist + hydrate + fake Spotify query

**Status:** ⬜ pending

### Goal

As a test operator / application maintainer, I can store a process-scoped named secret as ciphertext on Admin `MiroirSecret`, decrypt it with wrapping key `test-secrets-master`, and have `extractorFromAction` succeed against the fake Spotify server **without** calling `registerSecrets` in the test body.

**Layers cut:** Admin Entity JSON → `SecretsService` (encrypt/decrypt/hydrate) → `SecretStore` process map → `parseServerArgs --secrets-master-key` → redaction of `ciphertext` → existing fake-Spotify query path.

### 1.1 RED

**Test A (unit, not MiroirTest — crypto/startup):** `packages/miroir-core/tests/4_services/issues/270-persistent-named-secrets/secretsService.270.phase1.unit.test.ts`

Behavior asserted:
- `encryptSecret("aes-256-gcm", wrappingKey, "plain")` returns `aes-256-gcm$…$…$…`; decrypt round-trips; wrong wrapping key fails closed (no plaintext leak in the error).
- `hydrateSecrets({ wrappingKey, rows })` registers process-scoped names; `resolveSecret("spotifyClientId")` returns `{ value, scope: "process" }`.
- `parseServerArgs(["--secrets-master-key", "W"])` exposes `secretsMasterKey: "W"`; import set still parsed; `--secret` no longer auto-fills a standing runtime map used as source of truth (import set is a separate field).
- `redactCredentialSecretsFromValue` on a `MiroirSecret` instance **omits** `ciphertext`.
- Missing wrapping key + non-empty rows → hydrate throws without listing values.

**Test B (integ):** `packages/miroir-standalone-app/tests/3_controllers/issues/270-persistent-named-secrets/secretsHydrate.270.phase1.integ.test.ts`

Reuse the Slice-2 #267 fake server + filesystem emulated profile. Setup writes one process-scoped `MiroirSecret` row (ciphertext produced in the test with `test-secrets-master`) into the Admin persistence store, sets the wrapping key, calls `hydrateSecrets` (or the orchestrator), does **not** call `registerSecrets`.

Behavior asserted:
- Boxed `extractorFromAction` get-playlist against the fake server succeeds; `Authorization: Bearer <hydrated value>`.
- A control without hydrate / without wrapping key fails closed (`Unknown or empty secret`).

### 1.2 GREEN

- Add Admin Entity `MiroirSecret` (`a96856df-…`) under `admin_model/16dbfe28-…/`; export `entityMiroirSecret` from admin `index.ts`; constant `ENTITY_MIROIR_SECRET_UUID`.
- `SecretsService` in `packages/miroir-core/src/4_services/SecretsService.ts`: wrapping-key hold (`setSecretsMasterKey` / `getSecretsMasterKey` — no ephemeral default), `encryptSecret` / `decryptSecret`, `hydrateSecrets`, `importProcessSecrets` (encrypt+return instances; persist is the caller's job in this slice).
- Extend `SecretStore`: process map; `resolveSecret` return type `{ value, scope, miroirUserUuid? }` (user map empty until Slice 3). Keep `registerSecrets` as test hatch (process scope).
- `parseServerArgs`: add `--secrets-master-key`; split `secrets` (import set) from standing registration. `server.ts` usage text; **do not yet** change production `registerSecrets(parsed.secrets)` standing behavior except: if wrapping key + import set are both present, import+hydrate is allowed. Standing `--secret` without wrapping key still works in this slice (breaking fail-closed is Slice 5) so existing `serverSecrets` / Spotify tests stay green.
- Redaction: strip `ciphertext` when `parentUuid === ENTITY_MIROIR_SECRET_UUID`.
- Admin `modelValidation` must pass (filesystem auto-includes the new entity).

### 1.3 Refactor checkpoint

- One `SecretsService` — `server.ts` stays wiring.
- Do not put encrypt/decrypt in `AuthenticationPolicy` (hash vs encrypt stay separate modules).
- Existing `serverSecrets.unit.test.ts` must still pass (additive parse, not a break yet).

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
```

### Realization

<Appended on completion.>

---

## Slice 2 — Dedicated `/secrets` HTTP + CRUD guard

**Status:** ⬜ pending

### Goal

As a signed-in platform user, I can set a process-scoped secret via `POST /secrets` and list **names only** via `GET /secrets`. Generic instance CRUD on `MiroirSecret` is rejected. The emulated server persists through `serverDomainController`.

**Layers cut:** `handleSecretsHttpRoute` → mutation guard → `SecretsService` encrypt + `updateInstance`/`createInstance` with `actionLabel: "secrets.set"` → `RestClientStub` + Express wiring → redacted GET.

### 2.1 RED

**Test:** `packages/miroir-standalone-app/tests/3_controllers/issues/270-persistent-named-secrets/secretsHttp.270.phase2.integ.test.ts` (and a core unit for the route policy: `secretsHttp.270.phase2.unit.test.ts`)

Behavior asserted:
- `POST /secrets` `{ name, value, scope: "process" }` with Alice's Bearer → `{ set: true }`; a subsequent hydrate/`resolveSecret("name")` returns the value.
- `GET /secrets` returns `{ secrets: [{ name, scope: "process" }] }` and **no** `value` / `ciphertext`.
- Generic `createInstance` / `updateInstance` on `parentUuid === ENTITY_MIROIR_SECRET_UUID` without `actionLabel` `secrets.set` is rejected.
- `DELETE /secrets` `{ name, scope: "process" }` removes the row; resolve fails closed.
- Hatch off: process-scope POST still works in-process (tests); user-scope POST without principal is rejected (Slice 3 owns user-scope success).

### 2.2 GREEN

- `handleSecretsHttpRoute` in `miroir-core` (sibling of `handleAuthHttpRoute`). Wire into `server.ts` **and** `RestClientStub.call` **before** the `restServerDefaultHandlers` match.
- Persist via `serverDomainController.handleAction(createInstance|updateInstance|deleteInstance)` with `actionLabel` `secrets.set` / `secrets.delete`.
- `assertSecretInstanceMutationAllowed` (sibling of credential guard) in `handleInstanceAction` + CRUD REST handler. Record transactional/commit-replay bypass as a one-line comment (analysis R11).
- `printUsageAndExit` already has wrapping key from Slice 1.

### 2.3 Refactor checkpoint

- Do **not** copy change-password's in-memory-only stub persist.
- One guard function shared by REST CRUD and `handleAction`.

### Validation

```bash
RUN_TEST=secretsHttp.270 npm run testByFile -w miroir-core -- secretsHttp.270
RUN_TEST=secretsHttp.270 npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem secretsHttp.270
RUN_TEST=authentication.71 npm run testByFile -w miroir-core -- authentication.71
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
```

### Realization

<Appended on completion.>

---

## Slice 3 — Per-user secrets + principal thread + principal-scoped OAuth cache

**Status:** ⬜ pending

### Goal

As Alice, I can store my own `spotifyRefreshToken`; Carol does not receive Alice's access token from a warm OAuth cache. Composite boxed queries and `POST /query` both see the principal.

**Layers cut:** `SecretStore` user map → `handleAction` forwards principal → `handleApplicationAction` / `executeCompositeRunBoxedQueryAction` / `handleBoxedExtractorOrQueryAction` / `queryActionHandler` → `executeExternalServiceOperation` → principal-scoped `oauth2TokenCache` / `rotatedRefreshTokens`.

### 3.1 RED

**Test:** `packages/miroir-standalone-app/tests/3_controllers/issues/270-persistent-named-secrets/secretsPrincipal.270.phase3.integ.test.ts`

Behavior asserted:
- Alice `POST /secrets` `{ name: "fakeRefresh", value: "alice-rt", scope: "user" }` stores `miroirUser = Alice`. Carol cannot GET that name in her list (only process + own user rows). Carol cannot POST overwrite Alice's user row.
- Two principals, same endpoint names, distinct refresh tokens: after Alice's call warms the cache, Carol's call hits the fake token URL with **Carol's** refresh token (or her cached access token), never Alice's. Access-token cache keys differ by `miroirUserUuid`.
- `POST /query` with Alice's Bearer: `resolveSecret("fakeRefresh", alice)` returns `{ scope: "user", miroirUserUuid: alice }`.
- Hatch off / no principal: only process-scoped rows resolve (existing `externalServiceQuery` still green via `registerSecrets` hatch **or** process hydrate).
- A composite boxed query that includes `extractorFromAction` receives the same principal as the outer `handleAction` (no silent process fallback when a user row exists).

### 3.2 GREEN

- `SecretStore` user map keyed `userUuid:name`. `resolveSecret` implements D2 order. `redactRegisteredSecretValuesInString` walks both maps.
- Thread `principal?: AuthPrincipal` through the inventory in analysis §5 (including composite). `queryActionHandler` passes `params.authPrincipal`. `/queryTemplate` unchanged (fails closed for external extractors).
- `oauth2AuthorizationCodeCacheKey` / client-credentials cache key append `principal?.miroirUserUuid ?? "process"`. 401 retry uses the same principal.
- `executeExternalServiceOperation(..., principal?)`.

### 3.3 Refactor checkpoint

- One cache-key helper; no duplicated Alice/Carol branching in fetch.
- Analysis §3.5 misalignment closed.

### Validation

```bash
RUN_TEST=secretsPrincipal.270 npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem secretsPrincipal.270
RUN_TEST=externalServiceQuery npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem externalServiceQuery
RUN_TEST=externalServiceDispatch npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem externalServiceDispatch
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
```

### Realization

<Appended on completion.>

---

## Slice 4 — Persist rotated refresh token

**Status:** ⬜ pending

### Goal

When the fake token endpoint returns a new `refresh_token`, the matching `MiroirSecret` row is re-encrypted and a subsequent hydrate (or process restart simulation: `clearSecrets` + hydrate) still resolves the **new** value.

**Layers cut:** `persistRotatedSecret` callback on `ExternalServiceClient` → `SecretsService` (held wrapping key) → Admin instance update with `secrets.set`.

### 4.1 RED

**Test:** `packages/miroir-standalone-app/tests/3_controllers/issues/270-persistent-named-secrets/secretsRotation.270.phase4.integ.test.ts`

Behavior asserted:
- Fake token URL returns `{ access_token, refresh_token: "rotated-rt", expires_in }`.
- After the call, the persisted process-scoped (or user-scoped, separately) row decrypts to `rotated-rt`.
- `clearSecrets()` + `hydrateSecrets` → `resolveSecret` returns `rotated-rt`.
- If wrapping key is unset at persist time → fail closed; do not treat RAM as durable.
- Never log the new refresh token (assert log spies / redaction on any dumped result).

### 4.2 GREEN

- `setPersistRotatedSecret(callback)` (or constructor-style register on `SecretsService`) called from server/test startup.
- On rotation, callback uses winning scope from `resolveSecret`.
- Update in-memory maps + principal-scoped `rotatedRefreshTokens`.

### 4.3 Refactor checkpoint

- No `DomainController` import from `ExternalServiceClient`.
- Analysis D7 / R2 closed.

### Validation

```bash
RUN_TEST=secretsRotation.270 npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem secretsRotation.270
RUN_TEST=externalServiceQuery npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem externalServiceQuery
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
```

### Realization

<Appended on completion.>

---

## Slice 5 — Import-then-discard + AI keys via `resolveSecret`

**Status:** ⬜ pending

### Goal

As an operator, I can pass `--secret` / `AI_GITHUB_TOKEN` **once** with the wrapping key and have them persisted; later resolve does not depend on those env vars. A launch with an import set and **no** wrapping key fails. `getApiKey` reads the named secret.

**Layers cut:** `parseServerArgs` import-set assembly (D6 aliases) → `SecretsService.importProcessSecrets` → `server.ts` wiring (stop `registerSecrets(parsed.secrets)` as standing source of truth) → `copilotRuntimeFactory.getApiKey`.

### 5.1 RED

**Test:** `packages/miroir-core/tests/4_services/issues/270-persistent-named-secrets/secretsImport.270.phase5.unit.test.ts`

Behavior asserted:
- Import set assembled from `--secret`, `MIROIR_SECRET_*`, and the four `AI_*` key env vars (mapped names).
- Import + wrapping key → process-scoped rows; subsequent `resolveSecret("aiGithubToken")` works after env is cleared.
- Import set non-empty + no wrapping key → throw (usage mentions wrapping key).
- Rows exist + no wrapping key → hydrate throw.
- No rows + no wrapping key → empty store (resolve fails closed); server can still start.
- `getApiKey("github")` uses `resolveSecret("aiGithubToken")`; error text is “missing secret `aiGithubToken`”, not “Missing environment variable AI_GITHUB_TOKEN”.
- Existing `copilotRuntimeFactory.unit.test.ts` updated to register the named secret (or import) instead of only `vi.stubEnv("AI_OPENAI_KEY")` for the adapter-construction cases.

### 5.2 GREEN

- Flip production wiring: `registerSecrets(parsed.secrets)` is **not** the runtime source; import then hydrate.
- Keep `registerSecrets` exported for tests (`LIVE_SPOTIFY_*` stays a hatch — not a D6 alias).
- Update `server.ts` help text.

### 5.3 Refactor checkpoint

- One import-set assembler (D6 aliases in one table).
- Analysis R7 breaking change lands here — existing `serverSecrets` tests that expect CLI→`registerSecrets` must move to import+hydrate or keep a unit for the import-set shape.

### Validation

```bash
RUN_TEST=secretsImport.270 npm run testByFile -w miroir-core -- secretsImport.270
RUN_TEST=serverSecrets npm run testByFile -w miroir-core -- serverSecrets
npm run testByFile -w miroir-ai -- copilotRuntimeFactory
RUN_TEST=externalServiceQuery npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem externalServiceQuery
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-ai/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-server/tsconfig.json
```

### Realization

<Appended on completion.>

---

## Slice 6 — MCP response redaction + `?page=secrets` UI

**Status:** ⬜ pending

### Goal

As a platform user, I never see `ciphertext` or `passwordHash` in an MCP `getInstances` tool response, and I can set a process secret from `?page=secrets` the way I change a password from `?page=login`.

**Layers cut:** `mcpHandlersForEndpoint.ts` response branches → `PageDispatcher` + secrets form (same transport as login).

### 6.1 RED

**Test A:** `packages/miroir-mcp/tests/…` or core unit that imports the formatter — `secretsRedact.270.phase6.unit.test.ts`

Behavior asserted:
- A fake MCP success payload containing a credential `passwordHash` and a `MiroirSecret` `ciphertext` is redacted in **both** `text` and `parsed` of the tool response (not only logs).
- Error `context` is redacted too.

**Test B:** standalone-app integ or component test for `?page=secrets` (vitest + happy-dom; justify: UI not MiroirTest).

Behavior asserted:
- When auth is enabled and a token exists, `?page=secrets` renders name + value + scope controls; submit calls `POST /secrets`; success does not display the value.
- Generic Admin entity list does not gain a Secrets menu item (Slice 0 inventory still 8 items, plus no new Secrets label).

### 6.2 GREEN

- Wrap MCP success/error `subObject` with `redactCredentialSecretsFromValue` before `JSON.stringify`.
- Secrets page + `PageDispatcher` branch (mirror login).
- `AiConfiguration` description sentence updated if the entity file is already being touched; otherwise docs-only in Slice 7.

### 6.3 Refactor checkpoint

- Pre-existing `passwordHash`-via-MCP leak closed here (analysis R4).
- No new Admin menu item.

### Validation

```bash
RUN_TEST=secretsRedact.270 npm run testByFile -w miroir-core -- secretsRedact.270
# and/or miroir-mcp testByFile if the test lives there
RUN_TEST=authentication.71 npm run testByFile -w miroir-core -- authentication.71
npx tsc --noEmit --skipLibCheck -p packages/miroir-mcp/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
```

### Realization

<Appended on completion.>

---

## Slice 7 — Nonreg, docs, cleanup, AC

**Status:** ⬜ pending

### 7.1 Nonreg

- Add `unit-270-persistent-secrets` to `scripts/nonreg-manifest.json` (`testByFile -w miroir-core -- secrets.270` covering phase0–5 unit files, plus standalone-app `secretsHydrate` / `secretsHttp` / `secretsPrincipal` / `secretsRotation` with `--profile emulatedServer-filesystem`).
- Existing `externalServices-spotify` step must stay green (hatch `registerSecrets` and/or process hydrate).

### 7.2 Docs

- `analysis.md` status → implemented (after this slice).
- `docs/reference/data-architecture-deployments.md` (~215): wrapping key + import-once; names only on endpoints.
- `docs/reference/authentication.md`: second standing secret (`MIROIR_SECRETS_MASTER_KEY`); `/secrets` routes.
- `docs/guides/build-it-yourself.md` + Docker compose/Dockerfile: document `MIROIR_SECRETS_MASTER_KEY`.
- `docs/reference/testing.md`: issue-suite keys; `LIVE_SPOTIFY_*` remains a test hatch.

### 7.3 Issue-directory cleanup

- After the feature is green, migrate still-valuable assertions from `tests/**/issues/270-persistent-named-secrets/` into feature-named suites (`secretsService`, `secretsHttp`, …) and delete the issue directory per `docs/contributing/testing.md` (#238). If cleanup is deferred to immediately after nonreg in this same slice, do it here; otherwise record the leftover path in Realization.

### 7.4 Tracer bullet (narrative)

1. Launch: `MIROIR_SECRETS_MASTER_KEY=<W> node packages/miroir-server/release/index.js --secret spotifyClientId=<id> --secret spotifyClientSecret=<s> --secret spotifyRefreshToken=<r>` (first time only).
2. Later launches: wrapping key only.
3. Open `?page=secrets`, set a user-scoped refresh token while logged in as Alice.
4. Open the Spotify playlist report; Alice's token is used; Carol does not see Alice's cached access token.

Automated equivalent: Slice 1 hydrate integ + Slice 3 principal integ + Slice 5 import unit.

### AC checklist (#270)

| Criterion | Proven by | Status |
|---|---|---|
| Persist process-scoped secret; later launch needs only wrapping key | Slice 1 + Slice 5 | ⬜ |
| Persist user-scoped secret; extractor/OAuth uses that principal | Slice 3 | ⬜ |
| Values never in REST/MCP/generic editor; generic CRUD rejected | Slice 2 + Slice 6 | ⬜ |
| `--secret` / `MIROIR_SECRET_*` bootstrap only | Slice 5 | ⬜ |
| Rotated refresh token persisted | Slice 4 | ⬜ |
| AI keys from named-secret store | Slice 5 | ⬜ |
| Login passwords unchanged | `authentication.71` in Slice 2 validation | ⬜ |
| Existing Spotify tests keep working | `externalServiceQuery` in Slices 1, 3, 5 | ⬜ |

### Validation

```bash
npm run nonreg
```

### Realization

<Appended on completion.>
