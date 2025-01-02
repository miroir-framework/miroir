export class TestEnvironment {
  private static testSuite: string | undefined = undefined;
  private static test: string | undefined = undefined;
  private static testAssertion: string | undefined = undefined;

  public static testLogLabel: string = "";

  public static reset(): void {
    TestEnvironment.testSuite = undefined;
    TestEnvironment.test = undefined;
    TestEnvironment.testAssertion = undefined;
    TestEnvironment.testLogLabel = "";
  }
  
  public static getTestLogLabel(): string {
    return TestEnvironment.testLogLabel;
  }
  
  public static computeTestLogLabel(): string {
    return TestEnvironment.testSuite + "." + TestEnvironment.test + "." + TestEnvironment.testAssertion;
  }

  public static getTestSuite(): string | undefined {
    return TestEnvironment.testSuite;
  }

  public static getTest(): string | undefined{
    return TestEnvironment.test;
  }

  public static getTestAssertion(): string | undefined {
    return TestEnvironment.testAssertion;
  }

  public static setTestSuite(testSuite: string | undefined): void {
    TestEnvironment.testSuite = testSuite;
    TestEnvironment.testLogLabel = TestEnvironment.computeTestLogLabel();
  }

  public static setTest(test: string | undefined): void {
    TestEnvironment.test = test;
    TestEnvironment.testLogLabel = TestEnvironment.computeTestLogLabel();
  }

  public static setTestAssertion(testAssertion: string | undefined): void {
    TestEnvironment.testAssertion = testAssertion;
    TestEnvironment.testLogLabel = TestEnvironment.computeTestLogLabel();
  }
}