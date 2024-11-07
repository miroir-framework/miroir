import { Formik } from "formik";
import _ from "lodash";
// import { ReactCodeMirror } from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import ReactCodeMirror from "@uiw/react-codemirror";
import { ChangeEvent, useCallback, useMemo, useState } from "react";

// const MyReactCodeMirror: React.Component = ReactCodeMirror
const MyReactCodeMirror: any = ReactCodeMirror // TODO: solve the mystery: it was once well-typed, now the linter raises an error upon direct (default-typed) use!

import {
  ActionHandler,
  CompositeActionTemplate,
  DomainAction,
  DomainControllerInterface,
  JzodElement,
  JzodObject,
  LoggerInterface,
  MetaModel,
  MiroirConfigClient,
  MiroirLoggerFactory,
  adminConfigurationDeploymentAdmin,
  adminConfigurationDeploymentLibrary,
  adminConfigurationDeploymentMiroir,
  entityApplicationForAdmin,
  entityDeployment,
  entityMenu,
  entitySelfApplication,
  getLoggerName,
  resolveReferencesForJzodSchemaAndValueObject
} from "miroir-core";

import { packageName } from "../../../constants.js";
import {
  useDomainControllerService,
  useErrorLogService,
  useMiroirContextInnerFormOutput,
  useMiroirContextService,
  useMiroirContextformHelperState,
} from "../MiroirContextReactProvider.js";
import { useCurrentModel } from "../ReduxHooks.js";
import { JzodObjectEditor } from "../components/JzodObjectEditor.js";
import { cleanLevel } from "../constants.js";
import { adminConfigurationDeploymentParis, applicationParis } from './ReportPage.js';


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

// export interface ActionObjectReference extends QueryTemplateConstantOrAnyReference {

