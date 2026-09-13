# Issue #274 — TDD Implementation Plan

> Vertical TDD slices (RED → GREEN each), integration-first per `docs/contributing/testing.md`.
> Tests exercise the real DomainController / local cache / emulated server (`RestClientStub`).
> No mocks. Tracer (Slice 1): a `type: "multistep"` Library Report’s Finish path
> `handleCompositeActionTemplate` + **step bag** creates a Country whose `name` comes from
> `getFromParameters`.
>
> **Execution model:** human-in-the-loop. No slice contains a commit step — commits happen
> only when the user explicitly asks. Each slice ends with its Validation commands; on
> success its Realization summary is appended and its Status flips to ✅ DONE.

Analysis: [`./analysis.md`](./analysis.md) · Analysis review: [`./adversarial-review.md`](./adversarial-review.md) · Issue: https://github.com/miroir-framework/miroir/issues/274
Working branch: `274-FEATURE-multistep-reports`

**Resume note:** Plan pending adversarial review.

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
| 1 | **Tracer:** schema + Finish template + step bag creates Country | ⬜ | MiroirTest `multistepFinish.274` + modelValidation |
| 2 | Pager host: one step, Next/Back, bag survives query refresh, Finish last, Cancel confirm | ⬜ | `multistepHost.274.phase2.integ.test.tsx` |
| 3 | Later-step query sees step bag; URL writes off; `runStoredQueries` skipped | ⬜ | `multistepQuery.274.phase3.integ.test.tsx` |
| 4 | Object-instance hoist; query-failure keeps bag | ⬜ | `multistepInstance.274.phase4.integ.test.tsx` |
| 5 | `openReportSection` + list `openReport` + pageParams | ⬜ | `multistepLaunch.274.phase5.integ.test.tsx` |
| 6 | Nonreg, docs, cleanup, AC | ⬜ | `unit-274-multistep-reports` + `appstack-274-multistep-reports` |

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
| Library Report `MultistepCountryCreate` | `d2b2fbbd-6844-4422-8412-4e3c303296bc` |
| Step-1 `inputPrefix` | `stepOne` |
| Step-2 `inputPrefix` | `stepTwo` |
| Tracer Country uuid (created by Finish) | `63c96487-713f-4d5b-a424-bf7e8f70e147` |
| MiroirTest suite `multistepReports.274` | `9931f827-a3ce-435f-bf07-4dac430d81d1` |
| MiroirTest `multistepFinish.274` | `42751630-3516-45e4-85ff-6838576a4a04` |
| Library application | `5af03c98-fe5e-490b-b08f-e1230971c57f` |
| Entity Country | `d3139a6d-0486-4ec8-bded-2a83a3c3cee4` |
| Entity Report | `3f2baa83-3ef7-45ce-82ea-6a43f7a8c916` |
| Nonreg unit | `unit-274-multistep-reports` |
| Nonreg appstack | `appstack-274-multistep-reports` |

---

## Test execution conventions

| Purpose | Command |
|---|---|
| Phase 0 / helper vitest | `RUN_TEST=multistep.274 npm run testByFile -w miroir-standalone-app -- multistep.274` |
| Finish tracer (MiroirTest unit) | `npm run testMiroir -w miroir-core -- --suites multistepReports.274 --mode unit` |
| Finish / host integ | `npm run testMiroir -w miroir-standalone-app -- --suites multistepReports.274 --mode integration` |
| Host RTL integ | `RUN_TEST=multistepHost.274 npm run testByFile -w miroir-standalone-app -- multistepHost.274` |
| Schema rebuild | `npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core` |
| Library modelValidation | `npm run testByFile -w miroir-test-app_deployment-library -- tests/modelValidation.unit.test.ts` |
| Miroir modelValidation | `npm run testByFile -w miroir-test-app_deployment-miroir -- tests/modelValidation.unit.test.ts` |
| Type check | `npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json` and `-p packages/miroir-standalone-app/tsconfig.json` |

Vitest is used for React host / Formik / grid tools (not reachable as MiroirTest). Finish semantics use MiroirTest `actionTest` where the sequence is the interface.

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

