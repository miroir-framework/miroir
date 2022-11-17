import * as React from "react";
import * as ReactDOM from "react-dom";
import TableComponent from "./miroir-fwk/view/TableComponent"
import entity from "./miroir-fwk/assets/entities/Entity.json"
import report from "./miroir-fwk/assets/entities/Report.json"
import { Card, CardContent, CardHeader, Container } from "@mui/material";


ReactDOM.render(
    <div>
      <h1>Miroir standalone demo app</h1>
      <Container maxWidth='lg'>
        <Card>
          <CardHeader>
            AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
          </CardHeader>
          <CardContent>
            <TableComponent
              columnDefs={
                entity.attributes.find(a=>a.name==="attributes").attributeFormat.map(
                  // (a)=>{return {"headerName": a.id.toString(), "field": "{a.id}"}}
                  (a)=>{return {"headerName": a.display, "field": a.name}}
                )
              }
              rowData={report.attributes}
            ></TableComponent>
          </CardContent>
        </Card>
      </Container>
    </div>,
    document.getElementById("root")
);