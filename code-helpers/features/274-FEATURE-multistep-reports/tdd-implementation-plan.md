# Issue #274 — TDD Implementation Plan

> Vertical TDD slices (RED → GREEN each), integration-first per `docs/contributing/testing.md`.
> Tests exercise the real DomainController / local cache / emulated server (`RestClientStub`).
> No domain mocks. `react-router-dom` harness mocks (`useNavigate: vi.fn()`) are allowed
> for navigation assertions, matching `ReportPage.integ.test.tsx`.
> Tracer (Slice 1): a `type: "multistep"` Library Report’s Finish path
> `handleCompositeActionTemplate` + **step bag** creates a Country whose `name` comes from
> `getFromParameters`.
>
> **Execution model:** human-in-the-loop. No slice contains a commit step — commits happen
> only when the user explicitly asks. Each slice ends with its Validation commands; on
> success its Realization summary is appended and its Status flips to ✅ DONE.

Analysis: [`./analysis.md`](./analysis.md) · Analysis review: [`./adversarial-review.md`](./adversarial-review.md) · Plan review: [`./plan-adversarial-review.md`](./plan-adversarial-review.md) · Issue: https://github.com/miroir-framework/miroir/issues/274
Working branch: `274-FEATURE-multistep-reports`

**Resume note:** Plan revised after adversarial review (P1–P16 applied). Slices pending. Confirm slice order with the user before writing code.

---

## Plan-review repairs (binding)

From [`./plan-adversarial-review.md`](./plan-adversarial-review.md). Product decisions D1–D17 are unchanged.

| ID | Repair |
|---|---|
| P1 | Tracer is `actionTest` → **miroir-standalone-app integration only** (`--mode integ` / `integration` + `--profile emulatedServer-filesystem`). No `testMiroir -w miroir-core --mode unit` for this suite. |
| P2 | Leaf sequence = one nested `compositeActionSequence` step that **is** the Report Finish template (`handleCompositeAction` only resolves templates on that nested hop). Bag = suite `testParams` (`{ stepOne: { name, "iso3166-1Alpha-2" } }`). Leaf `testParams` are dropped for `actionTest` — do not use them. |
| P3 | Slice 1 GREEN updates phase0 **in place** for the three flipped contracts (enum, `RootReport.compositeActionSequence`, inventory 84→85) plus `openReportSection → {}`. Slice 1 Validation re-runs phase0. Slices 4/5 that add a Report bump the inventory in place the same way. |
| P4 | Every new Library Report is imported and appended on `defaultLibraryAppModel.reports` in `Library.ts`. Emulated-filesystem playfield seeds from that model (into `tests/tmp/library_*`); there is no separate `tests/assets` library copy. |
| P5 | Slice 1 RED does **not** claim `jzodTypeCheck` rejects `type: "multistep"` (enum case always `ok`). Schema RED is `modelValidation` on unknown `compositeActionSequence`. Finish RED is the MiroirTest only. Generated-type assertions live in consumed phase0. |
| P6 | Every standalone-app integ `testByFile` / `testMiroir` carries `--profile emulatedServer-filesystem`. Manifest rows use `{profile}`. |
| P7 | Host Finish assertion is **observable state** (Country `63c96487-…` in the cache with bag values). No spy on `runMultistepFinish`. Helper lives in `MultistepReportHost.tsx` (local; not a product export). |
| P8 | Tracer Report shape is **frozen in Slice 1** (three steps + inline echo query). Slices 2–3 do not edit it. Slice 4/5 add their own Reports. |
| P9 | Slice 5 threads `objectListReportSection.definition.openReport` from `ReportSectionListDisplay` into `EntityInstanceGrid` as `rowOpenReport`. RED mounts the **AG Grid** path (`viewParams.gridType` default `"ag-grid"`). GREEN extends AG Grid `ToolsCellRenderer` **and** Glide `onRowOpenReport`. Row PK → `instanceUuid` via `getInstancePrimaryKeyValue` (uuid-PK Country; composite PK out of scope). |
| P10 | Three nonreg steps: `unit-274-multistep-reports` (phase0), `integ-action-274-multistep-reports` (`testMiroir` integ), `appstack-274-multistep-reports` (RTL files, `{profile}`). |
| P11 | Header allows router harness mocks only. |
| P12 | Cleanup = leaf `afterTestCleanupAction` (`deleteInstance` of `63c96487-…`). |
| P13 | Stored-query RED uses a **clone** of the tracer plus a real Library stored query; assert result rows never appear. |
| P14 | Slice 4 failure = step-2 extractor whose `parentUuid` is `getFromParameters` on `absentParam`. |
| P15 | Slice 1 Validation typechecks miroir-core **and** miroir-standalone-app. |
| P16 | Menu AC remaps to `applicationModelScopeMenu.unit.test.ts` plus a Slice 5 `reportUrl` assertion (no `step` key). |

