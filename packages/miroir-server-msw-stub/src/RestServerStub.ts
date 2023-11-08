import { HttpResponse, http } from "msw";

import {
  EntityInstance,
  HttpResponseBodyFormat,
  IStoreController,
  ApplicationSection,
  applicationDeploymentLibrary,
  generateRestServiceResponse,
  HttpMethod,
  HttpRequestBodyFormat,
  modelActionRunner,
} from "miroir-core";

// Add an extra delay to all endpoints, so loading spinners show up.
const ARTIFICIAL_DELAY_MS = 100;

const serializePost = (post: any) => ({
  ...post,
  user: post.user.id,
});

function wrapResults(instances: EntityInstance[]): HttpResponseBodyFormat {
  return { instances };
}
// ################################################################################################
export function handleRestServiceCallAndGenerateServiceResponse(
  url: string, // log only, to remove?
  localMiroirStoreController: IStoreController,
  localAppStoreController: IStoreController,
  // request: any,
  params: any,
  continuationFunction: (arg0: any) => any
) {
  // const localParams = params ?? request.params;
  const localParams = params;
  const deploymentUuid: string =
    typeof localParams["deploymentUuid"] == "string" ? localParams["deploymentUuid"] : localParams["deploymentUuid"][0];

  const section: ApplicationSection = (
    typeof localParams["section"] == "string" ? localParams["section"] : localParams["section"][0]
  ) as ApplicationSection;

  const parentUuid: string =
    typeof localParams["parentUuid"] == "string" ? localParams["parentUuid"] : localParams["parentUuid"][0];

  const targetStoreController =
    deploymentUuid == applicationDeploymentLibrary.uuid ? localAppStoreController : localMiroirStoreController;
  // const targetProxy = deploymentUuid == applicationDeploymentLibrary.uuid?libraryAppFileSystemDataStore:miroirAppSqlServerProxy;
  console.log(
    "handleRestServiceCallAndGenerateServiceResponse get miroirWithDeployment/ using application",
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
      continuationFunction
    );
  } catch (error) {
    console.warn(
      "handleRestServiceCallAndGenerateServiceResponse get url",
      url,
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
export async function postPutDeleteHandler(
  url: string, // log only, to remove?
  method: HttpMethod,
  body: HttpRequestBodyFormat,
  localMiroirStoreController: IStoreController,
  localAppStoreController: IStoreController,
  // request: any,
  params: any,
  continuationFunction: (arg0: any) => any
) {
  // const foundParams = params ?? request.params;
  const foundParams = params;
  console.log("postPutDeleteHandler", method, url, "foundParams", foundParams, "body", body);
  // console.log("postPutDeleteHandler",method,url, "request",request,"foundParams",foundParams,"body",body);
  const deploymentUuid: string =
    typeof foundParams["deploymentUuid"] == "string" ? foundParams["deploymentUuid"] : foundParams["deploymentUuid"][0];

  const section: ApplicationSection = (
    typeof foundParams["section"] == "string" ? foundParams["section"] : foundParams["section"][0]
  ) as ApplicationSection;

  const targetDataStore =
    deploymentUuid == applicationDeploymentLibrary.uuid ? localAppStoreController : localMiroirStoreController;

  console.log(
    "postPutDeleteHandler deploymentUuid",
    deploymentUuid,
    "section",
    section,
    "targetDataStore.modelDate",
    await targetDataStore.getModelState(),
    "targetDataStore.dataDtate",
    await targetDataStore.getDataState()
  );

  return generateRestServiceResponse(
    { section },
    ["section"],
    body?.crudInstances ?? [],
    ["post", "put"].includes(method)
      ? async (section: ApplicationSection, parentUuid: string): Promise<HttpResponseBodyFormat> =>
          wrapResults(await targetDataStore.upsertInstance.bind(targetDataStore)(section, parentUuid))
      : async (section: ApplicationSection, parentUuid: string): Promise<HttpResponseBodyFormat> =>
          wrapResults(await targetDataStore.deleteInstance.bind(targetDataStore)(section, parentUuid)),
    continuationFunction
  );
}

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
            return handleRestServiceCallAndGenerateServiceResponse(
              this.rootApiUrl + "/miroirWithDeployment/:deploymentUuid/:section/entity/:parentUuid/all",
              localMiroirStoreController,
              localAppStoreController,
              // request,
              params,
              (localData) => HttpResponse.json(localData)
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
          return postPutDeleteHandler(
            this.rootApiUrl + "miroirWithDeployment/:deploymentUuid/:section/entity",
            "post",
            body,
            localMiroirStoreController,
            localAppStoreController,
            params,
            (localData) => HttpResponse.json(localData)
          );
        }
      ),
      http.put(
        this.rootApiUrl + "/miroirWithDeployment/:deploymentUuid/:section/entity",
        async ({ request, params }) => {
          const body = (await request.json()) as HttpRequestBodyFormat;
          return postPutDeleteHandler(
            this.rootApiUrl + "miroirWithDeployment/:deploymentUuid/:section/entity",
            "put",
            body,
            localMiroirStoreController,
            localAppStoreController,
            params,
            (localData) => HttpResponse.json(localData)
          );
        }
      ),
      http.delete(
        this.rootApiUrl + "/miroirWithDeployment/:deploymentUuid/:section/entity",
        async ({ request, params }) => {
          const body = (await request.json()) as HttpRequestBodyFormat;
          return postPutDeleteHandler(
            this.rootApiUrl + "miroirWithDeployment/:deploymentUuid/:section/entity",
            "delete",
            body,
            localMiroirStoreController,
            localAppStoreController,
            params,
            (localData) => HttpResponse.json(localData)
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
          deploymentUuid,
          actionName,
          localMiroirStoreController,
          localAppStoreController,
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
