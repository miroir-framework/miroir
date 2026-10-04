# 449 — Parameterized transformer interface types: array, record and tuple

> Transformer `inputOutput` types gain `record<P>` and `tuple<P1, ..., Pn>` next to `array<P>`, and
> lose `object<P>`. The list transformer panel's expected-output chooser can express them. Types
> stay coarse: every inferred or lifted type is `any` or a supertype of what the transformer
> produces. Full ML schema support is not part of this issue.

## Related links

- Issue: https://github.com/miroir-framework/miroir/issues/449 (split from #249, item 1 of its "Remaining to close")
- Prerequisites: [#249 analysis](../249-FEATURE-typed-transformer-interface/) (`inputOutput` types, adequacy check), [#383 analysis](../383-FEATURE-transformer-choice-by-input-type/analysis.md) (recursive walk), [#453 analysis](../453-FEATURE-transformer-type-display/analysis.md) (value typing, type badges), [#88 plan](../88-FEATURE-typed-transformers/tdd-implementation-plan.md) (output inference)
- Grilling: two rounds on 2026-10-04 (project files `issue-449/grilling-round-1.md`, `grilling-round-2.md`). A rejected `object<P>` and added `record<P>`, `tuple<...>` and an `undefined` payload (round 1). Every round 2 recommendation was accepted. On Q13 A added: "full support for MLSchema is not part of this issue, we aim at sound coarseness here, not potentially inaccurate but detailed and complex type management".
- Key files:
  - TransformerDefinition entity [`a557419d-a288-4fb8-8a1e-971c86c113b8.json`](../../../packages/miroir-app-miroir/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/a557419d-a288-4fb8-8a1e-971c86c113b8.json) (`transformerInterface.inputOutput` context)
  - [`TransformerInterfaceCheck.ts`](../../../packages/miroir-core/src/2_domain/TransformerInterfaceCheck.ts) (compatibility relation, walk, value typing)
  - [`TransformerInterfaceInference.ts`](../../../packages/miroir-core/src/2_domain/TransformerInterfaceInference.ts) (ML schema to coarse type)
  - [`TransformerMlSchemaCheck.ts`](../../../packages/miroir-core/src/2_domain/TransformerMlSchemaCheck.ts) (`liftInputOutputTypeToMlSchema`, coarse type to ML schema)
  - [`ListTransformerPanel.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ListTransformerPanel.tsx) (expected-output chooser)
  - [`TransformerTypeAnnotation.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/TransformerTypeAnnotation.tsx) (`formatInputOutputTypeLabel`), [`TransformerEditor.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/TransformerEditor/TransformerEditor.tsx) (badges, mismatch titles)

**Status:** decisions confirmed (D1-D10, D12-D14); D11 (stock definition sweep) waits for A's approval of each row.

---

## 1. Goals

| # | Story |
|---|---|
| G1 | **Say what collection a list transformer must return.** In order to check that a row transformer produces the collection I need, as a report designer using the list transformer panel, I can set the expected output to an array, a record or a tuple with its element types, e.g. `array<string>`, `record<Book>`, `tuple<string, number>`. |
| G2 | **Declare collection types.** In order to state what a transformer consumes and returns, as a transformer definition author, I can declare `array<P>`, `record<P>` and `tuple<P1, ..., Pn>` in `inputOutput`. |
| G3 | **Trust the types shown.** In order to rely on an orange border or a red badge, as a transformer designer, I only see types that are true of the transformer: a type the tools cannot work out precisely shows as a coarser one (`any`, `object`, `array<any>`), never as a wrong precise one. |
| G4 | **Read types the same way everywhere.** In order to compare types at a glance, as a transformer designer, I see `array<Book>`, `record<string>` and `tuple<string, number>` written the same way in the list panel, the editor badges and the mismatch messages. |

## 2. Non-goals

- Full ML schema types (A, Q13). The mlSchema mode (#251) only gets a valid lift of the new types.
- Nested type parameters (`array<array<string>>`, `record<tuple<...>>`): a nested position is `any` (A, round 1). Later, no issue yet.
- `object<P>` (A, round 1: "it's a mistake, it makes no sense").
- A bare `tuple` literal (Q7).
- Saving the chosen expected output: panel-local state, as in #246 D3 and #249.
- The TransformerDefinition EntityVersion snapshot `54a16d69-c1f0-4dd7-aba4-a2cda883586c`: versioning is decoupled from core Entity modeling (A, #249 thread, 2026-10-04). Type generation reads the Entity (§4.1).
- Expected types for slots other than `applyTo`: #454.

## 3. Decision record

All **Accepted** by A on 2026-10-04, except D11.

| # | Decision | Rejected | Serves |
|---|---|---|---|
| D1 | The parameterized types are `array<P>`, `record<P>` and `tuple<P1, ..., Pn>`. `object<P>` is removed. | `object<P>` as "record of P" or as "an object that is a P" (round 1 Q1). | G1, G2 |
| D2 | A type parameter P is `any`, `undefined`, `bigint`, `number`, `string`, `boolean`, `object` or an entity uuid. | No `undefined` (round 1 Q3); `object` promoted to `any` (Q9). | G1, G2 |
| D3 | An `array`, `record` or `tuple` in a parameter position becomes `any`. The schema rejects it; inference and value typing produce `any` there. | Nesting. | G3 |
| D4 | Bare literals: `object` (any object), `array` (= `array<any>`), `record` (= `record<any>`, new). No bare `tuple`. | Bare `tuple` (no arity, same as `array<any>`). | G1, G2 |
| D5 | Representation: `{ "type": "array" \| "record", "payload"?: P }` and `{ "type": "tuple", "payload": [P1, ..., Pn] }`, two union arms of `inputOutputType`. An absent payload is `any`. | `items` key for tuples (Q8). | G2 |
| D6 | Compatibility rules of §3.1. A type parameter follows the same rules as a top-level type, restricted to the D2 values. | | G1, G3 |
| D7 | The old `{ "type": "object", "payload" }` form leaves the schema. Its 3 MiroirTests move to `record`. | Keeping it as an alias. | G2 |
| D8 | Inference, lift and walk handle the new types coarsely (§3.2). Any ML construct without a coarse counterpart infers `any`. | Detailed ML typing (A, Q13). | G3 |
| D9 | Chooser: the main select lists `any, undefined, bigint, number, string, boolean, object, array, record, tuple`, then the entities by name. `array` and `record` show a second select for P, defaulting to `any`. `tuple` shows one select per element with + and − buttons, starting at `tuple<any, any>`, minimum 1 element. A P of `any` is stored as the bare literal. | One flat select of every combination; a cascading menu (Q2); P defaulting to the row entity (Q4). | G1 |
| D10 | One formatter, `formatInputOutputTypeLabel`, moves to miroir-core and prints tuples. The list panel, the editor badges and the editor's mismatch titles use it, replacing `safeStringify` in `TransformerEditor.tsx`. | Keep per-component formatting. | G4 |
| D11 | Stock definition sweep, §3.3. **Pending A's approval of each row.** | No sweep (Q15 b). | G2, G3 |
| D12 | Type generation keeps reading the TransformerDefinition Entity. The EntityVersion snapshot is not edited. | Mirroring the change into the snapshot (#249 hints). | G2 |
| D13 | Tests: `inputOutputTypesCompatible`, inference, lift and value typing as MiroirTest `functionCallTest` cases (`fn.transformer.interfaceCheck`, `fn.transformer.interfaceWalk`). The chooser as `ListTransformerPanel.unit.test.tsx` cases. | Vitest-only unit tests for core functions. | G1-G4 |
| D14 | The schema union gets `discriminator: "type"` on its object arms, so that the generic instance editor can tell `array`/`record` from `tuple` (risk R1). | No discriminator. | G2 |

### 3.1 Compatibility (D6)

"A ⇒ B": a declared or inferred A is acceptable where B is declared or expected. `any` is compatible both ways (unchanged). The first six rows are new.

| Actual | Expected | Result |
|---|---|---|
| entity E | `record<any>` | yes |
| entity E | `record<P>`, P ≠ `any` | no |
| `record<P>` | `object` | yes |
| `object` | `record<any>` | yes |
| `object` | `record<P>`, P ≠ `any` | no |
| `tuple<P1..Pn>` | `array<Q>` | every Pi ⇒ Q |
| `array<P>` | `tuple<...>` | no |
| `tuple<P1..Pn>` | `tuple<Q1..Qm>` | n = m and every Pi ⇒ Qi |
| `record<P>` | `record<Q>` | P ⇒ Q |
| `array<P>` | `array<Q>` | P ⇒ Q (unchanged) |
| entity E | `object` | yes (unchanged) |
| `object` | entity E | no (unchanged) |
| entity E | entity F | E = F (unchanged) |
| primitive | primitive | same literal (unchanged; `undefined` is one of them) |
| `array`, `record` or `tuple` | `object` | no (`object` means a non-array object; `record` is the exception) |

As type parameters: `object` ⇒ `object`, entity E ⇒ `object`, `object` ⇏ entity E. So `array<Book>` ⇒ `array<object>` and `array<object>` ⇏ `array<Book>`.

### 3.2 Coarse inference, lift and walk (D8)

| Function | New behavior |
|---|---|
| `inferTransformerOutputTypeFromSchema` (ML → coarse) | `record` → `record<P>`; `tuple` → `tuple<P1..Pn>`; P = the coarse type of the element schema, `any` when it is itself an array, record, tuple or object form (D3). An `array` whose `definition` is a list (not valid ML) → `array<any>` instead of `array<first element>`. |
| `liftInputOutputTypeToMlSchema` (coarse → ML) | `array<P>` → `{ type: "array", definition: lift(P) }` (unchanged); `record<P>` → `{ type: "record", definition: lift(P) }`; `tuple` → `{ type: "tuple", definition: [lift(Pi)] }`; P `object` → `{ type: "object", nonStrict: true, definition: {} }`; P `undefined` → `{ type: "undefined" }`. |
| `payloadOf` (walk, value typing) | Keeps `object`, entity uuids, primitives and `undefined`; turns `array`, `record`, `tuple` and object forms into `any`. |
| `inputOutputTypeOfValue` (#453 D15) | Unchanged rules, but an array of plain objects now types as `array<object>` (`payloadOf` change), and an array of `undefined` as `array<undefined>`. A value is never typed as a record or a tuple: a plain object stays `object`, an array stays `array<common element>`. |
| Element of a list in the walk (`arrayElementInputOutputType`) | `array<P>` → P; `tuple<P1..Pn>` → P1 when all Pi are equal, else `any`; anything else → `any`. |
| `filterList` output in the walk | A `tuple` input gives `array<element>` (filtering changes the length), other inputs unchanged. |

### 3.3 Stock definition sweep (D11, pending)

Enumerated programmatically from the 31 stock definitions that declare `object` or `array` on either side (§4.3). Only the rows below would change; for the others `object` and `record<any>` are mutually compatible, so `record` would add nothing.

| Definition | Today | Proposed | Runtime evidence (`TransformersForRuntime.ts`) |
|---|---|---|---|
| `indexListBy` | `array` → `object` | `array<object>` → `record` | `transformer_object_indexListBy_apply`: `Object.fromEntries(list.map(entry => [entry[indexAttribute], entry]))` |
| `object_fromEntries` | `array` → `any` | `array` → `record` | `handleTransformer_object_fromEntries`: `Object.fromEntries(applyTo)`, fails on a non-array |
| `listReducerToSpreadObject` | `array` → `object` | `array<object>` → `object` | `transformer_object_listReducerToSpreadObject_apply`: fails unless every entry is a non-array object, merges their attributes |
| #88 result schema of `listReducerToSpreadObject` (`Transformer_ResultSchema.ts`, `case "listReducerToSpreadObject"`) | `{ type: "record", definition: <element schema> }` | `{ type: "object", nonStrict: true, definition: {} }` | the values are the elements' attribute values, not elements. Once `record<P>` is inferred (§3.2), today's schema would claim `record<Book>` for a merge of Books, which breaks G3. |

Kept as they are: `createObjectFromPairs`, `mergeIntoObject`, `createObject`, `getObjectValues` (input), `getObjectEntries` (its precise output `array<tuple<string, any>>` is nested, so `array<any>` under D3).

---

## 4. Current state (`_integration` 04ae35bb)

### 4.1 Schema and generated types

`transformerInterface.inputOutput` in the TransformerDefinition Entity defines, in its `context`:

```jsonc
"inputOutputPayloadType": { "type": "union", "definition": [
  { "type": "enum", "definition": ["any", "bigint", "number", "string", "boolean"] },
  { "type": "uuid" } ] },
"inputOutputType": { "type": "union", "definition": [
  { "type": "enum", "definition": ["any", "undefined", "bigint", "number", "string", "boolean", "object", "array"] },
  { "type": "uuid" },
  { "type": "object", "definition": {
      "type": { "type": "enum", "definition": ["object", "array"] },
      "payload": { "type": "schemaReference", "optional": true, "definition": { "relativePath": "inputOutputPayloadType" } } } } ] }
```

Generated (`miroirFundamentalType.ts`): `InputOutputPayloadType`, `InputOutputType`, `InputOutputObject`. `getMiroirFundamentalMlSchema` spreads `entityDefinitionTransformerDefinition.mlSchema...inputOutput.context` (`getMiroirFundamentalMlSchema.ts:1087`). The parameter name suggests the EntityVersion, but the caller `scripts/generate-ts-types.ts:388` passes `entityTransformerDefinition`, the Entity. The snapshot `54a16d69-...` holds the same `inputOutput` and differs from the Entity in one place only (`transformerResultSchema...addAttributesToContextBeingSubtypeOf`, Entity only).

### 4.2 Uses of the object form

- No stock TransformerDefinition declares an object form (§4.3).
- `fn.transformer.interfaceCheck` (`c9f0a3e1-7b2d-4e6a-8f1c-5d3b9a7e2c84`), suite "object and array payload forms" (13 cases): 3 use `{ "type": "object", "payload" }`.
- Code that builds object forms: `inputOutputTypeOfValue` and `listCombinatorOutput` (`array` only), `inferTransformerOutputTypeFromSchema` (`array` only), `TransformerEditor.tsx` none since #453 (it calls `inputOutputTypeOfValue`).

### 4.3 Stock declarations

Python enumeration of every `transformerInterface.inputOutput` under `packages/*/assets/**/a557419d-.../`: 48 definitions, 1 without `inputOutput`. Object and array declarations, by count: `array → array` 8, `object → object` 7, `array → any` 3, `array → object` 3, `any → object` 3, `object → any` 2, and one each of `array → number`, `undefined → object`, `object → array`, `any → array`, Entity `16dbfe28-...` → `array`. All are bare literals.

### 4.4 Compatibility relation (`TransformerInterfaceCheck.ts:41-121`)

`normalizeInputOutputType` maps a type to `primitive | entityUuid | object | array` (the last two with a payload). `inputOutputPayloadsCompatible` compares payloads with its own copy of the rules (`any` both ways, entity uuid only to the same uuid, primitives exactly). An entity uuid satisfies `object` only when the expected payload is `any` (`e.kind === "object" && e.payload === "any"`).

### 4.5 Inference (`TransformerInterfaceInference.ts:26-80`)

| ML schema type | Coarse type today | Problem |
|---|---|---|
| `any`, `undefined`, primitives | same | |
| `object` | entity uuid when the schema equals a known entity's, else `object` | |
| `array` with element E | `array<infer(E)>`, `array<any>` when `infer(E)` is an object form | `infer(E)` = `"object"` or `"undefined"` gives a payload the schema rejects today. Valid after D2. |
| `array` whose `definition` is a list | `array<infer(first element)>` | not valid ML; unsound for a heterogeneous list |
| `record` | `any` | sound, coarser than needed |
| `tuple` | `any` | sound, coarser than needed (correction: grilling round 2 said "read as `array<first element>`", which only applies to the invalid list form above) |
| others (`union`, `literal`, `enum`, ...) | `any` | sound |

#88 already produces `record` schemas: `indexListBy` and `listReducerToSpreadObject` (`record` of the element schema), `object_fromEntries` (`record<any>`) (`Transformer_ResultSchema.ts:1227-1254`).

### 4.6 Lift (`TransformerMlSchemaCheck.ts:46-85`)

An object form becomes `{ type: <form type>, definition: lift(payload) }`: right for `array`, an invalid ML object for `object<P>`. `liftPayloadToMlSchema` handles the five primitive payloads and entity uuids. `mlSchemaSubtype.ts` already compares `record` and `tuple` schemas (lines 194-215), so the mlSchema mode only needs a valid lift.

### 4.7 Walk (`TransformerInterfaceCheck.ts:270-614`)

- `payloadOf` (line 459) turns `object`, `array`, `undefined` and object forms into `any`.
- `arrayElementInputOutputType` (line 318) reads only `array<P>`.
- `listCombinatorOutput` (line 465): `mapList` → `array<payloadOf(element output)>`, `filterList` → its input, `find` → the bound element.

### 4.8 Chooser (`ListTransformerPanel.tsx:477-504`)

A `ThemedSelectWithPortal` (`data-testid="list-transformer-expected-output-type"`) over `INPUT_OUTPUT_BASE_TYPES` (8 literals, line 90) and the entities sorted by name. Its value is `typeof expectedOutputType === "string" ? expectedOutputType : "any"`, so an object-form type would show as `any`. `chosenOutputType` is `undefined` while it equals the default (the row entity uuid). The expected type feeds `checkTransformerInterfaceCompatibilityWithInference` (line 247) and `liftInputOutputTypeToMlSchema` (line 269, mlSchema mode).

### 4.9 Formatting

`formatInputOutputTypeLabel(type, entities?, { shortenUnknownUuids? })` (`TransformerTypeAnnotation.tsx:66`) prints `<type><payload>` with entity names. `TransformerEditor.tsx:104` `formatInputOutputType` prints object forms with `safeStringify` in badge titles and mismatch messages.

## 5. Key reuse

| Piece | Location |
|---|---|
| Compatibility relation | `inputOutputTypesCompatible`, `TransformerInterfaceCheck.ts` |
| Stock schema check | `findInvalidStockTransformerInputOutputs` (same file), suite `stockTransformerDefinitions` of `fn.transformer.interfaceCheck` |
| Walk tests | MiroirTest `fn.transformer.interfaceWalk` (`0a6912c2-e061-476b-bd54-849e7366684b`) |
| Check tests | MiroirTest `fn.transformer.interfaceCheck` (`c9f0a3e1-7b2d-4e6a-8f1c-5d3b9a7e2c84`) |
| Whitelisted functions for MiroirTests | `FunctionCallTestRegistry.ts` (`inputOutputTypesCompatible`, `inferTransformerOutputTypeFromSchema`, `liftInputOutputTypeToMlSchema`, `inputOutputTypeOfValue` already listed) |
| ML subtyping for the mlSchema mode | `isMlSchemaSubtype`, `1_core/mls/mlSchemaSubtype.ts` |
| Panel tests | `packages/miroir-standalone-app/tests/4_view/ListTransformerPanel.unit.test.tsx` (Book rows, `fireEvent.change` on the chooser) |
| Union discriminator precedent | Endpoint entity `3d8da4d4-8f76-4bb4-9212-14869d81c00c` (`"discriminator": "type"`) |

## 6. Risks

- **R1.** The generic instance editor must render and edit a definition whose `inputOutput` is a tuple. D14 adds the discriminator; to verify on one definition in the UI slice.
- **R2.** `findInvalidStockTransformerInputOutputs` and every stock definition must still validate after the schema change (only bare literals today, so expected to pass).
- **R3.** `array<object>` from value typing changes some #453 badges from `array<any>` to `array<object>`. Walk tests that assert `array<any>` for arrays of plain objects must be updated, not worked around.

Implementation plan: [`tdd-implementation-plan.md`](./tdd-implementation-plan.md).
