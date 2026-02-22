declare global { interface Window { process?: any } }

import { createTheme, StyledEngineProvider, ThemeProvider, type ThemeOptions } from "@mui/material";
import { blue } from "@mui/material/colors";
import 'material-symbols/outlined.css';
import { StrictMode } from "react";
import { createRoot, Root } from "react-dom/client";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider
} from "react-router-dom";


import {
  Action2Error,
  circularReplacer,
  ConfigurationService,
  defaultMetaModelEnvironment,
  defaultSelfApplicationDeploymentMap,
  expect,
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
  SpecificLoggerOptionsMap,
  type ApplicationDeploymentMap,
  type Deployment,
  type DomainControllerInterface,
  type RestClientInterface,
  type RestPersistenceClientAndRestClientInterface,
  type StoreOrBundleAction,
  type StoreUnitConfiguration
} from "miroir-core";
import {
  LocalCacheProvider,
  RestPersistenceClientAndRestClient,
  setupMiroirDomainController,
} from "./miroir-fwk/miroir-localcache-imports.js";
import { miroirIndexedDbStoreSectionStartup } from "miroir-store-indexedDb";

import { initializePerformanceConfig } from "./miroir-fwk/4_view/tools/performanceConfig.js";
import { loglevelnext } from './loglevelnextImporter.js';
import { MiroirEventsPage } from "./miroir-fwk/4_view/pages/MiroirEventsPage.js";
import { ErrorPage } from "./miroir-fwk/4_view/ErrorPage.js";
import { ErrorLogsPageDEFUNCT } from "./miroir-fwk/4_view/ErrorLogsPageDEFUNCT.js";
import { MiroirContextReactProvider } from "./miroir-fwk/4_view/MiroirContextReactProvider.js";
import { RootComponent } from "./miroir-fwk/4_view/components/Page/RootComponent.js";
import { HomePage } from "./miroir-fwk/4_view/routes/HomePage.js";
import { ReportPage } from "./miroir-fwk/4_view/routes/ReportPage.js";
import { miroirAppStartup } from "./startup.js";
import { ElectronRestClient, ElectronServerDomainControllerProxy } from "./miroir-fwk/4_view/services/ElectronIpcProxy.js";

import { packageName } from "./constants.js";
import { cleanLevel } from "./miroir-fwk/4_view/constants.js";

import miroirConfigEmulatedServerIndexedDb from "./assets/miroirConfig-emulatedServer-IndexedDb.json" assert { type: "json" };
import miroirConfigRealServerFilesystemGit from "./assets/miroirConfig-realServer-filesystem-git.json" assert { type: "json" };
import miroirConfigRealServerFilesystemTmp from "./assets/miroirConfig-realServer-filesystem-tmp.json" assert { type: "json" };
import miroirConfigRealServerIndexedDb from "./assets/miroirConfig-realServer-indexedDb.json" assert { type: "json" };
import miroirConfigRealServerSql from "./assets/miroirConfig-realServer-sql.json" assert { type: "json" };
import miroirConfig from "./assets/miroirConfig.json" assert { type: "json" };
import { CheckPage } from "./miroir-fwk/4_view/routes/Check.js";
import { TransformerBuilderPage } from "./miroir-fwk/4_view/routes/TransformerBuilderPage.js";
import { RunnersPage } from "./miroir-fwk/4_view/routes/Runners.js";
import { SettingsPage } from "./miroir-fwk/4_view/routes/SettingsPage.js";
import { SearchPage } from "./miroir-fwk/4_view/routes/SearchPage.js";
import { adminSelfApplication, deployment_Admin, deployment_Miroir, entityDeployment } from "miroir-test-app_deployment-admin";
import { rgb } from "d3";

const specificLoggerOptions: SpecificLoggerOptionsMap = {
  // "5_miroir-core_DomainController": {level:defaultLevels.INFO, template:"[{{time}}] {{level}} ({{name}}) BBBBB-"},
  // "5_miroir-core_DomainController": {level:defaultLevels.TRACE},
  // "4_miroir-redux_LocalCacheSlice": {level:defaultLevels.INFO, template:"[{{time}}] {{level}} ({{name}}) CCCCC-"},
  // "4_miroir-redux_LocalCacheSlice": {level:undefined, template:undefined}
  // "4_miroir-redux_LocalCacheSlice": {template:"[{{time}}] {{level}} ({{name}}) -"},
}

// MiroirLoggerFactory.setEffectiveLoggerFactoryWithLogLevelNext(
//   loglevelnext,
//   defaultLevels.INFO,
//   "[{{time}}] {{level}} ({{name}})# ",
//   specificLoggerOptions
// );

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "index.tsx"), "UI",
).then((logger: LoggerInterface) => {log = logger});

