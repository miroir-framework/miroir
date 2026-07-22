import { Box } from '@mui/material';
import { useCallback, useMemo } from 'react';

import { Formik } from 'formik';

import {
  Action2Error,
  defaultMiroirModelEnvironment,
  defaultSelfApplicationDeploymentMap,
  Domain2ElementFailed,
  getApplicationSection,
  LoggerInterface,
  MiroirLoggerFactory,
  resolveReportQueryLoadAttributes,
  type BoxedQueryTemplateWithExtractorCombinerTransformer,
  type BoxedQueryWithExtractorCombinerTransformer,
  type Domain2QueryReturnType,
  type DomainControllerInterface,
  type EntityDefinition,
  type InstanceAction,
  type ReportQueryLoadRequest,
} from "miroir-core";
import { JsonDisplayHelper, useDomainControllerService, useMiroirContextService, useSnackbar } from 'miroir-react';
import { packageName } from '../../../../constants.js';
import { cleanLevel, lastSubmitButtonClicked } from '../../constants.js';
import { ThemedSpan } from '../Themes/index.js';
import { useDocumentOutlineContext } from '../ValueObjectEditor/InstanceEditorOutlineContext.js';
import { InlineReportEditor, reportReportDetailsKey } from './InlineReportEditor.js';
import { ReportViewProps, useQueryTemplateResults } from './ReportHooks.js';
import ReportSectionViewWithEditor from './ReportSectionViewWithEditor.js';
import { reportSectionsFormValue } from './ReportTools.js';
import { useEnsureReportQueryLoaded } from './useEnsureReportQueryLoaded.js';
import { useReportQueryLoadService } from './useReportQueryLoadService.js';

import { reportReportDetails } from "miroir-test-app_deployment-miroir";
import { deployment_Miroir } from 'miroir-test-app_deployment-admin';
let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "ReportViewWithEditor"), "UI",
).then((logger: LoggerInterface) => {log = logger});

// ###############################################################################################
// Task 2.2: Define ReportViewWithEditorProps interface extending ReportViewProps
export interface ReportViewWithEditorProps extends ReportViewProps {
  // No additional props needed initially
}