---

## Scope

- `Report.type` += `"multistep"`; `RootReport.compositeActionSequence` as `CompositeActionSequenceTemplate`.
- Viewer pager: one `ReportSection` at a time; Back / Next / Finish / Cancel.
- Step bag in host state (`inputPrefix` + hoisted object-instance keys only).
- Finish = `handleCompositeActionTemplate` with `actionParamValues` = step bag.
- Launch: `openReportSection`; per-row `objectListReportSection.definition.openReport`; existing `miroirMenuReportLink` route.
- Library tracer Report + Country `createInstance` from the bag.

This plan does **not** add a Form / FormRun Entity, persist drafts, wrap the walk in one undo transaction, branch steps, put `step=N` in the URL, or change list-Add / Runner submit outside a multistep Report. MLS field messages stay #169. The two postgres Reports with `"type": null` are not rewritten.

---

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Characterize Report.type, Formik dump, schema switch, nested Formik | ⬜ | `multistep.274.phase0.unit.test.ts` |
| 1 | **Tracer:** schema + Finish template + step bag creates Country | ⬜ | MiroirTest `multistepFinish.274` (integ) + modelValidation |
| 2 | Pager host: one step, Next/Back, bag survives query refresh, Finish last, Cancel confirm | ⬜ | `multistepHost.274.phase2.integ.test.tsx` |
| 3 | Later-step query sees step bag; URL writes off; `runStoredQueries` skipped | ⬜ | `multistepQuery.274.phase3.integ.test.tsx` |
| 4 | Object-instance hoist; query-failure keeps the bag | ⬜ | `multistepInstance.274.phase4.integ.test.tsx` |
| 5 | `openReportSection` + list `openReport` + pageParams | ⬜ | `multistepLaunch.274.phase5.integ.test.tsx` |
| 6 | Nonreg, docs, cleanup, AC | ⬜ | `unit-274-` + `integ-action-274-` + `appstack-274-multistep-reports` |

---

## Locked implementation defaults

Copied from [`analysis.md`](./analysis.md) D1–D17 after review repairs. Deviations go in Realization.

| Decision | Choice |
|---|---|
| D1 | Finish = `handleCompositeActionTemplate` only; `actionParamValues` = step bag |
| D2 | `Report.type: "multistep"`; list children are steps |
| D3 | A step is any `ReportSection` |
| D4 | `RootReport.compositeActionSequence`: `CompositeActionSequenceTemplate` |
| D5 | Step bag = `inputPrefix` keys + hoisted object-instance path keys. Not raw `formik.values` |
| D6 | Launcher chooses modal vs route |
| D7 | Next Jzod on current input / object-instance step |
| D8 | Query `pageParams` = `{ ...launchPageParams, ...stepBag }`. No URL write |
| D9 | List Add / Runner submit unchanged |
| D10 | Back keeps bag; rerun query |
| D11 | Cancel confirms; drop bag; no undo of D9 |
| D12 | Finish on last step only |
| D13 | Memory only |
| D14 | `openReportSection` + list `openReport` |
| D15 | Close modal / leave route on success |
| D16 | No `step` search param |
| D17 | Row PK → `instanceUuid` + caller launch `pageParams` |
| Review | Bag lives above `ReportViewWithEditor` failure unmount; `runStoredQueries` unsupported; disable `ReportInputSection` URL navigate in multistep; `reportSectionsFormSchema` `openReportSection` → `{}` |

---

## Allocated UUIDs / keys

