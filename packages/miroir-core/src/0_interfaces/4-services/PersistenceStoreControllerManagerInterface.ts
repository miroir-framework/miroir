import { Uuid } from "../1_core/EntityDefinition.js";
import { StoreUnitConfiguration } from "../1_core/preprocessor-generated/miroirFundamentalType.js";
import { DomainControllerInterface } from "../2_domain/DomainControllerInterface.js";
import { Action2ReturnType } from "../2_domain/DomainElement.js";
import { LocalCacheInterface } from "./LocalCacheInterface.js";
import { PersistenceStoreLocalOrRemoteInterface } from "./PersistenceInterface.js";
import { InitApplicationParameters, PersistenceStoreControllerInterface } from "./PersistenceStoreControllerInterface.js";

/**
 * handles many persistence store controllers, that can be added / removed dynamically at runtime.
 */
export interface PersistenceStoreControllerManagerInterface {

  // TODO: remove these getters and setters, only there to circumvent technical difficulties
  getPersistenceStoreLocalOrRemote(): PersistenceStoreLocalOrRemoteInterface;
  setPersistenceStoreLocalOrRemote(p: PersistenceStoreLocalOrRemoteInterface):void;
  getLocalCache(): LocalCacheInterface;
  setLocalCache(l: LocalCacheInterface):void ;
  getServerDomainControllerDEFUNCT(): DomainControllerInterface;

  // PersistenceStoreController-related functionalities
  getPersistenceStoreControllers(): string[];
  getPersistenceStoreController(deploymentUuid: Uuid): PersistenceStoreControllerInterface | undefined;

  addPersistenceStoreController(
    deploymentUuid: Uuid,
    config: StoreUnitConfiguration
  ): Promise<void>;
  deletePersistenceStoreController(deploymentUuid: Uuid): Promise<void>;

  deployModule(
    adminPersistenceStoreController: PersistenceStoreControllerInterface,
    newMiroirDeploymentUuid: Uuid,
    storeUnitConfiguration: StoreUnitConfiguration,
    initApplicationParameters: InitApplicationParameters,
  ): Promise<Action2ReturnType>;
}