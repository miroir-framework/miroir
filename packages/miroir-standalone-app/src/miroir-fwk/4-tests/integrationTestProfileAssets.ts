import type { LoggerOptions, MiroirConfigClient } from "miroir-core";

import emulatedServerIndexedDbMiroirConfig from "../../../tests/miroirConfig.test-emulatedServer-indexedDb.json";
import domainControllerDebugLogConfig from "../../../tests/specificLoggersConfig_DomainController_debug.json";
import {
  DEFAULT_UI_INTEGRATION_PROFILE_NAME,
  listBrowserBundledIntegrationTestProfileNames,
} from "./integrationTestProfileCatalog.js";

export { DEFAULT_UI_INTEGRATION_PROFILE_NAME } from "./integrationTestProfileCatalog.js";

export const DEFAULT_UI_INTEGRATION_RUN_TARGET_MODE = "ephemeral" as const;

type BrowserIntegrationTestProfileAssets = {
  miroirConfig: MiroirConfigClient;
  logConfig: LoggerOptions;
};

const BROWSER_INTEGRATION_TEST_PROFILE_ASSETS: Record<string, BrowserIntegrationTestProfileAssets> =
  {
    [DEFAULT_UI_INTEGRATION_PROFILE_NAME]: {
      miroirConfig: emulatedServerIndexedDbMiroirConfig as unknown as MiroirConfigClient,
      logConfig: domainControllerDebugLogConfig as LoggerOptions,
    },
  };

export function listBrowserIntegrationTestProfileNames(): string[] {
  return listBrowserBundledIntegrationTestProfileNames();
}

export async function loadBrowserIntegrationTestProfileConfig(
  profileName: string,
): Promise<BrowserIntegrationTestProfileAssets> {
  const assets = BROWSER_INTEGRATION_TEST_PROFILE_ASSETS[profileName];
  if (!assets) {
    throw new Error(
      `Unknown browser integration test profile: ${profileName}. ` +
        `Valid profiles: ${listBrowserIntegrationTestProfileNames().join(", ")}`,
    );
  }
  return assets;
}
