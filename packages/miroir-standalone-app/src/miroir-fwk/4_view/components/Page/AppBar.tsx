import {
  Box,
  IconButton,
  Toolbar,
  Tooltip
} from '@mui/material';
import { default as MuiAppBar, AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import { styled } from '@mui/material/styles';
import { ChevronLeftIcon, ChevronRightIcon, Edit, EditOff } from '../Themes/MaterialSymbolWrappers';
import type { MouseEvent, ReactNode } from 'react';

import { defaultSelfApplicationDeploymentMap, LoggerInterface, MiroirLoggerFactory, type MiroirMenuItem, type MiroirMenuPageLink } from 'miroir-core';

import { useMiroirContextService } from 'miroir-react';
import { useNavigate } from 'react-router-dom';
import { packageName } from '../../../../constants.js';
import { pageUrl, reportUrl } from '../../navigation.js';
import { cleanLevel } from '../../constants.js';
import { useMiroirTheme } from '../../contexts/MiroirThemeContext.js';
import { usePageConfiguration } from '../../services/index.js';
import { applyPerformanceDisplayGate } from '../../tools/performanceDisplayGate.js';
import { applyLocalCacheMonitorGate } from '../../tools/localCacheMonitorGate.js';
import { ThemedIcon } from '../Themes/IconComponents.js';
import { SidebarWidth } from './SidebarSection.js';
import { reportMiroirRunners, reportVersioning } from 'miroir-test-app_deployment-miroir';
import { resolveAppBarReportLinkApplication } from './appBarReportNavigation.js';

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "ResponsiveAppBar");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName, "UI",
).then((logger: LoggerInterface) => {log = logger});

const settings = ['Setting1', 'Setting2', 'Setting3', 'Setting4'];

const APP_BAR_ICON_HOVER = 'rgba(255, 255, 255, 0.08)';
const APP_BAR_ICON_ACTIVE = 'rgba(255, 255, 255, 0.12)';

type AppBarIconButtonProps = {
  title: string;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  children: ReactNode;
  'aria-label'?: string;
  color?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
};

