import {
  createFakeOutboundHttp,
  registerLazyActionImplementations,
  VERSIONING_ACTION_IMPLEMENTATION_NAMES,
  VERSIONING_PACKAGE_NAME,
  type LazyActionImplementationModule,
  defaultExternalServiceClient,
  fetchProcessCapabilities,
  MiroirActivityTracker,
  MiroirEventService,
  resolveProcessCapabilitiesUrl,
  type DomainControllerInterface,
  type ExternalServiceEnvironment,
  type FakeOutboundHttp,
  type LocalCacheInterface,
  type MiroirConfigClient,
} from "@miroir-framework/core";
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
} from "@miroir-framework/core";

import { loadLocalCacheImplementation } from "./localCacheImplementation";
import { packageName } from "../constants";
import { cleanLevel } from "../4_view/constants";

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "setupMiroirTest");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName).then((logger: LoggerInterface) => {log = logger});


/** What a test changes in the setup of its session. */
export type SetupMiroirTestOptions = {
  /**
   * #696: how the emulated server loads `@miroir-framework/versioning`: its own dynamic import when absent,
   * a loader of the test (to count its calls), or `false` to register nothing.
   */
  versioningLoader?: (() => Promise<LazyActionImplementationModule>) | false;
};

// ################################################################################################
/**
 * @param miroirConfig
 * @param externalServiceEnvironment what the session's external service environment changes from
 * the default one (#339), e.g. the insecure base URLs of a fake external service server
 * @returns the session's DomainControllers, and the fetch of their external service environment
 */
export async function setupMiroirTest(
  miroirConfig: MiroirConfigClient,
  miroirActivityTracker?: MiroirActivityTracker,
  miroirEventService?: MiroirEventService,
  customfetch?: any,
  externalServiceEnvironment: Partial<ExternalServiceEnvironment> = {},
  options: SetupMiroirTestOptions = {},
): Promise<{
  domainControllerForClient: DomainControllerInterface;
  domainControllerForServer?: DomainControllerInterface | undefined;
  persistenceStoreControllerManagerForClient: PersistenceStoreControllerManager;
  persistenceStoreControllerManagerForServer?: PersistenceStoreControllerManager | undefined;
  localCache: LocalCacheInterface;
  fakeOutboundHttp: FakeOutboundHttp;
}> {
  // the client and the emulated server share one external service environment, as they share a process
  const fakeOutboundHttp = createFakeOutboundHttp(
    externalServiceEnvironment.fetch ?? ((input, init) => globalThis.fetch(input, init)),
  );
  const externalServiceClient = defaultExternalServiceClient({
    ...externalServiceEnvironment,
    fetch: fakeOutboundHttp.fetch,
  });
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
  // #446: redux, or the implementation MIROIR_TEST_LOCAL_CACHE names
  const { RestPersistenceClientAndRestClient, setupMiroirDomainController } =
    await loadLocalCacheImplementation();
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
    },
    externalServiceClient,
  ); // even when emulating server, we use remote persistence store, since MSW makes it appear as if we are using a remote server.

  const localCache = domainControllerForClient.getLocalCache();

  if (miroirConfig.client.emulateServer) {
    const domainControllerForServer = await setupMiroirDomainController(
      miroirContext, 
      {
        persistenceStoreAccessMode: "local",
        localPersistenceStoreControllerManager: persistenceStoreControllerManagerForServer!,
      },
      externalServiceClient,
    ); // even when emulating server, we use remote persistence store, since MSW makes it appear as if we are using a remote server.

    // #696: the emulated server holds the stores, so it runs the versioning actions
    if (options.versioningLoader !== false) {
      registerLazyActionImplementations({
        capability: "versioning",
        packageName: VERSIONING_PACKAGE_NAME,
        implementationNames: VERSIONING_ACTION_IMPLEMENTATION_NAMES,
        load: options.versioningLoader ?? (() => import("@miroir-framework/versioning")),
      });
    }
    (client as RestClientStub).setServerDomainController(domainControllerForServer);
    (client as RestClientStub).setPersistenceStoreControllerManager(persistenceStoreControllerManagerForServer!);
    return {
      domainControllerForServer,
      domainControllerForClient,
      persistenceStoreControllerManagerForClient,
      persistenceStoreControllerManagerForServer,
      localCache,
      fakeOutboundHttp,
    };
  }
  // Isolated UI / vitest real-server sessions create a new remote DomainController.
  // Without the server snapshot, creatableStoreTypes is the browser factory list
  // (indexedDb) and createStore sql fails with FeatureUnavailable availableStoreTypes.
  const processCapabilities = await fetchProcessCapabilities(
    client,
    resolveProcessCapabilitiesUrl(miroirConfig.client.serverConfig?.rootApiUrl),
  );
  domainControllerForClient.setProcessCapabilities(processCapabilities);
  return {
    domainControllerForClient,
    domainControllerForServer: undefined,
    persistenceStoreControllerManagerForClient,
    persistenceStoreControllerManagerForServer: undefined,
    localCache,
    fakeOutboundHttp,
  };
}
