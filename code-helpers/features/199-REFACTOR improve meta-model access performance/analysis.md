# 199 — Improve meta-model access performance (UI, server, tests)

> Analysis of repeated `getMiroirFundamentalSchemaForDeployment` cost and five improvement
> proposals with impact / complexity evaluation.

Related issue: https://github.com/miroir-framework/miroir/issues/199  
Builds on: [198 impact analysis](../198-FEATURE-%20composing%20tests%20using%20application-defined%20Actions/impact-analysis-and-solutions.md) (runtime schema extension, carry-on, caching).

---

## 1. Problem restatement

Miroir application models can evolve at runtime (endpoints, entities, etc.). Since feature 198,
the **runtime fundamental jzod schema** is no longer a single static artifact: it is assembled
per `(deploymentUuid, MetaModel)` via `getMiroirFundamentalSchemaForDeployment`.

Issue #199 states the cold path takes **~4 seconds** and is **not sustainable on the UI refresh
hot path**. The function must run only when strictly necessary; meta-model stability should be
leveraged wherever the Miroir (meta-)application model is treated as constant (tests, current
UI/server assumptions).

### Target state (from #199)

| Context | Expectation |
|---------|-------------|
| **Dev build / `generateSchemas`** | Full schema generation unchanged |
| **Tests** | Meta-model treated as constant; use generated `miroirFundamentalJzodSchema` except when a test adds deployments / needs live Admin app data |
| **UI / server (today)** | Miroir meta-model model+data considered constant; full live meta-model refresh not supported — model changes may require page reload until designed |
| **Client apps (Library, etc.)** | Schema extension when app endpoints change; **partial** invalidation only for the affected deployment |
| **Access pattern** | Centralized via Miroir context / provider; client code receives `MiroirModelEnvironment`, not raw schema builder calls |

---

## 2. Present situation

### 2.1 What `getMiroirFundamentalSchemaForDeployment` does

```115:131:packages/miroir-core/src/1_core/jzod/schemaForDeployment.ts
export function getMiroirFundamentalSchemaForDeployment(
  deploymentUuid: Uuid,
  model: MetaModel,
): MlSchema {
  const cached = getCachedSchema(deploymentUuid, model);
  console.log("getMiroirFundamentalSchemaForDeployment", deploymentUuid, model, cached);
  if (cached) {
    return cached;
  }

  const schema = !hasAppSpecificEndpoints(model)
    ? (miroirFundamentalJzodSchema as MlSchema)
    : buildExtendedSchema(model);

  setCachedSchema(deploymentUuid, model, schema);
  return schema;
}
```

**Fast path (Miroir deployment, no app-owned endpoints):** returns the pre-generated
`miroirFundamentalJzodSchema` — essentially free after WeakMap lookup.

**Slow path (app deployments with owned endpoints, e.g. Library):** `buildExtendedSchema` →
`buildAppActionBranches` + `applyDeploymentDomainActionCarryOn`. The carry-on step reuses
`getCarryOnSchemaBuilder` (same machinery as build-time `generateSchemas`) and dominates
latency (~seconds on first call).

Caching: `WeakMap<MetaModel, Map<Uuid, MlSchema>>` — hit only when the **same `MetaModel`
object reference** is reused. A new model object from Redux/localCache (common on every data
refresh) **misses cache** even if content is unchanged.

Performance test (198 Phase 2.9): second call with stable model reference must complete in
< 500 ms; first call may take several seconds.

### 2.2 Dependency graph (who calls whom)

```
getMiroirFundamentalSchemaForDeployment(deploymentUuid, model)
├── getCachedSchema / setCachedSchema          (WeakMap, per model ref)
├── hasAppSpecificEndpoints(model)
├── [fast] miroirFundamentalJzodSchema         (static import, build-time artifact)
└── [slow] buildExtendedSchema(model)
    ├── getAppSpecificEndpoints
    ├── buildAppActionBranches
    └── applyDeploymentDomainActionCarryOn     (getCarryOnSchemaBuilder — expensive)
```

**Direct importers of `getMiroirFundamentalSchemaForDeployment`:**

| Site | Role |
|------|------|
| `miroir-core/src/1_core/Model.ts` | `defaultMetaModelEnvironment`, `defaultMiroirModelEnvironment` — **module init** |
| `miroir-localcache-redux/.../Model.ts` | `currentModelEnvironment()` — **every Redux selector read** |
| `miroir-localcache-zustand/.../Model.ts` | same for Zustand |
| `miroir-cli/.../commandsFromEndpoint.ts` | CLI command env construction |
| `miroir-mcp/.../mcpHandlersForEndpoint.ts` | MCP tool env construction |
| `miroir-test-app_deployment-library/src/Library.ts` | `libraryModelEnvironment` module constant |
| `miroir-standalone-app/.../ReduxHooks.ts` | `useCurrentModelEnvironment`, `useMiroirFundamentalJzodSchemaForDeployment` |
| Various unit/integration tests | Direct or via env builders |

