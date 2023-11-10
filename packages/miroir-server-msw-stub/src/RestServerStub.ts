import { DefaultBodyType, HttpResponse, http } from "msw";

import {
  HttpMethod,
  HttpRequestBodyFormat,
  IStoreController,
  restMethodGetHandler,
  restMethodModelActionRunnerHandler,
  restMethodsPostPutDeleteHandler
} from "miroir-core";

// Add an extra delay to all endpoints, so loading spinners show up.
const ARTIFICIAL_DELAY_MS = 100;

const serializePost = (post: any) => ({
  ...post,
  user: post.user.id,
});

declare type TmpHandler = {
  method: HttpMethod,
  url: string,
  rootApiUrl: string,
  localMiroirStoreController: IStoreController,
  localAppStoreController: IStoreController
  handler: (
    continuationFunction: (response: any) => (arg0: any) => any,
    localMiroirStoreController: IStoreController,
    localAppStoreController: IStoreController,
    method: HttpMethod,
    response: any,
    effectiveUrl: string, // log only, to remove?
    body: HttpRequestBodyFormat,
    params: any
  ) => Promise<void>;
};

// ##################################################################################
export class RestServerStub {
  public handlers: any[];

  constructor(
    private rootApiUrl: string,
    private localMiroirStoreController: IStoreController,
    private localAppStoreController: IStoreController
  ) {
    console.log(
      "RestServerStub constructor rootApiUrl",
      rootApiUrl,
      "localIndexedDbDataStores",
      localMiroirStoreController,
      localAppStoreController
    );

    const tmpHandlers: TmpHandler[] = [
      {
        method: "get",
        url: "/miroirWithDeployment/:deploymentUuid/:section/entity/:parentUuid/all",
        localMiroirStoreController,
        localAppStoreController,
        rootApiUrl: this.rootApiUrl,
        handler: restMethodGetHandler.bind(restMethodGetHandler)
      },
      {
        method: "put",
        url: "/miroirWithDeployment/:deploymentUuid/:section/entity",
        localMiroirStoreController,
        localAppStoreController,
        rootApiUrl: this.rootApiUrl,
        handler: restMethodsPostPutDeleteHandler.bind(restMethodsPostPutDeleteHandler)
      },
      {
        method: "post",
        url: "/miroirWithDeployment/:deploymentUuid/:section/entity",
        localMiroirStoreController,
        localAppStoreController,
        rootApiUrl: this.rootApiUrl,
        handler: restMethodsPostPutDeleteHandler.bind(restMethodsPostPutDeleteHandler)
      },
      {
        method: "delete",
        url: "/miroirWithDeployment/:deploymentUuid/:section/entity",
        localMiroirStoreController,
        localAppStoreController,
        rootApiUrl: this.rootApiUrl,
        handler: restMethodsPostPutDeleteHandler.bind(restMethodsPostPutDeleteHandler)
      },
      {
        method: "post",
        url: "/modelWithDeployment/:deploymentUuid/:actionName",
        localMiroirStoreController,
        localAppStoreController,
        rootApiUrl: this.rootApiUrl,
        handler: restMethodModelActionRunnerHandler.bind(restMethodModelActionRunnerHandler)
      },
    ];

    this.handlers = tmpHandlers.map(
      (h:TmpHandler)=> (http as any)[h.method](h.rootApiUrl + h.url,
        async (p:{ request: any/* StrictRequest<DefaultBodyType> */, params: any /*PathParams*/}) => {
          const { request, params} = p;
          // console.log("RestServerStub received request",h.method, h.rootApiUrl + h.url,"request", request, "params", params);
          
          let body: HttpRequestBodyFormat = {}
          if (h.method !== "get") {
            try {
              body = (await request.json()) as HttpRequestBodyFormat;
            } catch (e) {
              console.error("RestServerStub could not read body for", h.method,h.url,":",e);
            }
          }
          // console.log("RestServerStub received request",h.method, h.rootApiUrl + h.url, "body", body);
          try {
            return h.handler(
              (response: any) => (localData: any) => HttpResponse.json(localData),
              h.localMiroirStoreController,
              h.localAppStoreController,
              h.method /* method */,
              undefined /* response object provided by Express Rest interface, which is not needed by MSW, that uses class HttpResponse*/,
              h.rootApiUrl + "/miroirWithDeployment/:deploymentUuid/:section/entity/:parentUuid/all",
              body, // body
              params
            );
          } catch (error) {
            console.warn("RestServerStub get handler", "rootApiUrl", rootApiUrl, "failed with error", error);
            return Promise.resolve(undefined);
          }
        }
      )
    )
  }
}
