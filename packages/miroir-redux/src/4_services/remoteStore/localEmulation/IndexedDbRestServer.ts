import {
  DataStoreInterface,
  IndexedDb,
  IndexedDbServer,
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
    this.handlers = [
      rest.get(this.rootApiUrl + "/" + ":entityName/all", async (req, res, ctx) => {
        const entityName: string =
          typeof req.params["entityName"] == "string" ? req.params["entityName"] : req.params["entityName"][0];
        console.log("get", entityName + "/all started get #####################################");
        // const localData = await this.localIndexedDb.getAllValue(entityName);
        // const localData = await indexedDbGetInstances(localIndexedDb, entityName);
        const localData = await localIndexedDbDataStore.getInstances(entityName);
        console.log("server " + entityName + "/all", localData);
        return res(ctx.json(localData));
      }),
      rest.post(this.rootApiUrl + "/" + ":entityName", async (req, res, ctx) => {
        const entityName: string =
          typeof req.params["entityName"] == "string" ? req.params["entityName"] : req.params["entityName"][0];
        console.log("post", entityName + " started post #####################################");

        const addedObjects: any[] = await req.json();
        // const localData = await this.localIndexedDb.putValue(entityName, addedObjects[0]);
        // const localData = await indexedDbUpsertInstance(localIndexedDb, entityName, addedObjects[0]);
        const localData = await localIndexedDbDataStore.upsertInstance(entityName, addedObjects[0]);
        console.log("server " + entityName + "put first object of", addedObjects);
        return res(ctx.json(addedObjects[0]));
      }),
      rest.put(this.rootApiUrl + "/" + ":entityName", async (req, res, ctx) => {
        const entityName: string =
          typeof req.params["entityName"] == "string" ? req.params["entityName"] : req.params["entityName"][0];
        console.log("post", entityName + " started put #####################################");

        const addedObjects: any[] = await req.json();

        // prepare localIndexedDb, in the case we receive a new Entity
        // if (entityName == "Entity") {
        //   localIndexedDb.addSubLevels([entityName]);
        // }

        // const localData = await this.localIndexedDb.putValue(entityName, addedObjects[0]);
        // const localData = await indexedDbUpsertInstance(localIndexedDb, entityName, addedObjects[0]);
        const localData = await localIndexedDbDataStore.upsertInstance(entityName, addedObjects[0]);
        console.log("server " + entityName + "put first object of", addedObjects);
        return res(ctx.json(addedObjects[0]));
      }),
      rest.delete(this.rootApiUrl + "/" + ":entityName", async (req, res, ctx) => {
        const entityName: string =
          typeof req.params["entityName"] == "string" ? req.params["entityName"] : req.params["entityName"][0];
        console.log("delete", entityName + " started #####################################");

        const addedObjects: any[] = await req.json();
        // for (const o of addedObjects) {
        //   const localData = await this.localIndexedDb.deleteValue(entityName, o["uuid"]);
        // }
        // await indexedDbdeleteInstances(localIndexedDb,entityName,addedObjects);
        await localIndexedDbDataStore.deleteInstances(entityName, addedObjects);
        console.log("server " + entityName + "deleted objects of", addedObjects);
        return res(ctx.json(addedObjects.map((o) => o["uuid"])));
      }),
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
