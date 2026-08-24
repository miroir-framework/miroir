# Transformer result schema inference

Design-time API for inferring the Jzod output schema of a transformer **without evaluating** it at runtime. Implements [Proposal B](../proposals/dependent-types-for-transformer-composition.md) incrementally (issue [#88](https://github.com/miroir-framework/miroir/issues/88)).

Implementation plan: [`code-helpers/features/88-FEATURE-typed-transformers/tdd-implementation-plan.md`](../../code-helpers/features/88-FEATURE-typed-transformers/tdd-implementation-plan.md).

---

## API

Exported from `miroir-core`:

```typescript
import {
  resolveTransformerResultSchema,
  isFailedTransformerInterfaceFromDefinition,
  type TransformerResultSchemaContext,
  type ResolveTransformerResultSchemaReturnType,
} from "miroir-core";

const schema = resolveTransformerResultSchema(transformer, context);
```

| Parameter | Type | Role |
|-----------|------|------|
| `transformer` | `CoreTransformerForBuildPlusRuntime` | Transformer instance graph to infer |
| `context` | `Record<string, JzodElement>` | Schemas for names already resolved in the surrounding composition |
| `transformerDefinitions` | `Record<string, TransformerDefinition>` (optional) | Defaults to `applicationTransformerDefinitions` |

**Return value:** a `JzodElement` on success, or `FailedTransformerInterfaceFromDefinition` (`status: "error"`) when inference fails. Use `isFailedTransformerInterfaceFromDefinition()` to distinguish.

---

## Context conventions

| Mechanism | Context key |
|-----------|-------------|
| `getFromContext.referenceName` | Same string as `referenceName` |
| `getFromParameters.referenceName` | Same string as `referenceName` |
| `dataflowObject.definition` step | Each step's object key (downstream steps see prior step schemas) |
| `mlSchemaTransformer` derivation | `"applyTo"` when the nested `applyTo` transformer is resolved |

Example — resolve a price field from context:

```typescript
resolveTransformerResultSchema(
  {
    transformerType: "getFromContext",
    interpolation: "runtime",
    referenceName: "price",
  },
  { price: { type: "number" } },
);
// → { type: "number" }
```

---

## Covered built-in transformers

All compositional transformers in `miroirCoreTransformers` have custom inference logic (Slices 1–10). Static built-ins (`currentDate`, `generateUuid`, `+`, …) return their declared `transformerResultSchema.definition`.

| Category | Transformers |
|----------|--------------|
| Context / constants | `returnValue`, `getFromContext`, `getFromParameters`, `constantAsExtractor` |
| Paths / templates | `accessDynamicPath`, `mustacheStringTemplate` |
| Logic | `boolExpr`, `ifThenElse`, `case`, `numericOp`, `stringOp` |
| Lists | `pickFromList`, `mapList`, `filterList`, `sortList`, `concatLists`, `listLength`, `find`, `getUniqueValues` |
| Objects | `createObject`, `dataflowObject`, `mergeIntoObject`, `createObjectFromPairs`, `getObjectEntries`, `getObjectValues`, `indexListBy`, `listReducerToSpreadObject`, `object_fromEntries` |
| Other | `aggregate` |

**Not covered:** admin / MLS / meta-model transformers (`resolveConditionalSchema`, `getActiveDeployment`, …), and `dataflowSequence` (structural container only).

---

## Failure kinds

| `failureKind` | Typical cause |
|---------------|---------------|
| `missingTransformerType` | Value is not a typed transformer object |
| `unknownTransformerType` | No entry in `applicationTransformerDefinitions` |
| `missingTransformerResultSchema` | Definition asset lacks `transformerResultSchema` |
| `contextMissingReference` | `referenceName` / path root absent from `context` |
| `contextPathNotFound` | `referencePath` traversal failed |
| `schemaShapeMismatch` | Operand schema incompatible (e.g. non-boolean `if`, non-array `applyTo`) |
| `accessDynamicPathFailure` | Invalid or incomplete dynamic path |

Failures include `typePath`, optional `transformerPath` / `innerError` for nested propagation, and `referenceName` when the failing sub-term is a context binding.

---

## Testing

| Purpose | Command |
|---------|---------|
| Full MiroirTest suite (37 cases) | `npm run testMiroir -w miroir-core -- --suites transformerResultSchema --mode unit` |
| Vitest loader (same asset) | `RUN_TEST=transformerResultSchema.test npm run testByFile -w miroir-core -- transformerResultSchema` |
| Failure inventory (41 cases) | `RUN_TEST=Transformer_ResultSchema.failures npm run testByFile -w miroir-core -- Transformer_ResultSchema.failures` |
| Nonreg step | `npm run nonreg -- --only unit-transformerResultSchema` |

MiroirTest asset: `packages/miroir-test-app_deployment-miroir/assets/miroir_data/a311f363-e238-4203-bdfc-29e8c160c26b/0d3bd258-a8f9-4a0c-8cd9-bcf5607b50ad.json` (suite key `transformerResultSchema`).

See also [Testing reference — suite registry](./testing.md#suite-registry).