const fetchedDataJzodSchema = {};
let count = 0;
// ###############################################################################################
export const ReportViewWithEditor = (props: ReportViewWithEditorProps) => {
  count += 1;
  log.info(
    "ReportViewWithEditor Render Count:",
    count,
    "application:",
    props.application,
    "deploymentUuid:",
    props.deploymentUuid,
    "applicationSection:",
    props.applicationSection,
    "reportDefinition:",
    props.reportDefinition,
    "pageParams:",
    props.pageParams,
  );
  const context = useMiroirContextService();
  const outlineContext = useDocumentOutlineContext();
  const { showSnackbar, handleAsyncAction } = useSnackbar();
  const domainController: DomainControllerInterface = useDomainControllerService();

  // Keep service identity stable across applicationDeploymentMap object churn
  // (see useReportQueryLoadService) so load status does not reset to "loading".
  const reportQueryLoadService = useReportQueryLoadService(
    domainController,
    props.applicationDeploymentMap,
  );

  const generalEditMode = context.viewParams.generalEditMode;
  
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  const reportDataQueryBase:
    | BoxedQueryWithExtractorCombinerTransformer
    | BoxedQueryTemplateWithExtractorCombinerTransformer
    | undefined = useMemo(
    () => {
      const result:
        | BoxedQueryWithExtractorCombinerTransformer
        | BoxedQueryTemplateWithExtractorCombinerTransformer
        | undefined =
        props.pageParams.application
          ? props.reportDefinition.definition.extractorTemplates
            ? {
                queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
                application: props.pageParams.application ?? "NO_APPLICATION",
                pageParams: props.pageParams,
                queryParams: {},
                contextResults: {},
                extractorTemplates: props.reportDefinition.definition.extractorTemplates,
                combinerTemplates: props.reportDefinition.definition.combinerTemplates,
                runtimeTransformers: props.reportDefinition.definition.runtimeTransformers,
              }
            : props.reportDefinition.definition.extractors
              ? {
                  queryType: "boxedQueryWithExtractorCombinerTransformer",
                  application: props.pageParams.application ?? "NO_APPLICATION",
                  pageParams: props.pageParams,
                  extractors: props.reportDefinition.definition.extractors,
                  combiners: props.reportDefinition.definition.combiners,
                  runtimeTransformers: props.reportDefinition.definition.runtimeTransformers,
                }
              : {
                  queryType: "boxedQueryWithExtractorCombinerTransformer",
                  application: "",
                  pageParams: props.pageParams,
                  extractors: {},
                }
          : undefined;
      log.info("ReportViewWithEditor reportDataQueryBase", result);
      return result;
    },
    [props.reportDefinition, props.pageParams]
  );

  const reportDataQueryResults: Domain2QueryReturnType<
    Domain2QueryReturnType<Record<string, any>>
  > = useQueryTemplateResults(props, props.applicationDeploymentMap, reportDataQueryBase);

  const resolvedQuery =
    reportDataQueryResults instanceof Domain2ElementFailed
      ? undefined
      : reportDataQueryResults.resolvedQuery;
  const reportData =
    reportDataQueryResults instanceof Domain2ElementFailed
      ? reportDataQueryResults
      : reportDataQueryResults.reportData;

  const reportQueryLoadRequest: ReportQueryLoadRequest | undefined = useMemo(() => {
    const extractors = (resolvedQuery as BoxedQueryWithExtractorCombinerTransformer | undefined)
      ?.extractors;
    if (!resolvedQuery || !extractors || Object.keys(extractors).length === 0) {
      return undefined;
    }
    const draft: ReportQueryLoadRequest = {
      application: props.application,
      deploymentUuid: props.deploymentUuid,
      reportUuid: props.reportDefinition?.uuid,
      applicationSection: props.applicationSection,
      resolvedQuery,
      queryParams: {},
    };
    // #214 — derive projection from extractor attributes (e.g. BlobList without contents)
    const projectionAttributes = resolveReportQueryLoadAttributes(draft);
    if (projectionAttributes?.length) {
      draft.projection = { attributes: projectionAttributes };
    }
    return draft;
  }, [
    props.application,
    props.deploymentUuid,
    props.reportDefinition?.uuid,
    props.applicationSection,
    resolvedQuery,
  ]);

  const reportQueryLoadStatus = useEnsureReportQueryLoaded(
    reportQueryLoadService,
    reportQueryLoadRequest,
  );

  if (reportDataQueryResults instanceof Domain2ElementFailed) { // should never happen
    throw new Error("ReportView: failed to get report data: " + JSON.stringify(reportDataQueryResults, null, 2));
  }

  const reportName = props.reportDefinition?.name??"reportEntityDefinition_name";
  const reportNamePath = [reportName];

  // ##############################################################################################
  // (meta-)information about the current report, to enable editing
  const entityDefinitionReport: EntityDefinition | undefined = useMemo(() => {
    const miroirMapping = context.deploymentUuidToReportsEntitiesDefinitionsMapping?.[deployment_Miroir.uuid];
    if (!miroirMapping) return undefined;
    const result =  miroirMapping["model"]?.entityDefinitions?.find((ed: any) => ed.name === "Report");
    log.info("ReportViewWithEditor found report entity definition", { result });
    return result;
  }, [context.deploymentUuidToReportsEntitiesDefinitionsMapping]);

  // ##############################################################################################
  const initialReportSectionsFormValue = useMemo(() => {
    // log.info(
    //   "############################################## reportSectionsFormValue",
    //   props.reportDefinition?.definition.section,
    //   "reportViewData",
    //   reportViewData,
    // );
    const reportSectionsData = reportSectionsFormValue(
      reportData,
      props.reportDefinition?.definition.section,
      ["definition", "section"],
      props.application,
      props.applicationDeploymentMap,
      props.deploymentUuid,
      defaultMiroirModelEnvironment,
      {}, // transformerParams
    );
    const result = {
      ...reportSectionsData,
      ...props.storedQueryData,
      ...reportData, // TODO: choose between spreading reportData or including as reportData attribute
      pageParams: props.pageParams,
      [reportReportDetailsKey]: reportReportDetails,
      [reportName]: props.reportDefinition,
    };
    log.info("reportSectionsFormValue initialReportSectionsFormValue", result);
    return result;

  }, [props.reportDefinition, props.pageParams, props.storedQueryData, reportData]);

  // ###############################################################################################
  // ###############################################################################################
  // ###############################################################################################
  // ###############################################################################################
  // ###############################################################################################
  // ##############################################################################################
  const currentModelEnvironment = defaultMiroirModelEnvironment;
  const onEditValueObjectFormSubmit = useCallback(
    async (data: any) => {
      log.info(
        "onEditValueObjectFormSubmit called on deployment",
        props.deploymentUuid,
        "miroir deployment is",
        deployment_Miroir.uuid,
        "with new object value",
        data,
        "props:",
        props
      );
      // TODO: use action queue
      if (props.deploymentUuid) {
        if (!data || !data[lastSubmitButtonClicked]) {
          throw new Error(
            "onEditValueObjectFormSubmit called with undefined data:" +
              lastSubmitButtonClicked +
              " not found in data: " +
              Object.keys(data)
          );
        }
        if (!data[data[lastSubmitButtonClicked]]) {
          throw new Error(
            "onEditValueObjectFormSubmit called with undefined object at path: " +
              data[lastSubmitButtonClicked] +
              " in data: " +
              Object.keys(data)
          );
        }

        if (!data[data[lastSubmitButtonClicked]].parentUuid) {
          throw new Error(
            "onEditValueObjectFormSubmit called with object missing parentUuid: " +
              Object.keys(data[data[lastSubmitButtonClicked]])
          );
        }
        const currentInstance = data[data[lastSubmitButtonClicked]];
        const applicationSection = getApplicationSection(props.application, currentInstance.parentUuid);

        const mode = data[lastSubmitButtonClicked + "_mode"];
        log.info("onEditValueObjectFormSubmit",
          "mode", mode,
          "deploymentUuid", props.deploymentUuid,
          "currentInstance", currentInstance, "applicationSection", applicationSection);
        
        if (props.deploymentUuid === deployment_Miroir.uuid && applicationSection === "model") {
          // throw new Error("Editing model definitions in the miroir (meta-model) deployment is not allowed.");
          return Promise.resolve(new Action2Error(
            "FailedToHandleAction",
            "Editing model definitions in the miroir (meta-model) deployment is not allowed.",
            []
          ));
        }

        // if (applicationSection === "model" && currentInstance.parentUuid === entityEntityDefinition.uuid) {
        //   throw new Error("Editing entity definitions in the model section is not allowed.");
        // }
        
        // update entityDefinition instance
        if (
          props.deploymentUuid == deployment_Miroir.uuid || // modifying the meta-model is always transactional
          applicationSection == "model" // in an application, modifying the model must be transactional
        ) { // meta-model or model change, need transaction
          return domainController.handleActionFromUI(
            {
              actionType: "transactionalInstanceAction",
              endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
              payload: {
                application: props.pageParams.application ?? "NO_APPLICATION",
                // deploymentUuid: props.deploymentUuid,
                instanceAction: {
                  actionType: mode == "create" ? "createInstance" : "updateInstance",
                  endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
                  // deploymentUuid: props.deploymentUuid, // NOT FOR createInstance
                  payload: {
                    application: props.pageParams.application ?? "NO_APPLICATION",
                    // deploymentUuid: props.deploymentUuid, // ONLY FOR createInstance
                    applicationSection,
                    objects: [currentInstance],
                  },
                },
              },
            },
            props.applicationDeploymentMap ?? defaultSelfApplicationDeploymentMap,
            currentModelEnvironment // TODO: use correct model environment
          );
        } else { // only data is modified, no transaction is needed
          const updateAction: InstanceAction = {
            actionType: mode == "create" ? "createInstance" : "updateInstance",
            // deploymentUuid: props.deploymentUuid, // NOT FOR createInstance
            endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
            payload: {
              // applicationSection: "data",
              application: props.pageParams.application ?? "NO_APPLICATION",
              // deploymentUuid: props.deploymentUuid, // ONLY FOR createInstance
              applicationSection: applicationSection,
              objects: [currentInstance],
            },
          };
          log.info("onEditValueObjectFormSubmit dispatching updateAction", updateAction);
          return domainController.handleActionFromUI(
            updateAction,
            props.applicationDeploymentMap ?? defaultSelfApplicationDeploymentMap,
            currentModelEnvironment
          );
        }
      } else {
        throw new Error("onEditValueObjectFormSubmit props.deploymentUuid is undefined.");
      }
    },
    [domainController, props]
  );

  
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  return (
    <>
      {/* <span>ReportViewWithEditor generalEditMode: {generalEditMode ? "true" : "false"}</span> */}
      <Box sx={{ position: "relative" }}>
        {reportQueryLoadStatus === "loading" ? (
          <ThemedSpan>Loading report data…</ThemedSpan>
        ) : null}
        {reportQueryLoadStatus === "error" ? (
          <ThemedSpan>Report async load failed (showing cached data if available).</ThemedSpan>
        ) : null}
        {/* While async report load is in flight, skip EntityNotFound failure dump — expected for lazy-on-refresh entities. */}
        {reportQueryLoadStatus === "loading" &&
        reportData &&
        typeof reportData === "object" &&
        ((reportData as any).queryFailure === "ReferenceNotFound" ||
          (reportData as any).queryFailure === "EntityNotFound" ||
          (reportData as any).elementType === "failure") ? null : props.applicationSection ? (
          reportData.elementType == "failure" ? (
            <div>found query failure! {JSON.stringify(reportData, null, 2)}</div>
          ) : // (<>failure</>)
          props.deploymentUuid ? (
            <>
              <Formik
                enableReinitialize={true}
                initialValues={initialReportSectionsFormValue}
                onSubmit={(values, { setSubmitting, setErrors }) => {
                  try {
                    log.info("ReportViewWithEditor onSubmit formik values", values);
                    // Handle zoom case: merge changes back into the full object for submission
                    // const finalValues = hasZoomPath
                    //   ? setValueAtPath(initialValueObject, zoomInPath!, values)
                    //   : values;

                    // await onSubmit(values);
                    handleAsyncAction(
                      () => onEditValueObjectFormSubmit(values),
                      "Instance edited successfully",
                      "submit instance edition",
                    ).finally(() => setSubmitting(false)); // TODO: make it return Promise, no await because handler should return immediately
                  } catch (e) {
                    log.error(e);
                    setSubmitting(false);
                  }
                }}
                validateOnChange={false}
                validateOnBlur={false}
              >
                {(formik) => (
                  <>
                    <JsonDisplayHelper
                      debug={true}
                      componentName="ReportViewWithEditor"
                      elements={[
                        { label: "deploymentUuid", data: { deploymentUuid: props.deploymentUuid } },
                        {
                          label: "reportDataQueryBase / reportDataQueryResults",
                          data: { reportDataQueryBase, reportDataQueryResults },
                          useCodeBlock: true,
                        },
                        // { label: "reportViewData", data: { reportViewData }, useCodeBlock: true },
                        // { label: "initialReportSectionsFormValue", data: { initialReportSectionsFormValue }, useCodeBlock: true },
                        // {
                        //   label: "formValueMLSchema",
                        //   data: { formValueMLSchema },
                        //   useCodeBlock: true,
                        // },
                        // {
                        //   label: "entityDefinitionReport",
                        //   data: { entityDefinitionReport },
                        //   useCodeBlock: true,
                        // },
                        {
                          label: "formik values",
                          data: formik.values,
                          useCodeBlock: true,
                        },

                        // { label: "fetchedDataJzodSchemaParams", data: { fetchedDataJzodSchemaParams }, useCodeBlock: true },
                        // { label: "fetchedDataJzodSchema", data: { fetchedDataJzodSchema }, useCodeBlock: true },
                      ]}
                    />
                    {generalEditMode && entityDefinitionReport && (
                      <>
                        <InlineReportEditor
                          formikValuePath={reportNamePath}
                          formikReportDefinitionPathString={reportReportDetailsKey}
                          // 
                          application={props.application}
                          applicationDeploymentMap={props.applicationDeploymentMap}
                          deploymentUuid={props.deploymentUuid}
                          applicationSection={props.applicationSection}
                        />
                      </>
                    )}
                    <>
                      <ReportSectionViewWithEditor
                        formikReportDefinitionPathString={reportName}
                        reportSectionPath={["definition", "section"]}
                        //
                        valueObjectEditMode="update"
                        generalEditMode={generalEditMode}
                        // 
                        applicationSection={props.applicationSection}
                        application={props.application}
                        applicationDeploymentMap={props.applicationDeploymentMap}
                        deploymentUuid={props.deploymentUuid}
                        paramsAsdomainElements={props.pageParams}
                        isOutlineOpen={outlineContext.isOutlineOpen}
                        onToggleOutline={outlineContext.onToggleOutline}
                        reportName={reportName}
                      />
                    </>
                  </>
                )}
              </Formik>
            </>
          ) : (
            <ThemedSpan style={{ color: "red" }}>no deployment found!</ThemedSpan>
          )
        ) : (
          // : (
          //   <>ReportViewWithEditor Invalid props! {JSON.stringify(props)}</>;
          // )
          <ThemedSpan style={{ color: "red" }}>no application section found!</ThemedSpan>
        )}
      </Box>
    </>
  );
};
