import type { TestSuiteResult } from "miroir-core";

export interface TestResultData {
  testName: string;
  testPath: string[];
  testResult: "ok" | "error" | "skipped";
  status: string;
  failedAssertions: string[] | undefined;
  assertionCount: number;
  assertions: string;
  fullAssertionsResults: unknown;
}

export function generateTestReport(
  testSuiteKey: string,
  allResults: TestSuiteResult,
  setResultText: (value: string) => void,
): TestResultData[] {
  const testResults: TestResultData[] = [];
  let resultText = `=== ${testSuiteKey} Test Results ===\n\n`;

  let totalTestSuites = 0;
  let totalTests = 0;
  let passedTestSuites = 0;
  let passedTests = 0;
  let skippedTests = 0;

  const collectTestInfo = (
    results: TestSuiteResult,
    pathPrefix: string[] = [],
  ): Array<{
    type: "suite" | "test";
    path: string;
    testPath: string[];
    status: "ok" | "error" | "skipped";
    failedAssertions?: string[];
    assertionCount?: number;
    fullAssertionsResults?: unknown;
  }> => {
    const testInfo: Array<{
      type: "suite" | "test";
      path: string;
      testPath: string[];
      status: "ok" | "error" | "skipped";
      failedAssertions?: string[];
      assertionCount?: number;
      fullAssertionsResults?: unknown;
    }> = [];

    if (results.testsSuiteResults) {
      for (const [suiteName, suiteResult] of Object.entries(results.testsSuiteResults)) {
        const currentPath = [...pathPrefix, suiteName];
        totalTestSuites++;

        const suiteTestResults = suiteResult.testsResults
          ? Object.values(suiteResult.testsResults)
          : [];
        const hasFailedTests = suiteTestResults.some((test) => test.testResult === "error");
        const allSkipped =
          suiteTestResults.length > 0 &&
          suiteTestResults.every((test) => test.testResult === "skipped");

        if (hasFailedTests) {
          // suite failed
        } else if (!allSkipped) {
          passedTestSuites++;
        }

        testInfo.push(...collectTestInfo(suiteResult, currentPath));
      }
    }

    if (results.testsResults) {
      for (const [testName, testResult] of Object.entries(results.testsResults)) {
        totalTests++;

        const testPath = [...pathPrefix, testName].join(" > ");
        const testPathArray = [...pathPrefix, testName];

        let testStatus: "ok" | "error" | "skipped";
        if (testResult.testResult === "skipped") {
          testStatus = "skipped";
          skippedTests++;
        } else if (testResult.testResult === "ok") {
          testStatus = "ok";
          passedTests++;
        } else {
          testStatus = "error";
        }

        const assertions = Object.entries(testResult.testAssertionsResults);
        const failedAssertions = assertions
          .filter(([_, assertion]) => assertion.assertionResult === "error")
          .map(([name]) => name);

        testInfo.push({
          type: "test",
          path: testPath,
          testPath: testPathArray,
          status: testStatus,
          failedAssertions: failedAssertions.length > 0 ? failedAssertions : undefined,
          assertionCount: assertions.length,
          fullAssertionsResults: testResult.testAssertionsResults,
        });
      }
    }

    return testInfo;
  };

  const allTestInfo = collectTestInfo(allResults, [testSuiteKey]);

  for (const test of allTestInfo) {
    if (test.type === "test") {
      let symbol: string;
      let statusText: string;
      let statusDisplay: string;
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

      testResults.push({
        testName: test.path,
        testPath: test.testPath,
        testResult: test.status,
        status: statusDisplay,
        failedAssertions: test.failedAssertions,
        assertionCount: test.assertionCount || 0,
        assertions:
          test.status === "skipped"
            ? "Test skipped"
            : test.failedAssertions && test.failedAssertions.length > 0
              ? `${test.failedAssertions.length} failed: ${test.failedAssertions.join(", ")}`
              : `All ${test.assertionCount || 0} assertions passed`,
        fullAssertionsResults: test.fullAssertionsResults,
      });

      if (test.failedAssertions && test.failedAssertions.length > 0) {
        resultText += `    Failed assertions: ${test.failedAssertions.join(", ")}\n`;
      }
    }
  }

  resultText += "\n=== Test Summary ===\n";
  if (totalTestSuites > 0) {
    const suitePassRate =
      totalTestSuites > 0 ? ((passedTestSuites / totalTestSuites) * 100).toFixed(1) : "0.0";
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

  const overallStatus = passedTests === totalTests ? "PASSED" : "FAILED";
  resultText += `\nOverall Status: ${overallStatus}\n`;

  setResultText(resultText);
  return testResults;
}
