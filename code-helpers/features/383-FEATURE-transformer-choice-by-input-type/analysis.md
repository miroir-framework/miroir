# 383 — Restrict transformer choice by input type, recursively

> Analysis: extend the #249 `inputOutput` adequacy check from the outermost transformer to every
> nested transformer, and use the per-position input types to filter the `transformerType` select
> of the TransformerEditor and of the list transformer panel.

Related issue: https://github.com/miroir-framework/miroir/issues/383
Builds on: #249 ✅ (`inputOutput` types, root-only check, D5 "outermost only" lifted here) · #88 ✅ (`resolveTransformerResultSchema`, output inference)
Related analyses: [`../249-FEATURE-typed-transformer-interface/analysis.md`](../249-FEATURE-typed-transformer-interface/analysis.md), [`../88-FEATURE-typed-transformers/tdd-implementation-plan.md`](../88-FEATURE-typed-transformers/tdd-implementation-plan.md)
Grilling record: `/mnt/project-files/issue-383/grilling-round-1.md` (project files, 2026-10-02)

Key sources:
- [`packages/miroir-core/src/2_domain/TransformerInterfaceCheck.ts`](../../../packages/miroir-core/src/2_domain/TransformerInterfaceCheck.ts) (#249 relation and root check)
- [`packages/miroir-core/src/2_domain/TransformerInterfaceInference.ts`](../../../packages/miroir-core/src/2_domain/TransformerInterfaceInference.ts) (#88 schema → `InputOutputType`)
- [`packages/miroir-core/src/2_domain/TransformersForRuntime.ts`](../../../packages/miroir-core/src/2_domain/TransformersForRuntime.ts) (runtime input binding)
- [`packages/miroir-standalone-app/src/miroir-fwk/4_view/components/ValueObjectEditor/MlLiteralEditor.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/ValueObjectEditor/MlLiteralEditor.tsx) (`transformerType` select)
- [`packages/miroir-standalone-app/src/miroir-fwk/4_view/components/TransformerEditor/TransformerEditor.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/TransformerEditor/TransformerEditor.tsx)
- [`packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ListTransformerPanel.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ListTransformerPanel.tsx)

**Document role:** analysis and architectural decision record.
**Status:** decisions confirmed with the user in the grilling (2026-10-02). TDD plan: [`tdd-implementation-plan.md`](./tdd-implementation-plan.md).

---

## 1. Goals

- **G1 — Only sensible choices.** In order to build transformers without trial and error, as a transformer designer, I can pick a transformer type at any position of a transformer and see only the types that accept the input that position receives.
- **G2 — Mismatches visible where they are.** In order to fix a transformer quickly, as a transformer designer, I can see which nested transformer does not accept its input, marked at its own nesting level.
- **G3 — Escape hatch.** In order to work around a wrong or missing type declaration, as a transformer designer, I can turn the restriction off in the TransformerEditor and get the full list back.

## 2. Non-goals

- Filtering on the expected output type (later, unscheduled).
- Using full ML schemas for the accepted input or the restriction (the end goal after #88; later issue).
- Restricting in Query, Report and Endpoint editors, where the root input is unknown (later; the core functions are reusable there).
- Changing the #251 ML-schema check (`TransformerMlSchemaCheck.ts`): untouched.
- Tightening `inputOutput` declarations of stock transformers (backlog from #88).

## 3. Decision record

| Decision | Choice | Serves |
|---|---|---|
| D1 — Input that restricts a position | **The node's own `applyTo` output when it has one, else the input its slot provides** | G1, G2 |
| D2 — Compatibility relation | **#249 `inputOutputTypesCompatible` on `InputOutputType` values**; no relation to #251 | G1, G2 |
| D3 — Editors that restrict | **TransformerEditor and ListTransformerPanel** | G1 |
| D4 — Off switch | **TransformerEditor only**, state in `ToolsPageState.transformerEditor`; ListTransformerPanel always restricts | G3 |
| D5 — Incompatible types | **Hidden**, with a one-line hint giving the hidden count and the input | G1 |
| D6 — TransformerEditor marking | **Always on**, from the same recursive #249 check | G2 |
| D7 — TransformerEditor root input | **Coarse**: entity instance → entity uuid, all instances → `array` of the entity, "here" value → its kind | G1 |
| D8 — Output of a node | **#88 inference converted with `inferTransformerOutputTypeFromSchema`, else the declared `inputOutput.output`** | G1, G2 |
| D9 — Slot rules | **Follow the runtime binding of `defaultInput`** (§4.3) | G1, G2 |

**Rationale:** the restriction and the marking come from one function over one relation, so a type the select offers is never marked, and a marked type is never offered. Unknown always means `any`, which restricts nothing: the check may miss a mismatch, it never hides a valid choice.

### D1 — Input that restricts a position

**Status:** Accepted — D1-b. **Serves:** G1, G2.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| D1-a. Slot input only | restrict by the `defaultInput` the slot binds, whatever the node holds | simple | hides and flags `{ aggregate, applyTo: getFromContext("rows") }` in an object position, where it runs fine |
| **D1-b. Own `applyTo` first** ★ | node with an `applyTo` transformer: its output; else the slot's input | matches the runtime (`resolveApplyTo` reads `applyTo`, falling back to `getFromContext(defaultInput)`) | an `applyTo` whose output is unknown gives `any` |

### D2 — Compatibility relation

**Status:** Accepted — D2-a (A, round 1, Q2). **Serves:** G1, G2.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D2-a. #249 relation** ★ | `inputOutputTypesCompatible(given, declared.input)`; declared input `undefined` always accepted; no `inputOutput` = any/any | same relation as the existing list panel check; coarse types are what definitions declare | coarse |
| D2-b. #251 relation | lift declared input to an ML schema, `isMlSchemaSubtype` | finer | A: no relation to #251 |

### D4 — Off switch

**Status:** Accepted — D4-a (A, round 1, Q4). **Serves:** G3.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D4-a. TransformerEditor only** ★ | toggle "Restrict transformers to the input type", default on, kept in `ToolsPageState.transformerEditor` (session storage) | the issue's scope | ListTransformerPanel has no escape hatch |
| D4-b. Settings default + toggle in both editors | `ViewParams` flag | one default | rejected by A |

### D7 — TransformerEditor root input

**Status:** Accepted — D7-b (A, round 1, Q7). **Serves:** G1.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| D7-a. `valueToMl(value)` | infer an ML schema from the "here" value | element types | rejected by A |
| **D7-b. Coarse kinds** ★ | "instance" one: entity uuid; all: `{ type: "array", payload: entityUuid }`; "here": `array` / `object` / primitive kind of the value (`null`/`undefined` → `any`) | simple, matches #249 types | a "here" array gives `array` of `any` |

### D8 — Output of a node

**Status:** Accepted (A, round 2 withdrawal note). **Serves:** G1, G2.

`resolveTransformerResultSchema(node, mlContext)` (#88), converted by `inferTransformerOutputTypeFromSchema` (#249, generalized to recognize any known entity schema, not only the list row). When #88 fails, the declared `inputOutput.output`. `mlContext` carries the ML schemas bound by the walk (§4.3); a coarse root input is lifted to an ML schema (entity uuid → the entity's `mlSchema`, primitive → `{ type }`, `object` → `{ type: "record", definition: { type: "any" } }`, `array` → array of the lifted payload).

---

## 4. Current state

### 4.1 #249 check is root-only (misaligned with G2)

`checkTransformerInterfaceCompatibility(given, declaredInputOutput)` in `TransformerInterfaceCheck.ts` compares one `given` pair with the outermost transformer's declaration. `ListTransformerPanel` calls `checkTransformerInterfaceCompatibilityWithInference({ input: rowEntityUuid ?? "any", output: expectedOutputType }, declared, inferredOutputType)` for the outermost `transformerType` only (#249 D5). Nested transformers are never checked by #249.

Relation (`inputOutputTypesCompatible`): `any` on either side is compatible; entity uuid ⊂ `object`/`object<any>`; primitives by equality; `object`/`array` by kind then payload. MiroirTest suite `fn.transformer.interfaceCheck` (`c9f0a3e1-7b2d-4e6a-8f1c-5d3b9a7e2c84`, 28 cases) covers it.

### 4.2 `inputOutput` declarations (enumerated from the 48 TransformerDefinition assets)

47 declare `inputOutput`; `spreadSheetToMlSchema` does not (any/any). Declared inputs:

| Declared input | Transformers |
|---|---|
| `undefined` (does not consume input) | `constantAsExtractor`, `createObject`, `currentDate`, `currentTimestamp`, `generateUuid`, `getFromContext`, `getFromParameters`, `returnValue` |
| `any` | `boolExpr`, `case`, `createObjectFromPairs`, `getObjectEntries`, `ifThenElse`, `mergeIntoObject`, `numericOp`, `plus`, `stringOp`, `syncExternalServiceSchema` |
| `array` | `aggregate`, `ansiColumnsToMlSchema`, `concatLists`, `filterList`, `find`, `getUniqueValues`, `indexListBy`, `listLength`, `listReducerToSpreadObject`, `mapList`, `object_fromEntries`, `pickFromList`, `pivot`, `sortList`, `unpivot` |
| `object` | `accessDynamicPath`, `dataflowObject`, `defaultValueForSchema`, `duplicateApplicationModel`, `getObjectValues`, `mlsTypeCheck`, `resolveConditionalSchema`, `resolveSchemaReferenceInContext`, `resolveTransformerResultSchema`, `unfoldSchemaOnce` |
| `string` | `getActiveDeployment`, `mustacheStringTemplate` |
| entity uuid | `entityDefinition_extractAttributes` (Entity `16dbfe28-…`), `transformer_menu_addItem` (Menu `dde4c883-…`) |

8 + 10 + 15 + 10 + 2 + 2 = 47.

### 4.3 Runtime binding of a transformer's input (`TransformersForRuntime.ts`)

A transformer consumes `applyTo`; with no `applyTo`, `resolveApplyTo` evaluates `getFromContext(defaultTransformerInput)` (`"defaultInput"`). Nested transformers see:

| Slot | Runtime binding | Given input in the walk |
|---|---|---|
| `applyTo` | evaluated in the parent's context | parent's given input |
| `mapList.elementTransformer` (`transformerForBuild_list_listMapperToList_apply`) | each element bound as `referenceToOuterObject ?? defaultInput` | element of the consumed array; when `referenceToOuterObject` is set, `defaultInput` is unchanged and the element is bound under that name |
| `filterList.predicate`, `find.predicate` (`handleTransformer_filterList`, `handleTransformer_find`) | same element binding | same |
| `createObjectFromPairs.definition[i].attributeKey/attributeValue` (`handleTransformer_createObjectFromPairs`) | resolved `applyTo` (or `{}` without `applyTo`) bound as `referenceToOuterObject ?? defaultInput` | consumed `applyTo` output, or `object` |
| `mergeIntoObject.definition` (`handleTransformer_mergeIntoObject`) | resolved `applyTo` bound the same way | consumed `applyTo` output |
| `dataflowObject.definition.<step>` (`handleTransformer_dataflowObject`) | context extended with earlier step results by key; `defaultInput` unchanged | parent's given input; earlier step outputs added to the walk context by key |
| any other nested transformer (`ifThenElse.if/then/else`, `case`, `createObject.definition`, operands, …) | parent's context | parent's given input |

Note: the #251 walk chains a `dataflowObject` step's piped input to the previous step's output; the runtime does not. This analysis follows the runtime.

### 4.4 `transformerType` select (misaligned with G1)

`MlLiteralEditor` renders the discriminator with `discriminatorSelectOptions` built from `parentKeyMap.discriminatorValues[discriminatorIndex]`, sorted, unfiltered. It already receives `rootLessListKeyArray`, `compatibilityWarnings` and `mlSchemaTypeAnnotations`, threaded from `TypedValueObjectEditor` through `MlElementEditor`, `MlObjectEditor`, `MlArrayEditor` and `MlAnyEditor`.

Paths: ListTransformerPanel edits the transformer at the root of its `TypedValueObjectEditor` (`formikValuePathAsString="elementTransformer"`), so node paths equal editor paths. The TransformerEditor edits `transformerEditor_transformer_selector`, whose "here" branch holds the transformer under `transformer`: node paths are prefixed with `["transformer"]`.

### 4.5 TransformerEditor (misaligned with G2, G3)

No compatibility check runs. Root input: `transformerEditor_input_selector` "here" mode binds `input` as `defaultInput`; "instance" mode feeds `transformerEditor_input` from `EntityInstanceSelectorPanel` (one instance, or all with `showAllInstances`). State persistence: `context.toolsPageState.transformerEditor`, saved to `sessionStorage` by `MiroirContextReactProvider`.

---

## 5. Key reuse

| Piece | Location |
|---|---|
| `inputOutputTypesCompatible`, `checkTransformerInterfaceCompatibility`, `getTransformerDefinitionInputOutput` | `miroir-core/src/2_domain/TransformerInterfaceCheck.ts` |
| `inferTransformerOutputTypeFromSchema` | `miroir-core/src/2_domain/TransformerInterfaceInference.ts` |
| `resolveTransformerResultSchema`, `isFailedTransformerInterfaceFromDefinition` | `miroir-core/src/2_domain/Transformer_ResultSchema.ts` (#88) |
| `applicationTransformerDefinitions` | `miroir-core/src/2_domain/TransformersForRuntime.ts` |
| `defaultTransformerInput` | miroir-core constant (`"defaultInput"`) |
| `functionCallTest` whitelist | `miroir-core/src/5_tests/FunctionCallTestRegistry.ts` (`miroir-core/2_domain/TransformerInterfaceCheck`) |
| MiroirTest suite `fn.transformer.interfaceCheck` | `miroir-app-miroir/assets/miroir_data/a311f363-…/c9f0a3e1-7b2d-4e6a-8f1c-5d3b9a7e2c84.json` |
| Path-keyed props through the editor tree | `compatibilityWarnings` in `MlElementEditorInterface.ts` and the editors listed in §4.4 |
| UI test | `miroir-standalone-app/tests/4_view/ListTransformerPanel.unit.test.tsx` |

## 6. Target design (summary)

- miroir-core `TransformerInterfaceCheck.ts` gains a recursive walk: transformer + root given type (+ root ML context, entity schemas, definitions) → one report per typed node `{ path, transformerType, givenInput, consumedInput, declared, output, failures }`, following §4.3 and D1, D8.
- A pure function turns a consumed input into the offered transformer types (D2 relation over the definitions, plus the currently selected type).
- ListTransformerPanel (always) and the TransformerEditor (switch, D4) pass a path-keyed list of offered types to the editor tree; `MlLiteralEditor` filters the discriminator options at the matching path and shows the hint (D5).
- Both editors pass the walk's failures as `compatibilityWarnings` (ListTransformerPanel in its #249 mode; its #251 mode is unchanged).

Implementation phasing: [`tdd-implementation-plan.md`](./tdd-implementation-plan.md).
