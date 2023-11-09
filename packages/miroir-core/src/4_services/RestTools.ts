import { HttpMethod } from "miroir-core/src/0_interfaces/1_core/Http";
import { ApplicationSection, EntityInstance } from "miroir-core/src/0_interfaces/1_core/Instance";
import { HttpRequestBodyFormat, HttpResponseBodyFormat } from "../0_interfaces/4-services/remoteStore/RemoteDataStoreInterface";
import { IStoreController } from "../0_interfaces/4-services/remoteStore/IStoreController";
import { applicationDeploymentLibrary } from "../ApplicationDeploymentLibrary";
import { modelActionRunner } from "../3_controllers/ModelActionRunner";

function wrapResults(instances: EntityInstance[]): HttpResponseBodyFormat {
  return { instances };
}

// ################################################################################################
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

// ################################################################################################
export async function restMethodGetHandler(
  // continuationFunction: (arg0: any) => any,
  continuationFunction: (response:any) =>(arg0: any) => any,
  localMiroirStoreController: IStoreController,
  localAppStoreController: IStoreController,
  method: HttpMethod | undefined, // unused!
  response: any,
  effectiveUrl: string, // log only, to remove?
  body: HttpRequestBodyFormat | undefined, // unused!
  params: any,
) {
  // const localParams = params ?? request.params;
  console.log(
    "restMethodGetHandler get miroirWithDeployment/ called using",
    "method",
    method,
    "effectiveUrl",
    effectiveUrl,
    "params",
    params,
    // "response",
    // response
  );
  const deploymentUuid: string =
    typeof params["deploymentUuid"] == "string" ? params["deploymentUuid"] : params["deploymentUuid"][0];

  const section: ApplicationSection = (
    typeof params["section"] == "string" ? params["section"] : params["section"][0]
  ) as ApplicationSection;

  const parentUuid: string =
    typeof params["parentUuid"] == "string" ? params["parentUuid"] : params["parentUuid"][0];

  const targetStoreController =
    deploymentUuid == applicationDeploymentLibrary.uuid ? localAppStoreController : localMiroirStoreController;
  // const targetProxy = deploymentUuid == applicationDeploymentLibrary.uuid?libraryAppFileSystemDataStore:miroirAppSqlServerProxy;
  console.log(
    "restMethodGetHandler get miroirWithDeployment/ using application",
    (targetStoreController as any)["applicationName"],
    "deployment",
    deploymentUuid,
    "applicationDeploymentLibrary.uuid",
    applicationDeploymentLibrary.uuid
  );

  try {
    return generateRestServiceResponse(
      { section, parentUuid },
      ["section", "parentUuid"],
      [],
      async (section: ApplicationSection, parentUuid: string): Promise<HttpResponseBodyFormat> =>
        wrapResults(await targetStoreController.getInstances.bind(targetStoreController)(section, parentUuid)),
      continuationFunction(response)
    );
  } catch (error) {
    console.warn(
      "restMethodGetHandler get url",
      effectiveUrl,
      "deployment",
      deploymentUuid,
      "applicationDeploymentLibrary.uuid",
      applicationDeploymentLibrary.uuid,
      "failed with error",
      error
    );
    return Promise.resolve(undefined);
  }
}

// ################################################################################################
export async function restMethodsPostPutDeleteHandler(
  continuationFunction: (response:any) =>(arg0: any) => any,
  localMiroirStoreController: IStoreController,
  localAppStoreController: IStoreController,
  method: HttpMethod,
  response: any,
  effectiveUrl: string, // log only, to remove?
  body: HttpRequestBodyFormat,
  params: any,
) {
  // const foundParams = params ?? request.params;
  const foundParams = params;
  console.log("restMethodsPostPutDeleteHandler", method, effectiveUrl, "foundParams", foundParams, "body", body);
  // console.log("restMethodsPostPutDeleteHandler",method,url, "request",request,"foundParams",foundParams,"body",body);
  const deploymentUuid: string =
    typeof foundParams["deploymentUuid"] == "string" ? foundParams["deploymentUuid"] : foundParams["deploymentUuid"][0];

  const section: ApplicationSection = (
    typeof foundParams["section"] == "string" ? foundParams["section"] : foundParams["section"][0]
  ) as ApplicationSection;

  const targetDataStore =
    deploymentUuid == applicationDeploymentLibrary.uuid ? localAppStoreController : localMiroirStoreController;

  console.log(
    "restMethodsPostPutDeleteHandler deploymentUuid",
    deploymentUuid,
    "section",
    section,
    "targetDataStore.modelDate",
    await targetDataStore.getModelState(),
    "targetDataStore.dataDtate",
    await targetDataStore.getDataState()
  );

  return generateRestServiceResponse(
    { section },
    ["section"],
    body?.crudInstances ?? [],
    ["post", "put"].includes(method)
      ? async (section: ApplicationSection, parentUuid: string): Promise<HttpResponseBodyFormat> =>
          wrapResults(await targetDataStore.upsertInstance.bind(targetDataStore)(section, parentUuid))
      : async (section: ApplicationSection, parentUuid: string): Promise<HttpResponseBodyFormat> =>
          wrapResults(await targetDataStore.deleteInstance.bind(targetDataStore)(section, parentUuid)),
    continuationFunction(response)
  );
}

// ################################################################################################
export async function restMethodModelActionRunnerHandler(
  continuationFunction: (response:any) =>(arg0: any) => any,
  localMiroirStoreController: IStoreController,
  localAppStoreController: IStoreController,
  method: HttpMethod,
  response: any,
  effectiveUrl: string, // log only, to remove?
  body: HttpRequestBodyFormat,
  params: any,
):Promise<void> {
  const actionName: string =
  typeof params["actionName"] == "string" ? params["actionName"] : params["actionName"][0];

  const deploymentUuid: string =
    typeof params["deploymentUuid"] == "string" ? params["deploymentUuid"] : params["deploymentUuid"][0];

  console.log("restMethodModelActionRunnerHandler params", params, "body", body);

  const result = modelActionRunner(
    localMiroirStoreController,
    localAppStoreController,
    deploymentUuid,
    actionName,
    body.modelUpdate
  );
  return continuationFunction(response)(result)
}