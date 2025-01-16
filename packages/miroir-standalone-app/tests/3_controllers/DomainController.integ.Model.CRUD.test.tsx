import { describe, expect } from "vitest";

import { fetch as crossFetch } from "cross-fetch";
// import process from "process";

import {
  adminConfigurationDeploymentLibrary,
  adminConfigurationDeploymentMiroir,
  DomainControllerInterface,
  entityAuthor,
  EntityDefinition,
  entityDefinitionAuthor,
  entityDefinitionPublisher,
  entityEntityDefinition,
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
  TestSuiteResult
} from "miroir-core";

import {
  adminApplicationDeploymentConfigurations,
  createDeploymentCompositeAction,
  deleteAndCloseApplicationDeployments,
  displayTestSuiteResults,
  loadTestConfigFiles,
  resetAndinitializeDeploymentCompositeAction,
  runTestOrTestSuite,
  setupMiroirTest,
  TestActionParams
} from "../utils/tests-utils.js";

import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";
import { miroirIndexedDbStoreSectionStartup } from "miroir-store-indexedDb";
import { miroirPostgresStoreSectionStartup } from "miroir-store-postgres";
import { miroirAppStartup } from "../../src/startup.js";

import { LocalCache } from "miroir-localcache-redux";

import { ConfigurationService, defaultMiroirMetaModel, Entity, entityEntity, JzodElement } from "miroir-core";
import { packageName } from "miroir-core/src/constants.js";
import {
  ApplicationEntitiesAndInstances,
  testOnLibrary_deleteLibraryDeployment,
  testOnLibrary_resetLibraryDeployment,
} from "../utils/tests-utils-testOnLibrary.js";
// import { loglevelnext } from '../../src/loglevelnextImporter.js';
import { AdminApplicationDeploymentConfiguration } from "miroir-core/src/0_interfaces/1_core/StorageConfiguration.js";
import { LoggerOptions } from "miroir-core/src/0_interfaces/4-services/LoggerInterface.js";
import { loglevelnext } from "../../src/loglevelnextImporter.js";
import { cleanLevel } from "./constants.js";

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
const columnForTestDefinition: JzodElement = {
  type: "number",
  optional: true,
  tag: { value: { id: 6, defaultLabel: "Gender (narrow-minded)", editable: true } },
};
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
let localCache: LocalCache;
let miroirContext: MiroirContextInterface;
let persistenceStoreControllerManager: PersistenceStoreControllerManagerInterface;
let globalTestSuiteResults: TestSuiteResult = {};

