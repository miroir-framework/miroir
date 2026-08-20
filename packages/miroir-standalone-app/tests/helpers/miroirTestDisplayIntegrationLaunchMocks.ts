import { vi } from 'vitest';

import type { UiIntegrationTestRunRequest } from '../../src/miroir-fwk/4-tests/uiIntegrationTestLauncherTypes.js';
import {
  defaultUiIntegrationFilterForSuite,
  hasIntegrationTestFilterSelection,
  RETURN_BOOK_LEAF,
  RUNNER_RETURN_DOCUMENT_LABEL,
} from './uiIntegrationTestLaunchFilterHelpers.js';

export { RETURN_BOOK_LEAF, RUNNER_RETURN_DOCUMENT_LABEL };

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
            : defaultUiIntegrationFilterForSuite(request.suiteKey) ?? {
                testList: { [RUNNER_RETURN_DOCUMENT_LABEL]: [RETURN_BOOK_LEAF] },
              },
        },
        env,
      ),
  };
});
