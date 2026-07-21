import crossFetch from "cross-fetch";

import {
  getBootstrapPhasesForSessionKind,
  MiroirActivityTracker,
  MiroirEventService,
  type ApplicationDeploymentMap,
  type Deployment,
  type DomainControllerInterface,
  type LocalCacheInterface,
  type MiroirConfigClient,
  type StoreUnitConfiguration
} from "miroir-core";
import {
  selfApplicationMiroir,
} from "miroir-test-app_deployment-miroir";
import { selfApplicationLibrary } from "miroir-test-app_deployment-library";
import {
  ConfigurationService,
  LoggerInterface,
  MiroirContext,
  MiroirLoggerFactory,
  PersistenceStoreControllerManager,
  RestClient,
  RestClientInterface,
  RestClientStub,
  RestPersistenceClientAndRestClientInterface
} from "miroir-core";


// TODO: depends on miroir-localcache-redux / miroir-localcache-zustand by way of miroir-react
import {
  RestPersistenceClientAndRestClient,
  setupMiroirDomainController
} from 'miroir-react';

import { packageName } from "../../constants";
import { cleanLevel } from "../4_view/constants";
import { runAppStackIntegrationBootstrap } from "../../../tests/helpers/appStackIntegrationBootstrap.js";
import { deployment_Miroir } from "miroir-test-app_deployment-admin";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "setupMiroirTest")
).then((logger: LoggerInterface) => {log = logger});


// ################################################################################################
/**
 * @param miroirConfig 
 * @returns 
 */
export async function setupMiroirTest(
  miroirConfig: MiroirConfigClient,
  miroirActivityTracker?: MiroirActivityTracker,
  miroirEventService?: MiroirEventService,
  customfetch?: any,
): Promise<{
  domainControllerForClient: DomainControllerInterface;
  domainControllerForServer?: DomainControllerInterface | undefined;
  persistenceStoreControllerManagerForClient: PersistenceStoreControllerManager;
  persistenceStoreControllerManagerForServer?: PersistenceStoreControllerManager | undefined;
  localCache: LocalCacheInterface;
}> {
  const localMiroirActivityTracker = miroirActivityTracker??new MiroirActivityTracker();
  const localMiroirEventService = miroirEventService??new MiroirEventService(localMiroirActivityTracker);
  const miroirContext = new MiroirContext(
    localMiroirActivityTracker,
    localMiroirEventService,
    miroirConfig
  );
  console.log("setupMiroirTest miroirConfig", JSON.stringify(miroirConfig, null, 2));
  let client: RestClientInterface | undefined = undefined;
  let remotePersistenceStoreRestClient: RestPersistenceClientAndRestClientInterface | undefined = undefined;
  if (miroirConfig.client.emulateServer) {
    client = new RestClientStub(miroirConfig.client.rootApiUrl);
    remotePersistenceStoreRestClient = new RestPersistenceClientAndRestClient(
      miroirConfig.client.rootApiUrl,
      client,
    );
  } else {
    client = new RestClient(customfetch ?? fetch);
    remotePersistenceStoreRestClient = new RestPersistenceClientAndRestClient(
      miroirConfig.client.serverConfig.rootApiUrl,
      client,
    );
  }

  if (!client) {
    throw new Error("tests-utils setupMiroirTest could not create client");
  }
  if (!remotePersistenceStoreRestClient) {
    throw new Error("tests-utils setupMiroirTest could not create remotePersistenceStoreRestClient");
  }

  const persistenceStoreControllerManagerForClient = new PersistenceStoreControllerManager(
    ConfigurationService.configurationService.adminStoreFactoryRegister,
    ConfigurationService.configurationService.StoreSectionFactoryRegister
  );

  const domainControllerForClient = await setupMiroirDomainController(
    miroirContext, 
    {
      persistenceStoreAccessMode: "remote",
      localPersistenceStoreControllerManager: persistenceStoreControllerManagerForClient,
      remotePersistenceStoreRestClient,
    }
  ); // even when emulating server, we use remote persistence store, since MSW makes it appear as if we are using a remote server.

  const localCache = domainControllerForClient.getLocalCache();

  let persistenceStoreControllerManagerForServer: PersistenceStoreControllerManager | undefined = undefined;
  if (miroirConfig.client.emulateServer) {
    if (!miroirConfig.client.filesystemDeploymentRootDirectory) {
      throw new Error("tests-utils setupMiroirTest: when emulateServer is true, filesystemDeploymentRootDirectory must be provided in miroirConfig.client");
    }
    persistenceStoreControllerManagerForServer = new PersistenceStoreControllerManager(
      ConfigurationService.configurationService.adminStoreFactoryRegister,
      ConfigurationService.configurationService.StoreSectionFactoryRegister,
      miroirConfig.client.filesystemDeploymentRootDirectory,
    );

    const domainControllerForServer = await setupMiroirDomainController(
      miroirContext, 
      {
        persistenceStoreAccessMode: "local",
        localPersistenceStoreControllerManager: persistenceStoreControllerManagerForServer,
      }
    ); // even when emulating server, we use remote persistence store, since MSW makes it appear as if we are using a remote server.

    (client as RestClientStub).setServerDomainController(domainControllerForServer);
    (client as RestClientStub).setPersistenceStoreControllerManager(persistenceStoreControllerManagerForServer);
    return {
      domainControllerForServer,
      domainControllerForClient,
      persistenceStoreControllerManagerForClient,
      persistenceStoreControllerManagerForServer,
      localCache,
    };
  }
  return {
    domainControllerForClient,
    domainControllerForServer: undefined,
    persistenceStoreControllerManagerForClient,
    persistenceStoreControllerManagerForServer: undefined,
    localCache,
  };
}