export const isElectron = typeof window !== "undefined" && typeof window.process === "object" && window.process.versions?.electron;

const miroirConfigFiles: {[k: string]: MiroirConfigClient} = {
  "miroirConfigEmulatedServerIndexedDb": miroirConfigEmulatedServerIndexedDb as MiroirConfigClient,
  "miroirConfigRealServerIndexedDb": miroirConfigRealServerIndexedDb as any as MiroirConfigClient,
  "miroirConfigRealServerFilesystemGit": miroirConfigRealServerFilesystemGit as any as MiroirConfigClient,
  "miroirConfigRealServerFilesystemTmp": miroirConfigRealServerFilesystemTmp as any as MiroirConfigClient,
  "miroirConfigRealServerSql": miroirConfigRealServerSql as any as MiroirConfigClient,
}

// ##############################################################################################
// ##############################################################################################
// const currentMiroirConfigName: string | undefined = "miroirConfigEmulatedServerIndexedDb"
// const currentMiroirConfigName: string | undefined = "miroirConfigRealServerIndexedDb"
const webMiroirConfigName: string | undefined = "miroirConfigRealServerFilesystemGit"
// const currentMiroirConfigName: string | undefined = "miroirConfigRealServerFilesystemTmp"
// const currentMiroirConfigName: string | undefined = "miroirConfigRealServerSql"
// ##############################################################################################
// ##############################################################################################

const webMiroirConfig: MiroirConfigClient =
  webMiroirConfigName && miroirConfigFiles[webMiroirConfigName]
    ? miroirConfigFiles[webMiroirConfigName ?? ""]
    : (miroirConfig as unknown as MiroirConfigClient);

log.info("currentMiroirConfigName:",webMiroirConfigName, "currentMiroirConfig", webMiroirConfig); 

const miroirActivityTracker = new MiroirActivityTracker();
const miroirEventService = new MiroirEventService(miroirActivityTracker);

MiroirLoggerFactory.startRegisteredLoggers(
  miroirActivityTracker,
  miroirEventService,
  loglevelnext,
  {
    "defaultLevel": "INFO",
    "defaultTemplate": "[{{time}}] {{level}} {{name}} ### ",
    // "context": {
    //   "testSuite": "DomainController.integ.Data.CRUD",
    //   "test": "Add Book instance"
    // },
    "specificLoggerOptions": {
    }
  },
);
log.info("started registered loggers DONE");

const container = document.getElementById("root");

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootComponent></RootComponent>,
    // element: <HomePage></HomePage>,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <Navigate to="home" replace />,
      },
      {
        path: "home",
        element: <HomePage></HomePage>,
        // errorElement: <ErrorPage />,
      },
      {
        path: "report/:application/:deploymentUuid/:applicationSection/:reportUuid",
        element: <ReportPage />,
        // errorElement: <ErrorPage />,
      },
      {
        path: "report/:application/:deploymentUuid/:applicationSection/:reportUuid/:instanceUuid",
        element: <ReportPage />,
        // errorElement: <ErrorPage />,
      },
      {
        path: "transformerBuilder",
        element: <TransformerBuilderPage />,
        // errorElement: <ErrorPage />,
      },
      {
        path: "runners",
        element: <RunnersPage />,
        // errorElement: <ErrorPage />,
      },
      {
        path: "check",
        element: <CheckPage />,
        // errorElement: <ErrorPage />,
      },
      {
        path: "error-logs",
        element: <ErrorLogsPageDEFUNCT />,
        // errorElement: <ErrorPage />,
      },
      {
        path: "events",
        element: <MiroirEventsPage />,
        // errorElement: <ErrorPage />,
      },
      {
        path: "settings",
        element: <SettingsPage />,
        // errorElement: <ErrorPage />,
      },
      {
        path: "search",
        element: <SearchPage />,
        // errorElement: <ErrorPage />,
      },
      // Renamed from action-logs to events
    ]
  },
]);

// const theme = createMuiTheme();

