# 61 — TDD Implementation Plan: revive UI render / refresh insights

> Follow-up to [#61](https://github.com/miroir-framework/miroir/issues/61) (*FEATURE: include performance monitoring for UI components*).
> Goal: restore meaningful **per-component refresh counts** (and optional timing) along the ReportPage tree, in the **visual-debug** style, with **depth-limited aggregates**, and **near-zero cost when the mode is off**.
> Each cycle follows red → green; tests describe **behavior**, not implementation.

Related ruins / prior art in-tree:

| Piece | Role today | Pain |
|---|---|---|
| `useRenderTracker` / `renderCountTracker.ts` | Navigation-scoped + total render counters | Always increments (even when display is off); UI is plain `"X renders: N (total: M)"` text |
| `RenderPerformanceMetrics` / `renderPerformanceMeasure.tsx` | Timing stats (count, last/avg/min/max ms) | Floating `PerformanceDisplayContainer` modal is awkward and often empty; `performanceConfig.enabled` defaults **true** and is **not** tied to the AppBar timer |
| `PerformanceDisplayContainer` + `DraggableContainer` | Polling modal (“Performance Stats”) | Detached from the component tree; hard to relate stats to ReportPage structure |
| `JsonDisplayHelper` (`DebugHelper.tsx`) + `showDebugInfo` | Orange “visual debug” bars (`🔍 ComponentName (N items)`) | Shows **debug payload item counts**, not renders; already the visual language users recognise |
| AppBar bug / timer toggles | `showDebugInfo` / `showPerformanceDisplay` in `MiroirContextReactProvider` | Two modes; performance collection is not consistently gated by the timer |

Screenshots motivating this plan: plain-text render ruins under the AppBar + empty floating Performance Stats modal; and the orange visual-debug bars wrapping Report / editor components.

### Prior commits (git history)

Incremental work already landed under #61 (oldest → newer themes):

| Commit theme | Examples |
|---|---|
| Instrumentation of ReportSectionEntityInstance / Jzod type-check paths | `c26c17695`, `f75b20fd6` |
| `RenderPerformanceMetrics` + `PerformanceDisplayContainer` on ReportPage | `73e55fe43`, `b087e638a` |
| Enable/disable stats; AppBar toggle; nav-scoped render counts down Report tree | `dfaa833b7`, `d0f551e45`, `2e6ce7d63` |
| Persist metrics across instance reports; draggable Performance Stats | `706a28b84`, `fa3870e4f` |

Related visual-debug UX (separate issue): `#162 FEATURE: improve visual debug` (`8e937f11f`, `f127a1f1f`) — align revival chrome with that trend.

---

## 1. Problem statement

Limiting React refreshes to the minimum needed for visual consistency with model state (MVC) is how Miroir feels “reactive”. Developers need an **on-demand, in-place** view of:

1. **How many times** each Report-tree component rendered since last navigation (and lifetime total).
2. Optionally **how long** those renders took (avg / min / max).
3. A **readable hierarchy**: hide deep leaves, and still see a **subtree summary** (avg, min path, max path).

Constraints from #61:

- Runtime mode driven by **global context** (and usable in performance tests).
- When measuring is **off**, overhead must be **negligible**.
- Persistent storage / long-term history can be deferred (sub-issue); this plan focuses on **live session insights + optional JSON export**.

---

## 2. Codebase analysis (current state)

### 2.1 Issue #61 acceptance (source of truth)

From the issue body:

- Performance monitoring at runtime via a **performance-enabled mode in global context**.
- Also usable during **performance tests**.
- Impact when disabled must be **negligible**.
- Persistent storage & display of monitoring stats: study here or split later.

### 2.2 What still works (the “ruins”)

Instrumented Report-path components call `useRenderTracker(name, navigationKey)` and, when `showPerformanceDisplay` is true, render a line like:

```text
RootComponent renders: 4 (total: 38)
ReportSectionViewWithEditor renders: 2 (total: 30)
ReportSectionEntityInstance renders: 4 (total: 20)
```

Call sites (non-exhaustive): `RootComponent`, `ReportPage`, `ReportSectionViewWithEditor`, `ReportSectionEntityInstance`, `ReportSectionListDisplay`, `ReportSectionMarkdown`, `GraphReportSectionView`, `ModelDiagramReportSectionView`.

Tests already assert this text in places (e.g. `GraphReportSectionView.test.tsx` expects `/GraphReportSectionView renders:/` when `showPerformanceDisplay={true}`).

### 2.3 Parallel timing pipeline (underused / awkward)

- `performance.now()` bracketing exists in some components (`ReportSectionMarkdown`, `ValueObjectGrid`); commented out in `JzodElementEditor` / `TypedValueObjectEditor`.
- `ValueObjectGrid` correctly gates collection with `if (context.showPerformanceDisplay)` before `trackRenderPerformance`.
- Most other call sites either always call the tracker, or rely on `getPerformanceConfig().enabled` (default **true**), so timing can accumulate while the UI toggle is off.
- `ReportDisplay` mounts `PerformanceDisplayContainer` only when the timer is on; the container polls every N ms and shows a floating panel.

### 2.4 Visual-debug trend (target UX language)

`JsonDisplayHelper` (`packages/miroir-react/src/components/helpers/DebugHelper.tsx`):

- Gated by `showDebugInfo` when `debug={true}`.
- Orange/warning chrome, collapsible header, persisted open state in `sessionStorage`.
- Header shows `🔍 {componentName} ({N} item[s])` — today **N = debug elements**, not renders.

Many Report / editor components already wrap themselves with `JsonDisplayHelper`. That nesting **is** the natural place to surface render insights without a separate floating modal.

### 2.5 Critical footprint bug

```ts
// useRenderTracker — always mutates the singleton Map
export const useRenderTracker = (componentName, navigationKey) => {
  return renderCountTracker.trackRender(componentName, navigationKey);
};
```

Display is gated; **collection is not**. Same pattern risk for any unconditional `performance.now()` / `trackRenderPerformance` call.

### 2.6 Adjacent history (why this matters)

Refresh storms on ReportPage / Jzod editors have been diagnosed repeatedly (`code-helpers/features/108/analysis.md`, `157-.../infinite-refresh-loop-analysis.md`). A trustworthy, low-friction render map is the primary tool for catching MVC-inconsistent refresh cascades early.

### 2.7 Docs gap

`docs/guides/advanced/performance.md` is listed in the documentation structure as **Coming Soon**. This revival should leave a short developer note once behaviour is stable (optional Phase 7 deliverable; not blocking).

---

## 3. Design decisions — **SETTLED** (Phase 0, 2026-07-18)

| # | Decision | Choice | Rationale |
|---|---|---|---|
| D1 | Collection gate | **Single source of truth**: `context.showPerformanceDisplay` **or** explicit performance-test flag. Sync `performanceConfig.enabled` from that gate. | Matches #61; fixes always-on Map writes |
| D2 | Count vs timing | Track **render counts always when mode is on**; track **timing only when mode is on** and optionally when duration ≥ threshold | Counts diagnose refresh storms; timing is secondary |
| D3 | Primary UI | **Inline visual-debug chrome** (extend or sibling of `JsonDisplayHelper`), not the floating modal | Same language as bug toggle; tied to component identity |
| D4 | Summary UI (replaces awkward modal) | Compact **docked summary** (e.g. under AppBar or right drawer) + AppBar timer remains master toggle. Optional “Export JSON” / “Clear”. No default free-floating window | Modal was detached and empty-feeling |
| D5 | Hierarchy / path identity | Component **type name** + **formik path** when siblings share a name. Prefer formik path over `reportSectionPath` — the latter is not deep enough to identify displayed instance attributes. | Unique identity for attribute-level editors |
| D6 | Depth collapse | **Default maxDepth** (proposal: **2**) + **live on-page control** while rendering (session-persisted). User can raise depth for more detail or lower it to limit chrome. | One default, adjustable per investigation |
| D7 | Aggregate fields | For a collapsed subtree: `nodeCount`, `sumRenders`, `avgRenders`, `minRenders` + path, `maxRenders` + path; optional timing averages if timing enabled | Matches requested summary |
| D8 | Off-path cost | Hot path: `if (!isPerformanceMode) return NOOP_COUNTS` — **no** Map lookup, **no** `performance.now()`, **no** React state for metrics | #61 negligible-impact rule |
| D9 | React Profiler | Optional later for automated performance tests (`JzodElementEditorTestTools` already wraps `<Profiler>`). Not required for interactive visual debug | Keep interactive path simple |
| D10 | Persistence | Session only (counts + UI prefs including `maxDepth`). Long-term store = future sub-issue | Keep scope tight |
| D11 | Debug vs timer toggles | **Independent**: bug (`showDebugInfo`) and timer (`showPerformanceDisplay`) stay separate AppBar toggles — no shared tabbed panel. | User decision Phase 0 |
| D12 | Perf vs visual-debug chrome | **Themable + compact**: `theme.components.renderInsight` (resolved like appBar/tooltip; teal defaults; never warning). Inline chips (`fit-content` pills); summary docked **at top**, **folded by default**. Chip font ~12px / summary ~13px. Overlay attrs distinct from visual-debug. | Prevent mixup + legibility; homogeneous theming |



### 3.1 Articulation: maxDepth vs other detail-hiding mechanisms

These layers must **not** be conflated. Each hides a different kind of detail:

| Mechanism | Controlled by | What it hides | Orthogonal to maxDepth? |
|---|---|---|---|
| Timer off | `showPerformanceDisplay` | **All** insight collection + insight UI | Yes — master gate; maxDepth irrelevant when off |
| Bug off | `showDebugInfo` | `JsonDisplayHelper` debug payload bars only | **Yes** — does not hide render-insight chrome; timer can be on alone |
| JsonDisplayHelper fold | Per-component ▸/▾ | Debug **payload** contents under that bar | **Yes** — header (and sibling insight badge) still visible; fold ≠ depth |
| **maxDepth** | Live control on page (docked summary) | **Inline insight headers** deeper than N; replaces them with an **aggregate chip** on the last visible ancestor | — |
| Formik / outline folded attributes | Editor fold state | Actual attribute **editors / values** in the form | **Yes** — product UX, not performance chrome |
| Docked summary list | Same `maxDepth` setting | How the summary **lists** nodes (full vs aggregated below depth) | **Same control** as inline — one knob drives both surfaces |

**Rules**

1. Raising maxDepth on the page reveals more inline insight headers (and more summary rows); lowering collapses them into aggregates — without affecting bug bars, form folds, or whether the timer is on.
2. maxDepth never unmounts or skips rendering of real Report/editor components; it only affects **insight chrome**.
3. Bug fold and maxDepth can both apply on the same screen: a deep `JzodElementEditor` may have its debug payload folded (bug) while its render count is already aggregated into a parent chip (timer/maxDepth).
4. The maxDepth control lives on the **rendered page** (performance summary UI), not only in a global settings screen, so the investigator can dial detail up/down without leaving the report.

---

## Phase 0 — Lock design decisions ✅

**Deliverable**: §3 settled (2026-07-18).

Confirmed:

1. Inline visual-debug as primary UI (D3).
2. Docked summary replaces floating modal as default (D4).
3. Collection strictly gated (D1 / D8).
4. Independent bug / timer toggles (D11).
5. Sibling identity via **formik path** (D5); `reportSectionPath` insufficient for attribute depth.
6. Default maxDepth + **live on-page** adjustment; articulated with other hiding layers (§3.1).

---


## 4. Target architecture (sketch)

```
┌─────────────────────────────────────────────────────────────┐
│ AppBar  [🐛 debug] [⏱ performance]                          │
│         performance ON → showPerformanceDisplay = true      │
│                         performanceConfig.enabled = true    │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────┐     register/path     ┌──────────────────────────┐
│ useRenderInsight()   │──────────────────────▶│ RenderInsightRegistry    │
│  - early exit if off │                       │  counts + optional timing│
│  - path + depth      │                       │  subtree aggregates      │
└──────────────────────┘                       └──────────────────────────┘
        │                                              ▲
        │ inline badge                                 │ poll / subscribe
        ▼                                              │
┌──────────────────────┐                       ┌──────────────────────────┐
│ RenderInsightHeader  │  (visual-debug style) │ RenderInsightSummary     │
│ 🔍 Name  ×4 nav / 38 │                       │ docked: totals, depth,  │
│ [aggregate if deep]  │                       │ clear, export, threshold│
└──────────────────────┘                       └──────────────────────────┘
```

**Near-zero when off:** `useRenderInsight` returns a frozen noop object; `RenderInsightHeader` returns `null`; summary unmounts; registry receives no writes.

---

## 5. Test execution conventions

All commands from the relevant package unless noted.

| Script | Package | Purpose |
|---|---|---|
| `npm test -- <pattern>` | `miroir-standalone-app`, `miroir-react` | Filter by describe/it |
| `npm run testByFile -- <path>` | same | Single file, verbose |
| Prefer pure unit tests for registry/aggregates under `packages/miroir-standalone-app/tests/4_view/` or a shared `tools/` test file | — | Fast red/green |

**Legend**

| Label | Meaning |
|---|---|
| **Progress (RED)** | New test(s) must fail before implementation |
| **Progress (GREEN)** | Same test(s) pass after implementation |
| **Non-regression** | Existing GraphReport / Report display tests stay green (update assertions to new chrome if UI changes) |

Vertical slices only (one behaviour → one test → minimal code). Do **not** write the whole suite then implement.

---

## 6. High-level phase structure

```
Phase 0 — Lock design decisions D1–D11                         [DONE]
Phase 1 — Gated registry + noop when off                       slices 1.1–1.4   [DONE]
Phase 2 — Paths, depth, subtree aggregates                     slices 2.1–2.4   [DONE]
Phase 3 — Visual-debug inline header                           slices 3.1–3.3   [DONE]
Phase 4 — Migrate Report-tree call sites (replace text ruins)  slices 4.1–4.3   [DONE]
Phase 5 — Docked summary (retire default floating modal)       slices 5.1–5.3   [DONE]
Phase 6 — Timing + threshold + export                          slices 6.1–6.3   [DONE]
Phase 7 — Acceptance: footprint + docs note                    slices 7.1–7.2   [DONE]
```

---

## Phase 1 — Gated registry (counts) with near-zero off path ✅

**Status (2026-07-18)**: slices 1.1–1.4 green.

| Slice | Deliverable |
|---|---|
| 1.1 | `RenderInsightRegistry.trackRender({ enabled })` — no Map writes when off |
| 1.2 | `useRenderInsight` early-returns `NOOP_RENDER_COUNTS`; `useRenderTracker` re-exports it |
| 1.3 | Navigation-key reset covered by unit test |
| 1.4 | `applyPerformanceDisplayGate` + AppBar wiring; `performanceConfig.enabled` default **false**; init syncs from `showPerformanceDisplay` session flag |

### 1.1  Registry records a render only when mode is enabled

**Behavior**: `trackRender({ componentId, navigationKey, enabled })` increments when `enabled === true`; when `enabled === false`, returns zeros and leaves registry empty.

**Progress (RED)** → unit test on pure registry module (no React).

**Progress (GREEN)** → extract/evolve `RenderCountTracker` into `RenderInsightRegistry` with explicit `enabled` argument (or internal gate set from context once).

### 1.2  Hook reads gate before any work

**Behavior**: `useRenderInsight(componentId, navigationKey)` does not call into the registry when `showPerformanceDisplay` is false.

**Progress (RED)** → unit/hook test with mock context; spy that registry `track` is never called when off.

**Progress (GREEN)** → implement early return; keep `useRenderTracker` as thin deprecated alias **or** migrate in Phase 4.

### 1.3  Navigation key still resets navigation-scoped count

**Behavior**: same as today — changing `navigationKey` resets `navigationCount` to 1, keeps `totalCount`.

**Non-regression** from current `RenderCountTracker` semantics.

### 1.4  Sync `performanceConfig.enabled` with AppBar timer

**Behavior**: toggling `setShowPerformanceDisplay(true/false)` sets `performanceConfig.enabled` accordingly (and clears metrics when turning off — optional but recommended).

**Progress (RED/GREEN)** → small unit or provider test.

---

## Phase 2 — Paths, depth filter, aggregates ✅

**Status (2026-07-18)**: slices 2.1–2.4 green.

| Slice | Deliverable |
|---|---|
| 2.1 | `formikPath` → `pathKey` (`Component@path`); `getSnapshot()` with `depth` |
| 2.2–2.3 | `summarizeTree(nodes, { maxDepth })` + aggregate (count/avg/min/max+path) |
| 2.4 | `get/setRenderInsightMaxDepth` — default **2**, sessionStorage, live clamp |

### 2.1  Register with parent path / absolute path

**Behavior**: `trackRender` accepts identity built from **component name + formik path** (when available) so siblings are distinguishable. Prefer formik path over `reportSectionPath` for attribute-level nodes. `getSnapshot()` returns nodes keyed by path string.

**Progress (RED/GREEN)** → unit tests for path keying and sibling uniqueness via formik path.

### 2.2  Depth truncation API

**Behavior**: `summarizeTree(nodes, { maxDepth })` returns:

- full nodes with `depth <= maxDepth`
- for each node at `maxDepth` that has descendants: an `aggregate` object

### 2.3  Aggregate contents

**Behavior**: aggregate includes at least:

| Field | Meaning |
|---|---|
| `descendantCount` | how many nodes hidden |
| `avgNavigationRenders` | average of navigation counts in subtree |
| `min` | `{ path, navigationCount }` |
| `max` | `{ path, navigationCount }` |
| `sumNavigationRenders` | optional, useful for totals |

**Progress (RED/GREEN)** → pure function tests with a fixture tree (Root → Section → EntityInstance → Jzod\* leaves).

### 2.4  Persist maxDepth in sessionStorage + live on-page control

**Behavior**: default maxDepth **2**; user can change it on the rendered page (docked summary). Change survives reload within the session. Same setting drives inline chrome and summary list aggregation (§3.1).

---

## Phase 3 — Visual-debug inline header ✅

**Status (2026-07-18)**: slices 3.1–3.3 green.

| Slice | Deliverable |
|---|---|
| 3.1 | `RenderInsightHeader` — null when timer off; **info** chrome (D12, not warning); `×N · ΣM` |
| 3.2 | Aggregate chip when `aggregate` prop set |
| 3.3 | **Option B**: sibling to `JsonDisplayHelper`; independent of `showDebugInfo` |

### 3.1  `RenderInsightHeader` component

**Behavior**:

- Renders nothing when performance mode is off.
- When on: **info**-styled bar (D12) — cool palette / dashed left rail / `perf` badge — deliberately *not* the amber `JsonDisplayHelper` warning chrome.
- Shows `componentName`, `navigationCount`, `totalCount` (compact: `×4 · Σ38`).

**Progress (RED)** → RTL test: off → null; on → accessible text / test id.

### 3.2  Aggregate chip when depth exceeded

**Behavior**: if node has `aggregate`, header shows e.g. `▾ 12 below · avg 3.2 · min P… ×1 · max Q… ×18` instead of listing children.

### 3.3  Optional merge with `JsonDisplayHelper`

**Behavior**: **B** — keep `RenderInsightHeader` as a sibling immediately above/below existing debug bars (no merge into `JsonDisplayHelper` yet).

**Non-regression**: existing debug-info tests / behaviour unchanged when timer is off; insight header does not require `showDebugInfo`.

---

## Phase 4 — Migrate Report-tree call sites (kill the text ruins) ✅

**Status (2026-07-18)**: slices 4.1–4.3 done.

| Slice | Deliverable |
|---|---|
| 4.1 | `RootComponent`, `ReportPage` → `RenderInsightHeader` |
| 4.2 | `ReportSectionViewWithEditor` (+ formik path), `ReportSectionEntityInstance` (+ formik path) |
| 4.3 | `ListDisplay`, `Markdown`, `Graph`, `ModelDiagram`; coverage via `GraphReportSectionView.renderInsight.unit.test.tsx` |

Plain `"X renders: N (total: M)"` text removed from Report-tree sources.

### 4.1  Replace plain `<ThemedText>… renders: …</ThemedText>` with `RenderInsightHeader`

**Progress (RED)** → update GraphReport assertions / dedicated unit test for `render-insight-header` test id.

### 4.2  Pass stable paths

Use **formik path** for identity (`ReportSectionEntityInstance`, section formik definition path where available).

### 4.3  Remove dead commented timing blocks or re-wire them in Phase 6

Do not leave half-enabled `performance.now()` in hot editors without the gate.

---

## Phase 5 — Docked summary (retire awkward modal) ✅

**Status (2026-07-18)**: slices 5.1–5.3 green.

| Slice | Deliverable |
|---|---|
| 5.1 | `RenderInsightSummary` — docked strip, not `DraggableContainer` |
| 5.2 | `ReportDisplay` mounts summary; `PerformanceDisplayContainer` deprecated |
| 5.3 | Empty-state copy + live maxDepth control on the page |

### 5.1  `RenderInsightSummary` panel

**Behavior**:

- Mounted only when performance mode is on (e.g. from `ReportDisplay` or `RootComponent`).
- Shows session totals, active node count, maxDepth control, Clear, Export JSON.
- **Not** a free-floating `DraggableContainer` by default (docked strip / collapsible drawer). Keep `DraggableContainer` available behind an explicit “detach” control if still useful.

### 5.2  Remove / demote `PerformanceDisplayContainer` default usage

**Behavior**: `ReportDisplay` uses the new summary; old container deleted or relegated to optional.

### 5.3  Empty state copy

**Behavior**: if mode just turned on and no instrumented nodes rendered yet, show a one-liner: “Interact with the report — instrumented components will appear here.” (Avoid the large empty modal feeling.)

---

## Phase 6 — Timing stats (secondary) ✅

**Status (2026-07-18)**: slices 6.1–6.3 green.

| Slice | Deliverable |
|---|---|
| 6.1 | `durationMs` on `trackRender` → last/min/max/avg on snapshot |
| 6.2 | Header shows last ms ≥ threshold; summary sorts by `totalRenderTime` |
| 6.3 | `ValueObjectGrid` feeds registry with gated `durationMs` (pattern) |

### 6.1  Optional duration recording behind same gate

**Behavior**: `trackRender(..., { durationMs })` updates min/avg/max only when mode on; threshold still applies to **logging/display**, but counts always update when mode on.

### 6.2  Show timing on header / summary selectively

**Behavior**: summary lists hottest paths by `totalRenderTime`; inline header can show last ms when above threshold.

### 6.3  Re-enable gated timing in high-value editors

`JzodElementEditor` / `TypedValueObjectEditor` / grids — only with `if (showPerformanceDisplay)` guard (mirror `ValueObjectGrid`).

---

## Phase 7 — Acceptance & docs ✅

### 7.1  Footprint acceptance test ✅

**Behavior**: with `showPerformanceDisplay === false`, after N simulated renders of a fixture component:

- registry size stays 0
- no `trackRender` calls
- no summary / header in the document

**Progress (GREEN)** → `tests/4_view/renderInsightFootprint.acceptance.unit.test.tsx` (#61 negligible-impact gate).

### 7.2  Short developer note ✅

`docs/guides/advanced/performance.md` — timer toggle, depth filter, instrumenting with `useRenderInsight`.

---

## 7. Suggested first tracer bullet (start here)

1. **RED**: unit test — registry ignores tracks when `enabled: false`.
2. **GREEN**: implement gate on registry.
3. **RED**: hook test — `useRenderInsight` does not touch registry when context flag is false.
4. **GREEN**: early-return hook.
5. **RED**: RTL — `RenderInsightHeader` hidden when off, shows counts when on.
6. **GREEN**: header component.
7. Wire **one** call site (`ReportSectionViewWithEditor`) replacing the text ruin; update its test.
8. Stop and demo; then continue Phase 2 aggregates.

---

## 8. Out of scope (explicit)

- Long-term persistent metrics store / historical dashboards (#61 sub-issue).
- Automatic detection of “unnecessary” refreshes (would need model-version comparison — future).
- Replacing React DevTools Profiler for deep flamegraphs.
- Changing production logging levels or Redux selector caching (related but separate from display revival).

---

## 9. File touch map (expected)

| Area | Files |
|---|---|
| Registry / hook | `packages/miroir-standalone-app/src/miroir-fwk/4_view/tools/renderCountTracker.ts` → evolve or replace with `renderInsightRegistry.ts` + `useRenderInsight.ts` |
| Timing | `renderPerformanceMeasure.tsx`, `performanceConfig.ts` |
| UI | new `RenderInsightHeader.tsx`, `RenderInsightSummary.tsx`; demote `PerformanceDisplayContainer.tsx` |
| Visual debug | possibly `packages/miroir-react/.../DebugHelper.tsx` |
| Context / AppBar | `MiroirContextReactProvider.tsx`, `AppBar.tsx` |
| Call sites | Report tree components listed in §2.2 |
| Tests | new registry/aggregate unit tests; update `GraphReportSectionView.test.tsx` et al. |

---

## 10. Success criteria

- [x] Timer **off** → no registry writes, no insight UI, no floating modal (footprint test green).
- [x] Timer **on** → ReportPage spine shows visual-debug-style refresh badges with nav/total counts.
- [x] Depth control hides deep leaves and shows **avg / min path / max path** aggregates.
- [x] Docked summary replaces the default awkward Performance Stats modal.
- [x] Existing refresh-diagnosis workflow (catch MVC-inconsistent cascades) is faster than reading plain-text ruins.
- [x] Implementation landed via vertical TDD slices in Phases 1–7.
