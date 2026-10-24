import "./chunkLoadTrace.js";

declare global {
  interface Window {
    process?: any;
  }
}

import { createTheme, StyledEngineProvider, ThemeProvider, type ThemeOptions } from "@mui/material";
import "material-symbols/outlined.css";
import React, { StrictMode } from "react";
import { createRoot, Root } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import {
  accessGrantsFromInstances,
  Action2Error,
  circularReplacer,
  ConfigurationService,
  defaultMetaModelEnvironment,
  defaultSelfApplicationDeploymentMap,
  deploymentsFromInstances,
  ELECTRON_LOOPBACK_ROOT_API_URL,
  expect,
  fetchProcessCapabilities,
  getClientEnvironment,
  getMiroirEnvironmentMode,
  getProcessCapabilities,
  identityDirectoryFromInstances,
  LoggerInterface,
  MiroirActivityTracker,
  MiroirConfigClient,
  MiroirContext,
  miroirCoreStartup,
  MiroirEventService,
  MiroirLoggerFactory,
  PersistenceStoreControllerManager,
  RestClient,
  RestClientStub,
  setRestClientAuthorizationInvalidationHandler,
  setRestClientAuthorizationTokenGetter,
  SpecificLoggerOptionsMap,
  templateEvaluationParams,
  type ApplicationDeploymentMap,
  type Deployment,
  type DomainControllerInterface,
  type RestClientInterface,
  type RestPersistenceClientAndRestClientInterface,
  type StoreOrBundleAction,
  type StoreUnitConfiguration,
} from "miroir-core";
import {
  LocalCacheProvider,
  MiroirContextReactProvider,
  RestPersistenceClientAndRestClient,
  setupMiroirDomainController,
} from "miroir-react";
import { miroirIndexedDbStoreSectionStartup } from "miroir-store-indexedDb";

import { loglevelnext } from "./loglevelnextImporter.js";
import { getAuthToken, setAuthenticationEnabled, setAuthToken } from "./miroir-fwk/4_view/auth/authSession.js";
import { fetchAuthenticationEnabled } from "./miroir-fwk/4_view/auth/authTransport.js";
import { RootComponent } from "./miroir-fwk/4_view/components/Page/RootComponent.js";
import { ErrorPage } from "./miroir-fwk/4_view/ErrorPage.js";
import { PageDispatcher } from "./miroir-fwk/4_view/PageDispatcher.js";
import {
  ElectronRestClient,
  ElectronServerDomainControllerProxy,
} from "./miroir-fwk/4_view/services/ElectronIpcProxy.js";
import { initializePerformanceConfig } from "./miroir-fwk/4_view/tools/performanceConfig.js";
import {
  failedSelfTestResult,
  publishSelfTestResult,
  shouldStartSelfTest,
} from "./miroir-fwk/4-tests/selfTest/selfTestResult.js";
import { miroirAppStartup } from "./startup.js";

import { resolveWebLogConfigWithMeta, VITE_MIROIR_LOG_CONFIG_VALUES } from "./config/logConfigPresets.js";
import { packageName } from "./constants.js";
import { cleanLevel } from "./miroir-fwk/4_view/constants.js";

import {
  adminSelfApplication,
  deployment_Admin,
  deployment_Miroir,
  entityDeployment,
  miroirRight_AliceLibraryAppAdmin,
  miroirRight_AliceLibraryDeploymentRead,
  miroirRight_DaveLibraryDeployment,
  miroirUser_AliceAdmin,
  miroirUser_BobInactive,
  miroirUser_Carol,
  miroirUser_Dave,
  miroirUserCredential_AliceDev,
  miroirUserCredential_CarolDev,
  miroirUserCredential_DaveDev
} from "miroir-app-admin";

const specificLoggerOptions: SpecificLoggerOptionsMap = {
  // "5_miroir-core_DomainController": {level:defaultLevels.INFO, template:"[{{time}}] {{level}} ({{name}}) BBBBB-"},
  // "5_miroir-core_DomainController": {level:defaultLevels.TRACE},
  // "4_miroir-redux_LocalCacheSlice": {level:defaultLevels.INFO, template:"[{{time}}] {{level}} ({{name}}) CCCCC-"},
  // "4_miroir-redux_LocalCacheSlice": {level:undefined, template:undefined}
  // "4_miroir-redux_LocalCacheSlice": {template:"[{{time}}] {{level}} ({{name}}) -"},
};

// MiroirLoggerFactory.setEffectiveLoggerFactoryWithLogLevelNext(
//   loglevelnext,
//   defaultLevels.INFO,
//   "[{{time}}] {{level}} ({{name}})# ",
//   specificLoggerOptions
// );

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "index.tsx");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName,
  "UI",
).then((logger: LoggerInterface) => {
  log = logger;
});

