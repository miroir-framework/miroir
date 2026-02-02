---
name: edit-composite-transformers
description: Create or update Composite Miroir Transformers (those composed of other transformers, no TypeScript code). Use when creating transformers with transformerImplementationType transformer, or when composing existing transformers into new domain-specific transformations.
allowed-tools: Read, Grep, Glob, Bash(npm *), Edit, Create
---

# Composite Transformer Manipulation (TDD Style)

This skill guides the creation and modification of **Composite** Miroir Transformers - those that are composed entirely of other transformers without requiring TypeScript code.

**Use this skill for**: Transformers with `transformerImplementationType: "transformer"`  
**Examples**: `spreadSheetToJzodSchema`, domain-specific transformations

**For library transformers** (with TypeScript handler functions), use the `edit-library-transformers` skill instead.

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

## What is a Composite Transformer?

A composite transformer is a transformer built entirely by **composing other transformers** - either library-implemented transformers or other composite transformers.

**Key Characteristics:**
- ✅ No TypeScript code required
- ✅ Pure JSON definition
- ✅ Uses `transformerImplementationType: "transformer"`
- ✅ The `definition` field contains the transformer composition
- ✅ Great for domain-specific, reusable transformations
- ✅ No devBuild needed (no schema registration required)

**Common Use Cases:**
- Domain-specific data transformations
- Reusable business logic combinations
- Multi-step data processing pipelines
- Format conversions (e.g., spreadsheet to schema)

---

## Complete TDD Workflow (5 Steps)

Much simpler than library transformers - only JSON changes!

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
- Use the template from `template-composite-transformer.json`
- **Key field**: `transformerImplementationType: "transformer"`
- **Most important**: The `definition` field contains your transformer composition

### Step 5: Export and Register Transformer 📦
In `packages/miroir-core/src/2_domain/Transformers.ts`:
1. **Import** the JSON definition
2. **Export** the constant: `export const transformer_<name> = ...`
3. **Add to `miroirCoreTransformers` array**

### Step 6: Run Tests (Expect Success) ✅
Verify everything works:
```bash
RUN_TEST=transformers.unit.test npm run testByFile -w miroir-core -- 'transformers.unit'
RUN_TEST=transformers.integ.test npm run testByFile -w miroir-core -- 'transformers.integ'
```

**Note**: No devBuild needed! Composite transformers don't require type generation.

### Step 7: Create or Update Documentation 📚
Documentation is in folder `docs-OLD/transformers`

---

## Files Modified (Summary)

| File | Purpose | What to Add |
|------|---------|-------------|
| `miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/<uuid>.json` | TransformerDefinition | New JSON file with `transformerImplementationType: "transformer"` |
| `2_domain/Transformers.ts` | Export/Registration | Import JSON, export constant, add to array |
| `miroir_data/681be9ca-c593-45f5-b45a-5f1d4969e91e/a5b4be38-78e3-4f31-9e9b-8ab0b71d4993.json` | Test cases | New test case objects |

