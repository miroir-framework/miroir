import { ChangeEvent, FC, useCallback, useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from 'uuid';
import { z } from "zod";
// import * as XLSX from 'xlsx/xlsx.mjs';
import { Formik } from "formik";
import {
  CompositeActionTemplate,
  DomainControllerInterface,
  EntityInstance,
  JzodAttributePlainStringWithValidations,
  JzodElement,
  JzodObject,
  JzodPlainAttribute,
  LoggerInterface,
  MetaEntity,
  MetaModel,
  MiroirLoggerFactory,
  TransformerForRuntime,
  Uuid,
  adminConfigurationDeploymentAdmin,
  adminConfigurationDeploymentMiroir,
  entityApplicationForAdmin,
  entityDeployment,
  entityEntity,
  entityEntityDefinition,
  entityMenu,
  entityReport,
  entitySelfApplication,
  metaModel,
  jzodTypeCheck
} from "miroir-core";
import * as XLSX from 'xlsx';
import { adminConfigurationDeploymentParis, applicationParis, packageName } from "../../constants.js";
import { JzodElementEditor } from "./components/ValueObjectEditor/JzodElementEditor.js";
import { cleanLevel } from "./constants.js";
import { useDomainControllerService, useErrorLogService, useMiroirContextService } from "./MiroirContextReactProvider.js";
import { useCurrentModel } from "./ReduxHooks.js";


let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "importer"), "UI",
).then((logger: LoggerInterface) => {log = logger});


export const ImporterCorePropsSchema = z.object({
  filename:z.string(),
  // currentModel: ApplicationModelSchema,
  currentModel: metaModel,
  currentDeploymentUuid: z.string().uuid(),
  currentApplicationUuid: z.string().uuid(),
})

export type ImporterCoreProps = z.infer<typeof ImporterCorePropsSchema>;

const imageMimeType = /image\/(png|jpg|jpeg)/i;
const excelMimeType = /application\//i;

const pageLabel = "Importer";
const emptyString = ""
const dataSection = "data"
const emptyList:any[] = []
const emptyObject = {}

const defaultObject: JzodObject = {
  type: "object",
  definition: {}
} as JzodObject

const initialValues = {
  // newApplicationName: "placeholder...",
  newApplicationName: "Paris",
  newAdminAppApplicationUuid: applicationParis.uuid,
  newSelfApplicationUuid: applicationParis.selfApplication,
  newDeploymentUuid: adminConfigurationDeploymentParis.uuid,
}

