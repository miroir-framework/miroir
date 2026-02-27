# Composite Transformer Examples

Complete examples showing real-world composite transformer implementations.

---

## Example 1: Simple Composite - Transform User Data

A transformer that filters active users and formats their data.

### TransformerDefinition JSON
**File**: `packages/miroir-core/src/assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/example-uuid-1.json`

```json
{
  "uuid": "example-uuid-1",
  "name": "formatActiveUsers",
  "defaultLabel": "formatActiveUsers",
  "description": "Filters active users and formats their display data",
  "parentUuid": "a557419d-a288-4fb8-8a1e-971c86c113b8",
  "parentDefinitionVersionUuid": "54a16d69-c1f0-4dd7-aba4-a2cda883586c",
  "parentName": "TransformerDefinition",
  "classification": "composite",
  "transformerInterface": {
    "transformerParameterSchema": {
      "transformerType": {
        "type": "literal",
        "definition": "formatActiveUsers"
      },
      "transformerDefinition": {
        "type": "object",
        "definition": {
          "users": {
            "type": "array",
            "definition": {
              "type": "record",
              "definition": {
                "type": "any"
              }
            }
          }
        }
      }
    },
    "transformerResultSchema": {
      "returns": "mlSchema",
      "definition": {
        "type": "array",
        "definition": {
          "type": "object"
        }
      }
    }
  },
  "transformerImplementation": {
    "transformerImplementationType": "transformer",
    "definition": {
      "transformerType": "dataflowObject",
      "interpolation": "runtime",
      "target": "formattedUsers",
      "definition": {
        "allUsers": {
          "transformerType": "getFromContext",
          "interpolation": "runtime",
          "referenceName": "users"
        },
        "activeUsers": {
          "transformerType": "pickFromList",
          "interpolation": "runtime",
          "applyTo": {
            "transformerType": "getFromContext",
            "interpolation": "runtime",
            "referenceName": "allUsers"
          },
          "condition": {
            "transformerType": "boolExpr",
            "interpolation": "runtime",
            "operator": "==",
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
        "formattedUsers": {
          "transformerType": "mapList",
          "interpolation": "runtime",
          "applyTo": {
            "transformerType": "getFromContext",
            "interpolation": "runtime",
            "referenceName": "activeUsers"
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
              "displayName": {
                "transformerType": "mustacheStringTemplate",
                "definition": "{{firstName}} {{lastName}}"
              },
              "email": {
                "transformerType": "accessDynamicPath",
                "interpolation": "runtime",
                "path": ["email"]
              }
            }
          }
        }
      }
    }
  }
}
```

### Export and Registration
**File**: `packages/miroir-core/src/2_domain/Transformers.ts`

```ts
// Import
import transformer_formatActiveUsers from "../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/example-uuid-1.json" with { type: "json" };

// Export
export const transformer_formatActiveUsers: TransformerDefinition = 
  transformer_formatActiveUsers_json.definition as TransformerDefinition;

// Add to array
export const miroirCoreTransformers: TransformerDefinition[] = [
  // ... other transformers
  transformer_formatActiveUsers,
];
```

### Test Cases
```json
{
  "transformerTestType": "transformerTest",
  "transformerTestLabel": "formatActiveUsers filters and formats user data",
  "transformerName": "formatActiveUsers",
  "runTestStep": "runtime",
  "transformer": {
    "transformerType": "formatActiveUsers",
    "interpolation": "runtime",
    "users": {
      "transformerType": "getFromContext",
      "interpolation": "runtime",
      "referenceName": "testUsers"
    }
  },
  "transformerParams": {},
  "transformerRuntimeContext": {
    "testUsers": [
      {
        "id": "1",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "status": "active"
      },
      {
        "id": "2",
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "jane@example.com",
        "status": "inactive"
      },
      {
        "id": "3",
        "firstName": "Bob",
        "lastName": "Wilson",
        "email": "bob@example.com",
        "status": "active"
      }
    ]
  },
  "expectedValue": [
    {
      "id": "1",
      "displayName": "John Doe",
      "email": "john@example.com"
    },
    {
      "id": "3",
      "displayName": "Bob Wilson",
      "email": "bob@example.com"
    }
  ]
}
```

