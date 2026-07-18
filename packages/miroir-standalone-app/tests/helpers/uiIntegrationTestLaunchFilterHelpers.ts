import type { UiIntegrationTestRunRequest } from '../../src/miroir-fwk/4-tests/uiIntegrationTestLauncherTypes.js';

export const RETURN_BOOK_LEAF = 'Return Book Test Composite Action';
export const RUNNER_LIBRARY_LABEL = 'runner.library';
export const TRANSFORMER_SUITE_KEY = 'miroirCoreTransformers';

export const TRANSFORMER_LEAF_FILTER = {
  testList: {
    miroirCoreTransformers: {
      runtimeTransformerTests: {
        plus: ['plus with empty args fails'],
      },
    },
  },
} as const;

export function hasIntegrationTestFilterSelection(
  filter: UiIntegrationTestRunRequest['filter'],
): boolean {
  if (!filter?.testList) {
    return false;
  }
  if (Array.isArray(filter.testList)) {
    return filter.testList.length > 0;
  }
  return Object.values(filter.testList).some((leaves) =>
    Array.isArray(leaves) ? leaves.length > 0 : leaves != null,
  );
}

export function defaultUiIntegrationFilterForSuite(
  suiteKey: string,
): UiIntegrationTestRunRequest['filter'] | undefined {
  if (suiteKey === 'runner_library') {
    return {
      testList: {
        [RUNNER_LIBRARY_LABEL]: [RETURN_BOOK_LEAF],
      },
    };
  }
  if (suiteKey === TRANSFORMER_SUITE_KEY) {
    return TRANSFORMER_LEAF_FILTER as UiIntegrationTestRunRequest['filter'];
  }
  return undefined;
}
