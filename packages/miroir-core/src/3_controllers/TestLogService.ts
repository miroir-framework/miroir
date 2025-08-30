import { TestTrackerInterface } from "../0_interfaces/3_controllers/TestTrackerInterface";
import { LoggerGlobalContext } from "../4_services/LoggerContext";

// Test log entry representing a single log message within a test execution
export interface TestLogEntry {
  id: string;
  testSuite?: string;
  test?: string;
  testAssertion?: string;
  timestamp: number;
  level: 'trace' | 'debug' | 'info' | 'warn' | 'error';
  loggerName: string;
  message: string;
  args: any[];
  context?: {
    testSuite?: string;
    test?: string;
    testAssertion?: string;
    // Keep action context for cross-service correlation
    action?: string;
    compositeAction?: string;
  };
}

// Aggregated logs for a specific test execution
export interface TestLogs {
  testSuite?: string;
  test?: string;
  testAssertion?: string;
  startTime: number;
  endTime?: number;
  logs: TestLogEntry[];
  logCounts: {
    trace: number;
    debug: number;
    info: number;
    warn: number;
    error: number;
    total: number;
  };
}

// Filter criteria for test logs
export interface TestLogFilter {
  testSuite?: string;
  test?: string;
  testAssertion?: string;
  level?: 'trace' | 'debug' | 'info' | 'warn' | 'error';
  since?: number;
  searchText?: string;
  loggerName?: string;
}

// Service interface for test logging
export interface TestLogServiceInterface {
  /**
   * Log a message for the current test context
   */
  logForCurrentTest(
    level: 'trace' | 'debug' | 'info' | 'warn' | 'error',
    loggerName: string,
    message: string,
    ...args: any[]
  ): void;

  /**
   * Get logs for a specific test context
   */
  getTestLogs(testSuite?: string, test?: string, testAssertion?: string): TestLogs[];

  /**
   * Get all test logs
   */
  getAllTestLogs(): TestLogs[];

  /**
   * Get filtered test logs
   */
  getFilteredTestLogs(filter: TestLogFilter): TestLogs[];

  /**
   * Subscribe to test log updates
   */
  subscribe(callback: (testLogs: TestLogs[]) => void): () => void;

  /**
   * Clear all logs
   */
  clear(): void;

  /**
   * Export test logs as JSON
   */
  exportLogs(): string;
}

/**
 * Service for capturing and managing logs associated with specific test executions
 */
export class TestLogService implements TestLogServiceInterface {
  private testLogs: Map<string, TestLogs> = new Map();
  private logEntries: Map<string, TestLogEntry> = new Map();
  private subscribers: Set<(testLogs: TestLogs[]) => void> = new Set();
  private cleanupInterval: NodeJS.Timeout;
  
  // Configuration
  private readonly MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes for tests
  private readonly CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_ENTRIES_PER_TEST = 1000; // Prevent memory bloat

  constructor(private testTracker: TestTrackerInterface) {
    // Start cleanup timer
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.CLEANUP_INTERVAL_MS);

