# Visual block editor (#497): grilling round 2

Issue: https://github.com/miroir-framework/miroir/issues/497 (parent issue, round 1 decisions listed there).

Round 1 outcome: A accepted all 11 recommendations on 2026-10-06 ("Scratch style it is").

Round 2 outcome: A accepted all 10 recommendations on 2026-10-06.

## Facts checked before asking

Bundle sizes, measured with esbuild (minified ESM, react external), gzip:

| Library | Version | gzip | Notes |
|---|---|---|---|
| blockly | 13.3.0 | 203 kB | Google, Apache-2.0, SVG workspace with its own block model, toolbox, zoom, undo |
| scratch-blocks | 2.1.29 | not measured | Scratch's fork of Blockly, built for scratch-vm |
| @dnd-kit/core | 6.3.1 | 15 kB | MIT, React, keyboard sensor; last release December 2024 |
| @dnd-kit/react | 0.5.0 | 34 kB | MIT, the new dnd-kit API, still before 1.0 |

The standalone app's eager page is about 787 kB gzip (`bundle-policy.json`, `eagerGzipBaseline` 786868, tolerance 2%). Libraries loaded on demand go in `forbiddenEager`, as CodeMirror and ag-grid do (`lazy()` in `LazyGrids.tsx`). Blockly loaded eagerly would add about 26% to the page.

Other facts:
- #415's tree operations need a `slotDefault` for a required slot left empty (`TransformerTreeEdit.ts:207`, `:384`). An empty required slot is never stored as a hole.
- Miroir has a Theme Entity (`bdcf956a-771d-40a1-a878-06e0bf6efd3e`), so colors can be data.
- The UI review measured that every field of the form editor subscribes to Formik, Redux and the main context, so one keystroke re-renders the whole form. A block tree built the same way would have the same cost.
- MiroirTest UI cases run in jsdom. jsdom has no layout, so simulated drag and drop is unreliable there and SVG hit testing does not work. Playwright e2e tests are filed as #485, not started.

---

❓ **Q1** - **Which library renders and drags the blocks?**
(a) Blockly. It gives the Scratch look, toolbox, zoom, undo and keyboard navigation at once. It keeps its own block model, so every change needs a conversion from Miroir JSON to Blockly and back, which conflicts with round 1 decision 4 (one value, one set of edit functions). It renders SVG with its own theme, not MUI. 203 kB gzip, loaded on demand.
(b) scratch-blocks. Exactly Scratch's look, but tied to scratch-vm and less general than Blockly, with the same two-model problem.
(c) Own React components (HTML boxes styled as blocks with the MUI theme) and a small drag library. The block tree is computed from the Miroir value on each render and every edit goes through `TransformerTreeEdit.ts`. MiroirTest UI cases can query the blocks in jsdom. We build zoom, toolbox and block shapes ourselves.

➡️ (c), with @dnd-kit/core 6.3.1 (15 kB gzip, stable API, keyboard sensor). It is the only option where the Miroir value stays the single source of truth, which round 1 chose.

❓ **Q2** - **Where are blocks placed?**
(a) Free canvas as in Scratch. Each top-level block has x and y coordinates, which must be stored somewhere in the value or beside it.
(b) Automatic layout. The program is one stack laid out from its structure, with no stored coordinates. The view scrolls and zooms.

➡️ (b). Transformer and action values have no place for coordinates, and storing them beside the value would add a layout record per edited value.

