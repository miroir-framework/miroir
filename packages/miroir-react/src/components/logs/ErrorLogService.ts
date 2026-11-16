// ##############################################################################################
// Global Error Log Service for consistent error handling and tracking
// ##############################################################################################

import { LoggerInterface, MiroirLoggerFactory } from "@miroir-framework/core";
import { packageName, cleanLevel } from "../../constants.js";

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "ErrorLogService");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName, "UI").then((logger: LoggerInterface) => { log = logger; });

export interface ErrorLogEntry {
  id: string;
  timestamp: string;
  errorType: string;
  errorMessage: string;
  category: 'startup' | 'server' | 'client' | 'network' | 'validation' | 'unknown';
  severity: 'info' | 'warning' | 'error' | 'critical';
  stack?: string;
  context?: Record<string, any>;
  isResolved?: boolean;
  userMessage?: string;
  originalError?: any;
}

export interface ErrorNotificationOptions {
  showSnackbar?: boolean;
  persistError?: boolean;
  severity?: 'info' | 'warning' | 'error' | 'critical';
  category?: ErrorLogEntry['category'];
  context?: Record<string, any>;
  userMessage?: string;
}

export class ErrorLogServiceClass {
  private errorLogs: ErrorLogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 errors
  private subscribers: Array<(error: ErrorLogEntry) => void> = [];

  /**
   * Add a new error to the global error log
   */
  logError(
    error: Error | string,
    options: ErrorNotificationOptions = {}
  ): ErrorLogEntry {
    const {
      severity = 'error',
      category = 'unknown',
      context = {},
      userMessage,
      persistError = true
    } = options;

    const errorEntry: ErrorLogEntry = {
      id: this.generateErrorId(),
      timestamp: new Date().toISOString(),
      errorType: error instanceof Error ? error.constructor.name : 'StringError',
      errorMessage: error instanceof Error ? error.message : error.toString(),
      category,
      severity,
      stack: error instanceof Error ? error.stack : undefined,
      context,
      isResolved: false,
      userMessage,
      originalError: error instanceof Error ? {
        name: error.name,
        message: error.message,
        ...(error as any) // Preserve any custom properties
      } : error
    };

    if (persistError) {
      // Add to logs and maintain max size
      this.errorLogs.unshift(errorEntry);
      if (this.errorLogs.length > this.maxLogs) {
        this.errorLogs = this.errorLogs.slice(0, this.maxLogs);
      }
    }

    // Log to console with appropriate level
    this.logToConsole(errorEntry);

    // Notify subscribers
    this.notifySubscribers(errorEntry);

    return errorEntry;
  }

