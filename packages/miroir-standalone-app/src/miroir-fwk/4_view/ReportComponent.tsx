import AddBoxIcon from '@mui/icons-material/AddBox';
import {
  Button
} from "@mui/material";
import { v4 as uuidv4 } from 'uuid';
import { z } from "zod";

import {
  ApplicationDeploymentSchema,
  ApplicationSectionSchema,
  DomainControllerInterface,
  EntityAttribute,
  EntityAttributeArray,
  EntityDefinitionSchema,
  EntityInstance,
  MetaEntitySchema,
  ReportSchema,
  entityDefinitionEntityDefinition
} from "miroir-core";
import {
  useLocalCacheInstancesForEntity
} from "miroir-fwk/4_view/hooks";

import { ColDef } from "ag-grid-community";
import { getColumnDefinitions } from "miroir-fwk/4_view/EntityViewer";
import { useState } from 'react';
import { SubmitHandler } from 'react-hook-form';
import { EditorAttribute, JsonObjectFormEditorDialog, JsonObjectFormEditorDialogInputs } from "./JsonObjectFormEditorDialog";
import { MTableComponent, TableComponentTypeSchema } from "./MTableComponent";
import { useDomainControllerServiceHook, useMiroirContextInnerFormOutput } from './MiroirContextReactProvider';
// import { getColumnDefinitions } from "miroir-react";


// export const TableComponentReportTypeSchema = z.enum([
//   "EntityInstance",
//   "JSON_ARRAY",
// ]);

export const ReportComponentCorePropsSchema = z.object({
  styles:z.any().optional(),
  displayedDeploymentDefinition: ApplicationDeploymentSchema.optional(),
  chosenApplicationSection: ApplicationSectionSchema.optional(),
});

export const ReportComponentEntityInstancePropsSchema = ReportComponentCorePropsSchema.extend({
  tableComponentReportType: z.literal(TableComponentTypeSchema.enum.EntityInstance),
  currentModel:z.any(),
  currentMiroirReport: ReportSchema.optional(),
  currentMiroirEntity: MetaEntitySchema.optional(),
  currentMiroirEntityDefinition: EntityDefinitionSchema.optional(),
});

export const ReportComponentJsonArrayPropsSchema = ReportComponentCorePropsSchema.extend({
  tableComponentReportType: z.literal(TableComponentTypeSchema.enum.JSON_ARRAY),
  columnDefs: z.array(z.any()),
  label:z.string(),
});

// ##########################################################################################
export const ReportComponentPropsSchema = z.union([
  ReportComponentEntityInstancePropsSchema,
  ReportComponentJsonArrayPropsSchema,
]);
export type ReportComponentProps = z.infer<typeof ReportComponentPropsSchema>;

