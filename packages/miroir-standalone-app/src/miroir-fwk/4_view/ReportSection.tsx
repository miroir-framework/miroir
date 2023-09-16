import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { List, ListItem } from '@mui/material';
import Box from '@mui/material/Box';

import {
  ApplicationDeployment,
  ApplicationSection,
  EntityDefinition,
  EntityInstancesUuidIndex,
  ListReportSection,
  MetaEntity,
  MiroirApplicationModel,
  ObjectList,
  Report,
  ReportDefinition,
  Uuid,
  applicationDeploymentLibrary,
  applicationDeploymentMiroir,
  defaultMiroirMetaModel
} from "miroir-core";
import { LocalCacheInputSelectorParams, ReduxStateWithUndoRedo, selectModelForDeployment } from "miroir-redux";
import { JzodElement, JzodObject } from '@miroir-framework/jzod-ts';

import {
  useErrorLogService
} from "miroir-fwk/4_view/MiroirContextReactProvider";

import entityBook from "miroir-standalone-app/src/assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/e8ba151b-d68e-4cc3-9a83-3459d309ccf5.json";

import { EntityInstanceLink } from './EntityInstanceLink';
import { JzodObjectDisplay } from './JzodElementDisplay';
import {
  useCurrentModel,
  useEntityInstanceUuidIndexFromLocalCache,
} from "./ReduxHooks";
import { JzodElementRecord, JzodEnumSchemaToJzodElementResolver, getCurrentEnumJzodSchemaResolver } from '../JzodTools';
import { ReportSectionEntityInstance } from './ReportSectionEntityInstance';
import { ReportSectionListDisplay } from './ReportSectionListDisplay';

export interface ReportSectionEntityInstanceProps {
  reportDefinition: ReportDefinition | undefined,
  applicationSection: ApplicationSection,
  deploymentUuid: Uuid,
  // entityUuid?: Uuid,
  instanceUuid: Uuid,
  // store:any;
  // reportName: string;
}

export type EntityInstanceUrlParamKeys = 'deploymentUuid' | 'applicationSection' | 'entityUuid' | 'instanceUuid';


