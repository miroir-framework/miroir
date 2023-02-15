import { Container } from "@mui/material";
import { setupWorker } from "msw";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";

import {
  DataControllerInterface,
  DataStoreController,
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
  RemoteStoreClient 
} from "miroir-redux";

import { MComponent } from "miroir-fwk/4_view/MComponent";
import { MiroirContextReactProvider } from "miroir-fwk/4_view/MiroirContextReactProvider";
import miroirConfig from "miroir-fwk/assets/miroirConfig.json";
import { miroirAppStartup } from "startup";

console.log("entityEntity", JSON.stringify(entityEntity));
const container = document.getElementById("root");
const root = createRoot(container);

async function start() {
  // Start our mock API server
  const mServer: IndexedDbObjectStore = new IndexedDbObjectStore(miroirConfig.rootApiUrl);

  await mServer.createObjectStore(["Entity", "Instance", "Report"]);
  await mServer.localIndexedStorage.putValue("Entity", entityReport);
  await mServer.localIndexedStorage.putValue("Entity", entityEntity);
  await mServer.localIndexedStorage.putValue("Report", reportEntityList);

  miroirAppStartup();
  miroirCoreStartup();

  if (process.env.NODE_ENV === "development") {
    const worker = setupWorker(...mServer.handlers);
    worker.printHandlers(); // Optional: nice for debugging to see all available route handlers that will be intercepted
    await worker.start();
  }

  const client: RestClient = new RestClient(window.fetch);
  const remoteStoreClient = new RemoteStoreClient(miroirConfig.rootApiUrl, client);
  const instanceSagas: InstanceRemoteAccessReduxSaga = new InstanceRemoteAccessReduxSaga(
    miroirConfig.rootApiUrl,
    remoteStoreClient
  );

  const mReduxStore: ReduxStore = new ReduxStore(instanceSagas);
  mReduxStore.run();

  const miroirContext = new MiroirContext();

  const dataController: DataControllerInterface = new DataStoreController(miroirContext, mReduxStore, mReduxStore); // ReduxStore implements both local and remote Data Store access.
  dataController.loadConfigurationFromRemoteDataStore();

  root.render(
    <Provider store={mReduxStore.getInnerStore()}>
      <div>
        {/* <h1>Miroir standalone demo app {uuidv4()}</h1> */}
        <h1>Miroir standalone demo app</h1>
        <Container maxWidth="xl">
          <MiroirContextReactProvider miroirContext={miroirContext}>
            <MComponent store={mReduxStore.getInnerStore()} reduxStore={mReduxStore}></MComponent>
          </MiroirContextReactProvider>
        </Container>
      </div>
    </Provider>
  );
}

start();
