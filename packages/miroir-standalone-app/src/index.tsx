import { Container } from "@mui/material";
import { setupWorker } from "msw";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { v4 as uuidv4 } from 'uuid';

import { entityEntity, MiroirConfig, miroirCoreStartup } from "miroir-core";

import miroirConfig from "assets/miroirConfig.json";
import { MiroirContextReactProvider } from "miroir-fwk/4_view/MiroirContextReactProvider";
import { RootComponent } from "miroir-fwk/4_view/RootComponent";
import { createMswStore } from "miroir-fwk/createStore";
import { miroirAppStartup } from "startup";

console.log("entityEntity", JSON.stringify(entityEntity));
const container = document.getElementById("root");
const root = createRoot(container);


// ###################################################################################
async function start() {
  // Start our mock API server
  // const mServer: IndexedDbObjectStore = new IndexedDbObjectStore(miroirConfig.rootApiUrl);

  miroirAppStartup();
  miroirCoreStartup();

  if (process.env.NODE_ENV === "development") {

    const {
      localDataStore,
      localDataStoreWorker,
      localDataStoreServer,
      reduxStore: mReduxStore,
      localAndRemoteController,
      domainController,
      miroirContext: myMiroirContext,
    } = await createMswStore(miroirConfig as MiroirConfig, 'browser', window.fetch.bind(window), setupWorker);

    // const mswWorker = setupWorker(...mServer.handlers);
    if (!!localDataStoreWorker) {
      console.log('##############################################');
      localDataStoreWorker.printHandlers(); // Optional: nice for debugging to see all available route handlers that will be intercepted
      console.log('##############################################');
      await localDataStoreWorker.start();
    }
    if (!!localDataStore) { // datastore is emulated
      await localDataStore.open();
      await localDataStore.init();
      await localDataStore?.clear();
      console.log('localDataStore.db',localDataStore.getdb());
    }

    // load Miroir Configuration
    // await domainController.handleDomainAction({actionName: "replace",actionType:"DomainModelAction"});

    root.render(
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
    );
  } else {
    root.render(
      <span>Production mode not implemented yet!</span>
    )
  }

}

start();