import { Uuid } from "../0_interfaces/1_core/EntityDefinition.js";
import { GetBasicApplicationConfigurationParameters, StoreUnitConfiguration } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { AdminApplicationDeploymentConfiguration } from "../0_interfaces/1_core/StorageConfiguration.js";
import { InitApplicationParameters } from "../0_interfaces/4-services/PersistenceStoreControllerInterface.js";
import { defaultMiroirMetaModel } from "../1_core/Model.js";
const menuDefaultAdmin = require("../assets/admin_model/dde4c883-ae6d-47c3-b6df-26bc6e3c1842/dd168e5a-2a21-4d2d-a443-032c6d15eb22.json");
const adminConfigurationDeploymentAdmin = require("../assets/admin_data/7959d814-400c-4e80-988f-a00fe582ab98/18db21bf-f8d3-4f6a-8296-84b69f6dc48b.json");
const adminConfigurationDeploymentMiroir = require("../assets/admin_data/7959d814-400c-4e80-988f-a00fe582ab98/10ff36f2-50a3-48d8-b80f-e48e5d13af8e.json");
const adminConfigurationDeploymentLibrary = require("../assets/admin_data/7959d814-400c-4e80-988f-a00fe582ab98/f714bb2f-a12d-4e71-a03b-74dcedea6eb4.json");
// const adminConfigurationDeploymentTest1 = require("./assets/admin_data/7959d814-400c-4e80-988f-a00fe582ab98/15e2004a-e7a0-4b9e-8acd-6d3500a6c9ad.json");
const entityApplicationForAdmin = require("../assets/admin_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/25d935e7-9e93-42c2-aade-0472b883492b.json");
const entityDeployment = require("../assets/admin_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/7959d814-400c-4e80-988f-a00fe582ab98.json");
const entityDefinitionDeployment = require("../assets/admin_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/c50240e7-c451-46c2-b60a-07b3172a5ef9.json");
const adminApplicationLibrary = require("../assets/admin_data/25d935e7-9e93-42c2-aade-0472b883492b/dbabc841-b1fb-48f6-a31a-b8ce294127da.json");
const selfApplicationLibrary = require("../assets/library_model/a659d350-dd97-4da9-91de-524fa01745dc/5af03c98-fe5e-490b-b08f-e1230971c57f.json");
const selfApplicationStoreBasedConfigurationLibrary = require("../assets/library_model/7990c0c9-86c3-40a1-a121-036c91b55ed7/2e5b7948-ff33-4917-acac-6ae6e1ef364f.json");
const selfApplicationVersionLibraryInitialVersion = require("../assets/library_model/c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24/419773b4-a73c-46ca-8913-0ee27fb2ce0a.json");
const selfApplicationModelBranchLibraryMasterBranch = require("../assets/library_model/cdb0aec6-b848-43ac-a058-fe2dbe5811f1/ad1ddc4e-556e-4598-9cff-706a2bde0be7.json");
const selfApplicationDeploymentLibrary = require('../assets/library_model/35c5608a-7678-4f07-a4ec-76fc5bc35424/f714bb2f-a12d-4e71-a03b-74dcedea6eb4.json');

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

// ################################################################################################
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
