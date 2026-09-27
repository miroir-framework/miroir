// ONLY A DEV DEPENDENCY! USED FOR THE TYPE ONLY, PRUNED BY THE TRANSPILER
import * as vitest from "vitest";
type VitestNamespace = typeof vitest;

import type {
  MiroirTestForReport,
  TestAssertionResult,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type {
  MiroirActivityTrackerInterface,
  TestAssertionPath,
} from "../0_interfaces/3_controllers/MiroirActivityTrackerInterface";
import type {
  MiroirTestRunFilter,
  ReportTestRunnerResult,
  ReportTestSuiteContext,
} from "../0_interfaces/5-tests/miroirTestTypes";
import { ConfigurationService } from "../3_controllers/ConfigurationService";
import { MiroirActivityTracker } from "../3_controllers/MiroirActivityTracker";
import type { MiroirTestExecutionEnvironment } from "./MiroirTestTools";

export const REPORT_TEST_NO_RUNNER_MESSAGE = "reportTest requires a registered report test runner";

export const REPORT_TEST_NO_SUITE_MESSAGE = "reportTest must be a leaf of a reportTestSuite";

// ################################################################################################
/**
 * `reportTest` leaf (#330). miroir-core cannot render React, so the leaf is run by the runner
 * registered through `ConfigurationService.registerReportTestRunner`, against the integration
 * session of the run (`executionEnvironment`).
 *
 * - No runner registered: the leaf is recorded as skipped and nothing is thrown.
 * - A leaf outside a `reportTestSuite` (no suite context from the walk) is recorded as an `error`
 *   and does not reach the runner.
 * - Otherwise the runner is called with the leaf and the suite context built by the walk, and its
 *   `ok` / `error` is recorded; an `error` then fails the vitest test, as a `runnerTest` does.
 */
export async function runMiroirReportTest(
  localVitest: VitestNamespace,
  testNamePath: string[],
  filter: MiroirTestRunFilter | undefined,
  miroirTest: MiroirTestForReport,
  miroirActivityTracker: MiroirActivityTrackerInterface,
  executionEnvironment: MiroirTestExecutionEnvironment,
  testAssertionPath?: TestAssertionPath,
  parentSkip?: boolean,
  reportTestSuite?: ReportTestSuiteContext,
): Promise<void> {
  if (!localVitest.expect) {
    throw new Error("runMiroirReportTest called without vitest.expect");
  }
  const assertionName = miroirTest.miroirTestLabel;
  const currentTestAssertionPath =
    testAssertionPath || miroirActivityTracker.getCurrentTestAssertionPath();
  if (!currentTestAssertionPath) {
    throw new Error(
      "runMiroirReportTest called without testAssertionPath and no currentTestAssertionPath available",
    );
  }

  const excludedByFilter =
    Array.isArray(filter?.testList) && !(filter.testList as string[]).includes(assertionName);
  if (parentSkip || miroirTest.skip || excludedByFilter) {
    miroirActivityTracker.setTestAssertionResult(currentTestAssertionPath, {
      assertionName,
      assertionResult: "skipped",
    });
    return;
  }

  const runner = ConfigurationService.configurationService.reportTestRunner;
  if (!runner) {
    miroirActivityTracker.setTestAssertionResult(currentTestAssertionPath, {
      assertionName,
      assertionResult: "skipped",
      assertionActualValue: REPORT_TEST_NO_RUNNER_MESSAGE,
    });
    return;
  }

  let runnerResult: ReportTestRunnerResult;
  if (!reportTestSuite) {
    runnerResult = {
      status: "error",
      message: `${REPORT_TEST_NO_SUITE_MESSAGE} ("${assertionName}" is not)`,
    };
  } else {
    try {
      runnerResult = await runner({
        testNamePath,
        leaf: miroirTest,
        suite: reportTestSuite,
        executionEnvironment,
      });
    } catch (error) {
      runnerResult = {
        status: "error",
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }

  const testAssertionResult: TestAssertionResult =
    runnerResult.status === "ok"
      ? { assertionName, assertionResult: "ok" }
      : {
          assertionName,
          assertionResult: "error",
          assertionExpectedValue: runnerResult.expected,
          assertionActualValue:
            runnerResult.actual === undefined
              ? runnerResult.message
              : { message: runnerResult.message, actual: runnerResult.actual },
        };
  miroirActivityTracker.setTestAssertionResult(currentTestAssertionPath, testAssertionResult);

  localVitest
    .expect(
      runnerResult.status,
      runnerResult.status === "error"
        ? `reportTest "${MiroirActivityTracker.testPathName(testNamePath)}" failed: ${runnerResult.message}`
        : undefined,
    )
    .toBe("ok");
}
