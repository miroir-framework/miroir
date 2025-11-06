import { Box } from '@mui/material';
import { useCallback, useMemo } from 'react';

import { Formik } from 'formik';

import {
  adminConfigurationDeploymentMiroir,
  defaultMiroirModelEnvironment,
  Domain2ElementFailed,
  entityEntityDefinition,
  getApplicationSection,
  LoggerInterface,
  MiroirLoggerFactory,
  selfApplicationDeploymentMiroir,
  type BoxedQueryTemplateWithExtractorCombinerTransformer,
  type BoxedQueryWithExtractorCombinerTransformer,
  type DeploymentUuidToReportsEntitiesDefinitions,
  type Domain2QueryReturnType,
  type DomainControllerInterface,
  type EntityDefinition,
  type ExtractorRunnerParamsForJzodSchema,
  type InstanceAction,
  type JzodElement,
  type JzodObject,
  type QueryByQuery2GetParamJzodSchema,
  type QueryRunnerMapForJzodSchema,
  type RecordOfJzodObject,
  type ReduxDeploymentsState,
  type ReportSection,
  type Uuid
} from "miroir-core";
import { getMemoizedReduxDeploymentsStateJzodSchemaSelectorMap } from 'miroir-localcache-redux';
import { packageName } from '../../../../constants.js';
import { cleanLevel } from '../../constants.js';
import { useDomainControllerService, useMiroirContextService } from "../../MiroirContextReactProvider.js";
import { useReduxDeploymentsStateJzodSchemaSelector } from '../../ReduxHooks.js';
import { lastSubmitButtonClicked } from '../../routes/ReportPage.js';
import { ThemedSpan } from '../Themes/index.js';
import { useDocumentOutlineContext } from '../ValueObjectEditor/InstanceEditorOutlineContext.js';
import { InlineReportEditor } from './InlineReportEditor.js';
import { ReportViewProps, useQueryTemplateResults } from './ReportHooks.js';
import ReportSectionViewWithEditor from './ReportSectionViewWithEditor.js';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "ReportViewWithEditor"), "UI",
).then((logger: LoggerInterface) => {log = logger});

// ###############################################################################################
// Task 2.2: Define ReportViewWithEditorProps interface extending ReportViewProps
export interface ReportViewWithEditorProps extends ReportViewProps {
  // No additional props needed initially
}

