import { HttpMethod } from "miroir-core/src/0_interfaces/1_core/Http";
import { EntityInstance } from "miroir-core/src/0_interfaces/1_core/Instance";
import { HttpResponseBodyFormat } from "./0_interfaces/4-services/remoteStore/RemoteDataStoreInterface";

/**
 * calls the async method {@link method} and returns the result or calls {@link returnJsonResultContinuation} with the result, if a continuation is provided.
 * @param params 
 * @param paramNames 
 * @param instances 
 * @param HttpMethod 
 * @param url 
 * @param method 
 * @param returnJsonResultContinuation 
 * @returns 
 */
export const generateRestServiceResponse = async (
  params:{[propName: string]: any},
  paramNames:string[],
  instances:EntityInstance[],
  method: (...params: any)=>Promise<HttpResponseBodyFormat>, // async method, returns promise
  returnJsonResultContinuation:(a:any)=>any,
) => {
  // console.log('generateRestServiceResponse called with params',params);
  
  let localData: HttpResponseBodyFormat = {instances:[]};
  let paramVals: string[] = [];
  if (paramNames.length > 0) {// get BAAAAAAAD
    // assuming first param is always entityUuid of instances
    paramVals = paramNames.map(p=>typeof params[p] == "string" ? params[p] : params[p][0]);
  }

  // console.log('##################################### generateRestServiceResponse called', HttpMethod, url, "started",'params',paramVals,'instances',instances);
  if (paramNames.length > 0 || instances.length > 0) { // put, post. BAAAAAAAD
    // console.log("generateRestServiceResponse execute method for payload instances, named", instances.map((i:any)=>i['name']));

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

  // console.log("generateRestServiceResponse received", localData);
  // console.log("##################################### end: ",HttpMethod, url);
  return localData?returnJsonResultContinuation(localData):[];
}
