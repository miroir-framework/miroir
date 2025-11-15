import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
// import { z } from "zod";

import { Accordion, AccordionDetails, AccordionSummary } from '@mui/material';
import {
  adminConfigurationDeploymentParis,
  MiroirLoggerFactory,
  resolvePathOnObject,
  test_createEntityAndReportFromSpreadsheetAndUpdateMenu,
  type LoggerInterface
} from "miroir-core";
import { packageName } from "../../../constants.js";
import { CreateApplicationTool } from '../components/AdminTools/CreateApplicationTool.js';
import { CreateEntityTool } from '../components/AdminTools/CreateEntityTool.js';
import { DeleteApplicationTool } from '../components/AdminTools/DeleteApplicationTool.js';
import { DeleteEntityRunner } from '../components/AdminTools/DeleteEntityRunner.js';
import { PageContainer } from "../components/Page/PageContainer.js";
import { ReportPageContextProvider } from "../components/Reports/ReportPageContext.js";
import { cleanLevel } from "../constants.js";
import { usePageConfiguration } from "../services/index.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "PersistenceReduxSaga"), "UI",
).then((logger: LoggerInterface) => {log = logger});

let count = 0;

const testSubPartPathArray = [
  "definition",
  "testCompositeActions",
  "create new Entity and reports from spreadsheet",
  "compositeAction",
  "templates",
];
// const valuePath = "definition.testCompositeActions"
const testSubPart = resolvePathOnObject(
  test_createEntityAndReportFromSpreadsheetAndUpdateMenu,
  testSubPartPathArray
);

const pageLabel = "Admin";

// ################################################################################################
function formatYYYYMMDD_HHMMSS(date = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = date.getFullYear();
  const MM = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const HH = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  return `${yyyy}${MM}${dd}_${HH}${mm}${ss}`;
}

