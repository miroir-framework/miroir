import { Formik } from "formik";
import _ from "lodash";
import { v4 as uuidv4 } from 'uuid';
// import { ReactCodeMirror } from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import ReactCodeMirror from "@uiw/react-codemirror";
import { ChangeEvent, useCallback, useMemo, useState } from "react";

// const MyReactCodeMirror: React.Component = ReactCodeMirror
const MyReactCodeMirror: any = ReactCodeMirror // TODO: solve the mystery: it was once well-typed, now the linter raises an error upon direct (default-typed) use!

import {
  SelfApplicationDeploymentConfiguration,
  CompositeActionTemplate,
  DomainAction,
  DomainControllerInterface,
  JzodElement,
  JzodObject,
  LoggerInterface,
  MetaEntity,
  MetaModel,
  MiroirConfigClient,
  MiroirLoggerFactory,
  adminConfigurationDeploymentLibrary,
  adminConfigurationDeploymentMiroir,
  entityEntity,
  entityEntityDefinition,
  entityMenu,
  entityReport,
  getApplicationSection,
  jzodTypeCheck
} from "miroir-core";

import { adminConfigurationDeploymentParis, deployments, packageName } from "../../../constants.js";
import {
  useDomainControllerService,
  useErrorLogService,
  useMiroirContextInnerFormOutput,
  useMiroirContextService,
  useMiroirContextformHelperState,
} from "../MiroirContextReactProvider.js";
import { useCurrentModel } from "../ReduxHooks.js";
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

// const miroirConfig: MiroirConfigClient = {
//   "client": {
//     "emulateServer": false,
//     "serverConfig":{
//       "rootApiUrl":"http://localhost:3080",
//       "dataflowConfiguration": {
//         "type":"singleNode",
//         "metaModel": {
//           "location": {
//             "side":"server",
//             "type": "filesystem",
//             "location":"C:/Users/nono/Documents/devhome/miroir-app-dev/packages/miroir-core/src/assets"
//           }
//         }
//       },
//       "storeSectionConfiguration": {
//         [adminConfigurationDeploymentMiroir.uuid]:{
//           "admin": {
//             "emulatedServerType": "sql",
//             "connectionString":"postgres://postgres:postgres@localhost:5432/postgres",
//             "schema": "miroirAdmin"
//           },
//           "model": {
//             "emulatedServerType": "sql",
//             "connectionString":"postgres://postgres:postgres@localhost:5432/postgres",
//             "schema": "miroir"
//           },
//           "data": {
//             "emulatedServerType": "sql",
//             "connectionString":"postgres://postgres:postgres@localhost:5432/postgres",
//             "schema": "miroir"
//           }
//         },
//         [adminConfigurationDeploymentLibrary.uuid]: {
//           "admin": {
//             "emulatedServerType": "sql",
//             "connectionString":"postgres://postgres:postgres@localhost:5432/postgres",
//             "schema": "miroirAdmin"
//           },
//           "model": {
//             "emulatedServerType": "sql",
//             "connectionString":"postgres://postgres:postgres@localhost:5432/postgres",
//             "schema": "library"
//           },
//           "data": {
//             "emulatedServerType": "sql",
//             "connectionString":"postgres://postgres:postgres@localhost:5432/postgres",
//             "schema": "library"
//           }
//         }
//       }
//     },
//     // "deploymentMode":"monoUser",
//     // "monoUserAutentification": false,
//     // "monoUserVersionControl": false,
//     // "versionControlForDataConceptLevel": false
//   }
// };
const defaultObject: JzodObject = {
  type: "object",
  definition: {}
} as JzodObject


const initialValues = {
  // newEntityName: "placeholder...",
  newEntityName: "Test",
  newEntityDescription: "A Test, enclosing test cases",
  // newAdminAppApplicationUuid: applicationParis.uuid,
  // newSelfApplicationUuid: applicationParis.selfApplication,
  // newDeploymentUuid: adminConfigurationDeploymentParis.uuid,
}

