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
  entityApplication,
  entityApplicationDeployment,
  entityApplicationModelBranch,
  entityApplicationVersion,
  EntityDefinition,
  EntityInstance,
  entityReport,
  MetaEntity,
  MiroirMetaModel,
  MiroirApplicationVersion,
  MiroirReport,
  reportReportList,
  StoreBasedConfiguration
} from "miroir-core";
import {
  useLocalCacheEntities,
  useLocalCacheEntityDefinitions,
  useLocalCacheModelVersion,
  useLocalCacheReports,
  useLocalCacheStoreBasedConfiguration,
  useLocalCacheTransactions,
} from "miroir-fwk/4_view/hooks";
import { useDomainControllerServiceHook, useErrorLogServiceHook } from "miroir-fwk/4_view/MiroirContextReactProvider";
import { ReduxStateChanges } from "miroir-redux";

import * as React from "react";
import { ReportComponent } from "./ReportComponent";

// import entityApplication from '../assets/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/a659d350-dd97-4da9-91de-524fa01745dc.json';
// import entityApplicationDeployment from '../assets/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/35c5608a-7678-4f07-a4ec-76fc5bc35424.json';
// import entityApplicationVersion from '../assets/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24.json';
// import entityApplicationModelBranch from '../assets/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/cdb0aec6-b848-43ac-a058-fe2dbe5811f1.json';


import entityPublisher from "assets/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/a027c379-8468-43a5-ba4d-bf618be25cab.json";
import entityAuthor from "assets/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/d7a144ff-d1b9-4135-800c-a7cfc1f38733.json";
import entityBook from "assets/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/e8ba151b-d68e-4cc3-9a83-3459d309ccf5.json";
import applicationDeploymentLibraryDeployment from "assets/35c5608a-7678-4f07-a4ec-76fc5bc35424/ab4c13c3-f476-407c-a30c-7cb62275a352.json";
import reportAuthorList from "assets/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/66a09068-52c3-48bc-b8dd-76575bbc8e72.json";
import reportBookList from "assets/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/74b010b6-afee-44e7-8590-5f0849e4a5c9.json";
import reportPublisherList from "assets/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/a77aa662-006d-46cd-9176-01f02a1a12dc.json";
import entityDefinitionBook from "assets/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/797dd185-0155-43fd-b23f-f6d0af8cae06.json";
import entityDefinitionPubliser from "assets/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/7a939fe8-d119-4e7f-ab94-95b2aae30db9.json";
import entityDefinitionAuthor from "assets/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/b30b7180-f7dc-4cca-b4e8-e476b77fe61d.json";
import applicationLibrary from "assets/a659d350-dd97-4da9-91de-524fa01745dc/5af03c98-fe5e-490b-b08f-e1230971c57f.json";
import applicationVersionLibraryInitialVersion from "assets/c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24/695826c2-aefa-4f5f-a131-dee46fe21c1.json";
import applicationModelBranchLibraryMasterBranch from "assets/cdb0aec6-b848-43ac-a058-fe2dbe5811f1/ad1ddc4e-556e-4598-9cff-706a2bde0be7.json";
import author4 from "assets/instances/Author - Catherine Guérard.json";
import author1 from "assets/instances/Author - Cornell Woolrich.json";
import author2 from "assets/instances/Author - Don Norman.json";
import author3 from "assets/instances/Author - Paul Veyne.json";
import book3 from "assets/instances/Book - Et dans l'éternité.json";
import book4 from "assets/instances/Book - Rear Window.json";
import book5 from "assets/instances/Book - Renata n'importe quoi.json";
import book1 from "assets/instances/Book - The Bride Wore Black.json";
import book2 from "assets/instances/Book - The Design of Everyday Things.json";
import folio from "assets/instances/Publisher - Folio.json";
import penguin from "assets/instances/Publisher - Penguin.json";
import springer from "assets/instances/Publisher - Springer.json";

export interface RootComponentProps {
  // store:any;
  reportName: string;
}

function defaultToEntityList(value: string, miroirReports: MiroirReport[]): string {
  return value ? (value as string) : miroirReports.find((r) => r.name == "EntityList") ? "EntityList" : undefined;
}

