# 214 - Large entity instances: partial fetch, partial objects, cache evolution

Related issue: https://github.com/miroir-framework/miroir/issues/214  
Follow-up: #208 · synergy with [#114](https://github.com/miroir-framework/miroir/issues/114)  
TDD plan: [tdd-implementation-plan.md](./tdd-implementation-plan.md)

Status: analysis + TDD plan (Option C′ favored incremental path; Option B remains long-term target).

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
| **Partial query** | A query whose extractor carries a projection constraint; its result set consists of partial objects. |
| **Completeness metadata** | Per-instance metadata in the local cache recording whether an entry is `full` or `partial`, and in the partial case which attributes are present (`coveredFields`). |
| **Freshness metadata** | Per-instance metadata recording whether an entry is `fresh` or `stale`. `stale` means UI hooks may still read it, but the next report/`ensureLoaded` cycle is expected to query the server. |
| **Option C′** | Projected fetch on the wire **plus** writing partial objects into the **canonical** local cache with completeness + freshness metadata, remount-filled via the #114 report loader. Not pure Option C. |

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
  - `true` / absent → stage-C still loads all data instances for that Entity (full objects).
  - `false` → **omit** stage-C persistence read for that Entity (model stages A/B still load).
  - Report-triggered fill: `ReportQueryLoadService` + `useEnsureReportQueryLoaded` + `createReportQueryLoadExecutor` write into the **canonical** local cache; selectors remain synchronous.
  - Tracer: Miroir Blob with `cacheAllInstancesOnRefresh: false`.

Impact: refresh is no longer uniformly “entity-wide full load”. Report UI still **requires** local-cache writes for selectors to see data. Any #214 design that refuses to write projected results into that cache collides with this architecture.

## 2.5 Local cache assumes one completeness level per instance value

- Local cache state is `ids + entities` map (`EntityState`) with no completeness/projection metadata:
  - `packages/miroir-core/src/0_interfaces/2_domain/ReduxDeploymentsStateInterface.ts`
  - `packages/miroir-localcache-redux/src/4_services/localCache/LocalCacheSlice.ts`
  - `packages/miroir-localcache-zustand/src/4_services/localCache/LocalCacheSlice.ts`
- Domain state contracts expose `EntityInstancesUuidIndex` (plain instance map):
  - `packages/miroir-core/src/0_interfaces/2_domain/DomainControllerInterface.ts` (`L56-L71`)

Impact: no native way to represent partial/full coexistence in the local cache for the same entity key.

## 2.6 Mutation path does not distinguish full vs partial payloads

- `createInstance` / `updateInstance` payloads are `EntityInstance[]` with no "partial forbidden" guard:
  - `miroirFundamentalType.ts` (`L3870+`, `L3903+`, zod `L9678+`)
- DomainController sends the payload to the server (persistence store) then mirrors the change into the local cache:
  - `packages/miroir-core/src/3_controllers/DomainController.ts` (`handleInstanceAction`, `L863+`)

Impact: by type contract, partial objects cannot currently be prevented from mutation payloads sent to the persistence store.

---

## 3. Gaps to fill for #214

1. Projection gap: query schema/action contracts must carry requested fields.
2. Transport gap: REST and persistence-store interface signatures need projection-aware variants.
3. Persistence store gap: store implementations must fetch projected attributes only (or derive projected objects from full records when the backend cannot project natively).
4. Local cache semantics gap: the local cache must track completeness/projection coverage per instance or per view.
5. Mutation safety gap: runtime and schema checks must reject partial object payloads for `createInstance` / `updateInstance` (at both the local cache ingestion point and the server endpoint).
6. Immutability gap: partial objects need explicit immutability guarantees.
7. Selector gap: query selectors must behave correctly when the local cache holds a mix of full and partial instances.

---

## 4. Three design options

## Option A - Separate partial-view slot in the local cache (query-result scoped)

