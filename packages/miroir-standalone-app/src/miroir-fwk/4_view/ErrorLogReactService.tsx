import { ErrorLogServiceInterface } from "miroir-core";
import * as React from "react";
import { getErrorLog, pushError } from "src/miroir-fwk/3_controllers/ErrorLogService";
// import { ErrorLogServiceInterface } from 'miroir-core';
// import { getErrorLog, pushError } from "src/miroir-fwk/3_controllers/ErrorLogService";

const ErrorLogContext = React.createContext<ErrorLogServiceInterface>(undefined);

/** 
 * linked to React, follows the React way
 */
export const ErrorLogProvider = props => {
  const value = {
    pushError:props.pushError || pushError,
    getErrorLog:props.getErrorLog || getErrorLog,
  }
 
  return <ErrorLogContext.Provider value={value}>{props.children}</ErrorLogContext.Provider>
}

export const useErrorLogService = () => {
  return React.useContext(ErrorLogContext)
}
