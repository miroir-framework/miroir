import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Formik } from "formik";
import { useMemo, useState } from "react";
import { v4 as uuidv4 } from 'uuid';
// import { z } from "zod";

import { Accordion, AccordionDetails, AccordionSummary } from '@mui/material';
import type {
  DomainControllerInterface,
  Entity,
  EntityDefinition,
  InitApplicationParameters,
  ModelAction,
  StoreUnitConfiguration,
} from "miroir-core";
import {
  adminConfigurationDeploymentAdmin,
  adminConfigurationDeploymentMiroir,
  adminConfigurationDeploymentParis,
  createApplicationCompositeAction,
  createDeploymentCompositeAction,
  defaultMiroirModelEnvironment,
  entityDefinitionEntity,
  entityDefinitionEntityDefinition,
  getBasicApplicationConfiguration,
  getBasicStoreUnitConfiguration,
  miroirFundamentalJzodSchema,
  MiroirLoggerFactory,
  resetAndinitializeDeploymentCompositeAction,
  resolvePathOnObject,
  test_createEntityAndReportFromSpreadsheetAndUpdateMenu,
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
import { useCurrentModel } from "../ReduxHooks.js";
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
      createEntity: {
        type: "object",
        definition: {
          entity: entityDefinitionEntity.jzodSchema,
          entityDefinition: entityDefinitionEntityDefinition.jzodSchema,
        }
      }
    }
  };

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

  // const currentTransformerDefinition: TransformerForBuildPlusRuntime = useMemo(() => {
  // }, []);
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
      createEntity: { entity: Entity; entityDefinition: EntityDefinition };
    } = {
      createApplicationAndDeployment: {
        // applicationName: "test_application_" + new Date().toISOString(),
        applicationName: "test_application_" + formatYYYYMMDD_HHMMSS(new Date()),
      },
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
  }, [context, formMlSchema, currentMiroirModelEnvironment]);

  log.info("initialReportSectionsFormValue", initialReportSectionsFormValue);
  return (
    <ReportPageContextProvider>
      <PageContainer>
        <h1>Admin</h1>
        This is the Admin page. It has been rendered {count} times.
        <br />
        path: {testSubPartPathArray.join(".")}
        <br />
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

                  log.info("Admin onSubmit createApplicationAndDeployment formik values", values, newApplicationName);

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
                  const  localCreateDeploymentCompositeAction = createDeploymentCompositeAction(
                    newApplicationName,
                    testDeploymentUuid,
                    testDeploymentStorageConfiguration
                  );
                  log.info(
                    "Admin onSubmit createApplicationAndDeployment localCreateDeploymentCompositeAction",
                    localCreateDeploymentCompositeAction
                  );
                  const localResetAndinitializeDeploymentCompositeAction = resetAndinitializeDeploymentCompositeAction(
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
                  )

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
