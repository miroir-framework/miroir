import { ActionLogServiceInterface } from "../3_controllers/ActionLogService";
import { TestLogServiceInterface } from "../3_controllers/TestLogService";
import { RunActionTrackerInterface } from "../0_interfaces/3_controllers/RunActionTrackerInterface";
import { TestTrackerInterface } from "../0_interfaces/3_controllers/TestTrackerInterface";

/**
 * Configuration for LogInterceptor
 */
export interface LogInterceptorConfig {
  action?: {
    actionLogService: ActionLogServiceInterface;
    runActionTracker: RunActionTrackerInterface;
  };
  test?: {
    testLogService: TestLogServiceInterface;
    testTracker: TestTrackerInterface;
  };
}

/**
 * Unified logging interceptor that captures logs during action and/or test execution
 * This works by intercepting console methods when actions or tests are active
 */
export class LogInterceptor {
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
      const loggerName = this.extractLoggerName(message);

      // Check for active action and log if action logging is configured
      if (this.config.action) {
        const currentActionId = this.config.action.runActionTracker.getCurrentActionId();
        if (currentActionId) {
          this.config.action.actionLogService.logForCurrentAction(level, loggerName, message, ...restArgs);
        }
      }

      // Check for active test and log if test logging is configured
      if (this.config.test) {
        const currentTest = this.config.test.testTracker.getTest();
        if (currentTest) {
          this.config.test.testLogService.logForCurrentTest(level, loggerName, message, ...restArgs);
        }
      }
    };
  }

  /**
   * Destroy the interceptor and restore original console methods
   */
  destroy(): void {
    this.stop();
  }
}

/**
 * Abstract logger wrapper base class
 */
abstract class LoggerWrapperBase {
  /**
   * Wrap an existing logger to add logging capability
   */
  wrapLogger(logger: any, loggerName: string): any {
    return new Proxy(logger, {
      get: (target, prop, receiver) => {
        const originalValue = Reflect.get(target, prop, receiver);

        // Only intercept logging methods
        if (typeof originalValue === 'function' && 
            ['trace', 'debug', 'log', 'info', 'warn', 'error'].includes(prop as string)) {
          
          return (...args: any[]) => {
            // Call original method
            const result = originalValue.apply(target, args);

            // Check if we should capture this log
            if (this.shouldCapture()) {
              const level = prop === 'log' ? 'debug' : prop as 'trace' | 'debug' | 'info' | 'warn' | 'error';
              const message = args.length > 0 ? String(args[0]) : '';
              const restArgs = args.slice(1);
              this.captureLog(level, loggerName, message, ...restArgs);
            }

            return result;
          };
        }

        return originalValue;
      }
    });
  }

  /**
   * Create a global logger wrapper function
   */
  createGlobalLoggerWrapper(): (logger: any, loggerName: string) => any {
    return (logger: any, loggerName: string) => this.wrapLogger(logger, loggerName);
  }

  protected abstract shouldCapture(): boolean;
  protected abstract captureLog(level: 'trace' | 'debug' | 'info' | 'warn' | 'error', loggerName: string, message: string, ...restArgs: any[]): void;
}

/**
 * Action-aware logger wrapper that can be used with MiroirLoggerFactory
 * This wraps existing loggers to add action logging capability
 */
export class ActionAwareLoggerWrapper extends LoggerWrapperBase {
  constructor(
    private actionLogService: ActionLogServiceInterface,
    private runActionTracker: RunActionTrackerInterface
  ) {
    super();
  }

  protected shouldCapture(): boolean {
    return !!this.runActionTracker.getCurrentActionId();
  }

  protected captureLog(level: 'trace' | 'debug' | 'info' | 'warn' | 'error', loggerName: string, message: string, ...restArgs: any[]): void {
    this.actionLogService.logForCurrentAction(level, loggerName, message, ...restArgs);
  }
}

/**
 * Test-aware logger wrapper that can be used with MiroirLoggerFactory
 * This wraps existing loggers to add test logging capability
 */
export class TestAwareLoggerWrapper extends LoggerWrapperBase {
  constructor(
    private testLogService: TestLogServiceInterface,
    private testTracker: TestTrackerInterface
  ) {
    super();
  }

  protected shouldCapture(): boolean {
    return !!this.testTracker.getTest();
  }

  protected captureLog(level: 'trace' | 'debug' | 'info' | 'warn' | 'error', loggerName: string, message: string, ...restArgs: any[]): void {
    this.testLogService.logForCurrentTest(level, loggerName, message, ...restArgs);
  }
}

// Legacy exports for backward compatibility
export const ActionLogInterceptor = LogInterceptor;
export const TestLogInterceptor = LogInterceptor;
