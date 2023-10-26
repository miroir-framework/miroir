import { HttpMethod } from "../0_interfaces/1_core/Http.js";
import { ApplicationSection } from "../0_interfaces/1_core/Instance.js";
import { ApplicationDeployment } from "../0_interfaces/1_core/StorageConfiguration.js";
import { IStoreController } from "../0_interfaces/4-services/remoteStore/IStoreController.js";
import { modelActionRunner } from "../3_controllers/ModelActionRunner";
import { applicationDeploymentLibrary } from "../ApplicationDeploymentLibrary.js";
import { generateRestServiceResponse } from "../RestTools.js";
import { DefaultBodyType, HttpResponse, http } from "msw";

// Add an extra delay to all endpoints, so loading spinners show up.
const ARTIFICIAL_DELAY_MS = 100;

const serializePost = (post: any) => ({
  ...post,
  user: post.user.id,
});

// ################################################################################################
export function handleRestServiceCallAndGenerateServiceResponse(
  url: string, // log only, to remove?
  localMiroirStoreController: IStoreController,
  localAppStoreController: IStoreController,
  request:any,
  params:any,
  continuationFunction:(arg0: any)=>any
) {
  const localParams = params??request.params;
  const deploymentUuid: string =
    typeof localParams["deploymentUuid"] == "string" ? localParams["deploymentUuid"] : localParams["deploymentUuid"][0];

  const section: ApplicationSection =
    (typeof localParams["section"] == "string" ? localParams["section"] : localParams["section"][0]) as ApplicationSection;

  const parentUuid: string =
    typeof localParams["parentUuid"] == "string" ? localParams["parentUuid"] : localParams["parentUuid"][0];

  const targetStoreController = deploymentUuid == applicationDeploymentLibrary.uuid?localAppStoreController:localMiroirStoreController;
  // const targetProxy = deploymentUuid == applicationDeploymentLibrary.uuid?libraryAppFileSystemDataStore:miroirAppSqlServerProxy;
  console.log(
    "handleRestServiceCallAndGenerateServiceResponse get miroirWithDeployment/ using application",
    (targetStoreController as any)["applicationName"],
    "deployment",
    deploymentUuid,
    "applicationDeploymentLibrary.uuid",
    applicationDeploymentLibrary.uuid
  );

  return generateRestServiceResponse(
    {section, parentUuid},
    ['section','parentUuid'],
    [],
    'get',
    targetStoreController.getInstances.bind(targetStoreController),
    continuationFunction
  )
}


// ################################################################################################
export function postPutDeleteHandler(
  url: string, // log only, to remove?
  method: HttpMethod,
  body: any[],
  localMiroirStoreController: IStoreController,
  localAppStoreController: IStoreController,
  request:any,
  params: any,
  continuationFunction:(arg0: any)=>any
) {
  const foundParams = params??request.params;
  console.log("postPutDeleteHandler",method,url, "request",request,"foundParams",foundParams,"body",body);
  const deploymentUuid: string =
    typeof foundParams["deploymentUuid"] == "string" ? foundParams["deploymentUuid"] : foundParams["deploymentUuid"][0];

  const section: ApplicationSection =
    (typeof foundParams["section"] == "string" ? foundParams["section"] : foundParams["section"][0]) as ApplicationSection;

  const targetDataStore = deploymentUuid == applicationDeploymentLibrary.uuid?localAppStoreController:localMiroirStoreController;
  
  return generateRestServiceResponse(
    {section},
    ['section'],
    body,
    method,
    ['post','put'].includes(method)?targetDataStore.upsertInstance.bind(targetDataStore):targetDataStore.deleteInstance.bind(targetDataStore),
    continuationFunction
  )
}

// ##################################################################################
export class RestServerStub {
  public handlers: any[];

  constructor(
    private rootApiUrl: string,
    private localMiroirStoreController: IStoreController,
    private localAppStoreController: IStoreController,
  ) {
    console.log('RestServerStub constructor rootApiUrl', rootApiUrl, 'localIndexedDbDataStores', localMiroirStoreController, localAppStoreController);

    this.handlers = [
      // rest.get(this.rootApiUrl + "/miroirWithDeployment/:deploymentUuid/:section/entity/:parentUuid/all", async (req, res, ctx) => {
      http.get(this.rootApiUrl + "/miroirWithDeployment/:deploymentUuid/:section/entity/:parentUuid/all", async ({request, params}) => {
        console.log("RestServerStub handler ", request);
        
        return handleRestServiceCallAndGenerateServiceResponse(
          this.rootApiUrl + "/miroirWithDeployment/:deploymentUuid/:section/entity/:parentUuid/all",
          localMiroirStoreController,
          localAppStoreController,
          request,
          params,
          (localData)=>HttpResponse.json(localData)
        )
      }),
      http.post(this.rootApiUrl + "/miroirWithDeployment/:deploymentUuid/:section/entity", async ({request, params}) => {
        const body = await request.json();
        return postPutDeleteHandler(
          this.rootApiUrl + "miroirWithDeployment/:deploymentUuid/:section/entity",
           'post',
          [body],
          localMiroirStoreController,
          localAppStoreController,
          request,
          params,
          (localData)=>HttpResponse.json(localData)
        );
      }),
      http.put(this.rootApiUrl + "/miroirWithDeployment/:deploymentUuid/:section/entity", async ({request, params}) => {
        const body = await request.json();
        return postPutDeleteHandler(
          this.rootApiUrl + "miroirWithDeployment/:deploymentUuid/:section/entity",
           'put',
          [body],
          localMiroirStoreController,
          localAppStoreController,
          request,
          params,
          (localData)=>HttpResponse.json(localData)
        );
      }),
      http.delete(this.rootApiUrl + "/miroirWithDeployment/:deploymentUuid/:section/entity", async ({request, params}) => {
        const body = await request.json();
        return postPutDeleteHandler(
          this.rootApiUrl + "miroirWithDeployment/:deploymentUuid/:section/entity",
           'delete',
          body,
          localMiroirStoreController,
          localAppStoreController,
          request,
          params,
          (localData)=>HttpResponse.json(localData)
        );
      }),

      // ############################    MODEL      ############################################
      http.post(this.rootApiUrl + "/modelWithDeployment/:deploymentUuid/:actionName", async ({request, params}) => {
        console.log("post modelWithDeployment/"," started #####################################");
        // const localParams = request.params
        const actionName: string = typeof params["actionName"] == "string" ? params["actionName"] : params["actionName"][0];

        const deploymentUuid: string =
          typeof params["deploymentUuid"] == "string" ? params["deploymentUuid"] : params["deploymentUuid"][0];
      
        const targetDataStore = deploymentUuid == applicationDeploymentLibrary.uuid?localAppStoreController:localMiroirStoreController;
        console.log("post model/ actionName",actionName);
        let update: any = {};
        try {
          update = await request.json();
        } catch(e){}

        await modelActionRunner(
          deploymentUuid,
          actionName,
          localMiroirStoreController,
          localAppStoreController,
          update
        );
      
        console.log("post modelWithDeployment/ return, with res", request, "params", params);
        const jsonResult = await HttpResponse.json([]);
        // jsonResult.headers.all
        console.log("post modelWithDeployment/ return, with jsonResult", jsonResult);
        // const result: MaybePromise<MockedResponse<DefaultBodyType>> = res(jsonResult)
        // const result = res(jsonResult)
        // console.log("post modelWithDeployment/ return, with result", result);
        return jsonResult;
      })
    ];
  }
}