Summary:
- Keep the existing canonical entity slot in the local cache unchanged (full objects only).
- Add a dedicated "partial views" slot in the local cache, keyed by `(deployment, section, entity, projectionSignature, filter/order/paging key)`.
- Partial queries read/write this separate local cache slot only; results are never merged into the canonical full-object slot.
- The server (and underlying persistence stores) still serves the projected subset of attributes.

Pros:
- Lowest disruption to existing selectors and mutation flow.
- No immediate change to canonical entity maps in the local cache.
- Clear safety boundary: partial objects never enter the canonical local cache slot.

Cons:
- Data duplication: the same entity row can exist both as a full object in the canonical local cache slot and as a partial object in the views slot.
- Harder consistency: when a full object is updated or deleted in the canonical local cache slot, the views slot must be invalidated.
- More invalidation paths and additional memory overhead.

Impact assessment:
- Functional risk: medium (staleness divergence across the two local cache slots).
- Implementation effort: medium.
- Performance gain: good on network (fewer bytes from the persistence store); mixed on local cache memory due to duplication.
- Backward compatibility: high.

### Sufficiency check for Option A

When a query on Entity A is executed against the local cache:

1. **Projection matching**: compare the query's projection (attribute allow-list) against the projection key stored in the partial-views slot. An exact match (or a super-set already cached) is sufficient; a request for an attribute not covered requires a new fetch from the server/persistence store.
2. **Filter/order/paging scope**: the cached slot is also keyed by the filter and paging parameters. Any difference — even a narrower filter — must be treated as a cache miss and re-fetched from the server, because the partial-views slot holds only the result of the *exact* previous query, not a superset from which a sub-filter could be derived in-memory.
3. **Staleness policy**: the partial-views slot carries no inherent freshness guarantee. A staleness budget (TTL, or explicit invalidation on write to the canonical slot) must be defined; absent that, every navigation away and back would re-fetch.
4. **Canonical upgrade**: if the canonical local cache slot already holds a full object for the requested primary key, the full object can satisfy any projection query in-memory without going to the server — the sufficiency check should consult the canonical slot first.

Implementation implication: the sufficiency check requires a two-step lookup (canonical slot first, then partial-views slot), plus a projection-coverage comparison on each cache hit.

## Option B - Unified canonical local cache with completeness metadata (long-term target)

Summary:
- Keep one canonical instance map per entity key in the local cache.
- Each local cache entry carries completeness metadata:
  - completeness state (`full` | `partial`)
  - covered field set for partial state
  - optional provenance/version markers.
- A projection fetch from the server merges into the canonical local cache entry and updates coverage metadata.
- A full fetch from the server upgrades the local cache entry to `full`.
- Mutation actions (`createInstance` / `updateInstance`) require `full` coverage (or an explicit required-field policy), otherwise the action is rejected before reaching the server.

Pros:
- Single source of truth for identity in the local cache.
- No duplicate rows across full/partial slots.
- Deterministic merge/upgrade semantics.
- Strong foundation for future cache policy work from #208.

Cons:
- Requires touching core local cache state contracts and selectors.
- Broader rollout across Redux and Zustand implementations.
- Requires careful migration to avoid regressions.

Impact assessment:
- Functional risk: medium-low (if invariants are enforced centrally).
- Implementation effort: high.
- Performance gain: high (fewer bytes from the persistence store + controlled local cache memory growth).
- Backward compatibility: medium (internal local cache contract evolution needed).

### Sufficiency check for Option B

When a query on Entity A is executed against the local cache:

1. **Look up the local cache entry**: retrieve the entry for the requested primary key (or all entries for `getInstances`).
2. **Inspect completeness metadata**:
   - If the entry is `full`, any projection can be satisfied in-memory — no fetch needed.
   - If the entry is `partial`, compare the query's requested attribute set against the `coveredFields` set in the metadata. If the covered set is a superset of the requested set, the query is satisfiable in-memory. Otherwise, a fetch with the missing attributes (or a full fetch) is required from the server.
3. **Missing entries**: if no local cache entry exists for the key, fetch from the server with the declared projection.
4. **Filter/order/paging scope**: for `getInstances`-style queries, the local cache must hold a complete result set for the scope (entity + filter + order). A projection hit on individual entries is insufficient if the filter scope was never fully loaded; a "scope completeness" marker (analogous to entry-level coverage, but for result-set membership) is therefore also needed.

