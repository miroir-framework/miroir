import React from 'react';

export interface TransformerTestResultExecutionSummaryProps {
  resolveConditionalSchemaResultsData: any[];
  testLabel?: string;
}

export const TransformerTestResultExecutionSummary: React.FC<TransformerTestResultExecutionSummaryProps> = ({
  resolveConditionalSchemaResultsData,
  testLabel = "TransformerTest"
}) => {
  // Don't render if no test results
  if (!resolveConditionalSchemaResultsData || resolveConditionalSchemaResultsData.length === 0) {
    return null;
  }

  // Calculate test statistics
  const totalTests = resolveConditionalSchemaResultsData.length;
  let passedTests = 0;
  let failedTests = 0;
  let skippedTests = 0;
  let totalAssertions = 0;
  let passedAssertions = 0;
  let failedAssertions = 0;
  let skippedAssertions = 0;

  console.log("UI TEST EXECUTION SUMMARY - Debug data:", resolveConditionalSchemaResultsData);

  resolveConditionalSchemaResultsData.forEach((testData: any, index: number) => {
    console.log(`Test ${index}:`, {
      testName: testData.testName,
      testResult: testData.testResult,
      status: testData.status,
      assertionCount: testData.assertionCount,
      fullAssertionsResults: testData.fullAssertionsResults
    });

    // For transformer tests, there's implicitly 1 assertion per test
    const assertionCount = testData.assertionCount || 1;
    totalAssertions += assertionCount;
    
    // First check if assertions indicate skipped status
    let hasSkippedAssertion = false;
    let hasFailedAssertion = false;
    let hasPassedAssertion = false;

    if (testData.fullAssertionsResults) {
      Object.values(testData.fullAssertionsResults).forEach((assertion: any) => {
        if (assertion.assertionResult === "skipped") {
          hasSkippedAssertion = true;
          skippedAssertions++;
        } else if (assertion.assertionResult === "error") {
          hasFailedAssertion = true;
          failedAssertions++;
        } else if (assertion.assertionResult === "ok") {
          hasPassedAssertion = true;
          passedAssertions++;
        }
      });
    }
    
    // Count test status - prioritize assertion results over test result/status
    // For transformer tests, if there's a skipped assertion, the test should be skipped
    if (hasSkippedAssertion && !hasFailedAssertion && !hasPassedAssertion) {
      skippedTests++;
    } else if (testData.testResult === "skipped" || testData.status === "skipped") {
      skippedTests++;
      // If no assertions recorded but test is skipped, count the implicit assertion as skipped
      if (!testData.fullAssertionsResults || Object.keys(testData.fullAssertionsResults).length === 0) {
        skippedAssertions++;
      }
    } else if (hasFailedAssertion || testData.testResult === "error" || testData.status === "error" || (testData.failedAssertions && testData.failedAssertions.length > 0)) {
      failedTests++;
      // If no failed assertions recorded but test failed, count the implicit assertion as failed
      if (!hasFailedAssertion && (!testData.fullAssertionsResults || Object.keys(testData.fullAssertionsResults).length === 0)) {
        failedAssertions++;
      }
    } else {
      passedTests++;
      // If no passed assertions recorded but test passed, count the implicit assertion as passed
      if (!hasPassedAssertion && (!testData.fullAssertionsResults || Object.keys(testData.fullAssertionsResults).length === 0)) {
        passedAssertions++;
      }
    }
  });

  console.log("UI TEST EXECUTION SUMMARY - Calculated stats:", {
    totalTests, passedTests, failedTests, skippedTests,
    totalAssertions, passedAssertions, failedAssertions, skippedAssertions
  });

  return (
    <div style={{ 
      margin: "10px 0 20px 0", 
      padding: "15px", 
      backgroundColor: "#f5f5f5", 
      border: "1px solid #ddd", 
      borderRadius: "6px",
      fontFamily: "monospace"
    }}>
      <h4 style={{ 
        margin: "0 0 10px 0", 
        color: "#333",
        fontSize: "14px",
        fontWeight: "bold",
        textAlign: "center"
      }}>
        TEST EXECUTION SUMMARY
      </h4>
      
      <div style={{ display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: "15px" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: "bold", color: "#333", fontSize: "12px" }}>Tests</div>
          <div style={{ fontSize: "11px" }}>
            <span style={{ color: "#4caf50" }}>✓ Passed: {passedTests}/{totalTests}</span>
            {failedTests > 0 && (
              <>
                <br />
                <span style={{ color: "#f44336" }}>✗ Failed: {failedTests}/{totalTests}</span>
              </>
            )}
            {skippedTests > 0 && (
              <>
                <br />
                <span style={{ color: "#999", opacity: 0.8 }}>⏭ Skipped: {skippedTests}/{totalTests}</span>
              </>
            )}
          </div>
        </div>
        
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: "bold", color: "#333", fontSize: "12px" }}>Assertions</div>
          <div style={{ fontSize: "11px" }}>
            <span style={{ color: "#4caf50" }}>✓ Passed: {passedAssertions}/{totalAssertions}</span>
            {failedAssertions > 0 && (
              <>
                <br />
                <span style={{ color: "#f44336" }}>✗ Failed: {failedAssertions}/{totalAssertions}</span>
              </>
            )}
            {skippedAssertions > 0 && (
              <>
                <br />
                <span style={{ color: "#999", opacity: 0.8 }}>⏭ Skipped: {skippedAssertions}/{totalAssertions}</span>
              </>
            )}
          </div>
        </div>

        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: "bold", color: "#333", fontSize: "12px" }}>Overall Status</div>
          <div style={{ fontSize: "11px", fontWeight: "bold" }}>
            {failedTests > 0 || failedAssertions > 0 ? (
              <span style={{ color: "#f44336" }}>FAILED</span>
            ) : (
              <span style={{ color: "#4caf50" }}>PASSED</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};