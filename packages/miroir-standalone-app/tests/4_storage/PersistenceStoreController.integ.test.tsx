import { describe, expect } from 'vitest';

// import { miroirFileSystemStoreSectionStartup } from "../dist/bundle";
import {
  ACTION_OK,
  Action2Error,
  Action2ReturnType,
  Action2VoidReturnType,
  ActionError,
  ConfigurationService,
  DomainControllerInterface,
  DomainElementType,
  EntityDefinition,
  EntityInstance,
  JzodElement,
  LocalCacheInterface,
  LoggerInterface,
  MetaEntity,
  MiroirActivityTracker,
  MiroirConfigClient,
  MiroirContext,
  MiroirEventService,
  MiroirLoggerFactory,
  ModelAction,
  ModelActionDropEntity,
  ModelActionRenameEntity,
  PersistenceStoreControllerInterface,
  PersistenceStoreControllerManagerInterface,
  StoreUnitConfiguration,
  createDeploymentCompositeAction,
  defaultLevels,
  defaultMiroirModelEnvironment,
  defaultSelfApplicationDeploymentMap,
  entityEntity,
  entityEntityDefinition,
  ignorePostgresExtraAttributesOnList,
  miroirCoreStartup,
  resetAndInitApplicationDeployment,
  type AdminApplicationDeploymentConfiguration,
  type ApplicationDeploymentMap,
  type Deployment
} from "miroir-core";
import {
  adminConfigurationDeploymentAdmin,
  adminConfigurationDeploymentLibrary,
  adminConfigurationDeploymentMiroir
} from "miroir-deployment-admin";

import {
  author1,
  book1,
  entityAuthor,
  entityDefinitionAuthor,
  selfApplicationLibrary,
} from "miroir-example-library";
import { miroirFileSystemStoreSectionStartup } from 'miroir-store-filesystem';
import { miroirIndexedDbStoreSectionStartup } from 'miroir-store-indexedDb';
import { miroirPostgresStoreSectionStartup } from 'miroir-store-postgres';
import { cleanLevel, packageName } from '../../src/constants.js';
import { loglevelnext } from "../../src/loglevelnextImporter.js";
import {
  adminApplicationDeploymentConfigurations,
  createMiroirDeploymentGetPersistenceStoreController,
  deleteAndCloseApplicationDeployments,
  selfApplicationDeploymentConfigurations,
  setupMiroirTest
} from "../../src/miroir-fwk/4-tests/tests-utils.js";
import { miroirAppStartup } from '../../src/startup.js';
import { loadTestConfigFiles } from '../utils/fileTools.js';

let domainController: DomainControllerInterface;
let localCache: LocalCacheInterface;
let localMiroirPersistenceStoreController: PersistenceStoreControllerInterface;
let localAppPersistenceStoreController: PersistenceStoreControllerInterface;
let miroirContext: MiroirContext;
let persistenceStoreControllerManager: PersistenceStoreControllerManagerInterface | undefined;

const env:any = (import.meta as any).env
console.log("@@@@@@@@@@@@@@@@@@ env", env);

const myConsoleLog = (...args: any[]) => console.log(fileName, ...args);
// const {miroirConfig, logConfig:loggerOptions} = await loadTestConfigFiles(env);
const fileName = "PersistenceStoreController.integ.test";
myConsoleLog(fileName, "received env", JSON.stringify(env, null, 2));

let miroirConfig:any;
let loggerOptions:any;
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, fileName)
).then((logger: LoggerInterface) => {log = logger});

miroirAppStartup();
miroirCoreStartup();
miroirFileSystemStoreSectionStartup();
miroirIndexedDbStoreSectionStartup();
miroirPostgresStoreSectionStartup();
ConfigurationService.registerTestImplementation({expect: expect as any});

const {miroirConfig: miroirConfigParam, logConfig:loggerOptionsParam} = await loadTestConfigFiles(env)
miroirConfig = miroirConfigParam;
loggerOptions = loggerOptionsParam;
myConsoleLog("received miroirConfig", JSON.stringify(miroirConfig, null, 2));
myConsoleLog(
  "received miroirConfig.client",
  JSON.stringify(miroirConfig.client, null, 2)
);
myConsoleLog("received loggerOptions", JSON.stringify(loggerOptions, null, 2));
const miroirActivityTracker = new MiroirActivityTracker();
const miroirEventService = new MiroirEventService(miroirActivityTracker);
MiroirLoggerFactory.startRegisteredLoggers(
  miroirActivityTracker,
  miroirEventService,
  loglevelnext,
  (defaultLevels as any)[loggerOptions.defaultLevel],
);
myConsoleLog("started registered loggers DONE");

