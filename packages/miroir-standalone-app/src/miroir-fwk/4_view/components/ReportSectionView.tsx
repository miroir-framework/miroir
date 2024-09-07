import { useMemo } from 'react';

import {
  ApplicationDeploymentConfiguration,
  ApplicationSection,
  DeploymentEntityState,
  DomainElementObject,
  Entity,
  EntityDefinition,
  LoggerInterface,
  MiroirLoggerFactory,
  SyncExtractorTemplateRunnerMap,
  RecordOfJzodObject,
  ReportSection,
  RootReportSection,
  Uuid,
  getLoggerName
} from "miroir-core";



import { packageName } from '../../../constants.js';
import { useMiroirContextService } from '../MiroirContextReactProvider.js';
import { cleanLevel } from '../constants.js';
import { deployments } from '../routes/ReportPage.js';
import { ReportSectionEntityInstance } from './ReportSectionEntityInstance.js';
import { ReportSectionListDisplay } from './ReportSectionListDisplay.js';

const loggerName: string = getLoggerName(packageName, cleanLevel,"ReportSectionView");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

export interface ReportSectionEntityInstanceProps {
  applicationSection: ApplicationSection,
  deploymentUuid: Uuid,
  queryResults: DomainElementObject,
  fetchedDataJzodSchema: RecordOfJzodObject | undefined,
  paramsAsdomainElements: DomainElementObject,
  reportSection: ReportSection,
  rootReportSection: RootReportSection,
  extractorRunnerMap: SyncExtractorTemplateRunnerMap<DeploymentEntityState>
}

// ###############################################################################################################
const evaluateExpression = (
  expression: string | undefined,
  domainElementObject: DomainElementObject
  ) => {
  const parts = expression?.split(".");
  const object =
    Array.isArray(parts) && parts.length > 0 && domainElementObject.elementValue
      ? (domainElementObject.elementValue as any)[parts[0]]
      // ? (domainElementObject.elementValue as any)[parts[0]].elementValue
      : undefined;
  const result = object && Array.isArray(parts) && parts.length > 1 ? (object as any)[parts[1]] : undefined;
  // log.info("evaluateExpression", expression, parts, props.domainElementObject, "object", object, "result", result);
  return result;
};

const interpolateExpression = (
  stringToInterpolate: string | undefined, 
  domainElementObject: DomainElementObject,
  label?: string,
) => {
  const reg = /\$\{([^}]*)\}/g;
  const result = stringToInterpolate
    ? stringToInterpolate.replace(
        reg,
        (expression, ...args) => `${evaluateExpression(args[0], domainElementObject)}`
      )
    : "no " + label;
  // log.info("interpolateExpression", "stringToInterpolate", stringToInterpolate, 
  //   "domainElementObject", domainElementObject, "label", label,
  //   "result", result);
  // log.info("interpolateExpression result",result);
  return result;
};


