import React, { useCallback } from "react";
import {
  type TransformerTest,
  type TransformerTestSuite,
  type ViewParams,
} from "miroir-core";

import { TestResultsGrid } from "./TestResultsGrid.js";
import {
  defaultResetTestSelections,
  type TestResultDataAndSelect,
  type TestSelectionState,
} from "./testSelectionUtils.js";

export type { TestResultDataAndSelect, TestSelectionState } from "./testSelectionUtils.js";

export interface TransformerTestResultsProps {
  transformerTestSuite: TransformerTestSuite | TransformerTest | undefined;
  transformerTestResultsData: TestResultDataAndSelect[];
  testLabel?: string;
  gridType: ViewParams["gridType"];
  testSelectionsState: TestSelectionState | undefined;
  setTestSelectionsState: React.Dispatch<React.SetStateAction<TestSelectionState | undefined>>;
}

const resolveTestPath = (
  transformerTestSuite: TransformerTestSuite | TransformerTest | undefined,
  transformerTestPath: string[],
): TransformerTestSuite | TransformerTest | undefined => {
  if (transformerTestPath.length === 0 || !transformerTestSuite) {
    return undefined;
  }
  if (transformerTestPath.length === 1) {
    if (transformerTestSuite.transformerTestLabel === transformerTestPath[0]) {
      return transformerTestSuite;
    }
  }
  const [currentSegment, nextSegment, ...restPath] = transformerTestPath;
  if (
    transformerTestSuite.transformerTestType === "transformerTestSuite" &&
    transformerTestSuite.transformerTestLabel &&
    transformerTestSuite.transformerTestLabel === currentSegment
  ) {
    const nextTest = Object.values(transformerTestSuite.transformerTests).find(
      (test: TransformerTest | TransformerTestSuite) =>
        test.transformerTestLabel === nextSegment,
    );
    if (nextTest && restPath.length > 0) {
      return resolveTestPath(nextTest, restPath);
    }
    return nextTest;
  }
  return undefined;
};

export function createTransformerResetSelections(
  transformerTestSuite: TransformerTestSuite | TransformerTest | undefined,
  testResults: TestResultDataAndSelect[],
): TestSelectionState {
  return defaultResetTestSelections(testResults, (test) => {
    const currentTest = resolveTestPath(transformerTestSuite, test.testPath) as
      | TransformerTest
      | TransformerTestSuite
      | undefined;
    return !currentTest?.skip;
  });
}

/** @deprecated Prefer TestExecutionPanel + TestResultsGrid — kept for direct imports */
export const TransformerTestResults: React.FC<TransformerTestResultsProps> = ({
  transformerTestSuite,
  transformerTestResultsData,
  testLabel = "Test Results",
  testSelectionsState,
  setTestSelectionsState,
  gridType,
}) => {
  const onResetSelections = useCallback(() => {
    setTestSelectionsState(
      createTransformerResetSelections(transformerTestSuite, transformerTestResultsData),
    );
  }, [transformerTestSuite, transformerTestResultsData, setTestSelectionsState]);

  return (
    <TestResultsGrid
      testResultsData={transformerTestResultsData}
      testLabel={testLabel}
      gridType={gridType}
      enableSelection={true}
      testSelectionsState={testSelectionsState}
      setTestSelectionsState={setTestSelectionsState}
      onResetSelections={onResetSelections}
      linkResultsToEditor={true}
    />
  );
};