Implementation implication: the sufficiency check is a two-level test — entry-level field coverage, and scope-level membership coverage. Both must pass before the local cache can serve the query without a server round-trip.

## Option C - No persistent partial objects; projection only as ephemeral query result

Summary:
- Support projection at the persistence-store/query layer so the server returns fewer bytes, but do not store partial objects in the local cache at all.
- Partial query results are transient output of query execution, consumed and discarded by the UI component; they are never written to the local cache.
- The local cache stores only full instances.

Pros:
- Very low local cache-model complexity.
- Minimal impact on existing local cache *structures*.
- Strong separation of responsibilities (local cache = full objects only; projection = a read-optimisation concern of the query engine).

Cons:
- Repeated queries re-fetch the same projected data unless some other client store appears.
- Limited benefit for UI flows that rely on local-cache-driven re-use.
- Contradicts the issue intent of partial objects living in application space with lifecycle.
- **After #114: architectural collision** — Reports and related UI are fed by synchronous selectors over the local cache; `ensureLoaded` exists precisely to fill that cache. Ephemeral-only results force a second async data path (or render-time fetch), undoing #114’s “render never dispatches / single-flight ensure” contract. The apparent “low cache complexity” is paid back as **hook/selector complexity** across Reports and any consumer that currently assumes cache-backed sync reads.

Impact assessment:
- Functional risk: **high for UI architecture** (not for store backends alone).
- Implementation effort: low-medium for projection plumbing; **high** if UI must be re-plumbed around ephemeral bags.
- Performance gain: medium on network; low on client re-use; **negative** if remount storms reappear.
- Backward compatibility: high for cache maps; **low** for #114 Report path.

### Why pure Option C is not worth it (post-#114)

| Hoped benefit of pure C | Post-#114 reality |
|---|---|
| Skip local-cache evolution | True, but then Reports cannot consume projected data without a parallel channel |
| Network savings | Still available under C′ / B without abandoning the cache |
| Simpler mental model | False once UI needs both “cache for full” and “ephemeral for partial” |
| Positive points vs effort | **Insufficient** — pay projection work *and* fracture the selector architecture |

**Verdict:** reject pure Option C as the delivery vehicle for #214. Keep its *network* idea; drop its *never write to cache* rule.

## Option C′ - Projected fetch + stale/partial entries in the canonical local cache (favored incremental path)

Summary:
- Projection on the wire (Option C’s network win).
- Write projected results into the **same** canonical local-cache slot as full instances, with:
  - `completeness: full | partial` + `coveredFields` when partial
  - `freshness: fresh | stale`