const reportSectionsFormSchema = (
  reportSection: ReportSection,
  deploymentUuid: Uuid,
  currentDeploymentReportsEntitiesDefinitionsMapping: DeploymentUuidToReportsEntitiesDefinitions,
  reportData: Record<string, any>,
  reportSectionPath: (string | number)[]
): Record<string, JzodElement> => {
  log.info("reportSectionsFormValue", reportSection, reportData, reportSectionPath);
  switch (reportSection.type) {
    case "list":
      return reportSection.definition.reduce(
        (acc: Record<string, any>, curr: ReportSection, index: number): Record<string, any> => {
          return {
            ...acc,
            ...reportSectionsFormSchema(
              curr,
              deploymentUuid,
              // applicationSection,
              // entityUuid,
              currentDeploymentReportsEntitiesDefinitionsMapping,
              reportData,
              reportSectionPath.concat("definition", index)
            ),
          };
        },
        {}
      );
    case "grid":
      return reportSection.definition.reduce(
        (acc: Record<string, any>, row: ReportSection[], rowIndex: number) => {
          const rowObj = row.reduce(
            (rowAcc: Record<string, any>, subSection: ReportSection, colIndex: number) => ({
              ...rowAcc,
              ...reportSectionsFormSchema(
                subSection,
                deploymentUuid,
                // applicationSection,
                // entityUuid,
                currentDeploymentReportsEntitiesDefinitionsMapping,
                reportData,
                reportSectionPath.concat("definition", rowIndex, colIndex)
              ),
            }),
            {}
          );
          return { ...acc, ...rowObj };
        },
        {}
      );
    case "objectInstanceReportSection": {
      const entityUuid = reportSection.definition.parentUuid;
      const applicationSection = getApplicationSection(deploymentUuid, entityUuid)
      const targetEntityDefinition: EntityDefinition | undefined =
        currentDeploymentReportsEntitiesDefinitionsMapping?.[
          applicationSection
        ]?.entityDefinitions?.find((e) => e?.entityUuid === entityUuid);
      if (!targetEntityDefinition) {
        throw new Error("reportSectionsFormSchema: cannot find target entity definition for entityUuid " + entityUuid + " in applicationSection " + applicationSection);
      }
      return {
        [reportSectionPath.join("_")]:targetEntityDefinition.jzodSchema
      };
    }
    case "objectListReportSection":
    case "markdownReportSection":
    case "graphReportSection":
    default:
      return {};
  }
};
// ###############################################################################################
// ###############################################################################################
// ###############################################################################################
// ###############################################################################################
// ###############################################################################################
const reportSectionsFormValue = (
  reportSection: ReportSection,
  reportData: Record<string, any>,
  reportSectionPath: (string | number)[]
): Record<string, any> => {
  log.info("reportSectionsFormValue", reportSection, reportData, reportSectionPath);
  switch (reportSection.type) {
    case "list":
      return reportSection.definition.reduce(
        (acc: Record<string, any>, curr: ReportSection, index: number): Record<string, any> => {
          return {
            ...acc,
            ...reportSectionsFormValue(
              curr,
              reportData,
              reportSectionPath.concat("definition", index)
            ),
          };
        },
        {}
      );
    case "grid":
      return reportSection.definition.reduce(
        (acc: Record<string, any>, row: ReportSection[], rowIndex: number) => {
          const rowObj = row.reduce(
            (rowAcc: Record<string, any>, subSection: ReportSection, colIndex: number) => ({
              ...rowAcc,
              ...reportSectionsFormValue(
                subSection,
                reportData,
                reportSectionPath.concat("definition", rowIndex, colIndex)
              ),
            }),
            {}
          );
          return { ...acc, ...rowObj };
        },
        {}
      );
    case "objectListReportSection":
    case "objectInstanceReportSection": {
      return {
        [reportSectionPath.join("_")]:
          reportData[reportSection.definition.fetchedDataReference ?? ""],
      };
    }
    case "markdownReportSection":
    case "graphReportSection":
    default:
      return {};
  }
};