// }

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

  const [formState,setFormState] = useState<{[k:string]:any}>(initialValues)

  // const miroirMetaModel: MetaModel = useCurrentModel(adminConfigurationDeploymentMiroir.uuid);

  const actionHandlerCreateApplication: ActionHandler = useMemo(()=> ({
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
          //   compositeActionType: "action",
          //   action: {
          //     actionType: "storeManagementAction",
          //     actionName: "openStore",
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
          //   compositeActionType: "action",
          //   action: {
          //     transformerType: "parameterReference",
          //     referenceName: "createStoreAction",
          //   }
          // },
          // {
          //   compositeActionType: "action",
          //   action: {
          //     transformerType: "parameterReference",
          //     referenceName: "resetAndInitAction",
          //   }
          // },
          // {
          //   compositeActionType: "action",
          //   action: {
          //     transformerType: "parameterReference",
          //     referenceName: "createSelfApplicationAction",
          //   }
          // },
          // {
          //   compositeActionType: "action",
          //   action: {
          //     transformerType: "parameterReference",
          //     referenceName: "createApplicationForAdminAction",
          //   }
          // },
          // {
          //   compositeActionType: "action",
          //   action: {
          //     transformerType: "parameterReference",
          //     referenceName: "createAdminDeploymentAction",
          //   }
          // },
          // {
          //   compositeActionType: "action",
          //   action: {
          //     transformerType: "parameterReference",
          //     referenceName: "createNewApplicationMenuAction",
          //   }
          // },
          // {
          //   compositeActionType: "action",
          //   action: {
          //     transformerType: "parameterReference",
          //     referenceName: "commitAction",
          //   }
          // },
        ],
      }
    },
  }),[])

  const createNewApplication:CompositeActionTemplate = useMemo(() => ({
    actionType: "compositeAction",
    actionName: "sequence",
    templates: {
      // business objects
      newDeploymentStoreConfiguration: {
        admin: {
          emulatedServerType: "sql",
          connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
          schema: "miroirAdmin",
        },
        model: {
          emulatedServerType: "sql",
          connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
          schema: {
            transformerType: "mustacheStringTemplate",
            definition: "{{newApplicationName}}Model",
          },
        },
        data: {
          emulatedServerType: "sql",
          connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
          schema: {
            transformerType: "mustacheStringTemplate",
            definition: "{{newApplicationName}}Data",
          },
        },
      },
      newApplicationForAdmin: {
        uuid: {
          transformerType: "parameterReference",
          referenceName: "newAdminAppApplicationUuid",
        },
        parentName: {
          transformerType: "mustacheStringTemplate",
          definition: "{{entityApplicationForAdmin.name}}",
        },
        parentUuid: {
          transformerType: "mustacheStringTemplate",
          definition: "{{entityApplicationForAdmin.uuid}}",
        },
        name: {
          transformerType: "parameterReference",
          referenceName: "newApplicationName",
        },
        defaultLabel: {
          transformerType: "mustacheStringTemplate",
          definition: "The {{newApplicationName}} application.",
        },
        description: {
          transformerType: "mustacheStringTemplate",
          definition: "This application contains the {{newApplicationName}} model and data",
        },
        selfApplication: {
          transformerType: "parameterReference",
          referenceName: "newSelfApplicationUuid",
        },
      },
      newSelfApplication: {
        uuid: {
          transformerType: "parameterReference",
          referenceName: "newSelfApplicationUuid",
        },
        parentName: "Application",
        parentUuid: "a659d350-dd97-4da9-91de-524fa01745dc",
        name: {
          transformerType: "parameterReference",
          referenceName: "newApplicationName",
        },
        defaultLabel: {
          transformerType: "mustacheStringTemplate",
          definition: "The {{newApplicationName}} application.",
        },
        description: {
          transformerType: "mustacheStringTemplate",
          definition: "This application contains the {{newApplicationName}} model and data",
        },
        selfApplication: {
          transformerType: "parameterReference",
          referenceName: "newSelfApplicationUuid",
        },
      },
      newDeployment: {
        uuid: {
          transformerType: "parameterReference",
          referenceName: "newDeploymentUuid",
        },
        parentName: {
          transformerType: "mustacheStringTemplate",
          definition: "{{entityDeployment.name}}",
        },
        parentUuid: {
          transformerType: "mustacheStringTemplate",
          definition: "{{entityDeployment.uuid}}",
        },
        name: {
          transformerType: "mustacheStringTemplate",
          definition: "{{newApplicationName}}ApplicationSqlDeployment",
        },
        defaultLabel: {
          transformerType: "mustacheStringTemplate",
          definition: "{{newApplicationName}}ApplicationSqlDeployment",
        },
        application: {
          transformerType: "mustacheStringTemplate",
          definition: "{{newApplicationForAdmin.uuid}}",
        },
        description: {
          transformerType: "mustacheStringTemplate",
          definition: "The default Sql Deployment for Application {{newApplicationName}}",
        },
        configuration: {
          transformerType: "parameterReference",
          referenceName: "newDeploymentStoreConfiguration",
        },
      },
      newApplicationMenu: {
        uuid: "84c178cc-1b1b-497a-a035-9b3d756bb085",
        parentName: "Menu",
        parentUuid: "dde4c883-ae6d-47c3-b6df-26bc6e3c1842",
        parentDefinitionVersionUuid: "0f421b2f-2fdc-47ee-8232-62121ea46350",
        name: {
          transformerType: "mustacheStringTemplate",
          definition: "{{newApplicationName}}Menu",
        },
        defaultLabel: "Meta-Model",
        description: {
          transformerType: "mustacheStringTemplate",
          definition: "This is the default menu allowing to explore the {{newApplicationName}} Application",
        },
        definition: {
          menuType: "complexMenu",
          definition: [
            {
              title: {
                transformerType: "parameterReference",
                referenceName: "newApplicationName",
              },
              label: {
                transformerType: "parameterReference",
                referenceName: "newApplicationName",
              },
              items: [
                {
                  label: {
                    transformerType: "mustacheStringTemplate",
                    definition: "{{newApplicationName}} Entities",
                  },
                  section: "model",
                  application: {
                    transformerType: "parameterReference",
                    referenceName: "newDeploymentUuid",
                  },
                  reportUuid: "c9ea3359-690c-4620-9603-b5b402e4a2b9",
                  icon: "category",
                },
                {
                  label: {
                    transformerType: "mustacheStringTemplate",
                    definition: "{{newApplicationName}} Entity Definitions",
                  },
                  section: "model",
                  application: {
                    transformerType: "parameterReference",
                    referenceName: "newDeploymentUuid",
                  },
                  reportUuid: "f9aff35d-8636-4519-8361-c7648e0ddc68",
                  icon: "category",
                },
                {
                  label: {
                    transformerType: "mustacheStringTemplate",
                    definition: "{{newApplicationName}} Reports",
                  },
                  section: "model",
                  application: {
                    transformerType: "parameterReference",
                    referenceName: "newDeploymentUuid",
                  },
                  reportUuid: "1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855",
                  icon: "list",
                },
              ],
            },
          ],
        },
      },
    },
    definition: [
      // openStoreAction
      {
        compositeActionType: "action",
        compositeActionName: "openStoreAction",
        action: {
          actionType: "storeManagementAction",
          actionName: "openStore",
          endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
          configuration: {
            transformerType: "fullObjectTemplate",
            referencedExtractor: "NOT_RELEVANT",
            definition: [
              {
                attributeKey: {
                  transformerType: "parameterReference",
                  referenceName: "newDeploymentUuid",
                },
                attributeValue: {
                  transformerType: "parameterReference",
                  referenceName: "newDeploymentStoreConfiguration",
                }
              }
            ],
          },
          deploymentUuid: {
            transformerType: "parameterReference",
            referenceName: "newDeploymentUuid",
          },
        }
      },
      // createStoreAction
      {
        compositeActionType: "action",
        compositeActionName: "createStoreAction",
        action: {
          actionType: "storeManagementAction",
          actionName: "createStore",
          endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
          deploymentUuid: {
            transformerType: "parameterReference",
            referenceName: "newDeploymentUuid",
          },
          configuration: {
            transformerType: "parameterReference",
            referenceName: "newDeploymentStoreConfiguration",
          },
        }
        // action: {
        //   transformerType: "parameterReference",
        //   referenceName: "createStoreAction",
        // }
      },
      // resetAndInitAction
      {
        compositeActionType: "action",
        compositeActionName: "resetAndInitAction",
        action: {
          endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
          actionType: "storeManagementAction",
          actionName: "resetAndInitMiroirAndApplicationDatabase",
          deploymentUuid: "",
          deployments: [
            {
              transformerType: "parameterReference",
              referenceName: "newDeployment",
            },
          ],
        }
        // action: {
        //   transformerType: "parameterReference",
        //   referenceName: "resetAndInitAction",
        // }
      },
      // createSelfApplicationAction
      {
        compositeActionType: "action",
        compositeActionName: "createSelfApplicationAction",
        action: {
          actionType: "instanceAction",
          actionName: "createInstance",
          applicationSection: "model",
          deploymentUuid: {
            transformerType: "parameterReference",
            referenceName: "newDeploymentUuid",
          },
          endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
          objects: [
            {
              parentName: {
                transformerType: "mustacheStringTemplate",
                definition: "{{entitySelfApplication.name}}",
              },
              parentUuid: {
                transformerType: "mustacheStringTemplate",
                definition: "{{entitySelfApplication.uuid}}",
              },
              applicationSection: "model",
              instances: [
                {
                  transformerType: "parameterReference",
                  referenceName: "newSelfApplication",
                },
              ],
            },
          ],
        }
        // action: {
        //   transformerType: "parameterReference",
        //   referenceName: "createSelfApplicationAction",
        // }
      },
      // createApplicationForAdminAction
      {
        compositeActionType: "action",
        compositeActionName: "createApplicationForAdminAction",
        action: {
          actionType: "instanceAction",
          actionName: "createInstance",
          applicationSection: "data",
          deploymentUuid: {
            transformerType: "mustacheStringTemplate",
            definition: "{{adminConfigurationDeploymentAdmin.uuid}}",
          },
          endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
          objects: [
            {
              parentName: {
                transformerType: "mustacheStringTemplate",
                definition: "{{entityApplicationForAdmin.name}}",
              },
              parentUuid: {
                transformerType: "mustacheStringTemplate",
                definition: "{{entityApplicationForAdmin.uuid}}",
              },
              applicationSection: "data",
              instances: [
                {
                  transformerType: "parameterReference",
                  referenceName: "newApplicationForAdmin",
                },
              ],
            },
          ],
        }
        // action: {
        //   transformerType: "parameterReference",
        //   referenceName: "createApplicationForAdminAction",
        // }
      },
      // createAdminDeploymentAction
      {
        compositeActionType: "action",
        compositeActionName: "createAdminDeploymentAction",
        action: {
          actionType: "instanceAction",
          actionName: "createInstance",
          applicationSection: "data",
          deploymentUuid: {
            transformerType: "mustacheStringTemplate",
            definition: "{{adminConfigurationDeploymentAdmin.uuid}}",
          },
          endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
          objects: [
            {
              parentName: {
                transformerType: "mustacheStringTemplate",
                definition: "{{entityDeployment.name}}",
              },
              parentUuid: {
                transformerType: "mustacheStringTemplate",
                definition: "{{entityDeployment.uuid}}",
              },
              applicationSection: "data",
              instances: [
                {
                  transformerType: "parameterReference",
                  referenceName: "newDeployment",
                },
              ],
            },
          ],
        }
        // action: {
        //   transformerType: "parameterReference",
        //   referenceName: "createAdminDeploymentAction",
        // }
      },
      // createNewApplicationMenuAction
      {
        compositeActionType: "action",
        compositeActionName: "createNewApplicationMenuAction",
        action: {
          actionType: "instanceAction",
          actionName: "createInstance",
          applicationSection: "model",
          deploymentUuid: {
            transformerType: "parameterReference",
            referenceName: "newDeploymentUuid",
          },
          endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
          objects: [
            {
              parentName: {
                transformerType: "mustacheStringTemplate",
                definition: "{{entityMenu.name}}",
              },
              parentUuid: {
                transformerType: "mustacheStringTemplate",
                definition: "{{entityMenu.uuid}}",
              },
              applicationSection: "model",
              instances: [
                {
                  transformerType: "parameterReference",
                  referenceName: "newApplicationMenu",
                },
              ],
            },
          ],
        }
        // action: {
        //   transformerType: "parameterReference",
        //   referenceName: "createNewApplicationMenuAction",
        // }
      },
      // commitAction
      {
        compositeActionType: "action",
        compositeActionName: "commitAction",
        action: {
          actionName: "commit",
          actionType: "modelAction",
          endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
          deploymentUuid: {
            transformerType: "parameterReference",
            referenceName: "newDeploymentUuid",
          },
        }
        // action: {
        //   transformerType: "parameterReference",
        //   referenceName: "commitAction",
        // }
      },
    ]
  }), []);
  const [rawSchema, setRawSchema] = useState<JzodElement>(
    actionHandlerCreateApplication.interface.actionJzodObjectSchema
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
      if (context.miroirFundamentalJzodSchema.name == "dummyJzodSchema") {
        return defaultObject
      } else {
        const configuration = resolveReferencesForJzodSchemaAndValueObject(
          context.miroirFundamentalJzodSchema,
          rawSchema,
          formState,
          currentModel,
          currentMiroirModel,
          emptyObject,
        )

        return configuration.status == "ok"? configuration.element : defaultObject;
      }
    },
    [context.miroirFundamentalJzodSchema, rawSchema, formState]
  );

  log.info("resolvedJzodSchema", resolvedJzodSchema, context.miroirFundamentalJzodSchema.name, "rawSchema", rawSchema)
  // ##############################################################################################
  const onSubmit = useCallback(
    async (actionCreateSchemaParamValues: any /* actually follows formJzodSchema */, formikFunctions:{ setSubmitting:any, setErrors:any }) => {
      try {
        //  Send values somehow
        setformHelperState(actionCreateSchemaParamValues);

        log.info(
          "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ onSubmit formik values",
          actionCreateSchemaParamValues,
          "newApplicationName",
          actionCreateSchemaParamValues.newApplicationName,
          "newDeploymentUuid",
          actionCreateSchemaParamValues.newDeploymentUuid,
          "newSelfApplicationUuid",
          actionCreateSchemaParamValues.newSelfApplicationUuid,
          "newAdminAppApplicationUuid",
          actionCreateSchemaParamValues.newAdminAppApplicationUuid,
        );

        // const paramsAsDomainElementObject:DomainElementObject = plainObjectToDomainElement(actionCreateSchemaParamValues) as DomainElementObject;

        // const paramsWithTemplates: DomainElementObject = {
        //   elementType: "object",
        //   elementValue: {
        //     ...paramsAsDomainElementObject.elementValue,
        //     ...Object.fromEntries(Object.entries(actionHandlerCreateApplication.implementation.templates as any).map((e => [e[0],{elementType: "object", elementValue: e[1]}] )) as any),
        //   }
        // }
        const paramsForTemplates = { 
          ...actionCreateSchemaParamValues,
          entityApplicationForAdmin,
          entitySelfApplication,
          adminConfigurationDeploymentAdmin,
          entityMenu,
          entityDeployment,
        }
        log.info(
          "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ onSubmit formik values actionCreateSchemaParamValues",
          actionCreateSchemaParamValues,
          "paramsForTemplates",
          paramsForTemplates
        );
        //   elementType: "object",
        //   elementValue: actionCreateSchemaParamValues
        // }

        const createNewApplicationResult = await domainController.handleCompositeActionTemplate(
          createNewApplication,
          paramsForTemplates,
          currentModel
        );
        log.info("store opened with uuid", actionCreateSchemaParamValues.newDeploymentUuid)

        log.info("created Deployment instance in Admin App deployment")
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
  ) // end onSubmit()

  // ##############################################################################################
  const onCodeEditorChange = useCallback((values:any, viewUpdate:any) => {
    log.info('edit code received value:', values);
    setRawSchema(JSON.parse(values))
    log.info('edit code done');
  }, []);

  return (
    <>
      <div>
        Hello World!
      </div>
      <div>
        {
          // props.defaultFormValuesObject?
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
      </div>
      <div>
        <Formik
          enableReinitialize={true}
          // initialValues={dialogOuterFormObject}
          initialValues={formState}
          onSubmit={
            onSubmit
          }
          handleChange= {
            async (e: ChangeEvent<any>):Promise<void> => {
              log.info("onChange formik", e);
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
            }
          }
        >
          {
            (
              formik
            ) => (
              <>
                {/* <span>Tools: {count}</span> */}
                {/* <br /> */}
                {/* <span>formState: {JSON.stringify(formState)}</span> */}
                {/* <br /> */}
                {/* <span>resolvedJzodSchema:{JSON.stringify(resolvedJzodSchema)}</span> */}
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
                      <JzodObjectEditor
                        name={'ROOT'}
                        listKey={'ROOT'}
                        rootLesslistKey={emptyString}
                        rootLesslistKeyArray={emptyList}
                        label={pageLabel}
                        currentDeploymentUuid={emptyString}
                        currentApplicationSection={dataSection}
                        // resolvedJzodSchema={actionsJzodSchema}
                        rawJzodSchema={rawSchema}
                        resolvedJzodSchema={resolvedJzodSchema}
                        foreignKeyObjects={emptyObject}
                        handleChange={formik.handleChange as any}
                        formik={formik}
                        setFormState={setFormState}
                        formState={formState}
                      />
                      <button type="submit" name={pageLabel} form={"form." + pageLabel}>submit form.{pageLabel}</button>
                    </>
                  }
                </form>
              </>
            )
          }
        </Formik>
      </div>
    </>
  )
}