import {
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Toolbar
} from "@mui/material";
import { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import { styled } from '@mui/material/styles';
import { useEffect, useMemo, useState } from 'react';
import { Outlet } from 'react-router-dom';

import { v4 as uuidv4 } from 'uuid';


import {
  Action2Error,
  Action2ReturnType,
  adminConfigurationDeploymentAdmin,
  adminConfigurationDeploymentLibrary,
  adminConfigurationDeploymentMiroir,
  BoxedQueryTemplateWithExtractorCombinerTransformer,
  defaultMiroirMetaModel,
  Domain2ElementFailed,
  Domain2QueryReturnType,
  DomainControllerInterface,
  entityDeployment,
  LoggerInterface,
  miroirFundamentalJzodSchema,
  MiroirLoggerFactory,
  StoreOrBundleAction,
  StoreUnitConfiguration
} from "miroir-core";
import { ReduxStateChanges } from "miroir-localcache-redux";

import {
  useDomainControllerService,
  useLocalCacheTransactions,
  useMiroirContextService,
} from "../MiroirContextReactProvider.js";
import AppBar from './AppBar.js';

import { deployments, packageName } from '../../../constants.js';
import { cleanLevel } from '../constants.js';
import { Sidebar } from "./Sidebar.js";
import { SidebarWidth } from "./SidebarSection.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "RootComponent")
).then((logger: LoggerInterface) => {log = logger});


const MuiBox: any = Box;

