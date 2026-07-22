# 214 - Large entity instances: partial fetch, partial objects, cache evolution

Related issue: https://github.com/miroir-framework/miroir/issues/214  
Follow-up: #208 · synergy with [#114](https://github.com/miroir-framework/miroir/issues/114)  
TDD plan: [tdd-implementation-plan.md](./tdd-implementation-plan.md)

Status: analysis + TDD plan — **Option C′ (entity-bound segments)** is the favored delivery path. Instance-level completeness (classic Option B) is deferred / disfavored for near-term due to local-cache and monitoring complexity.

---

## 0. Vocabulary

The terms below are used precisely throughout this document.

| Term | Meaning |
|------|---------|
| **Persistence store** | Server-side, durable storage backend (file system, PostgreSQL, IndexedDB on Node/Electron). Accessed by the client exclusively via REST calls to `miroir-server`. |
| **Server** | The `miroir-server` process (or its in-process emulation in tests) that wraps persistence stores and exposes REST endpoints. |
| **Local cache** | Client-side, non-persistent, in-memory entity state managed by Redux (`LocalCacheSlice`) or Zustand. Lives in the browser/webapp process. Not directly backed by any durable medium. |
| **Entity instance** | A single data record identified by `(deployment, section, entity, primaryKey)`. |
| **Full object** | An entity instance carrying all attributes declared in its EntityDefinition. |
| **Partial object** | An entity instance carrying only a declared subset of its attributes (a *projection*). Immutable; cannot be used as a create/update payload. |
| **Projection** | An explicit allow-list of attribute names requested for a fetch. |
| **Partial query** | A query whose extractor carries a projection constraint (`attributes`); its result set consists of partial objects. |
| **Segment** | An entity-bound slice of the local cache for one `(deployment, section, entity)`. At most **two** segments exist: **`full`** and **`partial`**. All instances inside a segment share the same completeness class — no mixed full/partial rows in one segment. |
| **Segment freshness** | Segment-level `fresh` \| `stale`. UI may still read a stale segment; the next report/`ensureLoaded` for that segment is expected to query the server. |
| **Segment projection** | For the `partial` segment only: the attribute allow-list that defines what every instance in that segment carries. Owned at **segment** level, not per instance. |
| **Option C′** | Projected fetch on the wire **plus** writing into the **partial segment** of the local cache (with segment freshness), remount-filled via the #114 report loader. Queries without projection use the **full segment** (today’s behavior). Not pure Option C; not instance-level Option B. |

---

## 1. Problem restatement

Issue #214 asks for:

1. Avoid fetching all attributes of entity instances from the persistence store.
2. Introduce partial objects in application space (webapp/browser local cache, and by extension the Electron process whose inner runtime is the same webapp).
3. Ensure partial objects are immutable.
4. Forbid partial objects as payload to `createInstance` / `updateInstance`.
5. Define the relationship between partial and full objects in the local cache.

---

## 2. Code review findings (current baseline)

## 2.1 Query model does not express projection

- `ExtractorInstancesByEntity` has `filter` and `orderBy`, but no projected attribute list:
  - `packages/miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.ts` (type around `L3354`, zod around `L9611`).
- `ExtractorByPrimaryKey` also has no projection contract.

Impact: there is no schema-level way to ask "only these fields".

## 2.2 Instance fetch APIs are full-object oriented

- `InstanceAction` for `getInstance` / `getInstances` has only identity/parent info, no projection metadata:
  - `miroirFundamentalType.ts` around `L3956-L3974`, zod around `L9679`.
- Persistence-store interfaces:
  - Store section: `getInstance(parentUuid, instancePrimaryKey)`, `getInstances(parentUuid)`  
    (`packages/miroir-core/src/0_interfaces/4-services/PersistenceStoreControllerInterface.ts` `L84-L100`)
  - Controller: `getInstance(section, parentUuid, uuid)`, `getInstances(section, parentUuid)`  
    (`packages/miroir-core/src/4_services/PersistenceStoreController.ts` `L682+`, `L712+`)

