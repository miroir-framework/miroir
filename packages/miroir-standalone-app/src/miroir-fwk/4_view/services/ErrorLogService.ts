// ##############################################################################################
// Global Error Log Service for consistent error handling and tracking
// ##############################################################################################

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

class ErrorLogServiceClass {
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
        console.error(`❌ ${logMessage}`, errorEntry);
        break;
      case 'warning':
        console.warn(`⚠️ ${logMessage}`, errorEntry);
        break;
      case 'info':
        console.info(`ℹ️ ${logMessage}`, errorEntry);
        break;
    }
  }

  private notifySubscribers(errorEntry: ErrorLogEntry): void {
    this.subscribers.forEach(callback => {
      try {
        callback(errorEntry);
      } catch (error) {
        console.error('Error in error log subscriber:', error);
      }
    });
  }
}

// Singleton instance
export const errorLogService = new ErrorLogServiceClass();

// Helper functions for common error types
export const logStartupError = (error: Error | string, context?: Record<string, any>) => {
  return errorLogService.logError(error, {
    category: 'startup',
    severity: 'critical',
    context,
    showSnackbar: true,
    userMessage: 'Application startup failed. Please check your configuration and try again.'
  });
};

export const logServerError = (error: Error | string, context?: Record<string, any>) => {
  return errorLogService.logError(error, {
    category: 'server',
    severity: 'error',
    context,
    showSnackbar: true,
    userMessage: 'Server error: request could not be processed.'
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
