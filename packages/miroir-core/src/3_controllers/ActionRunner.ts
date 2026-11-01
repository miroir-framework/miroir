import {
  StoreOrBundleAction,
  type MetaModel,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { PersistenceStoreControllerManagerInterface } from "../0_interfaces/4-services/PersistenceStoreControllerManagerInterface";
import { MiroirLoggerFactory } from "../4_services/MiroirLoggerFactory";
import { packageName } from "../constants";
import { cleanLevel } from "./constants";


import { Action2Error, Action2ReturnType } from "../0_interfaces/2_domain/DomainElement";
import type { ApplicationDeploymentMap } from "../1_core/Deployment";
import { defaultMiroirMetaModel as defaultMiroirMetaModelRaw } from "miroir-app-miroir";
import { ACTION_OK } from "../1_core/constants";
import { optionalApplicationSections } from "../1_core/Model";

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "ActionRunner");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName).then((logger: LoggerInterface) => {log = logger});

// See 1_core/Model.ts for why this cast is needed at the import boundary.
const defaultMiroirMetaModel = defaultMiroirMetaModelRaw as unknown as MetaModel;

// ################################################################################################
/**
 * runs a storeManagementAction 
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
  // #451: store configurations can carry connection strings with credentials, so the action
  // itself is not logged.
  log.info(
    "###################################### storeActionOrBundleActionStoreRunner started ",
    "actionType",
    actionType,
    "application",
    action.payload.application,
    "with deployment map",
    applicationDeploymentMap,
  );
  const deploymentUuid = applicationDeploymentMap[action.payload.application];
  // log.debug('storeActionOrBundleActionStoreRunner getEntityUuids()', miroirDataStoreProxy.getEntityUuids());
  // const update: StoreManagementAction = action;

  switch (action.actionType) {
    case "storeManagementAction_createStore": {
      // log.warn("storeActionOrBundleActionStoreRunner createStore does nothing!")
      if (!action.payload.deploymentUuid) {
        return new Action2Error("FailedToCreateStore", "storeActionOrBundleActionStoreRunner no deploymentUuid in action " + action.actionType);
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

      // optional sections (#232 modelVersion, #647 devData): created only when configured
      const optionalStoresCreated: [string, Action2ReturnType][] = [];
      for (const section of optionalApplicationSections) {
        const sectionConfig = action.payload.configuration[section];
        if (!sectionConfig) continue;
        optionalStoresCreated.push([
          section,
          await localAppPersistenceStoreController.createStore(sectionConfig),
        ]);
      }

      if (
        appModelStoreCreated instanceof Action2Error ||
        appDataStoreCreated instanceof Action2Error ||
        optionalStoresCreated.some(([, result]) => result instanceof Action2Error)
      ) {
        return new Action2Error(
          "FailedToCreateStore",
          [
            appModelStoreCreated instanceof Action2Error ? appModelStoreCreated.errorMessage : "model store created OK",
            appDataStoreCreated instanceof Action2Error ? appDataStoreCreated.errorMessage : "data store created OK",
            ...optionalStoresCreated.map(([section, result]) =>
              result instanceof Action2Error ? result.errorMessage : section + " store created OK",
            ),
          ].join(" --- "),
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
            action.actionType + " applicationDeploymentMap keys: " + JSON.stringify(Object.keys(applicationDeploymentMap))
        );
      }

      const localAppPersistenceStoreController =
        persistenceStoreControllerManager.getPersistenceStoreController(deploymentUuid);
      if (!localAppPersistenceStoreController) {
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
      );
      const appModelStoreDeleted: Action2ReturnType =
        await localAppPersistenceStoreController.deleteStore(action.payload.configuration.model);
      log.info(
        "storeActionOrBundleActionStoreRunner deleteStore for application",
        action.payload.application,
        "deployment",
        deploymentUuid,
        "appModelStoreDeleted",
        appModelStoreDeleted
      );
      
      const appDataStoreDeleted: Action2ReturnType =
        await localAppPersistenceStoreController.deleteStore(action.payload.configuration.data);
      log.info(
        "storeActionOrBundleActionStoreRunner deleteStore for application",
        action.payload.application,
        "deployment",
        deploymentUuid,
        "appDataStoreDeleted",
        appDataStoreDeleted
      );
      // optional sections (#232 modelVersion, #647 devData): deleted only when configured
      const optionalStoresDeleted: [string, Action2ReturnType][] = [];
      for (const section of optionalApplicationSections) {
        const sectionConfig = action.payload.configuration[section];
        if (!sectionConfig) continue;
        const sectionStoreDeleted = await localAppPersistenceStoreController.deleteStore(sectionConfig);
        optionalStoresDeleted.push([section, sectionStoreDeleted]);
        log.info(
          "storeActionOrBundleActionStoreRunner deleteStore for application",
          action.payload.application,
          "deployment",
          deploymentUuid,
          section,
          "store deleted",
          sectionStoreDeleted
        );
      }
      const firstOptionalStoreDeletionError = optionalStoresDeleted.find(
        ([, result]) => result instanceof Action2Error,
      )?.[1] as Action2Error | undefined;
      if (
        appModelStoreDeleted instanceof Action2Error ||
        appDataStoreDeleted instanceof Action2Error ||
        firstOptionalStoreDeletionError
      ) {
        return new Action2Error(
          "FailedToDeleteStore",
          [
            appModelStoreDeleted instanceof Action2Error ? appModelStoreDeleted.errorMessage : "model store deleted OK",
            appDataStoreDeleted instanceof Action2Error ? appDataStoreDeleted.errorMessage : "data store deleted OK",
            ...optionalStoresDeleted.map(([section, result]) =>
              result instanceof Action2Error ? result.errorMessage : section + " store deleted OK",
            ),
          ].join(" --- "),
            [], // errorStack,
          appModelStoreDeleted instanceof Action2Error
            ? appModelStoreDeleted
            : appDataStoreDeleted instanceof Action2Error
              ? appDataStoreDeleted
              : firstOptionalStoreDeletionError
        );
      }
      break;
    }
    case "storeManagementAction_openStore": {
      // log.info('storeActionOrBundleActionStoreRunner openStore',miroirConfig);

      // TODO: NOT CLEAN, IMPLEMENTATION-DEPENDENT, METHOD SHOULD BE INJECTED
      // TODO: addPersistenceStoreController takes deploymentUuid, not ApplicationSection as 1st parameter!
      if (!action.payload.configuration[deploymentUuid]) {
        log.error(
          "storeActionOrBundleActionStoreRunner openStore no configuration entry found for deployment uuid ",
          deploymentUuid,
          "configured deployments: ",
          JSON.stringify(Object.keys(action.payload.configuration)),
          "applicationDeploymentMap",
          JSON.stringify(applicationDeploymentMap, null, 2)
        );
        return new Action2Error(
          "FailedToOpenStore",
          "no configuration entry found for deployment uuid " +
            deploymentUuid,
            undefined, // errorStack
            undefined, // innerError
            { 
              configuredDeployments: Object.keys(action.payload.configuration),
              application: action.payload.application,
              applicationDeploymentMap
            } // errorContext
        );
      }

      await persistenceStoreControllerManager.deletePersistenceStoreController(deploymentUuid);
      const addResult = await persistenceStoreControllerManager.addPersistenceStoreController(
        deploymentUuid,
        action.payload.configuration[deploymentUuid]
      );

      if (addResult instanceof Action2Error) {
        log.error(
          "storeActionOrBundleActionStoreRunner openStore failed to add persistence store controller for deployment uuid ",
          deploymentUuid,
          "with error",
          addResult.errorMessage,
          "and context",
          addResult.errorContext
        );
        return addResult;
      }
      const localPersistenceStoreController = persistenceStoreControllerManager.getPersistenceStoreController(deploymentUuid);
      await localPersistenceStoreController?.open();
      log.info("storeActionOrBundleActionStoreRunner openStore for deployment", deploymentUuid, "opened! booting up...");

      await localPersistenceStoreController?.bootFromPersistedState(
        defaultMiroirMetaModel.entities,
        // defaultMiroirMetaModel.entityVersions
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
