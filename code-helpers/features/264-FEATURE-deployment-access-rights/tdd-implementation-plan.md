# Issue #264 — TDD Implementation Plan

> Vertical TDD slices (RED → GREEN each), integration-first per `docs/contributing/testing.md`.
> Tests exercise the real `AccessPolicy` adapters against Admin seed JSON, then the real
> `RestClientStub` identity + access path. No mocks.
> Tracer: hatch **on**, Dave (`dave` / `dave-dev`) can query the Library filesystem deployment
> with only a deployment grant; Carol still cannot; Alice still can via her application grant.
>
> **Execution model:** human-in-the-loop. No slice contains a commit step — commits happen
> only when the user explicitly asks. Each slice ends with its Validation commands; on
> success its Realization summary is appended and its Status flips to ✅ DONE.

Analysis: [`./analysis.md`](./analysis.md) · Issue: https://github.com/miroir-framework/miroir/issues/264  
Prerequisite: [`../262-FEATURE-application-access-rights/tdd-implementation-plan.md`](../262-FEATURE-application-access-rights/tdd-implementation-plan.md) ✅  
Working branch: `cursor/264-deployment-access-rights`

**Resume note:** Slices 0–5 DONE. `npm run nonreg` 53/53 (2026-09-09).

---

## Scope

- Union in REST/UI adapters: allow if `hasAccess(applicationTarget)` **or** `hasAccess(deploymentTarget)`.
- Do **not** change `hasAccess` (still exact `targetType` + `targetUuid`; capability ignored).
- Always-allow Admin / Miroir stays an **application** list; their deployments ride `selfApplication`.
- Dave seed: active user, `dave` / `dave-dev`, only Library filesystem deployment grant.
- REST after identity: 403 `AccessDenied` when neither grant applies; 401 still identity.
- UI: Library visible/openable for Dave; Designer hidden; Carol unchanged.