export const isElectron =
  typeof window !== "undefined" &&
  typeof window.process === "object" &&
  window.process.versions?.electron;

// #321: the client configuration of the selected environment (MIROIR_ENV, then
// environments/local.json, then dev), injected by vite.config.js (vite/environmentConfig.js).
declare const __MIROIR_CLIENT_CONFIG__: MiroirConfigClient;
const webMiroirConfig: MiroirConfigClient | undefined =
  typeof __MIROIR_CLIENT_CONFIG__ === "undefined" ? undefined : __MIROIR_CLIENT_CONFIG__;

log.info("web client environment:", webMiroirConfig?.environment?.name, "configuration", webMiroirConfig);

/** #487: whether page load runs the self-test; undefined until the client configuration is known. */
let selfTestRequested: boolean | undefined;

const miroirActivityTracker = new MiroirActivityTracker();
const miroirEventService = new MiroirEventService(miroirActivityTracker);

const logConfigResolution = resolveWebLogConfigWithMeta();
log.info("[miroir] log config", {
  preset: logConfigResolution.presetName,
  rawSelection: logConfigResolution.rawSelection,
  usedFallback: logConfigResolution.usedFallback,
  defaultLevel: logConfigResolution.loggerOptions.defaultLevel,
  specificLoggerOptions: logConfigResolution.loggerOptions.specificLoggerOptions,
  VITE_MIROIR_LOG_CONFIG: logConfigResolution.rawSelection,
  VITE_MIROIR_LOG_CONFIG_VALUES,
});

MiroirLoggerFactory.startRegisteredLoggers(
  miroirActivityTracker,
  miroirEventService,
  loglevelnext,
  logConfigResolution.loggerOptions,
);
log.info("started registered loggers DONE");

const container = document.getElementById("root");

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootComponent></RootComponent>,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <PageDispatcher /> },
      { path: "*", element: <PageDispatcher /> },
    ],
  },
]);

export const themeParams: ThemeOptions = {
  spacing: 0,
  components: {
    MuiList: {
      defaultProps: {
        style: { border: `0` },
      },
    },
    MuiDialog: {
      defaultProps: {
        style: { display: "inline-flex", justifyContent: "center", alignItems: "center" },
      },
    },
    MuiDialogTitle: {
      defaultProps: {
        style: { display: "flex" },
      },
    },
  },
};

