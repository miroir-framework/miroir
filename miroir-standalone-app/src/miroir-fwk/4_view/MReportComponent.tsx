import * as React from "react";
import { useSelector } from 'react-redux';
import { EntityState } from "@reduxjs/toolkit";

import { MEntityDefinition } from "src/miroir-fwk/0_interfaces/1_core/Entity";
import { MiroirReport, MiroirReports } from "src/miroir-fwk/0_interfaces/1_core/Report";
import { MTableComponent } from "./MTableComponent";
import { selectInstancesForEntity } from "src/miroir-fwk/4_storage/local/MInstanceSlice";
import { ReportGetInstancesToDispay } from "src/miroir-fwk/1_core/Report";

export interface MiroirReportComponentProps {
  reportName: string;
};

export const MReportComponent = (
  props: MiroirReportComponentProps
) => {
  const miroirEntitiesState:EntityState<MEntityDefinition> = useSelector(selectInstancesForEntity('Entity'))
  const miroirReportsState:EntityState<MiroirReport> = useSelector(selectInstancesForEntity('Report'))
  const miroirEntities:MEntityDefinition[] = miroirEntitiesState?.entities?Object.values(miroirEntitiesState.entities):[];
  const miroirReports:MiroirReports = miroirReportsState?.entities?Object.values(miroirReportsState.entities):[];

  console.log("MiroirReportComponent miroirEntities",miroirEntities, "miroirReports", miroirReports);

  const currentMiroirReport: MiroirReport = miroirReports?.find(r=>r.name === props?.reportName)
  console.log("MiroirReportComponent currentMiroirReport",currentMiroirReport);
  const currentMiroirEntity: MEntityDefinition = miroirEntities?.find(e=>e?.name === currentMiroirReport?.definition?.entity)


  return (
    <div>
      <h3>
        props: {JSON.stringify(props)}
      </h3>
      {
        miroirReports?.length > 0?
          <div>
            <MTableComponent
              columnDefs={
                currentMiroirEntity?.attributes?.map(
                  (a)=>{return {"headerName": a?.defaultLabel, "field": a?.name}}
                )
              }
              rowData={ReportGetInstancesToDispay(currentMiroirReport,miroirEntities)}
            >
            </MTableComponent>
          </div>
        :
          <span>pas d entités</span>
      }
   </div>
  );
}