❓ **Q3** - **Where does a block go when the user drags it out of its slot?**
(a) It is deleted, and the slot gets its default value (as #415 does on remove).
(b) It moves to a scratch tray beside the program. The tray is UI state for the editing session and is not saved. The slot gets its default value.
(c) It is kept in the saved value under an extra attribute.

➡️ (b). Moving a block from one slot to another often goes through a temporary place, and the tray gives one without changing the model. Scratch has the same behavior, as loose blocks on the canvas.

❓ **Q4** - **How does a block show slots that hold other blocks?**
Scratch puts everything on one line ("move (10) steps"), which grows too wide for nested transformers such as `mapList` inside `dataflowObject` inside `createObject`.
(a) One line per block, as in Scratch, with horizontal scrolling.
(b) A header line with the block name and its primitive parameters inline; each slot that holds a transformer or an action gets its own row inside the block, like Scratch's "if then else" C-shaped blocks.

➡️ (b). Deep trees then grow downward, which scrolls well, and slot names stay readable next to their content.

❓ **Q5** - **How are literal values edited?**
Some slots hold strings, numbers, booleans or enums; some hold plain objects or arrays; some hold an ML schema (`returnValue.mlSchema`, `mlsTypeCheck`).
(a) Primitives as inline fields in the block. Plain objects and arrays as "object" and "list" blocks with one row per key or item, since their values can be transformers. ML schemas as a collapsed chip that opens the existing form editor in a popover.
(b) Everything except transformers in a side panel, as Betty Blocks does.
(c) A JSON text field for every non-transformer value.

➡️ (a). Primitives inline is how Scratch reads. Object and list blocks are needed because `createObject` and similar transformers hold transformers inside plain objects. ML schemas already have a good editor.

❓ **Q6** - **Where are block colors defined?**
Scratch colors blocks by category. Round 1 put categories on `classification` for transformers and on the Endpoint for actions.
(a) In the Theme Entity, as a new attribute mapping categories to colors, so each Miroir theme can set them.
(b) In a constant in the UI code.

➡️ (a). Themes are data in Miroir, and the light and dark themes need different block colors.

❓ **Q7** - **Where does the user switch to the block view?**
(a) On any field of the generic value editor whose schema is a transformer or a composite action sequence. The switch then appears in the TransformerEditor and in the instance editors of TransformerDefinition, Runner, Endpoint and MiroirTest without extra wiring.
(b) Only at the root of the TransformerEditor and of a new action editor page.
(c) As a new Report section type, placed in Reports through data.

➡️ (a) as the target, with the TransformerEditor root wired first. It matches round 1 decision 3 (any place that holds a transformer can offer the block view).

❓ **Q8** - **Undo and redo**
Drag and drop makes accidental edits frequent. The form editor has no undo and #415 used confirmation dialogs instead.
(a) An undo and redo stack for the edited value, shared by the block, form and JSON views (Ctrl+Z, Ctrl+Y). It becomes its own sub-issue, done before block editing.
(b) Confirmation dialogs on destructive operations, as in #415.
(c) Undo in the block view only.

➡️ (a). Scratch users expect Ctrl+Z, and a confirmation on every drag would make the editor tiring. Undo shared by all views avoids two histories that disagree.

❓ **Q9** - **Where does the code live?**
(a) The mapping from a value to a block tree (blocks, slots, types, paths, palette entries) is a pure module in `miroir-core/src/2_domain`, next to `TransformerTreeEdit.ts`. The React components live in `miroir-standalone-app` under `4_view/components/BlockEditor/`, in a chunk loaded on demand. Blocks receive the value from the root and are memoized, with no per-block subscription to Formik, Redux or the main context.
(b) A new package `miroir-block-editor`, like `miroir-diagram-class`. It cannot import the app's form editor (needed for the ML schema popover of Q5) without an injection point.

➡️ (a). The pure module can be tested with MiroirTest `fn.*` suites in miroir-core, and the app already has the form editor the popover needs.

❓ **Q10** - **How is the block editor tested?**
(a) A `fn.blockModel` MiroirTest suite for the value to block tree mapping and the palette, and a `ui.blockEditor` suite of component test cases that edit through block menus (round 1 decision 9). Drag and drop is tested once Playwright tests (#485) exist.
(b) The same plus a Playwright setup inside this work.

➡️ (a). The menus perform the same edits as dragging, so jsdom can cover the edit logic, and #485 already holds the Playwright setup.

Next round, once these are settled: the final sub-issue list and order, the content of the first sub-issue (which transformers and which entry point), how variables in scope are computed, and how action blocks get their slots for actions that are not Endpoint actions (`compositeRunBoxedQueryAction`, `compositeRunTestAssertion`).
