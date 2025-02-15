import { HttpResponse, http } from "msw";

import {
  DomainControllerInterface,
  HttpRequestBodyFormat,
  LoggerInterface,
  MiroirConfigClient,
  MiroirLoggerFactory,
  PersistenceStoreControllerManagerInterface,
  RestServiceHandler
} from "miroir-core";
import { cleanLevel, packageName } from "./constants.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "RestMswServerStub")
).then((logger: LoggerInterface) => {log = logger});


// Add an extra delay to all endpoints, so loading spinners show up.
const ARTIFICIAL_DELAY_MS = 100;

const serializePost = (post: any) => ({
  ...post,
  user: post.user.id,
});

// ##################################################################################
export class RestMswServerStub {
  public handlers: any[];

  constructor(
    private rootApiUrl: string,
    restServerHandlers: RestServiceHandler[],
    persistenceStoreControllerManager: PersistenceStoreControllerManagerInterface,
    domainController: DomainControllerInterface,
    miroirConfig: MiroirConfigClient,
  ) {
    log.info(
      "constructor rootApiUrl",
      rootApiUrl,
      "localIndexedDbDataStores",
    );


    this.handlers = restServerHandlers.map(
      (restService:RestServiceHandler)=> (http as any)[restService.method](this.rootApiUrl + restService.url,
        // async (p:{ request: any /*StrictRequest<any>*/, params: any /*PathParams*/}) => {
        async (p:{ request: any /*StrictRequest<any>*/, params: any /*PathParams*/}) => {
        // async (p:{ request: any/* StrictRequest<DefaultBodyType> */, params: any /*PathParams*/}) => {
          const { request, params} = p;
          // log.info("RestMswServerStub received request",restService.method, this.rootApiUrl + restService.url,"request", request, "params", params);
          log.info(
            "RestMswServerStub received request",
            restService.method,
            this.rootApiUrl + restService.url,
            "body",
            await request.text(),
            "params",
            params
          );
          
          let body: HttpRequestBodyFormat = {}
          if (restService.method !== "get") {
            try {
              body = (await request.json()) as HttpRequestBodyFormat;
              // body = (await request.formData()) as HttpRequestBodyFormat;
            } catch (e) {
              const errorBody = (await request.text()) as HttpRequestBodyFormat;
              log.info("RestMswServerStub received request",restService.method, this.rootApiUrl + restService.url,"request", request, "params", params, "errorBody", errorBody);
              log.error("RestMswServerStub could not read body for", restService.method,restService.url,":",e);
            }
          }
          // log.info("RestMswServerStub received request",h.method, h.rootApiUrl + h.url, "body", body);
          try {
            const result = await restService.handler(
              false, // useDomainControllerToHandleModelAndInstanceActions: since we're emulating the REST server, we have direct access the persistenceStore, do not use the domainController
              // true, // useDomainControllerToHandleModelAndInstanceActions: the domainController knows whether it has access to the persistenceStore or not, and will use the appropriate access method, depending on the query. 
              (response: any) => (localData: any) => HttpResponse.json(localData),
              undefined /* response object provided by Express Rest interface, which is not needed by MSW, that uses class HttpResponse*/,
              persistenceStoreControllerManager,
              domainController,
              restService.method /* method */,
              this.rootApiUrl + restService.url,
              body, // body
              params
            );
            return result;
          } catch (error) {
            log.warn("RestMswServerStub get handler", "rootApiUrl", rootApiUrl, "failed with error", error);
            return Promise.resolve(undefined);
          }
        }
      )
    )
  }
}
