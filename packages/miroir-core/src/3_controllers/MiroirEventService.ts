import { MiroirEventTrackerInterface, type MiroirEventActionTrackingData, type MiroirEventTestTrackingData, type MiroirEventTrackingData, type MiroirEventTransformerTrackingData } from "../0_interfaces/3_controllers/MiroirEventTrackerInterface";
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
  eventLogs: MiroirEventLog[];
  logCounts: LogCounts;
}

export type ActionEvent = MiroirEventBase & {
  trackingData: MiroirEventActionTrackingData;
};

export type TestEvent = MiroirEventBase & { trackingData: MiroirEventTestTrackingData};

export type TransformerEvent = MiroirEventBase & { trackingData: MiroirEventTransformerTrackingData}

// Discriminated union for aggregated events
export type MiroirEvent =
  | ActionEvent
  | TestEvent
  | TransformerEvent
;

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
   * 
   * @param trackingData The MiroirEventTrackingData object representing the action or test to log
   */
  pushEventFromLogTrackingData(
    trackingData:MiroirEventTrackingData
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

  // /**
  //  * Subscribe to action log updates
  //  */
  // subscribe(callback: (actionLogs: MiroirEvent[]) => void): () => void;

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
  public eventEntries: Map<string, MiroirEventLog> = new Map();
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

    this.eventTracker.setMiroirEventService(this);
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

    // const currentActionData = this.eventTracker.getAllEvents().find(a => a.id === currentActionId);
    const currentActionData = this.eventTracker.getAllEventIndex().get(currentActionId);
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

      // this.notifyEventSubscribers();
    }
  }


  getEvent(eventId: string): MiroirEvent | undefined {
    return this.events.get(eventId);
  }

  getAllEvents(): MiroirEvent[] {
    return Array.from(this.events.values()).sort((a, b) => b.trackingData.startTime - a.trackingData.startTime);
  }

  getFilteredEvents(filter: EventFilter, events?: MiroirEvent[]): MiroirEvent[] {
    return this.getAllEvents().filter(actionLogs => {
      if (filter.eventId && actionLogs.trackingData.id !== filter.eventId) {
        return false;
      }
      if (filter.actionType && actionLogs.trackingData.actionType !== filter.actionType) {
        return false;
      }
      if (filter.trackingType && actionLogs.trackingData.trackingType !== filter.trackingType) {
        return false;
      }
      if (filter.since && actionLogs.trackingData.startTime < filter.since) {
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

  clear(): void {
    this.events.clear();
    this.eventEntries.clear();
    // this.notifyEventSubscribers();
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

  pushEventFromLogTrackingData(
    trackingData:MiroirEventTrackingData
  ) {
    if (!this.events.has(trackingData.id)) {
      // copies MiroirEventTrackingData to MiroirEvent
      // Create event based on tracking type
      let event: MiroirEvent = {
        trackingData,
        eventLogs: [],
        logCounts: {
          trace: 0,
          debug: 0,
          info: 0,
          warn: 0,
          error: 0,
          total: 0
        }
      } as MiroirEvent;

      this.events.set(trackingData.id, event);
    } else {
      // Update existing action status/timing and transformer results
      const existing = this.events.get(trackingData.id)!;
      existing.trackingData.endTime = trackingData.endTime;
      existing.trackingData.status = trackingData.status;
      // Update transformer-specific fields if they exist
      if (trackingData.trackingType === "transformer" && existing.trackingData.trackingType === "transformer") {
        existing.trackingData.transformerResult = trackingData.transformerResult;
        existing.trackingData.transformerError = trackingData.transformerError;
      }
    }

  }

  private updateEventContainers(events: MiroirEventTrackingData[]): void {
    // Create action log containers for new actions and tests
    events.forEach(action => {
      this.pushEventFromLogTrackingData(action);
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

  private cleanup(): void {
    const now = Date.now();
    const cutoff = now - this.MAX_AGE_MS;
    
    // Find actions to remove (older than MAX_AGE_MS and completed)
    const actionsToRemove: string[] = [];
    
    for (const [eventId, actionLogs] of Array.from(this.events.entries())) {
      if (actionLogs.trackingData.status !== 'running' && actionLogs.trackingData.startTime < cutoff) {
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
  }
}
