import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import MailIcon from '@mui/icons-material/Mail';
import InboxIcon from '@mui/icons-material/MoveToInbox';
import {
  Table,
  TableBody,
  TableCell,
  TableRow
} from "@mui/material";
import { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import MuiDrawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { CSSObject, styled, Theme, useTheme } from '@mui/material/styles';
import { useState } from 'react';
import { Link, Outlet, Params, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';


import { applicationDeploymentLibrary, applicationDeploymentMiroir, applicationMiroir, applicationModelBranchMiroirMasterBranch, applicationStoreBasedConfigurationMiroir, applicationVersionInitialMiroirVersion, defaultMiroirMetaModel, DomainControllerInterface } from 'miroir-core';

import { EntityInstanceLink } from './EntityInstanceLink';
import { useDomainControllerService } from './MiroirContextReactProvider';
import ResponsiveAppBar from './ResponsiveAppBar';
import { ReportUrlParamKeys } from './routes/ReportPage';
import { ReportInstanceLink } from './ReportInstanceLink';

import reportBookInstance from "../../assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/c3503412-3d8a-43ef-a168-aa36e975e606.json";
// import entityPublisher from "../../assets/library_model/";
import entityPublisher from "../../assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/a027c379-8468-43a5-ba4d-bf618be25cab.json";
import entityAuthor from "../../assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/d7a144ff-d1b9-4135-800c-a7cfc1f38733.json";
import entityBook from "../../assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/e8ba151b-d68e-4cc3-9a83-3459d309ccf5.json";
import entityTest from "../../assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/9ad64893-5f8f-4eaf-91aa-ffae110f88c8.json";
// import applicationDeploymentLibraryDeployment from "assets/library_model/35c5608a-7678-4f07-a4ec-76fc5bc35424/ab4c13c3-f476-407c-a30c-7cb62275a352.json";
import reportAuthorList from "../../assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/66a09068-52c3-48bc-b8dd-76575bbc8e72.json";
import reportBookList from "../../assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/74b010b6-afee-44e7-8590-5f0849e4a5c9.json";
import reportPublisherList from "../../assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/a77aa662-006d-46cd-9176-01f02a1a12dc.json";
import reportTestList from "../../assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/931dd036-dfce-4e47-868e-36dba3654816.json";
import entityDefinitionBook from "../../assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/797dd185-0155-43fd-b23f-f6d0af8cae06.json";
import entityDefinitionPubliser from "../../assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/7a939fe8-d119-4e7f-ab94-95b2aae30db9.json";
import entityDefinitionAuthor from "../../assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/b30b7180-f7dc-4cca-b4e8-e476b77fe61d.json";
import entityDefinitionTest from "../../assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/83872519-ce34-4a24-b1db-b7bf604ebd3a.json";

import applicationLibrary from "../../assets/library_model/a659d350-dd97-4da9-91de-524fa01745dc/5af03c98-fe5e-490b-b08f-e1230971c57f.json";
import applicationStoreBasedConfigurationLibrary from "../../assets/library_model/7990c0c9-86c3-40a1-a121-036c91b55ed7/2e5b7948-ff33-4917-acac-6ae6e1ef364f.json";
import applicationVersionLibraryInitialVersion from "../../assets/library_model/c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24/419773b4-a73c-46ca-8913-0ee27fb2ce0a.json";
import applicationModelBranchLibraryMasterBranch from "../../assets/library_model/cdb0aec6-b848-43ac-a058-fe2dbe5811f1/ad1ddc4e-556e-4598-9cff-706a2bde0be7.json";

import folio from "../../assets/library_data/a027c379-8468-43a5-ba4d-bf618be25cab/1f550a2a-33f5-4a56-83ee-302701039494.json";
import penguin from "../../assets/library_data/a027c379-8468-43a5-ba4d-bf618be25cab/516a7366-39e7-4998-82cb-80199a7fa667.json";
import springer from "../../assets/library_data/a027c379-8468-43a5-ba4d-bf618be25cab/c1c97d54-aba8-4599-883a-7fe8f3874095.json";
import author1 from "../../assets/library_data/d7a144ff-d1b9-4135-800c-a7cfc1f38733/4441169e-0c22-4fbc-81b2-28c87cf48ab2.json";
import author2 from "../../assets/library_data/d7a144ff-d1b9-4135-800c-a7cfc1f38733/ce7b601d-be5f-4bc6-a5af-14091594046a.json";
import author3 from "../../assets/library_data/d7a144ff-d1b9-4135-800c-a7cfc1f38733/d14c1c0c-eb2e-42d1-8ac1-2d58f5143c17.json";
import author4 from "../../assets/library_data/d7a144ff-d1b9-4135-800c-a7cfc1f38733/e4376314-d197-457c-aa5e-d2da5f8d5977.json";
import book1 from "../../assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/caef8a59-39eb-48b5-ad59-a7642d3a1e8f.json";
import book2 from "../../assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/e20e276b-619d-4e16-8816-b7ec37b53439.json";
import book3 from "../../assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/4cb917b3-3c53-4f9b-b000-b0e4c07a81f7.json";
import book4 from "../../assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/6fefa647-7ecf-4f83-b617-69d7d5094c37.json";
import book5 from "../../assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/c97be567-bd70-449f-843e-cd1d64ac1ddd.json";
import book6 from "../../assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/c6852e89-3c3c-447f-b827-4b5b9d830975.json";
import test1 from "../../assets/library_data/9ad64893-5f8f-4eaf-91aa-ffae110f88c8/150bacfd-06d0-4ecb-828d-f5275494448a.json";
import { uploadBooksAndReports } from './uploadBooksAndReports';

export interface RootComponentProps {
  // store:any;
  // reportName: string;
}

const drawerWidth = 200;

const openedMixin = (theme: Theme): CSSObject => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

const closedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<{
  open?: boolean;
}>(({ theme, open }) => ({
  flexGrow: 1,
  p: 3,
  padding: theme.spacing(3),
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  // marginLeft: `-${drawerWidth}px`,
  // marginLeft: `${drawerWidth}px`,
  ...(open && {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: 0,
  }),
}));

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

// const Drawer = MuiDrawer;
const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    ...(open && {
      ...openedMixin(theme),
      '& .MuiDrawer-paper': openedMixin(theme),
    }),
    ...(!open && {
      ...closedMixin(theme),
      '& .MuiDrawer-paper': closedMixin(theme),
    }),
  }),
);
// const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
//   ({ theme, open }) => ({
//     // width: drawerWidth,
//     // flexShrink: 0,
//     // whiteSpace: 'nowrap',
//     // boxSizing: 'border-box',
//     // ...(open && {
//     //   ...openedMixin(theme),
//     //   '& .MuiDrawer-paper': openedMixin(theme),
//     // }),
//     // ...(!open && {
//     //   ...closedMixin(theme),
//     //   '& .MuiDrawer-paper': closedMixin(theme),
//     // }),
//   }),
// );


