# Issue #114 — Refresh Scope and Report-Triggered Loading

## Scope (restricted)

This analysis is intentionally restricted to one behavior switch:

1. either **all instances of an entity are loaded on refresh** (current default behavior),
2. or **none are loaded on refresh**, and loading is triggered by report loading from the report's query.

Constraints in scope:
- report-triggered loading must be asynchronous;
- loading must be independent from report rendering cycles;
- rendering can happen multiple times and must not re-send the same query each render.

Out of scope:
- fine-grained partial preload policies beyond all-or-none;
- non-report consumers (menus, editors, custom hooks) unless directly impacted by report loading;
- redesign of query language.

---

## Present Situation

### 1) Refresh eagerly loads all entity instances

`DomainController.loadConfigurationFromPersistenceStore()` builds `toFetchEntities` and sends one `RestPersistenceAction_read` per entity, then batches all returned instance collections into local cache via `loadNewInstancesInLocalCache`.

Consequence: on rollback/refresh, data for all model and data entities is fetched eagerly.

### 2) Rollback is used as startup refresh trigger

`fetchMiroirAndAppConfigurations()` in standalone app opens stores then sends `rollback` per deployment.  
That routes to `loadConfigurationFromPersistenceStore()`, therefore startup currently implies eager all-entities load.

### 3) Report "queries" are currently selector-driven against local cache

`useQueryTemplateResults()` builds query params and executes through `useReduxDeploymentsStateQuerySelector(...)`.  
This path is synchronous from the UI perspective and expects required instances to already exist in local cache.

### 4) Existing `cacheAllInstancesOnRefresh` schema flag is not wired into runtime behavior

`EntityDefinition.cache.cacheAllInstancesOnRefresh` exists in generated schema/types, but runtime refresh logic does not consume it.  
Today behavior is effectively "all entities loaded on refresh" regardless of this per-entity metadata.

### 5) Existing queue primitive is write-oriented, not read/query-oriented

`ViewParamsUpdateQueue` is an existing singleton timer queue used for debounced persistence writes of view params.  
It provides merge + delayed flush patterns, but it is not yet a generic async read/query scheduler.

---

## Impacts and Gaps to Cover

### Functional gaps

- No all-or-none switch at refresh level; behavior is fixed to eager load-all.
- No report-driven async loading path that can fetch missing data on-demand from persistence.
- No "load once per report load identity" mechanism (query fingerprint + single-flight guard).
- No lifecycle separation between "data load trigger" and "component render".

### Behavioral risks

- Large deployments pay startup/refresh latency and memory for data never viewed.
- If switched to "load none on refresh" without report loader, reports resolve empty/failed from selectors.
- Render loops/remounts can duplicate query dispatch unless request dedupe is explicit.

### Technical integration gaps

- Missing cache state for async report loads (idle/loading/success/error by query key).
- Missing invalidation policy (when deployment/params/model changes).
- No dedicated place in standalone app to orchestrate async fetch + cache insert + selector read.

---

## Proposal 1 — Minimal Viable: Global all-or-none + per-report single-flight loader

### Description

Add a deployment-level refresh mode:
- `eagerAll` (current behavior),
- `loadNone`.

When `loadNone`, rollback/refresh skips instance preloading entirely.  
Report loading triggers a new async loader service that:
- computes a stable query key from `{deploymentUuid, reportUuid, resolvedQuery, queryParams}`,
- dispatches exactly one in-flight request per key (single-flight),
- writes results to local cache when resolved,
- exposes status (`idle/loading/ready/error`) for UI.

Rendering reads status + cache; render itself never dispatches network actions.

### Pros

- Smallest change to achieve requested behavior.
- Clear separation: load trigger in effect/service, render remains pure.
- Explicit no-duplicate-query guarantee with key-based in-flight map.
- Keeps current report query model and selector stack mostly intact.

### Cons

- New async path duplicates part of existing query execution semantics unless carefully shared.
- Requires "report data landed in local cache" contract definition.
- Could under-fetch for complex report combiners unless query-to-fetch mapping is robust.

---

## Proposal 2 — Honor `cacheAllInstancesOnRefresh` and derive eager set from model metadata

### Description

Use existing entity metadata:
- entities with `cache.cacheAllInstancesOnRefresh !== false` are eagerly loaded on refresh,
- entities with explicit `false` are not loaded.

Under your restricted scope, behavior can still be exposed as all-or-none via policy:
- "all" mode: treat all as eager;
- "none" mode: treat all as lazy (ignore eager set).

Report async loader (same single-flight architecture as Proposal 1) fetches non-eager entities on demand.

### Pros

- Leverages already-defined model semantics (`cacheAllInstancesOnRefresh`) instead of introducing new concept.
- Future-proofs architecture for possible post-#114 selective policies.
- Reduces migration friction for existing models already annotated for cache behavior.

### Cons

- More moving parts than strict global all-or-none.
- Increases test matrix (global mode x entity flag x report type).
- Still needs robust report-trigger async loader and dedupe mechanism.

---

## Proposal 3 — Generalized Async Query Queue (reuse queue pattern)

### Description

Create a generic `AsyncQueryLoadQueue` in standalone app, inspired by `ViewParamsUpdateQueue` but for reads:
- queue entries keyed by query fingerprint;
- merges duplicate enqueues while request is pending;
- bounded concurrency (e.g. 2-4 parallel loads);
- cancellation/invalidation by deployment/report key;
- result writes into local cache + status store.

Report lifecycle:
- report load effect enqueues query once per identity change;
- rendering only consumes status/result from cache/store.

### Pros

- Strong control against duplicate queries under heavy rerender/remount.
- Centralized async read orchestration reusable beyond reports.
- Natural place for retries, backoff, throttling, and instrumentation.

### Cons

- Highest implementation cost and architectural footprint.
- Requires careful ownership boundaries with Redux selectors and domain controller.
- More initial complexity than needed if #114 remains narrow.

---

## Recommendation

Start with **Proposal 1** for #114 delivery speed and low risk, while shaping interfaces so **Proposal 3** can absorb it later:

- implement a small report loader service with query fingerprint single-flight;
- add global refresh mode (`eagerAll | loadNone`);
- keep report rendering passive (status + cache only);
- add explicit tests proving: repeated renders do not re-dispatch query, but changing report/query params does.

If you want stricter alignment with existing schema semantics now, combine Proposal 1 with the metadata wiring from Proposal 2 as a second step.

---

## Validation Checklist (for implementation phase)

- In `eagerAll`, refresh populates all entities as today.
- In `loadNone`, refresh populates none of the data entities.
- Opening a report triggers exactly one async load for its query key.
- Re-rendering same report with same query key triggers zero extra load dispatches.
- Changing report UUID, deployment UUID, or query params triggers a new load.
- Async load completion updates local cache and report UI without requiring manual refresh.
- Failed loads expose error state without render-loop retries.

---

## Follow-up notes (implementation, light)

Execution chose Proposal 1’s report single-flight idea with Proposal 2’s EntityDefinition flag as the refresh switch (not a DomainController-global `eagerAll|loadNone` enum). Model stays fully loaded on refresh; only **data** instances may be omitted.

On `loadConfigurationFromPersistenceStore`: the first read is the Entity **catalog** (concepts); later reads load instances. For skipped data entities, the intended contract is **no instance read** for that entity (filter before fetch)—not fetch-then-drop from cache. See the TDD plan for the execution record.
