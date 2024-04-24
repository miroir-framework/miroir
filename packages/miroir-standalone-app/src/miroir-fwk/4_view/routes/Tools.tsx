import { Formik } from "formik";
import _ from "lodash";
import {
  DomainControllerInterface,
  JzodElement,
  JzodObject,
  LoggerInterface,
  MetaModel,
  MiroirConfigClient,
  MiroirConfigForRestClient,
  MiroirLoggerFactory,
  StoreUnitConfiguration,
  applicationDeploymentLibrary,
  applicationDeploymentMiroir,
  getLoggerName,
  resolveReferencesForJzodSchemaAndValueObject,
} from "miroir-core";
import { useCallback, useMemo } from "react";
import { packageName } from "../../../constants";
import {
  useDomainControllerService,
  useErrorLogService,
  useMiroirContextInnerFormOutput,
  useMiroirContextService,
  useMiroirContextformHelperState,
} from "../MiroirContextReactProvider";
import { useCurrentModel } from "../ReduxHooks";
import { JzodElementEditor } from "../components/JzodElementEditor";
import { cleanLevel } from "../constants";


const loggerName: string = getLoggerName(packageName, cleanLevel,"ToolsPage");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

const emptyString = ""
const dataSection = "data"
const emptyList:any[] = []
const emptyObject = {}

const pageLabel = "Tools";

const miroirConfig: MiroirConfigClient = {
  "client": {
    "emulateServer": false,
    "serverConfig":{
      "rootApiUrl":"http://localhost:3080",
      "dataflowConfiguration": {
        "type":"singleNode",
        "metaModel": {
          "location": {
            "side":"server",
            "type": "filesystem",
            "location":"C:/Users/nono/Documents/devhome/miroir-app-dev/packages/miroir-core/src/assets"
          }
        }
      },
      "storeSectionConfiguration": {
        [applicationDeploymentMiroir.uuid]:{
          "admin": {
            "emulatedServerType": "sql",
            "connectionString":"postgres://postgres:postgres@localhost:5432/postgres",
            "schema": "miroirAdmin"
          },
          "model": {
            "emulatedServerType": "sql",
            "connectionString":"postgres://postgres:postgres@localhost:5432/postgres",
            "schema": "miroir"
          },
          "data": {
            "emulatedServerType": "sql",
            "connectionString":"postgres://postgres:postgres@localhost:5432/postgres",
            "schema": "miroir"
          }
        },
        [applicationDeploymentLibrary.uuid]: {
          "admin": {
            "emulatedServerType": "sql",
            "connectionString":"postgres://postgres:postgres@localhost:5432/postgres",
            "schema": "miroirAdmin"
          },
          "model": {
            "emulatedServerType": "sql",
            "connectionString":"postgres://postgres:postgres@localhost:5432/postgres",
            "schema": "library"
          },
          "data": {
            "emulatedServerType": "sql",
            "connectionString":"postgres://postgres:postgres@localhost:5432/postgres",
            "schema": "library"
          }
        }
      }
    },
    // "deploymentMode":"monoUser",
    // "monoUserAutentification": false,
    // "monoUserVersionControl": false,
    // "versionControlForDataConceptLevel": false
  }
};
const defaultObject: JzodObject = {
  type: "object",
  definition: {}
} as JzodObject

const actionsJzodSchema: JzodObject = {
  type: "object",
  definition: {
    "applicationName": {
      type: "simpleType",
      definition: "string"
    }
  }    
}

const formJzodSchema:JzodObject = {
  type: "object",
  definition: {
    "applicationName": {
      type: "simpleType",
      definition: "string"
    },
    "configuration": {
      "type": "schemaReference",
      "definition": { "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739", "relativePath": "miroirConfigForRestClient"}
    },
  }
};
// miroirConfigForRestClient

const initialValues = {
  applicationName: "placeholder...",
  "configuration": miroirConfig.client
}


export const ToolsPage: React.FC<any> = (
  props: any
) => {
  const [dialogOuterFormObject, setdialogOuterFormObject] = useMiroirContextInnerFormOutput();
  const [formHelperState, setformHelperState] = useMiroirContextformHelperState();

  const errorLog = useErrorLogService();
  const context = useMiroirContextService();
  const domainController: DomainControllerInterface = useDomainControllerService();

  const miroirMetaModel: MetaModel = useCurrentModel(applicationDeploymentMiroir.uuid);

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
      if (context.miroirFundamentalJzodSchema.name == "dummyJzodSchema") {
        return defaultObject
      } else {
        const configuration = resolveReferencesForJzodSchemaAndValueObject(
          context.miroirFundamentalJzodSchema,
          {
            type: "object",
            definition: {
              "applicationName": {
                type: "simpleType",
                definition: "string"
              },
              "configuration": {
                "type": "schemaReference",
                "definition": { "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739", "relativePath": "miroirConfigForRestClient"}
              }
            }
          }
          ,
          initialValues
        )

        return configuration.status == "ok"? configuration.element : defaultObject;
      }
    },
    [context.miroirFundamentalJzodSchema]
  )
