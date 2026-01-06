import {
  ReactNode,
  createContext,
  useContext,
  useMemo,
  useState,
  startTransition,
  useEffect,
  type Dispatch,
  type SetStateAction,
} from "react";
import { FoldedStateTree } from "./components/Reports/FoldedStateTreeUtils";

import { useSelector } from "react-redux";
import { Alert, AlertColor, Snackbar } from "@mui/material";

import {
  Action2Error,
  Action2ReturnType,
  ApplicationSection,
  DeploymentUuidToReportsEntitiesDefinitionsMapping,
  DomainControllerInterface,
  JzodElement,
  JzodSchema,
  LoggerInterface,
  MiroirContext,
  MiroirContextInterface,
  MiroirLoggerFactory,
  miroirFundamentalJzodSchema as globalMiroirFundamentalJzodSchema,
  Uuid,
  ViewParams,
  GridType,
  type MiroirEvent,
  type KeyMapEntry,
  type TransformerForBuildPlusRuntime,
  type ApplicationDeploymentMap,
} from "miroir-core";
import { ReduxStateChanges, selectCurrentTransaction } from "miroir-localcache-redux";

import { packageName } from "../../constants.js";
import { cleanLevel } from "./constants.js";
import {
  errorLogService,
  ErrorLogEntry,
  logStartupError,
  logServerError,
  logClientError,
} from "./services/ErrorLogService.js";
import type { formikPath_EntityInstanceSelectorPanel } from "./components/TransformerEditor/TransformerEditorInterface";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "MiroirContextReactProvider"), "UI",
).then((logger: LoggerInterface) => {
  log = logger;
});

// ################################################################################################
// TransformerBuilderPage state interface for persistence
export interface ToolsPageState {
  applicationSelector?: Uuid;
  [formikPath_EntityInstanceSelectorPanel]?: {
    application?: string;
    selectedEntityUuid?: string;
  };
  transformerEditor?: {
    selectedApplicationUuid?: string;
    selectedEntityUuid?: string;
    currentInstanceIndex?: number;
    showAllInstances?: boolean;
    // selector
    mode?: "here" | "defined" | "none"; // OLD
    currentDefinedTransformerDefinition?: any; // OLD
    currentTransformerDefinition?: any;
    selector?: {
      mode: "defined";
      application: Uuid
      transformerUuid: Uuid;
    } | {
      mode: "here";
      transformer: TransformerForBuildPlusRuntime
    } | {
      mode: "none";
    };
    input_selector?: {
      mode: "instance" | "here";
      input?: any
    }
    // 
    foldedObjectAttributeOrArrayItems?: FoldedStateTree;
    foldedEntityInstanceItems?: { [k: string]: boolean };
    foldedTransformationResultItems?: { [k: string]: boolean };
  };
}

// #############################################################################################
// #############################################################################################
// #############################################################################################
// #############################################################################################
export interface MiroirReactContext {
  // miroirContext: MiroirContextInterface, // events, client/server config
  miroirContext: MiroirContextInterface; // events, client/server config
  // level 4 access: perform side effects, via domain controller action calls
  domainController: DomainControllerInterface;
  // ###################################################################################################
  // server configuration
  serverBaseUrl: string; // Base URL for the REST API server (e.g., http://localhost:3080)
  // ###################################################################################################
  // page parameters
  application: string;
  setApplication: React.Dispatch<React.SetStateAction<string>>;
  applicationDeploymentMap: ApplicationDeploymentMap | undefined;
  setApplicationDeploymentMap: React.Dispatch<React.SetStateAction<ApplicationDeploymentMap | undefined>>;
  deploymentUuid: string;
  setDeploymentUuid: React.Dispatch<React.SetStateAction<string>>;
  reportUuid: Uuid | undefined;
  setReportUuid: React.Dispatch<React.SetStateAction<Uuid>>;
  applicationSection: ApplicationSection | undefined;
  setApplicationSection: React.Dispatch<React.SetStateAction<ApplicationSection>>;
  // ###################################################################################################
  // session information
  viewParams: ViewParams;
  // ###################################################################################################
  // Miroir meta-model
  miroirFundamentalJzodSchema: JzodSchema | undefined;
  setMiroirFundamentalJzodSchema: React.Dispatch<React.SetStateAction<JzodElement>>;
  // ###################################################################################################
  // Form state management
  innerFormOutput: any;
  setInnerFormOutput: React.Dispatch<React.SetStateAction<any>>;
  formHelperState: any;
  setformHelperState: React.Dispatch<React.SetStateAction<any>>;
  deploymentUuidToReportsEntitiesDefinitionsMapping: DeploymentUuidToReportsEntitiesDefinitionsMapping; // ??
  setDeploymentUuidToReportsEntitiesDefinitionsMapping: React.Dispatch<
    React.SetStateAction<DeploymentUuidToReportsEntitiesDefinitionsMapping>
  >;
  // ###################################################################################################
  // outline <-> instance editor
  // typeCheckKeyMap: Record<string, KeyMapEntry>,
  // setTypeCheckKeyMap: React.Dispatch<React.SetStateAction<Record<string, KeyMapEntry>>>,
  setTypeCheckKeyMap: React.Dispatch<React.SetStateAction<Record<string, KeyMapEntry>>> | undefined;
  setSetTypeCheckKeyMap: (
    setTypeCheckKeyMap: React.Dispatch<React.SetStateAction<Record<string, KeyMapEntry>>>
  ) => void;
  setFoldedObjectAttributeOrArrayItems:
    | React.Dispatch<React.SetStateAction<FoldedStateTree>>
    | undefined;
  setSetFoldedObjectAttributeOrArrayItems: (
    setFoldedObjectAttributeOrArrayItems: React.Dispatch<React.SetStateAction<FoldedStateTree>>
  ) => void;

