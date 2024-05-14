import { v4 as uuidv4 } from 'uuid';
import { Formik } from "formik";
import _ from "lodash";
import {
  Application,
  DomainAction,
  DomainControllerInterface,
  DomainElement,
  EntityInstance,
  InstanceAction,
  JzodElement,
  JzodObject,
  JzodReference,
  LoggerInterface,
  Menu,
  MiroirConfigClient,
  MiroirConfigForRestClient,
  MiroirLoggerFactory,
  ObjectTemplate,
  QueryObjectReference,
  StoreUnitConfiguration,
  adminConfigurationDeploymentAdmin,
  adminConfigurationDeploymentLibrary,
  adminConfigurationDeploymentMiroir,
  entityApplication,
  entityApplicationForAdmin,
  entityDeployment,
  entityMenu,
  getLoggerName,
  objectTemplateToObject,
  resetAndInitMiroirAndApplicationDatabase,
  resolveReferencesForJzodSchemaAndValueObject,
  runActionTemplate
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
import { JzodElementEditor } from "../components/JzodElementEditor";
import { cleanLevel } from "../constants";
import { adminConfigurationDeploymentParis, applicationParis } from './ReportPage';
import { Deployment } from 'miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType';


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

// export interface ActionObjectReference extends QueryObjectReference {

// }


  
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
        setformHelperState(values);

        // create new Application
        // deploy new Application
        const newApplicationName = values.applicationName;
        const newAdminAppApplicationUuid = applicationParis.uuid;//uuidv4();
        const newSelfApplicationUuid = applicationParis.selfApplication; //uuidv4()
        const newDeploymentUuid = adminConfigurationDeploymentParis.uuid; //values.deploymentUuid
        const newDeploymentStoreConfigurationTemplate = {
          "admin": {
            "emulatedServerType": "sql",
            "connectionString":"postgres://postgres:postgres@localhost:5432/postgres",
            "schema": "miroirAdmin"
          },
          "model": {
            "emulatedServerType": "sql",
            "connectionString":"postgres://postgres:postgres@localhost:5432/postgres",
            "schema": {
              templateType: "parameterReference",
              referenceName: "newApplicationName",
              applyFunction: (a:string) => (a + "Model")
            }
          },
          "data": {
            "emulatedServerType": "sql",
            "connectionString":"postgres://postgres:postgres@localhost:5432/postgres",
            "schema": {
              templateType: "parameterReference",
              referenceName: "newApplicationName",
              applyFunction: (a:string) => (a + "Data")
            }
            // "schema": newApplicationName + "Data"
          }
        }

        const newDeploymentStoreConfiguration: StoreUnitConfiguration = objectTemplateToObject(
          "ROOT",
          newDeploymentStoreConfigurationTemplate as any,
          {newApplicationName},
          undefined
        );
        log.info("newDeploymentStoreConfiguration", newDeploymentStoreConfiguration)
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
        
        const actionParams = {
          adminConfigurationDeploymentAdmin,
          newApplicationName,
          newAdminAppApplicationUuid,
          newSelfApplicationUuid,
          newDeploymentUuid,
          newDeploymentStoreConfiguration,
          submitMiroirConfig,
          entityApplication,
          entityApplicationForAdmin,
          entityDeployment,
          entityMenu,
        }


        log.info(
          "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ onSubmit formik values",
          values,
          "newApplicationName",
          newApplicationName,
          "submitMiroirConfig",
          submitMiroirConfig
        );

        const openStoreAction: DomainAction = objectTemplateToObject(
          "ROOT",
          {
            actionType: "storeManagementAction",
            actionName: "openStore",
            endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
            configuration: {
              templateType: "fullObjectTemplate",
              definition: [
                [
                  {
                    templateType: "parameterReference",
                    referenceName: "newDeploymentUuid"
                  },
                  newDeploymentStoreConfigurationTemplate,
                ]
              ]
            },
            deploymentUuid: {
              templateType: "parameterReference",
              referenceName: "newDeploymentUuid"
            }
          } as any,
          actionParams,
          undefined
        );


        // ########################################################################################
        // await domainController.handleAction(openStoreAction); // put into sequence!!!
        // ########################################################################################

        // await runActionTemplate(domainController,
        //   {
        //     actionType: "storeManagementAction",
        //     actionName: "openStore",
        //     endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
        //     configuration: {
        //       templateType: "fullObjectTemplate",
        //       definition: [
        //         [
        //           {
        //             templateType: "parameterReference",
        //             referenceName: "newDeploymentUuid"
        //           },
        //           newDeploymentStoreConfigurationTemplate,
        //         ]
        //       ]
        //     },
        //     deploymentUuid: {
        //       templateType: "parameterReference",
        //       referenceName: "newDeploymentUuid"
        //     }
        //   }
        // , actionParams);
  
        log.info("store opened with uuid", newDeploymentUuid)
        // const createStoreTemplate:any = {
        //   actionType: "storeManagementAction",
        //   actionName: "createStore",
        //   endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
        //   deploymentUuid: {
        //     templateType: "parameterReference",
        //     referenceName: "newDeploymentUuid"
        //   },
        //   configuration: newDeploymentStoreConfigurationTemplate
        // }

        const createStoreAction: DomainAction = objectTemplateToObject(
          "ROOT",
          {
            actionType: "storeManagementAction",
            actionName: "createStore",
            endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
            deploymentUuid: {
              templateType: "parameterReference",
              referenceName: "newDeploymentUuid"
            },
            configuration: newDeploymentStoreConfigurationTemplate
          } as any,
          actionParams,
          undefined
        );

        // const createdApplicationStore = await domainController.handleAction(createStoreAction)

        // const createdApplicationStore = await runActionTemplate(domainController,
        //   {
        //     actionType: "storeManagementAction",
        //     actionName: "createStore",
        //     endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
        //     deploymentUuid: {
        //       templateType: "parameterReference",
        //       referenceName: "newDeploymentUuid"
        //     },
        //     configuration: newDeploymentStoreConfigurationTemplate
        //   }
        // , actionParams);


        // if (createdApplicationStore?.status != "ok") {
        //   log.error('Error afterEach',JSON.stringify(createdApplicationStore, null, 2));
        // }

        // await domainController.handleAction(
        //   {
        //     actionType: "compositeAction",
        //     actionName: "sequence",
        //     definition: [
        //       openStoreAction,
        //       createStoreAction
        //     ]
        //   }
        // )

        log.info("application store created with uuid", newDeploymentUuid)


        const newApplicationForAdminTemplate: any = {
          "uuid": {
            templateType: "parameterReference",
            referenceName: "newAdminAppApplicationUuid"
          },
          "parentName": {
            templateType: "mustacheStringTemplate",
            definition: "{{entityApplicationForAdmin.name}}"
          },
          "parentUuid": {
            templateType: "mustacheStringTemplate",
            definition: "{{entityApplicationForAdmin.uuid}}"
          },
          "name": {
            templateType: "parameterReference",
            referenceName: "newApplicationName"
          },
          "defaultLabel": {
            templateType: "mustacheStringTemplate",
            definition: "The {{newApplicationName}} application."
          },
          "description": {
            templateType: "mustacheStringTemplate",
            definition: "This application contains the {{newApplicationName}} model and data"
          },
          "selfApplication": {
            templateType: "parameterReference",
            referenceName: "newSelfApplicationUuid"
          },
        };
        
        const newApplicationForAdmin: Application = objectTemplateToObject(
          "ROOT",
          newApplicationForAdminTemplate,
          actionParams,
          undefined
        )
        // const newApplicationForAdmin: Application = {
        //   "uuid": newAdminAppApplicationUuid,
        //   "parentName": entityApplicationForAdmin.name,
        //   "parentUuid": entityApplicationForAdmin.uuid,
        //   "name": newApplicationName,
        //   "defaultLabel": `The ${newApplicationName} application.`,
        //   "description": `This application contains the ${newApplicationName} model and data`,
        //   "selfApplication": newSelfApplicationUuid,
        // }
        log.info("newApplicationForAdmin", newApplicationForAdmin);
        const newSelfApplicationTemplate: any = {
          "uuid": {
            templateType: "parameterReference",
            referenceName: "newSelfApplicationUuid"
          },
          "parentName": "Application",
          "parentUuid": "a659d350-dd97-4da9-91de-524fa01745dc",
          "name": {
            templateType: "parameterReference",
            referenceName: "newApplicationName"
          },
          "defaultLabel": {
            templateType: "mustacheStringTemplate",
            definition: "The {{newApplicationName}} application."
          },
          "description": {
            templateType: "mustacheStringTemplate",
            definition: "This application contains the {{newApplicationName}} model and data"
          },
          "selfApplication": {
            templateType: "parameterReference",
            referenceName: "newSelfApplicationUuid"
          },
        };

        const newSelfApplication: Application = objectTemplateToObject(
          "ROOT",
          newSelfApplicationTemplate,
          actionParams,
          undefined
        )
        log.info("newSelfApplication", newSelfApplication);

        const newDeploymentTemplate: any = {
          "uuid": {
            templateType: "parameterReference",
            referenceName: "newDeploymentUuid"
          },
          "parentName": {
            templateType: "mustacheStringTemplate",
            definition: "{{entityDeployment.name}}"
          },
          "parentUuid": {
            templateType: "mustacheStringTemplate",
            definition: "{{entityDeployment.uuid}}"
          },
          "name": {
            templateType: "mustacheStringTemplate",
            definition: "{{newApplicationName}}ApplicationSqlDeployment"
          },
          "defaultLabel": {
            templateType: "mustacheStringTemplate",
            definition: "{{newApplicationName}}ApplicationSqlDeployment"
          },
          "application": {
            templateType: "mustacheStringTemplate",
            definition: "{{newApplicationForAdmin.uuid}}"
          },
          "description": {
            templateType: "mustacheStringTemplate",
            definition: "The default Sql Deployment for Application {{newApplicationName}}"
          },
          "configuration": {
            templateType: "parameterReference",
            referenceName: "newSelfApplicationUuid"
          },
        }

        const newDeployment = objectTemplateToObject(
          "ROOT",
          newDeploymentTemplate,
          {...actionParams, newApplicationForAdmin},
          undefined
        ) as EntityInstance
        log.info("found newDeployment", newDeployment);

        const resetAndInitActionTemplate: any = {
          endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
          actionType: "storeManagementAction",
          actionName: "resetAndInitMiroirAndApplicationDatabase",
          deploymentUuid: "",
          deployments: [ 
            {
              templateType: "parameterReference",
              referenceName: "newDeployment"
            }
          ],
        }

        const resetAndInitAction: DomainAction = objectTemplateToObject(
          "ROOT",
          resetAndInitActionTemplate,
          {...actionParams, newDeployment},
          undefined
        )
        log.info("found resetAndInitAction", resetAndInitAction);

        // create storage structures for Miroir metamodel Entities in new application deployment
        // await domainController.handleAction(resetAndInitAction);
        // await resetAndInitMiroirAndApplicationDatabase(domainController, [ newDeployment ])

        // await domainController.handleAction(
        //   {
        //     actionType: "compositeAction",
        //     actionName: "sequence",
        //     definition: [
        //       openStoreAction,
        //       createStoreAction,
        //       resetAndInitAction,
        //     ]
        //   }
        // )

        log.info("application store initialized, deployment uuid", newDeploymentUuid)

        // create self Application in new Application model
        // TODO: do it in a transaction??
        const createSelfApplicationActionTemplate: any = {
          actionType: 'instanceAction',
          actionName: "createInstance",
          applicationSection: "model",
          deploymentUuid: {
            templateType: "parameterReference",
            referenceName: "newDeploymentUuid"
          },
          endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
          objects:[
            {
              parentName: {
                templateType: "mustacheStringTemplate",
                definition: "{{entityApplication.name}}"
              },
              parentUuid: {
                templateType: "mustacheStringTemplate",
                definition: "{{entityApplication.uuid}}"
              },
              applicationSection:'model',
              instances: [ 
                {
                  templateType: "parameterReference",
                  referenceName: "newSelfApplication"
                }
              ],
            }
          ]
        }

        const createSelfApplicationAction: InstanceAction = objectTemplateToObject(
          "ROOT",
          createSelfApplicationActionTemplate,
          {...actionParams, newSelfApplication},
          undefined
        )
        log.info("found createSelfApplicationAction", createSelfApplicationAction);

        // await domainController.handleAction(createSelfApplicationAction);
        // await domainController.handleAction(
        //   {
        //     actionType: "compositeAction",
        //     actionName: "sequence",
        //     definition: [
        //       openStoreAction,
        //       createStoreAction,
        //       resetAndInitAction,
        //       createSelfApplicationAction
        //     ]
        //   }
        // )


        log.info("application self Application instance created for deployment uuid", newDeploymentUuid, createSelfApplicationAction)

        // create new Application default Menu
        const newApplicationMenuTemplate: any = {
          "uuid": "84c178cc-1b1b-497a-a035-9b3d756bb085",
          "parentName": "Menu",
          "parentUuid": "dde4c883-ae6d-47c3-b6df-26bc6e3c1842",
          "name": {
            templateType: "mustacheStringTemplate",
            definition: "{{newApplicationName}}Menu"
          },
          "defaultLabel": "Meta-Model",
          "description": {
            templateType: "mustacheStringTemplate",
            definition: "This is the default menu allowing to explore the {{newApplicationName}} Application"
          },
          "definition": {
            "menuType": "complexMenu",
            "definition": [
              {
                "title": {
                  templateType: "parameterReference",
                  referenceName: "newApplicationName"
                },
                "label": {
                  templateType: "parameterReference",
                  referenceName: "newApplicationName"
                },
                "items": [
                  {
                    "label": {
                      templateType: "mustacheStringTemplate",
                      definition: "{{newApplicationName}} Entities"
                    },
                    "section": "model",
                    "application": {
                      templateType: "parameterReference",
                      referenceName: "newDeploymentUuid"
                    },
                    "reportUuid": "c9ea3359-690c-4620-9603-b5b402e4a2b9",
                    "icon": "category"
                  },
                  {
                    "label": {
                      templateType: "mustacheStringTemplate",
                      definition: "{{newApplicationName}} Entity Definitions"
                    },
                    "section": "model",
                    "application": {
                      templateType: "parameterReference",
                      referenceName: "newDeploymentUuid"
                    },
                    "reportUuid": "f9aff35d-8636-4519-8361-c7648e0ddc68",
                    "icon": "category"
                  },
                  {
                    "label": {
                      templateType: "mustacheStringTemplate",
                      definition: "{{newApplicationName}} Reports"
                    },
                    "section": "model",
                    "application": {
                      templateType: "parameterReference",
                      referenceName: "newDeploymentUuid"
                    },
                    "reportUuid": "1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855",
                    "icon": "list"
                  }
                ]
              }
            ]
          }
        }
        const newApplicationMenu: Menu = objectTemplateToObject(
          "ROOT",
          newApplicationMenuTemplate,
          actionParams,
          undefined
        )
        log.info("found newApplicationMenu", newApplicationMenu);

        // const newApplicationMenu: Menu = {
        //   "uuid": "84c178cc-1b1b-497a-a035-9b3d756bb085",
        //   "parentName": "Menu",
        //   "parentUuid": "dde4c883-ae6d-47c3-b6df-26bc6e3c1842",
        //   "name": newApplicationName + "Menu",
        //   "defaultLabel": "Meta-Model",
        //   "description": `This is the default menu allowing to explore the ${newApplicationName} Application.`,
        //   "definition": {
        //     "menuType": "complexMenu",
        //     "definition": [
        //       {
        //         "title": newApplicationName,
        //         "label": newApplicationName,
        //         "items": [
        //           {
        //             "label": newApplicationName + " Entities",
        //             "section": "model",
        //             "application": newDeploymentUuid,
        //             "reportUuid": "c9ea3359-690c-4620-9603-b5b402e4a2b9",
        //             "icon": "category"
        //           },
        //           {
        //             "label": newApplicationName + " Entity Definitions",
        //             "section": "model",
        //             "application": newDeploymentUuid,
        //             "reportUuid": "f9aff35d-8636-4519-8361-c7648e0ddc68",
        //             "icon": "category"
        //           },
        //           {
        //             "label": newApplicationName + " Reports",
        //             "section": "model",
        //             "application": newDeploymentUuid,
        //             "reportUuid": "1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855",
        //             "icon": "list"
        //           }
        //         ]
        //       }
        //     ]
        //   }
        // }
        // TODO: do it in a transaction??
        const createNewApplicationMenuActionTemplate: any = {
          actionType: 'instanceAction',
          actionName: "createInstance",
          applicationSection: "model",
          deploymentUuid: {
            templateType: "parameterReference",
            referenceName: "newDeploymentUuid"
          },
          endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
          objects:[
            {
              parentName: {
                templateType: "mustacheStringTemplate",
                definition: "{{entityMenu.name}}"
              },
              parentUuid: {
                templateType: "mustacheStringTemplate",
                definition: "{{entityMenu.uuid}}"
              },
              applicationSection:'model',
              instances: [ 
                {
                  templateType: "parameterReference",
                  referenceName: "newApplicationMenu"
                }
              ],
            }
          ]
        };
        const createNewApplicationMenuAction: InstanceAction = objectTemplateToObject(
          "ROOT",
          createNewApplicationMenuActionTemplate,
          {...actionParams, newApplicationMenu},
          undefined
        )
        log.info("found newApplicationMenu", newApplicationMenu);

        // const createNewApplicationMenuAction: InstanceAction = {
        //   actionType: 'instanceAction',
        //   actionName: "createInstance",
        //   applicationSection: "model",
        //   deploymentUuid: newDeploymentUuid,
        //   endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
        //   objects:[
        //     {
        //       parentName:entityMenu.name,
        //       parentUuid:entityMenu.uuid,
        //       applicationSection:'model',
        //       instances: [ newApplicationMenu ],
        //     }
        //   ]
        // };

        // await domainController.handleAction(createNewApplicationMenuAction);
        // await domainController.handleAction(
        //   {
        //     actionType: "compositeAction",
        //     actionName: "sequence",
        //     definition: [
        //       openStoreAction,
        //       createStoreAction,
        //       resetAndInitAction,
        //       createSelfApplicationAction,
        //       createNewApplicationMenuAction
        //     ]
        //   }
        // )
                
        // #################### ADMIN
        // create application in Admin application deployment
        const createApplicationForAdminActionTemplate: any = {
          actionType: 'instanceAction',
          actionName: "createInstance",
          applicationSection: "data",
          deploymentUuid: {
            templateType: "mustacheStringTemplate",
            definition: "{{adminConfigurationDeploymentAdmin.uuid}}"
          },
          endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
          objects:[
            {
              parentName: {
                templateType: "mustacheStringTemplate",
                definition: "{{entityApplicationForAdmin.name}}"
              },
              parentUuid: {
                templateType: "mustacheStringTemplate",
                definition: "{{entityApplicationForAdmin.uuid}}"
              },
              applicationSection:'data',
              instances: [ 
                {
                  templateType: "parameterReference",
                  referenceName: "newApplicationForAdmin"
                }
              ],
            }
          ]
        };
        const createApplicationForAdminAction: InstanceAction = objectTemplateToObject(
          "ROOT",
          createApplicationForAdminActionTemplate,
          {...actionParams, newApplicationForAdmin},
          undefined
        )
        log.info("found createApplicationForAdminAction", createApplicationForAdminAction);

        // const createApplicationForAdminAction: InstanceAction = {
        //   actionType: 'instanceAction',
        //   actionName: "createInstance",
        //   applicationSection: "data",
        //   deploymentUuid: adminConfigurationDeploymentAdmin.uuid,
        //   endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
        //   objects:[
        //     {
        //       parentName:entityApplicationForAdmin.name,
        //       parentUuid:entityApplicationForAdmin.uuid,
        //       applicationSection:'data',
        //       instances: [ newApplicationForAdmin ],
        //     }
        //   ]
        // };

        // await domainController.handleAction(createApplicationForAdminAction);
        // await domainController.handleAction(
        //   {
        //     actionType: "compositeAction",
        //     actionName: "sequence",
        //     definition: [
        //       openStoreAction,
        //       createStoreAction,
        //       resetAndInitAction,
        //       createSelfApplicationAction,
        //       createNewApplicationMenuAction,
        //       createApplicationForAdminAction,
        //     ]
        //   }
        // )


        log.info("Application instance created in Admin data for deployment uuid", newDeploymentUuid, createApplicationForAdminAction)


        // add Deployment to Admin application deployment
        const createAdminDeploymentActionTemplate: any = {
          actionType: 'instanceAction',
          actionName: "createInstance",
          applicationSection: "data",
          deploymentUuid:  {
            templateType: "mustacheStringTemplate",
            definition: "{{adminConfigurationDeploymentAdmin.uuid}}"
          },
          endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
          objects:[
            {
              parentName: {
                templateType: "mustacheStringTemplate",
                definition: "{{entityDeployment.name}}"
              },
              parentUuid: {
                templateType: "mustacheStringTemplate",
                definition: "{{entityDeployment.uuid}}"
              },
              applicationSection:'data',
              instances: [ 
                {
                  templateType: "parameterReference",
                  referenceName: "newDeployment"
                }
              ],
            }
          ]
        };
        const createAdminDeploymentAction: InstanceAction = objectTemplateToObject(
          "ROOT",
          createAdminDeploymentActionTemplate,
          {...actionParams, newDeployment},
          undefined
        )
        log.info("found createAdminDeploymentAction", createAdminDeploymentAction);
        // const createAdminDeploymentAction: InstanceAction = {
        //   actionType: 'instanceAction',
        //   actionName: "createInstance",
        //   applicationSection: "data",
        //   deploymentUuid: adminConfigurationDeploymentAdmin.uuid,
        //   endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
        //   objects:[
        //     {
        //       parentName:entityDeployment.name,
        //       parentUuid:entityDeployment.uuid,
        //       applicationSection:'data',
        //       instances: [ newDeployment ],
        //     }
        //   ]
        // };
        // await domainController.handleAction(createAdminDeploymentAction);
        await domainController.handleAction(
          {
            actionType: "compositeAction",
            actionName: "sequence",
            definition: [
              openStoreAction,
              createStoreAction,
              resetAndInitAction,
              createSelfApplicationAction,
              createNewApplicationMenuAction,
              createApplicationForAdminAction,
              createAdminDeploymentAction,
            ]
          }
        )

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