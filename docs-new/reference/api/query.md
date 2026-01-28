# Query API Reference (⚠️SLOPPY⚠️)

**Status: 🚧 Sketch - To be auto-generated from Jzod schemas**

---

## Overview

**Queries** retrieve data from the domain model. They combine Extractors (fetch data), Combiners (combine extractors), and Transformers (transform data).

---

## Schema Location

`packages/miroir-core/src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/359f1f9b-7260-4d76-a864-72c839b9711b.json`

---

## Query Types

### 1. Extract Entity List

Fetch all instances of an entity:

```json
{
  "queryType": "queryExtractObjectListByEntity",
  "applicationSection": "data",
  "parentUuid": "e8ba151b-d68e-4cc3-9a83-3459d309ccf5"
}
```

### 2. Extract Single Instance

Fetch a specific instance by UUID:

```json
{
  "queryType": "queryExtractObjectByDirectReference",
  "instanceUuid": "550e8400-e29b-41d4-a716-446655440000"
}
```

### 3. Extract with Combiner

Fetch multiple entity types:

```json
{
  "queryType": "extractorForRecordOfExtractors",
  "extractors": {
    "books": {
      "queryType": "queryExtractObjectListByEntity",
      "parentUuid": "e8ba151b-d68e-4cc3-9a83-3459d309ccf5"
    },
    "authors": {
      "queryType": "queryExtractObjectListByEntity",
      "parentUuid": "d7a144ff-d1b9-4135-800c-a7cfc1f38733"
    }
  }
}
```

### 4. Extract with Transformer

Fetch and transform data:

```json
{
  "queryType": "extractorTransformer",
  "extractors": {
    "books": {
      "queryType": "queryExtractObjectListByEntity",
      "parentUuid": "e8ba151b-d68e-4cc3-9a83-3459d309ccf5"
    }
  },
  "transformers": {
    "sortedBooks": {
      "transformerType": "mapperListToList",
      "referencedExtractor": "books",
      "orderBy": { "attributeName": "title" }
    }
  }
}
```

---

## Using Queries in React

### Domain Selectors

```typescript
import { useDomainSelector } from '@miroir-framework/miroir-react';

function BookList() {
  const query = {
    queryType: "queryExtractObjectListByEntity",
    applicationSection: "data",
    parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5"
  };
  
  const books = useDomainSelector(query);
  
  return (
    <ul>
      {books.map(book => <li key={book.uuid}>{book.title}</li>)}
    </ul>
  );
}
```

---

## Complete Query Type Reference

**Coming Soon**: Auto-generated from Jzod schemas

- `queryExtractObjectListByEntity`
- `queryExtractObjectByDirectReference`
- `extractorForRecordOfExtractors`
- `extractorTransformer`
- `wrapperReturningObject`
- `wrapperReturningList`
- `querySelectObjectByRelation`
- `querySelectObjectListByRelation`
- `querySelectObjectListByManyToManyRelation`
- `queryCombinerTransformer`

---

**[← Back to API Reference](index.md)** | **[← Back to Documentation Index](../../index.md)**
