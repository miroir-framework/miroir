import { afterAll, beforeAll, describe, expect, it } from "vitest";

import process from "process";

import type { ApplicationDeploymentMap, EndpointDefinition, MlSchema, SelfApplication } from "miroir-core";
import {
  ConfigurationService,
  createDeploymentCompositeAction,
  Deployment,
  displayTestSuiteResultsDetails,
  DomainControllerInterface,
  EntityInstance,
  LoggerInterface,
  MiroirActivityTracker,
  miroirCoreStartup,
  MiroirEventService,
  miroirFundamentalJzodSchema,
  MiroirLoggerFactory,
  resetAndinitializeDeploymentCompositeAction,
  StoreUnitConfiguration,
  testUtils_deleteApplicationDeployment,
  testUtils_resetApplicationDeployment
} from "miroir-core";


import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";
import { miroirIndexedDbStoreSectionStartup } from "miroir-store-indexedDb";
import { miroirPostgresStoreSectionStartup } from "miroir-store-postgres";
import { miroirAppStartup } from "../../src/startup.js";


import {
  defaultMiroirMetaModel,
  defaultSelfApplicationDeploymentMap,
  selfApplicationMiroir,
  TestCompositeActionParams
} from "miroir-core";
import {
  deployment_Admin
} from "miroir-test-app_deployment-admin";

import { LoggerOptions } from "miroir-core";
import { miroirMongoDbStoreSectionStartup } from "miroir-store-mongodb";
import {
  book1,
  book2,
  book3,
  book4,
  book5,
  book6,
  endpointDocument,
  entityAuthor,
  entityBook,
  entityPublisher,
  getDefaultLibraryModelEnvironmentDEFUNCT,
  selfApplicationLibrary,
  selfApplicationModelBranchLibraryMasterBranch,
  selfApplicationVersionLibraryInitialVersion,
} from "miroir-test-app_deployment-library";
import { loglevelnext } from "../../src/loglevelnextImporter.js";
import { runTestOrTestSuite } from "../../src/miroir-fwk/4-tests/runTestOrTestSuite.js";
import { DomainControllerIntegrationTestSession } from "../helpers/DomainControllerIntegrationTestSession.js";
import { libraryEntitiesAndInstancesWithoutBook3 } from "../helpers/libraryPlayfieldSeeds.js";
import { loadTestConfigFiles } from "../utils/fileTools.js";
import { cleanLevel, packageName } from "./constants.js";

