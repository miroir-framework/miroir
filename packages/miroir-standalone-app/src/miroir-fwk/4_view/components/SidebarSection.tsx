import { FC, useMemo } from 'react';
// import ChevronLeft from '@mui/icons-material/ChevronLeft';
// import ChevronRight from '@mui/icons-material/ChevronRight';
import AutoStories from '@mui/icons-material/AutoStories';
import { CSSObject, styled, Theme, useTheme } from '@mui/material/styles';
import { Icon } from '@mui/material';
import Divider from '@mui/material/Divider';
import MuiDrawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import SavedSearch from '@mui/icons-material/SavedSearch.js';
import { Link } from 'react-router-dom';


import {
  adminConfigurationDeploymentMiroir,
  DeploymentEntityState,
  Domain2QueryReturnType,
  entityMenu,
  getApplicationSection,
  getQueryRunnerParamsForDeploymentEntityState,
  LoggerInterface,
  MiroirLoggerFactory,
  SyncBoxedExtractorOrQueryRunnerMap,
  SyncQueryRunnerParams,
  Uuid
} from "miroir-core";
import { getMemoizedDeploymentEntityStateSelectorMap } from 'miroir-localcache-redux';
import { packageName } from '../../../constants.js';
import { cleanLevel } from '../constants.js';
import { useDeploymentEntityStateQuerySelector } from '../ReduxHooks.js';

const MatDivider: any = Divider;
const MatList: any = List;
const MatListItem: any = ListItem;
const MatListItemButton: any = ListItemButton;
const MatListItemIcon: any = ListItemIcon;
const MatListItemText: any = ListItemText;

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "Sidebar")
).then((logger: LoggerInterface) => {log = logger});



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
  display: "none"
});

export interface ResponsiveAppBarProps {
  handleDrawerOpen: ()=>void,
  open: boolean,
  children:any,
}

// const Sidebar = MuiDrawer;
const StyledDrawer = styled(MuiDrawer as any, { shouldForwardProp: (prop) => prop !== 'open' })(
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
    selfApplication: adminConfigurationDeploymentMiroir.uuid,
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
export interface SidebarSectionProps {deploymentUuid: Uuid, menuUuid: Uuid, open:boolean, setOpen: (v:boolean)=>void};
export const SidebarSection:FC<SidebarSectionProps> = (props: SidebarSectionProps) => {
  count++;
  const theme = useTheme();

  // const domainController: DomainControllerInterface = useDomainControllerService();
  // const miroirConfig = context.getMiroirConfig();
  // const context = useMiroirContext();

  const deploymentEntityStateSelectorMap: SyncBoxedExtractorOrQueryRunnerMap<DeploymentEntityState> = useMemo(
    () => getMemoizedDeploymentEntityStateSelectorMap(),
    []
  )

  const fetchDeploymentMenusQueryParams: SyncQueryRunnerParams<DeploymentEntityState> = useMemo(
    () => 
    getQueryRunnerParamsForDeploymentEntityState({
      queryType: "boxedQueryWithExtractorCombinerTransformer",
      deploymentUuid: props.deploymentUuid,
      pageParams: {},
      queryParams: {},
      contextResults: {},
      extractors: {
        menus: {
          extractorOrCombinerType: "extractorForObjectByDirectReference",
          parentName: "Menu",
          applicationSection: getApplicationSection(props.deploymentUuid,entityMenu.uuid),
          parentUuid: entityMenu.uuid,
          instanceUuid: props.menuUuid,
        },
      },
    }, deploymentEntityStateSelectorMap),
    [deploymentEntityStateSelectorMap]
  );

  log.info("fetchDeploymentMenusQueryParams",fetchDeploymentMenusQueryParams)
  const miroirMenusDomainElementObject: Domain2QueryReturnType<Domain2QueryReturnType<Record<string,any>>> = useDeploymentEntityStateQuerySelector(
    deploymentEntityStateSelectorMap.runQuery,
    fetchDeploymentMenusQueryParams
  );

  log.info("deploymentEntityStateDomainElementObject",miroirMenusDomainElementObject)
  console.log(
    "SidebarSection refresh",
    count++,
    "found miroir menu:",
    miroirMenusDomainElementObject,
    // miroirMenusDomainElementObject?.elementValue
  );
  const drawerSx = useMemo(()=>({flexDirection:'column'}),[])
  const styledDrawerSx = useMemo(()=>({alignItems: "end"}),[])



  return (
    <>
      {
        miroirMenusDomainElementObject.elementType == "failure"
        ?
        <MatList disablePadding dense>
          <MatListItem key={"failed"} disablePadding>
            <MatListItemButton>
              <MatListItemIcon>
                {/* {index % 2 === 0 ? <InboxIcon /> : <MailIcon />} */}
                <Icon>error</Icon>
              </MatListItemIcon>
              <MatListItemText primary="Failed to load menu" />
            </MatListItemButton>
          </MatListItem>
        </MatList>
        :
        <>
          {
          !((miroirMenusDomainElementObject as any)?.menus as any)?.definition?.menuType ||
          ((miroirMenusDomainElementObject as any)?.menus as any)?.definition?.menuType == "simpleMenu"?
          <MatList disablePadding dense>
            {(
              ((miroirMenusDomainElementObject as any)?.menus as any)?.definition?.definition ?? sideBarDefaultItems
              ).map((i: any, index: number) => (
              <MatListItem key={i.label} disablePadding>
                <MatListItemButton sx={{padding: 0}} component={Link} to={`/report/${i.selfApplication}/${i.section}/${i.reportUuid}/xxxxxx`}>
                  <MatListItemIcon>
                    {/* {index % 2 === 0 ? <InboxIcon /> : <MailIcon />} */}
                    <Icon>{i.icon}</Icon>
                  </MatListItemIcon>
                  <MatListItemText primary={i.label} />
                </MatListItemButton>
              </MatListItem>
            ))}
          </MatList>
          :
          <MatList disablePadding dense>
            {(
              ((miroirMenusDomainElementObject as any)?.menus as any)?.definition?.definition ?? []
              ).flatMap((menuSection: any, index: number) => (
                menuSection.items.map(
                  (curr:any, index: number) => (
                    <MatListItem key={curr.label + index} disablePadding>
                      <MatListItemButton component={Link} to={`/report/${curr.selfApplication}/${curr.section}/${curr.reportUuid}/xxxxxx`}>
                        <MatListItemIcon>
                          {/* {index % 2 === 0 ? <InboxIcon /> : <MailIcon />} */}
                          <Icon>{curr.icon}</Icon>
                        </MatListItemIcon>
                        <MatListItemText primary={curr.label} />
                      </MatListItemButton>
                    </MatListItem>
                  ), 
                ).concat([<MatDivider key={menuSection.label + "Divider"}/>])
              )
            )}
          </MatList>
          }
        </>
      }
    </>
  );
}

