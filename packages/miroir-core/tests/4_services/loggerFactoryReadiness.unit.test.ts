import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MiroirActivityTracker } from "../../src/3_controllers/MiroirActivityTracker";
import { MiroirEventService } from "../../src/3_controllers/MiroirEventService";
import { MiroirLoggerFactory } from "../../src/4_services/MiroirLoggerFactory";
import type {
  LoggerFactoryInterface,
  LoggerInterface,
  LoggerOptions,
} from "../../src/0_interfaces/4-services/LoggerInterface";

function mockInnerLogger(): LoggerInterface {
  return {
    name: "mock",
    level: 2,
    levels: { TRACE: 0, DEBUG: 1, INFO: 2, WARN: 3, ERROR: 4, SILENT: 5 },
    disable: () => {},
    enable: () => {},
    trace: () => {},
    debug: () => {},
    log: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
  } as LoggerInterface;
}

describe("MiroirLoggerFactory readiness (#43)", () => {
  let previousTracker: typeof MiroirLoggerFactory.activityTracker;
  let previousEvents: typeof MiroirLoggerFactory.eventService;
  let previousFactory: typeof MiroirLoggerFactory.logLevelNextAsFactory;
  let previousOptions: typeof MiroirLoggerFactory.loggerOptions;

  beforeEach(() => {
    previousTracker = MiroirLoggerFactory.activityTracker;
    previousEvents = MiroirLoggerFactory.eventService;
    previousFactory = MiroirLoggerFactory.logLevelNextAsFactory;
    previousOptions = MiroirLoggerFactory.loggerOptions;
  });

  afterEach(() => {
    MiroirLoggerFactory.activityTracker = previousTracker;
    MiroirLoggerFactory.eventService = previousEvents;
    MiroirLoggerFactory.logLevelNextAsFactory = previousFactory;
    MiroirLoggerFactory.loggerOptions = previousOptions;
    vi.restoreAllMocks();
  });

  it("whenRegisteredLoggersStarted resolves even if start was never called", async () => {
    await expect(MiroirLoggerFactory.whenRegisteredLoggersStarted()).resolves.toBeUndefined();
  });

  it("registerLoggerToStart after start returns a logger instead of hanging", async () => {
    const tracker = new MiroirActivityTracker();
    const eventService = new MiroirEventService(tracker);
    const loggerFactory = {
      create: vi.fn(() => mockInnerLogger()),
      get loggers() {
        return {};
      },
    } as unknown as LoggerFactoryInterface;
    const loggerOptions = {
      defaultLevel: "INFO",
      defaultTemplate: "[{{time}}] {{level}} {{name}}### ",
      specificLoggerOptions: {},
    } as LoggerOptions;

    MiroirLoggerFactory.activityTracker = tracker;
    MiroirLoggerFactory.eventService = eventService;
    MiroirLoggerFactory.logLevelNextAsFactory = loggerFactory;
    MiroirLoggerFactory.loggerOptions = loggerOptions;

    const logger = await Promise.race([
      MiroirLoggerFactory.registerLoggerToStart("slice2-late-logger"),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("late register hung")), 1000),
      ),
    ]);
    expect(logger).toBeDefined();
    expect(loggerFactory.create).toHaveBeenCalled();
    tracker.destroy();
  });
});
