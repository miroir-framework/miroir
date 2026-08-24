# Issue #246 — TDD Implementation Plan

> Vertical TDD slices (RED → GREEN each), **integration-first** per `docs/contributing/testing.md`:
> **Primary validation scaffold:** `listDisplayByTransformer.integ.test.tsx` — full app-stack rig
> (`getWrapperLoadingLocalCache`, `MiroirContextReactProvider`, `ReportPageContextProvider`, real
> `EntityInstanceGrid`, real `TypedValueObjectEditor`, real transformer runtime). Supplementary
> **unit** suites (`listDisplayByTransformer.unit.test.ts`, `ListTransformerPanel.unit.test.tsx`)
> keep fast helper contracts and wiring checks with targeted mocks where the full stack is redundant.
> No MiroirTest — pure view-layer feature, not ML-reachable.
>
> **Execution model:** human-in-the-loop. No slice contains a commit step — commits happen
> only when the user explicitly asks. Each slice ends with its Validation commands; on
> success its Realization summary is appended and its Status flips to ✅ DONE.

Analysis: [`./analysis.md`](./analysis.md) · Issue: https://github.com/miroir-framework/miroir/issues/246
Working branch: `master`

**Resume note:** plan written 2026-08-23 — all slices ✅ (integ scaffold added 2026-08-23).

---

## Scope

In scope:

- `listDisplayByTransformer.ts` view-layer helper module (`buildRowMapListTransformer`, `applyTransformerToListRows`) with unit tests;
- `ListTransformerPanel.tsx` component (toggle-owned panel: own Formik, transformer input, derived result, read-only display) with component tests;
- `ReportSectionListDisplay.tsx` wiring: transformer toggle in the list header row, panel mounted below the grid when enabled;
- loop-safety locks: panel state survives report Formik reinit; panel never writes into the report Formik bag;
- docs: `docs/internals/report-display.md` updated with the new Formik-owning panel.

This plan does **not** persist the entered transformer into the report definition, implement the `transformerRunnerReportSection` stub, add a list-level transformer mode (D2-b), entity-grid result display (D4-c), SQL/Postgres execution of the panel transformer, or schema-derived result typing (all deferred per analysis §2 — no owning issue yet).

---

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Characterize list header & mapList-on-object-input | ✅ | phase0 lock + helper suite first GREEN |
| 1 | Tracer: toggle + panel + identity-transformed second list | ✅ | `ListTransformerPanel` + `listDisplayByTransformer` suites |
| 2 | Editing the transformer updates the result; failure inline | ✅ | component + helper suites |
| 3 | Loop-safety locks (reinit survival, no report-bag pollution) | ✅ | integ suite loop-safety block |
| 4 | Nonreg, docs, cleanup, AC | ✅ | nonreg steps + docs + AC table |

---

## Locked implementation defaults

Carried from the analysis decision record (confirmed 2026-08-23); binding for this plan. Deviations go into the slice's Realization.

| Decision | Choice |
|---|---|
| D1 — Who can enable the interface | **Any user, anytime** — toggle button on the list section header; not gated on edit mode |
| D2 — Transformer granularity | **Element-level (row → any)** — panel wraps the user transformer in the existing `mapList` built-in (`referenceToOuterObject: "row"`) |
| D3 — State ownership | **Panel-owned Formik + `useState` toggle** — no report-bag pollution, no wipe on report Formik reinit; list data flows in as props (nearest-Formik shadowing makes `useFormikContext` unusable inside the panel) |
| D4 — Result display | **Read-only schema-driven value editor** — `TransformationResultValueEditor` pattern: read-only `TypedValueObjectEditorWithFormik`, `{type:"any"}` fallback schema, `TransformerFailure` surfaced inline |
| Default transformer | `{ interpolation: "runtime", transformerType: "getFromContext", referenceName: "row" }` (identity row projection) |
| Coverage | **Integ scaffold** (`listDisplayByTransformer.integ.test.tsx`) + helper unit + wiring unit; no MiroirTest — pure view-layer feature, not ML-reachable |
| Meta-model | **No schema change** — no new model elements, no migration |

