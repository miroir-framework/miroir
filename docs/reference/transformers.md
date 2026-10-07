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
- A transformer evaluated at build time is marked and a runtime one is not. A transformer with no `interpolation` is evaluated at build time, so it is marked too, unless its place makes it run at runtime (#504): below a runtime transformer, which returns it unevaluated at build, or among the `templates` of an action sequence. The ViewParams attribute `blockEditorBuildMarking` chooses the mark: `dashedOutline` (the default) or `marker`, a small "build" tag. The TransformerEditor evaluates every node at runtime, so the mark does not change the result it shows.
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

### Composite TransformerDefinitions: define blocks and Save

An application can define its own transformers (issue #502): a TransformerDefinition whose `transformerImplementation` is `{ transformerImplementationType: "transformer", definition: <body> }` is a composite. It is stored in the application's model section (Miroir's TransformerDefinitions are in its data section). Its parameters, declared in `transformerInterface.transformerParameterSchema.transformerDefinition`, are evaluated first and bound in the context of its body, which reads them with `getFromContext` or with the tags of a `mustacheStringTemplate` interpolated at runtime (`{{book.title}}` reads `book`).

- **Registry.** `transformerDefinitionRegistry(modelEnvironment)` gives Miroir's stock TransformerDefinitions plus the application's composites, by name. A stock name wins: an application definition named like a stock transformer is left out (`transformerDefinitionRegistryConflicts` lists it). The runtime, the type checks, the #88 result inference, the tree edits and the palette read it. The deployment schema gets one branch per composite in `coreTransformerForBuildPlusRuntime`, so the form and the transformerType selects accept it too.
- **Save as TransformerDefinition.** In the TransformerEditor, Save as TransformerDefinition asks a name and creates a composite whose body is the edited transformer. Its parameters are the names the transformer reads from the context and does not bind itself (`freeContextNames`), each a slot taking a value or a transformer; its result schema is inferred (#88) from the parameters' declared value types, `any` when it cannot be. It is created in the editor application's model in a transaction, committed with the other model changes; an application created before #502 gets its TransformerDefinition collection on that first commit. A name already in the registry is refused, and so is a parameter named `transformerType`, `interpolation` or `label`, the fields every transformer has. The new transformer is in the palette at once.
- **Define block.** When the TransformerEditor edits a stored composite ("defined" mode), the Blocks view shows its body under a define header: `define <name>` and its parameters. A parameter is a variable of the body: a click arms it, a drag takes it. ✎ renames it and rewrites the reads of the body that see it; a read under a binding of the same name (a `mapList` element, a `dataflowObject` step, …) is left as is, and a rename into a name bound where the parameter is read is refused. × removes a parameter the body does not read; + parameter adds one. The body is evaluated at runtime, so no block of it is marked build. Save `<name>` writes the body and the parameters back, with the result schema inferred again. Undo covers the body, not the parameter list; an unsaved parameter change is dropped when another definition is chosen.
- **Limits.** miroir-server runs actions and queries with Miroir's stock transformers only, and the Postgres SqlGenerator refuses an application composite with `QueryNotExecutable` ("transformerType not found in applicationTransformerDefinitions"): issue #519.

The registry is `TransformerDefinitionRegistry.ts`; the parameter edits and `compositeTransformerDefinition` are `TransformerDefinitionEdit.ts` (`renameTransformerParameter`, `addTransformerParameter`, `removeTransformerParameter`, `transformerDefinitionParameterUses`), all in `miroir-core/src/2_domain/` and tested by `fn.transformer.registry`. The view is tested by the `ui.blockEditing` suite "TransformerEditor on an application with a composite".

### Undo and redo

In the TransformerEditor, Undo and Redo sit next to the Blocks / Form / JSON switch of the transformer (issue #499). They undo and redo every edit of the transformer, whichever view made it: a form field, the JSON text, a `⋯` menu action, Clear. The other views show the restored value.

- Ctrl+Z (Cmd+Z on macOS) undoes, Ctrl+Y and Ctrl+Shift+Z (Cmd+Shift+Z) redo, when the focus is in the transformer field. In an open menu or dialog, they do nothing to the transformer.
- Text typed into one field is one step, until the focus leaves the field. Typing that comes back to the previous value adds no step. A paste, a cut, a drop and every other edit, such as a choice in a select, is a step of its own.
- Text that is not part of the transformer yet keeps the browser's own undo: the filter of an open select, the search panel of the JSON view, a record entry name being typed. In the JSON view, text that does not parse is not in the transformer either: Ctrl+Z drops it and shows the JSON of the transformer again.
- When an edit makes the transformer fail its type check, the editor shows an error in place of the transformer; Undo and Redo then sit above the editor, so the edit can still be undone.
- The history keeps the last 100 steps. Loading a stored transformer starts a new history.

The history is `ValueHistory` (deep copies of the value at one Formik path) and `ValueHistoryProvider` / `ValueHistoryScope` in `miroir-standalone-app/src/miroir-fwk/4_view/components/ValueObjectEditor/`, tested by `ui.valueHistory`.

### Blocks in every instance editor

The Blocks / Form / JSON switch is on every transformer field of an instance editor, not only in the TransformerEditor (issue #503): the instances of TransformerDefinition, Query, Report, Runner, Endpoint and MiroirTest, and of any Entity whose ML schema holds a transformer.

- **Which fields.** A field gets the switch when the type check resolved it to a transformer: a field declared as one, or as its template form (`applyTransformer` of a Query or Report combiner), or a union whose value took the transformer branch (a template hole such as `parentUuid` holding a transformer; a plain `parentUuid` gets none). A transformer inside another transformer, a template hole's included, is shown in that one's blocks and gets no switch of its own. A composite action sequence gets the switch too, and the transformers inside it are shown in its blocks (#504, below).
- **No input.** Outside the TransformerEditor there is no current input or root environment: a click on a block header shows no result, root types are `any` and the palette lists no variables. The blocks and the palette know the transformers of the edited application (#502 composites), from its model environment.
- **Read-only editors.** In a read-only editor, the Blocks view shows the transformer and does not edit it.
- **Undo and redo.** An editable instance editor has Undo and Redo above its form, for the whole instance, whichever field and view made the edit; Ctrl+Z and Ctrl+Y work anywhere in the form. Opening another instance in the same editor starts a new history. The TransformerEditor keeps its own history, as above.

The field rule is `isBlockViewRoot` (`miroir-core/src/2_domain/BlockViewFields.ts`), tested by `fn.blockView.fields` and, on the key map of a real type check, by `blockViewFields.typeCheck.unit.test.ts`. The Report test `report.queryDetails` edits a Query's runtime transformer as blocks in Miroir's QueryDetails Report, saves it, undoes and redoes the edit, and shows a transformer the Library defines as a block of its own.

### Action sequences as blocks

A composite action sequence (a Runner's `compositeActionSequence`, an Endpoint action implemented by a `compositeActionTemplate`, a MiroirTest sequence) shows as stacked command blocks (issue #504). In an editor that can write it, the blocks edit it (#505, see Editing action sequences below).

- **Which fields.** A field declared as `compositeActionSequence`, `compositeActionSequenceTemplate` or `compositeActionTemplate` gets the Blocks / Form / JSON switch, and so does an `any` field the type check resolves to one (Endpoint `actionImplementation.definition`). Nothing below it gets a switch of its own.
- **Steps.** Each step is a command block. Its header shows the action type, the name of the Endpoint that declares it, its `actionLabel` and its primitive attributes, such as `nameGivenToResult`. Its rows are its other attributes, then those of its `payload`: first the ones the Endpoint action declares, in their order, then the others, marked ⚠. Payload rows hold transformer, object and list blocks as in a transformer.
- **Sequences.** A sequence shows its `templates` first, then its steps stacked below. A step that is itself a sequence is a sequence block.
- **Queries.** The payload of `compositeRunBoxedQueryAction` and `compositeRunBoxedQueryTemplateAction` is one folded block named by its query type; unfolded, it shows the query's JSON.
- **Unknown actions.** A step whose action type no Endpoint declares is shown as JSON.
- **Marks.** Templates are resolved at step runtime, so their transformers are not marked build, whatever their `interpolation`.

Steps are looked up by `actionType` in the Endpoint actions of the model environment: Miroir's Endpoints first, then the application's (`endpointActionRegistry`, `miroir-core/src/2_domain/EndpointActionRegistry.ts`). The block tree is `blockTree` and `blockOutline` (`TransformerBlockModel.ts`); both are tested by `fn.blockModel` ("action registry", "action sequences"). `transformerBlockModelAssets.unit.test.ts` checks that every sequence in the package assets maps to one command block per action. The view is tested by the `ui.blockEditor` suite "createEntity Runner".

### Editing action sequences

The Blocks view edits an action sequence as it edits a transformer (issue #505): every edit writes the whole sequence once, and Undo takes it back.

- **Actions in the palette.** When the value is an action, the palette lists the Endpoint actions first, one group per Endpoint, then the transformer types. A click arms an action, a drag takes it. An action goes only at a step of a sequence (the `+` at the end of its steps), and nothing else goes there; a drag that would move a step into a payload, or a payload block to a step, leaves the sequence as it is. A new step is the action with its Endpoint, a free `actionLabel` (the type, numbered when taken: results are bound by label) and the defaults of its payload; in the sequence editor, an instance action gets the edited application.
- **The assertion.** `compositeRunTestAssertion` is offered only in a test sequence (a field declared `compositeActionSequence`: MiroirTest, Test). Runners and Endpoint actions refuse it at run time, so their palette leaves it out.
- **Step menu.** The `⋯` button of a step has Replace with (an armed action), Move up, Move down, Move to tray and Remove. Its label is renamed in place: a label another action has is refused, and the reads of the step's result in the sequence follow the new label.
- **Payloads.** A payload attribute the action declares and the step lacks is an empty slot. Any literal, object or list below a payload or a template can be replaced by the armed transformer or variable (the `⇄` target): the runner resolves every step at run time, so a transformer can sit anywhere there. The payload of a query step stays one block.
- **Keys.** The key of a record entry (an object, the `definition` of `createObject`, a template) is renamed in place: a new entry is named `value` (`template` for a template) until it is. A taken or empty key is refused. A template's reads in its sequence follow its new name. Reads in quoted values (`returnValue`) are not rewritten, and a name rebound inside the sequence (a `mapList` element named as a label) is not told apart.
- **Variables.** The names a sequence binds (its templates, the results of its earlier steps) are the variables of the palette, offered where they are visible (`compositeActionEnvironmentAt`).

The edits are `blockInsertPositions`, `insertBlockNode`, `removeBlockNode`, `moveBlockNode`, `renameBlockKey`, `renameSequenceName`, `defaultActionNode` and `actionPaletteGroups` (`miroir-core/src/2_domain/ActionSequenceEdit.ts`), tested by `fn.blockModel` ("sequence editing"). The view is tested by the `ui.blockEditing` suite "editing a Runner sequence".

### Runners: the "when run" hat and the sequence editor

A custom Runner's sequence shows under a "when run" hat: the Runner's label and its form fields (#505). The Runner gives its form values to its sequence under its name, so a field `f` of the Runner `r` is read as `getFromParameters` `[r, f]`.

- **Form fields.** A field chip arms a runtime read of it, a drag takes it, as the palette's variables. In an instance editor of a Runner, the fields are shown, not edited: they are edited in `formMLSchema`. In the sequence editor, `+ field` adds one (a name and a type: string, number, boolean or uuid), ✎ renames one and rewrites the reads of the sequence, and × removes one the sequence does not read.
- **Sequence editor.** The Tools page has a sequence editor below the TransformerEditor. It edits a new sequence, or the sequence of a custom Runner of the editor application, with the Blocks / Form / JSON switch and Undo. The Runner's form is part of the edited value, so one Undo takes back a field change and its reads together. Another application of the Tools page starts the editor afresh. `Save <name>` updates the chosen Runner. `Save…` opens the save dialog of a new sequence: "create Runner" creates a Runner of the application, named and labelled there (the reads of the form follow the new name, in the sequence and in a form given by a transformer, which is kept); "create Action" creates an Endpoint action (see below). The Runner is saved in the application's section for Runners, in a transaction for a model section, which the user commits as any other model change. A saved Runner runs below the editor, with its form.

The hat's functions are `runnerHat`, `addRunnerFormField`, `renameRunnerFormField`, `removeRunnerFormField`, `renameRunner` and `newCustomRunner` (`miroir-core/src/2_domain/RunnerHat.ts`), tested by `fn.blockModel` ("runner hat"). The view is tested by the `ui.blockEditing` suites "the when run hat" and "a Runner in an instance editor", and the sequence editor by the `ui.blockEditing` suite "SequenceEditor on the Library": a new sequence built with blocks, saved as a Runner, creates a Publisher when run (AC 1); a stored Runner edited with blocks and saved runs with the edit (AC 2); Undo of a field rename restores the field and its reads.

### Composite Endpoint actions: define blocks and Save as Action

An Endpoint action implemented by a `compositeActionTemplate` is a composite action (issue #506). Its parameters are the attributes of its `actionParameters.payload` object schema; its body reads a parameter `p` as `getFromContext` `["payload", p]`, at runtime, as `entity_DuplicateAttribute` of ModelEndpoint does.

- **Define block.** The Blocks view of such an action's `actionImplementation.definition` shows a "define" header: the action type and its parameters. A parameter chip arms a read of `["payload", p]`, a drag takes it. In an editor that writes the action, `+ parameter` adds one (a string), ✎ renames one and rewrites the reads of `["payload", p, …]` in the body, and × removes one the body does not read. A `mustacheStringTemplate` reads by its tags (`{{payload.p}}`), and a name bound in the body (a `mapList` element named `payload`, …) hides the parameters from the runtime reads under it: those reads are left alone. A parameter change writes the whole action at once, so one Undo takes it back.
- **Save as Action.** In the sequence editor's save dialog, "create Action" creates an action from the edited sequence, named there: the Runner's form fields become its parameters (a form given by a transformer is refused), and the sequence's reads of `[runner, field]` become reads of `["payload", field]` (a template tag `{{runner.field}}` becomes `{{payload.field}}`). A save whose Runner failed after its action was saved creates only the Runner when saved again under the same name. It goes in an Endpoint of the application that declares actions, chosen there, or in a new Endpoint named there (version `1`). Action types are global: a type any Endpoint already declares is refused. The Endpoint is saved in the application's model section, in a transaction, committed with the other model changes. With "create Runner" on too, the Runner is an action Runner calling the new action, so the sequence is stored once; it runs below the editor, its form the action's parameters.
- **In the palette.** A new action is in the palette at once, under its Endpoint, and a sequence using it runs before the model is committed: `DomainController.handleAction` takes the application of an Endpoint it cannot find in the static map or the persisted stores from the caller's model environment.

The functions are `endpointActionHat`, `endpointActionParameterReads`, `addEndpointActionParameter`, `renameEndpointActionParameter`, `removeEndpointActionParameter`, `compositeEndpointAction`, `addEndpointAction` and `newEndpoint` (`miroir-core/src/2_domain/EndpointActionEdit.ts`), tested by `fn.blockModel` ("endpoint actions"). The define block is tested by the `ui.blockEditing` suites "an Endpoint action" (`entity_DuplicateAttribute` round-trips unchanged, AC 2), "an Endpoint action edited" and "an Endpoint action in an instance editor"; Save as Action by the #506 cases of "SequenceEditor on the Library" (a new action in a new Endpoint, used by another sequence that runs it, AC 1; both switches give an action Runner).

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
