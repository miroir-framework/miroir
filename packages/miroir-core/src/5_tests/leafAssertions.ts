import type {
  CompositeRunTestAssertion,
  TestAssertionResult,
  TestResult,
  TestSuiteResult,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type { MiroirActivityTrackerInterface } from "../0_interfaces/3_controllers/MiroirActivityTrackerInterface";

/** A MiroirTest leaf whose composite action ends with `compositeRunTestAssertion` steps. */
export type LeafWithAssertions = {
  miroirTestType: string;
  miroirTestLabel: string;
  testCompositeActionAssertions?: CompositeRunTestAssertion[] | undefined;
};

function findTrackedAssertionByName(
  suiteResult: TestSuiteResult,
  assertionName: string,
): TestAssertionResult | undefined {
  for (const test of Object.values(suiteResult.testsResults ?? {})) {
    const found = test.testAssertionsResults?.[assertionName];
    if (found) {
      return found;
    }
  }
  for (const nested of Object.values(suiteResult.testsSuiteResults ?? {})) {
    const found = findTrackedAssertionByName(nested, assertionName);
    if (found) {
      return found;
    }
  }
  return undefined;
}

function findTrackedTest(suiteResult: TestSuiteResult, testLabel: string): TestResult | undefined {
  const own = suiteResult.testsResults?.[testLabel];
  if (own) {
    return own;
  }
  for (const nested of Object.values(suiteResult.testsSuiteResults ?? {})) {
    const found = findTrackedTest(nested, testLabel);
    if (found) {
      return found;
    }
  }
  return undefined;
}

/**
 * The first assertion of the leaf that failed or did not run, as the activity tracker recorded it,
 * with the message to report. A composite action records a failed assertion in the activity tracker
 * and still returns ok, so the status alone does not tell (#554). Assertions are looked up in the
 * test labelled `testLabel` first.
 */
export function failedLeafAssertion(
  leaf: LeafWithAssertions,
  miroirActivityTracker: MiroirActivityTrackerInterface,
  failureLabel: string,
  testLabel?: string,
): { message: string; tracked?: TestAssertionResult } | undefined {
  const trackedRoot = miroirActivityTracker.getTestAssertionsResults([]);
  const trackedTest = testLabel ? findTrackedTest(trackedRoot, testLabel) : undefined;
  for (const assertion of leaf.testCompositeActionAssertions ?? []) {
    // the list may also hold the queries the assertions read
    if (assertion.actionType !== "compositeRunTestAssertion") {
      continue;
    }
    // the tracker records an assertion under its testLabel
    const assertionName = assertion.payload.testLabel;
    const tracked =
      trackedTest?.testAssertionsResults?.[assertionName] ??
      findTrackedAssertionByName(trackedRoot, assertionName);
    if (tracked === undefined) {
      return {
        message: `${leaf.miroirTestType} "${leaf.miroirTestLabel}" ${failureLabel} "${assertionName}" did not run`,
      };
    }
    if (tracked.assertionResult === "error") {
      return {
        message: `${leaf.miroirTestType} "${leaf.miroirTestLabel}" ${failureLabel} failed: ${tracked.assertionName} expected ${JSON.stringify(tracked.assertionExpectedValue)} actual ${JSON.stringify(tracked.assertionActualValue)}`,
        tracked,
      };
    }
  }
  return undefined;
}

/** Throws when an assertion of the leaf failed or did not run (see `failedLeafAssertion`). */
export function expectLeafAssertionsPassed(
  leaf: LeafWithAssertions,
  miroirActivityTracker: MiroirActivityTrackerInterface,
  failureLabel: string,
  testLabel?: string,
): void {
  const failure = failedLeafAssertion(leaf, miroirActivityTracker, failureLabel, testLabel);
  if (failure) {
    throw new Error(failure.message);
  }
}
