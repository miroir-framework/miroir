# Visual block editor (#497): grilling round 3

Issue: https://github.com/miroir-framework/miroir/issues/497

Round 3 outcome (A, 2026-10-06): recommendations accepted, with these changes.
- Q3: the save dialog has two switches, "create Runner" and "create Action". When "create Action" is on, the user picks an existing Endpoint or adds a new one.
- Q4: no marker and no dashed outline means build; a small marker or a dashed outline means runtime.
- Q6: while doing the work, check whether `compositeRunTestAssertion` can become an Endpoint action like the others. In principle there is no reason for it to differ.

Round 2 outcome: A accepted all 10 recommendations on 2026-10-06. In short: own React blocks with @dnd-kit/core, automatic layout, an unsaved tray for detached blocks, one row per transformer slot, primitives inline and ML schemas in a popover, block colors in the Theme Entity, a block view switch on any transformer or action sequence field, shared undo and redo, the block model in miroir-core `2_domain`, tests through `fn.blockModel` and `ui.blockEditor`.

## Facts checked before asking

Creating things today:
- The TransformerEditor has no save. Its transformer lives in the session's tools page state (`toolsPageState.transformerEditor`), so "create a transformer" has no target yet.
- A composite TransformerDefinition holds its parameters in `transformerInterface.transformerParameterSchema` and its body in `transformerImplementation.definition`. The body reads parameters with `getFromContext` by parameter name (see `spreadSheetToMlSchema`, `e44300e8`). This is the shape of a Scratch "define" block: a header with name and parameters, and a body using them.
- A custom Runner has a form (`formMLSchema`) and a `compositeActionSequence`; the form values feed the sequence. This is the shape of a Scratch "when clicked" hat block.
- Only one Endpoint action has a composite implementation (`entity_DuplicateAttribute`, ModelEndpoint). The other 36 Miroir Endpoint actions are `libraryImplementation`.

Actions:
- Every action used in the 7 Miroir Runners is an Endpoint action with `actionParameters` (InstanceEndpoint, ModelEndpoint, StoreManagementEndpoint, DomainEndpoint for `compositeRunBoxedQueryAction`).
- `compositeRunTestAssertion` is the one action type in a sequence with no Endpoint definition. It appears in MiroirTest composite cases only.

Named values:
- `collectTransformerEnvironmentBindings` (`miroir-core/src/2_domain/TransformerEnvironmentBindings.ts`) already walks a transformer and lists the context and parameter names visible at each node (mapList, filterList, find, createObjectFromPairs, dataflowObject). The list display panel uses it. It does not know action sequences (`templates`, `nameGivenToResult`, Runner form values).

Interpolation:
- Each transformer node has `interpolation`, `"build"` or `"runtime"`; when absent the runtime treats it as `"build"` (`TransformersForRuntime.ts:3909`). In package assets, a rough count of nodes gives 2006 runtime, 245 build, 874 absent. In action templates, build and runtime nodes sit side by side and mean different evaluation times.

---

❓ **Q1** - **What does "create a transformer" save?**
(a) Nothing new. The user builds a transformer in the TransformerEditor or in any transformer field; saving is whatever the host already does.
(b) Also "Save as TransformerDefinition" in the TransformerEditor. It creates a composite TransformerDefinition in the current application with a name, parameters and an interface inferred by #88, and the new transformer appears in the palette as a block.

➡️ (b). Without it the palette of user-defined blocks (round 1 decision 6) has no easy way to get new entries.

❓ **Q2** - **How is a composite TransformerDefinition shown?**
(a) As a Scratch "define" block. Its header shows the name and the parameters from `transformerParameterSchema`; its body is the implementation. Parameters appear as variable blocks in the body. The header can add, rename and remove parameters, and a rename rewrites the body's `getFromContext` references to that parameter.
(b) The same, but the header is read-only and parameters stay in the form view.

➡️ (a). The parameters are local to the definition, so the rename can safely rewrite every reference in the body.

