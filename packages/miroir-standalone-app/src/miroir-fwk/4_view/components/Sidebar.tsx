import ChevronLeftIcon from '@mui/icons-material/ChevronLeft.js';
import ChevronRightIcon from '@mui/icons-material/ChevronRight.js';
import Divider from '@mui/material/Divider';
import MuiDrawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import { CSSObject, styled, Theme, useTheme } from '@mui/material/styles';


import { AutoStories } from '@mui/icons-material';
import {
  adminConfigurationDeploymentAdmin,
  adminConfigurationDeploymentLibrary,
  adminConfigurationDeploymentMiroir,
  getLoggerName,
  LoggerInterface,
  menuDefaultAdmin,
  menuDefaultLibrary,
  menuDefaultMiroir,
  MiroirLoggerFactory
} from "miroir-core";
import { FC, useMemo } from 'react';
import { packageName } from '../../../constants.js';
import { cleanLevel } from '../constants.js';
import { SidebarSection } from './SidebarSection.js';
import { adminConfigurationDeploymentParis, defaultMenuParisUuid } from '../routes/ReportPage.js';

const loggerName: string = getLoggerName(packageName, cleanLevel,"Sidebar");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
  (value: LoggerInterface) => {
    log = value;
  }
);


export const SidebarWidth = 200;

const LocalMuiDrawer: any = MuiDrawer;
const LocalIconButton:any = IconButton;
const LocalDivider:any = Divider;
const LocalChevronLeftIcon:any = ChevronLeftIcon;
const LocalChevronRightIcon:any = ChevronRightIcon;

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
const StyledDrawer = styled(LocalMuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
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
export const Sidebar:FC<{open:boolean, setOpen: (v:boolean)=>void}> = (props: {open:boolean, setOpen: (v:boolean)=>void}) => {
  count++;
  const theme = useTheme();

  // const deploymentEntityStateSelectorMap: SyncExtractorRunnerMap<DeploymentEntityState> = useMemo(
  //   () => getMemoizedDeploymentEntityStateSelectorMap(),
  //   []
  // )

  // const FetchMiroirMenusQueryParams: SyncExtractorRunnerParams<ExtractorForRecordOfExtractors, DeploymentEntityState> = useMemo(
  //   () => 
  //   getDeploymentEntityStateSelectorParams<ExtractorForRecordOfExtractors>({
  //     queryType: "extractorForRecordOfExtractors",
  //     deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
  //     // applicationSection: "data",
  //     pageParams: { elementType: "object", elementValue: {} },
  //     queryParams: { elementType: "object", elementValue: {} },
  //     contextResults: { elementType: "object", elementValue: {} },
  //     extractors: {
  //       select: {
  //         menus: {
  //           queryType: "selectObjectByDirectReference",
  //           parentName: "Menu",
  //           parentUuid: {
  //             queryTemplateType: "constantUuid",
  //             constantUuidValue: "dde4c883-ae6d-47c3-b6df-26bc6e3c1842",
  //           },
  //           instanceUuid: {
  //             queryTemplateType: "constantUuid",
  //             constantUuidValue: menuDefaultMiroir.uuid,
  //           }
  //         },
  //       },
  //     },
  //   }, deploymentEntityStateSelectorMap),
  //   [deploymentEntityStateSelectorMap]
  // );

  // const miroirMenusDomainElementObject: DomainElementObject = useDeploymentEntityStateQuerySelector(
  //   deploymentEntityStateSelectorMap.extractWithManyExtractors,
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
        <LocalIconButton onClick={() => props.setOpen(false)}>
          {theme.direction === "ltr" ? <LocalChevronLeftIcon /> : <LocalChevronRightIcon />}
        </LocalIconButton>
      </StyledDrawerHeader>
      count: {count}
      <LocalDivider />
      <SidebarSection
        deploymentUuid={adminConfigurationDeploymentAdmin.uuid}
        menuUuid={menuDefaultAdmin.uuid}
        open={props.open}
        setOpen={props.setOpen}
      >
      </SidebarSection>
      <LocalDivider />
      <SidebarSection
        deploymentUuid={adminConfigurationDeploymentMiroir.uuid}
        menuUuid={menuDefaultMiroir.uuid}
        open={props.open}
        setOpen={props.setOpen}
      >
      </SidebarSection>
      {/* <Divider />
      <SidebarSection
        deploymentUuid="f97cce64-78e9-419f-a4bd-5cbf52833ede"
        menuUuid="84c178cc-1b1b-497a-a035-9b3d756bb085"
        open={props.open}
        setOpen={props.setOpen}
      >
      </SidebarSection> */}
      {/* <Divider />
      <SidebarSection
        deploymentUuid={adminConfigurationDeploymentTest1.uuid}
        menuUuid={menuDefaultTest1.uuid}
        open={props.open}
        setOpen={props.setOpen}
      >
      </SidebarSection> */}
      {/* ################################################################################### */}
      <LocalDivider />
      <SidebarSection
        deploymentUuid={adminConfigurationDeploymentParis.uuid}
        menuUuid={defaultMenuParisUuid}
        open={props.open}
        setOpen={props.setOpen}
      >
      </SidebarSection>
      <LocalDivider />
      <SidebarSection
        deploymentUuid={adminConfigurationDeploymentLibrary.uuid}
        menuUuid={menuDefaultLibrary.uuid}
        open={props.open}
        setOpen={props.setOpen}
      >
      </SidebarSection>
      {/* ################################################################################### */}

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
      <LocalDivider />
    </StyledDrawer>
  );
}

