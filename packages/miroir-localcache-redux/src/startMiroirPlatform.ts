import {
  ConfigurationService,
  MiroirActivityTracker,
  MiroirContext,
  miroirCoreStartup,
  MiroirEventService,
  MiroirLoggerFactory,
  PersistenceStoreControllerManager,
  RestClient,
  RestClientStub,
  type DomainControllerInterface,
  type ExternalServiceClientInterface,
  type LoggerFactoryInterface,
  type LoggerOptions,
  type MiroirConfigClient,
  type MiroirConfigServer,
  type RestClientInterface,
  type StoreSectionStartup,
} from "miroir-core";
import { RestPersistenceClientAndRestClient } from "./4_services/persistence/RestPersistenceClientAndRestClient.js";
import { setupMiroirDomainController } from "./sagaTools.js";

// ################################################################################################
// #639: one startup call per side. `startMiroirPlatform` is the wiring every host used to copy:
// core startup, stores, context, REST client, store managers and domain controllers, and the
// emulated server behind a `RestClientStub`. `startMiroirNode` (here) and `startMiroirClient`
// (miroir-react) add their side's defaults. Neither imports a store package: the host passes them.
// ################################################################################################

/** The emulated server of a client configuration with `emulateServer: true`. */
export type MiroirEmulatedServer = {
  /** `local` domain controller on the emulated server's stores; not gated (#263). */
  domainController: DomainControllerInterface;
  persistenceStoreControllerManager: PersistenceStoreControllerManager;
  /** The emulated server's entry point, where a host puts its authentication gate. */
  restClientStub: RestClientStub;
};

/** What `startMiroirPlatform` builds. Each field means the same thing whatever the configuration. */
export type MiroirPlatform = {
  miroirContext: MiroirContext;
  /** `local` for a server configuration, `remote` for a client configuration. */
  domainController: DomainControllerInterface;
  /** Server configuration only: the manager of the local domain controller. */
  persistenceStoreControllerManager?: PersistenceStoreControllerManager;
  /** Client configuration only: the client of the remote domain controller. */
  restClient?: RestClientInterface;
  /** Client configuration with `emulateServer: true` and no `restClient` option. */
  emulatedServer?: MiroirEmulatedServer;
};

export type MiroirPlatformOptions = {
  /** Store startups, run on `ConfigurationService.configurationService` after `miroirCoreStartup()`. */
  stores: StoreSectionStartup[];
  activityTracker?: MiroirActivityTracker;
  eventService?: MiroirEventService;
  /** Client configuration: a client to use instead of building one (Electron renderer). No emulated server then. */
  restClient?: RestClientInterface;
  /** Client configuration with a real server: the fetch of `RestClient`. Defaults to the bound global fetch. */
  fetch?: typeof globalThis.fetch;
  /** Passed to every domain controller built (#339). */
  externalServiceClient?: ExternalServiceClientInterface;
  /** Runs once the emulated server is wired to its stub, before anything else uses it. */
  configureEmulatedServer?: (emulatedServer: MiroirEmulatedServer) => void | Promise<void>;
};

function newPersistenceStoreControllerManager(rootDirectory?: string): PersistenceStoreControllerManager {
  return new PersistenceStoreControllerManager(
    ConfigurationService.configurationService.adminStoreFactoryRegister,
    ConfigurationService.configurationService.StoreSectionFactoryRegister,
    rootDirectory,
  );
}

