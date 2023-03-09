import {
  RemoteStoreAction,
  RemoteStoreActionName,
  RemoteStoreNetworkClientInterface,
  RestClientCallReturnType,
  RestClientInterface,
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
};

/**
 * Facade / decorator for restClient and GraphQL client.
 * Resolves a DomainCRUDAction into a network query, using the proper protocol / address.
 *
 */
export class RemoteStoreNetworkRestClient implements RemoteStoreNetworkClientInterface {
  constructor(private rootApiUrl: string, private restClient: RestClientInterface) {}

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
    return networkAction['uuid'] ? "/" + networkAction['uuid'] : networkAction.actionName == "read" ? "/all" : "";
  }

  // ##################################################################################
  private networkActionUrlRoot(networkAction: RemoteStoreAction): string {
    return networkAction.actionName == 'resetModel' ? "/model" : "/miroir";
  }

  // ##################################################################################
  private networkActionUrl(networkAction: RemoteStoreAction): string {
    return this.networkActionUrlRoot(networkAction) + "/" + (networkAction.actionName == 'resetModel' ? "" : networkAction.entityName +this.networkActionUrlAddition(networkAction));
  }

  // ##################################################################################
  getRestCallParams(networkAction: RemoteStoreAction): {
    operation: (endpoint: string, customConfig: any) => Promise<RestClientCallReturnType>;
    url: string;
    args: any[];
  } {
    return {
      operation: this.operationMethod[actionHttpMethods[networkAction.actionName]],
      url: this.networkActionUrl(networkAction),
      args: networkAction['objects'] ? networkAction['objects'] : networkAction['actions'],
    };
  }

  // ##################################################################################
  async handleNetworkAction(networkAction: RemoteStoreAction): Promise<RestClientCallReturnType> {
    //TODO: return type must be independent of actually called client
    console.log("RemoteStoreNetworkRestClient handleAction", networkAction);
    const callParams = this.getRestCallParams(networkAction);
    return callParams.operation(callParams.url, callParams.args);
  }
}

export default RemoteStoreNetworkRestClient;
