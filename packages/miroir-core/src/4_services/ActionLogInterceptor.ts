import { ActionLogServiceInterface } from "../3_controllers/ActionLogService";
import { RunActionTrackerInterface } from "../0_interfaces/3_controllers/RunActionTrackerInterface";
import { LoggerGlobalContext } from "./LoggerContext";

/**
 * Global logging interceptor that captures logs during action execution
 * This works by intercepting console methods when actions are active
 */
export class ActionLogInterceptor {
  private originalConsole: {
    trace: typeof console.trace;
    debug: typeof console.debug;
    log: typeof console.log;
    info: typeof console.info;
    warn: typeof console.warn;
    error: typeof console.error;
  };

  private isIntercepting = false;

  constructor(
    private actionLogService: ActionLogServiceInterface,
    private runActionTracker: RunActionTrackerInterface
  ) {
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
   * Start intercepting console logs to capture them for action tracking
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
   * TODO #102: the message is parsed to extract the logger name, this is very fragile
   * 
   * TODO #102: better approach is to wrap loggers at creation time? or in the opposite direction?
   *  see ActionAwareLoggerWrapper below for the first.
   * 
   * 
   */
  private createInterceptor(
    level: 'trace' | 'debug' | 'info' | 'warn' | 'error', 
    originalMethod: (...args: any[]) => void
  ) {
    return (...args: any[]) => {
      // Always call the original method first
      originalMethod(...args);

      // If we have an active action, also capture for action logging
      const currentActionId = this.runActionTracker.getCurrentActionId();
      if (currentActionId) {
        const message = args.length > 0 ? String(args[0]) : '';
        const restArgs = args.slice(1);
        
        // Extract logger name from the message if it follows the pattern
        let loggerName = 'console';
        try {
          // Try to extract logger name from formatted log message
          // Pattern: [timestamp] level (loggerName) - message
          const messageStr = String(message);
          const match = messageStr.match(/\[.*?\]\s+\w+\s+\(([^)]+)\)\s+-/);
          if (match) {
            loggerName = match[1];
          }
        } catch (error) {
          // Ignore extraction errors
        }

        this.actionLogService.logForCurrentAction(level, loggerName, message, ...restArgs);
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
 * Alternative approach: Logger wrapper that can be used with MiroirLoggerFactory
 * This wraps existing loggers to add action logging capability
 */
export class ActionAwareLoggerWrapper {
  constructor(
    private actionLogService: ActionLogServiceInterface,
    private runActionTracker: RunActionTrackerInterface
  ) {}

  /**
   * Wrap an existing logger to add action logging capability
   */
  wrapLogger(logger: any, loggerName: string): any {
    const actionLogService = this.actionLogService;
    const runActionTracker = this.runActionTracker;

    return new Proxy(logger, {
      get(target, prop, receiver) {
        const originalValue = Reflect.get(target, prop, receiver);

        // Only intercept logging methods
        if (typeof originalValue === 'function' && 
            ['trace', 'debug', 'log', 'info', 'warn', 'error'].includes(prop as string)) {
          
          return function(...args: any[]) {
            // Call original method
            const result = originalValue.apply(target, args);

            // Capture for action logging if we have an active action
            const currentActionId = runActionTracker.getCurrentActionId();
            if (currentActionId) {
              const level = prop === 'log' ? 'debug' : prop as 'trace' | 'debug' | 'info' | 'warn' | 'error';
              const message = args.length > 0 ? String(args[0]) : '';
              const restArgs = args.slice(1);
              actionLogService.logForCurrentAction(level, loggerName, message, ...restArgs);
            }

            return result;
          };
        }

        return originalValue;
      }
    });
  }

  /**
   * Create a global logger wrapper function that can be used in MiroirLoggerFactory
   */
  createGlobalLoggerWrapper(): (logger: any, loggerName: string) => any {
    return (logger: any, loggerName: string) => this.wrapLogger(logger, loggerName);
  }
}
