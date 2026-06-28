// ONLY A DEV DEPENDENCY! USED FOR THE TYPE ONLY, PRUNED BY THE TRANSPILER
import * as vitest from "vitest";
type VitestNamespace = typeof vitest;

import type {
  Deployment,
  MiroirConfigClient,
  MiroirTestForRunner,
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
import { resolveRunnerFromRegistry } from "./resolveRunnerFromRegistry.js";
import type { MiroirTestRunFilter } from "../0_interfaces/5-tests/miroirTestTypes";
import type { MiroirTestExecutionEnvironment } from "./MiroirTestTools";
import type { RunnerTestRunTarget } from "./RunnerTestRunTarget";
import { mergeRunnerTestParamBank } from "./RunnerTestRunTarget.js";

export { miroirTestForRunner as runnerTestJzodSchema } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
export {
  buildRunnerTestSessionParamBank,
  mergeRunnerTestParamBank,
} from "./RunnerTestRunTarget.js";

export type ResolveRunnerTestLeafBuildContext = {
  internalMiroirConfig: MiroirConfigClient;
  adminDeployment: Deployment;
  testDeploymentStorageConfiguration: StoreUnitConfiguration;
};

export type ResolveRunnerTestLeafParams = {
  leaf: MiroirTestForRunner;
  pageLabel: string;
  buildContext: ResolveRunnerTestLeafBuildContext;
  runTarget: RunnerTestRunTarget;
  sessionTestParams: Record<string, unknown>;
  runnerRegistry: Record<string, Runner>;
};

// ################################################################################################
export function resolveRunnerTestLeaf({
  leaf,
  pageLabel,
  buildContext,
  runTarget,
  sessionTestParams,
  runnerRegistry,
}: ResolveRunnerTestLeafParams): TestCompositeActionParams {
  if (leaf.initialModel === undefined) {
    throw new Error(
      `runnerTest leaf "${leaf.miroirTestLabel}" requires inline initialModel`,
    );
  }

  const mergedTestParams = mergeRunnerTestParamBank(sessionTestParams, leaf);

  return testBuildPlusRuntimeCompositeActionSuiteForRunner(
    pageLabel,
    resolveRunnerFromRegistry(runnerRegistry, leaf.runnerRef),
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
    runTarget: runnerContext.runTarget,
    sessionTestParams: runnerContext.testParams,
    runnerRegistry: runnerContext.runnerRegistry,
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
