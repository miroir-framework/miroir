import * as path from "path";

// import { miroirStoreFileSystemStartup } from "../dist/bundle";
import {
  ConfigurationService,
  IStoreController,
  MiroirConfig,
  MiroirLoggerFactory,
  StoreControllerFactory,
  applicationDeploymentLibrary,
  applicationDeploymentMiroir,
  applicationLibrary,
  applicationMiroir,
  applicationModelBranchLibraryMasterBranch,
  applicationModelBranchMiroirMasterBranch,
  applicationStoreBasedConfigurationLibrary,
  applicationStoreBasedConfigurationMiroir,
  applicationVersionInitialMiroirVersion,
  applicationVersionLibraryInitialVersion,
  defaultLevels,
  defaultMiroirMetaModel,
} from "miroir-core";
import { loglevelnext } from "./loglevelnextImporter";

let localMiroirStoreController: IStoreController;
let localAppStoreController: IStoreController;

import loggerOptions from "./specificLoggersConfig_default.json";
import { miroirStoreFileSystemStartup } from "../src/startup";

MiroirLoggerFactory.setEffectiveLoggerFactory(
  loglevelnext,
  (defaultLevels as any)[loggerOptions.defaultLevel as string],
  loggerOptions.defaultTemplate,
  loggerOptions.specificLoggerOptions
);


export async function loadConfigFile(pwd: string, fileRelativePath:string): Promise<MiroirConfig> {
  // log.log("@@@@@@@@@@@@@@@@@@ env", process.env["PWD"]);
  // log.log("@@@@@@@@@@@@@@@@@@ env", process.env["npm_config_env"]);
  const configFilePath = path.join(pwd, fileRelativePath)
  console.log("@@@@@@@@@@@@@@@@@@ configFilePath", configFilePath);
  const configFileContents = await import(configFilePath);
  console.log("@@@@@@@@@@@@@@@@@@ configFileContents", configFileContents);

  const miroirConfig:MiroirConfig = configFileContents as MiroirConfig;

  console.log("@@@@@@@@@@@@@@@@@@ miroirConfig", miroirConfig);
  return miroirConfig;
}

console.log("@@@@@@@@@@@@@@@@@@ env", process.env["PWD"]);
console.log("@@@@@@@@@@@@@@@@@@ env", process.env["npm_config_env"]);
// const miroirConfig:MiroirConfig = (async ()=>await loadConfigFile(process.env["PWD"]??"",process.env["npm_config_env"]??""))();
const miroirConfig:MiroirConfig = await loadConfigFile(process.env["PWD"]??"",process.env["npm_config_env"]??"");

console.log("@@@@@@@@@@@@@@@@@@ miroirConfig", miroirConfig);

// ################################################################################################
beforeAll(
  async () => {
    miroirStoreFileSystemStartup();
    const {
      localMiroirStoreController:a,localAppStoreController:b
    } = await StoreControllerFactory(
      ConfigurationService.storeFactoryRegister,
      miroirConfig,
    );
    localMiroirStoreController = a;
    localAppStoreController = b;

    await localMiroirStoreController?.open();
    await localAppStoreController?.open();
  }
)

beforeEach(
  async  () => {
    try {
      console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ miroirBeforeEach');
      await localAppStoreController.clear();
      await localMiroirStoreController.clear();
      try {
        console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ miroirBeforeEach initApplication miroir START');
        await localMiroirStoreController.initApplication(
          defaultMiroirMetaModel,
          'miroir',
          applicationMiroir,
          applicationDeploymentMiroir,
          applicationModelBranchMiroirMasterBranch,
          applicationVersionInitialMiroirVersion,
          applicationStoreBasedConfigurationMiroir,
        );
        console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ miroirBeforeEach initApplication miroir END');
      } catch (error) {
        console.error('could not initApplication for miroir datastore, can not go further!');
        throw(error);
      }
      try {
        console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ miroirBeforeEach initApplication app START');
        await localAppStoreController.initApplication(
          defaultMiroirMetaModel,
          'app',
          applicationLibrary,
          applicationDeploymentLibrary,
          applicationModelBranchLibraryMasterBranch,
          applicationVersionLibraryInitialVersion,
          applicationStoreBasedConfigurationLibrary,
        );
        console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ miroirBeforeEach initApplication app END');
      } catch (error) {
        console.error('could not initApplication for app datastore, can not go further!');
        throw(error);
      }
    } catch (error) {
      console.error('beforeEach',error);
      throw(error);
    }
    console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ Done miroirBeforeEach');
    console.trace("miroirBeforeEach miroir model state", await localMiroirStoreController.getModelState());
    console.trace("miroirBeforeEach miroir data state", await localMiroirStoreController.getDataState());
    console.trace("miroirBeforeEach library app model state", await localAppStoreController.getModelState());
    console.trace("miroirBeforeEach library app data state", await localAppStoreController.getDataState());
  }
)

// ##############################################################################################
// ##############################################################################################
// ##############################################################################################
describe("localCacheSlice.unit.test", () => {

  it("getLocalCacheIndexEntityUuid", async () => {
    expect(
      await localMiroirStoreController.getInstances("model","16dbfe28-e1d7-4f20-9ba4-c1a9873202ad")
    ).toEqual(
      {
      "applicationSection": "model",
      "instances": [
        {
          "application": "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          "conceptLevel": "MetaModel",
          "description": "The Metaclass for entities.",
          "name": "Entity",
          "parentName": "Entity",
          "parentUuid": "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          "uuid": "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
        },
         {
          "application": "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          "conceptLevel": "Model",
          "description": "An Application Deployment",
          "name": "ApplicationDeployment",
          "parentName": "Entity",
          "parentUuid": "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          "uuid": "35c5608a-7678-4f07-a4ec-76fc5bc35424",
        },
         {
          "application": "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          "conceptLevel": "Model",
          "description": "Report, allowing to display model instances",
          "name": "Report",
          "parentName": "Entity",
          "parentUuid": "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          "uuid": "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
        },
         {
          "application": "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          "conceptLevel": "MetaModel",
          "description": "The Metaclass for the definition of entities.",
          "name": "EntityDefinition",
          "parentName": "Entity",
          "parentUuid": "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          "uuid": "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
        },
         {
          "application": "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          "conceptLevel": "Model",
          "description": "Common Jzod Schema definitions, available to all Entity definitions",
          "name": "JzodSchema",
          "parentName": "Entity",
          "parentUuid": "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          "uuid": "5e81e1b9-38be-487c-b3e5-53796c57fccf",
        },
         {
          "application": "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          "conceptLevel": "Model",
          "description": "A configuration of storage-related aspects of a Model.",
          "name": "StoreBasedConfiguration",
          "parentName": "Entity",
          "parentUuid": "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          "uuid": "7990c0c9-86c3-40a1-a121-036c91b55ed7",
        },
         {
          "application": "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          "conceptLevel": "Model",
          "description": "An Application",
          "name": "Application",
          "parentName": "Entity",
          "parentUuid": "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          "uuid": "a659d350-dd97-4da9-91de-524fa01745dc",
        },
         {
          "application": "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          "conceptLevel": "Model",
          "description": "A Version of an Application",
          "name": "ApplicationVersion",
          "parentName": "Entity",
          "parentUuid": "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          "uuid": "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24",
        },
         {
          "application": "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          "conceptLevel": "Model",
          "description": "A Branch of an Application Model",
          "name": "ApplicationModelBranch",
          "parentName": "Entity",
          "parentUuid": "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          "uuid": "cdb0aec6-b848-43ac-a058-fe2dbe5811f1",
        },
      ],
      "parentUuid": "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
    }
    );
  });

});
