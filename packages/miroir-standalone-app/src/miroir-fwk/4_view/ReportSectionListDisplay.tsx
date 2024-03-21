import { ColDef } from "ag-grid-community";
import equal from "fast-deep-equal";
import { useCallback, useMemo } from "react";
import { SubmitHandler } from 'react-hook-form';
import { v4 as uuidv4 } from 'uuid';
import { z } from "zod";


import { JzodObject } from "@miroir-framework/jzod-ts";

import {
  ApplicationDeploymentConfiguration,
  ApplicationDeploymentSchema,
  DomainControllerInterface,
  Entity,
  EntityDefinition,
  EntityInstancesUuidIndex,
  InstanceAction,
  LoggerInterface,
  MetaEntity,
  MetaModel,
  MiroirLoggerFactory,
  applicationDeploymentLibrary,
  applicationDeploymentMiroir,
  applicationSection,
  domainElementObject,
  entity,
  entityDefinition,
  getLoggerName,
  jzodObject,
  objectListReportSection,
  reportEntityDefinitionList,
  reportEntityList
} from "miroir-core";

import { getColumnDefinitionsFromEntityDefinitionJzodObjectSchema } from "../../miroir-fwk/4_view/getColumnDefinitionsFromEntityAttributes";
import { JsonObjectFormEditorDialog, JsonObjectFormEditorDialogInputs } from "./JsonObjectFormEditorDialog";
import { MTableComponent } from "./MTableComponent";
import { TableComponentType, TableComponentTypeSchema } from "./MTableComponentInterface";
import { useDomainControllerService, useMiroirContextInnerFormOutput } from './MiroirContextReactProvider';
import { packageName } from "../../constants";
import { cleanLevel } from "./constants";
import { useCurrentModel } from "./ReduxHooks";


const loggerName: string = getLoggerName(packageName, cleanLevel,"ReportSectionListDisplay");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});


// ################################################################################################
export const ReportSectionDisplayCorePropsSchema = z.object({
  styles: z.any().optional(),
  label: z.string(),
  defaultlabel: z.string().optional(),
  displayedDeploymentDefinition: ApplicationDeploymentSchema.optional(),
  section: objectListReportSection, // ugly, this is due to the need of calling hooks in the same order, irrelevant of tableComponentReportType. Should be in ReportSectionDisplayEntityInstancePropsSchema.
  domainElementObject: domainElementObject, // ugly, this is due to the need of calling hooks in the same order, irrelevant of tableComponentReportType. Should be in ReportSectionDisplayEntityInstancePropsSchema.
  fetchedDataJzodSchema: z.record(jzodObject.optional()).optional(), // ugly, this is due to the need of calling hooks in the same order, irrelevant of tableComponentReportType. Should be in ReportSectionDisplayEntityInstancePropsSchema.
  chosenApplicationSection: applicationSection.optional(), // ugly, this is due to the need of calling hooks in the same order, irrelevant of tableComponentReportType. Should be in ReportSectionDisplayEntityInstancePropsSchema.
});

export const ReportSectionDisplayEntityInstancePropsSchema = ReportSectionDisplayCorePropsSchema.extend({
  tableComponentReportType: z.literal(TableComponentTypeSchema.enum.EntityInstance),
  chosenApplicationSection: applicationSection,
  deploymentUuid: z.string().uuid()
  // currentModel: z.any(),
  // currentMiroirEntity: MetaEntitySchema.optional(),
  // currentReportTargerEntity: entity.optional(),
  // currentReportTargetEntityDefinition: entityDefinition.optional(),
});

export const ReportSectionDisplayJsonArrayPropsSchema = ReportSectionDisplayCorePropsSchema.extend({
  tableComponentReportType: z.literal(TableComponentTypeSchema.enum.JSON_ARRAY),
  columnDefs: z.array(z.any()),
  rowData: z.array(z.any()),
});

// ##########################################################################################
export const ReportSectionDisplayPropsSchema = ReportSectionDisplayEntityInstancePropsSchema;
export type ReportComponentProps = z.infer<typeof ReportSectionDisplayPropsSchema>;

