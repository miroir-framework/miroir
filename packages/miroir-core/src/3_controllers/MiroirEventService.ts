import { MiroirEventTrackerInterface } from "../0_interfaces/3_controllers/MiroirEventTrackerInterface";
import{ LoggerGlobalContext } from "../4_services/LoggerContext";

// Base interface for common log entry fields
interface MiroirEventLogBase {
  id: string;
  eventId: string;
  timestamp: number;
  level: 'trace' | 'debug' | 'info' | 'warn' | 'error';
  loggerName: string;
  message: string;
  args: any[];
}

// Discriminated union for log entries
export type MiroirEventLog =
  | (MiroirEventLogBase & {
      trackingType: 'action';
      context?: {
        compositeAction?: string;
        action?: string;
      };
    })
  | (MiroirEventLogBase & {
      trackingType: 'testSuite' | 'test' | 'testAssertion';
      context?: {
        testSuite?: string;
        test?: string;
        testAssertion?: string;
      };
    })
  | (MiroirEventLogBase & {
      trackingType: 'transformer';
      context?: {
        transformerName?: string;
        transformerType?: string;
        transformerStep?: 'build' | 'runtime';
      };
    });

// Common log counts interface
export interface LogCounts {
  trace: number;
  debug: number;
  info: number;
  warn: number;
  error: number;
  total: number;
}

// Base interface for common event fields
interface MiroirEventBase {
  eventId: string;
  actionType: string;
  actionLabel?: string;
  startTime: number;
  endTime?: number;
  status: 'running' | 'completed' | 'error';
  eventLogs: MiroirEventLog[];
  logCounts: LogCounts;
}

// Discriminated union for aggregated events
export type MiroirEvent =
  | (MiroirEventBase & {
      trackingType: 'action';
    })
  | (MiroirEventBase & {
      trackingType: 'testSuite' | 'test' | 'testAssertion';
      testSuite?: string;
      test?: string;
      testAssertion?: string;
      testResult?: 'ok' | 'error';
    })
  | (MiroirEventBase & {
      trackingType: 'transformer';
      transformerName?: string;
      transformerType?: string;
      transformerStep?: 'build' | 'runtime';
      transformerParams?: any;
      transformerResult?: any;
      transformerError?: string;
    });

// Filter criteria for action and test logs
export interface EventFilter {
  eventId?: string;
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
  getEvent(eventId: string): MiroirEvent | undefined;

  /**
   * Get all action logs
   */
  getAllEvents(): MiroirEvent[];

  /**
   * Get filtered action logs
   */
  getFilteredEvents(filter: EventFilter, events?: MiroirEvent[]): MiroirEvent[];

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
  public events: Map<string, MiroirEvent> = new Map(); // TODO: make private! should be accessed only via selectors / hooks
  private eventEntries: Map<string, MiroirEventLog> = new Map();
  private eventSubscribers: Set<(actionLogs: MiroirEvent[]) => void> = new Set();
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

    const currentActionData = this.eventTracker.getAllEvents().find(a => a.id === currentActionId);
    if (!currentActionData) {
      return;
    }

    // Create log entry based on tracking type
    let logEntry: MiroirEventLog;
    
