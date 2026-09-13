# 274 — Multi-step Reports (paged sections + CompositeActionSequence on Finish)

> How to let any application declare a paged process as a Report: one section visible at a
> time, Back / Next / Finish / Cancel, parameters collected in Formik, an inline
> `compositeActionSequence` on Finish. No Form entity. A Runner is not required.

Related issue: https://github.com/miroir-framework/miroir/issues/274
Related: [#169](https://github.com/miroir-framework/miroir/issues/169) MLS form validation (not a prerequisite)
Key sources: [`Report.ts` types](../../../packages/miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.ts), [`ReportViewWithEditor.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportViewWithEditor.tsx), [`ReportSectionViewWithEditor.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportSectionViewWithEditor.tsx), [`ReportTools.ts`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportTools.ts), [`RunnerView.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Runners/RunnerView.tsx), [`DomainController.ts`](../../../packages/miroir-core/src/3_controllers/DomainController.ts)

**Document role:** analysis and architectural decision record.
**Status:** decisions confirmed with the user (design grilling, 2026-09-12/13). Implementation proceeds per [`./tdd-implementation-plan.md`](./tdd-implementation-plan.md) once that file exists.

---

## Decision record

Confirmed with the user. Defaults accepted where a pick was offered.

| ID | Decision | Choice |
|---|---|---|
| D1 | What Finish commits | **Domain process:** collect parameters, then run `compositeActionSequence`. A Runner is not required. |
| D2 | Reification | **`Report.type: "multistep"`**. No Form entity. |
| D3 | What a step is | **Any `ReportSection`**. A `list` step still shows all of its children on that page. |
| D4 | Schema home for the sequence | **Inline on `RootReport`** as `compositeActionSequence` (same shape as `customRunner`). |
| D5 | Finish payload | **The Report Formik tree.** Templates keep using `getFromParameters`. |
| D6 | Modal vs route | **The launcher chooses.** The Report definition does not. |
| D7 | Next gating | **Jzod on the current `inputReportSection` / `objectInstanceReportSection`.** Other types always allow Next. Finish validates every such step. |
| D8 | Later-step queries | **On Next, merge Formik into in-memory `pageParams` / `queryParams`.** No URL write. |
| D9 | Mid-step writes | **No special treatment.** List Add and Runner submit persist immediately. |
| D10 | Back | **Keep Formik. Rerun the Report query** with the merged params. |
| D11 | Cancel / dismiss | **Confirm, then drop the bag.** Do not undo D9 writes. |
| D12 | Finish placement | **Last step only.** |
| D13 | Unfinished run | **Memory only.** No FormRun entity. |
| D14 | In-page launcher | **New section type `openReportSection`:** label, `reportUuid`, `openAs: "modal" \| "route"`. |
| D15 | After Finish succeeds | **Close the modal, or leave the route.** |
| D16 | Step in the URL | **No.** Refresh restarts at step 1 with an empty bag. |
| D17 | List-row context | **Pass the row `instanceUuid` plus the caller’s `pageParams`** into the opened Report. |

**Rationale:** reuse the Report section tree and the existing composite-action runner. Discriminate paging with `Report.type` so the 11 existing `type: "list"` Reports (and the 73 with no `type`) keep showing every section. Do not invent a second form stack beside `customRunner`.

### D1 — what Finish commits

**Status:** Accepted — domain process; Runner optional.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| D1-a. Instance wizard | Paged `createInstance` / `updateInstance` only | Matches list-Add dialog | A second concept beside actions; “process” does not fit |
| D1-b. Object-graph assembler | Several instances, one transaction | Clean commit | Needs a transaction wrap we rejected (D11) |
| **D1-c. Domain process** ★ | Formik bag → `compositeActionSequence` | Same engine as `customRunner`; create/update are actions in the sequence | Author must write the sequence |

**Decision:** D1-c. User correction: the bag is **not** “the Runner payload.” Finish calls `DomainController.handleCompositeAction` / `handleCompositeActionTemplate` the same way [`RunnerView.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Runners/RunnerView.tsx) does at the `compositeActionSequence` / `compositeActionTemplate` branches (around L593–613). A `runnerReportSection` on a step is an ordinary section (D9).

### D2 / D4 — how a multistep Report is stored

**Status:** Accepted — `Report.type: "multistep"` + `RootReport.compositeActionSequence`.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D2-a. `Report.type` += `"multistep"`** ★ | If `section` is `list`, each child is a step; if leaf, one step | Matches “special kind of Report”; existing `type: "list"` Reports unchanged | `Report.type` is unused for rendering today; the host must start reading it |
| D2-b. New `multistepReportSection` | Root section holds `steps` + sequence | Nestable later | Extra section type for a Report-level idea |
| D2-c. Flag on `list` | `display: "stepper"` | Small | Easy to break current list Reports |

**Decision:** D2-a. `compositeActionSequence` is optional on `RootReport` and **required for runtime Finish** when `type === "multistep"`. A multistep Report without a sequence is authoring-incomplete: Finish is disabled and the host surfaces that. Dual-write the enum on Entity Report `3f2baa83-…` (authoritative present model, #217) **and** EntityVersion `952d2c65-…`.

`Report.type` today is optional `enum ["list","grid"]` on both assets (`mlSchema.definition.type`, Entity L57–62, EntityVersion L56–61) and on generated `Report` / `ReportVersion` (`miroirFundamentalType.ts` L3423, L2848). Inventory of seed Reports with `parentUuid === 3f2baa83-3ef7-45ce-82ea-6a43f7a8c916`: **84** instances, **73** omit `type`, **11** have `type: "list"`, **0** have `type: "grid"`. The only runtime copy of `report.type` found is freeze (`applicationVersionFreeze.ts` L226). Rendering keys off **`section.type`**, not `Report.type` (`ReportSectionViewWithEditor.tsx` L304 `grid`, L347 `list`).

### D5 — Finish parameter tree

**Status:** Accepted — whole Report Formik value.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D5-a. Whole Formik tree** ★ | Sequence `getFromParameters` reads `inputPrefix` keys and hoisted object-instance keys | Matches Q5; object-instance steps stay useful | Must hoist nested Formik (see §3.5) |
| D5-b. Only `inputReportSection` buckets | Merge prefixes | Smaller | Drops object-instance edits |
| D5-c. Declared parameter object | Extra mapping on the Report | Explicit | Duplicates Formik |
| D5-d. URL `pageParams` only | Search string | Already forwarded (#267 D8) | Modal has no useful URL; we rejected URL for step values (D8, D16) |

**Decision:** D5-a. Binding language is the existing `getFromParameters` / `referencePath` used by Runner templates (`RunnerView.tsx` L344–347 uses `[storedRunner.name]`).

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

**Misalignment the host must fix.** Parent Formik is created with `enableReinitialize={true}` and `initialValues={initialReportSectionsFormValue}` (`ReportViewWithEditor.tsx` L434–436). `initialReportSectionsFormValue` rebuilds from `reportData` (L245–268). If Next reruns the query and `reportData` changes, Formik will reset and drop earlier steps. Multistep host rules:

1. Keep collected `inputPrefix` / hoisted object-instance keys across query refreshes.
2. Allow `reportData` keys used by list / instance *display* to update.
3. Do not use the parent Formik `onSubmit` for Finish. That `onSubmit` calls `onEditValueObjectFormSubmit` (L437–450) — report **authoring**, not the process.

### D9 — mid-step persist

**Status:** Accepted — no special treatment.

`ReportSectionListDisplay.onCreateFormObject` (L438–474) already `createInstance` (model section wraps `transactionalInstanceAction`). `StoredRunnerView` on `runnerReportSection` (`ReportSectionViewWithEditor.tsx` L530–540) still submits through `RunnerView`. A step that must not write until Finish uses `inputReportSection` or `objectInstanceReportSection`.

### D14 — in-page launcher

**Status:** Accepted — new `openReportSection`.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D14-a. New section** ★ | Button: `label`, `reportUuid`, `openAs` | Authors place it on any Report | Another `reportSection` union member |
| D14-b. Extend `miroirMenuReportLink` | `openAs` on the menu item | Menu can modal | No in-page button |
| D14-c. TypeScript only | Call sites | Fast v1 | Not applicative |

**Decision:** D14-a. `storedReportDisplay` **embeds** a Report (`ReportSectionViewWithEditor.tsx` L455–470). It is not a button and must stay that. Menu `miroirMenuReportLink` keeps calling `navigate(reportUrl(...))` (`AppBar.tsx` L520–545). Point it at a multistep Report; the route host pages.

`openAs: "modal"` wraps the same `ReportDisplay` / report viewer in `ThemedDialog` (already used by `JsonObjectEditFormDialog.tsx`). `openAs: "route"` uses `reportUrl`. From a list row the launcher sets `pageParams.instanceUuid` to that row plus the caller’s other `pageParams` (D17).

### D6, D11, D12, D13, D15, D16

Accepted as in the summary table. Host chrome: Back, Next or Finish, Cancel, label from `section.label`. `generalEditMode` on the **process** view shows all steps stacked so the designer can edit the tree; the pager is the viewer path.

---

## 1. Goals

1. **Paged process Report** — In order to walk a domain process without seeing every field at once, as a report viewer, I can open a `type: "multistep"` Report and see one section at a time with Back, Next or Finish, and Cancel.
2. **Finish runs actions** — In order to apply the process, as a report viewer, I can hit Finish on the last step and have the Report’s `compositeActionSequence` run with the values I entered.
3. **Later steps see earlier values** — In order to filter or load data that depends on what I already typed, as a report viewer, I can go Next and have the Report query rerun with those values in `pageParams`.
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

`reportSectionsFormValue` for `inputReportSection` writes defaults under `inputPrefix` or `reportSectionPath.join("_") + "_inputMLSchema"` (`ReportTools.ts` L216–249). `ReportInputSection` binds `TypedValueObjectEditor` at that prefix (L97–111) and can push `urlParamFields` to the URL (L81–93).

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

`onSubmit` is empty. Edits do not land in the parent Report Formik. `reportSectionsFormValue` for `objectInstanceReportSection` does seed the parent under `reportSectionPath.join("_")` (`ReportTools.ts` L177–214), but the editor does not write back there. **On a multistep Report the instance editor must use the parent Formik** (same path key). Non-multistep Reports keep the nested Formik so we do not change current instance pages.

### 3.6 Runner as one-page form + sequence (aligned; not a stepper)

Entity Runner uuid `e54d7dc1-4fbc-495e-9ed9-b5cf081b9fbd`. `customRunner` has `formMLSchema` (static Jzod or transformer) and `compositeActionSequence`. `InnerRunnerView` / `RunnerView` render one schema and submit via `handleCompositeAction` / `handleCompositeActionTemplate`. `DomainController.handleCompositeAction` starts at L3598; `handleCompositeActionInternal` walks `payload.actionSequence` (L3621+). Sequence type (`miroirFundamentalType.ts` L4555–4566) uses endpoint `1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5`.

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
| `inputReportSection` + `inputPrefix` | `ReportTools.ts` L216–249, `ReportInputSection.tsx` |
| Parent Formik | `ReportViewWithEditor.tsx` L434–458 |
| Query `pageParams` | `ReportViewWithEditor.tsx` L72–78, L105–138 |
| Extra URL keys already forwarded | `PageDispatcher.tsx` L64–87, `constants.ts` L8–14 |
| List Add + dialog | `ReportSectionListDisplay.tsx` L438–474, `JsonObjectEditFormDialog.tsx` L399 |
| Nested instance Formik | `ReportSectionEntityInstance.tsx` L605–608 |
| Entity Runner / `customRunner` | uuid `e54d7dc1-4fbc-495e-9ed9-b5cf081b9fbd` |
| Sequence execution | `RunnerView.tsx` ~L593–613, `DomainController.handleCompositeAction` L3598 |
| `CompositeActionSequence` | `miroirFundamentalType.ts` L4555–4566, endpoint `1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5` |
| Menu report link | Entity Menu `dde4c883-ae6d-47c3-b6df-26bc6e3c1842`, `AppBar.tsx` L520–545 |
| Dialog shell | `ThemedDialog` via `JsonObjectEditFormDialog.tsx` |
| `storedReportDisplay` (embed, not button) | `ReportSectionViewWithEditor.tsx` L455–470 |
| Freeze copies `report.type` | `applicationVersionFreeze.ts` L226 |
| Seed Reports | 84 instances; 73 no `type`; 11 `type: "list"`; 0 `type: "grid"` |

---

## 5. Target behaviour

### 5.1 Discriminator

`report.type === "multistep"` turns the viewer into a pager over `definition.section`:

- `section.type === "list"` → `section.definition[i]` is step `i` (0-based).
- otherwise → one step, the section itself.

`type: "list"`, `type: "grid"`, and omitted `type` keep today’s “show all” render. Zero seed Reports are `type: "grid"`; do not give `grid` a stepper meaning.

### 5.2 Host

A thin viewer wrapper around the existing report Formik + `ReportSectionViewWithEditor` for **one** `reportSectionPath`. Buttons sit **outside** the section. Finish calls `handleCompositeActionTemplate` with `definition.compositeActionSequence` and the current Formik tree as transformer / parameter context (same pattern as `RunnerView`). Errors stay on the last step.

Modal host: `ThemedDialog` + that wrapper. Route host: existing `ReportDisplay` → `ReportViewWithEditor` when `type === "multistep"`.

### 5.3 Query refresh

On Next / Back the wrapper rebuilds `reportDataQueryBase.pageParams` as `{ ...launchPageParams, ...formikValues }` (exact merge documented in the TDD plan; `inputPrefix` objects must be reachable by `getFromParameters`). Then the existing `useQueryTemplateResults` path reruns. Formik persistence rules are D8.

### 5.4 `openReportSection`

New union member. Renderer: a button. Does not collect Finish parameters. Opening a non-multistep Report with `openAs: "modal"` is allowed (full Report in a dialog); paging applies only if the **target** is multistep.

### 5.5 Schema rebuild

Present-model Entity Report + EntityVersion Report + fundamental `report` / `rootReport` / `reportSection` context in `getMiroirFundamentalJzodSchema` / generated files. Then `npm run build -w miroir-test-app_deployment-miroir` and `npm run devBuild -w miroir-core`.

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
| `enableReinitialize` wipes the bag | §3 + D8 | Host merge rules; test that Next + query refresh keeps step-1 fields |
| Nested instance Formik | §3.5 | Hoist only when the **viewed** Report is multistep |
| Parent `onSubmit` is authoring | L437–450 | Finish is a separate handler |
| `Report.type` unused today | §3.1 | Host must read it; freeze already copies it |
| D9 writes before Finish | List Add / Runner | Document on the Report; tests must not assume Finish is the only write |
| `embeddedRunner` unsupported | L541–546 | A step that needs a Runner uses `storedRunner` |

---

## Next step

Implementation proceeds per [`./tdd-implementation-plan.md`](./tdd-implementation-plan.md) (vertical TDD slices, `miroir-analysis-to-tdd-plan` skill).
