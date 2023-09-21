import { ColDef } from "ag-grid-community";
import { SubmitHandler } from 'react-hook-form';
import { v4 as uuidv4 } from 'uuid';
import { z } from "zod";
import equal from "fast-deep-equal";


import { JzodObject } from "@miroir-framework/jzod-ts";

import {
  ApplicationDeployment,
  ApplicationDeploymentSchema,
  ApplicationSectionSchema,
  DomainControllerInterface,
  DomainDataAction,
  EntityAttribute,
  EntityDefinitionSchema,
  EntityInstancesUuidIndex,
  MetaEntity,
  MetaEntitySchema,
  selectObjectListQuery,
  objectList,
  EntityInstance,
  MiroirSelectorParams
} from "miroir-core";

import { getColumnDefinitionsFromEntityDefinitionJzodObjectSchema } from "miroir-fwk/4_view/getColumnDefinitionsFromEntityAttributes";
import { useCallback, useMemo } from "react";
import { JsonObjectFormEditorDialog, JsonObjectFormEditorDialogInputs } from "./JsonObjectFormEditorDialog";
import { MTableComponent, TableComponentType, TableComponentTypeSchema } from "./MTableComponent";
import { useDomainControllerService, useMiroirContextInnerFormOutput } from './MiroirContextReactProvider';
import { useEntityInstanceListQueryFromLocalCache, useEntityInstanceUuidIndexFromLocalCache, useEntityInstanceUuidIndexFromDomainState } from "./ReduxHooks";

// ################################################################################################
export const ReportSectionDisplayCorePropsSchema = z.object({
  styles:z.any().optional(),
  displayedDeploymentDefinition: ApplicationDeploymentSchema.optional(),
  select: selectObjectListQuery.optional(), // ugly, this is due to the need of calling hooks in the same order, irrelevant of tableComponentReportType. Should be in ReportSectionDisplayEntityInstancePropsSchema.
  fetchedData: z.record(z.any()).optional(), // ugly, this is due to the need of calling hooks in the same order, irrelevant of tableComponentReportType. Should be in ReportSectionDisplayEntityInstancePropsSchema.
  chosenApplicationSection: ApplicationSectionSchema.optional(),// ugly, this is due to the need of calling hooks in the same order, irrelevant of tableComponentReportType. Should be in ReportSectionDisplayEntityInstancePropsSchema.
  label:z.string(),
});

export const ReportSectionDisplayEntityInstancePropsSchema = ReportSectionDisplayCorePropsSchema.extend({
  tableComponentReportType: z.literal(TableComponentTypeSchema.enum.EntityInstance),
  chosenApplicationSection: ApplicationSectionSchema,
  currentModel:z.any(),
  currentMiroirReportSectionObjectList: objectList.optional(),
  currentMiroirEntity: MetaEntitySchema.optional(),
  currentMiroirEntityDefinition: EntityDefinitionSchema.optional(),
});

export const ReportSectionDisplayJsonArrayPropsSchema = ReportSectionDisplayCorePropsSchema.extend({
  tableComponentReportType: z.literal(TableComponentTypeSchema.enum.JSON_ARRAY),
  columnDefs: z.array(z.any()),
  rowData: z.array(z.any()),
});

