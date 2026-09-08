# Issue #71 — TDD Implementation Plan

> Vertical TDD slices (RED → GREEN each), integration-first per `docs/contributing/testing.md`.
> Tests exercise the real authentication policy module and the real `restServerDefaultHandlers`
> path (`RestClientStub` in-process; Express adapters on the server). No mocks.
> Tracer: with the hatch **off**, CRUD/action/query behave as today; with the hatch **on** and
> no token they are rejected; after `POST /auth/login` as `alice` / `alice-dev` they succeed
> with an `AuthPrincipal`.
>
> **Execution model:** human-in-the-loop in the skill sense (no `**Commit:**` lines in slices).
> Cloud-agent git/PR steps are outside this document.

Analysis: [`./analysis.md`](./analysis.md) · Issue: https://github.com/miroir-framework/miroir/issues/71  
Prerequisite: [`../219-FEATURE-preliminary User and Rights model in Admin app (prep for #71)/tdd-implementation-plan.md`](../219-FEATURE-preliminary%20User%20and%20Rights%20model%20in%20Admin%20app%20%28prep%20for%20%2371%29/tdd-implementation-plan.md) ✅  
Working branch: `cursor/71-user-authentication-08fb`

**Resume note:** Plan written; slices pending.

---

## Scope

- Startup hatch (`server.authentication.enabled` / `--disable-auth` / `--enable-auth` / `MIROIR_AUTH_ENABLED`), default **on**.
- `GET /auth/status`, `POST /auth/login`, `POST /auth/change-password`.
- `username` on `MiroirUser`; `MiroirUserCredential` + Alice seed hash (`alice-dev`).
- Bearer token; `AuthPrincipal` on REST + CopilotKit when enabled.
- Web `?page=login` gate + `RestClient` Authorization.
- Emulated/`RestClientStub` uses the same resolver and gate.
- Test launchers default `MIROIR_AUTH_ENABLED=0`; test JSON sets the hatch off.

This plan does **not** evaluate `MiroirRight`, gate MCP/CLI/Electron, add OIDC, or delete `monoUserAutentification` from client JSON (analysis non-goals).

---

## Seams under test

| Seam | Why |
|---|---|
| `resolveAuthenticationEnabled` | Hatch contract (CLI > env > JSON > default on) |
| `assertRequestAllowed` + handler dispatch | Observable 401 vs today’s passthrough |
| `POST /auth/login` / `GET /auth/status` / `POST /auth/change-password` | Public identity API |
| Admin assets (`MiroirUser.username`, `MiroirUserCredential`) | Applicative identity store |
| `handleAction(..., principal?)` | Principal is present after login, unread when hatch off |
| `shouldShowLoginPage` / `pageUrl("login")` | UI gate (no browser in core tests) |

**Vitest exception:** login and the HTTP gate are platform routes, not ML transformers/queries/endpoints. They are not reachable as MiroirTest `actionTest` without putting `/auth/login` on an Endpoint (which would sit behind the same gate). Helper + `RestClientStub` vitest is the integration path. Admin **model** changes still go through `modelValidation` + the existing `miroirUserRights` suite.

---

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Characterize open API + unread hatch stub + #219 users | ⬜ | `authentication.71.phase0` + `miroirUserRights` |
| 1 | Hatch + `/auth/status` + 401 when on without token | ⬜ | `authentication.71.phase1` |
| 2 | Username + credential entity + Alice seed + login + principal | ⬜ | Admin `modelValidation` + `authentication.71.phase2` |
| 3 | Login refusals (inactive / unknown / bad password) | ⬜ | `authentication.71.phase3` |
| 4 | Self-change password | ⬜ | `authentication.71.phase4` |
| 5 | Web login page + RestClient Bearer | ⬜ | `authentication.71.phase5` |
| 6 | CopilotKit gate, launchers, nonreg, docs, AC | ⬜ | nonreg step + docs + #219 enforcement still green |

---

## Locked implementation defaults

Copied from the analysis decision record. Deviations go in the slice Realization.

