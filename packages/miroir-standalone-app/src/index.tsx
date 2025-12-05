import { createTheme, StyledEngineProvider, ThemeProvider } from "@mui/material";
import { blue } from "@mui/material/colors";
import 'material-symbols/outlined.css';
import { StrictMode } from "react";
import { createRoot, Root } from "react-dom/client";
import { Provider } from "react-redux";
import {
  createBrowserRouter,
  RouterProvider
} from "react-router-dom";


import {
  ConfigurationService,
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
  SpecificLoggerOptionsMap
} from "miroir-core";
import { RestPersistenceClientAndRestClient, setupMiroirDomainController } from "miroir-localcache-redux";
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

import { packageName } from "./constants.js";
import { cleanLevel } from "./miroir-fwk/4_view/constants.js";

import miroirConfigEmulatedServerIndexedDb from "./assets/miroirConfig-emulatedServer-IndexedDb.json" assert { type: "json" };
import miroirConfigRealServerFilesystemGit from "./assets/miroirConfig-realServer-filesystem-git.json" assert { type: "json" };
import miroirConfigRealServerFilesystemTmp from "./assets/miroirConfig-realServer-filesystem-tmp.json" assert { type: "json" };
import miroirConfigRealServerIndexedDb from "./assets/miroirConfig-realServer-indexedDb.json" assert { type: "json" };
import miroirConfigRealServerSql from "./assets/miroirConfig-realServer-sql.json" assert { type: "json" };
import miroirConfig from "./assets/miroirConfig.json" assert { type: "json" };
import { CheckPage } from "./miroir-fwk/4_view/routes/Check.js";
import { ConceptPage } from "./miroir-fwk/4_view/routes/Concept.js";
import { TransformerBuilderPage } from "./miroir-fwk/4_view/routes/TransformerBuilderPage.js";
import { RunnersPage } from "./miroir-fwk/4_view/routes/Runners.js";
import { SettingsPage } from "./miroir-fwk/4_view/routes/SettingsPage.js";
import { SearchPage } from "./miroir-fwk/4_view/routes/SearchPage.js";

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
const currentMiroirConfigName: string | undefined = "miroirConfigRealServerFilesystemGit"
// const currentMiroirConfigName: string | undefined = "miroirConfigRealServerFilesystemTmp"
// const currentMiroirConfigName: string | undefined = "miroirConfigRealServerSql"
// ##############################################################################################
// ##############################################################################################

const currentMiroirConfig: MiroirConfigClient =
  currentMiroirConfigName && miroirConfigFiles[currentMiroirConfigName]
    ? miroirConfigFiles[currentMiroirConfigName ?? ""]
    : (miroirConfig as unknown as MiroirConfigClient);

