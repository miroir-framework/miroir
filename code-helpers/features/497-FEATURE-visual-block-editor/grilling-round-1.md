# Visual block editor for transformers and actions: grilling round 1

A asked on 2026-10-06 for a visual view in the style of Scratch or Betty Blocks, where the user sees an existing transformer or action as blocks, edits it, or creates a new one.

Outcome: A accepted all 11 recommendations on 2026-10-06. Parent issue: https://github.com/miroir-framework/miroir/issues/497.

## Facts checked before asking

Transformers today:
- 48 TransformerDefinition instances in miroir-app-miroir. 46 are `libraryImplementation` (TypeScript), 2 are composite (`transformerImplementationType: "transformer"`). Each has `classification` (37 basic, 6 MLS, 3 admin, 1 spreadsheet, 1 metaModel) and `transformerInterface.transformerParameterSchema`, the ML schema of its parameters. A palette and block shapes can be computed from these.
- A transformer value is a tree. Each node has a `transformerType` and slots holding other transformers or literals. `dataflowObject` and `getFromContext` add named references, so a few values are not pure trees.
- The TransformerEditor (`4_view/components/TransformerEditor/TransformerEditor.tsx`, 1025 lines) edits the tree as a Formik form through `TypedValueObjectEditor` and `MlElementEditor`, with an input instance picker, a result panel and an events panel. #415 added wrap, pipe, unwrap, remove and replace (`miroir-core/src/2_domain/TransformerTreeEdit.ts`). #453 added coarse type badges per node; #88 and #383 infer input and output types. There is no undo.
- The UI review (U-findings) notes that the form editor re-renders on every keystroke because each field subscribes to Formik, Redux and the main context.

Actions today:
- An Endpoint action has a signature (`actionParameters`, ML schemas) and an optional `actionImplementation`, either `libraryImplementation` or `compositeActionTemplate`.
- A `compositeActionSequence` is a linear list of actions (`actionSequence`) plus named `templates`. Action payload fields hold transformers, so a sequence is a list of statements whose arguments are transformer expressions. There is no if or loop at the action level.
- Sequences live in Runner instances (7 in miroir-app-miroir, for example createEntity is `compositeRunBoxedQueryAction, createEntity, createInstance, updateInstance, updateInstance, commit`), in Endpoint `compositeActionTemplate` implementations, and in MiroirTest `testCompositeAction` cases.
- No editor shows sequences as anything but the generic JSON form. The Runners list page is commented out (U25).

