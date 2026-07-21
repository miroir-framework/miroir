# 114 — TDD Implementation Plan: Proposal 1 (EntityDefinition cache + report single-flight loader)

> From [analysis.md](./analysis.md): per-entity all-or-none via `cacheAllInstancesOnRefresh`, plus async report-triggered loading with query-key single-flight.
> Each cycle follows red → green; tests describe **behavior**, not implementation.
> Vertical slices only. This file is the **record of decisions and executions**.

Related: [analysis.md](./analysis.md) · issue #114

---

## Status

| Phase | Scope | Status |
|---|---|---|
| **0** | Design decisions confirmed | **DONE** (2026-07-21) |
| **1** | EntityDefinition cache flag → refresh fetch set (no stage-C read when `false`) | **DONE** (2026-07-21) |
| **2** | Query fingerprint + single-flight loader | **DONE** (2026-07-21) |
| **3** | Report load trigger (effect, not render) | **DONE** (2026-07-21) |
| **4** | End-to-end Blob (`false` + report load) + integ assert no stage-C read | **IN PROGRESS** (2026-07-21) |
| **5** | Acceptance / non-regression gates | Not started |

---

## Design decisions (confirmed 2026-07-21)

| # | Decision | Choice |
|---|---|---|
| D1 | Per-entity refresh policy | `EntityDefinition.cache.cacheAllInstancesOnRefresh` — `true` / absent ⇒ load all instances on refresh; `false` ⇒ load none on refresh |
| D2 | Default when flag absent | Eager (`true`) — preserve prior behavior |
| D3 | Interpretation owner | **DomainController** interprets EntityDefinition flags when building the **data** refresh fetch set; flag is application model data → **any deployment** of that application |
| D4 | Model vs data | **Model section always loaded entirely**. Only **data** entities may be skipped on refresh |
| D5 | Report loader home | New deep module in **miroir-core** (+ standalone hook later): `ReportQueryLoadService` |
| D6 | Fetch mechanism for report load | Reuse existing DomainController query / persistence read path, then `loadNewInstancesInLocalCache` |
| D7 | Query key fingerprint | Stable key from `{ application, deploymentUuid, reportUuid?, resolvedQuery, queryParams }` |
| D8 | Status surface | `idle \| loading \| ready \| error` keyed by fingerprint |
| D9 | Render contract | **Render never dispatches**. Effect / service calls `ensureLoaded`; selectors stay sync over local cache |
| D10 | Failure policy | Status → `error`; **no automatic retry on re-render**; optional explicit `retry(key)` later |
| D11 | Phase 4 tracer | Miroir **Blob** entity / Blob list report |
| D12 | Network vs cache (clarified 2026-07-21) | Skip means **omit `RestPersistenceAction_read` for that data entity’s instances** (stage C). Not fetch-then-drop from cache. Stage A (Entity catalog) + stage B (full model) still run. |

---

## Refresh stages (DomainController — record)

| Stage | Read | Phase 1 behavior |
|---|---|---|
| A | Entity catalog (concepts) | Always |
| B | All model entity instances | Always (needed for concepts + EntityDefinition flags) |
| C | Data entity instances | **Only** entities with `cacheAllInstancesOnRefresh !== false` |

**D12:** Phase 1 does **not** issue stage-C reads for lazy entities and then abandon results. Filtering is applied **before** stage C.

---

## Execution log

### Phase 0 — DONE

User confirmed D1–D11 (EntityDefinition flag, model always loaded, sticky error, Blob tracer). D12 clarified on review of Phase 1 wire.

### Phase 1 — DONE (2026-07-21)

| Slice | Behavior | Evidence |
|---|---|---|
| 1.1 | Default eager (missing / `true`) | `cacheRefreshPolicy.unit.test.ts` green |
| 1.2 | `false` excludes data from fetch set | same unit file + DomainController uses `resolveEntitiesToFetchOnRefresh` then only `dataFetchTargets` |
| 1.3 | Model always included; model fetched before data | helper never filters model; DomainController awaits model reads, builds EntityDefinition map, then filtered data reads |

