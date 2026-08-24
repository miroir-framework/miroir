---
title: "List report section sizing (internals)"
docKind: reference
---

# List report section sizing — internals

**Abstract.** List report sections (`objectListReportSection` in a *Report* definition) render through
`ReportSectionListDisplay` → `EntityInstanceGrid` / `ValueObjectGrid` → ag-grid **or** glide-data-grid.
Since issue **#247** (decision **D2-d**), every list grid runs in exactly one of two **mutually exclusive
sizing modes**:

- **Paged mode** (`pageSize` set, or default 50) — the grid pages; its height *exactly fits the current
  page's rows*; **no in-grid vertical scrollbar, no height cap**; Prev/Next controls are available.
- **Scroll mode** (`maxRows` set) — **no paging**; the full (sorted/filtered) row set is bound; the grid
  height fits `maxRows` rows (with the theme `maxHeight` as an outer pixel cap) and scrolls internally.

This document is the reference for how the parameters interact per mode and per backend, what the current
asymmetries are, and which failure patterns have been seen when changing this logic. Audience: framework
contributors touching `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Grids/`.

---

## 1. The two modes at a glance

| | **Paged mode** | **Scroll mode** |
|---|---|---|
| Selected by | `pageSize={n}` (or neither prop — default 50) | `maxRows={n}` (only) |
| Pager | Yes (ag-grid: native; Glide: `GridPaginationToolbar`) | No |
| Rows bound | current page slice | full sorted/filtered set |
| Height | exact fit of current page rows, **uncapped** | `min(maxRows, total)` rows, capped by theme `maxHeight` |
| In-grid scrollbar | never (outer page scrolls instead) | yes, when total > `maxRows` |
| Last short page / filter shrink | grid shrinks (both backends) | n/a (height follows total, capped) |

Mode resolution lives in `resolveGridSizingMode(pageSize?, maxRows?)` in
`src/miroir-fwk/4_view/components/Grids/gridPagination.ts`. The **XOR contract** is encoded in the
prop schemas themselves: `tableComponentCorePropsSchema` and `valueObjectGridPropsSchema` are each a
**union of three variants** — paged (`pageSize: positive int`, `maxRows: never`), scroll
(`maxRows: positive int`, `pageSize: never`), and default (both `never`) — composed via `.merge` from
the shared `gridPagedSizingPropsSchema` / `gridScrollSizingPropsSchema` / `gridDefaultSizingPropsSchema`
building blocks in `gridPagination.ts`. Each variant carries an optional `sizing` discriminator literal
(`"paged"` / `"scroll"` / `"default"`); when present it must be consistent with the sizing prop. Passing
*both* props therefore fails schema validation, and the
one sizing prop that is present must be a positive integer. The union-of-variants encoding (rather than
an object-level `.refine`) keeps the prop schemas as ZodObjects, so `.extend` consumers survive (the
entity / JSON_ARRAY schemas extend each variant and re-union). `gridSizingModePropsSchema` re-exports
the same three variants as a cheap standalone validation surface. The resolver is defensively
paged-first if both are set anyway.

---

## 2. Parameter inventory

| Parameter | Type / source | Current role (post-D2-d) |
|---|---|---|
| `pageSize` | grid prop (`EntityInstanceGrid`, `ValueObjectGrid`, `GlideDataGridComponent`) | **Paged mode** selector + rows per page. Default `50`. |
| `maxRows` | grid prop | **Scroll mode** selector + visible-row cap for the height estimate. No default activation: when neither prop is set, mode is paged-50. |
| `theme.components.table.maxHeight` | `MiroirThemeContext` (`"600px"` default) | Outer **pixel cap for scroll mode only** (both backends). Not applied in paged mode. |
| `theme.components.table.minHeight` | same (`"200px"` default) | **Orphan** — referenced by no component (pre-existing dead token). |
| `containerHeight` | `GlideDataGridComponent` prop (never passed today) | Scroll-mode pixel-cap override (takes precedence over theme `maxHeight`). |
| `styles.height` | `styles` prop bag | **Dead on containers** — the computed mode height is written after `...props.styles` in the style object and wins. (Pre-existing; e.g. `TestResultsGrid` still passes `height: "400px"`.) |
| `window.innerHeight` / `50vh` | — | **Removed** (was the pre-D2-d "large list" viewport cap). |
| Glide row/header heights | module constants `34` / `36` px | Exact per-mode Glide height math. |
| ag-grid row/header heights | module constants `42` / `48` px (Alpine-theme assumptions) | Height **estimate** for ag-grid **scroll mode** only — paged mode uses `autoHeight` and estimates nothing. |

