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

**Status:** plan ready — **no implementation yet**.

---

## Implementation status

| Phase | Scope | Status |
|-------|--------|--------|
| **0** | Lock design decisions (open questions) | **Done** (this document) |
| **1** | Pure identity-aware sizing (core) | **Done** — slices 1.1–1.4 green (`localCacheMemoryMeasure`) |
| **2** | `LocalCacheInfo` enrichment + gate (OFF cheap) | Pending |
| **3** | Attributed per-Entity + top-10 | Pending |
| **4** | Barrier recalibration + CRUD/load deltas | Pending |
| **5** | Session efficiency indicators | Pending |
| **6** | UI: AppBar toggle + docked panel | Pending |
| **7** | Export / Clear / acceptance footprint | Pending |

---

## Test execution conventions

| Package | How to run focused tests |
|---------|--------------------------|
| `miroir-core` | From package: prefer file-scoped vitest/jest pattern used by sibling packages; avoid flaky full-suite `-t` when possible |
| `miroir-localcache-redux` | `npm run vitest -- <path>` or existing `npm test -- <pattern>` from package root |
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
| **Q5** | Zustand path | **Shared pure sizer on `StateWithUndoRedo` in `miroir-core` (or shared util both packages import).** Enrich `LocalCacheInfo` on the shared interface. **Implement Redux `currentInfo()` first**; Zustand `currentInfo()` switched to the same helper in the same Phase 2 slice (thin wrapper — no separate formula). | One formula prevents Redux/Zustand divergence. Zustand already mirrors present-only `roughSizeOfObject`; swapping the helper is cheap if the pure module is store-agnostic. |

### Additional settled choices

| # | Topic | Decision | Reason |
|---|-------|----------|--------|
| **D6** | `localCacheSize` back-compat | Keep **`localCacheSize` = present snapshot bytes** (today’s semantics). Add `presentSnapshotBytes` (alias), `transactionHistoryBytes`, `queriesResultsCacheBytes`, `effectiveBytes`. | Callers of `currentLocalCacheInfo()` today expect present-only meaning. Changing it to effective would silently break any consumer that assumed “domain view size”. |
| **D7** | When is sizing computed? | **Only when LocalCache monitor gate is ON** (or explicit test helper). OFF: `currentInfo()` returns present-only via existing cheap path **or** zeros for extended fields without walking history — see Phase 2. Monitor snapshot API is the rich path. | Matches “negligible when off”. Avoid making every `currentInfo()` call pay whole-store walks. |
| **D8** | History incremental formula | Seed `visited` from present walk, then walk `previousModelSnapshot`, patch stacks (Q1 policy), `currentTransaction`. Sum = `transactionHistoryBytes`. | Implements analysis §8 without double-counting Immer sharing / commit aliasing. |
| **D9** | Undo/redo/commit/rollback | **Recalibration barriers** — full identity-aware snapshot recompute. CRUD/load use **attributed size-map deltas** between barriers. | Analysis challenging gap #2: incremental history math is brittle; barriers are correct and still limited if UI polls ≤1 Hz. |
| **D10** | Attributed vs heap | UI labels **Effective (heap)** vs **Attributed (per Entity)**. Attributed map covers `present.current` instances only for v1 (`loading` included in present heap but not in per-Entity table unless still present after rollback). | Prevents summing Entity rows and comparing to effective. |
| **D11** | Top-10 source | Ranked from **attributed instance size map** (present `current`), refreshed on delta or barrier — not a second full heap walk of history. | Hot spots for policy are live domain objects; history patches are opaque path ops. |
| **D12** | Efficiency indicators v1 | Implement all five from analysis, with thrash as **best-effort**: count reload of PK previously removed in-session (delete/reset), document weakness until #208 eviction exists. | Keeps secondary goal alive without blocking on eviction design. |
| **D13** | UI chrome | AppBar icon toggle + **docked collapsible panel** (RenderInsightSummary family), folded by default; poll ≤1s when ON. | Analysis §5; proven low-friction pattern from #61. |
| **D14** | Session persistence | Persist gate in `sessionStorage` (like performance display). | Diagnosis survives refresh within a session. |

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
Phase 1 — Pure identity-aware sizing                         slices 1.1–1.4
Phase 2 — LocalCacheInfo + OFF/ON gate semantics             slices 2.1–2.3
Phase 3 — Attributed per-Entity + top-10                     slices 3.1–3.3
Phase 4 — Barriers + CRUD/load deltas                        slices 4.1–4.3
Phase 5 — Efficiency indicators (session)                    slices 5.1–5.3
Phase 6 — UI toggle + docked panel                           slices 6.1–6.4
Phase 7 — Export / Clear / footprint acceptance              slices 7.1–7.3
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

### 1.1  Shared structure counted once ✅

**Behavior:** Measuring a graph where the same object is reachable from two parents yields the same byte total as measuring it once.

