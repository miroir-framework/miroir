import { describe, expect, it } from "vitest";

import {
  DEFAULT_UI_INTEGRATION_PROFILE_NAME,
  listBrowserIntegrationTestProfileNames,
  loadBrowserIntegrationTestProfileConfig,
} from "../../src/miroir-fwk/4-tests/integrationTestProfileAssets.js";

describe("integrationTestProfileAssets (B5/B6-b)", () => {
  it("lists the default emulatedServer-indexedDb profile", () => {
    expect(listBrowserIntegrationTestProfileNames()).toContain(DEFAULT_UI_INTEGRATION_PROFILE_NAME);
    expect(DEFAULT_UI_INTEGRATION_PROFILE_NAME).toBe("emulatedServer-indexedDb");
  });

  it("loads bundled indexedDb emulated config for the default profile", async () => {
    const { miroirConfig, logConfig } = await loadBrowserIntegrationTestProfileConfig(
      DEFAULT_UI_INTEGRATION_PROFILE_NAME,
    );

    expect(miroirConfig.client?.emulateServer).toBe(true);
    expect(logConfig).toBeDefined();
  });

  it("throws for unknown profile names", async () => {
    await expect(loadBrowserIntegrationTestProfileConfig("does-not-exist")).rejects.toThrow(
      /Unknown browser integration test profile/,
    );
  });
});