| Artefact | Value |
|---|---|
| Library Report `MultistepCountryCreate` (tracer, frozen in Slice 1) | `d2b2fbbd-6844-4422-8412-4e3c303296bc` |
| Library Report `MultistepCountryInstance` (Slice 4) | `8f3c1a6e-2d47-4b91-9e05-c7a84b0d2e61` |
| Library Report `MultistepLaunchPad` (Slice 5) | `b6d9e2a1-4c58-4f70-8a13-9e2f0c5d7b44` |
| Step-1 `inputPrefix` | `stepOne` |
| Step-2 `inputPrefix` | `stepTwo` |
| Tracer Country uuid (created by Finish) | `63c96487-713f-4d5b-a424-bf7e8f70e147` |
| MiroirTest suite `multistepReports.274` | `9931f827-a3ce-435f-bf07-4dac430d81d1` |
| MiroirTest `multistepFinish.274` | `42751630-3516-45e4-85ff-6838576a4a04` |
| Library application | `5af03c98-fe5e-490b-b08f-e1230971c57f` |
| Entity Country | `d3139a6d-0486-4ec8-bded-2a83a3c3cee4` |
| Entity Report | `3f2baa83-3ef7-45ce-82ea-6a43f7a8c916` |
| Entity MiroirTest | `a311f363-e238-4203-bdfc-29e8c160c26b` |
| Existing Library stored query BookCountByPublisher (Slice 3 clone only) | `6176dcdf-39a6-4805-8dc5-3c2366a31a11` |
| Nonreg unit | `unit-274-multistep-reports` |
| Nonreg integ-action | `integ-action-274-multistep-reports` |
| Nonreg appstack | `appstack-274-multistep-reports` |

---

## Test execution conventions

| Purpose | Command |
|---|---|
| Phase 0 / helper vitest | `RUN_TEST=multistep.274 npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem multistep.274` |
| Finish tracer (MiroirTest integ) | `npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-filesystem --suites multistepReports.274 --mode integ` |
| Host RTL integ | `RUN_TEST=multistepHost.274 npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem multistepHost.274` |
| Schema rebuild | `npm run build -w miroir-test-app_deployment-miroir && npm run build -w miroir-test-app_deployment-library && npm run devBuild -w miroir-core` |
| Library modelValidation | `npm run testByFile -w miroir-test-app_deployment-library -- tests/modelValidation.unit.test.ts` |
| Miroir modelValidation | `npm run testByFile -w miroir-test-app_deployment-miroir -- tests/modelValidation.unit.test.ts` |
| Type check | `npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json` and `-p packages/miroir-standalone-app/tsconfig.json` |

Vitest is used for React host / Formik / grid tools (not reachable as MiroirTest). Finish semantics use MiroirTest `actionTest` (integration) because the sequence is the interface.

`actionTest` leaves throw in unit mode (`MiroirTestTools.ts` L161–165). Do not run this suite from `miroir-core`.

---

## Frozen tracer Report (`d2b2fbbd-…`)

Slice 1 GREEN writes this shape once. Slices 2–3 **must not** edit the JSON, rebuild the library package for this file, or re-register it. Slice 1’s MiroirTest asserts **only** Finish → Country; it does not assert section count or step-2 text.

`type: "multistep"`. `definition.section` is `list` with three children:

| Index | Section | Role |
|---|---|---|
| 0 | `inputReportSection` `inputPrefix: stepOne` (`name` required, `iso3166-1Alpha-2` optional) | Slice 2 Next/Back/validation |
| 1 | `markdownReportSection` (static confirm copy) | Slice 2 “display-only always allows Next” (not last, so Next is visible) |
| 2 | `jsonReportSection` `fetchedDataReference: stepOneEcho` | Slice 3: after Next, document shows the echoed `stepOne.name` |

Inline query (no new Query entity): `runtimeTransformers` or extractor/combiner template `stepOneEcho` = `getFromParameters` with `referencePath: ["stepOne", "name"]`.

`definition.compositeActionSequence`: `CompositeActionSequenceTemplate` that `createInstance` Country `63c96487-…` with `name` / `iso3166-1Alpha-2` from `getFromParameters` on `stepOne`. Sequence must not read `pageParams`, `reportData`, or the Report definition.

---

## Slice 0 — Characterize current contracts

**Status:** ⬜ pending

### Goal

Lock today’s Report.type enum, seed inventory, Formik dump keys, nested instance Formik, and `reportSectionsFormSchema` throw so later slices have a safety net.

