import {
  DomainControllerInterface,
  EntityInstance,
  entityViewParams,
  LoggerInterface,
  MiroirLoggerFactory,
  ViewParamsData,
} from "miroir-core";

export interface ViewParamsUpdate {
  currentValue: ViewParamsData | undefined;
  updates: Partial<ViewParamsData>;
  // sidebarWidth?: number;
  // Add other view params here as needed
}

export interface ViewParamsUpdateQueueConfig {
  delayMs: number; // Default 1 minute = 60000ms
  deploymentUuid: string;
  viewParamsInstanceUuid: string;
}
/**
 * Singleton class to manage updates to view parameters with a delay.
 * This is used to avoid excessive updates while the user is interacting with the UI.
 * Main queue implementation with the following key methods:
 * - `getInstance()` - Get or create the singleton instance
 * - `queueUpdate()` - Queue ViewParams changes
 * - `flushImmediately()` - Force immediate update
 * - `hasPendingUpdates()` - Check if updates are pending
 */
export class ViewParamsUpdateQueue {
  private static instance: ViewParamsUpdateQueue | null = null;
  private timer: NodeJS.Timeout | null = null;
  private pendingUpdates: ViewParamsUpdate | undefined;
  private config: ViewParamsUpdateQueueConfig;
  private domainController: DomainControllerInterface;
  private log: LoggerInterface;

  private constructor(
    config: ViewParamsUpdateQueueConfig,
    domainController: DomainControllerInterface
  ) {
    this.config = config;
    this.domainController = domainController;
    this.log = console as any as LoggerInterface;

    // Initialize logger
    MiroirLoggerFactory.registerLoggerToStart(
      MiroirLoggerFactory.getLoggerName("miroir-standalone-app", "info", "ViewParamsUpdateQueue")
    ).then((logger: LoggerInterface) => {
      this.log = logger;
    });
  }

  // ##############################################################################################
  public static getInstance(
    config?: ViewParamsUpdateQueueConfig,
    domainController?: DomainControllerInterface
  ): ViewParamsUpdateQueue {
    if (!ViewParamsUpdateQueue.instance) {
      if (!config || !domainController) {
        throw new Error(
          "ViewParamsUpdateQueue: config and domainController required for first initialization"
        );
      }
      ViewParamsUpdateQueue.instance = new ViewParamsUpdateQueue(config, domainController);
    }
    return ViewParamsUpdateQueue.instance;
  }

  public static destroyInstance(): void {
    if (ViewParamsUpdateQueue.instance) {
      ViewParamsUpdateQueue.instance.clearTimer();
      ViewParamsUpdateQueue.instance = null;
    }
  }

  // ##############################################################################################
  public queueUpdate(updates: ViewParamsUpdate, forceImmediate: boolean = false): void {
    this.log.info("ViewParamsUpdateQueue: queueing updates", updates, "forceImmediate:", forceImmediate);

    // Merge new updates with pending ones
    this.pendingUpdates = {
      ...this.pendingUpdates,
      ...updates,
    };

    // Clear existing timer
    this.clearTimer();

    if (forceImmediate) {
      // Process immediately
      this.processPendingUpdates();
    } else {
      // Start a new timer for delayed processing
      this.timer = setTimeout(() => {
        this.processPendingUpdates();
      }, this.config.delayMs);
    }

    // this.log.info(`ViewParamsUpdateQueue: timer set for ${this.config.delayMs}ms`);
  }

  // ##############################################################################################
  private async processPendingUpdates(): Promise<void> {
    if (Object.keys(this.pendingUpdates?.updates??{}).length === 0) {
      this.log.info("ViewParamsUpdateQueue: no pending updates to process");
      return;
    }

    this.log.info("ViewParamsUpdateQueue: processing pending updates", this.pendingUpdates);

    try {
      // Create the updateInstance action
      const updateAction = {
        actionType: "updateInstance" as const,
        endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89" as const,
        deploymentUuid: this.config.deploymentUuid,
        payload: {
          applicationSection: "data" as const,
          objects: [
            {
              parentName: entityViewParams.name,
              parentUuid: entityViewParams.uuid, // ViewParams entity UUID
              applicationSection: "data" as const,
              instances: [
                {
                  ...this.pendingUpdates?.currentValue,
                  ...this.pendingUpdates?.updates,
                } as EntityInstance,
              ],
            },
          ],
        },
      };

      this.log.info("ViewParamsUpdateQueue: sending updateInstance action", updateAction);

      await this.domainController.handleAction(updateAction);

      this.log.info("ViewParamsUpdateQueue: successfully updated view params");

      // Clear pending updates after successful save
      this.pendingUpdates = undefined;
    } catch (error) {
      this.log.error("ViewParamsUpdateQueue: failed to update view params", error);
      // Keep pending updates in case of failure, they'll be retried on next update
    }

    this.timer = null;
  }

  private clearTimer(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  public hasPendingUpdates(): boolean {
    return Object.keys(this.pendingUpdates?.updates??{}).length > 0;
  }

  public getPendingUpdates(): ViewParamsUpdate | undefined {
    return this.pendingUpdates;
  }

  public flushImmediately(): Promise<void> {
    if (this.timer) {
      this.clearTimer();
      return this.processPendingUpdates();
    }
    return Promise.resolve();
  }

  public updateConfig(newConfig: Partial<ViewParamsUpdateQueueConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig,
    };
    this.log.info("ViewParamsUpdateQueue: config updated", this.config);
  }
}
