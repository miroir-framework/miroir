import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { JzodElement } from '@miroir-framework/jzod-ts';
import {
  ApplicationDeployment,
  ApplicationSection,
  EntityDefinition,
  MetaEntity,
  MiroirApplicationModel,
  ObjectList,
  Report,
  ReportDefinition,
  SelectObjectListQuery,
  Uuid,
  applicationDeploymentLibrary,
  applicationDeploymentMiroir,
  defaultMiroirMetaModel,
  selectObjectListQuery
} from "miroir-core";
import { ReduxStateWithUndoRedo, selectModelForDeployment } from "miroir-redux";

import {
  useErrorLogService
} from "miroir-fwk/4_view/MiroirContextReactProvider";


import { JzodEnumSchemaToJzodElementResolver, getCurrentEnumJzodSchemaResolver } from '../JzodTools';
import {
  EntityInstanceUuidIndexSelectorParams,
  useCurrentModel
} from "./ReduxHooks";
import { ReportSectionEntityInstance } from './ReportSectionEntityInstance';
import { ReportSectionListDisplay } from './ReportSectionListDisplay';

export interface ReportSectionEntityInstanceProps {
  reportDefinition: ReportDefinition | undefined,
  applicationSection: ApplicationSection,
  deploymentUuid: Uuid,
  instanceUuid: Uuid,
}

export type EntityInstanceUrlParamKeys = 'deploymentUuid' | 'applicationSection' | 'entityUuid' | 'instanceUuid';


// ###############################################################################################################
export const ReportSection = (props: ReportSectionEntityInstanceProps) => {
  const errorLog = useErrorLogService();
  
  const deployments = [applicationDeploymentMiroir, applicationDeploymentLibrary] as ApplicationDeployment[];


  const currentModelSelectorParams:EntityInstanceUuidIndexSelectorParams = useMemo(
    () => ({
      deploymentUuid: applicationDeploymentLibrary.uuid,
    } as EntityInstanceUuidIndexSelectorParams),
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

  console.log("EntityInstancePage currentMiroirReportSectionObjectList", currentMiroirReportSectionObjectList);
  console.log("EntityInstancePage currentReportDeploymentSectionEntities", currentReportDeploymentSectionEntities);

  const currentReportTargetEntity: MetaEntity | undefined = currentMiroirReportSectionObjectList?.definition?.parentUuid
    ? currentReportDeploymentSectionEntities?.find(
        (e) => e?.uuid === currentMiroirReportSectionObjectList?.definition?.parentUuid
      )
    : undefined;

  const currentReportTargetEntityDefinition: EntityDefinition | undefined =
    currentReportDeploymentSectionEntityDefinitions?.find((e) => e?.entityUuid === currentReportTargetEntity?.uuid);

  const entityJzodSchemaDefinition: { [attributeName: string]: JzodElement } | undefined =
    currentReportTargetEntityDefinition?.jzodSchema.definition;

  const currentMiroirModel = useCurrentModel(applicationDeploymentMiroir.uuid);

  const currentEnumJzodSchemaResolver: JzodEnumSchemaToJzodElementResolver = useMemo(
    () => getCurrentEnumJzodSchemaResolver(currentMiroirModel),
    [currentMiroirModel]
  );

  const styles = useMemo(()=>({
    height: "280px",
    width: "90vw",
  }),[])

  // const query: SelectObjectListQuery = useMemo(
  //   () => ({
  //     label
  //   })
  // ) 
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
              props.reportDefinition.type === "grid" ? (
                <div>
                  <table>
                    <tbody>
                      <tr>
                        <td>
                          grid not supported yet!
                        </td>
                      </tr>
                      {/* {
                        props.reportDefinition.definition.map(
                          (reportSection, index) => {
                            return (
                              <tr key={index}>
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
                      } */}
                    </tbody>
                  </table>
                </div>
              ) : (
                // <div>Not a list!!</div>
                <div></div>
              )
            }
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
                      <ReportSectionListDisplay
                        tableComponentReportType="EntityInstance"
                        label={"EntityInstance-" + currentReportTargetEntity?.name}
                        styles={styles}
                        chosenApplicationSection={props.applicationSection as ApplicationSection}
                        displayedDeploymentDefinition={displayedDeploymentDefinition}
                        select={props.reportDefinition.definition}
                        currentModel={currentModel}
                        currentMiroirReportSectionObjectList={props.reportDefinition}
                        currentMiroirEntity={currentReportTargetEntity}
                        currentMiroirEntityDefinition={currentReportTargetEntityDefinition}
                      />
                    :
                    <div>error on object list {JSON.stringify(currentReportTargetEntity)}</div>
                  }
               </div>
              ) : <div></div>
            }
            {
              props.reportDefinition.type === "objectInstance" ? (
                <div>
                  <ReportSectionEntityInstance
                    applicationSection={props.applicationSection as ApplicationSection}
                    deploymentUuid={props.deploymentUuid}
                    entityUuid={props.reportDefinition.definition.parentUuid}
                    instanceUuid={props.instanceUuid}
                  />
               </div>
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
