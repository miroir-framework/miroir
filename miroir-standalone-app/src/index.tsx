import * as React from "react";
import {MiroirTableComponent} from "./miroir-fwk/view/TableComponent"
import { Card, CardContent, CardHeader, Container } from "@mui/material";
import { store } from '../src/miroir-fwk/state/store'
import {Provider} from "react-redux";

import { createRoot } from 'react-dom/client';
const container = document.getElementById('root');
const root = createRoot(container);


async function start() {
  // Start our mock API server
  if (process.env.NODE_ENV === 'development') {
    const { worker } = require('./api/server')
    await worker.start()
  }

  // await worker.start({ onUnhandledRequest: 'bypass' })

  // store.dispatch(fetchUsers())

  root.render(
    <Provider store={store}>
      <div>
        <h1>Miroir standalone demo app</h1>
        <Container maxWidth='lg'>
          <h3>
            {JSON.stringify(store.getState().entities)}
          </h3>
          <Card>
            <CardHeader>
              AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
            </CardHeader>
            <CardContent>
              <MiroirTableComponent
                columnDefs={
                  store.getState()
                  .entities?.find(e=>e.name ==="Entity")
                  .attributes?.find((a)=>a.name==="attributes")
                  .attributeFormat?.map(
                    (a)=>{return {"headerName": a.display, "field": a.name}}
                  )
                }
                rowData={store.getState().entities.find(e=>e.name ==="Entity").attributes}
              ></MiroirTableComponent>
            </CardContent>
          </Card>
        </Container>
      </div>
    </Provider>
  );
}

start();