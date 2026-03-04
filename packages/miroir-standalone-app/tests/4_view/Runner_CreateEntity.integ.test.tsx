/**
 * Runner_CreateEntity.integ.test.tsx
 */
import "@testing-library/jest-dom";
import { v4 as uuidv4 } from "uuid";
import { beforeEach, describe, expect, it } from "vitest";

import crossFetch from "cross-fetch";
import {
  type ApplicationDeploymentMap,
  type Deployment,
  type DomainControllerInterface,
  type EndpointDefinition,
  type Entity,
  type EntityDefinition,
  type JzodElement,
  type LocalCacheInterface,
  type LoggerInterface,
  type LoggerOptions,
  type MiroirContextInterface,
  type MiroirModelEnvironment,
  type MlSchema,
  type PersistenceStoreControllerManagerInterface,
  type StoreUnitConfiguration,
  type TestCompositeActionParams,
  ConfigurationService,
  createDeploymentCompositeAction,
  defaultMiroirMetaModel,
  defaultMiroirModelEnvironment,
  defaultSelfApplicationDeploymentMap,
  displayTestSuiteResultsDetails,
  emptyApplicationModel,
  entityEntity,
  formatYYYYMMDD_HHMMSS,
  MiroirActivityTracker,
  miroirCoreStartup,
  MiroirEventService,
  miroirFundamentalJzodSchema,
  MiroirLoggerFactory,
  resetAndInitApplicationDeployment,
  resetAndinitializeDeploymentCompositeAction,
  selfApplicationDeploymentMiroir,
  selfApplicationMiroir
} from "miroir-core";
import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";
import { miroirIndexedDbStoreSectionStartup } from "miroir-store-indexedDb";
import { miroirMongoDbStoreSectionStartup } from "miroir-store-mongodb";
import { miroirPostgresStoreSectionStartup } from "miroir-store-postgres";
import {
  adminApplication_Miroir,
  deployment_Admin,
  deployment_Miroir,
} from "miroir-test-app_deployment-admin";
import {
  deployment_Library_DO_NO_USE,
  endpointDocument,
  entityAuthor,
  entityDefinitionAuthor,
  entityPublisher,
  getDefaultLibraryModelEnvironmentDEFUNCT,
  selfApplicationModelBranchLibraryMasterBranch,
  selfApplicationVersionLibraryInitialVersion
} from "miroir-test-app_deployment-library";
import { env } from "process";
import { loglevelnext } from "../../src/loglevelnextImporter";
import { runTestOrTestSuite, setupMiroirTest } from "../../src/miroir-fwk/4-tests/tests-utils";
import {
  testUtils_deleteApplicationDeployment,
  testUtils_resetApplicationDeployment,
} from "../../src/miroir-fwk/4-tests/tests-utils-testOnLibrary";
import { miroirAppStartup } from "../../src/startup";
import { loadTestConfigFiles } from "../utils/fileTools";

// ################################################################################################
const pageLabel = "Runner_CreateEntity.integ.test";

let miroirConfig: any;
let loggerOptions: LoggerOptions;

const myConsoleLog = (...args: any[]) => console.log(pageLabel, ...args);
let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName("tests", "5-tests", pageLabel)
).then((logger: LoggerInterface) => {
  log = logger;
});

miroirAppStartup();
miroirCoreStartup();
miroirFileSystemStoreSectionStartup(ConfigurationService.configurationService);
miroirIndexedDbStoreSectionStartup(ConfigurationService.configurationService);
miroirMongoDbStoreSectionStartup(ConfigurationService.configurationService);
miroirPostgresStoreSectionStartup(ConfigurationService.configurationService);
ConfigurationService.configurationService.registerTestImplementation({ expect: expect as any });

const { miroirConfig: miroirConfigParam, logConfig } = await loadTestConfigFiles(env);
miroirConfig = miroirConfigParam;
loggerOptions = logConfig;
myConsoleLog("received miroirConfig", JSON.stringify(miroirConfig, null, 2));
myConsoleLog("received miroirConfig.client", JSON.stringify(miroirConfig.client, null, 2));
myConsoleLog("received loggerOptions", JSON.stringify(loggerOptions, null, 2));
const miroirActivityTracker = new MiroirActivityTracker();
const miroirEventService = new MiroirEventService(miroirActivityTracker);
MiroirLoggerFactory.startRegisteredLoggers(
  miroirActivityTracker,
  miroirEventService,
  loglevelnext,
  loggerOptions
);
myConsoleLog("started registered loggers DONE");


const globalTimeOut = 30000;
// const globalTimeOut = 10^9;
const columnForTestDefinition: JzodElement = {
  type: "number",
  optional: true,
  tag: { value: { id: 6, defaultLabel: "Gender (narrow-minded)"} },
};

// const testApplicationUuid = selfApplicationLibrary.uuid;
const testApplicationUuid = uuidv4();
// const testApplicationDeploymentUuid = deployment_Library_DO_NO_USE.uuid;
const testApplicationDeploymentUuid = uuidv4();
const testApplicationName = "testApplication_" + formatYYYYMMDD_HHMMSS(new Date());

// const deployment_Miroir: Deployment = {
//   uuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
//   parentName: "Deployment",
//   parentUuid: "7959d814-400c-4e80-988f-a00fe582ab98",
//   name: "DefaultMiroirApplicationDeployment",
//   defaultLabel:
//     "Miroir SelfApplication Deployment Configuration declaring Miroir SelfApplication Deployment in Admin schema. Run-time-only / DEFUNCT?",
//   selfApplication: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
//   description: "The default Deployment for SelfApplication Miroir",
//   configuration: {
//     admin: {
//       emulatedServerType: "filesystem",
//       directory: "../miroir-core/src/assets/admin",
//     },
//     model: {
//       emulatedServerType: "filesystem",
//       directory: "../miroir-test-app_deployment-miroir/assets/miroir_model",
//     },
//     data: {
//       emulatedServerType: "filesystem",
//       directory: "../miroir-test-app_deployment-miroir/assets/miroir_data",
//     },
//   },
// };

const deployment_testApplication: Deployment = {
  uuid: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
  parentName: "Deployment",
  parentUuid: "35c5608a-7678-4f07-a4ec-76fc5bc35424",
  name: testApplicationName + "_Deployment",
  defaultLabel: testApplicationName + "_Deployment",
  selfApplication: "5af03c98-fe5e-490b-b08f-e1230971c57f",
  description: "The default sql Deployment for " + testApplicationName,
  configuration: {
    admin: {
      emulatedServerType: "sql",
      connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
      schema: "miroirAdmin",
    },
    model: {
      emulatedServerType: "sql",
      connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
      schema: testApplicationName,
    },
    data: {
      emulatedServerType: "sql",
      connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
      schema: testApplicationName,
    },
  },
};


const applicationDeploymentMap: ApplicationDeploymentMap = {
  ...defaultSelfApplicationDeploymentMap,
  // [selfApplicationLibrary.uuid]: deployment_Library_DO_NO_USE.uuid,
  [testApplicationUuid]: testApplicationDeploymentUuid,
}

const miroirDeploymentStorageConfiguration: StoreUnitConfiguration = miroirConfig.client.emulateServer
  ? miroirConfig.client.deploymentStorageConfig[deployment_Miroir.uuid]
  : miroirConfig.client.serverConfig.storeSectionConfiguration[deployment_Miroir.uuid];

const adminDeploymentStorageConfiguration: StoreUnitConfiguration = miroirConfig.client.emulateServer
  ? miroirConfig.client.deploymentStorageConfig[deployment_Admin.uuid]
  : miroirConfig.client.serverConfig.storeSectionConfiguration[deployment_Admin.uuid];

  
const adminDeployment: Deployment = {
  ...deployment_Admin,
  configuration: adminDeploymentStorageConfiguration,
};


const libraryDeploymentStorageConfiguration: StoreUnitConfiguration = miroirConfig.client.emulateServer
  ? miroirConfig.client.deploymentStorageConfig[deployment_Library_DO_NO_USE.uuid]
  : miroirConfig.client.serverConfig.storeSectionConfiguration[deployment_Library_DO_NO_USE.uuid];

