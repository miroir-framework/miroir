import {
  MiroirActivityTracker,
  MiroirEventService,
  type DomainControllerInterface,
  type LocalCacheInterface,
  type MiroirConfigClient,
} from "miroir-core";
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

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "setupMiroirTest");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName).then((logger: LoggerInterface) => {log = logger});


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
  if (process.env.MIROIR_TEST_VERBOSE === "1") {
    log.debug("setupMiroirTest miroirConfig", JSON.stringify(miroirConfig, null, 2));
  }
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
  }

  const domainControllerForClient = await setupMiroirDomainController(
    miroirContext, 
    {
      persistenceStoreAccessMode: "remote",
      localPersistenceStoreControllerManager:
        persistenceStoreControllerManagerForServer ?? persistenceStoreControllerManagerForClient,
      remotePersistenceStoreRestClient,
    }
  ); // even when emulating server, we use remote persistence store, since MSW makes it appear as if we are using a remote server.

  const localCache = domainControllerForClient.getLocalCache();

  if (miroirConfig.client.emulateServer) {
    const domainControllerForServer = await setupMiroirDomainController(
      miroirContext, 
      {
        persistenceStoreAccessMode: "local",
        localPersistenceStoreControllerManager: persistenceStoreControllerManagerForServer!,
      }
    ); // even when emulating server, we use remote persistence store, since MSW makes it appear as if we are using a remote server.

    (client as RestClientStub).setServerDomainController(domainControllerForServer);
    (client as RestClientStub).setPersistenceStoreControllerManager(persistenceStoreControllerManagerForServer!);
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
