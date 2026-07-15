import { describe, expect, it } from "vitest";

import { miroirTest_runner_library } from "miroir-test-app_deployment-library";

import {
  isUiIntegrationProfileLaunchableInBrowser,
  listBrowserBundledIntegrationTestProfileNames,
  listUiIntegrationProfileCatalogForPicker,
} from "../../src/miroir-fwk/4-tests/integrationTestProfileCatalog.js";

describe("integrationTestProfileCatalog (B6)", () => {
  it("web picker excludes SQL emulated and CI profiles", () => {
    const webPicker = listUiIntegrationProfileCatalogForPicker("webApp").map((e) => e.name);
    expect(webPicker).toContain("emulatedServer-indexedDb");
    expect(webPicker).not.toContain("emulatedServer-sql");
    expect(webPicker).not.toContain("ci-emulatedServer-host-sql");
    expect(webPicker).toContain("realServer-sql");
  });

  it("electron picker includes emulatedServer-sql but not CI profiles", () => {
    const electronPicker = listUiIntegrationProfileCatalogForPicker("electron").map(
      (e) => e.name,
    );
    expect(electronPicker).toContain("emulatedServer-indexedDb");
    expect(electronPicker).toContain("emulatedServer-sql");
    expect(electronPicker).not.toContain("ci-emulatedServer-host-sql");
  });

  it("only indexedDb emulated is launchable in webApp today", () => {
    expect(isUiIntegrationProfileLaunchableInBrowser("emulatedServer-indexedDb", "webApp")).toBe(
      true,
    );
    expect(isUiIntegrationProfileLaunchableInBrowser("emulatedServer-sql", "webApp")).toBe(false);
    expect(isUiIntegrationProfileLaunchableInBrowser("emulatedServer-sql", "electron")).toBe(false);
    expect(isUiIntegrationProfileLaunchableInBrowser("realServer-sql", "webApp")).toBe(false);
  });

  it("bundled browser config is indexedDb only", () => {
    expect(listBrowserBundledIntegrationTestProfileNames()).toEqual(["emulatedServer-indexedDb"]);
  });
});

describe("resolveUiIntegrationRunnerSuiteKey (B6-d0)", () => {
  it("maps instance name and miroirTestLabel to registry key runner_library", async () => {
    const { resolveUiIntegrationRunnerSuiteKey, isUiIntegrationRunnerSuiteSupportedForInstance } =
      await import("../../src/miroir-fwk/4-tests/resolveUiIntegrationRunnerSuiteKey.js");

    expect(resolveUiIntegrationRunnerSuiteKey(miroirTest_runner_library as never)).toBe(
      "runner_library",
    );
    expect(isUiIntegrationRunnerSuiteSupportedForInstance(miroirTest_runner_library as never)).toBe(
      true,
    );

    const byLabelOnly = {
      ...miroirTest_runner_library,
      name: "other-name",
    };
    expect(resolveUiIntegrationRunnerSuiteKey(byLabelOnly as never)).toBe("runner_library");
  });
});
