import React from "react";

import {
  ACTION_OK,
  MiroirLoggerFactory,
  TestFramework,
  classifyMiroirTestSuiteExecutionCapabilities,
  defaultMetaModelEnvironment,
  isUiIntegrationLaunchableSuite,
  runMiroirTests,
  snapshotTestRunLogs,
  type Action2VoidReturnType,
  type LoggerInterface,
  type MiroirTestDefinition,
  type TestRunLogSnapshot,
  type TestSuiteListFilter,
} from "miroir-core";

import { useMiroirContextService, useSnackbar } from "miroir-react";
import { useSelectedApplicationRunnerUuidIndex } from "../../../4-tests/useSelectedApplicationMiroirTestSuiteRegistries.js";
import { packageName } from "../../../../constants.js";
import {
  DEFAULT_UI_INTEGRATION_PROFILE_NAME,
  DEFAULT_UI_INTEGRATION_RUN_TARGET_MODE,
} from "../../../4-tests/integrationTestProfileAssets.js";
import type {
  UiIntegrationTestRunRequest,
  UiIntegrationTestRunTargetMode,
} from "../../../4-tests/uiIntegrationTestLauncherTypes.js";
import { readAppMiroirReports } from "../../../4-tests/appMiroirReports.js";
import { setLastUiIntegrationTestRunResult } from "../../../4-tests/uiIntegrationTestRunState.js";
import { miroirTestDefinitionHasReactComponentTest } from "../../../4-tests/miroirTestSuiteUiExecution.js";
import { useIntegTestRunCoordinator } from "../../../4-tests/useIntegTestRunCoordinator.js";
import { ActionButtonWithSnackbar } from "../../components/Page/ActionButtonWithSnackbar.js";
import { cleanLevel } from "../../constants.js";
import { generateTestReport, type TestResultData } from "./testResultReport.js";

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "RunMiroirTestSuiteButton");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName,
  "UI",
).then((logger: LoggerInterface) => {
  log = logger;
});

export type MiroirTestResultData = TestResultData;

export type RunMiroirTestSuiteRunMode = "unit" | "integration";

interface RunMiroirTestSuiteButtonProps {
  miroirTestSuite: MiroirTestDefinition | undefined;
  testSuiteKey: string;
  useSnackBar: boolean;
  /** `runLogs` (#490): the activities and events of the run, for "Export failed test logs". */
  onTestComplete?: (
    testSuiteKey: string,
    structuredResults: MiroirTestResultData[],
    runLogs?: TestRunLogSnapshot,
  ) => void;
  testFilter?: { testList?: TestSuiteListFilter; match?: RegExp } | undefined;
  label?: string;
  /** D6 — explicit unit vs integration path; required when suite is mixed. */
  runMode?: RunMiroirTestSuiteRunMode;
  /** B6 — integration profile + run target (defaults from uiIntegrationTestRunPreferences). */
  integrationProfileName?: string;
  integrationRunTargetMode?: UiIntegrationTestRunTargetMode;
  /**
   * #286: awaited before a unit run of a suite that holds a `reactComponentTest` leaf (prepares
   * the component test sandbox and registers the component test runner). Receives
   * `iterationsOverride` when set (#303 T7).
   */
  beforeRun?: (options?: { iterationsOverride?: number }) => Promise<void>;
  /**
   * #303 T7: replaces the `iterations` of every `measureRendering` step for this run (passed to
   * `beforeRun`). Undefined: the instance's values.
   */
  iterationsOverride?: number;
  /**
   * #286: called when a run prepared by `beforeRun` ends, success or error (ends the component
   * test run: releases the suite wrappers and the run lock).
   */
  afterRun?: () => void;
  /** #330: mounts the Reports of an integration run of a suite with `reportTest` leaves. */
  prepareReportTests?: UiIntegrationTestRunRequest["prepareReportTests"];
  [key: string]: unknown;
}

function resolveRunMode(
  suiteDefinition: MiroirTestDefinition["definition"],
  runMode: RunMiroirTestSuiteRunMode | undefined,
): RunMiroirTestSuiteRunMode {
  if (!suiteDefinition || suiteDefinition.miroirTestType !== "miroirTestSuite") {
    throw new Error("RunMiroirTestSuiteButton requires a MiroirTest suite definition");
  }
  if (runMode) {
    return runMode;
  }
  const capabilities = classifyMiroirTestSuiteExecutionCapabilities(suiteDefinition);
  if (capabilities.uiExecutionMode === "mixed") {
    throw new Error(
      "Mixed MiroirTest suites require an explicit runMode ('unit' or 'integration') on RunMiroirTestSuiteButton",
    );
  }
  if (capabilities.uiExecutionMode === "integration") {
    return "integration";
  }
  return "unit";
}

