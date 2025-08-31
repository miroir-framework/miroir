import { MiroirEventTrackerInterface } from "../0_interfaces/3_controllers/MiroirEventTrackerInterface";
import{ LoggerGlobalContext } from "../4_services/LoggerContext";

// Unified log entry representing a single log message within an action or test execution
export interface MiroirEventEntry {
  id: string;
  actionId: string; // Renamed from trackingId for backwards compatibility
  timestamp: number;
  level: 'trace' | 'debug' | 'info' | 'warn' | 'error';
  loggerName: string;
  message: string;
  args: any[];
  context?: {
    trackingType?: 'action' | 'testSuite' | 'test' | 'testAssertion' | 'transformer';
    testSuite?: string;
    test?: string;
    testAssertion?: string;
    compositeAction?: string;
    action?: string;
    transformerName?: string;
    transformerType?: string;
    transformerStep?: 'build' | 'runtime';
  };
}

// Aggregated logs for a specific action or test execution
export interface MiroirEvent {
  actionId: string; // trackingId for backwards compatibility
  actionType: string;
  actionLabel?: string;
  trackingType?: 'action' | 'testSuite' | 'test' | 'testAssertion' | 'transformer'; // Added for test and transformer support
  startTime: number;
  endTime?: number;
  status: 'running' | 'completed' | 'error';
  logs: MiroirEventEntry[];
  logCounts: {
    trace: number;
    debug: number;
    info: number;
    warn: number;
    error: number;
    total: number;
  };
  // Transformer-specific fields
  transformerName?: string;
  transformerType?: string;
  transformerStep?: 'build' | 'runtime';
  transformerParams?: any;
  transformerResult?: any;
  transformerError?: string;
}

// Filter criteria for action and test logs
export interface ActionLogFilter {
  actionId?: string;
  actionType?: string;
  trackingType?: 'action' | 'testSuite' | 'test' | 'testAssertion' | 'transformer'; // Added for test and transformer filtering
  level?: 'trace' | 'debug' | 'info' | 'warn' | 'error';
  since?: number;
  searchText?: string;
  loggerName?: string;
  testSuite?: string; // Added for test filtering
  test?: string; // Added for test filtering
}

// Service interface for action logging
export interface MiroirEventServiceInterface {
  /**
   * Log a message for the currently executing action
   */
  pushEventFromLog(
    level: 'trace' | 'debug' | 'info' | 'warn' | 'error',
    loggerName: string,
    message: string,
    ...args: any[]
  ): void;

  /**
   * Get logs for a specific action
   */
  getEvent(actionId: string): MiroirEvent | undefined;

  /**
   * Get all action logs
   */
  getAllEvents(): MiroirEvent[];

  /**
   * Get filtered action logs
   */
  getFilteredEvents(filter: ActionLogFilter): MiroirEvent[];

  /**
   * Subscribe to action log updates
   */
  subscribe(callback: (actionLogs: MiroirEvent[]) => void): () => void;

  /**
   * Clear all logs
   */
  clear(): void;

  /**
   * Export action logs as JSON
   */
  exportEvents(): string;
}

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
/**
 * Service for capturing and managing logs associated with specific action executions
 */
// export class MiroirEventService implements MiroirEventServiceInterface {
export class MiroirEventService implements MiroirEventServiceInterface {
  private events: Map<string, MiroirEvent> = new Map();
  private eventEntries: Map<string, MiroirEventEntry> = new Map();
  private eventSubscribers: Set<(actionLogs: MiroirEvent[]) => void> = new Set();
  // private testSubscribers: Set<(testLogs: TestLogs[]) => void> = new Set();
  private cleanupInterval: NodeJS.Timeout;
  
  // Configuration
  private readonly MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes
  private readonly CLEANUP_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes
  private readonly MAX_ENTRIES_PER_ACTION_OR_TEST = 1000; // Prevent memory bloat

  constructor(private eventTracker: MiroirEventTrackerInterface) {
    // Start cleanup timer
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.CLEANUP_INTERVAL_MS);

