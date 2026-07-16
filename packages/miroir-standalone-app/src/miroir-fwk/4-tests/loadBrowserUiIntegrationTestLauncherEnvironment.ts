import {
  ConfigurationService,
  type InProcessExpectFn,
  type MiroirConfigClient,
  type StoreUnitConfiguration,
} from "miroir-core";
import { miroirBundledStoreSectionStartup } from "miroir-store-bundled";

import {
  ADMIN_DEPLOYMENT_UUID,
  buildBrowserAdminBundledDeploymentData,
  MIROIR_DEPLOYMENT_UUID,
} from "./browserAdminBundledSeed.js";
import {
  createIntegActivityTrackerSync,
  getIntegTestRunCoordinator,
} from "./integTestRunCoordinator.js";
import { loadBrowserIntegrationTestProfileConfig } from "./integrationTestProfileAssets.js";
import type { UiIntegrationTestLauncherEnvironment } from "./uiIntegrationTestLauncher.js";

let browserBundledAdminStoreRegistered = false;

export function resolveBrowserInProcessExpect(): InProcessExpectFn {
  const expectFn = ConfigurationService.configurationService.testImplementation?.expect;
  if (!expectFn) {
    throw new Error(
      "Browser integration tests require ConfigurationService.registerTestImplementation({ expect }) on app startup",
    );
  }
  return expectFn as unknown as InProcessExpectFn;
}

/**
 * Empty IndexedDB admin has no AdminApplication entity tables, so
 * CreateDeploymentInstances fails. Register bundled admin (sandbox pattern)
 * once before any UI integ bootstrap.
 */
function ensureBrowserBundledAdminStoreRegistered(miroirConfig: MiroirConfigClient): void {
  if (browserBundledAdminStoreRegistered) {
    return;
  }
  const client = miroirConfig.client;
  if (!client || client.emulateServer !== true) {
    throw new Error(
      "ensureBrowserBundledAdminStoreRegistered: expected emulateServer client config",
    );
  }
  const miroirDeploymentStoreConfig = client.deploymentStorageConfig?.[
    MIROIR_DEPLOYMENT_UUID
  ] as StoreUnitConfiguration | undefined;
  if (!miroirDeploymentStoreConfig) {
    throw new Error(
      `ensureBrowserBundledAdminStoreRegistered: missing Miroir deployment storage for ${MIROIR_DEPLOYMENT_UUID}`,
    );
  }
  const adminSections = client.deploymentStorageConfig?.[ADMIN_DEPLOYMENT_UUID];
  if (
    !adminSections ||
    adminSections.admin?.emulatedServerType !== "bundled" ||
    adminSections.model?.emulatedServerType !== "bundled" ||
    adminSections.data?.emulatedServerType !== "bundled"
  ) {
    throw new Error(
      "ensureBrowserBundledAdminStoreRegistered: browser UI integ profile must use bundled admin storage",
    );
  }
  miroirBundledStoreSectionStartup(
    ConfigurationService.configurationService,
    buildBrowserAdminBundledDeploymentData(miroirDeploymentStoreConfig),
  );
  browserBundledAdminStoreRegistered = true;
}

/**
 * Loads the browser integration launcher environment on demand.
 * Uses a runner-only orchestrator in src — must not import tests/helpers/IntegrationTestSession
 * (Node-only stores and node:path would break the Vite production bundle).
 */
export async function loadBrowserUiIntegrationTestLauncherEnvironment(): Promise<UiIntegrationTestLauncherEnvironment> {
  const { createStandaloneAppBrowserIntegrationOrchestrator } = await import(
    "./standaloneAppBrowserIntegrationOrchestrator.js"
  );

  const loadConfigForProfile = async (profileName: string) => {
    const assets = await loadBrowserIntegrationTestProfileConfig(profileName);
    ensureBrowserBundledAdminStoreRegistered(assets.miroirConfig);
    return assets;
  };

  return {
    createOrchestrator: createStandaloneAppBrowserIntegrationOrchestrator,
    loadConfigForProfile,
    createActivityTracker: async () => createIntegActivityTrackerSync(),
    expect: resolveBrowserInProcessExpect(),
    getCoordinator: getIntegTestRunCoordinator,
  };
}