| Decision | Choice |
|---|---|
| D1 Scope | Identity only; no `MiroirRight` evaluation |
| D2 Default | Auth **on** if flag absent |
| D3 Hatch | CLI > env `MIROIR_AUTH_ENABLED` > `server.authentication.enabled` > on |
| D4 Off | Literal today |
| D5/D10/D15 | Password hash on `MiroirUserCredential`; scrypt; no credential reports |
| D6 | Gate REST + CopilotKit; MCP/CLI/Electron holes named |
| D7 | Same resolver in-process |
| D8 | `GET /auth/status` `{ enabled }`; do not use `monoUserAutentification` |
| D9 | `username` on `MiroirUser`; seed `alice` / `bob` |
| D11 | Bearer HMAC token; TTL 12h; secret from config/env or ephemeral |
| D12 | `?page=login` + gate |
| D13 | Seed Alice credential, password `alice-dev`; Bob has none |
| D14 | Self-change only |
| D16 | `AuthPrincipal` optional on `handleAction` |

---

## Allocated UUIDs / keys

| Artefact | Value |
|---|---|
| Entity `MiroirUserCredential` | `6c3ab489-1a36-4981-b5d0-bb3e02cfceed` |
| Seed credential (Alice) | `c179dcf9-f39b-4b16-b8d6-3e39895bfd35` |
| Existing `MiroirUser` | `d20d09e5-0685-4fc7-b9bd-fcfa3845127a` |
| Alice / Bob | `1c39328c-7de4-44ae-bcf1-5bbc38d8e267` / `95fa298f-79f8-428c-8980-3443d486c1d8` |
| Vitest issue dir | `packages/miroir-core/tests/4_services/issues/71-authentication/` |
| Admin issue tests (if any) | `packages/miroir-test-app_deployment-admin/tests/issues/71-authentication/` |
| Nonreg step | `unit-71-authentication` |

---

## Test execution conventions

| Purpose | Command |
|---|---|
| Slice 0–5 vitest | `RUN_TEST=authentication.71 npm run testByFile -w miroir-core -- authentication.71` |
| Admin #219 + credential model | `npm run testByFile -w miroir-test-app_deployment-admin -- miroirUserRights` |
| Admin modelValidation | `npm run testByFile -w miroir-test-app_deployment-admin -- modelValidation` |
| Admin build | `npm run build -w miroir-test-app_deployment-admin` |
| Schema rebuild (server config Jzod) | `npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core` |
| Type check | `npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json` and `-p packages/miroir-server/tsconfig.json` and `-p packages/miroir-standalone-app/tsconfig.json` as touched |
| #219 enforcement guard | `npm run testByFile -w miroir-test-app_deployment-admin -- miroirUserRights` (describe `no MiroirRight runtime enforcement`) |

---

## Slice 0 — Characterize current open API

**Status:** ⬜ pending

### Goal

Lock today’s contracts so later slices cannot silently change the off path or invent a `#219` rights engine.

### 0.1 RED → GREEN — Characterization

**Test:** `packages/miroir-core/tests/4_services/issues/71-authentication/authentication.71.phase0.unit.test.ts`  
(Vitest: not MiroirTest — there is no auth ML concept yet.)

Behavior asserted:

- `restServerDefaultHandlers` has exactly the seven CRUD/action/query routes listed in the analysis; **no** `/auth/*`.
- `DomainControllerInterface.handleAction` source (or a documented arity check) has no `principal` / `AuthPrincipal` parameter yet — after Slice 2 this assertion **moves** to “optional last argument, unused when undefined.”
- `monoUserAutentification` appears in `MiroirConfig.ts` and is **not** referenced as a read in `packages/miroir-core/src/**/*.ts` except that type file.
- `GET /auth/status` is not a registered default handler.

**Test (Admin, extend existing):** in `miroirUserRights.unit.test.ts` or `tests/issues/71-authentication/authentication.71.phase0.unit.test.ts`:

- `MiroirUser` `mlSchema.definition` keys are exactly `name`, `status`, `description` (no `username` yet — Slice 2 flips this).
- No Admin entity named `MiroirUserCredential`.
- Alice/Bob seeds have no `username` and no sibling credential files.

