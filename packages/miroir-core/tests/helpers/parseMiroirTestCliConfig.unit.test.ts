import { describe, expect, it } from "vitest";

import {
  miroirTestCliConfigToEnv,
  parseMiroirTestCliArgs,
  parseMiroirTestCliConfig,
} from "./parseMiroirTestCliConfig";

describe("parseMiroirTestCliConfig (Phase 2)", () => {
  it("reads suite keys and mode from env", () => {
    const config = parseMiroirTestCliConfig(
      {
        MIROIR_TEST_SUITES: "schema_pilot_empty,tools.test",
        MIROIR_TEST_MODE: "unit",
      },
      [],
    );
    expect(config.suiteKeys).toEqual(["schema_pilot_empty", "tools.test"]);
    expect(config.executionMode).toBe("unit");
    expect(config.vitestEntry).toBe("miroir-tests.unit.test");
  });

  it("argv overrides env", () => {
    const config = parseMiroirTestCliConfig(
      {
        MIROIR_TEST_SUITES: "legacy_suite",
        MIROIR_TEST_MODE: "unit",
      },
      ["--suites", "schema_pilot_empty", "--mode", "integration"],
    );
    expect(config.suiteKeys).toEqual(["schema_pilot_empty"]);
    expect(config.executionMode).toBe("integration");
    expect(config.vitestEntry).toBe("miroir-tests.integ.test");
  });

  it("parses filter JSON from env and argv", () => {
    const fromEnv = parseMiroirTestCliConfig(
      {
        MIROIR_TEST_FILTER: '{"schema_pilot_empty":["leaf-a"]}',
      },
      [],
    );
    expect(fromEnv.filter).toEqual({ schema_pilot_empty: ["leaf-a"] });

    const fromArgv = parseMiroirTestCliConfig(
      {},
      ["--filter", '{"mustache":["case 1"]}'],
    );
    expect(fromArgv.filter).toEqual({ mustache: ["case 1"] });
  });

  it("returns empty suite list when nothing is configured", () => {
    const config = parseMiroirTestCliConfig({}, []);
    expect(config.suiteKeys).toEqual([]);
  });

  it("parseMiroirTestCliArgs supports short flags", () => {
    expect(
      parseMiroirTestCliArgs(["-s", "a,b", "-m", "unit", "-f", '{"a":["x"]}']),
    ).toEqual({
      suiteKeys: ["a", "b"],
      executionMode: "unit",
      filter: { a: ["x"] },
    });
  });

  it("miroirTestCliConfigToEnv round-trips core fields", () => {
    const env = miroirTestCliConfigToEnv({
      suiteKeys: ["schema_pilot_empty"],
      executionMode: "integration",
      filter: { schema_pilot_empty: ["leaf"] },
    });
    expect(env.MIROIR_TEST_SUITES).toBe("schema_pilot_empty");
    expect(env.MIROIR_TEST_MODE).toBe("integration");
    expect(env.MIROIR_TEST_FILTER).toBe('{"schema_pilot_empty":["leaf"]}');
  });
});
