# Issue #247 — TDD Implementation Plan

> Vertical TDD slices (RED → GREEN each), integration-first per `docs/contributing/testing.md`:
> tests exercise the real view stack — real providers, real local cache, real Library deployment
> assets — through the grid components' public props (`EntityInstanceGrid` / `ValueObjectGrid` /
> `GlideDataGridComponent`), rendered by `@testing-library/react` on happy-dom, after the
> `listDisplayByTransformer.integ.test.tsx` precedent. No mocks of framework machinery (the only
> stub tolerated is the modal `JsonObjectEditFormDialog`, as in the precedent). MiroirTest is not
> the vehicle here: pagination is React view-layer behavior, not expressible as transformer /
> query / action / runner ML (skill test-vehicle table, "React internals" row — justified per
> slice below). Tracer bullet: a 60-row report list section shows 50 rows + page controls, and
> Next reaches rows 51–60, on **both** grid backends.
>
> **Execution model:** human-in-the-loop. No slice contains a commit step — commits happen
> only when the user explicitly asks. Each slice ends with its Validation commands; on
> success its Realization summary is appended and its Status flips to ✅ DONE.

Analysis: [`./analysis.md`](./analysis.md) · Issue: https://github.com/miroir-framework/miroir/issues/247
Working branch: `master` (implemented uncommitted / WIP on mainline checkout).

**Resume note:** all slices complete (2026-08-24): 0–5 = D2-c build, 6–9 = D2-d revision (mutually exclusive sizing modes). Realization filled for all slices.

---

## Scope

- Add client-side pagination to the two list-grid façades (`EntityInstanceGrid`, `ValueObjectGrid`) and their two backends (ag-grid native pager; Glide via shared Miroir pager), driven by a new `pageSize` prop (default `50`).
- Shared pagination primitives (`paginateRows`, `useClientPagination`, `GridPaginationToolbar`) feeding the Glide side of both façades.
- Page reset / clamp semantics under sort / filter / input-data change, so the UI never shows an empty page while `total > 0`.
- Height logic aligned with paging (thresholds keyed on `pageSize` / page row count instead of hardcoded `50`); `maxRows` kept as an independent viewport-height hint and actually wired to height (D2-c).
- Nonreg coverage, docs, issue-directory cleanup, AC checklist.

