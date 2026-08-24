# 247 — Paginated report section grids (shared Miroir pagination layer)

> Replace scroll-only browsing of large report list grids with **next/prev page navigation**,
> built on a **shared Miroir pagination layer** (page math + hook + pager primitives) feeding
> both **ag-grid** (native pager chrome) and **glide-data-grid** (Miroir pager chrome).

Related issue: https://github.com/miroir-framework/miroir/issues/247  
Related: [#129](https://github.com/miroir-framework/miroir/issues/129) (dynamic grid render choice) ·
[#214](https://github.com/miroir-framework/miroir/issues/214) (partial fetch — orthogonal) ·
[#85](https://github.com/miroir-framework/miroir/issues/85) (Surface / UI Grid pages — later) ·
[#79](https://github.com/miroir-framework/miroir/issues/79) (multi-criteria sort)

Key sources:
[`ReportSectionListDisplay.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportSectionListDisplay.tsx) ·
[`EntityInstanceGrid.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Grids/EntityInstanceGrid.tsx) ·
[`GlideDataGridComponent.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Grids/GlideDataGridComponent.tsx) ·
[`ValueObjectGrid.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Grids/ValueObjectGrid.tsx) ·
[`ViewParams.ts`](../../../packages/miroir-core/src/0_interfaces/4-views/ViewParams.ts)

**Document role:** analysis and architectural decision record.  
**Status:** **Implemented** (2026-08-24). All decisions **Accepted** (user, 2026-08-24): D1-C, **D2-c**, D3-a, D4-a, **D5-b** — D2 and D5 resolved **against** the original proposals (kept below with rejection rationale). TDD plan: [`./tdd-implementation-plan.md`](./tdd-implementation-plan.md).

**Document history:** first revision (2026-08-24) — confirmation round flipped D2 to **D2-c** (independent props, no alias) and D5 to **D5-b** (backend-native chrome), and fixed state/pager placement **per backend**. §5 (target design), §6 (verdicts) and Goal 3 updated accordingly; the originally proposed D2-b / D5-a frames are preserved as rejected options.

---

## Decision record

| Decision | Choice |
|---|---|
| D1 — Implementation shape | **Accepted: shared Miroir pagination layer (Option C)** — shared page math / hook / pager primitives; chrome split per D5-b |
| D2 — `maxRows` vs `pageSize` | **Accepted: D2-c — keep both independent** (user): `pageSize` pages, `maxRows` stays a viewport-height hint and gets wired to height |
| D3 — Where page size is configured (v1) | **Accepted: D3-a — grid props only** — callers pass `pageSize`; no Report schema / ViewParams |
| D4 — Client vs server paging (v1) | **Accepted: D4-a — client-side only** — page the already-loaded sorted/filtered row set |
| D5 — Pagination chrome | **Accepted: D5-b — backend-native chrome** (user): ag-grid native community pager; custom Miroir pager on Glide |

**Rationale:** Both grid backends already share `EntityInstanceGrid` / `ValueObjectGrid` as the façade, and share the new pagination **primitives**; chrome is backend-native (ag-grid's mature pager where available, Miroir pager where none exists). ag-grid's native pager pages *after* its own sort/filter, which also removes the "sort within page" v1 constraint on that backend. Server-side fetch paging and Report-definition config belong to later scale / designer work (#214, #85).

### D1 — Implementation shape (ag-grid native vs Glide-only vs shared)

**Status:** Accepted — Option C (user).

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| A. ag-grid built-in pagination | `pagination` / `paginationPageSize` on `AgGridReact` | Mature controls | Glide still needs a separate path; dual UX |
| B. Glide-only page slice | Slice inside `GlideDataGridComponent` + custom Prev/Next | Fits Glide height model | ag-grid stays scroll-only; dual UX |
| **C. Shared Miroir pagination layer** ★ | Pure page math + hook + toolbar; both backends render **page rows only** | One UX; works with `gridType` switch; testable without either grid | Must place the slice **after** each backend’s effective sort/filter (see §5) |

**Decision:** D1-C. Options A/B remain available as tactical shortcuts only if a follow-up proves the shared toolbar insufficient for one backend — not the v1 path.

### D2 — `maxRows` vs `pageSize`

**Status:** Accepted — **D2-c** (user, 2026-08-24).

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| D2-a. Repurpose `maxRows` as page size | Rename semantics in place | Minimal API churn at call sites | Comment today says “controls table height”; prop is unused for height (see §3.3) |
| D2-b. Add `pageSize`; `maxRows` aliases it | New prop is the source of truth; existing `maxRows={50}` keeps working | Clear naming; backward compatible | Two names briefly — **Rejected** (user): alias muddies the split |
| **D2-c. Keep both independent** ★ | `pageSize` for paging, `maxRows` for viewport height | Orthogonality; each prop has one honest meaning | Height already uses hardcoded `50` / `50vh` — so D2-c requires actually wiring `maxRows` to viewport height (planned, Slice 4) |

**Decision:** D2-c. Default `pageSize = 50` to match today’s call sites and magic thresholds; `maxRows` keeps its documented height role and is wired to it (fixing the §3.3 misalignment) rather than aliased.

### D3 — Config locus (v1)

**Status:** Accepted — D3-a (user, 2026-08-24).

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D3-a. Grid props only** ★ | `ReportSectionListDisplay` / `TestResultsGrid` pass `pageSize` | Smallest change; no meta-model churn | Not designer-editable per section |
| D3-b. `objectListReportSection.definition.pageSize` | Extend Report section schema | Per-report authoring | Needs schema + codegen; overkill for v1 |
| D3-c. `ViewParams` global default | Persist default page size with `gridType` | User preference | Wrong granularity for list density; couples to admin ViewParams |

**Decision:** D3-a for v1. D3-b deferred toward #85. D3-c deferred unless a global preference is requested later.

### D4 — Client vs server paging (v1)

**Status:** Accepted — D4-a (user, 2026-08-24).

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D4-a. Client-side only** ★ | Page rows already in memory after report query | Fixes Lending History UX immediately; no store/API change | Full list still loaded (60 LendingHistoryItems today) |
| D4-b. Query / store page fetch | Limit/offset or cursor on extractors | True scale | Owned by #214 / #208 / cache policy #114 |

**Decision:** D4-a. Server paging stays out of #247.

### D5 — Pagination chrome

**Status:** Accepted — **D5-b** (user, 2026-08-24).

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| D5-a. Shared Miroir `GridPaginationToolbar` | Prev / Next + “showing *a–b* of *total*” (and/or page *p* of *P*) | Same chrome for both `gridType`s; themeable | Custom a11y work — **Rejected** (user): reinvents what ag-grid ships |
| **D5-b. Native ag-grid pager + custom Glide pager** ★ | Split chrome behind shared primitives | Mature controls on ag-grid (a11y, keyboard); pages after ag-grid sort/filter natively; Glide still gets one Miroir pager | Chrome differs per backend (accepted: capability parity, not chrome identity) |

**Decision:** D5-b. ag-grid community pagination (`pagination` / `paginationPageSize`, ag-grid-community ^31 — no new dependency) is enabled on the ag-grid branches; Glide branches render the shared Miroir `GridPaginationToolbar`. Option C’s shared layer remains for page math / hook / Glide chrome.

---

## 1. Goals

1. **Page through long lists** — In order to browse many instances without scrolling a tall grid as a report viewer, I can move to the next or previous page of a report list section.
2. **See a bounded page** — In order to keep the list readable as a report viewer, I can see at most `pageSize` instances at a time, with an indicator of which slice of the total I am on.
3. **Same paging capability on either grid** — In order to switch rendering without losing navigation as a report viewer, I can page with next/prev controls whether `gridType` is `ag-grid` or `glide-data-grid` (chrome is backend-native per D5-b; the capability and page semantics are identical).
4. **Stable under sort/filter** — In order not to land on an empty page after refining the list as a report viewer, changing sort or filter resets or clamps the current page against the new filtered total.
5. **Caller-configurable page size** — In order to tune density per screen as a report / UI maintainer, I can pass `pageSize` into the grid (default aligned with today’s `50`).

## 2. Non-goals

- Server-side / extractor limit-offset or cursor fetch (owned by [#214](https://github.com/miroir-framework/miroir/issues/214) / [#208](https://github.com/miroir-framework/miroir/issues/208); cache load policy [#114](https://github.com/miroir-framework/miroir/issues/114)).
- Adding `pageSize` to the Report / `objectListReportSection` Jzod schema or interactive report designer (#85).
- Unifying Glide vs ag-grid **sort/filter** into one shared pipeline (#79 and related); #247 only requires pagination to apply to the **effective** sorted/filtered list each backend already produces.
- Dynamic “optimal” grid backend selection (#129) — only consume the existing `gridType` switch.
- Changing Lending History domain data or report query shape.

---

## 3. Current state

### 3.1 Motivating report (Library Lending History)

| Asset | Uuid / path |
|-------|-------------|
| Report `LendingHistory` | `cee26a1e-be58-497c-9d15-fa6832787907` — `library_model/3f2baa83-…/cee26a1e-….json` |
| Section | `objectListReportSection`, label **Lending History Items**, `parentUuid` `e81078f3-2de7-4301-bd79-d3a156aec149`, `fetchedDataReference` `lendingHistoryItems`, `sortByAttribute` `startDate`, `sortOrder` `desc` |
| Entity `LendingHistoryItem` | `e81078f3-2de7-4301-bd79-d3a156aec149` |
| Instance count (deployment assets) | **60** JSON files under `library_data/e81078f3-…/` |

`ObjectListReportSection.definition` has **no** `pageSize` / `maxRows` field today (`miroirFundamentalType.ts` around the `ObjectListReportSection` type: `label`, `parentName`, `parentUuid`, `fetchedDataReference`, `query`, `sortByAttribute`, `sortOrder` only).

### 3.2 Call sites that pass `maxRows={50}`

| Caller | Target | Line |
|--------|--------|------|
| `ReportSectionListDisplay.tsx` | `EntityInstanceGrid` | `maxRows={50}` |
| `TestResultsGrid.tsx` | `ValueObjectGrid` | `maxRows={50}` |

No other production `maxRows={…}` call sites under `miroir-standalone-app` (aside from unrelated multiline text `maxRows` in `UIComponents.tsx`).

### 3.3 `maxRows` is declared but does not control height (misaligned)

Props document height control:

```34:34:packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Grids/EntityInstanceGridInterface.ts
  maxRows: z.number().optional(), // Maximum number of rows to show (controls table height)
```

**Glide:** `maxRows` is destructured in `GlideDataGridComponent` and **never referenced again**. Height uses a **hardcoded** threshold:

```392:395:packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Grids/GlideDataGridComponent.tsx
  const height = useMemo(() => {
    const rowCount = sortedAndFilteredTableRows.length;
    if (rowCount > 50) {
      return Math.min(window.innerHeight * 0.5, propContainerHeight??maxHeight); // 50vh but max 600px
```

**ag-grid** (`EntityInstanceGrid` and `ValueObjectGrid`): when `tableComponentRowUuidIndexSchema.length > 50`, container uses `height: "50vh"` + theme `maxHeight`, `domLayout="normal"`, `overflow: 'auto'`; otherwise `autoHeight`. **`props.maxRows` is not read** on the ag-grid branch — only forwarded into the Glide child.

**Truth table (today):**

| Condition | ag-grid | glide-data-grid |
|-----------|---------|-----------------|
| `rowCount ≤ 50` | `autoHeight`, full list visible | Exact pixel height for all rows |
| `rowCount > 50` | Fixed ~50vh viewport, **scroll**, all rows still in `rowData` | Capped ~50vh height, **scroll**, all rows still in `rows={sortedAndFiltered…length}` |
| `maxRows` prop set | Ignored for layout | Ignored for layout |

There is **no** `pageSize` / `pagination` usage under `packages/miroir-standalone-app` (grep: zero matches).

### 3.4 Dual backends behind one façade

`ViewParams.gridType`: `"ag-grid" | "glide-data-grid"` (`ViewParams.ts`).  
`EntityInstanceGrid` selects backend (`gridType === "ag-grid" ? AgGridReact : GlideDataGridComponent`).  
`ValueObjectGrid` mirrors the same pattern for non-entity / JSON array rows.

Initial list order: `EntityInstanceGrid` / `ValueObjectGrid` apply optional `sortByAttribute` when building row arrays. **Interactive** sort/filter for Glide lives **inside** `GlideDataGridComponent` (`sortState` / `filterState` → `sortedAndFilteredTableRows`). ag-grid uses its own column sort/filter on the full `rowData`.

### 3.5 What “scroll-only maxRows sections” means for #247

Sections that go through `ReportSectionListDisplay` → `EntityInstanceGrid` with `maxRows={50}` (and `TestResultsGrid` → `ValueObjectGrid`) are the concrete scroll-only list surfaces. With 60 Lending History rows, both backends are in the `> 50` scroll regime; the user cannot page.

---

## 4. Key reuse

| Piece | Location |
|-------|----------|
| Report list → grid wiring | `ReportSectionListDisplay.tsx` |
| Entity / value façades | `EntityInstanceGrid.tsx`, `ValueObjectGrid.tsx` |
| Glide sorted+filtered rows | `GlideDataGridComponent.tsx` (`sortedAndFilteredTableRows`) |
| Grid type preference | `ViewParams.gridType` — `packages/miroir-core/src/0_interfaces/4-views/ViewParams.ts` |
| Table theme height caps | `ThemeColorDefaults.ts` (`minHeight` / `maxHeight` defaults `200px` / `600px`) |
| Ag-grid theme CSS | `TableStyleGenerators.ts` (`generateAgGridStyles`) |
| Filter toolbar pattern (layout sibling) | `GlideDataGridFilterComponent.tsx` / `getFilterToolbarStyles` |
| Motivating report | `LendingHistory` `cee26a1e-…` / Entity `e81078f3-…` (60 instances) |

---

## 5. Target design (Option C, chrome split per D5-b)

### 5.1 Shared module (conceptual)

Introduce a small **view-layer** module (names illustrative):

| Export | Role |
|--------|------|
| `paginateRows(rows, pageIndex, pageSize)` | Pure: `{ pageRows, pageCount, from, to, total }` |
| `useClientPagination({ totalCount \| rows, pageSize, resetKey? })` | Page index state; `next` / `prev`; clamp on `total` / `pageSize` / `resetKey` change |
| `GridPaginationToolbar` | Theme-aware Prev / Next + range (or page) label; hidden when `pageCount ≤ 1` — **Glide-side chrome** (D5-b) |

No dependency on ag-grid or Glide packages inside the pure helpers. The ag-grid side consumes only `pageSize`, mapped onto its native pager config.

### 5.2 Where the slice applies (critical)

Issue text suggested slicing **before** handing rows to either backend. That is incorrect if taken literally today:

- Glide **re-filters/re-sorts** the full `tableComponentRows` internally.
- ag-grid **re-sorts** the full `rowData` via column headers.

**Placement for v1 (per-backend state, confirmed with user):**

1. **ag-grid branches** (`EntityInstanceGrid`, `ValueObjectGrid`): keep full `rowData`; enable native community pagination (`pagination`, `paginationPageSize = pageSize ?? 50`, `domLayout="normal"` when paging). The native pager pages **after** ag-grid’s own sort/filter, so interactive sort/filter stays correct across the whole set for free.
2. **Glide branch** (`GlideDataGridComponent`, used by both façades): `useClientPagination` + `GridPaginationToolbar` live **inside** the component, keyed on the real effective total `sortedAndFilteredTableRows.length`; the page slice is taken **after** sort/filter and feeds `rows=` / `getCellContent`. State is per-backend — no child→parent count-reporting callback, no new `useEffect` (repo rule).

**Accepted constraint for v1:** (a) initial `sortByAttribute` order is respected before paging; (b) Glide’s existing filter/sort still runs on the **full** set, then the page slice is taken; (c) page index resets/clamps when Glide filter/sort or input row identity/`resetKey` changes. (The earlier “ag-grid sorts within the page” caveat is dissolved by D5-b: the native pager pages ag-grid’s post-sort/filter row set.)

### 5.3 Height after paging

With at most `pageSize` rows in the grid:

- Prefer **exact height** for `min(pageSize, remaining)` rows (Glide already does exact height when `rowCount ≤ 50`).
- Replace hardcoded `> 50` thresholds with logic keyed on the **page** row count; per D2-c, `maxRows` (when provided) becomes the viewport-height threshold basis (`maxRows ?? 50`), finally matching its documented role (§3.3).
- Full-list scrollbar as primary navigation goes away; in-page scroll only if a single page still exceeds the viewport cap (edge case, e.g. `pageSize` large or `maxRows` small).

### 5.4 Prop flow (confirmed)

```
ReportSectionListDisplay / TestResultsGrid
  maxRows={50}              // unchanged call sites; height hint (D2-c)
    → EntityInstanceGrid / ValueObjectGrid
         pageSize?: number  // new prop, default 50 (D3-a: props only)
         → ag-grid branch:  AgGridReact pagination paginationPageSize={pageSize}  (full rowData; native pager)
         → Glide branch:    GlideDataGridComponent pageSize={pageSize}
                              → useClientPagination(totalCount = sortedAndFiltered.length)
                              → GridPaginationToolbar + rows={pageRows}
```

---

## 6. Proposals / options (summary)

| # | Proposal | Impact | Effort | Verdict |
|---|---|---|---|---|
| 1 | Shared pagination primitives + per-backend wiring (Option C, chrome per D5-b) | High (UX) | Medium | **Adopt** |
| 2 | ag-grid native pagination on the ag-grid branches | Medium | Low | **Adopt** as the ag-grid half of D5-b (no longer “only” — Glide parity comes from #1) |
| 3 | Glide-only custom pager | Medium | Low–Med | **Reject** (subsumed by #1’s Glide half) |
| 4 | Report-schema `pageSize` | Medium | Medium | **Defer** (#85) |
| 5 | Server-side page fetch | High | High | **Defer** (#214 / #208) |

---

## 7. Acceptance criteria (from issue, refined)

- [ ] Report list sections (Lending History–style `objectListReportSection`) show Prev/Next when filtered total `> pageSize`.
- [ ] Only the current page’s rows are bound into the active grid backend; full-list scrollbar is not the primary navigation.
- [ ] Works for `gridType: "ag-grid"` and `gridType: "glide-data-grid"`.
- [ ] Sort/filter (Glide) or input data changes reset/clamp page so the UI never shows an empty page while `total > 0`.
- [ ] `pageSize` configurable via grid props; default `50`; existing `maxRows` call sites keep working (independent height hint, D2-c).
- [ ] Integration-oriented check covering first page, last short page, and `pageCount ≤ 1` (toolbar hidden or controls disabled).

---

## Confirmations (resolved 2026-08-24, user)

| Item | Outcome |
|---|---|
| D2 | **D2-c** — independent `pageSize` / `maxRows` (proposal was D2-b alias) |
| D3 | **D3-a** — grid props only in v1 |
| D4 | **D4-a** — client-side paging only |
| D5 | **D5-b** — backend-native chrome (proposal was D5-a shared toolbar) |
| State / pager placement | **Per backend** (hook + pager inside each backend branch, from shared primitives); no child→parent count callback, no new `useEffect` |
| Goals §1 | Confirmed; Goal 3 reworded for D5-b (capability parity, not chrome identity) |

---

## Next step

Implementation proceeds per [`./tdd-implementation-plan.md`](./tdd-implementation-plan.md) (written via the `miroir-analysis-to-tdd-plan` skill; slices 0–5, tracer = Slice 1).
