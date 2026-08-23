# Report display: Formik, dataflow, and feedback (internal)

Internal reference for refactoring the report UI from `ReportViewWithEditor` downward. Companion product docs: [designing reports](../guides/developer/designing-reports.md), [reports API](../reference/api/reports.md). Historical loop analysis: [infinite-refresh-loop-analysis.md](<../../code-helpers/features/157-FEATURE- harden startup sequence & enable admin deployment choice on client - server/infinite-refresh-loop-analysis.md>).

**Scope:** how one report page builds form state, how children read/write it, when schema typechecking runs, and how update cycles are kept finite. Not a catalog of every report section type.

---

## Glossary

| Shortcut / term | Meaning |
|---|---|
| **Formik** | React form library. One `<Formik>` = one form bag (`values`, `setFieldValue`, `submitForm`). Children use `useFormikContext()`. |
| **initialValues** | Object Formik starts from. With `enableReinitialize={true}`, a new object reference resets the bag. |
| **RVWE** | `ReportViewWithEditor` — owns the report Formik and loads report data. |
| **RSVWE** | `ReportSectionViewWithEditor` — picks a leaf renderer from the section type. |
| **TVOE** | `TypedValueObjectEditor` — schema-driven instance editor; expects an existing Formik above it. |
| **TVOE+Formik** | `TypedValueObjectEditorWithFormik` — wraps TVOE in its own Formik. Used outside the report tree (e.g. transformer panels), not by RVWE. |
| **typecheck / `jzodTypeCheck`** | Resolves the Jzod schema against the current value; yields `resolvedSchema` + `keyMap` (per-path metadata for editors). |
| **typeCheckKeyMap** | Map from field path → schema metadata. In the report editor path it is **computed and passed as props**, not written back into Formik. |
| **onChangeVector** | Optional map of `rootLessListKey` → callback. Fired by field editors alongside the Formik write, so a parent can react (e.g. navigate) without owning every keystroke. |
| **rootLessListKey** | A field's path inside the edited value object (e.g. `application`, `definition.section`). Used to key `onChangeVector` and field-validation errors. |
| **fetchedDataReference** | Name of a key in Formik/`reportData` that a section displays (list or instance). |
| **formik path string** | Underscore-joined path (e.g. `definition_section`). Dot paths are avoided: Formik treats dots as nesting. |
| **lastSubmitButtonClicked** | Formik key set by the submit button so RVWE’s `onSubmit` knows which object in the bag to persist. |

---

## Component stack (one report page)

```
RootComponent                 # provides DocumentOutline + ReportPage contexts (sidebar tree, fold state)
  → ReportPage                # route wrapper: syncs URL params into Miroir context
    → PageContainer           # layout only (flex box, theme) — no state, no providers
      → ReportDisplay         # resolve Report def + optional stored queries
        → ReportViewWithEditor # query report data, build initialValues, create Formik
          → [generalEditMode only] InlineReportEditor
          → ReportSectionViewWithEditor   # recursive for list/grid/accordion
            → leaf: EntityInstance | ListDisplay | Input | Markdown | …
                  → TypedValueObjectEditor → JzodElementEditor → …
```

`ReportDisplay` has **no** Formik. It only chooses the report, runs `runStoredQueries`, and passes props into RVWE. Besides `ReportPage`, `ReportDisplay` is also mounted by `HomePage` and `SettingsPage` — the stack above is the canonical "one report page" case.

Nested `storedReportDisplay` sections mount another `ReportDisplay` → another RVWE → **another** Formik subtree (see recursion guard below).

---

## Formik: how many, who creates them

### Rule of thumb

**One Formik per `ReportViewWithEditor` mount.** All sections of that report share that bag. There is not one Formik per section or per field.

| Situation | Formik count |
|---|---|
| Normal report page | **1** (created in RVWE) |
| Report embeds another via `storedReportDisplay` | **1 + 1 per nested RVWE** (separate trees) |
| List “add/edit” dialog (`JsonObjectEditFormDialog`) | **0 extra** — reuses the parent report Formik (`useFormikContext`); injects its draft into the shared bag via `setValues` (see “The dialog exception” below) |
| TVOE inside a report section | **0 extra** — consumes parent Formik |
| TVOE+Formik (transformer UI, app selector, …) | Separate Formik; **out of report-display scope** |

Creation site in RVWE:

