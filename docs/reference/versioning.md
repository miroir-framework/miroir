# Versioning Reference

**Audience:** framework contributors and application authors who need to understand how Miroir keeps the history of an application's **model**.
**Scope:** this page is the single reference for versioning: versioning modes, the freeze action, evolution traces, **EntityVersion** and the other `*Version` history concepts, the `modelVersion` store section, and the `scope` / `logicalDataModel` meta-model classification. Other pages only link here.

For the product vision (bundles, use cases, mapping from Git concepts), see [Bundles and Versioning](../getting-started/bundles-and-versioning.md).

---

## Key points

- Versioning applies to the **model** of an application (Entities, Queries, Reports, Menus, Endpoints, Runners, Themes, TransformerDefinitions), not to its data. Data changes are applied directly ("auto-commit").
- The live **Entity** is the only authoritative definition of a concept (`mlSchema`, `idAttribute`, view / cache fields, …). You never need an EntityVersion to define or use an Entity.
- Frozen versions exist only for **versioned-internal** applications. They are written by the **`freezeApplicationVersion`** model action into a separate **`modelVersion`** store section.
- A versioned application (internal or Git) can also keep **evolution traces**: one record per commit of its model, in `modelVersion`. See [Evolution traces](#evolution-traces).
- Ordinary model actions (`createEntity`, `renameEntity`, `alterEntityAttribute`, `dropEntity`, …) change live Entities only. They never create, update or delete history rows.
- The code that freezes and records evolution traces is the package `@miroir-framework/versioning`, outside core. A process loads it on first use, only when its `versioning` process capability is on (the default). See [The versioning package](#the-versioning-package).

---

## Versioning modes

The mode is set on the application's **SelfApplication** row (`versioningMode`, with legacy `versioningEnabled`). It is not set in the process `features`.

| `versioningMode` | `versioningEnabled` | Store sections | Version History source |
|---|---|---|---|
| `unversioned` *(or absent)* | `false` | `admin`, `model`, `data` | None: live model only. Changes apply immediately, like in a spreadsheet (limited undo / redo only) |
| `versioned-internal` | `true` | `admin`, `model`, `data`, **`modelVersion`** (writable) | Miroir's `modelVersion` section; git assets under `*_modelVersion/` when shipped |
| `versioned-git` | `true` | `admin`, `model`, `data`; **`modelVersion`** when evolution traces are on | Git. The model (`*_model/` assets) is committed like code; no in-app freeze. With traces on, the `*_modelVersion/` folder holds the trace records and is committed with the model |
| bundled Miroir profile | `true` on SelfApplication row | `admin`, `model`, `data` only | **None in bundled store**: the sandbox demo is versioning-free |

Legacy deployments with `versioningEnabled: true` and no `versioningMode` behave as **`versioned-internal`**. `versioned-external`, the name of `versioned-git` before #708, is still read as `versioned-git` for one release.

Current shipped deployments: Miroir (and the `appForTest` test application) are `versioned-internal`. Library, Admin, Postgres, Spotify and GitHub are `unversioned` and ship no history rows.

UI: the Versioning AppBar item is shown only when the process has the `versioning` capability and the browsed application is `versioned-internal` (see [Process capabilities](process-capabilities.md#versioning-per-application)).

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

Freeze is refused with `FeatureUnavailable` when the process has the `versioning` capability off, then unless the application is versioned (`assertApplicationVersioningEnabled`). It then writes, in `modelVersion`:

1. a new **SelfApplicationVersion**, chained to the previous version of the same application and branch (linear history; a duplicate `versionName` on the same branch is rejected);
2. a new, immutable snapshot of **every** live model element: EntityVersion, QueryVersion, ReportVersion, MenuVersion, EndpointVersion, RunnerVersion, ThemeVersion, TransformerDefinitionVersion, MlSchemaVersion, MiroirTestVersion, BlobVersion, TestConfigurationVersion, TestVersion. Each snapshot gets a **new** uuid and references its live element (`entityUuid`, `queryUuid`, …);
3. **ApplicationVersionCross\*** link rows tying the SelfApplicationVersion to each snapshot.

When the application's evolution traces are on, the freeze then appends a `version` record to the trace chain (see below).

Implementation: `packages/miroir-versioning/src/applicationVersionFreeze.ts` (`buildFreezeApplicationVersionPlan`, `snapshotEntitiesAsHistoricalEntityVersions`, …) and `freezeApplicationVersion.ts` (the action). Consecutive EntityVersion snapshots can be diffed into rough migration candidates (`diffEntityVersionSnapshots`; rename vs drop+create is uuid-based).

---

## Evolution traces

An evolution trace is the ordered list of model changes of an application, one **EvolutionTraceRecord** (Entity `854c47bd-af74-4305-bdea-aa6bddfa8899`) per commit, in the application's `modelVersion` section.

- **Switch:** `evolutionTraces: true` on the application's SelfApplication row. It is read as off on an `unversioned` application, which logs a warning at load. It has no process-wide switch.
- **What a record holds:** `sequenceNumber` (1, 2, … per application), `previousTrace` (the uuid of the record before; none on the first), `kind`, `timestamp`, and for a commit the ordered model Actions it replayed for that application (`createEntity`, `alterEntityAttribute`, `renameEntity`, `dropEntity`, and the instance writes of model elements), `commitUuid` (shared by the records of one commit), and `complete` (false when the commit stopped part way). There is no per-branch root row.
- **Kinds:** `commit` (a commit, or a model write made outside a transaction, which is its own commit), `version` (a freeze; `version` holds the SelfApplicationVersion uuid), `rebaseline` (after `resetModel` or `initModel`; `resetModel` empties `modelVersion`, so the chain restarts at 1).
- **Who writes them:** the DomainController that runs the commit sends the internal ModelEndpoint action `appendEvolutionTraceRecord`, which the package stores in the persistence process. A write the REST server receives from another DomainController's persistence layer is recorded by its sender, not twice.
- **Gate:** with traces on, a commit, a direct model write, `resetModel` or `initModel` is refused before anything is written when the process has the `versioning` capability off (`FeatureUnavailable`), or when the application's Deployment row has no `modelVersion` section.
- **A failed append:** the commit is kept, its result lists the application under `evolutionTraceAppendFailures`, and the record is kept in memory and sent before the next record of that application.
- **Reading them:** the Miroir menu item **Miroir Evolution Trace Records** (Reports `EvolutionTraceRecordList` `45735607-…` and `EvolutionTraceRecordDetails` `68594192-…`, section `modelVersion`), or any Query with `extractorInstancesByEntity` on the Entity in `modelVersion` (the client cache does not hold `modelVersion`: use `queryExecutionStrategy: "storage"`).

Code: `packages/miroir-core/src/1_core/versioning/evolutionTraceRecording.ts` (what is recorded, `isEvolutionTraceOn`), the DomainController (commit, gate, kept records), `packages/miroir-versioning/src/evolutionTraceRecords.ts` (the chain).

---

## The versioning package

`@miroir-framework/versioning` (`packages/miroir-versioning`) holds the freeze and the writer of evolution trace records. Core keeps what other packages name without running it: the action types and payload types, the version Entity uuids, the versioning modes, the section routing (`getApplicationSection`) and the trace switch (`isEvolutionTraceOn`). No host imports the package statically:

- A host registers it with core's `registerLazyActionImplementations({ capability: "versioning", packageName, implementationNames, load: () => import("@miroir-framework/versioning") })`: `startMiroirNode` (server, Electron main, CLI), `startMiroirClient` when it runs an emulated server, and `setupMiroirTest` (option `versioningLoader`). A browser talking to a server registers nothing and never fetches the package.
- The ModelEndpoint's freeze and `appendEvolutionTraceRecord` actions declare `requiredCapability: "versioning"` on their `libraryImplementation`. The DomainController checks the capability, then loads the package on first use; a process where it is not registered answers `FeatureUnavailable` naming the package.
- **Where the freeze runs:** always in the persistence process. A client talking to a server checks the capability, refuses the freeze while its open transaction holds changes of any application (commit or roll them back first: the reload that follows empties the whole transaction), sends it to the server, then reloads the application. The server plans the freeze against the application's model read from its stores, and Miroir's against its local cache, loaded from the stores (the bundled Miroir model would miss its saved changes).
- **Traces:** a commit of an application whose traces are on sends `appendEvolutionTraceRecord`, which runs in the persistence process like the freeze. Applications with traces off load nothing.
- With the capability off, the Versioning AppBar item, the freeze Runner and the version and trace items of the Miroir menu are hidden, MCP tools, CLI commands and CopilotKit actions leave out `freezeApplicationVersion`, and MiroirTests tagged `versioning` are reported as skipped.

---

## EntityVersion

An **EntityVersion** is an immutable snapshot of an Entity's present-model fields, taken at freeze time.

- **Entity:** `EntityVersion`, uuid `54b9c72f-d4f3-4db9-9e0e-0dc840b530bd` (`scope: "versioning"`). Its `mlSchema` is in `packages/miroir-app-miroir/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd.json`.
- **Instances:** only in the `modelVersion` section. The Miroir deployment ships some under `packages/miroir-app-miroir/assets/miroir_modelVersion/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/`, e.g. `381ab1be-…` (a snapshot of Entity) and `bdd7ad43-…` (the self-describing snapshot of EntityVersion).
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
| MlSchemaVersion | `426cd199-…` | ApplicationVersionCrossMlSchemaVersion `da27d98d-…` |
| MiroirTestVersion | `a2b1c33a-…` | ApplicationVersionCrossMiroirTestVersion `81af0bd1-…` |
| BlobVersion | `4fbc43fa-…` | ApplicationVersionCrossBlobVersion `28ed918a-…` |
| TestConfigurationVersion | `9b0f81d3-…` | ApplicationVersionCrossTestConfigurationVersion `8bd811bf-…` |
| TestVersion | `fe94c683-…` | ApplicationVersionCrossTestVersion `be1d3cf3-…` |

An MlSchema without a `definition` is snapshotted without one, since the live row allows it; a MiroirTest without a `definition` makes the freeze fail, like the other elements. A MiroirTestVersion also keeps the test's `skip`, `tags` and `issue`.

The MetaModel has no collection for Blobs, TestConfigurations and Tests, so the freeze reads them from the store: Miroir's `data` section, or the `model` section of another application. Their snapshot copies every attribute of the live row except its identity (`uuid`, `parentUuid`, `parentName`, `parentDefinitionVersionUuid`, `conceptLevel`), and links back with `blobUuid`, `testConfigurationUuid` or `testUuid`. A BlobVersion copies the Blob's `contents`, so each freeze stores the Blob's data again.

These uuids are registered in `versionHistoryEntityUuids` (`packages/miroir-core/src/1_core/Model.ts`), which routes their instances to `modelVersion`.

---

## The `modelVersion` store section

`modelVersion` is an optional fourth section of a deployment, next to `admin`, `model` and `data`.

- It is present for versioned-internal deployments, and for versioned-git deployments whose evolution traces are on (it then holds only the trace records). It must point at storage **separate** from `model`, and uses the same backend types.
- `getApplicationSection()` sends every `versionHistoryEntityUuids` instance to `modelVersion`, whatever the application. Live concepts (Entity, Query, Report, `Book`, …) stay in `model` / `data`.
- A request targeting `modelVersion` on a deployment that does not configure it fails explicitly. There is no fallback to `model` or `data`.
- History is not loaded in the client cache during ordinary bootstrap / rollback of the live model.

**Asset folders:** `{prefix}_modelVersion/` maps to the section. Only `miroir-app-miroir` ships one (`miroir_modelVersion/`). See [Data Architecture — asset folders](data-architecture-deployments.md#deployment-package-asset-folders).

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

**IndexedDB / MongoDB:** same pattern, with a separate database name or an IndexedDB namespace suffixed `-modelVersion` (see `environments/test-indexedDb.json` and `environments/test-mongodb.json`: the modelVersion section adds `_modelVersion`).

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

> **Historical note: EntityDefinition.** Until #217–#222, an Entity's structure lived in a separate **EntityDefinition** row (attribute renamed over time, now `mlSchema`), and model actions "dual-wrote" both rows. EntityDefinition was renamed EntityVersion. The Entity became the authoritative present model, and EntityVersion became freeze-only history. The TypeScript alias `EntityDefinition = EntityVersion` is still exported but deprecated. Some code identifiers keep the old wording, e.g. the `entityDefinitionRoot` schema, `parentDefinitionVersionUuid` and the `entityDefinition_extractAttributes` transformer.

---

**Related:** [Entity API](api/entity.md) · [Defining Entities](../guides/developer/defining-entities.md) · [Data Architecture: Deployments](data-architecture-deployments.md) · [Bundles and Versioning](../getting-started/bundles-and-versioning.md)