// ##########################################################################################
export function defaultFormValues(
  tableComponentType: TableComponentType,
  currentEntityJzodSchema: JzodObject,
  idList?:{id:number}[],
  currentMiroirEntity?: Entity,
  displayedDeploymentDefinition?: ApplicationDeploymentConfiguration,
):any {
  log.info(
    "defaultFormValues called TableComponentType",
    tableComponentType,
    "currentMiroirEntity",
    currentMiroirEntity,
    "currentEntityJzodSchema",
    currentEntityJzodSchema
  );
  
  if (tableComponentType == "EntityInstance") {
    const attributeDefaultValue:any = {
      'uuid': uuidv4(),
      // 'id': 1,
      'parentName':currentMiroirEntity?.name,
      'parentUuid':currentMiroirEntity?.uuid,
      'conceptLevel':'Model',
      'application': displayedDeploymentDefinition?.application,
      'attributes': [],
    }
    log.info();
    
    const currentEditorAttributes = Object.entries(currentEntityJzodSchema?.definition??{}).reduce((acc,a)=>{
      let result
      if (Object.keys(attributeDefaultValue).includes(a[0])) {
        result = Object.assign({},acc,{[a[0]]:attributeDefaultValue[a[0]]})
      } else {
        result = Object.assign({},acc,{[a[0]]:''})
      }
      // log.info('ReportComponent defaultFormValues',tableComponentType,'EntityInstance setting default value for attribute',a.name,':',result);
      return result;
    },{});
    log.info('defaultFormValues return',currentEditorAttributes);
    return currentEditorAttributes;
  }
  if (tableComponentType == "JSON_ARRAY") {
    const newId = idList? idList?.reduce((acc:number,curr:{id:number}) => Math.max(curr?.id,acc),0) + 1 : 1;
    const attributeDefaultValue:any = {
      'uuid': uuidv4(),
      'id': newId,
      'conceptLevel':'Model',
      // 'attributes': [],
    }
    // TODO: CORRECT THIS IT DOES NOT WORK!!!
    const currentEditorAttributes = Object.entries(currentEntityJzodSchema).reduce((acc,currentAttribute)=>{
      const attributeName = (currentAttribute[1] as any).name
      let result
      if (Object.keys(attributeDefaultValue).includes((currentAttribute[1] as any).name)) {
        result = Object.assign({},acc,{[attributeName]:attributeDefaultValue[attributeName]})
      } else {
        result = Object.assign({},acc,{[attributeName]:''})
      }
      log.info('ReportComponent defaultFormValues',tableComponentType,'setting default value for attribute',attributeName,':',result);
      return result;
    },{});
    log.info('defaultFormValues return',currentEditorAttributes);
    return currentEditorAttributes;
  }
}

// ##########################################################################################
let count = 0
let prevProps = {};
let prevColumnDefs:{columnDefs: ColDef<any>[]} = {columnDefs:[]};
let prevJzodSchema;
let prevInstancesToDisplay:EntityInstancesUuidIndex | undefined;
let prevInstancesWithStringifiedJsonAttributes: { instancesWithStringifiedJsonAttributes: any[] };



