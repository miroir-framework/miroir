import { useCallback, useMemo, useState } from 'react';

import {
  ApplicationSection,
  defaultMiroirModelEnvironment,
  Domain2ElementFailed,
  Domain2QueryReturnType,
  Entity,
  EntityDefinition,
  interpolateExpression,
  LoggerInterface,
  MiroirLoggerFactory,
  RecordOfJzodObject,
  Report,
  ReportSection,
  resolvePathOnObject,
  SelfApplicationDeploymentConfiguration,
  selfApplicationDeploymentMiroir,
  Uuid,
  type ApplicationDeploymentMap,
  type DomainControllerInterface,
  type InstanceAction,
  type JzodObject
} from "miroir-core";

import { CloseIcon, EditIcon, SaveIcon } from '../Themes/MaterialSymbolWrappers';
import { deployments, packageName } from '../../../../constants.js';
import { useDomainControllerService, useMiroirContextService } from '../../MiroirContextReactProvider.js';
import { cleanLevel } from '../../constants.js';
import { useRenderTracker } from '../../tools/renderCountTracker.js';
import GraphReportSectionView from '../Graph/GraphReportSectionView.js';
import { ThemedIconButton, ThemedText } from '../Themes/index.js';
import { ReportSectionEntityInstance } from './ReportSectionEntityInstance.js';
import { ReportSectionListDisplay } from './ReportSectionListDisplay.js';
import { ReportSectionMarkdown } from './ReportSectionMarkdown.js';
import { Formik, useFormikContext } from 'formik';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "ReportSectionViewWithEditor"), "UI",
).then((logger: LoggerInterface) => {log = logger});

// ################################################################################################
// ReportSectionViewWithEditor Component
// ################################################################################################
export interface ReportSectionViewPropsBase {
  applicationSection: ApplicationSection,
  application: Uuid,
  applicationDeploymentMap: ApplicationDeploymentMap,
  deploymentUuid: Uuid,
  paramsAsdomainElements: Domain2QueryReturnType<Record<string,any>>,
  // 
  // 
  reportDataDEFUNCT: Domain2QueryReturnType<{reportData:Record<string,any>, storedQueryData?: any}>, // shall use formikContext.values instead
  reportDefinitionDEFUNCT: Report,
  reportSectionDEFUNCT: ReportSection,
  fetchedDataJzodSchemaDEFUNCT: RecordOfJzodObject | undefined,
  // 
  // formikValuePath: ( string | number )[],
  formValueMLSchema: JzodObject;
  formikReportDefinitionPathString: string;
  reportSectionPath: ( string | number )[],
  reportName: string,
  // 
  isOutlineOpen?: boolean,
  onToggleOutline?: () => void,
  showPerformanceDisplay?: boolean;
  mode?: "create" | "update",
}

export interface ReportSectionViewWithEditorProps extends ReportSectionViewPropsBase {
  editMode: boolean,
  onSectionEdit?: (path: string, newDefinition: ReportSection) => void,
  onSectionCancel?: (path: string) => void,
  setAddObjectdialogFormIsOpen?: (a:boolean) => void,
  // isSectionModified?: boolean,
}

// ################################################################################################
/**
 * 
 * use:
 * useMiroirContextService to get context
 * useDomainControllerService to get domain controller
 * useRenderTracker to track renders
 * Formik for form management
 * 
 * @param props 
 * @returns 
 */
