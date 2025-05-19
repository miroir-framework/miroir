import {
  ModelAction,
  ModelActionInitModel,
  ModelActionInitModelParams,
  StoreOrBundleAction
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { PersistenceStoreControllerInterface } from "../0_interfaces/4-services/PersistenceStoreControllerInterface";
import { PersistenceStoreControllerManagerInterface } from "../0_interfaces/4-services/PersistenceStoreControllerManagerInterface";
import { MiroirLoggerFactory } from "../4_services/LoggerFactory";
import { packageName } from "../constants";
import { cleanLevel } from "./constants";

const adminConfigurationDeploymentMiroir = require("../assets/admin_data/7959d814-400c-4e80-988f-a00fe582ab98/10ff36f2-50a3-48d8-b80f-e48e5d13af8e.json");

import { defaultMiroirMetaModel } from "../1_core/Model";
import { ACTION_OK } from "../1_core/constants";
import { Action2Error, Action2ReturnType } from "../0_interfaces/2_domain/DomainElement";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "ActionRunner")
).then((logger: LoggerInterface) => {log = logger; console.log("ActionRunner logger started!!!", (log === console as any), MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "ActionRunner"))});

// ################################################################################################
/**
 * runs a model action: "modelActionUpdateEntity" ("create", "update" or "delete" an Entity), "resetModel" to start again from scratch, etc.
 * @param deploymentUuid
 * @param actionName
 * @param miroirDataPersistenceStoreController
 * @param appDataPersistenceStoreController
 * @param body
 * @returns
 */
export async function modelActionStoreRunnerNotUsed(
  miroirDataPersistenceStoreController: PersistenceStoreControllerInterface,
  appDataPersistenceStoreController: PersistenceStoreControllerInterface,
  deploymentUuid: string,
  actionName: string,
  body: any
): Promise<Action2ReturnType> {
  log.info(
    "###################################### modelActionStoreRunnerNotUsed started deploymentUuid",
    deploymentUuid,
    "actionName",
    actionName
  );
  log.debug("modelActionStoreRunnerNotUsed getEntityUuids()", miroirDataPersistenceStoreController.getEntityUuids());
  const persistenceStoreController: PersistenceStoreControllerInterface =
    deploymentUuid == adminConfigurationDeploymentMiroir.uuid ? miroirDataPersistenceStoreController : appDataPersistenceStoreController;
  const modelAction: ModelAction = body;
  // log.info('modelActionStoreRunnerNotUsed action', JSON.stringify(update,undefined,2));
  log.info("modelActionStoreRunnerNotUsed action", modelAction);
  switch (modelAction.actionName) {
    case "alterEntityAttribute":
    case "createEntity":
    case "renameEntity": 
    case "resetData":
    case "dropEntity": {
      await persistenceStoreController.handleAction(modelAction)
      break;
    }
    case "resetModel": {
      log.debug("modelActionStoreRunnerNotUsed resetModel update");
      await miroirDataPersistenceStoreController.handleAction(modelAction)
      await appDataPersistenceStoreController.handleAction(modelAction)
      log.trace("modelActionStoreRunnerNotUsed resetModel after dropped entities:", miroirDataPersistenceStoreController.getEntityUuids());
      break;
    }
    case "initModel": {
      const modelActionInitModel = body as ModelActionInitModel;
      const params: ModelActionInitModelParams = modelActionInitModel.params;
      log.debug("modelActionStoreRunnerNotUsed initModel params", params);

      if (params.dataStoreType == "miroir") {
        await miroirDataPersistenceStoreController.handleAction(modelActionInitModel)
      } else {
        await appDataPersistenceStoreController.handleAction(modelActionInitModel)
      }
      break;
    }
    case "commit":
    case "rollback": {
      throw new Error("modelActionStoreRunnerNotUsed could not handle action" + JSON.stringify(modelAction));
    }
    default:
      log.warn("modelActionStoreRunnerNotUsed could not handle actionName", actionName);
      break;
  }
  log.debug("modelActionStoreRunnerNotUsed returning empty response.");
  return Promise.resolve(ACTION_OK);
}

// ################################################################################################
/**
 * runs a model action: "modelActionUpdateEntity" ("create", "update" or "delete" an Entity), "resetModel" to start again from scratch, etc.
 * @param actionName
 * @param action
 * @returns
 */