Impact: every caller currently receives full entity instances from the server.

## 2.3 Persistence store backends fetch full records today

- File system: reads and parses full JSON files (`readFileSync` + `JSON.parse`)
  - `packages/miroir-store-filesystem/src/4_services/FileSystemInstanceStoreSectionMixin.ts` (`L115+`, `L139+`)
- IndexedDB: `getAllValue(parentUuid)` returns full stored values
  - `packages/miroir-store-indexedDb/src/4_services/IndexedDbInstanceStoreSectionMixin.ts` (`L115+`)
- Postgres:
  - `getInstances` uses `findAll()` without attribute selection (`L447+`)
  - SQL generation path uses `SELECT *` (`sqlForQuery`, around `L134`, `L175`)
  - file: `packages/miroir-store-postgres/src/4_services/sqlDbInstanceStoreSectionMixin.ts`

Impact: over-fetch from the persistence store is systemic across all backends.

## 2.4 Refresh / report load path (updated by #114)

- Historically, `DomainController` refresh fetched whole entity collections and pushed them via `loadNewInstancesInLocalCache` (stages ending in data stage-C).
- **#114** introduced per-Entity `cache.cacheAllInstancesOnRefresh`:
  - `true` / absent → stage-C still loads all data instances for that Entity (full objects into today’s single slice = future **full segment**).
  - `false` → **omit** stage-C persistence read for that Entity (model stages A/B still load).
  - Report-triggered fill: `ReportQueryLoadService` + `useEnsureReportQueryLoaded` + `createReportQueryLoadExecutor` write into the local cache; selectors remain synchronous.
  - Tracer: Miroir Blob with `cacheAllInstancesOnRefresh: false`.

Impact: refresh is no longer uniformly “entity-wide full load”. Report UI still **requires** local-cache writes for selectors to see data. Any #214 design that refuses to write projected results into that cache collides with this architecture — but writes should target the **partial segment**, not mix completeness into the full segment.

## 2.5 Local cache assumes one slice per entity (full objects only)

- Local cache state is `ids + entities` map (`EntityState`) with no segment dimension and no projection metadata:
  - `packages/miroir-core/src/0_interfaces/2_domain/ReduxDeploymentsStateInterface.ts`
  - `packages/miroir-localcache-redux/src/4_services/localCache/LocalCacheSlice.ts`
  - `packages/miroir-localcache-zustand/src/4_services/localCache/LocalCacheSlice.ts`
- Domain state contracts expose `EntityInstancesUuidIndex` (plain instance map):
  - `packages/miroir-core/src/0_interfaces/2_domain/DomainControllerInterface.ts` (`L56-L71`)

Impact: today’s map is effectively the **full segment**. There is no second slot for a homogeneous partial population.

## 2.6 Mutation path does not distinguish full vs partial payloads

- `createInstance` / `updateInstance` payloads are `EntityInstance[]` with no "partial forbidden" guard:
  - `miroirFundamentalType.ts` (`L3870+`, `L3903+`, zod `L9678+`)
- DomainController sends the payload to the server (persistence store) then mirrors the change into the local cache:
  - `packages/miroir-core/src/3_controllers/DomainController.ts` (`handleInstanceAction`, `L863+`)

Impact: by type contract, partial objects cannot currently be prevented from mutation payloads sent to the persistence store. Mutations must remain **full-segment-only**.

---

## 3. Gaps to fill for #214

