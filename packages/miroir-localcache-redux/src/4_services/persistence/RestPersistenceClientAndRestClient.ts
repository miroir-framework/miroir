import {
  Action2Error,
  HttpMethod,
  LoggerInterface,
  MiroirLoggerFactory,
  PersistenceAction,
  resolvePathOnObject,
  RestClientCallReturnType,
  RestClientInterface,
  RestPersistenceAction,
  RestPersistenceClientAndRestClientInterface,
  type ApplicationDeploymentMap
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
        | { action?: boolean; attribute?: string | string[]; result?: string }
        | undefined;
    };
  } = {
    // RestPersistenceAction: { "*": { attribute: "objects", result: "crudInstances" } },
    RestPersistenceAction_create: { "*": { attribute: ["payload", "objects"], result: "crudInstances" } },
    // RestPersistenceAction_create: { "*": { attribute: "payload", result: "crudInstances" } },
    // RestPersistenceAction_create: { "*": { attribute: "objects", result: "crudInstances" } },
    RestPersistenceAction_read: { "*": { attribute: "objects", result: "crudInstances" } },
    RestPersistenceAction_update: { "*": { attribute: "objects", result: "crudInstances" } },
    RestPersistenceAction_delete: { "*": { attribute: "objects", result: "crudInstances" } },
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
    rootApiUrl: string,
    applicationDeploymentMap: ApplicationDeploymentMap,
  ): {
    operation: (
      rawUrl: string,
      endpoint: string,
      customConfig: any
    ) => Promise<RestClientCallReturnType>;
    url: string;
    args: any;
  } { 
  let localHttpMethod: HttpMethod | undefined = undefined;
  let url: string  | undefined= undefined;
  let networkActionUrlMap: { [actionName: string]: string } = {};
  switch (persistenceAction.actionType) {
    case "LocalPersistenceAction_read": {
      localHttpMethod = "get";
      url = "/" + (persistenceAction.payload.uuid ?? (persistenceAction.payload.parentUuid + "/all"));
      break;
    }
    case "LocalPersistenceAction_create":
    case "LocalPersistenceAction_update": {
      localHttpMethod = "put";
      url = "/" + (persistenceAction.payload.uuid ?? "");
      break;
    }
    case "LocalPersistenceAction_delete": {
      localHttpMethod = "delete";
      url = "/" + (persistenceAction.payload.uuid ?? "");
      break;
    }
    case "RestPersistenceAction_read": {
      localHttpMethod = "get";
      url = "/" + (persistenceAction.payload.uuid ?? (persistenceAction.payload.parentUuid + "/all"));
      break;
    }
    case "RestPersistenceAction_update": 
    case "RestPersistenceAction_create": {
      localHttpMethod = "put";
      url = "/" + (persistenceAction.payload.uuid ?? "");
      break;
    }
    case "RestPersistenceAction_delete": {
      localHttpMethod = "delete";
      url = "/" + (persistenceAction.payload.uuid ?? "");
      // networkActionUrlMap = {
      //       read:
      //         "/" +
      //         (persistenceAction.payload.uuid ?? (persistenceAction.payload.parentUuid + "/all")),
      //       create: "/" + (persistenceAction.payload.uuid ?? ""),
      //       update: "/" + (persistenceAction.payload.uuid ?? ""),
      //       delete: "/" + (persistenceAction.payload.uuid ?? ""),
      //     };
      break;
    }
    case "runBoxedQueryAction":
    case "runBoxedExtractorOrQueryAction":
    case "runBoxedQueryTemplateOrBoxedExtractorTemplateAction":
    case "runBoxedQueryTemplateAction":
    case "runBoxedExtractorTemplateAction":
    case "storeManagementAction_createStore":
    case "storeManagementAction_deleteStore":
    case "storeManagementAction_resetAndInitApplicationDeployment":
    case "storeManagementAction_openStore":
    case "storeManagementAction_closeStore":
    case "createInstance":
    case "deleteInstance":
    case "deleteInstanceWithCascade":
    case "updateInstance":
    case "loadNewInstancesInLocalCache":
    case "getInstance":
    case "getInstances":
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
    case "runBoxedExtractorAction":
    case "bundleAction": {
      networkActionUrlMap = {
            read: "/" + ((persistenceAction as any).uuid ?? ((persistenceAction as any).parentUuid + "/all")),
            create: "/" + ((persistenceAction as any).uuid ?? ""),
            update: "/" + ((persistenceAction as any).uuid ?? ""),
            delete: "/" + ((persistenceAction as any).uuid ?? ""),
          }
      break;
    }
    default:
      break;
  }

    let args;
    if (this.actionTypeArgsMap[persistenceAction.actionType]) {
      if (this.actionTypeArgsMap[persistenceAction.actionType]["*"]) {
        if (this.actionTypeArgsMap[persistenceAction.actionType]["*"]?.action) {
          args = {action: persistenceAction, applicationDeploymentMap};
        } else {
          args = {
            [this.actionTypeArgsMap[persistenceAction.actionType]["*"]?.result ?? "ERROR"]:( 
            Array.isArray(this.actionTypeArgsMap[persistenceAction.actionType]["*"]?.attribute) ? 
            resolvePathOnObject(
              persistenceAction as any
            , this.actionTypeArgsMap[persistenceAction.actionType]["*"]?.attribute as any)
            :
             (
              persistenceAction as any
            )[(this.actionTypeArgsMap[persistenceAction.actionType]["*"]?.attribute as string) ?? "ERROR"]),
          };
        }
      } else {
        args = this.actionTypeArgsMap[persistenceAction.actionType][
          (persistenceAction as any)?.actionName ?? "*"
        ]
          ? {
              [(this.actionTypeArgsMap as any)[persistenceAction.actionType][
                (persistenceAction as any)?.actionName ?? "*"
              ].result ?? "ERROR"]: (
                Array.isArray(this.actionTypeArgsMap[persistenceAction.actionType][
                  (persistenceAction as any)?.actionName ?? "*"
                ]?.attribute) ?
                resolvePathOnObject(
                  persistenceAction as any,
                  this.actionTypeArgsMap[persistenceAction.actionType][
                    (persistenceAction as any)?.actionName ?? "*"
                  ]?.attribute as any
                )
                :
                (persistenceAction as any)[
                (this.actionTypeArgsMap[persistenceAction.actionType][
                  (persistenceAction as any)?.actionName ?? "*"
                ]?.attribute as string) ?? "ERROR"
              ]),
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
        localHttpMethod??((actionHttpMethods as any)[
          (persistenceAction as any).actionName ?? persistenceAction.actionType
        ] ?? "post")
      ],
      url:
        rootApiUrl +
        (url??(networkActionUrlMap[
          (persistenceAction as any).actionName ?? persistenceAction.actionType
        ] ?? "")),
      args,
    };
  }

  // ##################################################################################
  async handleNetworkPersistenceAction(
    persistenceAction: PersistenceAction,
    applicationDeploymentMap: ApplicationDeploymentMap,
  ): Promise<RestClientCallReturnType> {
    log.info(
      "handleNetworkPersistenceAction called for persistenceAction",
      persistenceAction,
      "applicationDeploymentMap",
      applicationDeploymentMap
    );
    switch (persistenceAction.actionType) {
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
          persistenceAction,
          this.rootApiUrl + "/action/" + persistenceAction.actionType,
          applicationDeploymentMap,
        );
        log.info("handleNetworkPersistenceAction called for action", persistenceAction, "callParams", callParams);
        const result = await callParams.operation(
          "/action/:actionType",
          callParams.url,
          callParams.args
        );
        log.info("handleNetworkPersistenceAction", persistenceAction, "result", result);
        return Promise.resolve(result);
        break;
      }
      case "LocalPersistenceAction_create":
      case "LocalPersistenceAction_read":
      case "LocalPersistenceAction_update":
      case "LocalPersistenceAction_delete": {
        throw new Error(
          "LocalPersistenceAction cannot be handled by RestPersistenceClientAndRestClient.handleNetworkPersistenceAction"
        );
      }
      case "runBoxedExtractorAction":
      case "runBoxedExtractorOrQueryAction":
      case "runBoxedQueryAction": {
        const callParams = this.getRestCallParams(persistenceAction, this.rootApiUrl + "/query", applicationDeploymentMap);
        log.info("handleNetworkPersistenceAction", persistenceAction, "callParams", callParams);
        const result = await callParams.operation("/query", callParams.url, callParams.args);
        log.info("handleNetworkPersistenceAction", persistenceAction, "result", result);
        return result;
        break;
      }
      case "runBoxedExtractorTemplateAction":
      case "runBoxedQueryTemplateAction":
      case "runBoxedQueryTemplateOrBoxedExtractorTemplateAction": {
        const callParams = this.getRestCallParams(persistenceAction, this.rootApiUrl + "/queryTemplate", applicationDeploymentMap);
        log.debug("handleNetworkPersistenceAction", persistenceAction, "callParams", callParams);
        const result = await callParams.operation(
          "/queryTemplate",
          callParams.url,
          callParams.args
        );
        log.info("handleNetworkPersistenceAction", persistenceAction, "result", result);
        return result;
        break;
      }
      case "RestPersistenceAction_create":
      case "RestPersistenceAction_read":
      case "RestPersistenceAction_update":
      case "RestPersistenceAction_delete": {
        if (typeof persistenceAction.payload.application !== "string") {
          throw new Error(
            "handleNetworkPersistenceAction could not find application"
          );
        }
        // if (typeof persistenceAction.payload.deploymentUuid !== "string") {
        //   throw new Error(
        //     "handleNetworkPersistenceAction could not find deploymentUuid"
        //   );
        // }
        if (typeof persistenceAction.payload.parentUuid !== "string") {
          return Promise.resolve({
            ...new Action2Error(
              "FailedToHandlePersistenceAction",
              "handleNetworkPersistenceAction could not find payload.parentUuid for action " + persistenceAction.actionType,
              ["handleNetworkPersistenceAction"],
              undefined,
              { domainAction: persistenceAction }
            )
          });
        }
        if (typeof persistenceAction.payload.section !== "string") {
          throw new Error(
            "handleNetworkPersistenceAction could not find section"
          );
        }
        const effectiveAction = persistenceAction.actionType.split('_')[1];
        log.info("handleNetworkPersistenceAction effectiveAction", effectiveAction);
        const callParams = this.getRestCallParams(
          persistenceAction,
          this.rootApiUrl +
            "/CRUD/" +
            applicationDeploymentMap[persistenceAction.payload.application] +
            "/" +
            persistenceAction.payload.section.toString() +
            "/entity",
          applicationDeploymentMap
        );
        const completeArgs = {
          ...callParams.args,
          // actionName: action.actionName,
          application: persistenceAction.payload.application,
          deploymentUuid: applicationDeploymentMap[persistenceAction.payload.application],
          section: persistenceAction.payload.section,
          parentUuid: persistenceAction.payload.parentUuid,
          applicationDeploymentMap,
        };
        log.info(
          "handleNetworkPersistenceAction action",
          persistenceAction,
          "section",
          persistenceAction.payload.section,
          "callParams",
          callParams,
          "completeArgs",
          completeArgs
        );
        const result = callParams.operation(
          "/CRUD/:deploymentUuid/:section/entity" +
            (effectiveAction == "read" ? "/:parentUuid/all" : ""),
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
            JSON.stringify(persistenceAction, undefined, 2)
        );
        break;
    }
  }

  // ##################################################################################
}

export default RestPersistenceClientAndRestClient;
