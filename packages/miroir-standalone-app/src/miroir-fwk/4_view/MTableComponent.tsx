import { 
  CellClickedEvent, 
  CellDoubleClickedEvent, 
  CellEditingStartedEvent, 
  CellEditingStoppedEvent, 
  CellValueChangedEvent, 
  ColDef, 
  ColGroupDef, 
  RowDataUpdatedEvent 
} from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

import SimpleEditor from './SimpleEditor';
import EntityEditor from 'miroir-fwk/4_view/EntityEditor';
import { useCallback, useState } from 'react';
import { DomainControllerInterface, EntityDefinition, MetaEntity, MiroirMetaModel, MiroirModelVersion, MiroirReport, StoreBasedConfiguration, entityEntity } from 'miroir-core';
import { useLocalCacheEntities, useLocalCacheEntityDefinitions, useLocalCacheModelVersion, useLocalCacheReports, useLocalCacheStoreBasedConfiguration, useLocalCacheTransactions } from 'miroir-fwk/4_view/hooks';
import { useDomainControllerServiceHook, useErrorLogServiceHook } from 'miroir-fwk/4_view/MiroirContextReactProvider';

export interface MTableComponentProps {
  // columnDefs:{"headerName": string, "field": string}[];
  columnDefs:(ColDef<any> | ColGroupDef<any>)[];
  rowData:any[];
  reportDefinition: MiroirReport,
  children:any;
};

function onCellClicked(e:CellClickedEvent) {
  console.warn("onCellClicked",e)
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


export const MTableComponent = (props: MTableComponentProps) => {
  const miroirReports: MiroirReport[] = useLocalCacheReports();
  const miroirEntities: MetaEntity[] = useLocalCacheEntities();
  const miroirEntityDefinitions: EntityDefinition[] = useLocalCacheEntityDefinitions();
  const miroirModelVersions: MiroirModelVersion[] = useLocalCacheModelVersion();
  const storeBasedConfigurations: StoreBasedConfiguration[] = useLocalCacheStoreBasedConfiguration();
  // const transactions: ReduxStateChanges[] = useLocalCacheTransactions();
  const errorLog = useErrorLogServiceHook();
  const domainController: DomainControllerInterface = useDomainControllerServiceHook();
  // const [displayedReportName, setDisplayedReportName] = React.useState('');
  // const [displayedReportUuid, setDisplayedReportUuid] = useState("");

  // const handleChange = (event: SelectChangeEvent) => {
  //   // setDisplayedReportName(event.target.value?event.target.value as string:(miroirReports.find((r)=>r.name=='EntityList')?'EntityList':undefined));
  //   setDisplayedReportUuid(defaultToEntityList(event.target.value, miroirReports));
  // };


  const currentModel: MiroirMetaModel =  {
    entities: miroirEntities,
    entityDefinitions: miroirEntityDefinitions,
    reports: miroirReports,
    configuration: storeBasedConfigurations,
    modelVersions: miroirModelVersions,
  };

  console.log("MTableComponent miroirReports", currentModel);

  const onCellValueChanged = useCallback(async (e:CellValueChangedEvent) => {
    console.warn("onCellValueChanged",e)
    if (props.reportDefinition.definition.parentUuid == entityEntity.uuid) {
      const entity = e.data as MetaEntity;
      // sending ModelUpdates
      await domainController.handleDomainModelAction(
        {
          actionType: "DomainModelAction",
          actionName: "updateEntity",
          update: {
            updateActionName:"WrappedModelEntityUpdate",
            modelEntityUpdate:{
              updateActionType:"ModelEntityUpdate",
              updateActionName: "renameEntity",
              entityName: e.oldValue,
              entityUuid: entity.uuid,
              targetValue: e.newValue,
            },
          }
        },
        currentModel
      );
        
    } else {
      console.log("onCellValueChanged on instance of entity",props.reportDefinition.definition.parentName, props.reportDefinition.definition.parentUuid,'updating object',e.data)
      // sending DataUpdates
      await domainController.handleDomainAction(
        {
          actionType: "DomainDataAction",
          actionName: "update",
          objects: [
            {
              parentUuid: props.reportDefinition.definition.parentUuid,
              instances:[
                // Object.assign({},e.data,{[e.column.getColId()]:e.data.value})
                e.data
              ]
            }
          ]
        },
        currentModel
      );
    }
  },[props,currentModel,])

  return (
    <div
      id="tata"
      className="ag-theme-alpine"
      style={
        {
          height: '500px',
          width: 'auto'
        }
      }
    >
      {/* {props.children} */}
      <AgGridReact
        columnDefs={props.columnDefs}
        rowData={props.rowData}
        onCellClicked={onCellClicked}
        onCellEditingStarted={onCellEditingStarted}
        onCellEditingStopped={onCellEditingStopped}
        onCellValueChanged={onCellValueChanged}
        onRowDataUpdated={onRowDataUpdated}
        onCellDoubleClicked={onCellDoubleClicked}
        getRowId={params=>params.data.uuid}
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
  );
}