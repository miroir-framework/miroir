import * as React from "react";

import { 
  ApplicationSection, 
  EntityDefinition, 
  EntityInstance, 
  MetaEntity, 
  Report, 
  Uuid, 
  entityDefinitionEntity, 
  entityDefinitionEntityDefinition, 
  entityEntity, 
  entityEntityDefinition 
} from 'miroir-core';
import {
  useLocalCacheDeploymentSectionReportsTOREFACTOR,
  useLocalCacheInstancesForEntityTOREFACTOR,
  useLocalCacheSectionEntities,
  useLocalCacheSectionEntityDefinitions
} from "miroir-standalone-app/src/miroir-fwk/4_view/MiroirContextReactProvider";
import { applicationDeploymentLibrary } from "./tests-utils";
import { JzodElement } from "@miroir-framework/jzod";

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

  const deploymentReports: Report[] = useLocalCacheDeploymentSectionReportsTOREFACTOR(props.deploymentUuid,'model');

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
    instancesToDisplay = useLocalCacheInstancesForEntityTOREFACTOR(props.deploymentUuid,props.instancesApplicationSection?props.instancesApplicationSection:'data',currentMiroirEntity?.uuid);
  }
  console.log("TestUtilsTableComponent currentMiroirEntity",JSON.stringify(currentMiroirEntity));
  console.log("TestUtilsTableComponent currentMiroirEntityDefinition",JSON.stringify(currentMiroirEntityDefinition));
  
  // const instancesToDisplay:EntityInstance[] = useLocalCacheInstancesForEntityTOREFACTOR(props.entityUuid);
  console.log("TestUtilsTableComponent instancesToDisplay",instancesToDisplay);
  
  // const currentAttributes = currentMiroirEntityDefinition?.attributes ? currentMiroirEntityDefinition?.attributes?.filter(a=>a.name!=='parentUuid'):[];
  const currentAttributes = currentMiroirEntityDefinition?.jzodSchema ? Object.entries(currentMiroirEntityDefinition?.jzodSchema.definition)?.filter(a=>a[0]!=='parentUuid'):[];
  console.log("TestUtilsTableComponent currentAttributes",JSON.stringify(currentAttributes));
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
                    (a:[string,JzodElement], key:any) => (
                      <th  key={a[0]}>{a[0]}</th>
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
                            <td key={a[0]} role='gridcell'>{JSON.stringify(e[a[0]])}</td>
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