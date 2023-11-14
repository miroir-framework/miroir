import {
  ApplicationSection,
  CRUDActionNamesArrayString,
  HttpMethod,
  LoggerInterface,
  MiroirLoggerFactory,
  RemoteStoreAction,
  RemoteStoreActionName,
  RemoteStoreNetworkClientInterface,
  RestClientCallReturnType,
  RestClientInterface,
  getLoggerName,
} from "miroir-core";
import { packageName } from "../../constants";
import { cleanLevel } from "../constants";



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

const loggerName: string = getLoggerName(packageName, cleanLevel,"RemoteStoreNetworkRestClient");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
  (value: LoggerInterface) => {
    log = value;
  }
);
/**
 * Facade / decorator for restClient and GraphQL client.
 * Resolves a DomainDataAction into a network query, using the proper protocol / address.
 *
 */
export class RemoteStoreNetworkRestClient implements RemoteStoreNetworkClientInterface {
  constructor(private rootApiUrl: string, private restClient: RestClientInterface) {
    log.info("RemoteStoreNetworkRestClient rootApiUrl", rootApiUrl);
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
  private networkActionUrlRoot(
    networkAction: RemoteStoreAction,
    useUuidForEntity: string | undefined = undefined
  ): string {
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
        ? this.networkActionUrlAddition(networkAction)
          ? "/" + this.networkActionUrlAddition(networkAction)
          : ""
        : "")
    );
  }

  private actionTypeArgsMap: {[k:string]:{[l:string]: {"attribute":string,"result": string} | undefined}} = {
    "RemoteStoreCRUDAction": {"*": {attribute: "objects", result: "crudInstances"}},
    // "RemoteStoreCRUDActionWithDeployment": {"*": "objects"},
    "DomainTransactionalAction": {
      "UpdateMetaModelInstance": {attribute: "update", result: "modelUpdate"},
      "updateEntity": {attribute: "update", result: "modelUpdate"},
      "commit": undefined,
      "initModel": {attribute: "params", result: "modelUpdate"},
      "redo": undefined,
      "replaceLocalCache": undefined, // local action, not sent on the network
      "resetModel": undefined,
      "resetData": undefined,
      "rollback": undefined,
      "undo": undefined,
    },
  }

  // ##################################################################################
  getRestCallParams(
    networkAction: RemoteStoreAction,
    rootApiUrl?: string
  ): {
    operation: (endpoint: string, customConfig: any) => Promise<RestClientCallReturnType>;
    url: string;
    args: any;
  } {
    return {
      operation: (this.operationMethod as any)[(actionHttpMethods as any)[networkAction.actionName]],
      url: this.networkActionUrl(networkAction, rootApiUrl),
      args: this.actionTypeArgsMap[networkAction.actionType]
        ? this.actionTypeArgsMap[networkAction.actionType]["*"]
          ? {
              [this.actionTypeArgsMap[networkAction.actionType]["*"]?.result ?? "ERROR"]: (networkAction as any)[
                this.actionTypeArgsMap[networkAction.actionType]["*"]?.attribute ?? "ERROR"
              ],
            }
          : this.actionTypeArgsMap[networkAction.actionType][networkAction.actionName]
          ? {
              [this.actionTypeArgsMap[networkAction.actionType][networkAction.actionName]?.result ?? "ERROR"]: (
                networkAction as any
              )[this.actionTypeArgsMap[networkAction.actionType][networkAction.actionName]?.attribute ?? "ERROR"],
            }
          : {}
        : {},
    };
  }

  // ##################################################################################
  async handleNetworkAction(networkAction: RemoteStoreAction): Promise<RestClientCallReturnType> {
    //TODO: return type must be independent of actually called client
    const callParams = this.getRestCallParams(networkAction);
    // log.info("RemoteStoreNetworkRestClient handleAction", networkAction, "callParams", callParams);
    return callParams.operation(callParams.url, callParams.args);
  }

  // ##################################################################################
  async handleNetworkRemoteStoreCRUDActionWithDeployment(
    deploymentUuid: string,
    section: ApplicationSection,
    action: RemoteStoreAction
  ): Promise<RestClientCallReturnType> {
    const callParams = this.getRestCallParams(
      action,
      this.rootApiUrl + "/miroirWithDeployment/" + deploymentUuid + "/" + section + "/entity"
    );
    // const args = 
    log.info(
      "RemoteStoreNetworkRestClient handleNetworkRemoteStoreCRUDActionWithDeployment action",
      action,
      "deploymentUuid",
      deploymentUuid,
      "section",
      section,
      "callParams",
      callParams
    );
    return callParams.operation(callParams.url, callParams.args);
  }

  // ##################################################################################
  async handleNetworkRemoteStoreModelActionWithDeployment(
    deploymentUuid: string,
    action: RemoteStoreAction
  ): Promise<RestClientCallReturnType> {
    const callParams = this.getRestCallParams(
      action,
      this.rootApiUrl + "/modelWithDeployment/" + deploymentUuid + "/" + action.actionName
    );
    log.info(
      "RemoteStoreNetworkRestClient handleNetworkRemoteStoreModelActionWithDeployment",
      action,
      "callParams",
      callParams
    );
    return callParams.operation(callParams.url, callParams.args);
  }
}

export default RemoteStoreNetworkRestClient;
