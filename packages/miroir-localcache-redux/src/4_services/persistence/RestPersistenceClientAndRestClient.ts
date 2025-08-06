import {
  HttpMethod,
  LoggerInterface,
  MiroirLoggerFactory,
  PersistenceAction,
  RestClientCallReturnType,
  RestClientInterface,
  RestPersistenceAction,
  RestPersistenceClientAndRestClientInterface
} from "miroir-core";
import { packageName } from "../../constants.js";
import { cleanLevel } from "../constants.js";



export const actionHttpMethods: { [P in string]: HttpMethod } = {
  read: "get",
  update: "put",
  delete: "delete",
};

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "RestPersistenceClientAndRestClient")
).then((logger: LoggerInterface) => {log = logger});

/**
 * Facade / decorator for restClient and GraphQL client.
 * Resolves a DomainNonTransactionalInstanceAction into a network query, using the proper protocol / address.
 *
 */
export class RestPersistenceClientAndRestClient implements RestPersistenceClientAndRestClientInterface {
  private operationMethod: {
    [P in HttpMethod]: (
      rawUrl: string,
      endpoint: string,
      customConfig: any
    ) => Promise<RestClientCallReturnType>;
  };

  constructor(private rootApiUrl: string, private restClient: RestClientInterface) {
    log.info("rootApiUrl", rootApiUrl);
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
      [actionNamePattern: string]:
        | { action?: boolean; attribute?: string; result?: string }
        | undefined;
    };
  } = {
    RestPersistenceAction: { "*": { attribute: "objects", result: "crudInstances" } },
    runBoxedQueryAction: { "*": { action: true } },
    runBoxedExtractorOrQueryAction: { "*": { action: true } },
    runBoxedQueryTemplateOrBoxedExtractorTemplateAction: { "*": { action: true } },
    runBoxedQueryTemplateAction: { "*": { action: true } },
    runBoxedExtractorTemplateAction: { "*": { action: true } },
    // storeManagementAction: { "*": { action: true } }, // TODO: remove, there must be no impact when adding/removing an actionType
    storeManagementAction_createStore: { "*": { action: true } },
    storeManagementAction_deleteStore: { "*": { action: true } },
    storeManagementAction_resetAndInitApplicationDeployment: { "*": { action: true } },
    storeManagementAction_openStore: { "*": { action: true } },
    storeManagementAction_closeStore: { "*": { action: true } },
    // instanceAction: { "*": { action: true } },
    createInstance: { "*": { action: true } },
    deleteInstance: { "*": { action: true } },
    deleteInstanceWithCascade: { "*": { action: true } },
    updateInstance: { "*": { action: true } },
    loadNewInstancesInLocalCache: { "*": { action: true } },
    getInstance: { "*": { action: true } },
    getInstances: { "*": { action: true } },
    // modelAction: { "*": { action: true } },
    initModel: { "*": { action: true } },
    commit: { "*": { action: true } },
    rollback: { "*": { action: true } },
    remoteLocalCacheRollback: { "*": { action: true } },
    resetModel: { "*": { action: true } },
    resetData: { "*": { action: true } },
    alterEntityAttribute: { "*": { action: true } },
    renameEntity: { "*": { action: true } },
    createEntity: { "*": { action: true } },
    dropEntity: { "*": { action: true } },
  };

  // ##################################################################################
  getRestCallParams(
    persistenceAction: PersistenceAction,
    rootApiUrl: string
  ): {
    operation: (
      rawUrl: string,
      endpoint: string,
      customConfig: any
    ) => Promise<RestClientCallReturnType>;
    url: string;
    args: any;
  } {
    const networkActionUrlMap: { [actionName: string]: string } = {
      read:
        "/" +
        ((persistenceAction as RestPersistenceAction).uuid ??
          (persistenceAction as RestPersistenceAction).parentUuid + "/all"),
      create: "/" + ((persistenceAction as RestPersistenceAction).uuid ?? ""),
      update: "/" + ((persistenceAction as RestPersistenceAction).uuid ?? ""),
      delete: "/" + ((persistenceAction as RestPersistenceAction).uuid ?? ""),
    };

    let args;
    if (this.actionTypeArgsMap[persistenceAction.actionType]) {
      if (this.actionTypeArgsMap[persistenceAction.actionType]["*"]) {
        if (this.actionTypeArgsMap[persistenceAction.actionType]["*"]?.action) {
          args = persistenceAction;
        } else {
          args = {
            [this.actionTypeArgsMap[persistenceAction.actionType]["*"]?.result ?? "ERROR"]: (
              persistenceAction as any
            )[this.actionTypeArgsMap[persistenceAction.actionType]["*"]?.attribute ?? "ERROR"],
          };
        }
      } else {
        args = this.actionTypeArgsMap[persistenceAction.actionType][
          (persistenceAction as any)?.actionName ?? "*"
        ]
          ? {
              [(this.actionTypeArgsMap as any)[persistenceAction.actionType][
                (persistenceAction as any)?.actionName ?? "*"
              ].result ?? "ERROR"]: (persistenceAction as any)[
                this.actionTypeArgsMap[persistenceAction.actionType][
                  (persistenceAction as any)?.actionName ?? "*"
                ]?.attribute ?? "ERROR"
              ],
            }
          : {};
      }
    } else {
      throw new Error(
        "getRestCallParams could not find actionTypeArgsMap for actionType " +
          persistenceAction.actionType +
          "action" +
          JSON.stringify(persistenceAction, undefined, 2)
      );
      args = {};
    }

    return {
      operation: (this.operationMethod as any)[
        (actionHttpMethods as any)[
          (persistenceAction as any).actionName ?? persistenceAction.actionType
        ] ?? "post"
      ],
      url:
        rootApiUrl +
        (networkActionUrlMap[
          (persistenceAction as any).actionName ?? persistenceAction.actionType
        ] ?? ""),
      args,
    };
  }

  // ##################################################################################
  async handleNetworkPersistenceAction(
    action: PersistenceAction
  ): Promise<RestClientCallReturnType> {
    switch (action.actionType) {
      // case "instanceAction":
      case "createInstance":
      case "deleteInstance":
      case "deleteInstanceWithCascade":
      case "updateInstance":
      case "loadNewInstancesInLocalCache":
      case "getInstance":
      case "getInstances":
      //
      case "bundleAction":
      // case "modelAction":
      case "initModel":
      case "commit":
      case "rollback":
      case "remoteLocalCacheRollback":
      case "resetModel":
      case "resetData":
      case "alterEntityAttribute":
      case "renameEntity":
      case "createEntity":
      case "dropEntity":
      // case "storeManagementAction": 
      case "storeManagementAction_createStore":
      case "storeManagementAction_deleteStore":
      case "storeManagementAction_resetAndInitApplicationDeployment":
      case "storeManagementAction_openStore":
      case "storeManagementAction_closeStore": {
        const callParams = this.getRestCallParams(
          action,
          // this.rootApiUrl + "/action/" + ((action as any).actionName ?? action.actionType)
          this.rootApiUrl + "/action/" + action.actionType
        );
        log.debug("handleNetworkPersistenceAction", action, "callParams", callParams);
        const result = await callParams.operation(
          // "/action/:actionName",
          "/action/:actionType",
          callParams.url,
          callParams.args
        );
        log.info("handleNetworkPersistenceAction", action, "result", result);
        return Promise.resolve(result);
        break;
      }
      case "LocalPersistenceAction": {
        throw new Error(
          "LocalPersistenceAction cannot be handled by RestPersistenceClientAndRestClient.handleNetworkPersistenceAction"
        );
      }
      case "runBoxedExtractorAction":
      case "runBoxedExtractorOrQueryAction":
      case "runBoxedQueryAction": {
        const callParams = this.getRestCallParams(action, this.rootApiUrl + "/query");
        log.info("handleNetworkPersistenceAction", action, "callParams", callParams);
        const result = await callParams.operation("/query", callParams.url, callParams.args);
        log.info("handleNetworkPersistenceAction", action, "result", result);
        return result;
        break;
      }
      case "runBoxedExtractorTemplateAction":
      case "runBoxedQueryTemplateAction":
      case "runBoxedQueryTemplateOrBoxedExtractorTemplateAction": {
        const callParams = this.getRestCallParams(action, this.rootApiUrl + "/queryTemplate");
        log.debug("handleNetworkPersistenceAction", action, "callParams", callParams);
        const result = await callParams.operation(
          "/queryTemplate",
          callParams.url,
          callParams.args
        );
        log.info("handleNetworkPersistenceAction", action, "result", result);
        return result;
        break;
      }
      case "RestPersistenceAction": {
        if (typeof action.deploymentUuid !== "string") {
          throw new Error(
            "handleNetworkPersistenceAction could not find deploymentUuid in action " +
              JSON.stringify(action, undefined, 2)
          );
        }
        const callParams = this.getRestCallParams(
          action,
          this.rootApiUrl +
            "/CRUD/" +
            action.deploymentUuid +
            "/" +
            action.section.toString() +
            "/entity"
        );
        const completeArgs = {
          ...callParams.args,
          actionName: action.actionName,
          deploymentUuid: action.deploymentUuid,
          section: action.section,
          parentUuid: action.parentUuid,
        };
        log.debug(
          "handleNetworkPersistenceAction action",
          action,
          "section",
          action.section,
          "callParams",
          callParams,
          "completeArgs",
          completeArgs
        );
        const result = callParams.operation(
          "/CRUD/:deploymentUuid/:section/entity" +
            (action.actionName == "read" ? "/:parentUuid/all" : ""),
          callParams.url,
          completeArgs
        );
        // log.debug("handleNetworkPersistenceAction action", action, "section", action.section, "callParams", callParams, "result", JSON.stringify(result, undefined, 2));
        return result;
        break;
      }
      default:
        throw new Error(
          "handleNetworkPersistenceAction could not handle action " +
            JSON.stringify(action, undefined, 2)
        );
        break;
    }
  }

  // ##################################################################################
}

export default RestPersistenceClientAndRestClient;
