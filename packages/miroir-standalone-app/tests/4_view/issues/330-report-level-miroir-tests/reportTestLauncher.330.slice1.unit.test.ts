/**
 * Issue #330 Slice 1: `testMiroir` routes the Report suites (a `reportTest` leaf mounts a Report)
 * to their DOM entry, and refuses a selection mixing them with runner / action suites.
 *
 * Run:
 * ```bash
 * npm run testByFile -w miroir-standalone-app -- reportTestLauncher.330.slice1
 * ```
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { miroirTestSuiteMountsReport } from "miroir-core";
import { loadApplicationMiroirTestCatalog } from "miroir-core/src/5_tests/loadApplicationMiroirTestsFromFolders.js";

import {
  MIROIR_REPORT_TEST_VITEST_ENTRY,
  MIROIR_RUNNER_TEST_SHARED_VITEST_ENTRY,
  resolveVitestEntry,
} from "../../../../scripts/testMiroirLauncher.js";

const ENV_KEYS = ["MIROIR_TEST_MODE", "MIROIR_TEST_SUITES", "MIROIR_TEST_TAGS"] as const;

function spawnedSuites(spawnEnv: NodeJS.ProcessEnv): string[] {
  return (spawnEnv.MIROIR_TEST_SUITES ?? "").split(",").filter(Boolean).sort();
}

describe("testMiroirLauncher and Report suites (#330)", () => {
  const savedEnv: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>> = {};

  beforeEach(() => {
    for (const key of ENV_KEYS) {
      savedEnv[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (savedEnv[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = savedEnv[key];
      }
    }
  });

  it("routes a Report suite to the Report entry, with or without --shared", () => {
    for (const extraArgs of [[], ["--shared"]]) {
      const { vitestEntry, spawnEnv } = resolveVitestEntry(process.env, [
        "--suites",
        "report.bookDetails",
        "--mode",
        "integ",
        ...extraArgs,
      ]);
      expect(vitestEntry).toBe(MIROIR_REPORT_TEST_VITEST_ENTRY);
      expect(spawnedSuites(spawnEnv)).toEqual(["report.bookDetails"]);
    }
  });

  it("--tags ui in integ mode selects the Report suites only", () => {
    const catalog = loadApplicationMiroirTestCatalog();
    const { vitestEntry, spawnEnv } = resolveVitestEntry(process.env, ["--tags", "ui", "--mode", "integ"]);
    expect(vitestEntry).toBe(MIROIR_REPORT_TEST_VITEST_ENTRY);
    const suites = spawnedSuites(spawnEnv);
    expect(suites).toContain("report.bookDetails");
    for (const suite of suites) {
      const entry = catalog.find((catalogEntry) => catalogEntry.suiteKey === suite);
      expect(entry && miroirTestSuiteMountsReport(entry.suiteDefinition), suite).toBe(true);
    }
  });

  it("leaves the Report suites out of an implicit selection of every suite", () => {
    for (const suitesArgs of [[], ["--suites", "*"]]) {
      const { vitestEntry, spawnEnv } = resolveVitestEntry(process.env, [
        ...suitesArgs,
        "--mode",
        "integ",
        "--shared",
      ]);
      expect(vitestEntry).toBe(MIROIR_RUNNER_TEST_SHARED_VITEST_ENTRY);
      const suites = spawnedSuites(spawnEnv);
      expect(suites).toContain("runner.lendDocument");
      expect(suites).not.toContain("report.bookDetails");
    }
  });

  it("refuses a selection with both Report and runner suites", () => {
    expect(() =>
      resolveVitestEntry(process.env, [
        "--suites",
        "report.bookDetails,runner.createEntity",
        "--mode",
        "integ",
      ]),
    ).toThrow(/both Report suites \(report\.bookDetails\) and runner \/ action suites \(runner\.createEntity\)/);
  });

  it("refuses a tag selection spanning Report and action suites", () => {
    // `report` also tags action.scenario.multistepReportTemplate, an action suite about Reports
    expect(() => resolveVitestEntry(process.env, ["--tags", "report", "--mode", "integ"])).toThrow(
      /both Report suites \(report\.bookDetails\) and runner \/ action suites \(action\.scenario\.multistepReportTemplate\)/,
    );
  });
});
