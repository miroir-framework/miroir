import type { UiIntegrationTestRunResult } from "./uiIntegrationTestLauncherTypes.js";

let lastUiIntegrationTestRunResult: UiIntegrationTestRunResult | undefined;
const listeners = new Set<() => void>();

export function getLastUiIntegrationTestRunResult(): UiIntegrationTestRunResult | undefined {
  return lastUiIntegrationTestRunResult;
}

export function setLastUiIntegrationTestRunResult(result: UiIntegrationTestRunResult): void {
  lastUiIntegrationTestRunResult = result;
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeLastUiIntegrationTestRunResult(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Test-only reset — not for production UI. */
export function resetLastUiIntegrationTestRunResultForTests(): void {
  lastUiIntegrationTestRunResult = undefined;
}
