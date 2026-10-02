# Issue #383 — TDD Implementation Plan

> Testing posture: integration-first, no mocks. The core behaviour (per-position input types,
> offered transformer types, recursive #249 marking) is exercised through a MiroirTest
> `functionCallTest` suite over the real stock TransformerDefinitions and real entity schemas.
> The UI behaviour is exercised by rendering the real `ListTransformerPanel` and `TransformerEditor`
> components (vitest + testing-library), with the real editor tree and the real definitions.

**Resume note:** read the progress table, then the first slice whose Status is not ✅ DONE.

## Scope

In (analysis goals):
- **G1 — Only sensible choices**: the `transformerType` select at any position lists only the types accepting that position's input.
- **G2 — Mismatches visible where they are**: nested transformers that do not accept their input are marked at their own nesting level.
- **G3 — Escape hatch**: a TransformerEditor toggle turns the restriction off.

Out (analysis non-goals): output-type filtering; full ML schemas for the restriction; Query / Report / Endpoint editors; any change to the #251 check (`TransformerMlSchemaCheck.ts`); tightening stock `inputOutput` declarations (#88 backlog).

## Related links

- Issue: https://github.com/miroir-framework/miroir/issues/383
- Analysis: [`analysis.md`](./analysis.md)
- Prerequisites: [#249 analysis](../249-FEATURE-typed-transformer-interface/analysis.md), [#88 plan](../88-FEATURE-typed-transformers/tdd-implementation-plan.md)
- Branch: `claude/383-transformer-choice-by-input-type`, PR against `_integration`

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Characterize the #249 check and the panels | ✅ DONE | baseline recorded (2 pre-existing failures) |
| 1 | Root restriction in ListTransformerPanel (tracer) | ✅ DONE | `fn.transformer.interfaceWalk` offered types; panel root select |
| 2 | Nested restriction by runtime slot rules | ✅ DONE | walk cases per slot; panel nested select |
| 3 | Recursive marking in ListTransformerPanel | ✅ DONE | walk failures; panel nested warning |
| 4 | TransformerEditor: root input, restriction, marking, toggle | ⬜ pending | `inputOutputTypeOfValue` cases; editor toggle test |
| 5 | Nonreg, docs, AC checklist | ⬜ pending | full `nonreg:filesystem` |

## Locked implementation defaults

Copied from the analysis decision record; deviations go in a slice's Realization.

| Decision | Default | Serves |
|---|---|---|
| D1 | A node with an `applyTo` transformer consumes that transformer's output; a literal `applyTo` consumes the kind of its value; otherwise the node consumes its slot's input | G1, G2 |
| D2 | Relation: #249 `inputOutputTypesCompatible(consumed, declared.input)`; declared input `undefined` always accepted; no `inputOutput` (or unknown type) = any/any | G1, G2 |
| D3 | Restriction in TransformerEditor and ListTransformerPanel only | G1 |
| D4 | Toggle "Restrict transformers to the input type" in the TransformerEditor only, default on, persisted in `ToolsPageState.transformerEditor.restrictTransformersToInputType` (session storage); ListTransformerPanel always restricts | G3 |
| D5 | Incompatible types hidden; one-line hint under the select: "N transformers hidden for input X" | G1 |
| D6 | TransformerEditor marking always on, from the same walk | G2 |
| D7 | TransformerEditor root input: one instance → entity uuid; all instances → `{ type: "array", payload: entityUuid }`; "here" value → `array` / `object` / primitive kind, `null` / `undefined` → `any` | G1 |
| D8 | Node output: `resolveTransformerResultSchema` (#88) converted by `inferTransformerOutputTypeFromSchema` (generalized to any known entity schema), else declared `inputOutput.output`. Root input lifted to an ML schema and bound as `defaultInput` (plus the caller's context, e.g. `row`) | G1, G2 |
| D9 | Slot rules follow the runtime (analysis §4.3): `applyTo` → parent's given input; `mapList.elementTransformer`, `filterList.predicate`, `find.predicate` → element of the consumed array, bound as `referenceToOuterObject` (then `defaultInput` unchanged) or `defaultInput`; `createObjectFromPairs.definition[i]` and `mergeIntoObject.definition` → consumed `applyTo` output (or `object`) bound the same way; `dataflowObject.definition.<step>` → parent's given input, earlier step outputs added to the context by key; any other slot → parent's given input | G1, G2 |

Additional defaults chosen while planning:
- The currently selected type is always offered (issue item 5).
- Candidate types are the select's own discriminator values; the core function only filters them.
- A select whose path has no walk entry (no known input) is not restricted.

## Allocated UUIDs / keys

| Element | Value |
|---|---|
| MiroirTest `fn.transformer.interfaceWalk` (issue 383, tags `unit`, `transformer`) | `0a6912c2-e061-476b-bd54-849e7366684b` in `miroir-app-miroir/assets/miroir_data/a311f363-e238-4203-bdfc-29e8c160c26b/` |
| Export in `miroir-app-miroir/index.ts` / `index.d.ts` | `miroirTest_fn_transformer_interfaceWalk` |
| Core functions (`TransformerInterfaceCheck.ts`, whitelisted in `FunctionCallTestRegistry`) | `checkTransformerInterfaceRecursively`, `transformerTypesAcceptingInput`, `inputOutputTypeOfValue` |
| Node report type (`TransformerInterfaceCheckInterface.ts`) | `TransformerInterfaceNodeReport { path, transformerType, givenInput, consumedInput, declared, output, failures }` |
| Editor prop (path-keyed, threaded like `environmentAnnotations`) | `transformerTypeRestrictions?: { path; input: InputOutputType; inputLabel: string }[]` |
| ToolsPageState field | `transformerEditor.restrictTransformersToInputType?: boolean` |

Entity uuids reused in cases: Book `e8ba151b-d68e-4cc3-9a83-3459d309ccf5` (Library), User `ca794e28-b2dc-45b3-8137-00151557eea8`, Menu `dde4c883-ae6d-47c3-b6df-26bc6e3c1842`.

## Test execution conventions

| Purpose | Command |
|---|---|
| Rebuild the deployment after MiroirTest JSON changes | `npm run build -w miroir-app-miroir` |
| Core suite | `npm run testMiroir -w miroir-core -- --suites fn.transformer.interfaceWalk --mode unit` |
| #249 suite (regression) | `npm run testMiroir -w miroir-core -- --suites fn.transformer.interfaceCheck --mode unit` |
| Panel UI tests | `npm run testByFile -w miroir-standalone-app -- transformerChoiceByInputType.integ` (and `ListTransformerPanel.unit` for regressions) |
| TransformerEditor UI tests | `npm run testByFile -w miroir-standalone-app -- TransformerEditor.test` |
| Build core for the app | `npm run build -w miroir-core` |
| Typecheck | `npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json` and `-p packages/miroir-standalone-app/tsconfig.json` |
| Model validation | `npm run miroir-env -- check --strict --tracked-clean` (after commit) |

## Slice 0 — Characterize

**Status:** ✅ DONE

Goal: a green baseline for the code the slices change.

- `fn.transformer.interfaceCheck` (28 cases), `ListTransformerPanel.unit` and `TransformerEditor.test` pass on the branch base; counts recorded in Realization.
- No new code.

### Validation

```bash
npm run testMiroir -w miroir-core -- --suites fn.transformer.interfaceCheck --mode unit
npm run testByFile -w miroir-standalone-app -- ListTransformerPanel.unit
npm run testByFile -w miroir-standalone-app -- TransformerEditor.test
```

### Realization

Baseline on the branch base (2026-10-02):
- `fn.transformer.interfaceCheck`: 61 tests pass (the 28 cases plus suite wrappers as counted by vitest).
- `ListTransformerPanel.unit`: 16 of 17 pass. "shows transformer toggle in the header; panel hidden by default" fails before any change (`entity-instance-grid-stub` not found). Not in nonreg; left as is.
- `TransformerEditor.test`: the file fails to load (`TypeError: Cannot read properties of undefined (reading 'uuid')`), no test runs. Not in nonreg. Slice 4 therefore uses a new, focused test file instead of extending it.

## Slice 1 — Root restriction in ListTransformerPanel (tracer)

**Status:** ✅ DONE

Goal: with Book rows, the root `transformerType` select of the list transformer panel no longer offers `array`-, `string`- and other-entity-input transformers, and shows the hint.

**RED**
- New MiroirTest asset `fn.transformer.interfaceWalk`, sub-suite `transformerTypesAcceptingInput`, over the real definitions:
  - entity input (Book): `aggregate`, `mapList`, `filterList`, `sortList`, `listLength` hidden; `getObjectValues`, `dataflowObject`, `getFromContext`, `ifThenElse` offered;
  - `string` and `number` input: `array`-input types hidden;
  - `array` input: `array`-input types offered, `object`-input types (`dataflowObject`, `getObjectValues`) hidden;
  - `any`/`undefined`-input and unknown types offered for every input;
  - current type kept when incompatible.
- Sub-suite `checkTransformerInterfaceRecursively`, root case: a root node report with `path: []`, `givenInput` = `consumedInput` = the root input.
- `ListTransformerPanel.unit`: with Book rows, the root select options exclude `aggregate`, include `getFromContext`, and the hint reads "19 transformers hidden for input Book" (count checked against analysis §4.2: 15 `array` + 2 `string` + 2 other-entity inputs).

**GREEN**
- `TransformerInterfaceCheckInterface.ts`: `TransformerInterfaceNodeReport`.
- `TransformerInterfaceCheck.ts`: `transformerTypesAcceptingInput(consumedInput, { transformerTypes, currentType, transformerDefinitions })` → `{ offered, hidden }`; `checkTransformerInterfaceRecursively(transformer, rootInput, options)` reporting the root node only.
- Whitelist both in `FunctionCallTestRegistry`; export from `index.ts`.
- `transformerTypeRestrictions` prop on `MlEditorPropsRoot`, threaded from `TypedValueObjectEditor` through `MlElementEditor`, `MlObjectEditor`, `MlArrayEditor`, `MlAnyEditor` to `MlLiteralEditor` (same places as `environmentAnnotations`).
- `MlLiteralEditor`: for a discriminator whose parent path has a restriction, filter `discriminatorSelectOptions` with `transformerTypesAcceptingInput` and render the hint.
- `ListTransformerPanel`: run the walk with `rowEntityUuid ?? "any"` and pass one restriction per node report.

**Refactor checkpoint:** `formatInputOutputTypeLabel` moves out of ListTransformerPanel if the TransformerEditor will need it (decide in slice 4); no duplicate path matching (reuse `findPathAnnotation`).

### Validation

```bash
npm run build -w miroir-app-miroir && npm run build -w miroir-core
npm run testMiroir -w miroir-core -- --suites fn.transformer.interfaceWalk --mode unit
npm run testMiroir -w miroir-core -- --suites fn.transformer.interfaceCheck --mode unit
npm run testByFile -w miroir-standalone-app -- ListTransformerPanel.unit
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
npm run nonreg:filesystem -- --runner shared --scope smoke,core,ui
```

### Realization

- Core: `transformerTypesAcceptingInput` and a root-only `checkTransformerInterfaceRecursively` in `TransformerInterfaceCheck.ts`, report types in `TransformerInterfaceCheckInterface.ts`, both whitelisted and exported. New MiroirTest `fn.transformer.interfaceWalk`: 11 offered-types cases and 1 root walk case, green.
- UI: `transformerTypeRestrictions` threaded next to `environmentAnnotations` (22 lines across `TypedValueObjectEditor`, `MlElementEditor`, `MlObjectEditor`, `MlArrayEditor`, `MlAnyEditor`); `MlLiteralEditor` filters a `transformerType` select whose parent path has a restriction, keeps the current type, and shows the hint next to the select. `ListTransformerPanel` passes one restriction per walk node.
- Deviation, UI test vehicle: `ListTransformerPanel.unit` replaces `TypedValueObjectEditor` with a `vi.mock` stub, so it cannot see the select. The UI proof is a new `tests/4_view/transformerChoiceByInputType.integ.test.tsx` on the existing no-mock app-stack rig (`helpers/listTransformerIntegRig.tsx`, which gained a `rowEntityUuid` option and `getPanelTransformerTypeOptions`). Feature-named from the start, so no issue directory to clean up.
- Deviation, hint count: the select's candidates are the 37 discriminator values of the transformer union, not the 48 definitions; with Book rows 15 are hidden (the plan's 19 counted definitions absent from the union).
- Scoped nonreg (`smoke,core,ui`): all pass except `integ-listDisplayByTransformer` and `unit-321-tracked-assets`. The first was a real regression: its test "borders the transformer editor orange when the transformer input does not accept rows" chose `mustacheStringTemplate` through the select, which now hides it. Rewritten as "does not offer a transformer whose input does not accept rows (#383)"; marking an already chosen incompatible transformer stays covered by `ListTransformerPanel.unit`. The suite then passes 13/13. The tracked-assets guard flagged the new MiroirTest file only because it was committed while the run was going.
- Typecheck: miroir-core clean; miroir-standalone-app has the same 32 pre-existing errors as the base, none in touched files.

## Slice 2 — Nested restriction by runtime slot rules

**Status:** ✅ DONE

Goal: nested selects are restricted by the input their position receives (D1, D8, D9), and re-derive when an outer transformer changes.

**RED** (`checkTransformerInterfaceRecursively` sub-suite, one case per rule, asserting the node report's `path`, `givenInput`, `consumedInput`)
- own `applyTo`: `{ aggregate, applyTo: getFromContext("rows") }` with `rows` an array of Book in the context consumes `array<Book>` (D1);
- `mapList` over `array<Book>`: `elementTransformer` given Book; with `referenceToOuterObject: "book"`, its given input stays the parent's `defaultInput` and `getFromContext("book")` outputs Book;
- `filterList.predicate`, `find.predicate`: element given input;
- `dataflowObject`: a step with `applyTo: getFromContext("<previous step>")` after a step that outputs an array consumes `array` (issue AC 3, runtime form); a step without `applyTo` receives the parent's input;
- `mergeIntoObject.definition`: `applyTo` output bound as `defaultInput`;
- `ifThenElse.then` / `else`: parent's given input;
- unresolvable output → `any` (no restriction);
- `inferTransformerOutputTypeFromSchema` recognizes any known entity schema (new `entityMlSchemas` option), not only the row schema.
- `transformerChoiceByInputType.integ`: root `mapList` with `applyTo: getFromContext("rows")`-like array context: `elementTransformer` select excludes `aggregate`; switching the outer `applyTo` updates it (issue AC 4).

**GREEN**
- Recursive `walkNode` / `walkChildren` in `TransformerInterfaceCheck.ts` on `InputOutputType`, with a parallel ML context for #88 inference (root lifted with `liftInputOutputTypeToMlSchema`, element and step bindings added per D9).
- `inferTransformerOutputTypeFromSchema(schema, { rowEntityUuid, rowMlSchema, entityMlSchemas })`.
- ListTransformerPanel passes `entityMlSchemas` and its `row` context.

**Refactor checkpoint:** the root-only `checkTransformerInterfaceCompatibilityWithInference` call in the panel stays for the root output check; check whether `inferElementTransformerOutputType` can delegate to the walk.

### Validation

Same commands as slice 1, plus a full `npm run nonreg:filesystem -- --runner shared` (every 2 or 3 slices).

### Realization

- Core: recursive `walkNode` / `walkChildren` / `walkNested` in `TransformerInterfaceCheck.ts`, carrying a coarse type and an ML schema per bound value (`liftInputOutputTypeToMlSchema` for lifts, `resolveTransformerResultSchema` for outputs). Options `entityMlSchemas` and `context`. `inferTransformerOutputTypeFromSchema` gained the `entityMlSchemas` option. `inputOutputTypeOfValue` moved forward from slice 4 because a literal `applyTo` (D1) needs it; its cases are in this slice.
- `fn.transformer.interfaceWalk`: 36 tests (offered types, root, own `applyTo`, list element slots, `dataflowObject` steps, outer-object bindings, other slots, value kinds, entity inference). A sabotaged expectation fails, so the assertions are live.
- UI: ListTransformerPanel passes `entityMlSchemas` and `{ row }`. New integ case: after choosing `ifThenElse` at the root, the `if` select hides `aggregate`. `then` / `else` are optional and not rendered by default, hence `if`. The root hint is found by its new `data-restriction-path` attribute, since the default identity transformer has nested nodes with their own hints.
- Deviation, panel root: the runtime binds each row as `row` and `defaultInput` stays the list (`buildRowMapListTransformer`). The walk keeps the #249 convention (root input = row entity, also bound as `defaultInput` for inference), as the issue states for ListTransformerPanel.
- AC 4 (re-derivation) rests on the walk being a pure function of the edited tree, recomputed on every change (`useMemo` on the Formik value); its core proof is the own-`applyTo` and list-element cases. Driving an `applyTo` change through the real editor was not practical with the rig.
- Regressions: `fn.transformer.interfaceCheck` + `fn.transformer.resultSchema` 100/100; `ListTransformerPanel.unit` + `listDisplayByTransformer.integ` 29/30 (the pre-existing failure only).

## Slice 3 — Recursive marking in ListTransformerPanel

**Status:** ✅ DONE

Goal: in #249 mode, a nested node whose transformer does not accept its consumed input is marked at its own level (G2); #251 mode unchanged.

**RED**
- Walk cases: an `aggregate` under `ifThenElse.then` with Book input has an `input` failure `{ given: Book, declared: "array" }`; a `getFromContext` node never fails on input; an incompatible current type stays offered.
- `ListTransformerPanel.unit`: nested `aggregate` under `ifThenElse.then` shows the warning marker with a title naming the path and both types; in #251 mode the existing warnings are unchanged.

**GREEN**
- Walk fills `failures` with `checkTransformerInterfaceCompatibility` input failures per node (output failures only at the root, from the existing expected-output check).
- ListTransformerPanel #249 mode: `compatibilityWarnings` from the walk's failing nodes.

**Refactor checkpoint:** one label formatter for #249 failures in the panel (title row and warnings).

### Validation

Same commands as slice 1.

### Realization

- Core: each node report gets an `input` failure when its declared input (other than `undefined`) does not accept its consumed input. 4 marking cases added to `fn.transformer.interfaceWalk` (40 tests).
- UI: in #249 mode ListTransformerPanel takes the walk's nested failures (the root's stay with the existing root check, which also checks the output) into `compatibilityWarnings`, `data-inadequate-paths`, the orange border and its title. #251 mode unchanged.
- Deviation, test vehicle: a selected incompatible nested transformer cannot be produced through the real select any more (the select hides it), so the marking test is in `ListTransformerPanel.unit`, whose stub editor sets the Formik value directly (existing `set-mapList-mustache-transformer` button): `mapList` over `array<Book>` with a `mustacheStringTemplate` element.
- Full nonreg after slice 2 (filesystem, shared): 86 pass, 1 fail, `unit-312-miroir-test-tags`: a MiroirTest description may not carry an issue number (`miroirTestNaming.unit`). The `fn.transformer.interfaceWalk` description no longer mentions #383 (the `issue` field still does).

## Slice 4 — TransformerEditor: root input, restriction, marking, toggle

**Status:** ⬜ pending

Goal: the TransformerEditor restricts and marks at every position from its input selector (D7, D6), with a toggle that brings the full list back and survives a reload (D4, G3).

**RED**
- Sub-suite `inputOutputTypeOfValue`: array → `array`, object → `object`, string / number / boolean / bigint → that kind, `null` / `undefined` → `any`.
- `TransformerEditor.test` (or a new `TransformerEditor.restriction.unit.test.tsx` if the existing file's set-up does not fit): with a Book instance as input, the root select excludes `aggregate`; turning the toggle off includes it; the toggle state is written to `toolsPageState.transformerEditor`.

**GREEN**
- `inputOutputTypeOfValue` in `TransformerInterfaceCheck.ts`, whitelisted.
- TransformerEditor: root input from the selector mode, walk over `transformer` (paths prefixed `["transformer"]`), `transformerTypeRestrictions` when the toggle is on, `compatibilityWarnings` always; toggle via `ThemedSwitch`, state in `ToolsPageState.transformerEditor.restrictTransformersToInputType` (default on).

**Refactor checkpoint:** share the walk-to-props mapping between the two editors (one hook in `Reports/` or `TransformerEditor/`).

### Validation

Same commands as slice 1, plus `npm run testByFile -w miroir-standalone-app -- TransformerEditor.test`.

### Realization

_(pending)_

## Slice 5 — Nonreg, docs, AC checklist

**Status:** ⬜ pending

- Nonreg: `fn.transformer.interfaceWalk` runs in `unit-miroir-core` (all unit MiroirTests); add a step for `transformerChoiceByInputType.integ` (scope `ui`, group `standalone-app-unit-files`), and for the TransformerEditor test file if new.
- Docs: `docs/reference/testing.md` entity uuids for `fn.transformer.interfaceWalk`; transformer editor user doc (restriction, hint, toggle).
- Cleanup: no `issues/383-*` directory is created; the MiroirTest `issue` field stays as metadata.
- Tracer narrative: open Tools → Transformer editor with a Book instance, root select lacks `aggregate`; pick `mapList` over a list, nested select lacks `object`-input types; toggle off, full list. Automated equivalent: slices 1, 2, 4 UI tests.

### AC checklist

| Issue AC | Proof |
|---|---|
| Object / entity / string / number input: `array`-input types not offered at the root | slice 1 `transformerTypesAcceptingInput` cases; panel root select test |
| Array input: offered, `object`-input types not | slice 1 cases |
| Nested `mapList` element and `dataflowObject` step | slice 2 walk cases; panel nested select test. The `dataflowObject` step form uses `applyTo: getFromContext("<previous step>")`, since the runtime does not pipe one step into the next (D9) |
| Changing the outer transformer updates nested choices and marking | slice 2 panel test (outer `applyTo` change) |
| `any` / `undefined` / undeclared offered everywhere | slice 1 cases |
| Selected incompatible transformer kept and marked at its level | slice 1 current-type case; slice 3 walk + panel tests |
| Toggle off shows the full list; survives reload | slice 4 editor test (session storage via `toolsPageState`) |
| Core unit tests for per-path derivation and filtering | `fn.transformer.interfaceWalk` |

### Validation

```bash
python scripts/sync_agent_skills.py --check && python -m pytest scripts/tests -q && python scripts/check_dependency_policy.py
npm run lint
npm run miroir-env -- check --strict --tracked-clean
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
npm run test -w miroir-core -- ''
npm run nonreg:filesystem -- --runner shared
```

### Realization

_(pending)_
