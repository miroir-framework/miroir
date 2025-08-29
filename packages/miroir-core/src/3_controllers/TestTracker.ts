import {
  TestTrackerInterface,
  TestTrackingData
} from "../0_interfaces/3_controllers/TestTrackerInterface";
import {
  TestAssertionResult,
  TestAssertionsResults,
  TestResult,
  TestsResults,
  TestSuiteResult,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

export class TestTracker implements TestTrackerInterface {
  private currentTestSuite: string | undefined = undefined;
  private currentTest: string | undefined = undefined;
  private currentTestAssertion: string | undefined = undefined;
  private testAssertionsResults: { [testSuite: string]: { [test: string]: TestAssertionsResults } } = {};
  private subscribers: Set<(context: TestTrackingData) => void> = new Set();

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

  setTestAssertionResult(testAssertionResult: TestAssertionResult): void {
    const testSuite = this.getTestSuite();
    const test = this.getTest();
    
    console.log("TestTracker.setTestAssertionResult called for", testSuite, test, "testAssertionResult", JSON.stringify(testAssertionResult, null, 2));
    
    if (testSuite === undefined || test === undefined || testAssertionResult.assertionName === undefined) {
      throw new Error("TestSuite or Test not defined: suite=" + testSuite + ", test=" + test + ", assertion=" + testAssertionResult.assertionName);
    }
    
    if (!this.testAssertionsResults[testSuite]) {
      this.testAssertionsResults[testSuite] = {};
    }
    if (!this.testAssertionsResults[testSuite][test]) {
      this.testAssertionsResults[testSuite][test] = {};
    }
    if (!this.testAssertionsResults[testSuite][test][testAssertionResult.assertionName]) {
      this.testAssertionsResults[testSuite][test][testAssertionResult.assertionName] = testAssertionResult;
    } else {
      throw new Error("Test Assertion already defined");
    }
  }

  getTestAssertionsResults(): { [testSuite: string]: { [test: string]: TestAssertionsResults } } {
    return this.testAssertionsResults;
  }

  getTestResult(testSuite: string, test: string): TestResult {
    if (
      !this.testAssertionsResults[testSuite] ||
      !this.testAssertionsResults[testSuite][test]
    ) {
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

  resetResults(): void {
    this.testAssertionsResults = {};
  }

  resetContext(): void {
    this.currentTestSuite = undefined;
    this.currentTest = undefined;
    this.currentTestAssertion = undefined;
    this.notifySubscribers();
  }

  subscribe(callback: (context: TestTrackingData) => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  clear(): void {
    this.resetContext();
    this.resetResults();
  }

  private notifySubscribers(): void {
    const context: TestTrackingData = {
      testSuite: this.currentTestSuite,
      test: this.currentTest,
      testAssertion: this.currentTestAssertion,
      timestamp: Date.now()
    };
    
    this.subscribers.forEach(callback => {
      try {
        callback(context);
      } catch (error) {
        console.error('Error in TestTracker subscriber:', error);
      }
    });
  }
}