- `enableReinitialize={true}` — when `initialReportSectionsFormValue` gets a new reference, Formik resets.
- `validateOnChange={false}`, `validateOnBlur={false}` — Formik’s built-in validators do not run on every edit (schema work is done by `jzodTypeCheck` instead).

### What lives in the bag

Built by `reportSectionsFormValue` + spreads in RVWE’s `initialReportSectionsFormValue`:

1. **Per editable section** — key = section path joined with `_`, value = instance or list payload from `reportData[fetchedDataReference]`.
2. **Report definition** — key = report name, value = the `Report` object (so RSVWE can read section defs from Formik).
3. **Inline edit helper** — `reportReportDetails` under `reportReportDetailsKey`, for general-edit-mode report editing.
4. **Query results / stored query data / pageParams** — spread into the same object so sections and transformers can read them as Formik values.
5. **Input sections** — defaults under `inputPrefix` (or a generated key).
6. **Query-entity test params** — `editedQueryParameterValue` when the instance is a Query.

Cardinality of *values* therefore scales with section tree shape; cardinality of *Formik instances* stays “one per RVWE”.

---

## Dataflow

### Downward (props + selectors → Formik → children)

1. **ReportDisplay** reads URL params, looks up the `Report`, runs optional stored queries → `storedQueryData`.
2. **RVWE** builds a boxed query from the report definition, selects `reportData` from the local cache, optionally kicks async load (`useEnsureReportQueryLoaded`), then materializes `initialReportSectionsFormValue`.
3. **RSVWE** does not receive the section definition as a prop of truth. It reads `formik.values[formikReportDefinitionPathString]` and `resolvePathOnObject(…, reportSectionPath)`, then switches on `section.type`.
4. Leaf components read their payload from Formik (`formik.values[formikValuePathAsString]` or via `fetchedDataReference`).

Layout sections (`list`, `grid`, `accordion`) recurse into RSVWE with a longer `reportSectionPath`. Display-only sections (graph, model diagram, markdown content, JSON dump, …) mostly **read**; they do not define a second form.

### Upward (edits → Formik → persistence or navigation)

| Leaf | Can update Formik? | How feedback leaves the UI |
|---|---|---|
| **objectInstance** (TVOE) | Yes — field editors call `formik.setFieldValue` | Explicit submit → RVWE `onSubmit` → `domainController` create/update (path selected via `lastSubmitButtonClicked`) |
| **objectList** | Add/edit dialog injects its draft into the parent Formik (`setValues` at a fixed key) and edits it there; grid itself is mostly navigation (inline cell edits are not wired to persistence) | Create/update: the dialog’s inner TVOE submit goes through the **shared report Formik submit** (`lastSubmitButtonClicked` → injected draft key). Delete: separate `JsonObjectDeleteFormDialog` → direct `deleteCascade` domain action, bypasses Formik |
| **inputReportSection** | Yes — TVOE with no submit button | Optional `onChangeVector` (e.g. `application` → `navigate` to same report under another app) |
| **Query instance** (params editor) | Yes — `editedQueryParameterValue` | Changing params re-runs the in-page query selector (derived from Formik), no domain write until the Query instance itself is submitted |
| **markdown** | Reads the report definition from Formik; edited content lives in modal-local state | `MarkdownEditorModal` save = direct domain action (`transactionalInstanceAction` → `updateInstance` of the Report instance), then local state update. **Not** the Formik submit path. Caveat: content path is hard-coded (`definition.section.definition.0…`, marked TODO) |
| **graph / diagram / test / runner / …** | Little or none on the report Formik | Own controls or nested Formiks outside this doc’s main path |

**Capacity summary:** children can freely mutate the shared Formik bag. They cannot push arbitrary React state “up” into ReportDisplay. Persistence is **submit-gated** (instance sections and list add/edit dialogs, both via the one RVWE `onSubmit`) or **direct-domain-action-gated** (list row delete, markdown save). Soft feedback (outline title, fold state, field validation messages) uses dedicated contexts, not Formik.

### The dialog exception: wholesale `setValues`

Field edits write one path at a time (`setFieldValue`). The list add/edit dialog is the one place that **replaces the whole bag**: on open, `JsonObjectEditFormDialog` runs an effect keyed on the draft object that calls `formik.setValues({ ...formik.values, ["definition_section_definition_0"]: draft, formikReportDefinitionPath: defaultDetailsReport })`. It then renders a `ReportSectionViewWithEditor` subtree inside the dialog pointed at that injected key/report. Submitting inside the dialog sets `lastSubmitButtonClicked = "definition_section_definition_0"` (+ `_mode` = `create`/`update`) and triggers the normal RVWE `onSubmit`, which persists exactly that injected object and closes the dialog via `setAddObjectdialogFormIsOpen(false)`. Note: the dialog’s own `onSubmit` / `onCreateFormObject` props are currently passed but never invoked (dead code) — persistence really goes through the shared Formik submit.

