import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
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


import { AutoStories } from '@mui/icons-material';
import { Icon } from '@mui/material';
import {
  applicationDeploymentMiroir,
  DeploymentEntityState,
  DomainElementObject,
  DomainManyQueriesWithDeploymentUuid,
  getDeploymentEntityStateSelectorParams,
  getLoggerName,
  LoggerInterface,
  menuDefaultMiroir,
  MiroirLoggerFactory,
  MiroirSelectorQueryParams,
  QuerySelectorMap,
  QuerySelectorParams
} from "miroir-core";
import { getMemoizedDeploymentEntityStateSelectorMap } from 'miroir-localcache-redux';
import { useMemo } from 'react';
import { packageName } from '../../constants';
import { cleanLevel } from './constants';
import { useDeploymentEntityStateQuerySelector } from './ReduxHooks';

const loggerName: string = getLoggerName(packageName, cleanLevel,"Sidebar");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
  (value: LoggerInterface) => {
    log = value;
  }
);


export const SidebarWidth = 200;

const openedMixin = (theme: Theme): CSSObject => ({
  width: SidebarWidth,
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
    width: SidebarWidth,
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


const sideBarDefaultItems = [
  {
    label: "A Menu will be displayed here!",
    section: "model",
    application: applicationDeploymentMiroir.uuid,
    reportUuid: "",
    "icon": "south",
  },
  // {
  //   label: "Miroir Entities",
  //   section: "model",
  //   application: applicationDeploymentMiroir.uuid,
  //   reportUuid: reportEntityList.uuid,
  //   "icon": "category",
  // },
  // {
  //   label: "Miroir Reports",
  //   section: "data",
  //   application: applicationDeploymentMiroir.uuid,
  //   reportUuid: reportReportList.uuid,
  // },
  // {
  //   label: "Miroir Menus",
  //   section: "data",
  //   application: applicationDeploymentMiroir.uuid,
  //   reportUuid: reportMenuList.uuid,
  //   "icon": "category",
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
const muiIcons = {
  "AutoStories": AutoStories
}
// interface IconProps {
//   icon?: keyof typeof MUIcon;
// }
// const IconComp: React.FC<IconProps> = ({
//  icon,
// }) => {
//    const Icon = icon && MUIcon[icon];
//    return ({Icon && <Icon />})
// }
export const Sidebar = (props: {open:boolean, setOpen: (v:boolean)=>void}) => {
  count++;
  const theme = useTheme();

  // const domainController: DomainControllerInterface = useDomainControllerService();
  // const miroirConfig = context.getMiroirConfig();
  // const context = useMiroirContext();

  const deploymentEntityStateSelectorMap: QuerySelectorMap<DeploymentEntityState> = useMemo(
    () => getMemoizedDeploymentEntityStateSelectorMap(),
    []
  )

  const deploymentEntityStateFetchQueryParams: QuerySelectorParams<DomainManyQueriesWithDeploymentUuid, DeploymentEntityState> = useMemo(
    () => 
    getDeploymentEntityStateSelectorParams<DomainManyQueriesWithDeploymentUuid>({
      queryType: "DomainManyQueries",
      deploymentUuid: applicationDeploymentMiroir.uuid,
      // applicationSection: "data",
      pageParams: { elementType: "object", elementValue: {} },
      queryParams: { elementType: "object", elementValue: {} },
      contextResults: { elementType: "object", elementValue: {} },
      fetchQuery: {
        select: {
          menus: {
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
    }, deploymentEntityStateSelectorMap),
    [deploymentEntityStateSelectorMap]
  );

  const deploymentEntityStateDomainElementObject: DomainElementObject = useDeploymentEntityStateQuerySelector(
    deploymentEntityStateSelectorMap.selectByDomainManyQueries,
    deploymentEntityStateFetchQueryParams
  );

  log.info("deploymentEntityStateDomainElementObject",deploymentEntityStateDomainElementObject)
  // const defaultMiroirMenu = (domainElementObject?.elementValue?.menus?.elementValue as any)?.definition;
  console.log(
    "Sidebar refresh",
    count++,
    "found miroir menu:",
    deploymentEntityStateDomainElementObject,
    deploymentEntityStateDomainElementObject?.elementValue?.menus?.elementValue
  );
  const drawerSx = useMemo(()=>({flexDirection:'column'}),[])
  const styledDrawerSx = useMemo(()=>({alignItems: "end"}),[])


  // const dynIcon = React.createElement(AutoStories, {});

  return (
    <StyledDrawer
      sx={drawerSx}
      variant="permanent"
      // variant="persistent"
      open={props.open}
    >
      <StyledDrawerHeader sx={styledDrawerSx}>
        <IconButton onClick={() => props.setOpen(false)}>
          {theme.direction === "ltr" ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </IconButton>
      </StyledDrawerHeader>
      count: {count}
      <Divider />
        {/* {sideBarDefaultItems.map((i: any, index: number) => ( */}
        {/* TODO: DRY the menuSection display!*/}
        {
          !(deploymentEntityStateDomainElementObject?.elementValue?.menus?.elementValue as any)?.definition?.menuType ||
          (deploymentEntityStateDomainElementObject?.elementValue?.menus?.elementValue as any)?.definition?.menuType == "simpleMenu"?
          <List disablePadding dense>
            {(
              (deploymentEntityStateDomainElementObject?.elementValue?.menus?.elementValue as any)?.definition?.definition ?? sideBarDefaultItems
              ).map((i: any, index: number) => (
              <ListItem key={i.label} disablePadding>
                <ListItemButton sx={{padding: 0}} component={Link} to={`/report/${i.application}/${i.section}/${i.reportUuid}/xxxxxx`}>
                  <ListItemIcon>
                    {/* {index % 2 === 0 ? <InboxIcon /> : <MailIcon />} */}
                    <Icon>{i.icon}</Icon>
                  </ListItemIcon>
                  <ListItemText primary={i.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          :
          <List disablePadding dense>
            {(
              (deploymentEntityStateDomainElementObject?.elementValue?.menus?.elementValue as any)?.definition?.definition ?? []
              ).flatMap((menuSection: any, index: number) => (
                menuSection.items.map(
                  (curr:any, index: number) => (
                    <ListItem key={curr.label + index} disablePadding>
                      <ListItemButton component={Link} to={`/report/${curr.application}/${curr.section}/${curr.reportUuid}/xxxxxx`}>
                        <ListItemIcon>
                          {/* {index % 2 === 0 ? <InboxIcon /> : <MailIcon />} */}
                          <Icon>{curr.icon}</Icon>
                        </ListItemIcon>
                        <ListItemText primary={curr.label} />
                      </ListItemButton>
                    </ListItem>
                  ), 
                ).concat([<Divider key={menuSection.label + "Divider"}/>])
              )
            )}
          </List>
        }
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
  );
}

