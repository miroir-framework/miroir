import { MiroirEventServiceInterface } from "../3_controllers/MiroirEventService";
// import { TestLogServiceInterface } from "../3_controllers/TestLogService";
import { MiroirActivityTrackerInterface } from "../0_interfaces/3_controllers/MiroirActivityTrackerInterface";

/**
 * Configuration for ConsoleInterceptor
 */
export interface LogInterceptorConfig {
  eventHandlers?: {
    actionOrTestLogService: MiroirEventServiceInterface;
    actionOrTestTracker: MiroirActivityTrackerInterface;
  };
}

/**
 * Unified logging interceptor that captures logs during action and/or test execution
 * This works by intercepting console methods when actions or tests are active
 */
export class ConsoleInterceptor {
  private originalConsole: {
    trace: typeof console.trace;
    debug: typeof console.debug;
    log: typeof console.log;
    info: typeof console.info;
    warn: typeof console.warn;
    error: typeof console.error;
  };

  private isIntercepting = false;

  constructor(private config: LogInterceptorConfig) {
    // Store original console methods
    this.originalConsole = {
      trace: console.trace.bind(console),
      debug: console.debug.bind(console),
      log: console.log.bind(console),
      info: console.info.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console)
    };
  }

  /**
   * Start intercepting console logs to capture them for action and/or test tracking
   */
  start(): void {
    if (this.isIntercepting) {
      return;
    }

    this.isIntercepting = true;

    // Intercept console methods
    console.trace = this.createInterceptor('trace', this.originalConsole.trace);
    console.debug = this.createInterceptor('debug', this.originalConsole.debug);
    console.log = this.createInterceptor('info', this.originalConsole.log);
    console.info = this.createInterceptor('info', this.originalConsole.info);
    console.warn = this.createInterceptor('warn', this.originalConsole.warn);
    console.error = this.createInterceptor('error', this.originalConsole.error);
  }

  /**
   * Stop intercepting console logs
   */
  stop(): void {
    if (!this.isIntercepting) {
      return;
    }

    this.isIntercepting = false;

    // Restore original console methods
    console.trace = this.originalConsole.trace;
    console.debug = this.originalConsole.debug;
    console.log = this.originalConsole.log;
    console.info = this.originalConsole.info;
    console.warn = this.originalConsole.warn;
    console.error = this.originalConsole.error;
  }

  /**
   * Extract logger name from formatted log message
   * Pattern: [timestamp] level (loggerName) - message
   */
  private extractLoggerName(message: string): string {
    try {
      const match = message.match(/\[.*?\]\s+\w+\s+\(([^)]+)\)\s+-/);
      return match ? match[1] : 'console';
    } catch (error) {
      return 'console';
    }
  }

  /**
   * Create an interceptor function for a specific console method
   */
  private createInterceptor(
    level: 'trace' | 'debug' | 'info' | 'warn' | 'error', 
    originalMethod: (...args: any[]) => void
  ) {
    return (...args: any[]) => {
      // Always call the original method first
      originalMethod(...args);

      const message = args.length > 0 ? String(args[0]) : '';
      const restArgs = args.slice(1);
      const loggerName = this.extractLoggerName(message); // TODO: remove this, intercept at LoggerInterface level

      // Check for active action and log if action logging is configured
      if (this.config.eventHandlers) {
        const currentActionId = this.config.eventHandlers.actionOrTestTracker.getCurrentActivityId();
        if (currentActionId) {
          this.config.eventHandlers.actionOrTestLogService.pushLogToEvent(level, loggerName, message, ...restArgs);
        }
      }

    //   // // Check for active test and log if test logging is configured
    //   if (this.config.actionOrTest) {
    //     const currentTest = this.config.actionOrTest.actionOrTestTracker.getTest();
    //   //   // console.log('ConsoleInterceptor Logging for test:', currentTest);
    //   //   // const currentTest = this.config.actionorTest.runActionTracker.getCurrentEventId();
    //     if (currentTest) {
    //       console.log('ConsoleInterceptor Logging for test:', currentTest, level, loggerName, message, ...restArgs);
    //   //     this.config.actionOrTest.actionLogService.logForCurrentActionOrTest(level, loggerName, message, ...restArgs);
    //     }
    //   }
    };
  }

  /**
   * Destroy the interceptor and restore original console methods
   */
  destroy(): void {
    this.stop();
  }
}


// Legacy exports for backward compatibility
export const ActionLogInterceptor = ConsoleInterceptor;
export const TestLogInterceptor = ConsoleInterceptor;
