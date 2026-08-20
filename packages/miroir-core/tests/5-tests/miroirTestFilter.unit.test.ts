import { describe, expect, it } from "vitest";

import { normalizeMiroirTestRunFilter } from "../../src/5_tests/parseMiroirTestCliConfig";
import {
  isMiroirTestLeafSelected,
  resolveSuiteInnerFilter,
} from "../../src/5_tests/miroirTestFilter";

const LEND_SUITE_LABEL = "runner.lendDocument";
const LEND_LEAVES = ["Lend Book Test Composite Action"] as const;
const RETURN_SUITE_LABEL = "runner.returnDocument";
const RETURN_LEAVES = ["Return Book Test Composite Action"] as const;

describe("miroirTestFilter (runner_lend_document / runner_return_document)", () => {
  it("normalizes suite-label shorthand", () => {
    expect(
      normalizeMiroirTestRunFilter({
        "runner.returnDocument": ["Return Book Test Composite Action"],
      }),
    ).toEqual({
      testList: { "runner.returnDocument": ["Return Book Test Composite Action"] },
    });
  });

  it("selects return leaf via suite label key", () => {
    const filter = normalizeMiroirTestRunFilter({
      "runner.returnDocument": ["Return Book Test Composite Action"],
    });
    const { testList } = resolveSuiteInnerFilter(filter, RETURN_SUITE_LABEL, RETURN_LEAVES);
    expect(isMiroirTestLeafSelected(RETURN_LEAVES[0], testList)).toBe(true);
  });

  it("selects lend leaf via suite label key", () => {
    const filter = normalizeMiroirTestRunFilter({
      "runner.lendDocument": ["Lend Book Test Composite Action"],
    });
    const { testList } = resolveSuiteInnerFilter(filter, LEND_SUITE_LABEL, LEND_LEAVES);
    expect(isMiroirTestLeafSelected(LEND_LEAVES[0], testList)).toBe(true);
  });

  it("selects return leaf when filter keys are leaf labels (values ignored)", () => {
    const filter = normalizeMiroirTestRunFilter({
      "Return Book Test Composite Action": "*",
    });
    const { testList, filterProvidedButEmpty } = resolveSuiteInnerFilter(
      filter,
      RETURN_SUITE_LABEL,
      RETURN_LEAVES,
    );
    expect(filterProvidedButEmpty).toBe(false);
    expect(isMiroirTestLeafSelected(RETURN_LEAVES[0], testList)).toBe(true);
  });

  it("warns when registry key used instead of suite label", () => {
    const filter = normalizeMiroirTestRunFilter({
      runner_return_document: ["Return Book Test Composite Action"],
    });
    const { testList, filterProvidedButEmpty } = resolveSuiteInnerFilter(
      filter,
      RETURN_SUITE_LABEL,
      RETURN_LEAVES,
    );
    expect(filterProvidedButEmpty).toBe(true);
    expect(testList).toEqual([]);
  });

  it("runs all leaves when filter omitted", () => {
    const { testList: returnTestList } = resolveSuiteInnerFilter(
      undefined,
      RETURN_SUITE_LABEL,
      RETURN_LEAVES,
    );
    expect(isMiroirTestLeafSelected(RETURN_LEAVES[0], returnTestList)).toBe(true);
    const { testList: lendTestList } = resolveSuiteInnerFilter(
      undefined,
      LEND_SUITE_LABEL,
      LEND_LEAVES,
    );
    expect(isMiroirTestLeafSelected(LEND_LEAVES[0], lendTestList)).toBe(true);
  });
});
