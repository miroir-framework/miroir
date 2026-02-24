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
  ThemedGrid,
  ThemedMainPanel,
  ThemedText
} from '../Themes/index';

import { v4 as uuidv4 } from 'uuid';


import {
  AppTheme,
  defaultSelfApplicationDeploymentMap,
  defaultViewParamsFromAdminStorageFetchQueryParams,
  Domain2ElementFailed,
  Domain2QueryReturnType,
  DomainControllerInterface,
  DomainElementSuccess,
  dummyDomainManyQueryWithDeploymentUuid,
  EntityInstancesUuidIndex,
  getApplicationSection,
  getQueryRunnerParamsForReduxDeploymentsState,
  getReportsAndEntitiesDefinitionsForDeploymentUuid,
  LoggerInterface,
  MetaModel,
  miroirFundamentalJzodSchema,
  MiroirLoggerFactory,
  ReduxDeploymentsState,
  selfApplicationMiroir,
  SyncBoxedExtractorOrQueryRunnerMap,
  SyncQueryRunner,
  ViewParamsData,
  type ApplicationDeploymentMap,
  type Deployment,
  type SyncQueryRunnerExtractorAndParams
} from "miroir-core";
import {
  deployment_Admin,
  deployment_Miroir,
  adminSelfApplication,
  defaultAdminViewParams,
  entityDeployment
} from "miroir-test-app_deployment-admin";

import {
  getMemoizedReduxDeploymentsStateSelectorMap,
  ReduxStateChanges,
} from "../../../miroir-localcache-imports.js";

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
import {
  useApplicationDeploymentMapFromLocalCache,
  useCurrentModel,
  useReduxDeploymentsStateQuerySelector,
  useReduxDeploymentsStateQuerySelectorForCleanedResult,
} from "../../ReduxHooks.js";
import { cleanLevel } from '../../constants.js';
import { usePageConfiguration } from '../../services/index.js';
import { InstanceEditorOutline } from '../InstanceEditorOutline.js';
import { ReportPageContextProvider } from '../Reports/ReportPageContext';
import { ThemedOnScreenDebug } from '../Themes/BasicComponents';
import { DocumentOutlineContextProvider } from '../ValueObjectEditor/InstanceEditorOutlineContext';
import { ViewParamsUpdateQueue, ViewParamsUpdateQueueConfig } from '../ViewParamsUpdateQueue.js';
import { Sidebar } from "./Sidebar.js";
import { SidebarWidth } from "./SidebarSection.js";
import { isElectron } from '../../../..';
import { darkStoredMiroirTheme, defaultStoredMiroirTheme, miroirThemeSchemaJson, tableThemeSchemaJson } from 'miroir-test-app_deployment-miroir';
import { darkMiroirTheme } from '../Themes/MiroirTheme';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "RootComponent"), "UI",
).then((logger: LoggerInterface) => {log = logger});

export const emptyDomainElementObject: Domain2QueryReturnType<Record<string,any>> = {}



export interface RootComponentProps {
  // store:any;
  // reportName: string;
}

