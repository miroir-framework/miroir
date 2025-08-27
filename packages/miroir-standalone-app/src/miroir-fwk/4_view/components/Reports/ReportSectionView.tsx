import { useMemo } from 'react';

import {
  SelfApplicationDeploymentConfiguration,
  ApplicationSection,
  Entity,
  EntityDefinition,
  LoggerInterface,
  MiroirLoggerFactory,
  RecordOfJzodObject,
  ReportSection,
  RootReport,
  Uuid,
  Domain2QueryReturnType
} from "miroir-core";



import { deployments, packageName } from '../../../../constants.js';
import { useMiroirContextService } from '../../MiroirContextReactProvider.js';
import { cleanLevel } from '../../constants.js';
import { ReportSectionEntityInstance } from './ReportSectionEntityInstance.js';
import { ReportSectionListDisplay } from './ReportSectionListDisplay.js';
import { GraphReportSectionView } from '../Graph/GraphReportSectionView.js';
import { useRenderTracker } from '../../tools/renderCountTracker.js';
import { ThemedBox } from '../Themes/ThemedComponents.js';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "ReportSectionView")
).then((logger: LoggerInterface) => {log = logger});



export interface ReportSectionViewProps {
  applicationSection: ApplicationSection,
  deploymentUuid: Uuid,
  queryResults: Domain2QueryReturnType<Record<string,any>>,
  fetchedDataJzodSchema: RecordOfJzodObject | undefined,
  paramsAsdomainElements: Domain2QueryReturnType<Record<string,any>>,
  reportSection: ReportSection,
  rootReport: RootReport,
  isOutlineOpen?: boolean,
  onToggleOutline?: () => void,
  showPerformanceDisplay?: boolean;
}

// ###############################################################################################################
const evaluateExpression = (
  expression: string | undefined,
  domainElementObject: Domain2QueryReturnType<Record<string,any>>
  ) => {
  const parts = expression?.split(".");
  const object =
    // Array.isArray(parts) && parts.length > 0 && domainElementObject.elementValue
    Array.isArray(parts) && parts.length > 0 && domainElementObject
      ? (domainElementObject as any)[parts[0]]
      : undefined;
  const result = object && Array.isArray(parts) && parts.length > 1 ? (object as any)[parts[1]] : undefined;
  // log.info("evaluateExpression", expression, parts, props.domainElementObject, "object", object, "result", result);
  return result;
};

const interpolateExpression = (
  stringToInterpolate: string | undefined, 
  domainElementObject: Domain2QueryReturnType<Record<string,any>>,
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
export const ReportSectionView = (props: ReportSectionViewProps) => {
  const context = useMiroirContextService();
  const showPerformanceDisplay = context.showPerformanceDisplay;

  // Track render counts with centralized tracker
  // Use deployment-level key to maintain consistency across all navigation within same deployment
  const currentNavigationKey = `${props.deploymentUuid}-${props.applicationSection}`;
  const { navigationCount, totalCount } = useRenderTracker("ReportSectionView", currentNavigationKey);

  log.info("########################## ReportSectionView render", "navigationCount", navigationCount, "totalCount", totalCount, "props", props);


  // ##############################################################################################
  const displayedDeploymentDefinition: SelfApplicationDeploymentConfiguration | undefined = deployments.find(
    (d) => d.uuid == props.deploymentUuid
  );
  // log.info("ReportSectionView displayedDeploymentDefinition", displayedDeploymentDefinition);

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
    
  // log.info("ReportSectionView availableReports",availableReports);

  const currentListReportTargetEntity: Entity | undefined =
    props.reportSection?.type === "objectListReportSection" 
      ? entities?.find(
          (e:Entity) =>
            e?.uuid === (props.reportSection?.definition as any)["parentUuid"]
        )
      : undefined;
  const currentListReportTargetEntityDefinition: EntityDefinition | undefined =
    entityDefinitions?.find(
      (e: EntityDefinition) => e?.entityUuid === currentListReportTargetEntity?.uuid
    );

  const entityInstance = props.queryResults && props.reportSection.type == "objectInstanceReportSection"
  ? (props.queryResults as any)[
      props.reportSection.definition.fetchedDataReference ?? ""
    ]
  : undefined

  // log.info(
  //   "entityInstance",
  //   entityInstance,
  //   "props.reportSection.definition.fetchedDataReference",
  //   (props.reportSection?.definition as any)?.fetchedDataReference,
  //   "props",
  //   props
  // );

  const styles = useMemo(()=>({
    width: "80vw",
  }),[])

  if (props.applicationSection) {
    return (
      <div>
        {props.applicationSection && props.reportSection ? (
          <div>
            {showPerformanceDisplay && (
              <ThemedBox 
                style={{ 
                  fontSize: '12px', 
                  opacity: 0.6, 
                  padding: '2px' 
                }}
              >
                ReportSectionView renders: {navigationCount} (total: {totalCount})
              </ThemedBox>
            )}
            {/* params:{JSON.stringify(params)}
            <p /> */}
            {/* <p>ReportSection</p> */}
            {props.reportSection?.type === "grid" ? (
              <div>
                <table>
                  <tbody>
                    <tr>
                      <td>grid not supported yet!</td>
                    </tr>
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
                              rootReport={props.rootReport}
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
            {props.reportSection.type == "graphReportSection" ? (
              <div>
                <GraphReportSectionView
                  applicationSection={props.applicationSection}
                  deploymentUuid={props.deploymentUuid}
                  queryResults={props.queryResults}
                  reportSection={props.reportSection as any}
                  showPerformanceDisplay={props.showPerformanceDisplay}
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