// ################################################################################################
// ################################################################################################
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
  options?: { customRestClient?: RestClientInterface },
) {
  ConfigurationService.configurationService.registerTestImplementation({ expect: expect as any });

  const localMiroirActivityTracker = miroirActivityTracker ?? new MiroirActivityTracker();
  const localMiroirEventService =
    miroirEventService ?? new MiroirEventService(localMiroirActivityTracker);
  const miroirContext = new MiroirContext(
    localMiroirActivityTracker,
    localMiroirEventService,
    miroirConfig,
  );
  log.debug("setupMiroirPlatform miroirConfig", JSON.stringify(miroirConfig, null, 2));
  log.debug(
    "setupMiroirPlatform import.meta.env",
    JSON.stringify((import.meta as any).env, null, 2),
  );
  log.debug("setupMiroirPlatform getMiroirEnvironmentMode", getMiroirEnvironmentMode());
  log.debug(
    "setupMiroirPlatform templateEvaluationParams",
    JSON.stringify(templateEvaluationParams, null, 2),
  );

  let restClient: RestClientInterface | undefined = undefined;
  let persistenceStoreRestClient: RestPersistenceClientAndRestClientInterface | undefined =
    undefined;

  if (options?.customRestClient) {
    // Electron IPC mode: the renderer uses a proxy client that forwards calls to the main process.
    // No server-side setup is needed on the renderer side.
    restClient = options.customRestClient;
    persistenceStoreRestClient = new RestPersistenceClientAndRestClient(
      miroirConfig.client.emulateServer
        ? miroirConfig.client.rootApiUrl
        : miroirConfig.client.serverConfig.rootApiUrl,
      restClient,
    );
  } else if (miroirConfig.client.emulateServer) {
    restClient = new RestClientStub(miroirConfig.client.rootApiUrl);
    persistenceStoreRestClient = new RestPersistenceClientAndRestClient(
      miroirConfig.client.rootApiUrl,
      restClient,
    );
  } else {
    restClient = new RestClient(customfetch ?? window.fetch.bind(window));
    persistenceStoreRestClient = new RestPersistenceClientAndRestClient(
      miroirConfig.client.serverConfig.rootApiUrl,
      restClient,
    );
  }

  if (!restClient) {
    throw new Error("miroir-cli setupMiroirPlatform could not create client");
  }
  if (!persistenceStoreRestClient) {
    throw new Error(
      "miroir-cli setupMiroirPlatform could not create remotePersistenceStoreRestClient",
    );
  }

  const persistenceStoreControllerManagerForClient = new PersistenceStoreControllerManager(
    ConfigurationService.configurationService.adminStoreFactoryRegister,
    ConfigurationService.configurationService.StoreSectionFactoryRegister,
  );

  const domainControllerForClient = await setupMiroirDomainController(miroirContext, {
    persistenceStoreAccessMode: "remote",
    localPersistenceStoreControllerManager: persistenceStoreControllerManagerForClient,
    remotePersistenceStoreRestClient: persistenceStoreRestClient,
  });

  let persistenceStoreControllerManagerForServer: PersistenceStoreControllerManager | undefined =
    undefined;
  let domainControllerForServer: DomainControllerInterface | undefined = undefined;
  if (miroirConfig.client.emulateServer && !options?.customRestClient) {
    persistenceStoreControllerManagerForServer = new PersistenceStoreControllerManager(
      ConfigurationService.configurationService.adminStoreFactoryRegister,
      ConfigurationService.configurationService.StoreSectionFactoryRegister,
      miroirConfig.client.filesystemDeploymentRootDirectory,
    );

    domainControllerForServer = await setupMiroirDomainController(miroirContext, {
      persistenceStoreAccessMode: "local",
      localPersistenceStoreControllerManager: persistenceStoreControllerManagerForServer,
    });

    (restClient as RestClientStub).setServerDomainController(domainControllerForServer);
    (restClient as RestClientStub).setPersistenceStoreControllerManager(
      persistenceStoreControllerManagerForServer,
    );
    (restClient as RestClientStub).setIdentityDirectory(
      identityDirectoryFromInstances(
        [miroirUser_AliceAdmin, miroirUser_BobInactive, miroirUser_Carol, miroirUser_Dave],
        [miroirUserCredential_AliceDev, miroirUserCredential_CarolDev, miroirUserCredential_DaveDev],
      ),
    );
    (restClient as RestClientStub).setAccessDirectory({
      grants: accessGrantsFromInstances([
        miroirRight_AliceLibraryAppAdmin,
        miroirRight_AliceLibraryDeploymentRead,
        miroirRight_DaveLibraryDeployment,
      ]),
      deployments: deploymentsFromInstances([
        deployment_Admin,
        deployment_Miroir,
        // deployment_Library,
        // deployment_Spotify,
        // deployment_Designer,
      ]),
    });
    (restClient as RestClientStub).setProcessCapabilities(
      getProcessCapabilities({
        config: miroirConfig,
        environment: getClientEnvironment(),
        storeSectionFactoryRegister:
          ConfigurationService.configurationService.StoreSectionFactoryRegister,
        adminStoreFactoryRegister:
          ConfigurationService.configurationService.adminStoreFactoryRegister,
      }),
    );
  }

  const processCapabilities = await fetchProcessCapabilities(restClient);
  domainControllerForClient.setProcessCapabilities(processCapabilities);
  domainControllerForServer?.setProcessCapabilities(processCapabilities);

  return {
    // persistenceStoreControllerManagerForClient: persistenceStoreControllerManagerForClient,
    // persistenceStoreControllerManagerForServer: persistenceStoreControllerManagerForServer,
    domainControllerForClient,
    domainControllerForServer,
    // localCache: domainControllerForClient.getLocalCache(),
    miroirContext,
    restClient,
    processCapabilities,
  };
}

// ################################################################################################
// ################################################################################################
async function setupClient(
  currentMiroirConfig: MiroirConfigClient,
  miroirActivityTracker: MiroirActivityTracker,
  miroirEventService: MiroirEventService,
  options?: { customRestClient?: RestClientInterface },
) {
  ConfigurationService.configurationService.registerTestImplementation({ expect: expect as any });

  const {
    // persistenceStoreControllerManagerForClient,
    // persistenceStoreControllerManagerForServer,
    domainControllerForClient,
    domainControllerForServer,
    // localCache,
    miroirContext,
    restClient,
    processCapabilities,
  } = await setupMiroirPlatform(
    currentMiroirConfig,
    miroirActivityTracker,
    miroirEventService,
    window.fetch.bind(window),
    options,
  );

  return { domainControllerForClient, domainControllerForServer, miroirContext, restClient, processCapabilities };
}

