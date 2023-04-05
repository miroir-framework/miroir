import {
  DataStoreInterface,
  generateHandlerBody,
  ModelReplayableUpdate
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
      rest.get(this.rootApiUrl + "/miroir/entity/:entityUuid/all", async (req, res, ctx) => {
        return generateHandlerBody(
          req.params,
          ['entityUuid'],
          [],
          'get',
          "/miroir/entity/",
          localDataStore.getInstancesUuid.bind(localDataStore),
          (localData)=>res(ctx.json(localData))
        )
      }),
      rest.post(this.rootApiUrl + "/miroir/entity", async (req, res, ctx) => {
        console.log('post /miroir/entity', localDataStore);
        
        return generateHandlerBody(
          req.params,
          [],
          await req.json(),
          'post',
          "/miroir/entity/",
          localDataStore.upsertInstanceUuid.bind(localDataStore),
          (localData)=>res(ctx.json(localData))
        )
      }),
      rest.put(this.rootApiUrl + "/miroir/entity", async (req, res, ctx) => {
        console.log('put /miroir/entity', localDataStore);
        return generateHandlerBody(
          req.params,
          [],
          await req.json(),
          'put',
          "/miroir/entity/",
          localDataStore.upsertInstanceUuid.bind(localDataStore),
          (localData)=>res(ctx.json(localData))
        )
      }),
      rest.delete(this.rootApiUrl + "/miroir/entity", async (req, res, ctx) => {
        console.log('delete /miroir/entity', localDataStore);
        return generateHandlerBody(
          req.params,
          [],
          await req.json(),
          'delete',
          "/miroir/entity/",
          localDataStore.deleteInstanceUuid.bind(localDataStore),
          (localData)=>res(ctx.json(localData))
        )
      }),
      // ############################    MODEL      ############################################
      rest.post(this.rootApiUrl + "/model/:actionName", async (req, res, ctx) => {
        console.log("post model/"," started #####################################");
        const actionName: string = typeof req.params["actionName"] == "string" ? req.params["actionName"] : req.params["actionName"][0];
        console.log("post model/ actionName",actionName);

        switch (actionName) {
          case 'resetModel':{
            console.log('resetModel before drop getUuidEntities', localDataStore.getUuidEntities());
            localDataStore.dropUuidEntities(localDataStore.getUuidEntities());
            console.log('resetModel after drop getUuidEntities', localDataStore.getUuidEntities());
            break;
          }
          case 'updateEntity': {
            const update: ModelReplayableUpdate = (await req.json())[0];
            console.log("post model/ updates",update);
            if (update) {
              await localDataStore.applyModelEntityUpdate(update);
              console.log('post applyModelEntityUpdates', update);
            } else {
              console.log('post model/ has no update to execute!')
            }
            break;
          }
          default:
            console.log('post model/ could not handle actionName', actionName)
            break;
        }
      
        return res(ctx.json([]));
      })
    ];
  }
}
