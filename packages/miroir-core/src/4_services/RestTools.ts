import { EntityInstance } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { HttpResponseBodyFormat } from "../0_interfaces/4-services/PersistenceInterface";
import { packageName } from "../constants";

import { MiroirLoggerFactory } from "./LoggerFactory";
import { cleanLevel } from "./constants";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "RestTools")
).then((logger: LoggerInterface) => {log = logger});



// ################################################################################################
/**
 * calls the async method {@link method} and returns the result or calls {@link applyJsonResultContinuation} with the result, if a continuation is provided.
 * @param params 
 * @param paramNames 
 * @param instances 
 * @param HttpMethod 
 * @param url 
 * @param method 
 * @param applyJsonResultContinuation 
 * @returns 
 */
export const generateRestServiceResponse = async (
  params:{[propName: string]: any},
  paramNames:string[],
  instances:EntityInstance[],
  method: (...params: any)=>Promise<HttpResponseBodyFormat>, // async method, returns promise
  applyJsonResultContinuation:(a:any)=>any,
) => {
  // log.info('generateRestServiceResponse called with params',params);
  
  let localData: HttpResponseBodyFormat = {instances:[]};
  let paramVals: string[] = [];
  if (paramNames.length > 0) {// get BAAAAAAAD
    // assuming first param is always entityUuid of instances
    paramVals = paramNames.map(p=>typeof params[p] == "string" ? params[p] : params[p][0]);
  }

  // log.info('##################################### generateRestServiceResponse called', HttpMethod, url, "started",'params',paramVals,'instances',instances);
  if (paramNames.length > 0 || instances.length > 0) { // put, post. BAAAAAAAD
    // log.info("generateRestServiceResponse execute method for payload instances, named", instances.map((i:any)=>i['name']));

    if (instances.length > 0) {
      for (const instance of instances) {
        if (paramVals.length > 0) {
          localData = await method(...paramVals,instance)
        } else {
          localData = await method(instance)
        }
      }
    } else {
      localData = await method(...paramVals);
    }
    // localData = instances;
  }

  // log.debug("generateRestServiceResponse received", localData);
  // log.info("##################################### end: ",HttpMethod, url);
  return localData?applyJsonResultContinuation(localData):[];
}

