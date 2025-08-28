import { RunActionTrackerInterface } from "../0_interfaces/3_controllers/RunActionTrackerInterface";

// Action log entry representing a single log message within an action execution
export interface ActionLogEntry {
  id: string;
  actionId: string;
  timestamp: number;
  level: 'trace' | 'debug' | 'info' | 'warn' | 'error';
  loggerName: string;
  message: string;
  args: any[];
  context?: {
    testSuite?: string;
    test?: string;
    testAssertion?: string;
    compositeAction?: string;
    action?: string;
  };
}

// Aggregated logs for a specific action execution
export interface ActionLogs {
  actionId: string;
  actionType: string;
  actionLabel?: string;
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

// Filter criteria for action logs
export interface ActionLogFilter {
  actionId?: string;
  actionType?: string;
  level?: 'trace' | 'debug' | 'info' | 'warn' | 'error';
  since?: number;
  searchText?: string;
  loggerName?: string;
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
      if (filter.since && actionLogs.startTime < filter.since) {
        return false;
      }
      if (filter.level) {
        // Check if action has logs of the specified level
        if (actionLogs.logCounts[filter.level] === 0) {
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
    // Create action log containers for new actions
    actions.forEach(action => {
      if (!this.actionLogs.has(action.id)) {
        const actionLogs: ActionLogs = {
          actionId: action.id,
          actionType: action.actionType,
          actionLabel: action.actionLabel,
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
    // Import LoggerGlobalContext dynamically to avoid circular dependencies
    try {
      const { LoggerGlobalContext } = require('../4_services/LoggerContext');
      return {
        testSuite: LoggerGlobalContext.getTestSuite(),
        test: LoggerGlobalContext.getTest(),
        testAssertion: LoggerGlobalContext.getTestAssertion(),
        compositeAction: LoggerGlobalContext.getCompositeAction(),
        action: LoggerGlobalContext.getAction()
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
    
    for (const [actionId, actionLogs] of this.actionLogs.entries()) {
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
