import * as React from "react";
import { ErrorLogServiceInterface, MError } from "src/miroir-fwk/0_interfaces/4-view/ErrorLogServiceInterface";

export declare type ErrorLogState = MError[];

const ErrorLogContext = React.createContext<ErrorLogServiceInterface>(undefined);

const errorLog: ErrorLogState = [];

/** linked to React, follows the React way
 * TODO: define a React-independent interface.
 */
export const ErrorLogProvider = props => {
  const value = {
    pushError:props.pushError || pushError,
    getErrorLog:props.getErrorLog || getErrorLog,
    // signIn: props.signIn || signIn,
    // signUp: props.signUp || signUp
  }
 
  return <ErrorLogContext.Provider value={value}>{props.children}</ErrorLogContext.Provider>
}

export const useErrorLogService = () => {
  return React.useContext(ErrorLogContext)
}
// export function ErrorLogServiceCreator():ErrorLogServiceInterface {
  // const initialState: ErrorLogState = [];

// const [state, dispatch] = React.useReducer(
//     (s:ErrorLogState,a:MError)=>s.concat([a]),[]);
  // const state:ErrorLogState;
  // const dispatch:any;
  
  // let result:ErrorLogServiceInterface = {
    // implementation, depends on React and potentially Redux
export function pushError(error:MError) {
  console.log("pushError",error);
  errorLog.push(error)
  // dispatch(error)
}
    // provide a selector hook to access (display, etc.) raised errors
export function getErrorLog():MError[] {
    return errorLog;
}
  // }
  // return result;
  // constructor () {
  // }

  // public pushError(error:MError) {
  //   this.dispatch(error)
  // }

  // provide a selector hook to access (display, etc.) raised errors
  // getErrorLog():MError[] {
  //   return this.state
  // };
// }
