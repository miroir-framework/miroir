import {
  DataStoreInterface,
  generateHandlerBody,
  ModelReplayableUpdate,
  modelUpdateRunner
} from "miroir-core";
import { rest } from "msw";

// Add an extra delay to all endpoints, so loading spinners show up.
const ARTIFICIAL_DELAY_MS = 100;

const serializePost = (post: any) => ({
  ...post,
  user: post.user.id,
});

export class RestServerStub {
  public handlers: any[];

  // ##################################################################################
  constructor(
    private rootApiUrl: string,
    private localDataStore: DataStoreInterface
  ) {
    console.log('RestServerStub constructor rootApiUrl', rootApiUrl, 'localIndexedDbDataStore', localDataStore);

    
    this.handlers = [
      rest.get(this.rootApiUrl + "/miroir/entity/:parentUuid/all", async (req, res, ctx) => {
        return generateHandlerBody(
          req.params,
          ['parentUuid'],
          [],
          'get',
          "/miroir/entity/",
          localDataStore.getInstances.bind(localDataStore),
          (localData)=>res(ctx.json(localData))
        )
      }),
      rest.post(this.rootApiUrl + "/miroir/entity", async (req, res, ctx) => {
        const body = await req.json();
        console.log('post /miroir/entity', body);
        
        return generateHandlerBody(
          req.params,
          [],
          body,
          'post',
          "/miroir/entity/",
          localDataStore.upsertInstance.bind(localDataStore),
          (localData)=>res(ctx.json(localData))
        )
      }),
      rest.put(this.rootApiUrl + "/miroir/entity", async (req, res, ctx) => {
        const body = await req.json();
        console.log('put /miroir/entity', body);
        return generateHandlerBody(
          req.params,
          [],
          body,
          'put',
          "/miroir/entity/",
          localDataStore.upsertInstance.bind(localDataStore),
          (localData)=>res(ctx.json(localData))
        )
      }),
      rest.delete(this.rootApiUrl + "/miroir/entity", async (req, res, ctx) => {
        const body = await req.json();
        console.log('delete /miroir/entity', localDataStore);
        return generateHandlerBody(
          req.params,
          [],
          body,
          'delete',
          "/miroir/entity/",
          localDataStore.deleteInstance.bind(localDataStore),
          (localData)=>res(ctx.json(localData))
        )
      }),
      // ############################    MODEL      ############################################
      rest.post(this.rootApiUrl + "/model/:actionName", async (req, res, ctx) => {
        console.log("post model/"," started #####################################");
        const actionName: string = typeof req.params["actionName"] == "string" ? req.params["actionName"] : req.params["actionName"][0];
        console.log("post model/ actionName",actionName);
        let update = [];
        try {
          update = await req.json();
        } catch(e){}

        await modelUpdateRunner(
          actionName,
          localDataStore,
          update
        );
      
        // switch (actionName) {
        //   case 'resetModel':{
        //     console.log('resetModel before drop getEntityDefinitions', localDataStore.getEntityDefinitions());
        //     localDataStore.dropEntities(localDataStore.getEntityDefinitions());
        //     console.log('resetModel after drop getEntityDefinitions', localDataStore.getEntityDefinitions());
        //     break;
        //   }
        //   case 'initModel':{
        //     const update = (await req.body)[0];
        //     console.log("server post model/initModel update",update);
        //     await localDataStore.initModel();
        //     console.log('server post resetModel after initModel, entities:',localDataStore.getEntities(),'entityDefinitions:',localDataStore.getEntityDefinitions());
        //     break;
        //   }
        //   case 'updateEntity': {
        //     const update: ModelReplayableUpdate = (await req.json())[0];
        //     console.log("post model/ updates",update);
        //     if (update) {
        //       await localDataStore.applyModelEntityUpdate(update);
        //       console.log('post applyModelEntityUpdates', update);
        //     } else {
        //       console.log('post model/ has no update to execute!')
        //     }
        //     break;
        //   }
        //   default:
        //     console.log('post model/ could not handle actionName', actionName)
        //     break;
        // }
      
        return res(ctx.json([]));
      })
    ];
  }
}
