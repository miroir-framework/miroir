import { entityEntity } from "src/index.js";
import { InstanceCollection } from "../0_interfaces/1_core/Instance.js";
import { DomainAction, DomainDataAction, DomainModelAction } from "../0_interfaces/2_domain/DomainControllerInterface.js";
import { LocalAndRemoteControllerInterface } from "../0_interfaces/3_controllers/LocalAndRemoteControllerInterface.js";
import { MiroirContextInterface } from "../0_interfaces/3_controllers/MiroirContextInterface.js";
import {
  LocalCacheInfo,
  LocalCacheInterface
} from "../0_interfaces/4-services/localCache/LocalCacheInterface.js";
import {
  RemoteDataStoreInterface,
  RemoteStoreCRUDAction,
  RemoteStoreCRUDActionReturnType,
  RemoteStoreModelAction
} from "../0_interfaces/4-services/remoteStore/RemoteDataStoreInterface.js";
import { throwExceptionIfError } from "./ErrorUtils.js";

export default {};

/**
 * controller should allow configuration of local storage / external storage balance.
 * when data is fetched / purged from local storage.
 * allow monitoring of local storage resources.
 */
export class LocalAndRemoteController implements LocalAndRemoteControllerInterface {
  constructor(
    private miroirContext: MiroirContextInterface,
    private localCache: LocalCacheInterface,
    private remoteStore: RemoteDataStoreInterface
  ) {}

  //####################################################################################
  public async handleLocalCacheModelAction(action: DomainModelAction) {
    return this.localCache.handleLocalCacheModelAction(action);
  }

  //####################################################################################
  public async handleLocalCacheDataAction(action: DomainDataAction) {
    return this.localCache.handleLocalCacheDataAction(action);
  }

  //####################################################################################
  public async handleLocalCacheAction(action: DomainAction) {
    return this.localCache.handleLocalCacheAction(action);
  }

  //####################################################################################
  public async handleRemoteStoreCRUDAction(action: RemoteStoreCRUDAction): Promise<RemoteStoreCRUDActionReturnType> {
    return this.remoteStore.handleRemoteStoreCRUDAction(action);
  }

  //####################################################################################
  public async handleRemoteStoreModelAction(action: RemoteStoreModelAction): Promise<RemoteStoreCRUDActionReturnType> {
    return this.remoteStore.handleRemoteStoreModelAction(action);
  }

  //####################################################################################
  /**
   * .
   * @returns the content of the current local cache transaction, not typed so as not to impose any implementation details
   */
  currentLocalCacheTransaction(): DomainModelAction[] {
    return this.localCache.currentTransaction();
  }

  //####################################################################################
  /**
   * .
   * @returns the stats about the current local cache.
   */
  currentLocalCacheInfo(): LocalCacheInfo {
    return this.localCache.currentInfo();
  }

  //####################################################################################
  /**
   * performs remote update before local update, so that whenever remote update fails, local value is not modified (going into the "catch").
   * @returns undefined when loading is finished
   */
  public async loadConfigurationFromRemoteDataStore(): Promise<void> {
    try {
      const entities: InstanceCollection = (
        await throwExceptionIfError(
          this.miroirContext.errorLogService,
          this.remoteStore.handleRemoteStoreCRUDAction,
          this.remoteStore,
          {
            actionName: "read",
            entityName: entityEntity.name,
            entityUuid: entityEntity.uuid,
          }
        )
      )[0];
      console.log("LocalAndRemoteController loadConfigurationFromRemoteDataStore found entities", entities);

      let instances: InstanceCollection[] = []; //TODO: replace with functional implementation
      for (const e of entities.instances) {
        // makes sequetial calls to interface. Make parallel calls instead using Promise.all?
        console.log("LocalAndRemoteController loadConfigurationFromRemoteDataStore loading instances for entity", e["name"]);
        const entityInstances: InstanceCollection[] = await throwExceptionIfError(
          this.miroirContext.errorLogService,
          this.remoteStore.handleRemoteStoreCRUDAction,
          this.remoteStore,
          {
            actionName: "read",
            entityName: e["name"],
            entityUuid: e['uuid'],
          }
        );
        console.log(
          "LocalAndRemoteController loadConfigurationFromRemoteDataStore found instances for entity",
          e["name"],
          entityInstances
        );
        instances.push(entityInstances[0]);
      }

      console.log("LocalAndRemoteController loadConfigurationFromRemoteDataStore instances", instances);
      this.localCache.handleLocalCacheModelAction({
        actionName: "replace",
        actionType: "DomainModelAction",
        objects: instances,
      });
      return Promise.resolve();
    } catch (error) {
      console.warn("LocalAndRemoteController loadConfigurationFromRemoteDataStore", error);
    }
  }
}
