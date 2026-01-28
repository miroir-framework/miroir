# Transformer API Reference

**Status: 🚧 Sketch - To be auto-generated from Jzod schemas**

---

## Overview

**Transformers** are pure functions that transform data without side effects. They can be executed on the client, server, or in-database (SQL).

### Key Characteristics

- ✅ Pure functions (no side effects)
- ✅ Portable (client/server/database execution)
- ✅ Composable (chain transformers)
- ✅ Declarative (JSON-defined)

---

## Schema Location

`packages/miroir-core/src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/54a16d69-c1f0-4dd7-aba4-a2cda883586c.json`

---

## Common Transformer Types

### 1. mapperListToList

Transform each item in a list.

**Example: Sort books by title**
```json
{
  "transformerType": "mapperListToList",
  "referencedExtractor": "books",
  "orderBy": {
    "attributeName": "title"
  }
}
```

**[Complete documentation →](../../../docs/transformers/mapperListToList.md)**

### 2. mapperListToObject

Convert a list to an object indexed by key.

```json
{
  "transformerType": "mapperListToObject",
  "referencedExtractor": "books",
  "indexAttribute": "uuid"
}
```

### 3. objectAlter

Filter or modify objects.

```json
{
  "transformerType": "objectAlter",
  "referencedExtractor": "books",
  "definition": {
    "transformerType": "mustacheStringTemplate",
    "definition": "{{#if publishedDate}}{{#gt publishedDate '2020-01-01'}}true{{/gt}}{{/if}}"
  }
}
```

### 4. innerFullObjectTemplate

Create new objects with computed properties.

```json
{
  "transformerType": "innerFullObjectTemplate",
  "referencedExtractor": "books",
  "definition": [
    {
      "attributeKey": {
        "transformerType": "constantString",
        "constantStringValue": "title"
      },
      "attributeValue": {
        "transformerType": "mustacheStringTemplate",
        "definition": "{{title}}"
      }
    }
  ]
}
```

---

## Execution Contexts

Transformers can run in three contexts:

### 1. Client (In-Memory)

Executed in browser JavaScript:

```typescript
const result = await executeTransformer(transformer, context);
```

### 2. Server (In-Memory)

Executed in Node.js:

```typescript
const result = await executeTransformer(transformer, context);
```

### 3. Database (SQL)

Converted to SQL and executed in PostgreSQL:

```typescript
const result = await executeTransformerInDatabase(transformer, context);
```

---

## Template Parameters

### Build-Time Interpolation

Parameters resolved when transformer is defined:

```json
{
  "interpolation": "build-time",
  "transformerType": "mustacheStringTemplate",
  "definition": "{{bookTitle}}"
}
```

### Runtime Interpolation

Parameters resolved when transformer executes:

```json
{
  "interpolation": "runtime",
  "transformerType": "mustacheStringTemplate",
  "definition": "{{title}}"
}
```

---

## Complete Transformer Type Reference

**Coming Soon**: Auto-generated from Jzod schemas

- `constantString`
- `constantNumber`
- `constantObject`
- `constantUuid`
- `contextReference`
- `parameterReference`
- `objectDynamicAccess`
- `mapperListToList`
- `mapperListToObject`
- `objectAlter`
- `innerFullObjectTemplate`
- `freeObjectTemplate`
- `mustacheStringTemplate`
- `count`
- `fullObjectTemplate`
- `transformerRecordOfTransformers`
- `transformerMenu`

---

**[← Back to API Reference](index.md)** | **[← Back to Documentation Index](../../index.md)**