### Validation

```bash
RUN_TEST=multistep.274.phase0 npm run testByFile -w miroir-standalone-app -- multistep.274.phase0
```

### Realization

<Appended on completion.>

---

## Slice 1 — Tracer: schema + Finish with step bag creates a Country

**Status:** ⬜ pending

### Goal

A tester / MCP client can run the Library Report `MultistepCountryCreate` Finish sequence with a step bag and get a Country whose `name` and `iso3166-1Alpha-2` come from `stepOne`.

**Layers cut:** Entity + EntityVersion Report schema → generated types → Library Report JSON → `handleCompositeActionTemplate`.

### 1.1 RED

**Test:** MiroirTest `actionTest` `multistepFinish.274` (suite `multistepReports.274`). Vitest exception only if the suite cannot call `handleCompositeActionTemplate` yet: then `multistepFinish.274.phase1.integ.test.ts` through the real DomainController, same assertions.

Behavior asserted:

- `Report.type` accepts `"multistep"`.
- `definition.compositeActionSequence` is a `CompositeActionSequenceTemplate`.
- Given `actionParamValues = { stepOne: { name: "Testland", "iso3166-1Alpha-2": "TL" } }`, Finish creates Country `63c96487-713f-4d5b-a424-bf7e8f70e147` with those fields (`getFromParameters` on `stepOne`).
- Passing a raw Formik-shaped dump (`pageParams`, report definition under the report name, `reportData` keys) is **not** required; the sequence must not read `definition` from the bag.
- AfterEach deletes the created Country.

### 1.2 GREEN

- Dual-write Entity / EntityVersion (analysis D2 paths): enum, `rootReport.compositeActionSequence`, `openReportSection` stub in the union (renderer can still no-op), `objectListReportSection.definition.openReport` optional.
- `reportSectionsFormSchema`: `openReportSection` → `{}` (R2). Update Slice 0 throw assertion in place for this type only.
- Library Report `d2b2fbbd-…`: `type: "multistep"`, two `inputReportSection` children (`stepOne`, `stepTwo`), sequence `createInstance` Country from `stepOne`.
- Rebuild: `npm run build -w miroir-test-app_deployment-miroir && npm run build -w miroir-test-app_deployment-library && npm run devBuild -w miroir-core`.
- Finish helper used by the host later: `runMultistepFinish({ sequence, stepBag, application, applicationDeploymentMap, modelEnvironment })` → `handleCompositeActionTemplate`. Deepen this helper in later slices; do not export it as the product.

### 1.3 Refactor checkpoint

- No second action wrapper beside `handleCompositeActionTemplate`.
- Export new generated types from `miroir-core` `index.ts` if needed.

### Validation

