import { AgGridReact } from 'ag-grid-react';
import * as React from "react";

import 'ag-grid-community/styles//ag-grid.css';
import 'ag-grid-community/styles//ag-theme-alpine.css';

export interface TableComponentProps {
  columnDefs:{"headerName": string, "field": string}[];
  rowData:any[];
};

// export default class TableComponent 
//   extends React.Component<
//     TableComponentProps,
//     {}
//   > {
//   constructor (props:TableComponentProps){
//     super(props);

//     // this.state = props;
//   }
// render() {
export const TableComponent = (props: TableComponentProps) => {
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
        // columnDefs={this.state.columnDefs}
        // rowData={this.state.rowData}
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