log.info("currentMiroirConfigName:",currentMiroirConfigName, "currentMiroirConfig", currentMiroirConfig); 

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
        path: "home",
        element: <HomePage></HomePage>,
        // errorElement: <ErrorPage />,
      },
      {
        path: "report/:deploymentUuid/:applicationSection/:reportUuid",
        element: <ReportPage />,
        // errorElement: <ErrorPage />,
      },
      {
        path: "report/:deploymentUuid/:applicationSection/:reportUuid/:instanceUuid",
        element: <ReportPage />,
        // errorElement: <ErrorPage />,
      },
      {
        path: "transformerBuilder",
        element: <TransformerBuilderPage />,
        // errorElement: <ErrorPage />,
      },
      {
        path: "concept",
        element: <ConceptPage />,
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

export const themeParams = {
  palette: {
    primary: {
      main: blue[500],
    },
  },
  spacing: 2,
  components: {
    toolbar: {
      paddingRight: 24, // keep right padding when drawer closed
    },
    MuiContainer: { // no effect?
      defaultProps: {
        disableGutters: true,
      },
    },
    MuiToolbar: { // no effect
      defaultProps: {
        disableGutters: true,
      },
    },
    MuiGridContainer: { // no effect?
      defaultProps: {
        disableGutters: true,
      },
    },
    content: {
      flexGrow: 1,
      // height: '100vh',
      overflowY: 'auto', // Allow scrolling when content overflows
    },
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

// ###################################################################################
async function startWebApp(root:Root) {
  // Initialize performance monitoring configuration
  initializePerformanceConfig();
  
  // Start our mock API server
  // const mServer: IndexedDbObjectStore = new IndexedDbObjectStore(miroirConfig.rootApiUrl);

  miroirAppStartup();
  miroirCoreStartup();
  miroirIndexedDbStoreSectionStartup();


  if (process.env.NODE_ENV === "development") {

    // ConfigurationService.registerTestImplementation({expect: vitest.expect as any});
    ConfigurationService.registerTestImplementation({expect: expect as any});

    const miroirContext = new MiroirContext(
      miroirActivityTracker,
      miroirEventService,
      currentMiroirConfig
    );

    const client: RestClient = new RestClient(window.fetch.bind(window));

    const persistenceClientAndRestClient = new RestPersistenceClientAndRestClient(
      currentMiroirConfig.client.emulateServer
        ? currentMiroirConfig.client.rootApiUrl
        : currentMiroirConfig.client["serverConfig"].rootApiUrl,
      client
    );

    const persistenceStoreControllerManagerForClient = new PersistenceStoreControllerManager(
      ConfigurationService.adminStoreFactoryRegister,
      ConfigurationService.StoreSectionFactoryRegister,
    );

    const domainController = await setupMiroirDomainController(
      miroirContext, 
      {
        persistenceStoreAccessMode: "remote",
        localPersistenceStoreControllerManager: persistenceStoreControllerManagerForClient,
        remotePersistenceStoreRestClient: persistenceClientAndRestClient,
      }
    );

    // ################################################
    if (currentMiroirConfig.client.emulateServer) {
      throw new Error("emulateServer must be re-implemented using RestClientStub");
      // const persistenceStoreControllerManagerForEmulatedServer = new PersistenceStoreControllerManager(
      //   ConfigurationService.adminStoreFactoryRegister,
      //   ConfigurationService.StoreSectionFactoryRegister,
      // );
      // const domainControllerForEmulatedServer = await setupMiroirDomainController(
      //   miroirContext, 
      //   {
      //     persistenceStoreAccessMode: "local",
      //     localPersistenceStoreControllerManager: persistenceStoreControllerManagerForEmulatedServer,
      //     // remotePersistenceStoreRestClient: persistenceClientAndRestClient,
      //   }
      // ); // even when emulating server, we use remote persistence store, since MSW makes it appear as if we are using a remote server.
  
      // const {
      //   localDataStoreWorker, // browser
      //   localDataStoreServer, // nodejs
      // } = await createMswRestServer(
      //   currentMiroirConfig,
      //   'browser',
      //   restServerDefaultHandlers,
      //   persistenceStoreControllerManagerForEmulatedServer,
      //   domainControllerForEmulatedServer,
      //   setupWorker
      // );
  
      // if (localDataStoreWorker) {
      //   log.warn("index.tsx localDataStoreWorkers listHandlers", localDataStoreWorker.listHandlers().map(h=>h.info.header));
      //   await localDataStoreWorker?.start();
      // } else {
      //   throw new Error("index.tsx localDataStoreWorker not found.");
        
      // }

      // for (const c of Object.entries(currentMiroirConfig.client.deploymentStorageConfig)) {
      //   const openStoreAction: StoreOrBundleAction = {
      //     actionType: "storeManagementAction",
      //     actionName: "storeManagementAction_openStore",
      //     endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
      //     configuration: {
      //       [c[0]]: c[1] as StoreUnitConfiguration,
      //     },
      //     deploymentUuid: c[0],
      //   };
      //   await domainController.handleAction(openStoreAction)
      // }
    }

    const theme = createTheme(themeParams);
    
    theme.spacing(10);

    root.render(
      <StrictMode>
        <ThemeProvider theme={theme}>
          <StyledEngineProvider injectFirst>
            <Provider store={domainController.getLocalCache().getInnerStore()}>
              <MiroirContextReactProvider miroirContext={miroirContext} domainController={domainController}>
                <RouterProvider router={router} />
                {/* <RootComponent/> */}
              </MiroirContextReactProvider>
            </Provider>
          </StyledEngineProvider>
        </ThemeProvider>
      </StrictMode>
    );
  } else { // process.env.NODE_ENV !== "development"
    console.warn("start prod",process.env.NODE_ENV)

    root.render(
      <span>Production mode not implemented yet!</span>
    )
  }

}

if (container) {
  const root = createRoot(container);
  startWebApp(root);
}
