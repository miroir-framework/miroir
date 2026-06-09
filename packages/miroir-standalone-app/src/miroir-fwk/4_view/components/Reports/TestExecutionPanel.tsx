import React from "react";
import type { ViewParams } from "miroir-core";

import { UnitTestExecutionSummary } from "./UnitTestExecutionSummary.js";
import { TestResultsGrid } from "./TestResultsGrid.js";
import type { TestResultDataAndSelect, TestSelectionState } from "./testSelectionUtils.js";

export interface TestExecutionPanelProps {
  testLabel: string;
  testResultsData: TestResultDataAndSelect[];
  gridType: ViewParams["gridType"];
  enableSelection?: boolean;
  testSelectionsState?: TestSelectionState;
  setTestSelectionsState?: React.Dispatch<React.SetStateAction<TestSelectionState | undefined>>;
  onResetSelections?: () => void;
  linkResultsToEditor?: boolean;
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
}) => {
  if (!testResultsData.length) {
    return null;
  }

  return (
    <div style={{ margin: "20px 0", width: "100%" }}>
      <UnitTestExecutionSummary testResultsData={testResultsData} testLabel={testLabel} />
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
    </div>
  );
};