export interface MiroirForm {
  formSchema: JzodElement,
  formAction: DomainAction,
}


// ################################################################################################
// ################################################################################################
// ################################################################################################
let count = 0;
export const ConceptPage: React.FC<any> = (
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

  const FormInterface:JzodObject = {
    type: "object",
    definition: {
      newEntityName: {
        type: "string"
      },
      newEntityDescription: {
        type: "uuid"
      },
      // newSelfApplicationUuid: {
      //   type: "uuid"
      // },
      // newDeploymentUuid: {
      //   type: "uuid"
      // },
    }
  };
  const [rawSchema, setRawSchema] = useState<JzodElement>(
    // actionHandlerCreateApplication.interface.actionJzodObjectSchema
    FormInterface
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

  const displayedDeploymentDefinition: SelfApplicationDeploymentConfiguration | undefined = deployments.find(
    (d) => d.uuid == context.deploymentUuid
  );


  // ##############################################################################################
  const currentApplicationUuid = displayedDeploymentDefinition?.selfApplication??emptyString;
  // const currentApplicationUuid = adminConfigurationDeploymentLibrary.selfApplication;
  // const currentDeploymentUuid = adminConfigurationDeploymentLibrary.uuid;
  const currentDeploymentUuid = context.deploymentUuid;
  // const currentApplicationUuid = props.currentApplicationUuid
  // const currentDeploymentUuid = props.currentDeploymentUuid;
  log.info(
    "currentDeploymentUuid",
    currentDeploymentUuid,
    "currentApplicationUuid",
    currentApplicationUuid,
    "displayedDeploymentDefinition",
    displayedDeploymentDefinition
  );

  const newEntityUuid = uuidv4();
  const newEntityDefinitionUuid = uuidv4();
  // const newEntityName = "NewEntityName";
  const createEntity_newEntityDescription = "Description of the new entity";

  // log.info("createEntity fileData", fileData);
  const jzodSchema:JzodObject = {
    type: "object",
    definition: 
    // Object.assign(
    //   {},
      {
        uuid: {
          type: "string",
          validations: [{ type: "uuid" }],
          tag: { value: { id: 1, defaultLabel: "Uuid", editable: false} },
        },
        parentName: {
          type: "string",
          optional: true,
          tag: { value: { id: 1, defaultLabel: "Uuid", editable: false } },
        },
        parentUuid: {
          type: "string",
          validations: [{ type: "uuid" }],
          tag: { value: { id: 1, defaultLabel: "parentUuid", editable: false } },
        },
      },
      // ...(
      //   fileData[0]?
      //   Object.values(fileData[0]).map(
      //     (a: string, index) => (
      //       {
      //         [a]: {
      //           type: "string",
      //           optional: true,
      //           tag: { id: index + 2 /* uuid attribute has been added*/, defaultLabel: a, editable: true },
      //         },
      //       }
      //     )
      //   )
      //   : []
      // )
    // ),
  };

  const resolvedJzodSchema:JzodElement = useMemo(
    () => {
      if (!context.miroirFundamentalJzodSchema || context.miroirFundamentalJzodSchema?.name == "dummyJzodSchema") {
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

        return configuration.status == "ok"? configuration.element : defaultObject;
      }
    },
    [context.miroirFundamentalJzodSchema, rawSchema, formState]
  );

  log.info("resolvedJzodSchema", resolvedJzodSchema, context?.miroirFundamentalJzodSchema?.name, "rawSchema", rawSchema)


  // ##############################################################################################
  const onSubmit = useCallback(
    async (actionCreateEntityParamValues: any /* actually follows formJzodSchema */, formikFunctions:{ setSubmitting:any, setErrors:any }) => {
      try {
        //  Send values somehow
        setformHelperState(actionCreateEntityParamValues);

        log.info(
          "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ Concept.tsx onSubmit formik values actionCreateEntityParamValues",
          actionCreateEntityParamValues,
          // "newApplicationName",
          // actionCreateEntityParamValues.newApplicationName,
          // "newDeploymentUuid",
          // actionCreateEntityParamValues.newDeploymentUuid,
          // "newSelfApplicationUuid",
          // actionCreateEntityParamValues.newSelfApplicationUuid,
          // "newAdminAppApplicationUuid",
          // actionCreateEntityParamValues.newAdminAppApplicationUuid,
        );


        const newEntity: MetaEntity = {
          uuid: newEntityUuid,
          parentUuid: entityEntity.uuid,
          selfApplication: currentApplicationUuid,
          description: createEntity_newEntityDescription,
          name: actionCreateEntityParamValues.newEntityName,
        }

        const actionEffectiveParamsCreateEntity /** parsed by actionHandlerCreateEntity.interface.actionJzodObjectSchema */ = {
          currentApplicationName: "Paris",
          currentApplicationUuid: currentApplicationUuid,
          currentDeploymentUuid: currentDeploymentUuid,
          createEntity_newEntityName: actionCreateEntityParamValues.newEntityName,
          // createEntity_newEntityDescription: createEntity_newEntityDescription,
          createEntity_newEntityDescription: actionCreateEntityParamValues.newEntityDescription,
          createEntity_newEntityUuid: newEntityUuid,
          createEntity_newEntityDefinitionUuid: newEntityDefinitionUuid,
          createEntity_newEntityDetailsReportUuid: uuidv4(),
          createEntity_newEntityListReportUuid: uuidv4(),
          adminConfigurationDeploymentParis,
          //TODO: tag params, should be passed as context instead?
          jzodSchema,
          entityEntityDefinition,
          entityReport,
          createEntity_newEntity: newEntity,
          entityMenu,
        }
      
        // const actionHandlerCreateFountainEntity: CompositeActionTemplate = {
        //   actionType: "compositeAction",
        //   actionName: "sequence",
        //   // interface: {
        //   //   actionJzodObjectSchema: {
        //   //     type: "object",
        //   //     definition: {
        //   //       newEntityName: {
        //   //         type: "string"
        //   //       },
        //   //       newEntityDescription: {
        //   //         type: "string"
        //   //       },
        //   //       newEntityUuid: {
        //   //         type: "uuid"
        //   //       },
        //   //       currentApplicationUuid: {
        //   //         type: "uuid"
        //   //       },
        //   //       currentDeploymentUuid: {
        //   //         type: "uuid"
        //   //       },
        //   //       newEntityDefinitionUuid: {
        //   //         type: "uuid"
        //   //       },
        //   //       newEntityDetailsReportUuid: {
        //   //         type: "uuid"
        //   //       },
        //   //       newEntityListReportUuid: {
        //   //         type: "uuid"
        //   //       }
        //   //     }
        //   //   }
        //   // },
        //   // implementation: {
        //   templates: {
        //     newEntityDefinition: {
        //       name: {
        //         transformerType: "parameterReference",
        //         referenceName: "createEntity_newEntityName",
        //       },
        //       uuid: {
        //         transformerType: "parameterReference",
        //         referenceName: "createEntity_newEntityDefinitionUuid",
        //       },
        //       parentName: "EntityDefinition",
        //       parentUuid: {
        //         transformerType: "mustacheStringTemplate",
        //         definition: "{{entityEntityDefinition.uuid}}",
        //       },
        //       entityUuid: {
        //         transformerType: "mustacheStringTemplate",
        //         definition: "{{createEntity_newEntity.uuid}}",
        //       },
        //       conceptLevel: "Model",
        //       defaultInstanceDetailsReportUuid: {
        //         transformerType: "parameterReference",
        //         referenceName: "createEntity_newEntityDetailsReportUuid",
        //       },
        //       jzodSchema: {
        //         transformerType: "parameterReference",
        //         referenceName: "jzodSchema",
        //       },
        //     },
        //     // list of instances Report Definition
        //     newEntityListReport: {
        //       uuid: {
        //         transformerType: "parameterReference",
        //         referenceName: "createEntity_newEntityListReportUuid",
        //       },
        //       selfApplication: {
        //         transformerType: "parameterReference",
        //         referenceName: "currentApplicationUuid",
        //       },
        //       parentName: "Report",
        //       parentUuid: {
        //         transformerType: "mustacheStringTemplate",
        //         definition: "{{entityReport.uuid}}",
        //       },
        //       conceptLevel: "Model",
        //       name: {
        //         transformerType: "mustacheStringTemplate",
        //         definition: "{{createEntity_newEntityName}}List",
        //       },
        //       defaultLabel: {
        //         transformerType: "mustacheStringTemplate",
        //         definition: "List of {{createEntity_newEntityName}}s",
        //       },
        //       type: "list",
        //       definition: {
        //         extractors: {
        //           instanceList: {
        //             extractorOrCombinerType: "extractorByEntityReturningObjectList",
        //             parentName: {
        //               transformerType: "parameterReference",
        //               referenceName: "createEntity_newEntityName",
        //             },
        //             parentUuid: {
        //               transformerType: "mustacheStringTemplate",
        //               definition: "{{createEntity_newEntity.uuid}}",
        //             },
        //           },
        //         },
        //         section: {
        //           type: "objectListReportSection",
        //           definition: {
        //             label: {
        //               transformerType: "mustacheStringTemplate",
        //               definition: "{{createEntity_newEntityName}}s",
        //             },
        //             parentUuid: {
        //               transformerType: "mustacheStringTemplate",
        //               definition: "{{createEntity_newEntity.uuid}}",
        //             },
        //             fetchedDataReference: "instanceList",
        //           },
        //         },
        //       },
        //     },
        //     // Details of an instance Report Definition
        //     newEntityDetailsReport: {
        //       uuid: {
        //         transformerType: "parameterReference",
        //         referenceName: "createEntity_newEntityDetailsReportUuid",
        //       },
        //       selfApplication: {
        //         transformerType: "parameterReference",
        //         referenceName: "currentApplicationUuid",
        //       },
        //       parentName: {
        //         transformerType: "mustacheStringTemplate",
        //         definition: "{{entityReport.name}}",
        //       },
        //       parentUuid: {
        //         transformerType: "mustacheStringTemplate",
        //         definition: "{{entityReport.uuid}}",
        //       },
        //       conceptLevel: "Model",
        //       name: {
        //         transformerType: "mustacheStringTemplate",
        //         definition: "{{createEntity_newEntityName}}Details",
        //       },
        //       defaultLabel: {
        //         transformerType: "mustacheStringTemplate",
        //         definition: "Details of {{createEntity_newEntityName}}",
        //       },
        //       definition: {
        //         extractorTemplates: {
        //           elementToDisplay: {
        //             extractorTemplateType: "extractorForObjectByDirectReference",
        //             parentName: {
        //               transformerType: "parameterReference",
        //               referenceName: "createEntity_newEntityName",
        //             },
        //             parentUuid: {
        //               transformerType: "freeObjectTemplate",
        //               definition: {
        //                 transformerType: "constantString",
        //                 value: {
        //                   transformerType: "mustacheStringTemplate",
        //                   definition: "{{createEntity_newEntity.uuid}}",
        //                 },
        //               },
        //             },
        //             instanceUuid: {
        //               transformerType: "constantObject",
        //               value: {
        //                 transformerType: "parameterReference",
        //                 referenceName: "instanceUuid",
        //               },
        //             },
        //           },
        //         },
        //         section: {
        //           type: "list",
        //           definition: [
        //             {
        //               type: "objectInstanceReportSection",
        //               definition: {
        //                 label: {
        //                   transformerType: "mustacheStringTemplate",
        //                   definition: "My {{createEntity_newEntityName}}",
        //                 },
        //                 parentUuid: {
        //                   transformerType: "mustacheStringTemplate",
        //                   definition: "{{createEntity_newEntity.uuid}}",
        //                 },
        //                 fetchedDataReference: "elementToDisplay",
        //               },
        //             },
        //           ],
        //         },
        //       },
        //     },
        //   },
        //   definition: [
        //     // createEntity
        //     {
        //       actionType: "modelAction",
        //       actionName: "createEntity",
        //       actionLabel: "createEntity",
        //       deploymentUuid: {
        //         transformerType: "parameterReference",
        //         referenceName: "currentDeploymentUuid",
        //       },
        //       endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        //       entities: [
        //         {
        //           entity: {
        //             transformerType: "parameterReference",
        //             referenceName: "createEntity_newEntity",
        //           },
        //           entityDefinition: {
        //             transformerType: "parameterReference",
        //             referenceName: "newEntityDefinition",
        //           },
        //         },
        //       ],
        //     },
        //     // createReports
        //     {
        //       actionType: "transactionalInstanceAction",
        //       actionLabel: "createReports",
        //       instanceAction: {
        //         actionType: "instanceAction",
        //         actionName: "createInstance",
        //         // applicationSection: "model",
        //         applicationSection: getApplicationSection(
        //           actionEffectiveParamsCreateEntity.currentDeploymentUuid,
        //           entityReport.uuid
        //         ),
        //         deploymentUuid: {
        //           transformerType: "parameterReference",
        //           referenceName: "currentDeploymentUuid",
        //         },
        //         endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
        //         objects: [
        //           {
        //             parentName: {
        //               transformerType: "mustacheStringTemplate",
        //               definition: "{{newEntityListReport.parentName}}",
        //             },
        //             parentUuid: {
        //               transformerType: "mustacheStringTemplate",
        //               definition: "{{newEntityListReport.parentUuid}}",
        //             },
        //             // applicationSection: "model",
        //             applicationSection: getApplicationSection(
        //               actionEffectiveParamsCreateEntity.currentDeploymentUuid,
        //               entityReport.uuid
        //             ),
        //             instances: [
        //               {
        //                 transformerType: "parameterReference",
        //                 referenceName: "newEntityListReport",
        //               },
        //               {
        //                 transformerType: "parameterReference",
        //                 referenceName: "newEntityDetailsReport",
        //               },
        //             ],
        //           },
        //         ],
        //       },
        //     },
        //     // commit
        //     {
        //       actionName: "commit",
        //       actionType: "modelAction",
        //       actionLabel: "commit",
        //       endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        //       deploymentUuid: {
        //         transformerType: "parameterReference",
        //         referenceName: "currentDeploymentUuid",
        //       },
        //     },
        //   ],
        // };
        // log.info(
        //   "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ onSubmit formik values actionCreateEntityParamValues",
        //   actionHandlerCreateFountainEntity,
        //   "actionEffectiveParamsCreateEntity",
        //   actionEffectiveParamsCreateEntity,
        // );

        // const createNewEntityResult = await domainController.handleCompositeActionTemplate(
        //   actionHandlerCreateFountainEntity,
        //   actionEffectiveParamsCreateEntity,
        //   currentModel
        // );
        log.info("store opened with uuid", actionCreateEntityParamValues.newDeploymentUuid)

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
    [rawSchema, formState, context, currentApplicationUuid, currentDeploymentUuid]
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
                      <JzodElementEditor
                        name={'ROOT'}
                        listKey={'ROOT'}
                        rootLesslistKey={emptyString}
                        rootLesslistKeyArray={emptyList}
                        label={pageLabel}
                        currentDeploymentUuid={emptyString}
                        currentApplicationSection={dataSection}
                        // resolvedJzodSchema={actionsJzodSchema}
                        rawJzodSchema={rawSchema}
                        resolvedElementJzodSchema={resolvedJzodSchema}
                        foreignKeyObjects={emptyObject}
                        handleChange={formik.handleChange as any}
                        formik={formik}
                        setFormState={setFormState}
                        // formState={formState}
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
    </>
  )
}