# 333 — Report MiroirTests: UI steps use values stored by earlier action steps

> Lets the UI steps of a `reportTest` leaf reference, with `getFromContext`, the values kept by its
> earlier `compositeAction` steps and the session's test parameters. Settles the two open points of
> the issue (which fields accept a reference, how an unresolved one fails).

- Issue: https://github.com/miroir-framework/miroir/issues/333
- Parent: #330, decision D17 ([analysis](../330-FEATURE-report-level-miroir-tests/analysis.md))
- Plan: [tdd-implementation-plan.md](tdd-implementation-plan.md)
- Key files: [`ReportTestTools.ts`](../../../packages/miroir-core/src/5_tests/ReportTestTools.ts),
  [`runComponentTestSteps.ts`](../../../packages/miroir-standalone-app/src/miroir-fwk/4-tests/componentTests/runComponentTestSteps.ts),
  [`runReportTest.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4-tests/componentTests/runReportTest.tsx),
  MiroirTest Entity `a311f363-e238-4203-bdfc-29e8c160c26b` (schema in `miroir_model/` and its `miroir_modelVersion/` copy `51c647fe-07ec-411c-89cc-02689dc66d6a`)

## Decision record

Taken as defaults by the agent (A asked for the issue to be solved; the issue left these points open). Each can be revisited on the PR.

| # | Question | Decision | Rejected / deferred |
|---|---|---|---|
| D1 | Which step fields accept a reference | **Values** a step enters or compares: `change.value`, `type.text`, `filterSelect.text`, `selectOption.option`, `renameRecordEntry.newName`, `uploadFile.content`, `waitForAttribute.value`, `expectElement.value` / `values`, anywhere in `expectRenderedValues.expectedValue` (already `any`). **Text locators** of a target: `reactComponentTestTextMatch` (`byText`, `byDisplayValue`, `byLabelText`, `name`) and `byTestId`. | Form field names (`field`, `fieldName`, `fieldNamePrefix`, `entry`, `attribute`, `action`), `ref` / `saveAs`, `keys`, `fileName`, `label`: structural names, not data. Values only (no locators): a Report showing a created row can only be located by its stored name / uuid. |
| D2 | Unresolved reference | The step fails with the T10 prefix, then the field and what is missing: `step 4 (type "…"): text: no stored value at "otherBook.book.nme": "otherBook.book" has no "nme" (has: author, …)`; for an unknown name, `no stored value "x" (stored: <names>)`. | Leaving the reference object in place (the UI would receive `[object Object]`). |
| D3 | What a reference reads | Test parameters, then the kept results (a kept result wins), read when the step starts: the same parameters as `compositeAction`. | Results only (would hide `testApplicationUuid`, …). |
| D4 | Type of a resolved value | Outside `expectedValue`, a string, a number or a boolean; otherwise the step fails (`the stored value "x" is an object, expected …`). A field that takes a string only (`text`, `option`, `newName`, `content`, `waitForAttribute.value`, `byTestId`) gets a number or a boolean as its text (review of #371). | Coercing objects to JSON text. |
| D5 | `getFromContext` attributes | `referenceName` or `referencePath`; `interpolation` ignored (resolved at step start); `safe`, `expectedType` not honoured. | Running the transformer engine: its failure messages do not name the missing key, and UI steps are not templates. |
| D6 | `reactComponentTest` leaves | Same step schema (shared `reactComponentTestStep`); they keep no values, so a reference fails as unresolved. | A separate Report-only step schema (duplicates 19 step kinds). |
| D6b | A literal `getFromContext` object in a UI step (e.g. the expected form value of a transformer editor) | Read as a reference: such a value cannot be entered or expected literally. No MiroirTest has one today (all `reactComponentTest` / `reportTest` JSON checked). | An escape syntax, until a test needs it. |
| D7 | Other transformers (`mustacheStringTemplate`, …) in UI steps | **Deferred**: only `getFromContext`, as the issue asks. | — |

## Goals

1. **Reuse a found value.** In order to check a Report on data an earlier step created or found, as a test author, I can enter in a UI step a value a `compositeAction` step kept (e.g. the uuid or name of a Book a query returned).
2. **Locate by a found value.** In order to check that a Report shows a row created by the test, as a test author, I can locate an element by a kept value.
3. **Readable failure.** In order to fix a broken test quickly, as a test author, I see which step, which field and which stored name or path is missing.

Non-goals: other transformers in UI steps (D7); references in structural names (D1).

## Current state (before #333)

- `runReportTestCompositeActionStep` keeps the returned value of an action under `nameGivenToResult` in `ReportTestActionContext.results`; `compositeAction` and `expectActionResult` resolve their templates with `{ ...testParams, ...results }`.
- UI steps are the `reactComponentTestStep` union (19 kinds) run by `runComponentTestSteps`, which passes their fields to the DOM as they are: a `getFromContext` object was not accepted by the schema, and would reach `userEvent.type` as an object.

## Target design

- Schema: `reactComponentTestStoredValue` (a `schemaReference` to `coreTransformerForBuildPlusRuntime_getFromContext`) added to the D1 fields' unions.
- Core: `resolveReportTestStepReferences(step, storedValues)` walks a UI step and replaces each reference (D2-D5); `WithoutStoredValueReferences<T>` types the resolved step (`ResolvedReactComponentTestStep`, `ResolvedReactComponentTestTarget`).
- App: `runComponentTestSteps` resolves each component test step before its handler, with `options.storedValues()`; `runReportTest` passes `{ ...testParams, ...results }`.

## Key reuse

| Piece | Location |
|---|---|
| Kept results, test parameters | `ReportTestActionContext` (`ReportTestTools.ts`) |
| T10 step error prefix | `runComponentTestSteps` (`ComponentTestStepError`) |
| `getFromContext` schema | `coreTransformerForBuildPlusRuntime_getFromContext` (`fe9b7d99-f216-44de-bb6e-60e1a1ebb739`) |
| Library testbed Books | `e20e276b` The Design of Everyday Things, `c97be567` Rear Window |