let testDeploymentStorageConfiguration: StoreUnitConfiguration;
switch (libraryDeploymentStorageConfiguration.model.emulatedServerType) {
  case "indexedDb": {
    testDeploymentStorageConfiguration = {
      admin: libraryDeploymentStorageConfiguration.admin,
      model: {
        emulatedServerType: "indexedDb",
        indexedDbName: testApplicationName,
      },
      data: {
        emulatedServerType: "indexedDb",
        indexedDbName: testApplicationName,
      },
    };
    break;
  }
  case "filesystem": {
    testDeploymentStorageConfiguration = {
      admin: libraryDeploymentStorageConfiguration.admin,
      model: {
        emulatedServerType: "filesystem",
        directory: "./test_data/" + testApplicationName,
      },
      data: {
        emulatedServerType: "filesystem",
        directory: "./test_data/" + testApplicationName,
      },
    };
    break;
  }
  case "sql": {
    testDeploymentStorageConfiguration = {
      admin: libraryDeploymentStorageConfiguration.admin,
      model: {
        emulatedServerType: "sql",
        connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
        schema: testApplicationName,
      },
      data: {
        emulatedServerType: "sql",
        connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
        schema: testApplicationName,
      },
    };
    break;
  }
  case "mongodb": {
    testDeploymentStorageConfiguration = {
      admin: libraryDeploymentStorageConfiguration.admin,
      model: {
        emulatedServerType: "mongodb",
        connectionString: "mongodb://localhost:27017",
        database: testApplicationName,
      },
      data: {
        emulatedServerType: "mongodb",
        connectionString: "mongodb://localhost:27017",
        database: testApplicationName,
      },
    };
  }
}

const internalMiroirConfig = {
  ...miroirConfig,
  client: {
    ...miroirConfig.client,
    ...(
      miroirConfig.client.emulateServer?
      {
        deploymentStorageConfig: {
          ...miroirConfig.client.deploymentStorageConfig,
          [testApplicationDeploymentUuid]: testDeploymentStorageConfiguration,
        }
      }
      : {}
    ),
    ...(
      !miroirConfig.client.emulateServer?
      {
        serverConfig: {
          ...miroirConfig.client.serverConfig,
          storeSectionConfiguration: {
            ...miroirConfig.client.serverConfig.storeSectionConfiguration,
            [testApplicationDeploymentUuid]: testDeploymentStorageConfiguration,
          }
        }
      }:{}
    )
  }
}
// const testDeploymentStorageConfiguration = miroirConfig.client.emulateServer
//   ? miroirConfig.client.deploymentStorageConfig[testApplicationDeploymentUuid]
//   : miroirConfig.client.serverConfig.storeSectionConfiguration[testApplicationDeploymentUuid];

let domainController: DomainControllerInterface;
let localCache: LocalCacheInterface;
let miroirContext: MiroirContextInterface;
let persistenceStoreControllerManager: PersistenceStoreControllerManagerInterface;

beforeAll(async () => {
  // Establish requests interception layer before all tests.
  console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ beforeAll");
  const {
    persistenceStoreControllerManagerForClient: localpersistenceStoreControllerManager,
    domainController: localdomainController,
    localCache: locallocalCache,
    miroirContext: localmiroirContext,
  } = await setupMiroirTest(miroirConfig, miroirActivityTracker, miroirEventService, crossFetch);

  persistenceStoreControllerManager = localpersistenceStoreControllerManager;
  domainController = localdomainController;
  localCache = locallocalCache;
  miroirContext = localmiroirContext;

  // create the Miroir app deployment containing the meta-model
  const createMiroirDeploymentCompositeAction = createDeploymentCompositeAction(
    "miroir",
    deployment_Miroir.uuid,
    adminApplication_Miroir.uuid,
    adminDeployment,
    miroirDeploymentStorageConfiguration,
  );
  const createDeploymentResult = await domainController.handleCompositeAction(
    createMiroirDeploymentCompositeAction,
    applicationDeploymentMap,
    defaultMiroirModelEnvironment,
    {},
  );
  if (createDeploymentResult.status !== "ok") {
    log.error(
      "Failed to create Miroir deployment, createMiroirDeploymentCompositeAction:",
      JSON.stringify(createMiroirDeploymentCompositeAction, null, 2)
    );
    throw new Error("Failed to create Miroir deployment: " + JSON.stringify(createDeploymentResult));
  }
  console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ beforeAll DONE");

  return Promise.resolve();
});

// executed only once like beforeAll, since there is only 1 test suite
beforeEach(async () => {
  await resetAndInitApplicationDeployment(domainController, applicationDeploymentMap, [
    selfApplicationDeploymentMiroir as Deployment,
  ]);
  document.body.innerHTML = "";
});

afterAll(async () => {
  // await deleteAndCloseApplicationDeployments(miroirConfig, domainController, defaultSelfApplicationDeploymentMap, adminApplicationDeploymentConfigurations);
  displayTestSuiteResultsDetails(
    Object.keys(testActions)[0],
    [],
    miroirActivityTracker
  );
  return Promise.resolve();
});

const testApplicationModelEnvironment: MiroirModelEnvironment = {
  miroirFundamentalJzodSchema: miroirFundamentalJzodSchema as MlSchema,
  miroirMetaModel: defaultMiroirMetaModel,
  endpointsByUuid: {[endpointDocument.uuid]: endpointDocument},
  deploymentUuid: testApplicationDeploymentUuid,
  currentModel: emptyApplicationModel,
}
// const testApplicationModelEnvironment = getDefaultLibraryModelEnvironmentDEFUNCT(
//   miroirFundamentalJzodSchema as MlSchema,
//   defaultMiroirMetaModel,
//   endpointDocument as EndpointDefinition,
//   testApplicationDeploymentUuid,
// );

