# TDD implementation plan — issue #219 (prep for #71)

Issue: https://github.com/miroir-framework/miroir/issues/219  
Parent feature: https://github.com/miroir-framework/miroir/issues/71  
Companion analysis: [`./analysis.md`](./analysis.md)

## Goal and guardrails

Deliver admin-model preparation for future auth/authz:

- Add `MiroirUser` and `MiroirRight` model concepts in Admin (analysis C1).
- Add list/detail reporting to inspect users and rights (analysis C5).
- Add sample data covering app-scope and deployment-scope rights (analysis C3).
- Keep runtime behavior unchanged: **no authorization enforcement**.

## Locked decisions (from analysis)

Pierced from analysis §Dividing choices — decided defaults. Do not reopen during implementation unless a hard blocker appears.

| ID | Decision | Implementation consequence |
|---|---|---|
| C1 | Entity `MiroirRight`, single grants entity | One Admin data entity; both scopes via fields |
| C2 | Free-string `capability` | No enum schema; seed with simple strings (`read` / `write` / `admin`) |
| C3 | `targetType` + `targetUuid` | Polymorphic target; validate against Application or Deployment by type |
| C4 | Subject = `miroirUser` FK only | No group/role subject fields |
| C5 | List + detail reports; generic editors only | No custom CRUD screens |
| C6 | Direct admin assets | Add under `miroir-test-app_deployment-admin`; rebuild package; no migration Action package |

## TDD strategy

Use vertical slices and integration-first tests:

1. Start each slice with failing tests (red) — run the explicit command; expect failure.
2. Implement minimal model/data/UI changes to pass (green) — re-run the same command.
3. Refactor for naming consistency and maintainability (refactor) — re-run Red + Validation commands.

Prefer existing Miroir integration-style validation over isolated mocks.

Legend:

- **Impacts** — what this phase changes in the repo / product surface
- **Validation** — exact commands proving the phase is done

### Shared command cookbook

| Purpose | Command |
|---|---|
| Admin model+data filesystem validation | `npm run testByFile -w miroir-test-app_deployment-admin -- modelValidation` |
| Admin package build | `npm run build -w miroir-test-app_deployment-admin` |
| Admin #219 phase tests (pattern) | `npm run testByFile -w miroir-test-app_deployment-admin -- miroirUserRights` |
| Filesystem DomainController integ | `VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-filesystem.json VITE_MIROIR_LOG_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/specificLoggersConfig_DomainController_debug.json npm run testByFile -w miroir-standalone-app -- DomainController.integ` |
| Type-check (when TS surfaces touched) | `npx tsc --noEmit --skipLibCheck` |

---

## Progress summary

| Phase | Title | Status | Primary RED / Validation command |
|---|---|---|---|
| 0 | Test harness and fixtures baseline | ✅ DONE | `… -- miroirUserRights.phase0` + `… -- modelValidation` |
| 1 | Introduce `MiroirUser` | ✅ DONE | `… -- miroirUserRights.phase1` + `… -- modelValidation` |
| 2 | Introduce `MiroirRight` | ⬜ TODO | `… -- miroirUserRights.phase2` + `… -- modelValidation` |
| 3 | Admin list/detail reporting | ⬜ TODO | `… -- miroirUserRights.phase3` |
| 4 | Behavior non-change safety net | ⬜ TODO | `… -- miroirUserRights.phase4` + DomainController.integ |
| 5 | Multi-store / bundled load checks | ⬜ TODO | DomainController.integ + sandbox bundled test |
| 6 | Final acceptance gate | ⬜ TODO | full phase command set below |

---

## Phase 0 — Test harness and fixtures baseline  ✅ DONE

### Goal

Characterize current Admin deployment: no `MiroirUser` / `MiroirRight` yet; existing admin model/data validation is green.

### Red

**New test file:**  
`packages/miroir-test-app_deployment-admin/tests/miroirUserRights.phase0.unit.test.ts`

Behaviors (must fail until later phases invert them — Phase 0 itself should pass by asserting **absence**):

