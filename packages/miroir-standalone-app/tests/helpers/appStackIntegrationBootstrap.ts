import type {
  ApplicationDeploymentMap,
  DeployMiroirStrategy,
  Deployment,
  DomainControllerInterface,
  IntegrationTestBootstrapPhase,
  IntegrationTestHostMode,
  LibraryPlayfieldEnsureMode,
  MiroirActivityTracker,
  MiroirConfigClient,
  MiroirEventService,
  MiroirPlatformEnsureMode,
  MiroirTestExecutionEnvironment,
  PersistenceStoreControllerManagerInterface,
  StoreUnitConfiguration,
} from "miroir-core";
import {
  defaultMetaModelEnvironment,
  defaultSelfApplicationDeploymentMap,
  ensureLibraryPlayfield,
  ensureMiroirPlatform,
  resetAndInitApplicationDeployment,
  type StoreOrBundleAction,
} from "miroir-core";
import { deployment_Miroir } from "miroir-test-app_deployment-admin";
import {
  deployment_Library_DO_NO_USE,
  selfApplicationLibrary,
} from "miroir-test-app_deployment-library";
import {
  selfApplicationDeploymentMiroir,
  selfApplicationMiroir,
} from "miroir-test-app_deployment-miroir";

import { setupMiroirTest } from "../../src/miroir-fwk/4-tests/setupMiroirTest.js";
import { createMiroirDeploymentGetPersistenceStoreController } from "../../src/miroir-fwk/4-tests/tests-utils.js";

export type { DeployMiroirStrategy };

export type AppStackBootstrapHostOptions = Pick<
  AppStackBootstrapOptions,
  "hostMode" | "hostExecutionEnvironment" | "skipBootstrapPhases" | "platformEnsureMode"
>;

export function bootstrapHostOptionsFrom(
  source: AppStackBootstrapHostOptions,
): AppStackBootstrapHostOptions {
  return {
    hostMode: source.hostMode,
    hostExecutionEnvironment: source.hostExecutionEnvironment,
    skipBootstrapPhases: source.skipBootstrapPhases,
    platformEnsureMode: source.platformEnsureMode,
  };
}

export type AppStackBootstrapOptions = {
  miroirConfig: MiroirConfigClient;
  applicationDeploymentMap: ApplicationDeploymentMap;
  adminDeployment: Deployment;
  phases: readonly IntegrationTestBootstrapPhase[];
  testApplicationUuid: string;
  deployMiroirStrategy: DeployMiroirStrategy;
  openAdminAndMiroirStoresOnServer: boolean;
  customFetch: typeof fetch;
  libraryDeploymentStorageConfiguration?: StoreUnitConfiguration;
  miroirDeploymentStorageConfiguration?: StoreUnitConfiguration;
  miroirActivityTracker?: MiroirActivityTracker;
  miroirEventService?: MiroirEventService;
  /** Required when `deployMiroir` runs with `deployMiroirStrategy: "compositeAction"`. */
  miroirDeploymentUuid?: string;
  /** Required when `deployMiroir` runs with `deployMiroirStrategy: "compositeAction"`. */
  miroirSelfApplicationUuid?: string;
  libraryPlayfieldEnsureMode?: LibraryPlayfieldEnsureMode;
  hostMode?: IntegrationTestHostMode;
  hostExecutionEnvironment?: Partial<MiroirTestExecutionEnvironment>;
  skipBootstrapPhases?: readonly IntegrationTestBootstrapPhase[];
  platformEnsureMode?: MiroirPlatformEnsureMode;
};

function isPhaseSkipped(
  phase: IntegrationTestBootstrapPhase,
  skipBootstrapPhases: readonly IntegrationTestBootstrapPhase[] | undefined,
): boolean {
  return skipBootstrapPhases?.includes(phase) ?? false;
}

function usesEmbeddedHost(options: AppStackBootstrapOptions): boolean {
  return (
    options.hostMode === "embedded" &&
    !!options.hostExecutionEnvironment?.domainController
  );
}

