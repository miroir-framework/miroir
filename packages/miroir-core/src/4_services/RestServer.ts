import { HttpMethod } from "../0_interfaces/1_core/Http";
import {
  ApplicationSection,
  DomainElementSuccess,
  EntityInstance,
  InstanceAction,
  ModelAction,
  RunBoxedExtractorOrQueryAction,
  RunBoxedQueryTemplateOrBoxedExtractorTemplateAction,
  StoreOrBundleAction,
  type JzodSchema
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import {
  HttpRequestBodyFormat,
  HttpResponseBodyFormat,
  RestServiceHandler,
} from "../0_interfaces/4-services/PersistenceInterface";
import {
  storeActionOrBundleActionStoreRunner
} from "../3_controllers/ActionRunner";

import { PersistenceStoreControllerManagerInterface } from "../0_interfaces/4-services/PersistenceStoreControllerManagerInterface";
import { packageName } from "../constants";

import { MiroirLoggerFactory } from "./MiroirLoggerFactory";
import { generateRestServiceResponse } from "./RestTools";
import { cleanLevel } from "./constants";

import { DomainControllerInterface, DomainState } from "../0_interfaces/2_domain/DomainControllerInterface";
import { Action2Error, Action2ReturnType, Domain2ElementFailed, Domain2QueryReturnType } from "../0_interfaces/2_domain/DomainElement";
import { defaultMiroirMetaModel } from "../1_core/Model";
import {
  getExtractorTemplateRunnerParamsForDomainState,
  getQueryTemplateRunnerParamsForDomainState,
  getSelectorMapForTemplate
} from "../2_domain/DomainStateQueryTemplateSelector";
import { extractWithBoxedExtractorTemplate, runQueryTemplateWithExtractorCombinerTransformer } from "../2_domain/QueryTemplateSelectors";
import { miroirFundamentalJzodSchema } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalJzodSchema";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "RestServer")
).then((logger: LoggerInterface) => {log = logger});


// function wrapResults(instances: string[]): HttpResponseBodyFormat {
function wrapResults(instances: any[]): HttpResponseBodyFormat {
  return { instances };
}

// ################################################################################################
/**
 * is it still used?
 * TODO: use domainController to handle model and instance actions, not persistenceStoreControllerManager
 * @param useDomainControllerToHandleModelAndInstanceActions 
 * @param continuationFunction 
 * @param responseHandler 
 * @param persistenceStoreControllerManager 
 * @param method 
 * @param effectiveUrl 
 * @param body 
 * @param params 
 * @returns 
 */