export const ReportSectionViewWithEditor = (props: ReportSectionViewWithEditorProps) => {
  const context = useMiroirContextService();
  const showPerformanceDisplay = context.showPerformanceDisplay;

  const formik = useFormikContext<Record<string, any>>();

  // log.info(
  //   "ReportSectionViewWithEditor: formik values =",
  //   formik.values,
  //   "props.formikReportDefinitionPathString =",
  //   props.formikReportDefinitionPathString,
  //   "props.reportSectionPath =",
  //   props.reportSectionPath
  // );
  const reportDefinitionFromFormik: Report  | undefined =
    formik.values &&
    props.formikReportDefinitionPathString &&
    formik.values[props.formikReportDefinitionPathString]
      ? formik.values[props.formikReportDefinitionPathString]
      // : props.reportDefinitionDEFUNCT;
      : undefined;
  ;

  // const formikReportSectionDefinitionPathString = [props.formikReportDefinitionPathString, ...(props.reportSectionPath ?? [])].join(".");

  const reportSectionDefinitionFromFormik: ReportSection | undefined =
    formik.values &&
    props.formikReportDefinitionPathString &&
    formik.values[props.formikReportDefinitionPathString] &&
    props.reportSectionPath
      ? resolvePathOnObject(
          // props.reportDefinitionDEFUNCT, props.reportSectionPath ?? []
          formik.values[props.formikReportDefinitionPathString],
          props.reportSectionPath ?? []
        )
      : undefined;

  // const reportSectionCurrentValueFromFormik: any = formik.values && props.reportSectionPath
  const reportSectionCurrentValueFromFormik: any = formik.values && props.formikReportDefinitionPathString
    ? formik.values[props.formikReportDefinitionPathString]
    : undefined;

  // const currentNavigationKey = `${props.deploymentUuid}-${props.applicationSection}-${props.reportSectionPath.join("_") ?? 'root'}`;
  const currentNavigationKey = `${props.deploymentUuid}-${props.applicationSection}-${props.reportSectionPath ?? 'root'}`;
  const { navigationCount, totalCount } = useRenderTracker("ReportSectionViewWithEditor", currentNavigationKey);

  // log.info(
  //   "ReportSectionViewWithEditor render",
  //   reportSectionDefinitionFromFormik?.type,
  //   currentNavigationKey,
  //   "reportSectionDefinitionFromFormik",
  //   reportSectionDefinitionFromFormik,
  //   "props",
  //   props
  // );

  // const [isEditing, setIsEditing] = useState(false);
  // // const [localEditedDefinition, setLocalEditedDefinition] = useState<any | undefined>(undefined);
  // const [hasValidationErrors, setHasValidationErrors] = useState(false);

  const displayedDeploymentDefinition: SelfApplicationDeploymentConfiguration | undefined = deployments.find(
    (d) => d.uuid == props.deploymentUuid
  );

  const { availableReports, entities, entityDefinitions } = useMemo(() => {
    return displayedDeploymentDefinition &&
      context.deploymentUuidToReportsEntitiesDefinitionsMapping &&
      context.deploymentUuidToReportsEntitiesDefinitionsMapping[displayedDeploymentDefinition?.uuid]
      ? context.deploymentUuidToReportsEntitiesDefinitionsMapping[displayedDeploymentDefinition?.uuid][
        props.applicationSection
        ]
      : { availableReports: [], entities: [], entityDefinitions: [] };
  }, [displayedDeploymentDefinition, context.deploymentUuidToReportsEntitiesDefinitionsMapping, props.applicationSection]);

  // // Get Report entity definition from Miroir model (for TypedValueObjectEditor schema)
  // const reportEntityDefinition = useMemo(() => {
  //   const miroirMapping = context.deploymentUuidToReportsEntitiesDefinitionsMapping?.[selfApplicationDeploymentMiroir.uuid];
  //   if (!miroirMapping) return undefined;
  //   return miroirMapping["model"]?.entityDefinitions?.find((ed: any) => ed.name === "Report");
  // }, [context.deploymentUuidToReportsEntitiesDefinitionsMapping]);

  const currentListReportTargetEntity: Entity | undefined =
    props.reportSectionDEFUNCT?.type === "objectListReportSection"
      ? entities?.find((e:Entity) => e?.uuid === (props.reportSectionDEFUNCT?.definition as any)["parentUuid"]) 
      : undefined;

  const currentListReportTargetEntityDefinition: EntityDefinition | undefined =
    entityDefinitions?.find((e: EntityDefinition) => e?.entityUuid === currentListReportTargetEntity?.uuid);

  if (props.reportDataDEFUNCT instanceof Domain2ElementFailed) { // never happens in normal flow
    throw new Error(`ReportSectionViewWithEditor: Error in report data: ${props.reportDataDEFUNCT}`);
  }

  const objectInstanceReportSectionEntityInstanceDEFUNCT =
    props.reportDataDEFUNCT && props.reportSectionDEFUNCT.type == "objectInstanceReportSection"
      ? props.reportDataDEFUNCT.reportData[
          props.reportSectionDEFUNCT.definition.fetchedDataReference ?? ""
        ]
      : undefined;

  // // helper to get active definition (if editing locally)
  // const activeDefinitionDEFUNCT =
  //   isEditing && localEditedDefinition !== undefined
  //     ? localEditedDefinition
  //     : props.reportSectionDEFUNCT.definition;

  // Render icon bar (edit/save/cancel)
  // const IconBar = () => (
  //   <div style={{ position: "absolute", top: 6, right: 6, zIndex: 10, display: "flex", gap: 6 }}>
  //     {!isEditing && props.editMode && (
  //       <ThemedIconButton
  //         title={props.isSectionModified ? "Section modified" : "Edit section"}
  //         onClick={() => {
  //           // setLocalEditedDefinition(props.reportSectionDEFUNCT.definition);
  //           formik.setFieldValue(formikReportSectionDefinitionPathString)
  //           setIsEditing(true);
  //         }}
  //       >
  //         <EditIcon style={{ color: props.isSectionModified ? "darkred" : "grey" }} />
  //       </ThemedIconButton>
  //     )}
  //     {isEditing && (
  //       <>
  //         <ThemedIconButton
  //           title={hasValidationErrors ? "Cannot save - validation errors present" : "Save section"}
  //           onClick={() => {
  //             if (hasValidationErrors) {
  //               log.info("Save blocked due to validation errors");
  //               return;
  //             }
  //             try {
  //               const newDef = localEditedDefinition ?? props.reportSectionDEFUNCT.definition;
  //               props.onSectionEdit &&
  //                 // props.onSectionEdit(props.sectionPath ?? "", {
  //                 props.onSectionEdit(props.reportSectionPath?.join(".") ?? "", {
  //                   // ...props.reportSectionDEFUNCT,
  //                   ...localEditedDefinition,
  //                   definition: newDef,
  //                 });
  //               setIsEditing(false);
  //               setLocalEditedDefinition(undefined);
  //               setHasValidationErrors(false);
  //             } catch (e) {
  //               log.info("Save failed", e);
  //             }
  //           }}
  //           disabled={hasValidationErrors}
  //         >
  //           <SaveIcon style={{ color: hasValidationErrors ? "grey" : "green" }} />
  //         </ThemedIconButton>
  //         <ThemedIconButton
  //           title="Cancel"
  //           onClick={() => {
  //             setIsEditing(false);
  //             setLocalEditedDefinition(undefined);
  //             setHasValidationErrors(false);
  //             props.onSectionCancel && props.onSectionCancel(props.reportSectionPath?.join(".") ?? "");
  //           }}
  //         >
  //           <CloseIcon />
  //         </ThemedIconButton>
  //       </>
  //     )}
  //   </div>
  // );

  // ##############################################################################################
  // FORMIK
  // const domainController: DomainControllerInterface = useDomainControllerService();
  // const currentModelEnvironment = defaultMiroirModelEnvironment;
  // const reportSectionPathAsString = props.reportSectionPath?.join("_") || "";

  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // For grid/list sections, recurse using this wrapper so editor props propagate
  if (reportSectionDefinitionFromFormik?.type === 'grid') {
    return (
      <div style={{ position: "relative" }}>
        {/* {props.editMode && <IconBar />} */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}>
          {reportSectionDefinitionFromFormik?.definition.map((row, rowIndex) => (
            <div
              key={`row-${rowIndex}`}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 400px), 1fr))",
                gap: "16px",
                width: "100%",
              }}
            >
              {row.map((innerReportSection, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  style={{
                    minWidth: 0,
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                  }}
                >
                  <ReportSectionViewWithEditor
                    {...props}
                    reportSectionDEFUNCT={innerReportSection}
                    // sectionPath={(props.sectionPath ?? '') + `/definition[${rowIndex}][${colIndex}]`}
                    reportSectionPath={[
                      ...(props.reportSectionPath ?? []),
                      "definition",
                      rowIndex,
                      colIndex,
                    ]}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (reportSectionDefinitionFromFormik?.type === "list") {
    return (
      <>
        {/* <span>ReportSectionViewEditor list</span> */}
        <div style={{ position: "relative" }}>
          {/* {props.editMode && <IconBar />} */}
          {reportSectionDefinitionFromFormik?.definition.map((innerReportSection, index) => (
            <div key={index} style={{ marginBottom: "2em", position: "relative" }}>
              <ReportSectionViewWithEditor
                {...props}
                reportSectionDEFUNCT={innerReportSection}
                // sectionPath={(props.sectionPath ?? '') + `/definition[${index}]`}
                reportSectionPath={[...(props.reportSectionPath ?? []), "definition", index]}
              />
            </div>
          ))}
        </div>
      </>
    );
  }

    // ##############################################################################################
  
  // Leaf section types
  return (
    <>
      <div style={{ position: "relative" }}>
        {/* {props.editMode && <IconBar />} */}
        {showPerformanceDisplay && (
          <ThemedText style={{ fontSize: "12px", opacity: 0.6 }}>
            ReportSectionViewWithEditor renders: {navigationCount} (total: {totalCount})
          </ThemedText>
        )}
        {/* {props.reportSectionDEFUNCT.type == "objectListReportSection" && ( */}
        {reportSectionDefinitionFromFormik?.type == "objectListReportSection" && (
          <div>
            {currentListReportTargetEntity && currentListReportTargetEntityDefinition ? (
              <ReportSectionListDisplay
                tableComponentReportType="EntityInstance"
                label={"EntityInstance-" + currentListReportTargetEntity?.name}
                defaultlabel={interpolateExpression(
                  reportSectionDefinitionFromFormik?.definition?.label,
                  props.reportDataDEFUNCT.reportData,
                  "report label"
                )}
                application={props.application}
                applicationDeploymentMap={props.applicationDeploymentMap}
                deploymentUuid={props.deploymentUuid}
                chosenApplicationSection={props.applicationSection as ApplicationSection}
                paramsAsdomainElements={props.paramsAsdomainElements}
                displayedDeploymentDefinition={displayedDeploymentDefinition} // ??
                //
                domainElementObjectDEFUNCT={props.reportDataDEFUNCT.reportData}
                fetchedDataJzodSchemaDEFUNCT={props.fetchedDataJzodSchemaDEFUNCT}
                // reportSectionDEFUNCT={props.reportSectionDEFUNCT}
                reportSectionDEFUNCT={reportSectionDefinitionFromFormik}
                //
                formikValuePath={props.reportSectionPath}
                formikReportDefinitionPathString={props.formikReportDefinitionPathString}
                reportSectionPath={props.reportSectionPath}
              />
            ) : (
              <></>
              // <div>error on object list {JSON.stringify(currentListReportTargetEntity)}</div>
            )}
          </div>
        )}
        {reportSectionDefinitionFromFormik?.type == "objectInstanceReportSection" && (
          <>
            <ReportSectionEntityInstance
              application={props.application}
              applicationDeploymentMap={props.applicationDeploymentMap}
              applicationSection={props.applicationSection as ApplicationSection}
              deploymentUuid={props.deploymentUuid}
              // 
              initialInstanceValueDEFUNCT={objectInstanceReportSectionEntityInstanceDEFUNCT}
              entityUuidDEFUNCT={reportSectionDefinitionFromFormik.definition.parentUuid} // entityUuid-based section display, independent of report section definition
              //
              formikValuePath={props.reportSectionPath}
              formikReportDefinitionPathString={props.formikReportDefinitionPathString}
              reportSectionPath={props.reportSectionPath}
              formValueMLSchema={props.formValueMLSchema}
              formikAlreadyAvailable={true}
              // 
              setAddObjectdialogFormIsOpen={props.setAddObjectdialogFormIsOpen}
              mode={props.mode || "update"}
            />
          </>
        )}
        {reportSectionDefinitionFromFormik?.type == "graphReportSection" && (
          <div>
            <GraphReportSectionView
              applicationSection={props.applicationSection}
              deploymentUuid={props.deploymentUuid}
              queryResults={formik.values}
              reportSection={reportSectionDefinitionFromFormik as any}
              showPerformanceDisplay={props.showPerformanceDisplay}
            />
          </div>
        )}
        {/* {props.reportSectionDEFUNCT.type == "markdownReportSection" && ( */}
        {reportSectionDefinitionFromFormik?.type == "markdownReportSection" && (
          <ReportSectionMarkdown
            editMode={props.editMode}
            reportName={props.reportName}
            formikValuePath={props.reportSectionPath}
            formikReportDefinitionPathString={props.formikReportDefinitionPathString}
            reportSectionPath={props.reportSectionPath}
            applicationSection={props.applicationSection}
            deploymentUuid={props.deploymentUuid}
            label={reportSectionCurrentValueFromFormik.definition.label}
            showPerformanceDisplay={props.showPerformanceDisplay}
          />
        )}
      </div>
    </>
  );
};

export default ReportSectionViewWithEditor;
