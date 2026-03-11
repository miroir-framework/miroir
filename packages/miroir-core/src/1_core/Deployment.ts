import type { Uuid } from "../0_interfaces/1_core/EntityDefinition";
import type {
  AdminApplication,
  CompositeActionSequence,
  Deployment,
  Entity,
  EntityDefinition,
  EntityInstance,
  MetaModel,
  MiroirConfigClient,
  SelfApplication,
  StoreUnitConfiguration,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import type { InitApplicationParameters } from "../0_interfaces/4-services/PersistenceStoreControllerInterface";
import { MiroirLoggerFactory } from "../4_services/MiroirLoggerFactory";
import { packageName } from "../constants";
import { cleanLevel } from "./constants";

import {
  selfApplicationMiroir,
  applicationEndpointV1,
  instanceEndpointV1,
  modelEndpointV1,
  domainEndpointVersionV1,
  testEndpointVersionV1,
  storeManagementEndpoint,
  undoRedoEndpointVersionV1,
  localCacheEndpointVersionV1,
  queryEndpointVersionV1,
  persistenceEndpointVersionV1,
  menuEndpointV1,
} from "miroir-test-app_deployment-miroir";
import {
  deployment_Miroir,
  adminSelfApplication,
  deployment_Admin,
  entityApplicationForAdmin,
  entityDeployment,
  adminApplication_Admin,
  adminApplication_Miroir
} from "miroir-test-app_deployment-admin";
import { noValue } from "./Instance";
import { selfApplicationDeploymentLibrary } from "miroir-test-app_deployment-library";

export const defaultDeployments: Deployment[] = [
  deployment_Miroir as Deployment,
  deployment_Admin as Deployment,
];
export const defaultDeploymentUuids = defaultDeployments.map(deployment => deployment.uuid);

export interface ApplicationDeploymentMap {
  [applicationUuid: Uuid]: Uuid; // deploymentUuid
}

// ################################################################################################
/**
 * Maps endpoint UUIDs to the application UUID that defines them.
 * This enables the path: endpoint -> application -> deployment.
 * Since the endpoint UUID uniquely identifies the application, having
 * `application` in the action envelope is redundant.
 */
export interface EndpointApplicationMap {
  [endpointUuid: Uuid]: Uuid; // applicationUuid
}

export const defaultSelfApplicationDeploymentMap: ApplicationDeploymentMap = {
  [selfApplicationMiroir.uuid]: deployment_Miroir.uuid,
  [adminSelfApplication.uuid]: deployment_Admin.uuid,
};

export const defaultAdminApplicationDeploymentMapNOTGOOD: ApplicationDeploymentMap = {
  [adminApplication_Miroir.uuid]: deployment_Miroir.uuid,
  [adminApplication_Admin.uuid]: deployment_Admin.uuid,
};

/**
 * Default endpoint → application map, built from all known built-in endpoints.
 * All built-in endpoints belong to the Miroir self-application.
 */
export const defaultEndpointApplicationMap: EndpointApplicationMap = {
  [applicationEndpointV1.uuid]: selfApplicationMiroir.uuid,
  [instanceEndpointV1.uuid]: selfApplicationMiroir.uuid,
  [modelEndpointV1.uuid]: selfApplicationMiroir.uuid,
  [domainEndpointVersionV1.uuid]: selfApplicationMiroir.uuid,
  [testEndpointVersionV1.uuid]: selfApplicationMiroir.uuid,
  [storeManagementEndpoint.uuid]: selfApplicationMiroir.uuid,
  [undoRedoEndpointVersionV1.uuid]: selfApplicationMiroir.uuid,
  [localCacheEndpointVersionV1.uuid]: selfApplicationMiroir.uuid,
  [queryEndpointVersionV1.uuid]: selfApplicationMiroir.uuid,
  [persistenceEndpointVersionV1.uuid]: selfApplicationMiroir.uuid,
  [menuEndpointV1.uuid]: selfApplicationMiroir.uuid,
};

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "Deployment"),
  "action"
).then((logger: LoggerInterface) => {
  log = logger;
});

