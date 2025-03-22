import { Uuid } from "../1_core/EntityDefinition";
import { StoreUnitConfiguration } from "../1_core/preprocessor-generated/miroirFundamentalType";
import { DomainControllerInterface } from "../2_domain/DomainControllerInterface";
import { Action2ReturnType } from "../2_domain/DomainElement";
import { LocalCacheInterface } from "./LocalCacheInterface";
import { PersistenceStoreLocalOrRemoteInterface } from "./PersistenceInterface";
import { InitApplicationParameters, PersistenceStoreControllerInterface } from "./PersistenceStoreControllerInterface";

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