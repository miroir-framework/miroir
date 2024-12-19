import { describe, expect } from 'vitest';

// import process from "process";

import {
  ActionReturnType,
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
  defaultLevels,
  DomainControllerInterface,
  entityAuthor,
  entityBook,
  EntityDefinition,
  entityDefinitionAuthor,
  entityDefinitionBook,
  entityDefinitionPublisher,
  EntityInstance,
  entityPublisher,
  getLoggerName,
  LoggerInterface,
  MetaEntity,
  MiroirContextInterface,
  miroirCoreStartup,
  MiroirLoggerFactory,
  PersistenceStoreControllerManagerInterface,
  publisher1,
  publisher2,
  publisher3,
  SelfApplicationDeploymentConfiguration,
  selfApplicationDeploymentMiroir
} from "miroir-core";

import {
  chainVitestSteps,
  createDeploymentCompositeAction,
  loadTestConfigFiles,
  miroirBeforeEach_resetAndInitApplicationDeployments,
  setupMiroirTest,
  TestActionParams
} from "../utils/tests-utils.js";



import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";
import { miroirIndexedDbStoreSectionStartup } from "miroir-store-indexedDb";
import { miroirPostgresStoreSectionStartup } from "miroir-store-postgres";
import { miroirAppStartup } from "../../src/startup.js";

import { LocalCache } from "miroir-localcache-redux";

import { ConfigurationService, defaultMiroirMetaModel } from "miroir-core";
import { packageName } from "../../src/constants.js";
import { loglevelnext } from '../../src/loglevelnextImporter.js';
import { ApplicationEntitiesAndInstances, testOnLibrary_afterEach_deleteLibraryDeployment, testOnLibrary_afterEach_resetLibraryDeployment, testOnLibrary_resetInitAndAddTestDataToLibraryDeployment } from "../utils/tests-utils-testOnLibrary.js";
import { cleanLevel } from "./constants.js";


// jest intercepts logs, only console.log will produce test output
// const loggerName: string = getLoggerName(packageName, cleanLevel,"DomainController.Data.CRUD.React");
// let log:LoggerInterface = console as any as LoggerInterface;
// MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
//   (value: LoggerInterface) => {
//     log = value;
//   }
// );


const env:any = (import.meta as any).env
console.log("@@@@@@@@@@@@@@@@@@ env", env);

const {miroirConfig, logConfig:loggerOptions} = await loadTestConfigFiles(env);

MiroirLoggerFactory.setEffectiveLoggerFactory(
  loglevelnext,
  (defaultLevels as any)[loggerOptions.defaultLevel],
  loggerOptions.defaultTemplate,
  loggerOptions.specificLoggerOptions
);

const loggerName: string = getLoggerName(packageName, cleanLevel,"DomainController.Data.CRUD.React");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
  (value: LoggerInterface) => {
    log = value;
  }
);

console.log("@@@@@@@@@@@@@@@@@@ miroirConfig", miroirConfig);


let domainController: DomainControllerInterface;
// let localAppPersistenceStoreController: PersistenceStoreControllerInterface;
// let localMiroirPersistenceStoreController: PersistenceStoreControllerInterface;
let localCache: LocalCache;
let miroirContext: MiroirContextInterface;
let persistenceStoreControllerManager: PersistenceStoreControllerManagerInterface;

