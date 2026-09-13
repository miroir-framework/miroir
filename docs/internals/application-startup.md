# Application startup (cache load)

How the client DomainController fills Redux after the process is up. Operators choose `emulateServer` and store backends in `miroirConfig`; they do not set `persistenceStoreAccessMode` in JSON. For that distinction and for process feature flags, see [Data architecture: deployments](../reference/data-architecture-deployments.md#application-startup-sequence) and [Process capabilities](../reference/process-capabilities.md).

## Domain controller pair

When `emulateServer: true`, two domain controllers exist in one process:

| Controller | `persistenceStoreAccessMode` | Role |
|---|---|---|
| CLIENT | `"remote"` | Redux / Zustand local cache. Persistence calls leave through `RestClientStub` (or HTTP / IPC in other shapes). |
| SERVER | `"local"` | Owns filesystem, IndexedDB, bundled, SQL, Mongo factories. Reads and writes. |

`emulateServer: false` keeps only the remote client in the browser; the `local` controller lives in `miroir-server`.

## `fetchMiroirAndAppConfigurations` flow

Called from `DemoInitializer` (sandbox) or `usePageConfiguration({ autoFetchOnMount: true })` (standalone):

```
Step 1: Rollback Admin
  CLIENT.handleAction("rollback", application=adminSelfApplication)
  → loadConfigurationFromPersistenceStore(admin, ADMIN_DEPLOYMENT_UUID)
    → Read MODEL section for all metaModelEntities
       (Entity, EntityVersion, Report, Menu, SelfApplication, SelfApplicationVersion,
        SelfApplicationModelBranch, EndpointVersion, QueryVersion, Runner, Theme)
    → Read DATA section for all application-specific entities
       (Application, Deployment, ViewParams, StoreBasedConfiguration, Import, …)
    → loadNewInstancesInLocalCache → CLIENT Redux populated

Step 2: Query deployments
  CLIENT.handleQueryTemplateActionForServerONLY(query for Deployment instances, section="data")
  → Returns [deployment_Admin, deployment_Miroir, deployment_Library, …]
    each with a `configuration` field (StoreUnitConfiguration per section)

Step 3: For each non-admin deployment:
  For each deployment (e.g. Miroir, Library):
    a. CLIENT.handleAction("storeManagementAction_openStore", configuration=deployment.configuration)
       → SERVER opens the store (idempotent if already open)
    b. CLIENT.handleAction("rollback", application=deployment.selfApplication)
       → loadConfigurationFromPersistenceStore(miroir/app, deploymentUuid)
         → For Miroir: read miroirModelEntities (Entity MetaModel peers) from MODEL
                        read non-Version History concepts from DATA
                        read Version History from MODELVERSION when section is configured
         → For App: read metaModelEntities from MODEL, read app entities from DATA
       → CLIENT Redux further populated
```

After all three steps, CLIENT Redux contains:

- All admin entities / reports / menus / configurations
- All Miroir meta-model instances
- All application domain instances

## `loadConfigurationFromPersistenceStore` detail

```typescript
// In DomainController.ts
function loadConfigurationFromPersistenceStore(applicationUuid, deploymentUuid, deploymentMap):
  // 1. Read Entity instances from model section
  entities = callPersistenceAction("RestPersistenceAction_read", { section: "model", parentUuid: entityEntity.uuid })

  if (deploymentUuid == MIROIR_DEPLOYMENT_UUID):
    modelEntitiesToFetch = miroirModelEntities  // Entity MetaModel peers (not EntityVersion)
  else:
    modelEntitiesToFetch = metaModelEntities    // all framework-level entities

  // 2. Read model section for each modelEntity
  for entity in modelEntitiesToFetch:
    instances = callPersistenceAction("RestPersistenceAction_read", { section: "model", parentUuid: entity.uuid })

  // 3. Read data section for each app entity (from step 1)
  dataEntitiesToFetch = entities found in step 1
  for entity in dataEntitiesToFetch:
    instances = callPersistenceAction("RestPersistenceAction_read", { section: "data", parentUuid: entity.uuid })

  // 4. Load all into CLIENT local cache (Redux)
  callLocalCacheAction("loadNewInstancesInLocalCache", allInstances)
  callLocalCacheAction("rollback")
```

## Key source files

| File | Role |
|---|---|
| [DomainController.ts](../../packages/miroir-core/src/3_controllers/DomainController.ts) | `loadConfigurationFromPersistenceStore`, `handleModelAction("rollback")` |
| [Model.ts](../../packages/miroir-core/src/1_core/Model.ts) | `metaModelEntities`, `miroirModelEntities` |
| [ConfigurationService.ts](../../packages/miroir-standalone-app/src/miroir-fwk/4_view/services/ConfigurationService.ts) | `fetchMiroirAndAppConfigurations` |
