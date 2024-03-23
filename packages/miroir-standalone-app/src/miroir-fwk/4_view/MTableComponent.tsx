import {
  CellClickedEvent,
  CellValueChangedEvent,
  ColDef,
  ColGroupDef
} from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SubmitHandler } from 'react-hook-form';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';


import { JzodObject } from '@miroir-framework/jzod-ts';
import {
  ApplicationDeploymentConfiguration, EntityDefinition, EntityInstance, JzodElement, JzodRecord, JzodSchema, LoggerInterface, MetaModel, MiroirLoggerFactory, applicationDeploymentMiroir, entityInstance, getLoggerName
} from "miroir-core";

import EntityEditor from '../../miroir-fwk/4_view/EntityEditor';
import {
  useErrorLogService,
  useMiroirContextService
} from '../../miroir-fwk/4_view/MiroirContextReactProvider';
import { ToolsCellRenderer } from './GenderCellRenderer';
import { JsonObjectFormEditorDialog, JsonObjectFormEditorDialogInputs } from './JsonObjectFormEditorDialog';
import { TableComponentProps, TableComponentRow, TableComponentTypeSchema } from './MTableComponentInterface';
import { useCurrentModel } from './ReduxHooks';
import { defaultFormValues } from './ReportSectionListDisplay';
import { packageName } from '../../constants';
import { cleanLevel } from './constants';

const loggerName: string = getLoggerName(packageName, cleanLevel,"MtableComponent");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});


