import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { defaultLevels, type LoggerInterface } from "../../src/0_interfaces/4-services/LoggerInterface.js";
import { MiroirActivityTracker } from "../../src/3_controllers/MiroirActivityTracker.js";
import { MiroirEventService } from "../../src/3_controllers/MiroirEventService.js";
import { MiroirLoggerFactory } from "../../src/4_services/MiroirLoggerFactory.js";
import { PreStartLogger } from "../../src/4_services/PreStartLogger.js";

describe("PreStartLogger (#43)", () => {
  it("suppresses INFO before bind when fallback level is WARN", () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const pre = new PreStartLogger("3_miroir-core_ConfigurationService", defaultLevels.WARN);
    pre.info("should not print");
    pre.warn("should print");

    expect(infoSpy).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(String(warnSpy.mock.calls[0][0])).toContain("ConfigurationService ###");

    infoSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it("delegates to real logger after bind", () => {
    const delegate: LoggerInterface = {
      name: "real",
      level: defaultLevels.DEBUG,
      levels: defaultLevels,
      set level(_v) {},
      disable: () => {},
      enable: () => {},
      trace: vi.fn(),
      debug: vi.fn(),
      log: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    const pre = new PreStartLogger("3_miroir-core_RestClientStub", defaultLevels.WARN);
    pre.bind(delegate);
    pre.info("forwarded");

    expect(delegate.info).toHaveBeenCalledWith("forwarded");
  });
});

describe("MiroirLoggerFactory pre-start handshake (#43)", () => {
  const savedEnv: Record<string, string | undefined> = {};

  beforeEach(() => {
    savedEnv.MIROIR_LOG_CONFIG = process.env.MIROIR_LOG_CONFIG;
    savedEnv.VITE_MIROIR_LOG_CONFIG_FILENAME = process.env.VITE_MIROIR_LOG_CONFIG_FILENAME;
    delete process.env.MIROIR_LOG_CONFIG;
    delete process.env.VITE_MIROIR_LOG_CONFIG_FILENAME;
    MiroirLoggerFactory.preStartLoggers = {};
    MiroirLoggerFactory.registeredLoggersToStart = {};
    MiroirLoggerFactory.startPromise = undefined;
  });

  afterEach(() => {
    if (savedEnv.MIROIR_LOG_CONFIG === undefined) {
      delete process.env.MIROIR_LOG_CONFIG;
    } else {
      process.env.MIROIR_LOG_CONFIG = savedEnv.MIROIR_LOG_CONFIG;
    }
    if (savedEnv.VITE_MIROIR_LOG_CONFIG_FILENAME === undefined) {
      delete process.env.VITE_MIROIR_LOG_CONFIG_FILENAME;
    } else {
      process.env.VITE_MIROIR_LOG_CONFIG_FILENAME = savedEnv.VITE_MIROIR_LOG_CONFIG_FILENAME;
    }
  });

  it("getPreStartLogger returns stable instance per name", () => {
    const a = MiroirLoggerFactory.getPreStartLogger("3_miroir-core_Test");
    const b = MiroirLoggerFactory.getPreStartLogger("3_miroir-core_Test");
    expect(a).toBe(b);
    expect(a).toBeInstanceOf(PreStartLogger);
  });

  it("whenRegisteredLoggersStarted resolves after startRegisteredLoggers", async () => {
    const tracker = new MiroirActivityTracker();
    const events = new MiroirEventService(tracker);
    const factory = { create: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(), trace: vi.fn(), log: vi.fn(), level: 0, levels: defaultLevels, disable: () => {}, enable: () => {}, name: "x" }) };

    const loggerName = "3_miroir-core_ConfigurationService";
    void MiroirLoggerFactory.registerLoggerToStart(loggerName);

    let started = false;
    void MiroirLoggerFactory.whenRegisteredLoggersStarted().then(() => {
      started = true;
    });

    expect(started).toBe(false);

    await MiroirLoggerFactory.startRegisteredLoggers(tracker, events, factory as any, {
      defaultLevel: "WARN",
      defaultTemplate: "[{{time}}] {{level}} {{name}} ### ",
      specificLoggerOptions: {},
    });

    expect(started).toBe(true);
    expect(MiroirLoggerFactory.getPreStartLogger(loggerName)).toBeDefined();
  });
});
