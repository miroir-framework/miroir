import { ReactNode, createContext, useContext, useMemo, useState } from "react";

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
  Uuid
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
}

const miroirReactContext = createContext<MiroirReactContext>({} as MiroirReactContext);

// #############################################################################################
// export function MiroirContextReactProvider(props:any extends {miroirContext:MiroirContextInterface}) {
export function MiroirContextReactProvider(props: {
  miroirContext: MiroirContextInterface;
  domainController: DomainControllerInterface;
  children: ReactNode
    // | string
    // | number
    // | boolean
    // | React.ReactElement<any, string | React.JSXElementConstructor<any>>
    // | React.ReactFragment
    // | React.ReactPortal;
}) {
  const [deploymentUuid, setDeploymentUuid] = useState("");
  const [reportUuid, setReportUuid] = useState("");
  const [applicationSection, setApplicationSection] = useState<ApplicationSection>("data");
  const [innerFormOutput, setInnerFormOutput] = useState<any>({});
  const [formHelperState, setformHelperState] = useState<any>({});
  const [deploymentUuidToReportsEntitiesDefinitionsMapping, setDeploymentUuidToReportsEntitiesDefinitionsMapping] =
    useState<DeploymentUuidToReportsEntitiesDefinitionsMapping>({});
  const [miroirFundamentalJzodSchema, setMiroirFundamentalJzodSchema] =
    // useState<JzodSchema>({name: "dummyJzodSchema", parentName: "JzodSchema", parentUuid:"", uuid: ""});
    useState<JzodSchema | undefined>(undefined);

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
      setMiroirFundamentalJzodSchema: (a: any) => {log.info("setMiroirFundamentalJzodSchema called with", a);setMiroirFundamentalJzodSchema(a)},
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

