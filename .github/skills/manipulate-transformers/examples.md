# Transformer Examples

## Example 1: Simple Library-Implemented Transformer (returnValue)

This is the simplest transformer - it just returns a constant value.

### Definition (`2b4c25e0-6b0f-4f7d-aa68-1fdc079aead3.json`):

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

### Test Case:

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

## Example 2: Conditional Transformer (ifThenElse)

A transformer with multiple operators using enum transformerType.

### Definition (`4ded1479-1331-4f96-8723-9a797ba3924b.json`):

```json
{
  "uuid": "4ded1479-1331-4f96-8723-9a797ba3924b",
  "name": "ifThenElse",
  "defaultLabel": "ifThenElse",
  "description": "Returns different transformer results based on comparing values using operators (==, !=, <, <=, >, >=).",
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

### Test Cases:

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
      "transformerTestLabel": "ifThenElse equality false - basic string comparison",
      "transformerName": "ifThenElse_eq_false",
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
        "testValue": "different"
      },
      "expectedValue": "no"
    }
  ]
}
```

---

## Example 3: Composite Transformer (spreadSheetToJzodSchema)

A transformer composed entirely of other transformers - no TypeScript implementation needed.

### Definition (`e44300e8-ed02-40fb-a9ee-d83d08cb1f25.json`):

```json
{
  "uuid": "e44300e8-ed02-40fb-a9ee-d83d08cb1f25",
  "name": "spreadSheetToJzodSchema",
  "defaultLabel": "spreadSheetToJzodSchema",
  "description": "Transform the contents of a spreadsheet into a ML schema",
  "parentUuid": "a557419d-a288-4fb8-8a1e-971c86c113b8",
  "parentDefinitionVersionUuid": "54a16d69-c1f0-4dd7-aba4-a2cda883586c",
  "parentName": "TransformerDefinition",
  "classification": "spreadsheet",
  "transformerInterface": {
    "transformerParameterSchema": {
      "transformerType": {
        "type": "literal",
        "definition": "spreadSheetToJzodSchema"
      },
      "transformerDefinition": {
        "type": "object",
        "definition": {
          "spreadsheetContents": {
            "type": "union",
            "definition": [
              {
                "type": "schemaReference",
                "definition": {
                  "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  "relativePath": "transformerForBuild"
                }
              },
              {
                "type": "array",
                "definition": {
                  "type": "record",
                  "definition": {
                    "type": "any"
                  }
                }
              }
            ]
          }
        }
      }
    },
    "transformerResultSchema": {
      "returns": "mlSchema",
      "definition": {
        "type": "schemaReference",
        "definition": {
          "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          "relativePath": "jzodElement"
        }
      }
    }
  },
  "transformerImplementation": {
    "transformerImplementationType": "transformer",
    "definition": {
      "transformerType": "dataflowObject",
      "interpolation": "runtime",
      "target": "schema",
      "definition": {
        "firstLine": {
          "transformerType": "pickFromList",
          "interpolation": "runtime",
          "applyTo": {
            "transformerType": "getFromContext",
            "interpolation": "runtime",
            "referenceName": "spreadsheetContents"
          },
          "index": 0
        },
        "attributeNames": {
          "transformerType": "getObjectValues",
          "interpolation": "runtime",
          "applyTo": {
            "transformerType": "getFromContext",
            "interpolation": "runtime",
            "referencePath": ["firstLine"]
          }
        },
        "splitAttributeDefinitions": {
          "transformerType": "mapList",
          "interpolation": "runtime",
          "applyTo": {
            "transformerType": "getFromContext",
            "interpolation": "runtime",
            "referencePath": ["attributeNames"]
          },
          "referenceToOuterObject": "attributeName",
          "elementTransformer": {
            "transformerType": "createObjectFromPairs",
            "interpolation": "runtime",
            "applyTo": {
              "transformerType": "getFromContext",
              "interpolation": "runtime",
              "referencePath": ["attributeName"]
            },
            "referenceToOuterObject": "attributeName",
            "definition": [
              {
                "attributeKey": {
                  "transformerType": "getFromContext",
                  "interpolation": "runtime",
                  "referencePath": ["attributeName"]
                },
                "attributeValue": {
                  "transformerType": "returnValue",
                  "value": { "type": "string", "optional": true }
                }
              }
            ]
          }
        },
        "mergedAttributeDefinitions": {
          "transformerType": "listReducerToSpreadObject",
          "interpolation": "runtime",
          "applyTo": {
            "transformerType": "getFromContext",
            "interpolation": "runtime",
            "referencePath": ["splitAttributeDefinitions"]
          }
        },
        "schema": {
          "transformerType": "createObject",
          "interpolation": "runtime",
          "definition": {
            "type": {
              "transformerType": "returnValue",
              "value": "object"
            },
            "definition": {
              "transformerType": "getFromContext",
              "interpolation": "runtime",
              "referencePath": ["mergedAttributeDefinitions"]
            }
          }
        }
      }
    }
  }
}
```

