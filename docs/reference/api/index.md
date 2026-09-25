# API Reference (⚠️SLOPPY⚠️)

**Status: 🚧 In Progress - Auto-generated from Jzod schemas**

This API reference is generated from Jzod schemas defined in the Miroir meta-model. For the most up-to-date schemas, see the Entity rows in `packages/miroir-test-app_deployment-miroir/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/` (each Entity carries the `mlSchema` of its instances) and the generated types in `packages/miroir-core/src/0_interfaces/1_core/preprocessor-generated/`.

---

## Overview

The Miroir Framework API is defined through Jzod schemas and consists of several core concepts:

- **[Entity & EntityVersion](entity.md)** - Data model definitions
- **[Query](query.md)** - Data retrieval and extraction
- **[Transformer](transformers.md)** - Data transformation and manipulation
- **[Action](actions.md)** - Side-effects and mutations
- **[Report](reports.md)** - UI definitions and data presentation
- **[Endpoint](endpoints.md)** - Service interfaces

---

## Core Interfaces

### Bootstrapped Meta-Model

The following concept describes itself (bootstrapped):

- **Entity** - Entity UUID: `16dbfe28-e1d7-4f20-9ba4-c1a9873202ad` (an instance of itself)

**EntityVersion** (Entity UUID `54b9c72f-d4f3-4db9-9e0e-0dc840b530bd`) holds historical snapshots of Entities, written by `freezeApplicationVersion`; see [Entity & EntityVersion](entity.md#entityversion).

### Model Concepts

Defined as Entities of the Miroir application:

- **Query** - Entity UUID: `e4320b9e-ab45-4abe-85d8-359604b3c62f`
- **TransformerDefinition** - Entity UUID: `a557419d-a288-4fb8-8a1e-971c86c113b8`
- **Report** - Entity UUID: `3f2baa83-3ef7-45ce-82ea-6a43f7a8c916`
- **Endpoint** - Entity UUID: `3d8da4d4-8f76-4bb4-9212-14869d81c00c`

---

## Schema Locations

Each concept's schema is the `mlSchema` of its Entity row, in:

```
packages/miroir-test-app_deployment-miroir/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/
```

**Entity**: `16dbfe28-e1d7-4f20-9ba4-c1a9873202ad.json`
**EntityVersion**: `54b9c72f-d4f3-4db9-9e0e-0dc840b530bd.json`
**Query**: `e4320b9e-ab45-4abe-85d8-359604b3c62f.json`
**TransformerDefinition**: `a557419d-a288-4fb8-8a1e-971c86c113b8.json`
**Report**: `3f2baa83-3ef7-45ce-82ea-6a43f7a8c916.json`
**Endpoint**: `3d8da4d4-8f76-4bb4-9212-14869d81c00c.json`

Historical EntityVersion snapshots of these concepts (`381ab1be-…`, `bdd7ad43-…`, `359f1f9b-…`, …) live in `miroir_modelVersion/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/`.

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
- **[Entity & EntityVersion](entity.md)** - Define your domain model

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
import type { Entity } from '@miroir-framework/miroir-core';

// The Entity carries its own mlSchema: no separate EntityVersion is needed.
const bookEntity: Entity = {
  uuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
  parentName: "Entity",
  parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
  name: "Book",
  description: "A book in the library",
  mlSchema: {
    type: "object",
    extend: {
      type: "schemaReference",
      definition: { eager: true, absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739", relativePath: "entityDefinitionRoot" },
    },
    definition: {
      name: { type: "string" },
      author: { type: "uuid", tag: { value: { foreignKeyParams: { targetEntity: "d7a144ff-d1b9-4135-800c-a7cfc1f38733" } } } },
    },
  },
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

- **[Entity & EntityVersion →](entity.md)**
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
