---
name: manipulate-transformers
description: Create or update Miroir Transformers in a TDD style. Use when working with transformerType, TransformerDefinition, library-implemented or composite transformers, or running transformer tests.
allowed-tools: Read, Grep, Glob, Bash(npm *), Edit, Create
---

# Miroir Transformer Manipulation (TDD Style)

This skill guides the creation and modification of Miroir Transformers following Test-Driven Development practices.

## CRITICAL: Pre-flight Check

**BEFORE starting any transformer work, verify current test state to avoid investigating unrelated issues:**

```bash
# Run unit tests first (in-memory execution)
RUN_TEST=transformers.unit.test npm run testByFile -w miroir-core -- 'transformers.unit'

# Then run integration tests (database execution - requires PostgreSQL)
RUN_TEST=transformers.integ.test npm run testByFile -w miroir-core -- 'transformers.integ'
```

If tests are failing, inform the user of the baseline state before proceeding.

---

## Transformer Types Overview

There are **two implementation types** for transformers:

### 1. Library-Implemented Transformers
- Defined with `transformerImplementationType: "libraryImplementation"`
- Require TypeScript implementation functions
- Have both in-memory and optional SQL implementations
- Examples: `ifThenElse`, `mapList`, `createObject`, `dataflowObject`

### 2. Composite Transformers
- Defined with `transformerImplementationType: "transformer"`
- Composed of other transformers (no TypeScript code needed)
- The `definition` field contains the transformer composition
- Example: `spreadSheetToJzodSchema`

---

## TDD Workflow

### Step 1: Verify Current Test State
Always run tests first to establish baseline.

### Step 2: Write the Test First
Add test case(s) to the appropriate test suite file:
- File: `packages/miroir-core/src/assets/miroir_data/681be9ca-c593-45f5-b45a-5f1d4969e91e/a5b4be38-78e3-4f31-9e9b-8ab0b71d4993.json`
- This is the `miroirCoreTransformers` test suite

### Step 3: Run the Test (Expect Failure)
```bash
RUN_TEST=transformers.unit.test npm run testByFile -w miroir-core -- 'transformers.unit'
```

### Step 4: Implement the Transformer
Create/modify the transformer definition and implementation.

### Step 5: Run Tests Again (Expect Success)
```bash
RUN_TEST=transformers.unit.test npm run testByFile -w miroir-core -- 'transformers.unit'
RUN_TEST=transformers.integ.test npm run testByFile -w miroir-core -- 'transformers.integ'
```

### Step 6: Rebuild if Needed
If modifying core schemas:
```bash
npm run devBuild -w miroir-core
```

---

## Creating a Library-Implemented Transformer

### Files to Create/Modify:

1. **TransformerDefinition JSON** (data layer)
   - Location: `packages/miroir-core/src/assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/<uuid>.json`
   - Parent UUID: `a557419d-a288-4fb8-8a1e-971c86c113b8` (TransformerDefinition entity)

2. **Implementation Function** (domain layer)
   - Location: `packages/miroir-core/src/2_domain/TransformersForRuntime.ts`
   - Add handler function: `handleTransformer_<name>`

3. **Export and Registration**
   - Location: `packages/miroir-core/src/2_domain/Transformers.ts`
   - Import the JSON and export the constant
   - Add to `miroirCoreTransformers` or appropriate transformer group

4. **Test Cases**
   - Location: `packages/miroir-core/src/assets/miroir_data/681be9ca-c593-45f5-b45a-5f1d4969e91e/a5b4be38-78e3-4f31-9e9b-8ab0b71d4993.json`