---

## Allocated UUIDs / keys

No new model elements (D-record: no meta-model change). Keys are vitest suite names only.

| Artefact | Value |
|---|---|
| Helper module | `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/listDisplayByTransformer.ts` |
| Panel component | `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ListTransformerPanel.tsx` |
| Helper suite (permanent, runtime contracts) | `packages/miroir-standalone-app/tests/4_view/listDisplayByTransformer.unit.test.ts` |
| **Integration scaffold (primary gate, Slices 1–4)** | `packages/miroir-standalone-app/tests/4_view/listDisplayByTransformer.integ.test.tsx` |
| Integ rig helper | `packages/miroir-standalone-app/tests/4_view/helpers/listTransformerIntegRig.tsx` |
| Wiring unit suite (supplementary) | `packages/miroir-standalone-app/tests/4_view/ListTransformerPanel.unit.test.tsx` |
| Slice 0 transitional lock | ~~deleted in Slice 4~~ |
| Nonreg steps | `integ-listDisplayByTransformer` + `unit-listDisplayByTransformer` in `scripts/nonreg-manifest.json` |

Reused existing uuids (no allocation needed): `mapList` TransformerDefinition `3ec73049-5e54-40aa-bc86-4c4906d00baa`; transformer input schema reference target `fe9b7d99-f216-44de-bb6e-60e1a1ebb739` → `coreTransformerForBuildPlusRuntime`.

---

## Public interface under test (new)

```typescript
// packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/listDisplayByTransformer.ts

/**
 * Wrap an element-level transformer into the mapList built-in applied per row.
 * Each row is exposed to the element transformer under `referenceName`.
 */
export function buildRowMapListTransformer(
  elementTransformer: CoreTransformerForBuildPlusRuntime,
  referenceName?: string, // default "row"
): CoreTransformerForBuildPlusRuntime;

/**
 * Apply an element-level transformer to every row of a list section payload.
 * Accepts both array and uuid-indexed object shapes (mapList handles both natively).
 * Runs the real runtime: transformer_extended_apply_wrapper + defaultMiroirModelEnvironment,
 * same call pattern as TransformerEditor.tsx:492-502.
 */
export function applyTransformerToListRows(
  instancesToDisplay: any[] | Record<string, any>,
  elementTransformer: CoreTransformerForBuildPlusRuntime,
  transformerParams?: Record<string, any>, // default {}
): TransformerReturnType<any>; // Success<transformed rows> | TransformerFailure
```

Component seam: `ListTransformerPanel` (props: `instancesToDisplay`, `deploymentUuid`, `applicationUuid`, `applicationDeploymentMap`, section path for labeling) and the toggle button rendered by `ReportSectionListDisplay` in the list header row (`ReportSectionListDisplay.tsx:685-711`).

---

## Test execution conventions

| Purpose | Command |
|---|---|
| **Integration scaffold (primary gate, Slices 1–4)** | `npm run testByFile -w miroir-standalone-app -- listDisplayByTransformer.integ` |
| Helper + phase0 suites | `npm run testByFile -w miroir-standalone-app -- listDisplayByTransformer` |
| Wiring unit suite (supplementary) | `npm run testByFile -w miroir-standalone-app -- ListTransformerPanel` |
| Slice 0 transitional lock | `npm run testByFile -w miroir-standalone-app -- listDisplayByTransformer.246.phase0` |
| Type check | `npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json` |
| Full safety net (Slice 4) | `npm run nonreg` |

No schema rebuild step anywhere in this plan: no asset under `miroir-test-app_deployment-miroir` is touched.

---

## Slice 0 — Characterize list header & mapList-on-object-input

**Status:** ✅ DONE

### Goal

Lock the two contracts later slices depend on: (a) the current list-section header renders title + add button and **no** transformer affordance; (b) the real runtime applies `mapList` to a **uuid-indexed object** of instances (the exact `instancesToDisplay` shape) yielding per-element results — the primitive the panel is built on.

