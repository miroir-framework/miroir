import {
  Box,
  Card,
  CardContent,
  CardHeader,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
} from "@mui/material";
import {
  ConfigurationService,
  DomainControllerInterface,
  EntityDefinition,
  entityDefinitionEntityDefinition,
  entityModelVersion,
  entityReport,
  entityStoreBasedConfiguration,
  EntityInstance,
  instanceConfigurationReference,
  instanceModelVersionInitial,
  MiroirModelVersion,
  MiroirReport,
  reportConfigurationList,
  reportEntityList,
  reportModelVersionList,
  reportReportList,
  StoreBasedConfiguration,
  MiroirMetaModel,
} from "miroir-core";
import { useLocalCacheEntities, useLocalCacheModelVersion, useLocalCacheReports, useLocalCacheStoreBasedConfiguration, useLocalCacheTransactions } from "miroir-fwk/4_view/hooks";
import { useDomainControllerServiceHook, useErrorLogServiceHook } from "miroir-fwk/4_view/MiroirContextReactProvider";
import { ReduxStateChanges } from "miroir-redux";

import * as React from "react";
import { ReportComponent } from "./ReportComponent";

import entityAuthor from "assets/entities/Author.json";
import entityBook from "assets/entities/Book.json";
import author1 from "assets/instances/Author - Cornell Woolrich.json";
import author2 from "assets/instances/Author - Don Norman.json";
import author3 from "assets/instances/Author - Paul Veyne.json";
import book3 from "assets/instances/Book - Et dans l'éternité.json";
import book4 from "assets/instances/Book - Rear Window.json";
import book1 from "assets/instances/Book - The Bride Wore Black.json";
import book2 from "assets/instances/Book - The Design of Everyday Things.json";
import reportAuthorList from "assets/reports/AuthorList.json";
import reportBookList from "assets/reports/BookList.json";

export interface RootComponentProps {
  // store:any;
  reportName: string;
}

function defaultToEntityList(value: string, miroirReports: MiroirReport[]): string {
  return value ? (value as string) : miroirReports.find((r) => r.name == "EntityList") ? "EntityList" : undefined;
}

// ###################################################################################
async function uploadInitialMiroirConfiguration(domainController: DomainControllerInterface) {
  // USING DATA ACTIONS BECAUSE INITIAL, BOOTSTRAP ENTITIES CANNOT BE INSERTED TRANSACTIONALLY
  await domainController.handleDomainAction({
    actionName: "create",
    actionType: "DomainDataAction",
    objects: [
      {
        entityName: "Entity",
        entityUuid: entityDefinitionEntityDefinition.uuid,
        instances: [
          entityDefinitionEntityDefinition as EntityInstance, // has to come 1st!
          entityStoreBasedConfiguration as EntityInstance,
          entityReport as EntityInstance,
          entityModelVersion as EntityInstance,
        ],
      },
      {
        entityName: "Report",
        entityUuid: entityReport.uuid,
        instances: [
          reportEntityList as EntityInstance, 
          reportModelVersionList as EntityInstance, 
          reportReportList as EntityInstance,
          reportConfigurationList as EntityInstance
        ],
      },
      {
        entityName: "Configuration",
        entityUuid: entityStoreBasedConfiguration.uuid,
        instances: [
          instanceConfigurationReference, 
        ],
      },
      {
        entityName: "ModelVersion",
        entityUuid: entityModelVersion.uuid,
        instances: [
          instanceModelVersionInitial, 
        ],
      },
    ],
  });
}

