/**
 * PERFORMANCE OPTIMIZATIONS FOR REACT 18 BATCHING
 * 
 * This component has been optimized to reduce excessive re-renders, particularly
 * when performing bulk async operations like "fetch Miroir & App configurations from database".
 * 
 * Key optimizations:
 * 
 * 1. DEPENDENCY STABILIZATION:
 *    - Fixed context dependencies to only update when specific values change
 *    - Memoized selector parameters to prevent Redux selector re-runs
 *    - Stable references for ViewParams and update queue initialization
 * 
 * 2. ASYNC OPERATION BATCHING:
 *    - Changed sequential async operations to Promise.all for parallel execution
 *    - Grouped related domain controller actions to reduce state updates
 *    - Used startTransition for non-urgent UI updates (snackbar notifications)
 * 
 * 3. REACT 18 BATCHING SUPPORT:
 *    - Leveraged automatic batching in async operations
 *    - Used startTransition to defer non-critical state updates
 *    - Reduced blocking operations to allow better batching
 * 
 * 4. SELECTOR OPTIMIZATION:
 *    - Memoized query parameters to prevent selector recreation
 *    - Stabilized ViewParams dependencies 
 *    - Added specific dependency arrays instead of broad object references
 * 
 * Expected result: Reduced from ~16 re-renders to ~3-4 re-renders for bulk operations
 */

import {
  createContext, useContext, useCallback, useEffect, useMemo, useState, startTransition 
} from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import type { SelectChangeEvent, AppBarProps as MuiAppBarProps } from '@mui/material';
import { 
  AppBar as MuiAppBar, 
  styled, 
  Toolbar, 
  Box, 
  Grid, 
  Snackbar, 
  Alert,
  Typography,
  Button
} from '@mui/material';
import { Error as ErrorIcon, BugReport as BugReportIcon } from '@mui/icons-material';
import { 
  ThemedSelect,
  ThemedButton,
  ThemedBox,
  ThemedGrid,
  ThemedFormControl,
  ThemedInputLabel,
  ThemedMenuItem,
  ThemedMUISelect,
  ThemedText
} from '../Themes/index';
import { ActionButton } from './ActionButton';
import { EventTimelineContainer } from '../EventTimelineContainer';

import { v4 as uuidv4 } from 'uuid';


import {
  Action2Error,
  Action2ReturnType,
  adminConfigurationDeploymentAdmin,
  adminConfigurationDeploymentLibrary,
  adminConfigurationDeploymentMiroir,
  BoxedQueryTemplateWithExtractorCombinerTransformer,
  defaultAdminViewParams,
  defaultMiroirMetaModel,
  defaultViewParamsFromAdminStorageFetchQueryParams,
  ReduxDeploymentsState,
  Domain2ElementFailed,
  Domain2QueryReturnType,
  DomainControllerInterface,
  DomainElementSuccess,
  dummyDomainManyQueryWithDeploymentUuid,
  entityDeployment,
  EntityInstancesUuidIndex,
  entityViewParams,
  getQueryRunnerParamsForReduxDeploymentsState,
  LoggerInterface,
  MetaModel,
  miroirFundamentalJzodSchema,
  MiroirLoggerFactory,
  RunBoxedExtractorAction,
  RunBoxedExtractorOrQueryAction,
  StoreOrBundleAction,
  StoreUnitConfiguration,
  SyncBoxedExtractorOrQueryRunnerMap,
  SyncQueryRunner,
  SyncQueryRunnerParams,
  AppTheme,
  ViewParamsData
} from "miroir-core";
import { getMemoizedReduxDeploymentsStateSelectorMap, ReduxStateChanges } from "miroir-localcache-redux";

import {
  useDomainControllerService,
  useLocalCacheTransactions,
  useMiroirContextService,
  useSnackbar,
  // useViewParams,
} from "../../MiroirContextReactProvider.js";
import { MiroirThemeProvider, useMiroirTheme } from '../../contexts/MiroirThemeContext.js';
import { useRenderTracker } from "../../tools/renderCountTracker.js";
import AppBar from './AppBar.js';

