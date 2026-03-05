/**
 * Runner_CreateEntity.integ.test.tsx
 */
import "@testing-library/jest-dom";
import { v4 as uuidv4 } from "uuid";
import { beforeEach, describe, expect, it } from "vitest";

import crossFetch from "cross-fetch";
import {
  type ApplicationDeploymentMap,
  type Deployment,
  type DomainControllerInterface,
  type LocalCacheInterface,
  type LoggerInterface,
  type LoggerOptions,
  type MiroirContextInterface,
  type MiroirModelEnvironment,
  type MlSchema,
  type PersistenceStoreControllerManagerInterface,
  type Runner,
  type StoreUnitConfiguration,
  type TestCompositeActionParams,
  ConfigurationService,
  createDeploymentCompositeAction,
  defaultMiroirMetaModel,
  defaultMiroirModelEnvironment,
  defaultSelfApplicationDeploymentMap,
  displayTestSuiteResultsDetails,
  emptyApplicationModel,
  formatYYYYMMDD_HHMMSS,
  MiroirActivityTracker,
  miroirCoreStartup,
  MiroirEventService,
  miroirFundamentalJzodSchema,
  MiroirLoggerFactory,
  resetAndInitApplicationDeployment,
  selfApplicationDeploymentMiroir,
  testBuildPlusRuntimeCompositeActionSuiteForRunner
} from "miroir-core";
import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";
import { miroirIndexedDbStoreSectionStartup } from "miroir-store-indexedDb";
import { miroirMongoDbStoreSectionStartup } from "miroir-store-mongodb";
import { miroirPostgresStoreSectionStartup } from "miroir-store-postgres";
import {
  adminApplication_Miroir,
  deployment_Admin,
  deployment_Miroir,
} from "miroir-test-app_deployment-admin";
import {
  deployment_Library_DO_NO_USE,
  endpointDocument,
  entityAuthor,
  entityDefinitionAuthor
} from "miroir-test-app_deployment-library";
import { entityEntity, runnerCreateEntity } from "miroir-test-app_deployment-miroir";
import { env } from "process";
import { loglevelnext } from "../../src/loglevelnextImporter";
import { runTestOrTestSuite, setupMiroirTest } from "../../src/miroir-fwk/4-tests/tests-utils";
import { miroirAppStartup } from "../../src/startup";
import { loadTestConfigFiles } from "../utils/fileTools";

// ################################################################################################
const pageLabel = "Runner_CreateEntity.integ.test";

let miroirConfig: any;
let loggerOptions: LoggerOptions;

const myConsoleLog = (...args: any[]) => console.log(pageLabel, ...args);
let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName("tests", "5-tests", pageLabel)
).then((logger: LoggerInterface) => {
  log = logger;
});

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

// ################################################################################################
// ################################################################################################
// ################################################################################################
const globalTimeOut = 30000;

const testApplicationUuid = uuidv4();
const testApplicationDeploymentUuid = uuidv4();
const testApplicationName = "testApplication_" + formatYYYYMMDD_HHMMSS(new Date());

