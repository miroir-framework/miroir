import * as React from "react";
import * as ReactDOM from "react-dom";
import TableComponent from "./miroir-fwk/view/TableComponent"
import entity from "./miroir-fwk/assets/entities/Entity.json"
import report from "./miroir-fwk/assets/entities/Report.json"


ReactDOM.render(
    <div>
      <h1>Miroir standalone demo app</h1>
      <TableComponent
        columnDefs={
          entity.attributes.find(a=>a.name==="attributes").attributeFormat.map(
            // (a)=>{return {"headerName": a.id.toString(), "field": "{a.id}"}}
            (a)=>{return {"headerName": a.display, "field": a.name}}
          )
        }
        // columnDefs={[
        //   {"headerName": "Id", "field": "id"},
        //   {"headerName": "Name", "field": "name"},
        //   {"headerName": "Display", "field": "display"},
        //   {"headerName": "Type", "field": "type"}
        // ]}
        rowData={report.attributes}
        // rowData={[
        //   {
        //       "id": 1,
        //       "name": "name",
        //       "display": "Name",
        //       "type": "STRING"
        //   },
        //   {
        //       "id": 2,
        //       "name": "description",
        //       "display": "Description",
        //       "type": "STRING"
        //   },
        // ]}
      ></TableComponent>
    </div>,
    document.getElementById("root")
);