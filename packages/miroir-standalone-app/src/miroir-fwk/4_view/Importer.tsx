import AddBoxIcon from '@mui/icons-material/AddBox';
import { Button } from "@mui/material";
import { FC, useEffect, useState } from "react";
import { v4 as uuidv4 } from 'uuid';
import { z } from "zod";
// import * as XLSX from 'xlsx/xlsx.mjs';
import {
  ActionReturnType,
  DomainAction,
  DomainControllerInterface,
  DomainElementObject,
  DomainManyQueriesWithDeploymentUuid,
  EntityDefinition,
  EntityInstance,
  InstanceAction,
  JzodAttribute,
  LoggerInterface,
  Menu,
  MetaEntity,
  MiroirLoggerFactory,
  Report,
  entityEntity,
  entityEntityDefinition,
  entityMenu,
  getLoggerName,
  metaModel
} from "miroir-core";
import * as XLSX from 'xlsx';
import { useDomainControllerService } from "./MiroirContextReactProvider";
// import { JzodObject } from "@miroir-framework/jzod-ts";
import { JzodObject } from "miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { packageName } from "../../constants";
import { cleanLevel } from "./constants";
// import { JzodObject } from "@miroir-framework/jzod-ts";


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
  // ##############################################################################################
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
    // const attributes: EntityAttribute[] = [
    //   {
    //     id:0,
    //     type:'STRING',
    //     name: 'uuid',
    //     defaultLabel:'Uuid',
    //     description: '',
    //     editable: false,
    //     nullable: false,
    //   } as EntityAttribute
    // ].concat(Object.values(fileData[0]).map((a:string,index)=>({
    //   id:index + 1,
    //   type:'STRING',
    //   name: a,
    //   defaultLabel:a,
    //   description: '',
    //   editable: true,
    //   nullable: true,
    // })));
    log.info("createEntity fileData", fileData);
    const jzodSchema:JzodObject = {
      type: "object",
      definition: Object.assign(
        {},
        {
          uuid: {
            type: "simpleType",
            definition: "string",
            validations: [{ type: "uuid" }],
            extra: { id: 1, defaultLabel: "Uuid", editable: false },
          },
          parentName: {
            type: "simpleType",
            definition: "string",
            optional: true,
            extra: { id: 1, defaultLabel: "Uuid", editable: false },
          },
          parentUuid: {
            type: "simpleType",
            definition: "string",
            validations: [{ type: "uuid" }],
            extra: { id: 1, defaultLabel: "parentUuid", editable: false },
          },
        },
        ...(
          fileData[0]?
          Object.values(fileData[0]).map(
            (a: string, index) => (
              {
                [a]: {
                  type: "simpleType",
                  definition: "string",
                  optional: true,
                  extra: { id: index + 2 /* uuid attribute has been added*/, defaultLabel: a, editable: true },
                },
              }
            )
          )
          : []
        )
      ),
    };
    // create new Entity
    const newEntityDetailsReportUuid: string = uuidv4();
    const newEntityDefinition:EntityDefinition = {
      name: newEntityName,
      uuid: uuidv4(),
      parentName: "EntityDefinition",
      parentUuid: entityEntityDefinition.uuid,
      entityUuid: newEntity.uuid,
      conceptLevel: "Model",
      defaultInstanceDetailsReportUuid: newEntityDetailsReportUuid,
      jzodSchema: jzodSchema,
    }
    const createEntityAction: DomainAction = {
      actionType: "modelAction",
      actionName: "createEntity",
      deploymentUuid:currentDeploymentUuid,
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      entities: [
        {entity: newEntity, entityDefinition:newEntityDefinition},
      ],
    };
    await domainController.handleAction(createEntityAction, props.currentModel);
    // list of instances Report Definition
    const newEntityListReport: Report = {
      uuid: uuidv4(),
      parentName: "Report",
      parentUuid: "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
      conceptLevel: "Model",
      name: newEntityName + "List",
      defaultLabel: "List of " + newEntityName + "s",
      type: "list",
      definition: {
        fetchQuery: {
          select: {
            instanceList: {
              queryType: "selectObjectListByEntity",
              parentName: newEntityName,
              parentUuid: {
                referenceType: "constant",
                referenceUuid: newEntity.uuid,
              },
            },
          },
        },
        section: {
          type: "objectListReportSection",
          definition: {
            label: newEntityName + "s",
            // "parentName": "Fountain",
            parentUuid: newEntity.uuid,
            fetchedDataReference: "instanceList",
          },
        },
      },
    };
    // details of an Instance Report Definition
    const newEntityDetailsReport: Report = {
      uuid: newEntityDetailsReportUuid,
      parentName: "Report",
      parentUuid: "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
      conceptLevel: "Model",
      name: newEntityName + "Details",
      defaultLabel: "Details of " + newEntityName,
      definition: {
        fetchQuery: {
          select: {
            elementToDisplay: {
              queryType: "selectObjectByDirectReference",
              parentName: newEntityName,
              parentUuid: {
                referenceType: "constant",
                referenceUuid: newEntity.uuid,
              },
              instanceUuid: {
                referenceType: "queryParameterReference",
                referenceName: "instanceUuid",
              },
            },
          },
        },
        section: {
          type: "list",
          definition: [
            {
              "type":"objectInstanceReportSection",
              "definition": {
                "label": "My " + newEntityName,
                "parentUuid": newEntity.uuid,
                "fetchedDataReference": "elementToDisplay"
              }
            }
          ]
        },
      }
    };

    // add reports for new Entity: List of Instances and Details of an Instance
    const createReportAction: DomainAction = {
      actionType: "transactionalInstanceAction",
      instanceAction: {
        actionType: "instanceAction",
        actionName: "createInstance",
        applicationSection: "model",
        deploymentUuid: currentDeploymentUuid,
        endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
        objects: [{
          parentName: newEntityListReport.parentName,
          parentUuid: newEntityListReport.parentUuid,
          applicationSection:'model',
          instances: [
            newEntityListReport as EntityInstance,
            newEntityDetailsReport as EntityInstance,
          ]
        }],
      }
    };
    await domainController.handleAction(createReportAction, props.currentModel);

    await domainController.handleAction(
      {
        actionName: "commit",
        actionType: "modelAction",
        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        deploymentUuid: currentDeploymentUuid,
      },
      props.currentModel
    );

    //  add instances
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
            ["parentName", newEntity.name],
            ["parentUuid", newEntity.uuid],
          ]) as EntityInstance;
        }
      ) 
    ;
    log.info('createEntity adding instances',instances);
    
    const createRowsAction: InstanceAction = {
      actionType: 'instanceAction',
      actionName: "createInstance",
      applicationSection: "data",
      deploymentUuid: currentDeploymentUuid,
      endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
      objects:[
        {
          parentName:newEntity.name,
          parentUuid:newEntity.uuid,
          applicationSection:'data',
          instances:instances,
        }
      ]
    };
    await domainController.handleAction(createRowsAction);

    log.info('createEntity DONE adding instances');

    // modify menu
    const miroirMenuPageParams: DomainElementObject = {
      elementType: "object",
      elementValue: {
        deploymentUuid: { elementType: "string", elementValue: currentDeploymentUuid },
        applicationSection: { elementType: "string", elementValue: "model" },
      },
    };

    const miroirMenuInstancesQuery: DomainManyQueriesWithDeploymentUuid = {
      queryType: "DomainManyQueries",
      deploymentUuid: currentDeploymentUuid,
      pageParams: miroirMenuPageParams,
      queryParams: { elementType: "object", elementValue: {} },
      contextResults: { elementType: "object", elementValue: {} },
      fetchQuery: {
        select: {
          menus: {
            queryType: "selectObjectListByEntity",
            applicationSection: "model",
            parentName: "Menu",
            parentUuid: {
              referenceType: "constant",
              referenceUuid: entityMenu.uuid,
            },
          },
        }
      },
    };
    const miroirMenuInstances: ActionReturnType = 
      await domainController.handleQuery(
        {
          actionType: "queryAction",
          actionName: "runQuery",
          deploymentUuid:currentDeploymentUuid,
          endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
          query: miroirMenuInstancesQuery
        }
      )
    ;

    if (miroirMenuInstances.status != "ok") {
      throw new Error("createEntity found miroirMenuInstances with error " + miroirMenuInstances.error);
    }

    if (miroirMenuInstances.returnedDomainElement.elementType != "entityInstanceCollection") {
      throw new Error("createEntity found miroirMenuInstances not an instance collection " + miroirMenuInstances.returnedDomainElement);
    }
    log.info("createEntity found miroirMenuInstances", JSON.stringify(miroirMenuInstances));

    const oldMenu: Menu = miroirMenuInstances.returnedDomainElement.elementValue.instances[0] as any;
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
                "label": newEntityListReport.defaultLabel,
                "section": "data",
                "application": currentDeploymentUuid,
                "reportUuid": newEntityListReport.uuid,
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

    log.info("createEntity updated miroirMenu DONE", JSON.stringify(newMenu));
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
    const newEntityUuid = uuidv4();
    const currentApplicationUuid = props.currentApplicationUuid;
    const currentDeploymentUuid = props.currentDeploymentUuid;


    const splittedEntityDefinition = props.currentModel.entityDefinitions.find(e=>e.name == splittedEntityName)

    log.info("splitEntity started for", splittedEntityName, splittedEntityDefinition, "props", props)

    if (!splittedEntityDefinition?.entityUuid) {
      throw new Error("splitEntity found definition with undefined entityUuid " + JSON.stringify(splittedEntityDefinition));
    }

    const pageParams: DomainElementObject = {
      elementType: "object",
      elementValue: {
        deploymentUuid: { elementType: "string", elementValue: currentDeploymentUuid },
        applicationSection: { elementType: "string", elementValue: "data" },
      },
    };


    const newEntity: MetaEntity = {
      uuid: newEntityUuid,
      parentUuid: entityEntity.uuid,
      application: currentApplicationUuid,
      description: newEntityDescription,
      name: newEntityName,
    }


    // UPDATE MODEL ###############################################################################

    // log.info("createEntity fileData", fileData);
    const newEntityJzodSchema:JzodObject = {
      type: "object",
      definition: Object.assign(
        {},
        {
          uuid: {
            type: "simpleType",
            definition: "string",
            validations: [{ type: "uuid" }],
            extra: { id: 1, defaultLabel: "Uuid", editable: false },
          } as JzodAttribute,
          name: {
            type: "simpleType",
            definition: "string",
            extra: { id: 2, defaultLabel: "name", editable: false },
          } as JzodAttribute,
        },
        {}
      ),
    };

    // Entity creation
    const newEntityDetailsReportUuid: string = uuidv4();
    const newEntityDefinition: EntityDefinition = {
      name: newEntityName,
      uuid: uuidv4(),
      parentName: "EntityDefinition",
      parentUuid: entityEntityDefinition.uuid,
      entityUuid: newEntity.uuid,
      conceptLevel: "Model",
      defaultInstanceDetailsReportUuid: newEntityDetailsReportUuid,
      jzodSchema: newEntityJzodSchema,
    };
    const createEntityAction: DomainAction = {
      actionType: "modelAction",
      actionName: "createEntity",
      deploymentUuid:currentDeploymentUuid,
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      entities: [
        {entity: newEntity, entityDefinition:newEntityDefinition},
      ],
    };
    await domainController.handleAction(createEntityAction, props.currentModel);

    log.info("splitEntity added new Entity", newEntityName, createEntityAction)

    const updateSplittedEntityAction: DomainAction = {
      actionType:"modelAction",
      actionName: "alterEntityAttribute",
      deploymentUuid:currentDeploymentUuid,
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      entityName: splittedEntityName,
      entityUuid: splittedEntityDefinition.entityUuid,
      entityDefinitionUuid: splittedEntityDefinition.uuid,
      addColumns: [
        {
          "name": newEntityName,
          "definition": {
            type: "simpleType",
            "validations": [{ "type": "uuid" }],
            nullable: true, // TODO: make non-nullable and enforce FK after migration has been done!
            extra: { defaultLabel: "Municipality", targetEntity: newEntity.uuid},
            definition: "string"
          }
        }
      ],
    };

    await domainController.handleAction(
      updateSplittedEntityAction,
      props.currentModel
    );

    await domainController.handleAction(
      {
        actionName: "commit",
        actionType: "modelAction",
        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        deploymentUuid: currentDeploymentUuid,
      },
      props.currentModel
    );

    log.info("splitEntity added new FK attribute to", splittedEntityName, updateSplittedEntityAction)

    // ############################################################################################
    // Reports creation
    const newEntityListReport: Report = {
      uuid: uuidv4(),
      parentName: "Report",
      parentUuid: "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
      conceptLevel: "Model",
      name: newEntityName + "List",
      defaultLabel: "List of " + newEntityDescription,
      application: currentApplicationUuid,
      type: "list",
      definition: {
        fetchQuery: {
          select: {
            listReportSectionElements: {
              queryType: "selectObjectListByEntity",
              parentName: newEntityName,
              parentUuid: {
                referenceType: "constant",
                referenceUuid: newEntity.uuid,
              },
            },
          },
        },
        section: {
          type: "objectListReportSection",
          definition: {
            label: newEntityDescription,
            // "parentName": "Fountain",
            parentUuid: newEntity.uuid,
            fetchedDataReference: "listReportSectionElements",
          },
        },
      },
    };
    const newEntityDetailsReport: Report = {
      uuid: newEntityDetailsReportUuid,
      parentName: "Report",
      parentUuid: "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
      conceptLevel: "Model",
      name: newEntityName + "Details",
      defaultLabel: "Details of " + newEntityDescription,
      definition: {
        fetchQuery: {
          select: {
            elementToDisplay: {
              queryType: "selectObjectByDirectReference",
              parentName: newEntityName,
              parentUuid: {
                referenceType: "constant",
                referenceUuid: newEntity.uuid,
              },
              instanceUuid: {
                referenceType: "queryParameterReference",
                referenceName: "instanceUuid",
              },
            },
            fountainsOfMunicipality: {
              queryType: "selectObjectListByRelation",
              parentName: "Fountain",
              parentUuid: {
                referenceType: "constant",
                referenceUuid: splittedEntityDefinition.entityUuid,
              },
              objectReference: {
                referenceName: "elementToDisplay",
                referenceType: "queryContextReference",
              },
              AttributeOfListObjectToCompareToReferenceUuid: newEntityName,
            },
          },
        },
        section: {
          type: "list",
          definition: [
            {
              type: "objectInstanceReportSection",
              definition: {
                label: "My " + newEntityName,
                parentUuid: newEntity.uuid,
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
    };
    const createNewEntityListReportAction: DomainAction = {
      actionType: "transactionalInstanceAction",
      instanceAction: {
        actionType: "instanceAction",
        actionName: "createInstance",
        applicationSection: "model",
        deploymentUuid: currentDeploymentUuid,
        endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
        objects: [
          {
            parentName: newEntityListReport.parentName,
            parentUuid: newEntityListReport.parentUuid,
            applicationSection:'model',
            instances: [
              newEntityListReport as EntityInstance,
              newEntityDetailsReport as EntityInstance
            ]
          }
        ],
      }
    };
    await domainController.handleAction(createNewEntityListReportAction, props.currentModel);

    await domainController.handleAction(
      {
        actionName: "commit",
        actionType: "modelAction",
        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        deploymentUuid: currentDeploymentUuid,
      },
      props.currentModel
    );
    const objectAttributeNames = fileData[0];
    log.info('createEntity objectAttributeNames',objectAttributeNames);



    // ############################################################################################
    // insert / update instances
    const splittedEntityInstancesQuery: DomainManyQueriesWithDeploymentUuid = {
      queryType: "DomainManyQueries",
      deploymentUuid: currentDeploymentUuid,
      pageParams,
      queryParams: { elementType: "object", elementValue: {} },
      contextResults: { elementType: "object", elementValue: {} },
      fetchQuery: {
        select: {
          [splittedEntityName]: {
            queryType: "selectObjectListByEntity",
            applicationSection: "data",
            parentName: splittedEntityName,
            parentUuid: {
              referenceType: "constant",
              referenceUuid: splittedEntityDefinition?.entityUuid,
            },
          },
        }
      },
    };
    const splittedEntityInstances: ActionReturnType = 
      await domainController.handleQuery(
        {
          actionType: "queryAction",
          actionName: "runQuery",
          deploymentUuid:currentDeploymentUuid,
          endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
          query: splittedEntityInstancesQuery
        }
      )
    ;

    if (splittedEntityInstances.status != "ok") {
      throw new Error("splitEntity found splittedEntityInstances with error " + splittedEntityInstances.error);
    }

    if (splittedEntityInstances.returnedDomainElement.elementType != "entityInstanceCollection") {
      throw new Error("splitEntity found splittedEntityInstances not an instance collection " + splittedEntityInstances.returnedDomainElement);
    }
    log.info("splitEntity found splittedEntityInstances", JSON.stringify(splittedEntityInstances));

    let municipalities: Set<string> = new Set();
    for (const m of splittedEntityInstances.returnedDomainElement.elementValue.instances) {
      log.info("splitEntity found entity instance", m, (m as any)[splittedEntityAttribute]);

      municipalities.add((m as any)[splittedEntityAttribute])
    }
    
    log.info("splitEntity found municipalities", municipalities);

    const newInstancesArray = Array.from(municipalities.keys())
    const newInstancesUuidMap = Object.fromEntries(
      newInstancesArray.map(
        k => [k, uuidv4()]
      )
    )

    const newEntityInstances:EntityInstance[] = 
      newInstancesArray.map(
        (municipalityName:any) => {
          return {
            "uuid": newInstancesUuidMap[municipalityName],
            "parentName": newEntity.name,
            "parentUuid": newEntity.uuid,
            "name": municipalityName
          }
        }
      ) 
    ;
    log.info('adding instances',newEntityInstances);
    
    const createNewEntityInstancesAction: InstanceAction = {
      actionType: 'instanceAction',
      actionName: "createInstance",
      applicationSection: "data",
      deploymentUuid: currentDeploymentUuid,
      endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
      objects:[
        {
          parentName:newEntity.name,
          parentUuid:newEntity.uuid,
          applicationSection:'data',
          instances:newEntityInstances,
        }
      ]
    };
    await domainController.handleAction(createNewEntityInstancesAction);
    log.info("splitEntity newEntityInstances", createNewEntityInstancesAction);

    // update splitted entity instances with new reference
    const splitInstancesNewValues = splittedEntityInstances.returnedDomainElement.elementValue.instances.map(
      (e: any) => (
        {
          ...e,
          [newEntityName]: newInstancesUuidMap[e[splittedEntityAttribute]]
        }
      ) as any // EntityInstance. Only uuid is needed to identify entity instance
    );
    log.info("splitEntity splitInstancesNewValues", splitInstancesNewValues);

    const updateSplittedEntityInstancesAction: InstanceAction = {
      actionType: "instanceAction",
      actionName: "updateInstance",
      endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
      applicationSection: "data",
      deploymentUuid: currentDeploymentUuid,
      objects: [
        {
          parentName: splittedEntityName,
          parentUuid: splittedEntityDefinition.entityUuid,
          applicationSection:'data',
          instances: splitInstancesNewValues,
        }
      ],
    };

    await domainController.handleAction(updateSplittedEntityInstancesAction);
    log.info("splitEntity updateSplittedEntityInstancesAction", updateSplittedEntityInstancesAction);
    // modify split Entity List Report to display new Entity Attribute?


    // ############################################################################################
    // modify menu
    const miroirMenuPageParams: DomainElementObject = {
      elementType: "object",
      elementValue: {
        deploymentUuid: { elementType: "string", elementValue: currentDeploymentUuid },
        applicationSection: { elementType: "string", elementValue: "model" },
      },
    };
    
    const miroirMenuInstancesQuery: DomainManyQueriesWithDeploymentUuid = {
      queryType: "DomainManyQueries",
      deploymentUuid: currentDeploymentUuid,
      pageParams: miroirMenuPageParams,
      queryParams: { elementType: "object", elementValue: {} },
      contextResults: { elementType: "object", elementValue: {} },
      fetchQuery: {
        select: {
          menus: {
            queryType: "selectObjectListByEntity",
            applicationSection: "model",
            parentName: "Menu",
            parentUuid: {
              referenceType: "constant",
              referenceUuid: entityMenu.uuid,
            },
          },
        }
      },
    };
    const miroirMenuInstances: ActionReturnType = 
      await domainController.handleQuery(
        {
          actionType: "queryAction",
          actionName: "runQuery",
          deploymentUuid:currentDeploymentUuid,
          endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
          query: miroirMenuInstancesQuery
        }
      )
    ;
    
    if (miroirMenuInstances.status != "ok") {
      throw new Error("splitEntity found miroirMenuInstances with error " + miroirMenuInstances.error);
    }

    if (miroirMenuInstances.returnedDomainElement.elementType != "entityInstanceCollection") {
      throw new Error("splitEntity found miroirMenuInstances not an instance collection " + miroirMenuInstances.returnedDomainElement);
    }
    log.info("splitEntity found miroirMenuInstances", JSON.stringify(miroirMenuInstances));
    
    const oldMenu: Menu = miroirMenuInstances.returnedDomainElement.elementValue.instances[0] as any;
    const newMenu:Menu = {
      ...oldMenu,
      definition: {
        menuType: 'complexMenu',
        definition: [
          oldMenu.definition.definition[0],
          {
            ...oldMenu.definition.definition[1],
            items: [
              ...(oldMenu.definition.definition[1] as any).items,
              {
                "label": newEntityListReport.defaultLabel,
                "section": "data",
                "application": currentDeploymentUuid,
                "reportUuid": newEntityListReport.uuid,
                "icon": "location_on"
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
              // Object.assign({}, reportReportList, {
              //   name: "Report2List",
              //   defaultLabel: "Modified List of Reports",
              // }) as EntityInstance,
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
      <h3>
        create Entity from Excel File:
        <Button variant="outlined" onClick={()=>createEntity()}>
          <AddBoxIcon/>
        </Button>
      </h3>
      <h3>
        split entity Fountain:
        <Button variant="outlined" onClick={()=>splitEntity()}>
          <AddBoxIcon/>
        </Button>
      </h3>
    </>
  );
}