**Artifacts**

- `packages/miroir-core/src/1_core/cacheRefreshPolicy.ts`
- `packages/miroir-core/tests/1_core/cacheRefreshPolicy.unit.test.ts` (8/8)
- `DomainController.loadConfigurationFromPersistenceStore` wired
- exports from `miroir-core` `index.ts`

**Intentionally deferred from Phase 1**

- Integration / recording-fake test that counts stage-C `RestPersistenceAction_read` for Blob with flag `false` → **Phase 4 / 5**
- Report-triggered async fill → **Phase 2+**

### Phase 2 — DONE (2026-07-21)

| Slice | Behavior | Evidence |
|---|---|---|
| 2.1 | Stable fingerprint (params / query / report / deployment) | `ReportQueryLoadService.unit.test.ts` |
| 2.2 | Concurrent same key → one executor call | same |
| 2.3 | Ready short-circuit → no re-dispatch | same |
| 2.4 | Different fingerprint → new dispatch | same |
| 2.5 | Success → ready; failure → sticky error until `invalidate` | same |

**Artifacts**

- `packages/miroir-core/src/2_domain/ReportQueryLoadService.ts`
- `packages/miroir-core/tests/2_domain/ReportQueryLoadService.unit.test.ts` (9/9)
- exported from `miroir-core` `index.ts`

**Notes**

- `ReportQueryLoadExecutor` is injected: service owns single-flight/status; executor owns persistence + `loadNewInstancesInLocalCache` (wired in Phase 3/4).
- UI effect not yet connected.

### Phase 3 — DONE (2026-07-21)

| Slice | Behavior | Evidence |
|---|---|---|
| 3.1 | Mount → one `ensureLoaded`; fingerprint change → second | `useEnsureReportQueryLoaded.unit.test.tsx` |
| 3.2 | Re-render same fingerprint → no extra `ensureLoaded` | same |
| 3.3 | idle / loading→ready / sticky error; undefined → idle | same |

**Artifacts**

- `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/useEnsureReportQueryLoaded.ts`
- `packages/miroir-standalone-app/tests/4_view/useEnsureReportQueryLoaded.unit.test.tsx` (6/6 via vitest)

**Notes**

- Effect deps: `[service, fingerprint]`; `requestRef` holds latest request.
- Hook reads service status **after** `ensureLoaded` so `loading` is visible before the promise settles.
- Report view wiring + real executor → **Phase 4**.

### Phase 4 — IN PROGRESS (2026-07-21)

| Slice | Behavior | Evidence |
|---|---|---|
| 4.1a | Blob EntityDefinition asset `cacheAllInstancesOnRefresh: false` | asset + `cacheRefreshPolicy` Blob exclusion test |
| 4.1b | Report executor: read referenced entities + `loadNewInstancesInLocalCache` | `createReportQueryLoadExecutor.unit.test.ts` (3/3); uses **local cache only** (not remote `handleAction`) |
| 4.1c | Report view effect wires `useEnsureReportQueryLoaded` | `ReportViewWithEditor.tsx`; hides EntityNotFound while loading |
| 4.1d | `loadNewInstancesInLocalCache` mirrors into `current` | redux + zustand LocalCacheSlice — selectors see report-triggered fills without full rollback |

**Artifacts**

- Blob ED: `…/c3179f1d-….json` → `false` (rebuild `miroir-test-app_deployment-miroir` dist)
- `packages/miroir-core/src/2_domain/createReportQueryLoadExecutor.ts`
- Hook wired in `ReportViewWithEditor`

**Still open**

- Full integ recording of zero stage-C `RestPersistenceAction_read` for Blob on real refresh/rollback (DomainController unit import blocked by `defaultMiroirMetaModel` dist issue)
- End-to-end Blob list report integ after refresh

### Phase 5 — not started

See slices below.

---

## Public interfaces (target shape — Phases 2+)