const applicationDeploymentLibrary: ApplicationDeploymentConfiguration = {
  "uuid":"f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
  "parentName":"ApplicationDeploymentConfiguration",
  "parentUuid":"35c5608a-7678-4f07-a4ec-76fc5bc35424",
  "type":"singleNode",
  "name":"LibraryApplicationPostgresDeployment",
  "defaultLabel":"LibraryApplicationPostgresDeployment",
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
  log.info("MTableComponent refreshing with props",props);
  
  const navigate = useNavigate();
  const context = useMiroirContextService();
  const contextDeploymentUuid = context.deploymentUuid;
  // const errorLog = useErrorLogService();
  
  const [dialogFormObject, setdialogFormObject] = useState<undefined | any>(undefined);
  log.info("MTableComponent refreshing with dialogFormObject",dialogFormObject);
  const [dialogFormIsOpen, setdialogFormIsOpen] = useState(false);


  // const miroirMetaModel: MetaModel = useCurrentModel(applicationDeploymentMiroir.uuid);
  // const libraryAppModel: MetaModel = useCurrentModel(applicationDeploymentLibrary.uuid);
  
  // const currentModel = contextDeploymentUuid == applicationDeploymentLibrary.uuid? libraryAppModel:miroirMetaModel;
  const currentModel = useCurrentModel(contextDeploymentUuid);
  log.info("MTableComponent currentModel", currentModel);

  const tableComponentRows: { tableComponentRowUuidIndexSchema: TableComponentRow[] } = useMemo(
    // always use object, not array, to ensure correct refresh!
    () => ({
      tableComponentRowUuidIndexSchema: Object.values(props.instancesToDisplay ?? {}).map((i: EntityInstance) => ({
        rawValue: i,
        jzodSchema: props.type == TableComponentTypeSchema.enum.EntityInstance
          ? props.currentEntityDefinition.jzodSchema.definition
          : { },
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
    [props?.instancesToDisplay]
  );
  log.info("MTableComponent tableComponentRows", tableComponentRows);

  

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

  const onSubmitTableRowFormDialog: SubmitHandler<JsonObjectFormEditorDialogInputs> = useCallback(async (data,event) => {
    // event?.stopPropagation();
    log.info('MTableComponent onSubmitTableRowFormDialog called with data',data);
    
    if (props.type == 'EntityInstance' && props?.onRowEdit) {
      await props.onRowEdit(data);
    } else {
      log.error('MTableComponent onSubmitTableRowFormDialog called for not EntityInstance');
    }
    handleDialogTableRowFormClose('');
  },[props])

  const handleDialogTableRowFormOpen = useCallback((a?:TableComponentRow,event?:any) => {
    event?.stopPropagation();
    // const editedObject = props.instancesToDisplay?props.instancesToDisplay[a["uuid"]]:a;
    log.info('MTableComponent handleDialogTableRowFormOpen called with props',props);
    // log.info('MTableComponent handleDialogTableRowFormOpen called with props.instancesToDisplay',props.instancesToDisplay);
    // log.info("MTableComponent handleDialogTableRowFormOpen instancesWithStringifiedJsonAttributes", instancesWithStringifiedJsonAttributes);
    log.info('MTableComponent handleDialogTableRowFormOpen called dialogFormObject',dialogFormObject, "event value", a);
    
    if (a) {
      // setdialogFormObject(Object.assign({},dialogFormObject?dialogFormObject:{},{[label]:a}));
      setdialogFormObject(a.rawValue);
      // setdialogFormObject(a);
      log.info('MTableComponent handleDialogTableRowFormOpen parameter is defined dialogFormObject',dialogFormObject);
    } else {
      // setdialogFormObject(Object.assign({},dialogFormObject?dialogFormObject:{},{[label]:undefined}));
      setdialogFormObject(undefined);
      log.info('MTableComponent handleDialogTableRowFormOpen parameter is undefined, no value is passed to form. dialogFormObject',dialogFormObject);
    }
    setdialogFormIsOpen(true);
  },[props.instancesToDisplay]);

  const handleDialogTableRowFormClose = useCallback((value?: string, event?:any) => {
    event?.stopPropagation();
    log.info('ReportComponent handleDialogTableRowFormClose',value);
    
    setdialogFormIsOpen(false);
  },[]);

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
      width: 80,
      cellRendererParams: {
        onClick:handleDialogTableRowFormOpen
      },
    }
  ].concat(props.columnDefs.columnDefs),[props.columnDefs]);
  
  log.info(
    "MTableComponent started count",
    count++,
    "with props",
    props,
    props === prevProps,
    "columnDefs",
    columnDefs,
    "rowData changed:",
    props?.instancesToDisplay === prevProps?.instancesToDisplay
  );
  prevProps = props;

  const onCellClicked = useCallback((event:CellClickedEvent)=> {
    // event.stopPropagation();
    log.warn("onCellClicked event.colDef.field",event.colDef.field,"event",event,"props", props)
    if (props.type == "EntityInstance" && event.colDef.field && event.colDef.field != "tools") {
      // log.warn("onCellClicked props.currentMiroirEntityDefinition.jzodSchema",props.currentMiroirEntityDefinition.jzodSchema)
      const columnDefinitionAttributeEntry = Object.entries(
        props.currentEntityDefinition?.jzodSchema.definition ?? {}
      ).find((a: [string, any]) => a[0] == event.colDef.field);
      if (
        columnDefinitionAttributeEntry &&
        (columnDefinitionAttributeEntry[1] as any).type == "simpleType" &&
        (columnDefinitionAttributeEntry[1] as any).extra?.targetEntity
      ) {
        const columnDefinitionAttribute = columnDefinitionAttributeEntry[1];

        const targetEntityDefinition:EntityDefinition | undefined = currentModel.entityDefinitions.find((e)=> e.entityUuid == event.colDef.cellRendererParams.entityUuid);

        // const targetEntity = currentModel.entities.find(e=>e.uuid == columnDefinitionAttribute.extra?.targetEntity);
        navigate(
          `/report/${contextDeploymentUuid}/${
            (columnDefinitionAttribute as any)?.extra?.targetEntityApplicationSection
              ? (columnDefinitionAttribute as any)?.extra.targetEntityApplicationSection
              : context.applicationSection
          }/${targetEntityDefinition?.defaultInstanceDetailsReportUuid}/${event.data.rawValue[event.colDef.field]}`
          // `/instance/${contextDeploymentUuid}/${
          //   (columnDefinitionAttribute as any)?.extra?.targetEntityApplicationSection
          //     ? (columnDefinitionAttribute as any)?.extra.targetEntityApplicationSection
          //     : context.applicationSection
          // }/${(columnDefinitionAttribute as any)?.extra?.targetEntity}/${event.data[event.colDef.field]}`
        );
      } else {
        log.info(
          "onCellClicked cell is not an Entity Instance uuid, no navigation occurs.",
          columnDefinitionAttributeEntry
        );
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
            // label={props.defaultlabel??props.currentEntityDefinition?.name}
            label={props.currentEntity?.name??"No Entity Found!"}
            entityDefinitionJzodSchema={props.currentEntityDefinition?.jzodSchema as JzodObject}
            currentDeploymentUuid={contextDeploymentUuid}
            currentApplicationSection={context.applicationSection}
            initialValuesObject={
              dialogFormObject
                ? dialogFormObject
                : defaultFormValues(
                    props.type,
                    props.currentEntityDefinition?.jzodSchema as JzodObject,
                    [],
                    props.currentEntity,
                    props.displayedDeploymentDefinition
                  )
            }
            onSubmit={onSubmitTableRowFormDialog}
            onClose={handleDialogTableRowFormClose}
          />
          <div id="tata" className="ag-theme-alpine" style={props.styles}>
            {/* <div id="tata" className="ag-theme-alpine"> */}
            <AgGridReact
                columnDefs={columnDefs}
                // autoSizeStrategy={autoSizeStrategy}
                // rowData={instancesWithStringifiedJsonAttributes.instancesWithStringifiedJsonAttributes}
                rowData={tableComponentRows.tableComponentRowUuidIndexSchema}
                // rowData={gridData}
                getRowId={(params) => {
                  // log.info("MtableComponent getRowId", params);
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
      ) : (
        <div className="ag-theme-alpine" style={{height: 200, width: 200}}>
          {/* MtableComponent {props.type} {JSON.stringify(props.columnDefs.columnDefs)} {JSON.stringify(props.rowData)} */}
          {/* <AgGridReact
            columnDefs={dummyColumnDefs}
            rowData={dummyRowData}
          ></AgGridReact> */}
          <AgGridReact
            columnDefs={props.columnDefs.columnDefs}
            rowData={props.rowData}
            // rowData={props.rowData}
            // rowData={gridData}
            getRowId={(params:any) => {
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