The only current call sites: `ReportSectionListDisplay` and `TestResultsGrid`, both passing
`pageSize={50}` (paged mode) since the D2-d migration — previously `maxRows={50}`.

---

## 3. Paged-mode pipeline

### ag-grid branch (`EntityInstanceGrid`, `ValueObjectGrid`)

```
rowData = full tableComponentRowUuidIndexSchema
AgGridReact: domLayout="autoHeight", pagination=true, paginationPageSize=pageSize
container height = none — the grid sizes itself to the current page's rows (uncapped)
```

- Native pager pages **after** ag-grid's own sort/filter, so interactive sort/filter is correct across
  the whole set for free; `autoHeight` re-sizes natively on page change and filter shrink, so short
  last pages and filtered pages shrink the grid with no tracking code.
- **Why not `domLayout="normal"` + a px estimate** (the first D2-d attempt): the estimate
  (`rows*42 + 48 + 56`, tracked via `onPaginationChanged`) disagreed with ag-grid's internal layout in
  the real browser — the row-virtualization window latched onto a stale viewport height, leaving page
  rows unreachable (observed 2026-08-24: container computed `2204px` while `.ag-center-cols-viewport`
  carried a stale inline `height: 1650px`). `autoHeight` removes the estimate, the virtualization
  window, and the in-grid scrollbar in one move.
- When `pageCount ≤ 1`, the native pager still renders with **disabled** controls (asymmetry vs Glide,
  see §6).

### Glide branch (`GlideDataGridComponent`)

```
sortedAndFilteredTableRows (Glide re-sorts/re-filters the full set internally)
useClientPagination(totalCount = sortedAndFiltered.length, pageSize, resetKey)
displayedRows = paginateRows(sortedAndFiltered, pageIndex, pageSize).pageRows   // slice AFTER sort/filter
height = computeGlidePagedHeight(displayedRows.length)   // rows*34 + 36, exact, uncapped
GridPaginationToolbar (hidden when pageCount ≤ 1)
```

- `resetKey` = sort state + filter state + input row count ⇒ page resets/clamps during render (no
  `useEffect`), so the UI never shows an empty page while `total > 0`.
- The toolbar shows "Showing *a–b* of *total*" where *total* is the **filtered** total.

---

## 4. Scroll-mode pipeline

```
ag-grid:  pagination=false, domLayout="normal", full rowData
          height = min( min(maxRows, total)*42 + 48, themeMaxHeight ) px
Glide:    displayedRows = sortedAndFilteredTableRows (no slice), no toolbar
          height = min( min(maxRows, total)*34 + 36, containerHeight ?? themeMaxHeight ) px
```

This deliberately reproduces the pre-#247 dense-admin-grid behavior with the threshold parameterized
(`maxRows` instead of the hardcoded `50`). ag-grid virtualizes within the fixed viewport; Glide's canvas
does the same inside its capped height.

**Testing gotcha:** with `pagination=false`, ag-grid still mounts the `.ag-paging-panel` DOM node with
`ag-hidden` / `aria-hidden="true"` classes. "No pager" assertions must check the `ag-hidden` class, not
node absence (happy-dom does not apply the stylesheet, so the node is visible to `querySelector`).

