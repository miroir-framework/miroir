// ONLY A DEV DEPENDENCY! USED FOR THE TYPE ONLY, PRUNED BY THE TRANSPILER
import * as vitest from "vitest";
type VitestNamespace = typeof vitest;

import type {
  Deployment,
  MiroirConfigClient,
  MiroirTestForRunner,
  MiroirTestSuite,
  Runner,
  StoreUnitConfiguration,
  TestCompositeActionParams,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type { Action2ReturnType } from "../0_interfaces/2_domain/DomainElement";
import type { DomainControllerInterface } from "../0_interfaces/2_domain/DomainControllerInterface";
import type {
  MiroirActivityTrackerInterface,
  TestAssertionPath,
} from "../0_interfaces/3_controllers/MiroirActivityTrackerInterface";
import type { ApplicationDeploymentMap } from "../1_core/Deployment";
import { testBuildPlusRuntimeCompositeActionSuiteForRunner } from "../1_core/Runner";
import { runCompositeActionTestParams } from "./CompositeActionTestTools.js";
import type { MiroirTestRunFilter } from "../0_interfaces/5-tests/miroirTestTypes";
import type { MiroirTestExecutionEnvironment } from "./MiroirTestTools";
import type { TestbedUuids } from "./TestbedUuids";
import { mergeRunnerTestParamBank, expandGetFromParametersInParamBank } from "./TestbedUuids.js";

export { miroirTestForRunner as runnerTestJzodSchema } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
export {
  buildRunnerTestSessionParamBank,
  mergeRunnerTestParamBank,
  expandGetFromParametersInParamBank,
} from "./TestbedUuids.js";

export function collectRunnerTestLeaves(suite: MiroirTestSuite): MiroirTestForRunner[] {
  const leaves: MiroirTestForRunner[] = [];
  for (const test of suite.miroirTests) {
    if (test.miroirTestType === "runnerTest") {
      leaves.push(test);
    } else if (test.miroirTestType === "miroirTestSuite") {
      leaves.push(...collectRunnerTestLeaves(test));
    }
  }
  return leaves;
}

export function resolveRunnerRefFromMiroirTestSuite(suite: MiroirTestSuite): string {
  const leaves = collectRunnerTestLeaves(suite);
  if (leaves.length === 0) {
    throw new Error(
      `MiroirTestSuite "${suite.miroirTestLabel}" has no runnerTest leaves — cannot resolve runnerRef`,
    );
  }
  const runnerRef = leaves[0].runnerRef;
  for (const leaf of leaves.slice(1)) {
    if (leaf.runnerRef !== runnerRef) {
      throw new Error(
        `MiroirTestSuite "${suite.miroirTestLabel}" has inconsistent runnerRef values across runnerTest leaves`,
      );
    }
  }
  return runnerRef;
}

export function resolveRunnerFromRunnerRef(
  runnerRef: string,
  runnerUuidIndex: Record<string, Runner>,
): Runner {
  const runner = runnerUuidIndex[runnerRef];
  if (!runner) {
    throw new Error(`runnerRef "${runnerRef}" not found in runnerUuidIndex`);
  }
  return runner;
}

/** Resolves the suite Runner via its runnerTest leaves' `runnerRef` and the host index. */
export function resolveRunnerFromMiroirTestSuite(
  suite: MiroirTestSuite,
  runnerUuidIndex: Record<string, Runner>,
): Runner {
  return resolveRunnerFromRunnerRef(
    resolveRunnerRefFromMiroirTestSuite(suite),
    runnerUuidIndex,
  );
}

export type ResolveRunnerTestLeafBuildContext = {
  internalMiroirConfig: MiroirConfigClient;
  adminDeployment: Deployment;
  testDeploymentStorageConfiguration: StoreUnitConfiguration;
};

export type ResolveRunnerTestLeafParams = {
  leaf: MiroirTestForRunner;
  pageLabel: string;
  buildContext: ResolveRunnerTestLeafBuildContext;
  runTarget: TestbedUuids;
  sessionTestParams: Record<string, unknown>;
  /** Runner executed by the leaf (single-runner suites pass it directly). */
  resolvedRunner: Runner;
};

// ################################################################################################
export function resolveRunnerTestLeaf({
  leaf,
  pageLabel,
  buildContext,
  runTarget,
  sessionTestParams,
  resolvedRunner,
}: ResolveRunnerTestLeafParams): TestCompositeActionParams {
  if (leaf.initialModel === undefined) {
    throw new Error(
      `runnerTest leaf "${leaf.miroirTestLabel}" requires inline initialModel`,
    );
  }

  const mergedTestParams = expandGetFromParametersInParamBank(
    mergeRunnerTestParamBank(sessionTestParams, leaf),
  );

  const runner = resolvedRunner;

  return testBuildPlusRuntimeCompositeActionSuiteForRunner(
    pageLabel,
    runner,
    runTarget.applicationUuid,
    runTarget.deploymentUuid,
    runTarget.applicationName,
    mergedTestParams,
    leaf.preTestCompositeActions ?? [],
    leaf.testCompositeActionAssertions ?? [],
    buildContext.internalMiroirConfig,
    buildContext.adminDeployment,
    buildContext.testDeploymentStorageConfiguration,
    leaf.initialModel,
    leaf.preRunnerCompositeActions,
    leaf.testCompositeActionLabel,
    leaf.skipCreateDeployment,
    leaf.skipDropDeployment,
  );
}

// ################################################################################################
export async function runRunnerTestCompositeAction(
  domainController: DomainControllerInterface,
  testAction: TestCompositeActionParams,
  applicationDeploymentMap: ApplicationDeploymentMap,
  miroirActivityTracker: MiroirActivityTrackerInterface,
  testActionParamValues?: Record<string, unknown>,
): Promise<Action2ReturnType | undefined> {
  if (testAction.testActionType !== "testBuildPlusRuntimeCompositeActionSuite") {
    throw new Error(
      `runRunnerTestCompositeAction: unsupported testActionType ${testAction.testActionType}`,
    );
  }

  return runCompositeActionTestParams(
    domainController,
    testAction,
    applicationDeploymentMap,
    miroirActivityTracker,
    testActionParamValues,
  );
}

// ################################################################################################
export async function runMiroirRunnerTest(
  localVitest: VitestNamespace,
  _testNamePath: string[],
  _filter: MiroirTestRunFilter | undefined,
  leaf: MiroirTestForRunner,
  miroirActivityTracker: MiroirActivityTrackerInterface,
  executionEnvironment: MiroirTestExecutionEnvironment,
  testAssertionPath?: TestAssertionPath,
  parentSkip?: boolean,
): Promise<void> {
  if (!localVitest.expect) {
    throw new Error("runMiroirRunnerTestInMemory called without vitest.expect");
  }
  if (parentSkip || leaf.skip) {
    return;
  }
  if (!testAssertionPath) {
    throw new Error("runMiroirRunnerTestInMemory called without testAssertionPath");
  }

  const runnerContext = executionEnvironment.runnerTestContext;
  if (!runnerContext) {
    throw new Error(
      "runMiroirRunnerTest: executionEnvironment.runnerTestContext is required for runnerTest leaves",
    );
  }
  const runnerUuidIndex = runnerContext.runnerUuidIndex;
  const resolvedRunner =
    runnerUuidIndex !== undefined
      ? resolveRunnerFromRunnerRef(leaf.runnerRef, runnerUuidIndex)
      : runnerContext.resolvedRunner;
  if (resolvedRunner === undefined) {
    throw new Error(
      "runMiroirRunnerTest: runnerTestContext.runnerUuidIndex or resolvedRunner is required for runnerTest leaves",
    );
  }

  const testAction = resolveRunnerTestLeaf({
    leaf,
    pageLabel: runnerContext.pageLabel,
    buildContext: {
      internalMiroirConfig: runnerContext.internalMiroirConfig,
      adminDeployment: runnerContext.adminDeployment,
      testDeploymentStorageConfiguration: runnerContext.testDeploymentStorageConfiguration,
    },
    runTarget: runnerContext.runTarget,
    sessionTestParams: runnerContext.testParams,
    resolvedRunner,
  });

  const result = await runRunnerTestCompositeAction(
    runnerContext.domainController,
    testAction,
    runnerContext.applicationDeploymentMap,
    miroirActivityTracker,
    runnerContext.testParams,
  );

  localVitest.expect(result?.status, `${leaf.miroirTestLabel} failed`).toBe("ok");
  miroirActivityTracker.setTestAssertionResult(testAssertionPath, {
    assertionName: leaf.miroirTestLabel,
    assertionResult: result?.status === "ok" ? "ok" : "error",
  });
}
