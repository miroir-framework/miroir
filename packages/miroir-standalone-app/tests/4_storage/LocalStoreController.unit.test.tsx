import { v4 as uuidv4 } from 'uuid';
import { describe, expect } from 'vitest';

// import { miroirFileSystemStoreSectionStartup } from "../dist/bundle";
import {
  ACTION_OK,
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
  DomainElementType,
  entityAuthor,
  EntityDefinition,
  entityDefinitionAuthor,
  entityEntity,
  entityEntityDefinition,
  EntityInstance,
  EntityInstanceCollection,
  entityReport,
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
const chainTestSteps = async (
  stepName: string,
  context: {[k:string]: any},
  functionCallingActionToTest: () => Promise<ActionReturnType>,
  resultTransformation?: (a:ActionReturnType,p:{[k:string]: any}) => any,
  addResultToContextAsName?: string,
  expectedDomainElementType?: DomainElementType,
  expectedValue?: any,
): Promise<{[k:string]: any}> => {
  console.log("########################################### chainTestAsyncDomainCalls", stepName, "previousResult:", JSON.stringify(context,undefined, 2));
  const domainElement = await functionCallingActionToTest();
  console.log("########################################### chainTestAsyncDomainCalls", stepName, "result:", JSON.stringify(domainElement,undefined, 2));
  let testResult
  if (domainElement.status == "ok") {
    testResult = resultTransformation?resultTransformation(domainElement,context):domainElement.status == "ok"?domainElement?.returnedDomainElement?.elementValue:undefined;
    if (expectedDomainElementType) {
      if (domainElement.returnedDomainElement?.elementType != expectedDomainElementType) {
        expect(domainElement.returnedDomainElement?.elementType, stepName + "received result: " + domainElement.returnedDomainElement).toEqual(expectedDomainElementType) // fails
      } else {
        // const testResult = ignorePostgresExtraAttributes(domainElement?.returnedDomainElement.elementValue)
        if (expectedValue) {
          expect(testResult).toEqual(expectedValue);
        } else {
          // no test to be done
        }
      }
    } else {
     // no test to be done 
    }
  } else {
    expect(domainElement.status, domainElement.error?.errorType??"no errorType" + ": " + domainElement.error?.errorMessage??"no errorMessage").toEqual("ok")
  }
  console.log("########################################### chainTestAsyncDomainCalls", stepName, "testResult:", JSON.stringify(testResult,undefined, 2));
  if (testResult && addResultToContextAsName) {
    return {...context, [addResultToContextAsName]: testResult}
  } else {
    return context
  }
}

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
    "Delete miroir2 store or remove existing store",
    async () => { // TODO: test failure cases!
      if (miroir2Config.client.emulateServer) {
        const testResult: ActionReturnType = await localMiroirStoreController.deleteStore(miroir2Config.client.miroirServerConfig.admin)
        const testResult2: ActionReturnType = await localMiroirStoreController.deleteStore(miroir2Config.client.miroirServerConfig.admin)
        expect(testResult).toEqual(ACTION_OK)
        expect(testResult2).toEqual(ACTION_OK)
      } else {
        expect(false, "could not test store creation, configuration can not specify to use a real server, only emulated server makes sense in this case")
      }
    }
  );

  // ################################################################################################
  it(
    "Create miroir2 store",
    async () => { // TODO: test failure cases!
      if (miroir2Config.client.emulateServer) {
        const testResult: ActionReturnType = await localMiroirStoreController.createStore(miroir2Config.client.miroirServerConfig.admin)
        const testResult2: ActionReturnType = await localMiroirStoreController.createStore(miroir2Config.client.miroirServerConfig.admin)
        //cleanup
        const testResult3: ActionReturnType = await localMiroirStoreController.deleteStore(miroir2Config.client.miroirServerConfig.admin)
        // test
        expect(testResult).toEqual(ACTION_OK)
        expect(testResult2).toEqual(ACTION_OK)
        expect(testResult3).toEqual(ACTION_OK)
      } else {
        expect(false, "could not test store creation, configuration can not specify to use a real server, only emulated server makes sense in this case")
      }
    }
  );

  // ################################################################################################
  it("deploy Miroir and Library modules.", async () => {
    if (miroir2Config.client.emulateServer) {
      if (storeControllerManager) {
        const newMiroirDeploymentUuid = uuidv4();
        const newLibraryDeploymentUuid = uuidv4();

        const deployMiroir = await storeControllerManager.deployModule(
          localMiroirStoreController,
          newMiroirDeploymentUuid,
          miroir2Config.client.miroirServerConfig,
          {
            metaModel: defaultMiroirMetaModel,
            dataStoreType: 'miroir',
            application: applicationMiroir,
            applicationDeploymentConfiguration: applicationDeploymentMiroir,
            applicationModelBranch: applicationModelBranchMiroirMasterBranch,
            applicationVersion: applicationVersionInitialMiroirVersion,
            applicationStoreBasedConfiguration: applicationStoreBasedConfigurationMiroir,
          }
        );
        const deployApp = await storeControllerManager.deployModule(
          localMiroirStoreController,
          newLibraryDeploymentUuid,
          miroir2Config.client.appServerConfig,
          {
            metaModel: defaultMiroirMetaModel,
            dataStoreType: 'app',
            application: applicationLibrary,
            applicationDeploymentConfiguration: applicationDeploymentLibrary,
            applicationModelBranch: applicationModelBranchLibraryMasterBranch,
            applicationVersion: applicationVersionLibraryInitialVersion,
            applicationStoreBasedConfiguration: applicationStoreBasedConfigurationLibrary,
          }
        );
        expect(deployMiroir).toEqual( ACTION_OK )
        expect(deployApp).toEqual( ACTION_OK )
      }
    } else {
      expect(false, "could not test module deployment, configuration can not specify to use a real server, only emulated server makes sense in this case")
    }
    expect(true).toEqual(true);
  },10000);

  // ################################################################################################
  it("get Entity instance: the Report Entity", async () => {
    await chainTestSteps(
      "actualTest_getInstancesAndCheckResult",
      {},
      async () => localMiroirStoreController.getInstance("model",entityEntity.uuid, entityReport.uuid),
      // (a) => (a as any).returnedDomainElement.elementValue.instances.map((i: EntityInstance) => i["uuid"]),
      (a) => (a as any).returnedDomainElement.elementValue.uuid,
      // undefined, // result transformation function
      undefined, // result name
      "instance",
      "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
    );
  });

  // ################################################################################################
  it("get Miroir Entities", async () => {

    await chainTestSteps(
      "actualTest_getInstancesAndCheckResult",
      {},
      async () => localMiroirStoreController.getInstances("model",entityEntity.uuid),
      (a) => (a as any).returnedDomainElement.elementValue.instances.map((i: EntityInstance) => i["uuid"]).sort(),
      // (a) => (a as any).returnedDomainElement.elementValue.instances,
      undefined, // result name
      "entityInstanceCollection",
      [
        "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
        "35c5608a-7678-4f07-a4ec-76fc5bc35424",
        "3d8da4d4-8f76-4bb4-9212-14869d81c00c",
        "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
        "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
        "5e81e1b9-38be-487c-b3e5-53796c57fccf",
        "7990c0c9-86c3-40a1-a121-036c91b55ed7",
        "a659d350-dd97-4da9-91de-524fa01745dc",
        "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24",
        "cdb0aec6-b848-43ac-a058-fe2dbe5811f1",
        "e4320b9e-ab45-4abe-85d8-359604b3c62f",
      ]
    );
  });


  // ################################################################################################
  it("get Library Entities", async () => {
    await chainTestSteps(
      "actualTest_getInstancesAndCheckResult",
      {},
      async () => localAppStoreController.getInstances("model",entityEntity.uuid),
      // (a) => ignorePostgresExtraAttributes((a as any).returnedDomainElement.elementValue.instances),
      undefined, // result transformation
      undefined, // result name
      "entityInstanceCollection",
      {
        "applicationSection": "model",
        "instances": [],
        "parentUuid": entityEntity.uuid,
      }
    )

  });

  // ################################################################################################
  it("create Author Entity", async () => {

    await chainTestSteps( // setup
      "setup_createEntity",
      {},
      async () => localAppStoreController.createEntity(entityAuthor as MetaEntity,entityDefinitionAuthor as EntityDefinition),
      undefined,
      undefined, // result name
      undefined, // result.elementType
      undefined, // result.elementValue
    )

    await chainTestSteps(
      "actualTest_getInstancesAndCheckResult",
      {},
      async () => localAppStoreController.getInstances("model",entityEntity.uuid),
      (a) => ignorePostgresExtraAttributes((a as any).returnedDomainElement.elementValue.instances),
      undefined, // result name
      "entityInstanceCollection",
      [entityAuthor]
    )
  });

  // ################################################################################################
  it("rename Author Entity", async () => {

    // setup
    const entityCreated = await localAppStoreController.createEntity(entityAuthor as MetaEntity,entityDefinitionAuthor as EntityDefinition)

    expect(entityCreated, "failed to setup test case").toEqual(ACTION_OK)
    // test starts
    const modelEntityUpdate:ModelEntityUpdate =  {
      updateActionType: "ModelEntityUpdate",
      updateActionName: "renameEntity",
      entityUuid: entityAuthor.uuid, 
      entityName: entityAuthor.name,
      targetValue: entityAuthor.name + "ssss"
    };

    await chainTestSteps(
      "fetchEntities",
      { },
      async () => await localAppStoreController.getInstances("model",entityEntity.uuid),
      (a, p) => (a as any).returnedDomainElement.elementValue.instances as MetaEntity[],
      "entities", // result name
      "entityInstanceCollection", // result.elementType
      undefined, // test result.elementValue
    )
    .then (
      (v) => chainTestSteps(
        "fetchEntityDefinitions",
        v,
        async () => await localAppStoreController.getInstances("model", entityEntityDefinition.uuid),
        (a, p) => (a as any).returnedDomainElement.elementValue.instances as EntityDefinition[],
        "entityDefinitions", // result name
        "entityInstanceCollection", // result.elementType
        undefined, // result.elementValue
      )
    )
    .then(
      (v) => chainTestSteps(
        "computeCudUpdate",
        v,
        async () => ACTION_OK,
        (a, p) =>
          ModelEntityActionTransformer.modelEntityUpdateToCUDUpdate(
            modelEntityUpdate,
            p.entities,
            p.entityDefinitions
          ),
        "cudUpdate", // result name
        undefined, // result.elementType
        undefined, // result.elementValue
      )
    )
    .then((v) =>
      chainTestSteps(
        "applyModelEntityUpdate",
        v,
        async () => await localAppStoreController.applyModelEntityUpdate({
            updateActionName: "WrappedTransactionalEntityUpdateWithCUDUpdate",
            modelEntityUpdate,
            equivalentModelCUDUpdates: [
              {
                updateActionType: "ModelCUDInstanceUpdate",
                updateActionName: v.cudUpdate?.actionName ?? "update",
                objects: v.cudUpdate?.objects ?? [],
              } as ModelCUDInstanceUpdate,
            ],
          }),
        undefined,// (a,p) => (a as any).returnedDomainElement.elementValue.instances as EntityDefinition[],
        undefined, // result name
        undefined, // result type
        undefined // to value to compare with
      )
    )
    .then((v) =>
      chainTestSteps(
        "getInstancesToCheckResult",
        v,
        async () => await localAppStoreController.getInstances("model", entityEntity.uuid),
        (a) => ignorePostgresExtraAttributes((a as any).returnedDomainElement.elementValue.instances),
        undefined, // result name
        "entityInstanceCollection",
        [
          {
            ...entityAuthor,
            name: entityAuthor.name + "ssss",
          },
        ]
      )
    );
  });

  // ################################################################################################
  it("delete Author Entity", async () => {

    // setup
    const entityCreated = await localAppStoreController.createEntity(entityAuthor as MetaEntity,entityDefinitionAuthor as EntityDefinition)

    expect(entityCreated, "failed to setup test case").toEqual(ACTION_OK)

    // test starts
    const modelEntityUpdate:ModelEntityUpdate =  {
      updateActionType: "ModelEntityUpdate",
      updateActionName: "DeleteEntity",
      entityUuid: entityAuthor.uuid, 
      entityName: entityAuthor.name,
     };

    
    // const entities: MetaEntity[] = (await localAppStoreController.getInstances("model",entityEntity.uuid))?.instances as MetaEntity[];
    // const entityDefinitions: EntityDefinition[] = (await localAppStoreController.getInstances("model",entityEntityDefinition.uuid))?.instances as EntityDefinition[];
    await chainTestSteps(
      "setup_createEntity",
      {},
      async () => localAppStoreController.createEntity(entityAuthor as MetaEntity,entityDefinitionAuthor as EntityDefinition),
      undefined,
      undefined, // result name
      undefined, // result.elementType
      undefined, // result.elementValue
    )
    .then(
      (v) => chainTestSteps(
        "fetchEntities",
        v,
        async () => await localAppStoreController.getInstances("model",entityEntity.uuid),
        (a, p) => (a as any).returnedDomainElement.elementValue.instances as MetaEntity[],
        "entities", // result name
        "entityInstanceCollection", // result.elementType
        undefined, // test result.elementValue
      )
    )
    .then (
      (v) => chainTestSteps(
        "fetchEntityDefinitions",
        v,
        async () => await localAppStoreController.getInstances("model", entityEntityDefinition.uuid),
        (a, p) => (a as any).returnedDomainElement.elementValue.instances as EntityDefinition[],
        "entityDefinitions", // result name
        "entityInstanceCollection", // result.elementType
        undefined, // result.elementValue
      )
    )
    .then(
      (v) => chainTestSteps(
        "createCudUpdate",
        v,
        async () => ACTION_OK,
        (a, p) =>
          ModelEntityActionTransformer.modelEntityUpdateToCUDUpdate(
            modelEntityUpdate,
            p.entities,
            p.entityDefinitions
          ),
        "cudUpdate", // result name
        undefined, // result.elementType
        undefined, // result.elementValue
      )
    )
    .then((v) =>
      chainTestSteps(
        "applyModelEntityUpdate",
        v,
        async () => await localAppStoreController.applyModelEntityUpdate({
            updateActionName: "WrappedTransactionalEntityUpdateWithCUDUpdate",
            modelEntityUpdate,
            equivalentModelCUDUpdates: [
              {
                updateActionType: "ModelCUDInstanceUpdate",
                updateActionName: v.cudUpdate?.actionName ?? "update",
                objects: v.cudUpdate?.objects ?? [],
              } as ModelCUDInstanceUpdate,
            ],
          }),
        undefined, // result transformation function,
        undefined, // result name
        undefined, // result type
        undefined // to value to compare with
      )
    )
    .then((v) =>
      chainTestSteps(
        "actualTest_getInstancesAndCheckResult",
        v,
        async () => await localAppStoreController.getInstances("model", entityEntity.uuid),
        (a) => ignorePostgresExtraAttributes((a as any).returnedDomainElement.elementValue.instances),
        undefined, // result name
        "entityInstanceCollection",
        []
      )
    );
  });

  // ################################################################################################
  it("add Author Instance", async () => {
    // setup
    // const entityCreated = await localAppStoreController.createEntity(entityAuthor as MetaEntity,entityDefinitionAuthor as EntityDefinition)
    // expect(entityCreated, "failed to setup test case").toEqual(ACTION_OK)

    await chainTestSteps(
      "setup_createEntity",
      {},
      async () => localAppStoreController.createEntity(entityAuthor as MetaEntity,entityDefinitionAuthor as EntityDefinition),
      undefined,
      undefined, // result name
      undefined, // result.elementType
      undefined, // result.elementValue
    )

    const instanceAdded = await localAppStoreController?.upsertInstance('data', author1 as EntityInstance);
    // expect(instanceAdded, "failed to add Author instance").toEqual(ACTION_OK)
    expect(instanceAdded.uuid, "failed to add Author instance").toEqual("4441169e-0c22-4fbc-81b2-28c87cf48ab2")

    // .then((v) =>
    //   chainTestSteps(
    //     "actionToBeTested",
    //     v,
    //     async () => localAppStoreController?.upsertInstance('data', author1 as EntityInstance),
    //     undefined, // result transformation function,
    //     undefined, // result name
    //     undefined, // result type
    //     undefined // to value to compare with
    //   )
    // )
    // .then((v) =>
    await chainTestSteps(
      "actualTest_getInstancesAndCheckResult",
      {},
      async () => localAppStoreController.getInstances("data",entityAuthor.uuid),
      (a) => ignorePostgresExtraAttributes((a as any).returnedDomainElement.elementValue.instances),
      undefined, // result name
      "entityInstanceCollection",
      [author1]
    )

  });

  // ################################################################################################
  it("update Author Instance", async () => {
    await chainTestSteps( // setup
      "setup_createEntity",
      {},
      async () => localAppStoreController.createEntity(entityAuthor as MetaEntity,entityDefinitionAuthor as EntityDefinition),
      undefined,
      undefined, // result name
      undefined, // result.elementType
      undefined, // result.elementValue
    )

    // test
    const instanceUpdated = await localAppStoreController?.upsertInstance('data', {...author1, "name": author1.name + "ssss"} as EntityInstance);
    // check that upsert succeeded
    expect(instanceUpdated.uuid, "failed to update Author instance").toEqual("4441169e-0c22-4fbc-81b2-28c87cf48ab2")

    await chainTestSteps(
      "actualTest_getInstancesAndCheckResult",
      {},
      async () => localAppStoreController.getInstances("data",entityAuthor.uuid),
      (a) => ignorePostgresExtraAttributes((a as any).returnedDomainElement.elementValue.instances),
      undefined, // result name
      "entityInstanceCollection",
      [{...author1, "name": author1.name + "ssss"}]
    )

  });

  // ################################################################################################
  it("delete Author Instance", async () => {
    // setup
    const entityCreated = await localAppStoreController.createEntity(entityAuthor as MetaEntity,entityDefinitionAuthor as EntityDefinition)
    await chainTestSteps( // setup
      "setup_createEntity",
      {},
      async () => localAppStoreController.createEntity(entityAuthor as MetaEntity,entityDefinitionAuthor as EntityDefinition),
      undefined,
      undefined, // result name
      undefined, // result.elementType
      undefined, // result.elementValue
    )

    const instanceAdded = await localAppStoreController?.upsertInstance('data', author1 as EntityInstance);
    expect(entityCreated, "failed to setup test case").toEqual(ACTION_OK)
    // expect(instanceAdded, "failed to setup test case").toEqual(ACTION_OK)

    // test
    const instanceDeleted = await localAppStoreController?.deleteInstances('data', [author1]);
    // // expect(instanceDeleted, "failed to setup test case").toEqual(ACTION_OK)
    // const rawResult = await localAppStoreController.getInstances("data",entityAuthor.uuid);
    // const testResult = ignorePostgresExtraAttributes(rawResult?.instances??[])
    // expect(testResult).toEqual([],);
    await chainTestSteps(
      "actualTest_getInstancesAndCheckResult",
      {},
      async () => localAppStoreController.getInstances("data",entityAuthor.uuid),
      (a) => ignorePostgresExtraAttributes((a as any).returnedDomainElement.elementValue.instances),
      undefined, // result name
      "entityInstanceCollection",
      []
    )
  });

});
