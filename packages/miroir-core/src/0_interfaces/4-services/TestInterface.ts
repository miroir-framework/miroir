// export interface TestResult {

export interface TestAssertionResult {
  assertionName: string;
  assertionResult: "ok" | "error";
  assertionExpectedValue?: any;
  assertionActualValue?: any;
}

export type TestAssertionsResults = Record<string, TestAssertionResult>;

export interface TestResult {
  testLabel: string;
  testResult: "ok" | "error";
  // testAssertionResults: TestAssertionResult[];
  testAssertionsResults: TestAssertionsResults;
}

export type TestsResults = Record<string, TestResult>;

export type TestSuiteResult = Record<string, TestsResults>;

export type TestSuitesResults = Record<string, TestSuiteResult>;
