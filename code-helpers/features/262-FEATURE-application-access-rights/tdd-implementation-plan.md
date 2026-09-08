# Issue #262 — TDD Implementation Plan

> Vertical TDD slices (RED → GREEN each), integration-first per `docs/contributing/testing.md`.
> Tests exercise the real `AccessPolicy` module against Admin seed JSON, then the real
> `RestClientStub` / `assertRequestAllowed` + `assertAccess` path. No mocks.
> Tracer: hatch **off** is unchanged; hatch **on**, Alice can query Library and Carol cannot
> (403); both can query Admin / Miroir; the Application selector hides Library for Carol.
>
> **Execution model:** human-in-the-loop. No slice contains a commit step — commits happen
> only when the user explicitly asks. Each slice ends with its Validation commands; on
> success its Realization summary is appended and its Status flips to ✅ DONE.

Analysis: [`./analysis.md`](./analysis.md) · Issue: https://github.com/miroir-framework/miroir/issues/262  
Prerequisite: [`../219-FEATURE-preliminary User and Rights model in Admin app (prep for #71)/tdd-implementation-plan.md`](../219-FEATURE-preliminary%20User%20and%20Rights%20model%20in%20Admin%20app%20%28prep%20for%20%2371%29/tdd-implementation-plan.md) ✅ · [`../71-FEATURE-user-authentication/tdd-implementation-plan.md`](../71-FEATURE-user-authentication/tdd-implementation-plan.md) ✅  
Working branch: `cursor/262-application-access-rights`

**Resume note:** Slices 0–5 DONE.

---

## Scope