export const emptyDomainElementObject: Domain2QueryReturnType<Record<string,any>> = {}

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
  {shouldForwardProp: (prop) => prop !== "open" && prop !== "width"}
)<{
  open?: boolean;
  width?: number;
}>(
  ({ theme, open, width = SidebarWidth }) => ({
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
        width: `calc(100% - ${width}px)`,
        marginLeft: `${width}px`,
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

let count = 0;
export const RootComponent = (props: RootComponentProps) => {
  // const params = useParams<any>() as Readonly<Params<ReportUrlParamKeys>>;
  count++;
  const [drawerIsOpen, setDrawerIsOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(SidebarWidth);
  log.info(
    "##################################### rendering root component",
    "count",
    count,
  );

  const domainController: DomainControllerInterface = useDomainControllerService();
  const context = useMiroirContextService();
  const transactions: ReduxStateChanges[] = useLocalCacheTransactions();
  const miroirConfig = context.miroirContext.getMiroirConfig();

  if (miroirConfig && miroirConfig.miroirConfigType != "client") {
    throw new Error("RootComponent: miroirConfig.miroirConfigType != 'client' " + JSON.stringify(miroirConfig));
  }

  // ##############################################################################################
  // TODO: are these useMemo needed? This is dubious use, direct from a useMiroirContextService() call
  const displayedDeploymentUuid = useMemo(() => context.deploymentUuid, [context]);
  const setDisplayedDeploymentUuid = useMemo(() => context.setDeploymentUuid, [context]);
  // const displayedApplicationSection = useMemo(() => context.applicationSection, [context]);
  const setDisplayedApplicationSection = useMemo(() => context.setApplicationSection, [context]);

  // ###############################################################################################
  useEffect(() => context.setMiroirFundamentalJzodSchema(miroirFundamentalJzodSchema as any));
  // ###############################################################################################

  const handleDrawerOpen = useMemo(() => () => {
    setDrawerIsOpen(true);
  }, [setDrawerIsOpen]);

  const handleDrawerClose = useMemo(() => () => {
    setDrawerIsOpen(false);
  }, [setDrawerIsOpen]);

  const handleChangeDisplayedDeployment = useMemo(() => (event: SelectChangeEvent) => {
    event.stopPropagation();
    log.info('handleChangeDisplayedDeployment',event);
    setDisplayedDeploymentUuid(event.target.value);
    log.info('handleChangeDisplayedDeployment',displayedDeploymentUuid);
    setDisplayedApplicationSection('data');
    // setDisplayedReportUuid("");
  }, [setDisplayedDeploymentUuid, setDisplayedApplicationSection]);

  const handleSidebarWidthChange = useMemo(() => (width: number) => {
    setSidebarWidth(width);
  }, [setSidebarWidth]);


  return (
    <div>
      {/* <PersistentDrawerLeft></PersistentDrawerLeft> */}
      {/* <Box sx={{ display: 'flex', flexDirection:"column", flexGrow: 1 }}> */}
      {/* Root loaded {loaded} */}
      {/* <p /> */}
      <MuiBox sx={boxParams}>
        {/* <CssBaseline /> */}
        <Grid container direction="column">
          <Grid item>
            <AppBar 
              handleDrawerOpen={handleDrawerOpen} 
              open={drawerIsOpen}
              width={sidebarWidth}
              onWidthChange={handleSidebarWidthChange}
            >
              Bar!
            </AppBar>
            <Toolbar />
          </Grid>
          <Grid item container>
            <Grid item>
              {/* <SidebarSection open={drawerIsOpen} setOpen={setDrawerIsOpen}></SidebarSection> */}
              <Sidebar 
                open={drawerIsOpen} 
                setOpen={setDrawerIsOpen} 
                width={sidebarWidth}
                onWidthChange={handleSidebarWidthChange}
              ></Sidebar>
            </Grid>
            <Grid item>
              <StyledMain open={drawerIsOpen} width={sidebarWidth}>
                <p />
                  <div>uuid: {uuidv4()}</div>
                  <div>transactions: {JSON.stringify(transactions)}</div>
                  <div>loaded: {count}</div>
                <p />
                <div>
                  <FormControl fullWidth>
                    <InputLabel id="demo-simple-select-label">Chosen selfApplication Deployment</InputLabel>
                    <Select
                      labelId="demo-simple-select-label"
                      id="demo-simple-select"
                      value={context.deploymentUuid}
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
                </div>

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
                          // actionType: "storeManagementAction",
                          actionType: "storeManagementAction_openStore",
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
                          "no configuration for Admin selfApplication Deployment given, can not fetch data. Admin deployment uuid=" +
                            adminConfigurationDeploymentAdmin.uuid +
                            " configurations=" +
                            JSON.stringify(configurations, null, 2)
                        );
                      }
                      await domainController.handleAction({
                        // actionType: "modelAction",
                        actionType: "rollback",
                        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                        deploymentUuid: adminConfigurationDeploymentAdmin.uuid,
                      }, defaultMiroirMetaModel);

                      const subQueryName = "deployments";
                      const adminDeploymentsQuery: BoxedQueryTemplateWithExtractorCombinerTransformer = {
                        queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
                        deploymentUuid: adminConfigurationDeploymentAdmin.uuid,
                        pageParams: {},
                        queryParams: {},
                        contextResults: {},
                        extractorTemplates: {
                          [subQueryName]: {
                            extractorTemplateType: "extractorTemplateForObjectListByEntity",
                            applicationSection: "data",
                            parentName: "Deployment",
                            parentUuid: {
                              transformerType: "constantUuid",
                              interpolation: "build",
                              value: entityDeployment.uuid,
                            },
                          },
                        },
                      };
                      const adminDeployments: Action2ReturnType = 
                        await domainController.handleQueryTemplateOrBoxedExtractorTemplateActionForServerONLY(
                          {
                            actionType: "runBoxedQueryTemplateOrBoxedExtractorTemplateAction",
                            actionName: "runQuery",
                            deploymentUuid:adminConfigurationDeploymentAdmin.uuid,
                            endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                            applicationSection: "data",
                            query: adminDeploymentsQuery
                          }
                        )
                      ;
                      
                      if (adminDeployments instanceof Action2Error) {
                        throw new Error("found adminDeployments with error " + adminDeployments);
                      }
                      
                      if (adminDeployments.returnedDomainElement instanceof Domain2ElementFailed) {
                        throw new Error("found adminDeployments failed " + adminDeployments.returnedDomainElement);
                      }
                      if (typeof adminDeployments.returnedDomainElement != "object" ) {
                        throw new Error("found adminDeployments query result not an object as expected " + adminDeployments.returnedDomainElement);
                      }

                      if ( !adminDeployments.returnedDomainElement[subQueryName] ) {
                        throw new Error("found adminDeployments query result object does not have attribute " + subQueryName + " as expected " + adminDeployments.returnedDomainElement);
                      }
                     
                      const foundDeployments = adminDeployments.returnedDomainElement[subQueryName];

                      log.info("found adminDeployments", JSON.stringify(adminDeployments));
                  
                      // open and refresh found deployments
                      for (const c of Object.values(foundDeployments)) { // TODO: correct type of c
                        const openStoreAction: StoreOrBundleAction = {
                          // actionType: "storeManagementAction",
                          actionType: "storeManagementAction_openStore",
                          endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
                          configuration: {
                            [(c as any).uuid]: (c as any /** Deployment */).configuration as StoreUnitConfiguration,
                          },
                          deploymentUuid: (c as any).uuid,
                        };
                        await domainController.handleAction(openStoreAction)

                        await domainController.handleAction({
                          // actionType: "modelAction",
                          actionType: "rollback",
                          endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                          deploymentUuid: (c as any).uuid,
                        }, defaultMiroirMetaModel);
                      }
                    }}
                  >
                    fetch Miroir & App configurations from database
                  </button>
                  <button
                    onClick={async () => {
                      log.info("fetching instances from datastore for deployment", adminConfigurationDeploymentMiroir);
                      await domainController.handleAction({
                        // actionType: "modelAction",
                        actionType: "rollback",
                        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                        deploymentUuid: adminConfigurationDeploymentAdmin.uuid,
                      }, defaultMiroirMetaModel);
                    }}
                  >
                    fetch Admin configuration from database
                  </button>
                  <button
                    onClick={async () => {
                      // await uploadBooksAndReports(domainController, defaultMiroirMetaModel);
                      await domainController.handleAction({
                        // actionType: "modelAction",
                        actionType: "remoteLocalCacheRollback",
                        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                        deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
                      }, defaultMiroirMetaModel);
                      await domainController.handleAction({
                        // actionType: "modelAction",
                        actionType: "remoteLocalCacheRollback",
                        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                        deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                      }, defaultMiroirMetaModel);
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
                            // actionType: "modelAction",
                            actionType: "commit",
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
                            // actionType: "modelAction",
                            actionType: "commit",
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
                          selfApplication: selfApplicationMiroir,
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
                          selfApplication: selfApplicationLibrary,
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
                    create Library SelfApplication Bundle
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
                      const query:BoxedQueryTemplateWithExtractorCombinerTransformer = {
                        queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
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
                        extractorTemplates: {
                          "select": {
                            "authors": {
                              "extractorOrCombinerType": "extractorTemplateForObjectListByEntity",
                              "parentName": "Author",
                              "parentUuid": {
                                "transformerType": "constantUuid",
                                "value": "d7a144ff-d1b9-4135-800c-a7cfc1f38733"
                              }
                            }
                          }
                        }
                      } 
                      await domainController.handleAction({
                        actionType: "runBoxedQueryTemplateOrBoxedExtractorTemplateAction",
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
