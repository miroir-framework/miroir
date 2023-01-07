import { Container } from "@mui/material";
import { setupWorker } from "msw";
import * as React from "react";
import { createRoot } from 'react-dom/client';
import { Provider } from "react-redux";
import { v4 as uuidv4 } from 'uuid';
import { MClient } from "./api/MClient";
import { MServer } from "./api/server";
import { EntitySagas } from "./miroir-fwk/core/EntitySagas";
import { InstanceSagas } from "./miroir-fwk/core/InstanceSagas";
import { MreduxStore } from "./miroir-fwk/domain/store";
import { MComponent } from "./miroir-fwk/view/MComponent";

import entityEntity from "../src/miroir-fwk/assets/entities/Entity.json";
import entityReport from "../src/miroir-fwk/assets/entities/Report.json";
import reportEntityList from "../src/miroir-fwk/assets/reports/entityList.json";

const container = document.getElementById('root');
const root = createRoot(container);

async function start() {
  // Start our mock API server
  const mServer: MServer = new MServer();

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

  const mStore:MreduxStore = new MreduxStore(entitySagas, instanceSagas);
  mStore.sagaMiddleware.run(
    mStore.rootSaga, mStore
  );

  mStore.dispatch(entitySagas.mEntitySagaActionsCreators.fetchMiroirEntities())

  root.render(
    <Provider store={mStore.store}>
    <div>
      <h1>Miroir standalone demo app {uuidv4()}</h1>
      <Container maxWidth='xl'>
        <MComponent
          store={mStore.store}
        ></MComponent>
      </Container>
    </div>
    </Provider>
  );
}

start();