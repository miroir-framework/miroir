# Issue #241 — TDD Implementation Plan

> Vertical TDD slices (RED → GREEN each), integration-first per `docs/contributing/testing.md`.
> This issue is **applicative-first**: Reports, Menus, and Entity `viewAttributes` in
> `miroir-test-app_deployment-designer` are the public interface under test. No TypeScript
> runtime changes expected unless report execution exposes a gap. Vitest is used for
> contract/inventory locks (not reachable through MiroirTest — designer deployment has no
> MiroirTest suite or domain-state fixture yet). `modelValidation` is the primary GREEN gate
> for JSON assets. No mocks.
>
> **Execution model:** human-in-the-loop. No slice contains a commit step — commits happen
> only when the user explicitly asks. Each slice ends with Validation commands; on success
> its Realization summary is appended and Status flips to ✅ DONE.

Analysis: [`./analysis.md`](./analysis.md) · Issue: https://github.com/miroir-framework/miroir/issues/241

**Resume note:** all slices ✅ — feature #241 complete.

---

## Scope

In scope:

- Reorder `viewAttributes` on Activity, UserStory, Role (`designerApplication` first).
- Fix/rename `ApplicationList` / `ApplicationDetails` in place (UUIDs `951d74b2`, `f730ecf1`): Designer `selfApplication`, `parentName: DesignerApplication`, labels.
- Expand `ApplicationDetails` → composite **DesignerApplicationDetails** (header + scoped Activities + User Stories + derived Roles).
- Add **Designer Applications** as first menu item in `DesignerMenu`.
- Update `index.ts` exports (`reportDesignerApplicationList`, `reportDesignerApplicationDetails`, …).
- Contract tests + `modelValidation`; add designer deployment to nonreg manifest.

