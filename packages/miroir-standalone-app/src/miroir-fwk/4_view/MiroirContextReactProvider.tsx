import { ReactNode, createContext, useContext, useMemo, useState, startTransition } from "react";

import { useSelector } from "react-redux";

import {
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
  GridType
} from "miroir-core";
import {
  ReduxStateChanges,
  selectCurrentTransaction
} from "miroir-localcache-redux";

import { packageName } from "../../constants.js";
import { cleanLevel } from "./constants.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "MiroirContextReactProvider")
).then((logger: LoggerInterface) => {log = logger});




export interface MiroirReactContext {
  miroirContext: MiroirContextInterface,
  domainController: DomainControllerInterface,
  deploymentUuid: string,
  setDeploymentUuid: React.Dispatch<React.SetStateAction<string>>,
  reportUuid: Uuid | undefined,
  setReportUuid: React.Dispatch<React.SetStateAction<Uuid>>,
  applicationSection: ApplicationSection | undefined,
  setApplicationSection: React.Dispatch<React.SetStateAction<ApplicationSection>>,
  innerFormOutput: any,
  setInnerFormOutput: React.Dispatch<React.SetStateAction<any>>,
  formHelperState: any,
  setformHelperState: React.Dispatch<React.SetStateAction<any>>,
  deploymentUuidToReportsEntitiesDefinitionsMapping: DeploymentUuidToReportsEntitiesDefinitionsMapping,
  setDeploymentUuidToReportsEntitiesDefinitionsMapping: React.Dispatch<React.SetStateAction<DeploymentUuidToReportsEntitiesDefinitionsMapping>>,
  miroirFundamentalJzodSchema: JzodSchema | undefined,
  setMiroirFundamentalJzodSchema: React.Dispatch<React.SetStateAction<JzodElement>>,
  viewParams: ViewParams,
  showPerformanceDisplay: boolean,
  setShowPerformanceDisplay: (value: boolean | ((prev: boolean) => boolean)) => void,
  showActionTimeline: boolean,
  setShowActionTimeline: (value: boolean | ((prev: boolean) => boolean)) => void,
  // Snackbar functionality
  snackbarOpen: boolean,
  snackbarMessage: string,
  snackbarSeverity: "success" | "error" | "info",
  showSnackbar: (message: string, severity?: "success" | "error" | "info") => void,
  handleSnackbarClose: () => void,
  handleAsyncAction: (action: () => Promise<any>, successMessage: string, actionName: string) => Promise<void>,
}

const miroirReactContext = createContext<MiroirReactContext>({
  viewParams: new ViewParams(),
} as MiroirReactContext);

