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
 * Must not statically import `tests/helpers/*` — that pulls Node-only stores into the Vite bundle.
 */
export async function loadBrowserUiIntegrationTestLauncherEnvironment(): Promise<UiIntegrationTestLauncherEnvironment> {
  const { createStandaloneAppIntegrationOrchestrator } = await import(
    "../../../tests/helpers/StandaloneAppIntegrationOrchestrator.js"
  );

  return {
    createOrchestrator: createStandaloneAppIntegrationOrchestrator,
    loadConfigForProfile: loadBrowserIntegrationTestProfileConfig,
    createActivityTracker: async () => createIntegActivityTrackerSync(),
    expect: resolveBrowserInProcessExpect(),
    getCoordinator: getIntegTestRunCoordinator,
  };
}