const testActions: Record<string, TestCompositeActionParams> = {
  [pageLabel]: {
    testActionType: "testCompositeActionSuite",
    testActionLabel: pageLabel,
    application: testApplicationUuid,
    testCompositeAction: {
      testType: "testCompositeActionSuite",
      testLabel: pageLabel,
      beforeAll: createDeploymentCompositeAction(
        testApplicationName,
        testApplicationDeploymentUuid,
        testApplicationUuid,
        adminDeployment,
        testDeploymentStorageConfiguration,
      ),
      beforeEach: resetAndinitializeDeploymentCompositeAction(
        testApplicationUuid,
        testApplicationDeploymentUuid,
        {
          dataStoreType: "app", // TODO: comparison between deployment and selfAdminConfigurationDeployment
          metaModel: defaultMiroirMetaModel,
          // selfApplication: selfApplicationLibrary,
          selfApplication: {
            uuid: "5af03c98-fe5e-490b-b08f-e1230971c57f",
            parentName: "SelfApplication",
            parentUuid: "a659d350-dd97-4da9-91de-524fa01745dc",
            name: testApplicationName,
            defaultLabel: `The ${testApplicationName} selfApplication.`,
            description: `The model and data of the ${testApplicationName} selfApplication.`,
            homePageUrl:
              `/report/${testApplicationUuid}/${testApplicationDeploymentUuid}/data/9c0cdb97-9537-4ee2-8053-a6ece3e0afe8/xxxxx`,
          },
          // deployment: selfApplicationDeploymentLibrary,
          applicationModelBranch: selfApplicationModelBranchLibraryMasterBranch,
          // applicationStoreBasedConfiguration: selfApplicationStoreBasedConfigurationLibrary,
          applicationVersion: selfApplicationVersionLibraryInitialVersion,
        },
        [
          // {
          //   entity: entityPublisher as MetaEntity,
          //   entityDefinition: entityDefinitionPublisher as EntityDefinition,
          //   instances: [
          //     publisher1 as EntityInstance,
          //     publisher2 as EntityInstance,
          //     publisher3 as EntityInstance,
          //   ],
          // },
        ],
        testApplicationModelEnvironment.currentModel as any,
        [entityPublisher.uuid],
      ),
      afterEach: testUtils_resetApplicationDeployment(testApplicationDeploymentUuid),
      afterAll: testUtils_deleteApplicationDeployment(
        // miroirConfig,
        internalMiroirConfig,
        testApplicationUuid,
        testApplicationDeploymentUuid,
      ),
      testCompositeActions: {
        // "Refresh all Instances": {
        //   testType: "testCompositeAction",
        //   testLabel: "Refresh all Instances",
        //   compositeActionSequence: {
        //     actionType: "compositeActionSequence",
        //     actionLabel: "testLibraryBooks",
        //     endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
        //     payload: {
        //       actionSequence: [
        //         {
        //           actionType: "rollback",
        //           // actionType: "modelAction",
        //           actionLabel: "refreshMiroirLocalCache",
        //           endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        //           payload: {
        //             application: selfApplicationMiroir.uuid,
        //             },
        //         },
        //         {
        //           actionType: "rollback",
        //           // actionType: "modelAction",
        //           actionLabel: "refreshLibraryLocalCache",
        //           endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        //           payload: {
        //             application: testApplicationUuid,
        //             // deploymentUuid: testApplicationDeploymentUuid,
        //           },
        //         },
        //         {
        //           actionType: "compositeRunBoxedQueryAction",
        //           endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
        //           actionLabel: "calculateNewEntityDefinionAndReports",
        //           nameGivenToResult: "libraryEntityList",
        //           payload: {
        //             actionType: "runBoxedQueryAction",
        //             endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
        //             payload: {
        //               application: testApplicationUuid,
        //               applicationSection: "model", // TODO: give only selfApplication section in individual queries?
        //               query: {
        //                 queryType: "boxedQueryWithExtractorCombinerTransformer",
        //                 application: testApplicationUuid,
        //                 pageParams: {
        //                   currentDeploymentUuid: testApplicationDeploymentUuid,
        //                 },
        //                 queryParams: {},
        //                 contextResults: {},
        //                 extractors: {
        //                   entities: {
        //                     extractorOrCombinerType: "extractorByEntityReturningObjectList",
        //                     applicationSection: "model",
        //                     parentName: entityEntity.name,
        //                     parentUuid: entityEntity.uuid,
        //                     orderBy: {
        //                       attributeName: "name",
        //                       direction: "ASC",
        //                     },
        //                   },
        //                 },
        //               },
        //             },
        //           },
        //         },
        //       ],
        //     },
        //   },
        //   testCompositeActionAssertions: [
        //     // TODO: test length of entityBookList.books!
        //     {
        //       actionType: "compositeRunTestAssertion",
        //       actionLabel: "checkNumberOfEntitiesInLibraryApplicationDeployment",
        //       nameGivenToResult: "checkNumberOfEntities",
        //       testAssertion: {
        //         testType: "testAssertion",
        //         testLabel: "checkNumberOfEntitiesInLibraryApplicationDeployment",
        //         definition: {
        //           resultAccessPath: ["0"],
        //           resultTransformer: {
        //             transformerType: "aggregate",
        //             interpolation: "runtime",
        //             applyTo: {
        //               transformerType: "getFromContext",
        //               interpolation: "runtime",
        //               referencePath: ["libraryEntityList", "entities"],
        //             },
        //           },
        //           expectedValue: { aggregate: 1 },
        //         },
        //       },
        //     },
        //   ],
        // },
        "Add Entity Author and Commit": {
          testType: "testCompositeAction",
          testLabel: "Add Entity Author and Commit",
          compositeActionSequence: {
            actionType: "compositeActionSequence",
            actionLabel: "AddBookInstanceThenRollback",
            endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
            payload: {
              actionSequence: [
                {
                  actionType: "rollback",
                  actionLabel: "refreshMiroirLocalCache",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
                    application: selfApplicationMiroir.uuid,
                  },
                },
                {
                  actionType: "rollback",
                  actionLabel: "refreshLibraryLocalCache",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
                    application: testApplicationUuid,
                  },
                },
                {
                  actionType: "createEntity",
                  actionLabel: "addEntityAuthor",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
                    application: testApplicationUuid,
                    entities: [
                      {
                        entity: entityAuthor as Entity,
                        entityDefinition: entityDefinitionAuthor as EntityDefinition,
                      },
                    ],
                  },
                },
                {
                  actionType: "commit",
                  actionLabel: "commitLibraryLocalCache",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
                    application: testApplicationUuid,
                  },
                },
                {
                  // performs query on local cache for emulated server, and on server for remote server
                  actionType: "compositeRunBoxedQueryAction",
                  endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
                  actionLabel: "calculateNewEntityDefinionAndReports",
                  nameGivenToResult: "libraryEntityList",
                  payload: {
                    actionType: "runBoxedQueryAction",
                    endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                    payload: {
                      application: testApplicationUuid,
                      applicationSection: "model", // TODO: give only selfApplication section in individual queries?
                      query: {
                        queryType: "boxedQueryWithExtractorCombinerTransformer",
                        application: testApplicationUuid,
                        pageParams: {
                          currentDeploymentUuid: testApplicationDeploymentUuid,
                        },
                        queryParams: {},
                        contextResults: {},
                        extractors: {
                          entities: {
                            extractorOrCombinerType: "extractorByEntityReturningObjectList",
                            applicationSection: "model",
                            parentName: entityEntity.name,
                            parentUuid: entityEntity.uuid,
                            orderBy: {
                              attributeName: "name",
                              direction: "ASC",
                            },
                          },
                        },
                      },
                    },
                  },
                },
              ],
            },
          },
          testCompositeActionAssertions: [
            // TODO: test length of entityBookList.books!
            {
              actionType: "compositeRunTestAssertion",
              actionLabel: "checkNumberOfEntities",
              nameGivenToResult: "checkNumberOfEntities",
              testAssertion: {
                testType: "testAssertion",
                testLabel: "checkNumberOfEntities",
                definition: {
                  resultAccessPath: ["0"],
                  resultTransformer: {
                    transformerType: "aggregate",
                    interpolation: "runtime",
                    applyTo: {
                      transformerType: "getFromContext",
                      interpolation: "runtime",
                      referencePath: ["libraryEntityList", "entities"],
                    },
                  },
                  expectedValue: { aggregate: 1 },
                },
              },
            },
            // {
            //   actionType: "compositeRunTestAssertion",
            //   actionLabel: "checkEntityBooks",
            //   nameGivenToResult: "checkEntityList",
            //   testAssertion: {
            //     testType: "testAssertion",
            //     testLabel: "checkEntityBooks",
            //     definition: {
            //       resultAccessPath: ["libraryEntityList", "entities"],
            //       ignoreAttributes: ["author", "storageAccess"],
            //       expectedValue: [],
            //     },
            //   },
            // },
          ],
        },
        // "Add Entity Author then rollback": {
        //   testType: "testCompositeAction",
        //   testLabel: "Add Entity Author then rollback",
        //   compositeActionSequence: {
        //     actionType: "compositeActionSequence",
        //     actionLabel: "AddBookInstanceThenRollback",
        //     endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
        //     payload: {
        //       actionSequence: [
        //         {
        //           actionType: "rollback",
        //           // actionType: "modelAction",
        //           actionLabel: "refreshMiroirLocalCache",
        //           endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        //           payload: {

        //             application: selfApplicationMiroir.uuid,
        //             },
        //         },
        //         {
        //           actionType: "rollback",
        //           // actionType: "modelAction",
        //           actionLabel: "refreshLibraryLocalCache",
        //           endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        //           payload: {
        //             application: testApplicationUuid,
        //             // deploymentUuid: testApplicationDeploymentUuid,
        //           },
        //         },
        //         {
        //           // actionType: "modelAction",
        //           actionType: "createEntity",
        //           actionLabel: "addEntityAuthor",
        //           endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        //           payload: {
        //             application: testApplicationUuid,
        //             // deploymentUuid: testApplicationDeploymentUuid,
        //             entities: [
        //               {
        //                 entity: entityAuthor as Entity,
        //                 entityDefinition: entityDefinitionAuthor as EntityDefinition,
        //               },
        //             ],
        //           },
        //         },
        //         {
        //           actionType: "rollback",
        //           // actionType: "modelAction",
        //           actionLabel: "refreshLibraryLocalCache2",
        //           endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        //           payload: {
        //             application: testApplicationUuid,
        //             // deploymentUuid: testApplicationDeploymentUuid,
        //           },
        //         },
        //         {
        //           actionType: "compositeRunBoxedQueryAction",
        //           endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
        //           actionLabel: "calculateNewEntityDefinionAndReports",
        //           nameGivenToResult: "libraryEntityList",
        //           payload: {
        //             actionType: "runBoxedQueryAction",
        //             endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
        //             payload: {
        //               application: testApplicationUuid,
        //               // deploymentUuid: testApplicationDeploymentUuid,
        //               applicationSection: "model", // TODO: give only selfApplication section in individual queries?
        //               query: {
        //                 queryType: "boxedQueryWithExtractorCombinerTransformer",
        //                 application: testApplicationUuid,
        //                 // applicationDeploymentMap: defaultSelfApplicationDeploymentMap,
        //                 // deploymentUuid: testApplicationDeploymentUuid,
        //                 pageParams: {
        //                   currentDeploymentUuid: testApplicationDeploymentUuid,
        //                 },
        //                 queryParams: {},
        //                 contextResults: {},
        //                 extractors: {
        //                   entities: {
        //                     extractorOrCombinerType: "extractorByEntityReturningObjectList",
        //                     applicationSection: "model",
        //                     parentName: entityEntity.name,
        //                     parentUuid: entityEntity.uuid,
        //                     orderBy: {
        //                       attributeName: "name",
        //                       direction: "ASC",
        //                     },
        //                   },
        //                 },
        //               },
        //             },
        //           },
        //         },
        //       ],
        //     },
        //   },
        //   testCompositeActionAssertions: [
        //     // TODO: test length of entityBookList.books!
        //     {
        //       actionType: "compositeRunTestAssertion",
        //       actionLabel: "checkNumberOfBooks",
        //       nameGivenToResult: "checkNumberOfEntities",
        //       testAssertion: {
        //         testType: "testAssertion",
        //         testLabel: "checkNumberOfBooks",
        //         definition: {
        //           resultAccessPath: ["0"],
        //           resultTransformer: {
        //             transformerType: "aggregate",
        //             interpolation: "runtime",
        //             applyTo: {
        //               transformerType: "getFromContext",
        //               interpolation: "runtime",
        //               referencePath: ["libraryEntityList", "entities"],
        //             },
        //           },
        //           expectedValue: { aggregate: 1 },
        //         },
        //       },
        //     },
        //   ],
        // },
        // "Add Entity Author then test before commit or rollback": {
        //   testType: "testCompositeAction",
        //   testLabel: "Add Entity Author then test before commit or rollback",
        //   compositeActionSequence: {
        //     actionType: "compositeActionSequence",
        //     actionLabel: "AddBookInstanceThenRollback",
        //     endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
        //     payload: {
        //       actionSequence: [
        //         {
        //           actionType: "rollback",
        //           // actionType: "modelAction",
        //           actionLabel: "refreshMiroirLocalCache",
        //           endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        //           payload: {
        //             application: selfApplicationMiroir.uuid,
        //             },
        //         },
        //         {
        //           actionType: "rollback",
        //           // actionType: "modelAction",
        //           actionLabel: "refreshLibraryLocalCache",
        //           endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        //           payload: {
        //             application: testApplicationUuid,
        //             // deploymentUuid: testApplicationDeploymentUuid,
        //           },
        //         },
        //         {
        //           // actionType: "modelAction",
        //           actionType: "createEntity",
        //           actionLabel: "addEntityAuthor",
        //           endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        //           payload: {
        //             // deploymentUuid: testApplicationDeploymentUuid,
        //             application: testApplicationUuid,
        //             entities: [
        //               {
        //                 entity: entityAuthor as Entity,
        //                 entityDefinition: entityDefinitionAuthor as EntityDefinition,
        //               },
        //             ],
        //           },
        //         },
        //         {
        //           actionType: "compositeRunBoxedQueryAction",
        //           endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
        //           actionLabel: "calculateNewEntityDefinionAndReportsFromLocalCache",
        //           nameGivenToResult: "libraryEntityListFromLocalCache",
        //           payload: {
        //             actionType: "runBoxedQueryAction",
        //             endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
        //             payload: {
        //               application: testApplicationUuid,
        //               // deploymentUuid: testApplicationDeploymentUuid,
        //               applicationSection: "model", // TODO: give only selfApplication section in individual queries?
        //               queryExecutionStrategy: "localCacheOrFail",
        //               query: {
        //                 queryType: "boxedQueryWithExtractorCombinerTransformer",
        //                 application: testApplicationUuid,
        //                 // applicationDeploymentMap: defaultSelfApplicationDeploymentMap,
        //                 // deploymentUuid: testApplicationDeploymentUuid,
        //                 pageParams: {
        //                   currentDeploymentUuid: testApplicationDeploymentUuid,
        //                 },
        //                 queryParams: {},
        //                 contextResults: {},
        //                 extractors: {
        //                   entities: {
        //                     extractorOrCombinerType: "extractorByEntityReturningObjectList",
        //                     applicationSection: "model",
        //                     parentName: entityEntity.name,
        //                     parentUuid: entityEntity.uuid,
        //                     orderBy: {
        //                       attributeName: "name",
        //                       direction: "ASC",
        //                     },
        //                   },
        //                 },
        //               },
        //             },
        //           },
        //         },
        //         {
        //           actionType: "compositeRunBoxedQueryAction",
        //           endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
        //           actionLabel: "calculateNewEntityDefinionAndReportsFromPersistentStore",
        //           nameGivenToResult: "libraryEntityListFromPersistentStore",
        //           payload: {
        //             actionType: "runBoxedQueryAction",
        //             endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
        //             payload: {
        //               // deploymentUuid: deployment_Library_DO_NO_USE.uuid,
        //               application: testApplicationUuid,
        //               queryExecutionStrategy: "storage",
        //               applicationSection: "model", // TODO: give only selfApplication section in individual queries?
        //               query: {
        //                 queryType: "boxedQueryWithExtractorCombinerTransformer",
        //                 application: testApplicationUuid,
        //                 // applicationDeploymentMap: defaultSelfApplicationDeploymentMap,
        //                 // deploymentUuid: testApplicationDeploymentUuid,
        //                 pageParams: {
        //                   currentDeploymentUuid: testApplicationDeploymentUuid,
        //                 },
        //                 queryParams: {},
        //                 contextResults: {},
        //                 extractors: {
        //                   entities: {
        //                     extractorOrCombinerType: "extractorByEntityReturningObjectList",
        //                     applicationSection: "model",
        //                     parentName: entityEntity.name,
        //                     parentUuid: entityEntity.uuid,
        //                     orderBy: {
        //                       attributeName: "name",
        //                       direction: "ASC",
        //                     },
        //                   },
        //                 },
        //               },
        //             },
        //           },
        //         },
        //       ],
        //     },
        //   },
        //   testCompositeActionAssertions: [
        //     // TODO: test length of entityBookList.books!
        //     {
        //       actionType: "compositeRunTestAssertion",
        //       actionLabel: "checkNumberOfEntitiesFromLocalCache",
        //       nameGivenToResult: "checkNumberOfEntitiesFromLocalCache",
        //       testAssertion: {
        //         testType: "testAssertion",
        //         testLabel: "checkNumberOfEntitiesFromLocalCache",
        //         definition: {
        //           resultAccessPath: ["0"],
        //           resultTransformer: {
        //             transformerType: "aggregate",
        //             interpolation: "runtime",
        //             applyTo: {
        //               transformerType: "getFromContext",
        //               interpolation: "runtime",
        //               referencePath: ["libraryEntityListFromLocalCache", "entities"],
        //             },
        //           },
        //           expectedValue: { aggregate: 2 },
        //         },
        //       },
        //     },
        //     {
        //       actionType: "compositeRunTestAssertion",
        //       actionLabel: "checkEntitiesAreAuthorAndPublisher",
        //       nameGivenToResult: "checkEntityListFromLocalCache",
        //       testAssertion: {
        //         testType: "testAssertion",
        //         testLabel: "checkEntitiesAreAuthorAndPublisher",
        //         definition: {
        //           resultAccessPath: ["libraryEntityListFromLocalCache", "entities"],
        //           ignoreAttributes: ["author", "storageAccess"],
        //           expectedValue: [entityAuthor, entityPublisher],
        //         },
        //       },
        //     },
        //     {
        //       actionType: "compositeRunTestAssertion",
        //       actionLabel: "checkNumberOfEntitiesFromPersistentStore",
        //       nameGivenToResult: "checkNumberOfEntitiesFromPersistentStore",
        //       testAssertion: {
        //         testType: "testAssertion",
        //         testLabel: "checkNumberOfEntitiesFromPersistentStore",
        //         definition: {
        //           resultAccessPath: ["0"],
        //           resultTransformer: {
        //             transformerType: "aggregate",
        //             interpolation: "runtime",
        //             applyTo: {
        //               transformerType: "getFromContext",
        //               interpolation: "runtime",
        //               referencePath: ["libraryEntityListFromPersistentStore", "entities"],
        //             },
        //           },
        //           expectedValue: { aggregate: 1 },
        //         },
        //       },
        //     },
        //     {
        //       actionType: "compositeRunTestAssertion",
        //       actionLabel: "checkEntityFromPersistentStore",
        //       nameGivenToResult: "checkEntityListFromPersistentStore",
        //       testAssertion: {
        //         testType: "testAssertion",
        //         testLabel: "checkEntityFromPersistentStore",
        //         definition: {
        //           resultAccessPath: ["libraryEntityListFromPersistentStore", "entities"],
        //           ignoreAttributes: ["author", "storageAccess"],
        //           expectedValue: [entityPublisher],
        //         },
        //       },
        //     },
        //   ],
        // },
        // "Drop Entity Publisher and Commit": {
        //   testType: "testCompositeAction",
        //   testLabel: "Drop Entity Publisher and Commit",
        //   compositeActionSequence: {
        //     actionType: "compositeActionSequence",
        //     actionLabel: "AddBookInstanceThenRollback",
        //     endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
        //     payload: {
        //       actionSequence: [
        //         {
        //           actionType: "rollback",
        //           actionLabel: "refreshMiroirLocalCache",
        //           endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        //           payload: {

        //             application: selfApplicationMiroir.uuid,
        //             },
        //         },
        //         {
        //           actionType: "rollback",
        //           // actionType: "modelAction",
        //           actionLabel: "refreshLibraryLocalCache",
        //           endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        //           payload: {
        //             application: testApplicationUuid,
        //             // deploymentUuid: testApplicationDeploymentUuid,
        //           },
        //         },
        //         {
        //           // actionType: "modelAction",
        //           actionType: "dropEntity",
        //           actionLabel: "dropEntityPublisher",
        //           endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        //           payload: {
        //             application: testApplicationUuid,
        //             // deploymentUuid: testApplicationDeploymentUuid,
        //             entityUuid: entityPublisher.uuid,
        //             entityDefinitionUuid: entityDefinitionPublisher.uuid,
        //           },
        //         },
        //         {
        //           actionType: "commit",
        //           // actionType: "modelAction",
        //           actionLabel: "commitLibraryLocalCache",
        //           endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        //           payload: {
        //             application: testApplicationUuid,
        //             // deploymentUuid: testApplicationDeploymentUuid,
        //           },
        //         },
        //         {
        //           // performs query on local cache for emulated server, and on server for remote server
        //           actionType: "compositeRunBoxedQueryAction",
        //           endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
        //           actionLabel: "calculateNewEntityDefinionAndReports",
        //           nameGivenToResult: "libraryEntityList",
        //           payload: {
        //             actionType: "runBoxedQueryAction",
        //             endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
        //             payload: {
        //               // deploymentUuid: testApplicationDeploymentUuid,
        //               application: testApplicationUuid,
        //               applicationSection: "model", // TODO: give only selfApplication section in individual queries?
        //               // queryExecutionStrategy: "storage",
        //               query: {
        //                 queryType: "boxedQueryWithExtractorCombinerTransformer",
        //                 application: testApplicationUuid,
        //                 // applicationDeploymentMap: defaultSelfApplicationDeploymentMap,
        //                 // deploymentUuid: testApplicationDeploymentUuid,
        //                 pageParams: {
        //                   currentDeploymentUuid: testApplicationDeploymentUuid,
        //                 },
        //                 queryParams: {},
        //                 contextResults: {},
        //                 extractors: {
        //                   entities: {
        //                     extractorOrCombinerType: "extractorByEntityReturningObjectList",
        //                     applicationSection: "model",
        //                     parentName: entityEntity.name,
        //                     parentUuid: entityEntity.uuid,
        //                     orderBy: {
        //                       attributeName: "name",
        //                       direction: "ASC",
        //                     },
        //                   },
        //                 },
        //               },
        //             },
        //           },
        //         },
        //       ],
        //     },
        //   },
        //   testCompositeActionAssertions: [
        //     // TODO: test length of entityBookList.books!
        //     {
        //       actionType: "compositeRunTestAssertion",
        //       actionLabel: "checkNumberOfEntities",
        //       nameGivenToResult: "checkNumberOfEntities",
        //       testAssertion: {
        //         testType: "testAssertion",
        //         testLabel: "checkNumberOfEntities",
        //         definition: {
        //           resultAccessPath: ["0"],
        //           resultTransformer: {
        //             transformerType: "aggregate",
        //             interpolation: "runtime",
        //             applyTo: {
        //               transformerType: "getFromContext",
        //               interpolation: "runtime",
        //               referencePath: ["libraryEntityList", "entities"],
        //             },
        //           },
        //           expectedValue: { aggregate: 0 },
        //         },
        //       },
        //     },
        //     // {
        //     //   actionType: "compositeRunTestAssertion",
        //     //   actionLabel: "checkEntityList",
        //     //   nameGivenToResult: "checkEntityList",
        //     //   testAssertion: {
        //     //     testType: "testAssertion",
        //     //     definition: {
        //     //       resultAccessPath: ["libraryEntityList", "entities"],
        //     //       ignoreAttributes: [ ],
        //     //       expectedValue: [
        //     //         entityPublisher
        //     //       ],
        //     //     },
        //     //   },
        //     // },
        //   ],
        // },
        // "Rename Entity Publisher and Commit": {
        //   // TODO: this is incorrect!
        //   // there should be an "icon" attribute in the entityDefinitionPublisher
        //   // and a new attribute
        //   testType: "testCompositeAction",
        //   testLabel: "Rename Entity Publisher and Commit",
        //   compositeActionSequence: {
        //     actionType: "compositeActionSequence",
        //     actionLabel: "AddBookInstanceThenRollback",
        //     endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
        //     payload: {
        //       actionSequence: [
        //         {
        //           actionType: "rollback",
        //           actionLabel: "refreshMiroirLocalCache",
        //           endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        //           payload: {

        //             application: selfApplicationMiroir.uuid,
        //             },
        //         },
        //         {
        //           actionType: "rollback",
        //           actionLabel: "refreshLibraryLocalCache",
        //           endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        //           payload: {
        //             application: testApplicationUuid,
        //             // deploymentUuid: testApplicationDeploymentUuid,
        //           },
        //         },
        //         {
        //           actionType: "renameEntity",
        //           actionLabel: "renameEntityPublisher",
        //           endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        //           payload: {
        //             application: testApplicationUuid,
        //             // deploymentUuid: testApplicationDeploymentUuid,
        //             entityUuid: entityPublisher.uuid,
        //             entityDefinitionUuid: entityDefinitionPublisher.uuid,
        //             entityName: "Publisher",
        //             targetValue: "Publishers",
        //           },
        //         },
        //         {
        //           actionType: "commit",
        //           actionLabel: "commitLibraryLocalCache",
        //           endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        //           payload: {
        //             application: testApplicationUuid,
        //             // deploymentUuid: testApplicationDeploymentUuid,
        //           },
        //         },
        //         {
        //           // performs query on local cache for emulated server, and on server for remote server
        //           actionType: "compositeRunBoxedQueryAction",
        //           endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
        //           actionLabel: "calculateNewEntityDefinionAndReports",
        //           nameGivenToResult: "libraryEntityList",
        //           payload: {
        //             actionType: "runBoxedQueryAction",
        //             endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
        //             payload: {
        //               // deploymentUuid: testApplicationDeploymentUuid,
        //               application: testApplicationUuid,
        //               applicationSection: "model", // TODO: give only selfApplication section in individual queries?
        //               queryExecutionStrategy: "storage",
        //               query: {
        //                 queryType: "boxedQueryWithExtractorCombinerTransformer",
        //                 application: testApplicationUuid,
        //                 // applicationDeploymentMap: defaultSelfApplicationDeploymentMap,
        //                 // deploymentUuid: testApplicationDeploymentUuid,
        //                 pageParams: {
        //                   currentDeploymentUuid: testApplicationDeploymentUuid,
        //                 },
        //                 queryParams: {},
        //                 contextResults: {},
        //                 extractors: {
        //                   entities: {
        //                     extractorOrCombinerType: "extractorByEntityReturningObjectList",
        //                     applicationSection: "model",
        //                     parentName: entityEntity.name,
        //                     parentUuid: entityEntity.uuid,
        //                     orderBy: {
        //                       attributeName: "name",
        //                       direction: "ASC",
        //                     },
        //                   },
        //                 },
        //               },
        //             },
        //           },
        //         },
        //       ],
        //     },
        //   },
        //   testCompositeActionAssertions: [
        //     // TODO: test length of entityBookList.books!
        //     {
        //       actionType: "compositeRunTestAssertion",
        //       actionLabel: "checkNumberOfBooks",
        //       nameGivenToResult: "checkNumberOfEntities",
        //       testAssertion: {
        //         testType: "testAssertion",
        //         testLabel: "checkNumberOfBooks",
        //         definition: {
        //           resultAccessPath: ["0"],
        //           resultTransformer: {
        //             transformerType: "aggregate",
        //             interpolation: "runtime",
        //             applyTo: {
        //               transformerType: "getFromContext",
        //               interpolation: "runtime",
        //               referencePath: ["libraryEntityList", "entities"],
        //             },
        //             // referencedTransformer: {
        //             //   transformerType: "getFromContext",
        //             //   interpolation: "runtime",
        //             //   referencePath: ["libraryEntityList", "entities"],
        //             // },
        //           },
        //           expectedValue: { aggregate: 1 },
        //         },
        //       },
        //     },
        //     {
        //       actionType: "compositeRunTestAssertion",
        //       actionLabel: "checkEntityBooks",
        //       nameGivenToResult: "checkEntityList",
        //       testAssertion: {
        //         testType: "testAssertion",
        //         testLabel: "checkEntityBooks",
        //         definition: {
        //           resultAccessPath: ["libraryEntityList", "entities"],
        //           ignoreAttributes: ["author", "storageAccess"],
        //           expectedValue: [{ ...entityPublisher, name: "Publishers" }],
        //         },
        //       },
        //     },
        //   ],
        // },
        // "Alter Entity Publisher and Commit": {
        //   testType: "testCompositeAction",
        //   testLabel: "Alter Entity Publisher and Commit",
        //   compositeActionSequence: {
        //     actionType: "compositeActionSequence",
        //     actionLabel: "AddBookInstanceThenRollback",
        //     endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
        //     payload: {
        //       actionSequence: [
        //         {
        //           actionType: "rollback",
        //           actionLabel: "refreshMiroirLocalCache",
        //           endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        //           payload: {

        //             application: selfApplicationMiroir.uuid,
        //             },
        //         },
        //         {
        //           actionType: "rollback",
        //           // actionType: "modelAction",
        //           actionLabel: "refreshLibraryLocalCache",
        //           endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        //           payload: {
        //             application: testApplicationUuid,
        //             // deploymentUuid: testApplicationDeploymentUuid,
        //           },
        //         },
        //         {
        //           // actionType: "modelAction",
        //           actionType: "alterEntityAttribute",
        //           actionLabel: "alterEntityPublisher",
        //           endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        //           payload: {
        //             // deploymentUuid: testApplicationDeploymentUuid,
        //             application: testApplicationUuid,
        //             entityName: entityPublisher.name,
        //             entityUuid: entityPublisher.uuid,
        //             entityDefinitionUuid: entityDefinitionPublisher.uuid,
        //             addColumns: [
        //               {
        //                 name: "aNewColumnForTest",
        //                 definition: columnForTestDefinition,
        //               },
        //             ],
        //           },
        //         },
        //         {
        //           actionType: "commit",
        //           // actionType: "modelAction",
        //           actionLabel: "commitLibraryLocalCache",
        //           endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        //           payload: {
        //             application: testApplicationUuid,
        //             // deploymentUuid: testApplicationDeploymentUuid,
        //           },
        //         },
        //         {
        //           // performs query on local cache for emulated server, and on server for remote server
        //           actionType: "compositeRunBoxedQueryAction",
        //           endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
        //           actionLabel: "calculateNewEntityDefinionAndReports",
        //           nameGivenToResult: "libraryEntityDefinitionListFromPersistentStore",
        //           payload: {
        //             actionType: "runBoxedQueryAction",
        //             endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
        //             payload: {
        //               // deploymentUuid: deployment_Library_DO_NO_USE.uuid,
        //               application: testApplicationUuid,
        //               applicationSection: "model", // TODO: give only selfApplication section in individual queries?
        //               queryExecutionStrategy: "storage",
        //               query: {
        //                 queryType: "boxedQueryWithExtractorCombinerTransformer",
        //                 application: testApplicationUuid,
        //                 // applicationDeploymentMap: defaultSelfApplicationDeploymentMap,
        //                 // deploymentUuid: testApplicationDeploymentUuid,
        //                 pageParams: {
        //                   currentDeploymentUuid: testApplicationDeploymentUuid,
        //                 },
        //                 queryParams: {},
        //                 contextResults: {},
        //                 extractors: {
        //                   entityDefinitions: {
        //                     extractorOrCombinerType: "extractorByEntityReturningObjectList",
        //                     applicationSection: "model",
        //                     parentName: entityEntityDefinition.name,
        //                     parentUuid: entityEntityDefinition.uuid,
        //                     orderBy: {
        //                       attributeName: "name",
        //                       direction: "ASC",
        //                     },
        //                   },
        //                 },
        //               },
        //             },
        //           },
        //         },
        //         {
        //           // performs query on local cache for emulated server, and on server for remote server
        //           actionType: "compositeRunBoxedQueryAction",
        //           endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
        //           actionLabel: "calculateNewEntityDefinionAndReports",
        //           nameGivenToResult: "libraryEntityDefinitionListFromLocalCache",
        //           payload: {
        //             actionType: "runBoxedQueryAction",
        //             endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
        //             payload: {
        //               // deploymentUuid: deployment_Library_DO_NO_USE.uuid,
        //               application: testApplicationUuid,
        //               applicationSection: "model", // TODO: give only selfApplication section in individual queries?
        //               queryExecutionStrategy: "storage",
        //               query: {
        //                 queryType: "boxedQueryWithExtractorCombinerTransformer",
        //                 application: testApplicationUuid,
        //                 // applicationDeploymentMap: defaultSelfApplicationDeploymentMap,
        //                 // deploymentUuid: testApplicationDeploymentUuid,
        //                 pageParams: {
        //                   currentDeploymentUuid: testApplicationDeploymentUuid,
        //                 },
        //                 queryParams: {},
        //                 contextResults: {},
        //                 extractors: {
        //                   entityDefinitions: {
        //                     extractorOrCombinerType: "extractorByEntityReturningObjectList",
        //                     applicationSection: "model",
        //                     parentName: entityEntityDefinition.name,
        //                     parentUuid: entityEntityDefinition.uuid,
        //                     orderBy: {
        //                       attributeName: "name",
        //                       direction: "ASC",
        //                     },
        //                   },
        //                 },
        //               },
        //             },
        //           },
        //         },
        //       ],
        //     },
        //   },
        //   testCompositeActionAssertions: [
        //     // TODO: test length of entityBookList.books!
        //     {
        //       actionType: "compositeRunTestAssertion",
        //       actionLabel: "checkNumberOfBooksFromPersisentStore",
        //       nameGivenToResult: "checkNumberOfEntitiesFromPersistentStore",
        //       testAssertion: {
        //         testType: "testAssertion",
        //         testLabel: "checkNumberOfBooksFromPersisentStore",
        //         definition: {
        //           resultAccessPath: ["0"],
        //           resultTransformer: {
        //             transformerType: "aggregate",
        //             interpolation: "runtime",
        //             applyTo: {
        //               transformerType: "getFromContext",
        //               interpolation: "runtime",
        //               referencePath: [
        //                 "libraryEntityDefinitionListFromPersistentStore",
        //                 "entityDefinitions",
        //               ],
        //             },
        //           },
        //           expectedValue: { aggregate: 1 },
        //         },
        //       },
        //     },
        //     {
        //       actionType: "compositeRunTestAssertion",
        //       actionLabel: "checkNumberOfBooksFromLocalCache",
        //       nameGivenToResult: "checkNumberOfEntitiesFromLocalCache",
        //       testAssertion: {
        //         testType: "testAssertion",
        //         testLabel: "checkNumberOfBooksFromLocalCache",
        //         definition: {
        //           resultAccessPath: ["0"],
        //           resultTransformer: {
        //             transformerType: "aggregate",
        //             interpolation: "runtime",
        //             applyTo: {
        //               transformerType: "getFromContext",
        //               interpolation: "runtime",
        //               referencePath: [
        //                 "libraryEntityDefinitionListFromLocalCache",
        //                 "entityDefinitions",
        //               ],
        //             },
        //           },
        //           expectedValue: { aggregate: 1 },
        //         },
        //       },
        //     },
        //     // {
        //     //   actionType: "compositeRunTestAssertion",
        //     //   actionLabel: "checkEntityBooks",
        //     //   nameGivenToResult: "checkEntityDefinitionFromLocalCache",
        //     //   testAssertion: {
        //     //     testType: "testAssertion",
        //     //     testLabel: "checkEntityBooks",
        //     //     definition: {
        //     //       resultAccessPath: ["libraryEntityDefinitionListFromLocalCache", "entityDefinitions"],
        //     //       ignoreAttributes: ["author", "storageAccess"],
        //     //       expectedValue: [
        //     //         {
        //     //           ...entityDefinitionPublisher,
        //     //           mlSchema: {
        //     //             ...entityDefinitionPublisher.mlSchema,
        //     //             definition: {
        //     //               ...entityDefinitionPublisher.mlSchema.definition,
        //     //               aNewColumnForTest: columnForTestDefinition,
        //     //             },
        //     //           },
        //     //         },
        //     //       ],
        //     //     },
        //     //   },
        //     // },
        //     // {
        //     //   actionType: "compositeRunTestAssertion",
        //     //   actionLabel: "checkEntityBooks",
        //     //   nameGivenToResult: "checkEntityDefinitionFromPersistentStore",
        //     //   testAssertion: {
        //     //     testType: "testAssertion",
        //     //     testLabel: "checkEntityBooks",
        //     //     definition: {
        //     //       resultAccessPath: ["libraryEntityDefinitionListFromPersistentStore", "entityDefinitions"],
        //     //       ignoreAttributes: ["author", "storageAccess"],
        //     //       expectedValue: [
        //     //         {
        //     //           ...entityDefinitionPublisher,
        //     //           mlSchema: {
        //     //             ...entityDefinitionPublisher.mlSchema,
        //     //             definition: {
        //     //               ...entityDefinitionPublisher.mlSchema.definition,
        //     //               aNewColumnForTest: columnForTestDefinition,
        //     //             },
        //     //           },
        //     //         },
        //     //       ],
        //     //     },
        //     //   },
        //     // },
        //   ],
        // },
      },
    },
  },
};