    // Subscribe to action tracker to create action log containers
    this.eventTracker.subscribe((actions) => {
      this.updateEventContainers(actions);
    });
  }

  // ##############################################################################################
  pushEventFromLog(
    level: 'trace' | 'debug' | 'info' | 'warn' | 'error',
    loggerName: string,
    message: string,
    ...args: any[]
  ): void {
    const currentActionId = this.eventTracker.getCurrentEventId();
    if (!currentActionId) {
      // No active action, skip logging
      return;
    }

    const logEntry: MiroirEventEntry = {
      id: this.generateEventId(),
      actionId: currentActionId,
      timestamp: Date.now(),
      level,
      loggerName,
      message,
      args,
      context: this.getCurrentEventContext()
    };

    // Store the log entry
    this.eventEntries.set(logEntry.id, logEntry);

    // Add to action logs
    const actionLogs = this.events.get(currentActionId);
    if (actionLogs) {
      actionLogs.logs.push(logEntry);
      actionLogs.logCounts[level]++;
      actionLogs.logCounts.total++;

      // Prevent memory bloat - remove oldest logs if too many
      if (actionLogs.logs.length > this.MAX_ENTRIES_PER_ACTION_OR_TEST) {
        const removedLog = actionLogs.logs.shift();
        if (removedLog) {
          this.eventEntries.delete(removedLog.id);
          actionLogs.logCounts[removedLog.level]--;
          actionLogs.logCounts.total--;
        }
      }

      this.notifyEventSubscribers();
    }
  }

  // logForCurrentTest(
  //   level: 'trace' | 'debug' | 'info' | 'warn' | 'error',
  //   loggerName: string,
  //   message: string,
  //   ...args: any[]
  // ): void {
  //   const currentActionId = this.runActionTracker.getCurrentEventId();
  //   if (!currentActionId) {
  //     // No active action, skip logging
  //     return;
  //   }

  //   const logEntry: TestLogEntry = {
  //     id: this.generateLogId(),
  //     // actionId: currentActionId,
  //     timestamp: Date.now(),
  //     level,
  //     loggerName,
  //     message,
  //     args,
  //     context: this.getCurrentLogContext()
  //   };

  //   // Store the log entry
  //   this.testLogEntries.set(logEntry.id, logEntry);

  //   // Add to action logs
  //   const testLogs = this.testLogs.get(currentActionId);
  //   if (testLogs) {
  //     testLogs.logs.push(logEntry);
  //     testLogs.logCounts[level]++;
  //     testLogs.logCounts.total++;

  //     // Prevent memory bloat - remove oldest logs if too many
  //     if (testLogs.logs.length > this.MAX_ENTRIES_PER_ACTION_OR_TEST) {
  //       const removedLog = testLogs.logs.shift();
  //       if (removedLog) {
  //         this.actionLogEntries.delete(removedLog.id);
  //         testLogs.logCounts[removedLog.level]--;
  //         testLogs.logCounts.total--;
  //       }
  //     }

  //     this.notifyActionSubscribers();
  //   }
  // }

  getEvent(eventId: string): MiroirEvent | undefined {
    return this.events.get(eventId);
  }

  getAllEvents(): MiroirEvent[] {
    return Array.from(this.events.values()).sort((a, b) => b.startTime - a.startTime);
  }

  // getAllTestLogs(): TestLogs[] {
  //   return Array.from(this.actionOrTestLogs.values()).sort((a, b) => b.startTime - a.startTime);
  // }

  getFilteredEvents(filter: ActionLogFilter): MiroirEvent[] {
    return this.getAllEvents().filter(actionLogs => {
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

  subscribe(callback: (actionEvents: MiroirEvent[]) => void): () => void {
    this.eventSubscribers.add(callback);
    return () => {
      this.eventSubscribers.delete(callback);
    };
  }

  clear(): void {
    this.events.clear();
    this.eventEntries.clear();
    this.notifyEventSubscribers();
  }

  exportEvents(): string {
    const exportData = {
      timestamp: new Date().toISOString(),
      actionLogs: this.getAllEvents().map(actionLogs => ({
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
    this.eventSubscribers.clear();
  }

  private updateEventContainers(events: any[]): void {
    // Create action log containers for new actions and tests
    events.forEach(action => {
      if (!this.events.has(action.id)) {
        const event: MiroirEvent = {
          actionId: action.id,
          actionType: action.actionType,
          actionLabel: action.actionLabel,
          trackingType: action.trackingType, // Support actions, tests, and transformers
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
          },
          // Transformer-specific fields
          transformerName: action.transformerName,
          transformerType: action.transformerType,
          transformerStep: action.transformerStep,
          transformerParams: action.transformerParams,
          transformerResult: action.transformerResult,
          transformerError: action.transformerError
        };
        this.events.set(action.id, event);
      } else {
        // Update existing action status/timing and transformer results
        const existing = this.events.get(action.id)!;
        existing.endTime = action.endTime;
        existing.status = action.status;
        // Update transformer-specific fields if they exist
        if (action.trackingType === 'transformer') {
          existing.transformerResult = action.transformerResult;
          existing.transformerError = action.transformerError;
        }
      }
    });
  }

  private generateEventId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCurrentEventContext() {
    // Get action and compositeAction from MiroirEventTracker instead of LoggerGlobalContext
    // Still get test-related context from LoggerGlobalContext to avoid breaking test functionality
    try {
      const currentAction = this.eventTracker.getCurrentEventId();
      const currentActionData = currentAction ? this.eventTracker.getAllEvents().find(a => a.id === currentAction) : undefined;
      
      return {
        trackingType: currentActionData?.trackingType,
        testSuite: currentActionData?.testSuite || LoggerGlobalContext.getTestSuite(),
        test: currentActionData?.test || LoggerGlobalContext.getTest(),
        testAssertion: currentActionData?.testAssertion || LoggerGlobalContext.getTestAssertion(),
        compositeAction: this.eventTracker.getCompositeAction(),
        action: this.eventTracker.getAction(),
        // Transformer context
        transformerName: currentActionData?.transformerName,
        transformerType: currentActionData?.transformerType,
        transformerStep: currentActionData?.transformerStep
      };
    } catch (error) {
      return undefined;
    }
  }

  private notifyEventSubscribers(): void {
    const actionLogs = this.getAllEvents();
    this.eventSubscribers.forEach(callback => {
      try {
        callback(actionLogs);
      } catch (error) {
        console.error('Error in MiroirEventService subscriber:', error);
      }
    });
  }

  // private notifyTestSubscribers(): void {
  //   const testLogs = this.getAllTestLogs();
  //   this.testSubscribers.forEach(callback => {
  //     try {
  //       callback(testLogs);
  //     } catch (error) {
  //       console.error('Error in MiroirEventService subscriber:', error);
  //     }
  //   });
  // }

  private cleanup(): void {
    const now = Date.now();
    const cutoff = now - this.MAX_AGE_MS;
    
    // Find actions to remove (older than MAX_AGE_MS and completed)
    const actionsToRemove: string[] = [];
    
    for (const [actionId, actionLogs] of Array.from(this.events.entries())) {
      if (actionLogs.status !== 'running' && actionLogs.startTime < cutoff) {
        actionsToRemove.push(actionId);
      }
    }

    // Remove old actions and their log entries
    actionsToRemove.forEach(actionId => {
      const actionLogs = this.events.get(actionId);
      if (actionLogs) {
        // Remove all log entries for this action
        actionLogs.logs.forEach(log => {
          this.eventEntries.delete(log.id);
        });
        this.events.delete(actionId);
      }
    });

    if (actionsToRemove.length > 0) {
      this.notifyEventSubscribers();
    }
  }
}


// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ===============================================
// TestLogService Compatibility Wrapper
// ===============================================

/**
 * Backwards compatibility wrapper that makes MiroirEventService compatible with TestLogServiceInterface
 */
// export class TestLogServiceCompatibilityWrapper implements TestLogServiceInterface {
//   constructor(private actionLogService: MiroirEventService) {}

//   logForCurrentTest(
//     level: 'trace' | 'debug' | 'info' | 'warn' | 'error',
//     loggerName: string,
//     message: string,
//     ...args: any[]
//   ): void {
//     // Delegate to MiroirEventService which handles test context via MiroirEventTracker
//     this.actionLogService.logForCurrentAction(level, loggerName, message, ...args);
//   }

//   getTestLogs(testSuite?: string, test?: string, testAssertion?: string): TestLogs[] {
//     // Find matching action logs for the test execution
//     const allActionLogs = this.actionLogService.getAllActionLogs();
//     const matchingLogs = allActionLogs.filter(logs => {
//       if (testAssertion && logs.trackingType === 'testAssertion' && logs.actionLabel === testAssertion) return true;
//       if (test && logs.trackingType === 'test' && logs.actionLabel === test) return true;
//       if (testSuite && logs.trackingType === 'testSuite' && logs.actionLabel === testSuite) return true;
//       return false;
//     });

//     return matchingLogs.map(actionLogsToTestLogs);
//   }

//   getAllTestLogs(): TestLogs[] {
//     // Get all action logs that are test-related
//     const allActionLogs = this.actionLogService.getAllActionLogs();
//     const testLogs = allActionLogs.filter(logs => 
//       logs.trackingType === 'testSuite' || 
//       logs.trackingType === 'test' || 
//       logs.trackingType === 'testAssertion'
//     );
    
//     return testLogs.map(actionLogsToTestLogs);
//   }

//   getFilteredTestLogs(filter: TestLogFilter): TestLogs[] {
//     // Convert TestLogFilter to ActionLogFilter and delegate
//     const actionFilter = testLogFilterToActionLogFilter(filter);
//     const filteredActionLogs = this.actionLogService.getFilteredActionLogs(actionFilter);
    
//     return filteredActionLogs.map(actionLogsToTestLogs);
//   }

//   subscribe(callback: (testLogs: TestLogs[]) => void): () => void {
//     // Subscribe to MiroirEventService and filter for test logs
//     return this.actionLogService.subscribe((actionLogs: MiroirEvent[]) => {
//       const testLogs = actionLogs
//         .filter(logs => 
//           logs.trackingType === 'testSuite' || 
//           logs.trackingType === 'test' || 
//           logs.trackingType === 'testAssertion'
//         )
//         .map(actionLogsToTestLogs);
//       callback(testLogs);
//     });
//   }

//   clear(): void {
//     // Clear all logs through MiroirEventService
//     this.actionLogService.clear();
//   }

//   exportLogs(): string {
//     // Export test logs only
//     const testLogs = this.getAllTestLogs();
//     return JSON.stringify(testLogs, null, 2);
//   }
// }
