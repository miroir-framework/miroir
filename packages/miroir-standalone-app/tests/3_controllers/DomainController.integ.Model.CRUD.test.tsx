import { describe, expect } from "vitest";

import { fetch as crossFetch } from "cross-fetch";
// import process from "process";

import {
  ConfigurationService,
  // defaultLibraryModelEnvironment,
  defaultMiroirMetaModel,
  displayTestSuiteResultsDetails,
  DomainControllerInterface,
  Entity,
  EntityDefinition,
  entityEntity,
  entityEntityDefinition,
  EntityInstance,
  JzodElement,
  LocalCacheInterface,
  LoggerInterface,
  LoggerOptions,
  MetaEntity,
  MiroirActivityTracker,
  MiroirContextInterface,
  miroirCoreStartup,
  MiroirEventService,
  miroirFundamentalJzodSchema,
  MiroirLoggerFactory,
  PersistenceStoreControllerManagerInterface,
  resetAndInitApplicationDeployment,
  Deployment,
  selfApplicationDeploymentMiroir,
  StoreUnitConfiguration,
  TestCompositeActionParams
} from "miroir-core";


import {
  runTestOrTestSuite,
  setupMiroirTest
} from "../../src/miroir-fwk/4-tests/tests-utils.js";

import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";
import { miroirIndexedDbStoreSectionStartup } from "miroir-store-indexedDb";
import { miroirMongoDbStoreSectionStartup } from "miroir-store-mongodb";
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

import type {
  ApplicationDeploymentMap,
  ApplicationEntitiesAndInstances,
  Deployment,
  EndpointDefinition,
  MlSchema,
} from "miroir-core";
import {
  createDeploymentCompositeAction,
  defaultMiroirModelEnvironment,
  defaultSelfApplicationDeploymentMap,
  resetAndinitializeDeploymentCompositeAction,
  selfApplicationMiroir,
} from "miroir-core";
import {
  endpointDocument,
  entityAuthor,
  entityDefinitionAuthor,
  entityDefinitionPublisher,
  entityPublisher,
  getDefaultLibraryModelEnvironmentDEFUNCT,
  folio as publisher1,
  penguin as publisher2,
  springer as publisher3,
  selfApplicationLibrary,
  selfApplicationModelBranchLibraryMasterBranch,
  selfApplicationVersionLibraryInitialVersion,
} from "miroir-test-app_deployment-library";
import { packageName } from "../../src/constants.js";
import { cleanLevel } from "./constants.js";
import { deployment_Admin, adminApplication_Miroir } from "miroir-test-app_deployment-admin";
// import { entityBook } from "miroir-core";

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
const columnForTestDefinition: JzodElement = {
  type: "number",
  optional: true,
  tag: { value: { id: 6, defaultLabel: "Gender (narrow-minded)"} },
};
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

const testDeployment: Deployment = {
  ...deployment_Library_DO_NO_USE,
  configuration: testDeploymentStorageConfiguration,
};


// const typedAdminConfigurationDeploymentLibrary: AdminApplicationDeploymentConfiguration =
//   deployment_Library_DO_NO_USE as any;

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
});

const defaultLibraryModelEnvironment = getDefaultLibraryModelEnvironmentDEFUNCT(
  miroirFundamentalJzodSchema as MlSchema,
  defaultMiroirMetaModel,
  endpointDocument as EndpointDefinition,
  deployment_Library_DO_NO_USE.uuid,
);