Libraries in the repo: d3 (GraphComponent) and mermaid (miroir-diagram-class, read-only). No drag-and-drop library, no Blockly, no React Flow. Bundle size has a recorded baseline (#473).

No existing issue covers a visual editor (searched: #99, #124, #415 are the form-based TransformerEditor).

---

❓ **Q1** - **Which kind of visual language?**
(a) Scratch style. Blocks nest inside each other. Actions are stacked command blocks; transformers are expression blocks plugged into the slots of the block above. The picture mirrors the JSON tree one to one.
(b) Betty Blocks style. A vertical flow of action steps, each a card. Clicking a card opens a side panel with its settings, where transformers stay form fields or text expressions.
(c) Node graph, like Node-RED. Each transformer or action is a node and wires carry values between nodes. Good for shared values, weak for deep trees, and it needs a layout engine.
(d) A mix. Scratch-style nesting for transformers, Betty-style step cards for action sequences, with transformer arguments shown as nested blocks inside the card.

➡️ (a). Transformers are expression trees and action sequences are lists of statements, which is what Scratch's command and expression blocks represent. One visual language covers both, and named references (`getFromContext`) become "variable" blocks as in Scratch.

❓ **Q2** - **Which actions are in scope?**
(a) Composite action sequences wherever they are stored: Runner `compositeActionSequence`, Endpoint `compositeActionTemplate` implementations, MiroirTest composite action cases. Single domain actions appear as blocks inside a sequence.
(b) Only Runner sequences at first.
(c) Also Endpoint action signatures (`actionParameters`), as a "define block" header like Scratch's custom blocks.

➡️ (a), with (c) later. The editor works on a value of type `compositeActionSequence`, so where it is stored only changes the entry point. Signatures are ML schemas and already have a form.

❓ **Q3** - **Which transformers are in scope?**
(a) Any transformer value wherever it is stored: the TransformerBuilder page, composite TransformerDefinitions, Query runtime transformers, Report sections, MiroirTests, action payloads.
(b) Only the TransformerBuilder page and composite TransformerDefinitions at first.

➡️ (a) as the target, (b) as the first entry points. The block view edits a `transformerForBuildPlusRuntime` value, so any place that holds one can offer it.

❓ **Q4** - **How does the block view relate to the existing form editor?**
(a) A second view of the same value, switchable (Blocks, Form, JSON). Both read and write the same value and use the same edit functions (`TransformerTreeEdit.ts`), so a change in one shows in the other.
(b) A replacement for the form editor in the TransformerEditor.
(c) A separate page with its own state, saving back on demand.

➡️ (a). The form remains the fallback for every value the blocks do not render well, and one source of truth avoids a sync layer.

❓ **Q5** - **Where do block definitions come from?**
(a) Computed from metadata: one block per TransformerDefinition (label and slots from `transformerParameterSchema`, category from `classification`), one block per Endpoint action (slots from `actionParameters`). A new transformer or action appears in the palette with no UI code.
(b) Hand-written per block type, for nicer labels and shapes.
(c) Computed, with optional presentation hints (label template such as "map [list] with [function]", color, icon) stored with the definition.

➡️ (a) first, (c) as a follow-up. Computing blocks from definitions keeps the meta-model as the single description, as everywhere else in Miroir. Where hints would be stored is a later question.

❓ **Q6** - **What goes in the palette?**
(a) Miroir's TransformerDefinitions and Endpoint actions only.
(b) Also those of the current application, so a composite transformer or a composite action the user defined becomes a reusable block, like Scratch's "My Blocks".
(c) Also the named values in scope at the selected point (context names, `dataflowObject` steps, `nameGivenToResult` of earlier actions, `templates`), shown as variable blocks.

➡️ (b) and (c). With (b), a composite the user defined is reused by dragging its block, not by copying its JSON. Variable blocks replace typing reference paths by hand.

❓ **Q7** - **What happens when a block is dropped into a slot whose type does not match?**
(a) Refused, the slot does not accept it.
(b) Accepted and flagged, with the #453 type badges and the type check status.
(c) Slots are shaped by type as in Scratch (round for values, pointed for booleans), and only the shape is enforced.

➡️ (b). Types in Miroir are often `any` or known only after inference (#88), so refusing drops would block valid edits. The flag reuses what #453 already computes.

❓ **Q8** - **Can the user evaluate a block from the block view?**
(a) Yes for transformers. Clicking a block runs that subtree on the TransformerEditor's current input and shows the result in a bubble, as Scratch does for expression blocks. Actions are not run from blocks.
(b) Yes for both. Actions run against the current deployment.
(c) No, the existing result panel shows the whole result.

➡️ (a). Transformers are pure, so running a subtree is safe. Running an action from a block has side effects and belongs to the existing Runner flow.

❓ **Q9** - **Must every drag operation also exist without dragging?**
(a) Yes. Each block has a menu (insert, wrap, pipe, unwrap, remove, replace, reusing #415's functions) and keyboard navigation, so every edit can be made without a mouse drag.
(b) Drag only, menus later.

➡️ (a). It keeps the editor usable with a keyboard, and MiroirTest UI cases can drive menus in jsdom where simulated drag is unreliable.

❓ **Q10** - **How are queries inside action sequences shown?**
`compositeRunBoxedQueryAction` carries a query with extractors and combiners, which is a third language.
(a) As one collapsed block, edited with the existing form or JSON.
(b) As blocks too (extractor blocks, combiner blocks, transformer blocks), in this issue.
(c) As blocks, in a follow-up issue.

➡️ (a) now and (c) later. Queries have their own editor skill and shape, and the first version can cover transformers and actions without them.

❓ **Q11** - **How do we slice the work into issues?**
(a) One parent issue with sub-issues, for example: read-only transformer blocks; transformer editing and creation; read-only action sequences; action editing and creation; computed palette of user-defined blocks.
(b) One issue, delivered in TDD slices on one branch.

➡️ (a). Showing an existing transformer as blocks is already useful, and the read-only renderer settles the visual design before editing adds drag and drop.

Later rounds, once these are settled: library choice (Blockly, own React components with a drag library, React Flow, depending on Q1), lazy loading and bundle budget, inline fields or side panel for literals and ML schemas, block colors and label templates, free canvas and a scratch area for detached blocks, entry points in the UI, undo, and the MiroirTest UI suite.
