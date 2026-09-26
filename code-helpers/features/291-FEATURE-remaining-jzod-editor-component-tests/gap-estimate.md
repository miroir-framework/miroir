# 291 — Gap estimate: remaining JzodElementEditor cases as declarative MiroirTests

> Estimates what the React component test runner (#286, #292) still lacks before the 12 cases left by #286 can be written as JSON-only, self-reliant `reactComponentTest` leaves. Based on a throwaway port of the 12 cases, run under `miroir-component-tests` on `_integration` (256e625). Input to the grilling and to `analysis.md`; it is not the analysis.

Related issue: https://github.com/miroir-framework/miroir/issues/291
Prior work: [#286](../286-FEATURE-react-component-miroir-tests/analysis.md) ✅ · [#292](../292-REFACTOR-declarative-react-component-tests/analysis.md) ✅ · #294 ✅ · #296 ✅
Key sources: [`runReactComponentTest.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4-tests/componentTests/runReactComponentTest.tsx) · [`runComponentTestSteps.ts`](../../../packages/miroir-standalone-app/src/miroir-fwk/4-tests/componentTests/runComponentTestSteps.ts) · [`componentTestTools.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4-tests/componentTests/componentTestTools.tsx) (`buildComponentTestWrapper`, L465) · [`miroir-component-tests.unit.test.tsx`](../../../packages/miroir-standalone-app/tests/4_view/miroir-component-tests.unit.test.tsx) · old file [`JzodElementEditor.test.tsx` @ 5a6c380](https://github.com/miroir-framework/miroir/blob/5a6c380eab99b5ec1f527fc23fa043bc7d702303/packages/miroir-standalone-app/tests/4_view/JzodElementEditor.test.tsx)

## 1. Summary

- **The step vocabulary is sufficient.** All 12 cases are expressible with the #292 steps (`expectElement` with `byText`/`byLabelText`/`count`/`present`/`value`, `change`, `expectRenderedValues` with `field`, `$bigint` props). No new step kind is needed to express the cases.
- **What is missing is around the steps**, not in them:
  1. Whole-value assertions on large schema-typed values (Entity, Endpoint, Test) are lossy (G1).
  2. `performanceTests` is not reachable from JSON, and the largest case takes 25 s under happy-dom (G2).
  3. The cases' data (schemas, instances of 1.5–18 KB) has no JSON source other than an inline copy (G3).
  4. The render fixture (Miroir meta-model + Library model and data) is hard-coded in TypeScript (G4).
- Four cases are stale against the current model or were wrong in the old file (G5).
- Issue #291's recipe predates #292 M1 (manifest, registry, generator are gone) and needs rewriting (G7).

## 2. Probe

A generated instance `P291_Probe` (one `miroirTestSuite` root, 6 `reactComponentTestSuite` children, props inlined from the deployment packages) was dropped into `miroir_data/a311f363-…/` and run with `-t P291…`, then deleted. Nothing of it is committed.

| # | Old suite / case | Old state | Probe port | Result | Duration (happy-dom) |
|---|---|---|---|---|---|
| 1 | Enum: renders enum input with label | commented | leaf adds `label`; `expectElement {byText:/Test Label/, count:1}` | ✅ pass (the old "2 labels" TODO no longer holds) | 0.23 s |
| 2 | Enum: renders input without label | commented | suite without `label` (T14 layout); `expectElement {byLabelText:/Test Label/, present:false}` | ✅ pass | 0.07 s |
| 3 | SimpleType: bigint renders as number | commented | `initialFormState: {"$bigint":"1234"}`; `expectElement {byRole:textbox, fieldName:testField, value:"1234"}` | ✅ pass | 0.12 s |
| 4 | Book: displayed with proper value | active | `expectRenderedValues {field:"testField"}` | ✅ pass once expectation is the **rendered** value (see G1) | 0.21 s |
| 5 | Book: object can be updated | commented (a/b schema, unrelated to Book) | rewritten on the Book schema: `change` name and year, `expectRenderedValues` | ✅ pass (year is a `textbox`, not a `spinbutton`) | 0.83 s |
| 6 | EntityDefinition: Book displayed | active | EntityDefinition EntityVersion `mlSchema` + `entityBook` | ❌ nothing rendered: `jzodTypeCheck value attribute 'selfApplication' not found in schema definition`. Since #206 `entityBook` is an Entity, not an EntityDefinition | 0.3 s |
| 6' | same, retargeted | — | `entityEntity.mlSchema` + `entityBook` | renders; full-value `expectRenderedValues` fails on extractor artefacts (G1) | 1.7 s |
| 7 | EntityDefinition: object can be updated | commented (a/b schema) | not ported: duplicate of #5 in intent | — | — |
| 8 | Performance: string | active | `expectElement {byRole:textbox, fieldName:testField, value}` | ✅ pass (old filter `name === "testField"` never matched; `fieldName` maps to `TESTSECTION.testField`) | 0.23 s |
| 9 | Performance: entity definition for Book | commented | not ported: same as #6 under a Profiler | — | — |
| 10 | Endpoint: Application Endpoint | commented | `entityDefinitionEndpoint.mlSchema` + `applicationEndpointV1` | renders; full value fails (G1); `expectElement` on `testField.name` ✅ | 2.4 s |
| 11 | Endpoint: Query Endpoint | commented | same schema + `queryEndpointVersionV1` | renders; `expectElement` on name ✅ | 3.0 s |
| 12 | Endpoint: createEntityAndReportFromSpreadsheetAndUpdateMenu Test | active | `entityDefinitionTest.mlSchema` + the Test instance | renders; `expectElement` on name ✅. The old expectation compared it to `queryEndpointVersionV1` (copy-paste bug) | **25.4 s** |

Selecting a suite with `-t "<suite>"` works (acceptance criterion 2 needs nothing new).

## 3. Gaps

### G1 — Whole-value assertions on large schema-typed values are lossy

`expectRenderedValues` rebuilds the value from the DOM (`extractValuesFromRenderedElements` + `formValuesToJSON`). On the Entity and Endpoint values the rebuilt value differs from the instance in three ways:

| Difference | Example (probe output) | Nature |
|---|---|---|
| Technical / non-editable attributes are not rendered | `uuid`, `parentName`, `parentUuid`, `selfApplication`, `parentDefinitionVersionUuid` absent | product behaviour, expected |
| Foreign keys render as the target's display name | Book `author: "Paul Veyne"`, `publisher: "Folio"`; `mlSchema…foreignKeyParams.targetEntity: "Author"` | product behaviour, expected |
| Literal / discriminator values land in a stray `testField` subtree instead of their path | Entity: `"testField":{"mlSchema":{"type":"object"}}`; Endpoint: `actionType: {definition:"createApplication"}` without `type`, and `"testField":{"definition":{"actions":[{"actionParameters":{"actionType":{"type":"literal"}…` | **extractor defect** (key naming of the literal / union-type inputs) |

Consequence: a case asserting "the whole Entity / Endpoint / Test is displayed" cannot be written as one `toEqual` today, except by pasting the defective output as the expectation.

| Option | Effect | Size |
|---|---|---|
| A. Partial matching in `expectRenderedValues` (`match: "subset"`, or several `path`s) | Cases assert the fields they care about; tolerant of hidden attributes and of the defect outside those paths | S (schema field + comparison) |
| B. Fix the extractor key mapping for literal and union-type inputs | Rebuilt value is faithful; full `toEqual` becomes possible modulo hidden attributes and FK labels | M–L (touches the helper used by the 68 migrated cases and 14 importers) |
| C. New step `expectFormValues` reading the component's Formik state, not the DOM | Exact round-trip of the value; does not test what is displayed | M (the test component must expose its form state) |

Recommendation: A for #291, B as a follow-up issue.

### G2 — Performance suites and slow cases

- `buildComponentTestWrapper` has `isPerformanceTest` (wraps in a `Profiler` that only **logs** render counts and durations, `componentTestTools.tsx` L740-788), but `runReactComponentTest.tsx` never passes it and `reactComponentTestSuite` has no field for it. Unreachable from JSON.
- No case of the old file asserted a duration; the Profiler output is informative only.
- Case 12 takes 25 s under happy-dom (`asyncUtilTimeout` is 5 s, but a single mount is not bounded by it). The default nonreg tier would pay it on every run.

Needed: a suite-level field (e.g. `performanceTests: boolean`) passed to the wrapper, and a gating rule for slow suites in the default vitest entry (the app sandbox can run them on demand). Size S, one schema rebuild.

### G3 — Case data has no JSON source other than an inline copy

The old cases imported `entityBook`, `book1`, `entityDefinitionEndpoint`, `applicationEndpointV1`, `queryEndpointVersionV1`, `entityDefinitionTest`, `test_createEntityAndReportFromSpreadsheetAndUpdateMenu` from the deployment packages. `componentProps` accepts only literal JSON (plus `$bigint`).

| Asset | Size (JSON chars) |
|---|---|
| `book1` | 302 |
| `entityBook` (incl. `mlSchema`) | 1 556 |
| `applicationEndpointV1` | 1 981 |
| `queryEndpointVersionV1` | 2 603 |
| `entityDefinitionEndpoint` | 9 731 |
| `entityDefinitionTest` | 9 910 |
| Test instance | 18 188 |

| Option | Effect | Size |
|---|---|---|
| A. Inline copies | Self-contained JSON; copies drift from the model (case 6 already drifted with #206) | none |
| B. Tagged reference revived by the runner, like `$bigint`: `{"$instance": {application, entity, uuid, path?}}` | Always the current asset. Endpoints and Tests are **not** in the wrapper's `LocalCache` (it loads meta-model entities, entityVersions, jzodSchemas, menus, applicationVersions, reports, and Library model/data only), so resolution must read deployment assets: `fs` under vitest, a domain fetch in the app sandbox | M–L |

Recommendation: A, since a component case pins what the editor displays for a given value anyway; B only if A's drift proves costly.

### G4 — The render fixture is TypeScript, not JSON

Each suite wrapper loads the Miroir meta-model (`defaultMiroirMetaModel`) and the Library model and data from TypeScript imports (`buildComponentTestWrapper`, L505-651). Case 4 depends on it: the FK labels `Paul Veyne` / `Folio` come from that Library data, which the JSON does not declare. The 12 cases need nothing beyond the current fixture, so #291 can live with it; a JSON-declared fixture (reusing the `testbedModel` / `testbedEntitiesAndInstances` fields of `miroirTestSuite` from #252 on `reactComponentTestSuite`) is a separate issue. Size M–L if taken.

### G5 — Stale or wrong cases

| Case | Problem | Proposed handling |
|---|---|---|
| 6 EntityDefinition: Book displayed | EntityDefinition EntityVersion schema no longer types an Entity (#206) | retarget to `entityEntity.mlSchema` (rename the suite `JzodEntityEditor`?) |
| 7 EntityDefinition: object can be updated | body is the generic a/b object test, unrelated to its suite | drop (covered by #5 and by the Object suite) |
| 9 Performance: entity definition | same body as 6 | keep only if G2 keeps a performance suite; otherwise drop as duplicate |
| 12 createEntity… Test | expected `queryEndpointVersionV1` | assert on the Test instance |
| 3, 8 | old filter `name === "testField"` could not match | fixed by the port (`fieldName`) |

### G6 — A failing case hides the later suites of the vitest entry

In the probe, after the first failing case, the remaining `P291*` suites were neither run nor reported (81 tests collected, 74 reported). The entry runs the walk inside `describe(async …)` with `rethrowComponentTestFailures: true`, so the rethrow seems to abort the collection of the later `describe`s. Observed with a `-t` filter only; to be confirmed without one. Size S if confirmed.

### G7 — Issue text predates #292 M1

Issue #291's recipe names `componentTestManifest.ts`, `componentTestRegistry.ts` and `generate-component-miroir-tests.ts`, all removed by #292. The current recipe is `docs/reference/testing.md` L954-969: hand-edit the instance JSON; a new instance also needs its exports, its entry in `defaultMiroirMetaModel.tests`, and the instance / leaf counts of the vitest entry, `componentTestInstances.292.phase1` and `componentMiroirTests.consistency`.

## 4. Estimate

| Work item | Gap | Size | Schema rebuild |
|---|---|---|---|
| Partial matching in `expectRenderedValues` | G1-A | S | yes |
| `performanceTests` field + gating of slow suites + doc | G2 | S | yes (same rebuild) |
| 4 new instances (Book, Entity, Performance, Endpoint), 2 cases added to Enum and SimpleType, counts | — | S–M | no |
| Stale cases fixed or dropped, reasons recorded on #291 | G5 | S | no |
| Collection abort after a failure | G6 | S (if confirmed) | no |
| Issue / doc recipe update | G7 | XS | no |
| *Follow-ups, outside #291:* extractor literal / union-type keys | G1-B | M–L | no |
| *Follow-up:* `$instance` references | G3-B | M–L | yes |
| *Follow-up:* JSON-declared render fixture | G4 | M–L | yes |

With the recommended options, #291 is one schema rebuild and roughly a #292-slice worth of work (2–3 green slices). The three follow-ups are what "fully self-reliant" would additionally cost.

## 5. Open questions (for the grilling)

1. Case data: inline copies (recommended) or `$instance` references?
2. Whole-value cases: partial matching now and the extractor fix as a follow-up (recommended), or fix the extractor inside #291?
3. Slow / performance suites: run in the default vitest entry, or gated behind an opt-in and run on demand in the app (recommended: gated)?
4. Case 6: retarget to the Entity schema (recommended) or drop?
5. JSON-declared render fixture: out of #291 (recommended) or in?
