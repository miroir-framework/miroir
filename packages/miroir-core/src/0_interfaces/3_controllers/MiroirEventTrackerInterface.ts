import {
  TestAssertionResult,
  TestAssertionsResults,
  TestResult,
  TestSuiteResult,
} from "../1_core/preprocessor-generated/miroirFundamentalType";
// Import other interface elements only

export interface ActionOrTestTrackingData {
  id: string;
  parentId?: string;
  trackingType: 'action' | 'testSuite' | 'test' | 'testAssertion';
  actionType: string; // For actions, or derived from trackingType for tests
  actionLabel?: string; // For actions, or test/testSuite name for tests
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'running' | 'completed' | 'error';
  error?: string;
  depth: number;
  children: string[];
  
  // Test-specific fields (optional for backwards compatibility)
  testSuite?: string;
  test?: string; 
  testAssertion?: string;
  testResult?: 'ok' | 'error';
  testAssertionsResults?: TestAssertionsResults;
}

export interface MiroirEventTrackerInterface {
  /**
   * Start tracking an action
   * @param actionType The type of action being tracked
   * @param actionLabel Optional label for the action
   * @param parentId Optional parent action ID for nested calls
   * @returns Unique tracking ID for this action
   */
  startAction(actionType: string, actionLabel?: string, parentId?: string): string;
  
  /**
   * End tracking an action
   * @param trackingId The tracking ID returned from startAction
   * @param error Optional error information if the action failed
   */
  endAction(trackingId: string, error?: string): void;
  
  /**
   * Get all currently tracked actions
   * @returns Array of action tracking data
   */
  getAllActions(): ActionOrTestTrackingData[];
  
  /**
   * Get actions filtered by criteria
   * @param filter Filter criteria
   * @returns Filtered array of action tracking data
   */
  getFilteredActions(filter: {
    actionType?: string;
    trackingType?: 'action' | 'testSuite' | 'test' | 'testAssertion'; // New field for test filtering
    status?: 'running' | 'completed' | 'error';
    minDuration?: number;
    maxDuration?: number;
    since?: number; // timestamp
  }): ActionOrTestTrackingData[];
  
  /**
   * Clear all tracking data
   */
  clear(): void;
  
  /**
   * Subscribe to tracking data changes
   * @param callback Function to call when tracking data changes
   * @returns Unsubscribe function
   */
  subscribe(callback: (actions: ActionOrTestTrackingData[]) => void): () => void;
  
  /**
   * Get the current active action ID (for parent-child relationships)
   */
  getCurrentActionOrTestId(): string | undefined;

  /**
   * Set the current composite action name (similar to LoggerGlobalContext)
   * @param compositeAction The composite action name or undefined to clear
   */
  setCompositeAction(compositeAction: string | undefined): void;

  /**
   * Get the current composite action name
   * @returns The current composite action name or undefined
   */
  getCompositeAction(): string | undefined;

  /**
   * Set the current action name (similar to LoggerGlobalContext)
   * @param action The action name or undefined to clear
   */
  setAction(action: string | undefined): void;

  /**
   * Get the current action name
   * @returns The current action name or undefined
   */
  getAction(): string | undefined;

  // Test-specific methods for backwards compatibility with TestTracker
  /**
   * Start tracking a test suite
   * @param testSuite The test suite name
   * @param parentId Optional parent tracking ID
   * @returns Unique tracking ID for this test suite
   */
  startTestSuite(testSuite: string, parentId?: string): string;

  /**
   * Start tracking a test within a test suite
   * @param test The test name  
   * @param parentId Optional parent tracking ID (typically a test suite)
   * @returns Unique tracking ID for this test
   */
  startTest(test: string, parentId?: string): string;

  /**
   * Start tracking a test assertion within a test
   * @param testAssertion The test assertion name
   * @param parentId Optional parent tracking ID (typically a test)
   * @returns Unique tracking ID for this test assertion
   */
  startTestAssertion(testAssertion: string, parentId?: string): string;

  /**
   * Set test assertion result for a specific tracking ID or using current context
   * @param trackingId The tracking ID of the test assertion (new signature)
   * @param result The test assertion result (new signature)
   */
  setTestAssertionResult(trackingId: string, result: TestAssertionResult): void;
  
  /**
   * Set test assertion result using current context (TestTracker compatibility)
   * @param testAssertionResult The test assertion result
   */
  setTestAssertionResult(testAssertionResult: TestAssertionResult): void;

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
   * Get all test assertions results
   * @returns All test assertions results
   */
  getTestAssertionsResults(): { [testSuite: string]: { [test: string]: TestAssertionsResults } };

  // Test context methods (for TestTracker compatibility)
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
   * Reset all test results
   */
  resetResults(): void;

  /**
   * Reset current test context
   */
  resetContext(): void;
}
