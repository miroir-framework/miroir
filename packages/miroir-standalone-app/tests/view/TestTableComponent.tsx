import { EntityState } from "@reduxjs/toolkit";
import * as React from "react";
import { useSelector } from 'react-redux';

import { EntityDefinition } from 'miroir-core';
import { MiroirReport } from 'miroir-core';
import { selectInstancesForEntity } from "miroir-standalone-app/src/miroir-fwk/4_services/localStore/InstanceSlice";

export interface MiroirReportComponentProps {
  reportName: string;
};

export const TestTableComponent = (
  // props: MiroirReportComponentProps
) => {
  const miroirEntitiesState:EntityState<EntityDefinition> = useSelector(selectInstancesForEntity('Entity'))
  const miroirReportsState:EntityState<MiroirReport> = useSelector(selectInstancesForEntity('Report'))
  const miroirEntities:EntityDefinition[] = miroirEntitiesState?.entities?Object.values(miroirEntitiesState.entities):[];
  const miroirReports:MiroirReport[] = miroirReportsState?.entities?Object.values(miroirReportsState.entities):[];

  console.log("TestTableComponent miroirEntities",miroirEntities, "miroirReports", miroirReports);

  // const currentMiroirReport: MiroirReport = miroirReports?.find(r=>r.name === props?.reportName)
  // console.log("TestTableComponent currentMiroirReport",currentMiroirReport);
  const currentMiroirEntity: EntityDefinition = miroirEntities?.find(e=>e?.name === 'Entity')


  return (
    <div>
      {/* <h3>
        miroirEntities: {JSON.stringify(miroirEntities)}
        currentMiroirEntity: {JSON.stringify(currentMiroirEntity)}
      </h3> */}
      {miroirEntities?.length > 0 && !!currentMiroirEntity? (
        <div>
          <table>
            <thead>
              <tr>
                {
                  currentMiroirEntity?.attributes?.map(
                    (a, key) => (
                      <th  key={a.name}>{a.name}</th>
                    )
                  )
                }
              </tr>
            </thead>
            <tbody>
              {
                miroirEntities.map(
                  (e) => (
                    <tr key={e.name}>
                      {
                        currentMiroirEntity?.attributes?.map(
                          (a,k) => (
                            <td key={a.name} role='gridcell'>{JSON.stringify(e[a.name])}</td>
                          )
                        )
                      }
                    </tr>
                  )
                )
              }
            </tbody>
          </table>
        </div>
      ) : (
        <span>pas d entités</span>
      )}
    </div>
  );
}