/**
 * #487: the batches of MiroirTests that Run all and the self-test run, outside any React component.
 * Results are kept per suite as `TestResultData[]`, the shape the result display reads.
 */
import {
  buildUiIntegrationSuiteRegistriesFromMiroirTests,
  defaultMetaModelEnvironment,
  MiroirLoggerFactory,
  runMiroirTests,
  TestFramework,
  type LoggerInterface,
  type MiroirActivityTrackerInterface,
  type MiroirTestDefinition,
  type Runner,
} from "miroir-core";

import { packageName } from "../../constants.js";
import {
  countTestResults,
  generateTestReport,
  type TestResultData,
} from "../4_view/components/Buttons/testResultReport.js";
import { getMiroirTestSuiteKey, sortMiroirTestInstances } from "../4_view/components/Reports/miroirTestSuiteKey.js";
import { cleanLevel } from "../4_view/constants.js";
import {
  DEFAULT_UI_INTEGRATION_PROFILE_NAME,
  DEFAULT_UI_INTEGRATION_RUN_TARGET_MODE,
} from "./integrationTestProfileAssets.js";
import { getIntegTestRunCoordinator, IntegTestRunCoordinator } from "./integTestRunCoordinator.js";
import {
  classifyMiroirTestListExecutionCapabilities,
  resolveUiIntegrationRunnerSuiteKey,
} from "./miroirTestSuiteUiExecution.js";
import type { UiIntegrationTestLauncherEnvironment } from "./uiIntegrationTestLauncher.js";
import type { UiIntegrationTestRunRequest, UiIntegrationTestRunTargetMode } from "./uiIntegrationTestLauncherTypes.js";
import { setLastUiIntegrationTestRunResult } from "./uiIntegrationTestRunState.js";

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "miroirTestBatch");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName, "UI").then((logger: LoggerInterface) => {
  log = logger;
});

export type MiroirTestSuiteResultsMap = Record<string, TestResultData[]>;

/** The result row of an integration run that failed before or outside its test leaves. */
function failedRunResult(
  suiteKey: string,
  reason = "the integration run failed: see the Integration Test Inspector and the console",
): TestResultData {
  return {
    testName: suiteKey,
    testPath: [suiteKey],
    testResult: "error",
    status: "error",
    failedAssertions: [reason],
    assertionCount: 0,
    assertions: "",
    fullAssertionsResults: undefined,
  };
}

/** An error's message; an action error (an object) as JSON, so the report says what failed. */
function describeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "object" && error !== null) {
    return JSON.stringify(error).slice(0, 2000);
  }
  return String(error);
}

/** A suite a batch did not run, and why. */
export type SkippedMiroirTestSuite = { suiteKey: string; reason: string };

export const REPORT_TESTS_NEED_THE_SANDBOX = "reportTest suites need the component test sandbox";

/**
 * Runs `miroirTests` in unit mode, one suite after the other, in suite order. `reportTest` leaves
 * are recorded as skipped. With `includeComponentTests` false, so are `reactComponentTest` leaves;
 * with it true, the leaves of `runOnDemand` suites are (#303), and the caller prepares the component
 * test sandbox.
 */
export async function runUnitMiroirTestBatch(params: {
  miroirTests: MiroirTestDefinition[];
  tracker: MiroirActivityTrackerInterface;
  includeComponentTests: boolean;
  onSuiteDone?: (suiteKey: string, results: TestResultData[]) => void;
}): Promise<MiroirTestSuiteResultsMap> {
  const resultsBySuiteKey: MiroirTestSuiteResultsMap = {};
  for (const instance of sortMiroirTestInstances(params.miroirTests)) {
    const suiteKey = getMiroirTestSuiteKey(instance);
    params.tracker.resetResults();

    await runMiroirTests._runMiroirTestSuite(
      TestFramework as any,
      [],
      instance.definition,
      undefined,
      defaultMetaModelEnvironment,
      params.tracker,
      undefined,
      true,
      runMiroirTests,
      // reportTest leaves run in integration mode only (#330): recorded as skipped here (#487).
      params.includeComponentTests
        ? { executionMode: "unit", skipRunOnDemandSuites: true, excludeMiroirTestTypes: ["reportTest"] }
        : { executionMode: "unit", excludeMiroirTestTypes: ["reactComponentTest", "reportTest"] },
    );

    resultsBySuiteKey[suiteKey] = generateTestReport(suiteKey, params.tracker.getTestAssertionsResults([]), () => {});
    log.info(`MiroirTest results for ${suiteKey}:`, resultsBySuiteKey[suiteKey]);
    params.onSuiteDone?.(suiteKey, resultsBySuiteKey[suiteKey]);
  }
  return resultsBySuiteKey;
}

// ################################################################################################
/** Nested launcher calls must not re-acquire the shared mutex while the list batch holds it. */
class BatchNestedCoordinator extends IntegTestRunCoordinator {
  override get isRunning(): boolean {
    return true;
  }

  override acquire(): void {}

  override release(): void {}

  override async runExclusive<T>(fn: () => Promise<T>): Promise<T> {
    return fn();
  }
}

