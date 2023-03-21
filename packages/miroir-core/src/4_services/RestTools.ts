import { HttpMethod } from "../0_interfaces/1_core/Http";
import { Instance } from "../0_interfaces/1_core/Instance";

export const generateHandlerBody = async (
  params:{[propName: string]: any},
  paramNames:string[],
  instances:Instance[],
  HttpMethod:HttpMethod,
  url:string,
  method:(entityName:string,instance?:Instance)=>Promise<any>,
  jsonFormater:(a:any)=>any,
) => {
  console.log(HttpMethod, url, "started #####################################");
  let localData
  if (paramNames.length > 0) {
    const paramVal: string = typeof params[paramNames[0]] == "string" ? params[paramNames[0]] : params[paramNames[0]][0];
    console.log("generateHandlerBody execute method for params", paramNames,'value',paramVal);
    localData = await method(paramVal);
  }

  if (instances.length > 0) {
    console.log("server execute method for instances", instances.map(i=>i['name']));
    for (const instance of instances) {
      await method(instance.entityUuid,instance)
    }
    localData = instances;
  }

  console.log("server received", localData);
  console.log("##################################### end: ",HttpMethod, url);
  return jsonFormater(localData);

}
