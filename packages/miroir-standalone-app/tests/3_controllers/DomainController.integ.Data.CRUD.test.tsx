import { describe, expect } from "vitest";

// import process from "process";

import {
  adminConfigurationDeploymentLibrary,
  adminConfigurationDeploymentMiroir,
  author1,
  author2,
  author3,
  book1,
  book2,
  book3,
  book4,
  book5,
  book6,
  displayTestSuiteResults,
  DomainControllerInterface,
  entityAuthor,
  entityBook,
  EntityDefinition,
  entityDefinitionAuthor,
  entityDefinitionBook,
  entityDefinitionPublisher,
  EntityInstance,
  entityPublisher,
  LoggerInterface,
  MetaEntity,
  MiroirContextInterface,
  miroirCoreStartup,
  MiroirLoggerFactory,
  PersistenceStoreControllerManagerInterface,
  publisher1,
  publisher2,
  publisher3,
  resetAndInitApplicationDeployment,
  SelfApplicationDeploymentConfiguration,
  selfApplicationDeploymentMiroir,
  selfApplicationLibrary,
  selfApplicationModelBranchLibraryMasterBranch,
  selfApplicationVersionLibraryInitialVersion,
  StoreUnitConfiguration,
  TestSuiteResult,
} from "miroir-core";

import {
  adminApplicationDeploymentConfigurations,
  createDeploymentCompositeAction,
  deleteAndCloseApplicationDeployments,
  loadTestConfigFiles,
  resetAndinitializeDeploymentCompositeAction,
  runTestOrTestSuite,
  setupMiroirTest,
  TestActionParams,
} from "../utils/tests-utils.js";

import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";
import { miroirIndexedDbStoreSectionStartup } from "miroir-store-indexedDb";
import { miroirPostgresStoreSectionStartup } from "miroir-store-postgres";
import { miroirAppStartup } from "../../src/startup.js";


import { ConfigurationService, defaultMiroirMetaModel, LocalCacheInterface } from "miroir-core";
import { AdminApplicationDeploymentConfiguration } from "miroir-core/src/0_interfaces/1_core/StorageConfiguration.js";
import { LoggerOptions } from "miroir-core/src/0_interfaces/4-services/LoggerInterface.js";
import { loglevelnext } from "../../src/loglevelnextImporter.js";
import {
  ApplicationEntitiesAndInstances,
  testOnLibrary_deleteLibraryDeployment,
  testOnLibrary_resetLibraryDeployment,
} from "../utils/tests-utils-testOnLibrary.js";
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
miroirPostgresStoreSectionStartup();
ConfigurationService.registerTestImplementation({ expect: expect as any });

const { miroirConfig: miroirConfigParam, logConfig } = await loadTestConfigFiles(env);
miroirConfig = miroirConfigParam;
loggerOptions = logConfig;
myConsoleLog("received miroirConfig", JSON.stringify(miroirConfig, null, 2));
myConsoleLog("received miroirConfig.client", JSON.stringify(miroirConfig.client, null, 2));
myConsoleLog("received loggerOptions", JSON.stringify(loggerOptions, null, 2));
MiroirLoggerFactory.startRegisteredLoggers(loglevelnext, loggerOptions);
myConsoleLog("started registered loggers DONE");

const globalTimeOut = 30000;
// const globalTimeOut = 10^9;
const miroirtDeploymentStorageConfiguration: StoreUnitConfiguration = miroirConfig.client.emulateServer
  ? miroirConfig.client.deploymentStorageConfig[adminConfigurationDeploymentMiroir.uuid]
  : miroirConfig.client.serverConfig.storeSectionConfiguration[adminConfigurationDeploymentMiroir.uuid];

const testApplicationDeploymentUuid = adminConfigurationDeploymentLibrary.uuid;

const testDeploymentStorageConfiguration = miroirConfig.client.emulateServer
  ? miroirConfig.client.deploymentStorageConfig[testApplicationDeploymentUuid]
  : miroirConfig.client.serverConfig.storeSectionConfiguration[testApplicationDeploymentUuid];

const typedAdminConfigurationDeploymentLibrary: AdminApplicationDeploymentConfiguration =
  adminConfigurationDeploymentLibrary as any;

