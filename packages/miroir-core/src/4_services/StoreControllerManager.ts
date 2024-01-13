import { Uuid } from "../0_interfaces/1_core/EntityDefinition";
import {
  StoreDataSectionInterface,
  StoreModelSectionInterface,
  StoreControllerInterface,
  StoreSectionFactoryRegister,
  AdminStoreFactoryRegister,
} from "../0_interfaces/4-services/StoreControllerInterface";
import { StoreControllerManagerInterface } from "../0_interfaces/4-services/StoreControllerManagerInterface";
import { StoreController, storeSectionFactory } from "./StoreController";

import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { packageName } from "../constants";
import { getLoggerName } from "../tools";
import { MiroirLoggerFactory } from "./Logger";
import { cleanLevel } from "./constants";
import { StoreUnitConfiguration } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

const loggerName: string = getLoggerName(packageName, cleanLevel,"StoreControllerManager");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
  (value: LoggerInterface) => {
    log = value;
  }
);

// ################################################################################################
export class StoreControllerManager implements StoreControllerManagerInterface {
  private storeControllers:{ [deploymentUuid: Uuid]: StoreControllerInterface } = {};

  constructor(
    private adminStoreFactoryRegister:AdminStoreFactoryRegister,
    private storeSectionFactoryRegister:StoreSectionFactoryRegister,
  ) {
    
  }


  // ################################################################################################
  async addStoreController(
    deploymentUuid: string,
    config:StoreUnitConfiguration,
  ): Promise<void> {
    if (this.storeControllers[deploymentUuid]) {
      log.info("addStoreController for", deploymentUuid,"already exists, doing nothing!")
    } else {
      const adminStoreFactory = this.adminStoreFactoryRegister.get(JSON.stringify({storageType: config.admin.emulatedServerType}))
      if (!adminStoreFactory) {
        log.info("addStoreController no admin store factory found for", deploymentUuid, JSON.stringify(this.adminStoreFactoryRegister, undefined, 2));
        throw new Error("addStoreController no admin store factory found for server type " + config.admin.emulatedServerType);
      }
      const adminStore = await adminStoreFactory(config.admin)
      const dataStore = (await storeSectionFactory(
        this.storeSectionFactoryRegister,
        "data",
        config.data
      )) as StoreDataSectionInterface;
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
  };


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
      log.info("deleteStoreController for", deploymentUuid,"does not exist, doing nothing!")
    }
  }

}