// ##########################################################################################
// ##########################################################################################
// ##########################################################################################
// ##########################################################################################
export const ReportSectionListDisplay: React.FC<ReportComponentProps> = (
  props: ReportComponentProps
) => {
  count++;
  log.info('ReportSectionListDisplay',count,props === prevProps, equal(props,prevProps));
  prevProps = props;
  
  // log.info('ReportSectionListDisplay props.domainElement',props.domainElement);
  log.info('ReportSectionListDisplay props',props);

  // ##############################################################################################
  const deployments = [applicationDeploymentMiroir, applicationDeploymentLibrary] as ApplicationDeploymentConfiguration[];

  const miroirMetaModel: MetaModel = useCurrentModel(applicationDeploymentMiroir.uuid);
  const libraryAppModel: MetaModel = useCurrentModel(applicationDeploymentLibrary.uuid);
  
  const currentModel = props.deploymentUuid == applicationDeploymentLibrary.uuid? libraryAppModel:miroirMetaModel;

  const displayedDeploymentDefinition: ApplicationDeploymentConfiguration | undefined = deployments.find(
    (d) => d.uuid == props.deploymentUuid
  );
  log.info("ReportSectionView displayedDeploymentDefinition", displayedDeploymentDefinition);

  const domainController: DomainControllerInterface = useDomainControllerService();
  const [dialogOuterFormObject, setdialogOuterFormObject] = useMiroirContextInnerFormOutput();
  const mapping = useMemo(() => ({ // displayedDeploymentDefinition, displayedApplicationSection
    [applicationDeploymentMiroir.uuid]: {
      "model": {
        availableReports: miroirMetaModel.reports.filter(
          (r) => [reportEntityList.uuid, reportEntityDefinitionList.uuid].includes(r.uuid)
          ),
          entities: miroirMetaModel.entities,
          entityDefinitions: miroirMetaModel.entityDefinitions,
        },
      "data": {
        availableReports: miroirMetaModel.reports.filter(
          (r) => ![reportEntityList.uuid, reportEntityDefinitionList.uuid].includes(r.uuid)
        ),
        entities: miroirMetaModel.entities,
        entityDefinitions: miroirMetaModel.entityDefinitions,
      },
    },
    [applicationDeploymentLibrary.uuid]: {
      "model": {
        availableReports: miroirMetaModel.reports,
        entities: miroirMetaModel.entities,
        entityDefinitions: miroirMetaModel.entityDefinitions,
      },
      "data": {
        availableReports: libraryAppModel.reports,
        entities: libraryAppModel.entities,
        entityDefinitions: libraryAppModel.entityDefinitions,
      },
    },
  }), [miroirMetaModel, libraryAppModel]);

  const { availableReports, entities, entityDefinitions } =
    displayedDeploymentDefinition && props.chosenApplicationSection
      ? mapping[displayedDeploymentDefinition?.uuid][props.chosenApplicationSection]
      : { availableReports: [], entities: [], entityDefinitions: [] as EntityDefinition[] };

  log.info("ReportSectionView availableReports",availableReports);

  const currentReportTargetEntity: Entity | undefined =
    props.section?.type === "objectListReportSection" 
      ? entities?.find(
          (e) =>
            e?.uuid === (props.section?.definition as any)["parentUuid"]
        )
      : undefined;
  const currentReportTargetEntityDefinition: EntityDefinition | undefined =
    entityDefinitions?.find((e) => e?.entityUuid === currentReportTargetEntity?.uuid);

  const instancesToDisplayJzodSchema: JzodObject | undefined = useMemo(()=>
    props.fetchedDataJzodSchema &&
    props.section.type == "objectListReportSection" &&
    props.section.definition.fetchedDataReference &&
    props.fetchedDataJzodSchema[props.section.definition.fetchedDataReference]
      ? props.fetchedDataJzodSchema[props.section.definition.fetchedDataReference]
      : currentReportTargetEntityDefinition?.jzodSchema
    ,[props, props.fetchedDataJzodSchema, props.section.definition.fetchedDataReference]
  )

  const instancesToDisplayViewAttributes: string[] | undefined = useMemo(()=>
    currentReportTargetEntityDefinition?.viewAttributes
    ,[props, props.fetchedDataJzodSchema, props.section.definition.fetchedDataReference]
  )

  const columnDefs: { columnDefs: ColDef<any>[] } = useMemo(
    () => ({
      columnDefs: getColumnDefinitionsFromEntityDefinitionJzodObjectSchema(
        instancesToDisplayJzodSchema??{type:"object", definition:{}},
        instancesToDisplayViewAttributes
      ),
    }),
    [instancesToDisplayJzodSchema]
  );
  log.info(
    "ReportSectionListDisplay",
    count,
    "instancesToDisplayViewAttributes",
    instancesToDisplayViewAttributes,
    "props.fetchedDataJzodSchema",
    props.fetchedDataJzodSchema,
    "props.section.definition.fetchedDataReference",
    props.section.definition.fetchedDataReference,
    "props.currentMiroirEntityDefinition?.jzodSchema",
    currentReportTargetEntityDefinition?.jzodSchema,
    "instancesToDisplayJzodSchema",
    instancesToDisplayJzodSchema,
    "columnDefs",
    columnDefs,
    prevColumnDefs === columnDefs,
    equal(prevColumnDefs, columnDefs)
  );

  // ##############################################################################################
  const onSubmitInnerFormDialog: SubmitHandler<JsonObjectFormEditorDialogInputs> = useCallback(
    async (data,event) => {
      const buttonType:string=(event?.nativeEvent as any)['submitter']['name'];
      log.info('ReportComponent onSubmitFormDialog',buttonType,'received data',data,'props',props,'dialogFormObject',dialogOuterFormObject);
      // if (props.tableComponentReportType == 'JSON_ARRAY') {
      //   if (buttonType == 'InnerDialog') {
      //     const previousValue = dialogOuterFormObject && dialogOuterFormObject['attributes']?dialogOuterFormObject['attributes']:props.rowData;
      //     const newAttributesValue = previousValue.slice();
      //     newAttributesValue.push(data as EntityAttribute);
      //     const newObject = Object.assign({},dialogOuterFormObject?dialogOuterFormObject:{},{attributes:newAttributesValue});
      //     setdialogOuterFormObject(newObject); // TODO use Zod parse!
      //     log.info('ReportComponent onSubmitFormDialog dialogFormObject',dialogOuterFormObject,'newObject',newObject);
      //   } else {
      //     log.info('ReportComponent onSubmitFormDialog ignored event',buttonType);
      //   }
      // } else {
      //   log.warn('ReportComponent onSubmitFormDialog called with inapropriate report type:',props.tableComponentReportType)
      // }
    },[dialogOuterFormObject]
  ) 

  const onCreateFormObject = useCallback(
    async (data:any) => {
      log.info('ReportComponent onEditFormObject called with new object value',data);
      
      if (props.displayedDeploymentDefinition && props.displayedDeploymentDefinition.uuid) {
        if (props.chosenApplicationSection == 'model') {
          await domainController.handleAction(
            {
              actionType: "transactionalInstanceAction",
              instanceAction: {
                actionType: "instanceAction",
                actionName: "createInstance",
                applicationSection: "model",
                deploymentUuid: props.displayedDeploymentDefinition.uuid,
                endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
                objects: [
                  {
                    parentName: data.name,
                    parentUuid: data.parentUuid,
                    applicationSection:'model',
                    instances: [
                      // newEntity 
                      data
                    ]
                  }
                ],
              }
            },props.tableComponentReportType == "EntityInstance"?currentModel:undefined
          );
        } else {
          const createAction: InstanceAction = {
            actionType: "instanceAction",
            actionName: "createInstance",
            applicationSection: props.chosenApplicationSection?props.chosenApplicationSection:"data",
            deploymentUuid: props.displayedDeploymentDefinition?.uuid,
            endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
            objects: [
              {
                parentName: data.name,
                parentUuid: data.parentUuid,
                applicationSection:props.chosenApplicationSection?props.chosenApplicationSection:"data",
                instances: [
                  data 
                ],
              },
            ],
          };
          await domainController.handleAction(createAction);
        }
      } else {
        throw new Error('ReportComponent onSubmitOuterDialog props.displayedDeploymentDefinition is undefined.')
      }
    },
    []
  )

  const onEditFormObject = useCallback(
    async (data:any) => {
      // const newEntity:EntityInstance = Object.assign({...data as EntityInstance},{attributes:dialogFormObject?dialogFormObject['attributes']:[]});
      log.info('ReportComponent onEditFormObject called with new object value',data);
      
      if (props.displayedDeploymentDefinition) {
        if (props.chosenApplicationSection == 'model') {
          await domainController.handleAction(
            {
              actionType: "transactionalInstanceAction",
              instanceAction: {
                actionType: "instanceAction",
                actionName: "updateInstance",
                applicationSection: "model",
                deploymentUuid: props.displayedDeploymentDefinition.uuid,
                endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
                objects: [
                  {
                    parentName: data.name,
                    parentUuid: data.parentUuid,
                    applicationSection:props.chosenApplicationSection,
                    instances: [
                      data 
                    ]
                  }
                ],
              }
            },props.tableComponentReportType == "EntityInstance"?currentModel:undefined
          );
        } else {
          const updateAction: InstanceAction = {
            actionType: "instanceAction",
            actionName: "updateInstance",
            applicationSection: props.chosenApplicationSection?props.chosenApplicationSection:"data",
            deploymentUuid: props.displayedDeploymentDefinition?.uuid,
            endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
            objects: [
              {
                parentName: data.name,
                parentUuid: data.parentUuid,
                applicationSection:props.chosenApplicationSection?props.chosenApplicationSection:"data",
                instances: [
                  data 
                ],
              },
            ],
          };
          await domainController.handleAction(updateAction);
        }
      } else {
        throw new Error('ReportComponent onSubmitOuterDialog props.displayedDeploymentDefinition is undefined.')
      }
    },
    [domainController, props.displayedDeploymentDefinition, props.chosenApplicationSection]
  )

  const onSubmitOuterDialog: SubmitHandler<JsonObjectFormEditorDialogInputs> = useCallback(
    async (data,event) => {
      const buttonType:string=(event?.nativeEvent as any)['submitter']['name'];
      log.info('ReportComponent onSubmitOuterDialog','buttonType',buttonType,'data',data,'dialogFormObject',dialogOuterFormObject,buttonType,);
      if (buttonType == 'OuterDialog') {
        await onCreateFormObject(data);
      } else {
        log.info('ReportComponent onSubmitOuterDialog ignoring event for',buttonType);
        
      }
    },
    []
  )

  // ##############################################################################################
  prevColumnDefs = columnDefs;
  prevJzodSchema = currentReportTargetEntityDefinition?.jzodSchema;


  const instancesToDisplay: EntityInstancesUuidIndex = useMemo(() =>
    props.domainElementObject &&
    props.domainElementObject.elementType == "object" &&
    props.section.definition.fetchedDataReference &&
    props.domainElementObject.elementValue[props.section.definition.fetchedDataReference] &&
    props.domainElementObject.elementValue[props.section.definition.fetchedDataReference].elementType == "instanceUuidIndex" &&
    props.domainElementObject.elementValue[props.section.definition.fetchedDataReference].elementValue
      ? props.domainElementObject.elementValue[props.section.definition.fetchedDataReference].elementValue as EntityInstancesUuidIndex
      : {}
    ,[props]
  );

  // const currentReportTargetEntity: Entity | undefined =
  // props.section?.type === "objectListReportSection" 
  //   ? entities?.find(
  //       (e) =>
  //         e?.uuid === (props.reportSection?.definition as any)["parentUuid"]
  //     )
  //   : undefined;
  // const currentReportTargetEntityDefinition: EntityDefinition | undefined =
  // entityDefinitions?.find((e) => e?.entityUuid === currentReportTargetEntity?.uuid);

  log.info("ReportSectionListDisplay instancesToDisplay",instancesToDisplay);
  log.info("ReportSectionListDisplay props.currentMiroirEntity",currentReportTargetEntity);
  log.info("ReportSectionListDisplay columnDefs",columnDefs);
  
  return (
    <div className="MiroirReport-global" style={{ display: "block" }}>
      <div> rendered ReportSectionListDisplay: {count} times.</div>
      {/* labelll:{props.select?.label?<span>{props.select?.label}</span>:<></>} */}
      {currentReportTargetEntity ? (
        !!columnDefs ? (
          // columnDefs?.length > 0
          // <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div>
            <div>{/* colonnes: {JSON.stringify(columnDefs)} */}</div>
            <JsonObjectFormEditorDialog
              showButton={true}
              isAttributes={true}
              label={props.defaultlabel ?? currentReportTargetEntityDefinition?.name}
              entityDefinitionJzodSchema={currentReportTargetEntityDefinition?.jzodSchema as JzodObject}
              currentDeploymentUuid={props.displayedDeploymentDefinition?.uuid}
              currentApplicationSection={props.chosenApplicationSection}
              initialValuesObject={defaultFormValues(
                props.tableComponentReportType,
                currentReportTargetEntityDefinition?.jzodSchema as JzodObject,
                [],
                currentReportTargetEntity,
                props.displayedDeploymentDefinition
              )}
              onSubmit={onSubmitOuterDialog}
            />
            {props.displayedDeploymentDefinition ? (
              <div>
                {/* <div>instancesToDisplay: {JSON.stringify(instancesToDisplay)}</div> */}
                <MTableComponent
                  type={props.tableComponentReportType}
                  displayedDeploymentDefinition={props.displayedDeploymentDefinition}
                  styles={props.styles}
                  currentEntity={currentReportTargetEntity}
                  currentEntityDefinition={currentReportTargetEntityDefinition}
                  // reportSectionListDefinition={props.currentMiroirReportSectionObjectList}
                  columnDefs={columnDefs}
                  instancesToDisplay={instancesToDisplay}
                  // instancesToDisplay={instancesToDisplay}
                  displayTools={true}
                  onRowEdit={onEditFormObject}
                ></MTableComponent>
              </div>
            ) : (
              <div></div>
            )}
          </div>
        ) : (
          <span>No elements in the report</span>
        )
      ) : (
        <span style={{color: "red"}}>no report to display</span>
      )}
    </div>
  );
  // } else { // props.tableComponentReportType == "JSON_ARRAY"
  //   // const existingRows = dialogOuterFormObject && dialogOuterFormObject['attributes']?dialogOuterFormObject['attributes']:props.rowData
  //   // log.info('ReportComponent display report for',props.label,props.tableComponentReportType,'dialogFormObject',dialogOuterFormObject);
    
  //   return (
  //     <div>
  //       {/* <span>rendered ReportSectionListDisplay: {count} times.</span> */}
  //       {/* <JsonObjectFormEditorDialog
  //         showButton={true}
  //         jzodSchema={entityDefinitionEntityDefinition.jzodSchema as JzodObject}
  //         initialValuesObject={defaultFormValues(props.tableComponentReportType, entityDefinitionEntityDefinition.jzodSchema as JzodObject, [], existingRows)}
  //         label='InnerDialog'
  //         onSubmit={onSubmitInnerFormDialog}
  //       />
  //       <MTableComponent
  //         type="JSON_ARRAY"
  //         styles={props.styles}
  //         columnDefs={props.columnDefs}
  //         rowData={existingRows}
  //         displayTools={true}
  //       >
  //       </MTableComponent> */}
  //     </div>
  //   );
  // }
}