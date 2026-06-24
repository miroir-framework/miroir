import { useMemo } from 'react';
// import * as React from "react";

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
  type ApplicationDeploymentMap,
  type BoxedQueryTemplateWithExtractorCombinerTransformer,
  type BoxedQueryWithExtractorCombinerTransformer,
  type Domain2QueryReturnType
} from 'miroir-core';
import {
  ReduxStateWithUndoRedo,
  selectInstanceArrayForDeploymentSectionEntity,
  useSelector,
} from "miroir-react";

import { packageName } from "../../src/constants";
import { cleanLevel } from "../../src/miroir-fwk/4_view/constants";
import { useQueryTemplateResults } from '../../src/miroir-fwk/4_view/components/Reports/ReportHooks';
export interface MiroirReportComponentProps {
  DisplayLoadingInfo:JSX.Element;
  application: Uuid;
  applicationDeploymentMap: ApplicationDeploymentMap;
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


  // const instancesToDisplaySelectorParams: LocalCacheExtractor = useMemo(
  //   () =>
  //     ({
  //       queryType: "localCacheEntityInstancesExtractor",
  //       definition: {
  //         application: props.application,
  //         applicationSection: props.instancesApplicationSection
  //           ? props.instancesApplicationSection
  //           : "data",
  //         entityUuid: props.entity?.uuid,
  //       },
  //     }) as LocalCacheExtractor,
  //   [props.application, props.instancesApplicationSection, props.entity?.uuid],
  // );

  // log.info("TestUtilsTableComponent instancesToDisplaySelectorParams",JSON.stringify(instancesToDisplaySelectorParams));
  // instancesToDisplay = useSelector((state: ReduxStateWithUndoRedo) =>
  //   selectInstanceArrayForDeploymentSectionEntity(
  //     state,
  //     props.applicationDeploymentMap,
  //     instancesToDisplaySelectorParams,
  //   ),
  // ) as EntityInstanceWithName[];
  const currentStoredQuery:
  | BoxedQueryWithExtractorCombinerTransformer
  | BoxedQueryTemplateWithExtractorCombinerTransformer
  | undefined = useMemo(() => {
    const result:
    | BoxedQueryWithExtractorCombinerTransformer
    | BoxedQueryTemplateWithExtractorCombinerTransformer
    | undefined =
    {
      queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
      application: props.application,
      queryParams: {},
      contextResults: {},
      extractorTemplates: {
        extractorByPrimaryKey: {
          extractorOrCombinerType: "extractorInstancesByEntity",
          applicationSection: props.instancesApplicationSection,
          parentUuid: props.entity.uuid,
        }
      },
    }
      // : undefined;
    log.info("TestUtilsTableComponent currentStoredQuery", result);
    return result;
  }, [props.application, props.entity?.uuid, props.instancesApplicationSection]);

  const currentStoredQueryResults: Domain2QueryReturnType<
  Domain2QueryReturnType<Record<string, any>>
    > = useQueryTemplateResults({}, props.applicationDeploymentMap, currentStoredQuery);
  log.info("TestUtilsTableComponent currentStoredQueryResults", JSON.stringify(currentStoredQueryResults));
  log.info("TestUtilsTableComponent currentMiroirEntityDefinition",JSON.stringify(props.entityDefinition));

  instancesToDisplay = (currentStoredQueryResults as any)?.reportData?.extractorByPrimaryKey;
  log.info("TestUtilsTableComponent currentStoredQueryResults",JSON.stringify(currentStoredQueryResults, null, 2));
  log.info("TestUtilsTableComponent instancesToDisplay",instancesToDisplay);
  
  const currentAttributes: [string, JzodElement][] = [["uuid", { type: "uuid" } as JzodElement]]
  .concat(
    props.entityDefinition?.mlSchema
    ? Object.entries(props.entityDefinition?.mlSchema.definition)?.filter(
        (a) => a[0] !== "parentUuid",
      ) as [string, JzodElement][]
    : [] as [string, JzodElement][]
  ) as [string, JzodElement][];
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