import crossFetch from "cross-fetch";
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
import {
  generateEphemeralIntegrationTestApplicationIdentity,
  PINNED_INTEG_TEST_APPLICATION_IDENTITY,
  resolveTestSessionForIntegOptionsFromEnv,
} from "./IntegrationTestSession.js";
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
    // Same TLS-tolerant fetch as RunnerTestSession bootstrap against local miroir-server.
    fetchImpl: crossFetch as unknown as typeof fetch,
    resolveTransformerSessionOptions: (_profileName, runTargetMode) => {
      const base = resolveTestSessionForIntegOptionsFromEnv(process.env);
      return {
        ...base,
        applicationIdentity:
          runTargetMode === "ephemeral"
            ? generateEphemeralIntegrationTestApplicationIdentity()
            : PINNED_INTEG_TEST_APPLICATION_IDENTITY,
      };
    },
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
