import { HttpResponse, http } from "msw";

import {
  HttpRequestBodyFormat,
  IStoreController,
  LoggerInterface,
  MiroirLoggerFactory,
  RestServiceHandler,
  getLoggerName,
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
    private localMiroirStoreController: IStoreController,
    private localAppStoreController: IStoreController
  ) {
    log.log(
      "RestServerStub constructor rootApiUrl",
      rootApiUrl,
      "localIndexedDbDataStores",
      localMiroirStoreController,
      localAppStoreController
    );


    this.handlers = restServerHandlers.map(
      (h:RestServiceHandler)=> (http as any)[h.method](this.rootApiUrl + h.url,
        async (p:{ request: any/* StrictRequest<DefaultBodyType> */, params: any /*PathParams*/}) => {
          const { request, params} = p;
          // log.log("RestServerStub received request",h.method, h.rootApiUrl + h.url,"request", request, "params", params);
          
          let body: HttpRequestBodyFormat = {}
          if (h.method !== "get") {
            try {
              body = (await request.json()) as HttpRequestBodyFormat;
            } catch (e) {
              log.error("RestServerStub could not read body for", h.method,h.url,":",e);
            }
          }
          // log.log("RestServerStub received request",h.method, h.rootApiUrl + h.url, "body", body);
          try {
            return h.handler(
              (response: any) => (localData: any) => HttpResponse.json(localData),
              localMiroirStoreController,
              localAppStoreController,
              h.method /* method */,
              undefined /* response object provided by Express Rest interface, which is not needed by MSW, that uses class HttpResponse*/,
              this.rootApiUrl + "/miroirWithDeployment/:deploymentUuid/:section/entity/:parentUuid/all",
              body, // body
              params
            );
          } catch (error) {
            log.warn("RestServerStub get handler", "rootApiUrl", rootApiUrl, "failed with error", error);
            return Promise.resolve(undefined);
          }
        }
      )
    )
  }
}
