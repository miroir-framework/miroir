# Issue #506 — TDD Implementation Plan

> Vertical TDD slices (RED → GREEN each), integration-first per `docs/contributing/testing.md`.
> The action edits are pure miroir-core functions tested with `fn.*` MiroirTest cases; the view
> with `ui.blockEditing` component cases (off the page bundle, see the #505 plan's deviation). No
> mocks.
>
> **Execution model:** one green commit per slice, pushed to the working branch. Each slice ends
> with its Validation commands; on success its Realization is appended and its Status flips to ✅.

Analysis: [`./analysis.md`](./analysis.md) (parent issue #497, G9, D12, §6.1 row #506) · Issue: https://github.com/miroir-framework/miroir/issues/506
Working branch: `claude/506-block-editor-endpoint-actions`

**Resume note:** plan written 2026-10-07 from `_integration` at `e7f2adf` (#505 merged).

---

## Scope

- **G9 — Create composite actions.** The "create Action" switch of the save dialog (#505) creates an Endpoint action whose implementation is a `compositeActionTemplate`, in an existing Endpoint of the edited application or a new one.
- A composite Endpoint action shows a "define" hat block: its name (the action type) and its parameters (the attributes of its `payload`), which are variable blocks of the body. Its parameters are added, renamed and removed in the hat, as for composite TransformerDefinitions (#502).
- New composite actions are in the palette through the Endpoint registry of #504.

## Acceptance criteria (issue)

1. A component case creates a composite action in a new Endpoint, then uses it as a block in another sequence that runs as expected (the issue says `ui.blockEditor`; the case goes to `ui.blockEditing`, which is off the page bundle).
2. `entity_DuplicateAttribute` (ModelEndpoint) shows as a define block and round-trips without change.

## What the code does today (survey, 2026-10-07)

| Place | Today | Gap |
|---|---|---|
| Endpoint action | `actionParameters` is an object ML schema: `actionType` (literal), `actionLabel`, `endpoint` (literal), `payload` (object); a `compositeActionTemplate` implementation reads the payload as `getFromContext ["payload", p]` (`entity_DuplicateAttribute`) | nothing builds one |
| Running | `handleApplicationAction` finds the Endpoint in `endpointsByUuid` (the client builds it from the local cache of every application) and runs the template with the action as parameters | — |
| Registry | `endpointActionRegistry` (#504): Miroir's Endpoints first, then the application's; action types are global | — |
| Define block | `BlockDefine` / `BlockDefineHeader` (#502): a composite TransformerDefinition's name and parameters, read as context names | parameters read by name only, no `payload` path |
| Save dialog | "create Runner" on, "create Action" off and disabled (#505) | — |
| `actionRunner` | a Runner calling an Endpoint action; its form is the action's `actionParameters` under the Runner's name (`RunnerView`) | — |

---

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | This plan | ✅ | — |
| 1 | Composite Endpoint actions and their hat (core) | ✅ | `fn.blockModel` "endpoint actions" |
| 2 | The define hat of an Endpoint action in the block view (AC 2) | ✅ | `ui.blockEditing` "an Endpoint action" |
| 3 | Save as Action, the palette, a run (AC 1) | ✅ | `ui.blockEditing` "SequenceEditor on the Library" |
| 4 | Docs, nonreg, PR | ✅ | nonreg |

---

## Locked implementation defaults

| Decision | Choice | Serves |
|---|---|---|
| Parameters | The parameters of a composite action are the attributes of `actionParameters.payload.definition`; the body reads `p` as `getFromContext ["payload", p]`, runtime, as `entity_DuplicateAttribute` does. | bullet 2 |
| Hat | `endpointActionHat(action)`: name (the action type), parameters (name, type, whether the body reads it), for a `compositeActionTemplate` action whose payload is an object schema. `addEndpointActionParameter`, `renameEndpointActionParameter` (rewrites the reads of `["payload", from, …]`), `removeEndpointActionParameter` (refused while read). | bullet 2 |
| From a sequence | `compositeEndpointAction({ actionType, endpointUuid, sequence, runnerName, fields })`: the Runner's form fields become the payload parameters and the sequence's reads of `[runner, f]` become `getFromContext ["payload", f]`; `actionType` must be a name free in the registry (action types are global). | bullet 1 |
| Endpoints | `addEndpointAction(endpoint, action)` appends to `definition.actions`; `newEndpoint({ uuid, application, name, actions })` gives version `1`. Both are saved in the application's model section in a transaction, as Runners are (#505). | bullet 1 |
| Both switches | With "create Runner" and "create Action" both on, the Runner is an `actionRunner` calling the new action, so the sequence is stored once (the issue's proposal). | bullet 4 |
| Define hat in the view | `BlockDefine` gets the read path of a parameter (`["payload", p]` for an action) and the context names of the body (`payload`). The block view of an Endpoint action's `actionImplementation.definition` in an instance editor shows the hat of the enclosing action; its parameter edits write the whole action (one undo step). | bullet 2, AC 2 |
| Dialog | "create Action" on: an Endpoint select (the edited application's Endpoints with actions, or a new Endpoint named there) and the action name. | bullet 1 |

---

## Slice 1 — Composite Endpoint actions and their hat (core)

RED: `fn.blockModel` suite "endpoint actions": the hat of `entity_DuplicateAttribute` (name, parameters, read flags); a parameter added, renamed (reads follow, quoted values stay), a read one refused on remove; an action from a Runner sequence (fields to parameters, reads to `payload`); a taken action type refused; an action appended to an Endpoint; a new Endpoint.
GREEN: `2_domain/EndpointActionEdit.ts`, registry entries.

**Realization (✅):** `EndpointActionEdit.ts` has `endpointActionHat`, `endpointActionParameterReads`, `add/rename/removeEndpointActionParameter`, `compositeEndpointAction`, `addEndpointAction` and `newEndpoint`, registered in `FunctionCallTestRegistry` and exported from the index. A read is a `getFromContext` / `getFromParameters` whose `referenceName` or `referencePath` starts with the prefix; the `value` of a `returnValue` is quoted and skipped, as in `RunnerHat`. The suite "endpoint actions" (15 cases) in `fn.blockModel` embeds `entity_DuplicateAttribute` as found in ModelEndpoint: 7 parameters, 4 read (`application`, `columns`, `sourceEntityUuid`, `targetEntityUuid`). `npm run testMiroir -w miroir-core -- --suites fn.blockModel --mode unit`: 94/94; core typecheck clean.

## Slice 2 — The define hat of an Endpoint action (AC 2)

RED: `ui.blockEditing` suite "an Endpoint action": `entity_DuplicateAttribute` in the block view shows the define hat with its parameters, read flags, and its steps, and its value is unchanged (round trip); in an editable view, a parameter armed from the hat replaces a literal with `getFromContext ["payload", p]`; a parameter renamed in the hat rewrites its reads.
GREEN: `BlockDefine` read paths and context names, the hat for actions, detection in `BlockViewSwitch`, the test component.

**Realization (✅):** `BlockDefine` has an optional `contextName`: the parameters of an Endpoint action are attributes of `payload`, so the body's root environment has the context name `payload`, and a parameter chip arms `{ source: "context", name: "payload", path: ["payload", p] }` (a `referencePath` read). `BlockEndpointAction.ts` gives `useBlockDefineOfEndpointAction(action, setAction, key)` over the slice 1 functions. `BlockViewSwitch` detects a field ending in `actionImplementation.definition`, reads the action around it, and writes the whole action with one `setFieldValue` on a parameter change. `TransformerBlocks` takes `endpointAction` (an action type of ModelEndpoint), with `block-action-value` holding the action. Three suites in `ui.blockEditing` (5 leaves): "an Endpoint action" (read-only: define block, read flags, steps, the value unchanged); "an Endpoint action edited" (the value unchanged when editable; `targetEntityName` replaces the `entityName` read by Replace with in the block menu: the third step's payload is the only one that takes blocks, the query steps' payloads being one block each; a rename, a read one not removable, an unread one removed, a taken name refused); "an Endpoint action in an instance editor" (`MlElementEditor` with the Endpoint Entity's own `actionImplementation` schema: a rename writes the action). The round trip compares `block-action-value` with the action's JSON. `ui.blockEditing` 52/52; leaf count 199.

## Slice 3 — Save as Action, the palette, a run (AC 1)

RED: `ui.blockEditing` "SequenceEditor on the Library": a sequence creating a Publisher from a form field saved with "create Action" in a new Endpoint; a new sequence finds the action in the palette under that Endpoint, puts it with a name in its payload, is saved as a Runner and run: the Publisher is created. Both switches on give an `actionRunner`.
GREEN: `SequenceSaveDialog` "create Action", `SequenceEditor` saves.

**Realization (✅):** the dialog's "create Action" switch is on offer. With it, the name is the action type, and an Endpoint select lists the application's Endpoints that declare actions, then "New Endpoint" with a name field. `SequenceEditor` reads the Endpoints from the local cache, builds the action with `compositeEndpointAction` (the Runner's `mlSchema` form fields as parameters; a computed form is refused), appends it with `addEndpointAction` or creates the Endpoint with `newEndpoint`, and saves it with `saveInstanceFromUI` (the model section, in the open transaction). With both switches on, an `actionRunner` named like the action calls it and runs below the editor until another sequence is chosen.

Two findings, both fixed:
- **Running an action of an uncommitted Endpoint.** `DomainController.handleAction` found the application of an Endpoint through the static map or the persisted Endpoint instance, so a new Endpoint fell through to `handleMiroirAction` ("unknown action"). The caller's model environment, read from the local cache, knows it: `handleAction` now takes the application from `currentModelEnvironment.endpointsByUuid` when nothing else gives it.
- **The action schema in the test cache.** The deployment schema adds an application's Endpoint actions only when the model names its application (`currentModel.applicationUuid`, from the SelfApplication instance). The "SequenceEditor on the Library" suite now puts the Library's SelfApplication instance in the cache, as the app has it; without it a step calling the new action failed the type check.

Cases (in "SequenceEditor on the Library"): AC 1, the Runner addPlainPublisher gets a form field read for the Publisher's name and a generated uuid, is saved as the action `addNamedPublisher` of a new Endpoint, and a new sequence takes it from the palette, sets its parameter, is saved as a Runner and run: the Publisher is created. Both switches: the action Runner's form is the action's payload; filled and run, it creates the Publisher. The cases of the suite share their store, hence the generated uuid and distinct names. The #505 step "create Action is not offered yet" is gone. `ui.blockEditing` 54/54; leaf count 201.

## Slice 4 — Docs, nonreg, PR

`docs/reference/transformers.md` (composite Endpoint actions); nonreg filesystem shared runner; PR into `_integration` with `Closes #506`.

**Realization (✅):** the section "Composite Endpoint actions: define blocks and Save as Action" in `docs/reference/transformers.md`. Pre-push gate clean (3039 core unit tests). `nonreg:filesystem --runner shared`: 103 passed, 4 failed, the MiroirTestDisplay steps of #510, failing the same way on `_integration`.
