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
import { assertMiroirServerReachable } from "./assertMiroirServerReachable.js";
import { getIntegrationTestProfileCatalogEntry } from "./integrationTestProfileCatalog.js";
import {
  generateEphemeralIntegrationTestApplicationIdentity,
  PINNED_INTEG_TEST_APPLICATION_IDENTITY,
  type TestSessionForIntegOptions,
} from "./IntegrationTestSession.js";
import { transformerIdentityToRunTarget } from "./resolveTransformerTestSessionOptions.js";
import {
  resolveUiIntegrationRunnerSuite,
  type UiIntegrationRunnerSuiteEntry,
} from "./uiIntegrationTestRunnerSuiteRegistry.js";
import { resolveUiIntegrationTransformerSuite } from "./uiIntegrationTestTransformerSuiteRegistry.js";
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
  /** Optional fetch for real-server preflight (Node TLS / test doubles). Defaults to global fetch. */
  fetchImpl?: typeof fetch;
  /**
   * Build IntegrationTestSession options for transformer suites.
   * Node: env-derived store backends. Browser: IndexedDB + bundled admin.
   */
  resolveTransformerSessionOptions: (
    profileName: string,
    runTargetMode: UiIntegrationTestRunTargetMode,
    miroirConfig: MiroirConfigClient,
  ) => TestSessionForIntegOptions | Promise<TestSessionForIntegOptions>;
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

export function resolveUiIntegrationTransformerApplicationIdentity(
  runTargetMode: UiIntegrationTestRunTargetMode,
) {
  return runTargetMode === "ephemeral"
    ? generateEphemeralIntegrationTestApplicationIdentity()
    : PINNED_INTEG_TEST_APPLICATION_IDENTITY;
}

export function readUiIntegrationSuiteTestResults(
  tracker: IntegActivityTrackerBundle["miroirActivityTracker"],
  testSuitePathKey: string,
): TestSuiteResult {
  return tracker.getTestAssertionsResults([{ testSuite: testSuitePathKey }]);
}

function collectLeafTestResults(suiteResult: TestSuiteResult): Array<{ testResult: string }> {
  const leaves: Array<{ testResult: string }> = [];
  if (suiteResult.testsResults) {
    leaves.push(...Object.values(suiteResult.testsResults));
  }
  if (suiteResult.testsSuiteResults) {
    for (const nested of Object.values(suiteResult.testsSuiteResults)) {
      leaves.push(...collectLeafTestResults(nested));
    }
  }
  return leaves;
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
  // Nested transformer suites store leaves under testsSuiteResults, not only
  // top-level testsResults (runner_library is flat; miroirCoreTransformers is nested).
  const leafResults = collectLeafTestResults(suiteResult);
  if (leafResults.length === 0) {
    return false;
  }
  return leafResults.every((entry) => entry.testResult === "ok");
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

async function assertRealServerReachableIfNeeded(
  request: UiIntegrationTestRunRequest,
  environment: UiIntegrationTestLauncherEnvironment,
  miroirConfig: MiroirConfigClient,
): Promise<void> {
  const catalogEntry = getIntegrationTestProfileCatalogEntry(request.profileName);
  if (catalogEntry?.uiTransport !== "realServer") {
    return;
  }
  const rootApiUrl =
    !miroirConfig.client.emulateServer
      ? miroirConfig.client.serverConfig?.rootApiUrl
      : undefined;
  if (!rootApiUrl) {
    throw new Error(
      `Profile "${request.profileName}" is realServer but miroirConfig.client.serverConfig.rootApiUrl is missing`,
    );
  }
  await assertMiroirServerReachable(rootApiUrl, {
    fetchImpl: environment.fetchImpl,
  });
}

async function runRunnerIntegrationSuite(
  request: UiIntegrationTestRunRequest,
  environment: UiIntegrationTestLauncherEnvironment,
  runnerEntry: UiIntegrationRunnerSuiteEntry,
  runTarget: RunnerTestRunTarget,
  hostMode: NonNullable<UiIntegrationTestRunRequest["hostMode"]>,
): Promise<UiIntegrationTestRunResult> {
  const { miroirConfig, logConfig } = await environment.loadConfigForProfile(request.profileName);
  await assertRealServerReachableIfNeeded(request, environment, miroirConfig);

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

async function runTransformerIntegrationSuite(
  request: UiIntegrationTestRunRequest,
  environment: UiIntegrationTestLauncherEnvironment,
  hostMode: NonNullable<UiIntegrationTestRunRequest["hostMode"]>,
): Promise<UiIntegrationTestRunResult> {
  // Ensures the suite key is registered (throws with a clear message if not).
  resolveUiIntegrationTransformerSuite(request.suiteKey);

  const { miroirConfig, logConfig } = await environment.loadConfigForProfile(request.profileName);
  await assertRealServerReachableIfNeeded(request, environment, miroirConfig);

  const sessionOptions = await environment.resolveTransformerSessionOptions(
    request.profileName,
    request.runTargetMode,
    miroirConfig,
  );
  const applicationIdentity =
    sessionOptions.applicationIdentity ??
    resolveUiIntegrationTransformerApplicationIdentity(request.runTargetMode);
  const runTarget = transformerIdentityToRunTarget(applicationIdentity);

  const trackerBundle = await environment.createActivityTracker(logConfig);
  const orchestrator = environment.createOrchestrator();
  const testSession = orchestrator.createSession(
    "transformer",
    {
      miroirConfig,
      miroirActivityTracker: trackerBundle.miroirActivityTracker,
      miroirEventService: trackerBundle.miroirEventService,
      hostMode,
    },
    {
      ...sessionOptions,
      applicationIdentity,
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
    sessionKind: "transformer",
    runTarget,
    runTargetMode: request.runTargetMode,
    profileName: request.profileName,
    hostMode,
    success,
    inspector: buildInspectorSnapshot(request, "transformer", runTarget),
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

  const hostMode = request.hostMode ?? "isolated";
  const coordinator = environment.getCoordinator?.() ?? getIntegTestRunCoordinator();

  if (sessionKind === "transformer") {
    return coordinator.runExclusive(() =>
      runTransformerIntegrationSuite(request, environment, hostMode),
    );
  }

  if (sessionKind !== "runner") {
    throw new Error(
      `UI integration launcher does not support session kind "${sessionKind}" yet`,
    );
  }

  const runnerEntry = resolveUiIntegrationRunnerSuite(request.suiteKey);
  const runTarget = resolveUiIntegrationTestRunTarget(
    request.runTargetMode,
    request.suiteDefinition,
  );

  return coordinator.runExclusive(() =>
    runRunnerIntegrationSuite(request, environment, runnerEntry, runTarget, hostMode),
  );
}