**That's it!** Only 3 files to modify - no TypeScript code, no schema registration, no devBuild!

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
          "inputParam": {
            "type": "any"
          }
        }
      }
    },
    "transformerResultSchema": {
      "returns": "mlSchema",
      "definition": {
        "type": "object"
      }
    }
  },
  "transformerImplementation": {
    "transformerImplementationType": "transformer",
    "definition": {
      "transformerType": "dataflowObject",
      "interpolation": "runtime",
      "target": "result",
      "definition": {
        "step1": {
          "transformerType": "getFromContext",
          "interpolation": "runtime",
          "referenceName": "inputParam"
        },
        "step2": {
          "transformerType": "mapList",
          "interpolation": "runtime",
          "applyTo": {
            "transformerType": "getFromContext",
            "interpolation": "runtime",
            "referenceName": "step1"
          },
          "mapper": {
            "transformerType": "returnValue",
            "value": "..."
          }
        },
        "result": {
          "transformerType": "getFromContext",
          "interpolation": "runtime",
          "referenceName": "step2"
        }
      }
    }
  }
}
```

---

## Building Blocks for Composite Transformers

### dataflowObject - Sequential Processing
The most common pattern for composite transformers. Processes data in steps, where each step can reference previous steps.

```json
{
  "transformerType": "dataflowObject",
  "interpolation": "runtime",
  "target": "finalResult",
  "definition": {
    "step1": {
      "transformerType": "getFromContext",
      "interpolation": "runtime",
      "referenceName": "inputData"
    },
    "step2": {
      "transformerType": "mapList",
      "interpolation": "runtime",
      "applyTo": {
        "transformerType": "getFromContext",
        "interpolation": "runtime",
        "referenceName": "step1"
      },
      "mapper": { /* transformer to apply */ }
    },
    "finalResult": {
      "transformerType": "getFromContext",
      "interpolation": "runtime",
      "referenceName": "step2"
    }
  }
}
```

### getFromContext - Access Variables
Access parameters or intermediate results.

```json
{
  "transformerType": "getFromContext",
  "interpolation": "runtime",
  "referenceName": "variableName"
}
```

### mapList - Transform Each Item
Apply a transformer to each item in a list.

```json
{
  "transformerType": "mapList",
  "interpolation": "runtime",
  "applyTo": {
    "transformerType": "getFromContext",
    "interpolation": "runtime",
    "referenceName": "myList"
  },
  "mapper": {
    "transformerType": "createObject",
    "interpolation": "runtime",
    "definition": {
      "newField": {
        "transformerType": "accessDynamicPath",
        "interpolation": "runtime",
        "path": ["oldField"]
      }
    }
  }
}
```

### createObject - Build Objects
Create new objects from transformers.

```json
{
  "transformerType": "createObject",
  "interpolation": "runtime",
  "definition": {
    "field1": {
      "transformerType": "returnValue",
      "value": "constant"
    },
    "field2": {
      "transformerType": "getFromContext",
      "interpolation": "runtime",
      "referenceName": "dynamicValue"
    }
  }
}
```

### ifThenElse - Conditional Logic
Choose between transformers based on conditions.

```json
{
  "transformerType": "==",
  "interpolation": "runtime",
  "left": {
    "transformerType": "getFromContext",
    "interpolation": "runtime",
    "referenceName": "status"
  },
  "right": {
    "transformerType": "returnValue",
    "value": "active"
  },
  "then": { /* transformer if true */ },
  "else": { /* transformer if false */ }
}
```

### accessDynamicPath - Object Navigation
Access nested object properties.

```json
{
  "transformerType": "accessDynamicPath",
  "interpolation": "runtime",
  "path": ["nested", "field", "value"]
}
```

---

## Common Patterns

### Pattern 1: Filter and Transform List
```json
{
  "transformerType": "dataflowObject",
  "interpolation": "runtime",
  "target": "result",
  "definition": {
    "rawList": {
      "transformerType": "getFromContext",
      "interpolation": "runtime",
      "referenceName": "inputList"
    },
    "filtered": {
      "transformerType": "pickFromList",
      "interpolation": "runtime",
      "applyTo": {
        "transformerType": "getFromContext",
        "interpolation": "runtime",
        "referenceName": "rawList"
      },
      "condition": {
        "transformerType": "==",
        "interpolation": "runtime",
        "left": {
          "transformerType": "accessDynamicPath",
          "interpolation": "runtime",
          "path": ["status"]
        },
        "right": {
          "transformerType": "returnValue",
          "value": "active"
        }
      }
    },
    "result": {
      "transformerType": "mapList",
      "interpolation": "runtime",
      "applyTo": {
        "transformerType": "getFromContext",
        "interpolation": "runtime",
        "referenceName": "filtered"
      },
      "mapper": {
        "transformerType": "createObject",
        "interpolation": "runtime",
        "definition": {
          "id": {
            "transformerType": "accessDynamicPath",
            "interpolation": "runtime",
            "path": ["id"]
          },
          "name": {
            "transformerType": "accessDynamicPath",
            "interpolation": "runtime",
            "path": ["name"]
          }
        }
      }
    }
  }
}
```

### Pattern 2: Aggregate Data
```json
{
  "transformerType": "dataflowObject",
  "interpolation": "runtime",
  "target": "summary",
  "definition": {
    "items": {
      "transformerType": "getFromContext",
      "interpolation": "runtime",
      "referenceName": "inputItems"
    },
    "count": {
      "transformerType": "aggregate",
      "interpolation": "runtime",
      "operation": "count",
      "applyTo": {
        "transformerType": "getFromContext",
        "interpolation": "runtime",
        "referenceName": "items"
      }
    },
    "summary": {
      "transformerType": "createObject",
      "interpolation": "runtime",
      "definition": {
        "totalCount": {
          "transformerType": "getFromContext",
          "interpolation": "runtime",
          "referenceName": "count"
        },
        "items": {
          "transformerType": "getFromContext",
          "interpolation": "runtime",
          "referenceName": "items"
        }
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
  "transformerTestLabel": "descriptive test name for what this verifies",
  "transformerName": "<transformerName>",
  "runTestStep": "runtime",
  "transformer": {
    "transformerType": "<transformerName>",
    "interpolation": "runtime",
    "inputParam": "value"
  },
  "transformerParams": {},
  "transformerRuntimeContext": {
    "inputParam": { /* test data */ }
  },
  "expectedValue": { /* expected result */ }
}
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

## Advantages of Composite Transformers

✅ **No TypeScript Required** - Pure JSON declarative approach  
✅ **No Build Step** - No devBuild needed  
✅ **Simpler Workflow** - Only 3 files to modify  
✅ **Reusable** - Combine existing transformers in new ways  
✅ **Testable** - Same testing infrastructure as library transformers  
✅ **Maintainable** - Logic visible in JSON, no code to debug  

---

## When to Use Library vs Composite

**Use Library Transformer when:**
- Need imperative logic (loops, complex conditionals)
- Performance critical operations
- Need to interact with external systems
- Building fundamental, reusable primitives
- Want SQL execution support

**Use Composite Transformer when:**
- Can express logic as transformer composition
- Domain-specific transformations
- Combining existing transformers
- Rapid development without TypeScript
- No need for SQL execution

---

## See Also

- [examples.md](examples.md) - Complete examples
- [template-composite-transformer.json](template-composite-transformer.json) - Starter template
- [template-test-case.json](template-test-case.json) - Test case template
- `edit-library-transformers` skill - For transformers with TypeScript code
