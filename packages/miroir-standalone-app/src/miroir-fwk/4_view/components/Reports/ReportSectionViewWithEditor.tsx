import { useCallback, useMemo, useState } from 'react';

import {
  ApplicationSection,
  defaultMiroirModelEnvironment,
  defaultSelfApplicationDeploymentMap,
  Domain2QueryReturnType,
  Entity,
  getApplicationSection,
  LoggerInterface,
  MiroirLoggerFactory,
  ReportSection,
  resolvePathOnObject,
  transformer_extended_apply_wrapper,
  TransformerFailure,
  Uuid,
  type ApplicationDeploymentMap,
  type MlObject,
} from "miroir-core";

import { useFormikContext } from 'formik';
import { JsonDisplayHelper, useMiroirContextService } from 'miroir-react';
import type { Params } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { packageName, type ReportUrlParamKeys } from '../../../../constants.js';
import { cleanLevel } from '../../constants.js';
import { useCurrentModel, useCurrentModelEnvironment } from '../../ReduxHooks.js';
import { reportUrl } from '../../navigation.js';
import { ReportDisplay } from '../../routes/ReportDisplay';
import {
  OpenReportModal,
  openReportHref,
  resolveOpenReportPageParams,
} from './OpenReportLaunch.js';
import { RenderInsightHeader } from '../RenderInsightHeader.js';
import { useRenderTracker } from '../../tools/renderCountTracker.js';
import GraphReportSectionView from '../Graph/GraphReportSectionView.js';
import { StoredRunnerView } from '../Runners/RunnerView';
import { ThemedProgressiveAccordion } from '../Themes/BasicComponents';
import { ThemedBox, ThemedStyledButton, ThemedText } from '../Themes/index.js';
import { ModelDiagramReportSectionView } from './ModelDiagramReportSectionView.js';
import { ReportSectionEntityInstance, type ValueObjectEditMode } from './ReportSectionEntityInstance.js';
import { ReportSectionListDisplay } from './ReportSectionListDisplay.js';
import { ReportSectionMarkdown } from './ReportSectionMarkdown.js';
import { ReportSectionMiroirTest } from './ReportSectionMiroirTest.js';
import { TypedValueObjectEditor } from './TypedValueObjectEditor.js';
import { TransformerRunnerReportSectionView } from './TransformerRunner.js';
import { ReportInputSection } from './ReportInputSection.js';
import { resolveApiCallReportSectionSchema } from './resolveApiCallReportSectionSchema.js';
import {
  isMultistepStepEnvelope,
  useOptionalMultistepReportHost,
} from './MultistepReportHost.js';

import {
  entityEntity,
  entityEntityVersion,
  reportEntityDetails,
  reportEntityVersionDetails,
  reportReportDetails,
} from "miroir-test-app_deployment-miroir";
const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "ReportSectionViewWithEditor");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName, "UI",
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