**Layers cut:** tests only (no product change).

### 0.1 RED → GREEN — characterization

**Test:** `packages/miroir-standalone-app/tests/4_view/issues/274-multistep-reports/multistep.274.phase0.unit.test.ts`

Behavior asserted (current, must stay true until a later slice **updates this file in place**):

- Generated `Report.type` is optional `"list" \| "grid"` only (`miroirFundamentalType.ts`).
- Seed inventory: 84 Reports, 11 `"list"`, 0 `"grid"`, 71 omit `type`, 2 `"type": null` (postgres `TableDetails` / `SchemaDetails`).
- `RootReport` has no `compositeActionSequence`.
- `reportSectionsFormSchema` throws on `inputReportSection` and on a fake `"openReportSection"`.
- `reportSectionsFormValue` `default` returns `{}` for `runnerReportSection`.
- `initialReportSectionsFormValue` shape includes `pageParams` and `[reportName]` (quote `ReportViewWithEditor.tsx` L261–269).
- `ReportSectionEntityInstance` still mounts a child Formik with `onSubmit={() => {}}` on a **non**-multistep path.

The flipping slice that changes a line above **edits this file in that slice’s GREEN** and re-runs phase0 in that slice’s Validation. Later slices must not re-run phase0 until they have consumed the flips they themselves make.

### Validation

```bash
RUN_TEST=multistep.274.phase0 npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem multistep.274.phase0
```

### Realization

<Appended on completion.>

---

## Slice 1 — Tracer: schema + Finish with step bag creates a Country

**Status:** ⬜ pending

### Goal

A tester / MCP client can run the Library Report `MultistepCountryCreate` Finish sequence with a step bag and get a Country whose `name` and `iso3166-1Alpha-2` come from `stepOne`.

**Layers cut:** Entity + EntityVersion Report schema → generated types → Library Report JSON + `Library.ts` → `handleCompositeActionTemplate`.

### Vehicle (P1, P2)

MiroirTest `actionTest` `multistepFinish.274` in `library_model/a311f363-…/42751630-….json`, suite `9931f827-…`.

**Why a nested wrapper:** `resolveActionTestLeaf` emits `testCompositeAction` → `handleTestCompositeAction` → `handleCompositeAction`. Top-level steps are **not** template-resolved (`createInstance` goes to `handleInstanceAction` with no parameter bank). `handleCompositeAction` reaches `handleCompositeActionTemplate` only on a nested `actionType: "compositeActionSequence"` step (`DomainController.ts` L3670–3683).

**Leaf shape:**

- `compositeActionSequence.payload.actionSequence` has **one** step: a copy of `d2b2fbbd-….definition.compositeActionSequence` (the Finish template).
- Suite `definition.testParams` = `{ stepOne: { name: "Testland", "iso3166-1Alpha-2": "TL" } }`. `RunnerTestSession` puts this in `compositeActionTestContext` / `runnerTestContext.testParams` via `buildRunnerTestSessionParamBank`; `runMiroirActionTest` passes that bank as `actionParamValues`.
- Do **not** put the bag on the leaf’s `testParams` (`mergeRunnerTestParamBank` is runnerTest-only).
- Assertions: `testCompositeActionAssertions` / `compositeRunTestAssertion` that the Country exists with those fields.
- Cleanup: leaf `afterTestCleanupAction` = `deleteInstance` of `63c96487-…`. It runs after the test sequence **returns** (including assertion `Action2Error`). It is not in a `try/finally`; keep assertions as `compositeRunTestAssertion` so a failed assert still returns. Row lands in Library data (`tests/tmp/library_data` on emulated-filesystem).

Do not use `testBuildPlusRuntimeCompositeAction` / `handleRuntimeCompositeActionDO_NOT_USE`.

### 1.1 RED

**Tests:**

- `packages/miroir-test-app_deployment-library/tests/modelValidation.unit.test.ts` (existing file; add the tracer JSON before schema GREEN and expect it to fail).
- MiroirTest `multistepFinish.274` (suite `multistepReports.274`).

Behavior asserted:

