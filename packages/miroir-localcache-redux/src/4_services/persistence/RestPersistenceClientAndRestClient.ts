import {
  HttpMethod,
  LoggerInterface,
  MiroirLoggerFactory,
  PersistenceAction,
  RestPersistenceAction,
  RestPersistenceClientAndRestClientInterface,
  RestClientCallReturnType,
  RestClientInterface,
  getLoggerName
} from "miroir-core";
import { packageName } from "../../constants.js";
import { cleanLevel } from "../constants.js";



export const actionHttpMethods: { [P in string]: HttpMethod } = {
  read: "get",
  update: "put",
  delete: "delete",
};

const loggerName: string = getLoggerName(packageName, cleanLevel,"RestPersistenceClientAndRestClient");
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
export class RestPersistenceClientAndRestClient implements RestPersistenceClientAndRestClientInterface {
  private operationMethod: {
    [P in HttpMethod]: (rawUrl:string, endpoint: string, customConfig: any) => Promise<RestClientCallReturnType>;
  };

  constructor(
    private rootApiUrl: string, 
    private restClient: RestClientInterface
  ) {
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
      [actionNamePattern: string]: { action?: boolean; attribute?: string; result?: string } | undefined;
    };
  } = {
    RestPersistenceAction: { "*": { attribute: "objects", result: "crudInstances" } },
    modelAction: { "*": { action: true } },
    runBoxedExtractorOrQueryAction: { "*": { action: true } },
    runBoxedQueryTemplateOrBoxedExtractorTemplateAction: { "*": { action: true } },
    runBoxedQueryTemplateAction: { "*": { action: true } },
    runBoxedExtractorTemplateAction: { "*": { action: true } },
    instanceAction: { "*": { action: true } },
    storeManagementAction: { "*": { action: true } }, // TODO: remove, there must be no impact when adding/removing an actionType
  };

  // ##################################################################################
  getRestCallParams(
    networkAction: PersistenceAction,
    rootApiUrl: string
  ): {
    operation: (rawUrl:string, endpoint: string, customConfig: any) => Promise<RestClientCallReturnType>;
    url: string;
    args: any;
  } {
    const networkActionUrlMap: { [actionName: string]: string } = {
      read:
        "/" +
        ((networkAction as RestPersistenceAction).uuid ?? (networkAction as RestPersistenceAction).parentUuid + "/all"),
      create: "/" + ((networkAction as RestPersistenceAction).uuid ?? ""),
      update: "/" + ((networkAction as RestPersistenceAction).uuid ?? ""),
      delete: "/" + ((networkAction as RestPersistenceAction).uuid ?? ""),
    };

    let args;
    if (this.actionTypeArgsMap[networkAction.actionType]) {
      if (this.actionTypeArgsMap[networkAction.actionType]["*"]) {
        if (this.actionTypeArgsMap[networkAction.actionType]["*"]?.action) {
          args = networkAction;
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
          : {};
      }
    } else {
      args = {};
    }

    return {
      operation: (this.operationMethod as any)[(actionHttpMethods as any)[networkAction.actionName] ?? "post"],
      url: rootApiUrl + (networkActionUrlMap[networkAction.actionName] ?? ""),
      args,
    };
  }

  // ##################################################################################
  async handleNetworkPersistenceAction(action: PersistenceAction): Promise<RestClientCallReturnType> {
    switch (action.actionType) {
      case "instanceAction":
      case "bundleAction":
      case "modelAction":
      case "storeManagementAction": {
        const callParams = this.getRestCallParams(action, this.rootApiUrl + "/action/" + action.actionName);
        log.debug("handleNetworkPersistenceAction", action, "callParams", callParams);
        const result = await callParams.operation("/action/:actionName", callParams.url, callParams.args);
        log.info("handleNetworkPersistenceAction", action, "result", result);
        return result;
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
        log.debug("handleNetworkPersistenceAction", action, "callParams", callParams);
        const result = await callParams.operation("/query",callParams.url, callParams.args);
        log.info("handleNetworkPersistenceAction", action, "result", result);
        return result;
        break;
      }
      case "runBoxedExtractorTemplateAction":
      case "runBoxedQueryTemplateAction":
      case "runBoxedQueryTemplateOrBoxedExtractorTemplateAction": {
        const callParams = this.getRestCallParams(action, this.rootApiUrl + "/queryTemplate");
        log.debug("handleNetworkPersistenceAction", action, "callParams", callParams);
        const result = await callParams.operation("/queryTemplate",callParams.url, callParams.args);
        log.info("handleNetworkPersistenceAction", action, "result", result);
        return result;
        break;
      }
      case "RestPersistenceAction": {
        const callParams = this.getRestCallParams(
          action,
          this.rootApiUrl + "/CRUD/" + action.deploymentUuid + "/" + action.section.toString() + "/entity"
        );
        const completeArgs = {
          ...callParams.args,
          actionName: action.actionName,
          deploymentUuid: action.deploymentUuid,
          section: action.section,
          parentUuid: action.parentUuid,
        }
        log.debug("handleNetworkPersistenceAction action", action, "section", action.section, "callParams", callParams, "completeArgs", completeArgs);
        const result = callParams.operation("/CRUD/:deploymentUuid/:section/entity" + (action.actionName == "read"?"/:parentUuid/all":""),callParams.url, completeArgs);
        // log.debug("handleNetworkPersistenceAction action", action, "section", action.section, "callParams", callParams, "result", JSON.stringify(result, undefined, 2));
        return result;
        break;
      }
      default:
        throw new Error(
          "handleNetworkPersistenceAction could not handle action " + JSON.stringify(action, undefined, 2)
        );
        break;
    }
  }

  // ##################################################################################
}

export default RestPersistenceClientAndRestClient;
