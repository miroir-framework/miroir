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
  DomainControllerInterface,
  entityAuthor,
  entityBook,
  EntityDefinition,
  entityDefinitionAuthor,
  entityDefinitionBook,
  entityDefinitionPublisher,
  EntityInstance,
  entityPublisher,
  MetaEntity,
  MiroirContextInterface,
  miroirCoreStartup,
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
import {
  ApplicationEntitiesAndInstances,
  testOnLibrary_deleteLibraryDeployment,
  testOnLibrary_resetLibraryDeployment,
  testOnLibrary_resetInitAndAddTestDataToLibraryDeployment,
} from "../utils/tests-utils-testOnLibrary.js";
import { Entity } from 'miroir-core';
import { entityEntity } from 'miroir-core';


const env:any = (import.meta as any).env
console.log("@@@@@@@@@@@@@@@@@@ env", env);

const {miroirConfig, logConfig:loggerOptions} = await loadTestConfigFiles(env);

// MiroirLoggerFactory.setEffectiveLoggerFactory(
//   loglevelnext,
//   (defaultLevels as any)[loggerOptions.defaultLevel],
//   loggerOptions.defaultTemplate,
//   loggerOptions.specificLoggerOptions
// );

// jest intercepts logs, only console.log will produce test output
// const loggerName: string = getLoggerName(packageName, cleanLevel,"DomainController.Data.CRUD.React");
// let log:LoggerInterface = console as any as LoggerInterface;
// MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
//   (value: LoggerInterface) => {
//     log = value;
//   }
// );

console.log("@@@@@@@@@@@@@@@@@@ miroirConfig", miroirConfig);


let domainController: DomainControllerInterface;
let localCache: LocalCache;
let miroirContext: MiroirContextInterface;
let persistenceStoreControllerManager: PersistenceStoreControllerManagerInterface;

export const libraryEntitiesAndInstancesWithoutBook3: ApplicationEntitiesAndInstances  = [
  // {
  //   entity: entityAuthor as MetaEntity,
  //   entityDefinition: entityDefinitionAuthor as EntityDefinition,
  //   instances: [author1, author2, author3 as EntityInstance],
  // },
  // {
  //   entity: entityBook as MetaEntity,
  //   entityDefinition: entityDefinitionBook as EntityDefinition,
  //   instances: [
  //     book1 as EntityInstance,
  //     book2 as EntityInstance,
  //     // book3 as EntityInstance,
  //     book4 as EntityInstance,
  //     book5 as EntityInstance,
  //     book6 as EntityInstance,
  //   ],
  // },
  // {
  //   entity: entityPublisher as MetaEntity,
  //   entityDefinition: entityDefinitionPublisher as EntityDefinition,
  //   instances: [publisher1 as EntityInstance, publisher2 as EntityInstance, publisher3 as EntityInstance],
  // },
];


beforeAll(
  async () => {
    // Establish requests interception layer before all tests.
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ beforeAll");
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
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ beforeAll DONE");

    return Promise.resolve();
  }
)