// ################################################################################################
export const AdminPage: React.FC<any> = (
  props: any // TODO: give a type to props!!!
) => {
  count++;
  
  // Auto-fetch configurations when the page loads
  const { fetchConfigurations } = usePageConfiguration({
    autoFetchOnMount: true,
    successMessage: "Check page configurations loaded successfully",
    actionName: "check page configuration fetch"
  });
  
  // const [testInput, setTestInput] = useState<string>("");
  // const [testResult, setTestResult] = useState<JSX.Element>(<></>);

  // const checkTestDefinition = (event: React.FormEvent<HTMLFormElement>) => {
  //   event.preventDefault();
  //   const form = event.currentTarget;
  //   const input = form.elements.namedItem("testInput") as HTMLInputElement;
  //   const inputValue = input.value;
  //   log.info("Form submitted with value:", inputValue);
  //   // Here you can add logic to handle the input value, e.g., validate or process it
  //   if (!inputValue) {
  //     try {
  //       // const result = test_createEntityAndReportFromSpreadsheetAndUpdateMenu(inputValue);

  //       z.record(transformerForBuild).parse(testSubPart);
  //       setTestResult(<div style={{ color: "green" }}>Input is valid!</div>);
  //       // log.info("Result:", result);
  //     } catch (error) {
  //       console.error("Error processing input:", error);
  //       const zodParseError = error as ZodParseError;
  //       // const firstIssue = (error as any).issues[0];
  //       const firstIssue = zodErrorFirstIssueLeaf(zodParseError);
  //       setTestResult(
  //         <pre style={{ color: "red" }}>
  //           {/* error: {error}
  //           <br /> */}
  //           name: {(error as any).name}
  //           <br />
  //           {/* message: {(error as Error).message}
  //           <br /> */}
  //           first issue code: {(error as any).issues[0].code}
  //           <br />
  //           first issue message: {(error as any).issues[0].message}
  //           <br />
  //           first issue path: {(error as any).issues[0].path}
  //           <br />
  //           issue: <pre>{JSON.stringify(firstIssue, null, 2)}</pre>
  //           ##############################################################################################
  //           <br />
  //           {/* {JSON.stringify((error as any), null, 2)} */}
  //           {JSON.stringify(error as any)}
  //         </pre>
  //       );
  //       // setTestResult("Error: " + (error as Error).message);
  //     }
  //   }
  // };


  const deploymentUuid = adminConfigurationDeploymentParis.uuid;
  // const context = useMiroirContextService();
  // const miroirMetaModel: MetaModel = useCurrentModel(adminConfigurationDeploymentMiroir.uuid);
  // const currentModel = useCurrentModel(deploymentUuid);

  // const currentMiroirModelEnvironment: MiroirModelEnvironment = useMemo(() => {
  //   return {
  //     miroirFundamentalJzodSchema:
  //       context.miroirFundamentalJzodSchema ?? (miroirFundamentalJzodSchema as JzodSchema),
  //     miroirMetaModel: miroirMetaModel,
  //     currentModel: currentModel,
  //   };
  // }, [miroirMetaModel, currentModel, context.miroirFundamentalJzodSchema]);

  // const displayedApplicationSection = context.applicationSection;
  // const setDisplayedApplicationSection = context.setApplicationSection;
  // const handleChangeDisplayedApplicationSection = (event: SelectChangeEvent) => {
  //   event.stopPropagation();
  //   setDisplayedApplicationSection(event.target.value as ApplicationSection);
  //   // setDisplayedReportUuid("");
  // };

  // const currentTransformerDefinition: TransformerForBuildPlusRuntime = useMemo(() => {
  // }, []);
  // const formMlSchema: JzodElement = {
  //   type: "object",
  //   definition: {
  //     createApplicationAndDeployment: {
  //       type: "object",
  //       definition: {
  //         applicationName: {
  //           type: "string",
  //           tag: {
  //             value: {
  //               defaultLabel: "Application Name",
  //               editable: true,
  //             },
  //           },
  //         },
  //       }
  //     },
  //     deleteApplicationAndDeployment: {
  //       type: "object",
  //       definition: {
  //         application: {
  //           type: "uuid",
  //           nullable: true,
  //           tag: {
  //             value: {
  //               defaultLabel: "Application",
  //               editable: true,
  //               selectorParams: {
  //                 targetDeploymentUuid: adminConfigurationDeploymentAdmin.uuid,
  //                 // targetApplicationUuid: "data",
  //                 // targetEntity: "25d935e7-9e93-42c2-aade-0472b883492b", // Admin Application
  //                 targetEntity: entityApplicationForAdmin.uuid,
  //                 targetEntityOrderInstancesBy: "name",
  //               }
  //             },
  //           },
  //         },
  //       }
  //     },
  //     createEntity: {
  //       type: "object",
  //       definition: {
  //         entity: entityDefinitionEntity.jzodSchema,
  //         entityDefinition: entityDefinitionEntityDefinition.jzodSchema,
  //       }
  //     }
  //   }
  // };
  // const reduxState: ReduxDeploymentsState = useSelector<ReduxStateWithUndoRedo, ReduxDeploymentsState>(
  //   selectCurrentReduxDeploymentsStateFromReduxState
  // );
  // const initialReportSectionsFormValue = useMemo(() => {
  //   // const result = transformer_extended_apply_wrapper(
  //   //   context.miroirContext.miroirActivityTracker, // activityTracker
  //   //   "runtime", // step
  //   //   ["rootTransformer"], // transformerPath
  //   //   "TransformerEditor", // label
  //   //   {
  //   //     transformerType: "defaultValueForMLSchema",
  //   //     mlSchema: formMlSchema,
  //   //   }, // transformer
  //   //   currentMiroirModelEnvironment,
  //   //   {}, // transformerParams,
  //   //   {}, // contextResults - pass the instance to transform
  //   //   "value" // resolveBuildTransformersTo
  //   // )
  //   const entityUuid = uuidv4();
  //   const result: {
  //     createApplicationAndDeployment: {
  //       applicationName: string;
  //     };
  //     deleteApplicationAndDeployment: {
  //       application: Uuid | undefined;
  //     } | undefined;
  //     createEntity: { entity: Entity; entityDefinition: EntityDefinition };
  //   } = {
  //     createApplicationAndDeployment: {
  //       // applicationName: "test_application_" + new Date().toISOString(),
  //       applicationName: "test_application_" + formatYYYYMMDD_HHMMSS(new Date()),
  //     },
  //     deleteApplicationAndDeployment: reduxState && Object.keys(reduxState).length > 0
  //       ? {
  //         // application: "79a8fa03-cb64-45c8-9f85-7f8336bf92a5" as any
  //         application: undefined
  //       }
  //       // transformer_extended_apply_wrapper(
  //       //     context.miroirContext.miroirActivityTracker, // activityTracker
  //       //     "runtime", // step
  //       //     ["rootTransformer"], // transformerPath
  //       //     "TransformerEditor", // label
  //       //     {
  //       //       transformerType: "defaultValueForMLSchema",
  //       //       mlSchema: formMlSchema.definition.deleteApplicationAndDeployment as JzodElement,
  //       //       interpolation: "build",
  //       //     }, // transformer
  //       //     currentMiroirModelEnvironment,
  //       //     {}, // transformerParams,
  //       //     {}, // contextResults - pass the instance to transform
  //       //     "value", // resolveBuildTransformersTo
  //       //     reduxState,
  //       //     deploymentUuid,
  //       //   )
  //       : undefined,
  //     createEntity: {
  //       entity: {
  //         uuid: entityUuid,
  //         parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
  //         parentName: "Entity",
  //         parentDefinitionVersionUuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
  //         name: "",
  //       },
  //       entityDefinition: {
  //         uuid: uuidv4(),
  //         parentName: "EntityDefinition",
  //         parentUuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
  //         parentDefinitionVersionUuid: "c50240e7-c451-46c2-b60a-07b3172a5ef9",
  //         name: "",
  //         entityUuid: entityUuid,
  //         jzodSchema: {
  //           type: "object",
  //           definition: {
  //             uuid: {
  //               type: "uuid",
  //               tag: {
  //                 value: {
  //                   id: 1,
  //                   defaultLabel: "Uuid",
  //                   editable: false,
  //                 },
  //               },
  //             },
  //             parentName: {
  //               type: "string",
  //               optional: true,
  //               tag: {
  //                 value: {
  //                   id: 2,
  //                   defaultLabel: "Entity Name",
  //                   editable: false,
  //                 },
  //               },
  //             },
  //             parentUuid: {
  //               type: "uuid",
  //               tag: {
  //                 value: {
  //                   id: 3,
  //                   defaultLabel: "Entity Uuid",
  //                   editable: false,
  //                 },
  //               },
  //             },
  //             parentDefinitionVersionUuid: {
  //               type: "uuid",
  //               optional: true,
  //               tag: {
  //                 value: {
  //                   id: 4,
  //                   defaultLabel: "Entity Definition Version Uuid",
  //                   editable: false,
  //                 },
  //               },
  //             },
  //             name: {
  //               type: "string",
  //               tag: {
  //                 value: {
  //                   defaultLabel: "Name",
  //                   editable: true,
  //                 },
  //               },
  //             },
  //           },
  //         },
  //       },
  //     },
  //   };
  //   return result;
  // }, [context, reduxState, formMlSchema, currentMiroirModelEnvironment]);

  
  // const deploymentEntityStateSelectorMap: SyncBoxedExtractorOrQueryRunnerMap<ReduxDeploymentsState> =
  // useMemo(() => getMemoizedReduxDeploymentsStateSelectorMap(), []);
  
  // const [deleteApplicationAndDeploymentCompositeAction_application, setDeleteApplicationAndDeploymentCompositeAction_application] = useState<Uuid | undefined>(undefined);
  // const deleteApplicationAndDeploymentCompositeAction_deploymentUuidQuery: BoxedQueryWithExtractorCombinerTransformer = useMemo(() => {
  //   if (initialReportSectionsFormValue.deleteApplicationAndDeployment?.application) {
  //     const result: BoxedQueryWithExtractorCombinerTransformer = {
  //       queryType: "boxedQueryWithExtractorCombinerTransformer",
  //       deploymentUuid: adminConfigurationDeploymentAdmin.uuid,
  //       extractors: {
  //         deployments: {
  //           label: "deployments of the application",
  //           extractorOrCombinerType: "extractorByEntityReturningObjectList",
  //           parentUuid: entityDeployment.uuid,
  //           parentName: entityDeployment.name,
  //           applicationSection: "data",
  //           filter: {
  //             attributeName: "adminApplication",
  //             value: deploymentUuid
  //           }
  //         }
  //       },
  //     }
  //     return result;
  //   }
  //   return {
  //     queryType: "boxedQueryWithExtractorCombinerTransformer",
  //     deploymentUuid: "",
  //     pageParams: props.pageParams,
  //     queryParams: {},
  //     contextResults: {},
  //     extractors: {},
  //   };

  // }, [initialReportSectionsFormValue, reduxState]);

  // const deploymentEntityStateFetchQueryParams: SyncQueryRunnerParams<ReduxDeploymentsState> =
  //   useMemo(
  //     () =>
  //       getQueryRunnerParamsForReduxDeploymentsState(
  //         deleteApplicationAndDeploymentCompositeAction_deploymentUuidQuery,
  //         deploymentEntityStateSelectorMap
  //       ),
  //     [deploymentEntityStateSelectorMap, deleteApplicationAndDeploymentCompositeAction_deploymentUuidQuery]
  //   );
  // const reportData: Domain2QueryReturnType<Domain2QueryReturnType<Record<string, any>>> =
  //   useReduxDeploymentsStateQuerySelector(
  //     deploymentEntityStateSelectorMap.runQuery,
  //     deploymentEntityStateFetchQueryParams
  //   );
    
  // const deleteApplicationAndDeploymentCompositeAction_deploymentUuid = useMemo(() => {
  //   if (initialReportSectionsFormValue.deleteApplicationAndDeployment?.application) {
  //     const applicationUuid = initialReportSectionsFormValue.deleteApplicationAndDeployment.application;

  //     return deploymentUuid;
  //   }
  //   return undefined;
  // }, [initialReportSectionsFormValue, reduxState]);
  // log.info("deleteApplicationAndDeploymentCompositeAction_application", deleteApplicationAndDeploymentCompositeAction_application);

  // log.info("initialReportSectionsFormValue", initialReportSectionsFormValue);

  return (
    <ReportPageContextProvider>
      <PageContainer>
        <h1>Admin</h1>
        This is the Admin page. It has been rendered {count} times.
        <br />
        path: {testSubPartPathArray.join(".")}
        <br />
        {/* Create Application & Deployment */}
        <Accordion style={{ marginBottom: 12 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <div style={{ fontWeight: 500 }}>Create Application & Deployment</div>
          </AccordionSummary>
          <AccordionDetails>
            <CreateApplicationTool
              deploymentUuid={deploymentUuid}
            />
          </AccordionDetails>
        </Accordion>
        {/* Delete Application & Deployment */}
        <Accordion style={{ marginBottom: 12 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <div style={{ fontWeight: 500 }}>Delete Application & Deployment</div>
          </AccordionSummary>
          <AccordionDetails>
            <DeleteApplicationTool
              deploymentUuid={deploymentUuid}
            />
          </AccordionDetails>
        </Accordion>
        {/* create entity */}
        <Accordion style={{ marginBottom: 12 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <div style={{ fontWeight: 500 }}>Create Entity</div>
          </AccordionSummary>
          <AccordionDetails>
            <CreateEntityTool
              deploymentUuid={deploymentUuid}
            />
          </AccordionDetails>
        </Accordion>
        {/* delete entity */}
        <Accordion style={{ marginBottom: 12 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <div style={{ fontWeight: 500 }}>Drop Entity</div>
          </AccordionSummary>
          <AccordionDetails>
            <DeleteEntityRunner
              deploymentUuid={deploymentUuid}
            />
          </AccordionDetails>
        </Accordion>
      </PageContainer>
    </ReportPageContextProvider>
  );
};
