# Transformer reference — business-oriented catalog

This document is a **human-oriented guide** to the stock Miroir transformers: what each one is
*for* in business terms, what it consumes, and what it produces. It complements the technical
references:

- [Transformer result schema inference](./transformer-result-schema.md) — how the output `mlSchema`
  of a transformer is derived without running it (issue #88 / Proposal B).
- [mlSchema subtyping](../../packages/miroir-core/src/1_core/mls/mlSchemaSubtype.ts) — the LSP
  subtype relation used by the compatibility checker (#250, #251).
- Dependent-types proposal:
  [dependent-types-for-transformer-composition](../proposals/dependent-types-for-transformer-composition.md).

Stock definitions live in the Miroir application deployment assets
(`packages/miroir-app-miroir/assets/miroir_data/a557419d-…/`, one JSON file per
transformer, keyed by `transformerType` in `applicationTransformerDefinitions`).

**Virtual attributes** (Entity `mlSchema` tag `virtualAttribute`) are not a transformer type.
They attach an inline transformer to an attribute so Queries, reports, and later transformers
in the same boxed query can use that name. Evaluation is **instance-local** (stored fields of
that row only — FK uuids as scalars, no JOIN) and **lazy** (computed only when the query or
display requires the name). They are never persisted. See [Entity API](./api/entity.md#virtual-attributes).

---

## Classification topics

Every transformer below is classified along four axes. Read this once; it is the legend for all
the tables that follow.

1. **Business role** — the category under which the transformer is listed in this document:
   - **Read a value** — pull data from the context, parameters, a literal, or navigate a path.
   - **Compute a scalar** — produce a number, string, boolean, uuid, date…
   - **Decide** — choose between alternatives (`ifThenElse`, `case`).
   - **Build an object** — assemble an object from other values.
   - **Transform a list — constant cardinality** — each item becomes exactly one item
     (`mapList`, `sortList`).
   - **Transform a list — reduced cardinality** — some items are dropped
     (`filterList`, `find`, `pickFromList`, `getUniqueValues`).
   - **Combine / aggregate a list** — items are merged into one thing, or the list is measured
     (`concatLists`, `aggregate`, `listLength`, `listReducerToSpreadObject`, `indexListBy`).
   - **Convert object ⇄ list** — shape-shift between an object and a list of its parts.
   - **Schema / meta-model utilities** — advanced transformers that manipulate ML schemas or
     whole application models (MLS, admin).
   - **Application examples** — transformers shipped as examples inside a specific application.

2. **Declared input** — the type the transformer officially accepts on its *piped input* (the
   `inputOutput.input` contract, from issue #249). A transformer with input `undefined` does not
   consume the piped value (it reads from the context, parameters, or nowhere). Note the piped
   input is *not* always expressed as an `applyTo` attribute — see “How transformers take input”.

3. **Declared output** — the `inputOutput.output` contract. `any` means “depends on the operands”:
   the precise type is computed by `resolveTransformerResultSchema` (e.g. `getFromContext` of the
   list row yields the row entity, `pickFromList` yields the list element).

4. **Cardinality effect** — how the shape of the value changes:
   `1→1`, `list→list (same)`, `list→list (fewer)`, `list→scalar`, `list→object`,
   `object→list`, `none→scalar`.

### How transformers take input

- **`applyTo`** — most transformers apply to a value produced by another transformer
  (their “piped input”). Example: `mapList.applyTo` produces the list to map.
- **`definition`** — templates and object builders describe their *output shape* here
  (`mustacheStringTemplate.definition` is the template string; `createObject.definition` is a
  record of key → transformer).
- **`args` / `left` / `right`** — operators take their operands as arrays or pairs
  (`numericOp.args`, `plus.args`, `boolExpr.left/right`).
- **`referenceToOuterObject`** — inside list combinators (`mapList`, `filterList`, `find`,
  `mergeIntoObject`, `createObjectFromPairs`), the name under which the *outer* value (e.g. the
  row) stays reachable inside the element transformer, via `getFromContext`.
- **`getFromContext` / `getFromParameters`** — read a value by `referenceName` or `referencePath`
  instead of consuming the pipe.

### The `inputOutput` types

`inputOutput.input` and `inputOutput.output` use coarse types (issues #249, #449), not ML schemas:

- a base type: `any`, `undefined`, `bigint`, `number`, `string`, `boolean`, `object`, `array`, `record`;
- an entity uuid, for an instance of that entity;
- `{ "type": "array", "payload": P }` and `{ "type": "record", "payload": P }`, written `array<P>` and `record<P>`;
- `{ "type": "tuple", "payload": [P1, ..., Pn] }`, written `tuple<P1, ..., Pn>`.

A type parameter `P` is `any`, `undefined`, a base scalar type, `object` or an entity uuid. Types do not nest: where an array, record or tuple would be a parameter, the type is `any` instead (an array of arrays is `array<any>`). A bare `array` or `record` is `array<any>` or `record<any>`.

Compatibility (`inputOutputTypesCompatible`, given type first):

- `any` is compatible with everything, both ways.
- An entity instance is an `object` and a `record<any>`; an `object` is not an entity.
- A `record<P>` is an `object`; an `object` is only a `record<any>`.
- A `tuple<P1, ..., Pn>` is an `array<Q>` when every `Pi` is a `Q`; an array is never a tuple; two tuples need the same length.
- Type parameters follow the same rules: `array<Book>` is an `array<object>`, not the reverse.

Inferred types (`inferTransformerOutputTypeFromSchema`) map ML `array`, `record` and `tuple` schemas to these forms, with `any` for a nested type. The list transformer panel chooses its expected output among the same forms: a select for the type, then an "of" select for `array` and `record`, or one select per element for `tuple`.

### Choosing a transformer by input type

In the TransformerEditor and the list transformer panel, the `transformerType` select at every
position of a transformer lists only the transformers whose declared input accepts the input that
position receives (issue #383). A hint next to the select gives the number of hidden transformers
and the input type. The currently selected type always stays in the list.

- **Root input**: the list row entity in the list transformer panel; in the TransformerEditor, the
  type of the "here" value or of the selected instances: a primitive kind, an entity for an object
  with a `parentUuid`, `object` otherwise, and for an array the common type of its elements
  (`array<number>`, `array<Book>`, `array<object>` for plain objects, `array<any>` when they differ).
- **Nested positions** follow the runtime: a transformer with an `applyTo` consumes the `applyTo`
  output; `mapList.elementTransformer`, `filterList.predicate` and `find.predicate` receive a list
  element; `mergeIntoObject.definition` and `createObjectFromPairs` pairs receive the `applyTo`
  value; `dataflowObject` steps receive the parent's input, with earlier steps reachable by name
  through `getFromContext`. Bound under `referenceToOuterObject`, a value is reachable by name and
  the input stays the parent's. Other slots receive the parent's input.
- **Unknown inputs are `any`** and restrict nothing; declared input `undefined`, no
  `inputOutput` and unknown types are always offered.
- Nested transformers that do not accept their input are marked at their own level (orange).
- The TransformerEditor switch "Restrict transformers to the input type" (on by default, kept for
  the browser session) shows the full lists again; the marking stays.

The core functions are `checkTransformerInterfaceRecursively` and `transformerTypesAcceptingInput`
(`miroir-core/src/2_domain/TransformerInterfaceCheck.ts`), tested by the MiroirTest
`fn.transformer.interfaceWalk`.

### Showing the types of a transformer tree

The TransformerEditor switch "Show transformer types" (off by default) puts a badge under the title
of every transformer node, and of every literal `applyTo` value (issues #453, #470). A node's badge
reads `in <given> · applyTo <its applyTo output, when different> · declared <input> → <output> ·
out <output>`; entity types show their names. The badge is green when the input the node reads
fits its declared input, red on a mismatch, grey when there is nothing to compare (no declared
input, or `any` on a side).

- Outputs come from the result schema inference (`resolveTransformerResultSchema`), reduced to
  `inputOutput` types. A `returnValue` without `mlSchema` has the type of its `value`; a
  `returnValue` whose `value` does not fit its `mlSchema` is a mismatch.
- The switch is the ViewParams attribute `showTransformerTypes`. In a component test run in the
  app, every case starts with the run's value instead: the "Show transformer types" setting next to
  the Run buttons (ViewParams `componentTestShowTransformerTypes`), fixed for the duration of the
  run. A toggle in a case changes only that case and is not saved, so the cases do not depend on
  their order or on the app's own setting.
- Only the parent's `applyTo` constrains a child today (expected types for other places: #454);
  the types are static (actual values per node: #455).

The badge status is `transformerNodeTypeStatus` in the same file, tested by
`fn.transformer.interfaceWalk`; the editor behaviour is tested by `ui.transformerEditor`.

### Editing a transformer tree step by step

Every `transformerType` select has a `⋯` menu next to it, for the node it belongs to (issue #415). Its actions change the tree around the node and keep the node's subtree:

- **Wrap in…** puts the node inside a new transformer. When the new transformer has one place for a transformer (`mapList.elementTransformer`), the node goes there; otherwise the dialog asks for the place (`then` or `else` of `ifThenElse`). An array place gets a one-item array, whose other required places get a `returnValue` (the `then` next to a `when` of `case`). A record place gets a one-entry record keyed by the node's `label`, else `value`. `applyTo` is never offered here.
- **Pipe into…** puts the node in the `applyTo` of a new transformer, for example a `mapList` piped into `sortList`.
- **Unwrap** replaces the node by one of its transformer children. With one child it applies at once; with several, the dialog asks which child to keep and names the ones it drops.
- **Remove…** deletes the node and everything below it, after a confirmation. An optional attribute, an array item or a record entry disappears; the root and a required place get the default `returnValue` of their position.

In the TransformerEditor, where Undo brings back any edit (see [Undo and redo](#undo-and-redo)), Remove and Unwrap ask nothing: Remove acts at once, and Unwrap of a node with several children lists one menu entry per child, "Unwrap: keep then (returnValue)". A `transformerType` change drops the attributes the new type does not take at once too. The other editors keep the confirmations.

With the restriction switch on, Wrap in offers the transformers that accept the input of the node's position, and Pipe into those that accept the node's output.

Changing a node's `transformerType` keeps the attributes the new type declares and accepts, such as `predicate` and `applyTo` from `filterList` to `find`. When the change drops an attribute the user edited, a dialog names the dropped attributes first. It stays quiet when the dropped attributes all hold the values of one node the editor fills in itself: the default of the old type, with or without its optional attributes, or the default of the slot holding the node (issue #447).

Wrapping a node in `mapList` does not rewrite its references. `getFromContext` on `defaultInput` then reads each element, but `getFromParameters` on `defaultInput` still reads the whole input, since only the context is rebound. A hint next to a `mapList`, `filterList` or `find` names such reads in its element transformer or predicate.

The tree operations are pure functions in `miroir-core/src/2_domain/TransformerTreeEdit.ts`, tested by the MiroirTest `fn.transformer.treeEdit`; the editor behaviour is tested by `ui.transformerEditor`.

### Showing a transformer as blocks

In the TransformerEditor, the transformer has three views: Blocks, Form and JSON (issue #498). Form is the default. The view chosen for a field is kept while the editor is open, even when an enclosing object is folded. The Blocks view also edits the transformer (issue #500, see Editing with blocks below).

- Each transformer is a block. Its header shows the transformer type, its label and its primitive parameters, such as `referenceToOuterObject`. Each place that holds a transformer (`applyTo`, `predicate`, `elementTransformer`, …) is a row inside the block.
- A literal object or list is an object or list block with one row per entry, and the transformers inside it are blocks too. An ML schema parameter is a chip labelled "ML schema". The `value` of a `returnValue` is shown quoted, since it is returned as is, never evaluated.
- A key that the TransformerDefinition does not declare is a red row marked ⚠. A `transformerType` with no TransformerDefinition is shown as JSON.
- A block's color comes from the `classification` of its TransformerDefinition: list, object, control, value, variable, operator, MLS, metaModel, admin or spreadsheet. The colors are the `components.blockEditor` attribute of the Theme: `categoryColors`, and `fallbackColor` for a category without a color. The dark Theme has its own colors.
- A transformer evaluated at build time is marked and a runtime one is not. A transformer with no `interpolation` is evaluated at build time, so it is marked too. The ViewParams attribute `blockEditorBuildMarking` chooses the mark: `dashedOutline` (the default) or `marker`, a small "build" tag. The TransformerEditor evaluates every node at runtime, so the mark does not change the result it shows.
- Each block folds with the arrow of its header, which then says how many rows are hidden. Literal objects and lists with more than 3 entries and no transformer inside start folded. The toolbar has Expand all, Collapse all and a zoom from 50 % to 150 %.

The block tree is computed by the pure functions `transformerBlockTree` and `transformerBlockOutline` (`miroir-core/src/2_domain/TransformerBlockModel.ts`), tested by the MiroirTest `fn.blockModel`. The platform test `transformerBlockModelAssets.unit.test.ts` checks that every transformer in the package assets maps to blocks and that every category has a Theme color. The view is tested by `ui.blockEditor`. Decisions and the plan of the following steps: [`code-helpers/features/497-FEATURE-visual-block-editor/`](../../code-helpers/features/497-FEATURE-visual-block-editor/analysis.md).

### Editing with blocks

In the Blocks view of the TransformerEditor, every edit writes the whole transformer once, so Undo takes it back in one step (issue #500). Each drag has a click or menu equivalent.

- **Palette.** Beside the program, the palette lists the transformer types, grouped by classification and colored like their blocks. A click arms a type (a second click disarms it). A transformer type with no TransformerDefinition is not offered.
- **Insert targets.** An empty slot, the end of a list slot (`args`, `whens`) and a new entry of a record slot (`definition` of `dataflowObject`) show a dashed target. A click puts the armed block there. A new item of a list of pairs (`whens[]`) gets a runtime `returnValue` in its other required slot.
- **Block menu.** The `⋯` button of a block has the #415 actions (Wrap in, Pipe into, Unwrap, Remove) and: Replace with the armed type (it keeps the attributes the new type takes), Switch to runtime / Switch to build, Move up / Move down for a list item, and Move to tray.
- **Tray.** A block moved to the tray leaves its slot: an optional slot is emptied, a required one gets a runtime `returnValue`. The tray sits below the program and is not saved; it survives a switch to Form or JSON. Place arms a tray block like a palette type, Discard drops it.
- **Values.** A primitive value or parameter opens an input on click or Enter. Enter or leaving the field writes it, Escape cancels. A string stays a string; any other value is read as JSON, so a number stays a number. An ML schema chip opens its JSON text in a popover. Ctrl+Z inside these fields undoes their text, not the transformer.
- **Runtime by default.** Every node the Blocks view creates gets `interpolation: "runtime"`. The Form view leaves the attribute out (absent means build), so the same edit in both views differs only there.
- **Type flags.** With Show transformer types on, each block shows its input and output types, in red with ⚠ when they do not fit. A block that does not fit is kept as written.
- **Result bubble.** A click on a block header runs that block on the editor's input and shows the result. Under `mapList`, `filterList` or `find`, the block runs once per element; a select shows one element alone. `createObjectFromPairs` and `mergeIntoObject` give their `definition` the evaluated `applyTo`, and a `dataflowObject` step sees the steps before it.
- **Drag and drop.** Palette entries, tray blocks and blocks (by their header) can be dragged onto an insert target, onto a block (to replace it with a palette type or a tray block) or onto the tray. A drag starts after a short move, so a click keeps its meaning.
- **Variables.** Under the types, the palette lists the names in scope (issue #501), in two groups: Context names, read with `getFromContext`, and Parameters, read with `getFromParameters`. A name is listed when it is visible at one block or insert target at least: the editor's input (`defaultInput`), the element bound by `mapList`, `filterList` and `find` (`referenceToOuterObject`, else `defaultInput`), the `applyTo` that `createObjectFromPairs` and `mergeIntoObject` give their `definition`, the earlier steps of a `dataflowObject`, and `aggregateValue` in the `having` of an `aggregate`. An armed variable is offered only where its name is visible: the other insert targets and Replace with entries are hidden. It puts a runtime `getFromContext` or `getFromParameters` block reading the name.
- **Variable paths.** A `getFromContext` or `getFromParameters` block reads a path. When the ML schema of the value is known (a `returnValue` step with an `mlSchema`, an Entity, …), a select lists its attributes; otherwise a text field takes an attribute name, written on Enter. ⌫ drops the last attribute. A path of one name is written as `referenceName`, a longer one as `referencePath`.

The edits are pure functions of `TransformerTreeEdit.ts` (`insertTransformerNode`, `moveTransformerNode`, `reorderTransformerNode`, `transformerInsertPositions`, `defaultTransformerNode`), tested by `fn.transformer.treeEdit`; the palette groups are `transformerPaletteGroups` (`fn.blockModel`); the bubble runs `transformerSubtreeRuns` (`miroir-core/src/2_domain/TransformerSubtreeRun.ts`, `fn.transformer.subtreeRun`). The scope rules of transformers are one table, `TRANSFORMER_SCOPE_RULES` (`TransformerScope.ts`), read by the subtree run and by `transformerEnvironmentAt` (`TransformerEnvironmentBindings.ts`), which gives the names visible at any path of a transformer; `compositeActionEnvironmentAt` (`CompositeActionScope.ts`) does the same in a composite action sequence (templates, earlier results by `actionLabel`, or by `nameGivenToResult` for a boxed query, build nodes, nested sequences, queries in a payload). The attributes of a path come from `referencePathAttributeNames` over the schemas that `checkTransformerInterfaceRecursively` reports with `withContext`. All are tested by `fn.transformer.scope`. The view is tested by `ui.blockEditing`, which is kept off the page bundle.

### Undo and redo

In the TransformerEditor, Undo and Redo sit next to the Blocks / Form / JSON switch of the transformer (issue #499). They undo and redo every edit of the transformer, whichever view made it: a form field, the JSON text, a `⋯` menu action, Clear. The other views show the restored value.

- Ctrl+Z (Cmd+Z on macOS) undoes, Ctrl+Y and Ctrl+Shift+Z (Cmd+Shift+Z) redo, when the focus is in the transformer field. In an open menu or dialog, they do nothing to the transformer.
- Text typed into one field is one step, until the focus leaves the field. Typing that comes back to the previous value adds no step. A paste, a cut, a drop and every other edit, such as a choice in a select, is a step of its own.
- Text that is not part of the transformer yet keeps the browser's own undo: the filter of an open select, the search panel of the JSON view, a record entry name being typed. In the JSON view, text that does not parse is not in the transformer either: Ctrl+Z drops it and shows the JSON of the transformer again.
- When an edit makes the transformer fail its type check, the editor shows an error in place of the transformer; Undo and Redo then sit above the editor, so the edit can still be undone.
- The history keeps the last 100 steps. Loading a stored transformer starts a new history.

The history is `ValueHistory` (deep copies of the value at one Formik path) and `ValueHistoryProvider` / `ValueHistoryScope` in `miroir-standalone-app/src/miroir-fwk/4_view/components/ValueObjectEditor/`, tested by `ui.valueHistory`.

---

## Quick reference by business role

| Role | Transformers |
|------|--------------|
| Read a value | `getFromContext`, `getFromParameters`, `returnValue`, `constantAsExtractor`, `accessDynamicPath`, `getActiveDeployment` |
| Compute a scalar | `numericOp`, `plus`, `boolExpr`, `stringOp`, `mustacheStringTemplate`, `generateUuid`, `currentDate`, `currentTimestamp` |
| Decide | `ifThenElse`, `case` |
| Build an object | `createObject`, `dataflowObject`, `mergeIntoObject`, `createObjectFromPairs`, `object_fromEntries` |
| List — constant cardinality | `mapList`, `sortList` |
| List — reduced cardinality | `filterList`, `find`, `pickFromList`, `getUniqueValues` |
| Combine / aggregate a list | `concatLists`, `aggregate`, `listLength`, `listReducerToSpreadObject`, `indexListBy` |
| Object ⇄ list | `getObjectValues`, `getObjectEntries`, `object_fromEntries`, `indexListBy` |
| Schema / meta-model utilities | `mlsTypeCheck`, `defaultValueForSchema`, `resolveConditionalSchema`, `resolveSchemaReferenceInContext`, `unfoldSchemaOnce`, `resolveTransformerResultSchema`, `ansiColumnsToMlSchema`, `spreadSheetToMlSchema`, `duplicateApplicationModel`, `entityDefinition_extractAttributes` |
| Application examples | `transformer_menu_addItem` (library app) |

*(`object_fromEntries` and `indexListBy` appear in two roles; see their sections.)*

---

## 1. Read a value

These transformers *source* data rather than transform it.

| Transformer | Business use | Declared input | Declared output | Cardinality |
|-------------|--------------|----------------|-----------------|-------------|
| `getFromContext` | Read a value from the runtime context by name (`referenceName`) or nested path (`referencePath`), e.g. the current `row`. | `undefined` | `any` (actual: the context value) | `none→1` |
| `getFromParameters` | Read a value from the build/query parameters (safe lookup with `expectedType`). | `undefined` | `any` | `none→1` |
| `returnValue` | A literal constant; optionally declares its exact `mlSchema`. | `undefined` | `any` (typed by `mlSchema`) | `none→1` |
| `constantAsExtractor` | A constant wrapped as an extractor result (mainly for tests). | `undefined` | `any` (typed by `valueMlSchema`) | `none→1` |
| `accessDynamicPath` | Navigate nested object attributes through a dynamic path (`objectAccessPath`), like `a.b[0].c`. | `object` | `any` (the value at the path) | `1→1` |
| `getActiveDeployment` | Given an application uuid, return its active deployment uuid. | `string` | `string` | `1→1` |

Example — the default identity transformer of a list panel:

```json
{ "transformerType": "getFromContext", "interpolation": "runtime", "referenceName": "row" }
```

---

## 2. Compute a scalar

| Transformer | Business use | Declared input | Declared output | Cardinality |
|-------------|--------------|----------------|-----------------|-------------|
| `numericOp` | Arithmetic (`+`, `-`, `*`, `/`) over `args`, left-to-right. | `any` | `number` | `n→1` |
| `plus` | Add numbers / bigints, or concatenate strings (`args`). | `any` | `any` | `n→1` |
| `boolExpr` | Boolean expression: `==`, `!=`, `===`, `!==`, `deepEqual`, `notDeepEqual`, `<`, `<=`, `>`, `>=`, `&&`, `\|\|`, `!`, `isNull`, `isNotNull` over `left`/`right`. | `any` | `boolean` | `n→1` |
| `stringOp` | String operations on `applyTo`: `toLowerCase`, `toUpperCase`, `trim`, `substring`, `replace`, `split`, `join`, `length`. | `any` | `any` (result schema: `string`) | `1→1` (or `list→scalar` for `length`/`join`) |
| `mustacheStringTemplate` | Render a mustache template (`definition`) with the piped value as variable context, e.g. `"Hello {{name}}"`. | `string` | `string` | `1→1` |
| `generateUuid` | New UUID v4. | `undefined` | `string` (uuid) | `none→1` |
| `currentDate` | Today’s date, ISO `YYYY-MM-DD`. | `undefined` | `string` | `none→1` |
| `currentTimestamp` | Now, ISO 8601 timestamp. | `undefined` | `string` | `none→1` |

---

## 3. Decide

| Transformer | Business use | Declared input | Declared output | Cardinality |
|-------------|--------------|----------------|-----------------|-------------|
| `ifThenElse` | Evaluate `if` (usually a `boolExpr`); return `then` when true, `else` when false. Both branches optional. | `any` | `any` (the chosen branch) | `1→1` |
| `case` | SQL-like `CASE WHEN`: match a `discriminator` value against `whens` (`when` / `then` clauses), optional `else`. | `any` | `any` (the matched branch) | `1→1` |

---

## 4. Build an object

| Transformer | Business use | Declared input | Declared output | Cardinality |
|-------------|--------------|----------------|-----------------|-------------|
| `createObject` | Build an object from a `definition` record: each key maps to a transformer producing its value. Attributes are evaluated independently (no piped input; inner transformers read context / `defaultInput` when they need the enclosing value). | `undefined` | `object` | `none→object` |
| `dataflowObject` | Build an object in *steps*: `definition` keys are evaluated in order and later steps can read earlier results from the context. | `object` | `object` | `1→1` |
| `mergeIntoObject` | Start from `applyTo` (usually the row) and merge / override attributes declared in `definition`. The idiomatic “return the row, enriched with computed fields”. | `any` | `object` | `1→1` |
| `createObjectFromPairs` | Build an object from an array of `{attributeKey, attributeValue}` pairs with templating (useful when attribute *names* are dynamic). | `any` | `object` | `1→1` |
| `object_fromEntries` | Build an object from an array of `[key, value]` pairs — `Object.fromEntries()`. Inverse of `getObjectEntries`. | `array` | `record` | `list→object` |

Example — enrich a Book row with a computed label:

```json
{
  "transformerType": "mergeIntoObject",
  "applyTo": { "transformerType": "getFromContext", "referenceName": "row" },
  "definition": {
    "transformerType": "createObject",
    "definition": {
      "label": {
        "transformerType": "mustacheStringTemplate",
        "definition": "{{name}} ({{year}})"
      }
    }
  }
}
```

`mergeIntoObject.definition` is the overlay transformer (typically `createObject`). It does **not** take the row as piped input. The `applyTo` result is bound into context as `defaultInput` (or `referenceToOuterObject` when set) so nested transformers can `getFromContext` it if they need it.

---

## 5. Transform a list — constant cardinality

Every input item yields exactly one output item; the list keeps its length.

| Transformer | Business use | Declared input | Declared output | Cardinality |
|-------------|--------------|----------------|-----------------|-------------|
| `mapList` | Apply `elementTransformer` to every item of `applyTo`. Inside the element transformer, the item is the piped input; the outer value stays reachable as `referenceToOuterObject`. | `array` | `array` (of transformed elements) | `list→list (same)` |
| `sortList` | Sort `applyTo` by an `orderBy` attribute (or primitive value), direction via `orderByDirection` (default ascending). | `array` | `array` | `list→list (same)` |

Example — extract the title of every Book:

```json
{
  "transformerType": "mapList",
  "applyTo": { "transformerType": "getFromContext", "referenceName": "row" },
  "elementTransformer": {
    "transformerType": "mustacheStringTemplate",
    "definition": "{{name}}"
  }
}
```

---

## 6. Transform a list — reduced cardinality

| Transformer | Business use | Declared input | Declared output | Cardinality |
|-------------|--------------|----------------|-----------------|-------------|
| `filterList` | Keep items of `applyTo` for which `predicate` (a transformer returning boolean) is true. | `array` | `array` | `list→list (fewer)` |
| `find` | First item of `applyTo` matching `predicate`; `undefined`/`null` if none. | `array` | `any` (the element) | `list→1` |
| `pickFromList` | Item of `applyTo` at `index`. | `array` | `any` (the element) | `list→1` |
| `getUniqueValues` | Deduplicate `applyTo`; optional `attribute` dedupes on that attribute. | `array` | `array` | `list→list (fewer)` |

---

## 7. Combine / aggregate a list

| Transformer | Business use | Declared input | Declared output | Cardinality |
|-------------|--------------|----------------|-----------------|-------------|
| `concatLists` | Concatenate the `lists` (each must resolve to an array) into one list, in order. | `array` | `array` | `lists→list` |
| `aggregate` | Aggregate `applyTo` with `function` (`count`, `sum`, `avg`, `min`, `max`, `json_agg`, `json_agg_strict`), optional `distinct`, `groupBy` attributes and `having` clause. Without `groupBy` returns one row `{aggregate: value}` (or `{function: value}`); with `groupBy` returns one row per group: group attributes + aggregate value. | `array` | `array` (of aggregate rows) | `list→list (much fewer)` |
| `listLength` | Number of items in `applyTo`. | `array` | `number` | `list→scalar` |
| `listReducerToSpreadObject` | Merge a list of objects into one spread object (later items override earlier keys). | `array<object>` | `object` | `list→object` |
| `indexListBy` | Index a list into a dictionary keyed by `indexAttribute` — `{ item[indexAttribute]: item }`. | `array<object>` | `record` (result schema: record of items) | `list→object` |

---

## 8. Convert object ⇄ list

| Transformer | Business use | Declared input | Declared output | Cardinality |
|-------------|--------------|----------------|-----------------|-------------|
| `getObjectValues` | All values of an object, as an array. | `object` | `array` | `object→list` |
| `getObjectEntries` | `[key, value]` pairs of an object, as an array. | `any` | `array` | `object→list` |
| `object_fromEntries` | Inverse of `getObjectEntries`: array of pairs → object. | `array` | `record` | `list→object` |
| `indexListBy` | List → dictionary (see section 7). | `array<object>` | `record` | `list→object` |
| `pivot` | Relational pivot: rows → matrix. One output row per distinct `rowKeyAttribute` value, one attribute per `columnKeyAttribute` value. Cells = plucked `valueAttribute`, or existence `true` when absent. Missing (row, column) pairs get `fillValue` (default `false` in existence mode; default `null` ⇒ **absent key** — null cells are sparse). `columns` (transformer resolving to `string[]`, e.g. `returnValue` wrapping a literal, or `getFromContext`) pins the column set and restricts input rows to it; omitted ⇒ data-derived. `onDuplicates` (`first`/`last`/`count`/`sum`/`min`/`max`, default `first`) resolves duplicate (row, column) pairs; aggregates are rejected in existence mode. SQL: conditional aggregation (`jsonb_object_agg` over a filled grid CTE), deterministic first-appearance row order. Issue #265. | `array` | `array` (of matrix rows) | `list→list (reshaped)` |
| `unpivot` | Relational melt: rows → long format `{...idColumns, [nameInto]: column, [valueInto]: value}` (defaults `"column"` / `"value"`). Absent keys are skipped; explicit `null` values are kept. `columns` (transformer resolving to `string[]`) restricts the melted keys; omitted ⇒ each row melts its own keys minus `idColumns`. `nameInto`/`valueInto` colliding with `idColumns` is an error. SQL: `LATERAL jsonb_each`. Issue #265. | `array` | `array` (long rows) | `list→list (longer)` |

---

## 9. Schema / meta-model utilities

Advanced transformers operating on ML schemas or whole application models. Mostly used inside the
Miroir application itself (MLS = Miroir Meta-Language Schema), not in ordinary report/action logic.

| Transformer | Business use | Declared input | Declared output |
|-------------|--------------|----------------|-----------------|
| `mlsTypeCheck` | Validate a value object against a ML schema (`mlSchema`), returning a type-check result. | `object` | `object` |
| `defaultValueForSchema` | Generate a default value object conforming to a ML schema (`mlSchema`). | `object` | `any` |
| `resolveConditionalSchema` | Resolve an `ifThenElse` schema declaration against a value object to the concrete schema. | `object` | `object` |
| `resolveSchemaReferenceInContext` | Resolve a `schemaReference` within a relative reference context. | `object` | `object` |
| `unfoldSchemaOnce` | Unfold a ML schema one level, resolving immediate references. | `object` | `object` |
| `resolveTransformerResultSchema` | Infer the output `mlSchema` of a nested `transformer` without evaluating it (the design-time API — see [transformer-result-schema.md](./transformer-result-schema.md)). | `object` | `object` |
| `ansiColumnsToMlSchema` | Convert `information_schema.columns` rows into a ML object schema (nullable → `optional`, JSON columns → open object). | `array` | `object` |
| `spreadSheetToMlSchema` | Convert spreadsheet contents into an ML schema. | *(none declared)* | *(schemaReference)* |
| `duplicateApplicationModel` | Duplicate an application model, rewriting the application uuid throughout. | `object` | `object` |
| `entityDefinition_extractAttributes` | Extract attribute definitions from an Entity (`16dbfe28-…` = the Entity entity). | Entity (uuid-typed) | `array` |

---

## 10. Application examples

| Transformer | Business use | Declared input | Declared output |
|-------------|--------------|----------------|-----------------|
| `transformer_menu_addItem` | Library-app example: add a MenuItem to an existing Menu (parameters: `menuReference`, `menuItemReference`, insertion indices). | Menu (uuid-typed) | Menu (uuid-typed) |

---

## Notes and gotchas

- **`any` output means “derived, not fixed”** — use
  [`resolveTransformerResultSchema`](./transformer-result-schema.md) (or the #251 mlSchema display
  in the list transformer panel) to see the precise type. Example: `getFromContext` of the list
  row is declared `any` but actually yields the row entity.
- **`interpolation: "build" | "runtime"`** — transformers may be evaluated at build time (on the
  model) or at runtime (on the data); the distinction is per instance, not per transformer type.
  A transformer with no `interpolation` is evaluated at build time. At the build step, a runtime
  transformer is returned unchanged with everything below it, so a build transformer under a
  runtime one is evaluated at runtime.
- **`referenceToOuterObject`** — inside list combinators (`mapList` / `filterList` / `find`),
  the element transformer's *piped* input is the list element; the outer value stays reachable
  via `getFromContext` under `referenceToOuterObject` (the list panel uses `"row"`).
  `mergeIntoObject` / `createObjectFromPairs` instead bind `applyTo` into **context** under
  that name (or `defaultInput`); the overlay/`createObject` itself does not consume a pipe.
- **SQL parity** — most library-implemented transformers have an SQL counterpart
  (`sqlImplementationFunctionName`, e.g. `sqlStringForMapperListToListTransformer`), so they can be
  pushed down to Postgres queries; transformers without one (marked `-` / `TODO` / `N/A` above and
  in the definitions) run in memory only.
- **`pivot`/`unpivot` (#265)** — canonical use case: a rights matrix from `MiroirRight` rows
  (`rowKeyAttribute: "miroirUser"`, `columnKeyAttribute` = deployment uuid, existence cells).
  Caveats: in SQL mode `applyTo` must be `constant`/`returnValue`/`getFromContext`/`getFromParameters`
  (shape the query with named extractors); a `columns` object list must be plucked first
  (`mapList` + `accessDynamicPath`); null cells are sparse (absent keys) in pivot output;
  `unpivot` within-row key order follows insertion order in memory but jsonb key order in SQL;
  fill-dense `pivot` ∘ `unpivot` is not a round-trip (synthetic fill cells become real rows).
- **`dataflowSequence`** is a structural container (array of steps) and has no stock definition of
  its own; see [transformer-result-schema.md](./transformer-result-schema.md).
