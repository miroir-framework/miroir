import { useState } from 'react';

import { default as MuiAppBar, AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft.js';
import ChevronRightIcon from '@mui/icons-material/ChevronRight.js';

import { styled } from '@mui/material/styles';
import { 
  Icon, 
  Toolbar, 
  Box, 
  IconButton, 
  Menu, 
  MenuItem, 
  Typography, 
  Button, 
  Tooltip, 
  Avatar 
} from '@mui/material';
import AdbIcon from '@mui/icons-material/Adb';
import MenuIcon from '@mui/icons-material/Menu';
import TocIcon from '@mui/icons-material/Toc';
import Edit from '@mui/icons-material/Edit';
import EditOff from '@mui/icons-material/EditOff';

import { defaultMiroirModelEnvironment, LoggerInterface, MiroirLoggerFactory, MiroirMenuItem } from 'miroir-core';

import { Link, useNavigate } from 'react-router-dom';
import { packageName } from '../../../../constants.js';
import { cleanLevel } from '../../constants.js';
import { useMiroirTheme } from '../../contexts/MiroirThemeContext.js';
import { SidebarWidth } from './SidebarSection.js';
import { useDomainControllerService, useMiroirContextService, useSnackbar } from '../../MiroirContextReactProvider.js';
import { ThemedIcon, ThemedIconButton } from '../Themes/IconComponents.js';
import { usePageConfiguration } from '../../services/index.js';
import { ActionButton } from './ActionButton.js';
import { noValue } from '../ValueObjectEditor/JzodElementEditorInterface.js';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "ResponsiveAppBar"), "UI",
).then((logger: LoggerInterface) => {log = logger});

const appbarItems: MiroirMenuItem[] = [
  {
    "label": "Tools",
    "section": "model",
    "selfApplication": "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
    "reportUuid": "c9ea3359-690c-4620-9603-b5b402e4a2b9",
    // "icon": "category",
  },
  // {
  //   "label": "concept",
  //   "section": "model",
  //   "selfApplication": "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
  //   "reportUuid": "c9ea3359-690c-4620-9603-b5b402e4a2b9",
  //   "icon": "category"
  // },
  // {
  //   "label": "check",
  //   "section": "model",
  //   "selfApplication": "10ff36f2-50a3-48d8-b80f-e48e5d13af8e", //not used
  //   "reportUuid": "c9ea3359-690c-4620-9603-b5b402e4a2b9", //not used
  //   "icon": "category"
  // },
  {
    "label": "admin",
    "section": "model",
    "selfApplication": "10ff36f2-50a3-48d8-b80f-e48e5d13af8e", //not used
    "reportUuid": "c9ea3359-690c-4620-9603-b5b402e4a2b9", //not used
    // "icon": "category"
  },
  {
    "label": "events",
    "section": "model",
    "selfApplication": "10ff36f2-50a3-48d8-b80f-e48e5d13af8e", //not used
    "reportUuid": "c9ea3359-690c-4620-9603-b5b402e4a2b9", //not used
    // "icon": "event_note"
  },
  {
    "label": "error-logs",
    "section": "model",
    "selfApplication": "10ff36f2-50a3-48d8-b80f-e48e5d13af8e", //not used
    "reportUuid": "c9ea3359-690c-4620-9603-b5b402e4a2b9", //not used
    // "icon": "error"
  },
  {
    "label": "settings",
    "section": "model",
    "selfApplication": "10ff36f2-50a3-48d8-b80f-e48e5d13af8e", //not used
    "reportUuid": "c9ea3359-690c-4620-9603-b5b402e4a2b9", //not used
    // "icon": "cogwheel"
    "icon": {
      iconType: "mui",
      name: "settings",
      // color: "#FF0000",
      // color: "red",
      // color: {
      //   colorType: "themeColor",
      //   currentThemeColorPath: "colors.warning"
      // }
    }
  },
];
const settings = ['Setting1', 'Setting2', 'Setting3', 'Setting4'];


export interface AppBarProps extends MuiAppBarProps {
  // open?: boolean;
  handleSidebarOpen?: ()=>void,
  setSidebarOpen: (v: boolean) => void;
  sidebarIsOpen: boolean,
  children:any,
  width?: number,
  onWidthChange?: (width: number) => void,
  // Document outline props
  outlineOpen?: boolean,
  outlineWidth?: number,
  onOutlineToggle?: () => void,
  // Grid type display and toggle
  gridType?: string,
  onGridTypeToggle?: () => void,
  // Edit mode display and toggle
  editMode?: boolean,
  onEditModeToggle?: () => void,
  // theme: any
}