export const RunMiroirTestSuiteButton: React.FC<RunMiroirTestSuiteButtonProps> = ({
  miroirTestSuite,
  testSuiteKey,
  useSnackBar,
  onTestComplete,
  testFilter,
  label,
  runMode,
  integrationProfileName,
  integrationRunTargetMode,
  beforeRun,
  afterRun,
  prepareReportTests,
  iterationsOverride,
  ...buttonProps
}) => {
  const { handleAsyncAction } = useSnackbar();
  const miroirContextService = useMiroirContextService();
  const { isRunning: integRunInProgress } = useIntegTestRunCoordinator();
  const runnerUuidIndex = useSelectedApplicationRunnerUuidIndex();

  const resolvedRunMode = miroirTestSuite
    ? resolveRunMode(miroirTestSuite.definition, runMode)
    : "unit";

  const integrationSupported =
    resolvedRunMode !== "integration" ||
    (miroirTestSuite?.definition !== undefined &&
      isUiIntegrationLaunchableSuite(miroirTestSuite.definition));

  const onUnitAction = async (): Promise<Action2VoidReturnType> => {
    if (!miroirTestSuite) {
      throw new Error(`No MiroirTest suite found for ${testSuiteKey}`);
    }

    const componentTestsPrepared =
      beforeRun !== undefined && miroirTestDefinitionHasReactComponentTest(miroirTestSuite.definition);
    if (componentTestsPrepared) {
      await beforeRun(iterationsOverride !== undefined ? { iterationsOverride } : undefined);
    }

    const runStartedAt = Date.now();
    try {
      miroirContextService.miroirContext.miroirActivityTracker.resetResults();

      await runMiroirTests._runMiroirTestSuite(
        TestFramework as any,
        [],
        miroirTestSuite.definition,
        testFilter,
        defaultMetaModelEnvironment,
        miroirContextService.miroirContext.miroirActivityTracker,
        undefined,
        true,
        runMiroirTests,
        { executionMode: "unit" },
      );
    } finally {
      if (componentTestsPrepared) {
        afterRun?.();
      }
    }

    const allResults =
      miroirContextService.miroirContext.miroirActivityTracker.getTestAssertionsResults([]);
    log.info("MiroirTest results:", allResults);

    const structuredResults: MiroirTestResultData[] = generateTestReport(
      testSuiteKey,
      allResults,
      () => {},
    );

    if (onTestComplete) {
      const runLogs = snapshotTestRunLogs({
        activities: miroirContextService.miroirContext.miroirActivityTracker.getAllActivities(),
        events: miroirContextService.miroirContext.miroirEventService.getAllEvents(),
        since: runStartedAt,
      });
      onTestComplete(testSuiteKey, structuredResults, runLogs);
    }
    return ACTION_OK;
  };

  const onIntegrationAction = async (): Promise<Action2VoidReturnType> => {
    if (!miroirTestSuite) {
      throw new Error(`No MiroirTest suite found for ${testSuiteKey}`);
    }
    if (!isUiIntegrationLaunchableSuite(miroirTestSuite.definition)) {
      throw new Error(`UI integration launcher does not support suite "${testSuiteKey}" yet`);
    }

    const [{ runUiIntegrationTestSuite }, { loadBrowserUiIntegrationTestLauncherEnvironment }] =
      await Promise.all([
        import("../../../4-tests/uiIntegrationTestLauncher.js"),
        import("../../../4-tests/loadBrowserUiIntegrationTestLauncherEnvironment.js"),
      ]);

    const result = await runUiIntegrationTestSuite(
      {
        suiteKey: testSuiteKey,
        suiteDefinition: miroirTestSuite.definition,
        profileName: integrationProfileName ?? DEFAULT_UI_INTEGRATION_PROFILE_NAME,
        runTargetMode: integrationRunTargetMode ?? DEFAULT_UI_INTEGRATION_RUN_TARGET_MODE,
        hostMode: "isolated",
        filter: testFilter,
        runnerUuidIndex,
        prepareReportTests,
        miroirReports: () =>
          readAppMiroirReports(
            miroirContextService.domainController,
            miroirContextService.applicationDeploymentMap,
          ),
      },
      await loadBrowserUiIntegrationTestLauncherEnvironment(),
    );

    setLastUiIntegrationTestRunResult(result);

    const structuredResults: MiroirTestResultData[] = result.testSuiteResults
      ? generateTestReport(testSuiteKey, result.testSuiteResults, () => {})
      : [];

    if (onTestComplete) {
      onTestComplete(testSuiteKey, structuredResults, result.runLogs);
    }

    if (!result.success) {
      throw new Error(`${testSuiteKey} integration tests failed — see Integration Test Inspector`);
    }

    return ACTION_OK;
  };

  const onAction = resolvedRunMode === "integration" ? onIntegrationAction : onUnitAction;

  const defaultLabel =
    resolvedRunMode === "integration"
      ? `Run ${testSuiteKey} Integration Tests`
      : `Run ${testSuiteKey} Unit Tests`;

  const successMessage =
    resolvedRunMode === "integration"
      ? `${testSuiteKey} integration tests passed — see Integration Test Inspector below`
      : `${testSuiteKey} Miroir tests completed successfully`;

  const actionName =
    resolvedRunMode === "integration"
      ? `run ${testSuiteKey} integration tests`
      : `run ${testSuiteKey} miroir tests`;

  const disabled =
    Boolean(buttonProps.disabled) ||
    (resolvedRunMode === "integration" &&
      (!integrationSupported || integRunInProgress));

  const title =
    resolvedRunMode === "integration" && integRunInProgress
      ? "An integration test run is already in progress"
      : resolvedRunMode === "integration" && !integrationSupported
        ? `UI integration launcher does not support "${testSuiteKey}" yet`
        : undefined;

  return (
    <ActionButtonWithSnackbar
      onAction={onAction}
      successMessage={successMessage}
      label={label || defaultLabel}
      handleAsyncAction={useSnackBar ? handleAsyncAction : undefined}
      actionName={actionName}
      {...buttonProps}
      disabled={disabled}
      title={title}
    />
  );
};
