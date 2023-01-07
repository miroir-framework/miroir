import { CellClickedEvent, CellDoubleClickedEvent, CellEditingStartedEvent, CellEditingStoppedEvent, CellValueChangedEvent, RowDataUpdatedEvent } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import * as React from "react";

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

import SimpleEditor from './SimpleEditor';

export interface MTableComponentProps {
  columnDefs:{"headerName": string, "field": string}[];
  rowData:any[];
  children:any;
};

// function toto(e:CellClickedEvent) {
function onCellClicked(e:CellClickedEvent) {
  console.warn("onCellClicked",e)
}

function onCellValueChanged(e:CellValueChangedEvent) {
  console.warn("onCellValueChanged",e)
}

function onCellDoubleClicked(e:CellDoubleClickedEvent) {
  console.warn("onCellDoubleClicked",e)
}

function onCellEditingStarted(e:CellEditingStartedEvent) {
  console.warn("onCellEditingStarted",e)
}

function onCellEditingStopped(e:CellEditingStoppedEvent) {
  console.warn("onCellEditingStarted",e)
}

function onRowDataUpdated(e:RowDataUpdatedEvent) {
  // console.warn("onRowDataUpdated",e)
}


export const MTableComponent = (props: MTableComponentProps) => {
  return (
    <div
      id="tata"
      className="ag-theme-alpine"
      style={
        {
          height: '500px',
          width: 'auto'
        }
      }
    >
      {props.children}
      <AgGridReact
        columnDefs={props.columnDefs}
        rowData={props.rowData}
        onCellClicked={onCellClicked}
        onCellEditingStarted={onCellEditingStarted}
        onCellEditingStopped={onCellEditingStopped}
        onCellValueChanged={onCellValueChanged}
        onRowDataUpdated={onRowDataUpdated}
        onCellDoubleClicked={onCellDoubleClicked}
        getRowId={params=>params.data.uuid}
        defaultColDef={
          {
            editable: true,
            sortable: true,
            filter: true,
            resizable: true,
            cellEditor: SimpleEditor,
          }
        }
      >
      </AgGridReact>
    </div>
  );
}