import {
  CRUDActionNamesArray,
  CRUDActionNamesArrayString, RemoteStoreAction,
  RemoteStoreActionName,
  RemoteStoreCRUDAction,
  RemoteStoreModelAction,
  RemoteStoreNetworkClientInterface,
  RestClientCallReturnType,
  RestClientInterface
} from "miroir-core";

export const HttpMethodsObject = {
  post: "post",
  put: "put",
  get: "get",
  delete: "delete",
};
export type HttpMethods = keyof typeof HttpMethodsObject;
export const HttpMethodsArray: HttpMethods[] = Object.keys(HttpMethodsObject) as HttpMethods[];

// export const actionHttpMethods: {[P in CRUDActionName]:HttpMethods} = {
export const actionHttpMethods: { [P in RemoteStoreActionName]: HttpMethods } = {
  create: "post",
  read: "get",
  update: "put",
  delete: "delete",
  resetModel: "post",
  updateModel: "post",
};

/**
 * Facade / decorator for restClient and GraphQL client.
 * Resolves a DomainDataAction into a network query, using the proper protocol / address.
 *
 */
export class RemoteStoreNetworkRestClient implements RemoteStoreNetworkClientInterface {
  constructor(
    private rootApiUrl: string, 
    private restClient: RestClientInterface
  ) {
    console.log('RemoteStoreNetworkRestClient rootApiUrl',rootApiUrl);
    
  }

  // ##################################################################################
  private operationMethod: {
    [P in HttpMethods]: (endpoint: string, customConfig: any) => Promise<RestClientCallReturnType>;
  } = {
    get: this.restClient.get.bind(this.restClient),
    post: this.restClient.post.bind(this.restClient),
    put: this.restClient.put.bind(this.restClient),
    delete: this.restClient.delete.bind(this.restClient),
  };

  // ##################################################################################
  private networkActionUrlAddition(networkAction: RemoteStoreAction): string {
    return networkAction['uuid'] ? networkAction['uuid'] : (networkAction.actionName == "read" ? networkAction.entityUuid+"/all" : "");
  }

  // ##################################################################################
  private networkActionUrlRoot(
    networkAction: RemoteStoreAction,
    useUuidForEntity:string = undefined,
  ): string {
    // return networkAction.actionName == 'resetModel' ? "/model" : "/miroir";
    // return ModelStructureUpdateActionNamesArrayString.includes(networkAction.actionName) ? "/model" : "/miroir";
    return (
      this.rootApiUrl +
      (CRUDActionNamesArrayString.includes(networkAction.actionName)
        ? "/miroir/entity"
        : "/model/" + networkAction.actionName)
    );
  }

  // ##################################################################################
  private networkActionUrl(
    networkAction: RemoteStoreAction,
    rootApiUrl?:string,
  ): string {
    return (
      (rootApiUrl?rootApiUrl:this.networkActionUrlRoot(networkAction)) +
      (
        CRUDActionNamesArrayString.includes(networkAction.actionName)
          ? ("/" + this.networkActionUrlAddition(networkAction))
          : ""
      )
    );
  }

  // ##################################################################################
  getRestCallParams(
    networkAction: RemoteStoreAction,
    rootApiUrl?:string,
  ): {
    operation: (endpoint: string, customConfig: any) => Promise<RestClientCallReturnType>;
    url: string;
    args: any[];
  } {
    return {
      operation: this.operationMethod[actionHttpMethods[networkAction.actionName]],
      url: this.networkActionUrl(networkAction,rootApiUrl),
      args: networkAction['objects'] ? networkAction['objects'] : networkAction['updates'],
    };
  }

  // ##################################################################################
  async handleNetworkAction(networkAction: RemoteStoreAction): Promise<RestClientCallReturnType> {
    //TODO: return type must be independent of actually called client
    const callParams = this.getRestCallParams(networkAction);
    console.log("RemoteStoreNetworkRestClient handleAction", networkAction, 'callParams', callParams);
    return callParams.operation(callParams.url, callParams.args);
  }
  async handleNetworkRemoteStoreCRUDAction(action:RemoteStoreAction):Promise<RestClientCallReturnType>{
    const callParams = this.getRestCallParams(action, this.rootApiUrl + "/miroir/entity");
    console.log("RemoteStoreNetworkRestClient handleRemoteStoreCRUDAction", action, 'callParams', callParams);
    return callParams.operation(callParams.url, callParams.args);

  }
  async handleNetworkRemoteStoreModelAction(action:RemoteStoreAction):Promise<RestClientCallReturnType>{
    const callParams = this.getRestCallParams(action, this.rootApiUrl + '/model/' + action.actionName);
    console.log("RemoteStoreNetworkRestClient handleRemoteStoreModelAction", action, 'callParams', callParams);
    return callParams.operation(callParams.url, callParams.args);
  }
}

export default RemoteStoreNetworkRestClient;
