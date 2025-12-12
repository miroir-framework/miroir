
export interface LoggerContextElement {
  testSuite: string | undefined;
  test: string | undefined;
  testAssertion: string | undefined;
  compositeActionSequence: string | undefined;
  action: string | undefined;
  // testLogLabel: string | undefined;
}

export const defaultLoggerContextElement: LoggerContextElement = {
  testSuite: undefined,
  test: undefined,
  testAssertion: undefined,
  // testLogLabel: undefined,
  compositeActionSequence: undefined,
  action: undefined,
};

export class LoggerGlobalContext {
  public static contextElement: LoggerContextElement = defaultLoggerContextElement;
  // private static testSuite: string | undefined = undefined;
  // private static test: string | undefined = undefined;
  // private static testAssertion: string | undefined = undefined;
  // private static compositeActionSequence: string | undefined = undefined;
  // private static action: string | undefined = undefined;

  public static testLogLabel: string = "";

  public static reset(): void {
    LoggerGlobalContext.contextElement = defaultLoggerContextElement;
  }
  
  public static getTestLogLabel(): string {
    return LoggerGlobalContext.testLogLabel;
  }
  
  public static computeTestLogLabel(): string {
    return (
      LoggerGlobalContext.contextElement?.testSuite +
      "." +
      LoggerGlobalContext.contextElement?.test +
      "." +
      LoggerGlobalContext.contextElement?.testAssertion
    );
  }

  public static getTestSuite(): string | undefined {
    return LoggerGlobalContext.contextElement?.testSuite;
  }

  public static getTest(): string | undefined{
    return LoggerGlobalContext.contextElement?.test;
  }

  public static getTestAssertion(): string | undefined {
    return LoggerGlobalContext.contextElement?.testAssertion;
  }

  public static getCompositeAction(): string | undefined {
    return LoggerGlobalContext.contextElement?.compositeActionSequence;
  }

  public static getAction(): string | undefined {
    return LoggerGlobalContext.contextElement?.action;
  }

  public static setTestSuite(testSuite: string | undefined): void {
    LoggerGlobalContext.contextElement.testSuite = testSuite;
    LoggerGlobalContext.testLogLabel = LoggerGlobalContext.computeTestLogLabel();
  }

  public static setTest(test: string | undefined): void {
    LoggerGlobalContext.contextElement.test = test;
    LoggerGlobalContext.testLogLabel = LoggerGlobalContext.computeTestLogLabel();
  }

  public static setTestAssertion(testAssertion: string | undefined): void {
    LoggerGlobalContext.contextElement.testAssertion = testAssertion;
    LoggerGlobalContext.testLogLabel = LoggerGlobalContext.computeTestLogLabel();
  }

  public static setCompositeAction(compositeActionSequence: string | undefined): void {
    LoggerGlobalContext.contextElement.compositeActionSequence = compositeActionSequence;
  }

  public static setAction(action: string | undefined): void {
    LoggerGlobalContext.contextElement.action = action;
  }
}