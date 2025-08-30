import { RunActionTrackerInterface, ActionTrackingData } from "../0_interfaces/3_controllers/RunActionTrackerInterface";
import { TestTrackingData } from "../0_interfaces/3_controllers/TestTrackerInterface";
import {
  TestAssertionResult,
  TestAssertionsResults,
  TestResult,
  TestsResults,
  TestSuiteResult,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

export class RunActionTracker implements RunActionTrackerInterface {
  private actions: Map<string, ActionTrackingData> = new Map();
  private subscribers: Set<(actions: ActionTrackingData[]) => void> = new Set();
  private currentActionStack: string[] = []; // Stack to track nested actions
  private cleanupInterval: NodeJS.Timeout;
  private readonly CLEANUP_INTERVAL_MS = 60000; // 1 minute
  private readonly MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes (as requested)

  // Action and composite action context tracking (duplicated from LoggerGlobalContext)
  private currentCompositeAction: string | undefined = undefined;
  private currentAction: string | undefined = undefined;

  // Test context tracking (for TestTracker compatibility)
  private currentTestSuite: string | undefined = undefined;
  private currentTest: string | undefined = undefined;
  private currentTestAssertion: string | undefined = undefined;
  private testAssertionsResults: {
    [testSuite: string]: { [test: string]: TestAssertionsResults };
  } = {};

  constructor() {
    // Start auto-cleanup timer
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.CLEANUP_INTERVAL_MS);
  }

  startAction(actionType: string, actionLabel?: string, parentId?: string): string {
    const id = this.generateId();
    const now = Date.now();

    // If no parentId is provided, use the current active action as parent
    const effectiveParentId = parentId || this.getCurrentActionId();

    const depth = effectiveParentId ? (this.actions.get(effectiveParentId)?.depth ?? 0) + 1 : 0;

    const actionData: ActionTrackingData = {
      id,
      parentId: effectiveParentId,
      trackingType: "action",
      actionType,
      actionLabel,
      startTime: now,
      status: "running",
      depth,
      children: [],
    };

    this.actions.set(id, actionData);

    // Add to parent's children if there's a parent
    if (effectiveParentId) {
      const parent = this.actions.get(effectiveParentId);
      if (parent && !parent.children.includes(id)) {
        parent.children.push(id);
      }
    }

    // Push to action stack
    this.currentActionStack.push(id);

    this.notifySubscribers();
    return id;
  }

  endAction(trackingId: string, error?: string): void {
    const action = this.actions.get(trackingId);
    if (!action) {
      return;
    }

    const now = Date.now();
    action.endTime = now;
    action.duration = now - action.startTime;
    action.status = error ? "error" : "completed";
    if (error) {
      action.error = error;
    }

    // Remove from action stack
    const index = this.currentActionStack.indexOf(trackingId);
    if (index !== -1) {
      this.currentActionStack.splice(index, 1);
    }

    this.notifySubscribers();
  }

  getAllActions(): ActionTrackingData[] {
    return Array.from(this.actions.values()).sort((a, b) => a.startTime - b.startTime);
  }

  getFilteredActions(filter: {
    actionType?: string;
    trackingType?: "action" | "testSuite" | "test" | "testAssertion"; // New field for test filtering
    status?: "running" | "completed" | "error";
    minDuration?: number;
    maxDuration?: number;
    since?: number;
  }): ActionTrackingData[] {
    return this.getAllActions().filter((action) => {
      if (filter.actionType && action.actionType !== filter.actionType) {
        return false;
      }
      if (filter.trackingType && action.trackingType !== filter.trackingType) {
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
    this.actions.clear();
    this.currentActionStack = [];
    this.currentCompositeAction = undefined;
    this.currentAction = undefined;
    this.currentTestSuite = undefined;
    this.currentTest = undefined;
    this.currentTestAssertion = undefined;
    this.testAssertionsResults = {};
    this.notifySubscribers();
  }

  subscribe(callback: (actions: ActionTrackingData[]) => void): () => void;
  subscribe(callback: (context: TestTrackingData) => void): () => void;
  subscribe(
    callback: ((actions: ActionTrackingData[]) => void) | ((context: TestTrackingData) => void)
  ): () => void {
    // Determine if this is a TestTracker-style callback (single parameter) or ActionTracker-style (array parameter)
    const isTestCallback = callback.length === 1 && callback.toString().includes("context");

    if (isTestCallback) {
      // For test callbacks, convert ActionTrackingData[] to TestTrackingData
      const testCallback = callback as (context: TestTrackingData) => void;
      const wrappedCallback = (actions: ActionTrackingData[]) => {
        // Convert current tracking state to TestTrackingData format
        const testData: TestTrackingData = {
          testSuite: this.currentTestSuite,
          test: this.currentTest,
          testAssertion: this.currentTestAssertion,
          timestamp: Date.now(),
        };
        testCallback(testData);
      };
      this.subscribers.add(wrappedCallback);
      return () => {
        this.subscribers.delete(wrappedCallback);
      };
    } else {
      // Standard ActionTracker callback
      const actionCallback = callback as (actions: ActionTrackingData[]) => void;
      this.subscribers.add(actionCallback);
      return () => {
        this.subscribers.delete(actionCallback);
      };
    }
  }

  getCurrentActionId(): string | undefined {
    return this.currentActionStack[this.currentActionStack.length - 1];
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

  // Test-specific methods for backwards compatibility with TestTracker
  startTestSuite(testSuite: string, parentId?: string): string {
    const id = this.generateId();
    const now = Date.now();

    const effectiveParentId = parentId || this.getCurrentActionId();
    const depth = effectiveParentId ? (this.actions.get(effectiveParentId)?.depth ?? 0) + 1 : 0;

    const testSuiteData: ActionTrackingData = {
      id,
      parentId: effectiveParentId,
      trackingType: "testSuite",
      actionType: "testSuite",
      actionLabel: testSuite,
      testSuite,
      startTime: now,
      status: "running",
      depth,
      children: [],
    };

    this.actions.set(id, testSuiteData);

    if (effectiveParentId) {
      const parent = this.actions.get(effectiveParentId);
      if (parent && !parent.children.includes(id)) {
        parent.children.push(id);
      }
    }

    this.currentActionStack.push(id);
    this.currentTestSuite = testSuite;
    this.notifySubscribers();
    return id;
  }

  startTest(test: string, parentId?: string): string {
    const id = this.generateId();
    const now = Date.now();

    const effectiveParentId = parentId || this.getCurrentActionId();
    const depth = effectiveParentId ? (this.actions.get(effectiveParentId)?.depth ?? 0) + 1 : 0;

    const testData: ActionTrackingData = {
      id,
      parentId: effectiveParentId,
      trackingType: "test",
      actionType: "test",
      actionLabel: test,
      testSuite: this.currentTestSuite,
      test,
      startTime: now,
      status: "running",
      depth,
      children: [],
    };

    this.actions.set(id, testData);

    if (effectiveParentId) {
      const parent = this.actions.get(effectiveParentId);
      if (parent && !parent.children.includes(id)) {
        parent.children.push(id);
      }
    }

    this.currentActionStack.push(id);
    this.currentTest = test;
    this.notifySubscribers();
    return id;
  }

  startTestAssertion(testAssertion: string, parentId?: string): string {
    const id = this.generateId();
    const now = Date.now();

    const effectiveParentId = parentId || this.getCurrentActionId();
    const depth = effectiveParentId ? (this.actions.get(effectiveParentId)?.depth ?? 0) + 1 : 0;

    const testAssertionData: ActionTrackingData = {
      id,
      parentId: effectiveParentId,
      trackingType: "testAssertion",
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

    this.actions.set(id, testAssertionData);

    if (effectiveParentId) {
      const parent = this.actions.get(effectiveParentId);
      if (parent && !parent.children.includes(id)) {
        parent.children.push(id);
      }
    }

    this.currentActionStack.push(id);
    this.currentTestAssertion = testAssertion;
    this.notifySubscribers();
    return id;
  }

  setTestAssertionResult(trackingId: string, result: TestAssertionResult): void;
  setTestAssertionResult(testAssertionResult: TestAssertionResult): void;
  setTestAssertionResult(param1: string | TestAssertionResult, param2?: TestAssertionResult): void {
    let trackingId: string | undefined;
    let result: TestAssertionResult;

    if (typeof param1 === "string") {
      // New signature: (trackingId: string, result: TestAssertionResult)
      trackingId = param1;
      result = param2!;
    } else {
      // Original TestTracker signature: (testAssertionResult: TestAssertionResult)
      result = param1;
      // Use current context to find the active test assertion
      trackingId = this.getCurrentActionId();
    }

    if (trackingId) {
      const action = this.actions.get(trackingId);
      if (action && action.trackingType === "testAssertion") {
        // Update the action data
        action.status = result.assertionResult === "ok" ? "completed" : "error";
        action.endTime = Date.now();
        action.duration = action.endTime - action.startTime;

        // Store in test assertions results (TestTracker compatibility)
        const testSuite = action.testSuite || this.currentTestSuite;
        const test = action.test || this.currentTest;

        if (testSuite && test && result.assertionName) {
          if (!this.testAssertionsResults[testSuite]) {
            this.testAssertionsResults[testSuite] = {};
          }
          if (!this.testAssertionsResults[testSuite][test]) {
            this.testAssertionsResults[testSuite][test] = {};
          }
          if (!this.testAssertionsResults[testSuite][test][result.assertionName]) {
            this.testAssertionsResults[testSuite][test][result.assertionName] = result;
          } else {
            throw new Error("Test Assertion already defined");
          }
        }

        this.notifySubscribers();
        return;
      }
    }

    // Fallback: use current context like original TestTracker
    const testSuite = this.getTestSuite();
    const test = this.getTest();

    console.log(
      "RunActionTracker.setTestAssertionResult called for",
      testSuite,
      test,
      "testAssertionResult",
      JSON.stringify(result, null, 2)
    );

    if (testSuite === undefined || test === undefined || result.assertionName === undefined) {
      throw new Error(
        "TestSuite or Test not defined: suite=" +
          testSuite +
          ", test=" +
          test +
          ", assertion=" +
          result.assertionName
      );
    }

    if (!this.testAssertionsResults[testSuite]) {
      this.testAssertionsResults[testSuite] = {};
    }
    if (!this.testAssertionsResults[testSuite][test]) {
      this.testAssertionsResults[testSuite][test] = {};
    }
    if (!this.testAssertionsResults[testSuite][test][result.assertionName]) {
      this.testAssertionsResults[testSuite][test][result.assertionName] = result;
    } else {
      throw new Error("Test Assertion already defined");
    }

    this.notifySubscribers();
  }

  getTestResult(testSuite: string, test: string): TestResult {
    if (!this.testAssertionsResults[testSuite] || !this.testAssertionsResults[testSuite][test]) {
      throw new Error("Test not defined: " + test + " in " + testSuite);
    }

    const testResult = Object.values(this.testAssertionsResults[testSuite][test]).some(
      (testResult) => testResult.assertionResult === "error"
    )
      ? "error"
      : "ok";

    return {
      testLabel: test,
      testResult,
      testAssertionsResults: this.testAssertionsResults[testSuite][test],
    };
  }

  getTestSuiteResult(testSuite: string): TestSuiteResult {
    if (!this.testAssertionsResults[testSuite]) {
      throw new Error(
        "TestSuite is not defined: " +
          testSuite +
          " in results " +
          JSON.stringify(this.testAssertionsResults, null, 2)
      );
    }

    const testsResults: TestsResults = {};
    for (const test in this.testAssertionsResults[testSuite]) {
      testsResults[test] = this.getTestResult(testSuite, test);
    }

    return {
      [testSuite]: testsResults,
    };
  }

  getTestAssertionsResults(): { [testSuite: string]: { [test: string]: TestAssertionsResults } } {
    return this.testAssertionsResults;
  }

  // Test context methods (for TestTracker compatibility)
  setTestSuite(testSuite: string | undefined): void {
    this.currentTestSuite = testSuite;
    this.notifySubscribers();
  }

  getTestSuite(): string | undefined {
    return this.currentTestSuite;
  }

  setTest(test: string | undefined): void {
    this.currentTest = test;
    this.notifySubscribers();
  }

  getTest(): string | undefined {
    return this.currentTest;
  }

  setTestAssertion(testAssertion: string | undefined): void {
    this.currentTestAssertion = testAssertion;
    this.notifySubscribers();
  }

  getTestAssertion(): string | undefined {
    return this.currentTestAssertion;
  }

  resetResults(): void {
    this.testAssertionsResults = {};
  }

  resetContext(): void {
    this.currentTestSuite = undefined;
    this.currentTest = undefined;
    this.currentTestAssertion = undefined;
    this.notifySubscribers();
  }

  private generateId(): string {
    return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private notifySubscribers(): void {
    const actions = this.getAllActions();
    this.subscribers.forEach((callback) => {
      try {
        callback(actions);
      } catch (error) {
        console.error("Error in RunActionTracker subscriber:", error);
      }
    });
  }

  private cleanup(): void {
    const now = Date.now();
    const cutoff = now - this.MAX_AGE_MS;

    // Find actions to remove (completed/error actions older than MAX_AGE_MS)
    const toRemove: string[] = [];

    for (const [id, action] of this.actions.entries()) {
      if (action.status !== "running" && action.startTime < cutoff) {
        toRemove.push(id);
      }
    }

    // Remove old actions and update parent references
    toRemove.forEach((id) => {
      const action = this.actions.get(id);
      if (action?.parentId) {
        const parent = this.actions.get(action.parentId);
        if (parent) {
          const index = parent.children.indexOf(id);
          if (index !== -1) {
            parent.children.splice(index, 1);
          }
        }
      }
      this.actions.delete(id);
    });

    if (toRemove.length > 0) {
      this.notifySubscribers();
    }
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
