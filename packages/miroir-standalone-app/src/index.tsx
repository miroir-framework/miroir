import { Container, createTheme, ThemeProvider } from "@mui/material";
import { setupWorker } from "msw";
import { createRoot, Root } from "react-dom/client";
import { Provider } from "react-redux";
import { v4 as uuidv4 } from 'uuid';

import { defaultMiroirMetaModel, entityDefinitionEntityDefinition, MiroirConfig, miroirCoreStartup } from "miroir-core";

import miroirConfig from "assets/miroirConfig.json";
import { MiroirContextReactProvider } from "miroir-fwk/4_view/MiroirContextReactProvider";
import { RootComponent } from "miroir-fwk/4_view/RootComponent";
import { createMswRestServer, createReduxStoreAndRestClient } from "miroir-fwk/createMswRestServer";
import { miroirAppStartup } from "startup";
import { blue, red } from "@mui/material/colors";

console.log("entityDefinitionEntityDefinition", JSON.stringify(entityDefinitionEntityDefinition));
const container = document.getElementById("root");

// ###################################################################################
async function start(root:Root) {
  // Start our mock API server
  // const mServer: IndexedDbObjectStore = new IndexedDbObjectStore(miroirConfig.rootApiUrl);

  miroirAppStartup();
  miroirCoreStartup();

  if (process.env.NODE_ENV === "development") {

    const {
      reduxStore: mReduxStore,
      localAndRemoteController,
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
          main: red[500],
        },
      },
      spacing: 2,
      components: {
        MuiList: {
          defaultProps:{
            style: {border: `10px dashed ${blue[500]}`,}
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
      <ThemeProvider theme={theme}>
        <Provider store={mReduxStore.getInnerStore()}>
        <div>
          <h1>Miroir standalone demo app {uuidv4()}</h1>
          {/* <h1>Miroir standalone demo app</h1> */}
          <Container maxWidth="xl">
            <MiroirContextReactProvider miroirContext={myMiroirContext} domainController={domainController}>
              {/* store={mReduxStore.getInnerStore() */}
              <RootComponent
                // reportName="AuthorList"
                // reportName="BookList"
                reportName="EntityList"
              ></RootComponent>
            </MiroirContextReactProvider>
          </Container>
        </div>
      </Provider>
      
      </ThemeProvider>
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
