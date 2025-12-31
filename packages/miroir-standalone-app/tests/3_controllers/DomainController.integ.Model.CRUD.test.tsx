import { describe, expect } from "vitest";

import { fetch as crossFetch } from "cross-fetch";
// import process from "process";

import {
  AdminApplicationDeploymentConfiguration,
  adminConfigurationDeploymentLibrary,
  adminConfigurationDeploymentMiroir,
  ConfigurationService, defaultMiroirMetaModel,
  displayTestSuiteResultsDetails,
  DomainControllerInterface,
  Entity,
  entityAuthor,
  EntityDefinition,
  entityDefinitionAuthor,
  entityDefinitionPublisher,
  entityEntity,
  entityEntityDefinition,
  EntityInstance,
  entityPublisher,
  JzodElement,
  LocalCacheInterface,
  LoggerInterface,
  LoggerOptions,
  MetaEntity,
  MiroirActivityTracker,
  MiroirContextInterface,
  miroirCoreStartup,
  MiroirEventService,
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
  TestCompositeActionParams,
  TestSuiteResult,
} from "miroir-core";


import {
  adminApplicationDeploymentConfigurations,
  deleteAndCloseApplicationDeployments,
  runTestOrTestSuite,
  setupMiroirTest,
} from "../../src/miroir-fwk/4-tests/tests-utils.js";

import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";
import { miroirIndexedDbStoreSectionStartup } from "miroir-store-indexedDb";
import { miroirPostgresStoreSectionStartup } from "miroir-store-postgres";
import { miroirAppStartup } from "../../src/startup.js";


// import { packageName } from "miroir-core/src/constants.js";
import {
  testOnLibrary_deleteLibraryDeployment,
  testOnLibrary_resetLibraryDeployment,
} from "../../src/miroir-fwk/4-tests/tests-utils-testOnLibrary.js";
// import { loglevelnext } from '../../src/loglevelnextImporter.js';
import { loglevelnext } from "../../src/loglevelnextImporter.js";
import { loadTestConfigFiles } from "../utils/fileTools.js";

import { packageName } from "../../src/constants.js";
import { cleanLevel } from "./constants.js";
import { defaultMiroirModelEnvironment } from "miroir-core";
import { createDeploymentCompositeAction } from "miroir-core";
import { resetAndinitializeDeploymentCompositeAction } from "miroir-core";
import type { ApplicationEntitiesAndInstances } from "miroir-core";
import { adminMiroirApplication } from "miroir-core";

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
  tag: { value: { id: 6, defaultLabel: "Gender (narrow-minded)", editable: true } },
};
// const globalTimeOut = 10^9;
const miroirDeploymentStorageConfiguration: StoreUnitConfiguration = miroirConfig.client.emulateServer
  ? miroirConfig.client.deploymentStorageConfig[adminConfigurationDeploymentMiroir.uuid]
  : miroirConfig.client.serverConfig.storeSectionConfiguration[adminConfigurationDeploymentMiroir.uuid];

const testApplicationDeploymentUuid = adminConfigurationDeploymentLibrary.uuid;

const testDeploymentStorageConfiguration = miroirConfig.client.emulateServer
  ? miroirConfig.client.deploymentStorageConfig[testApplicationDeploymentUuid]
  : miroirConfig.client.serverConfig.storeSectionConfiguration[testApplicationDeploymentUuid];

// const typedAdminConfigurationDeploymentLibrary: AdminApplicationDeploymentConfiguration =
//   adminConfigurationDeploymentLibrary as any;

