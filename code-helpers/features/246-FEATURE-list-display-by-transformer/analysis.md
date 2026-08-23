# 246 — List display by Transformer: per-row transformed view on report list sections

> Analysis: let any user enable a transformer-input panel on any `objectListReportSection`.
> When enabled, the original list stays unchanged and a second list below shows each row
> transformed by the user-entered (element-level) transformer.

Related issue: https://github.com/miroir-framework/miroir/issues/246
Related docs: [`docs/internals/report-display.md`](../../../docs/internals/report-display.md) (Formik cardinality, dataflow, and feedback-loop rules this feature must respect)

Key sources:
- [`packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportSectionListDisplay.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportSectionListDisplay.tsx)
- [`packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportSectionViewWithEditor.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportSectionViewWithEditor.tsx)
- [`packages/miroir-standalone-app/src/miroir-fwk/4_view/components/TransformerEditor/TransformerEditor.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/TransformerEditor/TransformerEditor.tsx)
- [`packages/miroir-standalone-app/src/miroir-fwk/4_view/components/TransformerEditor/TransformationResultPanel.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/TransformerEditor/TransformationResultPanel.tsx)
- [`packages/miroir-core/src/2_domain/TransformersForRuntime.ts`](../../../packages/miroir-core/src/2_domain/TransformersForRuntime.ts)

**Document role:** analysis and architectural decision record.
**Status:** decisions confirmed (2026-08-23).

---

## Decision record

| Decision | Choice |
|---|---|
| D1 — Who can enable the interface | **Any user, anytime** — toggle button on the list section header; read-only exploration affordance, like the Transformer Builder page |
| D2 — Transformer granularity | **Element-level (row → any)** — the view wraps the user transformer in the existing `mapList` built-in |
| D3 — State ownership | **Panel-owned Formik + local toggle state** — no report-bag pollution, no wipe on Formik reinit |
| D4 — Result display | **Read-only schema-driven value editor** — the `TransformationResultPanel` pattern (read-only TVOE+Formik, `{type:"any"}` fallback schema) |

**Rationale:** the feature is an ad-hoc inspection tool, not report authoring — hence available outside edit mode (D1) and ephemeral state (D3). Element-level mapping matches the issue wording ("each row element … is transformed by the given transformer") and reuses `mapList` verbatim (D2). Arbitrary transformer output rules out an entity grid; the Transformer Editor already proves the read-only TVOE display on `{type:"any"}` (D4).

### D1 — Availability of the toggle

**Status:** Accepted — any user, anytime (D1-a).

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D1-a. Always available** ★ | Icon toggle in the list header row (next to the add button, `ReportSectionListDisplay.tsx:685-711`) | Zero schema change; useful for support / debugging on live data | One more button on every list |
| D1-b. Edit mode only | Render toggle only when `generalEditMode` is on | Cleaner UI for end users | Feature invisible exactly when exploring data casually; edit mode is for authoring, this is inspection |
| D1-c. Schema-driven | New optional field on `objectListReportSection` (e.g. `definition.transformerView: true`) | Report author controls it per section | Meta-model change + migration for a pure UI affordance; cannot be enabled ad-hoc |

**Decision:** D1-a. D1-c may be revisited later (unscheduled) to let a report definition default-enable the panel with a pre-filled transformer.

### D2 — Transformer granularity

**Status:** Accepted — element-level wrapped in `mapList` (D2-a).

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D2-a. Element-level** ★ | Panel wraps input as `{ transformerType: "mapList", referenceToOuterObject: "row", elementTransformer: <user transformer> }` | Matches the issue; user writes a simple row→value transformer; `mapList` exists and also accepts object (uuid-indexed) inputs | Cannot filter/sort the list |
| D2-b. List-level | User transformer applied directly to the whole list | Allows filtering / sorting / aggregation | User must handle list shape; harder; diverges from "each row is transformed" |
| D2-c. Both via mode selector | Toggle between D2-a and D2-b | Full power | Two code paths and two mental models for a v1 inspection tool |

**Decision:** D2-a. D2-b/c deferred (unscheduled); the panel's wrapping point makes a later list-level mode additive.

### D3 — State ownership (toggle + entered transformer)

