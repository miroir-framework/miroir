import { Formik } from "formik";
import _ from "lodash";
// import { ReactCodeMirror } from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import ReactCodeMirror from "@uiw/react-codemirror";
import { ChangeEvent, useCallback, useMemo, useState } from "react";

// const MyReactCodeMirror: React.Component = ReactCodeMirror
const MyReactCodeMirror: any = ReactCodeMirror // TODO: solve the mystery: it was once well-typed, now the linter raises an error upon direct (default-typed) use!

import {
  ApplicationSection,
  DomainAction,
  DomainControllerInterface,
  JzodElement,
  JzodObject,
  LoggerInterface,
  MetaModel,
  MiroirConfigClient,
  MiroirLoggerFactory,
  StoreUnitConfiguration,
  TestCompositeActionParams,
  TestSuiteContext,
  adminConfigurationDeploymentAdmin,
  adminConfigurationDeploymentMiroir,
  displayTestSuiteResultsDetails,
  entityApplicationForAdmin,
  entityDeployment,
  entityMenu,
  entitySelfApplication,
  jzodTypeCheck,
  miroirFundamentalJzodSchema,
  testSuitesResultsSchema
} from "miroir-core";

import {
  Entity,
  TestSuiteResult
} from "miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { adminConfigurationDeploymentParis, applicationParis, packageName } from "../../../constants.js";
import { getTestSuitesForBuildPlusRuntimeCompositeAction } from "../../4-tests/applicative.Library.BuildPlusRuntimeCompositeAction.js";
import { expect } from "../../4-tests/test-expect.js";
import { testOnLibrary_deleteLibraryDeployment } from "../../4-tests/tests-utils-testOnLibrary.js";
import { runTestOrTestSuite } from "../../4-tests/tests-utils.js";
import { JzodEnumSchemaToJzodElementResolver, getCurrentEnumJzodSchemaResolver } from "../../JzodTools.js";
import {
  useDomainControllerService,
  useErrorLogService,
  useMiroirContextInnerFormOutput,
  useMiroirContextService,
  useMiroirContextformHelperState,
} from "../MiroirContextReactProvider.js";
import { useCurrentModel } from "../ReduxHooks.js";
import { JzodElementDisplay } from "../components/JzodElementDisplay.js";
import { JzodElementEditor } from "../components/JzodElementEditor.js";
import { cleanLevel } from "../constants.js";


let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "ToolsPage")
).then((logger: LoggerInterface) => {log = logger});


export const emptyString = ""
export const dataSection = "data"
export const emptyList:any[] = []
export const emptyObject = {}

const pageLabel = "Tools";

export const defaultObject: JzodObject = {
  type: "object",
  definition: {}
} as JzodObject

// const actionsJzodSchema: JzodObject = {
//   type: "object",
//   definition: {
//     "applicationName": {
//       type: "string"
//     }
//   }    
// }

// const formJzodSchema:JzodObject = {
//   type: "object",
//   definition: {
//     "applicationName": {
//       type: "string"
//     },
//     // "configuration": {
//     //   "type": "schemaReference",
//     //   "definition": { "absolutePath": miroirFundamentalJzodSchemaUuid, "relativePath": "miroirConfigForRestClient"}
//     // },
//   }
// };
// // miroirConfigForRestClient


const initialValues = {
  newApplicationName: "placeholder...",
  newAdminAppApplicationUuid: applicationParis.uuid,
  newSelfApplicationUuid: applicationParis.selfApplication,
  newDeploymentUuid: adminConfigurationDeploymentParis.uuid,
}

export interface MiroirForm {
  formSchema: JzodElement,
  formAction: DomainAction,
}


