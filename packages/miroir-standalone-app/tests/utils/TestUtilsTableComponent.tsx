import * as React from "react";

import {
  ApplicationSection,
  Entity,
  EntityDefinition,
  EntityInstance,
  EntityInstanceWithName,
  JzodElement,
  LocalCacheExtractor,
  LoggerInterface,
  MetaEntity,
  MiroirLoggerFactory,
  Uuid,
  type ApplicationDeploymentMap
} from 'miroir-core';
import {
  ReduxStateWithUndoRedo,
  selectInstanceArrayForDeploymentSectionEntity,
  useSelector,
} from "miroir-react";

import { packageName } from "../../src/constants";
import { cleanLevel } from "../../src/miroir-fwk/4_view/constants";
export interface MiroirReportComponentProps {
  // entityName?: string;
  // entityUuid: string;
  DisplayLoadingInfo:JSX.Element;
  application: Uuid;
  applicationDeploymentMap: ApplicationDeploymentMap;
  // deploymentUuid: Uuid;
  instancesApplicationSection?: ApplicationSection;
  entity: Entity;
  entityDefinition: EntityDefinition;
};

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "TestUtilsTableComponent")
).then((logger: LoggerInterface) => {log = logger});



export const TestUtilsTableComponent = (
  props: MiroirReportComponentProps
) => {


  // const currentEntityDefinition: EntityDefinition | undefined = entityInstances.Entity?.find(e=>e?.uuid === props.parentUuid);
  let instancesToDisplay:EntityInstance[];


    const instancesToDisplaySelectorParams: LocalCacheExtractor = React.useMemo(
      () =>
        ({
          queryType: "localCacheEntityInstancesExtractor",
          definition: {
            application: props.application,
            applicationSection: props.instancesApplicationSection
              ? props.instancesApplicationSection
              : "data",
            // entityUuid: currentMiroirEntity?.uuid,
            entityUuid: props.entity?.uuid,
          },
        }) as LocalCacheExtractor,
      [props.application, props.instancesApplicationSection, props.entity?.uuid],
    );

    log.info("TestUtilsTableComponent instancesToDisplaySelectorParams",JSON.stringify(instancesToDisplaySelectorParams));
    instancesToDisplay = useSelector((state: ReduxStateWithUndoRedo) =>
      selectInstanceArrayForDeploymentSectionEntity(
        state,
        props.applicationDeploymentMap,
        instancesToDisplaySelectorParams,
      ),
    ) as EntityInstanceWithName[];
  // }
  log.info("TestUtilsTableComponent currentMiroirEntity",JSON.stringify(props.entity));
  log.info("TestUtilsTableComponent currentMiroirEntityDefinition",JSON.stringify(props.entityDefinition));
  
  log.info("TestUtilsTableComponent instancesToDisplay",instancesToDisplay);
  
  const currentAttributes = props.entityDefinition?.mlSchema
    ? Object.entries(props.entityDefinition?.mlSchema.definition)?.filter(
        (a) => a[0] !== "parentUuid",
      )
    : [];
  log.info("TestUtilsTableComponent currentAttributes",JSON.stringify(currentAttributes));
  return (
    <div>
      {/* <p/> */}
      {props.DisplayLoadingInfo}
      instancesToDisplay.length: {instancesToDisplay.length}
      {/* {instancesToDisplay.length > 0 && !!currentMiroirEntityDefinition? ( */}
      {instancesToDisplay.length > 0? (
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