// // ################################################################################################
// export function createApplicationCompositeAction(
//   deploymentUuid: Uuid,
//   // newAdminAppApplicationUuid: Uuid,
//   newSelfApplicationUuid: Uuid,
//   newApplicationName: string,
//   deploymentConfiguration: StoreUnitConfiguration
// ): CompositeActionSequence {
//   const result: CompositeActionSequence = {
//     actionType: "compositeActionSequence",
//     actionLabel: "beforeAll",
//     endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
//     payload: {
//       actionSequence: [
//         {
//           actionType: "createInstance",
//           actionLabel: "createApplicationForAdminAction",
//           endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
//           payload: {
//             application: newSelfApplicationUuid,
//             applicationSection: "data",
//             objects: [
//               {
//                 uuid: newSelfApplicationUuid,
//                 parentName: entityApplicationForAdmin.name,
//                 parentUuid: entityApplicationForAdmin.uuid,
//                 name: newApplicationName,
//                 defaultLabel: `The ${newApplicationName} Application.`,
//                 description: `This Application contains the ${newApplicationName} model and data.`,
//                 selfApplication: newSelfApplicationUuid,
//               } as AdminApplication,
//             ],
//           },
//         },
//       ],
//     }
//   };
//   // log.info("createApplicationCompositeAction result =", result);
//   return result;
// }

// ################################################################################################
export function createDeploymentCompositeAction(
  applicationName: string,
  newDeploymentUuid: Uuid,
  selfApplicationUuid: Uuid,
  adminDeploymentConfiguration: Deployment,
  newDeploymentConfiguration: StoreUnitConfiguration
): CompositeActionSequence {
  // log.info(
  //   "createDeploymentCompositeAction deploymentConfiguration",
  //   "newDeploymentUuid:",
  //   newDeploymentUuid,
  //   "deploymentConfiguration:",
  //   newDeploymentConfiguration
  // );
  return {
    actionType: "compositeActionSequence",
    actionLabel: "createDeploymentCompositeAction",
    endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
    payload: {
      actionSequence: [
        {
          actionType: "storeManagementAction_openStore",
          actionLabel: "storeManagementAction_openStore for " + applicationName + " admin",
          endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
          payload: {
            application: adminSelfApplication.uuid,
            deploymentUuid: adminDeploymentConfiguration.uuid,
            configuration: {
              [adminDeploymentConfiguration.uuid]:
                adminDeploymentConfiguration.configuration as StoreUnitConfiguration,
            },
          },
        },
        {
          actionType: "storeManagementAction_openStore",
          actionLabel: "storeManagementAction_openStore for " + applicationName,
          endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
          payload: {
            application: selfApplicationUuid,
            deploymentUuid: newDeploymentUuid,
            configuration: {
              [newDeploymentUuid]: newDeploymentConfiguration,
            },
          },
        },
        {
          actionType: "storeManagementAction_createStore",
          actionLabel: "storeManagementAction_createStore for " + applicationName,
          endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
          payload: {
            application: selfApplicationUuid,
            deploymentUuid: newDeploymentUuid,
            configuration: newDeploymentConfiguration,
          },
        },
        {
          actionType: "createInstance",
          actionLabel: "CreateDeploymentInstances for " + applicationName,
          endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
          payload: {
            application: adminSelfApplication.uuid,
            applicationSection: "data",
            objects: [
              {
                uuid: newDeploymentUuid,
                parentName: "Deployment",
                parentUuid: entityDeployment.uuid,
                name: `Deployment of application ${applicationName}`,
                defaultLabel: `The deployment of application ${applicationName}`,
                description: `The description of deployment of application ${applicationName}`,
                selfApplication: selfApplicationUuid, // TODO: this should be selfApplication
                configuration: newDeploymentConfiguration,
              } as Deployment,
            ],
          },
        },
      ],
    },
  };
}

