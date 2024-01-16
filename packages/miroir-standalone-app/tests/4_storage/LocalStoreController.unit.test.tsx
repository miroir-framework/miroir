import { v4 as uuidv4 } from 'uuid';
import { describe, expect } from 'vitest';

// import { miroirFileSystemStoreSectionStartup } from "../dist/bundle";
import {
  ActionReturnType,
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
  CUDActionName,
  defaultLevels,
  defaultMiroirMetaModel,
  entityAuthor,
  EntityDefinition,
  entityDefinitionAuthor,
  entityEntity,
  entityEntityDefinition,
  EntityInstance,
  EntityInstanceCollection,
  MetaEntity,
  MiroirConfigClient,
  MiroirLoggerFactory,
  ModelCUDInstanceUpdate,
  ModelEntityActionTransformer,
  ModelEntityUpdate,
  StoreControllerInterface,
  StoreControllerManagerInterface
} from "miroir-core";


import { miroirFileSystemStoreSectionStartup } from 'miroir-store-filesystem';
import { miroirIndexedDbStoreSectionStartup } from 'miroir-store-indexedDb';
import { miroirPostgresStoreSectionStartup } from 'miroir-store-postgres';
import { setupServer } from "msw/node";
import { loglevelnext } from "../../src/loglevelnextImporter";
import { loadTestConfigFiles, miroirBeforeAll, miroirBeforeEach } from "../utils/tests-utils";

let localMiroirStoreController: StoreControllerInterface;
let localAppStoreController: StoreControllerInterface;
let storeControllerManager: StoreControllerManagerInterface | undefined;

const env:any = (import.meta as any).env
console.log("@@@@@@@@@@@@@@@@@@ env", env);

const {miroirConfig, logConfig:loggerOptions} = await loadTestConfigFiles(env);

MiroirLoggerFactory.setEffectiveLoggerFactory(
  loglevelnext,
  (defaultLevels as any)[loggerOptions.defaultLevel],
  loggerOptions.defaultTemplate,
  loggerOptions.specificLoggerOptions
);

console.log("@@@@@@@@@@@@@@@@@@ miroirConfig", miroirConfig);

// ################################################################################################
beforeAll(
  async () => {
    // Establish requests interception layer before all tests.
    miroirFileSystemStoreSectionStartup();
    miroirIndexedDbStoreSectionStartup();
    miroirPostgresStoreSectionStartup();
    if (!miroirConfig.client.emulateServer) {
      throw new Error("LocalStoreController state do not make sense for real server configurations! Please use only 'emulateServer: true' configurations for this test.");
    } else {
      const wrapped = await miroirBeforeAll(
        miroirConfig as MiroirConfigClient,
        setupServer,
      );
      if (wrapped) {
        if (wrapped.localMiroirStoreController && wrapped.localAppStoreController) {
          localMiroirStoreController = wrapped.localMiroirStoreController;
          localAppStoreController = wrapped.localAppStoreController;
          storeControllerManager = wrapped.storeControllerManager;
        }
      } else {
        throw new Error("beforeAll failed initialization!");
      }
    }

    return Promise.resolve();
  }
)

// ################################################################################################
beforeEach(
  async  () => {
    await miroirBeforeEach(miroirConfig, undefined, localMiroirStoreController,localAppStoreController);
  }
)

// ################################################################################################
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

