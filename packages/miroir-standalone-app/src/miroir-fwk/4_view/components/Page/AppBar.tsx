import {
  Box,
  Button,
  IconButton,
  Toolbar,
  Tooltip
} from '@mui/material';
import { default as MuiAppBar, AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import { styled } from '@mui/material/styles';
import { ChevronLeftIcon, ChevronRightIcon, Edit, EditOff } from '../Themes/MaterialSymbolWrappers';

import { defaultSelfApplicationDeploymentMap, LoggerInterface, MiroirLoggerFactory, MiroirMenuItem } from 'miroir-core';

import { useMiroirContextService } from 'miroir-react';
import { adminApplication_Miroir } from 'miroir-test-app_deployment-admin';
import { Link, useNavigate } from 'react-router-dom';
import { packageName } from '../../../../constants.js';
import { cleanLevel } from '../../constants.js';
import { useMiroirTheme } from '../../contexts/MiroirThemeContext.js';
import { usePageConfiguration } from '../../services/index.js';
import { ThemedIcon, ThemedIconButton } from '../Themes/IconComponents.js';
import { SidebarWidth } from './SidebarSection.js';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "ResponsiveAppBar"), "UI",
).then((logger: LoggerInterface) => {log = logger});

const settings = ['Setting1', 'Setting2', 'Setting3', 'Setting4'];


export interface AppBarProps extends MuiAppBarProps {
  // open?: boolean;
  handleSidebarOpen?: ()=>void,
  setSidebarOpen: (v: boolean) => void;
  sidebarIsOpen: boolean,
  // children:any,
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
  generalEditMode?: boolean,
  onEditModeToggle?: () => void,
  // theme: any
}

// ################################################################################################
const StyledAppBar = styled(
  MuiAppBar as any, //TODO: correct typing error
  {
    shouldForwardProp: (prop) =>
      prop !== "open" && prop !== "width" && prop !== "outlineOpen" && prop !== "outlineWidth",
  },
)<AppBarProps>(({ theme, open, width = SidebarWidth, outlineOpen, outlineWidth = 300 }) => {
  let marginLeft = 0;
  let marginRight = 0;


  return {
    position: "static",
    minHeight: 0,
    transition: "margin 0.3s ease-out, width 0.3s ease-out",
    "@media (max-width: 600px)": {
      padding: "0 0px",
      minHeight: "0px",
    },
    "@media (min-width: 960px)": {
      padding: "0 0px",
      minHeight: "0px",
    },
  };
});