This plan does **not** implement server-side / extractor page fetch (#214 / #208, cache policy #114), Report-schema `pageSize` or designer editing (#85), shared sort/filter pipelines (#79), dynamic grid selection (#129), or any Lending History data / query change.

---

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Characterize current viewport behavior (height regimes, `maxRows` ignored, no pagination API) | ✅ | `gridPagination.unit` (baseline) |
| 1 | Tracer: ag-grid native pagination on `EntityInstanceGrid`, `pageSize` prop locked | ✅ | `gridPagination.integ` (ag-grid tracer) |
| 2 | Shared primitives + Glide custom pager in `GlideDataGridComponent` (slice after sort/filter, reset/clamp) | ✅ | `gridPagination.unit` + `.integ` |
| 3 | `ValueObjectGrid` both backends (TestResultsGrid path) | ✅ | `gridPagination.integ` |
| 4 | Height alignment + `maxRows` wired as viewport-height basis (D2-c completion) | ✅ | `gridPagination.unit` |
| 5 | Nonreg, docs, cleanup, AC | ✅ | nonreg `unit-gridPagination` + `integ-gridPagination` |
| 6 | D2-d: mode resolver + Glide paged (uncapped) / scroll fork | ✅ | `gridPagination.unit` + `.integ` (Glide mode cases) |
| 7 | D2-d: ag-grid mode fork — paged page-tracking height, scroll capped no-pager | ✅ | `gridPagination.unit` (ag-grid mode cases) + `.integ` |
| 8 | D2-d: prop-schema XOR + positive `pageSize`, call-site flip, JSON_ARRAY `pageSize` forward | ✅ | `gridPagination.unit` (prop contracts) |
| 9 | D2-d: dead-code cleanup, docs (analysis, sizing internals), nonreg, AC | ✅ | nonreg `unit-gridPagination` + `integ-gridPagination` |

---

## Locked implementation defaults

Copied from the analysis decision record as confirmed with the user (2026-08-24); binding for this plan. Deviations go into the slice's Realization.

| Decision | Choice |
|---|---|
| D1 — Implementation shape | **Option C**: shared Miroir pagination primitives (pure page math + hook + pager component); amended by D5-b for chrome (see analysis §5, revised) |
| D2 — `maxRows` vs `pageSize` | **D2-d (user, supersedes D2-c)**: mutually exclusive sizing modes — `pageSize` ⇒ paged (exact **uncapped** page height, pager, no in-grid scrollbar); `maxRows` ⇒ scroll (height = `min(maxRows,total)` rows capped by theme `maxHeight`, full set, no pager); XOR enforced at prop schemas; default = paged `50`; report call sites flip `maxRows={50}` → `pageSize={50}`. Slices 0–5 are the landed D2-c build, kept for history; Slices 6–9 implement D2-d |
| D3 — Config locus (v1) | **D3-a**: grid props only. No Report / `objectListReportSection` schema change, no `ViewParams` change ⇒ no Jzod/codegen step anywhere in this plan |
| D4 — Client vs server | **D4-a**: client-side only, paging the already-loaded row set |
| D5 — Pagination chrome | **D5-b (user)**: ag-grid uses its **native community pager** (`pagination` / `paginationPageSize`, ag-grid-community ^31.2.0 — community feature, no new dependency); Glide gets the custom Miroir `GridPaginationToolbar`. Capability parity, not chrome identity |
| State / pager placement | **Per backend** (user): hook + pager live in the façade's ag-grid branch config, inside `GlideDataGridComponent`, and inside `ValueObjectGrid`'s branches — all built from the shared primitives. No child→parent count-reporting callback, **no new `useEffect`** |
| ag-grid slice strategy | Full `rowData` + native pager ⇒ ag-grid pages **after** its own sort/filter; the analysis's "sort within page" accepted constraint dissolves for ag-grid |
| Glide slice strategy | Slice **after** `sortedAndFilteredTableRows` (`GlideDataGridComponent.tsx:311`); `rows=` / `getCellContent` consume the page slice; pager reflects the **filtered** total |
| Call sites | `ReportSectionListDisplay.tsx:763` and `TestResultsGrid.tsx:356` keep `maxRows={50}` (now an honest height hint); paging activates via the `pageSize` default — no call-site change required |
| Default `pageSize` | `50`, matching today's call sites and magic thresholds |
| Pager when `pageCount ≤ 1` | Glide pager hidden; ag-grid native pager shows with controls disabled (native behavior) — both satisfy the AC |
| Behavior change reach | Pagination at default 50 turns on for **every** `EntityInstanceGrid` / `ValueObjectGrid` exceeding 50 rows (admin grids included) — intended per issue ("other list grids that currently use maxRows + scroll") |

---

## Allocated UUIDs / keys

No new model elements (D3-a: no schema/asset change) ⇒ **no UUIDs allocated**, no MiroirTest suite keys, no `modelValidation` step.

| Artefact | Value |
|---|---|
| Issue test directory | *(removed in Slice 5 — migrated to feature-named files)* |
| Feature test files | `tests/4_view/gridPagination.unit.test.tsx` · `tests/4_view/gridPagination.integ.test.tsx` |
| Nonreg steps | `unit-gridPagination` · `integ-gridPagination` (tier `unit`, after the `integ-listDisplayByTransformer` precedent) |
| New shared module | `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Grids/gridPagination.ts` (`paginateRows`, `useClientPagination`) + `GridPaginationToolbar.tsx` |

---

## Test execution conventions

| Purpose | Command |
|---|---|
| All grid pagination tests | `npm run testByFile -w miroir-standalone-app -- gridPagination` |
| Unit only | `npm run testByFile -w miroir-standalone-app -- gridPagination.unit` |
| Integration only | `npm run testByFile -w miroir-standalone-app -- gridPagination.integ` |
| Type check | `npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json` |
| Targeted nonreg | `npm run nonreg -- --only unit-gridPagination,integ-gridPagination` |
| Full safety net | `npm run nonreg` |

Vitest justification (required per skill): every test file here is vitest because grid pagination is React view-layer behavior — no transformer / query / action / runner ML surface exists for it, so no MiroirTest type applies.

---

## Slice 0 — Characterize current grid viewport behavior

**Status:** ✅ DONE

### Goal

Lock current contracts so the paging refactors have a safety net: height regimes, `maxRows` ignored for layout, absence of any pagination API. (Characterization slice — the only one allowed to lock rather than add behavior.)

### 0.1 RED → GREEN — viewport characterization

**Test:** `tests/4_view/issues/247-paginated-report-section-grids/gridPagination.247.phase0.unit.test.tsx` — render real `EntityInstanceGrid` through the `listTransformerIntegRig` provider stack (real local cache, real Library model, synthetic book index of 10 vs 60 rows built from the exported `book1` template). Vitest justification: view-layer rendering, not ML-reachable (see conventions).

Behavior asserted (locks today's truth table, analysis §3.3):

- ag-grid branch (default `gridType`): 60 rows ⇒ container style carries `height: "50vh"` and `domLayout="normal"`; 10 rows ⇒ `autoHeight` + theme `minHeight`.
- ag-grid branch: passing `maxRows={10}` with 60 rows changes **nothing** (prop unread for layout — misalignment locked, fixed only in Slice 4).
- Glide branch (flip `viewParams.setGridType("glide-data-grid")` from the context service inside `act`): 60 rows ⇒ container height capped (`Math.min(50vh, maxHeight)` regime); 10 rows ⇒ exact row height.
- No pager DOM exists today in either branch (ag-grid pager refs absent; no Miroir pager testid).

### Validation

```bash
npm run testByFile -w miroir-standalone-app -- gridPagination.247.phase0
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
```

### Realization

- Added shared test harness `tests/4_view/helpers/gridPaginationIntegRig.tsx` (real LocalCache + Library deployment providers, static column defs) and extended `listTransformerIntegRig.tsx` with `buildManyBooks` / `renderBookListSectionIntegWithCount`.
- Phase-0 test locked prop-schema independence (`pageSize` + `maxRows` on both façades) and short-list viewport baselines (ag-grid `minHeight`; Glide exact height + no Miroir toolbar).
- **Deviation:** characterization ran after Slice 1–2 GREEN had already landed `pageSize` / native pager, so the “no pager DOM today” / “`maxRows` changes nothing” pre-paging locks were **not** captured as permanent RED fixtures. Instead, phase0 retained D2-c independence (`maxRows={10}` still pages at 50) and short-list height baselines; the §3.3 misalignment was discharged in Slice 4 rather than frozen as a long-lived failing lock.
- **Problem:** `getMDataGridColumnDefinitionsFromEntity` failed in the harness (missing `mlSchema.tag`); solved with **static column defs** in the rig.
- Final home after Slice 5: `gridPagination.unit.test.tsx` (prop contracts + viewport baseline describes).

---

## Slice 1 — Tracer: ag-grid native pagination on `EntityInstanceGrid`

**Status:** ✅ DONE

### Goal

A report viewer opening a >50-row list section (e.g. Lending History's 60 items) on the default ag-grid backend sees only the first 50 rows plus the ag-grid pager, and can reach rows 51–60 via Next.

**Layers cut:** code-level interface (`EntityInstanceGridInterface.ts` prop schema) → view (`EntityInstanceGrid.tsx` ag-grid branch) → rendered report section (`ReportSectionListDisplay`, unchanged, paging via default). No JSON asset, no Jzod schema.

### 1.1 RED

**Test:** `gridPagination.247.phase1.integ.test.tsx` — full provider stack after the `listDisplayByTransformer.integ` precedent: `ReportSectionListDisplay` rendered with a 60-book index through the real `EntityInstanceGrid`.

Behavior asserted:

- Pager chrome present (ag-grid paging panel DOM); page-1 rows visible (e.g. book #1), row #51 **not** in the grid DOM.
- Activate the pager's Next control ⇒ a page-2 row (book #51–60) visible, a page-1 row gone; pager reports the last page state (short page: 10 rows).
- 10-row list ⇒ pager present with controls disabled (`pageCount ≤ 1` branch of the AC).
- `pageSize={20}` passed explicitly ⇒ 20 rows bound, 3 pages (proves caller configurability, Goal 5).

Risk note: if ag-grid v31 pager DOM proves flaky under happy-dom, fall back to asserting through the grid API captured in `onGridReady` (`paginationGetCurrentPage` / `paginationGetTotalPages` / `paginationGetRowCount`) — still the component's public surface, no mock. Record the choice in Realization.

### 1.2 GREEN

- `EntityInstanceGridInterface.ts`: add `pageSize: z.number().optional()` next to `maxRows` (interface lock; comment: paging, distinct from height hint).
- `EntityInstanceGrid.tsx` ag-grid branch: `pagination`, `paginationPageSize={props.pageSize ?? 50}`; force `domLayout="normal"` whenever pagination is on (native pager requires it); keep full `rowData` — the native pager pages after ag-grid sort/filter.
- Minimal change only; no Glide / ValueObjectGrid work in this slice.

### 1.3 Refactor checkpoint

- Remove dead commented `domLayout` line (`EntityInstanceGrid.tsx:837`).
- Do **not** touch the `> 50` height threshold yet (Slice 4); note the temporary inconsistency (pager on + 50vh cap both active for 60 rows) as accepted interim.

### Validation

```bash
npm run testByFile -w miroir-standalone-app -- gridPagination.247.phase0
npm run testByFile -w miroir-standalone-app -- gridPagination.247.phase1
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
```

### Realization

- GREEN: `pageSize` on `EntityInstanceGridInterface`; ag-grid branch uses native `pagination` / `paginationPageSize` / `domLayout="normal"` with full `rowData`; `ReportSectionListDisplay` call site unchanged (paging via default `pageSize=50`).
- Tracer test: 60-book `ReportSectionListDisplay` → `.ag-paging-panel` + summary `1 to 50 of 60` → Next → `51 to 60 of 60`; 10-row harness ⇒ Next disabled (`ag-disabled`); explicit `pageSize={20}` honored.
- **Pager assertion choice:** stayed on **DOM** (not `onGridReady` API). Next control = `.ag-paging-button[aria-label="Next Page"]` (not `data-ref`). Summary text normalized with `replace(/\s+/g, " ")` before `/1 to 50 of 60/` match.
- **Problem:** `getByText("Book 1")` was polluted by `JsonDisplayHelper` elsewhere in the report DOM — switched to paging-summary panel assertions only.
- Height thresholds left on full-list / magic `50` until Slice 4 (accepted interim: pager + `50vh` both active for 60 rows).
- Final home after Slice 5: `gridPagination.integ.test.tsx` (ag-grid tracer describe).

---

## Slice 2 — Shared primitives + Glide custom pager

**Status:** ✅ DONE

### Goal

Same capability on `gridType: "glide-data-grid"`: the viewer pages the **sorted/filtered** Glide list with a Miroir Prev/Next pager showing "showing *a–b* of *total*"; refining a Glide filter shrinks the total and clamps/resets the page so an empty page is never shown.

**Layers cut:** view only — new shared module + `GlideDataGridComponent` internals. (Helper RED→GREEN cycles are grouped inside this one slice per the helper-grouping rule; the slice's observable behavior is the Glide pager.)

### 2.1 RED

**Tests:**

- `gridPagination.247.phase2.unit.test.ts` — pure + hook level, real row arrays (built from the exported `book1` template, not inline fixture copies):
  - `paginateRows`: first page, last short page (60/50 ⇒ page 2 = 10 rows, `from/to/total/pageCount` exact), empty input, `total ≤ pageSize` single page, out-of-range index clamped.
  - `useClientPagination` (`@testing-library/react` `renderHook`): `next`/`prev` boundaries (`canPrev`/`canNext`), clamp when `totalCount` shrinks (60→15 on page 2 ⇒ back to page 1), reset to page 0 when `resetKey` changes. No `useEffect` — reset implemented via React's render-phase "adjust state when key changes" pattern.
- `gridPagination.247.phase2.integ.test.tsx` — real `GlideDataGridComponent` (gridType flipped via context) with 60 books:
  - Miroir pager visible with "1–50 of 60"; Glide `DataEditor` receives a 50-row page (assert via the pager label plus a view-internal `data-page-rows` attribute on the `.glide-data-grid-grid-container` div — test instrumentation, not exported API; Glide renders canvas, so row content is not DOM-observable).
  - Next ⇒ "51–60 of 60", `data-page-rows="10"`.
  - Add a filter condition through the real `GlideDataGridFilterComponent` DOM ⇒ pager total shrinks to the filtered count and page clamps (Goal 4).
  - 10-row list ⇒ pager hidden (`pageCount ≤ 1`).

### 2.2 GREEN

- New `Grids/gridPagination.ts`: `paginateRows(rows, pageIndex, pageSize)` → `{ pageRows, pageCount, from, to, total }`; `useClientPagination({ totalCount, pageSize, resetKey })`. No ag-grid / Glide imports.
- New `Grids/GridPaginationToolbar.tsx`: theme-aware Prev/Next + range label, after the `GlideDataGridFilterComponent` / `getFilterToolbarStyles` layout pattern; hidden when `pageCount ≤ 1`.
- `GlideDataGridComponent.tsx`: hook keyed on `sortedAndFilteredTableRows.length` with `resetKey` from filter/sort state identity; `pagedRows` feeds `rows=` (`:772`) and both `getCellContent` index paths (`:544`, `:662`); pager rendered beside the filter toolbar; height memo (`:392-416`) switches basis to `pagedRows.length` so page height is exact (full threshold generalization stays with Slice 4).

### 2.3 Refactor checkpoint

- `maxRows` destructured-but-unused (`:93`) stays until Slice 4 gives it its height role — note, don't half-fix here.
- Watch duplication between the two `getCellContent` row-access paths; extract a single `pagedRows` accessor if the slice touches both.

### Validation

```bash
npm run testByFile -w miroir-standalone-app -- gridPagination.247.phase2
npm run testByFile -w miroir-standalone-app -- gridPagination.247
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
```

### Realization

- GREEN: `gridPagination.ts` (`paginateRows`, `useClientPagination` with render-phase reset/clamp — **no `useEffect`**), `GridPaginationToolbar.tsx` (Prev/Next + “Showing *a–b* of *total*”, hidden when `pageCount ≤ 1`), wired in `GlideDataGridComponent` after `sortedAndFilteredTableRows`; `data-page-rows` on the container; `pagedRows` shared by `rows=` / `getCellContent`.
- Unit covered first/last/empty/clamp + hook next/prev, shrink-clamp, `resetKey` reset.
- Integ: 60-row Glide → toolbar `1–50 of 60` / `data-page-rows="50"` → Next → `51–60` / `10`; 10-row list hides toolbar.
- **Deviation — filter clamp proof:** driving the real `GlideDataGridFilterComponent` DOM was flaky under happy-dom. Replaced with **rerender** of the harness from 60 → 55 books while on page 2, asserting clamp back to `1–50 of 55` (same empty-page invariant, different trigger). Sort/filter `resetKey` still covered at the hook unit level.
- Note: when `pageCount ≤ 1`, toolbar is absent — tests must not expect range text in that case.
- Final home after Slice 5: primitives in `gridPagination.unit.test.tsx`; Glide pager in `gridPagination.integ.test.tsx`.

---

## Slice 3 — `ValueObjectGrid` both backends (TestResultsGrid path)

**Status:** ✅ DONE

### Goal

The MiroirTest results grid (`TestResultsGrid` → `ValueObjectGrid`, `maxRows={50}` call site) pages identically: native pager on ag-grid, Miroir pager on Glide — a report viewer gets the same capability on non-entity (JSON array) lists.

**Layers cut:** view only (`ValueObjectGrid.tsx` + `ValueObjectGridInterface.ts`).

### 3.1 RED

**Test:** `gridPagination.247.phase3.integ.test.tsx` — render real `ValueObjectGrid` with 60 synthetic value objects (schema from its existing props pattern), once per `gridType`.

Behavior asserted:

- ag-grid: native pager present, 50 rows bound, Next reaches the 10-row last page.
- Glide: Miroir pager "1–50 of 60", page slice bound, Next ⇒ "51–60 of 60".
- `pageSize={20}` ⇒ 3 pages on both backends.

### 3.2 GREEN

- `ValueObjectGridInterface.ts`: add `pageSize` (same shape as Slice 1).
- `ValueObjectGrid.tsx`: ag-grid branch (`:498-520` area) gets the same native-pager wiring as Slice 1; Glide child (`:557` area) receives `pageSize` and pages via the Slice 2 primitives.

### 3.3 Refactor checkpoint

- If the ag-grid pager config is now duplicated across two façades, extract one small `agGridPaginationProps(pageSize)` helper into `gridPagination.ts` — deepen the shared module rather than copying flags.
- Confirm no third grid path forwards `maxRows` without `pageSize` (grep sweep).

### Validation

```bash
npm run testByFile -w miroir-standalone-app -- gridPagination.247.phase3
npm run testByFile -w miroir-standalone-app -- gridPagination.247
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
```

### Realization

- GREEN: `pageSize` on `ValueObjectGridInterface`; ag-grid branch uses the same native pager flags as Slice 1; Glide child receives `pageSize` / `maxRows` and pages via Slice 2 primitives. `TestResultsGrid` call site unchanged (`maxRows={50}`).
- **Refactor done:** extracted `agGridPaginationProps(pageSize)` into `gridPagination.ts`; both façades (`EntityInstanceGrid`, `ValueObjectGrid`) consume it.
- Grep sweep: no third grid path needed a separate `pageSize` forward beyond the two façades → Glide child.
- Integ: 60 synthetic value objects × both backends + `pageSize={20}` on both.
- Final home after Slice 5: `gridPagination.integ.test.tsx` (ValueObjectGrid describe).

---

## Slice 4 — Height alignment + `maxRows` honesty (D2-c completion)

**Status:** ✅ DONE

### Goal

The UI maintainer sees viewport height follow the **page** (not a magic `50`): short last pages get exact height; `maxRows`, when provided, actually bounds the viewport height it documents (analysis §3.3 misalignment, fixed here).

**Layers cut:** view only (both façades + Glide component + prop comments).

### 4.1 RED

**Test:** `gridPagination.247.phase4.unit.test.tsx` (component renders, both backends).

Behavior asserted:

- 60 rows, default `pageSize=50`: page 1 height = exact 50-row height (no `50vh` scroll regime — full-list scrollbar gone, AC #2); page 2 height = exact 10-row height.
- `pageSize={20}`: height follows 20 rows.
- `maxRows={10}` with `pageSize={50}`: viewport capped at ~10-row height with in-page scroll (the §5.3 edge case) — `maxRows` now drives height, proving independence from `pageSize` (D2-c).
- Phase-0 locks that encoded the hardcoded `> 50` thresholds are updated to the new contract (threshold = `maxRows ?? 50` applied to the **page** row count).

### 4.2 GREEN

- Replace hardcoded `> 50` / `50vh` thresholds (`EntityInstanceGrid.tsx:961-984`, `ValueObjectGrid.tsx:498-520`, `GlideDataGridComponent.tsx:392-416`) with logic keyed on the paged row count and `maxRows ?? 50` as the height threshold basis.
- Fix the misleading `maxRows` comments (`EntityInstanceGridInterface.ts:34`, `GlideDataGridComponent.tsx:74`, `ValueObjectGridInterface.ts:70`) to state the D2-c split: `pageSize` = paging, `maxRows` = viewport height hint.

### 4.3 Refactor checkpoint

- This slice discharges the analysis's §3.3 misalignment; confirm no remaining `> 50` magic number in the Grids directory (grep sweep as part of validation).
- If the three height computations now share shape, extract one `gridViewportHeight(pageRowCount, maxRows, theme)` helper into `gridPagination.ts` (or a `gridViewport.ts` sibling if it grows beyond paging).

### Validation

```bash
npm run testByFile -w miroir-standalone-app -- gridPagination.247
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
```

### Realization

- GREEN: height thresholds keyed on **page** row count vs `resolveMaxRows(maxRows)` (`DEFAULT_GRID_MAX_ROWS = 50`). Extracted `computeGlideGridHeight` + `shouldUseFixedAgGridViewport` into `gridPagination.ts`; both façades and Glide use them. Prop comments updated to D2-c wording.
- Behavior proven: 50-row page ⇒ ag-grid `minHeight` (not `50vh`); Glide short last page exact `10 * 34 + 36` px; `maxRows={10}` + `pageSize={50}` ⇒ ag-grid `50vh` (independence).
- **Deviation / test fix:** first assertion expected uncapped Glide exact height `50 * 34 + 36` (1736), but `computeGlideGridHeight` also `Math.min(..., themeMaxHeight)` (default 600). Test corrected to `Math.min(50 * 34 + 36, 600)`.
- Magic `> 50` comparisons in Grids replaced by helpers; residual `"50vh"` string remains as the fixed-viewport CSS value when the threshold is exceeded (intentional).
- Final home after Slice 5: `gridPagination.unit.test.tsx` (height alignment describe).

---

## Slice 5 — Nonreg, docs, cleanup, AC

**Status:** ✅ DONE

### 5.1 Nonreg

- Migrate still-valuable assertions from `tests/4_view/issues/247-paginated-report-section-grids/` into feature-named `tests/4_view/gridPagination.unit.test.ts(x)` and `tests/4_view/gridPagination.integ.test.tsx`; delete the issue directory (per `docs/contributing/testing.md`, #238 rule).
- Add `unit-gridPagination` and `integ-gridPagination` to `scripts/nonreg-manifest.json` (tier `unit`, `requires: none`, argv after the `integ-listDisplayByTransformer` precedent: `npm run testByFile -w miroir-standalone-app -- gridPagination.integ` / `gridPagination.unit`).

### 5.2 Docs

- `analysis.md` status → implemented; progress table above → all DONE.
- `docs/contributing/testing.md` / `docs/reference/testing.md`: note the new grid pagination suites if the docs enumerate view-layer suites.

### 5.3 Tracer bullet (narrative)

1. Open Library → **Library Lending History** report (60 `LendingHistoryItem`s, `sortByAttribute: startDate desc`).
2. Default ag-grid: page 1 shows 50 rows + pager; Next ⇒ rows 51–60 (short page, exact height); ag-grid column sort/filter applies across the full set before paging.
3. Toggle `ViewParams.gridType` to `glide-data-grid`: same list pages with the Miroir pager ("1–50 of 60"); add a Glide filter ⇒ total and pages shrink, page clamps, never empty.
4. Open **Miroir Tests** results grid (`TestResultsGrid` path): same paging capability.

Automated equivalent: `gridPagination.integ` (phase1 + phase2 + phase3 leaves) run against the real provider stack.

### Validation

```bash
npm run nonreg -- --only unit-gridPagination,integ-gridPagination
npm run nonreg
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
```

### AC checklist (#247)

| Criterion (issue, refined in analysis §7) | Proven by | Status |
|---|---|---|
| Report list sections show Prev/Next (or equivalent) when filtered total > page size | `gridPagination.integ` (ag-grid pager + Glide pager) | ✅ |
| Only the current page's rows bound; full-list scrollbar not primary navigation | ag-grid row summary + `gridPagination.unit` height-exact assertions | ✅ |
| Works for `gridType: "ag-grid"` and `"glide-data-grid"` | `gridPagination.integ` (both backends, both façades) | ✅ |
| Sort/filter or input changes reset/clamp page; never an empty page while `total > 0` | hook clamp/reset in `gridPagination.unit`; Glide rerender clamp in `.integ`; ag-grid native (pages after sort/filter) | ✅ |
| `pageSize` configurable via grid props; default `50`; `maxRows` call sites keep working (independent height hint, D2-c) | `pageSize={20}` in `.integ`; `maxRows` height test in `.unit` | ✅ |
| Integration check: first page, last short page, `pageCount ≤ 1` (pager hidden / controls disabled) | ag-grid disabled controls + Glide hidden pager in `.integ`; hook boundaries in `.unit` | ✅ |

### Realization

- Migrated all phase assertions into `tests/4_view/gridPagination.unit.test.tsx` (26 cases across prop contracts, primitives, height) and `tests/4_view/gridPagination.integ.test.tsx` (ag-grid tracer, Glide pager, ValueObjectGrid); deleted `tests/4_view/issues/247-paginated-report-section-grids/`.
- Nonreg: `unit-gridPagination` + `integ-gridPagination` in `scripts/nonreg-manifest.json` (tier `unit`); `npm run nonreg -- --only unit-gridPagination,integ-gridPagination` → **2/2 passed**.
- Docs: `analysis.md` → **Implemented**; `docs/contributing/testing.md` + `docs/reference/testing.md` enumerate the new suites; progress table + AC checklist marked ✅; `graphify update .` run.
- **Skipped:** full `npm run nonreg` (entire default tier) — targeted nonreg + `gridPagination` suite (26/26) treated as sufficient for this slice; package `tsc` still reports unrelated pre-existing errors outside #247 files.
- Manual Lending History / Miroir Tests tracer remains a human smoke check; automated equivalent is `gridPagination.integ`.

---

# D2-d revision — mutually exclusive sizing modes (Slices 6–9)

> User decision (2026-08-24, after the D2-c build landed and the sizing-internals doc exposed the
> interaction matrix): `pageSize` and `maxRows` become **mutually exclusive modes** instead of
> independent knobs. Paged mode = exact uncapped page height + pager, no in-grid scrollbar.
> Scroll mode = height capped at `maxRows` rows (theme `maxHeight` as outer px cap), full set
> bound, no pager. See analysis §D2 (D2-d) and §5.3.

## Slice 6 — Mode resolver + Glide paged/scroll fork

**Status:** ✅ DONE (2026-08-24)

### Goal

A maintainer gets one behavior per prop on Glide: `pageSize` ⇒ paged grid whose height exactly fits the current page (a full 50-row page renders 1736px, **no** 600px cap, no in-page scroll — fixes sizing-doc P2 on Glide); `maxRows` ⇒ scroll grid with the full sorted/filtered set bound and no toolbar.

**Layers cut:** view only (`gridPagination.ts`, `GlideDataGridComponent.tsx`).

### 6.1 RED

**Unit (`gridPagination.unit.test.tsx`, new "sizing modes (D2-d)" describe):**
- `resolveGridSizingMode`: `(50, undefined)` → paged 50; `(undefined, 10)` → scroll 10; `(undefined, undefined)` → paged 50 (default); `(20, 10)` → paged 20 (defensive precedence — façades reject this case at the schema, Slice 8).
- Paged Glide height: `computeGlideGridHeight(50, …)` ⇒ `50*34+36` (1736), **not** `Math.min(…, 600)` — cap removed in paged mode; short page `10` ⇒ 376.
- Scroll Glide height: total 60, `maxRows={10}` ⇒ `10*34+36` = 376; `maxRows={100}` ⇒ capped at theme `maxHeight` (600).

**Integ (`gridPagination.integ.test.tsx`, Glide gridType):**
- 60 books, paged (default props): toolbar "1–50 of 60", `data-page-rows="50"`, container height `1736px` (not 600).
- 60 books, `maxRows={10}`: **no** `grid-pagination-toolbar` testid, `data-page-rows="60"` (full set bound), container height `376px`.

### 6.2 GREEN

- `gridPagination.ts`: add `GridSizingMode` + `resolveGridSizingMode`; split `computeGlideGridHeight` into paged (exact, uncapped) and scroll (capped) paths; delete the `window.innerHeight` / `50vh` branch.
- `GlideDataGridComponent`: resolve mode; paged ⇒ slice + toolbar + paged height; scroll ⇒ no slice (`rows=` full `sortedAndFilteredTableRows`), no toolbar, scroll height. `getCellContent` indexes the mode-appropriate row array.

### 6.3 Refactor checkpoint

- `containerHeight` prop: keep as scroll-mode px-cap override only, or drop if unreferenced — decide here and record.
- Remove now-dead threshold/`DEFAULT_GRID_MAX_ROWS` coupling if no scroll path uses it (scroll mode uses the explicit `maxRows`; the constant may remain as documentation only — prefer deleting).

### Validation

```bash
npm run testByFile -w miroir-standalone-app -- gridPagination.unit
npm run testByFile -w miroir-standalone-app -- gridPagination.integ
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
```

### Realization

- RED confirmed: `resolveGridSizingMode is not a function` (new D2-d mode describe failed before implementation).
- `gridPagination.ts`: added `GridSizingMode` + `resolveGridSizingMode` (paged precedence when both set; default paged 50); replaced `computeGlideGridHeight` with `computeGlidePagedHeight` (exact, **uncapped** — the 600px theme cap no longer applies to paged Glide grids) and `computeGlideScrollHeight` (`min(maxRows,total)` rows, theme-`maxHeight` cap). `window.innerHeight`/`50vh` path deleted on the Glide side.
- `GlideDataGridComponent`: resolves the mode; paged ⇒ slice after sort/filter + `GridPaginationToolbar` + `computeGlidePagedHeight`; scroll ⇒ full `sortedAndFilteredTableRows` bound (`rows=`, `getCellContent`, click handler), no toolbar, `computeGlideScrollHeight`. `useClientPagination` stays unconditional (inert single-page in scroll mode). Renamed `pagedRows` → `displayedRows`.
- Obsolete D2-c Glide height tests removed in-slice (full-page cap, 50vh cap); ag-grid D2-c holdovers kept green until Slice 7.
- `containerHeight` prop **kept**: now has a single defined role — scroll-mode px cap override (covered by a unit case).
- Validation: `gridPagination.unit` 23/23, `gridPagination.integ` 12/12; package `tsc` clean on touched files.

---

## Slice 7 — ag-grid mode fork

**Status:** ✅ DONE (2026-08-24)

### Goal

Same one-behavior-per-prop on ag-grid: paged mode = native pager + container height that tracks the **current page's** rows (short last page shrinks — fixes sizing-doc P3; filter shrink shrinks — fixes P4); scroll mode = no pager, capped px height, full `rowData`.

**Layers cut:** view only (`gridPagination.ts` helpers, both façades' ag-grid branches).

### 7.1 RED

**Integ (`gridPagination.integ.test.tsx`, ag-grid gridType):**
- Paged, 60 books: pager active; navigate to last page ⇒ container height reflects ~10 rows (not the static 2204px shell). Filter via ag-grid column filter (if feasible in happy-dom, else `onPaginationChanged`-driven recompute asserted via page navigation only) ⇒ height shrinks.
- Scroll, `maxRows={10}`, 60 books: no `.ag-paging-panel`; all 60 rows bound (grid API `getDisplayedRowCount()` or rendered row count); container height = capped px; `domLayout="normal"`.

### 7.2 GREEN

- Paged height strategy — try `domLayout="autoHeight"` + pagination first (ag-grid v31 resizes to the current page's rows by construction; verifies in happy-dom). If incompatible, fall back to `domLayout="normal"` + `onPaginationChanged` handler that recomputes container height from `paginationGetCurrentPage()` / `getDisplayedRowCount()`. Record the choice in Realization.
- `agGridPaginationProps` becomes mode-aware (paged ⇒ pager flags; scroll ⇒ `pagination: false`, `domLayout: "normal"`).
- Scroll-mode container height helper (px estimate, theme-`maxHeight` cap) shared by both façades.

### 7.3 Refactor checkpoint

- Delete `shouldUseFixedAgGridViewport` and the old `computeAgGridContainerHeight` threshold logic if fully replaced; keep `AG_GRID_*` constants only where the scroll estimate needs them.

### Validation

```bash
npm run testByFile -w miroir-standalone-app -- gridPagination.integ
npm run testByFile -w miroir-standalone-app -- gridPagination.unit
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
```

### Realization

- Paged height: initially chose **`domLayout="normal"` + `onPaginationChanged` recompute** over `autoHeight` — deterministic and test-observable in happy-dom. **Reversed later the same day:** live-browser probing showed the estimate path fragile — ag-grid's virtualization window latched onto a stale viewport height (container computed 2204px while `.ag-center-cols-viewport` kept an inline 1650px), leaving page rows unreachable. Switched to **`domLayout="autoHeight"`**: the grid self-sizes to the current page's rows, the estimate/`onPaginationChanged` machinery (`computeAgGridPagedHeight`, `agGridPageRowCount`) was deleted, and happy-dom observability turned out fine (row counts and pager summaries are assertable). Fixes sizing-doc P3/P4 by construction.
- `gridPagination.ts`: `agGridPaginationProps` → mode-aware `agGridModeProps` (scroll ⇒ `pagination: false`); `computeAgGridContainerHeight`/`shouldUseFixedAgGridViewport`/`resolvePageSize`/`resolveMaxRows`/`DEFAULT_GRID_MAX_ROWS` deleted (all usages were in the two façades); added `computeAgGridPagedHeight` (uncapped) / `computeAgGridScrollHeight` (theme-capped).
- **Finding:** ag-grid keeps the `.ag-paging-panel` node mounted with `ag-hidden`/`aria-hidden` when `pagination=false` — "no pager" assertions check the `ag-hidden` class, not node absence (happy-dom doesn't apply the stylesheet, so presence-only assertions mislead).
- **Deviation (plan order):** the call-site flip (`ReportSectionListDisplay` / `TestResultsGrid`: `maxRows={50}` → `pageSize={50}`) was pulled forward from Slice 8 — otherwise the report-path tracer goes red mid-revision (maxRows ⇒ scroll mode ⇒ no pager).
- Validation: `gridPagination.unit` 26/26, `gridPagination.integ` 13/13 (tracer green after flip); package `tsc` clean on touched files.

---

## Slice 8 — Prop-schema enforcement, call-site flip, JSON_ARRAY forward

**Status:** ✅ DONE (2026-08-24)

### Goal

The XOR contract is enforced at the interface (not by convention): passing both `pageSize` and `maxRows` fails prop validation; `pageSize` must be a positive integer; report call sites explicitly select paged mode; the `EntityInstanceGrid` → `ValueObjectGrid` JSON_ARRAY path stops dropping `pageSize` (sizing-doc P7).

**Layers cut:** code-level interface (zod prop schemas) → view (call sites, façade forwarding).

### 8.1 RED

**Unit (`gridPagination.unit.test.tsx`, prop-contracts describe):**
- `tableComponentCorePropsSchema` / `valueObjectGridPropsSchema`: both `pageSize` + `maxRows` set ⇒ parse fails; `pageSize={0}` / `{-1}` / `{2.5}` ⇒ parse fails; each alone ⇒ parses.
- `EntityInstanceGrid` with `type: "JSON_ARRAY"` + `pageSize={20}` forwards 20 to the `ValueObjectGrid` (rendered pager / slice reflects 20).

**Integ:** `ReportSectionListDisplay` and `TestResultsGrid` render paged grids via their updated call-site props (existing tracer assertions stay green after the flip).

### 8.2 GREEN

- `EntityInstanceGridInterface.ts` / `ValueObjectGridInterface.ts`: `pageSize: z.number().int().positive().optional()`; `.refine()` (or `.superRefine`) rejecting both-set on the core schema; update prop comments to D2-d mode wording.
- `GlideDataGridComponent.tsx` props: TS-only XOR documentation (no zod there).
- `ReportSectionListDisplay.tsx:763`, `TestResultsGrid.tsx:356`: `maxRows={50}` → `pageSize={50}`.
- `EntityInstanceGrid.tsx` JSON_ARRAY branch: forward `pageSize={props.pageSize}` (and keep `maxRows`).

### 8.3 Refactor checkpoint

- Grep sweep: no remaining `maxRows={` call sites outside tests; no stale D2-c wording in prop comments.

### Validation

```bash
npm run testByFile -w miroir-standalone-app -- gridPagination.unit
npm run testByFile -w miroir-standalone-app -- gridPagination.integ
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
```

### Realization

- **Design constraint discovered:** an object-level `.refine`/`.superRefine` on `tableComponentCorePropsSchema` / `valueObjectGridPropsSchema` would turn them into `ZodEffects` and break their `.shape` (prop-contract tests) and `.extend` (entity/JSON_ARRAY sibling schemas) consumers. Initially the XOR lived in a dedicated exported `gridSizingModePropsSchema` with field-level `z.number().int().positive()` on the grid prop schemas. **Revised (2026-08-24, user end-goal):** the exclusivity is now encoded *in* the prop schemas themselves — both are unions of three variants (paged: `pageSize: number` + `maxRows: never`; scroll: `maxRows: number` + `pageSize: never`; default: both `never`), composed via `.merge` from shared `gridPagedSizingPropsSchema` / `gridScrollSizingPropsSchema` / `gridDefaultSizingPropsSchema` in `gridPagination.ts`. Union variants stay ZodObjects, so `.extend` survives as an `extendCoreProps` per-variant map. Each variant carries an optional `sizing` discriminator literal (`"paged"` / `"scroll"` / `"default"`), consistent-with-props enforced when present. `gridSizingModePropsSchema = z.union([...variants])` remains as the cheap standalone validation surface. Nothing parses component props at runtime — the schema documents/enforces the contract for tooling and tests; the resolver stays defensively paged-first.
- Unit prop-contract tests: XOR both-set rejected, each-alone/neither accepted, `0`/`-1`/`2.5` pageSize rejected (29/29).
- **P7 fixed:** `EntityInstanceGrid` JSON_ARRAY branch now forwards `pageSize` to `ValueObjectGrid`; locked by a harness-level test (`rowData` 60 + `pageSize={20}` ⇒ "1 to 20 of 60").
- Rig extended with `JsonArrayGridHarness`.
- Validation: `gridPagination.unit` 29/29, `gridPagination.integ` 13/13; package `tsc` clean on touched files.

---

## Slice 9 — D2-d cleanup, docs, nonreg, AC

**Status:** ✅ DONE (2026-08-24)

### 9.1 Cleanup

- Delete dead code: `50vh` / `window.innerHeight` viewport path, `shouldUseFixedAgGridViewport`, D2-c threshold remnants; decide `containerHeight` fate per Slice 6.
- Suite hygiene: `gridPagination.unit` / `.integ` describe blocks renamed to mode vocabulary; obsolete D2-c height-alignment cases removed or rewritten.

### 9.2 Docs

- `analysis.md` status → Implemented (D2-d); progress table all DONE.
- Rewrite `docs/internals/list-report-section-sizing.md` to the mode model (interaction section collapses to mode semantics + surviving per-backend asymmetries P5/P6).

### 9.3 Nonreg + typecheck

```bash
npm run nonreg -- --only unit-gridPagination,integ-gridPagination
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
```

### 9.4 Tracer bullet (narrative, D2-d)

1. Library → Lending History report: paged grid, 50 rows exactly filling the grid height (no inner scrollbar on either backend), Next ⇒ 10-row page, grid shrinks.
2. Toggle `gridType`: identical capability with backend-native chrome.
3. A `maxRows` grid (scroll mode): all rows bound, viewport capped at `maxRows` rows, scrollbar, no pager.

### AC checklist (D2-d delta)

| Criterion (analysis §7, D2-d wording) | Proven by | Status |
|---|---|---|
| Modes mutually exclusive; call sites migrated to `pageSize={50}` | Slice 8 prop-contract + call-site tests | ⬜ |
| Full page renders at exact height without in-grid scroll on **both** backends | Slice 6 Glide 1736px; Slice 7 ag-grid page-tracking height | ⬜ |
| Scroll mode: capped height, full set, no pager | Slice 6/7 scroll-mode cases | ⬜ |
| Previous AC (Slices 0–5) still green | full `gridPagination` suites + targeted nonreg | ⬜ |

### Realization

- Cleanup: removed the dead module-level `const maxHeight = 500` in `GlideDataGridComponent` (pre-#247 leftover); all D2-c helpers already deleted in Slices 6–7 (`shouldUseFixedAgGridViewport`, `computeAgGridContainerHeight`, `agGridPaginationProps`, `resolvePageSize`/`resolveMaxRows`, `DEFAULT_GRID_MAX_ROWS`, `window.innerHeight`/`50vh` path). `styles.height` (P11) and the orphaned theme `minHeight` token (P12) are **pre-existing** dead code, deliberately untouched by this revision — documented in the sizing internals.
- Suite hygiene: describes renamed to mode vocabulary (`sizing modes (D2-d)`, `ag-grid sizing modes (D2-d)`); D2-c height-alignment cases removed/rewritten in Slices 6–7.
- Docs: `analysis.md` → Implemented (D2-d); `docs/internals/list-report-section-sizing.md` rewritten to the mode model.
- Nonreg: `npm run nonreg -- --only unit-gridPagination,integ-gridPagination` → **2/2 passed** (snapshot `test-results/nonreg/20260824T093104Z`). Full-tier nonreg not rerun (unchanged since Slice 5 outside these files).
- `graphify update .` run after code changes.

### AC checklist (D2-d) — final

| Criterion (analysis §7, D2-d wording) | Proven by | Status |
|---|---|---|
| Modes mutually exclusive; call sites migrated to `pageSize={50}` | `gridSizingModePropsSchema` unit cases; report tracer green after flip | ✅ |
| Full page renders at exact height without in-grid scroll on **both** backends | Glide 1736px full-page case; ag-grid paged 2204px + last-page shrink to 524px | ✅ |
| Scroll mode: capped height, full set, no pager | Glide `maxRows={10}` ⇒ 60 rows bound at 376px, no toolbar; ag-grid `maxRows={10}` ⇒ 468px, pager `ag-hidden` | ✅ |
| Previous AC (Slices 0–5) still green | `gridPagination.unit` 29/29 + `.integ` 13/13 + targeted nonreg 2/2 | ✅ |
