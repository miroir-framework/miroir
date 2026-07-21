# 208 — Classical client / server issues on data access / refresh / caching

> First analysis: map classical client–server data-access / refresh / caching problems onto
> the Miroir Framework’s actual architecture (Deployments, DomainController, local cache,
> Entity / EntityDefinition, Query, Report, Extractors), catalogue the situations already
> visible in the product, and relate the issue’s proposed techniques to existing model hooks.

Related issue: https://github.com/miroir-framework/miroir/issues/208  
Background: [data-architecture-deployments.md](../../../docs/reference/data-architecture-deployments.md) ·
[core-concepts.md](../../../docs/guides/core-concepts.md) ·
LocalCache state model in `packages/miroir-core/src/0_interfaces/2_domain/LocalCacheInterface.ts`

**Status:** first analysis / design framing — **no implementation**. Decision gate before
specifying a consistency DSL or changing the load path.

---

## 1. Problem restatement (from #208)

Classical client/server applications must sometimes **avoid loading “too much” data** (network
and client-cache limits) while still showing the user **consistent, sufficiently fresh** data.
Without that balance, product value drops quickly.

Issue examples:

1. **Large Entity instances (e.g. Blob)** — too large to batch-load; load should be by instance
   UUID (or UUID list), but a list of existing instances is still needed before accessing
   individuals.
2. **Always-stale Entities** — some Entities must never be served from cache without a refresh
   (cached instances are immediately stale / cache-evictable; every Report display must
   network-fetch).

Identified problem classes:

| Class | Meaning in practice |
|-------|---------------------|
| Multi-origin loading | Same item “required” from several Reports / Queries / Actions at once |
| Cache under-eviction | Stale or oversized data kept longer than it should |
| Cache over-eviction | Useful data dropped while still needed elsewhere |
| Network over-fetch | Fetching more than any current consumer needs |
| Network under-fetch | Missing data when a consumer needs it |
| Fetch denormalization | Shape of network payloads vs shape of cache / Report needs |

Identified techniques (issue):

1. Keep **traceability** of cache data — *why* each item was loaded.
2. Associate an explicit **consistency level** to model elements (transparent to the user;
   overlays with provenance).
3. Use an **algebraic / constraint DSL** to decide eviction and network fetch.

---

## 2. Miroir vocabulary for this problem

#208 is not a generic HTTP-cache design problem. In Miroir it sits on top of a fixed stack:

```
Report / Query / Action  (declarative “what”)
        │
        ▼
Extractor / Combiner / Transformer  (shape the need)
        │
        ▼
CLIENT DomainController  (orchestration)
   ├── Local cache (Redux / Zustand)   ← UI Reports read here today
   └── Persistence (remote / stub)     ← SERVER DomainController + store backends
        │
        ▼
Deployment sections: admin | model | data
```

| Miroir concept | Role for #208 |
|----------------|---------------|
| **Deployment** | Unit of store configuration and of local-cache population (`rollback` is per Deployment). |
| **Application section** (`model` / `data` / …) | Partitions what is loaded; cache keys include section. |
| **Entity** | Collection identity; optional `storageAccess` (declared, not enforced for caching). |
| **EntityDefinition** | Structure + optional `cache.cacheAllInstancesOnRefresh` (declared, **unused at runtime**). |
| **EntityInstance** | Cache cell; keyed under `(deployment, section, entity)`. |
| **Query** / **Extractor** | Declares *which* instances are needed (`extractorInstancesByEntity`, `extractorByPrimaryKey`, …). |
| **Report** | UI consumer; today assumes local cache already filled. |
| **DomainController** | CLIENT (`remote`) owns cache + remote I/O; SERVER (`local`) owns persistence. |
| **Local cache** | Shared client view of Deployment state; loading → current via `rollback`. |
| **`queryExecutionStrategy`** | Intended bridge cache ↔ network (`localCacheOrFail` / `localCacheOrFetch` / `ServerCache` / `storage`); only part of it works. |

Miroir’s philosophy (“everything is data”, declarative Queries/Reports, interpreters rather than
hand-written fetch code) implies that **consistency and cache policy should themselves become
model data** — not ad-hoc imperative code in each screen. That is the right framing for the
issue’s “consistency level on model elements” and “constraint DSL” techniques.

