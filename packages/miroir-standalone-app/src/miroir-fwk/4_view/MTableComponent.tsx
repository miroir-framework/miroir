import {
  CellClickedEvent,
  CellDoubleClickedEvent,
  CellEditingStartedEvent,
  CellEditingStoppedEvent,
  CellValueChangedEvent,
  RowDataUpdatedEvent
} from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { useCallback, useState } from 'react';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

import { z } from "zod";

import { SubmitHandler } from 'react-hook-form';

import {
  ApplicationDeploymentSchema,
  DomainControllerInterface,
  EntityDefinition,
  EntityDefinitionSchema,
  MetaEntity,
  MetaEntitySchema,
  MiroirApplicationVersion,
  MiroirMetaModel,
  Report,
  ReportSchema,
  StoreBasedConfiguration
} from "miroir-core";
import EntityEditor from 'miroir-fwk/4_view/EntityEditor';
import { useDomainControllerServiceHook, useErrorLogServiceHook, useMiroirContextDeploymentUuid, useMiroirContextServiceHook } from 'miroir-fwk/4_view/MiroirContextReactProvider';
import {
  useLocalCacheModelVersion,
  useLocalCacheReports,
  useLocalCacheSectionEntities,
  useLocalCacheSectionEntityDefinitions,
  useLocalCacheStoreBasedConfiguration
} from "miroir-fwk/4_view/hooks";
import { useNavigate } from 'react-router-dom';
import { ToolsCellRenderer } from './GenderCellRenderer';
import { JsonObjectFormEditorDialog, JsonObjectFormEditorDialogInputs } from './JsonObjectFormEditorDialog';
import { defaultFormValues } from './ReportComponent';

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
  // rowData: TableComponentCellSchema,
  // rowData: z.array(TableComponentRowSchema),
  styles:z.any().optional(),
  children: z.any(),
  displayTools: z.boolean(),
})

export const TableComponentEntityInstancePropsSchema = TableComponentCorePropsSchema.extend({
  type: z.literal(TableComponentTypeSchema.enum.EntityInstance),
  displayedDeploymentDefinition: ApplicationDeploymentSchema,
  currentMiroirEntity: MetaEntitySchema,
  currentMiroirEntityDefinition: EntityDefinitionSchema,
  reportDefinition: ReportSchema,
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




export const MTableComponent = (props: TableComponentProps) => {
  const navigate = useNavigate();
  const context = useMiroirContextServiceHook();
  const contextDeploymentUuid = useMiroirContextDeploymentUuid();
  const miroirReports: Report[] = useLocalCacheReports();
  const currentMiroirEntities:MetaEntity [] = useLocalCacheSectionEntities(contextDeploymentUuid,'model');
  const currentMiroirEntityDefinitions:EntityDefinition[] = useLocalCacheSectionEntityDefinitions(contextDeploymentUuid,'model');
  const miroirApplicationVersions: MiroirApplicationVersion[] = useLocalCacheModelVersion();
  const storeBasedConfigurations: StoreBasedConfiguration[] = useLocalCacheStoreBasedConfiguration();
  // const transactions: ReduxStateChanges[] = useLocalCacheTransactions();
  const errorLog = useErrorLogServiceHook();
  const domainController: DomainControllerInterface = useDomainControllerServiceHook();

  const [dialogFormObject, setdialogFormObject] = useState<undefined | any>(undefined);
  const [dialogFormIsOpen, setdialogFormIsOpen] = useState(false);


  console.log('MTableComponent started with props',props);
  

  const currentModel: MiroirMetaModel =  {
    entities: currentMiroirEntities,
    entityDefinitions: currentMiroirEntityDefinitions,
    reports: miroirReports,
    configuration: storeBasedConfigurations,
    applicationVersions: miroirApplicationVersions,
    applicationVersionCrossEntityDefinition: [],
  };

  // console.log("MTableComponent miroirReports", currentModel);

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
      const columDefinitionDetails=props?.columnDefs?.find(c=>c.name == e.colDef.field);
      const columnDefinitionAttribute = props.currentMiroirEntityDefinition.attributes.find((a:any)=>a.name == e.colDef.field);
      if (columnDefinitionAttribute?.type == 'ENTITY_INSTANCE_UUID') {
        const targetEntity = currentMiroirEntities.find(e=>e.name == columnDefinitionAttribute?.defaultLabel);
        // navigate(`/instance/f714bb2f-a12d-4e71-a03b-74dcedea6eb4/data/${targetEntity?.uuid}/${e.data[e.colDef.field]}`);
        navigate(`/instance/${contextDeploymentUuid}/${columnDefinitionAttribute?.applicationSection?columnDefinitionAttribute?.applicationSection:context.applicationSection}/${columnDefinitionAttribute?.entityUuid}/${e.data[e.colDef.field]}`);
      } else {
        console.log('onCellClicked cell is not an Entity Instance uuid, no navigation occurs.',columnDefinitionAttribute?.type);
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
      {
        props.type == 'EntityInstance'?
        <div>
          <JsonObjectFormEditorDialog
            showButton={false}
            isOpen={dialogFormIsOpen}
            isAttributes={true}
            // label='OuterDialog'
            label={props.currentMiroirEntityDefinition.name}
            entityAttributes={props.currentMiroirEntityDefinition.attributes}
            formObject={dialogFormObject?dialogFormObject:defaultFormValues(props.type,props.currentMiroirEntityDefinition.attributes,[], props.currentMiroirEntity,props.displayedDeploymentDefinition)}
            onSubmit={onSubmitTableRowFormDialog}
            onClose={handleDialogTableRowFormClose}
          />
        </div>
        :
        <div></div>
      }
      <div
        id="tata"
        className="ag-theme-alpine"
        style={props.styles}
      >
        <AgGridReact
          columnDefs={columnDefs}
          // rowData={props.rowData.map((v:TableComponentRow)=>Object.fromEntries(Object.entries(v).map((e)=>[e[0],e[1].value])))}
          rowData={props.rowData}
          onCellClicked={onCellClicked}
          onCellEditingStarted={onCellEditingStarted}
          onCellEditingStopped={onCellEditingStopped}
          onCellValueChanged={onCellValueChanged}
          onRowDataUpdated={onRowDataUpdated}
          onCellDoubleClicked={onCellDoubleClicked}
          onRowValueChanged={onRowValueChanged}
          getRowId={params=>params.data.uuid?params.data.uuid:params.data.id}
          defaultColDef={
            {
              editable: true,
              sortable: true,
              filter: true,
              resizable: true,
              cellEditor: EntityEditor,
            }
          }
        >
        </AgGridReact>
      </div>
    </div>
  );
}