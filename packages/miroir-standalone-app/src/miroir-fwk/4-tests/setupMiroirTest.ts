// As a basic setup, import your same slice reducers
import {
  ConfigurationService,
  DomainControllerInterface,
  LocalCacheInterface,
  LoggerInterface,
  MiroirActivityTracker,
  MiroirConfigClient,
  MiroirContext,
  MiroirEventService,
  MiroirLoggerFactory,
  PersistenceStoreControllerManager,
  PersistenceStoreControllerManagerInterface,
  RestClient,
  RestClientInterface,
  RestClientStub,
  RestPersistenceClientAndRestClientInterface
} from "miroir-core";

// As a basic setup, import your same slice reducers
import {
  // Deployment,
  StoreUnitConfiguration,
  // deployment_Library_DO_NO_USE,
  createDeploymentCompositeAction,
  defaultMetaModelEnvironment,
  defaultMiroirModelEnvironment,
  defaultSelfApplicationDeploymentMap,
  type ApplicationDeploymentMap,
  type Deployment
} from "miroir-core";
import {
  deployment_Admin,
  deployment_Miroir
} from "miroir-test-app_deployment-admin";


// TODO: depends on miroir-localcache-redux / miroir-localcache-zustand by way of miroir-react
import {
  RestPersistenceClientAndRestClient,
  setupMiroirDomainController
} from 'miroir-react';

import { packageName } from "../../constants";
import { cleanLevel } from "../4_view/constants";
import type { StoreOrBundleAction } from "miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

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
  persistenceStoreControllerManagerForServer?: PersistenceStoreControllerManagerInterface;
  persistenceStoreControllerManagerForClient: PersistenceStoreControllerManagerInterface;
  localCache: LocalCacheInterface;
  miroirContext: MiroirContext;
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
      persistenceStoreControllerManagerForClient,
      persistenceStoreControllerManagerForServer,
      domainControllerForServer,
      domainControllerForClient,
      localCache: domainControllerForClient.getLocalCache(),
      miroirContext,
    };
  }
  return {
    persistenceStoreControllerManagerForClient,
    persistenceStoreControllerManagerForServer: undefined,
    domainControllerForClient,
    domainControllerForServer: undefined,
    localCache: domainControllerForClient.getLocalCache(),
    miroirContext,
  };
}

// ################################################################################################
/**
 * Common beforeAll setup: creates Miroir test environment and Miroir application deployment.
 * Reduces boilerplate in integration test beforeAll hooks.
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
  // persistenceStoreControllerManagerForClient: PersistenceStoreControllerManagerInterface;
}> {
  // const { domainController, persistenceStoreControllerManagerForClient } = await setupMiroirTest(
  const { domainControllerForClient, domainControllerForServer } = await setupMiroirTest(
    miroirConfig, miroirActivityTracker, miroirEventService, customFetch,
  );

  if (miroirConfig.client.emulateServer && domainControllerForServer) {
    log.info('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ setupMiroirTestAndCreateMiroirDeployment created server domain controller');
    const configurations: Record<string, Deployment> = {
      [deployment_Admin.uuid]: deployment_Admin as Deployment,
      [deployment_Miroir.uuid]: deployment_Miroir as Deployment,
    }
    
    // open all configured stores
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
        defaultMetaModelEnvironment
      );
    }
  }

  

  const createMiroirDeploymentCompositeAction = createDeploymentCompositeAction(
    "miroir",
    miroirDeploymentUuid,
    miroirSelfApplicationUuid,
    adminDeployment,
    miroirDeploymentStorageConfiguration,
  );
  const domainController =
    miroirConfig.client.emulateServer && domainControllerForServer
      ? domainControllerForServer
      : domainControllerForClient;
  const createDeploymentResult = await domainController.handleCompositeAction(
    createMiroirDeploymentCompositeAction,
    applicationDeploymentMap,
    defaultMiroirModelEnvironment,
    {},
  );
  if (createDeploymentResult.status !== "ok") {
    throw new Error("Failed to create Miroir deployment: " + JSON.stringify(createDeploymentResult));
  }
  return { domainController: domainControllerForClient, 
    // persistenceStoreControllerManagerForClient
   };
}
