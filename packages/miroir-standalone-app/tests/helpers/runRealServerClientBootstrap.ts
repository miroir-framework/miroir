/**
 * B6-c C1 — Client-only bootstrap against a live `miroir-server`
 * (`emulateServer: false`). No in-process emulated stack / wireEmulatedStack.
 *
 * Isolation (D9): same shared server; ephemeral runTarget UUIDs + teardown
 * drop test deployment stores. Miroir platform is assumed already present —
 * default `platformEnsureMode: "skip"`.
 */

import type {
  ApplicationDeploymentMap,
  Deployment,
  MiroirActivityTracker,
  MiroirConfigClient,
  MiroirEventService,
  MiroirPlatformEnsureMode,
  MiroirTestExecutionEnvironment,
  StoreUnitConfiguration,
} from "miroir-core";
import { ensureMiroirPlatform } from "miroir-core";

import { setupMiroirTest } from "../../src/miroir-fwk/4-tests/setupMiroirTest.js";
import type { AppStackBootstrapHostOptions } from "./appStackIntegrationBootstrap.js";

export type RealServerClientBootstrapOptions = AppStackBootstrapHostOptions & {
  miroirConfig: MiroirConfigClient;
  applicationDeploymentMap: ApplicationDeploymentMap;
  adminDeployment: Deployment;
  testApplicationUuid: string;
  customFetch: typeof fetch;
  miroirActivityTracker?: MiroirActivityTracker;
  miroirEventService?: MiroirEventService;
  miroirDeploymentStorageConfiguration?: StoreUnitConfiguration;
  miroirDeploymentUuid?: string;
  miroirSelfApplicationUuid?: string;
  /**
   * D9 shared-server default: skip creating Miroir platform (already on host).
   * Use `createIfAbsent` only when intentionally provisioning via REST.
   */
  platformEnsureMode?: MiroirPlatformEnsureMode;
};

export async function runRealServerClientBootstrap(
  options: RealServerClientBootstrapOptions,
): Promise<MiroirTestExecutionEnvironment> {
  const {
    miroirConfig,
    applicationDeploymentMap,
    adminDeployment,
    testApplicationUuid,
    customFetch,
    miroirActivityTracker,
    miroirEventService,
    miroirDeploymentStorageConfiguration,
    miroirDeploymentUuid,
    miroirSelfApplicationUuid,
    platformEnsureMode = "skip",
    hostMode,
    hostExecutionEnvironment,
  } = options;

  if (miroirConfig.client.emulateServer) {
    throw new Error(
      "runRealServerClientBootstrap requires emulateServer: false in miroirConfig.client",
    );
  }

  if (!miroirConfig.client.serverConfig?.rootApiUrl) {
    throw new Error(
      "runRealServerClientBootstrap requires miroirConfig.client.serverConfig.rootApiUrl",
    );
  }

  if (hostMode === "embedded" && hostExecutionEnvironment?.domainController) {
    const persistenceStoreControllerManager =
      hostExecutionEnvironment.persistenceStoreControllerManager;
    if (!persistenceStoreControllerManager) {
      throw new Error(
        "runRealServerClientBootstrap: hostExecutionEnvironment.persistenceStoreControllerManager is required when hostMode is embedded",
      );
    }
    return {
      domainController: hostExecutionEnvironment.domainController,
      applicationDeploymentMap:
        hostExecutionEnvironment.applicationDeploymentMap ?? applicationDeploymentMap,
      testApplicationUuid,
      persistenceStoreControllerManager,
    };
  }

  const {
    domainControllerForClient,
    persistenceStoreControllerManagerForClient,
  } = await setupMiroirTest(
    miroirConfig,
    miroirActivityTracker,
    miroirEventService,
    customFetch,
  );

  if (!persistenceStoreControllerManagerForClient) {
    throw new Error(
      "runRealServerClientBootstrap: persistenceStoreControllerManagerForClient missing after setupMiroirTest",
    );
  }

  if (platformEnsureMode !== "skip") {
    if (!miroirDeploymentStorageConfiguration) {
      throw new Error(
        "runRealServerClientBootstrap: miroirDeploymentStorageConfiguration required when platformEnsureMode is not skip",
      );
    }
    if (!miroirDeploymentUuid || !miroirSelfApplicationUuid) {
      throw new Error(
        "runRealServerClientBootstrap: miroirDeploymentUuid and miroirSelfApplicationUuid required when platformEnsureMode is not skip",
      );
    }
    await ensureMiroirPlatform({
      domainController: domainControllerForClient,
      applicationDeploymentMap,
      adminDeployment,
      miroirDeploymentStorageConfiguration,
      miroirDeploymentUuid,
      miroirSelfApplicationUuid,
      mode: platformEnsureMode,
      deployStrategy: "compositeAction",
      // Real-server clients have no local Miroir PersistenceStoreController; createIfAbsent always deploys via REST.
      persistenceStoreControllerManager: undefined,
      // Admin is already open on the shared miroir-server.
      skipOpenAdminStore: true,
    });
  }

  return {
    domainController: domainControllerForClient,
    applicationDeploymentMap:
      hostExecutionEnvironment?.applicationDeploymentMap ?? applicationDeploymentMap,
    testApplicationUuid,
    persistenceStoreControllerManager: persistenceStoreControllerManagerForClient,
  };
}