**Transitive UI access (preferred API):**

- `useCurrentModelEnvironment(application, applicationDeploymentMap)` — **~20 call sites** in
  `miroir-standalone-app` (editors, reports, runners, transformers).
- `useMiroirFundamentalJzodSchemaForDeployment` — dialogs that only need schema.
- `defaultMetaModelEnvironment` — still used as fallback in several editors and in
  `useReduxDeploymentsStateQuerySelectorForCleanedResult` (passes env into query selectors).

### 2.3 UI refresh amplification

```279:304:packages/miroir-standalone-app/src/miroir-fwk/4_view/ReduxHooks.ts
  useEffect(() => {
    if (currentModel && deploymentUuid) {
      const schema = getMiroirFundamentalSchemaForDeployment(deploymentUuid, currentModel);
      context.setSchemaForDeployment(deploymentUuid, schema);
    }
  }, [currentModel, deploymentUuid, context.setSchemaForDeployment]);

  return useMemo(() => ({
    miroirFundamentalJzodSchema:
      context.schemasPerDeployment[deploymentUuid] ??
      getMiroirFundamentalSchemaForDeployment(deploymentUuid, currentModel),
    ...
  }), [miroirMetaModel, currentModel, context.schemasPerDeployment, endpointsByUuid, deploymentUuid]);
```

Observed behaviour on UI refresh / Redux updates:

1. **`useCurrentModel`** returns a **new `MetaModel` object** whenever localCache slice changes
   (any entity load, CRUD, undo/redo) — even if schema-relevant parts (endpoints list) are unchanged.
2. **`useEffect` dependency on `currentModel`** re-invokes `getMiroirFundamentalSchemaForDeployment`
   on every such change.
3. **`useMemo` fallback** calls the function again if context cache is not yet populated (double
   call on mount: effect + memo).
4. **Multiple components** each call `useCurrentModelEnvironment` independently → N parallel
   hook instances per visible screen (reports + nested editors can multiply calls).
5. **`schemasPerDeployment` in React context** (Phase 2.8) helps **after** first populate, but
   invalidation is coarse: any `currentModel` reference change retriggers the effect.

`console.log` inside the hot function adds noise and cost in dev.

### 2.4 Server and tests

**Server** (`miroir-server/src/server.ts`): uses `defaultMetaModelEnvironment` for startup
store-open actions. That env is built **once at module load** via `Model.ts` (one cold
`getMiroirFundamentalSchemaForDeployment` for Miroir meta-model). Server does not currently
rebuild per-request — acceptable for #199 target **if** Miroir meta-model stays constant.

**Tests:**

- `modelValidation.unit.test.ts` (admin/designer/library): builds env with full function at
  module scope.
- `FunctionCallTestFixtures.ts`: exposes `defaultMetaModelEnvironment` factories.
- `useCurrentModelEnvironment.unit.test.tsx`: explicitly expects re-call when model changes
  (endpoint added) — correct for app deployments, expensive if triggered by unrelated model churn.

**Local cache selectors** (`currentModelEnvironment` in redux/zustand): call
`getMiroirFundamentalSchemaForDeployment` **inside the selector** with no cross-render cache
beyond WeakMap(model ref) — any selector re-run with new model ref pays full cost on cache miss.

### 2.5 Slow vs fast-moving parts (conceptual split)

| Part | Typical change frequency | Cost to rebuild |
|------|-------------------------|-----------------|
| Base `miroirFundamentalJzodSchema` | Never at runtime (build/deploy) | N/A (import) |
| Miroir meta-model (`defaultMiroirMetaModel`) | Assumed constant in UI/server today | Fast path only |
| Miroir deployment schema | Same as above | Fast path |
| Client app `MetaModel.endpoints` (app-owned actions) | Design-time / occasional runtime edits | **Slow** (carry-on) |
| Client app entity/report/menu data | **Every UI interaction** | Should **not** invalidate schema |

The performance bug is largely **confusing data churn with schema churn**: rebuilding or
re-entering the slow path when only instance data changed.

---

## 3. Impact analysis

### A. Cache key granularity — **MUST / medium**

WeakMap keyed on `MetaModel` object identity is insufficient. Need a **schema fingerprint**
(endpoints relevant to `domainAction`, application uuid, deployment uuid) so identical logical
models hit cache across Redux immutability updates.

### B. UI call centralization — **SHOULD / medium-wide**

~20 independent `useCurrentModelEnvironment` mounts multiply work. A single provider (or
selector memo at app shell) should own schema resolution per deployment; descendants consume
context only.

### C. DRY fast/slow API split — **SHOULD / medium**