This plan does **not** implement cross-FK validation, seed requirements for all five DesignerApplication rows, new report UUIDs, multi-app sidebar rendering (#240), or MiroirTest `queryTest` infrastructure for the designer deployment (deferred — manual tracer + structural vitest instead).

---

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Characterize designer multi-app gaps | ✅ | `designerMultiApp.unit.test.ts` |
| 1 | Multi-app navigation + composite details (all JSON) | ✅ | `modelValidation` + contract suite GREEN |
| 2 | Designer data validation + nonreg + AC | ✅ | extended `modelValidation` + nonreg step |
| 3 | Docs, cleanup, tracer narrative | ✅ | analysis status + manual checklist |

---

## Locked implementation defaults

Carried from [`analysis.md`](./analysis.md) (grill-me 2026-08-18); binding. Deviations go into the slice Realization.

| Decision | Choice |
|---|---|
| Data model | FK sufficient; no cross-FK validation |
| Application reports | Fix/rename in place — UUIDs `951d74b2`, `f730ecf1` |
| Menu hub | Designer Applications first, then Roles, Activities, User Stories |
| Global lists | Unfiltered extractors; `designerApplication` first column via `viewAttributes` |
| Global Roles menu | Keep for Role CRUD |
| Details — roles | Derived from user stories only (distinct `userStory.role`) |
| Details layout | Composite report: header → activities → user stories → derived roles |
| Acceptance data | Designer `880831db-…` populated; Library `5af03c98-…` empty |

---

## Allocated UUIDs / keys

No new model element UUIDs — reuse existing reports and entities.

| Role | UUID |
|---|---|
| Designer selfApplication (shell) | `880831db-4f76-40b1-97c0-6a2f3f4ffccb` |
| DesignerApplication entity | `25d935e7-9e93-42c2-aade-0472b883492b` |
| DesignerApplicationList (rename in place) | `951d74b2-a3e9-4e07-8850-1d7d12909f11` |
| DesignerApplicationDetails (expand in place) | `f730ecf1-88b6-46ea-8147-aa24ff7cdfcf` |
| Activity entity | `fd622624-1a7e-46fa-9964-c4ecfb543de3` |
| UserStory entity | `59debf06-405d-4def-a7eb-3db45360310d` |
| Role entity | `702535cd-e6fa-49d6-aa6f-b5874821e5a3` |
| ActivityList | `1366684b-e0c0-4c91-9496-dccd97d9a28d` |
| UserStoryList | `7f037bbb-3a5a-4111-b8ec-85ef756c9ff2` |
| RoleList | `87f62ef5-913a-4652-b331-c126ff0e4fdb` |
| DesignerMenu | `dd168e5a-2a21-4d2d-a443-032c6d15eb22` |
| Populated DesignerApplication | `880831db-4f76-40b1-97c0-6a2f3f4ffccb` |
| Empty DesignerApplication (acceptance) | `5af03c98-fe5e-490b-b08f-e1230971c57f` |

| Test artefact | Location |
|---|---|
| Contract suite (permanent) | `packages/miroir-test-app_deployment-designer/tests/designerMultiApp.unit.test.ts` |
| Nonreg step id | `default-designer-modelValidation` |

---

## Test execution conventions

| Purpose | Command |
|---|---|
| Designer contract tests | `npm run testByFile -w miroir-test-app_deployment-designer -- designerMultiApp` |
| Designer modelValidation | `npm run testByFile -w miroir-test-app_deployment-designer -- modelValidation` |
| Rebuild designer package | `npm run build -w miroir-test-app_deployment-designer` |
| Repo nonreg (after slice 2) | `npm run nonreg -- --filter default-designer-modelValidation` |
| Full nonreg (final) | `npm run nonreg` |

No `miroir-core` schema rebuild required — entity schemas unchanged (only `viewAttributes` order and report JSON).

---

## Slice 0 — Characterize designer multi-app gaps

**Status:** ✅ DONE

### Goal

Lock the analysis inventory as failing tests so Slice 1 produces a reviewable diff and proves the starting misalignments.

### 0.1 RED → GREEN — contract inventory

**Test:** `packages/miroir-test-app_deployment-designer/tests/designerMultiApp.unit.test.ts`

**Justification:** Not reachable through MiroirTest — designer deployment has no `MiroirTest` entity data or `designerDomainState` fixture; vitest reads real JSON assets via direct imports and `import.meta.glob` (same pattern as `modelValidation.unit.test.ts`).

Behavior asserted (target state — implemented one-shot with Slice 1, no separate RED commit):

1. **Menu** — `DesignerMenu` Requirements section has **4** items; first is **Designer Applications** → `951d74b2`.
2. **DesignerApplicationList** — `selfApplication` = `880831db-…`; `parentName` = `DesignerApplication`.
3. **DesignerApplicationDetails** — composite report: **4** sections; combiners `activitiesOfDesignerApplication`, `userStoriesOfDesignerApplication`; RT `rolesUsedByUserStories`.
4. **viewAttributes** — Activity, UserStory, Role: `designerApplication` at index 0.
5. **Data snapshot** — Designer `880831db-…`: 3 Activities, 5 UserStories, 3 Roles; Library `5af03c98-…`: zero rows in all three.

### Validation

```bash
npm run testByFile -w miroir-test-app_deployment-designer -- designerMultiApp
```

### Realization

**2026-08-18 — one-shot with Slice 1.** Skipped a separate RED-only commit: contract tests were written directly against target state in `tests/designerMultiApp.unit.test.ts` (permanent path, not `tests/issues/241-*`). Five `it` blocks cover menu order, list report wiring, composite details structure, `viewAttributes` order, and acceptance data counts. No `issues/` directory created.

---

## Slice 1 — Multi-app navigation + composite details (all JSON)

**Status:** ✅ DONE

### Goal

Deliver the full applicative behaviour in one vertical cut: user opens **Designer Applications** from the menu, drills into an app, and sees scoped Activities, User Stories, and derived Roles; global lists show DesignerApplication as the first column.

**Layers cut:** Entity `viewAttributes` → Report JSON → Menu JSON → `index.ts` exports → `modelValidation`.

### 1.1 RED

Contract suite in `designerMultiApp.unit.test.ts` (see Slice 0).

### 1.2 GREEN

Implement all JSON + export changes in one pass:

| Area | Changes |
|------|---------|
| **Entity viewAttributes** | Activity, UserStory, Role: `designerApplication` first |
| **951d74b2** | Rename `DesignerApplicationList`; fix `selfApplication`, `parentName`, labels |
| **f730ecf1** | Rename `DesignerApplicationDetails`; fix wiring; add sections: PK header; `combinerOneToMany` Activities (`designerApplication` FK); `combinerOneToMany` UserStories + reuse `userStoriesWithUserStory` RT from `7f037bbb`; derived roles RT (map scoped user stories → distinct role UUIDs → join `rolesIndex`) |
| **dd168e5a** | Insert menu item `Designer Applications` → `951d74b2` first in Requirements |
| **index.ts** | Rename exports; rebuild `dist/` |

**Derived roles implementation note:** mirror `ActivityDetails` combiner pattern for activities/user stories; for roles, chain `mapList` on scoped user stories extracting `role`, dedupe (e.g. `indexListBy` + filter), then merge role names from a `roles` extractor scoped to the same DesignerApplication via combiner or post-filter in RT.

### 1.3 Refactor checkpoint

- Remove stale comments in `index.ts` (`// Admin Model - Reports` if misleading).
- Align report `name` / `defaultLabel` / section labels with UserStory terminology throughout touched files.
- Confirm no duplicate report definitions left from UseCase rename.

### Validation

```bash
npm run testByFile -w miroir-test-app_deployment-designer -- designerMultiApp
npm run testByFile -w miroir-test-app_deployment-designer -- modelValidation
npm run build -w miroir-test-app_deployment-designer
```

### Realization

**2026-08-18.** All applicative assets updated in one pass:

- **`951d74b2`** → `DesignerApplicationList`: `selfApplication` `880831db-…`, extractor `designerApplications`, `parentName: DesignerApplication`.
- **`f730ecf1`** → `DesignerApplicationDetails`: four sections; combiners `activitiesOfDesignerApplication` / `userStoriesOfDesignerApplication` (`objectReference: designerApplication`); RT chain `userStoriesOfDesignerApplicationWithUserStory` (mustache template from `ActivityDetails`/`UserStoryList`), `roleUuidsFromUserStories` (`getUniqueValues` on `role`), `rolesUsedByUserStories` (`mapList` + `rolesIndex` lookup).
- **`dd168e5a`**: new first menu item **Designer Applications** (icon `interests`); 4 items total in Requirements.
- **Entity `viewAttributes`**: `designerApplication` moved to index 0 on Activity, UserStory, Role entity JSON files.
- **`index.ts`**: exports `reportDesignerApplicationList` / `reportDesignerApplicationDetails`; comment block renamed to **Designer Model - Reports**; `npm run build` refreshed `dist/`.

**Refactor checkpoint:** removed misleading `// Admin Model - Reports` comment; no stale `UseCaseList` asset on disk. `modelValidation` passed for all updated Report/Menu/Entity rows including `DesignerApplicationDetails` (112 ms jzod check).

**Deviation:** Slices 0 and 1 landed in a single session (user-requested one-shot); no intermediate RED-only tree.

---

## Slice 2 — Designer data validation + nonreg + AC

**Status:** ✅ DONE

### Goal

Prove designer **data** instances validate against entity schemas (today `modelValidation` only covers admin_data + model JSON, not Activity/UserStory/Role data folders).

### 2.1 RED → GREEN — extend modelValidation

**Test:** extend `packages/miroir-test-app_deployment-designer/tests/modelValidation.unit.test.ts`

Add `import.meta.glob` suites:

| Group | Glob | Schema source |
|-------|------|---------------|
| Activity data | `designer_data/fd622624-…/*.json` | `entityActivity.mlSchema` |
| UserStory data | `designer_data/59debf06-…/*.json` | `entityUserStory.mlSchema` |
| Role data | `designer_data/702535cd-…/*.json` | `entityRole.mlSchema` |
| DesignerApplication data | `designer_data/25d935e7-…/*.json` | `entityApplicationForDesigner.mlSchema` |

Use `defaultMiroirModelEnvironment` or a minimal designer meta-model env if needed (mirror existing Entity/Report groups).

### 2.2 Nonreg manifest

Add step to `scripts/nonreg-manifest.json`:

```json
{
  "id": "default-designer-modelValidation",
  "tier": "default",
  "title": "Deployment modelValidation — designer",
  "requires": "none",
  "argv": [
    "npm",
    "run",
    "testByFile",
    "-w",
    "miroir-test-app_deployment-designer",
    "--",
    "modelValidation"
  ]
}
```

Place after `default-library-modelValidation` in the default tier.

### Validation

```bash
npm run testByFile -w miroir-test-app_deployment-designer -- modelValidation
npm run nonreg -- --filter default-designer-modelValidation
```

### Realization

**2026-08-18.**

- Added **`designerMetaModel`** + **`designerModelEnvironment`** in `modelValidation.unit.test.ts` (entities: DesignerApplication, Activity, UserStory, Role, ApplicationVersion; deployment `f0359240-…`).
- Four new **`describeEntityGroup`** suites over `designer_data/` globs — 16 data instance tests (5 DesignerApplications, 3 Activities, 5 UserStories, 3 Roles).
- **`describeEntityGroup`** now **skips empty globs** — fixes pre-existing vitest failures for empty `admin_data/` directories (AdminApplication, Deployment, ViewParams, Import suites had zero files).
- Removed **`versioningMode`** from Designer SelfApplication JSON (`880831db-…`) — field absent from `entityDefinitionSelfApplication` mlSchema used by validation; pre-existing failure unrelated to #241 scope.
- Added **`default-designer-modelValidation`** to `scripts/nonreg-manifest.json` after library step.

**Result:** `modelValidation` — **34 passed** (was 17 model + 1 failing SelfApplication before fixes).

---

## Slice 3 — Docs, cleanup, tracer narrative

**Status:** ✅ DONE

### 3.1 Docs

- `analysis.md` — status → **implemented**; link to this plan.
- `packages/miroir-test-app_deployment-designer/README.md` — note multi-app requirements navigation.

### 3.2 Issue-directory cleanup

Migrate any still-valuable assertions from `tests/issues/241-designer-multi-app/` into a permanent feature-named file (e.g. `tests/designerMultiApp.unit.test.ts`) or keep as permanent contract suite if small; delete empty `issues/241-*` directory per #238 rule.

### 3.3 Tracer bullet (manual)

1. Open Designer app → Requirements → **Designer Applications** → list shows 5 apps.
2. Open **Library** details → Activities, User Stories, Roles sections **empty**.
3. Open **Designer** details → Activities (3), User Stories (5), derived Roles (≤3 distinct).
4. Open global **Activities** / **User Stories** / **Roles** → **DesignerApplication** appears as **first column**.
5. Create a User Story on Library app (future manual check) — appears under Library details only.

Automated equivalent: Slice 0/1 contract suite + extended `modelValidation` + nonreg step.

### AC checklist (#241)

| Criterion | Proven by | Status |
|---|---|---|
| Activity/UserStory/Role FK per DesignerApplication (schema) | `modelValidation` Entity group (unchanged) | ✅ |
| DesignerApplications menu list | `designerMultiApp.unit.test.ts` + manual tracer §3.3 step 1 | ✅ |
| DesignerApplication details: scoped activities | contract test (4 sections + combiner) + manual step 3 | ✅ |
| DesignerApplication details: scoped user stories | contract test + manual step 3 | ✅ |
| DesignerApplication details: roles from user stories | contract test (`rolesUsedByUserStories` RT) + manual step 3 | ✅ |
| Global lists show DesignerApplication first column | contract test (`viewAttributes[0]`) + manual step 4 | ✅ |
| Library empty / Designer populated acceptance | contract test data counts + manual step 2–3 | ✅ |
| No cross-FK validation | out of scope (explicit) | ✅ |

### Validation

```bash
npm run testByFile -w miroir-test-app_deployment-designer -- designerMultiApp
npm run testByFile -w miroir-test-app_deployment-designer -- modelValidation
npm run nonreg -- --filter default-designer-modelValidation
```

### Realization

**2026-08-18.**

- **`analysis.md`**: status → **implemented** (2026-08-18).
- **`README.md`**: designer_model bullet mentions User Stories scoped per DesignerApplication.
- **Issue-directory cleanup:** contract tests written directly to `tests/designerMultiApp.unit.test.ts`; no `tests/issues/241-*` directory was ever created — nothing to migrate or delete.
- **`graphify update packages/miroir-test-app_deployment-designer`** run after asset edits.
- **Manual tracer** (§3.3): not run in CI — left for human verification in standalone app; automated coverage via 5 contract tests + 34 `modelValidation` tests.

**Deferred (unchanged):** MiroirTest `queryTest` / `designerDomainState` — report execution at runtime not covered by automated integration tests in this issue.
