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
  EntityArrayAttribute,
  EntityAttribute,
  EntityDefinitionSchema,
  MetaEntity,
  MetaEntitySchema,
  ReportSchema,
  ReportSectionListDefinitionSchema,
  entityDefinitionEntityDefinition
} from "miroir-core";
import {
  useLocalCacheInstancesForEntity
} from "miroir-fwk/4_view/hooks";

import { getColumnDefinitionsFromEntityAttributes } from "miroir-fwk/4_view/getColumnDefinitionsFromEntityAttributes";
import { JsonObjectFormEditorDialog, JsonObjectFormEditorDialogInputs } from "./JsonObjectFormEditorDialog";
import { MTableComponent, TableComponentType, TableComponentTypeSchema } from "./MTableComponent";
import { useDomainControllerServiceHook, useMiroirContextInnerFormOutput } from './MiroirContextReactProvider';

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

export function defaultFormValues(
  tableComponentType: TableComponentType,
  currentEntityAttributes:EntityAttribute[],
  idList?:{id:number}[],
  currentMiroirEntity?: MetaEntity,
  displayedDeploymentDefinition?: ApplicationDeployment,
):any {
  // console.log('defaultFormValues called TableComponentType',tableComponentType, 'currentMiroirEntity',currentMiroirEntity,'currentEntityAttributes',currentEntityAttributes);
  
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
    const currentEditorAttributes = currentEntityAttributes.reduce((acc,a)=>{
      let result
      if (Object.keys(attributeDefaultValue).includes(a.name)) {
        result = Object.assign({},acc,{[a.name]:attributeDefaultValue[a.name]})
      } else {
        result = Object.assign({},acc,{[a.name]:''})
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
    const currentEditorAttributes = currentEntityAttributes.reduce((acc,a)=>{
      let result
      if (Object.keys(attributeDefaultValue).includes(a.name)) {
        result = Object.assign({},acc,{[a.name]:attributeDefaultValue[a.name]})
      } else {
        result = Object.assign({},acc,{[a.name]:''})
      }
      console.log('ReportComponent defaultFormValues',tableComponentType,'setting default value for attribute',a.name,':',result);
      return result;
    },{});
    // console.log('defaultFormValues return',currentEditorAttributes);
    return currentEditorAttributes;
  }
}


// ##########################################################################################
// export const ReportComponent: React.FC<ReportComponentProps> = memo((
export const ReportSectionDisplay: React.FC<ReportComponentProps> = (
  props: ReportComponentProps
) => {
  const domainController: DomainControllerInterface = useDomainControllerServiceHook();
  const [dialogOuterFormObject, setdialogOuterFormObject] = useMiroirContextInnerFormOutput();

  const onSubmitInnerFormDialog: SubmitHandler<JsonObjectFormEditorDialogInputs> = async (data,event) => {
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
  }

  const instancesToDisplay = useLocalCacheInstancesForEntity(
    props.displayedDeploymentDefinition?.uuid,
    props.chosenApplicationSection,
    // props.tableComponentReportType == "EntityInstance" && props.currentMiroirReport?.definition.parentUuid ? props.currentMiroirReport?.definition.parentUuid : ""
    props.tableComponentReportType == "EntityInstance" && props.currentMiroirReportSectionListDefinition?.parentUuid ? props.currentMiroirReportSectionListDefinition?.parentUuid : ""
  );

  let columnDefs:ColDef<any>[];


  if (props.tableComponentReportType == "EntityInstance") {
    const currentEntityAttributes: EntityAttribute[] = props.currentMiroirEntityDefinition?.attributes?props.currentMiroirEntityDefinition?.attributes:[];
    columnDefs=getColumnDefinitionsFromEntityAttributes(currentEntityAttributes);

    // const instancesWithStringifiedJsonAttributes: EntityInstance[] = instancesToDisplay.map(
    const instancesWithStringifiedJsonAttributes: any[] = instancesToDisplay.map(
      (i) =>
        Object.fromEntries(
          Object.entries(i).map((e) => [
            e[0],
            props.currentMiroirEntityDefinition?.attributes?.find((a) => a.name == e[0])?.type == "OBJECT"
              ? JSON.stringify(e[1])
              : e[1],
              // ? {value:JSON.stringify(e[1])}
              // : {value:e[1]},
          ])
        )
    );
  
    console.log("ReportComponent instancesToDisplay",instancesToDisplay);
    console.log("ReportComponent props.currentMiroirEntity",props?.currentMiroirEntity);
    console.log("ReportComponent columnDefs",columnDefs);

    const onCreateFormObject = async (data:any) => {
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
            },props.currentModel
          );
        } else {
          const createAction: DomainDataAction = {
            actionName: "create",
            actionType:"DomainDataAction",
            objects: [
              {
                parentName: data.name,
                parentUuid: data.parentUuid,
                applicationSection:props.chosenApplicationSection,
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
    }

    const onEditFormObject = async (data:any) => {
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
            },props.currentModel
          );
        } else {
          const updateAction: DomainDataAction = {
            actionName: "update",
            actionType:"DomainDataAction",
            objects: [
              {
                parentName: data.name,
                parentUuid: data.parentUuid,
                applicationSection:props.chosenApplicationSection,
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
    }

    const onSubmitOuterDialog: SubmitHandler<JsonObjectFormEditorDialogInputs> = async (data,event) => {
      const buttonType:string=(event?.nativeEvent as any)['submitter']['name'];
      console.log('ReportComponent onSubmitOuterDialog','buttonType',buttonType,'data',data,'dialogFormObject',dialogOuterFormObject,buttonType,);
      if (buttonType == 'OuterDialog') {
        await onCreateFormObject(data);
      } else {
        console.log('ReportComponent onSubmitOuterDialog ignoring event for',buttonType);
        
      }
    }
  
    return (
      <div className="MiroirReport-global" style={{display:"flex",}}>
        {
          props?.currentMiroirReportSectionListDefinition?
            (
              columnDefs?.length > 0?
                <div style={{display:"flex", flexDirection:"column", alignItems:'center'}}>
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
                    entityAttributes={currentEntityAttributes}
                    formObject={defaultFormValues(props.tableComponentReportType, currentEntityAttributes, [], props.currentMiroirEntity, props.displayedDeploymentDefinition)}
                    onSubmit={onSubmitOuterDialog}
                  />
                  {
                    props.displayedDeploymentDefinition?
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
                    >
                    </MTableComponent>
                    :
                    <div></div>
                  }
                </div>
              :
                <span>No elements in the report</span>
            )
          :
            <span>no report to display</span>
        }
      </div>
    );
  } else { // props.tableComponentReportType == "JSON_ARRAY"
    const entityDefinitionAttribute:EntityArrayAttribute = entityDefinitionEntityDefinition.attributes[7] as EntityArrayAttribute;// assumption: the only JSON_ARRAY ReportComponent instance displays the list of attributes of an Entity
    const existingRows = dialogOuterFormObject && dialogOuterFormObject['attributes']?dialogOuterFormObject['attributes']:props.rowData
    // const entityDefinitionAttribute:EntityAttribute = entityDefinitionEntityDefinition.attributes[7] as EntityAttribute;

    console.log('ReportComponent display report for',props.label,props.tableComponentReportType,'dialogFormObject',dialogOuterFormObject);
    
    return (
      <div>
        <JsonObjectFormEditorDialog
          showButton={true}
          entityAttributes={entityDefinitionAttribute.lineFormat}
          formObject={defaultFormValues(props.tableComponentReportType, entityDefinitionAttribute.lineFormat, existingRows)}
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