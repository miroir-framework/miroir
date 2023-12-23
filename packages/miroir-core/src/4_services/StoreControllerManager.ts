import { Uuid } from "../0_interfaces/1_core/EntityDefinition";
import { IDataStoreSection, IModelStoreSection, IStoreController, StoreSectionFactoryRegister } from "../0_interfaces/4-services/StoreControllerInterface";
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
  private storeControllers:{ [deploymentUuid: Uuid]: IStoreController } = {};

  constructor(
    private StoreSectionFactoryRegister:StoreSectionFactoryRegister,
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
      const dataStore = (await storeSectionFactory(
        this.StoreSectionFactoryRegister,
        "data",
        config.data
      )) as IDataStoreSection;
      const modelStore = (await storeSectionFactory(
        this.StoreSectionFactoryRegister,
        "model",
        config.model,
        dataStore
      )) as IModelStoreSection;
      this.storeControllers[deploymentUuid] = new StoreController(modelStore, dataStore);
    }
  }

  // ################################################################################################
  getStoreControllers(): string[] {
    return Object.keys(this.storeControllers);
  };


  // ################################################################################################
  getStoreController(deploymentUuid: string): IStoreController | undefined {
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