Issue #199 suggests a **lighter variant** for contexts that only need the static or
Miroir-meta schema vs full deployment extension. Must share carry-on logic with build-time
(extract helpers already started in `schemaForDeployment.ts` + `getMiroirFundamentalJzodSchemaHelpers.ts`).

### D. Local cache selector path — **SHOULD / narrow**

`currentModelEnvironment()` in redux/zustand packages bypasses React context cache entirely;
any code path using it on hot selectors inherits 4s risk.

### E. Invalidation policy — **SHOULD / cross-cutting**

Define explicit rules: what model edits require schema rebuild vs page reload vs no action.
Aligns with #199 (“meta-model update → reload page” for now).

### F. Observability — **OPTIONAL / small**

Remove debug `console.log`; add optional timing counters (existing `showPerformanceDisplay` /
activity tracker hooks) for schema build count and duration.

---

## 4. Five improvement proposals

Each proposal includes **Impact** (performance / correctness gain) and **Complexity**
(implementation effort, risk). Scale: **Low / Medium / High**.

---

### Proposal 1 — Schema fingerprint cache (content-keyed, not reference-keyed)

Replace (or supplement) `WeakMap<MetaModel, …>` with a cache keyed by
`(deploymentUuid, schemaRevision)` where `schemaRevision` is a cheap hash of schema-relevant
model fields: `applicationUuid`, app-owned endpoint uuids + actionType keys (not full entity
catalog).

**Mechanism:** `computeSchemaRevision(model) → string`; lookup in `Map<string, MlSchema>`.
Store revision on context; compare before calling carry-on.

| | |
|---|---|
| **Impact** | **High** — eliminates repeated 4s rebuilds when only entity **data** changes; keeps correct invalidation when endpoints/actions change. Directly addresses UI refresh. |
| **Complexity** | **Medium** — requires careful definition of “schema-relevant” fields; unit tests for hit/miss/invalidation; memory bound (LRU per deployment optional). |

**DRY note:** Single cache module in `miroir-core`; used by function itself, React context, and localcache selectors.

---

### Proposal 2 — Split API: `getFundamentalSchemaForDeployment` (full) vs `getRuntimeSchemaForDeployment` (light)

Introduce two entry points sharing internal helpers:

- **`getRuntimeSchemaForDeployment(deploymentUuid, model, mode)`**
  - `'static'` — return `miroirFundamentalJzodSchema` (Miroir meta / no app endpoints).
  - `'extended'` — current slow path (Library, apps with owned endpoints).
  - `'auto'` — current `hasAppSpecificEndpoints` branch (default for backward compat).

- **`getMiroirFundamentalSchemaForDeployment`** — alias or thin wrapper calling `'auto'`.

Call sites that **know** they only need Miroir meta-model (server startup, most unit tests,
selectors scoped to `deployment_Miroir`, MCP json-schema tools on meta types) pass `'static'`
explicitly and never enter carry-on.

| | |
|---|---|
| **Impact** | **High** for tests/server/meta paths (**instant**); **Medium** for UI until combined with Proposal 1 or 3 (UI still needs extended for Library). Clarifies intent across ~15 call sites. |
| **Complexity** | **Low–Medium** — mostly routing + audit of call sites; no algorithm change. Must document when `'extended'` is mandatory. |

**Aligns with #199:** “lighter version respecting DRY” for test/server/ui meta-model cases.

---

### Proposal 3 — Central `ModelEnvironmentProvider` in Miroir context (single owner per deployment)

Move schema resolution **out of** per-component `useCurrentModelEnvironment`:

1. At app shell (or per open deployment tab), one effect watches
   `(deploymentUuid, schemaRevision)` — not whole `currentModel`.
2. Writes `MiroirModelEnvironment` (or minimal `{ schema, currentModel, endpointsByUuid }`)
   into `MiroirContextReactProvider`.
3. `useCurrentModelEnvironment` becomes a **thin context read** (no `getMiroirFundamental…` inside).

Optionally expose `useModelEnvironment(deploymentUuid)` with React `useSyncExternalStore` for
fine-grained subscription.

| | |
|---|---|
| **Impact** | **High** — reduces N× hook calls to 1× per deployment per revision; removes effect+memo double invocation; simplifies refresh profiling. |
| **Complexity** | **Medium–High** — refactor ~20 components; ensure SSR/test wrappers still provide context; migration path for tests using hook directly. |

**Aligns with #199:** “calls could be better centralized, using eg provider in the UI”.

---

### Proposal 4 — Two-tier schema: frozen meta baseline + incremental app overlay (DRY with build)

Formalize the slow/fast split inside one API:

1. **Baseline** — `miroirFundamentalJzodSchema` (build artifact, constant).
2. **Overlay** — only for deployments with app endpoints: merged `domainAction` branches +
   carry-on template keys (already implemented in `buildExtendedSchema` / `applyDeploymentDomainActionCarryOn`).

