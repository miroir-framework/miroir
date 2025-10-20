import type { SelectChangeEvent } from '@mui/material';
import {
  Alert,
  Snackbar
} from '@mui/material';
import {
  useCallback,
  useEffect, useMemo, useRef, useState
} from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { EventTimelineContainer } from '../EventTimelineContainer';
import {
  ThemedButton,
  ThemedGrid,
  ThemedMainPanel,
  ThemedText
} from '../Themes/index';
import { ActionButton } from './ActionButton';

import { v4 as uuidv4 } from 'uuid';


import {
  adminConfigurationDeploymentAdmin,
  adminConfigurationDeploymentLibrary,
  adminConfigurationDeploymentMiroir,
  AppTheme,
  defaultAdminViewParams,
  defaultMiroirMetaModel,
  defaultMiroirModelEnvironment,
  defaultViewParamsFromAdminStorageFetchQueryParams,
  Domain2QueryReturnType,
  DomainControllerInterface,
  DomainElementSuccess,
  dummyDomainManyQueryWithDeploymentUuid,
  EntityInstancesUuidIndex,
  getQueryRunnerParamsForReduxDeploymentsState,
  LoggerInterface,
  MetaModel,
  miroirFundamentalJzodSchema,
  MiroirLoggerFactory,
  ReduxDeploymentsState,
  SyncBoxedExtractorOrQueryRunnerMap,
  SyncQueryRunner,
  ViewParamsData
} from "miroir-core";
import { getMemoizedReduxDeploymentsStateSelectorMap, ReduxStateChanges } from "miroir-localcache-redux";

import {
  useDomainControllerService,
  useLocalCacheTransactions,
  useMiroirContextService,
  useSnackbar,
} from "../../MiroirContextReactProvider.js";
import { MiroirThemeProvider, useMiroirTheme } from '../../contexts/MiroirThemeContext.js';
import { useRenderTracker } from "../../tools/renderCountTracker.js";
import AppBar from './AppBar.js';

import { packageName } from '../../../../constants.js';
import { useCurrentModel, useReduxDeploymentsStateQuerySelectorForCleanedResult } from "../../ReduxHooks.js";
import { cleanLevel } from '../../constants.js';
import { usePageConfiguration } from '../../services/index.js';
import { InstanceEditorOutline } from '../InstanceEditorOutline.js';
import { DocumentOutlineContextProvider } from '../ValueObjectEditor/InstanceEditorOutlineContext';
import { ViewParamsUpdateQueue, ViewParamsUpdateQueueConfig } from '../ViewParamsUpdateQueue.js';
import { Sidebar } from "./Sidebar.js";
import { SidebarWidth } from "./SidebarSection.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "RootComponent"), "UI",
).then((logger: LoggerInterface) => {log = logger});

export const emptyDomainElementObject: Domain2QueryReturnType<Record<string,any>> = {}



export interface RootComponentProps {
  // store:any;
  // reportName: string;
}


// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
/**
 * RootComponent - Optimized for React 18 Batching
 * 
 * Performance optimizations implemented:
 * 1. Stabilized dependencies in useMemo hooks to prevent unnecessary re-renders
 * 2. Batched async operations using Promise.all to reduce sequential state updates  
 * 3. Memoized selector parameters to prevent Redux selector re-runs
 * 4. Optimized context value dependencies to only change when necessary
 * 5. Batched domain controller actions to take advantage of React 18's automatic batching
 */
