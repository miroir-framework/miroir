import * as React from "react";

import {
  ApplicationSection,
  Entity,
  EntityDefinition,
  entityDefinitionEntity,
  entityDefinitionEntityDefinition,
  entityEntity,
  entityEntityDefinition,
  EntityInstance,
  EntityInstanceWithName,
  JzodElement,
  LocalCacheExtractor,
  LoggerInterface,
  MetaEntity,
  MetaModel,
  MiroirLoggerFactory,
  Report,
  Uuid
} from 'miroir-core';
import { ReduxStateWithUndoRedo, selectInstanceArrayForDeploymentSectionEntity, useSelector } from "../../src/miroir-fwk/miroir-localcache-imports.js";

import { packageName } from "../../src/constants";
import { cleanLevel } from "../../src/miroir-fwk/4_view/constants";
import { useCurrentModel } from "../../src/miroir-fwk/4_view/ReduxHooks";
import { defaultSelfApplicationDeploymentMap } from "miroir-core";
export interface MiroirReportComponentProps {
  entityName?: string;
  entityUuid: string;
  DisplayLoadingInfo:JSX.Element;
  application: Uuid;
  deploymentUuid: Uuid;
  instancesApplicationSection?: ApplicationSection;
};

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "TestUtilsTableComponent")
).then((logger: LoggerInterface) => {log = logger});



export const TestUtilsTableComponent = (
  props: MiroirReportComponentProps
) => {
  // const currentModelSelectorParams:EntityInstanceUuidIndexSelectorParams = React.useMemo(
  // const currentModelSelectorParams:LocalCacheExtractor = React.useMemo(
  //   () => ({
  //     queryType: "localCacheEntityInstancesExtractor",
  //     definition: {
  //       deploymentUuid: props.deploymentUuid,
  //     }
  //   } as LocalCacheExtractor),
  //   [props.deploymentUuid]
  // );

  // const localSelectModelForDeployment = React.useMemo(selectModelForDeploymentFromReduxState,[]);
  // const currentModel = useSelector((state: ReduxStateWithUndoRedo) =>
  //   localSelectModelForDeployment(state, currentModelSelectorParams)
  // ) as MetaModel

  const currentModel: MetaModel = useCurrentModel(props.application, defaultSelfApplicationDeploymentMap)
  // const currentModel: MetaModel = useCurrentModel(props.deploymentUuid)

  const entitiesOfDataSection:Entity [] = currentModel.entities;
  const entityDefinitionsOfDataSection:EntityDefinition[] = currentModel.entityDefinitions;

  const deploymentReports: Report[] = currentModel.reports;

  const entityInstances = {
    Entity: entitiesOfDataSection,
    Report:deploymentReports,
  }

  log.info("TestUtilsTableComponent display instances of entity named",props.entityName, 'uuid', props.entityUuid);
  log.info("TestUtilsTableComponent libraryAppEntitiesByName",entitiesOfDataSection, "deploymentReports", deploymentReports);

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


    // selectInstanceArrayForDeploymentSectionEntity
    // const instancesToDisplaySelectorParams:localCacheEntityInstancesExtractor = React.useMemo(
    const instancesToDisplaySelectorParams:LocalCacheExtractor = React.useMemo(
      () => ({
        queryType: "localCacheEntityInstancesExtractor",
        definition: {
          deploymentUuid:props.deploymentUuid,
          applicationSection: props.instancesApplicationSection?props.instancesApplicationSection:'data',
          entityUuid: currentMiroirEntity?.uuid,
        }
      } as LocalCacheExtractor),
      [props.deploymentUuid, props.instancesApplicationSection,currentMiroirEntity]
    );
  
    instancesToDisplay = useSelector((state: ReduxStateWithUndoRedo) =>
      selectInstanceArrayForDeploymentSectionEntity(state, instancesToDisplaySelectorParams)
    ) as EntityInstanceWithName[];
  }
  log.info("TestUtilsTableComponent currentMiroirEntity",JSON.stringify(currentMiroirEntity));
  log.info("TestUtilsTableComponent currentMiroirEntityDefinition",JSON.stringify(currentMiroirEntityDefinition));
  
  log.info("TestUtilsTableComponent instancesToDisplay",instancesToDisplay);
  
  // const currentAttributes = currentMiroirEntityDefinition?.attributes ? currentMiroirEntityDefinition?.attributes?.filter(a=>a.name!=='parentUuid'):[];
  const currentAttributes = currentMiroirEntityDefinition?.mlSchema ? Object.entries(currentMiroirEntityDefinition?.mlSchema.definition)?.filter(a=>a[0]!=='parentUuid'):[];
  log.info("TestUtilsTableComponent currentAttributes",JSON.stringify(currentAttributes));
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