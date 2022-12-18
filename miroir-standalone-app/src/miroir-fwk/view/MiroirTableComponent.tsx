import { AgGridReact } from 'ag-grid-react';
import * as React from "react";

// import 'ag-grid-community/styles/ag-grid.css';
// import 'ag-grid-community/styles/ag-theme-alpine.css';

export interface MiroirTableComponentProps {
  columnDefs:{"headerName": string, "field": string}[];
  rowData:any[];
};

export const MiroirTableComponent = (props: MiroirTableComponentProps) => {
  return (
    <div
      className="ag-theme-alpine"
      style={
        {
          height: '500px',
          width: 'auto'
        }
      }
    >
      <AgGridReact
        columnDefs={props.columnDefs}
        rowData={props.rowData}
        defaultColDef={
          {
            editable: true,
            sortable: true,
            filter: true,
            resizable: true
          }
        }
      >
      </AgGridReact>
    </div>
  );
}