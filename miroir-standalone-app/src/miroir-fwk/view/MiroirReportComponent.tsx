import * as React from "react";
import { useSelector } from 'react-redux';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { selectInstancesForEntity, selectMiroirEntityInstances } from "../entities/instanceSlice";
import { MiroirEntities, MiroirEntity } from "../entities/Entity";
import { MiroirReport, MiroirReports, ReportGetInstancesToDispay } from "../entities/Report";
import { MiroirTableComponent } from "./MiroirTableComponent";

export interface MiroirReportComponentProps {
  reportName: string;
  // store:any;
};

export const MiroirReportComponent = (
  props: MiroirReportComponentProps
) => {
  const miroirEntities:MiroirEntities = useSelector(selectInstancesForEntity('Entity'))
  const miroirReports:MiroirReports = useSelector(selectInstancesForEntity('Report'))
  // const miroirEntities:MiroirEntities = useSelector(selectAllMiroirEntities)
  // const miroirReports:MiroirReports = useSelector(selectAllMiroirReports)
  // const miroirInstances = useSelector(selectMiroirEntityInstances);

  console.log("MiroirReportComponent",miroirEntities, miroirReports);

  const currentMiroirReport: MiroirReport = miroirReports?.find(r=>r.name === props?.reportName)
  console.log("MiroirReportComponent currentMiroirReport",currentMiroirReport);
  const currentMiroirEntity: MiroirEntity = miroirEntities?.find(e=>e?.name === currentMiroirReport?.definition?.entity)


  return (
    <div>
      <h3>
        props: {JSON.stringify(props)}
      </h3>
      {/* <h3>
        miroirInstances: {JSON.stringify(miroirInstances)}
      </h3> */}
      {/* <h3>
        {currentMiroirReport?.defaultLabel}
      </h3> */}
      {
        miroirReports?.length > 0?
          <MiroirTableComponent
            columnDefs={
              currentMiroirEntity?.attributes?.map(
                (a)=>{return {"headerName": a?.defaultLabel, "field": a?.name}}
              )
            }
            rowData={ReportGetInstancesToDispay(currentMiroirReport,miroirEntities)}
            // rowData={miroirEntities}
            // rowData={miroirEntities?.find(e=>e?.name ==="Entity")?.attributes}
          ></MiroirTableComponent>
          :
          <span>pas d entités</span>
      }
      {/* <h3>
        List of Entities
      </h3> */}
      {/* {
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
      } */}
   </div>
  );
}