- Category-generic `hasAccess` / `assertAccess` (`targetType` + `targetUuid`).
- Always-allow Admin + Miroir applications for any authenticated principal.
- Any `MiroirRight` on `(user, application, uuid)` = access; `capability` ignored.
- REST `CRUD` / `action` / `query`: after identity, resolve deployment → `selfApplication`, 403 `AccessDenied` if denied.
- Hatch off: no access check (#71 D4).
- UI: hide denied apps in the selector; deep-link to a denied application does not show that app.
- Carol seed (`carol` / `carol-dev`, no application grants).

This plan does **not** evaluate deployment-scoped grants, harden capability taxonomy, add groups/roles, or gate MCP/CLI/Electron (analysis non-goals).

---

## Seams under test

| Seam | Why |
|---|---|
| `hasAccess` | Evaluator contract (always-allow, grant match, capability ignored, no principal) |
| Admin seed JSON (`MiroirRight`, users, deployments) | Applicative grants + Carol |
| `assertAccess` + `RestClientStub` / handler dispatch | Observable 403 vs 200 after a valid token |
| `applicationTargetForDeployment` | REST mapping; unknown deployment denies |
| `visibleApplicationTargets` (or equivalent) | Selector filter helper — same `hasAccess` |
| `nextPageWhenAccessDenied` / PageDispatcher | Deep-link does not render a denied app |

**Vitest exception:** access is a platform policy + HTTP gate, not an ML transformer/query/endpoint. Same justification as #71. Helper tests **import real Admin JSON**, not inline grant copies. Admin asset changes still go through `modelValidation` + `miroirUserRights`.

---

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Characterize open access + #219 scan + seed grants | ✅ | `access.262.phase0` + `miroirUserRights` |
| 1 | `hasAccess` on real Admin assets (tracer) | ✅ | `access.262.phase1` |
| 2 | Carol seed + login | ✅ | `access.262.phase2` + `miroirUserRights` |
| 3 | REST 403 / allow via deployment → application | ✅ | `access.262.phase3` |
| 4 | UI selector + deep-link hide | ✅ | `access.262.phase4` |
| 5 | Nonreg, docs, scan retirement, AC | ✅ | nonreg step + docs |

---

## Locked implementation defaults

Copied from the analysis decision record. Deviations go in the slice Realization.

| Decision | Choice |
|---|---|
| R1 Scope | Application evaluation; generic checker |
| R2 Grant | Any row for `(user, targetType, targetUuid)`; ignore capability |
| R3 Always-allow | Admin `55af124e-8c05-4bae-a3ef-0933d41daa92`, Miroir `360fcf1f-f0d4-4f8a-9262-07886e70fa15` |
| R4 Hatch off | No rights check |
| R5 Surfaces | REST 403 + UI hide; MCP/CLI/Electron holes |
| R6 REST | `Deployment.selfApplication` → application target; unknown deployment deny |
| R7 Always-allow encoding | `alwaysAllow: AccessTarget[]` injected |
| R8 Carol | `30634877-08ae-44f3-a230-d899e22333d5` / credential `23f39cd9-f56e-4400-bd87-87e5d51798c1` / `carol-dev` |
| R9 Interface | `hasAccess` / `assertAccess` in `AccessPolicy.ts`; not the four #219 banned names |

---

## Allocated UUIDs / keys

| Artefact | Value |
|---|---|
| Carol `MiroirUser` | `30634877-08ae-44f3-a230-d899e22333d5` |
| Carol `MiroirUserCredential` | `23f39cd9-f56e-4400-bd87-87e5d51798c1` |
| Existing `MiroirRight` entity | `a6136fc7-949b-4d64-9f13-dd3afce1ab3c` |
| Alice Library application grant | `48b2048f-507f-40ee-a890-b6eca83596f5` |
| Alice Library deployment grant (unevaluated) | `587f92f8-7140-434b-b9ff-f7f5d2e461b2` |
| Vitest issue dir | `packages/miroir-core/tests/4_services/issues/262-application-access/` |
| Nonreg step | `unit-262-application-access` |

Carol password (documented, like Alice): **`carol-dev`**. Hash with the same scrypt scheme as Alice at implementation time.

---

## Test execution conventions

| Purpose | Command |
|---|---|
| Slice 0–4 vitest | `RUN_TEST=access.262 npm run testByFile -w miroir-core -- access.262` |
| Admin model + users/rights | `npm run testByFile -w miroir-test-app_deployment-admin -- miroirUserRights` |
| Admin modelValidation | `npm run testByFile -w miroir-test-app_deployment-admin -- modelValidation` |
| Admin build | `npm run build -w miroir-test-app_deployment-admin` |
| Type check | `npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json` (and `miroir-server` / `miroir-standalone-app` when touched) |
| #71 identity still green | `RUN_TEST=authentication.71 npm run testByFile -w miroir-core -- authentication.71` |

---

## Slice 0 — Characterize current open access

**Status:** ✅ DONE

### Goal

Lock today’s contracts: identity gate only, no access module, seed grants as enumerated, #219 scan still forbids the four old names.

### 0.1 RED → GREEN — characterization

**Test:** `packages/miroir-core/tests/4_services/issues/262-application-access/access.262.phase0.unit.test.ts`

**Vitest exception:** not reachable as MiroirTest; locks TS + JSON contracts.

Behavior asserted:

- `assertRequestAllowed({ enabled: true, principal: alice })` is `{ allowed: true }` with **no** application/deployment argument (today’s signature).
- Admin seed JSON: exactly two `MiroirRight` files; Alice has Library application grant `48b2048f-…`; Alice has Library deployment grant `587f92f8-…`; no Carol user file.
- `hasAccess` is not exported from `miroir-core` yet (import fails or function absent) — **or** assert the source file `AccessPolicy.ts` does not exist.

Also run existing `miroirUserRights` `no MiroirRight runtime enforcement` (still green until Slice 1/5).

### Validation

```bash
RUN_TEST=access.262.phase0 npm run testByFile -w miroir-core -- access.262.phase0
npm run testByFile -w miroir-test-app_deployment-admin -- miroirUserRights
```

### Realization

Characterization tests lock today’s identity-only gate (`assertRequestAllowed` has no target), the two Alice `MiroirRight` seeds, absence of Carol, and absence of `AccessPolicy.ts`. `miroirUserRights` enforcement scan still green. No production code changed.

---

## Slice 1 — `hasAccess` on real Admin assets (tracer)

**Status:** ✅ DONE

### Goal

A caller can ask whether a principal may access a `(targetType, targetUuid)` and get the product answers for the existing seeds — without HTTP or UI yet.

**Layers cut:** Admin JSON (read-only) → `AccessPolicy.ts` → public export.

### 1.1 RED

**Test:** `access.262.phase1.unit.test.ts`

Load real files under `packages/miroir-test-app_deployment-admin/assets/admin_data/` (rights, not copies).

Behavior asserted:

- Alice + `{ application, Library }` → true (grant `48b2048f-…`; capability `admin` is irrelevant).
- Alice + `{ application, Designer }` → false (no grant).
- Alice + `{ application, Admin }` → true (always-allow, no grant row).
- Alice + `{ application, Miroir }` → true (always-allow).
- No principal + Library → false.
- Alice + `{ deployment, Library deployment }` → **false** this increment (deployment grants are not treated as application access; the test calls `hasAccess` with `targetType: "deployment"` only to prove the matcher is exact — there is no always-allow deployment target, and we **do not** pass deployment grants as if they were application grants).
- A grant with `capability: "no-such-cap"` still matches if user/type/uuid match (inline one extra grant object **in addition to** real files, or mutate a copy in-memory — do not rewrite seed JSON).

### 1.2 GREEN

Add `AccessPolicy.ts` with `hasAccess`, `assertAccess`, `ALWAYS_ALLOW_APPLICATION_TARGETS`, `accessGrantsFromInstances`. Export from `index.ts`. Do not touch HTTP yet.

### 1.3 Refactor checkpoint

- Keep identity (`AuthenticationPolicy`) free of grant matching.
- `alwaysAllow` is a parameter; platform constants are a named list, not `if (uuid === ADMIN)`.

### Validation

```bash
RUN_TEST=access.262 npm run testByFile -w miroir-core -- access.262
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
```

### Realization

Added `AccessPolicy.ts` (`hasAccess`, `assertAccess`, `ALWAYS_ALLOW_APPLICATION_TARGETS`, `accessGrantsFromInstances`). Tests load real Admin right JSON and pass **application-typed** grants only, so Alice + `{ deployment, Library deployment }` is false without making the evaluator ignore `targetType`. Capability is not a match key. Did not re-export `MIROIR_APPLICATION_UUID` from `index.ts` (already exported by `evolutionTracePolicy.ts`). Phase 0 now asserts `AccessPolicy.ts` exists.

---

## Slice 2 — Carol seed + login

**Status:** ✅ DONE

### Goal

Carol can sign in and is a principal with **no** application grants (Admin/Miroir only via always-allow).

**Layers cut:** Admin user + credential JSON → identity directory → `hasAccess` + `loginWithPassword`.

### 2.1 RED

**Test:** `access.262.phase2.unit.test.ts` + extend `miroirUserRights`

Behavior asserted:

- Admin data contains Carol user `30634877-…`, `username: "carol"`, `status: "active"`.
- One credential `23f39cd9-…` for Carol; `loginWithPassword({ username: "carol", password: "carol-dev" }, real directory)` succeeds.
- `hasAccess` Carol + Library → false; Carol + Admin → true.
- Still exactly two `MiroirRight` instances (Carol has none).
- Bob still cannot login.

### 2.2 GREEN

Add Carol user + credential assets; export from admin `index.ts` if that is the package convention; `npm run build -w miroir-test-app_deployment-admin`. Hash `carol-dev` with the same helper as Alice.

### 2.3 Refactor checkpoint

- Reuse `hashPassword` / seed style from #71; no new hash scheme.

### Validation

```bash
npm run build -w miroir-test-app_deployment-admin
npm run testByFile -w miroir-test-app_deployment-admin -- modelValidation
npm run testByFile -w miroir-test-app_deployment-admin -- miroirUserRights
RUN_TEST=access.262 npm run testByFile -w miroir-core -- access.262
RUN_TEST=authentication.71 npm run testByFile -w miroir-core -- authentication.71
```

### Realization

Added Carol user `30634877-…` (`carol` / active) and credential `23f39cd9-…` (`carol-dev`, scrypt, no `description` — credential mlSchema has no description field). Login succeeds; Library `hasAccess` is false; Admin always-allow is true. Loosened #71 “exactly one credential file” to “one Alice credential and none for Bob” so Carol’s file is allowed. `modelValidation` still reports pre-existing Entity/`description` issues on Alice’s credential and the Entity rows; Carol’s instance no longer adds a new failure.

---

## Slice 3 — REST 403 after identity

**Status:** ✅ DONE

### Goal

With auth on, a valid Carol token cannot run CRUD/query/action against the Library **deployment**; Alice can. Both can hit Admin / Miroir deployments. Hatch off unchanged.

**Layers cut:** access directory query (rights + deployments) → `applicationTargetForDeployment` → `assertAccess` after `assertRequestAllowed` in `RestClientStub` and `server.ts`.

### 3.1 RED

**Test:** `access.262.phase3.unit.test.ts` via `handleAuthHttpRoute` / `RestClientStub` (same path as #71 phase 1–2).

Behavior asserted:

- Hatch off: Library query/action without token still succeeds (today).
- Hatch on, Alice token, Library `deploymentUuid` `f714bb2f-…`: allowed.
- Hatch on, Carol token, same Library deployment: **403** `{ errorType: "AccessDenied" }` (not 401).
- Hatch on, Carol token, Admin deployment `18db21bf-…` or Miroir `10ff36f2-…`: allowed.
- Hatch on, Carol token, Designer deployment `f0359240-…`: 403.
- Hatch on, Alice token, unknown `deploymentUuid`: 403.
- Hatch on, no token: still **401** (access not reached).

### 3.2 GREEN

Extend Admin boxed query (or a sibling load) to extract `MiroirRight` + `Deployment`. Map grants/deployments in the policy module. After `assertRequestAllowed`, compute application target from the request’s `deploymentUuid` and `assertAccess`. Fail closed if the deployment is missing.

### 3.3 Refactor checkpoint

- One load function for identity **and** access directories if that removes a second round-trip; do not merge grant matching into `assertRequestAllowed`.
- `RestClientStub` and Express `server.ts` stay adapters.

### Validation

```bash
RUN_TEST=access.262 npm run testByFile -w miroir-core -- access.262
RUN_TEST=authentication.71 npm run testByFile -w miroir-core -- authentication.71
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-server/tsconfig.json
```

### Realization

Added `applicationTargetForDeployment`, `deploymentsFromInstances`, and `assertAccessForDeployment` (hatch off skips rights; unknown deployment is 403). `RestClientStub` and Express CRUD/query/action run that after identity. Admin boxed query now also loads `MiroirRight` + `Deployment` in one trip. CopilotKit stays identity-only (no `deploymentUuid`). Emulated Vite stub now includes Carol plus the four deployment rows so hatch-on local REST can resolve targets.

---

## Slice 4 — UI hide + deep-link

**Status:** ✅ DONE

### Goal

Carol does not see Library or Designer in the application selector and cannot stay on a Library report URL. Alice still sees Library. Hatch off: selector unchanged (Library + Designer).

**Layers cut:** `hasAccess` helper for visible apps → `ApplicationSelector` filter and/or a wrapper used by the sidebar → `PageDispatcher` when `application` query is present.

### 4.1 RED

**Test:** `access.262.phase4.unit.test.ts` (pure helpers, same as #71 `nextPageWhenAuthGate`).

Behavior asserted:

- `visibleUserApplications({ enabled: false, … })` returns Library + Designer (today’s FK set).
- `enabled: true`, Alice → Library yes, Designer no.
- `enabled: true`, Carol → neither Library nor Designer.
- Admin and Miroir are **not** in this list (selector already excludes them); always-allow is irrelevant here except that we do not hide tools menus.
- `nextPageWhenAccessDenied({ enabled: true, hasAccess: false, intended: "/?page=report&application=5af03c98-…" })` leaves login-style or home — **does not** keep the denied report. Exact URL locked in the test (home `/?page=home` unless a dedicated forbidden page is added; default: `/?page=home`, no new page).

### 4.2 GREEN

Implement the helpers; wire selector filter (narrow `targetEntityFilterInstancesBy` **or** filter instances before display — prefer a helper that yields allowed uuids so the FK `values` list is data, not a second policy). PageDispatcher: if hatch on and `application` is set and `hasAccess` is false → `<Navigate>` to home.

Do **not** add `useEffect` for this (derive from session + URL).

### 4.3 Refactor checkpoint

- UI calls `hasAccess`; it does not reimplement grant matching.
- Sidebar Admin/Miroir blocks stay gated only by `showModelTools` (always-allow apps).

### Validation

```bash
RUN_TEST=access.262 npm run testByFile -w miroir-core -- access.262
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
```

Manual (after GREEN): log in as `carol` / `carol-dev` — selector has no Library; log in as `alice` / `alice-dev` — Library present.

### Realization

`visibleUserApplications` and `nextPageWhenAccessDenied` live next to the #71 login gate. Selector adds denied Library/Designer uuids to the existing NOT-IN filter. `PageDispatcher` navigates to `/?page=home` when hatch is on, Admin data is loaded, and the URL application is not granted. Filter stays off until Admin Application rows are in cache so Alice is not bounced before rights load. Sidebar Admin/Miroir tools are unchanged.

---

## Slice 5 — Nonreg, docs, scan retirement, AC

**Status:** ✅ DONE

### 5.1 Nonreg

- Add `unit-262-application-access` to `scripts/nonreg-manifest.json` (`RUN_TEST=access.262` on `miroir-core`).

### 5.2 Docs

- `docs/reference/authentication.md`: rights **are** evaluated for applications; hatch-off still skips them; 403 vs 401; Carol / Alice matrix.
- `analysis.md` status → implemented.
- Update #219 analysis “Follow-up” to point at #262 (enforcement landed).
- Delete or replace `no MiroirRight runtime enforcement` in `miroirUserRights.unit.test.ts`: the four old names must still be absent; `hasAccess` / `AccessPolicy` are allowed.

### 5.3 Issue-directory cleanup

- Keep `tests/4_services/issues/262-application-access/` until a later cleanup issue, **or** rename to `access/` if the assertions are already feature-stable. Prefer keeping the issue directory until #238-style cleanup; do not delete in the same PR as the first landing unless the tests are already named `access.262.*` and listed in nonreg (they are).

### 5.4 Tracer bullet (narrative)

1. Auth on. Sign in `carol` / `carol-dev`. Application selector has no Library / Designer. Admin/Miroir tools still available when model tools are on. Opening a Library report URL lands on home. Refresh/query against Library deployment returns 403.
2. Sign out. Sign in `alice` / `alice-dev`. Library appears; Library reports and queries succeed.
3. Auth off. No login. Library selector and Library REST behave as today.

Automated equivalent: `access.262` phases 1–4 + `authentication.71`.

### AC checklist (#262)

| Criterion | Proven by | Status |
|---|---|---|
| Grant on application → access | phase1 + phase3 Alice Library | ✅ |
| No grant → no access | phase1 Designer / phase3 Carol Library | ✅ |
| Admin + Miroir always | phase1 + phase3 Carol Admin/Miroir | ✅ |
| Capability ignored | phase1 extra-capability grant | ✅ |
| Checker is `(targetType, targetUuid)` | phase1 deployment target does not ride the application grant | ✅ |
| Hatch off = today | phase3 hatch-off | ✅ |
| REST 403 vs 401 | phase3 | ✅ |
| UI hide + deep-link | phase4 (helpers + selector/PageDispatcher wiring) | ✅ |
| Carol seed | phase2 + `miroirUserRights` | ✅ |

### Validation

```bash
RUN_TEST=access.262 npm run testByFile -w miroir-core -- access.262
RUN_TEST=authentication.71 npm run testByFile -w miroir-core -- authentication.71
npm run testByFile -w miroir-test-app_deployment-admin -- miroirUserRights
```

### Realization

Added `unit-262-application-access` to the nonreg manifest. Docs now describe application evaluation, 403 vs 401, and the Alice/Carol matrix. The #219 scan still bans the four old names; `hasAccess` / `AccessPolicy` are the live symbols. Issue-directory tests stay under `262-application-access/`. In-browser carol/alice click-through still wants a hatch-on server because `/auth/status` and `/auth/login` go through `window.fetch` to :3080.
