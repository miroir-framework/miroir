/**
 * Runner_CreateEntity.integ.test.tsx
 */
import "@testing-library/jest-dom";
import { v4 as uuidv4 } from "uuid";
import { beforeEach, describe, expect, it } from "vitest";

import {
  type CompositeAction,
  type CompositeRunTestAssertion,
  type Deployment,
  type DomainControllerInterface,
  type LoggerInterface,
  type LoggerOptions,
  type MetaModel,
  type MiroirConfigClient,
  type MiroirModelEnvironment,
  type MlSchema,
  type Runner,
  type StoreUnitConfiguration,
  type TestCompositeActionParams,
  ConfigurationService,
  defaultMiroirMetaModel,
  emptyApplicationModel,
  formatYYYYMMDD_HHMMSS,
  MiroirActivityTracker,
  miroirCoreStartup,
  MiroirEventService,
  miroirFundamentalJzodSchema,
  MiroirLoggerFactory,
  testBuildPlusRuntimeCompositeActionSuiteForRunner
} from "miroir-core";
import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";
import { miroirIndexedDbStoreSectionStartup } from "miroir-store-indexedDb";
import { miroirMongoDbStoreSectionStartup } from "miroir-store-mongodb";
import { miroirPostgresStoreSectionStartup } from "miroir-store-postgres";
import {
  endpointDocument,
  entityAuthor,
  entityDefinitionAuthor
} from "miroir-test-app_deployment-library";
import { entityEntity, runnerCreateEntity } from "miroir-test-app_deployment-miroir";
import { env } from "process";
import { loglevelnext } from "../../src/loglevelnextImporter";
import { runTestOrTestSuite } from "../../src/miroir-fwk/4-tests/tests-utils";
import { miroirAppStartup } from "../../src/startup";
import { loadTestConfigFiles } from "../utils/fileTools";
import {
  afterAllTests,
  beforeAllTests,
  beforeEachTest,
  getTestConfig,
  testApplicationStorageConfiguration,
} from "./RunnerIntegTestTools";

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

let testDeploymentStorageConfiguration: StoreUnitConfiguration = testApplicationStorageConfiguration(
  libraryDeploymentStorageConfiguration,
  testApplicationName,
);

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

let domainController: DomainControllerInterface;

beforeAll(async () => {
  const {
    domainController: localdomainController,
  } = await  beforeAllTests(
    internalMiroirConfig,
    miroirActivityTracker,
    miroirEventService,
    adminDeployment,
    miroirDeploymentStorageConfiguration,
    // testDeploymentStorageConfiguration,
    applicationDeploymentMap,
  );
  domainController = localdomainController;
});

// executed only once like beforeAll, since there is only 1 test suite
beforeEach(async () => {
  await beforeEachTest(
    domainController,
    applicationDeploymentMap,
  );
});

afterAll(async () => {
  await afterAllTests(
    miroirActivityTracker,
    runnerCreateEntity.name,
  );
});

// const testApplicationModelEnvironment: MiroirModelEnvironment = {
//   miroirFundamentalJzodSchema: miroirFundamentalJzodSchema as MlSchema,
//   miroirMetaModel: defaultMiroirMetaModel,
//   endpointsByUuid: {[endpointDocument.uuid]: endpointDocument},
//   deploymentUuid: testApplicationDeploymentUuid,
//   currentModel: emptyApplicationModel,
// }

export interface RunnerTestParams {
  pageLabel: string,
  runner: Runner,
  testApplicationUuid: string,
  testApplicationDeploymentUuid: string,
  testApplicationName: string,
  testParams: Record<string, any>,
  preTestCompositeActions: CompositeAction[],
  testCompositeActionAssertions: CompositeRunTestAssertion[],
  //
  internalMiroirConfig: MiroirConfigClient,
  adminDeployment: Deployment,
  testDeploymentStorageConfiguration: StoreUnitConfiguration,
  // testApplicationModelEnvironment: MiroirModelEnvironment,
  initialModel: MetaModel,
  preRunnerCompositeActions?: CompositeAction[],
  testCompositeActionLabel?: string,

}

