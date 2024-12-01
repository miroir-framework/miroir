// import ChevronLeft from '@mui/icons-material/ChevronLeft';
// import ChevronRight from '@mui/icons-material/ChevronRight';
import Divider from '@mui/material/Divider';
import MuiDrawer from '@mui/material/Drawer';
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
  adminConfigurationDeploymentMiroir,
  DeploymentEntityState,
  DomainElementObjectOrFailed,
  entityMenu,
  QueryWithExtractorCombinerTransformer,
  getApplicationSection,
  getExtractorOrQueryRunnerParamsForDeploymentEntityState,
  getLoggerName,
  LoggerInterface,
  MiroirLoggerFactory,
  SyncExtractorOrQueryRunnerMap,
  SyncExtractorOrQueryRunnerParams,
  Uuid
} from "miroir-core";
import { getMemoizedDeploymentEntityStateSelectorMap } from 'miroir-localcache-redux';
import { FC, useMemo } from 'react';
import { packageName } from '../../../constants.js';
import { cleanLevel } from '../constants.js';
import { useDeploymentEntityStateQuerySelector } from '../ReduxHooks.js';

const MatDivider: any = Divider;
const MatList: any = List;
const MatListItem: any = ListItem;
const MatListItemButton: any = ListItemButton;
const MatListItemIcon: any = ListItemIcon;
const MatListItemText: any = ListItemText;

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
    application: adminConfigurationDeploymentMiroir.uuid,
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

  const deploymentEntityStateSelectorMap: SyncExtractorOrQueryRunnerMap<DeploymentEntityState> = useMemo(
    () => getMemoizedDeploymentEntityStateSelectorMap(),
    []
  )

  const fetchDeploymentMenusQueryParams: SyncExtractorOrQueryRunnerParams<QueryWithExtractorCombinerTransformer, DeploymentEntityState> = useMemo(
    () => 
    getExtractorOrQueryRunnerParamsForDeploymentEntityState<QueryWithExtractorCombinerTransformer>({
      queryType: "queryWithExtractorCombinerTransformer",
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
  const miroirMenusDomainElementObject: DomainElementObjectOrFailed = useDeploymentEntityStateQuerySelector(
    deploymentEntityStateSelectorMap.runQuery,
    fetchDeploymentMenusQueryParams
  );

  log.info("deploymentEntityStateDomainElementObject",miroirMenusDomainElementObject)
  // const defaultMiroirMenu = (domainElementObject?.elementValue?.menus?.elementValue as any)?.definition;
  console.log(
    "SidebarSection refresh",
    count++,
    "found miroir menu:",
    miroirMenusDomainElementObject,
    miroirMenusDomainElementObject?.elementValue
  );
  const drawerSx = useMemo(()=>({flexDirection:'column'}),[])
  const styledDrawerSx = useMemo(()=>({alignItems: "end"}),[])


  // const dynIcon = React.createElement(AutoStories, {});
  // <StyledDrawer
  //   sx={drawerSx}
  //   variant="permanent"
  //   // variant="persistent"
  //   open={props.open}
  // >
  //   <StyledDrawerHeader sx={styledDrawerSx}>
  //     <IconButton onClick={() => props.setOpen(false)}>
  //       {theme.direction === "ltr" ? <ChevronLeftIcon /> : <ChevronRightIcon />}
  //     </IconButton>
  //   </StyledDrawerHeader>
  //   count: {count}
  //   <Divider />

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
          !(miroirMenusDomainElementObject?.elementValue?.menus as any)?.definition?.menuType ||
          (miroirMenusDomainElementObject?.elementValue?.menus as any)?.definition?.menuType == "simpleMenu"?
          <MatList disablePadding dense>
            {(
              (miroirMenusDomainElementObject?.elementValue?.menus as any)?.definition?.definition ?? sideBarDefaultItems
              ).map((i: any, index: number) => (
              <MatListItem key={i.label} disablePadding>
                <MatListItemButton sx={{padding: 0}} component={Link} to={`/report/${i.application}/${i.section}/${i.reportUuid}/xxxxxx`}>
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
              (miroirMenusDomainElementObject?.elementValue?.menus as any)?.definition?.definition ?? []
              ).flatMap((menuSection: any, index: number) => (
                menuSection.items.map(
                  (curr:any, index: number) => (
                    <MatListItem key={curr.label + index} disablePadding>
                      <MatListItemButton component={Link} to={`/report/${curr.application}/${curr.section}/${curr.reportUuid}/xxxxxx`}>
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

