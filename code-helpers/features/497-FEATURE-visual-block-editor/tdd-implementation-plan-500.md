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
| 2 | Tracer: the #415 node menu on a block | ⬜ | `ui.blockEditing` wrap, unwrap, remove |
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

**Status:** ⬜

### Goal

In the Blocks view, a developer opens a block's menu, wraps the block in `mapList`, and the JSON view shows the same value the form's wrap writes, plus `interpolation: "runtime"` on the new node. Unwrap and Remove work the same way, and Undo takes each back.

**Layers cut:** BlockEditorView props (value, write callback, history) → block header menu → TreeEdit functions → one `setFieldValue` of the root → history → JSON view.

### 2.1 RED

`ui.blockEditing` TransformerEditor cases: wrap a `returnValue` in `mapList` through the block menu and compare the JSON text; the same wrap through the form gives the same text without the `interpolation` attribute; unwrap; remove; Undo after a block remove.

### 2.2 GREEN

`BlockViewSwitch` passes `onCommit(newRoot)`, `undoable`, candidate types and the default builder to `BlockEditorView`; the transformer header renders `TransformerNodeActions` (`block-menu:<id>` trigger); the default builder is `defaultTransformerNode(type, {interpolation: "runtime"})`.

---

## Slice 3 — Palette and insert into a slot

**Status:** ⬜

### 3.1 RED

Build `mapList` of a `getFromContext` from an empty editor through the palette: arm `block-palette:mapList`, `block-action-replace` on the root; arm `getFromContext`, `block-insert:<elementTransformer row>`; the JSON text matches. Insert at the end of a `case` `whens` list.

### 3.2 GREEN

Palette panel beside the program, grouped by category, entries `block-palette:<type>` (click arms the type, keyboard Enter too); `block-insert:<row id>` on empty slots and list ends (opens a type picker when nothing is armed); Replace with in the block menu.

---

## Slice 4 — Tray: move a block out and back

**Status:** ⬜

### 4.1 RED

Move the `applyTo` of a `mapList` to the tray: the slot holds its default, the tray shows the block; place it into the `elementTransformer` slot: the JSON text matches and the tray is empty; switch to JSON and back: a tray block is still there; discard it.

### 4.2 GREEN

Tray state in `BlockViewModeProvider`; Move to tray menu entry; tray panel with Place (arms the tray block like a palette entry) and Discard.

---

## Slice 5 — Inline literals and the ML schema popover

**Status:** ⬜

### 5.1 RED

Edit the `value` of a `returnValue` inline (Enter commits, Escape cancels, a number stays a number); Ctrl+Z inside the field does not undo the transformer; edit a header parameter; open the ML schema chip, change `string` to `number`, Save, the JSON text matches.

### 5.2 GREEN

`Field` becomes editable under a writer (`block-field-input:<id>`, `data-own-undo`); `editsOwnText` honours `data-own-undo`; popover on the chip.

---

## Slice 6 — Build / runtime switch

**Status:** ⬜

### 6.1 RED

A block with no `interpolation` (shown as build) switched to runtime: the JSON text holds `"interpolation": "runtime"`, the marking is gone; switched back: `"build"`.

### 6.2 GREEN

`block-action-interpolation:<id>` menu entry.

---

## Slice 7 — Type flags on blocks

**Status:** ⬜

### 7.1 RED

With "Show transformer types" on, a `mapList` placed where the input is a single object shows `block-flag:<id>` with the mismatch; the value is kept.

### 7.2 GREEN

`BlockViewSwitch` passes the badges; the header shows the flag.

---

## Slice 8 — Run a subtree: the result bubble

**Status:** ⬜

### 8.1 RED

- `fn.transformer.subtreeRun` (new, off the page): the root; a node under `applyTo`; the element transformer of a `mapList` over 3 elements (3 values); `referenceToOuterObject`; `filterList` predicate; createObjectFromPairs `definition`; a dataflowObject step after another; a path that is not a transformer is an error.
- `ui.blockEditing`: click a block of the element transformer of a `mapList` over the editor's input: the bubble shows one value per element, choosing an element shows its value alone.

### 8.2 GREEN

`TransformerSubtreeRun.ts` in `miroir-core/src/2_domain` with its binding table; `block-result:<id>` bubble.

---

## Slice 9 — Drag and drop with @dnd-kit

**Status:** ⬜

`npm install @dnd-kit/core@6.3.1 -w miroir-standalone-app --save-exact`; draggable blocks, palette entries and tray items; droppable slots and list positions; the drop calls the same functions as the menus. Validation: standalone-app build, bundle guard (lazy lists of both policies), `check_dependency_policy.py`, the `ui.*` suites. Drag tests wait for #485.

---

## Slice 10 — Nonreg, docs, bundle, AC

**Status:** ⬜

`docs/reference/transformers.md` (editing with blocks), nonreg step for `ui.blockEditing`, `nonreg:filesystem`, bundle guard, AC checklist.