- **modelValidation (schema):** a Report carrying `definition.compositeActionSequence` fails today — `jzodTypeCheck` strict object, `"value attribute 'compositeActionSequence' not found in schema definition"` (`jzodTypeCheck.ts` L1090–1102). This is the schema RED. Do **not** treat `type: "multistep"` as a modelValidation RED: the enum case always returns `ok` (`jzodTypeCheck.ts` L1766–1777).
- **phase0 (consumed in GREEN, not a RED of this slice):** generated `Report.type` and `RootReport` shape — updated in place when types regenerate.
- **MiroirTest (Finish):** given suite `testParams.stepOne = { name: "Testland", "iso3166-1Alpha-2": "TL" }`, the nested Finish template creates Country `63c96487-713f-4d5b-a424-bf7e8f70e147` with those fields. A Formik-shaped dump is not required; the sequence must not read `definition` / `pageParams` / `reportData` from the bag.

### 1.2 GREEN

- Dual-write Entity / EntityVersion (analysis D2 paths): enum += `"multistep"`, `rootReport.compositeActionSequence` optional `CompositeActionSequenceTemplate`, `openReportSection` stub in the union (renderer can still no-op), `objectListReportSection.definition.openReport` optional.
- `reportSectionsFormSchema`: `openReportSection` → `{}` (R2).
- Library Report `d2b2fbbd-…` in the **frozen tracer shape** above. Import + append in `Library.ts` `defaultLibraryAppModel.reports`.
- MiroirTest suite + leaf JSON under `library_model/a311f363-…/` (folder scan discovers them; `defaultLibraryAppModel.tests` stays empty).
- Rebuild: `npm run build -w miroir-test-app_deployment-miroir && npm run build -w miroir-test-app_deployment-library && npm run devBuild -w miroir-core`.
- Consume Slice 0 **in place**: enum `"list" \| "grid" \| "multistep"`; `RootReport.compositeActionSequence` present and optional; inventory **85** with `d2b2fbbd-…` named; `openReportSection` no longer throws (`{}`).
- Host helper (used from Slice 2): `runMultistepFinish({ sequence, stepBag, application, applicationDeploymentMap, modelEnvironment })` in `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/MultistepReportHost.tsx` → `handleCompositeActionTemplate`. Not a product export. Deepen later; do not spy on it.

### 1.3 Refactor checkpoint

- No second action wrapper beside `handleCompositeActionTemplate`.
- Export new generated types from `miroir-core` `index.ts` if needed.

### Validation

```bash
npm run build -w miroir-test-app_deployment-miroir && npm run build -w miroir-test-app_deployment-library && npm run devBuild -w miroir-core
npm run testByFile -w miroir-test-app_deployment-miroir -- tests/modelValidation.unit.test.ts
npm run testByFile -w miroir-test-app_deployment-library -- tests/modelValidation.unit.test.ts
RUN_TEST=multistep.274.phase0 npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem multistep.274.phase0
npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-filesystem --suites multistepReports.274 --mode integ
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
```

### Realization

<Appended on completion.>

---

## Slice 2 — Pager host

**Status:** ⬜ pending

### Goal

A report viewer opening `MultistepCountryCreate` sees one step, can Next/Back, cannot Finish until the last step, and Cancel asks before dropping the bag.

**Layers cut:** host component → `ReportSectionViewWithEditor` one path → Formik/step bag.

### 2.1 RED

**Test:** `packages/miroir-standalone-app/tests/4_view/issues/274-multistep-reports/multistepHost.274.phase2.integ.test.tsx`

Not MiroirTest because this is React paging. Drive the real host with the Library Report asset (`import` the JSON as the assertion-side reference; the session cache must already contain it via Slice 1 `Library.ts` registration).

Behavior asserted:

- Only step 0 section is in the document; steps 1 and 2 are not.
- Next on valid `stepOne` shows step 1 (markdown); Back returns to step 0 with `stepOne` values still in the bag.
- Next on the markdown step shows step 2 (always allowed; no Jzod on markdown).
- Finish is absent on steps 0 and 1; present on step 2 (last).
- Next on invalid `stepOne` (empty required `name`) stays on step 0.
- Cancel shows a confirm; confirm unmounts and the bag is gone.
- Simulated `reportData` change / reinit does **not** clear `stepOne`.
- Finish on the last step creates Country `63c96487-…` in the local cache with `name` / `iso3166-1Alpha-2` from `stepOne` (same bag as Slice 1). The sequence requires `stepOne.name`, so a polluted bag (raw Formik dump) fails loudly. Delete the Country in `afterEach`.