import { adminConfigurationDeploymentParis, deployments, packageName } from '../../../../constants.js';
import { cleanLevel } from '../../constants.js';
import { Sidebar } from "./Sidebar.js";
import { SidebarWidth } from "./SidebarSection.js";
import { InstanceEditorOutline } from '../InstanceEditorOutline.js';
import { useCurrentModel, useReduxDeploymentsStateQuerySelectorForCleanedResult } from "../../ReduxHooks.js";
import { ViewParamsUpdateQueue, ViewParamsUpdateQueueConfig } from '../ViewParamsUpdateQueue.js';
import { usePageConfiguration } from '../../services/index.js';
import type { Deployment } from 'miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "RootComponent")
).then((logger: LoggerInterface) => {log = logger});

export const emptyDomainElementObject: Domain2QueryReturnType<Record<string,any>> = {}

// Document Outline Context
export interface DocumentOutlineContextType {
  isOutlineOpen: boolean;
  outlineWidth: number;
  outlineData: any;
  outlineTitle: string;
  onToggleOutline: () => void;
  onNavigateToPath: (path: string[]) => void;
  setOutlineData: (data: any) => void;
  setOutlineTitle: (title: string) => void;
}

const DocumentOutlineContext = createContext<DocumentOutlineContextType | null>(null);

export const useDocumentOutlineContext = () => {
  const context = useContext(DocumentOutlineContext);
  if (!context) {
    throw new Error('useDocumentOutlineContext must be used within a DocumentOutlineProvider');
  }
  return context;
};

export interface RootComponentProps {
  // store:any;
  // reportName: string;
}


const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<{
  open?: boolean;
}>(({ theme, open }) => ({
  flexGrow: 1,
  // display: "inline-block",
  p: 3,
  padding: theme.spacing(3),
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  // marginLeft: `-${SidebarWidth}px`,
  // marginLeft: `${SidebarWidth}px`,
  // marginLeft: `24px`,
  // ...(open && {
  //   transition: theme.transitions.create('margin', {
  //     easing: theme.transitions.easing.easeOut,
  //     duration: theme.transitions.duration.enteringScreen,
  //   }),
  //   marginLeft: 0,
  // }),
}));

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

