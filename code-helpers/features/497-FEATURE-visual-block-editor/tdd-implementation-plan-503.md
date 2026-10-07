# TDD implementation plan — #503 block view on every transformer field

Part of #497 (analysis: [analysis.md](analysis.md), decisions D5, D6, §4.4). Builds on #498 (switch and dispatcher), #499 (history), #500 (editing).

## Goal

The Blocks / Form / JSON switch appears on every transformer field of the generic value editor, in every instance editor (`TypedValueObjectEditor`), with undo and redo at the editor root. Outside the TransformerEditor there is no input or root environment: the subtree result bubble is hidden, root types are `any`, the scope is empty.

## Acceptance criteria (issue)

1. An instance editor on a Query with a runtime transformer: switch the field to blocks, edit it, save the instance.
2. Fields whose schema is not a transformer show no switch.

## Corpus (measured 2026-10-07 on the asset folders, with `mlsTypeCheck` as the editor runs it)

- Direct slots: the key-map entry's `rawSchema` is a reference to `coreTransformerForBuildPlusRuntime` (Query `runtimeTransformers` entries, Report runtime transformers, Runner `initialFormValues`, Endpoint and TransformerDefinition bodies, MiroirTest arguments).
- Template slots: the reference is `miroirTemplate_<schema uuid>_coreTransformerForBuildPlusRuntime` (Query and Report combiner `applyTransformer`, Runner form schema `if/then/else`). The #498 predicate missed them; their `typePath` segments have the same prefix, so the nested check missed them too.
- Union-wrapped slots: `rawSchema` is a union with a transformer branch. 64 in the Library Reports, almost all template holes (`parentName`, `parentUuid`, `instanceUuid`, …) holding a plain value. In the 8 holding a transformer, `chosenUnionBranchRawSchema` is the transformer branch (an object schema with `transformerType`), and in none of the 56 others: the switch is offered on the chosen branch, not the declared union, so a plain `parentUuid` gets no switch.
- Sequences: `compositeActionSequence`, `compositeActionSequenceTemplate`, `compositeActionTemplate` roots get the switch with #504. Until then they get none, and the transformers inside a sequence get none either (they are nested in a sequence #504 shows as blocks).

## Decisions taken here (defaults, revisable)