const StyledAppBar =
styled(
  MuiAppBar as any, //TODO: correct typing error
  {shouldForwardProp: (prop) => prop !== "open" && prop !== "width" && prop !== "outlineOpen" && prop !== "outlineWidth"}
)<AppBarProps>(
  ({ theme, open, width = SidebarWidth, outlineOpen, outlineWidth = 300 }) => {
    let appBarWidth = "100%";
    let marginLeft = 0;
    let marginRight = 0;

    // Calculate width and margins based on both sidebars
    if (open && outlineOpen) {
      // Both sidebars open
      appBarWidth = `calc(100% - ${width}px - ${outlineWidth}px)`;
      marginLeft = width;
      marginRight = outlineWidth;
    } else if (open) {
      // Only left sidebar open
      appBarWidth = `calc(100% - ${width}px)`;
      marginLeft = width;
    } else if (outlineOpen) {
      // Only right outline open
      appBarWidth = `calc(100% - ${outlineWidth}px)`;
      marginRight = outlineWidth;
    }

    return {
      zIndex: 1201, // Higher than drawer (1200) to appear above it
      position: "static",
      minHeight: 0,
      width: appBarWidth,
      marginLeft: `${marginLeft}px`,
      marginRight: `${marginRight}px`,
      transition: 'margin 0.3s ease-out, width 0.3s ease-out',
      '@media (max-width: 600px)': {
        padding: '0 0px',
        minHeight: "0px"
      },
      '@media (min-width: 960px)': {
        padding: '0 0px',
        minHeight: "0px"
      },
    };
  }
);

