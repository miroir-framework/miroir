import { Container } from "@mui/material";
import * as React from "react";
import { createRoot } from 'react-dom/client';
import { Provider } from "react-redux";

import { miroirEntitiesActions } from "src/miroir-fwk/entities/entitySlice";
import { store } from 'src/miroir-fwk/state/store';
import { MiroirComponent } from "src/miroir-fwk/view/MiroirComponent";
const container = document.getElementById('root');
const root = createRoot(container);

// const sagaMiddleware = createSagaMiddleware()


async function start() {
  // Start our mock API server
  if (process.env.NODE_ENV === 'development') {
    const { worker } = require('./api/server')
    await worker.start()
  }

  // await worker.start({ onUnhandledRequest: 'bypass' })
  // store.dispatch(fetchMiroirEntities())
  store.dispatch({type: miroirEntitiesActions.fetchMiroirEntities})

  root.render(
    <Provider store={store}>
      <div>
        <h1>Miroir standalone demo app</h1>
        <Container maxWidth='lg'>
          <MiroirComponent></MiroirComponent>
        </Container>
      </div>
    </Provider>
  );
}

start();