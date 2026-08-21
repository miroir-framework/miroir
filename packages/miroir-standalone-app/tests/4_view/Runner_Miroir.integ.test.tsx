/**
 * Runner_Miroir.integ.test.tsx
 */
import "@testing-library/jest-dom";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
  ConfigurationService,
  MiroirActivityTracker,
  miroirCoreStartup,
  MiroirEventService,
  MiroirLoggerFactory,
  getTestbedUuidsForTestSuite,
  testBuildPlusRuntimeCompositeActionSuiteForRunner,
  type ApplicationDeploymentMap,
  type DomainControllerInterface,
  type LoggerInterface,
  type LoggerOptions,
  type MiroirTestSuite,
  type Runner,
  type MetaModelPartial
} from "miroir-core";
import { defaultLibraryAppModel, miroirTest_runner_return_document, returnDocument } from "miroir-test-app_deployment-library";
import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";
import { miroirIndexedDbStoreSectionStartup } from "miroir-store-indexedDb";
import { miroirMongoDbStoreSectionStartup } from "miroir-store-mongodb";
import { miroirPostgresStoreSectionStartup } from "miroir-store-postgres";
import { env } from "process";
import { loglevelnext } from "../../src/loglevelnextImporter";
import { runTestOrTestSuite } from "../../src/miroir-fwk/4-tests/runTestOrTestSuite";
import { miroirAppStartup } from "../../src/startup";
import { loadTestConfigFiles } from "../utils/fileTools";

import {
  afterAllTests,
  type RunnerTestParams,
} from "./RunnerIntegTestTools.js";

import { runnerLibraryDocumentEntitiesAndInstances, libraryTestbedInitParams } from "../../src/miroir-fwk/4-tests/uiIntegrationPlayfieldSeeds.js";

import { RunnerTestSession } from "../helpers/RunnerTestSession.js";
import {
  libraryLendBookRunnerTest,
  libraryReturnBookRunnerTest,
} from "./Runner_Library.js";
// ################################################################################################
const pageLabel = "Runner_Miroir.integ.test";

let miroirConfig: any;
let loggerOptions: LoggerOptions;

const myConsoleLog = (...args: any[]) => console.log(pageLabel, ...args);
const _miroirLoggerName = MiroirLoggerFactory.getLoggerName("tests", "5-tests", pageLabel);
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName).then((logger: LoggerInterface) => {
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
loggerOptions = logConfig as unknown as LoggerOptions;
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


// Fixed UUID for the test menu used in the withReports test
const testMenuUuid = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

const runnerReturnDocumentSuite = miroirTest_runner_return_document.definition as MiroirTestSuite;
const runnerTestRunTarget = getTestbedUuidsForTestSuite({ suite: runnerReturnDocumentSuite });

const runnerTestSession = new RunnerTestSession({
  miroirConfig,
  miroirActivityTracker,
  miroirEventService,
  pageLabel,
  runTarget: runnerTestRunTarget,
  suiteTestParams: runnerReturnDocumentSuite.testParams,
  resolvedRunner: returnDocument as unknown as Runner,
  libraryPlayfieldSeed: {
      testbedEntitiesAndInstances: runnerLibraryDocumentEntitiesAndInstances,
      testbedInitApplicationParameters: libraryTestbedInitParams,
      testbedModel: defaultLibraryAppModel as MetaModelPartial,
    },
});

let domainController: DomainControllerInterface;
let testApplicationDeploymentMap: ApplicationDeploymentMap;

beforeAll(async () => {
  const env = await runnerTestSession.initSession();
  domainController = env.domainController;
  testApplicationDeploymentMap = env.applicationDeploymentMap;
});

// executed only once like beforeAll, since there is only 1 test suite
beforeEach(async () => {
  await runnerTestSession.beforeEach();
});

afterAll(async () => {
  await runnerTestSession.teardown();
  await afterAllTests(
    miroirActivityTracker,
    // Object.keys(runnerTestParams)
    Object.keys(filteredRunnerTestParams)
  );
});

// const localRunnerCreateApplication = getRunner_CreateApplication(
//   testApplicationUuid,
//   testApplicationDeploymentUuid,
//   "createApplicationAndDeployment",
//   emptyApplicationModel,
// )

// const localRunnerInstallApplication = runnerDeployApplication as Runner;
  
const runnerTestParams: Record<string, RunnerTestParams> = {
  libraryLendBookRunnerTest: libraryLendBookRunnerTest,
  libraryReturnBookRunnerTest: libraryReturnBookRunnerTest,
};

// filter to run only specific tests
const filteredRunnerTestParams: Record<string, RunnerTestParams> = Object.fromEntries(
  Object.entries(runnerTestParams).filter(([testName]) =>
    [
      "libraryLendBookRunnerTest",
      "libraryReturnBookRunnerTest",
    ].includes(testName)
  )
);

describe.sequential(
  pageLabel,
  () => {
    it.each(Object.entries(filteredRunnerTestParams))(
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
          runnerTestParams.preRunnerCompositeActions as any, // TODO: fix type!
          runnerTestParams.testCompositeActionLabel,
          runnerTestParams.skipCreateDeployment,
          runnerTestParams.skipDropDeployment,
        );
        const testSuiteResults = await runTestOrTestSuite(
          domainController,
          runnerTestAction,
          testApplicationDeploymentMap, // applicationDeploymentMap,
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