// ################################################################################################
export function AppBar(props:AppBarProps) {
  // react hooks
  const navigate = useNavigate();

  const miroirTheme = useMiroirTheme();
  const context = useMiroirContextService();
  const { fetchConfigurations } = usePageConfiguration();


  const goToLabelPage = (event: any, l: string) => {
    log.info("goToLabelPage: ", l, " event: ", event);
    navigate("/"+l)
  }
  const appbarItems: (MiroirMenuItem | JSX.Element)[] = [
    /* HOME */
    <Link to={`/home`}>
      <IconButton
        sx={{
          // mr: 2,
          color: miroirTheme.currentTheme.components.appBar.textColor,
        }}
      >
        <ThemedIcon
          icon={{
            iconType: "mui",
            name: "home",
          }}
        />
      </IconButton>
    </Link>,
    // {
    //   miroirMenuItemType: "miroirMenuReportLink",
    //   label: "Tools",
    //   section: "data",
    //   selfApplication: adminApplication_Miroir.uuid,
    //   reportUuid: "29ef8018-43fc-4ee9-a736-6f9d625be7b7",
    //   icon: {
    //     iconType: "mui",
    //     name: "construction",
    //   },
    // },
    props.onEditModeToggle ? (
      <Tooltip
        title={
          props.generalEditMode
            ? "Edit Report Mode: ON (click to disable)"
            : "Edit Report Mode: OFF (click to enable)"
        }
      >
        <IconButton
          color="inherit"
          onClick={props.onEditModeToggle}
          sx={{
            mr: 1,
            color: props.generalEditMode
              ? miroirTheme.currentTheme.colors.warningLight || "orange"
              : miroirTheme.currentTheme.components.appBar.textColor,
            transition: "all 0.3s ease-in-out",
            "&:hover": {
              backgroundColor: miroirTheme.currentTheme.colors.hover,
            },
          }}
        >
          {props.generalEditMode ? <EditOff /> : <Edit />}
        </IconButton>
      </Tooltip>
    ) : (
      <> </>
    ),
    context.setShowModelTools ? (
      <Tooltip
        title={
          context.showModelTools
            ? "Model Tools: ON (click to disable)"
            : "Model Tools: OFF (click to enable)"
        }
      >
        <ThemedIconButton
          onClick={() => context.setShowModelTools?.(!context.showModelTools) as any}
          aria-label="Model Tools"
        >
          <ThemedIcon
            icon={
              context.showModelTools
                ? {
                    iconType: "mui",
                    name: "wbIncandescent",
                    color: {
                      colorType: "themeColor",
                      currentThemeColorPath: "colors.warning",
                    },
                  }
                : {
                    iconType: "mui",
                    name: "lightbulb",
                  }
            }
          />
        </ThemedIconButton>
      </Tooltip>
    ) : (
      <> </>
    ),
    {
      miroirMenuItemType: "miroirMenuPageLink",
      label: "Model",
      targetRoot: "model",
      section: "model",
      icon: {
        iconType: "mui",
        name: "account_tree",
      },
    },
    {
      miroirMenuItemType: "miroirMenuPageLink",
      label: "Search",
      targetRoot: "search",
      section: "model",
      icon: {
        iconType: "mui",
        name: "search",
      },
    },
    {
      miroirMenuItemType: "miroirMenuPageLink",
      label: "Transformer Builder",
      targetRoot: "transformerBuilder",
      section: "model",
      icon: {
        iconType: "mui",
        name: "build",
        superImpose: {
          letter: "T",
          color: "#FF0000",
        },
      },
    },
    // {
    //   "label": "runners",
    //   "section": "model",
    //   "selfApplication": "10ff36f2-50a3-48d8-b80f-e48e5d13af8e", //not used
    //   "reportUuid": "c9ea3359-690c-4620-9603-b5b402e4a2b9", //not used
    //   "icon": "directions_run"
    // },
    {
      miroirMenuItemType: "miroirMenuPageLink",
      label: "events",
      targetRoot: "events",
      section: "model",
      // "icon": "event_note"
    },
    {
      miroirMenuItemType: "miroirMenuPageLink",
      label: "error-logs",
      targetRoot: "error-logs",
      section: "model",
      "icon": "report_problem"
    },
    // {
    //   "label": "error-logs",
    //   "section": "model",
    //   "selfApplication": "10ff36f2-50a3-48d8-b80f-e48e5d13af8e", //not used
    //   "reportUuid": "c9ea3359-690c-4620-9603-b5b402e4a2b9", //not used
    //   "icon": "engineering"
    // },
    {
      miroirMenuItemType: "miroirMenuPageLink",
      label: "settings",
      targetRoot: "settings",
      section: "model",
      // selfApplication: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e", //not used
      // reportUuid: "c9ea3359-690c-4620-9603-b5b402e4a2b9", //not used
      // "icon": "manufacturing"
      icon: "settings",
      // "icon": {
      //   iconType: "mui",
      //   name: "settings",
      // }
    },
    // {
    //   miroirMenuItemType: "miroirMenuPageLink",
    //   label: "themes",
    //   targetRoot: "themes",
    //   section: "model",
    //   selfApplication: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e", //not used
    //   reportUuid: "c9ea3359-690c-4620-9603-b5b402e4a2b9", //not used
    //   // "icon": "manufacturing"
    //   icon: "palette",
    //   // "icon": {
    //   //   iconType: "mui",
    //   //   name: "settings",
    //   // }
    // },
  ];

  return (
    <StyledAppBar
      style={{ padding: "0" }}
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
      {" "}
      <Box sx={{ display: "flex" }}>
        <Toolbar disableGutters>
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
          
          {/* MAIN APPBAR ITEMS */}
          <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" } }}>
            {/* TODO: dividers are ignored  */}
            {appbarItems.map((item) => {
              if (!("miroirMenuItemType" in item)) {
                return item as JSX.Element;
              }
              switch (item.miroirMenuItemType) {
                case "miroirMenuPageLink": {
                  return (
                    <Button
                      key={item.label}
                      onClick={(e: any) => goToLabelPage(e, item.targetRoot ?? item.label)}
                      sx={{
                        my: 2,
                        color: miroirTheme.currentTheme.components.appBar.textColor,
                        display: "block",
                      }}
                    >
                      {item.icon ? <ThemedIcon icon={item.icon} /> : item.label}
                    </Button>
                  );
                }
                case "miroirMenuReportLink":
                  // <Link
                  //   to={`/report/${item.selfApplication}/${(context.applicationDeploymentMap ?? defaultSelfApplicationDeploymentMap)[item.selfApplication]}/${item.section}/${item.reportUuid}/${item.instanceUuid ?? "xxxxxx"}`}
                  // >
                  //  {/* {item.icon ? <ThemedIcon icon={item.icon} /> : item.label} */}
                  {
                    return (
                       <Button
                         key={item.label}
                         onClick={(e: any) =>
                           goToLabelPage(
                             e,
                             `report/${item.selfApplication}/${
                               (context.applicationDeploymentMap ??
                                 defaultSelfApplicationDeploymentMap)[item.selfApplication]
                             }/${item.section}/${item.reportUuid}/${item.instanceUuid ?? "xxxxxx"}`,
                           )
                         }
                         sx={{
                           my: 2,
                           color: miroirTheme.currentTheme.components.appBar.textColor,
                           display: "block",
                         }}
                       >
                         {item.icon ? <ThemedIcon icon={item.icon} /> : item.label}
                       </Button>
                      // </Link>
                      // <Button
                      //   key={item.label}
                      //   onClick={(e: any) =>
                      //     goToLabelPage(
                      //       e,
                      //       `/report/${item.selfApplication}/${
                      //         (context.applicationDeploymentMap ??
                      //           defaultSelfApplicationDeploymentMap)[item.selfApplication]
                      //       }/${item.section}/${item.reportUuid}/${item.instanceUuid ?? "xxxxxx"}`,
                      //     )
                      //   }
                      //   sx={{
                      //     my: 2,
                      //     color: miroirTheme.currentTheme.components.appBar.textColor,
                      //     display: "block",
                      //   }}
                      // >
                      //   {item.icon ? <ThemedIcon icon={item.icon} /> : item.label}
                      // </Button>
                    );
                  }
                  break;
                default:
                  log.warn("Unknown miroirMenuItemType: ", item);
                  return null;
              }
            })}
          </Box>
          {/* Edit Mode Toggle Button */}
          {/* {props.onEditModeToggle && (
            <Tooltip
              title={
                props.generalEditMode
                  ? "Edit Report Mode: ON (click to disable)"
                  : "Edit Report Mode: OFF (click to enable)"
              }
            >
              <IconButton
                color="inherit"
                onClick={props.onEditModeToggle}
                sx={{
                  mr: 1,
                  color: props.generalEditMode
                    ? miroirTheme.currentTheme.colors.warningLight || "orange"
                    : miroirTheme.currentTheme.components.appBar.textColor,
                  transition: "all 0.3s ease-in-out",
                  "&:hover": {
                    backgroundColor: miroirTheme.currentTheme.colors.hover,
                  },
                }}
              >
                {props.generalEditMode ? <EditOff /> : <Edit />}
              </IconButton>
            </Tooltip>
          )} */}
          <Box sx={{ flexGrow: 0, display: "flex" }}>
            {/* Fetch Configurations Button */}
            <ThemedIconButton
              onClick={fetchConfigurations}
              aria-label="Fetch configurations"
              title="Fetch Miroir & App configurations from database"
            >
              <ThemedIcon icon={{ iconType: "mui", name: "sync" }} />
            </ThemedIconButton>
            {/* Action Timeline Indicator */}
            {/* {context.setShowActionTimeline && (
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
                          ? { iconType: "mui", name: "notifications_off" }
                          : { iconType: "mui", name: "notifications" }
                      }
                    />
                  </ThemedIconButton>
                </Tooltip>
              )} */}
            {/* Debug Info Indicator */}
            {context.setShowDebugInfo && (
              <Tooltip
                title={
                  context.showDebugInfo
                    ? "Debug Info: ON (click to disable)"
                    : "Debug Info: OFF (click to enable)"
                }
              >
                <ThemedIconButton
                  onClick={() => context.setShowDebugInfo?.(!context.showDebugInfo) as any}
                  aria-label="Debug Info"
                >
                  <ThemedIcon
                    icon={
                      context.showDebugInfo
                        ? {
                            iconType: "mui",
                            name: "bug_report",
                            color: {
                              colorType: "themeColor",
                              currentThemeColorPath: "colors.warning",
                            },
                          }
                        : {
                            iconType: "mui",
                            name: "bug_report",
                          }
                    }
                  />
                </ThemedIconButton>
              </Tooltip>
            )}
            {/* Performance Monitor Indicator */}
            {/* {context.setShowPerformanceDisplay && (
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
                          ? { iconType: "mui", name: "timer_off" }
                          : { iconType: "mui", name: "timer" }
                      }
                    />
                  </ThemedIconButton>
                </Tooltip>
              )} */}
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
      </Box>
    </StyledAppBar>
  );
}
export default AppBar;