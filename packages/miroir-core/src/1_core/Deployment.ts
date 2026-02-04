import type { MetaEntity, Uuid } from "../0_interfaces/1_core/EntityDefinition";
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

import selfApplicationMiroir from '../assets/miroir_data/a659d350-dd97-4da9-91de-524fa01745dc/360fcf1f-f0d4-4f8a-9262-07886e70fa15.json';
import adminConfigurationDeploymentMiroir from "../assets/admin_data/7959d814-400c-4e80-988f-a00fe582ab98/10ff36f2-50a3-48d8-b80f-e48e5d13af8e.json";
import adminSelfApplication from "../assets/admin_model/a659d350-dd97-4da9-91de-524fa01745dc/55af124e-8c05-4bae-a3ef-0933d41daa92.json";
import adminConfigurationDeploymentAdmin from "../assets/admin_data/7959d814-400c-4e80-988f-a00fe582ab98/18db21bf-f8d3-4f6a-8296-84b69f6dc48b.json";
import entityApplicationForAdmin from "../assets/admin_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/25d935e7-9e93-42c2-aade-0472b883492b.json";
import entityDeployment from "../assets/admin_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/7959d814-400c-4e80-988f-a00fe582ab98.json";

import adminAdminApplication from "../assets/admin_data/25d935e7-9e93-42c2-aade-0472b883492b/55af124e-8c05-4bae-a3ef-0933d41daa92.json";
import adminMiroirApplication from "../assets/admin_data/25d935e7-9e93-42c2-aade-0472b883492b/360fcf1f-f0d4-4f8a-9262-07886e70fa15.json";

import {selfApplicationLibrary} from "miroir-example-library";

const localSelfApplicationLibrary: SelfApplication = selfApplicationLibrary as any as SelfApplication; // TODO: fix type in library package

import { noValue } from "./Instance";

export const defaultApplications: SelfApplication[] = [
  selfApplicationMiroir as SelfApplication,
  adminSelfApplication as SelfApplication,
  localSelfApplicationLibrary,
];

export const defaultApplicationUuids = defaultApplications.map(application => application.uuid);

export const defaultDeployments: Deployment[] = [
  adminConfigurationDeploymentMiroir as Deployment,
  adminConfigurationDeploymentAdmin as Deployment,
  // adminConfigurationDeploymentLibrary as Deployment,
];
export const defaultDeploymentUuids = defaultDeployments.map(deployment => deployment.uuid);

export interface ApplicationDeploymentMap {
  [applicationUuid: Uuid]: Uuid; // deploymentUuid
}

export const defaultSelfApplicationDeploymentMap: ApplicationDeploymentMap = {
  [selfApplicationMiroir.uuid]: adminConfigurationDeploymentMiroir.uuid,
  [adminSelfApplication.uuid]: adminConfigurationDeploymentAdmin.uuid,
  // [localSelfApplicationLibrary.uuid]: adminConfigurationDeploymentLibrary.uuid,
};

export const defaultAdminApplicationDeploymentMapNOTGOOD: ApplicationDeploymentMap = {
  [adminMiroirApplication.uuid]: adminConfigurationDeploymentMiroir.uuid,
  [adminAdminApplication.uuid]: adminConfigurationDeploymentAdmin.uuid,
  // [adminLibraryApplication.uuid]: adminConfigurationDeploymentLibrary.uuid,
};

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "Deployment"),
  "action"
).then((logger: LoggerInterface) => {
  log = logger;
});

// ################################################################################################
export function createApplicationCompositeAction(
  deploymentUuid: Uuid,
  // newAdminAppApplicationUuid: Uuid,
  newSelfApplicationUuid: Uuid,
  newApplicationName: string,
  deploymentConfiguration: StoreUnitConfiguration
): CompositeActionSequence {
  const result: CompositeActionSequence = {
    actionType: "compositeActionSequence",
    actionLabel: "beforeAll",
    application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
    endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
    payload: {
      application: adminSelfApplication.uuid,  //
      definition: [
        {
          actionType: "createInstance",
          actionLabel: "createApplicationForAdminAction",
          endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
          application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          payload: {
            application: newSelfApplicationUuid,
            applicationSection: "data",
            parentUuid: entityApplicationForAdmin.uuid,
            objects: [
              {
                parentName: entityApplicationForAdmin.name,
                parentUuid: entityApplicationForAdmin.uuid,
                applicationSection: "data",
                instances: [
                  {
                    uuid: newSelfApplicationUuid,
                    parentName: entityApplicationForAdmin.name,
                    parentUuid: entityApplicationForAdmin.uuid,
                    name: newApplicationName,
                    defaultLabel: `The ${newApplicationName} Admin Application.`,
                    description: `This Admin Application contains the ${newApplicationName} model and data.`,
                    selfApplication: newSelfApplicationUuid,
                  } as AdminApplication,
                ],
              },
            ],
          },
        },
      ],
    }
  };
  log.info("createApplicationCompositeAction result =", result);
  return result;
}

