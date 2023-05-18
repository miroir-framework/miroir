import { ApplicationDeployment } from "../0_interfaces/1_core/StorageConfiguration.js";
import { StoreFacadeInterface } from "../0_interfaces/4-services/remoteStore/RemoteDataStoreInterface";
import { modelActionRunner } from "../3_controllers/ModelActionRunner";
import { generateHandlerBody } from "../4_services/RestTools";
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

export class RestServerStub {
  public handlers: any[];

  // ##################################################################################
  constructor(
    private rootApiUrl: string,
    private localMiroirDataStore: StoreFacadeInterface,
    private localAppDataStore: StoreFacadeInterface,
  ) {
    console.log('RestServerStub constructor rootApiUrl', rootApiUrl, 'localIndexedDbDataStores', localMiroirDataStore, localAppDataStore);

    
    this.handlers = [
      rest.get(this.rootApiUrl + "/miroirWithDeployment/:deploymentUuid/entity/:parentUuid/all", async (req, res, ctx) => {

        const deploymentUuid: string =
        typeof req.params["deploymentUuid"] == "string" ? req.params["deploymentUuid"] : req.params["deploymentUuid"][0];
      
        const parentUuid: string =
        typeof req.params["parentUuid"] == "string" ? req.params["parentUuid"] : req.params["parentUuid"][0];
      
        const targetDataStore = deploymentUuid == applicationDeploymentLibrary.uuid?localAppDataStore:localMiroirDataStore;
        // const targetProxy = deploymentUuid == applicationDeploymentLibrary.uuid?libraryAppFileSystemDataStore:miroirAppSqlServerProxy;
        console.log("RestServerStub get miroirWithDeployment/ using application",targetDataStore['applicationName'], "deployment",deploymentUuid,'applicationDeploymentLibrary.uuid',applicationDeploymentLibrary.uuid);
      
        return generateHandlerBody(
          {parentUuid},
          ['parentUuid'],
          [],
          'get',
          "/miroir/entity/",
          targetDataStore.getInstances.bind(targetDataStore),
          (localData)=>res(ctx.json(localData))
        )
      }),
      rest.post(this.rootApiUrl + "/miroirWithDeployment/:deploymentUuid/entity", async (req, res, ctx) => {
        const body = await req.json();
        console.log('post /miroirWithDeployment/entity', body);
        const deploymentUuid: string =
          typeof req.params["deploymentUuid"] == "string" ? req.params["deploymentUuid"] : req.params["deploymentUuid"][0];
      
        const targetDataStore = deploymentUuid == applicationDeploymentLibrary.uuid?localAppDataStore:localMiroirDataStore;
        
        return generateHandlerBody(
          {},
          [],
          body,
          'post',
          "/miroirWithDeployment/entity/",
          targetDataStore.upsertDataInstance.bind(targetDataStore),
          (localData)=>res(ctx.json(localData))
        )
      }),
      rest.put(this.rootApiUrl + "/miroirWithDeployment/:deploymentUuid/entity", async (req, res, ctx) => {
        const body = await req.json();
        console.log('put /miroir/entity', body);
        const deploymentUuid: string =
          typeof req.params["deploymentUuid"] == "string" ? req.params["deploymentUuid"] : req.params["deploymentUuid"][0];
      
        const targetDataStore = deploymentUuid == applicationDeploymentLibrary.uuid?localAppDataStore:localMiroirDataStore;

        return generateHandlerBody(
          {},
          [],
          body,
          'put',
          "/miroirWithDeployment/entity/",
          targetDataStore.upsertDataInstance.bind(targetDataStore),
          (localData)=>res(ctx.json(localData))
        )
      }),
      rest.delete(this.rootApiUrl + "/miroirWithDeployment/:deploymentUuid/entity", async (req, res, ctx) => {
        const body = await req.json();
        console.log('delete /miroir/entity', localMiroirDataStore);
        const deploymentUuid: string =
          typeof req.params["deploymentUuid"] == "string" ? req.params["deploymentUuid"] : req.params["deploymentUuid"][0];
      
        const targetDataStore = deploymentUuid == applicationDeploymentLibrary.uuid?localAppDataStore:localMiroirDataStore;

        return generateHandlerBody(
          {},
          [],
          body,
          'delete',
          "/miroirWithDeployment/entity/",
          targetDataStore.deleteDataInstance.bind(targetDataStore),
          (localData)=>res(ctx.json(localData))
        )
      }),
      // ############################    MODEL      ############################################
      rest.post(this.rootApiUrl + "/modelWithDeployment/:deploymentUuid/:actionName", async (req, res, ctx) => {
        console.log("post model/"," started #####################################");
        const actionName: string = typeof req.params["actionName"] == "string" ? req.params["actionName"] : req.params["actionName"][0];

        const deploymentUuid: string =
          typeof req.params["deploymentUuid"] == "string" ? req.params["deploymentUuid"] : req.params["deploymentUuid"][0];
      
        const targetDataStore = deploymentUuid == applicationDeploymentLibrary.uuid?localAppDataStore:localMiroirDataStore;
        console.log("post model/ actionName",actionName);
        let update = [];
        try {
          update = await req.json();
        } catch(e){}

        await modelActionRunner(
          deploymentUuid,
          actionName,
          localMiroirDataStore,
          localAppDataStore,
          update
        );
      
        return res(ctx.json([]));
      })
    ];
  }
}
