import { EntityState } from "@reduxjs/toolkit";
import * as React from "react";
import { useSelector } from 'react-redux';

import { EntityDefinition, MiroirReport } from 'miroir-core';
import { selectInstancesForEntity } from "miroir-redux";
import { LoadingStateInterface } from "./tests-utils";

export interface MiroirReportComponentProps {
  entityName: string;
  DisplayLoadingInfo:JSX.Element;
};

export const TestUtilsTableComponent = (
  props: MiroirReportComponentProps
) => {
  const miroirEntitiesState:EntityState<EntityDefinition> = useSelector(selectInstancesForEntity('Entity'))
  const miroirReportsState:EntityState<MiroirReport> = useSelector(selectInstancesForEntity('Report'))
  // const loadingState:LoadingStateInterface = useLoadingStateServiceHook();
  const entityInstances = {
    Entity: miroirEntitiesState?.entities ? Object.values(miroirEntitiesState.entities) : [],
    Report:miroirReportsState?.entities ? Object.values(miroirReportsState.entities) : [],
  }
  // const entities:EntityDefinition[] = miroirEntitiesState?.entities ? Object.values(miroirEntitiesState.entities) : [];
  // const reports:MiroirReport[] = miroirReportsState?.entities ? Object.values(miroirReportsState.entities) : [];

  console.log("TestTableComponent miroirEntities",entityInstances['Entity'], "miroirReports", entityInstances['Report']);

  // const currentMiroirReport: MiroirReport = miroirReports?.find(r=>r.name === props?.reportName)
  // console.log("TestTableComponent currentMiroirReport",currentMiroirReport);
  const currentEntityDefinition: EntityDefinition = entityInstances.Entity?.find(e=>e?.name === props.entityName);


  return (
    <div>
      {/* <span>
        fin: 
        {
        entityInstances['Report']?.length == 2?'finished':''
        }
      </span> */}
      {props.DisplayLoadingInfo}
      {entityInstances[props.entityName]?.length > 0 && !!currentEntityDefinition? (
        <div>
          <table>
            <thead>
              <tr>
                {
                  currentEntityDefinition?.attributes?.map(
                    (a, key) => (
                      <th  key={a.name}>{a.name}</th>
                    )
                  )
                }
              </tr>
            </thead>
            <tbody>
              {
                entityInstances[props.entityName].map(
                  (e) => (
                    <tr key={e.name}>
                      {
                        currentEntityDefinition?.attributes?.map(
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