describe.sequential(
  pageLabel,
  () => {
    it.each(Object.entries(testActions))(
      "test %s",
      async (currentTestSuiteName, testAction: TestCompositeActionParams) => {
        const testSuiteResults = await runTestOrTestSuite(
          domainController,
          testAction,
          applicationDeploymentMap,
          miroirActivityTracker,
          {}
        );
        if (!testSuiteResults || testSuiteResults.status !== "ok") {
          expect(testSuiteResults?.status, `${currentTestSuiteName} failed!`).toBe("ok");
        }
      },
      globalTimeOut
    );
  } //  end describe('DomainController.Data.CRUD.React',
);

// // ################################################################################################
// // ################################################################################################
// describe("Runner_CreateEntity", () => {
//   beforeEach(() => {
//     document.body.innerHTML = "";
//   });

//   // // ##############################################################################################
//   // // SUITE 1: Form rendering
//   // // ##############################################################################################
//   // describe("form rendering", () => {
//   //   it("renders the Create Entity form with application, entity, and entityDefinition sections", async () => {
//   //     const { container } = renderRunner(
//   //       <Runner_CreateEntity
//   //         applicationDeploymentMap={runnerTestApplicationDeploymentMap}
//   //       />,
//   //     );

//   //     await waitForProgressiveRendering();

