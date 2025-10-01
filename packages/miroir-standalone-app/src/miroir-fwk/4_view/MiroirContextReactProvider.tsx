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

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "MiroirContextReactProvider"), "UI",
).then((logger: LoggerInterface) => {
  log = logger;
});

// ToolsPage state interface for persistence
export interface ToolsPageState {
  transformerEditor?: {
    selectedEntityUuid?: string;
    currentInstanceIndex?: number;
    showAllInstances?: boolean;
    currentTransformerDefinition?: any;
    foldedObjectAttributeOrArrayItems?: FoldedStateTree;
    foldedEntityInstanceItems?: { [k: string]: boolean };
    foldedTransformationResultItems?: { [k: string]: boolean };
  };
}

export interface MiroirReactContext {
  // miroirContext: MiroirContextInterface, // events, client/server config
  miroirContext: MiroirContextInterface; // events, client/server config
  // level 4 access: perform side effects, via domain controller action calls
  domainController: DomainControllerInterface;
  // ###################################################################################################
  // page parameters
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
  // ToolsPage state management
  toolsPageState: ToolsPageState;
  updateToolsPageState: (updates: Partial<ToolsPageState>) => void;
  updateTransformerEditorState: (updates: Partial<ToolsPageState["transformerEditor"]>) => void;
  // ###################################################################################################
  // Modal windows for monitoring
  showPerformanceDisplay: boolean;
  setShowPerformanceDisplay: (value: boolean | ((prev: boolean) => boolean)) => void;
  showActionTimeline: boolean;
  setShowActionTimeline: (value: boolean | ((prev: boolean) => boolean)) => void;
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
  testingDeploymentUuid?: Uuid; // for tests only! Yuck!
  children: ReactNode;
}) {
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
  const [toolsPageState, setToolsPageState] = useState<ToolsPageState>(() => {
    // Persist ToolsPage state across navigation per deployment
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

  // Snackbar state
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error" | "info">("info");

  const viewParams = useMemo(() => {
    const params = new ViewParams(sidebarIsopen, sidebarWidth, gridType);
    // Override setters to use React state
    params.updateSidebarIsOpen = (sidebarIsopen: boolean) => setSidebarIsOpen(sidebarIsopen);
    params.updateSidebarWidth = (width: number) => setSidebarWidth(width);
    params.setGridType = (type: GridType) => setGridType(type);
    return params;
  }, [sidebarWidth, gridType]);

  // Update functions for ToolsPage state with persistence
  const updateToolsPageState = useMemo(
    () => (updates: Partial<ToolsPageState>) => {
      const newState = { ...toolsPageState, ...updates };
      // log.info("updateTransformerEditorState updateToolsPageState", { updates, newState });
      setToolsPageState(newState);
      // Persist to sessionStorage per deployment
      sessionStorage.setItem("toolsPageState", JSON.stringify(newState));
    },
    [toolsPageState]
  );

  const updateTransformerEditorState = useMemo(
    () => (updates: Partial<ToolsPageState["transformerEditor"]>) => {
      const newState = {
        ...toolsPageState,
        transformerEditor: { ...(toolsPageState.transformerEditor || {}), ...updates },
      };
      // log.info("updateTransformerEditorState", { updates, newState });
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

  const handleAsyncAction = useMemo(
    () => async (action: () => Promise<any>, successMessage: string, actionName: string) => {
      try {
        const result = await action();

        // Check if the result is an Action2Error (server error)
        if (result && typeof result === "object" && result.status === "error") {
          // Log server errors to global error service
          const errorEntry = logServerError(
            result.errorMessage || result.errorType || "Unknown server error",
            {
              actionName,
              errorDetails: result,
              timestamp: new Date().toISOString(),
            }
          );

          log.error(`Server error in ${actionName}:`, result);
          startTransition(() => {
            if (result.isServerError && result.errorMessage) {
              showSnackbar(`Server error: ${result.errorMessage}`, "error");
            } else {
              showSnackbar(
                `Error in ${actionName}: ${
                  result.errorMessage || result.errorType || "Unknown error"
                }`,
                "error"
              );
            }
          });
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

  // const value = useMemo<MiroirReactContext>(()=>({
  const value = useMemo<MiroirReactContext>(
    () => ({
      miroirContext: props.miroirContext,
      domainController: props.domainController,
      deploymentUuid,
      // setDeploymentUuid:(...args)=>{log.info('setDeploymentUuid',args); return setDeploymentUuid1(...args)},
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
      updateToolsPageState,
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
      deploymentUuid,
      reportUuid,
      applicationSection,
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
      snackbarOpen,
      snackbarMessage,
      snackbarSeverity,
      toolsPageState,
      updateToolsPageState,
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
  log.info("MiroirContextReactProvider rendered with toolsPageState:", toolsPageState);
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