export const themeParams: ThemeOptions = {
  // palette: {
  //   primary: {
  //     // main: blue[500],
  //     // main: rgb(124, 103, 188),
  //     main: "#7c67bcff",
  //   },
  //   background: {
  //     // main: blue[500],
  //     // main: rgb(124, 103, 188),
  //     default: "#7c67bcff",
  //   },
  // },
  // spacing: 2,
  spacing: 0,
  components: {
    // toolbar: {
    //   paddingRight: 24, // keep right padding when drawer closed
    // },
    // MuiContainer: { // no effect?
    //   defaultProps: {
    //     disableGutters: true,
    //   },
    // },
    // MuiToolbar: { // no effect
    //   defaultProps: {
    //     disableGutters: true,
    //   },
    // },
    // MuiGridContainer: { // no effect?
    //   defaultProps: {
    //     disableGutters: true,
    //   },
    // },
    // content: {
    //   flexGrow: 1,
    //   // height: '100vh',
    //   // overflowY: 'auto', // Allow scrolling when content overflows
    // },
    MuiList: {
      defaultProps:{
        style: {border: `0`,}
        // style: {border: `10px dashed ${blue[500]}`,}
      }
    },
    MuiDialog: {
      defaultProps:{
        // style: {maxWidth: "100vw",display:"inline-flex"}
        // style: {maxWidth: "100vw"}
        style: {display:"inline-flex", justifyContent:'center', alignItems:"center"}
      }
    },
    MuiDialogTitle: {
      defaultProps:{
        style: {display:"flex"}
      }
    },
    //   defaultProps:{
    //     style: {maxHeight:"90vh",maxWidth:"90vw",display:"inline-flex"}
    //     // style: {display:"inline-flex"}
    //   }
    // }
  }
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
  ConfigurationService.configurationService.registerTestImplementation({expect: expect as any});

  const localMiroirActivityTracker = miroirActivityTracker ?? new MiroirActivityTracker();
  const localMiroirEventService = miroirEventService ?? new MiroirEventService(localMiroirActivityTracker);
  const miroirContext = new MiroirContext(
    localMiroirActivityTracker,
    localMiroirEventService,
    miroirConfig
  );
  console.log("setupMiroirPlatform miroirConfig", JSON.stringify(miroirConfig, null, 2));

  let restClient: RestClientInterface | undefined = undefined;
  let persistenceStoreRestClient: RestPersistenceClientAndRestClientInterface | undefined = undefined;

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
      remotePersistenceStoreRestClient: persistenceStoreRestClient,
    }
  );

  let persistenceStoreControllerManagerForServer: PersistenceStoreControllerManager | undefined = undefined;
  let domainControllerForServer: DomainControllerInterface | undefined = undefined;
  if (miroirConfig.client.emulateServer && !options?.customRestClient) {
    persistenceStoreControllerManagerForServer = new PersistenceStoreControllerManager(
      ConfigurationService.configurationService.adminStoreFactoryRegister,
      ConfigurationService.configurationService.StoreSectionFactoryRegister
    );

    domainControllerForServer = await setupMiroirDomainController(
      miroirContext, 
      {
        persistenceStoreAccessMode: "local",
        localPersistenceStoreControllerManager: persistenceStoreControllerManagerForServer,
      }
    );

    (restClient as RestClientStub).setServerDomainController(domainControllerForServer);
    (restClient as RestClientStub).setPersistenceStoreControllerManager(persistenceStoreControllerManagerForServer);
  }

  return {
    persistenceStoreControllerManagerForClient: persistenceStoreControllerManagerForClient,
    persistenceStoreControllerManagerForServer: persistenceStoreControllerManagerForServer,
    domainControllerForClient,
    domainControllerForServer,
    localCache: domainControllerForClient.getLocalCache(),
    miroirContext,
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
    persistenceStoreControllerManagerForClient,
    persistenceStoreControllerManagerForServer,
    domainControllerForClient,
    domainControllerForServer,
    localCache,
    miroirContext,
  } = await setupMiroirPlatform(
    currentMiroirConfig,
    miroirActivityTracker,
    miroirEventService,
    window.fetch.bind(window),
    options,
  );

  return { domainControllerForClient, domainControllerForServer, miroirContext };
}