async function openAdminAndMiroirStores(
  domainControllerForServer: DomainControllerInterface,
  adminDeployment: Deployment,
  miroirDeploymentStorageConfiguration: StoreUnitConfiguration,
): Promise<void> {
  const miroirDeploymentForOpenStore: Deployment = {
    ...(deployment_Miroir as Deployment),
    uuid: selfApplicationDeploymentMiroir.uuid,
    configuration: miroirDeploymentStorageConfiguration,
  };

  const configurations: Record<string, Deployment> = {
    [adminDeployment.uuid]: adminDeployment,
    [selfApplicationDeploymentMiroir.uuid]: miroirDeploymentForOpenStore,
  };

  for (const c of Object.entries(configurations)) {
    const openStoreAction: StoreOrBundleAction = {
      actionType: "storeManagementAction_openStore",
      endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
      payload: {
        application: c[1].selfApplication,
        deploymentUuid: c[0],
        configuration: {
          [c[0]]: c[1].configuration as StoreUnitConfiguration,
        },
      },
    };
    await domainControllerForServer.handleAction(
      openStoreAction,
      defaultSelfApplicationDeploymentMap,
      defaultMetaModelEnvironment,
    );
  }
}

export async function runAppStackIntegrationBootstrap(
  options: AppStackBootstrapOptions,
): Promise<MiroirTestExecutionEnvironment> {
  const {
    miroirConfig,
    applicationDeploymentMap,
    adminDeployment,
    phases,
    libraryDeploymentStorageConfiguration,
    miroirDeploymentStorageConfiguration,
    miroirActivityTracker,
    miroirEventService,
    customFetch,
    testApplicationUuid,
    deployMiroirStrategy,
    openAdminAndMiroirStoresOnServer,
    miroirDeploymentUuid,
    miroirSelfApplicationUuid,
    libraryPlayfieldEnsureMode = "createIfAbsent",
    hostMode,
    hostExecutionEnvironment,
    skipBootstrapPhases,
    platformEnsureMode = "createIfAbsent",
  } = options;

  if (!phases.includes("wireEmulatedStack")) {
    throw new Error(
      "runAppStackIntegrationBootstrap: wireEmulatedStack phase is required",
    );
  }

  if (!miroirConfig.client.emulateServer) {
    throw new Error(
      "runAppStackIntegrationBootstrap requires emulateServer: true in miroirConfig.client",
    );
  }

  let domainControllerForClient: DomainControllerInterface;
  let domainControllerForServer: DomainControllerInterface | undefined;
  let persistenceStoreControllerManager: PersistenceStoreControllerManagerInterface;

  if (usesEmbeddedHost(options)) {
    domainControllerForClient = hostExecutionEnvironment!.domainController!;
    persistenceStoreControllerManager =
      hostExecutionEnvironment!.persistenceStoreControllerManager!;
    if (!persistenceStoreControllerManager) {
      throw new Error(
        "runAppStackIntegrationBootstrap: hostExecutionEnvironment.persistenceStoreControllerManager is required when hostMode is embedded",
      );
    }
    domainControllerForServer = domainControllerForClient;
  } else if (!isPhaseSkipped("wireEmulatedStack", skipBootstrapPhases)) {
    const {
      domainControllerForClient: wiredClient,
      domainControllerForServer: wiredServer,
      persistenceStoreControllerManagerForServer,
    } = await setupMiroirTest(
      miroirConfig,
      miroirActivityTracker,
      miroirEventService,
      customFetch,
    );

    if (!persistenceStoreControllerManagerForServer) {
      throw new Error(
        "runAppStackIntegrationBootstrap: persistenceStoreControllerManagerForServer missing",
      );
    }

    domainControllerForClient = wiredClient;
    domainControllerForServer = wiredServer;
    persistenceStoreControllerManager = persistenceStoreControllerManagerForServer;
  } else {
    throw new Error(
      "runAppStackIntegrationBootstrap: wireEmulatedStack skipped without embedded hostExecutionEnvironment",
    );
  }

  const domainController = domainControllerForClient;

  if (
    openAdminAndMiroirStoresOnServer &&
    !usesEmbeddedHost(options) &&
    !isPhaseSkipped("wireEmulatedStack", skipBootstrapPhases)
  ) {
    if (!domainControllerForServer) {
      throw new Error(
        "runAppStackIntegrationBootstrap: domainControllerForServer missing for openAdminAndMiroirStoresOnServer",
      );
    }
    if (!miroirDeploymentStorageConfiguration) {
      throw new Error(
        "runAppStackIntegrationBootstrap: miroirDeploymentStorageConfiguration required for openAdminAndMiroirStoresOnServer",
      );
    }
    await openAdminAndMiroirStores(
      domainControllerForServer,
      adminDeployment,
      miroirDeploymentStorageConfiguration,
    );
  }

  if (
    phases.includes("deployMiroir") &&
    !isPhaseSkipped("deployMiroir", skipBootstrapPhases)
  ) {
    if (deployMiroirStrategy === "compositeAction") {
      if (!miroirDeploymentStorageConfiguration) {
        throw new Error(
          "runAppStackIntegrationBootstrap: miroirDeploymentStorageConfiguration required for deployMiroir with compositeAction",
        );
      }
      if (!miroirDeploymentUuid) {
        throw new Error(
          "runAppStackIntegrationBootstrap: miroirDeploymentUuid required for deployMiroir with compositeAction",
        );
      }
      if (!miroirSelfApplicationUuid) {
        throw new Error(
          "runAppStackIntegrationBootstrap: miroirSelfApplicationUuid required for deployMiroir with compositeAction",
        );
      }
    }

    const deployDomainController =
      miroirConfig.client.emulateServer && domainControllerForServer
        ? domainControllerForServer
        : domainControllerForClient;

    const resolvedMiroirDeploymentUuid =
      miroirDeploymentUuid ?? selfApplicationDeploymentMiroir.uuid;
    const resolvedMiroirSelfApplicationUuid =
      miroirSelfApplicationUuid ?? selfApplicationMiroir.uuid;

    await ensureMiroirPlatform({
      domainController: deployDomainController,
      applicationDeploymentMap,
      adminDeployment,
      miroirDeploymentStorageConfiguration:
        miroirDeploymentStorageConfiguration ?? ({} as StoreUnitConfiguration),
      miroirDeploymentUuid: resolvedMiroirDeploymentUuid,
      miroirSelfApplicationUuid: resolvedMiroirSelfApplicationUuid,
      mode: platformEnsureMode,
      deployStrategy: deployMiroirStrategy,
      persistenceStoreControllerManager,
      deployViaPscHelper:
        deployMiroirStrategy === "persistenceStoreControllerHelper"
          ? async () => {
              const wrapped = await createMiroirDeploymentGetPersistenceStoreController(
                miroirConfig,
                persistenceStoreControllerManager,
                domainController,
                applicationDeploymentMap,
                adminDeployment,
              );
              if (!wrapped?.localMiroirPersistenceStoreController) {
                throw new Error(
                  "runAppStackIntegrationBootstrap: Miroir deployment PersistenceStoreController missing after deployMiroir",
                );
              }
            }
          : undefined,
    });
  }

  if (
    phases.includes("deployLibrary") &&
    !isPhaseSkipped("deployLibrary", skipBootstrapPhases)
  ) {
    if (!libraryDeploymentStorageConfiguration) {
      throw new Error(
        "runAppStackIntegrationBootstrap: libraryDeploymentStorageConfiguration required for deployLibrary phase",
      );
    }

    await ensureLibraryPlayfield({
      domainController,
      applicationDeploymentMap,
      adminDeployment,
      libraryDeploymentStorageConfiguration,
      libraryDeploymentUuid: deployment_Library_DO_NO_USE.uuid,
      librarySelfApplicationUuid: selfApplicationLibrary.uuid,
      mode: libraryPlayfieldEnsureMode,
      persistenceStoreControllerManager,
    });

    const libraryPersistenceStoreController =
      persistenceStoreControllerManager.getPersistenceStoreController(
        deployment_Library_DO_NO_USE.uuid,
      );
    if (!libraryPersistenceStoreController) {
      throw new Error(
        "runAppStackIntegrationBootstrap: library PersistenceStoreController missing after deployLibrary",
      );
    }
  }

  if (
    phases.includes("resetMiroirModel") &&
    !isPhaseSkipped("resetMiroirModel", skipBootstrapPhases)
  ) {
    await resetAndInitApplicationDeployment(domainController, applicationDeploymentMap, [
      selfApplicationDeploymentMiroir as Deployment,
    ]);
  }

  return {
    domainController,
    applicationDeploymentMap:
      hostExecutionEnvironment?.applicationDeploymentMap ?? applicationDeploymentMap,
    testApplicationUuid,
    persistenceStoreControllerManager,
  };
}
