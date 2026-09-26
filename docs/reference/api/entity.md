# Entity API Reference

**Status: 🚧 Hand-written reference.** When this page disagrees with the sources, the sources win: the generated types in `packages/miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.ts` (`Entity`, `EntityInstance`) and the Entity `mlSchema` in the bootstrap asset listed below.

---

## Overview

**Entity** is the bootstrapped meta-model concept in Miroir: every domain concept (Book, Author, Query, Report, … and Entity itself) is an instance of Entity.

- **Entity** - Represents a concept in your domain (e.g., "Book", "Author", "Customer"). It is the **authoritative present-model** definition: it carries `mlSchema`, primary key (`idAttribute`), view / cache fields and display metadata. This is the only thing you need to define a new concept. (Model history is optional; see the [Versioning reference](../versioning.md).)

---

## Entity

### Schema Location

The structure of an Entity row is the `mlSchema` of the bootstrapped Entity `Entity` itself:

`packages/miroir-test-app_deployment-miroir/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad.json`

Its `mlSchema` extends `entityDefinitionRoot` (from the Miroir fundamental schema `fe9b7d99-…`), which contributes `uuid`, `parentName`, `parentUuid`, `parentDefinitionVersionUuid` and `conceptLevel`.

### TypeScript Interface

Abridged from the generated `Entity` type:

```typescript
interface Entity {
  uuid: string;                    // Unique identifier (UUID v4)
  parentName?: string;             // "Entity"
  parentUuid: string;              // Always the Entity meta-entity 16dbfe28-e1d7-4f20-9ba4-c1a9873202ad
  parentDefinitionVersionUuid?: string; // Informational only, see Versioning reference
  conceptLevel?: "MetaModel" | "Model" | "Data" | "External";
  name: string;                    // Human-readable name
  selfApplication?: string;        // SelfApplication owning this Entity
  description?: string;            // Optional documentation
  defaultInstanceDetailsReportUuid?: string;
  viewAttributes?: string[];       // Columns shown in instance lists
  icon?: MiroirIcon;               // Optional UI icon
  cache?: { cacheAllInstancesOnRefresh?: boolean };
  idAttribute?: string | string[]; // Primary key attribute(s) — defaults to "uuid"
  externalDataSource?: {           // Only for conceptLevel "External"
    kind?: "sql" | "http"; endpoint?: string; schema?: string; tableName?: string;
  };
  scope?: "versioning" | "modeling";          // Meta-model only, see Versioning reference
  logicalDataModel?: "entity" | "manyToMany"; // Meta-model only, see Versioning reference
  mlSchema: MlObject;            // Present-model structure of instances (authoritative, required)
}
```

### Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `uuid` | string (UUID) | ✅ Yes | Unique identifier for this entity |
| `parentUuid` | string (UUID) | ✅ Yes | The Entity meta-entity `16dbfe28-e1d7-4f20-9ba4-c1a9873202ad` (every Entity, including `Entity` itself, is an instance of Entity) |
| `name` | string | ✅ Yes | Human-readable name (e.g., "Book", "Author") |
| `mlSchema` | MlObject | ✅ Yes | Structure of the instances of this Entity, in Jzod / ML format. Application Entities usually `extend` `entityDefinitionRoot` — see [Jzod / ML Schema](#jzod--ml-schema-of-an-entity) |
| `description` | string | No | Optional documentation |
| `conceptLevel` | `"MetaModel"` \| `"Model"` \| `"Data"` \| `"External"` | No | Level in meta-model hierarchy. `External` marks Entities whose instances live outside Miroir-managed storage (requires `externalDataSource`) |
| `selfApplication` | string (UUID) | No | The SelfApplication this Entity belongs to |
| `idAttribute` | string \| string[] | No | Primary key attribute(s). **Absent ⇒ `"uuid"`.** A string for a single non-UUID PK (e.g. `"code"`), a string array for a composite PK (e.g. `["region", "code"]`). See [Defining Entities](../../guides/developer/defining-entities.md) |
| `externalDataSource` | object | No | Where External instances live: `kind` (`sql`, default, or `http`), `schema`, `tableName`, `endpoint` (for `http`) |
| `viewAttributes` | string[] | No | Attributes shown when listing instances |
| `defaultInstanceDetailsReportUuid` | string (UUID) | No | Default Report used to display an instance |
| `cache` | object | No | `cacheAllInstancesOnRefresh` |
| `icon` | MiroirIcon | No | Optional icon for UI display |
| `scope` | `"versioning"` \| `"modeling"` | No | **Meta-model only**, absent means `modeling`. Not set by application authors. See [Versioning — meta-model classification](../versioning.md#meta-model-classification-scope-and-logicaldatamodel) |
| `logicalDataModel` | `"entity"` \| `"manyToMany"` | No | **Meta-model only**, absent means `entity`; `manyToMany` marks cross / link tables. See [Versioning — meta-model classification](../versioning.md#meta-model-classification-scope-and-logicaldatamodel) |

### Example

Library `Book`, abridged from `packages/miroir-test-app_deployment-library/assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/e8ba151b-d68e-4cc3-9a83-3459d309ccf5.json`:

```json
{
  "uuid": "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
  "parentName": "Entity",
  "parentUuid": "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
  "selfApplication": "5af03c98-fe5e-490b-b08f-e1230971c57f",
  "name": "Book",
  "conceptLevel": "Model",
  "description": "A book.",
  "viewAttributes": ["name", "author", "year", "citation", "publisher", "uuid"],
  "cache": { "cacheAllInstancesOnRefresh": true },
  "mlSchema": {
    "type": "object",
    "extend": {
      "type": "schemaReference",
      "definition": {
        "eager": true,
        "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
        "relativePath": "entityDefinitionRoot"
      }
    },
    "definition": {
      "name": { "type": "string", "tag": { "value": { "defaultLabel": "Book Title" } } },
      "author": {
        "type": "uuid",
        "tag": {
          "value": {
            "defaultLabel": "Author",
            "foreignKeyParams": {
              "targetEntity": "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
              "targetEntityOrderInstancesBy": "name"
            }
          }
        }
      }
    }
  }
}
```

### Instances of an Entity

Instances (e.g. a Book) conform to the Entity's `mlSchema`. The generic `EntityInstance` type has **optional** `uuid` and `parentUuid`:

- `parentUuid` is the uuid of the instance's **Entity** (`e8ba151b-…` for a Book). It is still present on all shipped assets and remains the recommended default; [#172](https://github.com/miroir-framework/miroir/issues/172) makes it optional, the owning Entity then being taken from the action / collection context (`resolveInstanceParentUuid` in `packages/miroir-core/src/1_core/Entity/EntityPrimaryKey.ts`).
- `uuid` is the primary key only when `idAttribute` is absent or `"uuid"`; with a non-UUID or composite `idAttribute`, the PK attributes identify the instance.

### Virtual attributes

An `mlSchema` attribute may carry `tag.value.virtualAttribute`: an inline transformer
(`coreTransformerForBuildPlusRuntime`, same editor pattern as `initializeTo.transformer`) that
computes the value from **that instance’s stored fields only** (including FK uuids as scalars).
No other Entity is read and SQL never adds a JOIN for it.

- **Lazy:** evaluated only when a query requires the name (`filter` / `orderBy` / `attributes`),
  a later `runtimeTransformer` in the same boxed query reads it, or a report shows it
  (`viewAttributes` / details schema).
- **Never stored:** not a SQL/filesystem column; stripped on create/update.
- **SQL:** when `runAsSql` requires the name, the transformer compiles to an expression over
  that table’s columns; compile failure → `QueryNotExecutable`.
- Public API: `packages/miroir-core/src/2_domain/VirtualAttributes.ts`
  (`evaluateVirtualAttributesOnInstance`, `requiredVirtualAttributeNames`,
  `stripVirtualAttributesFromInstance`).

Library tracer: Book `citation` = mustache `{{name}} ({{year}})` — Rear Window → `"Rear Window (1942)"`.
Report-local `runtimeTransformers` remain the tool for cluster/JOIN display.

---

## Jzod / ML Schema of an Entity

The **`mlSchema`** property of an Entity defines the structure of its instances. It is a Jzod `object`. See [Jzod documentation](../../../../jzod/README.md) for complete schema syntax.

### Common Patterns

#### Basic Attributes

Extend `entityDefinitionRoot` to get the standard `uuid` / `parentName` / `parentUuid` / `parentDefinitionVersionUuid` / `conceptLevel` attributes, then declare the domain attributes:

```json
{
  "type": "object",
  "extend": {
    "type": "schemaReference",
    "definition": {
      "eager": true,
      "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
      "relativePath": "entityDefinitionRoot"
    }
  },
  "definition": {
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

Entities with a non-UUID or composite `idAttribute` (e.g. External catalogue Entities) typically declare their key attributes explicitly instead of extending `entityDefinitionRoot`.

#### Relationships (Foreign Keys)

```json
{
  "author": {
    "type": "uuid",
    "tag": {
      "value": {
        "defaultLabel": "Author",
        "foreignKeyParams": {
          "targetEntity": "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
          "targetEntityOrderInstancesBy": "name"
        }
      }
    }
  }
}
```

`tag.value.foreignKeyParams.targetEntity` marks the attribute as a reference to an instance of another Entity. The UI uses it for pickers, Queries / combiners join on it.

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

## Entity Evolution

To evolve a concept, edit the **Entity** itself: add or alter attributes in its `mlSchema` (e.g. an optional `isbn` on Book), directly in the UI / JSON asset or through `alterEntityAttribute`. Keeping a history of model states is optional and covered in the [Versioning reference](../versioning.md).

---

## CRUD Operations

Entity model actions use endpoint `7947ae40-eb34-4149-887b-15a9021e714e` and act on the **Entity** only.

### Create Entity

```typescript
const createEntityAction: ModelActionCreateEntity = {
  actionType: "createEntity",
  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
  payload: {
    application: "<application-uuid>",
    entities: [
      {
        uuid: "new-entity-uuid",
        parentName: "Entity",
        parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
        name: "NewEntity",
        description: "Description",
        mlSchema: { type: "object", definition: { /* ... */ } },
      },
    ],
  },
};
```

`createEntity` takes complete Entity rows, `mlSchema` included.

### Read Entity

Entities are ordinary instances of the Entity meta-entity, in the `model` section:

```typescript
const entityExtractor: ExtractorByPrimaryKey = {
  extractorOrCombinerType: "extractorByPrimaryKey",
  applicationSection: "model",
  parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad", // Entity
  instanceUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5", // Book
};
```

### Update Entity

```typescript
const renameEntityAction: ModelActionRenameEntity = {
  actionType: "renameEntity",
  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
  payload: { application: "<application-uuid>", entityUuid: "…", targetValue: "NewName" },
};
```

Attribute-level changes use `alterEntityAttribute` (see `ModelActionAlterEntityAttribute` in the generated types).

### Delete Entity

```typescript
const dropEntityAction: ModelActionDropEntity = {
  actionType: "dropEntity",
  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
  payload: { application: "<application-uuid>", entityUuid: "…" },
};
```

`dropEntity` removes the Entity and its storage.

---

## Related Concepts

- **[Jzod Schema Language](../../../../jzod/README.md)** - Schema definition syntax
- **[Query API](query.md)** - Querying entity instances
- **[Action API](actions.md)** - Creating/updating entities
- **[Transformer API](transformers.md)** - Transforming entity data

---

**[← Back to API Reference](index.md)** | **[← Back to Documentation Index](../../index.md)**