function AppBarIconButton({
  title,
  onClick,
  children,
  'aria-label': ariaLabel,
  color,
  style,
  disabled = false,
}: AppBarIconButtonProps) {
  const miroirTheme = useMiroirTheme();
  const defaultColor = miroirTheme.currentTheme.components.appBar.textColor;

  return (
    <Tooltip title={title}>
      <IconButton
        color="inherit"
        onClick={onClick}
        aria-label={ariaLabel ?? title}
        disabled={disabled}
        style={style}
        sx={{
          color: color ?? defaultColor,
          transition: 'background-color 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: APP_BAR_ICON_HOVER,
          },
          '&:active': {
            backgroundColor: APP_BAR_ICON_ACTIVE,
          },
        }}
      >
        {children}
      </IconButton>
    </Tooltip>
  );
}

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
  /** ViewParams.agents — AI AppBar icons and CopilotKit sidebar (#244). */
  agentsEnabled?: boolean,
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
  const agentsEnabled = props.agentsEnabled === true;
  const showAgentUi = agentsEnabled && !(import.meta as any).env?.MIROIR_IS_SANDBOX;


  const goToLabelPage = (event: any, l: string) => {
    log.info("goToLabelPage: ", l, " event: ", event);
    navigate(pageUrl(l))
  }
  const transformerBuilderMenuItem: MiroirMenuPageLink = {
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
  };
  const appbarItems: (MiroirMenuItem | JSX.Element)[] = [
    /* HOME */
    <AppBarIconButton
      key="home"
      title="Home"
      onClick={() => navigate(pageUrl("home"))}
      aria-label="Home"
    >
      <ThemedIcon
        icon={{
          iconType: "mui",
          name: "home",
        }}
      />
    </AppBarIconButton>,
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
      <AppBarIconButton
        key="edit-report-mode"
        title={
          props.generalEditMode
            ? "Edit Report Mode: ON (click to disable)"
            : "Edit Report Mode: OFF (click to enable)"
        }
        onClick={props.onEditModeToggle}
        aria-label="Edit Report Mode"
        color={
          props.generalEditMode
            ? miroirTheme.currentTheme.colors.warningLight || "orange"
            : undefined
        }
      >
        {props.generalEditMode ? <EditOff /> : <Edit />}
      </AppBarIconButton>
    ) : (
      <> </>
    ),
    context.setShowModelTools ? (
      <AppBarIconButton
        key="model-tools"
        title={
          context.showModelTools
            ? "Model Tools: ON (click to disable)"
            : "Model Tools: OFF (click to enable)"
        }
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
      </AppBarIconButton>
    ) : (
      <> </>
    ),
    showAgentUi ? (
      <AppBarIconButton
        key="ai-assistant"
        title={
          context.showAiSidebar
            ? "AI Assistant: ON (click to hide)"
            : "AI Assistant: OFF (click to show)"
        }
        onClick={() => {
          log.info(
            "Toggling AI Sidebar. Current state: ",
            context.showAiSidebar,
            " -> ",
            !context.showAiSidebar,
            "context.setShowAiSidebar: ",
            !!context.setShowAiSidebar,
          );
          return context.setShowAiSidebar?.(!context.showAiSidebar) as any}
        }
        aria-label="AI Assistant"
      >
        <ThemedIcon
          icon={
            context.showAiSidebar
              ? {
                  iconType: "mui",
                  name: "auto_awesome",
                  color: {
                    colorType: "themeColor",
                    currentThemeColorPath: "colors.warning",
                  },
                }
              : {
                  iconType: "mui",
                  name: "auto_awesome",
                }
          }
        />
      </AppBarIconButton>
    ) : (
      <> </>
    ),
    showAgentUi ? (
      <AppBarIconButton
        key="ai-dev-console"
        title={
          context.showCopilotDevConsole
            ? "AI Dev Console: ON (click to hide)"
            : "AI Dev Console: OFF (click to show)"
        }
        onClick={() => {
          log.info(
            "Toggling AI Dev Console. Current state: ",
            context.showCopilotDevConsole,
            " -> ",
            !context.showCopilotDevConsole,
            "context.setShowCopilotDevConsole: ",
            !!context.setShowCopilotDevConsole,
          );
          return context.setShowCopilotDevConsole?.(!context.showCopilotDevConsole) as any}}
        aria-label="AI Dev Console"
      >
        <ThemedIcon
          icon={
            context.showCopilotDevConsole
              ? {
                  iconType: "mui",
                  name: "terminal",
                  color: {
                    colorType: "themeColor",
                    currentThemeColorPath: "colors.warning",
                  },
                }
              : {
                  iconType: "mui",
                  name: "terminal",
                }
          }
        />
      </AppBarIconButton>
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
    ...(showAgentUi ? [transformerBuilderMenuItem] : []),
    // {
    //   "label": "runners",
    //   "section": "model",
    //   "selfApplication": "10ff36f2-50a3-48d8-b80f-e48e5d13af8e", //not used
    //   "reportUuid": "c9ea3359-690c-4620-9603-b5b402e4a2b9", //not used
    //   "icon": "directions_run"
    // },
    // {
    //   "miroirMenuItemType": "miroirMenuReportLink",
    //   "label": "Miroir Entities",
    //   "section": "model",
    //   "selfApplication": "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
    //   "reportUuid": "c9ea3359-690c-4620-9603-b5b402e4a2b9",
    //   "icon": "category"
    // },
    {
      "miroirMenuItemType": "miroirMenuReportLink",
      label: "runners",
      section: "data",
      "selfApplication": "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
      // "reportUuid": "29ef8018-43fc-4ee9-a736-6f9d625be7b7",
      // "reportUuid": "1c306453-7958-47e9-ba6c-9b79a7b37c92",
      "reportUuid": reportMiroirRunners.uuid,
      // targetRoot: "runners",
      icon: "directions_run"
    },
    {
      miroirMenuItemType: "miroirMenuReportLink",
      label: "Versioning",
      // Miroir scaffolding report — open under Miroir data section; in-report
      // inputReportSection steers which application's versions are listed (#225).
      section: "data",
      selfApplication: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
      reportUuid: reportVersioning.uuid,
      // icon: "commit",
      icon: {
        iconType: "svg",
        name: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><circle cx="160" cy="96" r="48" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/><circle cx="160" cy="416" r="48" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/><line x1="160" y1="368" x2="160" y2="144" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/><circle cx="352" cy="160" r="48" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/><path d="M352,208c0,128-192,48-192,160" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/></svg>',
      },
    },
    {
      miroirMenuItemType: "miroirMenuPageLink",
      label: "events",
      targetRoot: "events",
      section: "model",
      icon: {
        iconType: "mui",
        name: "event_note",
      },
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
        <Toolbar disableGutters sx={{ alignItems: "center", minHeight: "48px" }}>
          {/* <Box sx={{display:"flex"}}> */}
          {/* sidebar opener */}
          {!props.sidebarIsOpen && (
            <AppBarIconButton
              title="Open sidebar"
              aria-label="Open sidebar"
              onClick={props.handleSidebarOpen}
            >
              <ChevronRightIcon />
            </AppBarIconButton>
          )}
          {/* sidebar closer */}
          {props.sidebarIsOpen && (
            <AppBarIconButton
              title="Close sidebar"
              aria-label="Close sidebar"
              style={{ padding: 0 }}
              onClick={() => props.setSidebarOpen(false)}
            >
              <ChevronLeftIcon />
            </AppBarIconButton>
          )}
          
          {/* MAIN APPBAR ITEMS */}
          <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" }, alignItems: "center" }}>
            {/* TODO: dividers are ignored  */}
            {appbarItems.map((item) => {
              if (!("miroirMenuItemType" in item)) {
                return item as JSX.Element;
              }
              switch (item.miroirMenuItemType) {
                case "miroirMenuPageLink": {
                  const tooltipTitle =
                    item.label.charAt(0).toUpperCase() + item.label.slice(1).replace(/-/g, " ");
                  return (
                    <AppBarIconButton
                      key={item.label}
                      title={tooltipTitle}
                      aria-label={tooltipTitle}
                      onClick={(e) => goToLabelPage(e, item.targetRoot ?? item.label)}
                    >
                      {item.icon ? (
                        <ThemedIcon icon={item.icon} />
                      ) : (
                        item.label
                      )}
                    </AppBarIconButton>
                  );
                }
                case "miroirMenuReportLink":
                  {
                    const tooltipTitle =
                      item.label.charAt(0).toUpperCase() + item.label.slice(1);
                    return (
                       <AppBarIconButton
                         key={item.label}
                         title={tooltipTitle}
                         aria-label={tooltipTitle}
                         onClick={() => {
                           const applicationUuid = resolveAppBarReportLinkApplication({
                             reportUuid: item.reportUuid ?? "",
                             itemSelfApplication: item.selfApplication,
                             versioningReportUuid: reportVersioning.uuid,
                             applicationSelector: context.toolsPageState?.applicationSelector,
                           });
                           navigate(
                             reportUrl(
                               applicationUuid,
                               (context.applicationDeploymentMap ??
                                 defaultSelfApplicationDeploymentMap)[applicationUuid] ?? "",
                               item.section,
                               item.reportUuid ?? "",
                               item.instanceUuid ?? "xxxxxx",
                             )
                           );
                         }}
                       >
                         {item.icon ? <ThemedIcon icon={item.icon} /> : item.label}
                       </AppBarIconButton>
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
          <Box sx={{ flexGrow: 0, display: "flex", alignItems: "center" }}>
            {/* Fetch Configurations Button */}
            <AppBarIconButton
              title="Fetch Miroir & App configurations from database"
              aria-label="Fetch configurations"
              onClick={fetchConfigurations}
            >
              <ThemedIcon icon={{ iconType: "mui", name: "sync" }} />
            </AppBarIconButton>
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
              <AppBarIconButton
                title={
                  context.showDebugInfo
                    ? "Debug Info: ON (click to disable)"
                    : "Debug Info: OFF (click to enable)"
                }
                aria-label="Debug Info"
                onClick={() => context.setShowDebugInfo?.(!context.showDebugInfo) as any}
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
              </AppBarIconButton>
            )}
            {/* Performance Monitor Indicator */}
            {context.setShowPerformanceDisplay && (
                <AppBarIconButton
                  title={
                    context.showPerformanceDisplay
                      ? "Performance Monitor: ON (click to disable)"
                      : "Performance Monitor: OFF (click to enable)"
                  }
                  aria-label="Performance Monitor"
                  onClick={() => {
                    const next = !context.showPerformanceDisplay;
                    applyPerformanceDisplayGate(next);
                    context.setShowPerformanceDisplay?.(next);
                  }}
                >
                  <ThemedIcon
                    icon={
                      context.showPerformanceDisplay
                        ? { iconType: "mui", name: "timer_off" }
                        : { iconType: "mui", name: "timer" }
                    }
                  />
                </AppBarIconButton>
              )}
            {/* LocalCache Monitor Indicator (#211) */}
            {context.setShowLocalCacheMonitor && (
                <AppBarIconButton
                  title={
                    context.showLocalCacheMonitor
                      ? "LocalCache Monitor: ON (click to disable)"
                      : "LocalCache Monitor: OFF (click to enable)"
                  }
                  aria-label="LocalCache Monitor"
                  onClick={() => {
                    const next = !context.showLocalCacheMonitor;
                    applyLocalCacheMonitorGate(next);
                    context.setShowLocalCacheMonitor?.(next);
                    try {
                      context.domainController
                        ?.getLocalCache?.()
                        ?.setLocalCacheMonitorEnabled(next);
                    } catch {
                      // DomainController / LocalCache may be unavailable in some shells.
                    }
                  }}
                >
                  <ThemedIcon
                    icon={
                      context.showLocalCacheMonitor
                        ? { iconType: "mui", name: "memory" }
                        : { iconType: "mui", name: "storage" }
                    }
                  />
                </AppBarIconButton>
              )}
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