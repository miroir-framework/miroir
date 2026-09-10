# 270 — Persist named secrets (process + per-user) behind a wrapping key

> How to replace the standing #267 launch-time `--secret` list with encrypted Admin
> `MiroirSecret` rows, so the only remaining process launch secret is a wrapping key —
> covering shared API credentials and per-user OAuth refresh tokens, without putting
> recoverable values on Endpoint instances or on `MiroirUserCredential`.

Related issue: https://github.com/miroir-framework/miroir/issues/270
Prerequisite: [#267 OpenAPI external services](https://github.com/miroir-framework/miroir/issues/267) ✅ — [`../267-FEATURE-openapi-external-services/analysis.md`](../267-FEATURE-openapi-external-services/analysis.md) · [#71 User authentication](https://github.com/miroir-framework/miroir/issues/71) ✅ — [`../71-FEATURE-user-authentication/analysis.md`](../71-FEATURE-user-authentication/analysis.md) · [#219 User and Rights model](https://github.com/miroir-framework/miroir/issues/219) ✅ — [`../219-FEATURE-preliminary%20User%20and%20Rights%20model%20in%20Admin%20app%20(prep%20for%20%2371)/analysis.md`](../219-FEATURE-preliminary%20User%20and%20Rights%20model%20in%20Admin%20app%20(prep%20for%20%2371)/analysis.md)
Related: [#262 Application access](https://github.com/miroir-framework/miroir/issues/262) ✅ · [#193 LLM-Agent](https://github.com/miroir-framework/miroir/issues/193) (env AI keys; “Approach B” encrypted key on `AiConfiguration` is superseded by this issue)
Key sources: [`SecretStore.ts`](../../../packages/miroir-core/src/4_services/SecretStore.ts) · [`parseServerArgs.ts`](../../../packages/miroir-core/src/4_services/parseServerArgs.ts) · [`ExternalServiceClient.ts`](../../../packages/miroir-core/src/4_services/ExternalServiceClient.ts) · [`AuthenticationPolicy.ts`](../../../packages/miroir-core/src/1_core/authentication/AuthenticationPolicy.ts) · [`redactCredentialSecrets.ts`](../../../packages/miroir-core/src/4_services/redactCredentialSecrets.ts) · [`server.ts`](../../../packages/miroir-server/src/server.ts) · [`RestServer.ts`](../../../packages/miroir-core/src/4_services/RestServer.ts) · [`DomainController.ts`](../../../packages/miroir-core/src/3_controllers/DomainController.ts) · [`copilotRuntimeFactory.ts`](../../../packages/miroir-ai/src/runtime/copilotRuntimeFactory.ts) · [`MiroirUserCredential` entity](../../../packages/miroir-test-app_deployment-admin/assets/admin_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/6c3ab489-1a36-4981-b5d0-bb3e02cfceed.json)

**Document role:** analysis and architectural decision record.
**Status:** decisions confirmed with the user (2026-09-11); revised after adversarial review ([`./adversarial-review.md`](./adversarial-review.md), R1–R11 applied). TDD plan revised after plan review ([`./plan-adversarial-review.md`](./plan-adversarial-review.md), P1–P18 applied). Implementation proceeds per [`./tdd-implementation-plan.md`](./tdd-implementation-plan.md).

**Document history:** first draft committed on `270-FEATURE-persistent-named-secrets`. Adversarial review found two structural holes (name-keyed OAuth caches defeating D2-b; no D7 persistence channel) plus in-process `/secrets`, MCP response redaction, composite principal thread, testable startup home, migration/docs, and blast radius. Those are repaired below; product choices D1–D9 are unchanged.

---

## Sequencing

| Step | Issue | Status |
|---|---|---|
| Identity + hashed `MiroirUserCredential` | [#71](https://github.com/miroir-framework/miroir/issues/71) | ✅ |
| Named launch-time secrets + `SecretStore` | [#267](https://github.com/miroir-framework/miroir/issues/267) D4 | ✅ (superseded for production launch by **this**) |
| Persist named secrets; wrapping key only at launch | **#270 (this document)** | **this** |
| Per-user OAuth PKCE consent in the UI | later, unscheduled | later |
| `MiroirRight.capability` as the writer gate | #219 C2 | later |
| MCP / CLI / Electron identity + secret hydrate | [#263](https://github.com/miroir-framework/miroir/issues/263) | later |
| Encrypt Deployment store passwords | unscheduled | later |

#267 D1 recorded a revisit trigger: *if per-user tokens enter scope, split `ExternalService` out of `Endpoint`*. This issue **takes per-user tokens** (D2-b) and **does not split** `Endpoint`: values never live on the endpoint instance — only names do. The revisit is closed by `MiroirSecret` + optional owner, not by D1-a.

---

## Decision record

Confirmed with the user (2026-09-11). ★ = accepted. Recommendations from the design pass, with the two requested overrides (D2-b, D4-b).

| ID | Question | Choice |
|---|---|---|
| D1 | Where do persisted API secrets live? | **D1-a. New Admin entity `MiroirSecret`.** Not `MiroirUserCredential`. Not a field on Endpoint / `AiConfiguration` / Deployment. |
| D2 | What scopes? | **D2-b. Process-scoped *and* per-user.** Same entity; optional `miroirUser` FK. |
| D3 | Protection at rest | **D3-a. Encrypt with a process wrapping key** (AES-256-GCM). Decrypt only in the server process. |
| D4 | What happens to `--secret` / `MIROIR_SECRET_*`? | **D4-b. Bootstrap import only.** Steady-state launch: wrapping key alone. |
| D5 | Who may set / rotate? | **D5-a. Dedicated action, not generic CRUD.** Process-scoped: any authenticated user until #219 C2 (D5-a2). User-scoped: **self only**. |
| D6 | AI keys | **D6-a (tightened by D4-b).** Same named-secret store. `AI_*` **key** env vars are import aliases, not a standing launch channel. `AI_PROVIDER_TYPE` / `AI_MODEL` stay configuration. |
| D7 | Rotated OAuth refresh tokens | **D7-a. Persist** back into the matching `MiroirSecret` row. |
| D8 | Client cache / “server-only entity” | **No new platform flag.** Isolation = strip ciphertext + reject generic CRUD + dedicated write + decrypt only in the server process (same pattern as `passwordHash`). **MCP tool responses** are redacted (R4) — today only MCP *logs* are. |
| D9 | #267 D1 ExternalService split | **Do not split.** Endpoint still stores names only. |

**Rationale:** login hashes are one-way and 1:1 with a user — useless for outbound API calls. The reusable #71 pattern is isolation (separate entity, dedicated write, strip on read, fail-closed CRUD). The reusable #267 pattern is named resolution (`resolveSecret`) and names-only on the endpoint. Persistence needs reversible crypto and a wrapping key that must not live in Admin. Per-user tokens fit the same entity via an optional owner; they do not belong on the Endpoint instance that replicates to every client cache.

### D1 — Entity home

**Status:** Accepted — new Admin entity `MiroirSecret` (uuid `a96856df-2b38-494a-8027-82617e2d64ad`).

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D1-a. `MiroirSecret`** ★ | Named row: `name`, `ciphertext`, `algorithm?`, optional `miroirUser`, optional `description`; no reports; dedicated set/rotate/delete | Same isolation as credentials; feeds `SecretStore` by name; endpoints unchanged | New entity; Admin is always-allow (#262) so values must never ship to clients |
| D1-b. Generalize `MiroirUserCredential` | Add kind `password \| apiSecret` | One table | Mixes one-way and reversible crypto; 1:1 user FK is wrong for process secrets |
| D1-c. Field on consumer | Value on Endpoint / `AiConfiguration` / Deployment | Seems simple | Model/data replicates to every client; #267/#193 already rejected this |
| D1-d. CLI/env only | Keep #267 D4 | Already shipped | Does not persist; does not give per-user storage |

**Decision:** D1-a. `MiroirUserCredential` stays login-only (scrypt). #193 Approach B (“encrypted key on `AiConfiguration` + server-only entity flag”) is superseded.

Shape:

| Attribute | Notes |
|---|---|
| `uuid` | Default Miroir PK |
| `name` | SecretStore key (e.g. `spotifyClientId`, `spotifyRefreshToken`, `aiGithubToken`) |
| `ciphertext` | AES-256-GCM blob; never in `viewAttributes`; stripped on every client-facing read |
| `algorithm` | optional; seed / default `"aes-256-gcm"` |
| `miroirUser` | optional FK → `MiroirUser` `d20d09e5-0685-4fc7-b9bd-fcfa3845127a`. **Absent = process-scoped.** Present = that user only |
| `description` | optional |

`viewAttributes`: `name`, `miroirUser`, `uuid` — never `ciphertext`.

Uniqueness: process-scoped `name` unique among process rows; user-scoped `(name, miroirUser)` unique. The same `name` **may** exist as both a process row and one row per user (user-scoped wins when a principal is present — D2).

No `MiroirSecret` list/detail reports, no Admin menu item (Admin menu today: Users + Rights; no Credentials — same pattern). Write/list via dedicated `/secrets` HTTP + a dedicated `?page=secrets` form (not the generic instance editor).

No `MiroirUserCredential`-style EntityVersion row is required: Admin #71 entities live only under Entity folder `16dbfe28-…` (verified: no `54b9c72f-…` file for `6c3ab489-…`).

### D2 — Scope (process + per-user)

**Status:** Accepted — D2-b.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| D2-a. Process only | Hydrate `SecretStore` from process rows | Smaller; existing Spotify tests unchanged | Does not store Alice’s refresh token separately from Carol’s |
| **D2-b. Process + per-user** ★ | Optional `miroirUser`; `resolveSecret(name, principal?)` | Matches “each user brings a Spotify token”; client id/secret stay process-scoped | Must thread `AuthPrincipal` into the **query** path (today it does not — §3.6) |
| D2-c. Also DB passwords | Encrypt postgres passwords on Deployment | One secrets story | Different consumer; separate issue |

**Resolution order** (`resolveSecret(name, principal?)`):

1. If `principal` is present, look up user-scoped `(name, miroirUser = principal.miroirUserUuid)`.
2. Else / miss: look up process-scoped `(name`, no owner).
3. Else: fail closed (`Unknown or empty secret`), no map leak.

**Hatch off / no principal:** step 1 is skipped — only process-scoped rows resolve. Existing Spotify integ tests that `registerSecrets({ spotifyRefreshToken: "…" })` (or the equivalent process-scoped hydrate) keep working.

**Hatch on:** Alice with a user-scoped `spotifyRefreshToken` uses hers; Carol without a user row falls back to a process-scoped row if one exists (shared demo account) or fails closed.

**OAuth caches must be principal-scoped (R1).** Today `oauth2AuthorizationCodeCacheKey` is `tokenUrl|clientIdKey|refreshTokenKey` — the **names** from the endpoint (`ExternalServiceClient.ts:387-389`). The access-token cache is probed **before** `resolveSecret` (`:400-404`). Spotify’s names are fixed, so Alice’s first call populates `oauth2TokenCache` (`:45`, write `:496-500`) and Carol’s call would return Alice’s access token for up to an hour. `rotatedRefreshTokens.get(scheme.refreshTokenKey)` (`:424`) has the same name-key defect. Target: every cache key includes `principal?.miroirUserUuid ?? "process"` (`oauth2TokenCache`, `rotatedRefreshTokens`, and the client-credentials cache at `:292`). The 401-retry path (`:659-675`) re-resolves with the **same** principal. Proof: two principals, same endpoint, distinct tokens, no cross-serving from a warm cache.

`resolveSecret` must report which scope won (not a bare string — today’s `SecretStore.ts:14-23`) so D7 updates the correct row: e.g. `{ value, scope: "process" | "user", miroirUserUuid?: string }`. Value-based redaction (`redactRegisteredSecretValuesInString`, `SecretStore.ts:30-39`) must iterate **both** process and per-user maps.

**#267 D1 revisit — closed without split.** The trigger was: endpoint instances replicate to every client cache, so they must not carry per-user credential *values*. This design keeps `clientIdKey` / `clientSecretKey` / `refreshTokenKey` as **names** on `externalService.securityScheme` (Spotify endpoint `0e5cb172-12ea-4467-8598-5889338ae454`). Values live on `MiroirSecret`. No `ExternalService` entity.

Per-user **OAuth PKCE consent in the UI** is a non-goal: the user (or bootstrap import) supplies an already-issued refresh token.

### D3 — Encryption at rest

**Status:** Accepted — wrapping key + AES-256-GCM.

| Option | Verdict |
|---|---|
| **D3-a. Process wrapping key** ★ | Accepted |
| D3-b. Encrypt with the user’s login password | Rejected for process secrets (server must call Spotify with no interactive password). Not used for user-scoped rows either — one wrapping key decrypts the whole table at hydrate |
| D3-c. Plaintext in Admin | Rejected — Admin always-allow + client cache + filesystem JSON |
| D3-d. OS keychain / sidecar file | Rejected — second store; not schema-first |

Ciphertext format (mirrors `scrypt$…` on credentials):

```
aes-256-gcm$<iv_base64url>$<ciphertext_base64url>$<tag_base64url>
```

AES-256 key = SHA-256(UTF-8 wrapping key) (32 bytes). The wrapping key must be high-entropy (operator secret, not a user password). Node `crypto` only — no new dependency (same constraint as #71).

Wrapping-key knobs (not `MIROIR_AUTH_TOKEN_SECRET` — that secret may be **ephemeral** when unset: `getProcessTokenSecret` in `AuthenticationPolicy.ts:161-170`):

| Knob | Name |
|---|---|
| CLI | `--secrets-master-key <value>` |
| Env | `MIROIR_SECRETS_MASTER_KEY` |
| Config JSON | **not used** (secrets-in-config was #267 D4-a, rejected) |

Precedence: CLI > env. No ephemeral wrapping key: if any `MiroirSecret` row exists and the wrapping key is missing, **startup fails closed**. If there are no rows and no wrapping key, `SecretStore` stays empty (external calls fail closed at resolve — today’s behavior with zero `--secret`).

Wrapping-key rotation / re-encrypt of the table is a non-goal (re-import or dedicated later issue).

### Migration / breaking changes (R7)

D4 step 2 + D6 mean that **any** launch with `--secret`, `MIROIR_SECRET_*`, or `AI_OPENAI_KEY` / `AI_ANTHROPIC_KEY` / `AI_GOOGLE_KEY` / `AI_GITHUB_TOKEN` set — but no wrapping key — **fails startup**. Today those launches work (`getApiKey` reads `process.env` at request time).

| First upgrade | Later launches |
|---|---|
| Set `MIROIR_SECRETS_MASTER_KEY` (or `--secrets-master-key`) **and** the existing `--secret` / `MIROIR_SECRET_*` / `AI_*` key env vars once | Drop named `--secret` / `MIROIR_SECRET_*` / `AI_*` **key** env vars; keep only the wrapping key (plus `AI_PROVIDER_TYPE` / `AI_MODEL` if used) |

Docs / packaging that describe the old steady state and must change in the final slice:

- `docs/reference/data-architecture-deployments.md` (~line 215: named launch-time `--secret` / `MIROIR_SECRET_*`)
- `docs/reference/authentication.md` (~line 26: token-secret precedence now sits next to a second standing secret)
- `docs/guides/build-it-yourself.md` (launch instructions)
- `Dockerfile` / `docker-compose.yml` (server currently launched with no secret args; document `MIROIR_SECRETS_MASTER_KEY` as the one standing env knob)

Live Spotify test (`spotifyLive.integ.test.ts`) uses `LIVE_SPOTIFY_CLIENT_ID` / `LIVE_SPOTIFY_CLIENT_SECRET` / `LIVE_SPOTIFY_REFRESH_TOKEN` via `registerSecrets` — **test hatch only**, not a D6 import alias; it may keep `registerSecrets` (R8).

### D4 — Launch surface after persistence

**Status:** Accepted — D4-b. One standing launch secret: the wrapping key.

| Option | Verdict |
|---|---|
| D4-a. CLI/env named secrets remain a standing override | Rejected by user — N secrets on every launch |
| **D4-b. Bootstrap import, then store is source of truth** ★ | Accepted |
| D4-c. Remove `--secret` entirely | Rejected — first-run / migration still needs an import path |

**Steady-state launch:**

```bash
MIROIR_SECRETS_MASTER_KEY=<W> node packages/miroir-server/release/index.js
# or: --secrets-master-key <W>
```

**Bootstrap / migration import** (optional, process-scoped only):

```bash
MIROIR_SECRETS_MASTER_KEY=<W> node … --secret spotifyClientId=<id> --secret spotifyClientSecret=<s> --secret spotifyRefreshToken=<r>
```

**Testable home (R6).** The seven-step sequence is a `SecretsService` (or `secretsStartup.ts`) in `miroir-core` `4_services`: pure functions for import-set assembly (including D6 AI aliases), encrypt/decrypt, and a hydrate/import orchestrator that takes a minimal persistence interface. `server.ts` shrinks to wiring — the same reason #267 extracted `parseServerArgs` into `miroir-core` (`miroir-server` has no vitest suite). `--secrets-master-key` is parsed in `parseServerArgs` (unknown options currently throw, `parseServerArgs.ts:110-112`) and listed in `printUsageAndExit` (`server.ts:134-152`). The wrapping key is held on that service (module-level, never serialized).

**When it runs.** `loadAdminIdentityDirectory` (`server.ts:428-489`, boxed query `:438-471`) is **per-request** (called at `:521`, `:631`, `:666`, and via `resolveGatedPrincipal` at `:500`), not a startup step. Hydrate runs **once** after the open-store loops (`server.ts:346-363` for Admin/Miroir, `:410-425` for discovered deployments).

Startup sequence:

1. Parse wrapping key and the **import set** (`--secret` / `MIROIR_SECRET_*`, plus AI key-env aliases — D6).
2. If the import set is non-empty and the wrapping key is missing → fail startup.
3. If the import set is non-empty: encrypt + upsert **process-scoped** `MiroirSecret` rows; **discard** import plaintext (do not keep it as a `SecretStore` override).
4. Load all `MiroirSecret` rows from the Admin **persistence** store (not via client cache).
5. If any row exists and the wrapping key is missing → fail startup.
6. Decrypt every row; hydrate `SecretStore` (process map + per-user map).
7. Later `set` / rotate / OAuth refresh write-back: re-encrypt, persist, update the in-memory map.

`--secret` / `MIROIR_SECRET_*` remain in `parseServerArgs` as the import set. They are **not** registered via today’s `registerSecrets(parsed.secrets)` as the runtime source of truth (`server.ts:169`).

**In-process test hatch:** `registerSecrets` / `clearSecrets` stay exported for vitest (like `MIROIR_AUTH_ENABLED=0`). That is not a production launch channel. Spotify integ tests may keep calling `registerSecrets` **or** go through wrapping key + ciphertext hydrate; both are valid. Production `miroir-server` does not treat the import map as standing runtime secrets after step 3.

A second `--secret` on a later launch is a re-import (upsert process-scoped rows), not a “CLI wins over store” override. After persist, the store is the source of truth.

### D5 — Writers

**Status:** Accepted — dedicated HTTP, not generic CRUD.

| Scope | Who may write | Precedent |
|---|---|---|
| Process-scoped | Any authenticated principal (D5-a2) until #219 C2 evaluates `capability` | Admin is always-allow (#262 R3) — Carol can overwrite `spotifyClientSecret`. Accepted until capability taxonomy |
| User-scoped | **Self only** (`miroirUser = principal.miroirUserUuid`) | #71 D14 `POST /auth/change-password` |

Generic `createInstance` / `updateInstance` / `deleteInstance` / `deleteInstanceWithCascade` on `MiroirSecret` is rejected (extend `assertCredentialInstanceMutationAllowed` or a sibling `assertSecretInstanceMutationAllowed`). Dedicated paths:

| Method | Path | Auth | Body / result |
|---|---|---|---|
| GET | `/secrets` | Bearer when hatch on | `{ secrets: [{ name, scope: "process"\|"user", miroirUser? }] }` — names/metadata only; process rows + **own** user rows |
| POST | `/secrets` | Bearer when hatch on | `{ name, value, scope: "process"\|"user" }` → `{ set: true }`. `scope: "user"` ignores any attempted owner other than the principal |
| DELETE | `/secrets` | Bearer when hatch on | `{ name, scope: "process"\|"user" }` → `{ deleted: true }` |

Hatch off: keep the routes callable in tests without a principal for **process** scope only; user scope requires a principal.

**In-process test path (R3).** Most tests never start `miroir-server`. `RestClientStub` dispatches `handleAuthHttpRoute` for `/auth/*` (`RestClientStub.ts:74-91`, policy in `AuthenticationHttp.ts:30-91`) and `restServerDefaultHandlers` by method+url (`RestClientStub.ts:165-175`). An Express-only `app.post("/secrets")` in `server.ts` is invisible to emulated tests. The `/auth/change-password` precedent is **not** a persistence precedent in-process: `handleAuthHttpRoute` returns `{ changed: true, directory }` and the stub only swaps an in-memory directory (`RestClientStub.ts:81-88`); only the Express route persists via `domainController.handleAction(updateInstance)` (`server.ts:696-717`).

Target: a process-agnostic `handleSecretsHttpRoute` in `miroir-core` (sibling of `handleAuthHttpRoute`), wired into **both** `server.ts` and `RestClientStub.call`. The write path **must persist** through the stub’s `serverDomainController` (`RestClientStub.ts:140-142`) with a dedicated `actionLabel` (e.g. `secrets.set`) that the extended mutation guard permits — departing from the change-password stub’s in-memory-only behavior. `AuthenticationHttp.ts` is a key source for the routing shape, not for the persist semantics.

Dedicated UI: `?page=secrets` (same dispatcher pattern as `?page=login`, #71 D12). The form sends plaintext **once** over the same transport as `/auth/login` (HTTPS when certs exist; HTTP when they do not — `server.ts:834-849`; tests are HTTP). Generic Admin editor is not the secret UX. No menu item listing secret rows.

### D6 — AI keys

**Status:** Accepted — same store; key env vars are import aliases.

| Env today (`copilotRuntimeFactory.ts:29-35`) | `MiroirSecret.name` |
|---|---|
| `AI_OPENAI_KEY` | `aiOpenaiKey` |
| `AI_ANTHROPIC_KEY` | `aiAnthropicKey` |
| `AI_GOOGLE_KEY` | `aiGoogleKey` |
| `AI_GITHUB_TOKEN` | `aiGithubToken` |

`getApiKey` reads `resolveSecret(mappedName)` only (process-scoped). If an `AI_*` **key** env var is set at startup, it is part of the D4 import set (mapped name), then discarded. Error text today (`copilotRuntimeFactory.ts:38-42`, “Missing environment variable `AI_…`”) must say “missing secret `aiOpenaiKey`” (etc.), matching the ExternalServiceClient message rewrite. `AI_PROVIDER_TYPE`, `AI_MODEL`, `AI_BASE_URL` are **not** secrets — they stay env and/or `AiConfiguration` `8a36e922-c131-444a-8709-9c92e772b1ff` (entity description already says keys are env vars; this issue updates that sentence).

`AiConfiguration.providerType` enum in the entity asset is `openai \| anthropic \| google` (no `github`); `copilotRuntimeFactory` already accepts `"github"`. Aligning that enum is in scope only if a slice touches the entity; otherwise leave it (runtime already works from env).

### D7 — Refresh-token rotation

**Status:** Accepted — persist. Mechanism named (R2).

Today `rotatedRefreshTokens` (`ExternalServiceClient.ts:47`, write at `:488`, log `:490-493`) is memory-only; a restart after rotation requires a new `--secret`. Rotation is detected inside `resolveAuthorizationCodeToken` (layer 4_services). That module has no store handle and must not import `DomainController` (layer 3 already imports it at `DomainController.ts:165` — a reverse import is a cycle).

**Channel:** inject a `persistRotatedSecret` callback into `ExternalServiceClient` at startup (server wiring / test harness). The callback lives on a `SecretsService` in `miroir-core` `4_services` (R6) that already holds the wrapping key (module-level, set once, never serialized — same discipline as `processTokenSecret` in `AuthenticationPolicy.ts:157-170`). On rotation:

1. `resolveSecret` has returned `{ value, scope, miroirUserUuid? }` for the refresh-token key.
2. Provider returns a new `refresh_token`.
3. `persistRotatedSecret({ name: refreshTokenKey, newValue, scope, miroirUserUuid })` encrypts with the held wrapping key, upserts **that** row (the one that supplied the token — process fallback updates the process row, not a user row), updates `SecretStore`, updates the principal-scoped `rotatedRefreshTokens` entry.
4. `executeExternalServiceOperation` does not need to surface rotation on `Action2ReturnType`.

Never log the value. If the wrapping key is unset at persist time, fail closed (do not keep the rotated token only in RAM as the durable source).

### D8 — No server-only entity flag

**Status:** Accepted — reuse the credential isolation pattern, do not add a platform `server-only` flag (#193).

Ciphertext may sit on the server filesystem store as Admin JSON (encrypted). REST / query results strip `ciphertext` the same way `passwordHash` is stripped (`redactCredentialSecretsFromValue` in `redactCredentialSecrets.ts:26-30`, keyed on `parentUuid === ENTITY_MIROIR_USER_CREDENTIAL_UUID`). Extend that strip to `MiroirSecret.ciphertext`. Client local cache filled via REST therefore never holds the blob. Server hydrate reads the persistence store directly (`queryExecutionStrategy: "storage"`).

**MCP tool responses (R4).** The live redactor is applied to MCP **logs** (`mcpHandlersForEndpoint.ts:215`, `:250`, `:279`) but **not** to MCP tool **responses**: success serializes raw `returnedDomainElement` (`:286-295`) and errors serialize raw `errorContext` (`:299-317`). Today an MCP `getInstances` on Admin returns `passwordHash`; after #270 the same call would return `ciphertext`. This issue **adds the redactor on both MCP response branches** and thereby also closes the pre-existing `passwordHash`-via-MCP exposure. MCP wrapping-key hydrate / identity remains #263 (non-goal).

**CRUD guard reach (R11).** `assertCredentialInstanceMutationAllowed` fires in `handleInstanceAction` (`DomainController.ts:1065`) and the CRUD REST handler (`RestServer.ts:276-287`). Two paths bypass it today: `transactionalInstanceAction` (`:3484-3506`) and commit replay (`:2049-2088`). Those are not remotely reachable (`restActionHandler` default-throws, `RestServer.ts:469-473`; InstanceEndpoint exposes only plain actions). Extending the guard is sufficient for now; record the transactional/commit-replay bypass as known defense-in-depth debt so a future remote transactional path does not silently skip the secret guard.

### D9 — Do not split ExternalService

**Status:** Accepted. See D2. Endpoint `securityScheme` stays names-only. `ExternalServiceClient` gains an optional `AuthPrincipal` and calls `resolveSecret(name, principal)`.

---

## 1. Goals

1. **Store a process secret once** — In order to restart the server without re-pasting API tokens, as an *application maintainer*, I can save a named process-scoped secret in Admin that the server decrypts at launch with the wrapping key.
2. **Store my own API token** — In order to call an external API as myself on a shared server, as a *platform user*, I can save a named secret that only my principal can use and that only I can replace.
3. **Import then forget named CLI secrets** — In order to migrate from today’s launch line, as an *operator*, I can pass `--secret` / `MIROIR_SECRET_*` once (with the wrapping key) and have them persisted; later launches take only the wrapping key.
4. **Call by name** — In order not to put tokens in the app model, as an *application designer*, I keep referencing secret **names** on the endpoint (`clientIdKey`, `clientSecretKey`, `refreshTokenKey`, `credentialKey`).
5. **Never see the value** — In order not to leak tokens from a shared Admin, as a *platform user*, I can list secret **names** (process + my own) but never read plaintext or ciphertext.
6. **Survive refresh-token rotation** — In order not to re-consent after a provider rotates the refresh token, as an *application maintainer* / *platform user*, I keep working after a server restart.
7. **Keep login passwords as they are** — In order not to break sign-in, as a *platform user*, I still change my password via `POST /auth/change-password`; that store stays a one-way hash.

## 2. Non-goals

- Per-user OAuth Authorization-Code **PKCE in the UI** (later, unscheduled).
- Evaluating `MiroirRight.capability` as the process-secret writer gate (#219 C2).
- MCP process wrapping-key + Admin hydrate; CLI token client; Electron IPC (#263; #267 R11 hole remains).
- Encrypting Deployment / postgres store passwords (later, unscheduled).
- OS keychain; wrapping-key rotation / re-encrypt (later, unscheduled).
- Splitting `ExternalService` out of `Endpoint` (#267 D1-a).
- A platform `server-only` entity flag (#193 Approach B).
- Removing `registerSecrets` as an in-process **test** hatch.
- Changing #267 SSRF / HTTPS allowlist / extractor GET restriction.

---

## 3. Current state

Facts below were enumerated from Admin JSON assets (Python listing) and read from the cited functions. `graphify-out/graph.json` **exists** in this workspace (AGENTS.md prefers `graphify query`; this analysis still enumerated Admin JSON programmatically because the secret/password inventory is asset-level).

### 3.1 Three secret channels + login (misaligned with a single store)

| Channel | Mechanism | Recoverable? | Where |
|---|---|---|---|
| Login (#71) | scrypt **hash** on `MiroirUserCredential` | No | Admin data; generic CRUD rejected; `passwordHash` stripped on client reads |
| External APIs (#267 D4) | `--secret name=value` / `MIROIR_SECRET_<NAME>` → module-level `SecretStore` | Yes | Process memory only. Endpoints store **names** |
| AI (#193) | `AI_GITHUB_TOKEN` / `AI_OPENAI_KEY` / `AI_ANTHROPIC_KEY` / `AI_GOOGLE_KEY` via `process.env` in `getApiKey` (`copilotRuntimeFactory.ts:29-45`) | Yes | Env only. `AiConfiguration` has **no** key field |

`SecretStore` (`SecretStore.ts:6-27`) is a `Map<string, string>` with `registerSecrets` / `resolveSecret` / `clearSecrets`. No persistence, no owner. A fourth export, `redactRegisteredSecretValuesInString` (`:30-39`), iterates **values** for redaction — the per-user map must join that walk. `resolveSecret` fails closed on unknown/empty without listing keys.

`parseServerArgs` (`parseServerArgs.ts:73-116`): env `MIROIR_SECRET_*` first, then repeatable `--secret name=value` (CLI wins). `server.ts:169` calls `registerSecrets(parsed.secrets)` and logs **names only** (`server.ts:184-187`).

### 3.2 `MiroirUserCredential` is a hash, not encryption (aligned for login; wrong for API secrets)

Entity `MiroirUserCredential` uuid `6c3ab489-1a36-4981-b5d0-bb3e02cfceed`. `mlSchema` attributes: `miroirUser` (FK → `d20d09e5-…`), `passwordHash`, optional `algorithm`. `viewAttributes`: `miroirUser`, `uuid`. Description says set only via bootstrap seed + `/auth/change-password`.

`hashPassword` / `verifyPassword` (`AuthenticationPolicy.ts:224-254`): `scrypt$N$r$p$salt$hash`. Cannot recover plaintext.

Seed instances (3 files under `admin_data/6c3ab489-…/`):

| uuid | `miroirUser` | User |
|---|---|---|
| `c179dcf9-f39b-4b16-b8d6-3e39895bfd35` | `1c39328c-7de4-44ae-bcf1-5bbc38d8e267` | alice |
| `23f39cd9-f56e-4400-bd87-87e5d51798c1` | `30634877-08ae-44f3-a230-d899e22333d5` | carol |
| `cc3bc0aa-023f-4f8c-b4c8-a8c1f44b3a93` | `e2343a39-f5d9-4898-83b4-74e2ccc33125` | dave |

Bob (`95fa298f-…`) has no credential. Generic mutation rejected (`assertCredentialInstanceMutationAllowed`, `AuthenticationPolicy.ts:465-497`) unless `actionLabel === "auth.change-password"`.

### 3.3 Admin inventory (aligned as the platform store; misaligned for recoverable secrets)

Admin Entity folder `16dbfe28-e1d7-4f20-9ba4-c1a9873202ad` — **9** entities (programmatic listing):

| name | uuid |
|---|---|
| AdminApplication | `25d935e7-9e93-42c2-aade-0472b883492b` |
| MiroirUserCredential | `6c3ab489-1a36-4981-b5d0-bb3e02cfceed` |
| Deployment | `7959d814-400c-4e80-988f-a00fe582ab98` |
| AiConfiguration | `8a36e922-c131-444a-8709-9c92e772b1ff` |
| bundle | `9f9170da-538d-425c-8cb7-551640623eed` |
| MiroirRight | `a6136fc7-949b-4d64-9f13-dd3afce1ab3c` |
| ViewParams | `b9765b7c-b614-4126-a0e2-634463f99937` |
| MiroirUser | `d20d09e5-0685-4fc7-b9bd-fcfa3845127a` |
| ApplicationVersion | `ff3d211b-7eb6-473a-afbf-503bb70a5c26` |

`AiConfiguration` description: *“API keys are stored as server-side environment variables.”* Schema: `name`, `defaultLabel?`, `description?`, `providerType` (`openai`\|`anthropic`\|`google`), `model`, `baseUrl?`. No key/ciphertext. The entity file is **not** exported from `packages/miroir-test-app_deployment-admin/index.ts` (exports Users, Rights, Credentials, Applications, Deployments, …).

Admin menu `dd168e5a-2a21-4d2d-a443-032c6d15eb22` (complexMenu section `admin`) — **8** items, programmatic walk:

| label | reportUuid |
|---|---|
| Admin Entities | `c9ea3359-690c-4620-9603-b5b402e4a2b9` |
| Admin Applications | `951d74b2-a3e9-4e07-8850-1d7d12909f11` |
| Admin Reports | `1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855` |
| Deployments | `e4488cba-b743-4b46-80e5-18c441c9882c` |
| Bundles | `2d690e4f-16f6-4332-be6c-45d5179b3981` |
| ViewParams | `a0503a52-befd-4dcd-90c8-3c96c90f805d` |
| Users | `c8aa168d-2835-46cc-a602-2d071fb7d263` |
| Rights | `42994013-4494-4510-8531-7c811a9aa0d0` |

No Credentials item, no Secrets item. Users + Rights carry `menuItemScope: "data"`; the other six items have **no** `menuItemScope`.

`ALWAYS_ALLOW_APPLICATION_TARGETS` (`AccessPolicy.ts:36-39`): Admin `55af124e-…` and Miroir `360fcf1f-…` for every authenticated user. Carol can `getInstances` Admin data. Isolation of secrets cannot rely on “only some users can open Admin.”

Server reads the identity directory with a boxed query, `queryExecutionStrategy: "storage"` (`server.ts:438-471`) — the hydrate path for `MiroirSecret` must be the same **class** of read (persistence store, not client cache), but it runs once at startup after open-store, not inside this per-request helper.

### 3.4 External-service consumers (aligned for names; misaligned for persistence and principal)

Spotify endpoint `0e5cb172-12ea-4467-8598-5889338ae454`, `securityScheme.type: "oauth2AuthorizationCode"`, names `spotifyClientId` / `spotifyClientSecret` / `spotifyRefreshToken` (`tokenUrl` `https://accounts.spotify.com/api/token`).

`resolveSecret` call sites in `ExternalServiceClient.ts`:

| Function | Lines | Keys |
|---|---|---|
| `resolveClientCredentialsToken` | `307-308` | `clientIdKey`, `clientSecretKey` |
| `resolveAuthorizationCodeToken` | `415-428` | `clientIdKey`, `clientSecretKey`, `refreshTokenKey` (or in-memory rotation) |
| `resolveAuthorizationHeader` | `538` | `credentialKey` |

Error text still says “restart the server with `--secret`” (`:311`, `:419`, `:431`, `:541`).

`rotatedRefreshTokens` (`:47`) is in-memory; rotation write is `:488` (log `:490-493`), not persisted.

`oauth2TokenCache` / `oauth2AuthorizationCodeCacheKey` (`:45`, `:387-389`) are keyed by secret **names**, not principal — D2-b is defeated on a warm cache until R1.

`executeExternalServiceOperation(endpointInstance, actionType, bindings)` — **no principal argument**.

### 3.5 Principal is on `handleAction`, not on the query path (misaligned with D2-b)

`AuthPrincipal` is `{ miroirUserUuid, username }` (`AuthenticationPolicy.ts:6-9`).

`DomainController.handleAction` takes optional `principal` as the last argument (`DomainController.ts:2915`). `restActionHandler` passes `urlParams?.authPrincipal` (`RestServer.ts:421, 431`). `server.ts:576` and `RestClientStub.ts:192` put `authPrincipal` on the handler params object.

The Spotify report path is **`POST /query`**, not `POST /action`:

- `queryActionHandler` (`RestServer.ts:503-507`) calls `handleBoxedExtractorOrQueryAction` with **three** arguments (action, deployment map, `defaultMiroirModelEnvironment`). It does **not** pass `params.authPrincipal`.
- `handleBoxedExtractorOrQueryAction` / `executeBoxedExtractorOrQueryAction` (`DomainController.ts:823-849`) take **no** principal.
- `resolveExtractorFromActionInBoxedQuery` (`DomainController.ts:3221-3264`) calls `executeExternalServiceOperation` **without** a principal.

`handleAction` does **not** forward `principal` to `handleApplicationAction` (`DomainController.ts:2970-2976`). `handleApplicationAction`’s signature has no principal (`:2989-2995`); it only **logs** that `handleAction` received one (`:2918-2923`). The local-branch `executeExternalServiceOperation` call (`:3037-3044`) is therefore principal-less.

`handleQueryTemplateActionForServerONLY` (`DomainController.ts:996-1025`) goes straight to the persistence store and **cannot** host `extractorFromAction` (store runners hard-error). Only `POST /query` needs the principal on the REST query path. `/queryTemplate` also drops `params.authPrincipal` (`RestServer.ts:563-567`) — harmless today.

**Composite path (R5).** `executeCompositeRunBoxedQueryAction` calls `handleBoxedExtractorOrQueryAction` with no principal (`DomainController.ts:4499-4513`), reachable from `handleActionInternal` (`:3521`), composite templates (`:3654`, `:3959`, `:4752`), and in-process MCP composite tools (`mcpHandlersForEndpoint.ts:273` → `handleAction`). A composite boxed query with `extractorFromAction` would silently resolve process-scope only unless this hop is threaded.

**Truth table (today):**

| Path | Principal extracted? | Reaches `executeExternalServiceOperation`? |
|---|---|---|
| `POST /action` (hatch on) | Yes (`authPrincipal` on params → `handleAction`) | **No** — `handleAction` does not pass it into `handleApplicationAction` |
| `POST /query` (hatch on) | Yes (on params) | **No** — `queryActionHandler` never forwards it |
| Composite boxed query (hatch on) | Yes (if the outer `handleAction` got it) | **No** — `executeCompositeRunBoxedQueryAction` drops it |
| Hatch off | No | N/A — process-scoped `registerSecrets` only |

D2-b cannot work until principal is threaded through the inventory in §5.

### 3.6 Redaction (aligned for hashes + registered values; must learn ciphertext)

Live helper used by REST/MCP/DC: `packages/miroir-core/src/4_services/redactCredentialSecrets.ts` — strips `passwordHash` on credential `parentUuid`, redacts keys `authorization`/`token`/`credential`/`secret`, and registered SecretStore **values**.

A **second** `redactCredentialSecretsFromValue` in `AuthenticationPolicy.ts:445-463` only strips `passwordHash`. It is not the REST helper (`RestServer.ts` imports `4_services/redactCredentialSecrets.js`). Do not extend the unused copy; extend the live one (and strip `ciphertext` when `parentUuid` is `MiroirSecret`).

### 3.7 AI runtime (misaligned with SecretStore)

`getApiKey` reads `process.env` only (`copilotRuntimeFactory.ts:29-45`; env map `:30-35`). `getDefaultRuntimeConfig` reads `AI_PROVIDER_TYPE` + `AI_MODEL` (`:153-165`). CopilotKit is gated by the same Bearer as REST when auth is on (`docs/reference/authentication.md`). Keys never reach the browser today — keep that.

### 3.8 Token wrapping-key pitfall (aligned as a negative example)

`getProcessTokenSecret` (`AuthenticationPolicy.ts:161-170`): uses `MIROIR_AUTH_TOKEN_SECRET` or generates `ephemeral-…`. Must **not** be reused as the secrets wrapping key (restart would make all `MiroirSecret` rows unreadable).

---

## 4. Key reuse

| Piece | Location |
|-------|----------|
| Isolation pattern (separate entity, dedicated write, strip, fail-closed CRUD) | `MiroirUserCredential` `6c3ab489-…`; `assertCredentialInstanceMutationAllowed`; `POST /auth/change-password` |
| HTTP route shape (not persist semantics) | `handleAuthHttpRoute` / `AuthenticationHttp.ts` → sibling `handleSecretsHttpRoute` |
| Named resolution | `SecretStore.resolveSecret` / `registerSecrets` / `clearSecrets` / `redactRegisteredSecretValuesInString` |
| CLI parse to extend | `parseServerArgs` (`--secret` becomes import set; add `--secrets-master-key`) |
| Redaction | `redactCredentialSecrets.ts` (extend for `ciphertext` + `MiroirSecret` parentUuid); **also** MCP tool response branches (`mcpHandlersForEndpoint.ts:286-317`) |
| Admin persistence read | boxed query `queryExecutionStrategy: "storage"`; hydrate after open-store (`server.ts:346-363`) |
| Principal type | `AuthPrincipal`; `handleAction` last arg; `authPrincipal` on handler params |
| Endpoint names-only scheme | Spotify `0e5cb172-…` `oauth2AuthorizationCode` keys |
| External call | `executeExternalServiceOperation` / `resolveAuthorizationHeader` / `oauth2TokenCache` (must become principal-scoped) |
| Login UI dispatcher pattern | `?page=login` → same for `?page=secrets` |
| AES / scrypt via Node `crypto` | `AuthenticationPolicy.ts` (no new deps) |
| Wrapping-key hold pattern | `processTokenSecret` / `setProcessTokenSecret` (`AuthenticationPolicy.ts:157-170`) — do **not** reuse that secret |
| Admin always-allow (constraint) | `ALWAYS_ALLOW_APPLICATION_TARGETS` |
| AI key map | `copilotRuntimeFactory.ts:30-35` |
| Uuid constant home | `ENTITY_MIROIR_USER_CREDENTIAL_UUID` in `AuthenticationPolicy.ts:352` → sibling `ENTITY_MIROIR_SECRET_UUID` |

## 5. Target design (summary)

**Model.** Admin Entity `MiroirSecret` `a96856df-…` as in D1. No reports, no menu. Seed: **no** production secret rows in git. Tests use wrapping key `test-secrets-master` (documented, like `alice-dev`) and either in-process `registerSecrets` or ciphertext produced in the test.

**Launch.** Wrapping key required iff import set non-empty **or** any `MiroirSecret` row exists. Import set (optional) upserts process-scoped rows then is discarded. `SecretsService` hydrates `SecretStore` from decrypted rows after open-store: process map + `userUuid:name` map. `resolveSecret(name, principal?)` returns `{ value, scope, miroirUserUuid? }` (D2).

**Write.** `POST /secrets` / `DELETE /secrets` / `GET /secrets` via `handleSecretsHttpRoute` (D5, R3). Generic CRUD rejected (`assertSecretInstanceMutationAllowed`, dedicated `actionLabel` `secrets.set` / `secrets.delete`). `?page=secrets` form sends plaintext once over the same transport as `/auth/login`; response is `{ set: true }` only.

**Read (server).** Boxed query `extractorInstancesByEntity` on `MiroirSecret` with `queryExecutionStrategy: "storage"`, then decrypt. Never return `ciphertext` on REST or MCP tool responses.

**Consume.** `ExternalServiceClient` takes optional `AuthPrincipal`. OAuth caches are principal-scoped (R1). Process names (`spotifyClientId`, `spotifyClientSecret`, AI keys) resolve process-scoped. `refreshTokenKey` prefers user-scoped then process-scoped. Rotation persists via injected `persistRotatedSecret` (D7, R2). Fail-closed messages say “missing secret `name` (process or user scope).”

**AI.** Startup import aliases (D6) + `getApiKey` → `resolveSecret`. Provider/model stay env / `AiConfiguration`.

**Principal thread (required for D2-b).** Add optional `principal` end-to-end:

`handleAction` → `handleApplicationAction` → `handleCompositeActionTemplate` / `handleCompositeAction` → `executeCompositeRunBoxedQueryAction` → `handleBoxedExtractorOrQueryAction` / `executeBoxedExtractorOrQueryAction` / `resolveExtractorFromActionInBoxedQuery` → `executeExternalServiceOperation` → `resolveAuthorizationHeader` / `resolveAuthorizationCodeToken` → `resolveSecret(name, principal)`.

`queryActionHandler` forwards `params.authPrincipal` into `handleBoxedExtractorOrQueryAction`. `/queryTemplate` does **not** host `extractorFromAction` (fails closed in store runners); do not thread principal there.

**MCP.** Out of scope for wrapping-key hydrate / identity (#263). **In** scope: redact MCP tool **responses** (R4).

### 5.1 Blast radius (R8)

Adding the 10th Admin entity is more than “new JSON + no menu item”:

1. **Test-asset copies.** Three packages carry partial `admin_model` copies with only **5 of 9** entities (AdminApplication, Deployment, bundle, ViewParams, ApplicationVersion — no MiroirUser / Credential / Right / AiConfiguration): `packages/miroir-core/tests/test_assets/admin_model/16dbfe28-…/`, `packages/miroir-mcp/tests/assets/admin_model/16dbfe28-…/`, `packages/miroir-standalone-app/tests/assets/admin_model/16dbfe28-…/`. Any emulated-filesystem test that needs `MiroirSecret` rows must add the entity (and seed data) to the copies its config actually reads. Tests that only `registerSecrets` do not need the entity in those copies.

2. **Filesystem-driven model validation.** `packages/miroir-test-app_deployment-admin/tests/modelValidation.unit.test.ts` builds its suite from `buildModelValidationGroupsFromFilesystem` over `admin_model` + `admin_data` — the new entity JSON is **auto-included**. A malformed `mlSchema` fails that suite immediately.

3. **Export convention.** `entityMiroirUserCredential` is exported from `packages/miroir-test-app_deployment-admin/index.ts:9`; `AiConfiguration` is not. Export `entityMiroirSecret` for symmetry with credentials. The uuid constant `ENTITY_MIROIR_SECRET_UUID` lives next to `ENTITY_MIROIR_USER_CREDENTIAL_UUID` in `AuthenticationPolicy.ts` (or on `SecretsService` if that deepens the module — one home, not two).

4. **Live-test env channel.** `spotifyLive.integ.test.ts` registers `LIVE_SPOTIFY_*` via `registerSecrets`. Test hatch only; not a D6 import alias; may keep `registerSecrets`.

---

## Next step

Implementation proceeds per [`./tdd-implementation-plan.md`](./tdd-implementation-plan.md) (to be written after this analysis is reviewed, following the `miroir-analysis-to-tdd-plan` skill).
