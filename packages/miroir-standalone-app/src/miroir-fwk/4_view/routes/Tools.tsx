import { Formik } from "formik";
import _ from "lodash";
import {
  Application,
  DomainControllerInterface,
  EntityInstance,
  InstanceAction,
  JzodElement,
  JzodObject,
  LoggerInterface,
  Menu,
  MiroirConfigClient,
  MiroirConfigForRestClient,
  MiroirLoggerFactory,
  StoreUnitConfiguration,
  adminConfigurationDeploymentAdmin,
  adminConfigurationDeploymentLibrary,
  adminConfigurationDeploymentMiroir,
  entityApplication,
  entityApplicationForAdmin,
  entityDeployment,
  entityMenu,
  getLoggerName,
  resetAndInitMiroirAndApplicationDatabase,
  resolveReferencesForJzodSchemaAndValueObject
} from "miroir-core";
import { useCallback, useMemo } from "react";
import { v4 as uuidv4 } from 'uuid';
import { packageName } from "../../../constants";
import {
  useDomainControllerService,
  useErrorLogService,
  useMiroirContextInnerFormOutput,
  useMiroirContextService,
  useMiroirContextformHelperState,
} from "../MiroirContextReactProvider";
import { JzodElementEditor } from "../components/JzodElementEditor";
import { cleanLevel } from "../constants";
import { adminConfigurationDeploymentParis, applicationParis } from './ReportPage';


const loggerName: string = getLoggerName(packageName, cleanLevel,"ToolsPage");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