    switch (currentActionData.trackingType) {
      case 'action':
        logEntry = {
          trackingType: 'action',
          id: this.generateEventId(),
          eventId: currentActionId,
          timestamp: Date.now(),
          level,
          loggerName,
          message,
          args,
          context: {
            compositeAction: this.eventTracker.getCompositeAction(),
            action: this.eventTracker.getAction(),
          }
        };
        break;
        
      case 'testSuite':
      case 'test':
      case 'testAssertion':
        logEntry = {
          trackingType: currentActionData.trackingType,
          id: this.generateEventId(),
          eventId: currentActionId,
          timestamp: Date.now(),
          level,
          loggerName,
          message,
          args,
          context: {
            testSuite: currentActionData.testSuite || LoggerGlobalContext.getTestSuite(),
            test: currentActionData.test || LoggerGlobalContext.getTest(),
            testAssertion: currentActionData.testAssertion || LoggerGlobalContext.getTestAssertion(),
          }
        };
        break;
        
      case 'transformer':
        logEntry = {
          trackingType: 'transformer',
          id: this.generateEventId(),
          eventId: currentActionId,
          timestamp: Date.now(),
          level,
          loggerName,
          message,
          args,
          context: {
            transformerName: currentActionData.transformerName,
            transformerType: currentActionData.transformerType,
            transformerStep: currentActionData.transformerStep,
          }
        };
        break;
        
      default:
        // Fallback to action type
        logEntry = {
          trackingType: 'action',
          id: this.generateEventId(),
          eventId: currentActionId,
          timestamp: Date.now(),
          level,
          loggerName,
          message,
          args,
          context: {
            compositeAction: this.eventTracker.getCompositeAction(),
            action: this.eventTracker.getAction(),
          }
        };
    }

    // Store the log entry
    this.eventEntries.set(logEntry.id, logEntry);