export async function restMethodGetHandler
(
  useDomainControllerToHandleModelAndInstanceActions: boolean,
  continuationFunction: (response:any) =>(arg0: any) => any,
  responseHandler: any,
  persistenceStoreControllerManager: PersistenceStoreControllerManagerInterface,
  domainController: DomainControllerInterface,
  method: HttpMethod | undefined, // unused!
  effectiveUrl: string, // log only, to remove?
  body: HttpRequestBodyFormat | undefined, // unused!
  params: any,
) {
  log.info(
    "restMethodGetHandler get CRUD/ called using",
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

  const localPersistenceStoreController = persistenceStoreControllerManager.getPersistenceStoreController(
    deploymentUuid
  );
  if (!localPersistenceStoreController) {
    throw new Error("restMethodGetHandler could not find controller for deployment:" + deploymentUuid);
  }
  
  const targetPersistenceStoreController = localPersistenceStoreController
  log.info(
    "restMethodGetHandler get CRUD/ using",
    // (targetPersistenceStoreController as any)["applicationName"],
    "deployment",
    deploymentUuid,
  );

  try {
    const result = await generateRestServiceResponse(
      { section, parentUuid },
      ["section", "parentUuid"],
      [],
      async (section: ApplicationSection, parentUuid: string): Promise<HttpResponseBodyFormat> => {
        const getInstancesFunction = targetPersistenceStoreController.getInstances.bind(targetPersistenceStoreController);
        const results: Action2ReturnType = await getInstancesFunction(section, parentUuid)
        if (results instanceof Action2Error) {
          throw new Error(
            "restMethodGetHandler could not get instances for parentUuid: " +
              parentUuid +
              " error " +
              JSON.stringify(results)
          );
        }
        if (results.returnedDomainElement instanceof Domain2ElementFailed) {
          throw new Error(
            "restMethodGetHandler wrong returnType for instances of parentUuid: " +
              parentUuid +
              "returned" +
              results
          );
        }
        
        // TODO: assumption that the returnedDomainElement is an EntityInstanceCollection is wrong!
        if (typeof results.returnedDomainElement !== "object" || Array.isArray(results.returnedDomainElement)) {
          throw new Error(
            "restMethodGetHandler wrong returnType for instances of parentUuid: " +
              parentUuid +
              "returned" +
              results
          );
          
        }
        return wrapResults(results.returnedDomainElement.instances);
      },
      continuationFunction(responseHandler)
    );
    // log.debug("restMethodGetHandler get CRUD/ result", JSON.stringify(result, undefined, 2));
    return Promise.resolve(result);
  } catch (error) {
    log.error(
      "restMethodGetHandler get url",
      effectiveUrl,
      "deployment",
      deploymentUuid,
      "failed with error",
      error
    );
    // Send error response to client to prevent hanging
    const errorResponse = {
      error: "Internal server error",
      message: error instanceof Error ? error.message : String(error),
      statusCode: 500
    };
    continuationFunction(responseHandler)(errorResponse);
    // Re-throw the error so it can be handled by the server's error handler
    throw error;
  }
}

// ################################################################################################
/**
 * is it still used?
 * @param useDomainControllerToHandleModelAndInstanceActions 
 * @param continuationFunction 
 * @param response 
 * @param persistenceStoreControllerManager 
 * @param method 
 * @param effectiveUrl 
 * @param body 
 * @param params 
 * @returns 
 */
export async function restMethodsPostPutDeleteHandler(
  useDomainControllerToHandleModelAndInstanceActions: boolean,
  continuationFunction: (response:any) =>(arg0: any) => any,
  response: any,
  persistenceStoreControllerManager: PersistenceStoreControllerManagerInterface,
  domainController: DomainControllerInterface,
  method: HttpMethod,
  effectiveUrl: string, // log only, to remove?
  body: HttpRequestBodyFormat,
  params: any,
) {
  // const foundParams = params ?? request.params;
  const foundParams = params;
  log.info("restMethodsPostPutDeleteHandler", method, effectiveUrl, "foundParams", foundParams, "body", body);
  // log.info("restMethodsPostPutDeleteHandler",method,url, "request",request,"foundParams",foundParams,"body",body);
  const deploymentUuid: string =
    typeof foundParams["deploymentUuid"] == "string" ? foundParams["deploymentUuid"] : foundParams["deploymentUuid"][0];

  const section: ApplicationSection = (
    typeof foundParams["section"] == "string" ? foundParams["section"] : foundParams["section"][0]
  ) as ApplicationSection;

  const localPersistenceStoreController = persistenceStoreControllerManager.getPersistenceStoreController(
    deploymentUuid
  );
  if (!localPersistenceStoreController) {
    throw new Error("restMethodsPostPutDeleteHandler could not find controller for deployment: " + deploymentUuid);
  } 

  const targetDataStore = localPersistenceStoreController

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
      ? async (section: ApplicationSection, instance: EntityInstance): Promise<HttpResponseBodyFormat> => {
        const boundToCall = targetDataStore.upsertInstance.bind(targetDataStore);
        await boundToCall(section, instance);
        return wrapResults([]);
      }
      : async (section: ApplicationSection, instance: EntityInstance): Promise<HttpResponseBodyFormat> => {
        const boundToCall = targetDataStore.deleteInstance.bind(targetDataStore)
        // return wrapResults(await boundToCall(section, instance));
        await boundToCall(section, instance);
        return wrapResults([]);
      },
    continuationFunction(response)
  );
}