export const emptyString = ""
export const dataSection = "data"
export const emptyList:any[] = []
export const emptyObject = {}

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
        [adminConfigurationDeploymentMiroir.uuid]:{
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
        [adminConfigurationDeploymentLibrary.uuid]: {
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
  selfApplicationUuid: uuidv4(),
  deploymentUuid: uuidv4(),
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

  // const miroirMetaModel: MetaModel = useCurrentModel(adminConfigurationDeploymentMiroir.uuid);

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
              "selfApplicationUuid": {
                type: "simpleType",
                definition: "string"
              },
              "deploymentUuid": {
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
    async (values: any /* actually follows formJzodSchema */, formikFunctions:{ setSubmitting:any, setErrors:any }) => {
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
        const newApplicationName = values.applicationName;
        const newAdminAppApplicationUuid = applicationParis.uuid;//uuidv4();
        const newSelfApplicationUuid = applicationParis.selfApplication; //uuidv4()
        const newDeploymentUuid = adminConfigurationDeploymentParis.uuid; //values.deploymentUuid
        const newDeploymentStoreConfiguration: StoreUnitConfiguration = {
          "admin": {
            "emulatedServerType": "sql",
            "connectionString":"postgres://postgres:postgres@localhost:5432/postgres",
            "schema": "miroirAdmin"
          },
          "model": {
            "emulatedServerType": "sql",
            "connectionString":"postgres://postgres:postgres@localhost:5432/postgres",
            "schema": newApplicationName + "Model"
          },
          "data": {
            "emulatedServerType": "sql",
            "connectionString":"postgres://postgres:postgres@localhost:5432/postgres",
            "schema": newApplicationName + "Data"
          }
        }
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
                [newDeploymentUuid]: newDeploymentStoreConfiguration,
              }
            },
          }
        };
        
        log.info(
          "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ onSubmit formik values",
          values,
          "newApplicationName",
          newApplicationName,
          "submitMiroirConfig",
          submitMiroirConfig
        );
        await domainController.handleAction({
          actionType: "storeManagementAction",
          actionName: "openStore",
          endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
          configuration: (submitMiroirConfig.client as MiroirConfigForRestClient).serverConfig.storeSectionConfiguration,
          deploymentUuid: newDeploymentUuid,
        });
  
        log.info("store opened with uuid", newDeploymentUuid)
        const createdApplicationStore = await domainController?.handleAction(
          {
            actionType: "storeManagementAction",
            actionName: "createStore",
            endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
            deploymentUuid: newDeploymentUuid,
            configuration: (submitMiroirConfig.client as MiroirConfigForRestClient).serverConfig.storeSectionConfiguration[newDeploymentUuid]
          }
        )
        if (createdApplicationStore?.status != "ok") {
          log.error('Error afterEach',JSON.stringify(createdApplicationStore, null, 2));
        }

        log.info("application store created with uuid", newDeploymentUuid)

        const newApplicationForAdmin: Application = {
          "uuid": newAdminAppApplicationUuid,
          "parentName": entityApplicationForAdmin.name,
          "parentUuid": entityApplicationForAdmin.uuid,
          "name": newApplicationName,
          "defaultLabel": `The ${newApplicationName} application.`,
          "description": `This application contains the ${newApplicationName} model and data`,
          "selfApplication": newSelfApplicationUuid,
        }

        const newSelfApplication: Application = {
          "uuid": newSelfApplicationUuid,
          "parentName": "Application",
          "parentUuid": "a659d350-dd97-4da9-91de-524fa01745dc",
          "name": newApplicationName,
          "defaultLabel": `The ${newApplicationName} application.`,
          "description": `This application contains the ${newApplicationName} model and data`,
          "selfApplication": newSelfApplicationUuid,
        }

        const newDeployment = {
          parentName:entityDeployment.name,
          parentUuid:entityDeployment.uuid,
          uuid: newDeploymentUuid,
          "name": newApplicationName + "ApplicationSqlDeployment",
          "defaultLabel": newApplicationName + "ApplicationSqlDeployment",
          "application": newApplicationForAdmin.uuid,
          "description": "The default Sql Deployment for Application " + newApplicationName,
          "configuration": newDeploymentStoreConfiguration
        } as EntityInstance

        // create storage structures for Miroir metamodel Entities in new application deployment
        await resetAndInitMiroirAndApplicationDatabase(domainController, [ newDeployment ])

        log.info("application store initialized, deployment uuid", newDeploymentUuid)

        // create self Application in new Application model
        // TODO: do it in a transaction??
        const createSelfApplicationAction: InstanceAction = {
          actionType: 'instanceAction',
          actionName: "createInstance",
          applicationSection: "model",
          deploymentUuid: newDeploymentUuid,
          endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
          objects:[
            {
              parentName:entityApplication.name,
              parentUuid:entityApplication.uuid,
              applicationSection:'model',
              instances: [ newSelfApplication ],
            }
          ]
        };

        await domainController.handleAction(createSelfApplicationAction);

        log.info("application self Application instance created for deployment uuid", newDeploymentUuid, createSelfApplicationAction)

        // create new Application default Menu
        const newApplicationMenu: Menu = {
          "uuid": "84c178cc-1b1b-497a-a035-9b3d756bb085",
          "parentName": "Menu",
          "parentUuid": "dde4c883-ae6d-47c3-b6df-26bc6e3c1842",
          "name": newApplicationName + "Menu",
          "defaultLabel": "Meta-Model",
          "description": `This is the default menu allowing to explore the ${newApplicationName} Application.`,
          "definition": {
            "menuType": "complexMenu",
            "definition": [
              {
                "title": newApplicationName,
                "label": newApplicationName,
                "items": [
                  {
                    "label": newApplicationName + " Entities",
                    "section": "model",
                    "application": newDeploymentUuid,
                    "reportUuid": "c9ea3359-690c-4620-9603-b5b402e4a2b9",
                    "icon": "category"
                  },
                  {
                    "label": newApplicationName + " Entity Definitions",
                    "section": "model",
                    "application": newDeploymentUuid,
                    "reportUuid": "f9aff35d-8636-4519-8361-c7648e0ddc68",
                    "icon": "category"
                  },
                  {
                    "label": newApplicationName + " Reports",
                    "section": "model",
                    "application": newDeploymentUuid,
                    "reportUuid": "1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855",
                    "icon": "list"
                  }
                ]
              }
            ]
          }
        }
        // TODO: do it in a transaction??
        const createNewApplicationMenuAction: InstanceAction = {
          actionType: 'instanceAction',
          actionName: "createInstance",
          applicationSection: "model",
          deploymentUuid: newDeploymentUuid,
          endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
          objects:[
            {
              parentName:entityMenu.name,
              parentUuid:entityMenu.uuid,
              applicationSection:'model',
              instances: [ newApplicationMenu ],
            }
          ]
        };

        await domainController.handleAction(createNewApplicationMenuAction);
                
        // #################### ADMIN
        // create application in Admin application deployment
        const createApplicationForAdminAction: InstanceAction = {
          actionType: 'instanceAction',
          actionName: "createInstance",
          applicationSection: "data",
          deploymentUuid: adminConfigurationDeploymentAdmin.uuid,
          endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
          objects:[
            {
              parentName:entityApplicationForAdmin.name,
              parentUuid:entityApplicationForAdmin.uuid,
              applicationSection:'data',
              instances: [ newApplicationForAdmin ],
            }
          ]
        };

        await domainController.handleAction(createApplicationForAdminAction);

        log.info("Application instance created in Admin data for deployment uuid", newDeploymentUuid, createApplicationForAdminAction)


        // add Deployment to Admin application deployment
        const createAdminDeploymentAction: InstanceAction = {
          actionType: 'instanceAction',
          actionName: "createInstance",
          applicationSection: "data",
          deploymentUuid: adminConfigurationDeploymentAdmin.uuid,
          endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
          objects:[
            {
              parentName:entityDeployment.name,
              parentUuid:entityDeployment.uuid,
              applicationSection:'data',
              instances: [ newDeployment ],
            }
          ]
        };
        await domainController.handleAction(createAdminDeploymentAction);

        log.info("created Deployment instance in Admin App deployment", createAdminDeploymentAction)

        // const createdMiroirStore = await domainController?.handleAction(
        //   {
        //     actionType: "storeManagementAction",
        //     actionName: "createStore",
        //     endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
        //     deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
        //     configuration: (submitMiroirConfig.client as MiroirConfigForRestClient).serverConfig.storeSectionConfiguration[adminConfigurationDeploymentMiroir.uuid]
        //   }
        // )
        // if (createdMiroirStore?.status != "ok") {
        //   console.error('Error afterEach',JSON.stringify(createdMiroirStore, null, 2));
        // }
  


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