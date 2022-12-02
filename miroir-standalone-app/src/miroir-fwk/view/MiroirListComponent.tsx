import { AgGridReact } from 'ag-grid-react';
import * as React from "react";
import { useSelector } from 'react-redux';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { MiroirEntities } from '../entities/entitySlice';
import { selectAllMiroirEntities } from '../state/selectors';
import { MiroirTableComponent } from './MiroirTableComponent';

// export interface MiroirTableComponentProps {
//   columnDefs:{"headerName": string, "field": string}[];
//   rowData:any[];
// };

export const MiroirListComponent = (
  // props: MiroirTableComponentProps
) => {
  const miroirEntities:MiroirEntities = useSelector(selectAllMiroirEntities)
  return (
    <div>
    {
      miroirEntities?.length > 0?
        <MiroirTableComponent
          columnDefs={
            miroirEntities?.find(e=>e?.name ==="Entity")
            ?.attributes?.map(
              (a)=>{return {"headerName": a?.defaultLabel, "field": a?.name}}
            )
          }
          rowData={miroirEntities}
          // rowData={miroirEntities?.find(e=>e?.name ==="Entity")?.attributes}
        ></MiroirTableComponent>
        :
        <span>pas d entités</span>
    }
   </div>
  );
}