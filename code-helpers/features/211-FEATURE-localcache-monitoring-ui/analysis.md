# 211 — LocalCache monitoring UI (switchable, low-footprint)

> Analysis: how to expose LocalCache memory transparently in the browser UI, with
> separate present-snapshot vs transaction/history indicators, without double-counting
> shared structure, and with a usable feedback loop for cache-policy comparison.

Related issue: https://github.com/miroir-framework/miroir/issues/211  
Related: [#61 performance monitoring](https://github.com/miroir-framework/miroir/issues/61) ·
[#208 caching / refresh design](https://github.com/miroir-framework/miroir/issues/208) ·
AppBar Performance Monitor / `performanceDisplayGate` / `RenderInsightSummary`

**Status:** first analysis / design framing — **no implementation**.

---

## 1. Goals

1. **Primary — transparency:** show the user what the LocalCache holds and how much
   browser memory it effectively occupies.
2. **Secondary — policy feedback:** indicators that make cache management policies
   comparable across sessions (or A/B runs), so improvements are evidence-driven.

### Constraints (from #211)

| Mode | Footprint requirement |
|------|------------------------|
| **OFF** | Negligible — no sampling, no size walks, no history buffers; only toggle wiring |
| **ON** | Limited — prefer incremental accounting; throttle UI refresh; bound retained samples; occasional recalibration OK |

---

## 2. What “effective memory” means here

The monitor’s headline number must approximate **unique JS heap retained by the LocalCache
store root**, not the sum of independently sized subtrees.

### 2.1 Store shape (`StateWithUndoRedo`)

```
StateWithUndoRedo
├── currentTransaction          # Commit metadata (usually small)
├── previousModelSnapshot       # LocalCacheSliceState at last commit
├── pastModelPatches[]          # { action, changes, inverseChanges }  → present from previous
├── presentModelSnapshot        # LocalCacheSliceState (loading + current zones)
├── futureModelPatches[]        # redo stack after undo
└── queriesResultsCache         # materialised query results
```

`LocalCacheSliceState` itself has `loading` and `current` deployment maps (Entity instance
indexes) plus status flags.

Today `LocalCache.currentInfo()` only walks **`presentModelSnapshot`** via
`roughSizeOfObject` — it under-reports transaction/history overhead and ignores
`queriesResultsCache`.

### 2.2 Two size indicators (required)

| Indicator | What it measures | User question it answers |
|-----------|------------------|---------------------------|
| **Present snapshot size** | Unique size of `presentModelSnapshot` (`loading` + `current`) | “How big is the live domain view the UI reads?” |
| **Current transaction / history size** | Incremental cost of `previousModelSnapshot` (when distinct) + `pastModelPatches` + `futureModelPatches` (+ `currentTransaction`), **after excluding structure already counted in present** | “How much extra RAM does undo/redo / the open transaction cost?” |

**Effective LocalCache size** (headline):

```
effective ≈ uniqueHeap(StateWithUndoRedo root)
          ≈ presentSnapshotSize
            + transactionHistoryIncrementalSize
            + queriesResultsCacheIncrementalSize
```

Where every “incremental” term is computed with **object-identity deduplication** against
objects already counted in present (and against each other).

### 2.3 Why naive summing double-counts

| Risk | Mechanism | Effect if summed blindly |
|------|-----------|---------------------------|
| **Immer structural sharing** | After edit, unchanged subtrees are shared between `previousModelSnapshot` and `presentModelSnapshot` | Counting both trees as full copies overstates RAM |
| **Commit aliasing** | `commit` sets `previousModelSnapshot = presentModelSnapshot` (same reference) | Until the next mutation, previous is *zero* incremental cost; after mutation, only the *diff* is new |
| **Patch value payloads** | Immer `Patch` entries may embed replaced/added values that also live in present | Patch walk + present walk counts the same object twice if identity is ignored |
| **Action payloads in patches** | Each `StateChanges.action` often carries full `EntityInstance` objects already in present | Dominates false inflation of “history size” |
| **loading → current** | Bulk load may hold instances in `loading` then move/copy into `current` | Transient double materialisation during hydrate |
| **queriesResultsCache** | May hold derived structures referring to / copying domain data | Can overstate if counted as fully independent |

**Fairness rule:** size walks must be **identity-aware** (skip already-visited object
references), matching the spirit of today’s `roughSizeOfObject` `objectListReportSection`
set — but applied to the **whole store root** (or to incremental roots while seeding the
visited set from present).

Logical / accounting sizes (bytes attributed per Entity for policy UI) may still use
**non-shared attribution** (each instance attributed to its Entity once under `current`) —
that is a *distribution* view, not a heap-total view. The UI must label them clearly:

- **Heap (effective)** — unique retained memory estimate  
- **Attributed (per Entity)** — partition of present `current` instances; sums to present
  instance payload, not necessarily to effective total

---

## 3. Operations to track (for size estimation)

Track these LocalCache-affecting operations when monitoring is **ON**. Each should
contribute a signed size delta (and optionally instance counts) so totals can be maintained
incrementally. Prefer deltas; fall back to occasional full identity-aware recalibration.

| # | Operation family | Why it moves size |
|---|------------------|-------------------|
| 1 | **Load / hydrate instances** into cache (`loading` → `current`, bulk `setAll` / load paths) | Dominant growth path; bulk loads dominate size jumps |
| 2 | **createInstance** | Adds object(s) to an Entity index |
| 3 | **updateInstance** | Size delta of replaced object(s) (can grow or shrink) |
| 4 | **deleteInstance** | Removes object(s); negative delta |
| 5 | **Model structural changes** (`createEntity`, `dropEntity`, `renameEntity`, `alterEntityAttribute`) | Adds/removes Entity buckets and related metadata; drop may cascade instance storage |
| 6 | **initModel / resetModel / resetData** | Large discontinuous size changes (full replace / clear) |
| 7 | **Undo / redo** | Moves content between present snapshot and past/future patch stacks — both indicators change; effective total should stay stable if only history pointer moves, or change only by newly retained / released patch nodes |
| 8 | **Transactional commit / rollback** | Commit: clears patches, may alias `previous` ← `present` (history incremental → ~0). Rollback: may rebuild present and clear stacks |

**Out of scope for size accounting** (unless they materialise into the store): pure
read / query / extractor runs that do not mutate LocalCache state. If
`queriesResultsCache` is populated as a side effect, that *is* in scope for the
effective total.

**Implementation note:** incremental deltas are hardest exactly on ops 6–8; those are the
natural recalibration points.

---

## 4. Core views & policy indicators

### 4.1 Core size views

When ON, show at least:

- **Effective LocalCache size** (identity-aware, whole store)
- **Present snapshot size** and **transaction/history incremental size** (the two indicators)
- **Size per Entity** (attributed bytes + instance count under `current`; sortable; by
  deployment / application section when useful)
- **Top 10 largest objects** (deployment / section / Entity / PK; size; optional last-touch)

### 4.2 Policy-efficiency indicators (candidates from #211)

1. Persistence round-trip avoidance (cache hit ratio)  
2. Thrashing rate (evict-then-reload) — may be weak until selective eviction exists (#208)  
3. Growth rate & peak-to-steady ratio (on **effective** size)  
4. Undo/redo stack footprint ratio ≈ `transactionHistoryIncremental / presentSnapshot`  
5. Working-set concentration (Entity size skew on attributed sizes)

---

## 5. UI: how it looks / how it is accessed

Mirror the existing Performance Monitor pattern so operators already know the gesture;
keep a **separate gate** so LocalCache accounting can stay off while render insights stay on
(and vice versa).

### 5.1 Access

1. **AppBar toggle** (next to the timer / Performance Monitor icon)  
   - Tooltip: `LocalCache Monitor: ON/OFF`  
   - OFF → ON: start collectors, seed with one identity-aware calibration walk  
   - ON → OFF: clear buffers, stop subscriptions/intervals (same contract as
     `applyPerformanceDisplayGate`)
2. **Session persistence (optional):** `sessionStorage` flag, analogous to
   `showPerformanceDisplay`, so a refresh during a diagnosis session keeps the monitor on.
3. **Not** buried only in settings — primary goal is transparency during normal use /
   diagnosis; AppBar discoverability matters.

### 5.2 Surface layout (when ON)

Docked panel (prefer **non-floating**, same family as `RenderInsightSummary`), collapsed by
default to limit distraction and layout thrash.

```
┌─ LocalCache monitor ──────────────────────────────── [Export] [Clear] [▾] ─┐
│ Effective: 12.4 MB    Present: 11.1 MB    Transaction/history: 1.2 MB      │
│ Peak (session): 18.0 MB    Growth: +0.3 MB/min                             │
├─ Efficiency ───────────────────────────────────────────────────────────────┤
│ Hit ratio 82% · Thrash 0.4/min · Peak/steady 1.45 · Hist/Present 0.11 ·   │
│ Top-3 Entities = 71% of attributed                                         │
├─ Tabs: [By Entity] [Top 10 objects] [Operations (optional)] ───────────────┤
│ … table / list …                                                           │
└────────────────────────────────────────────────────────────────────────────┘
```

**Chrome details:**

| Element | Behaviour |
|---------|-----------|
| Header totals | Always visible when expanded; monospace sizes; units auto (KB/MB) |
| Present vs Transaction | Two distinct chips/columns — never a single ambiguous “cache size” |
| Effective | Emphasised as the fairness headline; tooltip explains identity-aware / no double-count |
| By Entity | Sortable table: Entity name/uuid, section, instances, attributed bytes, % of present |
| Top 10 | Ranked list; click-through to existing instance navigation if cheap later |
| Export | JSON snapshot (sizes + indicators + timestamp + config) for policy A/B comparison |
| Clear | Resets session peaks / rates / samples — does **not** clear LocalCache data |
| Refresh | Poll / push throttled (e.g. 1s, like render insights), not per Redux action in the React tree |

**Mount point:** report shell / root layout beside `RenderInsightSummary` (e.g. ReportPage or
RootComponent), gated by `showLocalCacheMonitor` (name TBD) — **not** injected into every
Entity editor.

### 5.3 What the user should *not* see when OFF

No panel, no polling, no instrumentation hooks writing metrics, no size walks. Toggle
component only.

---

## 6. Gaps & impact

| ID | Gap | Impact if unaddressed | Severity |
|----|-----|------------------------|----------|
| G1 | No identity-aware **whole-store** size; `currentInfo` only sizes present | Users misread RAM; history/query cache invisible | High |
| G2 | No defined split between **present** vs **transaction/history** incremental size | Cannot diagnose undo-stack bloat vs domain data growth | High |
| G3 | Action payloads inside `pastModelPatches` / `futureModelPatches` duplicate instance data already in present | History indicator wildly overstated if actions are deep-sized | High |
| G4 | Incremental accounting across undo / redo / commit / rollback not designed | Either wrong totals or forced full walks on every history op (hurts ON footprint) | High |
| G5 | `loading` vs `current` double materialisation during hydrate | Transient spikes misreported as leaks | Medium |
| G6 | `queriesResultsCache` lifetime / eviction undocumented for monitoring | Effective size drifts vs user mental model of “Entity cache” | Medium |
| G7 | Per-Entity + top-10 need structured walks; no cheap index of instance sizes today | ON mode can become expensive if naïvely re-walked every action | High |
| G8 | Two LocalCache implementations (Redux + Zustand) share `StateWithUndoRedo` but different facades | Monitor wired to one path only → blind spots / divergence | Medium |
| G9 | Selective eviction not first-class yet (#208) | Thrashing indicator weak or placeholder | Medium |
| G10 | IndexedDB persistence of cache (see `StateWithUndoRedo` comments) vs in-heap Redux state | “Browser memory” may need clarifying: JS heap vs disk cache | Medium |
| G11 | Separate monitor gate vs reuse Performance Monitor gate undecided | Coupling causes unwanted footprint when user only wanted render insights | Low–Med |
| G12 | No export/session comparison format | Secondary goal (policy feedback) hard to exercise | Medium |

---

## 7. Three most challenging gaps

Signalled for design attention before implementation:

### 1. Fair effective size without double-counting — **G1 + G2 + G3**

**Why hardest:** correctness of the product promise (“represent fairly the effective amount
of memory”) hinges on Immer sharing, commit reference aliasing, and especially **action
payloads** embedded in patch stacks. A wrong formula is worse than no monitor: it will
drive bad policy decisions.

**Design directions to evaluate:**

- Single identity-aware walk of `StateWithUndoRedo` for **effective**; derive present by
  walking only `presentModelSnapshot`; derive history incremental by walking history roots
  with `visited` pre-seeded from present.
- For history, size **patches only** (`changes` / `inverseChanges`) and treat `action` as
  metadata with a **capped / structural** size (or strip payloads in the monitor view model)
  so action duplication does not dominate.
- Document that attributed per-Entity sizes are a different metric than effective heap.

### 2. Correct incremental updates across undo / redo / commit / rollback — **G4**

**Why hardest:** these ops reshuffle which nodes are retained without a simple
“add instance / remove instance” story. Commit zeros history while aliasing previous;
undo moves patches between past and future while rewriting present; rollback clears stacks
and may reload. Incremental deltas are easy to get subtly wrong.

**Design directions:**

- Treat ops 6–8 as **recalibration barriers** (full identity-aware walk) while using
  deltas only for create/update/delete/load.
- Or maintain running totals only for present attributed sizes, and always recompute
  effective + history incremental on a throttled timer when ON (simpler, bounded cost).

### 3. Cheap per-Entity + top-10 while ON — **G7**

**Why hardest:** secondary UX value (hot spots) fights the footprint constraint. Full
`roughSizeOfObject` per instance on every action will not stay “limited when on”.

**Design directions:**

- Maintain a size map keyed by `(deployment, section, entity, pk)` updated on
  create/update/delete/load deltas; top-10 from a bounded heap/structure.
- Recalibrate map on barriers (reset/init/commit/undo batch) rather than continuously.
- Cap top-10 maintenance cost (e.g. recompute from map every N seconds, not every action).

---

## 8. Proposed accounting algorithm (sketch)

When monitor turns ON (or on recalibration barrier):

1. `visited = empty IdentitySet`  
2. `presentBytes = sizeWalk(presentModelSnapshot, visited)`  
3. `historyBytes = sizeWalk(previousModelSnapshot, visited)`  
   + `sizeWalk(pastModelPatches, visited, { actionSizing: "metadata"|"patchesOnly" })`  
   + `sizeWalk(futureModelPatches, visited, same)`  
   + `sizeWalk(currentTransaction, visited)`  
4. `queryCacheBytes = sizeWalk(queriesResultsCache, visited)`  
5. `effectiveBytes = presentBytes + historyBytes + queryCacheBytes`  
   (equivalent to `sizeWalk(wholeRoot)` if walks are consistent)

Between barriers, apply operation deltas to attributed maps and adjust presentBytes; mark
effective/history dirty until next throttled recalibration.

---

## 9. Open questions — settled

Settled in [tdd-implementation-plan.md](./tdd-implementation-plan.md) §Phase 0. Summary:

| # | Decision |
|---|----------|
| 1 | Patches-only + **action metadata** (no deep payload sizing) |
| 2 | **Yes** — `queriesResultsCache` in effective, third breakdown line |
| 3 | v1 = **in-heap only**; IndexedDB out of scope |
| 4 | **Two gates** — independent of Performance Monitor |
| 5 | Shared pure `measureLocalCacheMemory(StateWithUndoRedo)`; Redux + Zustand |

---

## 10. Next steps

Follow [tdd-implementation-plan.md](./tdd-implementation-plan.md) vertical slices (Phase 1 pure
sizing → … → Phase 7 footprint acceptance). Do not re-open Phase 0 decisions without updating
both docs.
