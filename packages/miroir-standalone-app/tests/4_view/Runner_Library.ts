
/** @deprecated Imperative parity reference — canonical definitions live in `miroirTest_runner_library` (deployment-library). */
import {
  extendMiroirConfigWithExtraDeploymentConfiguration,
  type Runner,
  type StoreUnitConfiguration
} from "miroir-core";
import { env } from "process";
import { loadTestConfigFiles } from "../utils/fileTools";

import {
  book1,
  defaultLibraryAppModel,
  deployment_Library_DO_NO_USE,
  entityLendingHistoryItem,
  lendDocument,
  returnDocument,
  selfApplicationLibrary,
  user1,
} from "miroir-test-app_deployment-library";
import {
  getTestConfig,
  testApplicationStorageConfiguration,
  type RunnerTestParams
} from "./RunnerIntegTestTools";

// ################################################################################################
const pageLabel = "Runner_Miroir.integ.test";

/** @deprecated Use `miroirTest_runner_library.definition.runTarget` — single triple for legacy harness. */
const runTarget = {
  applicationUuid: selfApplicationLibrary.uuid,
  applicationName: selfApplicationLibrary.name,
  deploymentUuid: deployment_Library_DO_NO_USE.uuid,
};

let miroirConfig: any;

const { miroirConfig: miroirConfigParam, logConfig } = await loadTestConfigFiles(env);
miroirConfig = miroirConfigParam;

const testConfig = getTestConfig(
  miroirConfig,
  runTarget.deploymentUuid,
  runTarget.applicationName,
  runTarget.applicationUuid,
);
const installTestDeploymentStorageConfiguration: StoreUnitConfiguration = testApplicationStorageConfiguration(
  testConfig.libraryDeploymentStorageConfiguration,
  runTarget.applicationName,
);
const installInternalMiroirConfig = extendMiroirConfigWithExtraDeploymentConfiguration(
  miroirConfig,
  installTestDeploymentStorageConfiguration,
  runTarget.deploymentUuid,
);