  /**
   * Subscribe to error notifications
   */
  subscribe(callback: (error: ErrorLogEntry) => void): () => void {
    this.subscribers.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index !== -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  /**
   * Get all error logs
   */
  getAllErrors(): ErrorLogEntry[] {
    return [...this.errorLogs];
  }

  /**
   * Get errors by category
   */
  getErrorsByCategory(category: ErrorLogEntry['category']): ErrorLogEntry[] {
    return this.errorLogs.filter(error => error.category === category);
  }

  /**
   * Get errors by severity
   */
  getErrorsBySeverity(severity: ErrorLogEntry['severity']): ErrorLogEntry[] {
    return this.errorLogs.filter(error => error.severity === severity);
  }

  /**
   * Get unresolved errors
   */
  getUnresolvedErrors(): ErrorLogEntry[] {
    return this.errorLogs.filter(error => !error.isResolved);
  }

  /**
   * Mark an error as resolved
   */
  resolveError(errorId: string): boolean {
    const error = this.errorLogs.find(e => e.id === errorId);
    if (error) {
      error.isResolved = true;
      return true;
    }
    return false;
  }

  /**
   * Clear all errors
   */
  clearAllErrors(): void {
    this.errorLogs = [];
  }

  /**
   * Clear errors by category
   */
  clearErrorsByCategory(category: ErrorLogEntry['category']): void {
    this.errorLogs = this.errorLogs.filter(error => error.category !== category);
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    total: number;
    byCategory: Record<string, number>;
    bySeverity: Record<string, number>;
    unresolved: number;
  } {
    const stats = {
      total: this.errorLogs.length,
      byCategory: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
      unresolved: this.getUnresolvedErrors().length
    };

    this.errorLogs.forEach(error => {
      stats.byCategory[error.category] = (stats.byCategory[error.category] || 0) + 1;
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
    });

    return stats;
  }

  /**
   * Export errors as JSON
   */
  exportErrors(): string {
    return JSON.stringify({
      exportDate: new Date().toISOString(),
      errorCount: this.errorLogs.length,
      errors: this.errorLogs
    }, null, 2);
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private logToConsole(errorEntry: ErrorLogEntry): void {
    const logMessage = `[${errorEntry.category}] ${errorEntry.errorMessage}`;
    
    switch (errorEntry.severity) {
      case 'critical':
      case 'error':
        log.error(`${logMessage}`, errorEntry);
        break;
      case 'warning':
        log.warn(`${logMessage}`, errorEntry);
        break;
      case 'info':
        log.info(`${logMessage}`, errorEntry);
        break;
    }
  }

  private notifySubscribers(errorEntry: ErrorLogEntry): void {
    this.subscribers.forEach(callback => {
      try {
        callback(errorEntry);
      } catch (error) {
        log.error('Error in error log subscriber:', error);
      }
    });
  }
}

// Singleton instance
export const errorLogService = new ErrorLogServiceClass();

// ##############################################################################################
/**
 * The failure of a UI action, either an `Action2Error` returned by the action or an exception
 * it threw. Only the fields used to build the user message are read.
 */
export interface ActionFailure {
  isServerError?: boolean;
  errorType?: string;
  errorMessage?: string;
  message?: string;
}

const startupUserMessage = "Application startup failed. Please check your configuration and try again.";

function actionCategory(actionName: string, failure: unknown): ErrorLogEntry["category"] {
  const lowerActionName = actionName.toLowerCase();
  if (lowerActionName.includes("config") || lowerActionName.includes("startup")) {
    return "startup";
  }
  if (failure && typeof failure === "object" && (failure as ActionFailure).isServerError) {
    return "server";
  }
  if (failure instanceof TypeError && failure.message.includes("fetch")) {
    return "network";
  }
  return "client";
}

/**
 * The message shown to the user for a failed action. The snackbar and the error log both use
 * it, so the log records what the user saw (#122).
 */
export function actionFailureUserMessage(actionName: string, failure: unknown): string {
  if (actionCategory(actionName, failure) === "startup") {
    return startupUserMessage;
  }
  const details: ActionFailure =
    failure && typeof failure === "object" ? (failure as ActionFailure) : { errorMessage: String(failure) };
  if (details.isServerError) {
    return `Server error: ${details.errorMessage || details.message || details.errorType || "Unknown server error"}`;
  }
  return `Error in ${actionName}: ${details.errorMessage || details.message || details.errorType || "Unknown error"}`;
}

/**
 * Logs the failure of a UI action, whether returned as an `Action2Error` or thrown. The entry's
 * `userMessage` is the message to show the user.
 */
export function logActionFailure(
  actionName: string,
  failure: unknown,
  context: Record<string, any> = {},
  service: ErrorLogServiceClass = errorLogService,
): ErrorLogEntry {
  const category = actionCategory(actionName, failure);
  const error: Error | string =
    failure instanceof Error
      ? failure
      : failure && typeof failure === "object"
        ? (failure as ActionFailure).errorMessage || (failure as ActionFailure).errorType || "Unknown error"
        : String(failure);
  return service.logError(error, {
    category,
    severity: category === "startup" ? "critical" : category === "network" ? "warning" : "error",
    context: { actionName, ...context },
    showSnackbar: true,
    userMessage: actionFailureUserMessage(actionName, failure),
  });
}

// Helper functions for common error types
export const logStartupError = (error: Error | string, context?: Record<string, any>) => {
  return errorLogService.logError(error, {
    category: 'startup',
    severity: 'critical',
    context,
    showSnackbar: true,
    userMessage: startupUserMessage,
  });
};

export const logServerError = (error: Error | string, context?: Record<string, any>) => {
  return errorLogService.logError(error, {
    category: 'server',
    severity: 'error',
    context,
    showSnackbar: true,
    userMessage: actionFailureUserMessage("server request", { isServerError: true, errorMessage: error instanceof Error ? error.message : error }),
  });
};

export const logClientError = (error: Error | string, context?: Record<string, any>) => {
  return errorLogService.logError(error, {
    category: 'client',
    severity: 'error',
    context,
    showSnackbar: true
  });
};

export const logNetworkError = (error: Error | string, context?: Record<string, any>) => {
  return errorLogService.logError(error, {
    category: 'network',
    severity: 'warning',
    context,
    showSnackbar: true,
    userMessage: 'Network error. Please check your connection.'
  });
};

export const logValidationError = (error: Error | string, context?: Record<string, any>) => {
  return errorLogService.logError(error, {
    category: 'validation',
    severity: 'warning',
    context,
    showSnackbar: true
  });
};
