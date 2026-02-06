import { describe, expect } from "vitest";

// import process from "process";

import type { ApplicationDeploymentMap, EndpointDefinition, MlSchema } from "miroir-core";
import {
  createDeploymentCompositeAction,
  Deployment,
  displayTestSuiteResultsDetails,
  DomainControllerInterface,
  EntityDefinition,
  EntityInstance,
  LoggerInterface,
  MetaEntity,
  MiroirActivityTracker,
  miroirCoreStartup,
  MiroirEventService,
  miroirFundamentalJzodSchema,
  MiroirLoggerFactory,
  resetAndInitApplicationDeployment,
  resetAndinitializeDeploymentCompositeAction,
  selfApplicationDeploymentMiroir,
  StoreUnitConfiguration,
  type ApplicationEntitiesAndInstances
} from "miroir-core";

import {
  runTestOrTestSuite,
  setupMiroirTest
} from "../../src/miroir-fwk/4-tests/tests-utils.js";

import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";
import { miroirIndexedDbStoreSectionStartup } from "miroir-store-indexedDb";
import { miroirPostgresStoreSectionStartup } from "miroir-store-postgres";
import { miroirAppStartup } from "../../src/startup.js";


import {
  // deployment_Admin,
  // adminApplication_Miroir,
  ConfigurationService,
  // defaultLibraryModelEnvironment,
  defaultMiroirMetaModel,
  defaultMiroirModelEnvironment,
  defaultSelfApplicationDeploymentMap,
  selfApplicationMiroir,
  TestCompositeActionParams,
} from "miroir-core";
import {
  adminApplication_Miroir,
  deployment_Admin
} from "miroir-test-app_deployment-admin";

import { LoggerOptions } from "miroir-core";
import {
  author1,
  author2,
  author3,
  book1,
  book2,
  book3,
  book4,
  book5,
  book6,
  endpointDocument,
  entityAuthor,
  entityBook,
  entityDefinitionAuthor,
  entityDefinitionBook,
  entityDefinitionPublisher,
  entityPublisher,
  getDefaultLibraryModelEnvironmentDEFUNCT,
  folio as publisher1,
  penguin as publisher2,
  springer as publisher3,
  selfApplicationLibrary,
  selfApplicationModelBranchLibraryMasterBranch,
  selfApplicationVersionLibraryInitialVersion,
} from "miroir-example-library";
import { miroirMongoDbStoreSectionStartup } from "miroir-store-mongodb";
import { loglevelnext } from "../../src/loglevelnextImporter.js";
import {
  testOnLibrary_deleteLibraryDeployment,
  testOnLibrary_resetLibraryDeployment
} from "../../src/miroir-fwk/4-tests/tests-utils-testOnLibrary.js";
import { loadTestConfigFiles } from "../utils/fileTools.js";
import { cleanLevel, packageName } from "./constants.js";

const env: any = (import.meta as any).env;

console.log("@@@@@@@@@@@@@@@@@@ env", env);

const myConsoleLog = (...args: any[]) => console.log(fileName, ...args);
const fileName = "DomainController.integ.Data.CRUD.test";
myConsoleLog(fileName, "received env", JSON.stringify(env, null, 2));

let miroirConfig: any;
let loggerOptions: LoggerOptions;
let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, fileName)).then(
  (logger: LoggerInterface) => {
    log = logger;
  }
);

miroirAppStartup();
miroirCoreStartup();
miroirFileSystemStoreSectionStartup();
miroirIndexedDbStoreSectionStartup();
miroirMongoDbStoreSectionStartup();
miroirPostgresStoreSectionStartup();
ConfigurationService.registerTestImplementation({ expect: expect as any });

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

