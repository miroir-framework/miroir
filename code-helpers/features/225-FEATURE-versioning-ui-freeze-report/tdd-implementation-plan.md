# Issue #225 — TDD Implementation Plan

## Scope

Operator **Versioning UI** in the Miroir meta-app that consumes the freeze primitive from **#216**:

- new **freeze** Runner invoking Model Endpoint `freezeApplicationVersion`;
- **AppBar** `commit` icon → **Versioning** report;
- Versioning report scoped to the **sidebar-selected application**;
- report shows freeze Runner + Application Version list; row → details report;
- MiroirTest **runnerTest** integ coverage for the freeze Runner.

This plan does **not** re-implement freeze / tip / diff / Cross persistence (#216). WP2 apply (#9), paired data migrations (#215), non-Entity snapshots, and Option B are out of scope.

Related:

- Issue: https://github.com/miroir-framework/miroir/issues/225
- Analysis: `./analysis.md`
- Prerequisite: [#216](../216-FEATURE-application-versions-and-freeze/) ✅
- Working branch: `cursor/versioning-ui-freeze-report-2a38`

**Resume note:** Phases 0–5 DONE.

---

## Progress summary

| Phase | Title | Status | Tests |
|---|---|---|---|
| 0 | Lock contracts & fixtures (Runner payload, report shape, AppBar link) | ✅ DONE | 6/6 `versioningUi.225.phase0` |
| 1 | Freeze Runner asset + registry | ✅ DONE | registry 1/1; modelValidation Runner instance; phase0 flipped |
| 2 | MiroirTest runnerTest integ — freeze Runner | ✅ DONE | `runner_freeze_application_version` 2/2 filesystem; action freeze 8/8 |
| 3 | Application Version details report + SAV `defaultInstanceDetailsReportUuid` | ✅ DONE | phase0 flipped; modelValidation 117/117 |
| 4 | Versioning report (freeze Runner + filtered AV list) | ✅ DONE | phase0 Versioning lock; modelValidation 118/118 |
| 5 | AppBar `commit` → Versioning (current-application aware) | ⬜ TODO | unit / light UI proof |
| 6 | Nonreg + docs + end-to-end tracer | ⬜ TODO | nonreg step + manual/integ tracer |

---

## Locked implementation defaults

| Open item | Choice for this plan |
|---|---|
| Runner `name` / registry key | `freezeApplicationVersion` (matches Action `actionType`; `runnerRef` same string) |
| Runner form fields | Required: `versionName`. Optional: `description`, `branch`. `application` bound from report/page context when possible; form may still expose it for runnerTest param banks |
| Model Endpoint | Existing `7947ae40-eb34-4149-887b-15a9021e714e` — **do not** fork a new Endpoint |
| Versioning report name | `Versioning` (Report Entity `3f2baa83-…`) |
| Current application source | Sidebar / `toolsPageState.applicationSelector` (and context application). AppBar navigation must use that uuid for `reportUrl`’s application argument, not a hard-coded Miroir SelfApplication |
| AV list filter | Extractor / combiner filter on SAV `selfApplication` === current application uuid. Do not list all apps’ versions |
| Details drill-down | New details Report + set `defaultInstanceDetailsReportUuid` on SelfApplicationVersion Entity (`c3f0facf-…`) mirroring Entity → EntityDetails |
| AppBar icon | Material Symbol / ThemedIcon name **`commit`** |
| Placeholder SAV rows | List may show historical `"Initial"` fixtures; freeze tip hygiene remains #216’s concern. Optional later: filter placeholders in the Versioning list only if product asks |
| Unversioned apps | Rely on existing `assertApplicationVersioningEnabled` / DomainController ActionError — UI must surface failure, not invent a parallel gate |
| Existing `ApplicationVersionList` (`0810de28-…`) | Leave in place for sidebar menu compatibility; Versioning report is the operator path (new report, do not break the old list) |

---

## Target public surfaces

1. **Runner** (deployment asset)
   - Instance under Runner Entity `e54d7dc1-4fbc-495e-9ed9-b5cf081b9fbd`
   - `customRunner` + `formMLSchema` + `compositeActionSequence` step with `actionType: "freezeApplicationVersion"`
   - Template: `createEntity` (`82f81a25-…`) / `dropEntity` (`44313751-…`)
2. **Registry**
   - `RUNNER_MIROIR_ENTITY_RUNNER_REGISTRY.freezeApplicationVersion` in `packages/miroir-test-app_deployment-miroir/src/runnerMiroirEntityTestRegistry.ts`
3. **Reports** (deployment assets under Report Entity `3f2baa83-…`)
   - `Versioning` — `list` of sections: `runnerReportSection` (freeze) + `objectListReportSection` (SAVs for current app)
   - `ApplicationVersionDetails` — `extractorByPrimaryKey` + `objectInstanceReportSection` (mirror `EntityDetails` `074d1de9-…`)
4. **Entity wiring**
   - SelfApplicationVersion (`c3f0facf-…`): `defaultInstanceDetailsReportUuid` → ApplicationVersionDetails
   - Mirror on EntityVersion of SAV (`27046fce-…`) if present-model / historical consistency requires it (prefer Entity present model first; EV only if modelValidation / UI still reads it)
5. **AppBar**
   - `miroirMenuReportLink` with `icon: "commit"`, `reportUuid` = Versioning report, `selfApplication` from **current** application selector
6. **MiroirTest**
   - Suite e.g. `runner_freeze_application_version` with `"miroirTestType": "runnerTest"`, `runnerRef: "freezeApplicationVersion"`
   - Playfield: versioned Library seed (same spirit as `domain_controller_application_version_freeze`)

Impl homes:

- Assets: `packages/miroir-test-app_deployment-miroir/assets/…`
- Registry / Model exports: `index.ts`, `src/Model.ts`, `src/runnerMiroirEntityTestRegistry.ts`
- AppBar: `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Page/AppBar.tsx`
- UI integ registry: `packages/miroir-standalone-app/src/miroir-fwk/4-tests/uiIntegrationTestRunnerSuiteRegistry.ts`
- Nonreg: `scripts/nonreg-manifest.json`

---

## Test execution conventions

| Purpose | Command |
|---|---|
| Miroir deployment modelValidation | `npm run testByFile -w miroir-test-app_deployment-miroir -- 'model' -t ''` |
| Rebuild deployment after asset edits | `npm run build -w miroir-test-app_deployment-miroir` |
| runnerTest integ (filesystem preferred for freeze) | `npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-filesystem --suites runner_freeze_application_version --mode integ` |
| Existing freeze actionTest (non-regression) | `npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-filesystem --suites domain_controller_application_version_freeze --mode integ` |
| AppBar / navigation unit | `npm run testByFile -w miroir-standalone-app -- <pattern>` |
| Default nonreg (includes modelValidation early) | `npm run nonreg` |

Legend:

- **RED**: new behavior test fails first
- **GREEN**: minimal implementation makes it pass
- **NON-REGRESSION**: #216 freeze actionTest + modelValidation stay green

Prefer **runnerTest** / modelValidation / thin AppBar unit over mocking DomainController. Do not re-test freeze planner internals here.

---

## Phase 0 — Lock contracts & fixtures  ✅ DONE

**Realization:** `packages/miroir-core/tests/1_core/versioningUi.225.phase0.unit.test.ts` (filesystem locks + gap inventory).

### Goal

Characterize gaps so Versioning UI work does not regress #216 and locks naming for Runner / reports / AppBar.

### 0.1 RED → GREEN — Characterization

Behaviors (test or checklist assertions in a small unit / modelValidation-oriented file under `code-helpers` or standalone):

- `FREEZE_APPLICATION_VERSION_ACTION_TYPE === "freezeApplicationVersion"` still exported from core.
- No Runner named `freezeApplicationVersion` exists yet under Runner data folder.
- SelfApplicationVersion Entity has **no** `defaultInstanceDetailsReportUuid`.
- AppBar has no `commit` icon / Versioning report link yet.
- Existing `ApplicationVersionList` (`0810de28-…`) remains unscoped (documents why Versioning report is new).

#### Validation

```bash
# Document-only / characterization — may be a short vitest file or Phase 0 comments in this plan until assets exist
npm run testByFile -w miroir-test-app_deployment-miroir -- 'model' -t 'SelfApplicationVersion'
```

**NON-REGRESSION:** `domain_controller_application_version_freeze` still green on filesystem.

---

## Phase 1 — Freeze Runner asset + registry  ✅ DONE

**Realization:** Runner `20d51c4c-…` (`freezeApplicationVersion`); registry key; MetaModel.runners; exports.

### Goal

Ship a freeze Runner that calls the Model Endpoint Action, registered for MiroirTest.

### 1.1 RED → GREEN — Runner JSON + export

- Add Runner JSON under `…/e54d7dc1-…/<new-uuid>.json`.
- `compositeActionSequence` includes one step: `freezeApplicationVersion` with payload fields from form / context.
- Export `runnerFreezeApplicationVersion` from `index.ts` / `index.d.ts`; add to `defaultMiroirMetaModel.runners` in `src/Model.ts`.
- Register `freezeApplicationVersion` in `RUNNER_MIROIR_ENTITY_RUNNER_REGISTRY`.

#### Validation

```bash
npm run build -w miroir-test-app_deployment-miroir
npm run testByFile -w miroir-test-app_deployment-miroir -- 'model' -t ''
# resolveRunnerMiroirEntityRunnerRef('freezeApplicationVersion') does not throw — cover in a tiny unit or Phase 2 suite setup
```

**NON-REGRESSION:** existing `createEntity` / `dropEntity` registry keys unchanged.

---

## Phase 2 — MiroirTest runnerTest integ  ✅ DONE

### Goal

Prove the Runner path end-to-end (not only DomainController actionTest).

### 2.1 RED → GREEN — Suite asset + leaves

New MiroirTest under `a311f363-…`, name e.g. `runner_freeze_application_version`, pattern from `runner_create_entity` (`4b4645f5-…`):

| Leaf | Behavior |
|---|---|
| Freeze V1 | Versioned Library playfield → Runner freeze → SAV named V1, empty `modelCUDMigration`, Cross present for app entities |
| Freeze V2 after alter | Mutate live Entity → freeze V2 → `previousVersion` = V1, representative `modelCUDMigration` |
| (Optional) Unversioned reject | If runnerTest can assert Action failure; else keep unit/actionTest only |

Wire:

- `miroirTest_*` export in `index.ts` / `Model.ts` tests array
- CLI suite registry + `uiIntegrationTestRunnerSuiteRegistry.ts` (same pattern as `RUNNER_CREATE_ENTITY_SUITE_KEY`)
- Generator script under this feature folder if the suite JSON is large (optional; follow #216 generator pattern)

#### Validation

```bash
npm run build -w miroir-test-app_deployment-miroir
npm run testMiroir -w miroir-standalone-app -- \
  --profile emulatedServer-filesystem \
  --suites runner_freeze_application_version --mode integ
```

**Result (2026-07-30):** ✅ 2/2 passed (`Freeze V1 Baseline`, `Freeze V1 alter Publisher commit Freeze V2`).

**Fix required:** `testBuildPlusRuntimeCompositeActionSuiteForRunner` recreates Library SelfApplication without `versioningEnabled`; set it for `LIBRARY_TMP.selfApplicationLibraryUuid` so freeze gate passes (ephemeral createEntity apps stay unversioned).

**NON-REGRESSION:**

```bash
npm run testMiroir -w miroir-standalone-app -- \
  --profile emulatedServer-filesystem \
  --suites domain_controller_application_version_freeze --mode integ
# runner_create_entity separately (mixed suite keys share primary session registry)
npm run testMiroir -w miroir-standalone-app -- \
  --profile emulatedServer-filesystem \
  --suites runner_create_entity --mode integ
```

**Result:** action freeze ✅ 8/8. `runner_create_entity` “Create Entity (no reports)” ✅; “Create Entity with reports” ❌ on filesystem independently of Phase 2 (reproduced with Runner.ts stashed). Not a Phase 2 regression.

---

## Phase 3 — Application Version details report  ✅ DONE

### Goal

List row click can open a details report for one SAV.

### 3.1 RED → GREEN — Details report + Entity pointer

- Add `ApplicationVersionDetails` Report (`extractorByPrimaryKey` on SAV `c3f0facf-…`, `instanceUuid` from parameters) — mirror `EntityDetails` / `RunnerDetails`.
- Set `defaultInstanceDetailsReportUuid` on SelfApplicationVersion Entity (and EV row if required for consistency / modelValidation).
- Export report; include in `defaultMiroirMetaModel.reports`.

**Delivered:** Report `17e78252-2540-4003-9305-d85c0c02d7ba`; SAV Entity + EV pointer; `reportApplicationVersionDetails` export + MetaModel.reports.

#### Validation

```bash
npm run build -w miroir-test-app_deployment-miroir
npm run testByFile -w miroir-test-app_deployment-miroir -- 'model' -t ''
```

**Result (2026-07-30):** ✅ modelValidation 117/117; phase0 SAV details lock green.

---

## Phase 4 — Versioning report  ✅ DONE

### Goal

Single report composition: freeze Runner on top, Application Versions for **current application** below.

### 4.1 RED → GREEN — Report asset

- New Report `Versioning` with `definition.section.type: "list"`:
  1. `runnerReportSection` → freeze Runner uuid (`storedRunner`)
  2. `objectListReportSection` (or equivalent) listing SAVs **filtered** by current application
- Filtering: extractor `filter` on `selfApplication` ← `getFromParameters("application")`
- Row navigation uses `defaultInstanceDetailsReportUuid` from Phase 3.
- Export + MetaModel.reports wiring.

**Delivered:** Report `c2b89408-bed7-473d-ab0a-2f4adc6a85e1` (`reportVersioning`).

#### Validation

```bash
npm run build -w miroir-test-app_deployment-miroir
npm run testByFile -w miroir-test-app_deployment-miroir -- 'model' -t ''
```

**Result (2026-07-30):** ✅ modelValidation 118/118; phase0 Versioning composition lock green. ApplicationVersionList remains unscoped.

---

## Phase 5 — AppBar `commit` icon  ⬜ TODO

### Goal

One-click access to Versioning for the **currently selected** application.

### 5.1 RED → GREEN — AppBar link

In `AppBar.tsx`:

- Add `miroirMenuReportLink` with `icon: "commit"`, `reportUuid` = Versioning report uuid, `section` appropriate for Reports (likely `"data"` like Runners, or `"model"` if Versioning is model-scoped — match Report’s storage section).
- **`selfApplication` must come from current application selector** (`context.toolsPageState.applicationSelector` / equivalent), **not** a hard-coded Miroir uuid.
- Deployment uuid resolved via `context.applicationDeploymentMap[currentApplication]` (same as existing `reportUrl` usage).

#### Validation

```bash
# Prefer a small unit that asserts the menu item shape / navigation target uses selector uuid
npm run testByFile -w miroir-standalone-app -- AppBar
# or a dedicated VersioningAppBar.unit.test if AppBar has no existing suite
```

Manual: select Library in sidebar → click `commit` → Versioning report for Library; switch to Miroir → same icon opens Versioning scoped to Miroir.

---

## Phase 6 — Nonreg, docs, tracer bullet  ⬜ TODO

### Goal

Lock the happy path in automation and close the issue AC checklist.

### 6.1 Nonreg

- Add `integ-runner-runner_freeze_application_version` (or similar) to `scripts/nonreg-manifest.json` under **default** tier (near other runner integ steps), filesystem or default profile consistent with freeze tests.
- Confirm early `default-*-modelValidation` steps still cover new Runner / Reports.

### 6.2 Docs

- Update `./analysis.md` status → implemented / phases done.
- Mark this plan’s progress table DONE.
- Brief note in `docs/contributing/testing.md` or `docs/reference/testing.md` if a new suite key is added.
- Comment on #225 with AC checklist (pass/fail per criterion).

### 6.3 Tracer bullet (narrative)

One filesystem integ or documented manual script:

1. Select Library (versioned) in sidebar.
2. Open Versioning via AppBar `commit`.
3. Freeze `UI-V1` via Runner → appears in list; `modelCUDMigration` empty.
4. Alter an Entity; freeze `UI-V2` → list shows both; V2 details show `previousVersion` + diff artefact.
5. Click V1 → details unchanged by live edits (#216 isolation).

#### Validation

```bash
npm run testMiroir -w miroir-standalone-app -- \
  --profile emulatedServer-filesystem \
  --suites runner_freeze_application_version --mode integ
npm run nonreg -- --only integ-runner-runner_freeze_application_version,default-miroir-modelValidation
# or full default nonreg before close
```

---

## Out of scope (explicit)

- Re-implementing `applicationVersionFreeze.ts` / DomainController freeze persist.
- WP2 migration apply UI; rollback; channels; auto-freeze.
- Filtering `"Initial"` placeholders from the Versioning list (unless product revisits).
- Replacing sidebar “Miroir Application Versions” menu entry.
- Perfect rendering of large `modelCUDMigration` trees (v1: show fields via objectInstance section; polish later).

---

## Suggested commit cadence

1. Phase 1 Runner + registry (+ rebuild).
2. Phase 2 runnerTest suite + registry wiring.
3. Phase 3 details report + SAV pointer.
4. Phase 4 Versioning report.
5. Phase 5 AppBar.
6. Phase 6 nonreg/docs/close comment.

Each phase: **RED → GREEN → NON-REGRESSION** before moving on.
