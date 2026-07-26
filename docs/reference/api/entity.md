# Entity & EntityVersion API Reference (⚠️SLOPPY⚠️)

**Status: 🚧 Sketch - To be auto-generated from Jzod schemas**

---

## Overview

**Entity** and **EntityVersion** are the bootstrapped meta-model concepts in Miroir. They define the structure of all domain models.

- **Entity** - Represents a concept in your domain (e.g., "Book", "Author", "Customer"). Authoritative **present-model** definition (`mlSchema`, PK, view/cache fields).
- **EntityVersion** - Versioned / historical snapshot of an Entity's definition (formerly **EntityDefinition**; TypeScript still exports a deprecated `EntityDefinition` alias).

---

## Entity

### Schema Location

`packages/miroir-core/src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/381ab1be-337f-4198-b1d3-f686867fc1dd.json`

### TypeScript Interface

```typescript
interface Entity {
  uuid: string;                    // Unique identifier (UUID v4)
  parentUuid: string;              // Always references Entity meta-entity (16dbfe28-…)
  name: string;                    // Human-readable name
  description?: string;            // Optional documentation
  conceptLevel?: "MetaModel" | "Model" | "Data";
  icon?: string;                   // Optional UI icon
  mlSchema?: JzodObject;           // Present-model structure (authoritative)
  idAttribute?: string | string[]; // Primary key attribute(s) — defaults to "uuid"
}
```

### Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `uuid` | string (UUID) | ✅ Yes | Unique identifier for this entity |
| `parentUuid` | string (UUID) | ✅ Yes | References the Entity meta-entity (`381ab1be-337f-4198-b1d3-f686867fc1dd`) |
| `name` | string | ✅ Yes | Human-readable name (e.g., "Book", "Author") |
| `description` | string | No | Optional documentation |
| `conceptLevel` | enum | No | Level in meta-model hierarchy |
| `icon` | string | No | Optional icon name for UI display |

### Example

```json
{
  "uuid": "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
  "parentUuid": "381ab1be-337f-4198-b1d3-f686867fc1dd",
  "name": "Book",
  "description": "A book in the library",
  "conceptLevel": "Model"
}
```

---

## EntityVersion

### Schema Location

`packages/miroir-core/src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/bdd7ad43-f0fc-4716-90c1-87454c40dd95.json`

### TypeScript Interface

```typescript
interface EntityVersion {
  // Deprecated alias: type EntityDefinition = EntityVersion
  uuid: string;                    // Unique identifier (UUID v4)
  parentUuid: string;              // Always references EntityVersion meta-entity (54b9c72f-…)
  name: string;                    // Version name
  entityUuid: string;              // References the Entity being defined
  conceptLevel?: "MetaModel" | "Model" | "Data";
  description?: string;
  idAttribute?: string | string[]; // Primary key attribute(s) — defaults to "uuid"
  defaultInstanceDetailsReportUuid?: string;
  mlSchema: JzodObject;            // Jzod / ML schema defining structure
}
```

### Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `uuid` | string (UUID) | ✅ Yes | Unique identifier for this definition |
| `parentUuid` | string (UUID) | ✅ Yes | References EntityVersion meta-entity (`54b9c72f-d4f3-4db9-9e0e-0dc840b530bd`) |
| `name` | string | ✅ Yes | Version name (e.g., "Book_v1", "Book_v2") |
| `entityUuid` | string (UUID) | ✅ Yes | References the Entity this defines |
| `mlSchema` | JzodObject | ✅ Yes | Structure definition in Jzod / ML format |
| `idAttribute` | string \| string[] | No | Primary key attribute(s). Defaults to `"uuid"`. Use a string for single-attribute PK (e.g. `"code"`), or a string array for composite PK (e.g. `["region", "code"]`). |
| `conceptLevel` | enum | No | Level in meta-model hierarchy |
| `description` | string | No | Optional documentation |
| `defaultInstanceDetailsReportUuid` | string (UUID) | No | Default report for displaying instances |

### Example

