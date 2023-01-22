import { MError } from 'miroir-core';

export declare type ErrorLogState = MError[];

const errorLog: ErrorLogState = [];

export function pushError(error:MError) {
  console.log("pushError",error);
  errorLog.push(error)
}
export function getErrorLog():MError[] {
    return errorLog;
}
