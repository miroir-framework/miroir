import {
  CellClickedEvent,
  CellValueChangedEvent
} from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SubmitHandler } from 'react-hook-form';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';


import { JzodObject } from '@miroir-framework/jzod-ts';
import {
  ApplicationDeploymentConfiguration, LoggerInterface, MiroirLoggerFactory, getLoggerName
} from "miroir-core";

import EntityEditor from '../../miroir-fwk/4_view/EntityEditor';
import {
  useErrorLogService,
  useMiroirContextService
} from '../../miroir-fwk/4_view/MiroirContextReactProvider';
import { ToolsCellRenderer } from './GenderCellRenderer';
import { JsonObjectFormEditorDialog, JsonObjectFormEditorDialogInputs } from './JsonObjectFormEditorDialog';
import { TableComponentProps, TableComponentTypeSchema } from './MTableComponentInterface';
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
// ################################################################################################
export const MTableComponent = (props: TableComponentProps) => {
  log.info("MTableComponent",props);
  

  // const [gridData,setGridData] = useState(props.rowData.instancesWithStringifiedJsonAttributes);
  const navigate = useNavigate();
  const context = useMiroirContextService();
  const contextDeploymentUuid = context.deploymentUuid;
  const errorLog = useErrorLogService();
  // log.info('MTableComponent 5');
  // const domainController: DomainControllerInterface = useDomainControllerService();
  // log.info('MTableComponent 6');

  const [dialogFormObject, setdialogFormObject] = useState<undefined | any>(undefined);
  // log.info('MTableComponent 7');
  const [dialogFormIsOpen, setdialogFormIsOpen] = useState(false);
  // log.info('MTableComponent 8');

  const instancesWithStringifiedJsonAttributes: { instancesWithStringifiedJsonAttributes: any[] } = useMemo(
    () => ({
      instancesWithStringifiedJsonAttributes: Object.values(props.instancesToDisplay?props.instancesToDisplay:{}).map((i) =>
        Object.fromEntries(
          Object.entries(i).map((e) => {
            const currentAttributeDefinition = props.type == TableComponentTypeSchema.enum.EntityInstance?Object.entries(
              props.currentEntityDefinition?.jzodSchema.definition??{}
            ).find((a) => a[0] == e[0]):undefined;
            return [
              e[0],
              Array.isArray(currentAttributeDefinition) && currentAttributeDefinition.length > 1 && (currentAttributeDefinition[1] as any).type == "object"
                ? JSON.stringify(e[1])
                : e[1],
            ];
          })
        )
      ),
    }),
    [props?.instancesToDisplay]
  );
  log.info("MTableComponent instancesWithStringifiedJsonAttributes", instancesWithStringifiedJsonAttributes);

  
  const currentModel = useCurrentModel(applicationDeploymentLibrary.uuid);
  log.info("MTableComponent currentModel", currentModel);

  const onCellValueChanged = useCallback(async (event:CellValueChangedEvent) => {
    // event?.stopPropagation();
    log.warn("onCellValueChanged",event, 'contextDeploymentUuid',contextDeploymentUuid)
    // if (props.reportSection.definition.parentUuid == entityEntity.uuid) {
    //   const entity = e.data as MetaEntity;
    //   // sending ModelUpdates
    //   await domainController.handleDomainTransactionalAction(
    //     contextDeploymentUuid,
    //     {
    //       actionType: "DomainTransactionalAction",
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
    //   await domainController.handleDomainAction(
    //     contextDeploymentUuid,
    //     {
    //       actionType: "DomainDataNonTransactionalCUDAction",
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

  const handleDialogTableRowFormOpen = useCallback((a?:any,event?:any) => {
    event?.stopPropagation();
    log.info('MTableComponent handleDialogTableRowFormOpen called dialogFormObject',dialogFormObject, 'passed value',a);
    
    if (a) {
      // setdialogFormObject(Object.assign({},dialogFormObject?dialogFormObject:{},{[label]:a}));
      setdialogFormObject(props.instancesToDisplay?props.instancesToDisplay[a["uuid"]]:{});
      log.info('ReportComponent handleDialogTableRowFormOpen parameter is defined dialogFormObject',dialogFormObject);
    } else {
      // setdialogFormObject(Object.assign({},dialogFormObject?dialogFormObject:{},{[label]:undefined}));
      setdialogFormObject(undefined);
      log.info('ReportComponent handleDialogTableRowFormOpen parameter is undefined, no value is passed to form. dialogFormObject',dialogFormObject);
    }
    setdialogFormIsOpen(true);
  },[]);

  const handleDialogTableRowFormClose = useCallback((value?: string, event?:any) => {
    event?.stopPropagation();
    log.info('ReportComponent handleDialogTableRowFormClose',value);
    
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
    log.warn("onCellClicked",event,event.colDef.field)
    if (props.type == 'EntityInstance' && event.colDef.field && event.colDef.field != 'tools') {
      // log.warn("onCellClicked props.currentMiroirEntityDefinition.jzodSchema",props.currentMiroirEntityDefinition.jzodSchema)
      const columnDefinitionAttributeEntry = Object.entries(props.currentEntityDefinition?.jzodSchema.definition??{}).find((a:[string,any])=>a[0] == event.colDef.field);
      if (columnDefinitionAttributeEntry && (columnDefinitionAttributeEntry[1] as any).type == "simpleType" && (columnDefinitionAttributeEntry[1] as any).extra?.targetEntity) {
        const columnDefinitionAttribute = columnDefinitionAttributeEntry[1];
        // const targetEntity = currentModel.entities.find(e=>e.uuid == columnDefinitionAttribute.extra?.targetEntity);
        navigate(
          `/instance/${contextDeploymentUuid}/${
            (columnDefinitionAttribute as any)?.extra?.targetEntityApplicationSection
              ? (columnDefinitionAttribute as any)?.extra.targetEntityApplicationSection
              : context.applicationSection
          }/${(columnDefinitionAttribute as any)?.extra?.targetEntity}/${event.data[event.colDef.field]}`
        );
      } else {
        log.info('onCellClicked cell is not an Entity Instance uuid, no navigation occurs.',columnDefinitionAttributeEntry);
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
    const [dummyRowData] = useState([
      {make: "Toyota", model: "Celica", price: 35000},
      {make: "Ford", model: "Mondeo", price: 32000},
      {make: "Porsche", model: "Boxster", price: 72000}
  ]);

  const [dummyColumnDefs] = useState([
      { field: 'make' },
      { field: 'model' },
      { field: 'price' }
  ]);

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
            label={"TOTO"}
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
                rowData={instancesWithStringifiedJsonAttributes.instancesWithStringifiedJsonAttributes}
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