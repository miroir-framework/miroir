/**
 * #487: the result of a self-test run, the one shape the page, `window`, the Electron main process
 * and the drivers read.
 */
import type { MiroirConfigClient } from "miroir-core";

import { countTestResults } from "../../4_view/components/Buttons/testResultReport.js";
import type { MiroirTestSuiteResultsMap } from "../miroirTestBatch.js";

export type MiroirSelfTestVerdict = "running" | "passed" | "failed";

export type MiroirSelfTestFailure = {
  suiteKey: string;
  testPath: string[];
  failedAssertions: string[];
};

export type MiroirSelfTestResult = {
  verdict: MiroirSelfTestVerdict;
  environment: string | undefined;
  tags: string[];
  startedAt: string;
  durationMs?: number;
  counts?: { suites: number; tests: number; passed: number; failed: number; skipped: number };
  failures?: MiroirSelfTestFailure[];
  /** A boot or runner error: the verdict is `failed`. */
  error?: string;
};

/** The tags a self-test runs: those of `client.selfTest`, `unit` when it names none. */
export function selfTestTags(miroirConfig: MiroirConfigClient): string[] {
  const tags = miroirConfig.selfTest?.tags;
  return tags && tags.length > 0 ? [...tags] : ["unit"];
}

/** The result of a finished run: `passed` when at least one test ran and none failed. */
export function computeSelfTestResult(
  resultsBySuiteKey: MiroirTestSuiteResultsMap,
  run: { environment: string | undefined; tags: string[]; startedAt: Date; endedAt: Date },
): MiroirSelfTestResult {
  const allResults = Object.values(resultsBySuiteKey).flat();
  const { passed, failed, skipped } = countTestResults(allResults);
  const failures: MiroirSelfTestFailure[] = Object.entries(resultsBySuiteKey).flatMap(([suiteKey, results]) =>
    countTestResults(results).failed === 0
      ? []
      : results
          .filter((result) => countTestResults([result]).failed > 0)
          .map((result) => ({
            suiteKey,
            testPath: result.testPath,
            failedAssertions: result.failedAssertions ?? [],
          })),
  );
  return {
    verdict: allResults.length > 0 && failed === 0 ? "passed" : "failed",
    environment: run.environment,
    tags: run.tags,
    startedAt: run.startedAt.toISOString(),
    durationMs: run.endedAt.getTime() - run.startedAt.getTime(),
    counts: { suites: Object.keys(resultsBySuiteKey).length, tests: allResults.length, passed, failed, skipped },
    failures,
    ...(allResults.length === 0 ? { error: `no MiroirTest ran for tags ${run.tags.join(", ")}` } : {}),
  };
}

/** The result of a run that could not start or finish: a boot, configuration or runner error. */
export function failedSelfTestResult(
  error: string,
  run: { environment: string | undefined; tags: string[]; startedAt: Date; endedAt: Date },
): MiroirSelfTestResult {
  return {
    verdict: "failed",
    environment: run.environment,
    tags: run.tags,
    startedAt: run.startedAt.toISOString(),
    durationMs: run.endedAt.getTime() - run.startedAt.getTime(),
    error,
  };
}
