import { FactoryLevels, LoggerInterface, SomeLevel } from "../0_interfaces/4-services/LoggerInterface";
import { LoggerContextElement, LoggerGlobalContext } from "./LoggerContext";
import { ActionOrTestLogServiceInterface } from "../3_controllers/MiroirLogService";

/**
 * Enhanced LoggerFilter that integrates with MiroirLogService to capture logs for specific actions
 */
export class ActionAwareLoggerFilter implements LoggerInterface {
  constructor(
    private readonly logger: LoggerInterface,
    private contextFilter: LoggerContextElement,
    public readonly name: string,
    public readonly level: FactoryLevels[keyof FactoryLevels],
    public readonly levels: FactoryLevels,
    private actionLogService?: ActionOrTestLogServiceInterface
  ) {}

  disable(): void {
    this.logger.disable();
  }

  enable(): void {
    this.logger.enable();
  }
  
  private filter(
    loggerMethod: (...msg: any[]) => void, 
    level: 'trace' | 'debug' | 'info' | 'warn' | 'error',
    ...msg: any[]
  ): void {
    // Apply context filtering
    if (
      (!this.contextFilter?.testSuite || LoggerGlobalContext.getTestSuite() == this.contextFilter?.testSuite) &&
      (!this.contextFilter?.test || LoggerGlobalContext.getTest() == this.contextFilter?.test) &&
      (!this.contextFilter?.testAssertion || LoggerGlobalContext.getTestAssertion() == this.contextFilter?.testAssertion)
    ) {
      // Log to console/original destination
      loggerMethod(...msg);
      
      // Also capture for action logging if service is available
      if (this.actionLogService) {
        const message = msg.length > 0 ? String(msg[0]) : '';
        const args = msg.slice(1);
        this.actionLogService.logForCurrentActionOrTest(level, this.name, message, ...args);
      }
    }
  }

  /**
   * Output trace message to console.
   * This will also include a full stack trace
   *
   * @param msg any data to log to the console
   */
  trace(...msg: any[]): void {
    this.filter(this.logger.trace.bind(this.logger), 'trace', ...msg);
  }

  /**
   * Output debug message to console including appropriate icons
   *
   * @param msg any data to log to the console
   */
  debug(...msg: any[]): void {
    this.filter(this.logger.debug.bind(this.logger), 'debug', ...msg);
  }

  /**
   * Output debug message to console including appropriate icons
   *
   * @param msg any data to log to the console
   */
  log(...msg: any[]): void {
    this.filter(this.logger.log.bind(this.logger), 'debug', ...msg);
  }

  /**
   * Output info message to console including appropriate icons
   *
   * @param msg any data to log to the console
   */
  info(...msg: any[]): void {
    this.filter(this.logger.info.bind(this.logger), 'info', ...msg);
  }

  /**
   * Output warn message to console including appropriate icons
   *
   * @param msg any data to log to the console
   */
  warn(...msg: any[]): void {
    this.filter(this.logger.warn.bind(this.logger), 'warn', ...msg);
  }

  /**
   * Output error message to console including appropriate icons
   *
   * @param msg any data to log to the console
   */
  error(...msg: any[]): void {
    this.filter(this.logger.error.bind(this.logger), 'error', ...msg);
  }
}
