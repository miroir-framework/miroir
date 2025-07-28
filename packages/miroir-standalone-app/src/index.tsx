import { createTheme, StyledEngineProvider, ThemeProvider } from "@mui/material";
import { blue } from "@mui/material/colors";
import 'material-icons/iconfont/material-icons.css';
import { StrictMode } from "react";
import { createRoot, Root } from "react-dom/client";
import { Provider } from "react-redux";
import {
  createBrowserRouter,
  RouterProvider
} from "react-router-dom";


import {
  ConfigurationService,
  LoggerInterface,
  MiroirConfigClient,
  MiroirContext,
  miroirCoreStartup,
  MiroirLoggerFactory,
  PersistenceStoreControllerManager,
  RestClient,
  SpecificLoggerOptionsMap
} from "miroir-core";
import { RestPersistenceClientAndRestClient, setupMiroirDomainController } from "miroir-localcache-redux";
import { miroirIndexedDbStoreSectionStartup } from "miroir-store-indexedDb";

import { loglevelnext } from './loglevelnextImporter.js';
import { ErrorPage } from "./miroir-fwk/4_view/ErrorPage.js";
import { MiroirContextReactProvider } from "./miroir-fwk/4_view/MiroirContextReactProvider.js";
import { RootComponent } from "./miroir-fwk/4_view/components/RootComponent.js";
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
import { ConceptPage } from "./miroir-fwk/4_view/routes/Concept.js";
import { ToolsPage } from "./miroir-fwk/4_view/routes/Tools.js";
import { expect } from "./miroir-fwk/4-tests/test-expect.js";
import { CheckPage } from "./miroir-fwk/4_view/routes/Check.js";

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
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "index.tsx")
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

MiroirLoggerFactory.startRegisteredLoggers(
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
        path: "tools",
        element: <ToolsPage />,
        // errorElement: <ErrorPage />,
      },
      {
        path: "concept",
        element: <ConceptPage />,
        // errorElement: <ErrorPage />,
      },
      {
        path: "check",
        element: <CheckPage />,
        // errorElement: <ErrorPage />,
      },
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
    // toolbarIcon: {
    //   display: 'flex',
    //   alignItems: 'center',
    //   justifyContent: 'flex-end',
    //   padding: '0 8px',
    //   ...theme.mixins.toolbar,
    // },
    // appBar: {
    //   zIndex: theme.zIndex.drawer + 1,
    //   transition: theme.transitions.create(['width', 'margin'], {
    //     easing: theme.transitions.easing.sharp,
    //     duration: theme.transitions.duration.leavingScreen,
    //   }),
    // },
    // appBarShift: {
    //   marginLeft: SidebarWidth,
    //   width: `calc(100% - ${SidebarWidth}px)`,
    //   transition: theme.transitions.create(['width', 'margin'], {
    //     easing: theme.transitions.easing.sharp,
    //     duration: theme.transitions.duration.enteringScreen,
    //   }),
    // },
    // menuButton: {
    //   marginRight: 36,
    // },
    // menuButtonHidden: {
    //   display: 'none',
    // },
    // title: {
    //   flexGrow: 1,
    // },
    // drawerPaper: {
    //   position: 'relative',
    //   whiteSpace: 'nowrap',
    //   width: SidebarWidth,
    //   transition: theme.transitions.create('width', {
    //     easing: theme.transitions.easing.sharp,
    //     duration: theme.transitions.duration.enteringScreen,
    //   }),
    // },
    // drawerPaperClose: {
    //   overflowX: 'hidden',
    //   transition: theme.transitions.create('width', {
    //     easing: theme.transitions.easing.sharp,
    //     duration: theme.transitions.duration.leavingScreen,
    //   }),
    //   width: theme.spacing(7),
    //   [theme.breakpoints.up('sm')]: {
    //     width: theme.spacing(9),
    //   },
    // },
    // appBarSpacer: theme.mixins.toolbar,
    content: {
      flexGrow: 1,
      height: '100vh',
      overflow: 'hidden', // Completely prevent scrollbars
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
  // Start our mock API server
  // const mServer: IndexedDbObjectStore = new IndexedDbObjectStore(miroirConfig.rootApiUrl);

  miroirAppStartup();
  miroirCoreStartup();
  miroirIndexedDbStoreSectionStartup();


  if (process.env.NODE_ENV === "development") {

    // ConfigurationService.registerTestImplementation({expect: vitest.expect as any});
    ConfigurationService.registerTestImplementation({expect: expect as any});

    const miroirContext = new MiroirContext(currentMiroirConfig);

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