const runnerTestParams: Record<string, RunnerTestParams> = {
  [runnerCreateEntity.name]: {
    pageLabel,
    runner: runnerCreateEntity as Runner,
    testApplicationUuid,
    testApplicationDeploymentUuid,
    testApplicationName,
    testParams: {
      [runnerCreateEntity.name]: {
        transformerType: "returnValue",
        value: {
          application: testApplicationUuid,
          entity: entityAuthor,
          entityDefinition: entityDefinitionAuthor,
        },
      },
    }, // testParams
    preTestCompositeActions: [
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
    internalMiroirConfig,
    adminDeployment,
    testDeploymentStorageConfiguration,
    initialModel: emptyApplicationModel,
  },
};

// const testActions: Record<string, TestCompositeActionParams> = {
//   [runnerCreateEntity.name]: testBuildPlusRuntimeCompositeActionSuiteForRunner(
//     pageLabel,
//     runnerCreateEntity as Runner,
//     testApplicationUuid,
//     testApplicationDeploymentUuid,
//     testApplicationName,
//     {
//       [runnerCreateEntity.name]: {
//         transformerType: "returnValue",
//         value: {
//           application: testApplicationUuid,
//           entity: entityAuthor,
//           entityDefinition: entityDefinitionAuthor,
//         },
//       },
//     }, // testParams
//     [
//       {
//         // performs query on local cache for emulated server, and on server for remote server
//         actionType: "compositeRunBoxedQueryAction",
//         endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
//         actionLabel: "calculateNewEntityDefinionAndReports",
//         nameGivenToResult: "libraryEntityList",
//         payload: {
//           actionType: "runBoxedQueryAction",
//           endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
//           payload: {
//             application: testApplicationUuid,
//             applicationSection: "model", // TODO: give only selfApplication section in individual queries?
//             query: {
//               queryType: "boxedQueryWithExtractorCombinerTransformer",
//               application: testApplicationUuid,
//               pageParams: {
//                 currentDeploymentUuid: testApplicationDeploymentUuid,
//               },
//               queryParams: {},
//               contextResults: {},
//               extractors: {
//                 entities: {
//                   extractorOrCombinerType: "extractorByEntityReturningObjectList",
//                   applicationSection: "model",
//                   parentName: entityEntity.name,
//                   parentUuid: entityEntity.uuid,
//                   orderBy: {
//                     attributeName: "name",
//                     direction: "ASC",
//                   },
//                 },
//               },
//             },
//           },
//         },
//       },
//     ], // preTestCompositeActions
//     [
//       // TODO: test length of entityBookList.books!
//       {
//         actionType: "compositeRunTestAssertion",
//         actionLabel: "checkNumberOfEntities",
//         nameGivenToResult: "checkNumberOfEntities",
//         testAssertion: {
//           testType: "testAssertion",
//           testLabel: "checkNumberOfEntities",
//           definition: {
//             resultAccessPath: ["0"],
//             resultTransformer: {
//               transformerType: "aggregate",
//               interpolation: "runtime",
//               applyTo: {
//                 transformerType: "getFromContext",
//                 interpolation: "runtime",
//                 referencePath: ["libraryEntityList", "entities"],
//               },
//             },
//             expectedValue: { aggregate: 1 },
//           },
//         },
//       },
//       {
//         actionType: "compositeRunTestAssertion",
//         actionLabel: "checkEntityBooks",
//         nameGivenToResult: "checkEntityList",
//         testAssertion: {
//           testType: "testAssertion",
//           testLabel: "checkEntityBooks",
//           definition: {
//             resultAccessPath: ["libraryEntityList", "entities"],
//             ignoreAttributes: ["author", "storageAccess"],
//             expectedValue: [entityAuthor],
//           },
//         },
//       },
//     ],
//     //
//     internalMiroirConfig,
//     adminDeployment,
//     testDeploymentStorageConfiguration,
//     emptyApplicationModel,
//   ),
// };  

// ################################################################################################
describe.sequential(
  pageLabel,
  () => {
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
          //
          testParams.internalMiroirConfig,
          testParams.adminDeployment,
          testParams.testDeploymentStorageConfiguration,
          testParams.initialModel,
          testParams.preRunnerCompositeActions,
          testParams.testCompositeActionLabel,
        );
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
  }
);

