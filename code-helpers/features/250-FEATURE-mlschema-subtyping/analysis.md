# 250 — mlSchema subtyping (Liskov) in miroir-core

> Pure structural subtype check on mlSchema / `JzodElement` ASTs: `isMlSchemaSubtype(A, B)` is true iff every value of `A` is accepted by `B` (LSP).

Related issue: https://github.com/miroir-framework/miroir/issues/250  
Related: [#145](https://github.com/miroir-framework/miroir/issues/145) (mlSchema vs Jzod), [#88](https://github.com/miroir-framework/miroir/issues/88) / [#249](https://github.com/miroir-framework/miroir/issues/249) (typed transformers)

**Status:** implemented (first cut).

## Decision record

| Decision | Choice |
|---|---|
| D1 — Input type | **`JzodElement`** (entity `mlSchema` AST / element schemas), not the named `MlSchema` registry entity |
| D2 — Relation | **LSP / value-set inclusion**, with acceptance semantics following `jzodTypeCheck` — not the lenient both-ways `any` of #249 `inputOutput` |
| D3 — Width | **Only against `nonStrict` supertypes** — `jzodTypeCheck` objects are strict by default (extra value attributes are type errors), so `{a,b} <: {a}` holds only when the target is `nonStrict`. A `nonStrict` subtype requires a `nonStrict` supertype, and admits `any` for attributes missing from its own definition. |
| D4 — uuid | **`uuid <: string`** at JSON-value level, provided the target string bears no validations |
| D5 — References / extend | **Identity only** in the first cut: `schemaReference` compares the whole node (paths, `eager`, `partial`, **and `context`**) after presentation stripping; objects bearing `extend` are subtypes of deep-equal schemas only (no flattening without a model environment). Resolution + flattening are follow-ups. |
| D6 — validations / coerce | **Conservative**: a subtype may add validations to an unvalidated supertype; a `coerce` subtype requires a `coerce` supertype; otherwise constraint sets must be deep-equal. Comparing validation semantics is out of scope. |
| D7 — Recursion | **No depth guard**: schemas are finite JSON trees and the recursion is structural on the input. Cyclic schemas can only be expressed via `schemaReference` / `lazy`, which are never recursed into. |
| D8 — optional / nullable | **Match `jzodTypeCheck`**: either flag accepts both `null` and `undefined`; a missing object attribute is allowed when the target attribute is optional **or** nullable (or the object is `partial`). Consequently optional and nullable are equivalent value sets. |

## Goals

1. **Subtype check** — In order to compare transformer / entity schemas at design time as a report designer or library author, I can ask whether one mlSchema is a subtype of another.
2. **LSP asymmetry** — In order to avoid false positives, as a framework maintainer I can rely on `any` ≰ concrete and optional ≰ required in the subtype direction.

## Non-goals

- Replacing #249 `inputOutputTypesCompatible` (coarser, deliberately lenient)
- Full `schemaReference` resolution / `extend` flattening (needs model environment — follow-up)
- Validation / `coerce` semantics comparison (e.g. `min 5 <: min 3` is rejected although it holds)

## Key reuse

| Piece | Location |
|---|---|
| `JzodElement` | `packages/miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.ts` |
| Acceptance semantics (strict objects, `nonStrict`) | `packages/miroir-core/src/1_core/jzod/jzodTypeCheck.ts` |
| Implementation | `packages/miroir-core/src/1_core/jzod/mlSchemaSubtype.ts` |
| Unit tests | `packages/miroir-core/tests/1_core/jzod/mlSchemaSubtype.unit.test.ts` |
