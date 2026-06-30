import { describe, expect, it, vi } from "vitest";

import {
  createIntegActivityTracker,
  createIntegActivityTrackerSync,
  IntegTestRunAlreadyActiveError,
  IntegTestRunCoordinator,
} from "../../src/miroir-fwk/4-tests/integTestRunCoordinator.js";
import {
  MiroirLoggerFactory,
  type LoggerFactoryInterface,
  type LoggerOptions,
} from "miroir-core";

describe("IntegTestRunCoordinator (B1)", () => {
  it("starts idle", () => {
    const coordinator = new IntegTestRunCoordinator();

    expect(coordinator.isRunning).toBe(false);
  });

  it("acquire marks the run as active", () => {
    const coordinator = new IntegTestRunCoordinator();

    coordinator.acquire();

    expect(coordinator.isRunning).toBe(true);
    coordinator.release();
  });

  it("rejects a second acquire while a run is held (D5 — no queue)", () => {
    const coordinator = new IntegTestRunCoordinator();
    coordinator.acquire();

    expect(() => coordinator.acquire()).toThrow(IntegTestRunAlreadyActiveError);
    expect(coordinator.isRunning).toBe(true);

    coordinator.release();
    expect(coordinator.isRunning).toBe(false);
  });

  it("allows acquire again after release", () => {
    const coordinator = new IntegTestRunCoordinator();

    coordinator.acquire();
    coordinator.release();
    expect(() => coordinator.acquire()).not.toThrow();

    coordinator.release();
  });

  it("release is idempotent when idle", () => {
    const coordinator = new IntegTestRunCoordinator();

    expect(() => coordinator.release()).not.toThrow();
    expect(coordinator.isRunning).toBe(false);
  });

  it("runExclusive releases after success", async () => {
    const coordinator = new IntegTestRunCoordinator();
    const fn = vi.fn(async () => "ok");

    await expect(coordinator.runExclusive(fn)).resolves.toBe("ok");

    expect(fn).toHaveBeenCalledOnce();
    expect(coordinator.isRunning).toBe(false);
  });

  it("runExclusive releases in finally when bootstrap throws", async () => {
    const coordinator = new IntegTestRunCoordinator();
    const bootstrapError = new Error("bootstrap failed");

    await expect(
      coordinator.runExclusive(async () => {
        throw bootstrapError;
      }),
    ).rejects.toThrow(bootstrapError);

    expect(coordinator.isRunning).toBe(false);
  });

  it("runExclusive rejects when already held", async () => {
    const coordinator = new IntegTestRunCoordinator();
    coordinator.acquire();

    await expect(coordinator.runExclusive(async () => "never")).rejects.toThrow(
      IntegTestRunAlreadyActiveError,
    );

    coordinator.release();
  });

  it("notifies subscribers when acquire and release change running state (B5)", () => {
    const coordinator = new IntegTestRunCoordinator();
    const states: boolean[] = [];
    const unsubscribe = coordinator.subscribe(() => states.push(coordinator.isRunning));

    coordinator.acquire();
    coordinator.release();
    unsubscribe();

    expect(states).toEqual([true, false]);
  });
});

describe("createIntegActivityTracker (B1)", () => {
  it("returns a fresh tracker and event service pair per call", () => {
    const first = createIntegActivityTrackerSync();
    const second = createIntegActivityTrackerSync();

    expect(first.miroirActivityTracker).not.toBe(second.miroirActivityTracker);
    expect(first.miroirEventService).not.toBe(second.miroirEventService);
  });

  it("does not wire loggers when options are omitted", async () => {
    const startSpy = vi.spyOn(MiroirLoggerFactory, "startRegisteredLoggers");

    await createIntegActivityTracker();

    expect(startSpy).not.toHaveBeenCalled();
    startSpy.mockRestore();
  });

  it("wires loggers when factory and options are provided", async () => {
    const startSpy = vi
      .spyOn(MiroirLoggerFactory, "startRegisteredLoggers")
      .mockResolvedValue(undefined);
    const loggerFactory = { create: vi.fn() } as unknown as LoggerFactoryInterface;
    const loggerOptions = { defaultLevel: "warn" } as LoggerOptions;

    const bundle = await createIntegActivityTracker({
      loggerFactory,
      loggerOptions,
    });

    expect(startSpy).toHaveBeenCalledWith(
      bundle.miroirActivityTracker,
      bundle.miroirEventService,
      loggerFactory,
      loggerOptions,
    );

    startSpy.mockRestore();
  });
});

describe("getIntegTestRunCoordinator (B1)", () => {
  it("returns a shared singleton for the UI launcher", async () => {
    const { getIntegTestRunCoordinator } = await import(
      "../../src/miroir-fwk/4-tests/integTestRunCoordinator.js"
    );

    expect(getIntegTestRunCoordinator()).toBe(getIntegTestRunCoordinator());
  });
});
