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
  paramSelfApplicationUuid?: Uuid,
  paramAdminConfigurationDeploymentUuid?: Uuid,
): InitApplicationParameters {
  // const applicationUuid: Uuid = paramApplicationUuid ?? "dbabc841-b1fb-48f6-a31a-b8ce294127da";
  // const applicationUuid: Uuid = paramApplicationUuid ?? adminConfigurationDeploymentLibrary.selfApplication;
  const selfApplicationUuid: Uuid = paramSelfApplicationUuid ?? selfApplicationLibrary.uuid;
  // const deploymentUuid: Uuid = paramDeploymentUuid ?? "a659d350-dd97-4da9-91de-524fa01745dc";
  const adminConfigurationDeploymentUuid: Uuid = paramAdminConfigurationDeploymentUuid ?? adminConfigurationDeploymentLibrary.uuid;
  const applicationNameLC = applicationName.toLowerCase();

  return {
    dataStoreType:
      adminConfigurationDeploymentLibrary.uuid == adminConfigurationDeploymentMiroir.uuid ? "miroir" : "app", // TODO: comparison between deployment and selfAdminConfigurationDeployment
    metaModel: defaultMiroirMetaModel,
    // selfApplication: selfApplicationMiroir,
    adminApplicationDeploymentConfiguration: {
      ...adminConfigurationDeploymentLibrary,
      uuid: adminConfigurationDeploymentUuid, // TODO: adminConfigurationDeploymentConfiguration and selfApplicationDeploymentConfiguration have the same uuid!
      selfApplication: selfApplicationUuid,
      configuration: {
        ...adminConfigurationDeploymentLibrary.configuration,
        // admin: {
        //   ...adminConfigurationDeploymentLibrary.configuration.admin,
        //   directory:  `../miroir-core/src/assets/admin`
        // },
        model: {
          ...adminConfigurationDeploymentLibrary.configuration.model,
          directory:  `../miroir-core/src/assets/${applicationNameLC}_model`
        },
        data: {
          ...adminConfigurationDeploymentLibrary.configuration.model,
          directory:  `../miroir-core/src/assets/${applicationNameLC}_data`
        }
      }
    } as any,
    selfApplication: {
      ...selfApplicationLibrary,
      "uuid": selfApplicationUuid,
      "name":applicationName,
      "defaultLabel": `The ${applicationName} selfApplication.`,
      "description": `The model and data of the ${applicationName} selfApplication.`,
    },
    selfApplicationDeploymentConfiguration: {
      ...selfApplicationDeploymentLibrary,
      selfApplication: selfApplicationUuid,
      uuid: adminConfigurationDeploymentUuid,
    },
    applicationModelBranch: {
      ...selfApplicationModelBranchLibraryMasterBranch,
      selfApplication: selfApplicationUuid,
    } as any,
    applicationStoreBasedConfiguration: selfApplicationStoreBasedConfigurationLibrary,
    applicationVersion: {
      ...selfApplicationVersionLibraryInitialVersion,
      selfApplication: selfApplicationUuid,
    } as any,
  }
}
