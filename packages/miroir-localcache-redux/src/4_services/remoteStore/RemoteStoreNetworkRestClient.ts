import {
  ApplicationSection,
  ModelAction,
  HttpMethod,
  LoggerInterface,
  MiroirLoggerFactory,
  RemoteStoreAction,
  RemoteStoreCRUDAction,
  RemoteStoreNetworkClientInterface,
  RestClientCallReturnType,
  RestClientInterface,
  getLoggerName,
  StoreAction,
  StoreOrBundleAction,
} from "miroir-core";
import { packageName } from "../../constants";
import { cleanLevel } from "../constants";



export const actionHttpMethods: { [P in string]: HttpMethod } = {
  read: "get",
  update: "put",
  delete: "delete",
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
 * Resolves a DomainNonTransactionalInstanceAction into a network query, using the proper protocol / address.
 *
 */
export class RemoteStoreNetworkRestClient implements RemoteStoreNetworkClientInterface {
  private operationMethod: {
    [P in HttpMethod]: (endpoint: string, customConfig: any) => Promise<RestClientCallReturnType>;
  };

  constructor(private rootApiUrl: string, private restClient: RestClientInterface) {
    log.info("RemoteStoreNetworkRestClient rootApiUrl", rootApiUrl);
    this.operationMethod = {
      get: this.restClient.get.bind(this.restClient),
      post: this.restClient.post.bind(this.restClient),
      put: this.restClient.put.bind(this.restClient),
      delete: this.restClient.delete.bind(this.restClient),
    };
  }

  // ##################################################################################

  // ##################################################################################
  private actionTypeArgsMap: {
    [actionType: string]: {
      [actionNamePattern: string]: { action?: boolean; attribute?: string; result?: string } | undefined;
    };
  } = {
    RemoteStoreCRUDAction: { "*": { attribute: "objects", result: "crudInstances" } },
    modelAction: { "*": { action: true } },
    storeAction: { "*": { action: true } }, // TODO: remove, there must be no impact when adding/removing an actionType
    DomainTransactionalInstanceAction: {
      UpdateMetaModelInstance: { attribute: "update", result: "modelUpdate" }, // NO REMOTE ACTION IS SENT FOR UpdateMetaModelInstance! It is a localCache only operation (commit does the remote part)
      modelActionUpdateEntity: { attribute: "update", result: "modelUpdate" },
      commit: undefined,
      initModel: { attribute: "params", result: "modelUpdate" },
      redo: undefined,
      replaceLocalCache: undefined, // local action, not sent on the network
      resetModel: undefined,
      resetData: undefined,
      rollback: undefined,
      undo: undefined,
    },
  };

  // ##################################################################################
  getRestCallParams(
    networkAction: RemoteStoreAction,
    rootApiUrl: string
  ): {
    operation: (endpoint: string, customConfig: any) => Promise<RestClientCallReturnType>;
    url: string;
    args: any;
  } {
    const networkActionUrlMap: { [actionName: string]: string } = {
      read:
        "/" +
        ((networkAction as RemoteStoreCRUDAction).uuid ?? (networkAction as RemoteStoreCRUDAction).parentUuid + "/all"),
      create: "/" + ((networkAction as RemoteStoreCRUDAction).uuid ?? ""),
      update: "/" + ((networkAction as RemoteStoreCRUDAction).uuid ?? ""),
      delete: "/" + ((networkAction as RemoteStoreCRUDAction).uuid ?? ""),
    };

    let args
    if (this.actionTypeArgsMap[networkAction.actionType]) {
      if (this.actionTypeArgsMap[networkAction.actionType]["*"]) {
        if (this.actionTypeArgsMap[networkAction.actionType]["*"]?.action) {
          args = networkAction
        } else {
          args = {
            [this.actionTypeArgsMap[networkAction.actionType]["*"]?.result ?? "ERROR"]: (networkAction as any)[
              this.actionTypeArgsMap[networkAction.actionType]["*"]?.attribute ?? "ERROR"
            ],
          };
        }
      } else {
        args = this.actionTypeArgsMap[networkAction.actionType][networkAction.actionName]
        ? {
            [this.actionTypeArgsMap[networkAction.actionType][networkAction.actionName]?.result ?? "ERROR"]: (
              networkAction as any
            )[this.actionTypeArgsMap[networkAction.actionType][networkAction.actionName]?.attribute ?? "ERROR"],
          }
        : {}
      }
    } else {
      args = {}
    }

    return {
      operation: (this.operationMethod as any)[(actionHttpMethods as any)[networkAction.actionName] ?? "post"],
      url: rootApiUrl + (networkActionUrlMap[networkAction.actionName] ?? ""),
      args
    };
  }

  // ##################################################################################
  async handleNetworkRemoteStoreCRUDAction(
    deploymentUuid: string,
    action: RemoteStoreCRUDAction
  ): Promise<RestClientCallReturnType> {
    const callParams = this.getRestCallParams(
      action,
      this.rootApiUrl + "/miroirWithDeployment/" + deploymentUuid + "/" + action.section.toString() + "/entity"
    );
    // const args =
    log.debug(
      "RemoteStoreNetworkRestClient handleNetworkRemoteStoreCRUDAction action",
      action,
      "deploymentUuid",
      deploymentUuid,
      "section",
      action.section,
      "callParams",
      callParams
    );
    return callParams.operation(callParams.url, callParams.args);
  }

  // ##################################################################################
  async handleNetworkRemoteStoreModelEntityAction(
    deploymentUuid: string,
    action: ModelAction
  ): Promise<RestClientCallReturnType> {
    const callParams = this.getRestCallParams(
      action,
      this.rootApiUrl + "/modelWithDeployment/" + deploymentUuid + "/" + action.actionName
    );
    log.debug("RemoteStoreNetworkRestClient handleNetworkRemoteStoreEntityAction", action, "callParams", callParams);
    return callParams.operation(callParams.url, callParams.args);
  }

  // ##################################################################################
  async handleNetworkRemoteStoreOrBundleAction(deploymentUuid: string, action: StoreOrBundleAction): Promise<RestClientCallReturnType> {
    const callParams = this.getRestCallParams(action, this.rootApiUrl + "/action/" + action.actionName);
    log.debug("RemoteStoreNetworkRestClient handleNetworkRemoteStoreEntityAction", action, "callParams", callParams);
    const result = await callParams.operation(callParams.url, callParams.args);
    log.info("RemoteStoreNetworkRestClient handleNetworkRemoteStoreEntityAction", action, "result", result);
    return result;
  }

  // ##################################################################################
  async handleNetworkRemoteStoreAction(deploymentUuid: string, action: RemoteStoreAction): Promise<RestClientCallReturnType> {
    switch (action.actionType) {
      case "bundleAction":
      case "storeAction": {
        return this.handleNetworkRemoteStoreOrBundleAction(deploymentUuid, action);
        break;
      }
      case "RemoteStoreCRUDAction": {
        return this.handleNetworkRemoteStoreCRUDAction(deploymentUuid, action);
        break;
      }
      case "modelAction": {
        return this.handleNetworkRemoteStoreModelEntityAction(deploymentUuid, action)
        break;
      }
      default:
        throw new Error("handleNetworkRemoteStoreAction could not handle action " + action);
        break;
    }
    // const callParams = this.getRestCallParams(action, this.rootApiUrl + "/action/" + action.actionName);
    // log.debug("RemoteStoreNetworkRestClient handleNetworkRemoteStoreEntityAction", action, "callParams", callParams);
    // const result = await callParams.operation(callParams.url, callParams.args);
    // log.info("RemoteStoreNetworkRestClient handleNetworkRemoteStoreEntityAction", action, "result", result);
    // return result;
  }

  // ##################################################################################
}

export default RemoteStoreNetworkRestClient;
