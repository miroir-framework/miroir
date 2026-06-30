# 198 — Composing tests using application-defined Actions

> Impact analysis of allowing application/deployment-defined `Action`s to participate in
> the `domainAction` / `actionTemplate` jzod types at runtime, and five candidate solutions.

Related issue: https://github.com/miroir-framework/miroir/issues/198

---

## 1. Problem restatement

`domainAction` (and everything that depends on it) is baked into the **generated**
`miroirFundamentalJzodSchema`. That generated schema only knows about **Miroir-defined**
actions. At runtime each deployed application can bring its *own* actions (e.g. the Library
app defines `lendDocument` / `returnDocument`), but those never make it into `domainAction`.

Consequence: a `MiroirTest` instance such as `runner_library`
(`b7e4a901-2c3d-4f5a-b6c7-8d9e0f1a2b3c`) that references `actionType: "lendDocument"` is
**ill-typed** against the schema, so the value-object editor reports a type error and gives
no editing help (no discriminated-union narrowing, no field hints, no default values).

### Why this is a runtime-only problem

- **Compile-time TS types** (`miroirFundamentalType.ts`) are irrelevant — TS types are not transpiled
  to runtime bundles, and application actions are not known when the types are generated. ✅ no action needed.
- **Runtime jzod schema** (`miroirFundamentalJzodSchema.ts`) *is* used at runtime, as the
  context for `jzodTypeCheck` / `resolveJzodSchemaReferenceInContext`. ❌ this is what must
  become application-aware.

---

## 2. How it works today

### 2.1 Build-time generation

`packages/miroir-core/scripts/generate-ts-types.ts` calls
`getMiroirFundamentalJzodSchema(...)`
(`packages/miroir-core/src/0_interfaces/1_core/bootstrapJzodSchemas/getMiroirFundamentalJzodSchema.ts`)
and freezes two artifacts:

- `preprocessor-generated/miroirFundamentalJzodSchema.ts` — the runtime jzod schema.
- `preprocessor-generated/miroirFundamentalType.ts` — the compile-time TS types.

Inside `getMiroirFundamentalJzodSchema`, `domainAction` is a discriminated union built from a
fixed list **plus** the Miroir domain endpoint's actions:

```2940:2985:packages/miroir-core/src/0_interfaces/1_core/bootstrapJzodSchemas/getMiroirFundamentalJzodSchema.ts
        domainAction: {
          type: "union",
          discriminator: "actionType",
          definition: [
            // instanceAction / modelAction / undoRedoAction / storeOrBundleAction ...
            ...domainEndpointVersionV1.definition.actions.map((e: Record<string, JzodElement>) => ({
              type: "object",
              definition: e.actionParameters,
            })),
          ],
        },
```

The **templated** form (`actionTemplate`) is a `schemaReference` to
`miroirTemplate_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainAction`, which is produced by the
"carry-on" transform over `domainAction`'s transitive dependency set:

```3447:3529:packages/miroir-core/src/0_interfaces/1_core/bootstrapJzodSchemas/getMiroirFundamentalJzodSchema.ts
  const domainAction = (... ).definition.context["domainAction"]
  const domainActionDependencySet = jzodTransitiveDependencySet(... "domainAction", true);
  const { ... } = getCarryOnSchemaBuilder(domainAction, domainActionDependencySet, ... "miroirTemplate_", ...);
  ...
        actionTemplate: {
          type: "schemaReference",
          definition: {
            absolutePath: miroirFundamentalJzodSchemaUuid,
            relativePath: "miroirTemplate_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainAction",
          },
        },
```

### 2.2 Eager dependents of `domainAction`

Anything that references `domainAction` transitively also "freezes" the Miroir-only action
set. The main ones:

| Schema key | Depends on | Used by |
|---|---|---|
| `domainAction` | (root) | direct action validation |
| `compositeAction` | `domainAction`, `compositeActionSequence`, `compositeRunTestAssertion` | composite actions |
| `compositeActionSequence` | domain endpoint actions | sequences |
| `miroirTemplate_…_domainAction` | carry-on(`domainAction`) | `actionTemplate` |
| `actionTemplate` | `miroirTemplate_…_domainAction` | **`MiroirTest` entity def** |
| `buildPlusRuntimeDomainAction` | carry-on(`domainAction`) | build+runtime actions |
| `buildPlusRuntimeCompositeAction` / `compositeActionTemplate` | `miroirTemplate_…_compositeActionSequence` | composite templates |

The `MiroirTest` entity definition (`51c647fe-07ec-411c-89cc-02689dc66d6a`) references
`actionTemplate` directly (x2), which is exactly the path the editor walks when a test is
opened — hence the error.

### 2.3 Where application actions already live at runtime

