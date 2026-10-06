/**
 * The self-test driver's arithmetic (scripts/selfTestDriverCore.mjs, #487): exit codes, arguments
 * and the console summary. The real run, in a browser on a served build, is in the plan's
 * validation (`npm run selfTest -- --serve`) and in the self-test workflow.
 *
 * Not reachable through MiroirTest: it tests the build tooling.
 */
import { describe, expect, it } from "vitest";

import {
  DEFAULT_SELF_TEST_TIMEOUT_SECONDS,
  parseSelfTestDriverArgs,
  selfTestExitCode,
  selfTestSummaryLines,
} from "../../scripts/selfTestDriverCore.mjs";

const result = {
  verdict: "failed",
  environment: "self-test",
  tags: ["unit"],
  startedAt: "2026-10-06T00:00:00.000Z",
  counts: { suites: 2, tests: 3, passed: 2, failed: 1, skipped: 0 },
  failures: [{ suiteKey: "tr.menuBuild", testPath: ["menuBuild", "adds an item"], failedAssertions: ["expected 1 to be 2"] }],
};

describe("self-test driver (#487)", () => {
  it("exits 0 when passed, 1 when failed, 2 without a verdict", () => {
    expect(selfTestExitCode({ verdict: "passed" })).toBe(0);
    expect(selfTestExitCode({ verdict: "failed" })).toBe(1);
    expect(selfTestExitCode({ verdict: "running" })).toBe(2);
    expect(selfTestExitCode(undefined)).toBe(2);
  });

  it("takes the coverage tour's defaults, plus a timeout", () => {
    expect(parseSelfTestDriverArgs([], { MIROIR_TOUR_BROWSER: "/opt/chromium" })).toEqual({
      serve: false,
      url: "https://localhost:3080",
      browser: "/opt/chromium",
      timeoutSeconds: DEFAULT_SELF_TEST_TIMEOUT_SECONDS,
      headed: false,
      out: undefined,
    });
    expect(
      parseSelfTestDriverArgs(["--serve", "--url", "https://localhost:4000", "--timeout", "30", "--headed", "--out", "r.json"], {}),
    ).toEqual({ serve: true, url: "https://localhost:4000", browser: undefined, timeoutSeconds: 30, headed: true, out: "r.json" });
  });

  it("refuses a timeout that is not a positive number", () => {
    expect(() => parseSelfTestDriverArgs(["--timeout", "soon"], {})).toThrow(/--timeout/);
    expect(() => parseSelfTestDriverArgs(["--timeout", "0"], {})).toThrow(/--timeout/);
  });

  it("summarizes the counts and every failed assertion", () => {
    expect(selfTestSummaryLines(result)).toEqual([
      "self-test failed on self-test (tags unit): 2 passed, 1 failed, 0 skipped in 2 suite(s)",
      "  FAILED tr.menuBuild > menuBuild > adds an item",
      "    expected 1 to be 2",
    ]);
    expect(selfTestSummaryLines({ ...result, counts: undefined, failures: undefined, error: "boot failed" })).toEqual([
      "self-test failed on self-test (tags unit): no test ran",
      "  error: boot failed",
    ]);
    expect(selfTestSummaryLines(undefined)).toEqual(["self-test: the page published no result"]);
  });
});