1. Projection gap: query schema/action contracts must carry requested fields.
2. Transport gap: REST and persistence-store interface signatures need projection-aware variants.
3. Persistence store gap: store implementations must fetch projected attributes only (or derive projected objects from full records when the backend cannot project natively).
4. **Segment gap:** local cache must expose at most two segments per `(deployment, section, entity)` — `full` and `partial` — with segment-level projection + freshness on the partial segment.
5. **Routing gap:** hooks/selectors must choose segment by query shape (`attributes` present → partial; else → full). No per-instance completeness test inside a segment.
6. Mutation safety gap: reject partial payloads for `createInstance` / `updateInstance`; mutation mirror writes only the full segment (and invalidate or mark stale the partial segment).
7. Immutability gap: partial objects need explicit immutability guarantees.
8. Loader gap: #114 `ensureLoaded` must write projected fills into the partial segment (and full fills into the full segment).

---

## 4. Design options

## Option A - N partial-view slots (query-result scoped)

Summary:
- Keep the existing canonical entity slot (full objects only).
- Add many “partial views” keyed by `(deployment, section, entity, projectionSignature, filter/order/paging key)`.
- Partial queries read/write those slots only.

Pros: clear isolation from full objects.  
Cons: unbounded slot count, invalidation matrix, memory churn; heavier than needed for #214’s first cut.

**Not favored** as primary — see **segments** (C′) which caps at **two** slots per entity.

## Option B - Unified map with **instance-level** completeness metadata

Summary:
- One map per entity; each instance carries `full | partial`, `coveredFields`, optional freshness.
- Selectors/extractors must test each instance for inclusion and attribute coverage; mixed completeness inside one slice is normal.

Pros: single identity map; elegant merge/upgrade story on paper.  
Cons (**decisive for deferral**):
- Query execution against local cache must inspect **every** instance’s meta (inclusion + coverage).
- Mixed full/partial in one slice complicates error management, monitoring, and “what does this Entity look like in cache?” diagnostics.
- Higher Redux/Zustand churn and selector complexity than segment routing.

Impact assessment: high implementation and operational cost relative to benefit for the first #214 slices.

**Deferred** — not the near-term vehicle. May be revisited only if segment model proves insufficient.

## Option C - Ephemeral partials only (never write to local cache)

Summary: project on the wire; discard results after the consumer finishes; local cache stays full-only.

**Rejected after #114** — Reports need sync selectors over cache; ephemeral bags reopen a parallel UI path. See prior critique in history / TDD preamble.

## Option C′ - Entity-bound segments (favored)

Summary:
- Projection on the wire (Option C’s network win).
- Local cache per `(deployment, section, entity)` has **at most two segments**:
  - **`full`** — today’s behavior; all instances are full objects.
  - **`partial`** — homogeneous partial instances under one **segment-level** projection allow-list; segment-level freshness `fresh | stale`.
- **Routing (hook- or selector-level):**
  - extractor / load request carries `attributes` → run against **partial** segment;
  - otherwise → run against **full** segment (default; current behavior).
- **No instance-level completeness decision** for query inclusion: a segment is all-or-nothing for completeness class.
- **#114 remount:** `ensureLoaded` with projection fills/refreshes the **partial** segment; without projection fills the **full** segment. Segment `stale` or projection mismatch ⇒ one server round-trip (single-flight).
- Mutations use / write **full** segment only; partial segment is invalidated or marked `stale` on successful mutation of that entity.

### Why segments beat instance-level B for this issue

| Concern | Instance-level B | Segment C′ |
|---|---|---|
| Query inclusion | Per-instance meta tests | Segment pick once, then normal extractor over homogeneous map |
| Mixed rows in a slice | Yes | **Forbidden** |
| Monitoring / errors | “Which rows are partial?” noise | Segment status + projection signature |
| Local-cache churn | Meta on every EntityAdapter entry | Second sibling map + small segment header |
| Cap on views | N/A (one map) | **≤ 2 segments** per entity |

### Sufficiency check for Option C′ (segment-level)

When `ensureLoaded` / a selector runs for Entity E:

