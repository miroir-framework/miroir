export class CurrentlyExecuting {
  private static testSuite: string | undefined = undefined;
  private static test: string | undefined = undefined;
  private static testAssertion: string | undefined = undefined;
  private static compositeAction: string | undefined = undefined;
  private static action: string | undefined = undefined;

  public static testLogLabel: string = "";

  public static reset(): void {
    CurrentlyExecuting.testSuite = undefined;
    CurrentlyExecuting.test = undefined;
    CurrentlyExecuting.testAssertion = undefined;
    CurrentlyExecuting.testLogLabel = "";
    CurrentlyExecuting.compositeAction = undefined;
    CurrentlyExecuting.action = undefined;
  }
  
  public static getTestLogLabel(): string {
    return CurrentlyExecuting.testLogLabel;
  }
  
  public static computeTestLogLabel(): string {
    return CurrentlyExecuting.testSuite + "." + CurrentlyExecuting.test + "." + CurrentlyExecuting.testAssertion;
  }

  public static getTestSuite(): string | undefined {
    return CurrentlyExecuting.testSuite;
  }

  public static getTest(): string | undefined{
    return CurrentlyExecuting.test;
  }

  public static getTestAssertion(): string | undefined {
    return CurrentlyExecuting.testAssertion;
  }

  public static getCompositeAction(): string | undefined {
    return CurrentlyExecuting.compositeAction;
  }

  public static getAction(): string | undefined {
    return CurrentlyExecuting.action;
  }

  public static setTestSuite(testSuite: string | undefined): void {
    CurrentlyExecuting.testSuite = testSuite;
    CurrentlyExecuting.testLogLabel = CurrentlyExecuting.computeTestLogLabel();
  }

  public static setTest(test: string | undefined): void {
    CurrentlyExecuting.test = test;
    CurrentlyExecuting.testLogLabel = CurrentlyExecuting.computeTestLogLabel();
  }

  public static setTestAssertion(testAssertion: string | undefined): void {
    CurrentlyExecuting.testAssertion = testAssertion;
    CurrentlyExecuting.testLogLabel = CurrentlyExecuting.computeTestLogLabel();
  }

  public static setCompositeAction(compositeAction: string | undefined): void {
    CurrentlyExecuting.compositeAction = compositeAction;
  }

  public static setAction(action: string | undefined): void {
    CurrentlyExecuting.action = action;
  }
}