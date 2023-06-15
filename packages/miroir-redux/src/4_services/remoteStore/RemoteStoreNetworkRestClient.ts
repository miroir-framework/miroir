import {
  ApplicationSection,
  CRUDActionNamesArrayString,
  HttpMethod,
  RemoteStoreAction,
  RemoteStoreActionName,
  RemoteStoreNetworkClientInterface,
  RestClientCallReturnType,
  RestClientInterface,
} from "miroir-core";



// export const actionHttpMethods: {[P in CRUDActionName]:HttpMethod} = {
export const actionHttpMethods: { [P in RemoteStoreActionName]: HttpMethod } = {
  create: "post",
  read: "get",
  update: "put",
  delete: "delete",
  resetModel: "post",
  resetData: "post",
  initModel: "post",
  updateEntity: "post",
};

/**
 * Facade / decorator for restClient and GraphQL client.
 * Resolves a DomainDataAction into a network query, using the proper protocol / address.
 *
 */
export class RemoteStoreNetworkRestClient implements RemoteStoreNetworkClientInterface {
  constructor(private rootApiUrl: string, private restClient: RestClientInterface) {
    console.log("RemoteStoreNetworkRestClient rootApiUrl", rootApiUrl);
  }

  // ##################################################################################
  private operationMethod: {
    [P in HttpMethod]: (endpoint: string, customConfig: any) => Promise<RestClientCallReturnType>;
  } = {
    get: this.restClient.get.bind(this.restClient),
    post: this.restClient.post.bind(this.restClient),
    put: this.restClient.put.bind(this.restClient),
    delete: this.restClient.delete.bind(this.restClient),
  };

  // ##################################################################################
  private networkActionUrlAddition(networkAction: RemoteStoreAction): string {
    return (networkAction as any)["uuid"]
      ? (networkAction as any)["uuid"]
      : networkAction.actionName == "read"
      ? networkAction.parentUuid + "/all"
      : "";
  }

  // ##################################################################################
  private networkActionUrlRoot(networkAction: RemoteStoreAction, useUuidForEntity: string | undefined = undefined): string {
    return (
      this.rootApiUrl +
      (CRUDActionNamesArrayString.includes(networkAction.actionName)
        ? "/miroir/entity"
        : "/model/" + networkAction.actionName)
    );
  }

  // ##################################################################################
  private networkActionUrl(networkAction: RemoteStoreAction, rootApiUrl?: string): string {
    return (
      (rootApiUrl ? rootApiUrl : this.networkActionUrlRoot(networkAction)) +
      (CRUDActionNamesArrayString.includes(networkAction.actionName)
        ? (this.networkActionUrlAddition(networkAction)?"/" + this.networkActionUrlAddition(networkAction) : "")
        : "")
    );
  }

  // ##################################################################################
  getRestCallParams(
    networkAction: RemoteStoreAction,
    rootApiUrl?: string
  ): {
    operation: (endpoint: string, customConfig: any) => Promise<RestClientCallReturnType>;
    url: string;
    args: any[];
  } {
    return {
      operation: (this.operationMethod as any)[(actionHttpMethods as any)[networkAction.actionName]],
      url: this.networkActionUrl(networkAction, rootApiUrl),
      // args: []
      args: ["RemoteStoreCRUDAction", "RemoteStoreCRUDActionWithDeployment"].includes(networkAction.actionType)
        ? (networkAction as any)["objects"]
        : ["DomainTransactionalAction", "DomainModelActionWithDeployment"].includes(networkAction.actionType)
        ? (networkAction as any)["update"]?[(networkAction as any)["update"]]:(networkAction as any)["params"]
        : [],
    };
  }

  // ##################################################################################
  async handleNetworkAction(networkAction: RemoteStoreAction): Promise<RestClientCallReturnType> {
    //TODO: return type must be independent of actually called client
    const callParams = this.getRestCallParams(networkAction);
    console.log("RemoteStoreNetworkRestClient handleAction", networkAction, "callParams", callParams);
    return callParams.operation(callParams.url, callParams.args);
  }

  async handleNetworkRemoteStoreCRUDActionWithDeployment(deploymentUuid:string, section: ApplicationSection, action: RemoteStoreAction): Promise<RestClientCallReturnType> {
    const callParams = this.getRestCallParams(action, this.rootApiUrl + "/miroirWithDeployment/" + deploymentUuid + "/" + section +"/entity");
    console.log("RemoteStoreNetworkRestClient handleNetworkRemoteStoreCRUDActionWithDeployment", action, deploymentUuid, section,"callParams", callParams);
    return callParams.operation(callParams.url, callParams.args);
  }

  async handleNetworkRemoteStoreModelActionWithDeployment(deploymentUuid:string, action: RemoteStoreAction): Promise<RestClientCallReturnType> {
    const callParams = this.getRestCallParams(action, this.rootApiUrl + "/modelWithDeployment/" + deploymentUuid + "/" + action.actionName);
    console.log("RemoteStoreNetworkRestClient handleNetworkRemoteStoreModelActionWithDeployment", action, "callParams", callParams);
    return callParams.operation(callParams.url, callParams.args);
  }
}

export default RemoteStoreNetworkRestClient;