// ################################################################################################
export async function restActionHandler(
  useDomainControllerToHandleModelAndInstanceActions: boolean,
  continuationFunction: (response:any) =>(arg0: any) => any,
  response: any,
  persistenceStoreControllerManager: PersistenceStoreControllerManagerInterface,
  domainController: DomainControllerInterface,
  method: HttpMethod,
  effectiveUrl: string, // log only, to remove?
  body: HttpRequestBodyFormat,
  params: any,
):Promise<void> {
  log.info("restActionHandler called with method", method);
  log.info("restActionHandler called with effectiveUrl", effectiveUrl);
  // log.info("restActionHandler called with params", JSON.stringify(params,undefined,2));
  log.info("restActionHandler called with params", params);

  if (body && (body as any).actionType !== "initModel") {
    // log.info("restActionHandler called with", "body", JSON.stringify(body, undefined, 2));
    log.info("restActionHandler called with", "body", body);
  }
  // else {
  //   log.info("restActionHandler called");
  // }
  // const actionName: string = typeof params["actionName"] == "string" ? params["actionName"] : params["actionName"][0];
  const actionType: string =
    typeof params["actionType"] == "string" ? params["actionType"] : params["actionType"][0];

  // log.debug("restActionRunner params", params, "body", body);

  const action: StoreOrBundleAction | InstanceAction | ModelAction = body as
    | StoreOrBundleAction
    | InstanceAction
    | ModelAction;
  switch (action.actionType) {
    // case "storeManagementAction":
    case "storeManagementAction_createStore":
    case "storeManagementAction_deleteStore":
    case "storeManagementAction_resetAndInitApplicationDeployment":
    case "storeManagementAction_openStore":
    case "storeManagementAction_closeStore":
    //
    case "bundleAction": {
      const result = await storeActionOrBundleActionStoreRunner(
        // actionName,
        actionType,
        body as StoreOrBundleAction,
        persistenceStoreControllerManager
      );
      return continuationFunction(response)(result);
      break;
    }
    // case "modelAction":
    case "initModel":
    case "commit":
    case "rollback":
    case "remoteLocalCacheRollback":
    case "resetModel":
    case "resetData":
    case "alterEntityAttribute":
    case "renameEntity":
    case "createEntity":
    case "dropEntity":
    // case "instanceAction": {
    case "createInstance":
    case "deleteInstance":
    case "deleteInstanceWithCascade":
    case "updateInstance":
    case "loadNewInstancesInLocalCache":
    case "getInstance":
    case "getInstances": {
      if (useDomainControllerToHandleModelAndInstanceActions) {
        // we are on the server, the action has been received from remote client
        // if (action.actionType == "modelAction") {
        if (
          [
            "initModel",
            "commit",
            "rollback",
            "remoteLocalCacheRollback",
            "resetModel",
            "resetData",
            "alterEntityAttribute",
            "renameEntity",
            "createEntity",
            "dropEntity",
          ].includes(action.actionType)
        ) {
          const result = await domainController.handleAction(action, defaultMiroirMetaModel);
          return continuationFunction(response)(result);
        } else {
          const result = await domainController.handleAction(action);
          log.info(
            "restActionHandler handled action",
            action.actionType,
            // "result",
            // JSON.stringify(result, undefined, 2)
          );
          return continuationFunction(response)(result);
        }
      } else {
        /**
         * we are on the client:
         * - the RestMswServerStub emulates the client,
         * - the client has direct access to the persistence store (which is emulated, too)
         *  */
        const localPersistenceStoreController =
          persistenceStoreControllerManager.getPersistenceStoreController(action.deploymentUuid);
        if (!localPersistenceStoreController) {
          throw new Error(
            "could not find controller for deployment: " +
              action.deploymentUuid +
              " action: " +
              JSON.stringify(action, undefined, 2)
          );
        }
        const result = await localPersistenceStoreController.handleAction(action);
        return continuationFunction(response)(result);
      }
      break;
    }
    default:
      throw new Error(
        "RestServer restActionStoreRunner could not handle action " +
          JSON.stringify(action, undefined, 2)
      );
      break;
  }
}

