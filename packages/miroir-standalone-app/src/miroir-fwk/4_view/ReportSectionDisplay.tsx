import { ColDef } from "ag-grid-community";
import { SubmitHandler } from 'react-hook-form';
import { v4 as uuidv4 } from 'uuid';
import { z } from "zod";


import {
  ApplicationDeployment,
  ApplicationDeploymentSchema,
  ApplicationSectionSchema,
  DomainControllerInterface,
  DomainDataAction,
  EntityAttribute,
  EntityDefinitionSchema,
  MetaEntity,
  MetaEntitySchema,
  ReportSectionListDefinitionSchema,
  UuidSchema,
  entityDefinitionEntityDefinition
} from "miroir-core";

import { JzodObject } from "@miroir-framework/jzod";
import { getColumnDefinitionsFromEntityDefinitionJzodSchema } from "miroir-fwk/4_view/getColumnDefinitionsFromEntityAttributes";
import { JsonObjectFormEditorDialog, JsonObjectFormEditorDialogInputs } from "./JsonObjectFormEditorDialog";
import { MTableComponent, TableComponentType, TableComponentTypeSchema } from "./MTableComponent";
import { useDomainControllerService, useMiroirContextInnerFormOutput } from './MiroirContextReactProvider';
import { useCallback } from "react";
import { useLocalCacheEntityInstancesForListReportSection } from "./ReduxHooks";

export const ReportSectionDisplayCorePropsSchema = z.object({
  styles:z.any().optional(),
  displayedDeploymentDefinition: ApplicationDeploymentSchema.optional(),
  chosenApplicationSection: ApplicationSectionSchema.optional(),// ugly, this is due to the need of calling hooks (eg useLocalCacheInstancesForEntity) in the same order, irrelevant of tableComponentReportType
  label:z.string(),
});

export const ReportSectionDisplayEntityInstancePropsSchema = ReportSectionDisplayCorePropsSchema.extend({
  tableComponentReportType: z.literal(TableComponentTypeSchema.enum.EntityInstance),
  chosenApplicationSection: ApplicationSectionSchema,
  currentModel:z.any(),
  // currentMiroirReport: ReportSchema,
  currentReportUuid: UuidSchema,
  currentMiroirReportSectionListDefinition: ReportSectionListDefinitionSchema,
  currentMiroirEntity: MetaEntitySchema,
  currentMiroirEntityDefinition: EntityDefinitionSchema,
});

export const ReportSectionDisplayJsonArrayPropsSchema = ReportSectionDisplayCorePropsSchema.extend({
  tableComponentReportType: z.literal(TableComponentTypeSchema.enum.JSON_ARRAY),
  columnDefs: z.array(z.any()),
  rowData: z.array(z.any()),
  // object: z.any(),
});

// ##########################################################################################
export const ReportSectionDisplayPropsSchema = z.union([
  ReportSectionDisplayEntityInstancePropsSchema,
  ReportSectionDisplayJsonArrayPropsSchema,
]);
export type ReportComponentProps = z.infer<typeof ReportSectionDisplayPropsSchema>;

// ##########################################################################################
export function defaultFormValues(
  tableComponentType: TableComponentType,
  currentEntityJzodSchema: JzodObject,
  // currentEntityAttributes:EntityAttribute[],
  idList?:{id:number}[],
  currentMiroirEntity?: MetaEntity,
  displayedDeploymentDefinition?: ApplicationDeployment,
):any {
  console.log('defaultFormValues called TableComponentType',tableComponentType, 'currentMiroirEntity',currentMiroirEntity,'currentEntityJzodSchema',currentEntityJzodSchema);
  
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
    console.log();
    
    const currentEditorAttributes = Object.entries(currentEntityJzodSchema).reduce((acc,a)=>{
      let result
      if (Object.keys(attributeDefaultValue).includes(a[1].name)) {
        result = Object.assign({},acc,{[a[1].name]:attributeDefaultValue[a[1].name]})
      } else {
        result = Object.assign({},acc,{[a[1].name]:''})
      }
      // console.log('ReportComponent defaultFormValues',tableComponentType,'EntityInstance setting default value for attribute',a.name,':',result);
      return result;
    },{});
    // console.log('defaultFormValues return',currentEditorAttributes);
    return currentEditorAttributes;
  }
  if (tableComponentType == "JSON_ARRAY") {
    const newId = idList? idList?.reduce((acc:number,curr:{id:number}) => Math.max(curr.id,acc),0) + 1 : 1;
    const attributeDefaultValue:any = {
      'uuid': uuidv4(),
      'id': newId,
      'conceptLevel':'Model',
      // 'attributes': [],
    }
    const currentEditorAttributes = Object.entries(currentEntityJzodSchema).reduce((acc,a)=>{
      let result
      if (Object.keys(attributeDefaultValue).includes(a[1].name)) {
        result = Object.assign({},acc,{[a[1].name]:attributeDefaultValue[a[1].name]})
      } else {
        result = Object.assign({},acc,{[a[1].name]:''})
      }
      console.log('ReportComponent defaultFormValues',tableComponentType,'setting default value for attribute',a[1].name,':',result);
      return result;
    },{});
    // console.log('defaultFormValues return',currentEditorAttributes);
    return currentEditorAttributes;
  }
}

