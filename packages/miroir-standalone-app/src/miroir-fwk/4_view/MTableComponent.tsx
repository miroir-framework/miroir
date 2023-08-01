import {
  CellClickedEvent,
  CellDoubleClickedEvent,
  CellEditingStartedEvent,
  CellEditingStoppedEvent,
  CellValueChangedEvent,
  RowDataUpdatedEvent
} from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { FC, useCallback, useMemo, useState } from 'react';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

import { z } from "zod";
import equal from "fast-deep-equal";


import { SubmitHandler } from 'react-hook-form';

import { JzodObject } from '@miroir-framework/jzod';
import {
  ApplicationDeployment,
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
import { useCurrentModel } from './ReduxHooks';
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
  columnDefs:z.object({columnDefs:z.array(z.any())}),
  rowData: z.object({instancesWithStringifiedJsonAttributes:z.array(z.any())}),
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
  onRowEdit: z.function().args(z.any()).returns(z.void()).optional(),
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


const applicationDeploymentLibrary: ApplicationDeployment = {
  "uuid":"f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
  "parentName":"ApplicationDeployment",
  "parentUuid":"35c5608a-7678-4f07-a4ec-76fc5bc35424",
  "type":"singleNode",
  "name":"LibraryApplicationPostgresDeployment",
  "application":"5af03c98-fe5e-490b-b08f-e1230971c57f",
  "description": "The default Postgres Deployment for Application Library",
  "applicationModelLevel": "model",
  "model": {
    "location": {
      "type": "sql",
      "side":"server",
      "connectionString": "postgres://postgres:postgres@localhost:5432/postgres",
      "schema": "library"
    }
  },
  "data": {
    "location": {
      "type": "sql",
      "side":"server",
      "connectionString": "postgres://postgres:postgres@localhost:5432/postgres",
      "schema": "library"
    }
  }
}

let count=0
let prevProps:TableComponentProps;
// ################################################################################################
export const MTableComponent = (props: TableComponentProps) => {


  const [gridData,setGridData] = useState(props.rowData.instancesWithStringifiedJsonAttributes);
  const navigate = useNavigate();
  const context = useMiroirContextService();
  const contextDeploymentUuid = context.deploymentUuid;
  const errorLog = useErrorLogService();
  // console.log('MTableComponent 5');
  const domainController: DomainControllerInterface = useDomainControllerService();
  // console.log('MTableComponent 6');

  const [dialogFormObject, setdialogFormObject] = useState<undefined | any>(undefined);
  // console.log('MTableComponent 7');
  const [dialogFormIsOpen, setdialogFormIsOpen] = useState(false);
  // console.log('MTableComponent 8');


  
  const currentModel = useCurrentModel(applicationDeploymentLibrary.uuid);
  console.log("MTableComponent currentModel", currentModel);

  const onCellValueChanged = useCallback(async (event:CellValueChangedEvent) => {
    // event?.stopPropagation();
    console.warn("onCellValueChanged",event, 'contextDeploymentUuid',contextDeploymentUuid)
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

  const onSubmitTableRowFormDialog: SubmitHandler<JsonObjectFormEditorDialogInputs> = useCallback(async (data,event) => {
    event?.stopPropagation();
    console.log('MTableComponent onSubmitTableRowFormDialog called with data',data);
    
    if (props.type == 'EntityInstance' && props?.onRowEdit) {
      await props.onRowEdit(data);
    } else {
      console.error('MTableComponent onSubmitTableRowFormDialog called for not EntityInstance');
    }
    handleDialogTableRowFormClose('');
  },[props])

  const handleDialogTableRowFormOpen = useCallback((a?:any,event?:any) => {
    event?.stopPropagation();
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
  },[]);

  const handleDialogTableRowFormClose = useCallback((value?: string, event?:any) => {
    event?.stopPropagation();
    console.log('ReportComponent handleDialogTableRowFormClose',value);
    
    setdialogFormIsOpen(false);
  },[]);

  const defaultColDef=useMemo(()=>({
    editable: true,
    sortable: true,
    filter: true,
    resizable: true,
    cellEditor: EntityEditor,
  }),[]);


  const columnDefs = useMemo(()=>[
    {
      field: 'tools',
      cellRenderer: ToolsCellRenderer,
      editable:false,
      // sort:'asc',
      // cellEditorParams: {
      //   entityUuid: entityPublisher.uuid
      // },
      cellRendererParams: {
        onClick:handleDialogTableRowFormOpen
      },
    }
  ].concat(props.columnDefs.columnDefs),[props.columnDefs]);
  
  console.log('MTableComponent started count',count++,'with props',props,props === prevProps, "columnDefs",columnDefs, "rowData changed:", props?.rowData === prevProps?.rowData);
  prevProps = props;

  const onCellClicked = useCallback((event:CellClickedEvent)=> {
    // event.stopPropagation();
    console.warn("onCellClicked",event)
    // <Link to={`/instance/f714bb2f-a12d-4e71-a03b-74dcedea6eb4/data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/caef8a59-39eb-48b5-ad59-a7642d3a1e8f`}>Book</Link>
    if (props.type == 'EntityInstance' && event.colDef.field && event.colDef.field != 'tools') {
      // console.warn("onCellClicked props.currentMiroirEntityDefinition.jzodSchema",props.currentMiroirEntityDefinition.jzodSchema)
      const columnDefinitionAttributeEntry = Object.entries(props.currentMiroirEntityDefinition.jzodSchema.definition).find((a:[string,any])=>a[0] == event.colDef.field);
      if (columnDefinitionAttributeEntry && columnDefinitionAttributeEntry[1].type == "simpleType" && columnDefinitionAttributeEntry[1].extra?.targetEntity) {
        const columnDefinitionAttribute = columnDefinitionAttributeEntry[1];
        // const targetEntity = currentModel.entities.find(e=>e.uuid == columnDefinitionAttribute.extra?.targetEntity);
        navigate(
          `/instance/${contextDeploymentUuid}/${
            columnDefinitionAttribute?.extra?.targetEntityApplicationSection
              ? columnDefinitionAttribute?.extra.targetEntityApplicationSection
              : context.applicationSection
          }/${columnDefinitionAttribute?.extra?.targetEntity}/${event.data[event.colDef.field]}`
        );
      } else {
        console.log('onCellClicked cell is not an Entity Instance uuid, no navigation occurs.',columnDefinitionAttributeEntry);
      }
    }
  },[props,])
  
  
  // function onCellDoubleClicked(e:CellDoubleClickedEvent) {
  //   console.warn("onCellDoubleClicked",e)
  // }
  
  // function onCellEditingStarted(e:CellEditingStartedEvent) {
  //   console.warn("onCellEditingStarted",e)
  // }
  
  // function onCellEditingStopped(e:CellEditingStoppedEvent) {
  //   console.warn("onCellEditingStarted",e)
  // }
  
  // function onRowDataUpdated(e:RowDataUpdatedEvent) {
  //   console.warn("onRowDataUpdated",e)
  // }
  
  // function onRowValueChanged(e:RowDataUpdatedEvent) {
  //   console.warn("onRowValueChanged",e)
  // }

  return (
    <div>
      {/* <span>MtableComponent count {count}</span>
      <br /> */}
      {/* <span>{props.type}</span>
      <br /> */}
      {/* <span>rowData: {JSON.stringify(props.rowData.instancesWithStringifiedJsonAttributes)}</span> */}
      {props.type == "EntityInstance" ? (
        <div>
          <JsonObjectFormEditorDialog
            showButton={false}
            isOpen={dialogFormIsOpen}
            isAttributes={true}
            // label='OuterDialog'
            label={props.currentMiroirEntityDefinition.name}
            jzodSchema={props.currentMiroirEntityDefinition.jzodSchema as JzodObject}
            currentDeploymentUuid={contextDeploymentUuid}
            currentApplicationSection={context.applicationSection}
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
        {/* <div id="tata" className="ag-theme-alpine"> */}
        <AgGridReact
            columnDefs={columnDefs}
            rowData={props.rowData.instancesWithStringifiedJsonAttributes}
            // rowData={gridData}
            getRowId={(params) => {
              // console.log("MtableComponent getRowId", params);
              return params.data?.uuid ? params.data?.uuid : params.data?.id;
            }}
            defaultColDef={defaultColDef}
            onCellClicked={onCellClicked}
            onCellValueChanged={onCellValueChanged}
            //
            // onCellEditingStarted={onCellEditingStarted}
            // onCellEditingStopped={onCellEditingStopped}
            // onRowDataUpdated={onRowDataUpdated}
            // onCellDoubleClicked={onCellDoubleClicked}
            // onRowValueChanged={onRowValueChanged}
          ></AgGridReact>
      </div>
    </div>
  );
}