# 453 — Show input and output types of every transformer node in the TransformerEditor

> A switch in the TransformerEditor, off by default, shows a type badge on every transformer node
> of the edited tree: the input the node gets, its declared `inputOutput`, and its inferred
> output, colored by match / mismatch. Coarse `inputOutput` types only; the full ML schema is a
> later step.

## Related links

- Issue: https://github.com/miroir-framework/miroir/issues/453
- Follow-ups: #454 (expected types for slots other than `applyTo`), #455 (runtime trace of actual values)
- Prerequisites: [#383 analysis](../383-FEATURE-transformer-choice-by-input-type/analysis.md) (recursive walk), [#88 plan](../88-FEATURE-typed-transformers/tdd-implementation-plan.md) (output inference)
- Sandbox: #435 (step delay in ViewParams), #443 (play / pause), #438 (glow)
- Grilling: two rounds on 2026-10-04 (project file `transformer-type-display/grilling-round-1.md`), every recommended answer accepted, Q4 changed to coarse types only.
- Key files:
  - [`TransformerInterfaceCheck.ts`](../../../packages/miroir-core/src/2_domain/TransformerInterfaceCheck.ts) (walk, `inputOutputTypeOfValue`)
  - [`TransformerInterfaceCheckInterface.ts`](../../../packages/miroir-core/src/0_interfaces/2_domain/TransformerInterfaceCheckInterface.ts)
  - [`TransformerEditor.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/TransformerEditor/TransformerEditor.tsx)
  - [`TransformerTypeAnnotation.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/TransformerTypeAnnotation.tsx)
  - [`runReactComponentTest.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4-tests/componentTests/runReactComponentTest.tsx), [`ComponentTestSandbox.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ComponentTestSandbox.tsx)

## Goals

| # | Story |
|---|---|
| G1 | **Compare types while composing.** In order to see where a composition of transformers breaks, as a transformer designer, I can show next to every node of the edited tree the input it gets, the input and output its definition declares, and the output it returns. |
| G2 | **Follow types during a test run.** In order to see how types change step by step, as a test author watching a Component Test Sandbox run, I can keep the type display on through every case of the run. |
| G3 | **Quiet by default.** In order to keep the editor readable, as a transformer designer, I see no type badge until I switch the display on. |

## Non-goals

- Full ML schemas in the badges (A, Q4): later step, no issue yet.
- Expected types for slots other than `applyTo`: #454.
- Actual runtime values per node: #455.
- ListTransformerPanel and other editors (Q10).
- Any change to #88 `resolveTransformerResultSchema` (Q14).

## Decision record

All **Accepted** by A on 2026-10-04 (grilling Q1-Q21; Q4 answered (a), the rest as recommended).

| # | Decision | Rejected options | Serves |
|---|---|---|---|
| D1 | The switch "Show transformer types" is in the TransformerEditor, next to "Restrict transformers to the input type". | Sandbox header only; both. | G1, G2 |
| D2 | Its value is the new ViewParams attribute `showTransformerTypes` (default false). | `toolsPageState` (the sandbox gives every case an empty one, so the switch would turn off at each case). | G2, G3 |
| D3 | A badge shows the given input, the consumed input when it differs, the declared `inputOutput` when the definition has one (D19), and the inferred output. | Expected input + actual output only; every field always. | G1 |
| D4 | Coarse `InputOutputType` only. | Full ML schema in a tooltip (deferred). | G1 |
| D5 | A parent constrains a child through `applyTo` only, as today. | Slot expectations now (#454). | G1 |
| D6 | Leaves get a badge: constants, references, `returnValue`, literals in `applyTo` (D16). | Transformer nodes only. | G1 |
| D7 | One badge per node, on the node's title row in the editor tree. | A side table of all nodes. | G1 |
| D8 | Static types, recomputed when the tree changes, so they follow a sandbox run step by step. | Runtime trace (#455). | G1, G2 |
| D9 | Independent of the restrict switch; mismatch warnings stay on. | Badges replacing warnings. | G1 |
| D10 | TransformerEditor only. | ListTransformerPanel too. | G1 |
| D11 | Tests: `fn.transformer.interfaceWalk` cases and `ui.transformerEditor` cases. | | G1, G2, G3 |
| D12 | A `returnValue` without `mlSchema` has the type of its `value`. | `any`. | G1 |
| D13 | A `returnValue` whose `value` type does not fit its `mlSchema` (coarse) is a failure of the node, shown red. | Trust `mlSchema` silently. | G1 |
| D14 | Value typing lives in the #383 walk only. | In #88 (changes every #88 caller and `fn.transformer.resultSchema`). | G1 |
| D15 | The type of a value: an array has the common coarse type of its elements as payload (`[1, 2]` → `array<number>`, `[1, "a"]` → `array<any>`), an object with a string `parentUuid` is that entity. The editor's root input uses the same function. | First element only; plain `array`. | G1 |
| D16 | Only literals in `applyTo` get a badge. | Every literal leaf. | G1 |
| D17 | Badge status: red when the node has a failure; grey when the node declares no input (or declares `undefined` / `any`) or its consumed input is `any`; green otherwise. | | G1 |
| D18 | An entity type shows the entity name, its uuid in the badge's title; an unknown uuid shows its first 8 characters. | Raw uuid. | G1 |
| D19 | No declared part for a node without `inputOutput`. | `declared: none`. | G1 |

## Current state (`_integration` bf38c67f)

### The walk

`checkTransformerInterfaceRecursively(transformer, rootInput, options)` (`TransformerInterfaceCheck.ts:547`) returns `{ status, nodes }`, one `TransformerInterfaceNodeReport` per typed node in tree order (`TransformerInterfaceCheckInterface.ts:32`):

```ts
export interface TransformerInterfaceNodeReport {
  path: (string | number)[];
  transformerType: string;
  givenInput: InputOutputType;
  consumedInput: InputOutputType;
  declared: InputOutputObject | undefined;
  output: InputOutputType;
  failures: TransformerInterfaceMismatch[];
}
```

- `walkNode` (`:371`) computes `output` with `nodeOutput` (`:344`): #88 `resolveTransformerResultSchema` reduced by `inferTransformerOutputTypeFromSchema`, else `declared.output`, else `any`.
- A literal `applyTo` is typed by `inputOutputTypeOfValue(transformer.applyTo)` (`:401`) and is not reported as a node.
- The only failure is `direction: "input"`: consumed input not compatible with the declared input (`:404-410`). `TransformerInterfaceMismatch.direction` is `"input" | "output"`.

### `returnValue` in #88

`resolveTransformerResultSchema`, `case "returnValue"` (`Transformer_ResultSchema.ts:835`): the node's `mlSchema` when set; otherwise the switch falls through to the definition's result schema, `{ "type": "any" }` (definition `2b4c25e0-6b0f-4f7d-aa68-1fdc079aead3`, `transformerInterface.transformerResultSchema`). The runtime ignores `mlSchema` and returns `value` (`TransformersForRuntime.ts:2253`).

### Typing values

`inputOutputTypeOfValue` (`TransformerInterfaceCheck.ts:271`): `null` / `undefined` → `any`, array → `"array"` (no payload), object → `"object"`, primitives → their kind. The TransformerEditor's root input (`transformerEditorRootInputType`, `TransformerEditor.tsx:84`) uses it in "here" mode, and in "instance" mode reads the entity from `parentUuid` (of the instance, or of the first element of an array).

MiroirTest cases on these (suite `fn.transformer.interfaceWalk`, MiroirTest `0a6912c2-e061-476b-bd54-849e7366684b`): `inputOutputTypeOfValue > array` expects `"array"`; `own applyTo (D1) > a literal applyTo gives the kind of its value` expects consumed input `"array"` for `applyTo: [1, 2]`. Both change with D15.

### TransformerEditor

`TransformerDefinitionEditor` (`TransformerEditor.tsx:116`) runs the walk on the edited transformer and passes to `TypedValueObjectEditor`:
- `compatibilityWarnings` (always, from node failures; path `["transformer", ...node.path]`);
- `transformerTypeRestrictions` (when the restrict switch is on).

The restrict switch is `toolsPageState.transformerEditor.restrictTransformersToInputType` (`:243`).

### Existing title-row type display (#251)

`ListTransformerPanel` in ML schema mode passes `showMlSchemaTypes` and `mlSchemaTypeAnnotations` (`{ path, label: "in: X → out: Y" }`). They are drilled through `TypedValueObjectEditor`, `MlElementEditor`, `MlAnyEditor`, `MlObjectEditor`, `MlArrayEditor`, and rendered by `TransformerTitleRowAnnotations` (`TransformerTypeAnnotation.tsx:186`) on the title row of object and array editors (`MlObjectEditor.tsx:1408`, `MlArrayEditor.tsx:844`), with an orange "mismatch" chip. The TransformerEditor does not use them. `formatInputOutputTypeLabel` (entity names) is private to `ListTransformerPanel.tsx:115`.

### Sandbox cases and ViewParams

- Each component test case is a separate React root (`mountComponent` into a fresh container, `runReactComponentTest.tsx:169-195`) under its own providers over a fixture `LocalCache` (`buildComponentTestWrapper`, `componentTestTools.tsx:590`) loaded with the Miroir meta-model and Library only: no Admin deployment, so no ViewParams instance. App contexts do not reach a case.
- The runner already wraps every case in `ComponentTestModeContext` and `PortalContainerProvider`, and takes controls from its host (`ComponentTestSandboxHost`: `stepDelayMs()`, `onCaseStart`, `waitWhilePaused`).
- The sandbox header reads the app's ViewParams (`useComponentTestStepDelay`, `ComponentTestSandbox.tsx:136`) and saves through `ViewParamsUpdateQueue`.

So a ViewParams attribute read inside the TransformerEditor sees the app's value on the Tools page, and nothing inside a sandbox case. D2's "survives sandbox cases" needs the sandbox to pass the app's value into each case.

## Target design

### Core (miroir-core)

| Change | Where | Decisions |
|---|---|---|
| `inputOutputTypeOfValue`: array payload = common coarse type of the elements (`any` when they differ or the array is empty → plain `array` kept for `[]`), object with string `parentUuid` → that uuid | `TransformerInterfaceCheck.ts` | D15 |
| `nodeOutput`: `returnValue` without `mlSchema` → `inputOutputTypeOfValue(value)` | same | D12, D14 |
| `returnValue` with `mlSchema`: failure `{ direction: "value", given: <value type>, declared: <mlSchema type> }` when not compatible | same; `direction` gains `"value"` in the interface | D13 |
| Walk result gains `literals: { path, type }[]` for literal `applyTo` values | walk + interface | D6, D16 |
| `transformerNodeTypeStatus(node): "match" \| "mismatch" \| "unknown"` | same | D17 |

`transformerEditorRootInputType` keeps its "instance" mode rule and uses the new `inputOutputTypeOfValue` for both modes (D15).

### UI (miroir-standalone-app)

- `TransformerTypeBadge` = `{ path, givenLabel, consumedLabel?, declaredLabel?, outputLabel, status, title }`, built by `TransformerDefinitionEditor` from the walk nodes and literals, labels by an exported `formatInputOutputTypeLabel` (moved out of `ListTransformerPanel`, extended with D18).
- New prop `transformerTypeBadges` drilled next to `mlSchemaTypeAnnotations` (same files), rendered by `TransformerTitleRowAnnotations` as a `TransformerTypeBadgeChip` with `data-testid="transformer-type-badge-<path>"` and `data-transformer-type-status`. Undefined when the switch is off (D3, G3).
- Switch `transformer-editor-show-types-switch` next to the restrict switch (D1).

### Switch value (D2)

`useShowTransformerTypes(): [boolean, (value: boolean) => void]` in the TransformerEditor folder:

| Where the editor is | Initial value | Save |
|---|---|---|
| App (Tools page) | ViewParams `showTransformerTypes` of the store | `ViewParamsUpdateQueue` |
| Sandbox case | `TransformerTypesDisplayContext` from the runner, filled from the host | host `saveShowTransformerTypes` (the sandbox saves the app's ViewParams and keeps the value in a ref for the next case) |
| vitest case (no host control, no ViewParams) | false | none |

The shown value is local state seeded from the initial value, so a toggle shows at once whatever the save does.

## Key reuse

| Piece | Location |
|---|---|
| Walk, node reports | `TransformerInterfaceCheck.ts` `checkTransformerInterfaceRecursively` |
| Compatibility relation | `inputOutputTypesCompatible` (same file) |
| Schema → coarse type | `inferTransformerOutputTypeFromSchema` (`TransformerInterfaceInference.ts`) |
| Title-row annotation drilling | `mlSchemaTypeAnnotations` path through the Ml*Editor components |
| Title-row rendering | `TransformerTitleRowAnnotations`, `TransformerTitleSignature` |
| ViewParams attribute pattern | #435 `componentTestStepDelayMs` (admin entity `b9765b7c-b614-4126-a0e2-634463f99937`, `ViewParams.ts`) |
| Host controls into cases | `ComponentTestSandboxHost`, `ComponentTestModeContext` wrapping in `mountCase` |
| Walk tests | MiroirTest `fn.transformer.interfaceWalk` (`0a6912c2-e061-476b-bd54-849e7366684b`) |
| Editor UI tests | MiroirTest `ui.transformerEditor` (`ce3f9603-824e-41da-9c6c-27ace3b01678`) |

## Risks

- Editor defaults: the `returnValue` default of a slot may carry `mlSchema: { type: "string" }` with `value: 0` (seen in #447). With D13 such a node turns red. To check in the UI slice; if the default is contradictory, the fix belongs to the default, not to D13.
- D13 failures also show in the ListTransformerPanel marks (same walk). Accepted: the mark is true there too.

Implementation plan: [`tdd-implementation-plan.md`](./tdd-implementation-plan.md).
