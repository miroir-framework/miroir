import * as React from "react";
import { useSelector } from 'react-redux';

import { mEntities, Mentity } from "../core/Entity";
import { MiroirReport, MiroirReports, ReportGetInstancesToDispay } from "../core/Report";
import { MTableComponent } from "./MTableComponent";
import { selectInstancesForEntity } from "../core/InstanceSlice";
import { EntityState } from "@reduxjs/toolkit";

export interface MiroirReportComponentProps {
  reportName: string;
};

export const MReportComponent = (
  props: MiroirReportComponentProps
) => {
  const miroirEntitiesState:EntityState<Mentity> = useSelector(selectInstancesForEntity('Entity'))
  const miroirReportsState:EntityState<MiroirReport> = useSelector(selectInstancesForEntity('Report'))
  const miroirEntities:mEntities = miroirEntitiesState?.entities?Object.values(miroirEntitiesState.entities):[];
  const miroirReports:MiroirReports = miroirReportsState?.entities?Object.values(miroirReportsState.entities):[];

  console.log("MiroirReportComponent miroirEntities",miroirEntities, "miroirReports", miroirReports);

  const currentMiroirReport: MiroirReport = miroirReports?.find(r=>r.name === props?.reportName)
  console.log("MiroirReportComponent currentMiroirReport",currentMiroirReport);
  const currentMiroirEntity: Mentity = miroirEntities?.find(e=>e?.name === currentMiroirReport?.definition?.entity)


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