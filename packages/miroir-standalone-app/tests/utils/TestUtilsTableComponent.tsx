import * as React from "react";

import { 
  ApplicationSection, 
  EntityDefinition, 
  EntityInstance, 
  MetaEntity, 
  MiroirReport, 
  Uuid, 
  entityDefinitionEntity, 
  entityDefinitionEntityDefinition, 
  entityEntity, 
  entityEntityDefinition 
} from 'miroir-core';
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
  const entitiesOfDataSection:MetaEntity [] = useLocalCacheSectionEntities(props.deploymentUuid,'model');
  const entityDefinitionsOfDataSection:EntityDefinition[] = useLocalCacheSectionEntityDefinitions(props.deploymentUuid,'model');

  const deploymentReports: MiroirReport[] = useLocalCacheDeploymentSectionReports(props.deploymentUuid,'model');

  // const miroirReports:MiroirReport[] = useLocalCacheReports();
  const entityInstances = {
    Entity: entitiesOfDataSection,
    Report:deploymentReports,
  }

  console.log("TestUtilsTableComponent display instances of entity named",props.entityName, 'uuid', props.entityUuid);
  console.log("TestUtilsTableComponent libraryAppEntities",entitiesOfDataSection, "deploymentReports", deploymentReports);

  // const currentEntityDefinition: EntityDefinition | undefined = entityInstances.Entity?.find(e=>e?.uuid === props.parentUuid);
  let instancesToDisplay:EntityInstance[];
  let currentMiroirEntity:MetaEntity;
  let currentMiroirEntityDefinition: EntityDefinition;

  if ([entityEntity.uuid,entityEntityDefinition.uuid].includes(props.entityUuid)) {
    currentMiroirEntity = (props.entityUuid == entityEntity.uuid?entityEntity:entityEntityDefinition) as MetaEntity;
    currentMiroirEntityDefinition = (props.entityUuid == entityEntity.uuid?entityDefinitionEntity:entityDefinitionEntityDefinition) as EntityDefinition;
    instancesToDisplay = props.entityUuid == entityEntity.uuid?entitiesOfDataSection:entityDefinitionsOfDataSection;
  } else {
    currentMiroirEntity = entitiesOfDataSection?.find(e=>e?.uuid === props.entityUuid) as MetaEntity;
    currentMiroirEntityDefinition = entityDefinitionsOfDataSection?.find(e=>e?.entityUuid === currentMiroirEntity?.uuid) as EntityDefinition;
    console.log("TestUtilsTableComponent currentMiroirEntity",currentMiroirEntity);
    instancesToDisplay = useLocalCacheInstancesForEntity(props.deploymentUuid,props.instancesApplicationSection?props.instancesApplicationSection:'data',currentMiroirEntity?.uuid);
  }
  
  // const instancesToDisplay:EntityInstance[] = useLocalCacheInstancesForEntity(props.entityUuid);
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
                    (a:any, key:any) => (
                      <th  key={a.name}>{a.name}</th>
                    )
                  )
                }
              </tr>
            </thead>
            <tbody>
              {
                  instancesToDisplay.map(
                  (e:any) => (
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