async function startClient(
  miroirConfig: MiroirConfigClient,
  miroirContext: MiroirContext,
  options: MiroirPlatformOptions,
): Promise<MiroirPlatform> {
  const client = miroirConfig.client;
  const rootApiUrl = client.emulateServer ? client.rootApiUrl : client.serverConfig.rootApiUrl;
  const emulate = client.emulateServer && !options.restClient;
  const restClientStub = emulate ? new RestClientStub(client.rootApiUrl) : undefined;
  const restClient: RestClientInterface =
    options.restClient ?? restClientStub ?? new RestClient(options.fetch ?? globalThis.fetch.bind(globalThis));

  const domainController = await setupMiroirDomainController(
    miroirContext,
    {
      persistenceStoreAccessMode: "remote",
      localPersistenceStoreControllerManager: newPersistenceStoreControllerManager(),
      remotePersistenceStoreRestClient: new RestPersistenceClientAndRestClient(rootApiUrl, restClient),
    },
    options.externalServiceClient,
  );
  if (!restClientStub || !client.emulateServer) {
    return { miroirContext, domainController, restClient };
  }

  const persistenceStoreControllerManager = newPersistenceStoreControllerManager(
    client.filesystemDeploymentRootDirectory,
  );
  const serverDomainController = await setupMiroirDomainController(
    miroirContext,
    { persistenceStoreAccessMode: "local", localPersistenceStoreControllerManager: persistenceStoreControllerManager },
    options.externalServiceClient,
  );
  restClientStub.setServerDomainController(serverDomainController);
  restClientStub.setPersistenceStoreControllerManager(persistenceStoreControllerManager);
  const emulatedServer: MiroirEmulatedServer = {
    domainController: serverDomainController,
    persistenceStoreControllerManager,
    restClientStub,
  };
  await options.configureEmulatedServer?.(emulatedServer);
  return { miroirContext, domainController, restClient, emulatedServer };
}

/**
 * Builds the Miroir platform of a process from its configuration: a `local` domain controller for
 * a server configuration; a `remote` one for a client configuration, with its emulated server when
 * `emulateServer` is on. It runs `miroirCoreStartup()` and the given store startups first.
 * It reads no `process.env` and imports no store package.
 */
export async function startMiroirPlatform(
  miroirConfig: MiroirConfigClient | MiroirConfigServer,
  options: MiroirPlatformOptions,
): Promise<MiroirPlatform> {
  return buildPlatform(miroirConfig, options, async () => undefined);
}

async function buildPlatform(
  miroirConfig: MiroirConfigClient | MiroirConfigServer,
  options: MiroirPlatformOptions,
  afterStores: (activityTracker: MiroirActivityTracker, eventService: MiroirEventService) => Promise<void>,
): Promise<MiroirPlatform> {
  miroirCoreStartup();
  for (const storeSectionStartup of options.stores) {
    storeSectionStartup(ConfigurationService.configurationService);
  }
  const activityTracker = options.activityTracker ?? new MiroirActivityTracker();
  const eventService = options.eventService ?? new MiroirEventService(activityTracker);
  await afterStores(activityTracker, eventService);
  const miroirContext = new MiroirContext(activityTracker, eventService, miroirConfig);

  if (miroirConfig.miroirConfigType === "client") {
    return startClient(miroirConfig, miroirContext, options);
  }
  const persistenceStoreControllerManager = newPersistenceStoreControllerManager(
    miroirConfig.server.filesystemDeploymentRootDirectory,
  );
  const domainController = await setupMiroirDomainController(
    miroirContext,
    { persistenceStoreAccessMode: "local", localPersistenceStoreControllerManager: persistenceStoreControllerManager },
    options.externalServiceClient,
  );
  return { miroirContext, domainController, persistenceStoreControllerManager };
}

export type MiroirNodeOptions = MiroirPlatformOptions & {
  /** Starts the registered loggers after the stores, before the platform is built (awaited). */
  loggers?: { factory: LoggerFactoryInterface; options: LoggerOptions };
};

/**
 * The startup call of a Node host (CLI, server, Electron main process, test platforms): see
 * {@link startMiroirPlatform}. With `loggers`, it also starts the registered loggers, after the
 * stores and before the platform, the order of the CLI and the server.
 */
export async function startMiroirNode(
  miroirConfig: MiroirConfigClient | MiroirConfigServer,
  options: MiroirNodeOptions,
): Promise<MiroirPlatform> {
  const { loggers, ...platformOptions } = options;
  return buildPlatform(miroirConfig, platformOptions, async (activityTracker, eventService) => {
    if (loggers) {
      await MiroirLoggerFactory.startRegisteredLoggers(activityTracker, eventService, loggers.factory, loggers.options);
    }
  });
}