;

  log.info("resolvedJzodSchema", resolvedJzodSchema)
  // ##############################################################################################
  const onSubmit = useCallback(
    async (values: any, formikFunctions:{ setSubmitting:any, setErrors:any }) => {
      try {
        //  Send values somehow
        // if (props.onCreateFormObject) {
        //   log.info("onSubmit formik onCreateFormObject", values)
        //   await props.onCreateFormObject(values)
        //   await props.onSubmit(values);
        // } else {
        // log.info("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ onSubmit formik", values)
        setformHelperState(values);
        // setdialogOuterFormObject(values)
        // await handleAddObjectDialogFormSubmit(values,"param")
        // }

        // } as MiroirConfig;
        // create new Application
        // deploy new Application
        const submitMiroirConfig: MiroirConfigClient = {
          "client": {
            "emulateServer": false,
            "serverConfig":{
              "rootApiUrl":"http://localhost:3080",
              "dataflowConfiguration": {
                "type":"singleNode",
                "metaModel": {
                  "location": {
                    "side":"server",
                    "type": "filesystem",
                    "location":"C:/Users/nono/Documents/devhome/miroir-app-dev/packages/miroir-core/src/assets"
                  }
                }
              },
              "storeSectionConfiguration": {
                [applicationDeploymentMiroir.uuid]:{
                  "admin": {
                    "emulatedServerType": "sql",
                    "connectionString":"postgres://postgres:postgres@localhost:5432/postgres",
                    "schema": "miroirAdmin"
                  },
                  "model": {
                    "emulatedServerType": "sql",
                    "connectionString":"postgres://postgres:postgres@localhost:5432/postgres",
                    "schema": values.applicationName + "miroir"
                  },
                  "data": {
                    "emulatedServerType": "sql",
                    "connectionString":"postgres://postgres:postgres@localhost:5432/postgres",
                    "schema": values.applicationName + "miroir"
                  }
                },
                [applicationDeploymentLibrary.uuid]: {
                  "admin": {
                    "emulatedServerType": "sql",
                    "connectionString":"postgres://postgres:postgres@localhost:5432/postgres",
                    "schema": "miroirAdmin"
                  },
                  "model": {
                    "emulatedServerType": "sql",
                    "connectionString":"postgres://postgres:postgres@localhost:5432/postgres",
                    "schema": values.applicationName + "library"
                  },
                  "data": {
                    "emulatedServerType": "sql",
                    "connectionString":"postgres://postgres:postgres@localhost:5432/postgres",
                    "schema": values.applicationName + "library"
                  }
                }
              }
            },
            // "deploymentMode":"monoUser",
            // "monoUserAutentification": false,
            // "monoUserVersionControl": false,
            // "versionControlForDataConceptLevel": false
          }
        };
        
        log.info(
          "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ onSubmit formik values",
          values,
          "values.applicationName",
          values.applicationName,
          "submitMiroirConfig",
          submitMiroirConfig
        );
        await domainController.handleAction({
          actionType: "storeManagementAction",
          actionName: "openStore",
          endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
          configuration: (submitMiroirConfig.client as MiroirConfigForRestClient).serverConfig.storeSectionConfiguration,
          // {
          //   [applicationDeploymentMiroir.uuid]: (submitMiroirConfig.client as MiroirConfigForRestClient).serverConfig
          //     .storeSectionConfiguration[applicationDeploymentMiroir.uuid] as StoreUnitConfiguration,
          //   [applicationDeploymentLibrary.uuid]: (submitMiroirConfig.client as MiroirConfigForRestClient).serverConfig
          //     .storeSectionConfiguration[applicationDeploymentLibrary.uuid] as StoreUnitConfiguration,
          // },
          deploymentUuid: applicationDeploymentMiroir.uuid,
        });
  
        console.log("miroirBeforeAll: real server, sending remote storeManagementAction to server for test store creation")
        const createdApplicationLibraryStore = await domainController?.handleAction(
          {
            actionType: "storeManagementAction",
            actionName: "createStore",
            endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
            deploymentUuid: applicationDeploymentLibrary.uuid,
            configuration: (submitMiroirConfig.client as MiroirConfigForRestClient).serverConfig.storeSectionConfiguration[applicationDeploymentLibrary.uuid]
          }
        )
        if (createdApplicationLibraryStore?.status != "ok") {
          console.error('Error afterEach',JSON.stringify(createdApplicationLibraryStore, null, 2));
        }
  
        const createdMiroirStore = await domainController?.handleAction(
          {
            actionType: "storeManagementAction",
            actionName: "createStore",
            endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
            deploymentUuid: applicationDeploymentMiroir.uuid,
            configuration: (submitMiroirConfig.client as MiroirConfigForRestClient).serverConfig.storeSectionConfiguration[applicationDeploymentMiroir.uuid]
          }
        )
        if (createdMiroirStore?.status != "ok") {
          console.error('Error afterEach',JSON.stringify(createdMiroirStore, null, 2));
        }
  


      } catch (e) {
        log.error(e)
        //  Map and show the errors in your form
        // const [formErrors, unknownErrors] = mapErrorsFromRequest(e)
  
        // setErrors(formErrors)
        // this.setState({
        //   unknownErrors,
        // })
      } finally {
        formikFunctions.setSubmitting(false)
      }
    },
    []
  )
  return (
    <>
    <div>
      Hello World!
    </div>
    <Formik
          enableReinitialize={true}
          // initialValues={dialogOuterFormObject}
          initialValues={initialValues}
          onSubmit={
            onSubmit
            // async (values, { setSubmitting, setErrors }) => {
            //   try {
            //     //  Send values somehow
            //     // if (props.onCreateFormObject) {
            //     //   log.info("onSubmit formik onCreateFormObject", values)
            //     //   await props.onCreateFormObject(values)
            //     //   await props.onSubmit(values);
            //     // } else {
            //     log.info("onSubmit formik handleAddObjectDialogFormSubmit", values)
            //     setformHelperState(values);
            //     // setdialogOuterFormObject(values)
            //     // await handleAddObjectDialogFormSubmit(values,"param")
            //     // }
            //   } catch (e) {
            //     log.error(e)
            //     //  Map and show the errors in your form
            //     // const [formErrors, unknownErrors] = mapErrorsFromRequest(e)
          
            //     // setErrors(formErrors)
            //     // this.setState({
            //     //   unknownErrors,
            //     // })
            //   } finally {
            //     setSubmitting(false)
            //   }
            // }
          }
          // handleChange= {
          //   async (e: ChangeEvent<any>) => {
          //     log.info("onChange formik", e);
          //     // try {
          //     //   //  Send values somehow
          //     //   if (props.onCreateFormObject) {
          //     //     await props.onCreateFormObject(values)
          //     //     await props.onSubmit(values);
          //     //   } else {
          //     //     await handleAddObjectDialogFormSubmit(values)
          //     //   }
          //     // } catch (e) {
          //     //   log.error(e)
          //     //   //  Map and show the errors in your form
          //     //   // const [formErrors, unknownErrors] = mapErrorsFromRequest(e)
          
          //     //   // setErrors(formErrors)
          //     //   // this.setState({
          //     //   //   unknownErrors,
          //     //   // })
          //     // } finally {
          //     //   setSubmitting(false)
          //     // }
          //   }

          // }
        >
        {
          (
            formik
          ) => (
            <>
              <span>Tools</span>
              <form
                id={"form." + pageLabel}
                // onSubmit={handleSubmit(handleAddObjectDialogFormSubmit)}
                onSubmit={formik.handleSubmit}
              >
                {/* {
                  // props.defaultFormValuesObject?
                  dialogOuterFormObject?
                  <CodeMirror value={JSON.stringify(dialogOuterFormObject, null, 2)} height="200px" extensions={[javascript({ jsx: true })]} onChange={onCodeEditorChange} />
                  :<></>
                } */}
                {
                  resolvedJzodSchema === defaultObject?
                  <div>no object definition found!</div>
                  :
                  <>
                    <JzodElementEditor
                      name={'ROOT'}
                      listKey={'ROOT'}
                      rootLesslistKey={emptyString}
                      rootLesslistKeyArray={emptyList}
                      label={pageLabel}
                      currentDeploymentUuid={emptyString}
                      currentApplicationSection={dataSection}
                      // resolvedJzodSchema={actionsJzodSchema}
                      resolvedJzodSchema={resolvedJzodSchema}
                      foreignKeyObjects={emptyObject}
                      formik={formik}
                    />
                    <button type="submit" name={pageLabel} form={"form." + pageLabel}>submit form.{pageLabel}</button>
                  </>
                }
              </form>
            </>
          )
        }
        </Formik>
    </>
  )
}