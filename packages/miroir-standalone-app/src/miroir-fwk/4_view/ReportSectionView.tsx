import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { JzodElement } from '@miroir-framework/jzod-ts';
import {
  ApplicationDeployment,
  ApplicationSection,
  EntityDefinition,
  FetchedData,
  MetaEntity,
  MiroirApplicationModel,
  MiroirSelectorSingleQueryParams,
  ObjectListReportSection,
  ReportSection,
  Uuid,
  applicationDeploymentLibrary,
  applicationDeploymentMiroir,
  defaultMiroirMetaModel
} from "miroir-core";
import { ReduxStateWithUndoRedo, selectModelForDeployment } from "miroir-redux";

import {
  useErrorLogService
} from "../../miroir-fwk/4_view/MiroirContextReactProvider";


import { ReportSectionEntityInstance } from './ReportSectionEntityInstance';
import { ReportSectionListDisplay } from './ReportSectionListDisplay';

export interface ReportSectionEntityInstanceProps {
  fetchedData: FetchedData | undefined,
  reportSection: ReportSection | undefined,
  applicationSection: ApplicationSection,
  deploymentUuid: Uuid,
  // instanceUuid: Uuid,
}

// ###############################################################################################################
export const ReportSectionView = (props: ReportSectionEntityInstanceProps) => {
  const errorLog = useErrorLogService();

  console.log("########################## ReportSectionView props", props);

  const deployments = [applicationDeploymentMiroir, applicationDeploymentLibrary] as ApplicationDeployment[];


  // const currentModelSelectorParams:EntityInstanceUuidIndexSelectorParams = useMemo(
  const currentModelSelectorParams:MiroirSelectorSingleQueryParams = useMemo(
    () => ({
      type: "DomainEntityInstancesSelectorParams",
      definition: {
        deploymentUuid: applicationDeploymentLibrary.uuid,
      }
    } as MiroirSelectorSingleQueryParams),
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
  console.log("ReportSectionView displayedDeploymentDefinition", displayedDeploymentDefinition);
  const currentReportDefinitionDeployment: ApplicationDeployment | undefined =
    displayedDeploymentDefinition?.applicationModelLevel == "metamodel" || props.applicationSection == "model"
      ? (applicationDeploymentMiroir as ApplicationDeployment)
      : displayedDeploymentDefinition;
  const currentModel =
    props.deploymentUuid == applicationDeploymentLibrary.uuid ? libraryAppModel : defaultMiroirMetaModel;
  
  const currentReportDefinitionApplicationSection: ApplicationSection | undefined =
    currentReportDefinitionDeployment?.applicationModelLevel == "metamodel" ? "data" : "model";
  console.log(
    "ReportSectionView currentReportDefinitionDeployment",
    currentReportDefinitionDeployment,
    "currentReportDefinitionApplicationSection",
    currentReportDefinitionApplicationSection
  );

  // const deploymentReports: Report[] = currentModel.reports;
  const currentReportDeploymentSectionEntities: MetaEntity[] = currentModel.entities; // Entities are always defined in the 'model' section
  const currentReportDeploymentSectionEntityDefinitions: EntityDefinition[] = currentModel.entityDefinitions; // EntityDefinitions are always defined in the 'model' section


  const currentMiroirReportSectionObjectList: ObjectListReportSection | undefined =
    props.reportSection?.type == "objectListReportSection"
      ? props.reportSection
      : undefined
  ;

  console.log("ReportSectionView currentMiroirReportSectionObjectList", currentMiroirReportSectionObjectList);
  console.log("ReportSectionView currentReportDeploymentSectionEntities", currentReportDeploymentSectionEntities);

  const currentReportTargetEntity: MetaEntity | undefined = currentMiroirReportSectionObjectList?.definition?.parentUuid
    ? currentReportDeploymentSectionEntities?.find(
        (e) => e?.uuid === currentMiroirReportSectionObjectList?.definition?.parentUuid
      )
    : undefined;

  const currentReportTargetEntityDefinition: EntityDefinition | undefined =
    currentReportDeploymentSectionEntityDefinitions?.find((e) => e?.entityUuid === currentReportTargetEntity?.uuid);

  const entityJzodSchemaDefinition: { [attributeName: string]: JzodElement } | undefined =
    currentReportTargetEntityDefinition?.jzodSchema.definition;

  const styles = useMemo(()=>({
    height: "280px",
    width: "90vw",
  }),[])

  console.log(
    "ReportSectionView",
    "deploymentUuid",
    props.deploymentUuid,
    props.applicationSection,
    "fetchedData",
    props.fetchedData
    // props.reportSection?.fetchData?.book.parentUuid,
    // "booksUuidIndex",
    // booksUuidIndex
  );

  // console.log("ReportSectionView props.reportSection?.fetchData",props.reportSection?.fetchData,"fetchedData", fetchedData, "booksOfPublisher", booksOfPublisher);
  // console.log('EntityInstancePage instance',instance);
  console.log('ReportSectionView entityJzodSchema',entityJzodSchemaDefinition);
  console.log('ReportSectionView props.reportSection',props.reportSection);

  const evaluateExpression = (expression: string | undefined)=> {
    const parts = expression?.split(".");
    const object = Array.isArray(parts) && parts.length > 0 && props.fetchedData?props.fetchedData[parts[0]]: undefined;
    const result = object && Array.isArray(parts) && parts.length > 1?(object as any)[parts[1]]: undefined;
    console.log("evaluateExpression",expression, parts, props.fetchedData, "object", object,"result",result);
    return result;
  }

  const interpolateExpression = (stringToInterpolate: string | undefined)=> {
    const reg = /\$\{([^}]*)\}/g
    const result = stringToInterpolate?stringToInterpolate.replace(reg,(expression, ...args)=>`${evaluateExpression(args[0])}`):"no string"
    console.log("interpolateExpression result",result);
    return result;
  }

  if (props.applicationSection) {
    return (
      <div>
        {/* params:{JSON.stringify(params)}
        <p /> */}
        {/* <p>ReportSection</p> */}
        {
          props.applicationSection &&
          props.reportSection
          ? (
          <div>
            {
              props.reportSection?.type === "grid" ? (
                <div>
                  <table>
                    <tbody>
                      <tr>
                        <td>
                          grid not supported yet!
                        </td>
                      </tr>
                      {/* {
                        props.reportSection.definition.map(
                          (reportSection, index) => {
                            return (
                              <tr key={index}>
                                <td>
                                  <ReportSection
                                    deploymentUuid={props.deploymentUuid}
                                    applicationSection={props.applicationSection}
                                    reportSection={reportSection}
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
              props.reportSection?.type === "list" ? (
                <div>
                  <table>
                    <tbody>
                      {
                        props.reportSection?.definition.map(
                          (innerReportSection, index) => {
                            return (
                              <tr key={index}>
                                <td>
                                  <ReportSectionView
                                    fetchedData={props.fetchedData}
                                    deploymentUuid={props.deploymentUuid}
                                    applicationSection={props.applicationSection}
                                    reportSection={innerReportSection}
                                    // instanceUuid={props.instanceUuid}
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
              props.reportSection.type === "objectListReportSection" ? (
                <div>
                  {
                    (currentReportTargetEntity &&
                    currentReportTargetEntityDefinition) || props.fetchedData ?
                      <ReportSectionListDisplay
                        tableComponentReportType="EntityInstance"
                        label={"EntityInstance-" + currentReportTargetEntity?.name}
                        defaultlabel={interpolateExpression(props.reportSection.definition?.label)}
                        styles={styles}
                        chosenApplicationSection={props.applicationSection as ApplicationSection}
                        displayedDeploymentDefinition={displayedDeploymentDefinition}
                        fetchedData={props.fetchedData}
                        select={props.reportSection.definition}
                        currentModel={currentModel}
                        currentMiroirReportSectionObjectList={props.reportSection}
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
              props.reportSection.type === "objectInstanceReportSection" ? (
                <div>
                  <ReportSectionEntityInstance
                    fetchedData={props.fetchedData}
                    instance={props.fetchedData?props.fetchedData[props.reportSection.definition.fetchedDataReference??""]:undefined}
                    applicationSection={props.applicationSection as ApplicationSection}
                    deploymentUuid={props.deploymentUuid}
                    entityUuid={props.reportSection.definition.parentUuid}
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
