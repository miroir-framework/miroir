import { useState, useMemo, useCallback } from 'react';
import { Box } from '@mui/material';
import {
  defaultMiroirModelEnvironment,
  Domain2ElementFailed,
  getApplicationSection,
  LoggerInterface,
  MiroirLoggerFactory,
  RootReport,
  selfApplicationDeploymentMiroir,
  type ApplicationSection,
  type BoxedQueryTemplateWithExtractorCombinerTransformer,
  type BoxedQueryWithExtractorCombinerTransformer,
  type DeploymentUuidToReportsEntitiesDefinitions,
  type DeploymentUuidToReportsEntitiesDefinitionsMapping,
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
  type Uuid,
} from "miroir-core";

import { packageName } from '../../../../constants.js';
import { cleanLevel } from '../../constants.js';
import { useDomainControllerService, useMiroirContextService } from "../../MiroirContextReactProvider.js";
import { ReportView } from './ReportView.js';
import { ReportViewProps, useQueryTemplateResults } from './ReportHooks.js';
import { ThemedButton, ThemedSpan } from '../Themes/index.js';
import ReportSectionViewWithEditor from './ReportSectionViewWithEditor.js';
import { getMemoizedReduxDeploymentsStateJzodSchemaSelectorMap } from 'miroir-localcache-redux';
import { useReduxDeploymentsStateJzodSchemaSelector } from '../../ReduxHooks.js';
import { useDocumentOutlineContext } from '../ValueObjectEditor/InstanceEditorOutlineContext.js';
import { InlineReportEditor } from './InlineReportEditor.js';
import { Formik } from 'formik';
import { lastSubmitButtonClicked } from '../../routes/ReportPage.js';

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
  // applicationSection: ApplicationSection,
  // entityUuid: Uuid,
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
    case "objectInstanceReportSection": {
      return {
        [reportSectionPath.join("_")]:
          reportData[reportSection.definition.fetchedDataReference ?? ""],
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
export const ReportViewWithEditor = (props: ReportViewWithEditorProps) => {
  const context = useMiroirContextService();
  const outlineContext = useDocumentOutlineContext();
  
  const currentDeploymentReportsEntitiesDefinitionsMapping =
    context.deploymentUuidToReportsEntitiesDefinitionsMapping[context.deploymentUuid] || {};

  // Read editMode from ViewParams context
  const editMode = context.viewParams.editMode;
  
  // Task 2.4: Add React useState hook to manage edited Report definition
  const [editedReportDefinition, setEditedReportDefinition] = useState<RootReport | undefined>(undefined);
  
  // Task 2.5: Add React useState hook to track which sections have been modified
  const [modifiedSections, setModifiedSections] = useState<Set<string>>(new Set());
  
  // Task 2.6: Create handleSectionEdit callback
  const handleSectionEdit = useCallback((sectionPath: string, newDefinition: any) => {
    log.info("handleSectionEdit called", { sectionPath, newDefinition });
    
    // Update the edited report definition
    setEditedReportDefinition(prevReport => {
      // If no previous edits, start with a copy of the original
      const baseReport = prevReport ?? props.reportDefinition;
      
      // Deep clone to avoid mutating the original
      const updatedReport = JSON.parse(JSON.stringify(baseReport)) as RootReport;
      
      // Parse the section path and update the appropriate part
      // For now, we'll handle simple section updates
      // Path format: "section.definition[0]" or "section"
      const pathParts = sectionPath.split('.');
      let current: any = updatedReport;
      
      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        const arrayMatch = part.match(/^(.+)\[(\d+)\]$/);
        if (arrayMatch) {
          const [, key, index] = arrayMatch;
          current = current[key][parseInt(index)];
        } else {
          current = current[part];
        }
      }
      
      // Set the final value
      const lastPart = pathParts[pathParts.length - 1];
      const arrayMatch = lastPart.match(/^(.+)\[(\d+)\]$/);
      if (arrayMatch) {
        const [, key, index] = arrayMatch;
        current[key][parseInt(index)] = newDefinition;
      } else {
        current[lastPart] = newDefinition;
      }
      
      return updatedReport;
    });
    
    // Add the section path to modified sections
    setModifiedSections(prev => new Set([...prev, sectionPath]));
  }, [props.reportDefinition]);
  
  // Task 2.7: Create handleSectionCancel callback
  const handleSectionCancel = useCallback((sectionPath: string) => {
    log.info("handleSectionCancel called", { sectionPath });
    
    // Remove the section from modified sections
    setModifiedSections(prev => {
      const newSet = new Set(prev);
      newSet.delete(sectionPath);
      return newSet;
    });
    
    // If no more modified sections, clear the edited report definition
    if (modifiedSections.size === 1 && modifiedSections.has(sectionPath)) {
      setEditedReportDefinition(undefined);
    } else {
      // Revert just this section to original
      setEditedReportDefinition(prevReport => {
        if (!prevReport) return undefined;
        
        // Deep clone
        const updatedReport = JSON.parse(JSON.stringify(prevReport)) as RootReport;
        
        // Parse the section path and revert to original value
        const pathParts = sectionPath.split('.');
        let current: any = updatedReport;
        let originalCurrent: any = props.reportDefinition;
        
        for (let i = 0; i < pathParts.length - 1; i++) {
          const part = pathParts[i];
          const arrayMatch = part.match(/^(.+)\[(\d+)\]$/);
          if (arrayMatch) {
            const [, key, index] = arrayMatch;
            current = current[key][parseInt(index)];
            originalCurrent = originalCurrent[key][parseInt(index)];
          } else {
            current = current[part];
            originalCurrent = originalCurrent[part];
          }
        }
        
        // Revert the final value
        const lastPart = pathParts[pathParts.length - 1];
        const arrayMatch = lastPart.match(/^(.+)\[(\d+)\]$/);
        if (arrayMatch) {
          const [, key, index] = arrayMatch;
          current[key][parseInt(index)] = originalCurrent[key][parseInt(index)];
        } else {
          current[lastPart] = originalCurrent[lastPart];
        }
        
        return updatedReport;
      });
    }
  }, [props.reportDefinition, modifiedSections]);
  
  // Task 2.11: Ensure ReportView uses original Report definition for rendering
  const reportToDisplay = editedReportDefinition ?? props.reportDefinition;

  const [hasValidationErrors, setHasValidationErrors] = useState(false);
  
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
      ...reportData,
      reportData,
      storedQueryData: props.storedQueryData
  }), [reportData, props.storedQueryData]);

  log.info("ReportView reportViewData", reportViewData);

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
  // (meta-)information about the current report, to enable editing
  const reportEntityDefinition = useMemo(() => {
    const miroirMapping = context.deploymentUuidToReportsEntitiesDefinitionsMapping?.[selfApplicationDeploymentMiroir.uuid];
    if (!miroirMapping) return undefined;
    return miroirMapping["model"]?.entityDefinitions?.find((ed: any) => ed.name === "Report");
  }, [context.deploymentUuidToReportsEntitiesDefinitionsMapping]);

  const [localEditedDefinition, setLocalEditedDefinition] = useState<any | undefined>(reportEntityDefinition);
  
  // ###############################################################################################
  // ###############################################################################################
  // ###############################################################################################
  // ###############################################################################################
  // ###############################################################################################
  const initialReportSectionsFormValue = useMemo(() => {
    log.info("############################################## reportSectionsFormValue", props.reportDefinition?.definition.section, reportData, []);
    const r= reportSectionsFormValue(props.reportDefinition?.definition.section, reportData, ["definition", "section"]);
    // const r= reportSectionsFormValue(props.reportDefinition?.definition.section, reportData, []);
    log.info("reportSectionsFormValue initialReportSectionsFormValue", JSON.stringify(r,null,2));
    return r;

  }, [props.reportDefinition, reportData]);

  const formValueMLSchema: JzodObject = useMemo(() => {
    log.info(
      "############################################## reportSectionsFormSchema",
      props.reportDefinition?.definition.section,
      reportData,
      []
    );
    if (!props.pageParams.deploymentUuid || !reportEntityDefinition?.entityUuid) {
      return { type: "object", definition: {} };
    }
    const r = reportSectionsFormSchema(
      props.reportDefinition?.definition.section,
      props.pageParams.deploymentUuid,
      // getApplicationSection(props.pageParams.deploymentUuid, reportEntityDefinition?.entityUuid),
      // reportEntityDefinition?.entityUuid,
      currentDeploymentReportsEntitiesDefinitionsMapping,
      reportData,
      ["definition", "section"]
    );
    const result: JzodObject = {
      type: "object",
      definition: {
        ...r,
        [lastSubmitButtonClicked]: { type: "string", optional: true}
      }
    };
    // log.info("reportSectionsFormSchema formValueSchema", result);
    // log.info("reportSectionsFormSchema formValueSchema", JSON.stringify(result, null, 2));
    log.info("reportSectionsFormSchema formValueSchema", JSON.stringify(Object.keys(r), null, 2));
    return result;
  }, [
    props.reportDefinition,
    reportData,
    reportEntityDefinition,
    currentDeploymentReportsEntitiesDefinitionsMapping,
    props.pageParams.applicationSection,
  ]);
  // ##############################################################################################
  const domainController: DomainControllerInterface = useDomainControllerService();
  const currentModelEnvironment = defaultMiroirModelEnvironment;
  // const reportSectionPathAsString = reportSectionPath?.join("_") || "";
  const onEditValueObjectFormSubmit = useCallback(
    async (data: any) => {
      log.info("onEditValueObjectFormSubmit called with new object value", data);
      // TODO: use action queue
      if (props.deploymentUuid) {
        if (props.applicationSection == "model") {
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
                      parentName: data[data[lastSubmitButtonClicked]].name,
                      parentUuid: data[data[lastSubmitButtonClicked]].parentUuid,
                      applicationSection: props.applicationSection,
                      instances: [data[data[lastSubmitButtonClicked]]],
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
              applicationSection: props.applicationSection ? props.applicationSection : "data",
              objects: [
                {
                  parentName: data[data[lastSubmitButtonClicked]].name,
                  parentUuid: data[data[lastSubmitButtonClicked]].parentUuid,
                  applicationSection: props.applicationSection ? props.applicationSection : "data",
                  instances: [data[data[lastSubmitButtonClicked]]],
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
        {editMode && modifiedSections.size > 0 && (
          <Box
            sx={{
              position: "sticky",
              top: 0,
              zIndex: 1000,
              backgroundColor: "background.paper",
              borderBottom: 1,
              borderColor: "divider",
              padding: 2,
              display: "flex",
              justifyContent: "center",
              gap: 2,
            }}
          >
            <ThemedButton
              variant="primary"
              // color="success"
              // size="large"
              // sx={{
              //   fontWeight: 'bold',
              //   minWidth: 200,
              //   boxShadow: 3,
              //   '&:hover': {
              //     boxShadow: 6,
              //   }
              // }}
              onClick={() => {
                log.info("Submit button clicked - to be implemented in task 5.0");
                // Implementation will be done in task 5.0
              }}
            >
              Submit Changes ({modifiedSections.size} section{modifiedSections.size > 1 ? "s" : ""})
            </ThemedButton>
          </Box>
        )}

        {props.applicationSection ? (
          reportData.elementType == "failure" ? (
            <div>found query failure! {JSON.stringify(reportData, null, 2)}</div>
          ) : // (<>failure</>)
          props.deploymentUuid ? (
            <>
              {editMode && reportEntityDefinition && (
                <></>
                // <InlineReportEditor
                //   reportDefinition={props.reportDefinition}
                //   reportEntityDefinition={reportEntityDefinition}
                //   formValueMLSchema={formValueMLSchema}
                //   deploymentUuid={props.deploymentUuid}
                //   applicationSection={props.applicationSection}
                //   hasValidationErrors={hasValidationErrors}
                //   reportSectionPath={[reportEntityDefinition.name??"reportEntityDefinition_name"]}
                //   onDefinitionChange={setLocalEditedDefinition}
                //   onValidationChange={setHasValidationErrors}
                // />
              )}
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
                <ReportSectionViewWithEditor
                  reportData={reportViewData}
                  fetchedDataJzodSchema={fetchedDataJzodSchema}
                  formValueMLSchema={formValueMLSchema}
                  reportSection={props.reportDefinition?.definition.section}
                  reportSectionPath={["definition", "section"]}
                  reportDefinition={props.reportDefinition}
                  applicationSection={props.applicationSection}
                  deploymentUuid={props.deploymentUuid}
                  editMode={editMode}
                  paramsAsdomainElements={props.pageParams}
                  isOutlineOpen={outlineContext.isOutlineOpen}
                  onToggleOutline={outlineContext.onToggleOutline}
                />
              </Formik>
            </>
          ) : (
            <ThemedSpan style={{ color: "red" }}>no deployment found!</ThemedSpan>
          )
        ) : (
          // : (
          //   <>ReportViewWithEditor Invalid props! {JSON.stringify(props)}</>;
          // )
          <>no application section!</>
        )}
      </Box>
    </>
  );
};
