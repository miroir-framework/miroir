// ONLY A DEV DEPENDENCY! USED FOR THE TYPE ONLY, PRUNED BY THE TRANSPILER
import * as vitest from "vitest";
type VitestNamespace = typeof vitest;

import type {
  MiroirTestForAction,
  TestCompositeActionParams,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type { Uuid } from "../0_interfaces/1_core/EntityDefinition";
import type { MiroirTestRunFilter } from "../0_interfaces/5-tests/miroirTestTypes";
import type {
  MiroirActivityTrackerInterface,
  TestAssertionPath,
} from "../0_interfaces/3_controllers/MiroirActivityTrackerInterface";
import { runCompositeActionTestParams } from "./CompositeActionTestTools.js";
import type { MiroirTestExecutionEnvironment } from "./MiroirTestTools";

export type ResolveActionTestLeafParams = {
  leaf: MiroirTestForAction;
  applicationUuid: Uuid;
};

/**
 * Resolve an `actionTest` leaf to `testCompositeAction` params (no Runner entity).
 */
export function resolveActionTestLeaf({
  leaf,
  applicationUuid,
}: ResolveActionTestLeafParams): TestCompositeActionParams {
  if (leaf.compositeActionSequence === undefined) {
    throw new Error(
      `actionTest leaf "${leaf.miroirTestLabel}" requires compositeActionSequence`,
    );
  }

  return {
    testActionType: "testCompositeAction",
    testActionLabel: leaf.miroirTestLabel,
    application: applicationUuid,
    testCompositeAction: {
      testType: "testCompositeAction",
      testLabel: leaf.miroirTestLabel,
      compositeActionSequence: leaf.compositeActionSequence,
      testCompositeActionAssertions: leaf.testCompositeActionAssertions ?? [],
      ...(leaf.beforeTestSetupAction !== undefined
        ? { beforeTestSetupAction: leaf.beforeTestSetupAction }
        : {}),
      ...(leaf.afterTestCleanupAction !== undefined
        ? { afterTestCleanupAction: leaf.afterTestCleanupAction }
        : {}),
    },
  };
}

/**
 * Execute an `actionTest` leaf against the integ execution environment.
 * Context: prefer `compositeActionTestContext`; `runnerTestContext` is accepted (1.3-a).
 */
export async function runMiroirActionTest(
  localVitest: VitestNamespace,
  _testNamePath: string[],
  _filter: MiroirTestRunFilter | undefined,
  leaf: MiroirTestForAction,
  miroirActivityTracker: MiroirActivityTrackerInterface,
  testAssertionPath?: TestAssertionPath,
  parentSkip?: boolean,
  executionEnvironment?: MiroirTestExecutionEnvironment,
): Promise<void> {
  if (!localVitest.expect) {
    throw new Error("runMiroirActionTest called without vitest.expect");
  }
  if (parentSkip || leaf.skip) {
    return;
  }
  if (!testAssertionPath) {
    throw new Error("runMiroirActionTest called without testAssertionPath");
  }

  const compositeContext =
    executionEnvironment?.compositeActionTestContext ??
    executionEnvironment?.runnerTestContext;

  const domainController =
    compositeContext?.domainController ?? executionEnvironment?.domainController;
  if (!domainController) {
    throw new Error(
      "runMiroirActionTest: executionEnvironment.domainController is required",
    );
  }

  const applicationDeploymentMap =
    compositeContext?.applicationDeploymentMap ??
    executionEnvironment?.applicationDeploymentMap;
  if (!applicationDeploymentMap) {
    throw new Error(
      "runMiroirActionTest: applicationDeploymentMap is required",
    );
  }

  const applicationUuid =
    compositeContext?.runTarget.applicationUuid ??
    executionEnvironment?.testApplicationUuid;
  if (!applicationUuid) {
    throw new Error(
      "runMiroirActionTest: runTarget.applicationUuid or testApplicationUuid is required",
    );
  }

  const testAction = resolveActionTestLeaf({ leaf, applicationUuid });
  const result = await runCompositeActionTestParams(
    domainController,
    testAction,
    applicationDeploymentMap,
    miroirActivityTracker,
    compositeContext?.testParams,
  );

  localVitest.expect(result?.status, `${leaf.miroirTestLabel} failed`).toBe("ok");
  miroirActivityTracker.setTestAssertionResult(testAssertionPath, {
    assertionName: leaf.miroirTestLabel,
    assertionResult: result?.status === "ok" ? "ok" : "error",
  });
}
