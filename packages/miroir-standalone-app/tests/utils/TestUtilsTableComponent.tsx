import * as React from "react";

import { ApplicationSection, EntityDefinition, EntityInstance, MetaEntity, MiroirReport, Uuid } from 'miroir-core';
import {
  useLocalCacheDeploymentSectionReports,
  useLocalCacheInstancesForEntity,
  useLocalCacheSectionEntities,
  useLocalCacheSectionEntityDefinitions
} from "miroir-standalone-app/src/miroir-fwk/4_view/hooks";
import { applicationDeploymentLibrary } from "./tests-utils";

export interface MiroirReportComponentProps {
  entityName?: string;
  entityUuid: string;
  DisplayLoadingInfo:JSX.Element;
  deploymentUuid: Uuid;
  instancesApplicationSection?: ApplicationSection;
};

export const TestUtilsTableComponent = (
  props: MiroirReportComponentProps
) => {
  // const miroirEntities:MetaEntity [] = useLocalCacheEntities();
  // const miroirEntityDefinitions:EntityDefinition[] = useLocalCacheEntityDefinitions();
  const libraryAppEntities:MetaEntity [] = useLocalCacheSectionEntities(props.deploymentUuid,'model');
  const libraryAppEntityDefinitions:EntityDefinition[] = useLocalCacheSectionEntityDefinitions(props.deploymentUuid,'model');

  const deploymentReports: MiroirReport[] = useLocalCacheDeploymentSectionReports(props.deploymentUuid,'model');

  // const miroirReports:MiroirReport[] = useLocalCacheReports();
  const entityInstances = {
    Entity: libraryAppEntities,
    Report:deploymentReports,
  }

  console.log("TestUtilsTableComponent display instances of entity",props.entityName,props.entityUuid);
  console.log("TestUtilsTableComponent libraryAppEntities",libraryAppEntities, "deploymentReports", deploymentReports);

  // const currentEntityDefinition: EntityDefinition | undefined = entityInstances.Entity?.find(e=>e?.uuid === props.parentUuid);
  const currentMiroirEntity = libraryAppEntities?.find(e=>e?.uuid === props.entityUuid);
  const currentMiroirEntityDefinition = libraryAppEntityDefinitions?.find(e=>e?.entityUuid === currentMiroirEntity?.uuid);
  
  // const instancesToDisplay:EntityInstance[] = useLocalCacheInstancesForEntity(props.entityUuid);
  const instancesToDisplay:EntityInstance[] = useLocalCacheInstancesForEntity(props.deploymentUuid,props.instancesApplicationSection?props.instancesApplicationSection:'data',currentMiroirEntity?.uuid);
  console.log("TestUtilsTableComponent instancesToDisplay",instancesToDisplay);

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