- No Entity named `MiroirUser` under `assets/admin_model/`.
- No Entity named `MiroirRight` under `assets/admin_model/`.
- No data directories / instances for those entities under `assets/admin_data/`.
- Existing Application / Deployment / Menu / Report entities still present (smoke of current admin catalogue).

```bash
# RED (Phase 0 characterization — expect PASS while entities are absent)
npm run testByFile -w miroir-test-app_deployment-admin -- miroirUserRights.phase0
```

### Green

- Land the Phase 0 test file only.
- No Admin asset changes.

```bash
npm run testByFile -w miroir-test-app_deployment-admin -- miroirUserRights.phase0
```

### Refactor

- Extract shared helpers (e.g. list entity names from `admin_model`, list data parent folders) into  
  `packages/miroir-test-app_deployment-admin/tests/helpers/adminAssetInventory.ts` if duplication appears.

### Impacts

- New test files / helpers only.
- Locks expected entity display names (`MiroirUser`, `MiroirRight`) for Phases 1–2.
- Phase 0 tests will be **updated or superseded** in Phase 1–2 (absence → presence); do not leave contradictory expectations.

### Validation

```bash
npm run testByFile -w miroir-test-app_deployment-admin -- miroirUserRights.phase0
npm run testByFile -w miroir-test-app_deployment-admin -- modelValidation
```

Expect: both green; `git status` shows no new admin model/data entity assets from this phase.

---

## Phase 1 — Introduce `MiroirUser` model entity  ✅ DONE

### Goal

Add `MiroirUser` to Admin model + minimal seed users (analysis baseline; C6).

**Landed assets:**
- Entity `d20d09e5-0685-4fc7-b9bd-fcfa3845127a` (`MiroirUser`)
- EntityVersion `92b319e7-f8d9-439d-899b-138c64ed81f2`
- Seeds: Alice Admin (`active`), Bob Inactive (`inactive`)
- Exports: `entityMiroirUser`, `entityVersionMiroirUser`, `miroirUser_AliceAdmin`, `miroirUser_BobInactive`

### Red

**New test file:**  
`packages/miroir-test-app_deployment-admin/tests/miroirUserRights.phase1.unit.test.ts`

Behaviors (expect FAIL before assets exist):

- Entity named `MiroirUser` exists in `admin_model`.
- Present-model / EntityVersion schema includes required attrs: `uuid`, `name`, `status`; optional `description`.
- At least two seed instances exist under the corresponding `admin_data/<entityUuid>/`.
- Each seed instance has `status` in `{ "active", "inactive" }` (illustrative free-string).
- Package `index.ts` exports (or re-exports) the new entity / sample instances if that is the local packaging convention — assert whatever packaging convention Application/Deployment already use.

Also invert Phase 0 absence assertions for `MiroirUser` (delete or rewrite Phase 0 cases that would conflict).

```bash
# RED — expect FAIL
npm run testByFile -w miroir-test-app_deployment-admin -- miroirUserRights.phase1
```

### Green

- Add `MiroirUser` Entity (+ EntityVersion / present-model fields per current admin conventions) under  
  `packages/miroir-test-app_deployment-admin/assets/admin_model/`.
- Add seed instances under `assets/admin_data/<miroirUserEntityUuid>/`.
- Update `packages/miroir-test-app_deployment-admin/index.ts` exports to match Application/Deployment pattern.
- Rebuild package.

```bash
npm run build -w miroir-test-app_deployment-admin
npm run testByFile -w miroir-test-app_deployment-admin -- miroirUserRights.phase1
```

### Refactor

- Bland attribute names only (`name`, `status`, `description`).
- Entity description: platform-level user (UI label may still say "Users").

### Impacts

- Admin model + data assets; package exports; optional consumer import updates.
- Unblocks Phase 2 FK `miroirUser`.
- No auth/credentials.

### Validation

```bash
npm run build -w miroir-test-app_deployment-admin
npm run testByFile -w miroir-test-app_deployment-admin -- miroirUserRights.phase1
npm run testByFile -w miroir-test-app_deployment-admin -- modelValidation
```

Expect: Phase 1 + modelValidation green; Application/Deployment reports assets untouched.

---

## Phase 2 — Introduce `MiroirRight` model entity

