import {
  DataStoreInterface,
  IndexedDb,
  IndexedDbServer,
  RemoteStoreModelAction,
} from "miroir-core";
import { rest } from "msw";

// Add an extra delay to all endpoints, so loading spinners show up.
const ARTIFICIAL_DELAY_MS = 100;

const serializePost = (post: any) => ({
  ...post,
  user: post.user.id,
});

export class IndexedDbRestServer {
  public handlers: any[];
  // private operationMap: Map<>

  // // ##################################################################################
  // private operationMethod: {
  //   [P in HttpMethods]: <
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
    private localIndexedDb: IndexedDb = new IndexedDb("miroir"),
    private localIndexedDbDataStore: DataStoreInterface = new IndexedDbServer(localIndexedDb)
  ) {
    console.log('IndexedDbRestServer rootApiUrl', rootApiUrl);
    
    this.handlers = [
      rest.get(this.rootApiUrl + "/miroir/" + ":entityName/all", async (req, res, ctx) => {
        const entityName: string =
          typeof req.params["entityName"] == "string" ? req.params["entityName"] : req.params["entityName"][0];
        console.log("get", entityName + "/all started get #####################################");
        // const localData = await this.localIndexedDb.getAllValue(entityName);
        // const localData = await indexedDbGetInstances(localIndexedDb, entityName);
        const localData = await localIndexedDbDataStore.getInstances(entityName);
        console.log("server " + entityName + "/all", localData);
        return res(ctx.json(localData));
      }),
      rest.post(this.rootApiUrl + "/miroir/" + ":entityName", async (req, res, ctx) => {
        const entityName: string =
          typeof req.params["entityName"] == "string" ? req.params["entityName"] : req.params["entityName"][0];
        console.log("post", entityName + " started post #####################################");

        const addedObjects: any[] = await req.json();
        for (const addedObject of addedObjects) {
          await localIndexedDbDataStore.upsertInstance(entityName, addedObject);
        }
        console.log("server POST",entityName,"put objects of", addedObjects);
        return res(ctx.json(addedObjects));
      }),
      rest.put(this.rootApiUrl + "/miroir/" + ":entityName", async (req, res, ctx) => {
        const entityName: string =
          typeof req.params["entityName"] == "string" ? req.params["entityName"] : req.params["entityName"][0];
        console.log("post", entityName + " started put #####################################");

        const addedObjects: any[] = await req.json();

        for (const addedObject of addedObjects) {
          await localIndexedDbDataStore.upsertInstance(entityName, addedObject);
        }
        console.log("server PUT", entityName, "put objects of", addedObjects);
        return res(ctx.json(addedObjects));
      }),
      rest.delete(this.rootApiUrl + "/miroir/" + ":entityName", async (req, res, ctx) => {
        const entityName: string =
          typeof req.params["entityName"] == "string" ? req.params["entityName"] : req.params["entityName"][0];
        console.log("delete", entityName + " started #####################################");

        const addedObjects: any[] = await req.json();
        await localIndexedDbDataStore.deleteInstances(entityName, addedObjects);
        console.log("server " + entityName + "deleted objects of", addedObjects);
        return res(ctx.json(addedObjects.map((o) => o["uuid"])));
      }),
      // ##############################################################################################
      rest.post(this.rootApiUrl + "/model/", async (req, res, ctx) => {
        
        const updates: RemoteStoreModelAction[] = await req.json();
        console.log("post model/"," started #####################################");
        console.log("post model/ updates",updates);

        return res(ctx.json([]));
      })
    ];
  }

  // ##################################################################################
  public async createObjectStore(tableNames: string[]) {
    return this.localIndexedDb.createObjectStore(tableNames);
  }

  // ##################################################################################
  public async closeObjectStore() {
    return this.localIndexedDb.closeObjectStore();
  }

  // ##################################################################################
  public async openObjectStore() {
    return this.localIndexedDb.openObjectStore();
  }

  // ##################################################################################
  public async clearObjectStore() {
    return this.localIndexedDb.clearObjectStore();
  }
}
