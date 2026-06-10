import { describe, expect, it } from "vitest";

import { listMiroirTestSuiteKeys } from "./miroirTestSuiteRegistry";
import {
  miroirTestCliConfigToEnv,
  parseMiroirTestCliArgs,
  parseMiroirTestCliConfig,
  resolveMiroirTestSuiteKeys,
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

  it("selects all registered suites when nothing is configured", () => {
    const config = parseMiroirTestCliConfig({}, []);
    expect(config.suiteKeys).toEqual(listMiroirTestSuiteKeys());
  });

  it("selects all registered suites for --suites '*'", () => {
    const config = parseMiroirTestCliConfig({}, ["--suites", "*"]);
    expect(config.suiteKeys).toEqual(listMiroirTestSuiteKeys());
  });

  it("resolveMiroirTestSuiteKeys treats empty and '*' as all suites", () => {
    const all = listMiroirTestSuiteKeys();
    expect(resolveMiroirTestSuiteKeys([])).toEqual(all);
    expect(resolveMiroirTestSuiteKeys(["*"])).toEqual(all);
    expect(resolveMiroirTestSuiteKeys(["mustache"])).toEqual(["mustache"]);
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

  it("miroirTestCliConfigToEnv uses '*' when all suites are selected", () => {
    const env = miroirTestCliConfigToEnv({
      suiteKeys: listMiroirTestSuiteKeys(),
      executionMode: "unit",
    });
    expect(env.MIROIR_TEST_SUITES).toBe("*");
  });
});