const applicationDeploymentMap: ApplicationDeploymentMap = {
  ...defaultSelfApplicationDeploymentMap,
  [selfApplicationLibrary.uuid]: adminConfigurationDeploymentLibrary.uuid,
};

const miroirtDeploymentStorageConfiguration: StoreUnitConfiguration = miroirConfig.client.emulateServer
  ? miroirConfig.client.deploymentStorageConfig[adminConfigurationDeploymentMiroir.uuid]
  : miroirConfig.client.serverConfig.storeSectionConfiguration[adminConfigurationDeploymentMiroir.uuid];

const testApplicationDeploymentUuid = adminConfigurationDeploymentLibrary.uuid;
const libraryDeploymentStorageConfiguration: StoreUnitConfiguration = miroirConfig.client.emulateServer
  ? miroirConfig.client.deploymentStorageConfig[testApplicationDeploymentUuid]
  : miroirConfig.client.serverConfig.storeSectionConfiguration[testApplicationDeploymentUuid];

const adminDeploymentStorageConfiguration: StoreUnitConfiguration = miroirConfig.client.emulateServer
? miroirConfig.client.deploymentStorageConfig[adminConfigurationDeploymentAdmin.uuid]
: miroirConfig.client.serverConfig.storeSectionConfiguration[adminConfigurationDeploymentAdmin.uuid];

  
const adminDeployment: Deployment = {
  ...adminConfigurationDeploymentAdmin,
  configuration: adminDeploymentStorageConfiguration,
};

const typedAdminConfigurationDeploymentLibrary:AdminApplicationDeploymentConfiguration = adminConfigurationDeploymentLibrary as any;

// const applicationDeploymentMap: ApplicationDeploymentMap = {
//   ...defaultSelfApplicationDeploymentMap,
//   [selfApplicationLibrary.uuid]: adminConfigurationDeploymentLibrary.uuid,
// };

// const miroirtDeploymentStorageConfiguration: StoreUnitConfiguration = miroirConfig.client.emulateServer
//   ? miroirConfig.client.deploymentStorageConfig[adminConfigurationDeploymentMiroir.uuid]
//   : miroirConfig.client.serverConfig.storeSectionConfiguration[adminConfigurationDeploymentMiroir.uuid];

// const testApplicationDeploymentUuid = adminConfigurationDeploymentLibrary.uuid;
// const libraryDeploymentStorageConfiguration: StoreUnitConfiguration = miroirConfig.client.emulateServer
//   ? miroirConfig.client.deploymentStorageConfig[testApplicationDeploymentUuid]
//   : miroirConfig.client.serverConfig.storeSectionConfiguration[testApplicationDeploymentUuid];

// ################################################################################################
beforeAll(
  async () => {
    // Establish requests interception layer before all tests.
    if (!miroirConfig.client.emulateServer) {
      throw new Error(
        "LocalPersistenceStoreController state do not make sense for real server configurations! Please use only 'emulateServer: true' configurations for this test."
      );
    }

    const {
      persistenceStoreControllerManagerForServer: localpersistenceStoreControllerManager,
      domainController: localdomainController,
      localCache: locallocalCache,
      miroirContext: localmiroirContext,
    } = await setupMiroirTest(miroirConfig);

    if (!localpersistenceStoreControllerManager) {
      throw new Error("localpersistenceStoreControllerManager not defined");
    }

    persistenceStoreControllerManager = localpersistenceStoreControllerManager;
    domainController = localdomainController;
    localCache = locallocalCache;
    miroirContext = localmiroirContext;


    const wrapped = await createMiroirDeploymentGetPersistenceStoreController(
      miroirConfig as MiroirConfigClient,
      persistenceStoreControllerManager,
      domainController,
      applicationDeploymentMap,
      adminDeployment,
    );
    if (wrapped) {
      if (wrapped.localMiroirPersistenceStoreController) {
        localMiroirPersistenceStoreController = wrapped.localMiroirPersistenceStoreController;
      } else {
        throw new Error("beforeAll failed localMiroirPersistenceStoreController initialization!");
      }
    } else {
      throw new Error("beforeAll failed initialization!");
    }
    const createLibraryDeploymentAction = createDeploymentCompositeAction(
      "library",
      adminConfigurationDeploymentLibrary.uuid,
      selfApplicationLibrary.uuid,
      adminDeployment,
      libraryDeploymentStorageConfiguration
    );
    const result = await domainController.handleCompositeAction(
      createLibraryDeploymentAction,
      applicationDeploymentMap,
      defaultMiroirModelEnvironment,
      {}
    );

    if (result.status !== "ok") {
      throw new Error("beforeAll failed createLibraryDeploymentAction!");
    }

    const tmplocalAppPersistenceStoreController = persistenceStoreControllerManager.getPersistenceStoreController(
      adminConfigurationDeploymentLibrary.uuid
    );
    if (!tmplocalAppPersistenceStoreController) {
      throw new Error("beforeAll failed localAppPersistenceStoreController initialization!");
    }
    localAppPersistenceStoreController = tmplocalAppPersistenceStoreController;

    return Promise.resolve();
  }
)

