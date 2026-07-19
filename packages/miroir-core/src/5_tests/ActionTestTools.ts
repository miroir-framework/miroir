// ONLY A DEV DEPENDENCY! USED FOR THE TYPE ONLY, PRUNED BY THE TRANSPILER
import * as vitest from "vitest";
type VitestNamespace = typeof vitest;

import type {
  MiroirTestForAction,
  TestCompositeActionParams,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type { Uuid } from "../0_interfaces/1_core/EntityDefinition";
import { LIBRARY_TMP } from "../0_interfaces/1_core/LIBRARY_TMP.js";
import type { MiroirTestRunFilter } from "../0_interfaces/5-tests/miroirTestTypes";
import type {
  MiroirActivityTrackerInterface,
  TestAssertionPath,
} from "../0_interfaces/3_controllers/MiroirActivityTrackerInterface";
import { runCompositeActionTestParams } from "./CompositeActionTestTools.js";
import type { MiroirTestExecutionEnvironment } from "./MiroirTestTools";
import type { RunnerTestRunTarget } from "./RunnerTestRunTarget.js";

export type ResolveActionTestLeafParams = {
  leaf: MiroirTestForAction;
  applicationUuid: Uuid;
};

function deepReplaceUuidStrings<T>(value: T, replacements: Record<string, string>): T {
  if (typeof value === "string") {
    return (replacements[value] ?? value) as T;
  }
  if (Array.isArray(value)) {
    return value.map((entry) => deepReplaceUuidStrings(entry, replacements)) as T;
  }
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      out[key] = deepReplaceUuidStrings(entry, replacements);
    }
    return out as T;
  }
  return value;
}

/**
 * Rewrite canonical Library application/deployment UUIDs inside an `actionTest`
 * leaf so ephemeral runTargets resolve in `applicationDeploymentMap`.
 * No-op when runTarget already uses the canonical Library SelfApplication uuid.
 */
export function remapActionTestLeafForRunTarget(
  leaf: MiroirTestForAction,
  runTarget: RunnerTestRunTarget,
  canonicalApplicationUuid: Uuid = LIBRARY_TMP.selfApplicationLibraryUuid,
  canonicalDeploymentUuid: Uuid = LIBRARY_TMP.deployment_Library_DO_NO_USE.uuid,
): MiroirTestForAction {
  if (runTarget.applicationUuid === canonicalApplicationUuid) {
    return leaf;
  }
  return deepReplaceUuidStrings(leaf, {
    [canonicalApplicationUuid]: runTarget.applicationUuid,
    [canonicalDeploymentUuid]: runTarget.deploymentUuid,
  });
}

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

  const runTarget: RunnerTestRunTarget = compositeContext?.runTarget ?? {
    applicationUuid,
    applicationName: "Library",
    deploymentUuid:
      typeof compositeContext?.testParams?.testApplicationDeploymentUuid === "string"
        ? compositeContext.testParams.testApplicationDeploymentUuid
        : LIBRARY_TMP.deployment_Library_DO_NO_USE.uuid,
  };
  const remappedLeaf = remapActionTestLeafForRunTarget(leaf, runTarget);
  const testAction = resolveActionTestLeaf({ leaf: remappedLeaf, applicationUuid });
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
