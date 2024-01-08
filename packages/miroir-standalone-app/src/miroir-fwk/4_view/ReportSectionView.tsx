import { useMemo } from 'react';

import {
  ApplicationDeploymentConfiguration,
  ApplicationSection,
  EntityDefinition,
  LoggerInterface,
  MetaEntity,
  MiroirApplicationModel,
  MiroirLoggerFactory,
  RecordOfJzodObject,
  ReportSection,
  ResultsFromQueryObject,
  SelectObjectListQuery,
  Uuid,
  applicationDeploymentLibrary,
  applicationDeploymentMiroir,
  circularReplacer,
  getLoggerName,
  reportEntityDefinitionList,
  reportEntityList,
  resultsFromQueryObject
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
  // resultsFromQuery: ResultsFromQuery,
  resultsFromQueryObject: ResultsFromQueryObject,
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
  const miroirMetaModel: MiroirApplicationModel = useCurrentModel(applicationDeploymentMiroir.uuid);
  const libraryAppModel: MiroirApplicationModel = useCurrentModel(applicationDeploymentLibrary.uuid);

  // computing current state #####################################################################
  const displayedDeploymentDefinition: ApplicationDeploymentConfiguration | undefined = deployments.find(
    (d) => d.uuid == props.deploymentUuid
  );
  log.info("ReportSectionView displayedDeploymentDefinition", displayedDeploymentDefinition);

  const currentModel = props.deploymentUuid == applicationDeploymentLibrary.uuid? libraryAppModel:miroirMetaModel;

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

  const currentReportTargetEntity: MetaEntity | undefined = props.reportSection?.type === "objectListReportSection"
    ? entities?.find((e) => e?.uuid === (props.reportSection?.definition as SelectObjectListQuery).parentUuid)
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
    height: "280px",
    width: "90vw",
  }),[])

  log.info(
    "ReportSectionView",
    "deploymentUuid",
    props.deploymentUuid,
    props.applicationSection,
    "resultsFromQuery",
    props.resultsFromQueryObject
  );

  // log.info('ReportSectionView entityJzodSchema',entityJzodSchemaDefinition);
  log.info('ReportSectionView props.reportSection',props.reportSection);

  const evaluateExpression = (expression: string | undefined) => {
    const parts = expression?.split(".");
    const object =
      Array.isArray(parts) && parts.length > 0 && props.resultsFromQueryObject.resultValue
        ? (props.resultsFromQueryObject.resultValue as any)[parts[0]].resultValue
        : undefined;
    const result = object && Array.isArray(parts) && parts.length > 1 ? (object as any)[parts[1]] : undefined;
    log.info("evaluateExpression", expression, parts, props.resultsFromQueryObject, "object", object, "result", result);
    return result;
  };

  const interpolateExpression = (stringToInterpolate: string | undefined)=> {
    const reg = /\$\{([^}]*)\}/g
    const result = stringToInterpolate?stringToInterpolate.replace(reg,(expression, ...args)=>`${evaluateExpression(args[0])}`):"no string"
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
                                    resultsFromQueryObject={props.resultsFromQueryObject}
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
                  {JSON.stringify(props.resultsFromQueryObject, circularReplacer(), 2)}
                  {
                    (currentReportTargetEntity &&
                    currentReportTargetEntityDefinition) || props.resultsFromQueryObject ?
                      <ReportSectionListDisplay
                        tableComponentReportType="EntityInstance"
                        label={"EntityInstance-" + currentReportTargetEntity?.name}
                        defaultlabel={interpolateExpression(props.reportSection.definition?.label)}
                        styles={styles}
                        chosenApplicationSection={props.applicationSection as ApplicationSection}
                        displayedDeploymentDefinition={displayedDeploymentDefinition}
                        resultsFromQueryObject={props.resultsFromQueryObject}
                        fetchedDataJzodSchema={props.fetchedDataJzodSchema}
                        section={props.reportSection}
                        currentModel={currentModel}
                        // currentMiroirReportSectionObjectList={props.reportSection}
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
                    resultsFromQuery={props.resultsFromQueryObject}
                    instance={props.resultsFromQueryObject.resultValue?(props.resultsFromQueryObject.resultValue as any)[props.reportSection.definition.fetchedDataReference??""]:undefined}
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