### 0.1 RED → GREEN — characterization locks

**Test (a), transitional:** `tests/4_view/issues/246-list-display-by-transformer/listDisplayByTransformer.246.phase0.unit.test.tsx`

Behavior asserted (current state, passes on arrival — characterization, not new behavior):
- `ReportSectionListDisplay` rendered with a preloaded store (Library deployment, `entityBook` + `book1…` assets, rig per `TransformerEditor.test.tsx:59-98`) shows the section title and the add button, and no transformer toggle.

**Test (b), permanent:** `tests/4_view/listDisplayByTransformer.unit.test.ts` (first `it`)

Behavior asserted:
- `transformer_extended_apply_wrapper(undefined, "runtime", ["rootTransformer"], "mapList-lock", <mapList with elementTransformer = getFromContext row>, "value", defaultMiroirModelEnvironment, {}, <uuid-indexed book object as input>)` returns `TransformerSuccess` whose value maps each book uuid to the book itself (identity projection). Expected values come from the imported real assets (`book1`, …), not recomputed.

### Validation

```bash
npm run testByFile -w miroir-standalone-app -- listDisplayByTransformer.246.phase0
npm run testByFile -w miroir-standalone-app -- listDisplayByTransformer
```

### Realization

- Added phase0 lock: `listDisplayByTransformer.246.phase0.unit.test.tsx` — renders `ReportSectionListDisplay` with Library `reportBookList` + Formik bag (`books` index with `book1`), preloaded redux store (TransformerEditor-style), and targeted mocks (`EntityInstanceGrid`, `JsonObjectEditFormDialog`, `JsonDisplayHelper`) to avoid pulling `miroir-diagram-class` / svg-toolbelt and to keep the test focused on the header row.
- Added permanent helper-suite first test: `listDisplayByTransformer.unit.test.ts` — calls `transformer_extended_apply_wrapper` with `mapList` + identity `getFromContext row` on a uuid-indexed `{ book1, book2 }` input wrapped under `defaultTransformerInput` in `contextResults` (required by `resolveApplyTo_legacy` when `applyTo` is absent).
- **Deviation from plan wording:** runtime returns an **array** of row values (identity books), not a uuid-keyed object — consistent with `transformerForBuild_list_listMapperToList_apply` implementation; assertion uses `arrayContaining([book1, book2])`.
- Both validation commands green (2026-08-23).

---

## Slice 1 — Tracer: toggle + panel + identity-transformed second list

**Status:** ✅ DONE

### Goal

A user viewing any `objectListReportSection` can click a transformer toggle in the list header and sees — below the unchanged grid — a panel whose result region shows each row passed through the default identity transformer.

**Layers cut:** view only (helper module → panel component → `ReportSectionListDisplay` wiring). No asset/schema/domain change.

### 1.1 RED

**Test:** helper suite `listDisplayByTransformer.unit.test.ts` + component suite `ListTransformerPanel.unit.test.tsx`

Behavior asserted (helper):
- `buildRowMapListTransformer(identityRow)` returns `{ transformerType: "mapList", referenceToOuterObject: "row", elementTransformer: identityRow }` (shape locked against the real `mapList` parameter schema).
- `applyTransformerToListRows(bookIndex, identityRow)` → `TransformerSuccess` mapping each uuid to its book (real Library assets as expected values).

Behavior asserted (component, rig per `TransformerEditor.test.tsx` — preloaded real store, `LocalCacheProvider`, theme):
- List section renders a transformer toggle in the header row; panel absent by default.
- Clicking the toggle mounts the panel **below** the grid; the grid is still rendered (non-destructive, AC2).
- The panel result region shows the identity-transformed rows (book names/uuids visible) without any user input (default transformer pre-filled).

### 1.2 GREEN

