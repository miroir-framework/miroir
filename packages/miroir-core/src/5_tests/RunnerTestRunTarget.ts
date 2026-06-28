import { v4 as uuidv4 } from "uuid";

import type {
  MiroirTestForRunner,
  MiroirTestSuite,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

export type RunnerTestRunTarget = {
  applicationUuid: string;
  applicationName: string;
  deploymentUuid: string;
};

export type RunnerTestRunTargetOverride = Partial<RunnerTestRunTarget>;

export type ResolveRunnerTestRunTargetParams = {
  suite: Pick<MiroirTestSuite, "runTarget" | "miroirTestLabel">;
  callerOverride?: RunnerTestRunTargetOverride;
  defaultApplicationName?: string;
  generateUuid?: () => string;
};

const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isRunnerTestRunTargetUuid(value: string): boolean {
  return UUID_V4_PATTERN.test(value);
}

export function resolveRunnerTestRunTarget({
  suite,
  callerOverride,
  defaultApplicationName = "Library",
  generateUuid = uuidv4,
}: ResolveRunnerTestRunTargetParams): RunnerTestRunTarget {
  const fromSuite = suite.runTarget;

  const resolved: RunnerTestRunTarget = {
    applicationUuid: fromSuite?.applicationUuid ?? generateUuid(),
    applicationName: fromSuite?.applicationName ?? defaultApplicationName,
    deploymentUuid: fromSuite?.deploymentUuid ?? generateUuid(),
  };

  if (callerOverride === undefined) {
    return resolved;
  }

  return {
    applicationUuid: callerOverride.applicationUuid ?? resolved.applicationUuid,
    applicationName: callerOverride.applicationName ?? resolved.applicationName,
    deploymentUuid: callerOverride.deploymentUuid ?? resolved.deploymentUuid,
  };
}

export function buildRunnerTestSessionParamBank(
  suiteTestParams: Record<string, unknown> | undefined,
  runTarget: RunnerTestRunTarget,
  additionalSeed: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    ...additionalSeed,
    ...(suiteTestParams ?? {}),
    testApplicationUuid: runTarget.applicationUuid,
    testApplicationDeploymentUuid: runTarget.deploymentUuid,
  };
}

export function mergeRunnerTestParamBank(
  sessionTestParams: Record<string, unknown>,
  leaf: MiroirTestForRunner,
): Record<string, unknown> {
  return {
    ...sessionTestParams,
    ...(leaf.testParams ?? {}),
  };
}
