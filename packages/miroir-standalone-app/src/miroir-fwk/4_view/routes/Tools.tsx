import { Formik } from "formik";
import _ from "lodash";
// import { ReactCodeMirror } from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { ChangeEvent, useCallback, useMemo, useState } from "react";
import { v4 as uuidv4 } from 'uuid';
import ReactCodeMirror from "@uiw/react-codemirror";

// const MyReactCodeMirror: React.Component = ReactCodeMirror
const MyReactCodeMirror: any = ReactCodeMirror // TODO: solve the mystery: it was once well-typed, now the linter raises an error upon direct (default-typed) use!

import {
  ActionHandler,
  CompositeAction,
  DomainAction,
  DomainController,
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
  compositeAction,
  entitySelfApplication,
  entityApplicationForAdmin,
  entityDeployment,
  entityMenu,
  getLoggerName,
  renderObjectTemplate,
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
import { JzodObjectEditor } from "../components/JzodObjectEditor.js";
import { cleanLevel } from "../constants.js";
import { adminConfigurationDeploymentParis, applicationParis } from './ReportPage.js';
import { useCurrentModel } from "../ReduxHooks.js";


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
//     //   "definition": { "absolutePath": "fe9b7d99-f216-44de-bb6e-60e1a1ebb739", "relativePath": "miroirConfigForRestClient"}
//     // },
//   }
// };
// // miroirConfigForRestClient


const initialValues = {
  newApplicationName: "placeholder...",
  // newAdminAppApplicationUuid: uuidv4(),
  newAdminAppApplicationUuid: applicationParis.uuid,
  // newSelfApplicationUuid: uuidv4(),
  newSelfApplicationUuid: applicationParis.selfApplication,
  // newDeploymentUuid: uuidv4(),
  newDeploymentUuid: adminConfigurationDeploymentParis.uuid,
}

// export interface ActionObjectReference extends QueryObjectReference {

// }

export interface MiroirForm {
  formSchema: JzodElement,
  formAction: DomainAction,
}

// ################################################################################################
// 
export const handleCompositeAction = async (
  domainController: DomainControllerInterface,
  actionHandler: ActionHandler,
  actionParamValues: any,
  currentModel?: MetaModel,
): Promise<void> => {
  const templateConversionEffectiveParams = {
    ...actionParamValues,
    adminConfigurationDeploymentAdmin,
    entitySelfApplication,
    entityApplicationForAdmin,
    entityDeployment,
    entityMenu,
  }

  // log.info(
  //   "handleCompositeAction",
  //   "actionParamValues",
  //   actionParamValues,
  //   "templateConversionEffectiveParams",
  //   templateConversionEffectiveParams,
  //   "actionHandler",
  //   actionHandler
  // );
  const resolvedTemplates: any = {}
  // going imperatively to handle inner references
  if (actionHandler.implementation.templates) {
    for (const t of Object.entries(actionHandler.implementation.templates)) {
      const resolvedTemplate = renderObjectTemplate(
        t[0],
        t[1],
        {...templateConversionEffectiveParams,...resolvedTemplates},
        undefined
      );
      log.info("handleCompositeAction resolved template", t[0], resolvedTemplate)
      resolvedTemplates[t[0]] = resolvedTemplate
    }
  }
  const compositeActionTemplateAvailableReferences = {...templateConversionEffectiveParams, ...resolvedTemplates};

  // log.info(
  //   "handleCompositeAction",
  //   "compositeActionTemplateAvailableReferences",
  //   compositeActionTemplateAvailableReferences,
  // )

  const actions: DomainAction[] = [];
  if (!(actionHandler.implementation.compositeActionTemplate as any).definition) {
    throw new Error("no definition on compositeActionTemplate, template can not be resolved");
    
  }

  for (const a of (actionHandler.implementation.compositeActionTemplate as any).definition) {
    log.info("handleCompositeAction resolving action", a)
    const currentAction = renderObjectTemplate(
      "ROOT",
      a.action,
      compositeActionTemplateAvailableReferences,
      undefined
    )
    log.info("handleCompositeAction resolved action", a, currentAction)

    actions.push(currentAction)
  }

  const compositeAction: CompositeAction = {
    actionType: "compositeAction",
    actionName: "sequence",
    definition: actions.map(a => ({ compositeActionType: "action", action: a})),
  }
  // return compositeAction
  await domainController.handleAction(
    compositeAction, currentModel
  );

}

// ################################################################################################
// ################################################################################################
// ################################################################################################
let count = 0;
export const ToolsPage: React.FC<any> = (
  props: any
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
          // actionType: {
          //   type: "literal",
          //   definition: "createSchema"
          // },
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
              templateType: "mustacheStringTemplate",
              definition: "{{newApplicationName}}Model",
            },
          },
          data: {
            emulatedServerType: "sql",
            connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
            schema: {
              templateType: "mustacheStringTemplate",
              definition: "{{newApplicationName}}Data",
            },
          },
        },
        newApplicationForAdmin: {
          uuid: {
            templateType: "parameterReference",
            referenceName: "newAdminAppApplicationUuid",
          },
          parentName: {
            templateType: "mustacheStringTemplate",
            definition: "{{entityApplicationForAdmin.name}}",
          },
          parentUuid: {
            templateType: "mustacheStringTemplate",
            definition: "{{entityApplicationForAdmin.uuid}}",
          },
          name: {
            templateType: "parameterReference",
            referenceName: "newApplicationName",
          },
          defaultLabel: {
            templateType: "mustacheStringTemplate",
            definition: "The {{newApplicationName}} application.",
          },
          description: {
            templateType: "mustacheStringTemplate",
            definition: "This application contains the {{newApplicationName}} model and data",
          },
          selfApplication: {
            templateType: "parameterReference",
            referenceName: "newSelfApplicationUuid",
          },
        },
        newSelfApplication: {
          uuid: {
            templateType: "parameterReference",
            referenceName: "newSelfApplicationUuid",
          },
          parentName: "Application",
          parentUuid: "a659d350-dd97-4da9-91de-524fa01745dc",
          name: {
            templateType: "parameterReference",
            referenceName: "newApplicationName",
          },
          defaultLabel: {
            templateType: "mustacheStringTemplate",
            definition: "The {{newApplicationName}} application.",
          },
          description: {
            templateType: "mustacheStringTemplate",
            definition: "This application contains the {{newApplicationName}} model and data",
          },
          selfApplication: {
            templateType: "parameterReference",
            referenceName: "newSelfApplicationUuid",
          },
        },
        newDeployment: {
          uuid: {
            templateType: "parameterReference",
            referenceName: "newDeploymentUuid",
          },
          parentName: {
            templateType: "mustacheStringTemplate",
            definition: "{{entityDeployment.name}}",
          },
          parentUuid: {
            templateType: "mustacheStringTemplate",
            definition: "{{entityDeployment.uuid}}",
          },
          name: {
            templateType: "mustacheStringTemplate",
            definition: "{{newApplicationName}}ApplicationSqlDeployment",
          },
          defaultLabel: {
            templateType: "mustacheStringTemplate",
            definition: "{{newApplicationName}}ApplicationSqlDeployment",
          },
          application: {
            templateType: "mustacheStringTemplate",
            definition: "{{newApplicationForAdmin.uuid}}",
          },
          description: {
            templateType: "mustacheStringTemplate",
            definition: "The default Sql Deployment for Application {{newApplicationName}}",
          },
          configuration: {
            templateType: "parameterReference",
            referenceName: "newDeploymentStoreConfiguration",
          },
        },
        newApplicationMenu: {
          uuid: "84c178cc-1b1b-497a-a035-9b3d756bb085",
          parentName: "Menu",
          parentUuid: "dde4c883-ae6d-47c3-b6df-26bc6e3c1842",
          parentDefinitionVersionUuid: "0f421b2f-2fdc-47ee-8232-62121ea46350",
          name: {
            templateType: "mustacheStringTemplate",
            definition: "{{newApplicationName}}Menu",
          },
          defaultLabel: "Meta-Model",
          description: {
            templateType: "mustacheStringTemplate",
            definition: "This is the default menu allowing to explore the {{newApplicationName}} Application",
          },
          definition: {
            menuType: "complexMenu",
            definition: [
              {
                title: {
                  templateType: "parameterReference",
                  referenceName: "newApplicationName",
                },
                label: {
                  templateType: "parameterReference",
                  referenceName: "newApplicationName",
                },
                items: [
                  {
                    label: {
                      templateType: "mustacheStringTemplate",
                      definition: "{{newApplicationName}} Entities",
                    },
                    section: "model",
                    application: {
                      templateType: "parameterReference",
                      referenceName: "newDeploymentUuid",
                    },
                    reportUuid: "c9ea3359-690c-4620-9603-b5b402e4a2b9",
                    icon: "category",
                  },
                  {
                    label: {
                      templateType: "mustacheStringTemplate",
                      definition: "{{newApplicationName}} Entity Definitions",
                    },
                    section: "model",
                    application: {
                      templateType: "parameterReference",
                      referenceName: "newDeploymentUuid",
                    },
                    reportUuid: "f9aff35d-8636-4519-8361-c7648e0ddc68",
                    icon: "category",
                  },
                  {
                    label: {
                      templateType: "mustacheStringTemplate",
                      definition: "{{newApplicationName}} Reports",
                    },
                    section: "model",
                    application: {
                      templateType: "parameterReference",
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
        // actions
        openStoreAction: {
          actionType: "storeManagementAction",
          actionName: "openStore",
          endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
          configuration: {
            templateType: "fullObjectTemplate",
            definition: [
              [
                {
                  templateType: "parameterReference",
                  referenceName: "newDeploymentUuid",
                },
                {
                  templateType: "parameterReference",
                  referenceName: "newDeploymentStoreConfiguration",
                },
              ],
            ],
          },
          deploymentUuid: {
            templateType: "parameterReference",
            referenceName: "newDeploymentUuid",
          },
        },
        createStoreAction: {
          actionType: "storeManagementAction",
          actionName: "createStore",
          endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
          deploymentUuid: {
            templateType: "parameterReference",
            referenceName: "newDeploymentUuid",
          },
          configuration: {
            templateType: "parameterReference",
            referenceName: "newDeploymentStoreConfiguration",
          },
        },
        resetAndInitAction: {
          endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
          actionType: "storeManagementAction",
          actionName: "resetAndInitMiroirAndApplicationDatabase",
          deploymentUuid: "",
          deployments: [
            {
              templateType: "parameterReference",
              referenceName: "newDeployment",
            },
          ],
        },
        createSelfApplicationAction: {
          actionType: "instanceAction",
          actionName: "createInstance",
          applicationSection: "model",
          deploymentUuid: {
            templateType: "parameterReference",
            referenceName: "newDeploymentUuid",
          },
          endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
          objects: [
            {
              parentName: {
                templateType: "mustacheStringTemplate",
                definition: "{{entitySelfApplication.name}}",
              },
              parentUuid: {
                templateType: "mustacheStringTemplate",
                definition: "{{entitySelfApplication.uuid}}",
              },
              applicationSection: "model",
              instances: [
                {
                  templateType: "parameterReference",
                  referenceName: "newSelfApplication",
                },
              ],
            },
          ],
        },
        createNewApplicationMenuAction: {
          actionType: "instanceAction",
          actionName: "createInstance",
          applicationSection: "model",
          deploymentUuid: {
            templateType: "parameterReference",
            referenceName: "newDeploymentUuid",
          },
          endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
          objects: [
            {
              parentName: {
                templateType: "mustacheStringTemplate",
                definition: "{{entityMenu.name}}",
              },
              parentUuid: {
                templateType: "mustacheStringTemplate",
                definition: "{{entityMenu.uuid}}",
              },
              applicationSection: "model",
              instances: [
                {
                  templateType: "parameterReference",
                  referenceName: "newApplicationMenu",
                },
              ],
            },
          ],
        },
        commitAction: {
          actionName: "commit",
          actionType: "modelAction",
          endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
          deploymentUuid: {
            templateType: "parameterReference",
            referenceName: "newDeploymentUuid",
          },
        },
        createApplicationForAdminAction: {
          actionType: "instanceAction",
          actionName: "createInstance",
          applicationSection: "data",
          deploymentUuid: {
            templateType: "mustacheStringTemplate",
            definition: "{{adminConfigurationDeploymentAdmin.uuid}}",
          },
          endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
          objects: [
            {
              parentName: {
                templateType: "mustacheStringTemplate",
                definition: "{{entityApplicationForAdmin.name}}",
              },
              parentUuid: {
                templateType: "mustacheStringTemplate",
                definition: "{{entityApplicationForAdmin.uuid}}",
              },
              applicationSection: "data",
              instances: [
                {
                  templateType: "parameterReference",
                  referenceName: "newApplicationForAdmin",
                },
              ],
            },
          ],
        },
        createAdminDeploymentAction: {
          actionType: "instanceAction",
          actionName: "createInstance",
          applicationSection: "data",
          deploymentUuid: {
            templateType: "mustacheStringTemplate",
            definition: "{{adminConfigurationDeploymentAdmin.uuid}}",
          },
          endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
          objects: [
            {
              parentName: {
                templateType: "mustacheStringTemplate",
                definition: "{{entityDeployment.name}}",
              },
              parentUuid: {
                templateType: "mustacheStringTemplate",
                definition: "{{entityDeployment.uuid}}",
              },
              applicationSection: "data",
              instances: [
                {
                  templateType: "parameterReference",
                  referenceName: "newDeployment",
                },
              ],
            },
          ],
        },
      },
      compositeActionTemplate: {
        actionType: "compositeAction",
        actionName: "sequence",
        definition: [
          {
            compositeActionType: "action",
            action: {
              templateType: "parameterReference",
              referenceName: "openStoreAction",
            }
          },
          {
            compositeActionType: "action",
            action: {
              templateType: "parameterReference",
              referenceName: "createStoreAction",
            }
          },
          {
            compositeActionType: "action",
            action: {
              templateType: "parameterReference",
              referenceName: "resetAndInitAction",
            }
          },
          {
            compositeActionType: "action",
            action: {
              templateType: "parameterReference",
              referenceName: "createSelfApplicationAction",
            }
          },
          {
            compositeActionType: "action",
            action: {
              templateType: "parameterReference",
              referenceName: "createApplicationForAdminAction",
            }
          },
          {
            compositeActionType: "action",
            action: {
              templateType: "parameterReference",
              referenceName: "createAdminDeploymentAction",
            }
          },
          {
            compositeActionType: "action",
            action: {
              templateType: "parameterReference",
              referenceName: "createNewApplicationMenuAction",
            }
          },
          {
            compositeActionType: "action",
            action: {
              templateType: "parameterReference",
              referenceName: "commitAction",
            }
          },
        ],
      }
    },
  }),[])

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
  )
;

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



        await handleCompositeAction(
          domainController,
          actionHandlerCreateApplication,
          actionCreateSchemaParamValues,
          currentModel
        )
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