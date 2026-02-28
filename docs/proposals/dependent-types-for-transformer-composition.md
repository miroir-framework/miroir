# Dependent Types for Transformer Composition in Miroir

## Problem Statement

Jzod currently lacks dependent types or type-level parameterisation. Every transformer parameter accepting another transformer is typed as the full `TransformerForBuildPlusRuntime` union—no narrowing based on expected input/output. Concretely:

- `mapList.elementTransformer` should accept only transformers whose *input* type matches the list's element type.
- `pickFromList` (type `X[] → X`) cannot express that its output type is the element type of its input.
- When composing transformers in a `dataflowObject`, each step's output should constrain the next step's input type, but today nothing enforces this.

The goal is to introduce a mechanism so that the **editor and type-checker can limit the set of relevant transformers** offered during composition, based on the surrounding type context.

---

## Background: Existing Mechanisms

| Mechanism | What it provides | Limitation |
|---|---|---|
| **`InputOutputType`** on `transformerInterface` | Coarse `"array" \| "object" \| "string" \| …` hints | String enum, not structural; not propagated into composed types |
| **CarryOn pattern** (`applyLimitedCarryOnSchemaOnLevel`) | Schema-level parameterisation: every position in a base type can *alternatively* accept a carry-on type | Designed for template holes, not for relating an output type to an input type |
| **`tag.value.ifThenElseMMLS`** | Conditional type resolution based on a runtime discriminator | Switches between fixed schemas; cannot express "same as input element type" |
| **`context` on `schemaReference`** | Local type scoping | Static; no binding/unification |

None of these relate the *output* of one transformer to the *input* of another.

---

## Proposal A — Type Variables in Jzod (`jzodTypeVar` + `jzodForAll`)

### Design

Add two new Jzod element types:

```jsonc
// New element: a type variable (placeholder)
{
  "type": "typeVar",
  "name": "X"          // scoped name
}

// New element: universal quantification wrapping an existing element
{
  "type": "forAll",
  "typeVars": ["X", "Y"],
  "definition": <jzodElement using typeVar references>
}
```

A transformer's `transformerInterface` would become:

```jsonc
{
  "transformerInterface": {
    "typeVars": ["X"],
    "inputOutput": {
      "input":  { "type": "array", "definition": { "type": "typeVar", "name": "X" } },
      "output": { "type": "typeVar", "name": "X" }
    }
  }
}
```

**Unification rule**: when a concrete schema is supplied for `input`, the system binds `X` and propagates it to `output`. The editor/validator uses the bound type to filter available transformers for the next composition step.

### Pros

- **Expressive**: captures `X[] → X`, `Record<string, X> → X[]`, `(X → Y) → X[] → Y[]`, etc.
- **Familiar**: follows established parametric-polymorphism conventions (System F style).
- **Composable**: type variables can appear anywhere a `jzodElement` is accepted, enabling deep nesting (`array(array(X))`).
- **Schema-level**: the information is part of the schema itself, so tooling (editor, code-gen) has direct access.

### Cons

- **Invasive change**: `jzodElement` union gains two new variants → every consumer of `jzodElement` (Zod codegen in `jzod`, TS codegen in `jzod-ts`, runtime validators, UI schema editors) must handle them.
- **Unification engine required**: a non-trivial addition to the schema-resolution pipeline; must handle recursive types, partial binding, failure reporting.
- **Bootstrap complexity**: the meta-schema (`1e8dab4b-…`) must define `jzodTypeVar` and `jzodForAll` in terms of itself.
- **Over-engineering risk**: full parametric polymorphism may exceed what transformer composition actually needs.

### Redundancy with Existing Constructs

- **`InputOutputType` enum** becomes redundant—remove it, or auto-derive it from the structural `inputOutput` types for backward compat.
- **CarryOn `canBeTemplate`** and `ifThenElseMMLS` are orthogonal (template holes vs. type parameters) and can coexist, though `forAll` subsumes some `ifThenElseMMLS` use cases for conditional typing.

### Codebase Impact

| Area | Change |
|---|---|
| `jzod` (bootstrap schema JSON) | Add `jzodTypeVar`, `jzodForAll` to `jzodElement` union and `jzodEnumElementTypes` |
| `jzod/src/JzodToZod.ts` | Handle `typeVar` (emit `z.any()` at generation time, or a branded marker) |
| `jzod-ts/src/JzodToTs.ts` | Emit generic TS type parameters (`<X>`) when encountering `forAll` |
| `miroir-core` fundamental schema | Add `typeVar`/`forAll` to `miroirFundamentalJzodSchema.definition.context` |
| `miroir-core` transformer resolution | New unification pass in `transformer_extended_apply` or a new `resolveTypeVars` utility |
| Transformer EntityDefinition schema | Replace `InputOutputType` enum with structural Jzod types |
| UI schema editor | Render type variables as generic placeholders; propagate bindings during composition |