- Create `listDisplayByTransformer.ts` per the public interface above (call pattern copied from `TransformerEditor.tsx:492-502`: `undefined` activity tracker, `"runtime"` step, `"value"` resolution, `defaultMiroirModelEnvironment`).
- Create `ListTransformerPanel.tsx`: own Formik (`TypedValueObjectEditorWithFormik` pattern, `enableReinitialize`, `validateOnChange/Blur: false` per `TransformerEditor.tsx:275`); transformer input field schema = `{ type: "schemaReference", definition: { absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739", relativePath: "coreTransformerForBuildPlusRuntime" } }`; initial value = default identity transformer; result computed in a `useMemo` from (panel Formik values, `instancesToDisplay` prop); result rendered via the `TransformationResultValueEditor` pattern (read-only `TypedValueObjectEditorWithFormik`, `{type:"any"}` fallback schema, `maxRenderDepth={3}`, no-op submit).
- Wire in `ReportSectionListDisplay.tsx`: `useState` toggle (default off) + icon button in the header row (685-711); when on, render `ListTransformerPanel` below `EntityInstanceGrid`, passing `instancesToDisplay` and deployment/application props **down as props** (panel Formik shadows `useFormikContext` — D3).

### 1.3 Refactor checkpoint

- Extract the toggle + panel mount so `ReportSectionListDisplay`'s render stays flat (early returns, no deep nesting — AGENTS.md).
- If the transformer-input schema fragment is now duplicated a 4th time (TransformerEditor has 3 copies), extract a shared constant in the panel module and note the TransformerEditor duplication as follow-up (do not refactor TransformerEditor in this slice).

### Validation

```bash
npm run testByFile -w miroir-standalone-app -- listDisplayByTransformer
npm run testByFile -w miroir-standalone-app -- ListTransformerPanel
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
```

### Realization

- Added `listDisplayByTransformer.ts`: `DEFAULT_ROW_IDENTITY_TRANSFORMER`, `buildRowMapListTransformer`, `applyTransformerToListRows` (runtime call pattern from `TransformerEditor.tsx`; list input wrapped under `defaultTransformerInput` in `contextResults`).
- Added `ListTransformerPanel.tsx`: panel-owned Formik, `TypedValueObjectEditor` for transformer input (`coreTransformerForBuildPlusRuntimeSchemaReference`), derived result via `applyTransformerToListRows` + read-only `TypedValueObjectEditorWithFormik`; exported shared schema ref constant.
- Added `ListSectionTransformerControls.tsx`: `ListTransformerToggle` (functions icon, primary/secondary variant).
- Wired `ReportSectionListDisplay.tsx`: `transformerPanelEnabled` state, toggle in header row, `ListTransformerPanel` below `EntityInstanceGrid` when enabled.
- Helper suite extended (4 tests); component suite `ListTransformerPanel.unit.test.tsx` (2 tests) via `ReportSectionListDisplay` rig — mocks `EntityInstanceGrid`, `TypedValueObjectEditor` / `TypedValueObjectEditorWithFormik` (avoids full `ReportPageContextProvider` stack); toggle queried by role (`Functions icon`).
- Phase0 lock updated: still asserts title + add button (no longer asserts absence of toggle).
- **Deviations:** `applyTransformerToListRows` returns an array (same as Slice 0 mapList note); `ThemedButton` does not forward `data-testid`/`type` — omitted; standalone-app `tsc` still reports pre-existing errors in unrelated files (`RootComponent`, `ReportSectionEntityInstance`, …) — no new errors in slice 1 files.
- Validation green (2026-08-23): `listDisplayByTransformer` (4 tests), `ListTransformerPanel` (2 tests).

---

## Slice 2 — Editing the transformer updates the result; failure inline

**Status:** ✅ DONE

### Goal

A user can edit the transformer in the panel and immediately sees the second list re-computed; an invalid/failing transformer is surfaced inline, not crashed.

**Layers cut:** view only (panel result derivation + failure display; helper non-identity coverage).

### 2.1 RED

**Test:** helper suite + component suite

Behavior asserted (helper):
- `applyTransformerToListRows(bookIndex, { interpolation: "runtime", transformerType: "returnValue", value: 42 })` → `TransformerSuccess` mapping every row to `42` (expected value is a known literal).
- A failing element transformer (e.g. accessing a missing attribute with a strict access transformer) → `TransformerFailure`, not a throw.