❓ **Q3** - **What does "create an action" save?**
(a) A new custom Runner, shown with a "when run" hat block whose form fields become variable blocks, followed by the action sequence.
(b) A new Endpoint action with a `compositeActionTemplate` implementation, shown with a "define" hat block whose `actionParameters` become variable blocks. It then appears in the palette as an action block.
(c) Both, Runner first.

➡️ (c). A Runner is how a user runs a sequence from the UI today, so it gives a visible result first. Composite Endpoint actions come next, as the action counterpart of Q2.

❓ **Q4** - **How are build and runtime transformers told apart?**
(a) A marker on each block (for example a small "build" tag or a dashed outline for build blocks), with a block menu entry to switch, and the absent value shown as build.
(b) Not shown. The attribute stays in the form view.
(c) Different colors.

➡️ (a). In action templates the two kinds sit next to each other and evaluate at different times, so hiding the difference would make sequences hard to read. Colors are already used for categories (round 2 decision 6).

❓ **Q5** - **Which variable blocks does the palette offer at a given slot?**
(a) Only names visible at that slot, computed by extending `collectTransformerEnvironmentBindings` to action sequences (`templates`, earlier `nameGivenToResult`, Runner form values, define-block parameters). Context names and parameter names form two groups. A variable block has a path picker filled from the inferred type of the value (#88) when it is known, free text otherwise.
(b) Every name used anywhere in the program, with names out of scope flagged after the drop.

➡️ (a). It reuses the walk the list display panel already relies on, and offering only valid names prevents most broken references.

❓ **Q6** - **Where do slots of `compositeRunTestAssertion` come from?**
(a) From its ML schema in the `compositeAction` union, the only action block not computed from an Endpoint.
(b) A hand-written block.
(c) Add an Endpoint definition for it, so every action block comes from an Endpoint.

➡️ (a). It keeps the one exception generic and does not add a model element for a test-only action.

❓ **Q7** - **Do you want a visual mockup before the first sub-issue?**
(a) Yes. A static page that renders three real transformers from the repo (for example `entityDefinition_extractAttributes`, a mapList inside a dataflowObject, and the createEntity Runner sequence) as blocks, with the round 2 layout, for you to correct before any code.
(b) No, the first sub-issue settles the look.

➡️ (a). One static page settles the visual choices (block shapes, slot rows, colors, markers) before they are coded and tested.

❓ **Q8** - **What must the first sub-issue (read-only transformer blocks) accept?**
(a) Every transformer value found in the repo's package assets (Queries, Reports, MiroirTests, TransformerDefinitions, Runners) is mapped to a block tree without error, checked by one `fn.blockModel` case per asset file. A value the mapping cannot shape becomes a generic JSON block, and the count of such blocks is part of the result. The TransformerEditor root gets the Blocks, Form and JSON switch.
(b) A hand-picked set of transformers only.

➡️ (a). The assets hold about 3,000 transformer nodes and cover every transformer type in use, so they catch shapes no hand-picked set would.

❓ **Q9** - **Are these the sub-issues, in this order?**
1. Block model and read-only transformer view (Q8)
2. Undo and redo for edited values, shared by all views
3. Transformer block editing: palette, drag and drop, block menus, tray, inline literals, type flags, evaluation bubble
4. Variable blocks and scope (Q5)
5. Define blocks for composite TransformerDefinitions and "Save as TransformerDefinition" (Q1, Q2), user-defined blocks in the palette
6. Block view switch on every transformer field of the generic value editor
7. Read-only action sequences (Runner, Endpoint composite implementation, MiroirTest composite cases), with build and runtime markers (Q4)
8. Action sequence editing and new Runners with a "when run" hat block (Q3)
9. Composite Endpoint actions with a "define" hat block (Q3)
10. Presentation hints (label templates, icons)

Query blocks and drag and drop tests in Playwright (after #485) stay outside #497, as separate issues.

➡️ Yes, in this order. Each step is usable on its own, and transformers come first because actions reuse their blocks in payload slots.

When these are answered, the frontier should be empty. I will then update #497, create the sub-issues and the branch `claude/497-visual-block-editor`, and start the analysis and TDD plan for the first sub-issue (or the mockup first if Q7 is yes).
