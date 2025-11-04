# mapList Transformer

## Quick Overview

The `mapList` transformer takes a list (array) and transforms **each element** into a new form, returning a new list of transformed elements.

Think of it like the JavaScript `.map()` function, but with the power of Miroir's transformer system.

![synoptic diagram](./listToList_diagram.svg)

## What It Does

- **Input**: A list of items (array)
- **Output**: A new list with each item transformed
- **Purpose**: Convert each element in a list from one shape to another

## Basic Structure

```json
{
  "transformerType": "mapList",
  "applyTo": <source-list>,
  "elementTransformer": <transformer-to-apply-to-each-element>,
  "referenceToOuterObject": "elementName",
  "orderBy": "fieldName"
}
```

## Key Properties

### 1. `applyTo` (optional)

The list you want to transform. Can be:

- A direct array: `[item1, item2, item3]`
- A reference to data: `{ transformerType: "getFromContext", referenceName: "myList" }`
- If omitted, uses the default input

### 2. `elementTransformer` (required)

The transformer that will be applied to **each element** of the list. This can be any transformer type:

- `createObject` - Build a simple object
- `object_fullTemplate` - Build a complex object
- `objectAlter` - Modify an existing object
- `returnValue` - Replace with a constant value
- Any other transformer

### 3. `referenceToOuterObject` (optional, default: `"element"`)

The name you want to give to each element when processing it. This is how you reference the current item inside `elementTransformer`.

### 4. `orderBy` (optional)

A field name to sort the result list alphabetically.

## Simple Examples

### Example 1: Transform List to Simple Objects

**Input List:**

```json
["Alice", "Bob", "Charlie"]
```

**Transformer:**

```json
{
  "transformerType": "mapList",
  "applyTo": { 
    "transformerType": "getFromContext", 
    "referenceName": "nameList" 
  },
  "referenceToOuterObject": "name",
  "elementTransformer": {
    "transformerType": "createObject",
    "definition": {
      "greeting": { 
        "transformerType": "mustacheStringTemplate",
        "definition": "Hello, {{name}}!"
      }
    }
  }
}
```

**Output:**

```json
[
  { "greeting": "Hello, Alice!" },
  { "greeting": "Hello, Bob!" },
  { "greeting": "Hello, Charlie!" }
]
```

### Example 2: Extract Specific Fields from Objects

**Input List:**

```json
[
  { "uuid": "1", "name": "USA", "code": "US", "population": 331 },
  { "uuid": "2", "name": "Germany", "code": "DE", "population": 83 }
]
```

**Transformer:**

```json
{
  "transformerType": "mapList",
  "applyTo": { 
    "transformerType": "getFromContext", 
    "referenceName": "countries" 
  },
  "referenceToOuterObject": "country",
  "elementTransformer": {
    "transformerType": "createObject",
    "definition": {
      "id": { 
        "transformerType": "getFromContext", 
        "referencePath": ["country", "uuid"] 
      },
      "label": { 
        "transformerType": "getFromContext", 
        "referencePath": ["country", "code"] 
      }
    }
  }
}
```

**Output:**

```json
[
  { "id": "1", "label": "US" },
  { "id": "2", "label": "DE" }
]
```

### Example 3: Add New Fields to Existing Objects

**Input List:**

```json
[
  { "name": "John", "age": 30 },
  { "name": "Jane", "age": 25 }
]
```

**Transformer:**

```json
{
  "transformerType": "mapList",
  "applyTo": { 
    "transformerType": "getFromContext", 
    "referenceName": "users" 
  },
  "referenceToOuterObject": "user",
  "elementTransformer": {
    "transformerType": "objectAlter",
    "applyTo": { 
      "transformerType": "getFromContext", 
      "referenceName": "user" 
    },
    "definition": {
      "transformerType": "createObject",
      "definition": {
        "id": { 
          "transformerType": "newUuid" 
        },
        "status": { 
          "transformerType": "returnValue", 
          "value": "active" 
        }
      }
    }
  }
}
```

**Output:**

```json
[
  { "name": "John", "age": 30, "id": "uuid-1", "status": "active" },
  { "name": "Jane", "age": 25, "id": "uuid-2", "status": "active" }
]
```

## How It Works Internally

1. **Resolve the input list** from `applyTo` (or use default input)
2. **For each element** in the list:
   - Make the element available with the name specified in `referenceToOuterObject`
   - Apply the `elementTransformer` to that element
   - Collect the result
3. **Sort the results** if `orderBy` is specified
4. **Return the new list**

## Common Use Cases

- **Data reshaping**: Convert database entities to UI-friendly objects
- **Field extraction**: Pull out specific fields from complex objects
- **Enrichment**: Add computed or returnValue fields to existing objects
- **Format conversion**: Transform data from one format to another
- **Filtering fields**: Create slimmer objects with only needed fields

## Tips for Junior Developers

1. **Name your elements clearly**: Use descriptive names in `referenceToOuterObject` (e.g., "user", "product", "country")

2. **Test with small lists first**: Start with 2-3 items to verify your transformer logic

3. **Think step-by-step**:
   - What do I have? (input list)
   - What do I want? (output list)
   - What needs to change for each item? (elementTransformer)

4. **Common mistake**: Forgetting to reference the element correctly inside `elementTransformer`. Make sure your references use the name from `referenceToOuterObject`.

## Related Transformers

- **indexListBy**: Convert list to object indexed by a field
- **listReducerToSpreadObject**: Flatten list of objects into a single object
- **listPickElement**: Pick a single element from a list
- **getUniqueValues**: Get getUniqueValues values from a list based on a field

## See Also

- Test examples: `packages/miroir-core/tests/2_domain/transformersTests_miroir.data.ts` (lines 1867-2050)
- Definition: `packages/miroir-core/src/assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/3ec73049-5e54-40aa-bc86-4c4906d00baa.json`
