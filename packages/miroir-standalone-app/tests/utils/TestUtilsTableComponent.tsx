import * as React from "react";

import { 
  ApplicationSection, 
  EntityDefinition, 
  EntityInstance, 
  EntityInstanceWithName,
  JzodElement,
  MetaEntity, 
  LocalCacheQueryParams, 
  Report, 
  Uuid, 
  entityDefinitionEntity, 
  entityDefinitionEntityDefinition, 
  entityEntity, 
  entityEntityDefinition,
  LoggerInterface,
  MiroirLoggerFactory,
  getLoggerName,
  MetaModel,
  Entity,
} from 'miroir-core';
import { ReduxStateWithUndoRedo, selectInstanceArrayForDeploymentSectionEntity, selectModelForDeploymentFromReduxState } from "miroir-localcache-redux";
import { useSelector } from "react-redux";

import { EntityInstanceUuidIndexSelectorParams, useCurrentModel } from "../../src/miroir-fwk/4_view/ReduxHooks";
import { packageName } from "../../src/constants";
import { cleanLevel } from "../../src/miroir-fwk/4_view/constants";
export interface MiroirReportComponentProps {
  entityName?: string;
  entityUuid: string;
  DisplayLoadingInfo:JSX.Element;
  deploymentUuid: Uuid;
  instancesApplicationSection?: ApplicationSection;
};

const loggerName: string = getLoggerName(packageName, cleanLevel,"TestUtilsTableComponent");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
  (value: LoggerInterface) => {
    log = value;
  }
);


export const TestUtilsTableComponent = (
  props: MiroirReportComponentProps
) => {
  // const currentModelSelectorParams:EntityInstanceUuidIndexSelectorParams = React.useMemo(
  // const currentModelSelectorParams:LocalCacheQueryParams = React.useMemo(
  //   () => ({
  //     queryType: "LocalCacheEntityInstancesSelectorParams",
  //     definition: {
  //       deploymentUuid: props.deploymentUuid,
  //     }
  //   } as LocalCacheQueryParams),
  //   [props.deploymentUuid]
  // );

  // const localSelectModelForDeployment = React.useMemo(selectModelForDeploymentFromReduxState,[]);
  // const currentModel = useSelector((state: ReduxStateWithUndoRedo) =>
  //   localSelectModelForDeployment(state, currentModelSelectorParams)
  // ) as MetaModel

  const currentModel: MetaModel = useCurrentModel(props.deploymentUuid)

  const entitiesOfDataSection:Entity [] = currentModel.entities;
  const entityDefinitionsOfDataSection:EntityDefinition[] = currentModel.entityDefinitions;

  const deploymentReports: Report[] = currentModel.reports;

  const entityInstances = {
    Entity: entitiesOfDataSection,
    Report:deploymentReports,
  }

  log.info("TestUtilsTableComponent display instances of entity named",props.entityName, 'uuid', props.entityUuid);
  log.info("TestUtilsTableComponent libraryAppEntities",entitiesOfDataSection, "deploymentReports", deploymentReports);

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
    // const instancesToDisplaySelectorParams:LocalCacheEntityInstancesSelectorParams = React.useMemo(
    const instancesToDisplaySelectorParams:LocalCacheQueryParams = React.useMemo(
      () => ({
        queryType: "LocalCacheEntityInstancesSelectorParams",
        definition: {
          deploymentUuid:props.deploymentUuid,
          applicationSection: props.instancesApplicationSection?props.instancesApplicationSection:'data',
          entityUuid: currentMiroirEntity?.uuid,
        }
      } as LocalCacheQueryParams),
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
  const currentAttributes = currentMiroirEntityDefinition?.jzodSchema ? Object.entries(currentMiroirEntityDefinition?.jzodSchema.definition)?.filter(a=>a[0]!=='parentUuid'):[];
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