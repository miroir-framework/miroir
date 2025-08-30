import { RunActionTrackerInterface } from "../0_interfaces/3_controllers/RunActionTrackerInterface";
import{ LoggerGlobalContext } from "../4_services/LoggerContext";
// Import test interfaces for compatibility
import { 
  TestLogs, 
  TestLogFilter, 
  TestLogEntry,
  TestLogServiceInterface 
} from './TestLogService.js';

// Unified log entry representing a single log message within an action or test execution
export interface ActionLogEntry {
  id: string;
  actionId: string; // Renamed from trackingId for backwards compatibility
  timestamp: number;
  level: 'trace' | 'debug' | 'info' | 'warn' | 'error';
  loggerName: string;
  message: string;
  args: any[];
  context?: {
    trackingType?: 'action' | 'testSuite' | 'test' | 'testAssertion';
    testSuite?: string;
    test?: string;
    testAssertion?: string;
    compositeAction?: string;
    action?: string;
  };
}

// Aggregated logs for a specific action or test execution
export interface ActionLogs {
  actionId: string; // trackingId for backwards compatibility
  actionType: string;
  actionLabel?: string;
  trackingType?: 'action' | 'testSuite' | 'test' | 'testAssertion'; // Added for test support
  startTime: number;
  endTime?: number;
  status: 'running' | 'completed' | 'error';
  logs: ActionLogEntry[];
  logCounts: {
    trace: number;
    debug: number;
    info: number;
    warn: number;
    error: number;
    total: number;
  };
}

// Filter criteria for action and test logs
export interface ActionLogFilter {
  actionId?: string;
  actionType?: string;
  trackingType?: 'action' | 'testSuite' | 'test' | 'testAssertion'; // Added for test filtering
  level?: 'trace' | 'debug' | 'info' | 'warn' | 'error';
  since?: number;
  searchText?: string;
  loggerName?: string;
  testSuite?: string; // Added for test filtering
  test?: string; // Added for test filtering
}

// Service interface for action logging
export interface ActionLogServiceInterface {
  /**
   * Log a message for the currently executing action
   */
  logForCurrentAction(
    level: 'trace' | 'debug' | 'info' | 'warn' | 'error',
    loggerName: string,
    message: string,
    ...args: any[]
  ): void;

  /**
   * Get logs for a specific action
   */
  getActionLogs(actionId: string): ActionLogs | undefined;

  /**
   * Get all action logs
   */
  getAllActionLogs(): ActionLogs[];

  /**
   * Get filtered action logs
   */
  getFilteredActionLogs(filter: ActionLogFilter): ActionLogs[];

  /**
   * Subscribe to action log updates
   */
  subscribe(callback: (actionLogs: ActionLogs[]) => void): () => void;

  /**
   * Clear all logs
   */
  clear(): void;

  /**
   * Export action logs as JSON
   */
  exportLogs(): string;
}

// ===============================================
// TestLogService Compatibility Wrappers
// ===============================================

// Wrapper to convert ActionLogs to TestLogs format for backwards compatibility
export function actionLogsToTestLogs(actionLogs: ActionLogs): TestLogs {
  return {
    testSuite: actionLogs.trackingType === 'testSuite' ? actionLogs.actionLabel : undefined,
    test: actionLogs.trackingType === 'test' ? actionLogs.actionLabel : undefined,
    testAssertion: actionLogs.trackingType === 'testAssertion' ? actionLogs.actionLabel : undefined,
    startTime: actionLogs.startTime,
    endTime: actionLogs.endTime,
    logs: actionLogs.logs.map(log => ({
      id: log.id,
      timestamp: log.timestamp,
      level: log.level,
      loggerName: log.loggerName,
      message: log.message,
      args: log.args,
      testSuite: log.context?.testSuite,
      test: log.context?.test,
      testAssertion: log.context?.testAssertion,
      context: {
        testSuite: log.context?.testSuite,
        test: log.context?.test,
        testAssertion: log.context?.testAssertion,
        action: log.context?.action,
        compositeAction: log.context?.compositeAction
      }
    })),
    logCounts: actionLogs.logCounts
  };
}

// Wrapper to convert ActionLogFilter to TestLogFilter for backwards compatibility
export function actionLogFilterToTestLogFilter(filter: ActionLogFilter): TestLogFilter {
  return {
    testSuite: filter.testSuite,
    test: filter.test,
    testAssertion: filter.trackingType === 'testAssertion' ? filter.actionType : undefined,
    level: filter.level,
    since: filter.since,
    searchText: filter.searchText,
    loggerName: filter.loggerName
  };
}

// Wrapper to convert TestLogFilter to ActionLogFilter
export function testLogFilterToActionLogFilter(filter: TestLogFilter): ActionLogFilter {
  return {
    trackingType: filter.testAssertion ? 'testAssertion' : filter.test ? 'test' : filter.testSuite ? 'testSuite' : undefined,
    level: filter.level,
    since: filter.since,
    searchText: filter.searchText,
    loggerName: filter.loggerName,
    testSuite: filter.testSuite,
    test: filter.test
  };
}

/**
 * Service for capturing and managing logs associated with specific action executions
 */
