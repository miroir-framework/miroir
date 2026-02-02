# Library-Implemented Transformer Examples

Complete examples showing the full implementation of library-implemented transformers.

---

## Example 1: Simple Transformer - returnValue

The simplest library transformer - returns a constant value.

### Step-by-Step Implementation

#### 1. TransformerDefinition JSON
**File**: `packages/miroir-core/src/assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/2b4c25e0-6b0f-4f7d-aa68-1fdc079aead3.json`

```json
{
  "uuid": "2b4c25e0-6b0f-4f7d-aa68-1fdc079aead3",
  "name": "returnValue",
  "defaultLabel": "returnValue",
  "description": "Returns a constant value, optionally validated against a schema.",
  "parentUuid": "a557419d-a288-4fb8-8a1e-971c86c113b8",
  "parentDefinitionVersionUuid": "54a16d69-c1f0-4dd7-aba4-a2cda883586c",
  "parentName": "TransformerDefinition",
  "classification": "basic",
  "transformerInterface": {
    "inputOutput": {
      "input": "any",
      "output": "any"
    },
    "transformerParameterSchema": {
      "transformerType": {
        "type": "literal",
        "definition": "returnValue"
      },
      "transformerDefinition": {
        "type": "object",
        "definition": {
          "mlSchema": {
            "type": "schemaReference",
            "optional": true,
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "jzodElement"
            }
          },
          "value": {
            "type": "any"
          }
        }
      }
    },
    "transformerResultSchema": {
      "returns": "mlSchema",
      "definition": {
        "type": "any"
      }
    }
  },
  "transformerImplementation": {
    "transformerImplementationType": "libraryImplementation",
    "inMemoryImplementationFunctionName": "handleTransformer_returnValue"
  }
}
```

#### 2. Handler Implementation
**File**: `packages/miroir-core/src/2_domain/TransformersForRuntime.ts`

```ts
export const handleTransformer_returnValue = (
  step: Step,
  transformerPath: string[],
  label: string | undefined,
  transformer: TransformerForBuildPlusRuntime_returnValue,
  miroirEnvironment: MiroirModelEnvironment,
  transformerParams: Record<string, any>,
  runtimeContext: Record<string, any>,
  resolveBuildTransformersTo?: ResolveBuildTransformersTo
): TransformerReturnType<any> => {
  const { value, mlSchema } = transformer.transformerDefinition;
  
  // Optional: validate against schema if provided
  if (mlSchema) {
    // Validation logic here
  }
  
  return { transformerType: "success", value };
};

// Also register in inMemoryTransformerImplementations:
export const inMemoryTransformerImplementations: Record<string, any> = {
  // ... other transformers
  handleTransformer_returnValue,
};

// And in applicationTransformerDefinitions:
export const applicationTransformerDefinitions: Record<string, TransformerDefinition> = {
  // ... other transformers
  returnValue: transformer_returnValue,
};
```

#### 3. Export and Registration
**File**: `packages/miroir-core/src/2_domain/Transformers.ts`

```ts
// Import
import transformer_returnValue from "../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/2b4c25e0-6b0f-4f7d-aa68-1fdc079aead3.json" with { type: "json" };

// Export
export const transformer_returnValue: TransformerDefinition = 
  transformer_returnValue_json.definition as TransformerDefinition;

// Add to array
export const miroirCoreTransformers: TransformerDefinition[] = [
  // ... other transformers
  transformer_returnValue,
];
```

#### 4. Schema Registration
**File**: `packages/miroir-core/src/0_interfaces/1_core/bootstrapJzodSchemas/getMiroirFundamentalJzodSchema.ts`

```ts
// In miroirTransformersForBuild section:
transformerForBuild_returnValue: {
  type: "object",
  definition: {
    transformerType: { type: "literal", definition: "returnValue" },
    interpolation: { type: "literal", definition: "buildTime" },
    mlSchema: jzodElement.optional(),
    value: { type: "any" }
  }
},

// In miroirTransformersForBuildPlusRuntime section:
transformerForBuildPlusRuntime_returnValue: {
  type: "object",
  definition: {
    transformerType: { type: "literal", definition: "returnValue" },
    interpolation: { type: "enum", definition: ["buildTime", "runtime"] },
    mlSchema: jzodElement.optional(),
    value: { type: "any" }
  }
},

// In domainActionDependencySet array:
const domainActionDependencySet = [
  // ... other entries
  "transformerForBuild_returnValue",
];
```

#### 5. Type Generation Registration
**File**: `packages/miroir-core/scripts/generate-ts-types.ts`

