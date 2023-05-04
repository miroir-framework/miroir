import { HttpMethod } from "../0_interfaces/1_core/Http";
import { EntityInstance } from "../0_interfaces/1_core/Instance";

export const generateHandlerBody = async (
  params:{[propName: string]: any},
  paramNames:string[],
  instances:EntityInstance[],
  HttpMethod:HttpMethod,
  url:string,
  method:(parentName:string,instance?:EntityInstance)=>Promise<any>,
  jsonFormater:(a:any)=>any,
) => {
  console.log('generateHandlerBody called', HttpMethod, url, "started #####################################");
  console.log('generateHandlerBody called with params',params);
  
  let localData
  if (paramNames.length > 0) {
    // assuming first param is always entityUuid of instances
    const paramVal: string = typeof params[paramNames[0]] == "string" ? params[paramNames[0]] : params[paramNames[0]][0];
    console.log("generateHandlerBody execute method for params", paramNames,'value',paramVal);
    localData = await method(paramVal);
  }

  if (instances.length > 0) {
    console.log("generateHandlerBody execute method for payload instances, named", instances.map(i=>i['name']));
    for (const instance of instances) {
      await method(instance.parentUuid,instance)
    }
    localData = instances;
  }

  // console.log("server received", localData);
  console.log("##################################### end: ",HttpMethod, url);
  return jsonFormater(localData);

}