Keep the existing `#219` “no enforcement symbols” test unchanged.

### Validation

```bash
RUN_TEST=authentication.71.phase0 npm run testByFile -w miroir-core -- authentication.71.phase0
npm run testByFile -w miroir-test-app_deployment-admin -- miroirUserRights
```

### Realization

<Appended on completion.>

---

## Slice 1 — Tracer: hatch, status, reject unauthenticated when on

**Status:** ⬜ pending

### Goal

An operator can turn authentication **on** or **off** at startup. Callers can read `{ enabled }`. When on and there is no Bearer principal, the REST handler table is rejected; when off, behavior matches Slice 0 (literal today).

**Layers cut:** Jzod `miroirConfigServer.authentication` → resolver → `assertRequestAllowed` → `RestClientStub` / (notes for) Express wrap.

### 1.1 RED

**Test:** `authentication.71.phase1.unit.test.ts`

Behavior asserted (known literals, not recomputed):

- `resolveAuthenticationEnabled({ argv: ["--disable-auth"] })` → `false`.
- `resolveAuthenticationEnabled({ argv: ["--enable-auth"] })` → `true` (wins over env/json off).
- `resolveAuthenticationEnabled({ env: { MIROIR_AUTH_ENABLED: "0" } })` → `false`.
- `resolveAuthenticationEnabled({ config: { enabled: false } })` → `false`.
- `resolveAuthenticationEnabled({})` → `true` (default on).
- Precedence: CLI disable beats env `1` beats config `true`.
- `buildAuthStatusBody(false)` → `{ enabled: false }`; `buildAuthStatusBody(true)` → `{ enabled: true }`.
- `assertRequestAllowed({ enabled: false, principal: undefined })` is allowed.
- `assertRequestAllowed({ enabled: true, principal: undefined })` is denied (401).
- `assertRequestAllowed({ enabled: true, principal: { miroirUserUuid: "1c39328c-7de4-44ae-bcf1-5bbc38d8e267", username: "alice" } })` is allowed.
- A thin `dispatchGatedRestHandler` (or `RestClientStub` once wired) with hatch **off** still returns handler data / status 200 for a registered route (smoke with a fake handler or the real table if a controller is cheap). With hatch **on** and no `Authorization`, status **401**.

Do **not** implement login in this slice.

### 1.2 GREEN

- Add `authentication?: { enabled?: boolean; tokenSecret?: string }` to `miroirConfigServer` in `getMiroirFundamentalJzodSchema.ts`; rebuild miroir + `devBuild` miroir-core.
- New module `packages/miroir-core/src/1_core/authentication/AuthenticationPolicy.ts` (deep module): resolver, status body, assert, types `AuthPrincipal`.
- Wire `RestClientStub.call` to run the assert before `restServerDefaultHandlers` when a process-level policy is set; default policy in tests is **off** unless the test sets it.
- `server.ts`: parse `--disable-auth` / `--enable-auth`; read config/env; wrap `operationHandler` with the assert; add `GET /auth/status`.
- Export the policy API from `miroir-core` `index.ts`.
- Test launchers: if `MIROIR_AUTH_ENABLED` is unset, set `0`.

### 1.3 Refactor checkpoint

- One precedence function; no copy-paste in server vs stub.
- No Express types inside `AuthenticationPolicy.ts`.

### Validation

```bash
npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core
RUN_TEST=authentication.71 npm run testByFile -w miroir-core -- authentication.71
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-server/tsconfig.json
```

### Realization

<Appended on completion.>

---

## Slice 2 — Login binds a `MiroirUser` (tracer completion)

**Status:** ⬜ pending

### Goal

A platform user can `POST /auth/login` with `alice` / `alice-dev` and then call a gated REST route with the returned Bearer token. The domain receives `AuthPrincipal` `{ miroirUserUuid: Alice, username: "alice" }`.

**Layers cut:** Admin Entity `username` + `MiroirUserCredential` assets → hash/verify/token in policy → `/auth/login` → stub/Express → `handleAction` optional principal.