//   //     // The component should render a form. Look for key labels / input fields.
//   //     // The formMLSchema defines an outer "createEntity" object with sub-objects:
//   //     //   - application (uuid FK)
//   //     //   - entity (using entityDefinitionEntity.mlSchema)
//   //     //   - entityDefinition (using entityDefinitionEntityDefinition.mlSchema)

//   //     // At minimum, the form should be on screen (submit button or form element)
//   //     // Runner_CreateEntity sets displaySubmitButton="onFirstLine" and formLabel="Create Entity"
//   //     await waitFor(() => {
//   //       // The form label or a submit-like button should be visible
//   //       const formElements = document.querySelectorAll("form, button[type='submit'], button");
//   //       expect(formElements.length).toBeGreaterThan(0);
//   //     });

//   //     // Extract rendered values – these are the initial form values
//   //     const renderedValues = extractValuesFromRenderedElements(
//   //       expect,
//   //       undefined, // all element types
//   //       container as any,
//   //       "createEntity", // label prefix to match
//   //     );

//   //     log.info("Rendered initial values:", renderedValues);

//   //     // The entity name field should exist and be empty (initial value is "")
//   //     // The entity uuid field should be populated (a generated uuid)
//   //     // The application field should default to noValue.uuid
//   //   });

//   //   // ############################################################################################
//   //   // it("populates entity initial values with generated UUIDs", async () => {
//   //   //   const { container } = renderRunner(
//   //   //     <Runner_CreateEntity
//   //   //       applicationDeploymentMap={runnerTestApplicationDeploymentMap}
//   //   //     />,
//   //   //   );

