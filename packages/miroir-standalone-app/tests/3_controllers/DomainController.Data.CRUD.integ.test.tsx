import { act, getAllByRole, getByText, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
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
  CompositeAction,
  defaultLevels,
  defaultMiroirMetaModel,
  DomainControllerInterface,
  entityAuthor,
  entityBook,
  EntityDefinition,
  entityDefinitionAuthor,
  entityDefinitionBook,
  entityDefinitionPublisher,
  entityEntity,
  EntityInstance,
  entityPublisher,
  getLoggerName,
  InstanceAction,
  LoggerInterface,
  MetaEntity,
  MiroirConfigClient,
  MiroirContextInterface,
  miroirCoreStartup,
  MiroirLoggerFactory,
  PersistenceStoreControllerInterface,
  PersistenceStoreControllerManagerInterface,
  publisher1,
  publisher2,
  publisher3,
  SelfApplicationDeploymentConfiguration,
  selfApplicationDeploymentLibrary,
  selfApplicationDeploymentMiroir,
  selfApplicationMiroir,
  selfApplicationModelBranchMiroirMasterBranch,
  selfApplicationStoreBasedConfigurationMiroir,
  selfApplicationVersionInitialMiroirVersion
} from "miroir-core";

import {
  chainVitestSteps,
  createLibraryTestStore,
  deploymentConfigurations,
  DisplayLoadingInfo,
  loadTestConfigFiles,
  miroirAfterAll,
  miroirAfterEach,
  miroirBeforeAll,
  miroirBeforeEach,
  renderWithProviders,
  setupMiroirTest,
  TestActionParams
} from "../utils/tests-utils.js"



import { miroirAppStartup } from "../../src/startup.js";
import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";
import { miroirIndexedDbStoreSectionStartup } from "miroir-store-indexedDb";
import { miroirPostgresStoreSectionStartup } from "miroir-store-postgres";

import { LocalCache } from "miroir-localcache-redux";
import { TestUtilsTableComponent } from "../utils/TestUtilsTableComponent.js";

import { loglevelnext } from '../../src/loglevelnextImporter.js';
import { packageName } from "../../src/constants.js";
import { cleanLevel } from "./constants.js";
import { ApplicationEntitiesAndInstances, testOnLibrary_afterAll, testOnLibrary_afterEach, testOnLibrary_beforeAll, testOnLibrary_beforeEach } from "../utils/tests-utils-testOnLibrary.js";
import { ConfigurationService } from "miroir-core";


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
let localAppPersistenceStoreController: PersistenceStoreControllerInterface;
let localCache: LocalCache;
let localMiroirPersistenceStoreController: PersistenceStoreControllerInterface;
let miroirContext: MiroirContextInterface;
let persistenceStoreControllerManager: PersistenceStoreControllerManagerInterface;

export const libraryEntitiesAndInstances: ApplicationEntitiesAndInstances  = [
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

    const wrapped = await miroirBeforeAll(
      miroirConfig as MiroirConfigClient,
      persistenceStoreControllerManager,
      domainController,
    );
    if (wrapped) {
      if (wrapped.localMiroirPersistenceStoreController && wrapped.localAppPersistenceStoreController) {
        localMiroirPersistenceStoreController = wrapped.localMiroirPersistenceStoreController;
        localAppPersistenceStoreController = wrapped.localAppPersistenceStoreController;
      }
    } else {
      throw new Error("beforeAll failed initialization!");
    }
    await createLibraryTestStore(
      miroirConfig,
      domainController
    )

    return Promise.resolve();
  }
)

