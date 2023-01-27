import { MError } from "../0_interfaces/3_controllers/ErrorLogServiceInterface";

export default {}

export declare type ErrorLogState = MError[];

const errorLog: ErrorLogState = [];

export function pushError(error:MError) {
  console.log("pushError",error);
  errorLog.push(error)
}
export function getErrorLog():MError[] {
    return errorLog;
}