### Goal

Add single `MiroirRight` entity with C2–C4 fields and seed rights for both target scopes.

### Red

**New test file:**  
`packages/miroir-test-app_deployment-admin/tests/miroirUserRights.phase2.unit.test.ts`

Behaviors (expect FAIL before assets exist):

- Entity named `MiroirRight` exists in `admin_model`.
- Schema/required attributes: `uuid`, `miroirUser`, `targetType`, `targetUuid`, `capability`; optional `description`.
- `targetType` accepts `"application"` and `"deployment"` only (or free-string with those two used in seeds — prefer literal union in schema if Admin Jzod patterns allow; otherwise free-string + seed convention).
- ≥1 seed right with `targetType === "application"` whose `targetUuid` equals an existing Admin Application instance uuid.
- ≥1 seed right with `targetType === "deployment"` whose `targetUuid` equals an existing Admin Deployment instance uuid.
- Every seed right `miroirUser` equals a Phase 1 seed `MiroirUser` uuid.
- `capability` is a non-empty string (C2).

Invert remaining Phase 0 absence assertions for `MiroirRight`.

```bash
# RED — expect FAIL
npm run testByFile -w miroir-test-app_deployment-admin -- miroirUserRights.phase2
```

### Green

- Add `MiroirRight` model + data assets; wire exports in `index.ts`.
- Seed both scopes; FKs resolve to real Application/Deployment/`MiroirUser` instances.
- Rebuild package.

```bash
npm run build -w miroir-test-app_deployment-admin
npm run testByFile -w miroir-test-app_deployment-admin -- miroirUserRights.phase2
```

### Refactor

- Document in entity description that `capability` strings are provisional until #71.
- No group/role subject fields (C4).

### Impacts

- Declarative grants in Admin data only.
- Unblocks Phase 3 reports.
- Still no DomainController enforcement.

### Validation

```bash
npm run build -w miroir-test-app_deployment-admin
npm run testByFile -w miroir-test-app_deployment-admin -- miroirUserRights.phase2
npm run testByFile -w miroir-test-app_deployment-admin -- modelValidation
npm run testByFile -w miroir-test-app_deployment-admin -- miroirUserRights.phase1
```

Expect: Phases 1–2 + modelValidation green; referential integrity assertions pass.

---

## Phase 3 — Admin list/detail reporting (C5)

### Goal

Expose Users and Rights via Admin list + detail reports and menu entries; generic editors only.

### Red

**New test file:**  
`packages/miroir-test-app_deployment-admin/tests/miroirUserRights.phase3.unit.test.ts`

Behaviors (expect FAIL before report/menu assets exist):

- Report assets exist for:
  - `MiroirUser` list,
  - `MiroirUser` detail,
  - `MiroirRight` list,
  - `MiroirRight` detail  
  (assert by report `name` / stable uuid constants once chosen — mirror ApplicationList / ApplicationDetails patterns under  
  `assets/admin_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/`).
- Default Admin menu (`menuDefaultAdmin` /  
  `assets/admin_model/dde4c883-ae6d-47c3-b6df-26bc6e3c1842/dd168e5a-2a21-4d2d-a443-032c6d15eb22.json`)  
  references the new list reports.
- Right list/detail definitions include columns/fields for `miroirUser`, `capability`, `targetType`, `targetUuid`.
- No new React form component files under `packages/miroir-react` or `packages/miroir-standalone-app` named for MiroirUser/MiroirRight CRUD (assert via absence of dedicated paths or a simple inventory check in the test).

```bash
# RED — expect FAIL
npm run testByFile -w miroir-test-app_deployment-admin -- miroirUserRights.phase3
```

### Green

- Add Report (+ Query if required by Admin report pattern) assets; update `menuDefaultAdmin`; export from `index.ts` if peers are exported.
- Do not add custom CRUD React forms.
- Rebuild package.

```bash
npm run build -w miroir-test-app_deployment-admin
npm run testByFile -w miroir-test-app_deployment-admin -- miroirUserRights.phase3
```

### Refactor

- Dull labels: Name, Status, Capability, Target type, Target.
- Deduplicate query fragments if any were copied from Application reports.

