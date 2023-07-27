import {
  CellClickedEvent,
  CellDoubleClickedEvent,
  CellEditingStartedEvent,
  CellEditingStoppedEvent,
  CellValueChangedEvent,
  RowDataUpdatedEvent
} from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { useCallback, useMemo, useState } from 'react';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

import { z } from "zod";

import { SubmitHandler } from 'react-hook-form';

import { JzodObject } from '@miroir-framework/jzod';
import {
  ApplicationDeploymentSchema,
  DomainControllerInterface,
  EntityDefinitionSchema,
  MetaEntitySchema,
  MiroirMetaModel,
  ReportSectionListDefinitionSchema,
  entityEntity
} from "miroir-core";
import EntityEditor from 'miroir-fwk/4_view/EntityEditor';
import {
  useDomainControllerService, useErrorLogService,
  useMiroirContextService
} from 'miroir-fwk/4_view/MiroirContextReactProvider';
import { useNavigate } from 'react-router-dom';
import { ToolsCellRenderer } from './GenderCellRenderer';
import { JsonObjectFormEditorDialog, JsonObjectFormEditorDialogInputs } from './JsonObjectFormEditorDialog';
import { useLocalCacheMetaModel } from './ReduxHooks';
import { defaultFormValues } from './ReportSectionDisplay';
import { useSelector } from 'react-redux';
import { LocalCacheInputSelectorParams, ReduxStateWithUndoRedo, selectModelForDeployment } from 'miroir-redux';

export const TableComponentTypeSchema = z.enum([
  "EntityInstance",
  "JSON_ARRAY",
]);

export type TableComponentType = z.infer<typeof TableComponentTypeSchema>;

export const TableComponentCellSchema = z.object({
  link:z.string().optional(),
  value:z.any(),
})
export type TableComponentCell = z.infer<typeof TableComponentCellSchema>;

export const TableComponentRowSchema = z.record(TableComponentCellSchema);
export type TableComponentRow = z.infer<typeof TableComponentRowSchema>;


export const TableComponentCorePropsSchema = z.object({
  columnDefs:z.array(z.any()),
  rowData: z.array(z.any()),
  styles:z.any().optional(),
  children: z.any(),
  displayTools: z.boolean(),
})

export const TableComponentEntityInstancePropsSchema = TableComponentCorePropsSchema.extend({
  type: z.literal(TableComponentTypeSchema.enum.EntityInstance),
  displayedDeploymentDefinition: ApplicationDeploymentSchema,
  currentMiroirEntity: MetaEntitySchema,
  currentMiroirEntityDefinition: EntityDefinitionSchema,
  reportSectionListDefinition: ReportSectionListDefinitionSchema,
  onRowEdit: z.function().args(z.any()).returns(z.void()),
});
export type TableComponentEntityInstanceProps = z.infer<typeof TableComponentEntityInstancePropsSchema>;

export const TableComponentJsonArrayPropsSchema = TableComponentCorePropsSchema.extend({
  type: z.literal(TableComponentTypeSchema.enum.JSON_ARRAY),
});
export type TableComponentJsonArrayProps = z.infer<typeof TableComponentJsonArrayPropsSchema>;

// ##########################################################################################
export const TableComponentPropsSchema = z.union([
  TableComponentEntityInstancePropsSchema,
  TableComponentJsonArrayPropsSchema,
]);

export type TableComponentProps = z.infer<typeof TableComponentPropsSchema>;

