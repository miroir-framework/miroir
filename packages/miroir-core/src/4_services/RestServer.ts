import { HttpMethod } from "../0_interfaces/1_core/Http";
import {
  ActionReturnType,
  ApplicationSection,
  DomainElement,
  EntityInstance,
  InstanceAction,
  ModelAction,
  QueryTemplateAction,
  StoreOrBundleAction
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
import { getLoggerName } from "../tools";
import { MiroirLoggerFactory } from "./Logger";
import { generateRestServiceResponse } from "./RestTools";
import { cleanLevel } from "./constants";

import { LocalCacheInterface } from "../0_interfaces/4-services/LocalCacheInterface";
import {
  extractWithExtractorFromDomainStateForTemplate,
  extractWithManyExtractorsFromDomainStateForTemplateREDUNDANT,
  getSelectorParamsForTemplateOnDomainState,
  getSelectorMapForTemplate
} from "../2_domain/DomainStateQueryTemplateSelector";
import { extractWithExtractorTemplate, handleQueryTemplateAction } from "../2_domain/QueryTemplateSelectors";
import { DomainState } from "../0_interfaces/2_domain/DomainControllerInterface";

const loggerName: string = getLoggerName(packageName, cleanLevel,"RestServer");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
  (value: LoggerInterface) => {
    log = value;
  }
);

// function wrapResults(instances: string[]): HttpResponseBodyFormat {
function wrapResults(instances: any[]): HttpResponseBodyFormat {
  return { instances };
}

// ################################################################################################
export async function restMethodGetHandler
(
  useDomainControllerToHandleModelAndInstanceActions: boolean,
  continuationFunction: (response:any) =>(arg0: any) => any,
  response: any,
  persistenceStoreControllerManager: PersistenceStoreControllerManagerInterface,
  localCache: LocalCacheInterface,
  method: HttpMethod | undefined, // unused!
  effectiveUrl: string, // log only, to remove?
  body: HttpRequestBodyFormat | undefined, // unused!
  params: any,
) {
  // const localParams = params ?? request.params;
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
    return generateRestServiceResponse(
      { section, parentUuid },
      ["section", "parentUuid"],
      [],
      async (section: ApplicationSection, parentUuid: string): Promise<HttpResponseBodyFormat> => {
        const getInstancesFunction = targetPersistenceStoreController.getInstances.bind(targetPersistenceStoreController);
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
      "failed with error",
      error
    );
    return Promise.resolve(undefined);
  }
}

// ################################################################################################
export async function restMethodsPostPutDeleteHandler(
  useDomainControllerToHandleModelAndInstanceActions: boolean,
  continuationFunction: (response:any) =>(arg0: any) => any,
  response: any,
  persistenceStoreControllerManager: PersistenceStoreControllerManagerInterface,
  localCache: LocalCacheInterface,
  method: HttpMethod,
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
  localCache: LocalCacheInterface,
  method: HttpMethod,
  effectiveUrl: string, // log only, to remove?
  body: HttpRequestBodyFormat,
  params: any,
):Promise<void> {
  const actionName: string =
  typeof params["actionName"] == "string" ? params["actionName"] : params["actionName"][0];

  log.debug("restActionRunner params", params, "body", body);

  const action: StoreOrBundleAction | InstanceAction | ModelAction = body as StoreOrBundleAction | InstanceAction | ModelAction ;
  switch (action.actionType) {
    case "storeManagementAction":
    case "bundleAction": {
      const result = await storeActionOrBundleActionStoreRunner(
        actionName,
        body as StoreOrBundleAction,
        persistenceStoreControllerManager,
      );
      return continuationFunction(response)(result)
      break;
    }
    case "modelAction": 
    case "instanceAction": {
      const localPersistenceStoreController = persistenceStoreControllerManager.getPersistenceStoreController(action.deploymentUuid);
      const domainController = persistenceStoreControllerManager.getServerDomainController();
      if (!localPersistenceStoreController) {
        throw new Error("could not find controller for deployment: " + action.deploymentUuid);
      }
      if (useDomainControllerToHandleModelAndInstanceActions) {
        // we are on the server, the action has been received from remote client
        const result = await domainController.handleAction(action)
        return continuationFunction(response)(result)
      } else {
        /**
         * we are on the client:
         * - the RestServerStub emulates the client,
         * - the client has direct access to the persistence store (which is emulated, too)
         *  */ 
        const result = await localPersistenceStoreController.handleAction(action)
        return continuationFunction(response)(result)
      }
      break;
    }
    default:
      throw new Error("RestServer restActionStoreRunner could not handle action " + JSON.stringify(action,undefined,2));
      break;
    }
  }

