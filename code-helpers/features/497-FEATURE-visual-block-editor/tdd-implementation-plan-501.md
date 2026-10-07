# Issue #501 — TDD Implementation Plan

> Vertical TDD slices (RED → GREEN each), integration-first per `docs/contributing/testing.md`.
> Scope rules are pure miroir-core functions tested with `fn.*` MiroirTest cases; the variable
> blocks with `ui.blockEditing` component cases over the real TransformerEditor. No mocks.
>
> **Execution model:** one green commit per slice, pushed to the working branch. Each slice ends
> with its Validation commands; on success its Realization is appended and its Status flips to ✅.

Analysis: [`./analysis.md`](./analysis.md) (parent issue #497, G4, §4.1, §4.5, §6.1 row #501) · Issue: https://github.com/miroir-framework/miroir/issues/501
Working branch: `claude/501-block-editor-variables`

**Resume note:** plan written 2026-10-07 from `_integration` at `1b91068` (#500 merged).

---

## Scope

- **G4 — Use names in scope.** The block view offers the names visible at a slot as variable blocks, in two groups: context names (`getFromContext`) and parameter names (`getFromParameters`).
- One table of scope rules in miroir-core, read by the name walk and by the subtree run of #500.
- Names in scope at any position of a transformer, filled, empty or default-filled, and inside a composite action sequence (templates, earlier results, Runner form values, a nested sequence, a query in a payload), and in the body of a composite TransformerDefinition (its parameters).
- A variable block has a path picker: the attributes of the inferred schema of the value (#88) when it is known, free text otherwise.

This plan does not add define blocks (#502) nor the block view of action sequences (#504); it gives them the scope functions.

---

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | One table of scope rules; `aggregate.having` | ✅ | `fn.transformer.subtreeRun`, TransformerEnvironmentBindings unit tests |
| 1 | Names in scope at a position of a transformer | ✅ | `fn.transformer.scope` transformer cases |
| 2 | Names in scope in a composite action sequence | ✅ | `fn.transformer.scope` sequence cases |
| 3 | Variable blocks in the palette | ✅ | `ui.blockEditing` variable cases |
| 4 | The path picker of a variable block | ⬜ | `ui.blockEditing` path case (AC 2) |
| 5 | Unbound Runner references, nonreg, docs, AC | ⬜ | issue filed, nonreg, AC checklist |

---

## Locked implementation defaults

| Decision | Choice | Serves |
|---|---|---|
| One table | `TransformerScope.ts` (2_domain) holds `TRANSFORMER_SCOPE_RULES`: transformer type → slot → binding. `eachElement` (filterList, find predicate: a list, bound to `referenceToOuterObject`, default `defaultInput`), `eachElementOrValue` (mapList elementTransformer: a list or an object), `applyTo` (createObjectFromPairs and mergeIntoObject definition: the evaluated applyTo, once), `earlierSteps` (dataflowObject definition), `fixedName` (aggregate having: `aggregateValue`, once per group). `TransformerSubtreeRun` and `TransformerEnvironmentBindings` read it. The #249 interface walk keeps its own code: it carries schemas, not names, and #454 is reworking it. | §4.1 |
| Names at a position | `transformerEnvironmentAt(root, path, rootEnvironment)` returns `{contextNames, parameterNames}` for any path, whether a node sits there or not, by walking the path from the root through the table. The existing `collectTransformerEnvironmentBindings` (ListTransformerPanel) stays, on the table. | issue bullets 1, 3 |
| Build and runtime | In a plain transformer every node is evaluated at step runtime (TransformerEditor, composite bodies), so one environment. In a composite action, a build node (no `interpolation`, or `build`) is evaluated while the sequence resolves, with the parameters and the templates as parameters and no context; a runtime node sees the parameters as parameters and parameters, templates and earlier results as context (`DomainController.handleCompositeActionTemplate`, `ResolveCompositeActionTemplate.ts`). The function keeps both environments along the path and picks by the node's own interpolation; an empty slot is runtime, as the block view creates runtime nodes. | analysis §4.2, §4.5 |
| Sequences | `compositeActionEnvironmentAt(action, path, rootEnvironment)`. Template `t`: context = parameters + templates before `t`. Action `i`: earlier results are the `actionLabel` of each earlier action other than `compositeRunTestAssertion`, plus `nameGivenToResult` of earlier `compositeRun*` actions. A nested `compositeActionSequence` starts with no earlier results and no templates of its parent. Inside `payload.query` of a boxed query action, parameters are the query's `queryParams` and `pageParams` keys, context is its `contextResults` keys, the action's context, the extractors and combiners, and the runtime transformers before it. | issue bullet 2 |
| Root environments | `runnerEnvironment(runnerName)` puts the form values under the Runner's name (`RunnerView` keys them so); `transformerDefinitionBodyEnvironment(definition)` gives a composite body its parameters as context names (`transformer_extended_apply` passes them so); the TransformerEditor root gives the keys of its input as both. | issue bullet 1 |
| Palette | A "Variables" section under the types, with two groups, Context and Parameters: the names visible at one insert position or block of the tree at least. A click arms a variable; while it is armed, only the insert targets and blocks where the name is visible are offered. The node is `{transformerType: getFromContext \| getFromParameters, interpolation: runtime, referenceName}`. Departure from "at the selected slot": the block view has no slot selection, so the armed variable filters the targets instead. | issue first paragraph |
| Path picker | On a `getFromContext` / `getFromParameters` block: its segments, a select of the attributes of the schema at the end of the path, a free-text field when the schema has none, and a button that drops the last segment. The schema comes from the #249 walk, which now reports the ML context of each node (`TransformerInterfaceNodeReport.context`). Adding a segment to `referenceName: n` writes `referencePath: [n, segment]`; dropping back to one segment writes `referenceName`. | issue bullet 4 |
| Unbound Runner references | Filed as an issue (createApplication Runner reads `getFromParameters ['deployApplication', …]`), linked from #501, before #505. | issue "Known unbound references" |

---

## Slice 0 — One table of scope rules; `aggregate.having`

RED: `fn.transformer.subtreeRun` case "the having of an aggregate runs once per group, with aggregateValue". GREEN: `TransformerScope.ts`, SubtreeRun and EnvironmentBindings on the table, `fixedName` binding.

Validation: `npm run testMiroir -w miroir-core -- --suites fn.transformer.subtreeRun --mode unit`; `RUN_TEST=TransformerEnvironmentBindings npm run testByFile -w miroir-core -- TransformerEnvironmentBindings`.

**Realization (2026-10-07).** `TransformerScope.ts` exports `TRANSFORMER_SCOPE_RULES`, `transformerScopeBinding`, `namesBoundBy`, `outerObjectName` and `AGGREGATE_VALUE_NAME`. `TransformerSubtreeRun` reads the table; its `eachAggregateGroup` runs the aggregate without its `having` and binds each row's value under the function name (`aggregate` when there is none), as the handler does. `collectTransformerEnvironmentBindings` reads the table too: the binding of a slot applies to everything below it, in lists and plain records, which also covers `createObjectFromPairs` `attributeKey` / `attributeValue` that the old walk matched by key. The new subtreeRun case failed before the change (no `aggregateValue` in the context); 14 subtreeRun cases and 6 environment-binding tests pass.

## Slice 1 — Names in scope at a position of a transformer

RED: new off-page instance `fn.transformer.scope`, suite `transformerEnvironmentAt`: the element slot of mapList (outer name, custom name), the predicate of filterList, a dataflowObject step (earlier steps only), an empty optional slot, the definition of createObjectFromPairs, the having of aggregate, a path inside a returnValue (no transformer: the enclosing node's names), the root. GREEN: `transformerEnvironmentAt`.

**Realization (2026-10-07).** `transformerEnvironmentAt` sits in `TransformerEnvironmentBindings.ts`, beside the `TransformerEnvironment` type, and is whitelisted under `miroir-core/2_domain/TransformerEnvironmentBindings`. `fn.transformer.scope` (`50cf75d1-…`, off the page like `fn.transformer.subtreeRun`) has 12 cases; miroir-core exports the function and the scope table. A new `dataflowObject` entry (a key not yet in the record, as the insert position `definition.value`) sees every step.

## Slice 2 — Names in scope in a composite action sequence

RED: suite `compositeActionEnvironmentAt`: a template sees the templates before it; an action sees parameters, templates and earlier results by `actionLabel` and `nameGivenToResult`; a build node sees templates as parameters and no context; a nested sequence starts afresh; a runtime transformer of a boxed query sees its query parameters, extractors and earlier runtime transformers; `runnerEnvironment`; `transformerDefinitionBodyEnvironment` on `entityDefinition_extractAttributes`. GREEN: the functions.

**Realization (2026-10-07).** `CompositeActionScope.ts` exports `compositeActionEnvironmentAt` and `runnerEnvironment`; `transformerDefinitionBodyEnvironment` sits in `TransformerEnvironmentBindings.ts`. Inside an action or a query, the rest of the path goes through `transformerEnvironmentAt`, so the transformer rules apply there unchanged. A query is recognised by a `query` key holding `queryParams`, `extractors` or `runtimeTransformers`. The caller's context (a test's `actionContext`) reaches nested sequences, as on the test path; the Runner path gives none. The definition-body case uses a minimal interface rather than the `entityDefinition_extractAttributes` instance. 13 cases, 25 in `fn.transformer.scope`.

## Slice 3 — Variable blocks in the palette

RED: `ui.blockEditing` "a context variable from the palette goes only where it is visible": a mapList, arm `defaultInput` … and the element name, the targets offered, the node written.

**Realization (2026-10-07).** `ArmedBlock` gains `{kind: "variable", source, name}`; `BlockEditing` gains `rootEnvironment` (the keys of the TransformerEditor's run input, as context and parameters), `variables` (the names visible at a block or insert position at least, from `collectTransformerEnvironmentBindings` and `transformerEnvironmentAt`) and `accepts(source, path)`. Insert targets and Replace with hide where an armed variable is not visible, and `insertAt` / `replaceAt` refuse it there, which covers drops. A variable replaces a block whole, as a tray block does. Palette groups `block-palette-variables:<context|parameters>`, entries `block-palette-variable:<source>:<name>`, colored as the `variable` category. Three `ui.blockEditing` cases (169 component leaves); the target case fails with the filter removed.

## Slice 4 — The path picker

RED: `ui.blockEditing` "a variable block with a path picked from the schema evaluates to the attribute" (AC 2): dataflowObject with a typed step, a new entry, the step as variable, the attribute from the picker, the result bubble shows the value; and free text where the schema has no attributes.

## Slice 5 — Unbound Runner references, nonreg, docs, AC

File the Runner issue; `docs/reference/transformers.md` "Editing with blocks" gets variables; nonreg:filesystem; AC check.
