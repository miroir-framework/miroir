/**
 * Runner_ExternalEntity.integ.test.tsx
 * 
 * Tests external entity support: installing an application that includes
 * an external entity (pg_namespace from pg_catalog schema) and querying it.
 */
import "@testing-library/jest-dom";
import { v4 as uuidv4 } from "uuid";
import { beforeEach, describe, expect, it } from "vitest";

import {
  ConfigurationService,
  emptyApplicationModel,
  formatYYYYMMDD_HHMMSS,
  getMiroirConfig,
  MiroirActivityTracker,
  miroirCoreStartup,
  MiroirEventService,
  MiroirLoggerFactory,
  testBuildPlusRuntimeCompositeActionSuiteForRunner,
  type DomainControllerInterface,
  type LoggerInterface,
  type LoggerOptions,
  type MiroirConfigClient,
  type Runner,
  type StoreUnitConfiguration
} from "miroir-core";
import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";
import { miroirIndexedDbStoreSectionStartup } from "miroir-store-indexedDb";
import { miroirMongoDbStoreSectionStartup } from "miroir-store-mongodb";
import { miroirPostgresStoreSectionStartup } from "miroir-store-postgres";
import { entityEntity, runnerDeployApplication } from "miroir-test-app_deployment-miroir";
import { env } from "process";
import { loglevelnext } from "../../src/loglevelnextImporter";
import { runTestOrTestSuite } from "../../src/miroir-fwk/4-tests/tests-utils";
import { miroirAppStartup } from "../../src/startup";
import { loadTestConfigFiles } from "../utils/fileTools";

import simplifiedLibraryData from "../assets/library_extract/simplified-library-data.json";
import simplifiedLibraryModelWithExternalEntity from "../assets/library_extract/simplified-library-model-with-external-entity.json";
import {
  afterAllTests,
  beforeAllTests,
  beforeEachTest,
  getTestConfig,
  testApplicationStorageConfiguration,
  type RunnerTestParams,
} from "./RunnerIntegTestTools";

// ################################################################################################
const pageLabel = "Runner_ExternalEntity.integ.test";

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
const globalTimeOut = 30000;

const testApplicationUuid = uuidv4();
const testApplicationDeploymentUuid = uuidv4();
const testApplicationName = "testExternalEntity_" + formatYYYYMMDD_HHMMSS(new Date());

// pg_namespace entity UUID (from the test model)
const pgNamespaceEntityUuid = "cbc94d62-d2e5-4bc2-8aef-45efcfbd0af6";

const {
  applicationDeploymentMap,
  miroirDeploymentStorageConfiguration,
  adminDeploymentStorageConfiguration,
  adminDeployment,
  libraryDeploymentStorageConfiguration,
} = getTestConfig(
  miroirConfig,
  testApplicationDeploymentUuid,
  testApplicationName,
  testApplicationUuid,
);

const testDeploymentStorageConfiguration: StoreUnitConfiguration = testApplicationStorageConfiguration(
  libraryDeploymentStorageConfiguration,
  testApplicationName,
);

const internalMiroirConfig: MiroirConfigClient = getMiroirConfig(
  miroirConfig,
  testDeploymentStorageConfiguration,
  testApplicationDeploymentUuid,
);

const testApplicationDeploymentMap = {
  ...applicationDeploymentMap,
  [testApplicationUuid]: testApplicationDeploymentUuid,
};

const localRunnerInstallApplication = runnerDeployApplication as Runner;

let domainController: DomainControllerInterface;

beforeAll(async () => {
  const {
    domainController: localdomainController,
  } = await beforeAllTests(
    internalMiroirConfig,
    miroirActivityTracker,
    miroirEventService,
    adminDeployment,
    miroirDeploymentStorageConfiguration,
    applicationDeploymentMap,
  );
  domainController = localdomainController;
});

beforeEach(async () => {
  await beforeEachTest(
    domainController,
    testApplicationDeploymentMap,
  );
});

afterAll(async () => {
  await afterAllTests(
    miroirActivityTracker,
    Object.keys(runnerTestParams),
  );
});

