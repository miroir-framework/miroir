import { useMemo } from 'react';

import {
  ApplicationSection,
  defaultMiroirModelEnvironment,
  defaultSelfApplicationDeploymentMap,
  Domain2ElementFailed,
  Domain2QueryReturnType,
  Entity,
  EntityDefinition,
  interpolateExpression,
  LoggerInterface,
  MiroirLoggerFactory,
  RecordOfJzodObject,
  Report,
  reportReportDetails,
  ReportSection,
  resolvePathOnObject,
  transformer_extended_apply_wrapper,
  TransformerFailure,
  Uuid,
  type ApplicationDeploymentMap,
  type JzodObject
} from "miroir-core";

import { useFormikContext } from 'formik';
import type { Params } from 'react-router-dom';
import { packageName, type ReportUrlParamKeys } from '../../../../constants.js';
import { useMiroirContextService } from '../../MiroirContextReactProvider.js';
import { cleanLevel } from '../../constants.js';
import { ReportDisplay } from '../../routes/ReportDisplay';
import { useRenderTracker } from '../../tools/renderCountTracker.js';
import GraphReportSectionView from '../Graph/GraphReportSectionView.js';
import { StoredRunnerView } from '../Runners/RunnerView';
import { ThemedOnScreenDebug, ThemedProgressiveAccordion } from '../Themes/BasicComponents';
import { ThemedBox, ThemedText } from '../Themes/index.js';
import { ReportSectionEntityInstance, type ValueObjectEditMode } from './ReportSectionEntityInstance.js';
import { ReportSectionListDisplay } from './ReportSectionListDisplay.js';
import { ReportSectionMarkdown } from './ReportSectionMarkdown.js';

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
  valueObjectEditMode: ValueObjectEditMode,
}

export interface ReportSectionViewWithEditorProps extends ReportSectionViewPropsBase {
  generalEditMode: boolean,
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
  const valueObjectEditMode = props.valueObjectEditMode || "update";

  const reportSectionDefinitionFromFormik: ReportSection | undefined =
    formik.values &&
    props.formikReportDefinitionPathString &&
    formik.values[props.formikReportDefinitionPathString] &&
    props.reportSectionPath
      ? resolvePathOnObject(
          formik.values[props.formikReportDefinitionPathString],
          props.reportSectionPath ?? []
        )
      : undefined;

  const reportSectionCurrentValueFromFormik: any = formik.values && props.formikReportDefinitionPathString
    ? formik.values[props.formikReportDefinitionPathString]
    : undefined;

  const currentNavigationKey = `${props.deploymentUuid}-${props.applicationSection}-${props.reportSectionPath ?? 'root'}`;
  const { navigationCount, totalCount } = useRenderTracker("ReportSectionViewWithEditor", currentNavigationKey);

  const { availableReports, entities, entityDefinitions } = useMemo(() => {
    return props.deploymentUuid &&
      context.deploymentUuidToReportsEntitiesDefinitionsMapping &&
      context.deploymentUuidToReportsEntitiesDefinitionsMapping[props.deploymentUuid]
      ? context.deploymentUuidToReportsEntitiesDefinitionsMapping[props.deploymentUuid][
        props.applicationSection
        ]
      : { availableReports: [], entities: [], entityDefinitions: [] };
  }, [context.deploymentUuidToReportsEntitiesDefinitionsMapping, props.deploymentUuid, props.applicationSection]);

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

  const storedReportDisplayParameters: Params<ReportUrlParamKeys> | TransformerFailure | undefined = useMemo(() => {
    if (reportSectionDefinitionFromFormik?.type !== "storedReportDisplay") {
      return undefined;
    }
    return transformer_extended_apply_wrapper(
      context.miroirContext.miroirActivityTracker, // activityTracker
      "runtime", // step
      [], // transformerPath
      reportSectionDefinitionFromFormik?.label ?? "evaluation of storedReportDisplay parameters", // label
      reportSectionDefinitionFromFormik?.definition, // transformer
      defaultMiroirModelEnvironment, // TODO: use the real environment
      formik.values, // queryParams
      formik.values, // contextResults - pass the instance to transform
      "value", // resolveBuildTransformersTo
    );
  }, [reportSectionDefinitionFromFormik]);

