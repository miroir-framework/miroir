import { AgGridReact } from 'ag-grid-react';
import * as React from "react";

import { Card, CardContent, CardHeader, Container } from "@mui/material";
import 'ag-grid-community/styles//ag-grid.css';
import 'ag-grid-community/styles//ag-theme-alpine.css';

export interface TableComponentProps {
  columnDefs:{"headerName": string, "field": string}[];
  rowData:any[];
};

export default class TableComponent 
  extends React.Component<
    TableComponentProps,
    TableComponentProps
  > {
  constructor (props:TableComponentProps){
    super(props);

    this.state = props;
  }
  render() {
    return (
      <Container maxWidth='lg'>
        <Card>
          <CardHeader>
            AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
          </CardHeader>
          <CardContent>
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
                  columnDefs={this.state.columnDefs}
                  rowData={this.state.rowData}
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
          </CardContent>
        </Card>
      </Container>
    );
  }
}