// ################################################################################################
beforeEach(
  async  () => {
    await resetAndInitApplicationDeployment(
      domainController,
      applicationDeploymentMap,
      selfApplicationDeploymentConfigurations
    );
  }
)

// // // ################################################################################################
// // afterEach(
// //   async () => {
// //     await resetApplicationDeployments(deploymentConfigurations, domainController, undefined);
// //   }
// // )

// ################################################################################################
afterAll(
  async () => {
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ deleteAndCloseApplicationDeployments")
    await deleteAndCloseApplicationDeployments(
      miroirConfig,
      domainController,
      applicationDeploymentMap,
      adminApplicationDeploymentConfigurations
    );

    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ Done deleteAndCloseApplicationDeployments")
  }
)

// ##############################################################################################
// ##############################################################################################
// ##############################################################################################
const chainVitestSteps = async (
  stepName: string,
  context: {[k:string]: any},
  functionCallingActionToTest: () => Promise<Action2ReturnType>,
  resultTransformation?: (a:Action2ReturnType,p:{[k:string]: any}) => any,
  addResultToContextAsName?: string,
  expectedDomainElementType?: DomainElementType,
  expectedValue?: any,
): Promise<{[k:string]: any}> => {
  console.log(
    "########################################### chainTestAsyncDomainCalls",
    stepName,
    "previousResult:",
    JSON.stringify(context, undefined, 2)
  );
  const domainElement: Action2ReturnType = await functionCallingActionToTest();
  console.log(
    "########################################### chainTestAsyncDomainCalls",
    stepName,
    "result:",
    JSON.stringify(domainElement, undefined, 2)
  );
  let testResult
  if (!(domainElement instanceof Action2Error)) {
    testResult = resultTransformation
      ? resultTransformation(domainElement, context)
      : domainElement?.returnedDomainElement
      ;
    if (expectedDomainElementType) {
      if (domainElement.returnedDomainElement?.elementType != expectedDomainElementType) {
        expect(
          domainElement.returnedDomainElement?.elementType,
          stepName + "received result: " + domainElement.returnedDomainElement
        ).toEqual(expectedDomainElementType); // fails
      } else {
        // const testResult = ignorePostgresExtraAttributes(domainElement?.returnedDomainElement)
        if (expectedValue) {
          expect(testResult).toEqual(expectedValue);
        } else {
          // no test to be done
        }
      }
    } else {
      if (expectedValue) {
        expect(testResult).toEqual(expectedValue);
      } else {
        // no test to be done
      }
    }
  } else {
    expect(
      domainElement.status,
      domainElement.errorType  + ": " + (domainElement.errorMessage ?? "no errorMessage")
    ).toEqual("ok");
  }
  console.log("########################################### chainTestAsyncDomainCalls", stepName, "testResult:", JSON.stringify(testResult,undefined, 2));
  if (testResult && addResultToContextAsName) {
    return {...context, [addResultToContextAsName]: testResult}
  } else {
    return context
  }
}