// ################################################################################################
export const MTableComponent = (props: TableComponentProps) => {
  console.log('MTableComponent started with props',props);
  const navigate = useNavigate();
  const context = useMiroirContextService();
  const contextDeploymentUuid = context.deploymentUuid;
  const errorLog = useErrorLogService();
  console.log('MTableComponent 5');
  const domainController: DomainControllerInterface = useDomainControllerService();
  console.log('MTableComponent 6');

  const [dialogFormObject, setdialogFormObject] = useState<undefined | any>(undefined);
  console.log('MTableComponent 7');
  const [dialogFormIsOpen, setdialogFormIsOpen] = useState(false);
  console.log('MTableComponent 8');


  
  console.log('MTableComponent 9');
  // const currentModel = useLocalCacheMetaModel(context.deploymentUuid)();
  const selectorParams:LocalCacheInputSelectorParams = useMemo(
    () => ({
      deploymentUuid: context.deploymentUuid,
      applicationSection: "data",
      entityUuid: entityEntity.uuid,
    } as LocalCacheInputSelectorParams),
    [context]
  );

  const currentModel = useSelector((state: ReduxStateWithUndoRedo) =>
    selectModelForDeployment(state, selectorParams)
  ) as MiroirMetaModel
  console.log('MTableComponent 10');
  console.log("ReportPage currentModel", currentModel);

  const onCellValueChanged = useCallback(async (e:CellValueChangedEvent) => {
    console.warn("onCellValueChanged",e, 'contextDeploymentUuid',contextDeploymentUuid)
    // if (props.reportDefinition.definition.parentUuid == entityEntity.uuid) {
    //   const entity = e.data as MetaEntity;
    //   // sending ModelUpdates
    //   await domainController.handleDomainTransactionalAction(
    //     contextDeploymentUuid,
    //     {
    //       actionType: "DomainTransactionalAction",
    //       actionName: "updateEntity",
    //       update: {
    //         updateActionName:"WrappedTransactionalEntityUpdate",
    //         modelEntityUpdate:{
    //           updateActionType:"ModelEntityUpdate",
    //           updateActionName: "renameEntity",
    //           entityName: e.oldValue,
    //           entityUuid: entity.uuid,
    //           targetValue: e.newValue,
    //         },
    //       }
    //     },
    //     currentModel
    //   );
        
    // } else {
    //   console.log("onCellValueChanged on instance of entity",props.reportDefinition.definition.parentName, props.reportDefinition.definition.parentUuid,'updating object',e.data)
    //   // sending DataUpdates
    //   await domainController.handleDomainAction(
    //     contextDeploymentUuid,
    //     {
    //       actionType: "DomainDataAction",
    //       actionName: "update",
    //       objects: [
    //         {
    //           parentUuid: props.reportDefinition.definition.parentUuid,
    //           applicationSection:'data',
    //           instances:[
    //             // Object.assign({},e.data,{[e.column.getColId()]:e.data.value})
    //             e.data
    //           ]
    //         }
    //       ]
    //     },
    //     currentModel
    //   );
    // }
  },[props,currentModel,])

  const onSubmitTableRowFormDialog: SubmitHandler<JsonObjectFormEditorDialogInputs> = async (data,event) => {
    console.log('MTableComponent onSubmitTableRowFormDialog called with data',data);
    
    if (props.type == 'EntityInstance') {
      await props.onRowEdit(data);
    } else {
      console.error('MTableComponent onSubmitTableRowFormDialog called for not EntityInstance');
    }
    handleDialogTableRowFormClose('');
  }

  // const handleDialogFormOpen = (label:string,a:any) => {
  const handleDialogTableRowFormOpen = (a:any) => {
    console.log('MTableComponent handleDialogTableRowFormOpen called dialogFormObject',dialogFormObject, 'passed value',a);
    
    if (a) {
      // setdialogFormObject(Object.assign({},dialogFormObject?dialogFormObject:{},{[label]:a}));
      setdialogFormObject(a);
      console.log('ReportComponent handleDialogTableRowFormOpen parameter is defined dialogFormObject',dialogFormObject);
    } else {
      // setdialogFormObject(Object.assign({},dialogFormObject?dialogFormObject:{},{[label]:undefined}));
      setdialogFormObject(undefined);
      console.log('ReportComponent handleDialogTableRowFormOpen parameter is undefined, no value is passed to form. dialogFormObject',dialogFormObject);
    }
    setdialogFormIsOpen(true);
  };

  const handleDialogTableRowFormClose = (value: string) => {
    console.log('ReportComponent handleDialogTableRowFormClose',value);
    
    setdialogFormIsOpen(false);
  };

  const columnDefs = [
    {
      field: 'tools',
      cellRenderer: ToolsCellRenderer,
      editable:false,
      // sort:'asc',
      // cellEditorParams: {
      //   entityUuid: entityPublisher.uuid
      // },
      cellRendererParams: {
        // entityUuid: ''
        onClick:handleDialogTableRowFormOpen
      },
    }
  ].concat(props.columnDefs);
  
  // const rowData = props.rowData.concat({})
  function onCellClicked(e:CellClickedEvent) {
    console.warn("onCellClicked",e)
    // <Link to={`/instance/f714bb2f-a12d-4e71-a03b-74dcedea6eb4/data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/caef8a59-39eb-48b5-ad59-a7642d3a1e8f`}>Book</Link>
    if (props.type == 'EntityInstance' && e.colDef.field && e.colDef.field != 'tools') {
      // console.warn("onCellClicked props.currentMiroirEntityDefinition.jzodSchema",props.currentMiroirEntityDefinition.jzodSchema)
      const columnDefinitionAttributeEntry = Object.entries(props.currentMiroirEntityDefinition.jzodSchema.definition).find((a:[string,any])=>a[0] == e.colDef.field);
      if (columnDefinitionAttributeEntry && columnDefinitionAttributeEntry[1].type == "simpleType" && columnDefinitionAttributeEntry[1].extra?.targetEntity) {
        const columnDefinitionAttribute = columnDefinitionAttributeEntry[1];
        const targetEntity = currentModel.entities.find(e=>e.uuid == columnDefinitionAttribute.extra?.targetEntity);
        navigate(
          `/instance/${contextDeploymentUuid}/${
            columnDefinitionAttribute?.extra?.targetEntityApplicationSection
              ? columnDefinitionAttribute?.extra.targetEntityApplicationSection
              : context.applicationSection
          }/${columnDefinitionAttribute?.extra?.targetEntity}/${e.data[e.colDef.field]}`
        );
      } else {
        console.log('onCellClicked cell is not an Entity Instance uuid, no navigation occurs.',columnDefinitionAttributeEntry);
      }
    }
  }
  
  
  function onCellDoubleClicked(e:CellDoubleClickedEvent) {
    console.warn("onCellDoubleClicked",e)
  }
  
  function onCellEditingStarted(e:CellEditingStartedEvent) {
    console.warn("onCellEditingStarted",e)
  }
  
  function onCellEditingStopped(e:CellEditingStoppedEvent) {
    console.warn("onCellEditingStarted",e)
  }
  
  function onRowDataUpdated(e:RowDataUpdatedEvent) {
    console.warn("onRowDataUpdated",e)
  }
  
  function onRowValueChanged(e:RowDataUpdatedEvent) {
    console.warn("onRowValueChanged",e)
  }
  
  return (
    <div>
      {props.type == "EntityInstance" ? (
        <div>
          <JsonObjectFormEditorDialog
            showButton={false}
            isOpen={dialogFormIsOpen}
            isAttributes={true}
            // label='OuterDialog'
            label={props.currentMiroirEntityDefinition.name}
            jzodSchema={props.currentMiroirEntityDefinition.jzodSchema as JzodObject}
            initialValuesObject={
              dialogFormObject
                ? dialogFormObject
                : defaultFormValues(
                    props.type,
                    props.currentMiroirEntityDefinition.jzodSchema as JzodObject,
                    [],
                    props.currentMiroirEntity,
                    props.displayedDeploymentDefinition
                  )
            }
            onSubmit={onSubmitTableRowFormDialog}
            onClose={handleDialogTableRowFormClose}
          />
        </div>
      ) : (
        <div></div>
      )}
      <div id="tata" className="ag-theme-alpine" style={props.styles}>
        <AgGridReact
          columnDefs={columnDefs}
          rowData={props.rowData}
          onCellClicked={onCellClicked}
          onCellEditingStarted={onCellEditingStarted}
          onCellEditingStopped={onCellEditingStopped}
          onCellValueChanged={onCellValueChanged}
          onRowDataUpdated={onRowDataUpdated}
          onCellDoubleClicked={onCellDoubleClicked}
          onRowValueChanged={onRowValueChanged}
          getRowId={(params) => (params.data.uuid ? params.data.uuid : params.data.id)}
          defaultColDef={{
            editable: true,
            sortable: true,
            filter: true,
            resizable: true,
            cellEditor: EntityEditor,
          }}
        ></AgGridReact>
      </div>
    </div>
  );
}