```
RED → GREEN
packages/miroir-core/tests/…/localCacheMemoryMeasure.unit.test.ts
  "counts a shared object only once across two parent references"
```

**GREEN:** `sizeWalk` / `measureLocalCacheMemory` with `WeakSet`/`Set` identity tracking (evolve today’s `roughSizeOfObject`).

### 1.2  Present vs history after commit alias

**Behavior:** When `previousModelSnapshot === presentModelSnapshot` (reference equality, post-commit), `transactionHistoryBytes` does not re-add present’s payload; `effectiveBytes ≈ present + queryCache + patchMetadata`.

```
RED → GREEN
  "after commit alias, history incremental excludes present payload"
```

### 1.3  History after divergent previous (Immer-style share)

**Behavior:** Fixture where previous and present share a large subtree and differ by one small object: `effectiveBytes < presentBytes + previousBytes` (naive sum); history incremental ≈ size of divergent nodes + patches only.

```
RED → GREEN
  "history incremental reflects only non-shared nodes plus patches"
```

### 1.4  Action payloads excluded from history (Q1)

**Behavior:** A `pastModelPatches` entry whose `action.payload` embeds a large instance already in present does **not** increase `transactionHistoryBytes` by that instance’s deep size; patch `changes` values still count if not already visited.

```
RED → GREEN
  "does not deep-size action payloads when measuring history"
```

**Non-regression:** Existing LocalCache unit tests unchanged.

---

## Phase 2 — `LocalCacheInfo` + gate semantics

**Goal:** Enrich `currentInfo()`; OFF path stays cheap; both Redux and Zustand use the pure helper.

### 2.1  Enriched info from real LocalCache state (Redux)

**Behavior:** After bootstrap + createInstance, `currentInfo()` (monitor path) reports `presentSnapshotBytes === localCacheSize`, `effectiveBytes >= presentSnapshotBytes`, and history/query fields are numbers.

```
RED → GREEN
packages/miroir-localcache-redux/tests/LocalCache.monitor.unit.test.ts
  "currentInfo exposes present, history, queryCache, and effective bytes"
```

Wire `LocalCacheInfo` in `DomainControllerInterface`; implement via `measureLocalCacheMemory(getState())` when measurement allowed.

### 2.2  OFF / unmeasured path does not walk history

**Behavior:** With monitor measurement disabled, calling the cheap info path does not require walking `pastModelPatches` (assert via: either only `localCacheSize`/`presentSnapshotBytes` filled and extended fields `0`, or a test double/counter on the pure measure showing **not called** for history). Prefer behavioral: document API `currentInfo({ measure: "presentOnly" | "full" })` **or** separate `getLocalCacheMonitorSnapshot()` only used when ON.

**Settled API for tests:**  
- `currentInfo()` — **presentOnly** (back-compat, cheap, always safe).  
- `getMonitorSnapshot()` / DomainController wrapper — **full measure**, called only by UI when gate ON.

```
RED → GREEN
  "currentInfo remains present-only and does not include history walk cost"
  "getMonitorSnapshot returns full breakdown"
```

*(If adding methods to `LocalCacheInterface` is heavy, `getMonitorSnapshot` can live as a standalone function `measureLocalCacheMemory(localCache.getState())` used by UI — still public, still deep. Prefer standalone pure + `getState()` for deepest module / easiest tests.)*

**Decision refine (D7):** Prefer **standalone `measureLocalCacheMemory(state)`** as the rich API; keep `currentInfo()` present-only. UI never calls full measure when gate OFF.

### 2.3  Zustand uses same helper

**Behavior:** Zustand `currentInfo()` still present-only; measuring its `getState()` with the pure helper yields coherent effective bytes on a small fixture.

```
RED → GREEN
packages/miroir-localcache-zustand/tests/… (or shared core test with a hand-built StateWithUndoRedo)
  "measureLocalCacheMemory works on Zustand-shaped StateWithUndoRedo fixture"
```

No UI for Zustand-specific chrome required.

---

## Phase 3 — Attributed per-Entity + top-10

**Goal:** Hot-spot views from present `current` without claiming they sum to effective.

### 3.1  Per-Entity attributed totals

**Behavior:** Two entities with known instance payloads → attributed bytes and counts match fixtures within tolerance of the size walk.

```
RED → GREEN
  "attributes instance bytes per Entity under present.current"
```

### 3.2  Top-10 ordering

**Behavior:** Eleven instances of varying sizes → top 10 are the ten largest, descending.

```
RED → GREEN
  "selectTopLargest returns at most N instances by descending bytes"
```

### 3.3  Loading zone not in attributed table (v1)

**Behavior:** Instances only in `loading` (not yet rolled into `current`) appear in present heap but **not** in attributed Entity table.

```
RED → GREEN
  "attributed index ignores loading zone"
```

---

## Phase 4 — Barriers + deltas

**Goal:** Limited ON footprint — deltas for CRUD/load; full remeasure on barriers.

### 4.1  create / update / delete update attributed map