// ################################################################################################
/**
 * Common beforeAll setup: creates Miroir test environment and Miroir application deployment.
 * Reduces boilerplate in integration test beforeAll hooks.
 *
 * @deprecated Prefer `DomainControllerIntegrationTestSession` (Gap E). Thin wrapper around
 * `runAppStackIntegrationBootstrap` with phases `[wireEmulatedStack, deployMiroir]`.
 * @see packages/miroir-standalone-app/tests/helpers/DomainControllerIntegrationTestSession.ts
 */
export async function setupMiroirTestAndCreateMiroirDeployment(
  miroirConfig: MiroirConfigClient,
  miroirActivityTracker: MiroirActivityTracker,
  miroirEventService: MiroirEventService,
  miroirDeploymentUuid: string,
  miroirSelfApplicationUuid: string,
  adminDeployment: Deployment,
  miroirDeploymentStorageConfiguration: StoreUnitConfiguration,
  applicationDeploymentMap: ApplicationDeploymentMap,
  customFetch?: any,
): Promise<{
  domainController: DomainControllerInterface;
}> {
  const { domainController } = await runAppStackIntegrationBootstrap({
    miroirConfig,
    applicationDeploymentMap,
    adminDeployment,
    miroirDeploymentStorageConfiguration,
    miroirDeploymentUuid,
    miroirSelfApplicationUuid,
    phases: ["wireEmulatedStack", "deployMiroir"],
    miroirActivityTracker,
    miroirEventService,
    customFetch: customFetch ?? crossFetch,
    testApplicationUuid: selfApplicationLibrary.uuid,
    deployMiroirStrategy: "compositeAction",
    openAdminAndMiroirStoresOnServer: true,
  });
  return { domainController };
}

// ################################################################################################
/**
 * @deprecated Prefer `RunnerTestSession` (Gap E). Thin wrapper around
 * `runAppStackIntegrationBootstrap` with `getBootstrapPhasesForSessionKind("runner")`.
 * @see packages/miroir-standalone-app/tests/helpers/RunnerTestSession.ts
 */
export async function setupMiroirTestAndDeployMiroirApp(
  miroirConfig: MiroirConfigClient,
  miroirActivityTracker: MiroirActivityTracker,
  miroirEventService: MiroirEventService,
  adminDeployment: Deployment,
  miroirDeploymentStorageConfiguration: StoreUnitConfiguration,
  applicationDeploymentMap: ApplicationDeploymentMap,
): Promise<{
  domainController: DomainControllerInterface;
  persistenceStoreControllerManager: PersistenceStoreControllerManager;
}> {
  console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ beforeAll");
  const executionEnvironment = await runAppStackIntegrationBootstrap({
    miroirConfig,
    applicationDeploymentMap,
    adminDeployment,
    miroirDeploymentStorageConfiguration,
    miroirDeploymentUuid: deployment_Miroir.uuid,
    miroirSelfApplicationUuid: selfApplicationMiroir.uuid,
    phases: getBootstrapPhasesForSessionKind("runner"),
    miroirActivityTracker,
    miroirEventService,
    customFetch: crossFetch,
    testApplicationUuid: selfApplicationLibrary.uuid,
    deployMiroirStrategy: "compositeAction",
    openAdminAndMiroirStoresOnServer: false,
  });
  console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ beforeAll DONE");

  return {
    domainController: executionEnvironment.domainController,
    persistenceStoreControllerManager:
      executionEnvironment.persistenceStoreControllerManager as PersistenceStoreControllerManager,
  };
}
