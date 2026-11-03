import { vi } from 'vitest';

import type { UiIntegrationTestRunRequest } from 'miroir-react-testing/src/4-tests/uiIntegrationTestLauncherTypes.js';

vi.mock('miroir-react-testing/src/4-tests/useSelectedApplicationMiroirTestSuiteRegistries.js', async () => {
  const { loadApplicationRunnerUuidIndexFromFolders } = await import(
    '@miroir-framework/core/model-validation-fs'
  );
  const index = loadApplicationRunnerUuidIndexFromFolders();
  return {
    useSelectedApplicationRunnerUuidIndex: () => index,
    useSelectedApplicationMiroirTests: () => [],
    useSelectedApplicationMiroirTestSuiteRegistries: (fallback: unknown[] = []) => ({
      runner: {},
      transformer: {},
      instances: fallback,
    }),
  };
});
import {
  defaultUiIntegrationFilterForSuite,
  hasIntegrationTestFilterSelection,
  RETURN_BOOK_LEAF,
  RUNNER_RETURN_DOCUMENT_LABEL,
  RUNNER_RETURN_DOCUMENT_SUITE_KEY,
} from './uiIntegrationTestLaunchFilterHelpers.js';

export { RETURN_BOOK_LEAF, RUNNER_RETURN_DOCUMENT_LABEL, RUNNER_RETURN_DOCUMENT_SUITE_KEY };

vi.mock('miroir-react-testing/src/4_view/components/Reports/TestExecutionPanel.js', () => ({
  TestExecutionPanel: () => null,
}));

vi.mock(
  'miroir-react-testing/src/4-tests/loadBrowserUiIntegrationTestLauncherEnvironment.js',
  async () => {
    const { createNodeUiIntegrationTestLauncherEnvironment } = await import(
      './runUiIntegrationTestSuiteInNode.js'
    );
    const { expect } = await import('vitest');
    const { resolveLaunchProfileName } = await import('./launchProfileName.js');

    const NODE_INTEGRATION_PROFILE = resolveLaunchProfileName();

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

vi.mock('miroir-react-testing/src/4-tests/uiIntegrationTestLauncher.js', async (importOriginal) => {
  const actual = await importOriginal<
    typeof import('miroir-react-testing/src/4-tests/uiIntegrationTestLauncher.js')
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
                testList: { [RUNNER_RETURN_DOCUMENT_SUITE_KEY]: [RETURN_BOOK_LEAF] },
              },
        },
        env,
      ),
  };
});
