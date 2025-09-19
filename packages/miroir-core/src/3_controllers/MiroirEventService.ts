import {
  MiroirActivityTrackerInterface,
  type MiroirActivity_Action,
  type MiroirActivity_Test,
  type MiroirEventTrackingData,
  type MiroirActivity_Transformer,
} from "../0_interfaces/3_controllers/MiroirEventTrackerInterface";
import { LoggerGlobalContext } from "../4_services/LoggerContext";

// Base interface for common log entry fields
interface MiroirEventLogBase {
  logId: string;
  timestamp: number;
  level: "trace" | "debug" | "info" | "warn" | "error";
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
  level?: "trace" | "debug" | "info" | "warn" | "error";
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
    level: "trace" | "debug" | "info" | "warn" | "error",
    loggerName: string,
    message: string,
    ...args: any[]
  ): void;

  /**
   *
   * @param trackingData The MiroirEventTrackingData object representing the action or test to log
   */
  pushEventFromLogTrackingData(trackingData: MiroirEventTrackingData): void;

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
  private eventSubscribers: Set<(actionLogs: MiroirEvent[]) => void> = new Set();
  private cleanupInterval: NodeJS.Timeout;

  // Configuration
  private readonly MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes
  private readonly CLEANUP_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes
  private readonly MAX_ENTRIES_PER_ACTION_OR_TEST = 1000; // Prevent memory bloat

  constructor(private activityTracker: MiroirActivityTrackerInterface) {
    // Start cleanup timer
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.CLEANUP_INTERVAL_MS);

    this.activityTracker.setMiroirEventService(this);
  }

  // ##############################################################################################
  pushEventFromLog(
    level: "trace" | "debug" | "info" | "warn" | "error",
    loggerName: string,
    message: string,
    ...args: any[]
  ): void {
    const currentActionId = this.activityTracker.getCurrentActivityId();
    if (!currentActionId) {
      // No active action, skip logging
      return;
    }

    // const currentActionData = this.eventTracker.getAllEvents().find(a => a.logId === currentActionId);
    const currentActivityData = this.activityTracker.getActivityIndex().get(currentActionId);
    if (!currentActivityData) {
      return;
    }

    // Create log entry based on tracking type
    let logEntry: MiroirEventLog;

    const currentEvent = this.events.get(currentActionId);

    switch (currentActivityData.activityType) {
      case "action": {
        if (
          !currentEvent ||
          currentEvent.activity.activityType !== "action"
        ) {
          throw new Error(
            "Inconsistent state: action event not found or mismatched, log type action, event type " +
              (currentEvent ? currentEvent.activity.activityType : "undefined")
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
          ["test", "testSuite", "testAssertion"].includes(currentEvent.activity.activityType)
        ) {
          throw new Error(
            "Inconsistent state: test event not found or mismatched, log type action, event type " +
              (currentEvent ? currentEvent.activity.activityType : "undefined")
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
          throw new Error(
            "Inconsistent state: transformer event not found or mismatched, log type transformer, event activity type " +
              (currentEvent ? currentEvent.activity.activityType : "undefined")
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

      // Prevent memory bloat - remove oldest logs if too many
      if (currentEvent.eventLogs.length > this.MAX_ENTRIES_PER_ACTION_OR_TEST) {
        const removedLog = currentEvent.eventLogs.shift();
        if (removedLog) {
          this.eventEntries.delete(removedLog.logId);
          currentEvent.logCounts[removedLog.level]--;
          currentEvent.logCounts.total--;
        }
      }
    }
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
  pushEventFromLogTrackingData(trackingData: MiroirEventTrackingData) {
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
  }

  // ##############################################################################################
  private generateEventId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ##############################################################################################
  private cleanup(): void {
    const now = Date.now();
    const cutoff = now - this.MAX_AGE_MS;

    // Find actions to remove (older than MAX_AGE_MS and completed)
    const actionsToRemove: string[] = [];

    for (const [eventId, actionLogs] of Array.from(this.events.entries())) {
      if (
        actionLogs.activity.status !== "running" &&
        actionLogs.activity.startTime < cutoff
      ) {
        actionsToRemove.push(eventId);
      }
    }

    // Remove old actions and their log entries
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
  }
}
