/**
 * @deprecated Prefer MiroirTest suite `runner_drop_entity` via:
 *   npm run testMiroir -w miroir-standalone-app -- --suites runner_drop_entity --mode integ --profile emulatedServer-sql
 * Kept green until G8 cutover. See runner-create-drop-entity-miroirtest-migration-plan.md.
 *
 * Runner_DropEntity.integ.test.tsx
 *
 * Imperative harness for `runnerDropEntity` (G8). Canonical MiroirTest migration:
 * see code-helpers/features/197-FEATURE-…/runner-create-drop-entity-miroirtest-migration-plan.md
 */
import "@testing-library/jest-dom";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
  ConfigurationService,
  emptyApplicationModel,
  MiroirActivityTracker,
  miroirCoreStartup,
  MiroirEventService,
  MiroirLoggerFactory,
  resolveRunnerTestRunTarget,
  testBuildPlusRuntimeCompositeActionSuiteForRunner,
  type ApplicationDeploymentMap,
  type DomainControllerInterface,
  type LoggerInterface,
  type LoggerOptions,
  type Runner,
} from "miroir-core";
import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";
import { miroirIndexedDbStoreSectionStartup } from "miroir-store-indexedDb";
import { miroirMongoDbStoreSectionStartup } from "miroir-store-mongodb";
import { miroirPostgresStoreSectionStartup } from "miroir-store-postgres";
import {
  entityAuthor,
  entityDefinitionAuthor,
} from "miroir-test-app_deployment-library";
import {
  entityEntity,
  runnerCreateEntity,
  runnerDropEntity,
} from "miroir-test-app_deployment-miroir";
import { env } from "process";
import { loglevelnext } from "../../src/loglevelnextImporter";
import { runTestOrTestSuite } from "../../src/miroir-fwk/4-tests/runTestOrTestSuite";
import { miroirAppStartup } from "../../src/startup";
import { loadTestConfigFiles } from "../utils/fileTools";
import {
  afterAllTests,
  beforeEachTest,
  type RunnerTestParams,
} from "./RunnerIntegTestTools";
import {
  getTestSessionConfig,
  RunnerTestSession,
} from "../helpers/RunnerTestSession.js";

// ################################################################################################
const pageLabel = "Runner_DropEntity.integ.test";

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
const globalTimeOut = 30000;

const runTarget = resolveRunnerTestRunTarget({
  suite: { miroirTestLabel: pageLabel },
  defaultApplicationName: "testApplication_CreateEntity",
});

const sessionConfig = getTestSessionConfig(miroirConfig, runTarget);

const runnerTestSession = new RunnerTestSession({
  miroirConfig,
  miroirActivityTracker,
  miroirEventService,
  pageLabel,
  runTarget,
  suiteTestParams: {},
  runnerRegistry: {
    [runnerDropEntity.name]: runnerDropEntity as unknown as Runner,
    [runnerCreateEntity.name]: runnerCreateEntity as unknown as Runner,
  },
});

let domainController: DomainControllerInterface;
let testApplicationDeploymentMap: ApplicationDeploymentMap;

const {
  applicationUuid: testApplicationUuid,
  deploymentUuid: testApplicationDeploymentUuid,
  applicationName: testApplicationName,
} = runTarget;

// ################################################################################################
beforeAll(async () => {
  const env = await runnerTestSession.initSession();
  domainController = env.domainController;
  testApplicationDeploymentMap = env.applicationDeploymentMap;
});

// DropEntity creates/drops its own ephemeral deployment inside the composite
// (emptyApplicationModel). Reset the *canonical* library playfield only.
beforeEach(async () => {
  await beforeEachTest(domainController, testApplicationDeploymentMap);
});

afterAll(async () => {
  await runnerTestSession.teardown();
  await afterAllTests(miroirActivityTracker, [runnerDropEntity.name]);
});

// ################################################################################################
const runnerTestParams: Record<string, RunnerTestParams> = {
  [runnerDropEntity.name]: {
    pageLabel,
    runner: runnerDropEntity as unknown as Runner,
    testApplicationUuid,
    testApplicationDeploymentUuid,
    testApplicationName,
    testParams: {
      createEntity: {
        application: testApplicationUuid,
        entity: entityAuthor,
        entityDefinition: entityDefinitionAuthor,
      },
      [runnerDropEntity.name]: {
        application: testApplicationUuid,
        entity: entityAuthor.uuid,
      },
    },
    preTestCompositeActions: [
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
            applicationSection: "model",
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
    testCompositeActionAssertions: [
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
      {
        actionType: "compositeRunTestAssertion",
        actionLabel: "checkEntityList",
        nameGivenToResult: "checkEntityList",
        testAssertion: {
          testType: "testAssertion",
          testLabel: "checkEntityList",
          definition: {
            resultAccessPath: ["libraryEntityList", "entities"],
            ignoreAttributes: ["author", "storageAccess"],
            expectedValue: [],
          },
        },
      },
    ],
    internalMiroirConfig: sessionConfig.internalMiroirConfig,
    adminDeployment: sessionConfig.adminDeployment,
    testDeploymentStorageConfiguration: sessionConfig.testDeploymentStorageConfiguration,
    initialModel: emptyApplicationModel,
    preRunnerCompositeActions: [
      runnerCreateEntity.definition.compositeActionSequence as any,
    ],
    testCompositeActionLabel: "Create and Drop Entity Author",
  },
};

// ################################################################################################
describe.sequential(pageLabel, () => {
  it.each(Object.entries(runnerTestParams))(
    "test %s",
    async (currentTestSuiteName, testParams: RunnerTestParams) => {
      const testAction = testBuildPlusRuntimeCompositeActionSuiteForRunner(
        testParams.pageLabel,
        testParams.runner,
        testParams.testApplicationUuid,
        testParams.testApplicationDeploymentUuid,
        testParams.testApplicationName,
        testParams.testParams,
        testParams.preTestCompositeActions,
        testParams.testCompositeActionAssertions,
        testParams.internalMiroirConfig,
        testParams.adminDeployment,
        testParams.testDeploymentStorageConfiguration,
        testParams.initialModel,
        testParams.preRunnerCompositeActions,
        testParams.testCompositeActionLabel,
        testParams.skipCreateDeployment,
        testParams.skipDropDeployment,
      );
      const testSuiteResults = await runTestOrTestSuite(
        domainController,
        testAction,
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
});
