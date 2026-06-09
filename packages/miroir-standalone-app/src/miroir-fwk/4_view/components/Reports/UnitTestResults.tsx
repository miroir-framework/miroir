import React from "react";

import type { UnitTestResultData } from "../Buttons/RunUnitTestSuiteButton.js";
import { TestResultsGrid } from "./TestResultsGrid.js";
import type { TestResultDataAndSelect } from "./testSelectionUtils.js";

export type UnitTestResultDataAndSelect = UnitTestResultData & {
  selected: boolean;
};

export type { TestResultDataAndSelect } from "./testSelectionUtils.js";

export interface UnitTestResultsProps {
  unitTestResultsData: UnitTestResultDataAndSelect[];
  testLabel?: string;
  gridType?: import("miroir-core").ViewParams["gridType"];
}

/** @deprecated Prefer TestExecutionPanel — kept for backward compatibility */
export const UnitTestResults: React.FC<UnitTestResultsProps> = ({
  unitTestResultsData,
  testLabel = "UnitTest",
  gridType = "agGrid",
}) => {
  if (!unitTestResultsData.length) {
    return null;
  }

  return (
    <TestResultsGrid
      testResultsData={unitTestResultsData}
      testLabel={`${testLabel} results`}
      gridType={gridType}
      enableSelection={false}
      linkResultsToEditor={true}
    />
  );
};