function OpenReportSectionView(props: {
  spec: {
    label: string;
    reportUuid: string;
    openAs: "modal" | "route";
    application?: string;
    applicationSection?: "data" | "model" | "modelVersion";
    deploymentUuid?: string;
  };
  application: Uuid;
  applicationSection: ApplicationSection;
  deploymentUuid: Uuid;
  callerPageParams?: Params<ReportUrlParamKeys>;
}) {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const pageContext = {
    application: props.application,
    applicationSection: props.applicationSection,
    deploymentUuid: props.deploymentUuid,
  };
  const pageParams = resolveOpenReportPageParams(
    props.spec,
    pageContext,
    undefined,
    props.callerPageParams,
  );

  return (
    <>
      <ThemedStyledButton
        type="button"
        variant="contained"
        data-testid={`open-report-section-${props.spec.openAs}`}
        onClick={() => {
          if (props.spec.openAs === "route") {
            navigate(openReportHref(props.spec, pageContext, undefined, props.callerPageParams));
            return;
          }
          setModalOpen(true);
        }}
      >
        {props.spec.label}
      </ThemedStyledButton>
      {props.spec.openAs === "modal" ? (
        <OpenReportModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title={props.spec.label}
        >
          <ReportDisplay pageParams={pageParams} onDismissed={() => setModalOpen(false)} />
        </OpenReportModal>
      ) : null}
    </>
  );
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
  const navigate = useNavigate();
  const multistepHost = useOptionalMultistepReportHost();

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

  const currentModel = useCurrentModel(props.application, props.applicationDeploymentMap);
  const env = useCurrentModelEnvironment(props.application, props.applicationDeploymentMap);

  const entities = useMemo(() => {
    const result = props.deploymentUuid &&
      context.deploymentUuidToReportsEntitiesMapping &&
      context.deploymentUuidToReportsEntitiesMapping[props.deploymentUuid]
      ? context.deploymentUuidToReportsEntitiesMapping[props.deploymentUuid][
        props.applicationSection
        ]
      : {entities: []};
    return (result?.entities??[]) as Entity[];
  }, [context.deploymentUuidToReportsEntitiesMapping, props.deploymentUuid, props.applicationSection]);

  const currentListReportTargetEntity: Entity | undefined =
    reportSectionDefinitionFromFormik?.type === "objectListReportSection"
      ? entities?.find((e:Entity) => e?.uuid === (reportSectionDefinitionFromFormik?.definition as any)["parentUuid"])
        ?? currentModel.entities?.find((e:Entity) => e?.uuid === (reportSectionDefinitionFromFormik?.definition as any)["parentUuid"])
      : undefined;

  const reportDefinitionForBinding = props.formikReportDefinitionPathString
    ? formik.values?.[props.formikReportDefinitionPathString]
    : undefined;
  const apiCallSectionDefinition =
    reportSectionDefinitionFromFormik?.type === "apiCallReportSection"
      ? reportSectionDefinitionFromFormik.definition
      : undefined;
  const apiCallSchemaOrError = apiCallSectionDefinition
    ? resolveApiCallReportSectionSchema({
        section: apiCallSectionDefinition,
        extractorTemplates: reportDefinitionForBinding?.definition?.extractorTemplates,
        extractors: reportDefinitionForBinding?.definition?.extractors,
        endpointsByUuid: env.endpointsByUuid,
        endpointsFallback: currentModel.endpoints,
      })
    : undefined;
  const apiCallResponseSchema =
    apiCallSchemaOrError?.ok === true ? apiCallSchemaOrError.schema : undefined;
  const apiCallBindingError =
    apiCallSchemaOrError?.ok === false ? apiCallSchemaOrError.error : undefined;
  const apiCallPayload = apiCallSectionDefinition
    ? formik.values?.[props.reportSectionPath.join("_")]
    : undefined;

  /**
   * Entities to render in a modelDiagramReportSection.
   * Prefer the section definition field (metamodel still named `entityDefinitions`)
   * when present; otherwise the deployment mapping `entities`.
   */
  const modelDiagramEntities: Entity[] = useMemo(() => {
    if (reportSectionDefinitionFromFormik?.type !== "modelDiagramReportSection") return [];
    const sectionEntitiesInput = (reportSectionDefinitionFromFormik as any).definition?.entityDefinitions;
    if (!sectionEntitiesInput) {
      return (entities ?? []).filter((entity) => !!entity.mlSchema);
    }
    if (Array.isArray(sectionEntitiesInput)) {
      return sectionEntitiesInput as Entity[];
    }
    const result = transformer_extended_apply_wrapper(
      context.miroirContext.miroirActivityTracker,
      "runtime",
      [],
      (reportSectionDefinitionFromFormik as any).definition?.label ?? "modelDiagramReportSection entities",
      sectionEntitiesInput,
      "value",
      defaultMiroirModelEnvironment,
      formik.values,
      formik.values,
    );
    if (!result || result instanceof TransformerFailure || !Array.isArray(result)) return [];
    return result as Entity[];
  }, [reportSectionDefinitionFromFormik, formik.values, entities, context.miroirContext.miroirActivityTracker]);

  const modelDiagramMode =
    reportSectionDefinitionFromFormik?.type === "modelDiagramReportSection"
      ? ((reportSectionDefinitionFromFormik as any).definition?.mode as "Entity" | "EntityVersion" | undefined) ??
        "Entity"
      : "Entity";

  const handleModelDiagramClassClick = useCallback(
    (instanceUuid: string) => {
      const detailsReport =
        modelDiagramMode === "EntityVersion" ? reportEntityVersionDetails : reportEntityDetails;
      const targetEntityUuid =
        modelDiagramMode === "EntityVersion"
          ? (entityEntityVersion as any).uuid
          : (entityEntity as any).uuid;
      const applicationSection = getApplicationSection(props.application, targetEntityUuid);
      log.info("Model diagram class clicked", {
        mode: modelDiagramMode,
        instanceUuid,
        reportUuid: (detailsReport as any).uuid,
        applicationSection,
      });
      navigate(
        reportUrl(
          props.application,
          props.deploymentUuid,
          applicationSection,
          (detailsReport as any).uuid,
          instanceUuid,
        ),
      );
    },
    [modelDiagramMode, navigate, props.application, props.deploymentUuid],
  );

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
      "value", // resolveBuildTransformersTo
      defaultMiroirModelEnvironment, // TODO: use the real environment
      formik.values, // queryParams
      formik.values, // contextResults - pass the instance to transform
    );
  }, [reportSectionDefinitionFromFormik]);

  // Render icon bar (edit/save/cancel)
  // const IconBar = () => (
  //   <div style={{ position: "absolute", top: 6, right: 6, zIndex: 10, display: "flex", gap: 6 }}>
  //     {!isEditing && props.generalEditMode && (
  //       <ThemedIconButton
  //         title={props.isSectionModified ? "Section modified" : "Edit section"}
  //         onClick={() => {
  //           // setLocalEditedDefinition(reportSectionDefinitionFromFormik.definition);
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
  //               const newDef = localEditedDefinition ?? reportSectionDefinitionFromFormik.definition;
  //               props.onSectionEdit &&
  //                 // props.onSectionEdit(props.sectionPath ?? "", {
  //                 props.onSectionEdit(props.reportSectionPath?.join(".") ?? "", {
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

  // Hooks must stay above any early return (Rules of Hooks).
  const storedReportDisplayPageParams = useMemo(() => {
    if (storedReportDisplayParameters instanceof TransformerFailure) {
      return undefined;
    }
    return {
      application: storedReportDisplayParameters?.application,
      applicationSection: "data",
      deploymentUuid: storedReportDisplayParameters?.deploymentUuid,
      reportUuid: storedReportDisplayParameters?.instanceUuid,
      instanceUuid: "none",
    };
  }, [storedReportDisplayParameters]);

  if (storedReportDisplayParameters instanceof TransformerFailure) {
    return (
      <div style={{ color: "red" }}>
        Error evaluating storedReportDisplay parameters:{" "}
        {JSON.stringify(storedReportDisplayParameters, null, 2)}
      </div>
    );
  }
  
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
          {reportSectionDefinitionFromFormik?.definition.map((innerReportSection, index) => {
            const childPath = isMultistepStepEnvelope(innerReportSection)
              ? [...(props.reportSectionPath ?? []), "definition", index, "section"]
              : [...(props.reportSectionPath ?? []), "definition", index];
            return (
              <div key={index} style={{ marginBottom: "2em", position: "relative" }}>
                <ReportSectionViewWithEditor
                  {...props}
                  reportSectionPath={childPath}
                />
              </div>
            );
          })}
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
          <RenderInsightHeader
            componentName="ReportSectionViewWithEditor"
            navigationCount={navigationCount}
            totalCount={totalCount}
            formikPath={
              props.formikReportDefinitionPathString ||
              props.reportSectionPath?.join(".")
            }
          />
        )}
        <JsonDisplayHelper
          debug={true}
          componentName={`ReportSectionViewWithEditor ${reportSectionDefinitionFromFormik?.type} ${props.reportSectionPath?.join(".")}`}
          elements={[
            {
              label: "reportSectionDefinitionFromFormik",
              data: reportSectionDefinitionFromFormik,
              useCodeBlock: true,
              copyButton: true,
            },
            {
              label: "storedReportDisplay parameters",
              data: { reportSectionDefinitionFromFormik, storedReportDisplayParameters },
              useCodeBlock: true,
            },
          ]}
        />
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
                  reportSectionPath={[...(props.reportSectionPath ?? []), "definition"]}
                />
              }
            </ThemedProgressiveAccordion>
          </ThemedBox>
        )}
        {reportSectionDefinitionFromFormik?.type == "objectListReportSection" && (
          <div>
            {currentListReportTargetEntity ? (
              <ReportSectionListDisplay
                formikValuePath={props.reportSectionPath}
                formikReportDefinitionPathString={props.formikReportDefinitionPathString}
                reportSectionPath={props.reportSectionPath}
                //
                tableComponentReportType="EntityInstance"
                label={"EntityInstance-" + currentListReportTargetEntity?.name}
                application={props.application}
                applicationDeploymentMap={props.applicationDeploymentMap}
                deploymentUuid={props.deploymentUuid}
                chosenApplicationSection={props.applicationSection as ApplicationSection}
                paramsAsdomainElements={props.paramsAsdomainElements}
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
              formikValuePath={props.reportSectionPath}
              formikReportDefinitionPathString={props.formikReportDefinitionPathString}
              reportSectionPath={props.reportSectionPath}
              //
              valueObjectEditMode={valueObjectEditMode}
              application={props.application}
              applicationDeploymentMap={props.applicationDeploymentMap}
              applicationSection={props.applicationSection as ApplicationSection}
              deploymentUuid={props.deploymentUuid}
              //
              setAddObjectdialogFormIsOpen={props.setAddObjectdialogFormIsOpen}
            />
          </>
        )}
        {reportSectionDefinitionFromFormik?.type == "apiCallReportSection" && (
          apiCallBindingError ? (
            <div>{apiCallBindingError}</div>
          ) : apiCallResponseSchema && apiCallPayload != null ? (
            <TypedValueObjectEditor
              labelElement={
                reportSectionDefinitionFromFormik.definition.label ? (
                  <h2>{reportSectionDefinitionFromFormik.definition.label}</h2>
                ) : undefined
              }
              formValueMLSchema={apiCallResponseSchema}
              formikValuePathAsString={props.reportSectionPath.join("_")}
              application={props.application}
              applicationDeploymentMap={props.applicationDeploymentMap}
              deploymentUuid={props.deploymentUuid}
              applicationSection={props.applicationSection}
              formLabel={reportSectionDefinitionFromFormik.definition.label ?? "API call"}
              zoomInPath=""
              maxRenderDepth={Infinity}
              displaySubmitButton="noDisplay"
              useActionButton={false}
              valueObjectEditMode={valueObjectEditMode}
              readonly={true}
            />
          ) : apiCallResponseSchema ? (
            <ThemedText>
              {reportSectionDefinitionFromFormik.definition.label
                ? `${reportSectionDefinitionFromFormik.definition.label}: no API response yet.`
                : "No API response yet."}
            </ThemedText>
          ) : (
            <div>
              {`Could not resolve Endpoint operation responseSchema for endpoint ${reportSectionDefinitionFromFormik.definition.endpointUuid} operation ${reportSectionDefinitionFromFormik.definition.operationId}`}
            </div>
          )
        )}
        {reportSectionDefinitionFromFormik?.type == "storedReportDisplay" && (
          <div>
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
            ) : storedReportDisplayPageParams && (
              <ReportDisplay pageParams={storedReportDisplayPageParams} />
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
        {reportSectionDefinitionFromFormik?.type == "modelDiagramReportSection" && (
          <ModelDiagramReportSectionView
            entities={modelDiagramEntities}
            mode={modelDiagramMode}
            label={(reportSectionDefinitionFromFormik as any).definition?.label}
            title={(reportSectionDefinitionFromFormik as any).definition?.title}
            direction={(reportSectionDefinitionFromFormik as any).definition?.direction}
            onClassClick={handleModelDiagramClassClick}
            applicationSection={props.applicationSection}
            deploymentUuid={props.deploymentUuid}
            showPerformanceDisplay={props.showPerformanceDisplay}
          />
        )}
        {reportSectionDefinitionFromFormik?.type == "transformerRunnerReportSection" && (
          <TransformerRunnerReportSectionView
            reportSectionDefinition={reportSectionDefinitionFromFormik as any}
            application={props.application}
            applicationDeploymentMap={props.applicationDeploymentMap}
            deploymentUuid={props.deploymentUuid}
          />
          // <>
          //   {reportSectionDefinitionFromFormik.definition.transformerRunnerReportSectionType ===
          //   "storedTransformer" ? (
          //     <div>
          //       Unsupported transformer runner report section type: storedTransformer.
          //       This section type is reserved for future use to display the output of a stored
          //       transformer in a report section. In the meantime, you can achieve similar functionality
          //       by using a transformer to evaluate the stored transformer and then passing the result
          //        to a supported report section type (e.g. markdownReportSection or jsonReportSection) for display.
          //     </div>
          //     // <StoredRunnerView
          //     //   applicationUuid={props.application}
          //     //   applicationDeploymentMap={
          //     //     props.applicationDeploymentMap ?? defaultSelfApplicationDeploymentMap
          //     //   }
          //     //   runnerUuid={reportSectionDefinitionFromFormik.definition.runner}
          //     // />
          //   ) : (
          //     <div>
          //       Unsupported runner report section type:{" "}
          //       {reportSectionDefinitionFromFormik.definition.transformerRunnerReportSectionType}
          //     </div>
          //   )}
          // </>
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
        {reportSectionDefinitionFromFormik?.type == "miroirTestReportSection" && (
          <ReportSectionMiroirTest
            reportName={props.reportName}
            reportSectionPath={props.reportSectionPath}
            showPerformanceDisplay={props.showPerformanceDisplay}
          />
        )}
        {reportSectionDefinitionFromFormik?.type == "markdownReportSection" && (
          <ReportSectionMarkdown
            formikValuePath={props.reportSectionPath}
            formikReportDefinitionPathString={props.formikReportDefinitionPathString}
            reportSectionPath={props.reportSectionPath}
            generalEditMode={props.generalEditMode}
            application={props.application}
            applicationDeploymentMap={props.applicationDeploymentMap}
            reportName={props.reportName}
            applicationSection={props.applicationSection}
            deploymentUuid={props.deploymentUuid}
            label={reportSectionCurrentValueFromFormik.definition.label}
            showPerformanceDisplay={props.showPerformanceDisplay}
          />
        )}
        {reportSectionDefinitionFromFormik?.type == "jsonReportSection" && (
          <pre
            style={{
              maxHeight: "400px",
              overflow: "auto",
              backgroundColor: "#f0f0f0",
              padding: "10px",
            }}
          >
            {JSON.stringify(
              formik.values[
                reportSectionDefinitionFromFormik.definition.fetchedDataReference ?? ""
              ],
              null,
              2,
            )}
          </pre>
          // <JsonDisplayHelper
          //   debug={true}
          //   componentName="ReportSectionViewWithEditor - jsonReportSection"
          //   elements={[
          //     {
          //       label: "reportSectionDefinitionFromFormik",
          //       data: reportSectionDefinitionFromFormik,
          //       useCodeBlock: true,
          //       copyButton: true,
          //     },
          //   ]}
          // />
        )}
        {reportSectionDefinitionFromFormik?.type == "openReportSection" && (
          <OpenReportSectionView
            spec={reportSectionDefinitionFromFormik.definition}
            application={props.application}
            applicationSection={props.applicationSection}
            deploymentUuid={props.deploymentUuid}
            callerPageParams={props.paramsAsdomainElements as Params<ReportUrlParamKeys>}
          />
        )}
        {reportSectionDefinitionFromFormik?.type == "inputReportSection" && (
          <ReportInputSection
            label={reportSectionDefinitionFromFormik.definition.label ?? "Report Input"}
            inputPrefix={
              reportSectionDefinitionFromFormik.definition.inputPrefix ??
              props.reportSectionPath.join("_") + "_inputMLSchema"
            }
            inputMLSchema={
              (multistepHost?.resolvedInputSchema ??
                reportSectionDefinitionFromFormik.definition.inputMLSchema) as MlObject
            }
            urlParamFields={reportSectionDefinitionFromFormik.definition.urlParamFields}
            application={props.application}
            applicationDeploymentMap={props.applicationDeploymentMap}
            deploymentUuid={props.deploymentUuid}
            applicationSection={props.applicationSection}
            pageParams={props.paramsAsdomainElements}
          />
        )}
      </div>
    </>
  );
};

export default ReportSectionViewWithEditor;
