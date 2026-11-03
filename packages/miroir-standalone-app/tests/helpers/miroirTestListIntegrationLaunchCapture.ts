import type { UiIntegrationTestRunResult } from 'miroir-react-testing/src/4-tests/uiIntegrationTestLauncherTypes.js';

export const capturedUiIntegrationRunResults: UiIntegrationTestRunResult[] = [];

export function resetCapturedUiIntegrationRunResults(): void {
  capturedUiIntegrationRunResults.length = 0;
}
