import {
  type LoggerOptions,
} from "miroir-core";

import {
  createIntegActivityTrackerSync,
  resetIntegTestRunCoordinatorForTests,
} from "../../src/miroir-fwk/4-tests/integTestRunCoordinator.js";
import {
  runUiIntegrationTestSuite,
  type UiIntegrationTestLauncherEnvironment,
} from "../../src/miroir-fwk/4-tests/uiIntegrationTestLauncher.js";
import type { UiIntegrationTestRunRequest } from "../../src/miroir-fwk/4-tests/uiIntegrationTestLauncherTypes.js";
import { applyIntegrationTestProfile, resolveRepoRoot } from "./integrationTestProfiles.js";
import { createStandaloneAppIntegrationOrchestrator } from "./StandaloneAppIntegrationOrchestrator.js";
import { loadTestConfigFiles } from "../utils/fileTools.js";

export function createNodeUiIntegrationTestLauncherEnvironment(
  expectFn: UiIntegrationTestLauncherEnvironment["expect"],
): UiIntegrationTestLauncherEnvironment {
  return {
    createOrchestrator: createStandaloneAppIntegrationOrchestrator,
    loadConfigForProfile: async (profileName) => {
      applyIntegrationTestProfile(profileName, { respectExistingEnv: false });
      const previousPwd = process.env.PWD;
      process.env.PWD = resolveRepoRoot();
      try {
        const { miroirConfig, logConfig } = await loadTestConfigFiles(process.env);
        return { miroirConfig, logConfig: logConfig as LoggerOptions };
      } finally {
        if (previousPwd !== undefined) {
          process.env.PWD = previousPwd;
        } else {
          delete process.env.PWD;
        }
      }
    },
    createActivityTracker: async () => createIntegActivityTrackerSync(),
    expect: expectFn,
  };
}

export async function runUiIntegrationTestSuiteInNode(
  request: UiIntegrationTestRunRequest,
  expectFn: UiIntegrationTestLauncherEnvironment["expect"],
) {
  resetIntegTestRunCoordinatorForTests();

  return runUiIntegrationTestSuite(
    request,
    createNodeUiIntegrationTestLauncherEnvironment(expectFn),
  );
}