// ################################################################################################
export function createDeploymentCompositeAction(
  applicationName: string,
  newDeploymentUuid: Uuid,
  selfApplicationUuid: Uuid,
  adminDeploymentConfiguration: Deployment,
  newDeploymentConfiguration: StoreUnitConfiguration
): CompositeActionSequence {
  log.info(
    "createDeploymentCompositeAction deploymentConfiguration",
    "newDeploymentUuid:",
    newDeploymentUuid,
    "deploymentConfiguration:",
    newDeploymentConfiguration
  );
  return {
    actionType: "compositeActionSequence",
    actionLabel: "createDeploymentCompositeAction",
    application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
    endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
    payload: {
      application: selfApplicationUuid, // to be ignored?
      definition: [
        {
          actionType: "storeManagementAction_openStore",
          actionLabel: "storeManagementAction_openStore for " + applicationName + " admin",
          application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
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
          application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
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
          application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
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
          application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
          payload: {
            application: adminSelfApplication.uuid,
            parentUuid: entityDeployment.uuid,
            applicationSection: "data",
            objects: [
              {
                parentName: "Deployment",
                parentUuid: entityDeployment.uuid,
                applicationSection: "data",
                instances: [
                  {
                    uuid: newDeploymentUuid,
                    parentName: "Deployment",
                    parentUuid: entityDeployment.uuid,
                    name: `Deployment of application ${applicationName}`,
                    defaultLabel: `The deployment of application ${applicationName}`,
                    description: `The description of deployment of application ${applicationName}`,
                    adminApplication: selfApplicationUuid, // TODO: this should be selfApplication
                    configuration: newDeploymentConfiguration,
                  } as Deployment,
                ],
              },
            ],
          },
        },
      ],
    },
  };
}

// ################################################################################################
export interface EntityDefinitionCouple {
  // entity: MetaEntity;
  entity: Entity;
  entityDefinition: EntityDefinition;
}
export type ApplicationEntitiesDefinitionAndInstances = {
  instances: EntityInstance[];
} & EntityDefinitionCouple;

export type ApplicationEntitiesAndInstances = ApplicationEntitiesDefinitionAndInstances[];

export const emptyMetaModel: MetaModel = {
  applicationUuid: noValue.uuid,
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
    application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
    endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
    payload: {
      application: applicationUuid, // to be ignored?
      definition: [
        {
          actionType: "resetModel",
          actionLabel: "resetAndinitializeDeploymentCompositeAction_resetModel",
          application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
          payload: {
            application: applicationUuid,
          },
        },
        {
          actionType: "initModel",
          actionLabel: "resetAndinitializeDeploymentCompositeAction_InitModel",
          application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
          payload: {
            application: applicationUuid,
            params: initApplicationParameters,
          },
        },
        {
          actionType: "commit", // TODO: should be initModel commit?
          actionLabel: "resetAndinitializeDeploymentCompositeAction_commitInitModel",
          application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
          payload: {
            application: applicationUuid,
          },
        },
        {
          actionType: "rollback",
          actionLabel: "resetAndinitializeDeploymentCompositeAction_Rollback",
          application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
          payload: {
            application: applicationUuid,
          },
        },
        {
          actionType: "createEntity",
          actionLabel: "resetAndinitializeDeploymentCompositeAction_createEntities",
          application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
          payload: {
            application: applicationUuid,
            entities: entities,
          },
        },
        {
          actionType: "commit",
          actionLabel: "resetAndinitializeDeploymentCompositeAction_commitEntities",
          application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
          payload: {
            application: applicationUuid,
          },
        },
        {
          actionType: "createInstance",
          actionLabel: "resetAndinitializeDeploymentCompositeAction_createInstances",
          application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
          payload: {
            application: applicationUuid,
            applicationSection: "data",
            parentUuid: appEntitesAndInstances.length > 0? appEntitesAndInstances[0].entity.uuid : noValue.uuid,
            objects: appEntitesAndInstances.map((e) => {
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
    application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
    endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
    payload: {
      application: applicationUuid, // to be ignored?
      definition: [
        {
          actionType: "storeManagementAction_deleteStore",
          actionLabel: "deleteStore",
          application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
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
