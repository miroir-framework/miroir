import chalk from 'chalk';

import {
  TestAssertionResult,
  TestResult,
  type TestSuiteResult
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import {
  MiroirActivityTrackerInterface,
  MiroirEventTrackingData,
  type TestAssertionPath,
} from "../0_interfaces/3_controllers/MiroirEventTrackerInterface";
import type { MiroirEventServiceInterface } from './MiroirEventService';


export class MiroirActivityTracker implements MiroirActivityTrackerInterface {
  private readonly CLEANUP_INTERVAL_MS = 60000; // 1 minute
  private readonly MAX_AGE_MS = 20 * 60 * 1000; // 20 minutes

  private miroirEventService: MiroirEventServiceInterface | undefined;
  private eventTrackingData: Map<string, MiroirEventTrackingData> = new Map();
  private currentEvenStack: string[] = []; // Stack to track nested actions

  private subscribers: Set<(actions: MiroirEventTrackingData[]) => void> = new Set();
  private cleanupInterval: NodeJS.Timeout;

  // Action and composite action context tracking (duplicated from LoggerGlobalContext)
  private currentCompositeAction: string | undefined = undefined;
  private currentAction: string | undefined = undefined;

  // Test context tracking (for TestTracker compatibility)
  public currentTestPath: TestAssertionPath = [];
  private currentTestSuite: string | undefined = undefined;
  private currentTest: string | undefined = undefined;
  private currentTestAssertion: string | undefined = undefined;
  private testAssertionsResults: TestSuiteResult = {};

  // Transformer tracking configuration
  private transformerTrackingEnabled: boolean = true;
  public currentTransformerPath: string[] = [];

  constructor() {
    // Start auto-cleanup timer
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.CLEANUP_INTERVAL_MS);
  }

  // ##############################################################################################
  setMiroirEventService(service: MiroirEventServiceInterface): void {
    this.miroirEventService = service;
  }
  // ###############################################################################################
  // ###############################################################################################
  // EVENTS
  // ###############################################################################################
  // ###############################################################################################
  endActivity(trackingId: string, error?: string): void {
    const event = this.eventTrackingData.get(trackingId);
    if (!event) {
      return;
    }

    const now = Date.now();
    event.endTime = now;
    event.duration = now - event.startTime;
    event.status = error ? "error" : "completed";
    if (error) {
      event.error = error;
    }

    // Remove from action stack
    const index = this.currentEvenStack.indexOf(trackingId);
    if (index !== -1) {
      this.currentEvenStack.splice(index, 1);
    }

    if (["testSuite", "test", "testAssertion" ].includes(event.activityType)) {
      this.currentTestPath.pop();
    }
    this.miroirEventService?.pushEventFromLogTrackingData(event);
  }

  getActivityIndex(): Map<string, MiroirEventTrackingData> {
    return this.eventTrackingData;
  }

  getAllActivities(): MiroirEventTrackingData[] {
    return Array.from(this.eventTrackingData.values()).sort((a, b) => a.startTime - b.startTime);
  }

  getFilteredActivities(filter: {
    actionType?: string;
    trackingType?: "action" | "testSuite" | "test" | "testAssertion" | "transformer"; // New field for test and transformer filtering
    status?: "running" | "completed" | "error";
    minDuration?: number;
    maxDuration?: number;
    since?: number;
  }, events?: MiroirEventTrackingData[]): MiroirEventTrackingData[] {
    return events??this.getAllActivities().filter((action) => {
      if (filter.actionType && action.actionType !== filter.actionType) {
        return false;
      }
      if (filter.trackingType && action.activityType !== filter.trackingType) {
        return false;
      }
      if (filter.status && action.status !== filter.status) {
        return false;
      }
      if (
        filter.minDuration &&
        (action.duration === undefined || action.duration < filter.minDuration)
      ) {
        return false;
      }
      if (
        filter.maxDuration &&
        (action.duration === undefined || action.duration > filter.maxDuration)
      ) {
        return false;
      }
      if (filter.since && action.startTime < filter.since) {
        return false;
      }
      return true;
    });
  }

  clear(): void {
    this.eventTrackingData.clear();
    this.currentEvenStack = [];
    this.currentCompositeAction = undefined;
    this.currentAction = undefined;
    this.currentTestSuite = undefined;
    this.currentTest = undefined;
    this.currentTestAssertion = undefined;
    this.testAssertionsResults = {};
  }

  // subscribe(callback: (actions: MiroirEventTrackingData[]) => void): () => void {
  //   this.subscribers.add(callback);
  //   return () => {
  //     this.subscribers.delete(callback);
  //   };
  // }

  getCurrentEventId(): string | undefined {
    return this.currentEvenStack[this.currentEvenStack.length - 1];
  }

  // ##############################################################################################
  // ##############################################################################################
  // ACTIONS
  // ##############################################################################################
  // ##############################################################################################
  async trackAction<T>(
    actionType: string,
    actionLabel: string | undefined,
    actionFn: () => Promise<T>
  ): Promise<T> {
    const trackingId = this.startActivity_Action(actionType, actionLabel);
    try {
      const result = await actionFn();
      this.endActivity(trackingId);
      return result;
    } catch (error) {
      this.endActivity(trackingId, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  startActivity_Action(actionType: string, actionLabel?: string, parentId?: string): string {
    const id = this.generateId();
    const now = Date.now();

    // If no parentId is provided, use the current active action as parent
    const effectiveParentId = parentId || this.getCurrentEventId();

    const depth = effectiveParentId
      ? (this.eventTrackingData.get(effectiveParentId)?.depth ?? 0) + 1
      : 0;

    const eventTrackingData: MiroirEventTrackingData = {
      activityId: id,
      parentId: effectiveParentId,
      activityType: "action",
      actionType,
      actionLabel,
      startTime: now,
      status: "running",
      depth,
      children: [],
    };

    this.eventTrackingData.set(id, eventTrackingData);

    // Add to parent's children if there's a parent
    if (effectiveParentId) {
      const parent = this.eventTrackingData.get(effectiveParentId);
      if (parent && !parent.children.includes(id)) {
        parent.children.push(id);
      }
    }

    // Push to action stack
    this.currentEvenStack.push(id);

    this.miroirEventService?.pushEventFromLogTrackingData(eventTrackingData);
    return id;
  }

  setCompositeAction(compositeAction: string | undefined): void {
    this.currentCompositeAction = compositeAction;
  }

  getCompositeAction(): string | undefined {
    return this.currentCompositeAction;
  }

  setAction(action: string | undefined): void {
    this.currentAction = action;
  }

  getAction(): string | undefined {
    return this.currentAction;
  }

  // ###############################################################################################
  // ###############################################################################################
  // TEST SUITES
  // ###############################################################################################
  // ##############################################################################################
  async trackTestSuite<T>(
    testSuite: string,
    parentId: string | undefined,
    actionFn: () => Promise<T>
  ): Promise<T> {
    const trackingId = this.startTestSuite(testSuite, parentId);
    try {
      const result = await actionFn();
      this.endActivity(trackingId);
      return result;
    } catch (error) {
      this.endActivity(trackingId, error instanceof Error ? error.message : String(error));
      throw error;
    } finally {
      this.currentTestPath.pop();
    }
  }

  // Test-specific methods for backwards compatibility with TestTracker
  startTestSuite(testSuite: string, parentId?: string): string {
    const id = this.generateId();
    const now = Date.now();

    const effectiveParentId = parentId || this.getCurrentEventId();
    const depth = effectiveParentId
      ? (this.eventTrackingData.get(effectiveParentId)?.depth ?? 0) + 1
      : 0;

    const eventTrackingData: MiroirEventTrackingData = {
      activityId: id,
      parentId: effectiveParentId,
      activityType: "testSuite",
      actionType: "testSuite",
      actionLabel: testSuite,
      testSuite,
      startTime: now,
      status: "running",
      depth,
      children: [],
    };

    this.eventTrackingData.set(id, eventTrackingData);

    if (effectiveParentId) {
      const parent = this.eventTrackingData.get(effectiveParentId);
      if (parent && !parent.children.includes(id)) {
        parent.children.push(id);
      }
    }

    this.currentEvenStack.push(id);
    this.currentTestSuite = testSuite;
    this.currentTestPath.push({ testSuite });
    this.miroirEventService?.pushEventFromLogTrackingData(eventTrackingData);
    return id;
  }

  public static testPathName(testSuitePath: string[]): string {
    return testSuitePath.join("#");
  }

  // Convert string[] path to TestAssertionPath format
  public static stringArrayToTestAssertionPath(stringPath: string[]): TestAssertionPath {
    const result: TestAssertionPath = [];
    
    for (let i = 0; i < stringPath.length; i++) {
      // Each level in the hierarchy can be a test suite name
      // We assume all levels are test suites for now, since that's what testSuites() returns
      result.push({ testSuite: stringPath[i] });
    }
    
    return result;
  }

  setTestSuite(testSuite: string | undefined): void {
    this.currentTestSuite = testSuite;
  }

  getTestSuite(): string | undefined {
    return this.currentTestSuite;
  }

  // ##############################################################################################
  getTestSuiteResult(testSuitePath: TestAssertionPath): TestSuiteResult {
    // Navigate through the test path to find the test suite result
    let current: any = this.testAssertionsResults;

    for (const pathElement of testSuitePath) {
      if (pathElement.testSuite) {
        if (!current.testsSuiteResults || !current.testsSuiteResults[pathElement.testSuite]) {
          throw new Error(`getTestSuiteResult TestSuite not found: ${pathElement.testSuite}`);
        }
        current = current.testsSuiteResults[pathElement.testSuite];
      } else {
        // We've reached a non-test-suite element, so we should stop here and return the current level
        break;
      }
    }

    // Return the current level as a TestSuiteResult
    return current;
  }

  // ##############################################################################################
  // ##############################################################################################
  // TEST ASSERTIONS
  // ##############################################################################################
  // ##############################################################################################
  async trackTestAssertion<T>(
    testAssertion: string,
    parentId: string | undefined,
    actionFn: () => Promise<T>
  ): Promise<T> {
    const trackingId = this.startTestAssertion(testAssertion, parentId);
    try {
      const result = await actionFn();
      this.endActivity(trackingId);
      return result;
    } catch (error) {
      this.endActivity(trackingId, error instanceof Error ? error.message : String(error));
      throw error;
    } finally {
      this.currentTestPath.pop();
    }
  }

  startTestAssertion(testAssertion: string, parentId?: string): string {
    const id = this.generateId();
    const now = Date.now();

    const effectiveParentId = parentId || this.getCurrentEventId();
    const depth = effectiveParentId
      ? (this.eventTrackingData.get(effectiveParentId)?.depth ?? 0) + 1
      : 0;

    const event: MiroirEventTrackingData = {
      activityId: id,
      parentId: effectiveParentId,
      activityType: "testAssertion",
      actionType: "testAssertion",
      actionLabel: testAssertion,
      testSuite: this.currentTestSuite,
      test: this.currentTest,
      testAssertion,
      startTime: now,
      status: "running",
      depth,
      children: [],
    };

    this.eventTrackingData.set(id, event);

    if (effectiveParentId) {
      const parent = this.eventTrackingData.get(effectiveParentId);
      if (parent && !parent.children.includes(id)) {
        parent.children.push(id);
      }
    }

    this.currentEvenStack.push(id);
    this.currentTestAssertion = testAssertion;
    
    // // Remove any previous testAssertion entries from currentTestPath
    // // to ensure each testAssertion gets its own clean entry
    // while (this.currentTestPath.length > 0) {
    //   const lastElement = this.currentTestPath[this.currentTestPath.length - 1];
    //   if (lastElement.testAssertion) {
    //     this.currentTestPath.pop();
    //   } else {
    //     break;
    //   }
    // }
    
    this.currentTestPath.push({ testAssertion });
    this.miroirEventService?.pushEventFromLogTrackingData(event);

    return id;
  }

  getCurrentTestAssertionPath(): TestAssertionPath {
    // if (!this.currentTestSuite || !this.currentTest || !this.currentTestAssertion) {
    //   return [];
    // }
    return this.currentTestPath;
  }

  // ##############################################################################################
  setTestAssertionResult(
    testAssertionPath: TestAssertionPath,
    testAssertionResult?: TestAssertionResult
  ): void {
    console.log(
      "MiroirActivityTracker.setTestAssertionResult called for testAssertionPath",
      testAssertionPath,
      "testAssertionResult",
      // "old this.testAssertionsResults",
      // JSON.stringify(this.testAssertionsResults, null, 2)
    );
    
    // Color output based on assertion result
    let coloredOutput;
    if (testAssertionResult?.assertionResult == "ok") {
      coloredOutput = chalk.green(JSON.stringify(testAssertionResult, null, 2));
    } else if (testAssertionResult?.assertionResult == "skipped") {
      coloredOutput = chalk.gray("⏭ " + JSON.stringify(testAssertionResult, null, 2));
    } else {
      coloredOutput = chalk.red(JSON.stringify(testAssertionResult, null, 2));
    }
    console.log(coloredOutput);


    if (testAssertionPath.length === 0) {
      throw new Error("testAssertionPath cannot be empty");
    }

    if (!testAssertionResult || !testAssertionResult.assertionName) {
      throw new Error("Invalid testAssertionResult or missing assertionName");
    }

    // Navigate through the test path, creating missing nodes as needed
    let current: any = this.testAssertionsResults;
    
    // Track the current test suite and test for creating the correct structure
    let currentTestSuiteName: string | undefined;
    let currentTestName: string | undefined;

    for (const pathElement of testAssertionPath) {
      if (pathElement.testSuite) {
        currentTestSuiteName = pathElement.testSuite;
        
        // Ensure the test suite results structure exists
        if (!current.testsSuiteResults) {
          current.testsSuiteResults = {};
        }
        if (!current.testsSuiteResults[currentTestSuiteName]) {
          current.testsSuiteResults[currentTestSuiteName] = {};
        }
        current = current.testsSuiteResults[currentTestSuiteName];
        
      } else if (pathElement.test) {
        currentTestName = pathElement.test;
        
        // Ensure the tests results structure exists
        if (!current.testsResults) {
          current.testsResults = {};
        }
        if (!current.testsResults[currentTestName]) {
          current.testsResults[currentTestName] = {
            testLabel: currentTestName,
            testResult: "ok", // Will be updated based on assertion results
            testAssertionsResults: {}
          };
        }
        current = current.testsResults[currentTestName];
        
      } else if (pathElement.testAssertion) {
        // We're at the assertion level, set the result
        if (!current.testAssertionsResults) {
          current.testAssertionsResults = {};
        }
        current.testAssertionsResults[testAssertionResult.assertionName] = testAssertionResult;
        
        // Update the test result based on assertion results
        const assertionResults = Object.values(current.testAssertionsResults);
        const hasErrors = assertionResults.some(
          (result: any) => result.assertionResult === "error"
        );
        const hasSkipped = assertionResults.some(
          (result: any) => result.assertionResult === "skipped"
        );
        const allSkipped = assertionResults.every(
          (result: any) => result.assertionResult === "skipped"
        );
        
        // Priority: error > skipped > ok
        if (hasErrors) {
          current.testResult = "error";
        } else if (allSkipped) {
          current.testResult = "skipped";
        } else if (hasSkipped) {
          // Mixed results: some passed, some skipped
          current.testResult = "ok"; // Could be "mixed" but keeping "ok" for now
        } else {
          current.testResult = "ok";
        }
        break;
      }
    }

    // console.log(
    //   "MiroirActivityTracker.setTestAssertionResult new this.testAssertionsResults",
    //   JSON.stringify(this.testAssertionsResults, null, 2)
    // );
  }

  // ##############################################################################################
  getTestResult(testPath: TestAssertionPath): TestResult {
    // First check if the path contains a test element
    const hasTestElement = testPath.some(pathElement => pathElement.test);
    if (!hasTestElement) {
      throw new Error("getTestResult: Path does not contain a test element");
    }

    // Navigate through the test path to find the test result
    let current: any = this.testAssertionsResults;
    let testName: string | undefined;

    for (const pathElement of testPath) {
      if (pathElement.testSuite) {
        if (!current.testsSuiteResults || !current.testsSuiteResults[pathElement.testSuite]) {
          throw new Error(`getTestResult TestSuite not found: ${pathElement.testSuite}`);
        }
        current = current.testsSuiteResults[pathElement.testSuite];
      } else if (pathElement.test) {
        testName = pathElement.test;
        if (!current.testsResults || !current.testsResults[pathElement.test]) {
          throw new Error(`getTestResult Test not found: ${pathElement.test}`);
        }
        return current.testsResults[pathElement.test];
      }
    }

    throw new Error("getTestResult: Path does not contain a test element");
  }

  // ##############################################################################################
  // getTestAssertionsResults(): { [testSuite: string]: { [test: string]: TestAssertionsResults } } {
  getTestAssertionsResults(testAssertionsPath: TestAssertionPath): TestSuiteResult {
    // console.log(
    //   "MiroirActivityTracker.getTestAssertionsResults called for testAssertionsPath",
    //   testAssertionsPath,
    //   "this.testAssertionsResults",
    //   JSON.stringify(this.testAssertionsResults, null, 2)
    // );
    // If no path is provided, return the root test results
    if (testAssertionsPath.length === 0) {
      return this.testAssertionsResults;
    }

    // Navigate through the test path to find the appropriate level
    let current: any = this.testAssertionsResults;

    for (const pathElement of testAssertionsPath) {
      if (pathElement.testSuite) {
        if (!current.testsSuiteResults || !current.testsSuiteResults[pathElement.testSuite]) {
          throw new Error(`getTestAssertionsResults TestSuite not found: ${pathElement.testSuite}`);
        }
        current = current.testsSuiteResults[pathElement.testSuite];
      } else if (pathElement.test) {
        // For tests, we might want to return the test suite level or the specific test
        // Based on the interface, this method should return TestSuiteResult, so we continue
        break;
      } else if (pathElement.testAssertion) {
        // For test assertions, we also break here
        break;
      }
    }

    return current;
  }

  // ##############################################################################################
  // ##############################################################################################
  // TEST
  // ##############################################################################################
  // ##############################################################################################
  async trackTest<T>(
    test: string,
    parentId: string | undefined,
    actionFn: () => Promise<T>
  ): Promise<T> {
    const trackingId = this.startTest(test, parentId);
    try {
      const result = await actionFn();
      this.endActivity(trackingId);
      return result;
    } catch (error) {
      this.endActivity(trackingId, error instanceof Error ? error.message : String(error));
      throw error;
    } finally {
      this.currentTestPath.pop();
    }
  }

  // ###############################################################################################
  startTest(test: string, parentId?: string): string {
    const id = this.generateId();
    const now = Date.now();

    const effectiveParentId = parentId || this.getCurrentEventId();
    const depth = effectiveParentId
      ? (this.eventTrackingData.get(effectiveParentId)?.depth ?? 0) + 1
      : 0;

    const event: MiroirEventTrackingData = {
      activityId: id,
      parentId: effectiveParentId,
      activityType: "test",
      actionType: "test",
      actionLabel: test,
      testSuite: this.currentTestSuite,
      test,
      startTime: now,
      status: "running",
      depth,
      children: [],
    };

    this.eventTrackingData.set(id, event);

    if (effectiveParentId) {
      const parent = this.eventTrackingData.get(effectiveParentId);
      if (parent && !parent.children.includes(id)) {
        parent.children.push(id);
      }
    }

    this.currentEvenStack.push(id);
    this.currentTest = test;
    
    // // Remove any previous test or testAssertion entries from currentTestPath
    // // to ensure each test gets its own clean path within the current test suite context
    // while (this.currentTestPath.length > 0) {
    //   const lastElement = this.currentTestPath[this.currentTestPath.length - 1];
    //   if (lastElement.test || lastElement.testAssertion) {
    //     this.currentTestPath.pop();
    //   } else {
    //     break;
    //   }
    // }
    
    this.currentTestPath.push({test});
    this.miroirEventService?.pushEventFromLogTrackingData(event);

    return id;
  }

  setTest(test: string | undefined): void {
    this.currentTest = test;
  }

  getTest(): string | undefined {
    return this.currentTest;
  }

  setTestAssertion(testAssertion: string | undefined): void {
    this.currentTestAssertion = testAssertion;
  }

  getTestAssertion(): string | undefined {
    return this.currentTestAssertion;
  }

  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  resetResults(): void {
    this.testAssertionsResults = {};
  }

  resetContext(): void {
    this.currentTestSuite = undefined;
    this.currentTest = undefined;
    this.currentTestAssertion = undefined;
  }

  // ##############################################################################################
  // ##############################################################################################
  // TRANSFORMERS
  // ##############################################################################################
  // ##############################################################################################
  // Transformer-specific methods
  startTransformer(
    transformerName: string,
    transformerType: string,
    step: "build" | "runtime",
    transformerParams?: any,
    parentId?: string
  ): string {
    if (!this.transformerTrackingEnabled) {
      return ""; // Return empty string if tracking is disabled
    }

    const activityId = this.generateId();
    const now = Date.now();

    const effectiveParentId = parentId || this.getCurrentEventId();
    const depth = effectiveParentId
      ? (this.eventTrackingData.get(effectiveParentId)?.depth ?? 0) + 1
      : 0;

    const transformerData: MiroirEventTrackingData = {
      activityId: activityId,
      parentId: effectiveParentId,
      activityType: "transformer",
      actionType: "transformer",
      actionLabel: transformerName,
      transformerName,
      transformerType,
      transformerStep: step,
      transformerParams,
      startTime: now,
      status: "running",
      depth,
      children: [],
    };

    this.eventTrackingData.set(activityId, transformerData);

    if (effectiveParentId) {
      const parent = this.eventTrackingData.get(effectiveParentId);
      if (parent && !parent.children.includes(activityId)) {
        parent.children.push(activityId);
      }
    }

    this.currentEvenStack.push(activityId);
    this.currentTransformerPath.push(transformerName);
    return activityId;
  }

  // ###############################################################################################
  endTransformer(trackingId: string, result?: any, error?: string): void {
    if (!this.transformerTrackingEnabled || !trackingId) {
      return;
    }

    const transformer = this.eventTrackingData.get(trackingId);
    if (!transformer) {
      return;
    }

    const now = Date.now();
    transformer.endTime = now;
    transformer.duration = now - transformer.startTime;
    transformer.status = error ? "error" : "completed";

    // Type guard for transformer events
    if (transformer.activityType === "transformer") {
      transformer.transformerResult = result;
      if (error) {
        transformer.transformerError = error;
      }
    }

    // Common error property for all event types
    if (error) {
      transformer.error = error;
    }

    // Remove from action stack
    const index = this.currentEvenStack.indexOf(trackingId);
    if (index !== -1) {
      this.currentEvenStack.splice(index, 1);
    }

    this.currentTransformerPath.pop();
  }

  isTransformerTrackingEnabled(): boolean {
    return this.transformerTrackingEnabled;
  }

  setTransformerTrackingEnabled(enabled: boolean): void {
    this.transformerTrackingEnabled = enabled;
  }

  private generateId(): string {
    return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // // ##############################################################################################
  // // ##############################################################################################
  // // ##############################################################################################
  // // ##############################################################################################
  private cleanup(): void {
    const now = Date.now();
    const cutoff = now - this.MAX_AGE_MS;

    // Find actions to remove (completed/error actions older than MAX_AGE_MS)
    const toRemove: string[] = [];

    for (const [id, action] of Array.from(this.eventTrackingData.entries())) {
      if (action.status !== "running" && action.startTime < cutoff) {
        toRemove.push(id);
      }
    }

    // Remove old actions and update parent references
    toRemove.forEach((id) => {
      const action = this.eventTrackingData.get(id);
      if (action?.parentId) {
        const parent = this.eventTrackingData.get(action.parentId);
        if (parent) {
          const index = parent.children.indexOf(id);
          if (index !== -1) {
            parent.children.splice(index, 1);
          }
        }
      }
      this.eventTrackingData.delete(id);
    });

  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    // if (this.notificationDebounceTimeout) {
    //   clearTimeout(this.notificationDebounceTimeout);
    // }
    this.clear();
    this.subscribers.clear();
  }
}
