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
  EntityDefinition,
  entityDefinitionAuthor,
  entityDefinitionBook,
  entityDefinitionPublisher,
  EntityInstance,
  entityPublisher,
  MetaEntity,
  MiroirConfigClient,
  publisher1,
  publisher2,
  publisher3,
} from "miroir-core";
import { EntityInstanceCollection } from "miroir-core";
import {
  adminConfigurationDeploymentLibrary,
  adminConfigurationDeploymentMiroir,
  CompositeAction,
  defaultMiroirMetaModel,
  selfApplicationDeploymentLibrary,
  selfApplicationMiroir,
  selfApplicationModelBranchMiroirMasterBranch,
  selfApplicationStoreBasedConfigurationMiroir,
  selfApplicationVersionInitialMiroirVersion,
} from "miroir-core";
import { miroirConfig } from "miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

export type ApplicationEntitiesAndInstances = {
  entity: MetaEntity;
  entityDefinition: EntityDefinition;
  instances: EntityInstance[];
}[];
export const libraryEntitesAndInstances: ApplicationEntitiesAndInstances  = [
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
      // book3 as EntityInstance,
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

export function testOnLibrary_beforeAll(miroirConfig: MiroirConfigClient): CompositeAction {
  throw new Error("Not implemented yet");
  return {
    actionType: "compositeAction",
    actionLabel: "beforeAll",
    actionName: "sequence",
    definition: [
      // TODO: openStore first!jy
      {
        compositeActionType: "domainAction",
        compositeActionStepLabel: "createLibraryStore",
        domainAction: {
          actionType: "storeManagementAction",
          actionName: "createStore",
          endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
          deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
          configuration: miroirConfig.client.emulateServer
            ? miroirConfig.client.deploymentStorageConfig[adminConfigurationDeploymentLibrary.uuid]
            : miroirConfig.client.serverConfig.storeSectionConfiguration[adminConfigurationDeploymentLibrary.uuid],
        },
      },
    ],
  };
}

export function testOnLibrary_beforeEach(
  miroirConfig: MiroirConfigClient,
  libraryEntitesAndInstances: ApplicationEntitiesAndInstances
): CompositeAction {
  return {
    actionType: "compositeAction",
    actionLabel: "beforeEach",
    actionName: "sequence",
    definition: [
      {
        compositeActionType: "domainAction",
        compositeActionStepLabel: "resetLibraryStore",
        domainAction: {
          actionType: "modelAction",
          actionName: "resetModel",
          endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
          deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
        },
      },
      {
        compositeActionType: "domainAction",
        compositeActionStepLabel: "initLibraryStore",
        domainAction: {
          actionType: "modelAction",
          actionName: "initModel",
          endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
          deploymentUuid: selfApplicationDeploymentLibrary.uuid,
          params: {
            dataStoreType:
              adminConfigurationDeploymentLibrary.uuid == adminConfigurationDeploymentMiroir.uuid ? "miroir" : "app", // TODO: comparison between deployment and selfAdminConfigurationDeployment
            metaModel: defaultMiroirMetaModel,
            application: selfApplicationMiroir,
            selfApplicationDeploymentConfiguration: selfApplicationDeploymentLibrary,
            applicationModelBranch: selfApplicationModelBranchMiroirMasterBranch,
            applicationStoreBasedConfiguration: selfApplicationStoreBasedConfigurationMiroir,
            applicationVersion: selfApplicationVersionInitialMiroirVersion,
          },
        },
      },
      {
        compositeActionType: "domainAction",
        compositeActionStepLabel: "refreshLocalCacheForLibraryStore",
        domainAction: {
          actionType: "modelAction",
          actionName: "rollback",
          endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
          deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
        },
      },
      {
        compositeActionType: "domainAction",
        compositeActionStepLabel: "CreateLibraryStoreEntities",
        domainAction: {
          actionType: "modelAction",
          actionName: "createEntity",
          deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
          endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
          entities: libraryEntitesAndInstances,
        },
      },
      {
        compositeActionType: "domainAction",
        compositeActionStepLabel: "CommitLibraryStoreEntities",
        domainAction: {
          actionType: "modelAction",
          actionName: "commit",
          endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
          deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
        },
      },
      {
        compositeActionType: "domainAction",
        compositeActionStepLabel: "CreateLibraryStoreInstances",
        domainAction: {
          actionType: "instanceAction",
          actionName: "createInstance",
          endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
          applicationSection: "data",
          deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
          objects: libraryEntitesAndInstances.map((e) => {
            return {
              parentName: e.entity.name,
              parentUuid: e.entity.uuid,
              applicationSection: "data",
              instances: e.instances,
            };
          }),
        },
      },
    ],
  };
}

export function testOnLibrary_afterEach(miroirConfig: MiroirConfigClient): CompositeAction {
  return {
    actionType: "compositeAction",
    actionLabel: "afterEach",
    actionName: "sequence",
    definition: [
      {
        compositeActionType: "domainAction",
        compositeActionStepLabel: "resetLibraryStore",
        domainAction: {
          actionType: "modelAction",
          actionName: "resetModel",
          endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
          deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
        },
      },
    ],
  };
}
export function testOnLibrary_afterAll(miroirConfig: MiroirConfigClient): CompositeAction {
  return {
    actionType: "compositeAction",
    actionLabel: "afterEach",
    actionName: "sequence",
    definition: [
      {
        compositeActionType: "domainAction",
        compositeActionStepLabel: "resetLibraryStore",
        domainAction: {
          actionType: "storeManagementAction",
          actionName: "deleteStore",
          endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
          deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
          configuration: miroirConfig.client.emulateServer
            ? miroirConfig.client.deploymentStorageConfig[adminConfigurationDeploymentLibrary.uuid]
            : miroirConfig.client.serverConfig.storeSectionConfiguration[adminConfigurationDeploymentLibrary.uuid],
        },
      },
    ],
  };
}