### 2.2 GREEN

- Multistep host wrapper in `MultistepReportHost.tsx`, mounted **above** `ReportViewWithEditor`’s L428–435 failure branch.
- `report.type === "multistep"` selects the wrapper from `ReportDisplay` / `ReportViewWithEditor`.
- `generalEditMode`: all steps stacked (existing `InlineReportEditor` path); no pager.
- Buttons: Back, Next or Finish, Cancel; label from `section.label`.
- `enableReinitialize` must not wipe bag keys.

### 2.3 Refactor checkpoint

- Do not fork `ReportSectionViewWithEditor` for paging; pass one `reportSectionPath`.
- Parent Formik `onSubmit` stays authoring.

### Validation

```bash
RUN_TEST=multistepHost.274.phase2 npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem multistepHost.274.phase2
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
```

### Realization

<Appended on completion.>

---

## Slice 3 — Later-step query + no URL writes + skip `runStoredQueries`

**Status:** ⬜ pending

### Goal

After Next, step 2’s `stepOneEcho` query shows `stepOne.name`. Apply/OK in `ReportInputSection` does not `navigate`. A multistep Report with `runStoredQueries` does not run them.

**Layers cut:** host `pageParams` merge → `useQueryTemplateResults` → extractor templates.

### 3.1 RED

**Test:** `multistepQuery.274.phase3.integ.test.tsx`

Uses the **frozen** tracer (no asset edit). For stored queries, mount an **in-test clone** of `d2b2fbbd-…` that adds `runStoredQueries: [{ storedQuery: "6176dcdf-39a6-4805-8dc5-3c2366a31a11", label: "BookCountByPublisher" }]` (existing Library query used by PublisherList). Do not add a new StoredQuery entity and do not write `runStoredQueries` onto the seed tracer.

Behavior asserted:

- Query `pageParams` after Next equals `{ ...launchPageParams, ...stepBag }` with no nested `pageParams` key.
- Step 2 `jsonReportSection` text includes the step-1 name (`Testland`).
- Clicking Apply/OK on an `inputReportSection` with `urlParamFields` does not change `window.location.search` and does not call `navigate` (router harness mock).
- `application` field change does not navigate.
- On the clone with `runStoredQueries`, publisher book-count result rows / `00_BookCountByPublisher` never appear. Do not key the assertion off the `runStoredQueries` JSON text if debug dumps the report definition.

### 3.2 GREEN

- D8 merge in the host.
- Prop/flag into `ReportInputSection` to disable URL + application navigation.
- `ReportDisplay`: when `type === "multistep"`, do not call `useStoredQueriesResults` (pass `undefined` / skip the hook).

### 3.3 Refactor checkpoint

- Reuse `reportPageParamsFromSearchParams` only for **launch** `pageParams`, not for step values.

### Validation

```bash
RUN_TEST=multistepQuery.274.phase3 npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem multistepQuery.274.phase3
```

### Realization

<Appended on completion.>

---

## Slice 4 — Object-instance hoist + query-failure keeps the bag

**Status:** ⬜ pending

### Goal

An `objectInstanceReportSection` step writes into the step bag. A failed step query does not destroy the bag; Back still works.

**Layers cut:** `ReportSectionEntityInstance` → parent Formik → host state → failure render.

### 4.1 RED

**Test:** `multistepInstance.274.phase4.integ.test.tsx`

Drive `MultistepCountryInstance` (`8f3c1a6e-…`), **not** the tracer:

- Step 0: `inputReportSection` `stepOne`.
- Step 1: `objectInstanceReportSection` (Country-shaped editor; bag key = `reportSectionPath.join("_")`).
- Step 2: `jsonReportSection` whose report query is an `extractorInstancesByEntity` whose `parentUuid` is `getFromParameters` on `absentParam` (never in the bag). After Next, the query fails (`reportData.elementType === "failure"`, `ReportViewWithEditor.tsx` L428–435). A `getFromParameters` on `stepOne.name` would succeed and must not be used as the failure trigger.

Behavior asserted:

- On this multistep Report, there is **no** child Formik around the instance editor (or the child is a pass-through that writes the parent key).
- Editing a field updates the bag key `reportSectionPath.join("_")`.
- Finish `actionParamValues` include that key (Country created / sequence sees it — observable cache, not a spy).
- On a **non**-multistep Report, child Formik + empty `onSubmit` remain (Slice 0 assertion still holds).
- After Next into the failing step-2 query: host stays mounted, bag still has `stepOne`, Back returns to step 0.

### 4.2 GREEN

- Add Report JSON `8f3c1a6e-…`; import + register in `Library.ts`; `npm run build -w miroir-test-app_deployment-library`; library `modelValidation`.
- Consume phase0 inventory **85 → 86** in place (name `8f3c1a6e-…`).
- Hoist only when the viewed Report is `type: "multistep"`.
- Failure UI inside the host, not the L428–435 branch that unmounts Formik.

### 4.3 Refactor checkpoint

- One write path for instance values on multistep; do not keep two Formiks in sync.

### Validation

```bash
npm run build -w miroir-test-app_deployment-library
npm run testByFile -w miroir-test-app_deployment-library -- tests/modelValidation.unit.test.ts
RUN_TEST=multistepInstance.274.phase4 npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem multistepInstance.274.phase4
RUN_TEST=multistep.274.phase0 npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem multistep.274.phase0
```

### Realization

<Appended on completion.>

---

## Slice 5 — Launchers

**Status:** ⬜ pending

### Goal

A viewer can open the tracer Report from a page button (modal or route) and from a list-row tools button with that row’s uuid in `pageParams.instanceUuid`.

**Layers cut:** `openReportSection` renderer → `ThemedDialog` / `reportUrl` → host; `ReportSectionListDisplay` → `EntityInstanceGrid` tools column (AG Grid + Glide).

### 5.1 RED

**Test:** `multistepLaunch.274.phase5.integ.test.tsx`

Drive `MultistepLaunchPad` (`b6d9e2a1-…`):

- One `openReportSection` (`label`, `reportUuid: d2b2fbbd-…`, `openAs: "modal"` | `"route"`; application / section / deployment from page context, `storedReportDisplay` precedent).
- One `objectListReportSection` of Country with `definition.openReport` pointing at the tracer (`openAs: "modal"`).

Force `viewParams.gridType` to `"ag-grid"` (default in `EntityInstanceGrid.tsx` L134). Do not rely on Glide for the RED click.

Behavior asserted:

- `openAs: "modal"` opens `ThemedDialog` containing the multistep host; `pageParams` include `application`, `deploymentUuid`, `applicationSection`, `reportUuid`.
- `openAs: "route"` calls `navigate` with `reportUrl(...)` for those params (router harness mock); URL has no `step` query key.
- `openReport` adds a tools-column control; click sets `instanceUuid` to the row PK (`getInstancePrimaryKeyValue` on uuid-PK Country = `instance.uuid`) and keeps other launch `pageParams`.
- `reportUrl(app, dep, section, reportUuid, instanceUuid)` still has no `step` key (D16). Menu `miroirMenuReportLink` routing stays `SidebarSection` → `reportUrl` — proven by existing `applicationModelScopeMenu.unit.test.ts` (item type + `reportUuid`); this slice does not add an AppBar click.
- After successful Finish in the modal, the dialog closes (D15). Delete Country `63c96487-…` in `afterEach` if Finish ran.

### 5.2 GREEN

- Add Report JSON `b6d9e2a1-…`; import + register in `Library.ts`; rebuild library; `modelValidation`.
- Consume phase0 inventory **86 → 87** in place (name `b6d9e2a1-…`).
- Renderer for `openReportSection`.
- First: thread `objectListReportSection.definition.openReport` from `ReportSectionListDisplay` into `EntityInstanceGrid` as optional `rowOpenReport` (it does **not** reach the grid today; `TableComponentProps` has no section definition).
- Then: AG Grid `ToolsCellRenderer` / `TableActionButtons` grow an optional Open control; Glide path gets `onRowOpenReport` so both renderers stay in sync. Composite-PK serialization is out of scope.
- Modal host gets the same `applicationDeploymentMap` as the page (analysis D11 environment). Do not copy `RunnerView`’s Miroir fallback.

### 5.3 Refactor checkpoint