Application actions are **already available at runtime** in exactly the shape `domainAction`
needs. They are stored as `Endpoint` instances in the app model, e.g. the Library "Lending"
endpoint (`212f2784-5b68-43b2-8ee0-89b1c6fdd0de`) whose
`definition.actions[].actionParameters` is structurally identical to
`domainEndpointVersionV1.definition.actions[].actionParameters`.

The runtime carrier is `MiroirModelEnvironment`:

```13:19:packages/miroir-core/src/0_interfaces/1_core/Transformer.ts
export interface MiroirModelEnvironment {
  miroirFundamentalJzodSchema: MlSchema,
  miroirMetaModel?: MetaModel,
  endpointsByUuid: Record<Uuid, any>,
  currentModel: MetaModel,
  deploymentUuid?: Uuid,
};
```

`useCurrentModelEnvironment` (ReduxHooks) already assembles, per application/deployment, both
the (static) `miroirFundamentalJzodSchema` **and** `endpointsByUuid` (all app endpoints, with
their `actionParameters`). The editor's `jzodTypeCheck` call receives this environment. So the
two ingredients needed to extend `domainAction` are already co-located at the single most
relevant call site — they are simply never combined.

Precedent: `EndpointActionCaller.tsx` already reads per-endpoint `actionParameters` directly
to drive editing of a single action — proof that consuming app action schemas at runtime is
established practice.

---

## 3. Impact analysis (classified by necessity / breadth)

### Legend
- **Necessity**: MUST (required for the feature to work) · SHOULD (needed for correctness/quality) · OPTIONAL.
- **Breadth**: how much code is touched / blast radius.

