import { Container } from "@mui/material";
import { setupWorker } from "msw";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";

import { RestClient } from "miroir-core";

import {
  DataControllerInterface,
  entityEntity,
  entityReport,
  DataStoreController,
  MiroirContext,
  reportEntityList
} from "miroir-core";
import { miroirCoreStartup } from "miroir-core";

import { MiroirContextReactProvider } from "miroir-fwk/4_view/MiroirContextReactProvider";
import { miroirAppStartup } from "startup";
import { ReduxStore } from "miroir-fwk/4_services/localStore/ReduxStore";
import { EntityRemoteAccessReduxSaga } from "miroir-fwk/4_services/remoteStore/EntityRemoteAccessReduxSaga";
import { InstanceRemoteAccessReduxSaga } from "miroir-fwk/4_services/remoteStore/InstanceRemoteAccessReduxSaga";
import { IndexedDbObjectStore } from "miroir-fwk/4_services/remoteStore/IndexedDbObjectStore";
import { MComponent } from "miroir-fwk/4_view/MComponent";
import RemoteStoreClient from "miroir-fwk/4_services/remoteStore/RemoteStoreNetworkClient";


console.log("entityEntity", JSON.stringify(entityEntity));
const container = document.getElementById("root");
const root = createRoot(container);

async function start() {
  // Start our mock API server
  const mServer: IndexedDbObjectStore = new IndexedDbObjectStore();

  await mServer.createObjectStore(["Entity", "Instance", "Report"]);
  await mServer.localIndexedStorage.putValue("Entity", entityReport);
  await mServer.localIndexedStorage.putValue("Entity", entityEntity);
  await mServer.localIndexedStorage.putValue("Report", reportEntityList);

  // ConfigurationService.registerPackageConfiguration({packageName:packageJson.name,packageVersion:packageJson.version})
  miroirAppStartup();
  miroirCoreStartup();

  if (process.env.NODE_ENV === "development") {
    const worker = setupWorker(...mServer.handlers);
    worker.printHandlers(); // Optional: nice for debugging to see all available route handlers that will be intercepted
    await worker.start();
  }

  const client:RestClient = new RestClient(window.fetch);
  const remoteStoreClient = new RemoteStoreClient(client);
  const entitySagas: EntityRemoteAccessReduxSaga = new EntityRemoteAccessReduxSaga(remoteStoreClient);
  const instanceSagas: InstanceRemoteAccessReduxSaga = new InstanceRemoteAccessReduxSaga(remoteStoreClient);

  const mReduxStore: ReduxStore = new ReduxStore(entitySagas, instanceSagas);
  mReduxStore.run();
  
  const miroirContext = new MiroirContext();

  const dataController: DataControllerInterface = new DataStoreController(miroirContext,mReduxStore, mReduxStore); // ReduxStore implements both local and remote Data Store access.
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