// ###################################################################################
async function uploadBooksAndReports(
  domainController: DomainControllerInterface,
  currentModel?:MiroirMetaModel
) {
  await domainController.handleDomainAction({
    actionType: "DomainModelAction",
    actionName: "updateEntity",
    update: {
      updateActionName:"WrappedModelEntityUpdate",
      modelEntityUpdate: {
        updateActionType: "ModelEntityUpdate",
        updateActionName: "createEntity",
        entityName: entityDefinitionEntityDefinition.name,
        entityUuid: entityDefinitionEntityDefinition.uuid,
        instances: [
          entityAuthor as EntityInstance, 
          entityBook as EntityInstance
        ],
      },
    }
  },currentModel);
  await domainController.handleDomainAction({
    actionType: "DomainModelAction",
    actionName: "UpdateMetaModelInstance",
    update: {
      updateActionType: "ModelCUDUpdate",
      updateActionName: "create",
      objects: [{
        entityName: entityReport.name,
        entityUuid: entityReport.uuid,
        instances: [
          reportAuthorList as EntityInstance, reportBookList as EntityInstance
        ]
      }],
    }
  },currentModel);
  await domainController.handleDomainAction({ actionName: "commit", actionType: "DomainModelAction", label:"Adding Author and Book entities" },  currentModel);

  await domainController.handleDomainAction({
    actionType: "DomainDataAction",
    actionName: "create",
    objects: [
      {
        entityName: entityAuthor.name,
        entityUuid: entityAuthor.uuid,
        instances: [
          author1 as EntityInstance, 
          author2 as EntityInstance,
          author3 as EntityInstance
        ],
      },
      {
        entityName: entityBook.name,
        entityUuid: entityBook.uuid,
        instances: [book1 as EntityInstance, book2 as EntityInstance, book3 as EntityInstance, book4 as EntityInstance],
      },
    ],
  });
}