---

## 5. Worked matrix (total = 60 rows unless noted)

| Props | Mode | ag-grid result | Glide result |
|---|---|---|---|
| *(none)* | paged 50 | pages 50/10; height fits 50 rows, shrinks to 10 on last page (autoHeight) | pages 50/10; height 1736px then 376px; toolbar |
| `pageSize={20}` | paged 20 | pages 20×3; height fits 20 rows (autoHeight) | pages 20×3; "Showing 1–20 of 60" |
| `pageSize={200}` | paged 200 | single page, height fits 200 rows, outer page scrolls | single page, 6876px tall |
| `maxRows={10}` | scroll 10 | no pager; height 468px; 60 rows scroll inside | no toolbar; height 376px; `data-page-rows="60"` |
| `maxRows={100}` | scroll 100 | height capped at 600px (theme) | height capped at 600px (theme) |
| paged 50, user filters to 10 | paged | pager "1 to 10 of 10"; height shrinks to 10 rows (autoHeight) | toolbar hides (`pageCount ≤ 1`); height 376px |
| 0 rows | paged | height = header + pager (autoHeight), "No Rows To Show" | height 36px (header only), no toolbar |

---

## 6. Surviving asymmetries and known limitations

What remains after D2-d, consciously accepted or pre-existing:

1. **Estimate vs exact (scroll mode only).** ag-grid *scroll-mode* heights are px estimates (42px row
   assumption); Glide heights are exact. Paged mode estimates nothing — ag-grid `autoHeight` sizes to
   the rendered page. Columns with wrapped/auto-height content can still overflow the scroll-mode
   estimate; the grid body then scrolls within a slightly short container.
2. **Chrome asymmetry at `pageCount ≤ 1`.** ag-grid shows its native pager with disabled controls; Glide
   hides its toolbar. Both satisfy the AC; unifying means either suppressing the native panel
   (`suppressPaginationPanel`) or rendering a disabled custom toolbar.
3. **Reset semantics asymmetry.** On data change, ag-grid's native pager resets internally; Glide resets
   via `resetKey` + render-phase clamp. Observable behavior converges; the mechanisms differ (sizing-doc
   history: this was finding P5).
4. **`styles.height` / theme `minHeight` are dead config** (pre-existing, deliberately untouched by
   D2-d). `styles.height` is shadowed by the computed height; the `minHeight` token is referenced by no
   component. Cleanup is a separate, low-value refactor.
5. **Glide filter shrink vs ag-grid in paged mode** — both track, via different mechanisms (ag-grid:
   native `autoHeight` re-layout; Glide: `sortedAndFilteredTableRows.length` feeding
   `computeGlidePagedHeight`).

### Removed by D2-d (historical, kept for archaeology)

The D2-c build (same day, superseded) had `pageSize` and `maxRows` as *independent* knobs. Its 2×2
interaction matrix produced the confusing hybrid state (paged **and** in-page scroll when
`pageSize > maxRows`), and Glide capped full pages at 600px so a full page still scrolled at defaults.
D2-d removed: the threshold logic, the `50vh`/`window.innerHeight` viewport path, the hybrid state, and
the Glide full-page cap. Decision history: `code-helpers/features/247-FEATURE-paginated-report-section-grids/analysis.md` (D2).

---

## Related documents

- Feature analysis & decisions: `code-helpers/features/247-FEATURE-paginated-report-section-grids/analysis.md`
- TDD plan & slice realizations: `code-helpers/features/247-FEATURE-paginated-report-section-grids/tdd-implementation-plan.md`
- Test suites: `packages/miroir-standalone-app/tests/4_view/gridPagination.unit.test.tsx`,
  `gridPagination.integ.test.tsx` (nonreg steps `unit-gridPagination`, `integ-gridPagination`)
- Core module: `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Grids/gridPagination.ts`
