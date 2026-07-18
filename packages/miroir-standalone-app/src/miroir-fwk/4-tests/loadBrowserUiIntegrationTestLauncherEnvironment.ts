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
import {
  resolveBrowserTransformerTestSessionOptions,
  resolveRealServerTransformerTestSessionOptions,
} from "./resolveTransformerTestSessionOptions.js";
import type { UiIntegrationTestLauncherEnvironment } from "./uiIntegrationTestLauncher.js";

let browserBundledAdminStoreRegistered = false;
let lastBundledDeploymentData:
  | ReturnType<typeof buildBrowserAdminBundledDeploymentData>
  | undefined;

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
  lastBundledDeploymentData = buildBrowserAdminBundledDeploymentData(miroirDeploymentStoreConfig);
  miroirBundledStoreSectionStartup(
    ConfigurationService.configurationService,
    lastBundledDeploymentData,
  );
  browserBundledAdminStoreRegistered = true;
}

/**
 * Loads the browser integration launcher environment on demand.
 * Orchestrator lives in src and supports runner + transformer (IndexedDB) sessions —
 * must not import Node-only IntegrationTestSession facades that pull node:path.
 */
export async function loadBrowserUiIntegrationTestLauncherEnvironment(): Promise<UiIntegrationTestLauncherEnvironment> {
  const { createStandaloneAppBrowserIntegrationOrchestrator } = await import(
    "./standaloneAppBrowserIntegrationOrchestrator.js"
  );

  const loadConfigForProfile = async (profileName: string) => {
    const assets = await loadBrowserIntegrationTestProfileConfig(profileName);
    // Bundled admin seed is only for in-browser emulated IndexedDB (empty IDB admin tables).
    if (assets.miroirConfig.client.emulateServer === true) {
      ensureBrowserBundledAdminStoreRegistered(assets.miroirConfig);
    }
    return assets;
  };

  return {
    createOrchestrator: createStandaloneAppBrowserIntegrationOrchestrator,
    loadConfigForProfile,
    createActivityTracker: async () => createIntegActivityTrackerSync(),
    expect: resolveBrowserInProcessExpect(),
    getCoordinator: getIntegTestRunCoordinator,
    resolveTransformerSessionOptions: (profileName, runTargetMode, miroirConfig) => {
      if (miroirConfig.client?.emulateServer === false) {
        return resolveRealServerTransformerTestSessionOptions({
          profileName,
          runTargetMode,
          miroirConfig,
        });
      }
      if (miroirConfig.client?.emulateServer !== true) {
        throw new Error(
          `Browser transformer UI integ requires emulatedServer-indexedDb or realServer-sql (got "${profileName}").`,
        );
      }
      if (!lastBundledDeploymentData) {
        throw new Error(
          "Browser transformer session: bundled admin seed not registered — loadConfigForProfile must run first",
        );
      }
      return resolveBrowserTransformerTestSessionOptions({
        runTargetMode,
        bundledDeploymentData: lastBundledDeploymentData,
        profileName,
      });
    },
  };
}
