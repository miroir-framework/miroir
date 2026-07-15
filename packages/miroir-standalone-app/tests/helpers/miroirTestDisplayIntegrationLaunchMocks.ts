import { vi } from 'vitest';

import type { UiIntegrationTestRunRequest } from '../../src/miroir-fwk/4-tests/uiIntegrationTestLauncherTypes.js';

export const RETURN_BOOK_LEAF = 'Return Book Test Composite Action';
export const RUNNER_LIBRARY_LABEL = 'runner.library';

export function hasIntegrationTestFilterSelection(
  filter: UiIntegrationTestRunRequest['filter'],
): boolean {
  if (!filter?.testList) {
    return false;
  }
  if (Array.isArray(filter.testList)) {
    return filter.testList.length > 0;
  }
  return Object.values(filter.testList).some((leaves) => leaves.length > 0);
}

vi.mock('../../src/miroir-fwk/4_view/components/Reports/TestExecutionPanel.js', () => ({
  TestExecutionPanel: () => null,
}));

vi.mock(
  '../../src/miroir-fwk/4-tests/loadBrowserUiIntegrationTestLauncherEnvironment.js',
  async () => {
    const { createNodeUiIntegrationTestLauncherEnvironment } = await import(
      './runUiIntegrationTestSuiteInNode.js'
    );
    const { expect } = await import('vitest');

    const NODE_INTEGRATION_PROFILE = 'emulatedServer-sql';

    return {
      loadBrowserUiIntegrationTestLauncherEnvironment: async () => {
        const nodeEnv = createNodeUiIntegrationTestLauncherEnvironment(expect);
        return {
          ...nodeEnv,
          loadConfigForProfile: async () => nodeEnv.loadConfigForProfile(NODE_INTEGRATION_PROFILE),
        };
      },
    };
  },
);

vi.mock('../../src/miroir-fwk/4-tests/uiIntegrationTestLauncher.js', async (importOriginal) => {
  const actual = await importOriginal<
    typeof import('../../src/miroir-fwk/4-tests/uiIntegrationTestLauncher.js')
  >();
  return {
    ...actual,
    runUiIntegrationTestSuite: (
      request: UiIntegrationTestRunRequest,
      env: Parameters<typeof actual.runUiIntegrationTestSuite>[1],
    ) =>
      actual.runUiIntegrationTestSuite(
        {
          ...request,
          runTargetMode: 'pinned',
          filter: hasIntegrationTestFilterSelection(request.filter)
            ? request.filter
            : { testList: { [RUNNER_LIBRARY_LABEL]: [RETURN_BOOK_LEAF] } },
        },
        env,
      ),
  };
});
