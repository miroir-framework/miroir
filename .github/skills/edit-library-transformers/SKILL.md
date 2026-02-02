---
name: edit-library-transformers
description: Create or update Library-Implemented Miroir Transformers (those with TypeScript handler functions). Use when creating transformers with transformerImplementationType libraryImplementation, or when editing transformer handler code in TransformersForRuntime.ts.
allowed-tools: Read, Grep, Glob, Bash(npm *), Edit, Create
---

# Library-Implemented Transformer Manipulation (TDD Style)

This skill guides the creation and modification of **Library-Implemented** Miroir Transformers - those that require TypeScript handler functions.

**Use this skill for**: Transformers with `transformerImplementationType: "libraryImplementation"`  
**Examples**: `ifThenElse`, `mapList`, `createObject`, `dataflowObject`, `aggregate`

**For composite transformers** (no TypeScript code), use the `edit-composite-transformers` skill instead.

---

## CRITICAL: Pre-flight Check

**BEFORE starting any transformer work, verify current test state:**

```bash
# Run unit tests first (in-memory execution)
RUN_TEST=transformers.unit.test npm run testByFile -w miroir-core -- 'transformers.unit'

# Then run integration tests (database execution - requires PostgreSQL)
RUN_TEST=transformers.integ.test npm run testByFile -w miroir-core -- 'transformers.integ'
```

If tests are failing, inform the user of the baseline state before proceeding.

During remaining steps, use the filter passed to the `runTransformerTestSuite` function to execute only relevant test cases. To facilitate later investigations, leave the updated filter commented out at the very end of the session (its default value shall be `undefined`).

---

## Complete TDD Workflow (8 Steps)

Follow these steps in order for creating or modifying a library-implemented transformer:

### Step 1: Run Pre-flight Tests ✅
Establish baseline before any changes.
```bash
RUN_TEST=transformers.unit.test npm run testByFile -w miroir-core -- 'transformers.unit'
```

### Step 2: Write Test Cases First (TDD) 📝
Add test cases to the test suite:
- **File**: `packages/miroir-core/src/assets/miroir_data/681be9ca-c593-45f5-b45a-5f1d4969e91e/a5b4be38-78e3-4f31-9e9b-8ab0b71d4993.json`
- **Suite name**: `miroirCoreTransformers`
- Use the test case template from `template-test-case.json`

### Step 3: Run Tests (Expect Failure) ❌
Verify the test fails before implementation:
```bash
RUN_TEST=transformers.unit.test npm run testByFile -w miroir-core -- 'transformers.unit'
```

### Step 4: Create TransformerDefinition JSON 📄
Create the transformer definition file:
- **Location**: `packages/miroir-core/src/assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/<uuid>.json`
- **Parent UUID**: `a557419d-a288-4fb8-8a1e-971c86c113b8` (TransformerDefinition entity)
- Use the template from `template-library-transformer.json`
- **Key field**: `transformerImplementationType: "libraryImplementation"`

### Step 5: Implement Handler Function 💻
Add TypeScript implementation to `packages/miroir-core/src/2_domain/TransformersForRuntime.ts`:

1. **Create handler function**: `handleTransformer_<name>`
2. **Register in `inMemoryTransformerImplementations`** object (add mapping)
3. **Register in `applicationTransformerDefinitions`** object (add entry)

**Handler Function Pattern**:
```ts
export const handleTransformer_<name> = (
  step: Step,
  transformerPath: string[],
  label: string | undefined,
  transformer: TransformerForBuildPlusRuntime_<name>,
  miroirEnvironment: MiroirModelEnvironment,
  transformerParams: Record<string, any>,
  runtimeContext: Record<string, any>,
  resolveBuildTransformersTo?: ResolveBuildTransformersTo
): TransformerReturnType<any> => {
  // Implementation here
  return { transformerType: "success", value: result };
};
```

### Step 6: Export and Register Transformer 📦
In `packages/miroir-core/src/2_domain/Transformers.ts`:
1. **Import** the JSON definition
2. **Export** the constant: `export const transformer_<name> = ...`
3. **Add to `miroirCoreTransformers` array**

### Step 7: Register Schema Types (CRITICAL!) 🔑
**This step is often forgotten but mandatory for devBuild to work!**

#### Part A: In `getMiroirFundamentalJzodSchema.ts`
File: `packages/miroir-core/src/0_interfaces/1_core/bootstrapJzodSchemas/getMiroirFundamentalJzodSchema.ts`

1. Add `transformerForBuild_<name>` entry in `miroirTransformersForBuild` section
2. Add `transformerForBuildPlusRuntime_<name>` entry in `miroirTransformersForBuildPlusRuntime` section
3. Add `"transformerForBuild_<name>"` string to `domainActionDependencySet` array

#### Part B: In `generate-ts-types.ts`
File: `packages/miroir-core/scripts/generate-ts-types.ts`

