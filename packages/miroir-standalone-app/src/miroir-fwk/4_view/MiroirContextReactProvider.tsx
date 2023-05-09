import { DomainControllerInterface, MiroirContext, MiroirContextInterface } from "miroir-core";
import * as React from "react";
  
export interface MiroirReactContext {
  miroirContext:MiroirContextInterface,
  domainController: DomainControllerInterface;
  deploymentUuid: string;
  setDeploymentUuid: React.Dispatch<React.SetStateAction<string>>;
}

const miroirReactContext = React.createContext<MiroirReactContext>({} as MiroirReactContext);

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
  const [deploymentUuid, setDeploymentUuid] = React.useState("");

  const value = {
    miroirContext: props.miroirContext || new MiroirContext(),
    domainController: props.domainController,
    deploymentUuid,
    setDeploymentUuid
  };
  return <miroirReactContext.Provider value={value}>{props.children}</miroirReactContext.Provider>;
}

export function useMiroirContextDeploymentUuid() {
  return React.useContext(miroirReactContext)?.deploymentUuid;
}

export function useMiroirContextSetDeploymentUuid() {
  return React.useContext(miroirReactContext)?.setDeploymentUuid;
}

export function useMiroirContextServiceHook() {
  return React.useContext(miroirReactContext);
}

export const useErrorLogServiceHook = () => {
  // return React.useContext(miroirReactContext).miroirContext.errorLogService.errorLog;
  return React.useContext(miroirReactContext)?.miroirContext.errorLogService.getErrorLog();
}

export const useDomainControllerServiceHook = () => {
  // return React.useContext(miroirReactContext).miroirContext.errorLogService.errorLog;
  return React.useContext(miroirReactContext)?.domainController;
}
