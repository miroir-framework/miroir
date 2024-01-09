import { ColDef } from "ag-grid-community";
import equal from "fast-deep-equal";
import { useCallback, useMemo } from "react";
import { SubmitHandler } from 'react-hook-form';
import { v4 as uuidv4 } from 'uuid';
import { z } from "zod";


import { JzodObject } from "@miroir-framework/jzod-ts";

import {
  ApplicationDeploymentConfiguration,
  DomainControllerInterface,
  DomainDataAction,
  EntityInstancesUuidIndex,
  LoggerInterface,
  MetaEntity,
  MiroirLoggerFactory,
  getLoggerName
} from "miroir-core";

import { getColumnDefinitionsFromEntityDefinitionJzodObjectSchema } from "../../miroir-fwk/4_view/getColumnDefinitionsFromEntityAttributes";
import { ReportSectionDisplayEntityInstancePropsSchema } from "../ReportSectionListInterface";
import { JsonObjectFormEditorDialog, JsonObjectFormEditorDialogInputs } from "./JsonObjectFormEditorDialog";
import { MTableComponent } from "./MTableComponent";
import { TableComponentType } from "./MTableComponentInterface";
import { useDomainControllerService, useMiroirContextInnerFormOutput } from './MiroirContextReactProvider';
import { packageName } from "../../constants";
import { cleanLevel } from "./constants";


const loggerName: string = getLoggerName(packageName, cleanLevel,"ReportSectionListDisplay");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

// ##########################################################################################
export const ReportSectionDisplayPropsSchema = ReportSectionDisplayEntityInstancePropsSchema;
export type ReportComponentProps = z.infer<typeof ReportSectionDisplayPropsSchema>;

// ##########################################################################################
export function defaultFormValues(
  tableComponentType: TableComponentType,
  currentEntityJzodSchema: JzodObject,
  idList?:{id:number}[],
  currentMiroirEntity?: MetaEntity,
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

  const domainController: DomainControllerInterface = useDomainControllerService();
  const [dialogOuterFormObject, setdialogOuterFormObject] = useMiroirContextInnerFormOutput();

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
      
      if (props.displayedDeploymentDefinition) {
        if (props.chosenApplicationSection == 'model') {
          await domainController.handleDomainAction(
            props.displayedDeploymentDefinition?.uuid,
            {
              actionType: "DomainTransactionalAction",
              actionName: "UpdateMetaModelInstance",
              update: {
                updateActionType: "ModelCUDInstanceUpdate",
                updateActionName: "create",
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
            },props.tableComponentReportType == "EntityInstance"?props.currentModel:{}
          );
        } else {
          const createAction: DomainDataAction = {
            actionName: "create",
            actionType:"DomainDataAction",
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
          await domainController.handleDomainAction(props.displayedDeploymentDefinition?.uuid, createAction);
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
          await domainController.handleDomainAction(
            props.displayedDeploymentDefinition?.uuid,
            {
              actionType: "DomainTransactionalAction",
              actionName: "UpdateMetaModelInstance",
              update: {
                updateActionType: "ModelCUDInstanceUpdate",
                updateActionName: "update",
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
            },props.tableComponentReportType == "EntityInstance"?props.currentModel:{}
          );
        } else {
          const updateAction: DomainDataAction = {
            actionName: "update",
            actionType:"DomainDataAction",
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
          await domainController.handleDomainAction(props.displayedDeploymentDefinition?.uuid, updateAction);
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

  const instancesToDisplayJzodSchema: JzodObject | undefined = useMemo(()=>
    props.fetchedDataJzodSchema &&
    // props.select?.fetchedDataReference &&
    props.section.type == "objectListReportSection" &&
    props.section.definition.fetchedDataReference &&
    props.fetchedDataJzodSchema[props.section.definition.fetchedDataReference]
      ? props.fetchedDataJzodSchema[props.section.definition.fetchedDataReference]
      : props?.currentMiroirEntityDefinition?.jzodSchema
    ,[props, props.fetchedDataJzodSchema, props.section.definition.fetchedDataReference]
  )
  const columnDefs: { columnDefs: ColDef<any>[] } = useMemo(
    () => ({
      columnDefs: getColumnDefinitionsFromEntityDefinitionJzodObjectSchema(
        instancesToDisplayJzodSchema??{type:"object", definition:{}}
      ),
    }),
    [instancesToDisplayJzodSchema]
  );
  log.info(
    "ReportSectionListDisplay",
    count,
    "props.fetchedDataJzodSchema",
    props.fetchedDataJzodSchema,
    "props.section.definition.fetchedDataReference",
    props.section.definition.fetchedDataReference,
    "props.currentMiroirEntityDefinition?.jzodSchema",
    props.currentMiroirEntityDefinition?.jzodSchema,
    "instancesToDisplayJzodSchema",
    instancesToDisplayJzodSchema,
    "columnDefs",
    columnDefs,
    prevColumnDefs === columnDefs,
    equal(prevColumnDefs, columnDefs)
  );
  prevColumnDefs = columnDefs;
  prevJzodSchema = props.currentMiroirEntityDefinition?.jzodSchema;


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

  log.info("ReportSectionListDisplay instancesToDisplay",instancesToDisplay);
  log.info("ReportSectionListDisplay props.currentMiroirEntity",props?.currentMiroirEntity);
  log.info("ReportSectionListDisplay columnDefs",columnDefs);
  
  return (
    <div className="MiroirReport-global" style={{ display: "flex" }}>
      <span>rendered ReportSectionListDisplay: {count} times.</span>
      {/* labelll:{props.select?.label?<span>{props.select?.label}</span>:<></>} */}
      {props?.currentMiroirEntity ? (
        !!columnDefs ? (
          // columnDefs?.length > 0
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div>{/* colonnes: {JSON.stringify(columnDefs)} */}</div>
            <JsonObjectFormEditorDialog
              showButton={true}
              isAttributes={true}
              label={props.defaultlabel ?? props.currentMiroirEntityDefinition?.name}
              entityDefinitionJzodSchema={props.currentMiroirEntityDefinition?.jzodSchema as JzodObject}
              currentDeploymentUuid={props.displayedDeploymentDefinition?.uuid}
              currentApplicationSection={props.chosenApplicationSection}
              initialValuesObject={defaultFormValues(
                props.tableComponentReportType,
                props.currentMiroirEntityDefinition?.jzodSchema as JzodObject,
                [],
                props.currentMiroirEntity,
                props.displayedDeploymentDefinition
              )}
              onSubmit={onSubmitOuterDialog}
            />
            {props.displayedDeploymentDefinition ? (
              <div>
                {/* <span>{JSON.stringify(props.select)}</span> */}
                <MTableComponent
                  type={props.tableComponentReportType}
                  displayedDeploymentDefinition={props.displayedDeploymentDefinition}
                  styles={props.styles}
                  currentEntity={props.currentMiroirEntity}
                  currentEntityDefinition={props.currentMiroirEntityDefinition}
                  // reportSectionListDefinition={props.currentMiroirReportSectionObjectList}
                  columnDefs={columnDefs}
                  instancesToDisplay={instancesToDisplay??{}}
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
        <span>no report to display</span>
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