---

## Example 2: Complex Composite - spreadSheetToJzodSchema

This real transformer from Miroir converts spreadsheet data into a Jzod schema.

### TransformerDefinition JSON
**File**: `packages/miroir-core/src/assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/e44300e8-ed02-40fb-a9ee-d83d08cb1f25.json`

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
            "type": "array",
            "definition": {
              "type": "record",
              "definition": {
                "type": "any"
              }
            }
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

### What This Does (Step-by-Step):

1. **firstLine**: Gets the first row (headers) from the spreadsheet
2. **attributeNames**: Extracts column names as an array
3. **splitAttributeDefinitions**: Maps each name to a Jzod field definition
4. **mergedAttributeDefinitions**: Merges all field definitions into one object
5. **schema**: Creates final Jzod schema with type "object"

### Test Case:

```json
{
  "transformerTestType": "transformerTest",
  "transformerTestLabel": "spreadSheetToJzodSchema converts spreadsheet to schema",
  "transformerName": "spreadSheetToJzodSchema",
  "runTestStep": "runtime",
  "transformer": {
    "transformerType": "spreadSheetToJzodSchema",
    "interpolation": "runtime",
    "spreadsheetContents": {
      "transformerType": "getFromContext",
      "interpolation": "runtime",
      "referenceName": "spreadsheet"
    }
  },
  "transformerParams": {},
  "transformerRuntimeContext": {
    "spreadsheet": [
      { "A": "name", "B": "age", "C": "email" },
      { "A": "John", "B": "30", "C": "john@example.com" },
      { "A": "Jane", "B": "25", "C": "jane@example.com" }
    ]
  },
  "expectedValue": {
    "type": "object",
    "definition": {
      "name": { "type": "string", "optional": true },
      "age": { "type": "string", "optional": true },
      "email": { "type": "string", "optional": true }
    }
  }
}
```

---

## Example 3: Aggregation - Count and Group

A transformer that counts items and groups them by category.

### TransformerDefinition JSON
```json
{
  "uuid": "example-uuid-3",
  "name": "aggregateByCategory",
  "defaultLabel": "aggregateByCategory",
  "description": "Counts and groups items by category",
  "parentUuid": "a557419d-a288-4fb8-8a1e-971c86c113b8",
  "parentDefinitionVersionUuid": "54a16d69-c1f0-4dd7-aba4-a2cda883586c",
  "parentName": "TransformerDefinition",
  "classification": "composite",
  "transformerInterface": {
    "transformerParameterSchema": {
      "transformerType": {
        "type": "literal",
        "definition": "aggregateByCategory"
      },
      "transformerDefinition": {
        "type": "object",
        "definition": {
          "items": {
            "type": "array",
            "definition": {
              "type": "record",
              "definition": { "type": "any" }
            }
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
        "inputItems": {
          "transformerType": "getFromContext",
          "interpolation": "runtime",
          "referenceName": "items"
        },
        "totalCount": {
          "transformerType": "aggregate",
          "interpolation": "runtime",
          "operation": "count",
          "applyTo": {
            "transformerType": "getFromContext",
            "interpolation": "runtime",
            "referenceName": "inputItems"
          }
        },
        "groupedByCategory": {
          "transformerType": "aggregate",
          "interpolation": "runtime",
          "operation": "groupBy",
          "applyTo": {
            "transformerType": "getFromContext",
            "interpolation": "runtime",
            "referenceName": "inputItems"
          },
          "groupBy": ["category"]
        },
        "categoryNames": {
          "transformerType": "getObjectEntries",
          "interpolation": "runtime",
          "applyTo": {
            "transformerType": "getFromContext",
            "interpolation": "runtime",
            "referenceName": "groupedByCategory"
          }
        },
        "categoryCounts": {
          "transformerType": "mapList",
          "interpolation": "runtime",
          "applyTo": {
            "transformerType": "getFromContext",
            "interpolation": "runtime",
            "referenceName": "categoryNames"
          },
          "mapper": {
            "transformerType": "createObject",
            "interpolation": "runtime",
            "definition": {
              "category": {
                "transformerType": "accessDynamicPath",
                "interpolation": "runtime",
                "path": [0]
              },
              "count": {
                "transformerType": "aggregate",
                "interpolation": "runtime",
                "operation": "count",
                "applyTo": {
                  "transformerType": "accessDynamicPath",
                  "interpolation": "runtime",
                  "path": [1]
                }
              }
            }
          }
        },
        "result": {
          "transformerType": "createObject",
          "interpolation": "runtime",
          "definition": {
            "total": {
              "transformerType": "getFromContext",
              "interpolation": "runtime",
              "referenceName": "totalCount"
            },
            "byCategory": {
              "transformerType": "getFromContext",
              "interpolation": "runtime",
              "referenceName": "categoryCounts"
            }
          }
        }
      }
    }
  }
}
```

