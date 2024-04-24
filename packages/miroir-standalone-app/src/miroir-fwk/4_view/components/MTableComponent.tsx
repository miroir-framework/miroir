import {
  CellClickedEvent,
  CellValueChangedEvent,
  ColDef,
  ColGroupDef
} from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';


import {
  EntityDefinition,
  EntityInstance,
  JzodObject,
  LoggerInterface,
  MetaModel,
  MiroirLoggerFactory,
  adminConfigurationDeploymentMiroir,
  getLoggerName
} from "miroir-core";

import { packageName } from '../../../constants';
import EntityEditor from '../EntityEditor';
import {
  useMiroirContextInnerFormOutput,
  useMiroirContextService
} from '../MiroirContextReactProvider';
import { ToolsCellRenderer } from './GenderCellRenderer';
import { JsonObjectEditFormDialog, JsonObjectEditFormDialogInputs } from './JsonObjectEditFormDialog';
import { TableComponentProps, TableComponentRow, TableComponentTypeSchema } from './MTableComponentInterface';
import { useCurrentModel } from '../ReduxHooks';
import { cleanLevel } from '../constants';
import { JsonObjectDeleteFormDialog } from './JsonObjectDeleteFormDialog';

const loggerName: string = getLoggerName(packageName, cleanLevel,"MtableComponent");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});