let domainController: DomainControllerInterface;
let localCache: LocalCacheInterface;
let miroirContext: MiroirContextInterface;
let persistenceStoreControllerManager: PersistenceStoreControllerManagerInterface;
// let globalTestSuiteResults: TestSuiteResult = {};

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
  } = await setupMiroirTest(miroirConfig, miroirActivityTracker, miroirEventService, crossFetch);

  persistenceStoreControllerManager = localpersistenceStoreControllerManager;
  domainController = localdomainController;
  localCache = locallocalCache;
  miroirContext = localmiroirContext;

  // create the Miroir app deployment containing the meta-model
  const createMiroirDeploymentCompositeAction = createDeploymentCompositeAction(
    "miroir",
    adminConfigurationDeploymentMiroir.uuid,
    adminMiroirApplication.uuid,
    miroirDeploymentStorageConfiguration
  );
  const createDeploymentResult = await domainController.handleCompositeAction(
    createMiroirDeploymentCompositeAction,
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
  await resetAndInitApplicationDeployment(domainController, [
    selfApplicationDeploymentMiroir as SelfApplicationDeploymentConfiguration,
  ]);
  document.body.innerHTML = "";
});

afterAll(async () => {
  await deleteAndCloseApplicationDeployments(miroirConfig, domainController, adminApplicationDeploymentConfigurations);
  // displayTestSuiteResults(expect,Object.keys(testActions)[0]);
  displayTestSuiteResultsDetails(
    Object.keys(testActions)[0],
    // [{ testSuite: Object.keys(testActions)[0] }],
    [],
    miroirActivityTracker
  );
});

