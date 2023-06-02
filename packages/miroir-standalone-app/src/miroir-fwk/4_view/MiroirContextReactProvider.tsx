import { DomainControllerInterface, MiroirContext, MiroirContextInterface } from "miroir-core";
import { createContext, useContext, useState } from "react";
// import * as React from "react";
  
export interface MiroirReactContext {
  miroirContext:MiroirContextInterface,
  domainController: DomainControllerInterface;
  deploymentUuid: string;
  setDeploymentUuid: React.Dispatch<React.SetStateAction<string>>;
  innerFormOutput: any;
  setInnerFormOutput: React.Dispatch<React.SetStateAction<any>>;
}

const miroirReactContext = createContext<MiroirReactContext>({} as MiroirReactContext);

// export function MiroirContextReactProvider(props:any extends {miroirContext:MiroirContextInterface}) {
export function MiroirContextReactProvider(
  props: {
    miroirContext: MiroirContextInterface;
    domainController:DomainControllerInterface
    children:
      | string
      | number
      | boolean
      | React.ReactElement<any, string | React.JSXElementConstructor<any>>
      | React.ReactFragment
      | React.ReactPortal;
  }
) {
  const [deploymentUuid, setDeploymentUuid] = useState("");
  const [innerFormOutput, setInnerFormOutput] = useState<any>({});

  const value = {
    miroirContext: props.miroirContext || new MiroirContext(),
    domainController: props.domainController,
    deploymentUuid,
    setDeploymentUuid,
    innerFormOutput,
    setInnerFormOutput
  };
  return <miroirReactContext.Provider value={value}>{props.children}</miroirReactContext.Provider>;
}

export function useMiroirContextDeploymentUuid() {
  return useContext(miroirReactContext)?.deploymentUuid;
}

export function useMiroirContextSetDeploymentUuid() {
  return useContext(miroirReactContext).setDeploymentUuid;
}

export function useMiroirContextInnerFormOutput() {
  return [useContext(miroirReactContext)?.innerFormOutput,useContext(miroirReactContext)?.setInnerFormOutput];
}

export function useMiroirContextServiceHook() {
  return useContext(miroirReactContext);
}

export const useErrorLogServiceHook = () => {
  // return React.useContext(miroirReactContext).miroirContext.errorLogService.errorLog;
  return useContext(miroirReactContext)?.miroirContext.errorLogService.getErrorLog();
}

export const useDomainControllerServiceHook = () => {
  // return React.useContext(miroirReactContext).miroirContext.errorLogService.errorLog;
  return useContext(miroirReactContext)?.domainController;
}
