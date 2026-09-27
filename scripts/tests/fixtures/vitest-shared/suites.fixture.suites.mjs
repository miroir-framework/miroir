import { describe, expect, test } from "vitest";

// Suite "failing" has a failing test; every other requested suite passes.
for (const suite of (process.env.FIXTURE_SUITES ?? "").split(",").filter(Boolean)) {
  describe(suite, () => {
    test("first", () => {
      expect(suite).toBeTruthy();
    });
    test("second", () => {
      expect(suite === "failing" ? 1 : 2).toBe(2);
    });
  });
}