```bash
npm run build -w miroir-test-app_deployment-miroir && npm run build -w miroir-test-app_deployment-library && npm run devBuild -w miroir-core
npm run testByFile -w miroir-test-app_deployment-miroir -- tests/modelValidation.unit.test.ts
npm run testByFile -w miroir-test-app_deployment-library -- tests/modelValidation.unit.test.ts
npm run testMiroir -w miroir-core -- --suites multistepReports.274 --mode unit
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
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

Not MiroirTest because this is React paging. Drive the real host with the Library Report asset (import JSON, not a fixture copy).

Behavior asserted:

- Only step 0 section is in the document; step 1 is not.
- Next on valid `stepOne` shows step 1; Back returns to step 0 with `stepOne` values still in the bag.
- Finish is absent on step 0; present on the last step.
- Next on invalid `stepOne` (empty required field) stays on step 0.
- A `markdownReportSection` step (if the test report adds a third display-only step, or a unit table on a stub section) always allows Next.
- Cancel shows a confirm; confirm unmounts and the bag is gone.
- Simulated `reportData` change / reinit does **not** clear `stepOne`.
- Finish on last step calls `runMultistepFinish` with **only** bag keys (`stepOne`, `stepTwo`), never `pageParams` or the Report definition.

### 2.2 GREEN

- Multistep host wrapper above `ReportViewWithEditor` failure branch.
- `report.type === "multistep"` selects the wrapper from `ReportDisplay` / `ReportViewWithEditor`.
- `generalEditMode`: all steps stacked (existing `InlineReportEditor` path); no pager.
- Buttons: Back, Next or Finish, Cancel; label from `section.label`.

### 2.3 Refactor checkpoint

- Do not fork `ReportSectionViewWithEditor` for paging; pass one `reportSectionPath`.
- Parent Formik `onSubmit` stays authoring.

### Validation

```bash
RUN_TEST=multistepHost.274.phase2 npm run testByFile -w miroir-standalone-app -- multistepHost.274.phase2
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
```

### Realization

<Appended on completion.>

---

## Slice 3 — Later-step query + no URL writes + skip `runStoredQueries`

**Status:** ⬜ pending

### Goal

After Next, a step-2 extractor/combiner that uses `getFromParameters` on `stepOne.name` sees that value. Apply/OK in `ReportInputSection` does not `navigate`. A multistep Report with `runStoredQueries` does not run them.

**Layers cut:** host `pageParams` merge → `useQueryTemplateResults` → extractor templates.

### 3.1 RED

**Test:** `multistepQuery.274.phase3.integ.test.tsx` (+ extend Library Report step 2 to a list or markdown that depends on `stepOne`, or a dedicated query on the same Report).

Behavior asserted:

- Query `pageParams` after Next equals `{ ...launchPageParams, ...stepBag }` with no nested `pageParams` key.
- Step 2 fetched data / displayed text includes the step-1 name.
- Clicking Apply/OK on an `inputReportSection` with `urlParamFields` does not change `window.location.search` and does not call `navigate`.
- `application` field change does not navigate.
- If `runStoredQueries` is set on a test Report, the host logs/warns and `useStoredQueriesResults` is not invoked with step values (or is not invoked at all).

### 3.2 GREEN

- D8 merge in the host.
- Prop/flag into `ReportInputSection` to disable URL + application navigation.
- `ReportDisplay`: skip `runStoredQueries` when `type === "multistep"`.

### 3.3 Refactor checkpoint

- Reuse `reportPageParamsFromSearchParams` only for **launch** `pageParams`, not for step values.

### Validation

```bash
RUN_TEST=multistepQuery.274.phase3 npm run testByFile -w miroir-standalone-app -- multistepQuery.274.phase3
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

Behavior asserted:

- On a multistep Report, there is **no** child Formik around the instance editor (or the child is a pass-through that writes the parent key).
- Editing a field updates the bag key `reportSectionPath.join("_")`.
- Finish `actionParamValues` includes that key.
- On a **non**-multistep Report, child Formik + empty `onSubmit` remain (Slice 0 assertion still holds).
- Inject `reportData.elementType === "failure"` on step 2: host stays mounted, bag still has `stepOne`, Back returns to step 0.

### 4.2 GREEN

- Hoist only when the viewed Report is `type: "multistep"`.
- Failure UI inside the host, not the L428–435 branch that unmounts Formik.

### 4.3 Refactor checkpoint

- One write path for instance values on multistep; do not keep two Formiks in sync.

### Validation

```bash
RUN_TEST=multistepInstance.274.phase4 npm run testByFile -w miroir-standalone-app -- multistepInstance.274.phase4
RUN_TEST=multistep.274.phase0 npm run testByFile -w miroir-standalone-app -- multistep.274.phase0
```

### Realization

<Appended on completion.>

---

## Slice 5 — Launchers

**Status:** ⬜ pending

### Goal

A viewer can open the tracer Report from a page button (modal or route) and from a list-row tools button with that row’s uuid in `pageParams.instanceUuid`.

**Layers cut:** `openReportSection` renderer → `ThemedDialog` / `reportUrl` → host; `EntityInstanceGrid` tools column.

### 5.1 RED

**Test:** `multistepLaunch.274.phase5.integ.test.tsx`

Behavior asserted:

