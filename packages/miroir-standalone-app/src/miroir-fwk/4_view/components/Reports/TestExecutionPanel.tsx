import React from "react";
import type { TestRunLogSnapshot, ViewParams } from "@miroir-framework/core";

import { ExportFailedTestLogsButton } from "@miroir-framework/react";
import { UnitTestExecutionSummary } from "@miroir-framework/react";
import { TestResultsGrid } from "./TestResultsGrid.js";
import { RenderMeasurementsPanel } from "@miroir-framework/react";
import type { TestResultDataAndSelect, TestSelectionState } from "@miroir-framework/react";

export interface TestExecutionPanelProps {
  testLabel: string;
  testResultsData: TestResultDataAndSelect[];
  gridType: ViewParams["gridType"];
  enableSelection?: boolean;
  testSelectionsState?: TestSelectionState;
  setTestSelectionsState?: React.Dispatch<React.SetStateAction<TestSelectionState | undefined>>;
  onResetSelections?: () => void;
  linkResultsToEditor?: boolean;
  /** #490: activities and events of the last run, exported with the failed tests. */
  runLogs?: TestRunLogSnapshot;
  runMode?: string;
}

export const TestExecutionPanel: React.FC<TestExecutionPanelProps> = ({
  testLabel,
  testResultsData,
  gridType,
  enableSelection = false,
  testSelectionsState,
  setTestSelectionsState,
  onResetSelections,
  linkResultsToEditor = true,
  runLogs,
  runMode,
}) => {
  if (!testResultsData.length) {
    return null;
  }

  return (
    <div style={{ margin: "20px 0", width: "100%" }}>
      <UnitTestExecutionSummary testResultsData={testResultsData} testLabel={testLabel} />
      <div style={{ display: "flex", justifyContent: "flex-end", margin: "-10px 0 10px 0" }}>
        <ExportFailedTestLogsButton
          testLabel={testLabel}
          testResultsData={testResultsData}
          runLogs={runLogs}
          runMode={runMode}
        />
      </div>
      <TestResultsGrid
        testResultsData={testResultsData}
        testLabel={testLabel}
        gridType={gridType}
        enableSelection={enableSelection}
        testSelectionsState={testSelectionsState}
        setTestSelectionsState={setTestSelectionsState}
        onResetSelections={onResetSelections}
        linkResultsToEditor={linkResultsToEditor}
      />
      {/* #303 D10: leaves with a `measureRendering` step. */}
      <RenderMeasurementsPanel testResultsData={testResultsData} />
    </div>
  );
};