export const libraryEntitiesAndInstancesWithoutBook3: ApplicationEntitiesAndInstances = [
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

beforeAll(async () => {
  // Establish requests interception layer before all tests.
  console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ beforeAll");
  const {
    persistenceStoreControllerManagerForClient: localpersistenceStoreControllerManager,
    domainController: localdomainController,
    localCache: locallocalCache,
    miroirContext: localmiroirContext,
  } = await setupMiroirTest(miroirConfig, crossFetch);

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
  console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ beforeAll DONE");

  return Promise.resolve();
});

beforeEach(async () => {
  await resetAndInitApplicationDeployment(domainController, [
    selfApplicationDeploymentMiroir as SelfApplicationDeploymentConfiguration,
  ]);
  document.body.innerHTML = "";
});

afterAll(async () => {
  await deleteAndCloseApplicationDeployments(miroirConfig, domainController, adminApplicationDeploymentConfigurations);
  displayTestSuiteResults(Object.keys(testActions)[0]);
});

const testActions: Record<string, TestActionParams> = {
  "DomainController.integ.Model.CRUD": {
    testActionType: "testCompositeActionSuite",
    testActionLabel: "DomainController.integ.Model.CRUD",
    deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
    testCompositeAction: {
      testType: "testCompositeActionSuite",
      testLabel: "DomainController.integ.Model.CRUD",
      beforeAll: createDeploymentCompositeAction(
        adminConfigurationDeploymentLibrary.uuid,
        testDeploymentStorageConfiguration
      ),
      beforeEach: resetAndinitializeDeploymentCompositeAction(
        adminConfigurationDeploymentLibrary.uuid,
        {
          dataStoreType: "app", // TODO: comparison between deployment and selfAdminConfigurationDeployment
          metaModel: defaultMiroirMetaModel,
          selfApplication: selfApplicationLibrary,
          // selfApplicationDeploymentConfiguration: selfApplicationDeploymentLibrary,
          applicationModelBranch: selfApplicationModelBranchLibraryMasterBranch,
          // applicationStoreBasedConfiguration: selfApplicationStoreBasedConfigurationLibrary,
          applicationVersion: selfApplicationVersionLibraryInitialVersion,
        },
        [
          {
            entity: entityPublisher as MetaEntity,
            entityDefinition: entityDefinitionPublisher as EntityDefinition,
            instances: [publisher1 as EntityInstance, publisher2 as EntityInstance, publisher3 as EntityInstance],
          },
        ]
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
                deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
              },
              {
                actionType: "compositeRunBoxedExtractorOrQueryAction",
                actionLabel: "calculateNewEntityDefinionAndReports",
                nameGivenToResult: "libraryEntityList",
                query: {
                  actionType: "runBoxedExtractorOrQueryAction",
                  actionName: "runQuery",
                  endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                  applicationSection: "model", // TODO: give only selfApplication section in individual queries?
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
              actionType: "compositeRunTestAssertion",
              actionLabel: "checkNumberOfEntitiesInLibraryApplicationDeployment",
              nameGivenToResult: "checkNumberOfEntities",
              testAssertion: {
                testType: "testAssertion",
                testLabel: "checkNumberOfEntitiesInLibraryApplicationDeployment",
                definition: {
                  resultAccessPath: ["elementValue", "0"],
                  resultTransformer: {
                    transformerType: "count",
                    interpolation: "runtime",
                    referencedExtractor: {
                      transformerType: "contextReference",
                      interpolation: "runtime",
                      referencePath: ["libraryEntityList", "entities"],
                    },
                  },
                  expectedValue: { count: 1 },
                },
              },
            },
          ],
        },
        "Add Entity Author and Commit": {
          testType: "testCompositeAction",
          testLabel: "Add Entity Author and Commit",
          compositeAction: {
            actionType: "compositeAction",
            actionLabel: "AddBookInstanceThenRollback",
            actionName: "sequence",
            definition: [
              {
                actionName: "rollback",
                actionLabel: "refreshMiroirLocalCache",
                actionType: "modelAction",
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
              },
              {
                actionName: "rollback",
                actionType: "modelAction",
                actionLabel: "refreshLibraryLocalCache",
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
              },
              {
                actionType: "modelAction",
                actionName: "createEntity",
                actionLabel: "addEntityAuthor",
                deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                entities: [
                  {
                    entity: entityAuthor as Entity,
                    entityDefinition: entityDefinitionAuthor as EntityDefinition,
                  },
                ],
              },
              {
                actionName: "commit",
                actionType: "modelAction",
                actionLabel: "commitLibraryLocalCache",
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
              },
              {
                // performs query on local cache for emulated server, and on server for remote server
                actionType: "compositeRunBoxedExtractorOrQueryAction",
                actionLabel: "calculateNewEntityDefinionAndReports",
                nameGivenToResult: "libraryEntityList",
                query: {
                  actionType: "runBoxedExtractorOrQueryAction",
                  actionName: "runQuery",
                  endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                  applicationSection: "model", // TODO: give only selfApplication section in individual queries?
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
              actionType: "compositeRunTestAssertion",
              actionLabel: "checkNumberOfBooks",
              nameGivenToResult: "checkNumberOfEntities",
              testAssertion: {
                testType: "testAssertion",
                testLabel: "checkNumberOfBooks",
                definition: {
                  resultAccessPath: ["elementValue", "0"],
                  resultTransformer: {
                    transformerType: "count",
                    interpolation: "runtime",
                    referencedExtractor: {
                      transformerType: "contextReference",
                      interpolation: "runtime",
                      referencePath: ["libraryEntityList", "entities"],
                    },
                  },
                  expectedValue: { count: 2 },
                },
              },
            },
            {
              actionType: "compositeRunTestAssertion",
              actionLabel: "checkEntityBooks",
              nameGivenToResult: "checkEntityList",
              testAssertion: {
                testType: "testAssertion",
                testLabel: "checkEntityBooks",
                definition: {
                  resultAccessPath: ["libraryEntityList", "entities"],
                  ignoreAttributes: ["author"],
                  expectedValue: [entityAuthor, entityPublisher],
                },
              },
            },
          ],
        },
        "Add Entity Author then rollback": {
          testType: "testCompositeAction",
          testLabel: "Add Entity Author then rollback",
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
                deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
              },
              {
                actionType: "modelAction",
                actionName: "createEntity",
                actionLabel: "addEntityAuthor",
                deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                entities: [
                  {
                    entity: entityAuthor as Entity,
                    entityDefinition: entityDefinitionAuthor as EntityDefinition,
                  },
                ],
              },
              {
                actionName: "rollback",
                actionType: "modelAction",
                actionLabel: "refreshLibraryLocalCache2",
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
              },
              {
                actionType: "compositeRunBoxedExtractorOrQueryAction",
                actionLabel: "calculateNewEntityDefinionAndReports",
                nameGivenToResult: "libraryEntityList",
                query: {
                  actionType: "runBoxedExtractorOrQueryAction",
                  actionName: "runQuery",
                  endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                  applicationSection: "model", // TODO: give only selfApplication section in individual queries?
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
              actionType: "compositeRunTestAssertion",
              actionLabel: "checkNumberOfBooks",
              nameGivenToResult: "checkNumberOfEntities",
              testAssertion: {
                testType: "testAssertion",
                testLabel: "checkNumberOfBooks",
                definition: {
                  resultAccessPath: ["elementValue", "0"],
                  resultTransformer: {
                    transformerType: "count",
                    interpolation: "runtime",
                    referencedExtractor: {
                      transformerType: "contextReference",
                      interpolation: "runtime",
                      referencePath: ["libraryEntityList", "entities"],
                    },
                  },
                  expectedValue: { count: 1 },
                },
              },
            },
          ],
        },
        "Add Entity Author then test before commit or rollback": {
          testType: "testCompositeAction",
          testLabel: "Add Entity Author then test before commit or rollback",
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
                deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
              },
              {
                actionType: "modelAction",
                actionName: "createEntity",
                actionLabel: "addEntityAuthor",
                deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                entities: [
                  {
                    entity: entityAuthor as Entity,
                    entityDefinition: entityDefinitionAuthor as EntityDefinition,
                  },
                ],
              },
              {
                actionType: "compositeRunBoxedExtractorOrQueryAction",
                actionLabel: "calculateNewEntityDefinionAndReportsFromLocalCache",
                nameGivenToResult: "libraryEntityListFromLocalCache",
                query: {
                  actionType: "runBoxedExtractorOrQueryAction",
                  actionName: "runQuery",
                  endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                  queryExecutionStrategy: "localCacheOrFail",
                  applicationSection: "model", // TODO: give only selfApplication section in individual queries?
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
                actionType: "compositeRunBoxedExtractorOrQueryAction",
                actionLabel: "calculateNewEntityDefinionAndReportsFromPersistentStore",
                nameGivenToResult: "libraryEntityListFromPersistentStore",
                query: {
                  actionType: "runBoxedExtractorOrQueryAction",
                  actionName: "runQuery",
                  endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                  queryExecutionStrategy: "storage",
                  applicationSection: "model", // TODO: give only selfApplication section in individual queries?
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
              actionType: "compositeRunTestAssertion",
              actionLabel: "checkNumberOfBooks",
              nameGivenToResult: "checkNumberOfEntitiesFromLocalCache",
              testAssertion: {
                testType: "testAssertion",
                testLabel: "checkNumberOfBooks",
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
                  expectedValue: { count: 2 },
                },
              },
            },
            {
              actionType: "compositeRunTestAssertion",
              actionLabel: "checkEntityBooks",
              nameGivenToResult: "checkEntityListFromLocalCache",
              testAssertion: {
                testType: "testAssertion",
                testLabel: "checkEntityBooks",
                definition: {
                  resultAccessPath: ["libraryEntityListFromLocalCache", "entities"],
                  ignoreAttributes: ["author"],
                  expectedValue: [entityAuthor, entityPublisher],
                },
              },
            },
            {
              actionType: "compositeRunTestAssertion",
              actionLabel: "checkNumberOfBooks",
              nameGivenToResult: "checkNumberOfEntitiesFromPersistentStore",
              testAssertion: {
                testType: "testAssertion",
                testLabel: "checkNumberOfBooks",
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
                  expectedValue: { count: 1 },
                },
              },
            },
            {
              actionType: "compositeRunTestAssertion",
              actionLabel: "checkEntityBooks",
              nameGivenToResult: "checkEntityListFromPersistentStore",
              testAssertion: {
                testType: "testAssertion",
                testLabel: "checkEntityBooks",
                definition: {
                  resultAccessPath: ["libraryEntityListFromPersistentStore", "entities"],
                  ignoreAttributes: ["author"],
                  expectedValue: [entityPublisher],
                },
              },
            },
          ],
        },
        "Drop Entity Publisher and Commit": {
          testType: "testCompositeAction",
          testLabel: "Drop Entity Publisher and Commit",
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
                deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
              },
              {
                actionType: "modelAction",
                actionName: "dropEntity",
                actionLabel: "dropEntityPublisher",
                deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                entityUuid: entityPublisher.uuid,
                entityDefinitionUuid: entityDefinitionPublisher.uuid,
              },
              {
                actionName: "commit",
                actionType: "modelAction",
                actionLabel: "commitLibraryLocalCache",
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
              },
              {
                // performs query on local cache for emulated server, and on server for remote server
                actionType: "compositeRunBoxedExtractorOrQueryAction",
                actionLabel: "calculateNewEntityDefinionAndReports",
                nameGivenToResult: "libraryEntityList",
                query: {
                  actionType: "runBoxedExtractorOrQueryAction",
                  actionName: "runQuery",
                  endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                  applicationSection: "model", // TODO: give only selfApplication section in individual queries?
                  deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                  queryExecutionStrategy: "storage",
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
              actionType: "compositeRunTestAssertion",
              actionLabel: "checkNumberOfEntities",
              nameGivenToResult: "checkNumberOfEntities",
              testAssertion: {
                testType: "testAssertion",
                testLabel: "checkNumberOfEntities",
                definition: {
                  resultAccessPath: ["elementValue", "0"],
                  resultTransformer: {
                    transformerType: "count",
                    interpolation: "runtime",
                    referencedExtractor: {
                      transformerType: "contextReference",
                      interpolation: "runtime",
                      referencePath: ["libraryEntityList", "entities"],
                    },
                  },
                  expectedValue: { count: 0 },
                },
              },
            },
            // {
            //   actionType: "compositeRunTestAssertion",
            //   actionLabel: "checkEntityList",
            //   nameGivenToResult: "checkEntityList",
            //   testAssertion: {
            //     testType: "testAssertion",
            //     definition: {
            //       resultAccessPath: ["libraryEntityList", "entities"],
            //       ignoreAttributes: [ ],
            //       expectedValue: [
            //         entityPublisher
            //       ],
            //     },
            //   },
            // },
          ],
        },
        "Rename Entity Publisher and Commit": {
          // TODO: this is incorrect!
          // there should be an "icon" attribute in the entityDefinitionPublisher
          // and a new attribute
          testType: "testCompositeAction",
          testLabel: "Rename Entity Publisher and Commit",
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
                deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
              },
              {
                actionType: "modelAction",
                actionName: "renameEntity",
                actionLabel: "dropEntityPublisher",
                deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                entityUuid: entityPublisher.uuid,
                entityDefinitionUuid: entityDefinitionPublisher.uuid,
                entityName: "Publisher",
                targetValue: "Publishers",
              },
              {
                actionName: "commit",
                actionType: "modelAction",
                actionLabel: "commitLibraryLocalCache",
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
              },
              {
                // performs query on local cache for emulated server, and on server for remote server
                actionType: "compositeRunBoxedExtractorOrQueryAction",
                actionLabel: "calculateNewEntityDefinionAndReports",
                nameGivenToResult: "libraryEntityList",
                query: {
                  actionType: "runBoxedExtractorOrQueryAction",
                  actionName: "runQuery",
                  endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                  applicationSection: "model", // TODO: give only selfApplication section in individual queries?
                  deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                  queryExecutionStrategy: "storage",
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
              actionType: "compositeRunTestAssertion",
              actionLabel: "checkNumberOfBooks",
              nameGivenToResult: "checkNumberOfEntities",
              testAssertion: {
                testType: "testAssertion",
                testLabel: "checkNumberOfBooks",
                definition: {
                  resultAccessPath: ["elementValue", "0"],
                  resultTransformer: {
                    transformerType: "count",
                    interpolation: "runtime",
                    referencedExtractor: {
                      transformerType: "contextReference",
                      interpolation: "runtime",
                      referencePath: ["libraryEntityList", "entities"],
                    },
                  },
                  expectedValue: { count: 1 },
                },
              },
            },
            {
              actionType: "compositeRunTestAssertion",
              actionLabel: "checkEntityBooks",
              nameGivenToResult: "checkEntityList",
              testAssertion: {
                testType: "testAssertion",
                testLabel: "checkEntityBooks",
                definition: {
                  resultAccessPath: ["libraryEntityList", "entities"],
                  ignoreAttributes: ["author"],
                  expectedValue: [{ ...entityPublisher, name: "Publishers" }],
                },
              },
            },
          ],
        },
        "Alter Entity Publisher and Commit": {
          testType: "testCompositeAction",
          testLabel: "Alter Entity Publisher and Commit",
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
                deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
              },
              {
                actionType: "modelAction",
                actionName: "alterEntityAttribute",
                actionLabel: "alterEntityPublisher",
                deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                entityName: entityPublisher.name,
                entityUuid: entityPublisher.uuid,
                entityDefinitionUuid: entityDefinitionPublisher.uuid,
                addColumns: [
                  {
                    name: "aNewColumnForTest",
                    definition: columnForTestDefinition,
                  },
                ],
              },
              {
                actionName: "commit",
                actionType: "modelAction",
                actionLabel: "commitLibraryLocalCache",
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
              },
              {
                // performs query on local cache for emulated server, and on server for remote server
                actionType: "compositeRunBoxedExtractorOrQueryAction",
                actionLabel: "calculateNewEntityDefinionAndReports",
                nameGivenToResult: "libraryEntityDefinitionListFromPersistentStore",
                query: {
                  actionType: "runBoxedExtractorOrQueryAction",
                  actionName: "runQuery",
                  endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                  applicationSection: "model", // TODO: give only selfApplication section in individual queries?
                  deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                  queryExecutionStrategy: "storage",
                  query: {
                    queryType: "boxedQueryWithExtractorCombinerTransformer",
                    deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                    pageParams: {
                      currentDeploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                    },
                    queryParams: {},
                    contextResults: {},
                    extractors: {
                      entityDefinitions: {
                        extractorOrCombinerType: "extractorByEntityReturningObjectList",
                        applicationSection: "model",
                        parentName: entityEntityDefinition.name,
                        parentUuid: entityEntityDefinition.uuid,
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
                // performs query on local cache for emulated server, and on server for remote server
                actionType: "compositeRunBoxedExtractorOrQueryAction",
                actionLabel: "calculateNewEntityDefinionAndReports",
                nameGivenToResult: "libraryEntityDefinitionListFromLocalCache",
                query: {
                  actionType: "runBoxedExtractorOrQueryAction",
                  actionName: "runQuery",
                  endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                  applicationSection: "model", // TODO: give only selfApplication section in individual queries?
                  deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                  queryExecutionStrategy: "storage",
                  query: {
                    queryType: "boxedQueryWithExtractorCombinerTransformer",
                    deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                    pageParams: {
                      currentDeploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                    },
                    queryParams: {},
                    contextResults: {},
                    extractors: {
                      entityDefinitions: {
                        extractorOrCombinerType: "extractorByEntityReturningObjectList",
                        applicationSection: "model",
                        parentName: entityEntityDefinition.name,
                        parentUuid: entityEntityDefinition.uuid,
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
              actionType: "compositeRunTestAssertion",
              actionLabel: "checkNumberOfBooks",
              nameGivenToResult: "checkNumberOfEntitiesFromPersistentStore",
              testAssertion: {
                testType: "testAssertion",
                testLabel: "checkNumberOfBooks",
                definition: {
                  resultAccessPath: ["elementValue", "0"],
                  resultTransformer: {
                    transformerType: "count",
                    interpolation: "runtime",
                    referencedExtractor: {
                      transformerType: "contextReference",
                      interpolation: "runtime",
                      referencePath: ["libraryEntityDefinitionListFromPersistentStore", "entityDefinitions"],
                    },
                  },
                  expectedValue: { count: 1 },
                },
              },
            },
            {
              actionType: "compositeRunTestAssertion",
              actionLabel: "checkNumberOfBooks",
              nameGivenToResult: "checkNumberOfEntitiesFromLocalCache",
              testAssertion: {
                testType: "testAssertion",
                testLabel: "checkNumberOfBooks",
                definition: {
                  resultAccessPath: ["elementValue", "0"],
                  resultTransformer: {
                    transformerType: "count",
                    interpolation: "runtime",
                    referencedExtractor: {
                      transformerType: "contextReference",
                      interpolation: "runtime",
                      referencePath: ["libraryEntityDefinitionListFromLocalCache", "entityDefinitions"],
                    },
                  },
                  expectedValue: { count: 1 },
                },
              },
            },
            {
              actionType: "compositeRunTestAssertion",
              actionLabel: "checkEntityBooks",
              nameGivenToResult: "checkEntityDefinitionFromLocalCache",
              testAssertion: {
                testType: "testAssertion",
                testLabel: "checkEntityBooks",
                definition: {
                  resultAccessPath: ["libraryEntityDefinitionListFromLocalCache", "entityDefinitions"],
                  ignoreAttributes: ["author"],
                  expectedValue: [
                    {
                      ...entityDefinitionPublisher,
                      jzodSchema: {
                        ...entityDefinitionPublisher.jzodSchema,
                        definition: {
                          ...entityDefinitionPublisher.jzodSchema.definition,
                          aNewColumnForTest: columnForTestDefinition,
                        },
                      },
                    },
                  ],
                },
              },
            },
            {
              actionType: "compositeRunTestAssertion",
              actionLabel: "checkEntityBooks",
              nameGivenToResult: "checkEntityDefinitionFromPersistentStore",
              testAssertion: {
                testType: "testAssertion",
                testLabel: "checkEntityBooks",
                definition: {
                  resultAccessPath: ["libraryEntityDefinitionListFromPersistentStore", "entityDefinitions"],
                  ignoreAttributes: ["author"],
                  expectedValue: [
                    {
                      ...entityDefinitionPublisher,
                      jzodSchema: {
                        ...entityDefinitionPublisher.jzodSchema,
                        definition: {
                          ...entityDefinitionPublisher.jzodSchema.definition,
                          aNewColumnForTest: columnForTestDefinition,
                        },
                      },
                    },
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
  "DomainController.integ.Model.CRUD",
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
