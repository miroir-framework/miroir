import { HttpResponse, http } from "msw";

import {
  HttpRequestBodyFormat,
  IStoreController,
  applicationDeploymentLibrary,
  modelActionRunner,
  restMethodGetHandler,
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
        // const localParams = request.params
        const actionName: string =
          typeof params["actionName"] == "string" ? params["actionName"] : params["actionName"][0];

        const deploymentUuid: string =
          typeof params["deploymentUuid"] == "string" ? params["deploymentUuid"] : params["deploymentUuid"][0];

        const targetDataStore =
          deploymentUuid == applicationDeploymentLibrary.uuid ? localAppStoreController : localMiroirStoreController;
        console.log("post model/ actionName", actionName);
        let update: HttpRequestBodyFormat = {};
        try {
          update = (await request.json()) as HttpRequestBodyFormat;
        } catch (e) {}

        console.log("post modelWithDeployment/ received update", update);

        await modelActionRunner(
          localMiroirStoreController,
          localAppStoreController,
          deploymentUuid,
          actionName,
          update.modelUpdate
        );

        console.log("post modelWithDeployment/ return, with res", request, "params", params);
        // const jsonResult = await HttpResponse.json([]);
        const jsonResult = await HttpResponse.json({ instances: [] });
        // jsonResult.headers.all
        console.log("post modelWithDeployment/ return, with jsonResult", jsonResult);
        // const result: MaybePromise<MockedResponse<DefaultBodyType>> = res(jsonResult)
        // const result = res(jsonResult)
        // console.log("post modelWithDeployment/ return, with result", result);
        return jsonResult;
      }),
    ];
  }
}