let count=0
let prevProps:TableComponentProps;
const autoSizeStrategy = {
  type: 'fitGridWidth',
  defaultMinWidth: 100,
  columnLimits: [
      {
          colId: 'country',
          minWidth: 900
      }
  ]
};
// ################################################################################################
export const MTableComponent = (props: TableComponentProps) => {
  log.info(":::::::::::::::::::::::::: MTableComponent refreshing with props",props);
  
  const navigate = useNavigate();
  const context = useMiroirContextService();
  const contextDeploymentUuid = context.deploymentUuid;

  // TODO: redundant?
  const [dialogOuterFormObject, setdialogOuterFormObject] = useMiroirContextInnerFormOutput();
  const [dialogFormObject, setdialogFormObject] = useState<undefined | any>(undefined);

  // TODO: redundant?
  const [addObjectdialogFormIsOpen, setAddObjectdialogFormIsOpen] = useState(false);
  const [editDialogFormIsOpen, setEditDialogFormIsOpen] = useState(false);

  const [deleteDialogFormIsOpen, setDeleteDialogFormIsOpen] = useState(false);
  
  // log.info("MTableComponent refreshing with dialogFormObject",dialogFormObject);


  const miroirMetaModel: MetaModel = useCurrentModel(adminConfigurationDeploymentMiroir.uuid);
  const currentModel: MetaModel = useCurrentModel(contextDeploymentUuid);
  // log.info("MTableComponent currentModel", currentModel);

  const tableComponentRows: { tableComponentRowUuidIndexSchema: TableComponentRow[] } = useMemo(
    // always use object, not array, to ensure correct refresh!
    () => ({
      tableComponentRowUuidIndexSchema: Object.values(props.instancesToDisplay ?? {})
        .sort((a: EntityInstance, b: EntityInstance) => // initial sort, to be enhanced! (issue #22)
          props.sortByAttribute
            ? (a as any)[props.sortByAttribute] > (b as any)[props.sortByAttribute]
              ? 1
              : (a as any)[props.sortByAttribute] < (b as any)[props.sortByAttribute]
              ? -1
              : 0
            : 0
        )
        .map((i: EntityInstance) => ({
          rawValue: i,
          foreignKeyObjects: props.foreignKeyObjects,
          jzodSchema:
            props.type == TableComponentTypeSchema.enum.EntityInstance
              ? props.currentEntityDefinition.jzodSchema.definition
              : {},
          displayedValue: Object.fromEntries(
            Object.entries(i).map((e) => {
              const currentAttributeDefinition =
                props.type == TableComponentTypeSchema.enum.EntityInstance
                  ? Object.entries(props.currentEntityDefinition?.jzodSchema.definition ?? {}).find((a) => a[0] == e[0])
                  : undefined;
              return [
                e[0],
                Array.isArray(currentAttributeDefinition) &&
                currentAttributeDefinition.length > 1 &&
                (currentAttributeDefinition[1] as any).type == "object"
                  ? JSON.stringify(e[1])
                  : e[1],
              ];
            })
          ),
        })),
    }),
    [props.instancesToDisplay,props.sortByAttribute]
  );
  // log.info("MTableComponent tableComponentRows", tableComponentRows);

  // ##############################################################################################
  const onCellValueChanged = useCallback(async (event:CellValueChangedEvent) => {
    // event?.stopPropagation();
    log.warn("onCellValueChanged",event, 'contextDeploymentUuid',contextDeploymentUuid)
    // if (props.reportSection.definition.parentUuid == entityEntity.uuid) {
    //   const entity = e.data as MetaEntity;
    //   // sending ModelUpdates
    //   await domainController.handleDomainTransactionalInstanceAction(
    //     contextDeploymentUuid,
    //     {
    //       actionType: "DomainTransactionalInstanceAction",
    //       actionName: "modelActionUpdateEntity",
    //       update: {
    //         actionName:"WrappedTransactionalModelActionEntityUpdate",
    //         modelEntityUpdate:{
    //           actionType:"ModelActionEntityUpdate",
    //           actionName: "renameEntity",
    //           entityName: e.oldValue,
    //           entityUuid: entity.uuid,
    //           targetValue: e.newValue,
    //         },
    //       }
    //     },
    //     currentModel
    //   );
        
    // } else {
    //   log.info("onCellValueChanged on instance of entity",props.reportSection.definition.parentName, props.reportSection.definition.parentUuid,'updating object',e.data)
    //   // sending DataUpdates
    //   await domainController.handleAction(
    //     contextDeploymentUuid,
    //     {
    //       actionType: "DomainNonTransactionalInstanceAction",
    //       actionName: "update",
    //       objects: [
    //         {
    //           parentUuid: props.reportSection.definition.parentUuid,
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

  // ##############################################################################################
  // TODO: looks like prop drilling... pass onRowEdit directly?
  const onEditDialogFormSubmit: (data:JsonObjectEditFormDialogInputs)=>void = useCallback(async (data) => {
    log.info('onEditDialogFormSubmit called with data',data);
    
    if (props.type == 'EntityInstance' && props?.onRowEdit) {
      await props.onRowEdit(data);
    } else {
      log.error('onEditDialogFormSubmit called for not EntityInstance');
    }
    handleEditDialogFormClose('');
  },[props])

  // ##############################################################################################
  const onDeleteDialogFormSubmit: (data:JsonObjectEditFormDialogInputs)=>void = useCallback(async (data) => {
    log.info('onEditDialogFormSubmit called with data',data);
    
    if (props.type == 'EntityInstance' && props?.onRowDelete) {
      await props.onRowDelete(data);
    } else {
      log.error('onEditDialogFormSubmit called for not EntityInstance');
    }
    handleEditDialogFormClose('');
  },[props])

  // ##############################################################################################
  const handleEditDialogFormOpen = useCallback((a?:TableComponentRow,event?:any) => {
    event?.stopPropagation();
    log.info('handleEditDialogFormOpen called with props',props);
    log.info('handleEditDialogFormOpen called dialogFormObject',dialogFormObject, "event value", a);
    
    if (a) {
      setdialogFormObject(a.rawValue);
      setdialogOuterFormObject(a.rawValue)
      log.info('handleEditDialogFormOpen parameter is defined dialogFormObject',dialogFormObject);
    } else {
      setdialogFormObject(undefined);
      log.info('handleEditDialogFormOpen parameter is undefined, no value is passed to form. dialogFormObject',dialogFormObject);
    }
    setEditDialogFormIsOpen(true);
  },[props.instancesToDisplay]);

  // ##############################################################################################
  const handleEditDialogFormClose = useCallback((value?: string, event?:any) => {
    event?.stopPropagation();
    log.info('handleEditDialogFormClose',value);
    
    setEditDialogFormIsOpen(false);
  },[]);

  // ##############################################################################################
  const handleDeleteDialogFormOpen = useCallback((a?:TableComponentRow,event?:any) => {
    event?.stopPropagation();
    log.info('handleDeleteDialogFormOpen called with props',props);
    log.info('handleDeleteDialogFormOpen called dialogFormObject',dialogFormObject, "event value", a);
    
    if (a) {
      setdialogFormObject(a.rawValue);
      setdialogOuterFormObject(a.rawValue)
      log.info('handleDeleteDialogFormOpen parameter is defined dialogFormObject',dialogFormObject);
    } else {
      // setdialogFormObject(Object.assign({},dialogFormObject?dialogFormObject:{},{[label]:undefined}));
      setdialogFormObject(undefined);
      log.info('handleDeleteDialogFormOpen parameter is undefined, no value is passed to form. dialogFormObject',dialogFormObject);
    }
    setDeleteDialogFormIsOpen(true);
  },[props.instancesToDisplay]);
  
  // ##############################################################################################
  const defaultColDef:ColDef | ColGroupDef = useMemo(()=>({
    editable: true,
    sortable: true,
    filter: true,
    resizable: true,
    cellEditor: EntityEditor,
  }),[]);


  const columnDefs:(ColDef | ColGroupDef)[] = useMemo(()=>[
    {
      field: '',
      cellRenderer: ToolsCellRenderer,
      editable:false,
      width: 140,
      cellRendererParams: {
        onClickEdit:handleEditDialogFormOpen,
        onClickDelete:handleDeleteDialogFormOpen
      },
    }
  ].concat(props.columnDefs.columnDefs),[props.columnDefs]);
  
  // log.info(
  //   "MTableComponent started count",
  //   count++,
  //   "with props",
  //   props,
  //   props === prevProps,
  //   "columnDefs",
  //   columnDefs,
  //   "rowData changed:",
  //   props?.instancesToDisplay === prevProps?.instancesToDisplay
  // );
  prevProps = props;

  // ##############################################################################################
  const onCellClicked = useCallback((event:CellClickedEvent)=> {
    // event.stopPropagation();
    log.warn("onCellClicked event.colDef.field",event.colDef.field,"event",event,"props", props)
    if (props.type == "EntityInstance" && event.colDef.field && event.colDef.field != "tools") {
      // log.warn("onCellClicked props.currentMiroirEntityDefinition.jzodSchema",props.currentMiroirEntityDefinition.jzodSchema)
      const columnDefinitionAttributeEntry = Object.entries(
        props.currentEntityDefinition?.jzodSchema.definition ?? {}
      ).find((a: [string, any]) => a[0] == event.colDef.field);
      if (["name", "uuid"].includes(event.colDef.field)) {
        // display current Entity Details for Entity Instance
        navigate(
          `/report/${contextDeploymentUuid}/${
            ["MetaModel", "model"].includes(props.currentEntityDefinition.conceptLevel as any)? "model": context.applicationSection
          }/${props.currentEntityDefinition?.defaultInstanceDetailsReportUuid}/${event.data.rawValue.uuid}`
        );

      } else {
        if (
          columnDefinitionAttributeEntry &&
          (columnDefinitionAttributeEntry[1] as any).type == "simpleType" &&
          (columnDefinitionAttributeEntry[1] as any).extra?.targetEntity
        ) {
          const columnDefinitionAttribute = columnDefinitionAttributeEntry[1];
  
          const targetEntityDefinition: EntityDefinition | undefined = currentModel.entityDefinitions.find(
            (e) => e.entityUuid == event.colDef.cellRendererParams.entityUuid
          );
  
          navigate(
            `/report/${contextDeploymentUuid}/${
              (columnDefinitionAttribute as any)?.extra?.targetEntityApplicationSection
                ? (columnDefinitionAttribute as any)?.extra.targetEntityApplicationSection
                : context.applicationSection
            }/${targetEntityDefinition?.defaultInstanceDetailsReportUuid}/${event.data.rawValue[event.colDef.field]}`
          );
        } else {
          log.info(
            "onCellClicked cell is not an Entity Instance uuid, no navigation occurs.",
            columnDefinitionAttributeEntry
          );
        }
      }
    }
  },[props,])
  
  
  // function onCellDoubleClicked(e:CellDoubleClickedEvent) {
  //   log.warn("onCellDoubleClicked",e)
  // }
  
  // function onCellEditingStarted(e:CellEditingStartedEvent) {
  //   log.warn("onCellEditingStarted",e)
  // }
  
  // function onCellEditingStopped(e:CellEditingStoppedEvent) {
  //   log.warn("onCellEditingStarted",e)
  // }
  
  // function onRowDataUpdated(e:RowDataUpdatedEvent) {
  //   log.warn("onRowDataUpdated",e)
  // }
  
  // function onRowValueChanged(e:RowDataUpdatedEvent) {
  //   log.warn("onRowValueChanged",e)
  // }
  // const againRowData:any[] = Object.values(props.instancesToDisplay??{});

  // const domLayout = tableComponentRows.tableComponentRowUuidIndexSchema.length > 10?"normal":"autoHeight";
  return (
    <div>
      {/* <span>MtableComponent count {count}</span>
      <br /> */}
      {/* <span>{props.type}</span>
      <br /> */}
      {/* <span>rowData: {JSON.stringify(props.rowData.instancesWithStringifiedJsonAttributes)}</span> */}
      {props.type == "EntityInstance" ? (
        <div>
          {dialogFormObject ? (
            <>
              <JsonObjectEditFormDialog
                showButton={false}
                isOpen={editDialogFormIsOpen} // redundant with addObjectdialogFormIsOpen?
                isAttributes={true}
                addObjectdialogFormIsOpen={addObjectdialogFormIsOpen}
                setAddObjectdialogFormIsOpen={setAddObjectdialogFormIsOpen}
                label={props.currentEntity?.name ?? "No Entity Found!"}
                entityDefinitionJzodSchema={props.currentEntityDefinition?.jzodSchema as JzodObject}
                foreignKeyObjects={props.foreignKeyObjects}
                currentDeploymentUuid={contextDeploymentUuid}
                currentApplicationSection={context.applicationSection}
                currentAppModel={currentModel}
                currentMiroirModel={miroirMetaModel}
                defaultFormValuesObject={dialogFormObject ?? props.defaultFormValuesObject}
                onSubmit={onEditDialogFormSubmit}
                onClose={handleEditDialogFormClose}
              />
              <JsonObjectDeleteFormDialog
                showButton={false}
                currentDeploymentUuid={contextDeploymentUuid}
                currentApplicationSection={context.applicationSection}
                currentAppModel={currentModel}
                currentMiroirModel={miroirMetaModel}
                defaultFormValuesObject={dialogFormObject ?? props.defaultFormValuesObject}
                deleteObjectdialogFormIsOpen={deleteDialogFormIsOpen}
                entityDefinitionJzodSchema={props.currentEntityDefinition?.jzodSchema as JzodObject}
                foreignKeyObjects={props.foreignKeyObjects}
                isOpen={deleteDialogFormIsOpen} // redundant with deleteObjectdialogFormIsOpen?
                isAttributes={true}
                label={props.currentEntity?.name ?? "No Entity Found!"}
                onDeleteFormObject={onDeleteDialogFormSubmit}
                onClose={handleEditDialogFormClose}
                setDeleteObjectdialogFormIsOpen={setDeleteDialogFormIsOpen}
              />
            </>
          ) : (
            <></>
          )}
          {
            <div
              id="tata"
              className="ag-theme-alpine"
              style={
                tableComponentRows.tableComponentRowUuidIndexSchema.length > 50
                  ? { ...props.styles, height: "50vh" }
                  : props.styles
              }
            >
              <AgGridReact
                domLayout={tableComponentRows.tableComponentRowUuidIndexSchema.length > 50 ? "normal" : "autoHeight"}
                columnDefs={columnDefs}
                rowData={tableComponentRows.tableComponentRowUuidIndexSchema}
                // getRowId={(params) => {
                //   // log.info("MtableComponent getRowId", params);
                //   return params.data?.rawValue?.uuid ? params.data?.rawValue?.uuid : params.data?.rawValue?.id;
                // }}
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
          }
        </div>
      ) : (
        // <div className="ag-theme-alpine" style={{height: 200, width: 200}}>
        <div className="ag-theme-alpine">
          <div>Not EntityInstance</div>
          {/* MtableComponent {props.type} {JSON.stringify(props.columnDefs.columnDefs)} {JSON.stringify(props.rowData)} */}
          {/* <AgGridReact
            columnDefs={dummyColumnDefs}
            rowData={dummyRowData}
          ></AgGridReact> */}
          <AgGridReact
            domLayout="autoHeight"
            columnDefs={props.columnDefs.columnDefs}
            rowData={props.rowData}
            // rowData={props.rowData}
            // rowData={gridData}
            getRowId={(params: any) => {
              log.info("MtableComponent getRowId", params);
              return params?.data["uuid"]
                ? params?.data["uuid"]
                : params.data["id"]
                ? params.data["id"]
                : typeof params.data == "object"
                ? JSON.stringify(params.data)
                : params.data;
            }}
            defaultColDef={defaultColDef}
            onCellClicked={onCellClicked}
            // onCellValueChanged={onCellValueChanged}
            //
            // onCellEditingStarted={onCellEditingStarted}
            // onCellEditingStopped={onCellEditingStopped}
            // onRowDataUpdated={onRowDataUpdated}
            // onCellDoubleClicked={onCellDoubleClicked}
            // onRowValueChanged={onRowValueChanged}
          ></AgGridReact>
        </div>
      )}
    </div>
  );
}