    // Subscribe to test tracker to create test log containers
    this.testTracker.subscribe((context) => {
      this.updateTestContainers(context);
    });
  }

  logForCurrentTest(
    level: 'trace' | 'debug' | 'info' | 'warn' | 'error',
    loggerName: string,
    message: string,
    ...args: any[]
  ): void {
    const testSuite = this.testTracker.getTestSuite();
    const test = this.testTracker.getTest();
    const testAssertion = this.testTracker.getTestAssertion();

    // Only log if we're in a test context
    if (!testSuite && !test && !testAssertion) {
      return;
    }

    const logEntry: TestLogEntry = {
      id: this.generateLogId(),
      testSuite,
      test,
      testAssertion,
      timestamp: Date.now(),
      level,
      loggerName,
      message,
      args,
      context: this.getCurrentTestLogContext()
    };

    // Store the log entry
    this.logEntries.set(logEntry.id, logEntry);

    // Add to test logs
    const testLogKey = this.generateTestLogKey(testSuite, test, testAssertion);
    let testLogs = this.testLogs.get(testLogKey);
    
    if (!testLogs) {
      testLogs = {
        testSuite,
        test,
        testAssertion,
        startTime: Date.now(),
        logs: [],
        logCounts: {
          trace: 0,
          debug: 0,
          info: 0,
          warn: 0,
          error: 0,
          total: 0
        }
      };
      this.testLogs.set(testLogKey, testLogs);
    }

    testLogs.logs.push(logEntry);
    testLogs.logCounts[level]++;
    testLogs.logCounts.total++;

    // Prevent memory bloat - remove oldest logs if too many
    if (testLogs.logs.length > this.MAX_ENTRIES_PER_TEST) {
      const removedLog = testLogs.logs.shift();
      if (removedLog) {
        this.logEntries.delete(removedLog.id);
        testLogs.logCounts[removedLog.level]--;
        testLogs.logCounts.total--;
      }
    }

    this.notifySubscribers();
  }

  getTestLogs(testSuite?: string, test?: string, testAssertion?: string): TestLogs[] {
    const key = this.generateTestLogKey(testSuite, test, testAssertion);
    const testLogs = this.testLogs.get(key);
    return testLogs ? [testLogs] : [];
  }

  getAllTestLogs(): TestLogs[] {
    return Array.from(this.testLogs.values()).sort((a, b) => b.startTime - a.startTime);
  }

  getFilteredTestLogs(filter: TestLogFilter): TestLogs[] {
    return this.getAllTestLogs()
      .filter(testLogs => {
        // Skip empty TestLogs containers (no actual logs)
        if (testLogs.logs.length === 0) {
          return false;
        }
        
        if (filter.testSuite && testLogs.testSuite !== filter.testSuite) {
          return false;
        }
        if (filter.test && testLogs.test !== filter.test) {
          return false;
        }
        if (filter.testAssertion && testLogs.testAssertion !== filter.testAssertion) {
          return false;
        }
        if (filter.since && testLogs.startTime < filter.since) {
          return false;
        }
        
        // If we have log-level filters, check if this container has any matching logs
        const hasMatchingLogs = testLogs.logs.some(log => {
          if (filter.level && log.level !== filter.level) {
            return false;
          }
          if (filter.loggerName && !log.loggerName.includes(filter.loggerName)) {
            return false;
          }
          if (filter.searchText) {
            const searchLower = filter.searchText.toLowerCase();
            const matchesSearch = log.message.toLowerCase().includes(searchLower) ||
              log.args.some(arg => 
                typeof arg === 'string' && arg.toLowerCase().includes(searchLower)
              );
            if (!matchesSearch) {
              return false;
            }
          }
          return true;
        });
        
        return hasMatchingLogs;
      })
      .map(testLogs => {
        // If we have log-level filters, filter the logs within this container
        if (filter.level || filter.loggerName || filter.searchText) {
          const filteredLogs = testLogs.logs.filter(log => {
            if (filter.level && log.level !== filter.level) {
              return false;
            }
            if (filter.loggerName && !log.loggerName.includes(filter.loggerName)) {
              return false;
            }
            if (filter.searchText) {
              const searchLower = filter.searchText.toLowerCase();
              const matchesSearch = log.message.toLowerCase().includes(searchLower) ||
                log.args.some(arg => 
                  typeof arg === 'string' && arg.toLowerCase().includes(searchLower)
                );
              if (!matchesSearch) {
                return false;
              }
            }
            return true;
          });
          
          // Recalculate log counts for filtered logs
          const logCounts = {
            trace: 0,
            debug: 0,
            info: 0,
            warn: 0,
            error: 0,
            total: filteredLogs.length
          };
          filteredLogs.forEach(log => {
            logCounts[log.level]++;
          });
          
          return {
            ...testLogs,
            logs: filteredLogs,
            logCounts
          };
        }
        
        // No log-level filters, return original container
        return testLogs;
      });
  }

  subscribe(callback: (testLogs: TestLogs[]) => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  clear(): void {
    this.testLogs.clear();
    this.logEntries.clear();
    this.notifySubscribers();
  }

  exportLogs(): string {
    const exportData = {
      timestamp: new Date().toISOString(),
      testLogs: this.getAllTestLogs().map(testLogs => ({
        ...testLogs,
        logs: testLogs.logs.map(log => ({
          ...log,
          timestampISO: new Date(log.timestamp).toISOString()
        }))
      }))
    };
    return JSON.stringify(exportData, null, 2);
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
    this.subscribers.clear();
  }

  private updateTestContainers(context: any): void {
    // Create test log containers for new test contexts
    const testLogKey = this.generateTestLogKey(context.testSuite, context.test, context.testAssertion);
    
    if (!this.testLogs.has(testLogKey) && (context.testSuite || context.test || context.testAssertion)) {
      const testLogs: TestLogs = {
        testSuite: context.testSuite,
        test: context.test,
        testAssertion: context.testAssertion,
        startTime: context.timestamp || Date.now(),
        logs: [],
        logCounts: {
          trace: 0,
          debug: 0,
          info: 0,
          warn: 0,
          error: 0,
          total: 0
        }
      };
      this.testLogs.set(testLogKey, testLogs);
    }
  }

  private generateTestLogKey(testSuite?: string, test?: string, testAssertion?: string): string {
    return `${testSuite || 'unknown'}_${test || 'unknown'}_${testAssertion || 'unknown'}`;
  }

  private generateLogId(): string {
    return `test_log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCurrentTestLogContext() {
    // Get test context from TestTracker and action context from LoggerGlobalContext for correlation
    try {
      return {
        testSuite: this.testTracker.getTestSuite(),
        test: this.testTracker.getTest(),
        testAssertion: this.testTracker.getTestAssertion(),
        // Keep action context for cross-service correlation
        action: LoggerGlobalContext.getAction(),
        compositeAction: LoggerGlobalContext.getCompositeAction()
      };
    } catch (error) {
      return undefined;
    }
  }

  private notifySubscribers(): void {
    const testLogs = this.getAllTestLogs();
    this.subscribers.forEach(callback => {
      try {
        callback(testLogs);
      } catch (error) {
        console.error('Error in TestLogService subscriber:', error);
      }
    });
  }

  private cleanup(): void {
    const now = Date.now();
    const cutoff = now - this.MAX_AGE_MS;
    
    // Find test logs to remove (older than MAX_AGE_MS)
    const testLogsToRemove: string[] = [];
    
    for (const [testLogKey, testLogs] of Array.from(this.testLogs.entries())) {
      if (testLogs.startTime < cutoff) {
        testLogsToRemove.push(testLogKey);
      }
    }

    // Remove old test logs and their log entries
    testLogsToRemove.forEach(testLogKey => {
      const testLogs = this.testLogs.get(testLogKey);
      if (testLogs) {
        // Remove all log entries for this test
        testLogs.logs.forEach(log => {
          this.logEntries.delete(log.id);
        });
        this.testLogs.delete(testLogKey);
      }
    });

    if (testLogsToRemove.length > 0) {
      this.notifySubscribers();
    }
  }
}
