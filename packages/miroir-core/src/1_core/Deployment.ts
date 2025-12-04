import type { MetaEntity, Uuid } from "../0_interfaces/1_core/EntityDefinition";
import type {
  AdminApplication,
  CompositeAction,
  Deployment,
  EntityDefinition,
  EntityInstance,
  MiroirConfigClient,
  StoreUnitConfiguration,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import type { InitApplicationParameters } from "../0_interfaces/4-services/PersistenceStoreControllerInterface";
import { MiroirLoggerFactory } from "../4_services/MiroirLoggerFactory";
import { packageName } from "../constants";
import { cleanLevel } from "./constants";

const selfApplicationMiroir = require('../assets/miroir_data/a659d350-dd97-4da9-91de-524fa01745dc/360fcf1f-f0d4-4f8a-9262-07886e70fa15.json');
// const selfApplicationDeploymentMiroir = require('../assets/miroir_data/35c5608a-7678-4f07-a4ec-76fc5bc35424/10ff36f2-50a3-48d8-b80f-e48e5d13af8e.json');
// const selfApplicationModelBranchMiroirMasterBranch = require('../assets/miroir_data/cdb0aec6-b848-43ac-a058-fe2dbe5811f1/ad1ddc4e-556e-4598-9cff-706a2bde0be7.json');
// const selfApplicationVersionInitialMiroirVersion = require('../assets/miroir_data/c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24/695826c2-aefa-4f5f-a131-dee46fe21c1.json');
// const selfApplicationStoreBasedConfigurationMiroir = require('../assets/miroir_data/7990c0c9-86c3-40a1-a121-036c91b55ed7/21840247-b5b1-4344-baec-f818f4797d92.json');
const adminConfigurationDeploymentMiroir = require("../assets/admin_data/7959d814-400c-4e80-988f-a00fe582ab98/10ff36f2-50a3-48d8-b80f-e48e5d13af8e.json");
const adminConfigurationDeploymentLibrary = require("../assets/admin_data/7959d814-400c-4e80-988f-a00fe582ab98/f714bb2f-a12d-4e71-a03b-74dcedea6eb4.json"); //assert { type: "json" };
// const instanceConfigurationReference = require('../assets/miroir_data/7990c0c9-86c3-40a1-a121-036c91b55ed7/360fcf1f-f0d4-4f8a-9262-07886e70fa15.json');
// const entityEntity = require('../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad.json');
// const entitySelfApplicationVersion = require('../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24.json');
const adminSelfApplication = require("../assets/admin_model/a659d350-dd97-4da9-91de-524fa01745dc/55af124e-8c05-4bae-a3ef-0933d41daa92.json"); //assert { type: "json" };
const adminConfigurationDeploymentAdmin = require("../assets/admin_data/7959d814-400c-4e80-988f-a00fe582ab98/18db21bf-f8d3-4f6a-8296-84b69f6dc48b.json"); //assert { type: "json" };
const entityApplicationForAdmin = require("../assets/admin_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/25d935e7-9e93-42c2-aade-0472b883492b.json"); //assert { type: "json" };
const entityDeployment = require("../assets/admin_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/7959d814-400c-4e80-988f-a00fe582ab98.json"); //assert { type: "json" };

const adminAdminApplication = require("../assets/admin_data/25d935e7-9e93-42c2-aade-0472b883492b/f3e04bb2-005f-484b-aaf2-072232f60f2c.json"); //assert { type: "json" };
const adminMiroirApplication = require("../assets/admin_data/25d935e7-9e93-42c2-aade-0472b883492b/79a8fa03-cb64-45c8-9f85-7f8336bf92a5.json"); //assert { type: "json" };
const adminLibraryApplication = require("../assets/admin_data/25d935e7-9e93-42c2-aade-0472b883492b/dbabc841-b1fb-48f6-a31a-b8ce294127da.json"); //assert { type: "json" };

const selfApplicationLibrary = require("../assets/library_model/a659d350-dd97-4da9-91de-524fa01745dc/5af03c98-fe5e-490b-b08f-e1230971c57f.json");
// const selfApplicationDeploymentLibrary = require("../assets/library_model/35c5608a-7678-4f07-a4ec-76fc5bc35424/f714bb2f-a12d-4e71-a03b-74dcedea6eb4.json");

export const defaultSelfApplicationDeploymentMap: Record<Uuid, Uuid> = {
  [selfApplicationMiroir.uuid]: adminConfigurationDeploymentMiroir.uuid,
  [adminSelfApplication.uuid]: adminConfigurationDeploymentAdmin.uuid,
  [selfApplicationLibrary.uuid]: adminConfigurationDeploymentLibrary.uuid,
};

export const defaultAdminApplicationDeploymentMap: Record<Uuid, Uuid> = {
  [adminMiroirApplication.uuid]: adminConfigurationDeploymentMiroir.uuid,
  [adminAdminApplication.uuid]: adminConfigurationDeploymentAdmin.uuid,
  [adminLibraryApplication.uuid]: adminConfigurationDeploymentLibrary.uuid,
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
  newAdminAppApplicationUuid: Uuid,
  newSelfApplicationUuid: Uuid,
  newApplicationName: string,
  deploymentConfiguration: StoreUnitConfiguration
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
                } as AdminApplication,
              ],
            },
          ],
        },
      },
    ],
  };
  log.info("createApplicationCompositeAction result =", result);
  return result;
}

// ################################################################################################
export function createDeploymentCompositeAction(
  applicationName: string,
  deploymentUuid: Uuid,
  adminApplicationUuid: Uuid,
  deploymentConfiguration: StoreUnitConfiguration
): CompositeAction {
  log.info(
    "createDeploymentCompositeAction deploymentConfiguration",
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
                  adminApplication: adminApplicationUuid,
                  configuration: deploymentConfiguration,
                } as Deployment,
              ],
            },
          ],
        },
      },
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

  log.info(
    "createDeploymentCompositeAction deploymentConfiguration",
    adminApplicationDeploymentUuid
  );
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
        },
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
        },
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
        },
      },
    ],
  };
}

// ################################################################################################
export function deleteApplicationAndDeploymentCompositeAction(
  miroirConfig: MiroirConfigClient,
  deploymentUuid: Uuid
): CompositeAction {
  console.log(
    "deleteApplicationAndDeploymentCompositeAction",
    deploymentUuid,
    JSON.stringify(miroirConfig, null, 2)
  );
  return {
    actionType: "compositeAction",
    actionLabel: "deleteApplicationAndDeployment",
    actionName: "sequence",
    definition: [
      {
        actionType: "storeManagementAction_deleteStore",
        actionLabel: "deleteStore",
        endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
        deploymentUuid,
        configuration: miroirConfig.client.emulateServer
          ? miroirConfig.client.deploymentStorageConfig[deploymentUuid]
          : miroirConfig.client.serverConfig.storeSectionConfiguration[deploymentUuid],
      },
    ],
  };
}
