import { describe, expect, it } from "vitest";

import {
  DEFAULT_LOG_CONFIG_NAME,
  resolveWebLogConfig,
  resolveWebLogConfigWithMeta,
  VITE_MIROIR_LOG_CONFIG_VALUES,
} from "../../src/config/logConfigPresets.js";

describe("logConfigPresets", () => {
  it("resolves a preset by bare name", () => {
    const resolution = resolveWebLogConfigWithMeta("scope-ui");
    expect(resolution.presetName).toBe("scope-ui");
    expect(resolution.usedFallback).toBe(false);
    expect(resolution.loggerOptions.defaultLevel).toBe("WARN");
    expect(Object.keys(resolution.loggerOptions.specificLoggerOptions)).toContain(
      "4_miroir-standalone-app_ReduxHooks",
    );
  });

  it("resolves a preset from a json path basename", () => {
    const resolution = resolveWebLogConfigWithMeta(
      "./packages/miroir-standalone-app/config/logging/scope-ui.json",
    );
    expect(resolution.presetName).toBe("scope-ui");
    expect(resolution.usedFallback).toBe(false);
  });

  it("falls back to catch-all for unknown selections", () => {
    const resolution = resolveWebLogConfigWithMeta("does-not-exist");
    expect(resolution.presetName).toBe(DEFAULT_LOG_CONFIG_NAME);
    expect(resolution.usedFallback).toBe(true);
    expect(resolution.rawSelection).toBe("does-not-exist");
  });

  it("resolveWebLogConfig returns logger options only", () => {
    expect(resolveWebLogConfig("full-debug").defaultLevel).toBe("DEBUG");
  });

  it("exports valid env values for VITE_MIROIR_LOG_CONFIG", () => {
    expect(VITE_MIROIR_LOG_CONFIG_VALUES).toContain("scope-ui");
    expect(VITE_MIROIR_LOG_CONFIG_VALUES).toContain(DEFAULT_LOG_CONFIG_NAME);
  });
});