Behavior asserted (component):
- With the panel enabled, replacing the default transformer by a `returnValue` constant in the transformer input updates the result region to show that constant for each row — without any submit (derived `useMemo`, AC3).
- A failing transformer renders the failure inline (the `ThemedOnScreenHelper` pattern from `TransformationResultPanel.tsx:122-125`); the original grid remains rendered and interactive.

### 2.2 GREEN

- Minimal: the Slice 1 `useMemo` should already recompute on panel Formik value change — this slice proves it and adds the `TransformerFailure` branch to the panel's result region if missing.
- No debounce (AGENTS.md anti-pattern): recompute is synchronous and cheap at list-section scale.

### 2.3 Refactor checkpoint

- If result-region rendering (success editor + failure helper) grows past a screenful, extract `ListTransformerResult` subcomponent inside the panel file — deepen the panel module rather than widening its props.

### Validation

```bash
npm run testByFile -w miroir-standalone-app -- listDisplayByTransformer
npm run testByFile -w miroir-standalone-app -- ListTransformerPanel
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
```

### Realization

- Added `getListTransformationFailure()` in `listDisplayByTransformer.ts` — detects top-level or per-row failures in mapList array results (`TransformerFailure` / `queryFailure`).
- Updated `ListTransformerPanel.tsx` to use it: failure → `ThemedOnScreenHelper`; success editor hidden when any row failed.
- Helper suite: `returnValue` → `[42, 42]`; missing-context row transformer → array of `TransformerFailure` (no throw).
- Component suite: interactive `TypedValueObjectEditor` mock (`set-return-value-42`, `set-failing-transformer` buttons via panel Formik); `ThemedOnScreenHelper` mock for failure assertion.
- Slice 1 `useMemo` recomputation was sufficient for edit path — no debounce, no submit.
- Validation green (2026-08-23): `listDisplayByTransformer` (6 unit tests), `ListTransformerPanel` (4 wiring tests); integ scaffold added afterward (see Slice 3 / integ block).

---

## Slice 3 — Loop-safety locks (reinit survival, no report-bag pollution)

**Status:** ✅ DONE

### Goal

Lock the two feedback-loop guarantees from `docs/internals/report-display.md` that D3-a was chosen for: a report Formik reinitialization (query refresh) does not wipe an in-progress transformer, and the panel never writes into the report Formik bag (submit payload stays clean).

**Layers cut:** view only (component tests around a simulated report Formik; fixes only if a lock fails).

### 3.1 RED

**Test:** integ suite `listDisplayByTransformer.integ.test.tsx` (loop-safety block)

Behavior asserted:
- Render the list section inside a parent Formik mimicking RVWE (`enableReinitialize`, bag keyed like a report section). Enable the panel, edit the transformer to a non-default value, then re-render the parent with a **new `initialValues` reference** (simulated `reportData` refresh): the panel still holds the edited transformer and the result region still shows it.
- After all panel interactions, the parent Formik bag contains **no** transformer-input key (assert `Object.keys` of parent values unchanged) and `lastSubmitButtonClicked` is unset — the panel owns its bag entirely.
- Toggling the panel off unmounts it and leaves the grid and parent bag untouched.

### 3.2 GREEN

- Expected to pass by construction (panel-owned Formik + `useState` toggle, D3-a). If the reinit lock fails, the likely cause is the panel reading list data via `useFormikContext` instead of props — fix by threading props, per D3.

### 3.3 Refactor checkpoint

- If the test rig's parent-Formik harness is reusable for future report-section tests, extract it next to the suite as a shared render helper (name it after the behavior, e.g. `renderListSectionWithReportFormik`); otherwise keep it local to the suite.

### Validation

```bash
npm run testByFile -w miroir-standalone-app -- listDisplayByTransformer.integ
npm run testByFile -w miroir-standalone-app -- listDisplayByTransformer
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
```

### Realization

