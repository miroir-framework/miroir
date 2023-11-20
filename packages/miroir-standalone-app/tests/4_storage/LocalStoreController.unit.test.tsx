import * as path from "path";

// import { miroirStoreFileSystemStartup } from "../dist/bundle";
import {
  CUDActionName,
  ConfigurationService,
  EntityDefinition,
  EntityInstance,
  EntityInstanceCollection,
  IStoreController,
  MetaEntity,
  MiroirConfig,
  MiroirLoggerFactory,
  ModelCUDInstanceUpdate,
  ModelEntityUpdate,
  ModelEntityUpdateConverter,
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
  author1,
  defaultLevels,
  defaultMiroirMetaModel,
  entityAuthor,
  entityDefinitionAuthor,
  entityEntity,
  entityEntityDefinition,
} from "miroir-core";

let localMiroirStoreController: IStoreController;
let localAppStoreController: IStoreController;

import loggerOptions from "../specificLoggersConfig_default.json";
import { miroirStoreFileSystemStartup } from "miroir-store-filesystem/src/startup";
import { loglevelnext } from "../../src/loglevelnextImporter";
import { miroirStoreIndexedDbStartup } from "miroir-store-indexedDb";
import { miroirStorePostgresStartup } from "miroir-store-postgres";

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
    miroirStoreIndexedDbStartup();
    miroirStorePostgresStartup();
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
    // console.trace("miroirBeforeEach miroir model state", await localMiroirStoreController.getModelState());
    // console.trace("miroirBeforeEach miroir data state", await localMiroirStoreController.getDataState());
    // console.trace("miroirBeforeEach library app model state", await localAppStoreController.getModelState());
    // console.trace("miroirBeforeEach library app data state", await localAppStoreController.getDataState());
  }
)

afterEach(
  async () => {
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ miroirAfterEach")
    try {
      // await localDataStore?.close();
      await localMiroirStoreController.clear();
      await localAppStoreController.clear();
    } catch (error) {
      console.error('Error afterEach',error);
    }
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ Done miroirAfterEach")
  }
)

afterAll(
  async () => {
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ miroirAfterAll")
    try {
      // await (localDataStoreServer as any)?.close();
      await localMiroirStoreController.close();
      await localAppStoreController.close();
    } catch (error) {
      console.error('Error afterAll',error);
    }
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ Done miroirAfterAll")
  }
)

// ##############################################################################################
// ##############################################################################################
// ##############################################################################################
function ignorePostgresExtraAttributes(instances: EntityInstance[]){
  return instances.map(i => Object.fromEntries(Object.entries(i).filter(e=>!["createdAt", "updatedAt", "author"].includes(e[0]))))
}

