# 264 — Deployment-level user access rights

> Evaluate stored `MiroirRight` rows with `targetType=deployment` so access can be
> granted to a specific deployment, not only to an application. The #262 checker stays
> generic; this increment adds callers that name a deployment target and combine them
> with the existing application check.

Related issue: https://github.com/miroir-framework/miroir/issues/264  
Parent / prerequisite: [#262 Application-level user access rights](https://github.com/miroir-framework/miroir/issues/262) — [`../262-FEATURE-application-access-rights/analysis.md`](../262-FEATURE-application-access-rights/analysis.md)  
Identity: [#71](https://github.com/miroir-framework/miroir/issues/71) · Model: [#219](https://github.com/miroir-framework/miroir/issues/219) ✅ · Other doors: [#263](https://github.com/miroir-framework/miroir/issues/263)  
Key sources: [`AccessPolicy.ts`](../../../packages/miroir-core/src/1_core/authentication/AccessPolicy.ts) · [`AuthenticationUi.ts`](../../../packages/miroir-core/src/1_core/authentication/AuthenticationUi.ts) · [`useApplicationAccess.ts`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/auth/useApplicationAccess.ts) · [`server.ts`](../../../packages/miroir-server/src/server.ts) · [`RestClientStub.ts`](../../../packages/miroir-core/src/4_services/RestClientStub.ts) · [`MiroirRight` entity](../../../packages/miroir-test-app_deployment-admin/assets/admin_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/a6136fc7-949b-4d64-9f13-dd3afce1ab3c.json)

**Document role:** analysis and architectural decision record.  
**Status:** decisions confirmed with the user (2026-09-09). Implementation plan: [`./tdd-implementation-plan.md`](./tdd-implementation-plan.md).

## Acceptance Criteria

Locked with D1–D5. Unticked until implementation.

- [ ] A deployment grant on `(user, targetType=deployment, targetUuid)` allows that deployment’s REST and the UI that reaches it. `capability` is ignored.
- [ ] An application grant still allows every deployment whose `selfApplication` is that application.
- [ ] No application grant and no deployment grant → that deployment is denied (**403** `AccessDenied` after identity).
- [ ] A deployment grant does not grant a different deployment, nor a different application.
- [ ] Admin (`55af124e-8c05-4bae-a3ef-0933d41daa92`) and Miroir (`360fcf1f-f0d4-4f8a-9262-07886e70fa15`), and the deployments that belong to them, stay always allowed without per-user rows.
- [ ] Authentication off → no rights check (today’s open API).
- [ ] Missing identity → **401**. Denied deployment after identity → **403**. Unknown `deploymentUuid` → **403**.
- [ ] UI does not present a path that only a denied deployment can serve; a deep link to a denied deployment does not show that deployment’s data.
- [ ] Seeds and tests demonstrate deployment-only access: **Dave** (`dave` / `dave-dev`) has only the Library filesystem deployment grant (no Library application grant). Library appears in Dave’s UI; Designer does not. Carol still has neither.
- [ ] `hasAccess` stays generic. The four #219 banned names stay unused.
- [ ] MCP, CLI, and Electron stay ungated ([#263](https://github.com/miroir-framework/miroir/issues/263)).

---

## Sequencing

| Step | Issue | Status |
|---|---|---|
| Platform user + rights **model only** | [#219](https://github.com/miroir-framework/miroir/issues/219) | ✅ |
| Identity proofing + hatch | [#71](https://github.com/miroir-framework/miroir/issues/71) | ✅ identity; MCP/CLI/Electron → #263 |
| Application access evaluation | [#262](https://github.com/miroir-framework/miroir/issues/262) | ✅ |
| **Deployment access evaluation** | **#264 (this document)** | **this** |
| Capability taxonomy | later | later |
| Groups / roles as grant subjects | later | later |
| Gate MCP / CLI / Electron | [#263](https://github.com/miroir-framework/miroir/issues/263) | later |

#262 explicitly deferred this work: the checker is keyed by `(targetType, targetUuid)`; REST names only `{ targetType: "application", targetUuid: selfApplication }`; Alice’s deployment grant `587f92f8-…` is stored and unused.

---

## Decision record

Confirmed with the user (2026-09-09). ★ = accepted.

| ID | Question | Choice |
|---|---|---|
| D1 | How do application and deployment grants combine for one REST/UI call? | **Union.** Application grant → every deployment of that app. Deployment grant → that deployment only. Either is enough. |
| D2 | Always-allow Admin / Miroir deployments | **Follow the application always-allow.** No extra deployment constant list. A call to an Admin or Miroir deployment passes because its `selfApplication` is already always-allow. |
| D3 | How to demonstrate deployment-only access in seeds | **Dave:** active user, credential `dave` / `dave-dev`, **only** a Library filesystem deployment grant (no Library application grant). A second Library deployment (same-app narrowing) is deferred (G4). |
| D4 | Surfaces | **Same as #262:** REST is the trust boundary (403). UI hides unreachable apps / deep-links home. A deployment-only user **can** see and open Library. CopilotKit stays identity-only. MCP / CLI / Electron stay #263. |
| D5 | Checker | **Do not change `hasAccess`.** Compose in the REST/UI adapters: allow if `hasAccess(applicationTarget)` **or** `hasAccess(deploymentTarget)`. |

**Rationale:** #262 already promised “later Deployment is a new caller, not a new evaluator.” The product sentence is additive (“not only”), so an application grant must keep working. Capability stays ignored.

### D1 — Combination rule

**Status:** Accepted — union.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D1-a. Union** ★ | Allow if application grant on `selfApplication` **or** deployment grant on `deploymentUuid` | Matches “not only application”; Alice’s existing app grant still opens Library; a deployment-only user becomes possible | Alice’s deployment row stays redundant until D3 |
| D1-b. Intersection | Need **both** an application grant and a deployment grant | Tightest lock | Breaks Alice unless we keep her pair; a user with only an application grant loses every deployment; contradicts “application access” as already shipped |
| D1-c. Deployment replaces application on REST | REST checks only `targetType=deployment`; application grant is UI-only | Uses the unused seed row | Application grant no longer means “can use this app’s data”; REST and UI diverge |
| D1-d. Deployment grant implies application | Matching a deployment also counts as the parent application | Shorter UI rule | Contradicts the #262 test that a deployment target is not granted by application grants (and the inverse story: a deployment row is not an application row) |

**Decision:** D1-a.

Truth table (D1-a), hatch **on**, known `deploymentUuid`:

| Principal | Application grant on `selfApplication` | Deployment grant on this uuid | Result |
|---|---|---|---|
| none | — | — | 401 (identity; access not called) |
| any | always-allow Admin/Miroir | — | allow |
| Alice | Library yes | Library filesystem yes | allow (app grant is enough) |
| Carol | no | no | 403 |
| Dave | Library no | Library filesystem yes | allow that deployment only |
| Alice | Designer no | Designer no | 403 |

### D2 — Always-allow and deployments

**Status:** Accepted — reuse application always-allow.

[`ALWAYS_ALLOW_APPLICATION_TARGETS`](../../../packages/miroir-core/src/1_core/authentication/AccessPolicy.ts) is two application targets (Admin, Miroir). There is no `ALWAYS_ALLOW_DEPLOYMENT_TARGETS`.

Under D1-a, `assertAccessForDeployment` would allow when `hasAccess(applicationTarget)` is true. Admin/Miroir deployments therefore stay open without new constants.

| Option | Verdict |
|---|---|
| **Reuse application always-allow** ★ | Accepted |
| Seed Admin/Miroir deployment grants per user | Rejected — same reason #262 rejected per-user platform rows |
| Always-allow list of the two platform **deployment** uuids | Deferred — only needed if D1-b (intersection) is chosen |

### D3 — Demonstration seeds

**Status:** Accepted — Dave (deployment-only); second Library deployment deferred (G4).

Enumerated Admin data (Python listing of `admin_data/`):

| Kind | Count | uuids / notes |
|---|---|---|
| AdminApplication | 4 | Admin, Miroir, Library, Designer — see §3.1 |
| Deployment | 4 | **exactly one per application** — see §3.1 |
| MiroirRight | 2 | Alice Library **application** `48b2048f-…`; Alice Library **deployment** `587f92f8-…` |
| Active users with credentials | 2 | Alice, Carol. Bob inactive, no credential |

Alice already has **both** Library grants. Carol has **none**. With only those rows, D1-a is observationally identical to today’s application-only rule for every existing user.

| Option | What it proves | Cost |
|---|---|---|
| **D3-a. New user, Library deployment grant only** ★ | “Granted at deployment level, not only application” | One `MiroirUser` + credential + one `MiroirRight`. No new Deployment. |
| D3-b. Second Library Deployment + grant on only one | “This deployment, not the other of the same app” | New Deployment instance (store config, menus, tests). Larger than the access change. |
| D3-c. Both | Both stories | Heavier first increment |

**Decision:** D3-a. Allocated (greenfield Admin data; do not reuse existing uuids):

| Artefact | Value |
|---|---|
| `MiroirUser` Dave | `e2343a39-f5d9-4898-83b4-74e2ccc33125` |
| username / password | `dave` / `dave-dev` |
| `MiroirUserCredential` | `cc3bc0aa-023f-4f8c-b4c8-a8c1f44b3a93` |
| `MiroirRight` Library filesystem deployment only | `0509f559-2a1f-4bf2-ae2d-732aa6cc3202` |
| Existing Library deployment target | `f714bb2f-a12d-4e71-a03b-74dcedea6eb4` |

D3-b remains gap G4.

### D4 — Surfaces

**Status:** Accepted — REST + UI; deployment-only user can see Library.

| Door | Today | This increment |
|---|---|---|
| REST `/CRUD`, `/action`, `/query`, `/queryTemplate` | Application check only | Compose application **or** deployment |
| Web UI selector / deep link | Application check only | Show/open Library if the user has an application grant **or** any granted deployment of Library (Dave: yes). Designer stays hidden for Dave. |
| `/api/copilotkit` | Identity only (no `deploymentUuid`) | Unchanged |
| MCP / CLI / Electron | Open | Unchanged (#263) |

### D5 — Keep `hasAccess` generic

**Status:** Accepted — compose in adapters.

#262 R9 (in that analysis) already specified the later caller:

> Later: deployment rights — `{ targetType: "deployment", targetUuid: deploymentUuid }` — **same** `hasAccess`

Do not add `hasDeploymentAccess` as a second evaluator. A thin adapter (name TBD in the TDD plan) may wrap the union so `server.ts` / `RestClientStub.ts` stay one call.

---

## 1. Goals

1. **Granted deployment** — In order to use only the deployments I was given as a signed-in platform user, I can read and change that deployment’s data when I have a `MiroirRight` on it (or an application grant that covers it).
2. **Denied deployment** — In order not to touch deployments I was not given as a signed-in platform user, I cannot query or open a deployment I have no grant for.
3. **Application grant still works** — In order not to re-grant every deployment as an operator, I can still give one application grant and cover all deployments of that application.
4. **Platform apps** — In order to administer the platform as any signed-in user, I can still use Admin and Miroir (including their deployments) without extra rows.
5. **Hatch-off** — In order to keep current tests as a developer, I get today’s open API when authentication is disabled.
6. **Same checker** — In order not to fork policy as an application maintainer, I keep calling `hasAccess` with a different `targetType`.

## 2. Non-goals

- Capability taxonomy (`read` / `write` / `admin`) — later.
- Groups / roles as grant subjects — later.
- MCP / CLI / Electron gating — owned by [#263](https://github.com/miroir-framework/miroir/issues/263).
- CopilotKit application/deployment evaluation (still no deployment on the request).
- Replacing #71 identity / login / token.
- Custom rights-management UI (generic Admin editors from #219).
- Adding a second Library Deployment / store backend (D3-b, gap G4).

---

## 3. Current state

Facts below were enumerated with a Python listing of Admin `admin_data/` directories and read from the cited functions (2026-09-09, this workspace).

### 3.1 Model and seeds (aligned as data, misaligned as behavior)

`MiroirRight` uuid `a6136fc7-949b-4d64-9f13-dd3afce1ab3c`. Fields: `miroirUser`, `targetType` (`"application"` \| `"deployment"`), `targetUuid`, `capability`, optional `description` / `name`.

AdminApplication instances (4):

| uuid | name |
|---|---|
| `55af124e-8c05-4bae-a3ef-0933d41daa92` | Admin |
| `360fcf1f-f0d4-4f8a-9262-07886e70fa15` | Miroir |
| `5af03c98-fe5e-490b-b08f-e1230971c57f` | Library |
| `880831db-4f76-40b1-97c0-6a2f3f4ffccb` | Designer |

Deployment instances (4) — entity `7959d814-400c-4e80-988f-a00fe582ab98`:

| uuid | name | selfApplication |
|---|---|---|
| `18db21bf-f8d3-4f6a-8296-84b69f6dc48b` | AdminApplicationFilesystemDeployment | Admin |
| `10ff36f2-50a3-48d8-b80f-e48e5d13af8e` | DefaultMiroirApplicationDeployment | Miroir |
| `f714bb2f-a12d-4e71-a03b-74dcedea6eb4` | LibraryApplicationFilesystemDeployment | Library |
| `f0359240-e849-4546-8158-75f4a8ae5831` | DesignerApplicationFilesystemDeployment | Designer |

MiroirRight instances (2), both Alice `1c39328c-7de4-44ae-bcf1-5bbc38d8e267`:

| uuid | targetType | targetUuid | capability |
|---|---|---|---|
| `48b2048f-507f-40ee-a890-b6eca83596f5` | application | Library | `admin` |
| `587f92f8-7140-434b-b9ff-f7f5d2e461b2` | deployment | Library filesystem deployment | `read` |

Users: Alice (`alice` / `alice-dev`, active), Carol (`carol` / `carol-dev`, active, **no** rights), Bob (inactive, no credential).

There is **no** second Deployment for Library (or any other application). There is **no** user whose only grant is a deployment row.

### 3.2 `hasAccess` (aligned — generic, unused for deployment at call sites)

[`AccessPolicy.ts` `hasAccess`](../../../packages/miroir-core/src/1_core/authentication/AccessPolicy.ts) lines 71–88: no principal → false; `alwaysAllow` match → true; else any grant with same `miroirUser` + `targetType` + `targetUuid`. `capability` is not a parameter.

`hasAccess` **can** already answer a deployment target. #262 phase1 asserts the inverse: when **only application grants** are passed, a `{ targetType: "deployment", targetUuid: Library deployment }` is **false**. That is correct for the evaluator. The gap is that no production caller asks that question with the full grant list.

### 3.3 REST adapter (misaligned)

[`assertAccessForDeployment`](../../../packages/miroir-core/src/1_core/authentication/AccessPolicy.ts) lines 136–157:

```136:157:packages/miroir-core/src/1_core/authentication/AccessPolicy.ts
export function assertAccessForDeployment(args: {
  enabled: boolean;
  principal: { miroirUserUuid: string } | undefined;
  deploymentUuid: string | undefined;
  grants: AccessGrant[];
  deployments: AccessDeployment[];
  alwaysAllow: AccessTarget[];
}): AccessDecision {
  if (!args.enabled) {
    return { allowed: true };
  }
  const target = applicationTargetForDeployment(args.deploymentUuid, args.deployments);
  if (!target) {
    return { allowed: false, status: 403, body: ACCESS_DENIED };
  }
  return assertAccess({
    principal: args.principal,
    target,
    grants: args.grants,
    alwaysAllow: args.alwaysAllow,
  });
}
```

Truth table **today** (hatch on, identity already passed):

| `deploymentUuid` | Application grant / always-allow on `selfApplication` | Deployment grant on uuid | Result today | Result under proposed D1-a |
|---|---|---|---|---|
| missing / unknown | — | — | 403 | 403 (unchanged) |
| Library filesystem | Alice yes | Alice yes | **200** (app only) | 200 |
| Library filesystem | Carol no | Carol no | 403 | 403 |
| Library filesystem | none | yes (D3 user) | **403** | **200** |
| Designer filesystem | Alice no | Alice no | 403 | 403 |
| Admin / Miroir | always-allow | unused | 200 | 200 |
| hatch off | unread | unread | 200 | 200 |

Call sites of this adapter (both pass `ALWAYS_ALLOW_APPLICATION_TARGETS` only):

| File | Function / region |
|---|---|
| `packages/miroir-server/src/server.ts` | REST handler loop ~571–582, after `assertRequestAllowed` |
| `packages/miroir-core/src/4_services/RestClientStub.ts` | `call` ~119–127, after identity |

CopilotKit (`server.ts` ~781) uses identity only; it does not call `assertAccessForDeployment`.

### 3.4 UI adapter (misaligned for deployment-only users)

[`visibleUserApplications`](../../../packages/miroir-core/src/1_core/authentication/AuthenticationUi.ts) lines 20–37 filters Library and Designer with `hasAccess` on **`targetType: "application"`** and `alwaysAllow: []`.

[`useApplicationAccess`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/auth/useApplicationAccess.ts) `canAccessApplication` (lines 90–100) uses `ALWAYS_ALLOW_APPLICATION_TARGETS` and an **application** target only. It does not load Deployment instances or ask `hasAccess` for `targetType: "deployment"`.

[`ApplicationSelector.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/interactive/ApplicationSelector.tsx) picks among applications. There is **no** deployment selector. One application maps to one deployment in `applicationDeploymentMap`. Report URLs carry `deploymentUuid`; `PageDispatcher` gates on `canAccessApplication(applicationUuid)` only.

A user who has a Library **deployment** grant and no Library **application** grant would be denied the selector and the deep-link today, even if REST were fixed.

### 3.5 Tests that encode “deployment unused”

[`access.262.phase1.unit.test.ts`](../../../packages/miroir-core/tests/4_services/issues/262-application-access/access.262.phase1.unit.test.ts) “does not treat a deployment target as granted when only application grants are passed” — still valid for `hasAccess`.

[`access.262.phase3.unit.test.ts`](../../../packages/miroir-core/tests/4_services/issues/262-application-access/access.262.phase3.unit.test.ts) exercises `assertAccessForDeployment` as **application-only**. Those cases stay true for Alice/Carol under D1-a; they do **not** cover a deployment-only principal. New tests belong in an `access.264` suite, not by silently rewriting #262’s meaning.

---

## 4. Gaps to fill

| ID | Gap | Why it matters | Fill in this increment? |
|---|---|---|---|
| G1 | REST adapter never names a deployment target | Alice’s `587f92f8-…` row and any future deployment-only grant have no effect on 403/200 | **Yes** — compose D1 in `assertAccessForDeployment` (or a successor wrapper) |
| G2 | UI never names a deployment target | A deployment-only user cannot select or deep-link the app | **Yes** if D1-a + D3-a (otherwise the new user looks “denied” in the UI) |
| G3 | No seed user with only a deployment grant | Current Alice/Carol matrix cannot fail a test that says “deployment grant is enough” | **Yes** — add Dave (D3-a) |
| G4 | One Deployment per Application | Cannot prove “this Library deployment, not the other” | **No** unless D3-b is confirmed; keep as follow-up |
| G5 | No deployment always-allow list | Only a problem under intersection (D1-b) | **No** under proposed D1-a |
| G6 | CopilotKit has no deployment on the request | Cannot apply deployment (or application) access there | **No** — same as #262; not this issue |
| G7 | MCP / CLI / Electron still open | Deployment rights on REST do not close those doors | **No** — #263 |
| G8 | Operator docs describe application evaluation only | `docs/reference/authentication.md` says capability ignored and deployment grants “stored; they are not evaluated” (via #262 wording) | **Yes** — update the reference when behavior changes |
| G9 | #262 AC “deployment grant does not grant application access” | Must stay true for `hasAccess(applicationTarget)` | **Yes** — do not make a deployment row imply `targetType=application` (reject D1-d) |

---

## 5. Key reuse

| Piece | Location |
|---|---|
| `hasAccess` / `assertAccess` / `AccessTarget` / `AccessGrant` | `AccessPolicy.ts` |
| `assertAccessForDeployment` / `applicationTargetForDeployment` | `AccessPolicy.ts` (extend composition; do not fork) |
| `ALWAYS_ALLOW_APPLICATION_TARGETS` | Admin + Miroir application uuids |
| `accessGrantsFromInstances` / `deploymentsFromInstances` | already loaded in `server.ts` identity directory and `RestClientStub.accessDirectory` |
| Alice Library deployment grant | uuid `587f92f8-7140-434b-b9ff-f7f5d2e461b2` |
| Alice Library application grant | uuid `48b2048f-507f-40ee-a890-b6eca83596f5` |
| Library deployment | uuid `f714bb2f-a12d-4e71-a03b-74dcedea6eb4` |
| Dave (to add) | user `e2343a39-…` · credential `cc3bc0aa-…` · right `0509f559-…` |
| `visibleUserApplications` / `nextPageWhenAccessDenied` | `AuthenticationUi.ts` |
| `useApplicationAccess` | `useApplicationAccess.ts` |
| #262 tests | `packages/miroir-core/tests/4_services/issues/262-application-access/` |
| #219 name ban | `miroirUserRights.unit.test.ts` |

---

## 6. Proposals / options

| # | Proposal | Impact | Effort | Verdict |
|---|---|---|---|---|
| 1 | Union in REST/UI adapters + Dave | Makes deployment grants real; keeps #262 application behavior | Medium | **adopt** |
| 2 | Intersection (need both grants) | Changes Alice/application meaning | Medium | reject unless product wants to tighten #262 |
| 3 | Second Library Deployment now (D3-b) | Proves same-app narrowing | High (new store fixture) | **defer** (G4) |
| 4 | New evaluator (`canAccessDeployment`) that hard-codes Application vs Deployment | Forks #262 | Medium | reject (D5) |

---

## Next step

Implementation proceeds per [`./tdd-implementation-plan.md`](./tdd-implementation-plan.md).
