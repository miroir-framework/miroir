import { HttpMethod } from "../0_interfaces/1_core/Http";
import { EntityInstance } from "../0_interfaces/1_core/Instance";

export const generateHandlerBody = async (
  params:{[propName: string]: any},
  paramNames:string[],
  instances:EntityInstance[],
  HttpMethod:HttpMethod,
  url:string,
  // method:(parentName:string,instance?:EntityInstance)=>Promise<any>,
  method:(...params)=>Promise<any>,
  jsonFormater:(a:any)=>any,
) => {
  // console.log('generateHandlerBody called with params',params);
  
  let localData;
  let paramVals: string[] = [];
  if (paramNames.length > 0) {// get BAAAAAAAD
    // assuming first param is always entityUuid of instances
    // const paramVal: string = typeof params[paramNames[0]] == "string" ? params[paramNames[0]] : params[paramNames[0]][0];
    paramVals = paramNames.map(p=>typeof params[p] == "string" ? params[p] : params[p][0]);
    // console.log("generateHandlerBody execute method for params", paramNames,'value',paramVal);
    // localData = await method(...Object.values(params));
    // localData = await method(...paramVals);
  }

  console.log('##################################### generateHandlerBody called', HttpMethod, url, "started",'params',paramVals,'instances',instances);
  if (paramNames.length > 0 || instances.length > 0) { // put, post. BAAAAAAAD
    console.log("generateHandlerBody execute method for payload instances, named", instances.map(i=>i['name']));

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

  // console.log("generateHandlerBody received", localData);
  // console.log("##################################### end: ",HttpMethod, url);
  return localData?jsonFormater(localData):[];

}
