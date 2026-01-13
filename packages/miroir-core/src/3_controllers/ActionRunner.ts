import {
  ModelAction,
  ModelActionInitModel,
  ModelActionInitModelParams,
  StoreOrBundleAction
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { PersistenceStoreControllerInterface } from "../0_interfaces/4-services/PersistenceStoreControllerInterface";
import { PersistenceStoreControllerManagerInterface } from "../0_interfaces/4-services/PersistenceStoreControllerManagerInterface";
import { MiroirLoggerFactory } from "../4_services/MiroirLoggerFactory";
import { packageName } from "../constants";
import { cleanLevel } from "./constants";

const adminConfigurationDeploymentMiroir = require("../assets/admin_data/7959d814-400c-4e80-988f-a00fe582ab98/10ff36f2-50a3-48d8-b80f-e48e5d13af8e.json");

import { defaultMiroirMetaModel } from "../1_core/Model";
import { ACTION_OK } from "../1_core/constants";
import { Action2Error, Action2ReturnType } from "../0_interfaces/2_domain/DomainElement";
import type { ApplicationDeploymentMap } from "../1_core/Deployment";
import { act } from "react";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "ActionRunner")
).then((logger: LoggerInterface) => {log = logger; console.log("ActionRunner logger started!!!", (log === console as any), MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "ActionRunner"))});

// ################################################################################################
/**
 * runs a model action: "modelActionUpdateEntity" ("create", "update" or "delete" an Entity), "resetModel" to start again from scratch, etc.
 * @param actionType
 * @param action
 * @returns
 */
