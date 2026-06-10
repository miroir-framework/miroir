import {
  alterObjectAtPathWithCreate,
  safeResolvePathOnObject,
  type TestSuiteListFilter,
} from "miroir-core";

import type { TestResultData } from "../Buttons/testResultReport.js";

export type TestSelectionState = {
  [testPath: string]: boolean;
};

export type TestResultDataAndSelect = TestResultData & {
  selected: boolean;
};

export type TestSelectionSummary = {
  totalTests: number;
  selectedTests: number;
  allSelected: boolean;
  noneSelected: boolean;
  partiallySelected: boolean;
};

export function buildTestFilter(
  testSelectionsState: TestSelectionState | undefined,
  testResultsData: TestResultDataAndSelect[],
): { testList?: TestSuiteListFilter } | undefined {
  if (!testSelectionsState) {
    return undefined;
  }

  const selectedTestData = testResultsData.filter(
    (test) => testSelectionsState[test.testName] === true,
  );

  if (selectedTestData.length === 0) {
    return { testList: {} };
  }

  const testList: { [key: string]: string[] } = {};

  selectedTestData.forEach((resultTestData) => {
    if (resultTestData.testPath) {
      const testSuitePath = resultTestData.testPath.slice(0, -1);
      const testName = resultTestData.testPath[resultTestData.testPath.length - 1];
      const currentTestList = safeResolvePathOnObject(testList, testSuitePath);
      if (!currentTestList) {
        alterObjectAtPathWithCreate(testList, testSuitePath, [testName]);
      } else if (!currentTestList.includes(testName)) {
        currentTestList.push(testName);
      }
    }
  });

  return { testList: testList as TestSuiteListFilter };
}

export function getTestSelectionSummary(
  testSelectionsState: TestSelectionState | undefined,
  testPaths: string[],
): TestSelectionSummary {
  const selectedPaths = testPaths.filter(
    (path) => !testSelectionsState || testSelectionsState[path] !== false,
  );

  return {
    totalTests: testPaths.length,
    selectedTests: selectedPaths.length,
    allSelected: testPaths.length > 0 && selectedPaths.length === testPaths.length,
    noneSelected: selectedPaths.length === 0,
    partiallySelected:
      selectedPaths.length > 0 && selectedPaths.length < testPaths.length,
  };
}

export function defaultResetTestSelections(
  testResults: TestResultDataAndSelect[],
  isSelected: (test: TestResultDataAndSelect) => boolean,
): TestSelectionState {
  const newSelections: TestSelectionState = {};
  testResults.forEach((test) => {
    newSelections[test.testName] = isSelected(test);
  });
  return newSelections;
}
