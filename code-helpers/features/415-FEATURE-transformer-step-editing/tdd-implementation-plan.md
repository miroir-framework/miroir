# Issue #415 TDD implementation plan

> Testing posture: integration first, no mocks. The tree operations are pure functions in
> miroir-core, exercised by a MiroirTest `functionCallTest` suite over the real stock
> TransformerDefinitions and the default Miroir model environment. The editor behaviour is
> exercised by `reactComponentTest` cases in `ui.transformerEditor`, which render the real
> `TransformerEditor` with the real editor tree, menu and dialogs.

**Resume note:** read the progress table, then the first slice whose Status is not ✅ DONE. A accepted D14-b, D15-b and D16-a in round 2; the `getFromContext` case of Slice 7 waits for the #411 fix.

## Scope

In (analysis goals):
- **G1. Enclose without retyping.** Wrap a node in a new transformer, `mapList` first, keeping its subtree.
- **G2. Shrink without retyping.** Remove a node and keep one child, or remove a subtree.
- **G3. Change a type without losing children.** A type change keeps the attributes still valid for the new type.
- **G4. Any level.** Every operation works at the root and on nested nodes in attributes, array items and record values.

Out (analysis non-goals): undo and redo; rewriting references after a wrap or an unwrap; automatic wrap when the input switches to a list; copy, paste, move and multi-select; keeping attributes on type changes of non-transformer unions; the #411 fix itself.

## Related links

