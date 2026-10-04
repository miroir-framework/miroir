# Issue #449 — TDD Implementation Plan

> Vertical TDD slices (RED → GREEN each). Core behavior is tested through MiroirTest
> `functionCallTest` cases on the public functions of the transformer interface check
> (`inputOutputTypesCompatible`, `inferTransformerOutputTypeFromSchema`,
> `liftInputOutputTypeToMlSchema`, `inputOutputTypeOfValue`, `checkTransformerInterfaceRecursively`),
> against the real stock TransformerDefinitions. The chooser is tested by rendering the real
> list section with Book rows (`ListTransformerPanel.unit.test.tsx`). No mocks. The tracer bullet
> proves that a definition can declare `record<P>` and `tuple<...>` and that the check judges them.
>
> **Execution model:** one green commit per slice (A's flow for sizeable work). Each slice ends
> with its Validation commands; on success its Realization summary is appended and its Status
> flips to ✅ DONE.

Analysis: [`./analysis.md`](./analysis.md) · Issue: https://github.com/miroir-framework/miroir/issues/449
Prerequisites: [#383](../383-FEATURE-transformer-choice-by-input-type/) ✅, [#453](../453-FEATURE-transformer-type-display/) ✅
Working branch: `claude/449-payload-sub-choice` (from `_integration` 04ae35bb)

**Resume note:** Slices 0-4 DONE.

---

## Scope

- G1: the expected-output chooser expresses `array<P>`, `record<P>`, `tuple<P1..Pn>`.
- G2: `inputOutput` declares them.
- G3: inference, lift and walk stay coarse and sound with the new types.
- G4: one type formatter for the list panel, the editor badges and the mismatch titles.

Out: full ML schema types, nested type parameters, `object<P>`, saving the chosen type, the EntityVersion snapshot, slot expectations (#454). See analysis §2.

---

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Characterize the interface check suites | ✅ | baseline runs of `fn.transformer.interfaceCheck`, `fn.transformer.interfaceWalk`, `ListTransformerPanel.unit` |
| 1 | Declare and match `record` and `tuple` (tracer) | ✅ | `fn.transformer.interfaceCheck` new suites "record forms", "tuple forms", "payload values" |
| 2 | Coarse inference, lift and walk for the new types | ✅ | `fn.transformer.interfaceCheck` "inference" / "lift" suites, `fn.transformer.interfaceWalk` cases |
| 3 | Chooser: type parameter for `array` and `record` | ✅ | `ListTransformerPanel.unit` cases |
| 4 | Chooser: tuple elements | ✅ | `ListTransformerPanel.unit` cases |
| 5 | One type formatter (G4) | ⬜ | `fn.transformer.interfaceCheck` "format" suite, `unit-453-transformer-types-display` |
| 6 | Stock definition sweep (D11, after A's approval) | ⬜ | `stockTransformerDefinitions` suite, `fn.transformer.resultSchema` case |
| 7 | Nonreg, docs, AC | ⬜ | `unit-449-parameterized-interface-types` step, full nonreg |

---

## Locked implementation defaults

Analysis decision record, binding for this plan.

| # | Choice | Serves |
|---|---|---|
| D1 | `array<P>`, `record<P>`, `tuple<P1..Pn>`; no `object<P>` | G1, G2 |
| D2 | P ∈ `any, undefined, bigint, number, string, boolean, object` or an entity uuid | G1, G2 |
| D3 | A nested position is `any` | G3 |
| D4 | Bare literals `object`, `array`, `record` (new); no bare `tuple` | G1, G2 |
| D5 | `{ type: "array" \| "record", payload?: P }`, `{ type: "tuple", payload: P[] }` | G2 |
| D6 | Compatibility per analysis §3.1, payloads by the same relation | G1, G3 |
| D7 | Object form removed; its 4 MiroirTests move to `record` | G2 |
| D8 | Coarse inference, lift and walk per analysis §3.2 | G3 |
| D9 | Chooser: main select + parameter select (`array`, `record`), element selects with + and − (`tuple`, start `<any, any>`, min 1); P `any` stored as the bare literal | G1 |
| D10 | `formatInputOutputTypeLabel` in miroir-core, used by the panel and the editor | G4 |
| D11 | Sweep per analysis §3.3, rows approved by A | G2, G3 |
| D12 | Types generated from the Entity; snapshot untouched | G2 |
| D13 | MiroirTest `functionCallTest` for core, `ListTransformerPanel.unit` for the chooser | all |
| D14 | `discriminator: "type"` on the union | G2 |

---

## Allocated UUIDs / keys

No new model element. Tests go into existing suites:

| Artefact | Value |
|---|---|
| MiroirTest `fn.transformer.interfaceCheck` | `c9f0a3e1-7b2d-4e6a-8f1c-5d3b9a7e2c84` (miroir-app-miroir) |
| MiroirTest `fn.transformer.interfaceWalk` | `0a6912c2-e061-476b-bd54-849e7366684b` (miroir-app-miroir) |
| Vitest | `packages/miroir-standalone-app/tests/4_view/ListTransformerPanel.unit.test.tsx` (React rendering of the chooser, not reachable through `functionCallTest`; a `ui.*` component case would need a deployment-backed list report for one select) |
| Nonreg step | `unit-449-parameterized-interface-types`, scopes `["ui"]` |

---

## Test execution conventions

| Purpose | Command |
|---|---|
| Interface check suites | `npm run testMiroir -w miroir-core -- --suites fn.transformer.interfaceCheck,fn.transformer.interfaceWalk --mode unit` |
| Result schema suite (#88) | `npm run testMiroir -w miroir-core -- --suites fn.transformer.resultSchema --mode unit` |
| Panel | `npm run testByFile -w miroir-standalone-app -- --no-bail ListTransformerPanel.unit` |
| Schema rebuild | `npm run build -w miroir-app-miroir && npm run devBuild -w miroir-core` |
| Type check | `npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json`, same for `miroir-standalone-app` |
| Gate | `npm run lint`, `npm run test -w miroir-core -- ''` |
| Scoped nonreg | `npm run nonreg:filesystem -- --runner shared --scope smoke,<scopes>` |
| Full nonreg | `npm run nonreg:filesystem -- --runner shared` |

---

## Slice 0 — Characterize the interface check suites

**Status:** ✅ DONE

### Goal

Record which tests pass on `_integration` before any change, so later failures are attributable.

### 0.1 Baseline

Run the three suites and `fn.transformer.resultSchema`; record pass counts here. Pre-existing failures are noted, not fixed.

### Validation

```bash
npm run build -w miroir-app-miroir && npm run build -w miroir-core
npm run testMiroir -w miroir-core -- --suites fn.transformer.interfaceCheck,fn.transformer.interfaceWalk,fn.transformer.resultSchema --mode unit
npm run testByFile -w miroir-standalone-app -- --no-bail ListTransformerPanel.unit
```

### Realization

On `_integration` 04ae35bb, after `npm install` (node_modules predated the #344 rename) and `./build-all.sh`:
- `fn.transformer.interfaceCheck`, `fn.transformer.interfaceWalk`, `fn.transformer.resultSchema`: 182/182.
- `ListTransformerPanel.unit`: 17/18. "shows transformer toggle in the header; panel hidden by default" fails before any change (`entity-instance-grid-stub` not found on first render). Pre-existing, left alone.
- `tsc` on miroir-standalone-app reports 32 errors in MUI-related files unrelated to this issue (`ErrorLogsPageDEFUNCT.tsx`, `MiroirEventsPage.tsx`, `MiroirEventTimeline.tsx`, `AiLendProposalForm.tsx`, `AiEntityProposalForm.tsx`, `SettingsPage.tsx`, `MiroirThemeSelector.tsx`, `EventLogComponent.tsx`). Later slices check that no error appears in the files they touch.

---

## Slice 1 — Declare and match `record` and `tuple` (tracer)

**Status:** ✅ DONE

### Goal

A transformer definition author can declare `record`, `record<P>`, `tuple<P1..Pn>`, `array<object>`, `array<undefined>` in `inputOutput`, and the adequacy check judges them by analysis §3.1.

**Layers cut:** TransformerDefinition Entity schema → generated types → `TransformerInterfaceCheck.ts`.

### 1.1 RED

`fn.transformer.interfaceCheck`:
- Suite "object and array payload forms" renamed "array and record payload forms"; its 4 object-form cases rewritten with `record` (D7).
- New suite "record forms": every `record` row of §3.1 (entity ⇒ `record<any>` yes, entity ⇒ `record<string>` no, `record<string>` ⇒ `object` yes, `object` ⇒ `record` yes, `object` ⇒ `record<string>` no, `record<string>` ⇒ `record<number>` no, bare `record` ⇒ `record<Book>` yes by `any`).
- New suite "tuple forms": `tuple<string, number>` ⇒ `array<any>` yes, ⇒ `array<string>` no, `tuple<string, string>` ⇒ `array<string>` yes, `array<string>` ⇒ `tuple<string>` no, arity mismatch no, element-wise match yes, `tuple<...>` ⇒ `object` no.
- New suite "payload values": `array<Book>` ⇒ `array<object>` yes, `array<object>` ⇒ `array<Book>` no, `array<undefined>` ⇒ `array<undefined>` yes, `array<undefined>` ⇒ `array<string>` no.
- `stockTransformerDefinitions`: `findInvalidStockTransformerInputOutputs` on a definitions map holding `record<string>`, `tuple<string, Book>` and `array<object>` declarations returns `[]`; on one holding `{ type: "object", payload: "string" }` returns its name.

### 1.2 GREEN

- Entity `a557419d-...` `inputOutput.context`: payload enum gains `undefined`, `object`; type enum gains `record`; object arm `type` enum becomes `["array", "record"]`; new arm `{ type: literal "tuple", payload: array of inputOutputPayloadType }`; `discriminator: "type"` (D14). Rebuild.
- `TransformerInterfaceCheck.ts`: one normalized form `any | primitive | object | entity | array<P> | record<P> | tuple<P[]>`; payloads normalized into the same form; one recursive `compatible(a, e)` replaces `inputOutputPayloadsCompatible`. Header comment rewritten for §3.1.

### 1.3 Refactor checkpoint

- The two normalizers and two relations of §4.4 become one.
- Check every other `InputOutputType` consumer still typechecks against the new union (`TransformerInterfaceInference.ts`, `TransformerMlSchemaCheck.ts`, `TransformerEditor.tsx`, `ListTransformerPanel.tsx`, `TransformerTypeAnnotation.tsx`).

### Validation

**Nonreg scopes:** `smoke,core`, because the slice changes a core schema and `2_domain`.

```bash
npm run build -w miroir-app-miroir && npm run devBuild -w miroir-core
npm run testMiroir -w miroir-core -- --suites fn.transformer.interfaceCheck,fn.transformer.interfaceWalk --mode unit
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
npm run test -w miroir-core -- ''
npm run nonreg:filesystem -- --runner shared --scope smoke,core
```

### Realization

- Schema: payload enum + `undefined`, `object`; type enum + `record`; object arm `type` enum `["array", "record"]`; new tuple arm (`type` literal `tuple`, `payload` array of payload types); `discriminator: "type"` on the union. Generated types: `InputOutputType` gains `{ type: "tuple"; payload: InputOutputPayloadType[] }`.
- `TransformerInterfaceCheck.ts`: `CoarseType` + `normalizeInputOutputType(type, isParameter)` + `coarseTypesCompatible` replace the two normalizers and `inputOutputPayloadsCompatible`.
- Deviation: `liftInputOutputTypeToMlSchema` got its tuple branch here, because the new union arm does not typecheck without it. Its tests are in slice 2.
- RED: 20 failing cases (record, tuple, type parameter values, stock schema check). GREEN: the three suites 206/206; miroir-core unit 2397 passed; lint clean; no new `tsc` error; scoped nonreg `smoke,core` 18/18.
- R1 checked with a throwaway vitest probe: `mlsTypeCheck` on the Entity's `inputOutput` schema resolves bare literals, an entity uuid, `record<string>` / `array<object>` and `tuple<string, uuid>` to the right union arm (the discriminator separates the two object arms, which have the same keys).
- The analysis and the grilling said 3 MiroirTests used the object form; there were 4 (both entity cases included). Docs corrected.

---

## Slice 2 — Coarse inference, lift and walk

**Status:** ✅ DONE

### Goal

The list panel's inferred output and the #383/#453 walk give `record<P>` and `tuple<...>` where #88 knows them, and never a type more precise than the truth (analysis §3.2).

**Layers cut:** `TransformerInterfaceInference.ts`, `TransformerMlSchemaCheck.ts` (lift), `TransformerInterfaceCheck.ts` (walk, value typing).

### 2.1 RED

`fn.transformer.interfaceCheck`, new suite "inference" (`inferTransformerOutputTypeFromSchema`):
- `record` of string → `record<string>`; `record` of a Book schema with Book known → `record<Book>`; `record` of an array → `record<any>`.
- `tuple` [string, number] → `tuple<string, number>`; `tuple` [string, array] → `tuple<string, any>`.
- `array` of plain object → `array<object>`; `array` of `undefined` → `array<undefined>`; `array` with a list `definition` → `array<any>`.

New suite "lift" (`liftInputOutputTypeToMlSchema`): `record<string>`, `tuple<string, number>`, `array<object>`, `array<undefined>` lift to the ML schemas of §3.2; each lifted schema passes `mlElement` validation (assert through `isMlSchemaSubtype` of itself, or the existing validation function the suite already uses).

`fn.transformer.interfaceWalk`:
- `inputOutputTypeOfValue([{a: 1}, {b: 2}])` → `array<object>` (was `array<any>`; R3).
- `mapList` whose `applyTo` is a `returnValue` with `mlSchema` `tuple<string, string>`: the element bound is `string`.
- `filterList` over the same tuple outputs `array<string>`, not the tuple.

### 2.2 GREEN

`payloadOf` per §3.2; `inferTransformerOutputTypeFromSchema` record/tuple/list-form branches; `liftInputOutputTypeToMlSchema` record/tuple/object/undefined payloads; `arrayElementInputOutputType` reads tuples; `listCombinatorOutput` `filterList` case.

### 2.3 Refactor checkpoint

- `liftPayloadToMlSchema` folds into `liftInputOutputTypeToMlSchema` if payloads are now a subset of types.
- Update #453 walk expectations that asserted `array<any>` for arrays of plain objects (R3), with a note in the test label.

### Validation

**Nonreg scopes:** `smoke,core,ui` (core functions; the walk feeds the editor badges and the list panel).

```bash
npm run build -w miroir-app-miroir && npm run build -w miroir-core
npm run testMiroir -w miroir-core -- --suites fn.transformer.interfaceCheck,fn.transformer.interfaceWalk,fn.transformer.resultSchema --mode unit
npm run testByFile -w miroir-standalone-app -- --no-bail ListTransformerPanel.unit transformerTypesDisplay
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npm run nonreg:filesystem -- --runner shared --scope smoke,core,ui
```

### Realization

- Tests went to `fn.transformer.interfaceWalk`, which already holds the `inferTransformerOutputTypeFromSchema` and `inputOutputTypeOfValue` suites: 9 inference cases, a new "liftInputOutputTypeToMlSchema" suite (6 cases, exact ML schemas instead of a validation call), 2 tuple cases in "list element slots", 3 record/tuple cases in "returnValue"; "array of objects" now expects `array<object>` (R3).
- `TransformerInterfaceInference.ts`: `inputOutputTypeParameter` (exported; replaces the walk's `payloadOf`, which turned `object` and `undefined` into `any` and let a bare `record` through as a parameter); record, tuple and list-form array branches.
- `TransformerMlSchemaCheck.ts`: bare `record` lifts to a record of `any`; `liftPayloadToMlSchema` folded into `liftInputOutputTypeToMlSchema` (2.3).
- `TransformerInterfaceCheck.ts`: `commonTypeParameter` for array values and tuple elements; `filterList` over a tuple outputs an array of the element type; a `returnValue` value is typed in the shape of its declared `mlSchema` (`inputOutputTypeOfValueAs`): an array declared as a tuple types element-wise, a plain object declared as a record types as the record of its values. Without it, `["a", 1]` with a `tuple<string, number>` schema typed as `array<any>` and failed, and `{a: 1}` against `record<string>` typed as `object` and passed.
- RED: 11 failing cases (3 already passed: lifts that reuse the type's own branch, and array of plain objects / of `undefined` inference). GREEN: the three suites 226/226; miroir-core unit 2417 passed; lint clean; `ListTransformerPanel.unit` + `transformerTypesDisplay` 17/18 (the pre-existing failure only); `transformerChoiceByInputType.integ`, `transformerEditorChoiceByInputType.integ`, `listDisplayByTransformer.unit`, `typedValueObjectEditorSchema.unit` 21/21.
- Scoped nonreg `smoke,core,ui`: 41/42. The one failure, `unit-321-tracked-assets`, came from committing the slice while the run was going: the guard's before-snapshot lists the asset files that differ from HEAD, and the commit made the edited MiroirTest file match HEAD. Same content hash before and after; commit after the run, not during it.

---

## Slice 3 — Chooser: type parameter for `array` and `record`

**Status:** ✅ DONE

### Goal

A report designer on a Book list picks `array` or `record` and its type parameter, and the orange border follows (G1).

**Layers cut:** `ListTransformerPanel.tsx`.

### 3.1 RED

`ListTransformerPanel.unit.test.tsx` (Book rows):
- The main select offers `record` and `tuple`; no parameter select while the type is `Book` or `string` (`list-transformer-expected-output-payload` absent).
- Choosing `array` shows the parameter select at `any`; the main select shows `array` (not `any`).
- Expected `array<string>`: a row transformer returning `array<string>` (a `returnValue` with that `mlSchema`) has no border; one returning `array<number>` is bordered orange.
- Expected `record<string>`: a `returnValue` with `mlSchema` `record<string>` has no border; the default identity transformer (Book) is bordered.
- Switching back to `Book` removes the parameter select and restores the default (no border for identity).

### 3.2 GREEN

`INPUT_OUTPUT_BASE_TYPES` gains `record`, `tuple`; main select value = type kind of `expectedOutputType`; a second `ThemedSelectWithPortal` (`data-testid="list-transformer-expected-output-payload"`) for `array` / `record` with D2 values then entities; P `any` stored as the bare literal (D9).

### 3.3 Refactor checkpoint

- The chooser grows into its own small component in the same folder (`ExpectedOutputTypeChooser`), props `value`, `onChange`, `entities`, if `ListTransformerPanelInner` gets harder to read.

### Validation

**Nonreg scopes:** `smoke,ui`.

```bash
npm run testByFile -w miroir-standalone-app -- --no-bail ListTransformerPanel.unit
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
npm run lint
npm run nonreg:filesystem -- --runner shared --scope smoke,ui
```

### Realization

- `ExpectedOutputTypeChooser.tsx` (new, same folder): main select on the type's kind (`array`, `record` for a parameterized type), then an "of" select (`list-transformer-expected-output-payload`) for `array` / `record` with the D2 values then the entities; parameter `any` stores the bare literal. `ListTransformerPanel` renders it and drops `INPUT_OUTPUT_BASE_TYPES` (3.3 done in this slice: the panel was already long). The stale doc comment above `formatMlSchemaNodeMismatch` is fixed.
- Test mock: a `set-transformer-from-test` button sets the transformer the test put in `globalThis.__listTransformerToSet`, so each case builds its own `returnValue` with an `mlSchema`.
- `testByFile` stops at the first failure: the pre-existing failing case runs first, so these runs need `--no-bail`.
- RED: 5 new cases failing. GREEN: `ListTransformerPanel.unit` 22/23 (the pre-existing failure only); standalone `tsc` still 32 errors, none in the touched files; lint clean.
- Scoped nonreg `smoke,ui`: 32/32.

---

## Slice 4 — Chooser: tuple elements

**Status:** ✅ DONE

### Goal

A report designer picks `tuple` and edits its element types (G1).

### 4.1 RED

`ListTransformerPanel.unit.test.tsx`:
- Choosing `tuple` shows two element selects at `any` (`list-transformer-expected-output-tuple-0`, `-1`) and a + button; − is disabled at one element.
- Setting elements to `string`, `number`: a `returnValue` with `mlSchema` `tuple<string, number>` has no border, one with `tuple<string, string>` is bordered.
- + adds a third element at `any`; − removes the last.

### 4.2 GREEN

Element list in the chooser; value `{ type: "tuple", payload: [...] }`.

### 4.3 Refactor checkpoint

- Shared option list for the parameter select and the element selects.

### Validation

**Nonreg scopes:** `smoke,ui`. Full nonreg here (after 2 slices since the last one).

```bash
npm run testByFile -w miroir-standalone-app -- --no-bail ListTransformerPanel.unit
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
npm run lint
npm run nonreg:filesystem -- --runner shared
```

### Realization

- `ExpectedOutputTypeChooser`: `tuple` in the main select starts at `tuple<any, any>`; one select per element (`list-transformer-expected-output-tuple-<i>`), + appends `any`, − drops the last and is disabled at one element (`ThemedButton` secondary: `ThemedIconButton` does not forward `data-testid`).
- 4.3: `TypeParameterSelect` serves the "of" select and the element selects.
- RED: 4 new cases plus the record case now also asking for `tuple`. GREEN: `ListTransformerPanel.unit` 25/26 (the pre-existing failure only); standalone `tsc` 32 errors, none in the touched files; lint clean.

---

## Slice 5 — One type formatter (G4)

**Status:** ⬜ pending

### Goal

`tuple<string, number>`, `record<Book>` and `array<Book>` read the same in the list panel, the editor badges and the editor's mismatch titles.

### 5.1 RED

`fn.transformer.interfaceCheck`, new suite "format" (`formatInputOutputTypeLabel`, whitelisted): `array<Book>` with a Book entity list, `record<string>`, `tuple<string, Book>`, an unknown uuid shortened with `shortenUnknownUuids`, bare `record`.

`transformerTypesDisplay` (#453): a mismatch title shows `tuple<string, number>`, not JSON.

### 5.2 GREEN

Move `formatInputOutputTypeLabel` to miroir-core (`TransformerInterfaceCheck.ts` or a sibling `InputOutputTypeLabel.ts`), export it, tuple branch; `TransformerTypeAnnotation.tsx` re-exports or callers import from miroir-core; `TransformerEditor.tsx` `formatInputOutputType` replaced by it.

### 5.3 Refactor checkpoint

- Delete the standalone copy and `formatInputOutputType`.

### Validation

**Nonreg scopes:** `smoke,core,ui`.

```bash
npm run build -w miroir-core
npm run testMiroir -w miroir-core -- --suites fn.transformer.interfaceCheck --mode unit
npm run testByFile -w miroir-standalone-app -- --no-bail ListTransformerPanel.unit transformerTypesDisplay
npm run nonreg:filesystem -- --runner shared --scope smoke,core,ui
```

### Realization

---

## Slice 6 — Stock definition sweep (D11)

**Status:** ⬜ pending (waits for A's approval of analysis §3.3, row by row)

### Goal

Stock definitions that build records declare them; #88 stops claiming `record<element>` for a spread object (G2, G3).

### 6.1 RED

- `stockTransformerDefinitions`: `getTransformerDefinitionInputOutput("indexListBy")` is `{ input: { type: "array", payload: "object" }, output: "record" }`; same for each approved row.
- `fn.transformer.resultSchema`: `listReducerToSpreadObject` over Book rows resolves to an `object` schema.
- `fn.transformer.interfaceCheck`: `indexListBy` declared output satisfies expected `record` and `object`, and not `array`.

### 6.2 GREEN

Edit the approved definitions under `miroir_data/a557419d-.../`; the `case "listReducerToSpreadObject"` of `Transformer_ResultSchema.ts`.

### Validation

**Nonreg scopes:** `smoke,core`.

```bash
npm run build -w miroir-app-miroir && npm run build -w miroir-core
npm run testMiroir -w miroir-core -- --suites fn.transformer.interfaceCheck,fn.transformer.resultSchema --mode unit
npm run testByFile -w miroir-app-miroir -- tests/modelValidation.unit.test.ts
npm run nonreg:filesystem -- --runner shared --scope smoke,core
```

### Realization

---

## Slice 7 — Nonreg, docs, AC

**Status:** ⬜ pending

### 7.1 Nonreg

- Add `unit-449-parameterized-interface-types` (`npm run testByFile -w miroir-standalone-app -- --no-bail ListTransformerPanel.unit`, scopes `["ui"]`) to `scripts/nonreg-manifest.json`. The core suites already run in `unit-miroir-core`.
- Full `npm run nonreg:filesystem -- --runner shared`.

### 7.2 Docs

- `analysis.md` status → implemented; progress table; `docs/` mention of `inputOutput` types if one exists (search `inputOutput` in `docs/`).

### 7.3 Tracer bullet (narrative)

1. Open a Book list report, show the transformer panel.
2. Set the expected output to `array`, parameter `string`; set the row transformer to `mapList` of titles over a list attribute or a `returnValue` of `["a"]`: no border.
3. Change the parameter to `number`: orange border, title `array<string>` vs `array<number>`.
4. Set the expected output to `tuple<string, number>`: element selects, border follows.

Automated equivalent: `ListTransformerPanel.unit` slices 3-4 cases.

### AC checklist (#449)

| Criterion | Proven by | Status |
|---|---|---|
| A parameter control appears for the parameterized types only | slice 3 case 1, slice 4 case 1 | ⬜ |
| `array<string>` expected: `array<string>` adequate, `array<number>` inadequate | slice 3 | ⬜ |
| Entity and record rules | slice 1 "record forms" | ⬜ |
| Panel tests cover the chooser | `ListTransformerPanel.unit` | ⬜ |