    // Add to action logs
    const currentActionEvent = this.events.get(currentActionId);
    if (currentActionEvent) {
      currentActionEvent.eventLogs.push(logEntry);
      currentActionEvent.logCounts[level]++;
      currentActionEvent.logCounts.total++;

      // Prevent memory bloat - remove oldest logs if too many
      if (currentActionEvent.eventLogs.length > this.MAX_ENTRIES_PER_ACTION_OR_TEST) {
        const removedLog = currentActionEvent.eventLogs.shift();
        if (removedLog) {
          this.eventEntries.delete(removedLog.id);
          currentActionEvent.logCounts[removedLog.level]--;
          currentActionEvent.logCounts.total--;
        }
      }

      this.notifyEventSubscribers();
    }
  }


  getEvent(eventId: string): MiroirEvent | undefined {
    return this.events.get(eventId);
  }

  getAllEvents(): MiroirEvent[] {
    return Array.from(this.events.values()).sort((a, b) => b.startTime - a.startTime);
  }

  // getAllTestLogs(): TestLogs[] {
  //   return Array.from(this.actionOrTestLogs.values()).sort((a, b) => b.startTime - a.startTime);
  // }

  getFilteredEvents(filter: EventFilter, events?: MiroirEvent[]): MiroirEvent[] {
    return this.getAllEvents().filter(actionLogs => {
      if (filter.eventId && actionLogs.eventId !== filter.eventId) {
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
        const hasMatchingTestSuite = actionLogs.eventLogs.some(log => 
          log.trackingType === 'testSuite' || log.trackingType === 'test' || log.trackingType === 'testAssertion'
            ? log.context?.testSuite === filter.testSuite
            : false
        );
        if (!hasMatchingTestSuite) {
          return false;
        }
      }
      if (filter.test) {
        const hasMatchingTest = actionLogs.eventLogs.some(log => 
          log.trackingType === 'testSuite' || log.trackingType === 'test' || log.trackingType === 'testAssertion'
            ? log.context?.test === filter.test
            : false
        );
        if (!hasMatchingTest) {
          return false;
        }
      }
      if (filter.searchText) {
        const searchLower = filter.searchText.toLowerCase();
        const hasMatchingLog = actionLogs.eventLogs.some(log => 
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
        const hasMatchingLogger = actionLogs.eventLogs.some(log => 
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
        logs: actionLogs.eventLogs.map(log => ({
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
        // Create event based on tracking type
        let event: MiroirEvent;
        
        switch (action.trackingType) {
          case 'action':
            event = {
              trackingType: 'action',
              eventId: action.id,
              actionType: action.actionType,
              actionLabel: action.actionLabel,
              startTime: action.startTime,
              endTime: action.endTime,
              status: action.status,
              eventLogs: [],
              logCounts: {
                trace: 0,
                debug: 0,
                info: 0,
                warn: 0,
                error: 0,
                total: 0
              }
            };
            break;
            
          case 'testSuite':
          case 'test':
          case 'testAssertion':
            event = {
              trackingType: action.trackingType,
              eventId: action.id,
              actionType: action.actionType,
              actionLabel: action.actionLabel,
              startTime: action.startTime,
              endTime: action.endTime,
              status: action.status,
              eventLogs: [],
              logCounts: {
                trace: 0,
                debug: 0,
                info: 0,
                warn: 0,
                error: 0,
                total: 0
              },
              testSuite: action.testSuite,
              test: action.test,
              testAssertion: action.testAssertion,
              testResult: action.testResult
            };
            break;
            
          case 'transformer':
            event = {
              trackingType: 'transformer',
              eventId: action.id,
              actionType: action.actionType,
              actionLabel: action.actionLabel,
              startTime: action.startTime,
              endTime: action.endTime,
              status: action.status,
              eventLogs: [],
              logCounts: {
                trace: 0,
                debug: 0,
                info: 0,
                warn: 0,
                error: 0,
                total: 0
              },
              transformerName: action.transformerName,
              transformerType: action.transformerType,
              transformerStep: action.transformerStep,
              transformerParams: action.transformerParams,
              transformerResult: action.transformerResult,
              transformerError: action.transformerError
            };
            break;
            
          default:
            // Fallback to action type
            event = {
              trackingType: 'action',
              eventId: action.id,
              actionType: action.actionType,
              actionLabel: action.actionLabel,
              startTime: action.startTime,
              endTime: action.endTime,
              status: action.status,
              eventLogs: [],
              logCounts: {
                trace: 0,
                debug: 0,
                info: 0,
                warn: 0,
                error: 0,
                total: 0
              }
            };
        }
        
        this.events.set(action.id, event);
      } else {
        // Update existing action status/timing and transformer results
        const existing = this.events.get(action.id)!;
        existing.endTime = action.endTime;
        existing.status = action.status;
        // Update transformer-specific fields if they exist
        if (action.trackingType === 'transformer' && existing.trackingType === 'transformer') {
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
      
      if (!currentActionData) {
        return undefined;
      }
      
      // Return context based on tracking type
      switch (currentActionData.trackingType) {
        case 'action':
          return {
            trackingType: currentActionData.trackingType,
            compositeAction: this.eventTracker.getCompositeAction(),
            action: this.eventTracker.getAction(),
          };
          
        case 'testSuite':
        case 'test':
        case 'testAssertion':
          return {
            trackingType: currentActionData.trackingType,
            testSuite: currentActionData.testSuite || LoggerGlobalContext.getTestSuite(),
            test: currentActionData.test || LoggerGlobalContext.getTest(),
            testAssertion: currentActionData.testAssertion || LoggerGlobalContext.getTestAssertion(),
          };
          
        case 'transformer':
          return {
            trackingType: currentActionData.trackingType,
            transformerName: currentActionData.transformerName,
            transformerType: currentActionData.transformerType,
            transformerStep: currentActionData.transformerStep
          };
          
        default:
          return undefined;
      }
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
    
    for (const [eventId, actionLogs] of Array.from(this.events.entries())) {
      if (actionLogs.status !== 'running' && actionLogs.startTime < cutoff) {
        actionsToRemove.push(eventId);
      }
    }

    // Remove old actions and their log entries
    actionsToRemove.forEach(eventId => {
      const actionLogs = this.events.get(eventId);
      if (actionLogs) {
        // Remove all log entries for this action
        actionLogs.eventLogs.forEach(log => {
          this.eventEntries.delete(log.id);
        });
        this.events.delete(eventId);
      }
    });

    if (actionsToRemove.length > 0) {
      this.notifyEventSubscribers();
    }
  }
}