This plan does **not** add a second Library Deployment (analysis G4), harden capability taxonomy, add groups/roles, evaluate CopilotKit, or gate MCP/CLI/Electron (#263).

---

## Seams under test

| Seam | Why |
|---|---|
| `assertAccessForDeployment` | Union composition; hatch off; unknown deployment |
| Admin seed JSON (rights, users, credentials, deployments) | Dave + existing Alice/Carol matrix |
| `RestClientStub` after identity | Observable 200 vs 403 for Dave / Carol / Alice |
| `visibleUserApplications` (or successor that also sees deployments) | Selector: Dave sees Library |
| `nextPageWhenAccessDenied` / `canAccessApplication` | Deep-link: Dave can stay on Library; Carol cannot |

**Vitest exception:** access is a platform policy + HTTP gate, not an ML transformer/query/endpoint. Same justification as #71 / #262. Helper tests **import real Admin JSON**, not inline grant copies. Admin asset changes go through `modelValidation` + `miroirUserRights`.

---

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Characterize application-only adapter + no Dave | ✅ | `access.264.phase0` + `access.262` |
| 1 | Union in `assertAccessForDeployment` (tracer) | ✅ | `access.264.phase1` |
| 2 | Dave seed + login | ✅ | `access.264.phase2` + `miroirUserRights` |
| 3 | REST 200/403 with Dave via `RestClientStub` | ✅ | `access.264.phase3` |
| 4 | UI: Dave sees Library; deep-link | ✅ | `access.264.phase4` |
| 5 | Nonreg, docs, AC | ✅ | nonreg step + docs |

---

## Locked implementation defaults

Copied from the analysis decision record. Deviations go in the slice Realization.

| Decision | Choice |
|---|---|
| D1 Combination | **Union.** Application grant → every deployment of that app. Deployment grant → that deployment only. Either is enough. |
| D2 Always-allow | Follow application always-allow (Admin + Miroir). No deployment constant list. |
| D3 Seeds | Dave `e2343a39-…` / `dave` / `dave-dev`; only Library filesystem deployment grant. No second Library deployment. |
| D4 Surfaces | REST 403 + UI. Dave can see and open Library. CopilotKit identity-only. MCP/CLI/Electron → #263. |
| D5 Checker | Do not change `hasAccess`. Compose in adapters. |

---

## Allocated UUIDs / keys

| Artefact | Value |
|---|---|
| Dave `MiroirUser` | `e2343a39-f5d9-4898-83b4-74e2ccc33125` |
| Dave username / password | `dave` / `dave-dev` |
| Dave `MiroirUserCredential` | `cc3bc0aa-023f-4f8c-b4c8-a8c1f44b3a93` |
| Dave Library deployment `MiroirRight` | `0509f559-2a1f-4bf2-ae2d-732aa6cc3202` |
| Existing Library deployment | `f714bb2f-a12d-4e71-a03b-74dcedea6eb4` |
| Alice Library application grant | `48b2048f-507f-40ee-a890-b6eca83596f5` |
| Alice Library deployment grant | `587f92f8-7140-434b-b9ff-f7f5d2e461b2` |
| Carol (no rights) | `30634877-08ae-44f3-a230-d899e22333d5` |
| Vitest issue dir | `packages/miroir-core/tests/4_services/issues/264-deployment-access/` |
| Nonreg step | `unit-264-deployment-access` |

Dave password hash: same scrypt scheme as Alice / Carol (`hashPassword` / seed style from #71).

---

## Test execution conventions

| Purpose | Command |
|---|---|
| Slice 0–4 vitest | `RUN_TEST=access.264 npm run testByFile -w miroir-core -- access.264` |
| #262 still green | `RUN_TEST=access.262 npm run testByFile -w miroir-core -- access.262` |
| #71 identity still green | `RUN_TEST=authentication.71 npm run testByFile -w miroir-core -- authentication.71` |
| Admin model + users/rights | `npm run testByFile -w miroir-test-app_deployment-admin -- miroirUserRights` |
| Admin modelValidation | `npm run testByFile -w miroir-test-app_deployment-admin -- modelValidation` |
| Admin build | `npm run build -w miroir-test-app_deployment-admin` |
| Type check | `npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json` (and `miroir-server` / `miroir-standalone-app` when touched) |

---

## Slice 0 — Characterize application-only adapter

**Status:** ✅ DONE

### Goal

Lock today’s contracts so Slice 1 can flip only the union, not invent a second evaluator or break #262.

### 0.1 RED → GREEN — characterization

**Test:** `packages/miroir-core/tests/4_services/issues/264-deployment-access/access.264.phase0.unit.test.ts`

**Vitest exception:** not reachable as MiroirTest; locks TS + JSON contracts.

Load real Admin JSON under `packages/miroir-test-app_deployment-admin/assets/admin_data/`.

Behavior asserted:

- No Dave user file `e2343a39-…`; no credential `cc3bc0aa-…`; no right `0509f559-…`.
- Exactly two `MiroirRight` files: Alice application `48b2048f-…` and Alice deployment `587f92f8-…`.
- `hasAccess` is still generic: Alice + `{ deployment, Library filesystem }` with **full** seed grants → **true** (row exists). Alice + `{ application, Library }` with **deployment-typed grants only** → **false** (exact type match; do not “fix” this).
- `assertAccessForDeployment` today: hatch on, Alice, Library deployment, **full** grants → allowed (application path).
- `assertAccessForDeployment` today: hatch on, Alice, Library deployment, grants **filtered to `targetType === "deployment"`** (the real `587f92f8-…` row only) → **denied**. This is the misalignment Slice 1 flips.
- `assertAccessForDeployment` today: hatch on, Carol (no grants), Library → denied.
- `visibleUserApplications` does not accept a deployments list (current signature: principal + application grants + Library/Designer candidates).

Keep `access.262` green (do not rewrite those tests to expect union).

### Validation

```bash
RUN_TEST=access.264.phase0 npm run testByFile -w miroir-core -- access.264.phase0
RUN_TEST=access.262 npm run testByFile -w miroir-core -- access.262
npm run testByFile -w miroir-test-app_deployment-admin -- miroirUserRights
```

### Realization

Characterization locks: no Dave files; exactly two Alice `MiroirRight` rows; `hasAccess` stays type-exact; `assertAccessForDeployment` allows Alice on full grants and **denies** Alice when only the real deployment grant is passed; Carol denied on Library; `visibleUserApplications` ignores deployment grants. `access.262` 26/26 and `miroirUserRights` 20/20 green. No production code changed.

---

## Slice 1 — Union in `assertAccessForDeployment` (tracer)

**Status:** ✅ DONE

### Goal

A REST-shaped call that names a `deploymentUuid` is allowed when the principal has **either** an application grant on `selfApplication` **or** a deployment grant on that uuid. `hasAccess` is unchanged.

**Layers cut:** real Admin grant + deployment JSON → `assertAccessForDeployment` composition.

### 1.1 RED

**Test:** `access.264.phase1.unit.test.ts`

Load real rights and deployments. Use in-memory **filters** of those files (not hand-built grant objects) to isolate each grant kind.

Behavior asserted:

- Hatch off → allowed (unchanged).
- Unknown / missing `deploymentUuid` → 403 (unchanged).
- Full seed grants, Alice, Library filesystem → allowed (application grant still enough).
- Alice, grants = **only** the real deployment row `587f92f8-…`, Library filesystem → **allowed** (this is the flip from Slice 0).
- Alice, grants = **only** the real application row `48b2048f-…`, Library filesystem → allowed (union, application side).
- Alice, grants = only the deployment row, Designer filesystem `f0359240-…` → **denied** (deployment grant does not travel).
- Carol, full seeds (no rows) , Library → denied.
- Always-allow: Carol, Admin deployment `18db21bf-…` or Miroir `10ff36f2-…` → allowed (application always-allow; no new deployment constants).
- `hasAccess` Alice + `{ application, Library }` with deployment-only grants still **false** (#262 / D5 / reject D1-d).

### 1.2 GREEN

In `assertAccessForDeployment`, after resolving the deployment:

1. `applicationTarget = { targetType: "application", targetUuid: selfApplication }`
2. `deploymentTarget = { targetType: "deployment", targetUuid: deployment.uuid }`
3. Allow if `hasAccess({ …, target: applicationTarget })` **or** `hasAccess({ …, target: deploymentTarget })`

Same `alwaysAllow` list (`ALWAYS_ALLOW_APPLICATION_TARGETS`). Do not add `ALWAYS_ALLOW_DEPLOYMENT_TARGETS`. Do not change `hasAccess`. `RestClientStub` / `server.ts` already call this adapter — they pick up the union with no extra wiring.

### 1.3 Refactor checkpoint

- Keep the union in one adapter function; do not copy it into Express and the stub.
- Do not merge grant matching into `assertRequestAllowed`.
- Analysis G1 closed; G9 held (`hasAccess` on an application target still ignores deployment rows).

### Validation

```bash
RUN_TEST=access.264 npm run testByFile -w miroir-core -- access.264
RUN_TEST=access.262 npm run testByFile -w miroir-core -- access.262
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
```

### Realization

`assertAccessForDeployment` allows if `hasAccess(applicationTarget)` or `hasAccess(deploymentTarget)`. Same `ALWAYS_ALLOW_APPLICATION_TARGETS`. `hasAccess` unchanged. Phase 0 dropped the “deployment-only denies” lock because that is now the opposite. `access.264` phase1 green; `access.262` 26/26; core `tsc` green.

---

## Slice 2 — Dave seed + login

**Status:** ✅ DONE

### Goal

Dave can sign in and is a principal whose **only** grant is the Library filesystem deployment.

**Layers cut:** Admin user + credential + right JSON → identity directory → `loginWithPassword` + `hasAccess`.

### 2.1 RED

**Test:** `access.264.phase2.unit.test.ts` + extend `miroirUserRights`

Behavior asserted:

- Admin data contains Dave `e2343a39-…`, `username: "dave"`, `status: "active"`.
- One credential `cc3bc0aa-…` for Dave; `loginWithPassword({ username: "dave", password: "dave-dev" }, real directory)` succeeds.
- Exactly one `MiroirRight` for Dave: `0509f559-…`, `targetType: "deployment"`, `targetUuid: f714bb2f-…`. No Dave application grant.
- `hasAccess` Dave + `{ deployment, Library filesystem }` → true; Dave + `{ application, Library }` → **false**; Dave + `{ application, Designer }` → false; Dave + Admin/Miroir application → true (always-allow).
- Alice / Carol / Bob login contracts unchanged.
- `modelValidation` + `miroirUserRights` still pass (extend Carol-style assertions: Dave exists; Dave has exactly one right and it is deployment-scoped).

### 2.2 GREEN

Add Dave user, credential, and right assets; export from admin `index.ts` if that is the package convention; `npm run build -w miroir-test-app_deployment-admin`. Hash `dave-dev` with the same helper as Alice / Carol. If emulated Vite stub lists users/credentials/rights/deployments explicitly, add Dave there too (same as Carol).

### 2.3 Refactor checkpoint

- Reuse `hashPassword` / seed style from #71 / #262; no new hash scheme.
- Right `name` follows the existing “Alice — Library deployment” pattern (e.g. `Dave — Library deployment`).
- Loosen any “exactly two MiroirRight files” or “exactly two credentials” assertions the way #262 loosened Alice-only credential counts.

### Validation

```bash
npm run build -w miroir-test-app_deployment-admin
npm run testByFile -w miroir-test-app_deployment-admin -- modelValidation
npm run testByFile -w miroir-test-app_deployment-admin -- miroirUserRights
RUN_TEST=access.264 npm run testByFile -w miroir-core -- access.264
RUN_TEST=authentication.71 npm run testByFile -w miroir-core -- authentication.71
```

### Realization

Added Dave user `e2343a39-…` (`dave` / active), credential `cc3bc0aa-…` (`dave-dev`, scrypt), right `0509f559-…` (Library filesystem deployment only). Exported from admin `index.ts` / `index.d.ts` and wired into the emulated `RestClientStub` directory in standalone-app `index.tsx`. Loosened #262 “exactly two rights” counts. Dave’s instances pass `modelValidation`; the three remaining `modelValidation` failures are the pre-existing Entity / Alice-credential checks from #262. `miroirUserRights` 21/21; `authentication.71` 43/43.

---

## Slice 3 — REST 200/403 with Dave

**Status:** ✅ DONE

### Goal

With auth on, Dave’s token can run CRUD/query/action against the Library filesystem deployment and not against Designer. Carol still 403 on Library. Alice still 200 on Library. Hatch off unchanged.

**Layers cut:** identity + access directory already loaded → `assertAccessForDeployment` (union) in `RestClientStub` (and Express, same adapter).

### 3.1 RED

**Test:** `access.264.phase3.unit.test.ts` via `handleAuthHttpRoute` / `RestClientStub` (same path as #262 phase 3).

Behavior asserted:

- Hatch off: Library without token still succeeds.
- Hatch on, Dave token, Library `f714bb2f-…`: **allowed** (200 / handler result).
- Hatch on, Dave token, Designer `f0359240-…`: **403** `AccessDenied`.
- Hatch on, Dave token, Admin `18db21bf-…` or Miroir `10ff36f2-…`: allowed.
- Hatch on, Carol token, Library: still 403.
- Hatch on, Alice token, Library: still allowed.
- Hatch on, Dave token, unknown `deploymentUuid`: 403.
- Hatch on, no token: still **401**.

### 3.2 GREEN

No new evaluator. If Slice 1 already shipped the union, this slice is wiring/proof: ensure the stub’s access directory includes Dave’s right (and user) after the Admin rebuild. Express `server.ts` already uses the same adapter.

### 3.3 Refactor checkpoint

- Analysis G1 observed at HTTP, not only at the helper.
- CopilotKit stays identity-only.

### Validation

```bash
RUN_TEST=access.264 npm run testByFile -w miroir-core -- access.264
RUN_TEST=access.262 npm run testByFile -w miroir-core -- access.262
RUN_TEST=authentication.71 npm run testByFile -w miroir-core -- authentication.71
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-server/tsconfig.json
```

### Realization

No extra adapter: Slice 1 union already runs in `RestClientStub` / Express. Phase3 proves Dave Library 200, Designer 403, Admin/Miroir 200; Carol Library 403; Alice Library 200; hatch off and 401 unchanged.

---

## Slice 4 — UI: Dave sees Library

**Status:** ✅ DONE

### Goal

Dave sees Library in the application selector and can stay on a Library report URL. He does not see Designer. Carol still sees neither. Alice still sees Library. Hatch off: selector unchanged.

**Layers cut:** helper that composes application **or** any granted deployment of that app → `useApplicationAccess` / selector / `PageDispatcher`.

### 4.1 RED

**Test:** `access.264.phase4.unit.test.ts` (pure helpers, real grant + deployment JSON).

Behavior asserted:

- Hatch off → Library + Designer (today’s candidate set).
- Alice (full grants) → Library yes, Designer no.
- Carol → neither.
- Dave → **Library yes**, Designer no — even though `hasAccess(application, Library)` is false.
- A deployment grant on Library does **not** make `hasAccess({ targetType: "application", targetUuid: Library })` true.
- `nextPageWhenAccessDenied` / reachability: Dave + Library application uuid → keep intended; Carol + Library → `/?page=home`.

Extend the helper signature as needed (`deployments: AccessDeployment[]` in addition to grants). Do not change `hasAccess`.

### 4.2 GREEN

`visibleUserApplications` (or a thin wrapper used by `useApplicationAccess`) treats an application as reachable when:

- `hasAccess` on `{ application, uuid }` (always-allow or application grant), **or**
- some loaded deployment has `selfApplication === uuid` and `hasAccess` on `{ deployment, deployment.uuid }`.

`useApplicationAccess` must load Deployment instances (entity `7959d814-…`) the same way it already loads rights. `canAccessApplication` uses the same reachability rule. `PageDispatcher` keeps using that boolean.

Do **not** add `useEffect`. Do not add a deployment selector (one deployment per app).

### 4.3 Refactor checkpoint

- UI calls `hasAccess` twice at most (app target, then per-deployment targets); it does not reimplement matching.
- Analysis G2 closed for Dave; G4 (second Library deployment) stays a non-goal — no UI for picking among two Library deployments.

### Validation

```bash
RUN_TEST=access.264 npm run testByFile -w miroir-core -- access.264
RUN_TEST=access.262 npm run testByFile -w miroir-core -- access.262
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
```

Manual (after GREEN, hatch-on server): log in as `dave` / `dave-dev` — selector shows Library, not Designer; Library report URL stays. `carol` — no Library. `alice` — Library present.

### Realization

Added `applicationIsReachable` and optional `deployments` on `visibleUserApplications`. `useApplicationAccess` loads Deployment rows and uses the union for selector + `canAccessApplication`. `hasAccess` still false for Dave on `{ application, Library }`. `access.264` 23/23; `access.262` 26/26. Rebuilt `miroir-core`. Standalone `tsc` still fails on pre-existing `ReportSectionListDisplay.tsx` / `ReportTools.ts`; `useApplicationAccess.ts` is clean.

---

## Slice 5 — Nonreg, docs, AC

**Status:** ✅ DONE

### 5.1 Nonreg

- Add `unit-264-deployment-access` to `scripts/nonreg-manifest.json` (`RUN_TEST=access.264` on `miroir-core`).

### 5.2 Docs

- `docs/reference/authentication.md`: deployment grants **are** evaluated (union with application grants); Dave / Alice / Carol matrix; capability still ignored; second Library deployment not in this increment.
- `analysis.md` status → implemented when slices 1–4 are green.
- #262 analysis sequencing already points at #264; keep that.

### 5.3 Issue-directory cleanup

- Keep `tests/4_services/issues/264-deployment-access/` until a later #238-style cleanup. Do not delete in the landing PR.

### 5.4 Tracer bullet (narrative)

1. Auth on. Sign in `dave` / `dave-dev`. Application selector shows Library, not Designer. A Library report URL stays. REST against Library filesystem deployment succeeds; Designer deployment returns 403.
2. Sign out. Sign in `carol` / `carol-dev`. No Library. Library REST 403.
3. Sign in `alice` / `alice-dev`. Library visible; Library REST succeeds (application grant).
4. Auth off. No login. Library selector and Library REST behave as today.

Automated equivalent: `access.264` phases 1–4 + `access.262` + `authentication.71`.

### 5.5 Refactor checkpoint

- #219 banned names still unused.
- `hasAccess` signature unchanged.
- Docs no longer say deployment grants are stored-only.

### Validation

```bash
RUN_TEST=access.264 npm run testByFile -w miroir-core -- access.264
RUN_TEST=access.262 npm run testByFile -w miroir-core -- access.262
RUN_TEST=authentication.71 npm run testByFile -w miroir-core -- authentication.71
npm run testByFile -w miroir-test-app_deployment-admin -- miroirUserRights
```

### Realization

Added `unit-264-deployment-access` after restored `unit-262-application-access` in `scripts/nonreg-manifest.json` (first insert accidentally replaced 262). Docs describe union evaluation and the Alice / Dave / Carol matrix. Analysis ACs ticked. Issue-directory tests kept.

Slice validation: `access.264` 23/23, `access.262` 26/26, `authentication.71` 43/43, `miroirUserRights` 21/21. `miroir-core` and `miroir-server` `tsc --noEmit --skipLibCheck` pass. Admin package rebuilt.

Admin `modelValidation` was a nonreg hard fail (3 pre-existing checks from #71/#262). Unblocked without changing `hasAccess`:
- Dropped invalid `unique: true` on `MiroirUser.username` and `MiroirUserCredential.miroirUser` tags (jzod tag schema has no `unique`; duplicate username/FK still fail closed at login — `authentication.71.phase7`).
- Removed Alice credential `description` (not in credential mlSchema). Dave/Carol instances already passed. Result: 45/45.

Standalone `tsc` still fails on pre-existing `ReportSectionListDisplay.tsx:432` and `ReportTools.ts:85` (untouched by this branch). Full `npm run nonreg`: **53 passed, 0 failed** (`test-results/nonreg/20260909T065723Z`, ~26.6 min). Includes restored `unit-262-application-access`, `unit-264-deployment-access`, and green `default-admin-modelValidation`.

---

## AC checklist (#264)

Canonical list: [`./analysis.md`](./analysis.md) § Acceptance Criteria.

| Criterion | Proven by | Status |
|---|---|---|
| Deployment grant → that deployment’s REST + UI | phase1 + phase3 + phase4 Dave | ✅ |
| Application grant → every deployment of that app | phase1 Alice application-only filter + phase3 Alice | ✅ |
| No grants → deny (403 after identity) | phase1 / phase3 Carol Library | ✅ |
| Deployment grant does not grant another deployment or application | phase1 Designer; phase2 `hasAccess` application Library false for Dave | ✅ |
| Admin / Miroir (and their deployments) always allowed | phase1 / phase3 Dave Admin/Miroir | ✅ |
| Capability ignored | inherited `hasAccess`; no new match key | ✅ |
| Hatch off = open API | phase1 + phase3 | ✅ |
| 401 vs 403 vs unknown deployment | phase3 | ✅ |
| Dave seed; Library visible, Designer not; Carol still denied | phase2 + phase4 | ✅ |
| Deep-link denied → home | phase4 Carol | ✅ |
| `hasAccess` generic; banned names unused | phase1 + `miroirUserRights` | ✅ |
| MCP / CLI / Electron ungated | non-goal / docs | ✅ |