// export const actionsWithDeploymentInPayload = instanceEndpointV1.definition.actions.map(
//   (actionDef:any) => actionDef.actionParameters.actionType.definition
// )

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
let count = 0;
export const RootComponent = (props: RootComponentProps) => {
  // const params = useParams<any>() as Readonly<Params<ReportUrlParamKeys>>;
  count++;

  log.info("RootComponent render", count, "######################################");
  const [sidebarIsOpen, setSidebarIsOpen] = useState(true);

  // log.info("actionsWithDeploymentInPayload", actionsWithDeploymentInPayload);

  // Use snackbar from context
  const {
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    handleSnackbarClose,
  } = useSnackbar();

  // InstanceEditorOutline state
  const [isOutlineOpen, setIsOutlineOpen] = useState(false);
  const [outlineWidth, setOutlineWidth] = useState(300);
  
  // Track current highlight timeout and element for proper cleanup
  const highlightTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const highlightedElementRef = useRef<HTMLElement | null>(null);
  // Remember sidebar state before outline was opened
  const [sidebarStateBeforeOutline, setSidebarStateBeforeOutline] = useState<boolean | null>(null);

  const domainController: DomainControllerInterface = useDomainControllerService();
  const context = useMiroirContextService();
  const currentApplication = context.toolsPageState?.applicationSelector ?? context.application;

  log.info("RootComponent currentApplication", currentApplication);

  // const navigate = useNavigate();
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

  // log.info(
  //   "##################################### rendering root component",
  //   "totalRenderCount",
  //   totalCount,
  //   "navigationRenderCount",
  //   navigationCount
  // );

  // Memoize current model to prevent unnecessary re-renders
  // const currentModel: MetaModel = useCurrentModel(adminSelfApplication.uuid, defaultSelfApplicationDeploymentMap);

  if (miroirConfig && miroirConfig.miroirConfigType != "client") {
    throw new Error(
      "RootComponent: miroirConfig.miroirConfigType != 'client' " + JSON.stringify(miroirConfig)
    );
  }

  const adminAppModel: MetaModel = useCurrentModel(
    adminSelfApplication.uuid,
    defaultSelfApplicationDeploymentMap,
  );
  const miroirMetaModel: MetaModel = useCurrentModel(
    selfApplicationMiroir.uuid,
    defaultSelfApplicationDeploymentMap,
  );

  // log.info("RootComponent", count, "adminAppModel", adminAppModel);
  // log.info("RootComponent", count, "miroirMetaModel", miroirMetaModel);
  const deploymentEntityStateSelectorMap: SyncBoxedExtractorOrQueryRunnerMap<ReduxDeploymentsState> = useMemo(
    () => getMemoizedReduxDeploymentsStateSelectorMap(),
    []
  )

  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // log.info("RootComponent defaultSelfApplicationDeploymentMap",defaultSelfApplicationDeploymentMap);
  // log.info("RootComponent adminAppModel",adminAppModel);
  const fetchAdminDeploymentsQueryParams: SyncQueryRunnerExtractorAndParams<ReduxDeploymentsState> =
    useMemo(
      () =>
        getQueryRunnerParamsForReduxDeploymentsState(
          adminAppModel && adminAppModel?.entities?.length > 0
            ? {
                queryType: "boxedQueryWithExtractorCombinerTransformer",
                application: adminSelfApplication.uuid,
                pageParams: {},
                queryParams: {},
                contextResults: {},
                extractors: {
                  deployments: {
                    extractorOrCombinerType: "extractorByEntityReturningObjectList",
                    label: "RootComponent_adminDeployments",
                    parentName: "Deployment",
                    applicationSection: getApplicationSection(
                      adminSelfApplication.uuid,
                      entityDeployment.uuid
                    ),
                    parentUuid: entityDeployment.uuid,
                  },
                },
              }
            : dummyDomainManyQueryWithDeploymentUuid,
              // (undefined as any)
        ),
      [adminAppModel]
    );

  // log.info("RootComponent fetchAdminDeploymentsQueryParams",fetchAdminDeploymentsQueryParams)
  const adminDeploymentsQueryResult: 
    Domain2QueryReturnType<{deployments:Deployment[]}> = useReduxDeploymentsStateQuerySelector(
    deploymentEntityStateSelectorMap.runQuery,
    fetchAdminDeploymentsQueryParams,
    defaultSelfApplicationDeploymentMap
  );

  // log.info("RootComponent adminDeploymentsQueryResult",adminDeploymentsQueryResult);

  const applicationDeploymentMap: ApplicationDeploymentMap | undefined = useMemo(
    () =>
      adminDeploymentsQueryResult &&
      !(adminDeploymentsQueryResult instanceof Domain2ElementFailed) &&
      Array.isArray(adminDeploymentsQueryResult.deployments)
        ? Object.fromEntries(
            adminDeploymentsQueryResult.deployments.map((deployment: Deployment) => {
              return [deployment.selfApplication, deployment.uuid];
            })
          )
        : undefined,
    [adminDeploymentsQueryResult]
  );
  // log.info("RootComponent applicationDeploymentMap",applicationDeploymentMap);

  // Use dynamic applicationDeploymentMap (which includes non-default apps like Library)
  // falling back to defaultSelfApplicationDeploymentMap during initial load.
  // This ensures the Redux selector subscribes to the correct state slice for the
  // current application, triggering a re-render when its data is loaded.
  const currentModel: MetaModel = useCurrentModel(
    currentApplication,
    applicationDeploymentMap ?? defaultSelfApplicationDeploymentMap,
  );
  // log.info("RootComponent", count, "currentModel", currentModel);

  // const applicationDeploymentMap2 = useApplicationDeploymentMapFromLocalCache(
  //   applicationDeploymentMap ?? defaultSelfApplicationDeploymentMap,
  // );
  // log.info("RootComponent applicationDeploymentMap2",applicationDeploymentMap2);
  
  useEffect(() => {
    if (applicationDeploymentMap) {
      // log.info("RootComponent calling setApplicationDeploymentMap in context",applicationDeploymentMap);
      context.setApplicationDeploymentMap(applicationDeploymentMap);
    }
  }, [applicationDeploymentMap]);
  
  // const libraryAppModel: MetaModel = useCurrentModel(
  //   selfApplicationLibrary.uuid,
  //   applicationDeploymentMap ?? defaultSelfApplicationDeploymentMap,
  // );

  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  const currentDeployment = (applicationDeploymentMap ?? defaultSelfApplicationDeploymentMap)[currentApplication];  
  const deploymentUuidToReportsEntitiesDefinitionsMapping = useMemo(
    () => (
      {
        [deployment_Admin.uuid]: getReportsAndEntitiesDefinitionsForDeploymentUuid(
          adminSelfApplication.uuid,// deployment_Admin.uuid,
          miroirMetaModel, 
          adminAppModel,
        ),
        [deployment_Miroir.uuid]: getReportsAndEntitiesDefinitionsForDeploymentUuid(
          selfApplicationMiroir.uuid,// deployment_Miroir.uuid,
          miroirMetaModel, 
          miroirMetaModel, 
        ),
        [currentDeployment]: getReportsAndEntitiesDefinitionsForDeploymentUuid(
          currentApplication,
          miroirMetaModel, 
          currentModel,
        ),
      }
    ),
    [miroirMetaModel, adminAppModel, currentApplication, currentModel]
  );

  useEffect(
    () =>
      context.setDeploymentUuidToReportsEntitiesDefinitionsMapping(
        deploymentUuidToReportsEntitiesDefinitionsMapping,
      ),
    [deploymentUuidToReportsEntitiesDefinitionsMapping],
  );

  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // Stable references to prevent unnecessary re-renders
  // const displayedDeploymentUuid = useMemo(() => context.deploymentUuid, [context.deploymentUuid]);
  // const setDisplayedDeploymentUuid = useMemo(
  //   () => context.setDeploymentUuid,
  //   [context.setDeploymentUuid]
  // );
  // // const displayedApplicationSection = useMemo(() => context.applicationSection, [context.applicationSection]);
  // const setDisplayedApplicationSection = useMemo(
  //   () => context.setApplicationSection,
  //   [context.setApplicationSection]
  // );

  // ###############################################################################################
  useEffect(() => context.setMiroirFundamentalJzodSchema(miroirFundamentalJzodSchema as any));
  // ###############################################################################################

  const openSidebarCloseOutline = useMemo( // TODO: simplify the sidebar open / close logic
    () => () => {
      setSidebarIsOpen(true);
      // If opening sidebar, close outline
      if (isOutlineOpen) {
        setIsOutlineOpen(false);
      }
    },
    [setSidebarIsOpen, isOutlineOpen]
  );

  const closeSidebar = useMemo(
    () => () => {
      setSidebarIsOpen(false);
      // Note: When closing sidebar, we don't automatically open outline
      // The user can manually open it if needed
    },
    [setSidebarIsOpen]
  );

  // Coordinated drawer state handler for sidebar
  const setSidebarStatus = useMemo(
    () => (isOpen: boolean) => {
      if (isOpen) {
        openSidebarCloseOutline();
      } else {
        closeSidebar();
      }
    },
    [openSidebarCloseOutline, closeSidebar]
  );

  // ##############################################################################################
  // InstanceEditorOutline handlers with sidebar coordination
  const handleToggleOutline = useCallback(() => {
    setIsOutlineOpen((prev) => {
      const newOutlineState = !prev;

      if (newOutlineState) {
        // Opening outline: remember current sidebar state and close it
        setSidebarStateBeforeOutline(sidebarIsOpen);
        if (sidebarIsOpen) {
          setSidebarIsOpen(false);
        }
      } else {
        // Closing outline: restore sidebar to its previous state
        if (sidebarStateBeforeOutline !== null) {
          setSidebarIsOpen(sidebarStateBeforeOutline);
          setSidebarStateBeforeOutline(null);
        }
      }

      return newOutlineState;
    });
  }, [sidebarIsOpen, sidebarStateBeforeOutline]);

  // ##############################################################################################
  const handleNavigateToPath = useCallback((path: string[]) => {
    const rootLessListKey = path.join(".");

    // log.info(
    //   "Attempting to navigate to path:",
    //   path,
    //   "rootLessListKey:",
    //   rootLessListKey,
    // );

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
        if (
          prevElement.style.backgroundColor.includes(
            theme.currentTheme.colors.warningLight ?? defaultStoredMiroirTheme.definition.colors.warningLight,
          ) ||
          prevElement.style.border.includes(
            theme.currentTheme.colors.warning ?? defaultStoredMiroirTheme.definition.colors.warning,
          )
        ) {
          prevElement.style.backgroundColor = "";
          prevElement.style.border = "";
          prevElement.style.borderRadius = "";
          prevElement.style.transition = "";
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
      targetElement.style.backgroundColor = theme.currentTheme.colors.warningLight ?? defaultStoredMiroirTheme.definition.colors.warningLight;
      targetElement.style.border = `2px solid ${theme.currentTheme.colors.warning ?? defaultStoredMiroirTheme.definition.colors.warning}`;
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
  // Stabilize query params to prevent unnecessary selector re-runs
  const stableQueryParams = useMemo(
    () =>
      adminAppModel?.entities?.length > 0
        ? defaultViewParamsFromAdminStorageFetchQueryParams(deploymentEntityStateSelectorMap)
        : getQueryRunnerParamsForReduxDeploymentsState(dummyDomainManyQueryWithDeploymentUuid),
    [adminAppModel?.entities?.length]
  );

  // log.info("RootComponent: stableQueryParams", stableQueryParams);
  const defaultViewParamsFromAdminStorageFetchQueryResults: Record<
    string,
    EntityInstancesUuidIndex
  > = useReduxDeploymentsStateQuerySelectorForCleanedResult(
    deploymentEntityStateSelectorMap.runQuery as SyncQueryRunner<
      ReduxDeploymentsState,
      Domain2QueryReturnType<DomainElementSuccess>
    >,
    stableQueryParams,
    applicationDeploymentMap ?? defaultSelfApplicationDeploymentMap,
  );

  // log.info("RootComponent: defaultViewParamsFromAdminStorageFetchQueryResults", defaultViewParamsFromAdminStorageFetchQueryResults);
  // Optimize ViewParams state management to reduce re-renders
  const defaultViewParamsFromAdminStorage: ViewParamsData | undefined = useMemo(
    () =>
      (defaultViewParamsFromAdminStorageFetchQueryResults?.["viewParams"] as any) ||
      defaultAdminViewParams,
    [defaultViewParamsFromAdminStorageFetchQueryResults]
  );

  const currentThemeId = defaultViewParamsFromAdminStorage?.appTheme || "default";

  // log.info(
  //   "RootComponent: defaultViewParamsFromAdminStorageFetchQueryResults",
  //   defaultViewParamsFromAdminStorage,
  //   defaultViewParamsFromAdminStorageFetchQueryResults
  // );

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
      deploymentUuid: deployment_Admin.uuid,
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
        if (element.style.backgroundColor.includes(theme.currentTheme.colors.warningLight ?? defaultStoredMiroirTheme.definition.colors.warningLight) ||
            element.style.border.includes(theme.currentTheme.colors.warning ?? defaultStoredMiroirTheme.definition.colors.warning)) {
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
        currentThemeId={currentThemeId}
        onThemeChange={handleAppThemeChange}
      >
        <ReportPageContextProvider>
          <div
            style={{ display: "flex", flexDirection: "row", height: "100vh", overflow: "hidden" }}
          >
            <Sidebar
              open={sidebarIsOpen}
              setOpen={setSidebarStatus}
              width={sidebarWidth}
              onWidthChange={handleSidebarWidthChange}
            />
            <ThemedGrid
              container
              spacing={0}
              padding={0}
              direction="column"
              id="mainPanel"
              minHeight="100%"
              sidebarOpen={sidebarIsOpen}
              sidebarWidth={sidebarWidth}
              outlineOpen={isOutlineOpen}
              outlineWidth={outlineWidth}
              backgroundColor={theme.currentTheme.colors.background}
            >
              {/* sidebar: {sidebarIsOpen ? "open" : "closed"}, width: {sidebarWidth}px */}
              {/* <ThemedGrid item> */}
              <AppBar
                style={{ padding: "0" }}
                handleSidebarOpen={openSidebarCloseOutline}
                sidebarIsOpen={sidebarIsOpen}
                width={sidebarWidth}
                onWidthChange={handleSidebarWidthChange}
                setSidebarOpen={setSidebarStatus}
                outlineOpen={isOutlineOpen}
                outlineWidth={outlineWidth}
                onOutlineToggle={handleToggleOutline}
                gridType={defaultViewParamsFromAdminStorage?.gridType || "ag-grid"}
                onGridTypeToggle={handleGridTypeToggle}
                generalEditMode={context.viewParams.generalEditMode}
                onEditModeToggle={() =>
                  context.viewParams.updateEditMode(!context.viewParams.generalEditMode)
                }
              />
              <ThemedMainPanel
                sidebarOpen={sidebarIsOpen}
                sidebarWidth={sidebarWidth}
                outlineOpen={isOutlineOpen}
                outlineWidth={outlineWidth}
                style={{ padding: "1em" }}
              >
                {context.viewParams.generalEditMode && <ThemedText>uuid: {uuidv4()}</ThemedText>}
                <ThemedOnScreenDebug
                  label="RootComponent miroirThemeSchemaJson"
                  data={{
                    currentThemeId,
                    theme,
                    // miroirThemeSchemaJson,
                    // tableThemeSchemaJson,
                  }}
                  initiallyUnfolded={false}
                  useCodeBlock={true}
                  copyButton={true}
                />
                {/* <ThemedOnScreenDebug
                  label="RootComponent darkStoredMiroirTheme"
                  data={{
                    darkStoredMiroirTheme: darkStoredMiroirTheme.definition.colors,
                    darkMiroirTheme: darkMiroirTheme.colors,
                  }}
                  initiallyUnfolded={false}
                  useCodeBlock={true}
                  copyButton={true}
                /> */}
                <ThemedOnScreenDebug
                  label={`RootComponent miroirConfig, isElectron: ${isElectron}`}
                  data={context.miroirContext.getMiroirConfig()}
                  initiallyUnfolded={false}
                  useCodeBlock={true}
                  copyButton={true}
                />
                <ThemedOnScreenDebug
                  label="RootComponent adminAppModel"
                  data={{ applicationDeploymentMap, adminAppModel }}
                  initiallyUnfolded={false}
                  useCodeBlock={true}
                  copyButton={true}
                />
                <ThemedOnScreenDebug
                  label="RootComponent applicationDeploymentMap"
                  data={applicationDeploymentMap}
                  initiallyUnfolded={false}
                  useCodeBlock={true}
                />
                <ThemedOnScreenDebug
                  label="RootComponent currentModel"
                  data={currentModel}
                  initiallyUnfolded={false}
                  useCodeBlock={true}
                />
                <ThemedOnScreenDebug
                  label="RootComponent deploymentUuidToReportsEntitiesDefinitionsMapping"
                  data={deploymentUuidToReportsEntitiesDefinitionsMapping}
                  initiallyUnfolded={false}
                  useCodeBlock={true}
                  copyButton={true}
                />
                {/* <ThemedOnScreenDebug
                    label="RootComponent applicationDeploymentMap2"
                    data={applicationDeploymentMap2}
                    initiallyUnfolded={false}
                    useCodeBlock={true}
                  /> */}
                {/* <ThemedOnScreenDebug
                    label="RootComponent adminAppModel"
                    data={{applicationDeploymentMap, adminAppModel}}
                    initiallyUnfolded={false}
                    useCodeBlock={true}
                    copyButton={true}
                  /> */}
                <ThemedOnScreenDebug
                  label="RootComponent viewParams generalEditMode"
                  data={context.viewParams.generalEditMode}
                  initiallyUnfolded={false}
                  useCodeBlock={true}
                />
                <ThemedOnScreenDebug
                  label="RootComponent adminDeploymentsQueryResult"
                  data={adminDeploymentsQueryResult}
                  initiallyUnfolded={false}
                  useCodeBlock={true}
                />
                {transactions && transactions.length > 0 && (
                  <ThemedText> transactions: {JSON.stringify(transactions)}</ThemedText>
                )}
                {context.showPerformanceDisplay && (
                  <div>
                    RootComponent renders: {navigationCount} (total: {totalCount})
                  </div>
                )}
                {/* TODO: enclose the outlet in a PageContainer? (see ReportPage, Tools page) */}
                <Outlet></Outlet>
              </ThemedMainPanel>
            </ThemedGrid>
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
          </div>
          <Snackbar
            open={snackbarOpen}
            autoHideDuration={6000}
            onClose={handleSnackbarClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          >
            <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: "100%" }}>
              {snackbarSeverity} {snackbarMessage}
            </Alert>
          </Snackbar>
          {/* Action Timeline - Show when enabled */}
          <EventTimelineContainer key={`action-timeline-${context.showActionTimeline}`} />
        </ReportPageContextProvider>
      </MiroirThemeProvider>
    </DocumentOutlineContextProvider>
  );
};
