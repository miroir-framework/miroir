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

  it("selects return leaf via instance name key", () => {
    const filter = normalizeMiroirTestRunFilter({
      runner_return_document: ["Return Book Test Composite Action"],
    });
    const { testList } = resolveSuiteInnerFilter(filter, RETURN_SUITE_LABEL, RETURN_LEAVES, {
      suiteName: "runner_return_document",
    });
    expect(isMiroirTestLeafSelected(RETURN_LEAVES[0], testList)).toBe(true);
  });

  it("selects lend leaf via instance name key", () => {
    const filter = normalizeMiroirTestRunFilter({
      runner_lend_document: ["Lend Book Test Composite Action"],
    });
    const { testList } = resolveSuiteInnerFilter(filter, LEND_SUITE_LABEL, LEND_LEAVES, {
      suiteName: "runner_lend_document",
    });
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

  it("throws when suite label is used instead of instance name at the catalog root", () => {
    const filter = normalizeMiroirTestRunFilter({
      "runner.returnDocument": ["Return Book Test Composite Action"],
    });
    expect(() =>
      resolveSuiteInnerFilter(filter, RETURN_SUITE_LABEL, RETURN_LEAVES, {
        suiteName: "runner_return_document",
      }),
    ).toThrow(/Did you mean "runner_return_document"/);
  });

  it("throws when a leaf label is unknown", () => {
    const filter = normalizeMiroirTestRunFilter({
      runner_return_document: ["this leaf does not exist"],
    });
    expect(() =>
      resolveSuiteInnerFilter(filter, RETURN_SUITE_LABEL, RETURN_LEAVES, {
        suiteName: "runner_return_document",
      }),
    ).toThrow(/Unknown MiroirTest leaf label "this leaf does not exist"/);
  });

  it("skips unmatched sibling branches when throwOnUnmatched is false", () => {
    const filter = normalizeMiroirTestRunFilter({
      "runner.returnDocument": ["Return Book Test Composite Action"],
    });
    const { testList, filterProvidedButEmpty } = resolveSuiteInnerFilter(
      filter,
      LEND_SUITE_LABEL,
      LEND_LEAVES,
      { suiteName: "runner_lend_document", throwOnUnmatched: false },
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