export const RootComponent = (props: RootComponentProps) => {
  // const errorLog: ErrorLogServiceInterface = ErrorLogServiceCreator();
  const miroirReports: MiroirReport[] = useLocalCacheReports();
  const miroirEntities: EntityDefinition[] = useLocalCacheEntities();
  const miroirModelVersions: MiroirModelVersion[] = useLocalCacheModelVersion();
  const storeBasedConfigurations: StoreBasedConfiguration[] = useLocalCacheStoreBasedConfiguration();
  const transactions: ReduxStateChanges[] = useLocalCacheTransactions();
  const errorLog = useErrorLogServiceHook();
  const domainController: DomainControllerInterface = useDomainControllerServiceHook();
  // const [displayedReportName, setDisplayedReportName] = React.useState('');
  const [displayedReportUuid, setDisplayedReportUuid] = React.useState("");

  const handleChange = (event: SelectChangeEvent) => {
    // setDisplayedReportName(event.target.value?event.target.value as string:(miroirReports.find((r)=>r.name=='EntityList')?'EntityList':undefined));
    setDisplayedReportUuid(defaultToEntityList(event.target.value, miroirReports));
  };

  console.log("RootComponent miroirReports", miroirReports);

  const currentModel =  {
    entities: miroirEntities,
    reports: miroirReports,
    configuration: storeBasedConfigurations,
    modelVersions: miroirModelVersions,
  };

  // const {store} = props;
  return (
    <div>
      <span>
        <button
          onClick={async () => {
            await domainController.handleDomainModelAction({
              actionName: "undo",
              actionType: "DomainModelAction",
            });
          }}
        >
          undo
        </button>
      </span>
      <span>
        <button
          onClick={async () => {
            await domainController.handleDomainModelAction({
              actionName: "redo",
              actionType: "DomainModelAction",
            });
          }}
        >
          Redo
        </button>
      </span>
      <span>
        <button
          onClick={async () => {
            await domainController.handleDomainModelAction(
              {
                actionName: "commit",
                actionType: "DomainModelAction",
              },
              currentModel
            );
          }}
        >
          Commit
        </button>
      </span>
      <span>
        <button
          onClick={async () => {
            await domainController.handleDomainModelAction({
              actionName: "replace",
              actionType: "DomainModelAction",
            });
          }}
        >
          Rollback
        </button>
      </span>
      <p />
      <span>
        <button
          onClick={async () => {
            await domainController.handleDomainAction({
              actionName: "resetModel",
              actionType: "DomainModelAction",
            });
          }}
        >
          Reset database
        </button>
      </span>
      <span>
        <button
          onClick={async () => {
            await domainController.handleDomainAction({
              actionName: "replace",
              actionType: "DomainModelAction",
            });
          }}
        >
          fetch Miroir & App configurations from database
        </button>
      </span>
      <p />
      <span>
        <button
          onClick={async () => {
            await uploadInitialMiroirConfiguration(domainController);
          }}
        >
          upload Miroir configuration to database
        </button>
      </span>
      {/* <p/> */}
      <span>
        <button
          onClick={async () => {
            await uploadBooksAndReports(domainController,currentModel);
          }}
        >
          upload App configuration to database
        </button>
      </span>
      <span>
        <button
          onClick={async () => {
            await domainController.handleDomainModelAction(
              {
                actionType: "DomainModelAction",
                actionName: "updateEntity",
                update: {
                  updateActionName:"WrappedModelEntityUpdate",
                  modelEntityUpdate:{
                    updateActionType:"ModelEntityUpdate",
                    updateActionName: "renameEntity",
                    entityName: entityBook.name,
                    entityUuid: entityBook.uuid,
                    targetValue: "Bookss",
                  },
                }
              },
              currentModel
            );
          }}
        >
          Modify Book entity name
        </button>
      </span>
      <span>
        <button
          onClick={async () => {
            await domainController.handleDomainModelAction(
              {
                actionType: "DomainModelAction",
                actionName: "UpdateMetaModelInstance",
                update: {
                  updateActionType: "ModelCUDUpdate",
                  updateActionName:'update',
                  objects: [
                    {
                      entityName: reportReportList.entityName,
                      entityUuid: reportReportList.entityUuid,
                      instances:[
                        Object.assign(
                          {},
                          reportReportList, 
                          {
                            name: "Report2List",
                            defaultLabel: "Modified List of Reports",
                          }
                        ) as EntityInstance
                      ]
                    }
                  ]
                }
              },
              currentModel
            );
          }}
        >
          Modify Report List name
        </button>
      </span>
      <span>
        <button
          onClick={async () => {
            await domainController.handleDomainModelAction(
              {
                actionType: "DomainModelAction",
                actionName: "updateEntity",
                update: {
                  updateActionName: "WrappedModelEntityUpdate",
                  modelEntityUpdate: {
                    updateActionType: "ModelEntityUpdate",
                    updateActionName: "DeleteEntity",
                    entityName: entityAuthor.entityName,
                    entityUuid: entityAuthor.entityUuid,
                    instanceUuid:entityAuthor.uuid,
                  },
                }
              },
              currentModel
            );
          }}
        >
          Remove Author entity
        </button>
      </span>
      <p />
      <p />
      <span>transactions: {JSON.stringify(transactions)}</span>
      <p />
      <span>cache size: {JSON.stringify(domainController.currentLocalCacheInfo())}</span>
      <p />
      <h3>
        {/* props: {JSON.stringify(props)} */}
        erreurs: {JSON.stringify(errorLog)}
      </h3>
      <span>packages: {JSON.stringify(ConfigurationService.packages)}</span>
      <p />
      <Box sx={{ minWidth: 50 }}>
        <FormControl fullWidth>
          <InputLabel id="demo-simple-select-label">Displayed Report</InputLabel>
          <Select
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            value={displayedReportUuid}
            label="displayedReportUuid"
            onChange={handleChange}
          >
            {miroirReports.map((r) => {
              return (
                <MenuItem key={r.name} value={r.uuid}>
                  {r.defaultLabel}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      </Box>
      <Card>
        <CardHeader>AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA</CardHeader>
        <CardContent>
          <ReportComponent
            reportUuid={displayedReportUuid}
          />
        </CardContent>
      </Card>
    </div>
  );
};
