import { Container } from "@mui/material";
import { setupWorker } from "msw";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";

import {
  DataControllerInterface,
  DataStoreController,
  DomainActionInterface,
  DomainController,
  entityEntity,
  entityReport,
  MiroirContext,
  miroirCoreStartup,
  reportEntityList,
  RestClient,
} from "miroir-core";
import { 
  IndexedDbObjectStore, 
  InstanceRemoteAccessReduxSaga, 
  ReduxStore, 
  RemoteStoreNetworkRestClient 
} from "miroir-redux";

import { MComponent } from "miroir-fwk/4_view/MComponent";
import { MiroirContextReactProvider } from "miroir-fwk/4_view/MiroirContextReactProvider";
import miroirConfig from "miroir-fwk/assets/miroirConfig.json";
import { miroirAppStartup } from "startup";
import { createMswStore } from "miroir-fwk/createStore";

console.log("entityEntity", JSON.stringify(entityEntity));
const container = document.getElementById("root");
const root = createRoot(container);

async function start() {
  // Start our mock API server
  // const mServer: IndexedDbObjectStore = new IndexedDbObjectStore(miroirConfig.rootApiUrl);


  miroirAppStartup();
  miroirCoreStartup();

  let mReduxStore,myMiroirContext;
  if (process.env.NODE_ENV === "development") {

    const {mServer, worker, reduxStore, dataController, domainController, miroirContext} = createMswStore(
      miroirConfig.rootApiUrl,
      window.fetch.bind(window),
      setupWorker
    );
    mReduxStore = reduxStore;
    myMiroirContext = miroirContext;

    // const mswWorker = setupWorker(...mServer.handlers);
    console.log('##############################################');
    worker.printHandlers(); // Optional: nice for debugging to see all available route handlers that will be intercepted
    console.log('##############################################');
    await worker.start();
    await mServer.createObjectStore(["Entity", "Instance", "Report"]);
    await mServer.localIndexedDb.putValue("Entity", entityEntity);
    await mServer.localIndexedDb.putValue("Entity", entityReport);
    dataController.loadConfigurationFromRemoteDataStore();
    domainController.handleDomainAction({
      actionName:'create',
      objects:[{entity:'Report',instances:[reportEntityList]}]
    })
  
    dataController.loadConfigurationFromRemoteDataStore();
  }

  root.render(
    <Provider store={mReduxStore.getInnerStore()}>
      <div>
        {/* <h1>Miroir standalone demo app {uuidv4()}</h1> */}
        <h1>Miroir standalone demo app</h1>
        <Container maxWidth="xl">
          <MiroirContextReactProvider miroirContext={myMiroirContext}>
            <MComponent store={mReduxStore.getInnerStore()} reduxStore={mReduxStore}></MComponent>
          </MiroirContextReactProvider>
        </Container>
      </div>
    </Provider>
  );
}

start();