- Added `tests/4_view/helpers/listTransformerIntegRig.tsx` — shared rig: `getWrapperLoadingLocalCache`, `MemoryRouter`, `SeedLibraryDeploymentMapping` (mirrors `RootComponent` entity/report mapping), `MiroirThemeProvider`.
- Added `listDisplayByTransformer.integ.test.tsx` (6 tests): full-stack list section (toggle, real grid, identity result), real `TypedValueObjectEditor` edit + failure, loop-safety (reinit keeps `returnValue` selection; parent bag keys unchanged).
- Passed by construction (panel-owned Formik + toggle); no production fixes required.
- Toggle-off unmount lock deferred to integ follow-up (Slice 4 cleanup) — not blocking AC.
- Validation green (2026-08-23): integ (6 tests).

---

## Slice 4 — Nonreg, docs, cleanup, AC

**Status:** ✅ DONE

### 4.1 Nonreg

- Add steps `integ-listDisplayByTransformer` (tier `integ` or `unit` per manifest convention, argv `listDisplayByTransformer.integ`) and `unit-listDisplayByTransformer` (argv `listDisplayByTransformer`, excludes integ by filename) to `scripts/nonreg-manifest.json`.

### 4.2 Docs

- `analysis.md` status → implemented; progress table above all ✅.
- `docs/internals/report-display.md`: add the panel to the "Formik: how many" table (list transformer panel owns a new small Formik, `TypedValueObjectEditorWithFormik` pattern — the second sanctioned in-section Formik besides the dialog exception) and to the key-files table; one line in the dataflow section noting the panel reads list data via props, not context.
- `docs/contributing/testing.md` / `docs/reference/testing.md`: note the new permanent suite names only if those docs enumerate suites (check first; otherwise skip).

### 4.3 Issue-directory cleanup

- Delete `tests/4_view/issues/246-list-display-by-transformer/` (the phase0 lock is superseded by the Slice 1 component assertions: "panel absent by default" is now locked by the permanent suite). Per `docs/contributing/testing.md` (#238 rule).

### 4.4 Tracer bullet (narrative)

1. Start server + Vite client; open the Library application, Entities → Book list report.
2. In the Book list section header, click the transformer toggle.
3. The grid stays as-is; below it a panel shows the default identity transformer and a read-only result listing each book.
4. Replace the transformer with `{ interpolation: "runtime", transformerType: "returnValue", value: "hello" }` → the result region immediately shows `hello` per row.
5. Refresh the page data (re-run the report query) with the panel open and an edited transformer → the edited transformer survives.
6. Toggle off → panel gone, grid untouched.

Automated equivalent: `listDisplayByTransformer.integ.test.tsx` (primary) + `listDisplayByTransformer.unit.test.ts` (runtime contracts) + supplementary `ListTransformerPanel.unit.test.tsx` (wiring).

### AC checklist (#246)

| Criterion | Proven by | Status |
|---|---|---|
| Enable/disable a transformer-seizing interface on any list section (any user, normal mode) | integ: toggle + panel mount/unmount | ✅ |
| When enabled, the original list section is still displayed unchanged | integ: grid + book row visible with panel open; failure path keeps grid | ✅ |
| A second list below shows each row transformed by the given transformer | integ identity result + unit `applyTransformerToListRows` | ✅ |
| Ephemeral, loop-safe panel (no report-bag pollution, survives query refresh) | integ loop-safety block | ✅ |

### Realization

- Nonreg: `integ-listDisplayByTransformer` + `unit-listDisplayByTransformer` in `scripts/nonreg-manifest.json`.
- Docs: `analysis.md` → implemented; `report-display.md` — Formik table row, objectList feedback row, key-files entries for panel/helpers.
- Deleted `tests/4_view/issues/246-list-display-by-transformer/` (phase0 lock superseded by integ).
- Integ: added toggle-off unmount test (tracer step 6).
- `docs/contributing/testing.md` unchanged (no suite catalogue section).
- Validation green (2026-08-23): integ (7 tests), `listDisplayByTransformer.unit` (6 tests), `ListTransformerPanel` (4 tests).