**Status:** Accepted — panel-owned Formik + `useState` toggle (D3-a).

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D3-a. Panel-owned Formik** ★ | Panel creates its own small Formik (the `TypedValueObjectEditorWithFormik` pattern); toggle is component `useState`; list data flows in as props read from the report Formik *above* the panel | Follows the "one Formik per RVWE" cardinality rule and the "clearly own a new bag" checkpoint of `docs/internals/report-display.md`; report Formik reinit (query refresh) does not wipe an in-progress transformer; transformer key never leaks into the report submit payload | Panel cannot use `useFormikContext` for report data (nearest-Formik shadowing) — must receive list data via props |
| D3-b. Report Formik bag | Generated key per section path (e.g. `<sectionPath>_transformerInput`) | Single bag; no new Formik | `enableReinitialize` wipes the input on every `reportData` refresh; key pollutes `onSubmit` payload; violates the doc's cardinality guidance |
| D3-c. `toolsPageState` session persistence | Like `TransformerEditor` (debounced session state) | Survives navigation | Global-state coupling and debounce plumbing for an ephemeral panel; overkill |

**Decision:** D3-a.

### D4 — Transformed-list display

**Status:** Accepted — read-only schema-driven value editor (D4-a).

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D4-a. Read-only TVOE** ★ | Reuse the `TransformationResultValueEditor` pattern (`TransformationResultPanel.tsx:38-66`): read-only `TypedValueObjectEditorWithFormik`, schema = `{type:"any"}` fallback, result under one Formik key | Handles arbitrary transformer output; folding/depth control for free; consistent with Transformer Builder UX | Not a table |
| D4-b. Plain JSON dump | `<pre>{JSON.stringify(...)}</pre>`, like `jsonReportSection` | Simplest | No folding, no schema help, poor for large rows |
| D4-c. Entity grid when possible | `EntityInstanceGrid` if output matches an entity schema, else fallback | Best table UX for entity-shaped output | Output shape is arbitrary by construction; two render paths; most code |

**Decision:** D4-a. D4-c may be revisited if a common "project to entity columns" usage emerges (unscheduled).

---

## 1. Goals

1. **Per-section toggle** — every `objectListReportSection` header offers an enable/disable transformer toggle, available in normal (non-edit) mode.
2. **Non-destructive** — when enabled, the original list section renders exactly as today; the transformed view is additive, below it.
3. **Element-level transformation** — each row of the displayed list is transformed by the user-entered transformer via the existing `mapList` built-in.
4. **Ephemeral and loop-safe** — panel state is local (own Formik + `useState`); nothing writes into the report Formik bag or shared contexts; result computation is derived (`useMemo`), per the feedback rules in `docs/internals/report-display.md`.
5. **Reuse over rebuild** — transformer input schema, runtime primitive, and result display all reuse existing pieces (§4).

## 2. Non-goals

- Persisting the entered transformer into the report definition (later, unscheduled; may converge with implementing the `transformerRunnerReportSection` stub).
- List-level transformer mode (filter / sort / aggregate the whole list) — deferred alternative D2-b.
- Entity-grid display of transformed rows — rejected alternative D4-c.
- SQL / Postgres execution of the panel transformer — in-memory runtime only (`transformer_extended_apply_wrapper`).
- Schema-derived result typing from the transformer's declared output schema — v1 uses the `{type:"any"}` fallback.
- Editing the original list from the transformed view (the result display is read-only).

---

## 3. Current state

### 3.1 List sections: model and rendering (**aligned baseline — no transformer affordance**)

`objectListReportSection` is one of the 14 `ReportSection` union members (`accordionReportSection`, `graphReportSection`, `grid`, `jsonReportSection`, `inputReportSection`, `list`, `markdownReportSection`, `modelDiagramReportSection`, `objectListReportSection`, `objectInstanceReportSection`, `storedReportDisplay`, `runnerReportSection`, `transformerRunnerReportSection`, `miroirTestReportSection`). Schema source: Report EntityVersion `952d2c65-4da2-45c2-9394-a0920ceedfb6` (Report entity uuid `3f2baa83-3ef7-45ce-82ea-6a43f7a8c916`) at [`packages/miroir-test-app_deployment-miroir/assets/miroir_modelVersion/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/952d2c65-4da2-45c2-9394-a0920ceedfb6.json`](../../../packages/miroir-test-app_deployment-miroir/assets/miroir_modelVersion/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/952d2c65-4da2-45c2-9394-a0920ceedfb6.json), context path `definition.definition.context.objectListReportSection`. Full field set: `label?`, `parentName?`, `parentUuid` (uuid, FK to Entity `16dbfe28-e1d7-4f20-9ba4-c1a9873202ad`), `fetchedDataReference?`, `query?` (`extractorReturningObject`), `sortByAttribute?`, `sortOrder?` (`"asc" | "desc"`, default `"desc"`). **No transformer-related field exists on any list section type.**

