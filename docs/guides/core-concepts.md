# Core Concepts

**Estimated reading time: 25 minutes**

This guide introduces the fundamental concepts of the Miroir Framework. Understanding these building blocks is essential for creating applications with Miroir.

---

## Table of Contents

1. [Overview](#overview)
2. [Meta-Model vs Model vs Data](#meta-model-vs-model-vs-data)
3. [Entity & EntityDefinition](#entity--entitydefinition)
4. [Jzod: The Meta-Language](#jzod-the-meta-language)
5. [Query](#query)
6. [Transformer](#transformer)
7. [Action](#action)
8. [Report](#report)
9. [Endpoint](#endpoint)
10. [Application & Deployment](#application--deployment)
11. [Putting It All Together](#putting-it-all-together)

---

## Overview

Miroir is built on a **meta-model** approach where:

1. **Everything is data** - Models, queries, transformations, and UI definitions are all stored as JSON
2. **Schemas define structure** - Jzod schemas define the shape of all data
3. **Interpreters execute logic** - Instead of compiling code, Miroir interprets declarative definitions
4. **Bootstrapped design** - The meta-model describes itself

This approach enables:
- ✅ Runtime modification without recompilation
- ✅ AI agent integration (everything is machine-readable JSON)
- ✅ Portable logic (run client-side, server-side, or in-database)
- ✅ Automatic UI generation from models

---

## Meta-Model vs Model vs Data

### The Three Layers

```
┌─────────────────────────────────────────┐
│          META-MODEL                     │  Defines structure of Models
│  (Entity, EntityDefinition, Query...)   │  Bootstrap: describes itself
│  Located: miroir_model/                 │
└─────────────────────────────────────────┘
                  ↓ instances of
┌─────────────────────────────────────────┐
│          MODEL (Application)            │  Defines structure of your app
│  (Book, Author, Publisher entities...)  │  Your domain model
│  Located: library_model/                │
└─────────────────────────────────────────┘
                  ↓ instances of
┌─────────────────────────────────────────┐
│          DATA (Instances)               │  Actual data in your app
│  (Specific books, authors, publishers)  │  Your application data
│  Located: library_data/                 │
└─────────────────────────────────────────┘
```

### Example

**Meta-Model**: Defines what an "Entity" is
```json
{
  "name": "Entity",
  "uuid": "381ab1be-337f-4198-b1d3-f686867fc1dd",
  "description": "An Entity represents a concept in your domain"
}
```

**Model**: Your "Book" entity (an instance of the Entity meta-model)
```json
{
  "uuid": "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
  "parentUuid": "381ab1be-337f-4198-b1d3-f686867fc1dd",
  "name": "Book",
  "description": "A book in the library"
}
```

**Data**: A specific book instance
```json
{
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "parentUuid": "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
  "title": "The Pragmatic Programmer",
  "author": "Andrew Hunt & David Thomas",
  "isbn": "978-0135957059"
}
```

---

## Entity & EntityDefinition

### Entity

An **Entity** represents a concept in your domain model (like "Book", "Author", "Customer").

**Key Properties:**
- `uuid` - Unique identifier
- `name` - Human-readable name
- `description` - Documentation

**File Location**: `<app>_model/<applicationUuid>/<entityUuid>.json`

### EntityDefinition

An **EntityDefinition** specifies the structure and attributes of an Entity using a Jzod schema.

**Key Properties:**
- `uuid` - Unique identifier
- `parentUuid` - References the Entity it defines
- `name` - Version name (e.g., "Book_1", "Book_2")
- `entityUuid` - The Entity being defined
- `jzodSchema` - Structure definition in Jzod format

**Example: Book EntityDefinition**
```json
{
  "uuid": "e8ba151b-1111-4cc3-9a83-3459d309ccf5",
  "parentUuid": "bdd7ad43-f0fc-4716-90c1-87454c40dd95",
  "entityUuid": "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
  "name": "Book",
  "jzodSchema": {
    "type": "object",
    "definition": {
      "uuid": {
        "type": "string",
        "validations": [{"type": "uuid"}]
      },
      "title": {
        "type": "string"
      },
      "author": {
        "type": "string",
        "tag": {
          "value": {
            "id": 1,
            "defaultLabel": "Author",
            "targetEntity": "d7a144ff-d1b9-4135-800c-a7cfc1f38733"
          }
        }
      },
      "isbn": {
        "type": "string",
        "optional": true
      },
      "publishedDate": {
        "type": "string",
        "validations": [{"type": "date"}]
      }
    }
  }
}
```

### Versioning

EntityDefinitions enable schema evolution:
- Keep old EntityDefinition for existing data
- Create new EntityDefinition for updated schema
- Migration transformers convert between versions

---

## Jzod: The Meta-Language

**Jzod** (Miroir Meta-Language, or MML) is a JSON-based schema definition language that:

1. Defines the structure of all data in Miroir
2. Generates TypeScript types
3. Generates Zod validation schemas
4. Is bootstrapped (defines its own structure)

### Basic Types

```json
{
  "type": "string"
}
```

```json
{
  "type": "number"
}
```

```json
{
  "type": "boolean"
}
```

### Objects

```json
{
  "type": "object",
  "definition": {
    "name": {"type": "string"},
    "age": {"type": "number"},
    "email": {"type": "string", "optional": true}
  }
}
```

### Arrays

```json
{
  "type": "array",
  "definition": {
    "type": "string"
  }
}
```

### Unions

```json
{
  "type": "union",
  "definition": [
    {
      "type": "object",
      "definition": {
        "discriminator": {"type": "literal", "definition": "book"},
        "title": {"type": "string"}
      }
    },
    {
      "type": "object",
      "definition": {
        "discriminator": {"type": "literal", "definition": "magazine"},
        "issue": {"type": "number"}
      }
    }
  ]
}
```

### Validations

```json
{
  "type": "string",
  "validations": [
    {"type": "uuid"}
  ]
}
```

```json
{
  "type": "string",
  "validations": [
    {"type": "email"}
  ]
}
```

**[See Jzod documentation for complete reference](../../jzod/README.md)**

---

## Query

A **Query** retrieves data from the domain model. Queries combine:
- **Extractors** - Fetch data from stores
- **Combiners** - Combine multiple extractors
- **Transformers** - Transform extracted data

### Query Types

#### 1. Extract Entity List

```json
{
  "queryType": "queryExtractObjectListByEntity",
  "applicationSection": "data",
  "parentUuid": "e8ba151b-d68e-4cc3-9a83-3459d309ccf5"
}
```

Fetches all instances of the Book entity.

#### 2. Extract Single Entity

```json
{
  "queryType": "queryExtractObjectByDirectReference",
  "instanceUuid": "550e8400-e29b-41d4-a716-446655440000"
}
```

Fetches a specific book by UUID.

#### 3. Extract with Combiner

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

Fetches multiple entity types in parallel.

### Execution Contexts

Queries can run:
- **Client-side** - In-memory on browser/desktop app
- **Server-side** - In Node.js server
- **Database** - Converted to SQL for Postgres

**[Complete Query API →](../reference/api/query.md)**

---

## Transformer

A **Transformer** is a pure function that transforms data without side effects.

### Key Characteristics

- ✅ **Pure functions** - Same input always produces same output
- ✅ **No side effects** - Cannot modify external state
- ✅ **Portable** - Run client, server, or in-database (SQL)
- ✅ **Composable** - Chain transformers together
- ✅ **Declarative** - Defined in JSON, not code

### Common Transformer Types

#### 1. Map List to List

Transform each item in a list:

```json
{
  "transformerType": "mapperListToList",
  "referencedExtractor": "books",
  "orderBy": {
    "attributeName": "title"
  }
}
```

#### 2. Map List to Object

Convert list to object indexed by key:

```json
{
  "transformerType": "mapperListToObject",
  "referencedExtractor": "books",
  "indexAttribute": "isbn"
}
```

#### 3. Filter

Select items matching criteria:

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

#### 4. Inner Join

Combine two lists by relationship:

```json
{
  "transformerType": "innerFullObjectTemplate",
  "referencedExtractor": "books",
  "definition": [
    {
      "attributeKey": {
        "interpolation": "runtime",
        "transformerType": "constantString",
        "constantStringValue": "title"
      },
      "attributeValue": {
        "transformerType": "mustacheStringTemplate",
        "definition": "{{title}}"
      }
    },
    {
      "attributeKey": {
        "interpolation": "runtime",
        "transformerType": "constantString",
        "constantStringValue": "authorName"
      },
      "attributeValue": {
        "transformerType": "freeObjectTemplate",
        "definition": {
          "transformerType": "objectDynamicAccess",
          "objectAccessPath": [
            {
              "transformerType": "contextReference",
              "referenceName": "authors"
            },
            {
              "transformerType": "mustacheStringTemplate",
              "definition": "{{author}}"
            },
            "name"
          ]
        }
      }
    }
  ]
}
```

### Template Parameters

Transformers support two interpolation modes:

- **`"interpolation": "build-time"`** - Parameters resolved when transformer is defined
- **`"interpolation": "runtime"`** - Parameters resolved when transformer executes

**[Complete Transformer API →](../reference/api/transformers.md)**

---

## Action

An **Action** performs side effects like creating, updating, or deleting data.

### Action Types

#### 1. Instance Actions

**Create Instance**:
```json
{
  "actionType": "instanceAction",
  "actionName": "createInstance",
  "endpoint": "ed520de4-55a9-4550-ac50-b1b713b72a89",
  "applicationSection": "data",
  "deploymentUuid": "f714bb2f-a12d-4e71-a03b-74dcb02aabf9",
  "objects": [
    {
      "parentUuid": "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
      "instances": [
        {
          "uuid": "550e8400-e29b-41d4-a716-446655440000",
          "title": "New Book",
          "author": "Author UUID",
          "publishedDate": "2026-01-28"
        }
      ]
    }
  ]
}
```

**Update Instance**:
```json
{
  "actionType": "instanceAction",
  "actionName": "updateInstance",
  "endpoint": "ed520de4-55a9-4550-ac50-b1b713b72a89",
  "objects": [
    {
      "parentUuid": "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
      "instances": [
        {
          "uuid": "550e8400-e29b-41d4-a716-446655440000",
          "title": "Updated Title"
        }
      ]
    }
  ]
}
```

**Delete Instance**:
```json
{
  "actionType": "instanceAction",
  "actionName": "deleteInstance",
  "endpoint": "ed520de4-55a9-4550-ac50-b1b713b72a89",
  "objects": [
    {
      "parentUuid": "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
      "instances": [
        {
          "uuid": "550e8400-e29b-41d4-a716-446655440000"
        }
      ]
    }
  ]
}
```

#### 2. Model Actions

Modify the application model (entities, queries, reports):

```json
{
  "actionType": "modelAction",
  "actionName": "createEntity",
  "deploymentUuid": "f714bb2f-a12d-4e71-a03b-74dcb02aabf9",
  "endpoint": "7947ae40-eb34-4149-887b-15a9021e714e",
  "entities": [
    {
      "entity": {
        "uuid": "new-entity-uuid",
        "name": "NewEntity",
        "description": "A new entity"
      },
      "entityDefinition": {
        "uuid": "new-entity-def-uuid",
        "parentUuid": "bdd7ad43-f0fc-4716-90c1-87454c40dd95",
        "entityUuid": "new-entity-uuid",
        "jzodSchema": { ... }
      }
    }
  ]
}
```

#### 3. Composite Actions

Chain multiple actions with queries:

```json
{
  "actionType": "compositeAction",
  "actionLabel": "Create Book and Link to Author",
  "definition": [
    {
      "compositeActionType": "query",
      "query": { ... },
      "queryReference": "findAuthor"
    },
    {
      "compositeActionType": "action",
      "action": {
        "actionType": "instanceAction",
        "actionName": "createInstance",
        ...
      }
    }
  ]
}
```

**[Complete Action API →](../reference/api/actions.md)**

---

## Report

A **Report** defines how data is displayed in the UI using declarative JSON.

### Report Structure

```json
{
  "uuid": "report-uuid",
  "name": "BookList",
  "defaultLabel": "Book List",
  "type": "list",
  "definition": {
    "extractors": {
      "books": {
        "queryType": "queryExtractObjectListByEntity",
        "parentUuid": "e8ba151b-d68e-4cc3-9a83-3459d309ccf5"
      }
    },
    "section": {
      "type": "objectListReportSection",
      "definition": {
        "label": "Books",
        "parentUuid": "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
        "fetchedDataReference": "books"
      }
    }
  }
}
```

### Report Section Types

#### 1. Object List Section

Display a list of entity instances:

```json
{
  "type": "objectListReportSection",
  "definition": {
    "label": "Books",
    "parentUuid": "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
    "fetchedDataReference": "books",
    "sortByAttribute": "title"
  }
}
```

#### 2. Grid Section

Display in grid/table format:

```json
{
  "type": "grid",
  "definition": {
    "columns": [
      {"field": "title", "header": "Title"},
      {"field": "author", "header": "Author"},
      {"field": "publishedDate", "header": "Published"}
    ],
    "fetchedDataReference": "books"
  }
}
```

#### 3. Form Section

Display/edit a single instance:

```json
{
  "type": "form",
  "definition": {
    "parentUuid": "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
    "fetchedDataReference": "currentBook",
    "fields": [
      {"attribute": "title", "label": "Title", "type": "text"},
      {"attribute": "isbn", "label": "ISBN", "type": "text"}
    ]
  }
}
```

#### 4. Composite Section

Combine multiple sections:

```json
{
  "type": "list",
  "definition": [
    {
      "type": "objectListReportSection",
      "definition": { ... }
    },
    {
      "type": "grid",
      "definition": { ... }
    }
  ]
}
```

**[Complete Report API →](../reference/api/reports.md)**

---

## Endpoint

An **Endpoint** defines a service interface exposing Actions to clients.

### Endpoint Structure

```json
{
  "uuid": "ed520de4-55a9-4550-ac50-b1b713b72a89",
  "parentUuid": "e3c1cc69-066d-4f52-beeb-b659dc7a88b9",
  "name": "InstanceEndpoint",
  "defaultLabel": "Instance CRUD Operations",
  "definition": {
    "actionType": "instanceAction",
    "actions": [
      {
        "actionName": "createInstance",
        "actionParameters": {
          "objects": {"type": "array"}
        }
      },
      {
        "actionName": "updateInstance",
        "actionParameters": {
          "objects": {"type": "array"}
        }
      },
      {
        "actionName": "deleteInstance",
        "actionParameters": {
          "objects": {"type": "array"}
        }
      }
    ]
  }
}
```

### Endpoint Types

- **InstanceEndpoint** - CRUD operations on entity instances
- **ModelEndpoint** - Operations on application model (entities, reports, etc.)
- **PersistenceEndpoint** - Low-level store operations
- **QueryEndpoint** - Execute queries
- **CustomEndpoint** - Domain-specific operations

**[Complete Endpoint API →](../reference/api/endpoints.md)**

---

## Application & Deployment

### Application

An **Application** defines the logical grouping of entities, queries, reports, and endpoints.

**Structure:**
- **Model** (`<app>_model/`) - Entity definitions, queries, reports, endpoints
- **Data** (`<app>_data/`) - Entity instances

### Deployment

A **Deployment** is a running instance of an Application with specific configuration:

- Store type (Postgres, IndexedDB, Filesystem)
- Connection parameters
- Admin credentials

**Example Deployment Config:**
```json
{
  "uuid": "f714bb2f-a12d-4e71-a03b-74dcb02aabf9",
  "name": "LibraryApp",
  "applicationUuid": "a027c379-8468-43a5-ba4d-bf618be25cab",
  "configuration": {
    "admin": {
      "emulatedServerType": "sql",
      "connectionString": "postgresql://user:pass@localhost:5432/library"
    },
    "model": {
      "emulatedServerType": "filesystem",
      "location": "./library_model"
    },
    "data": {
      "emulatedServerType": "indexedDb",
      "dbName": "library_data"
    }
  }
}
```

### Application Sections

Every application has three sections:

1. **admin** - Miroir framework metadata (deployments, menus, etc.)
2. **model** - Application model (entities, entity definitions, queries, reports, endpoints)
3. **data** - Application data (entity instances)

---

## Putting It All Together

### Typical Application Flow

```
1. Define Entities (Model)
   └─> Create Entity + EntityDefinition with Jzod schema

2. Create Data (Instances)
   └─> Use Actions to create/update/delete instances

3. Query Data
   └─> Define Queries with Extractors + Transformers

4. Display Data
   └─> Create Reports referencing Queries

5. Enable Interactions
   └─> Define Actions for CRUD operations
   └─> Create Endpoints to expose Actions
   └─> Add Runners to Reports for user interactions
```

### Example: Complete Book Feature (⚠️DUPLICATE OF HOME PAGE, USED JSON SCHEMA-LIKE SYNTAX ⚠️)

**1. Entity Definition**
```json
{
  "entity": {
    "uuid": "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
    "name": "Book"
  },
  "entityDefinition": {
    "jzodSchema": {
      "type": "object",
      "definition": {
        "uuid": {"type": "string", "validations": [{"type": "uuid"}]},
        "title": {"type": "string"},
        "isbn": {"type": "string", "optional": true}
      }
    }
  }
}
```

**2. Query**
```json
{
  "uuid": "query-uuid",
  "name": "BookList",
  "queryType": "extractorForRecordOfExtractors",
  "extractors": {
    "books": {
      "queryType": "queryExtractObjectListByEntity",
      "parentUuid": "e8ba151b-d68e-4cc3-9a83-3459d309ccf5"
    }
  }
}
```

**3. Report**
```json
{
  "uuid": "report-uuid",
  "name": "BookListReport",
  "definition": {
    "extractorTemplates": {
      "books": {"queryReference": "BookList"}
    },
    "section": {
      "type": "objectListReportSection",
      "definition": {
        "label": "Books",
        "fetchedDataReference": "books"
      }
    }
  }
}
```

**4. Action**
```json
{
  "actionType": "instanceAction",
  "actionName": "createInstance",
  "objects": [{
    "parentUuid": "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
    "instances": [{"title": "New Book", "isbn": "123"}]
  }]
}
```

---

## Next Steps

Now that you understand the core concepts:

- **[Create Your First Application](developer/creating-applications.md)** - Build an app from scratch
- **[Library Tutorial](../tutorials/library-tutorial.md)** - Hands-on walkthrough
- **[API Reference](../reference/api/)** - Detailed API documentation
- **[Deployment Guide](deployment.md)** - Deploy to production

---

**[← Back to Documentation Index](../index.md)**
