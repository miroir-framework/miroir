import React from "react";

import {
  ACTION_OK,
  MiroirLoggerFactory,
  TestFramework,
  classifyMiroirTestSuiteExecutionCapabilities,
  defaultMetaModelEnvironment,
  runMiroirTests,
  type Action2VoidReturnType,
  type LoggerInterface,
  type MiroirTestDefinition,
  type TestSuiteListFilter,
} from "miroir-core";

import { useMiroirContextService, useSnackbar } from "miroir-react";
import { packageName } from "../../../../constants.js";
import {
  DEFAULT_UI_INTEGRATION_PROFILE_NAME,
  DEFAULT_UI_INTEGRATION_RUN_TARGET_MODE,
} from "../../../4-tests/integrationTestProfileAssets.js";
import { isUiIntegrationRunnerSuiteSupported } from "../../../4-tests/miroirTestSuiteUiExecution.js";
import { setLastUiIntegrationTestRunResult } from "../../../4-tests/uiIntegrationTestRunState.js";
import { useIntegTestRunCoordinator } from "../../../4-tests/useIntegTestRunCoordinator.js";
import { ActionButtonWithSnackbar } from "../../components/Page/ActionButtonWithSnackbar.js";
import { cleanLevel } from "../../constants.js";
import { generateTestReport, type TestResultData } from "./testResultReport.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "RunMiroirTestSuiteButton"),
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
  onTestComplete?: (testSuiteKey: string, structuredResults: MiroirTestResultData[]) => void;
  testFilter?: { testList?: TestSuiteListFilter; match?: RegExp } | undefined;
  label?: string;
  /** D6 — explicit unit vs integration path; required when suite is mixed. */
  runMode?: RunMiroirTestSuiteRunMode;
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
  ...buttonProps
}) => {
  const { handleAsyncAction } = useSnackbar();
  const miroirContextService = useMiroirContextService();
  const { isRunning: integRunInProgress } = useIntegTestRunCoordinator();

  const resolvedRunMode = miroirTestSuite
    ? resolveRunMode(miroirTestSuite.definition, runMode)
    : "unit";

  const integrationSupported =
    resolvedRunMode !== "integration" || isUiIntegrationRunnerSuiteSupported(testSuiteKey);

  const onUnitAction = async (): Promise<Action2VoidReturnType> => {
    miroirContextService.miroirContext.miroirActivityTracker.resetResults();

    if (!miroirTestSuite) {
      throw new Error(`No MiroirTest suite found for ${testSuiteKey}`);
    }

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

    const allResults =
      miroirContextService.miroirContext.miroirActivityTracker.getTestAssertionsResults([]);
    log.info("MiroirTest results:", allResults);

    const structuredResults: MiroirTestResultData[] = generateTestReport(
      testSuiteKey,
      allResults,
      () => {},
    );

    if (onTestComplete) {
      onTestComplete(testSuiteKey, structuredResults);
    }
    return ACTION_OK;
  };

  const onIntegrationAction = async (): Promise<Action2VoidReturnType> => {
    if (!miroirTestSuite) {
      throw new Error(`No MiroirTest suite found for ${testSuiteKey}`);
    }
    if (!isUiIntegrationRunnerSuiteSupported(testSuiteKey)) {
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
        profileName: DEFAULT_UI_INTEGRATION_PROFILE_NAME,
        runTargetMode: DEFAULT_UI_INTEGRATION_RUN_TARGET_MODE,
        hostMode: "isolated",
        filter: testFilter,
      },
      await loadBrowserUiIntegrationTestLauncherEnvironment(),
    );

    setLastUiIntegrationTestRunResult(result);

    const structuredResults: MiroirTestResultData[] = result.testSuiteResults
      ? generateTestReport(testSuiteKey, result.testSuiteResults, () => {})
      : [];

    if (onTestComplete) {
      onTestComplete(testSuiteKey, structuredResults);
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