### Impacts

- Admin navigation + report catalogue.
- Operators can inspect seed grants in Admin UI.
- No policy / auth screens.

### Validation

```bash
npm run build -w miroir-test-app_deployment-admin
npm run testByFile -w miroir-test-app_deployment-admin -- miroirUserRights.phase3
npm run testByFile -w miroir-test-app_deployment-admin -- modelValidation
```

Optional manual smoke (not a gate): open Admin in Vite client, open Users list / Rights list.

Expect: Phase 3 + modelValidation green; no new `*MiroirUser*Form*` / `*MiroirRight*Form*` sources.

---

## Phase 4 — Behavior non-change safety net

### Goal

Prove `MiroirRight` data does not introduce allow/deny behavior.

### Red

**New test file:**  
`packages/miroir-test-app_deployment-admin/tests/miroirUserRights.phase4.unit.test.ts`

Behaviors:

- Static inventory: under `packages/miroir-core/src`, `packages/miroir-server/src`, and store packages, no new symbols matching `/checkMiroirRight|authorizeMiroir|hasMiroirAccess|evaluateMiroirRight/` (adjust pattern to whatever would be introduced; keep the test as a hard fail if such files/exports appear).
- Comment/title in test: `#219 is model/display prep only; enforcement is #71`.

**Plus existing integ (non-reg RED baseline before claiming green):**

```bash
# RED characterization / non-reg — must stay green with rights assets loaded
npm run testByFile -w miroir-test-app_deployment-admin -- miroirUserRights.phase4

VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-filesystem.json \
VITE_MIROIR_LOG_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/specificLoggersConfig_DomainController_debug.json \
npm run testByFile -w miroir-standalone-app -- DomainController.integ.Data.CRUD
```

### Green

- Add Phase 4 test only; **no** DomainController/store authorization hooks.
- Fix only accidental enforcement if introduced earlier (should be none).

```bash
npm run testByFile -w miroir-test-app_deployment-admin -- miroirUserRights.phase4
```

### Refactor

- Keep the guard test dull and narrow (filename/symbol scan), not a full policy framework.

### Impacts

- Test-only safety net for the #71 boundary.
- Production runtime codepaths for authz remain untouched.

### Validation

```bash
npm run testByFile -w miroir-test-app_deployment-admin -- miroirUserRights.phase4

VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-filesystem.json \
VITE_MIROIR_LOG_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/specificLoggersConfig_DomainController_debug.json \
npm run testByFile -w miroir-standalone-app -- DomainController.integ.Data.CRUD

VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-filesystem.json \
VITE_MIROIR_LOG_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/specificLoggersConfig_DomainController_debug.json \
npm run testByFile -w miroir-standalone-app -- DomainController.integ.Model.CRUD
```

Expect: all green; Phase 4 scan finds no enforcement symbols.

---

## Phase 5 — Multi-store / bundled load checks (C6)

### Goal

Admin assets load on filesystem integ path; bundled classification treats new entities as Admin **data** (like Application/Deployment), not mistakenly as model-only.

### Red

**New or extended test file (prefer sandbox or admin package):**  
`packages/miroir-sandbox/tests/bundledAdminClassification.miroirUserRights.unit.test.ts`  
*(create `packages/miroir-sandbox/tests/` if missing; alternatively colocate next to `bundledData.ts` consumers)*

Behaviors (expect FAIL if classification wrong):

- After split via `ADMIN_MODEL_PARENT_UUIDS`, instances of `MiroirUser` and `MiroirRight` land in **data**, not model (same rule as Application `25d935e7-…` / Deployment `7959d814-…`).
- `ADMIN_MODEL_PARENT_UUIDS_ARRAY` does **not** need those entity uuids unless Admin packaging conventions change (assert data-side presence).

**Plus load path:**

```bash
# RED — expect FAIL if bundled split wrong or admin assets unloadable
npm run testByFile -w miroir-sandbox -- bundledAdminClassification.miroirUserRights

VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-filesystem.json \
VITE_MIROIR_LOG_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/specificLoggersConfig_DomainController_debug.json \
npm run testByFile -w miroir-standalone-app -- DomainController.integ.Data.CRUD
```