// #############################################################################################
// export function MiroirContextReactProvider(props:any extends {miroirContext:MiroirContextInterface}) {
export function MiroirContextReactProvider(props: {
  miroirContext: MiroirContextInterface;
  domainController: DomainControllerInterface;
  testingDeploymentUuid?: Uuid; // for tests only! Yuck!
  children: ReactNode;
}) {
  const [deploymentUuid, setDeploymentUuid] = useState(props.testingDeploymentUuid ?? "");
  const [reportUuid, setReportUuid] = useState("");
  const [applicationSection, setApplicationSection] = useState<ApplicationSection>("data");
  const [innerFormOutput, setInnerFormOutput] = useState<any>({});
  const [formHelperState, setformHelperState] = useState<any>({});
  const [
    deploymentUuidToReportsEntitiesDefinitionsMapping,
    setDeploymentUuidToReportsEntitiesDefinitionsMapping,
  ] = useState<DeploymentUuidToReportsEntitiesDefinitionsMapping>({});
  const [miroirFundamentalJzodSchema, setMiroirFundamentalJzodSchema] = useState<
    JzodSchema | undefined
  >(globalMiroirFundamentalJzodSchema as JzodSchema);
  // useState<JzodSchema>({name: "dummyJzodSchema", parentName: "JzodSchema", parentUuid:"", uuid: ""});

  // Create ViewParams instance to track UI state with reactive state
  const [sidebarWidth, setSidebarWidth] = useState(250);
  const [gridType, setGridType] = useState<GridType>('ag-grid');
  const [showPerformanceDisplay, setShowPerformanceDisplay] = useState(() => {
    // Persist showPerformanceDisplay state across navigation
    const saved = sessionStorage.getItem('showPerformanceDisplay');
    return saved ? JSON.parse(saved) : false;
  });
  
  const [showActionTimeline, setShowActionTimeline] = useState(() => {
    // Persist showActionTimeline state across navigation
    const saved = sessionStorage.getItem('showActionTimeline');
    return saved ? JSON.parse(saved) : false;
  });
  
  // Snackbar state
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error" | "info">("info");
  
  const viewParams = useMemo(() => {
    const params = new ViewParams(sidebarWidth, gridType);
    // Override setters to use React state
    params.updateSidebarWidth = (width: number) => setSidebarWidth(width);
    params.setGridType = (type: GridType) => setGridType(type);
    return params;
  }, [sidebarWidth, gridType]);

  // Snackbar handlers
  const showSnackbar = useMemo(() => (message: string, severity: "success" | "error" | "info" = "info") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  }, []);

  const handleSnackbarClose = useMemo(() => () => {
    setSnackbarOpen(false);
  }, []);

  const handleAsyncAction = useMemo(() => async (action: () => Promise<any>, successMessage: string, actionName: string) => {
    try {
      await action();
      // Use startTransition for non-urgent UI updates to allow React 18 batching
      startTransition(() => {
        showSnackbar(successMessage, "success");
      });
    } catch (error) {
      log.error(`Error in ${actionName}:`, error);
      startTransition(() => {
        showSnackbar(`Error in ${actionName}: ${error}`, "error");
      });
    }
  }, [showSnackbar]);

  // const value = useMemo<MiroirReactContext>(()=>({
  const value = useMemo<MiroirReactContext>(
    () => ({
      miroirContext: props.miroirContext || new MiroirContext(undefined),
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
      showPerformanceDisplay,
      setShowPerformanceDisplay: (value: boolean | ((prev: boolean) => boolean)) => {
        const newValue = typeof value === 'function' ? value(showPerformanceDisplay) : value;
        setShowPerformanceDisplay(newValue);
        sessionStorage.setItem('showPerformanceDisplay', JSON.stringify(newValue));
      },
      showActionTimeline,
      setShowActionTimeline: (value: boolean | ((prev: boolean) => boolean)) => {
        const newValue = typeof value === 'function' ? value(showActionTimeline) : value;
        setShowActionTimeline(newValue);
        sessionStorage.setItem('showActionTimeline', JSON.stringify(newValue));
      },
      // Snackbar functionality
      snackbarOpen,
      snackbarMessage,
      snackbarSeverity,
      showSnackbar,
      handleSnackbarClose,
      handleAsyncAction,
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
      sidebarWidth,
      gridType,
      showPerformanceDisplay,
      snackbarOpen,
      snackbarMessage,
      snackbarSeverity,
    ]
  );
  return <miroirReactContext.Provider value={value}>{props.children}</miroirReactContext.Provider>;
}

// #############################################################################################
export function useMiroirContextformHelperState() {
  return [useContext(miroirReactContext)?.formHelperState, useContext(miroirReactContext)?.setformHelperState];
}

// #############################################################################################
export function useMiroirContextInnerFormOutput() {
  return [useContext(miroirReactContext)?.innerFormOutput, useContext(miroirReactContext)?.setInnerFormOutput];
}

// #############################################################################################
export function useMiroirContextService() {
  return useContext(miroirReactContext);
}

// #############################################################################################
export function useMiroirContext() {
  return useContext(miroirReactContext).miroirContext;
}

// #############################################################################################
export function useViewParams() {
  return useContext(miroirReactContext)?.viewParams;
}

// #############################################################################################
export const useErrorLogService = () => {
  return useContext(miroirReactContext)?.miroirContext.errorLogService.getErrorLog();
};

// #############################################################################################
export const useDomainControllerService = () => {
  return useContext(miroirReactContext)?.domainController;
};

//#########################################################################################
export function useLocalCacheTransactions(): ReduxStateChanges[] {
  // const result:EntityState<ReduxStateChanges[]> = useSelector(selectCurrentTransaction());
  const result: ReduxStateChanges[] = useSelector(selectCurrentTransaction());
  return result ? result : [];
}

// #############################################################################################
export function useSnackbar() {
  const context = useContext(miroirReactContext);
  if (!context) {
    throw new Error('useSnackbar must be used within a MiroirContextReactProvider');
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