//   //   //   await waitForProgressiveRendering();

//   //   //   screen.debug(container, Infinity, { highlight: true });
//   //   //   // Extract all rendered form values
//   //   //   const renderedValues = extractValuesFromRenderedElements(
//   //   //     expect,
//   //   //     ["input"],
//   //   //     container as any,
//   //   //     "createEntity",
//   //   //   );

//   //   //   log.info("Initial entity form values:", renderedValues);

//   //   //   // There should be input fields – at minimum uuid fields should contain UUID patterns
//   //   //   const inputElements = container.querySelectorAll("input");
//   //   //   expect(inputElements.length).toBeGreaterThan(0);

//   //   //   // Look for UUID-formatted values among inputs (the entity.uuid and entityDefinition.uuid)
//   //   //   const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
//   //   //   const uuidInputs = Array.from(inputElements).filter(
//   //   //     (input) => uuidPattern.test((input as HTMLInputElement).value),
//   //   //   );
//   //   //   // We expect at least 2 UUID inputs: entity.uuid and entityDefinition.uuid
//   //   //   expect(uuidInputs.length).toBeGreaterThanOrEqual(2);
//   //   // });
//   // });

//   // // ##############################################################################################
//   // // SUITE 2: Action template construction
//   // // ##############################################################################################
//   // describe("action template construction", () => {
//   //   it("produces a compositeActionTemplate with createEntity and commit steps", () => {
//   //     // This is a unit-level assertion on the exported function, but it validates
//   //     // the template that the Runner will submit.
//   //     const { getCreateEntityActionTemplate } = require(
//   //       "../../src/miroir-fwk/4_view/components/Runners/Runner_CreateEntity",
//   //     );

