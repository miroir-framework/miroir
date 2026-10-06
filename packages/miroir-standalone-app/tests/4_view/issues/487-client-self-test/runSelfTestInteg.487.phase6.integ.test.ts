/**
 * #487 Slice 6: `integ` in the self-test tags adds the integration batch (D8). The batch itself runs
 * in a browser (emulatedServer-indexedDb writes to the browser's IndexedDB): its proof is
 * `npm run selfTest -- --serve` on the `self-test-integ` environment, in the plan's validation. Here:
 * the environment, and the suites the batch leaves out without loading the launcher.
 *
 * Run:
 *   RUN_TEST=runSelfTestInteg.487.phase6.integ npm run testByFile -w miroir-standalone-app -- runSelfTestInteg.487.phase6.integ
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import type { MiroirTestDefinition } from "miroir-core";
import { environmentRealServerClientConfig, resolveEnvironmentFromFiles } from "miroir-env";

import {
  REPORT_TESTS_NEED_THE_SANDBOX,
  runIntegrationMiroirTestBatch,
} from "../../../../src/miroir-fwk/4-tests/miroirTestBatch.js";
import { computeSelfTestResult } from "../../../../src/miroir-fwk/4-tests/selfTest/selfTestResult.js";
import { integrationSuiteKey } from "../../../../src/miroir-fwk/4-tests/selfTest/runSelfTest.js";
import { repositoryRoot } from "./selfTestPlatform.js";

/** The miroir app's MiroirTest of the external service wizard Report: tags integ, ui, report. */
function reportMiroirTest(): MiroirTestDefinition {
  return JSON.parse(
    readFileSync(
      path.join(
        repositoryRoot,
        "packages/miroir-app-miroir/assets/miroir_data/a311f363-e238-4203-bdfc-29e8c160c26b/6446d8b1-8268-4e29-b234-37a267cb7c6b.json",
      ),
      "utf8",
    ),
  );
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
});