Contexts around the tree (provided above ReportDisplay):

- **Document outline** — sidebar tree; `setReportInstance` / title (guarded).
- **Report page** — folded attribute tree for editors.
- **FieldValidation** — per-TVOE provider aggregating field-level validation errors for submit gating.

---

## Feedback loops and how recursion is avoided

Several cycles *could* exist. The code breaks them as follows.

### 1. Formik reinit ↔ outline context

`enableReinitialize` + new `reportData` reference → new Formik `values` → new `instance` reference → effect that called `setReportInstance` used to refresh the outline forever.

**Guard (ReportSectionEntityInstance):** only call `setReportInstance` when the instance **uuid** changes (`useRef` of previous uuid). Same logical instance, new object reference → no outline update → no extra cascade.

### 2. Nested reports

`storedReportDisplay` mounts another `ReportDisplay`. Displaying the report-details report on itself would nest forever.

**Guard (RSVWE):** if parameters point at `reportReportDetails` editing itself, render an error message instead of nesting.

### 3. Typecheck ↔ Formik

Typecheck runs in a `useMemo` inside TVOE whenever `valueObject` / `formik.values` / schema / model / cache deps change. Editors need `keyMap` to render unions, FKs, labels.

**Loop break:** typecheck output is **derived and passed down as props**. It is not written into Formik values. (Outline still exposes `setTypeCheckKeyMap`, but the live TVOE path no longer pushes typecheck results into that context on every memo change — that push was a known refresh amplifier.)

So the intended cycle is one-way:

```
user edits → setFieldValue → Formik values change → re-render → jzodTypeCheck → richer editor props
```

not

```
typecheck → setState on shared context → re-render → typecheck …
```

### 4. Field validation context

`useFieldValidation` memos a transformer result, then a `useEffect` registers the error string in `FieldValidationContext`. That affects **submit enablement** only. It does not rewrite Formik values, so it does not re-trigger typecheck by itself. The provider (`FieldValidationProvider`, one per TVOE) keeps the error map in a **ref** and only bumps a version counter when the error *set* actually changes — so per-keystroke field registration does not re-render the editor tree.

### 5. Formik validation flags

With `validateOnChange` / `validateOnBlur` off, typing does not invoke Formik’s validate pipeline. Re-renders come from `setFieldValue`, not from Formik validation thrashing.

### 6. Input `onChangeVector` → navigation

Changing `application` in an input section navigates away. That remounts the page with new params — a deliberate hard reset, not an in-tree loop.

### 7. Async report load

