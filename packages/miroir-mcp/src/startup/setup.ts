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
  RestPersistenceClientAndRestClientInterface
} from "miroir-core";
import {
  RestPersistenceClientAndRestClient,
  setupMiroirDomainController
} from "miroir-localcache-redux";
// import type { LoggerInterface, MiroirConfigClient, RestClientInterface, RestPersistenceClientAndRestClientInterface } from 'miroir-core';
// import { ConfigurationService } from '../../../miroir-core/src/3_controllers/ConfigurationService.js';
// import { MiroirActivityTracker } from '../../../miroir-core/src/3_controllers/MiroirActivityTracker.js';
// import { MiroirContext } from '../../../miroir-core/src/3_controllers/MiroirContext.js';
// import { MiroirEventService } from '../../../miroir-core/src/3_controllers/MiroirEventService.js';
// import { MiroirLoggerFactory } from '../../../miroir-core/src/4_services/MiroirLoggerFactory.js';
// import { PersistenceStoreControllerManager } from '../../../miroir-core/src/4_services/PersistenceStoreControllerManager.js';
// import RestClient from '../../../miroir-core/src/4_services/RestClient.js';
// import RestClientStub from '../../../miroir-core/src/4_services/RestClientStub.js';
// import { packageName } from "../../../miroir-core/src/constants.js";
// import { cleanLevel } from "../../../miroir-core/src/5_setup/constants.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName("miroir-mcp", "5", "setup")
).then((logger: LoggerInterface) => {log = logger});
// ################################################################################################
/**
 * @param miroirConfig 
 * @returns 
 */
export async function setupMiroirPlatform(
  miroirConfig: MiroirConfigClient,
  miroirActivityTracker?: MiroirActivityTracker,
  miroirEventService?: MiroirEventService,
  customfetch?: any,
) {
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
    client = new RestClientStub(
      miroirConfig.client.rootApiUrl,
    );
    remotePersistenceStoreRestClient = new RestPersistenceClientAndRestClient(
      miroirConfig.client.rootApiUrl,
      client
    );

  } else {
    client = new RestClient(customfetch??fetch);
    remotePersistenceStoreRestClient = new RestPersistenceClientAndRestClient(
      miroirConfig.client.serverConfig.rootApiUrl,
      client
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
    persistenceStoreControllerManagerForServer = new PersistenceStoreControllerManager(
      ConfigurationService.configurationService.adminStoreFactoryRegister,
      ConfigurationService.configurationService.StoreSectionFactoryRegister
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
  }

  return {
    persistenceStoreControllerManagerForClient: persistenceStoreControllerManagerForClient,
    persistenceStoreControllerManagerForServer: persistenceStoreControllerManagerForServer,
    domainController: domainControllerForClient,
    localCache: domainControllerForClient.getLocalCache(),
    miroirContext,
  };
}