export const RootComponent = (props: RootComponentProps) => {
  // const params = useParams<any>() as Readonly<Params<ReportUrlParamKeys>>;

  const [drawerIsOpen, setDrawerIsOpen] = useState(true);

  // Use snackbar from context
  const {
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    showSnackbar,
    handleSnackbarClose,
    handleAsyncAction,
  } = useSnackbar();

  // InstanceEditorOutline state
  const [isOutlineOpen, setIsOutlineOpen] = useState(false);
  const [outlineWidth, setOutlineWidth] = useState(300);
  // const [outlineData, setOutlineData] = useState<any>(null);
  // const [outlineTitle, setOutlineTitle] = useState<string>("Document Structure");
  
  // Track current highlight timeout and element for proper cleanup
  const highlightTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const highlightedElementRef = useRef<HTMLElement | null>(null);
  // Remember sidebar state before outline was opened
  const [sidebarStateBeforeOutline, setSidebarStateBeforeOutline] = useState<boolean | null>(null);

  const domainController: DomainControllerInterface = useDomainControllerService();
  const context = useMiroirContextService();
  const navigate = useNavigate();
  // Get theme for theming the outline highlight colors
  const theme = useMiroirTheme();
  // Optimize transactions selector to avoid unnecessary re-renders during bulk operations
  const transactions: ReduxStateChanges[] = useLocalCacheTransactions();
  const miroirConfig = context.miroirContext.getMiroirConfig();

  // Configuration loading service for centralized configuration management
  const { fetchConfigurations } = usePageConfiguration();

  // Track render counts with centralized tracker
  const currentNavigationKey = `${context.deploymentUuid}-${context.applicationSection}`;
  const { navigationCount, totalCount } = useRenderTracker("RootComponent", currentNavigationKey);

  log.info(
    "##################################### rendering root component",
    "totalRenderCount",
    totalCount,
    "navigationRenderCount",
    navigationCount
  );

  // Memoize current model to prevent unnecessary re-renders
  const currentModel: MetaModel = useCurrentModel(adminConfigurationDeploymentAdmin.uuid);

  if (miroirConfig && miroirConfig.miroirConfigType != "client") {
    throw new Error(
      "RootComponent: miroirConfig.miroirConfigType != 'client' " + JSON.stringify(miroirConfig)
    );
  }

  // ##############################################################################################
  // Stable references to prevent unnecessary re-renders
  const displayedDeploymentUuid = useMemo(() => context.deploymentUuid, [context.deploymentUuid]);
  const setDisplayedDeploymentUuid = useMemo(
    () => context.setDeploymentUuid,
    [context.setDeploymentUuid]
  );
  // const displayedApplicationSection = useMemo(() => context.applicationSection, [context.applicationSection]);
  const setDisplayedApplicationSection = useMemo(
    () => context.setApplicationSection,
    [context.setApplicationSection]
  );

  // ###############################################################################################
  useEffect(() => context.setMiroirFundamentalJzodSchema(miroirFundamentalJzodSchema as any));
  // ###############################################################################################

  const handleDrawerOpen = useMemo(
    () => () => {
      setDrawerIsOpen(true);
      // If opening sidebar, close outline
      if (isOutlineOpen) {
        setIsOutlineOpen(false);
      }
    },
    [setDrawerIsOpen, isOutlineOpen]
  );

  const handleDrawerClose = useMemo(
    () => () => {
      setDrawerIsOpen(false);
      // Note: When closing sidebar, we don't automatically open outline
      // The user can manually open it if needed
    },
    [setDrawerIsOpen]
  );

  // Coordinated drawer state handler for sidebar
  const handleDrawerStateChange = useMemo(
    () => (isOpen: boolean) => {
      if (isOpen) {
        handleDrawerOpen();
      } else {
        handleDrawerClose();
      }
    },
    [handleDrawerOpen, handleDrawerClose]
  );

  const handleChangeDisplayedDeployment = useMemo(
    () => (event: SelectChangeEvent<unknown>) => {
      event.stopPropagation();
      log.info("handleChangeDisplayedDeployment", event);
      setDisplayedDeploymentUuid(event.target.value as string);
      log.info("handleChangeDisplayedDeployment", displayedDeploymentUuid);
      setDisplayedApplicationSection("data");
      // setDisplayedReportUuid("");
    },
    [setDisplayedDeploymentUuid, setDisplayedApplicationSection]
  );

  // ##############################################################################################
  // InstanceEditorOutline handlers with sidebar coordination
  const handleToggleOutline = useCallback(() => {
    setIsOutlineOpen((prev) => {
      const newOutlineState = !prev;

      if (newOutlineState) {
        // Opening outline: remember current sidebar state and close it
        setSidebarStateBeforeOutline(drawerIsOpen);
        if (drawerIsOpen) {
          setDrawerIsOpen(false);
        }
      } else {
        // Closing outline: restore sidebar to its previous state
        if (sidebarStateBeforeOutline !== null) {
          setDrawerIsOpen(sidebarStateBeforeOutline);
          setSidebarStateBeforeOutline(null);
        }
      }

      return newOutlineState;
    });
  }, [drawerIsOpen, sidebarStateBeforeOutline]);

  // ##############################################################################################
  const handleNavigateToPath = useCallback((path: string[]) => {
    const rootLessListKey = path.join(".");

    console.log(
      "Attempting to navigate to path:",
      path,
      "rootLessListKey:",
      rootLessListKey,
    );

    // Helper function to escape CSS selectors
    const escapeCSS = (str: string) => {
      return str.replace(/[!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~\s]/g, "\\$&");
    };

    // Try multiple strategies to find the element
    let targetElement: HTMLElement | null = null;

    // Strategy 1: Direct ID match
    targetElement = document.getElementById(rootLessListKey);

    // Strategy 2: Try with escaped CSS selector
    if (!targetElement) {
      try {
        const escapedSelector = escapeCSS(rootLessListKey);
        targetElement = document.querySelector(`#${escapedSelector}`) as HTMLElement;
      } catch (e) {
        console.warn("CSS selector failed:", e);
      }
    }

    // Strategy 3: Try with data-testid
    if (!targetElement) {
      try {
        const escapedSelector = escapeCSS(rootLessListKey);
        targetElement = document.querySelector(
          `[data-testid="miroirInput"][id="${rootLessListKey}"]`
        ) as HTMLElement;
      } catch (e) {
        // Ignore selector errors
      }
    }

    // Strategy 4: Try partial matches (contains)
    if (!targetElement) {
      // Split the path and try to find elements that contain parts of the path
      const pathParts = path.slice(-2); // Take last 2 parts for a more specific search
      const partialKey = pathParts.join(".");

      const candidates = Array.from(document.querySelectorAll("[id]"));
      for (const candidate of candidates) {
        const id = (candidate as HTMLElement).id;
        if (id && id.includes(partialKey)) {
          targetElement = candidate as HTMLElement;
          console.log("Found partial match:", id);
          break;
        }
      }
    }

    // Strategy 5: Try finding by the last part of the path
    if (!targetElement) {
      const lastPart = path[path.length - 1];
      const candidates = Array.from(document.querySelectorAll("[id]"));
      for (const candidate of candidates) {
        const id = (candidate as HTMLElement).id;
        if (id && id.endsWith(lastPart)) {
          targetElement = candidate as HTMLElement;
          console.log("Found by last part match:", id);
          break;
        }
      }
    }

    // Strategy 6: Fuzzy search through all IDs
    if (!targetElement) {
      console.log("Trying fuzzy search...");
      const allElementsWithIds = document.querySelectorAll("[id]");
      const ids = Array.from(allElementsWithIds)
        .map((el) => ({
          element: el as HTMLElement,
          id: el.id,
        }))
        .filter((item) => item.id);

      // Look for elements that contain most of the path parts
      const pathWords = path.join(" ").toLowerCase().split(/\s+/);
      let bestMatch: { element: HTMLElement; score: number } | null = null;

      for (const { element, id } of ids) {
        const idWords = id.toLowerCase().replace(/[._-]/g, " ").split(/\s+/);
        let score = 0;

        for (const pathWord of pathWords) {
          if (pathWord.length > 2) {
            // Only consider meaningful words
            for (const idWord of idWords) {
              if (idWord.includes(pathWord) || pathWord.includes(idWord)) {
                score++;
              }
            }
          }

          if (score > 0 && (!bestMatch || score > bestMatch.score)) {
            bestMatch = { element, score };
          }
        }

        if (bestMatch && bestMatch.score >= 2)
          // Require at least 2 word matches
          targetElement = bestMatch.element;
      }
    }
    if (targetElement) {
      // Clear any existing highlight and timeout
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
        highlightTimeoutRef.current = null;
      }
      
      // Remove highlight from previously highlighted element if it exists
      if (highlightedElementRef.current) {
        const prevElement = highlightedElementRef.current;
        // Only clear styles if they haven't been modified by other code
        if (prevElement.style.backgroundColor.includes(theme.currentTheme.colors.warningLight) ||
            prevElement.style.border.includes(theme.currentTheme.colors.warning)) {
          prevElement.style.backgroundColor = '';
          prevElement.style.border = '';
          prevElement.style.borderRadius = '';
          prevElement.style.transition = '';
        }
      }
      
      // Scroll the element into view with smooth behavior
      targetElement.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest",
      });

      // Store original styles for restoration
      const originalBackgroundColor = targetElement.style.backgroundColor;
      const originalBorder = targetElement.style.border;
      const originalBorderRadius = targetElement.style.borderRadius;

      // Apply highlight styles
      targetElement.style.backgroundColor = theme.currentTheme.colors.warningLight;
      targetElement.style.border = `2px solid ${theme.currentTheme.colors.warning}`;
      targetElement.style.borderRadius = "4px";
      targetElement.style.transition = "all 0.3s ease";

      // Store reference to currently highlighted element
      highlightedElementRef.current = targetElement;

      // Remove the highlight after 2 seconds
      highlightTimeoutRef.current = setTimeout(() => {
        if (targetElement === highlightedElementRef.current) {
          targetElement.style.backgroundColor = originalBackgroundColor;
          targetElement.style.border = originalBorder;
          targetElement.style.borderRadius = originalBorderRadius;
          targetElement.style.transition = "";
          highlightedElementRef.current = null;
        }
        highlightTimeoutRef.current = null;
      }, 2000);
    } else {
      console.warn("Element not found for path:", path, "rootLessListKey:", rootLessListKey);

      // List all elements with IDs to help with debugging
      const allElementsWithIds = document.querySelectorAll("[id]");
      const ids = Array.from(allElementsWithIds)
        .map((el) => el.id)
        .filter((id) => id);
      console.log("Available element IDs (first 20):", ids.slice(0, 20));
      console.log("Total elements with IDs:", ids.length);

      // Show IDs that might be related
      const relatedIds = ids.filter((id) => {
        const pathStr = path.join("").toLowerCase();
        const idStr = id.toLowerCase();
        return pathStr.includes(idStr.slice(-10)) || idStr.includes(pathStr.slice(-10));
      });

      if (relatedIds.length > 0) {
        console.log("Potentially related IDs:", relatedIds);
      }
    }
  }, [theme]);

  // ##############################################################################################
  // Document outline context value
  const deploymentEntityStateSelectorMap: SyncBoxedExtractorOrQueryRunnerMap<ReduxDeploymentsState> =
    useMemo(() => getMemoizedReduxDeploymentsStateSelectorMap(), []);

  // Stabilize query params to prevent unnecessary selector re-runs
  const stableQueryParams = useMemo(
    () =>
      currentModel?.entities?.length > 0
        ? defaultViewParamsFromAdminStorageFetchQueryParams(deploymentEntityStateSelectorMap)
        : getQueryRunnerParamsForReduxDeploymentsState(dummyDomainManyQueryWithDeploymentUuid),
    [currentModel?.entities?.length, deploymentEntityStateSelectorMap]
  );

  const defaultViewParamsFromAdminStorageFetchQueryResults: Record<
    string,
    EntityInstancesUuidIndex
  > = useReduxDeploymentsStateQuerySelectorForCleanedResult(
    deploymentEntityStateSelectorMap.runQuery as SyncQueryRunner<
      ReduxDeploymentsState,
      Domain2QueryReturnType<DomainElementSuccess>
    >,
    stableQueryParams
  );

  // Optimize ViewParams state management to reduce re-renders
  const defaultViewParamsFromAdminStorage: ViewParamsData | undefined = useMemo(
    () =>
      (defaultViewParamsFromAdminStorageFetchQueryResults?.["viewParams"] as any) ||
      defaultAdminViewParams,
    [defaultViewParamsFromAdminStorageFetchQueryResults]
  );

  log.info(
    "RootComponent: defaultViewParamsFromAdminStorageFetchQueryResults",
    defaultViewParamsFromAdminStorage,
    defaultViewParamsFromAdminStorageFetchQueryResults
  );

  // Get the database sidebar width value with stable reference
  const dbSidebarWidth = useMemo(
    () => defaultViewParamsFromAdminStorage?.sidebarWidth,
    [defaultViewParamsFromAdminStorage?.sidebarWidth]
  );

  // Use local state for sidebar width that can be overridden by user
  const [sidebarWidth, setSidebarWidth] = useState(dbSidebarWidth ?? SidebarWidth);
  const [userHasChangedSidebarWidth, setUserHasChangedSidebarWidth] = useState(false);

  // Initialize the ViewParamsUpdateQueue with stable dependencies
  const updateQueue = useMemo(() => {
    if (!defaultViewParamsFromAdminStorage) {
      return null;
    }

    const viewParamsInstanceUuid = Object.keys(defaultViewParamsFromAdminStorage)[0];

    if (!viewParamsInstanceUuid) {
      return null;
    }

    const config: ViewParamsUpdateQueueConfig = {
      // delayMs: 60000, // 1 minute
      delayMs: 5000, // 5 seconds
      deploymentUuid: adminConfigurationDeploymentAdmin.uuid,
      viewParamsInstanceUuid: viewParamsInstanceUuid,
    };

    try {
      return ViewParamsUpdateQueue.getInstance(config, domainController);
    } catch (error) {
      log.error("Failed to initialize ViewParamsUpdateQueue", error);
      return null;
    }
  }, [
    defaultViewParamsFromAdminStorage ? Object.keys(defaultViewParamsFromAdminStorage)[0] : null,
    domainController,
  ]);

  // Update sidebar width when database value changes (only if user hasn't made changes)
  useEffect(() => {
    if (!userHasChangedSidebarWidth && dbSidebarWidth && dbSidebarWidth !== sidebarWidth) {
      setSidebarWidth(dbSidebarWidth);
      // log.info("RootComponent: Updated sidebar width from database", dbSidebarWidth);
    }
  }, [dbSidebarWidth, userHasChangedSidebarWidth, sidebarWidth]);

  // Cleanup highlight timeout on unmount
  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
      if (highlightedElementRef.current) {
        const element = highlightedElementRef.current;
        // Clear highlight styles if they match our theme colors
        if (element.style.backgroundColor.includes(theme.currentTheme.colors.warningLight) ||
            element.style.border.includes(theme.currentTheme.colors.warning)) {
          element.style.backgroundColor = '';
          element.style.border = '';
          element.style.borderRadius = '';
          element.style.transition = '';
        }
      }
    };
  }, [theme.currentTheme.colors.warningLight, theme.currentTheme.colors.warning]);

  const handleSidebarWidthChange = useMemo(
    () => (width: number) => {
      setSidebarWidth(width);
      setUserHasChangedSidebarWidth(true);

      // Queue the update if the new width is different from the database value
      if (defaultViewParamsFromAdminStorage && updateQueue && width !== dbSidebarWidth) {
        updateQueue.queueUpdate({
          currentValue: defaultViewParamsFromAdminStorage,
          updates: {
            sidebarWidth: width,
          },
        });
        log.info("RootComponent: Queued sidebar width update", width);
      }
    },
    [setSidebarWidth, updateQueue, dbSidebarWidth, defaultViewParamsFromAdminStorage]
  );

  // Grid type toggle handler
  const handleGridTypeToggle = useMemo(
    () => () => {
      if (defaultViewParamsFromAdminStorage && updateQueue) {
        const currentGridType = defaultViewParamsFromAdminStorage.gridType || "ag-grid";
        const newGridType = currentGridType === "ag-grid" ? "glide-data-grid" : "ag-grid";

        updateQueue.queueUpdate(
          {
            currentValue: defaultViewParamsFromAdminStorage,
            updates: {
              gridType: newGridType,
            },
          },
          true
        ); // Force immediate processing for grid type changes
        log.info("RootComponent: Queued grid type toggle (immediate)", {
          from: currentGridType,
          to: newGridType,
        });
      }
    },
    [updateQueue, defaultViewParamsFromAdminStorage]
  );

  // App theme change handler
  const handleAppThemeChange = useMemo(
    () => (newThemeId: string) => {
      if (defaultViewParamsFromAdminStorage && updateQueue) {
        const currentAppTheme = defaultViewParamsFromAdminStorage.appTheme || "default";

        updateQueue.queueUpdate(
          {
            currentValue: defaultViewParamsFromAdminStorage,
            updates: {
              appTheme: newThemeId as AppTheme,
            },
          },
          true
        ); // Force immediate processing for app theme changes
        log.info("RootComponent: Queued app theme change (immediate)", {
          from: currentAppTheme,
          to: newThemeId,
        });
      }
    },
    [updateQueue, defaultViewParamsFromAdminStorage]
  );

  // Cleanup the queue on unmount
  useEffect(() => {
    return () => {
      if (updateQueue) {
        // Flush any pending updates before unmounting
        updateQueue.flushImmediately().catch((error) => {
          log.error("Failed to flush pending updates on unmount", error);
        });
      }
    };
  }, [updateQueue]);

  // const outlineContextValue: DocumentOutlineContextType = useMemo(
  //   () =>
  //     new DocumentOutlineContextDefault(
  //       isOutlineOpen,
  //       outlineWidth,
  //       outlineData,
  //       outlineTitle,
  //       handleToggleOutline,
  //       handleNavigateToPath,
  //       setOutlineData,
  //       setOutlineTitle,
  //       ()=>{},
  //       ()=>{}
  //     ),
  //   [
  //     isOutlineOpen,
  //     outlineWidth,
  //     outlineData,
  //     outlineTitle,
  //     handleToggleOutline,
  //     handleNavigateToPath,
  //   ]
  // );

  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  return (
    // <DocumentOutlineContext.Provider value={outlineContextValue}>
    <DocumentOutlineContextProvider
      isOutlineOpen={isOutlineOpen}
      onToggleOutline={handleToggleOutline}
      onNavigateToPath={handleNavigateToPath}
    >
      <MiroirThemeProvider
        currentThemeId={defaultViewParamsFromAdminStorage?.appTheme || "default"}
        onThemeChange={handleAppThemeChange}
      >
        <>
          <Sidebar
            open={drawerIsOpen}
            setOpen={handleDrawerStateChange}
            width={sidebarWidth}
            onWidthChange={handleSidebarWidthChange}
          />
          <ThemedGrid container direction="column" id="mainPanel">
            {/* <ThemedGrid item> */}
            <AppBar
              handleDrawerOpen={handleDrawerOpen}
              open={drawerIsOpen}
              width={sidebarWidth}
              onWidthChange={handleSidebarWidthChange}
              outlineOpen={isOutlineOpen}
              outlineWidth={outlineWidth}
              onOutlineToggle={handleToggleOutline}
              gridType={defaultViewParamsFromAdminStorage?.gridType || "ag-grid"}
              onGridTypeToggle={handleGridTypeToggle}
            >
              Bar!
            </AppBar>
            <ThemedMainPanel
              sideBarOpen={drawerIsOpen}
              sideBarWidth={sidebarWidth}
              outlineOpen={isOutlineOpen}
              outlineWidth={outlineWidth}
            >
              <ThemedText>uuid: {uuidv4()}</ThemedText>
              {transactions && transactions.length > 0 && (
                <ThemedText> transactions: {JSON.stringify(transactions)}</ThemedText>
              )}
              {context.showPerformanceDisplay && (
                <div>
                  RootComponent renders: {navigationCount} (total: {totalCount})
                </div>
              )}
              {/* <ThemedFormControl fullWidth>
                <ThemedInputLabel id="demo-simple-select-label">
                  Chosen selfApplication Deployment
                </ThemedInputLabel>
                <ThemedMUISelect
                  labelId="demo-simple-select-label"
                  id="demo-simple-select"
                  value={context.deploymentUuid}
                  label="displayedDeploymentUuid"
                  onChange={handleChangeDisplayedDeployment}
                >
                  {deployments.map((deployment) => {
                    return (
                      <ThemedMenuItem key={deployment.name} value={deployment.uuid}>
                        {deployment.description}
                      </ThemedMenuItem>
                    );
                  })}
                </ThemedMUISelect>
              </ThemedFormControl> */}
              <span>
                {/* <ThemedButton
                        onClick={() =>
                          handleAsyncAction(
                            async () => {
                              log.info(
                                "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ OPENSTORE @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@"
                              );
                              if (!miroirConfig) {
                                throw new Error(
                                  "no miroirConfig given, it has to be given on the command line starting the server!"
                                );
                              }
                              const configurations = miroirConfig.client.emulateServer
                                ? miroirConfig.client.deploymentStorageConfig
                                : miroirConfig.client.serverConfig.storeSectionConfiguration;

                              // Batch all store open operations to reduce re-renders
                              const openStoreActions = Object.entries(configurations).map(
                                ([deploymentUuid, config]) => ({
                                  actionType: "storeManagementAction_openStore" as const,
                                  endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f" as const,
                                  configuration: {
                                    [deploymentUuid]: config as StoreUnitConfiguration,
                                  },
                                  deploymentUuid,
                                })
                              );

                              await Promise.all(
                                openStoreActions.map((action) =>
                                  domainController.handleAction(action)
                                )
                              );

                              log.info(
                                "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ OPENSTORE DONE @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@"
                              );
                            },
                            "Database opened successfully",
                            "open database"
                          )
                        }
                      >
                        Open database
                      </ThemedButton> */}
                <ThemedButton onClick={fetchConfigurations}>
                  fetch Miroir & App configurations from database
                </ThemedButton>
                {/* <ThemedButton
                        onClick={() =>
                          handleAsyncAction(
                            async () => {
                              log.info(
                                "fetching instances from datastore for deployment",
                                adminConfigurationDeploymentMiroir
                              );
                              await domainController.handleAction(
                                {
                                  // actionType: "modelAction",
                                  actionType: "rollback",
                                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                                  deploymentUuid: adminConfigurationDeploymentAdmin.uuid,
                                },
                                defaultMiroirMetaModel
                              );
                            },
                            "Admin configuration fetched successfully",
                            "fetch admin configuration"
                          )
                        }
                      >
                        fetch Admin configuration from database
                      </ThemedButton> */}
                {/* <ThemedButton
                        onClick={() =>
                          handleAsyncAction(
                            async () => {
                              await domainController.handleAction(
                                {
                                  actionType: "remoteLocalCacheRollback",
                                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                                  deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
                                },
                                defaultMiroirMetaModel
                              );
                              await domainController.handleAction(
                                {
                                  actionType: "remoteLocalCacheRollback",
                                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                                  deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                                },
                                defaultMiroirMetaModel
                              );
                            },
                            "Server local cache loaded successfully",
                            "load server local cache"
                          )
                        }
                      >
                        Load server local cache
                      </ThemedButton> */}
                {/* commit miroir */}
                <ActionButton
                  onAction={async () => {
                    await domainController.handleAction(
                      {
                        actionType: "commit",
                        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                        deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
                      },
                      defaultMiroirModelEnvironment
                    );
                  }}
                  successMessage="Miroir committed successfully"
                  label="Commit Miroir"
                  handleAsyncAction={handleAsyncAction}
                  actionName="commit miroir"
                />
                {/* Commit Library app */}
                <ActionButton
                  onAction={async () => {
                    await domainController.handleAction(
                      {
                        actionType: "commit",
                        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                        deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                      },
                      defaultMiroirModelEnvironment
                    );
                  }}
                  successMessage="Library app committed successfully"
                  label="Commit Library app"
                  handleAsyncAction={handleAsyncAction}
                  actionName="commit library app"
                />
              </span>
              {/* TODO: enclose the outlet in a PageContainer? (see ReportPage, Tools page) */}
              <Outlet></Outlet>
            </ThemedMainPanel>
          </ThemedGrid>
          {/* </ThemedGrid> */}
          {/* Document Outline - Full height on right side */}
          <InstanceEditorOutline
            isOpen={isOutlineOpen}
            onToggle={handleToggleOutline}
            // data={outlineData}
            // rootObjectKey={Object.keys(outlineData || {})[0] || ""}
            onNavigate={handleNavigateToPath}
            // title={outlineTitle}
            width={outlineWidth}
            onWidthChange={setOutlineWidth}
          />
          <Snackbar
            open={snackbarOpen}
            autoHideDuration={6000}
            onClose={handleSnackbarClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          >
            <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: "100%" }}>
              {snackbarMessage}
            </Alert>
          </Snackbar>
          {/* Action Timeline - Show when enabled */}
          <EventTimelineContainer key={`action-timeline-${context.showActionTimeline}`} />
        </>
      </MiroirThemeProvider>
    </DocumentOutlineContextProvider>
  );
};
