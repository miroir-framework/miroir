import { useState, useMemo } from 'react';
import {
  LoggerInterface,
  MiroirLoggerFactory,
  type TestSuiteListFilter,
  safeResolvePathOnObject,
  alterObjectAtPathWithCreate,
  type TransformerTestDefinition,
  type TransformerTestSuite,
  type TransformerReturnType,
  type ViewParams
} from "miroir-core";

import { packageName } from '../../../../constants.js';
import { cleanLevel } from '../../constants.js';
import { RunTransformerTestSuiteButton } from '../Buttons/RunTransformerTestSuiteButton.js';
import { TransformerTestResultExecutionSummary } from './TransformerTestResultExecutionSummary.js';
import { TransformerTestResults, type TestResultDataAndSelect } from './TransformerTestResults.js';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "TransformerTestDisplay"), "UI",
).then((logger: LoggerInterface) => {log = logger});

// Test Selection Types
export type TestSelectionState = {
  [testPath: string]: boolean; // Full test path -> selected state
};

export interface TransformerTestSectionProps {
  /** The transformer test suite instance */
  // transformerTest: TransformerReturnType<TransformerTestDefinition> | undefined;
  transformerTest: TransformerTestDefinition;
  /** Label for the test suite (used in buttons and displays) */
  testLabel: string;
  /** Optional custom styling for the container */
  style?: React.CSSProperties;
  gridType: ViewParams["gridType"];
  /** Whether to use snackbar for notifications */
  useSnackBar?: boolean;
  /** Optional callback when tests complete */
  onTestComplete?: (testSuiteKey: string, structuredResults: TestResultDataAndSelect[]) => void;
}

/**
 * Build test filter from test selection state
 * @param testSelectionsState 
 * @param transformerTestResultsData 
 * @returns undefined if no selection happened (run all tests that are non-skipped), or { testList: { suiteName: [testName, ...], ... } }
 */
const handleBuildTestFilter = (
  testSelectionsState: TestSelectionState | undefined,
  transformerTestResultsData: TestResultDataAndSelect[]
): { testList?: TestSuiteListFilter } | undefined => {
  // Get the list of selected test data (not just test names)
  if (!testSelectionsState) {
    return undefined;
  }

  const selectedTestData = transformerTestResultsData.filter(
    (test) => testSelectionsState[test.testName] === true
  );

  if (selectedTestData.length === 0) {
    return { testList: {} }; 
  }

  // Build simple hierarchical filter: suite name -> array of test names
  const testList: { [key: string]: string[] } = {};

  selectedTestData.forEach((resultTestData) => {
    if (resultTestData.testPath) {
      const testSuitePath = resultTestData.testPath.slice(0, -1); // All but last element is the suite path
      const testName = resultTestData.testPath[resultTestData.testPath.length - 1]; // Last element is the actual test name (not the display name)

      const currentTestList = safeResolvePathOnObject(testList, testSuitePath);
      if (!currentTestList) {
        alterObjectAtPathWithCreate(testList, testSuitePath, [ testName ]);
      } else {
        if (!currentTestList.includes(testName)) {
          currentTestList.push(testName);
        }
      }
    }
  });

  const filterResult = { testList: testList as TestSuiteListFilter };

  log.info(
    "handleBuildTestFilter: testSelectionsState=",
    testSelectionsState,
    ", selectedTestData=",
    selectedTestData.map((t) => ({ name: t.testName, path: t.testPath })),
    "filterResult=",
    filterResult
  );

  return filterResult;
};

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
/**
 * Reusable component for transformer test execution and results display
 */
export const TransformerTestDisplay = (props: TransformerTestSectionProps) => {
  const { transformerTest: instance, testLabel, style, useSnackBar = true, onTestComplete } = props;

  const [transformerTestResultsData, setTransformerTestResultsData] = useState<
    TestResultDataAndSelect[]
  >([]);
  const [testSelectionState, setTestSelectionsState] = useState<TestSelectionState | undefined>(undefined);

  const currentTestFilter = useMemo(() => {
    return handleBuildTestFilter(testSelectionState, transformerTestResultsData);
  }, [testSelectionState, transformerTestResultsData]);

  log.info("TransformerTestDisplay: currentTestFilter:", currentTestFilter, "testSelectionState:", testSelectionState, "transformerTestResultsData:", transformerTestResultsData);

  const handleTestComplete = (testSuiteKey: string, structuredResults: TestResultDataAndSelect[]) => {
    setTransformerTestResultsData(structuredResults);
    log.info(`Test completed for ${testSuiteKey}:`, structuredResults);
    
    // Call optional external callback
    if (onTestComplete) {
      onTestComplete(testSuiteKey, structuredResults);
    }
  };

  const defaultStyle: React.CSSProperties = {
    marginBottom: "16px",
    padding: "12px",
    backgroundColor: "#e8f4fd",
    borderRadius: "8px",
    border: "1px solid #b3d9ff",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    width: "100%",
    boxSizing: "border-box",
    ...style
  };

  return (
    <div style={defaultStyle}>
      <div style={{ marginBottom: "8px", fontWeight: "bold", color: "#1976d2" }}>
        🧪 Transformer Test Available
      </div>

      <RunTransformerTestSuiteButton
        transformerTestSuite={instance}
        testSuiteKey={testLabel}
        useSnackBar={useSnackBar}
        testFilter={currentTestFilter}
        onTestComplete={handleTestComplete}
        label={`▶️ Run All ${testLabel} Tests`}
        style={{
          backgroundColor: "#1976d2",
          color: "white",
          border: "none",
          borderRadius: "6px",
          padding: "8px 16px",
          fontWeight: "bold",
          marginRight: "8px",
        }}
      />

      {/* Test Results Display */}
      {transformerTestResultsData && transformerTestResultsData.length > 0 && (
        <div style={{ margin: "20px 0", width: "100%" }}>
          {/* Test Execution Summary */}
          <TransformerTestResultExecutionSummary
            resolveConditionalSchemaResultsData={transformerTestResultsData}
            testLabel={testLabel}
          />

          {instance ? (
            <TransformerTestResults
              transformerTestSuite={instance.definition}
              transformerTestResultsData={transformerTestResultsData}
              testLabel={testLabel}
              testSelectionsState={testSelectionState}
              setTestSelectionsState={setTestSelectionsState}
              gridType={props.gridType}
            />
          ) : (
            <span>No test results to display</span>
          )}
        </div>
      )}
    </div>
  );
};