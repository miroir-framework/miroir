import { FactoryLevels, LoggerInterface, SomeLevel } from "../0_interfaces/4-services/LoggerInterface.js";
import { LoggerContextElement, LoggerGlobalContext } from "./LoggerContext.js";

export class LoggerFilter implements LoggerInterface {
  constructor(
    private readonly logger: LoggerInterface,
    private contextFilter: LoggerContextElement,
    public readonly name: string,
    public readonly level: FactoryLevels[keyof FactoryLevels],
    public readonly levels: FactoryLevels,
  ) {

  }


  // get name(): string{
  //   return "";
  // }
  // get level(): FactoryLevels[keyof FactoryLevels] {
  //   return 0;
  // }
  // get levels(): FactoryLevels {
  //   return {DEBUG: 0, ERROR: 0, INFO: 0, SILENT: 0, TRACE
  //   : 0, WARN: 0};
  // }
  // set level(logLevel: SomeLevel) {

  // }

  disable(): void {

  }
  enable(): void {

  }
  
  private filter(logger: (...msg: any[]) => void, ...msg: any[]): void {
    // logger("FILTER", this.contextFilter?.testSuite, LoggerGlobalContext.getTestSuite());
    if (
      (!this.contextFilter?.testSuite || LoggerGlobalContext.getTestSuite() == this.contextFilter?.testSuite) &&
      (!this.contextFilter?.test || LoggerGlobalContext.getTest() == this.contextFilter?.test) &&
      (!this.contextFilter?.testAssertion || LoggerGlobalContext.getTestAssertion() == this.contextFilter?.testAssertion)
    ) {
      logger(...msg);
    }
    // else {
    //   logger("FILTERED OUT", this.contextFilter?.testSuite, LoggerGlobalContext.getTestSuite());
    // }
  }

  /**
   * Output debug message to console including appropriate icons
   *
   * @param msg any data to log to the console
   */
  debug(...msg: any[]): void {
      // this.logger.debug(...msg);
    this.filter(this.logger.debug, ...msg);
  }

  /**
   * Output debug message to console including appropriate icons
   *
   * @param msg any data to log to the console
   */
  log(...msg: any[]): void {
    this.filter(this.logger.log, ...msg);
    // if (!this.contextFilter?.testSuite || LoggerGlobalContext.getTestSuite() == this.contextFilter?.testSuite) {
    //   this.logger.log(...msg);
    // }
  }

  /**
   * Output info message to console including appropriate icons
   *
   * @param msg any data to log to the console
   */
  info(...msg: any[]): void {
    this.filter(this.logger.info, ...msg);
    // this.logger.info(...msg);
  }

  /**
 * Output trace message to console.
 * This will also include a full stack trace
 *
 * @param msg any data to log to the console
 */
  trace(...msg: any[]): void {
    this.filter(this.logger.trace, ...msg);
    // this.logger.trace(...msg);
  }

  /**
   * Output warn message to console including appropriate icons
   *
   * @param msg any data to log to the console
   */
  warn(...msg: any[]): void {
    this.filter(this.logger.warn, ...msg);
    // this.logger.warn(...msg);
  }

  /**
   * Output error message to console including appropriate icons
   *
   * @param msg any data to log to the console
   */
  error(...msg: any[]): void {
    this.filter(this.logger.error, ...msg);
    // this.logger.error(...msg);
  }
  
}