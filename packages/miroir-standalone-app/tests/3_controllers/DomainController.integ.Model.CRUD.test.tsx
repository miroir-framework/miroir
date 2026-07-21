/**
 * @deprecated Prefer MiroirTest suite `domain_controller_model_crud` via
 * `npm run testMiroir -w miroir-standalone-app -- --suites domain_controller_model_crud --mode integ --profile emulatedServer-sql`.
 * Canonical leaves: `miroirTest_domain_controller_model_crud` (deployment-miroir; Library is runTarget only).
 * This imperative harness must remain green until that suite fully replaces it; do not delete.
 */
import { describe, expect, beforeAll, beforeEach, afterAll, afterEach, it } from "vitest";

import { fetch as crossFetch } from "cross-fetch";
import process from "process";

import {
  ConfigurationService,
  createDeploymentCompositeAction,
  displayTestSuiteResultsDetails,
  DomainControllerInterface,
  Entity,
  EntityDefinition,
  EntityInstance,
  JzodElement,
  LoggerInterface,
  LoggerOptions,
  MiroirActivityTracker,
  miroirCoreStartup,
  MiroirEventService,
  miroirFundamentalJzodSchema,
  MiroirLoggerFactory,
  PersistenceStoreControllerManagerInterface,
  resetAndInitApplicationDeployment,
  StoreUnitConfiguration,
  TestCompositeActionParams,
  testUtils_deleteApplicationDeployment,
  testUtils_resetApplicationDeployment,
} from "miroir-core";

import {
  runTestOrTestSuite,
} from "../../src/miroir-fwk/4-tests/runTestOrTestSuite.js";

import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";
import { miroirIndexedDbStoreSectionStartup } from "miroir-store-indexedDb";
import { miroirMongoDbStoreSectionStartup } from "miroir-store-mongodb";
import { miroirPostgresStoreSectionStartup } from "miroir-store-postgres";
import { miroirAppStartup } from "../../src/startup.js";

import { loglevelnext } from "../../src/loglevelnextImporter.js";
import { loadTestConfigFiles } from "../utils/fileTools.js";

