import { describe, expect, it } from "vitest";

import { MiroirActivityTracker } from "../../../../src/3_controllers/MiroirActivityTracker";
import { failedLeafAssertion } from "../../../../src/5_tests/leafAssertions";

// #554: a leaf's assertions are read from its own suites, never from a leaf with the same labels elsewhere.
const leaf = {
  miroirTestType: "actionTest",
  miroirTestLabel: "lends",
  testCompositeActionAssertions: [
    {
      actionType: "compositeRunTestAssertion",
      endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
      actionLabel: "countLendings",
      payload: { testType: "testAssertion", testLabel: "countLendings", definition: { expectedValue: 1 } },
    },
  ],
} as any;

/** Records the leaf's assertion under `suite`, as the DomainController does inside it. */
function record(tracker: MiroirActivityTracker, suite: string, assertionResult: "ok" | "error") {
  tracker.setTestAssertionResult([{ testSuite: suite }, { test: "lends" }, { testAssertion: "countLendings" }], {
    assertionName: "countLendings",
    assertionResult,
    ...(assertionResult == "error" ? { assertionExpectedValue: 1, assertionActualValue: 2 } : {}),
  });
}

describe("failedLeafAssertion (#554)", () => {
  it("reads a leaf's assertion in its own suite, not in an earlier suite's leaf of the same labels", () => {
    const tracker = new MiroirActivityTracker();
    record(tracker, "suite A", "ok");
    record(tracker, "suite B", "error");
    const failure = failedLeafAssertion(leaf, tracker, "assertion", "lends", [{ testSuite: "suite B" }, { test: "lends" }]);
    expect(failure?.message).toBe('actionTest "lends" assertion failed: countLendings expected 1 actual 2');
    expect(failedLeafAssertion(leaf, tracker, "assertion", "lends", [{ testSuite: "suite A" }])).toBeUndefined();
  });

  it("reports an assertion that did not run when its suite recorded nothing", () => {
    const tracker = new MiroirActivityTracker();
    record(tracker, "suite A", "ok");
    const failure = failedLeafAssertion(leaf, tracker, "assertion", "lends", [{ testSuite: "suite B" }]);
    expect(failure?.message).toBe('actionTest "lends" assertion "countLendings" did not run');
  });

  it("reads the whole tracker when the leaf started outside any suite", () => {
    const tracker = new MiroirActivityTracker();
    record(tracker, "suite A", "error");
    expect(failedLeafAssertion(leaf, tracker, "assertion", "lends")?.tracked?.assertionResult).toBe("error");
  });
});
