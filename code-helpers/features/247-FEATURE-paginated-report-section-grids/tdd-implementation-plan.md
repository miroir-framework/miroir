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
Working branch: TBD at implementation start.

**Resume note:** plan written; no slice started.

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
| 0 | Characterize current viewport behavior (height regimes, `maxRows` ignored, no pagination API) | ⬜ | `gridPagination.247.phase0.unit` |
| 1 | Tracer: ag-grid native pagination on `EntityInstanceGrid`, `pageSize` prop locked | ⬜ | `gridPagination.247.phase1.integ` |
| 2 | Shared primitives + Glide custom pager in `GlideDataGridComponent` (slice after sort/filter, reset/clamp) | ⬜ | `gridPagination.247.phase2.unit` + `.integ` |
| 3 | `ValueObjectGrid` both backends (TestResultsGrid path) | ⬜ | `gridPagination.247.phase3.integ` |
| 4 | Height alignment + `maxRows` wired as viewport-height basis (D2-c completion) | ⬜ | `gridPagination.247.phase4.unit` |
| 5 | Nonreg, docs, cleanup, AC | ⬜ | nonreg steps + tracer narrative |

---

## Locked implementation defaults

Copied from the analysis decision record as confirmed with the user (2026-08-24); binding for this plan. Deviations go into the slice's Realization.

| Decision | Choice |
|---|---|
| D1 — Implementation shape | **Option C**: shared Miroir pagination primitives (pure page math + hook + pager component); amended by D5-b for chrome (see analysis §5, revised) |
| D2 — `maxRows` vs `pageSize` | **D2-c (user)**: keep both independent — `pageSize` (new, default `50`) drives paging; `maxRows` stays a separate viewport-height hint and gets wired to height in Slice 4. No alias |
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
| Issue test directory | `packages/miroir-standalone-app/tests/4_view/issues/247-paginated-report-section-grids/` |
| Phase test files | `gridPagination.247.phase0.unit.test.tsx` · `phase1.integ.test.tsx` · `phase2.unit.test.ts` · `phase2.integ.test.tsx` · `phase3.integ.test.tsx` · `phase4.unit.test.tsx` |
| Final feature-named files (after Slice 5 cleanup) | `tests/4_view/gridPagination.unit.test.ts(x)` · `tests/4_view/gridPagination.integ.test.tsx` |
| Nonreg steps | `unit-gridPagination` · `integ-gridPagination` (tier `unit`, after the `integ-listDisplayByTransformer` precedent) |
| New shared module | `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Grids/gridPagination.ts` (`paginateRows`, `useClientPagination`) + `GridPaginationToolbar.tsx` |

---

## Test execution conventions

| Purpose | Command |
|---|---|
| All #247 phases | `npm run testByFile -w miroir-standalone-app -- gridPagination.247` |
| Single phase | `npm run testByFile -w miroir-standalone-app -- gridPagination.247.phaseN[.unit/.integ]` |
| Type check | `npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json` |
| Targeted nonreg | `npm run nonreg -- --only unit-gridPagination,integ-gridPagination` |
| Full safety net | `npm run nonreg` |

Vitest justification (required per skill): every test file here is vitest because grid pagination is React view-layer behavior — no transformer / query / action / runner ML surface exists for it, so no MiroirTest type applies.

---

## Slice 0 — Characterize current grid viewport behavior

**Status:** ⬜ pending

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

<Appended on completion, together with Status ✅ DONE: what was actually done, deviations, problems met & solved.>

---

## Slice 1 — Tracer: ag-grid native pagination on `EntityInstanceGrid`

**Status:** ⬜ pending

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

<Appended on completion, together with Status ✅ DONE.>

---

## Slice 2 — Shared primitives + Glide custom pager

**Status:** ⬜ pending

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

<Appended on completion, together with Status ✅ DONE.>

---

## Slice 3 — `ValueObjectGrid` both backends (TestResultsGrid path)

**Status:** ⬜ pending

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

<Appended on completion, together with Status ✅ DONE.>

---

## Slice 4 — Height alignment + `maxRows` honesty (D2-c completion)

**Status:** ⬜ pending

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

<Appended on completion, together with Status ✅ DONE.>

---

## Slice 5 — Nonreg, docs, cleanup, AC

**Status:** ⬜ pending

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
| Report list sections show Prev/Next (or equivalent) when filtered total > page size | phase1 (ag-grid pager), phase2 (Glide pager) | ⬜ |
| Only the current page's rows bound; full-list scrollbar not primary navigation | phase1 row-presence assertions; phase4 height-exact assertions | ⬜ |
| Works for `gridType: "ag-grid"` and `"glide-data-grid"` | phase1 + phase2 + phase3 (both backends each) | ⬜ |
| Sort/filter or input changes reset/clamp page; never an empty page while `total > 0` | phase2 hook clamp/reset + Glide filter integ; ag-grid native (pages after sort/filter) | ⬜ |
| `pageSize` configurable via grid props; default `50`; `maxRows` call sites keep working (independent height hint, D2-c) | phase1 `pageSize={20}`; phase4 `maxRows` height test; phase0→4 call-site regression | ⬜ |
| Integration check: first page, last short page, `pageCount ≤ 1` (pager hidden / controls disabled) | phase1 (ag-grid disabled controls), phase2 (Glide hidden pager), phase2 unit boundaries | ⬜ |

### Realization

<Appended on completion, together with Status ✅ DONE.>