Rendering chain (per `docs/internals/report-display.md`): `ReportSectionViewWithEditor.tsx:416-437` dispatches `objectListReportSection` → `ReportSectionListDisplay`, which reads `instancesToDisplay` from the report Formik bag (`fetchedDataReference` key, lines 152-165) and renders `EntityInstanceGrid`. The list header row (title + add button) sits at `ReportSectionListDisplay.tsx:685-711` — the natural toggle placement.

### 3.2 Transformer input UI precedent (**aligned, reusable**)

`TransformerEditor.tsx` (Transformer Builder page) already implements a transformer-input form:

- Own Formik (`enableReinitialize`, `validateOnChange/Blur: false`, line 275) — the panel-owned Formik precedent for D3-a.
- Transformer field schema = `{ type: "schemaReference", definition: { absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739", relativePath: "coreTransformerForBuildPlusRuntime" } }` (lines 557-563, also 613-619, 675-681) — the exact schema fragment to reuse for the panel input.
- Execution is derived, not effect-driven: `transformationResult` computed in a `useMemo` (lines 484-503) via `transformer_extended_apply_wrapper` — the loop-safe pattern required by §goal 4.
- Session persistence into `toolsPageState.transformerEditor` exists there but is explicitly **not** reused (rejected D3-c).

Result display precedent: `TransformationResultValueEditor` ([`TransformationResultPanel.tsx:38-66`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/TransformerEditor/TransformationResultPanel.tsx)) wraps the result as `{ transformationResult }` and renders a **read-only** `TypedValueObjectEditorWithFormik` with schema `transformationResultSchema ?? { type: "any" }`, `maxRenderDepth={3}`, no-op `onSubmit`. `TransformerFailure` results are shown via `ThemedOnScreenHelper` (lines 122-125). This is the D4-a mechanism, verbatim.

### 3.3 Runtime primitive: `mapList` (**aligned, reusable**)

`mapList` TransformerDefinition — uuid `3ec73049-5e54-40aa-bc86-4c4906d00baa`, parent entity TransformerDefinition `a557419d-a288-4fb8-8a1e-971c86c113b8`, at [`packages/miroir-test-app_deployment-miroir/assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/3ec73049-5e54-40aa-bc86-4c4906d00baa.json`](../../../packages/miroir-test-app_deployment-miroir/assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/3ec73049-5e54-40aa-bc86-4c4906d00baa.json). Parameters: `applyTo?` (the list), `referenceToOuterObject?` (name under which each element is exposed), `elementTransformer` (schemaReference to `transformer`). Implementation: `libraryImplementation`, in-memory fn `transformerForBuild_list_listMapperToList_apply` ([`TransformersForRuntime.ts:1302`](../../../packages/miroir-core/src/2_domain/TransformersForRuntime.ts)), registered in the runtime map at line 799.

The handler resolves `applyTo` (via `resolveApplyTo_legacy`; when absent, the transformer input is used), then applies `elementTransformer` to each element with the element exposed as `contextResults[referenceToOuterObject ?? defaultTransformerInput]` (lines 1332-1349). It also accepts **object inputs** (uuid-indexed instance maps, lines 1353-1371) — which is exactly the `EntityInstancesUuidIndex` shape `ReportSectionListDisplay` holds. So both array and uuid-indexed list payloads work without normalization.

Generic application entry point: `transformer_extended_apply_wrapper` ([`TransformersForRuntime.ts:4013`](../../../packages/miroir-core/src/2_domain/TransformersForRuntime.ts)) — already used in the report view layer by `ReportSectionViewWithEditor.tsx:152` (modelDiagram entities) and `:205` (storedReportDisplay params), both with `formik.values` as params/context.

