# Versioning Reference

**Audience:** framework contributors and application authors who need to understand how Miroir keeps the history of an application's **model**.
**Scope:** this page is the single reference for versioning: versioning modes, the freeze action, **EntityVersion** and the other `*Version` history concepts, the `modelVersion` store section, and the `scope` / `logicalDataModel` meta-model classification. Other pages only link here.

For the product vision (bundles, use cases, mapping from Git concepts), see [Bundles and Versioning](../getting-started/bundles-and-versioning.md).

---

## Key points

- Versioning applies to the **model** of an application (Entities, Queries, Reports, Menus, Endpoints, Runners, Themes, TransformerDefinitions), not to its data. Data changes are applied directly ("auto-commit").
- The live **Entity** is the only authoritative definition of a concept (`mlSchema`, `idAttribute`, view / cache fields, …). You never need an EntityVersion to define or use an Entity.
- History exists only for **versioned-internal** applications. It is written by the **`freezeApplicationVersion`** model action into a separate **`modelVersion`** store section.
- Ordinary model actions (`createEntity`, `renameEntity`, `alterEntityAttribute`, `dropEntity`, …) change live Entities only. They never create, update or delete history rows.

---

## Versioning modes

The mode is set on the application's **SelfApplication** row (`versioningMode`, with legacy `versioningEnabled`). It is not set in the process `features`.

| `versioningMode` | `versioningEnabled` | Store sections | Version History source |
|---|---|---|---|
| `unversioned` *(or absent)* | `false` | `admin`, `model`, `data` | None: live model only. Changes apply immediately, like in a spreadsheet (limited undo / redo only) |
| `versioned-internal` | `true` | `admin`, `model`, `data`, **`modelVersion`** (writable) | Miroir's `modelVersion` section; git assets under `*_modelVersion/` when shipped |
| `versioned-external` | `true` | `admin`, `model`, `data` (no writable `modelVersion`) | External Git / VCS. Only the current model is stored in Miroir (`*_model/` assets are committed like code) |
| bundled Miroir profile | `true` on SelfApplication row | `admin`, `model`, `data` only | **None in bundled store**: the sandbox demo is versioning-free |

Legacy deployments with `versioningEnabled: true` and no `versioningMode` behave as **`versioned-internal`**.

Current shipped deployments: Miroir (and the `appForTest` test application) are `versioned-internal`. Library, Admin, Postgres and Spotify are `unversioned` and ship no history rows.

UI: the Versioning AppBar item is shown only when the browsed application is `versioned-internal` (see [Process capabilities](process-capabilities.md)).

---

## Freezing an application version

```typescript
const freeze: ModelActionFreezeApplicationVersion = {
  actionType: "freezeApplicationVersion",
  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
  payload: {
    application: "<selfApplication uuid>",
    versionName: "1.2.0",
    description: "optional",
    branch: "<SelfApplicationModelBranch uuid, optional>",
  },
};
```

Freeze is refused unless the application is versioned (`assertApplicationVersioningEnabled`). It then writes, in `modelVersion`:

1. a new **SelfApplicationVersion**, chained to the previous version of the same application and branch (linear history; a duplicate `versionName` on the same branch is rejected);
2. a new, immutable snapshot of **every** live model element: EntityVersion, QueryVersion, ReportVersion, MenuVersion, EndpointVersion, RunnerVersion, ThemeVersion, TransformerDefinitionVersion. Each snapshot gets a **new** uuid and references its live element (`entityUuid`, `queryUuid`, …);
3. **ApplicationVersionCross\*** link rows tying the SelfApplicationVersion to each snapshot.

Implementation: `packages/miroir-core/src/1_core/versioning/applicationVersionFreeze.ts` (`buildFreezeApplicationVersionPlan`, `snapshotEntitiesAsHistoricalEntityVersions`, …). Consecutive EntityVersion snapshots can be diffed into rough migration candidates (`diffEntityVersionSnapshots`; rename vs drop+create is uuid-based).

---

## EntityVersion

An **EntityVersion** is an immutable snapshot of an Entity's present-model fields, taken at freeze time.

