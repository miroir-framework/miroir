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
  DeploymentEntityState,
  Domain2QueryReturnType,
  DomainElementSuccess,
  EntityDefinition,
  EntityInstance,
  EntityInstancesUuidIndex,
  JzodObject,
  LoggerInterface,
  MetaModel,
  MiroirLoggerFactory,
  SyncBoxedExtractorOrQueryRunnerMap,
  SyncQueryRunner,
  ViewParams,
  adminConfigurationDeploymentMiroir,
  defaultAdminViewParams,
  defaultViewParamsFromAdminStorageFetchQueryParams
} from "miroir-core";

import { packageName } from '../../../constants.js';
import EntityEditor from '../EntityEditor.js';
import {
  useMiroirContextInnerFormOutput,
  useMiroirContextService,
  // useViewParams
} from '../MiroirContextReactProvider.js';
import { useCurrentModel, useDeploymentEntityStateQuerySelectorForCleanedResult } from '../ReduxHooks.js';
import { cleanLevel } from '../constants.js';
import { calculateAdaptiveColumnWidths } from '../adaptiveColumnWidths.js';
import { ToolsCellRenderer } from './GenderCellRenderer.js';
import { GlideDataGridComponent } from './GlideDataGridComponent.js';
import { JsonObjectDeleteFormDialog } from './JsonObjectDeleteFormDialog.js';
import {
  JsonObjectEditFormDialog,
  JsonObjectEditFormDialogInputs,
} from "./JsonObjectEditFormDialog.js";
import {
  TableComponentProps,
  TableComponentRow,
  TableComponentTypeSchema,
} from "./MTableComponentInterface.js";
import { getMemoizedDeploymentEntityStateSelectorMap } from 'miroir-localcache-redux';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "MtableComponent")
).then((logger: LoggerInterface) => {log = logger});



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


    // const viewParams = useViewParams();
  const deploymentEntityStateSelectorMap: SyncBoxedExtractorOrQueryRunnerMap<DeploymentEntityState> =
  useMemo(() => getMemoizedDeploymentEntityStateSelectorMap(), []);
    
  const defaultViewParamsFromAdminStorageFetchQueryResults: Record<string, EntityInstancesUuidIndex> =
    useDeploymentEntityStateQuerySelectorForCleanedResult(
      deploymentEntityStateSelectorMap.runQuery as SyncQueryRunner<
        DeploymentEntityState,
        Domain2QueryReturnType<DomainElementSuccess>
      >,
      defaultViewParamsFromAdminStorageFetchQueryParams(deploymentEntityStateSelectorMap)
    );
  
  const viewParams: ViewParams | undefined = defaultViewParamsFromAdminStorageFetchQueryResults?.[
    "viewParams"
  ] as any;

  log.info("MTableComponent viewParams", viewParams, "defaultViewParamsFromAdminStorageFetchQueryResults", defaultViewParamsFromAdminStorageFetchQueryResults);
  const gridType = viewParams?.gridType || 'ag-grid';



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
          deploymentUuid: contextDeploymentUuid,
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
    // event?.stopPropagation();
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
    // event?.stopPropagation();
    log.info('handleEditDialogFormClose',value);
    
    setEditDialogFormIsOpen(false);
  },[]);

  // ##############################################################################################
  const handleDeleteDialogFormOpen = useCallback((a?:TableComponentRow,event?:any) => {
    // event?.stopPropagation();
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
  const handleDuplicateDialogFormOpen = useCallback((a?:TableComponentRow,event?:any) => {
    // event?.stopPropagation();
    log.info('handleDuplicateDialogFormOpen called with props',props);
    log.info('handleDuplicateDialogFormOpen called dialogFormObject',dialogFormObject, "event value", a);
    
    if (a) {
      // Create a duplicate with a new random UUID
      const duplicatedObject = {
        ...a.rawValue,
        uuid: crypto.randomUUID()
      };
      setdialogFormObject(duplicatedObject);
      setdialogOuterFormObject(duplicatedObject);
      log.info('handleDuplicateDialogFormOpen parameter is defined, created duplicate with new UUID',duplicatedObject);
    } else {
      setdialogFormObject(undefined);
      log.info('handleDuplicateDialogFormOpen parameter is undefined, no value is passed to form. dialogFormObject',dialogFormObject);
    }
    setEditDialogFormIsOpen(true);
  },[props.instancesToDisplay]);
  
  // ##############################################################################################
  const defaultColDef:ColDef | ColGroupDef = useMemo(()=>({
    editable: true,
    sortable: true,
    filter: true,
    resizable: true,
    cellEditor: EntityEditor,
  }),[]);


  const columnDefs:(ColDef | ColGroupDef)[] = useMemo(()=>{
    // Start with the base column definitions
    const baseColumnDefs = [
      {
        field: '',
        cellRenderer: ToolsCellRenderer,
        editable:false,
        width: 180,
        cellRendererParams: {
          onClickEdit:handleEditDialogFormOpen,
          onClickDuplicate:handleDuplicateDialogFormOpen,
          onClickDelete:handleDeleteDialogFormOpen
        },
      }
    ].concat(props.columnDefs.columnDefs);

    // Apply adaptive widths if we have row data
    if (tableComponentRows.tableComponentRowUuidIndexSchema.length > 0) {
      const availableWidth = 1200; // Could be made dynamic based on container width
      const jzodSchema = props.type === TableComponentTypeSchema.enum.EntityInstance && 
        (props as any).currentEntityDefinition?.jzodSchema?.definition ? 
        (props as any).currentEntityDefinition.jzodSchema.definition : undefined;

      const widthSpecs = calculateAdaptiveColumnWidths(
        props.columnDefs.columnDefs, // Pass the original column defs without tools column
        tableComponentRows.tableComponentRowUuidIndexSchema,
        availableWidth,
        jzodSchema
      );

      // Apply calculated widths to the base column definitions
      baseColumnDefs.forEach((colDef: any, index) => {
        if (index === 0) {
          // Tools column - use the calculated tools width
          const toolsSpec = widthSpecs.find(spec => spec.type === 'tools');
          if (toolsSpec) {
            colDef.width = Math.round(toolsSpec.calculatedWidth);
          }
        } else {
          // Data columns - find matching width spec
          const widthSpec = widthSpecs.find(spec => spec.field === colDef.field);
          if (widthSpec) {
            colDef.width = Math.round(widthSpec.calculatedWidth);
            colDef.minWidth = Math.round(widthSpec.minWidth);
            colDef.maxWidth = Math.round(widthSpec.maxWidth);
          }
        }
      });
    }

    return baseColumnDefs;
  },[props.columnDefs, handleEditDialogFormOpen, handleDuplicateDialogFormOpen, handleDeleteDialogFormOpen, tableComponentRows, props.type, (props as any).currentEntityDefinition]);
  
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
  // ##############################################################################################
  const onGlideGridCellClicked = useCallback(
    (cell: any, event: any) => {
      const [col, row] = cell;
      const rowData = tableComponentRows.tableComponentRowUuidIndexSchema[row];
      
      // Get the field name from the Glide grid column structure
      // Note: In GlideDataGridComponent, columns[0] is tools, columns[1+] are data columns
      let fieldName: string | undefined;
      if (col === 0) {
        fieldName = "tools";
      } else {
        // Find the data column by index (col - 1 because tools is at index 0)
        const dataColumnIndex = col - 1;
        const dataColumns = props.columnDefs.columnDefs.filter((cd: any) => cd.field && cd.field !== 'tools');
        if (dataColumnIndex >= 0 && dataColumnIndex < dataColumns.length) {
          fieldName = dataColumns[dataColumnIndex].field;
        }
      }
      
      // Early return for non-navigable clicks
      if (
        props.type !== "EntityInstance" ||
        !fieldName ||
        fieldName === "tools"
      ) {
        return;
      }

      log.warn("onGlideGridCellClicked fieldName", fieldName, "cell", cell, "event", event, "props", props);

      // Use setTimeout to defer navigation and prevent blocking the UI thread
      setTimeout(() => {
        if (["name", "uuid"].includes(fieldName)) {
          // display current Entity Details for Entity Instance
          const applicationSection = ["MetaModel", "model"].includes(
            props.currentEntityDefinition.conceptLevel as any
          )
            ? "model"
            : context.applicationSection;

          navigate(
            `/report/${contextDeploymentUuid}/${applicationSection}/${props.currentEntityDefinition?.defaultInstanceDetailsReportUuid}/${rowData.rawValue.uuid}`
          );
        } else {
          // Cache schema definition lookup
          const schemaDefinition = props.currentEntityDefinition?.jzodSchema.definition ?? {};
          const columnDefinitionAttribute = schemaDefinition[fieldName];

          if (
            columnDefinitionAttribute &&
            (columnDefinitionAttribute as any).type === "uuid" &&
            (columnDefinitionAttribute as any).tag?.value?.targetEntity
          ) {
            // Find the column definition to get the target entity UUID
            const columnDef = props.columnDefs.columnDefs.find((cd: any) => cd.field === fieldName);
            const targetEntityUuid = columnDef?.cellRendererParams?.entityUuid;
            
            const targetEntityDefinition: EntityDefinition | undefined =
              currentModel.entityDefinitions.find(
                (e) => e.entityUuid === targetEntityUuid
              );

            const targetApplicationSection =
              (columnDefinitionAttribute as any)?.tag?.value?.targetEntityApplicationSection ||
              context.applicationSection;

            navigate(
              `/report/${contextDeploymentUuid}/${targetApplicationSection}/${targetEntityDefinition?.defaultInstanceDetailsReportUuid}/${(rowData.rawValue as any)[fieldName]}`
            );
          } else {
            log.info(
              "onGlideGridCellClicked cell is not an Entity Instance uuid, no navigation occurs.",
              columnDefinitionAttribute
            );
          }
        }
      }, 0);
    },
    [
      props.type,
      (props as any).currentEntityDefinition,
      contextDeploymentUuid,
      context.applicationSection,
      currentModel.entityDefinitions,
      navigate,
      columnDefs,
      tableComponentRows,
      props.columnDefs,
    ]
  );

  const onCellClicked = useCallback(
    (event: CellClickedEvent) => {
      // Early return for non-navigable clicks
      if (
        props.type !== "EntityInstance" ||
        !event.colDef.field ||
        event.colDef.field === "tools"
      ) {
        return;
      }

      const fieldName = event.colDef.field;
      log.warn("onCellClicked event.colDef.field", fieldName, "event", event, "props", props);

      // Use setTimeout to defer navigation and prevent blocking the UI thread
      setTimeout(() => {
        if (["name", "uuid"].includes(fieldName)) {
          // display current Entity Details for Entity Instance
          const applicationSection = ["MetaModel", "model"].includes(
            props.currentEntityDefinition.conceptLevel as any
          )
            ? "model"
            : context.applicationSection;

          navigate(
            `/report/${contextDeploymentUuid}/${applicationSection}/${props.currentEntityDefinition?.defaultInstanceDetailsReportUuid}/${event.data.rawValue.uuid}`
          );
        } else {
          // Cache schema definition lookup
          const schemaDefinition = props.currentEntityDefinition?.jzodSchema.definition ?? {};
          const columnDefinitionAttribute = schemaDefinition[fieldName];

          if (
            columnDefinitionAttribute &&
            (columnDefinitionAttribute as any).type === "uuid" &&
            (columnDefinitionAttribute as any).tag?.value?.targetEntity
          ) {
            const targetEntityDefinition: EntityDefinition | undefined =
              currentModel.entityDefinitions.find(
                (e) => e.entityUuid === event.colDef.cellRendererParams.entityUuid
              );

            const targetApplicationSection =
              (columnDefinitionAttribute as any)?.tag?.value?.targetEntityApplicationSection ||
              context.applicationSection;

            navigate(
              `/report/${contextDeploymentUuid}/${targetApplicationSection}/${targetEntityDefinition?.defaultInstanceDetailsReportUuid}/${event.data.rawValue[fieldName]}`
            );
          } else {
            log.info(
              "onCellClicked cell is not an Entity Instance uuid, no navigation occurs.",
              columnDefinitionAttribute
            );
          }
        }
      }, 0);
    },
    [
      props.type,
      (props as any).currentEntityDefinition,
      contextDeploymentUuid,
      context.applicationSection,
      currentModel.entityDefinitions,
      navigate,
    ]
  );
  
  
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
            gridType === 'ag-grid' ? (
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
            ) : (
              <GlideDataGridComponent
                tableComponentRows={tableComponentRows}
                props={props}
                onCellClicked={onGlideGridCellClicked}
                onCellEdited={(cell, newValue) => {
                  // Handle cell edit for Glide Data Grid
                  log.info("Glide cell edited", cell, newValue);
                  // You might want to implement similar logic to onCellValueChanged
                }}
                onRowEdit={handleEditDialogFormOpen}
                onRowDelete={handleDeleteDialogFormOpen}
                onRowDuplicate={handleDuplicateDialogFormOpen}
              />
            )
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