| Fork | Default | Why |
|---|---|---|
| Union-wrapped slot | switch when the chosen branch is a transformer | the declared union would put a switch on every template hole of a Query |
| Template references | count as the transformer schema, for roots and for nesting | Query `applyTransformer` is a runtime transformer; without the prefix rule its children would each get a switch |
| Transformers inside sequences | no switch until #504 | #504 makes the sequence the block root; a switch per nested transformer now would be removed then |
| Predicate place | miroir-core `2_domain/BlockViewFields.ts`, `fn.blockView.fields` cases | pure over a key-map entry; fn cases need a registered core function |
| Read-only editors | the switch is offered, the block view is read-only | reading transformers is G6's first purpose |
| History at the root | one history per editable `TypedValueObjectEditor` root, on its Formik section path, unless an outer one exists (TransformerEditor); reset when the edited instance's uuid changes; Undo and Redo above the form; the form is the keyboard scope | #499 made the history generic for this; an outer history keeps the TransformerEditor as it is |
| AC 1 test kind | `report.queryDetails` (Report test on Miroir's QueryDetails Report over a Library Query), not `ui.*` | component tests run over a store without Queries and a recording DomainController, so they cannot save; a Report test mounts the real instance editor, saves, commits and reads the store |

## Slices

| # | Slice | Status |
|---|---|---|
| 0 | This plan | ✅ |
| 1 | Predicate: template references, union-wrapped slots by chosen branch, transformers only as roots (fn cases) | ✅ |
| 2 | Mode provider at every `TypedValueObjectEditor` root; read-only block view in read-only editors | ✅ |
| 3 | History at every editable root | ✅ |
| 4 | AC 1 and 2: `report.queryDetails` | ✅ |
| 5 | Docs, nonreg, PR | ✅ |

## Slice 1 — Predicate

RED: `fn.blockView.fields`: a direct transformer reference is a root; a template reference is a root; a field nested under a transformer (direct or template `ref:` segment) is not; a union whose chosen branch is a transformer is a root, one whose chosen branch is a string is not; a sequence reference is not (until #504); a transformer nested in a sequence is not; a string field is not.
GREEN: `isBlockViewRoot` moves to miroir-core, registered for fn cases; `BlockViewMode.tsx` imports it.

## Slice 2 — Mode provider at every root

RED: Report test step (slice 4) and the existing `ui.blockEditor` / `ui.blockEditing` cases stay green (they render under their own provider).
GREEN: `TypedValueObjectEditor` renders a `BlockViewModeProvider` unless one is above; `BlockViewSwitch` gets `readOnly` and passes no `onCommit` then.

## Slice 3 — History at every editable root

RED: Report test (slice 4): after the block edit, Undo at the root restores the value, Redo applies it again.
GREEN: `EditorRootHistory` in `ValueObjectEditor/`: provider, buttons (`value-history-undo:` with the root key `""`), scope; reset on uuid change during render.

## Slice 4 — AC

RED/GREEN: `report.queryDetails` suite on Miroir's QueryDetails Report (`4bbf3894-…`), Library section `model`, Query `BookCountByPublisher` (`6176dcdf-…`): the `name` field has no switch (AC 2); `definition.runtimeTransformers.00_BookCountByPublisher` has one; Blocks; edit the `groupBy` list (or the `applyTo` reference) in place; submit; commit; read the stored Query: the edit is there (AC 1).

## Realization

- Slice 1: `fn.blockView.fields`, 13 cases (generator `scratchpad/503/gen_fields.py`, not kept). `BlockViewMode.tsx` lost its own predicate.
- Slices 2–3: `BlockViewModeRoot` (a provider unless one is above) and `EditorRootHistory` (`ValueObjectEditor/`) wrap every `TypedValueObjectEditor`; the history resets during render when the edited uuid changes (no effect). The component tests stay green (163 passed): they mount `MlElementEditor` or the TransformerEditor, which keep their own provider and history.
- Slice 4: the Library testbed of the Report tests had no Query, so `libraryBookDetailsSeed` (`3123740d-…`) now seeds BookCountByPublisher in `testbedModel.storedQueries`; its generator `make_report_test_configuration.py` (#330) also had a pre-#344 package path. `aggregate.groupBy` is a primitive parameter of its block, so the test edits the whole list in one field (`[[` types a `[` with user-event). Mutation check: with the old `groupBy` as the expected stored value, the save leaf fails at its `expectActionResult`.
- Slice 5: nonreg step `integ-report.queryDetails` (scope `ui`, shared group `standalone-app-report-suites`); docs in `docs/reference/transformers.md` (Blocks in every instance editor) and the Report tests table of `docs/reference/testing.md`.

### Review (Greptile, PR #521)

- **Application transformers outside the TransformerEditor.** The block views of an instance editor read Miroir's model environment, so a composite of the edited application (#502) was unknown there. `TypedValueObjectEditor` now provides the application's model environment in `BlockModelEnvironmentContext`, which `useBlockModelEnvironment` reads after `BlockRunInputContext` (no input, so no result bubble). Leaf "an application transformer is a block of its own": it creates a composite in the Library model and makes the Query read it, through `compositeAction` steps whose objects are wrapped in a build `returnValue` (the step resolves build templates, and `transformerParameterSchema` has a `transformerType` key). Without the provider it fails: the root block has no `data-transformer-type`.
- **Transformers inside a template hole holding a transformer.** The type check marks the chosen branch of a union with `union choice(...)`, not with the transformer's `ref:`, so the transformers inside such a hole each got a switch (probe: a RunnerDetails `parentName` holding an `aggregate` gave its `applyTo` a switch). `isBlockViewRoot` takes the key map and looks the enclosing fields up in it. Two fn cases, and `blockViewFields.typeCheck.unit.test.ts` on the key map of a real type check (fails without the key map).
