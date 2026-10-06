import { useMemo, useState } from "react";
import {
  buildUiIntegrationSuiteRegistriesFromMiroirTests,
  classifyMiroirTestSuiteExecutionCapabilities,
  isUiIntegrationLaunchableSuite,
  MiroirLoggerFactory,
  type LoggerInterface,
  type MiroirTestDefinition,
  type MiroirTestRunFilter,
  type ViewParams,
} from "miroir-core";

import { packageName } from "../../../../constants.js";
import {
  miroirTestDefinitionHasReactComponentTest,
  miroirTestDefinitionHasStepKind,
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
import { ThemedEditableInput, ThemedLabel } from "../Themes/index.js";
import { ComponentTestRunSettings, useComponentTestRunPreparation } from "./ComponentTestRunSettings.js";
import { ComponentTestSandboxProvider, useComponentTestSandbox } from "./ComponentTestSandbox.js";
import { TestExecutionPanel } from "./TestExecutionPanel.js";
import { UiIntegrationTestRunControls } from "./UiIntegrationTestRunControls.js";
import { UiIntegrationTestRunInspectorSummary } from "./UiIntegrationTestRunInspectorSummary.js";
import { buildTestFilter, type TestResultDataAndSelect, type TestSelectionState } from "./testSelectionUtils.js";

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "MiroirTestDisplay");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName,
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
  /** Filter used while no result is selected in the results grid (e.g. one sub-suite). */
  testFilter?: MiroirTestRunFilter;
}

/**
 * #303 D8: the "Render iterations" field value as the run's `iterationsOverride`. Empty: undefined
 * (the instance's `iterations`). Any other value is passed as a number; the `measureRendering`
 * step rejects one that is not a positive integer.
 */
export function parseIterationsOverride(fieldValue: string): number | undefined {
  const trimmed = fieldValue.trim();
  return trimmed === "" ? undefined : Number(trimmed);
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

/**
 * One MiroirTest suite with its Run buttons and results. It mounts a component test sandbox
 * (#286), used by the unit run when the suite holds `reactComponentTest` leaves, and by the
 * integration run when it holds `reportTest` leaves (#330).
 */
export const MiroirTestDisplay = (props: MiroirTestSectionProps) => (
  <ComponentTestSandboxProvider>
    <MiroirTestDisplayContent {...props} />
  </ComponentTestSandboxProvider>
);

const MiroirTestDisplayContent = (props: MiroirTestSectionProps) => {
  const { miroirTest: instance, testLabel, style, useSnackBar = true, onTestComplete } = props;
  const componentTestSandbox = useComponentTestSandbox();
  // the sandbox's run start and end, the start taking the settings next to the Run button
  const componentTestRun = useComponentTestRunPreparation();
  const [miroirTestResultsData, setMiroirTestResultsData] = useState<TestResultDataAndSelect[]>([]);
  const [testSelectionState, setTestSelectionsState] = useState<TestSelectionState | undefined>(
    undefined,
  );
  // #303 D8: iterations override of the `measureRendering` steps, for the next unit run only.
  const [iterationsFieldValue, setIterationsFieldValue] = useState("");

  const executionCapabilities = useMemo(
    () => classifyMiroirTestSuiteExecutionCapabilities(instance.definition),
    [instance.definition],
  );
  const hasMeasureRenderingStep = useMemo(
    () => miroirTestDefinitionHasStepKind(instance.definition, "measureRendering"),
    [instance.definition],
  );
  const hasReactComponentTest = useMemo(
    () => miroirTestDefinitionHasReactComponentTest(instance.definition),
    [instance.definition],
  );
  const uiExecutionMode = resolveMiroirTestSuiteUiExecutionMode(instance.definition);
  const badgeColors = uiExecutionModeBadgeColors(uiExecutionMode);
  const { runner: runnerRegistry, transformer: transformerRegistry } = useMemo(
    () => buildUiIntegrationSuiteRegistriesFromMiroirTests([instance]),
    [instance],
  );
  const integrationSuiteKey = useMemo(
    () => resolveUiIntegrationRunnerSuiteKey(instance, runnerRegistry, transformerRegistry),
    [instance, runnerRegistry, transformerRegistry],
  );
  const integrationUiSupported = isUiIntegrationLaunchableSuite(instance.definition);

  const integrationPreferences = useUiIntegrationTestRunPreferences();
  const integrationProfileBrowserLaunchable = isUiIntegrationProfileLaunchableInBrowser(
    integrationPreferences.profileName,
  );

  const currentTestFilter = useMemo(() => {
    return buildTestFilter(testSelectionState, miroirTestResultsData) ?? props.testFilter;
  }, [testSelectionState, miroirTestResultsData, props.testFilter]);

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
        <div
          data-testid="unit-run-controls"
          style={{ display: "inline-flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}
        >
          <RunMiroirTestSuiteButton
            miroirTestSuite={instance}
            testSuiteKey={testLabel}
            useSnackBar={useSnackBar}
            testFilter={currentTestFilter}
            onTestComplete={handleTestComplete}
            runMode="unit"
            beforeRun={componentTestRun.prepareComponentTests}
            afterRun={componentTestRun.finishComponentTests}
            iterationsOverride={
              hasMeasureRenderingStep ? parseIterationsOverride(iterationsFieldValue) : undefined
            }
            label={`Run ${testLabel} Unit Tests`}
            style={runButtonStyle}
          />
          {componentTestSandbox && hasReactComponentTest && <ComponentTestRunSettings />}
          {hasMeasureRenderingStep && (
            <>
              <ThemedLabel>Iterations</ThemedLabel>
              <ThemedEditableInput
                type="number"
                aria-label="Render iterations"
                title="Iterations of every measureRendering step for the next run (empty: the instance's value)"
                value={iterationsFieldValue}
                onChange={(event) => setIterationsFieldValue(event.target.value)}
                dynamicWidth={false}
                minWidth={80}
              />
            </>
          )}
        </div>
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
            prepareReportTests={componentTestRun.prepareReportTests}
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
