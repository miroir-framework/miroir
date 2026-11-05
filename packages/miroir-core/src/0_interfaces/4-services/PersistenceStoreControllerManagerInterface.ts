import { Uuid } from "../1_core/EntityVersion";
import { StoreUnitConfiguration } from "../1_core/preprocessor-generated/miroirFundamentalType";
import { DomainControllerInterface } from "../2_domain/DomainControllerInterface";
import { Action2ReturnType, type Action2VoidReturnType } from "../2_domain/DomainElement";
import { LocalCacheInterface } from "./LocalCacheInterface";
import { PersistenceStoreLocalOrRemoteInterface } from "./PersistenceInterface";
import { InitApplicationParameters, PersistenceStoreControllerInterface } from "./PersistenceStoreControllerInterface";

/**
 * handles many persistence store controllers, that can be added / removed dynamically at runtime.
 * @public
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
  /** #679: the configuration a deployment's store controller was opened with, while it is open. */
  getPersistenceStoreConfiguration?(deploymentUuid: Uuid): StoreUnitConfiguration | undefined;
  /** #679: the root that relative filesystem section directories resolve against. */
  readonly filesystemDeploymentRootDirectory?: string | undefined;

  addPersistenceStoreController(
    deploymentUuid: Uuid,
    config: StoreUnitConfiguration,
  ): Promise<Action2VoidReturnType>;
  deletePersistenceStoreController(deploymentUuid: Uuid): Promise<Action2VoidReturnType>;

  deployModule(
    adminPersistenceStoreController: PersistenceStoreControllerInterface,
    newMiroirDeploymentUuid: Uuid,
    storeUnitConfiguration: StoreUnitConfiguration,
    initApplicationParameters: InitApplicationParameters,
  ): Promise<Action2ReturnType>;
}