// ###############################################################################################################
export const ReportSectionView = (props: ReportSectionEntityInstanceProps) => {
  const context = useMiroirContextService();
  // const errorLog = useErrorLogService();

  log.info("########################## render with props", props);


  // ##############################################################################################
  const displayedDeploymentDefinition: ApplicationDeploymentConfiguration | undefined = deployments.find(
    (d) => d.uuid == props.deploymentUuid
  );
  log.info("ReportSectionView displayedDeploymentDefinition", displayedDeploymentDefinition);

  const { availableReports, entities, entityDefinitions } = useMemo(() => {
    return displayedDeploymentDefinition &&
      context.deploymentUuidToReportsEntitiesDefinitionsMapping &&
      context.deploymentUuidToReportsEntitiesDefinitionsMapping[displayedDeploymentDefinition?.uuid]
      ? context.deploymentUuidToReportsEntitiesDefinitionsMapping[displayedDeploymentDefinition?.uuid][
        props.applicationSection
        ]
      : { availableReports: [], entities: [], entityDefinitions: [] };
  }, [
    displayedDeploymentDefinition,
    context.deploymentUuidToReportsEntitiesDefinitionsMapping,
    props.applicationSection,
  ]);
    
  log.info("ReportSectionView availableReports",availableReports);

  const currentListReportTargetEntity: Entity | undefined =
    props.reportSection?.type === "objectListReportSection" 
      ? entities?.find(
          (e:Entity) =>
            e?.uuid === (props.reportSection?.definition as any)["parentUuid"]
        )
      : undefined;
  const currentListReportTargetEntityDefinition: EntityDefinition | undefined =
    entityDefinitions?.find((e:EntityDefinition) => e?.entityUuid === currentListReportTargetEntity?.uuid);

  const entityInstance = props.queryResults.elementValue && props.reportSection.type == "objectInstanceReportSection"
  ? (props.queryResults.elementValue as any)[
      props.reportSection.definition.fetchedDataReference ?? ""
    ]
    // ]?.elementValue
  : undefined

  log.info(
    "entityInstance",
    entityInstance,
    "props.reportSection.definition.fetchedDataReference",
    (props.reportSection?.definition as any)?.fetchedDataReference,
    "props",
    props
  );





  // log.info(
  //   "ReportSectionView displayedDeploymentDefinition",
  //   displayedDeploymentDefinition,
  //   "props.reportSection",
  //   props.reportSection,
  //   "currentReportTargetEntity",
  //   currentReportTargetEntity
  // );

  const styles = useMemo(()=>({
    // display: "flex",
    // width: '100%',
    // height: '100%',
    // flex: '1 1 auto',
    // overflow: "hidden",
    // height: "280px", // do not set height if domLayout='autoHeight' on AgGridReact
    width: "80vw",
  }),[])

  // log.info(
  //   "ReportSectionView",
  //   "deploymentUuid",
  //   props.deploymentUuid,
  //   props.applicationSection,
  //   "domainElement",
  //   props.domainElementObject
  // );

  // log.info('ReportSectionView props.reportSection',props.reportSection);



  if (props.applicationSection) {
    return (
      <div>
        {/* params:{JSON.stringify(params)}
        <p /> */}
        {/* <p>ReportSection</p> */}
        {props.applicationSection && props.reportSection ? (
          <div>
            {props.reportSection?.type === "grid" ? (
              <div>
                <table>
                  <tbody>
                    <tr>
                      <td>grid not supported yet!</td>
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
            )}
            {props.reportSection?.type === "list" ? (
              <div>
                <table>
                  <tbody>
                    {props.reportSection?.definition.map((innerReportSection, index) => {
                      return (
                        <tr key={index}>
                          <td>
                            <ReportSectionView
                              applicationSection={props.applicationSection}
                              queryResults={props.queryResults}
                              deploymentUuid={props.deploymentUuid}
                              fetchedDataJzodSchema={props.fetchedDataJzodSchema}
                              paramsAsdomainElements={props.paramsAsdomainElements}
                              reportSection={innerReportSection}
                              rootReportSection={props.rootReportSection}
                              extractorRunnerMap={props.extractorRunnerMap}
                              // instanceUuid={props.instanceUuid}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              // <div>Not a list!!</div>
              <div></div>
            )}
            {props.reportSection.type == "objectListReportSection" ? (
              <div>
                {/* {JSON.stringify(props.domainElementObject, circularReplacer(), 2)} */}
                {(currentListReportTargetEntity && currentListReportTargetEntityDefinition) || props.queryResults ? (
                  <ReportSectionListDisplay
                    tableComponentReportType="EntityInstance"
                    label={"EntityInstance-" + currentListReportTargetEntity?.name}
                    defaultlabel={interpolateExpression(props.reportSection.definition?.label, props.queryResults, "report label")}
                    styles={styles}
                    deploymentUuid={props.deploymentUuid}
                    chosenApplicationSection={props.applicationSection as ApplicationSection}
                    displayedDeploymentDefinition={displayedDeploymentDefinition}
                    domainElementObject={props.queryResults}
                    fetchedDataJzodSchema={props.fetchedDataJzodSchema}
                    section={props.reportSection}
                    paramsAsdomainElements={props.paramsAsdomainElements}
                  />
                ) : (
                  <div>error on object list {JSON.stringify(currentListReportTargetEntity)}</div>
                )}
              </div>
            ) : (
              <div></div>
            )}
            {props.reportSection.type == "objectInstanceReportSection" ? (
              <div>
                <ReportSectionEntityInstance
                  domainElement={props.queryResults}
                  instance={entityInstance}
                  applicationSection={props.applicationSection as ApplicationSection}
                  deploymentUuid={props.deploymentUuid}
                  entityUuid={props.reportSection.definition.parentUuid}
                />
              </div>
            ) : (
              <div></div>
            )}
          </div>
        ) : (
          <div>Oops, ReportSectionView could not be displayed.</div>
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
