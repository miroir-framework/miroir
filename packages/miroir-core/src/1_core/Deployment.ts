import type { Uuid } from "../0_interfaces/1_core/EntityDefinition";
import type {
  AdminApplication,
  CompositeActionSequence,
  CoreTransformerForBuildPlusRuntime,
  CoreTransformerForBuildPlusRuntime_getFromParameters,
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
// import {
//   lendingEndpoint,
//   selfApplicationLibrary
// } from "miroir-test-app_deployment-library";
import { noValue } from "./Instance";
import { LIBRARY_TMP } from "../0_interfaces/1_core/LIBRARY_TMP";

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
  [LIBRARY_TMP.lendingEndpointUuid]: LIBRARY_TMP.selfApplicationLibraryUuid,
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
  applicationUuid: Uuid,
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
            application: applicationUuid,
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
            application: applicationUuid,
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
                uuid: applicationUuid,
                parentName: entityApplicationForAdmin.name,
                parentUuid: entityApplicationForAdmin.uuid,
                name: applicationName,
                defaultLabel: `The ${applicationName} Application.`,
                description: `This Application contains the ${applicationName} model and data.`,
                selfApplication: applicationUuid,
              } as AdminApplication,
              {
                uuid: newDeploymentUuid,
                parentName: "Deployment",
                parentUuid: entityDeployment.uuid,
                name: `Deployment of application ${applicationName}`,
                defaultLabel: `The deployment of application ${applicationName}`,
                description: `The description of deployment of application ${applicationName}`,
                selfApplication: applicationUuid, // TODO: this should be selfApplication
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
  applications: [],
  entities: [],
  entityDefinitions: [],
  applicationVersionCrossEntityDefinition: [],
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
export type ResolvableAppMetaModel = MetaModel | CoreTransformerForBuildPlusRuntime_getFromParameters;

export type RunnerTestResetAndinitializeInitConfig = {
  applicationUuid: Uuid;
  deploymentUuid: Uuid;
  initApplicationParameters: InitApplicationParameters;
  appEntitesAndInstances: ApplicationEntitiesDefinitionAndInstances[];
  filterEntities?: Uuid[];
};

export type ResetAndinitializeDeploymentCompositeActionPayload = {
  actionSequence: CompositeActionSequence["payload"]["actionSequence"];
  _resolvableAppMetaModel?: CoreTransformerForBuildPlusRuntime_getFromParameters;
  _runnerTestInitConfig?: RunnerTestResetAndinitializeInitConfig;
};

export function isResolvableAppMetaModelTransformer(
  value: MetaModel | CoreTransformerForBuildPlusRuntime,
): value is CoreTransformerForBuildPlusRuntime_getFromParameters {
  return (
    typeof value === "object" &&
    value !== null &&
    "transformerType" in value &&
    (value as CoreTransformerForBuildPlusRuntime_getFromParameters).transformerType ===
      "getFromParameters"
  );
}

export function resolveAppMetaModelFromParamBank(
  transformer: CoreTransformerForBuildPlusRuntime_getFromParameters,
  actionParamValues: Record<string, unknown>,
): MetaModel {
  const key = transformer.referenceName ?? transformer.referencePath?.[0];
  if (!key) {
    throw new Error(
      "resolveAppMetaModelFromParamBank: getFromParameters transformer requires referenceName",
    );
  }
  const value = actionParamValues[key];
  if (!value) {
    throw new Error(
      `resolveAppMetaModelFromParamBank: missing param bank key "${key}" for initialModel`,
    );
  }
  return value as MetaModel;
}

export function expandResolvableResetAndinitializeDeploymentCompositeAction(
  compositeActionSequence: CompositeActionSequence,
  actionParamValues: Record<string, unknown>,
): CompositeActionSequence {
  const payload = compositeActionSequence.payload as ResetAndinitializeDeploymentCompositeActionPayload;
  if (!payload._resolvableAppMetaModel || !payload._runnerTestInitConfig) {
    return compositeActionSequence;
  }

  const resolvedMetaModel = resolveAppMetaModelFromParamBank(
    payload._resolvableAppMetaModel,
    actionParamValues,
  );
  const initConfig = payload._runnerTestInitConfig;
  return buildResetAndinitializeDeploymentActionSequence(
    initConfig.applicationUuid,
    initConfig.deploymentUuid,
    initConfig.initApplicationParameters,
    initConfig.appEntitesAndInstances,
    resolvedMetaModel,
    initConfig.filterEntities,
  );
}

// ################################################################################################
export function buildResetAndinitializeDeploymentActionSequence(
  applicationUuid: Uuid,
  deploymentUuid: Uuid,
  initApplicationParameters: InitApplicationParameters,
  appEntitesAndInstances: ApplicationEntitiesDefinitionAndInstances[],
  appMetaModel: MetaModel,
  filterEntities?: Uuid[],
): CompositeActionSequence {
  const filteredEntitiesMetaModel = metaModelFilterEntities(appMetaModel, filterEntities);

  log.info(
    "resetAndinitializeDeploymentCompositeAction for application=",
    applicationUuid,
    "deploymentUuid=",
    deploymentUuid,
    "filteredEntities to create=",
    filteredEntitiesMetaModel.entities.map((e) => ({ name: e.name, uuid: e.uuid })),
    "filteredEntityDefinitions=",
    filteredEntitiesMetaModel.entityDefinitions.map((ed) => ({
      name: ed.name,
      uuid: ed.uuid,
      entityUuid: ed.entityUuid,
    })),
  );

  const entities: EntityDefinitionCouple[] = filteredEntitiesMetaModel.entities.map((entity) => {
    const entityDefinition = filteredEntitiesMetaModel.entityDefinitions.find(
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
    "resetAndinitializeDeploymentCompositeAction for application=",
    applicationUuid,
    "deploymentUuid=",
    deploymentUuid,
    "entities to create=",
    entities.map((e) => ({ name: e.entity.name, uuid: e.entity.uuid })),
    "appMetaModel",
    "entities=",
    appMetaModel.entities.map((ed) => ({ name: ed.name, uuid: ed.uuid })),
    "entityDefinitions=",
    appMetaModel.entityDefinitions.map((ed) => ({ name: ed.name, uuid: ed.uuid, entityUuid: ed.entityUuid })),
    // "initApplicationParameters=",
    // initApplicationParameters,
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
        // create entities from metaModel
        {
          actionType: "createEntity",
          actionLabel: "resetAndinitializeDeploymentCompositeAction_createEntities",
          endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
          payload: {
            application: applicationUuid,
            entities: entities,
          },
        },
        // add reports, menus, etc. from metaModel
        {
          actionType: "createInstance" as const,
          actionLabel: "resetAndinitializeDeploymentCompositeAction_createMetaModelInstances",
          endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89" as const,
          payload: {
            application: applicationUuid,
            applicationSection: "model" as const,
            objects: [
              ...appMetaModel.menus as EntityInstance[],
              ...appMetaModel.reports as EntityInstance[],
              ...appMetaModel.storedQueries as EntityInstance[],
              ...appMetaModel.runners as EntityInstance[],
              ...appMetaModel.themes as EntityInstance[],
              ...appMetaModel.jzodSchemas as EntityInstance[],
              ...appMetaModel.endpoints as EntityInstance[],
              ...appMetaModel.applicationVersionCrossEntityDefinition as EntityInstance[],
              ...appMetaModel.applicationVersions as EntityInstance[],
              ...appMetaModel.applications as EntityInstance[],
            ],
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
export function resetAndinitializeDeploymentCompositeAction(
  applicationUuid: Uuid,
  deploymentUuid: Uuid,
  initApplicationParameters: InitApplicationParameters,
  appEntitesAndInstances: ApplicationEntitiesDefinitionAndInstances[],
  appMetaModel: MetaModel | CoreTransformerForBuildPlusRuntime,
  filterEntities?: Uuid[],
): CompositeActionSequence {
  if (isResolvableAppMetaModelTransformer(appMetaModel)) {
    const deferredPayload: ResetAndinitializeDeploymentCompositeActionPayload = {
      _resolvableAppMetaModel: appMetaModel,
      _runnerTestInitConfig: {
        applicationUuid,
        deploymentUuid,
        initApplicationParameters,
        appEntitesAndInstances,
        filterEntities,
      },
      actionSequence: [],
    };
    return {
      actionType: "compositeActionSequence",
      actionLabel: "resetAndinitializeDeploymentCompositeAction",
      endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
      payload: deferredPayload as CompositeActionSequence["payload"],
    };
  }

  if (typeof appMetaModel === "object" && appMetaModel !== null && "transformerType" in appMetaModel) {
    const transformerType = (appMetaModel as { transformerType?: string }).transformerType;
    throw new Error(
      `resetAndinitializeDeploymentCompositeAction: unsupported appMetaModel transformer ${transformerType}`,
    );
  }

  return buildResetAndinitializeDeploymentActionSequence(
    applicationUuid,
    deploymentUuid,
    initApplicationParameters,
    appEntitesAndInstances,
    appMetaModel as MetaModel,
    filterEntities,
  );
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
  application: Uuid,
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
        }
        // {
        //   actionType: "deleteInstance",
        //   actionLabel: "deleteAdminApplication",
        //   endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
        //   payload: {
        //     application: "55af124e-8c05-4bae-a3ef-0933d41daa92",
        //     applicationSection: "data",
        //     objects: [
        //       {
        //         parentUuid: "25d935e7-9e93-42c2-aade-0472b883492b",
        //         uuid: application,
        //       },
        //     ],
        //   },
        // },
      ],
    },
  };
}

// ################################################################################################
/**
 * extend the miroirConfig with an additional deployment storage configuration
 * @param miroirConfig 
 * @param testDeploymentStorageConfiguration 
 * @param testApplicationDeploymentUuid 
 * @returns 
 */
export function extendMiroirConfigWithExtraDeploymentConfiguration(
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