- Issue: https://github.com/miroir-framework/miroir/issues/415
- Analysis: [`analysis.md`](./analysis.md)
- Prerequisites: [#383 plan](../383-FEATURE-transformer-choice-by-input-type/tdd-implementation-plan.md), #406 (`ui.transformerEditor`), #411 (freeze, D16)
- Branch: `claude/415-transformer-step-editing`, PR against `_integration`

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Characterize the editor and the suites | ⬜ pending | baseline recorded |
| 1 | Wrap the root in `mapList` (tracer) | ⬜ pending | `fn.transformer.treeEdit` wrap cases; UI wrap case |
| 2 | Wrap at any level, slot choice, type filter | ⬜ pending | nested and multi-slot wrap cases; filtered dialog |
| 3 | Pipe into (D14) | ⬜ pending | pipe cases; filtered by the node's output |
| 4 | Unwrap: remove a node, keep a child | ⬜ pending | unwrap cases; UI unwrap with confirmation |
| 5 | Remove a subtree | ⬜ pending | remove cases per position kind; UI remove |
| 6 | Type change keeps valid attributes | ⬜ pending | merge cases; UI `filterList` to `find` keeps `predicate` |
| 7 | Use case end to end, `getFromParameters` hint (D15, D16) | ⬜ pending | UI case: one instance, then all, wrapped in `mapList` |
| 8 | Nonreg, docs, AC checklist | ⬜ pending | full `nonreg:filesystem` |

## Locked implementation defaults

Copied from the analysis decision record; deviations go in a slice's Realization.

| Decision | Default | Serves |
|---|---|---|
| D1 | A node action menu next to each `transformerType` select (Wrap in, Pipe into, Unwrap, Remove); Replace is a change of that select | G1, G2, G3 |
| D2 | Wrap slot chosen automatically when the enclosing type has one non-`applyTo` slot; the dialog shows a slot select otherwise | G1 |
| D3 | Unwrap keeps the only child, or the child picked in the dialog; disabled when the node has no transformer child | G2 |
| D4 | Type change keeps each attribute of the old node whose name exists in the new type and whose value passes `mlsTypeCheck` against it; others get the new type's defaults | G3 |
| D5 | Remove, Unwrap that drops other children, and a type change that drops attributes open a confirmation dialog naming what is lost | G2, G3 |
| D6 | No reference rewriting | G1, G2 |
| D7 | No automatic wrap on input switch | G1 |
| D8, D14 | With the restriction switch on: Wrap offers types with at least one non-`applyTo` slot that accept the position's `givenInput`; Pipe into offers types declaring `applyTo` that accept the node's `output`. Switch off: no filter | G1 |
| D9 | Positions: root, attribute, array item, record value | G4 |
| D10 | Tree logic in `miroir-core/src/2_domain/TransformerTreeEdit.ts`, whitelisted for `functionCallTest` | G1 to G4 |
| D11 | The menu renders wherever `MlLiteralEditor` renders a `transformerType` select; the type filter applies only where the caller passes `transformerTypeRestrictions` | G4 |
| D15 | After a wrap into an element slot, a hint lists the `getFromParameters` nodes reading `defaultInput` in the wrapped subtree | G1 |
| D16 | The `mapList` + `getFromContext` UI case waits for the #411 fix | G1 |

Defaults chosen while planning:
- Remove: optional attribute deleted; array item deleted; record entry deleted; required attribute reset to its default; root reset to `DEFAULT_TRANSFORMER_EDITOR_TRANSFORMER`.
- Wrap into an array slot creates a one-item array; into a record slot, a one-entry record keyed by the node's `label`, else `value`.
- Slots come from `transformerInterface.transformerParameterSchema.transformerDefinition` of the definition in `applicationTransformerDefinitions[transformerType]`: references to `transformer` or `coreTransformerForBuildPlusRuntime`, direct, in arrays, in records or in unions. `applyTo` is a slot when the definition declares it.
- Every operation returns a new value for the whole edited transformer; the editor writes it with one `setFieldValue` on the transformer's root path, so the result and the #383 marking recompute once.

## Allocated UUIDs / keys

| Element | Value |
|---|---|
| MiroirTest `fn.transformer.treeEdit` (issue 415, tags `unit`, `transformer`) | `4aa17196-37f3-4f5e-a834-b0166882d1a4` in `miroir-app-miroir/assets/miroir_data/a311f363-e238-4203-bdfc-29e8c160c26b/` |
| Export in `miroir-app-miroir/index.ts` / `index.d.ts` | `miroirTest_fn_transformer_treeEdit` |
| Core module and registry key | `miroir-core/src/2_domain/TransformerTreeEdit.ts`, `"miroir-core/2_domain/TransformerTreeEdit"` |
| Core functions | `transformerSlots`, `transformerChildren`, `wrapTransformerNode`, `pipeTransformerNode`, `unwrapTransformerNode`, `removeTransformerNode`, `keepAttributesOnTypeChange`, `wrapCandidates`, `pipeCandidates`, `parameterReadsOfDefaultInput` |
| Editor prop extension | `TransformerTypeRestriction` gains `givenInput: InputOutputType` and `output: InputOutputType` |
| Test ids | `transformer-node-actions` (menu button, `data-node-path`), `transformer-node-action-wrap`, `-pipe`, `-unwrap`, `-remove`, `transformer-node-dialog`, `transformer-node-dialog-type`, `transformer-node-dialog-slot`, `transformer-node-dialog-child`, `transformer-node-dialog-confirm`, `transformer-wrap-parameter-hint` |

Entity reused in UI cases: Entity `16dbfe28-e1d7-4f20-9ba4-c1a9873202ad` (instances have `name`), as in `ui.transformerEditor`.

## Test execution conventions

| Purpose | Command |
|---|---|
| Rebuild the deployment after MiroirTest JSON changes | `npm run build -w miroir-app-miroir` |
| Core suite | `npm run testMiroir -w miroir-core -- --suites fn.transformer.treeEdit --mode unit` |
| #383 walk (regression) | `npm run testMiroir -w miroir-core -- --suites fn.transformer.interfaceWalk --mode unit` |
| UI suite | `npm run testMiroir -w miroir-standalone-app -- --suites ui.transformerEditor` |
| Build core for the app | `npm run build -w miroir-core` |
| Typecheck | `npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json` and `-p packages/miroir-standalone-app/tsconfig.json` (40 pre-existing errors in the app, compare counts) |
| Lint | `npm run lint` |
| Scoped nonreg | `npm run nonreg:filesystem -- --runner shared --scope smoke,core,ui` |
| Model validation | `npm run miroir-env -- check --strict --tracked-clean` (after commit) |

`fn.transformer.treeEdit` runs in nonreg through the existing `unit-miroir-core` step; new `ui.transformerEditor` cases run through `unit-ui-transformerEditor`. This plan adds no nonreg step.

## Slice 0. Characterize

**Status:** ⬜ pending

Goal: a green baseline for the code the slices change.

- Run `fn.transformer.interfaceWalk`, `fn.transformer.interfaceCheck` and `ui.transformerEditor`; record pass counts and any pre-existing failure.
- Record the miroir-standalone-app `tsc` error count.
- Confirm the slot inventory of analysis §4.3 (13, 5, 12, 18) with a script over the definitions; Slice 1 turns it into test cases.

### Validation

```bash
npm run testMiroir -w miroir-core -- --suites fn.transformer.interfaceWalk,fn.transformer.interfaceCheck --mode unit
npm run testMiroir -w miroir-standalone-app -- --suites ui.transformerEditor
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json | grep -c "error TS"
```

### Realization

(pending)

## Slice 1. Wrap the root in `mapList` (tracer)

**Status:** ⬜ pending

Goal: in the TransformerEditor, the designer opens the root node's menu, picks Wrap in, chooses `mapList`, and the root becomes a `mapList` whose `elementTransformer` is the previous root.

RED:
- `fn.transformer.treeEdit` (new asset, `4aa17196-…`): `transformerSlots("mapList")` gives `elementTransformer` (non-`applyTo`) and `applyTo`; `transformerSlots("filterList")`, `("ifThenElse")`, `("returnValue")` give their slots from §4.3. `wrapTransformerNode(root, [], "mapList", "elementTransformer", defaultMapList)` returns `{ transformerType: "mapList", elementTransformer: root, … }` with the default's other attributes.
- `ui.transformerEditor`, new case "wrapping the root in mapList keeps it as the element transformer": click `transformer-node-actions` at the root, click `transformer-node-action-wrap`, choose `mapList` in `transformer-node-dialog-type`, confirm; expect the root select to show `mapList` and the select at `transformer.elementTransformer.transformerType` to show `returnValue`.

GREEN:
- `TransformerTreeEdit.ts` with `transformerSlots` and `wrapTransformerNode`; registry entry.
- `TransformerNodeActions` component in `ValueObjectEditor/`, rendered by `MlLiteralEditor` beside the select when the field is the `transformerType` discriminator. The dialog lists the select's discriminator values that have a slot. The default value of the chosen type comes from the union branch, as `handleDiscriminatorChange` builds it; extract that part into a helper both use.

Refactor checkpoint: the default-value-of-branch helper replaces the inline code in `MlLiteralEditor.handleDiscriminatorChange`.

### Validation

```bash
npm run build -w miroir-app-miroir && npm run build -w miroir-core
npm run testMiroir -w miroir-core -- --suites fn.transformer.treeEdit --mode unit
npm run testMiroir -w miroir-standalone-app -- --suites ui.transformerEditor
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npm run nonreg:filesystem -- --runner shared --scope smoke,core,ui
```

### Realization

(pending)

## Slice 2. Wrap at any level, slot choice, type filter

**Status:** ⬜ pending

Goal: Wrap works on nested nodes (attribute, array item, record value), asks for the slot when the enclosing type has several, and offers only types accepting the position's input when the switch is on.

RED:
- fn: wrap at `["elementTransformer"]`; at `["args", 1]` of a `+`; at `["definition", "a"]` of a `createObject`; wrap into `ifThenElse.then`; into `+.args` (one-item array); into `createObject.definition` (key from `label`, else `value`). `wrapCandidates(givenInput)`: for `{ type: "array", payload: entityUuid }` it includes `mapList`, `filterList` and `ifThenElse` (declared input `any`); for `"string"` it excludes `mapList`; it never includes the 30 types without a non-`applyTo` slot.
- UI: wrap the `elementTransformer` of a `mapList` in `ifThenElse`, pick slot `then` in `transformer-node-dialog-slot`; expect the nested select at `…elementTransformer.then.transformerType`. A second case: with the switch on and a string input, the dialog does not offer `mapList`; with the switch off it does.

GREEN: `wrapCandidates`; `TransformerTypeRestriction` gains `givenInput` and `output` (TransformerEditor maps them from the walk); the dialog filters with them.

Refactor checkpoint: one path helper for "node at path / replace node at path" shared by all operations.

### Validation

Same as Slice 1, plus `fn.transformer.interfaceWalk` (regression).

### Realization

(pending)

## Slice 3. Pipe into (D14)

**Status:** ⬜ pending

Goal: the designer puts a node in the `applyTo` of a new transformer, for example `sortList` over a `mapList`.

RED:
- fn: `pipeTransformerNode(root, [], "sortList", defaultSortList)` gives `{ transformerType: "sortList", applyTo: root, … }`. `pipeCandidates({ type: "array" })` includes `sortList`, `listLength`, `mapList`; `pipeCandidates("string")` includes `stringOp` and excludes `listLength`.
- UI: input in instance mode on Entity with Show All; root `getFromContext` with `referenceName` `defaultInput`; pipe it into `listLength`; the result is the number of Entity instances.

GREEN: `pipeTransformerNode`, `pipeCandidates`; menu entry `transformer-node-action-pipe`.

Refactor checkpoint: Wrap and Pipe into share the dialog; only the candidate list and the slot differ.

### Validation

Same as Slice 1.

### Realization

(pending)

## Slice 4. Unwrap: remove a node, keep a child

**Status:** ⬜ pending

Goal: the designer removes a node and one of its transformer children takes its place.

RED:
- fn: `transformerChildren` of `mapList` (element and `applyTo` when typed), `ifThenElse` (if, then, else), `+` (each arg), `createObject` (each value), `returnValue` (none). `unwrapTransformerNode(root, [], ["elementTransformer"])` returns the element. Unwrapping a nested node replaces it in its parent.
- UI: unwrap the root `mapList` from Slice 1; the root select shows `returnValue` again. Unwrap an `ifThenElse` with `then` and `else`: the dialog asks for the child and, since the unwrap drops `else`, asks for confirmation. The menu disables the entry on `returnValue`.

GREEN: `transformerChildren` (reusing the walk's child traversal from `TransformerInterfaceCheck.ts`, without types), `unwrapTransformerNode`; menu entry and dialog modes.

Refactor checkpoint: `transformerChildren` and the #383 `walkChildren` share the key traversal if that removes duplication without coupling the type rules.

### Validation

Same as Slice 1, plus `fn.transformer.interfaceWalk` if the walk traversal changed.

### Realization

(pending)

## Slice 5. Remove a subtree

**Status:** ⬜ pending

Goal: the designer removes a node and everything below it, at any position, with a confirmation.

RED:
- fn: `removeTransformerNode` on `ifThenElse.else` (optional: key deleted), `+.args[1]` (item deleted), `createObject.definition.a` (entry deleted), `mapList.elementTransformer` (required: replaced by the slot default given by the caller), root (replaced by the root default given by the caller).
- UI: remove `then` from an `ifThenElse`, confirm in `transformer-node-dialog-confirm`; the attribute is gone and the result recomputes. Cancel leaves the transformer unchanged.

GREEN: `removeTransformerNode`; menu entry; the editor computes the slot default with the Slice 1 helper.

Refactor checkpoint: check whether `MlObjectEditor.deleteElement` can call the same path helper for transformer values; leave it if it serves non-transformer values the same way.

### Validation

Same as Slice 1.

### Realization

(pending)

## Slice 6. Type change keeps valid attributes

**Status:** ⬜ pending

Goal: changing a node's `transformerType` keeps the attributes still valid for the new type and asks for confirmation when it drops some.

RED:
- fn (environment `defaultMiroirModelEnvironment`): `keepAttributesOnTypeChange(oldFilterList, defaultFind, findBranchSchema, env)` keeps `predicate` and `applyTo`, drops nothing; from `mapList` to `filterList` it keeps `applyTo` and `referenceToOuterObject` (both types declare them) and drops `elementTransformer`; from `ifThenElse` to `case` it keeps `else`, drops `if` and `then`. The result lists the dropped attribute names.
- UI: change a `filterList` to `find`; the `predicate` editor keeps its value with no dialog. Change an `ifThenElse` to `case`; the dialog names `if` and `then`; confirm keeps `else`.

GREEN: `keepAttributesOnTypeChange`; one shared `handleDiscriminatorChange` for `MlLiteralEditor` and `MlEnumEditor` that merges kept attributes when the discriminator field is `transformerType`.

Refactor checkpoint: delete the duplicate `handleDiscriminatorChange` (analysis §4.1).

### Validation

Same as Slice 1.

### Realization

(pending)

## Slice 7. Use case end to end, `getFromParameters` hint (D15, D16)

**Status:** ⬜ pending (the `getFromContext` case needs #411 fixed, D16)

Goal: the issue's use case runs in the editor, and a wrap that leaves `getFromParameters` reading the whole input says so.

RED:
- fn: `parameterReadsOfDefaultInput(subtree)` returns the paths of `getFromParameters` nodes whose `referenceName` is `defaultInput` or whose `referencePath` starts with it.
- UI, the use case: input in instance mode on Entity; root `getFromContext` with `referencePath` `["defaultInput", "name"]`; the result is one name. Click Show All; wrap the root in `mapList`; the result lists the Entity names.
- UI, the hint: same with `getFromParameters`; after the wrap, `transformer-wrap-parameter-hint` names the node.

GREEN: `parameterReadsOfDefaultInput`; the hint after a wrap into an element slot (`mapList.elementTransformer`, `filterList.predicate`, `find.predicate`).

Refactor checkpoint: none expected.

### Validation

Same as Slice 1.

### Realization

(pending)

## Slice 8. Nonreg, docs, AC checklist

**Status:** ⬜ pending

- `docs/reference/transformers.md`: a section on the node actions, next to the #383 section.
- This plan creates no issue-scoped vitest directory, so there is nothing to clean up; remove the issue number from MiroirTest descriptions only if the suite convention asks for it.
- Tracer narrative, manual: open the TransformerEditor on Entity, build `getFromContext` on `defaultInput.name`, switch to Show All, wrap in `mapList`, check the list of names; unwrap and check the single name again. Automated equivalent: the Slice 7 and Slice 4 UI cases.

AC checklist:

| Issue target | Proof |
|---|---|
| Wrap a node in a new transformer (`mapList` first) | Slices 1, 2, 7 (fn wrap cases, UI wrap cases, use case) |
| Remove a subtree | Slice 5 |
| Remove one node, keep a child | Slice 4 |
| Replace one node, keep what fits | Slice 6 |
| Any level | Slice 2 nested cases, Slices 4 to 6 nested cases |

### Validation

```bash
python scripts/sync_agent_skills.py --check
python -m pytest scripts/tests -q
python scripts/check_dependency_policy.py
npm run lint
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npm run test -w miroir-core -- ''
npm run nonreg:filesystem -- --runner shared
```

### Realization

(pending)