  // ###################################################################################################
  // TransformerBuilderPage state management
  toolsPageState: ToolsPageState;
  updateToolsPageStateDEFUNCT: (updates: Partial<ToolsPageState>) => void;
  updateTransformerEditorState: (updates: Partial<ToolsPageState["transformerEditor"]>) => void;
  // ###################################################################################################
  // Modal windows for monitoring
  showPerformanceDisplay: boolean;
  setShowPerformanceDisplay: (value: boolean | ((prev: boolean) => boolean)) => void;
  showActionTimeline: boolean;
  setShowActionTimeline: (value: boolean | ((prev: boolean) => boolean)) => void;
  showDebugInfo: boolean;
  setShowDebugInfo: (value: boolean | ((prev: boolean) => boolean)) => void;
  showModelTools: boolean;
  setShowModelTools: (value: boolean | ((prev: boolean) => boolean)) => void;
  // ##################################################################################################
  // Snackbar functionality
  snackbarOpen: boolean;
  snackbarMessage: string;
  snackbarSeverity: "success" | "error" | "info";
  showSnackbar: (message: string, severity?: "success" | "error" | "info") => void;
  handleSnackbarClose: () => void;
  handleAsyncAction: (
    action: () => Promise<any>,
    successMessage: string,
    actionName: string
  ) => Promise<void>;
  // Error logging service access
  errorLogService: typeof errorLogService;
}

// #############################################################################################
// #############################################################################################
// #############################################################################################
// #############################################################################################
// #############################################################################################
const miroirReactContext = createContext<MiroirReactContext | undefined>(undefined);

