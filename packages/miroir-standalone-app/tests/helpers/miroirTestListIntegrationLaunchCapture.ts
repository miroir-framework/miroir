import type { UiIntegrationTestRunResult } from '../../src/miroir-fwk/4-tests/uiIntegrationTestLauncherTypes.js';

export const capturedUiIntegrationRunResults: UiIntegrationTestRunResult[] = [];

export function resetCapturedUiIntegrationRunResults(): void {
  capturedUiIntegrationRunResults.length = 0;
}