- Do not reuse `storedReportDisplay` as a button.
- `reportSectionsFormSchema` already `{}` from Slice 1; add list `openReport` to schema if not done.

### Validation

```bash
npm run build -w miroir-test-app_deployment-library
npm run testByFile -w miroir-test-app_deployment-library -- tests/modelValidation.unit.test.ts
RUN_TEST=multistepLaunch.274.phase5 npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem multistepLaunch.274.phase5
RUN_TEST=multistep.274.phase0 npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem multistep.274.phase0
npm run testByFile -w miroir-test-app_deployment-miroir -- tests/modelValidation.unit.test.ts
```

### Realization

<Appended on completion.>

---

## Slice 6 — Nonreg, docs, cleanup, AC

**Status:** ⬜ pending

### 6.1 Nonreg

Add three steps to `scripts/nonreg-manifest.json`:

| id | tier | argv |
|---|---|---|
| `unit-274-multistep-reports` | unit | `npm run testByFile -w miroir-standalone-app -- multistep.274.phase0` |
| `integ-action-274-multistep-reports` | default | `npm run testMiroir -w miroir-standalone-app -- --profile {profile} --suites multistepReports.274 --mode integ` |
| `appstack-274-multistep-reports` | default | `npm run testByFile -w miroir-standalone-app -- --profile {profile}` plus the four RTL files (`multistepHost.274`, `multistepQuery.274`, `multistepInstance.274`, `multistepLaunch.274`), or a `bash -c` composite per `externalServices-spotify` |

`requires`: `none`. Do not put the MiroirTest suite in the unit tier.

### 6.2 Docs

- `analysis.md` status → implemented when slices 1–5 are DONE.
- `docs/reference/api/reports.md`: replace “Form Section — Coming Soon” with `type: "multistep"` + `compositeActionSequence` + `openReportSection`.
- `docs/guides/core-concepts.md` if it still shows a fictional `"type": "form"` section.

### 6.3 Issue-directory cleanup

- Migrate still-valuable assertions from `tests/**/issues/274-multistep-reports/` into feature-named suites; delete the issue directory (`docs/contributing/testing.md`, #238). May remain deferred if other open issues do the same at close.

### 6.4 Tracer bullet (narrative)

1. Open Library `MultistepCountryCreate` from a menu link or `openReportSection`.
2. Fill `stepOne` name + ISO code; Next (markdown); Next (echo).
3. Finish on the last step.
4. Country list shows Testland (`63c96487-…`).
5. Cancel on a half-filled walk: confirm, bag gone, no Country.

Automated equivalent: `multistepFinish.274` + `multistepHost.274` + `multistepLaunch.274`.

### AC checklist (#274)

| Criterion | Proven by | Status |
|---|---|---|
| `type: "multistep"`; list children are steps; existing list Reports unchanged | Slice 0 inventory (consumed) + Slice 2 host; 11 `type: "list"` still show-all | ⬜ |
| One step at a time; Back / Next / Finish / Cancel; `section.label` | `multistepHost.274` | ⬜ |
| Next Jzod on input / object-instance | `multistepHost.274` + `multistepInstance.274` | ⬜ |
| Finish last step; sequence + step bag; `getFromParameters` | `multistepFinish.274` | ⬜ |
| Next merges bag into in-memory query `pageParams` | `multistepQuery.274` | ⬜ |
| Cancel confirm; no undo of D9 writes | `multistepHost.274` | ⬜ |
| Memory only; no `step` URL | `multistepLaunch.274` (`reportUrl` has no `step`) | ⬜ |
| Success closes modal / leaves route | `multistepLaunch.274` | ⬜ |
| Menu report link still routes | `applicationModelScopeMenu.unit.test.ts` (existing) | ⬜ |
| `openReportSection` + list `openReport` + row `instanceUuid` | `multistepLaunch.274` | ⬜ |
| Object-instance edits visible to Finish | `multistepInstance.274` | ⬜ |
| Runner / list Add unchanged | Slice 0 + no product change in those files except list `openReport` | ⬜ |

### Validation

```bash
RUN_TEST=multistep.274.phase0 npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem multistep.274.phase0
npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-filesystem --suites multistepReports.274 --mode integ
RUN_TEST=multistep npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem 274
```

### Realization

<Appended on completion.>
