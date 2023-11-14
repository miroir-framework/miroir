import { createTheme, StyledEngineProvider, ThemeProvider } from "@mui/material";
import { blue } from "@mui/material/colors";
import log from 'loglevelnext';
import { setupWorker } from 'msw/browser';
import { StrictMode } from "react";
import { createRoot, Root } from "react-dom/client";
import { Provider } from "react-redux";
import {
  createBrowserRouter,
  RouterProvider
} from "react-router-dom";

import {
  ConfigurationService,
  defaultLevels,
  defaultMiroirMetaModel,
  entityDefinitionEntityDefinition,
  getLoggerName,
  LoggerFactoryInterface,
  LoggerInterface,
  MiroirConfig,
  miroirCoreStartup,
  MiroirLoggerFactory,
  SpecificLoggerOptionsMap,
  StoreControllerFactory
} from "miroir-core";
import { miroirStoreIndexedDbStartup } from "miroir-store-indexedDb";
import { createMswRestServer } from "miroir-server-msw-stub";

import { ErrorPage } from "./miroir-fwk/4_view/ErrorPage";
import { HomePage } from "./miroir-fwk/4_view/HomePage";
import { MiroirContextReactProvider } from "./miroir-fwk/4_view/MiroirContextReactProvider";
import { RootComponent } from "./miroir-fwk/4_view/RootComponent";
import { EntityInstancePage } from "./miroir-fwk/4_view/routes/EntityInstancePage";
import { ReportPage } from "./miroir-fwk/4_view/routes/ReportPage";
import { miroirAppStartup } from "./startup";

import miroirConfig from "./assets/miroirConfig.json";
import { createReduxStoreAndRestClient } from "miroir-localcache-redux";
import { packageName } from "./constants";
import { cleanLevel } from "./miroir-fwk/4_view/constants";


const currentMiroirConfig: MiroirConfig = miroirConfig as unknown as MiroirConfig;

const specificLoggerOptions: SpecificLoggerOptionsMap = {
  // "5_miroir-core_DomainController": {level:defaultLevels.INFO, template:"[{{time}}] {{level}} ({{name}}) BBBBB-"},
  "5_miroir-core_DomainController": {level:defaultLevels.TRACE},
  // "4_miroir-redux_LocalCacheSlice": {level:defaultLevels.INFO, template:"[{{time}}] {{level}} ({{name}}) CCCCC-"},
  // "4_miroir-redux_LocalCacheSlice": {level:undefined, template:undefined}
  // "4_miroir-redux_LocalCacheSlice": {template:"[{{time}}] {{level}} ({{name}}) -"},
}

MiroirLoggerFactory.setEffectiveLogger(
  log as any as LoggerFactoryInterface,
  defaultLevels.INFO,
  "[{{time}}] {{level}} ({{name}})# ",
  specificLoggerOptions
);

const loggerName: string = getLoggerName(packageName, cleanLevel, "index.tsx");
let logger: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  logger = value;
});

logger.log("entityDefinitionEntityDefinition", JSON.stringify(entityDefinitionEntityDefinition));
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



// ###################################################################################
async function start(root:Root) {
  // Start our mock API server
  // const mServer: IndexedDbObjectStore = new IndexedDbObjectStore(miroirConfig.rootApiUrl);

  miroirAppStartup();
  miroirCoreStartup();
  miroirStoreIndexedDbStartup();


  if (process.env.NODE_ENV === "development") {

    const {
      reduxStore: mReduxStore,
      domainController,
      miroirContext: myMiroirContext,
    } = await createReduxStoreAndRestClient(currentMiroirConfig, window.fetch.bind(window));

    if (currentMiroirConfig.emulateServer) {
      const {
        localMiroirStoreController,localAppStoreController
      } = await StoreControllerFactory(
        ConfigurationService.storeFactoryRegister,
        currentMiroirConfig,
      );
  
      const {
        localDataStoreWorker, // browser
        localDataStoreServer, // nodejs
      } = await createMswRestServer(
        currentMiroirConfig,
        'browser',
        localMiroirStoreController,
        localAppStoreController,
        setupWorker
      );
  
      if (localDataStoreWorker) {
        logger.warn("index.tsx localDataStoreWorkers listHandlers", localDataStoreWorker.listHandlers().map(h=>h.info.header));
        localDataStoreWorker?.start();
      }
      if (localMiroirStoreController) {
        // log.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ localDataStore.open',JSON.stringify(localMiroirStoreController, circularReplacer()));
        await localMiroirStoreController?.open();
        try {
          await localMiroirStoreController?.bootFromPersistedState(defaultMiroirMetaModel.entities,defaultMiroirMetaModel.entityDefinitions);
        } catch (error) {
          logger.log('could not load persisted state from localMiroirStoreController, datastore could be empty (this is not a problem)');
        }
      }
      if (localAppStoreController) {
        await localAppStoreController?.open();
        try {
          await localAppStoreController?.bootFromPersistedState(defaultMiroirMetaModel.entities,defaultMiroirMetaModel.entityDefinitions);
        } catch (error) {
          logger.log('could not load persisted state from localAppStoreController, datastore could be empty (this is not a problem)');
        }
      }
    }

    const theme = createTheme({
      palette: {
        primary: {
          main: blue[500],
        },
      },
      spacing: 2,
      components: {
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
        MuiPaper: {
          defaultProps:{
            style: {maxHeight:"90vh",maxWidth:"90vw",display:"inline-flex"}
            // style: {display:"inline-flex"}
          }
        }
      }
    });
    
    theme.spacing(10);

    root.render(
      <StrictMode>
        <ThemeProvider theme={theme}>
          <StyledEngineProvider injectFirst>
            <Provider store={mReduxStore.getInnerStore()}>
              <MiroirContextReactProvider miroirContext={myMiroirContext} domainController={domainController}>
                <RouterProvider router={router} />
                {/* <RootComponent/> */}
              </MiroirContextReactProvider>
            </Provider>
          </StyledEngineProvider>
        </ThemeProvider>
      </StrictMode>
    );
  } else { // process.env.NODE_ENV !== "development"
    root.render(
      <span>Production mode not implemented yet!</span>
    )
  }

}

if (container) {
  const root = createRoot(container);
  start(root);
}
