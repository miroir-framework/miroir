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
  StoreBasedConfiguration,
  applicationDeploymentMiroir,
  // applicationDeploymentLibrary,
  ApplicationDeployment,
  defaultMiroirMetaModel,
  applicationMiroir,
  applicationModelBranchMiroirMasterBranch,
  applicationStoreBasedConfigurationMiroir
} from "miroir-core";
import {
  useLocalCacheDeploymentReports,
  useLocalCacheEntities,
  useLocalCacheEntityDefinitions,
  useLocalCacheModelVersion,
  useLocalCacheReports,
  useLocalCacheStoreBasedConfiguration,
  useLocalCacheTransactions,
} from "miroir-fwk/4_view/hooks";
import { useDomainControllerServiceHook, useErrorLogServiceHook, useMiroirContextDeploymentUuid, useMiroirContextSetDeploymentUuid } from "miroir-fwk/4_view/MiroirContextReactProvider";
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
// import applicationDeploymentLibraryDeployment from "assets/35c5608a-7678-4f07-a4ec-76fc5bc35424/ab4c13c3-f476-407c-a30c-7cb62275a352.json";
import reportAuthorList from "assets/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/66a09068-52c3-48bc-b8dd-76575bbc8e72.json";
import reportBookList from "assets/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/74b010b6-afee-44e7-8590-5f0849e4a5c9.json";
import reportPublisherList from "assets/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/a77aa662-006d-46cd-9176-01f02a1a12dc.json";
import entityDefinitionBook from "assets/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/797dd185-0155-43fd-b23f-f6d0af8cae06.json";
import entityDefinitionPubliser from "assets/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/7a939fe8-d119-4e7f-ab94-95b2aae30db9.json";
import entityDefinitionAuthor from "assets/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/b30b7180-f7dc-4cca-b4e8-e476b77fe61d.json";

import applicationLibrary from "assets/a659d350-dd97-4da9-91de-524fa01745dc/5af03c98-fe5e-490b-b08f-e1230971c57f.json";
// import applicationDeploymentLibrary from 'assets/35c5608a-7678-4f07-a4ec-76fc5bc35424/f714bb2f-a12d-4e71-a03b-74dcedea6eb4.json';
import applicationVersionLibraryInitialVersion from "assets/c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24/419773b4-a73c-46ca-8913-0ee27fb2ce0a.json";
import applicationModelBranchLibraryMasterBranch from "assets/cdb0aec6-b848-43ac-a058-fe2dbe5811f1/ad1ddc4e-556e-4598-9cff-706a2bde0be7.json";
import applicationStoreBasedConfigurationLibrary from "assets/7990c0c9-86c3-40a1-a121-036c91b55ed7/2e5b7948-ff33-4917-acac-6ae6e1ef364f.json";

import author1 from "assets/d7a144ff-d1b9-4135-800c-a7cfc1f38733/4441169e-0c22-4fbc-81b2-28c87cf48ab2.json";
import author2 from "assets/d7a144ff-d1b9-4135-800c-a7cfc1f38733/ce7b601d-be5f-4bc6-a5af-14091594046a.json";
import author3 from "assets/d7a144ff-d1b9-4135-800c-a7cfc1f38733/d14c1c0c-eb2e-42d1-8ac1-2d58f5143c17.json";
import author4 from "assets/d7a144ff-d1b9-4135-800c-a7cfc1f38733/e4376314-d197-457c-aa5e-d2da5f8d5977.json";
import book3 from "assets/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/4cb917b3-3c53-4f9b-b000-b0e4c07a81f7.json";
import book4 from "assets/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/6fefa647-7ecf-4f83-b617-69d7d5094c37.json";
import book5 from "assets/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/c97be567-bd70-449f-843e-cd1d64ac1ddd.json";
import book1 from "assets/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/caef8a59-39eb-48b5-ad59-a7642d3a1e8f.json";
import book2 from "assets/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/e20e276b-619d-4e16-8816-b7ec37b53439.json";
import folio from "assets/a027c379-8468-43a5-ba4d-bf618be25cab/1f550a2a-33f5-4a56-83ee-302701039494.json";
import penguin from "assets/a027c379-8468-43a5-ba4d-bf618be25cab/516a7366-39e7-4998-82cb-80199a7fa667.json";
import springer from "assets/a027c379-8468-43a5-ba4d-bf618be25cab/c1c97d54-aba8-4599-883a-7fe8f3874095.json";