import type {
  ApplicationDeploymentMap,
  Deployment,
  EndpointDefinition,
  MlSchema,
  SelfApplication,
} from "miroir-core";
import {
  defaultSelfApplicationDeploymentMap,
  resetAndinitializeDeploymentCompositeAction,
} from "miroir-core";
import { deployment_Admin } from "miroir-test-app_deployment-admin";
import {
  Country1,
  Country2,
  Country3,
  endpointDocument,
  entityAuthor,
  entityCountry,
  entityDefinitionAuthor,
  entityDefinitionCountry,
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
import { DomainControllerIntegrationTestSession } from "../helpers/DomainControllerIntegrationTestSession.js";
import {
  defaultMiroirMetaModel,
  entityEntity,
  entityEntityDefinition,
  selfApplicationMiroir,
} from "miroir-test-app_deployment-miroir";
import { deployment_Miroir } from "miroir-test-app_deployment-admin";
// import { entityBook } from "miroir-core";

const env: any = process.env;

const fileName = "DomainController.integ.Data.CRUD.test";
const myConsoleLog = (...args: any[]) => console.log(fileName, ...args);
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
  parentUuid: "7959d814-400c-4e80-988f-a00fe582ab98",
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
let persistenceStoreControllerManager: PersistenceStoreControllerManagerInterface;
// let globalTestSuiteResults: TestSuiteResult = {};

beforeAll(async () => {
  // Establish requests interception layer before all tests.
  console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ beforeAll");
  const session = new DomainControllerIntegrationTestSession(
    miroirConfig,
    {
      applicationDeploymentMap,
      adminDeployment,
      miroirDeploymentStorageConfiguration,
      libraryDeploymentStorageConfiguration: testDeploymentStorageConfiguration,
      miroirActivityTracker,
      miroirEventService,
      customFetch: crossFetch,
      skipResetMiroirModelInInit: true,
    },
    "miroirPlatform",
  );
  const executionEnvironment = await session.initSession();
  domainController = executionEnvironment.domainController;
  console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ beforeAll DONE");

  return Promise.resolve();
});

// executed only once like beforeAll, since there is only 1 test suite
beforeEach(async () => {
  await resetAndInitApplicationDeployment(domainController, applicationDeploymentMap, [
    deployment_Miroir as Deployment,
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
        [
          {
            entity: entityPublisher as Entity,
            entityDefinition: entityDefinitionPublisher as EntityDefinition,
            instances: [
              publisher1 as EntityInstance,
              publisher2 as EntityInstance,
              publisher3 as EntityInstance,
            ],
          },
          {
            entity: entityCountry as Entity,
            entityDefinition: entityDefinitionCountry as EntityDefinition,
            instances: [
              Country1 as EntityInstance,
              Country2 as EntityInstance,
              Country3 as EntityInstance,
            ],
          },
        ],
        defaultLibraryModelEnvironment.currentModel as any,
        [entityPublisher.uuid, entityCountry.uuid],
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
                        extractors: {
                          entities: {
                            extractorOrCombinerType: "extractorInstancesByEntity",
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
                    "function": "count",
                    applyTo: {
                      transformerType: "getFromContext",
                      interpolation: "runtime",
                      referencePath: ["libraryEntityList", "entities"],
                    },
                  },
                  expectedValue: { count: 2 },
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
                  // actionType: "modelAction",
                  actionLabel: "refreshLibraryLocalCache",
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
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
                    application: testApplicationUuid,
                    // deploymentUuid: testApplicationDeploymentUuid,
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
                        extractors: {
                          entities: {
                            extractorOrCombinerType: "extractorInstancesByEntity",
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
                    function: "count",
                    applyTo: {
                      transformerType: "getFromContext",
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
              actionLabel: "checkEntityList",
              nameGivenToResult: "checkEntityList",
              testAssertion: {
                testType: "testAssertion",
                testLabel: "checkEntityList",
                definition: {
                  resultAccessPath: ["libraryEntityList", "entities"],
                  ignoreAttributes: [ ],
                  expectedValue: [
                    entityCountry
                  ],
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
                        extractors: {
                          entities: {
                            extractorOrCombinerType: "extractorInstancesByEntity",
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
                    "function": "count",
                    applyTo: {
                      transformerType: "getFromContext",
                      interpolation: "runtime",
                      referencePath: ["libraryEntityList", "entities"],
                    },
                  },
                  expectedValue: { count: 3 },
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
                  expectedValue: [entityAuthor, entityCountry, entityPublisher],
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
                  actionType: "rollback",
                  actionLabel: "refreshLibraryLocalCache2",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
                    application: testApplicationUuid,
                  },
                },
                {
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
                        extractors: {
                          entities: {
                            extractorOrCombinerType: "extractorInstancesByEntity",
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
                    function: "count",
                    applyTo: {
                      transformerType: "getFromContext",
                      interpolation: "runtime",
                      referencePath: ["libraryEntityList", "entities"],
                    },
                  },
                  expectedValue: { count: 2 },
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
                  actionType: "alterEntityAttribute",
                  actionLabel: "alterEntityPublisher",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
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
                  nameGivenToResult: "libraryEntityDefinitionListFromPersistentStore",
                  payload: {
                    actionType: "runBoxedQueryAction",
                    endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                    payload: {
                      application: testApplicationUuid,
                      applicationSection: "model", // TODO: give only selfApplication section in individual queries?
                      queryExecutionStrategy: "storage",
                      query: {
                        queryType: "boxedQueryWithExtractorCombinerTransformer",
                        application: testApplicationUuid,
                        pageParams: {
                          currentDeploymentUuid: testApplicationDeploymentUuid,
                        },
                        extractors: {
                          entityDefinitions: {
                            extractorOrCombinerType: "extractorInstancesByEntity",
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
                  actionType: "compositeRunBoxedQueryAction",
                  endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
                  actionLabel: "calculateNewEntityDefinionAndReports",
                  nameGivenToResult: "libraryEntityDefinitionListFromLocalCache",
                  payload: {
                    actionType: "runBoxedQueryAction",
                    endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                    payload: {
                      application: testApplicationUuid,
                      applicationSection: "model", // TODO: give only selfApplication section in individual queries?
                      queryExecutionStrategy: "storage",
                      query: {
                        queryType: "boxedQueryWithExtractorCombinerTransformer",
                        application: testApplicationUuid,
                        pageParams: {
                          currentDeploymentUuid: testApplicationDeploymentUuid,
                        },
                        extractors: {
                          entityDefinitions: {
                            extractorOrCombinerType: "extractorInstancesByEntity",
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
                    function: "count",
                    applyTo: {
                      transformerType: "getFromContext",
                      interpolation: "runtime",
                      referencePath: [
                        "libraryEntityDefinitionListFromPersistentStore",
                        "entityDefinitions",
                      ],
                    },
                  },
                  expectedValue: { count: 2 },
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
                    function: "count",
                    applyTo: {
                      transformerType: "getFromContext",
                      interpolation: "runtime",
                      referencePath: [
                        "libraryEntityDefinitionListFromLocalCache",
                        "entityDefinitions",
                      ],
                    },
                  },
                  expectedValue: { count: 2 },
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
                  ignoreAttributes: ["author", "storageAccess"],
                  expectedValue: [
                    entityDefinitionCountry,
                    {
                      ...entityDefinitionPublisher,
                      mlSchema: {
                        ...entityDefinitionPublisher.mlSchema,
                        definition: {
                          ...entityDefinitionPublisher.mlSchema.definition,
                          aNewColumnForTest: columnForTestDefinition,
                        },
                      },
                    },
                  ]
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
                  ignoreAttributes: ["author", "storageAccess"],
                  expectedValue: [
                    entityDefinitionCountry,
                    {
                      ...entityDefinitionPublisher,
                      mlSchema: {
                        ...entityDefinitionPublisher.mlSchema,
                        definition: {
                          ...entityDefinitionPublisher.mlSchema.definition,
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
        "Duplicate iso3166-1Alpha-2 from Entity Country to Entity Publisher and Commit": {
          testType: "testCompositeAction",
          testLabel:
            "Duplicate iso3166-1Alpha-2 from Entity Country to Entity Publisher and Commit",
          compositeActionSequence: {
            actionType: "compositeActionSequence",
            actionLabel:
              "Duplicate iso3166-1Alpha-2 from Entity Country to Entity Publisher and Commit",
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
                  actionType: "entity_DuplicateAttribute",
                  actionLabel: "entity_DuplicateAttribute",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
                    application: testApplicationUuid,
                    entityName: entityPublisher.name,
                    sourceEntityUuid: entityCountry.uuid,
                    targetEntityUuid: entityPublisher.uuid,
                    // entityDefinitionUuid: entityDefinitionPublisher.uuid,
                    sourceEntityDefinitionUuid: entityDefinitionCountry.uuid,
                    targetEntityDefinitionUuid: entityDefinitionPublisher.uuid,
                    columns: [
                      "iso3166-1Alpha-2",
                      // {
                      //   name: "aNewColumnForTest",
                      //   definition: columnForTestDefinition,
                      // },
                    ],
                  },
                } as any,
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
                  actionLabel: "fetchEntityDefinitionAfterAction",
                  nameGivenToResult: "entityDefinitionAfterAction",
                  payload: {
                    actionType: "runBoxedQueryAction",
                    endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                    payload: {
                      application: testApplicationUuid,
                      applicationSection: "model", // TODO: give only selfApplication section in individual queries?
                      queryExecutionStrategy: "storage",
                      query: {
                        queryType: "boxedQueryWithExtractorCombinerTransformer",
                        application: testApplicationUuid,
                        extractors: {
                          entityDefinitions: {
                            extractorOrCombinerType: "extractorByPrimaryKey",
                            applicationSection: "model",
                            parentName: entityEntityDefinition.name,
                            parentUuid: entityEntityDefinition.uuid,
                            instanceUuid: entityDefinitionPublisher.uuid,
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
              actionLabel: "checkPublisherHasNotChanged",
              nameGivenToResult: "checkPublisherHasNotChanged",
              testAssertion: {
                testType: "testAssertion",
                testLabel: "checkPublisherHasNotChanged",
                definition: {
                  resultTransformer: {
                    transformerType: "boolExpr",
                    interpolation: "runtime",
                    operator: "&&",
                    left: {
                      transformerType: "boolExpr",
                      interpolation: "runtime",
                      operator: "==",
                      left: {
                        transformerType: "getFromContext",
                        interpolation: "runtime",
                        referencePath: ["entityDefinitionAfterAction", "entityDefinitions", "uuid"],
                      },
                      right: entityDefinitionPublisher.uuid,
                    },
                    right: {
                      transformerType: "boolExpr",
                      interpolation: "runtime",
                      operator: "deepEqual",
                      left: {
                        transformerType: "getFromContext",
                        interpolation: "runtime",
                        referencePath: [
                          "entityDefinitionAfterAction",
                          "entityDefinitions",
                          "mlSchema",
                          "definition",
                          "iso3166-1Alpha-2",
                        ],
                      },
                      // right: {
                      //   transformerType: "returnValue",
                      //   interpolation: "runtime",
                      //   value: "string"
                      // }
                      right: {
                        type: "string",
                        optional: true,
                        tag: {
                          value: {
                            id: 5,
                            defaultLabel: "Country Code",
                          },
                        },
                      },
                    },
                  },
                  expectedValue: true,
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
        "Add Entity Author then test before commit or rollback": {
          testType: "testCompositeAction",
          testLabel: "Add Entity Author then test before commit or rollback",
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
                  actionType: "compositeRunBoxedQueryAction",
                  endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
                  actionLabel: "calculateNewEntityDefinionAndReportsFromLocalCache",
                  nameGivenToResult: "libraryEntityListFromLocalCache",
                  payload: {
                    actionType: "runBoxedQueryAction",
                    endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                    payload: {
                      application: testApplicationUuid,
                      applicationSection: "model", // TODO: give only selfApplication section in individual queries?
                      queryExecutionStrategy: "localCacheOrFail",
                      query: {
                        queryType: "boxedQueryWithExtractorCombinerTransformer",
                        application: testApplicationUuid,
                        pageParams: {
                          currentDeploymentUuid: testApplicationDeploymentUuid,
                        },
                        extractors: {
                          entities: {
                            extractorOrCombinerType: "extractorInstancesByEntity",
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
                  actionType: "compositeRunBoxedQueryAction",
                  endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
                  actionLabel: "calculateNewEntityDefinionAndReportsFromPersistentStore",
                  nameGivenToResult: "libraryEntityListFromPersistentStore",
                  payload: {
                    actionType: "runBoxedQueryAction",
                    endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                    payload: {
                      application: testApplicationUuid,
                      queryExecutionStrategy: "storage",
                      applicationSection: "model", // TODO: give only selfApplication section in individual queries?
                      query: {
                        queryType: "boxedQueryWithExtractorCombinerTransformer",
                        application: testApplicationUuid,
                        pageParams: {
                          currentDeploymentUuid: testApplicationDeploymentUuid,
                        },
                        extractors: {
                          entities: {
                            extractorOrCombinerType: "extractorInstancesByEntity",
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
                    function: "count",
                    applyTo: {
                      transformerType: "getFromContext",
                      interpolation: "runtime",
                      referencePath: ["libraryEntityListFromLocalCache", "entities"],
                    },
                  },
                  expectedValue: { count: 3 },
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
                  expectedValue: [entityAuthor, entityCountry, entityPublisher],
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
                    function: "count",
                    applyTo: {
                      transformerType: "getFromContext",
                      interpolation: "runtime",
                      referencePath: ["libraryEntityListFromPersistentStore", "entities"],
                    },
                  },
                  expectedValue: { count: 2 },
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
                  expectedValue: [entityCountry, entityPublisher],
                },
              },
            },
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
                  actionType: "renameEntity",
                  actionLabel: "renameEntityPublisher",
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
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  payload: {
                    application: testApplicationUuid,
                    // deploymentUuid: testApplicationDeploymentUuid,
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
                      queryExecutionStrategy: "storage",
                      query: {
                        queryType: "boxedQueryWithExtractorCombinerTransformer",
                        application: testApplicationUuid,
                        pageParams: {
                          currentDeploymentUuid: testApplicationDeploymentUuid,
                        },
                        extractors: {
                          entities: {
                            extractorOrCombinerType: "extractorInstancesByEntity",
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
                    function: "count",
                    applyTo: {
                      transformerType: "getFromContext",
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
                  ignoreAttributes: ["author", "storageAccess"],
                  expectedValue: [entityCountry, { ...entityPublisher, name: "Publishers" }],
                },
              },
            },
          ],
        },
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
        //           actionLabel: "refreshLibraryLocalCache",
        //           endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        //           payload: {
        //             application: testApplicationUuid,
        //           },
        //         },
        //         {
        //           actionType: "alterEntityAttribute",
        //           actionLabel: "alterEntityPublisher",
        //           endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        //           payload: {
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
        //           actionLabel: "commitLibraryLocalCache",
        //           endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        //           payload: {
        //             application: testApplicationUuid,
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
        //               application: testApplicationUuid,
        //               applicationSection: "model", // TODO: give only selfApplication section in individual queries?
        //               queryExecutionStrategy: "storage",
        //               query: {
        //                 queryType: "boxedQueryWithExtractorCombinerTransformer",
        //                 application: testApplicationUuid,
        //                 pageParams: {
        //                   currentDeploymentUuid: testApplicationDeploymentUuid,
        //                 },
        //                 extractors: {
        //                   entityDefinitions: {
        //                     extractorOrCombinerType: "extractorInstancesByEntity",
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
        //               application: testApplicationUuid,
        //               applicationSection: "model", // TODO: give only selfApplication section in individual queries?
        //               queryExecutionStrategy: "storage",
        //               query: {
        //                 queryType: "boxedQueryWithExtractorCombinerTransformer",
        //                 application: testApplicationUuid,
        //                 pageParams: {
        //                   currentDeploymentUuid: testApplicationDeploymentUuid,
        //                 },
        //                 extractors: {
        //                   entityDefinitions: {
        //                     extractorOrCombinerType: "extractorInstancesByEntity",
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
        //             function: "count",
        //             applyTo: {
        //               transformerType: "getFromContext",
        //               interpolation: "runtime",
        //               referencePath: [
        //                 "libraryEntityDefinitionListFromPersistentStore",
        //                 "entityDefinitions",
        //               ],
        //             },
        //           },
        //           expectedValue: { count: 2 },
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
        //             function: "count",
        //             applyTo: {
        //               transformerType: "getFromContext",
        //               interpolation: "runtime",
        //               referencePath: [
        //                 "libraryEntityDefinitionListFromLocalCache",
        //                 "entityDefinitions",
        //               ],
        //             },
        //           },
        //           expectedValue: { count: 2 },
        //         },
        //       },
        //     },
        //     {
        //       actionType: "compositeRunTestAssertion",
        //       actionLabel: "checkEntityBooks",
        //       nameGivenToResult: "checkEntityDefinitionFromLocalCache",
        //       testAssertion: {
        //         testType: "testAssertion",
        //         testLabel: "checkEntityBooks",
        //         definition: {
        //           resultAccessPath: ["libraryEntityDefinitionListFromLocalCache", "entityDefinitions"],
        //           ignoreAttributes: ["author", "storageAccess"],
        //           expectedValue: [
        //             entityDefinitionCountry,
        //             {
        //               ...entityDefinitionPublisher,
        //               mlSchema: {
        //                 ...entityDefinitionPublisher.mlSchema,
        //                 definition: {
        //                   ...entityDefinitionPublisher.mlSchema.definition,
        //                   aNewColumnForTest: columnForTestDefinition,
        //                 },
        //               },
        //             },
        //           ]
        //         },
        //       },
        //     },
        //     {
        //       actionType: "compositeRunTestAssertion",
        //       actionLabel: "checkEntityBooks",
        //       nameGivenToResult: "checkEntityDefinitionFromPersistentStore",
        //       testAssertion: {
        //         testType: "testAssertion",
        //         testLabel: "checkEntityBooks",
        //         definition: {
        //           resultAccessPath: ["libraryEntityDefinitionListFromPersistentStore", "entityDefinitions"],
        //           ignoreAttributes: ["author", "storageAccess"],
        //           expectedValue: [
        //             entityDefinitionCountry,
        //             {
        //               ...entityDefinitionPublisher,
        //               mlSchema: {
        //                 ...entityDefinitionPublisher.mlSchema,
        //                 definition: {
        //                   ...entityDefinitionPublisher.mlSchema.definition,
        //                   aNewColumnForTest: columnForTestDefinition,
        //                 },
        //               },
        //             },
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
