import { selfApplicationMiroir } from "..";
import { Uuid } from "../0_interfaces/1_core/EntityDefinition";
import {
  GetBasicApplicationConfigurationParameters,
  StoreUnitConfiguration,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { InitApplicationParameters } from "../0_interfaces/4-services/PersistenceStoreControllerInterface";
import { defaultMiroirMetaModel } from "../1_core/Model";

export function getBasicStoreUnitConfiguration(
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

  return {
    dataStoreType: paramSelfApplicationUuid == selfApplicationMiroir.uuid ? "miroir" : "app", // TODO: comparison between deployment and selfAdminConfigurationDeployment
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
      ...{
        // uuid: "5af03c98-fe5e-490b-b08f-e1230971c57f",
        parentName: "SelfApplication",
        parentUuid: "a659d350-dd97-4da9-91de-524fa01745dc",
        // name: "Library",
        // defaultLabel: "The Library selfApplication.",
        // description: "The model and data of the Library selfApplication.",
        homePageUrl:
          "/report/5af03c98-fe5e-490b-b08f-e1230971c57f/f714bb2f-a12d-4e71-a03b-74dcedea6eb4/data/9c0cdb97-9537-4ee2-8053-a6ece3e0afe8/xxxxx",
      },
      uuid: selfApplicationUuid,
      name: applicationName,
      defaultLabel: `The ${applicationName} selfApplication`,
      description: `The model and data of the ${applicationName} selfApplication`,
    },
    // deployment: {
    //   ...selfApplicationDeploymentLibrary,
    //   selfApplication: selfApplicationUuid,
    //   uuid: adminConfigurationDeploymentUuid,
    // },
    applicationModelBranch: {
      ...{
        // uuid: "9034141b-0d0d-4beb-82af-dfc02be15c2d",
        parentName: "ApplicationModelBranch",
        parentUuid: "cdb0aec6-b848-43ac-a058-fe2dbe5811f1",
        // selfApplication: "5af03c98-fe5e-490b-b08f-e1230971c57f",
        // headVersion: "419773b4-a73c-46ca-8913-0ee27fb2ce0a",
        name: "master",
        // description: "The master branch of the Library SelfApplication",
      },
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
      ...{
        // uuid: "419773b4-a73c-46ca-8913-0ee27fb2ce0a",
        parentName: "ApplicationVersion",
        parentUuid: "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24",
        name: "Initial",
        // selfApplication: "5af03c98-fe5e-490b-b08f-e1230971c57f",
        // branch: "9034141b-0d0d-4beb-82af-dfc02be15c2d",
        // description: "Initial Library selfApplication version",
        previousVersion: "",
        modelStructureMigration: [],
        modelCUDMigration: [],
      },
      uuid: selfApplicationVersionUuid,
      selfApplication: selfApplicationUuid,
      branch: applicationModelBranchUuid,
      description: `Initial ${applicationName} selfApplication version`,
    } as any,
  };
}
