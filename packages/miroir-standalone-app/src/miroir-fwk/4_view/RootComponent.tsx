import {
  Grid,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Toolbar
} from "@mui/material";
import { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import { styled } from '@mui/material/styles';
import { useState } from 'react';
import { Link, Outlet, Params, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';


import {
  applicationDeploymentLibrary,
  applicationDeploymentMiroir,
  applicationLibrary,
  applicationMiroir,
  applicationModelBranchLibraryMasterBranch,
  applicationModelBranchMiroirMasterBranch,
  applicationStoreBasedConfigurationLibrary,
  applicationStoreBasedConfigurationMiroir,
  applicationVersionInitialMiroirVersion,
  applicationVersionLibraryInitialVersion,
  defaultMiroirMetaModel,
  DomainControllerInterface,
  getLoggerName,
  LoggerInterface,
  MiroirConfigForRestClient,
  MiroirLoggerFactory,
  RemoteStoreInterface,
  reportBookInstance,
} from "miroir-core";

import { useDomainControllerService, useMiroirContext } from './MiroirContextReactProvider';
import ResponsiveAppBar from './ResponsiveAppBar';
import { ReportUrlParamKeys } from './routes/ReportPage';

import { packageName } from '../../constants';
import { cleanLevel } from './constants';
import { uploadBooksAndReports } from './uploadBooksAndReports';
import { Drawer, drawerWidth } from "./Drawer";

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
  // marginLeft: `-${drawerWidth}px`,
  // marginLeft: `${drawerWidth}px`,
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
  {shouldForwardProp: (prop) => prop !== "open"}
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
    //     // marginLeft: `-${drawerWidth}px`,
    //     // marginLeft: `240px`,
    //   }
    // ),
    ...(
      open && {
        width: `calc(100% - ${drawerWidth}px)`,
        marginLeft: `${drawerWidth}px`,
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

export const RootComponent = (props: RootComponentProps) => {
  const params = useParams<any>() as Readonly<Params<ReportUrlParamKeys>>;
  const [drawerIsOpen, setDrawerIsOpen] = useState(false);

  const handleDrawerOpen = () => {
    setDrawerIsOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerIsOpen(false);
  };

  const domainController: DomainControllerInterface = useDomainControllerService();
  const context = useMiroirContext();
  const miroirConfig = context.getMiroirConfig();

  return (
    <div> 
      {/* <PersistentDrawerLeft></PersistentDrawerLeft> */}
      {/* <Box sx={{ display: 'flex', flexDirection:"column", flexGrow: 1 }}> */}
      <Box sx={{ display: 'flex', flexGrow: 1,flexDirection:"column" }}>
      {/* <CssBaseline /> */}
      <Grid
        container
        direction="column"
      >
        <Grid
          item
        >
          <ResponsiveAppBar
            handleDrawerOpen={handleDrawerOpen}
            open = {drawerIsOpen}
          >
            Bar!
          </ResponsiveAppBar>
          <Toolbar />
        </Grid>
        <Grid
          item container
        >
          <Grid
            item
          >
          <Drawer
            open={drawerIsOpen}
            setOpen={setDrawerIsOpen}
          ></Drawer>
          </Grid>
          <Grid
            item
          >
            <StyledMain
              open = {drawerIsOpen}
            >
              <div>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        new uuid: {uuidv4()}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Link to={`/home`}>Home</Link>
                      </TableCell>
                      <TableCell>
                        {/* <Link to={`/report/${applicationDeploymentLibrary.uuid}/data/66a09068-52c3-48bc-b8dd-76575bbc8e72`}>Authors</Link> */}
                        <Link to={`/report/${applicationDeploymentLibrary.uuid}/data/${reportBookInstance.uuid}/caef8a59-39eb-48b5-ad59-a7642d3a1e8f`}>Book Instance (NEW)</Link>
                        {/* <Link to={`/report/${applicationDeploymentLibrary.uuid}/data/74b010b6-afee-44e7-8590-5f0849e4a5c9`}>Books (intermediate)</Link> */}
                      </TableCell>
                      <TableCell>
                        {/* <Link to={`/report/${applicationDeploymentLibrary.uuid}/data/66a09068-52c3-48bc-b8dd-76575bbc8e72`}>Authors</Link> */}
                        {/* <Link to={`/report/${applicationDeploymentLibrary.uuid}/data/${reportBookList.uuid}/caef8a59-39eb-48b5-ad59-a7642d3a1e8f`}>Books (intermediate)</Link> */}
                        <Link to={`/report/${applicationDeploymentLibrary.uuid}/data/08176cc7-43ae-4fca-91b7-bf869d19e4b9/xxxxxx`}>Countries</Link>
                        {/* <Link to={`/report/${applicationDeploymentLibrary.uuid}/data/74b010b6-afee-44e7-8590-5f0849e4a5c9`}>Books (intermediate)</Link> */}
                      </TableCell>
                      <TableCell>
                        {/* <Link to={`/instance/${applicationDeploymentLibrary.uuid}/data/d7a144ff-d1b9-4135-800c-a7cfc1f38733/4441169e-0c22-4fbc-81b2-28c87cf48ab2`}>Author</Link> */}
                        {/* <Link to={`/instance/${applicationDeploymentLibrary.uuid}/data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/caef8a59-39eb-48b5-ad59-a7642d3a1e8f`}>Book</Link> */}
                        {/* <Link to={`/instance/${applicationDeploymentLibrary.uuid}/data/a027c379-8468-43a5-ba4d-bf618be25cab/516a7366-39e7-4998-82cb-80199a7fa667`}>Folio</Link> */}
                        <Link to={`/report/${applicationDeploymentLibrary.uuid}/data/6d9faa54-643c-4aec-87c3-32635ad95902/ce7b601d-be5f-4bc6-a5af-14091594046a`}>Paul Veyne</Link>
                        {/* <ReportInstanceLink
                          deploymentUuid={applicationDeploymentLibrary.uuid}
                          applicationSection="data"
                          reportUuid="d7a144ff-d1b9-4135-800c-a7cfc1f38733"
                          instanceUuid="ce7b601d-be5f-4bc6-a5af-14091594046a"
                        ></ReportInstanceLink> */}
                        {/* <EntityInstanceLink
                          deploymentUuid={applicationDeploymentLibrary.uuid}
                          applicationSection="data"
                          entityUuid="d7a144ff-d1b9-4135-800c-a7cfc1f38733"
                          instanceUuid="ce7b601d-be5f-4bc6-a5af-14091594046a"
                        ></EntityInstanceLink> */}
                      </TableCell>
                      <TableCell>
                        {/* <Link to={`/instance/${applicationDeploymentLibrary.uuid}/data/d7a144ff-d1b9-4135-800c-a7cfc1f38733/4441169e-0c22-4fbc-81b2-28c87cf48ab2`}>Author</Link> */}
                        {/* <Link to={`/instance/${applicationDeploymentLibrary.uuid}/data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/caef8a59-39eb-48b5-ad59-a7642d3a1e8f`}>Book</Link> */}
                        <Link to={`/instance/${applicationDeploymentLibrary.uuid}/data/a027c379-8468-43a5-ba4d-bf618be25cab/516a7366-39e7-4998-82cb-80199a7fa667`}>Folio</Link>
                      </TableCell>
                      <TableCell>
                        {/* <Link to={`/instance/${applicationDeploymentLibrary.uuid}/data/d7a144ff-d1b9-4135-800c-a7cfc1f38733/4441169e-0c22-4fbc-81b2-28c87cf48ab2`}>Author</Link> */}
                        {/* <Link to={`/instance/${applicationDeploymentLibrary.uuid}/data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/caef8a59-39eb-48b5-ad59-a7642d3a1e8f`}>Book</Link> */}
                        <Link to={`/instance/${applicationDeploymentLibrary.uuid}/data/a027c379-8468-43a5-ba4d-bf618be25cab/1f550a2a-33f5-4a56-83ee-302701039494`}>Penguin</Link>
                      </TableCell>
                      <TableCell>
                        {/* <Link to={`/instance/${applicationDeploymentLibrary.uuid}/data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/caef8a59-39eb-48b5-ad59-a7642d3a1e8f`}>Et dans l'éternité</Link> */}
                        <Link to={`/report/${applicationDeploymentLibrary.uuid}/data/c3503412-3d8a-43ef-a168-aa36e975e606/caef8a59-39eb-48b5-ad59-a7642d3a1e8f`}>Et dans l'éternité</Link>
                      </TableCell>
                      {/* <TableCell>
                        <Link to={`/instance/${applicationDeploymentLibrary.uuid}/data/9ad64893-5f8f-4eaf-91aa-ffae110f88c8/150bacfd-06d0-4ecb-828d-f5275494448a`}>Test Instance</Link>
                      </TableCell> */}
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
                <p/>
                params: {JSON.stringify(params)}
                <p/>
                <span>
                  <button
                    onClick={async () => {
                      log.info("fetching instances from datastore for deployment",applicationDeploymentMiroir)
                      await domainController.handleAction(
                        {
                          actionType: "modelAction",
                          actionName: "rollback",
                          endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                          deploymentUuid:applicationDeploymentMiroir.uuid,
                        }
                      );
                      await domainController.handleAction(
                        {
                          actionType: "modelAction",
                          actionName: "rollback",
                          endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                          deploymentUuid:applicationDeploymentLibrary.uuid,
                        }
                      );
                    }
                  }
                  >
                    fetch Miroir & App configurations from database
                  </button>
                <p />
                <span>
                <button
                    onClick={async () => {
                      const remoteStore:RemoteStoreInterface = domainController.getRemoteStore();
                      if (!miroirConfig) {
                        throw new Error("no miroirConfig given, it has to be given on the command line starting the server!");
                      }
                      if (miroirConfig && miroirConfig.client.emulateServer) {
                        await remoteStore.handleRemoteStoreAction("",{
                          actionType: "storeManagementAction",
                          actionName: "openStore",
                          endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
                          configuration: {
                            [applicationDeploymentMiroir.uuid]: miroirConfig.client.miroirServerConfig,
                            [applicationDeploymentLibrary.uuid]: miroirConfig.client.appServerConfig,
                          },
                          deploymentUuid: applicationDeploymentMiroir.uuid,
                        })
                      } else {
                        const localMiroirConfig = miroirConfig.client as MiroirConfigForRestClient;
                        await remoteStore.handleRemoteStoreAction("",{
                          actionType: "storeManagementAction",
                          actionName: "openStore",
                          endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
                          configuration: {
                            [applicationDeploymentMiroir.uuid]: localMiroirConfig.serverConfig.storeSectionConfiguration.miroirServerConfig,
                            [applicationDeploymentLibrary.uuid]: localMiroirConfig.serverConfig.storeSectionConfiguration.appServerConfig,
                          },
                          deploymentUuid: applicationDeploymentMiroir.uuid,
                        })
                      }

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
                    Open database
                  </button>
                  <button
                    onClick={async () => {
                      const remoteStore:RemoteStoreInterface = domainController.getRemoteStore();
                      if (!miroirConfig) {
                        throw new Error("no miroirConfig given, it has to be given on the command line starting the server!");
                      }
                      if (miroirConfig && miroirConfig.client.emulateServer) {
                        await remoteStore.handleRemoteStoreAction("",{
                          actionType: "storeManagementAction",
                          actionName: "openStore",
                          endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
                          configuration: {
                            [applicationDeploymentMiroir.uuid]: miroirConfig.client.miroirServerConfig,
                            [applicationDeploymentLibrary.uuid]: miroirConfig.client.appServerConfig,
                          },
                          deploymentUuid: applicationDeploymentMiroir.uuid,
                        })
                      } else {
                        const localMiroirConfig = miroirConfig.client as MiroirConfigForRestClient;
                        await remoteStore.handleRemoteStoreAction("",{
                          actionType: "storeManagementAction",
                          actionName: "openStore",
                          endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
                          configuration: {
                            [applicationDeploymentMiroir.uuid]: localMiroirConfig.serverConfig.storeSectionConfiguration.miroirServerConfig,
                            [applicationDeploymentLibrary.uuid]: localMiroirConfig.serverConfig.storeSectionConfiguration.appServerConfig,
                          },
                          deploymentUuid: applicationDeploymentMiroir.uuid,
                        })
                      }

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
                  </button>
                  <button
                    onClick={async () => {
                      log.info("creating bundle")
                      const remoteStore:RemoteStoreInterface = domainController.getRemoteStore();
                      await remoteStore.handleRemoteStoreAction("",{
                        actionType: "bundleAction",
                        actionName: "createBundle",
                      })
                    }
                  }
                  >
                    create bundle
                  </button>
                </span>
                <p />
                <span>
                  <button
                    onClick={async () => {
                      await uploadBooksAndReports(domainController, defaultMiroirMetaModel);
                    }}
                  >
                    upload App configuration to database
                  </button>
                </span>
                </span>
                <p/>
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
