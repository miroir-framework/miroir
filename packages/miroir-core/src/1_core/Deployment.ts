import type { Uuid } from "../0_interfaces/1_core/EntityVersion";
import type {
  AdminApplication,
  ApplicationSection,
  CompositeActionSequence,
  CoreTransformerForBuildPlusRuntime,
  CoreTransformerForBuildPlusRuntime_getFromParameters,
  Deployment,
  Entity,
  EntityInstance,
  MetaModel,
  MetaModelPartial,
  MiroirConfigClient,
  StoreUnitConfiguration,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import type { InitApplicationParameters } from "../0_interfaces/4-services/PersistenceStoreControllerInterface";
import {
  buildEvolutionBaselineCreateInstanceActions,
  EVOLUTION_TRACE_ENTITY_UUID,
} from "../2_domain/evolutionTraceBaseline.js";
import { MiroirLoggerFactory } from "../4_services/MiroirLoggerFactory";
import { packageName } from "../constants";
import { cleanLevel } from "./constants";
import { getApplicationSection } from "./Model.js";

import {
  adminApplication_Admin,
  adminApplication_Miroir,
  adminSelfApplication,
  deployment_Admin,
  deployment_Miroir,
  entityApplicationForAdmin,
  entityDeployment
} from "miroir-test-app_deployment-admin";
import {
  applicationEndpointV1,
  domainEndpointVersionV1,
  instanceEndpointV1,
  localCacheEndpointVersionV1,
  menuEndpointV1,
  modelEndpointV1,
  persistenceEndpointVersionV1,
  queryEndpointVersionV1,
  selfApplicationMiroir,
  storeManagementEndpoint,
  testEndpointVersionV1,
  undoRedoEndpointVersionV1,
} from "miroir-test-app_deployment-miroir";
// import {
//   lendingEndpoint,
//   selfApplicationLibrary
// } from "miroir-test-app_deployment-library";
import { LIBRARY_TMP } from "../0_interfaces/1_core/LIBRARY_TMP";
import { noValue } from "./Instance";

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

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "Deployment");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName,
  "action"
).then((logger: LoggerInterface) => {
  log = logger;
});

// ################################################################################################
export type CreateDeploymentCompositeActionOptions = {
  /**
   * When true, omit Admin openStore. Use for real-server runs where Admin is
   * already open on the shared miroir-server (`emulateServer: false`).
   */
  skipOpenAdminStore?: boolean;
};

export function createDeploymentCompositeAction(
  applicationName: string,
  newDeploymentUuid: Uuid,
  applicationUuid: Uuid,
  adminDeploymentConfiguration: Deployment,
  newDeploymentConfiguration: StoreUnitConfiguration,
  options?: CreateDeploymentCompositeActionOptions,
): CompositeActionSequence {
  // Order matches Create Application / Deploy Existing Application runners
  // (reportMiroirRunners): register AdminApplication in Admin *before* open/create
  // of the new deployment stores, then register the Deployment instance.
  const actionSequence: CompositeActionSequence["payload"]["actionSequence"] = [];

  if (!options?.skipOpenAdminStore) {
    actionSequence.push({
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
    });
  }

  actionSequence.push(
    {
      actionType: "createInstance",
      actionLabel: "CreateAdminApplicationInstance for " + applicationName,
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
        ],
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
      actionLabel: "CreateDeploymentInstance for " + applicationName,
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
            selfApplication: applicationUuid,
            configuration: newDeploymentConfiguration,
          } as Deployment,
        ],
      },
    },
  );

  return {
    actionType: "compositeActionSequence",
    actionLabel: "createDeploymentCompositeAction",
    endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
    payload: {
      actionSequence,
    },
  };
}

// ################################################################################################
export interface EntityAndInstances {
  entity: Entity;
}
export type ApplicationEntitiesDefinitionAndInstances = {
  instances: EntityInstance[];
} & EntityAndInstances;

export type ApplicationEntitiesAndInstances = ApplicationEntitiesDefinitionAndInstances[];

