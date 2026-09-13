# 274 — Multi-step Reports (paged sections + CompositeActionSequence on Finish)

> How to let any application declare a paged process as a Report: one section visible at a
> time, Back / Next / Finish / Cancel, parameters collected in Formik, an inline
> `compositeActionSequence` on Finish. No Form entity. A Runner is not required.

Related issue: https://github.com/miroir-framework/miroir/issues/274
Related: [#169](https://github.com/miroir-framework/miroir/issues/169) MLS form validation (not a prerequisite)
Key sources: [`Report.ts` types](../../../packages/miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.ts), [`ReportViewWithEditor.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportViewWithEditor.tsx), [`ReportSectionViewWithEditor.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportSectionViewWithEditor.tsx), [`ReportTools.ts`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportTools.ts), [`RunnerView.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Runners/RunnerView.tsx), [`DomainController.ts`](../../../packages/miroir-core/src/3_controllers/DomainController.ts)

**Document role:** analysis and architectural decision record.
**Status:** decisions confirmed with the user (design grilling, 2026-09-12/13). Revised after [adversarial review](./adversarial-review.md) (R1–R12 applied). Implementation proceeds per [`./tdd-implementation-plan.md`](./tdd-implementation-plan.md) once that file exists.

**Document history:** first commit stated Finish uses “the whole Report Formik tree” and Next merges `{ ...launchPageParams, ...formikValues }`. Review R1 showed that tree includes `reportData`, `pageParams`, and the Report definition under the report `name`, so the merge is circular. D5/D8 below now name an extracted **step bag**. Other review repairs: section-type switches (R2), disable URL writes in multistep (R3), per-row list launcher (R4), bag above query-failure unmount (R5), `runStoredQueries` unsupported (R6), seed `type` counts (R7), dual-write paths (R8), `CompositeActionSequenceTemplate` (R9), citation fixes (R10), Finish `modelEnvironment` (R11), launcher `pageParams` (R12).

---

## Decision record

Confirmed with the user. Defaults accepted where a pick was offered.

| ID | Decision | Choice |
|---|---|---|
| D1 | What Finish commits | **Domain process:** collect parameters, then run `compositeActionSequence`. A Runner is not required. |
| D2 | Reification | **`Report.type: "multistep"`**. No Form entity. |
| D3 | What a step is | **Any `ReportSection`**. A `list` step still shows all of its children on that page. |
| D4 | Schema home for the sequence | **Inline on `RootReport`** as `compositeActionSequence`: type `CompositeActionSequenceTemplate`. |
| D5 | Finish payload | **The step bag only** (`inputPrefix` buckets + hoisted object-instance keys). Not the raw Formik tree. |
| D6 | Modal vs route | **The launcher chooses.** The Report definition does not. |
| D7 | Next gating | **Jzod on the current `inputReportSection` / `objectInstanceReportSection`.** Other types always allow Next. Finish validates every such step. |
| D8 | Later-step queries | **On Next/Back, merge `{ ...launchPageParams, ...stepBag }` into in-memory query `pageParams`.** No URL write. |
| D9 | Mid-step writes | **No special treatment.** List Add and Runner submit persist immediately. |
| D10 | Back | **Keep Formik. Rerun the Report query** with the merged params. |
| D11 | Cancel / dismiss | **Confirm, then drop the bag.** Do not undo D9 writes. |
| D12 | Finish placement | **Last step only.** |
| D13 | Unfinished run | **Memory only.** No FormRun entity. |
| D14 | In-page launcher | **Page-level `openReportSection`** plus **optional `objectListReportSection.definition.openReport`** for a per-row tools-column button. |
| D15 | After Finish succeeds | **Close the modal, or leave the route.** |
| D16 | Step in the URL | **No.** Refresh restarts at step 1 with an empty bag. |
| D17 | List-row context | **Row PK as `instanceUuid` plus the caller’s launch `pageParams`.** |

**Rationale:** reuse the Report section tree and the existing composite-action runner. Discriminate paging with `Report.type` so the 11 existing `type: "list"` Reports (and the 71 that omit `type`, plus 2 postgres Reports with `"type": null`) keep showing every section. Do not invent a second form stack beside `customRunner`.

### D1 — what Finish commits

**Status:** Accepted — domain process; Runner optional.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| D1-a. Instance wizard | Paged `createInstance` / `updateInstance` only | Matches list-Add dialog | A second concept beside actions; “process” does not fit |
| D1-b. Object-graph assembler | Several instances, one transaction | Clean commit | Needs a transaction wrap we rejected (D11) |
| **D1-c. Domain process** ★ | Formik bag → `compositeActionSequence` | Same engine as `customRunner`; create/update are actions in the sequence | Author must write the sequence |

**Decision:** D1-c. User correction: the bag is **not** “the Runner payload.” Finish calls **`handleCompositeActionTemplate` only**, wrapping the stored `CompositeActionSequenceTemplate` as `{ actionType: "compositeActionTemplate", compositeActionTemplate }` — the `customRunner` path in `RunnerView.tsx` L611–631, **not** the resolved `handleCompositeAction` branch at L592–610 (that function still has a stale `// TODO: used in tests only?!` at `DomainController.ts` L3597; do not copy that comment into the host). `handleCompositeActionTemplate` (`DomainController.ts` L4696) builds `localActionParams = { ...templateEvaluationParams, ...actionParamValues }` (L4704) and resolves templates with `resolveCompositeActionTemplate` (L4719–4723). `actionParamValues` is the **step bag** (D5), not the raw Formik `values` object. A `runnerReportSection` on a step is an ordinary section (D9).

### D2 / D4 — how a multistep Report is stored

**Status:** Accepted — `Report.type: "multistep"` + `RootReport.compositeActionSequence`.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D2-a. `Report.type` += `"multistep"`** ★ | If `section` is `list`, each child is a step; if leaf, one step | Matches “special kind of Report”; existing `type: "list"` Reports unchanged | `Report.type` is unused for rendering today; the host must start reading it |
| D2-b. New `multistepReportSection` | Root section holds `steps` + sequence | Nestable later | Extra section type for a Report-level idea |
| D2-c. Flag on `list` | `display: "stepper"` | Small | Easy to break current list Reports |

**Decision:** D2-a. `RootReport.compositeActionSequence` is a `CompositeActionSequenceTemplate` (`miroirFundamentalType.ts` L3857, alias L9993) — the same field type as `customRunner.definition.compositeActionSequence`. Optional on `RootReport`; **required for runtime Finish** when `type === "multistep"`. A multistep Report without a sequence is authoring-incomplete: Finish is disabled and the host surfaces that.

Dual-write on **both** present-model Entity and EntityVersion (enum, `rootReport.compositeActionSequence`, `reportSection` union + context for `openReportSection`):

- Entity: `packages/miroir-test-app_deployment-miroir/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916.json` (`type` enum L57–62)
- EntityVersion: `packages/miroir-test-app_deployment-miroir/assets/miroir_modelVersion/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/952d2c65-4da2-45c2-9394-a0920ceedfb6.json` (`type` enum L56–61)

`Report.type` today is optional `enum ["list","grid"]` on both assets and on generated `Report` / `ReportVersion` (`miroirFundamentalType.ts` L3423, L2848). Inventory of seed JSON with `parentUuid === 3f2baa83-3ef7-45ce-82ea-6a43f7a8c916`: **84** instances (42 miroir_data, 14 admin_model, 14 library_model, 8 designer_model, 5 postgres_model, 1 spotify_model). **11** have `type: "list"`. **0** have `type: "grid"`. **71** omit `type`. **2** postgres Reports carry explicit `"type": null` (`TableDetails` `7c80d9ec-35b2-4cb8-8164-c5fe4e20687f`, `SchemaDetails` `a72bb361-3126-4aa1-85cc-0be4d6838c84`). Freeze copies `type` when `!== undefined` (`applicationVersionFreeze.ts` L226), so those two would write `null` into a ReportVersion. This issue does **not** rewrite those two assets; they stay a pre-existing postgres quirk. Rendering keys off **`section.type`**, not `Report.type` (`ReportSectionViewWithEditor.tsx` L304 `grid`, L347 `list`).

### D5 — Finish parameter tree (step bag)

**Status:** Accepted — extracted **step bag**, not raw `formik.values`. Product intent of D5-a (input prefixes **and** object-instance keys; `getFromParameters`) is unchanged. The vehicle is not the whole Formik tree.

Parent Formik `initialValues` is **not** a parameter object. `initialReportSectionsFormValue` (`ReportViewWithEditor.tsx` L245–272) is:

```
{ ...reportSectionsData, ...storedQueryData, ...reportData,
  pageParams, [reportReportDetailsKey], [reportName]: reportDefinition }
```

Passing that to Finish would put the Report definition, query results, and `pageParams` into the action namespace. Spreading `formikValues` back onto `pageParams` is circular: `pageParams` is itself a Formik key (L266), `initialValues` depends on `props.pageParams` (L272), and `enableReinitialize` would reset the tree.

**Step bag keys** (the only keys Finish and Next/Back query-merge use):

| Source | Key |
|---|---|
| Each `inputReportSection` | `definition.inputPrefix`, or `reportSectionPath.join("_") + "_inputMLSchema"` if omitted (`ReportTools.ts` L216–250) |
| Each `objectInstanceReportSection` | `reportSectionPath.join("_")` (`ReportTools.ts` L177–215), after hoist (§3.5) |

**Collision:** if a `reportData` / `storedQueryData` key equals a bag key, the bag value wins on extract and on reinit. Display keys may update from `reportData`; bag keys must not.

**Where the bag lives:** React state on the **multistep host**, above `ReportViewWithEditor`’s query-failure branch (`ReportViewWithEditor.tsx` L428–435 unmounts Formik when `reportData.elementType == "failure"` and the report is not a url-param input report). Editors write through to that state. Formik `initialValues` can still include display/`reportData` keys; reinit must not replace bag keys (host-state merge, or disable `enableReinitialize` for bag keys).

**Finish `actionParamValues`:** the step bag object only. Templates use `getFromParameters` / `referencePath` as today (`RunnerView.tsx` L344–347 is the Runner-name precedent; authors reference `inputPrefix` or the object-instance path key).

**Next/Back query `pageParams`:** `{ ...launchPageParams, ...stepBag }`. Do not spread raw `formik.values`. Do not nest a `pageParams` field inside `pageParams`.

### D8 — later-step queries and `enableReinitialize`

**Status:** Accepted — in-memory merge. **Required host repair:** do not let Formik reinitialize wipe the bag.

Report extractors read `pageParams` from the route wrapper, not live Formik:

```72:78:packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportViewWithEditor.tsx
  const reportInterpreterPageParams = useMemo(
    () => ({
      ...props.pageParams,
      applicationSelector: context.toolsPageState?.applicationSelector,
    }),
    [props.pageParams, context.toolsPageState?.applicationSelector],
  );
```

That object is what `reportDataQueryBase` passes as `pageParams` (L111, L122, L130). The only current Formik → query bridge is `inputReportSection.urlParamFields` plus an Apply button that writes the URL (`ReportInputSection.tsx` L81–93). `#267` already forwards unknown search keys (`PageDispatcher.tsx` `reportPageParamsFromSearchParams` L64–87; `ReportUrlParamKeys` is known keys plus `(string & {})` in `packages/miroir-standalone-app/src/constants.ts` L8–14). We still **do not** use the URL for step values: modal has none we should depend on, and D16 forbids `step=N`.

**Misalignment the host must fix.** Parent Formik is created with `enableReinitialize={true}` and `initialValues={initialReportSectionsFormValue}` (`ReportViewWithEditor.tsx` L434–436). `initialReportSectionsFormValue` rebuilds from `reportData` (L245–272). If Next reruns the query and `reportData` changes, Formik will reset and drop earlier steps. Multistep host rules are D5 (bag in host state; bag keys win). Also:

1. Do not use the parent Formik `onSubmit` for Finish. That `onSubmit` calls `onEditValueObjectFormSubmit` (L437–450) — report **authoring**, not the process.
2. In multistep mode, disable `ReportInputSection` URL writes: the Apply/OK button (`ReportInputSection.tsx` L113–122, handler L81–92) does `navigate("/?" + …)` and the `application` field navigates via `buildReportApplicationSwitchUrl` (L55–70). Those must not run in a modal or as a substitute for D8. Push those fields into the step bag / in-memory `pageParams` instead. `reportHasUrlParamInputSection` (`ReportViewWithEditor.tsx` L205–224, banner L416–421) is unused on multistep; the host keeps the bag mounted on query failure (R5).
3. `runStoredQueries` is **unsupported** on `type: "multistep"`. `ReportDisplay` runs them with raw route `pageParams` before `ReportViewWithEditor` (`ReportDisplay.tsx` L88–94). The host does not intercept that path. If `runStoredQueries` is present, warn and skip. Use `extractorTemplates` / `extractors` so D8 can feed `pageParams`.

### D9 — mid-step persist

**Status:** Accepted — no special treatment.

`ReportSectionListDisplay.onCreateFormObject` (L438–474) already `createInstance` (model section wraps `transactionalInstanceAction`). `StoredRunnerView` on `runnerReportSection` (`ReportSectionViewWithEditor.tsx` L530–540) still submits through `RunnerView`. A step that must not write until Finish uses `inputReportSection` or `objectInstanceReportSection`.

### D14 / D17 — in-page launcher and list rows

**Status:** Accepted — page-level section **and** an optional list-row tools action.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D14-a. `openReportSection` + list `openReport`** ★ | Page button; per-row tools-column action | Authors get both placements | Two schema sites |
| D14-b. Extend `miroirMenuReportLink` only | `openAs` on the menu item | Menu can modal | No in-page button |
| D14-c. TypeScript only | Call sites | Fast v1 | Not applicative |

**Decision:** D14-a. `storedReportDisplay` **embeds** a Report (`ReportSectionViewWithEditor.tsx` L455–470). It is not a button. Menu `miroirMenuReportLink` keeps calling `navigate(reportUrl(...))` (`AppBar.tsx` L520–545).

`openReportSection` is rendered **once** on a page (a section, not a table cell). Fields: `label`, `reportUuid`, `openAs: "modal" | "route"`, and optional `application` / `applicationSection` / `deploymentUuid`. Missing host fields are taken from the current page context, same idea as `storedReportDisplay` synthesizing `{ application, applicationSection: "data", deploymentUuid, reportUuid, instanceUuid }` (`ReportSectionViewWithEditor.tsx` L282–289). `ReportDisplay` requires `deploymentUuid`, `applicationSection`, and `reportUuid` or it shows “no report to display” (`ReportDisplay.tsx` L57–60, L129–142). `ThemedDialog` (`MUIComponents.tsx` ~L238) can wrap a full `ReportDisplay`.

**Per-row (D17):** an `openReportSection` cannot appear inside `EntityInstanceGrid` cells. Rows today have tools-column edit/delete (`EntityInstanceGrid.tsx` L546, L1146–1147) and cell-click navigation to `defaultInstanceDetailsReportUuid` (`L790–857`). Add optional `objectListReportSection.definition.openReport: { label, reportUuid, openAs }` that adds a tools-column button. On click: launch `pageParams` = `{ ...paramsAsdomainElements, instanceUuid: rowPk }` (`ReportSectionListDisplay` already forwards `paramsAsdomainElements` ~L910). That is the D17 mechanism.

`openAs: "modal"` opens the multistep host in `ThemedDialog`. `openAs: "route"` uses `reportUrl`. Paging applies only if the **target** Report is `type: "multistep"`.

**Section-type switches.** `reportSectionsFormValue` `default` returns `{}` (`ReportTools.ts` L250–260). `reportSectionsFormSchema` **throws** on unknown types (`ReportTools.ts` L104–113); its caller is `JsonObjectEditFormDialog` (~L300–312). Add `case "openReportSection": return {}` there (and any other new type). `ReportSectionViewWithEditor` L367–620 is a bare `&&` chain: unknown types render nothing until the D14 button is added.

### D6, D11, D12, D13, D15, D16

Accepted as in the summary table. Host buttons: Back, Next or Finish, Cancel, label from `section.label`. `generalEditMode` on the **process** view shows all steps stacked so the designer can edit the tree (`InlineReportEditor` around the all-sections render, `ReportViewWithEditor.tsx` L493–504); the pager is the viewer path.

**Finish environment (not the RunnerView TODO).** `RunnerView` uses `useCurrentModelEnvironment(application ?? selfApplicationMiroir.uuid, …)` with `// TODO: WRONG!!` (`RunnerView.tsx` L531–532). The multistep host must **not** copy that. Finish uses the **viewed** Report page’s `application` (from launch `pageParams`) and that page’s `applicationDeploymentMap`, via `useCurrentModelEnvironment(application, map)`. The modal host receives the same props the launcher resolved (D14).

---

## 1. Goals

1. **Paged process Report** — In order to walk a domain process without seeing every field at once, as a report viewer, I can open a `type: "multistep"` Report and see one section at a time with Back, Next or Finish, and Cancel.
2. **Finish runs actions** — In order to apply the process, as a report viewer, I can hit Finish on the last step and have the Report’s `compositeActionSequence` run with the values I entered.
3. **Later steps see earlier values** — In order to filter or load data that depends on what I already typed, as a report viewer, I can go Next and have the Report query rerun with the step bag merged into in-memory `pageParams`.
4. **Launch from a button or a menu** — In order to start the process from the screen I am on, as a report viewer, I can click an `openReportSection` button (modal or route) or a `miroirMenuReportLink`.
5. **Pass the current row** — In order to act on the instance I selected, as a report viewer, I can open a multistep Report from a list row and have that instance’s uuid in `pageParams`.
6. **Author a process as a Report** — In order to add a process to my application without a new meta-model Entity, as a report designer, I can set `type: "multistep"`, list the step sections, and write the Finish sequence.

## 2. Non-goals

- A Form or FormRun Entity (rejected in grilling; later, unscheduled).
- Persisting an unfinished bag (D13; later, unscheduled).
- One undo transaction around the whole walk (rejected with D9/D11; later, unscheduled).
- Conditional / branching steps (later, unscheduled).
- Changing list-Add or Runner submit **outside** multistep Reports.
- Replacing single-page `customRunner.formMLSchema`.
- MLS editor validation owned by #169.
- Putting `step=N` in the URL (D16).
- Embedding a stepper inside a non-multistep page except via `openReportSection` (D2-b deferred).

---

## 3. Current state

### 3.1 Report model (aligned as a screen; misaligned as a process)

Entity Report uuid `3f2baa83-3ef7-45ce-82ea-6a43f7a8c916`. EntityVersion uuid `952d2c65-4da2-45c2-9394-a0920ceedfb6` (`entityUuid` points at the Entity). `RootReport` (`miroirFundamentalType.ts` L3385–3401) has query fields plus `section: ReportSection`. It has **no** `compositeActionSequence`.

`ReportSection` is a union of 14 types (`miroirFundamentalType.ts` L3375): `accordionReportSection`, `graphReportSection`, `grid`, `jsonReportSection`, `inputReportSection`, `list`, `markdownReportSection`, `modelDiagramReportSection`, `objectListReportSection`, `objectInstanceReportSection`, `storedReportDisplay`, `runnerReportSection`, `transformerRunnerReportSection`, `miroirTestReportSection`. Discriminator is `type`. `list` holds `ReportSection[]` (L3221–3229). `grid` holds `ReportSection[][]` (L3376–3383).

`docs/reference/api/reports.md` L71–73 still says “Form Section — Coming Soon.” There is no `form` / `formReportSection` in the union.

### 3.2 Rendering all sections at once (aligned for normal Reports; misaligned for paging)

`ReportSectionViewWithEditor` on `type === "list"` maps every child (L347–363). `type === "grid"` maps every cell (L304–329). There is no step index.

### 3.3 Parameter collection (partially aligned)

`reportSectionsFormValue` for `inputReportSection` writes defaults under `inputPrefix` or `reportSectionPath.join("_") + "_inputMLSchema"` (`ReportTools.ts` L216–250). `ReportInputSection` binds `TypedValueObjectEditor` at that prefix (L97–111) and can push `urlParamFields` to the URL (Apply/OK at L113–122, handler L81–92).

Parent Formik lives in `ReportViewWithEditor` (L434–458). `validateOnChange` and `validateOnBlur` are both `false`.

### 3.4 List Add dialog (aligned as CRUD; not the process)

`ReportSectionListDisplay` opens `JsonObjectEditFormDialog` and on submit calls `createInstance` (L438–474), using `transactionalInstanceAction` when `chosenApplicationSection == "model"`. That persists a **new** row. It does not attach an already-persisted instance. FK pick of an existing instance is `JzodElementEditor` + `foreignKeyParams` (`ThemedSelectWithPortal`).

### 3.5 Object instance nested Formik (misaligned with D5)

`ReportSectionEntityInstance` mounts a **child** Formik (`L605–608`):

```605:608:packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportSectionEntityInstance.tsx
          <Formik
            initialValues={{ [formikValuePathAsString]: displayedInstance }}
            enableReinitialize
            onSubmit={() => {}}
```

`onSubmit` is empty. Edits do not land in the parent Report Formik. `reportSectionsFormValue` for `objectInstanceReportSection` does seed the parent under `reportSectionPath.join("_")` (`ReportTools.ts` L177–215), but the editor does not write back there. **On a multistep Report the instance editor must use the parent Formik** (same path key) and the host step bag. Non-multistep Reports keep the nested Formik so we do not change current instance pages.

### 3.6 Runner as one-page form + sequence (aligned; not a stepper)

Entity Runner uuid `e54d7dc1-4fbc-495e-9ed9-b5cf081b9fbd`. `customRunner` has `formMLSchema` (static Jzod or transformer) and `compositeActionSequence`. `InnerRunnerView` / `RunnerView` render one schema and submit via `handleCompositeAction` (L592–610) or `handleCompositeActionTemplate` (L611–631). Finish on a multistep Report uses the **template** path only (D1). Sequence template type is `CompositeActionSequenceTemplate` (L3857 / L9993). Resolved `CompositeActionSequence` (`miroirFundamentalType.ts` L4555–4566) uses endpoint `1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5`.

A `runnerReportSection` with `runnerReportSectionType: "storedRunner"` renders `StoredRunnerView` (`ReportSectionViewWithEditor.tsx` L530–540). `embeddedRunner` is not implemented there (shows “Unsupported”).

### 3.7 Launch (aligned for route; missing for modal)

`miroirMenuReportLink` (`miroirFundamentalType.ts` L3154–3164): `reportUuid`, `instanceUuid`, `section`, `selfApplication`. App bar navigates with `reportUrl` (`AppBar.tsx` L520–545). `storedReportDisplay` embeds. There is no “open Report in a dialog” section type.

### 3.8 Validation (aligned enough for D7; #169 is separate)

Next/Finish Jzod uses the same resolution path the editors already use (`jzodTypeCheck` / schema on `inputMLSchema` or the instance `mlSchema`). Per-field MLS messages are #169.

---

## 4. Key reuse

| Piece | Location |
|-------|----------|
| Entity Report | uuid `3f2baa83-3ef7-45ce-82ea-6a43f7a8c916` |
| EntityVersion Report | uuid `952d2c65-4da2-45c2-9394-a0920ceedfb6` |
| `RootReport` / `ReportSection` | `miroirFundamentalType.ts` L3385–3426, L3375 |
| `list` / `grid` section render | `ReportSectionViewWithEditor.tsx` L304–363 |
| `inputReportSection` + `inputPrefix` | `ReportTools.ts` L216–250, `ReportInputSection.tsx` |
| Parent Formik / `initialReportSectionsFormValue` | `ReportViewWithEditor.tsx` L245–272, L434–458 |
| Query `pageParams` | `ReportViewWithEditor.tsx` L72–78, L105–138 |
| Extra URL keys already forwarded | `PageDispatcher.tsx` L64–87, `constants.ts` L8–14 |
| List Add + dialog | `ReportSectionListDisplay.tsx` L438–489, `JsonObjectEditFormDialog.tsx` L399 |
| Nested instance Formik | `ReportSectionEntityInstance.tsx` L605–608 |
| Entity Runner / `customRunner` | uuid `e54d7dc1-4fbc-495e-9ed9-b5cf081b9fbd` |
| Sequence execution | `RunnerView.tsx` L611–631, `DomainController.handleCompositeActionTemplate` L4696 |
| `CompositeActionSequenceTemplate` | `miroirFundamentalType.ts` L3857 / L9993 |
| Menu report link | Entity Menu `dde4c883-ae6d-47c3-b6df-26bc6e3c1842`, `AppBar.tsx` L520–545 |
| Dialog shell | `ThemedDialog` in `MUIComponents.tsx` ~L238 |
| `storedReportDisplay` (embed, not button) | `ReportSectionViewWithEditor.tsx` L282–289, L455–470 |
| Freeze copies `report.type` | `applicationVersionFreeze.ts` L226 |
| Seed Reports | 84 instances; 71 omit `type`; 2 `"type": null`; 11 `type: "list"`; 0 `type: "grid"` |

---

## 5. Target behaviour

### 5.1 Discriminator

`report.type === "multistep"` turns the viewer into a pager over `definition.section`:

- `section.type === "list"` → `section.definition[i]` is step `i` (0-based).
- otherwise → one step, the section itself.

`type: "list"`, `type: "grid"`, and omitted `type` keep today’s “show all” render. Zero seed Reports are `type: "grid"`; do not give `grid` a stepper meaning.

### 5.2 Host

A wrapper **above** `ReportViewWithEditor`’s query-failure branch owns the step bag and the step index. It still uses one parent Formik + `ReportSectionViewWithEditor` for **one** `reportSectionPath`. Buttons sit **outside** the section. Finish calls `handleCompositeActionTemplate` with `definition.compositeActionSequence` and **`actionParamValues` = the step bag** (D5). `modelEnvironment` is the viewed page’s application + `applicationDeploymentMap` (D6 environment note). Errors stay on the last step; the bag stays mounted if the step query fails (failure renders in the step body; Back still works).

Modal host: `ThemedDialog` + that wrapper, with full `pageParams` from D14. Route host: `ReportDisplay` → wrapper when `type === "multistep"`. `runStoredQueries` is skipped with a warning (D8).

### 5.3 Query refresh

On Next / Back the wrapper sets query `pageParams` to `{ ...launchPageParams, ...stepBag }` and the existing `useQueryTemplateResults` path reruns (`ReportHooks.ts` L150–176). See D5 for the bag and collision rules.

### 5.4 Launchers

`openReportSection`: page-level button; synthesizes `pageParams` like `storedReportDisplay`. `objectListReportSection.definition.openReport`: tools-column button; adds row PK as `instanceUuid`. Neither collects Finish parameters. Opening a non-multistep Report with `openAs: "modal"` shows the full Report in a dialog; paging applies only if the **target** is multistep.

### 5.5 Schema rebuild

Dual-write Entity + EntityVersion (paths in D2): `type` enum += `"multistep"`; `rootReport.compositeActionSequence` as `CompositeActionSequenceTemplate`; `openReportSection` context + `reportSection` union; `objectListReportSection.definition.openReport`. Then `npm run build -w miroir-test-app_deployment-miroir` and `npm run devBuild -w miroir-core`. `reportSectionsFormSchema` gets a non-throwing `openReportSection` case. Do not rewrite the two postgres `"type": null` Reports in this issue.

---

## 6. Proposals / options

| # | Proposal | Impact | Effort | Verdict |
|---|---|---|---|---|
| 1 | `Report.type: "multistep"` + pager host + inline sequence | High | Medium | **Adopt** |
| 2 | New Form Entity | High | High | **Reject** — duplicates Report + Runner |
| 3 | Extend only `customRunner` with `steps[]` | Medium | Medium | **Reject** — user: no Runner required; step is a Report section |
| 4 | Flag on existing `list` section | High (breakage) | Low | **Reject** — 11 seed `type: "list"` Reports plus every `section.type === "list"` |
| 5 | URL as the only param bus | High in modal | Low | **Reject** — D8 / D16 |

---

## 7. Risks the plan must close

| Risk | Why | Close in |
|---|---|---|
| Raw Formik tree / circular merge | D5; `initialReportSectionsFormValue` L245–272 | Step bag in host state; tests that Finish/`pageParams` omit `reportDefinition` and nested `pageParams` |
| `enableReinitialize` wipes the bag | L434–436 | Bag keys win on reinit; test Next + query refresh keeps step-1 fields |
| Query-failure unmounts Formik | L428–435 | Host above that branch; Back after a failed step query |
| Nested instance Formik | §3.5 | Hoist only when the **viewed** Report is multistep |
| Parent `onSubmit` is authoring | L437–450 | Finish is a separate handler |
| `urlParamFields` navigates the underlying page | `ReportInputSection.tsx` L81–92, L55–70 | Disable / redirect in multistep |
| `runStoredQueries` ignores the bag | `ReportDisplay.tsx` L88–94 | Unsupported on multistep |
| `reportSectionsFormSchema` throws | `ReportTools.ts` L104–113 | `openReportSection` → `{}` |
| `Report.type` unused today | §3.1 | Host must read it; freeze already copies it |
| D9 writes before Finish | List Add / Runner | Document on the Report; tests must not assume Finish is the only write |
| `embeddedRunner` unsupported | L541–546 | A step that needs a Runner uses `storedRunner` |
| Per-row launch is not a section | `EntityInstanceGrid` | `openReport` on the list section |

---

## Next step

Implementation proceeds per [`./tdd-implementation-plan.md`](./tdd-implementation-plan.md) (vertical TDD slices, `miroir-analysis-to-tdd-plan` skill).