export const libraryEntitiesAndInstancesWithoutBook3: ApplicationEntitiesAndInstances  = [
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


beforeAll(
  async () => {
    // Establish requests interception layer before all tests.
    miroirAppStartup();
    miroirCoreStartup();
    miroirFileSystemStoreSectionStartup();
    miroirIndexedDbStoreSectionStartup();
    miroirPostgresStoreSectionStartup();
    ConfigurationService.registerTestImplementation({expect: expect as any});
    const {
      persistenceStoreControllerManager: localpersistenceStoreControllerManager,
      domainController: localdomainController,
      localCache: locallocalCache,
      miroirContext: localmiroirContext,
    } = await setupMiroirTest(miroirConfig);

    persistenceStoreControllerManager = localpersistenceStoreControllerManager;
    domainController = localdomainController;
    localCache = locallocalCache;
    miroirContext = localmiroirContext;

    const createMiroirDeploymentCompositeAction = createDeploymentCompositeAction(miroirConfig, adminConfigurationDeploymentMiroir.uuid);
    const createDeploymentResult = await domainController.handleCompositeAction(createMiroirDeploymentCompositeAction, defaultMiroirMetaModel);
    if (createDeploymentResult.status !== "ok") {
      throw new Error("Failed to create Miroir deployment: " + JSON.stringify(createDeploymentResult));
    }

    return Promise.resolve();
  }
)

beforeEach(
  async () => {
    await miroirBeforeEach_resetAndInitApplicationDeployments(
      miroirConfig,
      domainController,
      [
        {
          adminConfigurationDeployment: adminConfigurationDeploymentMiroir,
          selfApplicationDeployment: selfApplicationDeploymentMiroir as SelfApplicationDeploymentConfiguration,
        },
      ],
    );
  }
)

// afterAll(
//   async () => {
//     await deleteAndCloseApplicationDeployments(
//       miroirConfig,
//       domainController,
//       deploymentConfigurations,
//     );
//   }
// )

const globalTimeOut = 10000;
// const globalTimeOut = 10^9;

const testActions: Record<string, TestActionParams> = {
  "DomainController.Data.CRUD.integ": {
    testActionType: "testCompositeActionSuite",
    deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
    testCompositeAction: {
      testType: "testCompositeActionSuite",
      beforeAll: createDeploymentCompositeAction(miroirConfig, adminConfigurationDeploymentLibrary.uuid),
      beforeEach: testOnLibrary_resetInitAndAddTestDataToLibraryDeployment(miroirConfig, libraryEntitiesAndInstancesWithoutBook3),
      afterEach: testOnLibrary_afterEach_resetLibraryDeployment(miroirConfig),
      afterAll: testOnLibrary_afterEach_deleteLibraryDeployment(miroirConfig),
      testCompositeActions: {
        "Refresh all Instances": {
          testType: "testCompositeAction",
          compositeAction: {
            actionType: "compositeAction",
            actionLabel: "testLibraryBooks",
            actionName: "sequence",
            definition: [
              {
                compositeActionType: "domainAction",
                compositeActionStepLabel: "refreshMiroirLocalCache",
                domainAction: {
                  actionName: "rollback",
                  actionType: "modelAction",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
                },
              },
              {
                compositeActionType: "domainAction",
                compositeActionStepLabel: "refreshLibraryLocalCache",
                domainAction: {
                  actionName: "rollback",
                  actionType: "modelAction",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                },
              },
              {
                compositeActionType: "runBoxedExtractorOrQueryAction",
                compositeActionStepLabel: "calculateNewEntityDefinionAndReports",
                nameGivenToResult: "entityBookList",
                query: {
                  actionType: "runBoxedExtractorOrQueryAction",
                  actionName: "runQuery",
                  endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                  applicationSection: "model", // TODO: give only application section in individual queries?
                  deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                  query: {
                    queryType: "boxedQueryWithExtractorCombinerTransformer",
                    deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                    pageParams: {
                      currentDeploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                    },
                    queryParams: {},
                    contextResults: {},
                    extractors: {
                      books: {
                        extractorOrCombinerType: "extractorByEntityReturningObjectList",
                        applicationSection: "data",
                        parentName: "Book",
                        parentUuid: entityBook.uuid,
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
              compositeActionType: "runTestCompositeActionAssertion",
              compositeActionStepLabel: "checkNumberOfBooks",
              nameGivenToResult: "checkNumberOfBooks",
              testAssertion: {
                testType: "testAssertion",
                definition: {
                  resultAccessPath: ["elementValue", "0"],
                  resultTransformer: {
                    transformerType: "count",
                    interpolation: "runtime",
                    referencedExtractor: {
                      transformerType: "contextReference",
                      interpolation: "runtime",
                      referencePath: ["entityBookList", "books"],
                    },
                  },
                  expectedValue: { count: 5 },
                },
              },
            },
            {
              compositeActionType: "runTestCompositeActionAssertion",
              compositeActionStepLabel: "checkEntityBook1",
              nameGivenToResult: "checkEntityBook1",
              testAssertion: {
                testType: "testAssertion",
                definition: {
                  resultAccessPath: ["entityBookList", "books", "0"],
                  expectedValue: book1,
                },
              },
            },
            {
              compositeActionType: "runTestCompositeActionAssertion",
              compositeActionStepLabel: "checkEntityBook2",
              nameGivenToResult: "checkEntityBook2",
              testAssertion: {
                testType: "testAssertion",
                definition: {
                  resultAccessPath: ["entityBookList", "books", "1"],
                  expectedValue: book2,
                },
              },
            },
            {
              compositeActionType: "runTestCompositeActionAssertion",
              compositeActionStepLabel: "checkEntityBook4",
              nameGivenToResult: "checkEntityBook4",
              testAssertion: {
                testType: "testAssertion",
                definition: {
                  resultAccessPath: ["entityBookList", "books", "2"],
                  expectedValue: book4,
                },
              },
            },
            {
              compositeActionType: "runTestCompositeActionAssertion",
              compositeActionStepLabel: "checkEntityBook4",
              nameGivenToResult: "checkEntityBook5",
              testAssertion: {
                testType: "testAssertion",
                definition: {
                  resultAccessPath: ["entityBookList", "books", "3"],
                  expectedValue: book5,
                },
              },
            },
            {
              compositeActionType: "runTestCompositeActionAssertion",
              compositeActionStepLabel: "checkEntityBook4",
              nameGivenToResult: "checkEntityBook6",
              testAssertion: {
                testType: "testAssertion",
                definition: {
                  resultAccessPath: ["entityBookList", "books", "4"],
                  expectedValue: book6,
                },
              },
            },
          ],
        },
        "Add Book instance": {
          testType: "testCompositeAction",
          compositeAction: {
            actionType: "compositeAction",
            actionLabel: "AddBookInstanceThenRollback",
            actionName: "sequence",
            definition: [
              {
                compositeActionType: "domainAction",
                compositeActionStepLabel: "refreshMiroirLocalCache",
                domainAction: {
                  actionName: "rollback",
                  actionType: "modelAction",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
                },
              },
              {
                compositeActionType: "domainAction",
                compositeActionStepLabel: "refreshLibraryLocalCache",
                domainAction: {
                  actionName: "rollback",
                  actionType: "modelAction",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                },
              },
              {
                compositeActionType: "domainAction",
                compositeActionStepLabel: "addBook3",
                domainAction: {
                  actionType: "instanceAction",
                  actionName: "createInstance",
                  endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
                  applicationSection: "data",
                  deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
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
                compositeActionType: "runBoxedExtractorOrQueryAction",
                compositeActionStepLabel: "calculateNewEntityDefinionAndReports",
                nameGivenToResult: "entityBookList",
                query: {
                  actionType: "runBoxedExtractorOrQueryAction",
                  actionName: "runQuery",
                  endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                  applicationSection: "model", // TODO: give only application section in individual queries?
                  deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                  query: {
                    queryType: "boxedQueryWithExtractorCombinerTransformer",
                    deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                    pageParams: {
                      currentDeploymentUuid: adminConfigurationDeploymentLibrary.uuid,
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
                    // runtimeTransformers: {
                    //   sortedBooks: {
                    //     transformerType: "mapperListToList",
                    //     interpolation: "runtime",
                    //     referencedExtractor: "books",
                    //     orderBy: "uuid",
                    //     elementTransformer: "books"
                    //     // sortParams: {
                    //     //   sortField: "title",
                    //     //   sortDirection: "asc",
                    //     // }
                    // }
                  },
                },
              },
            ],
          },
          testCompositeActionAssertions: [
            // TODO: test length of entityBookList.books!
            {
              compositeActionType: "runTestCompositeActionAssertion",
              compositeActionStepLabel: "checkNumberOfBooks",
              nameGivenToResult: "checkNumberOfBooks",
              testAssertion: {
                testType: "testAssertion",
                definition: {
                  resultAccessPath: ["elementValue", "0"],
                  resultTransformer: {
                    transformerType: "count",
                    interpolation: "runtime",
                    referencedExtractor: {
                      transformerType: "contextReference",
                      interpolation: "runtime",
                      referencePath: ["entityBookList", "books"],
                    },
                  },
                  expectedValue: { count: 6 },
                },
              },
            },
            {
              compositeActionType: "runTestCompositeActionAssertion",
              compositeActionStepLabel: "checkEntityBook1",
              nameGivenToResult: "checkEntityBook1",
              testAssertion: {
                testType: "testAssertion",
                definition: {
                  resultAccessPath: ["entityBookList", "books", "0"],
                  expectedValue: book3,
                },
              },
            },
            {
              compositeActionType: "runTestCompositeActionAssertion",
              compositeActionStepLabel: "checkEntityBook2",
              nameGivenToResult: "checkEntityBook2",
              testAssertion: {
                testType: "testAssertion",
                definition: {
                  resultAccessPath: ["entityBookList", "books", "1"],
                  expectedValue: book4,
                },
              },
            },
            {
              compositeActionType: "runTestCompositeActionAssertion",
              compositeActionStepLabel: "checkEntityBook3",
              nameGivenToResult: "checkEntityBook3",
              testAssertion: {
                testType: "testAssertion",
                definition: {
                  resultAccessPath: ["entityBookList", "books", "2"],
                  expectedValue: book6,
                },
              },
            },
            {
              compositeActionType: "runTestCompositeActionAssertion",
              compositeActionStepLabel: "checkEntityBook4",
              nameGivenToResult: "checkEntityBook4",
              testAssertion: {
                testType: "testAssertion",
                definition: {
                  resultAccessPath: ["entityBookList", "books", "3"],
                  expectedValue: book5,
                },
              },
            },
            {
              compositeActionType: "runTestCompositeActionAssertion",
              compositeActionStepLabel: "checkEntityBook5",
              nameGivenToResult: "checkEntityBook5",
              testAssertion: {
                testType: "testAssertion",
                definition: {
                  resultAccessPath: ["entityBookList", "books", "4"],
                  expectedValue: book1,
                },
              },
            },
            {
              compositeActionType: "runTestCompositeActionAssertion",
              compositeActionStepLabel: "checkEntityBook6",
              nameGivenToResult: "checkEntityBook6",
              testAssertion: {
                testType: "testAssertion",
                definition: {
                  resultAccessPath: ["entityBookList", "books", "5"],
                  expectedValue: book2,
                },
              },
            },
          ],
        },
        "Add Book instance then rollback": {
          testType: "testCompositeAction",
          compositeAction: {
            actionType: "compositeAction",
            actionLabel: "AddBookInstanceThenRollback",
            actionName: "sequence",
            definition: [
              {
                compositeActionType: "domainAction",
                compositeActionStepLabel: "refreshMiroirLocalCache",
                domainAction: {
                  actionName: "rollback",
                  actionType: "modelAction",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
                },
              },
              {
                compositeActionType: "domainAction",
                compositeActionStepLabel: "refreshLibraryLocalCache",
                domainAction: {
                  actionName: "rollback",
                  actionType: "modelAction",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                },
              },
              {
                compositeActionType: "domainAction",
                compositeActionStepLabel: "addBook3",
                domainAction: {
                  actionType: "instanceAction",
                  actionName: "createInstance",
                  endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
                  applicationSection: "data",
                  deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
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
                compositeActionType: "runBoxedExtractorOrQueryAction",
                compositeActionStepLabel: "calculateNewEntityDefinionAndReports",
                nameGivenToResult: "entityBookList",
                query: {
                  actionType: "runBoxedExtractorOrQueryAction",
                  actionName: "runQuery",
                  endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                  applicationSection: "model", // TODO: give only application section in individual queries?
                  deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                  query: {
                    queryType: "boxedQueryWithExtractorCombinerTransformer",
                    deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                    pageParams: {
                      currentDeploymentUuid: adminConfigurationDeploymentLibrary.uuid,
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
                    // runtimeTransformers: {
                    //   sortedBooks: {
                    //     transformerType: "mapperListToList",
                    //     interpolation: "runtime",
                    //     referencedExtractor: "books",
                    //     orderBy: "uuid",
                    //     elementTransformer: "books"
                    //     // sortParams: {
                    //     //   sortField: "title",
                    //     //   sortDirection: "asc",
                    //     // }
                    // }
                  },
                },
              },
            ],
          },
          testCompositeActionAssertions: [
            // TODO: test length of entityBookList.books!
            {
              compositeActionType: "runTestCompositeActionAssertion",
              compositeActionStepLabel: "checkNumberOfBooks",
              nameGivenToResult: "checkNumberOfBooks",
              testAssertion: {
                testType: "testAssertion",
                definition: {
                  resultAccessPath: ["elementValue", "0"],
                  resultTransformer: {
                    transformerType: "count",
                    interpolation: "runtime",
                    referencedExtractor: {
                      transformerType: "contextReference",
                      interpolation: "runtime",
                      referencePath: ["entityBookList", "books"],
                    },
                  },
                  expectedValue: { count: 6 },
                },
              },
            },
            {
              compositeActionType: "runTestCompositeActionAssertion",
              compositeActionStepLabel: "checkEntityBook1",
              nameGivenToResult: "checkEntityBook1",
              testAssertion: {
                testType: "testAssertion",
                definition: {
                  resultAccessPath: ["entityBookList", "books", "0"],
                  expectedValue: book3,
                },
              },
            },
            {
              compositeActionType: "runTestCompositeActionAssertion",
              compositeActionStepLabel: "checkEntityBook2",
              nameGivenToResult: "checkEntityBook2",
              testAssertion: {
                testType: "testAssertion",
                definition: {
                  resultAccessPath: ["entityBookList", "books", "1"],
                  expectedValue: book4,
                },
              },
            },
            {
              compositeActionType: "runTestCompositeActionAssertion",
              compositeActionStepLabel: "checkEntityBook3",
              nameGivenToResult: "checkEntityBook3",
              testAssertion: {
                testType: "testAssertion",
                definition: {
                  resultAccessPath: ["entityBookList", "books", "2"],
                  expectedValue: book6,
                },
              },
            },
            {
              compositeActionType: "runTestCompositeActionAssertion",
              compositeActionStepLabel: "checkEntityBook4",
              nameGivenToResult: "checkEntityBook4",
              testAssertion: {
                testType: "testAssertion",
                definition: {
                  resultAccessPath: ["entityBookList", "books", "3"],
                  expectedValue: book5,
                },
              },
            },
            {
              compositeActionType: "runTestCompositeActionAssertion",
              compositeActionStepLabel: "checkEntityBook5",
              nameGivenToResult: "checkEntityBook5",
              testAssertion: {
                testType: "testAssertion",
                definition: {
                  resultAccessPath: ["entityBookList", "books", "4"],
                  expectedValue: book1,
                },
              },
            },
            {
              compositeActionType: "runTestCompositeActionAssertion",
              compositeActionStepLabel: "checkEntityBook6",
              nameGivenToResult: "checkEntityBook6",
              testAssertion: {
                testType: "testAssertion",
                definition: {
                  resultAccessPath: ["entityBookList", "books", "5"],
                  expectedValue: book2,
                },
              },
            },
          ],
        },
        "Remove Book instance": {
          testType: "testCompositeAction",
          compositeAction: {
            actionType: "compositeAction",
            actionLabel: "AddBookInstanceThenRollback",
            actionName: "sequence",
            definition: [
              {
                compositeActionType: "domainAction",
                compositeActionStepLabel: "refreshMiroirLocalCache",
                domainAction: {
                  actionName: "rollback",
                  actionType: "modelAction",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
                },
              },
              {
                compositeActionType: "domainAction",
                compositeActionStepLabel: "refreshLibraryLocalCache",
                domainAction: {
                  actionName: "rollback",
                  actionType: "modelAction",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                },
              },
              {
                compositeActionType: "domainAction",
                compositeActionStepLabel: "deleteBook2",
                domainAction: {
                  actionType: "instanceAction",
                  actionName: "deleteInstance",
                  endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
                  applicationSection: "data",
                  deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
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
                compositeActionType: "runBoxedExtractorOrQueryAction",
                compositeActionStepLabel: "calculateNewEntityDefinionAndReports",
                nameGivenToResult: "entityBookList",
                query: {
                  actionType: "runBoxedExtractorOrQueryAction",
                  actionName: "runQuery",
                  endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                  applicationSection: "model", // TODO: give only application section in individual queries?
                  deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                  query: {
                    queryType: "boxedQueryWithExtractorCombinerTransformer",
                    deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                    pageParams: {
                      currentDeploymentUuid: adminConfigurationDeploymentLibrary.uuid,
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
              compositeActionType: "runTestCompositeActionAssertion",
              compositeActionStepLabel: "checkNumberOfBooks",
              nameGivenToResult: "checkNumberOfBooks",
              testAssertion: {
                testType: "testAssertion",
                definition: {
                  resultAccessPath: ["elementValue", "0"],
                  resultTransformer: {
                    transformerType: "count",
                    interpolation: "runtime",
                    referencedExtractor: {
                      transformerType: "contextReference",
                      interpolation: "runtime",
                      referencePath: ["entityBookList", "books"],
                    },
                  },
                  expectedValue: { count: 4 },
                },
              },
            },
            {
              compositeActionType: "runTestCompositeActionAssertion",
              compositeActionStepLabel: "checkEntityBooks",
              nameGivenToResult: "checkEntityBooks",
              testAssertion: {
                testType: "testAssertion",
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
          compositeAction: {
            actionType: "compositeAction",
            actionLabel: "AddBookInstanceThenRollback",
            actionName: "sequence",
            definition: [
              {
                compositeActionType: "domainAction",
                compositeActionStepLabel: "refreshMiroirLocalCache",
                domainAction: {
                  actionName: "rollback",
                  actionType: "modelAction",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
                },
              },
              {
                compositeActionType: "domainAction",
                compositeActionStepLabel: "refreshLibraryLocalCache",
                domainAction: {
                  actionName: "rollback",
                  actionType: "modelAction",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                },
              },
              {
                compositeActionType: "domainAction",
                compositeActionStepLabel: "addBook3",
                domainAction: {
                  actionType: "instanceAction",
                  actionName: "deleteInstance",
                  endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
                  applicationSection: "data",
                  deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
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
                compositeActionType: "domainAction",
                compositeActionStepLabel: "refreshLibraryLocalCache",
                domainAction: {
                  actionName: "rollback",
                  actionType: "modelAction",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                },
              },
              {
                compositeActionType: "runBoxedExtractorOrQueryAction",
                compositeActionStepLabel: "calculateNewEntityDefinionAndReports",
                nameGivenToResult: "entityBookList",
                query: {
                  actionType: "runBoxedExtractorOrQueryAction",
                  actionName: "runQuery",
                  endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                  applicationSection: "model", // TODO: give only application section in individual queries?
                  deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                  query: {
                    queryType: "boxedQueryWithExtractorCombinerTransformer",
                    deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                    pageParams: {
                      currentDeploymentUuid: adminConfigurationDeploymentLibrary.uuid,
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
              compositeActionType: "runTestCompositeActionAssertion",
              compositeActionStepLabel: "checkNumberOfBooks",
              nameGivenToResult: "checkNumberOfBooks",
              testAssertion: {
                testType: "testAssertion",
                definition: {
                  resultAccessPath: ["elementValue", "0"],
                  resultTransformer: {
                    transformerType: "count",
                    interpolation: "runtime",
                    referencedExtractor: {
                      transformerType: "contextReference",
                      interpolation: "runtime",
                      referencePath: ["entityBookList", "books"],
                    },
                  },
                  expectedValue: { count: 4 },
                },
              },
            },
            {
              compositeActionType: "runTestCompositeActionAssertion",
              compositeActionStepLabel: "checkEntityBooks",
              nameGivenToResult: "checkEntityBooks",
              testAssertion: {
                testType: "testAssertion",
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
          compositeAction: {
            actionType: "compositeAction",
            actionLabel: "AddBookInstanceThenRollback",
            actionName: "sequence",
            definition: [
              {
                compositeActionType: "domainAction",
                compositeActionStepLabel: "refreshMiroirLocalCache",
                domainAction: {
                  actionName: "rollback",
                  actionType: "modelAction",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
                },
              },
              {
                compositeActionType: "domainAction",
                compositeActionStepLabel: "refreshLibraryLocalCache",
                domainAction: {
                  actionName: "rollback",
                  actionType: "modelAction",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                },
              },
              {
                compositeActionType: "domainAction",
                compositeActionStepLabel: "deleteBook2",
                domainAction: {
                  actionType: "instanceAction",
                  actionName: "updateInstance",
                  endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
                  applicationSection: "data",
                  deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
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
                compositeActionType: "runBoxedExtractorOrQueryAction",
                compositeActionStepLabel: "calculateNewEntityDefinionAndReports",
                nameGivenToResult: "entityBookList",
                query: {
                  actionType: "runBoxedExtractorOrQueryAction",
                  actionName: "runQuery",
                  endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                  applicationSection: "model", // TODO: give only application section in individual queries?
                  deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                  query: {
                    queryType: "boxedQueryWithExtractorCombinerTransformer",
                    deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                    pageParams: {
                      currentDeploymentUuid: adminConfigurationDeploymentLibrary.uuid,
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
              compositeActionType: "runTestCompositeActionAssertion",
              compositeActionStepLabel: "checkNumberOfBooks",
              nameGivenToResult: "checkNumberOfBooks",
              testAssertion: {
                testType: "testAssertion",
                definition: {
                  resultAccessPath: ["elementValue", "0"],
                  resultTransformer: {
                    transformerType: "count",
                    interpolation: "runtime",
                    referencedExtractor: {
                      transformerType: "contextReference",
                      interpolation: "runtime",
                      referencePath: ["entityBookList", "books"],
                    },
                  },
                  expectedValue: { count: 5 },
                },
              },
            },
            {
              compositeActionType: "runTestCompositeActionAssertion",
              compositeActionStepLabel: "checkEntityBooks",
              nameGivenToResult: "checkEntityBooks",
              testAssertion: {
                testType: "testAssertion",
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


describe.sequential("DomainController.Data.CRUD.integ",
  () => {
  it.each(Object.entries(testActions))("test %s", async (currentTestName, testAction: TestActionParams) => {
    // const fullTestName = describe.sequential.name + "/" + currentTestName
    const fullTestName = expect.getState().currentTestName ?? "no test name";
    console.info("STARTING test:", fullTestName);
    // expect(currentTestName != undefined).toBeTruthy();
    // expect(testParams.testAssertions).toBeDefined();

    await chainVitestSteps(
      fullTestName,
      {},
      async () => {
        switch (testAction.testActionType) {
          case "testCompositeActionSuite": {
            const queryResult: ActionReturnType = await domainController.handleTestCompositeActionSuite(
              testAction.testCompositeAction,
              {},
              localCache.currentModel(testAction.deploymentUuid)
            );
            console.log(
              "test testCompositeActionSuite",
              fullTestName,
              ": queryResult=",
              JSON.stringify(queryResult, null, 2)
            );
            return queryResult;
          }
          case "testCompositeAction": {
            const queryResult: ActionReturnType = await domainController.handleTestCompositeAction(
              testAction.testCompositeAction,
              {},
              localCache.currentModel(testAction.deploymentUuid)
            );
            console.log(
              "test testCompositeAction",
              fullTestName,
              ": queryResult=",
              JSON.stringify(queryResult, null, 2)
            );
            return queryResult;
          }
          case "testCompositeActionTemplate": {
            throw new Error("testCompositeActionTemplate not implemented yet!");
          }
        }
      },
      undefined, // expected result transformation
      undefined, // name to give to result
      "void",
      undefined // expectedValue
    );
  }, globalTimeOut);

  } //  end describe('DomainController.Data.CRUD.React',
)