// ################################################################################################
// USES LocalCache memoized reducers, shall go to miroir-server instead?
export async function queryTemplateActionHandler(
  useDomainControllerToHandleModelAndInstanceActions: boolean,
  continuationFunction: (response:any) =>(arg0: any) => any,
  response: any,
  persistenceStoreControllerManager: PersistenceStoreControllerManagerInterface,
  localCache: LocalCacheInterface,
  method: HttpMethod,
  effectiveUrl: string, // log only, to remove?
  body: HttpRequestBodyFormat,
  params: any,
):Promise<void> {
  log.info("RestServer queryTemplateActionHandler params", params, "body", body);

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
  // const query: ExtractorTemplateForRecordOfExtractors = body.query as ExtractorTemplateForRecordOfExtractors ;
  const queryTemplateAction: QueryTemplateAction = body as QueryTemplateAction ;

  const deploymentUuid = queryTemplateAction.deploymentUuid
  const localPersistenceStoreController = persistenceStoreControllerManager.getPersistenceStoreController(
    deploymentUuid
  );
  const domainController = persistenceStoreControllerManager.getServerDomainController();
  if (!localPersistenceStoreController) {
    throw new Error("RestServer could not find controller for deployment:" + deploymentUuid);
  }
  if (useDomainControllerToHandleModelAndInstanceActions) {
    // we are on the server, the action has been received from remote client
    // switch (queryTemplateAction.deploymentUuid) {
    const result = await domainController.handleQueryTemplateForServerONLY(queryTemplateAction)
    log.info(
      "RestServer queryTemplateActionHandler used adminConfigurationDeploymentMiroir domainController result=",
      JSON.stringify(result, undefined, 2)
    );
    return continuationFunction(response)(result)
  } else {
    // we're on the client, called by RestServerStub
    // uses the local cache, needs to have done a Model "rollback" action on the client//, or a Model "remoteLocalCacheRollback" action on the server
    const domainState: DomainState = localCache.getDomainState();
    const extractorRunnerMapOnDomainState = getSelectorMapForTemplate();
    log.info("RestServer queryTemplateActionHandler queryTemplateAction=", JSON.stringify(queryTemplateAction, undefined, 2))
    log.info("RestServer queryTemplateActionHandler domainState=", JSON.stringify(domainState, undefined, 2))
    const queryResult: DomainElement = extractWithExtractorTemplate(
      domainState,
      getSelectorParamsForTemplateOnDomainState(queryTemplateAction.query, extractorRunnerMapOnDomainState)
    )
    const result:ActionReturnType = {
      status: "ok",
      returnedDomainElement: queryResult
    }
    log.info("RestServer queryTemplateActionHandler used local cache result=", JSON.stringify(result, undefined,2))

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
    method: "put",
    url: "/CRUD/:deploymentUuid/:section/entity",
    handler: restMethodsPostPutDeleteHandler
  },
  {
    method: "post",
    url: "/CRUD/:deploymentUuid/:section/entity",
    handler: restMethodsPostPutDeleteHandler
  },
  {
    method: "delete",
    url: "/CRUD/:deploymentUuid/:section/entity",
    handler: restMethodsPostPutDeleteHandler
  },
  {
    method: "post",
    url: "/action/:actionName",
    handler: restActionHandler
  },
  {
    method: "post",
    url: "/queryTemplate",
    handler: queryTemplateActionHandler
  },
];