export const emptyMetaModel: MetaModel = {
  applicationUuid: noValue.uuid!,
  applicationName: "",
  applications: [],
  entities: [],
  entityVersions: [],
  applicationVersionCrossEntityVersion: [],
  applicationVersionCrossQueryVersion: [],
  queryVersions: [],
  applicationVersionCrossReportVersion: [],
  reportVersions: [],
  applicationVersionCrossMenuVersion: [],
  menuVersions: [],
  applicationVersionCrossEndpointVersion: [],
  endpointVersions: [],
  applicationVersionCrossRunnerVersion: [],
  runnerVersions: [],
  applicationVersionCrossThemeVersion: [],
  themeVersions: [],
  applicationVersionCrossTransformerDefinitionVersion: [],
  transformerDefinitionVersions: [],
  applicationVersions: [],
  endpoints: [],
  jzodSchemas: [],
  menus: [],
  reports: [],
  storedQueries: [],
  runners: [],
  tests: [],
  themes: [],
  transformerDefinitions: [],
};

const META_MODEL_ARRAY_KEYS = [
  "applicationVersions",
  "applicationVersionCrossEntityVersion",
  "applicationVersionCrossQueryVersion",
  "applicationVersionCrossReportVersion",
  "applicationVersionCrossMenuVersion",
  "applicationVersionCrossEndpointVersion",
  "applicationVersionCrossRunnerVersion",
  "applicationVersionCrossThemeVersion",
  "applicationVersionCrossTransformerDefinitionVersion",
  "applications",
  "entities",
  "tests",
  "entityVersions",
  "endpoints",
  "jzodSchemas",
  "menus",
  "storedQueries",
  "queryVersions",
  "reportVersions",
  "menuVersions",
  "endpointVersions",
  "runnerVersions",
  "themeVersions",
  "transformerDefinitionVersions",
  "reports",
  "runners",
  "themes",
  "transformerDefinitions",
] as const satisfies readonly (keyof MetaModel)[];

/** Fill omitted MetaModel array fields with `[]`; scalar fields fall back to {@link emptyMetaModel}. */
export function resolveMetaModelPartial(partial: MetaModelPartial): MetaModel {
  const arrayDefaults = Object.fromEntries(
    META_MODEL_ARRAY_KEYS.map((key) => [key, partial[key] ?? []]),
  ) as Pick<MetaModel, (typeof META_MODEL_ARRAY_KEYS)[number]>;
  return {
    ...emptyMetaModel,
    ...partial,
    ...arrayDefaults,
  };
}

export type ResolvableAppMetaModel =
  | MetaModelPartial
  | CoreTransformerForBuildPlusRuntime_getFromParameters;

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
  value: MetaModelPartial | CoreTransformerForBuildPlusRuntime,
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
  return resolveMetaModelPartial(value as MetaModelPartial);
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
/**
 * Build the action sequence to reset and initialize the deployment.
 * @param applicationUuid - The UUID of the application.
 * @param deploymentUuid - The UUID of the deployment.
 * @param initApplicationParameters - The parameters to initialize the application.
 * @param appEntitesAndInstances - The entities and instances to create.
 * @param appMetaModel - The meta model to use.
 * @param filterEntities - The entities to filter.
 * @returns The action sequence.
 */