const runnerTestParams: Record<string, RunnerTestParams> = {
  [localRunnerInstallApplication.name]: {
    pageLabel,
    runner: localRunnerInstallApplication as Runner,
    testApplicationUuid,
    testApplicationDeploymentUuid,
    testApplicationName,
    testParams: {
      deployApplication: {
        applicationBundle: {
          ...simplifiedLibraryModelWithExternalEntity,
          applicationName: testApplicationName,
        },
        deploymentData: simplifiedLibraryData,
        applicationStorage: {
          emulatedServerType: "sql",
          connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
        },
      },
    }, // testParams
    preTestCompositeActions: [
      {
        // Query the installed entities to verify they were created
        actionType: "compositeRunBoxedQueryAction",
        endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
        actionLabel: "queryInstalledEntities",
        nameGivenToResult: "installedEntityList",
        payload: {
          actionType: "runBoxedQueryAction",
          endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
          payload: {
            application: testApplicationUuid,
            applicationSection: "model",
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
        // Query pg_namespace instances from the external entity (pg_catalog schema)
        actionType: "compositeRunBoxedQueryAction",
        endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
        actionLabel: "queryPgNamespaceInstances",
        nameGivenToResult: "pgNamespaceList",
        payload: {
          actionType: "runBoxedQueryAction",
          endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
          payload: {
            application: testApplicationUuid,
            applicationSection: "data",
            query: {
              queryType: "boxedQueryWithExtractorCombinerTransformer",
              application: testApplicationUuid,
              pageParams: {
                currentDeploymentUuid: testApplicationDeploymentUuid,
              },
              queryParams: {},
              contextResults: {},
              extractors: {
                namespaces: {
                  extractorOrCombinerType: "extractorInstancesByEntity",
                  applicationSection: "data",
                  parentName: "pg_namespace",
                  parentUuid: pgNamespaceEntityUuid,
                },
              },
            },
          },
        },
      },
    ], // preTestCompositeActions
    testCompositeActionAssertions: [
      {
        // Verify all 3 entities were installed (Author, Country, pg_namespace)
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
                referencePath: ["installedEntityList", "entities"],
              },
            },
            expectedValue: { aggregate: 3 },
          },
        },
      },
      {
        // Verify pg_namespace returns non-empty results (at least pg_catalog and public namespaces)
        actionType: "compositeRunTestAssertion",
        actionLabel: "checkPgNamespaceNotEmpty",
        nameGivenToResult: "checkPgNamespaceNotEmpty",
        testAssertion: {
          testType: "testAssertion",
          testLabel: "checkPgNamespaceNotEmpty",
          definition: {
            resultAccessPath: [],
            resultTransformer: {
              transformerType: "boolExpr",
              interpolation: "runtime",
              operator: ">",
              left: {
                transformerType: "accessDynamicPath",
                interpolation: "runtime",
                objectAccessPath: [
                  {
                    transformerType: "getFromContext",
                    interpolation: "runtime",
                    referencePath: ["pgNamespaceList", "namespaces"],
                  },
                  "length",
                ],
              },
              right: {
                transformerType: "returnValue",
                interpolation: "runtime",
                value: 0,
              },
            },
            expectedValue: true,
          },
        },
      },
    ],
    internalMiroirConfig,
    adminDeployment,
    testDeploymentStorageConfiguration,
    initialModel: emptyApplicationModel,
    skipCreateDeployment: true,
  },
};

describe.sequential(
  pageLabel,
  () => {
    it.each(Object.entries(runnerTestParams))(
      "test %s",
      async (currentTestSuiteName, runnerTestParams: RunnerTestParams) => {
        const runnerTestAction = testBuildPlusRuntimeCompositeActionSuiteForRunner(
          runnerTestParams.pageLabel,
          runnerTestParams.runner,
          runnerTestParams.testApplicationUuid,
          runnerTestParams.testApplicationDeploymentUuid,
          runnerTestParams.testApplicationName,
          runnerTestParams.testParams,
          runnerTestParams.preTestCompositeActions,
          runnerTestParams.testCompositeActionAssertions,
          //
          runnerTestParams.internalMiroirConfig,
          runnerTestParams.adminDeployment,
          runnerTestParams.testDeploymentStorageConfiguration,
          runnerTestParams.initialModel,
          runnerTestParams.preRunnerCompositeActions,
          runnerTestParams.testCompositeActionLabel,
          runnerTestParams.skipCreateDeployment,
          runnerTestParams.skipDropDeployment,
        );
        const testSuiteResults = await runTestOrTestSuite(
          domainController,
          runnerTestAction,
          testApplicationDeploymentMap,
          miroirActivityTracker,
          {}
        );
        if (!testSuiteResults || testSuiteResults.status !== "ok") {
          expect(testSuiteResults?.status, `${currentTestSuiteName} failed!`).toBe("ok");
        }
      },
      globalTimeOut
    );
  }
);
