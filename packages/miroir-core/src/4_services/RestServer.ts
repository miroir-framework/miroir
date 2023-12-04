import { HttpMethod } from "../0_interfaces/1_core/Http";
import { ApplicationSection, EntityInstance } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { IStoreController } from "../0_interfaces/4-services/remoteStore/StoreControllerInterface";
import { HttpRequestBodyFormat, HttpResponseBodyFormat, RestServiceHandler } from "../0_interfaces/4-services/remoteStore/RemoteDataStoreInterface";
import { modelActionRunner } from "../3_controllers/ModelActionRunner";

import { applicationDeploymentLibrary } from "../ApplicationDeploymentLibrary";
import { packageName } from "../constants";
import { getLoggerName } from "../tools";
import { MiroirLoggerFactory } from "./Logger";
import { generateRestServiceResponse } from "./RestTools";
import { cleanLevel } from "./constants";

const loggerName: string = getLoggerName(packageName, cleanLevel,"RestTools");
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
  localMiroirStoreController: IStoreController,
  localAppStoreController: IStoreController,
  method: HttpMethod | undefined, // unused!
  response: any,
  effectiveUrl: string, // log only, to remove?
  body: HttpRequestBodyFormat | undefined, // unused!
  params: any,
) {
  // const localParams = params ?? request.params;
  log.debug(
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
  log.trace(
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
  log.debug("restMethodsPostPutDeleteHandler", method, effectiveUrl, "foundParams", foundParams, "body", body);
  // log.info("restMethodsPostPutDeleteHandler",method,url, "request",request,"foundParams",foundParams,"body",body);
  const deploymentUuid: string =
    typeof foundParams["deploymentUuid"] == "string" ? foundParams["deploymentUuid"] : foundParams["deploymentUuid"][0];

  const section: ApplicationSection = (
    typeof foundParams["section"] == "string" ? foundParams["section"] : foundParams["section"][0]
  ) as ApplicationSection;

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

  log.debug("restMethodModelActionRunnerHandler params", params, "body", body);

  const result = modelActionRunner(
    localMiroirStoreController,
    localAppStoreController,
    deploymentUuid,
    actionName,
    body.modelUpdate
  );
  return continuationFunction(response)(result)
}

// ################################################################################################
export const restServerDefaultHandlers: RestServiceHandler[] = [
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
  {
    method: "post",
    url: "/modelWithDeployment/:deploymentUuid/:actionName",
    handler: restMethodModelActionRunnerHandler
  },
];
