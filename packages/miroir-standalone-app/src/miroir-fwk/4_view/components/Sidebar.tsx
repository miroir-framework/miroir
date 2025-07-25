import { FC, useMemo, useState, useRef, useCallback, useEffect } from 'react';

import ChevronLeftIcon from '@mui/icons-material/ChevronLeft.js';
import ChevronRightIcon from '@mui/icons-material/ChevronRight.js';
import Divider from '@mui/material/Divider';
import MuiDrawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import { CSSObject, styled, Theme, useTheme } from '@mui/material/styles';


import AutoStories from '@mui/icons-material/AutoStories';
import {
  adminConfigurationDeploymentAdmin,
  adminConfigurationDeploymentLibrary,
  adminConfigurationDeploymentMiroir,
  LoggerInterface,
  menuDefaultAdmin,
  menuDefaultLibrary,
  menuDefaultMiroir,
  MiroirLoggerFactory
} from "miroir-core";
import { adminConfigurationDeploymentParis, defaultMenuParisUuid, packageName } from '../../../constants.js';
import { cleanLevel } from '../constants.js';
import { SidebarSection } from './SidebarSection.js';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "Sidebar")
).then((logger: LoggerInterface) => {log = logger});



export const SidebarWidth = 200;

const LocalMuiDrawer: any = MuiDrawer;
const LocalIconButton:any = IconButton;
const LocalDivider:any = Divider;
const LocalChevronLeftIcon:any = ChevronLeftIcon;
const LocalChevronRightIcon:any = ChevronRightIcon;

const openedMixin = (theme: Theme, width: number = SidebarWidth): CSSObject => ({
  width: width,
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
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(1, 1),
  minHeight: 'auto', // Remove default toolbar height
  justifyContent: 'flex-start',
  fontSize: theme.typography.body1.fontSize, // Use normal body font size
}));

const ResizeHandle = styled('div')(({ theme }) => ({
  position: 'absolute',
  right: 0,
  top: 0,
  bottom: 0,
  width: '6px',
  backgroundColor: 'rgba(0, 0, 0, 0.1)',
  cursor: 'col-resize',
  zIndex: 1000,
  transition: 'background-color 0.2s',
  borderLeft: '1px solid rgba(0, 0, 0, 0.05)',
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderLeft: '1px solid rgba(0, 0, 0, 0.1)',
  },
  '&:active': {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderLeft: '1px solid rgba(0, 0, 0, 0.2)',
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    right: '2px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '2px',
    height: '30px',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '1px',
  },
}));

export interface ResponsiveAppBarProps {
  handleDrawerOpen: ()=>void,
  open: boolean,
  children:any,
}

// const Sidebar = MuiDrawer;
const StyledDrawer = styled(LocalMuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' && prop !== 'width' })<{
  open?: boolean;
  width?: number;
}>(
  ({ theme, open, width = SidebarWidth }) => ({
    width: width,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    ...(open && {
      ...openedMixin(theme, width),
      '& .MuiDrawer-paper': openedMixin(theme, width),
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
export const Sidebar:FC<{open:boolean, setOpen: (v:boolean)=>void, width?: number, onWidthChange?: (width: number) => void}> = (props: {open:boolean, setOpen: (v:boolean)=>void, width?: number, onWidthChange?: (width: number) => void}) => {
  count++;
  const theme = useTheme();
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isResizing && props.onWidthChange) {
      const newWidth = Math.max(150, Math.min(500, e.clientX)); // Min 150px, Max 500px
      props.onWidthChange(newWidth);
    }
  }, [isResizing, props.onWidthChange]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Add global mouse event listeners when resizing
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // log.info("deploymentEntityStateDomainElementObject",miroirMenusDomainElementObject)
  // // const defaultMiroirMenu = (domainElementObject?.menus as any)?.definition;
  // console.log(
  //   "Sidebar refresh",
  //   count++,
  //   "found miroir menu:",
  //   miroirMenusDomainElementObject,
  //   miroirMenusDomainElementObject?.menus
  // );
  const drawerSx = useMemo(()=>({flexDirection:'column', position: 'relative'}),[])
  const styledDrawerSx = useMemo(()=>({}),[]) // Remove alignItems: "end" to let StyledDrawerHeader center the items
  // const dynIcon = React.createElement(AutoStories, {});

  return (
    <StyledDrawer sx={drawerSx} variant="permanent" open={props.open} width={props.width}>
      <StyledDrawerHeader sx={styledDrawerSx}>
        <LocalIconButton onClick={() => props.setOpen(false)}>
          {theme.direction === "ltr" ? <LocalChevronLeftIcon /> : <LocalChevronRightIcon />}
        </LocalIconButton>
        <span style={{ marginLeft: '8px' }}>count: {count}</span>
      </StyledDrawerHeader>
      <LocalDivider />
      <SidebarSection
        deploymentUuid={adminConfigurationDeploymentAdmin.uuid}
        menuUuid={menuDefaultAdmin.uuid}
        open={props.open}
        setOpen={props.setOpen}
      ></SidebarSection>
      <LocalDivider />
      <SidebarSection
        deploymentUuid={adminConfigurationDeploymentMiroir.uuid}
        menuUuid={menuDefaultMiroir.uuid}
        open={props.open}
        setOpen={props.setOpen}
      ></SidebarSection>
      <LocalDivider />
      <SidebarSection
        deploymentUuid={adminConfigurationDeploymentParis.uuid}
        menuUuid={defaultMenuParisUuid}
        open={props.open}
        setOpen={props.setOpen}
      ></SidebarSection>
      <LocalDivider />
      <SidebarSection
        deploymentUuid={adminConfigurationDeploymentLibrary.uuid}
        menuUuid={menuDefaultLibrary.uuid}
        open={props.open}
        setOpen={props.setOpen}
      ></SidebarSection>
      <LocalDivider />
      {/* Resize handle - only show when sidebar is open */}
      {props.open && (
        <ResizeHandle
          ref={resizeRef}
          onMouseDown={handleMouseDown}
          style={{ cursor: isResizing ? "col-resize" : "col-resize" }}
        />
      )}
    </StyledDrawer>
  );
}

