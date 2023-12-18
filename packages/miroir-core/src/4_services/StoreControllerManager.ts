import { Uuid } from "../0_interfaces/1_core/EntityDefinition";
import { EmulatedPartitionedServerConfig, MiroirConfig } from "../0_interfaces/1_core/MiroirConfig";
import { DataStoreApplicationType } from "../0_interfaces/3_controllers/ApplicationControllerInterface";
import { IDataSectionStore, IModelSectionStore, IStoreController } from "../0_interfaces/4-services/StoreControllerInterface";
import { StoreControllerManagerInterface } from "../0_interfaces/4-services/StoreControllerManagerInterface";
import { defaultMiroirMetaModel } from "../1_core/Model";
import { StoreFactoryRegister } from "../3_controllers/ConfigurationService";
import { StoreController, storeFactory } from "./StoreController";

import applicationDeploymentMiroir from "../assets/miroir_data/35c5608a-7678-4f07-a4ec-76fc5bc35424/10ff36f2-50a3-48d8-b80f-e48e5d13af8e.json";
import { applicationDeploymentLibrary } from "../ApplicationDeploymentLibrary";

// ################################################################################################
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