// ################################################################################################
export interface EntityDefinitionCouple {
  // entity: Entity;
  entity: Entity;
  entityDefinition: EntityDefinition;
}
export type ApplicationEntitiesDefinitionAndInstances = {
  instances: EntityInstance[];
} & EntityDefinitionCouple;

export type ApplicationEntitiesAndInstances = ApplicationEntitiesDefinitionAndInstances[];

export const emptyMetaModel: MetaModel = {
  applicationUuid: noValue.uuid!,
  applicationName: "",
  entities: [],
  entityDefinitions: [],
  applicationVersionCrossEntityDefinition: {} as any,
  applicationVersions: [],
  endpoints: [],
  jzodSchemas: [],
  menus: [],
  reports: [],
  storedQueries: [],
  runners: [],
  themes: [],
}
// ################################################################################################
export function metaModelFilterEntities(
  metaModel: MetaModel,
  entityUuidsToKeep?: Uuid[]
): MetaModel {
  const filteredEntities = entityUuidsToKeep ? metaModel.entities.filter((entity) =>
    entityUuidsToKeep.includes(entity.uuid)
  ) : metaModel.entities;
  const filteredEntityDefinitions = entityUuidsToKeep ? metaModel.entityDefinitions.filter((entityDefinition) =>
    entityUuidsToKeep.includes(entityDefinition.entityUuid)
  ) : metaModel.entityDefinitions;
  return {
    ...metaModel,
    entities: filteredEntities,
    entityDefinitions: filteredEntityDefinitions,
  };
}
// ################################################################################################
export function resetAndinitializeDeploymentCompositeAction(
  applicationUuid: Uuid,
  deploymentUuid: Uuid,
  initApplicationParameters: InitApplicationParameters,
  appEntitesAndInstances: ApplicationEntitiesDefinitionAndInstances[],
  appMetaModel: MetaModel,
  filterEntities?: Uuid[],
): CompositeActionSequence {

  const entities: EntityDefinitionCouple[] = metaModelFilterEntities(
    appMetaModel,
    filterEntities,
  ).entities.map((entity) => {
    const entityDefinition = appMetaModel.entityDefinitions.find(
      (ed) => ed.entityUuid === entity.uuid,
    );
    if (!entityDefinition) {
      throw new Error(
        `Entity definition not found for entity uuid: ${entity.uuid} (${entity.name})`,
      );
    }
    return {
      entity,
      entityDefinition,
    };
  });

  log.info(
    "createDeploymentCompositeAction deploymentConfiguration",
    deploymentUuid
  );
  return {
    actionType: "compositeActionSequence",
    actionLabel: "resetAndinitializeDeploymentCompositeAction",
    endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
    payload: {
      actionSequence: [
        {
          actionType: "resetModel",
          actionLabel: "resetAndinitializeDeploymentCompositeAction_resetModel",
          endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
          payload: {
            application: applicationUuid,
          },
        },
        {
          actionType: "initModel",
          actionLabel: "resetAndinitializeDeploymentCompositeAction_InitModel",
          endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
          payload: {
            application: applicationUuid,
            params: initApplicationParameters,
          },
        },
        {
          actionType: "commit", // TODO: should be initModel commit?
          actionLabel: "resetAndinitializeDeploymentCompositeAction_commitInitModel",
          endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
          payload: {
            application: applicationUuid,
          },
        },
        {
          actionType: "rollback",
          actionLabel: "resetAndinitializeDeploymentCompositeAction_Rollback",
          endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
          payload: {
            application: applicationUuid,
          },
        },
        {
          actionType: "createEntity",
          actionLabel: "resetAndinitializeDeploymentCompositeAction_createEntities",
          endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
          payload: {
            application: applicationUuid,
            entities: entities,
          },
        },
        {
          actionType: "commit",
          actionLabel: "resetAndinitializeDeploymentCompositeAction_commitEntities",
          endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
          payload: {
            application: applicationUuid,
          },
        },
        ...appEntitesAndInstances.map((e) => ({
          actionType: "createInstance" as const,
          actionLabel: "resetAndinitializeDeploymentCompositeAction_createInstances",
          endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89" as const,
          payload: {
            application: applicationUuid,
            applicationSection: "data" as const,
            parentUuid: e.entity.uuid,
            objects: e.instances,
          },
        })),
      ],
    },
  };
}

