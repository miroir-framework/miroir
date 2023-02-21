import { Container } from "@mui/material";
import { setupWorker } from "msw";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { v4 as uuidv4 } from 'uuid';

import {
  entityEntity,
  entityReport, miroirCoreStartup,
  reportEntityList,reportReportList
} from "miroir-core";

import { MComponent } from "miroir-fwk/4_view/MComponent";
import { MiroirContextReactProvider } from "miroir-fwk/4_view/MiroirContextReactProvider";
import miroirConfig from "miroir-fwk/assets/miroirConfig.json";
import { createMswStore } from "miroir-fwk/createStore";
import { miroirAppStartup } from "startup";

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
    await mServer.localIndexedDb.putValue("Report", reportReportList);
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
        <h1>Miroir standalone demo app {uuidv4()}</h1>
        {/* <h1>Miroir standalone demo app</h1> */}
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
