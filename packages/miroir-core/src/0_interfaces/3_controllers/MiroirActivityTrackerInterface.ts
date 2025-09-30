import type { MiroirEventServiceInterface } from "../../3_controllers/MiroirEventService";
import {
  TestAssertionResult,
  TestAssertionsResults,
  TestResult,
  TestSuiteResult,
} from "../1_core/preprocessor-generated/miroirFundamentalType";
import type { Domain2QueryReturnType } from "../2_domain/DomainElement";
// Import other interface elements only

// Base interface for common tracking fields
interface MiroirActivity_Root {
  activityId: string;
  parentId?: string;
  actionType: string;
  actionLabel?: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'running' | 'completed' | 'error';
  error?: string;
  depth: number;
  children: string[];
}

// Discriminated union for event tracking data
export type MiroirActivity_Action = MiroirActivity_Root & {
  activityType: "action";
};

export type MiroirActivity_Test = MiroirActivity_Root & {
  activityType: "testSuite" | "test" | "testAssertion";
  testSuite?: string;
  test?: string;
  testAssertion?: string;
  testResult?: "ok" | "error";
  testAssertionsResults?: TestAssertionsResults;
};

export type MiroirActivity_Transformer = MiroirActivity_Root & {
  activityType: 'transformer';
  transformerName?: string;
  transformerType?: string;
  transformerStep?: 'build' | 'runtime';
  transformerParams?: any;
  transformerResult?: Domain2QueryReturnType<any>;
  transformerError?: string;
};

export type MiroirActivity =
  | MiroirActivity_Action
  | MiroirActivity_Test
  | MiroirActivity_Transformer;

export type TestAssertionPath = {testSuite?: string, test?: string, testAssertion?: string}[];

export interface MiroirActivityTrackerInterface {

  /**
   * 
   * @param service The MiroirEventService instance to use for event notifications
   */
  setMiroirEventService(service: MiroirEventServiceInterface): void;
  
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  /**
   * Start tracking an action
   * @param actionType The type of action being tracked
   * @param actionLabel Optional label for the action
   * @param parentId Optional parent action ID for nested calls
   * @returns Unique tracking ID for this action
   */
  startActivity_Action(actionType: string, actionLabel?: string, parentId?: string): string;
  
  /**
   * End tracking an action
   * @param trackingId The tracking ID returned from startEvent
   * @param error Optional error information if the action failed
   */
  endActivity(trackingId: string, error?: string): void;
  
  /**
   * Get all currently tracked actions
   * @returns Array of action tracking data
   */
  getAllActivities(): MiroirActivity[];
  
  /**
   * Get all currently tracked actions as a Map of ID to data
   * @returns Map of action ID to action tracking data
   */
  getActivityIndex(): Map<string, MiroirActivity>;

  /**
   * Get actions filtered by criteria
   * @param filter Filter criteria
   * @returns Filtered array of action tracking data
   */
  getFilteredActivities(filter: {
    actionType?: string;
    trackingType?: 'action' | 'testSuite' | 'test' | 'testAssertion' | 'transformer'; // New field for test and transformer filtering
    status?: 'running' | 'completed' | 'error';
    minDuration?: number;
    maxDuration?: number;
    since?: number; // timestamp
  }, events?: MiroirActivity[]): MiroirActivity[];
  
  /**
   * Clear all tracking data
   */
  clear(): void;
  
  /**
   * Get the current active action ID (for parent-child relationships)
   */
  getCurrentActivityId(): string | undefined;

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

  trackAction<T>(
    actionType: string,
    actionLabel: string | undefined,
    actionFn: () => Promise<T>
  ): Promise<T>;

  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  trackTestSuite<T>(
    testSuiteName: string,
    testSuitePathAsString: string,
    parentId: string | undefined,
    actionFn: (parentId: string | undefined) => Promise<T>
  ): Promise<T>;

  trackTest<T>(
    test: string,
    parentTrackingId: string | undefined,
    actionFn: (parentTrackingId: string | undefined) => Promise<T>
  ): Promise<T>;

  trackTestAssertion<T>(
    testAssertion: string,
    parentTrackingId: string | undefined,
    actionFn: (parentTrackingId: string | undefined) => Promise<T>
  ): Promise<T>;


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
   * Set test assertion result using current context (TestTracker compatibility)
   * @param testAssertionResult The test assertion result
   */
  setTestAssertionResult(testAssertionPath: TestAssertionPath, testAssertionResult: TestAssertionResult): void;

  /**
   * Get test result for a specific test suite and test
   * @param testSuite The test suite name
   * @param test The test name
   * @returns The test result
   */
  getTestResult(testPath: TestAssertionPath): TestResult;

  /**
   * Get test suite result for a specific test suite
   * @param testSuitePath The test suite name
   * @returns The test suite result
   */
  getTestSuiteResult(testSuitePath: TestAssertionPath): TestSuiteResult;

  /**
   * Get all test assertions results
   * @returns All test assertions results
   */
  // getTestAssertionsResults(): { [testSuite: string]: { [test: string]: TestAssertionsResults } };
  getTestAssertionsResults(testAssertionsPath: TestAssertionPath): TestSuiteResult;

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
   * Get the current test assertion
   * @returns The current test assertion name or undefined
   */
  getCurrentTestAssertionPath(): TestAssertionPath;

  /**
   * Reset all test results
   */
  resetResults(): void;

  /**
   * Reset current test context
   */
  resetContext(): void;

  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // Transformer-specific methods
  trackTransformerRun<T>(
    transformerName: string,
    transformerType: string,
    step: "build" | "runtime",
    transformerParams: any,
    parentId: string | undefined,
    actionFn: () => Promise<T>
  ): Promise<T>;
  
  /**
   * Start tracking a transformer execution
   * @param transformerName The name/label of the transformer
   * @param transformerType The type of transformer (e.g., 'contextReference', 'constant', etc.)
   * @param step The transformer step ('build' or 'runtime')
   * @param transformerParams The parameters passed to the transformer
   * @param parentId Optional parent transformer ID for nested calls
   * @returns Unique tracking ID for this transformer execution
   */
  startTransformer(
    transformerName: string,
    transformerType: string,
    step: 'build' | 'runtime',
    transformerParams?: any,
    parentId?: string
  ): string;

  /**
   * End tracking a transformer execution
   * @param trackingId The tracking ID returned from startTransformer
   * @param result The transformer result (if successful)
   * @param error Optional error information if the transformer failed
   */
  endTransformer(trackingId: string, result?: any, error?: string): void;

  /**
   * Configuration flag to enable/disable transformer event gathering
   */
  isTransformerTrackingEnabled(): boolean;
  setTransformerTrackingEnabled(enabled: boolean): void;
}