// ################################################################################################
function selectLaunchableIntegrationInstances(
  miroirTests: MiroirTestDefinition[],
): MiroirTestDefinition[] {
  const { runner, transformer } = buildUiIntegrationSuiteRegistriesFromMiroirTests(miroirTests);
  const listCaps = classifyMiroirTestListExecutionCapabilities(
    miroirTests,
    runner,
    transformer,
  );
  const launchableKeySet = new Set(listCaps.launchableIntegrationSuiteKeys);

  if (listCaps.integrationSuiteKeys.length > listCaps.launchableIntegrationSuiteKeys.length) {
    const skipped = listCaps.integrationSuiteKeys.filter((key) => !launchableKeySet.has(key));
    log.info(
      `Skipping ${skipped.length} non-launchable integration suite(s): ${skipped.join(", ")}`,
    );
  }

  return sortMiroirTestInstances(miroirTests).filter((instance) => {
    const registryKey = resolveUiIntegrationRunnerSuiteKey(instance, runner, transformer);
    return registryKey !== undefined && launchableKeySet.has(registryKey);
  });
}

// ################################################################################################
/**
 * Runs the launchable integration suites of `miroirTests`, one after the other, as Run all
 * integration does (default profile `emulatedServer-indexedDb`, run target `ephemeral`, isolated
 * host). Without `prepareReportTests`, suites of `reportTest` leaves are not run but listed in
 * `skipped` (#487: the self-test page has no component test sandbox).
 */
export async function runIntegrationMiroirTestBatch(params: {
  miroirTests: MiroirTestDefinition[];
  integrationProfileName?: string;
  integrationRunTargetMode?: UiIntegrationTestRunTargetMode;
  runnerUuidIndex?: Record<string, Runner>;
  prepareReportTests?: UiIntegrationTestRunRequest["prepareReportTests"];
  miroirReports?: UiIntegrationTestRunRequest["miroirReports"];
  onSuiteDone?: (suiteKey: string, results: TestResultData[]) => void;
}): Promise<{ resultsBySuiteKey: MiroirTestSuiteResultsMap; failures: string[]; skipped: SkippedMiroirTestSuite[] }> {
  const sortedLaunchable = selectLaunchableIntegrationInstances(params.miroirTests);
  if (sortedLaunchable.length === 0) {
    throw new Error("No UI-launchable integration suites in this MiroirTest list");
  }
  const { runner, transformer } = buildUiIntegrationSuiteRegistriesFromMiroirTests(
    params.miroirTests,
  );
  const toRun: { instance: MiroirTestDefinition; registryKey: string; identityKey: string }[] = [];
  const skipped: SkippedMiroirTestSuite[] = [];
  for (const instance of sortedLaunchable) {
    const registryKey = resolveUiIntegrationRunnerSuiteKey(instance, runner, transformer);
    if (!registryKey) {
      continue;
    }
    const identityKey = getMiroirTestSuiteKey(instance);
    if (!params.prepareReportTests && runner[registryKey]?.kind === "reportTest") {
      skipped.push({ suiteKey: identityKey, reason: REPORT_TESTS_NEED_THE_SANDBOX });
      continue;
    }
    toRun.push({ instance, registryKey, identityKey });
  }

  const resultsBySuiteKey: MiroirTestSuiteResultsMap = {};
  const failures: string[] = [];
  if (toRun.length === 0) {
    return { resultsBySuiteKey, failures, skipped };
  }

  const [
    { runUiIntegrationTestSuite },
    { loadBrowserUiIntegrationTestLauncherEnvironment },
  ] = await Promise.all([
    import("./uiIntegrationTestLauncher.js"),
    import("./loadBrowserUiIntegrationTestLauncherEnvironment.js"),
  ]);

  const baseEnv = await loadBrowserUiIntegrationTestLauncherEnvironment();
  const nestedCoordinator = new BatchNestedCoordinator();

  await getIntegTestRunCoordinator().runExclusive(async () => {
    const batchEnv: UiIntegrationTestLauncherEnvironment = {
      ...baseEnv,
      getCoordinator: () => nestedCoordinator,
    };

    for (const { instance, registryKey, identityKey } of toRun) {
      let result: Awaited<ReturnType<typeof runUiIntegrationTestSuite>>;
      try {
        result = await runUiIntegrationTestSuite(
          {
            suiteKey: registryKey,
            suiteDefinition: instance.definition,
            profileName: params.integrationProfileName ?? DEFAULT_UI_INTEGRATION_PROFILE_NAME,
            runTargetMode: params.integrationRunTargetMode ?? DEFAULT_UI_INTEGRATION_RUN_TARGET_MODE,
            hostMode: "isolated",
            runnerUuidIndex: params.runnerUuidIndex,
            prepareReportTests: params.prepareReportTests,
            miroirReports: params.miroirReports,
          },
          batchEnv,
        );
      } catch (error) {
        // #487: one suite that cannot run fails that suite, not the batch.
        log.error(`integration suite ${registryKey} could not run`, error);
        failures.push(registryKey);
        resultsBySuiteKey[identityKey] = [
          failedRunResult(identityKey, describeError(error)),
        ];
        params.onSuiteDone?.(identityKey, resultsBySuiteKey[identityKey]);
        continue;
      }

      setLastUiIntegrationTestRunResult(result);
      resultsBySuiteKey[identityKey] = result.testSuiteResults
        ? generateTestReport(identityKey, result.testSuiteResults, () => {})
        : [];

      if (!result.success) {
        failures.push(registryKey);
        if (countTestResults(resultsBySuiteKey[identityKey]).failed === 0) {
          // #487: a run that failed outside its leaves still counts as a failed test.
          resultsBySuiteKey[identityKey].push(failedRunResult(identityKey));
        }
      }
      params.onSuiteDone?.(identityKey, resultsBySuiteKey[identityKey]);
    }
  });

  return { resultsBySuiteKey, failures, skipped };
}