beforeEach(
  async () => {
    await miroirBeforeEach(
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
//     await miroirAfterAll(
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
      // beforeAll: testOnLibrary_beforeAll(miroirConfig),
      beforeEach: testOnLibrary_beforeEach(miroirConfig, libraryEntitiesAndInstances),
      afterEach: testOnLibrary_afterEach(miroirConfig),
      afterAll: testOnLibrary_afterAll(miroirConfig),
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
                    }
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
        "Remove Book instance":{
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

    // // ###########################################################################################
    // it('Refresh all Instances',
    //   async() => {
    //     try {
    //       log.info("Refresh all Instances start");
    //       // const displayLoadingInfo = <DisplayLoadingInfo />;
    //       // const user = (userEvent as any).setup();
      
    //       // const {
    //       //   getByText,
    //       //   getAllByRole,
    //       //   // container
    //       // } = renderWithProviders(
    //       //   <TestUtilsTableComponent
    //       //     entityName={entityBook.name}
    //       //     entityUuid={entityBook.uuid}
    //       //     DisplayLoadingInfo={displayLoadingInfo}
    //       //     deploymentUuid={adminConfigurationDeploymentLibrary.uuid}
    //       //   />,
    //       //   { store: localCache.getInnerStore() }
    //       // );
      
    //       log.info("Refresh all Instances setup is finished.")
      
    //       await act(async () => {
    //         await domainController.handleAction({
    //           actionType: "modelAction",
    //           actionName: "rollback",
    //           deploymentUuid:adminConfigurationDeploymentMiroir.uuid,
    //           endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
    //         }, defaultMiroirMetaModel);
    //         await domainController.handleAction({
    //           actionType: "modelAction",
    //           actionName: "rollback",
    //           deploymentUuid:adminConfigurationDeploymentLibrary.uuid,
    //           endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
    //         }, defaultMiroirMetaModel);
    //       });
      
    //       log.info("Refresh all Instances start test", JSON.stringify(localCache.getState()));
          
    //       await act(()=>user.click(screen.getByRole("button")));
      
    //       await waitFor(() => {
    //         getAllByRole(/step:1/);
    //       }).then(() => {
    //         expect(screen.queryByText(new RegExp(`${book3.uuid}`, "i"))).toBeNull(); // Et dans l'éternité je ne m'ennuierai pas
    //         expect(getByText(new RegExp(`${book1.uuid}`, "i"))).toBeTruthy(); // The Bride Wore Black
    //         expect(getByText(new RegExp(`${book2.uuid}`, "i"))).toBeTruthy(); // The Design of Everyday Things
    //         expect(getByText(new RegExp(`${book4.uuid}`, "i"))).toBeTruthy(); // Rear Window
    //       });
    //     } catch (error) {
    //       log.error("error during test", expect.getState().currentTestName, error);
    //       expect(false).toBeTruthy();
    //     }
    //     return Promise.resolve();
      
    //   },
    //   globalTimeOut
    // )

    // // ###########################################################################################
    // it('Add Book instance then rollback',
    //   async () => {
    //     try {
    //       console.log('Add Book instance then rollback start');
  
    //       const displayLoadingInfo=<DisplayLoadingInfo reportUuid={entityBook.uuid}/>
    //       const user = (userEvent as any).setup()
  
    //       const {
    //         getByText,
    //         getAllByRole,
    //         // container
    //       } = renderWithProviders(
    //         <TestUtilsTableComponent
    //           entityUuid={entityBook.uuid}
    //           DisplayLoadingInfo={displayLoadingInfo}
    //           deploymentUuid={adminConfigurationDeploymentLibrary.uuid}
    //         />
    //         ,
    //         {store:localCache.getInnerStore()}
    //       );
  
    //       // ##########################################################################################################
    //       console.log('add Book step 1: the Book must be absent in the local cache report list.')
    //       await act(
    //         async () => {
    //           await domainController.handleAction({
    //             actionType: "modelAction",
    //             actionName: "rollback",
    //             deploymentUuid:adminConfigurationDeploymentMiroir.uuid,
    //             endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
    //           }, localCache.currentModel(adminConfigurationDeploymentMiroir.uuid));
    //           await domainController.handleAction({
    //             actionType: "modelAction",
    //             actionName: "rollback",
    //             deploymentUuid:adminConfigurationDeploymentLibrary.uuid,
    //             endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
    //           }, localCache.currentModel(adminConfigurationDeploymentLibrary.uuid));
    //         }
    //       );
    //       console.log('add Book step 1: done replace.')
  
    //       await act(()=>user.click(screen.getByRole('button')));
  
    //       await waitFor(
    //         () => {
    //           getAllByRole(/step:1/)
    //         },
    //       ).then(
    //         ()=> {
    //           expect(screen.queryByText(new RegExp(`${book3.uuid}`,'i'))).toBeNull() // Et dans l'éternité je ne m'ennuierai pas
    //           expect(getByText(new RegExp(`${book1.uuid}`,'i'))).toBeTruthy() // The Bride Wore Black
    //           expect(getByText(new RegExp(`${book2.uuid}`,'i'))).toBeTruthy() // The Design of Everyday Things
    //           expect(getByText(new RegExp(`${book4.uuid}`,'i'))).toBeTruthy() // Rear Window
    //         }
    //       );

    //       // ##########################################################################################################
    //       console.log('add Book instance step 2: the Book must then be present in the local cache report list.')
    //       const createAction: InstanceAction = {
    //         actionType: "instanceAction",
    //         actionName: "createInstance",
    //         endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
    //         applicationSection: "data",
    //         deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
    //         objects:[{parentName:book3.parentName,parentUuid:book3.parentUuid,applicationSection:'data',instances:[book3 as EntityInstance]}]
    //       };

    //       await act(
    //         async () => {
    //           await domainController.handleAction(createAction);
    //         }
    //       );
  
    //       await act(()=>user.click(screen.getByRole('button')));
  
    //       console.log("domainController.currentTransaction()", domainController.currentTransaction());
    //       // data operations are not transactional
    //       expect(domainController.currentTransaction().length).toEqual(0);
    //       // expect(domainController.currentTransaction()[0]).toEqual(createAction);
  
    //       await waitFor(
    //         () => {
    //           getAllByRole(/step:2/)
    //         },
    //       ).then(
    //         ()=> {
    //           expect(getByText(new RegExp(`${book1.uuid}`,'i'))).toBeTruthy() // The Bride Wore Black
    //           expect(getByText(new RegExp(`${book2.uuid}`,'i'))).toBeTruthy() // The Design of Everyday Things
    //           expect(getByText(new RegExp(`${book3.uuid}`,'i'))).toBeTruthy() // Et dans l'éternité je ne m'ennuierai pas
    //           expect(getByText(new RegExp(`${book4.uuid}`,'i'))).toBeTruthy() // Rear Window
    //         }
    //       );

    //       // ##########################################################################################################
    //       console.log('add Book instance step 3: rollbacking/refreshing report list from remote store, added book must still be present in the report list.')
    //       await act(
    //         async () => {
    //           await domainController.handleAction({
    //             actionType: "modelAction",
    //             actionName: "rollback",
    //             deploymentUuid:adminConfigurationDeploymentLibrary.uuid,
    //             endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
    //           }, localCache.currentModel(adminConfigurationDeploymentLibrary.uuid));
    //         }
    //       );
  
    //       await act(()=>user.click(screen.getByRole('button')));
  
    //       console.log("domainController.currentTransaction()", domainController.currentTransaction());
    //       expect(domainController.currentTransaction().length).toEqual(0);
  
    //       await waitFor(
    //         () => {
    //           getAllByRole(/step:3/)
    //         },
    //       ).then(
    //         ()=> {
    //           expect(getByText(new RegExp(`${book1.uuid}`,'i'))).toBeTruthy() // The Bride Wore Black
    //           expect(getByText(new RegExp(`${book2.uuid}`,'i'))).toBeTruthy() // The Design of Everyday Things
    //           expect(getByText(new RegExp(`${book3.uuid}`,'i'))).toBeTruthy() // Et dans l'éternité je ne m'ennuierai pas
    //           expect(getByText(new RegExp(`${book4.uuid}`,'i'))).toBeTruthy() // Rear Window
    //         }
    //       );
    //     } catch (error) {
    //       console.error('error during test',expect.getState().currentTestName,error);
    //       expect(false).toBeTruthy();
    //     }
    //   }
    // )

    // // ###########################################################################################
    // it('Remove Book instance then rollback',
    //   async () => {

    //     try {
          
    //       console.log('Remove Book instance then rollback start');
  
    //       const displayLoadingInfo=<DisplayLoadingInfo reportUuid={entityBook.uuid}/>
    //       const user = (userEvent as any).setup()

    //       const {
    //         getByText,
    //         getAllByRole,
    //         // container
    //       } = renderWithProviders(
    //         <TestUtilsTableComponent
    //           // parentName="Book"
    //           entityUuid={entityBook.uuid}
    //           DisplayLoadingInfo={displayLoadingInfo}
    //           deploymentUuid={adminConfigurationDeploymentLibrary.uuid}
    //         />
    //         ,
    //         {store:localCache.getInnerStore()}
    //       );
  
    //       // ##########################################################################################################
    //       console.log('Remove Book instance step 1: the Book must be present in the local cache report list.')
    //       await act(
    //         async () => {
    //           await domainController.handleAction({
    //             actionType: "modelAction",
    //             actionName: "rollback",
    //             deploymentUuid:adminConfigurationDeploymentMiroir.uuid,
    //             endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
    //           }, localCache.currentModel(adminConfigurationDeploymentMiroir.uuid));
    //           await domainController.handleAction({
    //             actionType: "modelAction",
    //             actionName: "rollback",
    //             deploymentUuid:adminConfigurationDeploymentLibrary.uuid,
    //             endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
    //           }, localCache.currentModel(adminConfigurationDeploymentLibrary.uuid));
    //         }
    //       );
  
    //       await act(()=>user.click(screen.getByRole('button')));
  
    //       await waitFor(
    //         () => {
    //           getAllByRole(/step:1/)
    //         },
    //       ).then(
    //         ()=> {
    //           // expect(getByText(new RegExp(`${book3.uuid}`,'i'))).toBeTruthy() // Et dans l'éternité je ne m'ennuierai pas
    //           expect(getByText(new RegExp(`${book1.uuid}`,'i'))).toBeTruthy() // The Bride Wore Black
    //           expect(getByText(new RegExp(`${book2.uuid}`,'i'))).toBeTruthy() // The Design of Everyday Things
    //           expect(screen.queryByText(new RegExp(`${book3.uuid}`,'i'))).toBeNull() // Et dans l'éternité je ne m'ennuierai pas
    //           // expect(getByText(new RegExp(`${book3.uuid}`,'i'))).toBeTruthy() // Et dans l'éternité je ne m'ennuierai pas
    //           expect(getByText(new RegExp(`${book4.uuid}`,'i'))).toBeTruthy() // Rear Window
    //         }
    //       );
  
    //       // ##########################################################################################################
    //       console.log('remove Book instance step 2: the Book must then be absent from the local cache report list.')
    //       const deleteAction: InstanceAction = {
    //         actionType: "instanceAction",
    //         actionName: "deleteInstance",
    //         endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
    //         applicationSection: "data",
    //         deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
    //         objects:[{parentName:book2.parentName,parentUuid:book2.parentUuid,applicationSection:'data', instances:[book2 as EntityInstance]}]
    //       };
  
    //       await act(
    //         async () => {
    //           await domainController.handleAction(deleteAction);
    //         }
    //       );
  
    //       await act(()=>user.click(screen.getByRole('button')));
  
    //       console.log("domainController.currentTransaction()", domainController.currentTransaction());
    //       // data operations are not transactional
    //       expect(domainController.currentTransaction().length).toEqual(0);
  
    //       await waitFor(
    //         () => {
    //           getAllByRole(/step:2/)
    //         },
    //       ).then(
    //         ()=> {
    //           expect(getByText(new RegExp(`${book1.uuid}`,'i'))).toBeTruthy() // The Bride Wore Black
    //           // expect(getByText(new RegExp(`${book2.uuid}`,'i'))).toBeTruthy() // The Design of Everyday Things
    //           expect(screen.queryByText(new RegExp(`${book2.uuid}`,'i'))).toBeNull() // Et dans l'éternité je ne m'ennuierai pas
    //           expect(screen.queryByText(new RegExp(`${book3.uuid}`,'i'))).toBeNull() // Et dans l'éternité je ne m'ennuierai pas
    //           expect(getByText(new RegExp(`${book4.uuid}`,'i'))).toBeTruthy() // Rear Window
    //         }
    //       );

    //       // ##########################################################################################################
    //       console.log('Remove Book instance step 3: rollbacking/refreshing book list from remote store, removed book must still be absent from the report list.')
    //       await act(
    //         async () => {
    //           await domainController.handleAction({
    //             actionType: "modelAction",
    //             actionName: "rollback",
    //             deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
    //             endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
    //           }, defaultMiroirMetaModel);
    //         }
    //       );

    //       await act(()=>user.click(screen.getByRole('button')));

    //       console.log("domainController.currentTransaction()", domainController.currentTransaction());
    //       expect(domainController.currentTransaction().length).toEqual(0);

    //       await waitFor(
    //         () => {
    //           getAllByRole(/step:3/)
    //         },
    //       ).then(
    //         ()=> {
    //           expect(getByText(new RegExp(`${book1.uuid}`,'i'))).toBeTruthy() // The Bride Wore Black
    //           // expect(getByText(new RegExp(`${book2.uuid}`,'i'))).toBeTruthy() // The Design of Everyday Things
    //           expect(screen.queryByText(new RegExp(`${book2.uuid}`,'i'))).toBeNull() // Et dans l'éternité je ne m'ennuierai pas
    //           expect(screen.queryByText(new RegExp(`${book3.uuid}`,'i'))).toBeNull() // Et dans l'éternité je ne m'ennuierai pas
    //           expect(getByText(new RegExp(`${book4.uuid}`,'i'))).toBeTruthy() // Rear Window
    //         }
    //       );
    //     } catch (error) {
    //       console.error('error during test',expect.getState().currentTestName,error);
    //       expect(false).toBeTruthy();
    //     }
    //   }
    // )

    // // ###########################################################################################
    // it('Update Book instance then commit',
    //   async () => {
    //     try {
          
    //       console.log('update Book instance start');

    //       const displayLoadingInfo=<DisplayLoadingInfo reportUuid={entityBook.uuid}/>
    //       const user = (userEvent as any).setup()

    //       const {
    //         getByText,
    //         getAllByRole,
    //         // container
    //       } = renderWithProviders(
    //         <TestUtilsTableComponent
    //           // parentName="Book"
    //           entityUuid={entityBook.uuid}
    //           DisplayLoadingInfo={displayLoadingInfo}
    //           deploymentUuid={adminConfigurationDeploymentLibrary.uuid}
    //         />
    //         ,
    //         {store:localCache.getInnerStore()}
    //       );
  
    //       // ##########################################################################################################
    //       console.log('Update Book instance step 1: loading initial configuration, book must be present in report list.')
    //       await act(
    //         async () => {
    //           await domainController.handleAction({
    //             actionType: "modelAction",
    //             actionName: "rollback",
    //             deploymentUuid:adminConfigurationDeploymentLibrary.uuid,
    //             endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
    //           }, localCache.currentModel(adminConfigurationDeploymentLibrary.uuid));
    //         }
    //       );

    //       await act(()=>user.click(screen.getByRole('button')));

    //       await waitFor(
    //         () => {
    //           getAllByRole(/step:1/)
    //         },
    //       ).then(
    //         ()=> {
    //           // expect(screen.queryByText(/caef8a59-39eb-48b5-ad59-a7642d3a1e8f/i)).toBeNull() // Et dans l'éternité je ne m'ennuierai pas
    //           expect(getByText(new RegExp(`${book1.uuid}`,'i'))).toBeTruthy() // The Bride Wore Black
    //           expect(getByText(new RegExp(`${book2.uuid}`,'i'))).toBeTruthy() // The Design of Everyday Things
    //           // expect(getByText(new RegExp(`${book3.uuid}`,'i'))).toBeTruthy() // Et dans l'éternité je ne m'ennuierai pas
    //           expect(screen.queryByText(new RegExp(`${book3.uuid}`,'i'))).toBeNull() // Et dans l'éternité je ne m'ennuierai pas
    //           expect(getByText(new RegExp(`${book4.uuid}`,'i'))).toBeTruthy() // Rear Window
    //         }
    //       );
  
    //       // ##########################################################################################################
    //       console.log('Update Book instance step 2: update reportReportList, modified version must then be present in the report list.')
    //       const updateAction: InstanceAction = {
    //         actionType: "instanceAction",
    //         actionName: "updateInstance",
    //         endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
    //         applicationSection: "data",
    //         deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
    //         objects: [
    //           {
    //             parentName: book4.parentName,
    //             parentUuid: book4.parentUuid,
    //             applicationSection:'data',
    //             instances: [
    //               Object.assign({},book4,{"name":"Tthe Bride Wore Blackk", "author": "d14c1c0c-eb2e-42d1-8ac1-2d58f5143c17"}) as EntityInstance
    //             ],
    //           },
    //         ],
    //       };
    //       await act(
    //         async () => {
    //           await domainController.handleAction(updateAction);
    //         }
    //       );
  
    //       // update does not generate any redo / undo
    //       expect(domainController.currentTransaction().length).toEqual(0);
  
    //       await act(()=>user.click(screen.getByRole('button')));
  
    //       await waitFor(
    //         () => {
    //           getAllByRole(/step:2/)
    //         },
    //       ).then(
    //         ()=> {
    //           expect(screen.queryByText(/Tthe Bride Wore Blackk/i)).toBeTruthy() // Report List
    //         }
    //       );
  
    //       // ##########################################################################################################
    //       console.log('Update Book instance step 3: refreshing book list from remote store, modified bool must still be present in the report list.')
    //       await act(
    //         async () => {
    //           await domainController.handleAction({
    //             actionType: "modelAction",
    //             actionName: "rollback",
    //             deploymentUuid:adminConfigurationDeploymentLibrary.uuid,
    //             endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
    //           }, defaultMiroirMetaModel);
    //         }
    //       );

    //       await act(()=>user.click(screen.getByRole('button')));

    //       await waitFor(
    //         () => {
    //           getAllByRole(/step:3/)
    //         },
    //       ).then(
    //         ()=> {
    //           expect(screen.queryByText(/Tthe Bride Wore Blackk/i)).toBeTruthy() // Report List
    //         }
    //       );
    //     } catch (error) {
    //       console.error('error during test',expect.getState().currentTestName,error);
    //       expect(false).toBeTruthy();
    //     }
    //   }
    // )
  } //  end describe('DomainController.Data.CRUD.React',
)