---

## Proposal B — Constrained Transformer Slots via `inputSchema` / `outputSchema` Annotations

### Design

Instead of modifying the Jzod type system itself, enrich each transformer's `transformerInterface` with **structural Jzod schemas for input and output**, and add a **composition validator** that checks compatibility at design time.

```jsonc
{
  "transformerInterface": {
    "transformerParameterSchema": { … },
    "inputSchema":  { "type": "array", "definition": { "type": "any" } },
    "outputSchema": { "type": "any" },
    "outputSchemaTransformer": {
      // A transformer that computes the output schema from the input schema
      "transformerType": "pickFromList_outputSchemaDerivation",
      "applyTo": { "transformerType": "getFromParameters", "referenceName": "inputSchema" }
    }
  }
}
```

A small catalog of **schema-derivation rules** maps each transformer type to a function `inputSchema → outputSchema`:

| Transformer | Derivation |
|---|---|
| `pickFromList` | `array(X) → X` (unwrap one array level) |
| `mapList` | `array(X) → array(Y)` where `Y = outputSchema(elementTransformer)` |
| `indexListBy` | `array(X) → record(X)` |
| `getObjectEntries` | `record(X) → array(tuple(string, X))` |
| `getObjectValues` | `record(X) → array(X)` |
| `createObject` | literal object schema from `definition` keys |
| …etc | |

The **composition validator** runs at design time (in the editor or during `devBuild`):
1. For each step in a `dataflowObject`/`dataflowSequence`, compute its `outputSchema`.
2. Check that the next step's `inputSchema` is assignable from the previous step's `outputSchema`.
3. Surface mismatches as warnings/errors in the editor.

### Pros

- **Non-invasive to Jzod core**: no new element types; the bootstrap schema is unchanged.
- **Incremental adoption**: validators can be added per-transformer, starting with the most common ones.
- **Tooling-friendly**: the editor receives concrete schemas to filter transformer suggestions—straightforward to implement.
- **Leverages existing infrastructure**: schema-derivation rules can themselves be transformers (`resolveSchemaReferenceInContext`, `unfoldSchemaOnce`), reusing existing evaluation.

### Cons

- **Not first-class**: type relationships are encoded in external derivation rules, not in the schema. They can drift out of sync with the actual transformer implementations.
- **Limited expressiveness**: cannot capture higher-order relationships (e.g., `(X → Y) → X[] → Y[]` for `mapList`) without essentially reinventing type variables inside the derivation rules.
- **Duplication**: the derivation-rule catalog mirrors transformer semantics and must be maintained in parallel.
- **Shallow checking**: only checks adjacent steps; does not provide full-pipeline type inference.

### Redundancy with Existing Constructs

- **`InputOutputType` enum** is subsumed by `inputSchema`/`outputSchema`—deprecate in favour of the structural schemas.
- **`transformerResultSchema`** (already on `transformerInterface`) overlaps with `outputSchema`. Merge: let `transformerResultSchema` *become* the `outputSchema`, and extend it with derivation-rule support when `returns: "mlSchemaTransformer"`.

### Codebase Impact

| Area | Change |
|---|---|
| Transformer EntityDefinition schema | Add `inputSchema`, `outputSchema`, `outputSchemaTransformer` to `transformerInterface` |
| `miroir-core` new utility | `deriveOutputSchema(transformerDef, inputSchema): JzodElement` |
| `miroir-core` new utility | `validateTransformerComposition(steps): ValidationResult[]` |
| Transformer JSON assets | Annotate each transformer definition with `inputSchema`/`outputSchema` |
| UI editor | Call `deriveOutputSchema` to filter and rank available transformers |
| `jzod`, `jzod-ts` | **No changes** |

---

## Proposal C — Row-Polymorphic Tags with Schema Propagation

### Design

Extend the existing **tag system** with a `typeSlot` mechanism. A `typeSlot` in a tag declares that the annotated position carries a type parameter, and a `typeSlotBinding` on a parent element binds it.

```jsonc
// In a transformer parameter schema:
{
  "type": "array",
  "tag": {
    "value": { "typeSlot": "ElementType" }
  },
  "definition": { "type": "any" }   // placeholder
}
```

```jsonc
// In the transformer interface:
{
  "transformerInterface": {
    "typeSlots": ["ElementType"],
    "inputOutput": {
      "input":  { "type": "array", "definition": { "type": "any", "tag": { "value": { "typeSlot": "ElementType" } } } },
      "output": { "type": "any", "tag": { "value": { "typeSlot": "ElementType" } } }
    }
  }
}
```

At composition time, when a concrete array `array(Book)` is supplied as input, the system:
1. Matches the structural shape (`array` ↔ `array`).
2. Binds `"ElementType" → Book schema`.
3. Replaces `output`'s `typeSlot: "ElementType"` with the `Book` schema.