If `miroir-sandbox` has no vitest script yet, place the classification test under  
`packages/miroir-test-app_deployment-admin/tests/miroirUserRights.phase5.unit.test.ts`  
and import the classification helper / parentUuid sets from sandbox or duplicate the Set rule under test — prefer one package that already runs vitest.

### Green

- Fix `bundledData.ts` / classification only if tests fail.
- Ensure admin data folders are included in package build/export as peers are.
- No migration Action package (C6).

```bash
npm run build -w miroir-test-app_deployment-admin
npm run testByFile -w miroir-test-app_deployment-admin -- miroirUserRights.phase5
# or:
# npm run testByFile -w miroir-sandbox -- bundledAdminClassification.miroirUserRights
```

### Refactor

- Avoid duplicating the full parentUuid list in tests; import `ADMIN_MODEL_PARENT_UUIDS_ARRAY` when possible.

### Impacts

- Possible `packages/miroir-sandbox/src/bundledData.ts` update.
- Consumers of bundled Admin data see Users/Rights in the data section.

### Validation

```bash
npm run build -w miroir-test-app_deployment-admin
npm run testByFile -w miroir-test-app_deployment-admin -- modelValidation
npm run testByFile -w miroir-test-app_deployment-admin -- miroirUserRights.phase5

VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-filesystem.json \
VITE_MIROIR_LOG_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/specificLoggersConfig_DomainController_debug.json \
npm run testByFile -w miroir-standalone-app -- DomainController.integ.Data.CRUD
```

**Deferred unless already broken by this change (document in PR if skipped):**

```bash
VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-indexedDb.json \
VITE_MIROIR_LOG_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/specificLoggersConfig_DomainController_debug.json \
npm run testByFile -w miroir-standalone-app -- DomainController.integ.Data.CRUD

VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-sql.json \
VITE_MIROIR_LOG_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/specificLoggersConfig_DomainController_debug.json \
npm run testByFile -w miroir-standalone-app -- DomainController.integ.Data.CRUD
```

Expect: filesystem path + modelValidation + phase5 classification green.

---

## Phase 6 — Final acceptance gate

### Goal

Close #219 against analysis deliverable boundaries.

### Impacts

- Status/docs only; no new schema inventiveness.

### Validation

Run the full command set (all must pass):

```bash
npm run build -w miroir-test-app_deployment-admin

npm run testByFile -w miroir-test-app_deployment-admin -- miroirUserRights
npm run testByFile -w miroir-test-app_deployment-admin -- modelValidation

VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-filesystem.json \
VITE_MIROIR_LOG_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/specificLoggersConfig_DomainController_debug.json \
npm run testByFile -w miroir-standalone-app -- DomainController.integ.Data.CRUD

VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-filesystem.json \
VITE_MIROIR_LOG_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/specificLoggersConfig_DomainController_debug.json \
npm run testByFile -w miroir-standalone-app -- DomainController.integ.Model.CRUD
```

### Checklist

- [ ] `MiroirUser` / `MiroirRight` exist and pass `modelValidation` (C1).
- [ ] Seeds cover application + deployment scopes (`targetType` + `targetUuid`) (C3).
- [ ] Rights use `miroirUser` only; `capability` free-string (C2, C4).
- [ ] List/detail reports + menu wiring present; no custom CRUD forms (C5).
- [ ] Direct assets; no migration Action package (C6).
- [ ] Phase 4 scan: no enforcement hooks.
- [ ] Commands above green.

---

## Favored path summary (dull defaults)

1. **Right entity name:** `MiroirRight`.
2. **Capability encoding:** free-string `capability`.
3. **Target shape:** `targetType` + `targetUuid`.
4. **UI level:** list + detail reports; generic editors only.
5. **Subject:** `miroirUser` FK only.
6. **Delivery:** direct Admin assets (C6).

## Done definition

Issue #219 is done when Phases 0–6 Validation commands are green, locked decisions C1–C6 hold, and #71 can consume `MiroirUser` / `MiroirRight` without renaming core concepts.
