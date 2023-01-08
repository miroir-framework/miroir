import { Container } from "@mui/material";
import { setupWorker } from "msw";
import * as React from "react";
import { createRoot } from 'react-dom/client';
import { Provider } from "react-redux";
import { v4 as uuidv4 } from 'uuid';

import { MDataControllerI } from "src/miroir-fwk/0_interfaces/3_controllers/MDataController";

import { MreduxStore } from "src/miroir-fwk/4_storage/local/MReduxStore";
import { EntitySagas } from "src/miroir-fwk/4_storage/remote/EntitySagas";
import { InstanceSagas } from "src/miroir-fwk/4_storage/remote/InstanceSagas";
import { MClient } from "src/miroir-fwk/4_storage/remote/MClient";
import { MDevServer } from "src/miroir-fwk/4_storage/remote/MDevServer";
import { MComponent } from "src/miroir-fwk/4_view/MComponent";
import { MDataController } from "src/miroir-fwk/3_controllers/MDataController";

import entityEntity from "src/miroir-fwk/assets/entities/Entity.json";
import entityReport from "src/miroir-fwk/assets/entities/Report.json";
import reportEntityList from "src/miroir-fwk/assets/reports/entityList.json";

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

  const mReduxStore:MreduxStore = new MreduxStore(entitySagas, instanceSagas);
  mReduxStore.run();
  // mReduxStore.sagaMiddleware.run(
  //   mReduxStore.rootSaga, mReduxStore
  // );

  // mReduxStore.dispatch(entitySagas.mEntitySagaActionsCreators.fetchMiroirEntities())
  const dataController: MDataControllerI = new MDataController(mReduxStore);
  dataController.loadDataFromDataStore();
  // mReduxStore.fetchFromApiAndReplaceInstancesForAllEntities();

  root.render(
    <Provider store={mReduxStore.store}>
    <div>
      <h1>Miroir standalone demo app {uuidv4()}</h1>
      <Container maxWidth='xl'>
        <MComponent
          store={mReduxStore.store}
        ></MComponent>
      </Container>
    </div>
    </Provider>
  );
}

start();