const testActions: Record<string, TestCompositeActionParams> = {
  "DomainController.integ.Model.CRUD": {
    testActionType: "testCompositeActionSuite",
    testActionLabel: "DomainController.integ.Model.CRUD",
    application: testApplicationUuid,
    testCompositeAction: {
      testType: "testCompositeActionSuite",
      testLabel: "DomainController.integ.Model.CRUD",
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
          // deployment: selfApplicationDeploymentLibrary,
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
        ],
        defaultLibraryModelEnvironment.currentModel as any,
        [entityPublisher.uuid], 
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
              application: "NOT_USED_HERE",
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
                  actionType: "compositeRunBoxedExtractorOrQueryAction",
                  actionLabel: "calculateNewEntityDefinionAndReports",
                  nameGivenToResult: "libraryEntityList",
                  query: {
                    actionType: "runBoxedExtractorOrQueryAction",
                    application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                    endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                    payload: {
                      application: testApplicationUuid,
                      applicationSection: "model", // TODO: give only selfApplication section in individual queries?
                      // deploymentUuid: testApplicationDeploymentUuid,
                      query: {
                        queryType: "boxedQueryWithExtractorCombinerTransformer",
                        application: testApplicationUuid,
                        // applicationDeploymentMap: defaultSelfApplicationDeploymentMap,
                        // deploymentUuid: testApplicationDeploymentUuid,
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
              application: "NOT_USED_HERE",
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
                  application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
                    application: testApplicationUuid,
                  },
                },
                {
                  actionType: "createEntity",
                  actionLabel: "addEntityAuthor",
                  application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
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
                  application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
                    application: testApplicationUuid,
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
              application: "NOT_USED_HERE",
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
                  // actionType: "modelAction",
                  actionType: "createEntity",
                  actionLabel: "addEntityAuthor",
                  application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
                    application: testApplicationUuid,
                    // deploymentUuid: testApplicationDeploymentUuid,
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
                    application: testApplicationUuid,
                    // deploymentUuid: testApplicationDeploymentUuid,
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
                    payload: {
                      application: testApplicationUuid,
                      // deploymentUuid: testApplicationDeploymentUuid,
                      applicationSection: "model", // TODO: give only selfApplication section in individual queries?
                      query: {
                        queryType: "boxedQueryWithExtractorCombinerTransformer",
                        application: testApplicationUuid,
                        // applicationDeploymentMap: defaultSelfApplicationDeploymentMap,
                        // deploymentUuid: testApplicationDeploymentUuid,
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
              application: "NOT_USED_HERE",
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
                  // actionType: "modelAction",
                  actionType: "createEntity",
                  actionLabel: "addEntityAuthor",
                  application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
                    // deploymentUuid: testApplicationDeploymentUuid,
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
                  actionType: "compositeRunBoxedExtractorOrQueryAction",
                  actionLabel: "calculateNewEntityDefinionAndReportsFromLocalCache",
                  nameGivenToResult: "libraryEntityListFromLocalCache",
                  query: {
                    actionType: "runBoxedExtractorOrQueryAction",
                    application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                    endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                    payload: {
                      application: testApplicationUuid,
                      // deploymentUuid: testApplicationDeploymentUuid,
                      applicationSection: "model", // TODO: give only selfApplication section in individual queries?
                      queryExecutionStrategy: "localCacheOrFail",
                      query: {
                        queryType: "boxedQueryWithExtractorCombinerTransformer",
                        application: testApplicationUuid,
                        // applicationDeploymentMap: defaultSelfApplicationDeploymentMap,
                        // deploymentUuid: testApplicationDeploymentUuid,
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
                {
                  actionType: "compositeRunBoxedExtractorOrQueryAction",
                  actionLabel: "calculateNewEntityDefinionAndReportsFromPersistentStore",
                  nameGivenToResult: "libraryEntityListFromPersistentStore",
                  query: {
                    actionType: "runBoxedExtractorOrQueryAction",
                    application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                    endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                    payload: {
                      // deploymentUuid: deployment_Library_DO_NO_USE.uuid,
                      application: testApplicationUuid,
                      queryExecutionStrategy: "storage",
                      applicationSection: "model", // TODO: give only selfApplication section in individual queries?
                      query: {
                        queryType: "boxedQueryWithExtractorCombinerTransformer",
                        application: testApplicationUuid,
                        // applicationDeploymentMap: defaultSelfApplicationDeploymentMap,
                        // deploymentUuid: testApplicationDeploymentUuid,
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
              application: "NOT_USED_HERE",
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
                  // actionType: "modelAction",
                  actionType: "dropEntity",
                  actionLabel: "dropEntityPublisher",
                  application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
                    application: testApplicationUuid,
                    // deploymentUuid: testApplicationDeploymentUuid,
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
                    application: testApplicationUuid,
                    // deploymentUuid: testApplicationDeploymentUuid,
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
                    payload: {
                      // deploymentUuid: testApplicationDeploymentUuid,
                      application: testApplicationUuid,
                      applicationSection: "model", // TODO: give only selfApplication section in individual queries?
                      // queryExecutionStrategy: "storage",
                      query: {
                        queryType: "boxedQueryWithExtractorCombinerTransformer",
                        application: testApplicationUuid,
                        // applicationDeploymentMap: defaultSelfApplicationDeploymentMap,
                        // deploymentUuid: testApplicationDeploymentUuid,
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
              application: "NOT_USED_HERE",
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
                  actionType: "renameEntity",
                  actionLabel: "renameEntityPublisher",
                  application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
                    application: testApplicationUuid,
                    // deploymentUuid: testApplicationDeploymentUuid,
                    entityUuid: entityPublisher.uuid,
                    entityDefinitionUuid: entityDefinitionPublisher.uuid,
                    entityName: "Publisher",
                    targetValue: "Publishers",
                  },
                },
                {
                  actionType: "commit",
                  actionLabel: "commitLibraryLocalCache",
                  application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
                    application: testApplicationUuid,
                    // deploymentUuid: testApplicationDeploymentUuid,
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
                    payload: {
                      // deploymentUuid: testApplicationDeploymentUuid,
                      application: testApplicationUuid,
                      applicationSection: "model", // TODO: give only selfApplication section in individual queries?
                      queryExecutionStrategy: "storage",
                      query: {
                        queryType: "boxedQueryWithExtractorCombinerTransformer",
                        application: testApplicationUuid,
                        // applicationDeploymentMap: defaultSelfApplicationDeploymentMap,
                        // deploymentUuid: testApplicationDeploymentUuid,
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
              application: "NOT_USED_HERE",
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
                  // actionType: "modelAction",
                  actionType: "alterEntityAttribute",
                  actionLabel: "alterEntityPublisher",
                  application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
                    // deploymentUuid: testApplicationDeploymentUuid,
                    application: testApplicationUuid,
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
                    application: testApplicationUuid,
                    // deploymentUuid: testApplicationDeploymentUuid,
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
                    payload: {
                      // deploymentUuid: deployment_Library_DO_NO_USE.uuid,
                      application: testApplicationUuid,
                      applicationSection: "model", // TODO: give only selfApplication section in individual queries?
                      queryExecutionStrategy: "storage",
                      query: {
                        queryType: "boxedQueryWithExtractorCombinerTransformer",
                        application: testApplicationUuid,
                        // applicationDeploymentMap: defaultSelfApplicationDeploymentMap,
                        // deploymentUuid: testApplicationDeploymentUuid,
                        pageParams: {
                          currentDeploymentUuid: testApplicationDeploymentUuid,
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
                    payload: {
                      // deploymentUuid: deployment_Library_DO_NO_USE.uuid,
                      application: testApplicationUuid,
                      applicationSection: "model", // TODO: give only selfApplication section in individual queries?
                      queryExecutionStrategy: "storage",
                      query: {
                        queryType: "boxedQueryWithExtractorCombinerTransformer",
                        application: testApplicationUuid,
                        // applicationDeploymentMap: defaultSelfApplicationDeploymentMap,
                        // deploymentUuid: testApplicationDeploymentUuid,
                        pageParams: {
                          currentDeploymentUuid: testApplicationDeploymentUuid,
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
            //           mlSchema: {
            //             ...entityDefinitionPublisher.mlSchema,
            //             definition: {
            //               ...entityDefinitionPublisher.mlSchema.definition,
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
            //           mlSchema: {
            //             ...entityDefinitionPublisher.mlSchema,
            //             definition: {
            //               ...entityDefinitionPublisher.mlSchema.definition,
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