```ts
// In headerForZodImports:
const headerForZodImports = {
  // ... other entries
  transformerForBuild_returnValue: `import { transformerForBuild_returnValue } from "../0_interfaces/1_core/bootstrapJzodSchemas/getMiroirFundamentalJzodSchema.js";`,
};

// In transformerForBuild section:
const transformerForBuild = {
  // ... other entries
  transformerForBuild_returnValue: `export const transformerForBuild_returnValue_schema = transformerForBuild_returnValue;`,
};

// In TransformerForBuildPlusRuntime section:
const TransformerForBuildPlusRuntime = {
  // ... other entries
  transformerForBuildPlusRuntime_returnValue: `export type TransformerForBuildPlusRuntime_returnValue = z.infer<typeof transformerForBuildPlusRuntime_returnValue_schema>;`,
};

// In transformerForBuildPlusRuntime section:
const transformerForBuildPlusRuntime = {
  // ... other entries
  transformerForBuildPlusRuntime_returnValue: `export const transformerForBuildPlusRuntime_returnValue_schema = transformerForBuildPlusRuntime_returnValue;`,
};
```

#### 6. Test Case
**File**: `packages/miroir-core/src/assets/miroir_data/681be9ca-c593-45f5-b45a-5f1d4969e91e/a5b4be38-78e3-4f31-9e9b-8ab0b71d4993.json`

```json
{
  "transformerTestType": "transformerTest",
  "transformerTestLabel": "returnValue returns a string constant",
  "transformerName": "returnValue",
  "runTestStep": "runtime",
  "transformer": {
    "transformerType": "returnValue",
    "interpolation": "runtime",
    "value": "hello world"
  },
  "transformerParams": {},
  "expectedValue": "hello world"
}
```

---

## Example 2: Conditional Transformer - ifThenElse

A transformer with multiple operators (enum transformerType) and inner transformers.

### TransformerDefinition
**File**: `packages/miroir-core/src/assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/4ded1479-1331-4f96-8723-9a797ba3924b.json`

```json
{
  "uuid": "4ded1479-1331-4f96-8723-9a797ba3924b",
  "name": "ifThenElse",
  "defaultLabel": "ifThenElse",
  "description": "Returns different results based on comparing values using operators.",
  "parentUuid": "a557419d-a288-4fb8-8a1e-971c86c113b8",
  "parentDefinitionVersionUuid": "54a16d69-c1f0-4dd7-aba4-a2cda883586c",
  "parentName": "TransformerDefinition",
  "classification": "basic",
  "transformerInterface": {
    "inputOutput": {
      "input": "any",
      "output": "any"
    },
    "transformerParameterSchema": {
      "transformerType": {
        "type": "enum",
        "definition": ["==", "!=", "<", "<=", ">", ">="]
      },
      "transformerDefinition": {
        "type": "object",
        "definition": {
          "left": {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "transformer"
            }
          },
          "right": {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "transformer"
            }
          },
          "then": {
            "type": "schemaReference",
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "transformer"
            }
          },
          "else": {
            "type": "schemaReference",
            "optional": true,
            "definition": {
              "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              "relativePath": "transformer"
            }
          }
        }
      }
    },
    "transformerResultSchema": {
      "returns": "mlSchema",
      "definition": {
        "type": "any"
      }
    }
  },
  "transformerImplementation": {
    "transformerImplementationType": "libraryImplementation",
    "inMemoryImplementationFunctionName": "handleTransformer_ifThenElse",
    "sqlImplementationFunctionName": "sqlStringForConditionalTransformer"
  }
}
```

### Handler Implementation
**File**: `packages/miroir-core/src/2_domain/TransformersForRuntime.ts`

