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
  applicationDeploymentMiroir,
  DomainControllerInterface,
  DomainElementObject,
  DomainManyQueriesWithDeploymentUuid,
  DomainStateSelectorMap,
  DomainStateSelectorParams,
  getSelectorMap,
  getSelectorParams,
  menuDefaultMiroir,
  MiroirSelectorQueryParams,
  reportEntityList,
  reportMenuList,
  selectByDomainManyQueriesFromDomainStateNew
} from "miroir-core";
import React, { useMemo } from 'react';
import { useDomainControllerService, useMiroirContext } from './MiroirContextReactProvider';
import { useDomainStateSelectorNew } from './ReduxHooks';
import { AutoStories } from '@mui/icons-material';
import { Icon } from '@mui/material';



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


const sideBarDefaultItems: any[] = [
  {
    label: "Miroir Entities",
    section: "model",
    application: applicationDeploymentMiroir.uuid,
    reportUuid: reportEntityList.uuid,
  },
  // {
  //   label: "Miroir Reports",
  //   section: "data",
  //   application: applicationDeploymentMiroir.uuid,
  //   reportUuid: reportReportList.uuid,
  // },
  {
    label: "Miroir Menus",
    section: "data",
    application: applicationDeploymentMiroir.uuid,
    reportUuid: reportMenuList.uuid,
  },
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

  const domainController: DomainControllerInterface = useDomainControllerService();
  const context = useMiroirContext();
  const miroirConfig = context.getMiroirConfig();

  const selectorMap: DomainStateSelectorMap<MiroirSelectorQueryParams> = useMemo(
    () => getSelectorMap(),
    []
  )

  const domainFetchQueryParams: DomainStateSelectorParams<DomainManyQueriesWithDeploymentUuid> = useMemo(
    () => 
    getSelectorParams<DomainManyQueriesWithDeploymentUuid>({
      queryType: "DomainManyQueries",
      deploymentUuid: applicationDeploymentMiroir.uuid,
      // applicationSection: "data",
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
    }, selectorMap),
    [selectorMap]
  );

  const domainElementObject: DomainElementObject = useDomainStateSelectorNew(
    selectorMap.selectByDomainManyQueriesFromDomainStateNew,
    domainFetchQueryParams
  );
  // const defaultMiroirMenu = (domainElementObject?.elementValue?.menus?.elementValue as any)?.definition;
  console.log("Sidebar refresh", count++, "found miroir menu:", domainElementObject, domainElementObject?.elementValue?.menus?.elementValue);
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
      <Divider />
      count: {count}
        {/* {sideBarDefaultItems.map((i: any, index: number) => ( */}
        {/* TODO: DRY the menuSection display!*/}
        {
          (domainElementObject?.elementValue?.menus?.elementValue as any)?.definition?.menuType == "simpleMenu"?
          <List>
            {(
              (domainElementObject?.elementValue?.menus?.elementValue as any)?.definition?.definition ?? sideBarDefaultItems
              ).map((i: any, index: number) => (
              <ListItem key={i.label} disablePadding>
                <ListItemButton component={Link} to={`/report/${i.application}/${i.section}/${i.reportUuid}/xxxxxx`}>
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
          <List>
            {(
              (domainElementObject?.elementValue?.menus?.elementValue as any)?.definition?.definition ?? []
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
