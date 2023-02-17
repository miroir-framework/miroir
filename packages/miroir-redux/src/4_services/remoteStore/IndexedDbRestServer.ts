import {
  DefaultBodyType,
  MockedRequest,
  Path,
  PathParams,
  ResponseResolver,
  rest,
  RestContext,
  RestHandler,
  RestRequest,
} from "msw";
import { IndexedDb } from "src/4_services/remoteStore/indexedDb";
import { HttpMethods } from "src/4_services/remoteStore/RemoteStoreNetworkRestClient";

// Add an extra delay to all endpoints, so loading spinners show up.
const ARTIFICIAL_DELAY_MS = 100;

const serializePost = (post: any) => ({
  ...post,
  user: post.user.id,
});

export class IndexedDbRestServer {
  public handlers: any[];
  // private operationMap: Map<>

  // ##################################################################################
  private operationMethod: {
    [P in HttpMethods]: <
      RequestBodyType_2 extends DefaultBodyType = DefaultBodyType,
      Params_2 extends PathParams<keyof Params_2> = PathParams<string>,
      ResponseBody_2 extends DefaultBodyType = DefaultBodyType
    >(
      path: Path,
      resolver: ResponseResolver<RestRequest<never, Params_2>, RestContext, ResponseBody_2>
    ) => RestHandler<MockedRequest<DefaultBodyType>>;
  } = {
    get: rest.get,
    post: rest.post,
    put: rest.put,
    delete: rest.delete,
  };

  // ##################################################################################
  constructor(private rootApiUrl: string, public localIndexedDb: IndexedDb = new IndexedDb("miroir")) {
    this.handlers = [
      rest.get(this.rootApiUrl + "/" + ":entityName/all", async (req, res, ctx) => {
        
        const entityName:string = typeof req.params['entityName'] == 'string'?req.params['entityName']:req.params['entityName'][0];
        console.log('get', entityName+"/all started get #####################################");
        // const localData = await this.localIndexedDb.getAllValue("Entity");
        const localData = await this.localIndexedDb.getAllValue(entityName);
        console.log("server " + entityName + "/all", localData);
        return res(ctx.json(localData));
      }),
      rest.post(this.rootApiUrl + "/" + ":entityName", async (req, res, ctx) => {
        const entityName:string = typeof req.params['entityName'] == 'string'?req.params['entityName']:req.params['entityName'][0];
        console.log('post', entityName+" started post #####################################");
        
        const addedObjects:any[] = await req.json();
        // const localData = await this.localIndexedDb.getAllValue("Entity");
        const localData = await this.localIndexedDb.putValue(entityName,addedObjects[0]);
        console.log("server " + entityName + "put first object of", addedObjects);
        return res(ctx.json(addedObjects[0]));
      }),
      rest.put(this.rootApiUrl + "/" + ":entityName", async (req, res, ctx) => {
        const entityName:string = typeof req.params['entityName'] == 'string'?req.params['entityName']:req.params['entityName'][0];
        console.log('post', entityName+" started put #####################################");
        
        const addedObjects:any[] = await req.json();
        // const localData = await this.localIndexedDb.getAllValue("Entity");
        const localData = await this.localIndexedDb.putValue(entityName,addedObjects[0]);
        console.log("server " + entityName + "put first object of", addedObjects);
        return res(ctx.json(addedObjects[0]));
      }),
      // rest.get(this.rootApiUrl + "/" + "Report/all", async (req, res, ctx) => {
      //   const localData = await this.localIndexedDb.getAllValue("Report");
      //   return res(ctx.delay(ARTIFICIAL_DELAY_MS), ctx.json(localData));
      // }),
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
}
