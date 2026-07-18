// ONLY A DEV DEPENDENCY! USED FOR THE TYPE ONLY, PRUNED BY THE TRANSPILER
import * as vitest from "vitest";
export type VitestNamespace = typeof vitest;


import type {
  Deployment,
  MiroirConfigClient,
  MiroirTestForFunctionCall,
  MiroirTestForQuery,
  MiroirTestForRunner,
  MiroirTestLeaf,
  MiroirTestSuite,
  Runner,
  StoreUnitConfiguration,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type { MiroirTestForAction } from "../0_interfaces/5-tests/miroirTestActionTypes";
import type { MiroirModelEnvironment } from "../0_interfaces/1_core/Transformer";
import type {
  MiroirActivityTrackerInterface,
  TestAssertionPath,
} from "../0_interfaces/3_controllers/MiroirActivityTrackerInterface";
import { MiroirActivityTracker } from "../3_controllers/MiroirActivityTracker";
import { runMiroirActionTest } from "./ActionTestTools.js";
import { runMiroirFunctionCallTestInMemory } from "./FunctionCallTestTools";
import {
  runMiroirTransformerIntegrationTest,
  runMiroirTransformerTest,
} from "./MiroirTransformerTestTools";
import { runMiroirQueryRunnerTestInMemory } from "./QueryRunnerTestTools";
import { runMiroirRunnerTest } from "./RunnerTestTools";
import type { MiroirTestRunFilter } from "../0_interfaces/5-tests/miroirTestTypes";
import { runMiroirTestSuiteWalk } from "./miroirTestSuiteWalk.js";
import type { DomainControllerInterface } from "../0_interfaces/2_domain/DomainControllerInterface";
import type { PersistenceStoreControllerManagerInterface } from "../0_interfaces/4-services/PersistenceStoreControllerManagerInterface";
import type { ApplicationDeploymentMap } from "../1_core/Deployment";
import type { RunnerTestRunTarget } from "./RunnerTestRunTarget.js";

export type MiroirTestLeafExecutable = MiroirTestLeaf | MiroirTestForAction;
export type RunnerTestContext = {
  domainController: DomainControllerInterface;
  applicationDeploymentMap: ApplicationDeploymentMap;
  internalMiroirConfig: MiroirConfigClient;
  pageLabel: string;
  adminDeployment: Deployment;
  testDeploymentStorageConfiguration: StoreUnitConfiguration;
  runTarget: RunnerTestRunTarget;
  runnerRegistry: Record<string, Runner>;
  testParams: Record<string, unknown>;
  runtimeContext: Record<string, unknown>;
};

export type MiroirTestExecutionEnvironment = {
  domainController: DomainControllerInterface;
  applicationDeploymentMap: ApplicationDeploymentMap;
  testApplicationUuid: string;
  persistenceStoreControllerManager: PersistenceStoreControllerManagerInterface;
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
  executionEnvironment: MiroirTestExecutionEnvironment;
};


function miroirTestLeafLabel(leaf: MiroirTestLeafExecutable): string {
  return leaf.miroirTestLabel;
}

// ################################################################################################
export type RunMiroirTest = (
  localVitest: VitestNamespace,
  testNamePath: string[],
  filter: MiroirTestRunFilter | undefined,
  leaf: MiroirTestLeafExecutable,
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
  leaf: MiroirTestLeafExecutable,
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

  if (leaf.miroirTestType === "actionTest") {
    if (executionOptions?.executionMode !== "integration") {
      throw new Error(
        "runMiroirTestInMemory: actionTest leaves require executionMode integration",
      );
    }
    return runMiroirActionTest(
      localVitest,
      testNamePath,
      filter,
      leaf,
      miroirActivityTracker,
      testAssertionPath,
      parentSkip,
      executionOptions.executionEnvironment,
    );
  }

  switch (leaf.miroirTestType) {
    case "transformerTest": {
      if (executionOptions?.executionMode === "integration") {
        const env = executionOptions.executionEnvironment;
        if (env?.domainController === undefined) {
          throw new Error(
            "runMiroirTestInMemory: executionEnvironment.domainController is required when executionMode is integration",
          );
        }
        if (env.applicationDeploymentMap === undefined) {
          throw new Error(
            "runMiroirTestInMemory: executionEnvironment.applicationDeploymentMap is required when executionMode is integration",
          );
        }
        if (env.testApplicationUuid === undefined) {
          throw new Error(
            "runMiroirTestInMemory: executionEnvironment.testApplicationUuid is required when executionMode is integration",
          );
        }
        const runIntegration = runMiroirTransformerIntegrationTest(
          env.domainController,
          env.applicationDeploymentMap,
          env.testApplicationUuid,
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
      if (executionOptions.executionEnvironment.runnerTestContext === undefined) {
        throw new Error(
          "runMiroirTestInMemory: executionEnvironment.runnerTestContext is required for runnerTest leaves",
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
  miroirActivityTracker: MiroirActivityTrackerInterface,
  parentTrackingId: string | undefined,
  trackActionsBelow: boolean = false,
  runMiroirTests: RunMiroirTests,
  executionOptions?: MiroirTestExecutionOptions,
  parentSkip?: boolean,
): Promise<void> {
  await runMiroirTestSuiteWalk({
    localVitest,
    testSuitePath,
    miroirTestSuite,
    filter,
    modelEnvironment,
    miroirActivityTracker,
    parentTrackingId,
    trackActionsBelow,
    runMiroirTests,
    executionOptions,
    parentSkip,
    inProcess: false,
  });
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
    if (parentSkip || leaf.skip) {
      return;
    }
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