```ts
type ReportLoadStatus = "idle" | "loading" | "ready" | "error";

interface ReportQueryLoadRequest {
  application: Uuid;
  deploymentUuid: Uuid;
  reportUuid?: Uuid;
  resolvedQuery: BoxedQueryWithExtractorCombinerTransformer;
  queryParams?: Record<string, unknown>;
}

interface ReportQueryLoadService {
  fingerprint(request: ReportQueryLoadRequest): string;
  getStatus(key: string): ReportLoadStatus;
  getError(key: string): unknown | undefined;
  /** Single-flight: concurrent ensureLoaded(same key) share one in-flight promise. */
  ensureLoaded(request: ReportQueryLoadRequest): Promise<ReportLoadStatus>;
  /** Optional later: clear key / invalidate on deployment change. */
  invalidate?(keyOrPrefix: string): void;
  // retry(key) — optional, later (D10)
}
```

UI (standalone):

```ts
function useEnsureReportQueryLoaded(request: ReportQueryLoadRequest | undefined): ReportLoadStatus;
```

Phase 1 public API (shipped):

```ts
shouldCacheAllInstancesOnRefresh(entityDefinition?: EntityDefinition): boolean;
resolveEntitiesToFetchOnRefresh(modelEntities, dataEntities, entityDefinitionsByEntityUuid): EntityFetchOnRefresh[];
```

---

## Behaviors under test (priority order)

| # | Behavior | Phase | Status |
|---|---|---|---|
| B1 | Absent/`true`: data entity included in refresh fetch set | 1 | **DONE** |
| B2 | `false`: data entity excluded from fetch set (⇒ no stage-C read when wired) | 1 | **DONE** (unit + wire); integ assert later |
| B2b | Model entities always fetched | 1 | **DONE** |
| B3 | Same fingerprint → concurrent / repeated `ensureLoaded` → **one** persistence query | 2 | **DONE** |
| B4 | Different fingerprint → new load | 2 | **DONE** |
| B5 | Successful load → ready (executor writes cache) | 2 | **DONE** (status); real cache wire in Phase 4 |
| B6 | Failed load → sticky `error`; no auto-retry until invalidate | 2 | **DONE** |
| B7 | Report open → one ensure per key change; re-render → zero extra | 3 | Pending |
| B8 | Blob `false` + open Blob report → data appears without stage-C preload | 4 | Pending |

Out of scope for this plan:

- Bounded concurrency queue (Proposal 3)
- Non-report consumers unless broken under skipped refresh

---

## Test execution conventions

| Script | Package | Purpose |
|---|---|---|
| `npm run testByFile -- <path>` | `miroir-core`, `miroir-standalone-app` | Preferred single-file run |
| `npm test -- <pattern>` | vitest packages | Filter by `describe` / `it` name |

**Legend**

| Label | Meaning |
|---|---|
| **Progress (RED)** | New test must fail before implementation |
| **Progress (GREEN)** | Same test passes after minimal implementation |
| **Non-regression** | Must stay green after the slice |
| **DONE** | Slice executed and recorded |

---

## High-level phase structure

```
Phase 1 — EntityDefinition → stage C filter          slices 1.1–1.3   [DONE]
Phase 2 — ReportQueryLoadService (fingerprint + SF)  slices 2.1–2.5   [DONE]
Phase 3 — UI effect: ensureLoaded decoupled from render slices 3.1–3.3
Phase 4 — Blob end-to-end + no stage-C read assert   slices 4.1–4.2
Phase 5 — Acceptance gates                           slice 5.1
```

---

## Phase 1 — EntityDefinition cache flag on refresh path — **DONE**

**Goal**: Always fetch full **model** (stage B); for **data** (stage C) respect `cacheAllInstancesOnRefresh`; omit stage-C network reads when `false`.

### 1.1  Default remains eager — **DONE**

**Behavior (B1)**: Missing definition or missing/`true` flag ⇒ data entity is included in the refresh fetch set.