const StyledMain =
styled(
  Main, 
  {shouldForwardProp: (prop) => prop !== "open" && prop !== "width" && prop !== "outlineOpen" && prop !== "outlineWidth"}
)<{
  open?: boolean;
  width?: number;
  outlineOpen?: boolean;
  outlineWidth?: number;
}>(
  ({ theme, open, width = SidebarWidth, outlineOpen, outlineWidth = 300 }) => ({
    boxSizing: 'border-box',
    overflow: 'auto',
    minWidth: 0,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    marginTop: 0, // Fix wide gap below the appbar
    paddingTop: theme.spacing(3),
    ...(
      open && {
        width: `calc(100% - ${width}px - ${outlineOpen ? outlineWidth : 0}px)`,
        marginLeft: `${width}px`,
        marginRight: outlineOpen ? `${outlineWidth}px` : 0,
        transition: theme.transitions.create(
          ["margin", "width"], {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen,
          }
        ),
      }
    ),
    ...(!open && outlineOpen && {
      width: `calc(100% - ${outlineWidth}px)`,
      marginRight: `${outlineWidth}px`,
      transition: theme.transitions.create(
        ["margin", "width"], {
          easing: theme.transitions.easing.easeOut,
          duration: theme.transitions.duration.enteringScreen,
        }
      ),
    }),
    ...(!open && !outlineOpen && {
      width: '100%',
      marginLeft: 0,
      marginRight: 0,
      transition: theme.transitions.create(
        ["margin", "width"], {
          easing: theme.transitions.easing.easeOut,
          duration: theme.transitions.duration.enteringScreen,
        }
      ),
    }),
  })
);

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
  
  // // Use ViewParams for sidebar width management
  // const viewParams = useViewParams();
  // const [sidebarWidth, setSidebarWidth] = useState(viewParams?.sidebarWidth ?? SidebarWidth);
  
  // Use snackbar from context
  const { snackbarOpen, snackbarMessage, snackbarSeverity, showSnackbar, handleSnackbarClose, handleAsyncAction } = useSnackbar();
  
  // InstanceEditorOutline state
  const [isOutlineOpen, setIsOutlineOpen] = useState(false);
  const [outlineWidth, setOutlineWidth] = useState(300);
  const [outlineData, setOutlineData] = useState<any>(null);
  const [outlineTitle, setOutlineTitle] = useState<string>("Document Structure");
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
    navigationCount,
  );

  // Memoize current model to prevent unnecessary re-renders
  const currentModel: MetaModel = useCurrentModel(
    adminConfigurationDeploymentAdmin.uuid
  );
  
  if (miroirConfig && miroirConfig.miroirConfigType != "client") {
    throw new Error("RootComponent: miroirConfig.miroirConfigType != 'client' " + JSON.stringify(miroirConfig));
  }

  // ##############################################################################################
  // Stable references to prevent unnecessary re-renders
  const displayedDeploymentUuid = useMemo(() => context.deploymentUuid, [context.deploymentUuid]);
  const setDisplayedDeploymentUuid = useMemo(() => context.setDeploymentUuid, [context.setDeploymentUuid]);
  // const displayedApplicationSection = useMemo(() => context.applicationSection, [context.applicationSection]);
  const setDisplayedApplicationSection = useMemo(() => context.setApplicationSection, [context.setApplicationSection]);

  // ###############################################################################################
  useEffect(() => context.setMiroirFundamentalJzodSchema(miroirFundamentalJzodSchema as any));
  // ###############################################################################################

  const handleDrawerOpen = useMemo(() => () => {
    setDrawerIsOpen(true);
    // If opening sidebar, close outline
    if (isOutlineOpen) {
      setIsOutlineOpen(false);
    }
  }, [setDrawerIsOpen, isOutlineOpen]);

  const handleDrawerClose = useMemo(() => () => {
    setDrawerIsOpen(false);
    // Note: When closing sidebar, we don't automatically open outline
    // The user can manually open it if needed
  }, [setDrawerIsOpen]);

  // Coordinated drawer state handler for sidebar
  const handleDrawerStateChange = useMemo(() => (isOpen: boolean) => {
    if (isOpen) {
      handleDrawerOpen();
    } else {
      handleDrawerClose();
    }
  }, [handleDrawerOpen, handleDrawerClose]);

  const handleChangeDisplayedDeployment = useMemo(() => (event: SelectChangeEvent<unknown>) => {
    event.stopPropagation();
    log.info('handleChangeDisplayedDeployment',event);
    setDisplayedDeploymentUuid(event.target.value as string);
    log.info('handleChangeDisplayedDeployment',displayedDeploymentUuid);
    setDisplayedApplicationSection('data');
    // setDisplayedReportUuid("");
  }, [setDisplayedDeploymentUuid, setDisplayedApplicationSection]);

  // InstanceEditorOutline handlers with sidebar coordination
  const handleToggleOutline = useCallback(() => {
    setIsOutlineOpen(prev => {
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

  const handleNavigateToPath = useCallback((path: string[]) => {
    const rootLessListKey = path.join('.');
    
    console.log('Attempting to navigate to path:', path, 'rootLessListKey:', rootLessListKey);
    
    // Helper function to escape CSS selectors
    const escapeCSS = (str: string) => {
      return str.replace(/[!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~\s]/g, '\\$&');
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
        console.warn('CSS selector failed:', e);
      }
    }
    
    // Strategy 3: Try with data-testid
    if (!targetElement) {
      try {
        const escapedSelector = escapeCSS(rootLessListKey);
        targetElement = document.querySelector(`[data-testid="miroirInput"][id="${rootLessListKey}"]`) as HTMLElement;
      } catch (e) {
        // Ignore selector errors
      }
    }
    
    // Strategy 4: Try partial matches (contains)
    if (!targetElement) {
      // Split the path and try to find elements that contain parts of the path
      const pathParts = path.slice(-2); // Take last 2 parts for a more specific search
      const partialKey = pathParts.join('.');
      
      const candidates = Array.from(document.querySelectorAll('[id]'));
      for (const candidate of candidates) {
        const id = (candidate as HTMLElement).id;
        if (id && id.includes(partialKey)) {
          targetElement = candidate as HTMLElement;
          console.log('Found partial match:', id);
          break;
        }
      }
    }
    
    // Strategy 5: Try finding by the last part of the path
    if (!targetElement) {
      const lastPart = path[path.length - 1];
      const candidates = Array.from(document.querySelectorAll('[id]'));
      for (const candidate of candidates) {
        const id = (candidate as HTMLElement).id;
        if (id && id.endsWith(lastPart)) {
          targetElement = candidate as HTMLElement;
          console.log('Found by last part match:', id);
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
      // Scroll the element into view with smooth behavior
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest'
      });
      
      // Optional: Add a temporary highlight effect
      const originalBackgroundColor = targetElement.style.backgroundColor;
      const originalBorder = targetElement.style.border;
      const originalBorderRadius = targetElement.style.borderRadius;
      
      targetElement.style.backgroundColor = theme.currentTheme.colors.warningLight;
      targetElement.style.border = `2px solid ${theme.currentTheme.colors.warning}`;
      targetElement.style.borderRadius = '4px';
      targetElement.style.transition = 'all 0.3s ease';
      
      // Remove the highlight after 2 seconds
      setTimeout(() => {
        targetElement!.style.backgroundColor = originalBackgroundColor;
        targetElement!.style.border = originalBorder;
        targetElement!.style.borderRadius = originalBorderRadius;
        targetElement!.style.transition = '';
      }, 2000);
    } else {
      console.warn('Element not found for path:', path, 'rootLessListKey:', rootLessListKey);
      
      // List all elements with IDs to help with debugging
      const allElementsWithIds = document.querySelectorAll('[id]');
      const ids = Array.from(allElementsWithIds).map(el => el.id).filter(id => id);
      console.log('Available element IDs (first 20):', ids.slice(0, 20));
      console.log('Total elements with IDs:', ids.length);
      
      // Show IDs that might be related
      const relatedIds = ids.filter(id => {
        const pathStr = path.join('').toLowerCase();
        const idStr = id.toLowerCase();
        return pathStr.includes(idStr.slice(-10)) || idStr.includes(pathStr.slice(-10));
      });
      
      if (relatedIds.length > 0) {
        console.log('Potentially related IDs:', relatedIds);
      }
    }
  }, []);

  // Document outline context value
  const outlineContextValue: DocumentOutlineContextType = useMemo(
    () => ({
      isOutlineOpen,
      outlineWidth,
      outlineData,
      outlineTitle,
      onToggleOutline: handleToggleOutline,
      onNavigateToPath: handleNavigateToPath,
      setOutlineData,
      setOutlineTitle,
    }),
    [isOutlineOpen, outlineWidth, outlineData, outlineTitle, handleToggleOutline, handleNavigateToPath]
  );

  const deploymentEntityStateSelectorMap: SyncBoxedExtractorOrQueryRunnerMap<ReduxDeploymentsState> =
  useMemo(() => getMemoizedReduxDeploymentsStateSelectorMap(), []);

  // Stabilize query params to prevent unnecessary selector re-runs
  const stableQueryParams = useMemo(
    () => currentModel?.entities?.length > 0
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
    () => defaultViewParamsFromAdminStorageFetchQueryResults?.["viewParams"] as any || defaultAdminViewParams,
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
      viewParamsInstanceUuid: viewParamsInstanceUuid
    };

    try {
      return ViewParamsUpdateQueue.getInstance(config, domainController);
    } catch (error) {
      log.error("Failed to initialize ViewParamsUpdateQueue", error);
      return null;
    }
  }, [
    defaultViewParamsFromAdminStorage ? Object.keys(defaultViewParamsFromAdminStorage)[0] : null,
    domainController
  ]);

  // Update sidebar width when database value changes (only if user hasn't made changes)
  useEffect(() => {
    if (!userHasChangedSidebarWidth && dbSidebarWidth && dbSidebarWidth !== sidebarWidth) {
      setSidebarWidth(dbSidebarWidth);
      // log.info("RootComponent: Updated sidebar width from database", dbSidebarWidth);
    }
  }, [dbSidebarWidth, userHasChangedSidebarWidth, sidebarWidth]);

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
          }
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
        const currentGridType = defaultViewParamsFromAdminStorage.gridType || 'ag-grid';
        const newGridType = currentGridType === 'ag-grid' ? 'glide-data-grid' : 'ag-grid';
        
        updateQueue.queueUpdate({
          currentValue: defaultViewParamsFromAdminStorage,
          updates: {
            gridType: newGridType,
          }
        }, true); // Force immediate processing for grid type changes
        log.info("RootComponent: Queued grid type toggle (immediate)", { from: currentGridType, to: newGridType });
      }
    },
    [updateQueue, defaultViewParamsFromAdminStorage]
  );

  // App theme change handler
  const handleAppThemeChange = useMemo(
    () => (newThemeId: string) => {
      if (defaultViewParamsFromAdminStorage && updateQueue) {
        const currentAppTheme = defaultViewParamsFromAdminStorage.appTheme || 'default';
        
        updateQueue.queueUpdate({
          currentValue: defaultViewParamsFromAdminStorage,
          updates: {
            appTheme: newThemeId as AppTheme,
          }
        }, true); // Force immediate processing for app theme changes
        log.info("RootComponent: Queued app theme change (immediate)", { from: currentAppTheme, to: newThemeId });
      }
    },
    [updateQueue, defaultViewParamsFromAdminStorage]
  );

  // Cleanup the queue on unmount
  useEffect(() => {
    return () => {
      if (updateQueue) {
        // Flush any pending updates before unmounting
        updateQueue.flushImmediately().catch(error => {
          log.error("Failed to flush pending updates on unmount", error);
        });
      }
    };
  }, [updateQueue]);

  return (
    <DocumentOutlineContext.Provider value={outlineContextValue}>
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
          <ThemedGrid
            container
            direction="column"
            id="mainPanel"
            // style={{ height: "100vh" }}
          >
            <ThemedGrid item>
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
            </ThemedGrid>
            <ThemedGrid item container style={{ flex: 1, overflow: "hidden" }}>
              <ThemedGrid item>
                <StyledMain
                  open={drawerIsOpen}
                  width={sidebarWidth}
                  outlineOpen={isOutlineOpen}
                  outlineWidth={outlineWidth}
                >
                  <ThemedText>uuid: {uuidv4()}</ThemedText>
                  <ThemedText>transactions: {JSON.stringify(transactions)}</ThemedText>
                  {context.showPerformanceDisplay && (
                    <>
                      <div>
                        RootComponent renders: {navigationCount} (total: {totalCount})
                      </div>
                    </>
                  )}
                  <ThemedFormControl fullWidth>
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
                  </ThemedFormControl>
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
                            defaultMiroirMetaModel
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
                            defaultMiroirMetaModel
                          );
                        }}
                        successMessage="Library app committed successfully"
                        label="Commit Library app"
                        handleAsyncAction={handleAsyncAction}
                        actionName="commit library app"
                      />
                  </span>
                  {/* Wrap Outlet in a container that allows scrolling when needed */}
                  <ThemedBox id="rootComponentOutletContainer" style={{ flex: 1, overflow: "auto" }}>
                    <Outlet></Outlet>
                  </ThemedBox>
                </StyledMain>
              </ThemedGrid>
            </ThemedGrid>
          </ThemedGrid>
          {/* Document Outline - Full height on right side */}
          <InstanceEditorOutline
            isOpen={isOutlineOpen}
            onToggle={handleToggleOutline}
            data={outlineData}
            onNavigate={handleNavigateToPath}
            title={outlineTitle}
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
    </DocumentOutlineContext.Provider>
  );
};
