# Analysis — Ephemeral application deployment requires model UUID remapping

**Feature:** [#197](./plan.md) Phase B (UI integ launcher) · B6-d2  
**Companion:** [analysis-ui-integ-without-testing-library.md](./analysis-ui-integ-without-testing-library.md) · [phase-b-ui-launcher-plan.md](./phase-b-ui-launcher-plan.md)

---

## 1. Verdict (read this first)

An application model is **grounded** in its own SelfApplication UUID. The meta-model and many instance trees embed that UUID for orientation (ownership FKs, menus, home links) **and** for action payloads (`createInstance`, `createEntity`, …). Therefore:

> **A given application model cannot be ephemerally deployed as-is.**  
> Only a **transformed** definition — functionally equivalent, but consistent under a **new** application UUID (and typically a new deployment UUID) — can be.

The 2026-07-15 UI integ failure (`controller for deployment: undefined`) was the first visible symptom of that structural rule, not a PersistenceStoreControllerManager bug and not “admin map refresh missing.”

| What looked like the bug | What it actually was |
|--------------------------|----------------------|
| Ephemeral runTarget `db88d62b… → acedd499…` vs lend payload `application: 5af03c98…` | Library Endpoint `212f2784-…` still carries the **canonical** Library UUID inside nested actionImplementations |
| “Pinned Suite Target” as an alternative smoke path | **Not a real escape hatch:** leaving the model unchanged means the test can only target an app that is **not already deployed** under that UUID (or must mutate the live deployment). That defeats data isolation. |

**Create Application** works because it builds **new** identity from templates / fresh SelfApplication rows, with map extended for that new UUID — it does **not** clone an existing grounded model verbatim.

**Implication for B6-d2:** when “Run Integration” is clicked, the launcher must:

1. Discover every relative path in the source application model where the model’s **own** application UUID appears.  
2. Produce a consistent remapped model (and deployment identity) under fresh UUIDs.  
3. Deploy **that** transformed model into the ephemeral playfield, then run the suite against it.

Narrow hand-edits (e.g. `getFromParameters` → `testApplicationUuid` on lend/return only) are useful stopgaps / fixtures for TDD of the transformers; they are **not** the durable architecture.

---

## 2. Two kinds of “application UUID” references

| Kind | Role | Ephemeral requirement |
|------|------|------------------------|
| **Grounding / orientation** | Meta-model and instances point at “which SelfApplication this model belongs to”: `MetaModel.applicationUuid`, instance `selfApplication` / `application`, menu links, homePageUrl, report display embeds, … | Must be rewritten to the **new** SelfApplication UUID so the clone is internally consistent |
| **Action payload targeting** | Runtime actions (`createInstance`, queries, …) carry `payload.application` so Persistence can resolve `applicationDeploymentMap[application] → deploymentUuid` | Must also resolve to the **new** UUID (literal after remap, or param bank value that the launcher sets to that UUID) |

Both kinds are present in Library, Miroir, and Admin assets. Treating only payload targeting (param bank) without remapping grounding leaves a model that still “thinks” it is Library `5af03c98…` while the store registry uses another UUID.

### Why “Pinned Suite” is not the isolation strategy

Pinned `runTarget` (suite JSON listing `5af03c98` / `f714bb2f`) assumes the **canonical** model + deployment identity. That only works if:

- the suite runs against the **already deployed** live Library (pollutes / races with the user’s session), **or**
- Library is **not** deployed and the test is allowed to own those UUIDs exclusively.

Neither is “clean, distinct deployment, functionally equivalent.” **Ephemeral + remapped model** is the isolation strategy. Pinned mode may remain as a **debug / non-isolated** advanced option later; it is **not** the B6-d2 done criterion.

---

## 3. Symptom that revealed the gap (evidence)

Log (~21:08, `preLendBookForReturn`):

1. Session map: `{ miroir→10ff, admin→18db, ephemeralApp→acedd499 }`.  
2. Controllers registered for all three deployments.  
3. Resolved `createInstance` still had `"application": "5af03c98-…"`.  
4. Saga: `deploymentUuid = map[application]` → `undefined` → “could not find controller for deployment: undefined”.

So PSC registration succeeded; **model identity did not follow the ephemeral deployment**.

Persistence path (unchanged fact):

```text
deploymentUuid = applicationDeploymentMap[action.payload.application]
→ getPersistenceStoreController(deploymentUuid)
```

---

## 4. Where the application UUID appears in models

Canonical UUIDs used in design / fixtures:

| App | SelfApplication UUID |
|-----|----------------------|
| Library | `5af03c98-fe5e-490b-b08f-e1230971c57f` |
| Miroir | `360fcf1f-f0d4-4f8a-9262-07886e70fa15` |
| Admin | `55af124e-8c05-4bae-a3ef-0933d41daa92` |

Library deployment often co-embedded: `f714bb2f-a12d-4e71-a03b-74dcedea6eb4`.

### Categories (design corpus)

| Category | Examples (Library-relative) |
|----------|------------------------------|
| MetaModel root | `defaultLibraryAppModel.applicationUuid` |
| SelfApplication identity | `library_model/a659d350-…/5af03c98-….json` → `$.uuid`, `$.homePageUrl.selfApplication` |
| Ownership FKs | Entity/Report/… → `$.selfApplication`; Endpoint/Runner → `$.application` |
| Nested Endpoint action payloads | `212f2784-….json` → `$.definition.actions[*].actionImplementation…payload.application` |
| Nested Report UI | `9c0cdb97-….json` → nested `value.application` (+ often `deploymentUuid`) |
| Menu / navigation | `dd168e5a-….json` → items `selfApplication`, sometimes `instanceUuid` = SelfApplication |
| Test metadata | MiroirTest `definition.runTarget.applicationUuid` |
| Admin registry (outside MetaModel) | CreateDeploymentInstances writes Admin Application/Deployment — session map must include new app→deployment |

### Existing partial rewrite — not sufficient

`duplicateApplicationModel` (`TransformersForRuntime.ts` / Miroir transformer definition) rewrites top-level `applicationUuid`, many `selfApplication` / Endpoint top-level `application` fields, and shallow menu string replaces. It **misses** nested Endpoint `actionImplementation` payloads, deep Report embeds, and several passthrough arrays. It is a **starting point**, not the B6-d2 solution.

`Runner_CreateApplication` / `createDeploymentCompositeAction` create **new** identity; they do not deep-clone an existing grounded model.

---

## 5. Target architecture for B6-d2

```text
[Run Integration]
    → resolve ephemeral runTarget (newApplicationUuid, newDeploymentUuid)
    → load source MetaModel (e.g. defaultLibraryAppModel)
    → T1: listSelfApplicationUuidPaths(model, sourceApplicationUuid)
         → RelativePath[]
    → T2: remapApplicationModel(model, paths, { oldApplicationUuid, newApplicationUuid, … })
         → remapped MetaModel
    → deploy remapped model into ephemeral stores
         (createDeployment + initModel / seed with remapped instances)
    → extend applicationDeploymentMap[newApplicationUuid] = newDeploymentUuid
    → run suite (param bank: testApplicationUuid = newApplicationUuid, …)
```

Functional equivalence means: same entities, endpoints, reports, menus, action graphs — only **self-identity** (and optionally co-embedded deployment UUIDs) change.

---

## 6. Plan — two transformers in `miroir-core` (TDD)

Both live in `miroir-core` (domain transformers / test helpers as appropriate), driven by Vitest **unit** tests first, then a small Library fixture integration, then wire into the UI launcher.

### 6.0 Design corpus (before / while coding)

Use existing deployed definitions as oracles to discover path patterns:

| Corpus | Package / assets |
|--------|------------------|
| Library | `miroir-test-app_deployment-library` (esp. Endpoint `212f2784`, Menu `dd168e5a`, Report `9c0cdb97`, SelfApplication `5af03c98`) |
| Miroir | `miroir-test-app_deployment-miroir` |
| Admin | `miroir-test-app_deployment-admin` |
| EntityDefinitions | Miroir model `54b9c72f-…` — attributes named `selfApplication` / `application`, FKs to SelfApplication entity `a659d350-…`, nested Menu/Report/Endpoint schemas |

EntityDefinitions guide **where to look** (schema-driven discovery). Instance trees from Library/Miroir/Admin supply **concrete relative paths** for golden tests.

Clues for schema-driven discovery:

- Attributes `selfApplication` or `application` with `type: "uuid"`.  
- `foreignKeyParams.targetEntity` = SelfApplication entity.  
- Nested unions under Menu items, Report section definitions, Endpoint `actionImplementation` / `payload`.  
- String fields that may embed UUID substrings (`homePageUrl` as string).  
- Objects that are already transformers (`getFromParameters`) — **do not** treat as literal UUID sites.

Also remap **deployment UUID** where the model embeds the source deployment (report display, runTarget, Deployment rows) when the ephemeral run allocates a new deployment UUID — either as part of T2 params or a sibling pass. Call this out in T2 API even if the first slice only remaps application UUID.

---

### T1 — `listSelfApplicationUuidPaths` ✅ (2026-07-16)

**Module:** `packages/miroir-core/src/1_core/listSelfApplicationUuidPaths.ts`  
**Tests:** `packages/miroir-core/tests/1_core/listSelfApplicationUuidPaths.unit.test.ts` (T1-a…i + helpers)  
**v1 strategy:** deep-scan string equality + substring embeds; skip `transformerType` subtrees; array indices returned as joker `*` (deduplicated patterns, e.g. `entities.*.selfApplication`). Option `useJokerForArrayIndices: false` for concrete indices.

**Proposed signature (illustrative):**

```ts
type RelativePath = (string | number)[]; // JSON-path segments

function listSelfApplicationUuidPaths(
  model: MetaModel, // or normalized ApplicationModelView
  sourceApplicationUuid: Uuid,
  options?: {
    entityDefinitions?: EntityDefinition[]; // schema-driven walk
    includeDeploymentUuid?: Uuid;           // optional co-scan
  },
): RelativePath[];
```

**Behavior:**

1. Walk known MetaModel collections (`applications`, `entities`, `entityDefinitions`, `endpoints`, `reports`, `menus`, `runners`, …).  
2. Prefer **schema-informed** visits (EntityDefinitions / Endpoint definitions) over blind deep equality, but allow a **fallback deep scan** for string equality to `sourceApplicationUuid` to catch nests schemas miss (with tests documenting both).  
3. Skip transformer objects (`transformerType: "getFromParameters"`, etc.) — those are runtime bindings, not grounding literals.  
4. Return stable, deterministic path order (sorted) for snapshot tests.

**TDD slices:**

| Slice | Test | Assert |
|-------|------|--------|
| T1-a | Minimal MetaModel: only `applicationUuid` + one SelfApplication | Paths for root + `applications[0].uuid` (+ homePageUrl if present) |
| T1-b | One Entity with `selfApplication` | Path under `entities[i].selfApplication` |
| T1-c | Endpoint top-level `application` only | Path found; nested payload **not** present |
| T1-d | Library Endpoint `212f2784` fixture (or reduced extract) | Paths include nested `actionImplementation…payload.application` **and** top-level `application` |
| T1-e | Menu with report links | Paths for item `selfApplication` / `instanceUuid` when equal to source |
| T1-f | Report nested display `application` | Path under definition tree |
| T1-g | Parameterized payload (`getFromParameters`) | **No** path reported for that node |
| T1-h | Full `defaultLibraryAppModel` golden snapshot | Snapshot of path list; fail on unexpected new categories (forces conscious schema updates) |
| T1-i | Miroir + Admin smoke fixtures | Same categories; different UUID; no Library UUID false positives |

**Non-goals for T1:** rewriting; deployment UUID discovery can be a parallel list or option flag in a later slice.

---

### T2 — `remapApplicationModelAtPaths`

**Purpose:** Given a model, a path list from T1, and `{ oldApplicationUuid, newApplicationUuid }` (and optionally old/new deployment UUID), return a **new** model where every listed path is updated so the clone is consistent under the new identity.

**Proposed signature (illustrative):**

```ts
function remapApplicationModelAtPaths(
  model: MetaModel,
  paths: RelativePath[],
  remap: {
    oldApplicationUuid: Uuid;
    newApplicationUuid: Uuid;
    oldDeploymentUuid?: Uuid;
    newDeploymentUuid?: Uuid;
  },
): MetaModel;
```

**Behavior:**

1. Deep-clone (immutable) then set each path.  
2. For string values: replace exact UUID match; optionally `replaceAll` inside URL-like strings when path is marked string-embed (homePageUrl).  
3. Update MetaModel root `applicationUuid` / SelfApplication `uuid` consistently with paths (or require those paths to be in the list — prefer “paths are authoritative”).  
4. Fail loud if a path does not exist or value ≠ `oldApplicationUuid` (unless option `force`).  
5. Idempotent: remapping an already-new model with matching old uuid is a no-op / empty path list.

**TDD slices:**

| Slice | Test | Assert |
|-------|------|--------|
| T2-a | Round-trip T1-a → T2 | New uuid everywhere T1 listed; old uuid absent at those paths |
| T2-b | Endpoint nested payload extract | After remap, lend `payload.application` === new uuid |
| T2-c | Full Library MetaModel | No residual `oldApplicationUuid` string equality in model JSON (allowlist exceptions if any — document) |
| T2-d | Compare to extended `duplicateApplicationModel` cases | Nested payloads fixed where duplicateApplicationModel fails |
| T2-e | Missing path / wrong value | Throws actionable error |
| T2-f | Optional deployment remap | Report display `deploymentUuid` updated when provided |

**Composition test (T1∘T2):**

| Slice | Test | Assert |
|-------|------|--------|
| C-a | `remap = T2(model, T1(model, old), {old,new})` | Deployable consistency: every former self-ref is `new` |
| C-b | Persistence resolution fixture | Fake map `{ newApp → newDep }`; action from remapped endpoint resolves controller |
| C-c | Diff vs source | Structural equality ignoring remapped uuid fields (or hash of path-stripped trees) |

---

### Wire-up (after T1∘T2 green) — B6-d2 launcher

| Step | Work |
|------|------|
| W1 | In `RunnerTestSession` / browser orchestrator bootstrap: before seeding playfield, run T1∘T2 on suite’s source MetaModel (Library for `runner_library`). |
| W2 | Seed / initModel with **remapped** model; register `applicationDeploymentMap[newApp]=newDep`. |
| W3 | Param bank: `testApplicationUuid` / `testApplicationDeploymentUuid` = ephemeral ids (already from `buildRunnerTestSessionParamBank`). |
| W4 | Teardown still drops ephemeral deployment only. |
| W5 | Manual B6-d2 checklist: Return Book green on emulated indexedDb without touching live Library. |

Stopgap lend/return `getFromParameters` edits and runTarget-aware `beforeEach` remain compatible (param bank still supplies new uuid) but become **redundant for grounding** once T2 rewrites literals.

### Post-wire findings (2026-07-16)

#### F1 — Blank UI after clicking "Run Integration Tests" (fixed)

- **Symptom:** Browser UI went blank immediately on integration run start and stayed blank after completion.
- **Root cause:** `beforeEachTest()` in `RunnerIntegTestTools.tsx` unconditionally executed `document.body.innerHTML = ""`, which unmounted the live React app during UI-launched runs.
- **Fix:** Added `beforeEachTest(..., options?: { clearDocumentBody?: boolean })`; `RunnerTestSession.beforeEach()` now calls it with `clearDocumentBody: false` for UI integration sessions.
- **Scope:** Keeps DOM clearing behavior available for harness-only / legacy contexts while preserving mounted UI for B6 launcher runs.

#### F2 — Fundamental schema recomputation during ephemeral run lifecycle (issue #199 context)

- **Observed:** Logs show repeated `getMiroirFundamentalSchemaForDeployment` resolution around ephemeral deployment create/reset/teardown.
- **Why this happens (non-display path):**
  1. `runMiroirRunnerTest` calls `domainController.currentModelEnvironment(...)` before executing runner composite actions.
  2. `DomainController.currentModelEnvironment` delegates to local cache `currentModelEnvironment`.
  3. Local cache `currentModelEnvironment` builds `miroirFundamentalJzodSchema` via `getMiroirFundamentalSchemaForDeployment(deploymentUuid, model)`.
  4. `RunnerTestSession.teardown()` also calls `buildTestSessionModelEnvironment(...)`, which currently resolves schema the same way.
- **Conclusion:** Schema resolution is **not only for display**; it is also used in non-UI execution paths (DomainController/test-runner model environments).
- **Optimization direction for #199:**
  - Avoid schema rebuilds when the deployment/model revision key is unchanged (stronger cache-hit path across runner phases).
  - For teardown-only paths that do not require extended app endpoint branches, evaluate explicit `resolveFundamentalSchemaForDeployment(..., "static")`.
  - Revisit whether teardown can reuse a previously materialized `MiroirModelEnvironment` from session init instead of rebuilding.

---

## 7. Locked decisions (grill) — revised

| ID | Decision | Status |
|----|----------|--------|
| **D-EPHEM-1** | B6-d2 isolation = **true ephemeral** (fresh application + deployment UUIDs). | Locked 2026-07-15 |
| **D-EPHEM-2′** | Durable fix = **model remapping transformers (T1 + T2)** in `miroir-core`, composed on Run Integration — **not** “pinned suite” and not launcher-only map aliasing. | Locked 2026-07-16 (this reshape) |
| **D-EPHEM-3** | Pinned suite target is **not** the isolation strategy (can only safely own canonical UUIDs if app not already deployed, or pollutes live). Deferred as optional non-isolated debug. | Locked 2026-07-16 |
| **D-EPHEM-4** | Narrow asset / param-bank stopgaps are **scaffolding for TDD / interim smoke**, not the end state. | Locked 2026-07-16 |

Supersedes earlier D-EPHEM-2 wording that treated endpoint `getFromParameters` hand-edits as the primary portable fix.

---

## 8. Secondary gaps (keep visible, not center)

These remain real but are **downstream** of remapping:

| ID | Gap |
|----|-----|
| D-SEC-1 | Dual DomainController / emulateServer vs realServer (isolated stack ≠ host Library PSC) |
| D-SEC-2 | Fail-fast when `application ∉ map` (message should include application uuid + map keys) |
| D-SEC-3 | `duplicateApplicationModel` incomplete — replace/extend via T1∘T2 rather than paper over |
| D-SEC-4 | RTL / `tests-utils` browser pull — see companion analysis |
| D-SEC-5 | Server-owned `filesystemDeploymentRootDirectory` for B6-c real-server |

---

## 9. Suggested verification matrix (after T1∘T2)

| Scenario | Expected |
|----------|----------|
| Unit T1/T2 / composition (Vitest in miroir-core) | Green; Library golden paths stable |
| UI integ ephemeral + remapped Library | lend/return resolve `newApp → newDep`; Return Book inspector green |
| Live Library deployment on host | Untouched by ephemeral run |
| Create Application (realServer) | Still green; orthogonal path |
| Blind deploy of **unremapped** Library under new UUID | Must fail tests / preflight (guard: residual old uuid or empty T1 on non-empty model) |

---

## 10. Open questions (narrow)

1. **Deployment UUID:** always remap co-embedded deployment UUIDs in the same T2 pass, or separate transformer? (Recommendation: same pass, optional params.)  
2. **Input shape:** operate on `MetaModel` only, or also on raw asset forests / Persistence getState dumps? (Recommendation: MetaModel first; assets feed fixtures.)  
3. **Schema-first vs deep-scan-first:** start deep-scan golden tests on Library, then tighten with EntityDefinition-guided walks? (Recommendation: deep-scan + golden for T1-a…h, then schema-guided to reduce false negatives on new entity types.)

---

## 11. References

- Symptom log: `c:\Users\nono\Documents\tmp\logs.txt` (~21:08 preLendBookForReturn)  
- Persistence map lookup: `PersistenceReduxSaga.ts`  
- Partial rewrite: `duplicateApplicationModel` / `handleTransformer_duplicateApplicationModel` in `TransformersForRuntime.ts`  
- Library Endpoint nest: `…/212f2784-5b68-43b2-8ee0-89b1c6fdd0de.json`  
- Create Application map extend: `Runner_CreateApplication.tsx`  
- Ephemeral runTarget: `uiIntegrationTestLauncher.ts`, `RunnerTestRunTarget.ts`  
- Library MetaModel: `defaultLibraryAppModel` in `miroir-test-app_deployment-library`
