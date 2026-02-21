import {
  ConfigurationService,
  LoggerInterface,
  MiroirActivityTracker,
  MiroirConfigClient,
  MiroirContext,
  MiroirEventService,
  MiroirLoggerFactory,
  PersistenceStoreControllerManager,
  RestClient,
  RestClientInterface,
  RestClientStub,
  RestPersistenceClientAndRestClientInterface,
} from "miroir-core";
import {
  RestPersistenceClientAndRestClient,
  setupMiroirDomainController
} from "miroir-localcache-redux";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName("miroir-cli", "5", "setup")
).then((logger: LoggerInterface) => {log = logger});

// ################################################################################################
/**
 * Setup Miroir platform for CLI usage
 * @param miroirConfig - CLI configuration
 * @returns Platform components including domainController and localCache
 */
export async function setupMiroirPlatform(
  miroirConfig: MiroirConfigClient,
  miroirActivityTracker?: MiroirActivityTracker,
  miroirEventService?: MiroirEventService,
  customfetch?: any,
) {
  const localMiroirActivityTracker = miroirActivityTracker ?? new MiroirActivityTracker();
  const localMiroirEventService = miroirEventService ?? new MiroirEventService(localMiroirActivityTracker);
  const miroirContext = new MiroirContext(
    localMiroirActivityTracker,
    localMiroirEventService,
    miroirConfig
  );
  console.log("setupMiroirPlatform miroirConfig", JSON.stringify(miroirConfig, null, 2));
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
    throw new Error("miroir-cli setupMiroirPlatform could not create client");
  }
  if (!remotePersistenceStoreRestClient) {
    throw new Error("miroir-cli setupMiroirPlatform could not create remotePersistenceStoreRestClient");
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
  );

  let persistenceStoreControllerManagerForServer: PersistenceStoreControllerManager | undefined = undefined;
  if (miroirConfig.client.emulateServer) {
    persistenceStoreControllerManagerForServer = new PersistenceStoreControllerManager(
      configurationService.adminStoreFactoryRegister,
      configurationService.StoreSectionFactoryRegister
    );

    const domainControllerForServer = await setupMiroirDomainController(
      miroirContext, 
      {
        persistenceStoreAccessMode: "local",
        localPersistenceStoreControllerManager: persistenceStoreControllerManagerForServer,
      }
    );

    (client as RestClientStub).setServerDomainController(domainControllerForServer);
    (client as RestClientStub).setPersistenceStoreControllerManager(persistenceStoreControllerManagerForServer);
  }

  return {
    persistenceStoreControllerManagerForClient: persistenceStoreControllerManagerForClient,
    persistenceStoreControllerManagerForServer: persistenceStoreControllerManagerForServer,
    domainController: domainControllerForClient,
    localCache: domainControllerForClient.getLocalCache(),
    miroirContext,
  };
}
