# 214 — TDD Implementation Plan: Option C′ (projected fetch + stale partials in local cache)

> Related: [analysis.md](./analysis.md) · issue [#214](https://github.com/miroir-framework/miroir/issues/214) · follow-up to [#208](https://github.com/miroir-framework/miroir/issues/208) · synergy with [#114](https://github.com/miroir-framework/miroir/issues/114)
>
> Each cycle follows red → green; tests describe **behavior**, not implementation.
> Vertical slices only. This file is the **record of decisions and executions**.

---

## Status

| Phase | Scope | Status |
|---|---|---|
| **0** | Design decisions (C′ vs pure C vs B) | **Pending confirmation** |
| **1** | Projection contract on extractors / persistence reads | Not started |
| **2** | Local-cache completeness: `full \| partial` + freshness `fresh \| stale` | Not started |
| **3** | Wire projected fill through `#114` report single-flight loader | Not started |
| **4** | Mutation guardrails (partial forbidden for create/update) | Not started |
| **5** | Tracer entity end-to-end (large instance or high-attr Entity) | Not started |
| **6** | Acceptance / non-regression | Not started |

---

## Preamble — Synergies with #114 (must read before coding)

### What #114 already ships (and why pure Option C collides with it)

Issue **#114** changed the client data path from “always stage-C full-entity load on refresh” to:

| Piece | Role |
|---|---|
| `EntityDefinition.cache.cacheAllInstancesOnRefresh` | Per-entity all-or-none on refresh (data section only; model always loaded) |
| `cacheRefreshPolicy` / DomainController stages A→B→C | Skip stage-C network reads when flag is `false` |
| `ReportQueryLoadService` | Fingerprint + single-flight `ensureLoaded`; status `idle\|loading\|ready\|error` |
| `useEnsureReportQueryLoaded` | Effect-driven load; **render never dispatches** |
| `createReportQueryLoadExecutor` | Persistence read → `loadNewInstancesInLocalCache` (local cache only) |
| Selectors | Sync over Redux/Zustand local cache; lazy-missing index treated as empty when flag is `false` |

**Hard architectural invariant from #114 (D9):** Reports (and the rest of the UI hook stack) consume **local cache via synchronous selectors**. Async work lives only in `ensureLoaded` / effects. That is why:

> **Pure Option C** (“project on the wire, never write partials into local cache”) looks cheap on paper but **breaks the #114 contract**: ephemeral query results have nowhere to live that selectors can read. Replacing sync selectors with ad-hoc async result bags would reintroduce render-cycle fetch, dual data paths for Reports, and the exact complexity #114 removed.

### Critique of pure Option C (does the complexity pay off?)

| Claim for pure C | Reality after #114 |
|---|---|
| Minimal local-cache change | True for cache *structures*, false for *UI architecture* — Reports would need a second result channel |
| Network savings | Real | Real only if projection reaches store backends |
| Reuse across remounts | Poor — re-fetch every open unless something caches |
| Positive points vs effort | **Low** once #114 exists: you pay projection plumbing *and* a parallel UI data path |

**Conclusion:** Pure Option C does **not** bring enough positive points to justify fracturing the hook/selector architecture. Prefer **Option C′** below.

### Favored solution — Option C′ (stale partials + #114 remount query)

Blend:

1. **From Option C:** projection at persistence/REST so the server returns fewer attributes (network win for large instances).
2. **From Option B / #208:** a **single canonical local-cache slot** per identity, with explicit completeness / freshness metadata (not a second “views” cache).
3. **From #114:** report (and later other) mounts call `ensureLoaded`; render stays sync over cache; single-flight prevents remount storms.

**Working model for C′:**

| Concept | Meaning |
|---|---|
| **Partial object** | Instance with a declared attribute projection; immutable; **cannot** be create/update payload |
| **Completeness** | `full` \| `partial` (coverage of attributes) |
| **Freshness** | `fresh` \| `stale` (whether this entry may be shown without a remount-triggered server query) |
| **Refresh / stage-C** | May leave lazy entities absent (#114) *or* later seed **stale partial** stubs (list headers only) — out of Phase 1 scope |
| **Report mount** | `ensureLoaded` always eligible to hit the server when fingerprint requires refresh (e.g. entry `stale`, missing coverage, or entity policy `neverTrustCache` from #208) |
| **Selectors** | Continue to read local cache; understand `partial`/`stale` (empty vs missing vs incomplete projection) |

This preserves #114’s “render never dispatches / ensureLoaded owns network” while unlocking #214’s “don’t fetch all attributes.”

### Orthogonality (#208 axes)

| Axis | #114 | #214 / C′ |
|---|---|---|
| **Cardinality** (# instances) | All-or-none on refresh | Projection does not solve cardinality alone; still need windows/filters later |
| **Payload size** (bytes/instance) | Full instances when loaded | **Primary target** — project attributes |
| **Freshness** | Sticky ready until invalidate; lazy empty interim | Explicit `stale` + remount `ensureLoaded` |

Do **not** conflate “lazy on refresh” (`cacheAllInstancesOnRefresh: false`) with “always stale” (`neverTrustCache`). C′ metadata must allow both.

### What this TDD plan deliberately reuses

- Fingerprint + single-flight from `ReportQueryLoadService` (extend request with projection / freshness policy — do not fork a second loader).
- `useEnsureReportQueryLoaded` (effect contract unchanged; request payload grows).
- `createReportQueryLoadExecutor` (evolve to projected read + completeness-aware cache write).
- `isLazyCacheOnRefreshEntity` / empty-index interim behavior (keep; extend for `stale`/`partial` later).

### What this plan does **not** do yet

- Full Option B “scope completeness for filter/order/paging” (deferred; note in analysis).
- Separate Option A partial-views slot.
- Algebraic eviction DSL from #208.
- Changing Blob to project away `contents` (possible Phase 5 tracer once projection works).

---

## Design decisions (confirm before coding)

| # | Decision | Proposed choice | Alternatives |
|---|---|---|---|
| D1 | Target architecture | **Option C′** (projected network + partial/stale in canonical local cache + #114 remount load) | Pure C (rejected); full Option B in one go (too large) |
| D2 | Projection syntax | Allow-list `attributes?: string[]` on extractor / RestPersistence read | Field paths / exclude-list later |
| D3 | Cache metadata location | Sidecar or inline per EntityAdapter entry: `{ completeness, coveredFields, freshness }` | Separate views map (Option A) |
| D4 | Default without projection | Behavior = today’s **full** fetch + `completeness: full`, `freshness: fresh` | — |
| D5 | Remount / ensureLoaded | Reuse #114 service; treat `stale` or insufficient `coveredFields` as need-fetch | Always refetch every mount (neverTrustCache only) |
| D6 | Mutation safety | Reject `createInstance` / `updateInstance` if payload marked partial or completeness ≠ `full` | Required-fields-only update policy later |
| D7 | Immutability | Readonly TypeScript type + runtime freeze in DEV for partial snapshots | Structural share with full entries carefully |
| D8 | Phase 5 tracer | TBD: high-attr Entity or Blob list **without** `contents` in projection | Confirm with user |
| D9 | Persistence backends | Project in API contract first; Postgres native `SELECT cols`; filesystem/IndexedDB may filter after full read until optimized | — |

---

## Public interfaces (target shape)

```ts
type CacheCompleteness = "full" | "partial";
type CacheFreshness = "fresh" | "stale";

interface LocalCacheInstanceMeta {
  completeness: CacheCompleteness;
  coveredFields?: ReadonlySet<string> | string[]; // required if partial
  freshness: CacheFreshness;
}

// Extractor extension (schema / generated types)
interface ExtractorInstancesByEntity {
  // ...existing...
  attributes?: string[]; // projection allow-list; absent ⇒ full
}

// Report load request extension (#114)
interface ReportQueryLoadRequest {
  // ...existing #114 fields...
  applicationSection?: "data" | "model";
  /** When set, executor issues projected read and writes partial meta. */
  projection?: { attributes: string[] };
  /** Force server round-trip even if cache has covering fields (always-stale policy). */
  forceRefresh?: boolean;
}
```

Selectors remain sync; they may expose meta to UI later (badge “partial / refreshing”) — optional Phase 6.

---

## High-level phase structure

```
Phase 0 — Confirm D1–D9
Phase 1 — Projection on wire (schema + server + one backend)     1.1–1.4
Phase 2 — Local cache meta (completeness + freshness)           2.1–2.4
Phase 3 — #114 loader writes partial/stale; remount refresh     3.1–3.3
Phase 4 — Mutation rejects partial                               4.1–4.2
Phase 5 — Tracer E2E                                             5.1–5.2
Phase 6 — Acceptance                                             6.1
```

---

## Phase 0 — Design decisions

**Gate 0:** User confirms D1–D9 (especially D1 = C′ not pure C, D8 tracer).

---

## Phase 1 — Projection contract and persistence read

**Goal:** A read with `attributes: [...]` returns **only** those fields from the server (or filters to them for backends that cannot project natively).

### 1.1  Schema / type: extractor may carry `attributes`

**Behavior:** Zod/types accept optional `attributes: string[]` on `extractorInstancesByEntity` / `extractorByPrimaryKey`.

### 1.2  REST / PersistenceAction carries projection

**Behavior:** `RestPersistenceAction_read` (or boxed query path) forwards projection; absent ⇒ full object as today.

### 1.3  At least one backend honors projection

**Behavior (integ):** Postgres `SELECT` listed columns **or** filesystem returns objects stripped to allow-list. Assert response keys ⊆ allow-list ∪ identity fields (`uuid` / PK, `parentUuid`).

### 1.4  Non-regression: omit projection ⇒ full instance

**Behavior:** Existing CRUD / report paths without `attributes` unchanged.

**Gate 1:** 1.1–1.4 green.

---

## Phase 2 — Local cache completeness + freshness

**Goal:** Canonical cache entries can represent partial coverage and stale freshness without a second slot.

### 2.1  Write path records meta

**Behavior:** `loadNewInstancesInLocalCache` (or successor) accepting projected instances stores `completeness: "partial"`, `coveredFields`, `freshness: "fresh"` (or `"stale"` when policy says so).

### 2.2  Full write upgrades

**Behavior:** Subsequent full load for same key ⇒ `completeness: "full"`, clears `coveredFields`, `freshness: "fresh"`.

### 2.3  Selectors: missing vs empty vs partial

**Behavior:**
- Missing index + lazy-on-refresh (`#114`) ⇒ empty index (no EntityNotFound noise) — **keep**.
- Present partial ⇒ selectors return available fields; do not invent missing attributes.
- Optional: expose meta for UI “incomplete” (not required for Gate 2).

### 2.4  Mark stale

**Behavior:** Explicit API or refresh policy can set `freshness: "stale"` without deleting the instance (UI may still render stale data).

**Gate 2:** 2.1–2.4 green; Redux + Zustand parity for write/read meta.

---

## Phase 3 — Integrate with #114 report single-flight loader

**Goal:** Report mount triggers projected (or full) server fill into cache; remount with same fingerprint does not duplicate; stale/forceRefresh does.

### 3.1  Executor projected fill

**Behavior:** `createReportQueryLoadExecutor` (or thin wrapper) uses projection from request; writes via cache path with meta (2.1).

### 3.2  Sufficiency short-circuit

**Behavior:** `ensureLoaded` skips network when cache already has `fresh` entry whose `coveredFields` ⊇ requested projection (or `completeness: "full"`).

### 3.3  Stale / forceRefresh remount

**Behavior:** If entry is `stale` or `forceRefresh: true`, `ensureLoaded` issues **one** server query (single-flight), then upgrades meta to `fresh` (and expands coverage).

**Gate 3:** 3.1–3.3 green; **no second async channel** for Reports — still `useEnsureReportQueryLoaded` + sync selectors.

---

## Phase 4 — Mutation guardrails

### 4.1  DomainController rejects partial create/update

**Behavior:** Payload tagged partial or meta `completeness !== "full"` ⇒ `Action2Error` before REST.

### 4.2  Type / runtime helper

**Behavior:** `assertFullEntityInstanceForMutation(x)` used at boundary; unit coverage.

**Gate 4:** 4.1–4.2 green.

---

## Phase 5 — Tracer end-to-end

**Goal:** One concrete Entity/report proves network projection + cache meta + #114 remount.

### 5.1  Tracer choice (D8)

Confirm: e.g. Blob list projecting `{ name, defaultLabel, uuid }` **without** `contents`, or another large-attr Entity.

### 5.2  Behaviors

1. Refresh does not stage-C full Blob bodies if still lazy (#114).
2. Open list report → one projected read; cache holds partial+fresh; UI lists labels.
3. Remount same fingerprint → no second network (ready short-circuit).
4. Mark stale or `forceRefresh` → exactly one new network call.
5. Attempt updateInstance with partial payload → rejected.

**Gate 5:** 5.2 green.

---

## Phase 6 — Acceptance / non-regression

| Check | Covered by |
|---|---|
| No projection ⇒ full objects as today | 1.4 |
| Projection ⇒ only requested attrs on wire | 1.3 |
| Partials live in canonical cache with meta | 2.1 |
| Full upgrades partial | 2.2 |
| #114 single-flight + effect contract preserved | 3.x |
| Stale remount refetches once | 3.3 |
| Mutations reject partial | 4.1 |
| Blob/lazy EntityNotFound noise stays quiet | #114 + 2.3 |

Non-regression pack: ConfigurationService startup; ReportHooks eager entities; Blob lazy path from #114.

---

## Refactor candidates (only after GREEN)

- Unify “lazy empty index” and “stale partial” into one sufficiency helper used by executor + selectors.
- Postgres native projection before filesystem filter-after-read.
- Scope-level completeness (filter/page) — Option B leftover; new issue when needed.

Never refactor while RED.

---

## Implementation order reminder

```
WRONG:  rewrite cache + all backends + UI in one PR
RIGHT:  1.1 RED→GREEN → … → 5.2 RED→GREEN → refactor
```

**Next coding slice after Gate 0:** **1.1 projection on extractor schema / types**.

---

## Open questions for Gate 0 (user)

1. Confirm **D1 = Option C′** (not pure C, not big-bang B).
2. Confirm **D8 tracer** (Blob without `contents` vs other Entity).
3. Confirm **D3** metadata storage preference (inline vs sidecar) if you care; otherwise implementer chooses sidecar for smaller EntityAdapter churn.
4. Should refresh ever **seed stale partials** (headers only), or keep #114 “absent until report” for Phase 1–5?