export const RootComponent = (props: RootComponentProps) => {
  const params = useParams<any>() as Readonly<Params<ReportUrlParamKeys>>;
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const domainController: DomainControllerInterface = useDomainControllerService();

  return (
    <div> 
      {/* <PersistentDrawerLeft></PersistentDrawerLeft> */}
      <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <ResponsiveAppBar
        handleDrawerOpen={handleDrawerOpen}
        open = {open}
      >
      </ResponsiveAppBar>
      <Drawer
        // sx={{
        //   width: drawerWidth,
        //   flexShrink: 0,
        //   '& .MuiDrawer-paper': {
        //     width: drawerWidth,
        //     boxSizing: 'border-box',
        //   },
        // }}
        variant="permanent"
        // anchor="left"
        open={open}
      >
      {/* <MuiDrawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
        variant="persistent"
        anchor="left"
        open={open}
      > */}
        <DrawerHeader>
          <IconButton onClick={handleDrawerClose}>
            {theme.direction === 'ltr' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        </DrawerHeader>
        <Divider />
        <List>
          {['Inbox', 'Starred', 'Send email', 'Drafts'].map((text, index) => (
            <ListItem key={text} disablePadding>
              <ListItemButton>
                <ListItemIcon>
                  {index % 2 === 0 ? <InboxIcon /> : <MailIcon />}
                </ListItemIcon>
                <ListItemText primary={text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Divider />
        <List>
          {['All mail', 'Trash', 'Spam'].map((text, index) => (
            <ListItem key={text} disablePadding>
              <ListItemButton>
                <ListItemIcon>
                  {index % 2 === 0 ? <InboxIcon /> : <MailIcon />}
                </ListItemIcon>
                <ListItemText primary={text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      {/* </MuiDrawer> */}
      </Drawer>
      <Main open={open}>
        <DrawerHeader />
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
              <TableCell>
                <Link to={`/instance/${applicationDeploymentLibrary.uuid}/data/9ad64893-5f8f-4eaf-91aa-ffae110f88c8/150bacfd-06d0-4ecb-828d-f5275494448a`}>Test Instance</Link>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
          <p/>
          params: {JSON.stringify(params)}
          <p/>
          <span>
            <button
              onClick={async () => {
                console.log("fetching instances from datastore for deployment",applicationDeploymentMiroir)
                await domainController.handleDomainAction(
                  applicationDeploymentMiroir.uuid,
                  {
                    actionType: "DomainTransactionalAction",
                    actionName: "rollback",
                  }
                );
                await domainController.handleDomainAction(
                  applicationDeploymentLibrary.uuid,
                  {
                    actionType: "DomainTransactionalAction",
                    actionName: "rollback",
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
                await domainController.handleDomainAction(applicationDeploymentMiroir.uuid, {
                  actionType: "DomainTransactionalAction",
                  actionName: "initModel",
                  params: {
                    dataStoreType: "miroir",
                    metaModel: defaultMiroirMetaModel,
                    application: applicationMiroir,
                    applicationDeployment: applicationDeploymentMiroir,
                    applicationModelBranch: applicationModelBranchMiroirMasterBranch,
                    applicationStoreBasedConfiguration: applicationStoreBasedConfigurationMiroir,
                    applicationVersion: applicationVersionInitialMiroirVersion,
                  },
                });
                await domainController.handleDomainAction(applicationDeploymentLibrary.uuid, {
                  actionType: "DomainTransactionalAction",
                  actionName: "initModel",
                  params: {
                    dataStoreType: "app",
                    metaModel: defaultMiroirMetaModel,
                    application: applicationLibrary,
                    applicationDeployment: applicationDeploymentLibrary,
                    applicationModelBranch: applicationModelBranchLibraryMasterBranch,
                    applicationStoreBasedConfiguration: applicationStoreBasedConfigurationLibrary,
                    applicationVersion: applicationVersionLibraryInitialVersion,
                  },
                });
                // TODO: transactional action must not autocommit! initModel neither?!
                // .then(
                // async () => {
                console.log(
                  "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ INITMODEL DONE @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@"
                );
                await domainController.handleDomainAction(applicationDeploymentMiroir.uuid, {
                  actionType: "DomainTransactionalAction",
                  actionName: "rollback",
                });
                await domainController.handleDomainAction(applicationDeploymentLibrary.uuid, {
                  actionType: "DomainTransactionalAction",
                  actionName: "rollback",
                });
                // }
                // );
              }}
            >
              Init database
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
        <p />
        {/* <RouterProvider > */}
        {/* <RouterProvider router={router}/> */}
        <Outlet></Outlet>
        {/* </RouterProvider> */}
        {/* <HomePage></HomePage> */}
      </Main>
    </Box>
    </div> 
  );
};
