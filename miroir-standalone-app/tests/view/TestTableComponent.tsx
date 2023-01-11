import { EntityState } from "@reduxjs/toolkit";
import * as React from "react";
import { useSelector } from 'react-redux';

import { MEntityDefinition } from "src/miroir-fwk/0_interfaces/1_core/Entity";
import { MiroirReport, MiroirReports } from "src/miroir-fwk/0_interfaces/1_core/Report";
import { selectInstancesForEntity } from "src/miroir-fwk/4_storage/local/InstanceSlice";

export interface MiroirReportComponentProps {
  reportName: string;
};

export const TestTableComponent = (
  // props: MiroirReportComponentProps
) => {
  const miroirEntitiesState:EntityState<MEntityDefinition> = useSelector(selectInstancesForEntity('Entity'))
  const miroirReportsState:EntityState<MiroirReport> = useSelector(selectInstancesForEntity('Report'))
  const miroirEntities:MEntityDefinition[] = miroirEntitiesState?.entities?Object.values(miroirEntitiesState.entities):[];
  const miroirReports:MiroirReports = miroirReportsState?.entities?Object.values(miroirReportsState.entities):[];

  console.log("TestTableComponent miroirEntities",miroirEntities, "miroirReports", miroirReports);

  // const currentMiroirReport: MiroirReport = miroirReports?.find(r=>r.name === props?.reportName)
  // console.log("TestTableComponent currentMiroirReport",currentMiroirReport);
  const currentMiroirEntity: MEntityDefinition = miroirEntities?.find(e=>e?.name === 'Entity')


  return (
    <div>
      {/* <h3>
        miroirEntities: {JSON.stringify(miroirEntities)}
        currentMiroirEntity: {JSON.stringify(currentMiroirEntity)}
      </h3> */}
      {miroirEntities?.length > 0 && !!currentMiroirEntity? (
        <div>
          <table>
            <tr key='head'>
              {
                currentMiroirEntity?.attributes?.map(
                  (a, key) => (
                    <th>{a.name}</th>
                  )
                )
              }
            </tr>
            {
              miroirEntities.map(
                (e) => (
                  <tr key={e.name} >
                    {
                      currentMiroirEntity?.attributes?.map(
                        (a,k) => (
                          // <td>{e[a.name]}</td>
                          <td role='gridcell'>{JSON.stringify(e[a.name])}</td>
                        )
                      )
                    }
                  </tr>
                )
              )
            }
          </table>
          {/* <MTableComponent
              columnDefs={
                currentMiroirEntity?.attributes?.map(
                  (a)=>{return {"headerName": a?.defaultLabel, "field": a?.name}}
                )
              }
              rowData={ReportGetInstancesToDispay(currentMiroirReport,miroirEntities)}
            >
            </MTableComponent> */}
        </div>
      ) : (
        <span>pas d entités</span>
      )}
    </div>
  );
}