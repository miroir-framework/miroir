import { DEFAULT_UI_INTEGRATION_PROFILE_NAME } from "./integrationTestProfileAssets.js";
import type { UiIntegrationTestRunTargetMode } from "./uiIntegrationTestLauncherTypes.js";
import type { UiIntegrationTestRunResult } from "./uiIntegrationTestLauncherTypes.js";

export type UiIntegrationTestRunPreferences = {
  profileName: string;
  runTargetMode: UiIntegrationTestRunTargetMode;
};

const DEFAULT_PREFERENCES: UiIntegrationTestRunPreferences = {
  profileName: DEFAULT_UI_INTEGRATION_PROFILE_NAME,
  runTargetMode: "ephemeral",
};

let preferences: UiIntegrationTestRunPreferences = { ...DEFAULT_PREFERENCES };
const listeners = new Set<() => void>();

function notifyPreferenceListeners(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function getUiIntegrationTestRunPreferences(): UiIntegrationTestRunPreferences {
  return { ...preferences };
}

export function setUiIntegrationTestRunPreferences(
  next: Partial<UiIntegrationTestRunPreferences>,
): void {
  preferences = {
    profileName: next.profileName ?? preferences.profileName,
    runTargetMode: next.runTargetMode ?? preferences.runTargetMode,
  };
  notifyPreferenceListeners();
}

export function subscribeUiIntegrationTestRunPreferences(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Sync picker state from a completed run (B6 — last run preferences). */
export function applyUiIntegrationTestRunResultToPreferences(
  result: UiIntegrationTestRunResult,
): void {
  setUiIntegrationTestRunPreferences({
    profileName: result.profileName,
    runTargetMode: result.runTargetMode,
  });
}

/** Test-only reset — not for production UI. */
export function resetUiIntegrationTestRunPreferencesForTests(): void {
  preferences = { ...DEFAULT_PREFERENCES };
  notifyPreferenceListeners();
}