| | |
|---|---|
| **Progress (RED)** | `cacheRefreshPolicy.unit.test.ts` |
| **Progress (GREEN)** | `1_core/cacheRefreshPolicy.ts` |
| **Result** | 4 tests green for `shouldCacheAllInstancesOnRefresh` |

### 1.2  `false` skips data preload (no stage-C read) — **DONE**

**Behavior (B2)**: Data entity with flag `false` is **not** in the fetch set; DomainController only maps `dataFetchTargets` to `fetchEntityInstances`.

| | |
|---|---|
| **Progress (RED→GREEN)** | Unit exclude lazy data; DomainController wire |
| **Clarification** | Not fetch-then-abandon — filter before read |

### 1.3  Model always fully included — **DONE**

**Behavior (B2b)**: Every model entity fetched; model awaited before data so EntityDefinitions exist for policy.

| | |
|---|---|
| **Progress (RED→GREEN)** | Unit + DomainController model-first sequence |

**Gate 1**: **PASSED** (unit 8/8). Integ zero-read assert deferred to Phase 4.

---

## Phase 2 — `ReportQueryLoadService` (fingerprint + single-flight) — **DONE**

**Goal**: Async ensure-loaded with stable keys; one in-flight request per key; success → ready; error sticky without render-loop refetch.

**Gate 2**: **PASSED** (9/9 unit). Executor → real DomainController / cache wire deferred to Phase 3–4.

### 2.1–2.5 — **DONE**

See execution log above. Sticky error until `invalidate` (D10); optional `retry(key)` still later.

---

## Phase 3 — Report load trigger independent of render

**Goal**: Opening a report schedules `ensureLoaded` from an effect; render only reads status + selector data.

### 3.1–3.3 — **DONE**

See execution log above. Gate 3 green (6/6).

---

## Phase 4 — End-to-end: Blob + report load

**Goal**: Blob EntityDefinition `cacheAllInstancesOnRefresh: false` → refresh does **not** stage-C-read Blob instances; opening Blob list report loads them once asynchronously.

### 4.1  Integration tracer bullet

**Behavior (B8)**:

1. Blob flag `false`.
2. Refresh/rollback → recording fake: **zero** stage-C reads for Blob `parentUuid`.
3. Open Blob list report → `ensureLoaded` once.
4. After ready, report data includes Blob instances.

### 4.2  Re-open same report: no second fetch

**Behavior**: Same fingerprint remount → still one persistence load if `ready`.

**Gate 4**: 4.1–4.2 green; default eager entities unchanged.

---

## Phase 5 — Acceptance / non-regression

### 5.1  Checklist

| Check | Covered by | Status |
|---|---|---|
| Absent/`true` → still on refresh fetch set | 1.1 | **DONE** |
| `false` → no stage-C read for that data entity | 1.2 wire; 4.1 integ | Wire DONE; integ pending |
| Model always loaded | 1.3 | **DONE** |
| Report open → exactly one async load per key | 2.2, 3.1, 4.1 | 2.2/3.1 DONE; 4.1 pending |
| Re-render same key → zero extra load | 2.3, 3.2 | **DONE** |
| Change report / params / deployment → new load | 2.4 | **DONE** (unit) |
| Load completion updates cache / UI | 2.5, 4.1 | 2.5 DONE; 4.1 pending |
| Failed loads → error, no render-loop retries | 2.5, 3.3 | **DONE** |

**Non-regression pack** (after Phase 4): ConfigurationService startup; ReportHooks with default eager; Blob path with flag `false`.

---

## Refactor candidates (only after GREEN)

- Share query-key helper between service and UI hook (Phase 2–3).
- Proposal 3 queue as future wrapper around `ensureLoaded`.

Never refactor while RED.

---

## Implementation order reminder

```
WRONG:  write all Phase 1–4 tests → implement everything
RIGHT:  1.1 RED→GREEN → … → 4.2 RED→GREEN → refactor
```

Phase 4 in progress. Next: **integ assert zero stage-C Blob reads on refresh** + BlobList report load after refresh.
