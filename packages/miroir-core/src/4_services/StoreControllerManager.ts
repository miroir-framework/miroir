import { Uuid } from "../0_interfaces/1_core/EntityDefinition";
import { EmulatedPartitionedServerConfig } from "../0_interfaces/1_core/MiroirConfig";
import { DataStoreApplicationType } from "../0_interfaces/3_controllers/ApplicationControllerInterface";
import { IDataSectionStore, IModelSectionStore, IStoreController } from "../0_interfaces/4-services/StoreControllerInterface";
import { StoreControllerManagerInterface } from "../0_interfaces/4-services/StoreControllerManagerInterface";
import { StoreFactoryRegister } from "../3_controllers/ConfigurationService";
import { StoreController, storeFactory } from "./StoreController";

export class StoreControllerManager implements StoreControllerManagerInterface {
  // private storeControllers:{ [deploymentUuid: Uuid]: { [section in ApplicationSection]: IStoreController} } = {};
  private storeControllers:{ [deploymentUuid: Uuid]: IStoreController } = {};

  constructor(
    private storeFactoryRegister:StoreFactoryRegister,
  ) {
    
  }

  async addStoreController(
    applicationName: string,
    dataStoreType: DataStoreApplicationType,
    deploymentUuid: string,
    config:EmulatedPartitionedServerConfig,
  ): Promise<void> {
    const dataStore = (await storeFactory(
      this.storeFactoryRegister,
      applicationName,
      dataStoreType,
      "data",
      config.data
    )) as IDataSectionStore;
    const modelStore = (await storeFactory(
      this.storeFactoryRegister,
      applicationName,
      dataStoreType,
      "model",
      config.model,
      dataStore
    )) as IModelSectionStore;
    this.storeControllers[deploymentUuid] = new StoreController(applicationName, dataStoreType, modelStore, dataStore);
  }

  getStoreController(deploymentUuid: string): IStoreController | undefined {
    return this.storeControllers[deploymentUuid];
  }
}