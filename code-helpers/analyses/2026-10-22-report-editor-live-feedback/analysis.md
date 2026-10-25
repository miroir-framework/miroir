# Report editor ↔ rendered report: lost live feedback

**Question.** In the June 2026 sandbox build, editing a Report in the inline Report editor (general edit mode) changed the rendered report at once. Now the rendered report changes only after the edit is saved. What changed, what else depends on that change, and does undoing it cost performance?

**Status:** analysis only, no fix. Analysed at `958657e97` (branch `validation`). Reference state: `11d616014` (2026-06-07, last #116 sandbox commit; the sandbox build aliases `miroir-standalone-app/src`, see [`vite.config.js`](../../../packages/miroir-sandbox/vite.config.js)).

**Evidence level:** code reading and git history, with every claim pinned to a file position or a commit. The regression was **not reproduced in a running app**, and **nothing was measured**. Section 6 lists what to measure before a fix.

Companion page (diagrams): [`report-editor-live-feedback.html`](report-editor-live-feedback.html), source [`candidate.archify.md`](candidate.archify.md).

---

## Glossary

Component paths are under `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/` unless stated.

| Term | Meaning |
|---|---|
| **RVWE** | `ReportViewWithEditor`: builds the report query, the Formik initial values, and the **report Formik**; mounts the inline Report editor and the section tree. |
| **RSVWE** | `ReportSectionViewWithEditor`: renders one section, reading its definition from the report Formik; recurses into `grid`, `list` and `accordion` sections. |
| **RSEI** | `ReportSectionEntityInstance`: the leaf for an `objectInstanceReportSection`, showing one entity instance in an editor. Since #82 it mounts the **nested Formik**. |
| **TVOE** | `TypedValueObjectEditor`: schema-driven editor for one value of the **nearest** Formik. It runs `mlsTypeCheck` and owns the submit button. |
| **TVOE+Formik** | `TypedValueObjectEditorWithFormik`: TVOE wrapped in its own Formik, used outside reports (transformer editor, app selector, list transformer panel). |
| **Ml\*Editor** | Field editors under `ValueObjectEditor/` (`MlElementEditor`, `MlObjectEditor`, `MlArrayEditor`, …) rendered by TVOE. Ordinary fields call `setFieldValue` on each keystroke. |
| **Formik** | The React form library. One `<Formik>` is one form state (`values`, `setFieldValue`, `submitForm`); children read the nearest one with `useFormikContext()`. |
| **Report Formik** | The single `<Formik>` created by RVWE. Its values hold section data, query results, `pageParams`, `reportReportDetails` and the displayed Report under its name. |
| **Nested Formik** | The `<Formik>` that RSEI mounts around its TVOE for non-multistep Reports (#82). It holds one key, a copy of the instance. |
| **`[reportName]` key** | The report Formik key holding the displayed Report. RSVWE reads sections from it; the inline Report editor edits it. |
| **`reportReportDetails`** | The Miroir meta-report that describes how to edit a Report. The inline editor renders its first section to edit the displayed Report. |
| **Inline Report editor** | `InlineReportEditor`, shown above the sections when `generalEditMode` is on. |
| **`generalEditMode`** | The global edit-mode switch, `context.viewParams.generalEditMode`. |
| **Virtual attribute** | An Entity attribute computed by a transformer instead of stored (#82). Only Library `Book.citation` exists today. |
| **`displayedInstance`** | RSEI's instance plus its evaluated virtual attributes; the nested Formik's initial value. |
| **`ReportFormSubmitContext`** | React context through which RVWE offers its submit function to nested Formiks (#330). |
| **`submitNestedFormValues`** | RSEI's nested-Formik submit: strips virtual attributes, then calls the Report submit (#330). |
| **`submitRequiresValidType`** | TVOE prop: the submit is disabled while `mlsTypeCheck` fails (#330). |
| **`lastSubmitButtonClicked`** | Formik key set by a TVOE submit so the Report submit knows which value in the form to save. |
| **`mlsTypeCheck`** | Resolves an ML schema against a value; TVOE needs its result to choose editors, foreign keys and validation. |
| **Reinitialise** | With `enableReinitialize`, Formik resets its values when `initialValues` changes **deeply**. Unsaved edits are lost. |
| **Multistep Report** | A Report with `type: "multistep"`: a wizard of steps with Back, Next and Finish, run by `MultistepReportHost` (#274). |
| **Step bag** | The multistep host's record of what the user entered: input-section values and object-instance values, by key. Next and Finish pass it to actions and queries. |
| **Save** | A TVOE submit: an `updateInstance` applied to the Redux local cache at once, inside the open transaction. |
| **Commit** | The separate Miroir action that persists the open transaction to the store. |

---

## 1. Conclusion

1. **Cause.** Commit [`65ac0fed6`](https://github.com/miroir-framework/miroir/commit/65ac0fed61b0af469a00f6a324d00e48be06bda5) (#82 virtual attributes, 2026-08-31) wrapped the instance editor of `ReportSectionEntityInstance` in a **nested `<Formik>`**. The inline Report editor uses the same component, with the displayed Report as the "instance". Its keystrokes now update the nested Formik. The rendered sections read the **report-level** Formik (`formik.values[reportName]`), which no longer changes until a save, a local-cache update and a Formik reinitialisation.
2. **Not a performance change.** #82 added the nested Formik to show virtual attributes without writing them into the Report form ([#82 plan L495](../../features/82-FEATURE-virtual-attributes-on-entity/tdd-implementation-plan.md)). No document or commit gives a performance reason. Nobody recorded that the inline editor lost its live preview.
3. **But it has a performance side effect.** Because the editor writes to its own small Formik, a keystroke re-renders and re-typechecks only that editor. Before #82, a keystroke in any instance editor re-rendered every section of the report and re-ran the typecheck of every `TypedValueObjectEditor` on the page. Removing the nested Formik everywhere would bring that cost back to **every** instance page, not only to the Report editor. That cost was never measured.
4. **Same cause, other symptoms.**
   - Saving any instance was broken from #82 until #330 (`onSubmit={() => {}}`); #330 rewired the save but kept the isolation.
   - Editing a Query definition no longer re-runs its test results live.
   - Instance titles and labels interpolated from the instance do not follow edits.
5. **Recommended direction** (for decision, section 7): skip the nested Formik where it has nothing to show. Do it at least for the inline Report editor, like the existing multistep bypass. Keep it for entities whose details editor overlays virtual attributes. Narrow the typecheck memo dependencies to cut the per-keystroke cost. Add the missing test.

---

## 2. Rendering flow today

All paths below are under `packages/miroir-standalone-app/src/miroir-fwk/4_view/` unless stated. Abbreviations (RVWE, RSVWE, RSEI, TVOE) are in the [Glossary](#glossary). The internal reference [`docs/internals/report-display.md`](../../../docs/internals/report-display.md) describes the June design; parts of it are now out of date (section 8).

### 2.1 Display (edit mode off)

| Step | Component | What it does | Source |
|---|---|---|---|
| 1 | `RootComponent` | `useCurrentModel` over the local cache → `deploymentReportsEntitiesMapping` → `context.setDeploymentUuidToReportsEntitiesMapping` | [`components/Page/RootComponent.tsx:328-345`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Page/RootComponent.tsx#L328-L345) |
| 2 | `ReportPage` | Route wrapper; syncs URL params into the Miroir context | [`routes/ReportPage.tsx:38-127`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/routes/ReportPage.tsx#L38-L127) |
| 3 | `ReportDisplay` | Picks the `Report` from the context mapping (`availableReports`) or `currentModel.reports`; runs `runStoredQueries`; mounts RVWE (inside `MultistepReportHost` for multistep Reports) | [`routes/ReportDisplay.tsx:75-117`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/routes/ReportDisplay.tsx#L75-L117), [`:189-215`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/routes/ReportDisplay.tsx#L189-L215) |
| 4 | RVWE: query | Builds the boxed query from **`props.reportDefinition`** (extractors, combiners, runtime transformers), selects `reportData` from the local cache, optionally starts the async load | [`components/Reports/ReportViewWithEditor.tsx:112-216`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportViewWithEditor.tsx#L112-L216) |
| 5 | RVWE: form values | `initialReportSectionsFormValue` = per-section data + stored query data + report data + `pageParams` + `reportReportDetails` + **`[reportName]: props.reportDefinition`** + multistep bag | [`ReportViewWithEditor.tsx:268-301`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportViewWithEditor.tsx#L268-L301) |
| 6 | RVWE: **report Formik** | One `<Formik enableReinitialize initialValues={initialReportSectionsFormValue}>`; its `onSubmit` and `ReportFormSubmitContext` share `submitReportFormValues` | [`ReportViewWithEditor.tsx:479-592`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportViewWithEditor.tsx#L479-L592) |
| 7 | RSVWE (recursive) | Reads the section definition from **`formik.values[reportName]`** at `reportSectionPath`; recurses for `grid`, `list`, `accordion`; switches on leaf type | [`components/Reports/ReportSectionViewWithEditor.tsx:173-186`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportSectionViewWithEditor.tsx#L173-L186), [`:401-466`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportSectionViewWithEditor.tsx#L401-L466) |
| 8 | Leaves | Instance (RSEI), list, markdown, graph, diagram, JSON, input, runner, test, open-report, stored report … each reads its data from the report Formik | [`ReportSectionViewWithEditor.tsx:470-770`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportSectionViewWithEditor.tsx#L470-L770) |

Formik 2.4.9 reinitialises when `initialValues` is **deeply** different (`react-fast-compare`, in an effect: `node_modules/formik/dist/formik.esm.js:564-575`). A new reference with the same content does not reset the form; a data refresh with new content does.

### 2.2 Edit mode on (`context.viewParams.generalEditMode`)

RVWE renders `InlineReportEditor` **inside the same report Formik render function**, above the sections ([`ReportViewWithEditor.tsx:550-562`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportViewWithEditor.tsx#L550-L562)).

`InlineReportEditor` renders RSEI with ([`components/Reports/InlineReportEditor.tsx:83-92`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/InlineReportEditor.tsx#L83-L92)):

- `formikValuePath = [reportName]`: the "instance" is the displayed Report, the same key RSVWE reads;
- `formikReportDefinitionPathString = "reportReportDetails"`: the meta-report that describes how to edit a Report;
- `reportSectionPath = ["definition","section","definition",0]`: its `objectInstanceReportSection`.

RSEI then ([`components/Reports/ReportSectionEntityInstance.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportSectionEntityInstance.tsx)):

- reads `instance = formikContext.values[reportName]` from the **report** Formik (`:209`);
- computes `displayedInstance` = instance + evaluated virtual attributes (`:251-269`). The `Report` entity declares none, so here `displayedInstance === instance`. Only the Library `Book` entity declares one ([`e8ba151b….json`](../../../packages/miroir-example-library/assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/e8ba151b-d68e-4cc3-9a83-3459d309ccf5.json));
- chooses its branch on `reportDefinitionFromFormik?.type === "multistep"` (`:640`). For the inline editor that is `reportReportDetails`, never multistep, so **the inline editor always takes the nested-Formik branch**, even on a multistep Report;
- mounts `<Formik initialValues={{[reportName]: displayedInstance}} enableReinitialize onSubmit={submitNestedFormValues}>` around TVOE (`:659-684`).

TVOE reads and writes `formik.values[formikValuePathAsString]` of the **nearest** Formik ([`components/Reports/TypedValueObjectEditor.tsx:190-197`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/TypedValueObjectEditor.tsx#L190-L197)); the `Ml*Editor` fields call `setFieldValue` on each keystroke, with no buffering for ordinary fields.

### 2.3 Where a keystroke lands

| | June 2026 (`11d616014`) | Today (`958657e97`) |
|---|---|---|
| Formik that the inline editor's TVOE writes to | Report Formik (RSEI had no Formik: `git show 65ac0fed6^:…ReportSectionEntityInstance.tsx` has 0 `<Formik`) | Nested Formik in RSEI |
| `formik.values[reportName]` read by RSVWE | Updated on the keystroke | Unchanged until save |
| Rendered sections | Re-render with the edited definition in the same React update | Unchanged |
| Work per keystroke | Whole report tree re-renders; every TVOE on the page re-typechecks | Only the editor subtree re-renders and re-typechecks |

### 2.4 Save path today (what "needs a commit" means)

1. TVOE submit sets `lastSubmitButtonClicked`, `_mode`, then `submitForm` on the **nested** Formik ([`TypedValueObjectEditor.tsx:520-560`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/TypedValueObjectEditor.tsx#L520-L560)).
2. `submitNestedFormValues` strips virtual attributes and calls `useReportFormSubmit()` ([`ReportSectionEntityInstance.tsx:273-289`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportSectionEntityInstance.tsx#L273-L289), [`ReportFormSubmitContext.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportFormSubmitContext.tsx)).
3. RVWE `onEditValueObjectFormSubmit` sends a `transactionalInstanceAction` / `updateInstance` for a model-section instance such as a Report ([`ReportViewWithEditor.tsx:310-422`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportViewWithEditor.tsx#L310-L422)).
4. The Redux local cache applies it at once, inside the open transaction ([`miroir-localcache-redux/src/4_services/localCache/LocalCacheSlice.ts:1044-1046`](../../../packages/miroir-localcache-redux/src/4_services/localCache/LocalCacheSlice.ts#L1044-L1046)). Persisting to the store is the separate Miroir commit.
5. `RootComponent` → context mapping → `ReportDisplay` → new `props.reportDefinition` → new `initialReportSectionsFormValue` → report Formik reinitialises → sections show the edit. The nested Formik reinitialises too, because `displayedInstance` changed.

So the display updates after the **save** (local cache), not only after the store commit.

---

## 3. History

| Date | Commit | Change | Effect on live feedback |
|---|---|---|---|
| 2025-10-23 | [`71e7efede`](https://github.com/miroir-framework/miroir/commit/71e7efedecb149a3b9928ded295ff1d3ca9885be) | #112: inline Report editor; "rendered report is updated on commit" | Not live yet |
| 2025-10-24 → 28 | [`adcd396a9`](https://github.com/miroir-framework/miroir/commit/adcd396a9d80c0db63896a9ab15e215cbc02c9b1) … [`8c1e2f97f`](https://github.com/miroir-framework/miroir/commit/8c1e2f97fcd63acbc4579e3f004a59cdd70c7637) | #112: Formik moved up to RVWE; per-section Formik removed from RSEI | **Live**: one Formik for editor and display. The PRD asked for "live updates (potentially throttled / debounced … for performance)" ([#112 PRD L117](../../features/112/0001-prd-inline-report-editing.md)); no throttle was ever added |
| 2026-06-07 | [`11d616014`](https://github.com/miroir-framework/miroir/commit/11d616014a74c6d68f85bfcbd81f0669c9c633c9) | #116 sandbox (reference state) | Live |
| 2026-08-31 | [`65ac0fed6`](https://github.com/miroir-framework/miroir/commit/65ac0fed61b0af469a00f6a324d00e48be06bda5) | #82: nested `<Formik … onSubmit={() => {}}>` in RSEI to show virtual attributes | **Regression**: editor isolated from display; instance saves become no-ops |
| 2026-09-13 | [`35723143e`](https://github.com/miroir-framework/miroir/commit/35723143e9b19f52221505e02397cfe8062b51c5) | #274: multistep Reports skip the nested Formik ([#274 analysis §3.5](../../features/274-FEATURE-multistep-reports/analysis.md): "Edits do not land in the parent Report Formik … Non-multistep Reports keep the nested Formik so we do not change current instance pages") | Isolation noticed, bypassed for multistep sections only |
| 2026-09-27 | [`74d0bd787`](https://github.com/miroir-framework/miroir/commit/74d0bd787afa086f3727fa5010799241581d63aa), [`6bd51dc5f`](https://github.com/miroir-framework/miroir/commit/6bd51dc5f22bfbc3415e45a54f7b8e825fcaaa15) | #330: "`BookDetails` has not saved since #82"; nested `onSubmit` routed through `ReportFormSubmitContext`; `submitRequiresValidType` ([#330 plan L289, L310-311](../../features/330-FEATURE-report-level-miroir-tests/tdd-implementation-plan.md)) | Saving fixed. "No nested Formik for this branch" was listed as an alternative and not chosen. Live preview not considered |

`ReportViewWithEditor`, `InlineReportEditor` and `ReportSectionViewWithEditor` changed between June and now (async load #214, multistep #274, API-call section #281, renames), but none of those changes moves the edited Report out of the report Formik. No `React.memo` was added in the report tree (the only `memo(` change since June is in TransformerBuilder, `9e7950630`).

---

## 4. Blast radius of the nested Formik

### 4.1 Callers of `ReportSectionEntityInstance`

| Caller | Key edited | Formik written today | Readers of that key in the **report** Formik (not updated live) |
|---|---|---|---|
| `InlineReportEditor` ([`:83-92`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/InlineReportEditor.tsx#L83-L92)) | `[reportName]` (the Report) | Nested, always (multistep check reads `reportReportDetails`) | Every RSVWE node and leaf: list display (`ReportSectionListDisplay.tsx:161-181`), markdown (`ReportSectionMarkdown.tsx:68-80`), MiroirTest (`ReportSectionMiroirTest.tsx:38-50`), instance sections (RSEI `:166-181`), multistep bag capture (RVWE `:509-512`) |
| RSVWE `objectInstanceReportSection` ([`:540-556`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportSectionViewWithEditor.tsx#L540-L556)), e.g. Book details | `definition_section_definition_0` (the instance) | Nested, except multistep Reports (outer, #274) | RSEI's own title/label interpolation (`:493-501`), outline instance (`:349-366`, uuid-guarded), Query test run (`:384-430`), OpenAPI sync button (`:503`) |
| `JsonObjectEditFormDialog` → RSVWE ([`JsonObjectEditFormDialog.tsx:371-387`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/JsonObjectEditFormDialog.tsx#L371-L387)), list add/edit | Draft injected by `setValues` at `definition_section_definition_0` (`:288-296`) | Nested | The injected outer key only; it may collide with the host report's own section key (`ReportTools.ts:263/270`), mostly harmless because the list reads `fetchedDataReference` first |
| Test `tests/4_view/virtualAttributes.integ.test.tsx:54-75` | Book | Nested (plain test Formik, no submit context) | n/a: asserts the read-only virtual "citation" is shown |

### 4.2 Other symptoms of the same isolation

- **Query details.** `currentQuery = instance` comes from the report Formik (`ReportSectionEntityInstance.tsx:384-430`). Edits to the Query definition land in the nested Formik, so the test results stop following them. The query **parameters** editor sits outside the nested Formik (`:571-584`) and still re-runs the query live. This was live before #82 (#108 behaviour).
- **Virtual attributes are frozen while editing.** `displayedInstance` is computed from the outer instance, so a virtual attribute does not follow its source fields until save. This holds for Book today.
- **Lost nested edits.** The nested Formik reinitialises when `displayedInstance` changes deeply: after an outer reinitialisation, after an OpenAPI sync write to the outer key (`OpenApiEndpointSyncButton.tsx:100`), or after a dialog `setValues`. Unsaved nested edits are then discarded.
- **Context missing inside the nested Formik.** It holds one key. Ml editors that evaluate transformers with `formik.values` as parameters see no `pageParams`, report data or other sections: FK `targetApplication` (`MlElementEditorHooks.ts:370-371`), field validation (`MlElementEditor.tsx:476-482`), `initializeTo` (`MlAnyEditor.tsx:120`), enums (`MlEnumEditor.tsx:108,156`). No failure is known from this; it is a difference from June to keep in mind.

### 4.3 Tests that pin today's behaviour

| Test | What it pins | Effect of each option (section 7) |
|---|---|---|
| [`multistep.274.phase0.unit.test.ts:316-326`](../../../packages/miroir-standalone-app/tests/4_view/issues/274-multistep-reports/multistep.274.phase0.unit.test.ts#L316-L326) | Source regex: `<Formik … onSubmit={submitNestedFormValues}` exists in RSEI | Breaks with A; passes with B1/B2 |
| [`multistepProcess.274.integ.test.tsx:768-784`](../../../packages/miroir-standalone-app/tests/4_view/issues/274-multistep-reports/multistepProcess.274.integ.test.tsx#L768-L784) | No nested Formik on multistep; instance edits reach the step bag | Unchanged |
| [`virtualAttributes.integ.test.tsx:50-87`](../../../packages/miroir-standalone-app/tests/4_view/virtualAttributes.integ.test.tsx#L50-L87) | Book details shows the virtual citation | Breaks with A unless virtual display moves elsewhere; passes with B1/B2 |
| `report.bookDetails` MiroirTest ([`4edb680b….json`](../../../packages/miroir-example-library/assets/library_model/a311f363-e238-4203-bdfc-29e8c160c26b/4edb680b-4686-4d9a-bb96-40fa9f945b24.json)): saves an edited title; does not save an invalid value | Save through the nested Formik; `submitRequiresValidType` | Must stay green with every option; B must keep `submitRequiresValidType` on the bypassed editor |

**No test** covers "edit in the inline Report editor → rendered section changes". That is how the regression went unnoticed.

### 4.4 Gaps that were already there in June (not part of this regression)

- **Query part of the Report.** The query is built from `props.reportDefinition` (RVWE `:112-154`), not from the Formik value. Editing extractors, combiners or runtime transformers never re-ran the query before save, in June or now. Only the **section** definition was live.
- **Markdown content.** `ReportSectionMarkdown` copies the content into `useState` once at mount (`:83`, same in June) and displays that copy. Content edits made in the inline editor never showed live.
- **CodeMirror fields** keep their text in local state seeded at mount (`MlElementEditorReactCodeMirror.tsx:88-130`) and push to Formik only when the JSON parses.
- **Reinitialisation wipes unsaved edits** whenever the report data changes deeply (#108 open item on `editedQueryParameterValue`).
- **Crash on a structural edit.** An edit that changes a section's `type` can make RSEI throw (`:469-476`) or RSVWE read `definition.label` of undefined (`:705`). One `ErrorBoundary` in `ReportDisplay` (`:172-186`) wraps both the editor and the sections, so the editor unmounts with the in-progress edit. Live feedback makes this reachable on every keystroke.

### 4.5 Why multistep Reports bypass the nested Formik

The bypass has a functional reason, the same one the inline Report editor has: **another component must read the edits before any save.**

1. **The step bag is read from the report Formik.** `MultistepReportHost` lists one bag key per object-instance section, `reportSectionPath.join("_")` ([`MultistepReportHost.tsx:257-259`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/MultistepReportHost.tsx#L257-L259)). It copies those keys out of the **report** Formik values on every render (`captureStepBagFromFormikValues`, [`ReportViewWithEditor.tsx:509-512`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportViewWithEditor.tsx#L509-L512)). It also copies them on every change, through the report Formik `validate` (`mergeStepBagFromFormikValues`, [`ReportViewWithEditor.tsx:483-492`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportViewWithEditor.tsx#L483-L492), [`MultistepReportHost.tsx:679-700`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/MultistepReportHost.tsx#L679-L700)).
2. **Next and Finish use only the bag.** Next feeds the bag into the next step's query `pageParams` ([`ReportViewWithEditor.tsx:81-96`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportViewWithEditor.tsx#L81-L96)) and into `onNext` actions. Finish passes it as `actionParamValues` to `handleCompositeActionTemplate` ([`MultistepReportHost.tsx:183`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/MultistepReportHost.tsx#L183), [`:815`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/MultistepReportHost.tsx#L815)). Decision D5 ([#274 analysis L75-95](../../features/274-FEATURE-multistep-reports/analysis.md)) fixes the bag as "input-section prefixes + hoisted object-instance keys".
3. **A wizard step has no per-instance save.** The host's Back, Next and Finish buttons sit outside the sections. The nested Formik's own submit is not part of that flow.

With the nested Formik, the edits of a multistep instance step would stay in the nested copy. The bag would keep the seeded value, and Finish would create or update the entity with the wrong data. #274 §3.5 called the nested Formik "misaligned with D5". Slice 4 chose "one write path": skip the nested Formik and let TVOE write the report Formik at the bag key ([#274 plan L472](../../features/274-FEATURE-multistep-reports/tdd-implementation-plan.md)). The test `instance-edit-updates-bag` checks that an edit reaches the bag, and `instance-finish-sees-hoisted-key` checks that Finish sees it ([`multistepProcess.274.integ.test.tsx:775-786`](../../../packages/miroir-standalone-app/tests/4_view/issues/274-multistep-reports/multistepProcess.274.integ.test.tsx#L775-L786)).

Two limits of that bypass:

- **No virtual-attribute overlay on multistep instance steps.** The bypass branch edits the outer `instance` directly, not `displayedInstance`. A virtual attribute shows there only if the step's query already returns it.
- **Scope was kept narrow on purpose, not for a technical reason.** "Non-multistep Reports keep the nested Formik so we do not change current instance pages" (#274 §3.5). The branch test reads the type of the Report that **contains the section** (`reportDefinitionFromFormik`). For the inline Report editor that is `reportReportDetails`, so the editor never takes the bypass, even on a multistep Report.

Option B1 (section 7) applies the same pattern for the same reason: RSVWE must read the Report editor's edits before save, as the step bag must read instance edits.

---

## 5. Why a revert is not free: performance

### 5.1 What one keystroke costs when the editor shares the report Formik

No component in the report tree is memoised, so every `useFormikContext` consumer re-renders on each change of its Formik:

- every RSVWE node, which re-resolves its section definition without memo (`:173-186`) and the API-call schema (`:218-233`);
- **every TVOE**: `mlsTypeCheck` memo deps include the whole `formik.values` ([`TypedValueObjectEditor.tsx:321-361`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/TypedValueObjectEditor.tsx#L321-L361)), and so does the field-validation memo (`:312-319`). With the inline editor open, that includes the **full Report-schema typecheck**, plus one typecheck per instance section;
- model diagram sections re-run their entity transformer (memo on `formik.values`, RSVWE `:240-262`);
- graph sections receive `queryResults={formik.values}` and rebuild their points (`GraphReportSectionView.tsx:96-134`);
- JSON sections re-stringify their data (RSVWE `:719-725`);
- list sections re-run their label interpolation; their row memo returns the same reference when the rows are unchanged (`ReportSectionListDisplay.tsx:195-214`);
- `Ml*Editor` memos keyed on `formik.values` (`MlElementEditorHooks.ts:240-270`, `MlObjectEditor.tsx:1248`, `MlArrayEditor.tsx:686`).

Note: the typecheck only uses `valueObject`; `formik.values` in its deps is superfluous. This is the code's own TODO (`:327`) and the "known cost" in [`report-display.md` L204](../../../docs/internals/report-display.md).

### 5.2 What is known, what is not

- **Known performance work in this area** was about render **loops**, not keystroke cost: #108 (15 renders/s from reinit ↔ outline), #157 (typecheck pushed into context), #211 (unstable load-service identity), #61 (idle-callback mount cascade, a 17 s click handler). Their guards are independent of the nested Formik and stay in place under every option: the uuid guard, fingerprint-keyed loading, ref plus version counter in field validation, and viewport-gated mount.
- **No measurement exists** of keystroke latency in the shared report Formik, in June or now. The only per-editor figures (#303: ~288 ms remount, ~38 ms update median) come from component tests with their own Formik.
- So the trade-off is real but unquantified. Before choosing, measure the scenarios of section 6.

---

## 6. Measurements to take before fixing

Use the React Profiler or the #61 render-insight registry (`showPerformanceDisplay`), on a production build. Count commit duration per keystroke, median and p95 over 20 keystrokes, on:

1. Library `BookList` report, edit mode on, inline editor open, typing in a section label (list grid present).
2. Library `BookDetails`, edit mode off, typing in the Book name (most common edit; affected by option B2 and A).
3. A Report with a model diagram or graph section, edit mode on (heaviest re-render).
4. The Miroir `ReportDetails` report itself (largest Report value to typecheck).

Run each at `958657e97` and with the candidate fix, and with and without option D. If a scenario exceeds about 50 ms per keystroke (rule of thumb: the RAIL model's input budget, not a project requirement), apply D before shipping live feedback, not a debounce (AGENTS.md: debouncing is a design smell).

---

## 7. Options (for decision; nothing implemented)

| Option | What changes | Live Report editor | Live Query test run | Instance pages typing cost | Risk |
|---|---|---|---|---|---|
| **A. Remove the nested Formik** | Back to June everywhere; virtual attributes need another display path (e.g. overlay at render, not in Formik) | Yes | Yes | Back to June: whole report per keystroke | Breaks 2 tests; reopens #82 design; widest radius |
| **B1. Bypass for the inline editor only** | RSEI prop (e.g. "edit in the report form") set by `InlineReportEditor`, like the multistep bypass (§4.5); keep `submitRequiresValidType` | Yes | No | Unchanged | Smallest radius; Report saves go through the RVWE `onSubmit` again (same function as today) |
| **B2. Nest only when virtual attributes are overlaid** | Mount the nested Formik only when `displayedInstance !== instance` | Yes | Yes | June cost for every entity without virtual attributes (all but Book today) | Medium radius; behaviour depends on the entity's schema |
| **C. Keep nesting, mirror to the outer Formik** | Copy nested values to the report Formik on change | Yes | Yes | Both Formiks re-render | Two sources of truth; reinit ping-pong (outer change → `displayedInstance` → nested reset); needs an effect or the multistep `validate` + `queueMicrotask` trick. Not recommended |
| **D. Narrow typecheck deps** (complements A/B) | Drop `formik.values` from the `mlsTypeCheck` memo deps in TVOE | n/a | n/a | Cuts the per-keystroke typecheck from all TVOEs to the edited one | Low: the typecheck reads only `valueObject`. Field-validation memo genuinely needs `formik.values`; leave it |

**Recommendation:** B1 + D first, with a new test. Then decide whether the Query details page should get B2 (it is the second user-visible loss).

**Test to add with the fix** (fails today, passes after): open a Report with `generalEditMode` on, change a section label in the inline Report editor, and check that the rendered section shows the new label **before** any save, and that the store is unchanged. A MiroirTest report test (#330 runner) fits; the `report.bookDetails` suite shows the step format.

**Out of scope, to decide separately:** making query edits live (re-running the report query from the Formik value). That is a new feature with its own cost (a query per keystroke). It probably needs an explicit "apply" action rather than a debounce.

---

## 8. Documentation out of date

[`docs/internals/report-display.md`](../../../docs/internals/report-display.md) still states "One Formik per `ReportViewWithEditor` mount" (L53) and "TVOE inside a report section: **0 extra**" (L60). The nested Formik in RSEI and the `ReportFormSubmitContext` submit path should be added there with the fix.

## 9. Open questions

1. Is losing the live Query test run (section 4.2) also a regression to fix now, or later?
2. Should the inline editor on a **multistep** Report edit the Report (today) or be hidden? It always takes the nested branch.
3. Keep the June behaviour where edits are wiped by a data refresh, or protect unsaved Report edits (for example by not reinitialising while the form is dirty)?
