import { vi } from 'vitest';

import type { UiIntegrationTestRunRequest } from '../../src/miroir-fwk/4-tests/uiIntegrationTestLauncherTypes.js';
import {
  defaultUiIntegrationFilterForSuite,
  hasIntegrationTestFilterSelection,
} from './uiIntegrationTestLaunchFilterHelpers.js';

vi.mock('../../src/miroir-fwk/4_view/components/Reports/TestResultsGrid.js', () => ({
  TestResultsGrid: () => null,
}));

vi.mock('../../src/miroir-fwk/4_view/components/Reports/UnitTestExecutionSummary.js', () => ({
  UnitTestExecutionSummary: () => null,
}));

vi.mock(
  '../../src/miroir-fwk/4-tests/loadBrowserUiIntegrationTestLauncherEnvironment.js',
  async () => {
    const { createNodeUiIntegrationTestLauncherEnvironment } = await import(
      './runUiIntegrationTestSuiteInNode.js'
    );
    const { expect } = await import('vitest');

    // Node list-integ proof uses SQL stores; UI prefs stay on indexedDb so the
    // Run All Integration Tests button remains browser-launchable (same as B6-d1).
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
  const { capturedUiIntegrationRunResults } = await import(
    './miroirTestListIntegrationLaunchCapture.js'
  );
  return {
    ...actual,
    runUiIntegrationTestSuite: async (
      request: UiIntegrationTestRunRequest,
      env: Parameters<typeof actual.runUiIntegrationTestSuite>[1],
    ) => {
      const result = await actual.runUiIntegrationTestSuite(
        {
          ...request,
          runTargetMode: 'pinned',
          filter: hasIntegrationTestFilterSelection(request.filter)
            ? request.filter
            : defaultUiIntegrationFilterForSuite(request.suiteKey),
        },
        env,
      );
      capturedUiIntegrationRunResults.push(result);
      return result;
    },
  };
});
