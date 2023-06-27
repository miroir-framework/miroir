import { HttpMethod } from "../0_interfaces/1_core/Http.js";
import { ApplicationSection } from "../0_interfaces/1_core/Instance.js";
import { ApplicationDeployment } from "../0_interfaces/1_core/StorageConfiguration.js";
import { IStoreController } from "../0_interfaces/4-services/remoteStore/IStoreController.js";
import { modelActionRunner } from "../3_controllers/ModelActionRunner";
import { generateHandlerBody } from "../RestTools.js";
import { rest } from "msw";

// Add an extra delay to all endpoints, so loading spinners show up.
const ARTIFICIAL_DELAY_MS = 100;

const serializePost = (post: any) => ({
  ...post,
  user: post.user.id,
});

// duplicated from server!!!!!!!!
const applicationDeploymentLibrary: ApplicationDeployment = {
  "uuid":"f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
  "parentName":"ApplicationDeployment",
  "parentUuid":"35c5608a-7678-4f07-a4ec-76fc5bc35424",
  "type":"singleNode",
  "name":"LibraryApplicationPostgresDeployment",
  "application":"5af03c98-fe5e-490b-b08f-e1230971c57f",
  "description": "The default Postgres Deployment for Application Library",
  "applicationModelLevel": "model",
  "model": {
    "location": {
      "type": "sql",
      "side":"server",
      "connectionString": "postgres://postgres:postgres@localhost:5432/postgres",
      "schema": "library"
    }
  },
  "data": {
    "location": {
      "type": "sql",
      "side":"server",
      "connectionString": "postgres://postgres:postgres@localhost:5432/postgres",
      "schema": "library"
    }
  }
}

export function getHandler(
  url: string, // log only, to remove?
  localMiroirStoreController: IStoreController,
  localAppStoreController: IStoreController,
  req:any,
  continuationFunction:(arg0: any)=>any
) {
  const deploymentUuid: string =
  typeof req.params["deploymentUuid"] == "string" ? req.params["deploymentUuid"] : req.params["deploymentUuid"][0];

  const section: ApplicationSection =
    (typeof req.params["section"] == "string" ? req.params["section"] : req.params["section"][0]) as ApplicationSection;

  const parentUuid: string =
  typeof req.params["parentUuid"] == "string" ? req.params["parentUuid"] : req.params["parentUuid"][0];

  const targetStoreController = deploymentUuid == applicationDeploymentLibrary.uuid?localAppStoreController:localMiroirStoreController;
  // const targetProxy = deploymentUuid == applicationDeploymentLibrary.uuid?libraryAppFileSystemDataStore:miroirAppSqlServerProxy;
  console.log("RestServerStub get miroirWithDeployment/ using application",(targetStoreController as any)['applicationName'], "deployment",deploymentUuid,'applicationDeploymentLibrary.uuid',applicationDeploymentLibrary.uuid);

  return generateHandlerBody(
    {section, parentUuid},
    ['section','parentUuid'],
    [],
    'get',
    url,
    targetStoreController.getInstances.bind(targetStoreController),
    continuationFunction
  )
}


export function postPutDeleteHandler(
  url: string, // log only, to remove?
  method: HttpMethod,
  body: any[],
  localMiroirStoreController: IStoreController,
  localAppStoreController: IStoreController,
  req:any,
  continuationFunction:(arg0: any)=>any
) {
  console.log(method,url, body);
  const deploymentUuid: string =
    typeof req.params["deploymentUuid"] == "string" ? req.params["deploymentUuid"] : req.params["deploymentUuid"][0];

  const section: ApplicationSection =
    (typeof req.params["section"] == "string" ? req.params["section"] : req.params["section"][0]) as ApplicationSection;

  const targetDataStore = deploymentUuid == applicationDeploymentLibrary.uuid?localAppStoreController:localMiroirStoreController;
  
  return generateHandlerBody(
    {section},
    ['section'],
    body,
    method,
    "/miroirWithDeployment/entity/",
    ['post','put'].includes(method)?targetDataStore.upsertInstance.bind(targetDataStore):targetDataStore.deleteInstance.bind(targetDataStore),
    continuationFunction
  )
}
export class RestServerStub {
  public handlers: any[];

  // ##################################################################################
  constructor(
    private rootApiUrl: string,
    private localMiroirStoreController: IStoreController,
    private localAppStoreController: IStoreController,
  ) {
    console.log('RestServerStub constructor rootApiUrl', rootApiUrl, 'localIndexedDbDataStores', localMiroirStoreController, localAppStoreController);

    this.handlers = [
      rest.get(this.rootApiUrl + "/miroirWithDeployment/:deploymentUuid/:section/entity/:parentUuid/all", async (req, res, ctx) => {
        return getHandler(
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
