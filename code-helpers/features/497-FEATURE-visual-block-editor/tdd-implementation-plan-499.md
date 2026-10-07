# Issue #499 — TDD Implementation Plan

> Vertical TDD slices (RED → GREEN each), integration-first per `docs/contributing/testing.md`:
> the history is tested through MiroirTest `ui.*` component cases that render the real
> TransformerEditor over the component-test local cache and drive it with clicks, typing and
> keyboard shortcuts. No mocks. The tracer bullet proves that a form edit of the TransformerEditor's
> transformer is undone and redone.
>
> **Execution model:** one green commit per slice, pushed to the working branch. Each slice ends
> with its Validation commands; on success its Realization is appended and its Status flips to ✅.

Analysis: [`./analysis.md`](./analysis.md) (parent issue #497, §6.1 row #499) · Issue: https://github.com/miroir-framework/miroir/issues/499
Working branch: `claude/499-block-editor-undo-redo`

**Resume note:** plan written 2026-10-07.

---

## Scope

- **G2 — Undo.** One undo/redo history of the TransformerEditor's transformer, shared by the Blocks, Form and JSON views, with Undo and Redo buttons and Ctrl+Z / Ctrl+Y (Ctrl+Shift+Z, and Cmd on macOS).
- Undo replaces the #415 confirmations of remove, unwrap and type change under a history. The wrap and pipe dialogs stay, since they choose the type and the slot.
- "Clear" reaches the form, so it can be undone.

This plan does **not** edit blocks (#500) or put a history at every `TypedValueObjectEditor` root (#503). It makes the history generic (a Formik path to watch) so that #503 only has to provide it.

---

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Baseline of the editor suites | ✅ | existing `ui.transformerEditor`, `ui.blockEditor`, `ui.mlElementEditor.*` |
| 1 | Tracer: Undo and Redo buttons on a form edit | ✅ | `ui.valueHistory` TransformerEditor cases |
| 2 | Keyboard shortcuts and one step per typed field | ✅ | `ui.valueHistory` `type` + `keyboard` cases |
| 3 | Every view: JSON re-reads its text, Blocks follow | ✅ | `ui.valueHistory` JSON and Blocks cases |
| 4 | Undo replaces the remove, unwrap and type-change confirmations | ⬜ | updated `ui.transformerEditor` cases, `ui.valueHistory` MlElementEditor case |
| 5 | Clear can be undone; loading a stored transformer resets the history | ⬜ | `ui.valueHistory` Clear case |
| 6 | Nonreg, docs, bundle, AC | ⬜ | nonreg, bundle guard, AC checklist |

---

## Locked implementation defaults

From the analysis (§6.1, D7) and the issue. Deviations go into the slice's Realization.

| Decision | Choice | Serves |
|---|---|---|
| What the history watches | The value at one Formik path (`transformerEditor_transformer_selector.transformer`), observed on each render of a provider: every write path (setFieldValue, `getFieldProps` handlers, effects, the JSON box) is seen the same way | G2 |
| Snapshots | Deep copies (`structuredClone`) compared with `fast-deep-equal`; a restore writes a fresh copy with `setFieldValue`, so no later write can alter a stored entry; at most 100 entries | G2 |
| Granularity | One entry per edit; consecutive edits typed into the same text field (an `input` event of type insert or delete from that field, or a CodeMirror transaction of user event `input` or `delete`; no focus change, undo or redo between) make one entry; typing that comes back to the previous value leaves no entry. `change` steps, switches and selects are one entry each | G2 |
| Where it lives | `ValueObjectEditor/ValueHistory.ts` (the stack, no React) and `ValueHistoryProvider.tsx` (observation, contexts, the keyboard container); the TransformerEditor owns the `ValueHistory` object, so its load effect and Clear can reach it | G2 |
| Buttons | Undo and Redo in the Blocks / Form / JSON switch row of the watched field | G2 |
| Keyboard | Handled on a `ValueHistoryScope`, the element of the watched field (the switch row and its view): Ctrl/Cmd+Z undo, Ctrl+Y and Ctrl/Cmd+Shift+Z redo, matched on `key`, default prevented; events from portals (menus, dialogs) and events a code editor already handled are ignored; CodeMirror's own history and history keymap off under a history; the scope takes the focus back when an edit unmounted the focused element | G2 |
| JSON box | Re-reads its text when the value at its path changes from outside and the text does not already hold it (derived state in `MlElementEditorForm` while its code box is shown, no new effect); the test stand-in becomes an editable textarea | G2 |
| Confirmations | Under a history covering the node: Remove acts at once, a type change drops attributes at once, Unwrap lists one menu entry per child; without a history (other editors) the dialogs stay | G2 |
| Reset | Loading a stored transformer ("defined" mode) resets the history to the loaded value | G2 |
| Contexts | `ValueHistoryContext` (stable: watched path, `covers`, `undo`, `redo`, `markTyped`, `closeGroup`, `restoreFocus`) and `ValueHistoryStatusContext` (`canUndo`, `canRedo`), so only the buttons re-render when the status changes | G2 |

---

## Allocated UUIDs / keys

| Artefact | Value |
|---|---|
| MiroirTest `ui.valueHistory` | `ef540605-8176-45bf-af76-c9d240769c7b`, export `miroirTest_ui_valueHistory` |
| Test ids | `value-history-undo:<rootLessListKey>`, `value-history-redo:<rootLessListKey>`, `code-editor:<Formik path>` (test stand-in of CodeMirror), `transformer-node-action-unwrap:<child path>` |

---

## Test execution conventions

| Purpose | Command |
|---|---|
| `ui.valueHistory` | `npm run testMiroir -w miroir-standalone-app -- --suites ui.valueHistory` |
| Editor suites | `npm run testMiroir -w miroir-standalone-app -- --suites ui.transformerEditor` (and `ui.blockEditor`, `ui.mlElementEditor.object`, `.union`, `.any`) |
| Component suite counts | `npm run testByFile -w miroir-standalone-app -- componentMiroirTests.consistency miroir-component-tests` |
| Rebuild after MiroirTest JSON changes | `npm run build -w miroir-app-miroir` |
| Type check | `npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json` |
| Bundle guard | `npm run build -w miroir-standalone-app && python scripts/check_bundle_policy.py packages/miroir-standalone-app/dist/.vite/bundle-report.json packages/miroir-standalone-app/bundle-policy.json` |
| Scoped nonreg | `npm run nonreg:filesystem -- --runner shared --scope smoke,ui` |

---

## Slice 0 — Baseline of the editor suites

**Status:** ✅ DONE

Run `ui.transformerEditor`, `ui.blockEditor`, `ui.mlElementEditor.object`, `.union`, `.any` and the component counts on the branch base, and record the results.

### Validation

```bash
npm run testMiroir -w miroir-standalone-app -- --suites ui.transformerEditor
npm run testMiroir -w miroir-standalone-app -- --suites ui.blockEditor
npm run testByFile -w miroir-standalone-app -- componentMiroirTests.consistency miroir-component-tests
```

### Realization

- On `_integration` at `ebf6ef2`: `ui.transformerEditor` 26 of 26, `ui.blockEditor` 12 of 12 (125 component leaves).

---

## Slice 1 — Tracer: Undo and Redo buttons on a form edit

**Status:** ✅ DONE

### Goal

A developer edits the transformer in the form, clicks Undo and sees the previous value, clicks Redo and sees the edit again.

**Layers cut:** ValueHistory stack → provider and contexts → switch row buttons → TransformerEditor wiring → MiroirTest asset → Model and counts.

### 1.1 RED

`ui.valueHistory` (new MiroirTest, tags `ui`, `editor`, `transformer`, issue 499), sub-suite on component `TransformerEditor`:
- Undo and Redo are disabled before any edit;
- after `change` of the returned value: Undo enabled; Undo shows "seize value..." again and enables Redo; Redo shows the edit and disables Redo;
- an edit after an Undo drops the redo branch.

### 1.2 GREEN

- `ValueHistory.ts`: `observe(value, typedInto?)`, `undo()`, `redo()`, `reset(value)`, `closeGroup()`, `canUndo`, `canRedo`.
- `ValueHistoryProvider.tsx`: provider observing the value at its Formik path on each render; `ValueHistoryContext`, `ValueHistoryStatusContext`; `ValueHistoryButtons`.
- `BlockViewSwitch.tsx`: the buttons when the history watches the switch's path.
- `TransformerEditor.tsx`: owns the `ValueHistory`; `TransformerDefinitionEditor` wraps the form in the provider.
- miroir-app-miroir: asset, `index.ts`, `index.d.ts`, `src/Model.ts`; counts in `miroir-component-tests.unit.test.tsx` and `docs/reference/testing.md`.

### Validation

```bash
npm run build -w miroir-app-miroir
npm run testMiroir -w miroir-standalone-app -- --suites ui.valueHistory
npm run testMiroir -w miroir-standalone-app -- --suites ui.transformerEditor
npm run testByFile -w miroir-standalone-app -- componentMiroirTests.consistency miroir-component-tests
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
```

### Realization

- `ui.valueHistory` 3 of 3 (12 component instances, 128 leaves); `ui.transformerEditor` 26 of 26 and `ui.blockEditor` 12 of 12 unchanged; standalone-app typecheck adds no error (32, all the MUI 9 props known on `_integration`).
- The buttons carry `aria-disabled` besides `disabled`, so the cases check both states with `waitForAttribute`.
- The `ValueHistory` object lives in the TransformerEditor (a `useState` initializer from the mount-only initial values), so it outlives the definition editor, which unmounts when the selector mode is `none`.
- The consistency test's instance count moved to 12.

---

## Slice 2 — Keyboard shortcuts and one step per typed field

**Status:** ✅ DONE

### 2.1 RED

`ui.valueHistory` TransformerEditor cases:
- `clear` then `type` "typed" in the returned value, then `keyboard` `{Control>}z{/Control}` gives "seize value..." in one step; `{Control>}y{/Control}` gives "typed"; `{Control>}{Shift>}z{/Shift}{/Control}` after another undo also redoes;
- typing in the field, then a `change` of another field, then typing in the first field again makes three undo steps.

### 2.2 GREEN

Provider container: `onKeyDown` (shortcuts, `preventDefault`), `onInput` (typed target), `onFocus` / `onBlur` (close the group). `MlElementEditorReactCodeMirror`: `basicSetup` with `history` and `historyKeymap` off when a history covers its path.

### Validation

As Slice 1.

### Realization

- RED: with the Slice 1 provider, both keyboard cases failed; GREEN with the keyboard handlers.
- **Design review** (three reviewers on the plan against the code, before this commit) found that the design as planned would merge or miss steps at the edges. Fixed here:
  - a select's filter input (`role="combobox"`) fires `input` events while the user filters, then the choice is written: two choices in one select made one step. Only text fields whose `input` event types or deletes text mark a change as typed; a switch fires `input` with no `inputType`;
  - CodeMirror attaches an EditContext in Chromium and Electron, so typing there fires no DOM `input`: the JSON box marks its own typed changes from its transactions (`isUserEvent("input" | "delete")`);
  - menus and dialogs are portals under the provider: Ctrl+Z in an open dialog undid the transformer behind it. The keyboard is now handled by `ValueHistoryScope`, around the watched field only (not the mode, application and transformer selectors), and ignores events from portals and events already handled by a code editor;
  - typing a character and deleting it left a step that changed nothing: such a step is dropped;
  - after an edit that unmounts the focused element (Remove at once in Slice 4, an undo), focus fell to the page, out of reach of Ctrl+Z: the scope (`tabIndex=-1`) takes it back.
- `ui.valueHistory` 8 of 8 (133 leaves): the new cases "typing a character and deleting it adds no step", "two choices in one select are two steps" and "Ctrl+Z in a dialog does not undo the transformer" each fail when their fix is removed.
- CodeMirror's history off cannot be tested in happy-dom (the code editor is a stand-in there).

---

## Slice 3 — Every view: JSON re-reads its text, Blocks follow

**Status:** ✅ DONE

### 3.1 RED

`ui.valueHistory` TransformerEditor cases:
- edit in the form, choose JSON, Undo: the JSON shows "seize value..."; Redo: the edit;
- choose JSON, change the JSON text (test stand-in `code-editor:transformerEditor_transformer_selector.transformer`), choose Form: the form shows it; Undo: "seize value...";
- edit in the form, choose Blocks, Undo: the `returnValue` block shows the old value.

### 3.2 GREEN

- `MlElementEditorForm`, while its code box is shown: the code text follows outside changes of the value (derived state, no effect). The trigger is a change of content since the last render (an undo writes fresh copies, so identity would also re-read boxes the undo did not touch); the text is re-read only when it does not already hold the value, and its validity is reset with it. Not in `useMlElementEditorHooks`, which every object and `any` editor also runs (design review); a value JSON cannot hold (BigInt) keeps the text.
- `MlElementEditorReactCodeMirror`: hooks before the early returns, the mount effect still skipped for the stand-in and read-only boxes; the stand-in is a textarea writing through the same `handleChange`, which replaces the `<pre>` (both would match the same `byText`).
- `componentTestMode.286.phase4` checks the textarea stand-in.

### Validation

As Slice 1, plus `ui.blockEditor`, `ui.mlElementEditor.any`, `.allTypesPattern`, `.simpleType` and `componentTestMode.286.phase4`.

### Realization

- RED: the two JSON cases failed on the text after Undo (the stand-in already a textarea); the Blocks case passed from the start, since blocks are drawn from the value.
- The re-read did not reach the screen at first: `MlElementEditorForm` returns a `useMemo` of its output whose dependencies list the value but not the code box state, so a render that changed only `codeMirrorValue` (a re-read, or invalid JSON typed in the box) showed the previous text. `codeMirrorValue` and `codeMirrorIsValidJson` are now dependencies. Without them, the JSON-text case fails, and so does a fourth case, "Undo after an invalid JSON text brings back the JSON of the restored value" (the textarea goes back to the old text as soon as invalid JSON is typed into it).
- `ui.valueHistory` 12 of 12 (137 leaves); `ui.blockEditor` 14, `ui.mlElementEditor.any` 17, `.allTypesPattern` 6, `.simpleType` 14, `ui.transformerEditor` 28 and `componentTestMode.286.phase4` 2 pass.
- The stand-in keeps the `codeMirrorValue:` label: the existing cases find the JSON by its text, which the textarea holds.
- Moving the CodeMirror hooks before the early returns fixed its 4 `react-hooks/rules-of-hooks` violations, so their suppressions are gone.

---

## Slice 4 — Undo replaces the remove, unwrap and type-change confirmations

**Status:** ⬜

### 4.1 RED

- `ui.transformerEditor` cases 3, 16, 17 and 18 rewritten: the type change to `getObjectValues` drops the edited value at once and Undo restores it; Unwrap of an `ifThenElse` lists one entry per child and keeps the chosen one; Remove acts at once and Undo restores the node. Case 15 is unchanged: Unwrap keeps its test id, disabled with no child and acting at once with one child; per-child entries appear from two children.
- `ui.valueHistory`: Ctrl+Z right after a Remove restores the node (the focus came back to the scope).
- `ui.valueHistory` MlElementEditor case: without a history, Remove still asks for a confirmation.

### 4.2 GREEN

`MlLiteralEditor` computes `undoable` from `ValueHistoryContext.covers(node path)`; `TransformerNodeActions` takes it as a prop (no dialog for Remove, one menu entry per child for Unwrap); the type change skips `TransformerTypeChangeDialog` when undoable.

### Validation

As Slice 1, plus the `ui.transformerEditor` suite description updated.

---

## Slice 5 — Clear can be undone; loading a stored transformer resets the history

**Status:** ⬜

### 5.1 RED

`ui.valueHistory` TransformerEditor case: edit, Clear shows the default transformer, Undo brings the edit back.

### 5.2 GREEN

- Clear writes a copy of the default transformer to the form through Formik's `innerRef`, besides the persisted state.
- The "defined" load effect calls `reset` on the history with the loaded transformer before writing it.

The reset has no component case: the component-test store holds no TransformerDefinition (analysis §4.7), so "defined" mode lists nothing. The runner option that loads extra instances comes with #502; its first case can check the reset.

### Validation

As Slice 1.

---

## Slice 6 — Nonreg, docs, bundle, AC

**Status:** ⬜

### 6.1 Nonreg

`ui.valueHistory` runs in `appstack-miroir-component-tests` with the other component suites; no new step.

### 6.2 Bundle

Fresh app build; the bundle guard passes. The history is on the page (small); the block view chunk is unchanged.

### 6.3 Docs

- `docs/reference/transformers.md`: "Undo and redo" in the block editor section.
- `docs/reference/testing.md`: instance and leaf counts.

### 6.4 AC checklist

| Acceptance criterion (#499) | Proof |
|---|---|
| In the TransformerEditor, an edit made in any view is undone and redone from any view | `ui.valueHistory` (Form, JSON and Blocks cases) |
| Undo replaces the #415 confirmations of remove, unwrap and type change; the wrap and pipe dialogs stay | `ui.transformerEditor` cases 3, 16 to 18 (wrap and pipe cases unchanged), `ui.valueHistory` MlElementEditor case |
| A `ui.*` MiroirTest case edits, undoes and redoes a transformer | `ui.valueHistory` |

### Validation

```bash
python scripts/sync_agent_skills.py --check
python -m pytest scripts/tests -q
python scripts/check_dependency_policy.py
npm run lint
npm run miroir-env -- check --strict --tracked-clean
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npm run test -w miroir-core -- ''
npm run nonreg:filesystem -- --runner shared
```
