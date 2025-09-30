import {
  MiroirActivityTrackerInterface,
  type MiroirActivity_Action,
  type MiroirActivity_Test,
  type MiroirActivity,
  type MiroirActivity_Transformer,
} from "../0_interfaces/3_controllers/MiroirActivityTrackerInterface";
import type { LogLevel } from "../0_interfaces/4-services/LoggerInterface";
import { LoggerGlobalContext } from "../4_services/LoggerContext";

// Base interface for common log entry fields
interface MiroirEventLogBase {
  logId: string;
  timestamp: number;
  level: LogLevel;
  loggerName: string;
  message: string;
  args: any[];
}

// Discriminated union for log entries
export type MiroirEventLog =
  | (MiroirEventLogBase & {
      event: ActionEvent
    })
  | (MiroirEventLogBase & {
      event: TestEvent
    })
  | (MiroirEventLogBase & {
      event: TransformerEvent
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
  activity: MiroirActivity_Action;
};

export type TestEvent = MiroirEventBase & { activity: MiroirActivity_Test };

export type TransformerEvent = MiroirEventBase & {
  activity: MiroirActivity_Transformer;
};

// Discriminated union for aggregated events
export type MiroirEvent = ActionEvent | TestEvent | TransformerEvent;

// Filter criteria for action and test logs
export interface EventFilter {
  eventId?: string;
  actionType?: string;
  trackingType?: "action" | "testSuite" | "test" | "testAssertion" | "transformer"; // Added for test and transformer filtering
  level?: LogLevel;
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
  pushLogToEvent(
    level: LogLevel,
    loggerName: string,
    message: string,
    ...args: any[]
  ): void;

  /**
   *
   * @param trackingData The MiroirEventTrackingData object representing the action or test to log
   */
  pushEventFromActivity(trackingData: MiroirActivity): void;

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
   * Clear all logs
   */
  clear(): void;

  /**
   * Export action logs as JSON
   */
  exportEvents(): string;

  /**
   * Subscribe to changes in the event list
   */
  subscribe(callback: (events: MiroirEvent[]) => void): () => void;
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
export class MiroirEventService implements MiroirEventServiceInterface {
  public events: Map<string, MiroirEvent> = new Map(); // TODO: make private! should be accessed only via selectors / hooks
  public eventEntries: Map<string, MiroirEventLog> = new Map();
  private eventSubscribers: Set<(events: MiroirEvent[]) => void> = new Set();
  private cleanupInterval: NodeJS.Timeout;

  // Configuration
  private readonly MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes
  private readonly CLEANUP_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes
  private readonly MAX_ENTRIES_PER_ACTION_OR_TEST = 1000; // Prevent memory bloat

  constructor(private activityTracker: MiroirActivityTrackerInterface) {
    this.cleanupInterval = setInterval(() => this.cleanup(), this.CLEANUP_INTERVAL_MS);
    this.activityTracker.setMiroirEventService(this);
  }

  // ##############################################################################################
  pushLogToEvent(
    level: LogLevel,
    loggerName: string,
    message: string,
    ...args: any[]
  ): void {
    const currentActivityId = this.activityTracker.getCurrentActivityId();
    if (!currentActivityId) {
      // No active action, skip logging
      return;
    }

    // const currentActionData = this.eventTracker.getAllEvents().find(a => a.logId === currentActionId);
    const currentActivityData = this.activityTracker.getActivityIndex().get(currentActivityId);
    if (!currentActivityData) {
      return;
    }

    // Create log entry based on tracking type
    let logEntry: MiroirEventLog;

    const currentEvent = this.events.get(currentActivityId);

    switch (currentActivityData.activityType) {
      case "action": {
        if (
          !currentEvent ||
          currentEvent.activity.activityType !== "action"
        ) {
          throw new Error(
            "Inconsistent state: action event not found or mismatched, log type action, activity type " +
              (currentActivityData.activityType ? currentActivityData.activityType : "undefined") +
              " currentActivityId " +
              currentActivityId +
              " currentEvent " +
              JSON.stringify(currentEvent, null, 2)
          );
        }
        logEntry = {
          logId: this.generateEventId(),
          event: currentEvent as ActionEvent,
          timestamp: Date.now(),
          level,
          loggerName,
          message,
          args,
        };
        break;
      }
      case "testSuite":
      case "test":
      case "testAssertion": {
        if (
          !currentEvent ||
          !["test", "testSuite", "testAssertion"].includes(currentEvent.activity.activityType)
        ) {
          throw new Error(
            "Inconsistent state: test event not found or mismatched, event type " +
              (currentEvent ? currentEvent.activity.activityType : "undefined") +
              " log type " +
              currentActivityData.activityType +
              " currentActionId " +
              currentActivityId
          );
        }

        logEntry = {
          event: currentEvent as TestEvent,
          logId: this.generateEventId(),
          timestamp: Date.now(),
          level,
          loggerName,
          message,
          args,
        };
        break;
      }
      case "transformer": {
        if (!currentEvent || currentEvent.activity.activityType !== "transformer") {
          // console.log(
          //   "MiroirEventService.pushLogToEvent currentActivityData:",
          //   currentActivityData,
          //   "currentEvent:",
          //   currentEvent
          // );
          throw new Error(
            "Inconsistent state: transformer event not found or mismatched, log type transformer, currentEvent " +
              JSON.stringify(currentEvent, null, 2) + " currentActivityData " + JSON.stringify(currentActivityData, null, 2)
          );
        }
        logEntry = {
          event: currentEvent as TransformerEvent,
          logId: this.generateEventId(),
          timestamp: Date.now(),
          level,
          loggerName,
          message,
          args,
        };
        break;
      }

      default:
        throw new Error("Unknown tracking type for action: " + currentActivityData);
    }

    // Store the log entry
    this.eventEntries.set(logEntry.logId, logEntry);

    // Add to action logs
    if (currentEvent) {
      currentEvent.eventLogs.push(logEntry);
      currentEvent.logCounts[level]++;
      currentEvent.logCounts.total++;
      this.eventEntries.set(logEntry.logId, logEntry);
      this.notifySubscribers();
    }
  }

    // ##############################################################################################
  pushEventFromActivity(trackingData: MiroirActivity) {
    if (!this.events.has(trackingData.activityId)) {
      // copies MiroirEventTrackingData to MiroirEvent
      // Create event based on tracking type
      let event: MiroirEvent = {
        activity: trackingData,
        eventLogs: [],
        logCounts: {
          trace: 0,
          debug: 0,
          info: 0,
          warn: 0,
          error: 0,
          total: 0,
        },
      } as MiroirEvent;

      this.events.set(trackingData.activityId, event);
    } else {
      // Update existing action status/timing and transformer results
      const existing = this.events.get(trackingData.activityId)!;
      existing.activity.endTime = trackingData.endTime;
      existing.activity.status = trackingData.status;
      // Update transformer-specific fields if they exist
      if (
        trackingData.activityType === "transformer" &&
        existing.activity.activityType === "transformer"
      ) {
        existing.activity.transformerResult = trackingData.transformerResult;
        existing.activity.transformerError = trackingData.transformerError;
      }
    }
    this.notifySubscribers();
  }

  // // ##############################################################################################
  // pushEventFromActivity(trackingData: MiroirActivity): void {
  //   const existing = this.events.get(trackingData.activityId);
  //   if (!existing) {
  //     // TODO: use trackingData.activityType to discriminate event type
  //     if (trackingData.activityType == "action") {
  //       const event: ActionEvent = {
  //         activity: trackingData,
  //         eventLogs: [],
  //         logCounts: { trace: 0, debug: 0, info: 0, warn: 0, error: 0, total: 0 },
  //       };
  //       this.events.set(trackingData.activityId, event);
  //     } else if (trackingData.activityType == "testSuite" || trackingData.activityType == "test" || trackingData.activityType == "testAssertion") {
  //       const event: TestEvent = {
  //         activity: trackingData,
  //         eventLogs: [],
  //         logCounts: { trace: 0, debug: 0, info: 0, warn: 0, error: 0, total: 0 },
  //       };
  //       this.events.set(trackingData.activityId, event);
  //     } else if (trackingData.activityType == "transformer") {
  //       const event: TransformerEvent = {
  //         activity: trackingData,
  //         eventLogs: [],
  //         logCounts: { trace: 0, debug: 0, info: 0, warn: 0, error: 0, total: 0 },
  //       };
  //       this.events.set(trackingData.activityId, event);
  //     }
  //   } else {
  //     // Update existing event with completion data
  //     existing.activity.endTime = trackingData.endTime;
  //     existing.activity.status = trackingData.status;
  //     if (
  //       trackingData.activityType === "action" &&
  //       existing.activity.activityType === "action"
  //     ) {
  //       existing.activity.error = trackingData.error;
  //     }
  //     if (
  //       (trackingData.activityType === "testSuite" || trackingData.activityType === "test" || trackingData.activityType === "testAssertion") &&
  //       (existing.activity.activityType === "testSuite" || existing.activity.activityType === "test" || existing.activity.activityType === "testAssertion")
  //     ) {
  //       existing.activity.error = trackingData.error;
  //     }
  //     if (
  //       trackingData.activityType === "transformer" &&
  //       existing.activity.activityType === "transformer"
  //     ) {
  //       existing.activity.transformerResult = trackingData.transformerResult;
  //       existing.activity.transformerError = trackingData.transformerError;
  //     }
  //   }
  //   this.notifySubscribers();
  // }

  // ##############################################################################################
  private notifySubscribers(): void {
    // Use setTimeout to defer notifications and avoid updating React state during render
    setTimeout(() => {
      const allEvents = this.getAllEvents();
      this.eventSubscribers.forEach(callback => callback(allEvents));
    }, 0);
  }

  // ##############################################################################################
  subscribe(callback: (events: MiroirEvent[]) => void): () => void {
    this.eventSubscribers.add(callback);
    // Immediately send the current list of events to the new subscriber
    callback(this.getAllEvents());
    // Return an unsubscribe function
    return () => {
      this.eventSubscribers.delete(callback);
    };
  }

  getEvent(eventId: string): MiroirEvent | undefined {
    return this.events.get(eventId);
  }

  getAllEvents(): MiroirEvent[] {
    return Array.from(this.events.values()).sort(
      (a, b) => b.activity.startTime - a.activity.startTime
    );
  }

  getFilteredEvents(filter: EventFilter, events?: MiroirEvent[]): MiroirEvent[] {
    return this.getAllEvents().filter((actionLogs) => {
      if (filter.eventId && actionLogs.activity.activityId !== filter.eventId) {
        return false;
      }
      if (filter.actionType && actionLogs.activity.actionType !== filter.actionType) {
        return false;
      }
      if (filter.trackingType && actionLogs.activity.activityType !== filter.trackingType) {
        return false;
      }
      if (filter.since && actionLogs.activity.startTime < filter.since) {
        return false;
      }
      if (filter.level) {
        // Check if action has logs of the specified level
        if (actionLogs.logCounts[filter.level] === 0) {
          return false;
        }
      }
      if (filter.testSuite) {
        const hasMatchingTestSuite = actionLogs.eventLogs.some((log) =>
          log.event.activity.activityType === "testSuite" ||
          log.event.activity.activityType === "test" ||
          log.event.activity.activityType === "testAssertion"
            ? log.event.activity.testSuite === filter.testSuite
            : false
        );
        if (!hasMatchingTestSuite) {
          return false;
        }
      }
      if (filter.test) {
        const hasMatchingTest = actionLogs.eventLogs.some((log) =>
          log.event.activity.activityType === "testSuite" ||
          log.event.activity.activityType === "test" ||
          log.event.activity.activityType === "testAssertion"
            ? log.event.activity.test === filter.test
            : false
        );
        if (!hasMatchingTest) {
          return false;
        }
      }
      if (filter.searchText) {
        const searchLower = filter.searchText.toLowerCase();
        const hasMatchingLog = actionLogs.eventLogs.some(
          (log) =>
            log.message.toLowerCase().includes(searchLower) ||
            log.args.some(
              (arg) => typeof arg === "string" && arg.toLowerCase().includes(searchLower)
            )
        );
        if (!hasMatchingLog) {
          return false;
        }
      }
      if (filter.loggerName) {
        const hasMatchingLogger = actionLogs.eventLogs.some((log) =>
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
    this.notifySubscribers();
  }

  exportEvents(): string {
    const exportData = {
      timestamp: new Date().toISOString(),
      actionLogs: this.getAllEvents().map((actionLogs) => ({
        ...actionLogs,
        logs: actionLogs.eventLogs.map((log) => ({
          ...log,
          timestampISO: new Date(log.timestamp).toISOString(),
        })),
      })),
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

  // ##############################################################################################
  private generateEventId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ##############################################################################################
  private cleanup(): void {
    const now = Date.now();
    const actionsToRemove: string[] = [];
    this.events.forEach((event, eventId) => {
      if (
        event.activity.status !== "running" &&
        event.activity.startTime < now - this.MAX_AGE_MS
      ) {
        actionsToRemove.push(eventId);
      }
    });
    actionsToRemove.forEach((eventId) => {
      const actionLogs = this.events.get(eventId);
      if (actionLogs) {
        // Remove all log entries for this action
        actionLogs.eventLogs.forEach((log) => {
          this.eventEntries.delete(log.logId);
        });
        this.events.delete(eventId);
      }
    });
    if (actionsToRemove.length > 0) {
      this.notifySubscribers();
    }
  }
}