//   //     const template = getCreateEntityActionTemplate("createEntity", "Create Entity");

//   //     expect(template.actionType).toBe("compositeActionSequence");
//   //     expect(template.actionLabel).toBe("Create Entity");

//   //     // Should have 3 definition steps: query, createEntity, commit
//   //     expect(template.payload.definition).toHaveLength(3);
//   //     expect(template.payload.definition[0].actionType).toBe("compositeRunBoxedQueryAction");
//   //     expect(template.payload.definition[1].actionType).toBe("createEntity");
//   //     expect(template.payload.definition[2].actionType).toBe("commit");
//   //   });
//   // });

//   // ##############################################################################################
//   // SUITE 3: Runner execution (form submission)
//   // ##############################################################################################
//   describe("runner execution", () => {
//     // it("calls handleCompositeActionTemplate on the domainController when the form is submitted", async () => {
//     //   const user = userEvent.setup();

//     //   const { container, domainController } = renderRunner(
//     //     <Runner_CreateEntity
//     //       applicationDeploymentMap={runnerTestApplicationDeploymentMap}
//     //     />,
//     //   );

//     //   await waitForProgressiveRendering();

//     //   // Find and click the submit button
//     //   // Runner_CreateEntity uses displaySubmitButton="onFirstLine"
//     //   const submitButtons = container.querySelectorAll("button[type='submit']");
//     //   if (submitButtons.length > 0) {
//     //     await act(async () => {
//     //       await user.click(submitButtons[0] as HTMLElement);
//     //     });

