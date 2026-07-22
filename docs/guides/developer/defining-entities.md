# Defining Entities

**Audience:** application authors and tool builders who need to model domain concepts in Miroir.  
**Related:** [Core Concepts](../core-concepts.md) · [Entity API reference](../../reference/api/entity.md) · [Library tutorial](../../tutorials/library-tutorial.md) · Issues [#172](https://github.com/miroir-framework/miroir/issues/172)–[#176](https://github.com/miroir-framework/miroir/issues/176)

This guide is **use-case centric**: pick the situation that matches what you are trying to do, then follow the Entity / EntityDefinition shape that fits. It does not replace the meta-model tour in Core Concepts; it answers “which kind of Entity do I need?”

---

## Mental model (30 seconds)

| Piece | Role | Library example |
|-------|------|-----------------|
| **Entity** | Named concept in your domain | `Book` (`e8ba151b-…`) |
| **EntityDefinition** | Structure of that concept (`mlSchema`, PK, cache, …) | Book definition (`797dd185-…`) |
| **Instance** | One row / value of that concept | A specific book in `library_data/` |

- Entities live under `<app>_model/` (with EntityDefinitions).
- Instances live under `<app>_data/` (or an **external** store — see below).
- Most Library / Admin / Miroir meta Entities use a **UUID** primary key and a **`parentUuid`** on each instance pointing at the Entity. Other shapes exist when you integrate external systems or non-UUID identity.

```
Entity (Book)  ←── EntityDefinition (Book mlSchema, idAttribute, …)
      ↑
   instances (The Pragmatic Programmer, …)
```

---

## Use-case map

| You need to… | Pattern | Primary examples | Issues |
|--------------|---------|------------------|--------|
| Own a normal domain type end-to-end | Miroir-managed + UUID PK | Library `Book`, `Author`, `Publisher` | — |
| Browse / diagnose an external DB catalogue | `conceptLevel: "External"` + `externalDataSource` | Postgres app `tables`, `columns`, `schemata` | [#174](https://github.com/miroir-framework/miroir/issues/174) |
| Match an external natural key (not UUID) | `idAttribute: "<attr>"` | Non-UUID PK entities / tests | [#173](https://github.com/miroir-framework/miroir/issues/173) |
| Match a multi-column natural key | `idAttribute: ["a","b",…]` | Postgres `tables`, `columns` | [#176](https://github.com/miroir-framework/miroir/issues/176) |
| Import / sync instances that omit `parentUuid` | Optional `parentUuid`; resolve from action context | `domain_controller_no_parent_uuid_crud` | [#172](https://github.com/miroir-framework/miroir/issues/172) |
| Reflect a PK-less table | Explicit PK-less handling; refresh flushes cache | External tables without PK | [#175](https://github.com/miroir-framework/miroir/issues/175) |

---

## Use case 1 — Own a domain concept (Library Books)

**When:** You are building an application Miroir stores and edits (Library, Admin configuration objects, Miroir meta-model types). You want create / update / delete, Reports, Queries, and Actions.

**What to define**

1. An **Entity** with `conceptLevel: "Model"` (or omit; data instances are implicitly data-level).
2. An **EntityDefinition** whose `entityUuid` points at that Entity, with an `mlSchema` for attributes and relationships.
3. Default PK: leave `idAttribute` absent → **`uuid`**.
4. Instances carry `uuid` and usually `parentUuid` = Entity uuid.

**Entity (Library Book)** — `packages/miroir-test-app_deployment-library/assets/library_model/16dbfe28-…/e8ba151b-….json`:

```json
{
  "uuid": "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
  "parentUuid": "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
  "name": "Book",
  "conceptLevel": "Model",
  "description": "A book."
}
```

**EntityDefinition (excerpt)** — Book `mlSchema` adds domain fields; identity / parent fields come from the shared `entityDefinitionRoot` extension:

```json
{
  "entityUuid": "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
  "name": "Book",
  "conceptLevel": "Model",
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

**Practical tips**

- Prefer **optional** new attributes when existing instances lack values (Library tutorial ISBN example).
- Put list columns in `viewAttributes`.
- Use `defaultInstanceDetailsReportUuid` when a details Report already exists.
- Same pattern applies to **Admin** (`SelfApplication`, deployments, …) and **Miroir** meta Entities (`Query`, `Report`, `Entity` itself) — still UUID-backed and Miroir-managed.

---

## Use case 2 — Read an external datasource (Postgres catalogue)

**When:** Instances are not owned by Miroir’s store. You need to **inspect** (and typically not CUD) rows that already live in another system. The motivating product case is the **Postgres manager** app reading `information_schema` / `pg_catalog`.

**What to define**

1. Entity with **`conceptLevel: "External"`**.
2. EntityDefinition with:
   - matching `conceptLevel: "External"`,
   - **`externalDataSource`** (e.g. `{ "schema": "information_schema" }`),
   - an **`idAttribute`** that matches the physical key (often composite),
   - `mlSchema` attributes marked non-editable in the UI when read-only.
3. Application / deployment constraints: apps that need external entities may restrict which storage backends can host them; deployment must supply access directives (schema, etc.). **CUD on external instances fails** by design ([#174](https://github.com/miroir-framework/miroir/issues/174)).

**Entity** — Postgres `columns`:

```json
{
  "uuid": "…",
  "name": "columns",
  "conceptLevel": "External",
  "description": "The columns of a PostgreSQL schema."
}
```

**EntityDefinition** — Postgres `tables` (composite PK + external source):

```json
{
  "entityUuid": "35961086-f932-477a-aa77-ac8360ffbf61",
  "conceptLevel": "External",
  "name": "tables",
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

**Also see:** test extract `simplified-library-model-with-external-entity.json` (Library + `pg_namespace` External Entity) and `Runner_ExternalEntity.integ.test.tsx`.

---

## Use case 3 — Non-UUID primary key

**When:** The natural identity is not a UUID (integer `oid`, business `code`, table name, …). Default Miroir Entities keep `uuid`; override with **`idAttribute`** on the EntityDefinition ([#173](https://github.com/miroir-framework/miroir/issues/173)).

| `idAttribute` | Meaning |
|---------------|---------|
| absent / `"uuid"` | Default UUID PK (Library Book) |
| `"code"` (string) | Single non-UUID PK |
| `["a","b"]` | Composite PK — next section |

Helpers live in `packages/miroir-core/src/1_core/EntityPrimaryKey.ts`:

- `getEntityPrimaryKeyAttribute` / `getEntityPrimaryKeyAttributes`
- `getInstancePrimaryKeyValue`
- `entityHasUuidPrimaryKey` / `entityHasCompositePrimaryKey`

**Implication:** some flows (especially “create new instance” UX) may be disabled or constrained when UUID generation is not applicable — treat create carefully for externally keyed entities.

---

## Use case 4 — Composite primary key

**When:** Uniqueness spans several columns (classic SQL catalogue keys).

**What to set:** `idAttribute: string[]` on the EntityDefinition.

**Examples (Postgres app)**

| Entity | `idAttribute` |
|--------|----------------|
| `schemata` | `["catalog_name", "schema_name"]` |
| `tables` | `["table_catalog", "table_schema", "table_name"]` |
| `columns` | `["table_catalog", "table_schema", "table_name", "column_name"]` |

**Platform behavior** ([#176](https://github.com/miroir-framework/miroir/issues/176), plan under `code-helpers/features/176-FEATURE- support tables & entities with composite PK/`):

- Composite keys are **serialized** to a single string for LocalCache / filesystem / IndexedDB indexing (`|` separator, `\` escaping).
- SQL stores use multi-column `WHERE` / primary-key columns.
- Combiner FK attributes may be `string | string[]` for multi-attribute joins.
- Prefer MiroirTest suite `domain_controller_composite_pk_crud` for regression ([testing reference](../../reference/testing.md)).

---

## Use case 5 — Instances without `parentUuid`

**When:** Integrating payloads or stores that do not stamp every row with Miroir’s Entity uuid ([#172](https://github.com/miroir-framework/miroir/issues/172)).

**Intent:** keep instances “self-sufficient” when `parentUuid` is present, but allow it to be **optional**. The platform must still know which Entity an instance belongs to (action payload / collection context). If that mapping is lost, surface the constraint explicitly.

**Resolution order** (see helpers in `EntityPrimaryKey.ts`):

1. `instance.parentUuid` if present  
2. Else parent from the surrounding action / collection context  
3. Else fail with an explicit error  

**Regression:** MiroirTest suite `domain_controller_no_parent_uuid_crud` (legacy vitest: `DomainController.integ.noParentUuid.CRUD.test.tsx`).

**Authoring tip:** for greenfield Library-style models, keep `parentUuid` on instances — it remains the simplest debugging story. Omit it only when an integration requires it.

---

## Use case 6 — Entities / tables without a primary key

**When:** External (or imported) tables have **no** reliable PK ([#175](https://github.com/miroir-framework/miroir/issues/175)).

**Target behavior**

- Represent EntityDefinitions that are explicitly PK-less (absence of `idAttribute` alone is **not** enough — that still defaults to `uuid`).
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

Entity files are keyed by the **Entity** uuid under the Entity’s parent Entity folder (`16dbfe28-…` for Entity). EntityDefinition files live under the EntityDefinition Entity folder (`54b9c72f-…`) and reference `entityUuid`.

---

## Related reading

- [Core Concepts — Entity & EntityDefinition](../core-concepts.md#entity--entitydefinition)
- [Entity & EntityDefinition API](../../reference/api/entity.md)
- [Library tutorial — editing Book](../../tutorials/library-tutorial.md)
- [Creating applications](creating-applications.md) (placeholder; links here)
- Feature notes: `code-helpers/features/173-FEATURE- enable non-uuid primary keys for Entities/plan.md`, `code-helpers/features/176-FEATURE- support tables & entities with composite PK/plan.md`
- Copilot / agent summary of PK helpers: `.github/copilot-instructions.md` (“Primary Key Support”)