Optimizations:

- Precompute and **persist overlay at app deploy / model save** (optional artifact in
  `library_model`, like #198 Solution 4 lite) **or** compute once per `schemaRevision` and cache.
- For UI: serve baseline immediately; async hydrate overlay for app deployments (loading state
  on editors only until overlay ready).

Extract shared `buildDomainActionExtension(model)` used by **both** `generateSchemas` and runtime
(satisfies DRY with build pipeline).

| | |
|---|---|
| **Impact** | **Very high** if overlay persisted at deploy (**near-zero runtime cost**); **High** if only cached in memory with fingerprint. Enables progressive UI (fast first paint). |
| **Complexity** | **High** — artifact format, invalidation on endpoint edit, migration; overlaps with 198 architecture. Best as phase 2 after Proposals 1–3. |

---

### Proposal 5 — Policy layer: constant meta-model + explicit reload on meta change

Product/architecture policy codified in code:

| Layer | Policy |
|-------|--------|
| Tests | Default to `miroirFundamentalJzodSchema` / `defaultMetaModelEnvironment`; opt-in to live schema only in tests that add deployments or mutate Admin model |
| UI | Treat Miroir meta-model as immutable for session; `getMiroirFundamentalSchemaForDeployment(deployment_Miroir, …)` runs **once** at bootstrap |
| Client apps | Invalidate overlay only on endpoint/action changes; data edits never trigger schema rebuild |
| Meta-model edit detected | Show “Reload required” instead of silent 4s rebuild |

Implement via feature flag or env `MIROIR_SCHEMA_MODE=runtime|frozen` for tests/CI.

| | |
|---|---|
| **Impact** | **Medium–High** — stops worst-case refresh loops immediately; documents current capability ceiling per #199. Does not alone fix Library cold start. |
| **Complexity** | **Low** — mostly guardrails, docs, and test defaults; pairs with Proposal 2 with minimal code. |

---

## 5. Recommended sequencing

| Phase | Proposals | Rationale |
|-------|-----------|-----------|
| **Quick wins** | 2 + 5 + remove `console.log` | Stop paying carry-on in tests/server/meta paths; document reload policy |
| **Core fix** | 1 | Fix reference-identity cache miss on UI data refresh |
| **UI structure** | 3 | Centralize provider; measure before/after |
| **Longer term** | 4 | Deploy-time overlay / full DRY with `generateSchemas` |

Suggested acceptance metrics:

- Cold: first Library schema ≤ 4s (unchanged), logged once per session.
- Warm: 0 calls to carry-on path during entity grid refresh (only data Redux actions).
- `getMiroirFundamentalSchemaForDeployment` invocations per user action ≤ 1 (provider).
- Unit test suite: 0 multi-second schema builds unless explicitly in `schemaForDeployment` perf test.

---

## 6. Settled decisions (was open questions)

1. **Cross-app editing:** **Current application only** — schema resolution for the requested `application` / deployment, not a merge across `applicationDeploymentMap`.
2. **Local cache packages:** **`currentModelEnvironment()` deprecated for UI** — UI uses React context; localcache remains for DomainController / non-React runners until migrated.
3. **Server future:** **Yes** — overlay persistence (Proposal 4) will be required when server serves per-tenant dynamic meta-models.
4. **Partial refresh:** **Meta app** definition changes (Entity, EntityDefinition, Report, Query, Test, Transformer, …) → **full carry-on** / reload; **client app** model definition changes (e.g. Library Book entity, Book details report) → **overlay update for that app only**; instance data → no rebuild.

See [tdd-implementation-plan.md](./tdd-implementation-plan.md) for the TDD slices implementing proposals 2 + 5.

---

## 7. Related files (quick index)

| File | Relevance |
|------|-----------|
| `packages/miroir-core/src/1_core/jzod/schemaForDeployment.ts` | Core function, WeakMap cache |
| `packages/miroir-core/src/0_interfaces/.../getMiroirFundamentalJzodSchemaHelpers.ts` | `applyDeploymentDomainActionCarryOn` |
| `packages/miroir-core/src/1_core/Model.ts` | Module-level default envs |
| `packages/miroir-standalone-app/src/miroir-fwk/4_view/ReduxHooks.ts` | UI hook + effect |
| `packages/miroir-react/src/contexts/MiroirContextReactProvider.tsx` | `schemasPerDeployment` |
| `packages/miroir-localcache-redux/src/4_services/localCache/Model.ts` | Selector-time schema build |
| `packages/miroir-core/tests/1_core/schemaForDeployment.unit.test.ts` | Perf guard (500ms warm) |
| `code-helpers/features/198-.../tdd-implementation-plan.md` | Prior art for caching tests |
