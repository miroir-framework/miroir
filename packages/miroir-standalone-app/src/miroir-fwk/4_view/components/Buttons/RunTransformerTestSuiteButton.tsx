
import {
  MiroirLoggerFactory,
  TestSuiteContext,
  defaultMiroirMetaModel,
  miroirFundamentalJzodSchema,
  runTransformerTestInMemory,
  runTransformerTestSuite,
  type Domain2QueryReturnType,
  type JzodSchema,
  type LoggerInterface,
  type TestSuiteResult,
  type TransformerTestDefinition
} from "miroir-core";

import { describe, expect } from "miroir-core";

import { ActionButton } from "../../components/Page/ActionButton.js";
import { packageName } from "../../../../constants.js";
import { cleanLevel } from "../../constants.js";
import { useSnackbar, useMiroirContextService } from "../../MiroirContextReactProvider.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "RunTransformerTestSuiteButton"),
).then((logger: LoggerInterface) => {log = logger});


// ################################################################################################
// ################################################################################################
// ################################################################################################
// Local type definitions based on miroir-core types
interface TestAssertionResult {
  assertionName: string;
  assertionResult: "ok" | "error";
  assertionExpectedValue?: any;
  assertionActualValue?: any;
}

interface TestAssertionsResults {
  [assertionName: string]: TestAssertionResult;
}

export function generateTestReport(
  matchingKey: string | undefined,
  testSuiteResults: TestSuiteResult,
  setResolveConditionalSchemaResults: React.Dispatch<React.SetStateAction<string>>
) {
  let resultText = "=== resolveConditionalSchema Test Results ===\n\n";
  interface StructuredTestResult {
    testName: string;
    testResult: string;
    assertions: string;
    assertionCount: number;
    status: "✅ Pass" | "❌ Fail";
    fullAssertionsResults: TestAssertionsResults; // Add full assertion data
  }
  const structuredResults: StructuredTestResult[] = [];

  if (!matchingKey) {
    throw new Error();
  }
  if (testSuiteResults && testSuiteResults[matchingKey]) {
    const suiteResults = testSuiteResults[matchingKey];
    for (const [testName, testResult] of Object.entries(suiteResults)) {
      resultText += `Test: ${testResult.testLabel}\n`;
      resultText += `Result: ${testResult.testResult}\n`;

      // Create structured data for ValueObjectGrid
      const assertionsDetails = Object.entries(testResult.testAssertionsResults)
        .map(([assertionName, assertion]) => {
          let details = `${assertionName}: ${assertion.assertionResult}`;
          if (assertion.assertionResult !== "ok") {
            details += `\nExpected: ${JSON.stringify(assertion.assertionExpectedValue, null, 2)}`;
            details += `\nActual: ${JSON.stringify(assertion.assertionActualValue, null, 2)}`;
          }
          return details;
        })
        .join("\n");

      structuredResults.push({
        testName: testResult.testLabel || testName,
        testResult: testResult.testResult,
        assertions: assertionsDetails,
        assertionCount: Object.keys(testResult.testAssertionsResults).length,
        status: testResult.testResult === "ok" ? "✅ Pass" : "❌ Fail",
        fullAssertionsResults: testResult.testAssertionsResults, // Include full assertion data
      });

      for (const [assertionName, assertion] of Object.entries(testResult.testAssertionsResults)) {
        resultText += `  Assertion: ${assertionName} - ${assertion.assertionResult}\n`;
        if (assertion.assertionResult !== "ok") {
          resultText += `    Expected: ${JSON.stringify(
            assertion.assertionExpectedValue,
            null,
            2
          )}\n`;
          resultText += `    Actual: ${JSON.stringify(assertion.assertionActualValue, null, 2)}\n`;
        }
      }
      resultText += "\n";
    }
  } else {
    resultText += "No test results found or test suite not executed properly.\n";
  }
  setResolveConditionalSchemaResults(resultText);

  return structuredResults;
};

// ################################################################################################
interface RunTransformerTestSuiteButtonProps {
  transformerTestSuite: Domain2QueryReturnType<any> | undefined;
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
    TestSuiteContext.resetResults();

    if (!transformerTestSuite) {
      throw new Error(`No transformer test suite found for ${testSuiteKey}`);
    }
    
    // Run the test suite
    const testSuitePath = [testSuiteKey];
    await runTransformerTestSuite(
      { expect, describe }, // vitest-like interface
      testSuitePath,
      (transformerTestSuite as TransformerTestDefinition).definition,
      runTransformerTestInMemory,
      {
        miroirFundamentalJzodSchema: miroirFundamentalJzodSchema as JzodSchema,
        miroirMetaModel: defaultMiroirMetaModel
        // TODO: current app schema
      },
      miroirContextService.miroirContext.runActionTracker // Pass the unified tracker
    );

    // Get and format results - find the correct test suite key
    const allResults = TestSuiteContext.getTestAssertionsResults();
    const availableKeys = Object.keys(allResults);
    log.info("Available test suite keys:", availableKeys);

    // Find the key that contains our test suite name
    const matchingKey: string | undefined = availableKeys.find((key) =>
      key.includes(testSuiteKey)
    );

    if (!matchingKey) {
      throw new Error(
        `No test suite found containing '${testSuiteKey}'. Available keys: ${availableKeys.join(
          ", "
        )}`
      );
    }

    const testSuiteResults: TestSuiteResult =
      TestSuiteContext.getTestSuiteResult(matchingKey);
    log.info(testSuiteKey, "test results:", testSuiteResults);

    // Format results for display
    const structuredResults = generateTestReport(
      matchingKey,
      testSuiteResults,
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
