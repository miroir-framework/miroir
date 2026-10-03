# 415 Structural editing of transformer trees in the TransformerEditor

> Analysis of four structural operations on any node of a transformer being edited: wrap a node in a
> new transformer, remove a node and keep one child, remove a subtree, and change a node's type while
> keeping the attributes that still fit.

Related issue: https://github.com/miroir-framework/miroir/issues/415
Builds on: #383 (per-position input types and transformer type filtering, PR #403), #406 (TransformerEditor UI MiroirTests, PR #407), #124 (step-by-step development in the TransformerEditor, closed)
Blocked in part by: #411 (TransformerEditor freezes when `getFromContext` is chosen inside `mapList`)
Related analysis: [`../383-FEATURE-transformer-choice-by-input-type/analysis.md`](../383-FEATURE-transformer-choice-by-input-type/analysis.md)
Grilling record: `/mnt/project-files/issue-415/grilling-round-1.md` (project files, 2026-10-03). A accepted the 13 recommendations of round 1.

Key sources:
- [`packages/miroir-standalone-app/src/miroir-fwk/4_view/components/ValueObjectEditor/MlLiteralEditor.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/ValueObjectEditor/MlLiteralEditor.tsx) (`transformerType` select, its own `handleDiscriminatorChange`)
- [`packages/miroir-standalone-app/src/miroir-fwk/4_view/components/ValueObjectEditor/MlEnumEditor.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/ValueObjectEditor/MlEnumEditor.tsx) (second copy of `handleDiscriminatorChange`)
- [`packages/miroir-standalone-app/src/miroir-fwk/4_view/components/ValueObjectEditor/MlObjectEditor.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/ValueObjectEditor/MlObjectEditor.tsx) (optional attribute removal)
- [`packages/miroir-standalone-app/src/miroir-fwk/4_view/components/TransformerEditor/TransformerEditor.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/TransformerEditor/TransformerEditor.tsx)
- [`packages/miroir-core/src/2_domain/TransformerInterfaceCheck.ts`](../../../packages/miroir-core/src/2_domain/TransformerInterfaceCheck.ts) (#383 walk)
- [`packages/miroir-core/src/2_domain/TransformersForRuntime.ts`](../../../packages/miroir-core/src/2_domain/TransformersForRuntime.ts) (runtime bindings, `applicationTransformerDefinitions`)

**Document role:** analysis and architectural decision record.
**Status:** all decisions confirmed with A (round 1 and round 2, 2026-10-03). D14 to D16 came out of reading the code after round 1; their record is `/mnt/project-files/issue-415/grilling-round-2.md`. TDD plan: [`tdd-implementation-plan.md`](./tdd-implementation-plan.md).

---

## 1. Goals

- **G1. Enclose without retyping.** To grow a transformer written for one instance into a transformer for a list of instances, as a transformer designer, I can enclose an existing node in a new transformer (`mapList` first) and keep everything below it.
- **G2. Shrink without retyping.** To simplify a transformer or step back, as a transformer designer, I can remove one node and keep one of its children in its place, or remove a whole subtree.
- **G3. Change a type without losing children.** To try another transformer at a position, as a transformer designer, I can change a node's type and keep the attributes that are still valid for the new type.
- **G4. Any level.** To make these steps wherever the transformer needs them, as a transformer designer, I can apply each operation to the root node or to a nested node, whether it sits in an attribute, an array item or a record value.

After each operation the TransformerEditor recomputes the result and the #383 marking, as it does after any edit (§4.6). That is how the designer checks each step, and it needs no new mechanism.

## 2. Non-goals

- Undo and redo in the TransformerEditor (D5; separate issue, not filed yet).
- Rewriting references after a wrap or an unwrap (D6; later).
- Wrapping automatically, or offering a one-click wrap, when the Transformer Input switches to a list (D7; later).
- Copy, paste or move of subtrees, and multi-select (D12; later).
- Keeping attributes on a type change for discriminated unions other than transformers (later; `handleDiscriminatorChange` serves every union).
- Fixing #411 (own issue; D16 decides the order).

## 3. Decision record

| Decision | Choice | Serves | Status |
|---|---|---|---|
| D1. Trigger | Per-node action menu next to the `transformerType` select; Replace stays a change of that select | G1, G2, G3 | Accepted (Q1) |
| D2. Wrap slot | Picked automatically when the new transformer has one slot, chosen by the user otherwise | G1 | Accepted (Q2) |
| D3. Unwrap child | The only child, or the one the user picks; action disabled without children | G2 | Accepted (Q3) |
| D4. Replace keeps | Attributes with the same name whose value still type-checks against the new type | G3 | Accepted (Q4) |
| D5. Destructive operations | Confirmation dialog; undo in a separate issue | G2, G3 | Accepted (Q5) |
| D6. References | No rewriting; the result panel shows breakage | G1, G2 | Accepted (Q6) |
| D7. Input switch to a list | Manual: the designer wraps the root | G1 | Accepted (Q7) |
| D8. Wrap choices | Filtered by the input type at the node's position, as in #383, with the same switch | G1 | Accepted (Q8), refined by D14 |
| D9. Positions | Every place a transformer can sit: root, attribute, array item, record value | G4 | Accepted (Q9) |
| D10. Tree logic | Pure functions in miroir-core, tested by `fn.*` MiroirTests | G1 to G4 | Accepted (Q10) |
| D11. Editors | Every editor rendering a `transformerType` select, since the menu sits next to it | G4 | Accepted (Q11) |
| D12. Out of scope | Copy, paste, move, multi-select | | Accepted (Q12) |
| D13. Tests | `fn.*` cases per operation, plus `ui.transformerEditor` cases for the use case | G1 to G4 | Accepted (Q13) |
| D14. `applyTo` as a target | A separate "Pipe into" action puts the node in `applyTo`; Wrap never uses `applyTo` | G1 | Accepted (round 2, Q1) |
| D15. `getFromParameters` after a wrap | Keep D6, and show a one-line hint when the wrapped subtree reads `defaultInput` through `getFromParameters` | G1 | Accepted (round 2, Q2) |
| D16. #411 | Fix #411 in its own PR before the `mapList` + `getFromContext` UI case | G1 | Accepted (round 2, Q3) |

Defaults chosen while writing this analysis (no question to A, reversible):
- Remove subtree deletes an optional attribute, an array item or a record entry; in a required attribute it puts back the default value a new form would hold; at the root it puts back the editor's default transformer (`DEFAULT_TRANSFORMER_EDITOR_TRANSFORMER`).
- Wrapping into an array slot (`args[]`, `whens[].when`) creates a one-item array; wrapping into a record slot (`createObject.definition`, `dataflowObject.definition`) creates a one-entry record keyed by the node's `label`, else `value`. The designer can rename the key with the record editor.
- Replace asks for confirmation only when it drops at least one attribute; the dialog names the dropped attributes.

### D2 and D14. Where the wrapped node goes

**Status:** D2 accepted; D14 accepted, D14-b. **Serves:** G1.

In round 1, the rationale for D2 assumed `mapList` has one transformer slot. It has two: `elementTransformer` and the optional `applyTo` (§4.3). Under D2 as accepted, wrapping in `mapList` would ask the designer which slot to use every time.

The two slots mean two different steps. Putting the node in `elementTransformer` encloses it, and the new node applies it to each element. Putting the node in `applyTo` feeds the node's output to the new node, like a pipe. They also need different filters. An enclosing node must accept the position's input, and a piped node must accept the wrapped node's output (#383 D1).

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| D14-a. `applyTo` is one more Wrap slot | Wrap lists `applyTo` with the other slots; the dialog preselects the first required non-`applyTo` slot | one action | `mapList`, `filterList`, `find` always ask; one filter cannot fit both slot kinds |
| **D14-b. Separate "Pipe into" action** ★ | Wrap uses non-`applyTo` slots only (18 transformer types); Pipe into puts the node in `applyTo` (19 types) | Wrap in `mapList` takes one choice; each action has one filter rule | one more menu entry |
| D14-c. `applyTo` is never a target | Wrap only | smallest | piping an existing node into a list transformer needs retyping |

### D15. `getFromParameters` after a wrap

**Status:** accepted, D15-b. **Serves:** G1.

The TransformerEditor passes its input both as parameters and as context (§4.4). `mapList` rebinds `defaultInput` in the context only. So a node written for one instance with `getFromParameters` on `defaultInput.name` (the screenshot attached to the issue) still reads the whole list after a wrap in `mapList`. The same node written with `getFromContext` reads each element.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| D15-a. D6 as is | nothing; the result shows `undefined` names | no new code | the headline case fails with the transformer A built |
| **D15-b. D6 plus a hint** ★ | after a wrap into an element slot, a one-line hint names each `getFromParameters` of `defaultInput` in the subtree and suggests `getFromContext` | the designer knows why and what to change; no silent rewrite | one more check to write |
| D15-c. Rewrite on wrap | turn `getFromParameters` of `defaultInput` into `getFromContext` in the wrapped subtree | the headline case works with no edit | silent semantic change; wrong under an inner `mapList` that rebinds `defaultInput` again |

### D16. Order with #411

**Status:** accepted, D16-a. **Serves:** G1.

#411: in the component test runner, choosing `getFromContext` as the `elementTransformer` of a `mapList` blocks the JavaScript thread. Wrapping a `getFromContext` node in `mapList` creates exactly that tree, so the UI case for the use case cannot pass before a #411 fix.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D16-a. #411 first** ★ | fix #411 in its own PR; #415 starts with the core slices meanwhile | each PR has one purpose; the test runs the use case as A runs it | the last UI slice waits for #411 |
| D16-b. #411 inside #415 | fix it as a slice of this plan | one PR | mixes a performance bug with a feature |
| D16-c. Work around | UI case uses `mustacheStringTemplate` with `interpolation: runtime` | no wait | does not test the case A described |

---

## 4. Current state

### 4.1 Changing `transformerType` discards the node (misaligned with G3)

`MlLiteralEditor` renders the `transformerType` select (`ThemedSelectWithPortal`, filterable) and calls its own `handleDiscriminatorChange` from `handleFilterableSelectChange` (`MlLiteralEditor.tsx`, call at line 482). The function finds the union branch of the new type, builds its default value with `getDefaultValueForMlSchemaWithResolutionNonHook` (miroir-core `TransformersForRuntime.ts`, line 594) and writes it to the node's path with `formik.setFieldValue` (lines 63 to 305). The new value drops every attribute of the previous node.

`MlEnumEditor.tsx` holds a second, near-identical `handleDiscriminatorChange` (line 76; write at line 289) for enum discriminators. Both serve every discriminated union, not only transformers.

### 4.2 Existing removal (partly aligned with G2)

| Position | Removal today |
|---|---|
| optional attribute | yes, `deleteElement` in `MlObjectEditor.tsx` (line 1075), rewrites the whole section value |
| array item | yes, `removeItemAtIndex` button in `MlArrayEditor.tsx` (line 262) |
| record entry | yes, through the same `deleteElement` |
| required attribute | no |
| remove a node and keep a child | no |
| wrap a node | no |

### 4.3 Transformer slots (enumerated from the 48 TransformerDefinition assets)

A slot is an attribute of a transformer whose schema is a reference to `transformer` or `coreTransformerForBuildPlusRuntime` (directly, as an array item, as a record value or as a union member). The definitions declare `applyTo` as `type: any`, but the generated types give it `CoreTransformerForBuildPlusRuntime`, and the #383 walk treats it as a transformer position.

| Non-`applyTo` slots | Transformer types | Count |
|---|---|---|
| exactly one | `mapList.elementTransformer`, `filterList.predicate`, `find.predicate`, `+.args[]`, `numericOp.args[]`, `mergeIntoObject.definition`, `pivot.columns`, `unpivot.columns`, `spreadSheetToMlSchema.spreadsheetContents`, `duplicateApplicationModel.applicationBundle`, `resolveTransformerResultSchema.transformer`, `createObject.definition{}`, `dataflowObject.definition{}` | 13 |
| several | `boolExpr` (left, right), `createObjectFromPairs` (definition[].attributeKey, definition[].attributeValue), `ifThenElse` (if, then, else), `case` (discriminator, whens[].when, whens[].then, else), `transformer_menu_addItem` (menuReference, menuItemReference) | 5 |
| none, `applyTo` only | `aggregate`, `ansiColumnsToMlSchema`, `getObjectEntries`, `getObjectValues`, `getUniqueValues`, `indexListBy`, `listLength`, `listReducerToSpreadObject`, `object_fromEntries`, `pickFromList`, `sortList`, `stringOp` | 12 |
| none | `accessDynamicPath`, `concatLists`, `constantAsExtractor`, `currentDate`, `currentTimestamp`, `defaultValueForMLSchema`, `entityDefinition_extractAttributes`, `generateUuid`, `getActiveDeployment`, `getFromContext`, `getFromParameters`, `mlsTypeCheck`, `mustacheStringTemplate`, `resolveConditionalSchema`, `resolveSchemaReferenceInContext`, `returnValue`, `syncExternalServiceSchema`, `unfoldSchemaOnce` | 18 |

13 + 5 + 12 + 18 = 48. Wrap candidates (non-`applyTo` slots): 18. 19 types declare `applyTo`: the 12 above, plus `mapList`, `filterList`, `find`, `mergeIntoObject`, `pivot`, `unpivot` and `createObjectFromPairs`. `accessDynamicPath.objectAccessPath` accepts only four specific transformer kinds, so this analysis does not count it as a slot.

### 4.4 Runtime bindings that matter for a wrap

| Fact | Location |
|---|---|
| `mapList` evaluates `elementTransformer` with `{ ...contextResults, [referenceToOuterObject ?? "defaultInput"]: element }`; parameters stay unchanged | `TransformersForRuntime.ts`, `transformerForBuild_list_listMapperToList_apply`, lines 1669 to 1683 |
| `getFromParameters` resolves from parameters (`"param"` bank), `getFromContext` from the context | `transformer_InnerReference_resolve`, lines 2274 to 2306; `transformer_resolveReference`, line 2073 |
| The TransformerEditor passes `{ defaultInput: input }` both as parameters and as context | `TransformerEditor.tsx`, `transformerInput` and `transformationResult` (lines 588 to 640) |
| `TransformationResultPanel` already tells the designer to read the input with `getFromContext` and `defaultInput` | `TransformationResultPanel.tsx`, line 151 |

At the root of the editor both readings give the same value, so the designer cannot tell them apart until a wrap (D15).

### 4.5 #383 machinery (reused)

`checkTransformerInterfaceRecursively` returns one report per typed node: `{ path, transformerType, givenInput, consumedInput, declared, output, failures }`. `transformerTypesAcceptingInput(consumedInput, { transformerTypes, currentType })` splits candidates into offered and hidden.

`TransformerDefinitionEditor` (`TransformerEditor.tsx`, lines 152 to 161) maps only `consumedInput` into `transformerTypeRestrictions`, with paths prefixed by `transformer`. `MlLiteralEditor` reads the entry for its node with `findPathAnnotation` (line 517) and filters the select. Wrap needs `givenInput` (the position's input) and Pipe into needs `output`; neither reaches the editor today.

The walk's child rules (`walkChildren`, `LIST_ELEMENT_SLOTS`) already know which keys of a node hold transformers. Unwrap's child list can come from the same traversal.

### 4.6 TransformerEditor

The edited transformer lives at `transformerEditor_transformer_selector.transformer` in Formik. The result is a `useMemo` over the transformer and input fingerprints, so any `setFieldValue` on the transformer recomputes it. The editor has no undo.

### 4.7 UI tests

`ui.transformerEditor` (`ce3f9603-824e-41da-9c6c-27ace3b01678`, `reactComponentTestSuite` on `TransformerEditor` with the Miroir application and Entity `16dbfe28-e1d7-4f20-9ba4-c1a9873202ad`) has 4 cases on _integration. Steps used across MiroirTests include `click`, `selectOption`, `openSelect`, `expectElement`, `waitForAttribute`, `clickObjectButton` and `renameRecordEntry`, which are enough to drive a menu, a dialog and a select. Entity instances have a `name`, so the use case can run on Entity instead of Book.

---

## 5. Key reuse

| Piece | Location |
|---|---|
| Recursive walk and node reports | `checkTransformerInterfaceRecursively`, `TransformerInterfaceCheck.ts` |
| Type filter | `transformerTypesAcceptingInput`, `TransformerInterfaceCheck.ts` |
| Transformer definitions by `transformerType` | `applicationTransformerDefinitions`, `TransformersForRuntime.ts` line 1113 |
| Default value of a union branch | `getDefaultValueForMlSchemaWithResolutionNonHook`, `TransformersForRuntime.ts` line 594 |
| Value check against an ML schema | `mlsTypeCheck`, `miroir-core/src/1_core/mls/mlsTypeCheck.ts` line 862 |
| Path update on a plain value | `alterObjectAtPath`, miroir-core `tools` |
| `fn.*` test environments (model environment injection) | `FunctionCallTestFixtures.ts`, `defaultMiroirModelEnvironment` |
| Path-keyed props through the editor tree | `transformerTypeRestrictions` in `MlElementEditorInterface.ts` (line 77) |
| Menu, dialog and icon button | `ThemedMenuItem`, `ThemedDialog` (`Themes/MUIComponents.tsx`), `ThemedIconButton` (`Themes/IconComponents.tsx`) |
| UI MiroirTest suite | `ui.transformerEditor`, `miroir-app-miroir/assets/miroir_data/a311f363-e238-4203-bdfc-29e8c160c26b/ce3f9603-824e-41da-9c6c-27ace3b01678.json` |

## 6. Target design (summary)

- A new miroir-core module `2_domain/TransformerTreeEdit.ts` holds the tree operations as pure functions over plain transformer values: the slots of a transformer type (from its definition), the transformer children of a node, wrap, pipe into, unwrap, remove, and the merge of kept attributes on a type change. They take the transformer definitions and, for the type check, a model environment. `FunctionCallTestRegistry` whitelists them for a new `fn.transformer.treeEdit` suite.
- The TransformerEditor passes `givenInput` and `output` with each restriction entry, so the menu can filter Wrap and Pipe into choices (D8, D14) when the switch is on.
- `MlLiteralEditor` renders a node action menu next to the `transformerType` select. Each action computes the new value with the core functions and writes it with one `setFieldValue`. Destructive actions open a `ThemedDialog` first (D5).
- `handleDiscriminatorChange` (one shared copy) merges the kept attributes when the discriminator is `transformerType` (D4).

Implementation phasing: [`tdd-implementation-plan.md`](./tdd-implementation-plan.md).
