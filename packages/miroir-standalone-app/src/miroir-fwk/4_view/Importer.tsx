import { Button } from "@mui/material";
import { FC, ReactNode, useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from 'uuid';
import { z } from "zod";
// import * as XLSX from 'xlsx/xlsx.mjs';
import {
  ActionReturnType,
  DomainAction,
  DomainControllerInterface,
  DomainElementObject,
  ExtractorTemplateForRecordOfExtractors,
  EntityDefinition,
  EntityInstance,
  InstanceAction,
  JzodObject,
  LoggerInterface,
  Menu,
  MetaEntity,
  MiroirLoggerFactory,
  Report,
  entityEntity,
  entityEntityDefinition,
  entityReport,
  entityMenu,
  getLoggerName,
  metaModel,
  JzodPlainAttribute,
  JzodAttributePlainStringWithValidations,
  ActionHandler,
  CompositeInstanceActionTemplate,
  DomainElement,
  compositeAction,
  CompositeActionTemplate,
  CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainAction
} from "miroir-core";
import * as XLSX from 'xlsx';
import { useDomainControllerService } from "./MiroirContextReactProvider.js";
import { packageName } from "../../constants.js";
import { cleanLevel } from "./constants.js";
import { AddBox } from "@mui/icons-material";


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

export const Importer:FC<ImporterCoreProps> = (props:ImporterCoreProps) => {

  const [file, setFile] = useState(null);
  const [fileDataURL, setFileDataURL] = useState<any>(null);
  const [fileData, setFileData] = useState<string[]>([]);
  const [currentWorkSheet, setCurrentWorkSheet] = useState<XLSX.WorkSheet | undefined>(undefined);

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
  // #######################################################################################################################################
  // ##############################################################################################
  const createEntity = async () => {
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
      //TODO: tag params, should be passed as context instead?
      jzodSchema,
      entityEntityDefinition,
      entityReport,
      newEntity,
    }
    // const actionHandlerCreateEntity: ActionHandler = useMemo(()=>({
    // const actionHandlerCreateFountainEntity: ActionHandler = {
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
                queryType: "queryExtractObjectListByEntity",
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
                // "parentName": "Fountain",
                parentUuid: {
                  transformerType: "mustacheStringTemplate",
                  definition: "{{newEntity.uuid}}",
                },
                fetchedDataReference: "instanceList",
              },
            },
          },
        },
        // // Details of an instance Report Definition
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
                queryType: "selectObjectByDirectReference",
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
          // action: {
          //   transformerType: "parameterReference",
          //   referenceName: "createEntityAction",
          // },
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
                    // newEntityListReport as EntityInstance,
                    // newEntityDetailsReport as EntityInstance,
                  ],
                },
              ],
            },
          },
          // action: {
          //   transformerType: "parameterReference",
          //   referenceName: "createReportsAction",
          // },
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
      ],
      // }
    };
    // }), [])

    // await handleCompositeActionDEFUNCT(
    //   domainController,
    //   actionHandlerCreateFountainEntity,
    //   actionEffectiveParamsCreateEntity,
    //   props.currentModel
    // )
    const createFountainEntityResult = await domainController.handleCompositeActionTemplate(
      actionHandlerCreateFountainEntity,
      actionEffectiveParamsCreateEntity,
      props.currentModel
    );

    // ############################################################################################
    //  add instances from Excel file (rows)
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

    // const actionHandlerImportFountains: ActionHandler = {
    //   interface: {
    //     actionJzodObjectSchema: {
    //       type: "object",
    //       definition: {
    //         newEntityName: {
    //           type: "string"
    //         },
    //         newEntityDescription: {
    //           type: "string"
    //         },
    //         newEntityUuid: {
    //           type: "uuid"
    //         },
    //         currentApplicationUuid: {
    //           type: "uuid"
    //         },
    //         currentDeploymentUuid: {
    //           type: "uuid"
    //         },
    //         newEntityDefinitionUuid: {
    //           type: "uuid"
    //         },
    //         newEntityDetailsReportUuid: {
    //           type: "uuid"
    //         },
    //         newEntityListReportUuid: {
    //           type: "uuid"
    //         }
    //       }
    //     }
    //   },
    //   implementation: {
    //     templates: {
    //       createRowsAction: {
    //         actionType: 'instanceAction',
    //         actionName: "createInstance",
    //         applicationSection: "data",
    //         deploymentUuid: {
    //           transformerType: "parameterReference",
    //           referenceName: "currentDeploymentUuid",
    //         },
    //         endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
    //         objects:[
    //           {
    //             parentName: {
    //               transformerType: "mustacheStringTemplate",
    //               definition: "{{newEntity.name}}",
    //             },
    //             parentUuid:{
    //               transformerType: "mustacheStringTemplate",
    //               definition: "{{newEntity.uuid}}",
    //             },
    //             applicationSection:'data',
    //             instances:instances,
    //           }
    //         ]
    //       },
    //     },
    //     compositeActionTemplate: {
    //       actionType: "compositeAction",
    //       actionName: "sequence",
    //       definition: [
    //         {
    //           compositeActionType: "action",
    //           action: {
    //             transformerType: "parameterReference",
    //             referenceName: "createRowsAction",
    //           },
    //         }
    //       ]
    //     }
    
    //   }
    // };

    // await handleCompositeActionDEFUNCT(
    //   domainController,
    //   actionHandlerImportFountains,
    //   actionEffectiveParamsCreateEntity,
    //   props.currentModel
    // )

    const importFountains: CompositeActionTemplate = {
      actionType: "compositeAction",
      actionName: "sequence",
      definition: [
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
      ],
    };
    // }
    // await handleCompositeActionDEFUNCT(
    //   domainController,
    //   actionHandlerImportFountains,
    //   actionEffectiveParamsCreateEntity,
    //   props.currentModel
    // )

    const importFountainsResult = await domainController.handleCompositeActionTemplate(
      importFountains,
      actionEffectiveParamsCreateEntity, //same params as createEntity!
      props.currentModel
    );

    log.info('createEntity DONE adding instances');

    // ############################################################################################
    // modify global menu (shall be removed, find another solution! is this solution part of a "Menu" DSL / Endpoint? "add menu item" action?)
    const miroirMenuInstancesQuery: ExtractorTemplateForRecordOfExtractors = {
      queryType: "extractorTemplateForRecordOfExtractors",
      deploymentUuid: currentDeploymentUuid,
      pageParams: {},
      queryParams: {},
      contextResults: {},
      extractorTemplates: {
        menus: {
          queryType: "queryTemplateExtractObjectListByEntity",
          applicationSection: "model",
          parentName: "Menu",
          parentUuid: {
            transformerType: "constantUuid",
            constantUuidValue: entityMenu.uuid,
          },
        },
      },
    };
    const miroirMenuInstances: ActionReturnType = 
      await domainController.handleQueryTemplateForServerONLY(
        {
          actionType: "queryTemplateAction",
          actionName: "runQuery",
          deploymentUuid:currentDeploymentUuid,
          applicationSection: "model",
          endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
          query: miroirMenuInstancesQuery
        }
      )
    ;

    if (miroirMenuInstances.status != "ok") {
      throw new Error("createEntity found miroirMenuInstances with error " + miroirMenuInstances.error);
    }

    if (!["entityInstanceCollection", "object"].includes(miroirMenuInstances.returnedDomainElement.elementType)) {
      throw new Error("createEntity found miroirMenuInstances not an instance collection " + miroirMenuInstances.returnedDomainElement);
    }
    log.info("createEntity found miroirMenuInstances", JSON.stringify(miroirMenuInstances));

    const oldMenu: Menu | undefined = (Object.values(
      miroirMenuInstances.returnedDomainElement.elementValue["menus"]
    ) as Menu[]).find((e: Menu) => e.name == actionEffectiveParamsCreateEntity.currentApplicationName + "Menu");

    if (!oldMenu) {
      throw new Error("createEntity found no oldMenu " + JSON.stringify(miroirMenuInstances));
    }
    const newMenu:Menu = {
      ...oldMenu,
      definition: {
        menuType: 'complexMenu',
        definition: [
          oldMenu.definition.definition[0],
          {
            ...oldMenu.definition.definition[1],
            items: [
              ...((oldMenu.definition.definition[1] as any)?.items??[]),
              {
                // "label": newEntityListReport.defaultLabel,
                "label": "List of " + newEntityName,
                "section": "data",
                "application": currentDeploymentUuid,
                // "reportUuid": newEntityListReport.uuid,
                "reportUuid": actionEffectiveParamsCreateEntity.newEntityListReportUuid,
                "icon": "local_drink"
              },
            ]
          } as any
        ]
      }
    };
    
    const menuUpdateAction: DomainAction = {
      actionType: "transactionalInstanceAction",
      instanceAction: {
        actionType: "instanceAction",
        actionName: "updateInstance",
        applicationSection: "model",
        deploymentUuid: currentDeploymentUuid,
        endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
        objects: [
          {
            parentName: entityMenu.name,
            parentUuid: entityMenu.uuid,
            applicationSection: "model",
            instances: [
              newMenu
            ],
          },
        ],
      }
    };
    await domainController.handleAction(menuUpdateAction, props.currentModel);
    await domainController.handleAction(
      {
        actionName: "commit",
        actionType: "modelAction",
        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        deploymentUuid: currentDeploymentUuid,
      },
      props.currentModel
    );

    // log.info("createEntity updated miroirMenu DONE", JSON.stringify(newMenu));
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

    // const actionHandlerSplitFountainEntity: ActionHandler = {
    //   interface: {
    //     actionJzodObjectSchema: {
    //       type: "object",
    //       definition: {
    //         splittedEntityName: { type: "string" },
    //         splittedEntityAttribute: { type: "string" },
    //         newEntityName: { type: "string" },
    //         newEntityDescription: { type: "string" },
    //         newEntityUuid: { type: "uuid" },
    //         newEntityDetailsReportUuid: { type: "uuid" },
    //         currentApplicationUuid: { type: "uuid" },
    //         currentDeploymentUuid: { type: "uuid" },
    //       },
    //     },
    //   },
    //   implementation: {
    //     templates: {
    //       newEntity: {
    //         uuid: {
    //           transformerType: "parameterReference",
    //           referenceName: "newEntityUuid",
    //         },
    //         name: {
    //           transformerType: "parameterReference",
    //           referenceName: "newEntityName",
    //         },
    //         description: {
    //           transformerType: "parameterReference",
    //           referenceName: "newEntityDescription",
    //         },
    //         parentUuid: {
    //           transformerType: "mustacheStringTemplate",
    //           definition: "{{entityEntity.uuid}}",
    //         },
    //         application: {
    //           transformerType: "parameterReference",
    //           referenceName: "currentApplicationUuid",
    //         },
    //       },
    //       newEntityJzodSchema: {
    //         type: "object",
    //         definition: {
    //           uuid: {
    //             type: "uuid",
    //             tag: { id: 1, defaultLabel: "Uuid", editable: false },
    //           } as JzodPlainAttribute,
    //           name: {
    //             type: "string",
    //             tag: { id: 2, defaultLabel: "name", editable: false },
    //           } as JzodAttributePlainStringWithValidations,
    //         },
    //       },
    //       newEntityDefinition: {
    //         name: {
    //           transformerType: "parameterReference",
    //           referenceName: "newEntityName",
    //         },
    //         uuid: uuidv4(),
    //         parentName: "EntityDefinition",
    //         parentUuid: {
    //           transformerType: "mustacheStringTemplate",
    //           definition: "{{entityEntityDefinition.uuid}}",
    //         },
    //         entityUuid: {
    //           transformerType: "mustacheStringTemplate",
    //           definition: "{{newEntity.uuid}}",
    //         },
    //         conceptLevel: "Model",
    //         defaultInstanceDetailsReportUuid: {
    //           transformerType: "parameterReference",
    //           referenceName: "newEntityDetailsReportUuid",
    //         },
    //         jzodSchema: {
    //           transformerType: "parameterReference",
    //           referenceName: "newEntityJzodSchema",
    //         },
    //       },
    //       // TODO: use template / concat for uuid, name, defaultLabel
    //       newEntityListReport: {
    //         uuid: uuidv4(),
    //         application: {
    //           transformerType: "parameterReference",
    //           referenceName: "currentApplicationUuid",
    //         },
    //         parentName: "Report",
    //         parentUuid: "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
    //         conceptLevel: "Model",
    //         name: newEntityName + "List",
    //         defaultLabel: "List of " + newEntityDescription,
    //         type: "list",
    //         definition: {
    //           extractors: {
    //             listReportSectionElements: {
    //               queryType: "queryTemplateExtractObjectListByEntity",
    //               parentName: {
    //                 transformerType: "parameterReference",
    //                 referenceName: "newEntityName",
    //               },
    //               parentUuid: {
    //                 transformerType: "mustacheStringTemplate",
    //                 definition: "{{newEntity.uuid}}",
    //               },
    //             },
    //           },
    //           section: {
    //             type: "objectListReportSection",
    //             definition: {
    //               label: {
    //                 transformerType: "parameterReference",
    //                 referenceName: "newEntityDescription",
    //               },
    //               // "parentName": "Fountain",
    //               parentUuid: {
    //                 transformerType: "mustacheStringTemplate",
    //                 definition: "{{newEntity.uuid}}",
    //               },
    //               fetchedDataReference: "listReportSectionElements",
    //             },
    //           },
    //         },
    //       },
    //       // TODO: use template / concat for uuid, name, defaultLabel
    //       newEntityDetailsReport: {
    //         uuid: newEntityDetailsReportUuid,
    //         application: {
    //           transformerType: "parameterReference",
    //           referenceName: "currentApplicationUuid",
    //         },
    //         parentName: "Report",
    //         parentUuid: "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
    //         conceptLevel: "Model",
    //         name: newEntityName + "Details",
    //         defaultLabel: "Details of " + newEntityDescription,
    //         definition: {
    //           extractorTemplates: {
    //             elementToDisplay: {
    //               queryType: "selectObjectByDirectReference",
    //               parentName: newEntityName,
    //               parentUuid: {
    //                 transformerType: "constantUuid",
    //                 constantUuidValue: {
    //                   transformerType: "mustacheStringTemplate",
    //                   definition: "{{newEntity.uuid}}",
    //                 },
    //               },
    //               instanceUuid: {
    //                 // queryTemplateType: "queryParameterReference",
    //                 // referenceName: "instanceUuid",
    //                 transformerType: "constantObject",
    //                 constantObjectValue: {
    //                   transformerType: "parameterReference",
    //                   referenceName: "instanceUuid",
    //                 },
    //               },
    //             },
    //             fountainsOfMunicipality: {
    //               queryType: "selectObjectListByRelation",
    //               parentName: "Fountain",
    //               parentUuid: {
    //                 transformerType: "constantUuid",
    //                 constantUuidValue: splittedEntityDefinition.entityUuid,
    //               },
    //               objectReference: {
    //                 referenceName: "elementToDisplay",
    //                 queryTemplateType: "queryContextReference",
    //               },
    //               AttributeOfListObjectToCompareToReferenceUuid: newEntityName,
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
    //                     transformerType: "mustacheStringTemplate",
    //                     definition: "{{newEntity.uuid}}",
    //                   },
    //                   fetchedDataReference: "elementToDisplay",
    //                 },
    //               },
    //               {
    //                 type: "objectListReportSection",
    //                 definition: {
    //                   label: newEntityName + "'s (${elementToDisplay.name}) " + splittedEntityName + "s",
    //                   parentName: splittedEntityName,
    //                   parentUuid: splittedEntityDefinition.entityUuid,
    //                   fetchedDataReference: "fountainsOfMunicipality",
    //                   sortByAttribute: "name",
    //                 },
    //               },
    //             ],
    //           },
    //         },
    //       },
    //     },
    //     compositeActionTemplate: {
    //       actionType: "compositeAction",
    //       actionName: "sequence",
    //       definition: [
    //         // createEntity
    //         {
    //           compositeActionType: "action",
    //           // compositeActionName: "create new Entity",
    //           action: {
    //             actionType: "modelAction",
    //             actionName: "createEntity",
    //             deploymentUuid: {
    //               transformerType: "parameterReference",
    //               referenceName: "currentDeploymentUuid",
    //             },
    //             endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
    //             entities: [
    //               {
    //                 entity: {
    //                   transformerType: "parameterReference",
    //                   referenceName: "newEntity",
    //                 },
    //                 entityDefinition: {
    //                   transformerType: "parameterReference",
    //                   referenceName: "newEntityDefinition",
    //                 },
    //               },
    //             ],
    //           },
    //         },
    //         // updateSplittedEntityAction
    //         {
    //           compositeActionType: "action",
    //           action: {
    //             actionType: "modelAction",
    //             actionName: "alterEntityAttribute",
    //             deploymentUuid: {
    //               transformerType: "parameterReference",
    //               referenceName: "currentDeploymentUuid",
    //             },
    //             endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
    //             entityName: {
    //               transformerType: "parameterReference",
    //               referenceName: "splittedEntityName",
    //             },
    //             entityUuid: {
    //               transformerType: "mustacheStringTemplate",
    //               definition: "{{splittedEntityDefinition.entityUuid}}",
    //             },
    //             entityDefinitionUuid: {
    //               transformerType: "mustacheStringTemplate",
    //               definition: "{{splittedEntityDefinition.uuid}}",
    //             },
    //             addColumns: [
    //               {
    //                 name: {
    //                   transformerType: "parameterReference",
    //                   referenceName: "newEntityName",
    //                 },
    //                 definition: {
    //                   type: "string",
    //                   validations: [{ type: "uuid" }],
    //                   nullable: true, // TODO: make non-nullable and enforce FK after migration has been done!
    //                   tag: {
    //                     value: {
    //                       defaultLabel: "Municipality",
    //                       targetEntity: {
    //                         transformerType: "mustacheStringTemplate",
    //                         definition: "{{newEntity.uuid}}",
    //                       },
    //                     },
    //                   },
    //                 },
    //               },
    //             ],
    //           },
    //         },
    //         // commit
    //         {
    //           compositeActionType: "action",
    //           action: {
    //             actionName: "commit",
    //             actionType: "modelAction",
    //             endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
    //             deploymentUuid: {
    //               transformerType: "parameterReference",
    //               referenceName: "currentDeploymentUuid",
    //             },
    //           }
    //         },
    //         // create NewEntity "List" and "Details" Reports Action
    //         {
    //           compositeActionType: "action",
    //           action: {
    //             actionType: "transactionalInstanceAction",
    //             instanceAction: {
    //               actionType: "instanceAction",
    //               actionName: "createInstance",
    //               applicationSection: "model",
    //               deploymentUuid: {
    //                 transformerType: "parameterReference",
    //                 referenceName: "currentDeploymentUuid",
    //               },
    //               endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
    //               objects: [
    //                 {
    //                   parentName: {
    //                     transformerType: "mustacheStringTemplate",
    //                     definition: "{{newEntityListReport.parentName}}",
    //                   },
    //                   parentUuid: {
    //                     transformerType: "mustacheStringTemplate",
    //                     definition: "{{newEntityListReport.parentUuid}}",
    //                   },
    //                   applicationSection:'model',
    //                   instances: [
    //                     {
    //                       transformerType: "parameterReference",
    //                       referenceName: "newEntityListReport",
    //                     },
    //                     {
    //                       transformerType: "parameterReference",
    //                       referenceName: "newEntityDetailsReport",
    //                     },
    //                   ]
    //                 }
    //               ],
    //             }
    //           }
    //         },
    //         // commit
    //         {
    //           compositeActionType: "action",
    //           action: {
    //             actionName: "commit",
    //             actionType: "modelAction",
    //             endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
    //             deploymentUuid: {
    //               transformerType: "parameterReference",
    //               referenceName: "currentDeploymentUuid",
    //             },
    //           }
    //         },
    //         // // find splitted entity instances
    //         // {
    //         //   compositeActionType: "query",
    //         //   query: {
    //         //     actionType: "queryTemplateAction",
    //         //     actionName: "runQuery",
    //         //     endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
    //         //     deploymentUuid: {
    //         //       transformerType: "parameterReference",
    //         //       referenceName: "currentDeploymentUuid"
    //         //     },
    //         //     query: {
    //         //       transformerType: "parameterReference",
    //         //       referenceName: "splittedEntityInstancesQuery"
    //         //     }
    //         //   }
    //         // }
    //       ],
    //     },
    //   },
    // };

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
        // TODO: use template / concat for uuid, name, defaultLabel
        newEntityListReport: {
          uuid: uuidv4(),
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
            extractorTemplates: {
              listReportSectionElements: {
                queryType: "queryTemplateExtractObjectListByEntity",
                parentName: {
                  transformerType: "parameterReference",
                  referenceName: "newEntityName",
                },
                parentUuid: {
                  transformerType: "constantUuid",
                  constantUuidValue: {
                    transformerType: "mustacheStringTemplate",
                    definition: "{{newEntity.uuid}}",
                  },
                },
              },
            },
            section: {
              type: "objectListReportSection",
              definition: {
                label: {
                  transformerType: "parameterReference",
                  referenceName: "newEntityDescription",
                },
                // "parentName": "Fountain",
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
                queryType: "selectObjectByDirectReference",
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
                queryType: "selectObjectListByRelation",
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
            // // find splitted entity instances
            // {
            //   compositeActionType: "query",
            //   query: {
            //     actionType: "queryTemplateAction",
            //     actionName: "runQuery",
            //     endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
            //     deploymentUuid: {
            //       transformerType: "parameterReference",
            //       referenceName: "currentDeploymentUuid"
            //     },
            //     query: {
            //       transformerType: "parameterReference",
            //       referenceName: "splittedEntityInstancesQuery"
            //     }
            //   }
            // }
      ]
    }

    const splitFountainEntityResult = await domainController.handleCompositeActionTemplate(
      splitFountainEntity,
      actionSplitFountainEntityParams,
      props.currentModel
    );
    // await handleCompositeActionDEFUNCT(
    //   domainController,
    //   actionHandlerSplitFountainEntity,
    //   actionSplitFountainEntityParams,
    //   props.currentModel
    // )

    const actionInsertMunicipalitiesParams = {
      currentApplicationUuid: props.currentApplicationUuid,
      currentDeploymentUuid: props.currentDeploymentUuid,
      splittedEntityDefinition,
      splittedEntityName,
      splittedEntityAttribute,
      newEntityName,
      newEntityUuid,
    };
    // const actionInsertMunicipalitiesParams: DomainElement = {
    //   elementType: "object",
    //   elementValue: {
    //     currentApplicationUuid: {elementType: "string", elementValue: props.currentApplicationUuid},
    //     currentDeploymentUuid: {elementType: "string", elementValue: props.currentDeploymentUuid},
    //     splittedEntityDefinition: {elementType: "instance", elementValue: splittedEntityDefinition},
    //     splittedEntityName: {elementType: "string", elementValue: splittedEntityName},
    //     splittedEntityAttribute: {elementType: "string", elementValue: splittedEntityAttribute},
    //     newEntityName: {elementType: "string", elementValue: newEntityName},
    //     newEntityUuid: {elementType: "string", elementValue: newEntityUuid},
    //   }
    // };

    const actionInsertMunicipalities: CompositeActionTemplate = {
      actionType: "compositeAction",
      actionName: "sequence",
      definition: [
        // found unique municipalities from fountains
        {
          compositeActionType: "query",
          nameGivenToResult: newEntityName,
          queryTemplateAction: {
            actionType: "queryTemplateAction",
            actionName: "runQuery",
            endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
            applicationSection: "data",
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
                [splittedEntityName]: {
                  queryType: "queryTemplateExtractObjectListByEntity",
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
                    //   transformerType: "constantUuid",
                    // constantUuidValue: {
                    //   transformerType: "mustacheStringTemplate",
                    //   definition: "{{splittedEntityDefinition.entityUuid}}",
                    // },
                  },
                },
                // {
                  //   queryType: "extractorTemplateForRecordOfExtractors",
                  //   deploymentUuid: currentDeploymentUuid,
                  //   pageParams: miroirMenuPageParams,
                  //   queryParams: { elementType: "object", elementValue: {} },
                  //   contextResults: { elementType: "object", elementValue: {} },
                  //   runtimeTransformers: {
                  //     select: {
                menus: {
                  queryType: "queryTemplateExtractObjectListByEntity",
                  applicationSection: "model",
                  parentName: "Menu",
                  parentUuid: {
                    transformerType: "constantUuid",
                    constantUuidValue: entityMenu.uuid,
                  },
                },
                  //     }
                  //   },
                  // }
              },
              runtimeTransformers: {
                uniqueSplittedEntityInstances: {
                  transformerType: "unique",
                  interpolation: "runtime",
                  referencedExtractor:  {
                    transformerType: "parameterReference",
                    referenceName: "splittedEntityName",
                  },
                  attribute: {
                    transformerType: "parameterReference",
                    referenceName: "splittedEntityAttribute",
                  },
                },
                "fountains": {
                  transformerType: "objectValues",
                  interpolation: "runtime",
                  referencedExtractor: splittedEntityName,
                },
                // splittedEntityInstancesArray: {
                //   transformerType: "objectValues",
                //   interpolation: "runtime",
                //   referencedExtractor: "uniqueSplittedEntityInstances",
                // },
                municipalities: {
                  transformerType: "mapperListToList",
                  interpolation: "runtime",
                  referencedExtractor: "uniqueSplittedEntityInstances",
                  elementTransformer: {
                    transformerType: "fullObjectTemplate", // TODO: fullObjectTemplate is not needed, all attributeKeys are constantString, objectTemplate should be enough
                    interpolation: "runtime",
                    referencedExtractor: "municipality",
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
                updatedFountains: {
                  transformerType: "mapperListToList",
                  interpolation: "runtime",
                  referencedExtractor: "fountains",
                  elementTransformer: {
                    transformerType: "objectAlter",
                    interpolation: "runtime",
                    referencedExtractor: "objectAlterTmpReference",
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
                }
              },
            }
          }
        },
        // insert municipalities with new uuid for each
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
            actionName: "createInstance",
            applicationSection: "data",
            deploymentUuid: currentDeploymentUuid,
            endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
            objects: [
              {
                parentName:newEntityName,
                parentUuid:newEntityUuid,
                applicationSection:'data',
                instances: {
                  transformerType: "contextReference",
                  interpolation: "runtime",
                  // referenceName: "municipalities"
                  referencePath: ["Municipality", "updatedFountains"]
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



    // // ############################################################################################
    // // modify menu
    // const miroirMenuPageParams: DomainElementObject = {
    //   elementType: "object",
    //   elementValue: {
    //     deploymentUuid: { elementType: "string", elementValue: currentDeploymentUuid },
    //     applicationSection: { elementType: "string", elementValue: "model" },
    //   },
    // };
    
    // const miroirMenuInstancesQuery: ExtractorTemplateForRecordOfExtractors = {
    //   queryType: "extractorTemplateForRecordOfExtractors",
    //   deploymentUuid: currentDeploymentUuid,
    //   pageParams: miroirMenuPageParams,
    //   queryParams: { elementType: "object", elementValue: {} },
    //   contextResults: { elementType: "object", elementValue: {} },
    //   runtimeTransformers: {
    //     select: {
    //       menus: {
    //         queryType: "queryTemplateExtractObjectListByEntity",
    //         applicationSection: "model",
    //         parentName: "Menu",
    //         parentUuid: {
    //           transformerType: "constantUuid",
    //           constantUuidValue: entityMenu.uuid,
    //         },
    //       },
    //     }
    //   },
    // };
    // const miroirMenuInstances: ActionReturnType = 
    //   await domainController.handleQueryTemplateForServerONLY(
    //     {
    //       actionType: "queryTemplateAction",
    //       actionName: "runQuery",
    //       deploymentUuid:currentDeploymentUuid,
    //       endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
    //       query: miroirMenuInstancesQuery
    //     }
    //   )
    // ;
    
    // if (miroirMenuInstances.status != "ok") {
    //   throw new Error("splitEntity found miroirMenuInstances with error " + miroirMenuInstances.error);
    // }

    // if (miroirMenuInstances.returnedDomainElement.elementType != "entityInstanceCollection") {
    //   throw new Error("splitEntity found miroirMenuInstances not an instance collection " + miroirMenuInstances.returnedDomainElement);
    // }
    // log.info("splitEntity found miroirMenuInstances", JSON.stringify(miroirMenuInstances));
    
    // const oldMenu: Menu = miroirMenuInstances.returnedDomainElement.elementValue.instances[0] as any;
    // const newMenu:Menu = {
    //   ...oldMenu,
    //   definition: {
    //     menuType: 'complexMenu',
    //     definition: [
    //       oldMenu.definition.definition[0],
    //       {
    //         ...oldMenu.definition.definition[1],
    //         items: [
    //           ...(oldMenu.definition.definition[1] as any).items,
    //           {
    //             "label": newEntityListReport.defaultLabel,
    //             "section": "data",
    //             "application": currentDeploymentUuid,
    //             "reportUuid": newEntityListReport.uuid,
    //             "icon": "location_on"
    //           },
    //         ]
    //       } as any
    //     ]
    //   }
    // };
        
    // const menuUpdateAction: DomainAction = {
    //   actionType: "transactionalInstanceAction",
    //   instanceAction: {
    //     actionType: "instanceAction",
    //     actionName: "updateInstance",
    //     applicationSection: "model",
    //     deploymentUuid: currentDeploymentUuid,
    //     endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
    //     objects: [
    //       {
    //         parentName: entityMenu.name,
    //         parentUuid: entityMenu.uuid,
    //         applicationSection: "model",
    //         instances: [
    //           newMenu
    //           // Object.assign({}, reportReportList, {
    //           //   name: "Report2List",
    //           //   defaultLabel: "Modified List of Reports",
    //           // }) as EntityInstance,
    //         ],
    //       },
    //     ],
    //   }
    // };
    // await domainController.handleAction(menuUpdateAction, props.currentModel);
    // await domainController.handleAction(
    //   {
    //     actionName: "commit",
    //     actionType: "modelAction",
    //     endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
    //     deploymentUuid: currentDeploymentUuid,
    //   },
    //   props.currentModel
    // );

    log.info("splitEntity updated miroirMenu DONE");
    
  } // end splitEntity

  return (
    <>
    <form>
      <p>
        <label htmlFor='image'> Browse images  </label>
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