// ################################################################################################
afterAll(
  async () => {
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ miroirAfterAll")
    try {
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

const miroir2Config:MiroirConfigClient = { // TODO: have test configuration for indexedDb and filesystem cases
  "client": {
    "emulateServer": true,
    "rootApiUrl":"http://localhost:3080",
    "miroirServerConfig":{
      "admin": {
        "emulatedServerType": "sql",
        "connectionString":"postgres://postgres:postgres@localhost:5432/postgres",
        "schema": "miroir2"
      },
      "model": {
        "emulatedServerType": "sql",
        "connectionString":"postgres://postgres:postgres@localhost:5432/postgres",
        "schema": "miroir2"
      },
      "data": {
        "emulatedServerType": "sql",
        "connectionString":"postgres://postgres:postgres@localhost:5432/postgres",
        "schema": "miroir2"
      }
    },
    "appServerConfig": {
      "admin": {
        "emulatedServerType": "sql",
        "connectionString":"postgres://postgres:postgres@localhost:5432/postgres",
        "schema": "library2"
      },
      "model": {
        "emulatedServerType": "sql",
        "connectionString":"postgres://postgres:postgres@localhost:5432/postgres",
        "schema": "library2"
      },
      "data": {
        "emulatedServerType": "sql",
        "connectionString":"postgres://postgres:postgres@localhost:5432/postgres",
        "schema": "library2"
      }
    },
  }
}

describe.sequential("localStoreController.unit.test", () => {

  // ################################################################################################
  it(
    "Create new store or remove existing store",
    async () => { // TODO: test failure cases!
      if (miroir2Config.client.emulateServer) {
        const testResult: ActionReturnType = await localMiroirStoreController.createStore(miroir2Config.client.miroirServerConfig.admin)
        expect(testResult).toEqual({ status: "ok"})
      } else {
        expect(false, "could not test store creation, configuration can not specify to use a real server, only emulated server makes sense in this case")
      }
    }
  );

  // // ################################################################################################
  // it("deploy Miroir and Library modules.", async () => {
    
  //   const miroir2Config:MiroirConfigClient = {
  //     "client": {
  //       "emulateServer": true,
  //       "rootApiUrl":"http://localhost:3080",
  //       "miroirServerConfig":{
  //         "admin": {
  //           "emulatedServerType": "sql",
  //           "connectionString":"postgres://postgres:postgres@localhost:5432/postgres",
  //           "schema": "miroir2"
  //         },
  //         "model": {
  //           "emulatedServerType": "sql",
  //           "connectionString":"postgres://postgres:postgres@localhost:5432/postgres",
  //           "schema": "miroir2"
  //         },
  //         "data": {
  //           "emulatedServerType": "sql",
  //           "connectionString":"postgres://postgres:postgres@localhost:5432/postgres",
  //           "schema": "miroir2"
  //         }
  //       },
  //       "appServerConfig": {
  //         "admin": {
  //           "emulatedServerType": "sql",
  //           "connectionString":"postgres://postgres:postgres@localhost:5432/postgres",
  //           "schema": "library2"
  //         },
  //         "model": {
  //           "emulatedServerType": "sql",
  //           "connectionString":"postgres://postgres:postgres@localhost:5432/postgres",
  //           "schema": "library2"
  //         },
  //         "data": {
  //           "emulatedServerType": "sql",
  //           "connectionString":"postgres://postgres:postgres@localhost:5432/postgres",
  //           "schema": "library2"
  //         }
  //       },
  //     }
  //   }

    
  //   if (miroir2Config.client.emulateServer) {
  //     if (storeControllerManager) {
  //       const newMiroirDeploymentUuid = uuidv4();
  //       const newLibraryDeploymentUuid = uuidv4();

  //       await storeControllerManager.deployModule(
  //         localMiroirStoreController,
  //         newMiroirDeploymentUuid,
  //         miroir2Config.client.miroirServerConfig,
  //         {
  //           metaModel: defaultMiroirMetaModel,
  //           dataStoreType: 'miroir',
  //           application: applicationMiroir,
  //           applicationDeploymentConfiguration: applicationDeploymentMiroir,
  //           applicationModelBranch: applicationModelBranchMiroirMasterBranch,
  //           applicationVersion: applicationVersionInitialMiroirVersion,
  //           applicationStoreBasedConfiguration: applicationStoreBasedConfigurationMiroir,
  //         }
  //       );
  //       await storeControllerManager.deployModule(
  //         localMiroirStoreController,
  //         newLibraryDeploymentUuid,
  //         miroir2Config.client.appServerConfig,
  //         {
  //           metaModel: defaultMiroirMetaModel,
  //           dataStoreType: 'app',
  //           application: applicationLibrary,
  //           applicationDeploymentConfiguration: applicationDeploymentLibrary,
  //           applicationModelBranch: applicationModelBranchLibraryMasterBranch,
  //           applicationVersion: applicationVersionLibraryInitialVersion,
  //           applicationStoreBasedConfiguration: applicationStoreBasedConfigurationLibrary,
  //         }
  //       );
  //     }
  //   } else {
  //     expect(false, "could not test module deployment, configuration can not specify to use a real server, only emulated server makes sense in this case")
  //   }
  //   expect(true).toEqual(true);
  // },10000);

  // // ################################################################################################
  // it("get Miroir Entities", async () => {
  //   const rawResult = (await localMiroirStoreController.getInstances("model",entityEntity.uuid))
    
  //   const testResult = (rawResult?.instances??[]).map(
  //     (i: EntityInstance) => i["uuid"]
  //   )
  //   testResult.sort()

  //   // console.log("!####################### raw result", result);
  //   // console.log("!####################### test result", mapResult);
    
  //   expect(testResult).toEqual(
  //   [
  //     "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
  //     "35c5608a-7678-4f07-a4ec-76fc5bc35424",
  //     "3d8da4d4-8f76-4bb4-9212-14869d81c00c",
  //     "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
  //     "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
  //     "5e81e1b9-38be-487c-b3e5-53796c57fccf",
  //     "7990c0c9-86c3-40a1-a121-036c91b55ed7",
  //     "a659d350-dd97-4da9-91de-524fa01745dc",
  //     "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24",
  //     "cdb0aec6-b848-43ac-a058-fe2dbe5811f1",
  //     "e4320b9e-ab45-4abe-85d8-359604b3c62f",
  //   ]
  //   );
  // });


  // // ################################################################################################
  // it("get Library Entities", async () => {
  //   expect(
  //     await localAppStoreController.getInstances("model",entityEntity.uuid)
  //   ).toEqual(
  //     {
  //     "applicationSection": "model",
  //     "instances": [],
  //     "parentUuid": entityEntity.uuid,
  //   }
  //   );
  // });

  // // ################################################################################################
  // it("create Author Entity", async () => {
  //   await localAppStoreController.createEntity(entityAuthor as MetaEntity,entityDefinitionAuthor as EntityDefinition)

  //   const rawResult = await localAppStoreController.getInstances("model",entityEntity.uuid);
  //   const testResult = ignorePostgresExtraAttributes(rawResult?.instances as any??[])

  //   // console.log("create Author Entity rawResult", rawResult);
  //   // console.log("create Author Entity testResult", testResult);
  //   expect(testResult).toEqual(
  //     [
  //       entityAuthor
  //     ],
  //   );
  // });

  // // ################################################################################################
  // it("rename Author Entity", async () => {

  //   // setup
  //   await localAppStoreController.createEntity(entityAuthor as MetaEntity,entityDefinitionAuthor as EntityDefinition)

  //   // test starts
  //   const modelEntityUpdate:ModelEntityUpdate =  {
  //     updateActionType: "ModelEntityUpdate",
  //     updateActionName: "renameEntity",
  //     entityUuid: entityAuthor.uuid, 
  //     entityName: entityAuthor.name,
  //     targetValue: entityAuthor.name + "ssss"
  //   };

  //   const entities: MetaEntity[] = (await localAppStoreController.getInstances("model",entityEntity.uuid))?.instances as MetaEntity[];
  //   const entityDefinitions: EntityDefinition[] = (await localAppStoreController.getInstances("model",entityEntityDefinition.uuid))?.instances as EntityDefinition[];

  //   const cudUpdate: { actionName: CUDActionName; objects: EntityInstanceCollection[] } | undefined =
  //     ModelEntityActionTransformer.modelEntityUpdateToCUDUpdate(modelEntityUpdate, entities, entityDefinitions);
  //   console.log('DomainController updateModel correspondingCUDUpdate',cudUpdate);

  //   await localAppStoreController.applyModelEntityUpdate(
  //     {
  //       updateActionName: "WrappedTransactionalEntityUpdateWithCUDUpdate",
  //       modelEntityUpdate,
  //       "equivalentModelCUDUpdates": [
  //         {
  //           updateActionType:"ModelCUDInstanceUpdate",
  //           updateActionName:cudUpdate?.actionName??"update",
  //           objects: cudUpdate?.objects??[]
  //         } as ModelCUDInstanceUpdate
  //       ]
  //     }
  //   )

  //   const rawResult = await localAppStoreController.getInstances("model",entityEntity.uuid)
  //   const testResult = ignorePostgresExtraAttributes(rawResult?.instances??[])
    
  //   expect(
  //     testResult
  //   ).toEqual(
  //     [
  //       {
  //         ...entityAuthor,
  //         name: entityAuthor.name + "ssss"
  //       }
  //     ],
  //   );
  // });

  // // ################################################################################################
  // it("delete Author Entity", async () => {

  //   // setup
  //   await localAppStoreController.createEntity(entityAuthor as MetaEntity,entityDefinitionAuthor as EntityDefinition)

  //   // test starts
  //   const modelEntityUpdate:ModelEntityUpdate =  {
  //     updateActionType: "ModelEntityUpdate",
  //     updateActionName: "DeleteEntity",
  //     entityUuid: entityAuthor.uuid, 
  //     entityName: entityAuthor.name,
  //    };

    
  //   const entities: MetaEntity[] = (await localAppStoreController.getInstances("model",entityEntity.uuid))?.instances as MetaEntity[];
  //   const entityDefinitions: EntityDefinition[] = (await localAppStoreController.getInstances("model",entityEntityDefinition.uuid))?.instances as EntityDefinition[];

  //   const cudUpdate: { actionName: CUDActionName; objects: EntityInstanceCollection[] } | undefined =
  //     ModelEntityActionTransformer.modelEntityUpdateToCUDUpdate(modelEntityUpdate, entities, entityDefinitions);
  //   console.log('DomainController updateModel correspondingCUDUpdate',cudUpdate);

  //   await localAppStoreController.applyModelEntityUpdate(
  //     {
  //       updateActionName: "WrappedTransactionalEntityUpdateWithCUDUpdate",
  //       modelEntityUpdate,
  //       "equivalentModelCUDUpdates": [
  //         {
  //           updateActionType:"ModelCUDInstanceUpdate",
  //           updateActionName:cudUpdate?.actionName??"delete",
  //           objects: cudUpdate?.objects??[]
  //         } as ModelCUDInstanceUpdate
  //       ]
  //     }
  //   )

  //   const rawResult = await localAppStoreController.getInstances("model",entityEntity.uuid)
  //   const testResult = ignorePostgresExtraAttributes(rawResult?.instances??[])

  //   expect(testResult).toEqual([]);
  // });

  // // ################################################################################################
  // it("add Author Instance", async () => {
  //   // setup
  //   await localAppStoreController.createEntity(entityAuthor as MetaEntity,entityDefinitionAuthor as EntityDefinition)
  //   await localAppStoreController?.upsertInstance('data', author1 as EntityInstance);

  //   // test
  //   const rawResult = await localAppStoreController.getInstances("data",entityAuthor.uuid)
  //   const testResult = ignorePostgresExtraAttributes(rawResult?.instances??[])

  //   expect(testResult).toEqual([author1],);
  // });

  // // ################################################################################################
  // it("update Author Instance", async () => {
  //   // setup
  //   await localAppStoreController.createEntity(entityAuthor as MetaEntity,entityDefinitionAuthor as EntityDefinition)
    
  //   // test
  //   await localAppStoreController?.upsertInstance('data', {...author1, "name": author1.name + "ssss"} as EntityInstance);
  //   const rawResult = await localAppStoreController.getInstances("data",entityAuthor.uuid);
  //   const testResult = ignorePostgresExtraAttributes(rawResult?.instances??[])
  //   expect(testResult).toEqual([{...author1, "name": author1.name + "ssss"}],);
  // });

  // // ################################################################################################
  // it("delete Author Instance", async () => {
  //   // setup
  //   await localAppStoreController.createEntity(entityAuthor as MetaEntity,entityDefinitionAuthor as EntityDefinition)
  //   await localAppStoreController?.upsertInstance('data', author1 as EntityInstance);

  //   // test
  //   await localAppStoreController?.deleteInstances('data', [author1]);
  //   const rawResult = await localAppStoreController.getInstances("data",entityAuthor.uuid);
  //   const testResult = ignorePostgresExtraAttributes(rawResult?.instances??[])
  //   expect(testResult).toEqual([],);
  // });

});
