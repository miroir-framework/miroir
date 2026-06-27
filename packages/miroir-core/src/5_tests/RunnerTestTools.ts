// ONLY A DEV DEPENDENCY! USED FOR THE TYPE ONLY, PRUNED BY THE TRANSPILER
import * as vitest from "vitest";
type VitestNamespace = typeof vitest;

import type {
  MiroirTestForRunner,
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
import {
  resolveRunnerRef,
  resolveRunnerTestDeploymentRef,
  RUNNER_TEST_ENVIRONMENT_REFS,
} from "miroir-test-app_deployment-library";
import type {
  Deployment,
  MiroirConfigClient,
  StoreUnitConfiguration,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type { MiroirTestRunFilter } from "../0_interfaces/5-tests/miroirTestTypes";
import type { MiroirTestExecutionEnvironment } from "./MiroirTestTools";

export { miroirTestForRunner as runnerTestJzodSchema } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

export type ResolveRunnerTestLeafBuildContext = {
  internalMiroirConfig: MiroirConfigClient;
  adminDeployment: Deployment;
  testDeploymentStorageConfiguration: StoreUnitConfiguration;
};

export type ResolveRunnerTestLeafParams = {
  leaf: MiroirTestForRunner;
  pageLabel: string;
  buildContext: ResolveRunnerTestLeafBuildContext;
};

export function mergeRunnerTestParamBank(
  environmentSeed: typeof RUNNER_TEST_ENVIRONMENT_REFS,
  leaf: MiroirTestForRunner,
): Record<string, unknown> {
  return {
    ...(environmentSeed?.testParams ?? {}),
    ...(leaf.testParams ?? {}),
  };
}

// ################################################################################################
export function resolveRunnerTestLeaf({
  leaf,
  pageLabel,
  buildContext,
}: ResolveRunnerTestLeafParams): TestCompositeActionParams {
  if (leaf.initialModel === undefined) {
    throw new Error(
      `runnerTest leaf "${leaf.miroirTestLabel}" requires inline initialModel`,
    );
  }

  const deployment = resolveRunnerTestDeploymentRef(leaf.deploymentRef);
  const mergedTestParams = mergeRunnerTestParamBank(RUNNER_TEST_ENVIRONMENT_REFS, leaf);

  return testBuildPlusRuntimeCompositeActionSuiteForRunner(
    pageLabel,
    resolveRunnerRef(leaf.runnerRef),
    deployment.testApplicationUuid,
    deployment.testApplicationDeploymentUuid,
    deployment.testApplicationName,
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
  const fullTestName = testAction.testActionLabel ?? testAction.testActionType;
  const currentModelEnvironment = domainController.currentModelEnvironment(
    testAction.application,
    applicationDeploymentMap,
  );

  if (testAction.testActionType !== "testBuildPlusRuntimeCompositeActionSuite") {
    throw new Error(
      `runRunnerTestCompositeAction: unsupported testActionType ${testAction.testActionType}`,
    );
  }

  const newParams = {
    ...(testActionParamValues ?? {}),
    ...(testAction.testParams ?? {}),
  };

  return miroirActivityTracker.trackTestSuite(fullTestName, fullTestName, undefined, async () =>
    domainController.handleTestCompositeActionSuite(
      testAction.application,
      testAction.testCompositeAction as any,
      applicationDeploymentMap,
      currentModelEnvironment,
      newParams,
    ),
  );
}

// ################################################################################################
export async function runMiroirRunnerTest(
  localVitest: VitestNamespace,
  _testNamePath: string[],
  _filter: MiroirTestRunFilter | undefined,
  leaf: MiroirTestForRunner,
  miroirActivityTracker: MiroirActivityTrackerInterface,
  testAssertionPath?: TestAssertionPath,
  parentSkip?: boolean,
  executionEnvironment?: MiroirTestExecutionEnvironment,
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

  const runnerContext = executionEnvironment?.runnerTestContext;
  if (!runnerContext) {
    throw new Error(
      "runMiroirRunnerTestInMemory: runnerTestContext is required in executionEnvironment",
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
  });

  const result = await runRunnerTestCompositeAction(
    runnerContext.domainController,
    testAction,
    runnerContext.applicationDeploymentMap,
    miroirActivityTracker,
    runnerContext.testParams,
  );

  localVitest.expect(result?.status, `${leaf.miroirTestLabel} failed`).toBe("ok");
}