`useEnsureReportQueryLoaded` kicks the server-side load from an effect keyed by the request **fingerprint** (a stable string computed by the service), not by request object identity — otherwise every render would produce a fresh request object and re-trigger the load forever (this was one of the #157 loop sources). Render only observes the status (`loading` / `error` / `idle`); the loaded data arrives through the normal local-cache → selector → `reportData` channel.

### Practical rule for future changes

- Prefer **derived data** (`useMemo` from Formik values) over **mirroring** Formik into React state or global context.
- If you must sync Formik → context, key the effect on a **stable identity** (uuid, serialized path), not object reference.
- Never feed typecheck results back into Formik `values` or into a context that is also a dependency of the typecheck memo.

---

## Typecheck: when, why, and interplay with feedback

### When it runs

On TVOE render, inside `useMemo`, when any of these change: current model / model environment (incl. the fundamental Jzod schema), deployment, `formik.values`, `valueObject`, `formValueMLSchema`, the Formik path string, zoom flags, and the redux deployment state (also used for FK resolution).

It does **not** run on a timer. It is not Formik’s `validate`. It runs as often as those deps churn — typically once per meaningful edit that updates Formik.

### Why it is necessary

Without a successful typecheck, TVOE cannot hand `JzodElementEditor` a reliable `typeCheckKeyMap` / resolved schema. That map drives:

- which editor variant to show (union branch, object fields, …),
- foreign-key target entity queries,
- field-level `formValidation` transformers,
- error display when resolution fails (TVOE shows a type-error panel instead of a silent broken tree).

Submit buttons also require form-level + field-level validity (`isFormAndFieldsValid`).

### Interplay with user feedback

1. User changes a field → `setFieldValue` (and optional `onChangeVector`).
2. Formik updates → TVOE re-renders → typecheck recomputes for that value object.
3. New `keyMap` flows into editors as props; field validation memos may update; submit may enable/disable.
4. Nothing in steps 2–3 writes a new “source of truth” into Formik except the user’s own field writes.

Known cost / TODO in code: each TVOE typechecks only its own `valueObject` subtree, but the memo depends on the **whole** `formik.values` — so one field edit re-runs the typecheck of *every* TVOE on the page (the code carries a `TODO: typecheck only the value for the currently edited instance`). Worth remembering when optimizing, but not a correctness loop: the output feeds only props.

---

## Refactoring checkpoints

When changing this area, verify:

1. **Formik cardinality** — still one Formik per RVWE unless you intentionally nest reports; dialogs should keep sharing or clearly own a new bag.
2. **Path keys** — underscore paths; do not introduce dotted Formik keys for section paths.
3. **Reinitialize** — if you stabilize `initialValues` references, document how edits survive query refreshes (today reinit can wipe in-progress params; see feature notes on `editedQueryParameterValue`).
4. **Outline / fold / typecheck** — no new “write derived schema into context that feeds the same memo”.
5. **Nested ReportDisplay** — keep the self-embedding guard for report-details.
6. **Submit identity** — `lastSubmitButtonClicked` (+ `_mode`) remains how one bag with many editable objects knows what to persist — including the list dialog’s injected draft at `definition_section_definition_0`.
7. **Dialog draft injection** — the `setValues` wholesale write must stay keyed on a stable draft identity; if the dialog ever gets its own Formik, remove the injection effect and the dead `onSubmit`/`onCreateFormObject` props together.
8. **Bypasses to track** — markdown save and list row delete go straight to the domain controller; if you route them through Formik later, update the feedback table above.

---

## Key files

All under `packages/miroir-standalone-app/src/miroir-fwk/4_view/`:

| File | Role |
|---|---|
| `components/Page/RootComponent.tsx` | Mounts `DocumentOutlineContextProvider` + `ReportPageContextProvider` |
| `routes/ReportPage.tsx` | Route wrapper; syncs URL params into context |
| `routes/ReportDisplay.tsx` | Report lookup + stored queries → RVWE |
| `components/Reports/ReportViewWithEditor.tsx` | Query load, `initialValues`, **creates Formik**, submit → domain |
| `components/Reports/ReportHooks.ts` | `useQueryTemplateResults` / `useStoredQueriesResults` (local-cache selectors) |
| `components/Reports/useEnsureReportQueryLoaded.ts` | Fingerprint-keyed async load effect |
| `components/Reports/ReportTools.ts` | `reportSectionsFormValue` / schema helpers |
| `components/Reports/ReportSectionViewWithEditor.tsx` | Section-type switch; nested `ReportDisplay` guard |
| `components/Reports/ReportSectionEntityInstance.tsx` | Instance leaf; outline uuid guard; query-param editor |
| `components/Reports/ReportSectionListDisplay.tsx` | Grid + add dialog wiring; delete → direct domain action |
| `components/Grids/EntityInstanceGrid.tsx` | Row edit/delete → opens dialogs |
| `components/JsonObjectEditFormDialog.tsx` | Add/edit dialog; injects draft into shared Formik |
| `components/Reports/ReportSectionMarkdown.tsx` + `MarkdownEditorModal.tsx` | Markdown leaf; save = direct domain action |
| `components/Reports/ReportInputSection.tsx` | Input leaf + `onChangeVector` navigation |
| `components/Reports/TypedValueObjectEditor.tsx` | Typecheck + TVOE; consumes Formik |
| `components/Reports/TypedValueObjectEditorWithFormik.tsx` | Standalone Formik wrapper (non-report) |
| `components/ValueObjectEditor/JzodElementEditor*.tsx` | Field writes via `setFieldValue`; `onChangeVector` fan-out |
| `components/ValueObjectEditor/FieldValidationContext.tsx` | Aggregate field errors for submit (ref + version counter) |
| `components/ValueObjectEditor/InstanceEditorOutlineContext.tsx` | Outline + unused-in-hot-path typeCheckKeyMap state |
