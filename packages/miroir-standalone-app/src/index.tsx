import { Container } from "@mui/material";
import { setupWorker } from "msw";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";

import { ReduxStore } from "miroir-fwk/4_services/localStore/ReduxStore";
import { EntitySagas } from "miroir-fwk/4_services/remoteStore/EntitySagas";
import { InstanceSagas } from "miroir-fwk/4_services/remoteStore/InstanceSagas";
import { MClient } from "miroir-fwk/4_services/remoteStore/MClient";
import { MDevServer } from "miroir-fwk/4_services/remoteStore/MDevServer";
// import { ErrorLogProvider } from "miroir-fwk/4_view/ErrorLogReactService";
import { MComponent } from "miroir-fwk/4_view/MComponent";

import {
  DataControllerInterface,
  entityEntity,
  entityReport,
  ErrorLogService,
  ErrorLogServiceInterface,
  LocalDataStoreController,
  MiroirContext,
  reportEntityList,
} from "miroir-core";
import { MiroirContextReactProvider } from "miroir-fwk/4_view/MiroirContextReactProvider";

console.log("entityEntity", JSON.stringify(entityEntity));
const container = document.getElementById("root");
const root = createRoot(container);

async function start() {
  // Start our mock API server
  const mServer: MDevServer = new MDevServer();

  await mServer.createObjectStore(["Entity", "Instance", "Report"]);
  await mServer.localIndexedStorage.putValue("Entity", entityReport);
  await mServer.localIndexedStorage.putValue("Entity", entityEntity);
  await mServer.localIndexedStorage.putValue("Report", reportEntityList);

  if (process.env.NODE_ENV === "development") {
    const worker = setupWorker(...mServer.handlers);
    worker.printHandlers(); // Optional: nice for debugging to see all available route handlers that will be intercepted
    await worker.start();
  }

  const client = new MClient(window.fetch);
  const entitySagas: EntitySagas = new EntitySagas(client);
  const instanceSagas: InstanceSagas = new InstanceSagas(client);

  const mReduxStore: ReduxStore = new ReduxStore(entitySagas, instanceSagas);
  mReduxStore.run();
  
  const errorLogService: ErrorLogServiceInterface = new ErrorLogService();
  const miroirContext = new MiroirContext(errorLogService);

  const dataController: DataControllerInterface = new LocalDataStoreController(miroirContext,mReduxStore, mReduxStore); // ReduxStore implements both local and remote Data Store access.
  dataController.loadConfigurationFromRemoteDataStore();

  root.render(
    <Provider store={mReduxStore.getInnerStore()}>
      <div>
        {/* <h1>Miroir standalone demo app {uuidv4()}</h1> */}
        <h1>Miroir standalone demo app</h1>
        <Container maxWidth="xl">
          <MiroirContextReactProvider miroirContext={miroirContext}>
            {/* <ErrorLogProvider pushError={pushError}> */}
            <MComponent store={mReduxStore.getInnerStore()} reduxStore={mReduxStore}></MComponent>
            {/* </ErrorLogProvider> */}
          </MiroirContextReactProvider>
        </Container>
      </div>
    </Provider>
  );
}

start();
