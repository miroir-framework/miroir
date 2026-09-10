# 71 — User authentication

> Identity proofing for a shared remote Miroir server: username/password against Admin
> `MiroirUser` + `MiroirUserCredential`, Bearer token, startup kill-switch that restores
> today’s open API. Rights evaluation is out of this increment.

Related issue: https://github.com/miroir-framework/miroir/issues/71  
Prerequisite: [#219 Preliminary User and Rights model](https://github.com/miroir-framework/miroir/issues/219) ✅ — [`../219-FEATURE-preliminary User and Rights model in Admin app (prep for #71)/analysis.md`](../219-FEATURE-preliminary%20User%20and%20Rights%20model%20in%20Admin%20app%20%28prep%20for%20%2371%29/analysis.md)  
Key sources: [`packages/miroir-server/src/server.ts`](../../../packages/miroir-server/src/server.ts) · [`packages/miroir-core/src/4_services/RestServer.ts`](../../../packages/miroir-core/src/4_services/RestServer.ts) · [`packages/miroir-core/src/3_controllers/DomainController.ts`](../../../packages/miroir-core/src/3_controllers/DomainController.ts) · [`packages/miroir-core/src/4_services/RestClient.ts`](../../../packages/miroir-core/src/4_services/RestClient.ts) · [`packages/miroir-core/src/4_services/RestClientStub.ts`](../../../packages/miroir-core/src/4_services/RestClientStub.ts)

**Document role:** analysis and architectural decision record (decisions confirmed with the user in the grilling rounds).  
**Status:** implemented on `cursor/71-user-authentication-08fb` (slices 0–6). See TDD plan.

### Surface scope labels (R1 / R2 / R3)

Which callers are rejected when auth is on. These are grilling-option IDs kept as names in this document (D6).

| Label | Surfaces gated | Surfaces left open |
|---|---|---|
| **R1** | REST `CRUD` / `action` / `query` / `queryTemplate` and CopilotKit `/api/copilotkit` on `miroir-server` (:3080). SPA/static and `/auth/*` stay public (change-password still needs a Bearer). | MCP (`mcpUrl`, default :4080), `miroir-cli` token client, Electron IPC. Named holes. CLI against an auth-on server gets 401. |
| **R2** | Every HTTP listener, including MCP. | CLI token flag and Electron IPC. |
| **R3** | The whole product: REST, CopilotKit, MCP, CLI login/token flag, Electron IPC. | None of those doors. |

This increment implements **R1** and is designed so **R3** is later “apply the same gate,” not a rewrite (`AuthPrincipal`, `extractPrincipalFromAuthorizationHeader`, `assertRequestAllowed`, `resolveAuthenticationEnabled` stay process-agnostic). R3 is the end goal, not done here.

---

## Sequencing

| Step | Issue | Status |
|---|---|---|
| Platform user + rights **model only** | [#219](https://github.com/miroir-framework/miroir/issues/219) | ✅ |
| Identity proofing + hatch (this document) | **#71 (this increment)** | **this** |
| Gate MCP, CLI token client, Electron IPC with the same principal/token | #71 remainder / follow-up | later (R3) |
| Evaluate `MiroirRight` (capability / target) | follow-up of #71 | later |
| Groups / roles as grant subjects | #219 C4 deferred | later |
| OIDC / passkeys | unscheduled | later |

Issue text: *“The user shall be securely authenticated. Useful in the case of webapp access via a (remote) server, shared among many users.”*

#219 already listed this increment’s job as: authentication strategy, bind principal → `MiroirUser`. It explicitly deferred enforcement of `MiroirRight`.

---

## Decision record

Confirmed with the user (grilling rounds). ★ = accepted.

| ID | Question | Choice |
|---|---|---|
| D1 | Increment scope | **A — identity only.** Login, token, bind `MiroirUser`. No `MiroirRight` evaluation. |
| D2 | Default when flag absent | **On** for the server process. Tests/nonreg/emulated set the hatch off. |
| D3 | Hatch location | **S3 — server-owned.** Config JSON + CLI override + env. Not Admin / Miroir / user-app data. Client is not the source of truth. |
| D4 | Hatch “off” semantics | **Literal today.** No login UI, no 401, no principal, handlers unread. |
| D5 | Credential mechanism | **P — password** stored as a hash on a **separate** Admin entity (D10). |
| D6 | Surfaces gated now vs later | **R1 now, designed for R3.** Gate REST `CRUD` / `action` / `query` + CopilotKit. SPA/static + `/auth/*` public. MCP :4080, CLI token client, Electron IPC: documented holes, same principal/token types so they can reuse the gate later. |
| D7 | Emulated / in-process hatch | **E1.** Same resolver: env + in-process startup JSON. Most nonreg never starts `miroir-server`. |
| D8 | How the UI learns | **U1.** Public `GET /auth/status` → `{ enabled: boolean }`. In-process UI calls the same resolver. |
| D9 | Login id | **N2.** New unique `username` on `MiroirUser`. `name` stays display. |
| D10 | Secret storage | **H2.** `MiroirUserCredential` (not a hash column on `MiroirUser`). |
| D11 | Wire proof | **T1.** `Authorization: Bearer <token>`. One scheme for later CLI/MCP/Electron. |
| D12 | Login UI | **L1.** `?page=login` + gate when status is enabled and no token. |
| D13 | Bootstrap | **B1.** Seed **one** credential (Alice) with a documented **dev** password. Not a crowned admin. |
| D14 | Who changes passwords | **P1.** Self-change + bootstrap. No “edit others.” Generic editor is not the password UX. |
| D15 | Credential shape | **K1.** 1:1 `miroirUser` FK, `passwordHash`, optional `algorithm`. No credential reports. Client reads strip the hash. |
| D16 | Principal plumbing | **C1.** `AuthPrincipal \| undefined` threaded into REST handlers → `handleAction` / query handlers. `undefined` and unread when hatch is off. |

**Rationale:** prove identity on the only trust boundary that exists (the process that runs `restServerDefaultHandlers`), keep every current test on the open-API path, and leave a typed principal/token so R3 is an apply-the-same-gate job, not a rewrite.

### D1 — Increment scope

**Status:** Accepted — identity only.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D1-a. Identity only** ★ | Login + token + `MiroirUser` bind; reject unauthenticated callers when enabled | Matches the issue sentence; #219 already owns the rights *model* | Shared server still has no allow/deny by app/deployment |
| D1-b. Identity + “must be logged in” only | Same as D1-a (the gate *is* authenticated-vs-not) | — | Duplicate of D1-a |
| D1-c. Full stack | Evaluate `MiroirRight` now | Completes #219’s “follow-up” list in one branch | Capability taxonomy still free-string; product-sized |
| D1-d. Hatch only | Flag exists, no login | Cheap | Does not implement the issue |

**Decision:** D1-a. Rights evaluation is a later issue. The #219 source-scan test (`checkMiroirRight` / `authorizeMiroir` / `hasMiroirAccess` / `evaluateMiroirRight`) must stay green.

### D2 — Default

**Status:** Accepted — on unless disabled.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D2-a. On unless disabled** ★ | Resolver default `true`; test launchers + test JSON force `false` | Issue text is the product default; forgotten hatch in production is closed | Every test process must set the hatch |
| D2-b. Off unless enabled | Resolver default `false` | Current tests need no change | A forgotten flag ships an open server |

**Decision:** D2-a. Belt: test launchers set `MIROIR_AUTH_ENABLED=0` unless already set, **and** committed test configs carry the off value.

### D3 — Hatch location

**Status:** Accepted — server JSON + CLI + env.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| D3-a. Server JSON only | `server.authentication.enabled` | Matches existing `--config` | Awkward for CI one-liners |
| D3-b. Server CLI only | `--disable-auth` | Obvious | No durable setting |
| **D3-c. JSON + CLI + env** ★ | CLI > env > JSON > default on | Fits `server.ts` argv loop and `npm run nonreg` | Three knobs; document precedence |
| D3-d. Client JSON only | Reuse `monoUserAutentification` | Field already exists | Client is not a trust boundary; field has **never been read** (see §3.5) |
| D3-e. Both must agree | Client and server booleans AND | — | Easy to misconfigure; rejected |

**Decision:** D3-c. Names (implementation defaults, not reopened):

| Knob | Name |
|---|---|
| Config | `server.authentication.enabled` (boolean) |
| CLI | `--disable-auth` / `--enable-auth` |
| Env | `MIROIR_AUTH_ENABLED` (`0`/`false`/`off` → disabled; `1`/`true`/`on` → enabled) |

Not stored on Admin / Miroir / Library / any user-app instance.

`miroirConfigServer` in [`getMiroirFundamentalJzodSchema.ts`](../../../packages/miroir-core/src/0_interfaces/1_core/bootstrapJzodSchemas/getMiroirFundamentalJzodSchema.ts) currently lists only `rootApiUrl`, `mcpUrl?`, `filesystemDeploymentRootDirectory`. Runtime already reads **extra** keys via `as any`: `corsAllowedOrigins`, `assetsMountPath`. This increment **does** add `authentication` to that Jzod object (and thus to generated `MiroirConfigServer`) so the hatch is typed, following the schema-first rule rather than growing another untyped `as any`.

Token secret (D11): `server.authentication.tokenSecret` or env `MIROIR_AUTH_TOKEN_SECRET`. If auth is on and both are absent: generate an ephemeral secret and log a warning (tokens die on process restart). Tests that enable auth pass a fixed secret.

### D4 — “Off” means literal today

**Status:** Accepted.

When disabled:

| Surface | Behavior |
|---|---|
| REST `CRUD` / `action` / `query` | Same as master: no 401, no principal argument used |
| Login chrome | Not rendered |
| `GET /auth/status` | `{ enabled: false }` (new public endpoint; does not change CRUD behavior) |
| MCP / CLI / Electron | Unchanged (already open) |

A hidden default `Alice` principal is **rejected** (that would change test meaning).

### D5 / D10 / D15 — Password and credential entity

**Status:** Accepted — hash on `MiroirUserCredential`, not on `MiroirUser`.

| Option | Verdict |
|---|---|
| Hash column on `MiroirUser` | Rejected — generic User editor / list/detail reports would see or accept a secret |
| **Separate `MiroirUserCredential`** ★ | Accepted — secret record, 1:1 FK, no reports |
| Sidecar users file next to `--config` | Rejected — second user store; drifts from #219 |
| API key only | Rejected — does not bind a `MiroirUser` |
| OIDC | Deferred — IdP in every dev/test story |

Shape:

| Attribute | Notes |
|---|---|
| `uuid` | Default Miroir PK |
| `miroirUser` | FK → `MiroirUser` `d20d09e5-0685-4fc7-b9bd-fcfa3845127a`, unique |
| `passwordHash` | scrypt (Node `crypto.scrypt`); never in `viewAttributes`, never returned to clients |
| `algorithm` | optional string, seed `"scrypt"` |

No `MiroirUserCredential` list/detail reports, no Admin menu item. Create/update only via dedicated `/auth/*` actions (bootstrap seed + self-change). Generic instance CRUD on this entity is not the supported password UX; hashes are stripped on any client-facing read of the instance.

### D6 — Surfaces (R1 now, R3 later)

**Status:** Accepted.

| Door | This increment | Later (R3) |
|---|---|---|
| REST `/CRUD/*`, `/action/*`, `/query`, `/queryTemplate` | **Gated** | same |
| `/api/copilotkit` | **Gated** (same Express app) | same |
| SPA / static / `GET /auth/status` / `POST /auth/login` / `POST /auth/change-password` (auth required on change) | Public except change-password | same |
| MCP HTTP `:4080` | **Open hole** (named) | apply `extractPrincipal` + `assertRequestAllowed` |
| `miroir-cli` | No token flag; 401 against an auth-on server | send Bearer |
| Electron IPC | Unchanged local path | same principal type on IPC |

Design-for-R3 (must exist now): `AuthPrincipal`, `extractPrincipalFromAuthorizationHeader`, `assertRequestAllowed`, `resolveAuthenticationEnabled` are process-agnostic (no Express types in the core module).

### D7 — Emulated path

**Status:** Accepted — same resolver.

`RestClientStub.call` dispatches `restServerDefaultHandlers` in-process and **always returns `status: 200`** today. When the hatch is on, the stub must apply the same gate and can return 401. When off, keep today’s 200 + handler result.

Test JSON (in-process “server” config) may carry `server.authentication.enabled: false`. Launchers also set `MIROIR_AUTH_ENABLED=0`.

### D8 — Status advertisement

**Status:** Accepted — `GET /auth/status` → `{ enabled: boolean }` only (no secret, no user).

`monoUserAutentification` is **legacy, unread, removable later**. Do not wire the hatch through it (see §3.5).

Commented `GET /api/serverConfig` in `server.ts` stays unused; do not revive it as a kitchen-sink config dump.

### D9 — Login identifier

**Status:** Accepted — `username` on `MiroirUser`.

`name` values today are display strings (`"Alice Admin"`, `"Bob Inactive"`). Seed usernames: `alice`, `bob`.

### D11 — Bearer token

**Status:** Accepted.

HMAC-signed token (no new JWT dependency required; Node `crypto` is enough). Payload: `miroirUser` uuid + `username` + expiry. Default TTL 12h. Web client stores the token and sends `Authorization: Bearer`. Cookie-only is rejected (hostile to R3).

CORS already lists `Authorization` in `allowedHeaders`.

### D12 — Login UI

**Status:** Accepted — `?page=login` in `PageDispatcher`. When `/auth/status` (or in-process resolver) says enabled and there is no token, navigate to login and preserve the intended query string for return. When disabled, no login chrome (D4).

### D13 — Bootstrap (not a default admin)

**Status:** Accepted — one seeded credential.

Alice/Bob exist only because #219 seeded two `MiroirUser` rows. They are **not** a product role. This increment does **not** crown Alice as password administrator.

Chicken-and-egg: auth defaults on; without one working hash, a fresh server is a brick. Seed **one** `MiroirUserCredential` for Alice (`1c39328c-7de4-44ae-bcf1-5bbc38d8e267`) with documented password `alice-dev`. Bob has **no** credential. `status !== "active"` cannot authenticate even if a hash exists.

Real deployments must change that password (self-change, D14).

### D14 — Password administration

**Status:** Accepted — self + bootstrap only.

Because D1 does not evaluate rights, a dedicated “admin sets Bob’s password” action would be theater or a wide-open hole. `POST /auth/change-password` requires a valid Bearer and updates **that** user’s credential only.

### D16 — Principal

**Status:** Accepted — explicit `AuthPrincipal | undefined`.

```typescript
type AuthPrincipal = {
  miroirUserUuid: string;
  username: string;
};
```

Added as an optional argument on `handleAction` / query handlers (last, optional). When the hatch is off, callers omit it or pass `undefined`; implementation does not read it. Express middleware (and `RestClientStub`) *extracts*; the domain sees a value, not `IncomingMessage`.

`AsyncLocalStorage`-only was rejected (hidden control flow). “Check only in Express” was rejected (`RestClientStub` and later IPC would each reinvent the gate).

---

## 1. Goals

1. **Prove identity** — In order to use a shared remote webapp without others acting as me, as a platform user, I can log in with my `username` and password.
2. **Open-API hatch** — In order to keep non-regression on today’s behavior, as a test operator, I can disable authentication at process startup via server config, CLI, or env — not via Admin or any application model.
3. **Learn if login is required** — In order to avoid login chrome when the hatch is off, as a report viewer, I can read `{ enabled }` from the server (or the in-process resolver).
4. **Call the API as me** — In order to keep using reports and actions after login, as a platform user, I can send a Bearer token that the server binds to my `MiroirUser`.
5. **Change my own password** — In order to stop using the seeded dev password, as a platform user, I can change only my credential.
6. **Inactive cannot enter** — In order not to treat deactivated accounts as live, as an operator, I know a `status` other than `active` cannot authenticate.

## 2. Non-goals

- Evaluating `MiroirRight` / capability / target (follow-up; #219 C2 remains free-string).
- MCP port gate, CLI `--token`, Electron IPC identity (R3).
- OIDC, passkeys, magic links.
- Groups / roles as grant subjects (#219 C4).
- Cookie as the only session proof.
- Password reset email, invite, lockout, audit log.
- Generic Admin editor as password UX; credential list/detail reports.
- Deleting the `monoUserAutentification` field from every client JSON (legacy; removable later).
- Library `User` (`ca794e28-b2dc-45b3-8137-00151557eea8`) — domain lending data, not platform identity.

---

## 3. Current state

Facts below were enumerated from assets (Python listing of Admin model/data) and read from the cited functions. `graphify-out/graph.json` is absent in this workspace.

### 3.1 No request identity (misaligned with target)

`DomainController.handleAction` takes action, deployment map, model environment, endpoint map, param values — **no principal**:

```2872:2878:packages/miroir-core/src/3_controllers/DomainController.ts
  async handleAction(
    domainAction: DomainAction, // TODO: actions from other applications can be handled, too!
    applicationDeploymentMap: ApplicationDeploymentMap,
    currentModelEnvironment?: MiroirModelEnvironment,
    endpointApplicationMap?: EndpointApplicationMap,
    actionParamValues?: Record<string, unknown>,
  ): Promise<Action2VoidReturnType> {
```

`server.ts` registers `restServerDefaultHandlers` and passes `request.body` / params / query only — it never reads `Authorization` (the header is only **allowed** by CORS):

```203:209:packages/miroir-server/src/server.ts
const app = express();
app.use(cors({
  origin: corsAllowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

Handler invocation (no identity):

```414:424:packages/miroir-server/src/server.ts
      await op.handler(
        true, // useDomainControllerToHandleModelAndInstanceActions
        (response: any) => response.json.bind(response),
        response,
        persistenceStoreControllerManager,
        domainController,
        op.method,
        request.originalUrl,
        body,
        { ...request.params, ...request.query }
      );
```

Gated route set (this increment) is exactly `restServerDefaultHandlers`:

```593:630:packages/miroir-core/src/4_services/RestServer.ts
export const restServerDefaultHandlers: RestServiceHandler[] = [
  { method: "get", url: "/CRUD/:deploymentUuid/:section/entity/:parentUuid/all", handler: restMethodGetHandler },
  { method: "put", url: "/CRUD/:deploymentUuid/:section/entity", handler: restMethodsPostPutDeleteHandler },
  { method: "post", url: "/CRUD/:deploymentUuid/:section/entity", handler: restMethodsPostPutDeleteHandler },
  { method: "delete", url: "/CRUD/:deploymentUuid/:section/entity", handler: restMethodsPostPutDeleteHandler },
  { method: "post", url: "/action/:actionType", handler: restActionHandler },
  { method: "post", url: "/queryTemplate", handler: queryTemplateActionHandler },
  { method: "post", url: "/query", handler: queryActionHandler },
];
```

Plus `/api/copilotkit` on the same Express app (`server.ts` around the `createCopilotKitRouter` mount). MCP is a **second** Express app on `mcpUrl` (default port 4080).

`GET /api/serverConfig` is commented out; there is no `/auth/*`.

### 3.2 Client never sends credentials (misaligned)

`RestClient.call` sets `Content-Type` only; custom headers can be merged if a caller passes them — nothing does today:

```27:36:packages/miroir-core/src/4_services/RestClient.ts
    const { body, ...customConfig } = args;
    const headers = { "Content-Type": "application/json" };

    const config = {
      method: method,
      ...customConfig,
      headers: {
        ...headers,
        ...customConfig.headers,
      },
    };
```

### 3.3 Emulated server always looks like HTTP 200 (misaligned when hatch is on)

```107:113:packages/miroir-core/src/4_services/RestClientStub.ts
      return {
        status: 200,
        data: result,
        headers: new Headers(),
        url: this.rootApiUrl + endpoint,
      };
```

Lookup is `restServerDefaultHandlers.find(h => h.method == method && h.url == rawUrl)`. New `/auth/*` routes are **not** in that table unless we add them or give the stub a second dispatch path.

### 3.4 Server startup already has a config/CLI/env pattern (aligned)

`printUsageAndExit` + argv loop in `server.ts` (`--config`, `--certsdir`, `--cert`, `--key`, `-h`). Config default `../config/miroirConfig.server.json`. TLS also reads `MIROIR_TLS_CERT` / `MIROIR_TLS_KEY`. Logging reads `MIROIR_LOG_CONFIG`. The hatch extends this loop; it does not invent a new process.

Web client has **no CLI**. Runtime config is a compile-time import in `packages/miroir-standalone-app/src/index.tsx` (`webMiroirConfigName = "miroirConfigRealServerFilesystemGit"`). Tests load JSON via `VITE_MIROIR_TEST_CONFIG_FILENAME`.

### 3.5 `monoUserAutentification` is unread legacy (aligned with “do not use it”)

Declared on `MiroirConfigRoot` since 2023-02-27 (`1cd1d278`):

```7:11:packages/miroir-core/src/0_interfaces/1_core/MiroirConfig.ts
  deploymentMode: 'monoUser';
  monoUserAutentification: boolean;
  monoUserVersionControl: boolean;
  versionControlForDataConceptLevel: boolean;
```

Copied as `false` through every client/test JSON found (standalone-app assets, tests, CI configs, library/postgres extract scripts). **No** TypeScript file reads the value. The only other hit is a commented example in `TransformerBuilderPage.tsx`. Git history (`git log -S` / `git grep` on HEAD) shows declaration and JSON assignment only.

Truth table:

| `monoUserAutentification` | Runtime effect today |
|---|---|
| `false` (all committed files) | None |
| `true` (if someone set it) | None |

### 3.6 Admin platform users exist; they cannot authenticate (aligned model, misaligned identity)

Enumerated from `packages/miroir-test-app_deployment-admin/assets`.

| Kind | Name | UUID | Notes |
|---|---|---|---|
| Entity | `MiroirUser` | `d20d09e5-0685-4fc7-b9bd-fcfa3845127a` | fields `name`, `status`, `description`; **no** `username`; **no** password |
| Entity | `MiroirRight` | `a6136fc7-949b-4d64-9f13-dd3afce1ab3c` | decorative grants; not evaluated |
| Entity | `MiroirUserCredential` | — | **absent** |
| User seed | Alice Admin | `1c39328c-7de4-44ae-bcf1-5bbc38d8e267` | `status: "active"`; no `username` |
| User seed | Bob Inactive | `95fa298f-79f8-428c-8980-3443d486c1d8` | `status: "inactive"`; no `username` |
| Right seed | Alice Library app `admin` | `48b2048f-507f-40ee-a890-b6eca83596f5` | `targetType: application` |
| Right seed | Alice Library deployment `read` | `587f92f8-7140-434b-b9ff-f7f5d2e461b2` | `targetType: deployment` |
| Reports | `MiroirUserList` / `Details` / `MiroirRightList` / `Details` | `c8aa168d-…` / `c9de2107-…` / `42994013-…` / `fbe615b3-…` | four reports, no credential report |
| Menu | Users / Rights | AdminMenu `dd168e5a-…` | `section: data`; no Credentials item |

Admin data parent directories: **8** (`AdminApplication`, `Deployment`, `AiConfiguration`, `bundle`, `MiroirRight`, `ViewParams`, `MiroirUser`, `ApplicationVersion`). User and right instances live under `admin_data/` (data section), not in `ADMIN_MODEL_PARENT_UUIDS_ARRAY` — same rule as Application/Deployment (#219).

Library `User` `ca794e28-b2dc-45b3-8137-00151557eea8` is a **different** entity (lending demo).

#219 test `no MiroirRight runtime enforcement` scans core/server/stores for enforcement symbol names and expects zero hits. This increment must not introduce those names.

### 3.7 UI routing (aligned for a login page)

`PageDispatcher` switches on `?page=` (`home`, `report`, `transformerBuilder`, `runners`, `check`, `error-logs`, `events`, `settings`, `search`, `model`). Unknown `page` → `Navigate` to `/?page=home`. No `login` case. Helpers live in `navigation.ts` (`pageUrl`).

### 3.8 npm auth libraries (aligned with “implement ourselves”)

No `passport`, `jsonwebtoken`, `bcrypt`, `argon2`, or `oauth` in package manifests. Hash + token use Node `crypto`.

---

## 4. Key reuse

| Piece | Location |
|---|---|
| `MiroirUser` entity | uuid `d20d09e5-0685-4fc7-b9bd-fcfa3845127a` |
| Alice / Bob seeds | `1c39328c-7de4-44ae-bcf1-5bbc38d8e267` / `95fa298f-79f8-428c-8980-3443d486c1d8` |
| Admin asset inventory helpers | `packages/miroir-test-app_deployment-admin/tests/helpers/adminAssetInventory.ts` |
| #219 model tests | `packages/miroir-test-app_deployment-admin/tests/miroirUserRights.unit.test.ts` |
| Server argv + `--config` | `packages/miroir-server/src/server.ts` `printUsageAndExit` / argv loop |
| Extra server JSON keys pattern | `corsAllowedOrigins`, `assetsMountPath` (`as any` today; hatch is typed instead) |
| CORS `Authorization` already allowed | `server.ts` `allowedHeaders` |
| REST handler table | `restServerDefaultHandlers` |
| In-process server | `RestClientStub` |
| Client header merge | `RestClient.call` `customConfig.headers` |
| Query-param pages | `PageDispatcher` / `pageUrl` |
| `MiroirConfigServer` Jzod | `getMiroirFundamentalJzodSchema.ts` → `miroirConfigServer` |
| Test profile env | `packages/miroir-standalone-app/tests/helpers/integrationTestProfiles.ts` |

---

## 5. Target design (not a phase list)

Deep module in `miroir-core` (name in the TDD plan): **authentication policy** — resolve hatch, hash/verify password, issue/verify token, extract principal, assert request allowed. Express and `RestClientStub` are adapters.

```
startup config/CLI/env ──► resolveAuthenticationEnabled
Authorization header   ──► extractPrincipalFromAuthorizationHeader ──► AuthPrincipal | undefined
                         ──► assertRequestAllowed(enabled, principal)
username + password    ──► verify against MiroirUser + MiroirUserCredential (active only)
                         ──► issueBearerToken
```

When `enabled === false`, `assertRequestAllowed` succeeds with `principal === undefined` and domain code does not read it.

Public HTTP (real server):

| Method | Path | Auth |
|---|---|---|
| GET | `/auth/status` | none |
| POST | `/auth/login` | none; body `{ username, password }` |
| POST | `/auth/change-password` | Bearer; body `{ currentPassword, newPassword }` |

Login failures: unknown user, inactive, missing credential, bad password → same 401 shape (no user enumeration).

Web: fetch status (or call resolver in-process); gate `PageDispatcher`; `RestClient` attaches Bearer from an in-memory / `sessionStorage` holder.

---

## Next step

Implementation proceeds per [`./tdd-implementation-plan.md`](./tdd-implementation-plan.md).
