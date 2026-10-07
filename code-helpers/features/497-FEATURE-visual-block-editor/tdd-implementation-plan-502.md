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
| 1 | The client model carries the application's TransformerDefinitions | ✅ | localcache unit tests |
| 2 | The deployment schema has a branch per application composite | ✅ | `fn.transformer.registry` union cases, `schemaForDeployment.unit.test.ts` |
| 3 | The editor and the block view read the registry | ✅ | `ui.blockEditing` composite case |
| 4 | Postgres reads the registry | ➡️ moved to the server issue (A, 2026-10-07) | — |
| 5 | Define block | ✅ | `fn.transformer.registry` header case, `ui.blockEditing` defined-mode case |
| 6 | Parameters: add, rename, remove | ✅ | `fn.transformer.registry` "define block parameters" (AC 2), `ui.blockEditing` rename |
| 7 | Save as TransformerDefinition; palette; use (runner option) | ✅ | `ui.blockEditing` save case (AC 1) |
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
| Server | **Out of this issue.** miroir-server runs every action with `defaultMiroirModelEnvironment`; giving it a per-application environment changes every entry point. Filed as a separate issue; until it lands, a saved composite runs in the client's local cache and in Postgres only where the client's environment reaches the store. | D9 (scope cut, A chose "Separate issue" on 2026-10-07, with slice 4) |
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

Validation: `npx vitest run` in `packages/miroir-localcache-redux` and `packages/miroir-localcache-zustand`; their `tsc`.

**Realization (2026-10-07).** Both packages get `selectTransformerDefinitionsFromReduxState`, read like the themes (`data` section for Miroir, `model` otherwise), and `selectModelForDeploymentFromReduxState` fills `transformerDefinitions` with it. `selectModelForDeployment.transformerDefinitions.unit.test.ts` (2 cases per package) failed before the change. The 6 custom `idAttribute` failures of the redux `LocalCache.unit.test.ts` fail on `_integration` too.

## Slice 2 — The deployment schema has a branch per application composite

RED: `fn.transformer.registry` cases on `resolveFundamentalSchemaForDeployment` / `transformerUnionTypes`: the composite is a branch with its parameters; `defaultTransformerNode` gives its default node. GREEN: `buildExtendedSchema`.

Validation: `npm run testMiroir -w miroir-core -- --suites fn.transformer.registry --mode unit`; `npx vitest run tests/1_core/schemaForDeployment.unit.test.ts` in miroir-core; `npm run lint`.

**Realization (2026-10-07).** `applicationTransformerBranches(definitions)` (registry module) builds one branch per application composite, named `applicationTransformerForBuildPlusRuntime_<name>`, with `transformerInterfaceFromDefinition` as the stock branches are. `buildExtendedSchema` adds them to the context and to both transformer unions (`coreTransformerForBuildPlusRuntime` and its `WithoutArray` twin), for any application but Miroir, with or without app endpoints. The app schema revision now fingerprints the TransformerDefinitions (uuid, name, interface, implementation type), so saving a composite reloads the schema. `schemaForDeployment.ts` moved from `1_core/mls/` to `2_domain/` (`git mv`): it now reads the registry, and the layer rule forbids 1_core from importing 2_domain; its only 1_core caller, `Model.ts`, asked for the static schema and now takes `miroirFundamentalMlSchema` directly. Tests: 2 `fn.transformer.registry` cases (9 in all) and 5 `schemaForDeployment.unit.test.ts` cases (branch in both unions with its parameters; `transformerUnionTypes` and `defaultTransformerNode`; no branch for a library implementation or a stock name; Miroir stays static; the revision changes); the 3 positive cases failed before the change.

## Slice 3 — The editor and the block view read the registry