export async function storeActionOrBundleActionStoreRunner(
  actionType: string,
  action: StoreOrBundleAction,
  applicationDeploymentMap: ApplicationDeploymentMap,
  persistenceStoreControllerManager: PersistenceStoreControllerManagerInterface
): Promise<Action2ReturnType> {
  log.info(
    "###################################### storeActionOrBundleActionStoreRunner started ",
    "actionType",
    actionType,
    "with deployment map",
    applicationDeploymentMap,
    "and action", action
  );
  const deploymentUuid = action.payload.deploymentUuid??applicationDeploymentMap[action.payload.application];
  // log.debug('storeActionOrBundleActionStoreRunner getEntityUuids()', miroirDataStoreProxy.getEntityUuids());
  // const update: StoreManagementAction = action;

  log.info("storeActionOrBundleActionStoreRunner action", JSON.stringify(action, undefined, 2));
  switch (action.actionType) {
    case "storeManagementAction_createStore": {
      // log.warn("storeActionOrBundleActionStoreRunner createStore does nothing!")
      if (!action.payload.deploymentUuid) {
        return new Action2Error("FailedToCreateStore", "storeActionOrBundleActionStoreRunner no deploymentUuid in action " + JSON.stringify(action));
      }

      const localAppPersistenceStoreController =
        persistenceStoreControllerManager.getPersistenceStoreController(
          action.payload.deploymentUuid
        );
      if (!localAppPersistenceStoreController) {
        // throw new Error(
        //   "storeActionOrBundleActionStoreRunner could not find controller for deployment: " +
        //     action.payload.deploymentUuid +
        //     " available controllers: " +
        //     persistenceStoreControllerManager.getPersistenceStoreControllers()
        // );
        return new Action2Error(
          "FailedToCreateStore",
          "storeActionOrBundleActionStoreRunner could not find controller for deployment: " +
            action.payload.deploymentUuid +
            " available controllers: " +
            persistenceStoreControllerManager.getPersistenceStoreControllers()
        );
      }

      const appModelStoreCreated: Action2ReturnType =
        await localAppPersistenceStoreController.createStore(action.payload.configuration.model);
      const appDataStoreCreated: Action2ReturnType =
        await localAppPersistenceStoreController.createStore(action.payload.configuration.data);

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
        action.payload.deploymentUuid,
        "DONE!",
        persistenceStoreControllerManager.getPersistenceStoreControllers()
      );
      break;
    }
    case "storeManagementAction_deleteStore": {
      // log.warn("storeActionOrBundleActionStoreRunner deleteStore does nothing!")
      if (!deploymentUuid) {
        return new Action2Error(
          "FailedToDeleteStore",
          "storeActionOrBundleActionStoreRunner no application matching applicationDeploymentMap in action " +
            JSON.stringify(action) + " applicationDeploymentMap keys: " + JSON.stringify(Object.keys(applicationDeploymentMap))
        );
      }

      const localAppPersistenceStoreController =
        persistenceStoreControllerManager.getPersistenceStoreController(deploymentUuid);
      if (!localAppPersistenceStoreController) {
        // throw new Error(
        //   "storeActionOrBundleActionStoreRunner could not find controller for deployment: " +
        //     action.payload.deploymentUuid +
        //     " available controllers: " +
        //     persistenceStoreControllerManager.getPersistenceStoreControllers()
        // );
        return new Action2Error(
          "FailedToDeleteStore",
          "storeActionOrBundleActionStoreRunner could not find controller for application " + 
          action.payload.application +
          " deployment: " +
            deploymentUuid +
            " available controllers: " +
            persistenceStoreControllerManager.getPersistenceStoreControllers()
        );
      }
      log.info(
        "storeActionOrBundleActionStoreRunner deleteStore for application",
        action.payload.application,
        "deployment",
        deploymentUuid,
        "configuration",
        JSON.stringify(action.payload.configuration, null, 2)
      );
      const appModelStoreDeleted: Action2ReturnType =
        await localAppPersistenceStoreController.deleteStore(action.payload.configuration.model);
      log.info(
        "storeActionOrBundleActionStoreRunner deleteStore for application",
        action.payload.application,
        "deployment",
        deploymentUuid,
        "model store deleted"
      );
      
      const appDataStoreDeleted: Action2ReturnType =
        await localAppPersistenceStoreController.deleteStore(action.payload.configuration.data);
      log.info(
        "storeActionOrBundleActionStoreRunner deleteStore for application",
        action.payload.application,
        "deployment",
        deploymentUuid,
        "data store deleted"
      );
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
    case "storeManagementAction_openStore": {
      // log.info('storeActionOrBundleActionStoreRunner openStore',miroirConfig);

      // TODO: NOT CLEAN, IMPLEMENTATION-DEPENDENT, METHOD SHOULD BE INJECTED
      // TODO: addPersistenceStoreController takes deploymentUuid, not ApplicationSection as 1st parameter!
      // for (const deployment of Object.entries(action.configuration)) {
      if (!action.payload.configuration[deploymentUuid]) {
        log.error(
          "storeActionOrBundleActionStoreRunner openStore no configuration entry found for deployment uuid ",
          deploymentUuid,
          "configuration: ",
          JSON.stringify(action.payload.configuration, null, 2)
        );
        return new Action2Error(
          "FailedToOpenStore",
          "no configuration entry found for deployment uuid " +
            deploymentUuid +
            " configuration: " +
            JSON.stringify(action.payload.configuration, null, 2)
        );
      }

      await persistenceStoreControllerManager.deletePersistenceStoreController(deploymentUuid);
      await persistenceStoreControllerManager.addPersistenceStoreController(
        deploymentUuid,
        action.payload.configuration[deploymentUuid]
      );

      const localPersistenceStoreController = persistenceStoreControllerManager.getPersistenceStoreController(deploymentUuid);
      await localPersistenceStoreController?.open();
      log.info("storeActionOrBundleActionStoreRunner openStore for deployment", deploymentUuid, "opened! booting up...");

      await localPersistenceStoreController?.bootFromPersistedState(
        defaultMiroirMetaModel.entities,
        defaultMiroirMetaModel.entityDefinitions
      );
      log.info(
        "storeActionOrBundleActionStoreRunner openStore for deployment",
        action.payload.deploymentUuid,
        "booted from persistent state..."
      );

      log.info(
        "storeActionOrBundleActionStoreRunner openStore for deployment",
        action.payload.deploymentUuid,
        "DONE!",
        persistenceStoreControllerManager.getPersistenceStoreControllers()
      );
      // }

      log.info("storeActionOrBundleActionStoreRunner openStore DONE!", persistenceStoreControllerManager.getPersistenceStoreControllers());

      break;
    }
    case "storeManagementAction_closeStore": {
      log.info("storeActionOrBundleActionStoreRunner closeStore");
      // NOT CLEAN, IMPLEMENTATION-DEPENDENT, METHOD SHOULD BE INJECTED
      await persistenceStoreControllerManager.deletePersistenceStoreController(deploymentUuid);
      log.info(
        "storeActionOrBundleActionStoreRunner closeStore DONE!",
        persistenceStoreControllerManager.getPersistenceStoreControllers()
      );

      break;
    }
    default:
      log.warn("storeActionOrBundleActionStoreRunner could not handle actionName", actionType);
      break;
  }
  log.debug("storeActionOrBundleActionStoreRunner returning empty response.");
  return Promise.resolve(ACTION_OK);
}