- **Entity:** `EntityVersion`, uuid `54b9c72f-d4f3-4db9-9e0e-0dc840b530bd` (`scope: "versioning"`). Its `mlSchema` is in `packages/miroir-test-app_deployment-miroir/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd.json`.
- **Instances:** only in the `modelVersion` section. The Miroir deployment ships some under `packages/miroir-test-app_deployment-miroir/assets/miroir_modelVersion/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/`, e.g. `381ab1be-…` (a snapshot of Entity) and `bdd7ad43-…` (the self-describing snapshot of EntityVersion).
- **Snapshotted fields** (`ENTITY_PRESENT_MODEL_DEFINITION_FIELDS`): `mlSchema`, `idAttribute`, `externalDataSource`, `viewAttributes`, `defaultInstanceDetailsReportUuid`, `icon`, `display`, `cache`, plus `name` and `conceptLevel`. Entity-only classification fields (`scope`, `logicalDataModel`, `selfApplication`, …) are not copied. Freeze fails for an Entity without `mlSchema`.

Abridged generated type:

```typescript
interface EntityVersion {
  uuid: string;                    // new uuid, minted at freeze
  parentName?: "EntityVersion";
  parentUuid: string;              // always 54b9c72f-d4f3-4db9-9e0e-0dc840b530bd
  name: string;                    // the Entity's name at freeze time
  entityUuid: string;              // the live Entity
  conceptLevel?: "MetaModel" | "Model" | "Data" | "External";
  description?: string;
  idAttribute?: string | string[];
  externalDataSource?: { kind?: "sql" | "http"; endpoint?: string; schema?: string; tableName?: string };
  defaultInstanceDetailsReportUuid?: string;
  viewAttributes?: string[];
  mlSchema: MlObject;            // deep copy of the Entity's mlSchema
}
```

Example (as written by a freeze of Library `Book`):

```json
{
  "uuid": "<new uuid>",
  "parentName": "EntityVersion",
  "parentUuid": "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
  "name": "Book",
  "entityUuid": "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
  "conceptLevel": "Model",
  "viewAttributes": ["name", "author", "year", "citation", "publisher", "uuid"],
  "mlSchema": { "...": "copy of Book's mlSchema at freeze time" }
}
```

Live Entity rows carry an informational `parentDefinitionVersionUuid` (e.g. `381ab1be-…` on Entity rows). It points at a historical EntityVersion and plays no role in routing or validation.

### Other `*Version` concepts

The same pattern (immutable snapshot + cross link row) applies to the other model elements:

| History Entity | uuid | Cross link Entity |
|---|---|---|
| SelfApplicationVersion | `c3f0facf-…` | — (the version itself) |
| EntityVersion | `54b9c72f-…` | ApplicationVersionCrossEntityVersion `8bec933d-…` |
| QueryVersion | `7f3a8b2c-…` | ApplicationVersionCrossQueryVersion `9e4c6d8a-…` |
| ReportVersion | `f1a2b3c4-…` | ApplicationVersionCrossReportVersion `f2b3c4d5-…` |
| MenuVersion | `a1b2c3d4-…` | ApplicationVersionCrossMenuVersion `b2c3d4e5-…` |
| EndpointVersion | `c2d3e4f5-…` | ApplicationVersionCrossEndpointVersion `d3e4f5a6-…` |
| RunnerVersion | `e5f6a7b8-…` | ApplicationVersionCrossRunnerVersion `f6a7b8c9-…` |
| ThemeVersion | `a7b8c9d0-…` | ApplicationVersionCrossThemeVersion `b8c9d0e1-…` |
| TransformerDefinitionVersion | `e1f2a3b4-…` | ApplicationVersionCrossTransformerDefinitionVersion `f2a3b4c5-…` |

These uuids are registered in `versionHistoryEntityUuids` (`packages/miroir-core/src/1_core/Model.ts`), which routes their instances to `modelVersion`.

---

## The `modelVersion` store section

`modelVersion` is an optional fourth section of a deployment, next to `admin`, `model` and `data`.

- It is present only for versioned-internal deployments, and must point at storage **separate** from `model`. It uses the same backend types.
- `getApplicationSection()` sends every `versionHistoryEntityUuids` instance to `modelVersion`, whatever the application. Live concepts (Entity, Query, Report, `Book`, …) stay in `model` / `data`.
- A request targeting `modelVersion` on a deployment that does not configure it fails explicitly. There is no fallback to `model` or `data`.
- History is not loaded during ordinary bootstrap / rollback of the live model.

