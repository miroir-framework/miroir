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
    selfApplication: {
      ...{
        parentName: "SelfApplication",
        parentUuid: "a659d350-dd97-4da9-91de-524fa01745dc",
        homePageUrl:
          "/report/5af03c98-fe5e-490b-b08f-e1230971c57f/f714bb2f-a12d-4e71-a03b-74dcedea6eb4/data/9c0cdb97-9537-4ee2-8053-a6ece3e0afe8/xxxxx",
      },
      uuid: selfApplicationUuid,
      name: applicationName,
      defaultLabel: `The ${applicationName} selfApplication`,
      description: `The model and data of the ${applicationName} selfApplication`,
    },
    applicationModelBranch: {
      ...{
        parentName: "ApplicationModelBranch",
        parentUuid: "cdb0aec6-b848-43ac-a058-fe2dbe5811f1",
        name: "master",
      },
      uuid: applicationModelBranchUuid,
      selfApplication: selfApplicationUuid,
      headVersion: selfApplicationVersionUuid,
      description: `The master branch of the ${applicationName} SelfApplication`,
    } as any,
    applicationVersion: {
      ...{
        parentName: "ApplicationVersion",
        parentUuid: "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24",
        name: "Initial",
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
