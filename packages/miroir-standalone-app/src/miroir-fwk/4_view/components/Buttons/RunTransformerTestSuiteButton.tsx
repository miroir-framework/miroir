
import {
  ACTION_OK,
  MiroirLoggerFactory,
  TestFramework,
  defaultMiroirModelEnvironment,
  runTransformerTestSuite,
  runUnitTransformerTests,
  type Action2VoidReturnType,
  type LoggerInterface,
  type TestSuiteListFilter,
  type TestSuiteResult,
  type TransformerReturnType,
  type TransformerTestDefinition
} from "miroir-core";


import { useMiroirContextService, useSnackbar } from "miroir-react";
import { packageName } from "../../../../constants.js";
import { ActionButtonWithSnackbar } from "../../components/Page/ActionButtonWithSnackbar.js";
import { cleanLevel } from "../../constants.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "RunTransformerTestSuiteButton"), "UI",
).then((logger: LoggerInterface) => {log = logger});

// // Simple test function to match vitest interface
// const test = (title: string, testFn: () => void | Promise<void>, timeout?: number): void | Promise<void> => {
//   return testFn();
// };


// ################################################################################################
// ################################################################################################
// ################################################################################################
export interface TransformerTestResultData {
  testName: string;
  testPath: string[];
  testResult: "ok" | "error" | "skipped";
  status: string;
  failedAssertions: string[] | undefined;
  assertionCount: number;
  assertions: string;
  fullAssertionsResults: any;
}

// ################################################################################################
export function generateTestReport(
  testSuiteKey: string,
  allResults: TestSuiteResult,
  setResolveConditionalSchemaResults: React.Dispatch<React.SetStateAction<string>>
) {
  const transfomerTestResults: TransformerTestResultData[] = [];
  let resultText = `=== ${testSuiteKey} Test Results ===\n\n`;
  
  
  // Statistics
  let totalTestSuites = 0;
  let totalTests = 0;
  let passedTestSuites = 0;
  let passedTests = 0;
  let skippedTests = 0;
  
  // Collect all test information for processing (similar to transformerTestsDisplayResults)
  const collectTestInfo = (
    results: TestSuiteResult,
    pathPrefix: string[] = []
  ): Array<{
    type: 'suite' | 'test';
    path: string;
    testPath: string[]; // Full path as array
    status: 'ok' | 'error' | 'skipped';
    failedAssertions?: string[];
    assertionCount?: number;
    fullAssertionsResults?: any; // Include full assertion results
  }> => {
    const testInfo: Array<any> = [];
    
    // Count and collect test suites
    if (results.testsSuiteResults) {
      for (const [suiteName, suiteResult] of Object.entries(results.testsSuiteResults)) {
        const currentPath = [...pathPrefix, suiteName];
        totalTestSuites++;
        
        // Determine suite status (ok if all tests in suite pass, skipped if all are skipped)
        const testResults = suiteResult.testsResults ? Object.values(suiteResult.testsResults) : [];
        const hasFailedTests = testResults.some(test => test.testResult === "error");
        const hasPassedTests = testResults.some(test => test.testResult === "ok");
        const allSkipped = testResults.length > 0 && testResults.every(test => test.testResult === "skipped");
        
        let suiteStatus: 'ok' | 'error' | 'skipped';
        if (hasFailedTests) {
          suiteStatus = "error";
        } else if (allSkipped) {
          suiteStatus = "skipped";
        } else {
          suiteStatus = "ok";
          passedTestSuites++;
        }
        
        // Recursively collect from child suites
        testInfo.push(...collectTestInfo(suiteResult, currentPath));
      }
    }

    // Count and collect individual tests
    if (results.testsResults) {
      for (const [testName, testResult] of Object.entries(results.testsResults)) {
        totalTests++;
        
        const testPath = [...pathPrefix, testName].join(" > ");
        const testPathArray = [...pathPrefix, testName];
        
        // Properly handle skipped, ok, and error status
        let testStatus: 'ok' | 'error' | 'skipped';
        if (testResult.testResult === "skipped") {
          testStatus = "skipped";
          skippedTests++;
        } else if (testResult.testResult === "ok") {
          testStatus = "ok";
          passedTests++;
        } else {
          testStatus = "error";
        }
        
        // Count assertions for this test
        const assertions = Object.entries(testResult.testAssertionsResults);
        const failedAssertions = assertions
          .filter(([_, assertion]) => assertion.assertionResult === "error")
          .map(([name, _]) => name);
        
        testInfo.push({
          type: 'test',
          path: testPath,
          testPath: testPathArray,
          status: testStatus,
          failedAssertions: failedAssertions.length > 0 ? failedAssertions : undefined,
          assertionCount: assertions.length,
          fullAssertionsResults: testResult.testAssertionsResults // Include full assertion results for detailed view
        });
      }
    }
    
    return testInfo;
  };
  
  // Collect all test information
  const allTestInfo = collectTestInfo(allResults, [testSuiteKey]);
  
  // Generate text results focusing on tests (not detailed assertions)
  for (const test of allTestInfo) {
    if (test.type === 'test') {
      let symbol, statusText, statusDisplay;
      if (test.status === "skipped") {
        symbol = "⏭";
        statusText = "Skipped";
        statusDisplay = "⏭ Skipped";
      } else if (test.status === "ok") {
        symbol = "✅";
        statusText = "Pass";
        statusDisplay = "✅ Pass";
      } else {
        symbol = "❌";
        statusText = "Fail";
        statusDisplay = "❌ Fail";
      }
      
      resultText += `${symbol} ${test.path} - ${statusText}\n`;
      
      // Create structured data
      transfomerTestResults.push({
        testName: test.path,
        testPath: test.testPath,
        testResult: test.status,
        status: statusDisplay,
        failedAssertions: test.failedAssertions,
        assertionCount: test.assertionCount || 0,
        assertions: test.status === "skipped" 
          ? "Test skipped"
          : test.failedAssertions && test.failedAssertions.length > 0 
            ? `${test.failedAssertions.length} failed: ${test.failedAssertions.join(", ")}` 
            : `All ${test.assertionCount || 0} assertions passed`,
        fullAssertionsResults: test.fullAssertionsResults // Include full assertion results for hover/diff functionality
      });
      
      // Show failed assertions if any (but keep it brief)
      if (test.failedAssertions && test.failedAssertions.length > 0) {
        resultText += `    Failed assertions: ${test.failedAssertions.join(", ")}\n`;
      }
    }
  }
  
  // Add summary statistics
  resultText += "\n=== Test Summary ===\n";
  if (totalTestSuites > 0) {
    const suitePassRate = totalTestSuites > 0 ? ((passedTestSuites / totalTestSuites) * 100).toFixed(1) : "0.0";
    resultText += `Test Suites: ✓ Passed: ${passedTestSuites}/${totalTestSuites} (${suitePassRate}%)\n`;
  }
  
  if (totalTests > 0) {
    const testPassRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : "0.0";
    const failedTests = totalTests - passedTests - skippedTests;
    
    let testSummary = `Tests: ✓ Passed: ${passedTests}/${totalTests} (${testPassRate}%)`;
    
    if (failedTests > 0) {
      const failedRate = ((failedTests / totalTests) * 100).toFixed(1);
      testSummary += `, ✗ Failed: ${failedTests}/${totalTests} (${failedRate}%)`;
    }
    
    if (skippedTests > 0) {
      const skippedRate = ((skippedTests / totalTests) * 100).toFixed(1);
      testSummary += `, ⏭ Skipped: ${skippedTests}/${totalTests} (${skippedRate}%)`;
    }
    
    resultText += testSummary + "\n";
  }
  
  const overallStatus = (passedTests === totalTests) ? "PASSED" : "FAILED";
  resultText += `\nOverall Status: ${overallStatus}\n`;
  
  setResolveConditionalSchemaResults(resultText);
  return transfomerTestResults;
};