---

## Example 4: mapList Transformer

Shows how to transform each element of a list.

### Test Case:

```json
{
  "transformerTestType": "transformerTest",
  "transformerTestLabel": "mapList transforms each element with createObject",
  "transformerName": "mapList_basic",
  "runTestStep": "runtime",
  "transformer": {
    "transformerType": "mapList",
    "interpolation": "runtime",
    "applyTo": {
      "transformerType": "getFromContext",
      "interpolation": "runtime",
      "referenceName": "names"
    },
    "referenceToOuterObject": "name",
    "elementTransformer": {
      "transformerType": "createObject",
      "interpolation": "runtime",
      "definition": {
        "label": {
          "transformerType": "getFromContext",
          "interpolation": "runtime",
          "referencePath": ["name"]
        },
        "type": {
          "transformerType": "returnValue",
          "value": "person"
        }
      }
    }
  },
  "transformerParams": {},
  "transformerRuntimeContext": {
    "names": ["Alice", "Bob", "Charlie"]
  },
  "expectedValue": [
    { "label": "Alice", "type": "person" },
    { "label": "Bob", "type": "person" },
    { "label": "Charlie", "type": "person" }
  ]
}
```

---

## Example 5: dataflowObject for Sequential Transformations

The dataflowObject allows each entry to reference previous entries.

### Test Case:

```json
{
  "transformerTestType": "transformerTest",
  "transformerTestLabel": "dataflowObject sequential processing",
  "transformerName": "dataflowObject_sequential",
  "runTestStep": "runtime",
  "transformer": {
    "transformerType": "dataflowObject",
    "interpolation": "runtime",
    "target": "final",
    "definition": {
      "step1": {
        "transformerType": "returnValue",
        "value": 10
      },
      "step2": {
        "transformerType": "getFromContext",
        "interpolation": "runtime",
        "referencePath": ["step1"]
      },
      "final": {
        "transformerType": "createObject",
        "interpolation": "runtime",
        "definition": {
          "value": {
            "transformerType": "getFromContext",
            "interpolation": "runtime",
            "referencePath": ["step2"]
          },
          "doubled": {
            "transformerType": "returnValue",
            "value": 20
          }
        }
      }
    }
  },
  "transformerParams": {},
  "expectedValue": {
    "value": 10,
    "doubled": 20
  }
}
```

---

## Example 6: Creating a New Library Transformer (Step by Step)

### Goal: Create a transformer called `stringConcat` that concatenates strings.

### Step 1: Write the test first

Add to test suite JSON:

```json
{
  "transformerTestType": "transformerTest",
  "transformerTestLabel": "stringConcat concatenates two strings",
  "transformerName": "stringConcat",
  "runTestStep": "runtime",
  "transformer": {
    "transformerType": "stringConcat",
    "interpolation": "runtime",
    "left": {
      "transformerType": "returnValue",
      "value": "Hello, "
    },
    "right": {
      "transformerType": "returnValue",
      "value": "World!"
    }
  },
  "transformerParams": {},
  "expectedValue": "Hello, World!"
}
```

### Step 2: Run tests (expect failure)

```bash
RUN_TEST=transformers.unit.test npm run testByFile -w miroir-core -- 'transformers.unit'
```

### Step 3: Create TransformerDefinition JSON

Create file `packages/miroir-core/src/assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/<new-uuid>.json`:

```json
{
  "uuid": "<new-uuid>",
  "name": "stringConcat",
  "defaultLabel": "stringConcat",
  "description": "Concatenates two string values",
  "parentUuid": "a557419d-a288-4fb8-8a1e-971c86c113b8",
  "parentDefinitionVersionUuid": "54a16d69-c1f0-4dd7-aba4-a2cda883586c",
  "parentName": "TransformerDefinition",
  "classification": "basic",
  "transformerInterface": {
    "inputOutput": {
      "input": "string",
      "output": "string"
    },
    "transformerParameterSchema": {
      "transformerType": {
        "type": "literal",
        "definition": "stringConcat"
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
          }
        }
      }
    },
    "transformerResultSchema": {
      "returns": "mlSchema",
      "definition": {
        "type": "string"
      }
    }
  },
  "transformerImplementation": {
    "transformerImplementationType": "libraryImplementation",
    "inMemoryImplementationFunctionName": "handleTransformer_stringConcat"
  }
}
```

### Step 4: Implement the handler function

In `TransformersForRuntime.ts`:

```typescript
export const handleTransformer_stringConcat = (
  step: Step,
  transformerPath: string[],
  label: string | undefined,
  transformer: TransformerForBuildPlusRuntime_stringConcat,
  miroirEnvironment: MiroirModelEnvironment,
  transformerParams: Record<string, any>,
  runtimeContext: Record<string, any>,
  resolveBuildTransformersTo?: ResolveBuildTransformersTo
): TransformerReturnType<string> => {
  const left = transformer_extended_apply_wrapper(
    undefined,
    step,
    [...transformerPath, "left"],
    undefined,
    transformer.left,
    miroirEnvironment,
    transformerParams,
    runtimeContext,
    resolveBuildTransformersTo
  );
  
  const right = transformer_extended_apply_wrapper(
    undefined,
    step,
    [...transformerPath, "right"],
    undefined,
    transformer.right,
    miroirEnvironment,
    transformerParams,
    runtimeContext,
    resolveBuildTransformersTo
  );
  
  if (left instanceof TransformerFailure) return left;
  if (right instanceof TransformerFailure) return right;
  
  return String(left) + String(right);
};
```

### Step 5: Export in Transformers.ts

```typescript
import transformer_stringConcat_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/<uuid>.json';

export const transformer_stringConcat: TransformerDefinition = transformer_stringConcat_json as TransformerDefinition;

// Add to miroirCoreTransformers:
export const miroirCoreTransformers: Record<string,TransformerDefinition> = {
  // ... existing transformers
  transformer_stringConcat,
};
```

### Step 6: Run tests (expect success)

```bash
RUN_TEST=transformers.unit.test npm run testByFile -w miroir-core -- 'transformers.unit'
```

### Step 7: Rebuild types

```bash
npm run devBuild -w miroir-core
```

---

## Key Patterns

### 1. Using `getFromContext` for chaining

```json
{
  "transformerType": "getFromContext",
  "interpolation": "runtime",
  "referenceName": "singleValue"
}
```

Or for paths:

```json
{
  "transformerType": "getFromContext",
  "interpolation": "runtime",
  "referencePath": ["object", "nested", "value"]
}
```

### 2. Using `applyTo` for transformer input

Many transformers accept `applyTo` to specify their input:

```json
{
  "transformerType": "mapList",
  "applyTo": { "transformerType": "getFromContext", "referenceName": "myList" },
  "elementTransformer": { ... }
}
```

### 3. Composing with dataflowObject

Use `dataflowObject` to create a sequence of named transformations where each can reference previous results:

```json
{
  "transformerType": "dataflowObject",
  "target": "finalResult",
  "definition": {
    "intermediate1": { ... },
    "intermediate2": { ... uses intermediate1 ... },
    "finalResult": { ... uses intermediate2 ... }
  }
}
```

### 4. Using `referenceToOuterObject` in mapList

When using mapList, the current element is available via the name you specify:

```json
{
  "transformerType": "mapList",
  "referenceToOuterObject": "item",
  "elementTransformer": {
    "transformerType": "getFromContext",
    "referencePath": ["item", "fieldName"]
  }
}
```
