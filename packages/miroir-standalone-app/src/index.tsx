import { createTheme, StyledEngineProvider, ThemeProvider } from "@mui/material";
import { blue, red } from "@mui/material/colors";
import { createRoot, Root } from "react-dom/client";
import {
  createBrowserRouter,
  Link,
  RouterProvider,
} from "react-router-dom";
import { StrictMode } from "react";
import { Provider } from "react-redux";
import { setupWorker } from 'msw/browser';

import {
  ConfigurationService,
  defaultMiroirMetaModel,
  entityDefinitionEntityDefinition,
  MiroirConfig,
  miroirCoreStartup,
  StoreControllerFactory,
} from "miroir-core";

import { createReduxStoreAndRestClient } from "./miroir-fwk/createReduxStoreAndRestClient";
import { ErrorPage } from "./miroir-fwk/4_view/ErrorPage";
import { MiroirContextReactProvider } from "./miroir-fwk/4_view/MiroirContextReactProvider";
import { RootComponent } from "./miroir-fwk/4_view/RootComponent";
import { HomePage } from "./miroir-fwk/4_view/HomePage";
import { ReportPage } from "./miroir-fwk/4_view/routes/ReportPage";
import { EntityInstancePage } from "./miroir-fwk/4_view/routes/EntityInstancePage";
import { miroirAppStartup } from "./startup";

import miroirConfig from "./assets/miroirConfig.json";

import { createMswRestServer } from "./miroir-fwk/createMswRestServer";
import { miroirStoreIndexedDbStartup } from "miroir-store-indexedDb";

const currentMiroirConfig: MiroirConfig = miroirConfig as MiroirConfig;

console.log("entityDefinitionEntityDefinition", JSON.stringify(entityDefinitionEntityDefinition));
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
        console.warn("index.tsx localDataStoreWorkers listHandlers", localDataStoreWorker.listHandlers().map(h=>h.info.header));
        localDataStoreWorker?.start();
      }
      if (localMiroirStoreController) {
        // console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ localDataStore.open',JSON.stringify(localMiroirStoreController, circularReplacer()));
        await localMiroirStoreController?.open();
        try {
          await localMiroirStoreController?.bootFromPersistedState(defaultMiroirMetaModel.entities,defaultMiroirMetaModel.entityDefinitions);
        } catch (error) {
          console.log('could not load persisted state from localMiroirStoreController, datastore could be empty (this is not a problem)');
        }
      }
      if (localAppStoreController) {
        await localAppStoreController?.open();
        try {
          await localAppStoreController?.bootFromPersistedState(defaultMiroirMetaModel.entities,defaultMiroirMetaModel.entityDefinitions);
        } catch (error) {
          console.log('could not load persisted state from localAppStoreController, datastore could be empty (this is not a problem)');
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