// ################################################################################################
interface RunTransformerTestSuiteButtonProps {
  transformerTestSuite: TransformerReturnType<TransformerTestDefinition> | undefined;
  testSuiteKey: string;
  useSnackBar: boolean;
  onTestComplete?: (testSuiteKey: string, structuredResults: any[]) => void;
  testFilter?: { testList?: TestSuiteListFilter, match?: RegExp } | undefined;
  label?: string;
  [key: string]: any; // for passing extra props to ActionButtonWithSnackbar
}

// ################################################################################################
/**
 * RunTransformerTestSuiteButton - Component for running transformer test suites
 */
export const RunTransformerTestSuiteButton: React.FC<RunTransformerTestSuiteButtonProps> = ({
  transformerTestSuite,
  testSuiteKey,
  useSnackBar,
  onTestComplete,
  testFilter,
  label,
  ...buttonProps
}) => {
  const { handleAsyncAction } = useSnackbar();
  const miroirContextService = useMiroirContextService();

  // const onAction = async (): Promise<Action2VoidReturnType> => {
  const onAction = async (): Promise<Action2VoidReturnType> => {
    // Reset previous results
    miroirContextService.miroirContext.miroirActivityTracker.resetResults();

    if (!transformerTestSuite) {
      throw new Error(`No transformer test suite found for ${testSuiteKey}`);
    }
    
    // Run the test suite
    // const testSuitePath = [testSuiteKey];
    await runTransformerTestSuite(
      // { expect, describe, test } as any, // vitest-like interface
      TestFramework as any, // vitest-like interface
      [], // testSuitePath,
      (transformerTestSuite as TransformerTestDefinition).definition,
      testFilter, // Use the provided filter
      // {testList: {"resolveConditionalSchema": ["error if no value found at given parentUuid path"]}}, // filter
      defaultMiroirModelEnvironment, // TODO: use correct environment!
      miroirContextService.miroirContext.miroirActivityTracker, // Pass the unified tracker
      undefined, // parentTrackingId
      true, // trackActionsBelow
      runUnitTransformerTests
    );

    // Get all results using the new format
    const allResults = miroirContextService.miroirContext.miroirActivityTracker.getTestAssertionsResults([]);
    log.info("All test results:", allResults);

    // Format results for display using the new structure
    const structuredResults: TransformerTestResultData[] = generateTestReport(
      testSuiteKey,
      allResults,
      () => {} // Placeholder setter function
    );

    // Call the callback if provided
    if (onTestComplete) {
      onTestComplete(testSuiteKey, structuredResults);
    }
    return ACTION_OK;
  };

  return (
    <ActionButtonWithSnackbar
      onAction={onAction}
      successMessage={`${testSuiteKey} tests completed successfully`}
      label={label || `Run ${testSuiteKey} Tests`}
      handleAsyncAction={useSnackBar?handleAsyncAction: undefined}
      actionName={`run ${testSuiteKey} tests`}
      {...buttonProps}
    />
  );
};
