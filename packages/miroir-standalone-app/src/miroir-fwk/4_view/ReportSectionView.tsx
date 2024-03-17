import { useMemo } from 'react';

import {
  ApplicationDeploymentConfiguration,
  ApplicationSection,
  DomainElementObject,
  Entity,
  EntityDefinition,
  LoggerInterface,
  MetaEntity,
  MetaModel,
  MiroirLoggerFactory,
  RecordOfJzodObject,
  ReportSection,
  Uuid,
  applicationDeploymentLibrary,
  applicationDeploymentMiroir,
  getLoggerName,
  reportEntityDefinitionList,
  reportEntityList
} from "miroir-core";



import { packageName } from '../../constants';
import { useCurrentModel } from './ReduxHooks';
import { ReportSectionEntityInstance } from './ReportSectionEntityInstance';
import { ReportSectionListDisplay } from './ReportSectionListDisplay';
import { cleanLevel } from './constants';

const loggerName: string = getLoggerName(packageName, cleanLevel,"ReportSectionView");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

export interface ReportSectionEntityInstanceProps {
  // domainElement: DomainElement,
  domainElementObject: DomainElementObject,
  fetchedDataJzodSchema: RecordOfJzodObject | undefined,
  reportSection: ReportSection,
  applicationSection: ApplicationSection,
  deploymentUuid: Uuid,
}

// ###############################################################################################################
export const ReportSectionView = (props: ReportSectionEntityInstanceProps) => {
  // const errorLog = useErrorLogService();

  log.info("########################## ReportSectionView props", props);

  const deployments = [applicationDeploymentMiroir, applicationDeploymentLibrary] as ApplicationDeploymentConfiguration[];

  // ##############################################################################################
  const miroirMetaModel: MetaModel = useCurrentModel(applicationDeploymentMiroir.uuid);
  const libraryAppModel: MetaModel = useCurrentModel(applicationDeploymentLibrary.uuid);

  // computing current state #####################################################################
  const displayedDeploymentDefinition: ApplicationDeploymentConfiguration | undefined = deployments.find(
    (d) => d.uuid == props.deploymentUuid
  );
  log.info("ReportSectionView displayedDeploymentDefinition", displayedDeploymentDefinition);

  // const currentModel = props.deploymentUuid == applicationDeploymentLibrary.uuid? libraryAppModel:miroirMetaModel;

  const mapping = useMemo(() => ({ // displayedDeploymentDefinition, displayedApplicationSection
    [applicationDeploymentMiroir.uuid]: {
      "model": {
        availableReports: miroirMetaModel.reports.filter(
          (r) => [reportEntityList.uuid, reportEntityDefinitionList.uuid].includes(r.uuid)
          ),
          entities: miroirMetaModel.entities,
          entityDefinitions: miroirMetaModel.entityDefinitions,
        },
      "data": {
        availableReports: miroirMetaModel.reports.filter(
          (r) => ![reportEntityList.uuid, reportEntityDefinitionList.uuid].includes(r.uuid)
        ),
        entities: miroirMetaModel.entities,
        entityDefinitions: miroirMetaModel.entityDefinitions,
      },
    },
    [applicationDeploymentLibrary.uuid]: {
      "model": {
        availableReports: miroirMetaModel.reports,
        entities: miroirMetaModel.entities,
        entityDefinitions: miroirMetaModel.entityDefinitions,
      },
      "data": {
        availableReports: libraryAppModel.reports,
        entities: libraryAppModel.entities,
        entityDefinitions: libraryAppModel.entityDefinitions,
      },
    },
  }), [miroirMetaModel, libraryAppModel]);

  const { availableReports, entities, entityDefinitions } =
    displayedDeploymentDefinition && props.applicationSection
      ? mapping[displayedDeploymentDefinition?.uuid][props.applicationSection]
      : { availableReports: [], entities: [], entityDefinitions: [] };

  log.info("ReportSectionView availableReports",availableReports);

  const currentReportTargetEntity: Entity | undefined =
    props.reportSection?.type === "objectListReportSection" 
      ? entities?.find(
          (e) =>
            e?.uuid === (props.reportSection?.definition as any)["parentUuid"]
        )
      : undefined;
  const currentReportTargetEntityDefinition: EntityDefinition | undefined =
    entityDefinitions?.find((e) => e?.entityUuid === currentReportTargetEntity?.uuid);

  // computing current state #####################################################################
  log.info(
    "ReportSectionView displayedDeploymentDefinition",
    displayedDeploymentDefinition,
    "props.reportSection",
    props.reportSection,
    "currentReportTargetEntity",
    currentReportTargetEntity
  );

  const styles = useMemo(()=>({
    // display: "flex",
    // width: '100%',
    // height: '100%',
    // flex: '1 1 auto',
    // overflow: "hidden",
    height: "280px",
    width: "80vw",
  }),[])

  log.info(
    "ReportSectionView",
    "deploymentUuid",
    props.deploymentUuid,
    props.applicationSection,
    "domainElement",
    props.domainElementObject
  );

  // log.info('ReportSectionView entityJzodSchema',entityJzodSchemaDefinition);
  log.info('ReportSectionView props.reportSection',props.reportSection);

  const evaluateExpression = (expression: string | undefined) => {
    const parts = expression?.split(".");
    const object =
      Array.isArray(parts) && parts.length > 0 && props.domainElementObject.elementValue
        ? (props.domainElementObject.elementValue as any)[parts[0]].elementValue
        : undefined;
    const result = object && Array.isArray(parts) && parts.length > 1 ? (object as any)[parts[1]] : undefined;
    log.info("evaluateExpression", expression, parts, props.domainElementObject, "object", object, "result", result);
    return result;
  };

  const interpolateExpression = (stringToInterpolate: string | undefined, label?: string)=> {
    const reg = /\$\{([^}]*)\}/g
    const result = stringToInterpolate?stringToInterpolate.replace(reg,(expression, ...args)=>`${evaluateExpression(args[0])}`):"no " + label??"label"
    log.info("interpolateExpression result",result);
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
                                    domainElementObject={props.domainElementObject}
                                    fetchedDataJzodSchema={props.fetchedDataJzodSchema}
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
                  {/* {JSON.stringify(props.domainElementObject, circularReplacer(), 2)} */}
                  {
                    (currentReportTargetEntity &&
                    currentReportTargetEntityDefinition) || props.domainElementObject ?
                      <ReportSectionListDisplay
                        tableComponentReportType="EntityInstance"
                        label={"EntityInstance-" + currentReportTargetEntity?.name}
                        defaultlabel={interpolateExpression(props.reportSection.definition?.label,"report label")}
                        styles={styles}
                        deploymentUuid={props.deploymentUuid}
                        chosenApplicationSection={props.applicationSection as ApplicationSection}
                        displayedDeploymentDefinition={displayedDeploymentDefinition}
                        domainElementObject={props.domainElementObject}
                        fetchedDataJzodSchema={props.fetchedDataJzodSchema}
                        section={props.reportSection}
                        // currentModel={currentModel}
                        // currentMiroirReportSectionObjectList={props.reportSection}
                        // currentReportTargerEntity={currentReportTargetEntity}
                        // currentReportTargetEntityDefinition={currentReportTargetEntityDefinition}
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
                    domainElement={props.domainElementObject}
                    instance={props.domainElementObject.elementValue?(props.domainElementObject.elementValue as any)[props.reportSection.definition.fetchedDataReference??""].elementValue:undefined}
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
