import { describe, expect, it } from "vitest";

import {
  DEFAULT_UI_INTEGRATION_PROFILE_NAME,
  isBrowserCompatibleEmulatedIndexedDbConfig,
  isBrowserCompatibleRealServerConfig,
  listBrowserIntegrationTestProfileNames,
  listBrowserLaunchableIntegrationTestProfileNames,
  loadBrowserIntegrationTestProfileConfig,
} from "../../src/miroir-fwk/4-tests/integrationTestProfileAssets.js";

describe("integrationTestProfileAssets (B5/B6-b/B6-c)", () => {
  it("lists the default emulatedServer-indexedDb profile", () => {
    expect(listBrowserIntegrationTestProfileNames()).toContain(DEFAULT_UI_INTEGRATION_PROFILE_NAME);
    expect(DEFAULT_UI_INTEGRATION_PROFILE_NAME).toBe("emulatedServer-indexedDb");
  });

  it("loads a browser-safe config (bundled admin, indexedDb Miroir/Library)", async () => {
    const { miroirConfig, logConfig } = await loadBrowserIntegrationTestProfileConfig(
      DEFAULT_UI_INTEGRATION_PROFILE_NAME,
    );

    expect(miroirConfig.client?.emulateServer).toBe(true);
    expect(miroirConfig.client?.filesystemDeploymentRootDirectory).toBeTruthy();
    expect(logConfig).toBeDefined();
    expect(isBrowserCompatibleEmulatedIndexedDbConfig(miroirConfig)).toBe(true);

    const adminDeployment =
      miroirConfig.client?.deploymentStorageConfig?.[
        "18db21bf-f8d3-4f6a-8296-84b69f6dc48b"
      ];
    expect(adminDeployment?.admin?.emulatedServerType).toBe("bundled");
    expect(adminDeployment?.model?.emulatedServerType).toBe("bundled");
    expect(adminDeployment?.data?.emulatedServerType).toBe("bundled");

    const miroirDeployment =
      miroirConfig.client?.deploymentStorageConfig?.[
        "10ff36f2-50a3-48d8-b80f-e48e5d13af8e"
      ];
    expect(miroirDeployment?.model?.emulatedServerType).toBe("indexedDb");
    expect(miroirDeployment?.data?.emulatedServerType).toBe("indexedDb");
  });

  it("loads realServer-sql browser config (emulateServer false + rootApiUrl + Admin)", async () => {
    const { miroirConfig } = await loadBrowserIntegrationTestProfileConfig("realServer-sql");
    expect(miroirConfig.client?.emulateServer).toBe(false);
    expect(miroirConfig.client?.serverConfig?.rootApiUrl).toBe("https://localhost:3080");
    expect(isBrowserCompatibleRealServerConfig(miroirConfig)).toBe(true);

    // createDeploymentCompositeAction opens Admin first — must not be an empty config.
    const adminStore =
      miroirConfig.client?.serverConfig?.storeSectionConfiguration?.[
        "18db21bf-f8d3-4f6a-8296-84b69f6dc48b"
      ];
    expect(adminStore?.admin?.emulatedServerType).toBe("filesystem");
    expect(adminStore?.model?.emulatedServerType).toBe("filesystem");
    expect(adminStore?.data?.emulatedServerType).toBe("filesystem");
  });

  it("lists launchable browser profiles including realServer-sql", () => {
    expect(listBrowserLaunchableIntegrationTestProfileNames()).toEqual([
      "emulatedServer-indexedDb",
      "realServer-sql",
    ]);
  });

  it("rejects the CLI hybrid indexedDb config (filesystem admin) as browser-incompatible", async () => {
    const cliHybrid = await import("../miroirConfig.test-emulatedServer-indexedDb.json");
    expect(isBrowserCompatibleEmulatedIndexedDbConfig(cliHybrid.default as never)).toBe(false);
  });

  it("throws for unknown profile names", async () => {
    await expect(loadBrowserIntegrationTestProfileConfig("does-not-exist")).rejects.toThrow(
      /Unknown browser integration test profile/,
    );
  });
});
