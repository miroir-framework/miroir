# Issue #502 — TDD Implementation Plan

> Vertical TDD slices (RED → GREEN each), integration-first per `docs/contributing/testing.md`.
> Registry, union and renaming are pure miroir-core functions tested with `fn.*` MiroirTest cases;
> the define block and Save with `ui.blockEditing` component cases over the real TransformerEditor.
> No mocks.
>
> **Execution model:** one green commit per slice, pushed to the working branch. Each slice ends
> with its Validation commands; on success its Realization is appended and its Status flips to ✅.

Analysis: [`./analysis.md`](./analysis.md) (parent issue #497, G5, D9, §4.7, §6.1 row #502) · Issue: https://github.com/miroir-framework/miroir/issues/502
Working branch: `claude/502-block-editor-define-blocks`

**Resume note:** plan written 2026-10-07 from `_integration` at `3b1e676` (#501 merged).

---

## Scope

- **G5 — Reuse my transformers.** A composite TransformerDefinition is a define block; a transformer is saved as a new TransformerDefinition and found in the palette, then used in another transformer, which evaluates.
- **D9 — The registry first.** Wherever the stock map `applicationTransformerDefinitions` is read, the current application's TransformerDefinitions are read too.

## What the code does today (survey, 2026-10-07)

| Reader | Today | Gap |
|---|---|---|
| Runtime `transformer_extended_apply` (TransformersForRuntime.ts:3956) | static map; `modelEnvironment` in scope | does not read `currentModel.transformerDefinitions` |
| Client model `selectModelForDeploymentFromReduxState` (localcache-redux LocalCacheSliceModelSelector.ts:460, zustand :501) | `transformerDefinitions: []` hard-coded | the UI never sees an application's TransformerDefinitions; the non-hook `currentModel()` (localcache-redux Model.ts:296, :390) does fill them |
| Form union `coreTransformerForBuildPlusRuntime` | generated from the static `miroirCoreTransformers` names (getMiroirFundamentalMlSchema.ts:1033-1080) | an application composite fails the form's type check, is not in the transformerType select, the palette (`transformerUnionTypes`) nor `defaultTransformerNode` |
| Precedent | `buildExtendedSchema` (1_core/mls/schemaForDeployment.ts:129) adds application Endpoint actions to `domainAction` per deployment | the same mechanism can add composite branches |
| Checks, #88 inference, block model, tree edits | take a `transformerDefinitions` parameter, defaulting to the static map | callers in the editor pass nothing |
| Editor preview, BlockResult, BlockPalette, BlockEditing | `defaultMiroirModelEnvironment` | must use the editor application's environment |
| Postgres `sqlStringForRuntimeTransformer` (SqlGenerator.ts:5965) | static map; composites already translated (`case "transformer"`) | no model parameter; `sqlStringForQuery` has `modelEnvironment` one level up; DomainController drops `currentModel` before the persistence store (DomainController.ts:1097, :1148) |
| miroir-server (RestServer.ts:454, :542, :607, :637) | `defaultMiroirModelEnvironment` on every entry point ("TODO: get the right model for the app / deployment") | no per-application environment on the server at all |
| Component tests (`runReactComponentTest.tsx:210-219`) | stub DomainController, no TransformerDefinitions | `wireLocalCacheCompositeAction` exists in `buildComponentTestWrapper` but the MiroirTest runner never sets it; no way to load extra instances |

---

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Registry; the runtime runs an application composite | ✅ | `fn.transformer.registry` |
| 1 | The client model carries the application's TransformerDefinitions | ⬜ | localcache unit tests |
| 2 | The deployment schema has a branch per application composite | ⬜ | `fn.transformer.registry` union cases |
| 3 | The editor and the block view read the registry | ⬜ | `ui.blockEditing` composite case |
| 4 | Postgres reads the registry | ⬜ | SqlGenerator unit case |
| 5 | Define block | ⬜ | `fn.blockModel` define cases, `ui.blockEditing` |
| 6 | Parameters: add, rename, remove | ⬜ | `fn.transformer.treeEdit` rename cases (AC 2) |
| 7 | Save as TransformerDefinition; palette; use (runner option) | ⬜ | `ui.blockEditing` save case (AC 1) |
| 8 | Docs, nonreg, AC | ⬜ | nonreg, AC checklist |

---

## Locked implementation defaults

| Decision | Choice | Serves |
|---|---|---|
| Registry | `transformerDefinitionRegistry(modelEnvironment)` in `2_domain/TransformerDefinitionRegistry.ts`: the stock map, plus the composite TransformerDefinitions of `currentModel.transformerDefinitions` by `name`. A stock name wins: an application definition named like a stock transformer is left out and reported by `transformerDefinitionRegistryConflicts`. Only `transformerImplementationType: "transformer"` application definitions are added: a library implementation needs code the application cannot bring. Memoized per `currentModel` object (a WeakMap), as models are immutable state. | D9 |
| Runtime | `transformer_extended_apply` looks the type up in the registry of its `modelEnvironment`. Nested composites see it, as the environment is forwarded. | D9 |
| Client model | `selectModelForDeploymentFromReduxState` (redux and zustand) fills `transformerDefinitions` like `themes`: the `data` section for Miroir, `model` otherwise. | D9 |
| Union | `buildExtendedSchema` also adds one branch per application composite to `coreTransformerForBuildPlusRuntime` (and its `WithoutArray` twin): an object with the literal `transformerType`, optional `interpolation` and `label`, and the parameters of `transformerParameterSchema.transformerDefinition`. Deployments resolve their schema in `"auto"` mode already (`resolveFundamentalSchemaForDeployment`), so the form, the transformerType select, `transformerUnionTypes`, the palette and `defaultTransformerNode` follow. | D9, issue "the form … accepts registry types" |
| Editor | The TransformerEditor takes `useCurrentModelEnvironment(editorApplication, map)`; `BlockRunInput` carries it, and the block view, the walk, the preview and the result bubble use it and its registry instead of the defaults. | D9 |
| Postgres | `sqlStringForRuntimeTransformer` reads `transformerDefinitions` from an optional trailing argument (default: the stock map), passed down by the helpers; `sqlStringForQuery` and `sqlStringForExtractor` give the registry of their `modelEnvironment`. DomainController forwards `currentModel` to the persistence store (the saga methods already take it). | D9 |
| Server | **Out of this issue.** miroir-server runs every action with `defaultMiroirModelEnvironment`; giving it a per-application environment changes every entry point. Filed as a separate issue; until it lands, a saved composite runs in the client's local cache and in Postgres only where the client's environment reaches the store. | D9 (scope cut, to confirm with A) |
| Define block | A composite TransformerDefinition value gets a `define` block: header `define <name>` with one chip per parameter; body = the block of `transformerImplementation.definition`. Every node of the body is evaluated at runtime: no build mark inside a define body (analysis D1-b). Shown wherever the value editor shows a TransformerDefinition (its Report's instance editor) and in the TransformerEditor's "defined" mode. | issue bullet 1 |
| Parameters | `renameTransformerParameter(definition, from, to)` renames the key in `transformerParameterSchema.transformerDefinition.definition` and rewrites every `getFromContext` reading `from` (by `referenceName`, or `referencePath[0]`) where `from` is the parameter, not a name bound below it (`transformerEnvironmentAt` shadowing: a `referenceToOuterObject`, a dataflow step or `aggregateValue` of that name). Add gives a parameter of type `any`; remove refuses while the body reads it. | issue bullet 2, AC 2 |
| Save | "Save as TransformerDefinition" in the TransformerEditor: a dialog asks the name; the parameters are the free context names the transformer reads (not bound inside it), typed from the editor's input type for `defaultInput`, `any` otherwise; `transformerResultSchema` from #88 (`resolveTransformerResultSchema`). The instance is created in the editor application's model section with a `transactionalInstanceAction` `createInstance`, then `commit`. | issue bullet 3 |
| Runner option | `reactComponentTestSuite` gets two optional fields: `wireLocalCacheCompositeAction` (boolean) and `localCacheInstances` (instances to load, by application, section and Entity). `runReactComponentTest` passes them to `buildComponentTestWrapper`, which loads them after Miroir and the Library. | AC 1, analysis §4.7 |

---

## Slice 0 — Registry; the runtime runs an application composite

RED: new off-page `fn.transformer.registry`: the registry of an environment whose `currentModel` holds a composite has it next to the stock ones; a library implementation or a stock name is left out (conflict reported); `transformer_extended_apply_wrapper` runs a transformer using the composite with a parameter, and fails with `TransformerNotFound` without it. GREEN: `TransformerDefinitionRegistry.ts`, runtime lookup.

Validation: `npm run testMiroir -w miroir-core -- --suites fn.transformer.registry --mode unit`; `npm run test -w miroir-core -- ''`.

**Realization (2026-10-07).** `TransformerDefinitionRegistry.ts` exports `transformerDefinitionRegistry(modelEnvironment)` (kept per model object in a WeakMap), `transformerDefinitionRegistryOf(definitions)`, `applicationCompositeTransformerDefinitions` and `transformerDefinitionRegistryConflicts` (a stock name held by a definition of another uuid; Miroir's own stored stock definitions are not conflicts). `transformer_extended_apply` reads the registry of its environment. `fn.transformer.registry` (`e98bad15-…`, off the page) has 7 cases; the runtime case fails with the static lookup restored. An unknown composite fails as `FailedTransformer` wrapping `TransformerNotFound`.

## Slice 1 — The client model carries the application's TransformerDefinitions

RED: localcache-redux and localcache-zustand model selector tests: a deployment whose model section holds a TransformerDefinition gives it in `transformerDefinitions`. GREEN: the selectors.

## Slice 2 — The deployment schema has a branch per application composite

RED: `fn.transformer.registry` cases on `resolveFundamentalSchemaForDeployment` / `transformerUnionTypes`: the composite is a branch with its parameters; `defaultTransformerNode` gives its default node. GREEN: `buildExtendedSchema`.

## Slice 3 — The editor and the block view read the registry

RED: `ui.blockEditing` over the runner option (slice 7's option, built here first): with a composite loaded in the Library model, the palette lists it, a block of it shows its parameters as rows, and its result bubble shows its value. GREEN: the editor environment through `BlockRunInput`; palette, candidates, defaults, block tree, walk, preview and bubble on it.

## Slice 4 — Postgres reads the registry

RED: SqlGenerator unit case: a runtime transformer using an application composite translates with the registry and fails with `QueryNotExecutable` without it. GREEN: the trailing argument and the DomainController forwarding.

## Slice 5 — Define block

RED: `fn.blockModel` "a composite TransformerDefinition is a define block with its parameters and its body"; `ui.blockEditing` "the defined mode shows the define block, no build mark in the body". GREEN: block model and view.

## Slice 6 — Parameters

RED: `fn.transformer.treeEdit` `renameTransformerParameter`: references follow, a shadowed name does not, `referencePath` heads follow (AC 2); add and remove. GREEN: the functions and the header actions.

## Slice 7 — Save as TransformerDefinition

RED: `ui.blockEditing` (AC 1): build a transformer, save it as `bookTitle`, find it in the palette, use it in another transformer, the result bubble shows the expected value. GREEN: the Save dialog and action.

## Slice 8 — Docs, nonreg, AC

`docs/reference/transformers.md` gets define blocks, Save and the registry; file the server issue; `nonreg:filesystem`, Postgres nonreg for slice 4; AC check.