//     //     await waitAfterUserInteraction();

//     //     // The RunnerView handleSubmit with actionType "compositeActionTemplate"
//     //     // should invoke domainController.handleCompositeActionTemplate
//     //     expect(domainController.handleCompositeActionTemplate).toHaveBeenCalled();
//     //   } else {
//     //     // If no explicit submit button, look for any clickable button
//     //     const buttons = Array.from(container.querySelectorAll("button")).filter(
//     //       (btn) =>
//     //         btn.textContent?.toLowerCase().includes("submit") ||
//     //         btn.textContent?.toLowerCase().includes("create") ||
//     //         btn.textContent?.toLowerCase().includes("run"),
//     //     );
//     //     if (buttons.length > 0) {
//     //       await act(async () => {
//     //         await user.click(buttons[0] as HTMLElement);
//     //       });

//     //       await waitAfterUserInteraction();

//     //       expect(domainController.handleCompositeActionTemplate).toHaveBeenCalled();
//     //     } else {
//     //       log.info(
//     //         "No submit or action button found – skipping execution assertion. " +
//     //           "This may indicate the Runner requires a user interaction not yet implemented in tests.",
//     //       );
//     //     }
//     //   }
//     // });

//     // ############################################################################################
//     it("passes form values through to the compositeActionTemplate call", async () => {
//       const user = userEvent.setup();
//       const { container, domainController } = renderRunner(
//         <Runner_CreateEntity
//           applicationDeploymentMap={runnerTestApplicationDeploymentMap}
//         />,
//       );

//       await waitForProgressiveRendering();

//       // Try to fill in a name for the entity (find a text input for entity name)
//       const nameInputs = Array.from(container.querySelectorAll("input")).filter((input) => {
//         const name = (input as HTMLInputElement).name || "";
//         return name.toLowerCase().includes("name") && !(input as HTMLInputElement).readOnly;
//       });

//       if (nameInputs.length > 0) {
//         const entityNameInput = nameInputs[0] as HTMLInputElement;
//         await act(async () => {
//           await user.clear(entityNameInput);
//           await user.type(entityNameInput, "TestEntity");
//         });

//         await waitAfterUserInteraction();
//       }

//       // Submit the form
//       const submitButtons = container.querySelectorAll("button[type='submit']");
//       const allButtons = submitButtons.length > 0
//         ? Array.from(submitButtons)
//         : Array.from(container.querySelectorAll("button")).filter(
//             (btn) =>
//               btn.textContent?.toLowerCase().includes("submit") ||
//               btn.textContent?.toLowerCase().includes("create") ||
//               btn.textContent?.toLowerCase().includes("run"),
//           );

//       if (allButtons.length > 0) {
//         await act(async () => {
//           await user.click(allButtons[0] as HTMLElement);
//         });

//         await waitAfterUserInteraction();

//         if ((domainController.handleCompositeActionTemplate as any).mock.calls.length > 0) {
//           const call = (domainController.handleCompositeActionTemplate as any).mock.calls[0];

//           // call[0] = compositeActionTemplate
//           // call[1] = applicationDeploymentMap
//           // call[2] = currentModelEnvironment
//           // call[3] = values (the form Formik values)
//           const compositeActionTemplate = call[0];
//           const submittedValues = call[3];

//           expect(compositeActionTemplate).toBeDefined();
//           expect(compositeActionTemplate.actionType).toBe("compositeActionSequence");

//           // The submitted values should contain the "createEntity" key
//           // matching the runnerName / formikValuePathAsString
//           if (submittedValues && submittedValues.createEntity) {
//             expect(submittedValues.createEntity).toBeDefined();
//             // entity and entityDefinition should be present
//             expect(submittedValues.createEntity.entity).toBeDefined();
//             expect(submittedValues.createEntity.entityDefinition).toBeDefined();

//             // If we typed a name, it should appear
//             if (nameInputs.length > 0) {
//               // The name could be on entity or entityDefinition
//               const entityName = submittedValues.createEntity.entity?.name;
//               const entityDefName = submittedValues.createEntity.entityDefinition?.name;
//               expect(entityName === "TestEntity" || entityDefName === "TestEntity").toBeTruthy();
//             }
//           }
//         }
//       }
//     });
//   });

  // // ##############################################################################################
  // // SUITE 4: Action-based test logic (declarative composite-action style)
  // // ##############################################################################################
  // describe("action-based validation", () => {
  //   // it("getCreateEntityActionTemplate references the correct endpoints", () => {
  //   //   // const { getCreateEntityActionTemplate } = require(
  //   //   //   "../../src/miroir-fwk/4_view/components/Runners/Runner_CreateEntity.tsx",
  //   //   // );

  //   //   const template = getCreateEntityActionTemplate("createEntity", "Create Entity");

  //   //   // The top-level endpoint should be the compositeAction endpoint
  //   //   expect(template.endpoint).toBe("1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5");

  //   //   // Step 0 (query) should target the query endpoint
  //   //   const queryStep = template.payload.actionSequence[0];
  //   //   expect(queryStep.endpoint).toBe("9e404b3c-368c-40cb-be8b-e3c28550c25e");

  //   //   // Step 1 (createEntity) should target the model action endpoint
  //   //   const createStep = template.payload.definition[1];
  //   //   expect(createStep.endpoint).toBe("7947ae40-eb34-4149-887b-15a9021e714e");

  //   //   // Step 2 (commit) should target the model action endpoint
  //   //   const commitStep = template.payload.definition[2];
  //   //   expect(commitStep.endpoint).toBe("7947ae40-eb34-4149-887b-15a9021e714e");
  //   // });

  //   // it("getCreateEntityActionTemplate query step filters deployments by application mustache template", () => {
  //   //   // const { getCreateEntityActionTemplate } = require(
  //   //   //   "../../src/miroir-fwk/4_view/components/Runners/Runner_CreateEntity",
  //   //   // );

  //   //   const template = getCreateEntityActionTemplate("createEntity", "Create Entity");
  //   //   const queryStep = template.payload.definition[0];
  //   //   const query = queryStep.payload.payload.query;

  //   //   // The extractor should filter by "selfApplication" with a mustache template
  //   //   const deploymentExtractor = query.extractors.deployments;
  //   //   expect(deploymentExtractor.extractorOrCombinerType).toBe("extractorByEntityReturningObjectList");
  //   //   expect(deploymentExtractor.filter.attributeName).toBe("selfApplication");
  //   //   expect(deploymentExtractor.filter.value.transformerType).toBe("mustacheStringTemplate");
  //   //   expect(deploymentExtractor.filter.value.definition).toBe("{{createEntity.application}}");
  //   // });

  //   it("getCreateEntityActionTemplate createEntity step uses runtime interpolation for deploymentUuid", () => {
  //     const { getCreateEntityActionTemplate } = require(
  //       "../../src/miroir-fwk/4_view/components/Runners/Runner_CreateEntity",
  //     );

  //     const template = getCreateEntityActionTemplate("createEntity", "Create Entity");
  //     const createStep = template.payload.definition[1];

  //     // deploymentUuid should be resolved at runtime from the query result
  //     expect(createStep.payload.deploymentUuid.transformerType).toBe("mustacheStringTemplate");
  //     expect(createStep.payload.deploymentUuid.interpolation).toBe("runtime");
  //     expect(createStep.payload.deploymentUuid.definition).toBe(
  //       "{{deploymentInfo.deployments.0.uuid}}",
  //     );
  //   });
  // });
// });