let count = 0
// ##########################################################################################
// export const ReportComponent: React.FC<ReportComponentProps> = memo((
export const ReportSectionDisplay: React.FC<ReportComponentProps> = (
  props: ReportComponentProps
) => {
  // const [count, setCount] = useState(0);
  const domainController: DomainControllerInterface = useDomainControllerService();
  const [dialogOuterFormObject, setdialogOuterFormObject] = useMiroirContextInnerFormOutput();

  // setCount(count + 1);
  count++;

  const onSubmitInnerFormDialog: SubmitHandler<JsonObjectFormEditorDialogInputs> = useCallback(
    async (data,event) => {
      const buttonType:string=(event?.nativeEvent as any)['submitter']['name'];
      console.log('ReportComponent onSubmitFormDialog',buttonType,'received data',data,'props',props,'dialogFormObject',dialogOuterFormObject);
      if (props.tableComponentReportType == 'JSON_ARRAY') {
        if (buttonType == 'InnerDialog') {
          const previousValue = dialogOuterFormObject && dialogOuterFormObject['attributes']?dialogOuterFormObject['attributes']:props.rowData;
          const newAttributesValue = previousValue.slice();
          newAttributesValue.push(data as EntityAttribute);
          const newObject = Object.assign({},dialogOuterFormObject?dialogOuterFormObject:{},{attributes:newAttributesValue});
          setdialogOuterFormObject(newObject); // TODO use Zod parse!
          console.log('ReportComponent onSubmitFormDialog dialogFormObject',dialogOuterFormObject,'newObject',newObject);
        } else {
          console.log('ReportComponent onSubmitFormDialog ignored event',buttonType);
        }
      } else {
        console.warn('ReportComponent onSubmitFormDialog called with inapropriate report type:',props.tableComponentReportType)
      }
    },[dialogOuterFormObject]
  ) 

  const onCreateFormObject = useCallback(
    async (data:any) => {
      console.log('ReportComponent onEditFormObject called with new object value',data);
      
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
      console.log('ReportComponent onEditFormObject called with new object value',data);
      
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
      console.log('ReportComponent onSubmitOuterDialog','buttonType',buttonType,'data',data,'dialogFormObject',dialogOuterFormObject,buttonType,);
      if (buttonType == 'OuterDialog') {
        await onCreateFormObject(data);
      } else {
        console.log('ReportComponent onSubmitOuterDialog ignoring event for',buttonType);
        
      }
    },
    []
  )

  // const instancesToDisplay = useLocalCacheInstancesForEntity(
  //   props.displayedDeploymentDefinition?.uuid,
  //   props.chosenApplicationSection,
  //   // props.tableComponentReportType == "EntityInstance" && props.currentMiroirReport?.definition.parentUuid ? props.currentMiroirReport?.definition.parentUuid : ""
  //   props.tableComponentReportType == "EntityInstance" && props.currentMiroirReportSectionListDefinition?.parentUuid ? props.currentMiroirReportSectionListDefinition?.parentUuid : ""
  // );

  const instancesToDisplay = useLocalCacheEntityInstancesForListReportSection(
    props.displayedDeploymentDefinition?.uuid,
    props.chosenApplicationSection,
    props.tableComponentReportType == "EntityInstance"?props.currentReportUuid:undefined
    // props.tableComponentReportType == "EntityInstance" && props.currentMiroirReport?.definition.parentUuid ? props.currentMiroirReport?.definition.parentUuid : ""
    // props.tableComponentReportType == "EntityInstance" && props.currentMiroirReportSectionListDefinition?.parentUuid ? props.currentMiroirReportSectionListDefinition?.parentUuid : ""
  )

  let columnDefs:ColDef<any>[];


  if (props.tableComponentReportType == "EntityInstance") {
    columnDefs=getColumnDefinitionsFromEntityDefinitionJzodSchema(props.currentMiroirEntityDefinition?.jzodSchema);

    const instancesWithStringifiedJsonAttributes: any[] = instancesToDisplay.map(
      (i) =>
        Object.fromEntries(
          Object.entries(i).map((e) => {
            const currentAttributeDefinition = Object.entries(props.currentMiroirEntityDefinition?.jzodSchema.definition).find((a) => a[0] == e[0]);
            return [
            e[0],
            currentAttributeDefinition && currentAttributeDefinition[1].type == "object"
              ? JSON.stringify(e[1])
              : e[1],
          ]})
        )
    );
  
    console.log("ReportComponent instancesToDisplay",instancesToDisplay);
    console.log("ReportComponent props.currentMiroirEntity",props?.currentMiroirEntity);
    console.log("ReportComponent columnDefs",columnDefs);


  
    return (
      <div className="MiroirReport-global" style={{ display: "flex" }}>
        <span>rendered: {count} times.</span>
        {props?.currentMiroirReportSectionListDefinition ? (
          columnDefs?.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div>
                {/* colonnes: {JSON.stringify(columnDefs)} */}
                {/* <p/>
                      deployment: {JSON.stringify(props.displayedDeploymentDefinition?.uuid)}
                      <p/> */}
              </div>
              <JsonObjectFormEditorDialog
                showButton={true}
                isAttributes={true}
                label={props.currentMiroirEntityDefinition.name}
                jzodSchema={props.currentMiroirEntityDefinition?.jzodSchema as JzodObject}
                initialValuesObject={
                  defaultFormValues(
                    props.tableComponentReportType,
                    props.currentMiroirEntityDefinition?.jzodSchema as JzodObject,
                    [],
                    props.currentMiroirEntity,
                    props.displayedDeploymentDefinition
                  )
                }
                onSubmit={onSubmitOuterDialog}
              />
              {props.displayedDeploymentDefinition ? (
                <MTableComponent
                  type={props.tableComponentReportType}
                  displayedDeploymentDefinition={props.displayedDeploymentDefinition}
                  styles={props.styles}
                  currentMiroirEntity={props.currentMiroirEntity}
                  currentMiroirEntityDefinition={props.currentMiroirEntityDefinition}
                  reportSectionListDefinition={props.currentMiroirReportSectionListDefinition}
                  columnDefs={columnDefs}
                  rowData={instancesWithStringifiedJsonAttributes}
                  displayTools={true}
                  onRowEdit={onEditFormObject}
                ></MTableComponent>
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
  } else { // props.tableComponentReportType == "JSON_ARRAY"
    const existingRows = dialogOuterFormObject && dialogOuterFormObject['attributes']?dialogOuterFormObject['attributes']:props.rowData
    console.log('ReportComponent display report for',props.label,props.tableComponentReportType,'dialogFormObject',dialogOuterFormObject);
    
    return (
      <div>
        <JsonObjectFormEditorDialog
          showButton={true}
          jzodSchema={entityDefinitionEntityDefinition.jzodSchema as JzodObject}
          initialValuesObject={defaultFormValues(props.tableComponentReportType, entityDefinitionEntityDefinition.jzodSchema as JzodObject, [], existingRows)}
          label='InnerDialog'
          onSubmit={onSubmitInnerFormDialog}
        />
        <MTableComponent
          type="JSON_ARRAY"
          styles={props.styles}
          columnDefs={props.columnDefs}
          rowData={existingRows}
          displayTools={true}
        >
        </MTableComponent>
      </div>
    );
  }

}