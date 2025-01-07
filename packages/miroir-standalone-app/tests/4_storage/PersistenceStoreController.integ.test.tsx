import { describe, expect } from 'vitest';

// import { miroirFileSystemStoreSectionStartup } from "../dist/bundle";
import {
  ACTION_OK,
  ActionError,
  ActionReturnType,
  ActionVoidReturnType,
  ConfigurationService,
  DomainControllerInterface,
  DomainElementType,
  EntityDefinition,
  EntityInstance,
  JzodElement,
  LoggerInterface,
  MetaEntity,
  MiroirConfigClient,
  MiroirLoggerFactory,
  ModelAction,
  ModelActionDropEntity,
  ModelActionRenameEntity,
  PersistenceStoreControllerInterface,
  PersistenceStoreControllerManagerInterface,
  SelfApplicationDeploymentConfiguration,
  adminConfigurationDeploymentLibrary,
  adminConfigurationDeploymentMiroir,
  author1,
  book1,
  defaultLevels,
  entityAuthor,
  entityDefinitionAuthor,
  entityEntity,
  entityEntityDefinition,
  entityReport,
  ignorePostgresExtraAttributesOnList,
  miroirCoreStartup,
  resetAndInitApplicationDeploymentNew,
  selfApplicationDeploymentLibrary,
  selfApplicationDeploymentMiroir
} from "miroir-core";


import { MiroirContext } from 'miroir-core';
import { LocalCache } from 'miroir-localcache-redux';
import { miroirFileSystemStoreSectionStartup } from 'miroir-store-filesystem';
import { miroirIndexedDbStoreSectionStartup } from 'miroir-store-indexedDb';
import { miroirPostgresStoreSectionStartup } from 'miroir-store-postgres';
import { loglevelnext } from "../../src/loglevelnextImporter.js";
import {
  createDeploymentGetPersistenceStoreController,
  createLibraryDeploymentDEFUNCT,
  createMiroirDeploymentGetPersistenceStoreController,
  deleteAndCloseApplicationDeployments,
  deploymentConfigurations,
  loadTestConfigFiles,
  miroirBeforeEach_resetAndInitApplicationDeployments,
  setupMiroirTest
} from "../utils/tests-utils.js";
import { packageName, cleanLevel } from '../../src/constants.js';
import { miroirAppStartup } from '../../src/startup.js';
import { ErrorMessage } from 'formik';

let domainController: DomainControllerInterface;
let localCache: LocalCache;
let localMiroirPersistenceStoreController: PersistenceStoreControllerInterface;
let localAppPersistenceStoreController: PersistenceStoreControllerInterface;
let miroirContext: MiroirContext;
let persistenceStoreControllerManager: PersistenceStoreControllerManagerInterface | undefined;

const env:any = (import.meta as any).env
console.log("@@@@@@@@@@@@@@@@@@ env", env);

const myConsoleLog = (...args: any[]) => console.log(fileName, ...args);
// const {miroirConfig, logConfig:loggerOptions} = await loadTestConfigFiles(env);
const fileName = "PersistenceStoreController.integ..test";
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
MiroirLoggerFactory.startRegisteredLoggers(
  loglevelnext,
  (defaultLevels as any)[loggerOptions.defaultLevel],
  loggerOptions.defaultTemplate,
  loggerOptions.specificLoggerOptions
);
myConsoleLog("started registered loggers DONE");

