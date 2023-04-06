import * as React from "react";

import { EntityDefinition, Instance, MiroirReport } from 'miroir-core';
import {
  useLocalCacheEntities,
  useLocalCacheInstancesForEntity,
  useLocalCacheReports,
} from "miroir-standalone-app/src/miroir-fwk/4_view/hooks";

export interface MiroirReportComponentProps {
  parentName?: string;
  parentUuid: string;
  DisplayLoadingInfo:JSX.Element;
};

export const TestUtilsTableComponent = (
  props: MiroirReportComponentProps
) => {
  const miroirEntities:EntityDefinition [] = useLocalCacheEntities();
  const miroirReports:MiroirReport[] = useLocalCacheReports();
  const entityInstances = {
    Entity: miroirEntities,
    Report:miroirReports,
  }

  console.log("TestUtilsTableComponent display instances of entity",props.parentName,props.parentUuid);
  console.log("TestUtilsTableComponent miroirEntities",miroirEntities, "miroirReports", miroirReports);
  const instancesToDisplay:Instance[] = useLocalCacheInstancesForEntity(props.parentUuid);
  console.log("TestUtilsTableComponent instancesToDisplay",instancesToDisplay);
  const currentEntityDefinition: EntityDefinition | undefined = entityInstances.Entity?.find(e=>e?.uuid === props.parentUuid);
  const currentAttributes = currentEntityDefinition?.attributes ? currentEntityDefinition?.attributes?.filter(a=>a.name!=='parentUuid'):[];
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
      {instancesToDisplay.length > 0 && !!currentEntityDefinition? (
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