import { describe, expect as vitestExpect, it } from "vitest";

import {
  createThrowingExpect,
  expect as nonThrowingExpect,
  failedExpectationMessage,
} from "../../../../src/1_core/testing/test-expect";

// #554: handleTestCompositeActionAssertion records a failed assertion only when it sees one, whichever
// expect the configuration registered.
describe("failedExpectationMessage", () => {
  it("returns the message of a failed non-throwing expect", () => {
    const outcome = nonThrowingExpect({ aggregate: 5 }, "checkNumberOfBooks").toEqual({ aggregate: 999 });

    const message = failedExpectationMessage(outcome, "checkNumberOfBooks failed");

    vitestExpect(message).toContain('Expected {"aggregate":5} to equal {"aggregate":999}');
  });

  it("returns undefined for a passed non-throwing expect", () => {
    const outcome = nonThrowingExpect({ aggregate: 5 }).toEqual({ aggregate: 5 });

    vitestExpect(failedExpectationMessage(outcome, "failed")).toBeUndefined();
  });

  it("returns the default message for a failure without one", () => {
    vitestExpect(failedExpectationMessage({ result: false }, "checkNumberOfBooks failed")).toBe(
      "checkNumberOfBooks failed",
    );
  });

  it("returns undefined for a passed vitest assertion, a proxy that throws on unknown properties", () => {
    const outcome = vitestExpect({ aggregate: 5 }).toEqual({ aggregate: 5 });

    vitestExpect(failedExpectationMessage(outcome, "failed")).toBeUndefined();
  });

  it("returns undefined for a passed throwing expect", () => {
    const outcome = createThrowingExpect("t")({ aggregate: 5 }).toEqual({ aggregate: 5 });

    vitestExpect(failedExpectationMessage(outcome, "failed")).toBeUndefined();
  });
});