### 2.1 RED

**Admin:** extend `miroirUserRights` / new `authentication.71.admin.unit.test.ts`:

- `MiroirUser` definition includes required `username` (string).
- Entity `MiroirUserCredential` uuid `6c3ab489-1a36-4981-b5d0-bb3e02cfceed` exists; fields `miroirUser` (FK unique), `passwordHash`; **no** reports named `MiroirUserCredential*`; **no** Admin menu item for credentials.
- Alice seed has `username: "alice"`; Bob `username: "bob"`.
- Exactly one credential instance `c179dcf9-…` pointing at Alice; Bob has none.
- `passwordHash` is not in `viewAttributes`.
- Credential entity uuid is **not** in `ADMIN_MODEL_PARENT_UUIDS_ARRAY` (data section).
- Package `index.ts` exports `entityMiroirUserCredential` and the Alice credential (hash may be exported; tests must not print it as the expected **password** — expected password is the literal `alice-dev`, hash is verified by `verifyPassword`).

**Core:** `authentication.71.phase2.unit.test.ts`

- `hashPassword("alice-dev")` then `verifyPassword("alice-dev", hash)` is true; `verifyPassword("wrong", hash)` is false.
- `issueBearerToken` / `verifyBearerToken` round-trip Alice’s principal with a fixed test secret `test-secret-71`; expired / tampered tokens fail.
- `loginWithPassword({ username: "alice", password: "alice-dev" }, lookup)` using **real** Admin seed JSON (imported, not a hand-copied fixture) returns that principal + token.
- `dispatchGatedRestHandler` with hatch on + `Authorization: Bearer <token>` is allowed and passes `AuthPrincipal` into a recorder `handleAction`.
- Slice 0 “no username / no credential entity” assertions are **updated** to the new shape (do not keep the old negative as the live contract).

### 2.2 GREEN

- Add `username` to `MiroirUser` `mlSchema` + Alice/Bob instances; add `username` to `viewAttributes`.
- Add `MiroirUserCredential` entity JSON + Alice seed (precomputed scrypt hash for `alice-dev`).
- Export from admin `index.ts`; rebuild admin package.
- Policy: `hashPassword`, `verifyPassword`, `issueBearerToken`, `verifyBearerToken`, `loginWithPassword` (lookup injected — Admin store or in-test loader of real JSON).
- `POST /auth/login` on Express; stub dispatch for `/auth/login` and `/auth/status` (or a shared `authHttpHandlers` table next to `restServerDefaultHandlers`).
- Optional `principal?: AuthPrincipal` on `handleAction` (and query handlers used by REST). Server/stub extract from Bearer and pass it. When hatch off, omit / `undefined`.
- Strip `passwordHash` on any generic instance serialization path that would return credentials to a client (if a code path already returns arbitrary instances).

### 2.3 Refactor checkpoint

- Token + password live only in the policy module.
- `handleAction` signature change is optional-last; existing call sites compile without passing it.
- #219 enforcement scan still empty.

### Validation

```bash
npm run build -w miroir-test-app_deployment-admin
npm run testByFile -w miroir-test-app_deployment-admin -- modelValidation
npm run testByFile -w miroir-test-app_deployment-admin -- miroirUserRights
RUN_TEST=authentication.71 npm run testByFile -w miroir-core -- authentication.71
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
```

### Realization

<Appended on completion.>

---

## Slice 3 — Login refusals

**Status:** ⬜ pending

### Goal

Failed login does not authenticate and does not leak whether the username exists.

### 3.1 RED

**Test:** `authentication.71.phase3.unit.test.ts`

- `bob` / any password → 401, no token (inactive).
- `alice` / `wrong` → 401.
- `nobody` / `alice-dev` → 401.
- Response body shape is the same for the three cases (e.g. `{ status: "error", errorType: "AuthenticationFailed" }` — pick one literal and lock it).
- Empty username or password → 401 / 400 (lock one; prefer 401 for consistency).

### 3.2 GREEN

Minimal branches in `loginWithPassword`. Inactive check is identity (`status === "active"`), not a `MiroirRight` read.