1. Add `transformerForBuild_<name>` entry in `headerForZodImports` definition
2. Add `transformerForBuild_<name>` entry in `transformerForBuild` definition
3. Add `transformerForBuildPlusRuntime_<name>` entry in `TransformerForBuildPlusRuntime` definition
4. Add `transformerForBuildPlusRuntime_<name>` entry in `transformerForBuildPlusRuntime` definition

### Step 8: Run devBuild and Tests ✅
Generate types and verify everything works:
```bash
npm run devBuild -w miroir-core && RUN_TEST=transformers.unit.test npm run testByFile -w miroir-core -- 'transformers.unit' && RUN_TEST=transformers.integ.test npm run testByFile -w miroir-core -- 'transformers.integ'
```

### Step 9: Create or Update Documentation 📚
Documentation is in folder `docs-OLD/transformers`

---

## Files Modified (Summary)

| File | Purpose | What to Add |
|------|---------|-------------|
| `miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/<uuid>.json` | TransformerDefinition | New JSON file with `transformerImplementationType: "libraryImplementation"` |
| `2_domain/TransformersForRuntime.ts` | Implementation | Handler function + registrations in 2 objects |
| `2_domain/Transformers.ts` | Export/Registration | Import JSON, export constant, add to array |
| `0_interfaces/1_core/bootstrapJzodSchemas/getMiroirFundamentalJzodSchema.ts` | Schema registration | 2 transformer entries + 1 dependency entry |
| `scripts/generate-ts-types.ts` | Pre-generated types | 4 transformer entries |
| `miroir_data/681be9ca-c593-45f5-b45a-5f1d4969e91e/a5b4be38-78e3-4f31-9e9b-8ab0b71d4993.json` | Test cases | New test case objects |

---

## TransformerDefinition Structure

```json
{
  "uuid": "<generate-new-uuid>",
  "name": "<transformerName>",
  "defaultLabel": "<transformerName>",
  "description": "Description of what the transformer does",
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
        "definition": "<transformerName>"
      },
      "transformerDefinition": {
        "type": "object",
        "definition": {
          // Define parameters here using Jzod schema
          "paramName": {
            "type": "string"
          }
        }
      }
    },
    "transformerResultSchema": {
      "returns": "mlSchema",
      "definition": {
        // Define return type using Jzod schema
        "type": "string"
      }
    }
  },
  "transformerImplementation": {
    "transformerImplementationType": "libraryImplementation",
    "inMemoryImplementationFunctionName": "handleTransformer_<name>",
    "sqlImplementationFunctionName": "sqlStringFor<Name>Transformer"
  }
}
```

**Note**: The `sqlImplementationFunctionName` is optional and only needed if you want database execution support.

---

## Test Case Structure

```json
{
  "transformerTestType": "transformerTest",
  "transformerTestLabel": "descriptive test name for what this verifies",
  "transformerName": "<transformerName>",
  "runTestStep": "runtime",
  "transformer": {
    "transformerType": "<transformerName>",
    "interpolation": "runtime",
    // Add transformer parameters here
  },
  "transformerParams": {
    // Optional parameters passed to transformer
  },
  "transformerRuntimeContext": {
    // Optional runtime context data
  },
  "expectedValue": {
    // Expected result value
  }
}
```

---

## Common Patterns

### Accessing Parameters
```ts
const { paramName } = transformer.transformerDefinition;
```

### Resolving Inner Transformers
```ts
const resolvedValue = transformer_InnerReference_resolve(
  step,
  [...transformerPath, "innerTransformer"],
  transformer.transformerDefinition.innerTransformer,
  resolveBuildTransformersTo,
  miroirEnvironment,
  transformerParams,
  runtimeContext
);

if (resolvedValue.transformerType === "failure") {
  return resolvedValue;
}
```

### Returning Success
```ts
return { transformerType: "success", value: result };
```

### Returning Failure
```ts
return {
  transformerType: "failure",
  error: {
    errorType: "FailedToResolveTransformer",
    errorMessage: `${transformerPath.join(".")}: description of error`,
  },
};
```

---

## Debugging

### Run Specific Tests Only
Modify the filter in `transformers.unit.test.ts`:
```ts
await runUnitTransformerTests._runTransformerTestSuite(
  vitest,
  [],
  transformerTestSuite_miroirTransformers,
  {
    testList: {
      miroirCoreTransformers: {
        runtimeTransformerTests: {
          "<transformerName>": [
            "specific test case name"
          ]
        }
      }
    }
  },
  // ... rest of parameters
);
```

### Enable Debug Logging
```bash
VITE_MIROIR_LOG_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/specificLoggersConfig_DomainController_debug RUN_TEST=transformers.unit.test npm run testByFile -w miroir-core -- 'transformers.unit'
```

---

## See Also

- [examples.md](examples.md) - Complete examples with code
- [template-library-transformer.json](template-library-transformer.json) - Starter template
- [template-test-case.json](template-test-case.json) - Test case template
- `edit-composite-transformers` skill - For transformers without TypeScript code
