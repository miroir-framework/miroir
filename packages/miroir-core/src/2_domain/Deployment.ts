import { Uuid } from "../0_interfaces/1_core/EntityDefinition.js";
import { GetBasicApplicationConfigurationParameters } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { AdminApplicationDeploymentConfiguration } from "../0_interfaces/1_core/StorageConfiguration.js";
import { InitApplicationParameters } from "../0_interfaces/4-services/PersistenceStoreControllerInterface.js";
import { defaultMiroirMetaModel } from "../1_core/Model.js";
import {
  adminConfigurationDeploymentLibrary,
  adminConfigurationDeploymentMiroir,
  selfApplicationDeploymentLibrary,
  selfApplicationLibrary,
  selfApplicationModelBranchLibraryMasterBranch,
  selfApplicationStoreBasedConfigurationLibrary,
  selfApplicationVersionLibraryInitialVersion,
  StoreUnitConfiguration,
} from "../index.js";

const typedAdminConfigurationDeploymentLibrary:AdminApplicationDeploymentConfiguration = adminConfigurationDeploymentLibrary as any;

// const getBasicApplicationConfigurationParametersSchema: JzodElement = {
//   type: "union",
//   discriminator: {
//     discriminatorType: "string",
//     value: "emulatedServerType",
//   },
//   definition: [
//     {
//       type: "object",
//       definition: {
//         emulatedServerType: {
//           type: "literal",
//           definition: "sql",
//         },
//         connectionString: {
//           type: "string",
//         }
//       },
//     },
//     {
//       type: "object",
//       definition: {
//         emulatedServerType: {
//           type: "literal",
//           definition: "indexedDb",
//         },
//         rootIndexDbName: {
//           type: "string",
//         }
//       },
//     },
//     {
//       type: "object",
//       definition: {
//         emulatedServerType: {
//           type: "literal",
//           definition: "filesystem",
//         },
//         rootDirectory: {
//           type: "string",
//         }
//       },
//     },
//   ],
// };

// export type getBasicApplicationConfigurationParameters = z.infer<typeof getBasicApplicationConfigurationParametersSchema>;

// export interface getBasicApplicationConfigurationParameters {
// export interface getBasicApplicationConfigurationParameters {
// }

export function getBasicStoreUnitConfiguration(
  // emulatedServerType: "sql" | "indexedDb" | "filesystem"
  applicationName: string,
  params: GetBasicApplicationConfigurationParameters
):StoreUnitConfiguration {
  switch (params.emulatedServerType) {
    case "filesystem": {
      return {
        admin: {
          emulatedServerType: "filesystem",
          directory:  `${params.rootDirectory}/admin`
        },
        model: {
          emulatedServerType: "filesystem",
          directory:  `${params.rootDirectory}/${applicationName}_model`
        },
        data: {
          emulatedServerType: "filesystem",
          directory:  `${params.rootDirectory}/${applicationName}_data`
        }
      }
    }
    case "sql": {
      return {
        admin: {
          emulatedServerType: "sql",
          connectionString: params.connectionString,
          schema: "miroirAdmin",
        },
        model: {
          emulatedServerType: "sql",
          connectionString: params.connectionString,
          schema: applicationName, // TODO: separate model and data schemas
        },
        data: {
          emulatedServerType: "sql",
          connectionString: params.connectionString,
          schema: applicationName, // TODO: separate model and data schemas
        }
      }
    }
    case "indexedDb": {
      return {
        admin: {
          emulatedServerType: "indexedDb",
          indexedDbName: `${params.rootIndexDbName}_admin`,
        },
        model: {
          emulatedServerType: "indexedDb",
          indexedDbName: `${params.rootIndexDbName}_model`,
        },
        data: {
          emulatedServerType: "indexedDb",
          indexedDbName: `${params.rootIndexDbName}_data`,
        }
      }
    }
  }

}


export function getBasicApplicationConfiguration(
  applicationName: string,
  paramSelfApplicationUuid: Uuid,
  paramAdminConfigurationDeploymentUuid: Uuid,
  applicationModelBranchUuid: Uuid,
  selfApplicationVersionUuid: Uuid,
): InitApplicationParameters {
  const selfApplicationUuid: Uuid = paramSelfApplicationUuid;
  const adminConfigurationDeploymentUuid: Uuid = paramAdminConfigurationDeploymentUuid;
  // const selfApplicationUuid: Uuid = paramSelfApplicationUuid ?? selfApplicationLibrary.uuid;
  // const adminConfigurationDeploymentUuid: Uuid = paramAdminConfigurationDeploymentUuid ?? adminConfigurationDeploymentLibrary.uuid;
  const applicationNameLC = applicationName.toLowerCase();

  return {
    dataStoreType:
      adminConfigurationDeploymentLibrary.uuid == adminConfigurationDeploymentMiroir.uuid ? "miroir" : "app", // TODO: comparison between deployment and selfAdminConfigurationDeployment
    metaModel: defaultMiroirMetaModel,
    // adminApplicationDeploymentConfiguration: {
    //   ...typedAdminConfigurationDeploymentLibrary,
    //   uuid: adminConfigurationDeploymentUuid,
    //   selfApplication: selfApplicationUuid,
    //   configuration: getBasicStoreUnitConfiguration(applicationNameLC, {
    //     emulatedServerType: "filesystem",
    //     rootDirectory: `../miroir-core/src/assets`
    //   }),
    // },
    selfApplication: {
      ...selfApplicationLibrary,
      uuid: selfApplicationUuid,
      name: applicationName,
      defaultLabel: `The ${applicationName} selfApplication`,
      description: `The model and data of the ${applicationName} selfApplication`,
    },
    // selfApplicationDeploymentConfiguration: {
    //   ...selfApplicationDeploymentLibrary,
    //   selfApplication: selfApplicationUuid,
    //   uuid: adminConfigurationDeploymentUuid,
    // },
    applicationModelBranch: {
      ...selfApplicationModelBranchLibraryMasterBranch,
      uuid: applicationModelBranchUuid,
      selfApplication: selfApplicationUuid,
      headVersion: selfApplicationVersionUuid,
      description: `The master branch of the ${applicationName} SelfApplication`,
    } as any,
    // applicationStoreBasedConfiguration: {
    //   ...selfApplicationStoreBasedConfigurationLibrary,
    //   defaultLabel: `The reference configuration for the ${applicationName} selfApplication storage`,
    // } as any,
    applicationVersion: {
      ...selfApplicationVersionLibraryInitialVersion,
      uuid: selfApplicationVersionUuid,
      selfApplication: selfApplicationUuid,
      branch: applicationModelBranchUuid,
      description: `Initial ${applicationName} selfApplication version`,
    } as any,
  };
}
