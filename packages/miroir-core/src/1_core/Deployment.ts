import type { MetaEntity, Uuid } from "../0_interfaces/1_core/EntityDefinition";
import type {
  AdminApplication,
  CompositeActionSequence,
  Deployment,
  EntityDefinition,
  EntityInstance,
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
// import selfApplicationDeploymentMiroir from '../assets/miroir_data/35c5608a-7678-4f07-a4ec-76fc5bc35424/10ff36f2-50a3-48d8-b80f-e48e5d13af8e.json';
// import selfApplicationModelBranchMiroirMasterBranch from '../assets/miroir_data/cdb0aec6-b848-43ac-a058-fe2dbe5811f1/ad1ddc4e-556e-4598-9cff-706a2bde0be7.json';
// import selfApplicationVersionInitialMiroirVersion from '../assets/miroir_data/c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24/695826c2-aefa-4f5f-a131-dee46fe21c1.json';
// import selfApplicationStoreBasedConfigurationMiroir from '../assets/miroir_data/7990c0c9-86c3-40a1-a121-036c91b55ed7/21840247-b5b1-4344-baec-f818f4797d92.json';
import adminConfigurationDeploymentMiroir from "../assets/admin_data/7959d814-400c-4e80-988f-a00fe582ab98/10ff36f2-50a3-48d8-b80f-e48e5d13af8e.json";
import adminConfigurationDeploymentLibrary from "../assets/admin_data/7959d814-400c-4e80-988f-a00fe582ab98/f714bb2f-a12d-4e71-a03b-74dcedea6eb4.json";
// import instanceConfigurationReference from '../assets/miroir_data/7990c0c9-86c3-40a1-a121-036c91b55ed7/360fcf1f-f0d4-4f8a-9262-07886e70fa15.json';
// import entityEntity from '../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad.json';
// import entitySelfApplicationVersion from '../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24.json';
import adminSelfApplication from "../assets/admin_model/a659d350-dd97-4da9-91de-524fa01745dc/55af124e-8c05-4bae-a3ef-0933d41daa92.json";
import adminConfigurationDeploymentAdmin from "../assets/admin_data/7959d814-400c-4e80-988f-a00fe582ab98/18db21bf-f8d3-4f6a-8296-84b69f6dc48b.json";
import entityApplicationForAdmin from "../assets/admin_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/25d935e7-9e93-42c2-aade-0472b883492b.json";
import entityDeployment from "../assets/admin_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/7959d814-400c-4e80-988f-a00fe582ab98.json";

import adminAdminApplication from "../assets/admin_data/25d935e7-9e93-42c2-aade-0472b883492b/55af124e-8c05-4bae-a3ef-0933d41daa92.json";
import adminMiroirApplication from "../assets/admin_data/25d935e7-9e93-42c2-aade-0472b883492b/360fcf1f-f0d4-4f8a-9262-07886e70fa15.json";
import adminLibraryApplication from "../assets/admin_data/25d935e7-9e93-42c2-aade-0472b883492b/5af03c98-fe5e-490b-b08f-e1230971c57f.json";

import selfApplicationLibrary from "../assets/library_model/a659d350-dd97-4da9-91de-524fa01745dc/5af03c98-fe5e-490b-b08f-e1230971c57f.json";
// import selfApplicationDeploymentLibrary from "../assets/library_model/35c5608a-7678-4f07-a4ec-76fc5bc35424/f714bb2f-a12d-4e71-a03b-74dcedea6eb4.json";

export const defaultApplications: SelfApplication[] = [
  selfApplicationMiroir as SelfApplication,
  adminSelfApplication as SelfApplication,
  selfApplicationLibrary as SelfApplication,
];

export const defaultApplicationUuids = defaultApplications.map(application => application.uuid);

export const defaultDeployments: Deployment[] = [
  adminConfigurationDeploymentMiroir as Deployment,
  adminConfigurationDeploymentAdmin as Deployment,
  adminConfigurationDeploymentLibrary as Deployment,
];
export const defaultDeploymentUuids = defaultDeployments.map(deployment => deployment.uuid);

export interface ApplicationDeploymentMap {
  [applicationUuid: Uuid]: Uuid; // deploymentUuid
}

export const defaultSelfApplicationDeploymentMap: ApplicationDeploymentMap = {
  [selfApplicationMiroir.uuid]: adminConfigurationDeploymentMiroir.uuid,
  [adminSelfApplication.uuid]: adminConfigurationDeploymentAdmin.uuid,
  [selfApplicationLibrary.uuid]: adminConfigurationDeploymentLibrary.uuid,
};

export const defaultAdminApplicationDeploymentMapNOTGOOD: ApplicationDeploymentMap = {
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
            deploymentUuid: deploymentUuid,
            application: newSelfApplicationUuid,
            applicationSection: "data",
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
  deploymentConfiguration: StoreUnitConfiguration
): CompositeActionSequence {
  log.info(
    "createDeploymentCompositeAction deploymentConfiguration",
    "newDeploymentUuid:",
    newDeploymentUuid,
    "deploymentConfiguration:",
    deploymentConfiguration
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
          actionLabel: "storeManagementAction_openStore for " + applicationName,
          application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
          payload: {
            application: adminSelfApplication.uuid,
            deploymentUuid: adminConfigurationDeploymentAdmin.uuid,
            configuration: {
              [adminConfigurationDeploymentAdmin.uuid]:
                adminConfigurationDeploymentAdmin.configuration as StoreUnitConfiguration,
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
              [newDeploymentUuid]: deploymentConfiguration,
            },
          },
        },
        {
          // actionType: "storeManagementAction",
          actionType: "storeManagementAction_createStore",
          actionLabel: "storeManagementAction_createStore for " + applicationName,
          application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
          payload: {
            application: selfApplicationUuid,
            deploymentUuid: newDeploymentUuid,
            configuration: deploymentConfiguration,
          },
        },
        {
          actionType: "createInstance",
          actionLabel: "CreateDeploymentInstances for " + applicationName,
          application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
          payload: {
            application: selfApplicationUuid,
            deploymentUuid: adminConfigurationDeploymentAdmin.uuid,
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
                    configuration: deploymentConfiguration,
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
export type ApplicationEntitiesAndInstances = {
  entity: MetaEntity;
  entityDefinition: EntityDefinition;
  instances: EntityInstance[];
}[];

// ################################################################################################
export function resetAndinitializeDeploymentCompositeAction(
  applicationUuid: Uuid,
  deploymentUuid: Uuid,
  initApplicationParameters: InitApplicationParameters,
  appEntitesAndInstances: ApplicationEntitiesAndInstances
): CompositeActionSequence {
  // const typedAdminConfigurationDeploymentLibrary:AdminApplicationDeploymentConfiguration = adminConfigurationDeploymentLibrary as any;

  // const deploymentUuid = initApplicationParameters.selfApplicationDeploymentConfiguration.uuid;
  // const applicationUuid = adminAdminApplication.uuid;
  // const deploymentUuid = deploymentUuid;

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
      // transformerType: "returnValue",
      // interpolation: "runtime",
      // value: {
      definition: [
        {
          actionType: "resetModel",
          actionLabel: "resetApplicationStore",
          application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
          payload: {
            application: applicationUuid,
            deploymentUuid: deploymentUuid,
          },
        },
        {
          actionType: "initModel",
          actionLabel: "initStore",
          application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
          payload: {
            application: applicationUuid,
            deploymentUuid: deploymentUuid,
            params: initApplicationParameters,
            //  this is not a template, no transformer interpolation occurs before runtime
            // transformerType: "returnValue",
            // label: "initParametersForTest",
            // interpolation: "runtime",
            // value: {params: initApplicationParameters},
          },
        },
        {
          actionType: "rollback",
          actionLabel: "refreshLocalCacheForApplication",
          application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
          payload: {
            application: applicationUuid,
            deploymentUuid: deploymentUuid,
          },
        },
        {
          actionType: "createEntity",
          actionLabel: "CreateApplicationStoreEntities",
          application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
          payload: {
            application: applicationUuid,
            deploymentUuid: deploymentUuid,
            entities: appEntitesAndInstances,
          },
        },
        {
          actionType: "commit",
          actionLabel: "CommitApplicationStoreEntities",
          application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
          payload: {
            application: applicationUuid,
            deploymentUuid: deploymentUuid,
          },
        },
        {
          actionType: "createInstance",
          actionLabel: "CreateApplicationStoreInstances",
          application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
          payload: {
            application: applicationUuid,
            deploymentUuid: deploymentUuid,
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