// ################################################################################################
// ################################################################################################
// ################################################################################################
let count = 0;
export const ToolsPage: React.FC<any> = (
  props: any // TODO: give a type to props!!!
) => {
  count++;
  const [dialogOuterFormObject, setdialogOuterFormObject] = useMiroirContextInnerFormOutput();
  const [formHelperState, setformHelperState] = useMiroirContextformHelperState();

  const errorLog = useErrorLogService();
  const context = useMiroirContextService();
  const domainController: DomainControllerInterface = useDomainControllerService();
  const currentModel: MetaModel = useCurrentModel(
    context.applicationSection == "data" ? context.deploymentUuid : adminConfigurationDeploymentMiroir.uuid
  );
  const currentMiroirModel = useCurrentModel(adminConfigurationDeploymentMiroir.uuid);
  const currentReportDeploymentSectionEntities: Entity[] = currentModel.entities; // Entities are always defined in the 'model' section

  const [formState,setFormState] = useState<{[k:string]:any}>(initialValues)
  const [testResults, setTestResults] = useState<TestSuiteResult | undefined>(
    undefined
  );

  // const miroirMetaModel: MetaModel = useCurrentModel(adminConfigurationDeploymentMiroir.uuid);

  // DOES NOTHING
  const actionHandlerCreateApplication = useMemo(()=> ({
    interface: {
      actionJzodObjectSchema: {
        type: "object",
        definition: {
          newApplicationName: {
            type: "string"
          },
          newAdminAppApplicationUuid: {
            type: "uuid"
          },
          newSelfApplicationUuid: {
            type: "uuid"
          },
          newDeploymentUuid: {
            type: "uuid"
          },
        }
      },
    },
    implementation: {
      templates: {
      },
      compositeActionTemplate: {
        actionType: "compositeAction",
        actionName: "sequence",
        definition: [
          // {
          //   actionType: "action",
          //   action: {
          //     actionType: "storeManagementAction",
          //     actionName: "storeManagementAction_openStore",
          //     endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
          //     configuration: {
          //       transformerType: "innerFullObjectTemplate",
          //       definition: [
          //         {
          //           attributeKey: {
          //             transformerType: "parameterReference",
          //             referenceName: "newDeploymentUuid",
          //           },
          //           attributeValue: {
          //             transformerType: "parameterReference",
          //             referenceName: "newDeploymentStoreConfiguration",
          //           }
          //         }
          //       ],
          //     },
          //     deploymentUuid: {
          //       transformerType: "parameterReference",
          //       referenceName: "newDeploymentUuid",
          //     },
          //   }
          // },
          // {
          //   actionType: "action",
          //   action: {
          //     transformerType: "parameterReference",
          //     referenceName: "createStoreAction",
          //   }
          // },
          // {
          //   actionType: "action",
          //   action: {
          //     transformerType: "parameterReference",
          //     referenceName: "resetAndInitAction",
          //   }
          // },
          // {
          //   actionType: "action",
          //   action: {
          //     transformerType: "parameterReference",
          //     referenceName: "createSelfApplicationAction",
          //   }
          // },
          // {
          //   actionType: "action",
          //   action: {
          //     transformerType: "parameterReference",
          //     referenceName: "createApplicationForAdminAction",
          //   }
          // },
          // {
          //   actionType: "action",
          //   action: {
          //     transformerType: "parameterReference",
          //     referenceName: "createAdminDeploymentAction",
          //   }
          // },
          // {
          //   actionType: "action",
          //   action: {
          //     transformerType: "parameterReference",
          //     referenceName: "createNewApplicationMenuAction",
          //   }
          // },
          // {
          //   actionType: "action",
          //   action: {
          //     transformerType: "parameterReference",
          //     referenceName: "commitAction",
          //   }
          // },
        ],
      }
    },
  }),[])

  const [rawSchema, setRawSchema] = useState<JzodElement>(
    actionHandlerCreateApplication.interface.actionJzodObjectSchema as JzodElement
  );


  const handleAddObjectDialogFormSubmit = useCallback(
    async (data:any, source?: string) => {
      // const buttonType: string = (event?.nativeEvent as any)["submitter"]["name"];
      log.info(
        "@@@@@@@@@@@@@@@@@@@@@@ handleAddObjectDialogFormSubmit called for data",
        data,
        "props",
        props,
        "dialogOuterFormObject",
        dialogOuterFormObject,
      );
      const effectiveData = source == "param" && data?data:dialogOuterFormObject;
      log.info("handleAddObjectDialogFormSubmit called with dialogOuterFormObject", dialogOuterFormObject);

      let reorderedDataValue: any;
      let result: any;
      const newVersion = _.merge(effectiveData, effectiveData["ROOT"]);
      delete newVersion["ROOT"];
      log.info(
        // "handleAddObjectDialogFormSubmit called for buttonType",
        // buttonType,
        "handleAddObjectDialogFormSubmit producing",
        "newVersion",
        newVersion,
        "data",
        data,
        "props",
        props,
        "passed value",
      );
      result = props.onSubmit(newVersion);
      return result;
    },
    [props,JSON.stringify(dialogOuterFormObject, null, 2)]
  );

  const resolvedJzodSchema:JzodElement = useMemo(
    () => {
      if (context.miroirFundamentalJzodSchema == undefined || context.miroirFundamentalJzodSchema.name == "dummyJzodSchema") {
        return defaultObject
      } else {
        const configuration = jzodTypeCheck(
          rawSchema,
          formState,
          [], // currentValuePath
          [], // currentTypePath
          context.miroirFundamentalJzodSchema,
          currentModel,
          currentMiroirModel,
          emptyObject,
        )

        return configuration.status == "ok"? configuration.resolvedSchema : defaultObject;
      }
    },
    [context, rawSchema, formState]
  );

  log.info(
    "called jzodTypeCheck: resolvedJzodSchema",
    resolvedJzodSchema,
    "miroirFundamentalJzodSchema",
    context.miroirFundamentalJzodSchema,
    // context.miroirFundamentalJzodSchema.name,
    "rawSchema",
    rawSchema
  );

  const resolvedTestResultsJzodSchema: JzodElement | undefined = useMemo(() => {
    if (
      testResults &&
      context.miroirFundamentalJzodSchema != undefined &&
      (testSuitesResultsSchema != undefined && testSuitesResultsSchema.context != undefined)
    ) {
      const configuration = jzodTypeCheck(
        (context.miroirFundamentalJzodSchema.definition as any).context.testsResults,
        testResults["applicative.Library.BuildPlusRuntimeCompositeAction.integ.test"],
        [], // currentValuePath
        [], // currentTypePath
        context.miroirFundamentalJzodSchema,
        currentModel,
        currentMiroirModel,
        emptyObject
      );

      return configuration.status == "ok" ? configuration.resolvedSchema : defaultObject;
    }
  }, [context.miroirFundamentalJzodSchema, rawSchema, testResults]);

  log.info(
    "called jzodTypeCheck: resolvedTestResultsJzodSchema",
    resolvedTestResultsJzodSchema,
    context.miroirFundamentalJzodSchema,
    "rawSchema",
    rawSchema
  );

  const currentEnumJzodSchemaResolver: JzodEnumSchemaToJzodElementResolver | undefined = useMemo(
    () =>
      context.miroirFundamentalJzodSchema
        ? getCurrentEnumJzodSchemaResolver(currentMiroirModel, context.miroirFundamentalJzodSchema)
        : undefined,
    [context.miroirFundamentalJzodSchema, currentMiroirModel]
  );
  

  // ##############################################################################################
  const onSubmit = useCallback(
    async (
      actionCreateSchemaParamValues: any /* actually follows formJzodSchema */,
      formikFunctions: { setSubmitting: any; setErrors: any }
    ) => {
      try {
        //  Send values somehow
        setformHelperState(actionCreateSchemaParamValues);

        log.info(
          "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ Tools.tsx onSubmit formik values",
          actionCreateSchemaParamValues,
          "newApplicationName",
          actionCreateSchemaParamValues.newApplicationName,
          "newDeploymentUuid",
          actionCreateSchemaParamValues.newDeploymentUuid,
          "newSelfApplicationUuid",
          actionCreateSchemaParamValues.newSelfApplicationUuid,
          "newAdminAppApplicationUuid",
          actionCreateSchemaParamValues.newAdminAppApplicationUuid
        );
        
        const paramsForTemplates = {
          ...actionCreateSchemaParamValues,
          entityApplicationForAdmin,
          entitySelfApplication,
          adminConfigurationDeploymentAdmin,
          entityMenu,
          entityDeployment,
        };
        log.info(
          "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ Tools.tsx onSubmit formik values actionCreateSchemaParamValues",
          actionCreateSchemaParamValues,
          "paramsForTemplates",
          paramsForTemplates
        );

          const testStoreUnitConfiguration: StoreUnitConfiguration = {
            admin: {
              emulatedServerType: "filesystem",
              directory: "./tests/tmp/miroir_admin",
            },
            model: {
              emulatedServerType: "filesystem",
              directory: "./tests/tmp/miroir_model",
            },
            data: {
              emulatedServerType: "filesystem",
              directory: "./tests/tmp/miroir_data",
            },
          };

          const testMiroirConfig: MiroirConfigClient = {
            miroirConfigType: "client",
            client: {
              emulateServer: true,
              rootApiUrl: "http://localhost:3080",
              deploymentStorageConfig: {
                "10ff36f2-50a3-48d8-b80f-e48e5d13af8e": {
                  admin: {
                    emulatedServerType: "sql",
                    connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
                    schema: "miroirAdmin",
                  },
                  model: {
                    emulatedServerType: "sql",
                    connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
                    schema: "miroir",
                  },
                  data: {
                    emulatedServerType: "sql",
                    connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
                    schema: "miroir",
                  },
                },
                "f714bb2f-a12d-4e71-a03b-74dcedea6eb4": {
                  admin: {
                    emulatedServerType: "sql",
                    connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
                    schema: "miroirAdmin",
                  },
                  model: {
                    emulatedServerType: "sql",
                    connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
                    schema: "library",
                  },
                  data: {
                    emulatedServerType: "sql",
                    connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
                    schema: "library",
                  },
                },
              },
              // deploymentMode: "monoUser",
              // monoUserAutentification: false,
              // monoUserVersionControl: false,
              // versionControlForDataConceptLevel: false,
            },
          };

        const {
          testSuitesForBuildPlusRuntimeCompositeAction,
          testDeploymentStorageConfiguration,
          testDeploymentUuid,
        }: Record<string, any> = getTestSuitesForBuildPlusRuntimeCompositeAction(testMiroirConfig);

        for (const [currentTestSuiteName, testSuite] of Object.entries(
          testSuitesForBuildPlusRuntimeCompositeAction as Record<string, TestCompositeActionParams>
        )) {
          const testSuiteResults = await runTestOrTestSuite(
            // localCache,
            domainController,
            testSuite,
            (testSuite as any)["testParams"]
          );
          log.info(
            "testSuiteResults",
            currentTestSuiteName,
            testSuiteResults,
            "testSuite",
            testSuite
          );
          if (!testSuiteResults || testSuiteResults.status !== "ok") {
            expect(testSuiteResults?.status, `${currentTestSuiteName} failed!`).toBe("ok");
          }
        }

        // const deleteNewApplicationResult = await domainController.handleCompositeActionTemplate(
        const deleteNewApplicationResult = await domainController.handleCompositeAction(
          testOnLibrary_deleteLibraryDeployment({
          miroirConfigType: "client",
          client: {
            emulateServer: true,
            rootApiUrl: "http://localhost:3080",
            deploymentStorageConfig: {
              [actionCreateSchemaParamValues.newDeploymentUuid]:testDeploymentStorageConfiguration
              },
            }}, actionCreateSchemaParamValues.newDeploymentUuid),
          paramsForTemplates,
          currentModel
        );

        log.info(
          "store deleted with uuid",
          actionCreateSchemaParamValues.newDeploymentUuid,
          JSON.stringify(deleteNewApplicationResult, null, 2)
        );
        // not needed in the GUI, the admin and miroir models stay there.
        // await deleteAndCloseApplicationDeployments(
        //   miroirConfig,
        //   domainController,
        //   [
        //     typedAdminConfigurationDeploymentMiroir
        //   ],
        // );
    
        const globalTestSuiteResults = TestSuiteContext.getTestSuiteResult(
          Object.keys(testSuitesForBuildPlusRuntimeCompositeAction)[0]
        );
        setTestResults(globalTestSuiteResults);
        log.info("testResults", globalTestSuiteResults);

        displayTestSuiteResultsDetails(expect,Object.keys(testSuitesForBuildPlusRuntimeCompositeAction)[0]);


        // log.info("created Deployment instance in Admin App deployment");
      } catch (e) {
        log.error(e);
        //  Map and show the errors in your form
        // const [formErrors, unknownErrors] = mapErrorsFromRequest(e)

        // setErrors(formErrors)
        // this.setState({
        //   unknownErrors,
        // })
      } finally {
        formikFunctions.setSubmitting(false);
      }
    },
    []
  ); // end onSubmit()

  // ##############################################################################################
  const onCodeEditorChange = useCallback((values:any, viewUpdate:any) => {
    log.info('edit code received value:', values);
    setRawSchema(JSON.parse(values))
    log.info('edit code done');
  }, []);

  log.info(
    "Tools.tsx render",
    currentEnumJzodSchemaResolver,
    "testResults",
    testResults,
    "testSuitesResultsSchema",
    testSuitesResultsSchema,
    "testSuitesResultsSchema.context",
    testSuitesResultsSchema.context,
    "resolvedTestResultsJzodSchema",
    resolvedTestResultsJzodSchema,
    // (resolvedTestResultsJzodSchema as any)?.element,
  );
  return (
    <>
      <div>Hello World!</div>
      {/* test results */}
      <div>
        {currentEnumJzodSchemaResolver != undefined &&
        testResults &&
        testSuitesResultsSchema != undefined &&
        testSuitesResultsSchema.context != undefined &&
        resolvedTestResultsJzodSchema != undefined ? (
          <div>
            <div>Test results:</div>
            <pre>
            {testResults["applicative.Library.BuildPlusRuntimeCompositeAction.integ.test"] &&
              JSON.stringify(
                testResults["applicative.Library.BuildPlusRuntimeCompositeAction.integ.test"],
                null,
                2
              )}

            </pre>
            {/* <JzodElementDisplay
              path={"applicative.Library.BuildPlusRuntimeCompositeAction.integ.test"}
              name={"applicative.Library.BuildPlusRuntimeCompositeAction.integ.test"}
              deploymentUuid={props.deploymentUuid}
              // prop drilling!
              applicationSection={context.applicationSection as ApplicationSection}
              entityUuid={props.entityUuid}
              element={testResults["applicative.Library.BuildPlusRuntimeCompositeAction.integ.test"]}
              elementJzodSchema={testSuitesResultsSchema.context.innerTestSuitesResults}
              resolvedElementJzodSchema={resolvedTestResultsJzodSchema}
              currentReportDeploymentSectionEntities={currentReportDeploymentSectionEntities}
              currentEnumJzodSchemaResolver={currentEnumJzodSchemaResolver}
            ></JzodElementDisplay> */}
          </div>
        ) : (
          <div>could not display test results!</div>
        )}
      </div>
      {/* <div>
        {
          dialogOuterFormObject ? (
            <MyReactCodeMirror
              value={JSON.stringify(rawSchema, null, 2)}
              height="400px"
              extensions={[javascript({ jsx: true })]}
              onChange={onCodeEditorChange}
            />
          ) : (
            <></>
          )
        }
      </div> */}
      <div>
        <Formik
          enableReinitialize={true}
          initialValues={formState}
          onSubmit={onSubmit}
          handleChange={async (e: ChangeEvent<any>): Promise<void> => {
            log.info("onChange formik", e);
          }}
        >
          {(formik) => (
            <>
              <form id={"form." + pageLabel} onSubmit={formik.handleSubmit}>
                {resolvedJzodSchema === defaultObject ? (
                  <div>no object definition found!</div>
                ) : (
                  <>
                    <JzodElementEditor
                      name={"ROOT"}
                      listKey={"ROOT"}
                      rootLessListKey={emptyString}
                      rootLessListKeyArray={emptyList}
                      labelElement={<>{pageLabel}</>}
                      currentDeploymentUuid={emptyString}
                      currentApplicationSection={dataSection}
                      rawJzodSchema={rawSchema}
                      resolvedElementJzodSchema={resolvedJzodSchema}
                      localRootLessListKeyMap={{}}
                      foreignKeyObjects={emptyObject}
                      indentLevel={0}
                      // handleChange={formik.handleChange as any}
                      // formik={formik}
                      // setFormState={setFormState}
                      // formState={formState}
                    />
                    <button type="submit" name={pageLabel} form={"form." + pageLabel}>
                      submit form.{pageLabel}
                    </button>
                  </>
                )}
              </form>
            </>
          )}
        </Formik>
      </div>
    </>
  );
}