- UI hooks may render stale/partial data at will after refresh (or after a prior report fill).
- **Report mount** (and the existing #114 `ReportQueryLoadService.ensureLoaded`) triggers a server query when the entry is missing, incomplete for the requested projection, `stale`, or `forceRefresh`.
- Mutations still require full objects (same safety as Option B).

This is a **subset / first slice of Option B**: entry-level completeness + freshness + #114 remount load, without yet requiring full scope-level completeness for arbitrary filter/order/paging (that remains Option B’s later phase).

Pros:
- Preserves #114 invariants (sync selectors, effect-driven load, single-flight).
- Delivers #214 partial objects in application space with lifecycle.
- Network savings without dual caches (avoids Option A).
- Natural upgrade path to full Option B (add scope markers later).

Cons:****
- Still requires local-cache meta (not zero cache change).
- Sufficiency logic must understand projection coverage + freshness (shared with B).
- Refresh may still leave large Entities empty until report mount (#114 lazy) — seeding “stale partial headers” on refresh is optional and deferred.

Impact assessment:
- Functional risk: medium-low (central meta + reuse of proven loader).
- Implementation effort: medium (projection + meta + loader extension; not full B scope markers).
- Performance gain: high on network for large attributes; good remount re-use when `fresh` + covering fields.
- Backward compatibility: medium (internal meta; default without projection stays full/fresh).

### Sufficiency check for Option C′ (entry-level, report path)

When `ensureLoaded` runs for a report query with optional projection:

1. If no local entry (and lazy-on-refresh Entity) → fetch with projection → write `partial`+`fresh` (or `full` if no projection).
2. If entry `full` and `fresh` → short-circuit (no network).
3. If entry `partial` and `fresh` and `coveredFields ⊇ requested` → short-circuit.
4. If entry `stale` or coverage insufficient or `forceRefresh` → one server query (single-flight) → merge/upgrade meta.

Filter/order/paging **scope** completeness remains out of C′ gate (see Option B § sufficiency #4); report fingerprints already limit remount identity as in #114.

---

## 4bis. Synergy with #114 and #208 (architecture context larger than one TDD slice)

### #114 — cache usage regulation by Entity

| Concern | #114 answer | #214 / C′ extension |
|---|---|---|
| Who loads data for lazy Entities? | Report `ensureLoaded` | Same; request may carry `projection` |
| Where do results live? | Canonical local cache | Same; entries may be partial/stale |
| Sync UI? | Selectors over cache | Unchanged; meta-aware later |
| Refresh stage-C skip | `cacheAllInstancesOnRefresh: false` | Orthogonal to projection; may later seed stale partials |

Documents: `code-helpers/features/114-FEATURE- enable of cache usage regulation policy by Entity/{analysis.md,tdd-implementation-plan.md}`.

### #208 — cardinality / payload / freshness axes

| Axis | Primary owner | Notes |
|---|---|---|
| Cardinality (# instances) | #114 (all-or-none) + later windows | Projection alone does not shrink row count |
| Payload size (bytes/instance) | **#214** | Attribute projection |
| Freshness | #208 policy + **C′ `stale`** + #114 remount | `neverTrustCache` ≈ always treat as stale / forceRefresh |

Do not merge “lazy on refresh” with “always stale”: a lazy Entity can still hold a `fresh` partial after report fill until invalidated.

### Larger concerns (tracked here; not all in first TDD gates)

1. **Scope completeness** (filter/order/paging membership) — Option B; deferred past C′.
2. **Refresh seeding of stale partial headers** vs absent-until-report — product choice; default keep #114 absent for Phase 1–5.
3. **Backend-native projection** (Postgres `SELECT cols`) vs filter-after-full-read (filesystem) — performance quality, same client contract.
4. Dual Redux/Zustand meta parity — mandatory for any cache meta work.

These concerns are why analysis recommends C′ as the **incremental vehicle**, with Option B as the **end-state**, rather than treating pure C as a cheap shortcut.

---

## 5. Recommendation

**Long-term target:** Option B (unified canonical cache + completeness, including scope markers).  
**Near-term delivery vehicle:** **Option C′** (projection + entry-level partial/stale meta + #114 remount `ensureLoaded`).  
**Reject:** pure Option C (ephemeral-only) after #114.  
**Avoid as primary:** Option A (dual slots), unless a temporary spike proves otherwise.

Why this split:

1. Option B still best matches #214’s full question (partial/full identity + future scope coverage) and #208 provenance direction.
2. Pure Option C’s “save cache work” is illusory once Reports must stay selector-driven.
3. C′ reuses #114’s loader/hook architecture, so implementation risk stays in projection + meta, not UI re-architecture.
4. C′ is a strict subset of B’s entry-level story; scope markers can land in a follow-up without rewriting the cache slot again.

Pragmatic rollout (see [tdd-implementation-plan.md](./tdd-implementation-plan.md)):

- Phase 1: projection contract on extractors / REST / at least one backend.
- Phase 2: local-cache completeness + freshness meta (Redux + Zustand).
- Phase 3: extend #114 report executor/`ensureLoaded` for projection + stale remount.
- Phase 4: mutation rejects partial.
- Phase 5: tracer E2E (e.g. Blob list without `contents`).
- Later (Option B remainder): scope-level completeness for filter/order/paging.

---

## 6. Proposed invariants (for Option B / C′)

1. Identity invariant: one canonical local cache entry per `(deployment, section, entity, primaryKey)`.
2. Coverage invariant: each canonical local cache entry carries completeness metadata (`full` | `partial` + `coveredFields` when partial).
3. Freshness invariant (C′): each entry carries `fresh` | `stale`; `stale` does not delete data and does not by itself forbid UI read; it obliges the next `ensureLoaded` (when consulted) to hit the server.
4. Upgrade invariant: a full fetch from the server always supersedes partial coverage in the local cache and sets `fresh`.
5. Merge invariant: a projected fetch merges only the projected fields into the local cache entry; un-fetched fields remain unchanged; coverage expands.
6. Safety invariant: mutation payloads sent to the server must be full objects (or satisfy an explicit required-coverage policy); the DomainController enforces this before the REST call.
7. Immutability invariant: partial query results exposed to consumers (UI components, selectors) are read-only snapshots.
8. Loader invariant (#114): Report render never dispatches network I/O; only `ensureLoaded` / effects do; projected fills use the same single-flight loader.

---

## 7. Implementation surfaces to change

- Schemas / generated types:
  - extractor definitions (`ExtractorInstancesByEntity`, `ExtractorByPrimaryKey`)
  - `InstanceAction` if projection-enabled direct-get actions are retained.
- Server / transport:
  - `PersistenceStoreController` projection-aware get APIs
  - `RestServer` request/response projection carriage.
- Persistence store backends:
  - filesystem, indexedDb, postgres instance-store mixins and SQL generators.
- Local cache implementations:
  - Redux and Zustand `LocalCacheSlice` state models + reducers + selectors.
- Domain/query runners:
  - in-memory and SQL runners honoring projection contracts and local cache sufficiency checks.
- Guardrails:
  - mutation validation in `DomainController` and/or action schema validators (blocks partial objects before they reach the server).

---

## 8. Test impact and required coverage

Integration-first coverage should include:

1. Projection query to the server returns only the requested fields (not the full object).
2. Partial result stored in the local cache with correct completeness **and** freshness metadata.
3. Subsequent full fetch from the server upgrades the same local cache entry to `full` + `fresh`.
4. Mutation (`createInstance` / `updateInstance`) with a partial object payload is rejected by the DomainController with an explicit error before reaching the server.
5. Local cache coherence across create/update/delete after partial/full coexistence.
6. Persistence store parity: filesystem, indexedDb, postgres all satisfy projection contracts (native or filter-after-read).
7. **#114 synergy:** `ensureLoaded` projected fill; remount short-circuit when `fresh` + covering fields; exactly one refetch when `stale` / `forceRefresh`.
8. Non-regression: eager Entities and Blob lazy path without projection still behave as today.

---

## 9. Open decisions for implementation (Gate 0)

1. Projection syntax: allow-list only (`attributes: string[]`) vs richer field paths. **Default for C′:** allow-list.
2. Required coverage for `updateInstance`: full-only or "fields-being-updated must be present". **Default:** full-only.
3. Metadata location: inline with entities vs sidecar map keyed by same index.
4. Policy defaults for entities without explicit cache/projection directives. **Default:** full fetch, `completeness: full`, `freshness: fresh`.
5. Exact immutability mechanism (frozen objects vs readonly typing + discipline).
6. Confirm delivery vehicle **Option C′** (vs pure C / big-bang B).
7. Tracer Entity for Phase 5 (Blob without `contents` vs other).
8. Whether refresh may seed **stale partial headers**, or keep #114 absent-until-report for first slices.

---

## 10. Short conclusion

The stack remains largely full-object centric (schema, API, persistence store, local cache), but **#114 already changed the load topology**: lazy Entities skip refresh stage-C and rely on report `ensureLoaded` writing into the canonical local cache for sync selectors.

**Pure Option C** (project on the wire, never write partials) does not buy enough positive points after that change — it would reopen a parallel UI data path. **Option C′** keeps projection, stores partials with `stale`/`fresh` + completeness in the canonical cache, and remount-refreshes via #114. **Option B** remains the long-term target once scope-level completeness is needed.
