# Defining Entities

**Audience:** application authors and tool builders who need to model domain concepts in Miroir.  
**Related:** [Core Concepts](../core-concepts.md) · [Entity API reference](../../reference/api/entity.md) · [Library tutorial](../../tutorials/library-tutorial.md)

This guide is **use-case centric**: pick the situation that matches what you are trying to do, then follow the Entity shape that fits. It does not replace the meta-model tour in Core Concepts; it answers “which kind of Entity do I need?”

---

## Mental model (30 seconds)

| Piece | Role | Library example |
|-------|------|-----------------|
| **Entity** | Named concept in your domain **and** its structure (`mlSchema`, PK, view / cache fields, …) | `Book` (`e8ba151b-…`) |
| **Instance** | One row / value of that concept | A specific book in `library_data/` |

- Entities live under `<app>_model/16dbfe28-…/` (the Entity meta-entity folder), and their `parentUuid` is that Entity meta-entity `16dbfe28-…`. That single file is all you need to define a concept.
- Instances live under `<app>_data/<entityUuid>/` (or an **external** store — see below).
- Most Library / Admin / Miroir meta Entities use a **UUID** primary key and a **`parentUuid`** on each instance pointing at the Entity. Other shapes exist when you integrate external systems or non-UUID identity.
- Keeping a history of the model is optional and independent of this guide; see the [Versioning reference](../../reference/versioning.md).

```
Entity (Book, mlSchema)
      ↑
   instances (The Pragmatic Programmer, …)
```

**Good to know**

- `conceptLevel` is `MetaModel` | `Model` | `Data` | **`External`** (Use case 2).
- **Absent `idAttribute` ⇒ default `uuid` PK.** It does not mean "no primary key" (Use case 6).
- `uuid` and `parentUuid` on every instance is the default UUID-PK path. Non-UUID / composite PKs (Use cases 3–4) and optional `parentUuid` (Use case 5) relax it.

---

## Use-case map

| You need to… | Pattern | Primary examples |
|--------------|---------|------------------|
| Own a normal domain type end-to-end | Miroir-managed + UUID PK | Library `Book`, `Author`, `Publisher` |
| Browse / diagnose an external DB catalogue | `conceptLevel: "External"` + `externalDataSource` | Postgres app `tables`, `columns`, `schemata` |
| Match an external natural key (not UUID) | `idAttribute: "<attr>"` | Non-UUID PK entities / tests |
| Match a multi-column natural key | `idAttribute: ["a","b",…]` | Postgres `tables`, `columns` |
| Import / sync instances that omit `parentUuid` | Optional `parentUuid`; resolve from action context | `domain_controller_no_parent_uuid_crud` |
| Reflect a PK-less table | Explicit PK-less handling; refresh flushes cache | External tables without PK |

---

## Use case 1 — Own a domain concept (Library Books)

**When:** You are building an application Miroir stores and edits (Library, Admin configuration objects, Miroir meta-model types). You want create / update / delete, Reports, Queries, and Actions.

**What to define**

1. An **Entity** with `parentUuid` = `16dbfe28-…` (the Entity meta-entity) and `conceptLevel: "Model"`.
2. Its **`mlSchema`** for attributes and relationships, on the Entity itself.
3. Default PK: leave `idAttribute` absent → **`uuid`**.
4. Instances carry `uuid` and usually `parentUuid` = Entity uuid (`e8ba151b-…` for a Book).

**Entity (Library Book, excerpt)** — `packages/miroir-test-app_deployment-library/assets/library_model/16dbfe28-…/e8ba151b-….json`. The `mlSchema` adds domain fields; identity / parent fields come from the shared `entityDefinitionRoot` extension:

```json
{
  "uuid": "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
  "parentName": "Entity",
  "parentUuid": "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
  "name": "Book",
  "conceptLevel": "Model",
  "description": "A book.",
  "viewAttributes": ["name", "author", "year", "publisher", "uuid"],
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
      "name": {
        "type": "string",
        "tag": { "value": { "defaultLabel": "Book Title" } }
      },
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

**Relationships:** declare FKs with `foreignKeyParams.targetEntity` (Author, Publisher). The UI uses that for pickers and ordering; Queries/combiners join on the same attributes.

**Virtual attributes:** mark an `mlSchema` field with `tag.value.virtualAttribute` (inline transformer). The value is computed from **that instance’s stored fields only** — never a JOIN, never persisted, only when a query or report requires the name. See [Entity API — Virtual attributes](../../reference/api/entity.md#virtual-attributes).

**Practical tips**

- Prefer **optional** new attributes when existing instances lack values (Library tutorial ISBN example).
- Put list columns in `viewAttributes`.
- Use `defaultInstanceDetailsReportUuid` when a details Report already exists.
- Same pattern applies to **Admin** (`SelfApplication`, deployments, …) and **Miroir** meta Entities (`Query`, `Report`, `Entity` itself) — still UUID-backed and Miroir-managed.

---

## Use case 2 — Read an external datasource (Postgres catalogue)

**When:** Instances are not owned by Miroir’s store. You need to **inspect** (and typically not CUD) rows that already live in another system. The motivating product case is the **Postgres manager** app reading `information_schema` / `pg_catalog`.

**What to define** — a single Entity with:

1. **`conceptLevel: "External"`**,
2. **`externalDataSource`** (e.g. `{ "schema": "information_schema" }`; `kind: "http"` + `endpoint` for data served by an external HTTP Endpoint; `tableName` when it differs from the Entity name),
3. an **`idAttribute`** that matches the physical key (often composite),
4. `mlSchema` attributes marked non-editable in the UI when read-only (External Entities usually do **not** extend `entityDefinitionRoot`, since their rows have no `uuid` / `parentUuid`).

Application / deployment constraints: apps that need external entities may restrict which storage backends can host them; deployment must supply access directives (schema, etc.). **CUD on external instances fails** by design.

**Entity** — Postgres `tables` (composite PK + external source), abridged from `packages/miroir-test-app_deployment-postgres/assets/postgres_model/16dbfe28-…/35961086-….json`:

```json
{
  "uuid": "35961086-f932-477a-aa77-ac8360ffbf61",
  "parentName": "Entity",
  "parentUuid": "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
  "name": "tables",
  "conceptLevel": "External",
  "description": "The tables of a PostgreSQL schema.",
  "idAttribute": ["table_catalog", "table_schema", "table_name"],
  "externalDataSource": { "schema": "information_schema" },
  "cache": { "cacheAllInstancesOnRefresh": true },
  "mlSchema": {
    "type": "object",
    "definition": {
      "table_schema": { "type": "string", "tag": { "value": { "display": { "editable": false } } } },
      "table_name": { "type": "string", "tag": { "value": { "display": { "editable": false } } } },
      "table_catalog": { "type": "string", "tag": { "value": { "display": { "editable": false } } } },
      "table_type": { "type": "string", "tag": { "value": { "display": { "editable": false } } } }
    }
  }
}
```

The `columns` Entity (`39e5c7a1-…`) follows the same pattern with a four-attribute key.

**Also see:** test extract `packages/miroir-standalone-app/tests/assets/library_extract/simplified-library-model-with-external-entity.json` (Library + `pg_namespace` External Entity) and `Runner_ExternalEntity.integ.test.tsx`.

---

## Use case 3 — Non-UUID primary key

**When:** The natural identity is not a UUID (integer `oid`, business `code`, table name, …). Default Miroir Entities keep `uuid`; override with **`idAttribute`** on the Entity.

| `idAttribute` | Meaning |
|---------------|---------|
| absent / `"uuid"` | Default UUID PK (Library Book) |
| `"code"` (string) | Single non-UUID PK |
| `["a","b"]` | Composite PK — next section |

Helpers live in `packages/miroir-core/src/1_core/Entity/EntityPrimaryKey.ts`:

- `getEntityPrimaryKeyAttribute` / `getEntityPrimaryKeyAttributes`
- `getInstancePrimaryKeyValue`
- `entityHasUuidPrimaryKey` / `entityHasCompositePrimaryKey`

**Implication:** some flows (especially “create new instance” UX) may be disabled or constrained when UUID generation is not applicable — treat create carefully for externally keyed entities.

---

## Use case 4 — Composite primary key

**When:** Uniqueness spans several columns (classic SQL catalogue keys).

**What to set:** `idAttribute: string[]` on the Entity.

**Examples (Postgres app)**

| Entity | `idAttribute` |
|--------|----------------|
| `schemata` | `["catalog_name", "schema_name"]` |
| `tables` | `["table_catalog", "table_schema", "table_name"]` |
| `columns` | `["table_catalog", "table_schema", "table_name", "column_name"]` |

**Platform behavior** (see plan under `code-helpers/features/176-FEATURE- support tables & entities with composite PK/`):

- Composite keys are **serialized** to a single string for LocalCache / filesystem / IndexedDB indexing (`|` separator, `\` escaping).
- SQL stores use multi-column `WHERE` / primary-key columns.
- Combiner FK attributes may be `string | string[]` for multi-attribute joins.
- Prefer MiroirTest suite `domain_controller_composite_pk_crud` for regression ([testing reference](../../reference/testing.md)).

---

## Use case 5 — Instances without `parentUuid`

**Status:** implemented for CRUD and covered by tests; tracking issue [#172](https://github.com/miroir-framework/miroir/issues/172) is still open.

**When:** Integrating payloads or stores that do not stamp every row with Miroir’s Entity uuid.

**Intent:** keep instances “self-sufficient” when `parentUuid` is present, but allow it to be **optional** (`EntityInstance.parentUuid` is optional in the generated types). The platform must still know which Entity an instance belongs to (action payload / collection context). If that mapping is lost, surface the constraint explicitly.

**Resolution order** (`resolveInstanceParentUuid` in `packages/miroir-core/src/1_core/Entity/EntityPrimaryKey.ts`):

1. `instance.parentUuid` if present  
2. Else parent from the surrounding action / collection context  
3. Else fail with an explicit error (`FailedToResolveParentUuid`)  

**Regression:** MiroirTest suite `domain_controller_no_parent_uuid_crud`.

**Authoring tip:** for greenfield Library-style models, keep `parentUuid` on instances — it remains the simplest debugging story. Omit it only when an integration requires it.

---

## Use case 6 — Entities / tables without a primary key

**Status:** not implemented yet — [#175](https://github.com/miroir-framework/miroir/issues/175) is open. There is currently no way to declare a PK-less Entity.

**When:** External (or imported) tables have **no** reliable PK.

**Target behavior**

- Represent Entities that are explicitly PK-less (absence of `idAttribute` alone is **not** enough — that still defaults to `uuid`).
- On refresh, **flush** in-memory contents for that Entity so incoming rows replace the previous set (avoids duplicate ghost rows).
- Editing PK-less instances in Miroir UI is out of scope for now.

Treat this as a specialized external-read pattern; prefer adding a real / composite PK when the source allows it.

---

## Choosing a shape (decision checklist)

1. **Who owns the rows?** Miroir store → Use case 1. External DB/API → Use case 2 (+ 3/4/6 as needed).
2. **What identifies a row?** UUID → default. One natural attribute → Use case 3. Several → Use case 4. None → Use case 6.
3. **Must instances carry `parentUuid`?** Prefer yes for owned data; optional only for Use case 5 integrations.
4. **Will users create/update rows?** Owned UUID entities: yes. External: expect **read-only** CUD failure.
5. **Does the Application require a specific storage kind?** External catalogue apps may only deploy where the datasource exists (e.g. Postgres).

---

## File layout reminder

| App | Model tree | Data tree |
|-----|------------|-----------|
| Library | `…/library_model/` | `…/library_data/` |
| Admin | `…/admin_model/` | `…/admin_data/` |
| Miroir | `…/miroir_model/` | `…/miroir_data/` |
| Postgres manager | `…/postgres_model/` | external / cache |

Entity files are keyed by the **Entity** uuid under the Entity’s parent Entity folder (`16dbfe28-…` for Entity). Instance files are keyed by instance uuid under `<app>_data/<entityUuid>/`.

---

## Related reading

- [Core Concepts — Entity](../core-concepts.md#entity)
- [Entity API](../../reference/api/entity.md)
- [Versioning reference](../../reference/versioning.md) — model history, `scope` / `logicalDataModel`
- [Library tutorial — editing Book](../../tutorials/library-tutorial.md)
- [Creating applications](creating-applications.md) and [Integration](integration.md) (placeholders; until they are written, this guide is the narrative for defining Entities and for External Entities over external databases)
- Feature notes: `code-helpers/features/173-FEATURE- enable non-uuid primary keys for Entities/plan.md`, `code-helpers/features/176-FEATURE- support tables & entities with composite PK/plan.md`
- Agent summary of PK helpers: `AGENTS.md` (“Primary Key Support”)
