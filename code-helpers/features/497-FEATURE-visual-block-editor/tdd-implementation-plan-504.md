# Issue #504 — TDD Implementation Plan

> Vertical TDD slices (RED → GREEN each), integration-first per `docs/contributing/testing.md`.
> The action registry and the sequence block model are pure miroir-core functions tested with
> `fn.blockModel` cases and the platform asset sweep; the view with `ui.blockEditor` component
> cases. No mocks.
>
> **Execution model:** one green commit per slice, pushed to the working branch. Each slice ends
> with its Validation commands; on success its Realization is appended and its Status flips to ✅.

Analysis: [`./analysis.md`](./analysis.md) (parent issue #497, G7, G11, D1-b, D6, D8, D10, D12, §4.5) · Issue: https://github.com/miroir-framework/miroir/issues/504
Working branch: `claude/504-block-editor-action-sequences`

**Resume note:** plan written 2026-10-07 from `_integration` at `d9e6fad` (#503 merged).

---

## Scope

- **G7 — Read action sequences as blocks.** A composite action sequence (Runner `compositeActionSequence`, Endpoint `compositeActionTemplate` implementations, MiroirTest sequences) is a stack of command blocks, read-only, with transformer blocks in its payload slots.
- **G11 — Build or runtime at a glance.** A transformer is marked build when it is evaluated at build, by the step at which it actually runs.
- **D10 first.** `compositeRunTestAssertion` becomes a DomainEndpoint action with its assertion in `payload`.

## Acceptance criteria (issue)

1. Every composite action sequence in the package assets maps to a block tree without error: the #498 platform sweep, extended; hand-written `fn.blockModel` cases for the action mapping rules.
2. A `ui.blockEditor` case shows the createEntity Runner sequence as blocks.

## What the code does today (survey, 2026-10-07)

| Place | Today | Gap |
|---|---|---|
| `compositeRunTestAssertion` | hand-written context schema (`getMiroirFundamentalMlSchema.ts:3209-3243`), explicit branch of `compositeAction` (`:3273-3279`); shape `{actionType, actionLabel, nameGivenToResult, testAssertion}` in 191 asset instances (23 files, all round-trip with `json.dumps(indent=2)`) and the TS sites (`DomainController.ts` 3 loops and `handleTestCompositeActionAssertion`, `ResolveCompositeActionTemplate.ts:116`, `CompositeActionScope.ts:67`, 2 standalone-app test builders, 1 Python generator) | no Endpoint action, no `endpoint`, no `payload` |
| DomainEndpoint `1e2ef8e6` | 8 actions; `compositeRunBoxedQueryAction` has `nameGivenToResult` and `payload: runBoxedQueryAction`; schemas derived with `getEndpointActions(domainEndpointVersionV1)` | — |
| `domainAction` union | spreads every DomainEndpoint action but `compositeActionSequence` | the assertion would be a second branch with the same discriminator if the explicit one stayed |
| Endpoints in the environment | `MiroirModelEnvironment.endpointsByUuid` (Miroir's static Endpoints by default; in the client, the Endpoints of every application of the deployment map) and `currentModel.endpoints` | no lookup by `actionType` |
| Block model | `transformerBlockTree` (TransformerBlockModel.ts): transformer, object, list, literal, mlSchema, json nodes; `interpolation` is the stored attribute | no action or sequence node; marks follow the stored attribute |
| Field switch | `isBlockViewRoot` roots: the two transformer schemas; sequences only enclose | sequences get no switch |
| Component tests | `TransformerBlocks` registry entry: the block view of a stored TransformerDefinition's body | nothing for a Runner |

---

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | This plan | ✅ | — |
| 1 | `compositeRunTestAssertion` is a DomainEndpoint action (D10) | ✅ | core unit tests, action and runner MiroirTests, nonreg |
| 2 | Action registry (D12) | ✅ | `fn.blockModel` "action registry" cases |
| 3 | Sequence block model; marks by evaluation step | ✅ | `fn.blockModel` "action sequences" cases |
| 4 | Corpus sweep over every sequence (AC 1) | ✅ | `transformerBlockModelAssets.unit.test.ts` |
| 5 | Sequence fields get the switch; read-only stacked blocks (AC 2) | ⬜ | `fn.blockView.fields`, `ui.blockEditor` createEntity Runner |
| 6 | Docs, nonreg, PR | ⬜ | nonreg |

---

## Locked implementation defaults

| Decision | Choice | Serves |
|---|---|---|
| Assertion action | DomainEndpoint action `compositeRunTestAssertion`: `actionType`, `endpoint` (`1e2ef8e6`), optional `actionLabel`, `nameGivenToResult`, `payload` = a `testAssertion` reference, like `compositeRunBoxedQueryAction`. No `actionImplementation`: the sequence loops keep running it with `handleTestCompositeActionAssertion`, which needs the sequence's local context. The context entry `compositeRunTestAssertion` is derived from the Endpoint; the explicit `compositeAction` branch goes. `handleCompositeActionTemplate` keeps refusing it (analysis D10). | D10 |
| Migration | A Python script renames `testAssertion` to `payload` and adds `endpoint` after `actionType` in every asset instance (key order kept, files rewritten with `json.dumps(indent=2, ensure_ascii=False)`, which round-trips all 23); TS sites by hand; the generator `generate_externalServiceSync_suites.py` too. | D10 |
| Action registry | `endpointActionRegistry(modelEnvironment)` in `2_domain/EndpointActionRegistry.ts`: `actionType` → `{ endpointUuid, endpointName, action }` over `endpointsByUuid` merged with `currentModel.endpoints`; a Miroir Endpoint wins on a duplicate `actionType`. Kept per environment object (WeakMap). | D12 |
| Sequence nodes | `kind: "sequence"` (`actionType`, `actionLabel`, `templates` rows, `steps`) for `compositeActionSequence`; `kind: "action"` (`actionType`, `actionLabel`, `category` = Endpoint name, header parameters: primitive top-level attributes but `actionType`, `endpoint`, `actionLabel`; rows: the attributes of `payload` declared by the Endpoint action, then the undeclared ones) for every other step; a step whose `actionType` has no Endpoint action is a JSON block (`unknownActionType`). A payload attribute holding an action sequence is a nested sequence block. | G7, issue bullet 1 |
| Query step | The `payload` of `compositeRunBoxedQueryAction` and `compositeRunBoxedQueryTemplateAction` is one `kind: "query"` block (collapsed, its JSON in the node), read with the form or JSON views. | issue bullet 2 |
| Marks | A transformer block gets `evaluatedAt`: `runtime` when its `interpolation` is `runtime`, when an ancestor transformer is evaluated at runtime, or under `templates` of a sequence (resolved at step runtime); `build` otherwise. The view marks `evaluatedAt: build` (it marked the stored attribute before). | D1-b, issue bullet 3 |
| Entry point | `blockTree(value, options)`: a sequence value (`actionType: "compositeActionSequence"`) or a step value (an `actionType` known to the registry) maps with the sequence rules, any other value as a transformer. `BlockEditorView` calls it. Sequence trees are read-only in #504: no `onCommit`. | G7 |
| Field switch | `compositeActionSequence`, `compositeActionSequenceTemplate`, `compositeActionTemplate` become roots (and stay enclosing); a field whose value is a sequence and whose schema is `any` (Endpoint `actionImplementation.definition`) is a root too. The switch shows a sequence read-only. | D6, issue bullet 4 |
| Component test | The `TransformerBlocks` registry entry takes `runner` (a Miroir Runner name) instead of `transformerDefinition`: the block view of its `definition.compositeActionSequence`. | AC 2 |

---

## Slice 1 — `compositeRunTestAssertion` is a DomainEndpoint action

RED: core typecheck after the schema change (the TS sites and the generated types disagree), then the action and runner MiroirTests that assert.
GREEN: Endpoint action; schema derived; explicit branch removed; `devBuild`; migration script over the assets; TS sites read `payload`.

Validation: `npm run devBuild -w miroir-core`; `npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json` and the standalone-app; `npm run test -w miroir-core -- ''`; `npm run testMiroir -w miroir-standalone-app -- --suites action.domainController.dataCrud --mode integration` and one runner suite; report.queryDetails.

**Realization:** `scripts/migrate_504_test_assertion.py` migrated 191 assertions in 23 files (`--check` reports 0 left). The DomainController, `ReportTestTools`, `RunnerTestTools` and 5 TS builders read `payload`. `ActionImplementations.unit.test.ts` lists the action in the DomainEndpoint inventory and accepts it as the one action without implementation (it runs only inside a sequence). Full filesystem nonreg (shared runner): 102 passed, 5 failed: the 4 MiroirTestDisplay/ListDisplay steps of #510, and the tracked-assets guard, tripped by a commit made during the run.

## Slice 2 — Action registry

RED: `fn.blockModel` "action registry": `createEntity` comes from ModelEndpoint, `compositeRunTestAssertion` from DomainEndpoint, an application Endpoint action is found, an unknown type is absent.
GREEN: `EndpointActionRegistry.ts`, registered for fn cases.

**Realization:** `endpointActionRegistryOf(endpoints)`, `endpointActionRegistry(modelEnvironment)` (kept per `endpointsByUuid` and `currentModel`), `endpointOfActionType(modelEnvironment, actionType)`. Miroir's Endpoints are put first, so they win whatever the order of the environment. 5 `fn.blockModel` "action registry" cases.

## Slice 3 — Sequence block model

RED: `fn.blockModel` "action sequences" outlines: a sequence of two steps; payload slots with transformer blocks; a query step is one query block; an assertion step; templates are runtime (not marked); a build `getFromParameters` in a payload is build; a child of a runtime transformer is runtime; an unknown action type is a JSON block; a nested sequence.
GREEN: `blockTree`, sequence/action/query nodes in `TransformerBlockModelInterface.ts`, outline lines.

**Realization:** `blockTree`, `blockOutline`, `isBlockAction`; `evaluatedAt` on every transformer block, `@runtime` in the outline when the position, not the attribute, makes it runtime. 9 "action sequences" cases. Two #498 cases changed for the same reason (`case` and `aggregate` children of a runtime block now read `@runtime`). The view marks by `evaluatedAt` and shows the new kinds as JSON until slice 5.

## Slice 4 — Corpus sweep

RED: the sweep visits every sequence of the assets (67 in 26 files at the analysis; recounted) and expects no `unknownActionType` block.
GREEN: whatever slice 3 missed.

**Realization:** 66 sequences in 26 files, 384 actions (the analysis counted 67: one sits in a skipped `expected*` value). The sweep's environment adds the Endpoints of every package's assets, so the Library's `lendDocument` and `returnDocument` steps are found. Nothing was missed by slice 3.

## Slice 5 — Sequence fields and the view

RED: `fn.blockView.fields` sequence cases flip to roots (and their nested transformers stay non-roots); `ui.blockEditor` "createEntity Runner": the stacked command blocks with their action types, the query block, a payload transformer block, build marks.
GREEN: predicate, read-only sequence rendering in `BlockEditorView`, `TransformerBlocks` `runner` prop.

## Slice 6 — Docs, nonreg, PR

`docs/reference/transformers.md` (blocks section), `docs/reference/testing.md` and the action docs for the assertion shape; nonreg filesystem shared runner; PR into `_integration` with `Closes #504`.
