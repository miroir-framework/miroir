import { Uuid } from "../1_core/EntityDefinition";
import { ActionReturnType, StoreUnitConfiguration } from "../1_core/preprocessor-generated/miroirFundamentalType";
import { DomainControllerInterface } from "../2_domain/DomainControllerInterface";
import { LocalCacheInterface } from "./LocalCacheInterface";
import { PersistenceInterface } from "./PersistenceInterface";
import { InitApplicationParameters, PersistenceStoreControllerInterface } from "./PersistenceStoreControllerInterface";


export interface PersistenceStoreControllerManagerInterface {
  addPersistenceStoreController(
    deploymentUuid: Uuid,
    config: StoreUnitConfiguration
  ): Promise<void>;

  // getReduxStore(): LocalCacheInterface;
  getPersistenceStore(): PersistenceInterface;
  getLocalCache(): LocalCacheInterface;
  getDomainController(): DomainControllerInterface;

  getPersistenceStoreControllers(): string[];
  getPersistenceStoreController(deploymentUuid: Uuid): PersistenceStoreControllerInterface | undefined;
  deletePersistenceStoreController(deploymentUuid: Uuid): Promise<void>;

  deployModule(
    adminPersistenceStoreController: PersistenceStoreControllerInterface,
    newMiroirDeploymentUuid: Uuid,
    // storeSectionConfiguration: StoreSectionConfiguration,
    storeUnitConfiguration: StoreUnitConfiguration,
    initApplicationParameters: InitApplicationParameters,
  ): Promise<ActionReturnType>;
}