```json
{
  "uuid": "e8ba151b-1111-4cc3-9a83-3459d309ccf5",
  "parentUuid": "bdd7ad43-f0fc-4716-90c1-87454c40dd95",
  "name": "Book",
  "entityUuid": "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
  "mlSchema": {
    "type": "object",
    "definition": {
      "uuid": {
        "type": "string",
        "validations": [{ "type": "uuid" }]
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
        "validations": [{ "type": "date" }]
      }
    }
  }
}
```

---

## Jzod / ML Schema in EntityVersion

The `jzodSchema` property defines the structure of entity instances. See [Jzod documentation](../../../../jzod/README.md) for complete schema syntax.

### Common Patterns

#### Basic Attributes

```json
{
  "type": "object",
  "definition": {
    "uuid": {
      "type": "string",
      "validations": [{ "type": "uuid" }]
    },
    "name": {
      "type": "string"
    },
    "age": {
      "type": "number",
      "optional": true
    }
  }
}
```

#### Relationships (Foreign Keys)

```json
{
  "author": {
    "type": "string",
    "tag": {
      "value": {
        "id": 1,
        "defaultLabel": "Author",
        "targetEntity": "d7a144ff-d1b9-4135-800c-a7cfc1f38733"
      }
    }
  }
}
```

The `tag` property indicates this is a relationship to another entity.

#### Optional Fields

```json
{
  "email": {
    "type": "string",
    "optional": true,
    "validations": [{ "type": "email" }]
  }
}
```

#### Enums

```json
{
  "status": {
    "type": "enum",
    "definition": ["draft", "published", "archived"]
  }
}
```

#### Arrays

```json
{
  "tags": {
    "type": "array",
    "definition": {
      "type": "string"
    }
  }
}
```

---

## Entity Versioning

EntityVersions enable schema evolution without breaking existing data:

### Version 1

```json
{
  "uuid": "def-uuid-v1",
  "name": "Book_v1",
  "entityUuid": "entity-uuid",
  "mlSchema": {
    "type": "object",
    "definition": {
      "uuid": { "type": "string" },
      "title": { "type": "string" }
    }
  }
}
```

### Version 2 (with new field)

```json
{
  "uuid": "def-uuid-v2",
  "name": "Book_v2",
  "entityUuid": "entity-uuid",
  "mlSchema": {
    "type": "object",
    "definition": {
      "uuid": { "type": "string" },
      "title": { "type": "string" },
      "isbn": { "type": "string", "optional": true }
    }
  }
}
```

Migration transformers convert instances between versions.

---

## CRUD Operations

### Create Entity

```typescript
const createEntityAction: ModelAction = {
  actionType: "modelAction",
  actionName: "createEntity",
  deploymentUuid: "deployment-uuid",
  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
  entities: [{
    entity: {
      uuid: "new-entity-uuid",
      parentUuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
      name: "NewEntity",
      description: "Description"
    },
    entityDefinition: {
      uuid: "new-def-uuid",
      parentUuid: "bdd7ad43-f0fc-4716-90c1-87454c40dd95",
      name: "NewEntity_v1",
      entityUuid: "new-entity-uuid",
      jzodSchema: { /* ... */ }
    }
  }]
};
```

### Read Entity

```typescript
const entityQuery: Query = {
  queryType: "queryExtractObjectByDirectReference",
  instanceUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5"
};
```

### Update Entity

```typescript
const updateEntityAction: ModelAction = {
  actionType: "modelAction",
  actionName: "updateEntity",
  /* ... */
};
```

### Delete Entity

```typescript
const deleteEntityAction: ModelAction = {
  actionType: "modelAction",
  actionName: "dropEntity",
  /* ... */
};
```

---

## Related Concepts

- **[Jzod Schema Language](../../../../jzod/README.md)** - Schema definition syntax
- **[Query API](query.md)** - Querying entity instances
- **[Action API](actions.md)** - Creating/updating entities
- **[Transformer API](transformers.md)** - Transforming entity data

---

**[← Back to API Reference](index.md)** | **[← Back to Documentation Index](../../index.md)**
