import { Box } from '@mui/material';
import { useCallback, useMemo } from 'react';

import { Formik } from 'formik';

import {
  Action2Error,
  adminConfigurationDeploymentMiroir,
  defaultMiroirModelEnvironment,
  defaultSelfApplicationDeploymentMap,
  Domain2ElementFailed,
  entityDefinitionEntityDefinition,
  getApplicationSection,
  LoggerInterface,
  MiroirLoggerFactory,
  reportReportDetails,
  selfApplicationDeploymentMiroir,
  type BoxedQueryTemplateWithExtractorCombinerTransformer,
  type BoxedQueryWithExtractorCombinerTransformer,
  type Domain2QueryReturnType,
  type DomainControllerInterface,
  type EntityDefinition,
  type ExtractorRunnerParamsForJzodSchema,
  type InstanceAction,
  type JzodObject,
  type MetaModel,
  type QueryByQuery2GetParamJzodSchema,
  type QueryRunnerMapForJzodSchema,
  type RecordOfJzodObject,
  type ReduxDeploymentsState
} from "miroir-core";
import { getMemoizedReduxDeploymentsStateJzodSchemaSelectorMap } from '../../../miroir-localcache-imports.js';
import { packageName } from '../../../../constants.js';
import { cleanLevel, lastSubmitButtonClicked } from '../../constants.js';
import { useDomainControllerService, useMiroirContextService, useSnackbar } from "../../MiroirContextReactProvider.js";
import { useCurrentModel, useReduxDeploymentsStateJzodSchemaSelector } from '../../ReduxHooks.js';
import { ThemedSpan } from '../Themes/index.js';
import { useDocumentOutlineContext } from '../ValueObjectEditor/InstanceEditorOutlineContext.js';
import { InlineReportEditor } from './InlineReportEditor.js';
import { ReportViewProps, useQueryTemplateResults } from './ReportHooks.js';
import ReportSectionViewWithEditor from './ReportSectionViewWithEditor.js';
import { reportSectionsFormSchema, reportSectionsFormValue } from './ReportTools.js';
import { ThemedOnScreenDebug } from '../Themes/BasicComponents.js';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "ReportViewWithEditor"), "UI",
).then((logger: LoggerInterface) => {log = logger});

// ###############################################################################################
// Task 2.2: Define ReportViewWithEditorProps interface extending ReportViewProps
export interface ReportViewWithEditorProps extends ReportViewProps {
  // No additional props needed initially
}

