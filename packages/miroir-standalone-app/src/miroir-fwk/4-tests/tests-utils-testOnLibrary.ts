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
  CompositeActionSequence,
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
  type ApplicationEntitiesAndInstances,
} from "miroir-core";

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


export function testOnLibrary_resetLibraryDeployment(
  // miroirConfig: MiroirConfigClient,
  application: Uuid = selfApplicationDeploymentLibrary.uuid,
  deploymentUuid: Uuid = adminConfigurationDeploymentLibrary.uuid, // TODO: remove this default value
): CompositeActionSequence {
  return {
    actionType: "compositeActionSequence",
    actionLabel: "afterEach",
    application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
    endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
    payload: {
      application: "NOT_USED_HERE",
      definition: [
        {
          actionType: "resetModel",
          actionLabel: "resetLibraryStore",
          application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
          payload: {
            application,
            deploymentUuid,
          },
        },
      ],
    },
  };
}
export function testOnLibrary_deleteLibraryDeployment(
  miroirConfig: MiroirConfigClient,
  application: Uuid = selfApplicationDeploymentLibrary.uuid,
  deploymentUuid: Uuid = adminConfigurationDeploymentLibrary.uuid, // TODO: remove this default value
): CompositeActionSequence {
  console.log("testOnLibrary_deleteLibraryDeployment", deploymentUuid,  JSON.stringify(miroirConfig, null, 2));
  return {
    actionType: "compositeActionSequence",
    actionLabel: "deleteLibraryDeployment",
    application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
    endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
    payload: {
      application: "NOT_USED_HERE",
      definition: [
        {
          actionType: "storeManagementAction_deleteStore",
          actionLabel: "deleteLibraryStore",
          application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
          payload: {
            application,
            deploymentUuid,
            configuration: miroirConfig.client.emulateServer
              ? miroirConfig.client.deploymentStorageConfig[deploymentUuid]
              : miroirConfig.client.serverConfig.storeSectionConfiguration[deploymentUuid],
          }
        },
      ],
    },
  };
}