// ##########################################################################################
export const ReportSectionDisplayPropsSchema = ReportSectionDisplayEntityInstancePropsSchema;
// export const ReportSectionDisplayPropsSchema = z.union([
//   ReportSectionDisplayEntityInstancePropsSchema,
//   // ReportSectionDisplayJsonArrayPropsSchema,
// ]);
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
    
    const currentEditorAttributes = Object.entries(currentEntityJzodSchema.definition).reduce((acc,a)=>{
      let result
      if (Object.keys(attributeDefaultValue).includes(a[0])) {
        result = Object.assign({},acc,{[a[0]]:attributeDefaultValue[a[0]]})
      } else {
        result = Object.assign({},acc,{[a[0]]:''})
      }
      // console.log('ReportComponent defaultFormValues',tableComponentType,'EntityInstance setting default value for attribute',a.name,':',result);
      return result;
    },{});
    console.log('defaultFormValues return',currentEditorAttributes);
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
    console.log('defaultFormValues return',currentEditorAttributes);
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
  console.log('ReportSectionListDisplay',count,props === prevProps, equal(props,prevProps));
  prevProps = props;

  console.log('ReportSectionListDisplay props.fetchedData',props.fetchedData);

  const domainController: DomainControllerInterface = useDomainControllerService();
  const [dialogOuterFormObject, setdialogOuterFormObject] = useMiroirContextInnerFormOutput();

  const onSubmitInnerFormDialog: SubmitHandler<JsonObjectFormEditorDialogInputs> = useCallback(
    async (data,event) => {
      const buttonType:string=(event?.nativeEvent as any)['submitter']['name'];
      console.log('ReportComponent onSubmitFormDialog',buttonType,'received data',data,'props',props,'dialogFormObject',dialogOuterFormObject);
      // if (props.tableComponentReportType == 'JSON_ARRAY') {
      //   if (buttonType == 'InnerDialog') {
      //     const previousValue = dialogOuterFormObject && dialogOuterFormObject['attributes']?dialogOuterFormObject['attributes']:props.rowData;
      //     const newAttributesValue = previousValue.slice();
      //     newAttributesValue.push(data as EntityAttribute);
      //     const newObject = Object.assign({},dialogOuterFormObject?dialogOuterFormObject:{},{attributes:newAttributesValue});
      //     setdialogOuterFormObject(newObject); // TODO use Zod parse!
      //     console.log('ReportComponent onSubmitFormDialog dialogFormObject',dialogOuterFormObject,'newObject',newObject);
      //   } else {
      //     console.log('ReportComponent onSubmitFormDialog ignored event',buttonType);
      //   }
      // } else {
      //   console.warn('ReportComponent onSubmitFormDialog called with inapropriate report type:',props.tableComponentReportType)
      // }
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

  // const instancesToDisplayParams: MiroirSelectorParams = useMemo(
  //   () => ({
  //     type: "DomainEntityInstancesSelectorParams",
  //     definition: {
  //       deploymentUuid: props.displayedDeploymentDefinition?.uuid,
  //       applicationSection: props.chosenApplicationSection,
  //       entityUuid: props.tableComponentReportType == "EntityInstance" ? props.currentMiroirEntity?.uuid : undefined,
  //     }
  //   }),
  //   [props]
  // );
  // const instancesToDisplay: EntityInstancesUuidIndex | undefined = useEntityInstanceUuidIndexFromDomainState(instancesToDisplayParams)

  const selectedInstancesToDisplayParams = useMemo(() => ({
    localCacheSelectorParams: {
      deploymentUuid: props.displayedDeploymentDefinition?.uuid,
      applicationSection: props.chosenApplicationSection,
      entityUuid: props.tableComponentReportType == "EntityInstance" ? props.currentMiroirEntity?.uuid : undefined,
    },
    query: props.select ?? {
      type: "objectListQuery",
      parentUuid: "",
      parentName: undefined,
      rootObjectAttribute: undefined,
      rootObjectUuid: undefined,
    },
  }), [props]);
  const selectedInstancesToDisplay: EntityInstancesUuidIndex | undefined = undefined;
  // const selectedInstancesToDisplay: EntityInstancesUuidIndex | undefined = useEntityInstanceListQueryFromLocalCache(selectedInstancesToDisplayParams)

  // const publisher: EntityInstance = selectedInstancesToDisplay[]

  // console.log("ReportSectionListDisplay instancesToDisplay",instancesToDisplay,instancesToDisplay === prevInstancesToDisplay);
  // prevInstancesToDisplay = instancesToDisplay;


  // if (props.tableComponentReportType == "EntityInstance") {
    // const columnDefs:ColDef<any>[] = useMemo(()=>[],[]);
    const columnDefs: { columnDefs: ColDef<any>[] } = useMemo(
      () => ({
        columnDefs: getColumnDefinitionsFromEntityDefinitionJzodObjectSchema(
          props?.currentMiroirEntityDefinition?.jzodSchema
        ),
      }),
      [props.currentMiroirEntityDefinition?.jzodSchema]
    );
    console.log(
      "ReportSectionListDisplay",
      count,
      "props.currentMiroirEntityDefinition?.jzodSchema",
      props.currentMiroirEntityDefinition?.jzodSchema,
      "columnDefs",
      columnDefs,
      prevColumnDefs === columnDefs,
      equal(prevColumnDefs, columnDefs)
    );
    prevColumnDefs = columnDefs;
    prevJzodSchema = props.currentMiroirEntityDefinition?.jzodSchema;

  
    // console.log("ReportSectionListDisplay instancesWithStringifiedJsonAttributes",instancesWithStringifiedJsonAttributes,prevInstancesWithStringifiedJsonAttributes, instancesWithStringifiedJsonAttributes === prevInstancesWithStringifiedJsonAttributes);
    // prevInstancesWithStringifiedJsonAttributes = instancesWithStringifiedJsonAttributes;
    console.log("ReportSectionListDisplay props.currentMiroirEntity",props?.currentMiroirEntity);
    console.log("ReportSectionListDisplay columnDefs",columnDefs);


  
    return (
      <div className="MiroirReport-global" style={{ display: "flex" }}>
        <span>rendered ReportSectionListDisplay: {count} times.</span>
        {props.select?.label?<span>{props.select?.label}</span>:<></>}
        {
          props?.currentMiroirReportSectionObjectList ? (
            !!columnDefs
            // columnDefs?.length > 0 
            ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div>
                  {/* colonnes: {JSON.stringify(columnDefs)} */}
                </div>
                <JsonObjectFormEditorDialog
                  showButton={true}
                  isAttributes={true}
                  label={props.currentMiroirEntityDefinition?.name}
                  entityDefinitionJzodSchema={props.currentMiroirEntityDefinition?.jzodSchema as JzodObject}
                  currentDeploymentUuid={props.displayedDeploymentDefinition?.uuid}
                  currentApplicationSection={props.chosenApplicationSection}
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
                {
                  props.displayedDeploymentDefinition ? (
                    <div>
                      <span>{JSON.stringify(props.select)}</span>
                      <MTableComponent
                        type={props.tableComponentReportType}
                        displayedDeploymentDefinition={props.displayedDeploymentDefinition}
                        styles={props.styles}
                        currentEntity={props.currentMiroirEntity}
                        currentEntityDefinition={props.currentMiroirEntityDefinition}
                        reportSectionListDefinition={props.currentMiroirReportSectionObjectList}
                        columnDefs={columnDefs}
                        instancesToDisplay={props.fetchedData && props.fetchedData["booksOfPublisher"]?props.fetchedData["booksOfPublisher"]:selectedInstancesToDisplay??{}}
                        // instancesToDisplay={instancesToDisplay}
                        displayTools={true}
                        onRowEdit={onEditFormObject}
                      ></MTableComponent>
                    </div>
                  ) : (
                    <div></div>
                  )
                }
              </div>
            ) : (
              <span>No elements in the report</span>
            )
          ) : (
            <span>no report to display</span>
          )
        }
      </div>
    );
  // } else { // props.tableComponentReportType == "JSON_ARRAY"
  //   // const existingRows = dialogOuterFormObject && dialogOuterFormObject['attributes']?dialogOuterFormObject['attributes']:props.rowData
  //   // console.log('ReportComponent display report for',props.label,props.tableComponentReportType,'dialogFormObject',dialogOuterFormObject);
    
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