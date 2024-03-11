import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import MailIcon from '@mui/icons-material/Mail';
import InboxIcon from '@mui/icons-material/MoveToInbox';
import Divider from '@mui/material/Divider';
import MuiDrawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { CSSObject, styled, Theme, useTheme } from '@mui/material/styles';
import { Link } from 'react-router-dom';


import {
  applicationDeploymentLibrary,
  applicationDeploymentMiroir,
  DomainControllerInterface,
  DomainElementObject,
  DomainManyQueriesWithDeploymentUuid,
  menuDefaultMiroir,
  reportBookList,
  reportEntityList,
  reportMenuList,
  reportReportList,
  selectByDomainManyQueriesFromDomainState
} from "miroir-core";
import { useMemo } from 'react';
import { useDomainControllerService, useMiroirContext } from './MiroirContextReactProvider';
import { useDomainStateSelector } from './ReduxHooks';



export const drawerWidth = 200;

const openedMixin = (theme: Theme): CSSObject => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  display: 'flex',
  overflowX: 'hidden',
});

const closedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),

  // display: "flex",
  display: "none"
  // overflowX: 'hidden',
  // width: "0px",
  // width: `calc(${theme.spacing(7)} + 1px)`,
  // [theme.breakpoints.up('sm')]: {
  //   width: `calc(${theme.spacing(8)} + 1px)`,
  // },
});

const StyledDrawerHeader = styled('div')(({ theme }) => ({
  // display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

export interface ResponsiveAppBarProps {
  handleDrawerOpen: ()=>void,
  open: boolean,
  children:any,
}

// const Sidebar = MuiDrawer;
const StyledDrawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
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


const sideBarDefaultItems: any[] = [
  {
    label: "Miroir Entities",
    section: "model",
    application: applicationDeploymentMiroir.uuid,
    reportUuid: reportEntityList.uuid,
  },
  {
    label: "Miroir Reports",
    section: "data",
    application: applicationDeploymentMiroir.uuid,
    reportUuid: reportReportList.uuid,
  },
  // {
  //   label: "Miroir Menus",
  //   section: "data",
  //   application: applicationDeploymentMiroir.uuid,
  //   reportUuid: reportMenuList.uuid,
  // },
  // {
  //   label: "Library Books",
  //   section: "data",
  //   application: applicationDeploymentLibrary.uuid,
  //   reportUuid: reportBookList.uuid,
  // }
  // {
];

let count = 0;
export const Sidebar = (props: {open:boolean, setOpen: (v:boolean)=>void}) => {
  const theme = useTheme();

  const domainController: DomainControllerInterface = useDomainControllerService();
  const context = useMiroirContext();
  const miroirConfig = context.getMiroirConfig();

  const domainFetchQueryParams: DomainManyQueriesWithDeploymentUuid = useMemo(
    () => ({
      queryType: "DomainManyQueries",
      deploymentUuid: applicationDeploymentMiroir.uuid,
      applicationSection: "data",
      pageParams: { elementType: "object", elementValue: {} },
      queryParams: { elementType: "object", elementValue: {} },
      contextResults: { elementType: "object", elementValue: {} },
      fetchQuery: {
        select: {
          menus: {
            // "queryType": "selectObjectListByEntity",
            queryType: "selectObjectByDirectReference",
            parentName: "Menu",
            parentUuid: {
              referenceType: "constant",
              referenceUuid: "dde4c883-ae6d-47c3-b6df-26bc6e3c1842",
            },
            instanceUuid: {
              referenceType: "constant",
              referenceUuid: menuDefaultMiroir.uuid,
            }
          },
        },
      },
    }),
    []
  );

  const domainElementObject: DomainElementObject = useDomainStateSelector(selectByDomainManyQueriesFromDomainState, domainFetchQueryParams);
  // const defaultMiroirMenu = (domainElementObject?.elementValue?.menus?.elementValue as any)?.definition;
  console.log("Sidebar refresh", count++, "found miroir menu:", domainElementObject, (domainElementObject?.elementValue?.menus?.elementValue as any)?.definition);
  return (
    <StyledDrawer
      sx={{flexDirection:'column'}}

      variant="permanent"
      // variant="persistent"
      open={props.open}
    >
      <StyledDrawerHeader sx={{alignItems: "end"}}>
        <IconButton onClick={()=>props.setOpen(false)}>
          {theme.direction === 'ltr' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </IconButton>
      </StyledDrawerHeader>
      <Divider />
      count: {count}
      <List>
        {((domainElementObject?.elementValue?.menus?.elementValue as any)?.definition??sideBarDefaultItems).map((i: any, index: number) => (
        // {(sideBarDefaultItems).map((i: any, index: number) => (
          <ListItem key={i.label} disablePadding>
            {/* <Link to={`/report/${i.application}/${i.section}/${i.reportUuid}/xxxxxx`}> */}
              <ListItemButton
                component={Link}
                to={`/report/${i.application}/${i.section}/${i.reportUuid}/xxxxxx`}
              >
                <ListItemIcon>
                  {index % 2 === 0 ? <InboxIcon /> : <MailIcon />}
                </ListItemIcon>
                <ListItemText primary={i.label} />
              </ListItemButton>
            {/* </Link> */}
            {/* <ListItemButton>
              <ListItemIcon>
                <Link to={`/report/${i.application}/${i.section}/${i.reportUuid}/xxxxxx`}>Countries</Link>
              </ListItemIcon>
              <ListItemText primary={i.text} />
            </ListItemButton> */}
          </ListItem>
        ))}
      </List>
      {/* <List>
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
      </List> */}
      <Divider />
      {/* <List>
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
      </List> */}
      {/* </MuiDrawer> */}
    </StyledDrawer>

  )
}

