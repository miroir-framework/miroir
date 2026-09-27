# 305 — Component tests: the value extractor misreads literals, empty containers and file `any` fields

> Why `extractValuesFromRenderedElements` rebuilds a wrong value for 4 kinds of branch of the #303 test pattern, and how the editors and the extractor are changed so that `expectRenderedValues` compares the whole value. The recursive `schemaReference` branch stays out until #304.

Related: issue https://github.com/miroir-framework/miroir/issues/305 · origin [#303 analysis §3.3](../303-FEATURE-test-pattern-and-render-performance/analysis.md) · blocker for `aReference`: #304 · code: [`componentTestTools.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4-tests/componentTests/componentTestTools.tsx) (`extractValuesFromRenderedElements`, `formValuesToJSON`), [`runComponentTestSteps.ts`](../../../packages/miroir-standalone-app/src/miroir-fwk/4-tests/componentTests/runComponentTestSteps.ts) (`checkRenderedValues`), editors under [`ValueObjectEditor/`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/ValueObjectEditor/).

## Decision record

Asked to the user in the project thread (2026-09-26) with a recommended default for each; the work proceeds on the defaults until they answer.

| # | Decision | Chosen (default) | Rejected |
|---|---|---|---|
| D1 | Where the fix goes | Read-only DOM hooks in the editors, read by the extractor | Extractor-only heuristics on the existing `id`s: the containers and the literal use the same unprefixed `id` scheme, so a heuristic cannot tell a literal input from a container, and the file field has no element carrying its value at all |
| D2 | Literal | The read-only literal input gets `name={formikRootLessListKey}`; its value is read as a string, like any text input | Typing number / boolean literals through a data attribute: no test needs it yet |
| D3 | Stray keys | The generic input pass keeps only names under the `label` prefix | Fixing only the literal: any other unprefixed input would still leak into the rebuilt value |
| D4 | Empty containers | The array / object / record editor root carries `data-ml-empty-container="array"\|"object"` and `data-ml-name={formikRootLessListKey}` only when its value is empty; the extractor seeds `[]` / `{}` from it | Marking every container and seeding when no child field was read: a folded non-empty container would then read `{}` |
| D5 | File `any` field | A hidden input `name={formikRootLessListKey}` carrying the value: a string as is, anything else as JSON with `data-ml-json="true"`, parsed back by the extractor | `data-ml-value` on the wrapper: the extractor would need one more pass; a named input goes through the existing ones |
| D6 | `aReference` | Stays in `ignorePaths` with its root-label `expectElement` until #304 | — |
| D7 | Test vehicle | The 4 leaves of `MlTestPattern_ComponentTestSuite` (MiroirTest): each slice removes its branch from `ignorePaths` (RED) and its `expectElement` stand-in | A vitest file on the extractor: the pattern leaves already exercise it through the public step |

## Goals

1. **Whole-value display check.** In order to catch a wrong display of any editor type in one step, as a test designer, I can compare the whole rendered value of the test pattern, literal, empty containers and file field included.
2. **No stray values.** In order to trust a failing comparison, as a test designer, I get only the values under the field I name, never an unrelated input.

Non-goals: the recursive `schemaReference` rendering (#304); typed literals (D2); stored measurements (#306); testByFile bail and `-t` quoting (#307).

## Current state

`checkRenderedValues` (`runComponentTestSteps.ts`) calls the extractor with `label = "TESTSECTION.testField"`, drops array-valued entries (option lists), rebuilds the value with `formValuesToJSON` from the flat `name → value` map, then strips `ignorePaths` from both sides.

The extractor keys every value by the element `name` (or `id`) with the `label.` prefix removed. The value is then a function of the named inputs only. Per branch:

| Branch | Rendered DOM | Extractor result | Cause |
|---|---|---|---|
| `aLiteral` | `MlLiteralEditor` (non-discriminator, not read-only): `<input type="text" id={rootLessListKey} readOnly disabled>`; no `name`, `id` = `testField.aLiteral` (no `TESTSECTION.` prefix) | key `testField.aLiteral` → rebuilt as `testField: {aLiteral: "fixed"}` | no prefixed name (D2); the generic `allInputs` pass does not check the prefix (D3) |
| `anEmptyArray`, `items[1].tags` | `MlArrayEditor` root `<div id={rootLessListKey}>` with buttons, no input | no key | nothing named under the path (D4) |
| `anEmptyRecord` | `MlObjectEditor` root `<div id={rootLessListKey}>` with the add-entry button | no key | same (D4) |
| `anAnyFile` | `MlAnyEditor`, `format === "file"`: label text + `FileSelector` (button "Select File"), no form field | no key | no element carries the value (D5) |
| `aReference` | only `aReference.label` renders; children hit an error boundary | `{label: "root"}` | #304 |

The 4 pattern leaves each hold `ignorePaths: [aLiteral, testField, aReference, anEmptyArray, anEmptyRecord, aNestedObject.level1.level2.items.1.tags, anAnyFile]` (enumerated from `26ef2886-….json`); leaf 1 also holds 6 `expectElement` stand-ins (literal display value, `aReference` root label, the 3 add buttons, "Select File"). The `expectedValue`s already hold the true values (`aLiteral: "fixed"`, `anEmptyArray: []`, `anEmptyRecord: {}`, `tags: []`, `anAnyFile: ""`).

`formValuesToJSON` keeps an existing array / object when a longer key passes through it, so a seeded `[]` / `{}` is only safe for a path with no child key: the extractor seeds only then (D4 marks only empty containers anyway).

## Key reuse

| Piece | Location |
|---|---|
| MiroirTest `MlTestPattern_ComponentTestSuite` | `miroir-test-app_deployment-miroir/assets/miroir_data/a311f363-…/26ef2886-2cd8-4f91-b846-1525b24d5f41.json` |
| `ignorePaths` / `withoutIgnoredPaths` | `runComponentTestSteps.ts` (#303 T1) |
| 68 per-editor cases (same extractor) | component entry `miroir-component-tests.unit.test.tsx` |

Implementation: [`tdd-implementation-plan.md`](./tdd-implementation-plan.md).
