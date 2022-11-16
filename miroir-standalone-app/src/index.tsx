import * as React from "react";
import * as ReactDOM from "react-dom";
import entityEntity from "./miroir-fwk/assets/entities/Entity.json";
import TableComponent from "./miroir-fwk/view/TableComponent"

ReactDOM.render(
    <div>
      <h1>Miroir standalone demo app</h1>
      <TableComponent></TableComponent>
    </div>,
    document.getElementById("root")
);