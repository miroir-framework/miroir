import { DomainControllerInterface, MiroirContext, MiroirContextInterface } from "miroir-core";
import * as React from "react";
  


const miroirReactContext = React.createContext<{
  miroirContext:MiroirContextInterface,
  domainController: DomainControllerInterface;
}>(undefined);


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
  const value = {
    miroirContext: props.miroirContext || new MiroirContext(),
    domainController: props.domainController,
  };
  return <miroirReactContext.Provider value={value}>{props.children}</miroirReactContext.Provider>;
}

export function useMiroirContextServiceHook() {
  return React.useContext(miroirReactContext);
}

export const useErrorLogServiceHook = () => {
  // return React.useContext(miroirReactContext).miroirContext.errorLogService.errorLog;
  return React.useContext(miroirReactContext).miroirContext.errorLogService.getErrorLog();
}

export const useDomainControllerServiceHook = () => {
  // return React.useContext(miroirReactContext).miroirContext.errorLogService.errorLog;
  return React.useContext(miroirReactContext).domainController;
}