// ################################################################################################
export function AppBar(props:AppBarProps) {
  // react hooks
  const navigate = useNavigate();

  const domainController = useDomainControllerService();
  // const context = useMiroirContextService();

    // Use snackbar from context
    const {
      snackbarOpen,
      snackbarMessage,
      snackbarSeverity,
      showSnackbar,
      handleSnackbarClose,
      handleAsyncAction,
    } = useSnackbar();
  
  // custom hooks
  const miroirTheme = useMiroirTheme();
  const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null);
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const context = useMiroirContextService();
  const { fetchConfigurations } = usePageConfiguration();

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  };
  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const goToLabelPage = (event: any, l: string) => {
    log.info("goToLabelPage: ", l, " event: ", event);
    navigate("/"+l)
  }
  
  return (
    <StyledAppBar
      open={props.sidebarIsOpen}
      width={props.width}
      outlineOpen={props.outlineOpen}
      outlineWidth={props.outlineWidth}
      sx={{
        backgroundColor: miroirTheme.currentTheme.components.appBar.background,
        color: miroirTheme.currentTheme.components.appBar.textColor,
        borderBottom: miroirTheme.currentTheme.components.appBar.borderBottom,
        boxShadow: miroirTheme.currentTheme.components.appBar.elevation,
      }}
    >
      <>
        <Toolbar disableGutters={false}>
          {/* <Box sx={{display:"flex"}}> */}
          {/* sidebar opener */}
          {!props.sidebarIsOpen && (
            <ThemedIconButton
              aria-label="open sidebar"
              title="Open sidebar"
              onClick={props.handleSidebarOpen}
            >
              <ChevronRightIcon />
            </ThemedIconButton>
          )}
          {/* sidebar closer */}
          {props.sidebarIsOpen && (
            <ThemedIconButton
              style={{ padding: 0 }}
              onClick={() => props.setSidebarOpen(false)}
              aria-label="Close sidebar"
              title="Close sidebar"
            >
              <ChevronLeftIcon />
            </ThemedIconButton>
          )}
          {/* HOME */}
          <Link to={`/home`}>
            <Icon
              sx={{
                mr: 2,
                color: miroirTheme.currentTheme.components.appBar.textColor,
              }}
            >
              home
            </Icon>
          </Link>
          {/* MENU, NOT WORKING */}
          {/* <Box sx={{ flexGrow: 0, display: { xs: "flex", md: "flex" } }}>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "left",
              }}
              keepMounted
              transformOrigin={{
                vertical: "top",
                horizontal: "left",
              }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{
                display: { xs: "block", md: "none" },
              }}
            >
              {pages.map((page) => (
                <MenuItem key={page.label} onClick={(e: any) => goToLabelPage(e, page.label)}>
                  <Typography textAlign="center">{page.label}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box> */}
          {/* <AdbIcon sx={{ display: { xs: "flex", md: "none" }, mr: 1 }} /> */}
          {/* <Typography
            variant="h5"
            noWrap
            component="a"
            href=""
            sx={{
              mr: 2,
              display: { xs: "flex", md: "none" },
              flexGrow: 1,
              fontFamily: "monospace",
              fontWeight: 700,
              letterSpacing: ".3rem",
              color: "inherit",
              textDecoration: "none",
            }}
          >
            LOGO
          </Typography> */}
          {/* MAIN APPBAR ITEMS */}
          <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" } }}>
            {appbarItems.map((item) => (
              <Button
                key={item.label}
                onClick={(e: any) => goToLabelPage(e, item.label)}
                sx={{
                  my: 2,
                  color: miroirTheme.currentTheme.components.appBar.textColor,
                  display: "block",
                }}
              >
                {item.icon ? <ThemedIcon icon={item.icon} /> : item.label}
              </Button>
            ))}
          </Box>
            {/* Edit Mode Toggle Button */}
            {props.onEditModeToggle && (
              <Tooltip
                title={
                  props.editMode
                    ? "Edit Report Mode: ON (click to disable)"
                    : "Edit Report Mode: OFF (click to enable)"
                }
              >
                <IconButton
                  color="inherit"
                  onClick={props.onEditModeToggle}
                  sx={{
                    mr: 1,
                    color: props.editMode
                      ? miroirTheme.currentTheme.colors.warning || "orange"
                      : miroirTheme.currentTheme.components.appBar.textColor,
                    transition: "all 0.3s ease-in-out",
                    "&:hover": {
                      backgroundColor: miroirTheme.currentTheme.colors.hover,
                    },
                  }}
                >
                  {props.editMode ? <EditOff />: <Edit />}
                </IconButton>
              </Tooltip>
            )}
          {/* useless menu */}
          {/* <IconButton
            size="large"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleOpenNavMenu}
            color="inherit"
          >
            <MenuIcon />
          </IconButton> */}
          <Box sx={{ flexGrow: 0, display: "flex" }}>
            <ActionButton
              onAction={async () => {
                await domainController.handleActionFromUI(
                  {
                    actionType: "commit",
                    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                    deploymentUuid: noValue.uuid,
                  },
                  defaultMiroirModelEnvironment
                );
              }}
              successMessage="Committed successfully"
              label="Commit"
              handleAsyncAction={handleAsyncAction}
              actionName="commit"
            />
            {/* Fetch Configurations Button */}
            <ThemedIconButton
              onClick={fetchConfigurations}
              aria-label="Fetch configurations"
              title="Fetch Miroir & App configurations from database"
            >
              <ThemedIcon icon={{ iconType: "mui", name: "sync" }} />
            </ThemedIconButton>
            {/* Performance Monitor Indicator */}
            {context.setShowPerformanceDisplay && (
              <Tooltip
                title={
                  context.showPerformanceDisplay
                    ? "Performance Monitor: ON (click to disable)"
                    : "Performance Monitor: OFF (click to enable)"
                }
              >
                <ThemedIconButton
                  onClick={() =>
                    context.setShowPerformanceDisplay?.(!context.showPerformanceDisplay) as any
                  }
                  aria-label="Performance Monitor"
                  // title="Fetch Miroir & App configurations from database"
                >
                  <ThemedIcon
                    icon={
                      context.showPerformanceDisplay
                        ? { iconType: "mui", name: "timerOff" }
                        : { iconType: "mui", name: "timer" }
                    }
                  />
                </ThemedIconButton>
              </Tooltip>
            )}{" "}
            {/* Action Timeline Indicator */}
            {context.setShowActionTimeline && (
              <Tooltip
                title={
                  context.showActionTimeline
                    ? "Action Timeline: ON (click to disable)"
                    : "Action Timeline: OFF (click to enable)"
                }
              >
                <ThemedIconButton
                  onClick={() =>
                    context.setShowActionTimeline?.(!context.showActionTimeline) as any
                  }
                  aria-label="Action Timeline"
                  // title="Fetch Miroir & App configurations from database"
                >
                  <ThemedIcon
                    icon={
                      context.showActionTimeline
                        ? { iconType: "mui", name: "notificationOff" }
                        : { iconType: "mui", name: "notification" }
                    }
                  />
                </ThemedIconButton>
              </Tooltip>
            )}{" "}
            {/* Document Outline Toggle */}
            {/* {props.onOutlineToggle && (
              <Tooltip
                title={props.outlineOpen ? "Hide Document Outline" : "Show Document Outline"}
              >
                <IconButton color="inherit" onClick={props.onOutlineToggle} sx={{ mr: 1 }}>
                  <TocIcon />
                </IconButton>
              </Tooltip>
            )} */}
            {/* User settings menu */}
            {/* <Tooltip title="Open settings">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                <Avatar alt="AVATAR" src="/static/images/avatar/2.jpg" />
              </IconButton>
            </Tooltip> */}
            {/* <Menu
              sx={{ mt: "45px" }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              keepMounted
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              {settings.map((setting) => (
                <MenuItem key={setting} onClick={handleCloseUserMenu}>
                  <Typography textAlign="center">{setting}</Typography>
                </MenuItem>
              ))}
            </Menu> */}
          </Box>
        </Toolbar>
      </>
    </StyledAppBar>
  );
}
export default AppBar;