export class ActionLogService implements ActionLogServiceInterface {
  private actionLogs: Map<string, ActionLogs> = new Map();
  private logEntries: Map<string, ActionLogEntry> = new Map();
  private subscribers: Set<(actionLogs: ActionLogs[]) => void> = new Set();
  private cleanupInterval: NodeJS.Timeout;
  
  // Configuration
  private readonly MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes
  private readonly CLEANUP_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes
  private readonly MAX_ENTRIES_PER_ACTION = 1000; // Prevent memory bloat

  constructor(private runActionTracker: RunActionTrackerInterface) {
    // Start cleanup timer
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.CLEANUP_INTERVAL_MS);

    // Subscribe to action tracker to create action log containers
    this.runActionTracker.subscribe((actions) => {
      this.updateActionContainers(actions);
    });
  }

  logForCurrentAction(
    level: 'trace' | 'debug' | 'info' | 'warn' | 'error',
    loggerName: string,
    message: string,
    ...args: any[]
  ): void {
    const currentActionId = this.runActionTracker.getCurrentActionId();
    if (!currentActionId) {
      // No active action, skip logging
      return;
    }

    const logEntry: ActionLogEntry = {
      id: this.generateLogId(),
      actionId: currentActionId,
      timestamp: Date.now(),
      level,
      loggerName,
      message,
      args,
      context: this.getCurrentLogContext()
    };

    // Store the log entry
    this.logEntries.set(logEntry.id, logEntry);

    // Add to action logs
    const actionLogs = this.actionLogs.get(currentActionId);
    if (actionLogs) {
      actionLogs.logs.push(logEntry);
      actionLogs.logCounts[level]++;
      actionLogs.logCounts.total++;

      // Prevent memory bloat - remove oldest logs if too many
      if (actionLogs.logs.length > this.MAX_ENTRIES_PER_ACTION) {
        const removedLog = actionLogs.logs.shift();
        if (removedLog) {
          this.logEntries.delete(removedLog.id);
          actionLogs.logCounts[removedLog.level]--;
          actionLogs.logCounts.total--;
        }
      }

      this.notifySubscribers();
    }
  }

  getActionLogs(actionId: string): ActionLogs | undefined {
    return this.actionLogs.get(actionId);
  }

  getAllActionLogs(): ActionLogs[] {
    return Array.from(this.actionLogs.values()).sort((a, b) => b.startTime - a.startTime);
  }

  getFilteredActionLogs(filter: ActionLogFilter): ActionLogs[] {
    return this.getAllActionLogs().filter(actionLogs => {
      if (filter.actionId && actionLogs.actionId !== filter.actionId) {
        return false;
      }
      if (filter.actionType && actionLogs.actionType !== filter.actionType) {
        return false;
      }
      if (filter.trackingType && actionLogs.trackingType !== filter.trackingType) {
        return false;
      }
      if (filter.since && actionLogs.startTime < filter.since) {
        return false;
      }
      if (filter.level) {
        // Check if action has logs of the specified level
        if (actionLogs.logCounts[filter.level] === 0) {
          return false;
        }
      }
      if (filter.testSuite) {
        const hasMatchingTestSuite = actionLogs.logs.some(log => 
          log.context?.testSuite === filter.testSuite
        );
        if (!hasMatchingTestSuite) {
          return false;
        }
      }
      if (filter.test) {
        const hasMatchingTest = actionLogs.logs.some(log => 
          log.context?.test === filter.test
        );
        if (!hasMatchingTest) {
          return false;
        }
      }
      if (filter.searchText) {
        const searchLower = filter.searchText.toLowerCase();
        const hasMatchingLog = actionLogs.logs.some(log => 
          log.message.toLowerCase().includes(searchLower) ||
          log.args.some(arg => 
            typeof arg === 'string' && arg.toLowerCase().includes(searchLower)
          )
        );
        if (!hasMatchingLog) {
          return false;
        }
      }
      if (filter.loggerName) {
        const hasMatchingLogger = actionLogs.logs.some(log => 
          log.loggerName.includes(filter.loggerName!)
        );
        if (!hasMatchingLogger) {
          return false;
        }
      }
      return true;
    });
  }

  subscribe(callback: (actionLogs: ActionLogs[]) => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  clear(): void {
    this.actionLogs.clear();
    this.logEntries.clear();
    this.notifySubscribers();
  }

  exportLogs(): string {
    const exportData = {
      timestamp: new Date().toISOString(),
      actionLogs: this.getAllActionLogs().map(actionLogs => ({
        ...actionLogs,
        logs: actionLogs.logs.map(log => ({
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

  private updateActionContainers(actions: any[]): void {
    // Create action log containers for new actions and tests
    actions.forEach(action => {
      if (!this.actionLogs.has(action.id)) {
        const actionLogs: ActionLogs = {
          actionId: action.id,
          actionType: action.actionType,
          actionLabel: action.actionLabel,
          trackingType: action.trackingType, // Support both actions and tests
          startTime: action.startTime,
          endTime: action.endTime,
          status: action.status,
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
        this.actionLogs.set(action.id, actionLogs);
      } else {
        // Update existing action status/timing
        const existing = this.actionLogs.get(action.id)!;
        existing.endTime = action.endTime;
        existing.status = action.status;
      }
    });
  }

  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCurrentLogContext() {
    // Get action and compositeAction from RunActionTracker instead of LoggerGlobalContext
    // Still get test-related context from LoggerGlobalContext to avoid breaking test functionality
    try {
      const currentAction = this.runActionTracker.getCurrentActionId();
      const currentActionData = currentAction ? this.runActionTracker.getAllActions().find(a => a.id === currentAction) : undefined;
      
      return {
        trackingType: currentActionData?.trackingType,
        testSuite: currentActionData?.testSuite || LoggerGlobalContext.getTestSuite(),
        test: currentActionData?.test || LoggerGlobalContext.getTest(),
        testAssertion: currentActionData?.testAssertion || LoggerGlobalContext.getTestAssertion(),
        compositeAction: this.runActionTracker.getCompositeAction(),
        action: this.runActionTracker.getAction()
      };
    } catch (error) {
      return undefined;
    }
  }

  private notifySubscribers(): void {
    const actionLogs = this.getAllActionLogs();
    this.subscribers.forEach(callback => {
      try {
        callback(actionLogs);
      } catch (error) {
        console.error('Error in ActionLogService subscriber:', error);
      }
    });
  }

  private cleanup(): void {
    const now = Date.now();
    const cutoff = now - this.MAX_AGE_MS;
    
    // Find actions to remove (older than MAX_AGE_MS and completed)
    const actionsToRemove: string[] = [];
    
    for (const [actionId, actionLogs] of Array.from(this.actionLogs.entries())) {
      if (actionLogs.status !== 'running' && actionLogs.startTime < cutoff) {
        actionsToRemove.push(actionId);
      }
    }

    // Remove old actions and their log entries
    actionsToRemove.forEach(actionId => {
      const actionLogs = this.actionLogs.get(actionId);
      if (actionLogs) {
        // Remove all log entries for this action
        actionLogs.logs.forEach(log => {
          this.logEntries.delete(log.id);
        });
        this.actionLogs.delete(actionId);
      }
    });

    if (actionsToRemove.length > 0) {
      this.notifySubscribers();
    }
  }
}

// ===============================================
// TestLogService Compatibility Wrapper
// ===============================================

/**
 * Backwards compatibility wrapper that makes ActionLogService compatible with TestLogServiceInterface
 */
export class TestLogServiceCompatibilityWrapper implements TestLogServiceInterface {
  constructor(private actionLogService: ActionLogService) {}

  logForCurrentTest(
    level: 'trace' | 'debug' | 'info' | 'warn' | 'error',
    loggerName: string,
    message: string,
    ...args: any[]
  ): void {
    // Delegate to ActionLogService which handles test context via RunActionTracker
    this.actionLogService.logForCurrentAction(level, loggerName, message, ...args);
  }

  getTestLogs(testSuite?: string, test?: string, testAssertion?: string): TestLogs[] {
    // Find matching action logs for the test execution
    const allActionLogs = this.actionLogService.getAllActionLogs();
    const matchingLogs = allActionLogs.filter(logs => {
      if (testAssertion && logs.trackingType === 'testAssertion' && logs.actionLabel === testAssertion) return true;
      if (test && logs.trackingType === 'test' && logs.actionLabel === test) return true;
      if (testSuite && logs.trackingType === 'testSuite' && logs.actionLabel === testSuite) return true;
      return false;
    });

    return matchingLogs.map(actionLogsToTestLogs);
  }

  getAllTestLogs(): TestLogs[] {
    // Get all action logs that are test-related
    const allActionLogs = this.actionLogService.getAllActionLogs();
    const testLogs = allActionLogs.filter(logs => 
      logs.trackingType === 'testSuite' || 
      logs.trackingType === 'test' || 
      logs.trackingType === 'testAssertion'
    );
    
    return testLogs.map(actionLogsToTestLogs);
  }

  getFilteredTestLogs(filter: TestLogFilter): TestLogs[] {
    // Convert TestLogFilter to ActionLogFilter and delegate
    const actionFilter = testLogFilterToActionLogFilter(filter);
    const filteredActionLogs = this.actionLogService.getFilteredActionLogs(actionFilter);
    
    return filteredActionLogs.map(actionLogsToTestLogs);
  }

  subscribe(callback: (testLogs: TestLogs[]) => void): () => void {
    // Subscribe to ActionLogService and filter for test logs
    return this.actionLogService.subscribe((actionLogs: ActionLogs[]) => {
      const testLogs = actionLogs
        .filter(logs => 
          logs.trackingType === 'testSuite' || 
          logs.trackingType === 'test' || 
          logs.trackingType === 'testAssertion'
        )
        .map(actionLogsToTestLogs);
      callback(testLogs);
    });
  }

  clear(): void {
    // Clear all logs through ActionLogService
    this.actionLogService.clear();
  }

  exportLogs(): string {
    // Export test logs only
    const testLogs = this.getAllTestLogs();
    return JSON.stringify(testLogs, null, 2);
  }
}