let domainController: DomainControllerInterface;
let localCache: LocalCacheInterface;
let miroirContext: MiroirContextInterface;
let persistenceStoreControllerManager: PersistenceStoreControllerManagerInterface;
let globalTestSuiteResults: TestSuiteResult = {};

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
      // book3 as EntityInstance,
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
    persistenceStoreControllerManagerForClient: localpersistenceStoreControllerManager,
    domainController: localdomainController,
    localCache: locallocalCache,
    miroirContext: localmiroirContext,
  } = await setupMiroirTest(miroirConfig);

  persistenceStoreControllerManager = localpersistenceStoreControllerManager;
  domainController = localdomainController;
  localCache = locallocalCache;
  miroirContext = localmiroirContext;

  const createMiroirDeploymentCompositeAction = createDeploymentCompositeAction(
    adminConfigurationDeploymentMiroir.uuid,
    miroirtDeploymentStorageConfiguration
  );
  const createDeploymentResult = await domainController.handleCompositeAction(
    createMiroirDeploymentCompositeAction,
    defaultMiroirMetaModel
  );
  if (createDeploymentResult.status !== "ok") {
    throw new Error("Failed to create Miroir deployment: " + JSON.stringify(createDeploymentResult));
  }
  myConsoleLog("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ beforeAll DONE");

  return Promise.resolve();
});

// TODO: move it in TestCompositeAction.beforeEach
beforeEach(async () => {
  await resetAndInitApplicationDeployment(domainController, [
    selfApplicationDeploymentMiroir as SelfApplicationDeploymentConfiguration,
  ]);
  document.body.innerHTML = "";
});

afterAll(async () => {
  await deleteAndCloseApplicationDeployments(
    miroirConfig,
    domainController,
    // deploymentConfigurations,
    adminApplicationDeploymentConfigurations
  );
  displayTestSuiteResults(expect, Object.keys(testActions)[0]);
});