---

## 3. Present situation (as of this analysis)

### 3.1 Eager, Entity-granular, provenance-free caching

On startup (and on ModelAction `rollback` / `remoteLocalCacheRollback`), CLIENT:

1. Opens stores for each Deployment.
2. For that Deployment, **`loadConfigurationFromPersistenceStore`** issues
   `RestPersistenceAction_read` **per Entity** with `parentUuid` only (collection / “all”).
3. Pushes results into local cache via `loadNewInstancesInLocalCache`, then promotes
   `loading` → `current` with local-cache `rollback`.

Documented flow: `docs/reference/data-architecture-deployments.md`
(`fetchMiroirAndAppConfigurations`, `loadConfigurationFromPersistenceStore`).

Implementation locus: `packages/miroir-core/src/3_controllers/DomainController.ts`.

**Consequence:** the default refresh unit is **“all instances of Entity E in section S of
Deployment D”**, not “the instances this Report’s extractors need”.

### 3.2 UI Reports read the cache; they do not fetch

Report display path (standalone app): sync selectors over `ReduxDeploymentsState`
(`useReduxDeploymentsStateQuerySelector` / extractor runners). Missing data surfaces as
query failures (`DomainStateNotLoaded`, `EntityNotFound`, `InstanceNotFound`), not as an
automatic network fill.

Boxed query actions *can* hit persistence via `queryExecutionStrategy` (default `"storage"`).
On CLIENT:

| Strategy | Status today |
|----------|----------------|
| `"storage"` | Remote / persistence path |
| `"localCacheOrFail"` | Local cache only |
| `"localCacheOrFetch"` | **Throws — not implemented** |
| `"ServerCache"` | **Throws — not implemented** |

So the natural “need → cache miss → fetch” bridge named in the meta-model is not yet available
to Reports.

### 3.3 Selective UUID read exists below, unused above

- Persistence API: `getInstances` **and** `getInstance(…, instancePrimaryKey)`.
- REST payload can carry an optional instance `uuid`; default server GET for collections is
  still `/…/:parentUuid/all`.

Architecture can express per-UUID load; the live refresh / Report path does not use it for
lazy or large instances.

### 3.4 Shared cache, no load origins

Local cache is **one shared map** per Deployment/section/Entity. Many Reports and Queries
reference the same Entities (Book, Author, Blob, meta-model Entities, …). Origins do **not**
register interest; there is no refcount, no “loaded for Report R / Query Q”, no eviction
policy beyond coarse full-Deployment reload.

That is exactly the **multi-origin loading** problem named in #208, in Miroir terms.

### 3.5 Existing model hooks (unused or incomplete)

| Hook | Where | Today |
|------|--------|--------|
| `EntityDefinition.cache.cacheAllInstancesOnRefresh` | EntityDefinition | Present in schema/assets; **not read by runtime TS** |
| `Entity.storageAccess` | Entity | `"none" \| "localStorage" \| "persistentStorage"`; **not enforced** for cache policy |
| `queryExecutionStrategy` | Boxed query actions | Partial implementation (see §3.2) |
| Jzod `tag.value.isBlob` | Attribute | UI blob editing; **no** load/lazy policy |
| Blob Entity | Miroir data (`62209e4a-…`) | Real Entity with large base64 `contents`; still batch-loaded; ironically often has `cacheAllInstancesOnRefresh: true` |

These are the natural **extension points** for the issue’s consistency / provenance work —
especially EntityDefinition and Query/Report definitions — without inventing a parallel
configuration system outside the meta-model.

---

## 4. Classical situations mapped onto Miroir

### 4.1 Situation A — Large instances (Blob and similar)

**Classic problem:** list is cheap; payload is not. Need catalogue without bodies; load bodies
on demand (by UUID / UUID list).

**In Miroir:**

- Blob is an **Entity** whose instances carry large `contents` (`isBlob`).
- Startup `rollback` still loads **all** Blob instances into CLIENT local cache.
- List Reports that only need `uuid` / `filename` / `mimeType` still pay the full body cost
  if those attributes live on the same instance document.