- `openReportSection` button with `openAs: "modal"` opens `ThemedDialog` containing the multistep host; `pageParams` include `application`, `deploymentUuid`, `applicationSection`, `reportUuid` (from section or page context, `storedReportDisplay` precedent).
- `openAs: "route"` calls `reportUrl` / `navigate` with those params; no `step` query key.
- `objectListReportSection.definition.openReport` adds a tools-column control; click sets `instanceUuid` to the row PK and keeps other launch `pageParams`.
- Menu `miroirMenuReportLink` behavior unchanged (characterization or one regression click on AppBar fixture if cheap).
- After successful Finish in the modal, the dialog closes (D15).

### 5.2 GREEN

- Renderer for `openReportSection`.
- `openReport` on list definition → `EntityInstanceGrid` / `ReportSectionListDisplay` tools column.
- Modal host gets the same `applicationDeploymentMap` as the page (analysis D11 environment).

### 5.3 Refactor checkpoint

- Do not reuse `storedReportDisplay` as a button.
- `reportSectionsFormSchema` already `{}` from Slice 1; add list `openReport` to schema if not done.

### Validation

```bash
RUN_TEST=multistepLaunch.274.phase5 npm run testByFile -w miroir-standalone-app -- multistepLaunch.274.phase5
npm run testByFile -w miroir-test-app_deployment-miroir -- tests/modelValidation.unit.test.ts
```

### Realization

<Appended on completion.>

---

## Slice 6 — Nonreg, docs, cleanup, AC

**Status:** ⬜ pending

### 6.1 Nonreg

- Add `unit-274-multistep-reports` (phase0 + MiroirTest unit) and `appstack-274-multistep-reports` (host/query/instance/launch integ, `{profile}` or filesystem if RTL requires it) to `scripts/nonreg-manifest.json`.

### 6.2 Docs

- `analysis.md` status → implemented when slices 1–5 are DONE.
- `docs/reference/api/reports.md`: replace “Form Section — Coming Soon” with `type: "multistep"` + `compositeActionSequence` + `openReportSection`.
- `docs/guides/core-concepts.md` if it still shows a fictional `"type": "form"` section.

### 6.3 Issue-directory cleanup

- Migrate still-valuable assertions from `tests/**/issues/274-multistep-reports/` into feature-named suites; delete the issue directory (`docs/contributing/testing.md`, #238). May remain deferred if other open issues do the same at close.

### 6.4 Tracer bullet (narrative)

1. Open Library `MultistepCountryCreate` from a menu link or `openReportSection`.
2. Fill `stepOne` name + ISO code; Next.
3. Confirm step 2; Finish.
4. Country list shows Testland (`63c96487-…`).
5. Cancel on a half-filled walk: confirm, bag gone, no Country.

Automated equivalent: `multistepFinish.274` + `multistepHost.274` + `multistepLaunch.274`.

### AC checklist (#274)

| Criterion | Proven by | Status |
|---|---|---|
| `type: "multistep"`; list children are steps; existing list Reports unchanged | Slice 0 inventory + Slice 2 host; 11 `type: "list"` still show-all | ⬜ |
| One step at a time; Back / Next / Finish / Cancel; `section.label` | `multistepHost.274` | ⬜ |
| Next Jzod on input / object-instance | `multistepHost.274` + `multistepInstance.274` | ⬜ |
| Finish last step; sequence + step bag; `getFromParameters` | `multistepFinish.274` | ⬜ |
| Next merges bag into in-memory query `pageParams` | `multistepQuery.274` | ⬜ |
| Cancel confirm; no undo of D9 writes | `multistepHost.274` | ⬜ |
| Memory only; no `step` URL | `multistepLaunch.274` | ⬜ |
| Success closes modal / leaves route | `multistepLaunch.274` | ⬜ |
| Menu report link still routes | Slice 5 regression | ⬜ |
| `openReportSection` + list `openReport` + row `instanceUuid` | `multistepLaunch.274` | ⬜ |
| Object-instance edits visible to Finish | `multistepInstance.274` | ⬜ |
| Runner / list Add unchanged | Slice 0 + no product change in those files except list `openReport` | ⬜ |

### Validation

```bash
npm run testMiroir -w miroir-core -- --suites multistepReports.274 --mode unit
RUN_TEST=multistep npm run testByFile -w miroir-standalone-app -- 274
```

### Realization

<Appended on completion.>