### 3.4 Adjacent stub: `transformerRunnerReportSection` (**misaligned — out of scope**)

The model carries a `transformerRunnerReportSection` type (with a `storedTransformer` variant and an `embeddedTransformer` variant holding an inline `definition: CoreTransformerForBuildPlusRuntime`), but its view [`Reports/TransformerRunner.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/TransformerRunner.tsx) (34 lines) renders only "Unsupported …" messages; `ReportSectionViewWithEditor.tsx:498-529` dispatches to it. This stub is a **report-authoring** feature (definition-driven, persisted), whereas #246 is a **runtime inspection** affordance (ephemeral, per-session). The two may converge later (a saved panel state could become an `embeddedTransformer` section) — explicitly a non-goal here.

---

## 4. Key reuse

| Piece | Location |
|-------|----------|
| `mapList` TransformerDefinition | uuid `3ec73049-5e54-40aa-bc86-4c4906d00baa`, `miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/` |
| `transformerForBuild_list_listMapperToList_apply` (array + object input) | `miroir-core/src/2_domain/TransformersForRuntime.ts:1302` |
| `transformer_extended_apply_wrapper` | `miroir-core/src/2_domain/TransformersForRuntime.ts:4013` |
| Transformer input schema fragment (`schemaReference` → `coreTransformerForBuildPlusRuntime`) | `TransformerEditor.tsx:557-563` |
| Panel-owned Formik pattern | `TypedValueObjectEditorWithFormik.tsx`; `TransformerEditor.tsx:275` |
| Read-only result display pattern | `TransformationResultPanel.tsx:38-66` (`TransformationResultValueEditor`) |
| Toggle placement (list header row) | `ReportSectionListDisplay.tsx:685-711` |
| List data source (`instancesToDisplay` from report Formik) | `ReportSectionListDisplay.tsx:152-165` |
| Formik cardinality / feedback-loop rules | `docs/internals/report-display.md` |

## 5. Target design (confirmed)

Per-section, additive UI inside `ReportSectionListDisplay` (no meta-model change):

1. **Toggle** — icon button in the list header row; `useState`, default off; always rendered (D1-a).
2. **Panel (when enabled)** — below the grid: a transformer input form with its **own Formik** (D3-a), whose transformer field reuses the `coreTransformerForBuildPlusRuntime` schema-reference fragment. The panel receives `instancesToDisplay` (and deployment/application props) **as props**, read from the report Formik one level above — the panel's inner Formik would shadow `useFormikContext`, so prop-passing is mandatory, not stylistic.
3. **Computation** — derived `useMemo`: wrap the entered transformer as `{ transformerType: "mapList", referenceToOuterObject: "row", elementTransformer: <input> }` and apply with `transformer_extended_apply_wrapper` to the prop list (array or uuid-indexed object both accepted). Default input value: `{ transformerType: "getFromContext", referenceName: "row" }` (identity row projection), so enabling the panel immediately shows a recognizable result.
4. **Result** — read-only `TypedValueObjectEditorWithFormik` over the transformed list, `{type:"any"}` fallback schema, `TransformerFailure` surfaced inline (D4-a).
5. **Loop safety** — own Formik bag; no writes into the report bag; no new contexts; result is memo-derived from (panel Formik values, prop list). Satisfies every checkpoint of `docs/internals/report-display.md` by construction.

## 6. Proposals / options

| # | Proposal | Impact | Effort | Verdict |
|---|----------|--------|--------|---------|
| 1 | Inline panel in `ReportSectionListDisplay` per §5 | high | medium | **adopt** |
| 2 | Implement `transformerRunnerReportSection` stub instead | medium | medium | defer — authoring feature, not ad-hoc inspection (§3.4) |
| 3 | Extend `objectListReportSection` schema with a persisted transformer view | medium | high (meta-model + migration) | defer — candidate follow-up to save panel state |

---

## Next step

Implementation proceeds per [`./tdd-implementation-plan.md`](./tdd-implementation-plan.md) (written 2026-08-23, following the `miroir-analysis-to-tdd-plan` skill).