RED: `ui.blockEditing` over the runner option (slice 7's option, built here first): with a composite loaded in the Library model, the palette lists it, a block of it shows its parameters as rows, and its result bubble shows its value. GREEN: the editor environment through `BlockRunInput`; palette, candidates, defaults, block tree, walk, preview and bubble on it.

Validation: `npm run testMiroir -w miroir-standalone-app -- --suites ui.blockEditing --mode unit`; the whole `miroir-component-tests.unit.test.tsx`; `npm run test -w miroir-core -- ''`; `npm run lint`.

**Realization (2026-10-07).** The runner option: `reactComponentTestSuite` has `wireLocalCacheCompositeAction` and `localCacheInstances` (MiroirTest ML schema, types regenerated), the walk passes them in the suite context, and `buildComponentTestWrapper` loads the instances with the Miroir or Library load (a load of their own would be dropped by the rollback). `TransformerEditorForTest` reads the deployment map of the context, which holds the Library when the suite wires the local cache. The editor: the TransformerEditor takes `useCurrentModelEnvironment(editorApplication)` in place of `useCurrentModel` (same hook count in the render callback) and runs its preview on it; `BlockRunInput.modelEnvironment` carries it to the block view, where `useBlockModelEnvironment` gives the environment and its registry to the palette, the block tree, the tray, the result bubble, the defaults, the insert positions, the tree edits and the #249 walk. The node actions (`TransformerNodeActions`, form and blocks) take `transformerDefinitions`; the form's `MlLiteralEditor` passes the registry of its own environment. In core, functions that take a model environment default their definitions to its registry (`transformerBlockTree`, `transformerPaletteGroups`, `defaultTransformerNode`, `keepAttributesOnTypeChange`). Test: suite "TransformerEditor on an application with a composite" in `ui.blockEditing` (Library, `bookTitle` with a transformer parameter `book`): the palette has it, Replace with gives a block whose `book` is a slot, the bubble shows the composite's value, the JSON is the composite node. It failed at the palette before the wiring. 173 component leaves.

## Slice 4 — Postgres reads the registry

RED: SqlGenerator unit case: a runtime transformer using an application composite translates with the registry and fails with `QueryNotExecutable` without it. GREEN: the trailing argument and the DomainController forwarding.

**Moved out (2026-10-07).** A chose to leave the server side out of #502; the Postgres translation of composites goes with it into the server issue, as both need the application's model where the store runs. Today the SqlGenerator refuses an application composite with `QueryNotExecutable` ("transformerType not found in applicationTransformerDefinitions"), which is the explicit error the issue asks for.

## Slice 5 — Define block

RED: `fn.blockModel` "a composite TransformerDefinition is a define block with its parameters and its body"; `ui.blockEditing` "the defined mode shows the define block, no build mark in the body". GREEN: block model and view.

## Slice 6 — Parameters

RED: `fn.transformer.treeEdit` `renameTransformerParameter`: references follow, a shadowed name does not, `referencePath` heads follow (AC 2); add and remove. GREEN: the functions and the header actions.

**Realization, core (2026-10-07).** `2_domain/TransformerDefinitionEdit.ts`: `contextNameReadPaths`, `freeContextNames`, `renameContextName`, `transformerDefinitionParameters`, `addTransformerParameter`, `renameTransformerParameter` (in place, so the parameter order is kept), `removeTransformerParameter` (refused while read) and slice 7's `compositeTransformerDefinition`. A read is a `getFromContext` outside a `returnValue`'s `value`; it sees the parameter unless `transformerEnvironmentAt` binds the same name above it. The cases are in `fn.transformer.registry`, suite "define block parameters" (registered under `miroir-core/2_domain/TransformerDefinitionEdit`), not in `fn.transformer.treeEdit`, as they edit a TransformerDefinition rather than a tree. Turning `isShadowed` off fails 2 of them.

## Slice 7 — Save as TransformerDefinition

RED: `ui.blockEditing` (AC 1): build a transformer, save it as `bookTitle`, find it in the palette, use it in another transformer, the result bubble shows the expected value. GREEN: the Save dialog and action.

**Realization, slices 5 to 7 (2026-10-07).** The define header: `BlockDefineContext` (`BlockViewMode.tsx`) carries the name, the parameters with their read flags (`transformerDefinitionParameterUses`) and the add, rename and remove changes; `BlockEditorView` shows `BlockDefineHeader` above the root block of the field it names, adds the parameters to the context names of the root (the palette, the insert targets and Replace with offer them), and marks no block build. A header parameter is armed or dragged like a palette variable. The TransformerEditor's `TransformerDefinitionEditor` gives the context in "defined" mode for a composite: a draft of the definition, keyed by uuid, holds the parameter changes; a rename also writes the body. `TransformerDefinitionSave.tsx`: Save as TransformerDefinition (name typed in place, `compositeTransformerDefinition`, `createInstance` in a `transactionalInstanceAction` for a model section) and, in defined mode, Save `<name>` (`updateInstance`, result schema inferred again). The define header is shown in the TransformerEditor only, not in the Report instance editor of a TransformerDefinition (left out: its parameters are in a sibling field of the form).

Two bugs found on the way, both in defined mode for an application: `getApplicationSection` sent an application's TransformerDefinitions to the data section, as the TransformerDefinition Entity is not in the meta-model's entity list, so the transformer select listed none and `useTransformer` fetched none (now `model`, `fn.transformer.registry` cases); `useTransformer` built its query once, without `transformerUuid` and `application` in the memo dependencies, so a transformer chosen after mount was never fetched. Tests: `ui.blockEditing` suite "TransformerEditor on an application with a composite", cases "a transformer saved as a TransformerDefinition is in the palette, and a transformer using it runs it" (AC 1) and "a composite in defined mode is a define block; renaming its parameter renames its reads, and Save keeps it". 175 component leaves.

## Slice 8 — Docs, nonreg, AC

`docs/reference/transformers.md` gets define blocks, Save and the registry; file the server issue; `nonreg:filesystem`, Postgres nonreg for slice 4; AC check.

**Realization (2026-10-07).** Docs: "Composite TransformerDefinitions: define blocks and Save" in `docs/reference/transformers.md`. The server side and the Postgres translation of composites are #519.

**Review of PR #520 (2026-10-07).** Greptile's six findings were real, all fixed. (1) A fresh application had no TransformerDefinition collection in its model store, so committing a saved composite failed: `appModelInitializeCreateEntityOrder` creates it, and `PersistenceStoreController.upsertInstance` creates it on the first save for an application initialized before (`persistenceStoreController.sections.unit.test.ts`). (2) A rename into a name bound where the parameter is read is refused. (3) The tags of a runtime `mustacheStringTemplate` are context reads: free names, read flags and renames include them. (4) `transformerType`, `interpolation` and `label` cannot name a parameter. (5) The parameter draft is dropped when another definition is chosen, during render (`ui.blockEditing` "an unsaved parameter rename is dropped when another definition is chosen"). (6) `compositeTransformerDefinition` infers the result from the declared parameter types, `any` for a slot, and falls back to all `any`. 9 `fn.transformer.registry` cases, 176 component leaves.

