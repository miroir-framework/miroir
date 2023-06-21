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
import {
  Link, Params, useParams
} from "react-router-dom";


import { ApplicationDeployment, applicationDeploymentMiroir, DomainControllerInterface } from 'miroir-core';
import { Outlet } from 'react-router-dom';
import { useDomainControllerServiceHook } from './MiroirContextReactProvider';
import ResponsiveAppBar from './ResponsiveAppBar';
import { ReportUrlParamKeys } from './routes/ReportPage';

// duplicated from server!!!!!!!!
const applicationDeploymentLibrary: ApplicationDeployment = {
  "uuid":"f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
  "parentName":"ApplicationDeployment",
  "parentUuid":"35c5608a-7678-4f07-a4ec-76fc5bc35424",
  "type":"singleNode",
  "name":"LibraryApplicationPostgresDeployment",
  "application":"5af03c98-fe5e-490b-b08f-e1230971c57f",
  "description": "The default Postgres Deployment for Application Library",
  "applicationModelLevel": "model",
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

  const domainController: DomainControllerInterface = useDomainControllerServiceHook();

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
                <Link to={`/home`}>Home</Link>
              </TableCell>
              <TableCell>
                {/* <Link to={`/report/f714bb2f-a12d-4e71-a03b-74dcedea6eb4/data/66a09068-52c3-48bc-b8dd-76575bbc8e72`}>Authors</Link> */}
                <Link to={`/report/f714bb2f-a12d-4e71-a03b-74dcedea6eb4/data/74b010b6-afee-44e7-8590-5f0849e4a5c9`}>Books</Link>
              </TableCell>
              <TableCell>
                {/* <Link to={`/instance/f714bb2f-a12d-4e71-a03b-74dcedea6eb4/data/d7a144ff-d1b9-4135-800c-a7cfc1f38733/4441169e-0c22-4fbc-81b2-28c87cf48ab2`}>Author</Link> */}
                <Link to={`/instance/f714bb2f-a12d-4e71-a03b-74dcedea6eb4/data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/caef8a59-39eb-48b5-ad59-a7642d3a1e8f`}>Book</Link>
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
