import * as React from "react";
import {TableComponent} from "./miroir-fwk/view/TableComponent"
import { Card, CardContent, CardHeader, Container } from "@mui/material";
import { store } from '../src/miroir-fwk/state/store'
import {Provider} from "react-redux";

import { createRoot } from 'react-dom/client';
const container = document.getElementById('root');
const root = createRoot(container);
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
            <TableComponent
              columnDefs={
                store.getState()
                .entities?.find(e=>e.name ==="Entity")
                .attributes?.find((a)=>a.name==="attributes")
                .attributeFormat?.map(
                  (a)=>{return {"headerName": a.display, "field": a.name}}
                )
              }
              rowData={store.getState().entities.find(e=>e.name ==="Entity").attributes}
            ></TableComponent>
          </CardContent>
        </Card>
      </Container>
    </div>
    </Provider>
  );