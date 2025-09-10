
import {
  MiroirLoggerFactory,
  TestFramework,
  defaultLibraryModelEnvironment,
  runTransformerTestInMemory,
  runTransformerTestSuite,
  type LoggerInterface,
  type TestSuiteResult,
  type TransformerReturnType,
  type TransformerTestDefinition
} from "miroir-core";


import { packageName } from "../../../../constants.js";
import { ActionButton } from "../../components/Page/ActionButton.js";
import { cleanLevel } from "../../constants.js";
import { useMiroirContextService, useSnackbar } from "../../MiroirContextReactProvider.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "RunTransformerTestSuiteButton"),
).then((logger: LoggerInterface) => {log = logger});

// // Simple test function to match vitest interface
// const test = (title: string, testFn: () => void | Promise<void>, timeout?: number): void | Promise<void> => {
//   return testFn();
// };


// ################################################################################################
// ################################################################################################
// ################################################################################################
export function generateTestReport(
  testSuiteKey: string,
  allResults: TestSuiteResult,
  setResolveConditionalSchemaResults: React.Dispatch<React.SetStateAction<string>>
) {
  let resultText = `=== ${testSuiteKey} Test Results ===\n\n`;
  
  interface StructuredTestResult {
    testName: string;
    testResult: "ok" | "error";
    status: "✅ Pass" | "❌ Fail";
    failedAssertions?: string[];
    assertionCount: number;
    assertions: string; // Summary text for assertions
    fullAssertionsResults?: any; // Include full assertion results for detailed hover/diff view
  }
  
  const structuredResults: StructuredTestResult[] = [];
  
  // Statistics
  let totalTestSuites = 0;
  let totalTests = 0;
  let passedTestSuites = 0;
  let passedTests = 0;
  
  // Collect all test information for processing (similar to transformerTestsDisplayResults)
  const collectTestInfo = (
    results: TestSuiteResult,
    pathPrefix: string[] = []
  ): Array<{
    type: 'suite' | 'test';
    path: string;
    status: 'ok' | 'error';
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
        
        // Determine suite status (ok if all tests in suite pass)
        const hasFailedTests = suiteResult.testsResults && 
          Object.values(suiteResult.testsResults).some(test => test.testResult !== "ok");
        const suiteStatus = hasFailedTests ? "error" : "ok";
        
        if (suiteStatus === "ok") {
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
        const testStatus = testResult.testResult === "ok" ? "ok" : "error";
        
        if (testStatus === "ok") {
          passedTests++;
        }
        
        // Count assertions for this test
        const assertions = Object.entries(testResult.testAssertionsResults);
        const failedAssertions = assertions
          .filter(([_, assertion]) => assertion.assertionResult !== "ok")
          .map(([name, _]) => name);
        
        testInfo.push({
          type: 'test',
          path: testPath,
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
  const allTestInfo = collectTestInfo(allResults);
  
  // Generate text results focusing on tests (not detailed assertions)
  for (const test of allTestInfo) {
    if (test.type === 'test') {
      const symbol = test.status === "ok" ? "✅" : "❌";
      const statusText = test.status === "ok" ? "Pass" : "Fail";
      
      resultText += `${symbol} ${test.path} - ${statusText}\n`;
      
      // Create structured data
      structuredResults.push({
        testName: test.path,
        testResult: test.status,
        status: test.status === "ok" ? "✅ Pass" : "❌ Fail",
        failedAssertions: test.failedAssertions,
        assertionCount: test.assertionCount || 0,
        assertions: test.failedAssertions && test.failedAssertions.length > 0 
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
    resultText += `Test Suites: ${passedTestSuites}/${totalTestSuites} passed (${suitePassRate}%)\n`;
  }
  
  if (totalTests > 0) {
    const testPassRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : "0.0";
    resultText += `Tests: ${passedTests}/${totalTests} passed (${testPassRate}%)\n`;
  }
  
  const overallStatus = (passedTests === totalTests) ? "PASSED" : "FAILED";
  resultText += `\nOverall Status: ${overallStatus}\n`;
  
  setResolveConditionalSchemaResults(resultText);
  return structuredResults;
};

// ################################################################################################
interface RunTransformerTestSuiteButtonProps {
  transformerTestSuite: TransformerReturnType<any> | undefined;
  testSuiteKey: string;
  useSnackBar: boolean;
  onTestComplete?: (testSuiteKey: string, structuredResults: any[]) => void;
  label?: string;
  [key: string]: any; // for passing extra props to ActionButton
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
  label,
  ...buttonProps
}) => {
  const { handleAsyncAction } = useSnackbar();
  const miroirContextService = useMiroirContextService();

  const onAction = async () => {
    // Reset previous results
    miroirContextService.miroirContext.miroirEventTracker.resetResults();

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
      undefined, // filter
      // {testList: {"resolveConditionalSchema": ["error if no value found at given parentUuid path"]}}, // filter
      runTransformerTestInMemory,
      // {
      //   miroirFundamentalJzodSchema: miroirFundamentalJzodSchema as JzodSchema,
      //   miroirMetaModel: defaultMiroirMetaModel
      //   // TODO: current app schema
      // },
      // defaultMiroirModelEnvironment,
      defaultLibraryModelEnvironment,
      miroirContextService.miroirContext.miroirEventTracker // Pass the unified tracker
    );

    // Get all results using the new format
    const allResults = miroirContextService.miroirContext.miroirEventTracker.getTestAssertionsResults([]);
    log.info("All test results:", allResults);

    // Format results for display using the new structure
    const structuredResults = generateTestReport(
      testSuiteKey,
      allResults,
      () => {} // Placeholder setter function
    );

    // Call the callback if provided
    if (onTestComplete) {
      onTestComplete(testSuiteKey, structuredResults);
    }
  };

  return (
    <ActionButton
      onAction={onAction}
      successMessage={`${testSuiteKey} tests completed successfully`}
      label={label || `Run ${testSuiteKey} Tests`}
      handleAsyncAction={useSnackBar?handleAsyncAction: undefined}
      actionName={`run ${testSuiteKey} tests`}
      {...buttonProps}
    />
  );
};