let count = 0;
// ###############################################################################################
export const ReportViewWithEditor = (props: ReportViewWithEditorProps) => {
  count += 1;
  log.info(
    `ReportViewWithEditor Render Count: ${count}, application: ${props.application}, deploymentUuid: ${props.deploymentUuid}, applicationSection: ${props.applicationSection}`
  );
  const context = useMiroirContextService();
  const outlineContext = useDocumentOutlineContext();
  const { showSnackbar, handleAsyncAction } = useSnackbar();
  
  const currentModel: MetaModel = useCurrentModel(
    props.application,
    props.applicationDeploymentMap ?? defaultSelfApplicationDeploymentMap
  );
  const currentDeploymentReportsEntitiesDefinitionsMapping =
    context.deploymentUuidToReportsEntitiesDefinitionsMapping[props.deploymentUuid] || {};

  // Read generalEditMode from ViewParams context
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
    () =>
      props.pageParams.application &&
      props.pageParams.deploymentUuid &&
      props.pageParams.applicationSection &&
      props.pageParams.reportUuid
        ? props.reportDefinition.definition.extractorTemplates
          ? {
              queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
              label: props.reportDefinition.name,
              application: props.pageParams.application??"NO_APPLICATION",
              applicationDeploymentMap: props.applicationDeploymentMap ?? defaultSelfApplicationDeploymentMap,
              deploymentUuid: props.pageParams.deploymentUuid,
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
              label: props.reportDefinition.name,
              application: props.pageParams.application??"NO_APPLICATION",
              applicationDeploymentMap: props.applicationDeploymentMap ?? defaultSelfApplicationDeploymentMap,
              deploymentUuid: props.pageParams.deploymentUuid,
              pageParams: props.pageParams,
              queryParams: {},
              contextResults: {},
              extractors: props.reportDefinition.definition.extractors,
              combiners: props.reportDefinition.definition.combiners,
              runtimeTransformers: props.reportDefinition.definition.runtimeTransformers,
            }
          : {
              queryType: "boxedQueryWithExtractorCombinerTransformer",
              label: props.reportDefinition.name + "_DUMMY",
              application: "",
              applicationDeploymentMap: {},
              deploymentUuid: "",
              pageParams: props.pageParams,
              queryParams: {},
              contextResults: {},
              extractors: {},
            }
        : undefined,
    // [props.reportDefinition, props.pageParams, resolvedTemplateQuery]
    [props.reportDefinition, props.pageParams]
  );

  const reportDataQueryResults: Domain2QueryReturnType<
    Domain2QueryReturnType<Record<string, any>>
  > = useQueryTemplateResults(props, props.applicationDeploymentMap, reportDataQueryBase);

  if (reportDataQueryResults instanceof Domain2ElementFailed) { // should never happen
    throw new Error("ReportView: failed to get report data: " + JSON.stringify(reportDataQueryResults, null, 2));
  }
  const {reportData, resolvedQuery} = reportDataQueryResults;
  // log.info("reportData", reportData);

  const reportViewData = useMemo(() => ({
      ...reportData, // TODO: choose between spreading reportData or including as reportData attribute
      pageParams: props.pageParams,
      reportData,
      storedQueryData: props.storedQueryData
  }), [reportData, props.storedQueryData]);

  // log.info("ReportView reportViewData", reportViewData);

  const reportName = props.reportDefinition?.name??"reportEntityDefinition_name";
  const reportNamePath = [reportName];
  const entityDefinitionReportKey = "entityDefinitionReport";
  const reportReportDetailsKey = "reportReportDetails";

  // ##############################################################################################
  // (meta-)information about the current report, to enable editing
  const entityDefinitionReport: EntityDefinition | undefined = useMemo(() => {
    const miroirMapping = context.deploymentUuidToReportsEntitiesDefinitionsMapping?.[selfApplicationDeploymentMiroir.uuid];
    if (!miroirMapping) return undefined;
    return miroirMapping["model"]?.entityDefinitions?.find((ed: any) => ed.name === "Report");
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
      props.reportDefinition?.definition.section,
      reportData,
      ["definition", "section"]
    );
    const result = {
      ...reportSectionsData,
      ...props.storedQueryData,
      // storedQueryData: props.storedQueryData, // included in reportViewData
      ...reportViewData,
      reportViewData,
      [reportReportDetailsKey]: reportReportDetails,
      [entityDefinitionReportKey ]: entityDefinitionReport,
      [reportName]: props.reportDefinition,
    };
    // log.info("reportSectionsFormValue initialReportSectionsFormValue", result);
    return result;

  }, [props.reportDefinition, entityDefinitionReportKey, reportData, reportViewData]);


  // ##############################################################################################
  const formValueMLSchema: JzodObject = useMemo(() => {
    if (!props.pageParams.deploymentUuid || !entityDefinitionReport?.entityUuid) {
      return { type: "object", definition: {} };
    }
    const r = reportSectionsFormSchema(
      props.reportDefinition?.definition.section,
      props.pageParams.deploymentUuid,
      currentDeploymentReportsEntitiesDefinitionsMapping,
      currentModel,
      reportData,
      ["definition", "section"]
    );
    const result: JzodObject = {
      type: "object",
      definition: {
        ...r,
        [reportReportDetailsKey]: entityDefinitionReport.mlSchema,
        [entityDefinitionReportKey]: entityDefinitionEntityDefinition.mlSchema, // will contain reportEntityDefinition-itself
        [reportName]: entityDefinitionReport.mlSchema,
        [lastSubmitButtonClicked]: { type: "string", optional: true}
      }
    };
    // log.info("reportSectionsFormSchema formValueSchema", result);
    // log.info(
    //   "############################################## computing formValueMLSchema",
    //   "props.reportDefinition",
    //   props.reportDefinition,
    //   "initialReportSectionsFormValue",
    //   initialReportSectionsFormValue,
    //   "reportData",
    //   reportData,
    //   "formValueMLSchema",
    //   result,
    //   []
    // );
    // log.info("reportSectionsFormSchema formValueSchema", JSON.stringify(result, null, 2));
    return result;
  }, [
    props.reportDefinition,
    reportData,
    entityDefinitionReport,
    // reportEditorEntitySectionPath,
    currentDeploymentReportsEntitiesDefinitionsMapping,
    props.pageParams.applicationSection,
  ]);

  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  const jzodSchemaSelectorMap: QueryRunnerMapForJzodSchema<ReduxDeploymentsState> = useMemo(
    () => getMemoizedReduxDeploymentsStateJzodSchemaSelectorMap(),
    []
  );
  const fetchedDataJzodSchemaParams: ExtractorRunnerParamsForJzodSchema<
    QueryByQuery2GetParamJzodSchema,
    ReduxDeploymentsState
  > = useMemo(
    () => ({
      extractorRunnerMap: jzodSchemaSelectorMap,
      applicationDeploymentMap: props.applicationDeploymentMap ?? defaultSelfApplicationDeploymentMap,
      query:
        props.pageParams.application &&
        props.pageParams.applicationSection &&
        props.pageParams.reportUuid &&
        props.reportDefinition.definition.extractors &&
        reportDataQueryBase
          ? {
              queryType: "queryByTemplateGetParamJzodSchema",
              label: props.reportDefinition.name + "_fetchedDataJzodSchema",
              application: props.pageParams.application??"NO_APPLICATION",
              // applicationDeploymentMap: props.applicationDeploymentMap ?? defaultSelfApplicationDeploymentMap,
              deploymentUuid: props.pageParams.deploymentUuid,
              pageParams: {
                applicationSection: props.pageParams.applicationSection,
                deploymentUuid: props.pageParams.deploymentUuid,
                instanceUuid: props.pageParams.instanceUuid ?? "",
              },
              queryParams: {},
              contextResults: {},
              // fetchParams: deploymentEntityStateFetchQueryParams.extractor,
              fetchParams: resolvedQuery,
            }
          : // dummy query
            {
              queryType: "queryByTemplateGetParamJzodSchema",
              label: props.reportDefinition.name + "_DUMMY",
              application: "",
              // applicationDeploymentMap: {},
              deploymentUuid: "DUMMY",
              pageParams: {
                applicationSection: "data",
                deploymentUuid: "",
                instanceUuid: "",
              },
              queryParams: {},
              contextResults: {},
              fetchParams: {
                queryType: "boxedQueryWithExtractorCombinerTransformer",
                application: "",
                // applicationDeploymentMap: {},
                deploymentUuid: "DUMMY",
                pageParams: props.pageParams,
                queryParams: {},
                contextResults: {},
                // extractorTemplates: {},
                extractors: {},
              } as BoxedQueryWithExtractorCombinerTransformer,
            },
    }),
    [jzodSchemaSelectorMap, props.pageParams, props.reportDefinition]
  );
  log.info("fetchedDataJzodSchemaParams", fetchedDataJzodSchemaParams, props.applicationDeploymentMap);
  const fetchedDataJzodSchema: RecordOfJzodObject | undefined = useReduxDeploymentsStateJzodSchemaSelector(
    jzodSchemaSelectorMap.extractFetchQueryJzodSchema,
    props.applicationDeploymentMap ?? defaultSelfApplicationDeploymentMap,
    fetchedDataJzodSchemaParams
  ) as RecordOfJzodObject | undefined; // TODO: use correct return type
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################

  // const [localEditedReportDefinitionDEFUNCT, setLocalEditedReportDefinitionDEFUNCT] = useState<any | undefined>(reportEntityDefinition);
  
  // ###############################################################################################
  // ###############################################################################################
  // ###############################################################################################
  // ###############################################################################################
  // ###############################################################################################
  // ##############################################################################################
  const domainController: DomainControllerInterface = useDomainControllerService();
  const currentModelEnvironment = defaultMiroirModelEnvironment;
  // const reportSectionPathAsString = reportSectionPath?.join("_") || "";
  const onEditValueObjectFormSubmit = useCallback(
    async (data: any) => {
      log.info(
        "onEditValueObjectFormSubmit called on deployment",
        props.deploymentUuid,
        "miroir deployment is",
        adminConfigurationDeploymentMiroir.uuid,
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
        const applicationSection = getApplicationSection(props.deploymentUuid, currentInstance.parentUuid);

        const mode = data[lastSubmitButtonClicked + "_mode"];
        log.info("onEditValueObjectFormSubmit",
          "mode", mode,
          "deploymentUuid", props.deploymentUuid,
          "currentInstance", currentInstance, "applicationSection", applicationSection);
        
        if (props.deploymentUuid === adminConfigurationDeploymentMiroir.uuid && applicationSection === "model") {
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
          props.deploymentUuid == adminConfigurationDeploymentMiroir.uuid || // modifying the meta-model is always transactional
          applicationSection == "model" // in an application, modifying the model must be transactional
        ) { // meta-model or model change, need transaction
          return domainController.handleActionFromUI(
            {
              actionType: "transactionalInstanceAction",
              application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
              endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
              payload: {
                application: props.pageParams.application ?? "NO_APPLICATION",
                // deploymentUuid: props.deploymentUuid,
                instanceAction: {
                  actionType: mode == "create" ? "createInstance" : "updateInstance",
                  application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
                  endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
                  // deploymentUuid: props.deploymentUuid, // NOT FOR createInstance
                  payload: {
                    application: props.pageParams.application ?? "NO_APPLICATION",
                    // deploymentUuid: props.deploymentUuid, // ONLY FOR createInstance
                    applicationSection,
                    parentUuid: currentInstance.parentUuid,
                    objects: [
                      {
                        parentName: currentInstance.parentName,
                        parentUuid: currentInstance.parentUuid,
                        applicationSection: applicationSection,
                        instances: [currentInstance],
                      },
                    ],
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
            application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
            endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
            payload: {
              // applicationSection: "data",
              application: props.pageParams.application ?? "NO_APPLICATION",
              // deploymentUuid: props.deploymentUuid, // ONLY FOR createInstance
              applicationSection: applicationSection,
              parentUuid: currentInstance.parentUuid,
              objects: [
                {
                  parentName: currentInstance.name,
                  parentUuid: currentInstance.parentUuid,
                  // applicationSection: "data",
                  applicationSection: applicationSection,
                  instances: [currentInstance],
                },
              ],
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
        <ThemedOnScreenDebug
          label='ReportViewWithEditor'
          data={{deploymentUuid: props.deploymentUuid}}
        />
        {props.applicationSection ? (
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
                      "submit instance edition"
                    ).finally(() => setSubmitting(false)); // TODO: make it return Promise, no await because handler should return immediately
                  } catch (e) {
                    log.error(e);
                    setSubmitting(false);
                  }
                }}
                validateOnChange={false}
                validateOnBlur={false}
              >
                <>
                  {generalEditMode && entityDefinitionReport && (
                    <>
                      {/* <ThemedOnScreenHelper
                        label={"ReportViewWithEditor: reportEntityDefinition"}
                        data={entityDefinitionReport}
                        initiallyUnfolded={false}
                      /> */}
                      {/* <ThemedOnScreenHelper
                        label={"ReportViewWithEditor: reportViewData"}
                        data={reportViewData}
                        initiallyUnfolded={false}
                      /> */}
                      {/* <ThemedOnScreenHelper
                        label={"ReportViewWithEditor: reportNamePath"}
                        data={reportNamePath}
                      /> */}
                      <InlineReportEditor
                        application={props.application}
                        applicationDeploymentMap={props.applicationDeploymentMap}
                        deploymentUuid={props.deploymentUuid}
                        applicationSection={props.applicationSection}
                        reportEntityDefinitionDEFUNCT={entityDefinitionReport}
                        formValueMLSchema={formValueMLSchema}
                        formikValuePath={reportNamePath}
                        formikReportDefinitionPathString={reportReportDetailsKey}
                        formikAlreadyAvailable={true}
                      />
                    </>
                  )}
                  <>
                    <ThemedOnScreenDebug
                      label={`ReportViewWithEditor`}
                      data={{reportDataQueryBase, reportDataQueryResults}}
                      initiallyUnfolded={false}
                      useCodeBlock={true}
                    />
                    <ReportSectionViewWithEditor
                      valueObjectEditMode="update"
                      generalEditMode={generalEditMode}
                      applicationSection={props.applicationSection}
                      application={props.application}
                      applicationDeploymentMap={props.applicationDeploymentMap}
                      deploymentUuid={props.deploymentUuid}
                      paramsAsdomainElements={props.pageParams}
                      isOutlineOpen={outlineContext.isOutlineOpen}
                      onToggleOutline={outlineContext.onToggleOutline}
                      // data
                      reportDataDEFUNCT={reportViewData}
                      fetchedDataJzodSchemaDEFUNCT={fetchedDataJzodSchema}
                      //
                      reportSectionDEFUNCT={props.reportDefinition?.definition.section} // TODO: defunct, must use formik[reportName]?.definition.section
                      reportDefinitionDEFUNCT={props.reportDefinition}
                      formValueMLSchema={formValueMLSchema}
                      formikReportDefinitionPathString={props.reportDefinition.name}
                      reportSectionPath={["definition", "section"]}
                      reportName={reportName}
                    />
                  </>
                </>
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
