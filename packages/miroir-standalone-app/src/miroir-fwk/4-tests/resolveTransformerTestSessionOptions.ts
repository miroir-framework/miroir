import { deployment_Admin } from "miroir-test-app_deployment-admin";
import type { BundledDeploymentData } from "miroir-store-bundled";
import type { MiroirConfigClient } from "miroir-core";

import {
  generateEphemeralIntegrationTestApplicationIdentity,
  PINNED_INTEG_TEST_APPLICATION_IDENTITY,
  type IntegrationTestApplicationIdentity,
  type TestSessionForIntegOptions,
} from "./IntegrationTestSession.js";
import type { UiIntegrationTestRunTargetMode } from "./uiIntegrationTestLauncherTypes.js";

export type ResolveBrowserTransformerSessionOptionsParams = {
  runTargetMode: UiIntegrationTestRunTargetMode;
  /** Pre-built bundled admin seed (from loadBrowserUiIntegrationTestLauncherEnvironment). */
  bundledDeploymentData: Record<string, BundledDeploymentData>;
  /** Optional: derive a unique IndexedDB name suffix from profile. */
  profileName?: string;
};

/**
 * Browser-safe transformer session options: IndexedDB testApplication + bundled Admin.
 * Used by the UI launcher when `hostMode: isolated` runs in webApp.
 */
export function resolveBrowserTransformerTestSessionOptions(
  params: ResolveBrowserTransformerSessionOptionsParams,
): TestSessionForIntegOptions {
  const applicationIdentity: IntegrationTestApplicationIdentity =
    params.runTargetMode === "ephemeral"
      ? generateEphemeralIntegrationTestApplicationIdentity()
      : PINNED_INTEG_TEST_APPLICATION_IDENTITY;

  const indexedDbName =
    params.runTargetMode === "ephemeral"
      ? applicationIdentity.applicationName
      : `ui-integ-${params.profileName ?? "transformer"}`;

  return {
    applicationIdentity,
    testApplicationStore: {
      emulatedServerType: "indexedDb",
      rootIndexDbName: indexedDbName,
    },
    adminStore: {
      emulatedServerType: "bundled",
      deploymentUuid: deployment_Admin.uuid,
    },
    filesystemDeploymentRootDirectory: "browser-emulated-no-fs",
    bundledDeploymentData: params.bundledDeploymentData,
  };
}

/**
 * Map a runTarget-shaped inspector snapshot from transformer application identity.
 */
export function transformerIdentityToRunTarget(identity: IntegrationTestApplicationIdentity) {
  return {
    applicationUuid: identity.applicationUuid,
    applicationName: identity.applicationName,
    deploymentUuid: identity.deploymentUuid,
  };
}

/** True when the loaded client config is an in-browser emulated stack. */
export function isBrowserEmulatedTransformerProfile(miroirConfig: MiroirConfigClient): boolean {
  return miroirConfig.client?.emulateServer === true;
}