1. **Choose segment:** `attributes` present → `partial`; else → `full`.
2. **Full segment:** if missing and lazy (#114) → fetch full (or empty interim); if `fresh` with data → short-circuit; if `stale` / `forceRefresh` → refetch full into full segment.
3. **Partial segment:**
   - If absent → projected fetch → replace/create partial segment with that projection + `fresh`.
   - If present and segment projection **equals** (or is a declared compatible match of) requested `attributes`, and freshness is `fresh` → short-circuit.
   - If projection **mismatch**, or `stale`, or `forceRefresh` → one projected fetch → **replace** partial segment (homogeneous rebuild; no per-row merge).
4. Do **not** satisfy a partial query by reading the full segment in the default path (optional later optimization: project-from-full in memory). Keeping paths separate preserves monitoring clarity for the first slices.

Filter/order/paging **scope** completeness (membership of “all rows matching filter”) remains a later concern; report fingerprints already bound remount identity as in #114.

### Relation to Option A

Segments are a **strictly smaller** dual-slot model than A’s N query-keyed views: one partial segment per entity, not one per (projection × filter × page). When a different projection is needed, the partial segment is rebuilt, not accumulated.

---

## 4bis. Synergy with #114 and #208

### #114 — cache usage regulation by Entity

| Concern | #114 answer | #214 / C′ (segments) |
|---|---|---|
| Who loads data for lazy Entities? | Report `ensureLoaded` | Same; request may carry `projection` → **partial segment** |
| Where do results live? | Local cache entity slice | **Full or partial segment** under that entity |
| Sync UI? | Selectors over cache | Selectors take an explicit **segment** (or infer from extractor) |
| Refresh stage-C skip | `cacheAllInstancesOnRefresh: false` | Orthogonal; stage-C still targets **full** segment when it runs |

Documents: `code-helpers/features/114-FEATURE- enable of cache usage regulation policy by Entity/{analysis.md,tdd-implementation-plan.md}`.

### #208 — cardinality / payload / freshness axes

| Axis | Primary owner | Notes |
|---|---|---|
| Cardinality (# instances) | #114 (all-or-none) + later windows | Projection alone does not shrink row count |
| Payload size (bytes/instance) | **#214** | Attribute projection into **partial segment** |
| Freshness | #208 + **segment `stale`** + #114 remount | `neverTrustCache` ≈ forceRefresh on the chosen segment |

Do not conflate “lazy on refresh” with “segment stale”: after a report fill, the partial segment can be `fresh` until invalidated.

### Larger concerns (tracked here; not all in first TDD gates)

1. **Projection mismatch policy** on partial segment: always replace vs require exact attribute-list equality for hit (default: exact match for hit; mismatch ⇒ replace).
2. **Optional** “project from full segment in memory” to avoid network when full is present — deferred (blurs monitoring).
3. Scope completeness for filter/order/paging — later.
4. Whether refresh may seed a **stale partial** segment (headers) vs #114 absent-until-report — default keep absent for Phase 1–5.
5. Redux + Zustand segment parity.
6. Instance-level Option B — only if segments fail product needs.

---

## 5. Recommendation

**Near-term delivery vehicle:** **Option C′ — entity-bound full/partial segments** + projection on the wire + #114 remount fill.  
**Reject:** pure Option C (ephemeral-only).  
**Defer:** instance-level Option B (mixed completeness in one map).  
**Avoid as primary:** Option A’s unbounded view keys (segments already give the dual-slot isolation without N keys).

Why:

1. Preserves #114’s sync selectors / `ensureLoaded` contract without instance-level meta sprawl.
2. Homogeneous segments simplify query execution, errors, and monitoring.
3. Caps local-cache structural growth at **+1 segment** per entity that uses partials.
4. Still delivers #214 partial objects in application space with lifecycle and mutation safety.

Pragmatic rollout (see [tdd-implementation-plan.md](./tdd-implementation-plan.md)):

- Phase 1: projection contract on extractors / REST / at least one backend.
- Phase 2: local-cache **segment** plumbing (full = existing; add partial + segment header).
- Phase 3: hook/selector routing + #114 loader writes to the correct segment; segment stale remount.
- Phase 4: mutation rejects partial; mutations touch full segment only; invalidate/stale partial.
- Phase 5: tracer E2E (e.g. Blob list without `contents` → partial segment).

---

## 6. Proposed invariants (Option C′ segments)

1. **Segment cardinality:** for each `(deployment, section, entity)`, at most one `full` segment and at most one `partial` segment.
2. **Homogeneity:** every instance in the full segment is a full object; every instance in the partial segment is a partial object under the **same** segment projection.
3. **No instance-level completeness:** query routing never inspects per-row `coveredFields`; it selects a segment, then runs the extractor on that map.
4. **Routing:** presence of projection/`attributes` on the query/load request selects the partial segment; absence selects the full segment.
5. **Freshness:** segment-level `fresh | stale`; stale does not forbid UI read; `ensureLoaded` for that segment must hit the server when consulted.
6. **Partial replace:** a projected fetch rebuilds the partial segment as a unit (no per-row merge with different projections).
7. **Mutation safety:** create/update payloads must be full objects; DomainController rejects partials; successful mutations write the full segment and invalidate or mark stale the partial segment for that entity.
8. **Immutability:** partial objects exposed to consumers are read-only snapshots.
9. **Loader (#114):** Report render never dispatches network I/O; only `ensureLoaded` / effects do; projected fills target the partial segment.

---

## 7. Implementation surfaces to change

- Schemas / generated types: extractor `attributes?: string[]`.
- Server / transport / persistence backends: projection-aware reads.
- Local cache (Redux + Zustand): sibling **partial segment** + segment header (`projection`, `freshness`); existing map becomes the full segment.
- Selectors / report hooks: segment selection from extractor shape.
- `ReportQueryLoadService` / executor: write target = segment; fingerprint includes segment + projection.
- DomainController mutations: full-only; partial-segment invalidation.

---

## 8. Test impact and required coverage

1. Projection query returns only requested fields on the wire.
2. Projected fill lands in the **partial** segment with matching segment projection + `fresh`.
3. Non-projected fill lands in the **full** segment; partial segment untouched (unless invalidate policy says otherwise).
4. Selector/hook with `attributes` reads partial segment only; without reads full segment only — **no mixed-slice behavior**.
5. Projection mismatch or segment `stale` / `forceRefresh` ⇒ exactly one refetch and partial-segment replace.
6. Mutation with partial payload rejected; mutation of full instance does not leave partial segment silently “fresh” with outdated rows (invalidate or stale).
7. #114 single-flight + effect contract preserved.
8. Non-regression: eager Entities and Blob lazy path without projection still use the full segment as today.

---

## 9. Open decisions for implementation (Gate 0)

1. Projection syntax: allow-list only (`attributes: string[]`). **Default:** allow-list.
2. Partial-segment hit rule: exact attribute-list equality vs sorted-set equality vs “requested ⊆ segment projection”. **Default proposal:** sorted-set equality for hit; otherwise replace.
3. On full-segment mutation: **invalidate** (drop) partial segment vs mark `stale`. **Default proposal:** mark `stale` (UI can still show list until remount refresh).
4. Segment key includes `applicationSection`? **Default:** yes (`deployment, section, entity`).
5. Immutability mechanism (freeze vs readonly discipline).
6. Tracer for Phase 5 (Blob without `contents`?).
7. Refresh seeding of stale partial segment vs #114 absent-until-report. **Default:** absent until report.
8. Confirm **defer instance-level Option B**.

---

## 10. Short conclusion

#114 made Reports depend on local-cache fills and sync selectors. #214 needs projected fetches and partial objects without blowing up that architecture.

**Pure Option C** (never cache partials) is rejected. **Instance-level Option B** (mixed completeness in one map) is deferred — too costly for query inclusion, errors, and monitoring. **Option C′** stores at most two **homogeneous segments** per entity (`full` / `partial`), routes at hook/selector level by whether the query specifies `attributes`, and remount-refreshes via #114 `ensureLoaded` with segment-level freshness.
