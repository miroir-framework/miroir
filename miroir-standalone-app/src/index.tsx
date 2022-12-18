import { Container } from "@mui/material";
import { setupWorker } from "msw";
import * as React from "react";
import { createRoot } from 'react-dom/client';
import { v4 as uuidv4 } from 'uuid';

// import { EntitySlice, mEntityActionsCreators } from "src/miroir-fwk/entities/entitySlice";
// import { store } from 'src/miroir-fwk/state/store';
// import { MiroirComponent } from "src/miroir-fwk/view/MiroirComponent";
// import { MiroirComponent } from "src/miroir-fwk/view/MiroirComponent";
import { Provider } from "react-redux";
import { handlers } from "src/api/server";
import { MClient } from "./api/MClient";
import { EntitySlice, mEntityActionsCreators } from "./miroir-fwk/entities/entitySlice";
import { InstanceSlice } from "./miroir-fwk/entities/instanceSlice";
import { Mstore } from "./miroir-fwk/state/store";
import { MiroirComponent } from "./miroir-fwk/view/MiroirComponent";

const container = document.getElementById('root');
const root = createRoot(container);

// const sagaMiddleware = createSagaMiddleware()


async function start() {
  // Start our mock API server
  if (process.env.NODE_ENV === 'development') {
    // export const worker = setupWorker(...handlers)
// worker.printHandlers() // Optional: nice for debugging to see all available route handlers that will be intercepted

    // const serverHandlers = require('./api/server')
    const worker = setupWorker(...handlers)
    await worker.start()
  }

  const client = new MClient(window.fetch);
  const entitySlice: EntitySlice = new EntitySlice(client);
  const instanceSlice: InstanceSlice = new InstanceSlice(client);

  const mStore:Mstore = new Mstore(entitySlice, instanceSlice);
  // mStore.sagaMiddleware.run(launchStore(entitySlice,instanceSlice))
  mStore.sagaMiddleware.run(
    mStore.rootSaga, mStore
  );

  mStore.dispatch(mEntityActionsCreators.fetchMiroirEntities())

  root.render(
    <Provider store={mStore.store}>
    <div>
      <h1>Miroir standalone demo app {uuidv4()}</h1>
      <Container maxWidth='xl'>
        <MiroirComponent
          store={mStore.store}
        ></MiroirComponent>
      </Container>
    </div>
    </Provider>
  );
}

start();