describe("localCacheSlice.unit.test", () => {

  it("get Miroir Entities", async () => {
    const rawResult = (await localMiroirStoreController.getInstances("model",entityEntity.uuid))
    
    const testResult = (rawResult?.instances??[]).map(
      (i: EntityInstance) => i["uuid"]
    )
    testResult.sort()

    // console.log("!####################### raw result", result);
    // console.log("!####################### test result", mapResult);
    
    expect(testResult).toEqual(
    [
      '16dbfe28-e1d7-4f20-9ba4-c1a9873202ad',
      '35c5608a-7678-4f07-a4ec-76fc5bc35424',
      '3f2baa83-3ef7-45ce-82ea-6a43f7a8c916',
      '54b9c72f-d4f3-4db9-9e0e-0dc840b530bd',
      '5e81e1b9-38be-487c-b3e5-53796c57fccf',
      '7990c0c9-86c3-40a1-a121-036c91b55ed7',
      'a659d350-dd97-4da9-91de-524fa01745dc',
      'c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24',
      'cdb0aec6-b848-43ac-a058-fe2dbe5811f1'
    ]
    );
  });


  it("get Library Entities", async () => {
    expect(
      await localAppStoreController.getInstances("model",entityEntity.uuid)
    ).toEqual(
      {
      "applicationSection": "model",
      "instances": [],
      "parentUuid": entityEntity.uuid,
    }
    );
  });

  it("create Author Entity", async () => {
    await localAppStoreController.createEntity(entityAuthor as MetaEntity,entityDefinitionAuthor as EntityDefinition)

    const rawResult = await localAppStoreController.getInstances("model",entityEntity.uuid);
    const testResult = ignorePostgresExtraAttributes(rawResult?.instances as any??[])

    // console.log("create Author Entity rawResult", rawResult);
    // console.log("create Author Entity testResult", testResult);
    expect(testResult).toEqual(
      [
        entityAuthor
      ],
    );
  });

  it("rename Author Entity", async () => {

    // setup
    await localAppStoreController.createEntity(entityAuthor as MetaEntity,entityDefinitionAuthor as EntityDefinition)

    // test starts
    const modelEntityUpdate:ModelEntityUpdate =  {
      updateActionType: "ModelEntityUpdate",
      updateActionName: "renameEntity",
      entityUuid: entityAuthor.uuid, 
      entityName: entityAuthor.name,
      targetValue: entityAuthor.name + "ssss"
     };

    
    const entities: MetaEntity[] = (await localAppStoreController.getInstances("model",entityEntity.uuid))?.instances as MetaEntity[];
    const entityDefinitions: EntityDefinition[] = (await localAppStoreController.getInstances("model",entityEntityDefinition.uuid))?.instances as EntityDefinition[];

    const cudUpdate: { actionName: CUDActionName; objects: EntityInstanceCollection[] } | undefined =
      ModelEntityUpdateConverter.modelEntityUpdateToCUDUpdate(modelEntityUpdate, entities, entityDefinitions);
    console.log('DomainController updateModel correspondingCUDUpdate',cudUpdate);

    await localAppStoreController.applyModelEntityUpdate(
      {
        updateActionName: "WrappedTransactionalEntityUpdateWithCUDUpdate",
        modelEntityUpdate,
        "equivalentModelCUDUpdates": [
          {
            updateActionType:"ModelCUDInstanceUpdate",
            updateActionName:cudUpdate?.actionName??"update",
            objects: cudUpdate?.objects??[]
          } as ModelCUDInstanceUpdate
        ]
      }
    )

    const rawResult = await localAppStoreController.getInstances("model",entityEntity.uuid)
    const testResult = ignorePostgresExtraAttributes(rawResult?.instances??[])
    
    expect(
      testResult
    ).toEqual(
      [
        {
          ...entityAuthor,
          name: entityAuthor.name + "ssss"
        }
      ],
    );
  });

  it("delete Author Entity", async () => {

    // setup
    await localAppStoreController.createEntity(entityAuthor as MetaEntity,entityDefinitionAuthor as EntityDefinition)

    // test starts
    const modelEntityUpdate:ModelEntityUpdate =  {
      updateActionType: "ModelEntityUpdate",
      updateActionName: "DeleteEntity",
      entityUuid: entityAuthor.uuid, 
      entityName: entityAuthor.name,
     };

    
    const entities: MetaEntity[] = (await localAppStoreController.getInstances("model",entityEntity.uuid))?.instances as MetaEntity[];
    const entityDefinitions: EntityDefinition[] = (await localAppStoreController.getInstances("model",entityEntityDefinition.uuid))?.instances as EntityDefinition[];

    const cudUpdate: { actionName: CUDActionName; objects: EntityInstanceCollection[] } | undefined =
      ModelEntityUpdateConverter.modelEntityUpdateToCUDUpdate(modelEntityUpdate, entities, entityDefinitions);
    console.log('DomainController updateModel correspondingCUDUpdate',cudUpdate);

    await localAppStoreController.applyModelEntityUpdate(
      {
        updateActionName: "WrappedTransactionalEntityUpdateWithCUDUpdate",
        modelEntityUpdate,
        "equivalentModelCUDUpdates": [
          {
            updateActionType:"ModelCUDInstanceUpdate",
            updateActionName:cudUpdate?.actionName??"delete",
            objects: cudUpdate?.objects??[]
          } as ModelCUDInstanceUpdate
        ]
      }
    )

    const rawResult = await localAppStoreController.getInstances("model",entityEntity.uuid)
    const testResult = ignorePostgresExtraAttributes(rawResult?.instances??[])

    expect(testResult).toEqual([]);
  });

  it("add Author Instance", async () => {
    // setup
    await localAppStoreController.createEntity(entityAuthor as MetaEntity,entityDefinitionAuthor as EntityDefinition)
    await localAppStoreController?.upsertInstance('data', author1 as EntityInstance);

    // test
    const rawResult = await localAppStoreController.getInstances("data",entityAuthor.uuid)
    const testResult = ignorePostgresExtraAttributes(rawResult?.instances??[])

    expect(testResult).toEqual([author1],);
  });

  it("update Author Instance", async () => {
    // setup
    await localAppStoreController.createEntity(entityAuthor as MetaEntity,entityDefinitionAuthor as EntityDefinition)
    
    // test
    await localAppStoreController?.upsertInstance('data', {...author1, "name": author1.name + "ssss"} as EntityInstance);
    const rawResult = await localAppStoreController.getInstances("data",entityAuthor.uuid);
    const testResult = ignorePostgresExtraAttributes(rawResult?.instances??[])
    expect(testResult).toEqual([{...author1, "name": author1.name + "ssss"}],);
  });

  it("delete Author Instance", async () => {
    // setup
    await localAppStoreController.createEntity(entityAuthor as MetaEntity,entityDefinitionAuthor as EntityDefinition)
    await localAppStoreController?.upsertInstance('data', author1 as EntityInstance);

    // test
    await localAppStoreController?.deleteInstances('data', [author1]);
    const rawResult = await localAppStoreController.getInstances("data",entityAuthor.uuid);
    const testResult = ignorePostgresExtraAttributes(rawResult?.instances??[])
    expect(testResult).toEqual([],);
  });

});