### TransformerDefinition Structure (Library):

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
        }
      }
    },
    "transformerResultSchema": {
      "returns": "mlSchema",
      "definition": {
        // Define return type using Jzod schema
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

### Implementation Function Pattern:

```typescript
// In TransformersForRuntime.ts
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
};
```

---

## Creating a Composite Transformer

### Files to Create/Modify:

1. **TransformerDefinition JSON** only
   - Location: `packages/miroir-core/src/assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/<uuid>.json`

2. **Export and Registration**
   - Location: `packages/miroir-core/src/2_domain/Transformers.ts`

3. **Test Cases**
   - Location: `packages/miroir-core/src/assets/miroir_data/681be9ca-c593-45f5-b45a-5f1d4969e91e/a5b4be38-78e3-4f31-9e9b-8ab0b71d4993.json`

### TransformerDefinition Structure (Composite):

```json
{
  "uuid": "<generate-new-uuid>",
  "name": "<transformerName>",
  "defaultLabel": "<transformerName>",
  "description": "Description of what the transformer does",
  "parentUuid": "a557419d-a288-4fb8-8a1e-971c86c113b8",
  "parentDefinitionVersionUuid": "54a16d69-c1f0-4dd7-aba4-a2cda883586c",
  "parentName": "TransformerDefinition",
  "classification": "composite",
  "transformerInterface": {
    "transformerParameterSchema": {
      "transformerType": {
        "type": "literal",
        "definition": "<transformerName>"
      },
      "transformerDefinition": {
        "type": "object",
        "definition": {
          // Define parameters here
        }
      }
    },
    "transformerResultSchema": {
      "returns": "mlSchema",
      "definition": {
        // Define return type
      }
    }
  },
  "transformerImplementation": {
    "transformerImplementationType": "transformer",
    "definition": {
      // Compose using existing transformers
      "transformerType": "dataflowObject",
      "interpolation": "runtime",
      "definition": {
        // Composition of transformers
      }
    }
  }
}
```

---

## Test Case Structure

```json
{
  "transformerTestType": "transformerTest",
  "transformerTestLabel": "descriptive test name",
  "transformerName": "<transformerName>",
  "runTestStep": "runtime",
  "transformer": {
    "transformerType": "<transformerName>",
    "interpolation": "runtime",
    // transformer parameters
  },
  "transformerParams": {},
  "transformerRuntimeContext": {
    // context data for the test
  },
  "expectedValue": {
    // expected output
  },
  "unitTestExpectedValue": {
    // optional: different expected value for unit tests
  },
  "integrationTestExpectedValue": {
    // optional: different expected value for integration tests
  },
  "skip": false
}
```

### Test Suite Structure

```json
{
  "transformerTestType": "transformerTestSuite",
  "transformerTestLabel": "suiteName",
  "transformerTests": [
    // array of tests or nested suites
  ]
}
```

---

## Common Transformers Reference

### Data Access
- `getFromContext` - Get value from runtime context
- `getFromParameters` - Get value from build parameters
- `accessDynamicPath` - Dynamic path access on objects

### Object Creation
- `createObject` - Create object with literal keys
- `createObjectFromPairs` - Create object from key-value pairs
- `mergeIntoObject` - Merge new fields into existing object

### List Operations
- `mapList` - Transform each element in a list
- `pickFromList` - Pick element at index
- `indexListBy` - Index list by a field
- `listReducerToSpreadObject` - Reduce list to spread object
- `getUniqueValues` - Get unique values from list

### Control Flow
- `ifThenElse` (operators: ==, !=, <, <=, >, >=) - Conditional logic
- `dataflowObject` - Sequential/dataflow transformer composition
- `returnValue` - Return a constant value

### String/Data
- `mustacheStringTemplate` - Mustache template interpolation
- `generateUuid` - Generate a new UUID
- `getObjectEntries` - Get object entries as array
- `getObjectValues` - Get object values as array

---

## Key Files Reference

| Purpose | Path |
|---------|------|
| TransformerDefinition entity | `packages/miroir-core/src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/54a16d69-c1f0-4dd7-aba4-a2cda883586c.json` |
| Transformer definitions (data) | `packages/miroir-core/src/assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/*.json` |
| Transformer exports | `packages/miroir-core/src/2_domain/Transformers.ts` |
| Transformer implementations | `packages/miroir-core/src/2_domain/TransformersForRuntime.ts` |
| Transformer tools | `packages/miroir-core/src/2_domain/Transformer_tools.ts` |
| Test suite (unit) | `packages/miroir-core/tests/2_domain/transformers.unit.test.ts` |
| Test suite (integ) | `packages/miroir-core/tests/4_services/transformers.integ.test.ts` |
| Test data | `packages/miroir-core/src/assets/miroir_data/681be9ca-c593-45f5-b45a-5f1d4969e91e/a5b4be38-78e3-4f31-9e9b-8ab0b71d4993.json` |
| Generated types | `packages/miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.ts` |

---

## Interpolation Modes

Transformers support two interpolation modes:

- **`build`**: Resolved at build time (template expansion)
- **`runtime`**: Resolved at runtime (actual execution)

Most transformers use `interpolation: "runtime"` for actual data transformation.

---

## SQL Support

For library-implemented transformers that need SQL support:

1. Add `runnableAsSql: true` to the transformer definition
2. Implement `sqlImplementationFunctionName` function
3. SQL functions are in `TransformersForRuntime.ts`

---

## Checklist

Before submitting:

- [ ] Pre-flight tests passed (baseline established)
- [ ] Test case(s) written first (TDD)
- [ ] TransformerDefinition JSON created with valid UUID
- [ ] Implementation added (if library-implemented)
- [ ] Transformer exported in `Transformers.ts`
- [ ] Transformer registered in appropriate group
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] `devBuild` run if schema modified

---

## Additional Resources

- [mapperListToList.md](file://packages/miroir-core/docs-OLD/transformers/mapperListToList.md) for mapList examples
- See existing transformer definitions for patterns
- See `spreadSheetToJzodSchema` for a complex composite transformer example