// ################################################################################################
export const Importer:FC<ImporterCoreProps> = (props:ImporterCoreProps) => {

  const [file, setFile] = useState(null);
  const [fileDataURL, setFileDataURL] = useState<any>(null);
  const [fileData, setFileData] = useState<string[]>([]);
  const [currentWorkSheet, setCurrentWorkSheet] = useState<XLSX.WorkSheet | undefined>(undefined);

  const errorLog = useErrorLogService();
  const context = useMiroirContextService();
  const domainController: DomainControllerInterface = useDomainControllerService();

  const changeHandler = (e:any) => {
    const file = e.target.files[0];
    if (!file.type.match(excelMimeType)) {
      alert("excel mime type is not valid: " + file.type);
      return;
    }
    setFile(file);
  }
  useEffect(() => {
    let fileReader:FileReader, isCancel = false;
    if (file) {
      fileReader = new FileReader();
      fileReader.onload = (e:ProgressEvent<FileReader>) => {
        const result = e.target?.result;
        if (result && !isCancel) {
          setFileDataURL(result);
          const workBook: XLSX.WorkBook = XLSX.read(result, {type: 'binary'});
          log.info('found excel workbook',workBook);
          const workSheetName: string = workBook.SheetNames[0];
          log.info('found excel workSheetName',workSheetName);
          const workSheet: XLSX.WorkSheet = workBook.Sheets[workSheetName];
          log.info('found excel workSheet',workSheet);
          const data: any = XLSX.utils.sheet_to_json(workSheet, {header:"A"});
          // headers = data[0];
          setFileData(data);
          setCurrentWorkSheet(workSheet)
          log.info('found excel data',data);
          
        }

          //     // const bstr: string = e.target.result;
 
      }
      fileReader.readAsBinaryString(file);
    }
    return () => {
      isCancel = true;
      if (fileReader && fileReader.readyState === 1) {
        fileReader.abort();
      }
    }

  }, [file]);


  
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // const actionHandlerCreateApplication: ActionHandler = useMemo(()=> ({
  //   interface: {
  //     actionJzodObjectSchema: {
  //       type: "object",
  //       definition: {
  //         newApplicationName: {
  //           type: "string"
  //         },
  //         newAdminAppApplicationUuid: {
  //           type: "uuid"
  //         },
  //         newSelfApplicationUuid: {
  //           type: "uuid"
  //         },
  //         newDeploymentUuid: {
  //           type: "uuid"
  //         },
  //       }
  //     },
  //   },
  //   implementation: {
  //     templates: {
  //     },
  //     compositeActionTemplate: {
  //       actionType: "compositeAction",
  //       actionName: "sequence",
  //       definition: [
  //         // {
  //         //   actionType: "domainAction",
  //         //   domainAction: {
  //         //     actionType: "storeManagementAction",
  //         //     actionName: "storeManagementAction_openStore",
  //         //     endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
  //         //     configuration: {
  //         //       transformerType: "innerFullObjectTemplate",
  //         //       definition: [
  //         //         {
  //         //           attributeKey: {
  //         //             transformerType: "getFromParameters",
  //         //             referenceName: "newDeploymentUuid",
  //         //           },
  //         //           attributeValue: {
  //         //             transformerType: "getFromParameters",
  //         //             referenceName: "newDeploymentStoreConfiguration",
  //         //           }
  //         //         }
  //         //       ],
  //         //     },
  //         //     deploymentUuid: {
  //         //       transformerType: "getFromParameters",
  //         //       referenceName: "newDeploymentUuid",
  //         //     },
  //         //   }
  //         // },
  //         // {
  //         //   actionType: "domainAction",
  //         //   domainAction: {
  //         //     transformerType: "getFromParameters",
  //         //     referenceName: "createStoreAction",
  //         //   }
  //         // },
  //         // {
  //         //   actionType: "domainAction",
  //         //   domainAction: {
  //         //     transformerType: "getFromParameters",
  //         //     referenceName: "resetAndInitAction",
  //         //   }
  //         // },
  //         // {
  //         //   actionType: "domainAction",
  //         //   domainAction: {
  //         //     transformerType: "getFromParameters",
  //         //     referenceName: "createSelfApplicationAction",
  //         //   }
  //         // },
  //         // {
  //         //   actionType: "domainAction",
  //         //   domainAction: {
  //         //     transformerType: "getFromParameters",
  //         //     referenceName: "createApplicationForAdminAction",
  //         //   }
  //         // },
  //         // {
  //         //   actionType: "domainAction",
  //         //   domainAction: {
  //         //     transformerType: "getFromParameters",
  //         //     referenceName: "createAdminDeploymentAction",
  //         //   }
  //         // },
  //         // {
  //         //   actionType: "domainAction",
  //         //   domainAction: {
  //         //     transformerType: "getFromParameters",
  //         //     referenceName: "createNewApplicationMenuAction",
  //         //   }
  //         // },
  //         // {
  //         //   actionType: "domainAction",
  //         //   domainAction: {
  //         //     transformerType: "getFromParameters",
  //         //     referenceName: "commitAction",
  //         //   }
  //         // },
  //       ],
  //     }
  //   },
  // }),[])

  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // const createEntity = (
  //   // fileData: string[][],
  //   // props: ImporterCoreProps
  //   newEntityUuid: Uuid,
  //   newEntityName: string,
  //   createEntity_newEntityDescription: string,
  //   newEntityDefinitionUuid: Uuid,
  // ) => {
  //   // const newEntityName = "Fountain";
  //   // const newEntityDescription = "Drinking Fountains of Paris";
  //   // const newEntityUuid = uuidv4();
  //   const currentApplicationUuid = props.currentApplicationUuid
  //   const currentDeploymentUuid = props.currentDeploymentUuid;


  //   const newEntity: MetaEntity = {
  //     uuid: newEntityUuid,
  //     parentUuid: entityEntity.uuid,
  //     selfApplication: currentApplicationUuid,
  //     description: createEntity_newEntityDescription,
  //     name: newEntityName,
  //   }
  //   log.info("createEntity fileData", fileData);
  //   const jzodSchema:JzodObject = {
  //     type: "object",
  //     definition: Object.assign(
  //       {},
  //       {
  //         uuid: {
  //           type: "string",
  //           validations: [{ type: "uuid" }],
  //           tag: { id: 1, defaultLabel: "Uuid", editable: false },
  //         },
  //         parentName: {
  //           type: "string",
  //           optional: true,
  //           tag: { id: 1, defaultLabel: "Uuid", editable: false },
  //         },
  //         parentUuid: {
  //           type: "string",
  //           validations: [{ type: "uuid" }],
  //           tag: { id: 1, defaultLabel: "parentUuid", editable: false },
  //         },
  //       },
  //       ...(
  //         fileData[0]?
  //         Object.values(fileData[0]).map(
  //           (a: string, index) => (
  //             {
  //               [a]: {
  //                 type: "string",
  //                 optional: true,
  //                 tag: { id: index + 2 /* uuid attribute has been added*/, defaultLabel: a, editable: true },
  //               },
  //             }
  //           )
  //         )
  //         : []
  //       )
  //     ),
  //   };

  //   // ############################################################################################
  //   const actionEffectiveParamsCreateEntity /** parsed by actionHandlerCreateEntity.interface.actionJzodObjectSchema */ = {
  //     currentApplicationName: "Paris",
  //     currentApplicationUuid: props.currentApplicationUuid,
  //     currentDeploymentUuid: props.currentDeploymentUuid,
  //     createEntity_newEntityName: newEntityName,
  //     createEntity_newEntityDescription: createEntity_newEntityDescription,
  //     createEntity_newEntityUuid: newEntityUuid,
  //     createEntity_newEntityDefinitionUuid: newEntityDefinitionUuid,
  //     createEntity_newEntityDetailsReportUuid: uuidv4(),
  //     createEntity_newEntityListReportUuid: uuidv4(),
  //     adminConfigurationDeploymentParis,
  //     //TODO: tag params, should be passed as context instead?
  //     jzodSchema,
  //     entityEntityDefinition,
  //     entityReport,
  //     createEntity_newEntity: newEntity,
  //     entityMenu,
  //   }

  //   const objectAttributeNames = fileData[0];
  //   fileData.splice(0,1) // side effect!!!
  //   const instances:EntityInstance[] = 
  //     fileData
  //     .map(
  //       (fileDataRow:any) => {
  //         return Object.fromEntries([
  //           ...Object.entries(fileDataRow).map((e: [string, any], index: number) => [
  //             objectAttributeNames[(e as any)[0]],
  //             e[1],
  //           ]),
  //           ["uuid", uuidv4()],
  //           ["parentName", actionEffectiveParamsCreateEntity.createEntity_newEntity.name],
  //           ["parentUuid", actionEffectiveParamsCreateEntity.createEntity_newEntity.uuid],
  //         ]) as EntityInstance;
  //       }
  //     ) 
  //   ;
  //   log.info('createEntity adding instances',instances);

  //   // const actionHandlerCreateFountainEntity: CompositeActionTemplate = {
  //   //   actionType: "compositeAction",
  //   //   actionName: "sequence",
  //   //   // interface: {
  //   //   //   actionJzodObjectSchema: {
  //   //   //     type: "object",
  //   //   //     definition: {
  //   //   //       newEntityName: {
  //   //   //         type: "string"
  //   //   //       },
  //   //   //       newEntityDescription: {
  //   //   //         type: "string"
  //   //   //       },
  //   //   //       newEntityUuid: {
  //   //   //         type: "uuid"
  //   //   //       },
  //   //   //       currentApplicationUuid: {
  //   //   //         type: "uuid"
  //   //   //       },
  //   //   //       currentDeploymentUuid: {
  //   //   //         type: "uuid"
  //   //   //       },
  //   //   //       newEntityDefinitionUuid: {
  //   //   //         type: "uuid"
  //   //   //       },
  //   //   //       newEntityDetailsReportUuid: {
  //   //   //         type: "uuid"
  //   //   //       },
  //   //   //       newEntityListReportUuid: {
  //   //   //         type: "uuid"
  //   //   //       }
  //   //   //     }
  //   //   //   }
  //   //   // },
  //   //   // implementation: {
  //   //   templates: {
  //   //     newEntityDefinition: {
  //   //       name: {
  //   //         transformerType: "getFromParameters",
  //   //         referenceName: "createEntity_newEntityName",
  //   //       },
  //   //       uuid: {
  //   //         transformerType: "getFromParameters",
  //   //         referenceName: "createEntity_newEntityDefinitionUuid",
  //   //       },
  //   //       parentName: "EntityDefinition",
  //   //       parentUuid: {
  //   //         transformerType: "mustacheStringTemplate",
  //   //         definition: "{{entityEntityDefinition.uuid}}",
  //   //       },
  //   //       entityUuid: {
  //   //         transformerType: "mustacheStringTemplate",
  //   //         definition: "{{createEntity_newEntity.uuid}}",
  //   //       },
  //   //       conceptLevel: "Model",
  //   //       defaultInstanceDetailsReportUuid: {
  //   //         transformerType: "getFromParameters",
  //   //         referenceName: "createEntity_newEntityDetailsReportUuid",
  //   //       },
  //   //       jzodSchema: {
  //   //         transformerType: "getFromParameters",
  //   //         referenceName: "jzodSchema",
  //   //       },
  //   //     },
  //   //     // list of instances Report Definition
  //   //     newEntityListReport: {
  //   //       uuid: {
  //   //         transformerType: "getFromParameters",
  //   //         referenceName: "createEntity_newEntityListReportUuid",
  //   //       },
  //   //       selfApplication: {
  //   //         transformerType: "getFromParameters",
  //   //         referenceName: "currentApplicationUuid",
  //   //       },
  //   //       parentName: "Report",
  //   //       parentUuid: {
  //   //         transformerType: "mustacheStringTemplate",
  //   //         definition: "{{entityReport.uuid}}",
  //   //       },
  //   //       conceptLevel: "Model",
  //   //       name: {
  //   //         transformerType: "mustacheStringTemplate",
  //   //         definition: "{{createEntity_newEntityName}}List",
  //   //       },
  //   //       defaultLabel: {
  //   //         transformerType: "mustacheStringTemplate",
  //   //         definition: "List of {{createEntity_newEntityName}}s",
  //   //       },
  //   //       type: "list",
  //   //       definition: {
  //   //         extractors: {
  //   //           instanceList: {
  //   //             extractorOrCombinerType: "extractorByEntityReturningObjectList",
  //   //             parentName: {
  //   //               transformerType: "getFromParameters",
  //   //               referenceName: "createEntity_newEntityName",
  //   //             },
  //   //             parentUuid: {
  //   //               transformerType: "mustacheStringTemplate",
  //   //               definition: "{{createEntity_newEntity.uuid}}",
  //   //             },
  //   //           },
  //   //         },
  //   //         section: {
  //   //           type: "objectListReportSection",
  //   //           definition: {
  //   //             label: {
  //   //               transformerType: "mustacheStringTemplate",
  //   //               definition: "{{createEntity_newEntityName}}s",
  //   //             },
  //   //             parentUuid: {
  //   //               transformerType: "mustacheStringTemplate",
  //   //               definition: "{{createEntity_newEntity.uuid}}",
  //   //             },
  //   //             fetchedDataReference: "instanceList",
  //   //           },
  //   //         },
  //   //       },
  //   //     },
  //   //     // Details of an instance Report Definition
  //   //     newEntityDetailsReport: {
  //   //       uuid: {
  //   //         transformerType: "getFromParameters",
  //   //         referenceName: "createEntity_newEntityDetailsReportUuid",
  //   //       },
  //   //       selfApplication: {
  //   //         transformerType: "getFromParameters",
  //   //         referenceName: "currentApplicationUuid",
  //   //       },
  //   //       parentName: {
  //   //         transformerType: "mustacheStringTemplate",
  //   //         definition: "{{entityReport.name}}",
  //   //       },
  //   //       parentUuid: {
  //   //         transformerType: "mustacheStringTemplate",
  //   //         definition: "{{entityReport.uuid}}",
  //   //       },
  //   //       conceptLevel: "Model",
  //   //       name: {
  //   //         transformerType: "mustacheStringTemplate",
  //   //         definition: "{{createEntity_newEntityName}}Details",
  //   //       },
  //   //       defaultLabel: {
  //   //         transformerType: "mustacheStringTemplate",
  //   //         definition: "Details of {{createEntity_newEntityName}}",
  //   //       },
  //   //       definition: {
  //   //         extractorTemplates: {
  //   //           elementToDisplay: {
  //   //             extractorTemplateType: "extractorForObjectByDirectReference",
  //   //             parentName: {
  //   //               transformerType: "getFromParameters",
  //   //               referenceName: "createEntity_newEntityName",
  //   //             },
  //   //             parentUuid: {
  //   //               transformerType: "createObject",
  //   //               definition: {
  //   //                 transformerType: "constantString",
  //   //                 value: {
  //   //                   transformerType: "mustacheStringTemplate",
  //   //                   definition: "{{createEntity_newEntity.uuid}}",
  //   //                 },
  //   //               },
  //   //             },
  //   //             instanceUuid: {
  //   //               transformerType: "constantObject",
  //   //               value: {
  //   //                 transformerType: "getFromParameters",
  //   //                 referenceName: "instanceUuid",
  //   //               },
  //   //             },
  //   //           },
  //   //         },
  //   //         section: {
  //   //           type: "list",
  //   //           definition: [
  //   //             {
  //   //               type: "objectInstanceReportSection",
  //   //               definition: {
  //   //                 label: {
  //   //                   transformerType: "mustacheStringTemplate",
  //   //                   definition: "My {{createEntity_newEntityName}}",
  //   //                 },
  //   //                 parentUuid: {
  //   //                   transformerType: "mustacheStringTemplate",
  //   //                   definition: "{{createEntity_newEntity.uuid}}",
  //   //                 },
  //   //                 fetchedDataReference: "elementToDisplay",
  //   //               },
  //   //             },
  //   //           ],
  //   //         },
  //   //       },
  //   //     },
  //   //   },
  //   //   definition: [
  //   //     // createEntity
  //   //     {
  //   //       actionType: "modelAction",
  //   //       actionName: "createEntity",
  //   //       actionLabel: "createEntity",
  //   //       deploymentUuid: {
  //   //         transformerType: "getFromParameters",
  //   //         referenceName: "currentDeploymentUuid",
  //   //       },
  //   //       endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
  //   //       entities: [
  //   //         {
  //   //           entity: {
  //   //             transformerType: "getFromParameters",
  //   //             referenceName: "createEntity_newEntity",
  //   //           },
  //   //           entityDefinition: {
  //   //             transformerType: "getFromParameters",
  //   //             referenceName: "newEntityDefinition",
  //   //           },
  //   //         },
  //   //       ],
  //   //     },
  //   //     // createReports
  //   //     {
  //   //       actionType: "transactionalInstanceAction",
  //   //       actionLabel: "createReports",
  //   //       instanceAction: {
  //   //         actionType: "instanceAction",
  //   //         actionName: "createInstance",
  //   //         applicationSection: "model",
  //   //         deploymentUuid: {
  //   //           transformerType: "getFromParameters",
  //   //           referenceName: "currentDeploymentUuid",
  //   //         },
  //   //         endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
  //   //         objects: [
  //   //           {
  //   //             parentName: {
  //   //               transformerType: "mustacheStringTemplate",
  //   //               definition: "{{newEntityListReport.parentName}}",
  //   //             },
  //   //             parentUuid: {
  //   //               transformerType: "mustacheStringTemplate",
  //   //               definition: "{{newEntityListReport.parentUuid}}",
  //   //             },
  //   //             applicationSection: "model",
  //   //             instances: [
  //   //               {
  //   //                 transformerType: "getFromParameters",
  //   //                 referenceName: "newEntityListReport",
  //   //               },
  //   //               {
  //   //                 transformerType: "getFromParameters",
  //   //                 referenceName: "newEntityDetailsReport",
  //   //               },
  //   //             ],
  //   //           },
  //   //         ],
  //   //       },
  //   //     },
  //   //     // commit
  //   //     {
  //   //       actionName: "commit",
  //   //       actionType: "modelAction",
  //   //       actionLabel: "commit",
  //   //       endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
  //   //       deploymentUuid: {
  //   //         transformerType: "getFromParameters",
  //   //         referenceName: "currentDeploymentUuid",
  //   //       },
  //   //       // action: {
  //   //       //   transformerType: "getFromParameters",
  //   //       //   referenceName: "commitAction",
  //   //       // },
  //   //     },
  //   //     // instances for new Entity, put in "menuUpdateQueryResult"
  //   //     {
  //   //       actionType: "compositeRunBoxedQueryTemplateAction",
  //   //       nameGivenToResult: "menuUpdateQueryResult",
  //   //       queryTemplate: {
  //   //         // actionType: "runBoxedQueryTemplateOrBoxedExtractorTemplateAction",
  //   //         actionType: "runBoxedQueryTemplateAction",
  //   //         actionName: "runQuery",
  //   //         endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
  //   //         applicationSection: "model",
  //   //         deploymentUuid: {
  //   //           transformerType: "getFromParameters",
  //   //           referenceName: "currentDeploymentUuid",
  //   //         },
  //   //         query: {
  //   //           queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
  //   //           deploymentUuid: {
  //   //             transformerType: "getFromParameters",
  //   //             referenceName: "currentDeploymentUuid",
  //   //           },
  //   //           // runAsSql: true,
  //   //           pageParams: {},
  //   //           queryParams: {},
  //   //           contextResults: {},
  //   //           extractorTemplates: {
  //   //             menuList: {
  //   //               extractorTemplateType: "extractorTemplateForObjectListByEntity",
  //   //               applicationSection: "model",
  //   //               parentName: "Menu",
  //   //               parentUuid: {
  //   //                 transformerType: "createObject",
  //   //                 definition: {
  //   //                   transformerType: {
  //   //                     transformerType: "constantString",
  //   //                     value: "constantUuid",
  //   //                   },
  //   //                   value: {
  //   //                     transformerType: "mustacheStringTemplate",
  //   //                     definition: "{{entityMenu.uuid}}",
  //   //                   },
  //   //                 },
  //   //               },
  //   //             },
  //   //           },
  //   //           runtimeTransformers: {
  //   //             // menuList: {
  //   //             //   transformerType: "getObjectValues",
  //   //             //   interpolation: "runtime",
  //   //             //   referencedTransformer: "menuUuidIndex",
  //   //             // },
  //   //             menu: {
  //   //               transformerType: "pickFromList",
  //   //               interpolation: "runtime",
  //   //               applyTo: {
  //   //                 referenceType: "referencedTransformer",
  //   //                 reference: {
  //   //                   transformerType: "getFromContext",
  //   //                   interpolation: "runtime",
  //   //                   referenceName: "menuList",
  //   //                 }
  //   //               },
  //   //               // referencedTransformer: "menuList",
  //   //               index: 1,
  //   //             },
  //   //             menuItem: {
  //   //               transformerType: "createObject",
  //   //               definition: {
  //   //                 reportUuid: {
  //   //                   transformerType: "mustacheStringTemplate",
  //   //                   definition: "{{createEntity_newEntityListReportUuid}}",
  //   //                 },
  //   //                 label: {
  //   //                   transformerType: "mustacheStringTemplate",
  //   //                   definition: "List of {{createEntity_newEntityName}}",
  //   //                 },
  //   //                 section: "data",
  //   //                 selfApplication: {
  //   //                   transformerType: "mustacheStringTemplate",
  //   //                   definition: "{{adminConfigurationDeploymentParis.uuid}}",
  //   //                 }, // TODO: replace with selfApplication uuid, this is a deployment at the moment
  //   //                 icon: "local_drink",
  //   //               },
  //   //             },
  //   //             updatedMenu: {
  //   //               transformerType: "transformer_menu_addItem",
  //   //               interpolation: "runtime",
  //   //               transformerDefinition: {
  //   //                 menuItemReference: {
  //   //                   transformerType: "getFromContext",
  //   //                   interpolation: "runtime",
  //   //                   referenceName: "menuItem",
  //   //                 },
  //   //                 menuReference: {
  //   //                   transformerType: "getFromContext",
  //   //                   interpolation: "runtime",
  //   //                   referenceName: "menu",
  //   //                 },
  //   //                 menuSectionItemInsertionIndex: -1,
  //   //               },
  //   //             },
  //   //           },
  //   //         },
  //   //       },
  //   //     },
  //   //     {
  //   //       actionType: "transactionalInstanceAction",
  //   //       actionLabel: "updateMenu",
  //   //       instanceAction: {
  //   //         actionType: "instanceAction",
  //   //         actionName: "updateInstance",
  //   //         applicationSection: "model",
  //   //         deploymentUuid: {
  //   //           transformerType: "getFromParameters",
  //   //           referenceName: "currentDeploymentUuid",
  //   //         },
  //   //         endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
  //   //         objects: [
  //   //           {
  //   //             parentName: entityMenu.name,
  //   //             parentUuid: entityMenu.uuid,
  //   //             applicationSection: "model",
  //   //             instances: [
  //   //               {
  //   //                 transformerType: "accessDynamicPath",
  //   //                 interpolation: "runtime",
  //   //                 objectAccessPath: [
  //   //                   {
  //   //                     transformerType: "getFromContext",
  //   //                     interpolation: "runtime",
  //   //                     referenceName: "menuUpdateQueryResult",
  //   //                   },
  //   //                   "updatedMenu",
  //   //                 ],
  //   //               },
  //   //             ],
  //   //           },
  //   //         ],
  //   //       },
  //   //     },
  //   //     // commit
  //   //     {
  //   //       actionName: "commit",
  //   //       actionType: "modelAction",
  //   //       actionLabel: "commit",
  //   //       endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
  //   //       deploymentUuid: {
  //   //         transformerType: "getFromParameters",
  //   //         referenceName: "currentDeploymentUuid",
  //   //       },
  //   //     },
  //   //     // insert imported instances
  //   //     {
  //   //       actionType: "instanceAction",
  //   //       actionName: "createInstance",
  //   //       applicationSection: "data",
  //   //       deploymentUuid: {
  //   //         transformerType: "getFromParameters",
  //   //         referenceName: "currentDeploymentUuid",
  //   //       },
  //   //       endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
  //   //       objects: [
  //   //         {
  //   //           parentName: {
  //   //             transformerType: "mustacheStringTemplate",
  //   //             definition: "{{createEntity_newEntity.name}}",
  //   //           },
  //   //           parentUuid: {
  //   //             transformerType: "mustacheStringTemplate",
  //   //             definition: "{{createEntity_newEntity.uuid}}",
  //   //           },
  //   //           applicationSection: "data",
  //   //           instances: instances,
  //   //         },
  //   //       ],
  //   //     },
  //   //     // rollback / refresh
  //   //     {
  //   //       actionName: "rollback",
  //   //       actionType: "modelAction",
  //   //       actionLabel: "rollback",
  //   //       endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
  //   //       deploymentUuid: {
  //   //         transformerType: "getFromParameters",
  //   //         referenceName: "currentDeploymentUuid",
  //   //       },
  //   //     },
  //   //   ],
  //   // };

  //   return {
  //     actionHandlerCreateFountainEntity,
  //     actionEffectiveParamsCreateEntity,
  //   }
  // }

  // ##############################################################################################
  // ##############################################################################################
  // SPLIT ENTITY
  // ##############################################################################################
  // ##############################################################################################
  // const splitEntity = (
  //   splittedEntityUuid: Uuid,
  //   splittedEntityName: string,
  //   splittedEntityAttribute: string,
  //   splittedEntityDefinitionUuid: Uuid,
  //   newEntityUuid: Uuid,
  //   newEntityName: string,
  // ):{
  //   actionSplitFountainEntity: CompositeActionTemplate,
  //   actionSplitFountainEntityParams: Record<string, any>,
  // } => {
  //   const newEntityDescription = "Municipalities";
  //   // const currentApplicationUuid = props.currentApplicationUuid;
  //   const currentDeploymentUuid = props.currentDeploymentUuid;
  //   const splitEntity_newEntityDetailsReportUuid: string = uuidv4();
  //   // const menuUuid: string = "dd168e5a-2a21-4d2d-a443-032c6d15eb22";

  //   const pageParams = {
  //     deploymentUuid: currentDeploymentUuid,
  //     applicationSection: "data",
  //   };

  //   const actionSplitFountainEntityParams = {
  //     currentApplicationUuid: props.currentApplicationUuid,
  //     currentDeploymentUuid: props.currentDeploymentUuid,
  //     splittedEntityName,
  //     splittedEntityUuid,
  //     splittedEntityDefinitionUuid,
  //     splittedEntityAttribute: splittedEntityAttribute,
  //     splitEntity_newEntityUuid: newEntityUuid,
  //     splitEntity_newEntityName: newEntityName,
  //     splitEntity_newEntityDescription: newEntityDescription,
  //     splitEntity_newEntityListReportUuid: uuidv4(),
  //     splitEntity_newEntityDetailsReportUuid: splitEntity_newEntityDetailsReportUuid,
  //     splitEntity_newEntityDefinitionUuid: uuidv4(),
  //     adminConfigurationDeploymentParis,
  //     //TODO: tag params, should be passed as context instead?
  //     // jzodSchema,
  //     // splittedEntityDefinition, // !!!
  //     entityEntity,
  //     entityEntityDefinition,
  //     entityReport,
  //     // newEntity,
      
  //   }

  //   const compositeActionSplitFountainEntity: CompositeActionTemplate = {
  //     actionType: "compositeAction",
  //     actionName: "sequence",
  //     templates: {
  //       splitEntity_newEntity: {
  //         uuid: {
  //           transformerType: "getFromParameters",
  //           referenceName: "splitEntity_newEntityUuid",
  //         },
  //         name: {
  //           transformerType: "getFromParameters",
  //           referenceName: "splitEntity_newEntityName",
  //         },
  //         description: {
  //           transformerType: "getFromParameters",
  //           referenceName: "splitEntity_newEntityDescription",
  //         },
  //         parentName: "Entity",
  //         parentUuid: {
  //           transformerType: "mustacheStringTemplate",
  //           definition: "{{entityEntity.uuid}}",
  //         },
  //         selfApplication: {
  //           transformerType: "getFromParameters",
  //           referenceName: "currentApplicationUuid",
  //         },
  //       },
  //       splitEntity_newEntityJzodSchema: {
  //         type: "object",
  //         definition: {
  //           uuid: {
  //             type: "uuid",
  //             tag: { id: 1, defaultLabel: "Uuid", editable: false },
  //           } as JzodPlainAttribute,
  //           parentUuid: {
  //             type: "uuid",
  //             tag: { id: 1, defaultLabel: "Uuid", editable: false },
  //           } as JzodPlainAttribute,
  //           name: {
  //             type: "string",
  //             tag: { id: 2, defaultLabel: "name", editable: false },
  //           } as JzodAttributePlainStringWithValidations,
  //         },
  //       },
  //       splitEntity_newEntityDefinition: {
  //         name: {
  //           transformerType: "getFromParameters",
  //           referenceName: "splitEntity_newEntityName",
  //         },
  //         // uuid: actionSplitFountainEntityParams.splitEntity_newEntityDefinitionUuid,
  //         uuid: {
  //           transformerType: "getFromParameters",
  //           referenceName: "splitEntity_newEntityDefinitionUuid",
  //         },
  //         parentName: "EntityDefinition",
  //         parentUuid: {
  //           transformerType: "mustacheStringTemplate",
  //           definition: "{{entityEntityDefinition.uuid}}",
  //         },
  //         entityUuid: {
  //           transformerType: "mustacheStringTemplate",
  //           definition: "{{splitEntity_newEntity.uuid}}",
  //         },
  //         conceptLevel: "Model",
  //         defaultInstanceDetailsReportUuid: {
  //           transformerType: "getFromParameters",
  //           referenceName: "splitEntity_newEntityDetailsReportUuid",
  //         },
  //         jzodSchema: {
  //           transformerType: "getFromParameters",
  //           referenceName: "splitEntity_newEntityJzodSchema",
  //         },
  //       },
  //       splitEntity_newEntityListReport: {
  //         uuid: {
  //           transformerType: "getFromParameters",
  //           referenceName: "splitEntity_newEntityListReportUuid",
  //         },
  //         // uuid: actionSplitFountainEntityParams.splitEntity_newEntityListReportUuid,
  //         selfApplication: {
  //           transformerType: "getFromParameters",
  //           referenceName: "currentApplicationUuid",
  //         },
  //         parentName: "Report",
  //         parentUuid: "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
  //         conceptLevel: "Model",
  //         name: {
  //           transformerType: "mustacheStringTemplate",
  //           definition: "{{splitEntity_newEntityName}}List",
  //         },
  //         defaultLabel: {
  //           transformerType: "mustacheStringTemplate",
  //           definition: "List of {{splitEntity_newEntityDescription}}",
  //         },
  //         type: "list",
  //         definition: {
  //           extractors: {
  //             listReportSectionElements: {
  //               extractorOrCombinerType: "extractorByEntityReturningObjectList",
  //               parentName: {
  //                 transformerType: "getFromParameters",
  //                 referenceName: "splitEntity_newEntityName",
  //               },
  //               parentUuid: {
  //                 transformerType: "mustacheStringTemplate",
  //                 definition: "{{splitEntity_newEntity.uuid}}",
  //               },
  //             },
  //           },
  //           section: {
  //             type: "objectListReportSection",
  //             definition: {
  //               label: {
  //                 transformerType: "mustacheStringTemplate",
  //                 definition: "{{splitEntity_newEntityName}}(ies)",
  //               },
  //               parentName: "Municipality",
  //               parentUuid: {
  //                 transformerType: "mustacheStringTemplate",
  //                 definition: "{{splitEntity_newEntity.uuid}}",
  //               },
  //               fetchedDataReference: "listReportSectionElements",
  //             },
  //           },
  //         },
  //       },
  //       // TODO: use template / concat for uuid, name, defaultLabel
  //       splitEntity_newEntityDetailsReport: {
  //         uuid: {
  //           transformerType: "getFromParameters",
  //           referenceName: "splitEntity_newEntityDetailsReportUuid",
  //         },
  //         selfApplication: {
  //           transformerType: "getFromParameters",
  //           referenceName: "currentApplicationUuid",
  //         },
  //         parentName: "Report",
  //         parentUuid: {
  //           transformerType: "mustacheStringTemplate",
  //           definition: "{{entityReport.uuid}}",
  //         },
  //         conceptLevel: "Model",
  //         name: {
  //           transformerType: "mustacheStringTemplate",
  //           definition: "{{splitEntity_newEntityName}}Details",
  //         },
  //         defaultLabel: {
  //           transformerType: "mustacheStringTemplate",
  //           definition: "Details of {{splitEntity_newEntityDescription}}",
  //         },
  //         definition: {
  //           extractorTemplates: {
  //             elementToDisplay: {
  //               extractorTemplateType: "extractorForObjectByDirectReference",
  //               parentName: {
  //                 transformerType: "getFromParameters",
  //                 referenceName: "splitEntity_newEntityName",
  //               },
  //               parentUuid: {
  //                 transformerType: "createObject",
  //                 definition: {
  //                   transformerType: "constantString",
  //                   value: {
  //                     transformerType: "getFromParameters",
  //                     referenceName: "splitEntity_newEntityUuid",
  //                   },
  //                 },
  //               },
  //               // parentUuid: {
  //               //   transformerType: "getFromParameters",
  //               //   referenceName: "splitEntity_newEntityUuid",
  //               // },
  //               instanceUuid: {
  //                 transformerType: "constantObject",
  //                 value: {
  //                   transformerType: "constantObject",
  //                   interpolation: "runtime",
  //                   value: {
  //                     transformerType: "getFromParameters",
  //                     referenceName: "instanceUuid",
  //                   },
  //                 },
  //               },
  //             },
  //             fountainsOfMunicipality: {
  //               extractorTemplateType: "combinerByRelationReturningObjectList",
  //               parentName: "Fountain",
  //               parentUuid: {
  //                 transformerType: "getFromParameters",
  //                 referenceName: "splittedEntityUuid",
  //               },
  //               objectReference: {
  //                 transformerType: "constantObject",
  //                 value: {
  //                   transformerType: "constantObject",
  //                   interpolation: "runtime",
  //                   value: {
  //                     transformerType: "getFromContext",
  //                     interpolation: "runtime",
  //                     referenceName: "elementToDisplay",
  //                   },
  //                 },
  //               },
  //               AttributeOfListObjectToCompareToReferenceUuid: {
  //                 transformerType: "constantObject",
  //                 value: {
  //                   transformerType: "getFromParameters",
  //                   interpolation: "runtime",
  //                   referenceName: "splitEntity_newEntityName",
  //                 },
  //               },
  //               // AttributeOfListObjectToCompareToReferenceUuid: newEntityName,
  //             },
  //           },
  //           section: {
  //             type: "list",
  //             definition: [
  //               {
  //                 type: "objectInstanceReportSection",
  //                 definition: {
  //                   label: "My " + newEntityName,
  //                   parentUuid: {
  //                     transformerType: "getFromParameters",
  //                     referenceName: "splitEntity_newEntityUuid",
  //                   },
  //                   fetchedDataReference: "elementToDisplay",
  //                 },
  //               },
  //               {
  //                 type: "objectListReportSection",
  //                 definition: {
  //                   label: {
  //                     transformerType: "mustacheStringTemplate",
  //                     definition: "{{splitEntity_newEntityName}}'s (${elementToDisplay.name}) {{splittedEntityName}}s",
  //                   },
  //                   parentName: {
  //                     transformerType: "getFromParameters",
  //                     referenceName: "splittedEntityName",
  //                   },
  //                   parentUuid: {
  //                     transformerType: "getFromParameters",
  //                     referenceName: "splittedEntityUuid",
  //                   },
  //                   fetchedDataReference: "fountainsOfMunicipality",
  //                   sortByAttribute: "name",
  //                 },
  //               },
  //             ],
  //           },
  //         },
  //       },
  //     },
  //     definition: [
  //       // createEntity
  //       {
  //         actionType: "modelAction",
  //         actionName: "createEntity",
  //         actionLabel: "splitEntity_createEntity",
  //         deploymentUuid: {
  //           transformerType: "getFromParameters",
  //           referenceName: "currentDeploymentUuid",
  //         },
  //         endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
  //         entities: [
  //           {
  //             entity: {
  //               transformerType: "getFromParameters",
  //               referenceName: "splitEntity_newEntity",
  //             },
  //             entityDefinition: {
  //               transformerType: "getFromParameters",
  //               referenceName: "splitEntity_newEntityDefinition",
  //             },
  //           },
  //         ],
  //       },
  //       // updateSplittedEntityAction
  //       {
  //         actionType: "modelAction",
  //         actionName: "alterEntityAttribute",
  //         actionLabel: "splitEntity_updateSplittedEntityAction",
  //         deploymentUuid: {
  //           transformerType: "getFromParameters",
  //           referenceName: "currentDeploymentUuid",
  //         },
  //         endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
  //         entityName: {
  //           transformerType: "getFromParameters",
  //           referenceName: "splittedEntityName",
  //         },
  //         entityUuid: {
  //           transformerType: "getFromParameters",
  //           referenceName: "splittedEntityUuid",
  //         },
  //         // entityUuid: splittedEntityUuid,
  //         entityDefinitionUuid: {
  //           transformerType: "getFromParameters",
  //           referenceName: "splittedEntityDefinitionUuid",
  //         },
  //         // entityDefinitionUuid: splittedEntityDefinitionUuid,
  //         addColumns: [
  //           {
  //             name: {
  //               transformerType: "getFromParameters",
  //               referenceName: "splitEntity_newEntityName",
  //             },
  //             definition: {
  //               type: "string",
  //               validations: [{ type: "uuid" }],
  //               nullable: true, // TODO: make non-nullable and enforce FK after migration has been done!
  //               tag: {
  //                 value: {
  //                   defaultLabel: "Municipality",
  //                   targetEntity: {
  //                     transformerType: "getFromContext",
  //                     referenceName: "splitEntity_newEntityUuid",
  //                   },
  //                 },
  //               },
  //             },
  //           },
  //         ],
  //       },
  //       // commit
  //       {
  //         actionName: "commit",
  //         actionType: "modelAction",
  //         actionLabel: "splitEntity_updateSplittedEntityAction_commit",
  //         endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
  //         deploymentUuid: {
  //           transformerType: "getFromParameters",
  //           referenceName: "currentDeploymentUuid",
  //         },
  //       },
  //       // insert createEntity_newEntity "List" and "Details" Reports
  //       {
  //         actionType: "transactionalInstanceAction",
  //         actionLabel: "splitEntity_createReports",
  //         instanceAction: {
  //           actionType: "instanceAction",
  //           actionName: "createInstance",
  //           applicationSection: "model",
  //           deploymentUuid: {
  //             transformerType: "getFromParameters",
  //             referenceName: "currentDeploymentUuid",
  //           },
  //           endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
  //           objects: [
  //             {
  //               parentName: {
  //                 transformerType: "mustacheStringTemplate",
  //                 definition: "{{splitEntity_newEntityListReport.parentName}}",
  //               },
  //               parentUuid: {
  //                 transformerType: "mustacheStringTemplate",
  //                 definition: "{{splitEntity_newEntityListReport.parentUuid}}",
  //               },
  //               applicationSection: "model",
  //               instances: [
  //                 {
  //                   transformerType: "getFromParameters",
  //                   referenceName: "splitEntity_newEntityListReport",
  //                 },
  //                 {
  //                   transformerType: "getFromParameters",
  //                   referenceName: "splitEntity_newEntityDetailsReport",
  //                 },
  //               ],
  //             },
  //           ],
  //         },
  //       },
  //       // commit
  //       {
  //         actionName: "commit",
  //         actionType: "modelAction",
  //         actionLabel: "splitEntity_createReports_commit",
  //         endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
  //         deploymentUuid: {
  //           transformerType: "getFromParameters",
  //           referenceName: "currentDeploymentUuid",
  //         },
  //       },
  //       // refresh / rollback
  //       {
  //         actionName: "rollback",
  //         actionType: "modelAction",
  //         actionLabel: "splitEntity_refresh",
  //         endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
  //         deploymentUuid: {
  //           transformerType: "getFromParameters",
  //           referenceName: "currentDeploymentUuid",
  //         },
  //       },
  //     ],
  //   };

  //   const actionInsertMunicipalitiesParams: Record<string, any> = {
  //     currentApplicationUuid: props.currentApplicationUuid,
  //     currentDeploymentUuid: props.currentDeploymentUuid,
  //     // splittedEntityDefinition,
  //     splittedEntityUuid,
  //     splittedEntityName,
  //     splittedEntityAttribute,
  //     splitEntity_newEntityName: newEntityName,
  //     splitEntity_newEntityUuid: newEntityUuid,
  //     splitEntity_newEntityListReportUuid:actionSplitFountainEntityParams.splitEntity_newEntityListReportUuid,
  //     entityMenu,

  //   };

  //   const actionInsertMunicipalities: CompositeActionTemplate = {
  //     actionType: "compositeAction",
  //     actionLabel: "insertMunicipalities",
  //     actionName: "sequence",
  //     definition: [
  //       // find getUniqueValues municipalities from fountains
  //       {
  //         // actionType: "runBoxedQueryTemplateOrBoxedExtractorTemplateAction",
  //         actionType: "compositeRunBoxedQueryTemplateAction",
  //         actionLabel: "calculateNewEntityDefinionAndReports",
  //         nameGivenToResult: newEntityName,
  //         queryTemplate: {
  //           actionType: "runBoxedQueryTemplateAction",
  //           actionName: "runQuery",
  //           endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
  //           // applicationSection: "data",
  //           applicationSection: "model", // TODO: give only selfApplication section in individual queries?
  //           deploymentUuid: {
  //             transformerType: "getFromParameters",
  //             referenceName: "currentDeploymentUuid",
  //           },
  //           query: {
  //             // queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
  //             queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
  //             deploymentUuid: {
  //               transformerType: "getFromParameters",
  //               referenceName: "currentDeploymentUuid",
  //             },
  //             pageParams,
  //             queryParams: {},
  //             contextResults: {},
  //             extractorTemplates: {
  //               menuUuidIndex: {
  //                 extractorTemplateType: "extractorTemplateForObjectListByEntity",
  //                 applicationSection: "model",
  //                 parentName: "Menu",
  //                 parentUuid: {
  //                   transformerType: "createObject",
  //                   definition: {
  //                     transformerType: {
  //                       transformerType: "constantString",
  //                       value: "constantUuid",
  //                     },
  //                     value: {
  //                       transformerType: "mustacheStringTemplate",
  //                       definition: "{{entityMenu.uuid}}",
  //                     },
  //                   },
  //                 },
  //                 // parentUuid: {
  //                 //   transformerType: "mustacheStringTemplate",
  //                 //   definition: "{{entityMenu.uuid}}",
  //                 // },
  //               },
  //             },
  //             runtimeTransformers: {
  //               menuList: {
  //                 transformerType: "getObjectValues",
  //                 interpolation: "runtime",
  //                 applyTo: {
  //                   referenceType: "referencedTransformer",
  //                   reference: {
  //                     transformerType: "getFromContext",
  //                     interpolation: "runtime",
  //                     referenceName: "menuUuidIndex",
  //                   }
  //                 },
  //                 // referencedTransformer: "menuUuidIndex",
  //               },
  //               menu: {
  //                 transformerType: "pickFromList",
  //                 interpolation: "runtime",
  //                 applyTo: {
  //                   referenceType: "referencedTransformer",
  //                   reference: {
  //                     transformerType: "getFromContext",
  //                     interpolation: "runtime",
  //                     referenceName: "menuList",
  //                   }
  //                 },
  //                 // referencedTransformer: "menuList",
  //                 index: 1,
  //               },
  //               menuItem: {
  //                 transformerType: "createObject",
  //                 definition: {
  //                   label: {
  //                     transformerType: "mustacheStringTemplate",
  //                     definition: "List of {{splitEntity_newEntityName}}s",
  //                   },
  //                   section: "data",
  //                   selfApplication: {
  //                     transformerType: "mustacheStringTemplate",
  //                     definition: "{{adminConfigurationDeploymentParis.uuid}}",
  //                   }, // TODO: replace with selfApplication uuid, this is a deployment at the moment
  //                   reportUuid: {
  //                     transformerType: "getFromParameters",
  //                     referenceName: "splitEntity_newEntityListReportUuid",
  //                   },
  //                   icon: "location_on",
  //                 },
  //               },
  //               updatedMenu: {
  //                 transformerType: "transformer_menu_addItem",
  //                 interpolation: "runtime",
  //                 transformerDefinition: {
  //                   menuItemReference: {
  //                     transformerType: "getFromContext",
  //                     interpolation: "runtime",
  //                     referenceName: "menuItem",
  //                   },
  //                   menuReference: {
  //                     transformerType: "getFromContext",
  //                     interpolation: "runtime",
  //                     referenceName: "menu",
  //                   },
  //                   menuSectionItemInsertionIndex: -1,
  //                 },
  //               },
  //             },
  //           },
  //         },
  //       },
  //       // } as any, // TODO: why is type inferrence failing?
  //       // update Menu
  //       {
  //         actionType: "transactionalInstanceAction",
  //         actionLabel: "updateMenu",
  //         instanceAction: {
  //           actionType: "instanceAction",
  //           actionName: "updateInstance",
  //           applicationSection: "model",
  //           deploymentUuid: {
  //             transformerType: "getFromParameters",
  //             referenceName: "currentDeploymentUuid",
  //           },
  //           endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
  //           objects: [
  //             {
  //               parentName: {
  //                 transformerType: "mustacheStringTemplate",
  //                 definition: "{{entityMenu.name}}",
  //               },
  //               parentUuid: {
  //                 transformerType: "mustacheStringTemplate",
  //                 definition: "{{entityMenu.uuid}}",
  //               },
  //               // parentUuid: entityMenu.uuid,
  //               applicationSection: "model",
  //               instances: [
  //                 {
  //                   transformerType: "accessDynamicPath",
  //                   interpolation: "runtime",
  //                   objectAccessPath: [
  //                     {
  //                       transformerType: "createObject", // TODO: allow transformer inside inner accessDynamicPath in Query Templates!
  //                       definition: {
  //                         transformerType: "getFromContext",
  //                         interpolation: "runtime",
  //                         // referenceName: newEntityName,
  //                         referenceName: {
  //                           transformerType: "getFromParameters",
  //                           referenceName: "splitEntity_newEntityName",
  //                         },
  //                       },
  //                     } as any,
  //                     "updatedMenu",
  //                   ],
  //                 },
  //               ],
  //             },
  //           ],
  //         },
  //       },
  //       // commit
  //       {
  //         actionName: "commit",
  //         actionType: "modelAction",
  //         actionLabel: "insertMunicipalities_commitForUpdateMenu",
  //         endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
  //         deploymentUuid: {
  //           transformerType: "getFromParameters",
  //           referenceName: "currentDeploymentUuid",
  //         },
  //       },
  //       // update splitted entity instances with foreign key of instances of new entity
  //       {
  //         // actionType: "runBoxedQueryTemplateOrBoxedExtractorTemplateAction",
  //         actionType: "compositeRunBoxedQueryTemplateAction",
  //         actionLabel: "calculateEntityInstances",
  //         nameGivenToResult: newEntityName,
  //         queryTemplate: {
  //           // actionType: "runBoxedQueryTemplateOrBoxedExtractorTemplateAction",
  //           actionType: "runBoxedQueryTemplateAction",
  //           actionName: "runQuery",
  //           endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
  //           applicationSection: "data",
  //           // applicationSection: "model", // TODO: give only selfApplication section in individual queries?
  //           deploymentUuid: {
  //             transformerType: "getFromParameters",
  //             referenceName: "currentDeploymentUuid",
  //           },
  //           query: {
  //             queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
  //             deploymentUuid: {
  //               transformerType: "getFromParameters",
  //               referenceName: "currentDeploymentUuid",
  //             },
  //             pageParams,
  //             queryParams: {},
  //             contextResults: {},
  //             extractorTemplates: {
  //               splittedEntityUuidIndex: {
  //                 // [splittedEntityName + "UuidIndex"]: {
  //                 extractorTemplateType: "extractorTemplateForObjectListByEntity",
  //                 applicationSection: "data",
  //                 parentName: {
  //                   transformerType: "getFromParameters",
  //                   referenceName: "splittedEntityName",
  //                 },
  //                 parentUuid: {
  //                   transformerType: "createObject",
  //                   definition: {
  //                     transformerType: "constantString",
  //                     value: {
  //                       transformerType: "mustacheStringTemplate",
  //                       definition: "{{splittedEntityUuid}}",
  //                       // definition: "{{splittedEntityDefinition.entityUuid}}",
  //                     },
  //                   },
  //                 },
  //               },
  //             },
  //             runtimeTransformers: {
  //               getUniqueValuesSplittedEntityInstancesSplitAttributeValues: {
  //                 transformerType: "createObject",
  //                 definition: {
  //                   transformerType: getUniqueValues,
  //                   interpolation: "runtime",
  //                   applyTo: {
  //                     referenceType: "referencedTransformer",
  //                     reference: {
  //                       transformerType: "getFromContext",
  //                       interpolation: "runtime",
  //                       referenceName: "SplittedEntityInstances",
  //                     }
  //                   },
  //                     // referencedTransformer: "splittedEntityUuidIndex",
  //                   attribute: {
  //                     transformerType: "getFromParameters",
  //                     referenceName: "splittedEntityAttribute",
  //                   }, // TODO: allow transformer inside createObject!
  //                 },
  //               } as any as TransformerForRuntime,
  //               splittedEntityInstances: {
  //                 transformerType: "getObjectValues",
  //                 interpolation: "runtime",
  //                 applyTo: {
  //                   referenceType: "referencedTransformer",
  //                   reference: {
  //                     transformerType: "getFromContext",
  //                     interpolation: "runtime",
  //                     referenceName: "splittedEntityUuidIndex",
  //                   }
  //                 },
  //                 // referencedTransformer: "splittedEntityUuidIndex",
  //               },
  //               municipalities: {
  //                 transformerType: "createObject",
  //                 definition: {
  //                   transformerType: "mapList",
  //                   interpolation: "runtime",
  //                   applyTo: {
  //                     referenceType: "referencedTransformer",
  //                     reference: {
  //                       transformerType: "getFromContext",
  //                       interpolation: "runtime",
  //                       referenceName: "getUniqueValuesSplittedEntityInstancesSplitAttributeValues",
  //                     }
  //                   },
  //                   // referencedTransformer: "getUniqueValuesSplittedEntityInstancesSplitAttributeValues",
  //                   elementTransformer: {
  //                     transformerType: "createObject",
  //                     definition: {
  //                       transformerType: "innerFullObjectTemplate", // TODO: innerFullObjectTemplate is not needed, all attributeKeys are constantString, objectTemplate should be enough
  //                       interpolation: "runtime",
  //                       referenceToOuterObject: "municipality",
  //                       definition: [
  //                         {
  //                           attributeKey: {
  //                             interpolation: "runtime",
  //                             transformerType: "constantString",
  //                             value: "parentUuid",
  //                           },
  //                           attributeValue: {
  //                             transformerType: "getFromParameters",
  //                             referenceName: "splitEntity_newEntityUuid",
  //                           },
  //                         },
  //                         {
  //                           attributeKey: {
  //                             interpolation: "runtime",
  //                             transformerType: "constantString",
  //                             value: "uuid",
  //                           },
  //                           attributeValue: {
  //                             interpolation: "runtime",
  //                             transformerType: "generateUuid",
  //                           },
  //                         },
  //                         {
  //                           attributeKey: {
  //                             interpolation: "runtime",
  //                             transformerType: "constantString",
  //                             value: "name",
  //                           },
  //                           attributeValue: {
  //                             interpolation: "runtime",
  //                             transformerType: "mustacheStringTemplate",
  //                             definition: "{{municipality.Commune}}", // TODO: correct attribute name!
  //                           },
  //                         },
  //                       ],
  //                     },
  //                   },
  //                 },
  //               },
  //               municipalitiesIndexedByUuid: {
  //                 transformerType: "indexListBy",
  //                 interpolation: "runtime",
  //                 applyTo: {
  //                   referenceType: "referencedTransformer",
  //                   reference: {
  //                     transformerType: "getFromContext",
  //                     interpolation: "runtime",
  //                     referenceName: "municipalities",
  //                   }
  //                 },
  //                 // referencedTransformer: "municipalities",
  //                 indexAttribute: "uuid",
  //               },
  //               municipalitiesIndexedByName: {
  //                 transformerType: "indexListBy",
  //                 interpolation: "runtime",
  //                 applyTo: {
  //                   referenceType: "referencedTransformer",
  //                   reference: {
  //                     transformerType: "getFromContext",
  //                     interpolation: "runtime",
  //                     referenceName: "municipalities",
  //                   }
  //                 },
  //                 // referencedTransformer: "municipalities",
  //                 indexAttribute: "name",
  //               },
  //               updatedSplittedEntityInstances: {
  //                 transformerType: "mapList",
  //                 interpolation: "runtime",
  //                 applyTo: {
  //                   referenceType: "referencedTransformer",
  //                   reference: {
  //                     transformerType: "getFromContext",
  //                     interpolation: "runtime",
  //                     referenceName: "splittedEntityInstances",
  //                   }
  //                 },
  //                 // referencedTransformer: "splittedEntityInstances",
  //                 elementTransformer: {
  //                   transformerType: "mergeIntoObject",
  //                   interpolation: "runtime",
  //                   referenceToOuterObject: "mergeIntoObjectTmpReference",
  //                   definition: {
  //                     transformerType: "createObject",
  //                     interpolation: "runtime",
  //                     definition: {
  //                       [newEntityName]: {
  //                         transformerType: "accessDynamicPath",
  //                         interpolation: "runtime",
  //                         objectAccessPath: [
  //                           {
  //                             transformerType: "getFromContext",
  //                             interpolation: "runtime",
  //                             referenceName: "municipalitiesIndexedByName",
  //                           },
  //                           {
  //                             transformerType: "accessDynamicPath",
  //                             interpolation: "runtime",
  //                             objectAccessPath: [
  //                               {
  //                                 transformerType: "getFromContext",
  //                                 interpolation: "runtime",
  //                                 referenceName: "mergeIntoObjectTmpReference",
  //                               },
  //                               {
  //                                 transformerType: "getFromParameters",
  //                                 referenceName: "splittedEntityAttribute",
  //                               },
  //                               // splittedEntityAttribute,
  //                               // "Commune",
  //                             ],
  //                           },
  //                           "uuid",
  //                         ],
  //                       },
  //                     },
  //                   },
  //                 },
  //               },
  //             } as any,
  //           },
  //         },
  //       },
  //       // } as any, // TODO: why is type inferrence failing?
  //       // insert new Entity instance with new uuid for each
  //       {
  //         actionType: "instanceAction",
  //         actionName: "createInstance",
  //         actionLabel: "insertMunicipalities",
  //         applicationSection: "data",
  //         deploymentUuid: {
  //           transformerType: "getFromParameters",
  //           referenceName: "currentDeploymentUuid",
  //         },
  //         endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
  //         objects: [
  //           {
  //             parentName: {
  //               transformerType: "mustacheStringTemplate",
  //               definition: "{{splitEntity_newEntityName}}",
  //             },
  //             parentUuid: {
  //               transformerType: "mustacheStringTemplate",
  //               definition: "{{splitEntity_newEntityUuid}}",
  //             },
  //             applicationSection: "data",
  //             instances: {
  //               transformerType: "getFromContext",
  //               interpolation: "runtime",
  //               referencePath: ["Municipality", "municipalities"],
  //             },
  //           },
  //         ],
  //       },
  //       // update SplittedEntity with new FK attribute
  //       {
  //         actionType: "instanceAction",
  //         actionName: "updateInstance",
  //         actionLabel: "updateFountains",
  //         applicationSection: "data",
  //         deploymentUuid: {
  //           transformerType: "getFromParameters",
  //           referenceName: "currentDeploymentUuid",
  //         },
  //         // deploymentUuid: currentDeploymentUuid,
  //         endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
  //         objects: [
  //           {
  //             parentName: {
  //               transformerType: "getFromParameters",
  //               referenceName: "splittedEntityName",
  //             },
  //             // parentName: splittedEntityName,
  //             parentUuid: {
  //               transformerType: "getFromParameters",
  //               referenceName: "splittedEntityUuid",
  //             },
  //             // parentUuid: splittedEntityUuid,
  //             // parentUuid:splittedEntityDefinition.entityUuid,
  //             applicationSection: "data",
  //             instances: {
  //               transformerType: "getFromContext",
  //               interpolation: "runtime",
  //               // referenceName: "municipalities"
  //               referencePath: ["Municipality", "updatedSplittedEntityInstances"],
  //             },
  //           },
  //         ],
  //       },
  //     ],
  //   };

  //   log.info("#################################### splitEntity actionInsertMunicipalities", actionInsertMunicipalities);
  //   return {
  //     actionSplitFountainEntity: {
  //       actionType: "compositeAction",
  //       actionName: "sequence",
  //       templates: {
  //         ...compositeActionSplitFountainEntity.templates,
  //         ...actionInsertMunicipalities.templates,
  //       },
  //       definition: [
  //         ...(compositeActionSplitFountainEntity as any).definition, 
  //         ...(actionInsertMunicipalities as any).definition,
  //       ],
  //     },  
  //     actionSplitFountainEntityParams: {
  //       ...actionSplitFountainEntityParams,
  //       ...actionInsertMunicipalitiesParams,
  //       currentModel: props.currentModel,
  //     }
  //   }
  // } // end splitEntity

  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  const [formState,setFormState] = useState<{[k:string]:any}>(initialValues)

  // const [formHelperState, setformHelperState] = useMiroirContextformHelperState(); // NOT USED

  // const [rawSchema, setRawSchema] = useState<JzodElement>(
  //   actionHandlerCreateApplication.interface.actionJzodObjectSchema
  // );

  // const currentModel: MetaModel = useCurrentModel(
  //   context.applicationSection == "data" ? context.deploymentUuid : adminConfigurationDeploymentMiroir.uuid
  // );
  // const currentMiroirModel = useCurrentModel(adminConfigurationDeploymentMiroir.uuid);

  // const resolvedJzodSchema:JzodElement = useMemo(
  //   () => {
  //     if (!context.miroirFundamentalJzodSchema || context.miroirFundamentalJzodSchema.name == "dummyJzodSchema") {
  //       return defaultObject
  //     } else {
  //       const configuration = jzodTypeCheck(
  //         rawSchema,
  //         formState,
  //         [], // currentValuePath
  //         [], // currentTypePath
  //         {
  //           miroirFundamentalJzodSchema: context.miroirFundamentalJzodSchema,
  //           currentModel,
  //           miroirMetaModel: currentMiroirModel,
  //         },
  //         emptyObject
  //       );

  //       // return configuration.status == "ok"? configuration.element : defaultObject;
  //       return configuration.status == "ok"? configuration.resolvedSchema : defaultObject;
  //     }
  //   },
  //   [context.miroirFundamentalJzodSchema, rawSchema, formState]
  // );

  // log.info("resolvedJzodSchema", resolvedJzodSchema, context.miroirFundamentalJzodSchema?.name, "rawSchema", rawSchema)

  // const createNewApplication: CompositeActionTemplate = useMemo(
  //   () => ({
  //     actionType: "compositeAction",
  //     actionName: "sequence",
  //     templates: {
  //       // business objects
  //       newDeploymentStoreConfiguration: {
  //         admin: {
  //           emulatedServerType: "sql",
  //           connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
  //           schema: "miroirAdmin",
  //         },
  //         model: {
  //           emulatedServerType: "sql",
  //           connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
  //           schema: {
  //             transformerType: "mustacheStringTemplate",
  //             definition: "{{newApplicationName}}Model",
  //           },
  //         },
  //         data: {
  //           emulatedServerType: "sql",
  //           connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
  //           schema: {
  //             transformerType: "mustacheStringTemplate",
  //             definition: "{{newApplicationName}}Data",
  //           },
  //         },
  //       },
  //       newApplicationForAdmin: {
  //         uuid: {
  //           transformerType: "getFromParameters",
  //           referenceName: "newAdminAppApplicationUuid",
  //         },
  //         parentName: {
  //           transformerType: "mustacheStringTemplate",
  //           definition: "{{entityApplicationForAdmin.name}}",
  //         },
  //         parentUuid: {
  //           transformerType: "mustacheStringTemplate",
  //           definition: "{{entityApplicationForAdmin.uuid}}",
  //         },
  //         name: {
  //           transformerType: "getFromParameters",
  //           referenceName: "newApplicationName",
  //         },
  //         defaultLabel: {
  //           transformerType: "mustacheStringTemplate",
  //           definition: "The {{newApplicationName}} selfApplication.",
  //         },
  //         description: {
  //           transformerType: "mustacheStringTemplate",
  //           definition: "This selfApplication contains the {{newApplicationName}} model and data",
  //         },
  //         selfApplication: {
  //           transformerType: "getFromParameters",
  //           referenceName: "newSelfApplicationUuid",
  //         },
  //       },
  //       newSelfApplication: {
  //         uuid: {
  //           transformerType: "getFromParameters",
  //           referenceName: "newSelfApplicationUuid",
  //         },
  //         parentName: "SelfApplication",
  //         parentUuid: "a659d350-dd97-4da9-91de-524fa01745dc",
  //         name: {
  //           transformerType: "getFromParameters",
  //           referenceName: "newApplicationName",
  //         },
  //         defaultLabel: {
  //           transformerType: "mustacheStringTemplate",
  //           definition: "The {{newApplicationName}} selfApplication.",
  //         },
  //         description: {
  //           transformerType: "mustacheStringTemplate",
  //           definition: "This selfApplication contains the {{newApplicationName}} model and data",
  //         },
  //         selfApplication: {
  //           transformerType: "getFromParameters",
  //           referenceName: "newSelfApplicationUuid",
  //         },
  //       },
  //       DeploymentConfiguration: {
  //         uuid: {
  //           transformerType: "getFromParameters",
  //           referenceName: "newDeploymentUuid",
  //         },
  //         parentName: {
  //           transformerType: "mustacheStringTemplate",
  //           definition: "{{entityDeployment.name}}",
  //         },
  //         parentUuid: {
  //           transformerType: "mustacheStringTemplate",
  //           definition: "{{entityDeployment.uuid}}",
  //         },
  //         name: {
  //           transformerType: "mustacheStringTemplate",
  //           definition: "{{newApplicationName}}ApplicationSqlDeployment",
  //         },
  //         defaultLabel: {
  //           transformerType: "mustacheStringTemplate",
  //           definition: "{{newApplicationName}}ApplicationSqlDeployment",
  //         },
  //         selfApplication: {
  //           transformerType: "mustacheStringTemplate",
  //           definition: "{{newApplicationForAdmin.uuid}}",
  //         },
  //         description: {
  //           transformerType: "mustacheStringTemplate",
  //           definition: "The default Sql Deployment for SelfApplication {{newApplicationName}}",
  //         },
  //         configuration: {
  //           transformerType: "getFromParameters",
  //           referenceName: "newDeploymentStoreConfiguration",
  //         },
  //       },
  //       newApplicationMenu: {
  //         uuid: "84c178cc-1b1b-497a-a035-9b3d756bb085",
  //         parentName: "Menu",
  //         parentUuid: "dde4c883-ae6d-47c3-b6df-26bc6e3c1842",
  //         parentDefinitionVersionUuid: "0f421b2f-2fdc-47ee-8232-62121ea46350",
  //         name: {
  //           transformerType: "mustacheStringTemplate",
  //           definition: "{{newApplicationName}}Menu",
  //         },
  //         defaultLabel: "Meta-Model",
  //         description: {
  //           transformerType: "mustacheStringTemplate",
  //           definition: "This is the default menu allowing to explore the {{newApplicationName}} SelfApplication",
  //         },
  //         definition: {
  //           menuType: "complexMenu",
  //           definition: [
  //             {
  //               title: {
  //                 transformerType: "getFromParameters",
  //                 referenceName: "newApplicationName",
  //               },
  //               label: {
  //                 transformerType: "getFromParameters",
  //                 referenceName: "newApplicationName",
  //               },
  //               items: [
  //                 {
  //                   label: {
  //                     transformerType: "mustacheStringTemplate",
  //                     definition: "{{newApplicationName}} Entities",
  //                   },
  //                   section: "model",
  //                   selfApplication: {
  //                     transformerType: "getFromParameters",
  //                     referenceName: "newDeploymentUuid",
  //                   },
  //                   reportUuid: "c9ea3359-690c-4620-9603-b5b402e4a2b9",
  //                   icon: "category",
  //                 },
  //                 {
  //                   label: {
  //                     transformerType: "mustacheStringTemplate",
  //                     definition: "{{newApplicationName}} Entity Definitions",
  //                   },
  //                   section: "model",
  //                   selfApplication: {
  //                     transformerType: "getFromParameters",
  //                     referenceName: "newDeploymentUuid",
  //                   },
  //                   reportUuid: "f9aff35d-8636-4519-8361-c7648e0ddc68",
  //                   icon: "category",
  //                 },
  //                 {
  //                   label: {
  //                     transformerType: "mustacheStringTemplate",
  //                     definition: "{{newApplicationName}} Reports",
  //                   },
  //                   section: "model",
  //                   selfApplication: {
  //                     transformerType: "getFromParameters",
  //                     referenceName: "newDeploymentUuid",
  //                   },
  //                   reportUuid: "1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855",
  //                   icon: "list",
  //                 },
  //               ],
  //             },
  //           ],
  //         },
  //       },
  //     },
  //     definition: [
  //       // openStoreAction
  //       {
  //         actionType: "storeManagementAction",
  //         actionName: "storeManagementAction_openStore",
  //         actionLabel: "openStoreAction",
  //         endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
  //         configuration: {
  //           transformerType: "createObjectFromPairs",
  //           applyTo: {
  //             referenceType: "referencedTransformer",
  //             reference: {
  //               transformerType: "getFromContext",
  //               interpolation: "runtime",
  //               referenceName: "NOT_RELEVANT",
  //             }
  //           },
  //           // referencedTransformer: "NOT_RELEVANT",
  //           definition: [
  //             {
  //               attributeKey: {
  //                 transformerType: "getFromParameters",
  //                 referenceName: "newDeploymentUuid",
  //               },
  //               attributeValue: {
  //                 transformerType: "getFromParameters",
  //                 referenceName: "newDeploymentStoreConfiguration",
  //               },
  //             },
  //           ],
  //         },
  //         deploymentUuid: {
  //           transformerType: "getFromParameters",
  //           referenceName: "newDeploymentUuid",
  //         },
  //       },
  //       // createStoreAction
  //       {
  //         actionType: "storeManagementAction",
  //         actionName: "storeManagementAction_createStore",
  //         actionLabel: "createStoreAction",
  //         endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
  //         deploymentUuid: {
  //           transformerType: "getFromParameters",
  //           referenceName: "newDeploymentUuid",
  //         },
  //         configuration: {
  //           transformerType: "getFromParameters",
  //           referenceName: "newDeploymentStoreConfiguration",
  //         },
  //         // action: {
  //         //   transformerType: "getFromParameters",
  //         //   referenceName: "createStoreAction",
  //         // }
  //       },
  //       // resetAndInitAction
  //       {
  //         endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
  //         actionType: "storeManagementAction",
  //         actionLabel: "resetAndInitAction",
  //         actionName: "storeManagementAction_resetAndInitApplicationDeployment",
  //         deploymentUuid: "",
  //         deployments: [
  //           {
  //             transformerType: "getFromParameters",
  //             referenceName: "DeploymentConfiguration",
  //           },
  //         ],
  //         // action: {
  //         //   transformerType: "getFromParameters",
  //         //   referenceName: "resetAndInitAction",
  //         // }
  //       },
  //       // createSelfApplicationAction
  //       {
  //         actionType: "instanceAction",
  //         actionName: "createInstance",
  //         actionLabel: "createSelfApplicationAction",
  //         applicationSection: "model",
  //         deploymentUuid: {
  //           transformerType: "getFromParameters",
  //           referenceName: "newDeploymentUuid",
  //         },
  //         endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
  //         objects: [
  //           {
  //             parentName: {
  //               transformerType: "mustacheStringTemplate",
  //               definition: "{{entitySelfApplication.name}}",
  //             },
  //             parentUuid: {
  //               transformerType: "mustacheStringTemplate",
  //               definition: "{{entitySelfApplication.uuid}}",
  //             },
  //             applicationSection: "model",
  //             instances: [
  //               {
  //                 transformerType: "getFromParameters",
  //                 referenceName: "newSelfApplication",
  //               },
  //             ],
  //           },
  //         ],
  //       },
  //       // createApplicationForAdminAction
  //       {
  //         actionType: "instanceAction",
  //         actionName: "createInstance",
  //         actionLabel: "createApplicationForAdminAction",
  //         applicationSection: "data",
  //         deploymentUuid: {
  //           transformerType: "mustacheStringTemplate",
  //           definition: "{{adminConfigurationDeploymentAdmin.uuid}}",
  //         },
  //         endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
  //         objects: [
  //           {
  //             parentName: {
  //               transformerType: "mustacheStringTemplate",
  //               definition: "{{entityApplicationForAdmin.name}}",
  //             },
  //             parentUuid: {
  //               transformerType: "mustacheStringTemplate",
  //               definition: "{{entityApplicationForAdmin.uuid}}",
  //             },
  //             applicationSection: "data",
  //             instances: [
  //               {
  //                 transformerType: "getFromParameters",
  //                 referenceName: "newApplicationForAdmin",
  //               },
  //             ],
  //           },
  //         ],
  //         // action: {
  //         //   transformerType: "getFromParameters",
  //         //   referenceName: "createApplicationForAdminAction",
  //         // }
  //       },
  //       // createAdminDeploymentAction
  //       {
  //         actionType: "instanceAction",
  //         actionName: "createInstance",
  //         actionLabel: "createAdminDeploymentAction",
  //         applicationSection: "data",
  //         deploymentUuid: {
  //           transformerType: "mustacheStringTemplate",
  //           definition: "{{adminConfigurationDeploymentAdmin.uuid}}",
  //         },
  //         endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
  //         objects: [
  //           {
  //             parentName: {
  //               transformerType: "mustacheStringTemplate",
  //               definition: "{{entityDeployment.name}}",
  //             },
  //             parentUuid: {
  //               transformerType: "mustacheStringTemplate",
  //               definition: "{{entityDeployment.uuid}}",
  //             },
  //             applicationSection: "data",
  //             instances: [
  //               {
  //                 transformerType: "getFromParameters",
  //                 referenceName: "DeploymentConfiguration",
  //               },
  //             ],
  //           },
  //         ],
  //         // action: {
  //         //   transformerType: "getFromParameters",
  //         //   referenceName: "createAdminDeploymentAction",
  //         // }
  //       },
  //       // createNewApplicationMenuAction
  //       {
  //         actionType: "instanceAction",
  //         actionName: "createInstance",
  //         actionLabel: "createNewApplicationMenuAction",
  //         applicationSection: "model",
  //         deploymentUuid: {
  //           transformerType: "getFromParameters",
  //           referenceName: "newDeploymentUuid",
  //         },
  //         endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
  //         objects: [
  //           {
  //             parentName: {
  //               transformerType: "mustacheStringTemplate",
  //               definition: "{{entityMenu.name}}",
  //             },
  //             parentUuid: {
  //               transformerType: "mustacheStringTemplate",
  //               definition: "{{entityMenu.uuid}}",
  //             },
  //             applicationSection: "model",
  //             instances: [
  //               {
  //                 transformerType: "getFromParameters",
  //                 referenceName: "newApplicationMenu",
  //               },
  //             ],
  //           },
  //         ],
  //         // action: {
  //         //   transformerType: "getFromParameters",
  //         //   referenceName: "createNewApplicationMenuAction",
  //         // }
  //       },
  //       // commitAction
  //       {
  //         actionName: "commit",
  //         actionType: "modelAction",
  //         actionLabel: "commitAction",
  //         endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
  //         deploymentUuid: {
  //           transformerType: "getFromParameters",
  //           referenceName: "newDeploymentUuid",
  //         },
  //         // action: {
  //         //   transformerType: "getFromParameters",
  //         //   referenceName: "commitAction",
  //         // }
  //       },
  //     ],
  //   }),
  //   []
  // );

  const onSubmit = useCallback(
    async (actionCreateSchemaParamValues: any /* actually follows formJzodSchema */, formikFunctions:{ setSubmitting:any, setErrors:any }) => {
      try {
        //  Send values somehow
        // setformHelperState(actionCreateSchemaParamValues);

        log.info(
          "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ Importer.tsx onSubmit formik values",
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

        const paramsForTemplates = { 
          ...actionCreateSchemaParamValues,
          entityApplicationForAdmin,
          entitySelfApplication,
          adminConfigurationDeploymentAdmin,
          entityMenu,
          entityDeployment,
        }
        log.info(
          "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ Importer.tsx onSubmit formik values actionCreateSchemaParamValues",
          actionCreateSchemaParamValues,
          "paramsForTemplates",
          paramsForTemplates
        );

        const entityFountainUuid = uuidv4();
        const entityFountainName = "Fountain";
        const entityFountainDescription = "Drinking Fountains of Paris";
        const entityFountainDefinitionUuid = uuidv4();
        const entityMunicipalityUuid = uuidv4();
        const entityMunicipalityName = "Municipality";

        // const { actionHandlerCreateFountainEntity, actionEffectiveParamsCreateEntity: actionCreateEntityParams } = createEntity(
        //   entityFountainUuid,
        //   entityFountainName,
        //   entityFountainDescription,
        //   entityFountainDefinitionUuid
        // );

        // const {
        //   actionSplitFountainEntity,
        //   actionSplitFountainEntityParams,
        // } = splitEntity(
        //   entityFountainUuid,
        //   entityFountainName,
        //   "Commune",
        //   entityFountainDefinitionUuid,
        //   entityMunicipalityUuid,
        //   entityMunicipalityName,
        // );

        // const createApplicationAndCreateEntityAndSplitEntity: CompositeActionTemplate = {
        //   actionType: "compositeAction",
        //   actionName: "sequence",
        //   actionLabel: "createApplicationAndCreateEntityAndSplitEntity",
        //   templates: {
        //     ...createNewApplication.templates,
        //     ...actionHandlerCreateFountainEntity.templates,
        //     ...(actionSplitFountainEntity as any).templates,
        //   },
        //   definition: [
        //     ...(createNewApplication as any).definition,
        //     ...(actionHandlerCreateFountainEntity as any).definition,
        //     ...(actionSplitFountainEntity as any).definition,
        //   ]
        // }

        // log.info("createApplicationAndCreateEntityAndSplitEntity", createApplicationAndCreateEntityAndSplitEntity)

        // const createApplicationAndCreateEntityResult = await domainController.handleCompositeActionTemplate(
        //   createApplicationAndCreateEntityAndSplitEntity,
        //   {
        //     ...paramsForTemplates,
        //     ...actionCreateEntityParams,
        //     ...actionSplitFountainEntityParams,
        //   },
        //   props.currentModel
        // );

        log.info("created Entity instance in Admin App deployment")
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
    [fileData]
  ) // end onSubmit()

  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
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
            }
          }
        >
          {
            (
              formik
            ) => (
              <>
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
                  {/* DISABLED - resolvedJzodSchema and rawSchema are undefined
                  {
                    resolvedJzodSchema === defaultObject?
                    <div>no object definition found!</div>
                    :
                    <>
                      <JzodElementEditor
                        name={'ROOT'}
                        listKey={'ROOT'}
                        rootLessListKey={emptyString}
                        rootLessListKeyArray={emptyList}
                        labelElement={<div>pageLabel</div>}
                        currentDeploymentUuid={emptyString}
                        currentApplicationSection={dataSection}
                        indentLevel={0}
                        // localRootLessListKeyMap={{}}
                        // resolvedJzodSchema={actionsJzodSchema}
                        resolvedElementJzodSchema={resolvedJzodSchema}
                        typeCheckKeyMap={{}}
                        foreignKeyObjects={emptyObject}
                        // handleChange={formik.handleChange as any}
                        // formik={formik}
                        // setFormState={setFormState}
                        // formState={formState}
                      />
                      <button type="submit" name={pageLabel} form={"form." + pageLabel}>submit form.{pageLabel}</button>
                    </>
                  }
                  */}
                </form>
              </>
            )
          }
        </Formik>
      </div>
    <form>
      <p>
        <label htmlFor='image'> Browse files  </label>
        <input
          type="file"
          id='excel'
          accept='.xls, .xlsx, .ods'
          onChange={changeHandler}
        />
          {file?file['type']:''}
      </p>
      <p>
        <input type="submit"/>
      </p>
    </form>
    {
      fileDataURL ?
      <p>
        found Json file length:{
          // <img src={fileDataURL} alt="preview" />
          JSON.stringify(fileData).length
        }
      </p> : null
    }
      found row A:{JSON.stringify(fileData?fileData[0]:'')}
      <h4>
        importer props: selfApplication={JSON.stringify(props.currentApplicationUuid)} deployment={JSON.stringify(props.currentDeploymentUuid)} filename={JSON.stringify(props.filename)}
      </h4>
{/*
      <h3>
        create Entity from Excel File:
        <Button variant="outlined" onClick={()=>createEntity()}>
          <AddBox/>
        </Button>
      </h3>
      <h3>
        split entity Fountain:
        <Button variant="outlined" onClick={()=>splitEntity()}>
          <AddBox/>
        </Button>
      </h3>

*/}
    </>
  );
}