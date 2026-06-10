import { useMemo, useState } from "react";
import {
  MiroirLoggerFactory,
  type LoggerInterface,
  type MiroirTestDefinition,
  type ViewParams,
} from "miroir-core";

import { packageName } from "../../../../constants.js";
import { cleanLevel } from "../../constants.js";
import {
  RunMiroirTestSuiteButton,
  type MiroirTestResultData,
} from "../Buttons/RunMiroirTestSuiteButton.js";
import { TestExecutionPanel } from "./TestExecutionPanel.js";
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

export const MiroirTestDisplay = (props: MiroirTestSectionProps) => {
  const { miroirTest: instance, testLabel, style, useSnackBar = true, onTestComplete } = props;
  const [miroirTestResultsData, setMiroirTestResultsData] = useState<TestResultDataAndSelect[]>([]);
  const [testSelectionState, setTestSelectionsState] = useState<TestSelectionState | undefined>(
    undefined,
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
      <div style={{ marginBottom: "8px", fontWeight: "bold", color: "#4527a0" }}>
        Miroir Test Available
      </div>

      <RunMiroirTestSuiteButton
        miroirTestSuite={instance}
        testSuiteKey={testLabel}
        useSnackBar={useSnackBar}
        testFilter={currentTestFilter}
        onTestComplete={handleTestComplete}
        label={`Run All ${testLabel} Miroir Tests`}
        style={{
          backgroundColor: "#4527a0",
          color: "white",
          border: "none",
          borderRadius: "6px",
          padding: "8px 16px",
          fontWeight: "bold",
          marginRight: "8px",
        }}
      />

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