describe.sequential("PersistenceStoreController.integ.test", () => {

  // ################################################################################################
  // // TODO: rephrase as deployment of a module that is not yet deployed, neither miroir nor library
  // // it("Create miroir2 store", async () => { // TODO: test failure cases!
  // //     if (miroirConfig.client.emulateServer) {
  // //       console.log("Create miroir2 store START")
  // //       const testResult: Action2ReturnType = await localMiroirPersistenceStoreController.createStore(
  // //         miroirConfig.client.deploymentStorageConfig[adminConfigurationDeploymentMiroir.uuid].model
  // //       );
  // //       const testResult2: Action2ReturnType = await localMiroirPersistenceStoreController.createStore(
  // //         miroirConfig.client.deploymentStorageConfig[adminConfigurationDeploymentMiroir.uuid].data
  // //       );
  // //       //cleanup
  // //       const testResult3: Action2ReturnType = await localMiroirPersistenceStoreController.deleteStore(
  // //         miroirConfig.client.deploymentStorageConfig[adminConfigurationDeploymentMiroir.uuid].model
  // //       );
  // //       const testResult4: Action2ReturnType = await localMiroirPersistenceStoreController.deleteStore(
  // //         miroirConfig.client.deploymentStorageConfig[adminConfigurationDeploymentMiroir.uuid].data
  // //       );
  // //       // test
  // //       expect(testResult).toEqual(ACTION_OK)
  // //       expect(testResult2).toEqual(ACTION_OK)
  // //       expect(testResult3).toEqual(ACTION_OK)
  // //       expect(testResult4).toEqual(ACTION_OK)
  // //       console.log("Create miroir2 store END")
  // //     } else {
  // //       expect(false, "could not test store creation, configuration can not specify to use a real server, only emulated server makes sense in this case")
  // //     }
  // //   }
  // // );

  // // // ################################################################################################
  // // TODO: rephrase as deployment of a module that is not yet deployed, neither miroir nor library
  // // it("deploy Miroir and Library modules.", async () => {
  // //   if (miroirConfig.client.emulateServer) {
  // //     if (persistenceStoreControllerManager) {
  // //       const newMiroirDeploymentUuid = uuidv4();
  // //       const newLibraryDeploymentUuid = uuidv4();
  // //       const deployMiroir = await persistenceStoreControllerManager.deployModule(
  // //         localMiroirPersistenceStoreController,
  // //         newMiroirDeploymentUuid,
  // //         miroirConfig.client.deploymentStorageConfig[adminConfigurationDeploymentMiroir.uuid],
  // //         {
  // //           metaModel: defaultMiroirMetaModel,
  // //           dataStoreType: 'miroir',
  // //           selfApplication: selfApplicationMiroir,
  // //           applicationDeploymentConfiguration: selfApplicationDeploymentMiroir, //adminConfigurationDeploymentMiroir,
  // //           applicationModelBranch: selfApplicationModelBranchMiroirMasterBranch,
  // //           applicationVersion: selfApplicationVersionInitialMiroirVersion,
  // //           applicationStoreBasedConfiguration: selfApplicationStoreBasedConfigurationMiroir,
  // //         }
  // //       );
  // //       const deployApp = await persistenceStoreControllerManager.deployModule(
  // //         localMiroirPersistenceStoreController,
  // //         newLibraryDeploymentUuid,
  // //         miroirConfig.client.deploymentStorageConfig[adminConfigurationDeploymentLibrary.uuid],
  // //         {
  // //           metaModel: defaultMiroirMetaModel,
  // //           dataStoreType: 'app',
  // //           selfApplication: selfApplicationLibrary,
  // //           applicationDeploymentConfiguration: selfApplicationDeploymentLibrary, //adminConfigurationDeploymentLibrary,
  // //           applicationModelBranch: selfApplicationModelBranchLibraryMasterBranch,
  // //           applicationVersion: selfApplicationVersionLibraryInitialVersion,
  // //           applicationStoreBasedConfiguration: selfApplicationStoreBasedConfigurationLibrary,
  // //         }
  // //       );
  // //       expect(deployMiroir).toEqual( ACTION_OK )
  // //       expect(deployApp).toEqual( ACTION_OK )
  // //     }
  // //   } else {
  // //     expect(false, "could not test module deployment, configuration can not specify to use a real server, only emulated server makes sense in this case")
  // //   }
  // //   expect(true).toEqual(true);
  // // },10000);

  // // ################################################################################################
  // it("get Entity instance: the Report Entity", async () => {
  //   await chainVitestSteps(
  //     "actualTest_getInstancesAndCheckResult",
  //     {},
  //     async () => localMiroirPersistenceStoreController.getInstance("model",entityEntity.uuid, entityReport.uuid),
  //     (a) => (a as any).returnedDomainElement.uuid,
  //     undefined, // name to give to result
  //     undefined,
  //     "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
  //   );
  // });

  // ################################################################################################
  it("get Miroir Entities", async () => {

    await chainVitestSteps(
      "actualTest_getInstancesAndCheckResult",
      {},
      async () => localMiroirPersistenceStoreController.getInstances("model", entityEntity.uuid),
      (a) =>
        (a as any).returnedDomainElement.instances.map((i: EntityInstance) => i["uuid"]).sort(),
      undefined, // name to give to result
      // "entityInstanceCollection",
      undefined,
      [
        "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
        "3d8da4d4-8f76-4bb4-9212-14869d81c00c",
        "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
        "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
        "5e81e1b9-38be-487c-b3e5-53796c57fccf",
        "a659d350-dd97-4da9-91de-524fa01745dc",
        "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24",
        "cdb0aec6-b848-43ac-a058-fe2dbe5811f1",
        "dde4c883-ae6d-47c3-b6df-26bc6e3c1842",
        "e4320b9e-ab45-4abe-85d8-359604b3c62f",
        "e54d7dc1-4fbc-495e-9ed9-b5cf081b9fbd",
      ]
    );
  });


  // ################################################################################################
  it("get Library Entities", async () => {
    await chainVitestSteps(
      "actualTest_getInstancesAndCheckResult",
      {},
      // async () => localAppPersistenceStoreController.getInstances("model",entityEntity.uuid),
      async () => localAppPersistenceStoreController.getInstances("model",entityEntity.uuid),
      // (a) => ignorePostgresExtraAttributes((a as any).returnedDomainElement.instances),
      undefined, // expected result transformation
      undefined, // name to give to result
      // "entityInstanceCollection",
      undefined,
      {
        "applicationSection": "model",
        "instances": [],
        "parentUuid": entityEntity.uuid,
      }
    )

  });

  // ################################################################################################
  it("create Author Entity", async () => {

    await chainVitestSteps(
      // setup
      "setup_createEntity",
      {},
      async () =>
        localAppPersistenceStoreController.createEntity(
          entityAuthor as MetaEntity,
          entityDefinitionAuthor as EntityDefinition
        ),
      undefined,
      undefined, // name to give to result
      undefined, // expected result.elementType
      undefined // expected result
    );

    await chainVitestSteps(
      "actualTest_getInstancesAndCheckResult",
      {},
      async () => localAppPersistenceStoreController.getInstances("model", entityEntity.uuid),
      (a) =>
        ignorePostgresExtraAttributesOnList((a as any).returnedDomainElement.instances, [
          "author",
          "storageAccess",
        ]),
      undefined, // name to give to result
      // "entityInstanceCollection",
      undefined,
      [entityAuthor],
    );
  });

  // ################################################################################################
  it("rename Author Entity", async () => {

    // setup
    const entityCreated = await localAppPersistenceStoreController.createEntity(entityAuthor as MetaEntity,entityDefinitionAuthor as EntityDefinition)

    expect(entityCreated, "failed to setup test case").toEqual(ACTION_OK)
    // test starts
    const modelActionRenameEntity:ModelActionRenameEntity =  {
      // actionType: "modelAction",
      actionType: "renameEntity",
      application:"360fcf1f-f0d4-4f8a-9262-07886e70fa15",
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      payload: {
        application: selfApplicationLibrary.uuid,
        // deploymentUuid:adminConfigurationDeploymentLibrary.uuid,
        entityUuid: entityAuthor.uuid, 
        entityName: entityAuthor.name,
        entityDefinitionUuid: entityDefinitionAuthor.uuid,
        targetValue: entityAuthor.name + "ssss"
      }
    };

    await chainVitestSteps(
      "fetchEntities",
      { },
      async () => await localAppPersistenceStoreController.getInstances("model",entityEntity.uuid),
      (a, p) => (a as any).returnedDomainElement.instances as MetaEntity[],
      "entities", // name to give to result
      // "entityInstanceCollection", // expected result.elementType
      undefined,
      undefined, // test result
    )
    .then (
      (v) => chainVitestSteps(
        "fetchEntityDefinitions",
        v,
        async () => await localAppPersistenceStoreController.getInstances("model", entityEntityDefinition.uuid),
        (a, p) => (a as any).returnedDomainElement.instances as EntityDefinition[],
        "entityDefinitions", // name to give to result
        // "entityInstanceCollection", // expected result.elementType
        undefined,
        undefined, // expected result
      )
    )
    .then (
      (v) => chainVitestSteps(
        "fetchEntityDefinitions",
        v,
        async () => await localAppPersistenceStoreController.renameEntityClean(modelActionRenameEntity),
        undefined,
        undefined, // name to give to result
        undefined, // expected result.elementType
        undefined, // expected result
      )
    )
    .then((v) =>
      chainVitestSteps(
        "getEntityInstancesToCheckResult",
        v,
        async () => await localAppPersistenceStoreController.getInstances("model", entityEntity.uuid),
        (a) => ignorePostgresExtraAttributesOnList((a as any).returnedDomainElement.instances, ["author", "icon", "display", "storageAccess"]),
        undefined, // name to give to result
        // "entityInstanceCollection",
        undefined,
        [
          {
            ...entityAuthor,
            name: entityAuthor.name + "ssss",
          },
        ]
      )
    )
    .then((v) =>
      chainVitestSteps(
        "getEntityDefinitionInstancesToCheckResult",
        v,
        async () => await localAppPersistenceStoreController.getInstances("model", entityEntityDefinition.uuid),
        (a) => ignorePostgresExtraAttributesOnList((a as any).returnedDomainElement.instances, ["author", "icon", "display", "storageAccess"]),
        undefined, // name to give to result
        // "entityInstanceCollection",
        undefined,
        [
          {
            ...entityDefinitionAuthor,
            name: entityDefinitionAuthor.name + "ssss",
          },
        ]
      )
    );
  });

  // ################################################################################################
  it("delete Author Entity", async () => {

    // setup
    const entityCreated = await localAppPersistenceStoreController.createEntity(entityAuthor as MetaEntity,entityDefinitionAuthor as EntityDefinition)

    expect(entityCreated, "failed to setup test case").toEqual(ACTION_OK)

    // test starts
    const modelActionDropEntity:ModelActionDropEntity =  {
      // actionType: "modelAction",
      actionType: "dropEntity",
      application:"360fcf1f-f0d4-4f8a-9262-07886e70fa15",
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      payload: {
        application: selfApplicationLibrary.uuid,
        // deploymentUuid:adminConfigurationDeploymentLibrary.uuid,
        entityUuid: entityAuthor.uuid, 
        // entityName: entityAuthor.name,
        entityDefinitionUuid: entityDefinitionAuthor.uuid
      }
     };

    
    // const entities: MetaEntity[] = (await localAppPersistenceStoreController.getInstances("model",entityEntity.uuid))?.instances as MetaEntity[];
    // const entityDefinitions: EntityDefinition[] = (await localAppPersistenceStoreController.getInstances("model",entityEntityDefinition.uuid))?.instances as EntityDefinition[];
    await chainVitestSteps(
      //   "setup_createEntity",
      //   {},
      //   async () => localAppPersistenceStoreController.createEntity(entityAuthor as MetaEntity,entityDefinitionAuthor as EntityDefinition),
      //   undefined,
      //   undefined, // name to give to result
      //   undefined, // expected result.elementType
      //   undefined, // expected result
      // )
      // .then(
      // (v) => chainVitestSteps(
      "fetchEntities",
      {},
      async () => await localAppPersistenceStoreController.getInstances("model", entityEntity.uuid),
      (a, p) => (a as any).returnedDomainElement.instances as MetaEntity[],
      "entities", // name to give to result
      // "entityInstanceCollection", // expected result.elementType
      undefined,
      undefined // test result
      // )
    )
      .then((v) =>
        chainVitestSteps(
          "fetchEntityDefinitions",
          v,
          async () =>
            await localAppPersistenceStoreController.getInstances(
              "model",
              entityEntityDefinition.uuid
            ),
          (a, p) => (a as any).returnedDomainElement.instances as EntityDefinition[],
          "entityDefinitions", // name to give to result
          // "entityInstanceCollection", // expected result.elementType
          undefined,
          undefined // expected result
        )
      )
      .then((v) =>
        chainVitestSteps(
          "dropAuthorEntity",
          {},
          async () =>
            await localAppPersistenceStoreController.dropEntity(
              modelActionDropEntity.payload.entityUuid
            ),
          undefined,
          undefined, // name to give to result
          undefined, // expected result.elementType
          undefined // expected result
        )
      )
      .then((v) =>
        chainVitestSteps(
          "actualTest_getInstancesAndCheckResult",
          v,
          async () =>
            await localAppPersistenceStoreController.getInstances("model", entityEntity.uuid),
          (a) => ignorePostgresExtraAttributesOnList((a as any).returnedDomainElement.instances),
          undefined, // name to give to result
          // "entityInstanceCollection",
          undefined,
          []
        )
      );
  });

  // ################################################################################################
  it("alter Author Entity: alter Author Entity attribute", async () => {

    // setup
    const entityCreated = await localAppPersistenceStoreController.createEntity(entityAuthor as MetaEntity,entityDefinitionAuthor as EntityDefinition)

    expect(entityCreated, "failed to setup test case").toEqual(ACTION_OK)
    // test starts
    const iconsDefinition: JzodElement = {
      type: "number",
      optional: true,
      tag: { value: { id: 6, defaultLabel: "Gender (narrow-minded)" } },
    };
    const modelActionAlterAttribute:ModelAction =  {
      // actionType: "modelAction",
      actionType: "alterEntityAttribute",
      application:"360fcf1f-f0d4-4f8a-9262-07886e70fa15", 
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      payload: {
        application: selfApplicationLibrary.uuid,
        // deploymentUuid:adminConfigurationDeploymentLibrary.uuid,
        entityUuid: entityAuthor.uuid, 
        entityDefinitionUuid: entityDefinitionAuthor.uuid,
        entityName: entityAuthor.name,
        // entityAttributeId: 6,
        // entityAttributeName: "icon",
        // entityAttributeRename: "icons",
        addColumns: [
          {
            "name": "icons",
            "definition": iconsDefinition
          }
        ],
        // update: {
        //   "type": "number", "optional": true, "tag": { "id":6, "defaultLabel": "Gender (narrow-minded)", "editable": true }
        // }
      }
    };

    await chainVitestSteps(
      "fetchEntities",
      {},
      async () => await localAppPersistenceStoreController.getInstances("model", entityEntity.uuid),
      (a, p) => (a as any).returnedDomainElement.instances as MetaEntity[],
      "entities", // name to give to result
      // "entityInstanceCollection", // expected result.elementType
      undefined,
      undefined // test result
    )
      .then((v) =>
        chainVitestSteps(
          "fetchEntityDefinitions",
          v,
          async () =>
            await localAppPersistenceStoreController.getInstances(
              "model",
              entityEntityDefinition.uuid
            ),
          (a, p) => (a as any).returnedDomainElement.instances as EntityDefinition[],
          "entityDefinitions", // name to give to result
          // "entityInstanceCollection", // expected result.elementType
          undefined,
          undefined // expected result
        )
      )
      .then((v) =>
        chainVitestSteps(
          "fetchEntityDefinitions",
          v,
          async () =>
            await localAppPersistenceStoreController.alterEntityAttribute(
              modelActionAlterAttribute
            ),
          undefined,
          undefined, // name to give to result
          undefined, // expected result.elementType
          undefined // expected result
        )
      )
      .then((v) =>
        chainVitestSteps(
          "getEntityInstancesToCheckResult",
          v,
          async () =>
            await localAppPersistenceStoreController.getInstances(
              "model",
              entityEntityDefinition.uuid
            ),
          (a) =>
            ignorePostgresExtraAttributesOnList((a as any).returnedDomainElement.instances, [
              "icon", "display", "storageAccess",
            ]),
          undefined, // name to give to result
          // "entityInstanceCollection",
          undefined,
          [
            {
              ...entityDefinitionAuthor,
              mlSchema: {
                type: "object",
                definition: {
                  ...Object.fromEntries(
                    Object.entries(entityDefinitionAuthor.mlSchema.definition).filter(
                      (i) => !modelActionAlterAttribute.payload.removeColumns?.includes(i[0])
                    )
                  ),
                  icons: iconsDefinition,
                },
                // entityAuthor.name + "ssss",
              },
            },
          ]
        )
      );
    // .then((v) =>
    //   chainVitestSteps(
    //     "getEntityDefinitionInstancesToCheckResult",
    //     v,
    //     async () => await localAppPersistenceStoreController.getInstances("model", entityEntityDefinition.uuid),
    //     (a) => ignorePostgresExtraAttributes((a as any).returnedDomainElement.instances),
    //     undefined, // name to give to result
    //     "entityInstanceCollection",
    //     [
    //       {
    //         ...entityDefinitionAuthor,
    //         name: entityDefinitionAuthor.name + "ssss",
    //       },
    //     ]
    //   )
    // );
  });
  
  
  // ################################################################################################
  it("add Author Instance", async () => {
    // setup
    // const entityCreated = await localAppPersistenceStoreController.createEntity(entityAuthor as MetaEntity,entityDefinitionAuthor as EntityDefinition)
    // expect(entityCreated, "failed to setup test case").toEqual(ACTION_OK)

    await chainVitestSteps(
      "setup_createEntity",
      {},
      async () => localAppPersistenceStoreController.createEntity(entityAuthor as MetaEntity,entityDefinitionAuthor as EntityDefinition),
      undefined,
      undefined, // name to give to result
      undefined, // expected result.elementType
      undefined, // expected result
    )

    const instanceAdded = await localAppPersistenceStoreController?.upsertInstance('data', author1 as EntityInstance);
    expect(instanceAdded, "failed to add Author instance").toEqual(ACTION_OK)
    // expect(instanceAdded.uuid, "failed to add Author instance").toEqual("4441169e-0c22-4fbc-81b2-28c87cf48ab2")

    // .then((v) =>
    //   chainVitestSteps(
    //     "actionToBeTested",
    //     v,
    //     async () => localAppPersistenceStoreController?.upsertInstance('data', author1 as EntityInstance),
    //     undefined, // transformation function to apply to result,
    //     undefined, // name to give to result
    //     undefined, // expected result type
    //     undefined // to value to compare with
    //   )
    // )
    // .then((v) =>
    await chainVitestSteps(
      "actualTest_getInstancesAndCheckResult",
      {},
      async () => localAppPersistenceStoreController.getInstances("data", entityAuthor.uuid),
      (a) =>
        ignorePostgresExtraAttributesOnList((a as any).returnedDomainElement.instances, [
          "birthDate",
          "deathDate",
          "conceptLevel",
          "icons",
          "language",
        ]),
      undefined, // name to give to result
      // "entityInstanceCollection",
      undefined,
      [author1]
    );

  });
  
  // ################################################################################################
  it("add Book Instance fails", async () => {
    // setup
    await chainVitestSteps(
      "setup_createEntity",
      {},
      async () => localAppPersistenceStoreController.createEntity(entityAuthor as MetaEntity,entityDefinitionAuthor as EntityDefinition),
      undefined,
      undefined, // name to give to result
      undefined, // expected result.elementType
      undefined, // expected result
    )

    const instanceAdded = (await localAppPersistenceStoreController?.upsertInstance(
      "data",
      book1 as EntityInstance,
    )) as ActionError;
    console.log("instanceAdded", instanceAdded)
    expect({errorType: instanceAdded.errorType, errorMessage: instanceAdded.errorMessage}, "failed to add Book instance").toEqual({
      errorType: "FailedToUpsertInstance",
      errorMessage: "upsertInstance failed for section: data, entityUuid e8ba151b-d68e-4cc3-9a83-3459d309ccf5, error: Entity not found in data section, existing entities: d7a144ff-d1b9-4135-800c-a7cfc1f38733.",
    });
  });

  // ################################################################################################
  it("update Author Instance", async () => {
    await chainVitestSteps( // setup
      "setup_createEntity",
      {},
      async () => localAppPersistenceStoreController.createEntity(entityAuthor as MetaEntity,entityDefinitionAuthor as EntityDefinition),
      undefined,
      undefined, // name to give to result
      undefined, // expected result.elementType
      undefined, // expected result
    )

    // test
    const instanceUpdated = await localAppPersistenceStoreController?.upsertInstance('data', {...author1, "name": author1.name + "ssss"} as EntityInstance);
    // check that upsert succeeded
    expect(instanceUpdated, "failed to add Author instance").toEqual(ACTION_OK)
    // expect(instanceUpdated.uuid, "failed to update Author instance").toEqual("4441169e-0c22-4fbc-81b2-28c87cf48ab2")

    await chainVitestSteps(
      "actualTest_getInstancesAndCheckResult",
      {},
      async () => localAppPersistenceStoreController.getInstances("data",entityAuthor.uuid),
      (a) => ignorePostgresExtraAttributesOnList((a as any).returnedDomainElement.instances, ["birthDate", "deathDate", "conceptLevel", "icons", "language" ]),
      undefined, // name to give to result
      // "entityInstanceCollection",
      undefined,
      [{...author1, "name": author1.name + "ssss"}]
    )

  });


  // ################################################################################################
  it("delete Author Instance", async () => {
    // setup
    const entityCreated = await localAppPersistenceStoreController.createEntity(entityAuthor as MetaEntity,entityDefinitionAuthor as EntityDefinition)
    await chainVitestSteps( // setup
      "setup_createEntity",
      {},
      async () => localAppPersistenceStoreController.createEntity(entityAuthor as MetaEntity,entityDefinitionAuthor as EntityDefinition),
      undefined,
      undefined, // name to give to result
      undefined, // expected result.elementType
      undefined, // expected result
    )

    const instanceAdded = await localAppPersistenceStoreController?.upsertInstance('data', author1 as EntityInstance);
    expect(entityCreated, "failed to setup test case").toEqual(ACTION_OK)
    expect(instanceAdded, "failed to setup test case").toEqual(ACTION_OK)

    // test
    const instanceDeleted: Action2VoidReturnType = await localAppPersistenceStoreController?.deleteInstances('data', [author1]);
    // // expect(instanceDeleted, "failed to setup test case").toEqual(ACTION_OK)
    // const rawResult = await localAppPersistenceStoreController.getInstances("data",entityAuthor.uuid);
    // const testResult = ignorePostgresExtraAttributes(rawResult?.instances??[])
    // expect(testResult).toEqual([],);
    await chainVitestSteps(
      "actualTest_getInstancesAndCheckResult",
      {},
      async () => localAppPersistenceStoreController.getInstances("data", entityAuthor.uuid),
      (a) => ignorePostgresExtraAttributesOnList((a as any).returnedDomainElement.instances),
      undefined, // name to give to result
      // "entityInstanceCollection",
      undefined,
      []
    );
  });

  // ################################################################################################
  it("delete Author Instance fails", async () => {
    // test
    const instanceDeleted: Action2VoidReturnType = await localAppPersistenceStoreController?.deleteInstances("data", [
      author1,
    ]);
    expect(instanceDeleted.status, "failed to delete Author instances").toEqual("error");

    const instanceDeletedError = instanceDeleted as ActionError;
    console.log("instanceDeletedError", instanceDeletedError)
    expect(
      { errorType: instanceDeletedError.errorType, errorMessage: instanceDeletedError.errorMessage },
      "failed to delete Author"
    ).toEqual({
      errorType: "FailedToDeleteInstance",
      errorMessage: "could not find entity d7a144ff-d1b9-4135-800c-a7cfc1f38733",
    });
  });

});
