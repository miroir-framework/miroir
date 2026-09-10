# 262 — Application-level user access rights

> Evaluate Admin `MiroirRight` so a signed-in user can open an application’s data and UI
> only when granted. The checker is keyed by `(targetType, targetUuid)` so Deployment
> (or another category) can be added later without changing the evaluator.

Related issue: https://github.com/miroir-framework/miroir/issues/262  
Parent: [#71 User authentication](https://github.com/miroir-framework/miroir/issues/71) ✅ identity · Prerequisite: [#219 User and Rights model](https://github.com/miroir-framework/miroir/issues/219) ✅ — [`../219-FEATURE-preliminary User and Rights model in Admin app (prep for #71)/analysis.md`](../219-FEATURE-preliminary%20User%20and%20Rights%20model%20in%20Admin%20app%20%28prep%20for%20%2371%29/analysis.md)  
Related analyses: [`../71-FEATURE-user-authentication/analysis.md`](../71-FEATURE-user-authentication/analysis.md)  
Key sources: [`AuthenticationPolicy.ts`](../../../packages/miroir-core/src/1_core/authentication/AuthenticationPolicy.ts) · [`server.ts`](../../../packages/miroir-server/src/server.ts) · [`RestServer.ts`](../../../packages/miroir-core/src/4_services/RestServer.ts) · [`ApplicationSelector.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/interactive/ApplicationSelector.tsx) · [`Sidebar.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Page/Sidebar.tsx) · [`MiroirRight` entity](../../../packages/miroir-test-app_deployment-admin/assets/admin_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/a6136fc7-949b-4d64-9f13-dd3afce1ab3c.json)

**Document role:** analysis and architectural decision record (decisions confirmed with the user).  
**Status:** implemented — [`./tdd-implementation-plan.md`](./tdd-implementation-plan.md).

## Acceptance Criteria

Testable contract for this increment. Proven by `access.262` (phases 1–4), `authentication.71`, and Admin `miroirUserRights`. All items are met.

- [x] A `MiroirRight` on `(user, targetType=application, targetUuid)` grants that application’s data and UI. `capability` is ignored (any grant counts).
- [x] No matching application grant → no access to that application’s data or UI.
- [x] Admin (`55af124e-8c05-4bae-a3ef-0933d41daa92`) and Miroir (`360fcf1f-f0d4-4f8a-9262-07886e70fa15`) are accessible to every authenticated user without a per-user grant.
- [x] Designer and Library require an explicit grant. Alice has Library. Carol (`carol` / `carol-dev`) has no application grants and is denied Library and Designer.
- [x] A deployment-scoped grant does not grant application access. Deployment rights stay stored; they are not evaluated.
- [x] The checker is keyed by `(targetType, targetUuid)` plus principal, grants, and an always-allow list. It does not hard-code Application vs Deployment.
- [x] When authentication is disabled, rights are not evaluated (today’s open API).
- [x] REST after a successful identity check: denied application → **403** `AccessDenied`. Missing or unusable identity still **401**. Unknown `deploymentUuid` → deny (403).
- [x] REST maps `deploymentUuid` → `Deployment.selfApplication`, then checks application access.
- [x] UI hides ungranted applications from the selector and menus. A deep link to a denied application does not show that app’s UI (home).
- [x] MCP, CLI, and Electron stay ungated in this increment (follow-up [#263](https://github.com/miroir-framework/miroir/issues/263)).
- [x] The four #219 banned names stay unused: `checkMiroirRight`, `authorizeMiroir`, `hasMiroirAccess`, `evaluateMiroirRight`.
- [x] Nonreg includes `unit-262-application-access` (`access.262`).

---

## Sequencing

| Step | Issue | Status |
|---|---|---|
| Platform user + rights **model only** | [#219](https://github.com/miroir-framework/miroir/issues/219) | ✅ |
| Identity proofing + hatch | [#71](https://github.com/miroir-framework/miroir/issues/71) | ✅ |
| **Application access evaluation** | **#262 (this document)** | ✅ |
| Deployment-level evaluation (same checker, new callers) | [#264](https://github.com/miroir-framework/miroir/issues/264) | later |
| Capability taxonomy (`read` / `write` / `admin`) | #219 C2 deferred | later |
| Groups / roles as grant subjects | #219 C4 deferred | later |
| Gate MCP / CLI / Electron | #71 R3 | later |

#71 D1 deferred `MiroirRight` evaluation and required the #219 source-scan (`checkMiroirRight` / `authorizeMiroir` / `hasMiroirAccess` / `evaluateMiroirRight`) to stay green. This issue **retires that scan** and introduces a category-generic access module under names that are not those four symbols.

---

## Decision record

Confirmed with the user (2026-09-08). ★ = accepted.

| ID | Question | Choice |
|---|---|---|
| R1 | Increment scope | **Application access only.** Checker is category-generic. Deployment grants stay stored, not evaluated. |
| R2 | What a grant means | **Any** `MiroirRight` row for `(user, targetType, targetUuid)` is access. `capability` is ignored. |
| R3 | Always-allow applications | **Admin** and **Miroir** for every authenticated user. Designer and Library need an explicit grant. |
| R4 | Hatch off | Same as #71 D4: no principal, **no rights check**, today’s open API. |
| R5 | Trust boundary | REST `CRUD` / `action` / `query` (+ CopilotKit if it already shares the auth gate). Denied → **403** `AccessDenied`. UI hides denied apps (not a trust boundary). MCP / CLI / Electron remain #71 holes. |
| R6 | REST mapping | Resolve `deploymentUuid` → `Deployment.selfApplication`, then check `{ targetType: "application", targetUuid }`. Unknown deployment → deny. |
| R7 | Always-allow encoding | **Constant target list** passed into the checker (not seed rows per user). |
| R8 | Denied-user seed | **Carol**: active, credential, **no** application grants. Alice keeps her Library grant. Bob stays inactive / no credential. |
| R9 | Checker interface | `hasAccess({ principal, target, grants, alwaysAllow })` — evaluator never mentions Application or Deployment. |

**Rationale:** #219 already stored polymorphic grants. This increment turns on the first caller (application) behind a deep module whose interface is the grant’s own shape. Later Deployment callers add a new adapter (how to name the target), not a new evaluator.

### R1 — Increment scope

**Status:** Accepted — application access; generic checker.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **R1-a. Application now, generic checker** ★ | Evaluate `targetType === "application"` at call sites; evaluator matches any `(targetType, targetUuid)` | Matches the request; Deployment later is a new caller | Deployment seed rows stay decorative |
| R1-b. Evaluate application **and** deployment now | Same checker, two call sites | Uses both seed rows | Product did not ask for deployment gating yet |
| R1-c. Application-only function | `canAccessApplication(appUuid)` | Shorter first cut | Must rewrite when Deployment lands |

**Decision:** R1-a.

### R2 — Grant meaning

**Status:** Accepted — any grant on that target.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **R2-a. Any grant** ★ | Ignore `capability` | Matches “granted access to an application”; #219 C2 stays free-string | Seed `admin` / `read` look meaningful but are not |
| R2-b. `capability === "access"` | Exact string | Explicit | No seed uses `"access"`; would need a migration |
| R2-c. Allow-list `read` / `write` / `admin` | Small enum | Looks like taxonomy | Hardens C2 before it is designed |

**Decision:** R2-a. Taxonomy remains #219 C2 / a later issue.

### R3 — Always-allow applications

**Status:** Accepted — Admin + Miroir only.

Enumerated AdminApplication instances (4):

| uuid | name |
|---|---|
| `55af124e-8c05-4bae-a3ef-0933d41daa92` | Admin |
| `360fcf1f-f0d4-4f8a-9262-07886e70fa15` | Miroir |
| `5af03c98-fe5e-490b-b08f-e1230971c57f` | Library |
| `880831db-4f76-40b1-97c0-6a2f3f4ffccb` | Designer |

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **R3-a. Admin + Miroir constants** ★ | `alwaysAllow` contains those two `{ targetType: "application", targetUuid }` | Matches “meta-app and admin apps”; new users get them without seed rows | Designer is **not** free |
| R3-b. Seed a grant per user | Two `MiroirRight` rows each | Visible in Admin reports | New users miss the platform apps |
| R3-c. All four applications free | — | — | Contradicts “granted access” |

**Decision:** R3-a. Designer requires a grant (none exist in seed).

### R4 — Hatch off

**Status:** Accepted — no rights when auth is off.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **R4-a. Skip rights when hatch off** ★ | `assertRequestAllowed` still short-circuits; access is not called | Preserves #71 D4 / all current tests | A forgotten hatch is still an open API |
| R4-b. Rights even when hatch off | Need a principal or anonymous user | — | Breaks “literal today” |

**Decision:** R4-a.

### R5 — Surfaces

**Status:** Accepted — server 403 + UI hide.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **R5-a. REST + UI** ★ | After identity, `assertAccess`; selector/menus filter; deep-link gate | UI is not the trust boundary | Two adapters (HTTP, view) |
| R5-b. UI only | Hide Library from Carol | Cheap | REST still serves Library to Carol’s token |
| R5-c. REST only | 403, selector still lists Library | Secure | Poor UX |

**Decision:** R5-a. MCP / CLI / Electron stay #71 D6 holes.

Denied HTTP body:

```ts
{ status: "error", errorType: "AccessDenied" }
```

Status **403** (authenticated, not authorized). 401 remains “no / bad principal”.

### R6 — REST mapping

**Status:** Accepted — deployment → `selfApplication` → application target.

REST handlers take `deploymentUuid` (`/CRUD/:deploymentUuid/…`; action/query body `deploymentUuid` or `applicationDeploymentMap[application]` — [`RestServer.ts` `restMethodsPostPutDeleteHandler`](../../../packages/miroir-core/src/4_services/RestServer.ts) lines 252–253). They do **not** receive a trusted application uuid.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **R6-a. Resolve Deployment.selfApplication** ★ | Load Admin Deployment instances; map uuid → `selfApplication` | Client cannot spoof application | Extra directory (deployments) |
| R6-b. Trust `body.application` | Use the client field | Simpler | Carol can send Library’s deployment with Admin’s application uuid |

**Decision:** R6-a. Missing / unknown `deploymentUuid` → deny.

Enumerated Deployments (4) and their `selfApplication`:

| deployment uuid | name | selfApplication |
|---|---|---|
| `10ff36f2-50a3-48d8-b80f-e48e5d13af8e` | DefaultMiroirApplicationDeployment | Miroir `360fcf1f-…` |
| `18db21bf-f8d3-4f6a-8296-84b69f6dc48b` | AdminApplicationFilesystemDeployment | Admin `55af124e-…` |
| `f714bb2f-a12d-4e71-a03b-74dcedea6eb4` | LibraryApplicationFilesystemDeployment | Library `5af03c98-…` |
| `f0359240-e849-4546-8158-75f4a8ae5831` | DesignerApplicationFilesystemDeployment | Designer `880831db-…` |

### R7 — Always-allow encoding

**Status:** Accepted — constant list injected into the checker.

The evaluator takes `alwaysAllow: AccessTarget[]`. Platform constants live **beside** the evaluator (same module), not inside the match loop as special cases of Application. Adding “always allow these deployments” later is another constant list, same parameter.

### R8 — Carol

**Status:** Accepted — new active user, no application grants.

| User | uuid | username | status | credential | application grants |
|---|---|---|---|---|---|
| Alice | `1c39328c-7de4-44ae-bcf1-5bbc38d8e267` | `alice` | active | `alice-dev` | Library `48b2048f-…` |
| Bob | `95fa298f-79f8-428c-8980-3443d486c1d8` | `bob` | inactive | none | none |
| **Carol** | `30634877-08ae-44f3-a230-d899e22333d5` | `carol` | active | `carol-dev` | **none** |

Allocated credential uuid: `23f39cd9-f56e-4400-bd87-87e5d51798c1`.

Alice’s deployment grant `587f92f8-…` (`targetType: "deployment"`, Library deployment, `capability: "read"`) is **not** consulted this increment.

### R9 — Checker interface (deep module)

**Status:** Accepted.

```ts
type AccessTarget = { targetType: string; targetUuid: string };
type AccessGrant = { miroirUser: string; targetType: string; targetUuid: string };

function hasAccess(args: {
  principal: { miroirUserUuid: string } | undefined;
  target: AccessTarget;
  grants: AccessGrant[];
  alwaysAllow: AccessTarget[];
}): boolean;
```

Rules (all inside the module):

1. No principal → `false` (HTTP never calls this when hatch is off; 401 already handled).
2. `alwaysAllow` match on `(targetType, targetUuid)` → `true`.
3. At least one grant with same `miroirUser`, `targetType`, `targetUuid` → `true`.
4. Else `false`. `capability` is not a parameter.

Callers (adapters, not the evaluator):

| Caller | How it names `target` |
|---|---|
| REST / query / action | `applicationTargetForDeployment(deploymentUuid, deployments)` → `{ targetType: "application", targetUuid: selfApplication }` |
| Application selector / report URL | `{ targetType: "application", targetUuid: applicationUuid }` |
| Later: deployment rights | `{ targetType: "deployment", targetUuid: deploymentUuid }` — **same** `hasAccess` |

HTTP wrapper `assertAccess` returns `{ allowed: true }` or `{ allowed: false, status: 403, body: AccessDenied }`.

Module file: `packages/miroir-core/src/1_core/authentication/AccessPolicy.ts` (next to identity; access is not identity). Do **not** use the #219 banned names `checkMiroirRight` / `authorizeMiroir` / `hasMiroirAccess` / `evaluateMiroirRight`.

---

## 1. Goals

1. **Granted application** — In order to work only in the applications I am allowed to use as a signed-in platform user, I can open that application’s data and UI when I have a `MiroirRight` on it.
2. **Denied application** — In order not to see or change applications I was not granted as a signed-in platform user, I cannot select, open, or query those applications.
3. **Platform apps** — In order to administer the platform as any signed-in user, I can always open Admin and Miroir without a per-user grant.
4. **Hatch-off** — In order to keep current tests and local open mode as a developer, I get today’s unauthenticated API when authentication is disabled.
5. **Stable checker** — In order to add Deployment (or another category) later as an application maintainer, I can keep calling the same access function with a different `targetType`.

## 2. Non-goals

- Deployment-level allow/deny (later; same checker).
- Capability taxonomy (owned by #219 C2 / later).
- Groups / roles as grant subjects (owned by #219 C4).
- MCP :4080, CLI token client, Electron IPC gating (owned by #71 R3).
- Replacing #71 identity / login / token.
- Custom rights-management UI (still generic Admin instance editors from #219 C5).

---

## 3. Current state

### 3.1 MiroirRight model (aligned)

Entity `MiroirRight` uuid `a6136fc7-949b-4d64-9f13-dd3afce1ab3c`, `mlSchema` fields `miroirUser`, `targetType` (`"application"` \| `"deployment"`), `targetUuid`, `capability` (string), optional `description`. Description on the entity still says “no runtime enforcement in #219”.

Seed rights (2), both Alice:

| uuid | targetType | targetUuid | capability |
|---|---|---|---|
| `48b2048f-507f-40ee-a890-b6eca83596f5` | application | Library `5af03c98-…` | `admin` |
| `587f92f8-7140-434b-b9ff-f7f5d2e461b2` | deployment | Library deployment `f714bb2f-…` | `read` |

No rights for Bob. No Carol. No Designer grant.

### 3.2 Identity gate (aligned with #71, no access)

`assertRequestAllowed` in [`AuthenticationPolicy.ts`](../../../packages/miroir-core/src/1_core/authentication/AuthenticationPolicy.ts) lines 87–98:

- hatch off → allow, principal unread
- hatch on + principal → allow
- hatch on + no principal → 401 `AuthenticationRequired`

`loadAdminIdentityDirectory` in [`server.ts`](../../../packages/miroir-server/src/server.ts) lines 433–482 loads **users + credentials only**. Rights and deployments are not in that query.

### 3.3 #219 enforcement scan (misaligned with this issue)

[`miroirUserRights.unit.test.ts`](../../../packages/miroir-test-app_deployment-admin/tests/miroirUserRights.unit.test.ts) still expects **zero** hits of `checkMiroirRight|authorizeMiroir|hasMiroirAccess|evaluateMiroirRight` under core/server/stores. #262 evaluates rights as `hasAccess` / `AccessPolicy` instead.

### 3.4 Application selector (misaligned)

[`ApplicationSelector.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/interactive/ApplicationSelector.tsx) `formMLSchema` (lines 85–91) FK-filters AdminApplication instances with `not` on `[noValue, Miroir, Admin]`. The dropdown is therefore **Library + Designer** for every user. It does not call any access helper.

Truth table today:

| Auth hatch | User | Selector shows Library | Selector shows Designer | Sidebar Admin/Miroir (`showModelTools`) |
|---|---|---|---|---|
| off | (none) | yes | yes | if tools on |
| on | alice | yes | yes | if tools on |
| on | carol (after seed) | yes (must become no) | yes (must become no) | if tools on |

### 3.5 Sidebar (partially aligned)

[`Sidebar.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Page/Sidebar.tsx):

- Lines 91–119: Admin + Miroir menu sections render only when `context.showModelTools` is true. Those applications are always-allow; no extra filter needed for this increment.
- Lines 122–148: application menu sections come from `useMenusOfApplications(Object.keys(applicationDeploymentMap))` then filter to `currentApplication`. If the selector cannot pick Library, Library menus do not show. Deep-link `?page=report&application=5af03c98-…` still renders via `PageDispatcher` without an access check.

### 3.6 Users (aligned except missing Carol)

| username | status | can login (#71) |
|---|---|---|
| alice | active | yes (`alice-dev`) |
| bob | inactive | no |

---

## 4. Key reuse

| Piece | Location |
|-------|----------|
| `MiroirRight` entity | uuid `a6136fc7-949b-4d64-9f13-dd3afce1ab3c` |
| Alice Library application grant | uuid `48b2048f-507f-40ee-a890-b6eca83596f5` |
| `MiroirUser` / Alice / Bob | `d20d09e5-…` / `1c39328c-…` / `95fa298f-…` |
| `MiroirUserCredential` / Alice seed | `6c3ab489-…` / `c179dcf9-…` |
| AdminApplication entity | `25d935e7-9e93-42c2-aade-0472b883492b` |
| Deployment entity | `7959d814-400c-4e80-988f-a00fe582ab98` |
| `assertRequestAllowed` / `AuthPrincipal` | `AuthenticationPolicy.ts` |
| `identityDirectoryFromInstances` + Admin boxed query | `AuthenticationPolicy.ts` / `server.ts` `loadAdminIdentityDirectory` |
| `RestClientStub` auth gate | `RestClientStub.ts` (same `assertRequestAllowed`) |
| `nextPageWhenAuthGate` / login | `AuthenticationUi.ts` / `LoginPage.tsx` |
| Application selector FK filter | `ApplicationSelector.tsx` `targetEntityFilterInstancesBy` |
| #219 / #71 admin tests | `miroirUserRights.unit.test.ts` |

---

## 5. Proposals / options

| # | Proposal | Impact | Effort | Verdict |
|---|---|---|---|---|
| 1 | Deep `AccessPolicy` + HTTP/UI adapters | High (secure + UX) | Medium | **adopt** |
| 2 | UI-only filter | Low (insecure) | Low | reject (R5) |
| 3 | Hard-code `if (app === Library && user === Alice)` | High debt | Low | reject (R9) |

---

## Next step

Implementation proceeds per [`./tdd-implementation-plan.md`](./tdd-implementation-plan.md).