// #############################################################################################
// export function MiroirContextReactProvider(props:any extends {miroirContext:MiroirContextInterface}) {
export function MiroirContextReactProvider(props: {
  miroirContext: MiroirContextInterface;
  // miroirContext: MiroirContext;
  domainController: DomainControllerInterface;
  testingApplication?: Uuid; // for tests only! Yuck!
  testingDeploymentUuid?: Uuid; // for tests only! Yuck!
  children: ReactNode;
}) {
  const [application, setApplication] = useState(props.testingApplication ?? "");
  const [applicationDeploymentMap, setApplicationDeploymentMap] = useState<ApplicationDeploymentMap | undefined>(undefined);
  const [deploymentUuid, setDeploymentUuid] = useState(props.testingDeploymentUuid ?? "");
  const [reportUuid, setReportUuid] = useState("");
  const [applicationSection, setApplicationSection] = useState<ApplicationSection>("data");
  const [innerFormOutput, setInnerFormOutput] = useState<any>({});
  const [formHelperState, setformHelperState] = useState<any>({});
  // const [typeCheckKeyMap, setTypeCheckKeyMap] = useState<Record<string, KeyMapEntry>>({});

  const [setTypeCheckKeyMap, setSetTypeCheckKeyMap] =
    useState<Dispatch<SetStateAction<Record<string, KeyMapEntry>>>>();

  const [setFoldedObjectAttributeOrArrayItems, setSetFoldedObjectAttributeOrArrayItems] =
    useState<Dispatch<SetStateAction<FoldedStateTree>>>();

  //     setTypeCheckKeyMap: React.Dispatch<React.SetStateAction<Record<string, KeyMapEntry>>>,
  // setSetTypeCheckKeyMap: (
  //   setTypeCheckKeyMap: React.Dispatch<React.SetStateAction<Record<string, KeyMapEntry>>>
  // ) => void;

  const [
    deploymentUuidToReportsEntitiesDefinitionsMapping,
    setDeploymentUuidToReportsEntitiesDefinitionsMapping,
  ] = useState<DeploymentUuidToReportsEntitiesDefinitionsMapping>({});
  const [miroirFundamentalJzodSchema, setMiroirFundamentalJzodSchema] = useState<
    JzodSchema | undefined
  >(globalMiroirFundamentalJzodSchema as JzodSchema);
  // useState<JzodSchema>({name: "dummyJzodSchema", parentName: "JzodSchema", parentUuid:"", uuid: ""});

  // Create ViewParams instance to track UI state with reactive state
  const [sidebarIsopen, setSidebarIsOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(250);
  const [gridType, setGridType] = useState<GridType>("ag-grid");
  const [editMode, setEditMode] = useState(() => {
    // Persist editMode state across navigation
    const saved = sessionStorage.getItem("editMode");
    return saved ? JSON.parse(saved) : false;
  });
  const [toolsPageState, setToolsPageState] = useState<ToolsPageState>(() => {
    // Persist TransformerBuilderPage state across navigation per deployment
    const saved = sessionStorage.getItem("toolsPageState");
    return saved ? JSON.parse(saved) : {};
  });
  const [showPerformanceDisplay, setShowPerformanceDisplay] = useState(() => {
    // Persist showPerformanceDisplay state across navigation
    const saved = sessionStorage.getItem("showPerformanceDisplay");
    return saved ? JSON.parse(saved) : false;
  });

  const [showActionTimeline, setShowActionTimeline] = useState(() => {
    // Persist showActionTimeline state across navigation
    const saved = sessionStorage.getItem("showActionTimeline");
    return saved ? JSON.parse(saved) : false;
  });

  const [showDebugInfo, setShowDebugInfo] = useState(() => {
    // Persist showDebugInfo state across navigation
    const saved = sessionStorage.getItem("showDebugInfo");
    return saved ? JSON.parse(saved) : false;
  });

  const [showModelTools, setShowModelTools] = useState(() => {
    // Persist showModelTools state across navigation
    const saved = sessionStorage.getItem("showModelTools");
    return saved ? JSON.parse(saved) : false;
  });

  // Snackbar state
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error" | "info">("info");

  const viewParams = useMemo(() => {
    // const params = new ViewParams(sidebarIsopen, sidebarWidth, gridType, 'default', {}, editMode, showModelTools);
    const params = new ViewParams(sidebarIsopen, sidebarWidth, gridType, 'default', {}, editMode);
    // Override setters to use React state
    params.updateSidebarIsOpen = (sidebarIsopen: boolean) => setSidebarIsOpen(sidebarIsopen);
    params.updateSidebarWidth = (width: number) => setSidebarWidth(width);
    params.setGridType = (type: GridType) => setGridType(type);
    params.updateEditMode = (enabled: boolean) => {
      setEditMode(enabled);
      // Persist to sessionStorage
      sessionStorage.setItem("editMode", JSON.stringify(enabled));
    };
    // params.updateShowModelTools = (enabled: boolean) => {
    //   setShowModelTools(enabled);
    //   // Persist to sessionStorage
    //   sessionStorage.setItem("showModelTools", JSON.stringify(enabled));
    // };
    return params;
  }, [sidebarWidth, gridType, editMode, showModelTools]);

  // Update functions for TransformerBuilderPage state with persistence
  const updateToolsPageStateDEFUNCT = useMemo(
    () => (updates: Partial<ToolsPageState>) => {
      const newState = { ...toolsPageState, ...updates };
      // log.info("updateTransformerEditorState updateToolsPageStateDEFUNCT", { updates, newState });
      setToolsPageState(newState);
      // Persist to sessionStorage per deployment
      sessionStorage.setItem("toolsPageState", JSON.stringify(newState));
    },
    [toolsPageState]
  );

  // ##############################################################################################
  const updateTransformerEditorState = useMemo(
    () => (updates: Partial<ToolsPageState["transformerEditor"]>) => {
      const newState = {
        ...toolsPageState,
        transformerEditor: { ...(toolsPageState.transformerEditor || {}), ...updates },
      };
      log.info("updateTransformerEditorState", { toolsPageState, updates, newState });
      setToolsPageState(newState);
      // Persist to sessionStorage per deployment
      sessionStorage.setItem("toolsPageState", JSON.stringify(newState));
    },
    [toolsPageState]
  );

  // Snackbar handlers
  const showSnackbar = useMemo(
    () =>
      (message: string, severity: "success" | "error" | "info" = "info") => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setSnackbarOpen(true);
      },
    []
  );

  const handleSnackbarClose = useMemo(
    () => () => {
      setSnackbarOpen(false);
    },
    []
  );

  // ##############################################################################################
  const handleAsyncAction = useMemo(
    () => async (action: () => Promise<any>, successMessage: string, actionName: string) => {
      try {
        const result = await action();
        log.info(
          `handleAsyncAction done for ${actionName}:`,
          result,
          "is error:",
          result && typeof result === "object" && result.status === "error"
        );

        // Check if the result is an Action2Error (server error)
        if (result && typeof result === "object" && result.status === "error") {
          // Log server errors to global error service
          logServerError(
            result.errorMessage || result.errorType || "Unknown server error",
            {
              actionName,
              errorDetails: result,
              timestamp: new Date().toISOString(),
            }
          );

          startTransition(() => {
            if (result.isServerError && result.errorMessage) {
              log.info("Showing server error snackbar for", actionName);
              showSnackbar(`Server error: ${result.errorMessage}`, "error");
            } else {
              log.info("Showing generic error snackbar for", actionName);
              showSnackbar(
                `Error in ${actionName}: ${
                  result.errorMessage || result.errorType || "Unknown error"
                }`,
                "error"
              );
            }
          });
        // startTransition(() => {
        //   showSnackbar(result.errorMessage || result.errorType || "Unknown error", "error");
        // });

          return;
        }

        // Use startTransition for non-urgent UI updates to allow React 18 batching
        startTransition(() => {
          showSnackbar(successMessage, "success");
        });
      } catch (error) {
        log.error(`Error in ${actionName}:`, error);

        // Determine error category based on error type and action name
        let errorCategory: "startup" | "server" | "client" | "network" | "validation" | "unknown" =
          "client";
        if (
          actionName.toLowerCase().includes("config") ||
          actionName.toLowerCase().includes("startup")
        ) {
          errorCategory = "startup";
        } else if (error && typeof error === "object" && (error as any).isServerError) {
          errorCategory = "server";
        } else if (error instanceof TypeError && error.message.includes("fetch")) {
          errorCategory = "network";
        }

        // Log error to global error service
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorEntry = errorLogService.logError(
          error instanceof Error ? error : new Error(String(error)),
          {
            category: errorCategory,
            severity: errorCategory === "startup" ? "critical" : "error",
            context: {
              actionName,
              timestamp: new Date().toISOString(),
              userAgent: navigator.userAgent,
              url: window.location.href,
            },
            showSnackbar: true,
            userMessage:
              errorCategory === "startup"
                ? "Application startup failed. Please check your configuration and try again."
                : undefined,
          }
        );

        // Check if the error has structured server error data
        if (error && typeof error === "object" && (error as any).isServerError) {
          startTransition(() => {
            showSnackbar(
              `Server error: ${
                (error as any).errorMessage || (error as any).message || "Unknown server error"
              }`,
              "error"
            );
          });
        } else {
          startTransition(() => {
            showSnackbar(
              errorEntry.userMessage || `Error in ${actionName}: ${errorMessage}`,
              errorCategory === "startup" ? "error" : "error" // Use "error" instead of "warning"
            );
          });
        }
      }
    },
    [showSnackbar]
  );

  // Extract serverBaseUrl from miroirConfig
  const serverBaseUrl = useMemo(() => {
    const config = props.miroirContext.getMiroirConfig();
    if (config && config.miroirConfigType === 'client') {
      const clientConfig = config.client;
      if (clientConfig.emulateServer) {
        return clientConfig.rootApiUrl;
      } else {
        return clientConfig.serverConfig.rootApiUrl;
      }
    } else {
      throw new Error("MiroirContextReactProvider: Unsupported miroirConfigType for serverBaseUrl");
    }
    // return 'http://localhost:3080'; // fallback default
  }, [props.miroirContext]);

  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // const value = useMemo<MiroirReactContext>(()=>({
  const value = useMemo<MiroirReactContext>(
    () => ({
      miroirContext: props.miroirContext,
      domainController: props.domainController,
      serverBaseUrl,
      application,
      setApplication,
      applicationDeploymentMap,
      setApplicationDeploymentMap,
      deploymentUuid,
      setDeploymentUuid,
      reportUuid,
      setReportUuid,
      applicationSection,
      setApplicationSection,
      innerFormOutput,
      setInnerFormOutput,
      formHelperState,
      setformHelperState,
      deploymentUuidToReportsEntitiesDefinitionsMapping,
      setDeploymentUuidToReportsEntitiesDefinitionsMapping,
      miroirFundamentalJzodSchema,
      // setMiroirFundamentalJzodSchema: (a: any) => {log.info("setMiroirFundamentalJzodSchema called with", a);setMiroirFundamentalJzodSchema(a)},
      setMiroirFundamentalJzodSchema: (a: any) => {
        // console.log("setMiroirFundamentalJzodSchema called!");
        console.log("setMiroirFundamentalJzodSchema called with", Object.keys(a ?? {}).length);
        setMiroirFundamentalJzodSchema(a);
      },
      viewParams,
      toolsPageState,
      updateToolsPageStateDEFUNCT,
      updateTransformerEditorState,
      showPerformanceDisplay,
      setShowPerformanceDisplay: (value: boolean | ((prev: boolean) => boolean)) => {
        const newValue = typeof value === "function" ? value(showPerformanceDisplay) : value;
        setShowPerformanceDisplay(newValue);
        sessionStorage.setItem("showPerformanceDisplay", JSON.stringify(newValue));
      },
      showActionTimeline,
      setShowActionTimeline: (value: boolean | ((prev: boolean) => boolean)) => {
        const newValue = typeof value === "function" ? value(showActionTimeline) : value;
        console.log("setShowActionTimeline called:", {
          oldValue: showActionTimeline,
          newValue: newValue,
          type: typeof value,
        });
        setShowActionTimeline(newValue);
        sessionStorage.setItem("showActionTimeline", JSON.stringify(newValue));
      },
      showDebugInfo,
      setShowDebugInfo: (value: boolean | ((prev: boolean) => boolean)) => {
        const newValue = typeof value === "function" ? value(showDebugInfo) : value;
        setShowDebugInfo(newValue);
        sessionStorage.setItem("showDebugInfo", JSON.stringify(newValue));
      },
      showModelTools,
      setShowModelTools: (value: boolean | ((prev: boolean) => boolean)) => {
        const newValue = typeof value === "function" ? value(showModelTools) : value;
        setShowModelTools(newValue);
        sessionStorage.setItem("showModelTools", JSON.stringify(newValue));
      },
      // // ###################################################################################################
      // // Outline for Instance Editor
      setFoldedObjectAttributeOrArrayItems,
      setSetFoldedObjectAttributeOrArrayItems,
      setSetTypeCheckKeyMap,
      setTypeCheckKeyMap,
      // ###################################################################################################
      // Snackbar functionality
      snackbarOpen,
      snackbarMessage,
      snackbarSeverity,
      showSnackbar,
      handleSnackbarClose,
      handleAsyncAction,
      // Error logging service access
      errorLogService: errorLogService,
    }),
    [
      serverBaseUrl,
      application,
      setApplication,
      applicationDeploymentMap,
      setApplicationDeploymentMap,
      deploymentUuid,
      applicationSection,
      reportUuid,
      deploymentUuidToReportsEntitiesDefinitionsMapping,
      miroirFundamentalJzodSchema,
      innerFormOutput,
      props.miroirContext,
      props.domainController,
      viewParams,
      setFoldedObjectAttributeOrArrayItems,
      setSetFoldedObjectAttributeOrArrayItems,
      setTypeCheckKeyMap,
      setSetTypeCheckKeyMap,
      formHelperState,
      showSnackbar,
      handleAsyncAction,
      showPerformanceDisplay,
      showActionTimeline,
      showDebugInfo,
      showModelTools,
      snackbarOpen,
      snackbarMessage,
      snackbarSeverity,
      toolsPageState,
      updateToolsPageStateDEFUNCT,
      updateTransformerEditorState,
    ]
  );

  // // TODO: This belongs to the Root component
  // // Subscribe to global error notifications
  // useEffect(() => {
  //   const unsubscribe = errorLogService.subscribe((errorEntry: ErrorLogEntry) => {
  //     // Only show snackbar if the error indicates it should be shown
  //     if (errorEntry.userMessage || errorEntry.severity === 'critical' || errorEntry.severity === 'error') {
  //       startTransition(() => {
  //         const message = errorEntry.userMessage || errorEntry.errorMessage;
  //         const severity = errorEntry.severity === 'critical' ? 'error' :
  //                         errorEntry.severity === 'warning' ? 'error' : 'error';  // Map to valid types
  //         showSnackbar(message, severity);
  //       });
  //     }
  //   });

  //   return unsubscribe;
  // }, [showSnackbar]);
  // log.info("MiroirContextReactProvider rendered with toolsPageState:", toolsPageState);
  return (
    <miroirReactContext.Provider value={value}>
      {props.children}
      {/* Global Snackbar for error notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </miroirReactContext.Provider>
  );
}

// #############################################################################################
export function useMiroirContextformHelperState() {
  return [
    useContext(miroirReactContext)?.formHelperState,
    useContext(miroirReactContext)?.setformHelperState,
  ];
}

// #############################################################################################
export function useMiroirContextInnerFormOutput() {
  return [
    useContext(miroirReactContext)?.innerFormOutput,
    useContext(miroirReactContext)?.setInnerFormOutput,
  ];
}

// #############################################################################################
export function useMiroirContextService(): MiroirReactContext {
  const context = useContext(miroirReactContext);
  if (!context) {
    throw new Error("useMiroirContextService must be used within a MiroirContextReactProvider");
  }
  return context;
}

// #############################################################################################
export function useMiroirContext() {
  const context = useContext(miroirReactContext);
  if (!context) {
    throw new Error("useMiroirContext must be used within a MiroirContextReactProvider");
  }
  return context.miroirContext;
}

// #############################################################################################
export function useApplicationDeploymentMap() {
  const context = useContext(miroirReactContext);
  if (!context) {
    throw new Error("useApplicationDeploymentMap must be used within a MiroirContextReactProvider");
  }
  return context.applicationDeploymentMap;
}

// #############################################################################################
export function useViewParams() {
  const context = useContext(miroirReactContext);
  if (!context) {
    throw new Error("useViewParams must be used within a MiroirContextReactProvider");
  }
  return context.viewParams;
}

// #############################################################################################
export const useErrorLogService = () => {
  const context = useContext(miroirReactContext);
  if (!context) {
    throw new Error("useErrorLogService must be used within a MiroirContextReactProvider");
  }
  return context.errorLogService;
};

// #############################################################################################
export const useDomainControllerService = () => {
  const context = useContext(miroirReactContext);
  if (!context) {
    throw new Error("useDomainControllerService must be used within a MiroirContextReactProvider");
  }
  return context.domainController;
};

//#########################################################################################
export function useLocalCacheTransactions(): ReduxStateChanges[] {
  // const result:EntityState<ReduxStateChanges[]> = useSelector(selectCurrentTransaction());
  const result: ReduxStateChanges[] = useSelector(selectCurrentTransaction());
  return result ? result : [];
}

// #############################################################################################
export function useMiroirEvents(): MiroirEvent[] {
  const context = useContext(miroirReactContext);
  if (!context) {
    throw new Error("useMiroirEvents must be used within a MiroirContextReactProvider");
  }
  const eventService = context.miroirContext.miroirEventService;

  const [events, setEvents] = useState<MiroirEvent[]>(() => eventService.getAllEvents());

  useEffect(() => {
    const unsubscribe = eventService.subscribe((newEvents) => {
      startTransition(() => {
        setEvents(newEvents);
      });
    });

    return () => {
      unsubscribe();
    };
  }, [eventService]);

  return events;
}

// #############################################################################################
export function useMiroirEventTrackingData() {
  const context = useContext(miroirReactContext);
  if (!context) {
    throw new Error("useMiroirEventTrackingData must be used within a MiroirContextReactProvider");
  }
  return context.miroirContext.miroirActivityTracker.getAllActivities();
}

// #############################################################################################
export function useSnackbar() {
  const context = useContext(miroirReactContext);
  if (!context) {
    throw new Error("useSnackbar must be used within a MiroirContextReactProvider");
  }
  return {
    snackbarOpen: context.snackbarOpen,
    snackbarMessage: context.snackbarMessage,
    snackbarSeverity: context.snackbarSeverity,
    showSnackbar: context.showSnackbar,
    handleSnackbarClose: context.handleSnackbarClose,
    handleAsyncAction: context.handleAsyncAction,
  };
}
