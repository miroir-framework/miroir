# Issue #88 — Code and test review

Date: 2026-08-24  
Baseline: `fccb9977c` (parent of `#88 FEATURE: typed Transformers`) plus the working tree.  
Spec sources: GitHub [#88](https://github.com/miroir-framework/miroir/issues/88), [`tdd-implementation-plan.md`](./tdd-implementation-plan.md), Proposal B in [`docs/proposals/dependent-types-for-transformer-composition.md`](../../../docs/proposals/dependent-types-for-transformer-composition.md).

`docs/agents/issue-tracker.md` was missing at review time; run `/setup-matt-pocock-skills` if that workflow should be wired in.

The Slice 10 rule is unmet: **10 of 17** compositional transformers do not have both a success case and two failure cases. `object_fromEntries` has neither.

## Test-to-pass / test-to-fail gaps

Binding rule from the TDD plan (Slice 10 Goal): *“≥1 success and ≥2 failure tests per compositional transformer (MiroirTest + vitest)”*.

| Transformer | Pass (MiroirTest) | Fail (vitest / MiroirTest) | Gap |
|---|---|---|---|
| `filterList` | 1 | 2 | Meets quota |
| `sortList` | 1 | 2 | Meets quota (second fail is generic context-missing, not a second shape rule) |
| `concatLists` | 1 homogeneous | 2 | **Missing pass:** `array(X)+array(Y) → array(union(X,Y))` (catalog / 10.1) |
| `listLength` | 1 | 2 | Meets quota |
| `find` | 1 | 2 | Meets quota |
| `getObjectValues` | 1 | 2 | Meets quota; **missing pass:** `record` applyTo (helper treats `record` as object-like, then falls back to `array(any)` because `getObjectDefinitionMap` only reads `object`) |
| `getObjectEntries` | 1 (`array(any)`) | **0** | **Missing 2 fails** (10.3). Pass locks the deferred `any` instead of `array(tuple(string, X))` |
| `getUniqueValues` | 1 | **0** | **Missing 2 fails** (applyTo not array, ×2) |
| `indexListBy` | 1 | **0** | **Missing 2 fails** |
| `listReducerToSpreadObject` | 1 on `array(string)` | **0** | **Missing 2 fails.** Pass does not match catalog `array(object) → record(object)` |
| `object_fromEntries` | **0** | **0** | **No tests at all** (10.4) |
| `mergeIntoObject` | 1 | **0** | **Missing 2 fails** (applyTo not object; nested definition failure) (10.5) |
| `createObjectFromPairs` | 1 | **0** | **Missing 2 fails.** Code never resolves `applyTo` despite catalog “+ applyTo list context” |
| `case` | 1 (no `else`) | 0 (10.6 optional) | **Missing pass:** `else` present → union of three (10.6) |
| `mustacheStringTemplate` | 1 static string | 0 (10.7 optional) | Catalog “validate referenced context keys” not implemented and not tested |
| `constantAsExtractor` | 1 with `valueJzodSchema` | n/a | **Missing pass:** no `valueJzodSchema` → `{ type: "any" }` (10.7) |
| `aggregate` | 1 | 2 vitest only | Quota met in vitest; 10.8 also asked the not-array failure in **MiroirTest** |

### Earlier slices — missing pass cases

- `ifThenElse` with neither branch → `{ type: "boolean" }` (claimed in Realization, never in RED).
- `ifThenElse` with only `else`.
- `getFromContext` success via `referencePath` (only `referenceName` is a pass; path is fail-only).
- `getFromParameters` success (fail-only).
- `dataflowObject` where a later key is referenced by an earlier one — would lock key-order walk vs the plan’s “topological walk”.

### Earlier slices — missing fail cases

- `missingTransformerResultSchema` (failure kind exists, no test).
- `mlSchemaTransformer` cycle / infinite recursion (Slice 5 checkpoint: *“Guard against infinite recursion”* — no guard, no test).
- Empty `case.whens` → `{ type: "any" }` (implemented, untested).

### Tests that exist but do not prove the spec

- Inventory “core transformers without custom resolver” builds `HANDLED` and `CORE` as local literals and asserts `unhandled === []`. That cannot fail if the switch omits a transformer. Slice 10.0 asked a shrinking snapshot of unhandled keys.
- `getObjectEntries` pass expects `{ type: "array", definition: { type: "any" } }` — a tautology of the stub, not Proposal B’s tuple.
- `Transformer_ResultSchema.failures.unit.test.ts` mixes **pass** cases into the failure suite (`boolExpr` `==` with numbers; `returnValue` fallback to `any`).
- Six MiroirTest `failures` cases duplicate vitest. The other ~35 vitest fails have no applicative counterpart, and the dedicated nonreg step never loads the vitest file (see Standards).

## Standards

**Hard — test vehicle** (`docs/contributing/testing.md` “Prefer MiroirTest”; TDD: vitest only when ML cannot express it, with justification)

- `Transformer_ResultSchema.failures.unit.test.ts` (~943 lines, vitest) hits `resolveTransformerResultSchema` — already a `functionCallTest` whitelist + MiroirTest `failures` sub-suite (`0d3bd258-…json`). Same cases (`unknownTransformerType`, `schemaShapeMismatch`) duplicated. No “cannot express via ML” justification.
- `transformerResultSchema.inventory.unit.test.ts` is vitest over `applicationTransformerDefinitions`. Slice-0 lock is the only plausible exception; still not a `functionCallTest`.

**Hard — test placement** (`docs/contributing/testing.md`: issue-scoped tests under `tests/<layer>/issues/<issue>-<slug>/`)

- Describes: `"issue #88 slice 0"` / `"issue #88 slice 12"`. Files sit in `tests/2_domain/`, not `issues/88-…/`. Filenames lack the issue number, so the letter of “no issue number in the name outside `issues/`” is dodged; the spirit is not.

**Hard — nonreg** (`docs/contributing/testing.md`: new tests → registry + nonreg)

- `unit-transformerResultSchema` argv filter is `transformerResultSchema`. Vitest `includes` is case-sensitive: loads `transformerResultSchema.test.ts` + `transformerResultSchema.inventory.unit.test.ts`. **Does not load** `Transformer_ResultSchema.failures.unit.test.ts`.
- `unit-miroir-core` is `testMiroir --mode unit` only — no vitest glob. Failures file is **never** in `npm run nonreg`. Inventory is the only extra vs the already-registered MiroirTest suite (double-run of that suite).

**Hard — layering** (`AGENTS.md`: `0_interfaces` = types and Jzod schemas)

- Runtime predicate `isFailedTransformerInterfaceFromDefinition` lives in `0_interfaces/2_domain/TransformerResultSchemaInterface.ts`. Only `export function is*` under `0_interfaces/2_domain`. Belongs next to the resolver in `2_domain`.

**Hard — early returns / nesting** (`AGENTS.md`, `docs/contributing/code-style.md`)

- `resolveTransformerResultSchema` is a ~500-line `switch (transformerType)` (`case "returnValue"` … `case "aggregate"`) with repeated resolve → `propagateFailure` → shape-check → return. Fall-through `break` then `return resultSchema.definition` hides the default.

**Judgement — smells**

- **Repeated Switches / Divergent Change:** one module owns every transformer’s inference.
- **Duplicated Code:** `isDerivationContextFailure` clones the interface type-guard; `resolveApplyToArrayElementSchema` / `resolveApplyToObjectSchema` are the same walk with a different expected root.
- **Middle Man:** `propagateFailure` is `isFailedTransformerInterfaceFromDefinition`.
- **Mysterious Name:** `FailedTransformerInterfaceFromDefinition` names `transformerInterfaceFromDefinition`, not this resolver.
- **Speculative Generality:** `Transformer_tools.ts` JSDoc-only hunk — empty summary, claims “convert to a JzodElement”, unused by #88.
- **Tautology (inventory):** `CORE.filter(k => !HANDLED.has(k))` with both sets local literals; `expect(unhandled).toEqual([])` never observes the switch. `mlSchemaAnyNames` snapshot is the only independent lock.

## Spec

**Issue #88:** “Transformers shall have input and output MLSchemas.” Output inference exists. **Input** ML schemas (`inputSchema`) do not. TDD lists replacing `inputOutput` as out of scope.

**Proposal B:** `deriveOutputSchema`, `validateTransformerComposition`, and per-definition `inputSchema`/`outputSchema` are absent. TDD substituted `resolveTransformerResultSchema` only.

### (a) Missing / partial

- **Slice 10 Goal:** “≥1 success and ≥2 failure tests per compositional transformer (MiroirTest + vitest…)”. Realization only extended vitest for `filterList`, `sortList`, `listLength`, `find`, `concatLists`, `getObjectValues`, `aggregate`.
- **10.4:** no `object_fromEntries` success (“array of `[string, value]` pairs → `record(valueUnion)` / minimum `record(any)`”).
- **10.6:** no second `case` success (“with `else` boolean | union of three”).
- **10.7:** no `constantAsExtractor` without `valueJzodSchema` → static `any`.
- **10.8 MiroirTest table:** “`applyTo` not array | structured failure” not in the MiroirTest asset (vitest only).
- **10.3 named:** `getObjectEntries` “applyTo not object/record (×2)” — **0** failure tests.
- **10.2 / 10.4 / 10.5 named failures** missing for `getUniqueValues`, `indexListBy`, `listReducerToSpreadObject`, `object_fromEntries`, `mergeIntoObject`, `createObjectFromPairs`.
- **Catalog:** `concatLists` “`array(X)+array(Y)→array(union(X,Y))`” untested (homogeneous only). `mustacheStringTemplate` “validate referenced context keys” unimplemented (10.7 allows static `string` only).
- **10.0:** no shrinking snapshot `coreTransformersWithoutCustomResolver`. Inventory `HANDLED` is a hardcoded set, not a resolver probe.
- **Slice 5 checkpoint:** “Guard against infinite recursion” — no cycle detection.
- **Slice 11 AC:** “`transformerResultSchema` on definitions is source of truth” still ⬜. `find`/`case`/`ifThenElse`/… still declare `{ type: "any" }`.

### (b) Scope creep

None that the TDD plan forbids. Extra `getFromParameters` / `stringOp` length checks are Slice 12, not Proposal A or UI.

### (c) Wrong vs spec

- **Proposal B + 10.3:** `getObjectEntries` → `array(tuple(string,X))`. Jzod has `tuple`. Resolver returns `{ type: "array", definition: { type: "any" } }`. Realization does not document that choice.
- **Catalog / 10.5:** `createObjectFromPairs` “+ `applyTo` list context” — `applyTo` is never resolved or shape-checked.
- **10.4:** `listReducerToSpreadObject` success uses `array(string)`, not `array(object{…})`.

### Quota (≥1 success + ≥2 failure)

| Fail quota | Success | Failures |
|---|---|---|
| **`object_fromEntries`** | 0 | 0 |
| **`getObjectEntries`** | 1 | 0 |
| **`getUniqueValues`** | 1 | 0 |
| **`indexListBy`** | 1 | 0 |
| **`listReducerToSpreadObject`** | 1 | 0 |
| **`mergeIntoObject`** | 1 | 0 |
| **`createObjectFromPairs`** | 1 | 0 |
| **`case`** | 1 (need 2) | 0 (10.6 optional) |
| **`mustacheStringTemplate`** | 1 | 0 (10.7 optional) |
| **`constantAsExtractor`** | 1 (fallback untested) | 0 (10.7: not a fail path) |

**Pass:** `filterList`, `sortList`, `concatLists`, `listLength`, `find`, `getObjectValues`, `aggregate`.

## Summary

**Standards:** 7 hard + 6 judgement; worst: the 41-case failures file is never in `npm run nonreg`.  
**Spec:** 16 findings; worst: Slice 10’s ≥1 pass + ≥2 fail quota is unmet for 10 transformers, including `object_fromEntries` with zero tests.