export async function storeActionOrBundleActionStoreRunner(
  actionName: string,
  action: StoreOrBundleAction,
  persistenceStoreControllerManager: PersistenceStoreControllerManagerInterface
): Promise<Action2ReturnType> {
  log.info("###################################### storeActionOrBundleActionStoreRunner started ", "actionName", actionName);
  // log.debug('storeActionOrBundleActionStoreRunner getEntityUuids()', miroirDataStoreProxy.getEntityUuids());
  // const update: StoreManagementAction = action;

  log.info("storeActionOrBundleActionStoreRunner action", JSON.stringify(action, undefined, 2));
  switch (action.actionName) {
    // case "createBundle":
    // case "deleteBundle":
    //   break;
    case "createStore": {
      // log.warn("storeActionOrBundleActionStoreRunner createStore does nothing!")
      if (!action.deploymentUuid) {
        return new Action2Error("FailedToCreateStore", "storeActionOrBundleActionStoreRunner no deploymentUuid in action " + JSON.stringify(action));
      }

      const localAppPersistenceStoreController = persistenceStoreControllerManager.getPersistenceStoreController(action.deploymentUuid);
      if (!localAppPersistenceStoreController) {
        throw new Error(
          "storeActionOrBundleActionStoreRunner could not find controller for deployment: " +
            action.deploymentUuid +
            " available controllers: " +
            persistenceStoreControllerManager.getPersistenceStoreControllers()
        );
      }

      // await persistenceStoreControllerManager.addPersistenceStoreController(action.deploymentUuid, action.configuration)
      const appModelStoreCreated: Action2ReturnType = await localAppPersistenceStoreController.createStore(action.configuration.model)
      const appDataStoreCreated: Action2ReturnType = await localAppPersistenceStoreController.createStore(action.configuration.data)

      if (appModelStoreCreated instanceof Action2Error || appDataStoreCreated instanceof Action2Error) {
        return new Action2Error(
          "FailedToCreateStore",
          (appModelStoreCreated instanceof Action2Error ? appModelStoreCreated.errorMessage : "model store created OK") +
            " --- " +
            (appDataStoreCreated instanceof Action2Error ? appDataStoreCreated.errorMessage : "data store created OK")
        );
      }
      log.info(
        "storeActionOrBundleActionStoreRunner createStore for deployment",
        action.deploymentUuid,
        "DONE!",
        persistenceStoreControllerManager.getPersistenceStoreControllers()
      );
      break;
    }
    case "deleteStore": {
      // log.warn("storeActionOrBundleActionStoreRunner deleteStore does nothing!")
      if (!action.deploymentUuid) {
        return new Action2Error("FailedToDeleteStore", "storeActionOrBundleActionStoreRunner no deploymentUuid in action " + JSON.stringify(action));
      }

      const localAppPersistenceStoreController = persistenceStoreControllerManager.getPersistenceStoreController(action.deploymentUuid);
      if (!localAppPersistenceStoreController) {
        throw new Error(
          "storeActionOrBundleActionStoreRunner could not find controller for deployment: " +
            action.deploymentUuid +
            " available controllers: " +
            persistenceStoreControllerManager.getPersistenceStoreControllers()
        );
      }

      // await persistenceStoreControllerManager.addPersistenceStoreController(action.deploymentUuid, action.configuration)
      const appModelStoreDeleted: Action2ReturnType = await localAppPersistenceStoreController.deleteStore(action.configuration.model)
      const appDataStoreDeleted: Action2ReturnType = await localAppPersistenceStoreController.deleteStore(action.configuration.data)

      if (appModelStoreDeleted instanceof Action2Error || appDataStoreDeleted instanceof Action2Error) {
        return new Action2Error(
          "FailedToDeleteStore",
          (appModelStoreDeleted instanceof Action2Error ? appModelStoreDeleted.errorMessage : "model store deleted OK") +
            " --- " +
            (appDataStoreDeleted instanceof Action2Error ? appDataStoreDeleted.errorMessage : "data store deleted OK")
        );
      }
      break;
    }
    case "openStore": {
      // log.info('storeActionOrBundleActionStoreRunner openStore',miroirConfig);

      // TODO: NOT CLEAN, IMPLEMENTATION-DEPENDENT, METHOD SHOULD BE INJECTED
      // TODO: addPersistenceStoreController takes deploymentUuid, not ApplicationSection as 1st parameter!
      // for (const deployment of Object.entries(action.configuration)) {
      if (!action.configuration[action.deploymentUuid]) {
        return new Action2Error(
          "FailedToOpenStore",
          "no configuration entry found for deployment uuid " + action.deploymentUuid + " configuration: " + JSON.stringify(action.configuration, null, 2)
        );
      }

      await persistenceStoreControllerManager.deletePersistenceStoreController(action.deploymentUuid);
      await persistenceStoreControllerManager.addPersistenceStoreController(
        action.deploymentUuid,
        action.configuration[action.deploymentUuid]
      );

      const localPersistenceStoreController = persistenceStoreControllerManager.getPersistenceStoreController(action.deploymentUuid);
      await localPersistenceStoreController?.open();
      log.info("storeActionOrBundleActionStoreRunner openStore for deployment", action.deploymentUuid, "opened! booting up...");

      await localPersistenceStoreController?.bootFromPersistedState(defaultMiroirMetaModel.entities,defaultMiroirMetaModel.entityDefinitions);
      log.info("storeActionOrBundleActionStoreRunner openStore for deployment", action.deploymentUuid, "booted from persistent state...");

      log.info(
        "storeActionOrBundleActionStoreRunner openStore for deployment",
        action.deploymentUuid,
        "DONE!",
        persistenceStoreControllerManager.getPersistenceStoreControllers()
      );
      // }

      log.info("storeActionOrBundleActionStoreRunner openStore DONE!", persistenceStoreControllerManager.getPersistenceStoreControllers());

      break;
    }
    case "closeStore": {
      log.info("storeActionOrBundleActionStoreRunner closeStore");
      // NOT CLEAN, IMPLEMENTATION-DEPENDENT, METHOD SHOULD BE INJECTED
      await persistenceStoreControllerManager.deletePersistenceStoreController(action.deploymentUuid);
      log.info("storeActionOrBundleActionStoreRunner closeStore DONE!", persistenceStoreControllerManager.getPersistenceStoreControllers());

      break;
    }
    default:
      log.warn("storeActionOrBundleActionStoreRunner could not handle actionName", actionName);
      break;
  }
  log.debug("storeActionOrBundleActionStoreRunner returning empty response.");
  return Promise.resolve(ACTION_OK);
}
