import { describe, expect, it } from "vitest";

import { listMiroirTestSuiteKeys } from "../../src/5_tests/miroirCoreTestSuiteRegistry";
import {
  miroirTestCliConfigToEnv,
  miroirCoreTestVitestEntry,
  parseMiroirTestCliArgs,
  parseMiroirTestCliConfig,
  resolveMiroirTestSuiteKeys,
} from "../../src/5_tests/parseMiroirTestCliConfig";

describe("parseMiroirTestCliConfig (Phase 2)", () => {
  it("miroirCoreTestVitestEntry follows execution mode", () => {
    expect(miroirCoreTestVitestEntry("unit")).toBe("miroir-core-tests.unit.test");
    expect(miroirCoreTestVitestEntry("integration")).toBe("miroir-core-tests.integ.test");
  });

  it("reads suite keys and mode from env", () => {
    const config = parseMiroirTestCliConfig(
      {
        MIROIR_TEST_SUITES: "mergePositionBased,tools",
        MIROIR_TEST_MODE: "unit",
      },
      [],
    );
    expect(config.suiteKeys).toEqual(["mergePositionBased", "tools"]);
    expect(config.executionMode).toBe("unit");
    expect(miroirCoreTestVitestEntry(config.executionMode)).toBe("miroir-core-tests.unit.test");
  });

  it("argv overrides env", () => {
    const config = parseMiroirTestCliConfig(
      {
        MIROIR_TEST_SUITES: "legacy_suite",
        MIROIR_TEST_MODE: "unit",
      },
      ["--suites", "mergePositionBased", "--mode", "integration"],
    );
    expect(config.suiteKeys).toEqual(["mergePositionBased"]);
    expect(config.executionMode).toBe("integration");
    expect(miroirCoreTestVitestEntry(config.executionMode)).toBe("miroir-core-tests.integ.test");
  });

  it("parses filter JSON from env and argv", () => {
    const fromEnv = parseMiroirTestCliConfig(
      {
        MIROIR_TEST_FILTER: '{"mergePositionBased":["merges two undefineds into undefined"]}',
      },
      [],
    );
    expect(fromEnv.filter).toEqual({
      mergePositionBased: ["merges two undefineds into undefined"],
    });

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
      suiteKeys: ["mergePositionBased"],
      executionMode: "integration",
      filter: { mergePositionBased: ["merges two undefineds into undefined"] } as any,
    });
    expect(env.MIROIR_TEST_SUITES).toBe("mergePositionBased");
    expect(env.MIROIR_TEST_MODE).toBe("integration");
    expect(env.MIROIR_TEST_FILTER).toBe(
      '{"mergePositionBased":["merges two undefineds into undefined"]}',
    );
  });

  it("miroirTestCliConfigToEnv uses '*' when all suites are selected", () => {
    const env = miroirTestCliConfigToEnv({
      suiteKeys: listMiroirTestSuiteKeys(),
      executionMode: "unit",
    });
    expect(env.MIROIR_TEST_SUITES).toBe("*");
  });
});
