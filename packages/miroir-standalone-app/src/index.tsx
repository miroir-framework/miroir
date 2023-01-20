import { Container } from "@mui/material";
import { setupWorker } from "msw";
import * as React from "react";
import { createRoot } from 'react-dom/client';
import { Provider } from "react-redux";
import { v4 as uuidv4 } from 'uuid';


import { ReduxStore } from "src/miroir-fwk/4_services/localStore/ReduxStore";
import { EntitySagas } from "src/miroir-fwk/4_services/remoteStore/EntitySagas";
import { InstanceSagas } from "src/miroir-fwk/4_services/remoteStore/InstanceSagas";
import { MClient } from "src/miroir-fwk/4_services/remoteStore/MClient";
import { MDevServer } from "src/miroir-fwk/4_services/remoteStore/MDevServer";
import { MComponent } from "src/miroir-fwk/4_view/MComponent";

import entityEntity from "src/miroir-fwk/assets/entities/Entity.json";
import entityReport from "src/miroir-fwk/assets/entities/Report.json";
import reportEntityList from "src/miroir-fwk/assets/reports/entityList.json";
import { DataControllerInterface } from "src/miroir-fwk/0_interfaces/3_controllers/DataControllerInterface";
import { LocalDataStoreController } from "src/miroir-fwk/3_controllers/LocalDataStoreController";
import { ErrorLogProvider } from "src/miroir-fwk/4_view/ErrorLogReactService";

const container = document.getElementById('root');
const root = createRoot(container);

async function start() {
  // Start our mock API server
  const mServer: MDevServer = new MDevServer();

  await mServer.createObjectStore(["Entity","Instance","Report"]);
  await mServer.localIndexedStorage.putValue("Entity",entityReport);
  await mServer.localIndexedStorage.putValue("Entity",entityEntity);
  await mServer.localIndexedStorage.putValue("Report",reportEntityList);

  if (process.env.NODE_ENV === 'development') {
    const worker = setupWorker(...mServer.handlers)
    worker.printHandlers() // Optional: nice for debugging to see all available route handlers that will be intercepted
    await worker.start()
  }

  const client = new MClient(window.fetch);
  const entitySagas: EntitySagas = new EntitySagas(client);
  const instanceSagas: InstanceSagas = new InstanceSagas(client);

  const mReduxStore:ReduxStore = new ReduxStore(entitySagas, instanceSagas);
  mReduxStore.run();

  const dataController: DataControllerInterface = new LocalDataStoreController(mReduxStore,mReduxStore); // ReduxStore implements both local and remote Data Store access.
  dataController.loadConfigurationFromRemoteDataStore();

  root.render(
    <Provider store={mReduxStore.getInnerStore()}>
    <div>
      {/* <h1>Miroir standalone demo app {uuidv4()}</h1> */}
      <h1>Miroir standalone demo app</h1>
      <Container maxWidth='xl'>
        <ErrorLogProvider>
          <MComponent
            store={mReduxStore.getInnerStore()}
            reduxStore={mReduxStore}
          ></MComponent>
        </ErrorLogProvider>
      </Container>
    </div>
    </Provider>
  );
}

start();