### A. Make the runtime `domainAction` union application-aware — **MUST / narrow-deep**
Whatever the approach, the runtime resolution of `domainAction` must include the current
application's endpoint actions. Conceptually small (merge N `{type:"object", definition:
actionParameters}` members into one union) but **deep**: it sits on the hot path of every
typecheck/edit and must be correct w.r.t. discriminator (`actionType`) uniqueness.

### B. Make the templated `actionTemplate` application-aware — **MUST / wide-deep**
This is the hard part. `actionTemplate` is not `domainAction`; it is the **carry-on
transformed** `miroirTemplate_…_domainAction`. Application actions therefore need the *same*
carry-on transform applied (so every leaf accepts `coreTransformerForBuildPlusRuntime`). This
pulls in `getCarryOnSchemaBuilder` / `applyLimitedCarryOnSchemaOnLevel` /
`createLocalizedInnerResolutionStoreWithCarryOn` at runtime, or a cheaper equivalent. Highest
complexity item.

### C. Schema-context lifecycle / caching — **SHOULD / medium**
The extended schema depends on `(deploymentUuid, app model version)`. We need a well-defined
place to build it and a cache keyed on the app/model so we don't rebuild on every keystroke.
Natural home: `MiroirModelEnvironment` construction (`useCurrentModelEnvironment`,
`MiroirContext`, and the non-React builders in `Library.ts`, `runMiroirTestSuiteInProcess`,
`DomainController`, server/cli/mcp setups).

### D. Consumers of `MiroirModelEnvironment.miroirFundamentalJzodSchema` — **SHOULD / wide**
~50 files reference `miroirFundamentalJzodSchema`. Most read it via the environment and would
transparently benefit. The ones that must be audited are those that **construct** the
environment (so they inject the extended schema) and those that bypass the environment and
import the static schema directly (e.g. `Model.ts` defaults, MCP/CLI/server setup,
`jzodElementToJsonSchema`). Read-only consumers (display, grids) need no change.

### E. Action **execution / validation** path — **SHOULD / medium**
The same Miroir-only limitation exists wherever an action payload is validated against
`domainAction` before execution (DomainController / Runner / composite action runners). If
runtime validation of app actions is currently lenient, editing is the only visible failure;
if/when validation tightens, the same extended schema must be used there too. Worth confirming
to avoid fixing the editor while leaving execution validation blind.

### F. Build-time generation (`getMiroirFundamentalJzodSchema`) — **OPTIONAL / contained**
To avoid duplicating logic, the runtime extension should ideally **reuse** the exact union/
carry-on construction that build-time uses. That argues for extracting the
"`actions → domainAction` union" and "`domainAction → actionTemplate` carry-on" steps into
shared, parameterizable helpers callable from both build-time and runtime. Contained to the
`bootstrapJzodSchemas/*` files.

### G. Correctness hazards — **SHOULD / cross-cutting**
- **Discriminator collisions**: an app action whose `actionType` clashes with a Miroir action.
- **Cross-application editing**: `useCurrentModelEnvironment` already merges endpoints from
  *all* apps in `applicationDeploymentMap` — decide whether `domainAction` should include all
  of them or only the test's `runTarget` application.
- **Stale cache** after model edits (adding/removing an app endpoint must invalidate).
- **Performance**: carry-on transform is the dominant cost in build-time generation; doing it
  naively per-edit is unacceptable.

### H. Tests & fixtures — **SHOULD / medium**
`modelValidation.unit.test.ts` per deployment, runner/library integ tests, and editor tests
should gain a case proving an app-action MiroirTest type-checks. `runner_library` is the
ready-made fixture.

---

## 4. Five candidate solutions

Each solution answers two questions: (1) where does the extended `domainAction` come from, and
(2) how is `actionTemplate` (the carry-on form) handled.

---

### Solution 1 — Full runtime regeneration of the fundamental schema per deployment

Run the existing `getMiroirFundamentalJzodSchema` machinery at runtime, passing a
`domainEndpoint`-like structure whose `actions` = Miroir actions **+** the current app's
endpoint actions. Cache the result per `(deploymentUuid, modelVersion)` and store it in
`MiroirModelEnvironment.miroirFundamentalJzodSchema`.

- **Pros**
  - Maximum fidelity: `domainAction`, `actionTemplate`, `compositeAction(Template)`,
    `buildPlusRuntime*` all become app-aware with **zero** behavioural divergence from build-time.
  - Single source of truth; no second code path to keep in sync.
- **Cons**
  - `getMiroirFundamentalJzodSchema` is heavy (the carry-on phases dominate build time, ~seconds);
    unacceptable on the edit hot path without aggressive caching, and even cached the first open
    of an app is slow.
  - Function currently takes ~30 entity-definition/endpoint arguments — needs to be runtime-callable
    (bundle size, imports of `miroir-test-app_deployment-*`).
  - Largest memory footprint (a full schema per deployment).

---

### Solution 2 — Targeted runtime extension: rebuild only `domainAction` + its `actionTemplate` (carry-on) subtree

Keep the static schema; at environment-build time produce a small **overlay context** that
replaces just `domainAction` (union + app actions) and regenerates only the
`miroirTemplate_…_domainAction` (and the few dependent template keys) via the existing
`getCarryOnSchemaBuilder`, reusing already-converted references from the static schema. Merge
the overlay into `miroirFundamentalJzodSchema.definition.context`.

- **Pros**
  - Correct `actionTemplate` (true carry-on), far cheaper than Solution 1 (only the action
    subtree is recomputed; the bulk of templates are reused).
  - Reuses existing, battle-tested helpers — minimal new logic, low divergence risk.
  - Naturally cacheable per app; localized blast radius (env builders only).
- **Cons**
  - Still runs carry-on at runtime → needs caching + invalidation; non-trivial first-build cost.
  - Requires extracting/parameterizing the "domainAction union + carry-on" steps so they can be
    called outside the giant generator (refactor of `bootstrapJzodSchemas/*`).
  - Must carefully thread `convertedReferences` to avoid double-conversion bugs.

**Recommended default** — best correctness/cost balance.

---

### Solution 3 — Lazy union extension via a resolver hook (no template regeneration)

Don't pre-build anything. Teach the resolution layer (`jzodTypeCheck` /
`resolveJzodSchemaReferenceInContext`) that when it resolves `domainAction` (or
`miroirTemplate_…_domainAction`) it should append the current environment's app-endpoint
actions to the union on the fly. For the templated case, wrap each appended app action with the
carry-on reference (`coreTransformerForBuildPlusRuntime`) at leaf level using a lightweight
"templatize" helper instead of the full builder.

- **Pros**
  - No schema duplication, no cache to invalidate — always reflects the live model.
  - Smallest memory footprint.
  - Change concentrated in the resolver, transparent to ~all consumers.
- **Cons**
  - Touches the **hot path** of every resolution → must be very cheap and memoized per call.
  - The lightweight "templatize" risks **diverging** from the real carry-on transform (subtle
    template-mode bugs) unless carefully unit-tested against build-time output.
  - More invasive in the most delicate, hardest-to-test core module (`jzodTypeCheck`).
  - Implicit coupling between resolver and `MiroirModelEnvironment.endpointsByUuid`.

---

### Solution 4 — Per-application precompiled action schema bundles (build/deploy artifact)

Treat an application's action schemas like Miroir's: at app build/deploy time, generate and
store (in the app model, alongside endpoints) the app's `domainAction` fragment **and** its
carry-on `actionTemplate` fragment. At runtime just merge these precompiled fragments into the
context (pure object spread, no transform).

- **Pros**
  - Runtime cost is trivial (merge only) — fast edits, no carry-on at runtime.
  - Correct templates (computed by the real builder at build time).
  - Symmetric with how Miroir itself is built — conceptually clean.
- **Cons**
  - Adds an **app build/deploy step** and a new persisted artifact that can drift from the
    endpoints it derives from (needs regeneration discipline / CI check).
  - Requires schema/storage changes and migration for existing app models.
  - Doesn't help ad-hoc/just-added actions until regenerated (worse DX during authoring).
  - More moving parts across packages (core + each app deployment + tooling).

---

### Solution 5 — Editor-scoped relaxation + endpoint-driven action editing (pragmatic, partial)

Don't change `domainAction` resolution globally. Instead, where a value is typed as
`domainAction` / `actionTemplate`, have the editor detect `actionType` and look up the matching
endpoint `actionParameters` from `endpointsByUuid` (exactly like `EndpointActionCaller`),
using that as the effective schema for that node; treat unknown `actionType`s as a permissive
`any`-ish object instead of an error.

- **Pros**
  - Smallest, lowest-risk change; no core resolver / generator changes.
  - Immediately removes the editor error and gives real field-level help via endpoint params.
  - Reuses an existing, proven pattern.
- **Cons**
  - Fixes only the **editor**; programmatic `jzodTypeCheck`/validation elsewhere stays blind to
    app actions (execution validation, MCP, CLI, server).
  - `actionTemplate` (carry-on) still not truly modelled — template-mode editing of app actions
    remains approximate.
  - Special-case logic in the editor (more UI complexity, another place that must understand
    actions), risks divergence from canonical schema semantics.

---

## 5. Comparison & recommendation

| Solution | Correctness (`actionTemplate`) | Runtime cost | Blast radius | DX for new actions | Risk |
|---|---|---|---|---|---|
| 1 Full regen | ★★★ | ✗ high | wide | good (live) | medium |
| **2 Targeted rebuild** | ★★★ | ◐ medium (cached) | medium | good (live) | medium-low |
| 3 Lazy resolver hook | ★★ | ◐ hot-path | core-narrow | good (live) | medium-high |
| 4 Precompiled bundles | ★★★ | ★ trivial | wide | poor (needs regen) | medium |
| 5 Editor relaxation | ★ | ★ trivial | narrow (UI) | good (live) | low |

**Recommendation:**
- **Short term / unblock the issue:** Solution **5** (editor-scoped, endpoint-driven) to make
  `runner_library` editable now with low risk.
- **Proper fix:** Solution **2** (targeted runtime rebuild of `domainAction` + its carry-on
  subtree), built on extracted/shared helpers so build-time and runtime stay in lockstep, with
  per-`(deployment, modelVersion)` caching and invalidation in the `MiroirModelEnvironment`
  builders. This is the only option that fixes editing **and** validation everywhere without the
  ongoing drift cost of Solution 4 or the hot-path/divergence risk of Solution 3.

A reasonable path is to ship 5, then evolve to 2 (5 becomes redundant once 2 lands, or can
remain as the unknown-`actionType` fallback).

---

## 6. Key code references

- Schema generator: `packages/miroir-core/src/0_interfaces/1_core/bootstrapJzodSchemas/getMiroirFundamentalJzodSchema.ts`
  - `domainAction` union: ~L2940–2985
  - `actionTemplate` / carry-on: ~L3447–3529
- Carry-on helpers: `packages/miroir-core/src/0_interfaces/1_core/bootstrapJzodSchemas/getMiroirFundamentalJzodSchemaHelpers.ts` (`getCarryOnSchemaBuilder`, `createLocalizedInnerResolutionStoreWithCarryOn`)
- Build-time entrypoint: `packages/miroir-core/scripts/generate-ts-types.ts`
- Generated runtime schema: `packages/miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalJzodSchema.ts`
- Runtime carrier: `packages/miroir-core/src/0_interfaces/1_core/Transformer.ts` (`MiroirModelEnvironment`)
- Env builders: `packages/miroir-standalone-app/src/miroir-fwk/4_view/ReduxHooks.ts` (`useCurrentModelEnvironment`), `packages/miroir-core/src/1_core/Model.ts` (defaults), `packages/miroir-test-app_deployment-library/src/Library.ts`
- Editor typecheck call: `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/TypedValueObjectEditor.tsx` (`jzodTypeCheck`)
- Core typecheck: `packages/miroir-core/src/1_core/jzod/jzodTypeCheck.ts`
- Precedent (endpoint-driven action UI): `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/EndpointActionCaller.tsx`
- Failing fixture: `packages/miroir-test-app_deployment-library/assets/library_model/a311f363-e238-4203-bdfc-29e8c160c26b/b7e4a901-2c3d-4f5a-b6c7-8d9e0f1a2b3c.json`
- App action source: `packages/miroir-test-app_deployment-library/assets/library_model/3d8da4d4-8f76-4bb4-9212-14869d81c00c/212f2784-5b68-43b2-8ee0-89b1c6fdd0de.json`
- MiroirTest entity def (references `actionTemplate`): `packages/miroir-test-app_deployment-miroir/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/51c647fe-07ec-411c-89cc-02689dc66d6a.json`