// ###################################################################################
async function startWebApp(root:Root) {
  // Initialize performance monitoring configuration
  initializePerformanceConfig();

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

  console.warn("start in mode", process.env.NODE_ENV);
  const desktopMiroirConfig: MiroirConfigClient = {
    miroirConfigType: "client",
    client: {
      emulateServer: true,
      rootApiUrl: "http://localhost:3080",
      deploymentStorageConfig: {
        // rootApiUrl: "http://localhost:3080",
        // dataflowConfiguration: {
        //   type: "singleNode",
        //   metaModel: {
        //     location: {
        //       side: "server",
        //       type: "filesystem",
        //       location: "../miroir-core/src/assets",
        //     },
        //   },
        // },
        //           storeSectionConfiguration: {
        "18db21bf-f8d3-4f6a-8296-84b69f6dc48b": {
          admin: {
            emulatedServerType: "filesystem",
            directory: "../miroir-test-app_deployment-admin/assets",
          },
          model: {
            emulatedServerType: "filesystem",
            directory: "../miroir-test-app_deployment-admin/assets/admin_model",
          },
          data: {
            emulatedServerType: "filesystem",
            directory: "../miroir-test-app_deployment-admin/assets/admin_data",
          },
        },
      },
    },
  };
  // Electron uses desktopMiroirConfig (emulated server via IPC).
  // The browser webapp uses webMiroirConfig (real HTTP server).
  const miroirConfigToUse = isElectron ? desktopMiroirConfig : webMiroirConfig;
  const {
    domainControllerForClient,
    domainControllerForServer: rawDomainControllerForServer,
    miroirContext,
  } = await setupClient(
    miroirConfigToUse,
    miroirActivityTracker,
    miroirEventService,
    electronRestClient ? { customRestClient: electronRestClient } : undefined,
  );

  // In Electron mode, the server-side domain controller is a lightweight IPC proxy that
  // delegates handleAction / handleBoxedExtractorOrQueryAction calls to the main process.
  let domainControllerForServer: DomainControllerInterface | undefined = isElectron
    ? (new ElectronServerDomainControllerProxy() as any as DomainControllerInterface)
    : rawDomainControllerForServer;

  if (isElectron && desktopMiroirConfig.client.emulateServer) {
    if (!domainControllerForServer) {
      throw new Error("Domain controller for server is not defined");
    }
    const configurations: Record<string, Deployment> = {
      [deployment_Admin.uuid]: deployment_Admin as Deployment,
      [deployment_Miroir.uuid]: deployment_Miroir as Deployment,
    };

    // open all configured stores
    for (const c of Object.entries(configurations)) {
      const openStoreAction: StoreOrBundleAction = {
        actionType: "storeManagementAction_openStore",
        application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
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
    const deploymentsQueryResults =
      await domainControllerForServer.handleBoxedExtractorOrQueryAction(
        {
          actionType: "runBoxedQueryAction",
          application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
          payload: {
            application: adminSelfApplication.uuid,
            applicationSection: "data",
            queryExecutionStrategy: "storage",
            query: {
              application: adminSelfApplication.uuid,
              queryType: "boxedQueryWithExtractorCombinerTransformer",
              pageParams: {},
              queryParams: {},
              contextResults: {},
              extractors: {
                deployments: {
                  extractorOrCombinerType: "extractorByEntityReturningObjectList",
                  parentUuid: entityDeployment.uuid,
                },
              },
            },
          },
        },
        defaultSelfApplicationDeploymentMap,
        defaultMetaModelEnvironment,
      );

    if (deploymentsQueryResults instanceof Action2Error) {
      throw new Error(`Error fetching deployments: ${deploymentsQueryResults.errorMessage}`);
    }

    const deployments: Deployment[] = deploymentsQueryResults.returnedDomainElement.deployments;

    log.info(`Deployments fetched: ${JSON.stringify(deployments, circularReplacer(), 2)}`);

    const deploymentsToOpen: [string, Deployment][] = deployments
      .filter((d) => !configurations[d.uuid.toString()])
      .map((d) => [d.uuid.toString(), d]);

    log.info(`Deployments to open: ${JSON.stringify(deploymentsToOpen, circularReplacer(), 2)}`);

    const applicationDeploymentMap: ApplicationDeploymentMap = deployments.reduce((acc, curr) => {
      return {
        ...acc,
        [curr.selfApplication ?? "NO ADMIN APPLICATION for " + curr.name]: curr.uuid,
      };
    }, {});

    log.info(
      `ApplicationDeploymentMap for new deployments: ${JSON.stringify(applicationDeploymentMap, circularReplacer(), 2)}`,
    );

    // open all newly found stores
    for (const c of deploymentsToOpen) {
      const openStoreAction: StoreOrBundleAction = {
        actionType: "storeManagementAction_openStore",
        application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
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
        applicationDeploymentMap,
        defaultMetaModelEnvironment,
      );
    }
  }

  root.render(
    <>
      {/* <span>electron {isElectron ? "yes" : "no"}</span>
        <pre>{JSON.stringify(webMiroirConfig, null, 2)}</pre> */}
      <StrictMode>
        <ThemeProvider theme={theme}>
          <StyledEngineProvider injectFirst>
            <LocalCacheProvider store={domainControllerForClient.getLocalCache().getInnerStore()}>
              <MiroirContextReactProvider
                miroirContext={miroirContext}
                domainController={domainControllerForClient}
              >
                <RouterProvider router={router} />
              </MiroirContextReactProvider>
            </LocalCacheProvider>
          </StyledEngineProvider>
        </ThemeProvider>
      </StrictMode>
    </>,
  );

  // root.render(
  //   <>
  //     {/* <span>Production mode not implemented yet!</span> */}
  //     <span>electron </span>
  //     <pre>{JSON.stringify(currentMiroirConfig, null, 2)}</pre>
  //   </>
  // )
  // }
}

if (container) {
  const root = createRoot(container);
  startWebApp(root);
}