let count = 0;
// ###############################################################################################
export const ReportViewWithEditor = (props: ReportViewWithEditorProps) => {
  count += 1;
  log.info(`ReportViewWithEditor Render Count: ${count}`);
  const context = useMiroirContextService();
  const outlineContext = useDocumentOutlineContext();
  
  const currentDeploymentReportsEntitiesDefinitionsMapping =
    context.deploymentUuidToReportsEntitiesDefinitionsMapping[context.deploymentUuid] || {};

  // Read editMode from ViewParams context
  const editMode = context.viewParams.editMode;
  
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
      props.pageParams.deploymentUuid &&
      props.pageParams.applicationSection &&
      props.pageParams.reportUuid
        ? props.reportDefinition.definition.extractorTemplates
          ? {
              queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
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
  > = useQueryTemplateResults(props, reportDataQueryBase);

  if (reportDataQueryResults instanceof Domain2ElementFailed) { // should never happen
    throw new Error("ReportView: failed to get report data: " + JSON.stringify(reportDataQueryResults, null, 2));
  }
  const {reportData, resolvedQuery} = reportDataQueryResults;
  log.info("reportData", reportData);

  const reportViewData = useMemo(() => ({
      ...reportData, // TODO: choose between spreading reportData or including as reportData attribute
      reportData,
      storedQueryData: props.storedQueryData
  }), [reportData, props.storedQueryData]);

  log.info("ReportView reportViewData", reportViewData);

  const reportName = props.reportDefinition?.name??"reportEntityDefinition_name";
  const reportNamePath = [reportName];

  const initialReportSectionsFormValue = useMemo(() => {
    log.info(
      "############################################## reportSectionsFormValue",
      props.reportDefinition?.definition.section,
      "reportViewData",
      reportViewData,
    );
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
      [reportNamePath.join("_")]: props.reportDefinition,
    };
    log.info("reportSectionsFormValue initialReportSectionsFormValue", result);
    return result;

  }, [props.reportDefinition, reportData, reportViewData]);

    // (meta-)information about the current report, to enable editing
  const reportEntityDefinition = useMemo(() => {
    const miroirMapping = context.deploymentUuidToReportsEntitiesDefinitionsMapping?.[selfApplicationDeploymentMiroir.uuid];
    if (!miroirMapping) return undefined;
    return miroirMapping["model"]?.entityDefinitions?.find((ed: any) => ed.name === "Report");
  }, [context.deploymentUuidToReportsEntitiesDefinitionsMapping]);

  const formValueMLSchema: JzodObject = useMemo(() => {
    if (!props.pageParams.deploymentUuid || !reportEntityDefinition?.entityUuid) {
      return { type: "object", definition: {} };
    }
    const r = reportSectionsFormSchema(
      props.reportDefinition?.definition.section,
      props.pageParams.deploymentUuid,
      currentDeploymentReportsEntitiesDefinitionsMapping,
      reportData,
      ["definition", "section"]
    );
    const result: JzodObject = {
      type: "object",
      definition: {
        ...r,
        [reportNamePath.join("_")]: reportEntityDefinition.jzodSchema,
        [lastSubmitButtonClicked]: { type: "string", optional: true}
      }
    };
    // log.info("reportSectionsFormSchema formValueSchema", result);
    log.info(
      "############################################## computing formValueMLSchema",
      "props.reportDefinition",
      props.reportDefinition,
      "initialReportSectionsFormValue",
      initialReportSectionsFormValue,
      "reportData",
      reportData,
      "formValueMLSchema",
      result,
      []
    );
    // log.info("reportSectionsFormSchema formValueSchema", JSON.stringify(result, null, 2));
    return result;
  }, [
    props.reportDefinition,
    reportData,
    reportEntityDefinition,
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
      query:
        props.pageParams.deploymentUuid &&
        props.pageParams.applicationSection &&
        props.pageParams.reportUuid &&
        props.reportDefinition.definition.extractors &&
        reportDataQueryBase
          ? {
            queryType: "queryByTemplateGetParamJzodSchema",
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
  const fetchedDataJzodSchema: RecordOfJzodObject | undefined = useReduxDeploymentsStateJzodSchemaSelector(
    jzodSchemaSelectorMap.extractFetchQueryJzodSchema,
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

        log.info("onEditValueObjectFormSubmit currentInstance", currentInstance, "applicationSection", applicationSection);
        
        if (props.deploymentUuid === adminConfigurationDeploymentMiroir.uuid && applicationSection === "model") {
          throw new Error("Editing model definitions in the miroir admin deployment is not allowed.");
        }

        if (applicationSection === "model" && currentInstance.parentUuid === entityEntityDefinition.uuid) {
          throw new Error("Editing entity definitions in the model section is not allowed.");
        }
        
        // update entityDefinition instance
        if (
          props.deploymentUuid == adminConfigurationDeploymentMiroir.uuid ||
          applicationSection == "model"
        ) {
          await domainController.handleAction(
            {
              actionType: "transactionalInstanceAction",
              instanceAction: {
                actionType: "updateInstance",
                deploymentUuid: props.deploymentUuid,
                endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
                payload: {
                  applicationSection: "model",
                  objects: [
                    {
                      parentName: currentInstance.parentName,
                      parentUuid: currentInstance.parentUuid,
                      applicationSection: props.applicationSection,
                      instances: [currentInstance],
                    },
                  ],
                },
              },
            },
            currentModelEnvironment // TODO: use correct model environment
          );
        } else {
          const updateAction: InstanceAction = {
            actionType: "updateInstance",
            deploymentUuid: props.deploymentUuid,
            endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
            payload: {
              applicationSection: "data",
              objects: [
                {
                  parentName: currentInstance.name,
                  parentUuid: currentInstance.parentUuid,
                  applicationSection: "data",
                  instances: [currentInstance],
                },
              ],
            },
          };
          await domainController.handleAction(updateAction);
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
      {/* <span>ReportViewWithEditor editMode: {editMode ? "true" : "false"}</span> */}
      <Box sx={{ position: "relative" }}>
        {/* {editMode && modifiedSections.size > 0 && ( */}
        {props.applicationSection ? (
          reportData.elementType == "failure" ? (
            <div>found query failure! {JSON.stringify(reportData, null, 2)}</div>
          ) : // (<>failure</>)
          props.deploymentUuid ? (
            <>
              <Formik
                enableReinitialize={true}
                // initialValues={formInitialValue}
                initialValues={initialReportSectionsFormValue}
                onSubmit={async (values, { setSubmitting, setErrors }) => {
                  try {
                    log.info("ReportSectionEntityInstance onSubmit formik values", values);
                    // Handle zoom case: merge changes back into the full object for submission
                    // const finalValues = hasZoomPath
                    //   ? setValueAtPath(initialValueObject, zoomInPath!, values)
                    //   : values;

                    // await onSubmit(values);
                    await onEditValueObjectFormSubmit(values); // TODO: make it return Promise, no await because handler should return immediately
                  } catch (e) {
                    log.error(e);
                  } finally {
                    setSubmitting(false);
                  }
                }}
                validateOnChange={false}
                validateOnBlur={false}
              >
                <>
                  {editMode && reportEntityDefinition && (
                    <InlineReportEditor
                      deploymentUuid={props.deploymentUuid}
                      applicationSection={props.applicationSection}
                      reportDefinitionDEFUNCT={reportViewData[reportNamePath.join("_")]} // DEFUNCT since InlineReportEditor uses formik context directly
                      reportEntityDefinitionDEFUNCT={reportEntityDefinition}
                      formValueMLSchema={formValueMLSchema}
                      // hasValidationErrors={hasValidationErrors}
                      formikValuePath={reportNamePath}
                      formikReportDefinitionPathString={props.reportDefinition.name}
                      formikAlreadyAvailable={true}
                      // onDefinitionChange={setLocalEditedReportDefinitionDEFUNCT}
                      // onValidationChange={setHasValidationErrors}
                    />
                  )}
                  {/* <span>
                    <pre>
                      ReportViewEditor editMode: {JSON.stringify(editMode)}, reportEntityDefinition:{" "}
                      {JSON.stringify(!!reportEntityDefinition)}
                    </pre>
                  </span> */}
                  <ReportSectionViewWithEditor
                    applicationSection={props.applicationSection}
                    deploymentUuid={props.deploymentUuid}
                    editMode={editMode}
                    paramsAsdomainElements={props.pageParams}
                    isOutlineOpen={outlineContext.isOutlineOpen}
                    onToggleOutline={outlineContext.onToggleOutline}
                    // data
                    reportDataDEFUNCT={reportViewData}
                    fetchedDataJzodSchemaDEFUNCT={fetchedDataJzodSchema}
                    // formikValuePath={[]}
                    //
                    reportSectionDEFUNCT={props.reportDefinition?.definition.section} // TODO: defunct, must use formik[reportName]?.definition.section
                    reportDefinitionDEFUNCT={props.reportDefinition}
                    formValueMLSchema={formValueMLSchema}
                    formikReportDefinitionPathString={props.reportDefinition.name}
                    reportSectionPath={["definition", "section"]}
                    reportName={reportName}
                  />
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
