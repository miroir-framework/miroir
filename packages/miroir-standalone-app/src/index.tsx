import { createTheme, StyledEngineProvider, ThemeProvider } from "@mui/material";
import { blue } from "@mui/material/colors";
import { setupWorker } from 'msw/browser';
import { StrictMode, useMemo } from "react";
import { createRoot, Root } from "react-dom/client";
import { Provider } from "react-redux";
import {
  createBrowserRouter,
  RouterProvider
} from "react-router-dom";
import 'material-icons/iconfont/material-icons.css';

import {
  applicationDeploymentLibrary,
  applicationDeploymentMiroir,
  ConfigurationService,
  defaultLevels,
  DomainController,
  DomainControllerInterface,
  Endpoint,
  getLoggerName,
  LoggerInterface,
  MiroirConfigClient,
  MiroirContext,
  miroirCoreStartup,
  MiroirLoggerFactory,
  PersistenceInterface,
  RestClient,
  restServerDefaultHandlers,
  SpecificLoggerOptionsMap,
  PersistenceStoreControllerManager,
  StoreUnitConfiguration,
  StoreOrBundleAction
} from "miroir-core";
import { createMswRestServer } from "miroir-server-msw-stub";
import { miroirIndexedDbStoreSectionStartup } from "miroir-store-indexedDb";

import { loglevelnext } from './loglevelnextImporter';
import { ErrorPage } from "./miroir-fwk/4_view/ErrorPage";
import { HomePage } from "./miroir-fwk/4_view/HomePage";
import { MiroirContextReactProvider } from "./miroir-fwk/4_view/MiroirContextReactProvider";
import { RootComponent } from "./miroir-fwk/4_view/RootComponent";
import { EntityInstancePage } from "./miroir-fwk/4_view/routes/EntityInstancePage";
import { ReportPage } from "./miroir-fwk/4_view/routes/ReportPage";
import { miroirAppStartup } from "./startup";

import { createReduxStoreAndPersistenceClient, PersistenceReduxSaga, LocalCache, RestPersistenceClientAndRestClient } from "miroir-localcache-redux";
import { packageName } from "./constants";
import { cleanLevel } from "./miroir-fwk/4_view/constants";

import miroirConfigEmulatedServerIndexedDb from "./assets/miroirConfig-emulatedServer-IndexedDb.json";
import miroirConfigRealServerFilesystemGit from "./assets/miroirConfig-realServer-filesystem-git.json";
import miroirConfigRealServerFilesystemTmp from "./assets/miroirConfig-realServer-filesystem-tmp.json";
import miroirConfigRealServerIndexedDb from "./assets/miroirConfig-realServer-indexedDb.json";
import miroirConfigRealServerSql from "./assets/miroirConfig-realServer-sql.json";
import miroirConfig from "./assets/miroirConfig.json";

const specificLoggerOptions: SpecificLoggerOptionsMap = {
  // "5_miroir-core_DomainController": {level:defaultLevels.INFO, template:"[{{time}}] {{level}} ({{name}}) BBBBB-"},
  // "5_miroir-core_DomainController": {level:defaultLevels.TRACE},
  // "4_miroir-redux_LocalCacheSlice": {level:defaultLevels.INFO, template:"[{{time}}] {{level}} ({{name}}) CCCCC-"},
  // "4_miroir-redux_LocalCacheSlice": {level:undefined, template:undefined}
  // "4_miroir-redux_LocalCacheSlice": {template:"[{{time}}] {{level}} ({{name}}) -"},
}

MiroirLoggerFactory.setEffectiveLoggerFactory(
  loglevelnext,
  defaultLevels.INFO,
  "[{{time}}] {{level}} ({{name}})# ",
  specificLoggerOptions
);

const loggerName: string = getLoggerName(packageName, cleanLevel, "index.tsx");
let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

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
        path: "instance/:deploymentUuid/:applicationSection/:entityUuid/:instanceUuid",
        element: <EntityInstancePage />,
        // errorElement: <ErrorPage />,
      },
    ]
  },
]);

// const theme = createMuiTheme();

const themeParams = {
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
      overflow: 'auto',
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
    // MuiPaper: {
    //   defaultProps:{
    //     style: {maxHeight:"90vh",maxWidth:"90vw",display:"inline-flex"}
    //     // style: {display:"inline-flex"}
    //   }
    // }
  }
};

// ###################################################################################
async function start(root:Root) {
  // Start our mock API server
  // const mServer: IndexedDbObjectStore = new IndexedDbObjectStore(miroirConfig.rootApiUrl);

  miroirAppStartup();
  miroirCoreStartup();
  miroirIndexedDbStoreSectionStartup();


  if (process.env.NODE_ENV === "development") {
    const miroirContext = new MiroirContext(currentMiroirConfig);

    const client: RestClient = new RestClient(window.fetch.bind(window));
    const persistenceClientAndRestClient = new RestPersistenceClientAndRestClient(
      currentMiroirConfig.client.emulateServer
        ? currentMiroirConfig.client.rootApiUrl
        : currentMiroirConfig.client["serverConfig"].rootApiUrl,
      client
    );

    const localCache: LocalCache = new LocalCache();


    const persistenceStoreControllerManager = new PersistenceStoreControllerManager(
      ConfigurationService.adminStoreFactoryRegister,
      ConfigurationService.StoreSectionFactoryRegister,
    );

    const persistenceSaga: PersistenceReduxSaga = new PersistenceReduxSaga(
        persistenceClientAndRestClient
      );

    persistenceSaga.run(localCache)

    const domainController: DomainControllerInterface = new DomainController(
      false, // we are on the client, we have to use persistenceStore to execute (remote) Queries
      miroirContext,
      localCache, // implements LocalCacheInterface
      persistenceSaga, // implements PersistenceInterface
      new Endpoint(localCache)
    );

    if (currentMiroirConfig.client.emulateServer) {
      const {
        localDataStoreWorker, // browser
        localDataStoreServer, // nodejs
      } = await createMswRestServer(
        currentMiroirConfig,
        'browser',
        restServerDefaultHandlers,
        persistenceStoreControllerManager,
        localCache,
        setupWorker
      );
  
      if (localDataStoreWorker) {
        log.warn("index.tsx localDataStoreWorkers listHandlers", localDataStoreWorker.listHandlers().map(h=>h.info.header));
        await localDataStoreWorker?.start();
      } else {
        throw new Error("index.tsx localDataStoreWorker not found.");
        
      }

      const persistenceStore:PersistenceInterface = domainController.getRemoteStore();
      const openStoreAction: StoreOrBundleAction = {
        actionType: "storeManagementAction",
        actionName: "openStore",
        endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
        configuration: {
          [applicationDeploymentMiroir.uuid]: (currentMiroirConfig.client as any).miroirServerConfig as StoreUnitConfiguration,
          [applicationDeploymentLibrary.uuid]: (currentMiroirConfig.client as any).appServerConfig as StoreUnitConfiguration,
        },
        deploymentUuid: applicationDeploymentMiroir.uuid,
      };
      await persistenceStore.handlePersistenceAction(openStoreAction)
    }

    const theme = createTheme(themeParams);
    
    theme.spacing(10);

    root.render(
      <StrictMode>
        <ThemeProvider theme={theme}>
          <StyledEngineProvider injectFirst>
            <Provider store={localCache.getInnerStore()}>
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
  start(root);
}