const testActions: Record<string, TestActionParams> = {
  "DomainController.integ.Data.CRUD": {
    testActionType: "testCompositeActionSuite",
    deploymentUuid: testApplicationDeploymentUuid,
    testActionLabel: "DomainController.integ.Data.CRUD",
    testCompositeAction: {
      testType: "testCompositeActionSuite",
      testLabel: "DomainController.integ.Data.CRUD",
      beforeAll: createDeploymentCompositeAction(testApplicationDeploymentUuid, testDeploymentStorageConfiguration),
      beforeEach: resetAndinitializeDeploymentCompositeAction(
        adminConfigurationDeploymentLibrary.uuid,
        {
          dataStoreType: "app", // TODO: comparison between deployment and selfAdminConfigurationDeployment
          metaModel: defaultMiroirMetaModel,
          selfApplication: selfApplicationLibrary,
          applicationModelBranch: selfApplicationModelBranchLibraryMasterBranch,
          applicationVersion: selfApplicationVersionLibraryInitialVersion,
        },
        libraryEntitiesAndInstancesWithoutBook3
      ),
      afterEach: testOnLibrary_resetLibraryDeployment(miroirConfig),
      afterAll: testOnLibrary_deleteLibraryDeployment(miroirConfig),
      testCompositeActions: {
        "Refresh all Instances": {
          testType: "testCompositeAction",
          testLabel: "Refresh all Instances",
          compositeAction: {
            actionType: "compositeAction",
            actionLabel: "testLibraryBooks",
            actionName: "sequence",
            definition: [
              {
                actionType: "modelAction",
                actionName: "rollback",
                actionLabel: "refreshMiroirLocalCache",
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
              },
              {
                actionName: "rollback",
                actionLabel: "refreshLibraryLocalCache",
                actionType: "modelAction",
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                deploymentUuid: testApplicationDeploymentUuid,
              },
              {
                actionType: "compositeRunBoxedExtractorOrQueryAction",
                actionLabel: "calculateNewEntityDefinionAndReports",
                nameGivenToResult: "entityBookList",
                query: {
                  actionType: "runBoxedExtractorOrQueryAction",
                  actionName: "runQuery",
                  endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                  applicationSection: "data", // TODO: give only selfApplication section in individual queries?
                  deploymentUuid: testApplicationDeploymentUuid,
                  query: {
                    queryType: "boxedQueryWithExtractorCombinerTransformer",
                    deploymentUuid: testApplicationDeploymentUuid,
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
            ],
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
                    transformerType: "count",
                    interpolation: "runtime",
                    applyTo: {
                      referenceType: "referencedTransformer",
                      reference: {
                        transformerType: "contextReference",
                        interpolation: "runtime",
                        referencePath: ["entityBookList", "books"],
                      }
                    },
                  // referencedTransformer: {
                  //     transformerType: "contextReference",
                  //     interpolation: "runtime",
                  //     referencePath: ["entityBookList", "books"],
                  //   },
                  },
                  expectedValue: { count: 5 },
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
          compositeAction: {
            actionType: "compositeAction",
            actionLabel: "AddBookInstanceThenRollback",
            actionName: "sequence",
            definition: [
              {
                actionName: "rollback",
                actionType: "modelAction",
                actionLabel: "refreshMiroirLocalCache",
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
              },
              {
                actionName: "rollback",
                actionType: "modelAction",
                actionLabel: "refreshLibraryLocalCache",
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                deploymentUuid: testApplicationDeploymentUuid,
              },
              {
                actionType: "instanceAction",
                actionName: "createInstance",
                actionLabel: "addBook3",
                endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
                applicationSection: "data",
                deploymentUuid: testApplicationDeploymentUuid,
                objects: [
                  {
                    parentName: book3.parentName,
                    parentUuid: book3.parentUuid,
                    applicationSection: "data",
                    instances: [book3 as EntityInstance],
                  },
                ],
              },
              {
                actionType: "compositeRunBoxedExtractorOrQueryAction",
                actionLabel: "calculateNewEntityDefinionAndReports",
                nameGivenToResult: "entityBookList",
                query: {
                  actionType: "runBoxedExtractorOrQueryAction",
                  actionName: "runQuery",
                  endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                  applicationSection: "data", // TODO: give only selfApplication section in individual queries?
                  deploymentUuid: testApplicationDeploymentUuid,
                  query: {
                    queryType: "boxedQueryWithExtractorCombinerTransformer",
                    deploymentUuid: testApplicationDeploymentUuid,
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
            ],
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
                    transformerType: "count",
                    interpolation: "runtime",
                    applyTo: {
                      referenceType: "referencedTransformer",
                      reference: {
                        transformerType: "contextReference",
                        interpolation: "runtime",
                        referencePath: ["entityBookList", "books"],
                      }
                    },
                  },
                  expectedValue: { count: 6 },
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
                  expectedValue: [book3, book4, book6, book5, book1, book2],
                },
              },
            },
          ],
        },
        "Add Book instance then rollback": {
          testType: "testCompositeAction",
          testLabel: "Add Book instance then rollback",
          compositeAction: {
            actionType: "compositeAction",
            actionLabel: "AddBookInstanceThenRollback",
            actionName: "sequence",
            definition: [
              {
                actionName: "rollback",
                actionType: "modelAction",
                actionLabel: "refreshMiroirLocalCache",
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
              },
              {
                actionType: "modelAction",
                actionName: "rollback",
                actionLabel: "refreshLibraryLocalCache",
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                deploymentUuid: testApplicationDeploymentUuid,
              },
              {
                actionType: "instanceAction",
                actionName: "createInstance",
                actionLabel: "addBook3",
                endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
                applicationSection: "data",
                deploymentUuid: testApplicationDeploymentUuid,
                objects: [
                  {
                    parentName: book3.parentName,
                    parentUuid: book3.parentUuid,
                    applicationSection: "data",
                    instances: [book3 as EntityInstance],
                  },
                ],
              },
              {
                actionType: "compositeRunBoxedExtractorOrQueryAction",
                actionLabel: "calculateNewEntityDefinionAndReports",
                nameGivenToResult: "entityBookList",
                query: {
                  actionType: "runBoxedExtractorOrQueryAction",
                  actionName: "runQuery",
                  endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                  applicationSection: "data", // TODO: give only selfApplication section in individual queries?
                  deploymentUuid: testApplicationDeploymentUuid,
                  query: {
                    queryType: "boxedQueryWithExtractorCombinerTransformer",
                    deploymentUuid: testApplicationDeploymentUuid,
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
            ],
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
                    transformerType: "count",
                    interpolation: "runtime",
                    applyTo: {
                      referenceType: "referencedTransformer",
                      reference: {
                        transformerType: "contextReference",
                        interpolation: "runtime",
                        referencePath: ["entityBookList", "books"],
                      }
                    },
                  },
                  expectedValue: { count: 6 },
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
                  expectedValue: [book3, book4, book6, book5, book1, book2],
                },
              },
            },
          ],
        },
        "Remove Book instance": {
          testType: "testCompositeAction",
          testLabel: "Remove Book instance",
          compositeAction: {
            actionType: "compositeAction",
            actionLabel: "AddBookInstanceThenRollback",
            actionName: "sequence",
            definition: [
              {
                actionName: "rollback",
                actionType: "modelAction",
                actionLabel: "refreshMiroirLocalCache",
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
              },
              {
                actionName: "rollback",
                actionType: "modelAction",
                actionLabel: "refreshLibraryLocalCache",
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                deploymentUuid: testApplicationDeploymentUuid,
              },
              {
                actionType: "instanceAction",
                actionName: "deleteInstance",
                actionLabel: "deleteBook2",
                endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
                applicationSection: "data",
                deploymentUuid: testApplicationDeploymentUuid,
                objects: [
                  {
                    parentName: book2.parentName,
                    parentUuid: book2.parentUuid,
                    applicationSection: "data",
                    instances: [book2 as EntityInstance],
                  },
                ],
              },
              {
                actionType: "compositeRunBoxedExtractorOrQueryAction",
                actionLabel: "calculateNewEntityDefinionAndReports",
                nameGivenToResult: "entityBookList",
                query: {
                  actionType: "runBoxedExtractorOrQueryAction",
                  actionName: "runQuery",
                  endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                  applicationSection: "data", // TODO: give only selfApplication section in individual queries?
                  deploymentUuid: testApplicationDeploymentUuid,
                  query: {
                    queryType: "boxedQueryWithExtractorCombinerTransformer",
                    deploymentUuid: testApplicationDeploymentUuid,
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
            ],
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
                    transformerType: "count",
                    interpolation: "runtime",
                    applyTo: {
                      referenceType: "referencedTransformer",
                      reference: {
                        transformerType: "contextReference",
                        interpolation: "runtime",
                        referencePath: ["entityBookList", "books"],
                      }
                    },
                  },
                  expectedValue: { count: 4 },
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
          compositeAction: {
            actionType: "compositeAction",
            actionLabel: "AddBookInstanceThenRollback",
            actionName: "sequence",
            definition: [
              {
                actionName: "rollback",
                actionType: "modelAction",
                actionLabel: "refreshMiroirLocalCache",
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
              },
              {
                actionName: "rollback",
                actionType: "modelAction",
                actionLabel: "refreshLibraryLocalCache",
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                deploymentUuid: testApplicationDeploymentUuid,
              },
              {
                actionType: "instanceAction",
                actionName: "deleteInstance",
                actionLabel: "addBook3",
                endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
                applicationSection: "data",
                deploymentUuid: testApplicationDeploymentUuid,
                objects: [
                  {
                    parentName: book2.parentName,
                    parentUuid: book2.parentUuid,
                    applicationSection: "data",
                    instances: [book2 as EntityInstance],
                  },
                ],
              },
              {
                actionName: "rollback",
                actionType: "modelAction",
                actionLabel: "refreshLibraryLocalCache",
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                deploymentUuid: testApplicationDeploymentUuid,
              },
              {
                actionType: "compositeRunBoxedExtractorOrQueryAction",
                actionLabel: "calculateNewEntityDefinionAndReports",
                nameGivenToResult: "entityBookList",
                query: {
                  actionType: "runBoxedExtractorOrQueryAction",
                  actionName: "runQuery",
                  endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                  applicationSection: "data", // TODO: give only selfApplication section in individual queries?
                  deploymentUuid: testApplicationDeploymentUuid,
                  query: {
                    queryType: "boxedQueryWithExtractorCombinerTransformer",
                    deploymentUuid: testApplicationDeploymentUuid,
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
            ],
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
                    transformerType: "count",
                    interpolation: "runtime",
                    applyTo: {
                      referenceType: "referencedTransformer",
                      reference: {
                        transformerType: "contextReference",
                        interpolation: "runtime",
                        referencePath: ["entityBookList", "books"],
                      }
                    },
                  },
                  expectedValue: { count: 4 },
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
          compositeAction: {
            actionType: "compositeAction",
            actionLabel: "AddBookInstanceThenRollback",
            actionName: "sequence",
            definition: [
              {
                actionName: "rollback",
                actionType: "modelAction",
                actionLabel: "refreshMiroirLocalCache",
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
              },
              {
                actionName: "rollback",
                actionType: "modelAction",
                actionLabel: "refreshLibraryLocalCache",
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                deploymentUuid: testApplicationDeploymentUuid,
              },
              {
                actionType: "instanceAction",
                actionName: "updateInstance",
                actionLabel: "updateBook2",
                endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
                applicationSection: "data",
                deploymentUuid: testApplicationDeploymentUuid,
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
              {
                actionType: "compositeRunBoxedExtractorOrQueryAction",
                actionLabel: "calculateNewEntityDefinionAndReports",
                nameGivenToResult: "entityBookList",
                query: {
                  actionType: "runBoxedExtractorOrQueryAction",
                  actionName: "runQuery",
                  endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                  applicationSection: "data", // TODO: give only selfApplication section in individual queries?
                  deploymentUuid: testApplicationDeploymentUuid,
                  query: {
                    queryType: "boxedQueryWithExtractorCombinerTransformer",
                    deploymentUuid: testApplicationDeploymentUuid,
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
            ],
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
                    transformerType: "count",
                    interpolation: "runtime",
                    applyTo: {
                      referenceType: "referencedTransformer",
                      reference: {
                        transformerType: "contextReference",
                        interpolation: "runtime",
                        referencePath: ["entityBookList", "books"],
                      }
                    },
                  },
                  expectedValue: { count: 5 },
                  // expectedValue: { count: 6 },
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
      async (currentTestSuiteName, testAction: TestActionParams) => {
        const testSuiteResults = await runTestOrTestSuite(localCache, domainController, testAction);
        if (testSuiteResults.status !== "ok") {
          expect(testSuiteResults.status, `${currentTestSuiteName} failed!`).toBe("ok");
        }
      },
      globalTimeOut
    );
  } //  end describe('DomainController.Data.CRUD.React',
);
