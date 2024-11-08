import { Button } from "@mui/material";
import { ChangeEvent, FC, useCallback, useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from 'uuid';
import { z } from "zod";
// import * as XLSX from 'xlsx/xlsx.mjs';
import { AddBox } from "@mui/icons-material";
import { Formik } from "formik";
import {
  ActionHandler,
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
  adminConfigurationDeploymentAdmin,
  adminConfigurationDeploymentMiroir,
  entityApplicationForAdmin,
  entityDeployment,
  entityEntity,
  entityEntityDefinition,
  entityMenu,
  entityReport,
  entitySelfApplication,
  getLoggerName,
  metaModel,
  resolveReferencesForJzodSchemaAndValueObject
} from "miroir-core";
import * as XLSX from 'xlsx';
import { packageName } from "../../constants.js";
import { JzodObjectEditor } from "./components/JzodObjectEditor.js";
import { cleanLevel } from "./constants.js";
import { useDomainControllerService, useErrorLogService, useMiroirContextService } from "./MiroirContextReactProvider.js";
import { useCurrentModel } from "./ReduxHooks.js";
import { adminConfigurationDeploymentParis, applicationParis } from "./routes/ReportPage.js";


const loggerName: string = getLoggerName(packageName, cleanLevel,"importer");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

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

  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // #######################################################################################################################################
  // ##############################################################################################
  // const createEntity = async (
  const createEntity = (
    // fileData: string[][],
    // props: ImporterCoreProps
  ) => {
    const newEntityName = "Fountain";
    const newEntityDescription = "Drinking Fountains of Paris";
    const newEntityUuid = uuidv4();
    const currentApplicationUuid = props.currentApplicationUuid
    const currentDeploymentUuid = props.currentDeploymentUuid;


    const newEntity: MetaEntity = {
      uuid: newEntityUuid,
      parentUuid: entityEntity.uuid,
      application: currentApplicationUuid,
      description: newEntityDescription,
      name: newEntityName,
    }
    log.info("createEntity fileData", fileData);
    const jzodSchema:JzodObject = {
      type: "object",
      definition: Object.assign(
        {},
        {
          uuid: {
            type: "string",
            validations: [{ type: "uuid" }],
            tag: { id: 1, defaultLabel: "Uuid", editable: false },
          },
          parentName: {
            type: "string",
            optional: true,
            tag: { id: 1, defaultLabel: "Uuid", editable: false },
          },
          parentUuid: {
            type: "string",
            validations: [{ type: "uuid" }],
            tag: { id: 1, defaultLabel: "parentUuid", editable: false },
          },
        },
        ...(
          fileData[0]?
          Object.values(fileData[0]).map(
            (a: string, index) => (
              {
                [a]: {
                  type: "string",
                  optional: true,
                  tag: { id: index + 2 /* uuid attribute has been added*/, defaultLabel: a, editable: true },
                },
              }
            )
          )
          : []
        )
      ),
    };

    // ############################################################################################
    // beginning of composite action
    // create new Entity
    // const newEntityDefinitionUuid: string = uuidv4();
    // const newEntityDetailsReportUuid: string = uuidv4();
    // const newEntityListReportUuid: string = uuidv4();

    const actionEffectiveParamsCreateEntity /** parsed by actionHandlerCreateEntity.interface.actionJzodObjectSchema */ = {
      newEntityName: "Fountain",
      newEntityDescription: "Drinking Fountains of Paris",
      newEntityUuid: uuidv4(),
      currentApplicationName: "Paris",
      currentApplicationUuid: props.currentApplicationUuid,
      currentDeploymentUuid: props.currentDeploymentUuid,
      newEntityDefinitionUuid: uuidv4(),
      newEntityDetailsReportUuid: uuidv4(),
      newEntityListReportUuid: uuidv4(),
      adminConfigurationDeploymentParis,
      //TODO: tag params, should be passed as context instead?
      jzodSchema,
      entityEntityDefinition,
      entityReport,
      newEntity,
      entityMenu,
    }

    const objectAttributeNames = fileData[0];
    fileData.splice(0,1) // side effect!!!
    const instances:EntityInstance[] = 
      fileData
      .map(
        (fileDataRow:any) => {
          return Object.fromEntries([
            ...Object.entries(fileDataRow).map((e: [string, any], index: number) => [
              objectAttributeNames[(e as any)[0]],
              e[1],
            ]),
            ["uuid", uuidv4()],
            ["parentName", actionEffectiveParamsCreateEntity.newEntity.name],
            ["parentUuid", actionEffectiveParamsCreateEntity.newEntity.uuid],
          ]) as EntityInstance;
        }
      ) 
    ;
    log.info('createEntity adding instances',instances);

    const actionHandlerCreateFountainEntity: CompositeActionTemplate = {
      actionType: "compositeAction",
      actionName: "sequence",
      // interface: {
      //   actionJzodObjectSchema: {
      //     type: "object",
      //     definition: {
      //       newEntityName: {
      //         type: "string"
      //       },
      //       newEntityDescription: {
      //         type: "string"
      //       },
      //       newEntityUuid: {
      //         type: "uuid"
      //       },
      //       currentApplicationUuid: {
      //         type: "uuid"
      //       },
      //       currentDeploymentUuid: {
      //         type: "uuid"
      //       },
      //       newEntityDefinitionUuid: {
      //         type: "uuid"
      //       },
      //       newEntityDetailsReportUuid: {
      //         type: "uuid"
      //       },
      //       newEntityListReportUuid: {
      //         type: "uuid"
      //       }
      //     }
      //   }
      // },
      // implementation: {
      templates: {
        newEntityDefinition: {
          name: {
            transformerType: "parameterReference",
            referenceName: "newEntityName",
          },
          uuid: {
            transformerType: "parameterReference",
            referenceName: "newEntityDefinitionUuid",
          },
          parentName: "EntityDefinition",
          parentUuid: {
            transformerType: "mustacheStringTemplate",
            definition: "{{entityEntityDefinition.uuid}}",
          },
          entityUuid: {
            transformerType: "mustacheStringTemplate",
            definition: "{{newEntity.uuid}}",
          },
          conceptLevel: "Model",
          defaultInstanceDetailsReportUuid: {
            transformerType: "parameterReference",
            referenceName: "newEntityDetailsReportUuid",
          },
          jzodSchema: {
            transformerType: "parameterReference",
            referenceName: "jzodSchema",
          },
        },
        // list of instances Report Definition
        newEntityListReport: {
          uuid: {
            transformerType: "parameterReference",
            referenceName: "newEntityListReportUuid",
          },
          application: {
            transformerType: "parameterReference",
            referenceName: "currentApplicationUuid",
          },
          parentName: "Report",
          parentUuid: {
            transformerType: "mustacheStringTemplate",
            definition: "{{entityReport.uuid}}",
          },
          conceptLevel: "Model",
          name: {
            transformerType: "mustacheStringTemplate",
            definition: "{{newEntityName}}List",
          },
          defaultLabel: {
            transformerType: "mustacheStringTemplate",
            definition: "List of {{newEntityName}}s",
          },
          type: "list",
          definition: {
            extractors: {
              instanceList: {
                queryType: "extractorForObjectListByEntity",
                parentName: {
                  transformerType: "parameterReference",
                  referenceName: "newEntityName",
                },
                parentUuid: {
                  transformerType: "mustacheStringTemplate",
                  definition: "{{newEntity.uuid}}",
                },
              },
            },
            section: {
              type: "objectListReportSection",
              definition: {
                label: {
                  transformerType: "mustacheStringTemplate",
                  definition: "{{newEntityName}}s",
                },
                parentUuid: {
                  transformerType: "mustacheStringTemplate",
                  definition: "{{newEntity.uuid}}",
                },
                fetchedDataReference: "instanceList",
              },
            },
          },
        },
        // Details of an instance Report Definition
        newEntityDetailsReport: {
          uuid: {
            transformerType: "parameterReference",
            referenceName: "newEntityDetailsReportUuid",
          },
          application: {
            transformerType: "parameterReference",
            referenceName: "currentApplicationUuid",
          },
          parentName: {
            transformerType: "mustacheStringTemplate",
            definition: "{{entityReport.name}}",
          },
          parentUuid: {
            transformerType: "mustacheStringTemplate",
            definition: "{{entityReport.uuid}}",
          },
          conceptLevel: "Model",
          name: {
            transformerType: "mustacheStringTemplate",
            definition: "{{newEntityName}}Details",
          },
          defaultLabel: {
            transformerType: "mustacheStringTemplate",
            definition: "Details of {{newEntityName}}",
          },
          definition: {
            extractorTemplates: {
              elementToDisplay: {
                queryType: "extractorForObjectByDirectReference",
                parentName: {
                  transformerType: "parameterReference",
                  referenceName: "newEntityName",
                },
                parentUuid: {
                  transformerType: "freeObjectTemplate",
                  definition: {
                    transformerType: "constantString",
                    constantStringValue: {
                      transformerType: "mustacheStringTemplate",
                      definition: "{{newEntity.uuid}}",
                    },
                  },
                },
                instanceUuid: {
                  transformerType: "constantObject",
                  constantObjectValue: {
                    transformerType: "parameterReference",
                    referenceName: "instanceUuid",
                  },
                },
              },
            },
            section: {
              type: "list",
              definition: [
                {
                  type: "objectInstanceReportSection",
                  definition: {
                    label: {
                      transformerType: "mustacheStringTemplate",
                      definition: "My {{newEntityName}}",
                    },
                    parentUuid: {
                      transformerType: "mustacheStringTemplate",
                      definition: "{{newEntity.uuid}}",
                    },
                    fetchedDataReference: "elementToDisplay",
                  },
                },
              ],
            },
          },
        },
      },
      definition: [
        // createEntity
        {
          compositeActionType: "action",
          compositeActionName: "createEntity",
          action: {
            actionType: "modelAction",
            actionName: "createEntity",
            deploymentUuid: {
              transformerType: "parameterReference",
              referenceName: "currentDeploymentUuid",
            },
            endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
            entities: [
              {
                entity: {
                  transformerType: "parameterReference",
                  referenceName: "newEntity",
                },
                entityDefinition: {
                  transformerType: "parameterReference",
                  referenceName: "newEntityDefinition",
                },
              },
            ],
          },
        } as any,
        // createReports
        {
          compositeActionType: "action",
          compositeActionName: "createReports",
          action: {
            actionType: "transactionalInstanceAction",
            instanceAction: {
              actionType: "instanceAction",
              actionName: "createInstance",
              applicationSection: "model",
              deploymentUuid: {
                transformerType: "parameterReference",
                referenceName: "currentDeploymentUuid",
              },
              endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
              objects: [
                {
                  parentName: {
                    transformerType: "mustacheStringTemplate",
                    definition: "{{newEntityListReport.parentName}}",
                  },
                  parentUuid: {
                    transformerType: "mustacheStringTemplate",
                    definition: "{{newEntityListReport.parentUuid}}",
                  },
                  applicationSection: "model",
                  instances: [
                    {
                      transformerType: "parameterReference",
                      referenceName: "newEntityListReport",
                    },
                    {
                      transformerType: "parameterReference",
                      referenceName: "newEntityDetailsReport",
                    },
                  ],
                },
              ],
            },
          },
        },
        // commit
        {
          compositeActionType: "action",
          compositeActionName: "commit",
          action: {
            actionName: "commit",
            actionType: "modelAction",
            endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
            deploymentUuid: {
              transformerType: "parameterReference",
              referenceName: "currentDeploymentUuid",
            },
          },
          // action: {
          //   transformerType: "parameterReference",
          //   referenceName: "commitAction",
          // },
        },
        // instances for new Entity, put in "menuUpdateQueryResult"
        {
          compositeActionType: "queryTemplate",
          nameGivenToResult: "menuUpdateQueryResult",
          queryTemplate: {
            actionType: "queryTemplateAction",
            actionName: "runQuery",
            endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
            applicationSection: "model",
            deploymentUuid: {
              transformerType: "parameterReference",
              referenceName: "currentDeploymentUuid"
            },
            query: {
              queryType: "extractorForRecordOfExtractors",
              deploymentUuid: {
                transformerType: "parameterReference",
                referenceName: "currentDeploymentUuid",
              },
              // runAsSql: true,
              pageParams: {},
              queryParams: {},
              contextResults: {},
              extractorTemplates: {
                menuList: {
                  queryType: "extractorTemplateForObjectListByEntity",
                  applicationSection: "model",
                  parentName: "Menu",
                  parentUuid: {
                    transformerType: "freeObjectTemplate",
                    definition: {
                      transformerType: {
                        transformerType: "constantString",
                        constantStringValue: "constantUuid"
                      },
                      constantUuidValue: {
                        transformerType: "mustacheStringTemplate",
                        definition: "{{entityMenu.uuid}}",
                      },
                    },
                  },
                },
              },
              runtimeTransformers: {
                // menuList: {
                //   transformerType: "objectValues",
                //   interpolation: "runtime",
                //   referencedExtractor: "menuUuidIndex",
                // },
                menu: {
                  transformerType: "listPickElement",
                  interpolation: "runtime",
                  referencedExtractor: "menuList",
                  index: 1
                },
                menuItem: {
                  transformerType: "freeObjectTemplate",
                  definition: {
                    reportUuid: {
                      transformerType: "mustacheStringTemplate",
                      definition: "{{newEntityListReportUuid}}",
                    },
                    label: {
                      transformerType: "mustacheStringTemplate",
                      definition: "List of {{newEntityName}}"
                    },
                    section: "data",
                    application: {
                      transformerType: "mustacheStringTemplate",
                      definition: "{{adminConfigurationDeploymentParis.uuid}}",
                    }, // TODO: replace with application uuid, this is a deployment at the moment
                    icon: "local_drink"
                  }
                },
                updatedMenu:{
                  transformerType: "transformer_menu_addItem",
                  interpolation: "runtime",
                  transformerDefinition: {
                    menuItemReference: {
                        transformerType: "contextReference",
                        interpolation: "runtime",
                        referenceName: "menuItem"
                    },
                    menuReference: {
                      transformerType: "contextReference",
                      interpolation: "runtime",
                      referenceName: "menu"
                    },
                    menuSectionItemInsertionIndex: -1,
                  }
                }
              },
            }
          }
        },
        {
          compositeActionType: "action",
          compositeActionName: "updateMenu",
          action: {
            actionType: "transactionalInstanceAction",
            instanceAction: {
              actionType: "instanceAction",
              actionName: "updateInstance",
              applicationSection: "model",
              deploymentUuid: {
                transformerType: "parameterReference",
                referenceName: "currentDeploymentUuid",
              },
              endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
              objects: [
                {
                  parentName: entityMenu.name,
                  parentUuid: entityMenu.uuid,
                  applicationSection: "model",
                  instances: [
                    {
                      transformerType: "objectDynamicAccess",
                      interpolation: "runtime",
                      objectAccessPath: [
                        {
                          transformerType: "contextReference",
                          interpolation: "runtime",
                          referenceName: "menuUpdateQueryResult",
                        },
                        "updatedMenu"
                      ],
                    },
                  ]
                }
              ],
            }
          }
        },
        // commit
        {
          compositeActionType: "action",
          compositeActionName: "commit",
          action: {
            actionName: "commit",
            actionType: "modelAction",
            endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
            deploymentUuid: {
              transformerType: "parameterReference",
              referenceName: "currentDeploymentUuid",
            },
          },
        },
        // insert imported instances
        {
          compositeActionType: "action",
          action: {
            actionType: "instanceAction",
            actionName: "createInstance",
            applicationSection: "data",
            deploymentUuid: {
              transformerType: "parameterReference",
              referenceName: "currentDeploymentUuid",
            },
            endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
            objects: [
              {
                parentName: {
                  transformerType: "mustacheStringTemplate",
                  definition: "{{newEntity.name}}",
                },
                parentUuid: {
                  transformerType: "mustacheStringTemplate",
                  definition: "{{newEntity.uuid}}",
                },
                applicationSection: "data",
                instances: instances,
              },
            ],
          },
        },
        // rollback / refresh
        {
          compositeActionType: "action",
          compositeActionName: "rollback",
          action: {
            actionName: "rollback",
            actionType: "modelAction",
            endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
            deploymentUuid: {
              transformerType: "parameterReference",
              referenceName: "currentDeploymentUuid",
            },
          },
        },
      ],
    };

    return {
      actionHandlerCreateFountainEntity,
      actionEffectiveParamsCreateEntity,
    }
    // const createFountainEntityResult = await domainController.handleCompositeActionTemplate(
    //   actionHandlerCreateFountainEntity,
    //   actionEffectiveParamsCreateEntity,
    //   props.currentModel
    // );

    log.info('createEntity DONE adding instances');
    log.info("createEntity updated miroirMenu DONE");
  }

  // ##############################################################################################
  // ##############################################################################################
  // SPLIT ENTITY
  // ##############################################################################################
  // ##############################################################################################
  const splitEntity = async () => {
    const splittedEntityName = "Fountain"
    const splittedEntityAttribute = "Commune"
    const newEntityName = "Municipality";
    const newEntityDescription = "Municipalities";
    // const newEntityUuid = uuidv4();
    const newEntityUuid = "f6de3d66-37ee-42ac-bb81-72973222f006";
    const currentApplicationUuid = props.currentApplicationUuid;
    const currentDeploymentUuid = props.currentDeploymentUuid;
    const newEntityDetailsReportUuid: string = uuidv4();
    // const menuUuid: string = "eaac459c-6c2b-475c-8ae4-c6c3032dae00";
    const menuUuid: string = "dd168e5a-2a21-4d2d-a443-032c6d15eb22";

    const splittedEntityDefinition = props.currentModel.entityDefinitions.find(e=>e.name == splittedEntityName)

    log.info("splitEntity started for", splittedEntityName, splittedEntityDefinition, "props", props)

    if (!splittedEntityDefinition?.entityUuid) {
      throw new Error("splitEntity found definition with undefined entityUuid " + JSON.stringify(splittedEntityDefinition));
    }

    const pageParams = {
      deploymentUuid: currentDeploymentUuid,
      applicationSection: "data",
    };
    // const pageParams: DomainElementObject = {
    //   elementType: "object",
    //   elementValue: {
    //     deploymentUuid: { elementType: "string", elementValue: currentDeploymentUuid },
    //     applicationSection: { elementType: "string", elementValue: "data" },
    //   },
    // };

    const actionSplitFountainEntityParams = {
      splittedEntityName: "Fountain",
      splittedEntityAttribute: "Commune",
      newEntityName:"Municipality",
      newEntityDescription: "Municipalities",
      // newEntityUuid: uuidv4(),
      newEntityUuid,
      newEntityListReportUuid: uuidv4(),
      newEntityDetailsReportUuid: uuidv4(),
      currentApplicationUuid: props.currentApplicationUuid,
      currentDeploymentUuid: props.currentDeploymentUuid,
      //TODO: tag params, should be passed as context instead?
      // jzodSchema,
      splittedEntityDefinition, // !!!
      entityEntity,
      entityEntityDefinition,
      entityReport,
      // newEntity,
      
    }

    const splitFountainEntity: CompositeActionTemplate = {
      actionType: "compositeAction",
      actionName: "sequence",
      templates: {
        newEntity: {
          uuid: {
            transformerType: "parameterReference",
            referenceName: "newEntityUuid",
          },
          name: {
            transformerType: "parameterReference",
            referenceName: "newEntityName",
          },
          description: {
            transformerType: "parameterReference",
            referenceName: "newEntityDescription",
          },
          parentName: "Entity",
          parentUuid: {
            transformerType: "mustacheStringTemplate",
            definition: "{{entityEntity.uuid}}",
          },
          application: {
            transformerType: "parameterReference",
            referenceName: "currentApplicationUuid",
          },
        },
        newEntityJzodSchema: {
          type: "object",
          definition: {
            uuid: {
              type: "uuid",
              tag: { id: 1, defaultLabel: "Uuid", editable: false },
            } as JzodPlainAttribute,
            parentUuid: {
              type: "uuid",
              tag: { id: 1, defaultLabel: "Uuid", editable: false },
            } as JzodPlainAttribute,
            name: {
              type: "string",
              tag: { id: 2, defaultLabel: "name", editable: false },
            } as JzodAttributePlainStringWithValidations,
          },
        },
        newEntityDefinition: {
          name: {
            transformerType: "parameterReference",
            referenceName: "newEntityName",
          },
          uuid: uuidv4(),
          parentName: "EntityDefinition",
          parentUuid: {
            transformerType: "mustacheStringTemplate",
            definition: "{{entityEntityDefinition.uuid}}",
          },
          entityUuid: {
            transformerType: "mustacheStringTemplate",
            definition: "{{newEntity.uuid}}",
          },
          conceptLevel: "Model",
          defaultInstanceDetailsReportUuid: {
            transformerType: "parameterReference",
            referenceName: "newEntityDetailsReportUuid",
          },
          jzodSchema: {
            transformerType: "parameterReference",
            referenceName: "newEntityJzodSchema",
          },
        },
        newEntityListReport: {
          uuid: actionSplitFountainEntityParams.newEntityListReportUuid,
          application: {
            transformerType: "parameterReference",
            referenceName: "currentApplicationUuid",
          },
          parentName: "Report",
          parentUuid: "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
          conceptLevel: "Model",
          name: newEntityName + "List",
          defaultLabel: "List of " + newEntityDescription,
          type: "list",
          definition: {
            extractors: {
              listReportSectionElements: {
                queryType: "extractorForObjectListByEntity",
                parentName: {
                  transformerType: "parameterReference",
                  referenceName: "newEntityName",
                },
                parentUuid: {
                  transformerType: "mustacheStringTemplate",
                  definition: "{{newEntity.uuid}}",
                },
              },
            },
            section: {
              type: "objectListReportSection",
              definition: {
                label: {
                  transformerType: "mustacheStringTemplate",
                  definition: "{{newEntityName}}(ies)",
                  // transformerType: "parameterReference",
                  // referenceName: "newEntityDescription",
                },
                "parentName": "Municipality",
                parentUuid: {
                  transformerType: "mustacheStringTemplate",
                  definition: "{{newEntity.uuid}}",
                },
                fetchedDataReference: "listReportSectionElements",
              },
            },
          },
        },
        // TODO: use template / concat for uuid, name, defaultLabel
        newEntityDetailsReport: {
          uuid: newEntityDetailsReportUuid,
          application: {
            transformerType: "parameterReference",
            referenceName: "currentApplicationUuid",
          },
          parentName: "Report",
          parentUuid: "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
          conceptLevel: "Model",
          name: newEntityName + "Details",
          defaultLabel: "Details of " + newEntityDescription,
          definition: {
            extractors: {
              elementToDisplay: {
                queryType: "extractorForObjectByDirectReference",
                parentName: newEntityName,
                parentUuid: {
                  transformerType: "constantUuid",
                  constantUuidValue: {
                    transformerType: "mustacheStringTemplate",
                    definition: "{{newEntity.uuid}}",
                  },
                },
                instanceUuid: {
                  queryTemplateType: "queryParameterReference",
                  referenceName: "instanceUuid",
                },
              },
              fountainsOfMunicipality: {
                queryType: "combinerForObjectListByRelation",
                parentName: "Fountain",
                parentUuid: {
                  transformerType: "constantUuid",
                  constantUuidValue: splittedEntityDefinition.entityUuid,
                },
                objectReference: {
                  referenceName: "elementToDisplay",
                  queryTemplateType: "queryContextReference",
                },
                AttributeOfListObjectToCompareToReferenceUuid: newEntityName,
              },
            },
            section: {
              type: "list",
              definition: [
                {
                  type: "objectInstanceReportSection",
                  definition: {
                    label: "My " + newEntityName,
                    parentUuid: {
                      transformerType: "mustacheStringTemplate",
                      definition: "{{newEntity.uuid}}",
                    },
                    fetchedDataReference: "elementToDisplay",
                  },
                },
                {
                  type: "objectListReportSection",
                  definition: {
                    label: newEntityName + "'s (${elementToDisplay.name}) " + splittedEntityName + "s",
                    parentName: splittedEntityName,
                    parentUuid: splittedEntityDefinition.entityUuid,
                    fetchedDataReference: "fountainsOfMunicipality",
                    sortByAttribute: "name",
                  },
                },
              ],
            },
          },
        },
      },
      definition: [
        // createEntity
        {
          compositeActionType: "action",
          action: {
            actionType: "modelAction",
            actionName: "createEntity",
            deploymentUuid: {
              transformerType: "parameterReference",
              referenceName: "currentDeploymentUuid",
            },
            endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
            entities: [
              {
                entity: {
                  transformerType: "parameterReference",
                  referenceName: "newEntity",
                },
                entityDefinition: {
                  transformerType: "parameterReference",
                  referenceName: "newEntityDefinition",
                },
              },
            ],
          },
        },
        // updateSplittedEntityAction
        {
          compositeActionType: "action",
          action: {
            actionType: "modelAction",
            actionName: "alterEntityAttribute",
            deploymentUuid: {
              transformerType: "parameterReference",
              referenceName: "currentDeploymentUuid",
            },
            endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
            entityName: {
              transformerType: "parameterReference",
              referenceName: "splittedEntityName",
            },
            entityUuid: {
              transformerType: "mustacheStringTemplate",
              definition: "{{splittedEntityDefinition.entityUuid}}",
            },
            entityDefinitionUuid: {
              transformerType: "mustacheStringTemplate",
              definition: "{{splittedEntityDefinition.uuid}}",
            },
            addColumns: [
              {
                name: {
                  transformerType: "parameterReference",
                  referenceName: "newEntityName",
                },
                definition: {
                  type: "string",
                  validations: [{ type: "uuid" }],
                  nullable: true, // TODO: make non-nullable and enforce FK after migration has been done!
                  tag: {
                    value: {
                      defaultLabel: "Municipality",
                      targetEntity: {
                        transformerType: "mustacheStringTemplate",
                        definition: "{{newEntity.uuid}}",
                      },
                    },
                  },
                },
              },
            ],
          },
        },
        // commit
        {
          compositeActionType: "action",
          action: {
            actionName: "commit",
            actionType: "modelAction",
            endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
            deploymentUuid: {
              transformerType: "parameterReference",
              referenceName: "currentDeploymentUuid",
            },
          }
        },
        // create NewEntity "List" and "Details" Reports Action
        {
          compositeActionType: "action",
          action: {
            actionType: "transactionalInstanceAction",
            instanceAction: {
              actionType: "instanceAction",
              actionName: "createInstance",
              applicationSection: "model",
              deploymentUuid: {
                transformerType: "parameterReference",
                referenceName: "currentDeploymentUuid",
              },
              endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
              objects: [
                {
                  parentName: {
                    transformerType: "mustacheStringTemplate",
                    definition: "{{newEntityListReport.parentName}}",
                  },
                  parentUuid: {
                    transformerType: "mustacheStringTemplate",
                    definition: "{{newEntityListReport.parentUuid}}",
                  },
                  applicationSection:'model',
                  instances: [
                    {
                      transformerType: "parameterReference",
                      referenceName: "newEntityListReport",
                    },
                    {
                      transformerType: "parameterReference",
                      referenceName: "newEntityDetailsReport",
                    },
                  ]
                }
              ],
            }
          }
        },
        // commit
        {
          compositeActionType: "action",
          action: {
            actionName: "commit",
            actionType: "modelAction",
            endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
            deploymentUuid: {
              transformerType: "parameterReference",
              referenceName: "currentDeploymentUuid",
            },
          }
        },
        // refresh / rollback
        {
          compositeActionType: "action",
          action: {
            actionName: "rollback",
            actionType: "modelAction",
            endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
            deploymentUuid: {
              transformerType: "parameterReference",
              referenceName: "currentDeploymentUuid",
            },
          }
        },
      ]
    }

    const splitFountainEntityResult = await domainController.handleCompositeActionTemplate(
      splitFountainEntity,
      actionSplitFountainEntityParams,
      props.currentModel
    );

    const actionInsertMunicipalitiesParams = {
      currentApplicationUuid: props.currentApplicationUuid,
      currentDeploymentUuid: props.currentDeploymentUuid,
      splittedEntityDefinition,
      splittedEntityName,
      splittedEntityAttribute,
      newEntityName,
      newEntityUuid,
      newEntityListReportUuid:actionSplitFountainEntityParams.newEntityListReportUuid
    };

    const actionInsertMunicipalities: CompositeActionTemplate = {
      actionType: "compositeAction",
      actionName: "sequence",
      definition: [
        // found unique municipalities from fountains
        {
          compositeActionType: "queryTemplate",
          nameGivenToResult: newEntityName,
          queryTemplate: {
            actionType: "queryTemplateAction",
            actionName: "runQuery",
            endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
            // applicationSection: "data",
            applicationSection: "model", // TODO: give only application section in individual queries?
            deploymentUuid: {
              transformerType: "parameterReference",
              referenceName: "currentDeploymentUuid"
            },
            query: {
              queryType: "extractorTemplateForRecordOfExtractors",
              deploymentUuid: {
                transformerType: "parameterReference",
                referenceName: "currentDeploymentUuid",
              },
              pageParams,
              queryParams: { },
              contextResults: { },
              extractorTemplates: {
                menuUuidIndex: {
                  queryType: "extractorTemplateForObjectListByEntity",
                  applicationSection: "model",
                  parentName: "Menu",
                  parentUuid: {
                    transformerType: "constantObject",
                    constantObjectValue: {
                      transformerType: "constantUuid",
                      constantUuidValue: entityMenu.uuid,
                    }
                  },
                },
              },
              runtimeTransformers: {
                menuList: {
                  transformerType: "objectValues",
                  interpolation: "runtime",
                  referencedExtractor: "menuUuidIndex",
                },
                menu: {
                  transformerType: "listPickElement",
                  interpolation: "runtime",
                  referencedExtractor: "menuList",
                  index: 1
                },
                menuItem: {
                  "label": "List of " + newEntityName,
                  "section": "data",
                  application: adminConfigurationDeploymentParis.uuid, // TODO: replace with application uuid, this is a deployment at the moment
                  "reportUuid": actionInsertMunicipalitiesParams.newEntityListReportUuid,
                  "icon": "location_on"
                },
                updatedMenu:{
                  transformerType: "transformer_menu_addItem",
                  interpolation: "runtime",
                  transformerDefinition: {
                    menuItemReference: {
                        transformerType: "contextReference",
                        interpolation: "runtime",
                        referenceName: "menuItem"
                    },
                    menuReference: {
                      transformerType: "contextReference",
                      interpolation: "runtime",
                      referenceName: "menu"
                    },
                    menuSectionItemInsertionIndex: -1,
                  }
                }
              },
            }
          }
        } as any, // TODO: why is type inferrence failing?
        // update Menu
        {
          compositeActionType: "action",
          compositeActionName: "updateMenu",
          action: {
            actionType: "transactionalInstanceAction",
            instanceAction: {
              actionType: "instanceAction",
              actionName: "updateInstance",
              applicationSection: "model",
              deploymentUuid: {
                transformerType: "parameterReference",
                referenceName: "currentDeploymentUuid",
              },
              endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
              objects: [
                {
                  parentName: entityMenu.name,
                  parentUuid: entityMenu.uuid,
                  applicationSection: "model",
                  instances: [
                    {
                      transformerType: "objectDynamicAccess",
                      interpolation: "runtime",
                      objectAccessPath: [
                        {
                          transformerType: "contextReference",
                          interpolation: "runtime",
                          referenceName: newEntityName,
                        },
                        "updatedMenu"
                      ],
                    },
                  ]
                }
              ],
            }
          }
        },
        // commit
        {
          compositeActionType: "action",
          action: {
            actionName: "commit",
            actionType: "modelAction",
            endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
            deploymentUuid: {
              transformerType: "parameterReference",
              referenceName: "currentDeploymentUuid",
            },
          }
        },
        // update splitted entity instances with foreign key of instances of new entity
        {
          compositeActionType: "queryTemplate",
          nameGivenToResult: newEntityName,
          queryTemplate: {
            actionType: "queryTemplateAction",
            actionName: "runQuery",
            endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
            applicationSection: "data",
            // applicationSection: "model", // TODO: give only application section in individual queries?
            deploymentUuid: {
              transformerType: "parameterReference",
              referenceName: "currentDeploymentUuid"
            },
            query: {
              queryType: "extractorTemplateForRecordOfExtractors",
              deploymentUuid: {
                transformerType: "parameterReference",
                referenceName: "currentDeploymentUuid",
              },
              pageParams,
              queryParams: { },
              contextResults: { },
              extractorTemplates: {
                [splittedEntityName + "UuidIndex"]: {
                  queryType: "extractorTemplateForObjectListByEntity",
                  applicationSection: "data",
                  parentName: {
                    transformerType: "parameterReference",
                    referenceName: "splittedEntityName",
                  },
                  parentUuid: {
                    transformerType: "freeObjectTemplate",
                    definition: {
                      transformerType: "constantString",
                      constantStringValue: {
                        transformerType: "mustacheStringTemplate",
                        definition: "{{splittedEntityDefinition.entityUuid}}",
                      },
                    },
                  },
                },
              },
              runtimeTransformers: {
                uniqueSplittedEntityInstancesSplitAttributeValues: {
                  transformerType: "unique",
                  interpolation: "runtime",
                  referencedExtractor: splittedEntityName + "UuidIndex",
                  attribute: {
                    transformerType: "parameterReference",
                    referenceName: "splittedEntityAttribute",
                  },
                },
                [splittedEntityName]: {
                  transformerType: "objectValues",
                  interpolation: "runtime",
                  referencedExtractor: splittedEntityName + "UuidIndex",
                },
                municipalities: {
                  transformerType: "mapperListToList",
                  interpolation: "runtime",
                  referencedExtractor: "uniqueSplittedEntityInstancesSplitAttributeValues",
                  elementTransformer: {
                    transformerType: "innerFullObjectTemplate", // TODO: innerFullObjectTemplate is not needed, all attributeKeys are constantString, objectTemplate should be enough
                    interpolation: "runtime",
                    referenceToOuterObject: "municipality",
                    definition: [
                      {
                        attributeKey: {
                          interpolation: "runtime",
                          transformerType: "constantString",
                          constantStringValue: "parentUuid"
                        },
                        attributeValue: {
                          transformerType: "parameterReference",
                          referenceName: "newEntityUuid",
                        }
                      },
                      {
                        attributeKey: {
                          interpolation: "runtime",
                          transformerType: "constantString",
                          constantStringValue: "uuid"
                        },
                        attributeValue: {
                          interpolation: "runtime",
                          transformerType: "newUuid",
                        }
                      },
                      {
                        attributeKey: {
                          interpolation: "runtime",
                          transformerType: "constantString",
                          constantStringValue: "name"
                        },
                        attributeValue: {
                          interpolation: "runtime",
                          transformerType: "mustacheStringTemplate",
                          definition: "{{municipality.Commune}}" // TODO: correct attribute name!
                        }
                      }
                    ]
                  }
                },
                municipalitiesIndexedByUuid: {
                  transformerType: "mapperListToObject",
                  interpolation: "runtime",
                  referencedExtractor: "municipalities",
                  indexAttribute: "uuid",
                },
                municipalitiesIndexedByName: {
                  transformerType: "mapperListToObject",
                  interpolation: "runtime",
                  referencedExtractor: "municipalities",
                  indexAttribute: "name",
                },
                ["updated" + splittedEntityName]: {
                  transformerType: "mapperListToList",
                  interpolation: "runtime",
                  // referencedExtractor: "fountains",
                  referencedExtractor: splittedEntityName,
                  elementTransformer: {
                    transformerType: "objectAlter",
                    interpolation: "runtime",
                    referenceToOuterObject: "objectAlterTmpReference",
                    definition: {
                      transformerType: "freeObjectTemplate",
                      interpolation: "runtime",
                      definition: {
                        [newEntityName]: {
                          transformerType: "objectDynamicAccess",
                          interpolation: "runtime",
                          objectAccessPath: [
                            {
                              transformerType: "contextReference",
                              interpolation: "runtime",
                              referenceName: "municipalitiesIndexedByName",
                            },
                            {
                              transformerType: "objectDynamicAccess",
                              interpolation: "runtime",
                              objectAccessPath: [
                                {
                                  transformerType: "contextReference",
                                  interpolation: "runtime",
                                  // referenceName: splittedEntityName,
                                  // referenceName: "fountains",
                                  referenceName: "objectAlterTmpReference",
                                },
                                splittedEntityAttribute,
                                // "Commune",
                              ],
                            },
                            "uuid"
                          ],
                        },
                      }
                    }
                  }
                },
              },
            }
          }
        } as any, // TODO: why is type inferrence failing?
        // insert new Entity instance with new uuid for each
        {
          compositeActionType: "action",
          compositeActionName: "insert municipalities",
          action: {
            actionType: "instanceAction",
            actionName: "createInstance",
            applicationSection: "data",
            deploymentUuid: {
              transformerType: "parameterReference",
              referenceName: "currentDeploymentUuid",
            },
            endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
            objects:[
              {
                parentName: {
                  transformerType: "mustacheStringTemplate",
                  definition: "{{newEntityName}}",
                },
                parentUuid:{
                  transformerType: "mustacheStringTemplate",
                  definition: "{{newEntityUuid}}",
                },
                applicationSection:'data',
                instances: {
                  transformerType: "contextReference",
                  interpolation: "runtime",
                  // referenceName: "municipalities"
                  referencePath: ["Municipality", "municipalities"]
                  // referencePath: ["Municipality"]
                },
              }
            ]
          },
        // // },// as CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_instanceAction, // TODO: why is type inferrence failing?
        } as any,// as CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_instanceAction, // TODO: why is type inferrence failing?
        // update SplittedEntity with new FK attribute
        {
          compositeActionType: "action",
          compositeActionName: "update fountains",
          action: {
            actionType: 'instanceAction',
            actionName: "updateInstance",
            applicationSection: "data",
            deploymentUuid: currentDeploymentUuid,
            endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
            objects: [
              {
                parentName:splittedEntityName,
                parentUuid:splittedEntityDefinition.entityUuid,
                applicationSection:'data',
                instances: {
                  transformerType: "contextReference",
                  interpolation: "runtime",
                  // referenceName: "municipalities"
                  referencePath: ["Municipality", "updated" + splittedEntityName]
                }
              }
            ]
          }
        }

      ]
    };

    log.info("#################################### splitEntity actionInsertMunicipalities", actionInsertMunicipalities);
    const actionInsertMunicipalitiesResult = await domainController.handleCompositeActionTemplate(
      actionInsertMunicipalities,
      actionInsertMunicipalitiesParams,
      props.currentModel
    );
    log.info("#################################### splitEntity DONE");

    if (actionInsertMunicipalitiesResult.status != "ok") {
      throw new Error("splitEntity found actionInsertMunicipalities with error " + actionInsertMunicipalitiesResult.error);
    }
    log.info("splitEntity updated miroirMenu DONE");
    
  } // end splitEntity

  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  const [formState,setFormState] = useState<{[k:string]:any}>(initialValues)

  // const [formHelperState, setformHelperState] = useMiroirContextformHelperState(); // NOT USED

  const [rawSchema, setRawSchema] = useState<JzodElement>(
    actionHandlerCreateApplication.interface.actionJzodObjectSchema
  );

  const currentModel: MetaModel = useCurrentModel(
    context.applicationSection == "data" ? context.deploymentUuid : adminConfigurationDeploymentMiroir.uuid
  );
  const currentMiroirModel = useCurrentModel(adminConfigurationDeploymentMiroir.uuid);

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

  const onSubmit = useCallback(
    async (actionCreateSchemaParamValues: any /* actually follows formJzodSchema */, formikFunctions:{ setSubmitting:any, setErrors:any }) => {
      try {
        //  Send values somehow
        // setformHelperState(actionCreateSchemaParamValues);

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

        // await createEntity();
        const {
          actionHandlerCreateFountainEntity,
          actionEffectiveParamsCreateEntity,
        } = createEntity();

        const createFountainEntityResult = await domainController.handleCompositeActionTemplate(
          actionHandlerCreateFountainEntity,
          actionEffectiveParamsCreateEntity,
          props.currentModel
        );
    
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
        importer props: application={JSON.stringify(props.currentApplicationUuid)} deployment={JSON.stringify(props.currentDeploymentUuid)} filename={JSON.stringify(props.filename)}
      </h4>
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
    </>
  );
}