// duplicated from server!!!!!!!!
const applicationDeploymentLibrary: ApplicationDeployment = {
  "uuid":"f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
  "parentName":"ApplicationDeployment",
  "parentUuid":"35c5608a-7678-4f07-a4ec-76fc5bc35424",
  "type":"singleNode",
  "name":"LibraryApplicationPostgresDeployment",
  "application":"5af03c98-fe5e-490b-b08f-e1230971c57f",
  "description": "The default Postgres Deployment for Application Library",
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
export interface RootComponentProps {
  // store:any;
  reportName: string;
}

function defaultToEntityList(value: string | undefined, miroirReports: MiroirReport[]): string | undefined {
  return value ? (value as string) : miroirReports.find((r) => r.name == "EntityList") ? "EntityList" : undefined;
}

// ###################################################################################
async function uploadBooksAndReports(
  domainController: DomainControllerInterface,
  currentModel?:MiroirMetaModel
) {
  await domainController.handleDomainAction(
    applicationDeploymentLibrary.uuid,
    {
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
  await domainController.handleDomainAction(
    applicationDeploymentLibrary.uuid,
    {
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

  await domainController.handleDomainAction(
    applicationDeploymentLibrary.uuid,
    { actionName: "commit", actionType: "DomainModelAction", label:"Adding Author and Book entities" },
    currentModel
  );

  await domainController.handleDomainAction(
    applicationDeploymentLibrary.uuid,
    {
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
  const deployments = [applicationDeploymentMiroir, applicationDeploymentLibrary] as ApplicationDeployment[];

  const miroirReports: MiroirReport[] = useLocalCacheReports();
  const miroirEntities: MetaEntity[] = useLocalCacheEntities();
  const miroirEntityDefinitions: EntityDefinition[] = useLocalCacheEntityDefinitions();
  const miroirApplicationVersions: MiroirApplicationVersion[] = useLocalCacheModelVersion();
  const storeBasedConfigurations: StoreBasedConfiguration[] = useLocalCacheStoreBasedConfiguration();
  const transactions: ReduxStateChanges[] = useLocalCacheTransactions();
  const errorLog = useErrorLogServiceHook();
  const domainController: DomainControllerInterface = useDomainControllerServiceHook();
  // const [displayedReportName, setDisplayedReportName] = React.useState('');
  const [displayedReportUuid, setDisplayedReportUuid] = React.useState("");
  // const [displayedDeploymentUuid, setDisplayedDeploymentUuid] = React.useState("");
  const displayedDeploymentUuid = useMiroirContextDeploymentUuid();
  const setDisplayedDeploymentUuid = useMiroirContextSetDeploymentUuid();

  const deploymentReports: MiroirReport[] = useLocalCacheDeploymentReports(displayedDeploymentUuid);

  const handleChangeDisplayedReport = (event: SelectChangeEvent) => {
    // setDisplayedReportName(event.target.value?event.target.value as string:(miroirReports.find((r)=>r.name=='EntityList')?'EntityList':undefined));
    // setDisplayedReportUuid(defaultToEntityList(event.target.value, miroirReports));
    const reportUuid = defaultToEntityList(event.target.value, deploymentReports);
    setDisplayedReportUuid(reportUuid?reportUuid:'');
  };

  const handleChangeDisplayedDeployment = (event: SelectChangeEvent) => {
    // setDisplayedReportName(event.target.value?event.target.value as string:(miroirReports.find((r)=>r.name=='EntityList')?'EntityList':undefined));
    setDisplayedDeploymentUuid(event.target.value);
    setDisplayedReportUuid("");
  };

  console.log("RootComponent miroirReports", miroirReports);

  const currentModel: MiroirMetaModel =  {
    entities: miroirEntities,
    entityDefinitions: miroirEntityDefinitions,
    reports: miroirReports,
    configuration: storeBasedConfigurations,
    applicationVersions: miroirApplicationVersions,
    applicationVersionCrossEntityDefinition: [],
  };

  // const {store} = props;
  return (
    <div>
      <span>
        <button
          onClick={async () => {
            await domainController.handleDomainModelAction(applicationDeploymentMiroir.uuid, {
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
            await domainController.handleDomainModelAction(applicationDeploymentMiroir.uuid, {
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
              applicationDeploymentMiroir.uuid,
              {
                actionType: "DomainModelAction",
                actionName: "commit",
              },
              currentModel
            );
          }}
        >
          Commit Miroir
        </button>
      </span>
      <span>
        <button
          onClick={async () => {
            await domainController.handleDomainModelAction(
              applicationDeploymentLibrary.uuid,
              {
                actionType: "DomainModelAction",
                actionName: "commit",
              },
              currentModel
            );
          }}
        >
          Commit Library app
        </button>
      </span>
      <span>
        <button
          onClick={async () => {
            await domainController.handleDomainModelAction(
              applicationDeploymentMiroir.uuid,
              {
                actionType: "DomainModelAction",
                actionName: "rollback",
              }
            );
          }}
        >
          Rollback
        </button>
      </span>
      <p />
      <span>
        <button
          onClick={async () => {
            await domainController.handleDomainAction(
              applicationDeploymentMiroir.uuid,
              {
                actionType: "DomainModelAction",
                actionName: "resetModel",
              }
            );
            console.log(
              "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ RESETMODEL DONE @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@"
            );
            await domainController.handleDomainAction(
              applicationDeploymentMiroir.uuid,
              {
                actionType: "DomainModelAction",
                actionName: "rollback",
              }
            );
          }}
        >
          Reset database
        </button>
      </span>
      <p />
      <span>
        <button
          onClick={async () => {
            await domainController.handleDomainAction(
              applicationDeploymentMiroir.uuid,
              {
                actionType: "DomainModelAction",
                actionName: "initModel",
                params: {
                  dataStoreType:'miroir',
                  metaModel: defaultMiroirMetaModel,
                  application: applicationMiroir,
                  applicationDeployment: applicationDeploymentMiroir,
                  applicationModelBranch: applicationModelBranchMiroirMasterBranch,
                  applicationStoreBasedConfiguration: applicationStoreBasedConfigurationMiroir,
                  applicationVersion:applicationVersionLibraryInitialVersion,
                }
              }
            );
            await domainController.handleDomainAction(
              applicationDeploymentLibrary.uuid,
              {
                actionType: "DomainModelAction",
                actionName: "initModel",
                params: {
                  dataStoreType:'app',
                  metaModel: defaultMiroirMetaModel,
                  application: applicationLibrary,
                  applicationDeployment: applicationDeploymentLibrary,
                  applicationModelBranch: applicationModelBranchLibraryMasterBranch,
                  applicationStoreBasedConfiguration: applicationStoreBasedConfigurationLibrary,
                  applicationVersion:applicationVersionLibraryInitialVersion,
                }
              }
            );
            // .then(
            // async () => {
            console.log(
              "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ INITMODEL DONE @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@"
            );
            await domainController.handleDomainAction(
              applicationDeploymentMiroir.uuid,
              {
                actionType: "DomainModelAction",
                actionName: "rollback",
              }
            );
            await domainController.handleDomainAction(
              applicationDeploymentLibrary.uuid,
              {
                actionType: "DomainModelAction",
                actionName: "rollback",
              }
            );
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
            await domainController.handleDomainAction(
              applicationDeploymentMiroir.uuid,
              {
                actionType: "DomainModelAction",
                actionName: "rollback",
              }
            );
            await domainController.handleDomainAction(
              applicationDeploymentLibrary.uuid,
              {
                actionType: "DomainModelAction",
                actionName: "rollback",
              }
            );
          }
        }
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
      <p />
      <span>
        <button
          onClick={async () => {
            await uploadBooksAndReports(domainController, currentModel);
          }}
        >
          upload App configuration to database
        </button>
      </span>
      <span>
        <button
          onClick={async () => {
            await domainController.handleDomainModelAction(
              applicationDeploymentMiroir.uuid,
              {
                actionType: "DomainModelAction",
                actionName: "updateEntity",
                update: {
                  updateActionName: "WrappedModelEntityUpdate",
                  modelEntityUpdate: {
                    updateActionType: "ModelEntityUpdate",
                    updateActionName: "renameEntity",
                    entityName: entityBook.name,
                    entityUuid: entityBook.uuid,
                    targetValue: "Bookss",
                  },
                },
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
              applicationDeploymentMiroir.uuid,
              {
                actionType: "DomainModelAction",
                actionName: "UpdateMetaModelInstance",
                update: {
                  updateActionType: "ModelCUDInstanceUpdate",
                  updateActionName: "update",
                  objects: [
                    {
                      parentName: reportReportList.parentName,
                      parentUuid: reportReportList.parentUuid,
                      instances: [
                        Object.assign({}, reportReportList, {
                          name: "Report2List",
                          defaultLabel: "Modified List of Reports",
                        }) as EntityInstance,
                      ],
                    },
                  ],
                },
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
              applicationDeploymentMiroir.uuid,
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
                },
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
      <p />
      <span>reports: {JSON.stringify(deploymentReports.map(r=>r.name))}</span>
      <p />
      <h3>
        {/* props: {JSON.stringify(props)} */}
        erreurs: {JSON.stringify(errorLog)}
      </h3>
      <span>packages: {JSON.stringify(ConfigurationService.packages)}</span>
      <p />
      <Box sx={{ minWidth: 50 }}>
        <FormControl fullWidth>
          <InputLabel id="demo-simple-select-label">Chosen application Deployment</InputLabel>
          <Select
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            value={displayedDeploymentUuid}
            label="displayedDeploymentUuid"
            onChange={handleChangeDisplayedDeployment}
          >
            {deployments.map((deployment) => {
              return (
                <MenuItem key={deployment.name} value={deployment.uuid}>
                  {deployment.description}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      </Box>
      <p />
      <Box sx={{ minWidth: 50 }}>
        <FormControl fullWidth>
          <InputLabel id="demo-simple-select-label">Displayed Report</InputLabel>
          <Select
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            value={displayedReportUuid}
            label="displayedReportUuid"
            onChange={handleChangeDisplayedReport}
          >
            {deploymentReports.map((r) => {
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
          <ReportComponent deploymentUuid={displayedDeploymentUuid} reportUuid={displayedReportUuid} />
        </CardContent>
      </Card>
    </div>
  );
};
