import { useMemo, useState } from "react";
import {
  classifyMiroirTestSuiteExecutionCapabilities,
  MiroirLoggerFactory,
  type LoggerInterface,
  type MiroirTestDefinition,
  type ViewParams,
} from "miroir-core";

import { packageName } from "../../../../constants.js";
import {
  isUiIntegrationRunnerSuiteSupportedForInstance,
  resolveUiIntegrationRunnerSuiteKey,
  resolveMiroirTestSuiteUiExecutionMode,
  uiExecutionModeBadgeColors,
} from "../../../4-tests/miroirTestSuiteUiExecution.js";
import { isUiIntegrationProfileLaunchableInBrowser } from "../../../4-tests/integrationTestProfileCatalog.js";
import { useUiIntegrationTestRunPreferences } from "../../../4-tests/useUiIntegrationTestRunPreferences.js";
import { cleanLevel } from "../../constants.js";
import {
  RunMiroirTestSuiteButton,
  type MiroirTestResultData,
} from "../Buttons/RunMiroirTestSuiteButton.js";
import { TestExecutionPanel } from "./TestExecutionPanel.js";
import { UiIntegrationTestRunControls } from "./UiIntegrationTestRunControls.js";
import { UiIntegrationTestRunInspectorSummary } from "./UiIntegrationTestRunInspectorSummary.js";
import { buildTestFilter, type TestResultDataAndSelect, type TestSelectionState } from "./testSelectionUtils.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "MiroirTestDisplay"),
  "UI",
).then((logger: LoggerInterface) => {
  log = logger;
});

export interface MiroirTestSectionProps {
  miroirTest: MiroirTestDefinition;
  testLabel: string;
  style?: React.CSSProperties;
  gridType: ViewParams["gridType"];
  useSnackBar?: boolean;
  onTestComplete?: (testSuiteKey: string, structuredResults: TestResultDataAndSelect[]) => void;
}

const runButtonStyle: React.CSSProperties = {
  backgroundColor: "#4527a0",
  color: "white",
  border: "none",
  borderRadius: "6px",
  padding: "8px 16px",
  fontWeight: "bold",
  marginRight: "8px",
};

export const MiroirTestDisplay = (props: MiroirTestSectionProps) => {
  const { miroirTest: instance, testLabel, style, useSnackBar = true, onTestComplete } = props;
  const [miroirTestResultsData, setMiroirTestResultsData] = useState<TestResultDataAndSelect[]>([]);
  const [testSelectionState, setTestSelectionsState] = useState<TestSelectionState | undefined>(
    undefined,
  );

  const executionCapabilities = useMemo(
    () => classifyMiroirTestSuiteExecutionCapabilities(instance.definition),
    [instance.definition],
  );
  const uiExecutionMode = resolveMiroirTestSuiteUiExecutionMode(instance.definition);
  const badgeColors = uiExecutionModeBadgeColors(uiExecutionMode);
  const integrationSuiteKey = useMemo(
    () => resolveUiIntegrationRunnerSuiteKey(instance),
    [instance],
  );
  const integrationUiSupported = isUiIntegrationRunnerSuiteSupportedForInstance(instance);

  const integrationPreferences = useUiIntegrationTestRunPreferences();
  const integrationProfileBrowserLaunchable = isUiIntegrationProfileLaunchableInBrowser(
    integrationPreferences.profileName,
  );

  const currentTestFilter = useMemo(() => {
    return buildTestFilter(testSelectionState, miroirTestResultsData);
  }, [testSelectionState, miroirTestResultsData]);

  const handleTestComplete = (testSuiteKey: string, structuredResults: MiroirTestResultData[]) => {
    const withSelection: TestResultDataAndSelect[] = structuredResults.map((result) => ({
      ...result,
      selected: false,
    }));
    setMiroirTestResultsData(withSelection);
    log.info(`MiroirTest completed for ${testSuiteKey}:`, withSelection);
    if (onTestComplete) {
      onTestComplete(testSuiteKey, withSelection);
    }
  };

  const defaultStyle: React.CSSProperties = {
    marginBottom: "16px",
    padding: "12px",
    backgroundColor: "#ede7f6",
    borderRadius: "8px",
    border: "1px solid #b39ddb",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    width: "100%",
    boxSizing: "border-box",
    ...style,
  };

  return (
    <div style={defaultStyle}>
      <div
        style={{
          marginBottom: "8px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontWeight: "bold", color: "#4527a0" }}>Miroir Test Available</span>
        <span
          style={{
            fontSize: "12px",
            fontWeight: "bold",
            textTransform: "uppercase",
            padding: "2px 8px",
            borderRadius: "999px",
            ...badgeColors,
          }}
        >
          {uiExecutionMode}
        </span>
      </div>

      {executionCapabilities.hasUnitLeaves && (
        <RunMiroirTestSuiteButton
          miroirTestSuite={instance}
          testSuiteKey={testLabel}
          useSnackBar={useSnackBar}
          testFilter={currentTestFilter}
          onTestComplete={handleTestComplete}
          runMode="unit"
          label={`Run ${testLabel} Unit Tests`}
          style={runButtonStyle}
        />
      )}

      {executionCapabilities.hasIntegrationLeaves && (
        <>
          <UiIntegrationTestRunControls />
          <RunMiroirTestSuiteButton
            miroirTestSuite={instance}
            testSuiteKey={integrationSuiteKey ?? testLabel}
            useSnackBar={useSnackBar}
            testFilter={currentTestFilter}
            onTestComplete={handleTestComplete}
            runMode="integration"
            integrationProfileName={integrationPreferences.profileName}
            integrationRunTargetMode={integrationPreferences.runTargetMode}
            label={`Run ${testLabel} Integration Tests`}
            disabled={!integrationUiSupported || !integrationProfileBrowserLaunchable}
            title={
              !integrationUiSupported
                ? `UI integration launcher does not support this suite (registry key: ${integrationSuiteKey ?? "unknown"})`
                : !integrationProfileBrowserLaunchable
                  ? "Selected profile is not launchable in the browser — use emulatedServer-indexedDb or realServer-sql (with miroir-server up)"
                  : undefined
            }
            style={{
              ...runButtonStyle,
              backgroundColor:
                integrationUiSupported && integrationProfileBrowserLaunchable
                  ? "#ef6c00"
                  : "#9e9e9e",
            }}
          />
        </>
      )}

      <UiIntegrationTestRunInspectorSummary />

      <TestExecutionPanel
        testLabel={testLabel}
        testResultsData={miroirTestResultsData}
        gridType={props.gridType}
        enableSelection={true}
        testSelectionsState={testSelectionState}
        setTestSelectionsState={setTestSelectionsState}
        linkResultsToEditor={true}
      />
    </div>
  );
};