const deployment_Miroir: Deployment = {
  uuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
  parentName: "Deployment",
  parentUuid: "7959d814-400c-4e80-988f-a00fe582ab98",
  name: "DefaultMiroirApplicationDeployment",
  defaultLabel:
    "Miroir SelfApplication Deployment Configuration declaring Miroir SelfApplication Deployment in Admin schema. Run-time-only / DEFUNCT?",
  selfApplication: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
  description: "The default Deployment for SelfApplication Miroir",
  configuration: {
    admin: {
      emulatedServerType: "filesystem",
      directory: "../miroir-core/src/assets/admin",
    },
    model: {
      emulatedServerType: "filesystem",
      directory: "../miroir-core/src/assets/miroir_model",
    },
    data: {
      emulatedServerType: "filesystem",
      directory: "../miroir-core/src/assets/miroir_data",
    },
    // admin: {
    //   emulatedServerType: "sql",
    //   connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
    //   schema: "miroirAdmin",
    // },
    // model: {
    //   emulatedServerType: "sql",
    //   connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
    //   schema: "miroir",
    // },
    // data: {
    //   emulatedServerType: "sql",
    //   connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
    //   schema: "miroir",
    // },
  },
};
const deployment_Library_DO_NO_USE: Deployment = {
  uuid: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
  parentName: "Deployment",
  parentUuid: "35c5608a-7678-4f07-a4ec-76fc5bc35424",
  name: "LibraryApplicationFilesystemDeployment",
  defaultLabel: "LibraryApplicationFilesystemDeployment",
  selfApplication: "5af03c98-fe5e-490b-b08f-e1230971c57f",
  description: "The default Filesystem Deployment for SelfApplication Library",
  configuration: {
    admin: {
      emulatedServerType: "sql",
      connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
      schema: "miroirAdmin",
    },
    model: {
      emulatedServerType: "sql",
      connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
      schema: "library",
    },
    data: {
      emulatedServerType: "sql",
      connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
      schema: "library",
    },
  },
};

const defaultLibraryModelEnvironment = getDefaultLibraryModelEnvironmentDEFUNCT(
  miroirFundamentalJzodSchema as MlSchema,
  defaultMiroirMetaModel,
  endpointDocument as EndpointDefinition,
  deployment_Library_DO_NO_USE.uuid,
);