// ###############################################################################################################
export const ReportSection = (props: ReportSectionEntityInstanceProps) => {
  // const params = useParams<any>() as Readonly<Params<EntityInstanceUrlParamKeys>>;
  // const params = useParams<ReportUrlParams>();
  // console.log('ReportPage params',params);
  
  // const transactions: ReduxStateChanges[] = useLocalCacheTransactions();
  // const domainController: DomainControllerInterface = useDomainControllerService();
  const errorLog = useErrorLogService();
  
  const deployments = [applicationDeploymentMiroir, applicationDeploymentLibrary] as ApplicationDeployment[];


  const currentModelSelectorParams:LocalCacheInputSelectorParams = useMemo(
    () => ({
      deploymentUuid: applicationDeploymentLibrary.uuid,
    } as LocalCacheInputSelectorParams),
    [applicationDeploymentLibrary.uuid]
  );

  const localSelectModelForDeployment = useMemo(selectModelForDeployment,[]);
  const libraryAppModel: MiroirApplicationModel = useSelector((state: ReduxStateWithUndoRedo) =>
    localSelectModelForDeployment(state, currentModelSelectorParams)
  ) as MiroirApplicationModel;

  // computing current state #####################################################################
  const displayedDeploymentDefinition: ApplicationDeployment | undefined = deployments.find(
    (d) => d.uuid == props.deploymentUuid
  );
  console.log("ReportPage displayedDeploymentDefinition", displayedDeploymentDefinition);
  const currentReportDefinitionDeployment: ApplicationDeployment | undefined =
    displayedDeploymentDefinition?.applicationModelLevel == "metamodel" || props.applicationSection == "model"
      ? (applicationDeploymentMiroir as ApplicationDeployment)
      : displayedDeploymentDefinition;
  const currentModel =
    props.deploymentUuid == applicationDeploymentLibrary.uuid ? libraryAppModel : defaultMiroirMetaModel;
  
  const currentReportDefinitionApplicationSection: ApplicationSection | undefined =
    currentReportDefinitionDeployment?.applicationModelLevel == "metamodel" ? "data" : "model";
  console.log(
    "ReportPage currentReportDefinitionDeployment",
    currentReportDefinitionDeployment,
    "currentReportDefinitionApplicationSection",
    currentReportDefinitionApplicationSection
  );

  const deploymentReports: Report[] = currentModel.reports;
  const currentReportDeploymentSectionEntities: MetaEntity[] = currentModel.entities; // Entities are always defined in the 'model' section
  const currentReportDeploymentSectionEntityDefinitions: EntityDefinition[] = currentModel.entityDefinitions; // EntityDefinitions are always defined in the 'model' section


  const currentMiroirReportSectionObjectList: ObjectList | undefined =
    props.reportDefinition?.type == "objectList"
      ? props.reportDefinition
      : undefined
  ;

// const currentReportTargetEntity: MetaEntity | undefined = currentMiroirReportSectionObjectList
//   ? currentModel.entities?.find(
//       (e) => e?.uuid === currentMiroirReportSectionObjectList.definition.parentUuid
//     )
//   : undefined
// ;

  console.log("EntityInstancePage currentMiroirReportSectionObjectList", currentMiroirReportSectionObjectList);
  console.log("EntityInstancePage currentReportDeploymentSectionEntities", currentReportDeploymentSectionEntities);

  const currentReportTargetEntity: MetaEntity | undefined = currentMiroirReportSectionObjectList?.definition.parentUuid?currentReportDeploymentSectionEntities?.find(
    (e) => e?.uuid === currentMiroirReportSectionObjectList?.definition.parentUuid
  ):undefined;

  const currentReportTargetEntityDefinition: EntityDefinition | undefined =
    currentReportDeploymentSectionEntityDefinitions?.find((e) => e?.entityUuid === currentReportTargetEntity?.uuid);

  const entityJzodSchemaDefinition: { [attributeName: string]: JzodElement } | undefined =
    currentReportTargetEntityDefinition?.jzodSchema.definition;

  // const currentMiroirReportSectionObjectList: ObjectList | undefined =
  //   currentMiroirReport?.definition?.type == "objectList"
  //     ? currentMiroirReport?.definition
  //     : undefined
  // ;

  // const instancesToDisplayUuidIndex: EntityInstancesUuidIndex | undefined = useEntityInstanceUuidIndexFromLocalCache(
  //   {
  //     deploymentUuid: props.deploymentUuid,
  //     applicationSection: props.applicationSection as ApplicationSection,
  //     entityUuid: props.entityUuid,
  //   }
  // );

  // const instance:any = instancesToDisplayUuidIndex && props.instanceUuid?instancesToDisplayUuidIndex[props.instanceUuid]:undefined;

  // const booksUuidIndex: EntityInstancesUuidIndex | undefined = useEntityInstanceUuidIndexFromLocalCache(
  //   {
  //     deploymentUuid: props.deploymentUuid,
  //     applicationSection: props.applicationSection as ApplicationSection,
  //     entityUuid: entityBook.uuid,
  //   }
  // );

  const currentMiroirModel = useCurrentModel(applicationDeploymentMiroir.uuid);

  // const currentEnumJzodSchemaResolver: JzodElementRecord = useMemo(
  //   // () => getCurrentEnumJzodSchemaResolver(currentMiroirModel,currentReportTargetEntityDefinition?.jzodSchema??{type:"object", definition:{}}),
  //   () => getCurrentEnumJzodSchemaResolver(currentMiroirModel),
  //   [currentMiroirModel]
  // );
  const currentEnumJzodSchemaResolver: JzodEnumSchemaToJzodElementResolver = useMemo(
    () => getCurrentEnumJzodSchemaResolver(currentMiroirModel),
    [currentMiroirModel]
  );


  // const publisherBooks = useMemo(
  //   () =>
  //     (booksUuidIndex ? Object.values(booksUuidIndex) : []).filter(
  //       (b: any) => b["publisher"] == (instance["publisher"] ? instance["publisher"] : instance.uuid)
  //     ),
  //   [instance, booksUuidIndex]
  // );
  // const authorBooks = useMemo(
  //   () =>
  //     (booksUuidIndex ? Object.values(booksUuidIndex) : []).filter(
  //       (b: any) => b["author"] == (instance["author"] ? instance["author"] : instance.uuid)
  //     ),
  //   [instance, booksUuidIndex]
  // );
  // console.log('EntityInstancePage publisherBooks',publisherBooks,'authorBooks',authorBooks);

  const styles = useMemo(()=>({
    height: "280px",
    width: "90vw",
  }),[])

  // console.log('EntityInstancePage instance',instance);
  console.log('EntityInstancePage entityJzodSchema',entityJzodSchemaDefinition);
  
  if (props.applicationSection) {
    return (
      <div>
        {/* params:{JSON.stringify(params)}
        <p /> */}
        {/* <p>ReportSection</p> */}
        {
          props.applicationSection &&
          props.reportDefinition
          ? (
          <div>
            {
              props.reportDefinition.type === "list" ? (
                <div>
                  <table>
                    <tbody>
                      {
                        props.reportDefinition.definition.map(
                          (reportSection, index) => {
                            return (
                              <tr key={index}>
                                {/* <td>
                                  {JSON.stringify({reportSection})}
                                </td> */}
                                <td>
                                  <ReportSection
                                    deploymentUuid={props.deploymentUuid}
                                    applicationSection={props.applicationSection}
                                    reportDefinition={reportSection}
                                    instanceUuid={props.instanceUuid}
                                  />
                                </td>
                              </tr>
                            )
                          }
                        )
                      }
                    </tbody>
                  </table>
                </div>
              ) : (
                // <div>Not a list!!</div>
                <div></div>
              )
            }
            {
              props.reportDefinition.type === "objectList" ? (
                <div>
                  {
                    currentReportTargetEntity &&
                    currentReportTargetEntityDefinition ?
                      // <div>object List!!</div>
                      <ReportSectionListDisplay
                        tableComponentReportType="EntityInstance"
                        label={"EntityInstance-" + currentReportTargetEntity?.name}
                        // currentReportUuid={params.reportUuid?params.reportUuid:""}
                        styles={styles}
                        chosenApplicationSection={props.applicationSection as ApplicationSection}
                        displayedDeploymentDefinition={displayedDeploymentDefinition}
                        currentModel={currentModel}
                        // currentMiroirReportSectionObjectList={props.reportDefinition?.definition[0] as ObjectList}
                        currentMiroirReportSectionObjectList={props.reportDefinition}
                        currentMiroirEntity={currentReportTargetEntity}
                        currentMiroirEntityDefinition={currentReportTargetEntityDefinition}
                      />
                    :
                    <div>error on object list {JSON.stringify(currentReportTargetEntity)}</div>
                  }
               </div>
              // ) : <div> not an objectList</div>
              ) : <div></div>
            }
            {
              props.reportDefinition.type === "objectInstance" ? (
                <div>
                  {/* object instance */}
                  <ReportSectionEntityInstance
                    applicationSection={props.applicationSection as ApplicationSection}
                    deploymentUuid={props.deploymentUuid}
                    entityUuid={props.reportDefinition.definition.parentUuid}
                    instanceUuid={props.instanceUuid}
                  />
               </div>
              // ) : <div> not an objectList</div>
              ) : <div></div>
            }
          </div>
        ) : (
          <div>Oops.</div>
        )}
      </div>
    );
  } else {
    return (
      <>
        ReportSection Invalid props! {JSON.stringify(props)}
      </>
    )
  }
};
