import { useCallback } from 'react';
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

import { z } from "zod";

import {
  DomainControllerInterface,
  EntityDefinition,
  EntityDefinitionSchema,
  MetaEntity,
  MetaEntitySchema,
  MiroirApplicationVersion,
  MiroirMetaModel,
  Report,
  ReportDefinitionSchema,
  ReportSchema,
  StoreBasedConfiguration,
  entityEntity
} from "miroir-core";
import EntityEditor from 'miroir-fwk/4_view/EntityEditor';
import { useDomainControllerServiceHook, useErrorLogServiceHook, useMiroirContextDeploymentUuid } from 'miroir-fwk/4_view/MiroirContextReactProvider';
import {
  useLocalCacheModelVersion,
  useLocalCacheReports,
  useLocalCacheSectionEntities,
  useLocalCacheSectionEntityDefinitions,
  useLocalCacheStoreBasedConfiguration
} from "miroir-fwk/4_view/hooks";

export const TableComponentTypeSchema = z.enum([
  "EntityInstance",
  "JSON_ARRAY",
]);

export type TableComponentType = z.infer<typeof TableComponentTypeSchema>;

export const TableComponentEntityInstancePropsSchema = z.object({
  type: z.literal(TableComponentTypeSchema.enum.EntityInstance),
  currentMiroirEntity: MetaEntitySchema.optional(),
  currentMiroirEntityDefinition: EntityDefinitionSchema.optional(),
  columnDefs:z.array(z.any()),
  rowData: z.array(z.any()),
  reportDefinition: ReportSchema,
  children: z.any(),
  // side: z.literal(DeploymentSide.enum.client),
  // location: z.string(),
});
export type TableComponentEntityInstanceProps = z.infer<typeof TableComponentEntityInstancePropsSchema>;

export const TableComponentJsonArrayPropsSchema = z.object({
  type: z.literal(TableComponentTypeSchema.enum.JSON_ARRAY),
  currentMiroirEntity: MetaEntitySchema.optional(),
  currentMiroirEntityDefinition: EntityDefinitionSchema.optional(),
  columnDefs:z.array(z.any()),
  rowData: z.array(z.any()),
  reportDefinition: ReportSchema,
  children: z.any(),
  // side: z.literal(DeploymentSide.enum.client),
  // location: z.string(),
});
export type TableComponentJsonArrayProps = z.infer<typeof TableComponentJsonArrayPropsSchema>;

// ##########################################################################################
export const TableComponentPropsSchema = z.union([
  TableComponentEntityInstancePropsSchema,
  TableComponentJsonArrayPropsSchema,
]);

export type TableComponentProps = z.infer<typeof TableComponentPropsSchema>;


// export interface MTableComponentProps {
//   // columnDefs:{"headerName": string, "field": string}[];
//   type: TableComponentType,
//   currentMiroirEntity: MetaEntity | undefined;
//   currentMiroirEntityDefinition: EntityDefinition | undefined;
//   columnDefs:(ColDef<any> | ColGroupDef<any>)[];
//   rowData:any[];
//   reportDefinition: Report,
//   children:any;
// };

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

function onRowValueChanged(e:RowDataUpdatedEvent) {
  console.warn("onRowValueChanged",e)
}


export const MTableComponent = (props: TableComponentProps) => {
  const contextDeploymentUuid = useMiroirContextDeploymentUuid();
  const miroirReports: Report[] = useLocalCacheReports();
  const currentMiroirEntities:MetaEntity [] = useLocalCacheSectionEntities(contextDeploymentUuid,'model');
  const currentMiroirEntityDefinitions:EntityDefinition[] = useLocalCacheSectionEntityDefinitions(contextDeploymentUuid,'model');
  const miroirApplicationVersions: MiroirApplicationVersion[] = useLocalCacheModelVersion();
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
    entities: currentMiroirEntities,
    entityDefinitions: currentMiroirEntityDefinitions,
    reports: miroirReports,
    configuration: storeBasedConfigurations,
    applicationVersions: miroirApplicationVersions,
    applicationVersionCrossEntityDefinition: [],
  };

  console.log("MTableComponent miroirReports", currentModel);

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
        onRowValueChanged={onRowValueChanged}
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