const applicationDeploymentMap: ApplicationDeploymentMap = {
  ...defaultSelfApplicationDeploymentMap,
  [selfApplicationLibrary.uuid]: deployment_Library_DO_NO_USE.uuid,
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

const testApplicationUuid = selfApplicationLibrary.uuid;
const testApplicationDeploymentUuid = deployment_Library_DO_NO_USE.uuid;

const testDeploymentStorageConfiguration = miroirConfig.client.emulateServer
  ? miroirConfig.client.deploymentStorageConfig[testApplicationDeploymentUuid]
  : miroirConfig.client.serverConfig.storeSectionConfiguration[testApplicationDeploymentUuid];

// const testDeployment: Deployment = {
//   ...deployment_Library_DO_NO_USE,
//   configuration: testDeploymentStorageConfiguration,
// };


// const typedAdminConfigurationDeploymentLibrary: AdminApplicationDeploymentConfiguration =
//   deployment_Library_DO_NO_USE as any;
  
let domainController: DomainControllerInterface;
// let localCache: LocalCacheInterface;
// let miroirContext: MiroirContextInterface;
// let persistenceStoreControllerManager: PersistenceStoreControllerManagerInterface;
// let globalTestSuiteResults: TestSuiteResult = {};

export const libraryEntitiesAndInstancesWithoutBook3: ApplicationEntitiesAndInstances = [
  {
    entity: entityAuthor as MetaEntity,
    entityDefinition: entityDefinitionAuthor as EntityDefinition,
    instances: [author1, author2, author3 as EntityInstance],
  },
  {
    entity: entityBook as MetaEntity,
    entityDefinition: entityDefinitionBook as EntityDefinition,
    instances: [
      book1 as EntityInstance,
      book2 as EntityInstance,
      // // book3 as EntityInstance,
      book4 as EntityInstance,
      book5 as EntityInstance,
      book6 as EntityInstance,
    ],
  },
  {
    entity: entityPublisher as MetaEntity,
    entityDefinition: entityDefinitionPublisher as EntityDefinition,
    instances: [publisher1 as EntityInstance, publisher2 as EntityInstance, publisher3 as EntityInstance],
  },
];

beforeAll(async () => {
  // Establish requests interception layer before all tests.
  myConsoleLog("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ beforeAll");
  const {
    domainController: localdomainController,
  } = await setupMiroirTest(miroirConfig, miroirActivityTracker, miroirEventService);

  domainController = localdomainController;

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
  myConsoleLog("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ beforeAll DONE");

  // TODO: move it in TestCompositeAction.beforeEach
  await resetAndInitApplicationDeployment(domainController, applicationDeploymentMap, [
    selfApplicationDeploymentMiroir as Deployment,
  ]);
  document.body.innerHTML = "";

  return Promise.resolve();
});

// // TODO: move it in TestCompositeAction.beforeEach
// beforeEach(async () => {
//   await resetAndInitApplicationDeployment(domainController, applicationDeploymentMap, [
//     selfApplicationDeploymentMiroir as Deployment,
//   ]);
//   document.body.innerHTML = "";
// });

afterAll(async () => {
  // await deleteAndCloseApplicationDeployments(
  //   miroirConfig,
  //   domainController,
  //   // deploymentConfigurations,
  //   adminApplicationDeploymentConfigurations
  // );
  displayTestSuiteResultsDetails(
    Object.keys(testActions)[0],
    // [{ testSuite: Object.keys(testActions)[0] }],
    [],
    miroirActivityTracker
  );
});

const testActions: Record<string, TestCompositeActionParams> = {
  "DomainController.integ.Data.CRUD": {
    testActionType: "testCompositeActionSuite",
    testActionLabel: "DomainController.integ.Data.CRUD",
    application: testApplicationUuid,
    testCompositeAction: {
      testType: "testCompositeActionSuite",
      testLabel: "DomainController.integ.Data.CRUD",
      beforeAll: createDeploymentCompositeAction(
        "library",
        testApplicationDeploymentUuid,
        testApplicationUuid,
        adminDeployment,
        testDeploymentStorageConfiguration
      ),
      beforeEach: resetAndinitializeDeploymentCompositeAction(
        selfApplicationLibrary.uuid,
        deployment_Library_DO_NO_USE.uuid,
        {
          dataStoreType: "app", // TODO: comparison between deployment and selfAdminConfigurationDeployment
          metaModel: defaultMiroirMetaModel,
          selfApplication: selfApplicationLibrary,
          applicationModelBranch: selfApplicationModelBranchLibraryMasterBranch,
          applicationVersion: selfApplicationVersionLibraryInitialVersion,
        },
        libraryEntitiesAndInstancesWithoutBook3,
        defaultLibraryModelEnvironment.currentModel as any,
        [entityAuthor.uuid, entityBook.uuid, entityPublisher.uuid], 
      ),
      afterEach: testOnLibrary_resetLibraryDeployment(deployment_Library_DO_NO_USE.uuid),
      afterAll: testOnLibrary_deleteLibraryDeployment(
        miroirConfig,
        selfApplicationLibrary.uuid,
        deployment_Library_DO_NO_USE.uuid
      ),
      testCompositeActions: {
        "Refresh all Instances": {
          testType: "testCompositeAction",
          testLabel: "Refresh all Instances",
          compositeActionSequence: {
            actionType: "compositeActionSequence",
            actionLabel: "testLibraryBooks",
            application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
            endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
            payload: {
              application: "NOT_USED",
              definition: [
                {
                  actionType: "rollback",
                  actionLabel: "refreshMiroirLocalCache",
                  application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
                    application: selfApplicationMiroir.uuid,
                  },
                },
                {
                  actionType: "rollback",
                  actionLabel: "refreshLibraryLocalCache",
                  // actionType: "modelAction",
                  application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
                    application: testApplicationUuid,
                  },
                },
                {
                  actionType: "compositeRunBoxedExtractorOrQueryAction",
                  actionLabel: "calculateNewEntityDefinionAndReports",
                  nameGivenToResult: "entityBookList",
                  query: {
                    actionType: "runBoxedExtractorOrQueryAction",
                    application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                    endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                    payload: {
                      application: testApplicationUuid,
                      applicationSection: "data", // TODO: give only selfApplication section in individual queries?
                      query: {
                        queryType: "boxedQueryWithExtractorCombinerTransformer",
                        application: testApplicationUuid,
                        pageParams: {
                          currentDeploymentUuid: testApplicationDeploymentUuid,
                        },
                        queryParams: {},
                        contextResults: {},
                        extractors: {
                          books: {
                            extractorOrCombinerType: "extractorByEntityReturningObjectList",
                            applicationSection: "data",
                            parentName: "Book",
                            parentUuid: entityBook.uuid,
                            orderBy: {
                              attributeName: "uuid",
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
              actionLabel: "checkNumberOfBooks",
              nameGivenToResult: "checkNumberOfBooks",
              testAssertion: {
                testType: "testAssertion",
                testLabel: "checkNumberOfBooks",
                definition: {
                  resultAccessPath: ["0"],
                  resultTransformer: {
                    transformerType: "aggregate",
                    interpolation: "runtime",
                    applyTo: {
                      transformerType: "getFromContext",
                      interpolation: "runtime",
                      referencePath: ["entityBookList", "books"],
                    },
                    // referencedTransformer: {
                    //     transformerType: "getFromContext",
                    //     interpolation: "runtime",
                    //     referencePath: ["entityBookList", "books"],
                    //   },
                  },
                  expectedValue: { aggregate: 5 },
                },
              },
            },
            {
              actionType: "compositeRunTestAssertion",
              actionLabel: "checkEntityBooks",
              nameGivenToResult: "checkEntityBooks",
              testAssertion: {
                testType: "testAssertion",
                testLabel: "checkEntityBooks",
                definition: {
                  resultAccessPath: ["entityBookList", "books"],
                  ignoreAttributes: ["conceptLevel"],
                  expectedValue: [
                    // book3,
                    book4,
                    book6,
                    book5,
                    book1,
                    book2,
                  ],
                },
              },
            },
          ],
        },
        "Add Book instance": {
          testType: "testCompositeAction",
          testLabel: "Add Book instance",
          compositeActionSequence: {
            actionType: "compositeActionSequence",
            actionLabel: "AddBookInstanceThenRollback",
            application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
            endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
            payload: {
              application: "NOT_USED",
              definition: [
                {
                  actionType: "rollback",
                  // actionType: "modelAction",
                  actionLabel: "refreshMiroirLocalCache",
                  application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
                    application: selfApplicationMiroir.uuid,
                    // deploymentUuid: deployment_Miroir.uuid,
                  },
                },
                {
                  actionType: "rollback",
                  // actionType: "modelAction",
                  actionLabel: "refreshLibraryLocalCache",
                  application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
                    application: testApplicationUuid,
                    // deploymentUuid: testApplicationDeploymentUuid,
                  },
                },
                {
                  // actionType: "instanceAction",
                  actionType: "createInstance",
                  actionLabel: "addBook3",
                  application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                  endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
                  payload: {
                    application: testApplicationUuid,
                    // deploymentUuid: testApplicationDeploymentUuid,
                    applicationSection: "data",
                    parentUuid: entityBook.uuid,
                    objects: [
                      {
                        parentName: book3.parentName,
                        parentUuid: book3.parentUuid,
                        applicationSection: "data",
                        instances: [book3 as EntityInstance],
                      },
                    ],
                  },
                },
                {
                  actionType: "compositeRunBoxedExtractorOrQueryAction",
                  actionLabel: "calculateNewEntityDefinionAndReports",
                  nameGivenToResult: "entityBookList",
                  query: {
                    actionType: "runBoxedExtractorOrQueryAction",
                    application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                    endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                    payload: {
                      application: testApplicationUuid,
                      // deploymentUuid: testApplicationDeploymentUuid,
                      applicationSection: "data", // TODO: give only selfApplication section in individual queries?
                      query: {
                        queryType: "boxedQueryWithExtractorCombinerTransformer",
                        application: testApplicationUuid,
                        // deploymentUuid: testApplicationDeploymentUuid,
                        pageParams: {
                          currentDeploymentUuid: testApplicationDeploymentUuid,
                        },
                        queryParams: {},
                        contextResults: {},
                        extractors: {
                          books: {
                            extractorOrCombinerType: "extractorByEntityReturningObjectList",
                            applicationSection: "data",
                            parentName: "Book",
                            parentUuid: entityBook.uuid,
                            orderBy: {
                              attributeName: "uuid",
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
              actionLabel: "checkNumberOfBooks",
              nameGivenToResult: "checkNumberOfBooks",
              testAssertion: {
                testType: "testAssertion",
                testLabel: "checkNumberOfBooks",
                definition: {
                  resultAccessPath: ["0"],
                  resultTransformer: {
                    transformerType: "aggregate",
                    interpolation: "runtime",
                    applyTo: {
                      transformerType: "getFromContext",
                      interpolation: "runtime",
                      referencePath: ["entityBookList", "books"],
                    },
                  },
                  expectedValue: { aggregate: 6 },
                },
              },
            },
            {
              actionType: "compositeRunTestAssertion",
              actionLabel: "checkEntityBooks",
              nameGivenToResult: "checkEntityBooks",
              testAssertion: {
                testType: "testAssertion",
                testLabel: "checkEntityBooks",
                definition: {
                  resultAccessPath: ["entityBookList", "books"],
                  ignoreAttributes: ["conceptLevel"],
                  expectedValue: [book3, book4, book6, book5, book1, book2],
                },
              },
            },
          ],
        },
        "Add Book instance then rollback": {
          testType: "testCompositeAction",
          testLabel: "Add Book instance then rollback",
          compositeActionSequence: {
            actionType: "compositeActionSequence",
            actionLabel: "AddBookInstanceThenRollback",
            application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
            endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
            payload: {
              application: "NOT_USED",
              definition: [
                {
                  actionType: "rollback",
                  // actionType: "modelAction",
                  actionLabel: "refreshMiroirLocalCache",
                  application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
                    application: selfApplicationMiroir.uuid,
                    // deploymentUuid: deployment_Miroir.uuid,
                  },
                },
                {
                  // actionType: "modelAction",
                  actionType: "rollback",
                  actionLabel: "refreshLibraryLocalCache",
                  application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
                    application: testApplicationUuid,
                    // deploymentUuid: testApplicationDeploymentUuid,
                  },
                },
                {
                  // actionType: "instanceAction",
                  actionType: "createInstance",
                  actionLabel: "addBook3",
                  application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                  endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
                  payload: {
                    application: testApplicationUuid,
                    // deploymentUuid: testApplicationDeploymentUuid,
                    applicationSection: "data",
                    parentUuid: entityBook.uuid,
                    objects: [
                      {
                        parentName: book3.parentName,
                        parentUuid: book3.parentUuid,
                        applicationSection: "data",
                        instances: [book3 as EntityInstance],
                      },
                    ],
                  },
                },
                {
                  actionType: "compositeRunBoxedExtractorOrQueryAction",
                  actionLabel: "calculateNewEntityDefinionAndReports",
                  nameGivenToResult: "entityBookList",
                  query: {
                    actionType: "runBoxedExtractorOrQueryAction",
                    application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                    endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                    // deploymentUuid: testApplicationDeploymentUuid,
                    payload: {
                      application: testApplicationUuid,
                      // deploymentUuid: testApplicationDeploymentUuid,
                      applicationSection: "data", // TODO: give only selfApplication section in individual queries?
                      query: {
                        queryType: "boxedQueryWithExtractorCombinerTransformer",
                        application: testApplicationUuid,
                        // deploymentUuid: testApplicationDeploymentUuid,
                        pageParams: {
                          currentDeploymentUuid: testApplicationDeploymentUuid,
                        },
                        queryParams: {},
                        contextResults: {},
                        extractors: {
                          books: {
                            extractorOrCombinerType: "extractorByEntityReturningObjectList",
                            applicationSection: "data",
                            parentName: "Book",
                            parentUuid: entityBook.uuid,
                            orderBy: {
                              attributeName: "uuid",
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
              actionLabel: "checkNumberOfBooks",
              nameGivenToResult: "checkNumberOfBooks",
              testAssertion: {
                testType: "testAssertion",
                testLabel: "checkNumberOfBooks",
                definition: {
                  resultAccessPath: ["0"],
                  resultTransformer: {
                    transformerType: "aggregate",
                    interpolation: "runtime",
                    applyTo: {
                      transformerType: "getFromContext",
                      interpolation: "runtime",
                      referencePath: ["entityBookList", "books"],
                    },
                  },
                  expectedValue: { aggregate: 6 },
                },
              },
            },
            {
              actionType: "compositeRunTestAssertion",
              actionLabel: "checkEntityBooks",
              nameGivenToResult: "checkEntityBooks",
              testAssertion: {
                testType: "testAssertion",
                testLabel: "checkEntityBooks",
                definition: {
                  resultAccessPath: ["entityBookList", "books"],
                  ignoreAttributes: ["conceptLevel"],
                  expectedValue: [book3, book4, book6, book5, book1, book2],
                },
              },
            },
          ],
        },
        "Remove Book instance": {
          testType: "testCompositeAction",
          testLabel: "Remove Book instance",
          compositeActionSequence: {
            actionType: "compositeActionSequence",
            actionLabel: "AddBookInstanceThenRollback",
            application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
            endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
            payload: {
              application: "NOT_USED",
              definition: [
                {
                  actionType: "rollback",
                  // actionType: "modelAction",
                  actionLabel: "refreshMiroirLocalCache",
                  application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
                    application: selfApplicationMiroir.uuid,
                    // deploymentUuid: deployment_Miroir.uuid,
                  },
                },
                {
                  actionType: "rollback",
                  // actionType: "modelAction",
                  actionLabel: "refreshLibraryLocalCache",
                  application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
                    application: testApplicationUuid,
                    // deploymentUuid: testApplicationDeploymentUuid,
                  },
                },
                {
                  // actionType: "instanceAction",
                  actionType: "deleteInstance",
                  actionLabel: "deleteBook2",
                  application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                  endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
                  payload: {
                    application: testApplicationUuid,
                    // deploymentUuid: testApplicationDeploymentUuid,
                    applicationSection: "data",
                    objects: [
                      {
                        parentName: book2.parentName,
                        parentUuid: book2.parentUuid,
                        applicationSection: "data",
                        instances: [book2 as EntityInstance],
                      },
                    ],
                  },
                },
                {
                  actionType: "compositeRunBoxedExtractorOrQueryAction",
                  actionLabel: "calculateNewEntityDefinionAndReports",
                  nameGivenToResult: "entityBookList",
                  query: {
                    actionType: "runBoxedExtractorOrQueryAction",
                    application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                    endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                    payload: {
                      application: testApplicationUuid,
                      // deploymentUuid: testApplicationDeploymentUuid,
                      applicationSection: "data", // TODO: give only selfApplication section in individual queries?
                      query: {
                        queryType: "boxedQueryWithExtractorCombinerTransformer",
                        application: testApplicationUuid,
                        // deploymentUuid: testApplicationDeploymentUuid,
                        pageParams: {
                          currentDeploymentUuid: testApplicationDeploymentUuid,
                        },
                        queryParams: {},
                        contextResults: {},
                        extractors: {
                          books: {
                            extractorOrCombinerType: "extractorByEntityReturningObjectList",
                            applicationSection: "data",
                            parentName: "Book",
                            parentUuid: entityBook.uuid,
                            orderBy: {
                              attributeName: "uuid",
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
              actionLabel: "checkNumberOfBooks",
              nameGivenToResult: "checkNumberOfBooks",
              testAssertion: {
                testType: "testAssertion",
                testLabel: "checkNumberOfBooks",
                definition: {
                  resultAccessPath: ["0"],
                  resultTransformer: {
                    transformerType: "aggregate",
                    interpolation: "runtime",
                    applyTo: {
                      transformerType: "getFromContext",
                      interpolation: "runtime",
                      referencePath: ["entityBookList", "books"],
                    },
                  },
                  expectedValue: { aggregate: 4 },
                },
              },
            },
            {
              actionType: "compositeRunTestAssertion",
              actionLabel: "checkEntityBooks",
              nameGivenToResult: "checkEntityBooks",
              testAssertion: {
                testType: "testAssertion",
                testLabel: "checkEntityBooks",
                definition: {
                  resultAccessPath: ["entityBookList", "books"],
                  ignoreAttributes: ["conceptLevel"],
                  expectedValue: [
                    // book3,
                    book4,
                    book6,
                    book5,
                    book1,
                    // book2,
                  ],
                },
              },
            },
          ],
        },
        "Remove Book instance then rollback": {
          testType: "testCompositeAction",
          testLabel: "Remove Book instance then rollback",
          compositeActionSequence: {
            actionType: "compositeActionSequence",
            actionLabel: "AddBookInstanceThenRollback",
            application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
            endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
            payload: {
              application: "NOT_USED",
              definition: [
                {
                  actionType: "rollback",
                  actionLabel: "refreshMiroirLocalCache",
                  application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
                    application: selfApplicationMiroir.uuid,
                    // deploymentUuid: deployment_Miroir.uuid,
                  },
                },
                {
                  actionType: "rollback",
                  actionLabel: "refreshLibraryLocalCache",
                  application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
                    application: testApplicationUuid,
                    // deploymentUuid: testApplicationDeploymentUuid,
                  },
                },
                {
                  // actionType: "instanceAction",
                  actionType: "deleteInstance",
                  actionLabel: "addBook3",
                  application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                  endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
                  payload: {
                    application: testApplicationUuid,
                    // deploymentUuid: testApplicationDeploymentUuid,
                    applicationSection: "data",
                    objects: [
                      {
                        parentName: book2.parentName,
                        parentUuid: book2.parentUuid,
                        applicationSection: "data",
                        instances: [book2 as EntityInstance],
                      },
                    ],
                  },
                },
                {
                  actionType: "rollback",
                  // actionType: "modelAction",
                  actionLabel: "refreshLibraryLocalCache",
                  application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
                    application: testApplicationUuid,
                    // deploymentUuid: testApplicationDeploymentUuid,
                  },
                },
                {
                  actionType: "compositeRunBoxedExtractorOrQueryAction",
                  actionLabel: "calculateNewEntityDefinionAndReports",
                  nameGivenToResult: "entityBookList",
                  query: {
                    actionType: "runBoxedExtractorOrQueryAction",
                    application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                    endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                    payload: {
                      application: testApplicationUuid,
                      // deploymentUuid: testApplicationDeploymentUuid,
                      applicationSection: "data", // TODO: give only selfApplication section in individual queries?
                      query: {
                        queryType: "boxedQueryWithExtractorCombinerTransformer",
                        application: testApplicationUuid,
                        // deploymentUuid: testApplicationDeploymentUuid,
                        pageParams: {
                          currentDeploymentUuid: testApplicationDeploymentUuid,
                        },
                        queryParams: {},
                        contextResults: {},
                        extractors: {
                          books: {
                            extractorOrCombinerType: "extractorByEntityReturningObjectList",
                            applicationSection: "data",
                            parentName: "Book",
                            parentUuid: entityBook.uuid,
                            orderBy: {
                              attributeName: "uuid",
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
              actionLabel: "checkNumberOfBooks",
              nameGivenToResult: "checkNumberOfBooks",
              testAssertion: {
                testType: "testAssertion",
                testLabel: "checkNumberOfBooks",
                definition: {
                  resultAccessPath: ["0"],
                  resultTransformer: {
                    transformerType: "aggregate",
                    interpolation: "runtime",
                    applyTo: {
                      transformerType: "getFromContext",
                      interpolation: "runtime",
                      referencePath: ["entityBookList", "books"],
                    },
                  },
                  expectedValue: { aggregate: 4 },
                },
              },
            },
            {
              actionType: "compositeRunTestAssertion",
              actionLabel: "checkEntityBooks",
              nameGivenToResult: "checkEntityBooks",
              testAssertion: {
                testType: "testAssertion",
                testLabel: "checkEntityBooks",
                definition: {
                  resultAccessPath: ["entityBookList", "books"],
                  ignoreAttributes: ["conceptLevel"],
                  expectedValue: [
                    // book3,
                    book4,
                    book6,
                    book5,
                    book1,
                    // book2,
                  ],
                },
              },
            },
          ],
        },
        "Update Book instance": {
          testType: "testCompositeAction",
          testLabel: "Update Book instance",
          compositeActionSequence: {
            actionType: "compositeActionSequence",
            actionLabel: "AddBookInstanceThenRollback",
            application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
            endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
            payload: {
              application: "NOT_USED",
              definition: [
                {
                  actionType: "rollback",
                  // actionType: "modelAction",
                  actionLabel: "refreshMiroirLocalCache",
                  application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
                    application: selfApplicationMiroir.uuid,
                    // deploymentUuid: deployment_Miroir.uuid,
                  },
                },
                {
                  actionType: "rollback",
                  // actionType: "modelAction",
                  actionLabel: "refreshLibraryLocalCache",
                  application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
                    application: testApplicationUuid,
                    // deploymentUuid: testApplicationDeploymentUuid,
                  },
                },
                {
                  // actionType: "instanceAction",
                  actionType: "updateInstance",
                  actionLabel: "updateBook2",
                  application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                  endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
                  payload: {
                    application: testApplicationUuid,
                    parentUuid: entityBook.uuid,
                    // deploymentUuid: testApplicationDeploymentUuid,
                    applicationSection: "data",
                    objects: [
                      {
                        parentName: book4.parentName,
                        parentUuid: book4.parentUuid,
                        applicationSection: "data",
                        instances: [
                          Object.assign({}, book4, {
                            name: "Tthe Bride Wore Blackk",
                            author: "d14c1c0c-eb2e-42d1-8ac1-2d58f5143c17",
                          }) as EntityInstance,
                        ],
                      },
                    ],
                  },
                },
                {
                  actionType: "compositeRunBoxedExtractorOrQueryAction",
                  actionLabel: "calculateNewEntityDefinionAndReports",
                  nameGivenToResult: "entityBookList",
                  query: {
                    actionType: "runBoxedExtractorOrQueryAction",
                    application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                    endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                    payload: {
                      application: testApplicationUuid,
                      // deploymentUuid: testApplicationDeploymentUuid,
                      applicationSection: "data", // TODO: give only selfApplication section in individual queries?
                      query: {
                        queryType: "boxedQueryWithExtractorCombinerTransformer",
                        application: testApplicationUuid,
                        // deploymentUuid: testApplicationDeploymentUuid,
                        pageParams: {
                          currentDeploymentUuid: testApplicationDeploymentUuid,
                        },
                        queryParams: {},
                        contextResults: {},
                        extractors: {
                          books: {
                            extractorOrCombinerType: "extractorByEntityReturningObjectList",
                            applicationSection: "data",
                            parentName: "Book",
                            parentUuid: entityBook.uuid,
                            orderBy: {
                              attributeName: "uuid",
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
              actionLabel: "checkNumberOfBooks",
              nameGivenToResult: "checkNumberOfBooks",
              testAssertion: {
                testType: "testAssertion",
                testLabel: "checkNumberOfBooks",
                definition: {
                  resultAccessPath: ["0"],
                  resultTransformer: {
                    transformerType: "aggregate",
                    interpolation: "runtime",
                    applyTo: {
                      transformerType: "getFromContext",
                      interpolation: "runtime",
                      referencePath: ["entityBookList", "books"],
                    },
                  },
                  expectedValue: { aggregate: 5 },
                  // expectedValue: { aggregate: 6 },
                },
              },
            },
            {
              actionType: "compositeRunTestAssertion",
              actionLabel: "checkEntityBooks",
              nameGivenToResult: "checkEntityBooks",
              testAssertion: {
                testType: "testAssertion",
                testLabel: "checkEntityBooks",
                definition: {
                  resultAccessPath: ["entityBookList", "books"],
                  ignoreAttributes: ["conceptLevel"],
                  expectedValue: [
                    // book3,
                    Object.assign({}, book4, {
                      name: "Tthe Bride Wore Blackk",
                      author: "d14c1c0c-eb2e-42d1-8ac1-2d58f5143c17",
                    }) as EntityInstance,
                    book6,
                    book5,
                    book1,
                    book2,
                  ],
                },
              },
            },
          ],
        },
      },
    },
  },
};

describe.sequential(
  "DomainController.integ.Data.CRUD",
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