// ################################################################################################
// USES LocalCache memoized reducers, shall go to miroir-server instead?
export async function queryActionHandler(
  useDomainControllerToHandleModelAndInstanceActions: boolean,
  continuationFunction: (response:any) =>(arg0: any) => any,
  response: any,
  persistenceStoreControllerManager: PersistenceStoreControllerManagerInterface,
  domainController: DomainControllerInterface,
  method: HttpMethod,
  effectiveUrl: string, // log only, to remove?
  body: HttpRequestBodyFormat,
  params: any,
):Promise<void> {
  log.info("RestServer queryActionHandler params", params, "body", body);

  /**
   * shall a query be executed based on the state of the localCache, or fetching state from a PersistenceStore?
   * 
   * go through the DomainController? (would be better, wouldn't it?)
   * 
   * when the implementation accesses the localCache, the implementation is based on selectors
   * 
   * when the implementation uses the persistenceStore, it could:
   * - load the required data in the localCache (select) then execute in the localCache (filter, aggregation)
   * - execute on the persistent store (sql)
   * 
   */
  // const domainController = persistenceStoreControllerManager.getServerDomainControllerDEFUNCT();
  const runBoxedExtractorOrQueryAction: RunBoxedExtractorOrQueryAction = body as RunBoxedExtractorOrQueryAction;
  log.info(
    "RestServer queryActionHandler",
    domainController.getPersistenceStoreAccessMode(),
    "runBoxedExtractorOrQueryAction=",
    // "useDomainControllerToHandleModelAndInstanceActions",
    // useDomainControllerToHandleModelAndInstanceActions,
    JSON.stringify(runBoxedExtractorOrQueryAction, undefined, 2)
  );
  // USING THE LOCAL CACHE OR THE LOCAL PERSISTENCE STORE 
  // SHALL BE DETERMINED BY DOMAINCONTROLLER DEPENDING ON THE QUERY
  const result = await domainController.handleBoxedExtractorOrQueryAction(runBoxedExtractorOrQueryAction)
  // log.info(
  //   "RestServer queryActionHandler used domainController result=",
  //   JSON.stringify(result, undefined, 2)
  // );
  return continuationFunction(response)(result)
}

