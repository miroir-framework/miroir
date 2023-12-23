import { Uuid } from "../1_core/EntityDefinition";
import { StoreUnitConfiguration } from "../1_core/preprocessor-generated/miroirFundamentalType";
import { DataStoreApplicationType } from "../3_controllers/ApplicationControllerInterface";
import { IStoreController } from "./StoreControllerInterface";

export interface StoreControllerManagerInterface {
  addStoreController(
    // applicationName: string,
    // dataStoreType: DataStoreApplicationType,
    deploymentUuid: Uuid,
    config: StoreUnitConfiguration
  ): Promise<void>;

  getStoreControllers(): string[];
  getStoreController(deploymentUuid: Uuid): IStoreController | undefined;
  deleteStoreController(deploymentUuid: Uuid): Promise<void>;
}