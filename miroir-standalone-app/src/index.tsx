import { Container } from "@mui/material";
import * as React from "react";
import { Provider } from "react-redux";
import { store } from '../src/miroir-fwk/state/store';

import { createRoot } from 'react-dom/client';
import { fetchMiroirEntities } from "./miroir-fwk/entities/entitySlice";
import { MiroirComponent } from "./miroir-fwk/view/MiroirComponent";
const container = document.getElementById('root');
const root = createRoot(container);



async function start() {
  // Start our mock API server
  if (process.env.NODE_ENV === 'development') {
    const { worker } = require('./api/server')
    await worker.start()
  }

  // await worker.start({ onUnhandledRequest: 'bypass' })
  store.dispatch(fetchMiroirEntities())

  root.render(
    <Provider store={store}>
      <div>
        <h1>Miroir standalone demo app</h1>
        <Container maxWidth='lg'>
          <MiroirComponent></MiroirComponent>
          {/* <h3>
            {JSON.stringify(miroirEntities)}
          </h3> */
          }
          {/* <Card>
            <CardHeader>
              AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
            </CardHeader>
            <CardContent>
              {
                selectAllMiroirEntities(store.getState().entities)?.length > 0?
                  <MiroirTableComponent
                    columnDefs={
                      selectAllMiroirEntities(store.getState().entities)?.find(e=>e?.name ==="Entity")
                      .attributes?.find((a)=>a?.name==="attributes")
                      .attributeFormat?.map(
                        (a)=>{return {"headerName": a?.display, "field": a?.name}}
                      )
                    }
                    rowData={selectAllMiroirEntities(store.getState().entities)?.find(e=>e?.name ==="Entity")?.attributes}
                  ></MiroirTableComponent>
                :
                  <span>pas d entités</span>
              }
            </CardContent>
          </Card> */}
        </Container>
      </div>
    </Provider>
  );
}

start();