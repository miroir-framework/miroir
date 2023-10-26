import { IStoreController, applicationDeploymentLibrary, handleRestServiceCallAndGenerateServiceResponse, modelActionRunner, postPutDeleteHandler } from "miroir-core";
import { rest } from "msw";
// import { IStoreController } from "../0_interfaces/4-services/remoteStore/IStoreController.js";
// import { modelActionRunner } from "../3_controllers/ModelActionRunner";
// import { applicationDeploymentLibrary } from "../ApplicationDeploymentLibrary.js";

// Add an extra delay to all endpoints, so loading spinners show up.
const ARTIFICIAL_DELAY_MS = 100;

const serializePost = (post: any) => ({
  ...post,
  user: post.user.id,
});

// // ################################################################################################
// export function handleRestServiceCallAndGenerateServiceResponse(
//   url: string, // log only, to remove?
//   localMiroirStoreController: IStoreController,
//   localAppStoreController: IStoreController,
//   req:any,
//   continuationFunction:(arg0: any)=>any
// ) {
//   const deploymentUuid: string =
//   typeof req.params["deploymentUuid"] == "string" ? req.params["deploymentUuid"] : req.params["deploymentUuid"][0];

//   const section: ApplicationSection =
//     (typeof req.params["section"] == "string" ? req.params["section"] : req.params["section"][0]) as ApplicationSection;

//   const parentUuid: string =
//   typeof req.params["parentUuid"] == "string" ? req.params["parentUuid"] : req.params["parentUuid"][0];

//   const targetStoreController = deploymentUuid == applicationDeploymentLibrary.uuid?localAppStoreController:localMiroirStoreController;
//   // const targetProxy = deploymentUuid == applicationDeploymentLibrary.uuid?libraryAppFileSystemDataStore:miroirAppSqlServerProxy;
//   console.log(
//     "handleRestServiceCallAndGenerateServiceResponse get miroirWithDeployment/ using application",
//     (targetStoreController as any)["applicationName"],
//     "deployment",
//     deploymentUuid,
//     "applicationDeploymentLibrary.uuid",
//     applicationDeploymentLibrary.uuid
//   );

//   return generateRestServiceResponse(
//     {section, parentUuid},
//     ['section','parentUuid'],
//     [],
//     'get',
//     targetStoreController.getInstances.bind(targetStoreController),
//     continuationFunction
//   )
// }


// // ################################################################################################
// export function postPutDeleteHandler(
//   url: string, // log only, to remove?
//   method: HttpMethod,
//   body: any[],
//   localMiroirStoreController: IStoreController,
//   localAppStoreController: IStoreController,
//   req:any,
//   continuationFunction:(arg0: any)=>any
// ) {
//   console.log(method,url, body);
//   const deploymentUuid: string =
//     typeof req.params["deploymentUuid"] == "string" ? req.params["deploymentUuid"] : req.params["deploymentUuid"][0];

//   const section: ApplicationSection =
//     (typeof req.params["section"] == "string" ? req.params["section"] : req.params["section"][0]) as ApplicationSection;

//   const targetDataStore = deploymentUuid == applicationDeploymentLibrary.uuid?localAppStoreController:localMiroirStoreController;
  
//   return generateRestServiceResponse(
//     {section},
//     ['section'],
//     body,
//     method,
//     ['post','put'].includes(method)?targetDataStore.upsertInstance.bind(targetDataStore):targetDataStore.deleteInstance.bind(targetDataStore),
//     continuationFunction
//   )
// }

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
      rest.get(this.rootApiUrl + "/miroirWithDeployment/:deploymentUuid/:section/entity/:parentUuid/all", async (req, res, ctx) => {
        return handleRestServiceCallAndGenerateServiceResponse(
          this.rootApiUrl + "/miroirWithDeployment/:deploymentUuid/:section/entity/:parentUuid/all",
          localMiroirStoreController,
          localAppStoreController,
          req,
          (localData)=>res(ctx.json(localData))
        )
      }),
      rest.post(this.rootApiUrl + "/miroirWithDeployment/:deploymentUuid/:section/entity", async (req, res, ctx) => {
        const body = await req.json();
        return postPutDeleteHandler(
          this.rootApiUrl + "miroirWithDeployment/:deploymentUuid/:section/entity",
           'post',
          body,
          localMiroirStoreController,
          localAppStoreController,
          req,
          (localData)=>res(ctx.json(localData))
        );
      }),
      rest.put(this.rootApiUrl + "/miroirWithDeployment/:deploymentUuid/:section/entity", async (req, res, ctx) => {
        const body = await req.json();
        return postPutDeleteHandler(
          this.rootApiUrl + "miroirWithDeployment/:deploymentUuid/:section/entity",
           'put',
          body,
          localMiroirStoreController,
          localAppStoreController,
          req,
          (localData)=>res(ctx.json(localData))
        );
      }),
      rest.delete(this.rootApiUrl + "/miroirWithDeployment/:deploymentUuid/:section/entity", async (req, res, ctx) => {
        const body = await req.json();
        return postPutDeleteHandler(
          this.rootApiUrl + "miroirWithDeployment/:deploymentUuid/:section/entity",
           'delete',
          body,
          localMiroirStoreController,
          localAppStoreController,
          req,
          (localData)=>res(ctx.json(localData))
        );
      }),

      // ############################    MODEL      ############################################
      rest.post(this.rootApiUrl + "/modelWithDeployment/:deploymentUuid/:actionName", async (req, res, ctx) => {
        console.log("post model/"," started #####################################");
        const actionName: string = typeof req.params["actionName"] == "string" ? req.params["actionName"] : req.params["actionName"][0];

        const deploymentUuid: string =
          typeof req.params["deploymentUuid"] == "string" ? req.params["deploymentUuid"] : req.params["deploymentUuid"][0];
      
        const targetDataStore = deploymentUuid == applicationDeploymentLibrary.uuid?localAppStoreController:localMiroirStoreController;
        console.log("post model/ actionName",actionName);
        let update = [];
        try {
          update = await req.json();
        } catch(e){}

        await modelActionRunner(
          deploymentUuid,
          actionName,
          localMiroirStoreController,
          localAppStoreController,
          update
        );
      
        return res(ctx.json([]));
      })
    ];
  }
}
