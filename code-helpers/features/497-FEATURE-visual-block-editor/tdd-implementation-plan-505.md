# Issue #505 — TDD Implementation Plan

> Vertical TDD slices (RED → GREEN each), integration-first per `docs/contributing/testing.md`.
> Sequence edits, the action palette and the Runner hat are pure miroir-core functions tested with
> `fn.*` MiroirTest cases; the view with `ui.blockEditor` and `ui.blockEditing` component cases.
> No mocks.
>
> **Execution model:** one green commit per slice, pushed to the working branch. Each slice ends
> with its Validation commands; on success its Realization is appended and its Status flips to ✅.

Analysis: [`./analysis.md`](./analysis.md) (parent issue #497, G8, D2, D10, §4.5, §4.7, §6.1 row #505) · Issue: https://github.com/miroir-framework/miroir/issues/505
Working branch: `claude/505-block-editor-edit-sequences`

**Resume note:** plan written 2026-10-07 from `_integration` at `2ad5a31` (#504 merged).

---

## Scope

- **G8 — Edit sequences, create Runners.** A composite action sequence is edited with blocks: Endpoint actions in the palette grouped by Endpoint; action blocks inserted, moved, removed and reordered; payload slots filled with transformer blocks. A custom Runner shows a "when run" hat block whose form fields are variable blocks. A new sequence is saved as a new Runner.
- **D10.** The assert block (`compositeRunTestAssertion`) stays out of the palette for Runner and Endpoint sequences: `handleCompositeActionTemplate` refuses it. It is offered for test sequences (`compositeActionSequence` fields).

## Acceptance criteria (issue)

1. A `ui.blockEditing` case builds a sequence with a createInstance action whose payload uses a form field, saves it as a new Runner, and the Runner creates the instance when run (runner option of #502).
2. An existing Runner edited with blocks and saved still runs.

## What the code does today (survey, 2026-10-07)

| Place | Today | Gap |
|---|---|---|
| `BlockEditorView` | an action value is read-only (`onCommit` dropped) | no editing of sequences |
| `TransformerTreeEdit` | insert, remove, move work on transformer slots (`slotPositionAtPath`) | a step of `actionSequence`, a payload attribute or a template is no transformer slot |
| Block model | action rows: the present attributes only | an absent declared payload attribute has no row to fill |
| Palette | transformer types and variables | no actions |
| Scope | `compositeActionEnvironmentAt`, `runnerEnvironment` (#501) | not used by the view |
| Runner | `customRunner`: `formMLSchema` (form values under the Runner's name, read as `getFromParameters [runner, field]`) and `compositeActionSequence`; run by `StoredRunnerView` → `handleCompositeActionTemplate`, which resolves every step at runtime with the form values as parameters | no hat, no way to build or save one from blocks |
| Saving | `TransformerDefinitionSave` (#502): `createInstance` / `updateInstance` in a `transactionalInstanceAction` for a model section | nothing for Runners |

---

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | This plan | ✅ | — |
| 1 | Sequence edits, default actions, action palette (core) | ⬜ | `fn.blockModel` "sequence editing" cases |
| 2 | Runner hat and form fields (core) | ⬜ | `fn.blockModel` "runner hat" cases |
| 3 | Editing sequences in the block view | ⬜ | `ui.blockEditor` "editing a Runner sequence" |
| 4 | The "when run" hat in the block view | ⬜ | `ui.blockEditor` hat cases |
| 5 | Sequence editor, Save as Runner, Run (AC 1, AC 2) | ⬜ | `ui.blockEditing` "SequenceEditor on the Library" |
| 6 | Docs, nonreg, PR | ⬜ | nonreg |

---

## Locked implementation defaults

| Decision | Choice | Serves |
|---|---|---|
| Positions | `blockInsertPositions(root, options)` in `2_domain/ActionSequenceEdit.ts`: the transformer positions of `transformerInsertPositions` for a transformer root; for an action root, the end of every `actionSequence` (holds an action), every absent declared payload attribute (a slot), the end of every plain list and a new entry of `templates`, and the positions of every transformer found in the action. Each position says what it `holds`: `action` or `transformer`. | issue bullet 1 |
| Edits | `insertBlockNode`, `removeBlockNode`, `moveBlockNode`: a position owned by a transformer slot goes to the #500 functions; otherwise a list position inserts before the item there, a record key is set (a taken `templates` key gets a number suffix), and a remove deletes the list item or the key. `reorderTransformerNode` already works on any list. | issue bullet 1 |
| Replace a value | In an action, any value below `payload` or `templates` can hold a transformer (`handleCompositeActionTemplate` resolves the whole step), so a literal, object or list block there takes the armed block (`isValuePosition`). | issue bullet 1 ("edit payload slots") |
| New action | `defaultActionNode(actionType, modelEnvironment)`: `actionType`, `endpoint` of its Endpoint, `payload` the default of the payload schema, `actionLabel` the type, numbered when taken (results are bound by label). | issue bullet 1 |
| Palette | `actionPaletteGroups(modelEnvironment, { withTestAssertion })`: the Endpoint actions of the registry grouped by Endpoint name, sorted; `compositeRunTestAssertion` only with `withTestAssertion`. The block view shows them above the transformer types when it edits an action; `withTestAssertion` when the field is declared `compositeActionSequence` (MiroirTest, Test). | issue bullets 1, 2 |
| Hat | `runnerHat(runner)`: name, label and form fields (keys of `formMLSchema.mlSchema.definition`, with whether the sequence reads each one). `addRunnerFormField`, `renameRunnerFormField` (rewrites every `getFromParameters` / `getFromContext` reading `[runner, from, …]`), `removeRunnerFormField` (refused while read). A form field chip arms a variable reading `[runner, field]` as `getFromParameters`, runtime. | issue bullet 3 |
| Hat placement | The block view shows the hat above a Runner's sequence: in the Runner instance editor (read from the enclosing `customRunner` value, fields read-only there, as they are edited in `formMLSchema`), and in the sequence editor (fields added, renamed, removed in the hat). Variables of the sequence come from `compositeActionEnvironmentAt` with `runnerEnvironment(name)`. | issue bullet 3 |
| Sequence editor | `SequenceEditor` on the Tools page, under the TransformerEditor: a Runner select (a new sequence, or a custom Runner of the editor application), the sequence in a Formik form with the Blocks / Form / JSON switch and undo (#499), the hat above it. "Save `<name>`" updates the chosen Runner; "Save…" opens the save dialog of a new sequence: "create Runner" (on), "create Action" (off and disabled until #506), name and label. The Runner is created in the application's section for Runners in a transaction, as #502 saves composites. A saved Runner can be run below the editor with `StoredRunnerView`. | issue bullet 4, AC 1, AC 2 |
| Component test | Registry entry `SequenceEditor` (`SequenceEditorForTest`): the editor on an application of the context, and the names of the instances of a watched Entity as `data-names`, to see what a run created. `TransformerBlocks` gets `editable`: the block view of a Runner's sequence with a writer, its value shown as `data-value`. | AC 1, AC 2 |

---

## Slice 1 — Sequence edits, default actions, action palette

RED: `fn.blockModel` suite "sequence editing": positions of a sequence (end of steps, an absent payload attribute, a template entry, the slots of a payload transformer, a plain list's end), insert an action at the end and between two steps, remove a step, move a step into a nested sequence, insert a transformer in a payload attribute, a value position below a payload, `defaultActionNode` of createInstance, `actionPaletteGroups` with and without the assertion; with `emptyOptionalSlots`, an absent payload attribute is an empty row.
GREEN: `ActionSequenceEdit.ts`, the block model rows, registry entries.

Validation: `npm run testMiroir -w miroir-core -- --suites fn.blockModel --mode unit`; `npm run test -w miroir-core -- ''`; core `tsc`.

## Slice 2 — Runner hat and form fields

RED: `fn.blockModel` suite "runner hat": `runnerHat` of createEntity (its fields, read flags), add a field, rename a field and its reads (a read of another Runner's name is kept), remove an unread field, refuse to remove a read one.
GREEN: `RunnerHat.ts`.

## Slice 3 — Editing sequences in the block view

RED: `ui.blockEditor` suite "editing a Runner sequence" (TransformerBlocks `editable`): the action palette lists createInstance under InstanceEndpoint and no assertion; a createInstance put at the end of the steps; a step moved up and removed from its menu; a transformer from the palette in an empty payload slot; a literal of a payload replaced by a variable.
GREEN: `BlockEditing` on the generic edits, action armed blocks, `ActionNodeActions`, palette section, value replace targets, editable labels.

## Slice 4 — The "when run" hat

RED: `ui.blockEditor`: the createEntity Runner shows its hat with its form fields; a form field armed replaces a literal with `getFromParameters [createEntity, field]`; the instance editor of a Runner shows the hat (field read from its `customRunner` value).
GREEN: `BlockRunnerHat`, `BlockRunnerContext`, detection in `BlockViewSwitch`.

## Slice 5 — Sequence editor, Save as Runner, Run

RED: `ui.blockEditing` suite "SequenceEditor on the Library" (wired local cache): AC 1 (add a form field, put createInstance, its object's name from the form field, Save… with create Runner, run it with a name, the Publisher is created); AC 2 (an existing custom Runner chosen, edited with blocks, Save, run, the instance created reflects the edit).
GREEN: `SequenceEditor`, `RunnerSave`, Tools page, registry entry.

## Slice 6 — Docs, nonreg, PR

`docs/reference/transformers.md` (editing sequences, the hat, the sequence editor); nonreg filesystem shared runner; PR into `_integration` with `Closes #505`.
