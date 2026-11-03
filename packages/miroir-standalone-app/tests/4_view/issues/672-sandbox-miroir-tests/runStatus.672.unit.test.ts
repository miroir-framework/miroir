/**
 * #672: a MiroirTest display shows the state of its last run as `data-miroir-test-status`, which
 * the sandbox smoke test waits for.
 *
 * Run:
 * ```bash
 * npm run testByFile -w miroir-standalone-app -- runStatus.672
 * ```
 */
import { describe, expect, it } from "vitest";

import { runStatusOfResults } from "miroir-react-testing/src/4_view/components/Reports/MiroirTestDisplay.js";
import type { MiroirTestResultData } from "miroir-react-testing/src/4_view/components/Buttons/RunMiroirTestSuiteButton.js";

const result = (testResult: MiroirTestResultData["testResult"]): MiroirTestResultData => ({
  testName: "t",
  testPath: ["s", "t"],
  testResult,
  status: testResult,
  failedAssertions: undefined,
  assertionCount: 1,
  assertions: "",
  fullAssertionsResults: undefined,
});

describe("runStatusOfResults (#672)", () => {
  it("passes when no result is an error, skipped ones included", () => {
    expect(runStatusOfResults([result("ok"), result("skipped")])).toEqual({
      status: "passed",
      summary: "1 passed, 0 failed, 1 skipped",
    });
  });

  it("fails when a result is an error", () => {
    expect(runStatusOfResults([result("ok"), result("error")]).status).toBe("failed");
  });

  it("fails a run without results", () => {
    expect(runStatusOfResults([])).toEqual({ status: "failed", summary: "no test result" });
  });
});
