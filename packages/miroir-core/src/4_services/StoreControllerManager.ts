import { Uuid } from "../0_interfaces/1_core/EntityDefinition";
import {
  AdminStoreFactoryRegister,
  InitApplicationParameters,
  StoreControllerInterface,
  StoreDataSectionInterface,
  StoreModelSectionInterface,
  StoreSectionFactoryRegister,
} from "../0_interfaces/4-services/StoreControllerInterface";
import { StoreControllerManagerInterface } from "../0_interfaces/4-services/StoreControllerManagerInterface";
import { StoreController, storeSectionFactory } from "./StoreController";

import { ActionReturnType, ActionVoidReturnType, StoreUnitConfiguration } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { packageName } from "../constants";
import { getLoggerName } from "../tools";
import { MiroirLoggerFactory } from "./Logger";
import { cleanLevel } from "./constants";
import { ACTION_OK } from "../1_core/constants";

const loggerName: string = getLoggerName(packageName, cleanLevel,"StoreControllerManager");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
  (value: LoggerInterface) => {
    log = value;
  }
);

// ################################################################################################
export class StoreControllerManager implements StoreControllerManagerInterface {
  private storeControllers: { [deploymentUuid: Uuid]: StoreControllerInterface } = {};

  constructor(
    private adminStoreFactoryRegister: AdminStoreFactoryRegister,
    private storeSectionFactoryRegister: StoreSectionFactoryRegister
  ) {}

  // ################################################################################################
  async addStoreController(deploymentUuid: string, config: StoreUnitConfiguration): Promise<void> {
    log.info("addStoreController", deploymentUuid, config);
    if (this.storeControllers[deploymentUuid]) {
      log.info("addStoreController for", deploymentUuid, "already exists, doing nothing!");
    } else {
      const adminStoreFactory = this.adminStoreFactoryRegister.get(
        JSON.stringify({ storageType: config.admin.emulatedServerType })
      );
      if (!adminStoreFactory) {
        log.info(
          "addStoreController no admin store factory found for",
          deploymentUuid,
          JSON.stringify(this.adminStoreFactoryRegister, undefined, 2)
        );
        throw new Error(
          "addStoreController no admin store factory found for server type " + config.admin.emulatedServerType
        );
      }
      const adminStore = await adminStoreFactory(config.admin);
      const dataStore = (await storeSectionFactory(
        this.storeSectionFactoryRegister,
        "data",
        config.data
      )) as StoreDataSectionInterface;
      log.info("addStoreController found dataStore", dataStore)
      const modelStore = (await storeSectionFactory(
        this.storeSectionFactoryRegister,
        "model",
        config.model,
        dataStore
      )) as StoreModelSectionInterface;
      this.storeControllers[deploymentUuid] = new StoreController(adminStore, modelStore, dataStore);
    }
  }

  // ################################################################################################
  getStoreControllers(): string[] {
    return Object.keys(this.storeControllers);
  }

  // ################################################################################################
  getStoreController(deploymentUuid: string): StoreControllerInterface | undefined {
    return this.storeControllers[deploymentUuid];
  }

  // ################################################################################################
  async deleteStoreController(deploymentUuid: string): Promise<void> {
    if (this.storeControllers[deploymentUuid]) {
      await this.storeControllers[deploymentUuid].close();
      delete this.storeControllers[deploymentUuid];
    } else {
      log.info("deleteStoreController for", deploymentUuid, "does not exist, doing nothing!");
    }
  }

  // ################################################################################################
  async deployModule(
    adminStoreController: StoreControllerInterface,
    newDeploymentUuid: Uuid,
    storeUnitConfiguration: StoreUnitConfiguration,
    initApplicationParameters: InitApplicationParameters,
  ): Promise<ActionVoidReturnType> {
    // await adminStoreController.deleteStore(storeUnitConfiguration.admin);
    // await adminStoreController.createStore(storeUnitConfiguration.admin);
    await this.addStoreController(
      newDeploymentUuid,
      storeUnitConfiguration
    );
    const testLocalMiroirStoreController: StoreControllerInterface | undefined = this.getStoreController(newDeploymentUuid);

    if (testLocalMiroirStoreController) {
      await testLocalMiroirStoreController.clear();
      try {
        console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ deployModule initApplication',initApplicationParameters.dataStoreType,"START");
        await testLocalMiroirStoreController.initApplication(
          initApplicationParameters.metaModel,
          initApplicationParameters.dataStoreType,
          initApplicationParameters.application,
          initApplicationParameters.applicationDeploymentConfiguration,
          initApplicationParameters.applicationModelBranch,
          initApplicationParameters.applicationVersion,
          initApplicationParameters.applicationStoreBasedConfiguration
        );
        console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ deployModule initApplication',initApplicationParameters.dataStoreType,"END");
      } catch (error) {
        console.error('could not initApplication for',initApplicationParameters.dataStoreType,"datastore, can not go further!");
        throw(error);
      }

    } else { // TODO: inject interface to raise errors!
      // throw new Error("deployModule could not find storeController for " + newDeploymentUuid);
      return { status: "error", error: { errorType: "FailedToDeployModule" } }
    }
    return ACTION_OK
  }
}