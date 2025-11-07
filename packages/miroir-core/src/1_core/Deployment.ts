import { adminConfigurationDeploymentAdmin, entityApplicationForAdmin, entityDeployment } from "..";
import type { MetaEntity, Uuid } from "../0_interfaces/1_core/EntityDefinition";
import type { AdminApplication, CompositeAction, Deployment, EntityDefinition, EntityInstance, StoreUnitConfiguration } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import type { InitApplicationParameters } from "../0_interfaces/4-services/PersistenceStoreControllerInterface";
import { MiroirLoggerFactory } from "../4_services/MiroirLoggerFactory";
import { packageName } from "../constants";
import { cleanLevel } from "./constants";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "Deployment"), "action"
).then((logger: LoggerInterface) => {log = logger});

// ################################################################################################
export function createApplicationCompositeAction(
  deploymentUuid: Uuid,
  newAdminAppApplicationUuid: Uuid,
  newSelfApplicationUuid: Uuid,
  newApplicationName: string,
  deploymentConfiguration: StoreUnitConfiguration,
): CompositeAction {
  const result: CompositeAction = {
    actionType: "compositeAction",
    actionLabel: "beforeAll",
    actionName: "sequence",
    definition: [
      {
        actionType: "createInstance",
        actionLabel: "createApplicationForAdminAction",
        deploymentUuid: deploymentUuid,
        // applicationSection: "data",
        endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
        payload: {
          applicationSection: "data",
          objects: [
            {
              parentName: entityApplicationForAdmin.name,
              parentUuid: entityApplicationForAdmin.uuid,
              applicationSection: "data",
              instances: [
                {
                  uuid: newAdminAppApplicationUuid,
                  parentName: entityApplicationForAdmin.name,
                  parentUuid: entityApplicationForAdmin.uuid,
                  name: newApplicationName,
                  defaultLabel: `The ${newApplicationName} Admin Application.`,
                  description: `This Admin Application contains the ${newApplicationName} model and data.`,
                  selfApplication: newSelfApplicationUuid,
                }  as AdminApplication,
              ],
            },
          ],
        },
        // action: {
        //   transformerType: "getFromParameters",
        //   referenceName: "createApplicationForAdminAction",
        // }
      },
    ],
  };
  log.info("createApplicationCompositeAction result =", result);
  return result;
}
export function createDeploymentCompositeAction(
  applicationName: string,
  deploymentUuid: Uuid,
  deploymentConfiguration: StoreUnitConfiguration,
): CompositeAction {
  log.info("createDeploymentCompositeAction deploymentConfiguration", 
    "deploymentUuid:", 
    deploymentUuid, 
    "deploymentConfiguration:",
    deploymentConfiguration
  );
  return {
    actionType: "compositeAction",
    actionLabel: "beforeAll",
    actionName: "sequence",
    definition: [
      {
        // actionType: "storeManagementAction",
        actionType: "storeManagementAction_openStore",
        actionLabel: "storeManagementAction_openStore",
        endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
        deploymentUuid: deploymentUuid,
        configuration: {
          [deploymentUuid]: deploymentConfiguration,
        },
      },
      {
        // actionType: "storeManagementAction",
        actionType: "storeManagementAction_createStore",
        actionLabel: "storeManagementAction_createStore",
        endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
        deploymentUuid: deploymentUuid,
        configuration: deploymentConfiguration,
      },
      {
        actionType: "createInstance",
        actionLabel: "CreateDeploymentInstances",
        deploymentUuid: adminConfigurationDeploymentAdmin.uuid,
        endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
        payload: {
          applicationSection: "data",
          objects: [
            {
              parentName: "Deployment",
              parentUuid: deploymentUuid,
              applicationSection: "data",
              instances: [
                // {
                //     uuid: string;
                //     parentName?: string | undefined;
                //     parentUuid: string;
                //     parentDefinitionVersionUuid?: string | undefined;
                //     name: string;
                //     defaultLabel: string;
                //     description?: string | undefined;
                //     adminApplication: string;
                //     bundle: string;
                //     configuration?: StoreUnitConfiguration | undefined;
                //     model?: JzodObject | undefined;
                //     data?: JzodObject | undefined;
                // }
                {
                  uuid: deploymentUuid,
                  parentName: "Deployment",
                  parentUuid: entityDeployment.uuid,
                  name: `Deployment of application ${applicationName}`,
                  defaultLabel: `The deployment of application ${applicationName}`,
                  description: `The description of deployment of application ${applicationName}`,
                } as Deployment,
              ],
            },
          ],
        }
      }
    ],
  };
}

// ################################################################################################
export type ApplicationEntitiesAndInstances = {
  entity: MetaEntity;
  entityDefinition: EntityDefinition;
  instances: EntityInstance[];
}[];

// ################################################################################################
export function resetAndinitializeDeploymentCompositeAction(
  adminApplicationDeploymentUuid: Uuid,
  initApplicationParameters: InitApplicationParameters,
  appEntitesAndInstances: ApplicationEntitiesAndInstances
): CompositeAction {
  // const typedAdminConfigurationDeploymentLibrary:AdminApplicationDeploymentConfiguration = adminConfigurationDeploymentLibrary as any;

  // const deploymentUuid = initApplicationParameters.selfApplicationDeploymentConfiguration.uuid;
  const deploymentUuid = adminApplicationDeploymentUuid;

  log.info("createDeploymentCompositeAction deploymentConfiguration", adminApplicationDeploymentUuid);
  return {
    actionType: "compositeAction",
    actionLabel: "beforeEach",
    actionName: "sequence",
    definition: [
      {
        actionType: "resetModel",
        actionLabel: "resetApplicationStore",
        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        deploymentUuid: deploymentUuid,
      },
      {
        actionType: "initModel",
        actionLabel: "initStore",
        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        deploymentUuid: deploymentUuid,
        payload: {
          params: initApplicationParameters,
        }
      },
      {
        actionType: "rollback",
        actionLabel: "refreshLocalCacheForApplication",
        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        deploymentUuid: deploymentUuid,
      },
      {
        actionType: "createEntity",
        actionLabel: "CreateApplicationStoreEntities",
        deploymentUuid: deploymentUuid,
        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        payload: {
          entities: appEntitesAndInstances,
        }
      },
      {
        actionType: "commit",
        actionLabel: "CommitApplicationStoreEntities",
        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        deploymentUuid: deploymentUuid,
      },
      {
        actionType: "createInstance",
        actionLabel: "CreateApplicationStoreInstances",
        endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
        deploymentUuid: deploymentUuid,
        payload: {
          applicationSection: "data",
          objects: appEntitesAndInstances.map((e) => {
            return {
              parentName: e.entity.name,
              parentUuid: e.entity.uuid,
              applicationSection: "data",
              instances: e.instances,
            };
          }),
        }
      },
    ],
  };
}