// const env: any = (import.meta as any).env;
const env: any = process.env;


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
      directory: "../miroir-test-app_deployment-miroir/assets/miroir_model",
    },
    data: {
      emulatedServerType: "filesystem",
      directory: "../miroir-test-app_deployment-miroir/assets/miroir_data",
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

  
let domainController: DomainControllerInterface;

beforeAll(async () => {
  myConsoleLog("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ beforeAll");
  const session = new DomainControllerIntegrationTestSession(
    miroirConfig,
    {
      applicationDeploymentMap,
      adminDeployment,
      miroirDeploymentStorageConfiguration,
      libraryDeploymentStorageConfiguration: testDeploymentStorageConfiguration,
      miroirActivityTracker,
      miroirEventService,
    },
    "miroirPlatform",
  );
  const executionEnvironment = await session.initSession();
  domainController = executionEnvironment.domainController;
  document.body.innerHTML = "";
  myConsoleLog("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ beforeAll DONE");
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
        testDeploymentStorageConfiguration,
      ),
      beforeEach: resetAndinitializeDeploymentCompositeAction(
        selfApplicationLibrary.uuid,
        deployment_Library_DO_NO_USE.uuid,
        {
          dataStoreType: "app", // TODO: comparison between deployment and selfAdminConfigurationDeployment
          metaModel: defaultMiroirMetaModel,
          selfApplication: selfApplicationLibrary as SelfApplication,
          applicationModelBranch: selfApplicationModelBranchLibraryMasterBranch,
          applicationVersion: selfApplicationVersionLibraryInitialVersion,
        },
        libraryEntitiesAndInstancesWithoutBook3,
        defaultLibraryModelEnvironment.currentModel as any,
        [entityAuthor.uuid, entityBook.uuid, entityPublisher.uuid],
      ),
      afterEach: testUtils_resetApplicationDeployment(deployment_Library_DO_NO_USE.uuid),
      afterAll: testUtils_deleteApplicationDeployment(
        miroirConfig,
        selfApplicationLibrary.uuid,
        deployment_Library_DO_NO_USE.uuid,
      ),
      testCompositeActions: {
        "Refresh all Instances": {
          testType: "testCompositeAction",
          testLabel: "Refresh all Instances",
          compositeActionSequence: {
            actionType: "compositeActionSequence",
            actionLabel: "testLibraryBooks",
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
                  // actionType: "modelAction",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
                    application: testApplicationUuid,
                  },
                },
                {
                  actionType: "compositeRunBoxedQueryAction",
                  endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
                  actionLabel: "calculateNewEntityDefinionAndReports",
                  nameGivenToResult: "entityBookList",
                  payload: {
                    actionType: "runBoxedQueryAction",
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
                        extractors: {
                          books: {
                            extractorOrCombinerType: "extractorInstancesByEntity",
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
                  actionType: "createInstance",
                  actionLabel: "addBook3",
                  endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
                  payload: {
                    application: testApplicationUuid,
                    applicationSection: "data",
                    objects: [book3 as EntityInstance],
                  },
                },
                {
                  actionType: "compositeRunBoxedQueryAction",
                  endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
                  actionLabel: "calculateNewEntityDefinionAndReports",
                  nameGivenToResult: "entityBookList",
                  payload: {
                    actionType: "runBoxedQueryAction",
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
                        extractors: {
                          books: {
                            extractorOrCombinerType: "extractorInstancesByEntity",
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
            endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
            payload: {
              actionSequence: [
                {
                  actionType: "rollback",
                  // actionType: "modelAction",
                  actionLabel: "refreshMiroirLocalCache",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
                    application: selfApplicationMiroir.uuid,
                  },
                },
                {
                  // actionType: "modelAction",
                  actionType: "rollback",
                  actionLabel: "refreshLibraryLocalCache",
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
                  endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
                  payload: {
                    application: testApplicationUuid,
                    applicationSection: "data",
                    objects: [book3 as EntityInstance],
                  },
                },
                {
                  actionType: "compositeRunBoxedQueryAction",
                  endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
                  actionLabel: "calculateNewEntityDefinionAndReports",
                  nameGivenToResult: "entityBookList",
                  payload: {
                    actionType: "runBoxedQueryAction",
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
                        extractors: {
                          books: {
                            extractorOrCombinerType: "extractorInstancesByEntity",
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
            endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
            payload: {
              actionSequence: [
                {
                  actionType: "rollback",
                  // actionType: "modelAction",
                  actionLabel: "refreshMiroirLocalCache",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
                    application: selfApplicationMiroir.uuid,
                  },
                },
                {
                  actionType: "rollback",
                  // actionType: "modelAction",
                  actionLabel: "refreshLibraryLocalCache",
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
                  endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
                  payload: {
                    application: testApplicationUuid,
                    applicationSection: "data",
                    objects: [book2 as EntityInstance],
                  },
                },
                {
                  actionType: "compositeRunBoxedQueryAction",
                  endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
                  actionLabel: "calculateNewEntityDefinionAndReports",
                  nameGivenToResult: "entityBookList",
                  payload: {
                    actionType: "runBoxedQueryAction",
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
                        extractors: {
                          books: {
                            extractorOrCombinerType: "extractorInstancesByEntity",
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
                    // deploymentUuid: testApplicationDeploymentUuid,
                  },
                },
                {
                  // actionType: "instanceAction",
                  actionType: "deleteInstance",
                  actionLabel: "addBook3",
                  endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
                  payload: {
                    application: testApplicationUuid,
                    applicationSection: "data",
                    objects: [book2 as EntityInstance],
                  },
                },
                {
                  actionType: "rollback",
                  // actionType: "modelAction",
                  actionLabel: "refreshLibraryLocalCache",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
                    application: testApplicationUuid,
                    // deploymentUuid: testApplicationDeploymentUuid,
                  },
                },
                {
                  actionType: "compositeRunBoxedQueryAction",
                  endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
                  actionLabel: "calculateNewEntityDefinionAndReports",
                  nameGivenToResult: "entityBookList",
                  payload: {
                    actionType: "runBoxedQueryAction",
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
                        extractors: {
                          books: {
                            extractorOrCombinerType: "extractorInstancesByEntity",
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
            endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
            payload: {
              actionSequence: [
                {
                  actionType: "rollback",
                  // actionType: "modelAction",
                  actionLabel: "refreshMiroirLocalCache",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
                    application: selfApplicationMiroir.uuid,
                  },
                },
                {
                  actionType: "rollback",
                  // actionType: "modelAction",
                  actionLabel: "refreshLibraryLocalCache",
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
                  endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
                  payload: {
                    application: testApplicationUuid,
                    applicationSection: "data",
                    objects: [
                      Object.assign({}, book4, {
                        name: "Tthe Bride Wore Blackk",
                        author: "d14c1c0c-eb2e-42d1-8ac1-2d58f5143c17",
                      }) as EntityInstance,
                    ],
                  },
                },
                {
                  actionType: "compositeRunBoxedQueryAction",
                  endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
                  actionLabel: "calculateNewEntityDefinionAndReports",
                  nameGivenToResult: "entityBookList",
                  payload: {
                    actionType: "runBoxedQueryAction",
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
                        extractors: {
                          books: {
                            extractorOrCombinerType: "extractorInstancesByEntity",
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
