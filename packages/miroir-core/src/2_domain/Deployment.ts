import { Uuid } from "../0_interfaces/1_core/EntityDefinition.js";
import { InitApplicationParameters } from "../0_interfaces/4-services/PersistenceStoreControllerInterface.js";
import { defaultMiroirMetaModel } from "../1_core/Model.js";
import { applicationDeploymentLibrary } from "../ApplicationDeploymentLibrary.js";
import {
  adminConfigurationDeploymentLibrary,
  adminConfigurationDeploymentMiroir,
  selfApplicationLibrary,
  selfApplicationDeploymentLibrary,
  selfApplicationModelBranchLibraryMasterBranch,
  selfApplicationStoreBasedConfigurationLibrary,
  selfApplicationVersionLibraryInitialVersion,
} from "../index.js";

export function getBasicApplicationConfiguration(
  applicationName: string,
  paramApplicationUuid?: Uuid,
  paramDeploymentUuid?: Uuid,
): InitApplicationParameters {
  // const applicationUuid: Uuid = paramApplicationUuid ?? "dbabc841-b1fb-48f6-a31a-b8ce294127da";
  // const applicationUuid: Uuid = paramApplicationUuid ?? adminConfigurationDeploymentLibrary.application;
  const applicationUuid: Uuid = paramApplicationUuid ?? selfApplicationLibrary.uuid;
  // const deploymentUuid: Uuid = paramDeploymentUuid ?? "a659d350-dd97-4da9-91de-524fa01745dc";
  const deploymentUuid: Uuid = paramDeploymentUuid ?? adminConfigurationDeploymentLibrary.uuid;
  const applicationNameLC = applicationName.toLowerCase();

  return {
    dataStoreType:
      adminConfigurationDeploymentLibrary.uuid == adminConfigurationDeploymentMiroir.uuid ? "miroir" : "app", // TODO: comparison between deployment and selfAdminConfigurationDeployment
    metaModel: defaultMiroirMetaModel,
    // application: selfApplicationMiroir,
    application: {
      ...selfApplicationLibrary,
      // "uuid": "5af03c98-fe5e-490b-b08f-e1230971c57f",
      "uuid": applicationUuid,
      // "parentName":"Application",
      // "parentUuid":"a659d350-dd97-4da9-91de-524fa01745dc",
      // "name":"Library",
      "name":applicationName,
      "defaultLabel": `The ${applicationName} application.`,
      "description": `The model and data of the ${applicationName} application.`,
      // "selfApplication": "5af03c98-fe5e-490b-b08f-e1230971c57f"
      "selfApplication": applicationUuid
    },
    adminApplicationDeploymentConfiguration: {
      ...adminConfigurationDeploymentLibrary,
      uuid: deploymentUuid,
      //   "application":"dbabc841-b1fb-48f6-a31a-b8ce294127da",
      application: applicationUuid,
    } as any,
    selfApplicationDeploymentConfiguration: {
      ...selfApplicationDeploymentLibrary,
      application: applicationUuid,
      uuid: deploymentUuid,
    },
    // applicationModelBranch: selfApplicationModelBranchMiroirMasterBranch,
    applicationModelBranch: {
      ...selfApplicationModelBranchLibraryMasterBranch,
      application: applicationUuid,
    } as any,
    // applicationStoreBasedConfiguration: selfApplicationStoreBasedConfigurationMiroir,
    applicationStoreBasedConfiguration: selfApplicationStoreBasedConfigurationLibrary,
    // applicationVersion: selfApplicationVersionInitialMiroirVersion,
    applicationVersion: {
      ...selfApplicationVersionLibraryInitialVersion,
      application: applicationUuid,
    } as any,
  }
}
