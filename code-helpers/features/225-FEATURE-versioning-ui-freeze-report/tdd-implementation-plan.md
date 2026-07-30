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

**Resume note:** Phases 0–6 DONE.

---

## Progress summary

| Phase | Title | Status | Tests |
|---|---|---|---|
| 0 | Lock contracts & fixtures (Runner payload, report shape, AppBar link) | ✅ DONE | 7/7 `versioningUi.225.phase0` |
| 1 | Freeze Runner asset + registry | ✅ DONE | registry 1/1; modelValidation Runner instance; phase0 flipped |
| 2 | MiroirTest runnerTest integ — freeze Runner | ✅ DONE | `runner_freeze_application_version` 2/2 filesystem; action freeze 8/8 |
| 3 | Application Version details report + SAV `defaultInstanceDetailsReportUuid` | ✅ DONE | phase0 flipped; modelValidation |
| 4 | Versioning report (freeze Runner + filtered AV list) | ✅ DONE | phase0 Versioning lock; modelValidation 118/118 |
| 5 | AppBar `commit` → Versioning (current-application aware) | ✅ DONE | phase0 + AppBarVersioning 3/3 |
| 6 | Nonreg + docs + end-to-end tracer | ✅ DONE | nonreg step + docs + tracer narrative |

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

## Delivered UUIDs / keys

| Artefact | Value |
|---|---|
| Freeze Runner | `20d51c4c-52e5-4077-baf3-5e87bd75e496` |
| runnerTest suite | `967eff73-2a41-40c8-aa8d-87d292d31953` / `runner_freeze_application_version` |
| ApplicationVersionDetails | `17e78252-2540-4003-9305-d85c0c02d7ba` |
| Versioning report | `c2b89408-bed7-473d-ab0a-2f4adc6a85e1` |
| Nonreg step | `integ-runner-runner_freeze_application_version` |

---

## Phase 0–5

Completed — see git history on `cursor/versioning-ui-freeze-report-2a38` and phase markers above. Summary:

- **Phase 0:** characterization locks in `versioningUi.225.phase0.unit.test.ts`
- **Phase 1:** Runner asset + `RUNNER_MIROIR_ENTITY_RUNNER_REGISTRY.freezeApplicationVersion`
- **Phase 2:** runnerTest integ; Library `versioningEnabled` in runner beforeEach
- **Phase 3:** ApplicationVersionDetails + SAV pointer
- **Phase 4:** Versioning report (storedRunner + filtered SAV list)
- **Phase 5:** AppBar `commit` + `resolveAppBarReportLinkApplication`

---

## Phase 6 — Nonreg, docs, tracer bullet  ✅ DONE

### Goal

Lock the happy path in automation and close the issue AC checklist.

### 6.1 Nonreg

- Added `integ-runner-runner_freeze_application_version` to `scripts/nonreg-manifest.json` (default tier, hardcoded `emulatedServer-filesystem`, `requires: none`).
- Early `default-*-modelValidation` continues to cover new Runner / Reports.

### 6.2 Docs

- `./analysis.md` status → implemented.
- This plan’s progress table DONE.
- `docs/contributing/testing.md` + `docs/reference/testing.md` note the new suite key.

### 6.3 Tracer bullet (narrative)

1. Select Library (versioned) in sidebar.
2. Open Versioning via AppBar `commit`.
3. Freeze `UI-V1` via Runner → appears in list; `modelCUDMigration` empty.
4. Alter an Entity; freeze `UI-V2` → list shows both; V2 details show `previousVersion` + diff artefact.
5. Click V1 → details unchanged by live edits (#216 isolation).

Automated equivalent: `runner_freeze_application_version` leaves (V1 baseline + V1→alter→V2).

#### Validation

```bash
npm run testMiroir -w miroir-standalone-app -- \
  --profile emulatedServer-filesystem \
  --suites runner_freeze_application_version --mode integ
npm run nonreg -- --only integ-runner-runner_freeze_application_version,default-miroir-modelValidation
```

### AC checklist (#225)

| Criterion | Status |
|---|---|
| Freeze Runner invokes Model Endpoint `freezeApplicationVersion` | ✅ |
| AppBar `commit` → Versioning report | ✅ |
| Versioning scoped to sidebar-selected application | ✅ |
| Report shows freeze Runner + AV list; row → details | ✅ |
| runnerTest integ for freeze Runner | ✅ |
| Nonreg step for freeze runner suite | ✅ |

---

## Out of scope (explicit)

- Re-implementing `applicationVersionFreeze.ts` / DomainController freeze persist.
- WP2 migration apply UI; rollback; channels; auto-freeze.
- Filtering `"Initial"` placeholders from the Versioning list (unless product revisits).
- Replacing sidebar “Miroir Application Versions” menu entry.
- Perfect rendering of large `modelCUDMigration` trees (v1: show fields via objectInstance section; polish later).