// ###################################################################################
async function uploadBooksAndReports(
  domainController: DomainControllerInterface,
  currentModel?:MiroirMetaModel
) {

  await domainController.handleDomainAction({
    actionType: "DomainModelAction",
    actionName: "UpdateMetaModelInstance",
    update: {
      updateActionType: "ModelCUDInstanceUpdate",
      updateActionName: "create",
      objects: [
        {
          parentName: entityApplication.name,
          parentUuid: entityApplication.uuid,
          instances: [
            applicationLibrary as EntityInstance
          ]
        },
        {
          parentName: entityApplicationDeployment.name,
          parentUuid: entityApplicationDeployment.uuid,
          instances: [
            applicationDeploymentLibraryDeployment as EntityInstance
          ]
        },
        {
          parentName: entityApplicationVersion.name,
          parentUuid: entityApplicationVersion.uuid,
          instances: [
            applicationVersionLibraryInitialVersion as EntityInstance
          ]
        },
        {
          parentName: entityApplicationModelBranch.name,
          parentUuid: entityApplicationModelBranch.uuid,
          instances: [
            applicationModelBranchLibraryMasterBranch as EntityInstance
          ]
        },
        // {
        //   parentName: entityReport.name,
        //   parentUuid: entityReport.uuid,
        //   instances: [
        //     reportAuthorList as EntityInstance, reportBookList as EntityInstance, reportPublisherList as EntityInstance
        //   ]
        // },
      ],
    }
  },currentModel);


  await domainController.handleDomainAction({
    actionType: "DomainModelAction",
    actionName: "updateEntity",
    update: {
      updateActionName:"WrappedModelEntityUpdate",
      modelEntityUpdate: {
        updateActionType: "ModelEntityUpdate",
        updateActionName: "createEntity",
        entities: [
          {entity:entityAuthor as MetaEntity, entityDefinition:entityDefinitionAuthor as EntityDefinition},
          {entity:entityBook as MetaEntity, entityDefinition:entityDefinitionBook as EntityDefinition},
          {entity:entityPublisher as MetaEntity, entityDefinition:entityDefinitionPubliser as EntityDefinition},
        ],
      },
    }
  },currentModel);
  await domainController.handleDomainAction({
    actionType: "DomainModelAction",
    actionName: "UpdateMetaModelInstance",
    update: {
      updateActionType: "ModelCUDInstanceUpdate",
      updateActionName: "create",
      objects: [{
        parentName: entityReport.name,
        parentUuid: entityReport.uuid,
        instances: [
          reportAuthorList as EntityInstance, reportBookList as EntityInstance, reportPublisherList as EntityInstance
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
        parentName: entityPublisher.name,
        parentUuid: entityPublisher.uuid,
        instances: [folio as EntityInstance, penguin as EntityInstance, springer as EntityInstance],
      },
      {
        parentName: entityAuthor.name,
        parentUuid: entityAuthor.uuid,
        instances: [
          author1 as EntityInstance, 
          author2 as EntityInstance,
          author3 as EntityInstance,
          author4 as EntityInstance,
        ],
      },
      {
        parentName: entityBook.name,
        parentUuid: entityBook.uuid,
        instances: [
          book1 as EntityInstance, 
          book2 as EntityInstance, 
          book3 as EntityInstance, 
          book4 as EntityInstance,
          book5 as EntityInstance,
        ],
      },
    ],
  });
}

export const RootComponent = (props: RootComponentProps) => {
  // const errorLog: ErrorLogServiceInterface = ErrorLogServiceCreator();
  const miroirReports: MiroirReport[] = useLocalCacheReports();
  const miroirEntities: MetaEntity[] = useLocalCacheEntities();
  const miroirEntityDefinitions: EntityDefinition[] = useLocalCacheEntityDefinitions();
  const miroirModelVersions: MiroirApplicationVersion[] = useLocalCacheModelVersion();
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

  const currentModel: MiroirMetaModel =  {
    entities: miroirEntities,
    entityDefinitions: miroirEntityDefinitions,
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
              actionType: "DomainModelAction",
              actionName: "undo",
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
              actionType: "DomainModelAction",
              actionName: "redo",
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
                actionType: "DomainModelAction",
                actionName: "commit",
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
              actionType: "DomainModelAction",
              actionName: "replace",
            });
          }}
        >
          Rollback
        </button>
      </span>
      <p />
      <span>
        <button
          onClick={
            async () => {
              await domainController.handleDomainAction({
                actionType: "DomainModelAction",
                actionName: "resetModel",
              });
              console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ RESETMODEL DONE @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@');
              await domainController.handleDomainAction({
                actionType: "DomainModelAction",
                actionName: "replace",
              });
            }
          }
        >
          Reset database
        </button>
      </span>
      <p />
      <span>
        <button
          onClick={async () => {
            await domainController.handleDomainAction({
              actionType: "DomainModelAction",
              actionName: "initModel",
            })
            // .then(
              // async () => {
            console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ INITMODEL DONE @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@');
            await domainController.handleDomainAction({
              actionType: "DomainModelAction",
              actionName: "replace",
            });
              // }
            // );
            
          }}
        >
          Init database
        </button>
      </span>
      <span>
        <button
          onClick={async () => {
            await domainController.handleDomainAction({
              actionType: "DomainModelAction",
              actionName: "replace",
            });
          }}
        >
          fetch Miroir & App configurations from database
        </button>
      </span>
      {/* <p />
      <span>
        <button
          onClick={async () => {
            await uploadInitialMiroirConfiguration(domainController,currentModel);
          }}
        >
          upload Miroir configuration to database
        </button>
      </span> */}
      <p/>
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
                  updateActionType: "ModelCUDInstanceUpdate",
                  updateActionName:'update',
                  objects: [
                    {
                      parentName: reportReportList.parentName,
                      parentUuid: reportReportList.parentUuid,
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
                    entityName: entityAuthor.name,
                    entityUuid: entityAuthor.uuid,
                    // instanceUuid:entityAuthor.uuid,
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
