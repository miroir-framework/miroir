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

describe("miroirTestFilter (runner.lendDocument / runner.returnDocument)", () => {
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
      "runner.returnDocument": ["Return Book Test Composite Action"],
    });
    const { testList } = resolveSuiteInnerFilter(filter, RETURN_SUITE_LABEL, RETURN_LEAVES, {
      suiteName: "runner.returnDocument",
    });
    expect(isMiroirTestLeafSelected(RETURN_LEAVES[0], testList)).toBe(true);
  });

  it("selects lend leaf via instance name key", () => {
    const filter = normalizeMiroirTestRunFilter({
      "runner.lendDocument": ["Lend Book Test Composite Action"],
    });
    const { testList } = resolveSuiteInnerFilter(filter, LEND_SUITE_LABEL, LEND_LEAVES, {
      suiteName: "runner.lendDocument",
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
    // #316: real instances now have label === name, so the label here is synthetic.
    const filter = normalizeMiroirTestRunFilter({
      "legacy.returnDocumentLabel": ["Return Book Test Composite Action"],
    });
    expect(() =>
      resolveSuiteInnerFilter(filter, "legacy.returnDocumentLabel", RETURN_LEAVES, {
        suiteName: "runner.returnDocument",
      }),
    ).toThrow(/Did you mean "runner.returnDocument"/);
  });

  it("throws when a leaf label is unknown", () => {
    const filter = normalizeMiroirTestRunFilter({
      "runner.returnDocument": ["this leaf does not exist"],
    });
    expect(() =>
      resolveSuiteInnerFilter(filter, RETURN_SUITE_LABEL, RETURN_LEAVES, {
        suiteName: "runner.returnDocument",
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
      { suiteName: "runner.lendDocument", throwOnUnmatched: false },
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
