import {
  MiroirActivityTracker,
  MiroirEventService,
  MiroirLoggerFactory,
  type LoggerFactoryInterface,
  type LoggerOptions,
} from "miroir-core";

export class IntegTestRunAlreadyActiveError extends Error {
  constructor() {
    super("An integration test run is already in progress");
    this.name = "IntegTestRunAlreadyActiveError";
  }
}

export class IntegTestRunCoordinator {
  private held = false;

  get isRunning(): boolean {
    return this.held;
  }

  acquire(): void {
    if (this.held) {
      throw new IntegTestRunAlreadyActiveError();
    }
    this.held = true;
  }

  release(): void {
    this.held = false;
  }

  async runExclusive<T>(fn: () => Promise<T>): Promise<T> {
    this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
}

let sharedCoordinator: IntegTestRunCoordinator | undefined;

export function getIntegTestRunCoordinator(): IntegTestRunCoordinator {
  sharedCoordinator ??= new IntegTestRunCoordinator();
  return sharedCoordinator;
}

/** Test-only reset — not for production UI. */
export function resetIntegTestRunCoordinatorForTests(): void {
  sharedCoordinator = undefined;
}

export type IntegActivityTrackerBundle = {
  miroirActivityTracker: MiroirActivityTracker;
  miroirEventService: MiroirEventService;
};

export type CreateIntegActivityTrackerOptions = {
  loggerFactory?: LoggerFactoryInterface;
  loggerOptions?: LoggerOptions;
  /** When false, skip logger wiring even if factory/options are set. */
  wireLoggers?: boolean;
};

export async function createIntegActivityTracker(
  options: CreateIntegActivityTrackerOptions = {},
): Promise<IntegActivityTrackerBundle> {
  const miroirActivityTracker = new MiroirActivityTracker();
  const miroirEventService = new MiroirEventService(miroirActivityTracker);

  const { loggerFactory, loggerOptions, wireLoggers } = options;

  if (wireLoggers !== false && loggerFactory !== undefined && loggerOptions !== undefined) {
    await MiroirLoggerFactory.startRegisteredLoggers(
      miroirActivityTracker,
      miroirEventService,
      loggerFactory,
      loggerOptions,
    );
  }

  return { miroirActivityTracker, miroirEventService };
}

/** Synchronous bundle when integ run does not need logger wiring (typical unit tests). */
export function createIntegActivityTrackerSync(): IntegActivityTrackerBundle {
  const miroirActivityTracker = new MiroirActivityTracker();
  const miroirEventService = new MiroirEventService(miroirActivityTracker);
  return { miroirActivityTracker, miroirEventService };
}
