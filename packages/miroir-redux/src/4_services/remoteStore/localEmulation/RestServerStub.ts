import {
  DataStoreInterface,
  generateHandlerBody, ModelStructureUpdate, ModelUpdateWithCUDUpdate
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
  // private operationMap: Map<>

  // // ##################################################################################
  // private operationMethod: {
  //   [P in HttpMethod]: <
  //     RequestBodyType_2 extends DefaultBodyType = DefaultBodyType,
  //     Params_2 extends PathParams<keyof Params_2> = PathParams<string>,
  //     ResponseBody_2 extends DefaultBodyType = DefaultBodyType
  //   >(
  //     path: Path,
  //     resolver: ResponseResolver<RestRequest<never, Params_2>, RestContext, ResponseBody_2>
  //   ) => RestHandler<MockedRequest<DefaultBodyType>>;
  // } = {
  //   get: rest.get,
  //   post: rest.post,
  //   put: rest.put,
  //   delete: rest.delete,
  // };

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
        const actionName: string =
        typeof req.params["actionName"] == "string" ? req.params["actionName"] : req.params["actionName"][0];
        console.log("post model/ actionName",actionName);

        switch (actionName) {
          case 'resetModel':{
            console.log('resetModel before drop getUuidEntities', localDataStore.getUuidEntities());
            localDataStore.dropUuidEntities(localDataStore.getUuidEntities());
            console.log('resetModel after drop getUuidEntities', localDataStore.getUuidEntities());
            break;
          }
          case 'updateModel': {
            const update: ModelUpdateWithCUDUpdate = await req.json();
            console.log("post model/ updates",update);
            if (update) {
              switch (update['action']) {
                default:
                  await localDataStore.applyModelStructureUpdate(update);
                  console.log('post applyModelStructureUpdates', update);
                  break;
              }
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


  
  // ##################################################################################
  // public getLocalUuidIndexedDb():IndexedDb {
  //   return this.localUuidIndexedDb;
  // }
  
  // ##################################################################################
  // public getLocalIndexedDbDataStore():DataStoreInterface {
  //   return this.localIndexedDbDataStore;
  // }

  // // ##################################################################################
  // public async createObjectStore(tableNames: string[]) {
  //   return this.localUuidIndexedDb.createObjectStore(tableNames);
  // }

  // // ##################################################################################
  // public async closeObjectStore() {
  //   return this.localUuidIndexedDb.closeObjectStore();
  // }

  // // ##################################################################################
  // public async openObjectStore() {
  //   return this.localUuidIndexedDb.openObjectStore();
  // }

  // // ##################################################################################
  // public async clearObjectStore() {
  //   return this.localUuidIndexedDb.clearObjectStore();
  // }
}