```ts
export const handleTransformer_ifThenElse = (
  step: Step,
  transformerPath: string[],
  label: string | undefined,
  transformer: TransformerForBuildPlusRuntime_ifThenElse,
  miroirEnvironment: MiroirModelEnvironment,
  transformerParams: Record<string, any>,
  runtimeContext: Record<string, any>,
  resolveBuildTransformersTo?: ResolveBuildTransformersTo
): TransformerReturnType<any> => {
  const { left, right, then: thenTransformer, else: elseTransformer } = 
    transformer.transformerDefinition;
  
  // Resolve left operand
  const leftResult = transformer_InnerReference_resolve(
    step,
    [...transformerPath, "left"],
    left,
    resolveBuildTransformersTo,
    miroirEnvironment,
    transformerParams,
    runtimeContext
  );
  
  if (leftResult.transformerType === "failure") {
    return leftResult;
  }
  
  // Resolve right operand
  const rightResult = transformer_InnerReference_resolve(
    step,
    [...transformerPath, "right"],
    right,
    resolveBuildTransformersTo,
    miroirEnvironment,
    transformerParams,
    runtimeContext
  );
  
  if (rightResult.transformerType === "failure") {
    return rightResult;
  }
  
  // Perform comparison
  let conditionMet = false;
  const operator = transformer.transformerType;
  
  switch (operator) {
    case "==":
      conditionMet = leftResult.value === rightResult.value;
      break;
    case "!=":
      conditionMet = leftResult.value !== rightResult.value;
      break;
    case "<":
      conditionMet = leftResult.value < rightResult.value;
      break;
    case "<=":
      conditionMet = leftResult.value <= rightResult.value;
      break;
    case ">":
      conditionMet = leftResult.value > rightResult.value;
      break;
    case ">=":
      conditionMet = leftResult.value >= rightResult.value;
      break;
  }
  
  // Execute appropriate branch
  const branchTransformer = conditionMet ? thenTransformer : elseTransformer;
  
  if (!branchTransformer) {
    // No else clause and condition not met
    return { transformerType: "success", value: undefined };
  }
  
  return transformer_InnerReference_resolve(
    step,
    [...transformerPath, conditionMet ? "then" : "else"],
    branchTransformer,
    resolveBuildTransformersTo,
    miroirEnvironment,
    transformerParams,
    runtimeContext
  );
};
```

### Test Cases
```json
{
  "transformerTestType": "transformerTestSuite",
  "transformerTestLabel": "ifThenElse",
  "transformerTests": [
    {
      "transformerTestType": "transformerTest",
      "transformerTestLabel": "ifThenElse equality true - basic string comparison",
      "transformerName": "ifThenElse_eq_true",
      "runTestStep": "runtime",
      "transformer": {
        "transformerType": "==",
        "interpolation": "runtime",
        "left": {
          "transformerType": "getFromContext",
          "interpolation": "runtime",
          "referenceName": "testValue"
        },
        "right": {
          "transformerType": "returnValue",
          "value": "match"
        },
        "then": {
          "transformerType": "returnValue",
          "value": "yes"
        },
        "else": {
          "transformerType": "returnValue",
          "value": "no"
        }
      },
      "transformerParams": {},
      "transformerRuntimeContext": {
        "testValue": "match"
      },
      "expectedValue": "yes"
    },
    {
      "transformerTestType": "transformerTest",
      "transformerTestLabel": "ifThenElse less than true - number comparison",
      "transformerName": "ifThenElse_lt_true",
      "runTestStep": "runtime",
      "transformer": {
        "transformerType": "<",
        "interpolation": "runtime",
        "left": {
          "transformerType": "getFromContext",
          "interpolation": "runtime",
          "referenceName": "value"
        },
        "right": {
          "transformerType": "returnValue",
          "value": 10
        },
        "then": {
          "transformerType": "returnValue",
          "value": "less"
        },
        "else": {
          "transformerType": "returnValue",
          "value": "not less"
        }
      },
      "transformerParams": {},
      "transformerRuntimeContext": {
        "value": 5
      },
      "expectedValue": "less"
    }
  ]
}
```

---

## Common Implementation Patterns

### Pattern 1: Resolving Inner Transformers
```ts
const innerResult = transformer_InnerReference_resolve(
  step,
  [...transformerPath, "fieldName"],
  transformer.transformerDefinition.fieldName,
  resolveBuildTransformersTo,
  miroirEnvironment,
  transformerParams,
  runtimeContext
);

if (innerResult.transformerType === "failure") {
  return innerResult;
}

const value = innerResult.value;
```

### Pattern 2: Returning Success
```ts
return { transformerType: "success", value: result };
```

### Pattern 3: Returning Failure
```ts
return {
  transformerType: "failure",
  error: {
    errorType: "FailedToResolveTransformer",
    errorMessage: `${transformerPath.join(".")}: Error description`,
  },
};
```

### Pattern 4: Array/List Processing
```ts
const results = list.map((item, index) => {
  const itemResult = transformer_InnerReference_resolve(
    step,
    [...transformerPath, "item", index.toString()],
    itemTransformer,
    resolveBuildTransformersTo,
    miroirEnvironment,
    { ...transformerParams, currentItem: item },
    runtimeContext
  );
  
  if (itemResult.transformerType === "failure") {
    return itemResult;
  }
  
  return itemResult.value;
});

// Check for failures
const failure = results.find(r => typeof r === "object" && r.transformerType === "failure");
if (failure) {
  return failure;
}

return { transformerType: "success", value: results };
```

---

## See Also

- [SKILL.md](SKILL.md) - Complete workflow instructions
- [template-library-transformer.json](template-library-transformer.json) - Starter template
- [template-test-case.json](template-test-case.json) - Test case template