### 3.3 Refactor checkpoint

- Single failure constructor; no per-case message that names the user.

### Validation

```bash
RUN_TEST=authentication.71.phase3 npm run testByFile -w miroir-core -- authentication.71.phase3
```

### Realization

<Appended on completion.>

---

## Slice 4 — Self-change password

**Status:** ⬜ pending

### Goal

An authenticated user can change **their** password; the old password stops working; another user’s credential is untouched.

### 4.1 RED

**Test:** `authentication.71.phase4.unit.test.ts`

- Login as alice → `changePassword({ principal: Alice, currentPassword: "alice-dev", newPassword: "alice-new" })` succeeds.
- Login with `alice-dev` then fails; `alice-new` succeeds.
- Wrong `currentPassword` → 401; hash unchanged.
- Unauthenticated change-password → 401.
- A second in-memory credential (if needed) is not modified — prove 1:1 update by `miroirUser` uuid.

Use an injected credential store (in-memory map seeded from the **real** Alice JSON, then updated) so the test does not write Admin assets.

### 4.2 GREEN

- `POST /auth/change-password` + policy `changePassword`.
- Persist: in the real server, update the Admin data instance (filesystem/sql/etc. via DomainController **with** principal). First increment may keep change-password as a policy function that the server persists through existing `updateInstance` **only for the principal’s credential**. Do not add an “update any credential” action.

### 4.3 Refactor checkpoint

- No generic editor path required.
- New password hashed with the same `hashPassword`.

### Validation

```bash
RUN_TEST=authentication.71.phase4 npm run testByFile -w miroir-core -- authentication.71.phase4
```

### Realization

<Appended on completion.>

---

## Slice 5 — Web login gate and RestClient Bearer

**Status:** ⬜ pending

### Goal

When status is enabled and there is no token, the UI shows `?page=login`. After login, `RestClient` sends `Authorization: Bearer`. When status is disabled, no login chrome.

**Layers cut:** `pageUrl("login")` → `PageDispatcher` case + gate helper → token holder → `RestClient` headers.

### 5.1 RED

**Test:** `packages/miroir-standalone-app/tests/...` **or** `packages/miroir-core/tests/4_services/issues/71-authentication/authentication.71.phase5.unit.test.ts` if the gate helper lives in core/react.

Prefer a pure helper in `miroir-core` or `miroir-react` tested without a browser:

- `nextPageWhenAuthGate({ enabled: false, hasToken: false, intended: "/?page=home" })` → intended (no redirect).
- `nextPageWhenAuthGate({ enabled: true, hasToken: false, intended: "/?page=report&…" })` → `/?page=login&return=…` (or equivalent documented query).
- `nextPageWhenAuthGate({ enabled: true, hasToken: true, intended })` → intended.
- `authorizationHeaders(undefined)` → `{}` / no Authorization.
- `authorizationHeaders("tok")` → `{ Authorization: "Bearer tok" }`.

**Test (source scan, thin):** `PageDispatcher` has `case "login"`; `navigation.ts` documents `page=login`.

Vitest justified: this is React routing, not a MiroirTest report.

### 5.2 GREEN

- `LoginPage` (username, password, submit → `/auth/login` or in-process `loginWithPassword`).
- Gate wrapper around `PageDispatcher` / `PageContent`.
- Token holder (memory + `sessionStorage` key `miroir.auth.token`).
- `RestClient` / persistence client merges Bearer when a token is set (injectable getter — do not read `window` inside `RestClient` constructor if tests cannot supply it).
- Emulated: status from resolver, not fetch, when `emulateServer: true`.

### 5.3 Refactor checkpoint

- No `useEffect` beyond what routing already uses; prefer render-time redirect (`Navigate`) from the gate helper result.
- Do not read `monoUserAutentification`.

### Validation

```bash
RUN_TEST=authentication.71.phase5 npm run testByFile -w miroir-core -- authentication.71.phase5
# if UI tests live in standalone-app:
RUN_TEST=authentication.71 npm run testByFile -w miroir-standalone-app -- authentication.71
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
```

