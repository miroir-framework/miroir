import {
  CompositeActionSequence,
  EntityDefinition,
  EntityInstance,
  MetaEntity,
  MiroirConfigClient,
  Uuid,
  type ApplicationEntitiesAndInstances
} from "miroir-core";
import { adminSelfApplication, entityDeployment } from "miroir-test-app_deployment-admin";
import {
  entityAuthor,
  entityDefinitionAuthor,
  author1,
  author2,
  author3,
  entityBook,
  entityDefinitionBook,
  book1,
  book2,
  book4,
  book5,
  book6,
  folio as publisher1,
  penguin as publisher2,
  springer as publisher3,
  entityPublisher,
  entityDefinitionPublisher,
  selfApplicationDeploymentLibrary,
} from "miroir-test-app_deployment-library";

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


export function testUtils_resetApplicationDeployment(
  application: Uuid = selfApplicationDeploymentLibrary.uuid,
): CompositeActionSequence {
  return {
    actionType: "compositeActionSequence",
    actionLabel: "afterEach",
    endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
    payload: {
      actionSequence: [
        {
          actionType: "resetModel",
          actionLabel: "resetApplicationModel",
          endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
          payload: {
            application,
          },
        },
      ],
    },
  };
}
export function testUtils_deleteApplicationDeployment(
  miroirConfig: MiroirConfigClient,
  application: Uuid,
  deploymentUuid: Uuid,
): CompositeActionSequence {
  console.log(
    "testUtils_deleteApplicationDeployment",
    deploymentUuid,
    JSON.stringify(miroirConfig, null, 2),
  );
  return {
    actionType: "compositeActionSequence",
    actionLabel: "deleteLibraryDeployment",
    endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
    payload: {
      actionSequence: [
        {
          actionType: "storeManagementAction_deleteStore",
          actionLabel: "deleteLibraryStore",
          endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
          payload: {
            application,
            deploymentUuid,
            configuration: miroirConfig.client.emulateServer
              ? miroirConfig.client.deploymentStorageConfig[deploymentUuid]
              : miroirConfig.client.serverConfig.storeSectionConfiguration[deploymentUuid],
          }
        },
        {
          actionType: "deleteInstance",
          actionLabel: "DeleteDeploymentInstances for " + application,
          endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
          payload: {
            application: adminSelfApplication.uuid,
            applicationSection: "data",
            objects: [
              {
                uuid: deploymentUuid,
                // parentName: "Deployment",
                parentUuid: entityDeployment.uuid,
                // name: `Deployment of application ${applicationName}`,
                // defaultLabel: `The deployment of application ${applicationName}`,
                // description: `The description of deployment of application ${applicationName}`,
                // selfApplication: selfApplicationUuid, // TODO: this should be selfApplication
                // configuration: newDeploymentConfiguration,
              } as EntityInstance,
            ],
          },
        },
      ],
    },
  };
}
