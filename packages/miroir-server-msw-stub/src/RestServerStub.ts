import { HttpResponse, http } from "msw";

import {
  HttpRequestBodyFormat,
  LoggerInterface,
  MiroirConfigClient,
  MiroirLoggerFactory,
  RestServiceHandler,
  PersistenceStoreControllerManagerInterface,
  getLoggerName,
  LocalCacheInterface
} from "miroir-core";
import { cleanLevel, packageName } from "./constants";

const loggerName: string = getLoggerName(packageName, cleanLevel,"RestServerStub");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

// Add an extra delay to all endpoints, so loading spinners show up.
const ARTIFICIAL_DELAY_MS = 100;

const serializePost = (post: any) => ({
  ...post,
  user: post.user.id,
});

// ##################################################################################
export class RestServerStub {
  public handlers: any[];

  constructor(
    private rootApiUrl: string,
    restServerHandlers: RestServiceHandler[],
    persistenceStoreControllerManager: PersistenceStoreControllerManagerInterface,
    localCache: LocalCacheInterface,
    miroirConfig: MiroirConfigClient,
  ) {
    log.info(
      "constructor rootApiUrl",
      rootApiUrl,
      "localIndexedDbDataStores",
    );


    this.handlers = restServerHandlers.map(
      (h:RestServiceHandler)=> (http as any)[h.method](this.rootApiUrl + h.url,
        async (p:{ request: any/* StrictRequest<DefaultBodyType> */, params: any /*PathParams*/}) => {
          const { request, params} = p;
          // log.info("RestServerStub received request",h.method, h.rootApiUrl + h.url,"request", request, "params", params);
          
          let body: HttpRequestBodyFormat = {}
          if (h.method !== "get") {
            try {
              body = (await request.json()) as HttpRequestBodyFormat;
            } catch (e) {
              log.error("RestServerStub could not read body for", h.method,h.url,":",e);
            }
          }
          // log.info("RestServerStub received request",h.method, h.rootApiUrl + h.url, "body", body);
          try {
            const result = await h.handler(
              false, // useDomainControllerToHandleModelAndInstanceActions: since we're emulating the REST server, we have direct access the persistenceStore, do not use the domainController
              (response: any) => (localData: any) => HttpResponse.json(localData),
              undefined /* response object provided by Express Rest interface, which is not needed by MSW, that uses class HttpResponse*/,
              persistenceStoreControllerManager,
              localCache,
              h.method /* method */,
              this.rootApiUrl + h.url,
              body, // body
              params
            );
            return result;
          } catch (error) {
            log.warn("RestServerStub get handler", "rootApiUrl", rootApiUrl, "failed with error", error);
            return Promise.resolve(undefined);
          }
        }
      )
    )
  }
}
