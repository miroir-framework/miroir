import crossFetch from "cross-fetch";

import type {
  ApplicationDeploymentMap,
  Deployment,
  DomainControllerInterface,
  IntegrationTestBootstrapPhase,
  MiroirActivityTracker,
  MiroirConfigClient,
  MiroirEventService,
  MiroirTestExecutionEnvironment,
  PersistenceStoreControllerManagerInterface,
  StoreUnitConfiguration,
} from "miroir-core";
import {
  createDeploymentCompositeAction,
  defaultMiroirModelEnvironment,
  defaultMetaModelEnvironment,
  defaultSelfApplicationDeploymentMap,
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
} from "miroir-test-app_deployment-miroir";

import { setupMiroirTest } from "../../src/miroir-fwk/4-tests/setupMiroirTest.js";
import { createMiroirDeploymentGetPersistenceStoreController } from "../../src/miroir-fwk/4-tests/tests-utils.js";

export type DeployMiroirStrategy = "pscHelper" | "compositeAction";

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
};

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

  const {
    domainControllerForClient,
    domainControllerForServer,
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

  const domainController = domainControllerForClient;
  const persistenceStoreControllerManager = persistenceStoreControllerManagerForServer;

  if (openAdminAndMiroirStoresOnServer) {
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

  if (phases.includes("deployMiroir")) {
    if (deployMiroirStrategy === "pscHelper") {
      const wrapped = await createMiroirDeploymentGetPersistenceStoreController(
        miroirConfig,
        persistenceStoreControllerManager,
        domainController,
        applicationDeploymentMap,
        adminDeployment,
      );
      if (!wrapped?.localMiroirPersistenceStoreController) {
        throw new Error(
          "runAppStackIntegrationBootstrap: Miroir deployment PSC missing after deployMiroir",
        );
      }
    } else {
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

      const deployDomainController =
        miroirConfig.client.emulateServer && domainControllerForServer
          ? domainControllerForServer
          : domainControllerForClient;

      const createMiroirDeploymentCompositeAction = createDeploymentCompositeAction(
        "miroir",
        miroirDeploymentUuid,
        miroirSelfApplicationUuid,
        adminDeployment,
        miroirDeploymentStorageConfiguration,
      );
      const createDeploymentResult = await deployDomainController.handleCompositeAction(
        createMiroirDeploymentCompositeAction,
        applicationDeploymentMap,
        defaultMiroirModelEnvironment,
        {},
      );
      if (createDeploymentResult.status !== "ok") {
        throw new Error(
          "runAppStackIntegrationBootstrap: Miroir deployment failed: " +
            JSON.stringify(createDeploymentResult),
        );
      }
    }
  }

  if (phases.includes("deployLibrary")) {
    if (!libraryDeploymentStorageConfiguration) {
      throw new Error(
        "runAppStackIntegrationBootstrap: libraryDeploymentStorageConfiguration required for deployLibrary phase",
      );
    }

    const createLibraryDeploymentAction = createDeploymentCompositeAction(
      "library",
      deployment_Library_DO_NO_USE.uuid,
      selfApplicationLibrary.uuid,
      adminDeployment,
      libraryDeploymentStorageConfiguration,
    );
    const createLibraryResult = await domainController.handleCompositeAction(
      createLibraryDeploymentAction,
      applicationDeploymentMap,
      defaultMiroirModelEnvironment,
      {},
    );
    if (createLibraryResult.status !== "ok") {
      throw new Error(
        "runAppStackIntegrationBootstrap: library deployment failed: " +
          JSON.stringify(createLibraryResult),
      );
    }

    const libraryPersistenceStoreController =
      persistenceStoreControllerManager.getPersistenceStoreController(
        deployment_Library_DO_NO_USE.uuid,
      );
    if (!libraryPersistenceStoreController) {
      throw new Error(
        "runAppStackIntegrationBootstrap: library PSC missing after deployLibrary",
      );
    }
  }

  if (phases.includes("resetMiroirModel")) {
    await resetAndInitApplicationDeployment(domainController, applicationDeploymentMap, [
      selfApplicationDeploymentMiroir as Deployment,
    ]);
  }

  return {
    domainController,
    applicationDeploymentMap,
    testApplicationUuid,
    persistenceStoreControllerManager,
  };
}
