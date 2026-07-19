/**
 * @deprecated Prefer MiroirTest suite `runner_create_entity` via:
 *   npm run testMiroir -w miroir-standalone-app -- --suites runner_create_entity --mode integ --profile emulatedServer-sql
 * Kept green until G8 cutover. See runner-create-drop-entity-miroirtest-migration-plan.md.
 *
 * Runner_CreateEntity.integ.test.tsx
 *
 * Imperative harness for `runnerCreateEntity` (G8). Canonical MiroirTest migration:
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
  type CompositeAction,
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
  entityEntityDefinition,
  entityMenu,
  entityReport,
  runnerCreateEntity,
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
const globalTimeOut = 30000;

// Fixed UUID for the test menu used in the withReports test
const testMenuUuid = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

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

// Legacy CreateEntity suites create/drop their own ephemeral deployment inside the
// composite action (emptyApplicationModel). Reset the *canonical* library playfield
// only — do not seed the ephemeral runTarget with remapped library model.
beforeEach(async () => {
  await beforeEachTest(domainController, testApplicationDeploymentMap);
});

afterAll(async () => {
  await runnerTestSession.teardown();
  await afterAllTests(miroirActivityTracker, [
    runnerCreateEntity.name,
    runnerCreateEntity.name + "_withReports",
  ]);
});

// ################################################################################################
const runnerTestParams: Record<string, RunnerTestParams> = {
  [runnerCreateEntity.name]: {
    pageLabel,
    runner: runnerCreateEntity as unknown as Runner,
    testApplicationUuid,
    testApplicationDeploymentUuid,
    testApplicationName,
    testParams: {
      [runnerCreateEntity.name]: {
        application: testApplicationUuid,
        entity: entityAuthor,
        entityDefinition: entityDefinitionAuthor,
        addDefaultReports: false,
        addMenuLink: false,
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
    internalMiroirConfig: sessionConfig.internalMiroirConfig,
    adminDeployment: sessionConfig.adminDeployment,
    testDeploymentStorageConfiguration: sessionConfig.testDeploymentStorageConfiguration,
    initialModel: emptyApplicationModel,
  },
  [runnerCreateEntity.name + "_withReports"]: {
    pageLabel,
    runner: runnerCreateEntity as unknown as Runner,
    testApplicationUuid,
    testApplicationDeploymentUuid,
    testApplicationName,
    testParams: {
      [runnerCreateEntity.name]: {
        application: testApplicationUuid,
        entity: entityAuthor,
        entityDefinition: entityDefinitionAuthor,
        addDefaultReports: true,
        addMenuLink: true,
      },
    },
    preRunnerCompositeActions: [
      {
        actionType: "createInstance",
        actionLabel: "createTestMenuForMenuLinkTest",
        endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
        payload: {
          application: testApplicationUuid,
          applicationSection: "model",
          objects: [
            {
              uuid: testMenuUuid,
              parentName: entityMenu.name,
              parentUuid: entityMenu.uuid,
              name: "TestMenu",
              defaultLabel: "Test Menu",
              definition: {
                menuType: "complexMenu",
                definition: [
                  {
                    title: "Test",
                    label: "test",
                    items: [],
                  },
                ],
              },
            },
          ],
        },
      } satisfies CompositeAction,
    ],
    preTestCompositeActions: [
      {
        actionType: "compositeRunBoxedQueryAction",
        endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
        actionLabel: "getReportsAndMenus",
        nameGivenToResult: "reportsAndMenus",
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
                reports: {
                  extractorOrCombinerType: "extractorInstancesByEntity",
                  applicationSection: "model",
                  parentName: entityReport.name,
                  parentUuid: entityReport.uuid,
                  orderBy: {
                    attributeName: "name",
                    direction: "ASC",
                  },
                },
                menus: {
                  extractorOrCombinerType: "extractorInstancesByEntity",
                  applicationSection: "model",
                  parentName: entityMenu.name,
                  parentUuid: entityMenu.uuid,
                },
                entityDefs: {
                  extractorOrCombinerType: "extractorInstancesByEntity",
                  applicationSection: "model",
                  parentName: entityEntityDefinition.name,
                  parentUuid: entityEntityDefinition.uuid,
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
        actionLabel: "checkNumberOfReports",
        nameGivenToResult: "checkNumberOfReports",
        testAssertion: {
          testType: "testAssertion",
          testLabel: "checkNumberOfReports",
          definition: {
            resultAccessPath: ["0"],
            resultTransformer: {
              transformerType: "aggregate",
              interpolation: "runtime",
              applyTo: {
                transformerType: "getFromContext",
                interpolation: "runtime",
                referencePath: ["reportsAndMenus", "reports"],
              },
            },
            expectedValue: { aggregate: 2 },
          },
        },
      },
      {
        actionType: "compositeRunTestAssertion",
        actionLabel: "checkMenuHasNewItem",
        nameGivenToResult: "checkMenuHasNewItem",
        testAssertion: {
          testType: "testAssertion",
          testLabel: "checkMenuHasNewItem",
          definition: {
            resultAccessPath: ["0"],
            resultTransformer: {
              transformerType: "aggregate",
              interpolation: "runtime",
              applyTo: {
                transformerType: "getFromContext",
                interpolation: "runtime",
                referencePath: [
                  "reportsAndMenus",
                  "menus",
                  "0",
                  "definition",
                  "definition",
                  "0",
                  "items",
                ],
              },
            },
            expectedValue: { aggregate: 1 },
          },
        },
      },
    ],
    internalMiroirConfig: sessionConfig.internalMiroirConfig,
    adminDeployment: sessionConfig.adminDeployment,
    testDeploymentStorageConfiguration: sessionConfig.testDeploymentStorageConfiguration,
    initialModel: emptyApplicationModel,
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
