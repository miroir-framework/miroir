import * as React from "react";

import { EntityDefinition, EntityInstance, MetaEntity, MiroirReport } from 'miroir-core';
import {
  useLocalCacheEntities,
  useLocalCacheEntityDefinitions,
  useLocalCacheInstancesForEntity,
  useLocalCacheReports,
} from "miroir-standalone-app/src/miroir-fwk/4_view/hooks";

export interface MiroirReportComponentProps {
  entityName?: string;
  entityUuid: string;
  DisplayLoadingInfo:JSX.Element;
};

export const TestUtilsTableComponent = (
  props: MiroirReportComponentProps
) => {
  const miroirEntities:MetaEntity [] = useLocalCacheEntities();
  const miroirEntityDefinitions:EntityDefinition[] = useLocalCacheEntityDefinitions();

  const miroirReports:MiroirReport[] = useLocalCacheReports();
  const entityInstances = {
    Entity: miroirEntities,
    Report:miroirReports,
  }

  console.log("TestUtilsTableComponent display instances of entity",props.entityName,props.entityUuid);
  console.log("TestUtilsTableComponent miroirEntities",miroirEntities, "miroirReports", miroirReports);
  const instancesToDisplay:EntityInstance[] = useLocalCacheInstancesForEntity(props.entityUuid);
  console.log("TestUtilsTableComponent instancesToDisplay",instancesToDisplay);
  // const currentEntityDefinition: EntityDefinition | undefined = entityInstances.Entity?.find(e=>e?.uuid === props.parentUuid);
  const currentMiroirEntity = miroirEntities?.find(e=>e?.uuid === props.entityUuid);
  const currentMiroirEntityDefinition = miroirEntityDefinitions?.find(e=>e?.entityUuid === currentMiroirEntity?.uuid);
  const currentAttributes = currentMiroirEntityDefinition?.attributes ? currentMiroirEntityDefinition?.attributes?.filter(a=>a.name!=='parentUuid'):[];
  return (
    <div>
      {/* <span>
        fin: 
        {
        entityInstances['Report']?.length == 2?'finished':''
        }
      </span> */}
      {/* currentEntityDefinition:{JSON.stringify(currentEntityDefinition)} */}
      <p/>
      {props.DisplayLoadingInfo}
      {instancesToDisplay.length > 0 && !!currentMiroirEntityDefinition? (
        <div>
          <table>
            <thead>
              <tr>
                {
                  currentAttributes.map(
                    (a, key) => (
                      <th  key={a.name}>{a.name}</th>
                    )
                  )
                }
              </tr>
            </thead>
            <tbody>
              {
                  instancesToDisplay.map(
                  (e) => (
                    <tr key={e['name']}>
                      {
                        currentAttributes.map(
                          (a,k) => (
                            <td key={a['name']} role='gridcell'>{JSON.stringify(e[a['name']])}</td>
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