**Asset folders:** `{prefix}_modelVersion/` maps to the section. Only `miroir-test-app_deployment-miroir` ships one (`miroir_modelVersion/`). See [Data Architecture — asset folders](data-architecture-deployments.md#deployment-package-asset-folders).

**Filesystem example** (Library integration tests):

```json
"modelVersion": {
  "emulatedServerType": "filesystem",
  "directory": "miroir-standalone-app/tests/tmp/library_modelVersion"
}
```

**PostgreSQL example** (distinct schema from the live model):

```json
"modelVersion": {
  "emulatedServerType": "sql",
  "connectionString": "postgres://postgres:postgres@localhost:5432/postgres",
  "schema": "library_modelVersion",
  "forceNullOptionalAttributeToUndefined": true
}
```

**IndexedDB / MongoDB:** same pattern, with a separate database name or an IndexedDB namespace suffixed `-modelVersion` (see `miroirConfig.test-emulatedServer-indexedDb.json` and `miroirConfig.test-emulatedServer-mongodb.json` in `miroir-standalone-app/tests/`).

| Backend | Writable `modelVersion` | Notes |
|---|---|---|
| `filesystem` | Yes | Primary tracer; separate directory per deployment |
| `sql` | Yes | Separate PostgreSQL schema |
| `indexedDb` | Yes | Separate IndexedDB database name |
| `mongodb` | Yes | Separate database name |
| `bundled` | **No** | Read-only demo. The bundled Miroir profile has no `modelVersion` key and omits history instances from `model` / `data`; history writes to a bundled section are rejected explicitly |

---

## Meta-model classification: `scope` and `logicalDataModel`

Two optional fields on meta-model **Entity** rows document the role an Entity concept plays in versioning. They classify the concept, not its instances. Application authors defining `Book` or `Author` do not set them.

| Field | Values | Default when absent | Meaning |
|-------|--------|---------------------|---------|
| `scope` | `versioning`, `modeling` | `modeling` | `versioning` marks version-history infrastructure (`EntityVersion`, `SelfApplicationVersion`, `*Version`, `ApplicationVersionCross*`). `modeling` is an ordinary live-model concept (`Query`, `Report`, `Book`, …) |
| `logicalDataModel` | `entity`, `manyToMany` | `entity` | `manyToMany` marks link / cross tables (`ApplicationVersionCross*`) |

```json
{ "name": "EntityVersion", "scope": "versioning" }
{ "name": "ApplicationVersionCrossEntityVersion", "scope": "versioning", "logicalDataModel": "manyToMany" }
{ "name": "Query" }
```

**Runtime behavior today:** section routing and freeze planning use the explicit `versionHistoryEntityUuids` registry. They do **not** read `Entity.scope` dynamically. The field is authoritative for model documentation, validation and tests (`entityMetaScope.unit.test.ts`); routing may be derived from it later. Framework changes that add a versioning Entity should set `scope: "versioning"` (plus `logicalDataModel: "manyToMany"` on cross tables) **and** register it in `versionHistoryEntityUuids`.

Do not confuse this with the unrelated `scope` (`"meta"` vs `"app"`) of `schemaChangeKind`, used for schema-revision fingerprints.

---

> **Historical note: EntityDefinition.** Until #217–#222, an Entity's structure lived in a separate **EntityDefinition** row (attribute first named `jzodSchema`, later `mlSchema`), and model actions "dual-wrote" both rows. EntityDefinition was renamed EntityVersion. The Entity became the authoritative present model, and EntityVersion became freeze-only history. The TypeScript alias `EntityDefinition = EntityVersion` is still exported but deprecated. Some code identifiers keep the old wording, e.g. the `entityDefinitionRoot` schema, `parentDefinitionVersionUuid` and the `entityDefinition_extractAttributes` transformer.

---

**Related:** [Entity API](api/entity.md) · [Defining Entities](../guides/developer/defining-entities.md) · [Data Architecture: Deployments](data-architecture-deployments.md) · [Bundles and Versioning](../getting-started/bundles-and-versioning.md)
