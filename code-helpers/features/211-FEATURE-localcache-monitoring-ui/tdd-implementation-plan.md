# 211 — TDD Implementation Plan: LocalCache monitoring UI

> Switchable, low-footprint LocalCache monitor: fair **effective** heap size, separate
> **present** vs **transaction/history** indicators, per-Entity / top-10 views, and
> policy-efficiency metrics — built as vertical red→green slices.
>
> Each cycle: **one behavior test → minimal implementation**. No horizontal “all tests
> first” batches.

Related: [analysis.md](./analysis.md) · [#211](https://github.com/miroir-framework/miroir/issues/211) ·
[#61 performance monitor TDD plan](../61-FEATURE-%20include%20performance%20monitoring%20for%20UI%20components/tdd-implementation-plan.md) ·
[#208 caching design](https://github.com/miroir-framework/miroir/issues/208)

**Status:** Phases 0–8 **done** (#211 LocalCache monitoring UI TDD plan complete for v1).

---

## Implementation status

| Phase | Scope | Status |
|-------|--------|--------|
| **0** | Lock design decisions (open questions) | **Done** |
| **1** | Pure identity-aware sizing (core) | **Done** (2026-07-21) — see §Phase 1 |
| **2** | Static LocalCache image on real Redux **and** Zustand | **Done** (2026-07-21) — Library Books golden present=3922 both impls |
| **3** | `currentInfo` present-only via `estimateObjectBytes`; rich path = `measureLocalCacheMemory` | **Done** (2026-07-21) |
| **4** | Attributed per-Entity + top-10 | **Done** (2026-07-21) — present.current only; loading ignored |
| **5** | Barrier recalibration + CRUD/load deltas | **Done** (2026-07-21) — session gate + full recalibrate on action |
| **6** | Session efficiency indicators | **Done** (2026-07-22) — peak/growth, history ratio, hit/thrash stubs, top-3 share |
| **7** | UI: AppBar toggle + docked panel | **Done** (2026-07-21) — gate + summary + AppBar + ReportDisplay |
| **8** | Export / Clear / acceptance footprint | **Done** (2026-07-22) — clear/export + OFF no-op hooks |

### Phase 1 achievement log

| Slice | Result |
|-------|--------|
| 1.1 | Identity-aware `estimateObjectBytes` — shared refs counted once |
| 1.2 | Commit-aliased `previous === present` excluded from history incremental |
| 1.3 | Divergent previous + shared subtree → history ≈ non-shared only |
| 1.4 | Action payloads metadata-only (RED proven with deep-size broken) |
| Hygiene | Typed cleanly (`TransactionalInstanceAction` for `StateChanges`) |
| Fixtures | Library app: `entityBook` / `entityAuthor`, `book1`–`book6`, `author1`/`author2`, `selfApplicationLibrary`, `deployment_Library_DO_NO_USE` |

**Artifacts:** `packages/miroir-core/src/2_domain/localCacheMemoryMeasure.ts` (+ index exports); `packages/miroir-core/tests/2_domain/localCacheMemoryMeasure.unit.test.ts`

### Phase 2 achievement log

| Slice | Result |
|-------|--------|
| 2.1 | Redux static bootstrap: parts sum to effective; present matches `estimateObjectBytes(present)` |
| 2.2 | Zustand same invariants on real `LocalCache` |
| 2.3 | Cross-impl parity: Library `book1`–`book6` → `presentSnapshotBytes === 3922` (redux + zustand) |
| 2.4 | Post-rollback history incremental `< present/5` on both |

**Artifacts:** `packages/miroir-localcache-redux/tests/LocalCache.memoryMeasure.static.unit.test.ts`; `packages/miroir-localcache-zustand/tests/LocalCache.memoryMeasure.static.unit.test.ts`



---

## Test execution conventions

| Package | How to run focused tests |
|---------|--------------------------|
| `miroir-core` | From package: prefer file-scoped vitest/jest pattern used by sibling packages; avoid flaky full-suite `-t` when possible |
| `miroir-localcache-redux` | `npm run vitest -- <path>` or existing `npm test -- <pattern>` from package root |
| `miroir-localcache-zustand` | `npm run vitest -- <path>` from package root |
| `miroir-standalone-app` | Vitest unit tests under `tests/4_view/` (same style as `performanceDisplayGate.unit.test.ts`) |

**Legend**

| Label | Meaning |
|-------|---------|
| **Progress (RED)** | New test must fail before implementation |
| **Progress (GREEN)** | Same test passes after minimal implementation |
| **Non-regression** | Existing tests stay green |

---

## Phase 0 — Design decisions (settled)

Answers to [analysis.md §9](./analysis.md) plus accounting / gate choices needed to implement.

### Open questions from analysis

| # | Question | Decision | Reason |
|---|----------|----------|--------|
| **Q1** | Action sizing in patch stacks | **Patches-only for Immer `changes` / `inverseChanges`; actions sized as metadata only** (actionType / actionName / endpoint / deployment ids — **not** deep `payload`) | Action payloads almost always duplicate EntityInstances already retained in `presentModelSnapshot`. Deep-sizing them inflates “history” and destroys the fairness goal. Patches are what Immer actually retains for undo/redo of *state*; metadata keeps step count / type distribution visible without double-counting domain data. |
| **Q2** | Include `queriesResultsCache` in effective? | **Yes** — part of effective total, shown as a **third breakdown line** (`queriesResultsCacheBytes`) | It is reachable heap under the LocalCache store root. Omitting it under-reports browser RAM. A separate line prevents users from mistaking it for Entity-instance cache. |
| **Q3** | JS heap vs IndexedDB | **v1 = in-heap `StateWithUndoRedo` only.** IndexedDB / persisted cache size is **out of scope** (follow-up). UI copy says “LocalCache (in-memory)”, not “all browser storage”. | Fairness algorithm and identity walks apply cleanly to the live store. IndexedDB needs different APIs (`navigator.storage`, IDB estimates), mixes non-LocalCache data, and would delay the transparency goal. Document the wording so we do not over-claim. |
| **Q4** | One gate or two with Performance Monitor? | **Two independent gates** — `showLocalCacheMonitor` separate from `showPerformanceDisplay` | Same rationale as #61 D11 (bug vs timer): investigators often want only one instrumentation class. LocalCache walks must not run when the user only enabled render insights, and vice versa. |
| **Q5** | Zustand path | **Shared pure sizer on `StateWithUndoRedo` in `miroir-core`.** Phase **2** proves the formula on both real LocalCache impls before Phase 3 wires monitor APIs. | One formula prevents Redux/Zustand divergence. `measureLocalCacheMemory` walks only known `StateWithUndoRedo` fields (Zustand store methods on `getState()` are ignored). |

### Additional settled choices

| # | Topic | Decision | Reason |
|---|-------|----------|--------|
| **D6** | `localCacheSize` back-compat | Keep **`localCacheSize` = present snapshot bytes** (today’s semantics). Add `presentSnapshotBytes` (alias), `transactionHistoryBytes`, `queriesResultsCacheBytes`, `effectiveBytes`. | Callers of `currentLocalCacheInfo()` today expect present-only meaning. Changing it to effective would silently break any consumer that assumed “domain view size”. |
| **D7** | When is sizing computed? | **Only when LocalCache monitor gate is ON** (or explicit test helper). OFF: `currentInfo()` returns present-only via existing cheap path. Rich path = `measureLocalCacheMemory(getState())` — see Phase **3**. | Matches “negligible when off”. Avoid making every `currentInfo()` call pay whole-store walks. |
| **D8** | History incremental formula | Seed `visited` from present walk, then walk `previousModelSnapshot`, patch stacks (Q1 policy), `currentTransaction`. Sum = `transactionHistoryBytes`. | Implements analysis §8 without double-counting Immer sharing / commit aliasing. |
| **D9** | Undo/redo/commit/rollback | **Recalibration barriers** — full identity-aware snapshot recompute. CRUD/load use **attributed size-map deltas** between barriers. | Analysis challenging gap #2: incremental history math is brittle; barriers are correct and still limited if UI polls ≤1 Hz. |
| **D10** | Attributed vs heap | UI labels **Effective (heap)** vs **Attributed (per Entity)**. Attributed map covers `present.current` instances only for v1 (`loading` included in present heap but not in per-Entity table unless still present after rollback). | Prevents summing Entity rows and comparing to effective. |
| **D11** | Top-10 source | Ranked from **attributed instance size map** (present `current`), refreshed on delta or barrier — not a second full heap walk of history. | Hot spots for policy are live domain objects; history patches are opaque path ops. |
| **D12** | Efficiency indicators v1 | Implement all five from analysis, with thrash as **best-effort**: count reload of PK previously removed in-session (delete/reset), document weakness until #208 eviction exists. | Keeps secondary goal alive without blocking on eviction design. |
| **D13** | UI chrome | AppBar icon toggle + **docked collapsible panel** (RenderInsightSummary family), folded by default; poll ≤1s when ON. | Analysis §5; proven low-friction pattern from #61. |
| **D14** | Session persistence | Persist gate in `sessionStorage` (like performance display). | Diagnosis survives refresh within a session. |
| **D15** | Cross-impl static measure | Same bootstrap fixtures on Redux and Zustand; assert identical **invariant** suite; **presentSnapshotBytes** for identical instance payloads must match **exactly** (same formula + same domain graph). Measure via `measureLocalCacheMemory(localCache.getState())` — known-field walks ignore Zustand action methods. | Gate consistency of the formula on real store images before monitor gate/UI work. |

---

## Target public interface (deep module)

Small surface, deep accounting behind it:

```ts
// DomainControllerInterface / LocalCacheInfo (enriched)
interface LocalCacheInfo {
  /** @deprecated Prefer presentSnapshotBytes — kept = present snapshot size */
  localCacheSize: number;
  presentSnapshotBytes: number;
  transactionHistoryBytes: number;
  queriesResultsCacheBytes: number;
  effectiveBytes: number;
}

// Pure (miroir-core) — primary test surface for Phases 1–5
function measureLocalCacheMemory(
  state: StateWithUndoRedo,
  options?: { actionSizing?: "metadata" } // fixed to metadata+patches in v1
): LocalCacheMemoryBreakdown;

function buildAttributedInstanceIndex(
  present: LocalCacheSliceState
): AttributedInstanceSize[]; // key, bytes, entity, …

function selectTopLargest(instances: AttributedInstanceSize[], n: number): AttributedInstanceSize[];

// Gate (standalone-app) — mirror performanceDisplayGate
function applyLocalCacheMonitorGate(enabled: boolean): void;
// ON → enable collection + optional subscribe; OFF → clear buffers, no walks
```

UI reads a **monitor snapshot** (breakdown + attributed table + indicators + peak/growth) only when the gate is on — not by sprinkling walks through React components.

```
AppBar [⏱ perf] [💾 localcache]
        │
        ▼ showLocalCacheMonitor
LocalCacheMonitorSummary (docked, folded)
        │ poll / subscribe ≤1s
        ▼
measureLocalCacheMemory(localCache.getState())
 + attributed index / indicators registry
```

---

## High-level phase structure

```
Phase 1 — Pure identity-aware sizing                         slices 1.1–1.4   [DONE]
Phase 2 — Static image on real LocalCache (redux|zustand)    slices 2.1–2.4   [DONE]
Phase 3 — currentInfo present-only + shared estimateObjectBytes slices 3.1–3.3   [DONE]
Phase 4 — Attributed per-Entity + top-10                     slices 4.1–4.3
Phase 5 — Barriers + CRUD/load deltas                        slices 5.1–5.3
Phase 6 — Efficiency indicators (session)                    slices 6.1–6.3
Phase 7 — UI toggle + docked panel                           slices 7.1–7.4
Phase 8 — Export / Clear / footprint acceptance              slices 8.1–8.3
```

---

## Phase 1 — Pure identity-aware sizing ✅

**Goal:** Correct effective / present / history / query-cache bytes on fixture states **without** LocalCache class or UI. This closes challenging gap #1 on a testable pure API.

**Delivered (2026-07-21):**

| Area | Location |
|------|----------|
| Pure API | `packages/miroir-core/src/2_domain/localCacheMemoryMeasure.ts` (`estimateObjectBytes`, `measureLocalCacheMemory`) |
| Tests | `packages/miroir-core/tests/2_domain/localCacheMemoryMeasure.unit.test.ts` |
| Exports | `miroir-core` index re-exports |
| Typing hygiene | Fixtures use `FatInstance` + `TransactionalInstanceAction` for `StateChanges` (fixes TS2353 / TS2322) |

### 1.1–1.4 ✅

All four pure-sizing slices green. See achievement log in Implementation status.

---

## Phase 2 — Static LocalCache image (Redux | Zustand) ✅

**Goal:** Before monitor APIs / gates / UI, prove `measureLocalCacheMemory` yields a **consistent formula** on a whole **static** store image produced by the real LocalCache implementations — switchable between **redux** and **zustand**.

**Out of scope here:** monitor gate, `currentInfo` enrichment, attributed maps, UI (those start at Phase 3).

**Approach:** Identical bootstrap fixtures (load instances → rollback into `current`). Run the same invariant assertions against `measureLocalCacheMemory(localCache.getState())` in both packages. Cross-check: `presentSnapshotBytes` for the same payload must be **equal** across impls (shared golden constant).

`measureLocalCacheMemory` walks only known `StateWithUndoRedo` fields, so Zustand store action methods on `getState()` do not inflate the estimate.

### 2.1  Redux: bootstrap → coherent breakdown

**Behavior:** After load+rollback of known instances, breakdown has `presentSnapshotBytes > 0`, parts sum to `effectiveBytes`, and `presentSnapshotBytes === estimateObjectBytes(presentModelSnapshot)`.

```
RED → GREEN
packages/miroir-localcache-redux/tests/LocalCache.memoryMeasure.static.unit.test.ts
  "static redux LocalCache: measureLocalCacheMemory parts sum and present matches walk"
```

### 2.2  Zustand: same bootstrap → same invariants

**Behavior:** Same as 2.1 on Zustand `LocalCache`.

```
RED → GREEN
packages/miroir-localcache-zustand/tests/LocalCache.memoryMeasure.static.unit.test.ts
  "static zustand LocalCache: measureLocalCacheMemory parts sum and present matches walk"
```

### 2.3  Cross-impl present size parity

**Behavior:** Both tests assert `presentSnapshotBytes === STATIC_PRESENT_BYTES_GOLDEN` for the shared bootstrap payload.

```
RED → GREEN (both packages)
  "presentSnapshotBytes matches shared golden for identical bootstrap payload"
```

### 2.4  Post-rollback history is small vs present

**Behavior:** After bootstrap rollback (patches cleared), `transactionHistoryBytes` is small relative to present (e.g. `< present / 5`).

```
RED → GREEN (both packages)
  "after rollback bootstrap, history incremental is small relative to present"
```

---

## Phase 3 — `currentInfo` present-only + shared `estimateObjectBytes` ✅

**Goal:** Cheap present-only `currentInfo()`; full breakdown only via `measureLocalCacheMemory(getState())` (D7). Formula already proven on real stores in Phase 2.

**Delivered (2026-07-21):**

| Slice | Result |
|-------|--------|
| 3.1 | `currentInfo().localCacheSize === measureLocalCacheMemory(state).presentSnapshotBytes` (Library Books) |
| 3.2 | With open transactional history, `localCacheSize` stays present-only (`< effectiveBytes`) |
| 3.3 | Redux + Zustand `currentInfo` use shared `estimateObjectBytes`; local `roughSizeOfObject` removed |

**Artifacts:** `LocalCache.monitor.unit.test.ts` (redux + zustand); both `LocalCache.ts` facades.

---

## Phase 4 — Attributed per-Entity + top-10

**Goal:** Hot-spot views from present `current` without claiming they sum to effective.

**Status:** Done (2026-07-21).

### Phase 4 achievement log

| Slice | Result |
|-------|--------|
| 4.1 | `buildAttributedInstanceIndex` + `aggregateAttributedByEntity` — Books/Authors attributed bytes = sum of per-instance `estimateObjectBytes` |
| 4.2 | `selectTopLargest(instances, 10)` — descending bytes; drops the smallest of 11 |
| 4.3 | Attributed index walks `present.current` only — `loading` instances contribute to present heap but not attribution |

**Artifacts:** `localCacheMemoryMeasure.ts` (+ index exports); `packages/miroir-core/tests/2_domain/localCacheMemoryAttributed.unit.test.ts`

### 4.1  Per-Entity attributed totals

**Behavior:** Two entities with known instance payloads → attributed bytes and counts match fixtures within tolerance of the size walk.

```
RED → GREEN
  "attributes instance bytes per Entity under present.current"
```

### 4.2  Top-10 ordering

**Behavior:** Eleven instances of varying sizes → top 10 are the ten largest, descending.

```
RED → GREEN
  "selectTopLargest returns at most N instances by descending bytes"
```

### 4.3  Loading zone not in attributed table (v1)

**Behavior:** Instances only in `loading` (not yet rolled into `current`) appear in present heap but **not** in attributed Entity table.

```
RED → GREEN
  "attributed index ignores loading zone"
```

---

## Phase 5 — Barriers + deltas

**Goal:** Limited ON footprint — deltas for CRUD/load; full remeasure on barriers.

**Status:** Done (2026-07-21). v1 uses full recalibrate after each mutating action / barrier while the session gate is ON (true attributed deltas deferred).

### Phase 5 achievement log

| Slice | Result |
|-------|--------|
| 5.1 | `setLocalCacheMonitorEnabled` + `getLocalCacheMonitorSnapshot` — attributed index tracks create / update / delete on redux + zustand |
| 5.2 | After transactional create, history bytes &gt; 0; `commit` drops `transactionHistoryBytes` |
| 5.3 | After undo barrier, cached snapshot equals fresh `measureLocalCacheMemory(getState())` |

**Artifacts:** `LocalCacheInterface` monitor methods; redux + zustand `LocalCache.ts`; `LocalCache.monitor.unit.test.ts` (Phase 5 describe in both packages); `LocalCacheMonitorSnapshot` type.

### 5.1  create / update / delete update attributed map

**Behavior:** Through `LocalCache.handleLocalCacheAction`, after createInstance the instance appears in attributed index; after deleteInstance it disappears; updateInstance changes bytes in the expected direction.

```
RED → GREEN
packages/miroir-localcache-redux/tests/LocalCache.monitor.unit.test.ts
  "attributed map tracks create, update, delete"
```

Implementation may remeasure present attributed index after each mutating action while a “monitor session” flag is on — or true deltas. Tests assert observable map contents, not delta math internals.

### 5.2  Commit clears history incremental

**Behavior:** After transactional edits, history bytes &gt; 0; after `commit`, history incremental drops (patches cleared, previous aliased).

```
RED → GREEN
  "commit drops transaction history incremental size"
```

### 5.3  Undo recalibrates present + history

**Behavior:** Undo changes present and moves patch stacks; effective measure remains consistent with a fresh `measureLocalCacheMemory(getState())` (equality within tolerance).

```
RED → GREEN
  "after undo, monitor snapshot matches fresh measureLocalCacheMemory"
```

---

## Phase 6 — Efficiency indicators

**Goal:** Session metrics when monitor session is active (in-memory registry cleared on gate OFF).

**Status:** Done (2026-07-22). Hit/miss and thrash are stub counters (call sites deferred); UI shows `n/a` for hit ratio until hooks land.

### Phase 6 achievement log

| Slice | Result |
|-------|--------|
| 6.1 | Peak effective + growth bytes/min from consecutive breakdown samples |
| 6.2 | `historyToPresentRatio` with div-by-zero → null |
| 6.3 | Hit/miss ratio math + thrash on delete-then-reload PK; top-3 entity share |
| Hygiene | Gate OFF resets indicators with registry; panel lists indicators when expanded |

**Artifacts:** `localCacheMonitorIndicators.ts`; `tests/4_view/localCacheMonitorIndicators.unit.test.ts`; registry/panel wiring.

### 6.1  Growth / peak

**Behavior:** Record effective bytes over two snapshots; peak and growth rate (bytes/min) reflect increase.

```
RED → GREEN
  "records peak effective bytes and positive growth after size increase"
```

### 6.2  History / present ratio

**Behavior:** Indicator equals `transactionHistoryBytes / presentSnapshotBytes` (guard div-by-zero).

```
RED → GREEN
  "exposes history-to-present ratio"
```

### 6.3  Hit ratio & thrash (best-effort)

**Behavior:**  
- Hit ratio: registry increments on “served from cache” vs “persistence fetch” hooks **if** call sites exist; otherwise stub interface + unit test of pure counter math, with integration deferred.  
- Thrash: delete then reload same PK increments thrash count.

```
RED → GREEN
  "thrash counter increments when deleted PK is loaded again in-session"
  "hit-ratio counters compute ratio from hits and misses"
```

**Note:** Wiring real persistence hit/miss may need PersistenceReduxSaga hooks — keep pure counters testable first; optional thin hook slice if timeboxed. Do not block Phase 7 UI on full hit-ratio instrumentation — show “n/a” until hooks land.

---

## Phase 7 — UI toggle + docked panel

**Goal:** Discoverable transparency matching analysis §5.

**Status:** Done (2026-07-21).

### Phase 7 achievement log

| Slice | Result |
|-------|--------|
| 7.1 | `applyLocalCacheMonitorGate(false)` clears `localCacheMonitorRegistry` |
| 7.2 | Gate ON sets config + `sessionStorage.showLocalCacheMonitor`; context flag + AppBar toggle |
| 7.3 | `LocalCacheMonitorSummary` returns null when `showLocalCacheMonitor` is false |
| 7.4 | Expanded panel shows Effective / Present / History / Query cache from registry or LocalCache poll |

**Artifacts:** `localCacheMonitorGate.ts`, `localCacheMonitorConfig.ts`, `localCacheMonitorRegistry.ts`, `LocalCacheMonitorSummary.tsx`, AppBar icon, `ReportDisplay` mount; tests under `tests/4_view/localCacheMonitor*`.

### 7.1  Gate OFF clears and disables collection

**Behavior:** `applyLocalCacheMonitorGate(false)` clears indicator registry / cached snapshot; subsequent measure scheduling does not run.

```
RED → GREEN
packages/miroir-standalone-app/tests/4_view/localCacheMonitorGate.unit.test.ts
  (mirror performanceDisplayGate.unit.test.ts)
```

### 7.2  Gate ON exposes context flag

**Behavior:** Context `showLocalCacheMonitor === true` after enable; AppBar wiring covered by light component test or gate+context unit test.

```
RED → GREEN
  "applyLocalCacheMonitorGate(true) enables showLocalCacheMonitor"
```

### 7.3  Panel hidden when OFF

**Behavior:** `LocalCacheMonitorSummary` renders null / nothing when flag false.

```
RED → GREEN
  "LocalCacheMonitorSummary renders nothing when monitor is off"
```

### 7.4  Panel shows three size lines when ON with mock snapshot

**Behavior:** With gate on and injected/mock snapshot, panel shows Effective, Present, Transaction/history (and Query cache line).

```
RED → GREEN
  "shows effective, present, history, and query-cache sizes when on"
```

Mount beside Report shell / RootComponent like RenderInsightSummary; AppBar icon separate from timer.

---

## Phase 8 — Export / Clear / footprint acceptance

**Status:** Done (2026-07-22).

### Phase 8 achievement log

| Slice | Result |
|-------|--------|
| 8.1 | `clearLocalCacheMonitorSession` zeros peak/hits/thrash; does not call LocalCache mutations |
| 8.2 | `buildLocalCacheMonitorExportPayload` — timestamp, config, breakdown, top entities/instances, indicators |
| 8.3 | Gate OFF → `setSnapshot` / indicator record* are no-ops; panel does not mount |
| UI | Clear + Export buttons on `LocalCacheMonitorSummary` |

**ON budget:** poll ≤1s; full measure on poll and LocalCache barriers; no per-React-render walks.

**Artifacts:** `localCacheMonitorSession.ts`; `localCacheMonitorSession.unit.test.ts`; `localCacheMonitorFootprint.acceptance.unit.test.tsx`.

### 8.1  Clear resets session stats not cache data

**Behavior:** Clear zeros peak/growth/thrash/hit counters; LocalCache domain data unchanged.

```
RED → GREEN
  "clear monitor session stats does not delete Entity instances"
```

### 8.2  Export JSON shape

**Behavior:** Export includes timestamp, breakdown, attributed top entities, indicators, gate config.

```
RED → GREEN
  "export payload includes effective breakdown and indicators"
```

### 8.3  Footprint acceptance when OFF

**Behavior:** With gate OFF, invoking a hot path that would update monitor registry is a no-op (no registry growth) — acceptance test style like `renderInsightFootprint.acceptance.unit.test.tsx`.

```
RED → GREEN
packages/miroir-standalone-app/tests/4_view/localCacheMonitorFootprint.acceptance.unit.test.ts
  "when monitor off, action hooks do not grow monitor registry"
```

Document ON budget: poll ≤1s; full measure on poll and barriers; no per-React-render walks.

---

## Out of scope (this plan)

- IndexedDB / `navigator.storage` sizing (Q3 follow-up).
- Real selective-eviction thrash semantics (#208).
- Changing cache management policies themselves (monitor only).
- Merging with Performance Monitor into one toggle.
- Perfect byte-accurate V8 heap (we approximate like `roughSizeOfObject`).

---

## Risk watchlist

| Risk | Mitigation |
|------|------------|
| Full measure too slow when ON on large Library data | Throttle 1s; measure spike in Phase 1 with fixture; if needed, attributed deltas + barrier-only full effective |
| `getState()` exposure conflicts with encapsulation TODOs | Pure measure takes `StateWithUndoRedo`; UI uses DomainController/localCache facade method if preferred later |
| Hit-ratio needs saga instrumentation | Ship UI with n/a; complete counters in follow-up slice without blocking transparency |

---

## Suggested implementation order (tracer bullets)

Start here when coding:

1. Phase **1** pure measure — **DONE**  
2. Phase **2** static Redux|Zustand verification — **DONE**  
3. Phase **3** API split (`currentInfo` vs `measureLocalCacheMemory`) — **DONE**  
4. Phase **4** attributed + top-10 — **DONE**  
5. Phase **5** barriers / commit / undo consistency — **DONE**  
6. Phase **7** UI chrome with real measure wired — **DONE**  
7. Phase **6** indicators — **DONE**  
8. Phase **8** export / footprint — **DONE**  

This delivers user-visible transparency before polishing all efficiency hooks.

---

## Analysis doc follow-up

After this plan is accepted, update [analysis.md §9](./analysis.md) to point here (“settled in tdd-implementation-plan.md”) so open questions are not re-litigated.
