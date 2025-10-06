import {
  FactoryLevels,
  LoggerInterface,
  SomeLevel,
  type LogLevel,
  type LogTopic,
} from "../0_interfaces/4-services/LoggerInterface";
import type { MiroirActivityTracker } from "../3_controllers/MiroirActivityTracker";
import type { MiroirEventService } from "../3_controllers/MiroirEventService";
import { LoggerContextElement, LoggerGlobalContext } from "./LoggerContext";

export class MiroirLogger implements LoggerInterface {
  constructor(
    private activityTracker: MiroirActivityTracker,
    private eventService: MiroirEventService,
    private readonly logger: LoggerInterface,
    private contextFilter: LoggerContextElement,
    public readonly name: string,
    public readonly level: FactoryLevels[keyof FactoryLevels],
    public readonly levels: FactoryLevels,
    public readonly topic: LogTopic | undefined
  ) {}

  disable(): void {}
  enable(): void {}

  private filter(level: LogLevel, logger: (...msg: any[]) => void, ...args: any[]): void {
    // logger("FILTER", this.contextFilter?.testSuite, LoggerGlobalContext.getTestSuite());
    // if (
    //   (!this.contextFilter?.testSuite || LoggerGlobalContext.getTestSuite() == this.contextFilter?.testSuite) &&
    //   (!this.contextFilter?.test || LoggerGlobalContext.getTest() == this.contextFilter?.test) &&
    //   (!this.contextFilter?.testAssertion || LoggerGlobalContext.getTestAssertion() == this.contextFilter?.testAssertion)
    // ) {
    //   logger(...args);
    // }

    const message = args.length > 0 ? String(args[0]) : "";
    const restArgs = args.slice(1);
    const loggerName = this.name; // TODO: remove this, intercept at LoggerInterface level

    const currentActivityId = this.activityTracker.getCurrentActivityId();
    const currentActivityTopic = this.activityTracker.getCurrentActivityTopic();
    // logger("CURRENT ACTIVITY TOPIC", currentActivityTopic, this.topic, level, loggerName, message, ...restArgs);
    if (currentActivityId && (!this.topic || this.topic === currentActivityTopic)) {
      logger(...args);
      this.eventService.pushLogToEvent(level, loggerName, message, ...restArgs);
    } else {
      logger(
        // "FILTERED OUT of activity",
        // currentActivityId,
        // "topic",
        // currentActivityTopic,
        // "loggerTopic",
        // this.topic,
        // "level",
        // level,
        // "loggerName",
        // loggerName,
        message,
        ...restArgs
      );
    }
  }

  /**
   * Output debug message to console including appropriate icons
   *
   * @param msg any data to log to the console
   */
  debug(...msg: any[]): void {
    // this.logger.debug(...msg);
    this.filter("debug", this.logger.debug, ...msg);
  }

  /**
   * Output debug message to console including appropriate icons
   *
   * @param msg any data to log to the console
   */
  log(...msg: any[]): void {
    this.filter("info", this.logger.log, ...msg);
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
    this.filter("info", this.logger.info, ...msg);
    // this.logger.info(...msg);
  }

  /**
   * Output trace message to console.
   * This will also include a full stack trace
   *
   * @param msg any data to log to the console
   */
  trace(...msg: any[]): void {
    this.filter("trace", this.logger.trace, ...msg);
    // this.logger.trace(...msg);
  }

  /**
   * Output warn message to console including appropriate icons
   *
   * @param msg any data to log to the console
   */
  warn(...msg: any[]): void {
    this.filter("warn", this.logger.warn, ...msg);
    // this.logger.warn(...msg);
  }

  /**
   * Output error message to console including appropriate icons
   *
   * @param msg any data to log to the console
   */
  error(...msg: any[]): void {
    this.filter("error", this.logger.error, ...msg);
    // this.logger.error(...msg);
  }
}
