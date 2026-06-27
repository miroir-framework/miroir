import type { MiroirTestRunFilter, TestSuiteListFilter } from "../0_interfaces/5-tests/miroirTestTypes";

export type SuiteInnerFilterResult = {
  testList: TestSuiteListFilter | undefined;
  filterProvidedButEmpty: boolean;
};

/**
 * Resolve the leaf label list for one suite from a CLI / env filter.
 *
 * Accepts:
 * - `{ testList: { "<suite miroirTestLabel>": ["<leaf>", …] } }`
 * - `{ testList: ["<leaf>", …] }` when running a single flat suite
 * - `{ testList: { "<leaf miroirTestLabel>": … } }` when every key is a leaf in this suite
 */
export function resolveSuiteInnerFilter(
  filter: MiroirTestRunFilter | undefined,
  suiteLabel: string,
  availableLeafLabels: readonly string[],
): SuiteInnerFilterResult {
  if (!filter?.testList) {
    return { testList: undefined, filterProvidedButEmpty: false };
  }

  if (Array.isArray(filter.testList)) {
    return { testList: filter.testList, filterProvidedButEmpty: false };
  }

  if (typeof filter.testList === "object" && Object.hasOwn(filter.testList, suiteLabel)) {
    return { testList: filter.testList[suiteLabel], filterProvidedButEmpty: false };
  }

  const filterKeys = Object.keys(filter.testList);
  if (
    filterKeys.length > 0 &&
    filterKeys.every((key) => availableLeafLabels.includes(key))
  ) {
    return { testList: filterKeys, filterProvidedButEmpty: false };
  }

  return {
    testList: [],
    filterProvidedButEmpty: filterKeys.length > 0,
  };
}

export function isMiroirTestLeafSelected(
  leafLabel: string,
  innerTestList: TestSuiteListFilter | undefined,
): boolean {
  if (!innerTestList) {
    return true;
  }
  if (Array.isArray(innerTestList)) {
    return innerTestList.includes(leafLabel);
  }
  if (typeof innerTestList === "object") {
    return Object.hasOwn(innerTestList, leafLabel);
  }
  return false;
}