export const libraryLendBookRunnerTest: RunnerTestParams = {
  pageLabel,
  testCompositeActionLabel: "Lend Book Test Composite Action",
  runner: lendDocument as unknown as Runner,
  testApplicationUuid: runTarget.applicationUuid,
  testApplicationDeploymentUuid: runTarget.deploymentUuid,
  testApplicationName: runTarget.applicationName,
  testParams: {
    [lendDocument.name]: {
      actionType: "lendDocument",
      endpoint: "212f2784-5b68-43b2-8ee0-89b1c6fdd0de",
      payload: {
        user: user1.uuid,
        book: book1.uuid,
        // startDate: new Date("2024-01-01"),
        startDate: new Date("2024-01-01").toISOString(),
      } as any, // TODO: fix type!!
    },
  }, // testParams
  preRunnerCompositeActions: [], // preRunnerCompositeActions: create the entity before dropping it
  preTestCompositeActions: [
    {
      // performs query on local cache for emulated server, and on server for remote server
      actionType: "compositeRunBoxedQueryAction",
      endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
      actionLabel: "fetchLendingHistory",
      nameGivenToResult: "LendingHistoryList",
      payload: {
        actionType: "runBoxedQueryAction",
        endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
        payload: {
          application: runTarget.applicationUuid,
          applicationSection: "data",
          query: {
            queryType: "boxedQueryWithExtractorCombinerTransformer",
            application: runTarget.applicationUuid,
            pageParams: {
              currentDeploymentUuid: runTarget.deploymentUuid,
            },
            extractors: {
              items: {
                extractorOrCombinerType: "extractorInstancesByEntity",
                applicationSection: "data",
                parentName: entityLendingHistoryItem.name,
                parentUuid: entityLendingHistoryItem.uuid,
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
    {
      actionType: "compositeRunTestAssertion",
      actionLabel: "checkNumberOfLendingHistoryItems",
      nameGivenToResult: "checkNumberOfLendingHistoryItems",
      testAssertion: {
        testType: "testAssertion",
        testLabel: "checkNumberOfLendingHistoryItems",
        definition: {
          resultAccessPath: ["0"],
          resultTransformer: {
            transformerType: "aggregate",
            interpolation: "runtime",
            applyTo: {
              transformerType: "getFromContext",
              interpolation: "runtime",
              referencePath: ["LendingHistoryList", "items"],
            },
          },
          expectedValue: { aggregate: 1 },
        },
      },
    },
    // {
    //   actionType: "compositeRunTestAssertion",
    //   actionLabel: "checkEntityList",
    //   nameGivenToResult: "checkEntityList",
    //   testAssertion: {
    //     testType: "testAssertion",
    //     testLabel: "checkEntityList",
    //     definition: {
    //       resultAccessPath: ["libraryEntityList", "entities"],
    //       ignoreAttributes: ["author", "storageAccess"],
    //       expectedValue: [],
    //     },
    //   },
    // },
  ],
  internalMiroirConfig: installInternalMiroirConfig,
  adminDeployment: testConfig.adminDeployment,
  testDeploymentStorageConfiguration: installTestDeploymentStorageConfiguration,
  initialModel: defaultLibraryAppModel,
};

export const libraryReturnBookRunnerTest: RunnerTestParams = {
  pageLabel,
  testCompositeActionLabel: "Return Book Test Composite Action",
  runner: returnDocument as unknown as Runner,
  testApplicationUuid: runTarget.applicationUuid,
  testApplicationDeploymentUuid: runTarget.deploymentUuid,
  testApplicationName: runTarget.applicationName,
  testParams: {
    [returnDocument.name]: {
      actionType: "returnDocument",
      endpoint: "212f2784-5b68-43b2-8ee0-89b1c6fdd0de",
      payload: {
        user: user1.uuid,
        book: book1.uuid,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-01-01"),
      } as any, // TODO: fix type!!
    },
    // [returnDocument.name]: {
    //   user: user1.uuid,
    //   book: book1.uuid,
    //   endDate: new Date("2024-01-01"),
    // },
  }, // testParams
  preRunnerCompositeActions: [], // preRunnerCompositeActions: create the entity before dropping it
  preTestCompositeActions: [
    {
      // performs query on local cache for emulated server, and on server for remote server
      actionType: "compositeRunBoxedQueryAction",
      endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
      actionLabel: "fetchLendingHistory",
      nameGivenToResult: "LendingHistoryList",
      payload: {
        actionType: "runBoxedQueryAction",
        endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
        payload: {
          application: runTarget.applicationUuid,
          applicationSection: "data",
          query: {
            queryType: "boxedQueryWithExtractorCombinerTransformer",
            application: runTarget.applicationUuid,
            pageParams: {
              currentDeploymentUuid: runTarget.deploymentUuid,
            },
            extractors: {
              items: {
                extractorOrCombinerType: "extractorInstancesByEntity",
                applicationSection: "data",
                parentName: entityLendingHistoryItem.name,
                parentUuid: entityLendingHistoryItem.uuid,
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
    {
      actionType: "compositeRunTestAssertion",
      actionLabel: "checkNumberOfLendingHistoryItems",
      nameGivenToResult: "checkNumberOfLendingHistoryItems",
      testAssertion: {
        testType: "testAssertion",
        testLabel: "checkNumberOfLendingHistoryItems",
        definition: {
          resultAccessPath: ["0"],
          resultTransformer: {
            transformerType: "aggregate",
            interpolation: "runtime",
            applyTo: {
              transformerType: "getFromContext",
              interpolation: "runtime",
              referencePath: ["LendingHistoryList", "items"],
            },
          },
          expectedValue: { aggregate: 2 }, // TODO: returnDocument does a createInstance, so we have 2 items. it should check for the existence of an entry / find the latest entry, and update it.
        },
      },
    },
    // {
    //   actionType: "compositeRunTestAssertion",
    //   actionLabel: "checkEntityList",
    //   nameGivenToResult: "checkEntityList",
    //   testAssertion: {
    //     testType: "testAssertion",
    //     testLabel: "checkEntityList",
    //     definition: {
    //       resultAccessPath: ["libraryEntityList", "entities"],
    //       ignoreAttributes: ["author", "storageAccess"],
    //       expectedValue: [],
    //     },
    //   },
    // },
  ],
  internalMiroirConfig: installInternalMiroirConfig,
  adminDeployment: testConfig.adminDeployment,
  testDeploymentStorageConfiguration: installTestDeploymentStorageConfiguration,
  initialModel: defaultLibraryAppModel,
};
