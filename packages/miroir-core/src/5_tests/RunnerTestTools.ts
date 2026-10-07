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
  TestAssertionResult,
  TestCompositeActionParams,
  TestResult,
  TestSuiteResult,
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
import { resolveRunnerRefFromMiroirTestSuite } from "./runnerTestSuiteResolve.js";

export { miroirTestForRunner as runnerTestMlSchema } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
export {
  buildRunnerTestSessionParamBank,
  mergeRunnerTestParamBank,
  expandGetFromParametersInParamBank,
} from "./TestbedUuids.js";

export {
  collectRunnerTestLeaves,
  resolveDefaultApplicationNameFromMiroirTestSuite,
  resolveRunnerRefFromMiroirTestSuite,
  resolveSkipRunTargetPlayfieldResetFromMiroirTestSuite,
} from "./runnerTestSuiteResolve.js";

function findTrackedAssertionByName(
  suiteResult: TestSuiteResult,
  assertionName: string,
): TestAssertionResult | undefined {
  for (const test of Object.values(suiteResult.testsResults ?? {})) {
    const found = test.testAssertionsResults?.[assertionName];
    if (found) {
      return found;
    }
  }
  for (const nested of Object.values(suiteResult.testsSuiteResults ?? {})) {
    const found = findTrackedAssertionByName(nested, assertionName);
    if (found) {
      return found;
    }
  }
  return undefined;
}

function findTrackedTest(suiteResult: TestSuiteResult, testLabel: string): TestResult | undefined {
  const own = suiteResult.testsResults?.[testLabel];
  if (own) {
    return own;
  }
  for (const nested of Object.values(suiteResult.testsSuiteResults ?? {})) {
    const found = findTrackedTest(nested, testLabel);
    if (found) {
      return found;
    }
  }
  return undefined;
}

/**
 * Throws when an assertion of the leaf failed or did not run. A composite action records a
 * failed assertion in the activity tracker and still returns ok, so the status alone does not
 * tell. Assertions are looked up in the test labelled `testLabel` first.
 */
function expectLeafAssertionsPassed(
  leaf: MiroirTestForRunner,
  miroirActivityTracker: MiroirActivityTrackerInterface,
  failureLabel: string,
  testLabel?: string,
): void {
  const trackedRoot = miroirActivityTracker.getTestAssertionsResults([]);
  const trackedTest = testLabel ? findTrackedTest(trackedRoot, testLabel) : undefined;
  for (const assertion of leaf.testCompositeActionAssertions ?? []) {
    // the tracker records an assertion under its testLabel
    const assertionName = assertion.payload.testLabel;
    const tracked =
      trackedTest?.testAssertionsResults?.[assertionName] ??
      findTrackedAssertionByName(trackedRoot, assertionName);
    if (tracked === undefined) {
      throw new Error(
        `runnerTest "${leaf.miroirTestLabel}" ${failureLabel} "${assertionName}" did not run`,
      );
    }
    if (tracked.assertionResult === "error") {
      throw new Error(
        `runnerTest "${leaf.miroirTestLabel}" ${failureLabel} failed: ${tracked.assertionName} expected ${JSON.stringify(tracked.assertionExpectedValue)} actual ${JSON.stringify(tracked.assertionActualValue)}`,
      );
    }
  }
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

  if (resolvedRunner.definition.runnerType === "mcpToolRunner") {
    if (!runnerContext.executeMcpToolRunner) {
      throw new Error(
        "runMiroirRunnerTest: mcpToolRunner requires executeMcpToolRunner on runnerTestContext",
      );
    }
    const mergedTestParams = expandGetFromParametersInParamBank(
      mergeRunnerTestParamBank(runnerContext.testParams, leaf),
    );
    const namedArgs = mergedTestParams[resolvedRunner.name];
    const args =
      namedArgs && typeof namedArgs === "object" && !Array.isArray(namedArgs)
        ? (namedArgs as Record<string, unknown>)
        : {};
    const mcpResult = await runnerContext.executeMcpToolRunner(resolvedRunner, args);
    const expectedMcpStatus =
      typeof mergedTestParams.expectedMcpStatus === "string"
        ? mergedTestParams.expectedMcpStatus
        : "success";
    localVitest
      .expect(mcpResult.status, `${leaf.miroirTestLabel} MCP status`)
      .toBe(expectedMcpStatus);
    const expectedInstanceUuid = mergedTestParams.expectedInstanceUuid;
    if (typeof expectedInstanceUuid === "string") {
      localVitest
        .expect(JSON.stringify(mcpResult.result ?? {}), `${leaf.miroirTestLabel} payload`)
        .toContain(expectedInstanceUuid);
    }
    const hasPostSubmit =
      (leaf.preTestCompositeActions?.length ?? 0) > 0 ||
      (leaf.testCompositeActionAssertions?.length ?? 0) > 0;
    if (
      hasPostSubmit &&
      mcpResult.status === expectedMcpStatus &&
      expectedMcpStatus === "success"
    ) {
      const label = leaf.testCompositeActionLabel ?? leaf.miroirTestLabel;
      const currentModelEnvironment = runnerContext.domainController.currentModelEnvironment(
        runnerContext.runTarget.applicationUuid,
        runnerContext.applicationDeploymentMap,
      );
      await runnerContext.domainController.handleTestCompositeAction(
        {
          testType: "testBuildPlusRuntimeCompositeAction",
          testLabel: label,
          testParams: mergedTestParams,
          compositeActionSequence: {
            actionType: "compositeActionSequence",
            actionLabel: label,
            endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
            payload: {
              actionSequence: leaf.preTestCompositeActions ?? [],
            },
          },
          testCompositeActionAssertions: leaf.testCompositeActionAssertions ?? [],
        } as any,
        runnerContext.applicationDeploymentMap,
        currentModelEnvironment,
        mergedTestParams,
      );
      expectLeafAssertionsPassed(leaf, miroirActivityTracker, "post-submit assertion", label);
    }
    miroirActivityTracker.setTestAssertionResult(testAssertionPath, {
      assertionName: leaf.miroirTestLabel,
      assertionResult: "ok",
    });
    return;
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
  expectLeafAssertionsPassed(
    leaf,
    miroirActivityTracker,
    "assertion",
    leaf.testCompositeActionLabel ?? "no_testCompositeActionLabel_given",
  );
  miroirActivityTracker.setTestAssertionResult(testAssertionPath, {
    assertionName: leaf.miroirTestLabel,
    assertionResult: result?.status === "ok" ? "ok" : "error",
  });
}
