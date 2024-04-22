import {
  Grid,
  Toolbar
} from "@mui/material";
import { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import { styled } from '@mui/material/styles';
import { useEffect, useMemo, useState } from 'react';
import { Outlet, Params, useParams } from 'react-router-dom';


import {
  applicationDeploymentAdmin,
  applicationDeploymentLibrary,
  applicationDeploymentMiroir,
  DomainControllerInterface,
  domainEndpointVersionV1,
  EntityDefinition,
  entityDefinitionApplication,
  entityDefinitionApplicationVersion,
  entityDefinitionBundleV1,
  entityDefinitionCommit,
  entityDefinitionEntity,
  entityDefinitionEntityDefinition,
  entityDefinitionJzodSchema,
  entityDefinitionMenu,
  entityDefinitionQueryVersionV1,
  entityDefinitionReport,
  getLoggerName,
  getMiroirFundamentalJzodSchema,
  instanceEndpointVersionV1,
  JzodSchema,
  jzodSchemajzodMiroirBootstrapSchema,
  localCacheEndpointVersionV1,
  LoggerInterface,
  MiroirConfigForRestClient,
  MiroirLoggerFactory,
  modelEndpointV1,
  persistenceEndpointVersionV1,
  PersistenceInterface,
  queryEndpointVersionV1,
  StoreManagementAction,
  storeManagementEndpoint,
  undoRedoEndpointVersionV1
} from "miroir-core";

import { useDomainControllerService, useMiroirContext, useMiroirContextService } from '../MiroirContextReactProvider';
import AppBar from './AppBar';
import { ReportUrlParamKeys } from '../routes/ReportPage';

import { packageName } from '../../../constants';
import { cleanLevel } from '../constants';
import { Sidebar, SidebarWidth } from "./Sidebar";

const loggerName: string = getLoggerName(packageName, cleanLevel,"RootComponent");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

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
    entityDefinitionApplication as EntityDefinition,
    entityDefinitionApplicationVersion as EntityDefinition,
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
      <Box sx={boxParams}>
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
              <Sidebar open={drawerIsOpen} setOpen={setDrawerIsOpen}></Sidebar>
            </Grid>
            <Grid item>
              <StyledMain open={drawerIsOpen}>
                <span>
                  <button
                    onClick={async () => {
                      const remoteStore: PersistenceInterface = domainController.getRemoteStore();
                      log.info(
                        "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ OPENSTORE @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@"
                      );
                      if (!miroirConfig) {
                        throw new Error(
                          "no miroirConfig given, it has to be given on the command line starting the server!"
                        );
                      }
                      if (miroirConfig && miroirConfig.client.emulateServer) {
                        await remoteStore.handlePersistenceAction({
                          actionType: "storeManagementAction",
                          actionName: "openStore",
                          endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
                          configuration: {
                            [applicationDeploymentMiroir.uuid]:
                              miroirConfig.client.deploymentStorageConfig[applicationDeploymentMiroir.uuid],
                            [applicationDeploymentLibrary.uuid]:
                              miroirConfig.client.deploymentStorageConfig[applicationDeploymentLibrary.uuid],
                          },
                          deploymentUuid: applicationDeploymentMiroir.uuid,
                        });
                      } else {
                        const localMiroirConfig = miroirConfig.client as MiroirConfigForRestClient;
                        const openStoreAction:StoreManagementAction = {
                          actionType: "storeManagementAction",
                          actionName: "openStore",
                          endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
                          configuration: {
                            [applicationDeploymentMiroir.uuid]:
                              localMiroirConfig.serverConfig.storeSectionConfiguration[applicationDeploymentMiroir.uuid],
                            [applicationDeploymentLibrary.uuid]:
                              localMiroirConfig.serverConfig.storeSectionConfiguration[applicationDeploymentLibrary.uuid],
                          },
                          deploymentUuid: applicationDeploymentMiroir.uuid,
                        }
                        log.info("openStore openStoreAction",openStoreAction, "localMiroirConfig.serverConfig", localMiroirConfig.serverConfig);
                        await remoteStore.handlePersistenceAction(openStoreAction);
                      }

                      // TODO: transactional action must not autocommit! initModel neither?!
                      // .then(
                      // async () => {
                      log.info(
                        "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ OPENSTORE DONE @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@"
                      );
                    }}
                  >
                    Open database
                  </button>
                  <button
                    onClick={async () => {
                      log.info("fetching instances from datastore for deployment", applicationDeploymentMiroir);
                      await domainController.handleAction({
                        actionType: "modelAction",
                        actionName: "rollback",
                        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                        deploymentUuid: applicationDeploymentMiroir.uuid,
                      });
                      await domainController.handleAction({
                        actionType: "modelAction",
                        actionName: "rollback",
                        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                        deploymentUuid: applicationDeploymentLibrary.uuid,
                      });
                    }}
                  >
                    fetch Miroir & App configurations from database
                  </button>
                  <button
                    onClick={async () => {
                      log.info("fetching instances from datastore for deployment", applicationDeploymentMiroir);
                      await domainController.handleAction({
                        actionType: "modelAction",
                        actionName: "rollback",
                        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                        deploymentUuid: applicationDeploymentAdmin.uuid,
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
                        deploymentUuid: applicationDeploymentMiroir.uuid,
                      });
                      await domainController.handleAction({
                        actionType: "modelAction",
                        actionName: "remoteLocalCacheRollback",
                        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                        deploymentUuid: applicationDeploymentLibrary.uuid,
                      });
                    }}
                  >
                    Load server local cache
                  </button>

                  {/* <button
                    onClick={async () => {
                      const remoteStore:PersistenceInterface = domainController.getRemoteStore();
                      if (!miroirConfig) {
                        throw new Error("no miroirConfig given, it has to be given on the command line starting the server!");
                      }
                      log.info(
                        "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ INITMODEL START @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@"
                      );
                      await domainController.handleAction({
                        actionType: "modelAction",
                        actionName: "initModel",
                        deploymentUuid:applicationDeploymentMiroir.uuid,
                        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                        params: {
                          dataStoreType: "miroir",
                          metaModel: defaultMiroirMetaModel,
                          application: applicationMiroir,
                          applicationDeploymentConfiguration: applicationDeploymentMiroir,
                          applicationModelBranch: applicationModelBranchMiroirMasterBranch,
                          applicationStoreBasedConfiguration: applicationStoreBasedConfigurationMiroir,
                          applicationVersion: applicationVersionInitialMiroirVersion,
                        },
                      });
                      await domainController.handleAction({
                        actionType: "modelAction",
                        actionName: "initModel",
                        deploymentUuid:applicationDeploymentLibrary.uuid,
                        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                        params: {
                          dataStoreType: "app",
                          metaModel: defaultMiroirMetaModel,
                          application: applicationLibrary,
                          applicationDeploymentConfiguration: applicationDeploymentLibrary,
                          applicationModelBranch: applicationModelBranchLibraryMasterBranch,
                          applicationStoreBasedConfiguration: applicationStoreBasedConfigurationLibrary,
                          applicationVersion: applicationVersionLibraryInitialVersion,
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
                        deploymentUuid:applicationDeploymentMiroir.uuid,
                        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                      });
                      await domainController.handleAction({
                        actionType: "modelAction",
                        actionName: "rollback",
                        deploymentUuid:applicationDeploymentLibrary.uuid,
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
                      const remoteStore:PersistenceInterface = domainController.getRemoteStore();
                      await remoteStore.handlePersistenceAction({
                        actionType: "bundleAction",
                        actionName: "createBundle",
                        deploymentUuid: applicationDeploymentLibrary.uuid
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
                        deploymentUuid:applicationDeploymentMiroir.uuid,
                      });
                      await domainController.handleAction({
                        actionType: "modelAction",
                        actionName: "remoteLocalCacheRollback",
                        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                        deploymentUuid:applicationDeploymentLibrary.uuid,
                      });
                    }}
                  >
                    upload App configuration to database
                  </button> */}
                  {/* <button
                    onClick={async () => {
                      const query:DomainManyQueriesWithDeploymentUuid = {
                        queryType: "DomainManyQueries",
                        deploymentUuid: applicationDeploymentLibrary.uuid,
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
                        fetchQuery: {
                          "select": {
                            "authors": {
                              "queryType": "selectObjectListByEntity",
                              "parentName": "Author",
                              "parentUuid": {
                                "referenceType": "constant",
                                "referenceUuid": "d7a144ff-d1b9-4135-800c-a7cfc1f38733"
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
      </Box>
    </div>
  );
};