beforeEach(
  async () => {
    await miroirBeforeEach_resetAndInitApplicationDeployments(
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
  "DomainController.Model.CRUD.integ": {
    testActionType: "testCompositeActionSuite",
    deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
    testCompositeAction: {
      testType: "testCompositeActionSuite",
      beforeAll: createDeploymentCompositeAction(miroirConfig, adminConfigurationDeploymentLibrary.uuid),
      beforeEach: testOnLibrary_resetInitAndAddTestDataToLibraryDeployment(miroirConfig, libraryEntitiesAndInstancesWithoutBook3),
      afterEach: testOnLibrary_resetLibraryDeployment(miroirConfig),
      afterAll: testOnLibrary_deleteLibraryDeployment(miroirConfig),
      testCompositeActions: {
        // "Refresh all Instances": {
        //   testType: "testCompositeAction",
        //   compositeAction: {
        //     actionType: "compositeAction",
        //     actionLabel: "testLibraryBooks",
        //     actionName: "sequence",
        //     definition: [
        //       {
        //         compositeActionType: "domainAction",
        //         compositeActionStepLabel: "refreshMiroirLocalCache",
        //         domainAction: {
        //           actionName: "rollback",
        //           actionType: "modelAction",
        //           endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        //           deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
        //         },
        //       },
        //       {
        //         compositeActionType: "domainAction",
        //         compositeActionStepLabel: "refreshLibraryLocalCache",
        //         domainAction: {
        //           actionName: "rollback",
        //           actionType: "modelAction",
        //           endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        //           deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
        //         },
        //       },
        //       {
        //         compositeActionType: "runBoxedExtractorOrQueryAction",
        //         compositeActionStepLabel: "calculateNewEntityDefinionAndReports",
        //         nameGivenToResult: "libraryEntityList",
        //         query: {
        //           actionType: "runBoxedExtractorOrQueryAction",
        //           actionName: "runQuery",
        //           endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
        //           applicationSection: "model", // TODO: give only application section in individual queries?
        //           deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
        //           query: {
        //             queryType: "boxedQueryWithExtractorCombinerTransformer",
        //             deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
        //             pageParams: {
        //               currentDeploymentUuid: adminConfigurationDeploymentLibrary.uuid,
        //             },
        //             queryParams: {},
        //             contextResults: {},
        //             extractors: {
        //               entities: {
        //                 extractorOrCombinerType: "extractorByEntityReturningObjectList",
        //                 applicationSection: "model",
        //                 parentName: entityEntity.name,
        //                 parentUuid: entityEntity.uuid,
        //                 orderBy: {
        //                   attributeName: "name",
        //                   direction: "ASC",
        //                 },
        //               },
        //             },
        //           },
        //         },
        //       },
        //     ],
        //   },
        //   testCompositeActionAssertions: [
        //     // TODO: test length of entityBookList.books!
        //     {
        //       compositeActionType: "runTestCompositeActionAssertion",
        //       compositeActionStepLabel: "checkNumberOfEntitiesInLibraryApplicationDeployment",
        //       nameGivenToResult: "checkNumberOfEntities",
        //       testAssertion: {
        //         testType: "testAssertion",
        //         definition: {
        //           resultAccessPath: ["elementValue", "0"],
        //           resultTransformer: {
        //             transformerType: "count",
        //             interpolation: "runtime",
        //             referencedExtractor: {
        //               transformerType: "contextReference",
        //               interpolation: "runtime",
        //               referencePath: ["libraryEntityList", "entities"],
        //             },
        //           },
        //           expectedValue: { count: 0 },
        //         },
        //       },
        //     },
        //   ],
        // },
        // "Add Entity Author and Commit": {
        //   testType: "testCompositeAction",
        //   compositeAction: {
        //     actionType: "compositeAction",
        //     actionLabel: "AddBookInstanceThenRollback",
        //     actionName: "sequence",
        //     definition: [
        //       {
        //         compositeActionType: "domainAction",
        //         compositeActionStepLabel: "refreshMiroirLocalCache",
        //         domainAction: {
        //           actionName: "rollback",
        //           actionType: "modelAction",
        //           endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        //           deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
        //         },
        //       },
        //       {
        //         compositeActionType: "domainAction",
        //         compositeActionStepLabel: "refreshLibraryLocalCache",
        //         domainAction: {
        //           actionName: "rollback",
        //           actionType: "modelAction",
        //           endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        //           deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
        //         },
        //       },
        //       {
        //         compositeActionType: "domainAction",
        //         compositeActionStepLabel: "addEntityAuthor",
        //         domainAction: {
        //           actionType: "modelAction",
        //           actionName: "createEntity",
        //           deploymentUuid:adminConfigurationDeploymentLibrary.uuid,
        //           endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        //           entities: [
        //             {
        //               entity: entityAuthor as Entity,
        //               entityDefinition: entityDefinitionAuthor as EntityDefinition,
        //             }
        //           ]
        //         },
        //       },
        //       {
        //         compositeActionType: "domainAction",
        //         compositeActionStepLabel: "commitLibraryLocalCache",
        //         domainAction: {
        //           actionName: "commit",
        //           actionType: "modelAction",
        //           endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        //           deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
        //         },
        //       },
        //       {
        //         // performs query on local cache for emulated server, and on server for remote server 
        //         compositeActionType: "runBoxedExtractorOrQueryAction",
        //         compositeActionStepLabel: "calculateNewEntityDefinionAndReports",
        //         nameGivenToResult: "libraryEntityList",
        //         query: {
        //           actionType: "runBoxedExtractorOrQueryAction",
        //           actionName: "runQuery",
        //           endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
        //           applicationSection: "model", // TODO: give only application section in individual queries?
        //           deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
        //           query: {
        //             queryType: "boxedQueryWithExtractorCombinerTransformer",
        //             deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
        //             pageParams: {
        //               currentDeploymentUuid: adminConfigurationDeploymentLibrary.uuid,
        //             },
        //             queryParams: {},
        //             contextResults: {},
        //             extractors: {
        //               entities: {
        //                 extractorOrCombinerType: "extractorByEntityReturningObjectList",
        //                 applicationSection: "model",
        //                 parentName: entityEntity.name,
        //                 parentUuid: entityEntity.uuid,
        //                 orderBy: {
        //                   attributeName: "name",
        //                   direction: "ASC",
        //                 },
        //               },
        //             },
        //           },
        //         },
        //       },
        //     ],
        //   },
        //   testCompositeActionAssertions: [
        //     // TODO: test length of entityBookList.books!
        //     {
        //       compositeActionType: "runTestCompositeActionAssertion",
        //       compositeActionStepLabel: "checkNumberOfBooks",
        //       nameGivenToResult: "checkNumberOfEntities",
        //       testAssertion: {
        //         testType: "testAssertion",
        //         definition: {
        //           resultAccessPath: ["elementValue", "0"],
        //           resultTransformer: {
        //             transformerType: "count",
        //             interpolation: "runtime",
        //             referencedExtractor: {
        //               transformerType: "contextReference",
        //               interpolation: "runtime",
        //               referencePath: ["libraryEntityList", "entities"],
        //             },
        //           },
        //           expectedValue: { count: 1 },
        //         },
        //       },
        //     },
        //     {
        //       compositeActionType: "runTestCompositeActionAssertion",
        //       compositeActionStepLabel: "checkEntityBooks",
        //       nameGivenToResult: "checkEntityList",
        //       testAssertion: {
        //         testType: "testAssertion",
        //         definition: {
        //           resultAccessPath: ["libraryEntityList", "entities"],
        //           ignoreAttributes: [ "author" ],
        //           expectedValue: [
        //             entityAuthor
        //           ],
        //         },
        //       },
        //     },
        //   ],
        // },
        // "Add Entity Book then rollback": {
        //   testType: "testCompositeAction",
        //   compositeAction: {
        //     actionType: "compositeAction",
        //     actionLabel: "AddBookInstanceThenRollback",
        //     actionName: "sequence",
        //     definition: [
        //       {
        //         compositeActionType: "domainAction",
        //         compositeActionStepLabel: "refreshMiroirLocalCache",
        //         domainAction: {
        //           actionName: "rollback",
        //           actionType: "modelAction",
        //           endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        //           deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
        //         },
        //       },
        //       {
        //         compositeActionType: "domainAction",
        //         compositeActionStepLabel: "refreshLibraryLocalCache",
        //         domainAction: {
        //           actionName: "rollback",
        //           actionType: "modelAction",
        //           endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        //           deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
        //         },
        //       },
        //       {
        //         compositeActionType: "domainAction",
        //         compositeActionStepLabel: "addEntityAuthor",
        //         domainAction: {
        //           actionType: "modelAction",
        //           actionName: "createEntity",
        //           deploymentUuid:adminConfigurationDeploymentLibrary.uuid,
        //           endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        //           entities: [
        //             {
        //               entity: entityAuthor as Entity,
        //               entityDefinition: entityDefinitionAuthor as EntityDefinition,
        //             }
        //           ]
        //         },
        //       },
        //       {
        //         compositeActionType: "domainAction",
        //         compositeActionStepLabel: "refreshLibraryLocalCache2",
        //         domainAction: {
        //           actionName: "rollback",
        //           actionType: "modelAction",
        //           endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        //           deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
        //         },
        //       },
        //       {
        //         compositeActionType: "runBoxedExtractorOrQueryAction",
        //         compositeActionStepLabel: "calculateNewEntityDefinionAndReports",
        //         nameGivenToResult: "libraryEntityList",
        //         query: {
        //           actionType: "runBoxedExtractorOrQueryAction",
        //           actionName: "runQuery",
        //           endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
        //           applicationSection: "model", // TODO: give only application section in individual queries?
        //           deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
        //           query: {
        //             queryType: "boxedQueryWithExtractorCombinerTransformer",
        //             deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
        //             pageParams: {
        //               currentDeploymentUuid: adminConfigurationDeploymentLibrary.uuid,
        //             },
        //             queryParams: {},
        //             contextResults: {},
        //             extractors: {
        //               entities: {
        //                 extractorOrCombinerType: "extractorByEntityReturningObjectList",
        //                 applicationSection: "model",
        //                 parentName: entityEntity.name,
        //                 parentUuid: entityEntity.uuid,
        //                 orderBy: {
        //                   attributeName: "name",
        //                   direction: "ASC",
        //                 },
        //               },
        //             },
        //           },
        //         },
        //       },
        //     ],
        //   },
        //   testCompositeActionAssertions: [
        //     // TODO: test length of entityBookList.books!
        //     {
        //       compositeActionType: "runTestCompositeActionAssertion",
        //       compositeActionStepLabel: "checkNumberOfBooks",
        //       nameGivenToResult: "checkNumberOfEntities",
        //       testAssertion: {
        //         testType: "testAssertion",
        //         definition: {
        //           resultAccessPath: ["elementValue", "0"],
        //           resultTransformer: {
        //             transformerType: "count",
        //             interpolation: "runtime",
        //             referencedExtractor: {
        //               transformerType: "contextReference",
        //               interpolation: "runtime",
        //               referencePath: ["libraryEntityList", "entities"],
        //             },
        //           },
        //           expectedValue: { count: 0 },
        //           // expectedValue: { count: 1 },
        //         },
        //       },
        //     },
        //   ],
        // },
        "Add Entity Book then test before commit or rollback": {
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
                compositeActionStepLabel: "addEntityAuthor",
                domainAction: {
                  actionType: "modelAction",
                  actionName: "createEntity",
                  deploymentUuid:adminConfigurationDeploymentLibrary.uuid,
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  entities: [
                    {
                      entity: entityAuthor as Entity,
                      entityDefinition: entityDefinitionAuthor as EntityDefinition,
                    }
                  ]
                },
              },
              // {
              //   compositeActionType: "domainAction",
              //   compositeActionStepLabel: "refreshLibraryLocalCache2",
              //   domainAction: {
              //     actionName: "rollback",
              //     actionType: "modelAction",
              //     endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              //     deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
              //   },
              // },
              {
                compositeActionType: "runBoxedExtractorOrQueryAction",
                compositeActionStepLabel: "calculateNewEntityDefinionAndReports",
                nameGivenToResult: "libraryEntityListFromLocalCache",
                query: {
                  actionType: "runBoxedExtractorOrQueryAction",
                  actionName: "runQuery",
                  endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                  queryExecutionStrategy: "localCacheOrFail",
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
              {
                compositeActionType: "runBoxedExtractorOrQueryAction",
                compositeActionStepLabel: "calculateNewEntityDefinionAndReports",
                nameGivenToResult: "libraryEntityListFromPersistentStore",
                query: {
                  actionType: "runBoxedExtractorOrQueryAction",
                  actionName: "runQuery",
                  endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                  queryExecutionStrategy: "storage",
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
            ],
          },
          testCompositeActionAssertions: [
            // TODO: test length of entityBookList.books!
            {
              compositeActionType: "runTestCompositeActionAssertion",
              compositeActionStepLabel: "checkNumberOfBooks",
              nameGivenToResult: "checkNumberOfEntitiesFromLocalCache",
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
                      referencePath: ["libraryEntityListFromLocalCache", "entities"],
                    },
                  },
                  expectedValue: { count: 1 },
                },
              },
            },
            {
              compositeActionType: "runTestCompositeActionAssertion",
              compositeActionStepLabel: "checkNumberOfBooks",
              nameGivenToResult: "checkNumberOfEntitiesFromPersistentStore",
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
                      referencePath: ["libraryEntityListFromPersistentStore", "entities"],
                    },
                  },
                  expectedValue: { count: 0 },
                },
              },
            },
          ],
        },





        // TODO: test intermediate state, after addition of Author Entity but before commit or rollback
        // Entity count shall be 1 when query is performed on local cache
        // Entity count shall be 0 when query is performed on remote server
        // HOWEVER: composite actions must prohibit execution on local cache, though they could be allowed for CompositeTestActions.


        // "Add Book instance then rollback": {
        //   testType: "testCompositeAction",
        //   compositeAction: {
        //     actionType: "compositeAction",
        //     actionLabel: "AddBookInstanceThenRollback",
        //     actionName: "sequence",
        //     definition: [
        //       {
        //         compositeActionType: "domainAction",
        //         compositeActionStepLabel: "refreshMiroirLocalCache",
        //         domainAction: {
        //           actionName: "rollback",
        //           actionType: "modelAction",
        //           endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        //           deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
        //         },
        //       },
        //       {
        //         compositeActionType: "domainAction",
        //         compositeActionStepLabel: "refreshLibraryLocalCache",
        //         domainAction: {
        //           actionName: "rollback",
        //           actionType: "modelAction",
        //           endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        //           deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
        //         },
        //       },
        //       {
        //         compositeActionType: "domainAction",
        //         compositeActionStepLabel: "addBook3",
        //         domainAction: {
        //           actionType: "instanceAction",
        //           actionName: "createInstance",
        //           endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
        //           applicationSection: "data",
        //           deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
        //           objects: [
        //             {
        //               parentName: book3.parentName,
        //               parentUuid: book3.parentUuid,
        //               applicationSection: "data",
        //               instances: [book3 as EntityInstance],
        //             },
        //           ],
        //         },
        //       },
        //       {
        //         compositeActionType: "runBoxedExtractorOrQueryAction",
        //         compositeActionStepLabel: "calculateNewEntityDefinionAndReports",
        //         nameGivenToResult: "entityBookList",
        //         query: {
        //           actionType: "runBoxedExtractorOrQueryAction",
        //           actionName: "runQuery",
        //           endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
        //           applicationSection: "model", // TODO: give only application section in individual queries?
        //           deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
        //           query: {
        //             queryType: "boxedQueryWithExtractorCombinerTransformer",
        //             deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
        //             pageParams: {
        //               currentDeploymentUuid: adminConfigurationDeploymentLibrary.uuid,
        //             },
        //             queryParams: {},
        //             contextResults: {},
        //             extractors: {
        //               books: {
        //                 extractorOrCombinerType: "extractorByEntityReturningObjectList",
        //                 applicationSection: "data",
        //                 parentName: "Book",
        //                 parentUuid: entityBook.uuid,
        //                 orderBy: {
        //                   attributeName: "uuid",
        //                   direction: "ASC",
        //                 },
        //               },
        //             },
        //           },
        //         },
        //       },
        //     ],
        //   },
        //   testCompositeActionAssertions: [
        //     // TODO: test length of entityBookList.books!
        //     {
        //       compositeActionType: "runTestCompositeActionAssertion",
        //       compositeActionStepLabel: "checkNumberOfBooks",
        //       nameGivenToResult: "checkNumberOfBooks",
        //       testAssertion: {
        //         testType: "testAssertion",
        //         definition: {
        //           resultAccessPath: ["elementValue", "0"],
        //           resultTransformer: {
        //             transformerType: "count",
        //             interpolation: "runtime",
        //             referencedExtractor: {
        //               transformerType: "contextReference",
        //               interpolation: "runtime",
        //               referencePath: ["entityBookList", "books"],
        //             },
        //           },
        //           expectedValue: { count: 6 },
        //         },
        //       },
        //     },
        //     {
        //       compositeActionType: "runTestCompositeActionAssertion",
        //       compositeActionStepLabel: "checkEntityBooks",
        //       nameGivenToResult: "checkEntityBooks",
        //       testAssertion: {
        //         testType: "testAssertion",
        //         definition: {
        //           resultAccessPath: ["entityBookList", "books"],
        //           expectedValue: [
        //             book3,
        //             book4,
        //             book6,
        //             book5,
        //             book1,
        //             book2,
        //           ],
        //         },
        //       },
        //     },
        //   ],
        // },
        // "Remove Book instance": {
        //   testType: "testCompositeAction",
        //   compositeAction: {
        //     actionType: "compositeAction",
        //     actionLabel: "AddBookInstanceThenRollback",
        //     actionName: "sequence",
        //     definition: [
        //       {
        //         compositeActionType: "domainAction",
        //         compositeActionStepLabel: "refreshMiroirLocalCache",
        //         domainAction: {
        //           actionName: "rollback",
        //           actionType: "modelAction",
        //           endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        //           deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
        //         },
        //       },
        //       {
        //         compositeActionType: "domainAction",
        //         compositeActionStepLabel: "refreshLibraryLocalCache",
        //         domainAction: {
        //           actionName: "rollback",
        //           actionType: "modelAction",
        //           endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        //           deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
        //         },
        //       },
        //       {
        //         compositeActionType: "domainAction",
        //         compositeActionStepLabel: "deleteBook2",
        //         domainAction: {
        //           actionType: "instanceAction",
        //           actionName: "deleteInstance",
        //           endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
        //           applicationSection: "data",
        //           deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
        //           objects: [
        //             {
        //               parentName: book2.parentName,
        //               parentUuid: book2.parentUuid,
        //               applicationSection: "data",
        //               instances: [book2 as EntityInstance],
        //             },
        //           ],
        //         },
        //       },
        //       {
        //         compositeActionType: "runBoxedExtractorOrQueryAction",
        //         compositeActionStepLabel: "calculateNewEntityDefinionAndReports",
        //         nameGivenToResult: "entityBookList",
        //         query: {
        //           actionType: "runBoxedExtractorOrQueryAction",
        //           actionName: "runQuery",
        //           endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
        //           applicationSection: "model", // TODO: give only application section in individual queries?
        //           deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
        //           query: {
        //             queryType: "boxedQueryWithExtractorCombinerTransformer",
        //             deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
        //             pageParams: {
        //               currentDeploymentUuid: adminConfigurationDeploymentLibrary.uuid,
        //             },
        //             queryParams: {},
        //             contextResults: {},
        //             extractors: {
        //               books: {
        //                 extractorOrCombinerType: "extractorByEntityReturningObjectList",
        //                 applicationSection: "data",
        //                 parentName: "Book",
        //                 parentUuid: entityBook.uuid,
        //                 orderBy: {
        //                   attributeName: "uuid",
        //                   direction: "ASC",
        //                 },
        //               },
        //             },
        //           },
        //         },
        //       },
        //     ],
        //   },
        //   testCompositeActionAssertions: [
        //     // TODO: test length of entityBookList.books!
        //     {
        //       compositeActionType: "runTestCompositeActionAssertion",
        //       compositeActionStepLabel: "checkNumberOfBooks",
        //       nameGivenToResult: "checkNumberOfBooks",
        //       testAssertion: {
        //         testType: "testAssertion",
        //         definition: {
        //           resultAccessPath: ["elementValue", "0"],
        //           resultTransformer: {
        //             transformerType: "count",
        //             interpolation: "runtime",
        //             referencedExtractor: {
        //               transformerType: "contextReference",
        //               interpolation: "runtime",
        //               referencePath: ["entityBookList", "books"],
        //             },
        //           },
        //           expectedValue: { count: 4 },
        //         },
        //       },
        //     },
        //     {
        //       compositeActionType: "runTestCompositeActionAssertion",
        //       compositeActionStepLabel: "checkEntityBooks",
        //       nameGivenToResult: "checkEntityBooks",
        //       testAssertion: {
        //         testType: "testAssertion",
        //         definition: {
        //           resultAccessPath: ["entityBookList", "books"],
        //           expectedValue: [
        //             // book3,
        //             book4,
        //             book6,
        //             book5,
        //             book1,
        //             // book2,
        //           ],
        //         },
        //       },
        //     },
        //   ],
        // },
        // "Remove Book instance then rollback": {
        //   testType: "testCompositeAction",
        //   compositeAction: {
        //     actionType: "compositeAction",
        //     actionLabel: "AddBookInstanceThenRollback",
        //     actionName: "sequence",
        //     definition: [
        //       {
        //         compositeActionType: "domainAction",
        //         compositeActionStepLabel: "refreshMiroirLocalCache",
        //         domainAction: {
        //           actionName: "rollback",
        //           actionType: "modelAction",
        //           endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        //           deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
        //         },
        //       },
        //       {
        //         compositeActionType: "domainAction",
        //         compositeActionStepLabel: "refreshLibraryLocalCache",
        //         domainAction: {
        //           actionName: "rollback",
        //           actionType: "modelAction",
        //           endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        //           deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
        //         },
        //       },
        //       {
        //         compositeActionType: "domainAction",
        //         compositeActionStepLabel: "addBook3",
        //         domainAction: {
        //           actionType: "instanceAction",
        //           actionName: "deleteInstance",
        //           endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
        //           applicationSection: "data",
        //           deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
        //           objects: [
        //             {
        //               parentName: book2.parentName,
        //               parentUuid: book2.parentUuid,
        //               applicationSection: "data",
        //               instances: [book2 as EntityInstance],
        //             },
        //           ],
        //         },
        //       },
        //       {
        //         compositeActionType: "domainAction",
        //         compositeActionStepLabel: "refreshLibraryLocalCache",
        //         domainAction: {
        //           actionName: "rollback",
        //           actionType: "modelAction",
        //           endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        //           deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
        //         },
        //       },
        //       {
        //         compositeActionType: "runBoxedExtractorOrQueryAction",
        //         compositeActionStepLabel: "calculateNewEntityDefinionAndReports",
        //         nameGivenToResult: "entityBookList",
        //         query: {
        //           actionType: "runBoxedExtractorOrQueryAction",
        //           actionName: "runQuery",
        //           endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
        //           applicationSection: "model", // TODO: give only application section in individual queries?
        //           deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
        //           query: {
        //             queryType: "boxedQueryWithExtractorCombinerTransformer",
        //             deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
        //             pageParams: {
        //               currentDeploymentUuid: adminConfigurationDeploymentLibrary.uuid,
        //             },
        //             queryParams: {},
        //             contextResults: {},
        //             extractors: {
        //               books: {
        //                 extractorOrCombinerType: "extractorByEntityReturningObjectList",
        //                 applicationSection: "data",
        //                 parentName: "Book",
        //                 parentUuid: entityBook.uuid,
        //                 orderBy: {
        //                   attributeName: "uuid",
        //                   direction: "ASC",
        //                 },
        //               },
        //             },
        //           },
        //         },
        //       },
        //     ],
        //   },
        //   testCompositeActionAssertions: [
        //     // TODO: test length of entityBookList.books!
        //     {
        //       compositeActionType: "runTestCompositeActionAssertion",
        //       compositeActionStepLabel: "checkNumberOfBooks",
        //       nameGivenToResult: "checkNumberOfBooks",
        //       testAssertion: {
        //         testType: "testAssertion",
        //         definition: {
        //           resultAccessPath: ["elementValue", "0"],
        //           resultTransformer: {
        //             transformerType: "count",
        //             interpolation: "runtime",
        //             referencedExtractor: {
        //               transformerType: "contextReference",
        //               interpolation: "runtime",
        //               referencePath: ["entityBookList", "books"],
        //             },
        //           },
        //           expectedValue: { count: 4 },
        //         },
        //       },
        //     },
        //     {
        //       compositeActionType: "runTestCompositeActionAssertion",
        //       compositeActionStepLabel: "checkEntityBooks",
        //       nameGivenToResult: "checkEntityBooks",
        //       testAssertion: {
        //         testType: "testAssertion",
        //         definition: {
        //           resultAccessPath: ["entityBookList", "books"],
        //           expectedValue: [
        //             // book3,
        //             book4,
        //             book6,
        //             book5,
        //             book1,
        //             // book2,
        //           ],
        //         },
        //       },
        //     },
        //   ],
        // },
        // "Update Book instance": {
        //   testType: "testCompositeAction",
        //   compositeAction: {
        //     actionType: "compositeAction",
        //     actionLabel: "AddBookInstanceThenRollback",
        //     actionName: "sequence",
        //     definition: [
        //       {
        //         compositeActionType: "domainAction",
        //         compositeActionStepLabel: "refreshMiroirLocalCache",
        //         domainAction: {
        //           actionName: "rollback",
        //           actionType: "modelAction",
        //           endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        //           deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
        //         },
        //       },
        //       {
        //         compositeActionType: "domainAction",
        //         compositeActionStepLabel: "refreshLibraryLocalCache",
        //         domainAction: {
        //           actionName: "rollback",
        //           actionType: "modelAction",
        //           endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        //           deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
        //         },
        //       },
        //       {
        //         compositeActionType: "domainAction",
        //         compositeActionStepLabel: "deleteBook2",
        //         domainAction: {
        //           actionType: "instanceAction",
        //           actionName: "updateInstance",
        //           endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
        //           applicationSection: "data",
        //           deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
        //           objects: [
        //             {
        //               parentName: book4.parentName,
        //               parentUuid: book4.parentUuid,
        //               applicationSection: "data",
        //               instances: [
        //                 Object.assign({}, book4, {
        //                   name: "Tthe Bride Wore Blackk",
        //                   author: "d14c1c0c-eb2e-42d1-8ac1-2d58f5143c17",
        //                 }) as EntityInstance,
        //               ],
        //             },
        //           ],
        //         },
        //       },
        //       {
        //         compositeActionType: "runBoxedExtractorOrQueryAction",
        //         compositeActionStepLabel: "calculateNewEntityDefinionAndReports",
        //         nameGivenToResult: "entityBookList",
        //         query: {
        //           actionType: "runBoxedExtractorOrQueryAction",
        //           actionName: "runQuery",
        //           endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
        //           applicationSection: "model", // TODO: give only application section in individual queries?
        //           deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
        //           query: {
        //             queryType: "boxedQueryWithExtractorCombinerTransformer",
        //             deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
        //             pageParams: {
        //               currentDeploymentUuid: adminConfigurationDeploymentLibrary.uuid,
        //             },
        //             queryParams: {},
        //             contextResults: {},
        //             extractors: {
        //               books: {
        //                 extractorOrCombinerType: "extractorByEntityReturningObjectList",
        //                 applicationSection: "data",
        //                 parentName: "Book",
        //                 parentUuid: entityBook.uuid,
        //                 orderBy: {
        //                   attributeName: "uuid",
        //                   direction: "ASC",
        //                 },
        //               },
        //             },
        //           },
        //         },
        //       },
        //     ],
        //   },
        //   testCompositeActionAssertions: [
        //     // TODO: test length of entityBookList.books!
        //     {
        //       compositeActionType: "runTestCompositeActionAssertion",
        //       compositeActionStepLabel: "checkNumberOfBooks",
        //       nameGivenToResult: "checkNumberOfBooks",
        //       testAssertion: {
        //         testType: "testAssertion",
        //         definition: {
        //           resultAccessPath: ["elementValue", "0"],
        //           resultTransformer: {
        //             transformerType: "count",
        //             interpolation: "runtime",
        //             referencedExtractor: {
        //               transformerType: "contextReference",
        //               interpolation: "runtime",
        //               referencePath: ["entityBookList", "books"],
        //             },
        //           },
        //           expectedValue: { count: 5 },
        //         },
        //       },
        //     },
        //     {
        //       compositeActionType: "runTestCompositeActionAssertion",
        //       compositeActionStepLabel: "checkEntityBooks",
        //       nameGivenToResult: "checkEntityBooks",
        //       testAssertion: {
        //         testType: "testAssertion",
        //         definition: {
        //           resultAccessPath: ["entityBookList", "books"],
        //           expectedValue: [
        //             // book3,
        //             Object.assign({}, book4, {
        //               name: "Tthe Bride Wore Blackk",
        //               author: "d14c1c0c-eb2e-42d1-8ac1-2d58f5143c17",
        //             }) as EntityInstance,
        //             book6,
        //             book5,
        //             book1,
        //             book2,
        //           ],
        //         },
        //       },
        //     },
        //   ],
        // },
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