export function buildResetAndinitializeDeploymentActionSequence(
  applicationUuid: Uuid,
  deploymentUuid: Uuid,
  initApplicationParameters: InitApplicationParameters,
  appEntitesAndInstances: ApplicationEntitiesDefinitionAndInstances[],
  appMetaModel: MetaModelPartial,
  filterEntities?: Uuid[],
): CompositeActionSequence {
  const resolvedMetaModel = resolveMetaModelPartial(appMetaModel);
  const entities = filterEntities
    ? resolvedMetaModel.entities.filter((entity) => filterEntities.includes(entity.uuid))
    : resolvedMetaModel.entities;

  log.info(
    "resetAndinitializeDeploymentCompositeAction for application=",
    applicationUuid,
    "deploymentUuid=",
    deploymentUuid,
    "filteredEntities to create=",
    entities.map((e) => ({ name: e.name, uuid: e.uuid })),
  );

  log.info(
    "resetAndinitializeDeploymentCompositeAction for application=",
    applicationUuid,
    "deploymentUuid=",
    deploymentUuid,
    "entities to create=",
    entities.map((e) => ({ name: e.name, uuid: e.uuid })),
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
            entities,
          },
        },
        // add reports, menus, etc. from metaModel (#222 — section per parentEntity via getApplicationSection)
        ...(() => {
          const metaModelObjects: EntityInstance[] = [
            ...resolvedMetaModel.menus as EntityInstance[],
            ...resolvedMetaModel.reports as EntityInstance[],
            ...resolvedMetaModel.storedQueries as EntityInstance[],
            ...resolvedMetaModel.runners as EntityInstance[],
            ...resolvedMetaModel.themes as EntityInstance[],
            ...resolvedMetaModel.jzodSchemas as EntityInstance[],
            ...resolvedMetaModel.endpoints as EntityInstance[],
            ...resolvedMetaModel.applicationVersionCrossEntityVersion as EntityInstance[],
            ...resolvedMetaModel.applicationVersions as EntityInstance[],
            ...resolvedMetaModel.applications as EntityInstance[],
          ];
          const bySection: Partial<Record<ApplicationSection, EntityInstance[]>> = {};
          for (const obj of metaModelObjects) {
            const parentUuid = (obj as EntityInstance & { parentUuid?: string }).parentUuid;
            const section = parentUuid ? getApplicationSection(applicationUuid, parentUuid) : "model";
            (bySection[section] ??= []).push(obj);
          }
          return (["model", "data", "modelVersion"] as const)
            .filter((section) => (bySection[section]?.length ?? 0) > 0)
            .map((section) => ({
              actionType: "createInstance" as const,
              actionLabel: `resetAndinitializeDeploymentCompositeAction_createMetaModelInstances_${section}`,
              endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89" as const,
              payload: {
                application: applicationUuid,
                applicationSection: section,
                objects: bySection[section] ?? [],
              },
            }));
        })(),
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
        // Squashed evolution baseline when ApplicationEvolutionTrace is part of this init.
        // Trace instances are stored in that application's model section.
        ...(entities.some((e) => e.uuid === EVOLUTION_TRACE_ENTITY_UUID)
          ? buildEvolutionBaselineCreateInstanceActions(applicationUuid)
          : []),
      ],
    },
  };
}

// ################################################################################################
/**
 * Reset and initialize the deployment.
 * @param applicationUuid - The UUID of the application.
 * @param deploymentUuid - The UUID of the deployment.
 * @param initApplicationParameters - The parameters to initialize the application.
 * @param appEntitesAndInstances - The entities and instances to create.
 * @param appMetaModel - The meta model to use.
 * @param filterEntities - The entities to filter.
 * @returns The action sequence.
 */
export function resetAndinitializeDeploymentCompositeAction(
  applicationUuid: Uuid,
  deploymentUuid: Uuid,
  initApplicationParameters: InitApplicationParameters,
  appEntitesAndInstances: ApplicationEntitiesDefinitionAndInstances[],
  appMetaModel: MetaModelPartial | CoreTransformerForBuildPlusRuntime,
  filterEntities?: Uuid[],
): CompositeActionSequence {
  if (isResolvableAppMetaModelTransformer(appMetaModel)) {
    return {
      actionType: "compositeActionSequence",
      actionLabel: "resetAndinitializeDeploymentCompositeAction",
      endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
      payload: {
        _resolvableAppMetaModel: appMetaModel,
        _runnerTestInitConfig: { // why pass this, the action sequence is empty?
          applicationUuid,
          deploymentUuid,
          initApplicationParameters,
          appEntitesAndInstances,
          filterEntities,
        },
        actionSequence: [],
      } as CompositeActionSequence["payload"],
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
    appMetaModel as MetaModelPartial,
    filterEntities,
  );
}

// ################################################################################################
export function dropApplicationAndDeploymentCompositeAction(
  miroirConfig: MiroirConfigClient,
  applicationUuid: Uuid,
  deploymentUuid: Uuid
): CompositeActionSequence {
  log.debug(
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
  log.debug(
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
          actionLabel: "DeleteAdminApplicationInstance for " + application,
          endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
          payload: {
            application: adminSelfApplication.uuid,
            applicationSection: "data",
            objects: [
              {
                uuid: application,
                parentUuid: entityApplicationForAdmin.uuid,
              } as EntityInstance,
            ],
          },
        },
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
