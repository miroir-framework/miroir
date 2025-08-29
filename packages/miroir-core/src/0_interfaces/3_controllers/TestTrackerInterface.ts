import {
  TestAssertionResult,
  TestAssertionsResults,
  TestResult,
  TestsResults,
  TestSuiteResult,
} from "../1_core/preprocessor-generated/miroirFundamentalType";

export interface TestTrackingData {
  testSuite?: string;
  test?: string;
  testAssertion?: string;
  timestamp: number;
}

export interface TestTrackerInterface {
  /**
   * Set the current test suite
   * @param testSuite The test suite name or undefined to clear
   */
  setTestSuite(testSuite: string | undefined): void;

  /**
   * Get the current test suite
   * @returns The current test suite name or undefined
   */
  getTestSuite(): string | undefined;

  /**
   * Set the current test
   * @param test The test name or undefined to clear
   */
  setTest(test: string | undefined): void;

  /**
   * Get the current test
   * @returns The current test name or undefined
   */
  getTest(): string | undefined;

  /**
   * Set the current test assertion
   * @param testAssertion The test assertion name or undefined to clear
   */
  setTestAssertion(testAssertion: string | undefined): void;

  /**
   * Get the current test assertion
   * @returns The current test assertion name or undefined
   */
  getTestAssertion(): string | undefined;

  /**
   * Set a test assertion result
   * @param testAssertionResult The test assertion result
   */
  setTestAssertionResult(testAssertionResult: TestAssertionResult): void;

  /**
   * Get test assertions results
   * @returns All test assertions results
   */
  getTestAssertionsResults(): { [testSuite: string]: { [test: string]: TestAssertionsResults } };

  /**
   * Get test result for a specific test suite and test
   * @param testSuite The test suite name
   * @param test The test name
   * @returns The test result
   */
  getTestResult(testSuite: string, test: string): TestResult;

  /**
   * Get test suite result for a specific test suite
   * @param testSuite The test suite name
   * @returns The test suite result
   */
  getTestSuiteResult(testSuite: string): TestSuiteResult;

  /**
   * Reset all test results
   */
  resetResults(): void;

  /**
   * Reset current test context
   */
  resetContext(): void;

  /**
   * Subscribe to test context changes
   * @param callback Function to call when test context changes
   * @returns Unsubscribe function
   */
  subscribe(callback: (context: TestTrackingData) => void): () => void;

  /**
   * Clear all test data and context
   */
  clear(): void;
}