// ################################################################################################
export function dropApplicationAndDeploymentCompositeAction(
  miroirConfig: MiroirConfigClient,
  applicationUuid: Uuid,
  deploymentUuid: Uuid
): CompositeActionSequence {
  console.log(
    "dropApplicationAndDeploymentCompositeAction",
    deploymentUuid,
    JSON.stringify(miroirConfig, null, 2)
  );
  return {
    actionType: "compositeActionSequence",
    actionLabel: "dropApplicationAndDeployment",
    endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
    payload: {
      application: applicationUuid, // to be ignored?
      actionSequence: [
        {
          actionType: "storeManagementAction_deleteStore",
          actionLabel: "deleteStore",
          endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
          payload: {
            application: applicationUuid,
            deploymentUuid,
            configuration: miroirConfig.client.emulateServer
              ? miroirConfig.client.deploymentStorageConfig[deploymentUuid]
              : miroirConfig.client.serverConfig.storeSectionConfiguration[deploymentUuid],
          }
        },
      ],
    }
  };
}

// ################################################################################################
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
// ################################################################################################
// TODO: this should use the dropApplcation runner instead of duplicating its logic here
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
    actionLabel: "deleteApplicationDeployment",
    endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
    payload: {
      actionSequence: [
        {
          actionType: "storeManagementAction_deleteStore",
          actionLabel: "deleteApplicationStore",
          endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
          payload: {
            application,
            deploymentUuid,
            configuration: miroirConfig.client.emulateServer
              ? miroirConfig.client.deploymentStorageConfig[deploymentUuid]
              : miroirConfig.client.serverConfig.storeSectionConfiguration[deploymentUuid],
          },
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
                parentUuid: entityDeployment.uuid,
              } as EntityInstance,
            ],
          },
        },
        {
          actionType: "deleteInstance",
          actionLabel: "deleteAdminApplication",
          // application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
          payload: {
            application: "55af124e-8c05-4bae-a3ef-0933d41daa92",
            applicationSection: "data",
            objects: [
              {
                parentUuid: "25d935e7-9e93-42c2-aade-0472b883492b",
                uuid: application,
              },
            ],
          },
        },
      ],
    },
  };
}

// ################################################################################################
export function getMiroirConfig(
  miroirConfig: MiroirConfigClient,
  testDeploymentStorageConfiguration: StoreUnitConfiguration,
  testApplicationDeploymentUuid: Uuid,
) {
  const internalMiroirConfig = {
    ...miroirConfig,
    client: {
      ...miroirConfig.client,
      ...(
        miroirConfig.client.emulateServer?
        {
          deploymentStorageConfig: {
            ...miroirConfig.client.deploymentStorageConfig,
            [testApplicationDeploymentUuid]: testDeploymentStorageConfiguration,
          }
        }
        : {}
      ),
      ...(
        !miroirConfig.client.emulateServer?
        {
          serverConfig: {
            ...miroirConfig.client.serverConfig,
            storeSectionConfiguration: {
              ...miroirConfig.client.serverConfig.storeSectionConfiguration,
              [testApplicationDeploymentUuid]: testDeploymentStorageConfiguration,
            }
          }
        }:{}
      )
    }
  }
  return internalMiroirConfig;
}
