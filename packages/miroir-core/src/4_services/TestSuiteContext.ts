// import {
//   TestAssertionResult,
//   TestAssertionsResults,
//   TestResult,
//   TestsResults,
//   TestSuiteResult
// } from "../0_interfaces/4-services/TestInterface";
import {
  TestAssertionResult,
  TestAssertionsResults,
  TestResult,
  TestsResults,
  TestSuiteResult,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { LoggerGlobalContext } from "./LoggerContext";

export class TestSuiteContext {
  public static testAssertionsResults: { [testSuite: string]: { [test: string]: TestAssertionsResults } } = {};

  public static testLogLabel: string = "";

  public static resetContext(): void {
    LoggerGlobalContext.reset();
  }

  public static testSuitePathName(testSuitePath: string[]): string {
    return testSuitePath.join("#");
  }

  public static resetResults(): void {
    // console.log("TestSuiteContext.resetResults!!");
    TestSuiteContext.testAssertionsResults = {};
  }

  public static getTestAssertionsResults(): { [testSuite: string]: { [test: string]: TestAssertionsResults } } {
    return TestSuiteContext.testAssertionsResults;
  }

  public static setTestAssertionResult(testAssertionResult: TestAssertionResult): void {
    const testSuite = TestSuiteContext.getTestSuite();
    const test = TestSuiteContext.getTest();
    // const testSuite = LoggerGlobalContext.getTestSuite();
    // const test = LoggerGlobalContext.getTest();
    console.log("TestSuiteContext.setTestAssertionResult called for", testSuite, test, testAssertionResult.assertionName);
    if (testSuite === undefined || test === undefined || testAssertionResult.assertionName === undefined) {
      throw new Error("TestSuite or Test not defined: suite=" + testSuite + ", test=" + test + ", assertion=" + testAssertionResult.assertionName);
    }
    if (!TestSuiteContext.testAssertionsResults[testSuite]) {
      TestSuiteContext.testAssertionsResults[testSuite] = {};
    }
    if (!TestSuiteContext.testAssertionsResults[testSuite][test]) {
      TestSuiteContext.testAssertionsResults[testSuite][test] = {};
    }
    if (!TestSuiteContext.testAssertionsResults[testSuite][test][testAssertionResult.assertionName]) {
      TestSuiteContext.testAssertionsResults[testSuite][test][testAssertionResult.assertionName] = testAssertionResult;
      // console.log("TestSuiteContext.setTestAssertionResult modified for", testSuite, test, testAssertionResult.assertionName, "added", JSON.stringify(TestSuiteContext.testAssertionsResults, null, 2));
    } else {
      throw new Error("Test Assertion already defined");
    }
  }

  public static getTestResult(testSuite: string, test: string): TestResult {
    if (
      !TestSuiteContext.testAssertionsResults[testSuite] ||
      !TestSuiteContext.testAssertionsResults[testSuite][test]
    ) {
      throw new Error("Test not defined: " + test + " in " + testSuite);
    }
    const testResult = Object.values(TestSuiteContext.testAssertionsResults[testSuite][test]).some(
      (testResult) => testResult.assertionResult === "error"
    )
      ? "error"
      : "ok";
    return {
      testLabel: test,
      testResult,
      testAssertionsResults: TestSuiteContext.testAssertionsResults[testSuite][test],
    };
  }

  // ##############################################################################################
  public static getTestSuiteResult(testSuite: string): TestSuiteResult {
    if (!TestSuiteContext.testAssertionsResults[testSuite]) {
      throw new Error(
        "TestSuite is not defined: " +
          testSuite +
          " in results " +
          JSON.stringify(TestSuiteContext.testAssertionsResults, null, 2)
      );
    }
    const testsResults: TestsResults = {};
    for (const test in TestSuiteContext.testAssertionsResults[testSuite]) {
      testsResults[test] = TestSuiteContext.getTestResult(testSuite, test);
    }
    return {
      [testSuite]: testsResults,
    };
  }

  public static getTestSuite(): string | undefined {
    return LoggerGlobalContext.getTestSuite();
  }

  public static getTest(): string | undefined {
    return LoggerGlobalContext.getTest();
  }

  public static getTestAssertion(): string | undefined {
    return LoggerGlobalContext.getTestAssertion();
  }

  public static setTestSuite(testSuite: string | undefined): void {
    console.log("TestSuiteContext.setTestSuite", testSuite);
    LoggerGlobalContext.setTestSuite(testSuite);
  }

  public static setTest(test: string | undefined): void {
    LoggerGlobalContext.setTest(test);
  }

  public static setTestAssertion(testAssertion: string | undefined): void {
    LoggerGlobalContext.setTestAssertion(testAssertion);
  }
}
