import { Uuid } from "../1_core/EntityDefinition";
import { EmulatedPartitionedServerConfig } from "../1_core/MiroirConfig";
import { DataStoreApplicationType } from "../3_controllers/ApplicationControllerInterface";
import { IStoreController } from "./StoreControllerInterface";

export interface StoreControllerManagerInterface {
  addStoreController(
    applicationName: string,
    dataStoreType: DataStoreApplicationType,
    deploymentUuid: Uuid,
    config: EmulatedPartitionedServerConfig
  ): void;
  getStoreController(deploymentUuid: Uuid): IStoreController | undefined;
}