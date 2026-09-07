import type { MiroirTestRunFilter, TestSuiteListFilter } from "../0_interfaces/5-tests/miroirTestTypes";

export type SuiteInnerFilterResult = {
  testList: TestSuiteListFilter | undefined;
  filterProvidedButEmpty: boolean;
};

export type ResolveSuiteInnerFilterOptions = {
  /** Instance `name` at the catalog root (for identity-mismatch errors). */
  suiteName?: string;
  /**
   * When true (catalog root), an unmatched object filter throws.
   * Nested walks keep skipping unselected sibling branches.
   */
  throwOnUnmatched?: boolean;
};

function availableLeavesText(availableLeafLabels: readonly string[]): string {
  return availableLeafLabels.join(", ");
}

function throwIfUnknownLeafLabels(
  inner: TestSuiteListFilter | undefined,
  availableLeafLabels: readonly string[],
): void {
  if (!Array.isArray(inner)) {
    return;
  }
  const unknown = inner.filter((leaf) => !availableLeafLabels.includes(leaf));
  if (unknown.length === 0) {
    return;
  }
  throw new Error(
    `Unknown MiroirTest leaf label${unknown.length === 1 ? "" : "s"} ${unknown
      .map((leaf) => `"${leaf}"`)
      .join(", ")}. Available leaves: ${availableLeavesText(availableLeafLabels)}`,
  );
}

function unmatchedFilterKeyError(
  filterKeys: string[],
  suiteLabel: string,
  suiteName: string | undefined,
  availableLeafLabels: readonly string[],
): Error {
  const namePart =
    suiteName && suiteName !== suiteLabel ? ` (instance name "${suiteName}")` : "";
  const usedNameAsKey =
    suiteName &&
    suiteName !== suiteLabel &&
    filterKeys.includes(suiteName) &&
    !filterKeys.includes(suiteLabel);
  if (usedNameAsKey) {
    return new Error(
      `Unknown filter key "${suiteName}". Use miroirTestLabel "${suiteLabel}"${namePart}. Available leaves: ${availableLeavesText(availableLeafLabels)}`,
    );
  }
  return new Error(
    `MiroirTest filter matched no tests in suite "${suiteLabel}"${namePart}. ` +
      `Filter keys must be the suite miroirTestLabel (e.g. "${suiteLabel}"` +
      (suiteName && suiteName !== suiteLabel ? ` for --suites ${suiteName}` : "") +
      `), not the suite key or a bare leaf label at the wrong level. ` +
      `Available leaves: ${availableLeavesText(availableLeafLabels)}`,
  );
}

/**
 * Resolve the leaf label list for one suite from a CLI / env filter.
 *
 * Accepts:
 * - `{ testList: { "<suite miroirTestLabel>": ["<leaf>", …] } }`
 * - `{ testList: ["<leaf>", …] }` when running a single flat suite
 * - `{ testList: { "<leaf miroirTestLabel>": … } }` when every key is a leaf in this suite
 *
 * Unknown leaf labels always throw. Unmatched object keys throw at the catalog root
 * (`throwOnUnmatched`) or when a key equals instance `name`. Nested sibling branches skip.
 */
export function resolveSuiteInnerFilter(
  filter: MiroirTestRunFilter | undefined,
  suiteLabel: string,
  availableLeafLabels: readonly string[],
  options: ResolveSuiteInnerFilterOptions = {},
): SuiteInnerFilterResult {
  const { suiteName, throwOnUnmatched = true } = options;

  if (!filter?.testList) {
    return { testList: undefined, filterProvidedButEmpty: false };
  }

  if (Array.isArray(filter.testList)) {
    throwIfUnknownLeafLabels(filter.testList, availableLeafLabels);
    return { testList: filter.testList, filterProvidedButEmpty: false };
  }

  if (
    suiteName &&
    typeof filter.testList === "object" &&
    Object.hasOwn(filter.testList, suiteName)
  ) {
    const inner = filter.testList[suiteName];
    throwIfUnknownLeafLabels(inner, availableLeafLabels);
    return { testList: inner, filterProvidedButEmpty: false };
  }

  if (typeof filter.testList === "object" && Object.hasOwn(filter.testList, suiteLabel)) {
    if (throwOnUnmatched && suiteName && suiteName !== suiteLabel) {
      throw new Error(
        `Unknown filter key "${suiteLabel}". Did you mean "${suiteName}"? ("${suiteLabel}" is miroirTestLabel). Available leaves: ${availableLeavesText(availableLeafLabels)}`,
      );
    }
    const inner = filter.testList[suiteLabel];
    throwIfUnknownLeafLabels(inner, availableLeafLabels);
    return { testList: inner, filterProvidedButEmpty: false };
  }

  const filterKeys = Object.keys(filter.testList);
  if (
    filterKeys.length > 0 &&
    filterKeys.every((key) => availableLeafLabels.includes(key))
  ) {
    return { testList: filterKeys, filterProvidedButEmpty: false };
  }

  const usedNameAsKey =
    !!suiteName &&
    suiteName !== suiteLabel &&
    filterKeys.includes(suiteName) &&
    !filterKeys.includes(suiteLabel);

  if (filterKeys.length > 0 && (throwOnUnmatched || usedNameAsKey)) {
    throw unmatchedFilterKeyError(filterKeys, suiteLabel, suiteName, availableLeafLabels);
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
