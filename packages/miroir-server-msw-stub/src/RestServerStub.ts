import { HttpResponse, http } from "msw";

import {
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

    this.handlers = [
      // rest.get(this.rootApiUrl + "/miroirWithDeployment/:deploymentUuid/:section/entity/:parentUuid/all", async (req, res, ctx) => {
      http.get(
        this.rootApiUrl + "/miroirWithDeployment/:deploymentUuid/:section/entity/:parentUuid/all",
        async ({ request, params }) => {
          // console.log("RestServerStub handler ", request);
          try {
            return restMethodGetHandler(
              (response) => (localData) => HttpResponse.json(localData),
              localMiroirStoreController,
              localAppStoreController,
              "get", /* method */
              undefined, /* response object provided by Express Rest interface, which is not needed by MSW, that uses class HttpResponse*/
              this.rootApiUrl + "/miroirWithDeployment/:deploymentUuid/:section/entity/:parentUuid/all",
              undefined, // body
              params,
            );
          } catch (error) {
            console.warn("RestServerStub get handler", "rootApiUrl", rootApiUrl, "failed with error", error);
            return Promise.resolve(undefined);
          }
        }
      ),
      http.post(
        this.rootApiUrl + "/miroirWithDeployment/:deploymentUuid/:section/entity",
        async ({ request, params }) => {
          const body: HttpRequestBodyFormat = (await request.json()) as HttpRequestBodyFormat;
          return restMethodsPostPutDeleteHandler(
            (response) => (localData) => HttpResponse.json(localData),
            localMiroirStoreController,
            localAppStoreController,
            "post",
            undefined, /* response object provided by Express Rest interface, which is not needed by MSW, that uses class HttpResponse*/
            this.rootApiUrl + "miroirWithDeployment/:deploymentUuid/:section/entity",
            body,
            params,
          );
        }
      ),
      http.put(
        this.rootApiUrl + "/miroirWithDeployment/:deploymentUuid/:section/entity",
        async ({ request, params }) => {
          const body = (await request.json()) as HttpRequestBodyFormat;
          return restMethodsPostPutDeleteHandler(
            (response) => (localData) => HttpResponse.json(localData),
            localMiroirStoreController,
            localAppStoreController,
            "put",
            undefined, /* response object provided by Express Rest interface, which is not needed by MSW, that uses class HttpResponse*/
            this.rootApiUrl + "miroirWithDeployment/:deploymentUuid/:section/entity",
            body,
            params,
          );
        }
      ),
      http.delete(
        this.rootApiUrl + "/miroirWithDeployment/:deploymentUuid/:section/entity",
        async ({ request, params }) => {
          const body = (await request.json()) as HttpRequestBodyFormat;
          return restMethodsPostPutDeleteHandler(
            (response) => (localData) => HttpResponse.json(localData),
            localMiroirStoreController,
            localAppStoreController,
            "delete",
            undefined, /* response object provided by Express Rest interface, which is not needed by MSW, that uses class HttpResponse*/
            this.rootApiUrl + "miroirWithDeployment/:deploymentUuid/:section/entity",
            body,
            params,
          );
        }
      ),
      // ############################    MODEL      ############################################
      http.post(this.rootApiUrl + "/modelWithDeployment/:deploymentUuid/:actionName", async ({ request, params }) => {
        console.log("post modelWithDeployment/", " started #####################################");
        let body: HttpRequestBodyFormat = {};
        try {
          body = (await request.json()) as HttpRequestBodyFormat;
        } catch (e) {}

        console.log("post modelWithDeployment/ received update", body);

        return restMethodModelActionRunnerHandler(
          (response) => (localData) => HttpResponse.json(localData),
          localMiroirStoreController,
          localAppStoreController,
          "post",
          undefined, /* response object provided by Express Rest interface, which is not needed by MSW, that uses class HttpResponse*/
          this.rootApiUrl + "/modelWithDeployment/:deploymentUuid/:actionName",
          body,
          params
        )
      }),
    ];
  }
}
