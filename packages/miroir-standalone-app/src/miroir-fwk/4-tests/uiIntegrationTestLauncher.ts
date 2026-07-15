import {
  defaultMetaModelEnvironment,
  inferIntegrationSessionKind,
  resolveRunnerTestRunTarget,
  runMiroirTests,
  runMiroirTestSuiteInProcess,
  type InProcessExpectFn,
  type IntegrationTestSessionKind,
  type LoggerOptions,
  type MiroirConfigClient,
  type MiroirTestIntegrationOrchestrator,
  type MiroirTestSuite,
  type RunnerTestRunTarget,
  type TestSuiteResult,
} from "miroir-core";

import {
  getIntegTestRunCoordinator,
  type IntegActivityTrackerBundle,
  type IntegTestRunCoordinator,
} from "./integTestRunCoordinator.js";
import {
  resolveUiIntegrationRunnerSuite,
  type UiIntegrationRunnerSuiteEntry,
} from "./uiIntegrationTestRunnerSuiteRegistry.js";
import type {
  UiIntegrationTestRunInspectorSnapshot,
  UiIntegrationTestRunRequest,
  UiIntegrationTestRunResult,
  UiIntegrationTestRunTargetMode,
} from "./uiIntegrationTestLauncherTypes.js";

export type UiIntegrationTestLauncherEnvironment = {
  createOrchestrator: () => MiroirTestIntegrationOrchestrator;
  loadConfigForProfile: (profileName: string) => Promise<{
    miroirConfig: MiroirConfigClient;
    logConfig: LoggerOptions;
  }>;
  createActivityTracker: (logConfig: LoggerOptions) => Promise<IntegActivityTrackerBundle>;
  expect: InProcessExpectFn;
  getCoordinator?: () => IntegTestRunCoordinator;
};

export function resolveUiIntegrationTestRunTarget(
  runTargetMode: UiIntegrationTestRunTargetMode,
  suite: MiroirTestSuite,
): RunnerTestRunTarget {
  if (runTargetMode === "ephemeral") {
    return resolveRunnerTestRunTarget({
      suite: { miroirTestLabel: suite.miroirTestLabel },
    });
  }
  return resolveRunnerTestRunTarget({ suite });
}

export function readUiIntegrationSuiteTestResults(
  tracker: IntegActivityTrackerBundle["miroirActivityTracker"],
  testSuitePathKey: string,
): TestSuiteResult {
  return tracker.getTestAssertionsResults([{ testSuite: testSuitePathKey }]);
}

export function isUiIntegrationSuiteRunSuccessful(
  tracker: IntegActivityTrackerBundle["miroirActivityTracker"],
  testSuitePathKey: string,
): boolean {
  let suiteResult: TestSuiteResult;
  try {
    suiteResult = readUiIntegrationSuiteTestResults(tracker, testSuitePathKey);
  } catch {
    return false;
  }
  const testResults = suiteResult.testsResults;
  if (!testResults || Object.keys(testResults).length === 0) {
    return false;
  }
  return Object.values(testResults).every((entry) => entry.testResult === "ok");
}

function buildInspectorSnapshot(
  request: UiIntegrationTestRunRequest,
  sessionKind: IntegrationTestSessionKind,
  runTarget: RunnerTestRunTarget,
): UiIntegrationTestRunInspectorSnapshot {
  const hostMode = request.hostMode ?? "isolated";
  return {
    profileName: request.profileName,
    sessionKind,
    runTarget,
    runTargetMode: request.runTargetMode,
    hostMode,
    paramBankKeys: Object.keys(request.suiteDefinition.testParams ?? {}).sort(),
  };
}

async function runRunnerIntegrationSuite(
  request: UiIntegrationTestRunRequest,
  environment: UiIntegrationTestLauncherEnvironment,
  runnerEntry: UiIntegrationRunnerSuiteEntry,
  runTarget: RunnerTestRunTarget,
  hostMode: NonNullable<UiIntegrationTestRunRequest["hostMode"]>,
): Promise<UiIntegrationTestRunResult> {
  const { miroirConfig, logConfig } = await environment.loadConfigForProfile(request.profileName);
  const trackerBundle = await environment.createActivityTracker(logConfig);
  const orchestrator = environment.createOrchestrator();
  const testSession = orchestrator.createSession(
    "runner",
    {
      miroirConfig,
      miroirActivityTracker: trackerBundle.miroirActivityTracker,
      miroirEventService: trackerBundle.miroirEventService,
      hostMode,
    },
    {
      pageLabel: "ui-integration-test",
      runTarget,
      suiteTestParams: request.suiteDefinition.testParams,
      runnerRegistry: runnerEntry.runnerRegistry,
    },
  );

  let success = false;
  try {
    const executionEnvironment = await testSession.initSession();
    await runMiroirTestSuiteInProcess({
      runMiroirTests,
      expect: environment.expect,
      testSuitePath: [request.suiteKey],
      miroirTestSuite: request.suiteDefinition,
      filter: request.filter,
      modelEnvironment: defaultMetaModelEnvironment,
      miroirActivityTracker: trackerBundle.miroirActivityTracker,
      executionOptions: {
        executionMode: "integration",
        executionEnvironment,
      },
      beforeEachLeaf: () => testSession.beforeEach(),
    });
    success = isUiIntegrationSuiteRunSuccessful(
      trackerBundle.miroirActivityTracker,
      request.suiteKey,
    );
  } finally {
    await testSession.teardown();
  }

  let testSuiteResults: TestSuiteResult | undefined;
  try {
    testSuiteResults = readUiIntegrationSuiteTestResults(
      trackerBundle.miroirActivityTracker,
      request.suiteKey,
    );
  } catch {
    testSuiteResults = undefined;
  }

  return {
    suiteKey: request.suiteKey,
    sessionKind: "runner",
    runTarget,
    runTargetMode: request.runTargetMode,
    profileName: request.profileName,
    hostMode,
    success,
    inspector: buildInspectorSnapshot(request, "runner", runTarget),
    testSuiteResults,
  };
}

export async function runUiIntegrationTestSuite(
  request: UiIntegrationTestRunRequest,
  environment: UiIntegrationTestLauncherEnvironment,
): Promise<UiIntegrationTestRunResult> {
  const sessionKind = inferIntegrationSessionKind(request.suiteDefinition);
  if (sessionKind === undefined) {
    throw new Error(
      `Suite "${request.suiteKey}" has no integration leaves — cannot run UI integration launcher`,
    );
  }

  if (sessionKind !== "runner") {
    throw new Error(
      `B3 pilot: session kind "${sessionKind}" not supported yet (runner_library only)`,
    );
  }

  const runnerEntry = resolveUiIntegrationRunnerSuite(request.suiteKey);

  const runTarget = resolveUiIntegrationTestRunTarget(request.runTargetMode, request.suiteDefinition);
  const hostMode = request.hostMode ?? "isolated";
  const coordinator = environment.getCoordinator?.() ?? getIntegTestRunCoordinator();

  return coordinator.runExclusive(() =>
    runRunnerIntegrationSuite(request, environment, runnerEntry, runTarget, hostMode),
  );
}
