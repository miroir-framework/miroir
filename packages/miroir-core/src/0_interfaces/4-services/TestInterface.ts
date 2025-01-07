export interface TestResult {
  testLabel: string;
  testResult: "ok" | "error";
}

export type TestSuiteResult = Record<string, TestResult>;
