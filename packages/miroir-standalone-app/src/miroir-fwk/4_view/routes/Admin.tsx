import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Formik } from "formik";
import { useMemo, useState } from "react";
import { v4 as uuidv4 } from 'uuid';
// import { z } from "zod";

import { Accordion, AccordionDetails, AccordionSummary, FormControl, InputLabel, Select, type SelectChangeEvent } from '@mui/material';
import type {
  ApplicationSection,
  BoxedQueryWithExtractorCombinerTransformer,
  CompositeAction,
  Domain2QueryReturnType,
  DomainControllerInterface,
  Entity,
  EntityDefinition,
  InitApplicationParameters,
  InstanceAction,
  ModelAction,
  ReduxDeploymentsState,
  StoreUnitConfiguration,
  SyncBoxedExtractorOrQueryRunnerMap,
  SyncQueryRunnerParams,
  Uuid,
} from "miroir-core";
import {
  adminConfigurationDeploymentAdmin,
  adminConfigurationDeploymentMiroir,
  adminConfigurationDeploymentParis,
  createApplicationCompositeAction,
  createDeploymentCompositeAction,
  defaultMiroirModelEnvironment,
  deleteApplicationAndDeploymentCompositeAction,
  Domain2ElementFailed,
  entityApplicationForAdmin,
  entityDefinitionEntity,
  entityDefinitionEntityDefinition,
  entityDeployment,
  getBasicApplicationConfiguration,
  getBasicStoreUnitConfiguration,
  getQueryRunnerParamsForReduxDeploymentsState,
  miroirFundamentalJzodSchema,
  MiroirLoggerFactory,
  resetAndinitializeDeploymentCompositeAction,
  resolvePathOnObject,
  runBoxedQueryAction,
  runQuery,
  test_createEntityAndReportFromSpreadsheetAndUpdateMenu,
  transformer_extended_apply_wrapper,
  type JzodElement,
  type JzodSchema,
  type LoggerInterface,
  type MetaModel,
  type MiroirModelEnvironment
} from "miroir-core";
import { packageName } from "../../../constants.js";
import { PageContainer } from "../components/Page/PageContainer.js";
import { ReportPageContextProvider } from "../components/Reports/ReportPageContext.js";
import { TypedValueObjectEditor } from "../components/Reports/TypedValueObjectEditor.js";
import { cleanLevel } from "../constants.js";
import { useDomainControllerService, useMiroirContextService } from "../MiroirContextReactProvider.js";
import { useCurrentModel, useReduxDeploymentsStateQuerySelector } from "../ReduxHooks.js";
import { usePageConfiguration } from "../services/index.js";
import { getMemoizedReduxDeploymentsStateSelectorMap, selectCurrentReduxDeploymentsStateFromReduxState, useReduxState, type ReduxStateWithUndoRedo } from 'miroir-localcache-redux';
import { useSelector } from 'react-redux';
import { ThemedOnScreenHelper } from '../components/Themes/BasicComponents.js';

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
  
  const [testInput, setTestInput] = useState<string>("");
  const [testResult, setTestResult] = useState<JSX.Element>(<></>);

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
  const context = useMiroirContextService();
  const miroirMetaModel: MetaModel = useCurrentModel(adminConfigurationDeploymentMiroir.uuid);
  const currentModel = useCurrentModel(deploymentUuid);
  const domainController: DomainControllerInterface = useDomainControllerService();

  const currentMiroirModelEnvironment: MiroirModelEnvironment = useMemo(() => {
    return {
      miroirFundamentalJzodSchema:
        context.miroirFundamentalJzodSchema ?? (miroirFundamentalJzodSchema as JzodSchema),
      miroirMetaModel: miroirMetaModel,
      currentModel: currentModel,
    };
  }, [miroirMetaModel, currentModel, context.miroirFundamentalJzodSchema]);

  // const displayedApplicationSection = context.applicationSection;
  // const setDisplayedApplicationSection = context.setApplicationSection;
  // const handleChangeDisplayedApplicationSection = (event: SelectChangeEvent) => {
  //   event.stopPropagation();
  //   setDisplayedApplicationSection(event.target.value as ApplicationSection);
  //   // setDisplayedReportUuid("");
  // };

  // const currentTransformerDefinition: TransformerForBuildPlusRuntime = useMemo(() => {
  // }, []);
  const formMlSchema: JzodElement = {
    type: "object",
    definition: {
      createApplicationAndDeployment: {
        type: "object",
        definition: {
          applicationName: {
            type: "string",
            tag: {
              value: {
                defaultLabel: "Application Name",
                editable: true,
              },
            },
          },
        }
      },
      deleteApplicationAndDeployment: {
        type: "object",
        definition: {
          application: {
            type: "uuid",
            nullable: true,
            tag: {
              value: {
                defaultLabel: "Application",
                editable: true,
                selectorParams: {
                  targetDeploymentUuid: adminConfigurationDeploymentAdmin.uuid,
                  // targetApplicationUuid: "data",
                  // targetEntity: "25d935e7-9e93-42c2-aade-0472b883492b", // Admin Application
                  targetEntity: entityApplicationForAdmin.uuid,
                  targetEntityOrderInstancesBy: "name",
                }
              },
            },
          },
        }
      },
      createEntity: {
        type: "object",
        definition: {
          entity: entityDefinitionEntity.jzodSchema,
          entityDefinition: entityDefinitionEntityDefinition.jzodSchema,
        }
      }
    }
  };
  const reduxState: ReduxDeploymentsState = useSelector<ReduxStateWithUndoRedo, ReduxDeploymentsState>(
    selectCurrentReduxDeploymentsStateFromReduxState
  );
  const initialReportSectionsFormValue = useMemo(() => {
    // const result = transformer_extended_apply_wrapper(
    //   context.miroirContext.miroirActivityTracker, // activityTracker
    //   "runtime", // step
    //   ["rootTransformer"], // transformerPath
    //   "TransformerEditor", // label
    //   {
    //     transformerType: "defaultValueForMLSchema",
    //     mlSchema: formMlSchema,
    //   }, // transformer
    //   currentMiroirModelEnvironment,
    //   {}, // transformerParams,
    //   {}, // contextResults - pass the instance to transform
    //   "value" // resolveBuildTransformersTo
    // )
    const entityUuid = uuidv4();
    const result: {
      createApplicationAndDeployment: {
        applicationName: string;
      };
      deleteApplicationAndDeployment: {
        application: Uuid;
      } | undefined;
      createEntity: { entity: Entity; entityDefinition: EntityDefinition };
    } = {
      createApplicationAndDeployment: {
        // applicationName: "test_application_" + new Date().toISOString(),
        applicationName: "test_application_" + formatYYYYMMDD_HHMMSS(new Date()),
      },
      deleteApplicationAndDeployment: reduxState && Object.keys(reduxState).length > 0
        ? {
          application: "79a8fa03-cb64-45c8-9f85-7f8336bf92a5" as any
        }
        // transformer_extended_apply_wrapper(
        //     context.miroirContext.miroirActivityTracker, // activityTracker
        //     "runtime", // step
        //     ["rootTransformer"], // transformerPath
        //     "TransformerEditor", // label
        //     {
        //       transformerType: "defaultValueForMLSchema",
        //       mlSchema: formMlSchema.definition.deleteApplicationAndDeployment as JzodElement,
        //       interpolation: "build",
        //     }, // transformer
        //     currentMiroirModelEnvironment,
        //     {}, // transformerParams,
        //     {}, // contextResults - pass the instance to transform
        //     "value", // resolveBuildTransformersTo
        //     reduxState,
        //     deploymentUuid,
        //   )
        : undefined,
      createEntity: {
        entity: {
          uuid: entityUuid,
          parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          parentName: "Entity",
          parentDefinitionVersionUuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
          name: "",
        },
        entityDefinition: {
          uuid: uuidv4(),
          parentName: "EntityDefinition",
          parentUuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
          parentDefinitionVersionUuid: "c50240e7-c451-46c2-b60a-07b3172a5ef9",
          name: "",
          entityUuid: entityUuid,
          jzodSchema: {
            type: "object",
            definition: {
              uuid: {
                type: "uuid",
                tag: {
                  value: {
                    id: 1,
                    defaultLabel: "Uuid",
                    editable: false,
                  },
                },
              },
              parentName: {
                type: "string",
                optional: true,
                tag: {
                  value: {
                    id: 2,
                    defaultLabel: "Entity Name",
                    editable: false,
                  },
                },
              },
              parentUuid: {
                type: "uuid",
                tag: {
                  value: {
                    id: 3,
                    defaultLabel: "Entity Uuid",
                    editable: false,
                  },
                },
              },
              parentDefinitionVersionUuid: {
                type: "uuid",
                optional: true,
                tag: {
                  value: {
                    id: 4,
                    defaultLabel: "Entity Definition Version Uuid",
                    editable: false,
                  },
                },
              },
              name: {
                type: "string",
                tag: {
                  value: {
                    defaultLabel: "Name",
                    editable: true,
                  },
                },
              },
            },
          },
        },
      },
    };
    return result;
  }, [context, reduxState, formMlSchema, currentMiroirModelEnvironment]);

  
  const deploymentEntityStateSelectorMap: SyncBoxedExtractorOrQueryRunnerMap<ReduxDeploymentsState> =
  useMemo(() => getMemoizedReduxDeploymentsStateSelectorMap(), []);
  
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

  log.info("initialReportSectionsFormValue", initialReportSectionsFormValue);

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
            <Formik
              enableReinitialize={true}
              // initialValues={formInitialValue}
              initialValues={initialReportSectionsFormValue}
              onSubmit={async (values, { setSubmitting, setErrors }) => {
                try {
                  const newApplicationName = values.createApplicationAndDeployment.applicationName;

                  log.info(
                    "Admin onSubmit createApplicationAndDeployment formik values",
                    values,
                    newApplicationName
                  );

                  const testSelfApplicationUuid = uuidv4();
                  const testDeploymentUuid = uuidv4();
                  const testApplicationModelBranchUuid = uuidv4();
                  const testApplicationVersionUuid = uuidv4();

                  const testDeploymentStorageConfiguration: StoreUnitConfiguration =
                    getBasicStoreUnitConfiguration(newApplicationName, {
                      emulatedServerType: "sql",
                      connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
                    });

                  log.info(
                    "Admin onSubmit createApplicationAndDeployment testDeploymentStorageConfiguration",
                    testDeploymentStorageConfiguration
                  );
                  const initParametersForTest: InitApplicationParameters =
                    getBasicApplicationConfiguration(
                      newApplicationName,
                      testSelfApplicationUuid,
                      testDeploymentUuid,
                      testApplicationModelBranchUuid,
                      testApplicationVersionUuid
                    );

                  log.info(
                    "Admin onSubmit createApplicationAndDeployment initParametersForTest",
                    initParametersForTest
                  );
                  // const createAction: ModelAction = {
                  //   actionType: "createEntity",
                  //   actionLabel: "createEntity",
                  //   endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  //   deploymentUuid: deploymentUuid,
                  //   payload: {
                  //     entities: [
                  //       {
                  //         entity: values.createEntity.entity,
                  //         entityDefinition: values.createEntity.entityDefinition,
                  //       },
                  //     ],
                  //   },
                  // };

                  // create application in the admin store
                  const localCreateApplicationCompositeAction = createApplicationCompositeAction(
                    adminConfigurationDeploymentAdmin.uuid,
                    testSelfApplicationUuid,
                    testSelfApplicationUuid,
                    newApplicationName,
                    testDeploymentStorageConfiguration
                    // testSelfApplicationUuid,
                    // testApplicationModelBranchUuid,
                    // testApplicationVersionUuid
                  );
                  log.info(
                    "Admin onSubmit createApplicationAndDeployment localCreateApplicationCompositeAction",
                    localCreateApplicationCompositeAction
                  );
                  // create deployment
                  const localCreateDeploymentCompositeAction = createDeploymentCompositeAction(
                    newApplicationName,
                    testDeploymentUuid,
                    testSelfApplicationUuid,
                    testDeploymentStorageConfiguration
                  );
                  log.info(
                    "Admin onSubmit createApplicationAndDeployment localCreateDeploymentCompositeAction",
                    localCreateDeploymentCompositeAction
                  );
                  const localResetAndinitializeDeploymentCompositeAction =
                    resetAndinitializeDeploymentCompositeAction(
                      testDeploymentUuid,
                      initParametersForTest,
                      []
                    );
                  log.info(
                    "Admin onSubmit createApplicationAndDeployment localResetAndinitializeDeploymentCompositeAction",
                    localResetAndinitializeDeploymentCompositeAction
                  );

                  // run actions
                  await domainController.handleCompositeAction(
                    localCreateApplicationCompositeAction,
                    currentMiroirModelEnvironment,
                    {}
                  );

                  await domainController.handleCompositeAction(
                    localCreateDeploymentCompositeAction,
                    currentMiroirModelEnvironment,
                    {}
                  );
                  await domainController.handleCompositeAction(
                    localResetAndinitializeDeploymentCompositeAction,
                    currentMiroirModelEnvironment,
                    {}
                  );

                  // await domainController.handleAction(createAction, defaultMiroirModelEnvironment);
                  // await domainController.handleAction(
                  //   {
                  //     actionType: "commit",
                  //     actionLabel: "commit",
                  //     endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  //     deploymentUuid,
                  //   },
                  //   defaultMiroirModelEnvironment
                  // );
                } catch (e) {
                  log.error(e);
                } finally {
                  setSubmitting(false);
                }
              }}
              validateOnChange={false}
              validateOnBlur={false}
            >
              {/* <ThemedOnScreenHelper
                label={"Initial Report Sections Form Value"}
                data={initialReportSectionsFormValue}
              /> */}
              <TypedValueObjectEditor
                labelElement={<h2>Admin Configuration Editor</h2>}
                deploymentUuid={deploymentUuid}
                applicationSection="model"
                formValueMLSchema={formMlSchema}
                formikValuePathAsString="createApplicationAndDeployment"
                //
                formLabel="Create Application & Deployment"
                zoomInPath=""
                maxRenderDepth={Infinity} // Always render fully for editor
              />

              {/* {JSON.stringify(initialReportSectionsFormValue, null, 2)} */}
              {/* </ThemedOnScreenHelper> */}
            </Formik>
          </AccordionDetails>
        </Accordion>
        {/* Delete Application & Deployment */}
        <Accordion style={{ marginBottom: 12 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <div style={{ fontWeight: 500 }}>Delete Application & Deployment</div>
          </AccordionSummary>
          <AccordionDetails>
            {/* <div>
              <FormControl fullWidth>
                <InputLabel id="demo-simple-select-label">Chosen selfApplication Deployment</InputLabel>
                <Select
                  labelId="demo-simple-select-label"
                  id="demo-simple-select"
                  value={context.deploymentUuid}
                  label="displayedDeploymentUuid"
                  onChange={handleChangeDisplayedDeployment}
                >
                  {deployments.map((deployment) => {
                    return (
                      <MenuItem key={deployment.name} value={deployment.uuid}>
                        {deployment.description}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </div> */}

            <Formik
              enableReinitialize={true}
              // initialValues={formInitialValue}
              initialValues={initialReportSectionsFormValue}
              onSubmit={async (values, { setSubmitting, setErrors }) => {
                try {
                  const applicationUuid = values.deleteApplicationAndDeployment?.application;

                  log.info(
                    "Admin onSubmit deleteApplicationAndDeployment formik values",
                    values,
                    applicationUuid
                  );
                  if (!applicationUuid) {
                    throw new Error("No application selected to delete");
                  }

                  const deleteApplicationAndDeploymentCompositeAction_deploymentUuidQuery: BoxedQueryWithExtractorCombinerTransformer =
                    {
                      queryType: "boxedQueryWithExtractorCombinerTransformer",
                      deploymentUuid: adminConfigurationDeploymentAdmin.uuid,
                      pageParams: {},
                      queryParams: {},
                      contextResults: {},
                      extractors: {
                        deployments: {
                          label: "deployments of the application",
                          extractorOrCombinerType: "extractorByEntityReturningObjectList",
                          parentUuid: entityDeployment.uuid,
                          parentName: entityDeployment.name,
                          applicationSection: "data",
                          filter: {
                            // attributeName: "selfApplication",
                            attributeName: "adminApplication",
                            value: applicationUuid,
                          },
                        },
                      },
                    };

                  const deploymentEntityStateFetchQueryParams: SyncQueryRunnerParams<ReduxDeploymentsState> =
                    getQueryRunnerParamsForReduxDeploymentsState(
                      deleteApplicationAndDeploymentCompositeAction_deploymentUuidQuery,
                      deploymentEntityStateSelectorMap
                    );
                  const deployments = runQuery(
                    reduxState,
                    deploymentEntityStateFetchQueryParams,
                    defaultMiroirModelEnvironment // TODO: use real environment
                    // deploymentEntityStateSelectorMap,
                  );
                  log.info(
                    "Admin onSubmit deleteApplicationAndDeployment deployments for application",
                    applicationUuid,
                    "reduxState",
                    reduxState,
                    // "deploymentsQueryParams",
                    // deploymentEntityStateFetchQueryParams,
                    "deployments",
                    deployments
                  );
                  // lookup deploymentUuid to delete from application uuid

                  if (deployments instanceof Domain2ElementFailed) {
                    throw deployments;
                  }
                  if (deployments.deployments.length !== 1) {
                    throw new Error(
                      `Expected exactly one deployment for application ${applicationUuid}, but found ${deployments.deployments.length}`
                    );
                  }
                  // const testDeploymentStorageConfiguration: StoreUnitConfiguration =
                  //   getBasicStoreUnitConfiguration(newApplicationName, {
                  //     emulatedServerType: "sql",
                  //     connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
                  //   });

                  const dropStorageAction: CompositeAction = deleteApplicationAndDeploymentCompositeAction(
                    {
                      miroirConfigType: "client",
                      client: {
                        emulateServer: false,
                        serverConfig: {
                          rootApiUrl: "http://localhost:3000/api",
                          storeSectionConfiguration: {
                            [deployments.deployments[0].uuid]: deployments.deployments[0].configuration,
                          }
                        }
                      }
                    },
                    deployments.deployments[0].uuid,
                  );

                  log.info(
                    "Admin onSubmit deleteApplicationAndDeployment dropStorageAction",
                    JSON.stringify(dropStorageAction, null, 2)
                  );

                  const deleteAdminApplication: InstanceAction = {
                    // actionType: "deleteInstanceWithCascade",
                    actionType: "deleteInstance",
                    actionLabel: "deleteDeployment",
                    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
                    deploymentUuid: adminConfigurationDeploymentAdmin.uuid,
                    // deploymentUuid: deployments.deployments[0].uuid,
                    payload: {
                      applicationSection: "data",
                      objects: [
                        {
                          parentUuid: entityApplicationForAdmin.uuid,
                          applicationSection: "data",
                          instances: [
                            {
                              parentUuid: entityApplicationForAdmin.uuid,
                              uuid: applicationUuid,
                            }
                          ]
                        }
                      ]
                    },
                  };

                  log.info(
                    "Admin onSubmit deleteApplicationAndDeployment deleteAdminApplication action",
                    deleteAdminApplication
                  );

                  const deleteDeploymentAction: InstanceAction = {
                    // actionType: "deleteInstanceWithCascade",
                    actionType: "deleteInstance",
                    actionLabel: "deleteDeployment",
                    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
                    deploymentUuid: adminConfigurationDeploymentAdmin.uuid,
                    // deploymentUuid: deployments.deployments[0].uuid,
                    payload: {
                      applicationSection: "data",
                      objects: [
                        {
                          parentUuid: entityDeployment.uuid,
                          applicationSection: "data",
                          instances: [
                            {
                              parentUuid: entityDeployment.uuid,
                              uuid: deployments.deployments[0].uuid,
                            }
                          ]
                        }
                      ]
                    },
                  };

                  log.info(
                    "Admin onSubmit deleteApplicationAndDeployment deleteDeploymentAction action",
                    deleteDeploymentAction
                  );
                  // run actions
                  await domainController.handleCompositeAction(
                    dropStorageAction,
                    currentMiroirModelEnvironment,
                    {}
                  )

                  await domainController.handleAction(
                    deleteDeploymentAction,
                    currentMiroirModelEnvironment
                  );
                  await domainController.handleAction(
                    deleteAdminApplication,
                    currentMiroirModelEnvironment
                  );

                  // // create application in the admin store
                  // const localCreateApplicationCompositeAction = createApplicationCompositeAction(
                  //   adminConfigurationDeploymentAdmin.uuid,
                  //   testSelfApplicationUuid,
                  //   testSelfApplicationUuid,
                  //   newApplicationName,
                  //   testDeploymentStorageConfiguration
                  //   // testSelfApplicationUuid,
                  //   // testApplicationModelBranchUuid,
                  //   // testApplicationVersionUuid
                  // );
                  // log.info(
                  //   "Admin onSubmit createApplicationAndDeployment localCreateApplicationCompositeAction",
                  //   localCreateApplicationCompositeAction
                  // );
                  // create deployment
                  // const  localCreateDeploymentCompositeAction = deleteApplicationAndDeploymentCompositeAction(
                  //   testDeploymentUuid,
                  //   testDeploymentStorageConfiguration
                  //   // newApplicationName,
                  // );
                  // log.info(
                  //   "Admin onSubmit createApplicationAndDeployment localCreateDeploymentCompositeAction",
                  //   localCreateDeploymentCompositeAction
                  // );
                  // const localResetAndinitializeDeploymentCompositeAction = resetAndinitializeDeploymentCompositeAction(
                  //   testDeploymentUuid,
                  //   initParametersForTest,
                  //   []
                  // );
                  // log.info(
                  //   "Admin onSubmit createApplicationAndDeployment localResetAndinitializeDeploymentCompositeAction",
                  //   localResetAndinitializeDeploymentCompositeAction
                  // );


                  // await domainController.handleCompositeAction(
                  //   localCreateDeploymentCompositeAction,
                  //   currentMiroirModelEnvironment,
                  //   {}
                  // );
                  // await domainController.handleCompositeAction(
                  //   localResetAndinitializeDeploymentCompositeAction,
                  //   currentMiroirModelEnvironment,
                  //   {}
                  // );
                } catch (e) {
                  log.error(e);
                } finally {
                  setSubmitting(false);
                }
              }}
              // onChange={async (
              //   values: any,
              //   { setSubmitting, setErrors }: { setSubmitting: any; setErrors: any }
              // ) => {
              //   try {
              //     const applicationToDelete = values.deleteApplicationAndDeployment?.application;

              //     log.info(
              //       "Admin onChange deleteApplicationAndDeployment formik values",
              //       values,
              //       applicationToDelete
              //     );
              //     setDeleteApplicationAndDeploymentCompositeAction_application(applicationToDelete);
              //   } catch (e) {
              //     log.error(e);
              //   } finally {
              //     setSubmitting(false);
              //   }
              // }}
              validateOnChange={false}
              validateOnBlur={false}
            >
              <>
                {/* <ThemedOnScreenHelper
                  label={"Initial Report Sections Form Value"}
                  data={initialReportSectionsFormValue.deleteApplicationAndDeployment}
                />
                <ThemedOnScreenHelper
                  label={"Initial Report Sections schema"}
                  data={formMlSchema.definition.deleteApplicationAndDeployment}
                /> */}
                <TypedValueObjectEditor
                  labelElement={<h2>Admin Configuration Editor</h2>}
                  deploymentUuid={deploymentUuid}
                  applicationSection="model"
                  formValueMLSchema={formMlSchema}
                  formikValuePathAsString="deleteApplicationAndDeployment"
                  //
                  formLabel="Delete Application & Deployment"
                  zoomInPath=""
                  maxRenderDepth={Infinity} // Always render fully for editor
                />
              </>
              {/* {JSON.stringify(initialReportSectionsFormValue, null, 2)} */}
              {/* </ThemedOnScreenHelper> */}
            </Formik>
          </AccordionDetails>
        </Accordion>
        {/* create entity */}
        <Accordion style={{ marginBottom: 12 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <div style={{ fontWeight: 500 }}>Create Entity</div>
          </AccordionSummary>
          <AccordionDetails>
            <Formik
              enableReinitialize={true}
              // initialValues={formInitialValue}
              initialValues={initialReportSectionsFormValue}
              onSubmit={async (values, { setSubmitting, setErrors }) => {
                try {
                  const createAction: ModelAction = {
                    actionType: "createEntity",
                    actionLabel: "createEntity",
                    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                    deploymentUuid: deploymentUuid,
                    payload: {
                      entities: [
                        {
                          entity: values.createEntity.entity,
                          entityDefinition: values.createEntity.entityDefinition,
                        },
                      ],
                    },
                  };
                  log.info("Admin onSubmit formik values", values, createAction);

                  await domainController.handleAction(createAction, defaultMiroirModelEnvironment);
                  await domainController.handleAction(
                    {
                      actionType: "commit",
                      actionLabel: "commit",
                      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                      deploymentUuid,
                    },
                    defaultMiroirModelEnvironment
                  );
                  // Handle zoom case: merge changes back into the full object for submission
                  // const finalValues = hasZoomPath
                  //   ? setValueAtPath(initialValueObject, zoomInPath!, values)
                  //   : values;

                  // await onSubmit(values);
                  // await onEditValueObjectFormSubmit(values); // TODO: make it return Promise, no await because handler should return immediately
                } catch (e) {
                  log.error(e);
                } finally {
                  setSubmitting(false);
                }
              }}
              validateOnChange={false}
              validateOnBlur={false}
            >
              {/* <ThemedOnScreenHelper
                label={"Initial Report Sections Form Value"}
                data={initialReportSectionsFormValue}
              /> */}
              <TypedValueObjectEditor
                labelElement={<h2>Admin Configuration Editor</h2>}
                deploymentUuid={deploymentUuid}
                applicationSection="model"
                formValueMLSchema={formMlSchema}
                formikValuePathAsString="createEntity"
                //
                formLabel="Admin Configuration Editor2"
                zoomInPath=""
                maxRenderDepth={Infinity} // Always render fully for editor
              />

              {/* {JSON.stringify(initialReportSectionsFormValue, null, 2)} */}
              {/* </ThemedOnScreenHelper> */}
            </Formik>
          </AccordionDetails>
        </Accordion>
        {/* {testResult} */}
        {/* <span style={{ color: "red" }}>{testResult}</span> */}
        {/* <div>
          <form id={"form." + pageLabel} onSubmit={checkTestDefinition}>
            <button type="submit" name={pageLabel} form={"form." + pageLabel}>
              submit form.{pageLabel}
            </button>
            <input
              type="text"
              name="testInput"
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
            />
          </form>
        </div> */}
        {/* <div>
          <pre>
            {JSON.stringify(testSubPart, null, 2)}
          </pre>
        </div> */}
      </PageContainer>
    </ReportPageContextProvider>
  );
};
