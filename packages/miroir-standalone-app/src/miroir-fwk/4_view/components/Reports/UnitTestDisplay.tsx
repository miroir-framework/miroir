import { useMemo, useState } from "react";
import {
  MiroirLoggerFactory,
  type LoggerInterface,
  type UnitTestDefinition,
  type ViewParams,
} from "miroir-core";

import { packageName } from "../../../../constants.js";
import { cleanLevel } from "../../constants.js";
import { RunUnitTestSuiteButton, type UnitTestResultData } from "../Buttons/RunUnitTestSuiteButton.js";
import { TestExecutionPanel } from "./TestExecutionPanel.js";
import { buildTestFilter, type TestResultDataAndSelect, type TestSelectionState } from "./testSelectionUtils.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "UnitTestDisplay"),
  "UI",
).then((logger: LoggerInterface) => {
  log = logger;
});

export interface UnitTestSectionProps {
  unitTest: UnitTestDefinition;
  testLabel: string;
  style?: React.CSSProperties;
  gridType: ViewParams["gridType"];
  useSnackBar?: boolean;
  onTestComplete?: (testSuiteKey: string, structuredResults: TestResultDataAndSelect[]) => void;
}

export const UnitTestDisplay = (props: UnitTestSectionProps) => {
  const { unitTest: instance, testLabel, style, useSnackBar = true, onTestComplete } = props;
  const [unitTestResultsData, setUnitTestResultsData] = useState<TestResultDataAndSelect[]>([]);
  const [testSelectionState, setTestSelectionsState] = useState<TestSelectionState | undefined>(
    undefined,
  );

  const currentTestFilter = useMemo(() => {
    return buildTestFilter(testSelectionState, unitTestResultsData);
  }, [testSelectionState, unitTestResultsData]);

  const handleTestComplete = (testSuiteKey: string, structuredResults: UnitTestResultData[]) => {
    const withSelection: TestResultDataAndSelect[] = structuredResults.map((result) => ({
      ...result,
      selected: false,
    }));
    setUnitTestResultsData(withSelection);
    log.info(`Unit test completed for ${testSuiteKey}:`, withSelection);
    if (onTestComplete) {
      onTestComplete(testSuiteKey, withSelection);
    }
  };

  const defaultStyle: React.CSSProperties = {
    marginBottom: "16px",
    padding: "12px",
    backgroundColor: "#e8f5e9",
    borderRadius: "8px",
    border: "1px solid #a5d6a7",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    width: "100%",
    boxSizing: "border-box",
    ...style,
  };

  return (
    <div style={defaultStyle}>
      <div style={{ marginBottom: "8px", fontWeight: "bold", color: "#2e7d32" }}>
        Unit Test Available
      </div>

      <RunUnitTestSuiteButton
        unitTestSuite={instance}
        testSuiteKey={testLabel}
        useSnackBar={useSnackBar}
        testFilter={currentTestFilter}
        onTestComplete={handleTestComplete}
        label={`Run All ${testLabel} Unit Tests`}
        style={{
          backgroundColor: "#2e7d32",
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
        testResultsData={unitTestResultsData}
        gridType={props.gridType}
        enableSelection={true}
        testSelectionsState={testSelectionState}
        setTestSelectionsState={setTestSelectionsState}
        linkResultsToEditor={true}
      />
    </div>
  );
};
