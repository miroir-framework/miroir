import { Uuid } from "../1_core/EntityDefinition.js";
import { ActionReturnType, StoreUnitConfiguration } from "../1_core/preprocessor-generated/miroirFundamentalType.js";
import { DomainControllerInterface } from "../2_domain/DomainControllerInterface.js";
import { LocalCacheInterface } from "./LocalCacheInterface.js";
import { PersistenceStoreLocalOrRemoteInterface } from "./PersistenceInterface.js";
import { InitApplicationParameters, PersistenceStoreControllerInterface } from "./PersistenceStoreControllerInterface.js";


export interface PersistenceStoreControllerManagerInterface {
  addPersistenceStoreController(
    deploymentUuid: Uuid,
    config: StoreUnitConfiguration
  ): Promise<void>;

  // getReduxStore(): LocalCacheInterface;
  getPersistenceStoreLocalOrRemote(): PersistenceStoreLocalOrRemoteInterface;
  setPersistenceStoreLocalOrRemote(p: PersistenceStoreLocalOrRemoteInterface):void;
  getLocalCache(): LocalCacheInterface;
  setLocalCache(l: LocalCacheInterface):void ;
  getServerDomainController(): DomainControllerInterface;

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