# 199 — TDD Implementation Plan: schema resolution modes + frozen meta-model policy

> Proposals **2** (split static / extended / auto API) and **5** (policy layer: frozen
> meta-model, explicit invalidation, test defaults).
> Each cycle follows red → green; tests describe **behavior**, not implementation.

Related: [analysis.md](./analysis.md) · [#199](https://github.com/miroir-framework/miroir/issues/199) · builds on [198 TDD plan](../198-FEATURE-%20composing%20tests%20using%20application-defined%20Actions/tdd-implementation-plan.md)

---

## Implementation status (2026-07-15)

| Phase | Scope | Status |
|---|---|---|
| **1** | `SchemaResolutionMode` API | **Done** — gate 1.5 green |
| **2** | Call-site static migration | **Done** — gate 2.6 green |
| **3** | Invalidation taxonomy + revision cache | **Done** — gate 3.5 green |
| **4** | `MIROIR_SCHEMA_MODE=frozen` | **Done** — gate 4.4 green; `docs/reference/testing.md` |
| **5** | UI policy + localcache deprecation | **Done** — gate 5.6 green (unit slices); see notes |
| **6** | Wide acceptance | **Done** — 6.1 tests added; 6.2 green for 199-specific slices |

**Key deliverables**

| Area | Files |
|---|---|
| Mode router | `packages/miroir-core/src/1_core/jzod/schemaForDeployment.ts` |
| Revision / invalidation | `packages/miroir-core/src/1_core/jzod/schemaChangeKind.ts` |
| Frozen policy | `packages/miroir-core/src/1_core/jzod/schemaModePolicy.ts` |
| UI reload policy | `packages/miroir-react/src/contexts/schemaReloadPolicy.ts` |
| Hook + context | `ReduxHooks.ts` (`useCurrentModelEnvironment`), `MiroirContextReactProvider.tsx` |

**Post-implementation fixes (not in original slices)**

- **Browser UI crash**: `computeSchemaRevision` must not use `node:crypto` — FNV-1a fingerprint in `schemaChangeKind.ts` (Vite/browser bundle).
- **Partial models**: fingerprint helpers treat missing arrays (`runners`, etc.) as `[]` — DomainController / localcache paths before full load.
- **Phase 5 endpoint-add test**: meta endpoint add → `schemaReloadRequired`, not extra resolver calls (revision policy, not silent rebuild).

**Gate runner**: `./code-helpers/features/199-REFACTOR improve meta-model access performance/run-step-tests.sh <step> [all|regression|green]`

**Known env limits (not 199 regressions)**

- `npm test -- <pattern>` in standalone-app can fail on empty test files — prefer `npm run testByFile -- <path>`.
- `DomainController.integ.Model` / `ReportPage.integ`: run with integration profile from **repo root** (`PWD`); doubled path if cwd is already `packages/miroir-standalone-app`.
- `miroir-mcp` / `miroir-cli` full `npm test`: need running MCP server / filesystem store config.
- Gate 1.5 `jzodTypeCheck` filter: unrelated suite bootstrap failures in some environments.

---

## Design decisions (settled)

| Decision | Choice |
|---|---|
| Schema accessor API | Keep `getMiroirFundamentalSchemaForDeployment(deploymentUuid, model)` as **`'auto'` wrapper**; add explicit **`resolveFundamentalSchemaForDeployment(deploymentUuid, model, mode)`** with `SchemaResolutionMode = 'static' \| 'extended' \| 'auto'` |
| **Current application only** | Schema resolution scope is the **requested `application` / its deployment** — never merge schemas from all entries in `applicationDeploymentMap` |
| **Meta vs app invalidation** | Updates to **Miroir meta concepts** (Entity, EntityDefinition, Report, Query, Test/MiroirTest, Transformer, Runner, Menu, JzodSchema, Endpoint *definitions* in the **Miroir meta app**) → **`meta-full-carry-on`** (full carry-on / page reload in UI for now) |
| **App overlay invalidation** | Updates to a **client app model** (e.g. Library Book entity definition, Book details report, app-owned endpoints/actions) → **`app-overlay`** (rebuild extended `domainAction` + carry-on subtree for **that deployment only**) |
| **Data-only changes** | Entity **instance** CRUD, undo/redo, grid refresh → **`none`** (no schema rebuild) |
| **Tests default** | `MIROIR_SCHEMA_MODE=frozen` (or explicit `'static'`) for meta-model tests; opt-in `'extended'` / `'auto'` only when test adds deployments or mutates app endpoints |
| **UI localcache path** | `localCache.currentModelEnvironment()` **deprecated for UI** — UI reads schema from **React context only**; localcache keeps function for DomainController / non-React runners until fully migrated |
| **Server (future)** | Overlay persistence (Proposal 4) required for per-tenant dynamic meta-models — **out of scope** for this plan except documenting `'static'` default at startup |

---

## Test execution conventions

All commands run from **`packages/<package>`** unless noted.

| Script | Package(s) | Purpose |
|---|---|---|
| `npm test -- <pattern>` | vitest packages | Filter by describe/it name (`-t`) |
| `npm run testByFile -- <path>` | core, deployment apps, standalone | Single file, verbose |
| `npm test -- <pattern>` | `miroir-localcache-redux` (jest) | Filter by name |
| `npm run devBuild` | `miroir-core` | Rebuild after export / generated type changes |

**Legend**

| Label | Meaning |
|---|---|
| **Progress (RED)** | New test(s) must **fail** before implementation |
| **Progress (GREEN)** | Same test(s) **pass** after implementation |
| **Non-regression** | Must stay green after slice |
| **Baseline** | Run before slice — establish green state |

Gate runner: `./code-helpers/features/199-REFACTOR improve meta-model access performance/run-step-tests.sh <step> [all|regression|green]`

---

## High-level phase structure

```
Phase 1 — SchemaResolutionMode API (Proposal 2)           slices 1.1–1.5   [DONE]
  Goal : explicit static / extended / auto; carry-on never runs in static mode;
         getMiroirFundamentalSchemaForDeployment unchanged semantics via auto.

Phase 2 — Call-site migration to static (Proposal 2)      slices 2.1–2.6   [DONE]
  Goal : meta/server/test defaults use static; extended remains for Library/app paths.

Phase 3 — Invalidation taxonomy (Proposal 5)              slices 3.1–3.5   [DONE]
  Goal : classify model diffs → none | app-overlay | meta-full-carry-on;
         revision fingerprint ignores instance data.

Phase 4 — Frozen policy + env flag (Proposal 5)           slices 4.1–4.4   [DONE]
  Goal : MIROIR_SCHEMA_MODE; tests default frozen; opt-in extended documented.

Phase 5 — UI policy + deprecation (Proposal 5)            slices 5.1–5.6   [DONE]
  Goal : hook depends on schemaRevision not currentModel; current-app-only;
         deprecate UI use of localcache currentModelEnvironment; meta reload signal.

Phase 6 — Wide regression gates                           slices 6.1–6.2   [DONE]
  Goal : 198 + 199 acceptance; no carry-on on data-only refresh paths.
```

---

## Phase 1 — `SchemaResolutionMode` API (Proposal 2) ✅

### 1.1  Introduce `SchemaResolutionMode` and internal router

**Behavior**: `resolveFundamentalSchemaForDeployment(uuid, model, mode)` routes:
- `'static'` → `miroirFundamentalJzodSchema` (reference equality)
- `'extended'` → always `buildExtendedSchema(model)` when app endpoints exist; else static
- `'auto'` → current `hasAppSpecificEndpoints` branch (198 behavior)

**New / extended file**: `packages/miroir-core/src/1_core/jzod/schemaForDeployment.ts`

```
RED — packages/miroir-core/tests/1_core/schemaResolutionMode.unit.test.ts

  describe("resolveFundamentalSchemaForDeployment — static mode")
    it("returns miroirFundamentalJzodSchema by reference for Miroir deployment")
    it("returns miroirFundamentalJzodSchema by reference for Library deployment (no carry-on)")
    it("domainAction union is unchanged from build artifact in static mode")

  describe("resolveFundamentalSchemaForDeployment — extended mode")
    it("returns a distinct schema for Library model with lendDocument in domainAction")
    it("returns static schema for Miroir model (no app-owned endpoints)")

  describe("resolveFundamentalSchemaForDeployment — auto mode")
    it("matches getMiroirFundamentalSchemaForDeployment for Library and Miroir")
```

**GREEN**: Extract router; `getMiroirFundamentalSchemaForDeployment` → `resolve(..., 'auto')`.
Export `SchemaResolutionMode` + `resolveFundamentalSchemaForDeployment` from `miroir-core/src/index.ts`.

| When | Command | Expect |
|---|---|---|
| **Progress (RED)** | `npm run testByFile -- tests/1_core/schemaResolutionMode.unit.test.ts` | FAIL |
| **Progress (GREEN)** | same | PASS |
| **Non-regression** | `npm run testByFile -- tests/1_core/schemaForDeployment.unit.test.ts` | PASS (all 198 phases) |
| **Non-regression** | `npm run testByFile -- tests/1_core/modelEnvironment.unit.test.ts` | PASS |
| **Build** | `npm run devBuild` | PASS |

**Commit**: `feat(core): add SchemaResolutionMode router for deployment schema`

---

### 1.2  Static mode never invokes carry-on (spy contract)

**Behavior**: `'static'` must **never** call `applyDeploymentDomainActionCarryOn` or `buildExtendedSchema`, even for Library model.

```
RED — add to schemaResolutionMode.unit.test.ts

  it("static mode does not invoke applyDeploymentDomainActionCarryOn for Library model")
    vi.spyOn(helpers, "applyDeploymentDomainActionCarryOn")
    resolveFundamentalSchemaForDeployment(libraryUuid, libraryModel, "static")
    expect(applyDeploymentDomainActionCarryOn).not.toHaveBeenCalled()

  it("extended mode invokes applyDeploymentDomainActionCarryOn for Library model")
    // warm cache optional; spy must be called at least once
```

| When | Command | Expect |
|---|---|---|
| **Progress (RED)** | `npm test -- static mode does not invoke` | FAIL |
| **Progress (GREEN)** | same | PASS |
| **Non-regression** | `npm test -- Phase 2.9` (198 warm cache timing) | PASS |

**Commit**: `test(core): static schema mode must not run carry-on`

---

### 1.3  Static mode is O(1) — timing guard

**Behavior**: 1000× `'static'` calls for Library model complete in < 50 ms total (no 4s path).

```
RED — schemaResolutionMode.unit.test.ts

  it("static mode completes 1000 calls in under 50ms for Library model")
```

| When | Command | Expect |
|---|---|---|
| **Progress (RED)** | `npm test -- 1000 calls in under 50ms` | FAIL (if using auto today) |
| **Progress (GREEN)** | same | PASS |

**Commit**: `test(core): static schema mode timing guard`

---

### 1.4  Remove debug `console.log` from hot path

**Behavior**: `getMiroirFundamentalSchemaForDeployment` / resolver emit **no** `console.log` in production path.

```
RED — schemaResolutionMode.unit.test.ts or schemaForDeployment.unit.test.ts

  it("does not log to console when resolving schema")
    vi.spyOn(console, "log")
    resolveFundamentalSchemaForDeployment(...)
    expect(console.log).not.toHaveBeenCalledWith(expect.stringContaining("getMiroirFundamentalSchemaForDeployment"))
```

**GREEN**: Delete `console.log` line in `schemaForDeployment.ts`.

**Commit**: `chore(core): remove schemaForDeployment debug logging`

---

### 1.5  Phase 1 regression gate

| # | Command | Guards |
|---|---|---|
| 1 | `miroir-core`: `npm run testByFile -- tests/1_core/schemaResolutionMode.unit.test.ts` | New API |
| 2 | `miroir-core`: `npm run testByFile -- tests/1_core/schemaForDeployment.unit.test.ts` | 198 extended schema |
| 3 | `miroir-core`: `npm test -- jzodTypeCheck` | Resolver consumers |
| 4 | `miroir-test-app_deployment-library`: `npm test -- App-action validation` | lendDocument still valid under auto |
| 5 | `miroir-standalone-app`: `npm test -- useCurrentModelEnvironment` | Hook unchanged in Phase 1 |

**Gate**: `./run-step-tests.sh 1.5 all` — **passed**

---

## Phase 2 — Migrate call sites to `'static'` where safe (Proposal 2) ✅

### 2.1  `defaultMetaModelEnvironment` / `defaultMiroirModelEnvironment` use static

**Behavior**: Module-level defaults reference **`miroirFundamentalJzodSchema` directly** or via `resolve(..., 'static')` — **not** `'auto'` (avoids accidental carry-on at import).

```
RED — packages/miroir-core/tests/1_core/modelEnvironment.unit.test.ts

  describe("default environments use static schema (199)")
    it("defaultMiroirModelEnvironment.miroirFundamentalJzodSchema is miroirFundamentalJzodSchema")
      expect(...).toBe(miroirFundamentalJzodSchema)
    it("defaultMetaModelEnvironment.miroirFundamentalJzodSchema is miroirFundamentalJzodSchema")
    it("module init does not invoke applyDeploymentDomainActionCarryOn")
      // spy during fresh import of Model.ts in isolated vitest module graph, OR
      // assert reference equality + static timing (< 10ms for getter access)
```

**GREEN**: `Model.ts` uses `resolveFundamentalSchemaForDeployment(..., 'static')` or direct import.

| When | Command | Expect |
|---|---|---|
| **Progress (RED)** | `npm run testByFile -- tests/1_core/modelEnvironment.unit.test.ts` | FAIL on new describes |
| **Progress (GREEN)** | same | PASS |
| **Non-regression** | `npm run testByFile -- tests/5_tests/runMiroirTestSuiteInProcess.unit.test.ts` | PASS |
| **Non-regression** | `miroir-server`: smoke import `server.ts` (optional script) | No throw at load |

**Commit**: `refactor(core): default model environments use static schema mode`

---

### 2.2  Miroir deployment `modelValidation` uses static

**Behavior**: `miroir-test-app_deployment-miroir/tests/modelValidation.unit.test.ts` environments use static schema; validation results **unchanged** from 198 baseline.

```
RED — add describe("static schema mode (199)") in miroir modelValidation

  it("model environment schema is miroirFundamentalJzodSchema by reference")
  it("EntityList report still validates against static domainAction")
  // pick 2–3 existing passing cases — snapshot key paths only, not full schema dump
```

**GREEN**: Replace `getMiroirFundamentalSchemaForDeployment` with `resolve(..., 'static')` in Miroir env construction.

| When | Command | Expect |
|---|---|---|
| **Progress (GREEN)** | `npm run testByFile -- tests/modelValidation.unit.test.ts -t "static schema mode"` | PASS |
| **Non-regression** | `./run-step-tests.sh 2.2 regression` (miroir gate from 198) | PASS |

**Commit**: `refactor(miroir-deployment): modelValidation uses static schema`

---

### 2.3  Admin + Designer deployment tests default to static

Same pattern as 2.2 for admin/designer `modelValidation.unit.test.ts` (meta-model validation only).

**Non-regression**: existing passing describes in both files unchanged.

**Commit**: `refactor(admin,designer): modelValidation uses static schema`

---

### 2.4  Library deployment keeps `'extended'` / `'auto'` for app-action tests

**Behavior**: Library **Feature 198** tests (`App-action validation`, `runner_library`, carry-on) still use **`'auto'` or `'extended'`** — must still find `lendDocument` in `domainAction`.

```
RED — library modelValidation or schemaForDeployment cross-check

  it("Library app-action tests still require extended schema (not static)")
    const staticSchema = resolve(..., "static")
    const extended = resolve(..., "extended")
    expect(staticSchema).not.toBe(extended)
    // lendDocument branch present only on extended
```

| When | Command | Expect |
|---|---|---|
| **Progress (GREEN)** | `npm test -- App-action validation` | PASS |
| **Non-regression** | `npm test -- runner_library` | PASS |
| **Non-regression** | `npm test -- Phase 2.9` | PASS |

**Commit**: `test(library): document extended schema requirement for app actions`

---

### 2.5  MCP / CLI meta tooling — static for Miroir meta conversions

**Behavior**: `jzodElementToJsonSchema.ts`, `jzodElementToTS.ts` use **`defaultMiroirModelEnvironment`** (static). Endpoint handlers that need Library app actions keep **`'auto'`** via explicit `libraryModelEnvironment`.

```
RED — packages/miroir-mcp/tests/ (new or extended)

  it("jzodElementToJsonSchema uses static schema for meta types")
    // EntityDefinition shape resolves without extended domainAction
  it("Library endpoint handler still uses extended environment when configured")
```

| When | Command | Expect |
|---|---|---|
| **Non-regression** | `packages/miroir-mcp`: `npm test` | PASS |
| **Non-regression** | `packages/miroir-cli`: `npm test` | PASS |

**Commit**: `refactor(mcp,cli): static schema for meta jzod conversion tools`

---

### 2.6  Phase 2 regression gate

| # | Command | Guards |
|---|---|---|
| 1 | `run-step-tests.sh 1.5 regression` | Phase 1 intact |
| 2 | `miroir-core`: `npm run testByFile -- tests/1_core/modelEnvironment.unit.test.ts` | Static defaults |
| 3 | `miroir-test-app_deployment-miroir`: `run_miroir_gate` (198) | Meta validation |
| 4 | `miroir-test-app_deployment-library`: `npm test -- App-action validation` | Extended path |
| 5 | `miroir-standalone-app`: `npm test -- typedValueObjectEditorSchema` | Editor schema |
| 6 | `miroir-standalone-app`: `npm test -- RunnerTestSession` | Test sessions |
| 7 | `miroir-mcp`: `npm test` | MCP |
| 8 | `miroir-cli`: `npm test` | CLI |

**Gate**: `./run-step-tests.sh 2.6 all` — **passed**

---

## Phase 3 — Invalidation taxonomy (Proposal 5) ✅

**New module**: `packages/miroir-core/src/1_core/jzod/schemaChangeKind.ts`

```ts
export type SchemaChangeKind = "none" | "app-overlay" | "meta-full-carry-on";

export function computeSchemaRevision(deploymentUuid, model, applicationUuid): string;
export function classifySchemaChange(prevRevision, nextRevision, scope): SchemaChangeKind;
```

**Revision inputs (schema-relevant only)**:
- `applicationUuid`, deployment uuid
- **Meta scope** (`selfApplicationMiroir`): hashes of entityDefinitions, reports, queries, runners, jzodSchemas, menus, **endpoint definitions** in meta model — **not** instance payloads
- **App scope** (e.g. Library): app-owned **endpoint** actionTypes + entity/report/menu **definitions** (Book entity shape, Book details report uuid) — **not** Book instances

### 3.1  `computeSchemaRevision` ignores instance data

```
RED — packages/miroir-core/tests/1_core/schemaChangeKind.unit.test.ts

  it("revision unchanged when only entity instance data changes")
    base = minimalLibraryModel(); rev1 = computeSchemaRevision(...)
    mutated = { ...base, entities: [...changed instance fields...] }
    expect(computeSchemaRevision(..., mutated)).toBe(rev1)

  it("revision unchanged when only report instance data changes")
  it("revision unchanged on undo/redo simulation (new object ref, same schema content)")
```

**GREEN**: Implement revision from structural definition fields only.

**Commit**: `feat(core): computeSchemaRevision ignores instance data`

---

### 3.2  App overlay revision — Library Book entity / report definition

```
RED — schemaChangeKind.unit.test.ts

  it("revision changes when Library Book entity definition attributes change")
  it("revision changes when Book details report definition changes")
  it("revision changes when app-owned endpoint gains a new actionType")
  it("classifySchemaChange returns app-overlay for app-scope definition edits")
```

Use fixtures from `defaultLibraryAppModel` + surgical clones (mirror 198 test patterns).

**Commit**: `feat(core): detect app-overlay schema changes`

---

### 3.3  Meta full carry-on — Miroir concept definition changes

```
RED — schemaChangeKind.unit.test.ts

  it("revision changes when Miroir Entity entityDefinition changes")
  it("revision changes when Miroir Report definition changes")
  it("revision changes when Miroir Query / Runner / Transformer definition changes")
  it("classifySchemaChange returns meta-full-carry-on for meta-scope definition edits")
```

**Note**: “Transformer” = meta-model runner/transformer **definitions**, not runtime transformer evaluation.

**Commit**: `feat(core): detect meta-full-carry-on schema changes`

---

### 3.4  Wire revision into WeakMap cache (content-keyed)

**Behavior**: Cache key `(deploymentUuid, schemaRevision)` — new model object with same revision **hits** cache under `'auto'`/`'extended'`.

```
RED — schemaForDeployment.unit.test.ts (new describe "Phase 199 — revision cache")

  it("second call with new model ref but same revision hits cache (< 500ms)")
    resolve(..., "extended"); // warm
    const clone = deepCloneModel(libraryModel)
    start = Date.now()
    resolve(..., "extended", clone)
    expect(Date.now() - start).toBeLessThan(500)

  it("revision change after endpoint edit misses cache and rebuilds")
```

**GREEN**: Content-keyed `Map` via `${deploymentUuid}:${mode}:${combinedRevision}`; `clearSchemaCacheForTests()` for unit tests.

| When | Command | Expect |
|---|---|---|
| **Non-regression** | `npm test -- Phase 2.9` | PASS |
| **Non-regression** | `npm test -- Phase 2.8` (standalone) | PASS after Phase 5 adjusts deps |

**Commit**: `feat(core): content-keyed schema cache by schemaRevision`

---

### 3.5  Phase 3 regression gate

| # | Command |
|---|---|
| 1 | `npm run testByFile -- tests/1_core/schemaChangeKind.unit.test.ts` |
| 2 | `npm run testByFile -- tests/1_core/schemaForDeployment.unit.test.ts` |
| 3 | `npm test -- App-action validation` |
| 4 | `npm test -- useCurrentModelEnvironment` |

**Gate**: `./run-step-tests.sh 3.5 all` — **passed**

---

## Phase 4 — Frozen policy + `MIROIR_SCHEMA_MODE` (Proposal 5) ✅

### 4.1  Env flag defaults tests to frozen (static)

**Behavior**: When `process.env.MIROIR_SCHEMA_MODE === 'frozen'`, `getMiroirFundamentalSchemaForDeployment` delegates to `'static'` regardless of app endpoints.

```
RED — schemaResolutionMode.unit.test.ts

  it("MIROIR_SCHEMA_MODE=frozen forces static for Library model")
    withEnv({ MIROIR_SCHEMA_MODE: "frozen" }, () => {
      expect(getMiroirFundamentalSchemaForDeployment(libraryUuid, libraryModel))
        .toBe(miroirFundamentalJzodSchema)
    })
```

**GREEN**: Read env in resolver; document in `docs/reference/testing.md`.

**Commit**: `feat(core): MIROIR_SCHEMA_MODE=frozen for test static schema`

---

### 4.2  `FunctionCallTestFixtures` and session helpers use frozen/static

```
RED — packages/miroir-core/tests/5_tests/FunctionCallTestFixtures.unit.test.ts (new)

  it("defaultMetaModelEnvironment factory returns static schema")
  it("defaultMiroirModelEnvironment factory returns static schema")
```

**GREEN**: Fixtures import `defaultMetaModelEnvironment` (already static after 2.1) — test locks contract.

**Non-regression**:
- `miroir-standalone-app`: `npm run testByFile -- tests/helpers/testSessionModelEnvironment.unit.test.ts`
- `miroir-core`: `npm test -- RunnerTestSession`

**Commit**: `test(core): freeze default test fixture schema policy`

---

### 4.3  Opt-in extended tests explicitly set mode

**Behavior**: Tests that **require** lendDocument typing must set `MIROIR_SCHEMA_MODE=runtime` or call `resolve(..., 'extended')` explicitly — never rely on implicit auto in frozen CI.

```
RED — document in library tests

  describe("extended schema required — opt out of frozen mode")
    beforeAll(() => { process.env.MIROIR_SCHEMA_MODE = "runtime" })
    // existing App-action validation cases
```

Add CI note: default `MIROIR_SCHEMA_MODE=frozen` in root test scripts **except** library extended suite.

**Commit**: `test(library): opt in to runtime schema mode for app-action tests`

---

### 4.4  Phase 4 regression gate

| # | Command |
|---|---|
| 1 | `MIROIR_SCHEMA_MODE=frozen npm test -- modelEnvironment` (core) |
| 2 | `MIROIR_SCHEMA_MODE=frozen npm test -- FunctionCallTestFixtures` |
| 3 | `npm test -- App-action validation` (runtime mode) |
| 4 | `run-step-tests.sh 2.6 regression` |

**Gate**: `./run-step-tests.sh 4.4 all` — **passed**

---

## Phase 5 — UI policy, current-app scope, deprecation (Proposal 5) ✅

### 5.1  `useCurrentModelEnvironment` depends on `schemaRevision`, not `currentModel`

**Behavior**: Effect runs when **`computeSchemaRevision(deploymentUuid, currentModel, application)`** changes — **not** on every new model reference. Data-only refresh → **zero** resolver calls (spy on `resolveFundamentalSchemaForDeployment`, not `getMiroirFundamentalSchemaForDeployment`).

```
RED — useCurrentModelEnvironment.unit.test.tsx (new describe "Phase 199")

  it("does not call getMiroirFundamentalSchemaForDeployment when only instance data changes")
    // mount → record spy count
    // dispatch TEST_UPDATE that mutates entity instance only (existing helper)
    // assert spy.mock.calls.length unchanged

  it("calls resolver when app endpoint added (app-overlay revision change)")
  it("does not recompute when unrelated deployment's model changes in map")
```

**GREEN**: Replace `[currentModel]` effect dep with `[schemaRevision]`; compute revision via `computeSchemaRevision`.

**Commit**: `perf(ui): useCurrentModelEnvironment keyed on schemaRevision`

---

### 5.2  Current application only — no cross-app schema merge

**Behavior**: Hook receives **`application`**; schema resolved for **`applicationDeploymentMap[application]`** only. Endpoints in env may still list related apps for **display**, but **`miroirFundamentalJzodSchema` is not merged across apps**.

```
RED — useCurrentModelEnvironment.unit.test.tsx

  it("schema for Library application ignores Admin model mutations")
    // map contains both apps; mutate admin model in store
    // Library hook env schema unchanged (spy not called)
```

**Commit**: `fix(ui): schema resolution scoped to current application only`

---

### 5.3  Meta definition change → reload required signal (no silent carry-on in session)

**Behavior**: When `classifySchemaChange` → `meta-full-carry-on`, context exposes `schemaReloadRequired: true` and **does not** invoke extended resolver in UI session (uses last good static/extended schema until reload).

```
RED — packages/miroir-react/tests/schemaReloadPolicy.unit.test.tsx (new)

  it("sets schemaReloadRequired when meta entity definition changes")
  it("does not set schemaReloadRequired for Library Book instance edit")
  it("sets schemaReloadRequired when Miroir Report definition changes")
```

**GREEN**: Policy in `schemaReloadPolicy.ts`; wired via `applyDeploymentSchemaRevision` in `MiroirContextReactProvider`.

Optional UI: banner in `RootComponent` when `schemaReloadRequired` (minimal — test via context state only in Phase 5).

**Commit**: `feat(ui): meta schema edits require reload instead of silent rebuild`

---

### 5.4  App overlay change → invalidate deployment schema only

```
RED — schemaReloadPolicy.unit.test.tsx

  it("invalidates schemasPerDeployment[libraryUuid] on app-overlay change")
  it("does not invalidate schemasPerDeployment[miroirUuid] on Library overlay change")
  it("re-resolves with extended mode once for overlay revision bump")
```

**Commit**: `feat(ui): app-overlay invalidates current deployment schema only`

---

### 5.5  Deprecate `localCache.currentModelEnvironment` for UI paths

**Behavior**:
- Mark `@deprecated` on `LocalCacheInterface.currentModelEnvironment` JSDoc — *“Use React context `schemasPerDeployment` in UI; reserved for DomainController/runners.”*
- `useCurrentModelEnvironment` **never** calls `localCache.currentModelEnvironment`.
- `console.warn` when `MIROIR_UI_CONTEXT=1` in redux **and** zustand `currentModelEnvironment`.

```
RED — packages/miroir-localcache-redux/tests/currentModelEnvironment.unit.test.ts

  it("emits console.warn when called with MIROIR_UI_CONTEXT=1")  // optional guard env

RED — useCurrentModelEnvironment.unit.test.tsx

  it("does not call localCache.currentModelEnvironment")
    vi.spyOn(localCache, "currentModelEnvironment")
    renderHook(...)
    expect(localCache.currentModelEnvironment).not.toHaveBeenCalled()
```

**Non-regression** (DomainController still uses localcache):
- `miroir-standalone-app`: `npm test -- DomainController.integ`
- `miroir-standalone-app`: `npm test -- DomainController.integ.Model`

**Commit**: `deprecate(localcache): currentModelEnvironment not for UI schema`

---

### 5.6  Phase 5 regression gate

| # | Command | Guards |
|---|---|---|
| 1 | `npm run testByFile -- tests/4_view/useCurrentModelEnvironment.unit.test.tsx` | Revision deps |
| 2 | `miroir-react`: `npm test -- schemaReloadPolicy` | Reload policy — **`tests/schemaReloadPolicy.unit.test.ts`** (6 tests) |
| 3 | `npm run testByFile -- tests/4_view/JzodElementEditor.test.tsx` | Editor |
| 4 | `npm run testByFile -- tests/4_view/typedValueObjectEditorSchema.unit.test.ts` | lendDocument |
| 5 | `npm test -- DomainController.integ.Model` | DC localcache OK |
| 6 | `npm test -- applicative.Library` (if non-empty) | Library runtime |
| 7 | `npm test -- ReportPage.integ` | Report page |

**Gate**: `./run-step-tests.sh 5.6 all` — **passed** (unit/regression slices; integ steps env-dependent)

---

## Phase 6 — Wide regression gates (199 acceptance) ✅

### 6.1  Performance acceptance (automated) — **done**

| Test | Location | Status |
|---|---|---|
| Data-only change does not trigger carry-on | `schemaForDeployment.unit.test.ts` → `Phase 6 — performance acceptance (199)` | ✅ |
| Static mode: 1000 calls &lt; 50ms | `schemaResolutionMode.unit.test.ts` (Phase 1.3) | ✅ |
| Extended warm cache &lt; 500ms | `schemaForDeployment.unit.test.ts` (Phase 2.9 + 199 revision cache) | ✅ |
| UI mount: ≤1 extended resolve until overlay | `useCurrentModelEnvironment.unit.test.tsx` → `Phase 6 — performance acceptance` | ✅ |
| Instance-only localCache → no resolver | `useCurrentModelEnvironment.unit.test.tsx` → `Phase 199` | ✅ |

### 6.2  Full 199 gate (run after 5.6)

| # | Command | What it guards |
|---|---|---|
| 1 | `miroir-core`: `npm run testByFile -- tests/1_core/schemaResolutionMode.unit.test.ts` | Mode API |
| 2 | `miroir-core`: `npm run testByFile -- tests/1_core/schemaChangeKind.unit.test.ts` | Invalidation |
| 3 | `miroir-core`: `npm run testByFile -- tests/1_core/schemaForDeployment.unit.test.ts` | 198 + 199 cache |
| 4 | `miroir-core`: `npm run testByFile -- tests/1_core/modelEnvironment.unit.test.ts` | Static defaults |
| 5 | `miroir-core`: `run_core_gate` (198) | Full core suites |
| 6 | `miroir-test-app_deployment-miroir`: `run_miroir_gate` | Meta validation |
| 7 | `miroir-test-app_deployment-library`: `run_library_gate` + `App-action validation` | Extended app |
| 8 | `miroir-test-app_deployment-admin`: `modelValidation` (passing subset) | Admin |
| 9 | `miroir-test-app_deployment-designer`: `modelValidation` (passing subset) | Designer |
| 10 | `miroir-standalone-app`: `npm run testByFile -- tests/4_view/useCurrentModelEnvironment.unit.test.tsx` | UI hook |
| 11 | `miroir-standalone-app`: `npm run testByFile -- tests/helpers/RunnerTestSession.unit.test.ts` | Sessions — prefer testByFile over `-t` |
| 12 | `miroir-standalone-app`: `npm run testByFile -- tests/4_view/typedValueObjectEditorSchema.unit.test.ts` | Editor typing |
| 13 | `miroir-mcp`: `npm test` | MCP |
| 14 | `miroir-cli`: `npm test` | CLI |
| 15 | `miroir-localcache-redux`: `npm test` | Localcache (deprecated but DC) |
| 16 | `MIROIR_SCHEMA_MODE=frozen npm run testByFile -- tests/1_core/modelEnvironment.unit.test.ts` | Frozen CI default |

Optional manual smoke (not automated):
- Open Library grid → edit Book instance → **no** multi-second pause.
- Add endpoint in designer → overlay rebuild once.
- Edit Miroir Entity definition → **`schemaReloadRequired` in context** (banner UI optional / not implemented).

**Gate**: `./run-step-tests.sh 6.2 all` — **passed** for rows 1–12, 15–16; rows 13–14 need integration env (see status section).

---

## Summary: commit sequence

```
Phase 1 (SchemaResolutionMode)                              [DONE]
  1.1  feat(core): add SchemaResolutionMode router
  1.2  test(core): static mode must not run carry-on
  1.3  test(core): static schema mode timing guard
  1.4  chore(core): remove schemaForDeployment debug logging
  (1.5) gate

Phase 2 (static migration)                                  [DONE]
  2.1  refactor(core): default model environments use static schema mode
  2.2  refactor(miroir-deployment): modelValidation uses static schema
  2.3  refactor(admin,designer): modelValidation uses static schema
  2.4  test(library): document extended schema requirement
  2.5  refactor(mcp,cli): static schema for meta jzod tools
  (2.6) gate

Phase 3 (invalidation taxonomy)                             [DONE]
  3.1  feat(core): computeSchemaRevision ignores instance data
  3.2  feat(core): detect app-overlay schema changes
  3.3  feat(core): detect meta-full-carry-on schema changes
  3.4  feat(core): content-keyed schema cache by schemaRevision
  (3.5) gate

Phase 4 (frozen policy)                                     [DONE]
  4.1  feat(core): MIROIR_SCHEMA_MODE=frozen
  4.2  test(core): freeze default test fixture schema policy
  4.3  test(library): opt in to runtime schema mode for app-action tests
  (4.4) gate

Phase 5 (UI policy)                                         [DONE]
  5.1  perf(ui): useCurrentModelEnvironment keyed on schemaRevision
  5.2  fix(ui): schema resolution scoped to current application only
  5.3  feat(ui): meta schema edits require reload
  5.4  feat(ui): app-overlay invalidates current deployment schema only
  5.5  deprecate(localcache): currentModelEnvironment not for UI schema
  (5.6) gate

Phase 6                                                     [DONE]
  6.1  performance acceptance tests
  (6.2) full 199 acceptance gate
```

---

## Quick reference: primary test file per step

| Step | Primary progress test | Primary non-regression |
|---|---|---|
| 1.1 | `schemaResolutionMode.unit.test.ts` | `schemaForDeployment.unit.test.ts` |
| 1.2 | static carry-on spy | Phase 2.9 timing |
| 2.1 | `modelEnvironment.unit.test.ts` | `runMiroirTestSuiteInProcess` |
| 2.4 | Library `App-action validation` | `runner_library` |
| 3.1–3.3 | `schemaChangeKind.unit.test.ts` | `schemaForDeployment` |
| 3.4 | revision cache describe | Phase 2.8 / 2.9 |
| 4.1 | frozen env describe | library extended suite |
| 5.1 | `useCurrentModelEnvironment` Phase 199 + Phase 6 | `JzodElementEditor.test.tsx` |
| 5.3 | `schemaReloadPolicy.unit.test.ts` (miroir-react) | `ReportPage.integ` |
| 5.5 | localcache deprecation test | `DomainController.integ.Model` |
| 6.1 | Phase 6 describes above | Phase 1.3 + 2.9 |
| 6.2 | — | §6.2 table (16 commands) |

---

## Key implementation hazards

### H1 — Static mode must not break Library **runtime** typing
UI editors for Library still need **`'extended'`** via context for `lendDocument`. Static migration applies to **meta defaults and frozen tests**, not Library `schemasPerDeployment` population.

### H2 — Revision hash scope bleed
Meta revision must hash **only** `selfApplicationMiroir` model sections; app revision **only** the client app's definitions. Cross-contamination causes false `meta-full-carry-on` on Library data edits.

### H3 — Phase 5.1 vs 198 Phase 2.8
198 test *“recompute when model changes”* (endpoint add) updated — meta endpoint add sets **`schemaReloadRequired`**, not extra resolver calls; effect keyed on **schemaRevision**, not model reference.

### H6 — Browser-safe revision hash
`computeSchemaRevision` runs on the UI hot path — must not import `node:crypto`. Use a sync non-crypto fingerprint (FNV-1a); revision strings are for change detection only.

### H7 — Partial `MetaModel` at runtime
DomainController / early localcache may omit `runners`, `storedQueries`, etc. Fingerprint helpers must treat missing arrays as `[]`.

### H4 — `currentModelEnvironment` deprecation is UI-only
DomainController, `runTestOrTestSuite`, integration tests may still call localcache until a later issue migrates them to injected env from context.

### H5 — Server overlay persistence (answer #3)
Document in `analysis.md` / ADR: when server serves dynamic tenant meta-models, **persist app overlay artifacts** at deploy (Proposal 4) — 199 Phase 2–5 unblocks UI/tests; server persistence is follow-up issue.

---

## Out of scope (follow-up issues)

- **Proposal 3**: Central `ModelEnvironmentProvider` (can build on Phase 5 context work)
- **Proposal 4**: Deploy-time overlay persistence + server hot path
- **Proposal 1** standalone: largely delivered by Phase 3.4 revision cache (keep single issue)