const applicationDeploymentMap: ApplicationDeploymentMap = {
  ...defaultSelfApplicationDeploymentMap,
  // [selfApplicationLibrary.uuid]: deployment_Library_DO_NO_USE.uuid,
  [testApplicationUuid]: testApplicationDeploymentUuid,
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


const libraryDeploymentStorageConfiguration: StoreUnitConfiguration = miroirConfig.client.emulateServer
  ? miroirConfig.client.deploymentStorageConfig[deployment_Library_DO_NO_USE.uuid]
  : miroirConfig.client.serverConfig.storeSectionConfiguration[deployment_Library_DO_NO_USE.uuid];

let testDeploymentStorageConfiguration: StoreUnitConfiguration;
switch (libraryDeploymentStorageConfiguration.model.emulatedServerType) {
  case "indexedDb": {
    testDeploymentStorageConfiguration = {
      admin: libraryDeploymentStorageConfiguration.admin,
      model: {
        emulatedServerType: "indexedDb",
        indexedDbName: testApplicationName,
      },
      data: {
        emulatedServerType: "indexedDb",
        indexedDbName: testApplicationName,
      },
    };
    break;
  }
  case "filesystem": {
    testDeploymentStorageConfiguration = {
      admin: libraryDeploymentStorageConfiguration.admin,
      model: {
        emulatedServerType: "filesystem",
        directory: "./test_data/" + testApplicationName,
      },
      data: {
        emulatedServerType: "filesystem",
        directory: "./test_data/" + testApplicationName,
      },
    };
    break;
  }
  case "sql": {
    testDeploymentStorageConfiguration = {
      admin: libraryDeploymentStorageConfiguration.admin,
      model: {
        emulatedServerType: "sql",
        connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
        schema: testApplicationName,
      },
      data: {
        emulatedServerType: "sql",
        connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
        schema: testApplicationName,
      },
    };
    break;
  }
  case "mongodb": {
    testDeploymentStorageConfiguration = {
      admin: libraryDeploymentStorageConfiguration.admin,
      model: {
        emulatedServerType: "mongodb",
        connectionString: "mongodb://localhost:27017",
        database: testApplicationName,
      },
      data: {
        emulatedServerType: "mongodb",
        connectionString: "mongodb://localhost:27017",
        database: testApplicationName,
      },
    };
  }
}

const internalMiroirConfig = {
  ...miroirConfig,
  client: {
    ...miroirConfig.client,
    ...(
      miroirConfig.client.emulateServer?
      {
        deploymentStorageConfig: {
          ...miroirConfig.client.deploymentStorageConfig,
          [testApplicationDeploymentUuid]: testDeploymentStorageConfiguration,
        }
      }
      : {}
    ),
    ...(
      !miroirConfig.client.emulateServer?
      {
        serverConfig: {
          ...miroirConfig.client.serverConfig,
          storeSectionConfiguration: {
            ...miroirConfig.client.serverConfig.storeSectionConfiguration,
            [testApplicationDeploymentUuid]: testDeploymentStorageConfiguration,
          }
        }
      }:{}
    )
  }
}
// const testDeploymentStorageConfiguration = miroirConfig.client.emulateServer
//   ? miroirConfig.client.deploymentStorageConfig[testApplicationDeploymentUuid]
//   : miroirConfig.client.serverConfig.storeSectionConfiguration[testApplicationDeploymentUuid];

let domainController: DomainControllerInterface;
let localCache: LocalCacheInterface;
let miroirContext: MiroirContextInterface;
let persistenceStoreControllerManager: PersistenceStoreControllerManagerInterface;

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
  return Promise.resolve();
});

const testApplicationModelEnvironment: MiroirModelEnvironment = {
  miroirFundamentalJzodSchema: miroirFundamentalJzodSchema as MlSchema,
  miroirMetaModel: defaultMiroirMetaModel,
  endpointsByUuid: {[endpointDocument.uuid]: endpointDocument},
  deploymentUuid: testApplicationDeploymentUuid,
  currentModel: emptyApplicationModel,
}

const testActions: Record<string, TestCompositeActionParams> =
  testBuildPlusRuntimeCompositeActionSuiteForRunner(
    pageLabel,
    runnerCreateEntity as Runner,
    testApplicationUuid,
    testApplicationDeploymentUuid,
    testApplicationName,
    {
      [runnerCreateEntity.name]: {
        transformerType: "returnValue",
        value: {
          application: testApplicationUuid,
          entity: entityAuthor,
          entityDefinition: entityDefinitionAuthor,
        },
      },
    }, // testParams
    [
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
    ], // preTestCompositeActions
    [
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
            expectedValue: [entityAuthor],
          },
        },
      },
    ],
    //
    internalMiroirConfig,
    adminDeployment,
    testDeploymentStorageConfiguration,
    testApplicationModelEnvironment,
  );

describe.sequential(
  pageLabel,
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
