import { Uuid } from "../1_core/EntityDefinition";
import { ActionReturnType, StoreSectionConfiguration, StoreUnitConfiguration } from "../1_core/preprocessor-generated/miroirFundamentalType";
import { DataStoreApplicationType } from "../3_controllers/ApplicationControllerInterface";
import { LocalCacheInterface } from "./LocalCacheInterface";
import { PersistenceInterface, StoreInterface } from "./PersistenceInterface";
import { InitApplicationParameters, StoreControllerInterface } from "./StoreControllerInterface";


export interface StoreControllerManagerInterface {
  addStoreController(
    deploymentUuid: Uuid,
    config: StoreUnitConfiguration
  ): Promise<void>;

  // getReduxStore(): LocalCacheInterface;
  getPersistenceStore(): PersistenceInterface;
  getStoreControllers(): string[];
  getStoreController(deploymentUuid: Uuid): StoreControllerInterface | undefined;
  deleteStoreController(deploymentUuid: Uuid): Promise<void>;

  deployModule(
    adminStoreController: StoreControllerInterface,
    newMiroirDeploymentUuid: Uuid,
    // storeSectionConfiguration: StoreSectionConfiguration,
    storeUnitConfiguration: StoreUnitConfiguration,
    initApplicationParameters: InitApplicationParameters,
  ): Promise<ActionReturnType>;
}