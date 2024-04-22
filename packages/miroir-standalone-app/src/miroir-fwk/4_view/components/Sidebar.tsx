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
  applicationDeploymentAdmin,
  applicationDeploymentLibrary,
  applicationDeploymentMiroir,
  DeploymentEntityState,
  DomainElementObject,
  DomainManyQueriesWithDeploymentUuid,
  getDeploymentEntityStateSelectorParams,
  getLoggerName,
  LoggerInterface,
  menuDefaultAdmin,
  menuDefaultLibrary,
  menuDefaultMiroir,
  MiroirLoggerFactory,
  MiroirSelectorQueryParams,
  QuerySelectorMap,
  QuerySelectorParams
} from "miroir-core";
import { getMemoizedDeploymentEntityStateSelectorMap } from 'miroir-localcache-redux';
import { FC, useMemo } from 'react';
import { packageName } from '../../../constants';
import { cleanLevel } from '../constants';
import { useDeploymentEntityStateQuerySelector } from '../ReduxHooks';
import { SidebarSection } from './SidebarSection';

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
export const Sidebar:FC<{open:boolean, setOpen: (v:boolean)=>void}> = (props: {open:boolean, setOpen: (v:boolean)=>void}) => {
  count++;
  const theme = useTheme();

  // const deploymentEntityStateSelectorMap: QuerySelectorMap<DeploymentEntityState> = useMemo(
  //   () => getMemoizedDeploymentEntityStateSelectorMap(),
  //   []
  // )

  // const FetchMiroirMenusQueryParams: QuerySelectorParams<DomainManyQueriesWithDeploymentUuid, DeploymentEntityState> = useMemo(
  //   () => 
  //   getDeploymentEntityStateSelectorParams<DomainManyQueriesWithDeploymentUuid>({
  //     queryType: "DomainManyQueries",
  //     deploymentUuid: applicationDeploymentMiroir.uuid,
  //     // applicationSection: "data",
  //     pageParams: { elementType: "object", elementValue: {} },
  //     queryParams: { elementType: "object", elementValue: {} },
  //     contextResults: { elementType: "object", elementValue: {} },
  //     fetchQuery: {
  //       select: {
  //         menus: {
  //           queryType: "selectObjectByDirectReference",
  //           parentName: "Menu",
  //           parentUuid: {
  //             referenceType: "constant",
  //             referenceUuid: "dde4c883-ae6d-47c3-b6df-26bc6e3c1842",
  //           },
  //           instanceUuid: {
  //             referenceType: "constant",
  //             referenceUuid: menuDefaultMiroir.uuid,
  //           }
  //         },
  //       },
  //     },
  //   }, deploymentEntityStateSelectorMap),
  //   [deploymentEntityStateSelectorMap]
  // );

  // const miroirMenusDomainElementObject: DomainElementObject = useDeploymentEntityStateQuerySelector(
  //   deploymentEntityStateSelectorMap.selectByDomainManyQueries,
  //   FetchMiroirMenusQueryParams
  // );

  // log.info("deploymentEntityStateDomainElementObject",miroirMenusDomainElementObject)
  // // const defaultMiroirMenu = (domainElementObject?.elementValue?.menus?.elementValue as any)?.definition;
  // console.log(
  //   "Sidebar refresh",
  //   count++,
  //   "found miroir menu:",
  //   miroirMenusDomainElementObject,
  //   miroirMenusDomainElementObject?.elementValue?.menus?.elementValue
  // );
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
      <SidebarSection
        deploymentUuid={applicationDeploymentMiroir.uuid}
        menuUuid={menuDefaultMiroir.uuid}
        open={props.open}
        setOpen={props.setOpen}
      >
      </SidebarSection>
      <Divider />
      <SidebarSection
        deploymentUuid={applicationDeploymentLibrary.uuid}
        menuUuid={menuDefaultLibrary.uuid}
        open={props.open}
        setOpen={props.setOpen}
      >
      </SidebarSection>
      <Divider />
      <SidebarSection
        deploymentUuid={applicationDeploymentAdmin.uuid}
        menuUuid={menuDefaultAdmin.uuid}
        open={props.open}
        setOpen={props.setOpen}
      >
      </SidebarSection>

        {/* {sideBarDefaultItems.map((i: any, index: number) => ( */}
        {/* TODO: DRY the menuSection display!*/}
        {/* {
          !(miroirMenusDomainElementObject?.elementValue?.menus?.elementValue as any)?.definition?.menuType ||
          (miroirMenusDomainElementObject?.elementValue?.menus?.elementValue as any)?.definition?.menuType == "simpleMenu"?
          <List disablePadding dense>
            {(
              (miroirMenusDomainElementObject?.elementValue?.menus?.elementValue as any)?.definition?.definition ?? sideBarDefaultItems
              ).map((i: any, index: number) => (
              <ListItem key={i.label} disablePadding>
                <ListItemButton sx={{padding: 0}} component={Link} to={`/report/${i.application}/${i.section}/${i.reportUuid}/xxxxxx`}>
                  <ListItemIcon>
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
              (miroirMenusDomainElementObject?.elementValue?.menus?.elementValue as any)?.definition?.definition ?? []
              ).flatMap((menuSection: any, index: number) => (
                menuSection.items.map(
                  (curr:any, index: number) => (
                    <ListItem key={curr.label + index} disablePadding>
                      <ListItemButton component={Link} to={`/report/${curr.application}/${curr.section}/${curr.reportUuid}/xxxxxx`}>
                        <ListItemIcon>
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
        } */}
      <Divider />
    </StyledDrawer>
  );
}

