import { describe, expect, it } from "vitest";

import { normalizeMiroirTestRunFilter } from "../../src/5_tests/parseMiroirTestCliConfig";
import {
  isMiroirTestLeafSelected,
  resolveSuiteInnerFilter,
} from "../../src/5_tests/miroirTestFilter";

const RUNNER_SUITE_LABEL = "runner.library";
const LEAVES = [
  "Lend Book Test Composite Action",
  "Return Book Test Composite Action",
] as const;

describe("miroirTestFilter (runner_library)", () => {
  it("normalizes suite-label shorthand", () => {
    expect(
      normalizeMiroirTestRunFilter({
        "runner.library": ["Return Book Test Composite Action"],
      }),
    ).toEqual({
      testList: { "runner.library": ["Return Book Test Composite Action"] },
    });
  });

  it("selects return leaf via suite label key", () => {
    const filter = normalizeMiroirTestRunFilter({
      "runner.library": ["Return Book Test Composite Action"],
    });
    const { testList } = resolveSuiteInnerFilter(filter, RUNNER_SUITE_LABEL, LEAVES);
    expect(isMiroirTestLeafSelected(LEAVES[0], testList)).toBe(false);
    expect(isMiroirTestLeafSelected(LEAVES[1], testList)).toBe(true);
  });

  it("selects return leaf when filter keys are leaf labels (values ignored)", () => {
    const filter = normalizeMiroirTestRunFilter({
      "Return Book Test Composite Action": "*",
    });
    const { testList, filterProvidedButEmpty } = resolveSuiteInnerFilter(
      filter,
      RUNNER_SUITE_LABEL,
      LEAVES,
    );
    expect(filterProvidedButEmpty).toBe(false);
    expect(isMiroirTestLeafSelected(LEAVES[0], testList)).toBe(false);
    expect(isMiroirTestLeafSelected(LEAVES[1], testList)).toBe(true);
  });

  it("warns when registry key used instead of suite label", () => {
    const filter = normalizeMiroirTestRunFilter({
      runner_library: ["Return Book Test Composite Action"],
    });
    const { testList, filterProvidedButEmpty } = resolveSuiteInnerFilter(
      filter,
      RUNNER_SUITE_LABEL,
      LEAVES,
    );
    expect(filterProvidedButEmpty).toBe(true);
    expect(testList).toEqual([]);
  });

  it("runs all leaves when filter omitted", () => {
    const { testList } = resolveSuiteInnerFilter(undefined, RUNNER_SUITE_LABEL, LEAVES);
    expect(isMiroirTestLeafSelected(LEAVES[0], testList)).toBe(true);
    expect(isMiroirTestLeafSelected(LEAVES[1], testList)).toBe(true);
  });
});