const testActions: Record<string, TestCompositeActionParams> = {
  "DomainController.integ.Model.CRUD": {
    testActionType: "testCompositeActionSuite",
    testActionLabel: "DomainController.integ.Model.CRUD",
    deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
    testCompositeAction: {
      testType: "testCompositeActionSuite",
      testLabel: "DomainController.integ.Model.CRUD",
      beforeAll: createDeploymentCompositeAction(
        "library",
        testApplicationDeploymentUuid,
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
            instances: [
              publisher1 as EntityInstance,
              publisher2 as EntityInstance,
              publisher3 as EntityInstance,
            ],
          },
        ]
      ),
      afterEach: testOnLibrary_resetLibraryDeployment(adminConfigurationDeploymentLibrary.uuid),
      afterAll: testOnLibrary_deleteLibraryDeployment(
        miroirConfig,
        adminConfigurationDeploymentLibrary.uuid
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
              definition: [
                {
                  actionType: "rollback",
                  // actionType: "modelAction",
                  actionLabel: "refreshMiroirLocalCache",
                  application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
                    deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
                  },
                },
                {
                  actionType: "rollback",
                  // actionType: "modelAction",
                  actionLabel: "refreshLibraryLocalCache",
                  application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
                    deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                  },
                },
                {
                  actionType: "compositeRunBoxedExtractorOrQueryAction",
                  actionLabel: "calculateNewEntityDefinionAndReports",
                  nameGivenToResult: "libraryEntityList",
                  query: {
                    actionType: "runBoxedExtractorOrQueryAction",
                    application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                    endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                    deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                    payload: {
                      applicationSection: "model", // TODO: give only selfApplication section in individual queries?
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
                },
              ],
            },
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
          ],
        },
        "Add Entity Author and Commit": {
          testType: "testCompositeAction",
          testLabel: "Add Entity Author and Commit",
          compositeActionSequence: {
            actionType: "compositeActionSequence",
            actionLabel: "AddBookInstanceThenRollback",
            application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
            endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
            payload: {
              definition: [
                {
                  // actionType: "modelAction",
                  actionType: "rollback",
                  actionLabel: "refreshMiroirLocalCache",
                  application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
                    deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
                  },
                },
                {
                  actionType: "rollback",
                  // actionType: "modelAction",
                  actionLabel: "refreshLibraryLocalCache",
                  application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
                    deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                  },
                },
                {
                  // actionType: "modelAction",
                  actionType: "createEntity",
                  actionLabel: "addEntityAuthor",
                  application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
                    deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
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
                  // actionType: "modelAction",
                  actionLabel: "commitLibraryLocalCache",
                  application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
                    deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                  },
                },
                {
                  // performs query on local cache for emulated server, and on server for remote server
                  actionType: "compositeRunBoxedExtractorOrQueryAction",
                  actionLabel: "calculateNewEntityDefinionAndReports",
                  nameGivenToResult: "libraryEntityList",
                  query: {
                    actionType: "runBoxedExtractorOrQueryAction",
                    application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                    endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                    deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                    payload: {
                      applicationSection: "model", // TODO: give only selfApplication section in individual queries?
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
                },
              ],
            },
          },
          testCompositeActionAssertions: [
            // TODO: test length of entityBookList.books!
            {
              actionType: "compositeRunTestAssertion",
              actionLabel: "checkNumberOfBooks",
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
                  expectedValue: { aggregate: 2 },
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
                  ignoreAttributes: ["author", "storageAccess"],
                  expectedValue: [entityAuthor, entityPublisher],
                },
              },
            },
          ],
        },
        "Add Entity Author then rollback": {
          testType: "testCompositeAction",
          testLabel: "Add Entity Author then rollback",
          compositeActionSequence: {
            actionType: "compositeActionSequence",
            actionLabel: "AddBookInstanceThenRollback",
            application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
            endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
            payload: {
              definition: [
                {
                  actionType: "rollback",
                  // actionType: "modelAction",
                  actionLabel: "refreshMiroirLocalCache",
                  application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
                    deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
                  },
                },
                {
                  actionType: "rollback",
                  // actionType: "modelAction",
                  actionLabel: "refreshLibraryLocalCache",
                  application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
                    deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                  },
                },
                {
                  // actionType: "modelAction",
                  actionType: "createEntity",
                  actionLabel: "addEntityAuthor",
                  application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
                    deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                    entities: [
                      {
                        entity: entityAuthor as Entity,
                        entityDefinition: entityDefinitionAuthor as EntityDefinition,
                      },
                    ],
                  },
                },
                {
                  actionType: "rollback",
                  // actionType: "modelAction",
                  actionLabel: "refreshLibraryLocalCache2",
                  application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
                    deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                  },
                },
                {
                  actionType: "compositeRunBoxedExtractorOrQueryAction",
                  actionLabel: "calculateNewEntityDefinionAndReports",
                  nameGivenToResult: "libraryEntityList",
                  query: {
                    actionType: "runBoxedExtractorOrQueryAction",
                    application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                    endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                    deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                    payload: {
                      applicationSection: "model", // TODO: give only selfApplication section in individual queries?
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
                },
              ],
            },
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
          ],
        },
        "Add Entity Author then test before commit or rollback": {
          testType: "testCompositeAction",
          testLabel: "Add Entity Author then test before commit or rollback",
          compositeActionSequence: {
            actionType: "compositeActionSequence",
            actionLabel: "AddBookInstanceThenRollback",
            application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
            endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
            payload: {
              definition: [
                {
                  actionType: "rollback",
                  // actionType: "modelAction",
                  actionLabel: "refreshMiroirLocalCache",
                  application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
                    deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
                  },
                },
                {
                  actionType: "rollback",
                  // actionType: "modelAction",
                  actionLabel: "refreshLibraryLocalCache",
                  application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
                    deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                  },
                },
                {
                  // actionType: "modelAction",
                  actionType: "createEntity",
                  actionLabel: "addEntityAuthor",
                  application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
                    deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                    entities: [
                      {
                        entity: entityAuthor as Entity,
                        entityDefinition: entityDefinitionAuthor as EntityDefinition,
                      },
                    ],
                  },
                },
                {
                  actionType: "compositeRunBoxedExtractorOrQueryAction",
                  actionLabel: "calculateNewEntityDefinionAndReportsFromLocalCache",
                  nameGivenToResult: "libraryEntityListFromLocalCache",
                  query: {
                    actionType: "runBoxedExtractorOrQueryAction",
                    application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                    endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                    deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                    payload: {
                      applicationSection: "model", // TODO: give only selfApplication section in individual queries?
                      queryExecutionStrategy: "localCacheOrFail",
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
                },
                {
                  actionType: "compositeRunBoxedExtractorOrQueryAction",
                  actionLabel: "calculateNewEntityDefinionAndReportsFromPersistentStore",
                  nameGivenToResult: "libraryEntityListFromPersistentStore",
                  query: {
                    actionType: "runBoxedExtractorOrQueryAction",
                    application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                    endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                    deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                    payload: {
                      queryExecutionStrategy: "storage",
                      applicationSection: "model", // TODO: give only selfApplication section in individual queries?
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
                },
              ],
            },
          },
          testCompositeActionAssertions: [
            // TODO: test length of entityBookList.books!
            {
              actionType: "compositeRunTestAssertion",
              actionLabel: "checkNumberOfEntitiesFromLocalCache",
              nameGivenToResult: "checkNumberOfEntitiesFromLocalCache",
              testAssertion: {
                testType: "testAssertion",
                testLabel: "checkNumberOfEntitiesFromLocalCache",
                definition: {
                  resultAccessPath: ["0"],
                  resultTransformer: {
                    transformerType: "aggregate",
                    interpolation: "runtime",
                    applyTo: {
                      transformerType: "getFromContext",
                      interpolation: "runtime",
                      referencePath: ["libraryEntityListFromLocalCache", "entities"],
                    },
                  },
                  expectedValue: { aggregate: 2 },
                },
              },
            },
            {
              actionType: "compositeRunTestAssertion",
              actionLabel: "checkEntitiesAreAuthorAndPublisher",
              nameGivenToResult: "checkEntityListFromLocalCache",
              testAssertion: {
                testType: "testAssertion",
                testLabel: "checkEntitiesAreAuthorAndPublisher",
                definition: {
                  resultAccessPath: ["libraryEntityListFromLocalCache", "entities"],
                  ignoreAttributes: ["author", "storageAccess"],
                  expectedValue: [entityAuthor, entityPublisher],
                },
              },
            },
            {
              actionType: "compositeRunTestAssertion",
              actionLabel: "checkNumberOfEntitiesFromPersistentStore",
              nameGivenToResult: "checkNumberOfEntitiesFromPersistentStore",
              testAssertion: {
                testType: "testAssertion",
                testLabel: "checkNumberOfEntitiesFromPersistentStore",
                definition: {
                  resultAccessPath: ["0"],
                  resultTransformer: {
                    transformerType: "aggregate",
                    interpolation: "runtime",
                    applyTo: {
                      transformerType: "getFromContext",
                      interpolation: "runtime",
                      referencePath: ["libraryEntityListFromPersistentStore", "entities"],
                    },
                  },
                  expectedValue: { aggregate: 1 },
                },
              },
            },
            {
              actionType: "compositeRunTestAssertion",
              actionLabel: "checkEntityFromPersistentStore",
              nameGivenToResult: "checkEntityListFromPersistentStore",
              testAssertion: {
                testType: "testAssertion",
                testLabel: "checkEntityFromPersistentStore",
                definition: {
                  resultAccessPath: ["libraryEntityListFromPersistentStore", "entities"],
                  ignoreAttributes: ["author", "storageAccess"],
                  expectedValue: [entityPublisher],
                },
              },
            },
          ],
        },
        "Drop Entity Publisher and Commit": {
          testType: "testCompositeAction",
          testLabel: "Drop Entity Publisher and Commit",
          compositeActionSequence: {
            actionType: "compositeActionSequence",
            actionLabel: "AddBookInstanceThenRollback",
            application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
            endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
            payload: {
              definition: [
                {
                  actionType: "rollback",
                  actionLabel: "refreshMiroirLocalCache",
                  application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
                    deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
                  },
                },
                {
                  actionType: "rollback",
                  // actionType: "modelAction",
                  actionLabel: "refreshLibraryLocalCache",
                  application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
                    deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                  },
                },
                {
                  // actionType: "modelAction",
                  actionType: "dropEntity",
                  actionLabel: "dropEntityPublisher",
                  application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
                    deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                    entityUuid: entityPublisher.uuid,
                    entityDefinitionUuid: entityDefinitionPublisher.uuid,
                  },
                },
                {
                  actionType: "commit",
                  // actionType: "modelAction",
                  actionLabel: "commitLibraryLocalCache",
                  application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
                    deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                  },
                },
                {
                  // performs query on local cache for emulated server, and on server for remote server
                  actionType: "compositeRunBoxedExtractorOrQueryAction",
                  actionLabel: "calculateNewEntityDefinionAndReports",
                  nameGivenToResult: "libraryEntityList",
                  query: {
                    actionType: "runBoxedExtractorOrQueryAction",
                    application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                    endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                    deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                    payload: {
                      applicationSection: "model", // TODO: give only selfApplication section in individual queries?
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
                  expectedValue: { aggregate: 0 },
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
          compositeActionSequence: {
            actionType: "compositeActionSequence",
            actionLabel: "AddBookInstanceThenRollback",
            application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
            endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
            payload: {
              definition: [
                {
                  actionType: "rollback",
                  // actionType: "modelAction",
                  actionLabel: "refreshMiroirLocalCache",
                  application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
                    deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
                  },
                },
                {
                  actionType: "rollback",
                  // actionType: "modelAction",
                  actionLabel: "refreshLibraryLocalCache",
                  application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
                    deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                  },
                },
                {
                  // actionType: "modelAction",
                  actionType: "renameEntity",
                  actionLabel: "dropEntityPublisher",
                  application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
                    deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                    entityUuid: entityPublisher.uuid,
                    entityDefinitionUuid: entityDefinitionPublisher.uuid,
                    entityName: "Publisher",
                    targetValue: "Publishers",
                  },
                },
                {
                  actionType: "commit",
                  // actionType: "modelAction",
                  actionLabel: "commitLibraryLocalCache",
                  application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
                    deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                  },
                },
                {
                  // performs query on local cache for emulated server, and on server for remote server
                  actionType: "compositeRunBoxedExtractorOrQueryAction",
                  actionLabel: "calculateNewEntityDefinionAndReports",
                  nameGivenToResult: "libraryEntityList",
                  query: {
                    actionType: "runBoxedExtractorOrQueryAction",
                    application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                    endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                    deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                    payload: {
                      applicationSection: "model", // TODO: give only selfApplication section in individual queries?
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
                },
              ],
            },
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
                  resultAccessPath: ["0"],
                  resultTransformer: {
                    transformerType: "aggregate",
                    interpolation: "runtime",
                    applyTo: {
                      transformerType: "getFromContext",
                      interpolation: "runtime",
                      referencePath: ["libraryEntityList", "entities"],
                    },
                    // referencedTransformer: {
                    //   transformerType: "getFromContext",
                    //   interpolation: "runtime",
                    //   referencePath: ["libraryEntityList", "entities"],
                    // },
                  },
                  expectedValue: { aggregate: 1 },
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
                  ignoreAttributes: ["author", "storageAccess"],
                  expectedValue: [{ ...entityPublisher, name: "Publishers" }],
                },
              },
            },
          ],
        },
        "Alter Entity Publisher and Commit": {
          testType: "testCompositeAction",
          testLabel: "Alter Entity Publisher and Commit",
          compositeActionSequence: {
            actionType: "compositeActionSequence",
            actionLabel: "AddBookInstanceThenRollback",
            application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
            endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
            payload: {
              definition: [
                {
                  actionType: "rollback",
                  actionLabel: "refreshMiroirLocalCache",
                  application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
                    deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
                  },
                },
                {
                  actionType: "rollback",
                  // actionType: "modelAction",
                  actionLabel: "refreshLibraryLocalCache",
                  application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
                    deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                  },
                },
                {
                  // actionType: "modelAction",
                  actionType: "alterEntityAttribute",
                  actionLabel: "alterEntityPublisher",
                  application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
                    deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
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
                },
                {
                  actionType: "commit",
                  // actionType: "modelAction",
                  actionLabel: "commitLibraryLocalCache",
                  application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
                    deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                  },
                },
                {
                  // performs query on local cache for emulated server, and on server for remote server
                  actionType: "compositeRunBoxedExtractorOrQueryAction",
                  actionLabel: "calculateNewEntityDefinionAndReports",
                  nameGivenToResult: "libraryEntityDefinitionListFromPersistentStore",
                  query: {
                    actionType: "runBoxedExtractorOrQueryAction",
                    application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                    endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                    deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                    payload: {
                      applicationSection: "model", // TODO: give only selfApplication section in individual queries?
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
                },
                {
                  // performs query on local cache for emulated server, and on server for remote server
                  actionType: "compositeRunBoxedExtractorOrQueryAction",
                  actionLabel: "calculateNewEntityDefinionAndReports",
                  nameGivenToResult: "libraryEntityDefinitionListFromLocalCache",
                  query: {
                    actionType: "runBoxedExtractorOrQueryAction",
                    application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                    endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                    deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                    payload: {
                      applicationSection: "model", // TODO: give only selfApplication section in individual queries?
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
                },
              ],
            },
          },
          testCompositeActionAssertions: [
            // TODO: test length of entityBookList.books!
            {
              actionType: "compositeRunTestAssertion",
              actionLabel: "checkNumberOfBooksFromPersisentStore",
              nameGivenToResult: "checkNumberOfEntitiesFromPersistentStore",
              testAssertion: {
                testType: "testAssertion",
                testLabel: "checkNumberOfBooksFromPersisentStore",
                definition: {
                  resultAccessPath: ["0"],
                  resultTransformer: {
                    transformerType: "aggregate",
                    interpolation: "runtime",
                    applyTo: {
                      transformerType: "getFromContext",
                      interpolation: "runtime",
                      referencePath: [
                        "libraryEntityDefinitionListFromPersistentStore",
                        "entityDefinitions",
                      ],
                    },
                  },
                  expectedValue: { aggregate: 1 },
                },
              },
            },
            {
              actionType: "compositeRunTestAssertion",
              actionLabel: "checkNumberOfBooksFromLocalCache",
              nameGivenToResult: "checkNumberOfEntitiesFromLocalCache",
              testAssertion: {
                testType: "testAssertion",
                testLabel: "checkNumberOfBooksFromLocalCache",
                definition: {
                  resultAccessPath: ["0"],
                  resultTransformer: {
                    transformerType: "aggregate",
                    interpolation: "runtime",
                    applyTo: {
                      transformerType: "getFromContext",
                      interpolation: "runtime",
                      referencePath: [
                        "libraryEntityDefinitionListFromLocalCache",
                        "entityDefinitions",
                      ],
                    },
                  },
                  expectedValue: { aggregate: 1 },
                },
              },
            },
            // {
            //   actionType: "compositeRunTestAssertion",
            //   actionLabel: "checkEntityBooks",
            //   nameGivenToResult: "checkEntityDefinitionFromLocalCache",
            //   testAssertion: {
            //     testType: "testAssertion",
            //     testLabel: "checkEntityBooks",
            //     definition: {
            //       resultAccessPath: ["libraryEntityDefinitionListFromLocalCache", "entityDefinitions"],
            //       ignoreAttributes: ["author", "storageAccess"],
            //       expectedValue: [
            //         {
            //           ...entityDefinitionPublisher,
            //           jzodSchema: {
            //             ...entityDefinitionPublisher.jzodSchema,
            //             definition: {
            //               ...entityDefinitionPublisher.jzodSchema.definition,
            //               aNewColumnForTest: columnForTestDefinition,
            //             },
            //           },
            //         },
            //       ],
            //     },
            //   },
            // },
            // {
            //   actionType: "compositeRunTestAssertion",
            //   actionLabel: "checkEntityBooks",
            //   nameGivenToResult: "checkEntityDefinitionFromPersistentStore",
            //   testAssertion: {
            //     testType: "testAssertion",
            //     testLabel: "checkEntityBooks",
            //     definition: {
            //       resultAccessPath: ["libraryEntityDefinitionListFromPersistentStore", "entityDefinitions"],
            //       ignoreAttributes: ["author", "storageAccess"],
            //       expectedValue: [
            //         {
            //           ...entityDefinitionPublisher,
            //           jzodSchema: {
            //             ...entityDefinitionPublisher.jzodSchema,
            //             definition: {
            //               ...entityDefinitionPublisher.jzodSchema.definition,
            //               aNewColumnForTest: columnForTestDefinition,
            //             },
            //           },
            //         },
            //       ],
            //     },
            //   },
            // },
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
      async (currentTestSuiteName, testAction: TestCompositeActionParams) => {
        const testSuiteResults = await runTestOrTestSuite(
          domainController,
          testAction,
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