// ###################################################################################
async function startWebApp(root: Root) {
  // Initialize performance monitoring configuration
  initializePerformanceConfig();
  setRestClientAuthorizationTokenGetter(() => getAuthToken());
  setRestClientAuthorizationInvalidationHandler(() => setAuthToken(undefined));
  // #263: from the server, or from the Electron main process over IPC.
  const authenticationEnabled = await fetchAuthenticationEnabled();
  setAuthenticationEnabled(authenticationEnabled);

  // Start our mock API server
  // const mServer: IndexedDbObjectStore = new IndexedDbObjectStore(miroirConfig.rootApiUrl);

  miroirAppStartup();
  miroirCoreStartup();
  miroirIndexedDbStoreSectionStartup(ConfigurationService.configurationService);

  // Electron IPC mode: the main process owns all store factories and the server-side domain
  // controller.  The renderer detects this via window.electronAPI.callMiroirIpc (injected by
  // the preload script) and uses IPC-based proxies instead of in-process objects.
  const isElectron = typeof (window as any).electronAPI?.callMiroirIpc === "function";
  const electronRestClient = isElectron ? new ElectronRestClient() : undefined;

  const theme = createTheme(themeParams);

  theme.spacing(10);

  log.warn("startWebApp start in mode", getMiroirEnvironmentMode(), "isElectron:", isElectron);
  // Electron: the main process runs the environment (#345) and hands over its client configuration.
  const electronMiroirConfig: MiroirConfigClient | undefined = electronRestClient
    ? await electronRestClient.getClientConfig()
    : undefined;

  // Electron uses the configuration of the main process's environment (emulated server via IPC).
  // The browser webapp uses webMiroirConfig (real HTTP server).
  if (!isElectron && !webMiroirConfig) {
    throw new Error(
      "the web client has no configuration: serve or build it with Vite (vite.config.js), which injects the one of the selected environment",
    );
  }
  const miroirConfigToUse = electronMiroirConfig ?? webMiroirConfig!;
  selfTestRequested = shouldStartSelfTest(miroirConfigToUse);
  const {
    domainControllerForClient,
    domainControllerForServer: rawDomainControllerForServer,
    miroirContext,
    processCapabilities,
  } = await setupClient(
    miroirConfigToUse,
    miroirActivityTracker,
    miroirEventService,
    electronRestClient ? { customRestClient: electronRestClient } : undefined,
  );

  // In Electron mode, the server-side domain controller is a lightweight IPC proxy that
  // delegates handleAction / handleBoxedExtractorOrQueryAction calls to the main process.
  const domainControllerForServer: DomainControllerInterface | undefined = isElectron
    ? (new ElectronServerDomainControllerProxy() as any as DomainControllerInterface)
    : rawDomainControllerForServer;

  // Electron: the main process opened every deployment of its environment before the window loaded.

  const withProviders = (page: React.ReactNode) => (
    <StrictMode>
      <ThemeProvider theme={theme}>
        <StyledEngineProvider injectFirst>
          <LocalCacheProvider store={domainControllerForClient.getLocalCache().getInnerStore()}>
            <MiroirContextReactProvider
              miroirContext={miroirContext}
              domainController={domainControllerForClient}
              processCapabilities={processCapabilities}
            >
              {page}
            </MiroirContextReactProvider>
          </LocalCacheProvider>
        </StyledEngineProvider>
      </ThemeProvider>
    </StrictMode>
  );

  // #487: in self-test mode the page runs the miroir app's MiroirTests instead of the application.
  // Loaded on demand: the self-test page and the result grids stay out of the application's bundle.
  if (selfTestRequested) {
    const { startSelfTest } = await import("./miroir-fwk/4-tests/selfTest/startSelfTest.js");
    await startSelfTest({
      root,
      withProviders,
      domainController: domainControllerForClient,
      miroirConfig: miroirConfigToUse,
      tracker: miroirActivityTracker,
      authenticationEnabled,
    });
    return;
  }

  root.render(withProviders(<RouterProvider router={router} />));
}

if (container) {
  const root = createRoot(container);
  startWebApp(root).catch((error) => {
    log.error("startWebApp failed", error);
    // #487: a self-test whose client does not start fails at once, instead of at the driver's timeout.
    if (selfTestRequested !== false) {
      const now = new Date();
      publishSelfTestResult(
        failedSelfTestResult(`the client did not start: ${error instanceof Error ? error.message : String(error)}`, {
          environment: webMiroirConfig?.environment?.name,
          tags: [],
          startedAt: now,
          endedAt: now,
        }),
      );
    }
  });
}