This is essentially a simplified unification, but encoded **within the existing tag infrastructure** rather than as new Jzod element types.

### Pros

- **Minimal schema changes**: no new `jzodElement` variants; only the tag `value` schema gains `typeSlot` and `typeSlotBinding` fields.
- **Backward compatible**: tags are already optional and extensible; existing schemas continue to work unchanged.
- **Matches existing conventions**: tags are already used for `canBeTemplate`, `ifThenElseMMLS`, `foreignKeyParams`—adding `typeSlot` follows the established pattern.
- **Moderate expressiveness**: handles `X[] → X`, `Record<string, X> → X[]`, and simple parameterised transformers; sufficient for the composition use case.
- **Easier tooling**: editor needs only pattern-match tag annotations, not perform full unification.

### Cons

- **Overloads the tag system**: tags already carry UI, documentation, and template metadata; adding type-variable semantics risks making them a grab-bag.
- **Less visible**: type relationships are hidden in tag metadata rather than being structurally apparent—harder to read schemas and debug type issues.
- **Limited depth**: difficult to express nested parameterisation (`array(array(X))`) or multi-parameter relationships (`(X, Y) → Map<X, Y>`) cleanly through tag annotations alone.
- **Schema-matching heuristic**: the "match shape, bind slot" algorithm needs fallback rules for shape mismatches (e.g., input is `any`), adding edge cases.

### Redundancy with Existing Constructs

- **`ifThenElseMMLS`** partially overlaps: it conditionally swaps types, while `typeSlot` binds types from context. When the motive for `ifThenElseMMLS` is "use the parent's element type," a `typeSlot` is more precise. Proposal: keep `ifThenElseMMLS` for truly conditional (discriminator-based) cases; use `typeSlot` for parametric cases.
- **`InputOutputType` enum** is again subsumed—deprecate it.
- **CarryOn pattern** remains orthogonal (template holes vs. parametric slots).

### Codebase Impact

| Area | Change |
|---|---|
| Bootstrap schema (`1e8dab4b-…`) | Add `typeSlot?: string` and `typeSlotBinding?: Record<string, jzodElement>` to `tag.value` definition |
| Transformer EntityDefinition schema | Add `typeSlots: string[]` to `transformerInterface` |
| `miroir-core` new utility | `resolveTypeSlots(schema, bindings): JzodElement` — substitute `typeSlot` placeholders |
| `miroir-core` new utility | `matchAndBindSlots(concreteSchema, paramSchema): Record<string, JzodElement>` — structural matching |
| Transformer JSON assets | Annotate input/output schemas with `typeSlot` tags |
| UI editor | Use `matchAndBindSlots` + `resolveTypeSlots` to filter transformers |
| `jzod` | Minor: `JzodToZod.ts` propagates tags but no new element handling needed |
| `jzod-ts` | Minor: could emit TS generics from `typeSlot` annotations, or ignore them |

---

## Comparison Matrix

| Criterion | A: Type Variables | B: Schema Annotations | C: Tag-based Slots |
|---|---|---|---|
| Expressiveness | High (full parametric polymorphism) | Medium (per-transformer rules) | Medium (single-level parameterisation) |
| Jzod schema changes | Major (2 new element types) | None | Minor (tag extension) |
| Bootstrap impact | Significant | None | Minor |
| Implementation effort | High | Medium | Medium-Low |
| Unification/matching | Full unification engine | Ad-hoc derivation rules | Simplified structural matching |
| Tooling integration | Cleanest long-term | Practical short-term | Moderate |
| Risk of drift | Low (types are the source of truth) | High (rules parallel semantics) | Low-Medium |
| Backward compatibility | Breaking (new element types) | Full | Full |
| Redundancy introduced | Subsumes `InputOutputType`, partially subsumes `ifThenElseMMLS` | Subsumes `InputOutputType`, merges with `transformerResultSchema` | Subsumes `InputOutputType`, coexists with `ifThenElseMMLS` |

---

## Recommendation Path

A pragmatic staged approach:

1. **Start with Proposal B** (schema annotations + derivation rules). This requires zero changes to Jzod and delivers immediate value in the editor by filtering transformers based on structural input/output compatibility. Deprecate `InputOutputType` in favour of structural `inputSchema`/`outputSchema`.

2. **Evolve to Proposal C** (tag-based slots) when multi-step type propagation is needed. This adds `typeSlot` to tags, enabling the system to propagate element types through composition chains (e.g., `array(Book) → mapList → pickFromList → Book`).

3. **Consider Proposal A** only if full generics are needed—e.g., for higher-order transformers, or if the framework exposes user-defined generic types. At that point, the unification engine from stage 2 provides a foundation.

This avoids large upfront investment while progressively building toward richer type relationships, each stage subsuming the previous without wasted work.