**Behavior:** Through `LocalCache.handleLocalCacheAction`, after createInstance the instance appears in attributed index; after deleteInstance it disappears; updateInstance changes bytes in the expected direction.

```
RED → GREEN
packages/miroir-localcache-redux/tests/LocalCache.monitor.unit.test.ts
  "attributed map tracks create, update, delete"
```

Implementation may remeasure present attributed index after each mutating action while a “monitor session” flag is on — or true deltas. Tests assert observable map contents, not delta math internals.

### 4.2  Commit clears history incremental

**Behavior:** After transactional edits, history bytes &gt; 0; after `commit`, history incremental drops (patches cleared, previous aliased).

```
RED → GREEN
  "commit drops transaction history incremental size"
```

### 4.3  Undo recalibrates present + history

**Behavior:** Undo changes present and moves patch stacks; effective measure remains consistent with a fresh `measureLocalCacheMemory(getState())` (equality within tolerance).

```
RED → GREEN
  "after undo, monitor snapshot matches fresh measureLocalCacheMemory"
```

---

## Phase 5 — Efficiency indicators

**Goal:** Session metrics when monitor session is active (in-memory registry cleared on gate OFF).

### 5.1  Growth / peak

**Behavior:** Record effective bytes over two snapshots; peak and growth rate (bytes/min) reflect increase.

```
RED → GREEN
  "records peak effective bytes and positive growth after size increase"
```

### 5.2  History / present ratio

**Behavior:** Indicator equals `transactionHistoryBytes / presentSnapshotBytes` (guard div-by-zero).

```
RED → GREEN
  "exposes history-to-present ratio"
```

### 5.3  Hit ratio & thrash (best-effort)

**Behavior:**  
- Hit ratio: registry increments on “served from cache” vs “persistence fetch” hooks **if** call sites exist; otherwise stub interface + unit test of pure counter math, with integration deferred.  
- Thrash: delete then reload same PK increments thrash count.

```
RED → GREEN
  "thrash counter increments when deleted PK is loaded again in-session"
  "hit-ratio counters compute ratio from hits and misses"
```

**Note:** Wiring real persistence hit/miss may need PersistenceReduxSaga hooks — keep pure counters in Phase 5; optional thin hook slice if timeboxed. Do not block Phase 6 UI on full hit-ratio instrumentation — show “n/a” until hooks land.

---

## Phase 6 — UI toggle + docked panel

**Goal:** Discoverable transparency matching analysis §5.

### 6.1  Gate OFF clears and disables collection

**Behavior:** `applyLocalCacheMonitorGate(false)` clears indicator registry / cached snapshot; subsequent measure scheduling does not run.

```
RED → GREEN
packages/miroir-standalone-app/tests/4_view/localCacheMonitorGate.unit.test.ts
  (mirror performanceDisplayGate.unit.test.ts)
```

### 6.2  Gate ON exposes context flag

**Behavior:** Context `showLocalCacheMonitor === true` after enable; AppBar wiring covered by light component test or gate+context unit test.

```
RED → GREEN
  "applyLocalCacheMonitorGate(true) enables showLocalCacheMonitor"
```

### 6.3  Panel hidden when OFF

**Behavior:** `LocalCacheMonitorSummary` renders null / nothing when flag false.

```
RED → GREEN
  "LocalCacheMonitorSummary renders nothing when monitor is off"
```

### 6.4  Panel shows three size lines when ON with mock snapshot

**Behavior:** With gate on and injected/mock snapshot, panel shows Effective, Present, Transaction/history (and Query cache line).

```
RED → GREEN
  "shows effective, present, history, and query-cache sizes when on"
```

Mount beside Report shell / RootComponent like RenderInsightSummary; AppBar icon separate from timer.

---

## Phase 7 — Export / Clear / footprint acceptance

### 7.1  Clear resets session stats not cache data

**Behavior:** Clear zeros peak/growth/thrash/hit counters; LocalCache domain data unchanged.

```
RED → GREEN
  "clear monitor session stats does not delete Entity instances"
```

### 7.2  Export JSON shape

**Behavior:** Export includes timestamp, breakdown, attributed top entities, indicators, gate config.

```
RED → GREEN
  "export payload includes effective breakdown and indicators"
```

### 7.3  Footprint acceptance when OFF

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

1. Phase **1.1** → **1.4** (pure measure — highest risk, no UI)  
2. Phase **2.2** API split (`currentInfo` vs `measureLocalCacheMemory`)  
3. Phase **3.1–3.2** attributed + top-10  
4. Phase **6.1–6.4** UI chrome with real measure wired  
5. Phase **4** barriers / commit / undo consistency  
6. Phase **5** indicators  
7. Phase **7** export / footprint  

This delivers user-visible transparency before polishing all efficiency hooks.

---

## Analysis doc follow-up

After this plan is accepted, update [analysis.md §9](./analysis.md) to point here (“settled in tdd-implementation-plan.md”) so open questions are not re-litigated.
