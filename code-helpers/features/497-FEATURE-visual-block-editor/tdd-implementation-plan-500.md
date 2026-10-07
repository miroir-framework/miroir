# Issue #500 — TDD Implementation Plan

> Vertical TDD slices (RED → GREEN each), integration-first per `docs/contributing/testing.md`.
> Pure tree and default functions are tested with `fn.*` MiroirTest cases; the block editing itself
> with `ui.blockEditing` component cases that render the real TransformerEditor over the
> component-test local cache and drive it through block menus. No mocks. Drag and drop is not tested
> here: happy-dom cannot drag, and #485 brings Playwright.
>
> **Execution model:** one green commit per slice, pushed to the working branch. Each slice ends
> with its Validation commands; on success its Realization is appended and its Status flips to ✅.

Analysis: [`./analysis.md`](./analysis.md) (parent issue #497, D2, D4, D7, §6.1 row #500) · Issue: https://github.com/miroir-framework/miroir/issues/500
Working branch: `claude/500-block-editor-editing`

**Resume note:** plan written 2026-10-07 from a code map of `_integration` at `d4c193c` (#499 merged).

---

## Scope

- **G3 — Edit with blocks.** Insert, wrap, pipe, unwrap, remove and replace blocks, move a block through a tray, edit literals inline, switch a block between build and runtime, and run a subtree to see its result. Every drag has a menu equivalent.
- New nodes made by the block view get `interpolation: "runtime"` (D2-a).
- A block placed in a slot of the wrong input type is kept and flagged.

This plan does not add variable blocks or scope checks (#501), define blocks (#502), or the block view outside the TransformerEditor (#503).

---

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | A home for the cases, off the page bundle | ✅ | `componentTestInstances.292.phase1`, counts |
| 1 | Pure defaults and insert, move, reorder | ✅ | `fn.transformer.treeEdit` |
| 2 | Tracer: the #415 node menu on a block | ✅ | `ui.blockEditing` wrap, unwrap, remove |
| 3 | Palette and insert into a slot | ⬜ | `ui.blockEditing` build from the palette |
| 4 | Tray: move a block out and back | ⬜ | `ui.blockEditing` tray cases |
| 5 | Inline literals and the ML schema popover | ⬜ | `ui.blockEditing` literal cases |
| 6 | Build / runtime switch | ⬜ | `ui.blockEditing` interpolation case |
| 7 | Type flags on blocks | ⬜ | `ui.blockEditing` mismatch case |
| 8 | Run a subtree: the result bubble | ⬜ | `fn.transformer.subtreeRun`, `ui.blockEditing` bubble cases |
| 9 | Drag and drop with @dnd-kit | ⬜ | build, bundle guard, dependency policy |
| 10 | Nonreg, docs, bundle, AC | ⬜ | nonreg, AC checklist |

---

## Locked implementation defaults

From the analysis, the issue, and the code map. Deviations go into the slice's Realization.

| Decision | Choice | Serves |
|---|---|---|
| Where the cases live | A new instance `ui.blockEditing`, exported by miroir-app-miroir but **not** listed in `defaultMiroirMetaModel.tests`, so it stays off the page bundle (the `miroir-app-miroir` eager cap has about 37 KB left, analysis §4.7). `componentTestInstances.292.phase1` gets an `offPageComponentInstances` list. The schema check of `componentMiroirTests.consistency` already covers every folder instance. Ten `fn.*` instances are already off the page this way. Later sub-issues (#501-#507) add their cases there. | bundle |
| Default node per type | A pure `defaultTransformerNode(transformerType, {modelEnvironment, interpolation})` in `TransformerTreeEdit.ts`, from the union branch `coreTransformerForBuildPlusRuntime_<type>` through `getDefaultValueForMlSchemaWithResolutionNonHook` (no `forceOptional`). With `interpolation`, every transformer node of the default gets it, nested ones included (mapList's default holds two `returnValue` nodes). The form view keeps its own defaults (D2). | G3, D2 |
| Palette | The types the editor's transformer union accepts (the form's select offers the same ones), grouped by `classification` in the block category order. The 12 definitions with no union branch are left out: a value of their type would fail the schema. So flags cover input mismatches only, as the issue says. | G3, D4 |
| New tree functions | `insertTransformerNode(root, ownerPath, slot, position, node, {slotDefault})` (an empty slot, a list position, a new record key that does not collide), `moveTransformerNode(root, from, to, {slotDefault})` (one value out, so one undo step; refuses a target inside the source), `reorderTransformerNode(root, path, toIndex)` | G3 |
| Writing | The block view writes the whole watched value once per edit (`setFieldValue` of the root path), on commit only: a menu choice, a drop, Enter or blur in an inline field (D7). One edit, one undo step. | G3, #499 |
| Block menu | The #415 `TransformerNodeActions` on each transformer block header, `undoable` from the history, plus block entries: Move to tray, Switch to build / runtime, Replace with (palette type, through `keepAttributesOnTypeChange`). | G3 |
| Interpolation of a replaced node | `keepAttributesOnTypeChange` keeps an explicit `interpolation` of the old node; a node with none gets `runtime` from the new default | D2 |
| Tray | Session state per watched path in `BlockViewModeProvider` (it already keeps the mode per path), so it survives the remount on a mode switch. Not part of the undo history: undoing a move to the tray puts the block back and the tray keeps its copy, which the user can discard. Placing a tray block removes it from the tray. | G3 |
| Inline fields | Local draft, committed on Enter or blur, Escape cancels. Their Ctrl+Z stays with the field: `editsOwnText` also honours a `data-own-undo` marker on the field. | G3, #499 |
| ML schemas | The chip opens a popover holding `TypedValueObjectEditorWithFormik` on `mlElement`; Save commits | G3 |
| Type flags | The #453 badges, already computed by the TransformerEditor when "Show transformer types" is on, are passed to the block view; a block whose badge is a mismatch shows a red flag. Badge paths drop their `transformer` prefix to match `BlockPath`. | G3 |
| Subtree run | A pure `transformerSubtreeRuns(root, path, input, …)` in miroir-core: walks from the root to the path, extending the context as the runtime does (list element slots of mapList, filterList and find bind each element; createObjectFromPairs and mergeIntoObject `definition` bind the evaluated `applyTo`; dataflowObject steps see earlier steps), then runs the node once per context. The binding rules come from one table in the new module, which #501 extends. Clicking a block header shows the bubble: one value, or one per element with a chosen element. | G3 |
| Drag and drop | `@dnd-kit/core` 6.3.1 (A approved the install 2026-10-07), imported only from the lazy `BlockEditorView` chunk; `@dnd-kit/*` in the `lazy` lists of both bundle policies. Ids are the block paths. | G3 |

---

## Allocated UUIDs / keys

| Artefact | Value |
|---|---|
| MiroirTest `ui.blockEditing` | `4be51ca7-2d92-46ce-b0ad-6833dd3b9d04`, export `miroirTest_ui_blockEditing`, off the page |
| Test ids | `block-menu:<id>`, `block-action-tray:<id>`, `block-action-interpolation:<id>`, `block-action-replace:<id>`, `block-palette:<type>`, `block-insert:<row id>`, `block-tray`, `block-tray-item:<n>`, `block-tray-place:<n>`, `block-tray-discard:<n>`, `block-field-input:<id>`, `block-flag:<id>`, `block-result:<id>` |

---

## Test execution conventions

| Purpose | Command |
|---|---|
| `ui.blockEditing` | `npm run testMiroir -w miroir-standalone-app -- --suites ui.blockEditing` |
| Editor suites | `npm run testMiroir -w miroir-standalone-app -- --suites ui.blockEditor` (and `ui.valueHistory`, `ui.transformerEditor`) |
| Pure functions | `npm run testMiroir -w miroir-core -- --suites fn.transformer.treeEdit --mode unit` |
| Component suite counts | `npm run testByFile -w miroir-standalone-app -- componentMiroirTests.consistency miroir-component-tests componentTestInstances.292.phase1` |
| Rebuild after MiroirTest JSON changes | `npm run build -w miroir-app-miroir` |
| Type check | `npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json` and `-p packages/miroir-standalone-app/tsconfig.json` (32 known MUI 9 errors) |
| Bundle guard | `npm run build -w miroir-standalone-app && python scripts/check_bundle_policy.py packages/miroir-standalone-app/dist/.vite/bundle-report.json packages/miroir-standalone-app/bundle-policy.json` |
| Scoped nonreg | `npm run nonreg:filesystem -- --runner shared --scope smoke,ui` |

---

## Slice 0 — A home for the cases, off the page bundle

**Status:** ✅ DONE

### Goal

`ui.blockEditing` exists, runs in the component suite, and does not grow the page bundle.

### 0.1 RED

`componentTestInstances.292.phase1`: `offPageComponentInstances = {"ui.blockEditing": "4be51ca7-…"}`; the instance is in the folder and exported, and **not** in `defaultMiroirMetaModel.tests`.

### 0.2 GREEN

- `ui.blockEditing` with one TransformerEditor case: the Blocks view shows the block menu trigger (red until Slice 2, so the first case moves with Slice 2; Slice 0 holds a case that opens the Blocks view).
- `index.ts`, `index.d.ts` exports; counts in `miroir-component-tests.unit.test.tsx` (instances 13), `componentMiroirTests.consistency` (13), `docs/reference/testing.md`.

### Validation

```bash
npm run build -w miroir-app-miroir
npm run testByFile -w miroir-standalone-app -- componentMiroirTests.consistency miroir-component-tests componentTestInstances.292.phase1
```

### Realization

- RED: `componentTestInstances.292.phase1` failed on the missing instance.
- GREEN: `ui.blockEditing` holds one case (the Blocks view of the starting transformer); the Slice 2 menu cases join it. Counts 13 instances, 146 leaves. The three count tests pass (144, 15 on demand skipped), `ui.blockEditing` 1 of 1, `miroirTestNaming` 4 of 4.
- The asset is written by a generator script kept outside the repository, as for `ui.valueHistory`.

---

## Slice 1 — Pure defaults and insert, move, reorder

**Status:** ✅ DONE

### 1.1 RED

- `fn.transformer.defaultNode` (new, off the page like the other `fn.*`): `defaultTransformerNode` for `returnValue`, `mapList` (two nested nodes, all stamped), `case` (`whens: []`), `+`; with and without `interpolation`; an unknown type is an error.
- `fn.transformer.treeEdit`: suites `insertTransformerNode` (empty required slot, empty optional slot, list start / middle / end, record key with a collision, a pair slot of createObjectFromPairs, a type with no slot is an error), `moveTransformerNode` (to another slot, inside one list with index shift, into its own subtree is an error, from a required slot leaves `slotDefault`), `reorderTransformerNode`.

### 1.2 GREEN

`TransformerTreeEdit.ts`: the four functions; `declaredAttributeSchemas` exported too; `FunctionCallTestRegistry` entries; exports in `index.ts`.

### Validation

```bash
npm run devBuild -w miroir-core
npm run testMiroir -w miroir-core -- --suites fn.transformer.treeEdit,fn.transformer.defaultNode --mode unit
npm run test -w miroir-core -- ''
```

### Realization

- The `defaultTransformerNode` cases went into `fn.transformer.treeEdit` with the others, not a new instance: the function lives in `TransformerTreeEdit.ts`. Its signature is `(transformerType, modelEnvironment, interpolation?)` so the cases can inject the environment.
- `insertTransformerNode(root, path, node, {slotDefault})` takes the concrete position: a list position inserts before the item there, a taken record key gets a number suffix, an attribute is replaced. `moveTransformerNode(root, from, to, {slotDefault})` reads `to` as a position before the move and shifts it when the removed item came earlier in the same list. The required-sibling fill of `wrapTransformerNode` became `fillRequiredItemSiblings`, shared with insert.
- 27 new cases (5 default, 10 insert, 8 move, 4 reorder): `fn.transformer.treeEdit` 102 of 102. Mutating the key suffix and the index shift fails 4 of them. miroir-core unit tests 2764 pass.

---

## Slice 2 — Tracer: the #415 node menu on a block

**Status:** ✅ DONE

### Goal

In the Blocks view, a developer opens a block's menu, wraps the block in `mapList`, and the JSON view shows the same value the form's wrap writes, plus `interpolation: "runtime"` on the new node. Unwrap and Remove work the same way, and Undo takes each back.

**Layers cut:** BlockEditorView props (value, write callback, history) → block header menu → TreeEdit functions → one `setFieldValue` of the root → history → JSON view.

### 2.1 RED

`ui.blockEditing` TransformerEditor cases: wrap a `returnValue` in `mapList` through the block menu and compare the JSON text; the same wrap through the form gives the same text without the `interpolation` attribute; unwrap; remove; Undo after a block remove.

### 2.2 GREEN

`BlockViewSwitch` passes `onCommit(newRoot)`, `undoable`, candidate types and the default builder to `BlockEditorView`; the transformer header renders `TransformerNodeActions` (`block-menu:<id>` trigger); the default builder is `defaultTransformerNode(type, {interpolation: "runtime"})`.

### Realization

- `BlockEditing.tsx` holds the editing context (root, commit, undoable, candidate types from the new `transformerUnionTypes`, the runtime default builder) and `BlockNodeActions`, the #415 `TransformerNodeActions` on a block header. The button keeps the form's label (`Transformer node actions <block id>`), so cases address a node the same way in both views; the planned `block-menu:<id>` test id is not needed.
- The form comparison uses `ifThenElse`: with the starting input the form offers no `mapList` at the root (the #383 input restriction), while the block menu does not filter yet.
- **Core fix found by the comparison:** `defaultTransformerNode` filled the optional slots (`then`, `else`, `applyTo`) that the form leaves out. `resolveObjectExtendClauseAndDefinition` (`mlsTypeCheck.ts`) resolved the schema references of an object with `extend` and dropped their `optional`; it now keeps it. Defaults built from an unfolded branch (the form) were not affected; type checks pass either way. The default cases of `fn.transformer.treeEdit` follow (mapList without `applyTo`, case without `else`, one more case for `ifThenElse`).
- `ui.blockEditing` 6 of 6 (146 → 151 leaves). miroir-core unit tests 2770 pass. `ui.blockEditor` 13, `ui.valueHistory` 21, `ui.transformerEditor` 27 pass (plus the leaf count, updated after).

---

## Slice 3 — Palette and insert into a slot

**Status:** ✅

### 3.1 RED

Build `mapList` of a `getFromContext` from an empty editor through the palette: arm `block-palette:mapList`, `block-action-replace` on the root; arm `getFromContext`, `block-insert:<elementTransformer row>`; the JSON text matches. Insert at the end of a `case` `whens` list.

### 3.2 GREEN

Palette panel beside the program, grouped by category, entries `block-palette:<type>` (click arms the type, keyboard Enter too); `block-insert:<row id>` on empty slots and list ends (opens a type picker when nothing is armed); Replace with in the block menu.

### Realization

- Two pure functions in miroir-core, each with `fn.*` cases: `transformerInsertPositions` (`TransformerTreeEdit.ts`, 7 cases in `fn.transformer.treeEdit`) lists every empty slot, one new item per list slot and one new entry per record slot, each with the path `insertTransformerNode` takes and the container the view shows it in; `transformerPaletteGroups` (`TransformerBlockModel.ts`, 1 case in `fn.blockModel`) groups the union types by classification and leaves out `dataflowSequence`, which has no TransformerDefinition and would be a JSON block. `transformerBlockTree` takes `emptyOptionalSlots` (2 cases), so an absent optional slot is a row where a block can go.
- Insert targets are addressed by the position they fill, `block-insert:<id of the insert path>` (`transformer.whens.0.when`), rather than by row: a list slot and its end target would share a row id. A target is disabled while nothing is armed, instead of opening a type picker: the palette is the picker. Both palette entries and targets are buttons, so Enter works.
- Replace with is an `extraEntries` entry of `TransformerNodeActions` (`block-action-replace`) and keeps the attributes the new type takes (`keepAttributesOnTypeChange`); without an undo history it asks first when attributes would go, with the form's type change dialog. An insert or a replace disarms the palette.
- `ui.blockEditing` 8 of 8 (151 → 153 leaves); `fn.blockModel` and `fn.transformer.treeEdit` 134 pass; `ui.blockEditor`, `ui.valueHistory`, `ui.transformerEditor` pass with the editing view's extra rows.

---

## Slice 4 — Tray: move a block out and back

**Status:** ✅

### 4.1 RED

Move the `applyTo` of a `mapList` to the tray: the slot holds its default, the tray shows the block; place it into the `elementTransformer` slot: the JSON text matches and the tray is empty; switch to JSON and back: a tray block is still there; discard it.

### 4.2 GREEN

Tray state in `BlockViewModeProvider`; Move to tray menu entry; tray panel with Place (arms the tray block like a palette entry) and Discard.

### Realization

- `BlockViewModeProvider` keeps a tray per Formik path next to the mode (`trayOf`, `setTray`); `BlockViewSwitch` hands it to the block view, which has no tray without a provider.
- The armed block is a palette type or a tray index (`ArmedBlock`). An insert target or Replace with puts a tray block as it is (no `keepAttributesOnTypeChange`) and takes it out of the tray. Discard disarms an armed tray block, since the indexes shift.
- Move to tray (`block-action-tray`) removes the block as Remove does: an optional slot is emptied, a required one gets a runtime `returnValue`. The tray item renders the block read-only (the editing context is cleared around it), with ids under `<root>~tray.<n>`.
- The case places the `applyTo` block with Replace with on the `elementTransformer` block, since a held slot has no insert target.
- `ui.blockEditing` 10 of 10 (153 → 155 leaves).

---

## Slice 5 — Inline literals and the ML schema popover

**Status:** ✅

### 5.1 RED

Edit the `value` of a `returnValue` inline (Enter commits, Escape cancels, a number stays a number); Ctrl+Z inside the field does not undo the transformer; edit a header parameter; open the ML schema chip, change `string` to `number`, Save, the JSON text matches.

### 5.2 GREEN

`Field` becomes editable under a writer (`block-field-input:<id>`, `data-own-undo`); `editsOwnText` honours `data-own-undo`; popover on the chip.

### Realization

- `BlockFields.tsx`: `BlockField` (header parameters and literal blocks) opens on click or Enter (`block-field:<id>`) into an input (`block-field-input:<id>`); Enter or blur writes, Escape cancels, an unchanged value writes nothing. A string field stays a string; any other field is parsed as JSON, so a number stays a number, and text that does not parse keeps the input open, marked invalid. `MlSchemaChip` opens a MUI Popover with the schema's JSON text (`block-mlschema-input:<id>`, Save and Cancel).
- `editsOwnText` honours `data-own-undo`, and `ValueHistoryScope` no longer marks typing in such a field as a typing group: the field writes the value once, when it commits. Mutation check: without the `data-own-undo` test, the Ctrl+Z case fails (the wrap is undone).
- The `value` of the starting `returnValue` is a header parameter (a primitive), so the first case covers parameter editing.
- `ui.blockEditing` 13 of 13 (155 → 158 leaves); `ui.blockEditor`, `ui.valueHistory`, `ui.transformerEditor` 60 pass.

---

## Slice 6 — Build / runtime switch

**Status:** ✅

### 6.1 RED

A block with no `interpolation` (shown as build) switched to runtime: the JSON text holds `"interpolation": "runtime"`, the marking is gone; switched back: `"build"`.

### 6.2 GREEN

`block-action-interpolation:<id>` menu entry.

### Realization

- The entry is `block-action-interpolation` (the menu belongs to one block, so its entries need no id, as for `block-action-replace` and `block-action-tray`). It reads "Switch to runtime" on a build block or one with no `interpolation`, "Switch to build" on a runtime block, and writes the attribute on that node only, not its subtree.
- `ui.blockEditing` 14 of 14 (158 → 159 leaves).

---

## Slice 7 — Type flags on blocks

**Status:** ✅

### 7.1 RED

With "Show transformer types" on, a `mapList` placed where the input is a single object shows `block-flag:<id>` with the mismatch; the value is kept.

### 7.2 GREEN

`BlockViewSwitch` passes the badges; the header shows the flag.

### Realization

- `MlElementEditor` hands its `transformerTypeBadges` to `BlockViewSwitch`, which hands them to the block view; badges are looked up by block id, which is the badge path joined. The flag (`block-flag:<id>`, `data-status`) reads `given → output`, red with ⚠ on a mismatch, and its title is the badge's full text.
- The starting `returnValue` declares no input type, so its status is `unknown`, not `match`; the case checks that a flag is there, then the mismatch after Replace with `mapList`.
- `ui.blockEditing` 16 of 16 (159 → 161 leaves); `ui.blockEditor`, `ui.valueHistory`, `ui.transformerEditor` 60 pass.

---

## Slice 8 — Run a subtree: the result bubble

**Status:** ✅

### 8.1 RED

- `fn.transformer.subtreeRun` (new, off the page): the root; a node under `applyTo`; the element transformer of a `mapList` over 3 elements (3 values); `referenceToOuterObject`; `filterList` predicate; createObjectFromPairs `definition`; a dataflowObject step after another; a path that is not a transformer is an error.
- `ui.blockEditing`: click a block of the element transformer of a `mapList` over the editor's input: the bubble shows one value per element, choosing an element shows its value alone.

### 8.2 GREEN

`TransformerSubtreeRun.ts` in `miroir-core/src/2_domain` with its binding table; `block-result:<id>` bubble.

### Realization

- `transformerSubtreeRuns(root, path, transformerParams, contextResults, modelEnvironment)` walks the path and applies the binding table `CONTEXT_BINDINGS` (type → slot attribute → `eachElement`, `applyTo` or `earlierSteps`), read from the runtime handlers: mapList, filterList and find run their element slot once per element (mapList also over the values of an object), createObjectFromPairs and mergeIntoObject bind their evaluated `applyTo` once (createObjectFromPairs with no `applyTo` binds `{}`, as its handler does), dataflowObject steps see the steps before them. Each run is labelled with the names it binds (`defaultInput[1]`, `book[0], letter[1]`). The node runs at step `runtime` with `resolveBuildTransformersTo: "value"`, as the TransformerEditor runs the whole transformer.
- `fn.transformer.subtreeRun` (new instance `a2e7d5f0-…`, exported off the page like `fn.transformer.treeEdit`): 10 cases, nested mapList included.
- The TransformerEditor provides `BlockRunInputContext` (its input, as params and context, the same object it runs the transformer on); without it, blocks do not run. A click on a block header (`block-header:<id>`) opens or closes its bubble (`block-result:<id>`, one at a time); the fold button no longer reaches the header. Runs with labels get a select (`block-result-select:<id>`), each value is `block-result-value:<id>:<label>` with its JSON in `data-value`; a failure is shown red.
- The memo of the run input lives in `TransformerDefinitionEditor`, not in the Formik render callback, which would add one more suppressed `rules-of-hooks` violation.
- `ui.blockEditing` 18 of 18 (161 → 163 leaves); miroir-core unit tests 2802 pass.

---

## Slice 9 — Drag and drop with @dnd-kit

**Status:** ⬜

`npm install @dnd-kit/core@6.3.1 -w miroir-standalone-app --save-exact`; draggable blocks, palette entries and tray items; droppable slots and list positions; the drop calls the same functions as the menus. Validation: standalone-app build, bundle guard (lazy lists of both policies), `check_dependency_policy.py`, the `ui.*` suites. Drag tests wait for #485.

---

## Slice 10 — Nonreg, docs, bundle, AC

**Status:** ⬜

`docs/reference/transformers.md` (editing with blocks), nonreg step for `ui.blockEditing`, `nonreg:filesystem`, bundle guard, AC checklist.