### Test Case:
```json
{
  "transformerTestType": "transformerTest",
  "transformerTestLabel": "aggregateByCategory counts and groups items",
  "transformerName": "aggregateByCategory",
  "runTestStep": "runtime",
  "transformer": {
    "transformerType": "aggregateByCategory",
    "interpolation": "runtime",
    "items": {
      "transformerType": "getFromContext",
      "interpolation": "runtime",
      "referenceName": "testItems"
    }
  },
  "transformerParams": {},
  "transformerRuntimeContext": {
    "testItems": [
      { "id": 1, "name": "Item1", "category": "A" },
      { "id": 2, "name": "Item2", "category": "B" },
      { "id": 3, "name": "Item3", "category": "A" },
      { "id": 4, "name": "Item4", "category": "C" },
      { "id": 5, "name": "Item5", "category": "A" }
    ]
  },
  "expectedValue": {
    "total": 5,
    "byCategory": [
      { "category": "A", "count": 3 },
      { "category": "B", "count": 1 },
      { "category": "C", "count": 1 }
    ]
  }
}
```

---

## Common Composition Patterns

### Pattern 1: Sequential Pipeline
Process data through multiple transformations:
```json
{
  "step1": { /* get/filter data */ },
  "step2": { /* transform data using step1 */ },
  "step3": { /* further processing using step2 */ },
  "result": { /* final output using step3 */ }
}
```

### Pattern 2: Conditional Branch
Different processing based on conditions:
```json
{
  "inputData": { /* get data */ },
  "processedData": {
    "transformerType": "ifThenElse",
    "if": {
      "transformerType": "boolExpr",
      "operator": "==",
      "left": { /* check some condition */ },
      "right": { /* comparison value */ }
    },
    "then": { /* transformer for true case */ },
    "else": { /* transformer for false case */ }
  }
}
```

### Pattern 3: Map-Reduce
Transform and aggregate:
```json
{
  "rawList": { /* get list */ },
  "transformed": {
    "transformerType": "mapList",
    "applyTo": { /* reference to rawList */ },
    "mapper": { /* transformation for each item */ }
  },
  "aggregated": {
    "transformerType": "aggregate",
    "applyTo": { /* reference to transformed */ },
    "operation": "count" | "sum" | "groupBy"
  }
}
```

---

## Tips for Building Composite Transformers

1. **Start Simple**: Begin with basic transformers, test, then add complexity
2. **Name Steps Clearly**: Use descriptive names for dataflowObject steps
3. **Test Incrementally**: Test each step's output independently
4. **Reuse Existing**: Check available transformers before creating new ones
5. **Document Flow**: Comment the purpose of each step in description
6. **Handle Edge Cases**: Use ifThenElse for conditional logic
7. **Keep Target Clear**: Always specify the `target` field in dataflowObject

---

## See Also

- [SKILL.md](SKILL.md) - Complete workflow instructions
- [template-composite-transformer.json](template-composite-transformer.json) - Starter template
- [template-test-case.json](template-test-case.json) - Test case template
