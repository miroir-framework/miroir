import type {
  MiroirTestForReactComponent,
  TestAssertionResult,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type {
  MiroirActivityTrackerInterface,
  TestAssertionPath,
} from "../0_interfaces/3_controllers/MiroirActivityTrackerInterface";
import type {
  MiroirTestRunFilter,
  ReactComponentTestRunnerResult,
  ReactComponentTestSuiteContext,
} from "../0_interfaces/5-tests/miroirTestTypes";
import { ConfigurationService } from "../3_controllers/ConfigurationService";
import { MiroirActivityTracker } from "../3_controllers/MiroirActivityTracker";

export const REACT_COMPONENT_TEST_NO_RUNNER_MESSAGE =
  "reactComponentTest requires a registered component test runner";

export const REACT_COMPONENT_TEST_NO_SUITE_MESSAGE =
  "reactComponentTest must be a leaf of a reactComponentTestSuite";

// ################################################################################################
/**
 * `reactComponentTest` leaf (#286). miroir-core cannot render React, so the leaf is run by the
 * runner registered through `ConfigurationService.registerReactComponentTestRunner`.
 *
 * - No runner registered: the leaf is recorded as skipped and nothing is thrown (miroir-core
 *   generic entry, where vitest then reports the leaf as passed).
 * - A leaf outside a `reactComponentTestSuite` (no suite context from the walk) is recorded as an
 *   `error` and does not reach the runner (#292 M1). The schema rejects this placement (#294); the
 *   check stays for instances that were not validated.
 * - Otherwise the runner is called with the leaf and the suite context built by the walk (#292),
 *   and its `ok` / `error` is recorded.
 *
 * An `error` is rethrown only when `rethrowComponentTestFailures` is set, so that one failing case
 * does not end a UI run.
 */
export async function runMiroirReactComponentTest(
  testNamePath: string[],
  filter: MiroirTestRunFilter | undefined,
  miroirTest: MiroirTestForReactComponent,
  miroirActivityTracker: MiroirActivityTrackerInterface,
  rethrowComponentTestFailures: boolean,
  testAssertionPath?: TestAssertionPath,
  parentSkip?: boolean,
  reactComponentTestSuite?: ReactComponentTestSuiteContext,
): Promise<void> {
  const assertionName = miroirTest.miroirTestLabel;
  const currentTestAssertionPath =
    testAssertionPath || miroirActivityTracker.getCurrentTestAssertionPath();
  if (!currentTestAssertionPath) {
    throw new Error(
      "runMiroirReactComponentTest called without testAssertionPath and no currentTestAssertionPath available",
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

  const runner = ConfigurationService.configurationService.reactComponentTestRunner;
  if (!runner) {
    miroirActivityTracker.setTestAssertionResult(currentTestAssertionPath, {
      assertionName,
      assertionResult: "skipped",
      assertionActualValue: REACT_COMPONENT_TEST_NO_RUNNER_MESSAGE,
    });
    return;
  }

  let runnerResult: ReactComponentTestRunnerResult;
  if (!reactComponentTestSuite) {
    runnerResult = {
      status: "error",
      message: `${REACT_COMPONENT_TEST_NO_SUITE_MESSAGE} ("${assertionName}" is not)`,
    };
  } else {
    try {
      runnerResult = await runner({ testNamePath, leaf: miroirTest, suite: reactComponentTestSuite });
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

  if (runnerResult.status === "error" && rethrowComponentTestFailures) {
    throw new Error(
      `reactComponentTest "${MiroirActivityTracker.testPathName(testNamePath)}" failed: ${runnerResult.message}`,
    );
  }
}
