import {
  Grid,
  Toolbar
} from "@mui/material";
import { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import { styled } from '@mui/material/styles';
import { useEffect, useMemo, useState } from 'react';
import { Outlet } from 'react-router-dom';

import { v4 as uuidv4 } from 'uuid';


import {
  ActionReturnType,
  adminConfigurationDeploymentAdmin,
  adminConfigurationDeploymentLibrary,
  adminConfigurationDeploymentMiroir,
  defaultMiroirMetaModel,
  DomainControllerInterface,
  DomainElementObject,
  domainEndpointVersionV1,
  ExtractorForRecordOfExtractors,
  EntityDefinition,
  entityDefinitionSelfApplication,
  entityDefinitionSelfApplicationVersion,
  entityDefinitionBundleV1,
  entityDefinitionCommit,
  entityDefinitionDeployment,
  entityDefinitionEntity,
  entityDefinitionEntityDefinition,
  entityDefinitionJzodSchema,
  entityDefinitionMenu,
  entityDefinitionQueryVersionV1,
  entityDefinitionReport,
  entityDeployment,
  getLoggerName,
  getMiroirFundamentalJzodSchema,
  instanceEndpointVersionV1,
  JzodSchema,
  jzodSchemajzodMiroirBootstrapSchema,
  localCacheEndpointVersionV1,
  LoggerInterface,
  MiroirLoggerFactory,
  modelEndpointV1,
  persistenceEndpointVersionV1,
  PersistenceStoreLocalOrRemoteInterface,
  queryEndpointVersionV1,
  storeManagementEndpoint,
  StoreOrBundleAction,
  StoreUnitConfiguration,
  templateJzodSchema,
  undoRedoEndpointVersionV1
} from "miroir-core";
import { ReduxStateChanges } from "miroir-localcache-redux";

import { useDomainControllerService, useLocalCacheTransactions, useMiroirContextService } from '../MiroirContextReactProvider.js';
import AppBar from './AppBar.js';

import { packageName } from '../../../constants.js';
import { cleanLevel } from '../constants.js';
import { Sidebar } from "./Sidebar.js";
import { SidebarWidth } from "./SidebarSection.js";

const loggerName: string = getLoggerName(packageName, cleanLevel,"RootComponent");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

const MuiBox: any = Box;

export const emptyDomainElementObject: DomainElementObject = { elementType: "object", elementValue: {} }

export interface RootComponentProps {
  // store:any;
  // reportName: string;
}


const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<{
  open?: boolean;
}>(({ theme, open }) => ({
  flexGrow: 1,
  // display: "inline-block",
  p: 3,
  padding: theme.spacing(3),
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  // marginLeft: `-${SidebarWidth}px`,
  // marginLeft: `${SidebarWidth}px`,
  // marginLeft: `24px`,
  // ...(open && {
  //   transition: theme.transitions.create('margin', {
  //     easing: theme.transitions.easing.easeOut,
  //     duration: theme.transitions.duration.enteringScreen,
  //   }),
  //   marginLeft: 0,
  // }),
}));

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

const StyledMain =
// React.useEffect(
styled(
  Main, 
  // {shouldForwardProp: (prop) => prop !== "open"}
)(
  ({ theme, open }) => ({
    // zIndex: theme.zIndex.drawer + 1,
    // display: "flex",
    // flexGrow: 1,
    // position: "static",
    // flexDirection:"row",
    // justifyContent: "space-between"
    // p: 2,
    // height: "100px",
    // transition: theme.transitions.create(
    //   ["margin", "width"], 
    //   {
    //     easing: theme.transitions.easing.sharp,
    //     duration: theme.transitions.duration.leavingScreen,
    //   }
    // ),
    // ...(
    //   !open && {
    //     width: "100%",
    //     // marginLeft: `-${SidebarWidth}px`,
    //     // marginLeft: `240px`,
    //   }
    // ),
    ...(
      open && {
        width: `calc(100% - ${SidebarWidth}px)`,
        marginLeft: `${SidebarWidth}px`,
        transition: theme.transitions.create(
          ["margin", "width"], {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen,
          }
        ),
      }
    )
  })
);
// ,[props.open])
;

const boxParams = { display: 'flex', flexGrow: 1, flexDirection:"column" };

export const RootComponent = (props: RootComponentProps) => {
  // const params = useParams<any>() as Readonly<Params<ReportUrlParamKeys>>;
  const [drawerIsOpen, setDrawerIsOpen] = useState(true);

  const domainController: DomainControllerInterface = useDomainControllerService();
  const context = useMiroirContextService();
  const transactions: ReduxStateChanges[] = useLocalCacheTransactions();
  const miroirConfig = context.miroirContext.getMiroirConfig();



  const miroirFundamentalJzodSchema: JzodSchema = useMemo(() => getMiroirFundamentalJzodSchema(
    entityDefinitionBundleV1 as EntityDefinition,
    entityDefinitionCommit as EntityDefinition,
    modelEndpointV1,
    storeManagementEndpoint,
    instanceEndpointVersionV1,
    undoRedoEndpointVersionV1,
    localCacheEndpointVersionV1,
    domainEndpointVersionV1,
    queryEndpointVersionV1,
    persistenceEndpointVersionV1,
    jzodSchemajzodMiroirBootstrapSchema as JzodSchema,
    templateJzodSchema as JzodSchema,
    entityDefinitionSelfApplication as EntityDefinition,
    entityDefinitionSelfApplicationVersion as EntityDefinition,
    entityDefinitionDeployment as EntityDefinition,
    entityDefinitionEntity as EntityDefinition,
    entityDefinitionEntityDefinition as EntityDefinition,
    entityDefinitionJzodSchema as EntityDefinition,
    entityDefinitionMenu  as EntityDefinition,
    entityDefinitionQueryVersionV1 as EntityDefinition,
    entityDefinitionReport as EntityDefinition,
    // jzodSchemajzodMiroirBootstrapSchema as any,
  ),[]);

  useEffect(() => context.setMiroirFundamentalJzodSchema(miroirFundamentalJzodSchema));

  const handleDrawerOpen = () => {
    setDrawerIsOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerIsOpen(false);
  };



  return (
    <div>
      {/* <PersistentDrawerLeft></PersistentDrawerLeft> */}
      {/* <Box sx={{ display: 'flex', flexDirection:"column", flexGrow: 1 }}> */}
      <MuiBox sx={boxParams}>
        {/* <CssBaseline /> */}
        <Grid container direction="column">
          <Grid item>
            <AppBar handleDrawerOpen={handleDrawerOpen} open={drawerIsOpen}>
              Bar!
            </AppBar>
            <Toolbar />
          </Grid>
          <Grid item container>
            <Grid item>
              {/* <SidebarSection open={drawerIsOpen} setOpen={setDrawerIsOpen}></SidebarSection> */}
              <Sidebar open={drawerIsOpen} setOpen={setDrawerIsOpen}></Sidebar>
            </Grid>
            <Grid item>
              <StyledMain open={drawerIsOpen}>
                <p />
                  <div>uuid: {uuidv4()}</div>
                  <div>transactions: {JSON.stringify(transactions)}</div>
                <p />

                <span>
                  <button
                    onClick={async () => {
                      log.info(
                        "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ OPENSTORE @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@"
                      );
                      if (!miroirConfig) {
                        throw new Error(
                          "no miroirConfig given, it has to be given on the command line starting the server!"
                        );
                      }
                      const configurations = miroirConfig.client.emulateServer
                        ? miroirConfig.client.deploymentStorageConfig
                        : miroirConfig.client.serverConfig.storeSectionConfiguration;
                      for (const c of Object.entries(configurations)) {
                        const openStoreAction: StoreOrBundleAction = {
                          actionType: "storeManagementAction",
                          actionName: "openStore",
                          endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
                          configuration: {
                            [c[0]]: c[1] as StoreUnitConfiguration,
                          },
                          deploymentUuid: c[0],
                        };
                        await domainController.handleAction(openStoreAction)
                      }
                      log.info(
                        "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ OPENSTORE DONE @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@"
                      );
                    }}
                  >
                    Open database
                  </button>
                  <button
                    onClick={async () => {
                      if (!miroirConfig) {
                        throw new Error(
                          "no miroirConfig given, it has to be given on the command line starting the server!"
                        );
                      }

                      log.info("fetching instances from datastore for deployment", adminConfigurationDeploymentMiroir);
                      // const localMiroirConfig = miroirConfig.client as MiroirConfigForRestClient;
                      const configurations = miroirConfig.client.emulateServer
                        ? miroirConfig.client.deploymentStorageConfig
                        : miroirConfig.client.serverConfig.storeSectionConfiguration;
                      // ADMIN ONLY!!

                      if (!configurations[adminConfigurationDeploymentAdmin.uuid]) {
                        throw new Error(
                          "no configuration for Admin application Deployment given, can not fetch data. Admin deployment uuid=" +
                            adminConfigurationDeploymentAdmin.uuid +
                            " configurations=" +
                            JSON.stringify(configurations, null, 2)
                        );
                      }
                      await domainController.handleAction({
                        actionType: "modelAction",
                        actionName: "rollback",
                        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                        deploymentUuid: adminConfigurationDeploymentAdmin.uuid,
                      });

                      const adminDeploymentsQuery: ExtractorForRecordOfExtractors = {
                        queryType: "extractorForRecordOfExtractors",
                        deploymentUuid: adminConfigurationDeploymentAdmin.uuid,
                        pageParams: emptyDomainElementObject,
                        queryParams: emptyDomainElementObject,
                        contextResults: { elementType: "object", elementValue: {} },
                        extractors: {
                          deployments: {
                            queryType: "extractObjectListByEntity",
                            applicationSection: "data",
                            parentName: "Deployment",
                            parentUuid: {
                              queryTemplateType: "constantUuid",
                              constantUuidValue: entityDeployment.uuid,
                            },
                          },
                        },
                      };
                      const adminDeployments: ActionReturnType = 
                        await domainController.handleQuery(
                          {
                            actionType: "queryAction",
                            actionName: "runQuery",
                            deploymentUuid:adminConfigurationDeploymentAdmin.uuid,
                            endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                            query: adminDeploymentsQuery
                          }
                        )
                      ;
                      
                      if (adminDeployments.status != "ok") {
                        throw new Error("found adminDeployments with error " + adminDeployments.error);
                      }
                  
                      if (adminDeployments.returnedDomainElement.elementType != "entityInstanceCollection") {
                        throw new Error("found adminDeployments not an instance collection " + adminDeployments.returnedDomainElement);
                      }
                      log.info("found adminDeployments", JSON.stringify(adminDeployments));
                  
                      // open and refresh found deployments
                      for (const c of Object.values(adminDeployments.returnedDomainElement.elementValue.instances)) {
                        const openStoreAction: StoreOrBundleAction = {
                          actionType: "storeManagementAction",
                          actionName: "openStore",
                          endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
                          configuration: {
                            [c.uuid]: (c as any /** Deployment */).configuration as StoreUnitConfiguration,
                          },
                          deploymentUuid: c.uuid,
                        };
                        await domainController.handleAction(openStoreAction)

                        await domainController.handleAction({
                          actionType: "modelAction",
                          actionName: "rollback",
                          endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                          deploymentUuid: c.uuid,
                        });
                      }
                    }}
                  >
                    fetch Miroir & App configurations from database
                  </button>
                  <button
                    onClick={async () => {
                      log.info("fetching instances from datastore for deployment", adminConfigurationDeploymentMiroir);
                      await domainController.handleAction({
                        actionType: "modelAction",
                        actionName: "rollback",
                        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                        deploymentUuid: adminConfigurationDeploymentAdmin.uuid,
                      });
                    }}
                  >
                    fetch Admin configuration from database
                  </button>
                  <button
                    onClick={async () => {
                      // await uploadBooksAndReports(domainController, defaultMiroirMetaModel);
                      await domainController.handleAction({
                        actionType: "modelAction",
                        actionName: "remoteLocalCacheRollback",
                        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                        deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
                      });
                      await domainController.handleAction({
                        actionType: "modelAction",
                        actionName: "remoteLocalCacheRollback",
                        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                        deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                      });
                    }}
                  >
                    Load server local cache
                  </button>
                  {/* commit miroir */}
                  <span>
                    <button
                      onClick={async () => {
                        await domainController.handleAction(
                          {
                            actionType: "modelAction",
                            actionName: "commit",
                            endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                            deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
                          },
                          defaultMiroirMetaModel
                        );
                      }}
                    >
                      Commit Miroir
                    </button>
                  </span>
                  {/* Commit Library app */}
                  <span>
                    <button
                      onClick={async () => {
                        await domainController.handleAction(
                          {
                            actionType: "modelAction",
                            actionName: "commit",
                            endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                            deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                          },
                          defaultMiroirMetaModel
                        );
                      }}
                    >
                      Commit Library app
                    </button>
                  </span>

                  {/* <button
                    onClick={async () => {
                      const remoteStore:PersistenceStoreLocalOrRemoteInterface = domainController.getRemoteStore();
                      if (!miroirConfig) {
                        throw new Error("no miroirConfig given, it has to be given on the command line starting the server!");
                      }
                      log.info(
                        "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ INITMODEL START @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@"
                      );
                      await domainController.handleAction({
                        actionType: "modelAction",
                        actionName: "initModel",
                        deploymentUuid:adminConfigurationDeploymentMiroir.uuid,
                        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                        params: {
                          dataStoreType: "miroir",
                          metaModel: defaultMiroirMetaModel,
                          application: selfApplicationMiroir,
                          applicationDeploymentConfiguration: adminConfigurationDeploymentMiroir,
                          applicationModelBranch: selfApplicationModelBranchMiroirMasterBranch,
                          applicationStoreBasedConfiguration: selfApplicationStoreBasedConfigurationMiroir,
                          applicationVersion: selfApplicationVersionInitialMiroirVersion,
                        },
                      });
                      await domainController.handleAction({
                        actionType: "modelAction",
                        actionName: "initModel",
                        deploymentUuid:adminConfigurationDeploymentLibrary.uuid,
                        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                        params: {
                          dataStoreType: "app",
                          metaModel: defaultMiroirMetaModel,
                          application: selfApplicationLibrary,
                          applicationDeploymentConfiguration: adminConfigurationDeploymentLibrary,
                          applicationModelBranch: selfApplicationModelBranchLibraryMasterBranch,
                          applicationStoreBasedConfiguration: selfApplicationStoreBasedConfigurationLibrary,
                          applicationVersion: selfApplicationVersionLibraryInitialVersion,
                        },
                      });
                      // TODO: transactional action must not autocommit! initModel neither?!
                      // .then(
                      // async () => {
                      log.info(
                        "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ INITMODEL DONE @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@"
                      );
                      await domainController.handleAction({
                        actionType: "modelAction",
                        actionName: "rollback",
                        deploymentUuid:adminConfigurationDeploymentMiroir.uuid,
                        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                      });
                      await domainController.handleAction({
                        actionType: "modelAction",
                        actionName: "rollback",
                        deploymentUuid:adminConfigurationDeploymentLibrary.uuid,
                        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e"
                      });
                
                      // }
                      // );
                    }}
                  >
                    Init database
                  </button> */}
                  {/* <button
                    onClick={async () => {
                      log.info("creating bundle")
                      const remoteStore:PersistenceStoreLocalOrRemoteInterface = domainController.getRemoteStore();
                      await remoteStore.handlePersistenceAction({
                        actionType: "bundleAction",
                        actionName: "createBundle",
                        deploymentUuid: adminConfigurationDeploymentLibrary.uuid
                      })
                    }
                  }
                  >
                    create Library Application Bundle
                  </button> */}
                </span>
                <p />
                <span>
                  {/* <button
                    onClick={async () => {
                      await uploadBooksAndReports(domainController, defaultMiroirMetaModel);
                      await domainController.handleAction({
                        actionType: "modelAction",
                        actionName: "remoteLocalCacheRollback",
                        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                        deploymentUuid:adminConfigurationDeploymentMiroir.uuid,
                      });
                      await domainController.handleAction({
                        actionType: "modelAction",
                        actionName: "remoteLocalCacheRollback",
                        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                        deploymentUuid:adminConfigurationDeploymentLibrary.uuid,
                      });
                    }}
                  >
                    upload App configuration to database
                  </button> */}
                  {/* <button
                    onClick={async () => {
                      const query:ExtractorForRecordOfExtractors = {
                        queryType: "extractorForRecordOfExtractors",
                        deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                        contextResults: {
                          elementType: "object",
                          elementValue: {}
                        },
                        pageParams: {
                          elementType: "object",
                          elementValue: {}
                        },
                        queryParams: {
                          elementType: "object",
                          elementValue: {}
                        },
                        extractors: {
                          "select": {
                            "authors": {
                              "queryType": "extractObjectListByEntity",
                              "parentName": "Author",
                              "parentUuid": {
                                "queryTemplateType": "constantUuid",
                                "constantUuidValue": "d7a144ff-d1b9-4135-800c-a7cfc1f38733"
                              }
                            }
                          }
                        }
                      } 
                      await domainController.handleAction({
                        actionType: "queryAction",
                        actionName: "runQuery",
                        deploymentUuid:query.deploymentUuid,
                        endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                        query: query
                      });
                
                      // await uploadBooksAndReports(domainController, defaultMiroirMetaModel);
                    }}
                  >
                    send query to database
                  </button> */}
                </span>
                <Outlet></Outlet>
              </StyledMain>
            </Grid>
          </Grid>
        </Grid>
        {/* <StyledDrawerHeader /> */}
        {/* <Box sx={{ display: 'flex', flexDirection:"row", width: 1 }}> */}
        {/* </Box> */}
      </MuiBox>
    </div>
  );
};
