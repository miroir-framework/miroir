import {
  RemoteStoreAction,
  RemoteStoreActionName,
  RemoteStoreNetworkClientInterface,
  RestClientCallReturnType,
  RestClientInterface,
} from "miroir-core";

export const HttpMethodsObject = {
  'post': 'post',
  'put': 'put',
  'get': 'get',
  'delete': 'delete',
}
export type HttpMethods = keyof typeof HttpMethodsObject;
export const HttpMethodsArray:HttpMethods[] = Object.keys(HttpMethodsObject) as HttpMethods[];


// export declare type HttpMethods= 'post' | 'put' | 'get' | 'delete';

export const actionHttpMethods: {[P in RemoteStoreActionName]:HttpMethods} = {
  'create': 'post',
  'read': 'get',
  'update': 'put',
  'delete': 'delete',
}

/**
 * Facade / decorator for restClient and GraphQL client.
 * Resolves a DomainAction into a network query, using the proper protocol / address.
 *
 */ 
export class RemoteStoreNetworkRestClient implements RemoteStoreNetworkClientInterface {
  constructor(
    private rootApiUrl: string,
    private restClient: RestClientInterface
  ) {}

  // ##################################################################################
  private operationMethod:{[P in HttpMethods]:(endpoint: string, customConfig: any)=> Promise<RestClientCallReturnType>}= {
    'get': this.restClient.get.bind(this.restClient),
    'post': this.restClient.post.bind(this.restClient),
    'put': this.restClient.put.bind(this.restClient),
    'delete': this.restClient.delete.bind(this.restClient),
  }

  // ##################################################################################
  private networkActionUrlAddition(networkAction: RemoteStoreAction):string {
    return networkAction.uuid?'/'+networkAction.uuid:(networkAction.actionName == 'read'?'/all':'');
  }

  // ##################################################################################
  getCallParams(networkAction: RemoteStoreAction):{
    operation:(endpoint: string, customConfig: any)=> Promise<RestClientCallReturnType>,url:string,args:any[]} {
      return {
        // operation:this.post.bind(this),
        // operation:this.operationMethod[this.operationMap.get(networkAction.actionName)],
        operation:this.operationMethod[actionHttpMethods[networkAction.actionName]],
        url:this.rootApiUrl + "/" + networkAction.entityName + this.networkActionUrlAddition(networkAction),
        args:networkAction.objects?networkAction.objects:[],
      }
    // return networkAction.actionName == 'read'? {
    //   // operation:this.get.bind(this),
    //   // operation:this.operationMethod[this.operationMap.get(networkAction.actionName)],
    //   operation:this.operationMethod[actionHttpMethods[networkAction.actionName]],
    //   url:this.rootApiUrl + "/" + networkAction.entityName + "/all",
    //   args:[]
    // }:{
    //   // operation:this.post.bind(this),
    //   // operation:this.operationMethod[this.operationMap.get(networkAction.actionName)],
    //   operation:this.operationMethod[actionHttpMethods[networkAction.actionName]],
    //   url:this.rootApiUrl + "/" + networkAction.entityName,
    //   args:[]
    // }
  }

  // ##################################################################################
  async handleNetworkAction(networkAction: RemoteStoreAction): Promise<RestClientCallReturnType> {
    //TODO: return type must be independent of actually called client
    console.log("RemoteStoreNetworkRestClient handleAction", networkAction);
    // if (networkAction.actionName === "read") {
      // return this.get(this.rootApiUrl + "/" + networkAction.entityName + "/all")
      const callParams = this.getCallParams(networkAction);
      return callParams.operation(callParams.url, callParams.args)
    // } else {
    //   throw new Error(
    //     "RemoteStoreNetworkRestClient handleNetworkAction does not know how to handle action in networkAction " +
    //       JSON.stringify(networkAction)
    //   );
    // }
  }

  // // ##################################################################################
  // async get(endpoint: string, customConfig: any = {}): Promise<RestClientCallReturnType> {
  //   console.log("RemoteStoreNetworkRestClient get", endpoint);
  //   return this.restClient.get(endpoint, customConfig);
  // }

  // // ##################################################################################
  // async post(endpoint: string, body: any, customConfig = {}): Promise<RestClientCallReturnType> {
  //   return this.restClient.post(endpoint, customConfig);
  // }

  // dtc(){};

}

export default RemoteStoreNetworkRestClient;
