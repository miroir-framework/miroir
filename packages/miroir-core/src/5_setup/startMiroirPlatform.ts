import type { DomainControllerInterface } from "../0_interfaces/2_domain/DomainControllerInterface";
import type { ExternalServiceClientInterface } from "../0_interfaces/4-services/ExternalServiceClientInterface";
import type { LocalCacheModule } from "../0_interfaces/4-services/LocalCacheModule";
import type { LoggerFactoryInterface, LoggerOptions } from "../0_interfaces/4-services/LoggerInterface";
import type { RestClientInterface } from "../0_interfaces/4-services/PersistenceInterface";
import type {
  MiroirConfigClient,
  MiroirConfigServer,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { ConfigurationService, type StoreSectionStartup } from "../3_controllers/ConfigurationService";
import { MiroirActivityTracker } from "../3_controllers/MiroirActivityTracker";
import { MiroirContext } from "../3_controllers/MiroirContext";
import { MiroirEventService } from "../3_controllers/MiroirEventService";
import { miroirCoreStartup } from "../startup";
import { MiroirLoggerFactory } from "../4_services/MiroirLoggerFactory";
import { PersistenceStoreControllerManager } from "../4_services/PersistenceStoreControllerManager";
import { RestClient } from "../4_services/RestClient";
import { RestClientStub } from "../4_services/RestClientStub";

// ################################################################################################
// #639: one startup call per side. `startMiroirPlatformWith` is the wiring every host used to copy:
// core startup, stores, context, REST client, store managers and domain controllers, and the
// emulated server behind a `RestClientStub`. `startMiroirNodeWith` (here) and `startMiroirClient`
// (miroir-react) add their side's defaults. Neither imports a store package: the host passes them.
// #656: nor a local cache package: the host passes the `LocalCacheModule` it starts on
// (`@miroir-framework/server/startup` and `@miroir-framework/react` load it from a `localCache` option).
// ################################################################################################

/**
 * The emulated server of a client configuration with `emulateServer: true`.
 * @public
 */
export type MiroirEmulatedServer = {
  /** `local` domain controller on the emulated server's stores; not gated (#263). */
  domainController: DomainControllerInterface;
  persistenceStoreControllerManager: PersistenceStoreControllerManager;
  /** The emulated server's entry point, where a host puts its authentication gate. */
  restClientStub: RestClientStub;
};

/**
 * What the startup calls build. Each field means the same thing whatever the configuration.
 * @public
 */
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

/**
 * The options of the startup calls: the stores, and what a host provides instead of the defaults.
 * @public
 */
export type MiroirPlatformOptions = {
  /** Store startups, run on `ConfigurationService.configurationService` after `miroirCoreStartup()`. */
  stores: StoreSectionStartup[];
  activityTracker?: MiroirActivityTracker;
  eventService?: MiroirEventService;
  /** Client configuration: a client to use instead of building one (Electron renderer). No emulated server then. */
  restClient?: RestClientInterface;
  /** Client configuration with a real server: the fetch of `RestClient`. Defaults to the bound global fetch. */
  fetch?: typeof globalThis.fetch;
  /**
   * Passed to every domain controller built (#339): with an emulated server, both the remote one and
   * the emulated server's. A client bound to one controller (the server's rotated secrets) belongs
   * to a server configuration.
   */
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
  localCacheModule: LocalCacheModule,
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

  const domainController = localCacheModule.setupMiroirDomainController(
    miroirContext,
    {
      persistenceStoreAccessMode: "remote",
      localPersistenceStoreControllerManager: newPersistenceStoreControllerManager(),
      remotePersistenceStoreRestClient: new localCacheModule.RestPersistenceClientAndRestClient(rootApiUrl, restClient),
    },
    options.externalServiceClient,
  );
  if (!restClientStub || !client.emulateServer) {
    return { miroirContext, domainController, restClient };
  }

  const persistenceStoreControllerManager = newPersistenceStoreControllerManager(
    client.filesystemDeploymentRootDirectory,
  );
  const serverDomainController = localCacheModule.setupMiroirDomainController(
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
 * Builds the Miroir platform of a process from its configuration, on the given local cache: a
 * `local` domain controller for a server configuration; a `remote` one for a client configuration,
 * with its emulated server when `emulateServer` is on. It runs `miroirCoreStartup()` and the given
 * store startups first. It reads no environment variable and imports no store or local cache package.
 * @public
 */
export async function startMiroirPlatformWith(
  localCacheModule: LocalCacheModule,
  miroirConfig: MiroirConfigClient | MiroirConfigServer,
  options: MiroirPlatformOptions,
): Promise<MiroirPlatform> {
  return buildPlatform(localCacheModule, miroirConfig, options, async () => undefined);
}

async function buildPlatform(
  localCacheModule: LocalCacheModule,
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
    return startClient(localCacheModule, miroirConfig, miroirContext, options);
  }
  const persistenceStoreControllerManager = newPersistenceStoreControllerManager(
    miroirConfig.server.filesystemDeploymentRootDirectory,
  );
  const domainController = localCacheModule.setupMiroirDomainController(
    miroirContext,
    { persistenceStoreAccessMode: "local", localPersistenceStoreControllerManager: persistenceStoreControllerManager },
    options.externalServiceClient,
  );
  return { miroirContext, domainController, persistenceStoreControllerManager };
}

/**
 * The options of the Node startup: the platform options and the host's loggers.
 * @public
 */
export type MiroirNodeOptions = MiroirPlatformOptions & {
  /** Starts the registered loggers after the stores, before the platform is built (awaited). */
  loggers?: { factory: LoggerFactoryInterface; options: LoggerOptions };
};

/**
 * The startup of a Node host (CLI, server, Electron main process, test platforms) on the given
 * local cache: see {@link startMiroirPlatformWith}. With `loggers`, it also starts the registered
 * loggers, after the stores and before the platform, the order of the CLI and the server.
 * @public
 */
export async function startMiroirNodeWith(
  localCacheModule: LocalCacheModule,
  miroirConfig: MiroirConfigClient | MiroirConfigServer,
  options: MiroirNodeOptions,
): Promise<MiroirPlatform> {
  const { loggers, ...platformOptions } = options;
  return buildPlatform(localCacheModule, miroirConfig, platformOptions, async (activityTracker, eventService) => {
    if (loggers) {
      await MiroirLoggerFactory.startRegisteredLoggers(activityTracker, eventService, loggers.factory, loggers.options);
    }
  });
}