- Detail Reports using `extractorByPrimaryKey` theoretically need one instance; today they
  still depend on that instance having been bulk-loaded.

**Required capabilities (design, not yet present):**

1. **Catalogue projection** — Query/Extractor that returns instance identity (+ light attrs)
   without pulling blob bodies (server-side projection or separate “summary” Entity /
   denormalized index — open design choice).
2. **UUID-set fetch** into local cache for selected instances only.
3. **Attribute- or Entity-level policy** that marks heavy attributes / Entities as
   non-batch-cached (extension of `EntityDefinition.cache` and/or `isBlob` semantics).

### 4.2 Situation B — Always-stale / must-refresh Entities

**Classic problem:** cache hit is wrong by definition; every display must revalidate or refetch.

**In Miroir:**

- No TTL, no “stale-while-revalidate”, no per-Entity freshness flag enforced at runtime.
- Only coarse refresh: full Deployment `rollback`.
- A Report that displays such an Entity today either shows whatever was last rolled back, or
  fails if the Entity was never loaded — there is no “on display, force network” path wired
  through Report → Query → DomainController.

**Required capabilities:**

1. Consistency / freshness annotation on **Entity** or **EntityDefinition** (and possibly
   override on **Report** / **Query**).
2. Report display path that can trigger fetch according to that annotation (likely via
   completing `localCacheOrFetch` or a dedicated strategy).
3. Eviction rule: instances of that Entity may be dropped immediately after use, or never
   trusted on next display without revalidation.

### 4.3 Situation C — Multi-origin requirement

**Classic problem:** Report A and Report B both need Book#X; loading for A then navigating
away must not evict Book#X if B still needs it; loading twice must not double-fetch needlessly.

**In Miroir:**

- Shared cache already **deduplicates by identity** (good for over-fetch avoidance once loaded).
- Absence of **provenance / interest sets** means:
  - over-eviction cannot be prevented safely if selective eviction is introduced;
  - under-eviction is the default (everything stays until full rollback);
  - “why is this in cache?” is unanswerable (blocks intelligent eviction / prefetch).

**Required capabilities:**

1. Track **load reasons** (Report uuid, Query uuid, Action, explicit pin, FK expansion, …).
2. Eviction only when **no remaining reason** (or when consistency policy forces drop).
3. Coalesce concurrent fetches for the same `(deployment, section, entity, instance)`.

### 4.4 Situation D — Network over-fetch / under-fetch / denormalization

| Symptom | Miroir manifestation today |
|---------|----------------------------|
| Over-fetch | Entity-wide `/all` for a Report that needs one PK or a filtered set |
| Under-fetch | Partial cache / skipped Entity → selector failures; no auto-fill |
| Denormalization | Network returns full EntityInstance documents; Reports often need joins via multiple extractors + combiners; no sparse attribute fetch |

Queries already describe *logical* need (extractors). The gap is that **physical fetch is not
driven by that need** for UI Reports — it is driven by Deployment-wide rollback.

Closing the gap means treating extractor requirements as **inputs to a fetch planner**, not
only as inputs to an in-memory selector.

### 4.5 Situation E — Model vs data asymmetry

Meta-model / Admin / Miroir Deployments are often treated as relatively stable (see also #199
schema reload policy). App **data** Entities (Library Books, Blobs, operational tables) are
where selective load and freshness matter most.

Any design should allow **different default consistency profiles** for:

- Miroir meta-model Entities (Entity, EntityDefinition, Report, Menu, …)
- Admin configuration Entities
- Application domain Entities
- Special cases (Blob, external/read-only Entities — see also #174)

without forcing every Entity to declare a full policy.

---

## 5. Problem classes ↔ Miroir mechanisms

| #208 problem | Current Miroir behaviour | Gap |
|--------------|--------------------------|-----|
| Multi-origin loading | Shared cache by identity; no interest tracking | Provenance / refcount |
| Cache under-eviction | Keep until full Deployment rollback | Policy-driven eviction |
| Cache over-eviction | Rare today (almost never selective-evict) | Will appear as soon as selective eviction exists without provenance |
| Network over-fetch | Entity `/all` on rollback; Blob bodies included | Need-driven / projected fetch |
| Network under-fetch | No Report-triggered fill; unimplemented strategies | `localCacheOrFetch` (or successor) + planner |
| Fetch denormalization | Full instances only | Projections, sparse attrs, list-vs-detail |

---

## 6. Techniques from #208, grounded in Miroir

### 6.1 Traceability of cache data (“why was this loaded?”)

**Proposal direction:** each cached instance (or instance+attribute slice) carries a set of
**load reasons**, e.g.:

- `deploymentRollback` (bulk bootstrap)
- `reportDisplay:<reportUuid>`
- `query:<queryUuid>` / extractor label
- `fkExpand:<fromEntity>:<attr>`
- `explicitPin` / `userPrefetch`

Reasons are added when a consumer needs the item and removed when the consumer releases it
(Report unmount, navigation, Action completion). Eviction consults the reason set.

This fits Miroir’s Action/Report-centric runtime: reasons should be **first-class data**
inspectable in visual debug / performance tooling (related spirit to #61 / render insights),
not only internal maps.

### 6.2 Consistency levels on model elements

**Proposal direction:** attach a small, declarative consistency profile to model elements —
primarily **EntityDefinition** (already has `cache`), optionally overridable on **Entity**,
**Query**, or **Report**.

Illustrative levels (names TBD; not a final schema):

| Level | Intended meaning | Fetch / cache behaviour |
|-------|------------------|-------------------------|
| `cacheAllOnRefresh` | Today’s intended `cacheAllInstancesOnRefresh` | Bulk-load on Deployment rollback; trust until next rollback |
| `cacheOnDemand` | Load only when an extractor requires instances | UUID / filter fetch; keep while reasons remain |
| `revalidateOnDisplay` | May keep a copy but must refresh when Report shows | Network check / refetch each display |
| `neverTrustCache` | Always-stale | Fetch every use; prefer immediate eviction |
| `catalogueOnly` | List/identity without heavy attrs | Split list vs detail (Blob pattern) |

User transparency: Report / UI can surface freshness (e.g. “refreshed”, “from cache”,
“stale”) without requiring the citizen developer to write fetch code — consistent with
Miroir’s declarative Report/Query story.

### 6.3 Algebraic / constraint DSL for eviction & fetch

**Proposal direction:** a small constraint language over (need, consistency, provenance,
size/cost) that the DomainController fetch planner evaluates. Candidates for hosting the DSL
as data (Miroir-native):

1. Extension of **EntityDefinition.cache** (static per Entity version).
2. Fields on **Query** / boxed query actions (per-need overrides).
3. A dedicated meta-model Entity (e.g. `CachePolicy` / `ConsistencyProfile`) referenced by
   EntityDefinitions — best if policies are reused and edited in the Designer app (#188).

The DSL need not be a general programming language. A constrained algebra that composes
well with existing **Transformers** (side-effect free, interpretable) is preferable to a
new Turing-complete dialect — see Transformer constraints in the #166 analysis.

**Example constraint shapes (illustrative):**

- `need(extractor) ∧ missing(cache) ⇒ fetch(uuidSet)`
- `consistency(E) = neverTrustCache ⇒ ¬serve(cache) without fetch`
- `reasons(instance) = ∅ ∧ consistency(E) ≠ pin ⇒ evict`
- `attr(isBlob) ∧ mode(list) ⇒ project(without contents)`

Exact syntax is a later design decision; this analysis only asserts that the **host** should
be Miroir model data evaluated by DomainController, not scattered UI hooks.

---

## 7. End-to-end target picture (conceptual)

```
Report opens
  → Query extractors declare Need N (entities, PKs, filters, attrs)
  → Planner reads consistency profiles for Entities in N
  → Diff(N, local cache) + provenance update
  → Fetch plan (storage / localCacheOrFetch / project)
  → Merge into local cache (loading → current or incremental upsert)
  → Existing sync extractor runners evaluate Report against cache
  → On Report close: drop reasons; maybe evict
```

This preserves Miroir’s split:

- **Declarative need** stays in Query/Report (citizen-developer friendly).
- **Imperative I/O** stays inside DomainController / persistence (framework responsibility).
- **Policy** stays in the model (EntityDefinition / CachePolicy), editable like other Miroir
  data.

---

## 8. Concrete Miroir examples to keep in the design loop

1. **Blob Entity** (`62209e4a-e429-4d7d-9b28-dcc1da6b51a2`) — force the list-then-detail and
   non-batch-load path; today contradicts the goal via `cacheAllInstancesOnRefresh: true`.
2. **Library Book / Author Reports** — multi-origin shared Entities; good provenance testbed
   without huge payloads.
3. **Meta-model Entity / EntityDefinition lists** — usually `cacheAllOnRefresh`-class; must
   remain fast for Designer / Admin.
4. **Startup `fetchMiroirAndAppConfigurations`** — must remain correct under selective load
   (bootstrapping Admin + Miroir + Apps cannot assume every data Entity is tiny forever).

---

## 9. Non-goals for this analysis / first design slice

- Implementing `localCacheOrFetch` / `ServerCache` (follow-up once policy model is chosen).
- Changing undo/redo / transaction semantics of local cache (`StateWithUndoRedo`).
- Server-side query result caching as a product feature (the `"ServerCache"` strategy name
  exists but is undefined behaviour today).
- Replacing Redux/Zustand local cache implementations.
- Solving UI refresh storms (#61 / historical Report loop analyses) — related only insofar as
  extra fetches must not amplify re-render pathologies.

---

## 10. Open questions (decision gate)

Settle these before a detailed design RFC or TDD plan:

1. **Primary policy host:** extend `EntityDefinition.cache` vs new `CachePolicy` Entity vs both
   (defaults on EntityDefinition, overrides on Query/Report)?
2. **List vs detail for Blob:** projection on the same Entity (omit `contents`) vs separate
   catalogue Entity / derived index?
3. **Bootstrap policy:** which Entities remain “load all on Deployment rollback” by default
   for Admin/Miroir vs app data?
4. **Provenance granularity:** per instance only, or per instance+attribute slice (needed for
   blob bodies)?
5. **Report integration:** sync selectors stay sync (prefetch before render) vs async Report
   loading states become first-class?
6. **Consistency UX:** how much freshness signalling is shown to end users vs only in Design /
   debug mode?
7. **DSL ambition:** closed enum of profiles first, or start directly with a composable
   constraint language?
8. **Relation to `Entity.storageAccess` and external Entities (#174):** one policy space or
   separate axes (where stored vs how consistent)?

**Recommended first product slice (suggestion, not decided):**  
(1) define a small closed set of consistency profiles on `EntityDefinition.cache`,  
(2) stop bulk-loading Entities marked `catalogueOnly` / non-`cacheAllOnRefresh`,  
(3) implement UUID-set fetch + provenance for Report-driven needs,  
(4) wire Blob as the flagship Entity. Defer full algebraic DSL until profiles prove
insufficient.

---

## 11. Suggested follow-up documents

| Document | Purpose |
|----------|---------|
| `consistency-profiles.md` | Propose concrete EntityDefinition.cache schema evolution |
| `fetch-planner.md` | DomainController algorithm: Need × Policy × Cache → FetchPlan |
| `provenance-model.md` | Load-reason data structures and eviction rules |
| `tdd-implementation-plan.md` | After decisions: tracer-bullet tests (Blob list/detail, multi-Report Book, always-stale Entity) |

---

## 12. Summary

Miroir today solves client data access by **eagerly loading entire Entity collections into a
shared local cache** and letting **Reports/Queries sync-read that cache**. That works while
Deployments are small and mostly trusted-stale-until-rollback; it fails the classical cases
#208 names — especially **Blob-scale instances**, **must-refresh Entities**, and **safe
selective eviction under multi-origin use**.

The Framework already has the right *places* for a solution (EntityDefinition.cache,
Query extractors as need declarations, `queryExecutionStrategy`, DomainController as
planner, shared identity-keyed cache). What is missing is **policy**, **provenance**, and a
**need-driven fetch path** — expressed as Miroir model data, not as per-screen networking
code — which matches both the issue’s techniques and Miroir’s declarative, everything-is-data
design.
