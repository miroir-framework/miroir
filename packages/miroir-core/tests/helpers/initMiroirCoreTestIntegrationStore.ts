/**
 * Postgres integration store bootstrap for MiroirTest integration runs.
 * Distilled from `transformers.integ.test.ts` (legacy file unchanged).
 */
import {
  SqlDbAdminStore,
  SqlDbDataStoreSection,
  SqlDbModelStoreSection,
} from "miroir-store-postgres";
import {
  author1,
  author2,
  author3,
  book1,
  book2,
  book4,
  book5,
  book6,
  entityAuthor,
  entityBook,
  entityDefinitionAuthor,
  entityDefinitionBook,
  entityDefinitionPublisher,
  entityPublisher,
  folio as publisher1,
  penguin as publisher2,
  springer as publisher3,
} from "miroir-test-app_deployment-library";

import type {
  Entity,
  EntityDefinition,
  EntityInstance,
  StoreUnitConfiguration,
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type { Uuid } from "../../src/0_interfaces/1_core/EntityDefinition";
import type {
  InitApplicationParameters,
  PersistenceStoreAdminSectionInterface,
} from "../../src/0_interfaces/4-services/PersistenceStoreControllerInterface";
import { defaultMiroirMetaModel } from "../../src/1_core/Model";
import { getBasicApplicationConfiguration, getBasicStoreUnitConfiguration } from "../../src/2_domain/Deployment";
import { PersistenceStoreController } from "../../src/4_services/PersistenceStoreController";
import type { MetaEntity } from "../../src/0_interfaces/1_core/EntityDefinition";

export type MiroirTestIntegrationStore = {
  sqlDbDataStore: SqlDbDataStoreSection;
  persistenceStoreController: PersistenceStoreController;
};

export type MiroirTestIntegrationStoreOptions = {
  postgresHostName?: string;
};

// ################################################################################################
/**
 * 
 * TODO: return a compositeActionSequence instead of running actions one by one
 * @param options 
 * @returns 
 */
export async function initMiroirCoreTestIntegrationStore(
  options: MiroirTestIntegrationStoreOptions = {},
): Promise<MiroirTestIntegrationStore> {
  const postgresHostName = options.postgresHostName ?? "192.168.1.160";
  const testApplicationName = "testApplication";
  const sqlDbStoreName = "testStoreName";
  const connectionString = `postgres://postgres:postgres@${postgresHostName}:5432/postgres`;
  const schema = testApplicationName;
  const paramSelfApplicationUuid = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
  const paramAdminConfigurationDeploymentUuid: Uuid = "bbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
  const applicationModelBranchUuid: Uuid = "cccccccc-cccc-cccc-cccc-cccccccccccc";
  const selfApplicationVersionUuid: Uuid = "dddddddd-dddd-dddd-dddd-dddddddddddd";

  const sqlDbAdminStore: PersistenceStoreAdminSectionInterface = new SqlDbAdminStore(
    "data",
    sqlDbStoreName,
    connectionString,
    schema,
  );
  const sqlDbDataStore = new SqlDbDataStoreSection("data", sqlDbStoreName, connectionString, schema);
  const sqlDbModelStore = new SqlDbModelStoreSection(
    "model",
    sqlDbStoreName,
    connectionString,
    schema,
    sqlDbDataStore,
  );

  const persistenceStoreController = new PersistenceStoreController(
    sqlDbAdminStore,
    sqlDbModelStore,
    sqlDbDataStore,
  );

  const testStoreConfig: StoreUnitConfiguration = getBasicStoreUnitConfiguration(testApplicationName, {
    emulatedServerType: "sql",
    connectionString: `postgres://postgres:postgres@${postgresHostName}:5432/postgres`,
  });

  const testApplicationConfig: InitApplicationParameters = getBasicApplicationConfiguration(
    testApplicationName,
    paramSelfApplicationUuid,
    paramAdminConfigurationDeploymentUuid,
    applicationModelBranchUuid,
    selfApplicationVersionUuid,
  );

  const libraryEntitesAndInstances = [
    {
      entity: entityAuthor as MetaEntity,
      entityDefinition: entityDefinitionAuthor as EntityDefinition,
      instances: [author1, author2, author3 as EntityInstance],
    },
    {
      entity: entityBook as MetaEntity,
      entityDefinition: entityDefinitionBook as EntityDefinition,
      instances: [
        book1 as EntityInstance,
        book2 as EntityInstance,
        book4 as EntityInstance,
        book5 as EntityInstance,
        book6 as EntityInstance,
      ],
    },
    {
      entity: entityPublisher as MetaEntity,
      entityDefinition: entityDefinitionPublisher as EntityDefinition,
      instances: [publisher1 as EntityInstance, publisher2 as EntityInstance, publisher3 as EntityInstance],
    },
  ];

  await persistenceStoreController.createStore(testStoreConfig.admin);
  await persistenceStoreController.createStore(testStoreConfig.model);
  await persistenceStoreController.createStore(testStoreConfig.data);
  await persistenceStoreController.open();

  await persistenceStoreController.initApplication(
    "miroir",
    testApplicationConfig.selfApplication,
    testApplicationConfig.applicationModelBranch,
    testApplicationConfig.applicationVersion,
  );

  await persistenceStoreController.handleAction({
    actionType: "resetModel",
    actionLabel: "resetTestStore",
    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
    payload: { application: paramSelfApplicationUuid },
  });

  await persistenceStoreController.handleAction({
    actionType: "initModel",
    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
    payload: {
      application: paramSelfApplicationUuid,
      params: {
        dataStoreType: "app",
        metaModel: defaultMiroirMetaModel,
        selfApplication: testApplicationConfig.selfApplication,
        applicationModelBranch: testApplicationConfig.applicationModelBranch,
        applicationVersion: testApplicationConfig.applicationVersion,
      },
    },
  });

  await persistenceStoreController.handleAction({
    actionType: "createEntity",
    actionLabel: "CreateLibraryStoreEntities",
    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
    payload: {
      application: paramSelfApplicationUuid,
      entities: libraryEntitesAndInstances.flatMap((entry) => ({
        entity: entry.entity as Entity,
        entityDefinition: entry.entityDefinition,
      })),
    },
  });

  await persistenceStoreController.handleAction({
    actionType: "createInstance",
    actionLabel: "CreateLibraryStoreInstances",
    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
    payload: {
      application: paramSelfApplicationUuid,
      applicationSection: "data",
      objects: libraryEntitesAndInstances.flatMap((entry) => entry.instances),
    },
  });

  return { sqlDbDataStore, persistenceStoreController };
}