// ##########################################################################################
export const ReportComponent: React.FC<ReportComponentProps> = (
  props: ReportComponentProps
) => {
  const domainController: DomainControllerInterface = useDomainControllerServiceHook();

  const [dialogFormIsOpen, setdialogFormIsOpen] = useState(false);
  // const [innerDialogIsOpen, setInnerDialogIsOpen] = useState(false);
  const [dialogFormOutput, setdialogFormOutput] = useMiroirContextInnerFormOutput();

  // const [editableAttributes, setEditableAttributes] = React.useState(entityDefinitionEntityDefinition.attributes.slice());

  const handleDialogFormOpen = () => {
    setdialogFormIsOpen(true);
  };

  const handleDialogFormClose = (value: string) => {
    console.log('ReportComponent handleDialogFormClose',value);
    
    setdialogFormIsOpen(false);
  };

  const onSubmitFormDialog: SubmitHandler<JsonObjectFormEditorDialogInputs> = async (data,event) => {
    const buttonType:string=(event?.nativeEvent as any)['submitter']['name'];
    console.log('JsonObjectFormEditorDialog onSubmitFormDialog',buttonType,'received event',data,'dialogFormOutput',dialogFormOutput);
    if (buttonType == 'InnerDialog') {
      const previousValue = dialogFormOutput && dialogFormOutput['attributes']?dialogFormOutput['attributes']:[];
      const newValue = previousValue.slice();
      newValue.push(data as EntityAttribute);
      setdialogFormOutput({attributes:newValue}); // TODO use Zod parse!
      handleDialogFormClose(JSON.stringify(data))
      console.log('JsonObjectFormEditorDialog onSubmitFormDialog',event,'dialogFormOutput',dialogFormOutput);
    } else {
      console.log('JsonObjectFormEditorDialog onSubmitFormDialog ignored event',buttonType);
    }
  }

  const instancesToDisplay = useLocalCacheInstancesForEntity(
    props.displayedDeploymentDefinition?.uuid,
    props.chosenApplicationSection,
    props.tableComponentReportType == "EntityInstance" && props.currentMiroirReport?.definition.parentUuid ? props.currentMiroirReport?.definition.parentUuid : ""
  );

  if (props.tableComponentReportType == "EntityInstance") {
    let instancesWithStringifiedJsonAttributes: EntityInstance[];
    const currentEntityAttributes: EntityAttribute[] = props.currentMiroirEntityDefinition?.attributes?props.currentMiroirEntityDefinition?.attributes:[];
    let currentEditorAttributes: EditorAttribute[];

    let columnDefs:ColDef<any>[];

    instancesWithStringifiedJsonAttributes = instancesToDisplay.map(
      (i) =>
        Object.fromEntries(
          Object.entries(i).map((e) => [
            e[0],
            props.currentMiroirEntityDefinition?.attributes?.find((a) => a.name == e[0])?.type == "OBJECT"
              ? JSON.stringify(e[1])
              : e[1],
          ])
        ) as EntityInstance
    );
    currentEditorAttributes = currentEntityAttributes.map(a=>{
      const attributeDefaultValue:any = {
        'uuid': uuidv4(),
        'parentName':props.currentMiroirEntity?.name,
        'parentUuid':props.currentMiroirEntity?.uuid,
        'conceptLevel':'Model',
        'application': props.displayedDeploymentDefinition?.application,
        'attributes': "[]",
      }
      if (Object.keys(attributeDefaultValue).includes(a.name)) {
        console.log('ReportComponent setting default value for attribute',a.name,':',attributeDefaultValue[a.name]);
        
        return {attribute:a,value:attributeDefaultValue[a.name]}
      } else {
        return {attribute:a,value:''}
      }
    });
    columnDefs=getColumnDefinitions(currentEntityAttributes);

    console.log("ReportComponent instancesToDisplay",instancesToDisplay);
    console.log("ReportComponent props.currentMiroirEntity",props?.currentMiroirEntity);
    console.log("ReportComponent columnDefs",columnDefs);

    const onSubmitOuterDialog: SubmitHandler<JsonObjectFormEditorDialogInputs> = async (data,event) => {
      const buttonType:string=(event?.nativeEvent as any)['submitter']['name'];
      console.log('ReportComponent onSubmitOuterDialog','buttonType',buttonType,'dialogFormOutput',dialogFormOutput,buttonType,data);
      const newEntity:EntityInstance = Object.assign({...data as EntityInstance},{attributes:dialogFormOutput['attributes']})
      if (buttonType == 'OuterDialog') {
        if (props.displayedDeploymentDefinition) {
          await domainController.handleDomainAction(
            props.displayedDeploymentDefinition?.uuid,
            {
            actionType: "DomainTransactionalAction",
            actionName: "UpdateMetaModelInstance",
            update: {
              updateActionType: "ModelCUDInstanceUpdate",
              updateActionName: "create",
              objects: [{
                parentName: data.name,
                parentUuid: data.parentUuid,
                applicationSection:'model',
                instances: [
                  newEntity 
                ]
              }],
            }
          },props.currentModel);
        } else {
          throw new Error('ReportComponent onSubmitOuterDialog props.displayedDeploymentDefinition is undefined.')
        }
      
        handleDialogFormClose(JSON.stringify(data))
      } else {
        console.log('ReportComponent onSubmitOuterDialog ignoring event for',buttonType);
        
      }
    }
  
    return (
      <div className="MiroirReport-global" style={{display:"flex",}}>
        {
          props?.currentMiroirReport?
            (
              columnDefs?.length > 0?
                <div style={{display:"flex", flexDirection:"column", alignItems:'center'}}>
                  <div>
                      {/* props: {JSON.stringify(props)} */}
                      {/* erreurs: {JSON.stringify(errorLog.getErrorLog())} */}
                      colonnes: {JSON.stringify(columnDefs)}
                      <p/>
                      deployment: {JSON.stringify(props.displayedDeploymentDefinition?.uuid)}
                      <p/>
                    <h3>
                      {props?.currentMiroirReport?.defaultLabel}
                      <Button variant="outlined" onClick={handleDialogFormOpen}>
                        <AddBoxIcon/>
                      </Button>
                    </h3>
                  </div>
                  <JsonObjectFormEditorDialog
                    isAttributes={true}
                    label='OuterDialog'
                    editorAttributes={currentEditorAttributes}
                    isOpen={dialogFormIsOpen}
                    onSubmit={onSubmitOuterDialog}
                    onClose={handleDialogFormClose}
                  />
                  <MTableComponent
                    type={props.tableComponentReportType}
                    styles={props.styles}
                    currentMiroirEntity={props.currentMiroirEntity}
                    currentMiroirEntityDefinition={props.currentMiroirEntityDefinition}
                    reportDefinition={props.currentMiroirReport}
                    columnDefs={columnDefs}
                    rowData={instancesWithStringifiedJsonAttributes}
                  >
                  </MTableComponent>
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
    const entityDefinitionAttribute:EntityAttributeArray = entityDefinitionEntityDefinition.attributes[7] as EntityAttributeArray;

    return (
      <div>
        <h3>
          {props.label}:
          <Button variant="outlined" onClick={handleDialogFormOpen}>
            <AddBoxIcon/>
          </Button>
        </h3>
        <JsonObjectFormEditorDialog
          editorAttributes={entityDefinitionAttribute.lineFormat.map(a =>({attribute:a as EntityAttribute,value:''}))}
          label='InnerDialog'
          isOpen={dialogFormIsOpen}
          onSubmit={onSubmitFormDialog}
          onClose={handleDialogFormClose}
        />
        <MTableComponent
          type="JSON_ARRAY"
          styles={props.styles}
          columnDefs={props.columnDefs}
          rowData={dialogFormOutput && dialogFormOutput['attributes']?dialogFormOutput['attributes']:[]}
        >
        </MTableComponent>
      </div>
    );
  }

}