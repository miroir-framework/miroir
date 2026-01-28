# API Reference

**Status: 🚧 In Progress - Auto-generated from Jzod schemas**

This API reference is generated from Jzod schemas defined in the Miroir meta-model. For the most up-to-date schemas, see the source files in `packages/miroir-core/src/assets/miroir_model/`.

---

## Overview

The Miroir Framework API is defined through Jzod schemas and consists of several core concepts:

- **[Entity & EntityDefinition](entity.md)** - Data model definitions
- **[Query](query.md)** - Data retrieval and extraction
- **[Transformer](transformers.md)** - Data transformation and manipulation
- **[Action](actions.md)** - Side-effects and mutations
- **[Report](reports.md)** - UI definitions and data presentation
- **[Endpoint](endpoints.md)** - Service interfaces

---

## Core Interfaces

### Bootstrapped Meta-Model

The following concepts describe themselves (bootstrapped):

- **Entity** - UUID: `381ab1be-337f-4198-b1d3-f686867fc1dd`
- **EntityDefinition** - UUID: `bdd7ad43-f0fc-4716-90c1-87454c40dd95`

### Model Concepts

Defined using the meta-model:

- **Query** - UUID: `359f1f9b-7260-4d76-a864-72c839b9711b`
- **Transformer** - UUID: `54a16d69-c1f0-4dd7-aba4-a2cda883586c`
- **Report** - UUID: `952d2c65-4da2-45c2-9394-a0920ceedfb6`
- **Endpoint** - UUID: `e3c1cc69-066d-4f52-beeb-b659dc7a88b9`

---

## Schema Locations

All schemas are defined in JSON files located at:

```
packages/miroir-core/src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/
```

**Entity**: `381ab1be-337f-4198-b1d3-f686867fc1dd.json`
**EntityDefinition**: `bdd7ad43-f0fc-4716-90c1-87454c40dd95.json`
**Query**: `359f1f9b-7260-4d76-a864-72c839b9711b.json`
**Transformer**: `54a16d69-c1f0-4dd7-aba4-a2cda883586c.json`
**Report**: `952d2c65-4da2-45c2-9394-a0920ceedfb6.json`
**Endpoint**: `e3c1cc69-066d-4f52-beeb-b659dc7a88b9.json`

---

## TypeScript Types

Generated TypeScript types are available at:

```
packages/miroir-core/src/0_interfaces/1_core/preprocessor-generated/
```

These types are generated from Jzod schemas using:

```bash
npm run devBuild -w miroir-core
```

---

## API Documentation by Category

### Data Model
- **[Entity & EntityDefinition](entity.md)** - Define your domain model

### Data Access
- **[Query API](query.md)** - Retrieve and filter data
  - Extractors (fetch data from stores)
  - Combiners (combine multiple extractors)
  - Query selectors (React hooks for queries)

### Data Transformation
- **[Transformer API](transformers.md)** - Transform data
  - Map, filter, reduce operations
  - Template-based transformations
  - Portable execution (client/server/database)

### Data Mutation
- **[Action API](actions.md)** - Perform side effects
  - Instance actions (CRUD)
  - Model actions (schema evolution)
  - Composite actions (workflows)

### UI Definition
- **[Report API](reports.md)** - Define user interfaces
  - Report sections
  - Data binding
  - Runners (user interactions)

### Service Definition
- **[Endpoint API](endpoints.md)** - Expose services
  - Action endpoints
  - Query endpoints
  - Custom endpoints

---

## Common Patterns

### Creating an Entity

```typescript
import type { Entity, EntityDefinition } from '@miroir-framework/miroir-core';

const bookEntity: Entity = {
  uuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
  parentUuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
  name: "Book",
  description: "A book in the library"
};

const bookEntityDefinition: EntityDefinition = {
  uuid: "e8ba151b-1111-4cc3-9a83-3459d309ccf5",
  parentUuid: "bdd7ad43-f0fc-4716-90c1-87454c40dd95",
  name: "Book",
  entityUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
  jzodSchema: {
    type: "object",
    definition: {
      uuid: { type: "string", validations: [{ type: "uuid" }] },
      title: { type: "string" },
      author: { type: "string" }
    }
  }
};
```

### Executing a Query

```typescript
import type { Query } from '@miroir-framework/miroir-core';

const booksQuery: Query = {
  queryType: "queryExtractObjectListByEntity",
  applicationSection: "data",
  parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5"
};

// In React component
const books = useDomainSelector(booksQuery);
```

### Running a Transformer

```typescript
import type { Transformer } from '@miroir-framework/miroir-core';

const sortedBooksTransformer: Transformer = {
  transformerType: "mapperListToList",
  referencedExtractor: "books",
  orderBy: { attributeName: "title" }
};
```

### Dispatching an Action

```typescript
import type { Action } from '@miroir-framework/miroir-core';

const createBookAction: Action = {
  actionType: "instanceAction",
  actionName: "createInstance",
  endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
  applicationSection: "data",
  deploymentUuid: "f714bb2f-a12d-4e71-a03b-74dcb02aabf9",
  objects: [{
    parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
    instances: [{
      uuid: "550e8400-e29b-41d4-a716-446655440000",
      title: "New Book",
      author: "Author Name"
    }]
  }]
};

// In React component
const dispatch = useDispatch();
dispatch(createBookAction);
```

---

## Detailed References

Click on any topic below for complete API documentation:

- **[Entity & EntityDefinition →](entity.md)**
- **[Query →](query.md)**
- **[Transformer →](transformers.md)**
- **[Action →](actions.md)**
- **[Report →](reports.md)**
- **[Endpoint →](endpoints.md)**

---

## Future: Auto-Generated Documentation

**Coming Soon**: Full API documentation auto-generated from Jzod schemas with:

- ✅ Complete type signatures
- ✅ Field descriptions
- ✅ Validation rules
- ✅ Examples for each type
- ✅ Interactive playground

---

**[← Back to Documentation Index](../../index.md)**
