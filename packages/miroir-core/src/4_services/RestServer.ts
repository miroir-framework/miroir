import { HttpMethod } from "../0_interfaces/1_core/Http";
import { MiroirAction, ApplicationSection, EntityInstance, ActionReturnType } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { HttpRequestBodyFormat, HttpResponseBodyFormat, RestServiceHandler } from "../0_interfaces/4-services/RemoteStoreInterface";
import { actionRunner, modelActionRunner, modelOLDActionRunner } from "../3_controllers/ActionRunner";

import { StoreControllerManagerInterface } from "../0_interfaces/4-services/StoreControllerManagerInterface";
import { applicationDeploymentLibrary } from "../ApplicationDeploymentLibrary";
import { packageName } from "../constants";
import { getLoggerName } from "../tools";
import { MiroirLoggerFactory } from "./Logger";
import { generateRestServiceResponse } from "./RestTools";
import { cleanLevel } from "./constants";

import applicationDeploymentMiroir from "../assets/miroir_data/35c5608a-7678-4f07-a4ec-76fc5bc35424/10ff36f2-50a3-48d8-b80f-e48e5d13af8e.json";

const loggerName: string = getLoggerName(packageName, cleanLevel,"RestServer");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
  (value: LoggerInterface) => {
    log = value;
  }
);

function wrapResults(instances: EntityInstance[]): HttpResponseBodyFormat {
  return { instances };
}

