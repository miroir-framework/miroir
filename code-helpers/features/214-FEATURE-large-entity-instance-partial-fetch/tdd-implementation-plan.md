# 214 — TDD Implementation Plan: Option C′ (entity-bound full / partial segments)

> Related: [analysis.md](./analysis.md) · issue [#214](https://github.com/miroir-framework/miroir/issues/214) · follow-up to [#208](https://github.com/miroir-framework/miroir/issues/208) · synergy with [#114](https://github.com/miroir-framework/miroir/issues/114)
>
> Each cycle follows red → green; tests describe **behavior**, not implementation.
> Vertical slices only. This file is the **record of decisions and executions**.

---

## Status

| Phase | Scope | Status |
|---|---|---|
| **0** | Design decisions (segments C′; defer instance-level B) | **DONE** (defaults locked 2026-07-22) |
| **1** | Projection contract on extractors / persistence reads | **DONE** (2026-07-22; schema-first remediated same day) |
| **2** | Local-cache segments: `full` + `partial` (≤2 per entity) | Not started |
| **3** | Hook/selector routing + `#114` loader → correct segment | Not started |
| **4** | Mutation guardrails (partial forbidden; full segment only) | Not started |
| **5** | Tracer entity end-to-end | Not started |
| **6** | Acceptance / non-regression | Not started |

---

## Preamble — Synergies with #114 and why segments (not instance meta)

### What #114 already ships (and why pure Option C collides with it)

| Piece | Role |
|---|---|
| `EntityDefinition.cache.cacheAllInstancesOnRefresh` | Per-entity all-or-none on refresh (data section; model always loaded) |
| DomainController stages A→B→C | Skip stage-C when flag is `false` |
| `ReportQueryLoadService` | Fingerprint + single-flight `ensureLoaded` |
| `useEnsureReportQueryLoaded` | Effect-driven load; **render never dispatches** |
| `createReportQueryLoadExecutor` | Persistence read → `loadNewInstancesInLocalCache` |
| Selectors | Sync over local cache; lazy-missing index → empty when flag is `false` |

**Invariant:** UI consumes **local cache via synchronous selectors**. Async work lives only in `ensureLoaded` / effects.

> **Pure Option C** (project on the wire, never cache partials) breaks that contract. Rejected.

### Why not instance-level completeness (classic Option B)

Earlier C′ drafts put `completeness` / `coveredFields` / `freshness` **on each instance**. That would force:

- extractors/selectors to test **each** instance for inclusion and attribute coverage;
- **mixed** full/partial rows inside one EntityAdapter slice;
- harder error management and monitoring (“what is this entity’s cache state?”).

**Decision:** loading and query routing for partials are **entity-bound segment** concerns, not per-instance meta.

### Favored model — Option C′ segments

| Concept | Meaning |
|---|---|
| **Full segment** | Today’s map for `(deployment, section, entity)` — all full objects. Default for queries **without** `attributes`. |
| **Partial segment** | At most one sibling map for the same entity key — all partial objects under one **segment-level** projection. Used when the query/load request has `attributes`. |
| **Cap** | ≤ **2** segments per entity. Not N query-keyed views (Option A). |
| **Homogeneity** | No mixed full/partial inside a segment. |
| **Routing** | Hook- or selector-level: presence of projection → partial segment; else → full. |
| **Freshness** | **Segment-level** `fresh \| stale` (UI may read stale; remount `ensureLoaded` refetches). |
| **Replace** | New projected fetch **rebuilds** the partial segment as a unit (no per-row merge across different projections). |
| **#114** | `ensureLoaded` with projection writes the **partial** segment; without writes the **full** segment. |

This keeps #114’s architecture, delivers #214 network wins, and limits local-cache structural impact.

### Orthogonality (#208)

| Axis | Owner |
|---|---|
| Cardinality | #114 (+ later windows) |
| Payload size | #214 projection → partial segment |
| Freshness | Segment `stale` + #114 remount (`neverTrustCache` ≈ `forceRefresh`) |

### Deliberately deferred

- Instance-level Option B.
- Unbounded Option A view keys.
- In-memory “project from full segment” optimization (blurs monitoring).
- Scope completeness for arbitrary filter/order/paging.
- Seeding stale partial segment on refresh (default: #114 absent until report).

---

## Design decisions (confirm before coding)

| # | Decision | Proposed choice | Alternatives |
|---|---|---|---|
| D1 | Target architecture | **C′ segments** (≤2 per entity; route by projection) | Pure C (reject); instance-level B (defer); A unbounded views (avoid) |
| D2 | Projection syntax | `attributes?: string[]` on extractor / RestPersistence read | Field paths later |
| D3 | Segment storage | Existing entity map = **full**; add sibling **partial** map + segment header `{ projection, freshness }` | Inline dual keys in one tree |
| D4 | Default without projection | Full segment only (today) | — |
| D5 | Partial hit rule | Sorted-set **equality** of attribute lists ⇒ hit if `fresh`; else replace | Requested ⊆ segment projection |
| D6 | Remount / ensureLoaded | Reuse #114; fingerprint includes `segment` + projection; `stale` / mismatch / `forceRefresh` ⇒ one fetch | Always refetch |
| D7 | Mutation safety | Reject partial payloads; write **full** segment only; mark partial segment **`stale`** (or drop) | Always drop partial |
| D8 | Phase 5 tracer | TBD: Blob list without `contents` → partial segment | Other Entity |
| D9 | Persistence backends | Contract first; Postgres native cols; FS/IDB filter-after-read until optimized | — |
| D10 | Segment key | `(deployment, applicationSection, entityUuid)` | Omit section |

---

## Public interfaces (target shape)

```ts
type CacheSegmentKind = "full" | "partial";
type CacheFreshness = "fresh" | "stale";

interface LocalCacheSegmentHeader {
  kind: CacheSegmentKind;
  freshness: CacheFreshness;
  /** Required when kind === "partial"; defines every instance in the segment. */
  projection?: string[]; // sorted canonical form recommended
}

// Extractor extension
interface ExtractorInstancesByEntity {
  // ...existing...
  attributes?: string[]; // present ⇒ partial segment routing
}

// Report load request extension (#114)
interface ReportQueryLoadRequest {
  // ...existing #114 fields...
  applicationSection?: "data" | "model";
  /** When set → projected read + write/replace partial segment. */
  projection?: { attributes: string[] };
  forceRefresh?: boolean;
}

/** Hook/selector: choose segment once from query shape — never per instance. */
function resolveCacheSegmentKind(query: { attributes?: string[] }): CacheSegmentKind {
  return query.attributes?.length ? "partial" : "full";
}
```

Selectors stay sync; they bind to one segment map for the entity.

---

## High-level phase structure

```
Phase 0 — Confirm D1–D10
Phase 1 — Projection on wire (schema + server + one backend)     1.1–1.4
Phase 2 — Local cache segments (full + partial header/map)       2.1–2.4
Phase 3 — Routing + #114 loader → segment; stale remount         3.1–3.4
Phase 4 — Mutation rejects partial; stale/invalidate partial     4.1–4.2
Phase 5 — Tracer E2E                                             5.1–5.2
Phase 6 — Acceptance                                             6.1
```

---

## Phase 0 — Design decisions

**Gate 0:** DONE — defaults locked 2026-07-22:

| # | Locked choice |
|---|---|
| D1 | C′ segments |
| D2 | `attributes?: string[]` allow-list |
| D3 | Existing map = full; sibling partial + header |
| D4 | No projection ⇒ full segment (today) |
| D5 | Sorted-set equality for partial-segment hit |
| D6 | Reuse #114 ensureLoaded; fingerprint includes segment + projection |
| D7 | Reject partial mutations; mark partial segment `stale` on full mutation |
| D8 | Tracer deferred to Phase 5 (Blob without `contents` preferred) |
| D9 | Contract first; filter-after-read OK for Phase 1 |
| D10 | Segment key includes `applicationSection` |

---

## Phase 1 — Projection contract and persistence read

**Goal:** A read with `attributes: [...]` returns **only** those fields (or filters to them when the backend cannot project natively).

### 1.1  Schema / type: extractor may carry `attributes` — **DONE**

**Behavior:** Zod/types accept optional `attributes: string[]` on `extractorInstancesByEntity` / `extractorByPrimaryKey`.

**Done:** types + zod regenerated via schema-first path (Query ED + Endpoint assets → `devBuild`); tests in `instanceProjectionSchema.unit.test.ts`.

### 1.2  REST / PersistenceAction carries projection — **DONE**

**Behavior:** Forward projection; absent ⇒ full object as today.

**Done:** `attributes?: string[]` on `RestPersistenceAction_read` / `LocalPersistenceAction_read` / `getInstances` in **deployment assets** then regenerated; Rest client appends `?attributes=`; RestServer + `miroir-server` merge query params; LocalPersistenceAction→getInstances forwards attributes.

### 1.3  At least one backend honors projection — **DONE**

**Behavior (integ):** Response keys ⊆ allow-list ∪ identity fields (`uuid` / PK, `parentUuid`).

**Done:** `PersistenceStoreController.getInstances` / `getInstance` apply `projectEntityInstance(s)` after store read (filter-after-read). Identity via `resolveProjectionIdentityFields` → `getEntityPrimaryKeyAttributes`. Filesystem integ: `PersistenceStoreController.integ.test.tsx` (“get Miroir Entities with attribute projection”).

### 1.4  Non-regression: omit projection ⇒ full instance — **DONE**

**Behavior:** Existing paths without `attributes` unchanged.

**Done:** covered by schema + controller unit tests (omit attributes ⇒ same full objects).

**Gate 1:** 1.1–1.4 green.

#### Schema-first remediation (post Gate 1 review vs AGENTS.md)

| Issue | Fix |
|---|---|
| Hand-edited `preprocessor-generated/*` | Source of truth moved to Query ED `359f1f9b-…` + Endpoints `a93598b3-…` / `ed520de4-…`; `npm run build -w miroir-test-app_deployment-miroir` + `npm run devBuild -w miroir-core` |
| Unit-only / mocks | Added filesystem integ projection assertion |
| Hardcoded `uuid` identity | `resolveProjectionIdentityFields` uses PK helpers; optional `entityDefinition` on controller get APIs |

---

## Phase 2 — Local cache segments

**Goal:** Per `(deployment, section, entity)`, expose full segment (existing) and optional partial segment (homogeneous map + header). **No per-instance completeness fields.**

### 2.1  Partial segment write / replace

**Behavior:** Loading projected instances creates or **replaces** the partial segment: header `{ kind: "partial", projection, freshness: "fresh" }` + instance map. Does not write into the full segment.

### 2.2  Full segment write unchanged

**Behavior:** Non-projected `loadNewInstancesInLocalCache` (and #114 stage-C / executor full path) populate the full segment only.

### 2.3  Homogeneity / isolation

**Behavior:**
- Reading the full segment never returns partial objects.
- Reading the partial segment never returns full objects.
- Unit test: after both segments populated for same entity, maps are distinct; same `uuid` may exist in both with different attribute sets.

### 2.4  Segment freshness

**Behavior:** API can set partial (or full) segment `freshness: "stale"` without deleting instances; UI may still read the map.

**Gate 2:** 2.1–2.4 green; Redux + Zustand parity.

---

## Phase 3 — Routing + #114 report loader

**Goal:** Hook/selector picks segment from query shape; `ensureLoaded` fills that segment; remount short-circuits or refetches at **segment** level.

### 3.1  resolveCacheSegmentKind

**Behavior:** `attributes` present (non-empty) ⇒ `"partial"`; else `"full"`. Used by selector helpers and report load request construction — **not** inside per-instance loops.

### 3.2  Executor writes correct segment

**Behavior:** `createReportQueryLoadExecutor` with `projection` → partial segment replace; without → full segment (current #114 path).

### 3.3  Sufficiency short-circuit (segment-level)

**Behavior:** `ensureLoaded` skips network when:
- **full:** full segment present and `fresh` (and not `forceRefresh`);
- **partial:** partial segment present, `fresh`, and projection matches hit rule (D5).

### 3.4  Stale / mismatch / forceRefresh

**Behavior:** Segment `stale`, projection mismatch, or `forceRefresh` ⇒ exactly **one** server query (single-flight), then segment replace/update to `fresh`. Fingerprint includes segment kind + projection.

**Gate 3:** 3.1–3.4 green; still `useEnsureReportQueryLoaded` + sync selectors; **no** instance-level coverage checks.

---

## Phase 4 — Mutation guardrails

### 4.1  DomainController rejects partial create/update

**Behavior:** Payload identified as partial (type tag / missing required full shape / sourced from partial segment) ⇒ `Action2Error` before REST.

### 4.2  Successful mutation vs partial segment

**Behavior:** After successful create/update/delete on the full segment, partial segment for that entity is marked **`stale`** (D7) or dropped — test asserts it is not left silently `fresh` with outdated rows.

**Gate 4:** 4.1–4.2 green.

---

## Phase 5 — Tracer end-to-end

### 5.1  Tracer choice (D8)

Confirm: e.g. Blob list projecting `{ name, defaultLabel, uuid }` **without** `contents` → **partial segment**.

### 5.2  Behaviors

1. Refresh does not stage-C full Blob bodies if still lazy (#114); full segment absent/empty for Blob.
2. Open list report with projection → one projected read; **partial** segment filled `fresh`; UI lists labels.
3. Remount same fingerprint → no second network.
4. Mark partial segment `stale` or `forceRefresh` → exactly one new network call; segment replaced.
5. Query **without** `attributes` still targets **full** segment (does not silently read partial).
6. `updateInstance` with partial payload → rejected.

**Gate 5:** 5.2 green.

---

## Phase 6 — Acceptance / non-regression

| Check | Covered by |
|---|---|
| No projection ⇒ full objects / full segment | 1.4, 2.2 |
| Projection ⇒ wire subset + partial segment | 1.3, 2.1 |
| ≤2 segments; homogeneous | 2.3 |
| Routing by query shape, not per instance | 3.1 |
| #114 single-flight preserved | 3.x |
| Segment stale remount once | 3.4 |
| Mutations reject partial; stale partial segment | 4.x |
| Blob/lazy noise stays quiet | #114 + full-segment empty interim |

Non-regression pack: ConfigurationService startup; ReportHooks eager entities (full segment); Blob lazy path from #114.

---

## Refactor candidates (only after GREEN)

- Shared `resolveCacheSegmentKind` + sufficiency helper for executor and selectors.
- Postgres native projection before filesystem filter-after-read.
- Optional later: satisfy partial query from full segment in memory (explicit opt-in; not default).

Never refactor while RED. **Do not** introduce instance-level `coveredFields` during this plan.

---

## Implementation order reminder

```
WRONG:  per-instance completeness + mixed slices + all backends in one PR
RIGHT:  1.1 RED→GREEN → segments → routing/#114 → mutations → tracer
```

**Next coding slice after Gate 0:** **1.1 projection on extractor schema / types**.

---

## Open questions for Gate 0 (user)

**Resolved by defaults (2026-07-22).** Remaining only for later phases:

1. Phase 5 tracer confirmation (Blob without `contents`?).
2. Refresh seeding of stale partial segment (default: absent until report).

**Next coding slice:** **Phase 2 — local cache segments**.