### Realization

<Appended on completion.>

---

## Slice 6 — CopilotKit gate, launchers, nonreg, docs, AC

**Status:** ⬜ pending

### Goal

R1 surface complete; tests stay on the off path by default; docs and nonreg know the hatch; leftover issue-dir cleanup if assertions are already feature-stable.

### 6.1 CopilotKit

When hatch on and no Bearer, `/api/copilotkit` returns 401 (except a documented health path if it must stay public — prefer gating the whole mount). Test: policy assert reused; no CopilotKit mock.

### 6.2 Launchers and configs

- `scripts/test-by-file.ts` / `scripts/test-miroir-runner.ts` / nonreg env: default `MIROIR_AUTH_ENABLED=0`.
- Add `server.authentication.enabled: false` to committed **server** test configs that already have a `server` object; for client-only test JSON, rely on the launcher env **and** a documented `authentication.enabled: false` at the top level or under `client` **only as in-process server settings** read by the resolver (not as UI truth).
- Default `packages/miroir-server/config/miroirConfig.server.json`: omit the field (auth on) **or** set `enabled: true` explicitly. Prefer omit + documented default.

### 6.3 Nonreg

- Add `unit-71-authentication` to `scripts/nonreg-manifest.json` running `authentication.71` on miroir-core (and admin `miroirUserRights` if not already covered).

### 6.4 Docs

- `analysis.md` status → implemented when slices 1–5 are green.
- Short note in `docs/guides/build-it-yourself.md` (or a new `docs/reference/authentication.md` if that file is the right home): hatch knobs, `alice` / `alice-dev`, R3 holes (MCP/CLI/Electron).
- `docs/index.md` still lists security.md as coming soon — add a one-line pointer to the new reference rather than a fake “best practices” essay.

### 6.5 Issue-directory cleanup

- If phase files can collapse into `tests/4_services/authentication.unit.test.ts` without losing AC, do it here and delete `issues/71-authentication/` per #238. Otherwise leave the issue dir until the branch is accepted.

### 6.6 Tracer bullet (narrative)

1. Start `miroir-server` **without** `--disable-auth` (auth on).
2. `GET /auth/status` → `{ "enabled": true }`.
3. `GET /CRUD/...` without `Authorization` → 401.
4. `POST /auth/login` `{ "username": "alice", "password": "alice-dev" }` → token.
5. Repeat CRUD with `Authorization: Bearer <token>` → 200 / data.
6. Restart with `--disable-auth`; step 3 succeeds without a token; UI shows no login page.

Automated equivalent: phase1 + phase2 vitest.

### 6.3 Refactor checkpoint

- Confirm `AuthenticationPolicy.ts` has no Express import.
- #219 enforcement test green.
- `monoUserAutentification` still unread.

### Validation

```bash
RUN_TEST=authentication.71 npm run testByFile -w miroir-core -- authentication.71
npm run testByFile -w miroir-test-app_deployment-admin -- miroirUserRights
# after launchers: a representative emulated integ still passes (hatch off)
VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-filesystem.json npm run testByFile -w miroir-standalone-app -- DomainController.integ
```

### Realization

<Appended on completion.>

---

## AC checklist (#71)

| Criterion | Proven by | Status |
|---|---|---|
| User can be securely authenticated (username/password → `MiroirUser`) | Slice 2 login test | ⬜ |
| Shared remote webapp: unauthenticated REST rejected when enabled | Slice 1 401 | ⬜ |
| Hatch restores present behavior (tests/nonreg) | Slice 1 off path + launchers + Slice 6 | ⬜ |
| Hatch is CLI/config/env, not Admin/app data | Slice 1 resolver tests; no Admin flag entity | ⬜ |
| UI hidden when off; login page when on | Slice 5 | ⬜ |
| Self-change password | Slice 4 | ⬜ |
| Inactive cannot authenticate | Slice 3 | ⬜ |
| No `MiroirRight` evaluation | #219 enforcement scan | ⬜ |
| R3 holes documented; token/principal reusable | Slice 6 docs + policy module | ⬜ |