// ################################################################################################
export async function restMethodGetHandler
(
  continuationFunction: (response:any) =>(arg0: any) => any,
  storeControllerManager: StoreControllerManagerInterface,
  method: HttpMethod | undefined, // unused!
  response: any,
  effectiveUrl: string, // log only, to remove?
  body: HttpRequestBodyFormat | undefined, // unused!
  params: any,
) {
  // const localParams = params ?? request.params;
  log.info(
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

  const localMiroirStoreController = storeControllerManager.getStoreController(applicationDeploymentMiroir.uuid);
  const localAppStoreController = storeControllerManager.getStoreController(applicationDeploymentLibrary.uuid);
  if (!localMiroirStoreController || !localAppStoreController) {
    throw new Error("restMethodGetHandler could not find controller:" + localMiroirStoreController + " " + localAppStoreController);
  } 

  const targetStoreController =
    deploymentUuid == applicationDeploymentLibrary.uuid ? localAppStoreController : localMiroirStoreController;
  // const targetProxy = deploymentUuid == applicationDeploymentLibrary.uuid?libraryAppFileSystemDataStore:miroirAppSqlServerProxy;
  log.info(
    "restMethodGetHandler get miroirWithDeployment/ using",
    // (targetStoreController as any)["applicationName"],
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
      async (section: ApplicationSection, parentUuid: string): Promise<HttpResponseBodyFormat> => {
        const getInstancesFunction = targetStoreController.getInstances.bind(targetStoreController);
        const results: ActionReturnType = await getInstancesFunction(section, parentUuid)
        if (results.status != "ok") {
          throw new Error("restMethodGetHandler could not get instances for parentUuid: " + parentUuid + " error " + JSON.stringify(results.error));
        }
        if (results.returnedDomainElement?.elementType != "entityInstanceCollection") {
          throw new Error("restMethodGetHandler wrong returnType for instances of parentUuid: " + parentUuid + "returned" + results.returnedDomainElement);
        }
        
        log.info("restMethodGetHandler found results", results.returnedDomainElement.elementValue.instances)
        return wrapResults(results.returnedDomainElement.elementValue.instances);
      },
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
  storeControllerManager: StoreControllerManagerInterface,
  method: HttpMethod,
  response: any,
  effectiveUrl: string, // log only, to remove?
  body: HttpRequestBodyFormat,
  params: any,
) {
  // const foundParams = params ?? request.params;
  const foundParams = params;
  log.debug("restMethodsPostPutDeleteHandler", method, effectiveUrl, "foundParams", foundParams, "body", body);
  // log.info("restMethodsPostPutDeleteHandler",method,url, "request",request,"foundParams",foundParams,"body",body);
  const deploymentUuid: string =
    typeof foundParams["deploymentUuid"] == "string" ? foundParams["deploymentUuid"] : foundParams["deploymentUuid"][0];

  const section: ApplicationSection = (
    typeof foundParams["section"] == "string" ? foundParams["section"] : foundParams["section"][0]
  ) as ApplicationSection;

  const localMiroirStoreController = storeControllerManager.getStoreController(applicationDeploymentMiroir.uuid);
  const localAppStoreController = storeControllerManager.getStoreController(applicationDeploymentLibrary.uuid);
  if (!localMiroirStoreController || !localAppStoreController) {
    throw new Error("restMethodsPostPutDeleteHandler could not find controller:" + localMiroirStoreController + " " + localAppStoreController);
  } 

  const targetDataStore =
    deploymentUuid == applicationDeploymentLibrary.uuid ? localAppStoreController : localMiroirStoreController;

  // THIS IS A COSTLY LOG!!!
  // log.trace(
  //   "restMethodsPostPutDeleteHandler deploymentUuid",
  //   deploymentUuid,
  //   "section",
  //   section,
  //   "targetDataStore.modelDate",
  //   await targetDataStore.getModelState(),
  //   "targetDataStore.dataDtate",
  //   await targetDataStore.getDataState()
  // );

  return generateRestServiceResponse(
    { section },
    ["section"],
    body?.crudInstances ?? [],
    ["post", "put"].includes(method)
      ? async (section: ApplicationSection, parentUuid: string): Promise<HttpResponseBodyFormat> => {
        const boundToCall = targetDataStore.upsertInstance.bind(targetDataStore);
        await boundToCall(section, parentUuid);
        return wrapResults([]);
      }
      : async (section: ApplicationSection, parentUuid: string): Promise<HttpResponseBodyFormat> => {
        const boundToCall = targetDataStore.deleteInstance.bind(targetDataStore)
        return wrapResults(await boundToCall(section, parentUuid));
      },
    continuationFunction(response)
  );
}

// ################################################################################################
export async function restMethodModelOLDActionRunnerHandler(
  continuationFunction: (response:any) =>(arg0: any) => any,
  storeControllerManager: StoreControllerManagerInterface,
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

    const localMiroirStoreController = storeControllerManager.getStoreController(applicationDeploymentMiroir.uuid);
    const localAppStoreController = storeControllerManager.getStoreController(applicationDeploymentLibrary.uuid);
    if (!localMiroirStoreController || !localAppStoreController) {
      throw new Error("restMethodModelOLDActionRunnerHandler could not find controller:" + localMiroirStoreController + " " + localAppStoreController);
    } 
  
  // log.debug("restMethodModelOLDActionRunnerHandler params", params, "body", body);
  log.info("restMethodModelOLDActionRunnerHandler params", params, "body", body, "storeControllers", localMiroirStoreController, localAppStoreController);

  const result = await modelOLDActionRunner(
    localMiroirStoreController,
    localAppStoreController,
    deploymentUuid,
    actionName,
    body.modelUpdate
  );

  log.info("restMethodModelOLDActionRunnerHandler params", params, "body", body, "result", result);

  return continuationFunction(response)(result)
}

// ################################################################################################
export async function restMethodEntityActionRunnerHandler(
  continuationFunction: (response:any) =>(arg0: any) => any,
  storeControllerManager: StoreControllerManagerInterface,
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

  const localMiroirStoreController = storeControllerManager.getStoreController(applicationDeploymentMiroir.uuid);
  const localAppStoreController = storeControllerManager.getStoreController(applicationDeploymentLibrary.uuid);
  if (!localMiroirStoreController || !localAppStoreController) {
    throw new Error("could not find controller:" + localMiroirStoreController + " " + localAppStoreController);
  } 
  
  log.debug("restMethodEntityActionRunnerHandler params", params, "body", body);

  const result = await modelActionRunner(
    localMiroirStoreController,
    localAppStoreController,
    deploymentUuid,
    actionName,
    body
  );
  return continuationFunction(response)(result)
}

// ################################################################################################
export async function restActionRunner(
  continuationFunction: (response:any) =>(arg0: any) => any,
  storeControllerManager: StoreControllerManagerInterface,
  method: HttpMethod,
  response: any,
  effectiveUrl: string, // log only, to remove?
  body: HttpRequestBodyFormat,
  params: any,
):Promise<void> {
  const actionName: string =
  typeof params["actionName"] == "string" ? params["actionName"] : params["actionName"][0];



  // const localMiroirStoreController = storeControllerManager.getStoreController(applicationDeploymentMiroir.uuid);
  // const localAppStoreController = storeControllerManager.getStoreController(applicationDeploymentLibrary.uuid);
  // if (!localMiroirStoreController || !localAppStoreController) {
  //   throw new Error("could not find controller:" + localMiroirStoreController + " " + localAppStoreController);
  // } 

  // const deploymentUuid: string =
  //   typeof params["deploymentUuid"] == "string" ? params["deploymentUuid"] : params["deploymentUuid"][0];

  log.debug("restActionRunner params", params, "body", body);

  const result = await actionRunner(
    actionName,
    body as MiroirAction,
    storeControllerManager,
    // miroirConfig,
  );
  return continuationFunction(response)(result)
}

// ################################################################################################
export const restServerDefaultHandlers: RestServiceHandler[] = [
  // CRUD operations (plain REST)
  {
    method: "get",
    url: "/miroirWithDeployment/:deploymentUuid/:section/entity/:parentUuid/all",
    handler: restMethodGetHandler
  },
  {
    method: "put",
    url: "/miroirWithDeployment/:deploymentUuid/:section/entity",
    handler: restMethodsPostPutDeleteHandler
  },
  {
    method: "post",
    url: "/miroirWithDeployment/:deploymentUuid/:section/entity",
    handler: restMethodsPostPutDeleteHandler
  },
  {
    method: "delete",
    url: "/miroirWithDeployment/:deploymentUuid/:section/entity",
    handler: restMethodsPostPutDeleteHandler
  },
  // other operations, receiving Miroir Actions
  {
    method: "post",
    url: "/modelOLDWithDeployment/:deploymentUuid/:actionName",
    handler: restMethodModelOLDActionRunnerHandler
  },
  {
    method: "post",
    url: "/modelWithDeployment/:deploymentUuid/:actionName",
    handler: restMethodEntityActionRunnerHandler
  },
  {
    method: "post",
    url: "/action/:actionName",
    handler: restActionRunner
  },
];
