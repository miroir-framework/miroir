import { describe, expect, it } from "vitest";

import {
  applyUiIntegrationTestRunResultToPreferences,
  getUiIntegrationTestRunPreferences,
  resetUiIntegrationTestRunPreferencesForTests,
  setUiIntegrationTestRunPreferences,
} from "../../src/miroir-fwk/4-tests/uiIntegrationTestRunPreferences.js";
import type { UiIntegrationTestRunResult } from "../../src/miroir-fwk/4-tests/uiIntegrationTestLauncherTypes.js";

describe("uiIntegrationTestRunPreferences (B6)", () => {
  it("updates profile and run target mode", () => {
    resetUiIntegrationTestRunPreferencesForTests();

    setUiIntegrationTestRunPreferences({
      profileName: "emulatedServer-sql",
      runTargetMode: "pinned",
    });

    expect(getUiIntegrationTestRunPreferences()).toEqual({
      profileName: "emulatedServer-sql",
      runTargetMode: "pinned",
    });
  });

  it("syncs preferences from a completed run result", () => {
    resetUiIntegrationTestRunPreferencesForTests();

    const result = {
      profileName: "emulatedServer-sql",
      runTargetMode: "pinned",
    } as UiIntegrationTestRunResult;

    applyUiIntegrationTestRunResultToPreferences(result);

    expect(getUiIntegrationTestRunPreferences().runTargetMode).toBe("pinned");
  });
});
