import {
  ConfigurationService,
  type InProcessExpectFn,
} from "miroir-core";

import {
  createIntegActivityTrackerSync,
  getIntegTestRunCoordinator,
} from "./integTestRunCoordinator.js";
import { loadBrowserIntegrationTestProfileConfig } from "./integrationTestProfileAssets.js";
import type { UiIntegrationTestLauncherEnvironment } from "./uiIntegrationTestLauncher.js";

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
 * Loads the browser integration launcher environment on demand.
 * Uses a runner-only orchestrator in src — must not import tests/helpers/IntegrationTestSession
 * (Node-only stores and node:path would break the Vite production bundle).
 */
export async function loadBrowserUiIntegrationTestLauncherEnvironment(): Promise<UiIntegrationTestLauncherEnvironment> {
  const { createStandaloneAppBrowserIntegrationOrchestrator } = await import(
    "./standaloneAppBrowserIntegrationOrchestrator.js"
  );

  return {
    createOrchestrator: createStandaloneAppBrowserIntegrationOrchestrator,
    loadConfigForProfile: loadBrowserIntegrationTestProfileConfig,
    createActivityTracker: async () => createIntegActivityTrackerSync(),
    expect: resolveBrowserInProcessExpect(),
    getCoordinator: getIntegTestRunCoordinator,
  };
}