// ################################################################################################
// USES LocalCache memoized reducers, shall go to miroir-server instead?
export async function queryTemplateActionHandler(
  useDomainControllerToHandleModelAndInstanceActions: boolean,
  continuationFunction: (response:any) =>(arg0: any) => any,
  response: any,
  persistenceStoreControllerManager: PersistenceStoreControllerManagerInterface,
  domainController: DomainControllerInterface,
  method: HttpMethod,
  effectiveUrl: string, // log only, to remove?
  body: HttpRequestBodyFormat,
  params: any,
):Promise<void> {
  // log.info("RestServer queryTemplateActionHandler params", params, "body", body);
  // log.info("queryTemplateActionHandler called with method", method);
  // log.info("queryTemplateActionHandler called with effectiveUrl", effectiveUrl);
  // log.info("queryTemplateActionHandler called with","body", JSON.stringify(body, undefined, 2));
  // log.info("queryTemplateActionHandler called with params", JSON.stringify(params,undefined,2));


  /**
   * shall a query be executed based on the state of the localCache, or fetching state from a PersistenceStore?
   *
   * go through the DomainController? (would be better, wouldn't it?)
   *
   * when the implementation accesses the localCache, the implementation is based on selectors
   *
   * when the implementation uses the persistenceStore, it could:
   * - load the required data in the localCache (select) then execute in the localCache (filter, aggregation)
   * - execute on the persistent store (sql)
   *
   */
  const runBoxedQueryTemplateOrBoxedExtractorTemplateAction: RunBoxedQueryTemplateOrBoxedExtractorTemplateAction =
    body as RunBoxedQueryTemplateOrBoxedExtractorTemplateAction;

  // const domainController = persistenceStoreControllerManager.getServerDomainControllerDEFUNCT();
  if (useDomainControllerToHandleModelAndInstanceActions) {
    // we are on the server, the action has been received from remote client
    const result = await domainController.handleQueryTemplateOrBoxedExtractorTemplateActionForServerONLY(
      runBoxedQueryTemplateOrBoxedExtractorTemplateAction
    );
    log.info(
      "RestServer queryTemplateActionHandler used adminConfigurationDeploymentMiroir domainController result=", result
      // JSON.stringify(result, undefined, 2)
    );
    return continuationFunction(response)(result);
  } else {
    // we're on the client, called by RestMswServerStub
    // uses the local cache, needs to have done a Model "rollback" action on the client
    // or a Model "remoteLocalCacheRollback" action on the server
    const domainState: DomainState = domainController.getDomainState();
    const extractorRunnerMapOnDomainState = getSelectorMapForTemplate();
    log.info(
      "RestServer queryTemplateActionHandler runBoxedQueryTemplateOrBoxedExtractorTemplateAction=",
      runBoxedQueryTemplateOrBoxedExtractorTemplateAction,
      // JSON.stringify(runBoxedQueryTemplateOrBoxedExtractorTemplateAction, undefined, 2)
    );
    // log.info("RestServer queryTemplateActionHandler domainState=", JSON.stringify(domainState, undefined, 2));
    let queryResult: Domain2QueryReturnType<any> = undefined as any as Domain2QueryReturnType<any>;

    switch (runBoxedQueryTemplateOrBoxedExtractorTemplateAction.payload.query.queryType) {
      case "boxedExtractorTemplateReturningObject":
      case "boxedExtractorTemplateReturningObjectList": {
        queryResult = extractWithBoxedExtractorTemplate(
          domainState,
          getExtractorTemplateRunnerParamsForDomainState(
            runBoxedQueryTemplateOrBoxedExtractorTemplateAction.payload.query,
            extractorRunnerMapOnDomainState
          ),
          {
            miroirFundamentalJzodSchema: miroirFundamentalJzodSchema as JzodSchema,
            // TODO: current model for app / deployment?
            miroirMetaModel: defaultMiroirMetaModel,
          }
        );
        break;
      }
      case "boxedQueryTemplateWithExtractorCombinerTransformer":
        queryResult = runQueryTemplateWithExtractorCombinerTransformer(
          domainState,
          getQueryTemplateRunnerParamsForDomainState(
            runBoxedQueryTemplateOrBoxedExtractorTemplateAction.payload.query,
            extractorRunnerMapOnDomainState
          ),
          {
            miroirFundamentalJzodSchema: miroirFundamentalJzodSchema as JzodSchema,
            // TODO: current model for app / deployment?
            miroirMetaModel: defaultMiroirMetaModel,
          }
        );

        break;

      default:
        break;
    }
    const result: Action2ReturnType = {
      status: "ok",
      returnedDomainElement: queryResult,
    };
    log.info("RestServer queryTemplateActionHandler used local cache result=", result);
    // log.info("RestServer queryTemplateActionHandler used local cache result=", JSON.stringify(result, undefined, 2));

    return continuationFunction(response)(result);
  }
}

// ################################################################################################
export const restServerDefaultHandlers: RestServiceHandler[] = [
  // CRUD operations (plain REST)
  {
    method: "get",
    url: "/CRUD/:deploymentUuid/:section/entity/:parentUuid/all",
    handler: restMethodGetHandler
  },
  {
    method: "put", // still used?
    url: "/CRUD/:deploymentUuid/:section/entity",
    handler: restMethodsPostPutDeleteHandler
  },
  {
    method: "post", // still used?
    url: "/CRUD/:deploymentUuid/:section/entity",
    handler: restMethodsPostPutDeleteHandler
  },
  {
    method: "delete", // still used?
    url: "/CRUD/:deploymentUuid/:section/entity",
    handler: restMethodsPostPutDeleteHandler
  },
  {
    method: "post",
    // url: "/action/:actionName",
    url: "/action/:actionType",
    handler: restActionHandler
  },
  {
    method: "post",
    url: "/queryTemplate",
    handler: queryTemplateActionHandler
  },
  {
    method: "post",
    url: "/query",
    handler: queryActionHandler
  },
];
