// A tiny wrapper around fetch(), borrowed from
// https://kentcdodds.com/blog/replace-axios-with-a-simple-custom-fetch-wrapper

import { HttpMethod } from "../0_interfaces/1_core/Http";
import { DomainControllerInterface } from "../0_interfaces/2_domain/DomainControllerInterface";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { RestClientCallReturnType, RestClientInterface } from "../0_interfaces/4-services/PersistenceInterface";
import { PersistenceStoreControllerManagerInterface } from "../0_interfaces/4-services/PersistenceStoreControllerManagerInterface";
import { packageName } from "../constants";
import { MiroirLoggerFactory } from "./LoggerFactory";
import { restServerDefaultHandlers } from "./RestServer";
import { cleanLevel } from "./constants";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "RestClientStub")
).then((logger: LoggerInterface) => {log = logger});

// ##############################################################################################
/**
 * calls Rest Server directly, without going through the network.
 */
export class RestClientStub implements RestClientInterface {
  private persistenceStoreControllerManager: PersistenceStoreControllerManagerInterface | undefined;
  private serverDomainController: DomainControllerInterface | undefined;

  constructor(private rootApiUrl: string) {}

  setPersistenceStoreControllerManager(
    persistenceStoreControllerManager: PersistenceStoreControllerManagerInterface
  ) {
    this.persistenceStoreControllerManager = persistenceStoreControllerManager;
  }

  setServerDomainController(domainController: DomainControllerInterface) {
    this.serverDomainController = domainController;
  }

  // ##############################################################################################
  async call(
    rawUrl: string,
    method: HttpMethod,
    endpoint: string,
    args: any = {}
  ): Promise<RestClientCallReturnType> {
    // log.info("RestClient call", method, endpoint, args)
    if (this.persistenceStoreControllerManager === undefined) {
      throw new Error("RestClientStub: persistenceStoreControllerManager is not set");
    }
    if (this.serverDomainController === undefined) {
      throw new Error("RestClientStub: serverDomainController is not set");
    }

    const { body, ...customConfig } = args;
    const deploymentUuid = args["deploymentUuid"] ?? (body ?? {})["deploymentUuid"];
    const parentUuid = args["parentUuid"] ?? (body ?? {})["parentUuid"] ?? (body ?? {})["deploymentUuid"];
    const section = args["section"] ?? (body ?? {})["section"];
    // const actionName = args["actionName"] ?? (body ?? {})["actionName"];
    const actionType = args["actionType"] ?? (body ?? {})["actionType"];

    let data;
    try {
      // log.info("restServerDefaultHandlers", restServerDefaultHandlers)
      log.info(
        "RestClientStub call with params",
        "deploymentUuid",
        deploymentUuid,
        "parentUuid=",
        parentUuid,
        ", section=",
        section,
        ", method=",
        method,
        ", endpoint=",
        endpoint,
        ", body=",
        body
      );
      // log.info("RestClientStub for header", method, "rawUrl=", rawUrl, "endpoint=", endpoint, "sending body=", body);
      const methodToCall = restServerDefaultHandlers.find(
        (h) => h.method == method.toLowerCase() && h.url == rawUrl
      );
      log.info("RestClientStub found methodToCall", methodToCall);
      if (!methodToCall) {
        throw new Error(`RestClientStub: No handler found for ${method} ${rawUrl}`);
      }

      // log.info("RestClientStub methodToCall", methodToCall);
      const result = await methodToCall.handler(
        // false, // useDomainControllerToHandleModelAndInstanceActions: since we're emulating the REST server, we have direct access the persistenceStore, do not use the domainController
        true, // useDomainControllerToHandleModelAndInstanceActions: the domainController knows whether it has access to the persistenceStore or not, and will use the appropriate access method, depending on the query.
        (response: any) => (localData: any) => localData, // continuationFunction: the result from RestServer is wrapped in a "data" object
        undefined,
        //   response /* response object provided by Express Rest interface, which is not needed by this stub*/,
        this.persistenceStoreControllerManager,
        this.serverDomainController,
        method as any /* method */,
        endpoint,
        body, // body
        {
          // params
          // actionName,
          actionType,
          deploymentUuid,
          parentUuid,
          section,
          ...args,
        }
      );

      // log.info("RestClientStub inner result", JSON.stringify(result, undefined, 2));
      return {
        // simulating response to a REST call
        status: 200,
        data: result,
        headers: new Headers(),
        url: this.rootApiUrl + endpoint,
      };
    } catch (err: any) {
      return Promise.reject(err.message ? err.message : data);
    }
  }

  // ##############################################################################################
  async get(
    rawUrl: string,
    endpoint: string,
    customConfig: any = {}
  ): Promise<RestClientCallReturnType> {
    // const result: RestClientCallReturnType = await this.call(rawUrl, "GET", endpoint, {
    const result: RestClientCallReturnType = await this.call(rawUrl, "get", endpoint, {
      ...customConfig,
      method: "GET",
    });
    // log.trace('RestClient get', endpoint, result)
    return result;
  }

  // ##############################################################################################
  async post(
    rawUrl: string,
    endpoint: string,
    body: any,
    customConfig = {}
  ): Promise<RestClientCallReturnType> {
    // const result: RestClientCallReturnType = await this.call(rawUrl, "POST", endpoint, {
    const result: RestClientCallReturnType = await this.call(rawUrl, "post", endpoint, {
      ...customConfig,
      body,
    });
    // log.trace('RestClient post', endpoint, result)
    return result;
  }

  // ##############################################################################################
  async put(
    rawUrl: string,
    endpoint: string,
    body: any,
    customConfig = {}
  ): Promise<RestClientCallReturnType> {
    // const result: RestClientCallReturnType = await this.call(rawUrl, "PUT", endpoint, {
    const result: RestClientCallReturnType = await this.call(rawUrl, "put", endpoint, {
      ...customConfig,
      body,
    });
    // log.trace('RestClient put', endpoint, result)
    return result;
  }

  // ##############################################################################################
  async delete(
    rawUrl: string,
    endpoint: string,
    body: any,
    customConfig = {}
  ): Promise<RestClientCallReturnType> {
    // const result: RestClientCallReturnType = await this.call(rawUrl, "DELETE", endpoint, {
    const result: RestClientCallReturnType = await this.call(rawUrl, "delete", endpoint, {
      ...customConfig,
      body,
    });
    // log.trace('RestClient delete', endpoint, result)
    return result;
  }
}

export default RestClientStub;