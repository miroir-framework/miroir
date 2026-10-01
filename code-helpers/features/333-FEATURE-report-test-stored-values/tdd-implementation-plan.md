# 333 — TDD implementation plan: UI steps use stored values

> Two vertical slices for [analysis.md](analysis.md). Each slice ends green (core unit tests, tsc of
> touched packages, the slice's suites).

## Acceptance criteria

| AC | Criterion | Proof |
|---|---|---|
| AC1 | A UI step of a `reportTest` enters a value kept by an earlier `compositeAction` step | `report.bookDetails` leaf "types a name read from the store" |
| AC2 | A target locates an element by a kept value | same leaf, `expectElement` `byDisplayValue` reference |
| AC3 | An unresolved reference fails the step, naming the field and the missing key | `storedValueReferences.333.slice1` (6 failure cases); leaf with a broken path fails at `step 4 (type …): text: no stored value at …` (checked manually) |
| AC4 | Existing component and Report tests unchanged | `unit-292-*`, `appstack-miroir-component-tests`, `report.*` suites |

## Slice 1 — resolve references in component test steps

- Red: `packages/miroir-core/tests/1_core/issues/333-report-test-stored-values/storedValueReferences.333.slice1.unit.test.ts` (10 cases: no reference, `referenceName`, `referencePath`, target locators and `values`, object in `expectedValue`, unknown name, missing segment, object in a scalar field, no name nor path, field path of a target).
- Green: schema D1 (`miroir_model` and `miroir_modelVersion` copies), `npm run devBuild -w miroir-core`; `resolveReportTestStepReferences` and the resolved types in `ReportTestTools.ts`; `runComponentTestSteps` resolves each component test step (`options.storedValues`), its handlers and `componentTestTargets.ts` / `measureRendering.ts` typed on resolved steps.
- Run: `npm run testByFile -w miroir-core -- storedValueReferences.333.slice1`, tsc core and app, `npm run nonreg -- --runner shared --scope smoke,ui`.

## Slice 2 — Report runner passes its stored values; Library leaf; docs

- Red: leaf "types a name read from the store" in `report.bookDetails` (Library `4edb680b-4686-4d9a-bb96-40fa9f945b24`): reads Book `c97be567` into `otherBook`, types `otherBook.book.name` in the name field, locates the field by that value, submits, asserts the store holds "Rear Window".
- Green: `runReportTest` passes `storedValues: () => ({ ...testParams, ...results })`.
- Docs: `docs/reference/testing.md` § Report tests (stored values), suite table.
- Run: `npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-filesystem --suites report.bookDetails --mode integ`, nonreg `smoke,ui`.

## Realization

- Both slices done 2026-10-01. The leaf first used Book `03ffcae1` (Ubik), absent from the testbed (6 Library Books there): switched to `c97be567` Rear Window.
