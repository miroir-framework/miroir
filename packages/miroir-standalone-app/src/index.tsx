import { createTheme, StyledEngineProvider, ThemeProvider } from "@mui/material";
import { createRoot, Root } from "react-dom/client";
import {
  createBrowserRouter,
  Link,
  RouterProvider,
} from "react-router-dom";

import { entityDefinitionEntityDefinition, MiroirConfig, miroirCoreStartup } from "miroir-core";

import { blue, red } from "@mui/material/colors";
import miroirConfig from "assets/miroirConfig.json";
import { createReduxStoreAndRestClient } from "miroir-fwk/createReduxStoreAndRestClient";
import { StrictMode } from "react";
import { miroirAppStartup } from "startup";
import ErrorPage from "./miroir-fwk/4_view/ErrorPage";
import { Provider } from "react-redux";
import { MiroirContextReactProvider } from "./miroir-fwk/4_view/MiroirContextReactProvider";
import { RootComponent } from "./miroir-fwk/4_view/RootComponent";
import { HomePage } from "./miroir-fwk/4_view/HomePage";
import { ReportPage } from "./miroir-fwk/4_view/routes/ReportPage";
import { EntityInstancePage } from "./miroir-fwk/4_view/routes/EntityInstancePage";

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

  if (process.env.NODE_ENV === "development") {

    const {
      reduxStore: mReduxStore,
      domainController,
      miroirContext: myMiroirContext,
    } = await createReduxStoreAndRestClient(miroirConfig as MiroirConfig, window.fetch.bind(window));

    // const {
    //   localMiroirStoreController,
    //   localAppStoreController,
    //   localDataStoreWorker,
    //   localDataStoreServer,
    // } = await createMswRestServer(miroirConfig as MiroirConfig, 'browser', setupWorker);

    // if (!!localDataStoreWorker) {
    //   console.log('##############################################');
    //   localDataStoreWorker.printHandlers(); // Optional: nice for debugging to see all available route handlers that will be intercepted
    //   console.log('##############################################');
    //   await localDataStoreWorker.start();
    // }
    // if (!!localDataStore) { // datastore is emulated
    //   await localDataStore.open();
    //   await localDataStore.bootFromPersistedState(defaultMiroirMetaModel);
    //   await localDataStore?.clear();
    //   // console.log('localDataStore.db',localDataStore.getdb());
    // }
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
  } else {
    root.render(
      <span>Production mode not implemented yet!</span>
    )
  }

}

if (container) {
  const root = createRoot(container);
  start(root);
}