// ################################################################################################
beforeAll(async () => {
  // Establish requests interception layer before all tests.
  miroirFileSystemStoreSectionStartup();
  miroirIndexedDbStoreSectionStartup();
  miroirPostgresStoreSectionStartup();
  if (!miroirConfig.client.emulateServer) {
    throw new Error(
      "LocalPersistenceStoreController state do not make sense for real server configurations! Please use only 'emulateServer: true' configurations for this test."
    );
  } else {
    const {
      persistenceStoreControllerManagerForServer: localpersistenceStoreControllerManager,
      domainController: localdomainController,
      localCache: locallocalCache,
      miroirContext: localmiroirContext,
    } = await setupMiroirTest(miroirConfig);

    
    persistenceStoreControllerManager = localpersistenceStoreControllerManager;
    domainController = localdomainController;
    localCache = locallocalCache;
    miroirContext = localmiroirContext;
    
    if (!persistenceStoreControllerManager) {
      throw new Error("localpersistenceStoreControllerManager not defined");
    }

    // localMiroirPersistenceStoreController = await createDeploymentGetPersistenceStoreController(
    //   miroirConfig as MiroirConfigClient,
    //   adminConfigurationDeploymentMiroir.uuid,
    //   persistenceStoreControllerManager,
    //   domainController
    // );
    // localAppPersistenceStoreController = await createDeploymentGetPersistenceStoreController(
    //   miroirConfig as MiroirConfigClient,
    //   adminConfigurationDeploymentLibrary.uuid,
    //   persistenceStoreControllerManager,
    //   domainController
    // );
    const wrapped = await createMiroirDeploymentGetPersistenceStoreController(
      miroirConfig as MiroirConfigClient,
      persistenceStoreControllerManager,
      domainController
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
    await createLibraryDeploymentDEFUNCT(miroirConfig, domainController);

    const tmplocalAppPersistenceStoreController = persistenceStoreControllerManager.getPersistenceStoreController(
      adminConfigurationDeploymentLibrary.uuid
    );
    if (!tmplocalAppPersistenceStoreController) {
      throw new Error("beforeAll failed localAppPersistenceStoreController initialization!");
    }
    localAppPersistenceStoreController = tmplocalAppPersistenceStoreController;

    return Promise.resolve();

    // return Promise.resolve();
  }
});

// ################################################################################################
beforeEach(
  async  () => {
    // await miroirBeforeEach_resetAndInitApplicationDeployments(domainController, deploymentConfigurations);
    await resetAndInitApplicationDeploymentNew(domainController, deploymentConfigurations);
  }
)

// // // ################################################################################################
// // afterEach(
// //   async () => {
// //     await resetApplicationDeployments(deploymentConfigurations, domainController, undefined);
// //   }
// // )

// // ################################################################################################
// afterAll(
//   async () => {
//     console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ deleteAndCloseApplicationDeployments")
//     await deleteAndCloseApplicationDeployments(
//       miroirConfig,
//       domainController,
//       [
//         {
//           adminConfigurationDeployment: adminConfigurationDeploymentMiroir,
//           selfApplicationDeployment: selfApplicationDeploymentMiroir as SelfApplicationDeploymentConfiguration,
//         },
//         {
//           adminConfigurationDeployment: adminConfigurationDeploymentLibrary,
//           selfApplicationDeployment: selfApplicationDeploymentLibrary as SelfApplicationDeploymentConfiguration,
//         },
//       ],
//     );

//     console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ Done deleteAndCloseApplicationDeployments")
//   }
// )

// ##############################################################################################
// ##############################################################################################
// ##############################################################################################
const chainVitestSteps = async (
  stepName: string,
  context: {[k:string]: any},
  functionCallingActionToTest: () => Promise<ActionReturnType>,
  resultTransformation?: (a:ActionReturnType,p:{[k:string]: any}) => any,
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
  const domainElement = await functionCallingActionToTest();
  console.log(
    "########################################### chainTestAsyncDomainCalls",
    stepName,
    "result:",
    JSON.stringify(domainElement, undefined, 2)
  );
  let testResult
  if (domainElement.status == "ok") {
    testResult = resultTransformation
      ? resultTransformation(domainElement, context)
      : domainElement.status == "ok"
      ? domainElement?.returnedDomainElement?.elementValue
      : undefined;
    if (expectedDomainElementType) {
      if (domainElement.returnedDomainElement?.elementType != expectedDomainElementType) {
        expect(
          domainElement.returnedDomainElement?.elementType,
          stepName + "received result: " + domainElement.returnedDomainElement
        ).toEqual(expectedDomainElementType); // fails
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
    expect(
      domainElement.status,
      domainElement.error?.errorType ?? "no errorType" + ": " + domainElement.error?.errorMessage ?? "no errorMessage"
    ).toEqual("ok");
  }
  console.log("########################################### chainTestAsyncDomainCalls", stepName, "testResult:", JSON.stringify(testResult,undefined, 2));
  if (testResult && addResultToContextAsName) {
    return {...context, [addResultToContextAsName]: testResult}
  } else {
    return context
  }
}

describe.sequential("PersistenceStoreController.unit.test", () => {

  // // ################################################################################################
  // TODO: rephrase as deployment of a module that is not yet deployed, neither miroir nor library
  // it("Create miroir2 store", async () => { // TODO: test failure cases!
  //     if (miroirConfig.client.emulateServer) {
  //       console.log("Create miroir2 store START")
  //       const testResult: ActionReturnType = await localMiroirPersistenceStoreController.createStore(
  //         miroirConfig.client.deploymentStorageConfig[adminConfigurationDeploymentMiroir.uuid].model
  //       );
  //       const testResult2: ActionReturnType = await localMiroirPersistenceStoreController.createStore(
  //         miroirConfig.client.deploymentStorageConfig[adminConfigurationDeploymentMiroir.uuid].data
  //       );
  //       //cleanup
  //       const testResult3: ActionReturnType = await localMiroirPersistenceStoreController.deleteStore(
  //         miroirConfig.client.deploymentStorageConfig[adminConfigurationDeploymentMiroir.uuid].model
  //       );
  //       const testResult4: ActionReturnType = await localMiroirPersistenceStoreController.deleteStore(
  //         miroirConfig.client.deploymentStorageConfig[adminConfigurationDeploymentMiroir.uuid].data
  //       );
  //       // test
  //       expect(testResult).toEqual(ACTION_OK)
  //       expect(testResult2).toEqual(ACTION_OK)
  //       expect(testResult3).toEqual(ACTION_OK)
  //       expect(testResult4).toEqual(ACTION_OK)
  //       console.log("Create miroir2 store END")
  //     } else {
  //       expect(false, "could not test store creation, configuration can not specify to use a real server, only emulated server makes sense in this case")
  //     }
  //   }
  // );

  // // ################################################################################################
  // TODO: rephrase as deployment of a module that is not yet deployed, neither miroir nor library
  // it("deploy Miroir and Library modules.", async () => {
  //   if (miroirConfig.client.emulateServer) {
  //     if (persistenceStoreControllerManager) {
  //       const newMiroirDeploymentUuid = uuidv4();
  //       const newLibraryDeploymentUuid = uuidv4();
  //       const deployMiroir = await persistenceStoreControllerManager.deployModule(
  //         localMiroirPersistenceStoreController,
  //         newMiroirDeploymentUuid,
  //         miroirConfig.client.deploymentStorageConfig[adminConfigurationDeploymentMiroir.uuid],
  //         {
  //           metaModel: defaultMiroirMetaModel,
  //           dataStoreType: 'miroir',
  //           application: selfApplicationMiroir,
  //           applicationDeploymentConfiguration: selfApplicationDeploymentMiroir, //adminConfigurationDeploymentMiroir,
  //           applicationModelBranch: selfApplicationModelBranchMiroirMasterBranch,
  //           applicationVersion: selfApplicationVersionInitialMiroirVersion,
  //           applicationStoreBasedConfiguration: selfApplicationStoreBasedConfigurationMiroir,
  //         }
  //       );
  //       const deployApp = await persistenceStoreControllerManager.deployModule(
  //         localMiroirPersistenceStoreController,
  //         newLibraryDeploymentUuid,
  //         miroirConfig.client.deploymentStorageConfig[adminConfigurationDeploymentLibrary.uuid],
  //         {
  //           metaModel: defaultMiroirMetaModel,
  //           dataStoreType: 'app',
  //           application: selfApplicationLibrary,
  //           applicationDeploymentConfiguration: selfApplicationDeploymentLibrary, //adminConfigurationDeploymentLibrary,
  //           applicationModelBranch: selfApplicationModelBranchLibraryMasterBranch,
  //           applicationVersion: selfApplicationVersionLibraryInitialVersion,
  //           applicationStoreBasedConfiguration: selfApplicationStoreBasedConfigurationLibrary,
  //         }
  //       );
  //       expect(deployMiroir).toEqual( ACTION_OK )
  //       expect(deployApp).toEqual( ACTION_OK )
  //     }
  //   } else {
  //     expect(false, "could not test module deployment, configuration can not specify to use a real server, only emulated server makes sense in this case")
  //   }
  //   expect(true).toEqual(true);
  // },10000);

  // ################################################################################################
  it("get Entity instance: the Report Entity", async () => {
    await chainVitestSteps(
      "actualTest_getInstancesAndCheckResult",
      {},
      async () => localMiroirPersistenceStoreController.getInstance("model",entityEntity.uuid, entityReport.uuid),
      (a) => (a as any).returnedDomainElement.elementValue.uuid,
      undefined, // name to give to result
      "instance",
      "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
    );
  });

  // ################################################################################################
  it("get Miroir Entities", async () => {

    await chainVitestSteps(
      "actualTest_getInstancesAndCheckResult",
      {},
      async () => localMiroirPersistenceStoreController.getInstances("model", entityEntity.uuid),
      (a) => (a as any).returnedDomainElement.elementValue.instances.map((i: EntityInstance) => i["uuid"]).sort(),
      undefined, // name to give to result
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
        "dde4c883-ae6d-47c3-b6df-26bc6e3c1842",
        "e4320b9e-ab45-4abe-85d8-359604b3c62f",
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
      // (a) => ignorePostgresExtraAttributes((a as any).returnedDomainElement.elementValue.instances),
      undefined, // expected result transformation
      undefined, // name to give to result
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
      undefined // expected result.elementValue
    );

    await chainVitestSteps(
      "actualTest_getInstancesAndCheckResult",
      {},
      async () => localAppPersistenceStoreController.getInstances("model", entityEntity.uuid),
      (a) => ignorePostgresExtraAttributesOnList((a as any).returnedDomainElement.elementValue.instances, ["author"]),
      undefined, // name to give to result
      "entityInstanceCollection",
      [entityAuthor]
    );
  });

  // ################################################################################################
  it("rename Author Entity", async () => {

    // setup
    const entityCreated = await localAppPersistenceStoreController.createEntity(entityAuthor as MetaEntity,entityDefinitionAuthor as EntityDefinition)

    expect(entityCreated, "failed to setup test case").toEqual(ACTION_OK)
    // test starts
    const modelActionRenameEntity:ModelActionRenameEntity =  {
      actionType: "modelAction",
      actionName: "renameEntity",
      deploymentUuid:adminConfigurationDeploymentLibrary.uuid,
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      entityUuid: entityAuthor.uuid, 
      entityName: entityAuthor.name,
      entityDefinitionUuid: entityDefinitionAuthor.uuid,
      targetValue: entityAuthor.name + "ssss"
    };

    await chainVitestSteps(
      "fetchEntities",
      { },
      async () => await localAppPersistenceStoreController.getInstances("model",entityEntity.uuid),
      (a, p) => (a as any).returnedDomainElement.elementValue.instances as MetaEntity[],
      "entities", // name to give to result
      "entityInstanceCollection", // expected result.elementType
      undefined, // test result.elementValue
    )
    .then (
      (v) => chainVitestSteps(
        "fetchEntityDefinitions",
        v,
        async () => await localAppPersistenceStoreController.getInstances("model", entityEntityDefinition.uuid),
        (a, p) => (a as any).returnedDomainElement.elementValue.instances as EntityDefinition[],
        "entityDefinitions", // name to give to result
        "entityInstanceCollection", // expected result.elementType
        undefined, // expected result.elementValue
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
        undefined, // expected result.elementValue
      )
    )
    .then((v) =>
      chainVitestSteps(
        "getEntityInstancesToCheckResult",
        v,
        async () => await localAppPersistenceStoreController.getInstances("model", entityEntity.uuid),
        (a) => ignorePostgresExtraAttributesOnList((a as any).returnedDomainElement.elementValue.instances, ["author", "icon"]),
        undefined, // name to give to result
        "entityInstanceCollection",
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
        (a) => ignorePostgresExtraAttributesOnList((a as any).returnedDomainElement.elementValue.instances, ["author", "icon"]),
        undefined, // name to give to result
        "entityInstanceCollection",
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
      actionType: "modelAction",
      actionName: "dropEntity",
      deploymentUuid:adminConfigurationDeploymentLibrary.uuid,
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      entityUuid: entityAuthor.uuid, 
      // entityName: entityAuthor.name,
      entityDefinitionUuid: entityDefinitionAuthor.uuid
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
      //   undefined, // expected result.elementValue
      // )
      // .then(
        // (v) => chainVitestSteps(
        "fetchEntities",
        {},
        async () => await localAppPersistenceStoreController.getInstances("model",entityEntity.uuid),
        (a, p) => (a as any).returnedDomainElement.elementValue.instances as MetaEntity[],
        "entities", // name to give to result
        "entityInstanceCollection", // expected result.elementType
        undefined, // test result.elementValue
        // )
      )
      .then (
        (v) => chainVitestSteps(
          "fetchEntityDefinitions",
          v,
          async () => await localAppPersistenceStoreController.getInstances("model", entityEntityDefinition.uuid),
          (a, p) => (a as any).returnedDomainElement.elementValue.instances as EntityDefinition[],
          "entityDefinitions", // name to give to result
          "entityInstanceCollection", // expected result.elementType
          undefined, // expected result.elementValue
        )
      )
      .then (
      (v) => chainVitestSteps(
      "dropAuthorEntity",
      {},
      async () => await localAppPersistenceStoreController.dropEntity(modelActionDropEntity.entityUuid),
      undefined,
      undefined, // name to give to result
      undefined, // expected result.elementType
      undefined // expected result.elementValue
      )
    ).then((v) =>
      chainVitestSteps(
        "actualTest_getInstancesAndCheckResult",
        v,
        async () => await localAppPersistenceStoreController.getInstances("model", entityEntity.uuid),
        (a) => ignorePostgresExtraAttributesOnList((a as any).returnedDomainElement.elementValue.instances),
        undefined, // name to give to result
        "entityInstanceCollection",
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
      "type": "number", "optional": true, "tag": { "value": { "id":6, "defaultLabel": "Gender (narrow-minded)", "editable": true } }
    };
    const modelActionAlterAttribute:ModelAction =  {
      actionType: "modelAction",
      actionName: "alterEntityAttribute",
      deploymentUuid:adminConfigurationDeploymentLibrary.uuid,
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
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
    };

    await chainVitestSteps(
      "fetchEntities",
      {},
      async () => await localAppPersistenceStoreController.getInstances("model", entityEntity.uuid),
      (a, p) => (a as any).returnedDomainElement.elementValue.instances as MetaEntity[],
      "entities", // name to give to result
      "entityInstanceCollection", // expected result.elementType
      undefined // test result.elementValue
    )
      .then((v) =>
        chainVitestSteps(
          "fetchEntityDefinitions",
          v,
          async () => await localAppPersistenceStoreController.getInstances("model", entityEntityDefinition.uuid),
          (a, p) => (a as any).returnedDomainElement.elementValue.instances as EntityDefinition[],
          "entityDefinitions", // name to give to result
          "entityInstanceCollection", // expected result.elementType
          undefined // expected result.elementValue
        )
      )
      .then((v) =>
        chainVitestSteps(
          "fetchEntityDefinitions",
          v,
          async () => await localAppPersistenceStoreController.alterEntityAttribute(modelActionAlterAttribute),
          undefined,
          undefined, // name to give to result
          undefined, // expected result.elementType
          undefined // expected result.elementValue
        )
      )
      .then((v) =>
        chainVitestSteps(
          "getEntityInstancesToCheckResult",
          v,
          async () => await localAppPersistenceStoreController.getInstances("model", entityEntityDefinition.uuid),
          (a) => ignorePostgresExtraAttributesOnList((a as any).returnedDomainElement.elementValue.instances, [ "icon" ]),
          undefined, // name to give to result
          "entityInstanceCollection",
          [
            {
              ...entityDefinitionAuthor,
              jzodSchema: {
                type: "object",
                definition: {
                  ...Object.fromEntries(
                    Object.entries(entityDefinitionAuthor.jzodSchema.definition).filter(
                      (i) => !modelActionAlterAttribute.removeColumns?.includes(i[0])
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
    //     (a) => ignorePostgresExtraAttributes((a as any).returnedDomainElement.elementValue.instances),
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
      undefined, // expected result.elementValue
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
        ignorePostgresExtraAttributesOnList((a as any).returnedDomainElement.elementValue.instances, [
          "birthDate",
          "deathDate",
          "conceptLevel",
          "icons",
          "language",
        ]),
      undefined, // name to give to result
      "entityInstanceCollection",
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
      undefined, // expected result.elementValue
    )

    const instanceAdded = (await localAppPersistenceStoreController?.upsertInstance('data', book1 as EntityInstance)) as ActionError;
    console.log("instanceAdded", instanceAdded)
    expect({errorType: instanceAdded.error.errorType, errorMessage: instanceAdded.error.errorMessage}, "failed to add Book instance").toEqual({
      errorType: "FailedToUpdateInstance",
      errorMessage: "failed to upsert instance caef8a59-39eb-48b5-ad59-a7642d3a1e8f of entity e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
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
      undefined, // expected result.elementValue
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
      (a) => ignorePostgresExtraAttributesOnList((a as any).returnedDomainElement.elementValue.instances, ["birthDate", "deathDate", "conceptLevel", "icons", "language" ]),
      undefined, // name to give to result
      "entityInstanceCollection",
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
      undefined, // expected result.elementValue
    )

    const instanceAdded = await localAppPersistenceStoreController?.upsertInstance('data', author1 as EntityInstance);
    expect(entityCreated, "failed to setup test case").toEqual(ACTION_OK)
    expect(instanceAdded, "failed to setup test case").toEqual(ACTION_OK)

    // test
    const instanceDeleted: ActionVoidReturnType = await localAppPersistenceStoreController?.deleteInstances('data', [author1]);
    // // expect(instanceDeleted, "failed to setup test case").toEqual(ACTION_OK)
    // const rawResult = await localAppPersistenceStoreController.getInstances("data",entityAuthor.uuid);
    // const testResult = ignorePostgresExtraAttributes(rawResult?.instances??[])
    // expect(testResult).toEqual([],);
    await chainVitestSteps(
      "actualTest_getInstancesAndCheckResult",
      {},
      async () => localAppPersistenceStoreController.getInstances("data",entityAuthor.uuid),
      (a) => ignorePostgresExtraAttributesOnList((a as any).returnedDomainElement.elementValue.instances),
      undefined, // name to give to result
      "entityInstanceCollection",
      []
    )
  });

  // ################################################################################################
  it("delete Author Instance fails", async () => {
    // test
    const instanceDeleted: ActionVoidReturnType = await localAppPersistenceStoreController?.deleteInstances("data", [
      author1,
    ]);
    expect(instanceDeleted.status, "failed to delete Author instances").toEqual("error");

    const instanceDeletedError = instanceDeleted as ActionError;
    console.log("instanceDeletedError", instanceDeletedError)
    expect(
      { errorType: instanceDeletedError.error.errorType, errorMessage: instanceDeletedError.error.errorMessage },
      "failed to delete Author"
    ).toEqual({
      errorType: "FailedToDeleteInstance",
      errorMessage: "could not find entity d7a144ff-d1b9-4135-800c-a7cfc1f38733",
    });
  });

});
