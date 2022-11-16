import * as React from "react";
import {AgGridReact} from 'ag-grid-react';

import 'ag-grid-community/styles//ag-grid.css';
import 'ag-grid-community/styles//ag-theme-alpine.css';

export default class UserComponent extends React.Component<{},{columnDefs:any[],rowData:any[]}> {
  constructor (props: {} | Readonly<{}>){
    super(props);

    this.state = {
      columnDefs: [
        {headerName: "Id", field: "id"},
        {headerName: "Name", field: "name"},
        {headerName: "Display", field: "display"},
        {headerName: "Type", field: "type"},
        
      ],
      rowData: [
        {
            "id": 1,
            "name": "name",
            "display": "Name",
            "type": "STRING"
        },
        {
            "id": 2,
            "name": "description",
            "display": "Description",
            "type": "STRING"
        },
      ]
    };
  }
  render() {
    // const gridOptions = {
    //   rowData: null,
    //   columnDefs: this.state.columnDefs,
    //   defaultColDef: {
    //     editable: true,
    //     sortable: true,
    //     filter: true,
    //     resizable: true,
    //   },
    // };

    return (
      // height: '500px',
      <div
        className="ag-theme-alpine"
        style={
          {
            height: '500px',
            width: '600px'
          }
        }
      >
        <AgGridReact
          columnDefs={this.state.columnDefs}
          rowData={this.state.rowData}>
        </AgGridReact>
      </div>
    );
  }
}