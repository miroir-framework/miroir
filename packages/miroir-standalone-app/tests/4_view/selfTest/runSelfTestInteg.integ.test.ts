/**
 * #487: `integ` in the self-test tags adds the integration batch (D8). The batch itself runs
 * in a browser (emulatedServer-indexedDb writes to the browser's IndexedDB): its proof is
 * `npm run selfTest -- --serve` on the `self-test-integ` environment, in the plan's validation. Here:
 * the environment, and the suites the batch leaves out without loading the launcher.
 *
 * Run:
 *   npm run testByFile -w miroir-standalone-app -- runSelfTestInteg.integ
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import type { MiroirTestDefinition } from "@miroir-framework/core";
import { environmentRealServerClientConfig, resolveEnvironmentFromFiles } from "@miroir-framework/env";

import {
  FILESYSTEM_TESTS_NEED_A_FILESYSTEM_STORE,
  REPORT_TESTS_NEED_THE_SANDBOX,
  runIntegrationMiroirTestBatch,
  runUnitMiroirTestBatch,
  skippedSuiteResults,
} from "../../../src/miroir-fwk/4-tests/miroirTestBatch.js";
import { computeSelfTestResult } from "../../../src/miroir-fwk/4-tests/selfTest/selfTestResult.js";
import { integrationSuiteKey } from "../../../src/miroir-fwk/4-tests/selfTest/runSelfTest.js";
import { miroirActivityTracker, repositoryRoot } from "./selfTestPlatform.js";

function miroirAppMiroirTest(uuid: string): MiroirTestDefinition {
  return JSON.parse(
    readFileSync(
      path.join(
        repositoryRoot,
        `packages/miroir-app-miroir/assets/miroir_data/a311f363-e238-4203-bdfc-29e8c160c26b/${uuid}.json`,
      ),
      "utf8",
    ),
  );
}

/** The miroir app's MiroirTest of the external service wizard Report: tags integ, ui, report. */
function reportMiroirTest(): MiroirTestDefinition {
  return miroirAppMiroirTest("6446d8b1-8268-4e29-b234-37a267cb7c6b");
}

describe("self-test with integ MiroirTests (#487)", () => {
  it("the self-test-integ environment runs the unit and the integ MiroirTests", () => {
    const resolved = resolveEnvironmentFromFiles({ cwd: repositoryRoot, env: { MIROIR_ENV: "self-test-integ" } });
    expect(environmentRealServerClientConfig(resolved).selfTest).toEqual({ enabled: true, tags: ["unit", "integ"] });
    expect(resolved.deployments.map((deployment) => deployment.applicationKey).sort()).toEqual(["admin", "miroir"]);
  });

  it("lists reportTest suites as not run when there is no component test sandbox", async () => {
    const report = reportMiroirTest();
    expect(report.tags).toEqual(expect.arrayContaining(["integ", "report"]));

    const batch = await runIntegrationMiroirTestBatch({ miroirTests: [report] });

    expect(batch.resultsBySuiteKey).toEqual({});
    expect(batch.failures).toEqual([]);
    expect(batch.skipped).toEqual([{ suiteKey: expect.any(String), reason: REPORT_TESTS_NEED_THE_SANDBOX }]);
  });

  it("lists the suites deploying on filesystem stores as not run on the in-browser profile (#495)", async () => {
    const filesystemSuites = [
      miroirAppMiroirTest("82ee9f39-654d-4e87-ba52-aecb7faf8483"), // runner.deployApplication
      miroirAppMiroirTest("c22ca343-af4a-4231-9b12-7044b0f53599"), // runner.createApplication
    ];
    for (const suite of filesystemSuites) {
      expect(suite.tags).toEqual(expect.arrayContaining(["integ", "filesystem"]));
    }

    const batch = await runIntegrationMiroirTestBatch({ miroirTests: filesystemSuites });

    expect(batch.resultsBySuiteKey).toEqual({});
    expect(batch.failures).toEqual([]);
    expect(batch.skipped.map((suite) => suite.reason)).toEqual([
      FILESYSTEM_TESTS_NEED_A_FILESYSTEM_STORE,
      FILESYSTEM_TESTS_NEED_A_FILESYSTEM_STORE,
    ]);
    // Run all shows each one as a skipped row carrying the reason
    expect(Object.values(skippedSuiteResults(batch.skipped)).flat()).toEqual([
      expect.objectContaining({ testResult: "skipped", failedAssertions: [FILESYSTEM_TESTS_NEED_A_FILESYSTEM_STORE] }),
      expect.objectContaining({ testResult: "skipped", failedAssertions: [FILESYSTEM_TESTS_NEED_A_FILESYSTEM_STORE] }),
    ]);
  });

  it("reports the suites not run and keeps integration results beside unit results", () => {
    const passedLeaf = {
      testName: "leaf",
      testPath: ["leaf"],
      testResult: "ok" as const,
      status: "ok",
      failedAssertions: [],
      assertionCount: 1,
      assertions: "",
      fullAssertionsResults: undefined,
    };
    const run = { environment: "self-test-integ", tags: ["unit", "integ"], startedAt: new Date(0), endedAt: new Date(10) };
    const result = computeSelfTestResult(
      { "tr.core": [passedLeaf], [integrationSuiteKey("tr.core")]: [passedLeaf] },
      run,
      [{ suiteKey: "report.x", reason: REPORT_TESTS_NEED_THE_SANDBOX }],
    );
    expect(result.verdict).toBe("passed");
    expect(result.counts).toEqual({ suites: 2, tests: 2, passed: 2, failed: 0, skipped: 0 });
    expect(result.skippedSuites).toEqual([{ suiteKey: "report.x", reason: REPORT_TESTS_NEED_THE_SANDBOX }]);
  });

  it("records reportTest leaves as skipped in a unit run, and a run of skipped tests only fails", async () => {
    const report = reportMiroirTest();
    const resultsBySuiteKey = await runUnitMiroirTestBatch({
      miroirTests: [report],
      tracker: miroirActivityTracker,
      includeComponentTests: false,
    });
    const results = Object.values(resultsBySuiteKey).flat();
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((result) => result.testResult === "skipped" || result.status === "skipped")).toBe(true);

    const run = { environment: "self-test", tags: ["report"], startedAt: new Date(0), endedAt: new Date(10) };
    const result = computeSelfTestResult(resultsBySuiteKey, run);
    expect(result.verdict).toBe("failed");
    expect(result.error).toBe("no MiroirTest ran for tags report");
  });
});
