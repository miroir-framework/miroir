// ONLY A DEV DEPENDENCY! USED FOR THE TYPE ONLY, PRUNED BY THE TRANSPILER
import * as vitest from "vitest";
type VitestNamespace = typeof vitest;


import type {
  Deployment,
  MiroirConfigClient,
  MiroirTestForFunctionCall,
  MiroirTestForQuery,
  MiroirTestForRunner,
  MiroirTestLeaf,
  MiroirTestSuite,
  StoreUnitConfiguration,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type { MiroirModelEnvironment } from "../0_interfaces/1_core/Transformer";
import type {
  MiroirActivityTrackerInterface,
  TestAssertionPath,
} from "../0_interfaces/3_controllers/MiroirActivityTrackerInterface";
import { MiroirActivityTracker } from "../3_controllers/MiroirActivityTracker";
import { runMiroirFunctionCallTestInMemory } from "./FunctionCallTestTools";
import {
  miroirTestGlobalTimeOut,
  runMiroirTransformerIntegrationTest,
  runMiroirTransformerTest,
} from "./MiroirTransformerTestTools";
import { runMiroirQueryRunnerTestInMemory } from "./QueryRunnerTestTools";
import { runMiroirRunnerTest } from "./RunnerTestTools";
import type { MiroirTestRunFilter, TestSuiteListFilter } from "../0_interfaces/5-tests/miroirTestTypes";
import type { DomainControllerInterface } from "../0_interfaces/2_domain/DomainControllerInterface";
import type { ApplicationDeploymentMap } from "../1_core/Deployment";
import type { PersistenceStoreDataSectionInterface } from "../0_interfaces/4-services/PersistenceStoreControllerInterface";
import type { Uuid } from "../0_interfaces/1_core/EntityDefinition";

export type RunnerTestContext = {
  domainController: DomainControllerInterface;
  applicationDeploymentMap: ApplicationDeploymentMap;
  internalMiroirConfig: MiroirConfigClient;
  pageLabel: string;
  adminDeployment: Deployment;
  testDeploymentStorageConfiguration: StoreUnitConfiguration;
  testParams: Record<string, unknown>;
  runtimeContext: Record<string, unknown>;
};

export type MiroirTestExecutionEnvironment = {
  /** Transformer integration (direct Postgres). */
  integrationStore?: unknown; // TODO: BAD! stores should only be accessed through the domainController
  /** Runner integration (full stack). */
  runnerTestContext?: RunnerTestContext;
};

export interface RunnerTestSessionInterface {
  initSession(): Promise<MiroirTestExecutionEnvironment>;
  beforeEach(): Promise<void>;
  teardown(): Promise<void>;
}


export type MiroirTestExecutionMode = "unit" | "integration";

export type MiroirTestExecutionOptions = {
  executionMode: "unit";
} | {
  executionMode: "integration";
  /** Required when `executionMode` is `"integration"` (Postgres store). */
  // integrationStore?: unknown; // TODO: remove, use the domainController from the executionEnvironment instead
  // integrationStore?: PersistenceStoreControllerInterface; // TODO: remove, use the domainController from the executionEnvironment instead
  integrationStore?: PersistenceStoreDataSectionInterface; // TODO: remove, use the domainController from the executionEnvironment instead
  /** Populated by MiroirTestIntegrationOrchestrator (runner + shared integ context). */
  executionEnvironment?: MiroirTestExecutionEnvironment;
};


function miroirTestLeafLabel(leaf: MiroirTestLeaf): string {
  return leaf.miroirTestLabel;
}

function miroirTestNodeLabel(node: MiroirTestLeaf | MiroirTestSuite): string {
  if (node.miroirTestType === "miroirTestSuite") {
    return node.miroirTestLabel;
  }
  return miroirTestLeafLabel(node);
}

// ################################################################################################
export type RunMiroirTest = (
  localVitest: VitestNamespace,
  testNamePath: string[],
  filter: MiroirTestRunFilter | undefined,
  leaf: MiroirTestLeaf,
  modelEnvironment: MiroirModelEnvironment,
  miroirActivityTracker: MiroirActivityTrackerInterface,
  parentTrackingId: string | undefined,
  trackActionsBelow: boolean,
  runMiroirTests: RunMiroirTests,
  executionOptions?: MiroirTestExecutionOptions,
  testAssertionPath?: TestAssertionPath,
  parentSkip?: boolean,
) => Promise<void>;

// ################################################################################################
export interface RunMiroirTests {
  _runMiroirTestSuite: typeof runMiroirTestSuite;
  _runMiroirTest: RunMiroirTest;
  _runMiroirTestSuiteWithTracking: typeof runMiroirTestSuite;
  _runMiroirTestWithTracking: RunMiroirTest;
}

// ################################################################################################
export async function runMiroirTest(
  localVitest: VitestNamespace,
  testNamePath: string[],
  filter: MiroirTestRunFilter | undefined,
  leaf: MiroirTestLeaf,
  modelEnvironment: MiroirModelEnvironment,
  miroirActivityTracker: MiroirActivityTrackerInterface,
  _parentTrackingId: string | undefined,
  _trackActionsBelow: boolean,
  _runMiroirTests: RunMiroirTests,
  executionOptions?: MiroirTestExecutionOptions, // needed only for transformerTest and runnerTest
  testAssertionPath?: TestAssertionPath,
  parentSkip?: boolean,
): Promise<void> {
  const executionMode = executionOptions?.executionMode ?? "unit";

  switch (leaf.miroirTestType) {
    case "transformerTest": {
      if (executionOptions?.executionMode === "integration") {
        if (executionOptions?.integrationStore === undefined) {
          throw new Error(
            "runMiroirTestInMemory: integrationStore is required when executionMode is integration",
          );
        }
        const runIntegration = runMiroirTransformerIntegrationTest(
          executionOptions.integrationStore,
        );
        return runIntegration(
          localVitest,
          testNamePath,
          filter,
          leaf,
          modelEnvironment,
          miroirActivityTracker,
          testAssertionPath,
          parentSkip,
        );
      }
      // no executionOptions or executionMode is "unit"
      return runMiroirTransformerTest(
        localVitest,
        testNamePath,
        filter,
        leaf,
        modelEnvironment,
        miroirActivityTracker,
        testAssertionPath,
        parentSkip,
      );
    }
    case "functionCallTest":
      if (executionMode === "integration") {
        throw new Error(
          "runMiroirTestInMemory: functionCallTest leaves cannot run in integration mode",
        );
      }
      return runMiroirFunctionCallTestInMemory(
        localVitest,
        testNamePath,
        filter,
        leaf as MiroirTestForFunctionCall,
        miroirActivityTracker,
        testAssertionPath,
        parentSkip,
      );
    case "queryTest":
      if (executionMode === "integration") {
        throw new Error(
          "runMiroirTestInMemory: queryTest leaves cannot run in integration mode",
        );
      }
      return runMiroirQueryRunnerTestInMemory(
        localVitest,
        testNamePath,
        filter,
        leaf as MiroirTestForQuery,
        miroirActivityTracker,
        testAssertionPath,
        parentSkip,
        modelEnvironment,
      );
    case "runnerTest":
      if (executionOptions?.executionMode !== "integration") {
        throw new Error(
          "runMiroirTestInMemory: runnerTest leaves require executionMode integration",
        );
      }
      if (executionOptions?.executionEnvironment === undefined) {
        throw new Error(
          "runMiroirTestInMemory: executionEnvironment is required when executionMode is integration",
        );
      }
      return runMiroirRunnerTest(
        localVitest,
        testNamePath,
        filter,
        leaf as MiroirTestForRunner,
        miroirActivityTracker,
        testAssertionPath,
        parentSkip,
        executionOptions.executionEnvironment,
      );
    default: {
      const _exhaustive: never = leaf;
      throw new Error(`Unknown miroirTestType: ${(_exhaustive as MiroirTestLeaf).miroirTestType}`);
    }
  }
}

// ################################################################################################
export async function runMiroirTestSuite(
  localVitest: VitestNamespace,
  testSuitePath: string[],
  miroirTestSuite: MiroirTestSuite,
  filter: MiroirTestRunFilter | undefined,
  modelEnvironment: MiroirModelEnvironment,
  applicationDeploymentMap: ApplicationDeploymentMap,
  applicationUuid: Uuid,
  miroirActivityTracker: MiroirActivityTrackerInterface,
  parentTrackingId: string | undefined,
  trackActionsBelow: boolean = false,
  runMiroirTests: RunMiroirTests,
  executionOptions?: MiroirTestExecutionOptions,
  parentSkip?: boolean,
): Promise<void> {
  if (!localVitest.expect) {
    throw new Error("runMiroirTestSuite called without vitest.expect");
  }

  const shouldSkipSuite = miroirTestSuite.skip || parentSkip;

  const innerFilter: { testList: TestSuiteListFilter | undefined } = filter?.testList
    ? typeof filter.testList === "object" &&
      !Array.isArray(filter.testList) &&
      Object.hasOwn(filter.testList, miroirTestSuite.miroirTestLabel)
      ? { testList: filter.testList[miroirTestSuite.miroirTestLabel] }
      : { testList: [] }
    : { testList: undefined };

  const allTests = miroirTestSuite.miroirTests;
  const selectedTests = allTests.filter(
    (entry) =>
      !innerFilter?.testList ||
      (Array.isArray(innerFilter?.testList) &&
        innerFilter.testList.includes(miroirTestNodeLabel(entry))) ||
      (!Array.isArray(innerFilter?.testList) &&
        typeof innerFilter?.testList === "object" &&
        Object.hasOwn(innerFilter.testList, miroirTestNodeLabel(entry))),
  );

  if (allTests.length === 0) {
    const vitestTestFn = shouldSkipSuite ? localVitest.test.skip : localVitest.test;
    await vitestTestFn(
      `${miroirTestSuite.miroirTestLabel} (empty suite)`,
      () => {},
      miroirTestGlobalTimeOut,
    );
    return;
  }

  for (const node of allTests) {
    const label = miroirTestNodeLabel(node);
    const isSkipped = !selectedTests.includes(node) || !!shouldSkipSuite;

    if (node.miroirTestType === "miroirTestSuite") {
      const runNested = trackActionsBelow
        ? runMiroirTests._runMiroirTestSuiteWithTracking
        : runMiroirTests._runMiroirTestSuite;
      await runNested(
        localVitest,
        [...testSuitePath, node.miroirTestLabel],
        node,
        innerFilter,
        modelEnvironment,
        applicationDeploymentMap,
        applicationUuid,
        miroirActivityTracker,
        parentTrackingId,
        trackActionsBelow,
        runMiroirTests,
        executionOptions,
        shouldSkipSuite,
      );
    } else {
      const effectiveLeaf: MiroirTestLeaf = isSkipped ? { ...node, skip: true } : node;

      const runMiroirTest = trackActionsBelow
        ? runMiroirTests._runMiroirTestWithTracking
        : runMiroirTests._runMiroirTest;

      const vitestTestFn = isSkipped ? localVitest.test.skip : localVitest.test;
      await vitestTestFn(
        label,
        async () => {
          const assertionPath: TestAssertionPath =
            MiroirActivityTracker.stringArrayToTestAssertionPath(testSuitePath);
          assertionPath.push({ test: label });
          assertionPath.push({ testAssertion: label });

          await runMiroirTest(
            localVitest,
            [...testSuitePath, label],
            innerFilter,
            effectiveLeaf,
            modelEnvironment,
            miroirActivityTracker,
            parentTrackingId,
            trackActionsBelow,
            runMiroirTests,
            executionOptions,
            assertionPath,
            shouldSkipSuite,
          );
        },
        miroirTestGlobalTimeOut,
      );
    }
  }
}

// ################################################################################################
export const runMiroirTests: RunMiroirTests = {
  _runMiroirTestSuite: runMiroirTestSuite,
  _runMiroirTest: runMiroirTest,
  _runMiroirTestSuiteWithTracking: async (
    localVitest,
    testSuitePath,
    miroirTestSuite,
    filter,
    modelEnvironment,
    applicationDeploymentMap,
    applicationUuid,
    miroirActivityTracker,
    parentTrackingId = undefined,
    trackActionsBelow = false,
    runMiroirTestsRef,
    executionOptions,
    parentSkip?,
  ) => {
    const testSuiteName = miroirTestSuite.miroirTestLabel ?? miroirTestSuite.miroirTestType;
    const testSuitePathAsString = MiroirActivityTracker.testPathName(testSuitePath);
    await miroirActivityTracker.trackTestSuite(
      testSuiteName,
      testSuitePathAsString,
      parentTrackingId,
      async (nestedParentTrackingId) => {
        await runMiroirTestsRef._runMiroirTestSuite(
          localVitest,
          testSuitePath,
          miroirTestSuite,
          filter,
          modelEnvironment,
          applicationDeploymentMap,
          applicationUuid,
          miroirActivityTracker,
          nestedParentTrackingId,
          trackActionsBelow,
          runMiroirTestsRef,
          executionOptions,
          parentSkip,
        );
      },
    );
  },
  _runMiroirTestWithTracking: async (
    localVitest,
    testNamePath,
    filter,
    leaf,
    modelEnvironment,
    miroirActivityTracker,
    parentTrackingId = undefined,
    trackActionsBelow = false,
    runMiroirTestsRef,
    executionOptions,
    testAssertionPath?,
    parentSkip?,
  ) => {
    const label = miroirTestLeafLabel(leaf);
    await miroirActivityTracker.trackTest(label, parentTrackingId, async (nestedId) => {
      await miroirActivityTracker.trackTestAssertion(label, nestedId, async (assertionId) => {
        await runMiroirTestsRef._runMiroirTest(
          localVitest,
          testNamePath,
          filter,
          leaf,
          modelEnvironment,
          miroirActivityTracker,
          assertionId,
          trackActionsBelow,
          runMiroirTestsRef,
          executionOptions,
          testAssertionPath,
          parentSkip,
        );
      });
    });
  },
};

export {
  effectiveMiroirTransformerSkip,
  miroirTransformerAssertionName,
} from "./MiroirTransformerTestTools";
