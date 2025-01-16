import {
  adminConfigurationDeploymentLibrary,
  adminConfigurationDeploymentMiroir,
  author1,
  author2,
  author3,
  book1,
  book2,
  book4,
  book5,
  book6,
  CompositeAction,
  defaultMiroirMetaModel,
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
  selfApplicationDeploymentLibrary,
  selfApplicationLibrary,
  selfApplicationMiroir,
  selfApplicationModelBranchLibraryMasterBranch,
  selfApplicationModelBranchMiroirMasterBranch,
  selfApplicationStoreBasedConfigurationLibrary,
  selfApplicationStoreBasedConfigurationMiroir,
  selfApplicationVersionInitialMiroirVersion,
  selfApplicationVersionLibraryInitialVersion,
  Uuid,
} from "miroir-core";
import { InitApplicationParameters } from "miroir-core/src/0_interfaces/4-services/PersistenceStoreControllerInterface";

export type ApplicationEntitiesAndInstances = {
  entity: MetaEntity;
  entityDefinition: EntityDefinition;
  instances: EntityInstance[];
}[];
export const libraryEntitesAndInstancesWithoutBook3: ApplicationEntitiesAndInstances  = [
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


export function testOnLibrary_resetLibraryDeployment(miroirConfig: MiroirConfigClient): CompositeAction {
  return {
    actionType: "compositeAction",
    actionLabel: "afterEach",
    actionName: "sequence",
    definition: [
      {
        actionType: "domainAction",
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
export function testOnLibrary_deleteLibraryDeployment(miroirConfig: MiroirConfigClient): CompositeAction {
  return {
    actionType: "compositeAction",
    actionLabel: "afterEach",
    actionName: "sequence",
    definition: [
      {
        actionType: "domainAction",
        compositeActionStepLabel: "deleteLibraryStore",
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