  // Render icon bar (edit/save/cancel)
  // const IconBar = () => (
  //   <div style={{ position: "absolute", top: 6, right: 6, zIndex: 10, display: "flex", gap: 6 }}>
  //     {!isEditing && props.generalEditMode && (
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
        {/* {props.generalEditMode && <IconBar />} */}
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
          {/* {props.generalEditMode && <IconBar />} */}
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
        {/* {props.generalEditMode && <IconBar />} */}
        {showPerformanceDisplay && (
          <ThemedText style={{ fontSize: "12px", opacity: 0.6 }}>
            ReportSectionViewWithEditor renders: {navigationCount} (total: {totalCount})
          </ThemedText>
        )}
        <ThemedOnScreenDebug
          label={"ReportSectionViewWithEditor - reportSectionDefinitionFromFormik"}
          data={reportSectionDefinitionFromFormik}
          initiallyUnfolded={false}
          copyButton={true}
          useCodeBlock={true}
        />
        {/* {props.reportSectionDEFUNCT.type == "objectListReportSection" && ( */}
        {reportSectionDefinitionFromFormik?.type == "accordionReportSection" && (
          // <></>
          <ThemedBox>
            <ThemedProgressiveAccordion
             style={{ marginBottom: 12 }}
             summary={reportSectionDefinitionFromFormik?.label}
             >
                {
                  <ReportSectionViewWithEditor
                    {...props}
                    reportSectionDEFUNCT={reportSectionDefinitionFromFormik?.definition}
                    reportSectionPath={[...(props.reportSectionPath ?? []), "definition"]}
                  />
                }
            </ThemedProgressiveAccordion>
          </ThemedBox>
        )}
        {reportSectionDefinitionFromFormik?.type == "objectListReportSection" && (
          <div>
            {currentListReportTargetEntity && currentListReportTargetEntityDefinition ? (
              <ReportSectionListDisplay
                tableComponentReportType="EntityInstance"
                label={"EntityInstance-" + currentListReportTargetEntity?.name}
                defaultlabel={interpolateExpression(
                  reportSectionDefinitionFromFormik?.definition?.label,
                  props.reportDataDEFUNCT.reportData,
                  "report label",
                )}
                application={props.application}
                applicationDeploymentMap={props.applicationDeploymentMap}
                deploymentUuid={props.deploymentUuid}
                chosenApplicationSection={props.applicationSection as ApplicationSection}
                paramsAsdomainElements={props.paramsAsdomainElements}
                //
                domainElementObjectDEFUNCT={props.reportDataDEFUNCT.reportData}
                fetchedDataJzodSchemaDEFUNCT={props.fetchedDataJzodSchemaDEFUNCT}
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
              valueObjectEditMode={valueObjectEditMode}
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
            />
          </>
        )}
        {reportSectionDefinitionFromFormik?.type == "storedReportDisplay" && (
          <div>
            <ThemedOnScreenDebug
              label={"ReportSectionViewWithEditor - storedReportDisplay section"}
              data={{ reportSectionDefinitionFromFormik, storedReportDisplayParameters }}
              useCodeBlock={true}
              // initiallyUnfolded={false}
            />
            {storedReportDisplayParameters instanceof TransformerFailure ? (
              <div style={{ color: "red" }}>
                Error evaluating storedReportDisplay parameters:{" "}
                {JSON.stringify(storedReportDisplayParameters, null, 2)}
              </div>
            ) : !storedReportDisplayParameters ? (
              <div>storedReportDisplay: no parameters found</div>
            ) : storedReportDisplayParameters?.reportUuid === reportReportDetails.uuid &&
              storedReportDisplayParameters?.instanceUuid === reportReportDetails.uuid ? (
              <div style={{ color: "red" }}>
                Report itself is not displayed on the reportDetails report to avoid infinite loop.
              </div>
            ) : (
              <ReportDisplay
                pageParams={{
                  application: storedReportDisplayParameters.application,
                  // applicationSection: storedReportDisplayParameters.applicationSection,
                  applicationSection: "data",
                  deploymentUuid: storedReportDisplayParameters.deploymentUuid,
                  reportUuid: storedReportDisplayParameters.instanceUuid,
                  instanceUuid: "none",
                }}
              />
            )}
          </div>
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
        {reportSectionDefinitionFromFormik?.type == "runnerReportSection" && (
          <>
            {reportSectionDefinitionFromFormik.definition.runnerReportSectionType ===
            "storedRunner" ? (
              <StoredRunnerView
                applicationUuid={props.application}
                applicationDeploymentMap={
                  props.applicationDeploymentMap ?? defaultSelfApplicationDeploymentMap
                }
                runnerUuid={reportSectionDefinitionFromFormik.definition.runner}
              />
            ) : (
              <div>
                Unsupported runner report section type:{" "}
                {reportSectionDefinitionFromFormik.definition.runnerReportSectionType}
              </div>
            )}
          </>
        )}
        {reportSectionDefinitionFromFormik?.type == "markdownReportSection" && (
          <ReportSectionMarkdown
            application={props.application}
            applicationDeploymentMap={props.applicationDeploymentMap}
            generalEditMode={props.generalEditMode}
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
